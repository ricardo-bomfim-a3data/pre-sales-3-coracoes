# Revisão crítica independente — 3 Corações · Recomendação de SKU (NBO/MBA) B2B

Nota de 28/10/2026: esta revisão é um registro datado (27/10). As decisões posteriores (MBA no Personalize, SageMaker AI excluído, cronograma W0 a W6) estão em ADR-003 e arquitetura-proposta.md; onde esta revisão citar SageMaker AI ou "mês 1", leia a decisão atual.

Versão: v1 · 2026-10-26 · Autor: ESP (squad A3), transcrito pelo coordenador · Status: revisão sobre arquitetura-proposta.md v2, critica-implementabilidade.md, 06-requisitos-e-glossario.md e 07-metricas-e-consumo.md

## 1. Resumo

A Opção C (híbrido por fases) está certa no essencial e ainda não fecha em três pontos:

1. A afirmação de que o esforço continua o mesmo (ARQ §1) não bate com a capacidade calculada pelo ENG.
2. O argumento de funding apoiado em F2 não se sustenta com os números do próprio ARQ (tabela 8.4).
3. A forma de comunicar a mudança ao cliente decide se a negociação será reaberta.

As quatro listas têm cerca de 40 grupos redundantes e oito contradições de hipótese. Mandar dezenas de perguntas por escrito antes da assinatura produz a imagem de procrastinação que se quer evitar.

## 2. Crítica da Opção C

O que se sustenta: campeão na stack da 3C; MBA em SQL; janela como feature e não como modelo; gate da FS Produtos no NBO-novos; API em F2; custo do Personalize reconciliado (S1 ≈ US$ 924/mês da proposta; S2 ≈ US$ 5 mil/mês da reunião).

(a) **Inverter campeão e desafiante é defensável comercialmente.** A proposta diz que o trabalho é "executada pela A3Data sobre a stack Snowflake" (FATO: proposta:489), põe a tabela de recomendação no Snowflake (P§Premissa 4) e define o cronograma como "a ser refinado no kickoff" (proposta:372). Não emitir V2. Ricardo e Bruna confirmam verbalmente com o Marcus que a execução segue a especificação dele, com o Personalize como benchmark de plataforma para decidir a escala; depois registrar no plano de kickoff. Evitar as palavras "inverter" e "champion" com o cliente. Para quem teve experiência ruim com IA, "seguimos sua especificação" soa como escuta.

(b) **O trilho Personalize não justifica funding por consumo**: no máximo US$ 900 no projeto; F2 dá US$ 30–200/mês (tabela 8.4 do ARQ). O funding só se sustenta se o critério da AWS for "percentual do SOW com workload AWS" (INFERÊNCIA a partir de R§ reuniao:54). Tratar o funding como ganho extra, não como premissa.

(c) **M1 tende a cair em dezembro**: assinatura em novembro mais até 30 dias de mobilização. Congelamento de mudanças e recesso. Primeira campanha realista em M3; leitura do A/B termina depois do M5. Somam-se acessos (2–4 semanas), RNF01 sem data, G0 e fluxo de price.

(d) **A Opção C transfere para a A3 a construção do DAG e das procedures** que a proposta deixava com a 3C (P§Premissa 10). Núcleo: 11–13 semanas-pessoa contra 12,6 do Eng. ML; M4–M5 descoberto.

(e) **C-BR troca a tese "plataforma × custom" por "custom × custom".** Se G0 for negativo, o desafiante deve rodar no próprio Snowpark; SageMaker só entra por falta de memória ou GPU.

(f) **RF07**: adotar a proposta do ENG (append-only por run_id/semana_ref com view SCD2 derivada).

(g) **Backoff até nacional** só é aceitável se a regra de portfólio regional (NEG-D16) for filtro de candidatos; trocar corte seco por suavização ponderada pelo n de cada abertura, mantendo `nivel_backoff`.

## 3. Coerência das listas

### 3.1 Redundâncias (manter o primeiro ID; os demais ficam "Consolidado em")

| Tema | Manter | Absorvidos |
|---|---|---|
| Região do Snowflake | ARQ-Q01 | ENG-Q02 |
| Snowpark | ARQ-Q03 | ENG-Q03, ARQ-Q42 |
| Notebooks | ARQ-Q08 | ENG-Q01 |
| Airflow | ARQ-Q06, ARQ-Q07 | ENG-Q04, ENG-D09 |
| Ingestão SAP | ENG-Q06 | ARQ-Q10 |
| Fechamento da semana | ENG-Q07 | ARQ-Q11, DAD-D16 |
| Estoque | NEG-Q16, ARQ-Q12 | ENG-Q08, DAD-D07 |
| Compra no mês | NEG-Q17 | ARQ-Q13, ENG-Q09, DAD-Q09 |
| Volumetria | ARQ-D02 | ENG-Q20, NEG-D13, DAD-D17 |
| Chave de PDV | NEG-D11 | ARQ-D03, ENG-D01 |
| Transferência internacional | NEG-Q33 | ARQ-Q16, ENG-Q15, DAD-Q25 |
| Contrato RF06/RF07 | ARQ-D05 | ENG-Q10, NEG-D03, DAD-D15 |
| Randomização | NEG-Q04 | ARQ-Q22, ENG-Q12, DAD-Q05 |
| Exposição | NEG-Q14 | ARQ-Q21, ENG-Q13, DAD-D03 |
| Margem | DAD-Q01 | NEG-Q18, ARQ-D08 |
| Piloto | NEG-Q11 | ARQ-Q36, ENG-D11, DAD-Q24 |
| Operação após M3 | ENG-Q18 (bloqueante) | NEG-Q40 |

### 3.2 Contradições de hipótese (fixar uma só)

| Tema | Posições | Fica |
|---|---|---|
| Gate da FS Produtos | no MBA (NEG-D04, DAD-D09, NEG-Q38) × no NBO-novos (ARQ, ENG) | ARQ/ENG; Combos pode ser a primeira mecânica |
| Combo | regra de preço (NEG-Q23) × SKU novo com BOM (DAD-D14) | perguntar ao cliente (NEG-Q23) |
| Margem | sem frete e comissão (NEG-Q18) × com frete e comissão (DAD-Q01) | perguntar ao cliente (DAD-Q01) |
| Histórico | só desde mai/25 (ENG-Q21) × 24–36 meses viáveis (DAD-D08) | perguntar (DAD-D08) |
| Top-N | 10 (ENG-D05, base do volume do ARQ) × 5 (DAD-Q18, NEG-D18) | 10 como hipótese; calibrar na EDA |
| Retenção | 24 meses (ARQ/ENG) × 12 meses (NEG-Q36) | política da 3C (ARQ-Q32) |
| Braço B2 Personalize no A/B | ARQ §4.3 × só offline (NEG-Q39) | NEG (poder estatístico): um braço de algoritmo; comparação entre algoritmos offline |
| Recorte do piloto | quatro versões (ARQ, ENG, NEG, DAD) | uma só hipótese: 1 regional/filial de alto volume, 1–2 famílias, definido no kickoff |

### 3.3 Não mandar por escrito ao cliente

- ARQ-Q17 e a parte de funding de ARQ-Q29: assuntos A3 × AWS.
- NEG-Q30 (histórico negativo com IA), NEG-Q31 (validade expirada da proposta) e NEG-Q02 (resultado neutro): tratar em conversa.
- ENG-Q23 / NEG-Q27 ("pipeline 100% manual"): expõe a contradição da proposta; resolver internamente e informar a fronteira.
- ENG-Q17 / NEG-Q25 (API no M3): informar o plano (F2) em vez de perguntar.
- NEG-Q38 (MoSCoW) e DAD-Q06 (vendedor favorecer): reescrever antes de enviar.

## 4. O que decidir antes da assinatura

| # | Decisão | Recomendação | Dono |
|---|---|---|---|
| 1 | Alinhamento da abordagem com o Marcus | Sem V2 da proposta; confirmação verbal "seguimos a especificação; Personalize como benchmark de plataforma"; registrar no plano de kickoff | Ricardo + Bruna |
| 2 | Fronteira de entrega | A3 entrega DAG, procedures e RF06/RF07 como código; 3C faz deploy e opera; retirar "pipeline 100% manual" | Ricardo |
| 3 | Squad | Realocar sem mudar o total: 504 h × R$ 324,50 = R$ 163.548 pagam ~641 h de Eng. Dados Sr (~128 h/mês M1–M5); se reabrir aprovação, pré-acordar o CR da Premissa 7 | Bruna + Ricardo |
| 4 | Snowpark e stack de notebooks (ARQ-Q03/Q08) | Uma call com o João Pedro; sem Snowpark o desenho muda | Ricardo |
| 5 | Pedido-item e custo por SKU (DAD-D02/D01) | Sem custo, não prometer "margem" em contrato | Ricardo + Bruna |
| 6 | Sírius aceita SKU diferente por PDV (ESP-Q01) | Define se o NBO por PDV é executável | Ricardo |
| 7 | Calendário | Congelamento de dezembro e janela de medição depois do M5 (ESP-Q02/Q03) | Bruna |
| 8 | Funding | Bruna confirma o critério com a AWS; não inflar a POC | Bruna |
| 9 | API/NoSQL | Mantidos fora do escopo contratado (ADR-002 e ADR-003). A camada de consumo AWS com Quick e Bedrock foi retirada em 27/10/2026; o consumo continua sendo a tabela no Snowflake | Ricardo |
| 10 | Personalize | Passa a ser o motor do NBO e, desde 28/10, também do MBA (Opção E, ADR-003; receita SIMS com as métricas no Glue; o SageMaker AI foi excluído). Condição: aceite por escrito da 3C para o motor na AWS (ARQ-Q46). MEI e EI nas cópias: em aberto (ESP-D02) | Ricardo |
| 11 | Desenho do A/B | Um só braço de algoritmo; comparação entre algoritmos offline | Ricardo |
| 12 | DPA de operador (ARQ-Q34) | Jurídico, antes do contrato | Bruna |
| 13 | Formato do envio ao cliente | No máximo 10 perguntas numa call de 45 min; o resto vira checklist de prontidão de dados do kickoff (P§Premissa 3) | Ricardo |
| 14 | Viés AWS | Opção E (ADR-003): motor na AWS em us-east-1, desenho único desde 29/10 (o Desenho 2 foi descartado). A posição jurídica sobre CNPJ real fora do país é checagem bloqueante antes de enviar o primeiro dado real (ARQ-Q43); o desenho em si não depende dela | Ricardo |
| 15 | Custo anual e funding | Quatro cenários na seção 8.6 de arquitetura-proposta.md; pelo critério anotado (cerca de 10%, mínimo R$ 50 mil; em 29/10 a meta passou a ser US$ 100 mil de consumo anual projetado) o consumo em lote não sustenta o funding sozinho; a Bruna confirma o critério com a AWS | Bruna |

## 5. Lista complementar

| ID | Tipo | Área | Tema | Pergunta ou lacuna | Por que importa | Fonte | Bloqueante | Quando precisa | Responsável sugerido (cliente) | Hipótese de trabalho atual |
|---|---|---|---|---|---|---|---|---|---|---|
| ESP-Q01 | Questionamento | Negócio | Personalização no Sírius | O Sírius consegue configurar SKUs diferentes por PDV dentro da mesma campanha, ou só por filial ou regional? Quantas variantes cabem? | Se for só por segmento, o NBO por PDV não é executável e o A/B muda de grão | E§2.1; E§4.5 | Sim | Pré-contrato | Dono do Sírius e Inteligência Comercial (Helena) | Segmentação por lista de PDV com até 3 variantes de SKU por campanha |
| ESP-Q02 | Questionamento | Negócio | Janela de medição | Se a 1ª campanha só entrar em M3, quem analisa o resultado que chega depois do M5, e com quais horas? | O resultado prometido pode ficar fora da vigência do contrato | P§Cronograma; E§1 | Sim | Pré-contrato | Executivo patrocinador 3C | Análise final em até 4 semanas após o M5, coberta por saldo de horas |
| ESP-Q03 | Questionamento | Técnico | Congelamento de fim de ano | Há congelamento de mudanças de TI ou recesso entre dezembro e janeiro (deploy, acessos, campanhas)? | M1 provavelmente cai em dezembro; o atraso não pode virar dedução de horas (P§Prem. gerais 13) | P§Prem. gerais 10 e 13 | Sim | Pré-contrato | TI 3C e Engenharia (João Pedro Felismino) | Congelamento de 15/12 a 10/01 |
| ESP-Q04 | Questionamento | Técnico | Acessos durante a mobilização | A 3C pode liberar contas, usuário de serviço, warehouse e repositório durante os 30 dias de mobilização, antes do kickoff? | Tira o principal risco do M1 do caminho crítico | P§Prem. gerais 10; P§Premissa 3 | Não | Pré-contrato | TI 3C e Engenharia de Dados | Liberação em paralelo à mobilização |
| ESP-Q05 | Questionamento | Comercial | Propriedade intelectual | Quem é dono do pacote de código, notebooks e DAGs? Aceleradores da A3 (EML) entram com licença de uso? | Evita disputa no aceite e na continuidade | P§Portfólio; ARQ §5.4 | Não | Pré-contrato | Jurídico e Compras 3C | Código do projeto da 3C; aceleradores da A3 com licença perpétua de uso |
| ESP-Q06 | Questionamento | Negócio | Regra de parada do A/B | Quem pode interromper o teste, e com qual queda de margem no grupo B? | O cliente teve experiência ruim com IA; sem regra pré-acordada, a parada vira decisão política | E§1; P§Premissa 2 | Não | Kickoff | Executivo patrocinador e Inteligência Comercial | Revisão quinzenal, parada se a margem cair abaixo do limiar pré-registrado |
| ESP-Q07 | Questionamento | Comercial | Snowflake via AWS Marketplace | O Snowflake da 3C é contratado pelo AWS Marketplace? | Pode reforçar a relação com a AWS no funding (A VERIFICAR com a AWS) | R§ reuniao:54 | Não | Pré-contrato | Compras e TI 3C | Contrato direto com a Snowflake |
| ESP-D01 | Detalhe faltante | Processo | Fidelidade do tratamento | Registro das trocas que a IC e o price fazem nos SKUs do grupo B antes da campanha (quantos, quais, motivo) | Sem esse registro, o B mede "algoritmo editado" e o efeito fica sem atribuição | E§4.5; NEG-D21 | Não | M1 | Inteligência Comercial (Helena) | A3 grava a lista original e a final em OPS |
| ESP-D02 | Detalhe faltante | Segurança-LGPD | Natureza jurídica do PDV | Atributo de natureza jurídica no cadastro (MEI, EI, LTDA) para excluir pessoa natural do export do benchmark | Export só de PJ pseudonimizada pode aliviar o G0 (INFERÊNCIA; cabe ao jurídico) | ARQ §6; ARQ-Q33 | Não | M1 | DPO 3C e Engenharia de Dados | Atributo existe no cadastro SAP |
| ESP-Q08 | Questionamento | Infra-AWS | Restrição de regiões na organização AWS da 3C | A organização AWS da 3C tem política (SCP) que bloqueia regiões fora do Brasil? Em qual região está o IAM Identity Center? | O motor inteiro roda em us-east-1 e uma SCP de região impediria a execução; o Identity Center serve ao login de pessoas | ADR-003 | Sim | Pré-contrato | Infraestrutura/Cloud 3C | Sem SCP de região; Identity Center em us-east-1 ou replicável |
| ESP-Q09 | Questionamento | Jurídico-LGPD | Contrato de operador na W0 | O contrato de operador entre 3C e A3 (acesso ao Snowflake pela equipe A3) pode ser assinado junto com o contrato principal, antes da W0? | Sem ele a A3 não pode acessar dados na W0 e na W1; não pode esperar o parecer da fase 2 | ADR-002; aba 3 do diagrama v3 | Sim | Pré-contrato | Jurídico 3C e A3 (Bruna) | Assinado junto com o contrato principal |
| ESP-D03 | Detalhe faltante | Custo | Preços do motor na AWS | Faltam, na calculadora da AWS, preço e consumo do Glue (DPU-hora), do SageMaker AI (processamento e notebooks, hoje excluído); falta também o critério de funding da AWS | Sustentam a seção 8.6 e a tese de funding | ADR-003; seção 8.6 | Não | Pré-contrato | A3 (ARQ) e Bruna | Cenário B de US$ 13–16 mil por ano |

## 6. Achados

- [ESP-01][ALTA] ARQ diz que o esforço continua o mesmo, mas ENG calcula 11–13 semanas-pessoa só para o núcleo contra 12,6 do Eng. ML, mais 3–4 para o Personalize → declarar F1b opcional e realocar o squad (decisão 3).
- [ESP-02][ALTA] Funding "apoiado em F2" contradiz a tabela 8.4 do ARQ → confirmar o critério da AWS; não usar o funding como premissa.
- [ESP-03][ALTA] ~198 perguntas antes da assinatura soam como procrastinação → no máximo 10 numa call; o resto vai para o checklist do kickoff.
- [ESP-04][MÉDIA] RF07 → append-only por run_id/semana_ref com view SCD2 derivada; ajustar ARQ-D05.
- [ESP-05][MÉDIA] Backoff → restrição regional como filtro de candidatos; suavização ponderada pelo n, mantendo `nivel_backoff`.
- [ESP-06][MÉDIA] A POV guardada como contingência já pode existir dentro do MVP: entregar no M1 um backtest contra o baseline e os combos por regional como marco visível de valor.

## 7. Pendências

- A VERIFICAR com a Bruna: critério do funding AWS (percentual do SOW ou consumo) e nome do programa.
- ARQ precisa alinhar ARQ-D05 e §4.3 (braço B2) com ENG-04 e NEG-Q39.
- Coordenador consolida as listas pelos IDs da seção 3 (feito em tools/consolidar-listas.mjs).

## 8. Revisão da arquitetura v3 (ESP, 26/10/2026)

Pedido do Ricardo: eliminar siglas dos diagramas, deixar o fluxo técnico conexo e levar toda a parte AWS para uma única região fora do país sob parecer jurídico. O ESP revisou a v3 e apontou 13 achados; o coordenador aplicou todos na v3.1 do diagrama, no ADR-002 e nas seções 1, 2, 4.5, 5.2, 6, 8.5 e 9 de arquitetura-proposta.md.

| # | Achado | Severidade | Correção aplicada |
|---|---|---|---|
| ESP-v3-01 | ADR-002 e seções 1, 2, 6, 8.5 ainda decidiam por sa-east-1 e Opção C | ALTA | ADR-002 reescrito; seções alinhadas à Opção D em us-east-1 |
| ESP-v3-02 | Knowledge Base estruturada do Bedrock usa Redshift, não Athena; aresta Athena → Bedrock errada | ALTA | Redshift Serverless incluído entre o catálogo e o Bedrock; calculadora atualizada |
| ESP-v3-03 | Painel "do dia anterior" na AWS alimentado por cópia semanal conflita com o RNF02; BI da 3C tratado como plano B sendo requisito | ALTA | Painel diário do teste A/B fica no BI atual da 3C (fase 1, seta 12); Quick entrega painéis semanais |
| ESP-v3-04 | Fluxo da aba 2 com buracos: registro de quem recebeu a oferta, cópia sem disparo, comparação sem volta ao Snowflake, Personalize sem orquestração, numeração repetida | ALTA | Aba 2 refeita com 25 setas numeradas em sequência única; caixas novas: registro de quem recebeu a oferta, notebooks, resultado da comparação no Snowflake, rotina de comparação |
| ESP-v3-05 | Pedido de parecer mal formulado (não pergunta se é dado pessoal, não cita art. 33, suboperadora AWS, reidentificação, texto livre, RIPD, confidencialidade comercial, retenção no Personalize, contrato de operador no mês 1) | ALTA | Aba 3 reescrita com seis perguntas fechadas; contrato de operador separado, no pré-contrato |
| ESP-v3-06 | "Nenhum dado sai do Brasil" contradiz a premissa de que a região do Snowflake é suposição | ALTA | Texto trocado por "dados ficam no Snowflake da 3C (região a confirmar)" |
| ESP-v3-07 | "Guardrails" por inclusão/exclusão de tabelas não substituem controle de acesso | MÉDIA | Texto do assistente passou a "acesso restrito pelas permissões do catálogo e do Redshift" |
| ESP-v3-08 | Nome "QuickSight com Amazon Q" desatualizado; Identity Center na mesma região do Quick | MÉDIA | "Amazon Quick (antigo QuickSight)"; nota do Identity Center na caixa de segurança; ESP-Q08 |
| ESP-v3-09 | Catálogo Glue descrito como camada semântica que "define métricas" | MÉDIA | Descrito como catálogo com permissões; visões com nomes de negócio no Athena/Redshift e datasets do Quick |
| ESP-v3-10 | Jargão residual (Opção D, COPY INTO, Snowpark, Git, Parquet, KMS, DPO, MEI, warehouse, sorteio estratificado) | MÉDIA | Substituído por nome com função ou termo por extenso |
| ESP-v3-11 | Riscos não declarados da região única: fase 2 presa ao parecer, SCP de região, Identity Center, sustentação em região estrangeira, saída de dados do Snowflake | MÉDIA | Declarados no ADR-002; ESP-Q08 e ESP-D03 nas listas; plano B na aba 3 |
| ESP-v3-12 | Notebooks ausentes da aba 2; RF06 e RF07 fundidos em "tabela única"; "ao pé da letra" é promessa | MÉDIA | Caixa de notebooks; duas tabelas nomeadas; "atende os itens 4.4.1 a 4.4.3" |
| ESP-v3-13 | Painel D-1: fica no BI da 3C com o Quick como complemento? | pergunta | Decisão do coordenador: sim, registrada na aba 2 e no ADR-002; confirmar com o Ricardo |


## 9. Revisão da arquitetura v4 (ESP, 27/10/2026)

| ID | Achado | Severidade | Tratamento |
|---|---|---|---|
| ESP-v4-01 | Filtros do Personalize não entregam o RF03 como desenhado (só tipo de evento, 100 interações recentes, IN e =) | ALTA | Filtro final no Glue e conferência de estoque no Snowflake; ARQ-Q50 |
| ESP-v4-02 | Mais por menos exige a receita de afinidade com item; novos × recompra e janela de tempo não cobertos | ALTA | Duas soluções no desenho e na calculadora; janela escolhida uma vez no mês 1; preço A VERIFICAR |
| ESP-v4-03 | Orquestração incompleta: quem dispara a carga, como o Airflow sabe o fim, publicação no Snowflake | ALTA | Padrão por manifesto e arquivo de sucesso, publicação detalhada; decisão do Ricardo (ARQ-Q49) |
| ESP-v4-04 | CNPJ real não é necessário para o motor; documentos se contradiziam sobre o parecer jurídico | ALTA | Código do cliente como alternativa; decisão 14 alinhada ao ARQ-Q43 |
| ESP-v4-05 | O aceite cobre menos do que o v4 descumpre (E§4.1, 4.3.1.2, RNF04, API do M3); notebooks sumiram; "preço e prazo iguais" sem base | ALTA | ARQ-Q46 ampliado; notebooks no SageMaker AI; afirmação retirada |
| ESP-v4-06 | Opção E traz de volta ARQ-01 e ARQ-02; faltava coluna E na matriz e piso | ALTA | Coluna E, piso em SQL e decisão E ou D no fim do mês 1 |
| ESP-v4-07 | "A A3 nunca lê linhas com identificador" não fecha com a A3 desenvolvendo na AWS | MÉDIA | Conta de desenvolvimento sintética; negações explícitas no papel da A3; ARQ-Q48 |
| ESP-v4-08 | Endpoint privado no bucket bloqueia o Personalize e a integração do Snowflake | MÉDIA | Exceção por papel; texto corrigido |
| ESP-v4-09 | RNF02 é dependência da 3C; carga semanal contradiz hipóteses diárias e o SLA | MÉDIA | ARQ-Q45 ampliado; texto de dono 3C; SLA reescrito |
| ESP-v4-10 | Quem sorteia os grupos; trocas manuais; "exposição chega como hoje" sem base | MÉDIA | Rotina de sorteio e registro das trocas; hipótese de exposição explicitada |
| ESP-v4-11 | Funding: base provável é o valor do SOW; cenário A e custos ajustados | MÉDIA | Seção 8.6 com duas leituras; Glue ajustado; ARQ-D12 |
| ESP-v4-12 | Operação e SLA não refletiam a opção E; faltava modo só inferência | MÉDIA | Seções 7.1 e 7.4 reescritas |
| ESP-v4-13 | Resíduos de Quick, Bedrock e 7 dias fora de contexto | MÉDIA | Principais trechos corrigidos; restantes ficam como histórico das opções A, C e D |
| ESP-v4-14 | Diagrama: números misturados, jargão, setas faltando | BAIXA | Fluxo renumerado de 1 a 14 e 1 a 16; jargão trocado; setas de grupo e de manifesto |
| ESP-v4-15 | Motivo da recomendação não vem do Personalize; cesta em SQL faria o mesmo | BAIXA | Motivo por regras; SQL como piso |

Decisões que o especialista pediu ao Ricardo: (1) código do cliente em vez do CNPJ; (2) se a posição jurídica condiciona a opção E, e a data de decisão E ou D; (3) escopo do motor (duas soluções, janela única, texto do aceite); (4) padrão de integração Airflow e AWS; (5) base do funding com a Bruna.
Decisões do Ricardo em 27/10/2026 sobre os achados: orquestração por manifesto e arquivo de sucesso aprovada ("o que funcionar"); a A3 trabalha com os dados reais por enquanto (ESP-v4-07 aceito, tratado por acesso nominal e contrato de operador); código do cliente no lugar do CNPJ (ESP-v4-04 adotado); posição do jurídico mantida como checagem antes do primeiro dado real; decisões de arquitetura mantidas e foco na POC para o funding (ESP-v4-05 e 06 ficam fora do foco imediato); base do funding: explicação pedida, pendente com a Bruna (ESP-v4-11).

Funding (27/10/2026): o Ricardo confirmou que a AWS paga à A3 10% do consumo anual projetado da produção, na conta da 3C, e que a projeção da produção é elegível. A leitura "10% do valor do SOW" (ESP-v4-11) fica descartada. Consumo mínimo para R$ 50 mil: ≈ US$ 7,6 mil por mês (seção 8.7 de arquitetura-proposta.md). **Atualização de 29/10/2026:** o Ricardo definiu a meta como US$ 100 mil de consumo anual projetado, que rendem US$ 10 mil (≈ US$ 8,3 mil por mês), manteve a escala do funding (cenário de plataforma) e descartou o Desenho 2.
