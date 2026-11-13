// Slides de conteúdo do deck de arquitetura da 3 Corações (padrão visual A3Data).
// Grade de desenho: 1920 x 1080 px sobre um slide de 20 x 11,25 pol (mesmo tamanho do template da abertura).
// Uso: node gerar-conteudo.mjs [saida.pptx]
// PREVIA=1 troca o pptxgenjs por uma prévia em HTML (previa-html.mjs), para conferir o layout sem PowerPoint ou LibreOffice
const pptxgen = (process.env.PREVIA ? await import('./previa-html.mjs') : await import('pptxgenjs')).default;

const pres = new pptxgen();
pres.defineLayout({ name: 'A3_20x11', width: 20, height: 11.25 });
pres.layout = 'A3_20x11';
const k = 20 / 1920;
const pt = (px) => px * 0.75;

const C = { BG: 'F5F5F5', BLUE: '0033FF', BAND: 'B9C4FF', PALE: 'E6EBFF', BORDER: 'C3CDF5', NAVY: '001863',
  PINK: 'F53199', TEXT: '1A1A1A', SUB: '4D4D4D', HAIR: 'E3E3E3', SOFT: 'F7F7F7', DARK: '1A1A1A', GREY: '8A8A8A',
  WHITE: 'FFFFFF', RED: 'C0392B', REDPALE: 'FBE9E7', REDBORDER: 'E6B0AA' };
const H = 'Lato Black'; // peso 900 (como no deck de exemplo)
const EYEBROW = 'A3DATA  •  3 CORAÇÕES  ·  RECOMENDAÇÃO DE SKU B2B';
const sh = () => ({ type: 'outer', color: '000000', opacity: 0.12, blur: 8, offset: 1.5, angle: 90 });

// ---------- verificação de ajuste de texto (estimativa, não há renderizador aqui) ----------
const avisos = [];
function estimar(txt, w, size, bold, spacing = 1.22) {
  const cw = size * (bold ? 0.58 : 0.53);
  const cpl = Math.max(4, Math.floor(w / cw));
  return String(txt).split('\n').reduce((n, par) => {
    let linhas = 1, atual = 0;
    for (const p of par.split(' ')) {
      const len = p.length + 1;
      if (atual + len > cpl) { linhas++; atual = len; } else atual += len;
    }
    return n + linhas;
  }, 0) * size * spacing;
}
let slideAtual = '';
function conferir(txt, w, h, size, bold) {
  const t = Array.isArray(txt) ? txt.map((r) => r.text).join('') : txt;
  if (!t || !h) return;
  const precisa = estimar(t, w, size, bold);
  if (precisa > h * 1.02) avisos.push(`[${slideAtual}] texto pode estourar: "${t.slice(0, 40)}…" precisa ~${Math.round(precisa)}px, tem ${h}px`);
}

const tb = (s, text, x, y, w, h, o = {}) => {
  const size = o.px || 17;
  conferir(text, w, h, size, o.bold || o.fontFace === H);
  const { px: _px, ...rest } = o;
  return s.addText(text, Object.assign({ x: x * k, y: y * k, w: w * 1.02 * k, h: h * k, margin: 0, isTextBox: true, fontFace: 'Lato',
    fit: 'none', valign: 'top', color: C.TEXT, fontSize: pt(size) }, rest));
};
const rect = (s, x, y, w, h, o = {}) => s.addShape(pres.shapes.RECTANGLE, Object.assign({ x: x * k, y: y * k, w: w * k, h: h * k, line: { type: 'none' } }, o));
const rrect = (s, x, y, w, h, r, o = {}) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, Object.assign({ x: x * k, y: y * k, w: w * k, h: h * k, rectRadius: r * k, line: { type: 'none' } }, o));
const arrow = (s, kind, x, y, w, h) => s.addShape(pres.shapes[kind], { x: x * k, y: y * k, w: w * k, h: h * k, fill: { color: C.BLUE }, line: { type: 'none' } });
const img = (s, path, x, y, w, h) => s.addImage({ path, x: x * k, y: y * k, w: w * k, h: h * k });

function novoSlide(nome, titulo, opts = {}) {
  slideAtual = nome;
  const s = pres.addSlide();
  s.background = { color: C.BG };
  if (!opts.semFaixa) rect(s, 0, 400, 1920, 370, { fill: { color: C.BAND } });
  tb(s, 'EMPOWERING PEOPLE THROUGH DATA', 165, 38, 900, 18, { px: 11, fontFace: 'Poppins Medium', color: '343434', valign: 'middle' });
  tb(s, EYEBROW, 165, 90, 1400, 32, { px: 24, fontFace: H, color: C.BLUE, valign: 'middle' });
  tb(s, titulo, 165, 130, 1700, 64, { px: 48, fontFace: H, color: '000000', valign: 'middle' });
  img(s, 'assets/logo-a3data.png', 42, 1037, 88, 17);
  tb(s, 'LOUCOS POR DADOS APAIXONADOS POR GENTE', 161, 1036, 800, 20, { px: 10.5, fontFace: 'Poppins Medium', color: '343434', valign: 'middle' });
  if (opts.legenda) tb(s, opts.legenda, 900, 1034, 950, 20, { px: 13.5, color: C.SUB, align: 'right', valign: 'middle' });
  return s;
}

function card(s, x, y, w, h, accent) {
  rrect(s, x, y, w, h, 14, { fill: { color: accent || C.BLUE }, shadow: sh() });
  rrect(s, x, y + 5, w, h - 5, 14, { fill: { color: C.WHITE } });
}
function tag(s, text, x, y, w, color) {
  tb(s, text.toUpperCase(), x, y, w || 400, 18, { px: 13.5, fontFace: H, color: color || C.NAVY, charSpacing: 1.1, valign: 'middle' });
}
function pill(s, text, x, y, w, estilo = 'dark', h = 30) {
  const e = { dark: [C.DARK, C.WHITE, null], navy: [C.NAVY, C.WHITE, null], pale: [C.PALE, C.NAVY, C.BORDER], solid: [C.BLUE, C.WHITE, null] }[estilo];
  rrect(s, x, y, w, h, h / 2, { fill: { color: e[0] }, line: e[2] ? { color: e[2], width: 0.75 } : { type: 'none' } });
  tb(s, text.toUpperCase(), x, y, w, h, { px: 13.5, fontFace: H, color: e[1], align: 'center', valign: 'middle', charSpacing: 0.5 });
}
function checks(s, items, x, y, w, h, size = 18, gap = 8) {
  const runs = [];
  items.forEach((it, i) => {
    runs.push({ text: '✓  ', options: { color: C.BLUE, bold: true, fontSize: pt(size) } });
    runs.push({ text: it, options: { color: C.TEXT, fontSize: pt(size), breakLine: true } });
    if (gap && i < items.length - 1) runs.push({ text: ' ', options: { fontSize: pt(gap), breakLine: true } });
  });
  const linhas = items.reduce((n, it) => n + estimar('✓  ' + it, w, size, false, 1.28) / (size * 1.28), 0);
  const precisa = linhas * size * 1.28 + (items.length - 1) * gap;
  if (precisa > h * 1.02) avisos.push(`[${slideAtual}] bullets podem estourar: "${items[0].slice(0, 30)}…" precisa ~${Math.round(precisa)}px, tem ${h}px`);
  s.addText(runs, { x: x * k, y: y * k, w: w * 1.02 * k, h: h * k, margin: 0, isTextBox: true, fontFace: 'Lato', fit: 'none', valign: 'top', color: C.TEXT, lineSpacingMultiple: 1.28 });
}
function destaque(s, tagText, texto, x, y, w, h) {
  rrect(s, x, y, w, h, 10, { fill: { color: C.PALE }, line: { color: C.BORDER, width: 0.75 } });
  tag(s, tagText, x + 30, y + 20, 500);
  tb(s, texto, x + 30, y + 46, w - 60, h - 60, { px: 20, bold: true, color: C.NAVY });
}
function faixaEscura(s, tagText, titulo, itens, x, y, w, h) {
  rrect(s, x, y, w, h, 14, { fill: { color: C.DARK }, shadow: sh() });
  tag(s, tagText, x + 34, y + 26, 420, C.BAND);
  tb(s, titulo, x + 34, y + 52, 430, h - 72, { px: 26, fontFace: H, color: C.WHITE });
  rect(s, x + 500, y + 26, 2.5, h - 52, { fill: { color: '4A4A4A' } });
  const colW = (w - 560) / itens.length;
  itens.forEach((it, i) => {
    const cx = x + 540 + i * colW;
    tb(s, it.big, cx, y + 26, colW - 24, 44, { px: 32, fontFace: H, color: C.BAND });
    tb(s, it.text, cx, y + 78, colW - 24, h - 96, { px: 16, color: 'D8D8D8' });
  });
}
// card com número, tag, título e bullets
function cardTexto(s, x, y, w, h, num, tagText, titulo, itens, opts = {}) {
  card(s, x, y, w, h, opts.accent);
  tb(s, num, x + 34, y + 30, 100, 44, { px: 36, fontFace: H, color: C.BLUE });
  tag(s, tagText, x + 34, y + 86, w - 68);
  tb(s, titulo, x + 34, y + 112, w - 68, 76, { px: opts.tituloPx || 27, fontFace: H });
  checks(s, itens, x + 34, y + (opts.bulletsY || 200), w - 68, h - (opts.bulletsY || 200) - 24, opts.size || 18, opts.gap || 8);
}
function notas(s, texto) { s.addNotes(texto); }

// =====================================================================================
// 3 · Contexto
// =====================================================================================
{
  const s = novoSlide('Contexto', 'Contexto: Da Escolha Manual à Recomendação por Cliente', { legenda: 'Fonte: especificação técnica da 3 Corações' });
  const xs = [165, 740, 1315];
  cardTexto(s, xs[0], 290, 535, 470, '01', 'O pedido', 'Recomendar o SKU certo para cada cliente B2B', [
    'NBO (próxima melhor oferta): qual item oferecer a cada cliente',
    'MBA (análise de cesta de compras): quais itens formam um combo',
    'Três mecânicas: combos (MBA), mais por menos e desconto (NBO)']);
  cardTexto(s, xs[1], 290, 535, 470, '02', 'Como é hoje', 'Decisão manual, da diretoria e das filiais', [
    'A Inteligência Comercial escolhe itens e público',
    'O preço passa por aprovação antes da campanha',
    'Sírius e B2B executam as campanhas']);
  cardTexto(s, xs[2], 290, 535, 470, '03', 'O que a 3C espera', 'Solução na stack e na rotina do cliente', [
    'Dados no Snowflake e rotina semanal no Airflow',
    'Execução manual a qualquer momento',
    'Teste A/B com painel de resultado diário']);
  faixaEscura(s, 'O que está em jogo', 'Provar ganho, não só recomendar', [
    { big: '3', text: 'mecânicas já ativas no Sírius e no B2B' },
    { big: '50/50', text: 'teste A/B contra o processo atual' },
    { big: '1x por semana', text: 'rodada de recomendação, com execução manual' }], 165, 800, 1685, 190);
  notas(s, 'Mensagem: a 3C quer trocar a escolha manual de SKUs por recomendação algorítmica por cliente, nas três mecânicas que já usa, e quer medir o ganho com um teste A/B.\nPontos a confirmar: se o Sírius aceita SKU diferente por cliente dentro da mesma campanha.\n[Sources] Especificação técnica da 3C: pedido (seções 1 e 2), requisitos de execução 4.4.1 a 4.4.3 e dashboard RNF02.');
}

// =====================================================================================
// 4 · Visão geral
// =====================================================================================
{
  const s = novoSlide('Visão geral', 'Visão Geral: Uma Rodada Semanal em Quatro Etapas', { legenda: 'Etapas 01 e 03 a 04 ficam na 3C; a etapa 02 roda na AWS' });
  const xs = [165, 603, 1041, 1479];
  const passos = [
    ['01', 'Preparar · Snowflake da 3C', 'Preparação da rodada', ['Lê vendas, clientes, produtos e estoque', 'Filtra itens sem estoque e já comprados no mês', 'Gera relatório de qualidade e foto versionada']],
    ['02', 'Recomendar · AWS', 'Motor de recomendação', ['NBO no Personalize: próxima melhor oferta e mais por menos', 'MBA no Personalize e Glue: regras de cesta para os combos', 'Glue prepara e formata os dados']],
    ['03', 'Entregar · Snowflake da 3C', 'Tabelas de recomendação', ['Recomendação da semana por cliente, item e mecânica', 'Histórico de todas as semanas', 'Visões de leitura para a Inteligência Comercial']],
    ['04', 'Medir · Snowflake e BI da 3C', 'Teste A/B e painel', ['Grupos fixos: recebe a recomendação ou segue o processo atual', 'Registro de quem recebeu a oferta', 'Painel de faturamento, margem e conversão']],
  ];
  passos.forEach((p, i) => cardTexto(s, xs[i], 290, 370, 450, p[0], p[1], p[2], p[3], { tituloPx: 25, size: 17, accent: i === 1 ? C.BLUE : C.NAVY }));
  [0, 1, 2].forEach((i) => arrow(s, 'RIGHT_ARROW', xs[i] + 370 + 16, 500, 36, 30));
  destaque(s, 'Por quê', 'Os dados e a decisão ficam com a 3C. A AWS só calcula as recomendações e devolve as tabelas.', 165, 790, 1685, 130);
  notas(s, 'Mensagem: a rodada tem quatro etapas. Três acontecem no ambiente da 3C (Snowflake, Airflow e BI); só o cálculo da recomendação acontece na AWS.\nPontos a confirmar: aceite da 3C para o motor rodar na AWS, já que a especificação cita Snowflake e Airflow.\n[Sources] Arquitetura proposta v4, aba 2 e aba 3 (docs/01-arquitetura).');
}

// =====================================================================================
// 5 · Arquitetura em camadas
// =====================================================================================
{
  const s = novoSlide('Arquitetura', 'Arquitetura: Dados no Snowflake, Cálculo na AWS', { semFaixa: true, legenda: 'Região AWS: N. Virgínia (us-east-1), na conta da 3C' });
  const xs = [0, 1, 2, 3, 4].map((i) => 165 + i * 343);
  const cols = [
    { t: 'Origem na 3C', accent: C.GREY, itens: [['SAP', 'Pedidos, faturamento, clientes e produtos.'], ['Feature Store de Clientes', 'Visão 360° do cliente, no Snowflake.'], ['Produtos e estoque', 'Cadastros e saldo por filial.'], ['Canais e regiões', 'Hierarquias comerciais para as aberturas.']] },
    { t: 'Snowflake da 3C', accent: C.NAVY, itens: [['Preparação da rodada', 'Filtros, relatório de qualidade e foto versionada.'], ['Tabelas de recomendação', 'Semana, histórico e regras de cesta.'], ['Grupos do teste A/B', 'Fixos por campanha.'], ['Medição', 'Faturamento, margem, sortimento e frequência por grupo.']] },
    { t: 'Orquestração', accent: C.NAVY, itens: [['Airflow da 3C', 'Agenda a rodada, carrega as tabelas e roda à mão.'], ['Manifesto no S3', 'A exportação avisa que há dados novos.'], ['Step Functions', 'Orquestra a AWS, com tentativas e alertas.'], ['Arquivo de sucesso', 'Libera a carga no Snowflake.']] },
    { t: 'AWS · motor', accent: C.BLUE, destaque: true, itens: [['S3', 'Entrada e saída, apagadas em 30 dias.', 's3'], ['Glue', 'Prepara, mede a cesta e formata as saídas.', 'glue'], ['Personalize', 'NBO, mais por menos e cesta (MBA).', 'personalize'], ['CloudTrail', 'Registra quem acessou os dados.', 'cloudtrail']] },
    { t: 'Uso na 3C', accent: C.NAVY, itens: [['Inteligência Comercial', 'Consulta a recomendação e aprova o preço.'], ['Sírius e B2B', 'Ativam combos, mais por menos e desconto.'], ['Salesforce', 'Registro das campanhas.'], ['BI da 3C', 'Painel do teste A/B.']] },
  ];
  cols.forEach((c, i) => {
    const x = xs[i];
    card(s, x, 285, 313, 430, c.accent);
    tag(s, c.t, x + 22, 305, 270, c.destaque ? C.BLUE : C.NAVY);
    c.itens.forEach((it, j) => {
      const y = 340 + j * 94;
      rrect(s, x + 16, y, 281, 84, 8, { fill: { color: c.destaque ? C.PALE : C.SOFT }, line: { color: c.destaque ? C.BORDER : C.HAIR, width: 0.75 } });
      const tx = it[2] ? x + 16 + 62 : x + 30;
      const tw = it[2] ? 281 - 62 - 14 : 281 - 28;
      if (it[2]) img(s, `assets/icons/${it[2]}.png`, x + 26, y + 20, 44, 44);
      tb(s, it[0], tx, y + 9, tw, 20, { px: 16, fontFace: H });
      tb(s, it[1], tx, y + 31, tw, 50, { px: 14, color: C.SUB });
    });
  });
  [0, 1, 2, 3].forEach((i) => arrow(s, 'RIGHT_ARROW', xs[i] + 313 + 3, 483, 24, 28));
  faixaEscura(s, 'Governança', 'Seguro por padrão e sob controle da 3C', [
    { big: '30 dias', text: 'retenção dos arquivos na AWS; o histórico fica no Snowflake' },
    { big: 'Código do cliente', text: 'no lugar do CNPJ nas cópias para a AWS' },
    { big: 'Chave da 3C', text: 'criptografia administrada pela 3C; acesso nominal e registrado' }], 165, 745, 1685, 245);
  notas(s, 'Mensagem: os dados e a decisão ficam no Snowflake da 3C; a AWS (N. Virgínia) só calcula as recomendações e devolve arquivos.\nPontos a confirmar: região do Snowflake da 3C; se a organização AWS da 3C bloqueia regiões fora do Brasil; integração de armazenamento do Snowflake com o S3.\n[Sources] Arquitetura proposta v4 (docs/01-arquitetura), ADR-003; disponibilidade do Personalize por região (documentação AWS, consultada em 26/10/2026).');
}

// =====================================================================================
// 6 · Fluxo em raias (swimlane em degraus: cada raia começa onde a anterior termina)
// =====================================================================================
{
  const s = novoSlide('Fluxo', 'Fluxo: Da Carga do SAP ao Painel do Teste A/B', { semFaixa: true, legenda: 'Numeração igual à do diagrama de arquitetura (passos 1 a 14)' });
  const LX = 165, LW = 1685, LH = 215, LG = 20, LY = 262;
  const NW = 140, NH = 150, PITCH = 160, X0 = 410, PURPLE = '732DC5';
  const lanes = [
    { tag: 'Na 3C', nome: 'Snowflake e Airflow', bar: C.NAVY, fill: C.WHITE, line: C.HAIR, top: C.BLUE, pill: 'solid' },
    { tag: 'Na AWS', nome: 'Motor de recomendação', bar: C.BLUE, fill: C.PALE, line: C.BORDER, top: C.NAVY, pill: 'navy' },
    { tag: 'Na 3C', nome: 'Snowflake e canais', bar: C.NAVY, fill: C.WHITE, line: C.HAIR, top: C.BLUE, pill: 'solid' },
  ];
  const laneY = (i) => LY + i * (LH + LG);
  lanes.forEach((l, i) => {
    rrect(s, LX, laneY(i), LW, LH, 14, { fill: { color: l.bar }, shadow: sh() });
    rrect(s, LX + 8, laneY(i), LW - 8, LH, 14, { fill: { color: l.fill }, line: { color: l.line, width: 0.75 } });
    tag(s, l.tag, LX + 36, laneY(i) + 34, 200, l.bar === C.BLUE ? C.BLUE : C.NAVY);
    tb(s, l.nome, LX + 36, laneY(i) + 58, 190, 90, { px: 24, fontFace: H });
  });
  // cada raia começa na coluna em que a anterior termina (04 e 05 na mesma coluna; 08-09 e 10 na mesma coluna)
  const nodes = [
    { l: 0, c: 0, n: '01', t: 'Carga do SAP' },
    { l: 0, c: 1, n: '02-03', t: 'Rodada e preparo' },
    { l: 0, c: 2, n: '04', t: 'Exporta para o S3' },
    { l: 1, c: 2, n: '05', t: 'Manifesto aciona' },
    { l: 1, c: 3, n: '06', t: 'Personalize · NBO' },
    { l: 1, c: 4, n: '07', t: 'Personalize · cesta (MBA)' },
    { l: 1, c: 5, n: '08-09', t: 'Glue grava a saída' },
    { l: 2, c: 5, n: '10', t: 'Carga no Snowflake' },
    { l: 2, c: 6, n: '11', t: 'Consulta e aprova' },
    { l: 2, c: 7, n: '12-13', t: 'Campanha e exposição' },
    { l: 2, c: 8, n: '14', t: 'Medição e painel' },
  ];
  const nx = (c) => X0 + c * PITCH, ny = (l) => laneY(l) + 32;
  nodes.forEach((n) => {
    const x = nx(n.c), y = ny(n.l), L = lanes[n.l];
    rrect(s, x, y, NW, NH, 10, { fill: { color: C.WHITE }, line: { color: n.l === 1 ? C.BORDER : 'D9D9D9', width: 0.75 }, shadow: sh() });
    rect(s, x + 10, y, NW - 20, 5, { fill: { color: L.top } });
    pill(s, n.n, x + 12, y + 20, n.n.length > 2 ? 70 : 46, L.pill, 26);
    tb(s, n.t, x + 12, y + 58, NW - 24, 86, { px: 17, fontFace: H });
  });
  // setas dentro da raia e passagens entre raias (segundo laço, depois de todos os blocos)
  nodes.forEach((n, i) => {
    const m = nodes[i + 1];
    if (m && m.l === n.l) arrow(s, 'RIGHT_ARROW', nx(n.c) + NW + 3, ny(n.l) + NH / 2 - 9, 14, 18);
  });
  [[0, 2, 'S3 · manifesto'], [1, 5, 'S3 · arquivo de sucesso']].forEach(([l, c, rotulo]) => {
    const x = nx(c) + NW / 2, y1 = ny(l) + NH + 3, y2 = ny(l + 1) - 4;
    s.addShape(pres.shapes.LINE, { x: x * k, y: y1 * k, w: 0, h: (y2 - y1) * k, line: { color: PURPLE, width: 2.2, dashType: 'dash', endArrowType: 'triangle' } });
    tb(s, rotulo, x + 16, laneY(l) + LH, 300, LG, { px: 15, fontFace: H, color: PURPLE, valign: 'middle' });
  });
  tb(s, [
    { text: 'Cadência da carga: ', options: { color: C.SUB } },
    { text: 'semanal hoje', options: { color: C.TEXT, bold: true } },
    { text: ', diária quando a 3C entregar a nova carga. Linhas tracejadas = passagem entre a conta da 3C e a AWS via S3.', options: { color: C.SUB } },
  ], LX, laneY(2) + LH + 16, LW, 26, { px: 17 });
  notas(s, 'Mensagem: a rodada semanal começa no Snowflake, passa pela AWS para o cálculo e volta ao Snowflake, onde a Inteligência Comercial decide e o teste A/B é medido.\nPasso a passo: 01 pedidos e cadastros chegam ao Snowflake (semanal hoje, diária quando a 3C entregar a nova carga). 02-03 o Airflow dispara a rodada e o Snowflake lê e prepara os dados da semana. 04 visões de exportação e manifesto vão ao S3 na conta da 3C. 05 o manifesto dispara o Step Functions e o Glue prepara os arquivos. 06 o Personalize calcula a próxima melhor oferta (NBO) e o mais por menos, em lote. 07 o Personalize (receita SIMS) ranqueia os pares de itens do mesmo pedido e o Glue calcula suporte, confiança e lift: é a análise de cesta de compras (MBA) dos combos. 08-09 o Glue junta as saídas, aplica o filtro final e grava o arquivo de sucesso. 10 o Airflow vê o arquivo de sucesso e carrega as tabelas no Snowflake. 11 a Inteligência Comercial consulta, escolhe e aprova o preço. 12-13 os canais ativam a oferta e registram quem a recebeu. 14 o teste A/B é medido e vai ao painel do BI da 3C.\nPontos a confirmar: quem cria a integração de armazenamento do Snowflake com o S3 (3C); onde roda o Airflow e se ele consegue listar o stage do Snowflake.\n[Sources] Arquitetura proposta v4, aba 3 (Desenho 1, passos 1 a 14).');
}

// =====================================================================================
// 7 · Motor de recomendação (tabela)
// =====================================================================================
{
  const s = novoSlide('Motor', 'Motor de Recomendação: Cada Mecânica Tem Seu Método', { semFaixa: true, legenda: 'Preços e limites dos serviços conferidos na documentação AWS em 27/10/2026' });
  const hd = (t) => ({ text: t, options: { bold: true, fill: { color: C.BAND }, color: C.NAVY, fontSize: pt(16) } });
  const cel = (t, o = {}) => ({ text: t, options: Object.assign({ color: C.TEXT, fontSize: pt(17) }, o) });
  const rows = [
    [hd('Mecânica'), hd('Pergunta que responde'), hd('Como calculamos'), hd('Serviço AWS'), hd('O que entra na tabela semanal')],
    [cel('Desconto (NBO)', { bold: true, color: C.NAVY }), cel('Qual item oferecer a cada cliente?'), cel('Próxima melhor oferta: nota por cliente e item, separando itens novos e recompra'), cel('Amazon Personalize'), cel('Itens ranqueados por cliente, com nota e motivo')],
    [cel('Mais por menos (NBO)', { bold: true, color: C.NAVY, fill: { color: C.SOFT } }), cel('Quais clientes devem receber a oferta de um item?', { fill: { color: C.SOFT } }), cel('Afinidade com o item: clientes mais propensos ao SKU em oferta', { fill: { color: C.SOFT } }), cel('Amazon Personalize (afinidade com item)', { fill: { color: C.SOFT } }), cel('Clientes ranqueados por item em oferta', { fill: { color: C.SOFT } })],
    [cel('Combos (MBA)', { bold: true, color: C.NAVY }), cel('Quais itens comprados juntos formam um combo?'), cel('Análise de cesta de compras (MBA): pares de itens do mesmo pedido, ranqueados pelo Personalize; suporte, confiança e lift por canal e região'), cel('Amazon Personalize (SIMS) e AWS Glue (métricas)'), cel('Pares e trios de itens com as métricas da regra')],
    [cel('As três', { bold: true, color: C.NAVY, fill: { color: C.SOFT } }), cel('O que vale para todas?', { fill: { color: C.SOFT } }), cel('Filtros de estoque, de itens já comprados no mês, de canal e de região', { fill: { color: C.SOFT } }), cel('AWS Glue (apoio)', { fill: { color: C.SOFT } }), cel('Tabela única com a mecânica, o grupo do teste e a vigência', { fill: { color: C.SOFT } })],
  ];
  s.addTable(rows, { x: 165 * k, y: 290 * k, w: 1685 * k, colW: [250, 400, 440, 280, 315].map((v) => v * k), rowH: [0.55, 1.15, 1.15, 1.15, 1.15],
    fontFace: 'Lato', valign: 'middle', border: { type: 'solid', color: C.HAIR, pt: 0.75 }, margin: [8, 12, 8, 12] });
  tb(s, [
    { text: 'NBO ', options: { color: C.NAVY, bold: true } }, { text: 'Next Best Offer, a próxima melhor oferta para cada cliente', options: { color: C.SUB } },
    { text: '     ·     ', options: { color: C.GREY } },
    { text: 'MBA ', options: { color: C.NAVY, bold: true } }, { text: 'Market Basket Analysis, a análise de cesta de compras que define os combos', options: { color: C.SUB } },
  ], 165, 800, 1685, 30, { px: 18, valign: 'middle' });
  destaque(s, 'Regra de negócio', 'Estoque e itens já comprados no mês são filtrados na preparação e conferidos de novo na saída, antes de publicar.', 165, 850, 1685, 120);
  notas(s, 'Mensagem: cada mecânica usa o método que responde à sua pergunta. O Personalize cobre as três: desconto, mais por menos e a cesta de compras (combos). Na cesta, cada pedido entra como um "usuário" no Personalize (receita SIMS), que devolve os itens mais associados a cada item; o Glue calcula suporte, confiança e lift desses pares, por canal e região, com a mesma tabela de pedidos. Direção do Ricardo em 28/10/2026, com base em uma POC anterior de um cientista de dados da A3 para a mesma 3C, na qual as métricas de suporte, confiança e lift saíram do próprio Personalize, com a unidade sendo o pedido. O desenho oficial usa só o Personalize como motor.\nPontos a confirmar: o recurso do Personalize que gera as regras de cesta não está na documentação pública consultada em 27/10/2026 e o projeto da POC anterior foi apagado; por isso os testes de aceite do NBO e do MBA com pedidos reais rodam já na W1, antes de fixar o desenho; se a cesta não for confirmada, o plano é o piso em SQL e nova decisão com a 3C. O lote da SIMS devolve só a lista de itens, sem pontuação; por isso as três métricas são calculadas no Glue, e não lidas do Personalize. Também confirmar se o Personalize usa o cadastro de clientes (canal, região, área) e a janela de histórico (uma só).\n[Sources] Documentação AWS: Personalize (receitas, filtros, lote, afinidade com item), consultada em 26 e 27/10/2026; relato verbal do cientista de dados da A3 (sem evidência anexada).');
}

// =====================================================================================
// 8 · Teste A/B
// =====================================================================================
{
  const s = novoSlide('Teste A/B', 'Teste A/B: Prova do Ganho em Faturamento e Margem', { legenda: 'Fonte: especificação técnica da 3 Corações (KPIs e dashboard)' });
  card(s, 165, 290, 830, 500, C.NAVY);
  tag(s, 'Como o teste funciona', 199, 316, 500);
  const itens = [['01', 'Grupos fixos', 'Cada cliente fica em "recebe a recomendação" ou "segue o processo atual", por campanha.'],
    ['02', 'Oferta ativada', 'Sírius e B2B ativam a campanha para o grupo de teste, depois da aprovação de preço.'],
    ['03', 'Exposição registrada', 'Fica gravado quem recebeu qual oferta, por cliente, item, canal e data.'],
    ['04', 'Medição por grupo', 'Vendas, grupos e exposição se cruzam e alimentam o painel.']];
  itens.forEach((it, i) => {
    const y = 356 + i * 106;
    tb(s, it[0], 199, y, 70, 40, { px: 32, fontFace: H, color: C.BLUE });
    tb(s, it[1], 280, y + 2, 680, 28, { px: 22, fontFace: H });
    tb(s, it[2], 280, y + 34, 680, 60, { px: 17, color: C.SUB });
  });
  card(s, 1020, 290, 830, 500, C.BLUE);
  tag(s, 'O que medimos em cada grupo', 1054, 316, 500);
  const kpis = [['Faturamento', 'receita por cliente na vigência da campanha'], ['Margem', 'margem de contribuição por cliente'], ['Sortimento', 'SKUs distintos pedidos'], ['Frequência', 'pedidos distintos'], ['Conversão', 'compra do item ou combo ofertado']];
  kpis.forEach((kp, i) => {
    const y = 360 + i * 84;
    pill(s, kp[0], 1054, y, 210, 'solid', 40);
    tb(s, kp[1], 1286, y + 6, 540, 30, { px: 18, color: C.TEXT, valign: 'middle' });
  });
  destaque(s, 'Dependência da 3C', 'Registrar quem recebeu a oferta no Sírius, no B2B e no Salesforce. Enquanto a carga de vendas for semanal, o painel de resultado também atualiza toda semana.', 165, 830, 1685, 150);
  notas(s, 'Mensagem: o teste A/B 50/50 é a prova de que a recomendação melhora faturamento e margem em relação ao processo atual.\nPontos a confirmar: definição de margem (com ou sem frete e comissão); se o Sírius registra a exposição; quando a carga diária de vendas estará disponível.\n[Sources] Especificação técnica da 3C (KPIs da seção 6, dashboard RNF02); arquitetura proposta v4, aba 3.');
}

// =====================================================================================
// 9 · Dados e segurança
// =====================================================================================
{
  const s = novoSlide('Dados e segurança', 'Dados e Segurança: Acesso Rigoroso e Retenção Curta', { legenda: 'Detalhe na aba 3 do diagrama de arquitetura' });
  const xs = [165, 593, 1021, 1449];
  cardTexto(s, xs[0], 290, 402, 470, '01', 'O que fica onde', 'Snowflake guarda, AWS calcula', [
    'Snowflake: dados, histórico, grupos e medição, sem prazo',
    'AWS: arquivos de entrada e saída por 30 dias',
    'Métricas, versões de modelo e logs sem dado pessoal'], { tituloPx: 25, size: 17 });
  cardTexto(s, xs[1], 290, 402, 470, '02', 'O que sai do Snowflake', 'Só o necessário para recomendar', [
    'Código do cliente do SAP no lugar do CNPJ',
    'Histórico de compras, itens e estoque',
    'Só por visões de exportação, com papel próprio'], { tituloPx: 25, size: 17 });
  cardTexto(s, xs[2], 290, 402, 470, '03', 'Quem acessa', 'Acesso nominal e registrado', [
    'Papéis por função, sem usuário compartilhado e com verificação em duas etapas',
    'A3Data como operadora, sob contrato de operador',
    'Revisão trimestral de acessos pela 3C'], { tituloPx: 25, size: 17 });
  cardTexto(s, xs[3], 290, 402, 470, '04', 'Como protegemos', 'Chaves e trilha da 3C', [
    'Chave de criptografia administrada pela 3C',
    'Armazenamento fechado para a internet',
    'Auditoria de acessos e alerta de gasto'], { tituloPx: 25, size: 17 });
  destaque(s, 'Região e LGPD', 'Toda a AWS fica em N. Virgínia (us-east-1), porque o Amazon Personalize não existe em São Paulo. A posição do jurídico e do encarregado de dados da 3C é confirmada antes de qualquer dado real sair do Snowflake.', 165, 790, 1685, 170);
  notas(s, 'Mensagem: os dados reais ficam no Snowflake; para a AWS vai só o necessário, com o código do cliente no lugar do CNPJ, acesso nominal e retenção de 30 dias.\nPontos a confirmar: posição do jurídico e do encarregado de dados; contrato de operador; se MEI e empresa individual podem ficar nas cópias.\n[Sources] ADR-003 e arquitetura proposta v4 (docs/02-adrs, docs/01-arquitetura); documentação AWS de disponibilidade regional do Personalize (26/10/2026).');
}

// =====================================================================================
// 10 · POC
// =====================================================================================
{
  const s = novoSlide('POC', 'POC: Prova de Valor em Escala Menor Antes da Produção', { legenda: 'Escopo e prazo são proposta, a validar com a 3C' });
  const xs = [165, 740, 1315];
  cardTexto(s, xs[0], 290, 535, 440, '01', 'Escopo', 'Um recorte da operação', [
    '1 filial e 1 a 2 famílias de produto',
    '12 meses de histórico por cliente e item',
    'Disparo à mão, sem depender do Airflow']);
  cardTexto(s, xs[1], 290, 535, 440, '02', 'Como medimos', 'Contra um piso simples', [
    'Acerto nos 10 primeiros itens e cobertura do catálogo',
    'Ganho sobre popularidade (NBO) e sobre regras de cesta em SQL (MBA)',
    'Critério combinado antes dos resultados']);
  cardTexto(s, xs[2], 290, 535, 440, '03', 'O que entregamos', 'Recomendação e decisão', [
    'Recomendações e regras de cesta (MBA) nas tabelas do Snowflake',
    'Relatório de comparação por mecânica',
    'Recomendação sobre seguir ao teste A/B']);
  pill(s, '7 semanas · W0 a W6', 165 + 535 - 34 - 250, 296, 250, 'pale', 30);
  faixaEscura(s, 'Por que uma POC', 'Evidência antes de escalar', [
    { big: 'Menor risco', text: 'dados reais em 1 filial e 1 a 2 famílias' },
    { big: 'Piso claro', text: 'comparação com popularidade e cesta em SQL' },
    { big: 'Decisão', text: 'seguir para a produção com teste A/B ou ajustar' }], 165, 765, 1685, 225);
  notas(s, 'Mensagem: antes de escalar, uma POC pequena mostra se a recomendação supera um piso simples, com critério combinado antes dos resultados.\nPontos a confirmar: filial e famílias do recorte; prazo; critério de aceite offline.\n[Sources] Arquitetura proposta v4, seção 4.8 e aba 7 do diagrama.');
}

// =====================================================================================
// 11 · Cronograma (layout novo: fundo escuro, atividades à esquerda, barras por semana; sem a dedicação da equipe)
// =====================================================================================
{
  slideAtual = 'Cronograma';
  const s = pres.addSlide();
  s.background = { color: '0B1A6B' };
  img(s, 'assets/fundo-gradiente-16x9.jpg', 0, 0, 1920, 1080);
  const CLARO = 'F5F5F5', FAIXA = 'ADD3FF', AZUL = '3165F5', ROSA = 'EA9999', AMARELO = 'FFD966';
  tb(s, 'Cronograma: Sete Semanas', 148, 74, 800, 72, { px: 54, fontFace: H, color: CLARO, valign: 'middle' });
  // legenda (canto superior direito)
  const lg = (x, w, txt, fill, tr) => { tb(s, txt, x, 96, w, 26, { px: 19, color: CLARO, valign: 'middle' }); rrect(s, x + w + 8, 94, 100, 30, 15, { fill: tr ? { color: 'FFFFFF', transparency: tr } : { color: fill } }); };
  lg(1010, 74, 'A3Data', 'EFEFEF');
  lg(1212, 28, '3C', ROSA);
  lg(1376, 170, 'Trilha paralela', 'EFEFEF', 55);
  s.addShape(pres.shapes.DIAMOND, { x: 1700 * k, y: 94 * k, w: 29 * k, h: 29 * k, fill: { color: AMARELO }, line: { type: 'none' } });
  tb(s, 'Marco', 1738, 96, 90, 26, { px: 19, color: CLARO, valign: 'middle' });

  const LX = 62, LW = 330, GX = 400, GW = 1458, nW = 7, ww = GW / nW, FASE1 = 4;
  const RY0 = 290, RH = 46;
  // faixas de fase e semanas
  const faixa = (x, w, t) => { rect(s, x, 168, w, 52, { fill: { color: FAIXA } }); tb(s, t, x, 168, w, 52, { px: 19, bold: true, color: AZUL, align: 'center', valign: 'middle' }); };
  faixa(GX, ww * FASE1 - 3, 'FASE 1 · CONSTRUÇÃO · W0 A W3');
  faixa(GX + ww * FASE1 + 3, ww * (nW - FASE1) - 3, 'FASE 2 · CAMPANHAS E RESULTADO · W4 A W6');
  rect(s, LX, 230, LW, 52, { fill: { color: '1F3FB5' }, line: { color: 'FFFFFF', width: 0.75 } });
  tb(s, 'ATIVIDADES', LX + 20, 230, LW - 30, 52, { px: 19, bold: true, color: 'FFFFFF', valign: 'middle' });
  for (let i = 0; i < nW; i++) {
    rect(s, GX + i * ww, 230, ww, 52, { fill: { color: FAIXA }, line: { color: 'FFFFFF', width: 0.75 } });
    tb(s, 'W' + i, GX + i * ww, 230, ww, 52, { px: 21, bold: true, color: AZUL, align: 'center', valign: 'middle' });
  }
  const atividades = [
    ['Alinhamentos, liberação de acessos e contrato de operador', 0, 1, 'cli'],
    ['Aceite do NBO e do MBA (cesta), divisão e piso em SQL', 1, 3, 'a3'],
    ['Ambiente AWS, carga e preparação no Snowflake', 1, 3, 'a3'],
    ['Pipeline AWS: Glue, Personalize e Step Functions', 2, 4, 'a3'],
    ['Primeira rodada semanal completa', 3, 4, 'a3'],
    ['Grupos do teste A/B e tabelas de medição', 3, 4, 'a3'],
    ['Registro de exposição e painel diário no BI da 3C', 3, 4, 'cli'],
    ['Campanhas com teste A/B', 4, 6, 'a3'],
    ['Ajuste dos modelos e desafiante de NBO', 4, 6, 'par'],
    ['Avaliação offline e revisão da medição', 4, 6, 'a3'],
    ['Resultado e transferência de conhecimento', 6, 7, 'a3'],
  ];
  const fundoY = RY0 + atividades.length * RH;
  // grade pontilhada (linhas finas e translúcidas)
  for (let i = 0; i <= nW; i++) rect(s, GX + i * ww - 0.5, RY0, 1, fundoY - RY0, { fill: { color: 'FFFFFF', transparency: 78 } });
  for (let i = 0; i <= atividades.length; i++) rect(s, GX, RY0 + i * RH - 0.5, GW, 1, { fill: { color: 'FFFFFF', transparency: 78 } });
  atividades.forEach((l, i) => {
    const y = RY0 + i * RH;
    rect(s, LX, y, LW, RH, { fill: { color: FAIXA }, line: { color: 'FFFFFF', width: 0.75 } });
    tb(s, l[0], LX + 12, y + 2, LW - 24, RH - 4, { px: 16, bold: true, color: '000000', valign: 'middle' });
    const bx = GX + l[1] * ww + 6, bw = (l[2] - l[1]) * ww - 12;
    const fill = l[3] === 'cli' ? { color: ROSA } : l[3] === 'par' ? { color: 'FFFFFF', transparency: 55 } : { color: 'EFEFEF' };
    rrect(s, bx, y + (RH - 22) / 2, bw, 22, 11, { fill });
  });
  // marcos (losangos nas barras)
  const marco = (cx, linha) => s.addShape(pres.shapes.DIAMOND, { x: (cx - 14.5) * k, y: (RY0 + linha * RH + (RH - 29) / 2) * k, w: 29 * k, h: 29 * k, fill: { color: AMARELO }, line: { type: 'none' } });
  marco(GX + 3 * ww - 6, 1);
  marco(GX + 4 * ww + 6, 7);
  marco(GX + 7 * ww - 6, 10);
  // texto de apoio
  tb(s, 'Sete semanas, da W0 à W6: alinhamentos e acessos na W0; testes de aceite do NBO e do MBA e preparação do ambiente na W1 e na W2; pipeline semanal na AWS até a W3; campanhas com teste A/B e avaliação offline na W4 e na W5; resultado e transferência de conhecimento na W6.', 64, 812, 1790, 70, { px: 22, color: CLARO });
  tb(s, '◆  Marcos: testes de aceite e go/no-go ao fim da W2 · 1ª campanha no início da W4 · resultado do teste ao fim da W6. Cronograma proposto, a validar com a 3C; semana de 5 dias úteis.', 64, 896, 1790, 70, { px: 22, color: CLARO });
  // rodapé
  img(s, 'assets/logo-a3data-branco.png', 42, 1037, 88, 17);
  tb(s, '© 2026 · A3DATA CONSULTORIA S/A.', 161, 1036, 400, 20, { px: 10.5, fontFace: 'Poppins Medium', color: CLARO, valign: 'middle' });
  tb(s, 'LOUCOS POR DADOS APAIXONADOS POR GENTE', 440, 1036, 800, 20, { px: 10.5, fontFace: 'Poppins Medium', color: CLARO, valign: 'middle' });
  notas(s, 'Mensagem: o projeto cabe em sete semanas, da W0 à W6, com o tempo distribuído entre as etapas. A W0 é a semana de alinhamentos, liberação de acessos e contrato de operador. A W1 começa os testes de aceite do NBO e do MBA no Personalize, com uma amostra de pedidos reais e a divisão treino e teste, e prepara o ambiente AWS e o início da carga no Snowflake. A W2 traz o piso em SQL, a comparação com os testes e o go/no-go por mecânica no fim da semana, junto com o fim da carga e o início do pipeline AWS, que fecha na W3, quando também correm a primeira rodada semanal, o painel e os grupos do teste; as campanhas ocupam a W4 e a W5, com o ajuste dos modelos, o desafiante de NBO e a avaliação offline ao longo das duas semanas; o resultado e a transferência de conhecimento ocupam a W6 inteira.\nLeitura do slide: barras claras são atividades da A3Data, barras rosa dependem da 3C, a barra translúcida é uma trilha paralela e os losangos amarelos são os marcos.\nPontos a confirmar: acessos e uma amostra de pedidos liberados até o fim da W0; congelamento de mudanças de TI; registro de exposição pela 3C; data da carga diária de vendas.\n[Sources] Durações e W0 definidas pela A3Data (Ricardo, 28/10/2026); cronograma definido em 03/11 e 12/11/2026; arquitetura proposta v4.');
}

// =====================================================================================
// 12 · Entregáveis (tabela)
// =====================================================================================
{
  const s = novoSlide('Entregáveis', 'Entregáveis: O Que a 3C Recebe em Sete Semanas', { semFaixa: true, legenda: 'Semanas conforme o cronograma proposto, a validar com a 3C' });
  const hd = (t) => ({ text: t, options: { bold: true, fill: { color: C.BAND }, color: C.NAVY, fontSize: pt(19.5) } });
  const linhas = [
    ['Testes de aceite e piso em SQL', 'Relatório com pedidos reais da 3C, divisão treino e teste, filtros, cobertura do catálogo, comparação com o piso (popularidade e cesta em SQL) e go/no-go por mecânica', 'W2'],
    ['Pipeline na AWS', 'Amazon S3, AWS Glue, Amazon Personalize e AWS Step Functions na conta da 3C, sobre o recorte da POC, com disparo manual', 'W3'],
    ['Tabelas de recomendação no Snowflake', 'NBO, mais por menos e cesta (MBA), com suporte, confiança e lift; primeira rodada semanal completa', 'W3'],
    ['Grupos do teste A/B e tabelas de medição', 'Divisão dos clientes em grupos e tabelas de medição no Snowflake, prontas para receber o registro de exposição da 3C', 'W3'],
    ['Avaliação offline', 'Relatório por mecânica, contra o piso de popularidade e regras de cesta, com os modelos ajustados', 'W5'],
    ['Medição do teste A/B', 'Medição por grupo e primeira leitura direcional do resultado das campanhas', 'W6'],
    ['Projeção de consumo AWS', 'Estimativa para a fase de produção, feita na AWS Pricing Calculator', 'W6'],
    ['Pacote operacional e repasse', 'Documentação da arquitetura, regras de acesso e retenção, runbook e sessão de transferência de conhecimento', 'W6'],
    ['Resultado e recomendação de produção', 'Apresentação final com o resultado da POC, o go/no-go de produção e o plano de continuidade', 'W6'],
  ];
  const rows = [[hd('#'), hd('Entregável'), hd('Conteúdo'), hd('Semana')]].concat(linhas.map((l, i) => [String(i + 1).padStart(2, '0')].concat(l).map((t, j) => ({ text: t, options: { fontSize: pt(19.5), color: j === 0 ? C.NAVY : C.TEXT, bold: j === 0, fill: { color: i % 2 ? C.WHITE : C.SOFT } } }))));
  s.addTable(rows, { x: 165 * k, y: 280 * k, w: 1685 * k, colW: [90, 420, 1005, 170].map((v) => v * k), rowH: [56].concat(linhas.map(() => 62)).map((v) => v * k),
    fontFace: 'Lato', valign: 'middle', border: { type: 'solid', color: 'DADADA', pt: 0.75 }, margin: [6, 12, 6, 12] });
  notas(s, 'Mensagem: nove entregas, cada uma com a semana em que chega à 3C; os testes de aceite fecham na W2, o pipeline, as tabelas e os grupos do teste na W3, a avaliação offline na W5 e o pacote final com a recomendação de produção na W6.\nPontos a confirmar: formato do relatório de aceite e da avaliação offline; datas exatas após o kick-off.\n[Sources] SOW da PoC (seção de entregáveis e escopo); cronograma proposto (slide anterior); arquitetura proposta v4.');
}

// =====================================================================================
// 13 · Responsabilidades (tabela)
// =====================================================================================
{
  const s = novoSlide('Responsabilidades', 'Responsabilidades: O Que Precisamos da 3C', { semFaixa: true, legenda: 'Responsáveis sugeridos, a confirmar com a 3C' });
  const hd = (t) => ({ text: t, options: { bold: true, fill: { color: C.BAND }, color: C.NAVY, fontSize: pt(16) } });
  const linhas = [
    ['Aceite por escrito de que o motor roda na AWS, ainda que a especificação cite Snowflake e Airflow', 'Produto de dados e Inteligência Comercial', 'Antes do contrato'],
    ['Contrato de operador entre 3C e A3Data, e posição do jurídico e do encarregado de dados', 'Jurídico e encarregado de dados', 'W0'],
    ['Integração de armazenamento do Snowflake com o S3 e conta AWS da 3C com regiões liberadas', 'Engenharia de dados e infraestrutura', 'W0'],
    ['Resposta: o Sírius aceita SKU diferente por cliente na mesma campanha?', 'Dono do Sírius e Inteligência Comercial', 'Antes do contrato'],
    ['Registro de quem recebeu a oferta (Sírius, B2B e Salesforce) no Snowflake', 'CRM e engenharia de dados', 'W3'],
    ['Carga diária de vendas no Snowflake (hoje semanal)', 'Engenharia de dados', '[A CONFIRMAR]'],
    ['Painel diário do teste A/B no BI da 3C', 'CRM e time de BI', 'W3'],
    ['Aprovação de preço e ativação das campanhas, toda semana', 'Inteligência Comercial', 'A partir da W4'],
  ];
  const rows = [[hd('O que precisamos'), hd('Responsável sugerido na 3C'), hd('Quando')]].concat(linhas.map((l, i) => l.map((t, j) => ({ text: t, options: { fontSize: pt(16), color: j === 2 ? C.NAVY : C.TEXT, bold: j === 2, fill: { color: i % 2 ? C.SOFT : C.WHITE } } }))));
  s.addTable(rows, { x: 165 * k, y: 290 * k, w: 1685 * k, colW: [900, 520, 265].map((v) => v * k), rowH: [0.5].concat(linhas.map(() => 0.68)),
    fontFace: 'Lato', valign: 'middle', border: { type: 'solid', color: C.HAIR, pt: 0.75 }, margin: [6, 12, 6, 12] });
  notas(s, 'Mensagem: a rodada só roda se a 3C entregar acessos, registros e decisões nos prazos; a lista mostra o que precisamos e de quem.\nPontos a confirmar: nomes dos responsáveis (a lista usa áreas); data da carga diária.\n[Sources] Listas de questionamentos e lacunas (docs/04-listas): ARQ-Q43 a ARQ-Q50, ESP-Q01 a ESP-Q09.');
}

// =====================================================================================
// 14 · Riscos e alternativas
// =====================================================================================
{
  const s = novoSlide('Riscos', 'Riscos: O Que Pode Mudar o Desenho e Como Tratamos', { semFaixa: true, legenda: 'Níveis: avaliação da A3Data' });
  const hd = (t) => ({ text: t, options: { bold: true, fill: { color: C.BAND }, color: C.NAVY, fontSize: pt(16) } });
  const lin = [
    ['O motor roda na AWS e a especificação cita Snowflake e Airflow', 'ALTO', 'Aceite por escrito da 3C; plano alternativo com o motor no Snowflake', 'Antes do contrato'],
    ['Os filtros do Personalize não cobrem "já comprado no mês"', 'ALTO', 'Filtro final no Glue e conferência de estoque no Snowflake antes de publicar', 'W2'],
    ['A carga de vendas semanal limita o painel diário', 'MÉDIO', 'Painel semanal até a carga diária; basta trocar um parâmetro depois', 'W3'],
    ['Dados de clientes saem do país', 'MÉDIO', 'Código do cliente no lugar do CNPJ, acesso nominal e posição do jurídico antes do primeiro dado', 'Antes do primeiro dado'],
    ['O Sírius ainda não registra quem recebeu a oferta', 'MÉDIO', 'Carga feita pela 3C; sem ela, a medição perde precisão', 'W3'],
    ['NBO e MBA (regras de cesta) ainda não confirmados no Personalize com os pedidos da 3C', 'MÉDIO', 'Testes de aceite com pedidos reais na W1; se a cesta falhar, regras em SQL (piso) e nova decisão', 'W1'],
  ];
  const rows = [[hd('Risco'), hd('Nível'), hd('O que fazemos'), hd('Quando decidimos')]].concat(lin.map((l, i) => l.map((t, j) => ({ text: t, options: { fontSize: pt(16), bold: j === 1, color: j === 1 ? (t === 'ALTO' ? C.RED : C.NAVY) : C.TEXT, align: j === 1 ? 'center' : 'left', fill: { color: i % 2 ? C.SOFT : C.WHITE } } }))));
  s.addTable(rows, { x: 165 * k, y: 290 * k, w: 1685 * k, colW: [560, 130, 690, 305].map((v) => v * k), rowH: [0.5].concat(lin.map(() => 0.72)),
    fontFace: 'Lato', valign: 'middle', border: { type: 'solid', color: C.HAIR, pt: 0.75 }, margin: [6, 12, 6, 12] });
  faixaEscura(s, 'Alternativas', 'Se o motor não puder sair do Snowflake', [
    { big: 'No Snowflake', text: 'motor em Python e Snowpark, com tabelas no próprio Snowflake' },
    { big: 'Piso em SQL', text: 'regras de cesta e popularidade no Snowflake, se o Personalize não confirmar a cesta' },
    { big: 'Fim da W2', text: 'decisão com base nos testes de aceite, no piso e no desempenho offline' }], 165, 800, 1685, 190);
  notas(s, 'Mensagem: os dois riscos altos têm tratamento definido, e há um plano alternativo se o motor não puder sair do Snowflake.\nPontos a confirmar: aceite da 3C; posição do jurídico; se o Sírius registra a exposição.\n[Sources] Arquitetura proposta v4 (seções 4.7, 4.8 e 11), revisão do especialista (docs/08, seção 9).');
}

// =====================================================================================
// 15 · Próximos passos
// =====================================================================================
{
  const s = novoSlide('Próximos passos', 'Próximos Passos: Do Alinhamento à Primeira Rodada', { legenda: 'Datas e responsáveis a confirmar com a 3C' });
  const xs = [165, 603, 1041, 1479];
  const passos = [
    ['01', 'Alinhar', 'Alinhamento na W0', ['Aceite sobre onde roda o motor', 'Contrato de operador', 'Posição do jurídico'], '3C e A3Data'],
    ['02', 'Liberar', 'Acessos e conta', ['Conta AWS da 3C', 'Integração do Snowflake com o S3', 'Papéis nominais'], '3C'],
    ['03', 'Provar', 'Testes de aceite e POC', ['Testes do NBO e do MBA (W1 e W2)', '1 filial e 1 a 2 famílias', 'Comparação com o piso'], 'A3Data'],
    ['04', 'Decidir', 'Produção com teste A/B', ['Primeira campanha', 'Painel de resultado', 'Plano de continuidade'], '3C e A3Data'],
  ];
  passos.forEach((p, i) => {
    cardTexto(s, xs[i], 290, 370, 380, p[0], p[1], p[2], p[3], { tituloPx: 25, size: 17, bulletsY: 190 });
    pill(s, p[4], xs[i] + 34, 616, p[4].length > 8 ? 190 : 120, 'pale', 30);
  });
  [0, 1, 2].forEach((i) => arrow(s, 'RIGHT_ARROW', xs[i] + 370 + 16, 460, 36, 30));
  faixaEscura(s, 'Obrigado', 'A A3Data agradece a confiança da 3 Corações', [
    { big: '[NOME]', text: 'responsável da A3Data pela proposta [A CONFIRMAR]' },
    { big: '[E-MAIL]', text: 'contato para dúvidas e próximos passos [A CONFIRMAR]' }], 165, 740, 1685, 250);
  notas(s, 'Mensagem: quatro passos levam do alinhamento à primeira rodada com teste A/B.\nPontos a confirmar: datas, responsáveis e contatos.\n[Sources] Arquitetura proposta v4, aba 4.');
}

const saida = process.argv[2] || 'saida/conteudo.pptx';
await pres.writeFile({ fileName: saida });
console.log('conteúdo gravado:', saida);
if (avisos.length) { console.log('AVISOS DE AJUSTE DE TEXTO:'); avisos.forEach((a) => console.log('  - ' + a)); } else console.log('nenhum aviso de ajuste de texto');
