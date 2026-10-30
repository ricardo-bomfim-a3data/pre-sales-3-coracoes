# 3 Corações · PoC · Critérios de sucesso para alinhar (interno A3)

Uso: texto de trabalho para a reunião interna com o Líder de projeto, o Arquiteto de Dados, o Engenheiro de ML e o Cientista de Dados. O que for fechado aqui vai à 3 Corações na W0, para acordo por escrito. O SOW diz apenas que os critérios e as metas numéricas são acordados com a 3C na W0, por mecânica. Os valores da coluna "Sugestão" são ponto de partida para a discussão, não valores validados. Preencha os campos `____`.

## 1. Regras comuns (valem para todas as mecânicas)

| Item | Definição proposta | Decisão do grupo |
|---|---|---|
| Recorte de dados | 1 filial, 1 a 2 famílias de produto, 12 meses de pedidos reais (o recorte aprovado da PoC) | ____ |
| Divisão treino e teste | Treinar até a data de corte; testar nas ____ semanas seguintes (sugestão: 4 semanas, para cobrir pelo menos um ciclo de compra) | ____ |
| Quem entra no teste | Clientes com pelo menos ____ compras no período de treino e com compra no período de teste (sugestão: pelo menos 2 compras) | ____ |
| Benchmark | Popularidade (mais vendidos do cliente e da região) para NBO e Mais por menos; pares por lift para a cesta. Calculado no Snowflake, sobre o mesmo recorte e a mesma divisão. Serve só de comparação, não é alternativa de entrega | ____ |
| Lista recomendada | Top ____ itens por cliente, depois dos filtros de estoque, compra recente e elegibilidade (sugestão: 10) | ____ |
| Quem mede | Engenheiro de ML na W1 (testes de aceite) e Cientista de Dados na W4 e W5 (avaliação offline completa) | ____ |

## 2. Critérios por mecânica

| Mecânica | Métrica | Como calcular | Sugestão para discussão | Meta acordada | Mínimo para seguir (go) |
|---|---|---|---|---|---|
| NBO (próximo melhor item) | Acerto nos 10 primeiros (hit rate@10) | % de clientes do teste que compraram pelo menos 1 dos 10 itens recomendados no período de teste | Melhora relativa de pelo menos 15% sobre o benchmark | ____ % | ____ % |
| NBO | Cobertura do catálogo | % dos itens elegíveis que aparecem recomendados para algum cliente | Pelo menos 30% dos itens elegíveis (evita um modelo que só repete os mais vendidos) | ____ % | ____ % |
| Mais por menos (afinidade com item) | Precisão@10 no segmento alvo | Entre os clientes do segmento (o grupo que o Personalize aponta como mais afim ao item promovido), % que comprou o item no período de teste, comparado ao benchmark (segmento por volume histórico do item). O hit rate não se aplica a esta mecânica | Melhora relativa de pelo menos 10% sobre o benchmark | ____ % | ____ % |
| Cesta (MBA, SIMS) | Aderência aos pares por lift | % dos pares recomendados para um item âncora que também estão entre os melhores pares por lift calculados nos pedidos reais (suporte mínimo ____, lift acima de 1,0) | Pelo menos 50% de sobreposição com os pares por lift | ____ % | ____ % |
| Cesta (MBA, SIMS) | Cobertura de itens âncora | % dos itens âncora com pelo menos 1 par recomendado válido | ____ | ____ % | ____ % |

Regra para a tabela: a "meta acordada" é o que a 3C aceita como prova de valor; o "mínimo para seguir" é o piso abaixo do qual a mecânica não passa no go/no-go da W1. O mínimo costuma ficar abaixo da meta.

## 3. Regra do go/no-go da W1 (por mecânica)

- Mecânica atinge o mínimo para seguir: segue para a construção do pipeline (W2 e W3).
- Mecânica abaixo do mínimo: registrar o resultado, decidir com a 3C o que fazer (ajustar dados ou receita, ou retirar a mecânica do restante da PoC) e atualizar o SOW por escrito.
- Quem decide: ____ (A3) e ____ (3C). Prazo da decisão: ____ dias úteis depois do relatório da W1.

## 4. Perguntas para fechar antes da W0

1. A 3C aceita o benchmark proposto (popularidade e pares por lift) como a base de comparação? Existe outra regra que eles usam hoje e deveria ser a comparação? ____
2. Qual é a melhora que a 3C considera relevante para investir na produção? (Isso define a meta, não o mínimo.) ____
3. A janela de teste de ____ semanas representa a sazonalidade do recorte (feriados, promoções)? ____
4. Quem na 3C valida os itens "elegíveis" (regras comerciais, estoque, exclusões)? ____
5. Para o A/B (W4 a W6): que grupos, em que canal e por quanto tempo? A leitura é direcional, sem significância estatística, e a margem de contribuição fica para depois da PoC. ____
6. O teste de aceite da W1 pode usar a mesma divisão e o mesmo benchmark da avaliação completa da W4/W5, para os números serem comparáveis? (Recomendado: sim.) ____

## 5. Registro final (preencher na W0, com a assinatura ou o e-mail de aceite da 3C)

| Mecânica | Métrica | Meta | Mínimo | Data do acordo | Aceite (nome e canal) |
|---|---|---|---|---|---|
| NBO | hit rate@10 | ____ | ____ | ____ | ____ |
| NBO | cobertura | ____ | ____ | ____ | ____ |
| Mais por menos | precisão@10 | ____ | ____ | ____ | ____ |
| Cesta | aderência aos pares por lift | ____ | ____ | ____ | ____ |
| Cesta | cobertura de itens âncora | ____ | ____ | ____ | ____ |
