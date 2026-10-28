# ADR-003 — Motor de recomendação na AWS: Personalize (NBO e MBA), com SageMaker AI como reserva, em dois desenhos

**Atualização de 28/10/2026 (direção do Ricardo):** o MBA passa do SageMaker AI para o Personalize. Base: um cientista de dados da A3 rodou uma POC anterior para a mesma 3C com o cenário completo e relatou que suporte, confiança e lift saíram do próprio Personalize, com o pedido como unidade. Ressalvas registradas: o relato é verbal; o projeto foi apagado e a pessoa não sabe dizer qual receita ou recurso usou; a documentação pública do Personalize consultada em 27/10 (lista de receitas e página da SIMS) não mostra recurso que calcule essas métricas nem aceita algoritmo próprio. Por isso o NBO e o MBA no Personalize entram com **testes de aceite** com pedidos reais da 3C, o quanto antes: na W1 do cronograma (W0 a W6), com uma amostra liberada na W0. **O SageMaker AI foi excluído da arquitetura** (mesmo dia, direção do Ricardo): o desenho oficial usa só o Personalize, com o Glue de apoio e o Step Functions; o desafiante de NBO passa a ser outra receita do Personalize. Se os testes não confirmarem a cesta, o plano é o piso em SQL no Snowflake (regras de cesta) e nova decisão com a 3C, não a volta do SageMaker AI. Onde o texto abaixo disser que o MBA fica no SageMaker AI, ou que ele é opcional ou reserva, vale esta atualização.

Status: proposto (direção do Ricardo em 27/10/2026; revisado pelo especialista no mesmo dia, 15 achados em docs/08, seção 9; aguarda aprovação formal). Substitui o ADR-002. Diagrama de referência: `docs/01-arquitetura/diagramas/3coracoes_to-be_v4.drawio`, abas 1 a 6.

**Desenho fechado da cesta (MBA), 28/10/2026.** O colega que fez a POC anterior não lembra o recurso usado, então os recursos foram escolhidos pela documentação oficial, não pelo relato:
1. **Personalize, receita SIMS (`aws-sims`, RELATED_ITEMS), em um grupo de dados próprio da cesta.** Cada pedido entra como um "usuário" (`USER_ID` = número do pedido, `ITEM_ID` = SKU, uma interação por linha do pedido). Como a SIMS mede a co-ocorrência no histórico do usuário, isso transforma o histórico em cesta, resolvendo a limitação de que a SIMS olharia o PDV ao longo do tempo. Lote: lista de `itemId` dos ~500 SKUs ativos como âncora, uma recomendação por âncora.
2. **Glue calcula suporte, confiança e lift** dos pares (e trios) candidatos, sobre a mesma tabela de pedidos, por abertura (canal e região) e com backoff, gravando `nivel_backoff`. Motivo: a documentação mostra que o lote da SIMS devolve só a lista de itens (sem pontuação) e a pontuação do tempo real é a certeza do modelo sobre a próxima escolha, não uma das três métricas. Se o Personalize emitir as métricas, o Glue só as confere.
3. Não entram Similar-Items (usa metadados de itens, outro cálculo), Item-Affinity (segmenta usuários, serve ao mais por menos) nem SageMaker AI.
4. Trade-off honesto: a SIMS traz o ranking colaborativo, mas as regras com suporte, confiança e lift poderiam sair só do Glue (ou do SQL do piso). O teste de aceite da W1 compara os pares da SIMS com os pares ordenados por lift; se a SIMS não agregar, a cesta fica só com o cálculo do Glue.
Limites verificados (docs AWS, 28/10): SIMS considera até 500 milhões de interações no treino (ajustável) e 750 mil itens; lote com até 1 GB de entrada e 50 milhões de registros por arquivo; a SIMS exige 1.000 interações e 25 usuários (pedidos) com 2 ou mais itens.

## Contexto

- A especificação da 3C (E§4.4.1 a 4.4.3) pede notebooks na stack interna, Snowflake e Airflow semanal com execução manual. A proposta A3 V1 previa o Personalize como motor. O ADR-001 resolveu a contradição com o motor no Snowflake e o Personalize como desafiante; o ADR-002 acrescentou uma camada de consumo AWS com Quick, Bedrock e Redshift Serverless.
- Em 27/10/2026 o Ricardo decidiu: (a) o Personalize e o SageMaker AI bastam para entregar NBO e MBA completos; (b) estruturar dados para Quick e Bedrock foi um erro agora que a arquitetura está de ponta a ponta; (c) o objetivo é provar valor rápido e sustentar o funding.

## Decisão

1. **Motor na AWS, região única us-east-1, conta da 3C.** NBO e mais por menos no **Amazon Personalize** (duas soluções: recomendação por cliente para o desconto e receita de afinidade com item, em segmentação em lote, para o mais por menos). MBA no **SageMaker AI** (job de processamento com Spark, regras de associação com suporte, confiança e lift). **Glue só como apoio**: prepara os arquivos de entrada e formata as saídas. **Step Functions orquestra; o Airflow da 3C só agenda e carrega.** Padrão proposto: o Airflow não chama a AWS; o manifesto gravado no S3 pela exportação aciona o Step Functions, e o arquivo de sucesso da saída libera a carga no Snowflake (ARQ-Q49). Desafiante de NBO no SageMaker AI é opcional.
2. **Quick, Bedrock, Redshift Serverless e Lake Formation saem do desenho.** A API por CNPJ e o NoSQL continuam fora do escopo (ADR-002 mantido nesse ponto).
3. **Dois desenhos.**
   - **Desenho 1 (oficial):** grupos do teste A/B, registro de exposição, medição, painel diário (BI atual da 3C) e tabelas de recomendação ficam no Snowflake e no Airflow. A AWS recebe entradas por exportação semanal e devolve as saídas por carga.
   - **Desenho 2 (alternativa):** sorteio dos grupos, medição e painel também na AWS (tabelas Iceberg no catálogo do Glue, Athena, Amazon Managed Grafana). As tabelas de recomendação continuam entregues ao Snowflake.
4. **Dados e acesso.** O código do cliente do SAP substitui o CNPJ nas cópias para a AWS (decisão de 27/10); o CNPJ fica só no Snowflake. A equipe da A3 trabalha com os dados reais por enquanto, sob contrato de operador, com acesso nominal, registrado no CloudTrail e revisado pela 3C. Controle de acesso rigoroso: papéis nominais, verificação em duas etapas, chave KMS administrada pela 3C, bucket sem acesso público. MEI e empresário individual: a chave ainda liga ao CNPJ, reavaliar se o DPO exigir.
5. **Retenção.** Arquivos de entrada e saída na AWS: 30 dias. Dataset do Personalize: enquanto o modelo estiver ativo. Métricas, regras de cesta, versões de modelo e logs de auditoria: sem prazo. Histórico completo no Snowflake, sem prazo, definido pela 3C. Não há datamart na AWS no Desenho 1.
6. **Aceite da 3C como condição.** O motor na AWS contraria E§4.1, 4.3.1.2, 4.4.1 a 4.4.3 e RNF04, e a proposta prometia API no M3; o aceite por escrito (ARQ-Q46) e o contrato de operador 3C e A3 no mês 1 são pré-requisitos do contrato. Plano alternativo: Opção D (motor no Snowflake, v3). Na fase 1 a A3 mantém um piso em SQL no Snowflake (popularidade e cesta) como régua offline e contingência; a decisão entre E e D sai no fim do mês 1. Em 27/10 o Ricardo informou que as decisões de arquitetura se mantêm e que o foco imediato é a POC para o funding; o aceite não foi retirado, apenas saiu do foco imediato.
7. **Painel diário (RNF02).** Hoje a carga de vendas é semanal. Até o time da 3C entregar a carga diária (ARQ-Q45), o painel D-1 atualiza semanalmente nos dois desenhos; depois basta trocar o parâmetro.
8. **POC para o funding.** Desenho 1 em escala menor (1 filial, 1 a 2 famílias, 4 a 6 semanas, disparo à mão), com comparação offline contra o piso em SQL e projeção de consumo da produção na calculadora do SOW (aba 7 do diagrama v4; seção 4.8 de arquitetura-proposta.md).
9. **Orquestração aprovada.** O Airflow não chama a AWS; manifesto no S3 aciona o Step Functions e arquivo de sucesso libera a carga (aprovado pelo Ricardo em 27/10: "o que funcionar").

## Fatos verificados (documentação AWS, 27/10/2026)

- Personalize: o filtro por interação usa só o tipo de evento e considera as 100 interações mais recentes por cliente e tipo (cota ajustável); valor dinâmico só com IN e =; o lote aceita filtros via `filterValues`. Por isso "já comprado no mês" e estoque são conferidos de novo no filtro final do Glue e no Snowflake. A receita de afinidade com item aceita até 500 itens por entrada.
- Personalize: mínimo de 1.000 interações e 25 usuários com 2 ou mais interações; recomendado 50 mil interações de 1.000 usuários; o job em lote lê uma lista de userIds em JSON no S3 e grava as recomendações no S3; filtros e promoções permitem regras de negócio simples; disponível em us-east-1 e não em sa-east-1.
- SageMaker AI: imagens prontas de Apache Spark para jobs de processamento, com limite de execução de até 5 dias.
- Managed Grafana: lê o Athena sem plugin pago; ler o Snowflake exige plugin Enterprise com taxa por usuário ativo; autenticação por IAM Identity Center ou SAML; preço de exemplo US$ 9 por editor e US$ 5 por leitor ativo por mês.
- Receitas do Personalize na documentação (27/10/2026): User-Personalization (v1 e v2), Personalized-Ranking (v1 e v2), Trending-Now, Popularity-Count, SIMS, Similar-Items, Semantic-Similarity, Next-Best-Action, Item-Affinity e Item-Attribute-Affinity. Nenhuma menciona regra de associação, suporte, confiança ou lift. A SIMS mede co-ocorrência no histórico do usuário e não usa dados de itens ou de usuários no treino.
- CONTRADIÇÃO ABERTA (28/10): o relato do cientista de dados da A3 diz que as três métricas saíram do Personalize, por pedido. Não verificado; o teste de aceite resolve.
- INFERÊNCIA: margem não é objetivo nativo.

## A verificar

- **Testes de aceite do NBO e do MBA no Personalize (28/10), na W1.** Rodar com pedidos reais de 1 filial e 1 a 2 famílias, em amostra extraída do Snowflake sem esperar a carga completa. NBO: (n1) o desconto por cliente separa itens novos e recompra com os filtros do Personalize; (n2) o lote lê 300 mil clientes e devolve as listas; (n3) o desempenho offline supera o piso em popularidade. MBA: (a) qual receita ou recurso gera as regras; (b) a unidade é o pedido, não o histórico do PDV; (c) saem suporte, confiança e lift por par (e trio, se a 3C quiser), com limites mínimos configuráveis; (d) abertura por região ou filial e backoff (nível de abertura gravado); (e) reprodutibilidade (mesmas regras em duas execuções). Se qualquer item de (a) a (c) falhar, o plano é o piso em SQL e uma nova decisão com a 3C (o SageMaker AI não volta ao desenho). Peça ao colega: nome do recurso, notebook ou captura de saída, mesmo que o projeto tenha sido apagado.
- Funding (regra confirmada pelo Ricardo em 27/10): a AWS paga à A3 10% do consumo anual projetado da produção, na conta da 3C. Mínimo de repasse de R$ 50 mil (A VERIFICAR se é piso rígido) exige consumo de cerca de US$ 7,6 mil por mês; a produção base fica em US$ 1,0–1,4 mil (seção 8.7 de arquitetura-proposta.md).
- Se as promoções do Personalize valem em lote, se ele usa o cadastro de clientes e o preço da afinidade com item.
- Preço do Glue, do SageMaker AI e do Managed Grafana na calculadora; custo de saída de dados do Snowflake.
- Região do Snowflake, SCP de regiões na organização AWS da 3C, região do IAM Identity Center.
- Posição do DPO e do jurídico sobre CNPJ real fora do país (expectativa do Ricardo: sem impedimento; não verificada).
- Se o Personalize atinge qualidade suficiente com o volume real de interações.

## Consequências

- Positivas: entrega mais direta e próxima da proposta V1; NBO e MBA com serviços gerenciados; consumo AWS para o funding; sem camada de consumo extra a operar.
- Negativas: o motor sai do Snowflake e exige aceite; a rodada semanal depende da AWS e da integração de armazenamento do Snowflake; CNPJ real fora do país; o consumo em lote é pequeno para sustentar o funding sozinho; competência de ML em AWS no squad; menos explicabilidade para a Inteligência Comercial (compensar com colunas de motivo nas tabelas).
- Itens das listas afetados: ARQ-Q43 a ARQ-Q50, ARQ-D12, ESP-Q08, ESP-Q09, ESP-D02, ESP-D03.

## Alternativas descartadas

- Opção D (v3): motor no Snowflake e camada de consumo AWS com Quick e Bedrock. Fica como plano alternativo.
- Camada semântica e assistente em Bedrock: descartada pelo Ricardo.
- Divisão entre sa-east-1 e us-east-1: descartada; tudo em us-east-1.
- API REST por CNPJ e NoSQL: mantidos fora do escopo.
