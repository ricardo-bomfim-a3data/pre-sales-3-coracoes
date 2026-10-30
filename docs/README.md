# 3 Corações · Recomendação de SKU (NBO/MBA) B2B — pré-vendas

Rodada de 2026-10-26, atualizada em 2026-10-29 (decisões: MBA no Personalize, SageMaker AI excluído, cronograma W0 a W6, funding por cenário de plataforma com meta de US$ 100 mil por ano, desenho único sem o Desenho 2). Coordenação pelo squad A3 (NEG, ARQ, DAD, ENG, ESP). Nenhum acesso a dados ou contas do cliente; tudo a partir dos três documentos em `03-fontes/`.

## Entregáveis desta rodada
| O quê | Onde |
|---|---|
| Desenho completo da arquitetura (opções A/B/C + C-BR, recomendação C, contratos RF06/RF07, segurança/LGPD, operação, custo, roadmap) | `01-arquitetura/arquitetura-proposta.md` |
| Diagrama editável draw.io v2, 6 abas (Contexto, Técnica, Fluxo de dados, Segurança e LGPD, Operação, Fases e roadmap) | `01-arquitetura/diagramas/3coracoes_to-be_v2.drawio` |
| Diagrama v3.1 (histórico): 4 abas, fluxo numerado de 1 a 25, motor no Snowflake e camada de consumo AWS (Opção D) | `01-arquitetura/diagramas/3coracoes_to-be_v3.drawio` |
| **Diagrama v4.4 (vigente)**: 5 abas (Arquitetura visão geral e técnica, Dados/acesso/retenção, Fases, POC para o funding). Desenho único (Desenho 1); o Desenho 2 foi descartado em 29/10 | `01-arquitetura/diagramas/3coracoes_to-be_v4.drawio` |
| ADR proposto: motor de recomendação e fases | `02-adrs/ADR-001-motor-de-recomendacao-e-fases.md` |
| ADR substituído: camada de consumo AWS com Quick e Bedrock (Opção D) | `02-adrs/ADR-002-camada-de-consumo-aws-bedrock.md` |
| ADR proposto (vigente): motor na AWS com Personalize (NBO, mais por menos e MBA; SageMaker AI excluído em 28/10; desenho único desde 29/10) | `02-adrs/ADR-003-motor-na-aws-personalize-sagemaker.md` |
| Crítica de implementabilidade, esforço P/M/G, riscos | `01-arquitetura/critica-implementabilidade.md` |
| Requisitos, conflitos espec × proposta, glossário, perguntas de negócio | `06-requisitos-e-glossario.md` |
| Dados × perguntas de negócio, dicionário de métricas, consultas de perfilamento | `07-metricas-e-consumo.md` |
| Revisão crítica independente, redundâncias, 13 decisões pré-assinatura | `08-revisao-especialista.md` |
| **Planilhas (Google Sheets)**: XLSX com 5 abas + CSVs | `04-listas/` |

## Planilhas em `04-listas/`
- `3coracoes_questionamentos_e_lacunas.xlsx` — abas: Decisões pré-assinatura · Questionamentos · Detalhes faltantes · Pré-contrato (cliente) · Lista completa.
- CSVs equivalentes (UTF-8 com BOM, importáveis direto no Google Sheets: Arquivo → Importar).
- Colunas: ID, Origem (papel), Tipo, Área, Tema, Pergunta ou lacuna, Por que importa, Fonte (E§ especificação / P§ proposta / R§ reunião), Bloqueante, Quando precisa, Responsável sugerido (cliente), Hipótese de trabalho atual, Prioridade (P1 bloqueante; P2 pré-contrato/kickoff; P3 demais), Canal (Escrito / Conversa / Interno A3 / Informar plano / Reescrever), Consolidado em (duplicado absorvido por outro ID), Status, Resposta do cliente.
- Regenerar após editar os documentos: `node tools/consolidar-listas.mjs` na raiz do projeto.

## Fontes e referências
- `00-ficha-projeto.md` — contexto, fatos com fonte, contradição central.
- `03-fontes/` — textos extraídos dos PDFs/DOCX originais (em `../Documentos/`).
- `05-referencias-verificadas.md` — fatos verificados em documentação oficial (Personalize fora de sa-east-1, preços, limites) e itens A VERIFICAR.
- Diagramas v1 (22–23/10) mantidos em `01-arquitetura/diagramas/` como histórico.
