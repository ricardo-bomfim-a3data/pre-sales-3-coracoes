# ADR-002 — Fase 2 na AWS em região única (us-east-1): painéis, assistente e comparação de modelos no lugar da API por CNPJ

Status: substituído pelo ADR-003 em 27/10/2026 (o Ricardo retirou Quick, Bedrock e Redshift do desenho). Mantido como histórico; segue valendo a retirada da API por CNPJ e do NoSQL. Diagrama de referência da época: `docs/01-arquitetura/diagramas/3coracoes_to-be_v3.drawio`.

## Contexto

- A proposta A3 V1 (P§ escopo M3) lista endpoint de inferência, API REST de retrieve por CNPJ e storage NoSQL como entregáveis. A especificação da 3C (E§ RF06/RF07) define o consumo como tabela no Snowflake lida pela Inteligência Comercial, que escolhe itens e público e segue o fluxo de aprovação de preço antes de ativar no Sírius ou no B2B. A própria proposta classifica "inferência online e aplicação no app" como expansão futura. Nenhuma fonte do cliente pede API. O dado é gerado em lote semanal e o processo de decisão é humano.
- O Ricardo pediu um viés AWS que não fira E§4.4.1 a 4.4.3, e depois pediu que toda a parte AWS ficasse em uma única região fora do país, com parecer jurídico, em vez de dividir entre São Paulo e N. Virgínia.

## Decisão

1. **Retirar API por CNPJ e NoSQL do escopo contratado.** Serving online fica como evolução, decidido em ADR próprio quando existir consumidor (Sírius em tempo de visita, home do B2B).
2. **Fase 1 (meses 1 a 3) inalterada em relação à Opção C**: motor em Python/Snowpark no Snowflake da 3C, notebooks, rotina semanal e disparo manual no Airflow, tabelas de recomendação da semana e de histórico (RF06/RF07), grupos e medição do teste A/B, painel diário (RNF02) no BI atual da 3C. Nada sai do Snowflake.
3. **Fase 2 (meses 3 a 5) na conta AWS da 3C, região única us-east-1**, condicionada ao parecer jurídico:
   - Cópia semanal, pela integração de armazenamento do Snowflake, das recomendações e da medição do teste para o S3, sem dado pessoal e com CNPJ pseudonimizado; clientes pessoa física (MEI, empresário individual) excluídos.
   - Catálogo no Glue Data Catalog com permissões por tabela e coluna no Lake Formation; visões com nomes de negócio no Athena.
   - Painéis semanais do teste A/B no Amazon Quick (antigo QuickSight) com Amazon Q para perguntas em linguagem natural (meses 3 e 4).
   - Assistente da Inteligência Comercial no Bedrock, com Knowledge Base de dado estruturado (linguagem natural para SQL) tendo Redshift Serverless como motor de consulta, e ferramentas para explicar uma recomendação e montar a lista de campanha para o fluxo de preço (meses 4 e 5). Se o esforço apertar, o assistente sai antes dos painéis.
   - Comparação de modelos com o Amazon Personalize: histórico de compras pseudonimizado no S3 com exclusão em 7 dias; dataset e modelo apagados ao fim de cada rodada; orquestração por Step Functions; métricas e previsões voltam para uma tabela de comparação no Snowflake.
4. **Parecer jurídico único**, pedido antes do contrato e respondido antes do mês 3, com as seis perguntas da aba 3 do diagrama (dado pessoal ou não; base do art. 33 da LGPD; suficiência da pseudonimização; AWS como suboperadora; confidencialidade comercial; necessidade de RIPD). O contrato de operador entre 3C e A3 é separado e necessário já no mês 1, porque a A3 acessa o Snowflake desde o início.
5. **Plano B se o parecer for negativo**: fase 1 não muda; painéis só no BI atual; comparação de modelos com SageMaker AI em sa-east-1 (variante C-BR); assistente adiado ou feito no Snowflake (Cortex), sem consumo AWS.

## Por que região única fora do país

- Um só escopo de parecer, uma só conta e região para a 3C operar, e acesso ao Amazon Q in Quick e ao Personalize, que não existem em São Paulo.
- Contrapartida assumida: nenhum componente AWS fica no Brasil. Por isso só saem cópias sem dado pessoal e histórico pseudonimizado com retenção curta, e a fase 2 inteira depende do parecer.

## Fatos verificados (documentação AWS, 26/10/2026)

- Amazon Personalize: disponível em us-east-1 e em outras dez regiões; status "não vai expandir" em sa-east-1 e mx-central-1 (catálogo regional).
- Amazon Q in Quick: disponível em us-east-1; indisponível em sa-east-1 (docs.aws.amazon.com/quick/latest/userguide/regions.html).
- Bedrock Knowledge Bases com dado estruturado: disponíveis em us-east-1 e sa-east-1; o motor de consulta é o Amazon Redshift (provisionado ou Serverless), o Glue Data Catalog entra como armazenamento de metadados; Snowflake não é fonte direta (knowledge-base-structured-create.html, kb-how-data.html). Inclusões e exclusões de tabelas não substituem controles de acesso.
- Amazon Quick: o IAM Identity Center precisa estar ativo na mesma região da assinatura do Quick (setting-up-sso.html).
- Bedrock, Bedrock AgentCore, Athena, Redshift e Glue disponíveis em us-east-1 e sa-east-1.

## A verificar

- Preço por usuário do Amazon Quick e do Amazon Q; base de RPU e custo do Redshift Serverless com pausa automática.
- Se a organização AWS da 3C restringe regiões fora do Brasil (SCP) e em qual região está o Identity Center.
- Custo de saída de dados do Snowflake para o S3 (volume pequeno).
- Termos de uso de dados do Bedrock e do Amazon Q para o parecer.
- Número da resolução da ANPD sobre cláusulas-padrão de transferência internacional (confirmar com o jurídico).

## Consequências

- Positivas: entrega útil ao usuário real (Inteligência Comercial); consumo AWS para a tese de funding; cumpre E§ RF06/RF07 sem alteração; transferência internacional fora do caminho crítico.
- Negativas: cópia semanal para o S3 e segundo catálogo a governar; fase 2 inteira presa ao parecer; sustentação pela 3C em região estrangeira; exige competência Bedrock e Quick no squad (Eng. ML Sr nos meses 4 e 5, se a engenharia de dados for coberta por outro perfil).
- Itens das listas afetados: ARQ-Q43 a ARQ-Q46, ARQ-D12, ESP-Q08, ESP-Q09, ESP-D03; decisões 9 e 14 de docs/08; ARQ-Q17/ARQ-Q29 (funding); ENG-Q06/ENG-Q07 (esforço Eng. ML).

## Alternativas descartadas

- API REST por CNPJ + NoSQL (proposta V1): sem consumidor, infra fora da stack operada pela 3C, custo fixo de campanha online.
- Fase 2 dividida entre sa-east-1 (consumo) e us-east-1 (benchmark): dois escopos de parecer e sem Amazon Q em São Paulo; mantida como histórico da discussão.
- Camada semântica e agente no Snowflake (Cortex): mais simples, mas não gera consumo AWS; vira plano B.
- Motor inteiro na AWS (Personalize ou SageMaker, Snowflake só como fonte e destino): exige revogar E§4.4.1 por escrito, põe a transferência internacional no caminho crítico e não resolve o MBA.
