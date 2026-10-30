# Mensagem para o time de Ciência de Dados (copiar e enviar)

Olá, time! Preciso da ajuda de vocês para fechar os critérios de sucesso de uma PoC de recomendação de produtos que vamos fazer para um cliente (distribuidora de bebidas e alimentos, vendas B2B para pontos de venda). Não precisa de código nem de acesso a dados: é só opinião de quem já mediu modelos de recomendação.

**Contexto em 5 linhas**
- Vamos usar o Amazon Personalize em 3 mecânicas: (1) NBO, o próximo melhor item para cada cliente; (2) "Mais por menos", que aponta os clientes mais propensos a comprar um item promovido; (3) Cesta, itens que costumam ser comprados juntos.
- A PoC dura 7 semanas. Na primeira semana de dados (W1) fazemos um teste de aceite, e cada mecânica tem um go/no-go.
- Os dados são 12 meses de pedidos reais de 1 filial e 1 a 2 famílias de produto.
- A comparação é com um benchmark simples, calculado no Snowflake: o que mais vende para o cliente ou região (NBO e Mais por menos) e os pares de produtos por lift (cesta).
- Os números que vocês indicarem vão para o cliente aprovar por escrito, então preciso de valores realistas, nem fáceis demais nem inalcançáveis.

**Como responder:** em cada item abaixo há uma sugestão. Respondam "OK" ou escrevam o valor que vocês usariam, com uma linha de justificativa se quiserem. Se não souberem, digam "não sei" que eu busco com outra pessoa. Prazo: ____.

---

## A. Como montar o teste

**A1. Janela de teste.** O modelo treina com os pedidos até uma data de corte e é avaliado no que cada cliente comprou nas semanas seguintes.
Exemplo: corte em 30/06, avaliação com as compras de 01/07 a 28/07 (4 semanas).
Sugestão: 4 semanas. Qual janela vocês usariam? ____ semanas.

**A2. Quem entra no teste.** Só clientes que dão para avaliar: com compras suficientes antes do corte e pelo menos uma compra na janela de teste.
Sugestão: pelo menos 2 compras antes do corte e 1 na janela. Concordam? ____

**A3. Lista recomendada.** Quantos itens por cliente entram na medição.
Sugestão: top 10. Concordam? ____

**A4. Benchmark.** Popularidade por cliente ou região para NBO e Mais por menos; pares por lift para a cesta. Algum benchmark mais justo que vocês usariam? ____

## B. NBO (próximo melhor item)

**B1. Acerto nos 10 primeiros (hit rate@10).** Para cada cliente do teste, vemos se ele comprou pelo menos 1 dos 10 itens recomendados.
Exemplo: se 15% dos clientes compram algum item da lista do benchmark e 18% compram algum item da lista do Personalize, a melhora relativa é de 20%.
Sugestão: meta de 15% de melhora relativa e mínimo para seguir de 5%.
Qual meta e qual mínimo vocês usariam? Meta ____ %. Mínimo ____ %.

**B2. Cobertura do catálogo.** Percentual dos itens elegíveis que aparecem recomendados para algum cliente (evita um modelo que só repete os mais vendidos).
Sugestão: meta de 30% e mínimo de 15%. Meta ____ %. Mínimo ____ %.

## C. Mais por menos (afinidade com item)

**C1. Precisão do segmento no top 10.** O Personalize devolve, para um item promovido, a lista de clientes mais propensos a comprá-lo. Medimos, entre esses clientes, quantos compraram o item na janela de teste.
Como o hit rate não se aplica a esta mecânica, a comparação é com um segmento montado só pelo volume histórico de compra do item.
Sugestão: meta de 10% de melhora relativa e mínimo de 3%. Meta ____ %. Mínimo ____ %.
O segmento de comparação (por volume histórico) faz sentido? Ou preferem outro? ____

## D. Cesta (itens comprados juntos)

**D1. Como a cesta é calculada.** O Personalize (receita SIMS), tratando cada pedido como um "usuário", gera itens relacionados. Um job calcula suporte, confiança e lift dos pares.

**D2. Aderência aos pares por lift.** Para cada item âncora, medimos quantos dos pares recomendados também estão entre os melhores pares por lift calculados nos pedidos reais.
Sugestão: meta de 50% de sobreposição e mínimo de 30%. Meta ____ %. Mínimo ____ %.

**D3. Filtros do par.** Suporte mínimo: ____ (número de pedidos ou %). Lift mínimo: 1,0 (sugestão). Confiança mínima: ____.

**D4. Cobertura de itens âncora.** Percentual dos itens âncora com pelo menos 1 par válido. Meta ____ %. Mínimo ____ %.

## E. Para fechar

**E1.** Em POCs ou projetos anteriores de recomendação, qual melhora sobre o benchmark vocês consideram realista no recorte de 1 filial e 12 meses de pedidos? Qual seria um sinal de que "não vale seguir"? ____

**E2.** Falta alguma métrica que vocês acham essencial (por exemplo, NDCG, MAP ou diversidade)? ____

**E3.** Quais riscos de dados vocês veem nesse recorte (poucos pedidos por cliente, itens novos, sazonalidade, promoções)? ____

**E4.** Essas metas são para o teste de aceite (W1), com pouca iteração, ou para a avaliação completa (W4 e W5)? Podem ser as mesmas ou o teste da W1 deve ter um piso mais baixo? ____

Obrigado! Qualquer dúvida, me chamem.
