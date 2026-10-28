---
name: "deck-proposta-a3data-2"
description: "Gera decks .pptx no padrão visual A3Data com a paleta azul institucional. Use ao criar proposta técnica e comercial, deck de arquitetura, SOW ou qualquer apresentação da A3Data."
---

# Decks no padrão A3Data

Você gera apresentações em PowerPoint (.pptx) no padrão visual da A3Data. Todo slide sai editável: texto, cards, faixas e tabelas são objetos nativos do PowerPoint. Só entram como imagem os ícones e as ilustrações.

Idioma: português do Brasil. Público: executivos e times técnicos de clientes. Tom: direto, concreto, sem jargão de marketing.

---

## 1. Stack e setup

- Gere o arquivo com **pptxgenjs** (Node). `npm i pptxgenjs`
- Layout `LAYOUT_16x9` (10 × 5,625 pol).
- **Desenhe tudo numa grade de 1920 × 1080 px** e converta ao escrever:
  - posição e tamanho: `k = 10 / 1920` (px → polegadas)
  - fonte: `pt(px) = px * 0.375` (px → pontos)
- Fontes: **Lato** (400, 700, 900) e **Poppins Medium**. No pptxgenjs, peso 900 = `fontFace: 'Lato', bold: true`.
- **Instale as fontes antes do QA**, senão o render de conferência sai com serifa de fallback e você não enxerga o deck real. Sem acesso ao Google Fonts, use os pacotes npm e converta woff → ttf:
  ```bash
  npm i @fontsource/lato @fontsource/poppins
  pip install fonttools brotli --break-system-packages
  python3 -c "
  from fontTools.ttLib import TTFont; import os
  out=os.path.expanduser('~/.fonts'); os.makedirs(out,exist_ok=True)
  for a,b in [('lato-latin-400-normal.woff','Lato-Regular.ttf'),
              ('lato-latin-700-normal.woff','Lato-Bold.ttf'),
              ('lato-latin-900-normal.woff','Lato-Black.ttf')]:
      f=TTFont('node_modules/@fontsource/lato/files/'+a); f.flavor=None; f.save(out+'/'+b)
  "
  fc-cache -f
  ```
- Ícones AWS: pacote npm `aws-icons` (`icons/architecture-service/*.svg`). Converta para PNG antes de inserir.
- **Fonte da verdade da marca: Design System A3Data** (https://claude.ai/artifact/Ek5FSD7BJHjwAvNftXpAK9), derivado do *Manual de Apresentações A3Data 2025 (V2.0)*. Em caso de conflito entre esta skill e o Design System, vale o Design System.
- **Logos oficiais** (baixe com Artifact `read`, `url` do Design System e `path` = id): `e0a3791ee59dcb588f19ce7976821ba9` = logo colorido (fundos claros); `022142160c11f7308b1c4b68760da7ea` = logo branco monocromático (fundos escuros: capa, divisores, faixas DARK/HERO); `04d3d0285c7ed19124dcb13b7cf1a9d4` = logo reduzido "A3". **Nunca redesenhe, recolora ou aplique efeito no logo.**
- **Trilho de navegação: peça o arquivo ao usuário.** Se receber o trilho na versão laranja, recolora para azul com deslocamento de matiz (pixels com hue entre 5° e 55° e saturação > 0,15 → hue 228°, saturação × 1,18).
- QA visual obrigatório: `soffice --headless --convert-to pdf deck.pptx` e `pdftoppm -jpeg -r 85 deck.pdf qa`. Olhe **cada slide** antes de entregar.

---

## 2. Tokens de design

Cores (hex sem `#` no pptxgenjs):

| Token | Hex | Uso |
|---|---|---|
| BG | F5F5F5 | fundo de todo slide claro (Off White do manual) |
| BLUE | 0033FF | eyebrow, números grandes, borda superior dos cards, setas |
| BAND | B9C4FF | faixa horizontal de fundo, barras de execução, cabeçalho de tabela |
| PALE | E6EBFF | caixas de destaque, pílula clara |
| BORDER | C3CDF5 | borda das caixas PALE |
| NAVY | 001863 | tags de seção, ✓ dos bullets, texto sobre PALE |
| PINK | F53199 | Pink Nic do manual: destaque pontual em forma ou preenchimento — um marco, uma raia, um número-chave. Nunca como acento geral |
| PINK_TEXT | B80E74 | Pink Nic 800: texto pink pequeno sobre fundo claro (F53199 sobre F5F5F5 tem só 3,3:1). Texto sobre preenchimento PINK: preto, ou branco só ≥ 24 px bold |
| TEXT | 1A1A1A | texto principal |
| SUB | 4D4D4D | texto secundário |
| HAIR | E3E3E3 | divisórias finas |
| SOFT | F7F7F7 | caixas internas e zebra de tabela |
| DARK | 1A1A1A | faixas escuras, pílula escura, aprovador na RACI |
| GREY | 8A8A8A | borda de card secundário, elemento de terceiro em diagrama |
| RED / REDPALE / REDBORDER | C0392B / FBE9E7 / E6B0AA | risco, bloqueio, "fora do kit" |
| HERO_BG | 121212 | fundo das capas e divisores escuros |

Regra do pink: o azul carrega o deck; o Pink Nic aparece no máximo duas vezes por apresentação. Summer Time (FFEE00) é a outra cor secundária: tempero raro, nunca protagonista. Quando azul e pink se encontram numa mesma sequência (camadas, etapas), use o roxo intermediário `732DC5` como elo, espelhando o gradiente do ícone do logo.

Tipografia (em px da grade 1920):

| Elemento | Fonte | Tamanho |
|---|---|---|
| Título do slide | Lato 900, preto | 48 (44 em duas linhas; hero 74–96) |
| Eyebrow | Lato 900, BLUE, caixa alta | 24 |
| Título de card | Lato 900 | 24–28 |
| Corpo | Lato 400/700 | 15–21 |
| Tag de seção | Lato 900, caixa alta, espaçamento 0,1em | 13 |
| Texto mínimo | Lato | 13,5 (nunca menos) |
| Tagline e rodapé | Poppins Medium, caixa alta | 10,5–11 |

---

## 3. Moldura de todo slide claro (obrigatória)

Aplique em todos os slides de conteúdo, nesta ordem:

1. Fundo `BG`.
2. **Faixa azul** `BAND` de largura total atrás do conteúdo: `y ≈ 400–430 px`, `h ≈ 330–420 px`. Ela fica por trás dos cards e dá a assinatura visual. Slides de tabela cheia e de diagrama dispensam a faixa (`band:[0,0]`).
3. **Trilho de navegação à esquerda**: PNG transparente de 64 × 160 px em `(58, 147)`. Três quadrados arredondados com ícones de linha (banco de dados, torre de controle, alvo); o ativo em BLUE.
4. **Tagline** "EMPOWERING PEOPLE THROUGH DATA": Poppins Medium 11, cor 343434, em `(165, 38)`.
5. **Eyebrow** "A3DATA • [CLIENTE] · [PROGRAMA]": Lato 900, 24, BLUE, em `(165, 90)`.
6. **Título** em `(165, 130)`, largura 1700: formato **"Tema: Subtítulo com a mensagem"**, em title case. Se quebrar em duas linhas, reserve 116 px de altura e caia para 44 px de fonte.
7. **Área de conteúdo**: `x 165 → 1850`, `y 273 → 1002`.
8. **Rodapé**: logo 67 × 19 px em `(42, 1037)` e "LOUCOS POR DADOS APAIXONADOS POR GENTE" (Poppins Medium 10,5) em `x = 161`. Legenda do slide à direita, alinhada em `x = 1850`, `y ≈ 1034`.

---

## 4. Componentes

**Card padrão.** Branco, raio 14 px, sombra suave (externa, opacidade 0,12, blur 8, offset 1,5, ângulo 90) e **borda superior azul de 5 px**. No pptxgenjs, desenhe dois retângulos arredondados: um BLUE do tamanho do card e outro branco por cima, deslocado 5 px para baixo. Para card secundário ou "cenário não recomendado", troque o BLUE por GREY.

**Tag de seção.** Texto curto em caixa alta, Lato 900, NAVY, acima do título do card. Ex.: "O PROBLEMA HOJE", "POR QUÊ", "GATE DE SAÍDA".

**Pílulas.** Escura: fundo DARK, texto branco. Clara: fundo PALE, borda BORDER, texto NAVY. Sólida: fundo BLUE, texto branco. Raio total, Lato 900 13 px em caixa alta. Use para datas, sprints, donos, prazos e status.

**Bullets.** Nunca use marcador de lista. Cada item é "✓" em BLUE seguido do texto, montado como array de runs com `breakLine: true`.

**Caixa de destaque.** Fundo PALE, borda BORDER, raio 10. Uma tag ("Por quê", "Entregável", "Critério de aceite") e uma frase em negrito NAVY. Fica no pé do card ou do slide.

**Faixa escura.** Fundo DARK, raio 14, sombra. À esquerda, tag em BAND e título branco curto; divisória vertical 4A4A4A em `x + 500`; à direita, 3 ou 4 números grandes em BAND com uma linha de apoio. Use para resumos, regras e "o custo de não fazer".

**Números de passo.** "01", "02"… em Lato 900, 26–40 px, BLUE.

**Setas.** Cheias em BLUE para fluxo simples. Em fluxogramas, conectores **tracejados com ponta triangular**, linha de 2,2 px, tipo `dash`.

---

## 5. Tipos de slide

**Capa e Carta de abertura: sempre do template oficial, nunca redesenhadas.** Toda proposta abre com estes dois slides, idênticos ao template:
[TEMPLATE A3Data] Capa + Carta de Proposta — Google Slides `1nuGGw1o7ZTE1eBHUvb6LlFost8Q3_90AzI5DIyKixwo`.

1. **Capa**: foto full-bleed, "Proposta Técnica", nome da iniciativa, faixa clara com logo A3Data, logo do cliente e selos AWS/GPTW.
2. **Carta "Proposta Comercial"**: local e data, destinatário, três parágrafos de agradecimento + resumo, assinatura, imagem abstrata à direita.

Placeholders (preencha todos; nenhum `{{` pode sobrar):

| Placeholder | Conteúdo |
|---|---|
| `{{CLIENTE}}` | Nome do cliente em CAIXA ALTA (cabeçalho, carta e agradecimento final) |
| `{{NOME_DA_INICIATIVA}}` / `{{FRENTE_OU_ESCOPO}}` | Subtítulo da capa em duas linhas (ex.: "Squad Gerenciado Híbrido" / "Ciclo da Receita") |
| `{{DIA}}`, `{{MES}}`, `{{ANO}}` | Data por extenso da carta (ex.: 05, Maio, 2026) |
| `{{CONTATO_CLIENTE}}` | "Aos cuidados de" — nome do contato principal |
| `{{OBJETIVO_DA_PROPOSTA}}` | Completa "…com o objetivo principal de estabelecer ___." Uma frase, sem ponto final duplicado |
| `{{RESUMO_DA_SOLUCAO}}` | Completa "Nesse contexto, ___" — resumo da solução em 1–2 frases, terminando em ponto |
| `{{NOME_ASSINANTE}}` / `{{CARGO_ASSINANTE}}` | Quem assina (Account Manager da conta) |
| `[LOGO DO CLIENTE]` | Caixa tracejada na capa: substituir pela imagem do logo do cliente |

Ajuste a concordância "confiança da {{CLIENTE}}" para "do" quando o nome for masculino.

**Rota Google Slides (preferida):** Drive `copy_file` do template com o título da proposta → Slides `replaceAllText` com todos os placeholders num único batch (`matchCase: true`) → conteúdo da proposta a partir do slide 3 → peça ao usuário para trocar a caixa `[LOGO DO CLIENTE]` pelo logo (ou use `replaceImage`/`createImage` se houver URL pública). Releia e confirme que não restou `{{`.

**Rota .pptx:** exporte a cópia já preenchida com Drive `download_file_content` (`exportMimeType` `application/vnd.openxmlformats-officedocument.presentationml.presentation`) e use-a como base, acrescentando os slides de conteúdo. Se a junção com o deck do pptxgenjs não for viável, entregue a abertura (2 slides) e o conteúdo como arquivos separados e avise o usuário para importar ("Arquivo → Importar slides"). Nunca recrie a capa ou a carta no pptxgenjs.

**Divisor de seção.** Fundo HERO_BG, barra BLUE de 14 px na borda esquerda, número grande em BLUE, kicker em BAND, título branco em 64 px e um filete BLUE de 220 × 5 px abaixo. Rodapé em cinza com o nome da proposta.

**Conceito.** Dois ou três cards lado a lado e uma faixa escura com três números e a fonte citada.

**Antes × depois.** Cards com borda vermelha para o cenário sem governança; fluxo com a peça central em destaque para o cenário governado.

**Arquitetura em camadas.** Cinco colunas de 313 px com gap de 30 px (= 1685 px exatos): cabeçalho em pílula NAVY, coluna de destaque em BLUE, itens em caixas SOFT de 70 px com uma frase por componente. Faixa escura de governança embaixo, transversal. Setas entre colunas desenhadas **num segundo laço, depois de todas as colunas**.

**Arquitetura AWS/Azure com ícones.** Conta com borda E7157B, VPC com borda 8C4FFF, ícones oficiais de 38–56 px, uma frase de função por componente.

**Fluxograma de raias.** Raias horizontais, cada uma num card com rótulo à esquerda ("A cada ciclo de coleta", "A cada pergunta"). Nós em caixas SOFT com barra superior colorida, título e uma frase. Conectores tracejados entre nós.

**Tabela.** Sempre `addTable` nativo. Cabeçalho BAND com texto NAVY, linhas zebradas SOFT e branco, coluna de número ou status em NAVY ou BLUE, linha de total em DARK com texto branco.

**Cronograma em cascata.** Coluna de atividades de 520–560 px e grade de tempo. **Escolha a unidade da coluna pelo tamanho da barra mais curta**: se a menor fase ocupar menos de 100 px, use quinzenas ou semanas em vez de meses. Cabeçalho com pílulas por fase e rótulos de período abaixo. Linhas verticais finas HAIR, mais grossas (2 px, C9C9C9) nos limites de fase. Barras: BAND com contorno BLUE = execução A3Data; branca com contorno DARK = depende do cliente; PALE tracejada = trilha paralela. Última linha "Marcos" com losangos DARK e rótulo centralizado.

**Matriz RACI.** Tabela nativa: etapa, uma coluna por papel e a última coluna "O que precisamos do cliente" — essa última é a mais importante numa reunião de aprovação. Célula R em BAND, A e R/A em DARK com texto branco, C em PALE com texto NAVY, I em F1F1F1 com texto cinza. **Um único A por linha.**

**Benchmark.** Tabela com bolinhas de maturidade (cheia BLUE, meia BAND, vazia com contorno cinza), card "Por que escolhemos" à esquerda e a fonte com data de consulta no rodapé.

---

## 6. Regras de conteúdo

- **Uma mensagem por slide**, e ela está no título depois dos dois pontos.
- Cada card responde a uma pergunta: o que é, quem faz, por quê, o que sai.
- Frases curtas. Nada de parágrafo dentro de card.
- **Não invente números.** Rates, valores e composição de squad saem como `R$ [A CONFIRMAR]` com a nota "a confirmar com a tabela comercial da A3Data". Se o cliente informou teto orçamentário, calcule se a composição proposta cabe nele e diga o resultado.
- **Nunca deixe conteúdo de caso anterior vazar.** Ao reaproveitar estrutura, revise cada slide e troque perfis, áreas, stack e nome da empresa pelo contexto do cliente atual.
- **Aderência mostra escuta.** Cite o stack e as ferramentas reais do cliente e evite recomendar o que ele já rejeitou.
- **Negócio no contexto, técnico depois.** No slide de contexto operacional a dor fica em nível de negócio (custo, experiência, retenção); o detalhe técnico vai nos slides de objetivo e necessidade.
- **Notas do apresentador em todo slide**: a mensagem em duas ou três frases, os pontos a confirmar e, quando houver número, um bloco `[Sources]` com as fontes.
- Placeholders visíveis entre colchetes, em caixa alta: `[NOME]`, `[X DIAS ÚTEIS]`, `[PARCEIRO ESTRATÉGICO]`.
- Siglas técnicas em inglês ficam em inglês (SSO, SCP, MCP, RAG, OTel). O resto em português.

---

## 7. Armadilhas do pptxgenjs (todas já custaram retrabalho)

- **`rowH` de tabela é em polegadas, e 1 polegada = 192 px nesta grade.** `rowH: 0.6` são 115 px por linha — uma tabela de 8 linhas estoura o slide. Use 0,26 a 0,36 e deixe o conteúdo mandar. Sempre confira no render: tabela é o erro de layout mais comum.
- **Margem de célula de tabela:** se o primeiro valor do array for menor que 1, o pptxgenjs lê tudo em polegadas; se for maior ou igual a 1, lê em pontos. Passe em pontos (`px * k * 72`) e garanta que **todos** os valores fiquem ≥ 1, ou passe tudo em polegadas < 1. Nunca misture.
- **Formas LINE com altura zero renderizam de forma inconsistente** no LibreOffice e em alguns visualizadores — algumas aparecem, outras somem. Para seta horizontal de fluxo, use `pres.shapes.RIGHT_ARROW` preenchido em BLUE. Reserve LINE para conectores diagonais e tracejados.
- **Ordem de desenho é ordem de empilhamento.** Setas e rótulos entre colunas devem ser desenhados num laço separado, depois de todos os cards, senão a sombra do card seguinte os cobre.
- Caixas de texto: `margin: 0`, `fit: 'none'`, `isTextBox: true`, e cerca de 2% de folga na largura. O PowerPoint quebra linha antes do navegador.
- Cores sem `#`.
- Crie um objeto de sombra novo a cada forma. O pptxgenjs altera o objeto que recebe.
- Texto com várias cores na mesma linha: array de runs `[{ text, options }]`, com `breakLine: true` para quebrar.
- Imagens: prefira PNG em 2x com fundo transparente. SVG tem suporte irregular nos visualizadores.
- **Equilíbrio vertical.** A área de conteúdo vai até `y = 1002`. Se o último bloco termina antes de `y ≈ 900`, o slide fica com um vazio grande no pé — cresça os cards ou empurre os blocos para baixo. O oposto também vale: texto espremido dentro do card é bug.

---

## 8. Esqueleto de referência (pptxgenjs)

```js
const pptxgen = require('pptxgenjs');
const pres = new pptxgen(); pres.layout = 'LAYOUT_16x9';
const k = 10 / 1920, pt = px => px * 0.375;
const C = { BG:'F5F5F5', BLUE:'0033FF', BAND:'B9C4FF', PALE:'E6EBFF', BORDER:'C3CDF5',
            NAVY:'001863', PINK:'F53199', PINK_TEXT:'B80E74', TEXT:'1A1A1A', SUB:'4D4D4D', HAIR:'E3E3E3',
            SOFT:'F7F7F7', DARK:'1A1A1A', GREY:'8A8A8A', WHITE:'FFFFFF', HERO:'121212' };
const sh = () => ({ type:'outer', color:'000000', opacity:0.12, blur:8, offset:1.5, angle:90 });

const tb = (s, text, x, y, w, h, o = {}) => s.addText(text, Object.assign(
  { x:x*k, y:y*k, w:w*k, h:h*k, margin:0, isTextBox:true, fontFace:'Lato',
    fit:'none', valign:'top', color:C.TEXT }, o));

const rect = (s, x, y, w, h, o={}) => s.addShape(pres.shapes.RECTANGLE,
  Object.assign({ x:x*k, y:y*k, w:w*k, h:h*k, line:{type:'none'} }, o));

const rrect = (s, x, y, w, h, r, o={}) => s.addShape(pres.shapes.ROUNDED_RECTANGLE,
  Object.assign({ x:x*k, y:y*k, w:w*k, h:h*k, rectRadius:r*k, line:{type:'none'} }, o));

function chrome(s, title, opts = {}) {
  const band = opts.band || [420, 400], lines = opts.lines || 1;
  s.background = { color: C.BG };
  if (band[1] > 0) rect(s, 0, band[0], 1920, band[1], { fill:{color:C.BAND} });
  s.addImage({ path:'assets/rail.png', x:58*k, y:147*k, w:64*k, h:160*k });
  tb(s, 'EMPOWERING PEOPLE THROUGH DATA', 165, 38, 900, 18,
     { fontFace:'Poppins Medium', fontSize:pt(11), color:'343434', valign:'middle' });
  tb(s, opts.eyebrow || 'A3DATA  •  [CLIENTE]', 165, 90, 1200, 32,
     { bold:true, fontSize:pt(24), color:C.BLUE, valign:'middle' });
  tb(s, title, 165, 130, 1700, lines === 2 ? 116 : 64,
     { bold:true, fontSize:pt(lines === 2 ? 44 : 48), color:'000000', valign:'middle' });
  s.addImage({ path:'assets/logo-a3data.png', x:42*k, y:1037*k, w:67*k, h:19*k });
  tb(s, 'LOUCOS POR DADOS APAIXONADOS POR GENTE', 161, 1036, 800, 20,
     { fontFace:'Poppins Medium', fontSize:pt(10.5), color:'343434', valign:'middle' });
  if (opts.legend) tb(s, opts.legend, 900, 1034, 950, 20,
     { fontSize:pt(13.5), color:C.SUB, align:'right', valign:'middle' });
}

function card(s, x, y, w, h, accent) {
  rrect(s, x, y, w, h, 14, { fill:{color:accent || C.BLUE}, shadow:sh() });
  rrect(s, x, y+5, w, h-5, 14, { fill:{color:C.WHITE} });
}

function tag(s, text, x, y, w, color) {
  tb(s, text.toUpperCase(), x, y, w || 400, 18,
     { bold:true, fontSize:pt(13), color:color || C.NAVY, charSpacing:1.1, valign:'middle' });
}

function pill(s, text, x, y, w, dark = true, h = 28) {
  rrect(s, x, y, w, h, h/2, { fill:{ color: dark ? C.DARK : C.PALE },
    line: dark ? {type:'none'} : { color:C.BORDER, width:0.75 } });
  tb(s, text.toUpperCase(), x, y, w, h,
     { bold:true, fontSize:pt(13), color: dark ? C.WHITE : C.NAVY,
       align:'center', valign:'middle', charSpacing:0.5 });
}

function checks(s, items, x, y, w, size = 16, gap = 6) {
  const runs = [];
  items.forEach((it, i) => {
    runs.push({ text:'✓  ', options:{ color:C.BLUE, bold:true, fontSize:pt(size) } });
    runs.push({ text:it, options:{ color:C.TEXT, fontSize:pt(size), breakLine:true } });
    if (gap && i < items.length - 1) runs.push({ text:' ', options:{ fontSize:pt(gap), breakLine:true } });
  });
  tb(s, runs, x, y, w, 400, { lineSpacingMultiple:1.28 });
}

function darkband(s, tagText, title, items, x, y, w, h) {
  rrect(s, x, y, w, h, 14, { fill:{color:C.DARK}, shadow:sh() });
  tag(s, tagText, x+34, y+26, 420, C.BAND);
  tb(s, title, x+34, y+48, 430, h-70, { bold:true, fontSize:pt(26), color:C.WHITE });
  rect(s, x+500, y+26, 2.5, h-52, { fill:{color:'4A4A4A'} });
  const colW = (w - 560) / items.length;
  items.forEach((it, i) => {
    const cx = x + 540 + i*colW;
    tb(s, it.big, cx, y+24, colW-24, 44, { bold:true, fontSize:pt(34), color:C.BAND });
    tb(s, it.text, cx, y+72, colW-24, h-92, { fontSize:pt(15), color:'D8D8D8' });
  });
}
```

---

## 9. Como conduzir o trabalho

O usuário constrói a proposta **slide a slide**. Quando ele pedir um slide ou uma seção, produza apenas aquele e espere a validação antes de seguir. Não monte a apresentação inteira nem gere o .pptx sem que ele peça explicitamente.

Ao entregar cada bloco, aponte **1 a 3 pontos de calibragem** — decisões que dependem dele: ângulo do texto, nível de detalhe, números a confirmar. Faça no máximo **uma pergunta objetiva por vez**.

Quando o usuário trouxer uma oportunidade nova, devolva primeiro um **resumo de leitura** para validação — cliente e setor, dor central, pedido explícito, restrições (orçamento, prazo, compliance, cloud), escopo, entregáveis, perfis desejados e prazo. Depois pergunte por qual slide começar.

---

## 10. Checklist antes de entregar

- [ ] Todo slide claro tem faixa azul, trilho, tagline, eyebrow, título no formato "Tema: Subtítulo" e rodapé.
- [ ] Nenhum texto menor que 13,5 px na grade; nenhum texto saindo do card ou da célula.
- [ ] Nenhuma tabela ultrapassando `y = 1002`; `rowH` conferido no render.
- [ ] Cards com espaço equilibrado: sem vazio grande no pé e sem texto espremido.
- [ ] Setas de fluxo visíveis em todos os intervalos (é o defeito que mais passa batido).
- [ ] Tabelas, cronogramas e RACI são objetos nativos e editáveis.
- [ ] Nenhum termo, nome de empresa ou perfil de cliente anterior sobrou no texto.
- [ ] Todo valor comercial está como placeholder, sinalizado como a confirmar.
- [ ] Notas do apresentador em todos os slides; fontes citadas quando houver número.
- [ ] Render em PDF conferido slide a slide, com as fontes corretas instaladas.
- [ ] Logo oficial em todos os slides: colorido sobre fundo claro, branco sobre fundo escuro; nenhum logo esticado ou recolorido.
- [ ] Pink só F53199 (forma) ou B80E74 (texto); nenhum E7288B sobrou.
- [ ] Capa e Carta vêm do template oficial, com todos os placeholders preenchidos (nenhum `{{` ou `[LOGO DO CLIENTE]` sobrando).

---

## 11. Notas deste projeto (3 Corações) — adicionadas em 27/10/2026

Estas notas valem para o projeto `3 Corações` e vieram da análise de uma proposta A3Data anterior (arquivo de exemplo de 27/10/2026). O texto acima não foi alterado.

- **Pasta de trabalho:** `deck/` (Node, pptxgenjs 4.0.0, jszip). Gere scripts novos aqui, não dentro de pastas extraídas.
- **Fontes:** Lato (Regular, Bold, Black) e Poppins Medium instaladas para o usuário; os TTFs ficam em `deck/assets/fonts/`.
- **Ativos extraídos do exemplo** (`deck/assets/`): `logo-a3data.png` (colorido, 176 × 33 px), `selo-aws-advanced-tier.png`, `selo-aws-genai-competency.png`, `selo-gptw.png`. **Não há** logo branco, logo reduzido "A3" nem logo da 3 Corações em PNG; o logo branco da capa existe só como vetor dentro do template.
- **Logo no rodapé:** o PNG tem proporção 5,33 : 1. Use **88 × 17 px** na grade 1920 (como no exemplo), não 67 × 19, que o distorce.
- **Trilho de navegação:** o exemplo de 27/10/2026 **não usa** o trilho nos slides de conteúdo. Seguir o exemplo (sem trilho) até o usuário confirmar o contrário.
- **Selo GPTW:** o PNG extraído mostra o período Jul/2023 – Jul/2024 (vencido). Pedir a versão vigente ao usuário antes de enviar a proposta.
- **Capa e carta:** `node deck/montar-abertura.mjs preencher deck/valores-3coracoes.json deck/saida/abertura-3coracoes.pptx`. O modelo em `deck/templates/abertura-template.pptx` foi gerado do exemplo, sem nenhum conteúdo do cliente anterior (só os placeholders). Para trocar o logo do cliente, informe `LOGO_CLIENTE_PNG` no JSON.
- **Conteúdo do cliente anterior:** o exemplo era de outro cliente. Nunca reutilize texto, logo, nomes ou números dele.
- **Assuntos que não vão ao deck do cliente:** funding AWS, consumo mínimo para repasse e custos que a A3 negocia com a AWS.
- **Render de conferência:** LibreOffice e Poppler ainda não instalados; sem eles, a conferência visual é feita pelo usuário no PowerPoint.

- **Pipeline do deck de arquitetura (3 Corações), na pasta `deck/`:**
  1. `node preparar-icones.mjs` converte os ícones oficiais AWS (SVG) em PNG.
  2. `node montar-abertura.mjs preencher valores-3coracoes.json saida/abertura-3coracoes.pptx` gera capa e carta.
  3. `node gerar-conteudo.mjs saida/conteudo.pptx` gera os slides de conteúdo (layout 20 × 11,25 pol, fonte pt = px × 0,75, igual ao template).
  4. `node juntar.mjs saida/abertura-3coracoes.pptx saida/conteudo.pptx saida/3Coracoes_Arquitetura_Recomendacao_SKU_v1.pptx` junta tudo.
  5. `node verificar-deck.mjs <arquivo.pptx>` confere XML, notas e sobras de cliente anterior. Não substitui a conferência visual no PowerPoint.
- Títulos e kickers usam a fonte "Lato Black" (como no exemplo), não Lato com negrito.
