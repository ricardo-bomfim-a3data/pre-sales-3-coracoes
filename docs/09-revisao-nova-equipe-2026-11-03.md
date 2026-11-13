# 3 Corações · Revisão da arquitetura e da proposta com a nova equipe (03/11/2026, decisões até 12/11/2026, com a troca do Data Architect por um Engenheiro de Dados) · interno A3

Escopo: conferir os pontos já definidos (arquitetura v4.5, ADR-003, ficha, deck, SOW, calculadora, critérios de sucesso) contra a equipe fechada pelo Ricardo. Este documento registra os achados, as decisões e o que foi aplicado em cada arquivo.

## 1. Equipe e cronograma vigentes

| Papel (nomenclatura única) | Janela | O que cobre |
|---|---|---|
| CLP (Consultor Líder de Projetos) | W0 a W6, 25% do tempo | Gestão, checkpoints semanais, alinhamento com a 3C |
| Engenheiro de Dados (entrou no lugar do Data Architect em 12/11) | W0 a W2 (3 semanas), 50% do tempo | Ambiente AWS, carga e preparação no Snowflake, apoio aos testes de aceite e início do pipeline |
| Engenheiro de ML | W2 a W6 (5 semanas), 50% do tempo | Dono técnico dos critérios de sucesso, piso em SQL e go/no-go, pipeline e parte do Personalize, leitura direcional do A/B na W6, projeção de consumo, runbook e transferência de conhecimento |
| Cientista de Dados | W4 a W5 (2 semanas), 50% do tempo | Avaliação offline completa e revisão da medição do teste A/B |

| Semana | O que acontece |
|---|---|
| W0 | Alinhamentos, acessos, contrato de operador, amostra de pedidos; critérios de sucesso acordados com a 3C (números fornecidos antes pelo time de Ciência de Dados) |
| W1 | O CLP confirma com a 3C os números dos critérios no 1º dia; começam os testes de aceite do NBO e do MBA, com a divisão treino e teste; ambiente AWS e início da carga no Snowflake (Engenheiro de Dados) |
| W2 | O Engenheiro de ML entra, valida os critérios e conduz o piso em SQL e a comparação com os testes de aceite; go/no-go por mecânica no fim da semana; fim da carga e preparação; início do pipeline AWS |
| W3 | Fim do pipeline, primeira rodada semanal completa, grupos do teste A/B e tabelas de medição (A3Data); registro de exposição e painel diário (3C); decisão da janela de histórico |
| W4 e W5 | Campanhas com teste A/B; ajuste dos modelos e desafiante de NBO; entra o Cientista (50%) para a avaliação offline completa e a revisão da medição do teste A/B (barra "Avaliação offline e revisão da medição" no cronograma do deck, W4 a W5) |
| W6 | Leitura direcional do A/B (Engenheiro de ML), projeção de consumo, runbook, transferência de conhecimento e apresentação final |

O cronograma ocupa as sete semanas inteiras, da W0 à W6.

Alocação oficial da squad (12/11/2026): CLP 25%, Engenheiro de Dados 50%, Engenheiro de ML 50% e Cientista de Dados 50% apenas na W4 e na W5, o que dá 283,5 horas reais. Valores oficiais da memória de cálculo do A3 Copilot versão 1.4 (13/11/2026, `csc_01M78SXA73GJCHG07PR4M8FVZX`, rascunho, considerada final pelo Ricardo): perfis Pleno (Engenheiro de Dados, Engenheiro de ML e Cientista de Dados) e CLP II, 283,5 horas faturadas (contingência técnica de 0%), ajuste de preço de −11,52%, venda de R$ 60.071,13, receita líquida de R$ 54.756,03, custo de R$ 30.116,52 e margem líquida de 45,0% (mínimo de 44%). O resumo está em `sow/memoria-de-calculo-squad.md` e o PDF em `sow/memoria-de-calculo-copilot-v1.4.pdf`. A versão de 12/11 (Sênior, 10% de contingência, R$ 95.019,54 e margem de 50,8%) foi substituída. O Cientista passou a entrar na W4 (antes, W3).

## 2. Achados e decisões do Ricardo

| ID | Achado (resumo) | Decisão | Onde foi aplicado |
|---|---|---|---|
| EQP-01 | Critérios de sucesso da W0 sem dono técnico | O dono técnico é o Engenheiro de ML (12/11). O time de Ciência de Dados fornece os números antes da W0, o CLP os leva à 3C na W0 e os confirma no 1º dia da W1, e o Engenheiro de ML os valida ao entrar na W2, antes do go/no-go (ajuste de 12/11: o Engenheiro de ML passou a atuar da W2 à W6) | `sow/criterios-de-sucesso-alinhamento.md`, ficha, arquitetura 4.8 |
| EQP-02 | W1 sobrecarregada | Aprovada, com a carga inicial mais bem distribuída entre a W1 e a W2 (12/11). W1: testes de aceite, divisão treino e teste, ambiente AWS e início da carga. W2: piso em SQL, comparação com os testes, go/no-go por mecânica (fim da W2), fim da carga e início do pipeline. O pipeline fecha na W3. O Engenheiro de Dados fica até a W2 (troca do Data Architect em 12/11) | SOW (fases 2 e 3, escopo e cronograma), deck (slide 11), diagrama v4 (aba 4), arquitetura 4.8, ADR-003, ficha, critérios, mensagem ao time de Ciência de Dados |
| EQP-03 | Ciência de dados antes da W4 | Primeiro mantida a entrada do Cientista na W3 (12/11); depois reduzida pelo Ricardo (12/11) para a janela W4 a W5 (2 semanas), a 50% do tempo | SOW (equipe e escopo), deck (slide 11), arquitetura 4.8, ficha, critérios |
| EQP-04 | Leitura do A/B fora da janela do Cientista | Opção c (12/11): o Engenheiro de ML faz a leitura direcional do A/B na W6. O Cientista termina na W5 (mantido em 12/11) e só revisa a medição | SOW (escopo), deck (notas do slide 11), critérios, arquitetura 4.8 |
| EQP-05 | Cronograma do deck não fechava com o SOW | Decidido (12/11): o cronograma ocupa as sete semanas inteiras e nenhum documento traz reserva de tempo. As etapas foram redistribuídas | Deck (slide 11 e notas) |
| EQP-06 | Um só engenheiro para engenharia de dados, Personalize e governança AWS | Decidido (12/11): Engenheiro de ML da W0 à W6, mantido; risco aceito e registrado. Revisado em 12/11: entra um Engenheiro de Dados da W0 à W2 e o Engenheiro de ML passa a atuar da W2 à W6; depois da W2 um só engenheiro cobre engenharia de dados, Personalize e governança AWS, risco mantido | Arquitetura 4.7 (riscos) e 4.8, crítica de implementabilidade (ENG-02), ficha |
| EQP-07 | Nomes de papéis diferentes entre documentos | Decidido (12/11): nomenclatura única Engenheiro de Dados, Engenheiro de ML e CLP (Consultor Líder de Projetos) | SOW (7.1 e escopo), deck (slide 11), critérios, ficha, arquitetura |
| EQP-08 | Relação entre este projeto e outras propostas | Decidido (12/11): este projeto é tratado de forma totalmente independente; a evolução da PoC será outro projeto. Nenhum documento deste projeto cita ou relaciona outra proposta | Ficha, arquitetura (seções 1, 2, 3, 4 e 8), ADR-003, crítica (ENG-02) |
| EQP-09 | Revisão dos entregáveis do deck (13/11): avaliação offline em W5 sem barra no cronograma; piso em SQL, grupos do teste e recomendação final fora da lista; "disparo manual" não explícito | Decidido (13/11): mantida a avaliação offline na W5 e acrescentada ao cronograma; os grupos do teste A/B e as tabelas de medição ficam com a A3Data (o registro de exposição e o painel seguem com a 3C). Tabela de entregáveis com 9 itens (acrescentados: piso em SQL no item 01, grupos e tabelas de medição, resultado e recomendação de produção) | SOW (lista de entregáveis), deck gerado localmente (slides 11 e 12); **deck oficial do Drive ainda não alterado** |
| EQP-10 | Memória de cálculo v1.4 (13/11): perfis Pleno, contingência técnica 0%, desconto de 11,52%, mínimo de margem 44% | Decidido (13/11): a v1.4 é a versão final da memória do time; valores oficiais passam a ser os dela (venda R$ 60.071,13, margem 45,0%) | SOW (7.1 e 7.2), resumo `sow/memoria-de-calculo-squad.md`, Excel v1.4, ficha, arquitetura 4.8 e este documento |
| EQP-11 | Data de início real (pendente desde 12/11) | Decidido (13/11): início em **23/11/2026**. Calendário: W0 23 a 27/11; W1 30/11 a 04/12; W2 07 a 11/12; W3 14 a 18/12; W4 21 a 25/12; W5 28/12 a 01/01/2027; W6 04 a 08/01/2027. Atenção: as campanhas A/B (W4 e W5) caem na semana do Natal e na virada do ano; confirmar com a 3C a janela de campanhas e o congelamento de TI do fim de ano. O Copilot ainda mostra 12/11 e precisa ser ajustado pelo Ricardo | MC (resumo e Excel), ficha, arquitetura 4.8, este documento; SOW e deck não têm datas |

Observação sobre o EQP-06: o Ricardo escreveu "da W1 até a W6" em 12/11 e, na mesma data, confirmou "da W0 até a W6", que é o que vale.

## 3. Divergências corrigidas

| Arquivo | O que mudou |
|---|---|
| `sow/conteudo-sow.json` e SOW `.docx` | Papéis "CLP - Consultor Líder de Projetos (W0 to W6, 25%)", "Data Engineer (3 weeks, W0 to W2, 50%)", "Machine Learning Engineer (5 weeks, W2 to W6, 50%)", "Data Scientist (2 weeks, W4 to W5, 50%)"; fase 2 "Acceptance Tests, Benchmark & Environment" (W1 a W2, go/no-go no fim da W2) e fase 3 "Data Prep & Pipeline" (W2 a W3) |
| `deck/gerar-conteudo.mjs` e deck `.pptx` | Slide 11: barras da equipe e das atividades (aceite, divisão e piso na W1 e na W2; ambiente e carga na W1 e na W2; pipeline da W2 à W3), marco "Testes de aceite e go/no-go" no fim da W2, notas; "Fim da W2" no slide de riscos; nomes Engenheiro de Dados, Engenheiro de ML e CLP; a dedicação do time deixou de aparecer no cronograma (12/11), e o cronograma e a tela de entregáveis seguem o novo layout |
| `docs/01-arquitetura/arquitetura-proposta.md` | v4.5: seções 4.7 e 4.8 (cronograma, equipe e riscos); seções 1 a 3 e o restante sem referência a outra proposta |
| `docs/02-adrs/ADR-003-motor-na-aws-personalize-sagemaker.md` | Decisão E ou D no fim da W2; sem referência a outra proposta |
| `docs/01-arquitetura/diagramas/3coracoes_to-be_v4.drawio` e gerador | Aba 4 (fases e pontos de decisão) com a nova distribuição das semanas |
| `docs/00-ficha-projeto.md` | Direção vigente com a equipe, o cronograma e o fluxo dos critérios; fatos e fontes sem outra proposta |
| `docs/01-arquitetura/critica-implementabilidade.md` | ENG-02 com a atualização de 12/11 |
| `sow/criterios-de-sucesso-alinhamento.md` e `sow/mensagem-time-ciencia-de-dados.md` | Dono técnico, nomes dos papéis, go/no-go no fim da W2, quem mede |

## 4. Ainda em aberto

1. As duas frases do SOW já sinalizadas: "mesmas receitas da PoC" e tempo real fora do escopo, contra a estimativa da calculadora.
2. Os achados do revisor sobre o SOW e o diagrama (sequência da avaliação offline e do A/B, seção 6, VPC endpoint e outros).
3. Aprovação da Diretoria: **resolvida pela v1.4** da memória (margem de 45,0% contra o mínimo de 44%); não há mais aviso de aprovação. O campo "Negócio" da memória continua vazio e o status é Rascunho.
4. Confirmado pelo Ricardo em 12/11: a semana W2 de sobreposição entre o Engenheiro de Dados e o Engenheiro de ML é intencional, para a prática conjunta e a passagem de conhecimento; o CLP leva os números dos critérios à 3C na W0 e os confirma no 1º dia da W1, o Engenheiro de Dados prepara os testes de aceite da W1 e o Engenheiro de ML valida os critérios ao entrar na W2, antes do go/no-go. A troca e o risco de um só engenheiro depois da W2 seguem a lógica do passo a passo da implementação.
5. Seções 7.1 e 7.2 do SOW refeitas em 13/11 com base na memória do Copilot v1.4: horas (283,5 h), preço por hora em reais (R$ 247,74, R$ 175,19, R$ 219,25 e R$ 185,81), câmbio de 5,40 e custo total de US$ 11.124,28 (R$ 60.071,13); contribuição de 100% da AWS e 0% da A3Data e da 3 Corações.
