/* Cálculo da reforma: funções puras (não leem a página), fáceis de testar.
   params = {ano, cbsRef, ibsRef} · empresa = {vendas, compras, carga, setor} */
import { ANOS, SETORES } from './dados.js';

/* alíquotas efetivas (%) da CBS e do IBS para o ano e o tipo de atividade */
export function aliquotas({ano, cbsRef, ibsRef}, setor = 0) {
  const a = ANOS[ano], restante = 1 - SETORES[setor].reducao;
  return {cbs: cbsRef * a.cbs * restante, ibs: ibsRef * a.ibs * restante, velho: a.velho};
}

/* imposto de hoje x imposto no ano escolhido (CBS e IBS incidem sobre vendas − compras com crédito) */
export function calcular(params, {vendas, compras, carga, setor}) {
  const a = aliquotas(params, setor);
  const base = Math.max(0, vendas - compras);
  const hoje = vendas * carga / 100;
  const resto = hoje * a.velho;                        // tributos atuais que ainda não saíram
  const cbs = base * a.cbs / 100, ibs = base * a.ibs / 100;
  const novo = resto + cbs + ibs;
  return {hoje, resto, cbs, ibs, novo, dif: novo - hoje, base, a};
}

/* imposto de um item da nota (sem crédito) */
export function impostoDoItem(params, valor, setor) {
  const a = aliquotas(params, setor);
  return {a, cbs: valor * a.cbs / 100, ibs: valor * a.ibs / 100};
}
