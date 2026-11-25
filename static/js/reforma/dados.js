/* Dados do simulador. Ajuste aqui as regras e os exemplos.
   Conferido no repositório da Receita (calculadora-rtc-regime-regular): 2026 = CBS 0,9% e IBS 0,1%;
   redução de 60% e 30% para serviços de autônomo. O resto (2027 em diante) é estimativa. */

/* redução da alíquota por tipo de atividade (0 = nenhuma, 1 = alíquota zero) */
export const SETORES = [
  {nome: 'Geral (comércio, serviços)', reducao: 0},
  {nome: 'Saúde e educação',           reducao: 0.6},
  {nome: 'Profissionais liberais',     reducao: 0.3},
  {nome: 'Cesta básica',               reducao: 1},
];

/* por ano: parte da CBS cheia, parte do IBS cheio e fração que ainda resta dos tributos atuais */
export const ANOS = {
  2026: {cbs: 0.9 / 8.8, ibs: 0.1 / 17.7, velho: 1,  nome: '2026 · teste (CBS 0,9% + IBS 0,1%)'},
  2027: {cbs: 1, ibs: 0.1 / 17.7, velho: 1,           nome: '2027 · CBS cheia'},
  2028: {cbs: 1, ibs: 0.1 / 17.7, velho: 1,           nome: '2028'},
  2029: {cbs: 1, ibs: .1, velho: .9,                  nome: '2029 · IBS 10%'},
  2030: {cbs: 1, ibs: .2, velho: .8,                  nome: '2030 · IBS 20%'},
  2031: {cbs: 1, ibs: .3, velho: .7,                  nome: '2031 · IBS 30%'},
  2032: {cbs: 1, ibs: .4, velho: .6,                  nome: '2032 · IBS 40%'},
  2033: {cbs: 1, ibs: 1,  velho: 0,                   nome: '2033 · reforma completa'},
};
export const ANO_PADRAO = '2033';
export const CBS_REFERENCIA = 8.8;
export const IBS_REFERENCIA = 17.7;

export const EXEMPLOS = [
  {nome: 'Padaria do Zé',     vendas: 80000,  compras: 30000, carga: 12, setor: 0},
  {nome: 'Auto Peças Lima',   vendas: 150000, compras: 95000, carga: 14, setor: 0},
  {nome: 'Clínica Sorriso',   vendas: 60000,  compras: 8000,  carga: 9,  setor: 1},
  {nome: 'Mercado Bom Preço', vendas: 220000, compras: 170000, carga: 7, setor: 3},
  {nome: 'Studio Fit',        vendas: 35000,  compras: 5000,  carga: 11, setor: 2},
  {nome: 'Pet Shop Amigo',    vendas: 48000,  compras: 22000, carga: 12, setor: 0},
];
