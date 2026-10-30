# Métricas, dados de entrada e consumo — POC NBO/MBA 3 Corações

Versão: v0 · 2026-10-26 · Autor: DAD · Status: pré-vendas (sem acesso a dados; tudo abaixo vem dos documentos).
Fontes: E§ = docs/03-fontes/especificacao-3c-v0.txt (cita-se seção/RF); P§ = proposta-a3data-v1-jun2026.txt (slide/tópico); R§ = reuniao-interna-2026-10-22.txt.
Convenção: FATO = escrito na fonte; INFERÊNCIA/HIPÓTESE = nossa leitura. Nomes de tabelas e colunas nas consultas são **hipotéticos** (a confirmar com o dicionário da Feature Store, E§4.2.1).

## 0. Resumo

- Os dados descritos sustentam bem **cadastro, aberturas e histórico agregado de compra**. Não sustentam, como escritos, **margem de contribuição (KPI principal)**, **MBA (cesta por pedido)**, **estoque (RF03)** nem **exposição à campanha/grupo A/B**. Nenhum dos quatro aparece em E§4.2.
- Dois pontos podem invalidar o teste mesmo com dado perfeito: (i) "margem de contribuição" em E§6 não tem custo na fórmula; (ii) "Conversão" tem duas definições (E§1 x E§6).
- Histórico começa em mai/25 (E§4.2.1): "item nunca comprado" (qualificação SKU novo, E§4.3.1.2) é **censurado à esquerda**, e há no máximo ~1,5 ciclo sazonal.

### Achados

- [DAD-01][ALTA] Margem de contribuição (E§6: "faturamento subtraindo descontos/benefícios") não inclui custo; como Faturamento já é "valor líquido faturado", vira quase Faturamento → exigir custo variável por SKU (CMV, frete, comissão, tributos) ou renomear o KPI para "receita líquida de benefícios". Sem isso o KPI principal (E§1, P§Objetivo) não existe.
- [DAD-02][ALTA] "Conversão" com duas definições: E§1 "conversão dos clientes sem compras" x E§6 "clientes que ativaram no mês / clientes existentes" (denominador = toda a base, dilui o efeito da mecânica Desconto) → fixar: numerador e denominador = elegíveis atribuídos ao grupo, janela da campanha.
- [DAD-03][ALTA] MBA (E§4.5.1, RF05) precisa de cesta por pedido (pedido × item). E§4.2.1 descreve "Pedidos em quantidade, valor e frequência" e "Produtos: lista de SKUs e quantidades 3/6/9/12 meses" (agregados por cliente, não por pedido) → confirmar existência de pedido-item no Snowflake; sem ele só há co-ocorrência por cliente-janela (cesta ≠ pedido).
- [DAD-04][ALTA] Sem tabela de exposição à campanha nem identificação do grupo A/B em nenhuma fonte; mensuração fica no Salesforce (P§Premissa 5) e o faturamento no Snowflake → definir chave e tabela única de atribuição antes do 1º envio.
- [DAD-05][ALTA] RF03 exclui "itens já comprados no mês", mas Mais por Menos visa volume de SKU (E§2.1.2), tipicamente já comprado → conflito de regra por mecânica (excluir só em Combos/SKU novo?).
- [DAD-06][MÉDIA] Combo é "um SKU novo" (E§2.1.1): vendas aparecem no faturamento sob o SKU do combo, não dos componentes → exigir tabela de composição (BOM) para medir Cobertura do SKU alvo e Sortimento.
- [DAD-07][MÉDIA] "Cobertura" é usada para KPI de negócio (E§1) e para métrica de modelo (RF02/RF06 "registros sem recomendação") → nomear separadamente: cobertura_SKU_alvo (negócio) x coverage_catalogo / coverage_PDV (modelo).
- [DAD-08][MÉDIA] E§1 cita "ticket médio" como alvo da hipótese e em Combos, mas E§6 não o define → incluir (Faturamento / Frequência).
- [DAD-09][MÉDIA] Janela de 1 mês (E§4.1.5) não existe em Produtos da Feature Store (3/6/9/12, E§4.2.1) → derivar de pedido-item ou cortar.
- [DAD-10][MÉDIA] "Visitação" está em branco em E§4.2.1 → sem definição; só usar como feature se tiver cobertura e latência confirmadas.
- [DAD-11][MÉDIA] Análise "por abertura" (E§1) multiplica comparações (canal × regional × área × qualificação × janela × 3 KPIs) sem poder estatístico por célula nem correção de múltiplas comparações; piloto é 1-2 famílias (P§Escopo) → fixar KPI primário e aberturas pré-registradas (P§Premissa 2).

## 1. Perguntas de negócio x dado

| # | Pergunta de negócio | Veredito | Evidência e lacuna |
|---|---|---|---|
| 1 | NBO Desconto: quais SKUs recomendar a PDV sem compra há 60+ dias? | Atende em parte | FATO: Faturamento, Produtos (SKUs 3-12m), RFV, status/bloqueios (E§4.2.1); mecânica em E§2.1.3. Falta: data da última compra explícita, estoque (RF03), preço/desconto praticado, tabela de preço por região. Histórico desde mai/25 limita "reativação". |
| 2 | NBO Mais por Menos: quais SKUs maximizam volume por PDV? | Atende em parte | Quantidades por SKU existem (E§4.2.1 Produtos). Falta: meta de volume por PDV/escada, unidade de medida/peso por SKU (E§4.2.2 prevê peso, a desenvolver), estoque, regra do "comprado no mês" (DAD-05). |
| 3 | MBA Combos: quais SKUs compõem os melhores combos por Regional/Filial? | Não atende como descrito | Cesta por pedido não citada (DAD-03); Feature Store de Produtos "a desenvolver" e é gate do MBA (P§Premissa 1, E§4.2.2, RNF01); BOM de combo ausente (DAD-06). Passa a "atende em parte" se o perfil Q03/Q04 mostrar pedido-item. |
| 4 | O dado permite aplicar as aberturas mínimas (canal, geo, área, qualificação, janela)? | Atende em parte | Cadastro traz canal, hierarquia comercial, geografia (E§4.2.1); "capital x interior" não é atributo citado (derivar do município); área de atuação vem do vendedor (E§4.1.3) sem histórico de troca; "SKU novo" censurado em mai/25; janela de 1 mês sem fonte (DAD-09). |
| 5 | KPI Faturamento (valor líquido faturado)? | Atende em parte | Valor de pedido existe (E§4.2.1); falta tratamento de cancelamento/devolução/bonificação e definição de "líquido" (impostos?). |
| 6 | KPI Margem de contribuição (principal)? | Não atende | Sem custo/margem por SKU em nenhuma fonte; fórmula de E§6 não contém custo (DAD-01). |
| 7 | KPIs Sortimento e Frequência? | Atende em parte | Derivam de itens/pedidos distintos (E§6); dependem de pedido-item e de excluir cancelados. Combo como SKU novo distorce Sortimento. |
| 8 | KPI Conversão? | Atende em parte | Derivável de faturamento, mas definição ambígua (DAD-02) e "ativar no mês" ≠ janela da campanha. |
| 9 | KPI Cobertura do SKU alvo (Combo)? | Atende em parte | Derivável de pedido-item por SKU; falta definição do denominador, regra para combo (BOM) e "SKU alvo" escolhido por Inteligência Comercial (E§4.5.1), sem tabela de decisão. |
| 10 | KPI Volume médio do SKU ofertado (Mais por Menos)? | Atende em parte | Quantidade existe; falta unidade padrão (caixa/kg/unidade), denominador (por PDV atribuído x por PDV comprador). |
| 11 | O teste A/B 50/50 é executável e mensurável? | Não atende | Sem tabela de atribuição/exposição (DAD-04), sem calendário de campanhas, sem chave PDV/CNPJ/cliente definida, sem MDE nem baseline de variância (P§Premissa 2). |
| 12 | RF03: remover SKU sem estoque? | Não atende | Estoque não está em E§4.2.1/4.2.2; filial/CD, granularidade e histórico de snapshot desconhecidos. |
| 13 | Dá para backtestar offline (precision@k, recall@k)? | Atende em parte | Histórico mai/25+ permite split temporal (≈17 meses até out/26); sem snapshot histórico de estoque/preço o backtest ignora restrições reais e superestima o modelo. |
| 14 | Dá para tratar sazonalidade e calendário promocional? | Atende em parte | ≤ 1,5 ciclo anual; calendário promocional e campanhas passadas não citados. |
| 15 | Acompanhamento D-1 das campanhas (RNF02)? | Não atende | Dono "Camila CRM?" com interrogação, data TBD (E§7); depende de latência SAP→Snowflake e de exposição (DAD-04). |
| 16 | Atingir "centenas de milhares de clientes" (P§Situação) com poder estatístico? | Atende em parte | Tamanho total bom; piloto de 1-2 famílias e aberturas reduz n efetivo; sem baseline de variância não dá para calcular. |

## 2. Dicionário de métricas

Convenções para todas as fórmulas: grupo A/B vem de `ab_atribuicao` (uma linha por PDV × experimento); população = **todos os PDV atribuídos** (intention-to-treat, zeros incluídos), nunca só os que compraram; janela = [dt_inicio_campanha, dt_fim_campanha] de `campanha`; fuso America/Sao_Paulo; pedidos com status cancelado fora; devoluções subtraídas na data do pedido original (a confirmar, ver Q08).

Tabelas hipotéticas: `dim_pdv` (cnpj_pdv, id_cliente, canal, regional, filial, uf, municipio, area_atuacao, id_vendedor, status, bloqueio, dt_cadastro) · `fat_pedido_item` (id_pedido, cnpj_pdv, sku, dt_pedido, dt_faturamento, qtd, un_medida, vlr_bruto, vlr_desconto, vlr_liquido, vlr_custo, status_pedido, id_campanha) · `fat_devolucao` (id_pedido, sku, qtd_dev, vlr_dev, dt_dev) · `dim_sku` · `sku_combo_bom` (sku_combo, sku_componente, qtd) · `estoque_snapshot` (dt_ref, filial_cd, sku, qtd_disp) · `campanha` (id_campanha, mecanica, sku_alvo, dt_inicio, dt_fim, desconto_regra) · `ab_atribuicao` (id_experimento, cnpj_pdv, grupo, estrato, dt_atribuicao) · `exposicao` (id_campanha, cnpj_pdv, dt_envio, canal_comunicacao, entregue) · `reco_semana` (RF06).

### 2.1 KPIs de negócio (E§1, E§6)

| ID | Métrica | Definição proposta | Granularidade | Nulos / cancelamento / devolução | Dono sugerido | Ambiguidade |
|---|---|---|---|---|---|---|
| M01 | Faturamento | Soma do valor líquido faturado no período, após devoluções | PDV × campanha; agrega por grupo e abertura | Exclui cancelados; devolução subtrai; bonificação sem valor: tratar à parte | Inteligência Comercial (Helena) | "Líquido" de quê (impostos? descontos comerciais?) |
| M02 | Margem de contribuição | Faturamento líquido − custo variável (CMV + frete + comissão + benefícios) | PDV × campanha | Custo nulo = SKU excluído do cálculo e reportado | Finanças/Controladoria (a nomear) | E§6 só subtrai descontos (DAD-01); sem fonte de custo |
| M03 | Sortimento | Contagem de SKUs distintos faturados por PDV no período | PDV × campanha | Cancelados fora; combo expandido em componentes (BOM) | Inteligência Comercial | SKU do combo conta 1 ou N? Nível do SKU (embalagem vs família) |
| M04 | Frequência de compras | Contagem de pedidos distintos faturados por PDV | PDV × campanha | Cancelados fora; pedido totalmente devolvido fora | Inteligência Comercial | Pedido = pedido de venda ou NF? Pedido fracionado em várias NFs |
| M05 | Ticket médio | M01 / M04 (por PDV comprador) | PDV × campanha | Divisão só onde M04 > 0 | Inteligência Comercial | Citado em E§1, ausente em E§6 (DAD-08) |
| M06 | Conversão (Desconto) | % dos PDV elegíveis atribuídos com ≥1 pedido faturado na janela | PDV elegível × campanha | Elegível = sem compra ≥ 60d em dt_inicio, ativo e sem bloqueio | CRM (Camila) | Dupla definição (DAD-02); janela x "mês" |
| M07 | Cobertura do SKU alvo (Combo) | % dos PDV atribuídos com ≥1 compra do SKU alvo (ou componentes do combo) na janela | PDV × campanha × SKU alvo | Cancelados fora | Inteligência Comercial | Denominador; compra via combo vs avulso; confunde com coverage do modelo (DAD-07) |
| M08 | Volume médio do SKU ofertado (Mais por Menos) | Qtd faturada do SKU ofertado / nº de PDV atribuídos (ITT); variante: / nº de PDV compradores | PDV × campanha × SKU | Qtd convertida para unidade padrão | Inteligência Comercial | Unidade, denominador, meta de volume da escada |
| M09 | Taxa de adoção da oferta (auxiliar) | % dos PDV expostos com pedido contendo a oferta (id_campanha) | PDV × campanha | Exposição entregue | CRM | Exige marca de campanha no item do pedido |
| M10 | Cobertura de recomendação (operacional) | % dos PDV elegíveis com ≥ k recomendações na tabela RF06 | PDV × semana × mecânica | Sem recomendação = fallback registrado | A3Data (DS) | Definição de fallback (P§Premissa 4) |

```sql
-- Base ITT: um registro por PDV atribuído, com zeros (pseudocódigo Snowflake)
WITH base AS (
  SELECT a.cnpj_pdv, a.grupo, a.estrato, c.id_campanha, c.dt_inicio, c.dt_fim
  FROM ab_atribuicao a JOIN campanha c ON c.id_campanha = a.id_experimento
),
ped AS (
  SELECT b.cnpj_pdv, b.grupo, b.estrato, i.id_pedido, i.sku, i.qtd,
         i.vlr_liquido, i.vlr_custo
  FROM base b JOIN fat_pedido_item i
    ON i.cnpj_pdv = b.cnpj_pdv
   AND i.dt_faturamento BETWEEN b.dt_inicio AND b.dt_fim
  WHERE i.status_pedido = 'FATURADO'
)
SELECT b.grupo, b.estrato,
       COUNT(DISTINCT b.cnpj_pdv)                                  AS n_pdv,
       SUM(p.vlr_liquido)                                          AS M01_faturamento,
       SUM(p.vlr_liquido - p.vlr_custo)                            AS M02_margem,   -- só com custo
       AVG(COALESCE(pdv.n_sku,0))                                  AS M03_sortimento_medio,
       AVG(COALESCE(pdv.n_ped,0))                                  AS M04_frequencia_media
FROM base b
LEFT JOIN ped p USING (cnpj_pdv, grupo)
LEFT JOIN (SELECT cnpj_pdv, COUNT(DISTINCT sku) n_sku, COUNT(DISTINCT id_pedido) n_ped
           FROM ped GROUP BY 1) pdv USING (cnpj_pdv)
GROUP BY 1,2;
-- devoluções: LEFT JOIN fat_devolucao ON (id_pedido, sku) e subtrair vlr_dev/qtd_dev (a confirmar Q08)
-- M06: COUNT_IF(compras>0)/COUNT(*) sobre elegíveis (ult_compra <= dt_inicio - 60)
-- M07: COUNT_IF(qtd_sku_alvo>0)/COUNT(*), sku_alvo expandido por sku_combo_bom
-- M08: SUM(qtd_sku_ofertado_unid_padrao)/COUNT(*)
```

### 2.2 Métricas offline dos modelos (RF04, RF05; champion x challenger, P§Premissa 6)

Protocolo proposto (HIPÓTESE): split **temporal** pelo fechamento semanal (E§4.4.2): treino até a semana T, teste nas semanas T+1..T+4; mesma regra de elegibilidade e de exclusão de RF03 aplicada ao conjunto de teste; mesmo protocolo para Personalize e challenger, calculado por nós em tabela própria (não usar só o relatório nativo do Personalize, para comparabilidade).

| ID | Métrica | Definição | Granularidade | Observação |
|---|---|---|---|---|
| O01 | precision@k | (itens recomendados em top-k que o PDV comprou no teste) / k | PDV × mecânica × abertura × qualificação (novo/já comprado) | k a definir (Q); média sobre PDV com ≥1 compra no teste |
| O02 | recall@k | itens relevantes no top-k / itens relevantes do PDV no teste | idem | "Relevante" = comprado na janela de teste; para SKU novo, só primeira compra |
| O03 | hit rate@k / NDCG@k / MAP | acerto de ≥1 item; ranking ponderado | idem | Complementares; NDCG para ordem do ranking |
| O04 | coverage de catálogo | SKUs distintos recomendados / SKUs elegíveis (ativos, com estoque) | mecânica × abertura | Detecta concentração em poucos SKUs |
| O05 | coverage de PDV | PDV elegíveis com recomendação / PDV elegíveis | mecânica × semana | = M10; espelha RF02 ("registros sem recomendação") |
| O06 | novidade / popularidade média | % de recomendações fora do top-N mais vendidos | abertura | Mostra se NBO só repete best-sellers (baseline gerencial) |
| O07 | lift sobre baseline | métrica do modelo / métrica do baseline (top vendas da abertura; escolha gerencial histórica) | abertura | Baseline gerencial exige histórico de escolhas manuais (Q) |
| O08 | suporte (MBA) | nº de cestas com {A,B} / nº total de cestas | abertura (regional/filial, E§4.5.1) | Usar contagem absoluta mínima, não só % |
| O09 | confiança (MBA) | suporte({A,B}) / suporte({A}); direcional com A = âncora (E§2.1.1) | abertura | Âncora = SKU frequente |
| O10 | lift (MBA) | confiança(A→B) / suporte(B) | abertura | >1 = associação acima do acaso |
| O11 | leverage / conviction (opcional) | suporte(A,B) − suporte(A)·suporte(B) | abertura | Para filtrar pares triviais |
| O12 | estabilidade temporal das regras | sobreposição (Jaccard) do top-N de combos entre janelas (1/3/6/9/12m) | abertura × janela | Responde ao efeito sazonal e à janela E§4.1.5 |

Suporte/confiança/lift mínimos: **não há valor na especificação**. Atualização de 28/10: suporte, confiança e lift são calculados pelo job do Glue (o Personalize SIMS ranqueia os pares; ver ADR-003). HIPÓTESE de partida (a calibrar na EDA, W1): suporte absoluto ≥ N cestas por abertura (N a definir após perfil P04), lift ≥ 1,2, confiança ≥ 20%; sem dados não fixamos números. Definir também "cesta" (pedido vs PDV-mês) e se pares envolvem SKUs da mesma família (E§4.2.2 prevê 4 níveis).

```sql
-- MBA: suporte/confiança/lift de pares por abertura (pseudocódigo)
WITH cesta AS (
  SELECT i.id_pedido, d.regional, d.filial, ARRAY_AGG(DISTINCT i.sku) skus
  FROM fat_pedido_item i JOIN dim_pdv d USING (cnpj_pdv)
  WHERE i.status_pedido='FATURADO' AND i.dt_faturamento >= DATEADD(month,-6,:dt_corte)
  GROUP BY 1,2,3),
par AS (
  SELECT regional, a.value::string sku_a, b.value::string sku_b, COUNT(*) n_ab
  FROM cesta, LATERAL FLATTEN(skus) a, LATERAL FLATTEN(skus) b
  WHERE a.value::string <> b.value::string GROUP BY 1,2,3),
uni AS (SELECT regional, f.value::string sku, COUNT(*) n
        FROM cesta, LATERAL FLATTEN(skus) f GROUP BY 1,2),
tot AS (SELECT regional, COUNT(*) n_cestas FROM cesta GROUP BY 1)
SELECT p.regional, sku_a, sku_b, n_ab,
       n_ab/t.n_cestas                                  AS suporte,
       n_ab/ua.n                                        AS confianca,
       (n_ab/ua.n)/(ub.n/t.n_cestas)                    AS lift
FROM par p JOIN uni ua ON ua.regional=p.regional AND ua.sku=p.sku_a
           JOIN uni ub ON ub.regional=p.regional AND ub.sku=p.sku_b
           JOIN tot t  ON t.regional=p.regional
WHERE n_ab >= :n_min;
```

### 2.3 Teste A/B: o que precisamos saber para MDE e tamanho de amostra

Fórmula (média, 2 grupos, bicaudal): n por grupo = 2·(z₁₋α/₂ + z₁₋β)²·σ² / δ², com δ = efeito mínimo detectável absoluto. Para proporções (M06, M07): σ² = p(1−p) com p do controle. Com randomização por PDV agrupado em vendedor/filial, multiplicar por design effect = 1 + (m−1)·ICC. Variância reduzida por CUPED usando o pré-período (histórico mai/25+ ajuda).

Entradas necessárias (nenhuma está nas fontes):

| Entrada | Por que | Como obter |
|---|---|---|
| Unidade de randomização (PDV/CNPJ/cliente; rede/matriz?) | Define n e contaminação | Q: definição com CRM; perfil P05 |
| α, poder (1−β), uni/bicaudal | Padrão proposto: 5%, 80%, bicaudal (HIPÓTESE) | Acordar no pré-registro (P§Premissa 2) |
| KPI primário único | Evita multiplicidade (DAD-11) | NEG/Comercial decidir; hipótese: margem de contribuição (E§1) |
| Média e desvio (σ) do KPI por abertura, 4-8 semanas | Margem e faturamento são caudais pesadas (winsorizar/log) | Perfil P14 |
| Taxa-base de ativação (Desconto) e de compra do SKU alvo (Combo) | n para proporções | Perfil P13/P14 |
| Efeito mínimo de negócio (MDE) em pontos de margem ou % | Define se o teste é viável | Comercial/Finanças |
| Duração e número de campanhas por mecânica | Poder acumula ou satura; carryover | CRM/Inteligência Comercial |
| ICC por vendedor/filial | Design effect | Perfil P17 + P14 |
| Estratos (canal × regional × área × qualificação) | Randomização estratificada | Aberturas E§4.1 |
| Taxa de contaminação (vendedor atende A e B) | Viés de spillover | Q sobre processo comercial |
| Regra de atribuição de pedido à campanha (id_campanha no item?) | Atribuição causal ao grupo | Q Salesforce/Sírius |

## 3. Dados de entrada necessários por mecânica

Grão de modelagem proposto (HIPÓTESE): **PDV × SKU × semana** (alinhado ao fechamento semanal, E§4.4.2), alimentado por pedido-item diário. Histórico mínimo desejável: ≥ 12 meses para sazonalidade (temos mai/25→; ok em 2027, ver Q de sazonalidade); ≥ 3 meses para MBA com suporte mínimo por filial (a validar).

| Dado | Combos (MBA) | Mais por Menos (NBO) | Desconto (NBO) | A/B e medição | Citado na especificação? |
|---|---|---|---|---|---|
| Pedido-item (id_pedido, SKU, qtd, valor, data) | Essencial (cesta) | Essencial | Essencial | Essencial | Parcial (E§4.2.1 agregado) |
| Cadastro PDV (canal, regional, filial, UF, município, área, vendedor, status, bloqueio) | Aberturas | Aberturas | Elegibilidade | Estratos | Sim (E§4.2.1) |
| Atributos de SKU (taxonomia 4 níveis, sabor, variação, peso, embalagem, data de criação) | Essencial | Unidade/volume | Complementar | Normalização de M08 | Sim, a desenvolver (E§4.2.2) |
| Estoque por filial/CD, com snapshot histórico | Filtro RF03 | Filtro (e escoamento) | Filtro | Controle de viés | Parcial (só como regra RF03; não em E§4.2) |
| Preço de tabela e desconto praticado por SKU/região/data | Preço do combo | Escada | Profundidade do desconto | M01/M02 | Não |
| Custo/margem por SKU (CMV, frete, comissão, tributos) | Margem do par | Margem | Margem | M02 | Não |
| Devoluções e cancelamentos (motivo, data) | Limpa cesta | Limpa volume | Limpa conversão | M01-M08 | Não |
| BOM de combos e histórico de combos já vendidos | Essencial | — | — | M03/M07 | Não |
| Calendário promocional e de campanhas passadas (mecânica, SKU, público, período) | Controle de confundidor | Idem | Idem | Baseline gerencial | Não |
| Sazonalidade/calendário (feriados, Páscoa, Natal, dias úteis) | Feature | Feature | Feature | Ajuste | Não |
| Vendedor × PDV (histórico de carteira) | Abertura | Abertura | Abertura | Cluster/ICC | Parcial (área de atuação) |
| Exposição à campanha (envio, entrega, canal, data) | — | — | — | Essencial | Não (Salesforce, P§Premissa 5) |
| Grupo A/B e estrato, data de atribuição | — | — | — | Essencial | Não |
| Marca de campanha/benefício no item do pedido | — | — | — | Essencial (adoção) | Não |
| Data de fechamento da semana e latência SAP→Snowflake | Gatilho DAG | Gatilho | Gatilho | D-1 | Parcial (E§4.4.2 "após o fechamento") |
| Visitação | Feature opcional | Feature opcional | Feature opcional | Controle | Citada sem conteúdo (E§4.2.1) |
| RFV (cluster, recência, frequência, valor) | Segmentação | Segmentação | Elegibilidade | Estrato | Sim (E§4.2.1) |

Pontos para a especificação (o que ela não cita): preço/desconto praticado; custo e margem; devoluções; cancelamentos; sazonalidade; calendário promocional; vendedor×PDV histórico; exposição à campanha; identificação do grupo A/B; data de fechamento da semana; lead time e pedido mínimo/múltiplo de caixa; lançamentos e descontinuação de SKU (cold start); SKUs de kit/combo; tabelas de preço por filial; PDV com múltiplos CNPJ/redes.

LGPD: chave é CNPJ (pessoa jurídica), mas MEI/empresário individual e contatos/vendedor podem configurar dado pessoal; nenhuma consulta de perfilamento retorna CNPJ, nome ou contato; mascarar com hash + sal do cliente se for necessário cruzar.

## 4. Consultas de perfilamento (para o cliente rodar no Snowflake)

Regras: só contagens, cardinalidades, distribuições e cobertura temporal; **nenhuma coluna de identificação** no SELECT final (cnpj_pdv, id_cliente, id_vendedor, nome, contato); grupos pequenos suprimidos (`HAVING COUNT(*) >= 10`). Nomes de tabelas/colunas são hipotéticos; o cliente substitui pelos reais (listar na P01). Janela padrão `:dt_ini = '2025-05-01'`.

```sql
-- P01 Inventário de schema (metadados, sem dados)
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema IN (:schemas_feature_store)
ORDER BY table_name, ordinal_position;

-- P02 Cobertura temporal por tabela (volume por mês, sem linhas)
SELECT DATE_TRUNC('month', dt_pedido) mes, COUNT(*) linhas,
       COUNT(DISTINCT id_pedido) pedidos, COUNT(DISTINCT cnpj_pdv) pdv, COUNT(DISTINCT sku) skus
FROM fat_pedido_item GROUP BY 1 ORDER BY 1;
-- repetir para dim_pdv (snapshot mensal?), rfv, visitacao, estoque_snapshot trocando a coluna de data

-- P03 Grão e chaves: o pedido-item é realmente item? Duplicidades
SELECT COUNT(*) linhas, COUNT(DISTINCT id_pedido) pedidos,
       COUNT(DISTINCT id_pedido||'|'||sku) pedido_sku,
       COUNT(*) - COUNT(DISTINCT id_pedido||'|'||sku||'|'||COALESCE(TO_VARCHAR(nr_item),'')) dup
FROM fat_pedido_item;

-- P04 Distribuição de itens distintos por pedido (viabilidade do MBA)
SELECT LEAST(n_sku,10) n_sku_pedido, COUNT(*) pedidos
FROM (SELECT id_pedido, COUNT(DISTINCT sku) n_sku FROM fat_pedido_item
      WHERE status_pedido='FATURADO' GROUP BY 1) GROUP BY 1 ORDER BY 1;

-- P05 PDV x CNPJ x cliente: relação de chaves (só contagens)
SELECT COUNT(DISTINCT cnpj_pdv) pdv, COUNT(DISTINCT id_cliente) clientes,
       COUNT(DISTINCT LEFT(cnpj_pdv,8)) raizes_cnpj
FROM dim_pdv;

-- P06 Completude de colunas críticas (taxa de nulos)
SELECT COUNT(*) n, COUNT_IF(vlr_custo IS NULL)/COUNT(*) pct_custo_nulo,
       COUNT_IF(vlr_desconto IS NULL)/COUNT(*) pct_desc_nulo,
       COUNT_IF(qtd IS NULL OR qtd<=0)/COUNT(*) pct_qtd_invalida,
       COUNT_IF(un_medida IS NULL)/COUNT(*) pct_un_nula,
       COUNT_IF(dt_faturamento IS NULL)/COUNT(*) pct_sem_dt_fat
FROM fat_pedido_item;

-- P07 Status de pedido, cancelamento e devolução
SELECT status_pedido, DATE_TRUNC('month',dt_pedido) mes, COUNT(*) itens, SUM(vlr_liquido) vlr
FROM fat_pedido_item GROUP BY 1,2 ORDER BY 2,1;
SELECT DATE_TRUNC('month',dt_dev) mes, COUNT(*) linhas, SUM(vlr_dev) vlr FROM fat_devolucao GROUP BY 1 ORDER BY 1;

-- P08 Público do Desconto: PDV ativos sem compra >= 60 dias, por canal/regional/semana
WITH ult AS (SELECT cnpj_pdv, MAX(dt_faturamento) ult FROM fat_pedido_item
             WHERE status_pedido='FATURADO' GROUP BY 1)
SELECT d.canal, d.regional, COUNT(*) pdv_sem_compra_60d
FROM dim_pdv d JOIN ult u USING (cnpj_pdv)
WHERE u.ult <= DATEADD(day,-60,CURRENT_DATE) AND d.status='ATIVO' AND d.bloqueio IS NULL
GROUP BY 1,2 HAVING COUNT(*) >= 10;
-- e PDV sem nenhuma compra desde mai/25: COUNT de dim_pdv sem registro em fat_pedido_item

-- P09 Recompra: dias entre pedidos (percentis) por canal
SELECT canal, COUNT(*) intervalos,
       PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY gap) p25,
       PERCENTILE_CONT(0.5)  WITHIN GROUP (ORDER BY gap) p50,
       PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY gap) p75,
       PERCENTILE_CONT(0.9)  WITHIN GROUP (ORDER BY gap) p90
FROM (SELECT d.canal, DATEDIFF(day, LAG(i.dt_pedido) OVER (PARTITION BY i.cnpj_pdv ORDER BY i.dt_pedido), i.dt_pedido) gap
      FROM (SELECT DISTINCT cnpj_pdv, id_pedido, dt_pedido FROM fat_pedido_item) i
      JOIN dim_pdv d USING (cnpj_pdv))
WHERE gap IS NOT NULL GROUP BY 1 HAVING COUNT(*) >= 10;

-- P10 Esparsidade PDV x SKU e cauda longa de SKU (12 meses)
SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY n_sku) p50_sku_por_pdv,
       PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY n_sku) p90_sku_por_pdv, COUNT(*) pdv
FROM (SELECT cnpj_pdv, COUNT(DISTINCT sku) n_sku FROM fat_pedido_item
      WHERE dt_pedido >= DATEADD(month,-12,CURRENT_DATE) GROUP BY 1);
SELECT faixa_pdv, COUNT(*) skus FROM
 (SELECT sku, CASE WHEN COUNT(DISTINCT cnpj_pdv)<50 THEN '<50' WHEN COUNT(DISTINCT cnpj_pdv)<500 THEN '50-499'
                   WHEN COUNT(DISTINCT cnpj_pdv)<5000 THEN '500-4999' ELSE '5000+' END faixa_pdv
  FROM fat_pedido_item WHERE dt_pedido >= DATEADD(month,-12,CURRENT_DATE) GROUP BY 1) GROUP BY 1;

-- P11 Sazonalidade: série semanal agregada
SELECT DATE_TRUNC('week',dt_faturamento) semana, COUNT(DISTINCT id_pedido) pedidos,
       COUNT(DISTINCT cnpj_pdv) pdv_ativos, SUM(vlr_liquido) faturamento
FROM fat_pedido_item WHERE status_pedido='FATURADO' GROUP BY 1 ORDER BY 1;

-- P12 Estoque: granularidade, frequência de snapshot, rupturas
SELECT COUNT(DISTINCT dt_ref) dias_snapshot, MIN(dt_ref) ini, MAX(dt_ref) fim,
       COUNT(DISTINCT filial_cd) locais, COUNT(DISTINCT sku) skus,
       COUNT_IF(qtd_disp<=0)/COUNT(*) pct_sku_local_zerado
FROM estoque_snapshot;

-- P13 Campanhas passadas (histórico de mecânicas e eventual A/B anterior)
SELECT mecanica, YEAR(dt_inicio) ano, COUNT(*) campanhas, SUM(pdv_alvo) pdv_alvo_total,
       COUNT_IF(possui_grupo_controle) com_controle
FROM campanha_historico GROUP BY 1,2 ORDER BY 1,2;
-- Marca de campanha no pedido: % de itens de fat_pedido_item com id_campanha preenchido, por mês

-- P14 Linha de base e variância para MDE (por estrato, janela de 4 semanas)
WITH s AS (SELECT d.canal, d.regional, i.cnpj_pdv, SUM(i.vlr_liquido) fat, COUNT(DISTINCT i.id_pedido) ped
           FROM dim_pdv d LEFT JOIN fat_pedido_item i ON i.cnpj_pdv=d.cnpj_pdv
             AND i.dt_faturamento BETWEEN DATEADD(week,-4,CURRENT_DATE) AND CURRENT_DATE
             AND i.status_pedido='FATURADO'
           WHERE d.status='ATIVO' GROUP BY 1,2,3)
SELECT canal, regional, COUNT(*) pdv, AVG(COALESCE(fat,0)) fat_medio, STDDEV(COALESCE(fat,0)) fat_dp,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY COALESCE(fat,0)) fat_p50,
       PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY COALESCE(fat,0)) fat_p99,
       COUNT_IF(fat>0)/COUNT(*) taxa_compra_4s
FROM s GROUP BY 1,2 HAVING COUNT(*) >= 10;
-- repetir com margem (se houver custo) e por semana para estimar variância intra/inter-PDV

-- P15 Latência de carga e cancelamento tardio (define "fechamento da semana" e D-1)
SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY DATEDIFF(hour,dt_faturamento,dt_carga_snowflake)) p50_h,
       PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY DATEDIFF(hour,dt_faturamento,dt_carga_snowflake)) p95_h
FROM fat_pedido_item;
SELECT PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY DATEDIFF(day,dt_faturamento,dt_cancelamento)) p90_dias_ate_cancelar
FROM fat_pedido_item WHERE status_pedido='CANCELADO';

-- P16 Visitação: o que existe (cobertura, sem identificar)
SELECT DATE_TRUNC('month',dt_visita) mes, COUNT(*) visitas, COUNT(DISTINCT cnpj_pdv) pdv_visitados,
       COUNT(DISTINCT id_vendedor) vendedores
FROM visitacao GROUP BY 1 ORDER BY 1;

-- P17 Vendedor x PDV: carteira e estabilidade (só distribuições)
SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY n_pdv) p50_pdv_por_vendedor,
       PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY n_pdv) p90_pdv_por_vendedor, COUNT(*) vendedores
FROM (SELECT id_vendedor, COUNT(DISTINCT cnpj_pdv) n_pdv FROM dim_pdv GROUP BY 1);
SELECT n_vend, COUNT(*) pdv FROM (SELECT cnpj_pdv, COUNT(DISTINCT id_vendedor) n_vend
  FROM dim_pdv_historico WHERE dt_ref >= DATEADD(month,-12,CURRENT_DATE) GROUP BY 1) GROUP BY 1;

-- P18 Cadastro de SKU: completude, kits e ciclo de vida
SELECT COUNT(*) skus, COUNT_IF(familia_n4 IS NULL)/COUNT(*) pct_sem_taxonomia,
       COUNT_IF(peso IS NULL)/COUNT(*) pct_sem_peso, COUNT_IF(tipo_embalagem IS NULL)/COUNT(*) pct_sem_emb,
       COUNT_IF(is_kit_combo)/COUNT(*) pct_kit, COUNT_IF(dt_criacao >= DATEADD(month,-12,CURRENT_DATE)) skus_novos_12m
FROM dim_sku;
SELECT COUNT(DISTINCT sku) skus_com_venda_12m FROM fat_pedido_item WHERE dt_pedido >= DATEADD(month,-12,CURRENT_DATE);

-- P19 Fuso e calendário: tipo da coluna de data e hora local (sem linhas)
SELECT data_type FROM information_schema.columns WHERE column_name IN ('DT_PEDIDO','DT_FATURAMENTO');
SELECT CURRENT_TIMESTAMP() ts_sessao, CONVERT_TIMEZONE('America/Sao_Paulo', CURRENT_TIMESTAMP()) ts_sp;
```

## 5. Formas de consumo

| Artefato | Quem lê | Como | Por que / conteúdo |
|---|---|---|---|
| RF06 tabela única (última execução) | Inteligência Comercial (Helena), CRM (Camila): escolha de SKU e público; engenharia 3C: integração a Sírius/Salesforce (P§Escopo); A3Data: auditoria | `SELECT` no Snowflake (view para BI), ou carga automatizada para o Sírius; formato "especificado" não consta (Q) | HIPÓTESE de colunas: run_id, model_version, dt_execucao, semana_vigencia, mecanica, qualificacao_sku (novo/conhecido), cnpj_pdv, canal, regional, filial, area_atuacao, rank, sku, score, motivo/flag_fallback, flag_estoque_ok, grupo_ab. Contrato de schema e fallback é premissa 4 (P§) |
| RF06 agregada por Regional/Filial (Combos) | Inteligência Comercial | View `combos_regional_filial`: par, suporte, confiança, lift, nº de cestas, estabilidade | E§4.5.1: o time escolhe os combos e segue o fluxo de aprovação de preço |
| RF07 tabela SCD | A3Data (análise), Inteligência Comercial (o que foi recomendado quando), medição do A/B | Tipo 2: valid_from, valid_to, is_current, hash da recomendação | Rastreabilidade e auditoria do teste (E§1 "rastreabilidade"); permite reconstruir o que o PDV viu em cada semana. Retenção: política a definir (LGPD) |
| Dashboard D-1 (RNF02) | Camila (CRM), Helena (Inteligência Comercial), diretoria comercial para resumo | BI do cliente (ferramenta desconhecida; Q), atualização diária, filtros pelas aberturas mínimas | Painéis: (1) tamanho dos grupos A/B e balanceamento por estrato; (2) KPIs M01-M08 A x B com diferença e intervalo de confiança; (3) adoção/entrega da oferta (M09); (4) cobertura de recomendação (M10); (5) data de atualização e atrasos. Evitar "olhar" diário para decidir parada antecipada sem regra (peeking) |
| Relatório pré-execução RF02 | Cientista de dados e engenharia de dados (operação), CRM na exceção | Tabela/arquivo gerado a cada execução, antes do RF04/RF05; falha bloqueia ou alerta | Conteúdo proposto: por variável de entrada, distribuição da execução atual x últimas N execuções (nulos, mín/máx, percentis, categorias novas e ausentes, PSI); contagem de PDV por abertura; PDV elegível sem candidato após RF03 (estoque/compra recente); SKUs sem atributo em dim_sku; frescor da fonte (max data de pedido e estoque); limiares e status (OK/ALERTA/BLOQUEIO) |
| Consultas de conferência | A3Data com Inteligência Comercial | Reconciliação semanal: M01 do pipeline x relatório oficial do cliente (tolerância proposta ±0,5% em faturamento, a pactuar) | "Desconfiar até conferir"; ver Q de relatório de referência |
| Perguntas para agente (Amazon Quick / MCP) | Fora do escopo da POC; considerar pós-POC | — | Não incluir agora; mapeado apenas para evolução (P§M5 plano de continuidade) |

## 6. Lista de questionamentos e detalhes faltantes

| ID | Tipo | Área | Tema | Pergunta ou lacuna | Por que importa | Fonte | Bloqueante | Quando precisa | Responsável sugerido (cliente) | Hipótese de trabalho atual |
|---|---|---|---|---|---|---|---|---|---|---|
| DAD-Q01 | Questionamento | Métricas | Margem de contribuição | Qual a fórmula exata de margem de contribuição (receita líquida menos quais custos: CMV, frete, comissão, tributos, benefícios)? | É o KPI principal de sucesso; E§6 só subtrai descontos | E§1; E§6; P§Objetivo | Sim | Pré-contrato | Finanças/Controladoria (a indicar por Marcus Bruno) | Margem = faturamento líquido − custo variável por SKU; se não houver custo, KPI vira receita líquida de benefícios |
| DAD-D01 | Detalhe faltante | Dados | Custo por SKU | Existe custo/margem por SKU (e por filial/data) no Snowflake? Qual tabela, periodicidade e granularidade? | Sem custo não há M02 nem NBO orientado a margem | E§4.2.2; E§6 | Sim | Kickoff | Marcus Bruno (D&A) | Custo padrão mensal por SKU existe no SAP e pode ser levado ao Snowflake |
| DAD-Q02 | Questionamento | Métricas | Conversão | Conversão é (E§1) clientes sem compra que compram na campanha, ou (E§6) ativos no mês / base total? Qual o denominador oficial? | Dupla definição dá resultados incomparáveis e dilui o efeito | E§1; E§6 | Sim | Kickoff | Helena (Inteligência Comercial) | Numerador/denominador = elegíveis atribuídos ao grupo, janela da campanha |
| DAD-Q03 | Questionamento | Métricas | Cliente "ativo" | Qual a definição oficial de "cliente ativo" e de "ativou no mês" (≥1 pedido faturado em N dias)? A meta de base ativa usa qual regra? | Meta de base ativa orienta a mecânica Desconto | E§2.1.3; E§6 | Sim | Kickoff | Helena (Inteligência Comercial) | Ativo = ≥1 pedido faturado em 60 dias (coerente com "sem compras 60d") |
| DAD-D02 | Detalhe faltante | Dados | Cesta por pedido | Há tabela pedido-item (id_pedido, SKU, qtd, valor, data) no Snowflake, desde quando e com qual defasagem? A "Feature Store" traz pedido ou só agregados? | MBA e Personalize (interactions) exigem granularidade de pedido; E§4.2.1 só descreve agregados | E§4.2.1; E§4.5.1; P§Premissa 9 | Sim | Pré-contrato | João Pedro Felismino (Engenharia) | Existe pedido-item na camada SAP→Snowflake, fora da Feature Store |
| DAD-D03 | Detalhe faltante | Dados | Exposição à campanha | Onde ficam as campanhas enviadas (Sírius/Salesforce): ID, mecânica, SKU, público, data de envio, canal, entrega/abertura? Há extração para o Snowflake? | Sem exposição não há ITT nem adoção; mensuração está no Salesforce | P§Premissa 5; E§4.5 | Sim | Kickoff | Camila (CRM) | Exportar tabela de exposição diária do Salesforce/Sírius para o Snowflake |
| DAD-Q04 | Questionamento | Métricas | Atribuição de pedido | Pedido do cliente leva marca de campanha/benefício no item? Como saber se a compra usou a oferta? | Necessário para M09 e para separar efeito da campanha | E§6; E§1 | Não | M1 | Camila (CRM) | Item de pedido tem id_campanha/código de benefício no SAP/Sírius |
| DAD-Q05 | Questionamento | Dados | Unidade de randomização | O A/B randomiza por PDV, CNPJ raiz (rede) ou cliente? Como tratar rede/matriz-filial e PDV com vários CNPJ? | Define unidade de análise, contaminação e n | E§1; P§Premissa 2 | Sim | Kickoff | Helena (Inteligência Comercial) | Randomização por PDV (CNPJ), estratificada pelas aberturas mínimas |
| DAD-Q06 | Questionamento | Negócio | Contaminação por vendedor | O mesmo vendedor atende PDV do grupo A e do B? Ele sabe do teste e pode favorecer um grupo? | Spillover e viés do vendedor reduzem validade | E§4.1.3; E§1 | Não | M1 | Helena (Inteligência Comercial) | Há mistura; usar cluster por vendedor se a contaminação for alta |
| DAD-Q07 | Questionamento | Métricas | KPI primário e aberturas | Qual é o único KPI primário por mecânica e quais aberturas são pré-registradas? Quais KPIs são secundários? | Evita multiplicidade (análise "por abertura") e p-hacking | E§1; E§6; P§Premissa 2 | Sim | Kickoff | Helena (Inteligência Comercial) | Primário = margem de contribuição; secundários = demais KPIs de E§6; aberturas = canal × regional do piloto |
| DAD-D04 | Detalhe faltante | Métricas | MDE e critérios | Qual melhora mínima relevante em margem (pp ou R$/PDV) justifica adotar o algoritmo? Qual alfa/poder aceitos? | Entrada do cálculo de amostra e critério de sucesso | E§1; P§Premissa 2 | Sim | Kickoff | Diretoria comercial (via Marcus Bruno) | α 5%, poder 80%, MDE a definir com base em P14 |
| DAD-D05 | Detalhe faltante | Métricas | Duração e nº de campanhas | Quantas campanhas por mecânica, de qual duração e com que espaçamento? Há carryover entre campanhas? | Determina n efetivo, poder e efeito residual | E§4.5; P§M2-M5 | Não | Kickoff | Camila (CRM) | 1 campanha por mecânica de 4 semanas, sem sobreposição |
| DAD-Q08 | Questionamento | Métricas | Devoluções e cancelamentos | Como tratar devoluções, cancelamentos, bonificações e pedidos faturados e depois cancelados nos KPIs? Em qual data se desconta a devolução? | Altera Faturamento, Margem, Frequência e Conversão | E§6 | Não | M1 | Helena (Inteligência Comercial) | Cancelado fora; devolução subtrai na data do pedido original |
| DAD-D06 | Detalhe faltante | Dados | Preço e desconto praticado | Onde está o preço de tabela e o desconto efetivamente praticado por SKU/região/data? Há tabela de preços por filial? | Base de M02, profundidade do desconto e do Mais por Menos | E§1; E§4.5 (fluxo de price) | Sim | Kickoff | Time de Price (a indicar) | Preço e desconto estão no SAP por item de pedido |
| DAD-D07 | Detalhe faltante | Dados | Estoque | Qual fonte, granularidade (CD/filial), frequência e histórico de snapshot de estoque? "Disponível" inclui reservado/em trânsito? | RF03 remove SKU sem estoque; backtest sem snapshot é otimista | E§5 RF03 | Sim | M1 | João Pedro Felismino (Engenharia) | Estoque por CD/filial, diário, sem histórico anterior a 2026 |
| DAD-Q09 | Questionamento | Dados | Regra "compra recente" | "Itens já comprados no mês" é mês-calendário ou 30 dias móveis? Vale para Mais por Menos e Desconto, que visam recompra? | Pode zerar o candidato de Mais por Menos | E§5 RF03; E§2.1.2; E§4.3.1.2 | Não | M1 | Helena (Inteligência Comercial) | Exclusão só em Combos e SKU novo; Mais por Menos e Desconto usam janela móvel configurável |
| DAD-Q10 | Questionamento | Dados | Janela de 1 mês | A janela de 1 mês (E§4.1.5) é exigida mesmo sem agregado 1m na Feature Store? "Meses fechados e performados" significa o quê? | Define derivação a partir de pedido-item e a defasagem de dados | E§4.1.5; E§4.2.1 | Não | M1 | Marcus Bruno (D&A) | Janela de 1m derivada de pedido-item; mês fechado = mês anterior |
| DAD-D08 | Detalhe faltante | Dados | Histórico mínimo | Existe histórico anterior a mai/25 no SAP/Snowflake? Pode ser carregado? | "SKU novo" é censurado em mai/25 e sazonalidade tem ≤ 1,5 ciclo | E§4.2.1; E§4.3.1.2 | Não | Kickoff | João Pedro Felismino (Engenharia) | Há histórico no SAP; carga de 24-36 meses seria viável |
| DAD-D09 | Detalhe faltante | Dados | Dicionários | Dicionários de dados das Features Stores de Clientes e Produtos: disponíveis? Prazo para o de Produtos? | Sem dicionário não há schema, tipos nem regras; Produtos é gate do MBA | E§4.2.1; E§4.2.2; RNF01; P§Premissa 1 | Sim | Pré-contrato | Marcus Bruno (D&A) | Dicionário de Clientes pronto; Produtos entregue até o fim do M1 |
| DAD-D10 | Detalhe faltante | Dados | Conteúdo de Visitação | O que a base de Visitação contém (visitas, motivo, resultado, data)? Entra como feature? | Item em branco na especificação | E§4.2.1 | Não | M1 | Camila (CRM) | Visitas por PDV/vendedor/data; uso opcional |
| DAD-D11 | Detalhe faltante | Dados | Calendário promocional | Existe histórico de campanhas e promoções (mecânica, SKU, período, público)? | Controle de confundidor e baseline gerencial | E§1 | Não | Kickoff | Helena (Inteligência Comercial) | Histórico no Sírius, parcial desde 2025 |
| DAD-Q11 | Questionamento | Dados | Sazonalidade | Quais sazonalidades afetam o café B2B (Páscoa, Natal, inverno, safra, datas por canal) e quais devem estar no período do teste? | Evita rodar o teste em janela atípica | E§4.1.5 | Não | Kickoff | Helena (Inteligência Comercial) | Evitar Q4 para o teste ou balancear A/B (já garantido por randomização simultânea) |
| DAD-D12 | Detalhe faltante | Dados | Vendedor x PDV | Existe carteira histórica (vendedor, área de atuação, vigência)? Com que frequência troca? | Aberturas por área do vendedor usam atributo mutável | E§4.1.3; E§4.2.1 Cadastro | Não | M1 | Marcus Bruno (D&A) | Cadastro guarda só a carteira atual |
| DAD-Q12 | Questionamento | Dados | Abertura Canal | "B2B" é canal (E§4.1.1) e também o escopo do projeto. Qual a definição de Varejo/Food/B2B e área de atuação (Canal Verde etc.)? | Ambiguidade nas aberturas | E§4.1.1; E§4.1.3 | Não | Kickoff | Helena (Inteligência Comercial) | Canal = atributo do cadastro; área de atuação = atributo do vendedor |
| DAD-D13 | Detalhe faltante | Dados | Capital x interior | Qual atributo identifica capital x interior (município/IBGE)? | Aberturas mínimas | E§4.1.2 | Não | M1 | Marcus Bruno (D&A) | Derivar de município com tabela IBGE |
| DAD-D14 | Detalhe faltante | Dados | Combos e BOM | Combos serão cadastrados como SKU novo? Existe tabela de composição e histórico de combos? | Cobertura do SKU alvo e Sortimento dependem da expansão | E§2.1.1; E§6 | Sim | M1 | Helena (Inteligência Comercial) | Combo vira SKU novo no pedido; BOM fornecido por Inteligência Comercial |
| DAD-Q13 | Questionamento | Métricas | Cobertura do SKU alvo | Cobertura = % de PDV atribuídos ou % de PDV expostos que compram o SKU alvo? Conta compra do combo ou do SKU avulso? | Define a métrica de sucesso do Combo | E§1 | Não | Kickoff | Helena (Inteligência Comercial) | % dos atribuídos (ITT) com ≥1 compra do SKU alvo, incluindo combo |
| DAD-Q14 | Questionamento | Métricas | Volume médio | Volume médio por PDV atribuído ou por PDV comprador? Em qual unidade (caixa, kg, unidade)? Há meta por PDV? | Mais por Menos visa atingimento de volume | E§1; E§2.1.2 | Não | Kickoff | Helena (Inteligência Comercial) | Por PDV atribuído, em unidade padrão da dim_sku |
| DAD-Q15 | Questionamento | Métricas | Ticket médio | Ticket médio entra como KPI? Em E§1 é citado, em E§6 não | Combos visam ticket (E§2.1.1) | E§1; E§2.1.1; E§6 | Não | Kickoff | Helena (Inteligência Comercial) | Incluir = faturamento / pedidos |
| DAD-Q16 | Questionamento | Dados | Baseline gerencial | O baseline "como é hoje" tem escolhas históricas de SKU registradas? O grupo A seleciona SKUs por qual critério e quando? | Para o lift, e para saber se o controle é comparável | E§1; E§4.5 | Não | M1 | Helena (Inteligência Comercial) | A escolha gerencial é registrada nos pedidos de campanha |
| DAD-Q17 | Questionamento | Métricas | Mínimos MBA | Há preferências para suporte, confiança e lift mínimos e para o nº de combos por abertura? Cesta = pedido ou cliente-mês? | Calibra o número de combos viáveis | E§4.5.1; E§2.1.1 | Não | M1 | Helena (Inteligência Comercial) | Cesta = pedido; limites calibrados na EDA (lift ≥ 1,2) |
| DAD-Q18 | Questionamento | Métricas | k das recomendações | Quantos SKUs por PDV e mecânica (k)? Há restrições (mesmo SKU em A e B, SKU por família)? | Define precision@k, recall@k e RF06 | E§2.1; RF06 | Não | M1 | Helena (Inteligência Comercial) | k = 5 em NBO; ranking completo gravado |
| DAD-D15 | Detalhe faltante | Dados | Formato RF06/RF07 | Qual o "formato especificado" das tabelas RF06 e RF07 (colunas, chave, SCD tipo, retenção)? | Contrato com Sírius e BI | E§5 RF06; RF07; P§Premissa 4 | Sim | M1 | João Pedro Felismino (Engenharia) | Colunas de §5; SCD tipo 2 |
| DAD-D16 | Detalhe faltante | Dados | Fechamento da semana | Qual o dia e hora do fechamento da semana, e a defasagem SAP→Snowflake? Pedidos entram com atraso (faturamento x pedido)? | Gatilho do DAG semanal e janelas de teste | E§4.4.2 | Não | M1 | João Pedro Felismino (Engenharia) | Semana fecha domingo; dados D+1 completos |
| DAD-Q19 | Questionamento | Negócio | Frequência de uso | Recomendação semanal chega a tempo do processo de aprovação de price? Qual o lead time entre RF06 e envio? | Recomendação pode vencer antes do uso | E§4.4.2; E§4.5 | Não | M1 | Camila (CRM) | Lead time de uma semana; recomendações valem 1 semana |
| DAD-Q20 | Questionamento | Métricas | Elegibilidade | Quais regras de elegibilidade (bloqueio de crédito, inadimplência, PDV novo, mínimo de histórico) valem em cada mecânica? | Define população e viés de seleção | E§4.5.2; E§4.5.3; E§4.2.1 | Não | Kickoff | Helena (Inteligência Comercial) | Ativo, não bloqueado, ≥ 1 compra desde mai/25 |
| DAD-Q21 | Questionamento | Dados | Relatório de referência | Qual relatório oficial (Power BI, SAP, outro) serve de referência para conferir faturamento e frequência? Qual tolerância? | Conferência contra fonte da verdade | E§6 | Não | M1 | Helena (Inteligência Comercial) | Relatório existe; tolerância ±0,5% |
| DAD-Q22 | Questionamento | Dados | Ferramenta do dashboard | Qual BI/ferramenta será usado em RNF02? Quem desenvolve, e quando (data TBD)? "Camila CRM?" é o dono? | Item de escopo do cliente sem dono confirmado | E§7 RNF02; RNF03 | Sim | Kickoff | Camila (CRM) | BI do cliente; construído por 3C |
| DAD-Q23 | Questionamento | Dados | LGPD | CNPJ de MEI/empresário individual e dados de contato/vendedor constam nas bases? Pode-se mascarar ou hash nas consultas? | A3 é operadora; consulta sem dado pessoal | E§4.2.1 Cadastro | Sim | Pré-contrato | Encarregado de dados / DPO 3C | CNPJ tratado como identificador; sem dados de contato nas consultas |
| DAD-D17 | Detalhe faltante | Dados | Volumetria | Quantos PDV ativos, SKUs ativos e linhas de pedido por mês? Quantos PDV há na primeira família e regional do piloto? | Poder estatístico e dimensionamento | P§Situação; P§Escopo | Sim | Pré-contrato | Marcus Bruno (D&A) | "Centenas de milhares" de PDV; piloto com dezenas de milhares |
| DAD-Q24 | Questionamento | Negócio | Piloto | Quais as 1-2 famílias de produto e aberturas do piloto? | Reduz n e define fronteira de MBA/NBO | P§Escopo | Sim | Kickoff | Marcus Bruno (D&A) | Uma família de maior giro e duas regionais |
| DAD-Q25 | Questionamento | Dados | Exportação do Snowflake | O Snowflake do cliente pode ser lido pelo ambiente A3 ou pelo Personalize (fora do Brasil)? Há restrição de exportação? | Define onde ocorre a medição e se a base cabe no Personalize (users/items/interactions) | P§Premissa 9; R§ (Snowflake x S3) | Sim | Pré-contrato | Segurança/TI 3C | Cálculo no Snowflake; só agregados exportados |
| DAD-Q26 | Questionamento | Métricas | Métricas offline de aceite | O cliente quer critérios mínimos de qualidade offline (precision@k, coverage) antes de ir para o campo? Quais? | Gate para 1ª campanha e para champion x challenger | P§Premissa 6; E§1 | Não | M1 | Marcus Bruno (D&A) | Critério: superar baseline "mais vendidos da abertura" em precision@k no backtest |
| DAD-D18 | Detalhe faltante | Dados | Novos SKUs | Quais SKUs são lançamentos, descontinuados ou sem histórico? Como tratar na recomendação (cold start)? | Qualificação "SKU novo" (E§4.3.1.2) | E§4.3.1.2; E§4.2.2 | Não | M1 | Marcus Bruno (D&A) | Lançamentos entram por atributos de produto (Feature Store de Produtos) |
| DAD-D19 | Detalhe faltante | Dados | Restrições logísticas | Existe pedido mínimo, múltiplo de caixa ou rota que limitem a recomendação por filial? | Recomendação inexecutável reduz conversão | E§4.2.2 Especificações técnicas | Não | M2+ | Logística (a indicar) | Sem restrição relevante |
