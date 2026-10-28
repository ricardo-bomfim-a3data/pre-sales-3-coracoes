// Gera docs/01-arquitetura/diagramas/3coracoes_to-be_v4.drawio: node tools/gerar-diagrama-v4.mjs <saida.drawio>
import fs from 'node:fs';
import { Page, ST, wrapFile } from './lib-drawio.mjs';

const R = [270, 410, 550, 690, 830]; // linhas
const H = 100;
const AMAR = 'rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=11;';

// ---------- aba 1: comparativo ----------
function comparativo() {
  const p = new Page('1 Comparativo', 'v4-comp', 1900, 1640, { flow: false });
  p.title('Dois desenhos para a mesma entrega · o Desenho 1 é o oficial');
  p.info('1 Comparativo', 'v4.1 revisada pelo especialista');
  const rows = [
    ['Motor da próxima melhor oferta (NBO) e do mais por menos', 'Amazon Personalize: receita por cliente para o desconto e receita de afinidade com item para o mais por menos, em lote toda semana; região e área por filtro; estoque e "já comprado" conferidos de novo na saída', 'Igual ao Desenho 1'],
    ['Motor da cesta de compras (MBA)', 'Amazon Personalize (receita SIMS, cada pedido como um usuário): itens mais associados a cada item; o Glue calcula suporte, confiança e lift desses pares por canal e região; testes de aceite com pedidos reais na W1', 'Igual ao Desenho 1'],
    ['Papel do Glue', 'Apoio: prepara os arquivos de entrada e formata as saídas dos dois motores, com o filtro final', 'Apoio ampliado: também sorteia os grupos A/B, calcula a medição e mantém o catálogo das tabelas de controle'],
    ['Orquestração', 'Step Functions orquestra a AWS; o arquivo de manifesto no S3 aciona o Step Functions; o Airflow da 3C só agenda, espera o arquivo de sucesso no S3 e carrega as tabelas (sem credencial AWS no Airflow)', 'Igual ao Desenho 1'],
    ['Grupos do teste A/B', 'Tabela no Snowflake; rotina escrita pela A3 sorteia na rodada, fixa por campanha e registra as trocas manuais da Inteligência Comercial', 'Tabela em formato aberto (Iceberg) no catálogo do Glue; o sorteio roda num job, uma vez por campanha; o grupo segue como coluna na tabela entregue ao Snowflake'],
    ['Registro de quem recebeu a oferta', 'Snowflake, por carga feita pela 3C (hipótese: hoje o Sírius não registra a exposição, ARQ-Q21)', 'Chega ao Snowflake por carga da 3C, como no Desenho 1, e segue para o S3 na exportação'],
    ['Medição do teste A/B', 'SQL no Snowflake', 'Athena sobre as tabelas de controle no S3'],
    ['Painel diário (dono: 3C)', 'BI atual da 3C lendo o Snowflake, sem novo custo de ferramenta', 'Amazon Managed Grafana lendo o Athena, com login corporativo; atende o painel, mas é uma ferramenta nova para a 3C operar'],
    ['Tabelas entregues à Inteligência Comercial', 'Snowflake: recomendação da semana, histórico e regras de cesta (como a especificação pede)', 'Snowflake, por carga de volta da AWS (a entrega continua atendendo a especificação)'],
    ['O que fica na AWS', 'Entradas e saídas de cada rodada por 30 dias; conjunto de dados do Personalize enquanto o modelo estiver ativo', 'O mesmo, mais as tabelas de controle (grupos, exposição, medição): o histórico do teste passa a viver na AWS'],
    ['Vendas do SAP', 'Só no Snowflake; exportação semanal para a AWS', 'No Snowflake e no S3; semanal hoje, diária quando a 3C entregar a nova carga (basta trocar o parâmetro)'],
    ['Aderência à especificação da 3C', 'Motor na AWS exige aceite por escrito da 3C (itens 4.1, 4.3.1.2, 4.4.1 a 4.4.3 e RNF04); controle e entrega seguem no Snowflake', 'Desvio maior: o controle do teste também sai do Snowflake; exige aceite mais amplo'],
    ['Consumo e custo na AWS', 'Menor: S3, Glue, Personalize (NBO, mais por menos e cesta), Step Functions, chaves de criptografia e auditoria', 'Maior: soma Athena, Grafana, mais Glue e S3 (valores a confirmar na calculadora da AWS)'],
    ['Principais riscos', 'Entrega semanal passa a depender da AWS; custo de saída de dados do Snowflake; aceite da 3C; Personalize pode não cobrir bem filtros e o "já comprado"; NBO e regras de cesta no Personalize ainda sem prova nesta conta (testes de aceite na W1; se a cesta falhar, regras em SQL como piso)', 'Dois sistemas de registro; Grafana depende do Athena; exposição e vendas precisam chegar ao S3 com a mesma qualidade'],
    ['Quando escolher', 'Caminho oficial, para contratar e executar', 'Alternativa, se a 3C aceitar a AWS como sistema de registro do teste e quiser menos dependência do BI atual'],
  ];
  const y0 = 100;
  p.box('n_h0', 20, y0, 360, 44, '<b>Função</b>', ST.info);
  p.box('n_h1', 400, y0, 700, 44, '<b>Desenho 1 · oficial</b>', ST.proc);
  p.box('n_h2', 1120, y0, 760, 44, '<b>Desenho 2 · alternativa com as funções de controle na AWS</b>', ST.sys);
  rows.forEach((r, i) => {
    const y = y0 + 56 + i * 96;
    p.box('n_a' + i, 20, y, 360, 84, `<b>${r[0]}</b>`, ST.info);
    p.box('n_b' + i, 400, y, 700, 84, r[1], ST.tab);
    p.box('n_c' + i, 1120, y, 760, 84, r[2], AMAR);
  });
  return p;
}

// ---------- aba 2: Desenho 1 visão geral ----------
function d1Geral() {
  const p = new Page('2 Desenho 1 · visão geral', 'v4-d1g', 1900, 960);
  p.title('Desenho 1 (oficial) · recomendação de SKU para o B2B da 3 Corações · visão geral');
  p.info('2 Desenho 1 · visão geral', 'v4.1');
  p.zone('z1', 20, 100, 1840, 190, 'Já existe na 3 Corações', ST.zone('#FAFAFA', '#7F7F7F'));
  p.box('sap', 40, 150, 300, 110, '<b>SAP</b><br>pedidos, faturamento, clientes, produtos e estoque', ST.sys);
  p.box('ic', 780, 150, 300, 110, '<b>Inteligência Comercial</b><br>escolhe itens e público, passa pela aprovação de preço e ativa a campanha', ST.sys);
  p.box('canais', 1150, 150, 300, 110, '<b>Canais de venda</b><br>Sírius (app do vendedor) e B2B, com combos, mais por menos e desconto; o Salesforce registra as campanhas', ST.sys);
  p.box('bi', 1520, 150, 300, 110, '<b>BI atual da 3C</b><br>painel diário do teste A/B (requisito da especificação; dono: 3C)', ST.sys);

  p.zone('z2', 20, 330, 1840, 230, 'Snowflake e Airflow da 3C · aqui ficam os dados, o teste A/B e as tabelas entregues · o Airflow só agenda', ST.zone('#F7FBFF', '#6c8ebf'));
  p.box('b1', 40, 390, 300, 130, '<b>1 · Preparação da rodada</b><br>lê vendas, clientes, produtos e estoque; filtra (só itens com estoque, sem o que o cliente já comprou no mês); gera relatório de qualidade e guarda uma foto versionada dos dados', ST.proc);
  p.box('n_air', 410, 390, 300, 130, '<b>Airflow da 3C</b><br>agenda a rodada toda semana (ou à mão); depois espera o arquivo de sucesso da AWS no S3 e carrega as tabelas no Snowflake; não chama a AWS', ST.sys);
  p.box('b5', 780, 390, 300, 130, '<b>5 · Tabelas de recomendação</b><br>da semana (cliente, item, mecânica, nota, motivo e grupo do teste), histórico de todas as semanas e regras de cesta', ST.tab);
  p.box('b6', 1520, 390, 300, 130, '<b>6 · Teste A/B e painel diário</b><br>grupos sorteados na rodada e fixos por campanha, registro de quem recebeu a oferta e medição de faturamento, margem, sortimento, frequência e conversão', ST.tab);

  p.zone('z3', 20, 600, 1840, 280, 'AWS · conta da 3C · N. Virgínia (us-east-1) · motor de recomendação com Personalize (NBO, mais por menos e cesta) · Glue como apoio', ST.cloud);
  p.box('b2', 40, 660, 300, 130, '<b>2 · Cópia para a AWS e preparo</b><br>exportação semanal para o S3 com chave de criptografia da 3C; o Glue monta os arquivos de entrada dos dois motores', ST.awsbox('#7AA116'));
  p.box('b3', 410, 660, 300, 130, '<b>3 · Próxima melhor oferta (NBO)</b><br>Amazon Personalize: recomendação por cliente em lote para o desconto, e afinidade com item para o mais por menos', ST.awsbox('#01A88D'));
  p.box('b4', 780, 660, 300, 130, '<b>4 · Cesta de compras (MBA)</b><br>Personalize (SIMS): itens do mesmo pedido, para os combos; o Glue calcula suporte, confiança e lift e formata as saídas', ST.awsbox('#01A88D'));
  p.box('n_sfn', 1150, 660, 300, 130, '<b>Step Functions</b><br>orquestra o preparo, o NBO e a cesta na AWS, com tentativas, erros e alertas; o manifesto no S3 aciona o Step Functions; o S3 apaga as entradas em 30 dias', ST.note);
  p.box('n_pre', 1520, 660, 300, 130, '<b>Pré-requisitos</b><br>aceite por escrito da 3C para o motor rodar na AWS (a especificação cita Snowflake, Airflow e notebooks na stack interna); contrato de operador 3C e A3 na W0; acesso rigoroso aos dados (aba 5)', ST.warn);

  const e = (id, s, t, l, o) => p.edge(id, s, t, l, o);
  e('e0', 'sap', 'b1', 'carga do SAP (já existe)', { ex: [0.5, 1], en: [0.5, 0] });
  e('e1', 'b1', 'b2', 'exporta para o S3', { ex: [0.5, 1], en: [0.5, 0] });
  e('e2', 'b2', 'b3', '3', { en: [0, 0.5] });
  e('e3', 'b3', 'b4', '4', {});
  e('e4', 'b4', 'b5', 'devolve as tabelas ao Snowflake', { ex: [0.5, 0], en: [0.5, 1] });
  e('e5', 'b5', 'ic', 'consulta', { ex: [0.5, 0], en: [0.5, 1] });
  e('e6', 'ic', 'canais', 'ativa a campanha', {});
  e('e7', 'canais', 'b6', 'quem recebeu a oferta', { ex: [0.5, 1], en: [0, 0.8], pts: [[1300, 494]] });
  e('e8', 'b5', 'b6', 'grupos do teste', { en: [0, 0.5] });
  e('e9', 'b6', 'bi', 'painel diário', { ex: [0.5, 0], en: [0.5, 1] });
  return p;
}

// ---------- aba 3: Desenho 1 técnica ----------
function d1Tec() {
  const p = new Page('3 Desenho 1 · arquitetura técnica', 'v4-d1t', 2300, 1010);
  p.title('Desenho 1 (oficial) · arquitetura técnica · fluxo numerado de 1 a 14');
  p.info('3 Desenho 1 · técnica', 'v4.1');
  p.zone('zs', 20, 210, 240, 740, 'Sistemas da 3C', ST.zone('#FAFAFA', '#7F7F7F'));
  p.box('sap', 40, R[0], 200, H, '<b>SAP</b><br>pedidos, faturamento, clientes, produtos, estoque', ST.sys);
  p.box('ic', 40, R[1], 200, H, '<b>Inteligência Comercial</b><br>escolhe itens e público, aprova o preço', ST.sys);
  p.box('canais', 40, R[2], 200, H, '<b>Sírius e B2B</b><br>executam as campanhas', ST.sys);
  p.box('sf', 40, R[3], 200, H, '<b>Salesforce</b><br>registro das campanhas', ST.sys);
  p.box('bi', 40, R[4], 200, H, '<b>BI atual da 3C</b><br>painel diário do teste A/B (dono: 3C)', ST.sys);

  p.zone('zsn', 340, 210, 760, 740, 'Snowflake da 3C · sistema de registro', ST.zone('#F7FBFF', '#6c8ebf'));
  p.box('src', 360, R[0], 330, H, '<b>Dados de origem (só leitura)</b><br>pedidos por item, clientes, produtos, estoque', ST.tab);
  p.box('views', 360, R[1], 330, H, '<b>Visões de leitura</b><br>só a versão vigente, com colunas de negócio, para a Inteligência Comercial e o BI', ST.tab);
  p.box('expo', 360, R[2], 330, H, '<b>Registro de quem recebeu a oferta</b><br>por cliente, item, mecânica, canal e data (carga feita pela 3C)', ST.tab);
  p.box('ab', 360, R[3], 330, H, '<b>Grupos do teste A/B</b><br>"recebe recomendação" ou "processo atual", sorteio equilibrado por canal e região, feito na rodada e fixo por campanha; guarda as trocas manuais da Inteligência Comercial', ST.tab);
  p.box('med', 360, R[4], 330, H, '<b>Medição do teste A/B</b><br>cruza vendas, grupos e exposição; calcula faturamento, margem, sortimento, frequência e conversão por grupo', ST.tab);
  p.box('prep', 730, R[0], 330, H, '<b>Preparação da rodada e visões de exportação</b><br>filtros (estoque, já comprado no mês), relatório de qualidade e foto versionada dos dados; grava o arquivo de manifesto', ST.proc);
  p.box('rec', 730, R[1], 330, H, '<b>Tabelas de recomendação</b><br>semana e histórico, com regras de cesta e métricas; na carga: junta o grupo do teste, troca a tabela da semana de uma vez, guarda o histórico, roda testes de contrato e avisa a Inteligência Comercial', ST.tab);
  p.box('n_ret', 730, R[2], 330, H, '<b>Retenção no Snowflake</b><br>histórico de recomendações, exposição, grupos, métricas e foto de cada rodada: sem prazo, definido pela 3C', ST.sec);
  p.box('n_acc', 730, R[3], 330, H, '<b>Acessos</b><br>administrador (3C) · usuário técnico do Airflow · papel de exportação (só visões de exportação) · equipe A3 com acesso nominal aos dados reais, sob contrato de operador · leitores só nas visões', ST.sec);

  p.box('airflow', 800, 100, 1400, 70, '<b>Airflow da 3C · só agenda</b>: toda semana (ou à mão) dispara a preparação e a exportação no Snowflake; depois espera o arquivo de sucesso da AWS no S3, carrega as tabelas e publica · não chama a AWS: o manifesto no S3 aciona o Step Functions · nenhuma lógica de recomendação no Airflow', ST.sys);

  p.zone('za', 1180, 210, 1080, 740, 'AWS · conta da 3C · N. Virgínia (us-east-1)', ST.cloud);
  p.zone('zf', 1540, 235, 700, 295, 'Step Functions · orquestra os passos 5 a 9', ST.sfn);
  const a = 1200, b = 1560, c = 1920;
  p.aws('s3in', a, R[0], 300, H, 's3', '<b>S3 · entrada</b><br>visões exportadas, criptografadas com chave da 3C; o manifesto aciona o Step Functions; apagadas em 30 dias pelo S3');
  p.aws('glue1', b, R[0], 300, H, 'glue', '<b>Glue · preparo</b><br>monta os arquivos de interações e de itens do Personalize e a tabela de pedidos para as regras de cesta');
  p.aws('pers', c, R[0], 300, H, 'personalize', '<b>Personalize · NBO</b><br>duas soluções: desconto (por cliente) e mais por menos (afinidade com item); regional por filtro');
  p.aws('sm', c, R[1], 300, H, 'personalize', '<b>Personalize · cesta (MBA)</b><br>SIMS: pares de itens do mesmo pedido (cada pedido como um usuário), independente do NBO; teste de aceite na W1');
  p.aws('glue2', b, R[1], 300, H, 'glue', '<b>Glue · cesta e saídas</b><br>calcula suporte, confiança e lift dos pares da cesta, junta com o NBO, aplica o filtro final (estoque, já comprado; pede mais itens que o top-N) e grava o arquivo de sucesso');
  p.aws('s3out', a, R[1], 300, H, 's3', '<b>S3 · saída</b><br>arquivos prontos para a carga e o arquivo de sucesso; apagados em 30 dias');
  p.box('n_sec', a, R[2], 300, H, '<b>Acesso e chaves</b><br>papéis nominais com menor privilégio, verificação em duas etapas, chave de criptografia da 3C, bucket sem acesso público; exceções por papel só para o Personalize e a integração do Snowflake', ST.sec);
  p.box('n_ret2', b, R[2], 300, H, '<b>Retenção na AWS</b><br>arquivos 30 dias; dados do Personalize enquanto o modelo estiver ativo; métricas, regras de cesta, versões de modelo e logs sem prazo', ST.sec);
  p.box('n_aud', c, R[2], 300, H, '<b>Auditoria e custo</b><br>CloudTrail com eventos de dados do S3, alarme de acesso fora do padrão e alerta de gasto (Budgets)', ST.sec);
  p.box('n_leg', a, R[3], 1020, H, '<b>Como ler</b>: setas numeradas de 1 a 14 seguem a rodada semanal; as sem número são apoio. Grupos, exposição, medição e painel do teste A/B ficam no Snowflake e no BI da 3C. A AWS só calcula as recomendações e devolve as tabelas por arquivos no S3. Se a 3C carregar as vendas todo dia, só o parâmetro da exportação muda.', ST.note);
  p.box('n_pre', a, R[4], 1020, H, '<b>Pré-requisitos</b>: (1) aceite por escrito da 3C para o motor rodar na AWS, cobrindo os itens 4.1, 4.3.1.2, 4.4.1 a 4.4.3 e RNF04 da especificação e a API prometida no mês 3 da proposta; (2) contrato de operador 3C e A3 na W0; (3) integração de armazenamento criada pela 3C no Snowflake; (4) critério de funding confirmado pela AWS.', ST.warn);

  const e = (id, s, t, l, o) => p.edge(id, s, t, l, o);
  e('e1', 'sap', 'src', '1 carga do SAP', {});
  e('e2', 'airflow', 'prep', '2 dispara a rodada', { ex: [95 / 1400, 1], en: [0.5, 0] });
  e('e3', 'src', 'prep', '3 lê', {});
  e('e4', 'prep', 's3in', '4 exporta para o S3', {});
  e('e6', 's3in', 'glue1', '5 manifesto aciona', {});
  e('e7', 'glue1', 'pers', '6 NBO', {});
  e('e8', 'pers', 'sm', '7 cesta', { ex: [0.5, 1], en: [0.5, 0] });
  e('e9', 'sm', 'glue2', '8 formata', { ex: [0, 0.5], en: [1, 0.5] });
  e('e10', 'glue2', 's3out', '9 grava e avisa', { ex: [0, 0.5], en: [1, 0.5] });
  e('e11', 's3out', 'rec', '10 o Airflow carrega no Snowflake', { ex: [0, 0.5], en: [1, 0.5] });
  e('e12', 'rec', 'views', 'versão vigente', { ex: [0, 0.3], en: [1, 0.3] });
  e('e13', 'views', 'ic', '11 consulta', { ex: [0, 0.5], en: [1, 0.5] });
  e('e14', 'ic', 'canais', '12 ativa a campanha', { ex: [0.5, 1], en: [0.5, 0] });
  e('e15', 'canais', 'sf', 'registra a campanha', { ex: [0.5, 1], en: [0.5, 0] });
  e('e16', 'canais', 'expo', '13 quem recebeu', { ex: [1, 0.5], en: [0, 0.5] });
  e('e17', 'ab', 'med', 'grupos', { ex: [0.5, 1], en: [0.5, 0] });
  e('e18', 'expo', 'med', 'exposição', { ex: [1, 0.8], en: [1, 0.5], pts: [[710, 630], [710, 880]] });
  e('e19', 'med', 'bi', '14 painel diário', { ex: [0, 0.5], en: [1, 0.5] });
  e('e20', 'ab', 'rec', 'grupo de cada cliente', { ex: [1, 0.5], en: [0, 0.8], pts: [[700, 740], [700, 490]] });
  return p;
}

// ---------- aba 4: Desenho 2 técnica ----------
function d2Tec() {
  const p = new Page('4 Desenho 2 · alternativa AWS', 'v4-d2t', 2260, 1010);
  p.title('Desenho 2 (alternativa) · controle do teste A/B também na AWS · fluxo numerado de 1 a 16');
  p.info('4 Desenho 2 · alternativa', 'v4.1');
  p.zone('zs', 20, 210, 240, 740, 'Sistemas da 3C', ST.zone('#FAFAFA', '#7F7F7F'));
  p.box('sap', 40, R[0], 200, H, '<b>SAP</b><br>pedidos, faturamento, clientes, produtos, estoque', ST.sys);
  p.box('sf', 40, R[1], 200, H, '<b>Salesforce</b><br>registro das campanhas', ST.sys);
  p.box('canais', 40, R[2], 200, H, '<b>Sírius e B2B</b><br>executam as campanhas', ST.sys);
  p.box('ic', 40, R[3], 200, H, '<b>Inteligência Comercial</b><br>escolhe itens e público, aprova o preço', ST.sys);

  p.zone('zsn', 340, 210, 380, 740, 'Snowflake da 3C · origem e entrega', ST.zone('#F7FBFF', '#6c8ebf'));
  p.box('src', 360, R[0], 340, H, '<b>Dados de origem (só leitura)</b><br>pedidos por item, clientes, produtos, estoque', ST.tab);
  p.box('prep', 360, R[1], 340, H, '<b>Visões de exportação</b><br>histórico de compras, itens, estoque e exposição; foto versionada da rodada; grava o manifesto', ST.proc);
  p.box('expo', 360, R[2], 340, H, '<b>Registro de quem recebeu a oferta</b><br>carga feita pela 3C (hipótese: hoje o Sírius não registra a exposição)', ST.tab);
  p.box('rec', 360, R[3], 340, H, '<b>Tabelas de recomendação e visões de leitura</b><br>semana e histórico, com o grupo do teste; na carga: troca atômica, testes de contrato e aviso à Inteligência Comercial', ST.tab);
  p.box('n_acc', 360, R[4], 340, H, '<b>Acessos</b><br>papel de exportação só com as visões de exportação · equipe A3 com acesso nominal aos dados reais, sob contrato de operador · leitores só nas visões', ST.sec);

  p.box('airflow', 740, 100, 1440, 70, '<b>Airflow da 3C · só agenda</b>: toda semana (ou à mão) dispara a exportação no Snowflake; depois espera o arquivo de sucesso da AWS no S3 e carrega as tabelas · não chama a AWS: o manifesto no S3 aciona o Step Functions · nenhuma lógica de recomendação no Airflow', ST.sys);

  p.zone('za', 780, 210, 1440, 740, 'AWS · conta da 3C · N. Virgínia (us-east-1)', ST.cloud);
  p.zone('zf', 1140, 375, 1060, 295, 'Step Functions · orquestra os passos 5 a 9', ST.sfn);
  const a = 800, b = 1160, c = 1520, d = 1880;
  p.box('n_leg', a, R[0], 800, H, '<b>Como ler</b>: setas numeradas de 1 a 16 seguem a rodada. Aqui o sorteio dos grupos (uma vez por campanha), a medição e o painel ficam na AWS; o Snowflake continua sendo a origem dos dados e o destino das tabelas entregues. A exposição e as vendas chegam ao S3 pela exportação semanal (diária quando a 3C entregar a nova carga).', ST.note);
  p.aws('s3in', a, R[1], 300, H, 's3', '<b>S3 · entrada</b><br>visões exportadas, criptografadas com chave da 3C; o manifesto aciona o Step Functions; apagadas em 30 dias');
  p.aws('glue1', b, R[1], 300, H, 'glue', '<b>Glue · preparo</b><br>arquivos de interações e de itens do Personalize e tabela de pedidos para a cesta');
  p.aws('pers', c, R[1], 300, H, 'personalize', '<b>Personalize · NBO</b><br>duas soluções: desconto e mais por menos (afinidade com item)');
  p.aws('sm', d, R[1], 300, H, 'personalize', '<b>Personalize · cesta (MBA)</b><br>SIMS: pares de itens do mesmo pedido, independente do NBO; teste de aceite na W1');
  p.aws('glue2', d, R[2], 300, H, 'glue', '<b>Glue · saídas e controle</b><br>junta NBO e cesta, filtro final, sorteia os grupos A/B, calcula a medição e grava o arquivo de sucesso');
  p.aws('lake', c, R[2], 300, H, 's3', '<b>S3 e catálogo do Glue</b><br>saídas e tabelas de controle (grupos, exposição, medição) em formato aberto (Iceberg)');
  p.aws('athena', c, R[3], 300, H, 'athena', '<b>Athena</b><br>consultas da medição e visões do painel; paga por consulta');
  p.aws('grafana', b, R[3], 300, H, 'grafana', '<b>Managed Grafana · painel</b><br>painel do teste A/B, login corporativo');
  p.box('users', a, R[3], 300, H, '<b>Inteligência Comercial e CRM</b><br>abrem o painel no navegador', ST.sys);
  p.box('n_sec', a, R[4], 300, H, '<b>Acesso e chaves</b><br>papéis nominais, verificação em duas etapas, chave de criptografia da 3C, bucket sem acesso público; exceções por papel só para o Personalize e a integração do Snowflake', ST.sec);
  p.box('n_ret2', b, R[4], 300, H, '<b>Retenção na AWS</b><br>arquivos 30 dias; tabelas de controle e histórico do teste ficam na AWS (prazo a definir com a 3C); logs e métricas sem prazo', ST.sec);
  p.box('n_pre', c, R[4], 660, H, '<b>Pré-requisitos</b>: aceite por escrito da 3C para o motor e o controle do teste na AWS (a especificação cita Snowflake, Airflow e notebooks na stack interna); contrato de operador 3C e A3 na W0; integração de armazenamento criada pela 3C; critério de funding confirmado pela AWS.', ST.warn);

  const e = (id, s, t, l, o) => p.edge(id, s, t, l, o);
  e('e1', 'sap', 'src', '1 carga do SAP', {});
  e('e2', 'airflow', 'prep', '2 dispara a rodada', { ex: [0, 1], en: [1, 0.25], pts: [[740, 435]] });
  e('e3', 'src', 'prep', '3 lê', { ex: [0.5, 1], en: [0.5, 0] });
  e('e3b', 'expo', 'prep', 'e a exposição', { ex: [0.5, 0], en: [0.5, 1] });
  e('e4', 'prep', 's3in', '4 exporta', { ex: [1, 0.75], en: [0, 0.75] });
  e('e6', 's3in', 'glue1', '5 manifesto aciona', {});
  e('e7', 'glue1', 'pers', '6 NBO', {});
  e('e8', 'pers', 'sm', '7 cesta', {});
  e('e9', 'sm', 'glue2', '8 formata', { ex: [0.5, 1], en: [0.5, 0] });
  e('e10', 'glue2', 'lake', '9 grava e avisa', { ex: [0, 0.5], en: [1, 0.5] });
  e('e11', 'lake', 'rec', '10 o Airflow carrega no Snowflake', { ex: [0, 0.5], en: [1, 0.5], pts: [[760, 600], [760, 740]] });
  e('e12', 'rec', 'ic', '11 consulta', { ex: [0, 0.5], en: [1, 0.5] });
  e('e13', 'ic', 'canais', '12 ativa a campanha', { ex: [0.5, 0], en: [0.5, 1] });
  e('e14', 'canais', 'expo', '13 quem recebeu', {});
  e('e15', 'canais', 'sf', 'registra a campanha', { ex: [0.5, 0], en: [0.5, 1] });
  e('e16', 'lake', 'athena', '14 consulta', { ex: [0.5, 1], en: [0.5, 0] });
  e('e17', 'athena', 'grafana', '15 painel', { ex: [0, 0.5], en: [1, 0.5] });
  e('e18', 'grafana', 'users', '16 painel diário', { ex: [0, 0.5], en: [1, 0.5] });
  return p;
}

// ---------- aba 5: dados, acesso e retenção ----------
function dados() {
  const p = new Page('5 Dados, acesso e retenção', 'v4-dados', 1900, 1200, { flow: false });
  p.title('Dados, acesso e retenção · vale para os dois desenhos');
  p.info('5 Dados, acesso e retenção', 'v4.1');
  const w = 600, y = 110, h = 600;
  p.box('n_c1', 20, y, w, h, '<b>O que fica onde</b><br><br><b>Snowflake da 3C (sistema de registro, sem prazo):</b><br>• dados de origem do SAP<br>• histórico de recomendações, grupos do teste, exposição e medição<br>• foto versionada (clone) dos dados de treino de cada rodada, para reproduzir qualquer resultado<br>• tabelas entregues à Inteligência Comercial<br><br><b>AWS (cópia de trabalho):</b><br>• arquivos de entrada e de saída de cada rodada, por 30 dias (regra de ciclo de vida do S3)<br>• dados do Personalize, enquanto o modelo estiver ativo; removidos ao desativar<br>• artefatos sem dado pessoal, sem prazo: métricas, versões de modelo, regras de cesta (só itens) e logs de auditoria<br><br><b>Por que não há datamart na AWS (Desenho 1):</b> o histórico já vive no Snowflake. Guardar na AWS duplicaria dado fora do país, custo e superfície de risco. No Desenho 2 o histórico do teste passa a viver na AWS e a retenção precisa ser definida.', ST.tab);
  p.box('n_c2', 640, y, w, h, '<b>Acesso rigoroso (dados reais com código do cliente)</b><br><br>• <b>o código do cliente do SAP substitui o CNPJ nas cópias</b> (decisão de 27/10): o motor não precisa do CNPJ, e isso reduz a exposição de MEI (microempreendedor) e empresa individual; o CNPJ fica só no Snowflake<br>• acesso nominal por papel, sem usuário compartilhado, com verificação em duas etapas e login corporativo da 3C<br>• papéis separados: pipeline (sem acesso humano), desenvolvedor A3, leitor, auditor da 3C<br>• <b>a equipe da A3 trabalha com os dados reais por enquanto</b> (decisão de 27/10), com acesso nominal, registrado no CloudTrail e revisado pela 3C, sob contrato de operador; o Step Functions trafega só caminhos de arquivos<br>• chave de criptografia (KMS) da 3C, administrada pela 3C<br>• S3 sem acesso público; acesso por endpoint privado para o pipeline, com exceções por papel para o Personalize e para a integração do Snowflake, que não passam pela rede privada da 3C<br>• CloudTrail com eventos de dados do S3 e alarme de acesso fora do padrão<br>• no Snowflake: integração de armazenamento com papel de menor privilégio e papel de exportação separado<br>• revisão trimestral de acessos pela 3C', ST.sec);
  p.box('n_c3', 1260, y, 620, h, '<b>Qual é o papel da A3 aqui</b><br><br>A A3 é <b>operadora</b> dos dados da 3C, sob contrato de operador (a assinar na W0).<br><br><b>A A3 faz:</b><br>• desenha e constrói as tabelas, as visões e os jobs<br>• escreve o código de preparação, exportação, modelos e carga de volta<br>• opera a rodada semanal e investiga falhas, usando contagens e relatórios de qualidade<br>• entrega o dicionário de dados e a documentação<br><br><b>A 3C faz:</b><br>• é dona e controladora dos dados<br>• cria a integração de armazenamento e os papéis no Snowflake e na conta AWS<br>• define a retenção, autoriza exportações e revisa acessos<br>• carrega a exposição das campanhas e, no futuro, as vendas diárias<br><br><b>Regra de trabalho:</b> a equipe da A3 trabalha com os dados reais, com acesso nominal e registrado, sob o contrato de operador; usa só o que a rodada precisa e não copia dados para fora dos ambientes da 3C.', ST.proc);
  p.box('n_d1', 20, 730, 1860, 130, '<b>Retenção · decisões</b>: 30 dias para arquivos na AWS (era 7 dias na proposta anterior; ajustável com o encarregado de dados da 3C) · dados do Personalize apagados ao desativar o modelo · histórico completo no Snowflake, sem prazo, definido pela 3C · artefatos sem dado pessoal e logs de auditoria sem prazo, com custo baixo. Se o histórico passar a ser útil também para outros projetos, o lugar dele é um datamart no Snowflake, não na AWS.', ST.note);
  p.box('n_d2', 20, 880, 1860, 170, '<b>Em aberto</b>: (1) o código do cliente é uma chave que a 3C consegue ligar ao CNPJ: continua sendo dado pessoal quando o cliente é pessoa física; reavaliar se o encarregado de dados (DPO) da 3C exigir pseudonimização adicional. (2) MEI e empresa individual nas cópias, agora com menos exposição. (3) posição jurídica sobre os dados fora do país: a expectativa é de que não haja impedimento, mas ela não foi verificada, e nenhum dado real sai antes da resposta (ARQ-Q43). (4) região do Snowflake da 3C e se a organização AWS da 3C bloqueia regiões (política SCP). (5) preço das ferramentas na calculadora da AWS.', ST.warn);
  return p;
}

// ---------- aba 6: fases ----------
function fases() {
  const p = new Page('6 Fases e decisões', 'v4-fases', 1900, 1040, { flow: false });
  p.title('Fases, decisões e o que mudou em relação à v3');
  p.info('6 Fases e decisões', 'v4.1');
  const y = 110, h = 420, w = 440;
  p.box('n_f0', 20, y, w, h, '<b>W0 · alinhamentos e acessos</b><br><br>• Sírius aceita SKU diferente por cliente na mesma campanha? (define o grão do NBO e do A/B)<br>• quem analisa o resultado?<br>• há congelamento de TI entre dezembro e janeiro?<br>• aceite por escrito da 3C: motor na AWS (itens 4.1, 4.3.1.2, 4.4.1 a 4.4.3, RNF04 e a API do mês 3)<br>• contrato de operador 3C e A3<br>• posição do jurídico e do encarregado de dados sobre dados de clientes fora do país (código do cliente no lugar do CNPJ)<br>• conta AWS, integração do Snowflake com o S3 e papéis nominais liberados<br>• amostra de pedidos reais para os testes de aceite<br>• funding: o mínimo de R$ 50 mil é piso rígido? a projeção pode incluir outras cargas da 3C?', ST.warn);
  p.box('n_f1', 480, y, w, h, '<b>Fase 1 · W1 a W3 · construção</b><br><br>• <b>W1: testes de aceite do NBO e do MBA no Personalize</b>, com pedidos reais de 1 filial e 1 a 2 famílias; resultado e decisão do motor (E ou D) no fim da W1<br>• W1 e W2: carga e preparação no Snowflake e pipeline AWS (Glue, Personalize, Step Functions), em paralelo<br>• <b>piso</b>: popularidade e cesta em SQL no Snowflake, como régua offline e plano de contingência<br>• escolha única da janela de tempo do Personalize<br>• W3: primeira rodada semanal completa, grupos do teste A/B e registro de exposição, painel diário no BI da 3C', ST.proc);
  p.box('n_f2', 940, y, w, h, '<b>Fase 2 · W4 a W6 · campanhas e resultado</b><br><br>• W4 e W5: campanhas com teste A/B nas três mecânicas<br>• W4: ajuste dos modelos com o resultado (filtros, pesos e regras de cesta) e desafiante de NBO com outra receita do Personalize<br>• início da W6 (2 dias): resultado do teste e transferência de conhecimento para a 3C<br>• análise estatística final com o resultado completo das campanhas', ST.tab);
  p.box('n_f3', 1400, y, 480, h, '<b>Evolução (6 a 12 meses)</b><br><br>• recomendação em tempo real, só com consumidor pronto (Sírius em visita, home do B2B); o Personalize cobra um mínimo contínuo por campanha ativa<br>• mais filiais e famílias<br>• retreino e monitoramento de deriva<br>• Desenho 2, se a 3C aceitar a AWS como sistema de registro do teste<br>• decisão por ADR quando houver consumidor', ST.note);
  p.box('n_g', 20, 560, 1860, 190, '<b>O que mudou em relação à v3</b>: o Quick, o Bedrock e o Redshift saíram do desenho · o motor agora é o Personalize (NBO, mais por menos e cesta; direção de 28/10), sem SageMaker AI, e o Glue só como apoio · o Step Functions orquestra, o manifesto no S3 o aciona e o Airflow só agenda e carrega · toda a AWS fica em us-east-1, sem divisão com São Paulo · o código do cliente do SAP vai para a AWS no lugar do CNPJ, com controle de acesso rigoroso, e a A3 trabalha com os dados reais · retenção de 30 dias nos arquivos da AWS e histórico sem prazo no Snowflake · há dois desenhos: o 1 (oficial, controle do teste no Snowflake) e o 2 (controle também na AWS, com Grafana no painel).', ST.info);
  p.box('n_h', 20, 780, 1860, 220, '<b>Pontos de decisão</b>: (1) aceite da 3C para o motor na AWS, antes do contrato · (2) fim da W1: testes de aceite do NBO e do MBA concluídos, primeira rodada preparada e decisão entre o motor na AWS (E) e no Snowflake (D) com base nos testes, no piso e no desempenho offline · (3) início da W4: primeira campanha no ar · (4) início da W6: resultado do teste A/B e decisão sobre produção em tempo real. <b>Funding</b>: a AWS paga 10% do consumo anual projetado da produção, na conta da 3C; o mínimo de R$ 50 mil de repasse pede cerca de US$ 7,6 mil por mês de consumo, contra US$ 1,0 a 1,4 mil da produção base (seção 8.7 de arquitetura-proposta.md).', ST.sec);
  return p;
}


// ---------- aba 7: POC para o funding ----------
function poc() {
  const p = new Page('7 POC para o funding', 'v4-poc', 1900, 880);
  p.title('POC (prova de valor) para o funding · o Desenho 1 em escala menor, com resultado medido offline');
  p.info('7 POC para o funding', 'v4.2');
  p.zone('zs', 20, 100, 1860, 180, 'Snowflake da 3C · recorte do piloto', ST.zone('#F7FBFF', '#6c8ebf'));
  p.box('p1', 40, 150, 420, 110, '<b>Recorte do piloto</b><br>1 filial e 1 a 2 famílias de produto; 12 meses de histórico por cliente e item; código do cliente do SAP no lugar do CNPJ; foto versionada dos dados', ST.tab);
  p.box('p2', 500, 150, 420, 110, '<b>Visões de exportação e manifesto</b><br>histórico de compras, itens e estoque; papel de exportação separado; disparo à mão (o Airflow entra só na produção)', ST.proc);
  p.zone('za', 20, 310, 1860, 330, 'AWS · conta da 3C · N. Virgínia (us-east-1) · custo do piloto em torno de US$ 300 a 600 por mês', ST.cloud);
  p.zone('zf', 1060, 340, 800, 290, 'Step Functions · orquestra o preparo, o NBO, a cesta e a saída', ST.sfn);
  p.aws('s3in', 560, 370, 300, 100, 's3', '<b>S3 · entrada</b><br>visões exportadas, criptografadas com chave da 3C; apagadas em 30 dias');
  p.aws('glue1', 1080, 370, 240, 100, 'glue', '<b>Glue · preparo</b><br>arquivos do Personalize e tabela de pedidos');
  p.aws('pers', 1340, 370, 240, 100, 'personalize', '<b>Personalize · NBO</b><br>desconto e mais por menos');
  p.aws('sm', 1600, 370, 240, 100, 'personalize', '<b>Personalize · cesta</b><br>SIMS: pares do mesmo pedido (MBA); teste na W1');
  p.aws('glue2', 1600, 510, 240, 100, 'glue', '<b>Glue · saídas</b><br>junta NBO e cesta; filtro final; arquivo de sucesso');
  p.box('n_cost', 40, 370, 480, 100, '<b>Custo da POC</b>: cenário A da seção 8.6 de arquitetura-proposta.md, cerca de US$ 1,2 a 2,4 mil no piloto inteiro (3 a 4 meses). O Personalize tem franquia gratuita nos 2 primeiros meses. Valores a confirmar na calculadora da AWS.', ST.note);
  p.box('n_sec', 40, 510, 480, 100, '<b>Segurança</b>: papéis nominais, chave de criptografia da 3C, bucket sem acesso público, CloudTrail; a A3 trabalha com os dados reais sob contrato de operador (aba 5).', ST.sec);
  p.zone('zr', 20, 670, 1860, 190, 'Resultado da POC · o que se leva ao cliente e à AWS', ST.zone('#F5FFF5', '#82b366'));
  p.box('r2', 1600, 720, 240, 120, '<b>Tabelas no Snowflake</b><br>recomendações, regras de cesta e métricas, carregadas da AWS', ST.tab);
  p.box('r1', 1200, 720, 340, 120, '<b>Comparação offline</b><br>acerto nos 10 primeiros, cobertura do catálogo e ganho sobre o piso (popularidade e cesta em SQL), por mecânica; critério combinado antes', ST.tab);
  p.box('r3', 780, 720, 360, 120, '<b>Calculadora do SOW</b><br>projeta o consumo anual da produção na conta da 3C; o funding é 10% dele, e o mínimo de R$ 50 mil pede cerca de US$ 7,6 mil por mês (seção 8.7)', ST.warn);
  p.box('r4', 380, 720, 340, 120, '<b>Decisão</b><br>seguir para a produção com teste A/B (fase 1 do contrato) ou ajustar os modelos', ST.sys);
  const e = (id, s, t2, l, o) => p.edge(id, s, t2, l, o);
  e('e1', 'p1', 'p2', '1 recorte', {});
  e('e2', 'p2', 's3in', '2 exporta', { ex: [0.5, 1], en: [0.5, 0] });
  e('e3', 's3in', 'glue1', '3 manifesto aciona', {});
  e('e4', 'glue1', 'pers', '4 NBO', {});
  e('e5', 'pers', 'sm', '5 cesta', {});
  e('e6', 'sm', 'glue2', '6 formata', { ex: [0.5, 1], en: [0.5, 0] });
  e('e7', 'glue2', 'r2', '7 carga de volta', { ex: [0.5, 1], en: [0.5, 0] });
  e('e8', 'r2', 'r1', '8 mede', { ex: [0, 0.5], en: [1, 0.5] });
  e('e9', 'r1', 'r3', '9 projeta', { ex: [0, 0.5], en: [1, 0.5] });
  e('e10', 'r3', 'r4', '10 decide', { ex: [0, 0.5], en: [1, 0.5] });
  return p;
}

const pages = [comparativo(), d1Geral(), d1Tec(), d2Tec(), dados(), fases(), poc()];
let bad = 0;
for (const p of pages) {
  const errs = p.validate();
  console.log(`${p.name}: ${p.cells.length} células, ${p.e.length} setas, ${errs.length} problemas`);
  errs.forEach((x) => console.log('  - ' + x));
  bad += errs.length;
}
const out = process.argv[2];
if (out) { fs.writeFileSync(out, wrapFile(pages), 'utf8'); console.log('escrito: ' + out); }
process.exitCode = bad ? 1 : 0;
