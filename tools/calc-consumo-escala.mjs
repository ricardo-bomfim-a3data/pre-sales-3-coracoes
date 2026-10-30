// Modelo de consumo AWS (Personalize + apoio) para o cenário de escala. Desde 28/10 o MBA roda no Personalize e o SageMaker AI está fora; desde 29/10 o Desenho 2 (Athena, Grafana) foi descartado. O fixo (apoio) é só Glue, S3, chaves, Step Functions e logs. A cesta está modelada (SIMS + Glue).
// Preços: página oficial do Personalize consultada em 27/10/2026 (us-east-1 não está explícito na página; A VERIFICAR na calculadora).
// Uso: node tools/calc-consumo-escala.mjs   (altere CENARIOS para testar outras premissas)
const SEMANAS = 4.33;
const CAMBIO = 5.5;           // R$/US$ (suposição)
const REPASSE = 0.10;         // 10% do consumo anual projetado
const META_CONSUMO_ANUAL_USD = 100000; // meta do funding (29/10): US$ 100 mil de consumo anual projetado => repasse de US$ 10 mil

// Faixas da segmentação (por 1.000 usuários, por consulta de item)
function segmentacao(usuarios) {
  const faixas = [[100e3, 0.016], [900e3, 0.008], [9e6, 0.004], [40e6, 0.001]];
  let rest = usuarios, custo = 0;
  for (const [tam, preco] of faixas) { const q = Math.min(rest, tam); custo += (q / 1000) * preco; rest -= q; if (rest <= 0) break; }
  return custo;
}
// Faixas das receitas clássicas em tempo real (por 1.000 requisições)
function rtClassico(req) {
  const faixas = [[72e6, 0.0556], [648e6, 0.0278], [Infinity, 0.0139]];
  let rest = req, custo = 0;
  for (const [tam, preco] of faixas) { const q = Math.min(rest, tam); custo += (q / 1000) * preco; rest -= q; if (rest <= 0) break; }
  return custo;
}
// Faixas das receitas clássicas em lote (por 1.000 recomendações)
function loteClassico(req) {
  const faixas = [[20e6, 0.067], [180e6, 0.058], [Infinity, 0.05]];
  let rest = req, custo = 0;
  for (const [tam, preco] of faixas) { const q = Math.min(rest, tam); custo += (q / 1000) * preco; rest -= q; if (rest <= 0) break; }
  return custo;
}
const PISO_RT_REQ = 1 * 3600 * 24 * 30; // 1 TPS ligado o mês inteiro = 2,592 M requisições

const CENARIOS = [
  // interacoesM: milhões de interações por treino; usuarios: clientes no lote; mecanicas: lotes por rodada; itensAfin: itens consultados por semana
  // rtCampanhas / rtReq: campanhas em tempo real e requisições por mês; fixo: Glue + S3, chaves, Step Functions e logs (apoio). Em 29/10 saiu o ponto médio de Athena/Grafana (US$ 175, Desenho 2 descartado) dos cenários de escala
  { id: 'P1 · Produção base (hoje)', interacoesM: 30, usuarios: 300e3, mecanicas: 2, itensAfin: 20, rtCampanhas: 0, rtReq: 0, fixo: 585, horasTreinoClassico: 8, cestaHoras: 20, cestaDpuH: 4 },
  { id: 'E1 · Plataforma ×10, só lote', interacoesM: 300, usuarios: 3e6, mecanicas: 2, itensAfin: 20, rtCampanhas: 0, rtReq: 0, fixo: 1325, horasTreinoClassico: 80, cestaHoras: 200, cestaDpuH: 40 },
  // E2 (28/10): ×10 em lote + tempo real mínimo = campanhas ligadas só no piso de 1 TPS (sem tráfego acima do piso). Alvo do Ricardo: ≈ US$ 10,5 mil/mês (2 campanhas); E2b: 5 campanhas no piso ≈ US$ 12 mil/mês.
  { id: 'E2 · ×10 lote + tempo real mínimo (2 campanhas)', interacoesM: 300, usuarios: 3e6, mecanicas: 2, itensAfin: 20, rtCampanhas: 2, rtReq: 0, fixo: 1625, horasTreinoClassico: 80, cestaHoras: 200, cestaDpuH: 40 },
  { id: 'E2b · ×10 lote + tempo real mínimo (5 campanhas)', interacoesM: 300, usuarios: 3e6, mecanicas: 2, itensAfin: 20, rtCampanhas: 5, rtReq: 0, fixo: 1625, horasTreinoClassico: 80, cestaHoras: 200, cestaDpuH: 40 },
  { id: 'E3 · ×10 + tempo real intenso', interacoesM: 300, usuarios: 3e6, mecanicas: 2, itensAfin: 20, rtCampanhas: 10, rtReq: 100e6, fixo: 2125, horasTreinoClassico: 80, cestaHoras: 200, cestaDpuH: 40 },
];

const fmt = (n) => Math.round(n).toLocaleString('pt-BR');
const linhas = [];
for (const c of CENARIOS) {
  const afin = segmentacao(c.usuarios) * c.itensAfin * SEMANAS;
  const afinTreino = 0.24 * c.horasTreinoClassico * 0.25 * SEMANAS; // treino da segmentação ~25% das horas do treino principal (suposição)
  // cesta (SIMS, receita clássica: treino por hora, lote por 1.000 recomendações com ~500 SKUs âncora) + job do Glue que calcula suporte, confiança e lift
  const cesta = 0.24 * c.cestaHoras * SEMANAS + (500 * SEMANAS / 1000) * 0.067 + c.cestaDpuH * 0.44 * SEMANAS;
  // v2
  const treino2 = c.interacoesM * 2 * SEMANAS;
  const lote2 = (c.usuarios / 1000) * 0.15 * c.mecanicas * SEMANAS;
  const rtReq2 = Math.max(c.rtReq, c.rtCampanhas * PISO_RT_REQ);
  const rt2 = (rtReq2 / 1000) * 0.15;
  const total2 = treino2 + lote2 + rt2 + afin + afinTreino + cesta + c.fixo;
  // clássico
  const treinoC = 0.24 * c.horasTreinoClassico * SEMANAS;
  const loteC = loteClassico(c.usuarios * c.mecanicas * SEMANAS);
  const rtReqC = Math.max(c.rtReq, c.rtCampanhas * PISO_RT_REQ);
  const rtC = rtClassico(rtReqC);
  const totalC = treinoC + loteC + rtC + afin + afinTreino + cesta + c.fixo;
  for (const [rec, parts, total] of [
    ['v2', { treino: treino2, lote: lote2, tempoReal: rt2 }, total2],
    ['clássica', { treino: treinoC, lote: loteC, tempoReal: rtC }, totalC],
  ]) {
    const ano = total * 12;
    const repasseUSD = ano * REPASSE;
    linhas.push({ cenario: c.id, receita: rec, treino: fmt(parts.treino), lote: fmt(parts.lote), tempoReal: fmt(parts.tempoReal), afinidade: fmt(afin + afinTreino), cesta: fmt(cesta), fixo: fmt(c.fixo), mes: fmt(total), ano: fmt(ano), 'repasse US$': fmt(repasseUSD), 'repasse R$': fmt(repasseUSD * CAMBIO), 'folga sobre US$ 100 mil/ano': Math.round((ano / META_CONSUMO_ANUAL_USD - 1) * 100) + '%', 'atinge US$ 100 mil/ano': ano >= META_CONSUMO_ANUAL_USD ? 'sim' : 'não' });
  }
}
console.table(linhas);

// Rampa de adoção (exemplo): ano 1 = base ampliada, ano 2 = E1, ano 3 = E2 (v2)
const mensal = (id, rec = 'v2') => Number(linhas.find((l) => l.cenario.startsWith(id) && l.receita === rec).mes.replace(/\./g, ''));
const rampa = [mensal('P1'), mensal('E1'), mensal('E2')].map((m) => m * 12);
const soma = rampa.reduce((a, b) => a + b, 0);
console.log('\nRampa (v2): ano 1 / ano 2 / ano 3 (US$):', rampa.map(fmt).join(' / '), '| total 3 anos:', fmt(soma), '| 10%:', fmt(soma * REPASSE), '| R$:', fmt(soma * REPASSE * CAMBIO));

// Sensibilidade: custo de cada alavanca isolada (v2), por mês
console.log('\nCusto unitário (v2, por mês):');
console.log('  treino semanal por 100 M de interações: US$', fmt(100 * 2 * SEMANAS));
console.log('  lote semanal por 1 M de clientes e 1 mecânica: US$', fmt(1000 * 0.15 * SEMANAS));
console.log('  campanha em tempo real ociosa (piso 1 TPS): US$', fmt((PISO_RT_REQ / 1000) * 0.15));
console.log('  cada 10 M de requisições em tempo real (acima do piso): US$', fmt(10e6 / 1000 * 0.15));
console.log('  uma consulta de afinidade para 3 M de usuários: US$', segmentacao(3e6).toFixed(2));

// Entradas para a calculadora (cenário E2, receita v2), por mês
{
  const c = CENARIOS.find((x) => x.id.startsWith('E2 '));
  console.log('\nEntradas da calculadora para E2 (por mês):');
  console.log('  interações ingeridas no treino:', fmt(c.interacoesM * SEMANAS), 'M (300 M por treino × 4,33 treinos)');
  console.log('  requisições de lote:', fmt(c.usuarios * c.mecanicas * SEMANAS / 1e6), 'M (3 M clientes × 2 mecânicas × 4,33 rodadas)');
  console.log('  requisições em tempo real:', (c.rtCampanhas * PISO_RT_REQ / 1e6).toFixed(2), 'M (', c.rtCampanhas, 'campanhas × 2,592 M do piso de 1 TPS)');
  console.log('  consultas de afinidade com item:', fmt(c.itensAfin * SEMANAS), 'por mês, cada uma sobre 3 M de usuários');
}
