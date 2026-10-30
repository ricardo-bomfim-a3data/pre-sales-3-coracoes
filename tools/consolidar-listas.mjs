// Consolida as tabelas de questionamentos/lacunas dos documentos do squad em CSV e XLSX.
// Uso: node tools/consolidar-listas.mjs   (executar na raiz do projeto)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { crc32 } from 'node:zlib';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const SOURCES = [
  ['NEG', 'docs/06-requisitos-e-glossario.md'],
  ['ARQ', 'docs/01-arquitetura/arquitetura-proposta.md'],
  ['DAD', 'docs/07-metricas-e-consumo.md'],
  ['ENG', 'docs/01-arquitetura/critica-implementabilidade.md'],
  ['ESP', 'docs/08-revisao-especialista.md'],
];
const COLS = ['ID', 'Tipo', 'Área', 'Tema', 'Pergunta ou lacuna', 'Por que importa', 'Fonte', 'Bloqueante', 'Quando precisa', 'Responsável sugerido (cliente)', 'Hipótese de trabalho atual'];
const OUT_COLS = ['ID', 'Origem (papel)', 'Tipo', 'Área', 'Tema', 'Pergunta ou lacuna', 'Por que importa', 'Fonte', 'Bloqueante', 'Quando precisa', 'Responsável sugerido (cliente)', 'Hipótese de trabalho atual', 'Prioridade', 'Canal', 'Consolidado em', 'Status', 'Resposta do cliente'];
const WIDTHS = [12, 10, 16, 14, 22, 60, 45, 14, 11, 14, 24, 40, 10, 14, 14, 12, 30];

// Consolidação do ESP (docs/08-revisao-especialista.md, seção 3): absorvido → mantido
const ABSORVIDOS = {
  'ENG-Q02': 'ARQ-Q01', 'ENG-Q03': 'ARQ-Q03', 'ARQ-Q42': 'ARQ-Q03', 'ENG-Q01': 'ARQ-Q08',
  'ENG-Q04': 'ARQ-Q06', 'ENG-D09': 'ARQ-Q07', 'ARQ-Q10': 'ENG-Q06', 'ARQ-Q11': 'ENG-Q07', 'DAD-D16': 'ENG-Q07',
  'ENG-Q08': 'ARQ-Q12', 'DAD-D07': 'NEG-Q16', 'ARQ-Q13': 'NEG-Q17', 'ENG-Q09': 'NEG-Q17', 'DAD-Q09': 'NEG-Q17',
  'ENG-Q20': 'ARQ-D02', 'NEG-D13': 'ARQ-D02', 'DAD-D17': 'ARQ-D02', 'ARQ-D03': 'NEG-D11', 'ENG-D01': 'NEG-D11',
  'ARQ-Q16': 'NEG-Q33', 'ENG-Q15': 'NEG-Q33', 'DAD-Q25': 'NEG-Q33', 'ENG-Q10': 'ARQ-D05', 'NEG-D03': 'ARQ-D05', 'DAD-D15': 'ARQ-D05',
  'ARQ-Q22': 'NEG-Q04', 'ENG-Q12': 'NEG-Q04', 'DAD-Q05': 'NEG-Q04', 'ARQ-Q21': 'NEG-Q14', 'ENG-Q13': 'NEG-Q14', 'DAD-D03': 'NEG-Q14',
  'NEG-Q18': 'DAD-Q01', 'ARQ-D08': 'DAD-Q01', 'ARQ-Q36': 'NEG-Q11', 'ENG-D11': 'NEG-Q11', 'DAD-Q24': 'NEG-Q11', 'NEG-Q40': 'ENG-Q18',
  'ENG-Q14': 'ARQ-Q14', // coordenador: conta AWS perguntada duas vezes
};
// Itens encerrados por decisão (não são consolidação em outro ID): ID → motivo
const ENCERRADOS = { 'ARQ-Q47': 'Encerrada em 29/10/2026: Desenho 2 descartado' };
// Canal de tratamento (ESP seção 3.3). Padrão: Escrito.
const CANAL = {
  'ARQ-Q17': 'Interno A3/AWS', 'ARQ-Q29': 'Interno A3/AWS',
  'NEG-Q30': 'Conversa', 'NEG-Q31': 'Conversa', 'NEG-Q02': 'Conversa',
  'ENG-Q23': 'Interno A3', 'NEG-Q27': 'Interno A3',
  'ENG-Q17': 'Informar plano', 'NEG-Q25': 'Informar plano',
  'NEG-Q38': 'Reescrever', 'DAD-Q06': 'Reescrever',
};

function splitRow(line) {
  const cells = []; let cur = ''; let esc = false;
  for (const ch of line) {
    if (esc) { cur += ch; esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '|') { cells.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  cells.push(cur.trim());
  if (cells[0] === '') cells.shift();
  if (cells.length && cells[cells.length - 1] === '') cells.pop();
  return cells;
}
function parseTables(md) {
  const lines = md.split(/\r?\n/); const rows = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim().startsWith('|')) continue;
    const hdr = splitRow(lines[i]);
    if (hdr[0] !== 'ID' || hdr.length < 5) continue;
    const map = COLS.map(c => hdr.indexOf(c));
    i += 2; // linha separadora
    for (; i < lines.length && lines[i].trim().startsWith('|'); i++) {
      const c = splitRow(lines[i]);
      if (!/^(NEG|ARQ|DAD|ENG|ESP|QA)-[QD]\d+$/.test(c[0])) continue;
      rows.push(Object.fromEntries(COLS.map((k, j) => [k, map[j] >= 0 ? (c[map[j]] ?? '') : ''])));
    }
  }
  return rows;
}
const prio = r => (r.Bloqueante.toLowerCase().startsWith('s') ? 'P1' : /pré-contrato|kickoff/i.test(r['Quando precisa']) ? 'P2' : 'P3');
let all = [];
for (const [papel, rel] of SOURCES) {
  const p = resolve(ROOT, rel);
  if (!existsSync(p)) { console.error('ausente:', rel); continue; }
  const rows = parseTables(readFileSync(p, 'utf8')).map(r => ({
    ...r, 'Origem (papel)': papel, Prioridade: prio(r),
    Canal: CANAL[r.ID] ?? 'Escrito',
    'Consolidado em': ABSORVIDOS[r.ID] ?? ENCERRADOS[r.ID] ?? '—',
    Status: ABSORVIDOS[r.ID] ? 'Consolidado' : ENCERRADOS[r.ID] ? 'Encerrado' : 'Aberto',
    'Resposta do cliente': '',
  }));
  console.error(papel, rows.length, 'itens');
  all = all.concat(rows);
}
const ids = new Set(all.map(r => r.ID));
for (const [a, k] of Object.entries(ABSORVIDOS)) { if (!ids.has(a)) console.error('AVISO: absorvido inexistente', a); if (!ids.has(k)) console.error('AVISO: mantido inexistente', k); }
const ordem = { P1: 0, P2: 1, P3: 2 };
all.sort((a, b) => ordem[a.Prioridade] - ordem[b.Prioridade] || a.ID.localeCompare(b.ID));
const isQ = r => /^quest/i.test(r.Tipo);
const ativos = all.filter(r => r.Status === 'Aberto');
const paraCliente = ativos.filter(r => r.Canal === 'Escrito' && /pré-contrato/i.test(r['Quando precisa']));
console.error('ativos', ativos.length, '| pré-contrato por escrito', paraCliente.length);
const sets = {
  'Questionamentos': ativos.filter(isQ),
  'Detalhes faltantes': ativos.filter(r => !isQ(r)),
  'Pré-contrato (cliente)': paraCliente,
  'Lista completa': all,
};
// Aba de decisões pré-assinatura (tabela com cabeçalho "#" em docs/08)
function parseDecisoes(md) {
  const lines = md.split(/\r?\n/); const out = [];
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].trim().startsWith('|') ? splitRow(lines[i]) : null;
    if (!h || h[0] !== '#') continue;
    for (i += 2; i < lines.length && lines[i].trim().startsWith('|'); i++) { const c = splitRow(lines[i]); if (/^\d+$/.test(c[0])) out.push(Object.fromEntries(h.map((k, j) => [k, c[j] ?? '']))); }
  }
  return out;
}
const espPath = resolve(ROOT, 'docs/08-revisao-especialista.md');
const decisoes = existsSync(espPath) ? parseDecisoes(readFileSync(espPath, 'utf8')) : [];
const DEC_COLS = ['#', 'Decisão', 'Recomendação', 'Dono'];
const outDir = resolve(ROOT, 'docs/04-listas'); mkdirSync(outDir, { recursive: true });
const csvEsc = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
for (const [name, rows] of Object.entries(sets)) {
  const csv = '﻿' + [OUT_COLS, ...rows.map(r => OUT_COLS.map(c => r[c]))].map(r => r.map(csvEsc).join(',')).join('\r\n');
  writeFileSync(resolve(outDir, name.toLowerCase().replace(/ /g, '-') + '.csv'), csv);
}

// XLSX mínimo (OOXML, zip sem compressão)
const xml = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const colL = n => { let s = ''; n++; while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
function sheetXml(rows, cols = OUT_COLS, widths = WIDTHS) {
  const data = [cols, ...rows.map(r => cols.map(c => r[c]))];
  const colsXml = cols.map((_, i) => `<col min="${i + 1}" max="${i + 1}" width="${widths[i]}" customWidth="1"/>`).join('');
  const body = data.map((r, ri) => `<row r="${ri + 1}">` + r.map((v, ci) => `<c r="${colL(ci)}${ri + 1}" t="inlineStr" s="${ri === 0 ? 1 : 2}"><is><t xml:space="preserve">${xml(v)}</t></is></c>`).join('') + '</row>').join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${colsXml}</cols><sheetData>${body}</sheetData><autoFilter ref="A1:${colL(cols.length - 1)}${data.length}"/></worksheet>`;
}
const sheets = Object.entries(sets).map(([n, rows]) => [n, sheetXml(rows)]);
if (decisoes.length) {
  sheets.unshift(['Decisões pré-assinatura', sheetXml(decisoes, DEC_COLS, [5, 40, 80, 20])]);
  const csv = '﻿' + [DEC_COLS, ...decisoes.map(r => DEC_COLS.map(c => r[c]))].map(r => r.map(csvEsc).join(',')).join('\r\n');
  writeFileSync(resolve(outDir, 'decisoes-pre-assinatura.csv'), csv);
}
const names = sheets.map(s => s[0]);
const files = {
  '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${names.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`,
  '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((n, i) => `<sheet name="${xml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`,
  'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${names.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${names.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
  'xl/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F3864"/></patternFill></fill></fills><borders count="1"><border/></borders><cellXfs count="3"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"><alignment vertical="center" wrapText="1"/></xf><xf applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs></styleSheet>`,
};
sheets.forEach(([, x], i) => { files[`xl/worksheets/sheet${i + 1}.xml`] = x; });

function zip(entries) {
  const parts = []; const cd = []; let off = 0;
  for (const [name, content] of Object.entries(entries)) {
    const nb = Buffer.from(name), db = Buffer.from(content), crc = crc32(db);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(0, 8);
    lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0x21, 12); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(db.length, 18);
    lh.writeUInt32LE(db.length, 22); lh.writeUInt16LE(nb.length, 26); lh.writeUInt16LE(0, 28);
    parts.push(lh, nb, db);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(0, 10); ch.writeUInt16LE(0, 12); ch.writeUInt16LE(0x21, 14); ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(db.length, 20); ch.writeUInt32LE(db.length, 24); ch.writeUInt16LE(nb.length, 28); ch.writeUInt16LE(0, 30);
    ch.writeUInt16LE(0, 32); ch.writeUInt16LE(0, 34); ch.writeUInt16LE(0, 36); ch.writeUInt32LE(0, 38); ch.writeUInt32LE(off, 42);
    cd.push(ch, nb); off += lh.length + nb.length + db.length;
  }
  const cdBuf = Buffer.concat(cd); const n = Object.keys(entries).length;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6); eocd.writeUInt16LE(n, 8);
  eocd.writeUInt16LE(n, 10); eocd.writeUInt32LE(cdBuf.length, 12); eocd.writeUInt32LE(off, 16); eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...parts, cdBuf, eocd]);
}
writeFileSync(resolve(outDir, '3coracoes_questionamentos_e_lacunas.xlsx'), zip(files));
console.error('total', all.length, 'itens →', outDir);
