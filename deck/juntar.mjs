// Junta a abertura (capa + carta, do template) com os slides de conteúdo gerados pelo pptxgenjs.
// Uso: node juntar.mjs <abertura.pptx> <conteudo.pptx> <saida.pptx>
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

const [, , abPath, coPath, outPath] = process.argv;
if (!abPath || !coPath || !outPath) { console.log('uso: node juntar.mjs <abertura.pptx> <conteudo.pptx> <saida.pptx>'); process.exit(1); }

const norm = (p) => path.posix.normalize(p);
const parts = (zip) => Object.keys(zip.files).filter((n) => !zip.files[n].dir);
const txt = (zip, p) => zip.file(p).async('string');
async function lerRels(zip, relPath) {
  const t = await txt(zip, relPath);
  return [...t.matchAll(/<Relationship\b[^>]*\/>/g)].map((m) => ({
    raw: m[0], id: m[0].match(/\bId="([^"]+)"/)[1], target: m[0].match(/\bTarget="([^"]+)"/)[1],
    type: m[0].match(/\bType="([^"]+)"/)?.[1] || '', external: /TargetMode="External"/.test(m[0]) }));
}
const relDir = (relPath) => path.posix.dirname(path.posix.dirname(relPath));
async function verificar(zip) {
  const erros = []; const nomes = new Set(parts(zip));
  for (const rp of nomes) {
    if (!rp.endsWith('.rels')) continue;
    for (const r of await lerRels(zip, rp)) {
      if (r.external) continue;
      const alvo = r.target.startsWith('/') ? r.target.slice(1) : norm(path.posix.join(relDir(rp), r.target));
      if (!nomes.has(alvo)) erros.push(`${rp}: alvo inexistente ${alvo}`);
    }
  }
  const ct = await txt(zip, '[Content_Types].xml');
  for (const m of ct.matchAll(/<Override [^>]*PartName="([^"]+)"/g)) if (!nomes.has(m[1].slice(1))) erros.push(`[Content_Types]: parte inexistente ${m[1]}`);
  // toda parte de slide e de notas precisa de tipo declarado
  for (const n of nomes) if (/^ppt\/(slides|notesSlides)\/[^/]+\.xml$/.test(n) && !ct.includes(`PartName="/${n}"`)) erros.push(`[Content_Types]: sem tipo para ${n}`);
  return erros;
}

const base = await JSZip.loadAsync(fs.readFileSync(abPath));
const cont = await JSZip.loadAsync(fs.readFileSync(coPath));

// slides do conteúdo, na ordem da apresentação
const pres = await txt(cont, 'ppt/presentation.xml');
const presRels = await lerRels(cont, 'ppt/_rels/presentation.xml.rels');
const ordem = [...pres.matchAll(/<p:sldId\b[^>]*r:id="([^"]+)"/g)].map((m) => presRels.find((r) => r.id === m[1]).target);

// referências no pacote base
const baseSlides = parts(base).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).map((n) => Number(n.match(/slide(\d+)\.xml/)[1]));
let proximo = Math.max(...baseSlides);
const layoutBranco = parts(base).find((n) => /^ppt\/slideLayouts\/slideLayout13\.xml$/.test(n));
if (!layoutBranco) throw new Error('layout em branco (slideLayout13) não existe na abertura');
const notesMaster = parts(base).find((n) => /^ppt\/notesMasters\/notesMaster\d+\.xml$/.test(n));
if (!notesMaster) throw new Error('notesMaster não encontrado na abertura');

let basePres = await txt(base, 'ppt/presentation.xml');
let basePresRels = await txt(base, 'ppt/_rels/presentation.xml.rels');
let ct = await txt(base, '[Content_Types].xml');
const idsExistentes = [...basePres.matchAll(/<p:sldId\b[^>]*\bid="(\d+)"/g)].map((m) => Number(m[1]));
let proxId = Math.max(255, ...idsExistentes) + 1;
const defaults = new Set([...ct.matchAll(/<Default Extension="([^"]+)"/gi)].map((m) => m[1].toLowerCase()));
const tipoMidia = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', gif: 'image/gif' };

for (const alvo of ordem) {
  const antigo = norm(path.posix.join('ppt', alvo)); // ppt/slides/slideN.xml
  proximo++;
  const novo = `ppt/slides/slide${proximo}.xml`;
  let sx = await txt(cont, antigo);
  const relAntigo = `ppt/slides/_rels/${path.posix.basename(antigo)}.rels`;
  let novasRels = [];
  for (const r of await lerRels(cont, relAntigo)) {
    if (/slideLayout/.test(r.type)) {
      novasRels.push(r.raw.replace(/Target="[^"]+"/, `Target="../slideLayouts/${path.posix.basename(layoutBranco)}"`));
    } else if (/\/image$/.test(r.type)) {
      const orig = norm(path.posix.join('ppt/slides', r.target));
      const ext = path.posix.extname(orig).slice(1).toLowerCase();
      const nomeNovo = `ppt/media/c${proximo}_${path.posix.basename(orig)}`;
      base.file(nomeNovo, await cont.file(orig).async('nodebuffer'));
      if (!defaults.has(ext) && tipoMidia[ext]) { ct = ct.replace('<Override', `<Default Extension="${ext}" ContentType="${tipoMidia[ext]}"/><Override`); defaults.add(ext); }
      novasRels.push(r.raw.replace(/Target="[^"]+"/, `Target="../media/${path.posix.basename(nomeNovo)}"`));
    } else if (/notesSlide/.test(r.type)) {
      const origN = norm(path.posix.join('ppt/slides', r.target));
      const novoN = `ppt/notesSlides/notesSlide${proximo}.xml`;
      base.file(novoN, await txt(cont, origN));
      const relN = `ppt/notesSlides/_rels/${path.posix.basename(origN)}.rels`;
      let rn = await txt(cont, relN);
      rn = rn.replace(/Target="[^"]*notesMaster[^"]*"/, `Target="../notesMasters/${path.posix.basename(notesMaster)}"`)
        .replace(/Target="[^"]*slides\/slide[^"]*"/, `Target="../slides/slide${proximo}.xml"`);
      base.file(`ppt/notesSlides/_rels/notesSlide${proximo}.xml.rels`, rn);
      ct = ct.replace('</Types>', `<Override PartName="/${novoN}" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/></Types>`);
      novasRels.push(r.raw.replace(/Target="[^"]+"/, `Target="../notesSlides/notesSlide${proximo}.xml"`));
    } else {
      throw new Error('relacionamento não tratado: ' + r.type);
    }
  }
  base.file(novo, sx);
  base.file(`ppt/slides/_rels/slide${proximo}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${novasRels.join('')}</Relationships>`);
  ct = ct.replace('</Types>', `<Override PartName="/${novo}" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>`);
  const rid = `rIdConteudo${proximo}`;
  basePresRels = basePresRels.replace('</Relationships>', `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${proximo}.xml"/></Relationships>`);
  basePres = basePres.replace('</p:sldIdLst>', `<p:sldId id="${proxId++}" r:id="${rid}"/></p:sldIdLst>`);
}
base.file('ppt/presentation.xml', basePres);
base.file('ppt/_rels/presentation.xml.rels', basePresRels);
base.file('[Content_Types].xml', ct);
if (base.file('docProps/app.xml')) {
  let app = await txt(base, 'docProps/app.xml');
  app = app.replace(/<Slides>\d+<\/Slides>/, `<Slides>${proximo}</Slides>`).replace(/<Notes>\d+<\/Notes>/, `<Notes>${proximo}</Notes>`);
  base.file('docProps/app.xml', app);
}
const erros = await verificar(base);
if (erros.length) { console.error('PROBLEMAS:\n' + erros.join('\n')); process.exit(2); }
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, await base.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
console.log(`deck gravado: ${outPath} (${proximo} slides, ${fs.statSync(outPath).size} bytes)`);
