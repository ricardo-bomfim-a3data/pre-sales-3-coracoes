# ADR-001 — Motor de recomendação e faseamento da arquitetura

- Status: **proposto**
- Data: 2026-10-26
- Decisor: Ricardo Bomfim (Arquiteto de Dados, A3)
- Autor do rascunho: ARQ (squad A3)
- Contexto detalhado: `docs/01-arquitetura/arquitetura-proposta.md`; diagrama `docs/01-arquitetura/diagramas/3coracoes_to-be_v2.drawio`

## Contexto

- A especificação da 3 Corações exige notebooks Python na stack interna, integrados ao Snowflake, com execução semanal orquestrada pelo Airflow e execução manual a qualquer momento (FATO: E§4.4.1–4.4.3, especificacao-3c-v0.txt:177-186), e saídas em tabela única e tabela SCD (RF06, RF07).
- A proposta A3 V1 prevê Amazon Personalize como motor em M1–M3, endpoint REST por CNPJ e storage NoSQL no M3, e challenger open source em M4–M5 (FATO: P§Escopo Inicial Sugerido, proposta:284-300), com custo AWS estimado de ~US$ 924/mês (P§Infra, proposta:310).
- Amazon Personalize não está disponível em sa-east-1 e está em us-east-1 (FATO: AWS MCP get_regional_availability, 2026-10-26). Usá-lo implica exportar dados de clientes (pseudonimizados) para fora do Brasil, o que é transferência internacional (LGPD art. 33) e exige parecer jurídico.
- Amazon SageMaker AI está disponível em sa-east-1 (FATO: mesma consulta).
- Cliente teve experiência negativa anterior com IA (R§, reuniao:30); descumprir a especificação aumenta o risco de rejeição na homologação.
- Integrações (Sírius, Salesforce, B2B), engenharia de dados e BI são responsabilidade da 3C (P§Escopo, proposta:252-253).

## Decisão proposta

Adotar a **Opção C — híbrido por fases**:

1. **F1 (MVP, caminho crítico)**: motor campeão em Snowpark Python dentro do Snowflake da 3C, desenvolvido em notebooks que importam um pacote versionado e publicado como stored procedures; DAG semanal e disparo manual no Airflow da 3C; RF06/RF07 no Snowflake como fonte de verdade. Nenhum dado sai do Snowflake.
2. **F1b (benchmark, fora do caminho crítico)**: Amazon Personalize em us-east-1 como desafiante offline, com o mesmo recorte e as mesmas métricas, em 3 a 6 rodadas, condicionado ao gate G0 (parecer jurídico e DPO). Se G0 for negativo, o desafiante roda em SageMaker AI sa-east-1 (variante C-BR) ou o benchmark é dispensado.
3. **F2 (escala)**: ~~serving online por cliente em sa-east-1 (API Gateway + Lambda + DynamoDB)~~ **Revisado em 26/10/2026 pela ADR-002**: a F2 passa a ser a camada de consumo AWS em sa-east-1 (S3 + Glue/Lake Formation + Athena + Bedrock AgentCore + QuickSight), que dá à Opção C o viés AWS pedido e vira a Opção D. O serving online por API fica como evolução, decidido em ADR próprio quando houver consumidor online (Sírius em tempo de visita ou App B2B). O motor continua sendo o vencedor do champion × challenger (G2).

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| A · Personalize como motor (proposta V1) | Não cumpre E§4.4.1; coloca transferência internacional no caminho crítico do MVP; Personalize não cobre MBA com regras de associação por abertura (MBA ficaria no Snowflake de qualquer forma); custo varia de ~US$ 650 a ~US$ 5.300/mês conforme o desenho de treinos (preço oficial consultado em 2026-10-26) |
| B · Somente stack do cliente | Cumpre a especificação, mas abandona a tese de plataforma × custom da proposta enviada, zera o consumo AWS (sem base para funding) e não planeja a escala online |
| C-BR como opção principal | Mantém dados no Brasil, mas exige mais engenharia que o Personalize para um benchmark; fica como plano B do F1b |

## Consequências

Positivas:
- Aderência integral à especificação no caminho crítico; homologação mais simples.
- MVP independe de parecer jurídico e de conta AWS.
- Personalize avaliado com dados reais e critérios pré-registrados; decisão de plataforma de escala baseada em evidência.
- Serving online planejado no Brasil, desacoplado do motor (RF06 como contrato).

Negativas e riscos:
- Reordenação do plano da proposta V1 (Personalize sai de M1–M3; API sai de M3) precisa ser comunicada e aceita pelo cliente e pelo comercial A3.
- Consumo AWS na POC fica pequeno (dezenas a poucas centenas de US$/mês), o que reduz a base para funding; o SOW deve apoiar-se no consumo projetado de F2.
- Créditos Snowflake do desenvolvimento e da produção recaem sobre a 3C (A VERIFICAR quem paga).
- Dependência de Snowpark Python e de warehouse com memória suficiente para treino (A VERIFICAR com a 3C).

## Condições para revisão

- Cliente revoga E§4.4.1 por escrito e jurídico aprova transferência internacional → reavaliar Opção A.
- Snowpark indisponível ou insuficiente → reavaliar onde roda o motor (worker do Airflow, SageMaker sa-east-1), com nova análise de E§4.4.1.
- Personalize vence o G2 com margem relevante → ADR de F2 define seu uso em produção (com G0 renovado).
- AWS disponibiliza Personalize em sa-east-1 → reavaliar F1b e F2.

## Pendências que bloqueiam a aprovação

ARQ-Q01 (região do Snowflake), ARQ-Q03 (Snowpark), ARQ-Q06/Q07 (Airflow e entrega), ARQ-Q08 (stack de notebooks), ARQ-Q16 (posição jurídica sobre transferência internacional), ARQ-Q29 (funding e faturamento AWS) — ver tabela de lacunas em `docs/01-arquitetura/arquitetura-proposta.md`, seção 11.
