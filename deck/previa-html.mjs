// Prévia em HTML dos slides gerados por gerar-conteudo.mjs (substitui o pptxgenjs só para conferência visual).
// Não é o PowerPoint: serve para ver posição, quebra de texto e sobreposição quando não há LibreOffice.
// Uso: PREVIA=1 node gerar-conteudo.mjs saida/previa.html  e depois abrir previa.html?s=6 (ou capturar com o Edge).
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const aqui = path.dirname(url.fileURLToPath(import.meta.url));
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const PX = 96; // polegada -> px (grade 1920 = 20 pol)
const px = (v) => (v * PX).toFixed(2);
const cor = (c) => (c ? '#' + c : 'transparent');
const corT = (f) => { if (!f || !f.color) return 'transparent'; if (!f.transparency) return '#' + f.color; const n = parseInt(f.color, 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${(1 - f.transparency / 100).toFixed(2)})`; };
const fam = (f) => (f === 'Lato Black' ? "'Lato Black'" : f === 'Poppins Medium' ? "'Poppins Medium'" : "'Lato'");

class Slide {
  constructor() { this.html = []; this.bg = '#fff'; this.notes = ''; }
  set background(b) { this.bg = cor(b.color); }
  addNotes(t) { this.notes = t; }
  addImage(o) {
    const p = o.path.startsWith('/') || /^[A-Za-z]:/.test(o.path) ? o.path : path.join(aqui, o.path);
    this.html.push(`<img src="file:///${p.replace(/\\/g, '/')}" style="position:absolute;left:${px(o.x)}px;top:${px(o.y)}px;width:${px(o.w)}px;height:${px(o.h)}px">`);
  }
  addShape(type, o) {
    const x = px(o.x), y = px(o.y), w = px(o.w), h = px(o.h);
    const fill = corT(o.fill);
    const ln = o.line && o.line.type !== 'none' && o.line.color ? o.line : null;
    const border = ln ? `${(ln.width || 1) * PX / 72}px ${ln.dashType === 'dash' ? 'dashed' : 'solid'} ${cor(ln.color)}` : 'none';
    const sombra = o.shadow ? 'box-shadow:0 1.5px 8px rgba(0,0,0,.12);' : '';
    const base = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;box-sizing:border-box;`;
    if (type === 'LINE') {
      const c = ln ? cor(ln.color) : '#000', sw = ((ln && ln.width) || 1) * PX / 72;
      const x2 = +x + +w, y2 = +y + +h;
      const mark = ln && ln.endArrowType ? `<defs><marker id="m${this.html.length}" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="${c}"/></marker></defs>` : '';
      this.html.push(`<svg style="position:absolute;left:0;top:0;width:1920px;height:1080px;overflow:visible">${mark}<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${sw}" ${ln && ln.dashType ? 'stroke-dasharray="8 6"' : ''} ${mark ? `marker-end="url(#m${this.html.length})"` : ''}/></svg>`);
      return;
    }
    const clip = { RIGHT_ARROW: 'polygon(0 25%,55% 25%,55% 0,100% 50%,55% 100%,55% 75%,0 75%)', LEFT_ARROW: 'polygon(100% 25%,45% 25%,45% 0,0 50%,45% 100%,45% 75%,100% 75%)',
      DOWN_ARROW: 'polygon(25% 0,75% 0,75% 45%,100% 45%,50% 100%,0 45%,25% 45%)', DIAMOND: 'polygon(50% 0,100% 50%,50% 100%,0 50%)', TRIANGLE: 'polygon(50% 0,100% 100%,0 100%)' }[type];
    if (clip) { this.html.push(`<div style="${base}background:${fill};clip-path:${clip}"></div>`); return; }
    const r = type === 'ROUNDED_RECTANGLE' ? `border-radius:${px(o.rectRadius || 0)}px;` : '';
    this.html.push(`<div style="${base}background:${fill};border:${border};${r}${sombra}"></div>`);
  }
  addText(text, o) {
    const runs = Array.isArray(text) ? text : [{ text, options: {} }];
    const baseSize = (o.fontSize || 18) / 0.75;
    let body = '';
    runs.forEach((r) => {
      const ro = Object.assign({}, o, r.options || {});
      const st = `color:${cor(ro.color || '000000')};font-family:${fam(ro.fontFace)};font-weight:${ro.bold ? 700 : 400};font-size:${(ro.fontSize || o.fontSize || 18) / 0.75}px;${ro.italic ? 'font-style:italic;' : ''}`;
      body += `<span style="${st}">${esc(r.text).replace(/\n/g, '<br>')}</span>` + (r.options && r.options.breakLine ? '<br>' : '');
    });
    const al = { top: 'flex-start', middle: 'center', bottom: 'flex-end' }[o.valign || 'top'];
    const ta = o.align || 'left';
    const ls = o.charSpacing ? `letter-spacing:${o.charSpacing * PX / 72}px;` : '';
    this.html.push(`<div style="position:absolute;left:${px(o.x)}px;top:${px(o.y)}px;width:${px(o.w)}px;height:${px(o.h)}px;display:flex;flex-direction:column;justify-content:${al};text-align:${ta};line-height:${o.lineSpacingMultiple ? o.lineSpacingMultiple : 1.2};${ls}font-size:${baseSize}px;overflow:visible"><div>${body}</div></div>`);
  }
  addTable(rows, o) {
    const colW = o.colW || [];
    const m = o.margin || [4, 4, 4, 4];
    const mm = m.map((v) => v * PX / 72);
    let t = `<table style="position:absolute;left:${px(o.x)}px;top:${px(o.y)}px;width:${px(o.w)}px;border-collapse:collapse;table-layout:fixed;font-family:Lato">`;
    t += '<colgroup>' + colW.map((w) => `<col style="width:${px(w)}px">`).join('') + '</colgroup>';
    rows.forEach((r, i) => {
      const rh = Array.isArray(o.rowH) ? o.rowH[i] : o.rowH;
      t += `<tr style="height:${px(rh || 0.3)}px">`;
      r.forEach((c) => {
        const co = c.options || {};
        t += `<td style="border:${(o.border?.pt || 0.75) * PX / 72}px solid ${cor(o.border?.color || 'E3E3E3')};padding:${mm[0]}px ${mm[1]}px ${mm[2]}px ${mm[3]}px;background:${co.fill ? cor(co.fill.color) : 'transparent'};color:${cor(co.color || '1A1A1A')};font-size:${(co.fontSize || 14) / 0.75}px;font-weight:${co.bold ? 700 : 400};text-align:${co.align || 'left'};vertical-align:middle">${esc(c.text).replace(/\n/g, '<br>')}</td>`;
      });
      t += '</tr>';
    });
    this.html.push(t + '</table>');
  }
}

export default class Pptx {
  constructor() { this.slides = []; this.shapes = Object.fromEntries(['RECTANGLE', 'ROUNDED_RECTANGLE', 'RIGHT_ARROW', 'LEFT_ARROW', 'DOWN_ARROW', 'DIAMOND', 'TRIANGLE', 'LINE'].map((k) => [k, k])); }
  defineLayout() {}
  addSlide() { const s = new Slide(); this.slides.push(s); return s; }
  async writeFile({ fileName }) {
    const f = (n, file) => `@font-face{font-family:'${n}';src:url('file:///${path.join(aqui, 'assets/fonts', file).replace(/\\/g, '/')}')}`;
    const css = f('Lato', 'Lato-Regular.ttf') + f('Lato Black', 'Lato-Black.ttf') + f('Poppins Medium', 'Poppins-Medium.ttf') +
      "@font-face{font-family:'Lato';font-weight:700;src:url('file:///" + path.join(aqui, 'assets/fonts/Lato-Bold.ttf').replace(/\\/g, '/') + "')}" +
      "body{margin:0;background:#888}.sl{position:relative;width:1920px;height:1080px;overflow:hidden;margin:0 auto 20px}";
    const body = this.slides.map((s, i) => `<div class="sl" id="s${i + 1}" style="background:${s.bg}">${s.html.join('')}</div>`).join('\n');
    const js = "const q=new URLSearchParams(location.search).get('s');if(q){document.querySelectorAll('.sl').forEach(e=>{if(e.id!=='s'+q)e.style.display='none'});document.body.style.background='#fff'}";
    fs.writeFileSync(fileName, `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}<script>${js}</script></body></html>`);
  }
}
