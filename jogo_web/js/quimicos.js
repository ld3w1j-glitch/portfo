/* Agentes químicos e pandemia: trajes de proteção, máscaras, protetor facial, cilindro e pulverizador.
   Carregado depois de policia.js e antes de modelo.js. Arte própria; não representa órgãos nem marcas reais.
   Os "visores transparentes" são só a moldura e os reflexos, para o rosto continuar aparecendo. */

/* ================================================================ listas */
const CAPUZES = ['capuz_quimico', 'capuz_encapsulado'];           /* capuzes fechados: o cabelo alto fica escondido */
Object.assign(CHAPEUS, {capuz_quimico:'Capuz de proteção', capuz_encapsulado:'Capuz encapsulado (visor grande)', touca:'Touca cirúrgica'});
Object.assign(ROSTOS_EQ, {cirurgica:'Máscara cirúrgica', pff2:'Respirador PFF2 / N95', respirador:'Meia máscara com filtros', completa:'Máscara facial inteira'});
const MASCARAS_COM_COR = ['balaclava', 'cirurgica', 'pff2', 'respirador', 'completa'];
Object.assign(LUVAS, {quimicas:'Luvas químicas de cano longo'});
Object.assign(MOCHILAS, {cilindro:'Cilindro de ar', pulverizador:'Pulverizador de desinfecção'});
for (const p of [PADRAO_WASHINGTON, PADRAO_LIMPO, PADRAO_FEMININO]) p.protetor = {usa:false, cor:'#2E7BC4'};

EMBLEMAS.biorrisco = {nome:'Risco biológico', fundo:'#F2C230', simbolo:'#17171A',
  px:['000111000', '001000100', '001010100', '000111000', '110101011', '101111101', '100101001', '110000011', '011000110']};
NOMES_EMBLEMA.biorrisco = EMBLEMAS.biorrisco.nome;

/* ================================================================ roupas
   camisa = tecido do traje; detalhe = fitas de vedação; calcado = botas */
const roupaQuimica = (id, nome, cores_, pintar, extras) => { roupa(id, nome, cores_, pintar, extras); delete ROUPAS[id].civil; };

function pintaMacacao(p){
  if (ehPe(p.peca)) return p.k === 0 ? 'sola' : 'calcado';
  if (ehCanela(p.peca)){
    if (p.k < 4) return p.k === 3 ? 'calcado_sombra' : 'calcado';
    if (p.k < 5) return 'detalhe';                                                      /* fita que veda a bota */
    return 'camisa';
  }
  if (p.peca === 'quadril') return p.k === p.tam[2] - 1 ? 'camisa_sombra' : 'camisa';
  if (ehCoxa(p.peca)) return (p.n[0] !== 0 && p.topo === 5) ? 'camisa_sombra' : 'camisa';
  if (p.peca === 'torax' || p.peca === 'cintura'){
    if (p.frente && p.meio < .6) return 'detalhe';                                       /* aba do zíper com fita */
    if (p.peca === 'cintura' && p.k === 0) return 'camisa_escuro';                       /* elástico da cintura */
    return 'camisa';
  }
  if (ehBraco(p.peca)) return p.topo === 6 ? 'camisa_sombra' : 'camisa';
  if (ehAnte(p.peca)) return p.k === 0 ? 'detalhe' : 'camisa';
  return null;
}
roupaQuimica('macacao_quimico', 'Macacão químico', {camisa:['Macacão', '#E6C229'], detalhe:['Fitas de vedação', '#3A3D45'], calcado:['Botas', '#2B2D33']}, pintaMacacao);

roupaQuimica('traje_encapsulado', 'Traje encapsulado', {camisa:['Traje', '#D9641E'], detalhe:['Fitas de vedação', '#E8D44A'], calcado:['Botas', '#1F2023']}, pintaMacacao,
  cx => {                                                                             /* tecido folgado: volumes por cima do corpo */
    camada(cx, 'torax', -.2, 14.2, -.75, 8.75, .2, 10.4, 'camisa', false, 1.1);
    cx('torax', 6.5, 7.5, -.95, -.75, .4, 10.2, 'detalhe');
    camada(cx, 'cintura', -.4, 10.4, -.5, 8.5, .1, 2.6, 'camisa_sombra', false, 1);
    for (const P of ['braco_d', 'braco_e', 'antebraco_d', 'antebraco_e', 'coxa_d', 'coxa_e']){
      const [w, d, h] = ESTRUTURA[P].tam;
      anel(cx, P, -.45, w + .45, -.45, d + .45, .8, h - .6, 'camisa', false, .5);
    }
    for (const P of ['canela_d', 'canela_e']){ const [w, d, h] = ESTRUTURA[P].tam; anel(cx, P, -.45, w + .45, -.45, d + .45, 4.6, h - .4, 'camisa', false, .5); anel(cx, P, -.55, w + .55, -.55, d + .55, 4.2, 5, 'detalhe', false, .55); }
    for (const P of ['antebraco_d', 'antebraco_e']){ const [w, d] = ESTRUTURA[P].tam; anel(cx, P, -.55, w + .55, -.55, d + .55, .2, 1.1, 'detalhe', false, .55); }
  });

/* avental de isolamento: fechado na frente, aberto atrás sobre o pijama hospitalar (calca) */
roupaQuimica('avental_epi', 'Avental de isolamento', {camisa:['Avental', '#5E9BD1'], calca:['Pijama hospitalar', '#2F5D6B'], calcado:['Calçado fechado', '#E9E9E4'], detalhe:['Punhos e amarras', '#E9EEF2']}, p => {
  const c = calcado(p, 0); if (c) return c;
  if (ehCanela(p.peca)) return 'calca';
  if (ehCoxa(p.peca)) return p.tras && p.meio < 1.2 ? 'calca' : 'camisa';
  if (p.peca === 'quadril') return p.tras && p.meio < 2 ? 'calca' : 'camisa';
  if (p.peca === 'cintura'){
    if (p.k === 1) return 'detalhe';                                                     /* amarra da cintura */
    return p.tras && p.meio < 1.6 ? 'calca' : 'camisa';
  }
  if (p.peca === 'torax'){
    if (p.tras && p.meio < 1.6) return p.k === 8 ? 'detalhe' : 'calca';
    return p.topo === 0 && p.frente && p.meio < 3 ? 'detalhe' : 'camisa';
  }
  if (ehBraco(p.peca)) return 'camisa';
  if (ehAnte(p.peca)) return p.k === 0 ? 'detalhe' : 'camisa';
  return null;
});

/* ================================================================ cabeça */
function capuzQuimico(c, cx){
  const C = 'cabeca';
  for (const [a, b] of [[-.75, 1.35], [12.65, 14.75]]) cx(C, a, b, -.7, 13.9, 1.6, 17.6, 'chapeu');
  cx(C, 1.35, 12.65, 12.8, 14.6, 1.6, 17.6, 'chapeu');
  camada(cx, C, -.5, 14.5, -.85, 14.4, 17.2, 19.4, 'chapeu', false, 1.2);
  camada(cx, C, .7, 13.3, -1.05, 13.5, 19.4, 20.8, 'chapeu', false, 1.6);
  camada(cx, C, 2.6, 11.4, 1.8, 11.8, 20.8, 21.5, 'chapeu_sombra', false, 1.4);
  /* moldura elástica em volta do rosto */
  cx(C, 1.35, 12.65, -.8, .2, 14.4, 17.4, 'chapeu'); cx(C, 1.35, 12.65, -.8, .2, .9, 2.5, 'chapeu');
  cx(C, 1.35, 12.65, -1, -.8, 14.4, 15, 'chapeu_escuro'); cx(C, 1.35, 12.65, -1, -.8, 1.9, 2.5, 'chapeu_escuro');
  for (const [a, b] of [[.75, 1.35], [12.65, 13.25]]) cx(C, a, b, -1, -.7, 1.9, 15, 'chapeu_escuro');
  cx(C, 6.75, 7.25, .6, 12.4, 21.5, 21.75, 'chapeu_escuro');                             /* costura do alto */
  /* gola que cobre o pescoço e o alto dos ombros */
  camada(cx, 'torax', 1.6, 12.4, -.6, 8.6, 10.3, 11.7, 'chapeu_sombra', false, 1.2);
}
function capuzEncapsulado(c, cx){
  const C = 'cabeca', x0 = -3, x1 = 17, y0 = -4.2, y1 = 16.2;
  for (const [a, b] of [[x0, x0 + 1], [x1 - 1, x1]]) cx(C, a, b, y0 + 1.2, y1 - 1.2, .8, 20.4, 'chapeu');
  cx(C, x0 + 1, x1 - 1, y1 - 1.2, y1, .8, 20.4, 'chapeu');
  camada(cx, C, x0, x1, y0, y1, 20.4, 22.4, 'chapeu', false, 2);
  camada(cx, C, x0 + 1.8, x1 - 1.8, y0 + 1.8, y1 - 1.8, 22.4, 23.8, 'chapeu', false, 2.2);
  camada(cx, C, x0 + 4.5, x1 - 4.5, y0 + 4.5, y1 - 4.5, 23.8, 24.5, 'chapeu_sombra', false, 1.6);
  /* frente: tecido em volta de um visor grande */
  cx(C, x0 + 1, x1 - 1, y0, y0 + 1.2, 17.2, 20.4, 'chapeu'); cx(C, x0 + 1, x1 - 1, y0, y0 + 1.2, .8, 3, 'chapeu');
  for (const [a, b] of [[x0, -.4], [14.4, x1]]) cx(C, a, b, y0, y0 + 1.2, .8, 20.4, 'chapeu');
  const f = y0 - .25;
  cx(C, -.8, 14.8, f, y0 + .2, 16.8, 17.7, 'chapeu_escuro'); cx(C, -.8, 14.8, f, y0 + .2, 2.6, 3.5, 'chapeu_escuro');
  for (const [a, b] of [[-.8, .1], [13.9, 14.8]]) cx(C, a, b, f, y0 + .2, 3.5, 16.8, 'chapeu_escuro');
  for (const [a, z0, z1] of [[.8, 12.4, 16], [1.6, 13.8, 16], [12.4, 4.2, 7]]) cx(C, a, a + .35, f, f + .2, z0, z1, 'brilho');
  camada(cx, 'torax', -.6, 14.6, -1.2, 9.2, 9.4, 11.8, 'chapeu_sombra', false, 1.6);         /* ombros do traje */
}
function touca(c, cx){
  const C = 'cabeca';
  camada(cx, C, .1, 13.9, -.7, 13.9, 14.6, 17.4, 'chapeu', false, 1);
  camada(cx, C, -.5, 14.5, -.5, 14.5, 17.4, 19.8, 'chapeu', false, 1.8);
  camada(cx, C, 1.4, 12.6, 1, 12.8, 19.8, 21.2, 'chapeu', false, 2);
  camada(cx, C, 0, 14, -.82, 14, 14.5, 15.1, 'chapeu_escuro', false, 1);
  for (const [a, b] of [[.2, .9], [13.1, 13.8]]) cx(C, a, b, 5, 13.8, 11.4, 14.6, 'chapeu_sombra');
}

/* ================================================================ rosto */
/* tiras que prendem a máscara, justas à cabeça: embaixo ela é mais estreita (x de 2 a 12, como no lenço) */
function tiras(cx, z, mat, y = -.5){
  const baixo = z < 9, a0 = baixo ? 1.72 : .72, fundo = baixo ? 11.85 : 12.75;
  for (const a of [a0, 14 - a0 - .34]) cx('cabeca', a, a + .34, y + .15, fundo + .4, z, z + .45, mat);
  cx('cabeca', a0, 14 - a0, fundo, fundo + .4, z, z + .45, mat);
  for (const [a, b] of [[a0, 3.4], [10.6, 14 - a0]]) cx('cabeca', a, b, y - .1, y + .3, z, z + .45, mat);
}
function mascaraCirurgica(c, cx){
  const C = 'cabeca';
  cx(C, 3, 11, -1, -.25, 3, 8.2, 'balaclava'); cx(C, 3.8, 10.2, -1.25, -1, 3.5, 7.4, 'balaclava');
  for (const z of [4.3, 5.4, 6.5]) cx(C, 3.1, 10.9, -1.35, -1.25, z, z + .28, 'balaclava_sombra');    /* pregas */
  cx(C, 4.6, 9.4, -1.12, -1, 7.65, 7.95, 'metal');                                                    /* clipe do nariz */
  cx(C, 3, 11, -1.08, -1, 8, 8.3, 'branco_roupa'); cx(C, 3, 11, -1.08, -1, 2.95, 3.25, 'branco_roupa');
  tiras(cx, 7.6, 'branco_roupa'); tiras(cx, 4.7, 'branco_roupa');
}
function respiradorPff2(c, cx){
  const C = 'cabeca';
  camada(cx, C, 2.9, 11.1, -1.15, -.25, 2.7, 8.5, 'balaclava', false, .5);
  camada(cx, C, 3.7, 10.3, -2, -1.15, 3.3, 7.7, 'balaclava', false, .9);
  cx(C, 4.8, 9.2, -2.45, -2, 4, 6.9, 'balaclava'); cx(C, 5, 9, -2.55, -2.45, 5.3, 5.55, 'balaclava_sombra');
  cx(C, 4.7, 9.3, -2.15, -2, 7.35, 7.75, 'metal');
  tiras(cx, 8, 'filtro_amarelo'); tiras(cx, 4.6, 'filtro_amarelo');
}
function meiaMascara(c, cx){
  const C = 'cabeca';
  camada(cx, C, 3.5, 10.5, -1.6, -.25, 2.6, 8.4, 'balaclava', false, .6);
  cx(C, 5.2, 8.8, -2.2, -1.6, 3.2, 7.1, 'balaclava_sombra'); cx(C, 6, 8, -2.45, -2.2, 3.4, 5.2, 'preto');
  for (let z = 3.65; z < 5; z += .45) cx(C, 6.2, 7.8, -2.55, -2.45, z, z + .18, 'metal_escuro');
  for (const [a, b] of [[.8, 4.5], [9.5, 13.2]]){                                       /* os dois cartuchos */
    camada(cx, C, a, b, -2.9, -1.1, 2.9, 6.9, 'metal_escuro', false, .8);
    camada(cx, C, a + .35, b - .35, -3.4, -2.9, 3.25, 6.55, 'filtro_rosa', false, .8);
    camada(cx, C, a + 1.25, b - 1.25, -3.55, -3.4, 4.15, 5.65, 'preto', false, .3);
  }
  tiras(cx, 8.2, 'preto'); tiras(cx, 4.6, 'preto');
}
function mascaraInteira(c, cx){
  const C = 'cabeca';
  /* moldura do visor: o rosto aparece por dentro */
  cx(C, 1.7, 12.3, -1.7, -.2, 12.9, 14.1, 'balaclava'); cx(C, 1.7, 12.3, -1.7, -.2, 7.5, 8.4, 'balaclava');
  for (const [a, b] of [[.9, 1.9], [12.1, 13.1]]) cx(C, a, b, -1.7, -.2, 7.9, 13.4, 'balaclava');
  cx(C, 1.9, 12.1, -1.82, -1.7, 12.9, 13.2, 'preto');
  cx(C, 2.3, 2.65, -1.75, -1.65, 10.9, 12.6, 'brilho'); cx(C, 3, 3.3, -1.75, -1.65, 11.7, 12.6, 'brilho'); cx(C, 11.1, 11.4, -1.75, -1.65, 8.6, 9.7, 'brilho');
  /* focinho com o filtro redondo no centro */
  camada(cx, C, 2.6, 11.4, -1.9, -.25, 2.4, 7.7, 'balaclava', false, .9);
  camada(cx, C, 4.2, 9.8, -3.2, -1.9, 2.4, 6.8, 'metal_escuro', false, 1);
  camada(cx, C, 4.8, 9.2, -3.75, -3.2, 2.9, 6.3, 'preto', false, .9);
  for (let z = 3.5; z < 5.8; z += .6) cx(C, 5.4, 8.6, -3.85, -3.75, z, z + .22, 'metal');
  for (const [a, b] of [[1.7, 3.7], [10.3, 12.3]]) camada(cx, C, a, b, -2.2, -.9, 3.2, 5.6, 'borracha_eq', false, .5);
  tiras(cx, 13.2, 'preto', -.9); tiras(cx, 6, 'preto', -.9);
}
function protetorFacial(c, cx){
  const C = 'cabeca';
  camada(cx, C, -.25, 14.25, -1.35, 13.6, 14.1, 15.2, 'protetor', false, 1);
  cx(C, 1.4, 12.6, -2.2, -1.35, 14.2, 15, 'branco_roupa');                              /* espuma da testa */
  /* a lâmina transparente: bordas finas e reflexos */
  const f = -3.9;
  cx(C, .4, 13.6, f, f + .25, 14.5, 14.85, 'protetor'); cx(C, .8, 13.2, f, f + .25, 1.4, 1.7, 'brilho');
  for (const [a, b] of [[.4, .72], [13.28, 13.6]]) cx(C, a, b, f, f + .25, 1.7, 14.5, 'brilho');
  for (const [a, b] of [[.4, .72], [13.28, 13.6]]) cx(C, a, b, f + .25, -1.35, 14.5, 14.85, 'protetor');
  for (const [a, z0, z1] of [[1.5, 11.5, 13.8], [2.2, 12.6, 13.8], [11.7, 2.6, 4.6]]) cx(C, a, a + .22, f, f + .12, z0, z1, 'brilho');
}

/* ================================================================ nas costas e nas mãos */
function alcasDeCostas(cx, yf, y){
  for (const x of [2.3, 10.2]){
    cx('torax', x, x + 1.5, yf - .45, yf, 3.6, 11.4, 'preto'); cx('torax', x, x + 1.5, yf, y + .1, 11.5, 12, 'preto');
    cx('torax', x, x + 1.5, yf - .1, yf + .35, 11.2, 12, 'preto'); cx('torax', x, x + 1.5, y - .15, y + .4, 7.6, 11.9, 'preto');
    fivela(cx, 'torax', x + .75, yf - .45, 5.4);
  }
  cx('torax', 3.8, 10.2, yf - .65, yf - .45, 7.6, 8, 'preto'); fivela(cx, 'torax', 7, yf - .65, 7.8);
}
/* onde as alças passam: por cima do colete, ou do volume do traje encapsulado */
function apoios(c){
  const [fc, tc] = ESPESSURA[c.colete.estilo] || [0, 0], folga = c.roupa === 'traje_encapsulado' ? .75 : 0;
  return {y:8 + Math.max(tc, folga), yf:-.02 - Math.max(fc, folga)};
}
function cilindroDeAr(c, cx){
  const T = 'torax', {y, yf} = apoios(c);
  cx(T, 2.6, 11.4, y, y + .7, -.4, 10.6, 'preto');                                          /* suporte */
  camada(cx, T, 4, 10, y + .6, y + 6, -.8, 10.2, 'mochila', false, 1.6);
  camada(cx, T, 4.7, 9.3, y + 1.2, y + 5.4, 10.2, 11.4, 'mochila_sombra', false, 1.4);
  camada(cx, T, 4.7, 9.3, y + 1.2, y + 5.4, -1.6, -.8, 'mochila_escuro', false, 1.4);
  cx(T, 6.2, 7.8, y + 2.5, y + 4.1, 11.4, 12.6, 'metal'); cx(T, 7.8, 9.6, y + 2.9, y + 3.7, 11.7, 12.4, 'preto');   /* válvula */
  for (const z of [1.6, 7]) anel(cx, T, 3.75, 10.25, y + .45, y + 6.25, z, z + .7, 'preto', false, .28);
  cx(T, 4.6, 9.4, y + 6, y + 6.2, 4.2, 6, 'branco_roupa'); cx(T, 5.1, 8.9, y + 6.2, y + 6.3, 4.8, 5.35, 'preto');
  /* mangueira pelo ombro e manômetro no peito */
  cx(T, 11.6, 12.2, y - .1, y + 2.5, 10, 10.6, 'preto'); cx(T, 11.6, 12.2, yf - .6, y - .1, 11.9, 12.5, 'preto'); cx(T, 11.6, 12.2, yf - .9, yf - .4, 5.2, 12.4, 'preto');
  camada(cx, T, 11, 12.8, yf - 1.3, yf - .6, 3.6, 5.4, 'metal_escuro', false, .4); cx(T, 11.45, 12.35, yf - 1.42, yf - 1.3, 4.05, 4.95, 'branco_roupa');
  alcasDeCostas(cx, yf, y);
  anel(cx, 'cintura', -.65, 10.65, -.65, 8.65, .6, 1.7, 'preto', false, .35);
}
function pulverizadorCostal(c, cx){
  const T = 'torax', {y, yf} = apoios(c);
  camada(cx, T, 2.8, 11.2, y, y + 4.6, -.6, 8.6, 'mochila', false, 1.1);
  camada(cx, T, 3.6, 10.4, y + .5, y + 4.1, 8.6, 10, 'mochila', false, 1);
  camada(cx, T, 5.6, 8.4, y + 1.3, y + 3.5, 10, 11.1, 'preto', false, .6);                   /* tampa */
  camada(cx, T, 2.6, 11.4, y, y + 4.8, -2.2, -.6, 'preto', false, .8);                       /* base com a bomba */
  for (const z of [1.2, 2.7, 4.2, 5.7]) cx(T, 9.6, 10.5, y + 4.6, y + 4.75, z, z + .3, 'preto');   /* marcas de nível */
  pintaEmblema('biorrisco', (u0, u1, v0, v1, k, m) => cx(T, 8.7 - u1, 8.7 - u0, y + 4.6 + k * .14, y + 4.74 + k * .14, 2.4 + v0, 2.4 + v1, m), .42);
  cx(T, 11.2, 12.4, y + 1.6, y + 2.5, -1.6, -.9, 'preto'); cx(T, 12.4, 12.9, y + 1.6, y + 2.5, -1.6, 4.6, 'preto'); cx(T, 12.4, 12.9, 1, y + 2.5, 3.9, 4.6, 'preto');   /* mangueira */
  alcasDeCostas(cx, yf, y);
  if (c.arma && c.arma.estilo !== 'nenhum') return;                                       /* a mão direita já está com a arma */
  /* lança na mão direita */
  const [w, d] = ESTRUTURA.mao_d.tam, x = w / 2 - .4;
  cx('mao_d', x - .15, x + .95, -1.4, d + .7, .8, 2.3, 'preto'); cx('mao_d', x + .15, x + .65, -9.5, -1.4, 1.3, 1.8, 'metal');
  cx('mao_d', x - .1, x + .9, -10.8, -9.5, 1.05, 2.05, 'filtro_amarelo'); cx('mao_d', x + .2, x + .6, -11.2, -10.8, 1.35, 1.75, 'preto');
  cx('mao_d', x + .15, x + .65, d + .7, d + 2, 1.3, 1.8, 'preto');
}
function luvasQuimicas(c, cx){
  for (const P of ['antebraco_d', 'antebraco_e']){
    const [w, d] = ESTRUTURA[P].tam, folga = c.roupa === 'traje_encapsulado' ? .7 : .22;
    anel(cx, P, -folga, w + folga, -folga, d + folga, 0, 3.6, 'luva', false, folga + .08);
    anel(cx, P, -folga - .14, w + folga + .14, -folga - .14, d + folga + .14, 3.3, 3.9, 'luva_escuro', false, folga + .2);
  }
}

/* encaixa tudo no equipar() */
const equiparSemQuimicos = equipar;
equipar = function(c, cx){
  equiparSemQuimicos(c, cx);
  if (c.chapeu.estilo === 'capuz_quimico') capuzQuimico(c, cx);
  if (c.chapeu.estilo === 'capuz_encapsulado') capuzEncapsulado(c, cx);
  if (c.chapeu.estilo === 'touca') touca(c, cx);
  const f = c.facial?.estilo;
  if (f === 'cirurgica') mascaraCirurgica(c, cx);
  if (f === 'pff2') respiradorPff2(c, cx);
  if (f === 'respirador') meiaMascara(c, cx);
  if (f === 'completa') mascaraInteira(c, cx);
  if (c.protetor?.usa) protetorFacial(c, cx);
  if (c.mochila.estilo === 'cilindro') cilindroDeAr(c, cx);
  if (c.mochila.estilo === 'pulverizador') pulverizadorCostal(c, cx);
  if (c.luvas.estilo === 'quimicas') luvasQuimicas(c, cx);
};

/* ================================================================ conjuntos */
GRUPOS_KITS.quimicos = 'Agentes químicos e pandemia';
for (const k of Object.values(KITS)) k.muda.protetor = {usa:false, ...k.muda.protetor};

const traje = (tecido_, fita, botas) => ({camisa:tecido_, detalhe:fita, calcado:botas});
const mascara_ = (estilo, cor) => ({estilo, cor});
const protege = cor => ({usa:true, cor});
const luvaQ = cor => luva('quimicas', cor);
const biorrisco = {estilo:'biorrisco'};
const quimico = (id, nome, roupa_, cores_, extras) => conjunto(id, 'quimicos', nome, roupa_, cores_, {protetor:{usa:false}, ...extras});

quimico('qm_descontaminacao', 'Descontaminação', 'macacao_quimico', traje('#E6C229', '#3A3D45', '#2B2D33'),
  {chapeu:na_cabeca('capuz_quimico', '#E6C229'), facial:mascara_('gas', '#1B1C20'), mochila:veste('pulverizador', '#E9E7DD'), luvas:luvaQ('#2E6B3F'), emblema:biorrisco});
quimico('qm_coleta', 'Coleta de amostras', 'macacao_quimico', traje('#ECECE6', '#E6C229', '#E9E9E4'),
  {chapeu:na_cabeca('capuz_quimico', '#ECECE6'), facial:mascara_('completa', '#2B2D33'), cinto:usa('#3A3D45'), bolsaPerna:usa(), luvas:luvaQ('#365CE6'), emblema:biorrisco});
quimico('qm_nivel_a', 'Nível máximo (laranja)', 'traje_encapsulado', traje('#D9641E', '#E8D44A', '#1F2023'),
  {chapeu:na_cabeca('capuz_encapsulado', '#D9641E'), facial:mascara_('completa', '#1B1C20'), mochila:veste('cilindro', '#C9CDD2'), luvas:luvaQ('#1F2023'), emblema:biorrisco});
quimico('qm_nivel_a_verde', 'Nível máximo (verde-limão)', 'traje_encapsulado', traje('#A9C83A', '#2B2D33', '#1F2023'),
  {chapeu:na_cabeca('capuz_encapsulado', '#A9C83A'), facial:mascara_('completa', '#1B1C20'), mochila:veste('cilindro', '#E6C229'), luvas:luvaQ('#2B2D33')});
quimico('qm_ruas', 'Desinfecção de ruas', 'macacao_quimico', traje('#E7772A', '#F1F1EC', '#26262A'),
  {chapeu:na_cabeca('capuz_quimico', '#E7772A'), facial:mascara_('respirador', '#4B4F55'), protetor:protege('#26262A'), mochila:veste('pulverizador', '#2E6B8F'), luvas:luvaQ('#26262A'), emblema:biorrisco});
quimico('qm_biosseguranca', 'Biossegurança (laboratório)', 'macacao_quimico', traje('#2F6FB3', '#E9EEF2', '#E9E9E4'),
  {chapeu:na_cabeca('capuz_quimico', '#2F6FB3'), facial:mascara_('completa', '#E4E6EA'), mochila:veste('cilindro', '#2B2D33'), luvas:luvaQ('#7B5BB5'), emblema:biorrisco});
quimico('qm_militar', 'Defesa química (militar)', 'macacao_quimico', traje('#5C6340', '#2E3322', '#1D1E1A'),
  {chapeu:na_cabeca('capuz_quimico', '#5C6340'), facial:mascara_('gas', '#1B1C20'), colete:veste('tatico', '#444B2E'), mochila:veste('cilindro', '#3E4430'),
   cinto:usa('#2E3322'), bolsaPerna:usa(), joelheiras:usa('#2E3322'), luvas:luvaQ('#1D1E1A')});
quimico('qm_linha_frente', 'Hospital: linha de frente', 'avental_epi', null,
  {chapeu:na_cabeca('touca', '#5E9BD1'), facial:mascara_('pff2', '#EDEDE8'), protetor:protege('#2E7BC4'), luvas:luva('simples', '#6FB6C9')});
quimico('qm_uti', 'Hospital: ala de isolamento', 'avental_epi', {camisa:'#E3C84E', calca:'#2F5D43', calcado:'#E9E9E4', detalhe:'#F1F1EC'},
  {chapeu:na_cabeca('touca', '#2F5D43'), facial:mascara_('pff2', '#EDEDE8'), protetor:protege('#7B5BB5'), luvas:luva('simples', '#7B5BB5')});
quimico('qm_triagem', 'Triagem na entrada', 'avental_epi', {camisa:'#8FBFA8', calca:'#3E5C86', calcado:'#2B2D33', detalhe:'#F1F1EC'},
  {chapeu:na_cabeca('touca', '#8FBFA8'), facial:mascara_('cirurgica', '#7FB8C9'), protetor:protege('#2B2D33'), luvas:luva('simples', '#E4E0D6')});
quimico('qm_pesquisa', 'Pesquisa (jaleco)', 'medico', null,
  {facial:mascara_('cirurgica', '#E4E6EA'), protetor:protege('#2E7BC4'), luvas:luva('simples', '#365CE6')});
quimico('qm_civil', 'Civil na pandemia', 'casual', null,
  {facial:mascara_('cirurgica', '#7FB8C9'), mochila:veste('urbana', '#2B2D33')});
quimico('qm_improvisado', 'Proteção improvisada (apocalipse)', 'sobrevivente', null,
  {chapeu:na_cabeca('gorro', '#4A4036'), facial:mascara_('respirador', '#59503F'), protetor:protege('#6E4A34'), mochila:veste('improvisada', '#6A5E48'),
   cinto:usa('#5A4330'), joelheiras:usa('#4A4036'), luvas:luvaQ('#7A5A2A')});

/* "Tirar equipamentos" também retira o protetor facial e a cobertura do rosto */
Object.assign(KITS.nada.muda, {protetor:{usa:false}, facial:{estilo:'nenhum'}});
