// Monta a abertura (capa + carta) no padrão A3Data a partir de uma proposta anterior da A3Data.
//
//   node montar-abertura.mjs template <proposta-anterior.pptx> [saida=templates/abertura-template.pptx]
//        Mantém só os slides 1 (capa) e 2 (carta), troca tudo que era do cliente anterior por {{PLACEHOLDERS}}
//        e remove o logo do cliente anterior. O resultado não contém conteúdo do cliente anterior.
//   node montar-abertura.mjs preencher <valores.json> [saida=saida/abertura.pptx]
//        Preenche os placeholders a partir de um JSON (ver valores-exemplo.json).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const px = 9525; // EMU por pixel na grade 1920 x 1080 do deck (20 x 11,25 pol)

// ---------- utilidades de pacote ----------
const norm = (p) => path.posix.normalize(p);
const relDir = (relPath) => path.posix.dirname(path.posix.dirname(relPath)); // pasta da parte dona do .rels
const parts = (zip) => Object.keys(zip.files).filter((n) => !zip.files[n].dir);

async function lerRels(zip, relPath) {
  const txt = await zip.file(relPath).async('string');
  return [...txt.matchAll(/<Relationship\b[^>]*\/>/g)].map((m) => {
    const raw = m[0];
    return {
      raw,
      id: raw.match(/\bId="([^"]+)"/)[1],
      target: raw.match(/\bTarget="([^"]+)"/)[1],
      external: /TargetMode="External"/.test(raw),
      type: raw.match(/\bType="([^"]+)"/)?.[1],
    };
  });
}
const resolver = (relPath, target) => norm(path.posix.join(relDir(relPath), target));

async function verificar(zip) {
  const erros = [];
  const nomes = new Set(parts(zip));
  for (const rp of nomes) {
    if (!rp.endsWith('.rels')) continue;
    for (const r of await lerRels(zip, rp)) {
      if (r.external) continue;
      const alvo = r.target.startsWith('/') ? r.target.slice(1) : resolver(rp, r.target);
      if (!nomes.has(alvo)) erros.push(`${rp}: alvo inexistente ${alvo}`);
    }
  }
  const ct = await zip.file('[Content_Types].xml').async('string');
  for (const m of ct.matchAll(/<Override [^>]*PartName="([^"]+)"/g)) {
    if (!nomes.has(m[1].slice(1))) erros.push(`[Content_Types]: parte inexistente ${m[1]}`);
  }
  return erros;
}

// ---------- criação do template ----------
async function criarTemplate(origem, destino) {
  const zip = await JSZip.loadAsync(fs.readFileSync(origem));
  let pres = await zip.file('ppt/presentation.xml').async('string');
  const presRelsPath = 'ppt/_rels/presentation.xml.rels';
  const presRels = await lerRels(zip, presRelsPath);

  const slideRels = presRels.filter((r) => /^slides\/slide\d+\.xml$/.test(r.target));
  const manter = new Set(['slides/slide1.xml', 'slides/slide2.xml']);
  const remover = slideRels.filter((r) => !manter.has(r.target));
  const idsRemover = new Set(remover.map((r) => r.id));

  pres = pres.replace(/<p:sldId\b[^>]*r:id="([^"]+)"[^>]*\/>/g, (m, id) => (idsRemover.has(id) ? '' : m));
  zip.file('ppt/presentation.xml', pres);
  let presRelsTxt = await zip.file(presRelsPath).async('string');
  for (const r of remover) presRelsTxt = presRelsTxt.replace(r.raw, '');
  zip.file(presRelsPath, presRelsTxt);

  const apagar = new Set();
  for (const r of remover) {
    const slide = `ppt/${r.target}`;
    const rels = `ppt/slides/_rels/${path.posix.basename(r.target)}.rels`;
    apagar.add(slide);
    if (zip.file(rels)) {
      for (const sr of await lerRels(zip, rels)) {
        if (/notesSlide/.test(sr.type || '')) {
          const n = resolver(rels, sr.target);
          apagar.add(n);
          apagar.add(`ppt/notesSlides/_rels/${path.posix.basename(n)}.rels`);
        }
      }
      apagar.add(rels);
    }
  }
  // o slide mantido pode ter seus próprios notesSlides: ficam
  let ct = await zip.file('[Content_Types].xml').async('string');
  for (const a of apagar) {
    zip.remove(a);
    ct = ct.replace(new RegExp(`<Override [^>]*PartName="/${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*/>`), '');
  }
  zip.file('[Content_Types].xml', ct);

  // ---- slide 1 (capa) e slide 2 (carta)
  const trocarRun = (xml, contem, novo) => {
    const re = new RegExp(`<a:t>([^<]*${contem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*)</a:t>`, 'g');
    if (!re.test(xml)) throw new Error('run não encontrado: ' + contem);
    return xml.replace(re, `<a:t>${novo}</a:t>`);
  };
  let s1 = await zip.file('ppt/slides/slide1.xml').async('string');
  s1 = s1.replace(/DIRECIONAL/g, '{{CLIENTE}}');
  s1 = trocarRun(s1, 'Inteligência de Precificação', '{{NOME_DA_INICIATIVA}}');
  s1 = trocarRun(s1, 'Assessment de Dados + POC', '{{FRENTE_OU_ESCOPO}}');

  // logo do cliente anterior vira caixa tracejada [LOGO DO CLIENTE]
  const picRe = /<p:pic>(?:(?!<\/p:pic>)[\s\S])*?name="Google Shape;123;p27"[\s\S]*?<\/p:pic>/;
  const pic = s1.match(picRe)?.[0];
  if (!pic) throw new Error('logo do cliente (Google Shape;123) não encontrado na capa');
  const off = pic.match(/<a:off x="(\d+)" y="(\d+)"\/>/);
  const ext = pic.match(/<a:ext cx="(\d+)" cy="(\d+)"\/>/);
  const rid = pic.match(/r:embed="([^"]+)"/)[1];
  const caixa = `<p:sp><p:nvSpPr><p:cNvPr id="2000" name="LOGO DO CLIENTE"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${off[1]}" y="${off[2]}"/><a:ext cx="${ext[1]}" cy="${ext[2]}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:srgbClr val="8A8A8A"/></a:solidFill><a:prstDash val="dash"/></a:ln></p:spPr><p:txBody><a:bodyPr anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="pt-BR" sz="1100" b="1"><a:solidFill><a:srgbClr val="8A8A8A"/></a:solidFill><a:latin typeface="Lato"/></a:rPr><a:t>[LOGO DO CLIENTE]</a:t></a:r></a:p></p:txBody></p:sp>`;
  s1 = s1.replace(picRe, () => caixa);
  zip.file('ppt/slides/slide1.xml', s1);
  let r1 = await zip.file('ppt/slides/_rels/slide1.xml.rels').async('string');
  r1 = r1.replace(new RegExp(`<Relationship\\b[^>]*Id="${rid}"[^>]*/>`), '');
  zip.file('ppt/slides/_rels/slide1.xml.rels', r1);

  let s2 = await zip.file('ppt/slides/slide2.xml').async('string');
  s2 = s2.replace(/DIRECIONAL/g, '{{CLIENTE}}');
  s2 = trocarRun(s2, '27 de Outubro de 2026', '{{DIA}} de {{MES}} de {{ANO}}');
  s2 = trocarRun(s2, 'Marcos Paulo Rodrigues', '{{CONTATO_CLIENTE}}');
  s2 = trocarRun(s2, 'uma base de dados confiável', '{{OBJETIVO_DA_PROPOSTA}}');
  s2 = trocarRun(s2, 'propomos duas frentes', '{{RESUMO_DA_SOLUCAO}}');
  s2 = trocarRun(s2, 'Marcelo Fantini', '{{NOME_ASSINANTE}}');
  s2 = trocarRun(s2, 'Chief Commercial Officer', '{{CARGO_ASSINANTE}}');
  // concordância: "confiança d[a] CLIENTE" e "ofertar [à] CLIENTE"
  s2 = s2.replace(/<a:t>a <\/a:t>((?:(?!<a:t>)[\s\S])*?<a:t>\{\{CLIENTE\}\}<\/a:t>)/, '<a:t>{{DA_DO}}</a:t>$1');
  s2 = s2.replace(/<a:t>à <\/a:t>((?:(?!<a:t>)[\s\S])*?<a:t>\{\{CLIENTE\}\}<\/a:t>)/, '<a:t>{{A_AO}}</a:t>$1');
  zip.file('ppt/slides/slide2.xml', s2);

  // ---- propriedades do documento
  for (const f of ['docProps/app.xml', 'docProps/core.xml']) {
    if (!zip.file(f)) continue;
    let x = await zip.file(f).async('string');
    x = x.replace(/<Slides>\d+<\/Slides>/, '<Slides>2</Slides>').replace(/<Notes>\d+<\/Notes>/, '<Notes>2</Notes>')
      .replace(/<HeadingPairs>[\s\S]*?<\/HeadingPairs>/, '').replace(/<TitlesOfParts>[\s\S]*?<\/TitlesOfParts>/, '')
      .replace(/<dc:title>[\s\S]*?<\/dc:title>/, '<dc:title>Proposta Técnica {{CLIENTE}}</dc:title>');
    zip.file(f, x);
  }

  // ---- mídia órfã (inclui o logo do cliente anterior e as fotos dos outros slides)
  const usados = new Set();
  for (const rp of parts(zip).filter((n) => n.endsWith('.rels'))) {
    for (const r of await lerRels(zip, rp)) if (!r.external) usados.add(r.target.startsWith('/') ? r.target.slice(1) : resolver(rp, r.target));
  }
  for (const n of parts(zip)) if (n.startsWith('ppt/media/') && !usados.has(n)) zip.remove(n);

  // ---- confere que nada do cliente anterior sobrou
  const vazamentos = [];
  for (const n of parts(zip)) {
    if (!/\.(xml|rels)$/.test(n)) continue;
    const t = await zip.file(n).async('string');
    for (const termo of ['DIRECIONAL', 'Direcional', 'Rodrigues', 'Fantini', 'Marcos Paulo', 'Precificação', 'Assessment']) {
      if (t.includes(termo)) vazamentos.push(`${n}: "${termo}"`);
    }
  }
  const erros = await verificar(zip);
  if (vazamentos.length || erros.length) {
    console.error('PROBLEMAS:\n' + [...vazamentos, ...erros].join('\n'));
    process.exit(2);
  }
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  console.log(`template gravado: ${destino} (${fs.statSync(destino).size} bytes)`);
}

// ---------- preenchimento ----------
const OBRIGATORIOS = ['CLIENTE', 'NOME_DA_INICIATIVA', 'FRENTE_OU_ESCOPO', 'DIA', 'MES', 'ANO', 'CONTATO_CLIENTE', 'OBJETIVO_DA_PROPOSTA', 'RESUMO_DA_SOLUCAO', 'NOME_ASSINANTE', 'CARGO_ASSINANTE'];

function pngTamanho(buf) { return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }; }

async function preencher(valoresPath, destino) {
  const v = JSON.parse(fs.readFileSync(valoresPath, 'utf8'));
  const faltando = OBRIGATORIOS.filter((k) => !v[k] || /^\s*$/.test(v[k]));
  if (faltando.length) { console.error('faltam valores: ' + faltando.join(', ')); process.exit(2); }
  const masculino = v.genero === 'm';
  const mapa = { ...v, CLIENTE: String(v.CLIENTE).toUpperCase(), DA_DO: masculino ? 'o ' : 'a ', A_AO: masculino ? 'ao ' : 'à ' };
  const tpl = path.join(path.dirname(fileURLToPath(import.meta.url)), 'templates', 'abertura-template.pptx');
  const zip = await JSZip.loadAsync(fs.readFileSync(tpl));
  for (const f of ['ppt/slides/slide1.xml', 'ppt/slides/slide2.xml', 'docProps/core.xml'].filter((n) => zip.file(n))) {
    let x = await zip.file(f).async('string');
    x = x.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => { if (!(k in mapa)) throw new Error('placeholder sem valor: ' + k); return esc(mapa[k]); });
    zip.file(f, x);
  }
  // logo do cliente (opcional): substitui a caixa tracejada
  if (v.LOGO_CLIENTE_PNG) {
    const buf = fs.readFileSync(v.LOGO_CLIENTE_PNG);
    const { w, h } = pngTamanho(buf);
    let s1 = await zip.file('ppt/slides/slide1.xml').async('string');
    const box = s1.match(/<p:sp>(?:(?!<\/p:sp>)[\s\S])*?name="LOGO DO CLIENTE"[\s\S]*?<\/p:sp>/)[0];
    const off = box.match(/<a:off x="(\d+)" y="(\d+)"\/>/);
    const ext = box.match(/<a:ext cx="(\d+)" cy="(\d+)"\/>/);
    // logo quadrado ou alto (ex.: símbolo + nome) ganha mais altura; logo largo mantém a altura da caixa
    const aspecto = w / h;
    const cy = aspecto < 2.5 ? 100 * px : Number(ext[2]);
    const cx = Math.round((cy * w) / h);
    off[2] = String(Math.round(Number(off[2]) + (Number(ext[2]) - cy) / 2));
    zip.file('ppt/media/logo-cliente.png', buf);
    let r1 = await zip.file('ppt/slides/_rels/slide1.xml.rels').async('string');
    r1 = r1.replace('</Relationships>', '<Relationship Id="rIdLogoCliente" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/logo-cliente.png"/></Relationships>');
    zip.file('ppt/slides/_rels/slide1.xml.rels', r1);
    const pic = `<p:pic><p:nvPicPr><p:cNvPr id="2001" name="Logo do cliente"/><p:cNvPicPr preferRelativeResize="0"/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rIdLogoCliente"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="${off[1]}" y="${off[2]}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
    s1 = s1.replace(box, () => pic);
    zip.file('ppt/slides/slide1.xml', s1);
    let ct = await zip.file('[Content_Types].xml').async('string');
    if (!/Extension="png"/i.test(ct)) ct = ct.replace('<Override', '<Default Extension="png" ContentType="image/png"/><Override');
    zip.file('[Content_Types].xml', ct);
  }
  // nada de {{ }} nem [LOGO DO CLIENTE] sobrando
  const sobras = [];
  for (const f of ['ppt/slides/slide1.xml', 'ppt/slides/slide2.xml', 'docProps/core.xml'].filter((n) => zip.file(n))) {
    const x = await zip.file(f).async('string');
    if (/\{\{|\}\}/.test(x)) sobras.push(`${f}: placeholder {{ }}`);
    if (x.includes('[LOGO DO CLIENTE]')) sobras.push(`${f}: caixa [LOGO DO CLIENTE] (informe LOGO_CLIENTE_PNG)`);
  }
  const erros = await verificar(zip);
  if (erros.length) { console.error('PROBLEMAS:\n' + erros.join('\n')); process.exit(2); }
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  console.log(`abertura gravada: ${destino}`);
  if (sobras.length) console.log('ATENÇÃO:\n  ' + sobras.join('\n  '));
}

const [, , cmd, a, b] = process.argv;
if (cmd === 'template') await criarTemplate(a, b || 'templates/abertura-template.pptx');
else if (cmd === 'preencher') await preencher(a, b || 'saida/abertura.pptx');
else console.log('uso: node montar-abertura.mjs template <proposta-anterior.pptx> | preencher <valores.json> [saida.pptx]');
