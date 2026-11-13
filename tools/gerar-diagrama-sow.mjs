// Gera o diagrama de arquitetura do SOW (draw.io, ícones oficiais aws4) e a página HTML usada para renderizar o PNG.
// Uso: node tools/gerar-diagrama-sow.mjs [saida.drawio] [saida.html]
import fs from 'node:fs';

const OUT = process.argv[2] || 'sow/diagrama-arquitetura-sow.drawio';
const HTML = process.argv[3] || 'sow/diagrama-arquitetura-sow.html';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const INK = '#232F3E';
const COR = { storage: '#7AA116', analytics: '#8C4FFF', ml: '#01A88D', integ: '#E7157B', sec: '#DD344C', mgmt: '#E7157B', cost: '#7AA116', net: '#8C4FFF' };

const cells = [];
const edges = [];
let n = 1;
const nid = () => 'c' + (++n);

function vertex(id, x, y, w, h, value, style) {
  cells.push({ id, x, y, w, h, value, style });
}

// ícone resourceIcon com rótulo abaixo (ou acima)
function icon(id, res, fill, cx, cy, label, { size = 64, above = false } = {}) {
  const style = `sketch=0;outlineConnect=0;fontColor=${INK};gradientColor=none;fillColor=${fill};strokeColor=#ffffff;dashed=0;` +
    `verticalLabelPosition=${above ? 'top' : 'bottom'};verticalAlign=${above ? 'bottom' : 'top'};align=center;html=1;fontSize=14;fontStyle=0;aspect=fixed;` +
    `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.${res};`;
  vertex(id, cx - size / 2, cy - size / 2, size, size, label, style);
}

function bucket(id, cx, cy, label, { above = false } = {}) {
  const style = `sketch=0;outlineConnect=0;fontColor=${INK};gradientColor=none;fillColor=${COR.storage};strokeColor=none;dashed=0;` +
    `verticalLabelPosition=${above ? 'top' : 'bottom'};verticalAlign=${above ? 'bottom' : 'top'};align=center;html=1;fontSize=14;fontStyle=0;aspect=fixed;shape=mxgraph.aws4.bucket;`;
  vertex(id, cx - 30, cy - 31, 60, 62, label, style);
}

function group(id, x, y, w, h, label, { grIcon, stroke, font, dashed = 0, fill = 'none' }) {
  const style = `points=[];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=15;fontStyle=1;container=0;pointerEvents=0;collapsible=0;recursiveResize=0;` +
    `shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.${grIcon};strokeColor=${stroke};fillColor=${fill};verticalAlign=top;align=left;spacingLeft=34;fontColor=${font};dashed=${dashed};`;
  vertex(id, x, y, w, h, label, style);
}

function box(id, x, y, w, h, label, { fill, stroke, dashed = 0 }) {
  const style = `rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=${fill};strokeColor=${stroke};strokeWidth=2;fontSize=14;fontColor=${INK};align=center;verticalAlign=middle;spacing=8;dashed=${dashed};`;
  vertex(id, x, y, w, h, label, style);
}

function edge(id, src, tgt, label, { ex, en, pts = [], dashed = 0, lx = 0 }) {
  edges.push({ id, src, tgt, label, ex, en, pts, dashed, lx });
}

// ---------------------------------------------------------------- título
const W = 1170, H = 905;
vertex('title', 10, 8, 1100, 36, '<b>3corações PoC · Weekly SKU recommendation (NBO and basket) on AWS</b>',
  `text;html=1;fontSize=22;fontColor=${INK};align=left;verticalAlign=middle;`);

// ---------------------------------------------------------------- AWS Cloud / Região
const ROW = 425;
group('z_cloud', 10, 60, 1150, 570, 'AWS Cloud · 3corações AWS account', { grIcon: 'group_aws_cloud_alt', stroke: INK, font: INK });
group('z_region', 25, 95, 1120, 520, 'Region: us-east-1',
  { grIcon: 'group_region', stroke: '#00A4A6', font: '#147EBA', dashed: 1 });

// faixa de segurança e governança (topo da região)
box('sec', 45, 132, 1080, 136, '', { fill: '#FDF1F3', stroke: COR.sec, dashed: 1 });
vertex('sec_t', 57, 135, 600, 24, '<b>Security, governance and monitoring</b>',
  `text;html=1;fontSize=15;fontColor=${COR.sec};align=left;verticalAlign=middle;`);
const segs = [
  ['single_sign_on', COR.sec, '<b>AWS IAM Identity Center</b><br>named access'],
  ['key_management_service', COR.sec, '<b>AWS KMS</b><br>encryption'],
  ['cloudtrail', COR.mgmt, '<b>AWS CloudTrail</b><br>access auditing'],
  ['cloudwatch', COR.mgmt, '<b>Amazon CloudWatch</b><br>logs and alarms'],
  ['budgets', COR.cost, '<b>AWS Budgets</b><br>cost alerts'],
  ['endpoints', COR.net, '<b>S3 VPC endpoint</b><br>private access'],
];
segs.forEach(([res, fill, label], i) => icon('sg' + i, res, fill, 145 + i * 180, 190, label));

// fluxo principal
bucket('s3in', 125, ROW, '<b>2 · Amazon S3 input</b><br>cut files + manifest<br>30-day lifecycle · KMS', { above: true });
icon('eb', 'eventbridge', COR.integ, 285, 365, '<b>3 · Amazon EventBridge</b><br>manifest starts<br>the workflow', { above: true });

group('z_sfn', 390, 310, 560, 295, '4 · AWS Step Functions · weekly',
  { grIcon: 'group_aws_step_functions_workflow', stroke: '#CD2264', font: '#CD2264' });
icon('glue1', 'glue', COR.analytics, 460, ROW, '<b>4a · AWS Glue</b><br>data preparation');
icon('nbo', 'personalize', COR.ml, 643, 382, '<b>4b · Amazon Personalize</b><br>NBO + item affinity');
icon('sims', 'personalize', COR.ml, 643, 507, '<b>4c · Amazon Personalize</b><br>basket (SIMS recipe)');
icon('glue2', 'glue', COR.analytics, 847, ROW, '<b>4d · AWS Glue</b><br>support, confidence, lift,<br>final filter, success file');

bucket('s3out', 1030, ROW, '<b>5 · Amazon S3 output</b><br>recommendations<br>+ success file<br>30-day lifecycle · KMS', { above: true });

// ---------------------------------------------------------------- Snowflake (cliente)
const SNOW = '#29B5E8';
vertex('z_snow', 10, 650, 1150, 205, '3corações Snowflake · customer environment',
  `rounded=0;whiteSpace=wrap;html=1;dashed=1;fillColor=#F3FAFD;strokeColor=${SNOW};fontColor=#0B6E99;fontStyle=1;fontSize=15;verticalAlign=top;align=center;spacingTop=4;`);
box('b1', 25, 695, 240, 145,
  '<b>1 · Project data cut</b><br>orders, customers, products, stock<br>12 months · 1 branch,<br>1-2 product families<br>pseudonymized customer ID',
  { fill: '#ffffff', stroke: SNOW });
box('b7', 480, 695, 240, 145,
  '<b>7 · Offline evaluation</b><br>vs popularity and<br>basket-rules benchmark<br>A/B read',
  { fill: '#ffffff', stroke: SNOW });
box('b6', 910, 695, 240, 145,
  '<b>6 · Recommendation tables</b><br>NBO, affinity, basket<br>A/B groups, exposure,<br>measurement',
  { fill: '#ffffff', stroke: SNOW });

// ---------------------------------------------------------------- setas
edge('e1', 'b1', 's3in', 'export · storage integration<br>(IAM role + external ID)', { ex: [(125 - 25) / 240, 0], en: [0.5, 1], lx: 0.05 });
edge('e2', 's3in', 'eb', '', { ex: [1, 0.5], en: [0, 0.5], pts: [[235, ROW], [235, 365]] });
edge('e3', 'eb', 'z_sfn', '', { ex: [1, 0.5], en: [0, (365 - 310) / 290] });
edge('e4', 's3in', 'glue1', 'input files', { ex: [1, 0.5], en: [0, 0.5], lx: 0.2 });
edge('e5', 'glue1', 'nbo', '', { ex: [1, 0.5], en: [0, 0.5], pts: [[535, ROW], [535, 382]] });
edge('e6', 'glue1', 'sims', '', { ex: [1, 0.5], en: [0, 0.5], pts: [[535, ROW], [535, 507]] });
edge('e7', 'nbo', 'glue2', '', { ex: [1, 0.5], en: [0, 0.5], pts: [[745, 382], [745, ROW]] });
edge('e8', 'sims', 'glue2', '', { ex: [1, 0.5], en: [0, 0.5], pts: [[745, 507], [745, ROW]] });
edge('e9', 'glue2', 's3out', '', { ex: [1, 0.5], en: [0, 0.5] });
edge('e10', 's3out', 'b6', 'load back after<br>the success file<br>(storage integration)', { ex: [0.5, 1], en: [0.5, 0], lx: 0.05 });
edge('e11', 'b6', 'b7', '', { ex: [0, 0.5], en: [1, 0.5] });

// ---------------------------------------------------------------- nota
vertex('nota', 10, 862, 1150, 36,
  'Glue and Amazon Personalize exchange files through S3 prefixes. During the PoC, exports and loads are started manually. A/B campaigns are run by 3corações on its own channels.',
  `text;html=1;whiteSpace=wrap;fontSize=13;fontStyle=2;fontColor=#545B64;align=left;verticalAlign=top;`);

// ---------------------------------------------------------------- XML
const idOf = (k) => k;
const out = [];
out.push('<mxfile host="app.diagrams.net" pages="1">');
out.push('  <diagram name="SOW architecture" id="sow-arch">');
out.push(`    <mxGraphModel dx="1400" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${W}" pageHeight="${H}" math="0" shadow="0">`);
out.push('      <root><mxCell id="0"/><mxCell id="1" parent="0"/>');
for (const c of cells) {
  out.push(`        <mxCell id="${c.id}" value="${esc(c.value)}" style="${esc(c.style)}" vertex="1" parent="1"><mxGeometry x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" as="geometry"/></mxCell>`);
}
for (const e of edges) {
  const st = `edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=block;endFill=1;endSize=6;strokeWidth=2;strokeColor=#545B64;fontSize=13;fontColor=${INK};labelBackgroundColor=#ffffff;` +
    `exitX=${e.ex[0]};exitY=${e.ex[1]};exitDx=0;exitDy=0;entryX=${e.en[0]};entryY=${e.en[1]};entryDx=0;entryDy=0;` + (e.dashed ? 'dashed=1;' : '');
  const pts = e.pts.length ? `<Array as="points">${e.pts.map((p) => `<mxPoint x="${p[0]}" y="${p[1]}"/>`).join('')}</Array>` : '';
  out.push(`        <mxCell id="${e.id}" value="${esc(e.label)}" style="${esc(st)}" edge="1" parent="1" source="${e.src}" target="${e.tgt}"><mxGeometry relative="1" x="${e.lx}" as="geometry">${pts}</mxGeometry></mxCell>`);
}
out.push('      </root>', '    </mxGraphModel>', '  </diagram>', '</mxfile>');
const xml = out.join('\n') + '\n';
fs.writeFileSync(OUT, xml);

const cfg = JSON.stringify({ highlight: '#0000ff', nav: false, resize: false, toolbar: '', xml });
fs.writeFileSync(HTML,
  `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#fff}</style></head><body>` +
  `<div class="mxgraph" style="width:${W}px;height:${H}px" data-mxgraph="${esc(cfg)}"></div>` +
  `<script src="https://viewer.diagrams.net/js/viewer-static.min.js"></script></body></html>\n`);
console.log('ok', OUT, HTML, cells.length, 'vértices', edges.length, 'setas');
