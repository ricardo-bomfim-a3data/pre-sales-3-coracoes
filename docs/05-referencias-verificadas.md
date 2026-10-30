# Referências verificadas
Formato: item · fato verificado · URL · data de verificação. Só o coordenador edita este arquivo.

## Amazon Personalize
- Disponibilidade regional · sa-east-1 com status "isNotExpandingIn" (não disponível, sem expansão prevista); us-east-1 disponível · AWS Regional Availability via AWS MCP (get_regional_availability) · 2026-10-26 (ENG)
- Mínimos para treinar · 1.000 interações e 25 usuários com ≥ 2 interações; recomendado 50 mil interações de ≥ 1.000 usuários; até 5 colunas de metadados no dataset de interações · https://docs.aws.amazon.com/personalize/latest/dg/readiness-checklist.html · 2026-10-26 (ENG)
- Limites de import · dataset import FULL até 100 GB e INCREMENTAL até 1 GB por job · https://docs.aws.amazon.com/personalize/latest/dg/limits.html · 2026-10-26 (ENG)

## A VERIFICAR (ainda sem fonte)
- Preços do Personalize (treino por hora, ingestão por GB, inferência em lote) em us-east-1.
- Disponibilidade de lightgbm, implicit e mlxtend no canal Anaconda do Snowflake.
- Execução de notebooks por SQL (EXECUTE NOTEBOOK) e Container Runtime na região/nuvem da conta Snowflake do cliente.
- Condições do funding AWS (repasse ~10%, mínimo R$ 50 mil) citadas na reunião interna. Em 29/10 o Ricardo definiu a meta como US$ 100 mil de consumo anual projetado (repasse de US$ 10 mil); a AWS ainda deve confirmar o critério.

## Adicionadas pelo ARQ (2026-10-26)
- Amazon SageMaker AI · disponível em sa-east-1 · AWS MCP get_regional_availability · 2026-10-26
- Amazon Personalize, preço v2 (us-east-1) · ingestão US$ 0,05/GB; treino US$ 0,002 por mil interações; inferência US$ 0,15 por mil requisições; campanha em tempo real cobra mínimo de 1 TPS · https://aws.amazon.com/personalize/pricing/ · 2026-10-26
- A VERIFICAR: preço do Item-Affinity (segmentação); crédito Snowflake e warehouse Snowpark-optimized; itens de apoio na calculadora AWS; restrição de bucket S3 por VPC do Snowflake; S3 na mesma região do Personalize.

## Verificadas em 26/10/2026 (camada de consumo AWS, ADR-002)

- Bedrock Knowledge Bases com dado estruturado: motores Amazon Redshift e AWS Glue Data Catalog (Lake Formation); Snowflake não é fonte direta. https://docs.aws.amazon.com/bedrock/latest/userguide/kb-how-data.html
- Regiões das KBs estruturadas incluem South America (São Paulo). https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-supported.html
- Inferência entre regiões obrigatória nas KBs estruturadas desde 10/05/2026; em sa-east-1 pode processar fora da geografia; sem custo adicional. https://docs.aws.amazon.com/bedrock/latest/userguide/kb-structured-cris.html
- Amazon Q in Quick não disponível em sa-east-1. https://docs.aws.amazon.com/quick/latest/userguide/regions.html
- Catálogo regional AWS: Amazon Bedrock, Amazon Bedrock AgentCore, Amazon Athena, Amazon Redshift, AWS Glue disponíveis em sa-east-1.
- A VERIFICAR: modelos Claude in-region em sa-east-1; KB estruturada via Glue Catalog sem Redshift; custos Bedrock/AgentCore/Athena/QuickSight.

## Verificadas em 26/10/2026 (reconferência de regiões)

- Amazon Personalize (catálogo regional AWS): disponível em us-east-1, us-east-2, us-west-2, ca-central-1, eu-west-1, eu-central-1, ap-northeast-1, ap-northeast-2, ap-southeast-1, ap-southeast-2, ap-south-1. Status "isNotExpandingIn" em sa-east-1, mx-central-1, us-west-1, eu-west-2, eu-west-3, eu-north-1, ap-southeast-3, me-south-1, af-south-1.
- Bedrock Knowledge Bases: variante com dado estruturado disponível em sa-east-1 e us-east-1; variante vetorial com Titan Text Embeddings V2 e Cohere Embed em sa-east-1; variante gerenciada ("managed") não listada em sa-east-1. https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-supported.html

## Verificadas em 27/10/2026 (motor na AWS, ADR-003)

- Amazon Personalize, requisitos mínimos: 1.000 interações e 25 usuários com 2 ou mais interações; recomendado 50 mil interações de 1.000 usuários. https://docs.aws.amazon.com/personalize/latest/dg/interactions-datasets.html e https://docs.aws.amazon.com/personalize/latest/dg/limits.html
- Amazon Personalize, recomendações em lote: entrada JSON no S3 (lista de userIds nas receitas de usuário, lista de itemIds nas receitas de itens relacionados), saída no S3; sem lote na receita Trending-Now. https://docs.aws.amazon.com/personalize/latest/dg/batch-data-upload.html
- Amazon Personalize, promoções e filtros por regra de negócio em recomendações em tempo real. https://docs.aws.amazon.com/personalize/latest/dg/promoting-items.html
- Amazon Personalize, receitas v2 aceitam pesos por tipo de evento (por exemplo, compra com mais peso que clique); margem como objetivo não aparece na documentação consultada. https://docs.aws.amazon.com/personalize/latest/dg/event-values-types.html
- (Histórico: o SageMaker AI foi excluído da arquitetura em 28/10/2026.) Amazon SageMaker AI, job de processamento com imagem pronta de Apache Spark, limite de execução de 5 dias. https://docs.aws.amazon.com/sagemaker/latest/dg/use-spark-processing-container.html
- (Histórico: o Desenho 2 foi descartado em 29/10.) Amazon Managed Grafana: fonte de dados Athena disponível sem plugin pago; Snowflake e outras fontes exigem plugin Enterprise com taxa por usuário ativo; autenticação por IAM Identity Center ou SAML; preço de exemplo US$ 9 por editor e US$ 5 por leitor ativo por mês, mais US$ 45 por usuário ativo no plugin Enterprise. https://docs.aws.amazon.com/grafana/latest/userguide/Athena-adding-AWS-config.html, https://docs.aws.amazon.com/grafana/latest/userguide/AMG-data-sources-enterprise.html e https://aws.amazon.com/grafana/pricing/
- Verificado em 27 e 28/10/2026 (cesta no Personalize): a receita SIMS (`aws-sims`, RELATED_ITEMS) recebe uma lista de `itemId` no lote e devolve só `recommendedItems`, sem pontuação nem métrica; nenhuma receita documentada calcula suporte, confiança ou lift; o relato verbal de que o Personalize gerou as três métricas por pedido não é confirmado pela documentação (projeto apagado). Limites da SIMS: 500 M de interações consideradas (ajustável) e 750 mil itens; lote de até 1 GB, 50 M de registros por arquivo e 1.000 arquivos. Preços: receitas clássicas com treino de US$ 0,24 por hora e lote de US$ 0,067 por mil recomendações (primeiros 20 M). Fonte: documentação e página de preços do Personalize (https://docs.aws.amazon.com/personalize/latest/dg/limits.html e https://aws.amazon.com/personalize/pricing/).
- A VERIFICAR: preço real do Glue (DPU-hora) na calculadora e horas de treino da SIMS (20 na base e 200 em escala são estimativas, medir na W1); se a SIMS agrega sobre pares ordenados por lift; critério de funding da AWS.

## Adicionadas pela revisão do ESP (2026-10-27)

- Personalize · o filtro por interação usa só o tipo de evento; considera até 100 interações recentes por cliente e tipo (cota ajustável) · https://docs.aws.amazon.com/personalize/latest/dg/filter-expressions.html
- Personalize · lote e segmentação aceitam filtros; valores dinâmicos em filterValues no JSON de entrada · https://docs.aws.amazon.com/personalize/latest/dg/filter-batch.html
- Personalize · valor dinâmico no filtro só com IN e = · https://aws.amazon.com/blogs/machine-learning/amazon-personalize-now-supports-dynamic-filters-for-applying-business-rules-to-your-recommendations-on-the-fly/
- Personalize Item-Affinity · segmentação de clientes por item em lote; até 500 itens por entrada; nova versão do modelo para incluir clientes novos · https://docs.aws.amazon.com/personalize/latest/dg/item-affinity-recipe.html
- Personalize User-Personalization-v2 · treina com interações e itens; itens novos dependem de promoção (tempo real) · https://docs.aws.amazon.com/personalize/latest/dg/native-recipe-user-personalization-v2.html
- A VERIFICAR: promoções em lote; uso do cadastro de clientes no UP-v2; preço do Item-Affinity e do Glue; cláusulas-padrão da ANPD no contrato de dados da AWS; base do funding.
