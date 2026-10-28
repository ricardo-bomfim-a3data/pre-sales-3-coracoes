// Confere um .pptx gerado: XML bem formado, sem sobras do cliente anterior ou de placeholders, notas em todos os slides.
// Uso: node verificar-deck.mjs <deck.pptx>
import fs from 'node:fs';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const zip = await JSZip.loadAsync(fs.readFileSync(process.argv[2]));
const nomes = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
const problemas = [];
let xmls = 0;
for (const n of nomes) {
  if (!/\.(xml|rels)$/.test(n)) continue;
  xmls++;
  const t = await zip.file(n).async('string');
  const erros = [];
  const dom = new DOMParser({ onError: (nivel, msg) => erros.push(`${nivel}: ${msg}`) }).parseFromString(t, 'text/xml');
  if (erros.length || !dom.documentElement) problemas.push(`${n}: XML inválido ${erros[0] || ''}`);
  if (/ppt\/(slides|notesSlides|slideLayouts|slideMasters)\//.test(n)) {
    for (const termo of ['DIRECIONAL', 'Direcional', 'Fantini', 'Rodrigues', '{{', '}}']) if (t.includes(termo)) problemas.push(`${n}: sobra "${termo}"`);
  }
}
const slides = nomes.filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => Number(a.match(/(\d+)/)[1]) - Number(b.match(/(\d+)/)[1]));
const pres = await zip.file('ppt/presentation.xml').async('string');
const naLista = (pres.match(/<p:sldId\b/g) || []).length;
console.log(`partes XML conferidas: ${xmls}; slides no pacote: ${slides.length}; slides na apresentação: ${naLista}`);
if (slides.length !== naLista) problemas.push('número de slides difere do da lista da apresentação');
for (const s of slides) {
  const num = s.match(/slide(\d+)\.xml/)[1];
  const t = await zip.file(s).async('string');
  const textos = [...t.matchAll(/<a:t>([^<]+)<\/a:t>/g)].map((m) => m[1]).filter((x) => x.trim());
  const rels = await zip.file(`ppt/slides/_rels/slide${num}.xml.rels`).async('string');
  const temNotas = /notesSlide/.test(rels);
  const titulo = textos.find((x) => /:/.test(x) && x.length > 20 && x.length < 90) || textos[0] || '(sem texto)';
  console.log(`  slide ${String(num).padStart(2)} | notas: ${temNotas ? 'sim' : 'não'} | ${titulo.slice(0, 70)}`);
}
if (problemas.length) { console.log('PROBLEMAS:\n  - ' + problemas.join('\n  - ')); process.exit(2); }
console.log('sem problemas estruturais');
