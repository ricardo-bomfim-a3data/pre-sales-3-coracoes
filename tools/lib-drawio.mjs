// Biblioteca temporária para gerar e validar diagramas draw.io (apagar após o uso)
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const ST = {
  sys: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;fontSize=11;',
  proc: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=11;',
  tab: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=11;',
  sec: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=11;',
  warn: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;',
  note: 'rounded=0;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=8;spacingTop=4;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=11;',
  info: 'rounded=0;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=8;spacingTop=4;fillColor=#f5f5f5;strokeColor=#666666;fontSize=11;',
  title: 'text;html=1;fontSize=20;fontStyle=1;align=left;verticalAlign=middle;',
  zone: (fill, stroke) => `rounded=0;whiteSpace=wrap;html=1;dashed=1;fillColor=${fill};strokeColor=${stroke};verticalAlign=top;align=left;spacingLeft=8;fontStyle=1;fontSize=12;`,
  cloud: 'points=[];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=1;container=0;pointerEvents=0;collapsible=0;recursiveResize=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_aws_cloud_alt;strokeColor=#232F3E;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#232F3E;dashed=0;',
  sfn: 'points=[];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=1;container=0;pointerEvents=0;collapsible=0;recursiveResize=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_aws_step_functions_workflow;strokeColor=#CD2264;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#CD2264;dashed=0;',
  awsbox: (stroke) => `rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=${stroke};strokeWidth=2;fontSize=11;align=left;spacingLeft=66;spacingRight=6;verticalAlign=middle;`,
  icon: (res, fill) => `sketch=0;outlineConnect=0;fontColor=#232F3E;fillColor=${fill};strokeColor=#ffffff;dashed=0;html=1;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.${res};`,
};

export const AWS = {
  s3: { res: 's3', fill: '#7AA116' },
  glue: { res: 'glue', fill: '#8C4FFF' },
  athena: { res: 'athena', fill: '#8C4FFF' },
  personalize: { res: 'personalize', fill: '#01A88D' },
  sagemaker: { res: 'sagemaker', fill: '#01A88D' },
  sfn: { res: 'step_functions', fill: '#E7157B' },
  grafana: { res: 'managed_service_for_grafana', fill: '#E7157B' },
};

export class Page {
  constructor(name, id, w, h, { flow = true } = {}) {
    this.name = name; this.id = id; this.w = w; this.h = h; this.flow = flow;
    this.cells = []; this.v = new Map(); this.e = [];
  }
  vtx(id, x, y, w, h, html, style, kind = 'box') {
    if (this.v.has(id)) throw new Error('id duplicado ' + id);
    const c = { id, x, y, w, h, html, style, kind };
    this.v.set(id, c); this.cells.push(c); return c;
  }
  title(text) { return this.vtx('title', 20, 20, 1500, 40, text, ST.title, 'text'); }
  info(aba, extra = '') {
    return this.vtx('info', this.w - 440, 10, 420, 76,
      `<b>Projeto:</b> 3 Corações · Recomendação de SKU B2B<br><b>Aba:</b> ${aba} · <b>Versão:</b> v4.0 · <b>Data:</b> 2026-10-27<br><b>Status:</b> proposto${extra ? ' · ' + extra : ''}`, ST.info, 'info');
  }
  zone(id, x, y, w, h, label, style) { return this.vtx(id, x, y, w, h, label, style, 'zone'); }
  box(id, x, y, w, h, html, style) { return this.vtx(id, x, y, w, h, html, style, 'box'); }
  aws(id, x, y, w, h, svc, html, stroke) {
    const b = this.vtx(id, x, y, w, h, html, ST.awsbox(stroke || AWS[svc].fill), 'box');
    const s = 48;
    this.vtx(id + '_ic', x + 10, y + (h - s) / 2, s, s, '', ST.icon(AWS[svc].res, AWS[svc].fill), 'icon');
    return b;
  }
  // lados: l r t b com fração; pts = pontos intermediários ortogonais
  edge(id, src, tgt, label, { ex = [1, 0.5], en = [0, 0.5], pts = [], dashed = false, color = null, width = 1.5 } = {}) {
    this.e.push({ id, src, tgt, label, ex, en, pts, dashed, color, width });
  }
  anchor(id, f) {
    const c = this.v.get(id);
    return [c.x + c.w * f[0], c.y + c.h * f[1]];
  }
  poly(e) { return [this.anchor(e.src, e.ex), ...e.pts, this.anchor(e.tgt, e.en)]; }

  xml() {
    const out = [];
    out.push(`  <diagram name="${esc(this.name)}" id="${esc(this.id)}">`);
    out.push(`    <mxGraphModel dx="1600" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${this.w}" pageHeight="${this.h}" math="0" shadow="0">`);
    out.push('      <root>');
    out.push('        <mxCell id="0" />');
    out.push('        <mxCell id="1" parent="0" />');
    for (const c of this.cells) {
      out.push(`        <mxCell id="${esc(this.id + '_' + c.id)}" value="${esc(c.html)}" style="${esc(c.style)}" vertex="1" parent="1">`);
      out.push(`          <mxGeometry x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" as="geometry" />`);
      out.push('        </mxCell>');
    }
    for (const e of this.e) {
      const st = `edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=block;endFill=1;strokeWidth=${e.width};fontSize=10;labelBackgroundColor=#ffffff;` +
        `exitX=${e.ex[0]};exitY=${e.ex[1]};exitDx=0;exitDy=0;entryX=${e.en[0]};entryY=${e.en[1]};entryDx=0;entryDy=0;` +
        (e.dashed ? 'dashed=1;' : '') + (e.color ? `strokeColor=${e.color};` : '');
      out.push(`        <mxCell id="${esc(this.id + '_' + e.id)}" value="${esc(e.label)}" style="${esc(st)}" edge="1" parent="1" source="${esc(this.id + '_' + e.src)}" target="${esc(this.id + '_' + e.tgt)}">`);
      if (e.pts.length) {
        out.push('          <mxGeometry relative="1" as="geometry">');
        out.push('            <Array as="points">');
        for (const p of e.pts) out.push(`              <mxPoint x="${p[0]}" y="${p[1]}" />`);
        out.push('            </Array>');
        out.push('          </mxGeometry>');
      } else out.push('          <mxGeometry relative="1" as="geometry" />');
      out.push('        </mxCell>');
    }
    out.push('      </root>', '    </mxGraphModel>', '  </diagram>');
    return out.join('\n');
  }

  validate() {
    const errs = [];
    const boxes = [...this.v.values()].filter((c) => c.kind === 'box' || c.kind === 'info');
    const inter = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++)
      if (inter(boxes[i], boxes[j])) errs.push(`sobreposição: ${boxes[i].id} x ${boxes[j].id}`);
    // caixas dentro da página
    for (const c of this.cells) if (c.x < 0 || c.y < 0 || c.x + c.w > this.w || c.y + c.h > this.h) errs.push(`fora da página: ${c.id}`);
    // caixas que cruzam borda de zona (devem estar totalmente dentro ou totalmente fora)
    const zones = [...this.v.values()].filter((c) => c.kind === 'zone');
    for (const z of zones) for (const b of boxes) {
      if (!inter(z, b)) continue;
      const inside = b.x >= z.x && b.y >= z.y && b.x + b.w <= z.x + z.w && b.y + b.h <= z.y + z.h;
      if (!inside) errs.push(`caixa ${b.id} cruza a borda da zona ${z.id}`);
    }
    if (this.flow) {
      const used = new Set();
      for (const e of this.e) { used.add(e.src); used.add(e.tgt); }
      for (const b of boxes) if (b.kind === 'box' && !used.has(b.id) && !b.id.startsWith('n_')) errs.push(`caixa sem seta: ${b.id}`);
    }
    // estimativa de ajuste do texto
    for (const c of boxes) {
      if (!c.html || c.kind === 'zone') continue;
      const avail = c.w - (c.style.includes('spacingLeft=66') ? 74 : 18);
      const cpl = Math.max(8, Math.floor(avail / 6.3));
      const lines = c.html.split(/<br>/).map((s) => s.replace(/<[^>]+>/g, '')).reduce((n, s) => n + Math.max(1, Math.ceil(s.length / cpl)), 0);
      const need = lines * 14.5 + 12;
      if (need > c.h) errs.push(`texto pode estourar em ${c.id}: precisa ~${Math.round(need)}px, tem ${c.h}px`);
    }
    // setas
    const segs = [];
    for (const e of this.e) {
      if (!this.v.has(e.src) || !this.v.has(e.tgt)) { errs.push(`seta ${e.id}: origem/destino inexistente`); continue; }
      const p = this.poly(e);
      for (let i = 0; i < p.length - 1; i++) {
        const [a, b] = [p[i], p[i + 1]];
        if (a[0] !== b[0] && a[1] !== b[1]) { errs.push(`seta ${e.id}: segmento não ortogonal ${a}->${b}`); continue; }
        if (a[0] === b[0] && a[1] === b[1]) continue;
        segs.push({ e: e.id, a, b });
        const sx0 = Math.min(a[0], b[0]), sx1 = Math.max(a[0], b[0]), sy0 = Math.min(a[1], b[1]), sy1 = Math.max(a[1], b[1]);
        for (const bx of boxes) {
          if (bx.id === e.src || bx.id === e.tgt) continue;
          if (sx1 > bx.x && sx0 < bx.x + bx.w && sy1 > bx.y && sy0 < bx.y + bx.h) errs.push(`seta ${e.id} atravessa a caixa ${bx.id}`);
        }
      }
    }
    // sobreposição colinear entre setas diferentes
    for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
      const s = segs[i], t = segs[j];
      if (s.e === t.e) continue;
      const sv = s.a[0] === s.b[0], tv = t.a[0] === t.b[0];
      if (sv && tv && s.a[0] === t.a[0]) {
        const o = Math.min(Math.max(s.a[1], s.b[1]), Math.max(t.a[1], t.b[1])) - Math.max(Math.min(s.a[1], s.b[1]), Math.min(t.a[1], t.b[1]));
        if (o > 4) errs.push(`setas ${s.e} e ${t.e} se sobrepõem na vertical em x=${s.a[0]}`);
      }
      if (!sv && !tv && s.a[1] === t.a[1]) {
        const o = Math.min(Math.max(s.a[0], s.b[0]), Math.max(t.a[0], t.b[0])) - Math.max(Math.min(s.a[0], s.b[0]), Math.min(t.a[0], t.b[0]));
        if (o > 4) errs.push(`setas ${s.e} e ${t.e} se sobrepõem na horizontal em y=${s.a[1]}`);
      }
    }
    return errs;
  }
}

export function wrapFile(pages) {
  return `<mxfile host="app.diagrams.net" pages="${pages.length}">\n${pages.map((p) => p.xml()).join('\n')}\n</mxfile>\n`;
}
