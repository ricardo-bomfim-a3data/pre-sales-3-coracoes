# Ficha do projeto — 3 Corações · Recomendação de SKU (NBO/MBA) B2B

Versão: v1 · 2026-10-26 · Status: pré-vendas (proposta em aprovação final na diretoria do cliente)
Modo de viés tecnológico: aws (restrições do cliente prevalecem: stack Snowflake + Airflow existente)

## Cliente e oportunidade
- Cliente: 3 Corações (café e alimentos). Contatos citados na proposta: Marcus Bruno (D&A/Produto) e Thiago Costa. Outros nomes na especificação: João Pedro Felismino (Engenharia), Camila (CRM), Helena (Inteligência Comercial).
- Objeto: POC/MVP de recomendação de SKU por PDV (B2B) com NBO (Next Best Offer) e MBA (Market Basket Analysis) para três mecânicas de CRM: Combos (MBA), Mais por Menos/Escalonada (NBO) e Desconto (NBO). Validação por teste A/B 50/50, KPI principal: margem de contribuição.
- Proposta A3Data V1 (jun/2026): R$ 537.492, 20 semanas (5 meses), Time & Material. Squad: Cientista de Dados Sr (fulltime M1–M5), Eng. ML Sr (fulltime M1–M3), Advisor Arquiteto (pontual), Consultor Líder (50%).
- Reunião interna 2026-10-22: proposta aguarda data de apresentação para liberação de orçamento; POV (prova de valor) mantida como "carta na manga"; funding AWS depende de SOW + calculadora de arquitetura (repasse ~10%, mínimo R$ 50 mil — FATO: notas da reunião, A VERIFICAR com AWS); cliente teve experiência anterior negativa com IA (cenário sensível); Ricardo deve esclarecer Snowflake × S3 e mapear ingestão a partir do SAP.

## Fontes (docs/03-fontes/)
- especificacao-3c-v0.txt — "Especificações - Recomendação de SKU (Data Science) - V0", documento do cliente (7 páginas). Referenciar como E§<seção> (ex.: E§4.4.1, RF03).
- proposta-a3data-v1-jun2026.txt — Proposta técnica e comercial A3Data V1. Referenciar como P§<slide/tópico>.
- reuniao-interna-2026-10-22.txt — anotações (Gemini) da reunião interna A3Data. Referenciar como R§.
- Diagramas existentes (v1, 22–23/10/2026): docs/01-arquitetura/diagramas/3coracoes_arquiteturas_to-be_v1.drawio (opções A/B/C + DAG semanal) e 3coracoes_contexto_ponta-a-ponta_v1.drawio (fases F0 POV / F1 MVP / F2 escala). Ponto de partida, não decisão: nenhum ADR aprovado ainda.

## Fatos estabelecidos (com fonte)
- Stack de dados do cliente: SAP (origem) → Snowflake (camada analítica); orquestração Airflow do cliente; notebooks Python "com a stack interna da 3corações" (E§4.4.1–4.4.3; R§ detalhes).
- Entregáveis exigidos pela especificação: notebooks integrados ao Snowflake, DAG semanal no Airflow + execução manual, RF01–RF07 (leitura, relatório pré-execução, pré-processamento com regras de estoque e compra recente, NBO, MBA, tabela única, tabela SCD).
- Feature Store de Clientes existe (histórico desde mai/2025, Base Visão 360°); Feature Store de Produtos a desenvolver pelo cliente (RNF01, resp. Marcus Bruno / João Pedro Felismino).
- Aberturas mínimas: canal (Varejo/Food/B2B), geo (regional/filial/UF/capital×interior), área de atuação do vendedor, qualificação de SKU (novos × já comprados), janela (1/3/6/9/12 meses).
- A proposta A3Data propõe estratégia híbrida: Amazon Personalize (M1–M3, com endpoint API REST por CNPJ e storage NoSQL) + challenger open source (M4–M5), champion vs challenger. Custo AWS estimado ~US$ 924/mês, ~R$ 27 mil em 5 meses (P§Infra). Mensuração de campanha no Salesforce (P§Premissa 5).
- CONTRADIÇÃO CENTRAL: a especificação do cliente exige execução na stack interna (Snowflake + Airflow + notebooks, lote semanal); a proposta prevê Personalize + API online na AWS. Reunião interna registrou a ambiguidade Snowflake × S3 como pendência do Ricardo.
- Regiões: Snowflake do cliente em região a confirmar; Amazon Personalize não está disponível em sa-east-1 (A VERIFICAR na documentação oficial) → dados sairiam do Brasil (LGPD).
- Dados pessoais: PDV identificado por CNPJ; cadastro pode conter dados de pessoa física (MEI, contatos, vendedor). A3 é operadora.

## Restrições e premissas de trabalho
- Nenhum acesso a contas AWS ou a dados do cliente nesta fase; trabalhar com schema, contagens e agregados; exemplos sintéticos.
- Decisões de arquitetura são do Ricardo; registrar propostas como ADR status "proposto".
- Entregáveis desta rodada (pré-vendas): (1) desenho completo da arquitetura proposta; (2) lista de questionamentos ao cliente; (3) lista de detalhes faltantes (técnico e negócio). Listas em formato compatível com Google Sheets (CSV/XLSX).
