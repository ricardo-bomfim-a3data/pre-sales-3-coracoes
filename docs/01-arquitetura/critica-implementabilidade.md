# Crítica de implementabilidade · 3 Corações · Recomendação de SKU (NBO/MBA) B2B

Versão: v1 · 2026-10-26 · Autor: [ENG] · Status: rascunho para o coordenador (pré-vendas)
Base: E§ (especificação v0), P§ (proposta V1 jun/2026), R§ (reunião interna 2026-10-22), diagramas v1 (opções A/B/C, DAG semanal, contexto F0/F1/F2).
Nota de 28/10/2026: esta crítica é de 26/10 e analisa as opções A a C (v1/v2). A direção vigente é a Opção E (ADR-003): Personalize para NBO, mais por menos e MBA (SIMS, com as métricas no Glue), sem SageMaker AI, cronograma W0 a W6. Onde o texto citar SageMaker AI como alternativa (H3) ou "mês 1", leia como histórico.
Escopo: implementabilidade, abordagem técnica recomendada, esforço, riscos e lacunas. Não decide arquitetura (ARQ) nem requisitos (NEG).

Convenção: FATO (com fonte), INFERÊNCIA, SUPOSIÇÃO, A VERIFICAR.

---

## 0. Resumo para decisão

1. A opção C (MVP em lote no Snowflake + Personalize como benchmark) é a única implementável dentro de E§4.4 sem dado sair do Brasil no caminho crítico. Do ponto de vista de engenharia, ela é **mais simples** que a A, não mais cara: NBO/MBA para centenas de SKUs em B2B cabem em SQL + Snowpark.
2. O squad da proposta **não tem engenheiro de dados** e o Eng. ML sai no M3, justamente quando o DAG semanal entra em operação durante as campanhas A/B (M2–M5). A proposta empurra "engenharia de dados", "pipelines de dados e IA" e "integração" para a 3C (P§Escopo; P§Premissas 1, 9, 10), mas a especificação pede notebooks integrados, DAG e RF06/RF07 como entregáveis (E§4.4.1–4.4.3, E§5). Essa ambiguidade de fronteira é o maior risco de prazo.
3. A proposta diz "Pipeline batch 100% manual" (P§Escopo Inicial, rodapé) e a especificação exige orquestração semanal via Airflow + execução manual (E§4.4.2–4.4.3). Precisa ser resolvido antes do contrato.
4. O gate "MBA depende da Feature Store de Produtos" (P§Premissa 1; diagrama DAG "MBA · Combo se FS Produtos ok") está no componente errado: MBA precisa só de faturamento (pedido × SKU) e de um mestre mínimo de SKU. Quem depende de atributos de produto é o NBO de **itens novos** (cold start). Sugiro inverter o gate.
5. Engenharia estimada (sem modelagem): ~11–13 semanas-pessoa para o núcleo da opção C; +3–4 para o trilho Personalize; +3–4 se a API REST por CNPJ do M3 (P§Escopo Inicial) continuar no escopo. O Eng. ML tem ~12,6 semanas-pessoa (504 h, P§Investimento). INFERÊNCIA: não cabe com Personalize + API; cabe apertado só com o núcleo, e a operação M4–M5 fica descoberta.

---

## 1. Simples × difícil, por bloco

### 1.1 Integração Snowflake (Snowpark, UDFs, warehouse, storage integration)

| Item | Simples / difícil | Por quê | Recomendação |
|---|---|---|---|
| Leitura RF01 via Snowpark DataFrame / SQL | Simples | Dado já está no Snowflake (FATO: E§4.2.1, R§ detalhes). | Toda a preparação em SQL/Snowpark pushdown; nada de `to_pandas()` em tabela de faturamento inteira. |
| Treino em stored procedure Python (Snowpark) | Médio | Treino roda em um nó do warehouse; memória limita. Volume estimado (centenas de milhares de PDVs × centenas de SKUs, P§Situação Atual) cabe em warehouse Snowpark-optimized (INFERÊNCIA). | Stored procedure de treino em warehouse dedicado Snowpark-optimized (tamanho A VERIFICAR com volumetria); scoring em UDF vetorizada (batch) ou dentro do procedure. |
| Pacotes (lightgbm, implicit, mlxtend) | **Difícil se política restritiva** | Depende do canal Anaconda/pacotes aceitos pela conta e da política de segurança da 3C. `lightgbm` é comum no canal; `implicit` e `mlxtend`: A VERIFICAR. Pacote fora do canal exige upload de wheel em stage (só Python puro) ou Container Runtime. | Desenhar para não depender de `implicit`/`mlxtend`: MBA em SQL; NBO com LightGBM + features de co-ocorrência calculadas em SQL. |
| Warehouse e custo de créditos | Simples técnico, sensível comercial | Quem paga créditos do projeto não está definido. | Warehouse dedicado ao projeto + resource monitor; custo por execução registrado em tabela de controle. |
| Storage integration para S3 (trilho Personalize) | **Difícil por governança** | Exige papel com privilégio de criar integration (normalmente ACCOUNTADMIN), trust IAM com external ID, política de rede de saída, e o Snowflake pode estar em outra nuvem/região (região "a confirmar" nos diagramas). Saída de dado para us-east-1 = LGPD. | Só no trilho de benchmark, depois do gate G0 jurídico. Views de export com ID pseudonimizado e colunas mínimas; mapa ID↔CNPJ nunca sai do Snowflake. |

### 1.2 Notebooks "com a stack interna" (E§4.4.1)

| Hipótese | Impacto em engenharia | Risco |
|---|---|---|
| H1 · Snowflake Notebooks (warehouse ou Container Runtime) | Menor atrito: dado não sai, Git integration, execução agendável/acionável por SQL (comando de execução de notebook e disponibilidade do Container Runtime na região/nuvem da conta: A VERIFICAR). | Notebook como unidade de produção é frágil (estado oculto, teste difícil). |
| H2 · Jupyter on-prem / JupyterHub da 3C | Dado sai do Snowflake para a máquina via connector: volume, RAM, credencial de usuário, rede/VPN (P§Premissa geral 08). Airflow teria de executar via Papermill em worker com acesso. | Execução semanal dependente de servidor que a A3 não controla; credencial pessoal em produção. |
| H3 · SageMaker (AI Studio / Processing) | Exige conta AWS da 3C, região (sa-east-1 tem SageMaker; Personalize não — FATO, ver §1.10), extração de dados do Snowflake, IAM. Contradiz "stack interna" se a 3C não usa AWS hoje. | Mais componentes, novo custo, dado fora do Snowflake. |

Recomendação de engenharia (independente da hipótese): **código em pacote Python versionado (`src/`)** com funções RF01–RF07 testáveis; notebooks finos que importam o pacote (exploração, relatório RF02, demonstração ao cliente); produção executa as mesmas funções como stored procedures Snowpark chamadas pelo Airflow. Isso cumpre a letra de E§4.4.1 ("notebooks com funções capazes de automatizar") sem fazer do notebook o artefato de produção. A hipótese H1 é a de menor esforço; H2 adiciona ~1 semana-pessoa e risco operacional; H3 adiciona ~2 semanas-pessoa e uma decisão de arquitetura (ARQ).

### 1.3 DAG semanal no Airflow da 3C (E§4.4.2–4.4.3)

- Simples: DAG linear com `SQLExecuteQueryOperator`/operadores do provider Snowflake chamando procedures (`CALL rec.sp_rf02(...)`). Lógica pesada fica no Snowflake; worker do Airflow só orquestra. Funciona em qualquer hospedagem (MWAA, Astronomer, self-hosted).
- Difícil (dependências do cliente, não técnica):
  - Versão do Airflow (2.x × 3.x muda API de params/assets e providers) e versão do provider Snowflake: A VERIFICAR com a 3C.
  - Deploy de DAG: repositório, CI, quem aprova, janela de deploy. Em clientes com processo de mudança, cada ajuste no DAG vira 1–2 semanas de calendário.
  - Segredos: conexão Snowflake com usuário de serviço e key-pair (sem senha), em secrets backend do cliente.
  - Sensor de "semana fechada": depende de um sinal confiável da ingestão SAP (tabela de controle ou freshness). Sem isso, o nó "Dados da semana prontos?" do diagrama vira heurística.
- Execução manual (E§4.4.3): `params` validados (semana_ref, mecânicas, `force_new_version`), `max_active_runs=1` para evitar duas execuções concorrentes escrevendo RF06/RF07. O diagrama diz "reexecutar a mesma semana não duplica a RF07"; E§4.4.3 pede justamente **atualizações dentro da semana**. As duas coisas são compatíveis só se a idempotência for por `run_id` (mesmo snapshot de entrada) e não por semana — ver §1.9.
- Alerta de não execução ("segunda 12h" no diagrama): SLA/`sla_miss` (2.x) ou DAG watchdog separado; canal de alerta do cliente a definir.

### 1.4 Ingestão SAP → Snowflake

- FATO: SAP é origem e Snowflake é a camada analítica (R§ detalhes 00:43:11); a FS Clientes existe desde mai/25 (E§4.2.1). INFERÊNCIA: faturamento e cadastro já chegam ao Snowflake. Estoque: "fonte a definir (RF03)" nos três diagramas — **não há evidência de que estoque esteja no Snowflake**.
- O que mapear (não construir): ferramenta e frequência da ingestão; tabelas de faturamento (item de nota/pedido, com devolução e cancelamento); mestre de cliente (CNPJ × código SAP, matriz/filial); mestre de material (status, data de criação, hierarquia); estoque por centro/depósito × filial comercial; hierarquia comercial (filial→regional→canal, área do vendedor) com histórico.
- Latência de fechamento: "fechamento da semana" não está definido (dia/hora, se considera faturado ou pedido, se devoluções posteriores reabrem a semana). Se o faturamento chega D-1, o DAG de segunda de manhã pode rodar com semana incompleta.
- RF03 "compra no mês" usa o mês corrente: exige faturamento D-1 no momento da execução, não só a semana fechada.
- Se a ingestão de algum item (estoque, por exemplo) **não existir**, construir SAP→Snowflake é G (SLT/ODP/conector, rede, Basis) e está fora do squad e do prazo. Tratar como premissa 3C com data.

### 1.5 Pré-processamento RF02 / RF03

- RF02 (perfil de domínio): simples em SQL — contagens e distribuições por coluna categórica (canal, filial, área, família) comparadas com as últimas N execuções; valores novos/ausentes; nulos; volume por abertura. Saída em tabela `rf02_perfil` + regra de gate (bloqueia/alerta). Esforço M, sobretudo para definir limiares com o cliente.
- RF03 estoque: o difícil é semântico, não código: granularidade (centro × filial), "falta" = zero ou abaixo de cobertura, frescor (snapshot semanal pode recomendar item que zerou na terça). Mitigação: aplicar filtro de estoque também no consumo (Sírius/B2B) ou reexecução manual intra-semana.
- RF03 compra no mês: simples se "mês" = mês calendário corrente e faturamento D-1 disponível; ambíguo se "últimos 30 dias".
- Point-in-time: features de treino devem usar a hierarquia comercial vigente na data (PDV muda de vendedor/filial). Sem histórico, há vazamento leve; aceitável na POC se documentado.

### 1.6 NBO (RF04)

- Duas saídas com grãos diferentes, já refletidas no diagrama C:
  - Desconto (E§2.1.3, E§4.5.2): ranking de SKUs por PDV (PDV → top-N SKUs), público sem compra ≥ 60 dias.
  - Mais por Menos (E§4.5.3): SKU definido por negócio → ranking de PDVs (SKU → público). Mesmo modelo de propensão, consulta transposta. O schema da RF06 precisa suportar os dois grãos.
- Dois modelos por qualificação (E§4.3.1.2):
  - Já comprados (recompra): problema de reposição/ciclo — features de recência por SKU, intervalo médio entre compras, tendência de volume. LightGBM binário ou ranking (lambdarank) por PDV × SKU candidato. Regras-base (recência × frequência) são baseline forte.
  - Itens novos (penetração): problema de cross-sell/cold start. Candidatos por co-ocorrência (item-item em SQL) e popularidade por abertura; ranking com LightGBM usando features de similaridade de PDV (cluster RFV, canal, área). ALS implícito ajuda pouco com centenas de SKUs (INFERÊNCIA) e cria dependência de pacote.
- Recomendação: **um pipeline de geração de candidatos + um ranker LightGBM por qualificação**, com abertura como feature e avaliação por abertura — não um modelo por abertura × janela. Janelas 1/3/6/9/12 meses (E§4.1.5) viram features, não modelos.
- Explosão de combinações se cada abertura virar modelo: 3 canais × N filiais × 6 áreas × 5 janelas × 2 qualificações × 3 mecânicas = milhares de modelos (INFERÊNCIA). Inoperável na POC.
- Avaliação offline com split temporal (treina até semana t, avalia t+1..t+4), métricas precision@k/recall@k/cobertura por abertura, contra baseline gerencial e popularidade por filial.

### 1.7 MBA (RF05)

- Para combos de 2 (âncora + complemento, E§2.1.1) ou 3 SKUs, **SQL puro no Snowflake** resolve: self-join de itens no mesmo pedido (ou mesmo PDV × janela), contagem de pares, suporte, confiança, lift por abertura. Para centenas de SKUs, o espaço de pares é de dezenas a centenas de milhares — trivial.
- FP-Growth/Apriori só se combos > 3 itens; aí `mlxtend` (A VERIFICAR no canal) ou Snowpark ML. Não recomendo para a POC.
- Pontos difíceis reais:
  - Unidade de cesta: pedido (nota) × PDV-janela. Em B2B o pedido é grande e recorrente; lift por pedido fica dominado por itens âncora. Testar as duas.
  - Suporte mínimo por abertura: filial pequena tem poucas cestas → regras espúrias. Exige n mínimo + backoff (§1.8).
  - E§4.5.1 pede MBA "na visão de cliente" agregado em Regional/Filial: pares por PDV primeiro, depois ranking agregado por filial ponderado por cobertura.
- Não depende da FS Produtos (só mestre mínimo de SKU ativo). Ver ACHADO ENG-03.

### 1.8 Backoff por abertura (filial → regional → canal → nacional)

- Simples em SQL: calcula estatística em todos os níveis, escolhe o nível mais específico que atinge n mínimo (cestas, PDVs, interações) via `COALESCE`/`QUALIFY ROW_NUMBER()`. Grava `nivel_abertura_usado` na saída — essencial para explicar ao negócio e para a análise A/B.
- Difícil: definir limiares com o cliente e garantir que o backoff respeite E§4.3.1.1 (recomendação do Sul não ir para o Norte). Nacional pode violar isso; talvez o último nível deva ser canal × macro-região.

### 1.9 Tabelas RF06 e RF07

- Formato "conforme especificado" (E§5 RF06/RF07) **não está especificado** no documento. P§Premissa 4 atribui o contrato da tabela à 3C.
- RF06 (última execução): escrever em tabela de staging, rodar testes de contrato (chaves únicas, top-N completo, nenhum SKU sem estoque, nenhum PDV fora de domínio), e publicar com troca atômica (`ALTER TABLE ... SWAP WITH`). Mais simples e seguro que MERGE para "última versão".
- RF07 (SCD): duas leituras possíveis:
  - (a) histórico append-only por execução (`run_id`, `semana_ref`, `executado_em`, `vigente_de/ate`) + view "vigente". Simples, auditável, é o que a análise A/B precisa (o que foi exposto em cada momento).
  - (b) SCD2 clássico por chave natural (PDV × mecânica × qualificação × posição), fechando registro só quando muda. Mais compacto, MERGE mais complexo, e execução manual intra-semana cria versões curtas.
  - Recomendação: (a) como armazenamento + view SCD2 derivada se o consumidor exigir. MERGE idempotente por `run_id` (reexecutar o mesmo run não duplica; novo run manual gera nova versão e fecha a anterior). Isso concilia o diagrama ("não duplica") com E§4.4.3 ("atualizações dentro de cada semana").
- Volume (INFERÊNCIA, a confirmar com cardinalidades): 300 mil PDVs × top-10 × 2 qualificações × 2 mecânicas por PDV ≈ 12 M linhas/execução; 52 semanas ≈ 0,6 bi linhas/ano em (a). Confortável no Snowflake com clustering por `semana_ref`; definir retenção (LGPD + custo).
- Colunas mínimas: `run_id`, `model_version`, `mecanica`, `qualificacao`, `pdv_id`, `sku`, `rank`, `score`, `nivel_abertura_usado`, `grupo_ab`, `motivo_exclusao` (para auditoria do RF03), `vigente_de`, `vigente_ate`.

### 1.10 Amazon Personalize (trilho benchmark da opção C; motor da opção A)

- FATO: Amazon Personalize não está disponível em sa-east-1 (status "isNotExpandingIn") e está disponível em us-east-1 (AWS Regional Availability, consulta 2026-10-26).
- FATO: mínimo para treinar: 1.000 interações e 25 usuários com ≥ 2 interações; recomendado 50 mil interações de ≥ 1.000 usuários; dataset de interações com no máximo 5 colunas de metadados; import FULL até 100 GB, INCREMENTAL até 1 GB por job (docs.aws.amazon.com/personalize/latest/dg/limits.html e readiness-checklist.html, 2026-10-26). Volume não é problema; o risco de "dados insuficientes" é por abertura/filial, não global.
- Export: views pseudonimizadas → `COPY INTO @stage_s3` (CSV com cabeçalho no schema Avro do dataset) → dataset import job. Users (canal, filial, área, cluster RFV), Items (família, status), Interactions (PDV, SKU, timestamp, EVENT_TYPE=compra, EVENT_VALUE=quantidade/valor).
- Batch inference: arquivo JSON Lines com `userId` (ou `itemId` para Item-Affinity/segmento) → saída JSON no S3 → `COPY INTO` no Snowflake + parse de JSON → mesma RF06 de benchmark. Orquestração em DAG separado (já previsto no diagrama).
- Encaixe por mecânica:
  - Desconto: User-Personalization-v2 com filtro excluindo comprados (bom encaixe).
  - Mais por Menos: Item-Affinity (segmentação de usuários por item) — bom encaixe.
  - Combo/MBA: **não há equivalente** (sem suporte/confiança/lift, sem regras por abertura); Similar-Items aproxima "comprados juntos", mas não entrega regras auditáveis por filial. MBA fica no Snowflake nas três opções.
  - RF03 estoque por filial é contexto PDV × SKU: filtros do Personalize operam sobre atributos de item/usuário; aplicar estoque por filial exige pós-filtro no Snowflake.
  - Aberturas: modelo único global + filtros; não reproduz "um modelo por qualificação" nativamente (dá para usar dois filtros).
- Custo: P§Infra estima ~US$ 924/mês; R§ (00:10:36) cita ~US$ 5.000/mês + taxa por GB. Divergência de 5×; ARQ deve recalcular com a calculadora (preço por hora de treino, por GB ingerido e por recomendação em lote: A VERIFICAR).
- Esforço real: não está no código, está em conta AWS da 3C, IAM, KMS, storage integration, parecer jurídico e ciclo treino/lote (horas por iteração).

### 1.11 Serving online futuro (F2: API por CNPJ, DynamoDB, Lambda)

- Técnico simples (M–G): recomendações pré-calculadas → S3 → carga em DynamoDB (chave `pdv_id#mecanica`) → Lambda + API Gateway. Tudo disponível em sa-east-1 (INFERÊNCIA consolidada; não consultado).
- Difícil: carga semanal sem janela de inconsistência (tabela por versão + ponteiro de versão vigente, ou import em tabela nova + troca), autenticação do App B2B/Sírius, CNPJ como chave (dado de PJ, mas MEI = pessoa física → LGPD), dono de operação 24×7.
- Se as recomendações vierem do Snowflake (opção C), F2 **não precisa de Personalize** nem de us-east-1; só de export Snowflake→S3 sa-east-1. Isso desacopla a escala da decisão Personalize.
- A proposta coloca API + NoSQL no M3 (P§Escopo Inicial). Na opção C isso é F2. Se a API ficar no contrato, é +3–4 semanas-pessoa de engenharia e um integrador do lado 3C.

---

## 2. Esforço por componente

Escala: P (até 1 dia), M (até 1 semana), G (mais de 1 semana). Semanas-pessoa (sp) indicativas para somar. Premissas gerais: ingestão SAP→Snowflake de faturamento, cadastro e estoque já existe; acesso ao Snowflake e ao Airflow liberado até a semana 2 (P§Premissa 3); hipótese H1 de notebooks; MBA em SQL; pilotagem com aberturas priorizadas (P§Escopo).

| # | Componente | Tamanho | sp | Quem na proposta | Observação |
|---|---|---|---|---|---|
| 1 | Acessos, ambientes, usuário de serviço, repo, warehouse | M | 1 | Eng ML + 3C | Calendário depende da 3C (2–4 semanas típicas). |
| 2 | Discovery de dados, contrato de dados, mapeamento de fontes | G | 2 | Cientista + Eng ML | Sem engenheiro de dados dedicado. |
| 3 | RF01 leitura | P | 0,2 | Eng ML | — |
| 4 | RF02 perfil + gate | M | 1 | Eng ML | Limiares com o cliente. |
| 5 | RF03 estoque + compra no mês | M | 1 | Eng ML | G se estoque não estiver no Snowflake (fora do squad). |
| 6 | Feature pipeline (janelas, aberturas, RFV) em SQL/Snowpark | G | 2 | Cientista + Eng ML | — |
| 7 | NBO recompra + itens novos + público Mais por Menos | G | 4–5 | Cientista | Modelagem; não somado em engenharia. |
| 8 | MBA em SQL + agregação filial/regional | M | 1 | Cientista | — |
| 9 | Backoff + regras de mecânica | M | 1 | Cientista + Eng ML | — |
| 10 | RF06/RF07, MERGE por run_id, testes de contrato, SWAP | M | 1,5 | Eng ML | Schema depende da 3C (P§Premissa 4). |
| 11 | Empacotamento (procedures, pacote Python, CI, DEV/PRD) | M | 1,5 | Eng ML | — |
| 12 | DAG Airflow + manual + sensor + alertas + watchdog | M | 1,5 | Eng ML ou 3C (P§Premissa 10) | Fronteira ambígua. |
| 13 | Atribuição A/B estável + log de exposição | M | 1 | Cientista + 3C | E§1 e P§Premissa 2. |
| 14 | Avaliação offline (harness campeão × desafiante) | M | 1 | Cientista | — |
| 15 | Trilho Personalize (export, IAM, KMS, datasets, 2 receitas, lote, carga) | G | 3–4 | Eng ML | Só após parecer jurídico; requer conta AWS 3C. |
| 16 | API REST por CNPJ + DynamoDB (P§M3) | G | 3–4 | Eng ML | F2 na opção C. |
| 17 | Operação semanal durante campanhas (M2–M5) | — | ~2,5 | ninguém em M4–M5 | ~25% de um engenheiro × 10 semanas. |
| 18 | Documentação, handover, runbook | M | 1 | Eng ML | — |

Somatório de engenharia (itens 1–6, 9–13, 17–18, metade dos compartilhados): núcleo opção C ≈ 11–13 sp; + Personalize ≈ 14–17 sp; + API ≈ 17–21 sp. Capacidade do Eng. ML: 504 h ≈ 12,6 sp em M1–M3 (P§Investimento). INFERÊNCIA.

Cruzamento com o squad:
- Não cabe: núcleo + Personalize + API no Eng. ML em M1–M3. Cabe núcleo **ou** núcleo + Personalize com corte de escopo.
- Falta engenheiro de dados: discovery/contrato de fontes, estoque, sensor de fechamento, DAG e operação. Sugestão (decisão comercial): Eng. de Dados Pleno/Sênior ~50% M1–M5 (tarifas no Anexo, P§Perfis) ou estender Eng. ML em 50% até M5 (P§Premissa 7 já prevê change request).
- Operação M4–M5: o DAG roda semanalmente durante A/B; sem engenheiro, falha de segunda-feira cai no Cientista ou na 3C sem runbook.
- Trabalho assumido pela 3C (P§Escopo; Premissas 1, 4, 5, 9, 10): engenharia de dados, FS Produtos, contrato da tabela, pipelines, BI (RNF02), integração com Sírius/B2B/Salesforce. Risco: a 3C entender "pipelines de dados e IA" como o DAG que ela pediu como entregável (E§4.4.2). Se a 3C não tiver capacidade, o caminho crítico vira dependência externa sem dono, e o change request chega quando a relação já é sensível (R§ 00:03:24).

---

## 3. O que pode quebrar

| Risco | Efeito | Mitigação |
|---|---|---|
| FS Produtos não pronta no M1 (RNF01) | Se o gate ficar no MBA, combos atrasam sem necessidade; NBO itens novos fica sem atributos | Gate só no NBO-novos; MBA e recompra com mestre mínimo de SKU do SAP; FS Produtos entra como melhoria. |
| Estoque sem frescor ou sem mapeamento filial↔centro | Recomenda SKU indisponível; campanha frustra PDV e vendedor | Snapshot mais recente na execução, coluna `estoque_ref_em`, filtro também no consumo, reexecução manual. |
| Semana sem fechamento (ingestão atrasada, feriado, fechamento contábil) | DAG roda com semana parcial ou não roda | Sensor em tabela de controle com timeout; sem dado → mantém última RF06 válida + alerta (já no diagrama). |
| Schema drift no SAP/FS Clientes | Procedure quebra ou, pior, gera recomendação silenciosamente errada | Testes de contrato de entrada (colunas, tipos, domínios) no RF02; falha explícita. |
| Execução manual duplicando RF07 | Histórico A/B inconsistente | MERGE por `run_id`, `max_active_runs=1`, lock lógico em tabela de controle. |
| Execução manual sobrescrevendo RF06 durante campanha em curso | PDV do grupo B recebe oferta diferente no meio da campanha | Congelar recomendação por campanha (`campanha_id` referencia `run_id`); reexecução não altera campanha já lançada. |
| Contaminação A/B (mesmo PDV em mecânicas e grupos diferentes, grupo muda entre semanas) | Resultado inválido no cliente já sensível | Atribuição por hash estável de PDV, estratificada por abertura, persistida em tabela; nunca recalculada pelo DAG. |
| Personalize sem dado suficiente por abertura / baseline de popularidade vence | Benchmark inconclusivo | Comparar no mesmo recorte; aceitar que em catálogo pequeno popularidade por filial é baseline forte. |
| Exportar dado para us-east-1 sem parecer | Incidente LGPD, quebra de confiança | Gate G0 antes do primeiro unload; pseudonimização; mapa ID↔CNPJ só no Snowflake; DPA. |
| Pacote ML indisponível no Snowflake | Retrabalho de modelagem | Validar canal de pacotes no kickoff; desenho sem dependências exóticas. |
| Créditos Snowflake sem dono/limite | Treinos parados por bloqueio financeiro | Warehouse dedicado + resource monitor acordado. |
| Deploy de DAG lento no processo da 3C | Correção de produção leva semanas | Parametrizar ao máximo (config em tabela), reduzir mudanças de código no DAG. |
| Histórico curto (mai/25 → ~17 meses em out/26) | Janela de 12 meses + validação temporal + sazonalidade apertadas | Validação em 4–8 semanas finais; sazonalidade como feature simples; checar histórico anterior no SAP. |
| Eng. ML sai no M3 com DAG em operação | Falhas sem dono em M4–M5 | Runbook + transferência para 3C no M3, ou extensão via change request. |

---

## 4. Pontos para o ARQ reconsiderar

- ENG-01 [ALTA] Fronteira A3 × 3C para DAG, RF06/RF07 e "pipelines de dados e IA" (P§Premissa 10) contradiz E§4.4.2; e "pipeline batch 100% manual" (P§Escopo Inicial) contradiz Airflow semanal → explicitar no desenho quem constrói e quem opera cada caixa.
- ENG-02 [ALTA] Squad sem engenheiro de dados e sem engenharia em M4–M5 → incluir no desenho o modelo de operação (quem é acionado) e sinalizar ao comercial o reforço.
- ENG-03 [ALTA] Gate "MBA se FS Produtos ok" no lugar errado → mover gate para NBO itens novos; MBA usa faturamento + mestre mínimo de SKU.
- ENG-04 [MÉDIA] RF07 como SCD2 clássico × execução manual intra-semana → armazenamento append-only por `run_id` + view SCD2; idempotência por run, não por semana; congelamento por campanha.
- ENG-05 [MÉDIA] Um modelo por abertura × janela não é operável → modelo por qualificação com abertura e janelas como features; backoff só em MBA e regras.
- ENG-06 [MÉDIA] Backoff até "nacional" pode violar E§4.3.1.1 → último nível canal × macro-região, a validar com negócio.
- ENG-07 [MÉDIA] F2 acoplada ao Personalize no diagrama de contexto ("F0→F2 Personalize benchmark → produção") → F2 serve recomendações do Snowflake via S3 sa-east-1 + DynamoDB; Personalize em produção só por ADR próprio.
- ENG-08 [MÉDIA] Estoque aparece como caixa no Snowflake, mas a fonte é "a definir" → marcar como dependência externa com data, e prever fallback (sem filtro de estoque + aviso) para não bloquear o MVP.
- ENG-09 [MÉDIA] Falta caixa de atribuição A/B e de log de exposição/retorno (Salesforce/Sírius → Snowflake) → sem isso o KPI de margem (E§6) não é mensurável.
- ENG-10 [BAIXA] Custo Personalize divergente (P§ US$ 924/mês × R§ ~US$ 5.000/mês) → recalcular antes de usar o número no SOW/funding.

---

## 5. Lista de questionamentos e lacunas

| ID | Tipo | Área | Tema | Pergunta ou lacuna | Por que importa | Fonte | Bloqueante | Quando precisa | Responsável sugerido (cliente) | Hipótese de trabalho atual |
|---|---|---|---|---|---|---|---|---|---|---|
| ENG-Q01 | Questionamento | Técnico | Notebooks | O que é a "stack interna" para notebooks: Snowflake Notebooks, Jupyter/JupyterHub on-prem, SageMaker ou outro? | Muda onde o código roda, como o Airflow dispara e +1 a +2 sp de engenharia | E§4.4.1 | Sim | Pré-contrato | João Pedro Felismino (Engenharia) | Snowflake Notebooks + stored procedures Snowpark |
| ENG-Q02 | Questionamento | Infra-AWS | Snowflake | Edição, nuvem e região da conta Snowflake (ex.: AWS sa-east-1)? | Define custo de egress, storage integration, Container Runtime e LGPD do trilho Personalize | Diagramas v1 ("região a confirmar") | Sim | Pré-contrato | João Pedro Felismino (Engenharia) | AWS sa-east-1, edição Enterprise |
| ENG-Q03 | Questionamento | Técnico | Snowpark | Snowpark Python está habilitado, termos de pacotes Anaconda aceitos e qual a política para pacotes (lightgbm, mlxtend, implicit)? | Pacote vetado obriga redesenho da modelagem | E§4.4.1 | Sim | Kickoff | João Pedro Felismino (Engenharia) | lightgbm liberado; sem implicit/mlxtend |
| ENG-Q04 | Questionamento | Operação | Airflow | Versão do Airflow, hospedagem (MWAA, Astronomer, self-hosted), versão do provider Snowflake e processo de deploy de DAG (repo, CI, aprovação, prazo)? | Ciclo de deploy define velocidade de correção em produção | E§4.4.2 | Sim | Kickoff | João Pedro Felismino (Engenharia) | Airflow 2.x, deploy por Git com aprovação semanal |
| ENG-Q05 | Questionamento | Operação | Segredos | Qual secrets backend do Airflow e é permitido usuário de serviço Snowflake com key-pair para o projeto? | Sem isso a execução depende de credencial pessoal | E§4.4.2 | Não | M1 | João Pedro Felismino (Engenharia) | Usuário de serviço com key-pair no secrets backend existente |
| ENG-Q06 | Questionamento | Dados | Ingestão SAP | Faturamento, cadastro, mestre de material e estoque já são ingeridos do SAP no Snowflake? Com qual ferramenta, frequência e latência? | Ingestão inexistente é G e fora do squad | R§ próximas etapas; E§4.2 | Sim | Pré-contrato | João Pedro Felismino (Engenharia) | Faturamento e cadastro D-1 já existem; estoque não |
| ENG-Q07 | Questionamento | Dados | Fechamento semanal | O que define "semana fechada" (dia/hora, faturado × pedido) e existe sinal técnico (tabela de controle) de carga concluída? Devoluções posteriores reabrem a semana? | Sem sinal, o DAG roda com semana parcial | E§4.4.2 | Sim | Kickoff | João Pedro Felismino (Engenharia) | Semana dom–sáb, faturado, disponível segunda 06h |
| ENG-Q08 | Questionamento | Dados | Estoque (RF03) | Qual a fonte, granularidade (centro/depósito × filial) e frequência do estoque, e o que é "falta de estoque" (zero, abaixo de cobertura)? | Recomendar item sem estoque compromete a campanha | E§5 RF03; diagramas ("fonte a definir") | Sim | M1 | João Pedro Felismino (Engenharia) + Helena (Inteligência Comercial) | Snapshot diário por centro, mapeado para filial; falta = saldo zero |
| ENG-Q09 | Questionamento | Dados | Compra no mês (RF03) | "Itens já comprados no mês" é mês calendário corrente ou últimos 30 dias, e considera pedido ou faturamento? | Exige dado D-1 na execução e muda o filtro | E§5 RF03 | Não | M1 | Helena (Inteligência Comercial) | Mês calendário corrente, faturamento |
| ENG-Q10 | Questionamento | Técnico | Contrato RF06/RF07 | Qual é o "formato especificado" das tabelas RF06/RF07 e quem as consome (Sírius, B2B, Salesforce, BI) e como? | Sem schema não há teste de contrato nem integração | E§5 RF06/RF07; P§Premissa 4 | Sim | Kickoff | Marcus Bruno (D&A/Produto) | A3 propõe schema; 3C aprova até M1 |
| ENG-Q11 | Questionamento | Operação | Execução manual | Execução manual intra-semana deve gerar nova versão vigente (substituindo a semanal) inclusive para campanhas em curso? Quem pode disparar? | Define semântica da RF07 e risco de alterar campanha ativa | E§4.4.3 | Sim | M1 | Marcus Bruno (D&A/Produto) | Nova versão vigente; campanhas lançadas ficam congeladas no run original |
| ENG-Q12 | Questionamento | Técnico | Atribuição A/B | Quem faz a randomização 50/50, onde fica a atribuição e ela é estável por PDV entre semanas e entre mecânicas? | Atribuição instável invalida o teste | E§1; P§Premissa 2 | Sim | Kickoff | Camila (CRM) + Helena (Inteligência Comercial) | A3 gera tabela de atribuição por hash estável, estratificada |
| ENG-Q13 | Questionamento | Dados | Retorno de campanha | Exposição e resultado das campanhas (Salesforce/Sírius/B2B) chegam ao Snowflake? Com qual chave e latência? | Sem retorno, margem por grupo A/B não é mensurável | E§6; P§Premissa 5 | Sim | M1 | Camila (CRM) | Exposição exportada do Salesforce para o Snowflake D-1 |
| ENG-Q14 | Questionamento | Infra-AWS | Conta AWS | A 3C tem conta AWS própria e landing zone? Quem é dono da conta onde rodaria o trilho Personalize? | Sem conta, trilho benchmark e funding não andam | P§Infra; diagramas A/C | Sim | Pré-contrato | Marcus Bruno (D&A/Produto) | Conta nova da 3C criada pela A3 sob aprovação da 3C |
| ENG-Q15 | Questionamento | Dados | LGPD / região | A 3C autoriza envio de dados pseudonimizados para us-east-1 (Personalize indisponível em sa-east-1)? Há parecer do DPO? | Sem parecer, o trilho Personalize não pode iniciar | Ficha; consulta AWS 2026-10-26 | Sim | Pré-contrato | DPO/Jurídico 3C (a nomear) | Não autorizado até parecer; MVP não depende disso |
| ENG-Q16 | Questionamento | Técnico | Storage integration | Quem pode criar storage integration e stage externo no Snowflake e há política de rede que bloqueie saída para S3? | Trilho Personalize e F2 dependem disso | Diagramas A/C ("unload") | Não | M1 | João Pedro Felismino (Engenharia) | Integração criada pelo admin 3C sob solicitação |
| ENG-Q17 | Questionamento | Técnico | Escopo API | A entrega de API REST por CNPJ + storage NoSQL no M3 (proposta) continua no escopo da POC? | +3–4 sp de engenharia e integrador do lado 3C | P§Escopo Inicial M3 | Sim | Pré-contrato | Marcus Bruno (D&A/Produto) | Fora do MVP; vira F2 |
| ENG-Q18 | Questionamento | Operação | Operação pós-M3 | Quem opera o DAG semanal após o M3 e após a POC (acionamento em falha, SLA de publicação)? | Eng. ML sai no M3 com campanhas rodando | P§Investimento; P§Premissa 7 | Sim | Pré-contrato | João Pedro Felismino (Engenharia) | 3C opera a partir do M4 com runbook; A3 em segundo nível |
| ENG-Q19 | Questionamento | Técnico | Ambientes | Há ambientes Snowflake DEV/HML/PRD separados e zero-copy clone é permitido para desenvolvimento? | Afeta testes, promoção e custo | P§Cronograma ("ambiente sandbox") | Não | Kickoff | João Pedro Felismino (Engenharia) | Database DEV com clone de PRD mascarado |
| ENG-Q20 | Questionamento | Dados | Volumetria | Quantos PDVs ativos, SKUs ativos, pedidos/semana e linhas de faturamento desde mai/25? | Dimensiona warehouse, créditos, top-N e RF07 | P§Situação Atual ("centenas de milhares") | Não | Kickoff | Marcus Bruno (D&A/Produto) | ~300 mil PDVs, ~500 SKUs ativos |
| ENG-Q21 | Questionamento | Dados | Histórico | Existe histórico de faturamento anterior a mai/25 acessível (SAP ou legado)? | Janela 12 meses + validação temporal + sazonalidade ficam curtas | E§4.2.1; E§4.1.5 | Não | M1 | João Pedro Felismino (Engenharia) | Só desde mai/25 |
| ENG-Q22 | Questionamento | Operação | Custo Snowflake | Quem paga os créditos Snowflake do projeto, qual limite e há warehouse dedicado com resource monitor? | Bloqueio financeiro para treino e execução semanal | — | Não | Kickoff | Marcus Bruno (D&A/Produto) | Warehouse dedicado com limite mensal acordado |
| ENG-Q23 | Questionamento | Técnico | Fronteira de entrega | O DAG Airflow e as tabelas RF06/RF07 são entregáveis da A3 ou da 3C ("Pipelines de dados e IA — 3C")? A premissa "pipeline batch 100% manual" vale? | Diferença de ~4–6 sp e de responsabilidade operacional | E§4.4.2; P§Premissa 10; P§Escopo Inicial | Sim | Pré-contrato | Marcus Bruno (D&A/Produto) | A3 entrega DAG e tabelas; 3C faz deploy e opera |
| ENG-D01 | Detalhe faltante | Dados | Chave de PDV | Dicionário da FS Clientes e regra da chave de PDV (CNPJ × código cliente SAP; matriz × filial; múltiplos códigos por CNPJ) | Chave errada duplica PDV e distorce A/B | E§4.2.1 | Sim | Kickoff | Marcus Bruno (D&A/Produto) | Código cliente SAP como chave; CNPJ como atributo |
| ENG-D02 | Detalhe faltante | Dados | Mestre de SKU mínimo | Mestre de SKU com status ativo/bloqueado, data de criação e família, independente da FS Produtos | Destrava MBA e recompra sem esperar RNF01 | E§4.2.2; P§Premissa 1 | Sim | M1 | João Pedro Felismino (Engenharia) | Tabela de material SAP já no Snowflake |
| ENG-D03 | Detalhe faltante | Dados | Hierarquia comercial | Mapeamento filial → regional → canal e área de atuação do vendedor, com histórico de mudanças | Aberturas e backoff dependem disso; sem histórico há vazamento no treino | E§4.1.2–4.1.3 | Não | M1 | Helena (Inteligência Comercial) | Hierarquia vigente no cadastro, sem histórico |
| ENG-D04 | Detalhe faltante | Técnico | Elegibilidade por mecânica | Regras de elegibilidade: público sem compra ≥ 60 dias, SKUs elegíveis/bloqueados por mecânica, restrições de price | Sem regra, o modelo recomenda o que a área não pode ofertar | E§2.1.3; E§4.5 | Sim | M1 | Helena (Inteligência Comercial) | Lista de SKUs elegíveis por mecânica mantida pela 3C em tabela |
| ENG-D05 | Detalhe faltante | Técnico | Tamanho da saída | Top-N por PDV/mecânica, nº de combos por filial e tamanho do combo (2 ou 3 SKUs) | Define volume, MBA (pares × trincas) e testes de contrato | E§2.1.1; E§4.5.1 | Não | M1 | Helena (Inteligência Comercial) | Top-10 por PDV; combos de 2 SKUs; top-20 combos por filial |
| ENG-D06 | Detalhe faltante | Técnico | Limiares MBA e backoff | Suporte, confiança e lift mínimos e n mínimo por nível de abertura; último nível permitido | Evita regras espúrias e violação de E§4.3.1.1 | E§4.3.1.1 | Não | M1 | Helena (Inteligência Comercial) | A3 propõe limiares na EDA; último nível canal × macro-região |
| ENG-D07 | Detalhe faltante | Operação | Alertas | Canal e destinatários de alerta (falha, não execução, gate RF02) e horário-limite de publicação | Falha silenciosa na segunda atrasa campanha | Diagrama DAG ("segunda 12h") | Não | M1 | João Pedro Felismino (Engenharia) | E-mail/Teams para Engenharia 3C e A3 |
| ENG-D08 | Detalhe faltante | Operação | Retenção | Retenção de RF07, RF02 e logs de execução (LGPD e custo) | Histórico cresce ~0,6 bi linhas/ano (INFERÊNCIA) | E§5 RF07 | Não | M2+ | DPO/Jurídico 3C (a nomear) | 24 meses para RF07; 6 meses para RF02 |
| ENG-D09 | Detalhe faltante | Técnico | Padrões de repositório | Provedor Git, branching, revisão, testes obrigatórios e padrões de código para notebooks e DAG | Retrabalho na entrega se padrão aparecer no fim | E§4.4.1 | Não | Kickoff | João Pedro Felismino (Engenharia) | Repositório da 3C com PR revisado pela Engenharia |
| ENG-D10 | Detalhe faltante | Dados | Visitação | Conteúdo e granularidade da coleção "Visitação" (vazia na especificação) | Pode ser feature forte de propensão ou exposição | E§4.2.1 | Não | M1 | Marcus Bruno (D&A/Produto) | Visitas do vendedor por PDV/semana |
| ENG-D11 | Detalhe faltante | Dados | Recorte do piloto | Quais famílias e aberturas entram na 1ª onda (1–2 famílias, canal/regional) | Muda nº de combinações, volume e prazo de EDA | P§Escopo; R§ (validação em uma filial) | Sim | Kickoff | Helena (Inteligência Comercial) | 1 canal, 1 regional, 2 famílias |
| ENG-D12 | Detalhe faltante | Técnico | Mudança de schema | Processo de aviso e versionamento de mudanças de schema nas tabelas de origem | Schema drift quebra o DAG ou gera saída errada | — | Não | M1 | João Pedro Felismino (Engenharia) | Sem processo; testes de contrato da A3 detectam |
| ENG-D13 | Detalhe faltante | Dados | Unidade de cesta | Definição da cesta para MBA: pedido/nota, PDV × semana ou PDV × mês | Muda as regras de associação e o lift | E§2.1.1; E§4.5.1 | Não | M1 | Helena (Inteligência Comercial) | Testar pedido e PDV × mês na EDA |
