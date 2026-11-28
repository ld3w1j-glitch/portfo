/* Polícia Militar de Minas Gerais, versão em voxel para o jogo. Carregado depois de faccoes.js.
   As cores seguem fotos públicas (farda cáqui, equipamento preto). Não é reprodução oficial:
   o brasão e os distintivos da corporação NÃO são copiados, e as variações por unidade são aproximações. */

/* ================================================================ letras em pixels (5 de altura; o M é mais largo), usadas no corpo e no cenário */
const LETRAS_PM = {
  P:['110', '101', '110', '100', '100'], O:['111', '101', '101', '101', '111'], L:['100', '100', '100', '100', '111'], I:['111', '010', '010', '010', '111'],
  C:['111', '100', '100', '100', '111'], A:['010', '101', '111', '101', '101'], M:['10001', '11011', '10101', '10001', '10001'], T:['111', '010', '010', '010', '010'],
  R:['110', '101', '110', '101', '101'], G:['111', '100', '101', '101', '111'], D:['110', '101', '101', '101', '110'], E:['111', '100', '110', '100', '111'],
  N:['1001', '1101', '1011', '1001', '1001'], S:['111', '100', '111', '001', '111'],
};
const larguraLetra = ch => LETRAS_PM[ch] ? LETRAS_PM[ch][0].length : 2;
const larguraTexto = (txt, t) => ([...txt].reduce((s, ch) => s + larguraLetra(ch) + 1, 0) - 1) * t;
/* caixa(u0, u1, v0, v1): u cresce para a direita de quem olha, v para cima; o texto fica centrado em u = 0, com a base em v = 0 */
function escrevePm(txt, t, caixa){
  let u = -larguraTexto(txt, t) / 2;
  for (const ch of txt){
    (LETRAS_PM[ch] || []).forEach((linha, l) => {
      for (let i = 0; i < linha.length; ){
        if (linha[i] !== '1'){ i++; continue; }
        let f = i; while (f < linha.length && linha[f] === '1') f++;
        caixa(u + i * t, u + f * t, (4 - l) * t, (5 - l) * t); i = f;
      }
    });
    u += (larguraLetra(ch) + 1) * t;
  }
}
/* texto no corpo: faces da frente (-y) e das costas (+y) de uma peça */
const textoFrente = (cx, peca, txt, t, x, y, z, mat) => escrevePm(txt, t, (a, b, c, d) => cx(peca, x + a, x + b, y - .09, y, z + c, z + d, mat));
const textoCostas = (cx, peca, txt, t, x, y, z, mat) => escrevePm(txt, t, (a, b, c, d) => cx(peca, x - b, x - a, y, y + .09, z + c, z + d, mat));

/* ================================================================ a farda */
ROUPAS.pm_farda = {nome:'Farda cáqui (PM)', cores:{camisa:['Gandola', '#AF9772'], calca:['Calça', '#A68E6A'], calcado:['Coturno', '#1B1B1D'], detalhe:['Cinto e detalhes', '#18181A']}};
ROUPAS.pm_manga_curta = {nome:'Farda cáqui de manga curta (PM)', cores:structuredClone(ROUPAS.pm_farda.cores)};
function pintaFardaPm(p, mangaCurtaPm){
  const c = calcado(p, 4); if (c) return c;
  if (p.peca === 'quadril') return p.k === p.tam[2] - 1 ? (p.frente && p.meio < 1 ? 'metal_escuro' : 'detalhe') : 'calca';
  if (ehCoxa(p.peca)) return (p.n[0] !== 0 && p.topo === 5) ? 'calca_sombra' : 'calca';
  if (ehCanela(p.peca)) return p.k === 4 ? 'calca_escuro' : 'calca';
  if (p.peca === 'torax'){
    if (p.frente && p.topo === 0 && p.meio < 1) return null;
    if (p.frente && p.meio < .6) return 'camisa_sombra';                                          /* carcela dos botões */
    if (p.frente && p.meio > 1.5 && p.meio < 5 && p.k === 6) return 'camisa_escuro';              /* tampas dos bolsos */
    if (p.frente && p.meio > 1.5 && p.meio < 5 && p.k >= 3 && p.k < 6) return 'camisa_sombra';
    if (p.n[2] > 0 && p.meio > 3 && p.meio < 5) return 'camisa_sombra';
    return 'camisa';
  }
  if (p.peca === 'cintura') return (p.frente && p.meio < .6) ? 'camisa_sombra' : 'camisa';
  if (ehBraco(p.peca)) return mangaCurtaPm ? (p.topo < 7 ? (p.topo === 6 ? 'camisa_sombra' : 'camisa') : null) : 'camisa';
  if (!mangaCurtaPm && ehAnte(p.peca)) return p.k === 0 ? 'camisa_sombra' : 'camisa';
  return null;
}
PINTURAS.pm_farda = p => pintaFardaPm(p, false);
PINTURAS.pm_manga_curta = p => pintaFardaPm(p, true);

/* bandeira de Minas Gerais na manga e identificação "PM" na outra; no peito, tarjeta e um distintivo genérico */
function insigniasPm(cx){
  const L = ESTRUTURA.braco_e.tam[0];
  cx('braco_e', L, L + .3, .35, 3.85, 7, 9.7, 'branco_roupa');
  [[.75, 3.45, 7.35, 7.85], [1.1, 3.1, 7.85, 8.35], [1.45, 2.75, 8.35, 8.85], [1.8, 2.4, 8.85, 9.35]].forEach(([a, b, z0, z1]) => cx('braco_e', L + .3, L + .42, a, b, z0, z1, 'pm_vermelho'));
  cx('braco_d', -.3, 0, .35, 3.85, 7.2, 9.4, 'pm_preto');
  escrevePm('PM', .38, (a, b, c, d) => cx('braco_d', -.4, -.3, 2.1 - b, 2.1 - a, 7.35 + c, 7.35 + d, 'pm_texto'));
  cx('torax', 2.2, 5.4, -.28, .05, 7.35, 8.35, 'pm_preto'); for (let x = 2.55; x < 5; x += .55) cx('torax', x, x + .3, -.36, -.28, 7.65, 8.05, 'pm_texto');
  cx('torax', 9.4, 11.2, -.28, .05, 6.9, 8.7, 'pm_preto'); cx('torax', 9.75, 10.85, -.38, -.28, 7.25, 8.45, 'metal');
  for (const x of [2.4, 10]) cx('torax', x, x + 1.6, .6, 6, 11, 11.3, 'pm_preto');                 /* platinas */
}
for (const id of ['pm_farda', 'pm_manga_curta']) EXTRAS_DA_ROUPA[id] = cx => {
  insigniasPm(cx);
  for (const [s, x0, x1] of [['coxa_d', -.7, 0], ['coxa_e', 5, 5.7]]){                            /* bolsos cargo */
    cx(s, x0, x1, 2, 6, 4.2, 7.4, 'calca'); cx(s, x0 - .08, x1 + .08, 1.9, 6.1, 6.8, 7.8, 'calca_sombra');
  }
};

/* ================================================================ equipamentos */
Object.assign(CHAPEUS, {bone_pm:'Boné PMMG', moto_pm:'Capacete de motopolicial', capacete_moto:'Capacete de moto'});
Object.assign(COLETES, {policial:'Policial (PM)', transito:'Refletivo de trânsito'});
Object.assign(ESPESSURA, {policial:[1.15, 1.2], transito:[.55, .55]});

function bonePm(c, cx){
  const C = 'cabeca';
  camada(cx, C, .65, 13.35, -.55, 13.45, 15.5, 17.4, 'chapeu', false, .7);
  camada(cx, C, 1.2, 12.8, -.45, 13.2, 17.4, 19.3, 'chapeu', false, .9);
  camada(cx, C, 2.4, 11.6, .1, 11.9, 19.3, 20.75, 'chapeu', false, 1);
  cx(C, 6.5, 7.5, 5.5, 6.5, 20.75, 21.15, 'chapeu_escuro');
  cx(C, 2.4, 11.6, -3.2, -.55, 15.55, 16.15, 'chapeu_sombra'); cx(C, 3.4, 10.6, -4.3, -3.2, 15.45, 16, 'chapeu_sombra');
  cx(C, 2.1, 11.9, -.8, -.45, 16.4, 19.5, 'chapeu');
  textoFrente(cx, C, 'PMMG', .48, 7, -.8, 16.75, 'pm_texto');
  cx(C, 4.6, 9.4, 13.45, 13.7, 15.7, 16.3, 'preto'); fivela(cx, C, 7, 13.7, 16, 1);
}
function capaceteMotoPm(c, cx, semPm){
  const C = 'cabeca';
  camada(cx, C, -.8, 14.8, -1.3, 14.9, 14.9, 18.4, 'chapeu', false, 1.6);
  camada(cx, C, -.2, 14.2, -.8, 14.3, 18.4, 20.8, 'chapeu', false, 1.8);
  camada(cx, C, 1.6, 12.4, .8, 12.6, 20.8, 22.2, 'chapeu', false, 1.8);
  for (const [a, b] of [[-.8, .5], [13.5, 14.8]]) cx(C, a, b, 4.6, 14.4, 3.6, 14.9, 'chapeu');      /* laterais e nuca */
  cx(C, .5, 13.5, 13.4, 14.8, 3.6, 14.9, 'chapeu_sombra');
  cx(C, 1, 13, -1.9, -1.25, 15.9, 18.2, 'visor'); cx(C, 2, 4.4, -1.98, -1.9, 17.3, 17.65, 'brilho');  /* viseira levantada */
  for (const [a, b, f] of [[-1, -.8, -1], [14.8, 15, 1]]){ cx(C, a, b, 3.4, 8.2, 8, 12.8, 'pm_preto'); cx(C, a, b, -.2, 13.4, 16.4, 17.2, semPm ? 'chapeu_claro' : 'pm_vermelho'); }
  if (!semPm) textoCostas(cx, C, 'PM', .75, 7, 14.9, 10.5, 'pm_preto');
  correiaQueixo(cx);
}

function coletePolicial(c, cx){
  const T = 'torax', camo = c.colete.camo;
  cx(T, 2.15, 11.85, -1.05, 1.1, .45, 8.1, 'colete', camo); cx(T, 3, 11, -1, .1, 8.1, 9.5, 'colete', camo);
  cx(T, 2.15, 11.85, 6.9, 9.1, .45, 8.1, 'colete', camo); cx(T, 3, 11, 7.9, 9.05, 8.1, 10, 'colete', camo);
  for (const x of [2.55, 9.35]){ cx(T, x, x + 2.1, -.95, .05, 9.3, 11.35, 'colete_sombra', camo); cx(T, x, x + 2.1, .05, 7.9, 10.95, 11.5, 'colete_sombra', camo); cx(T, x, x + 2.1, 7.9, 8.95, 9.8, 11.45, 'colete_sombra', camo); }
  for (const [x0, x1] of [[1.25, 2.2], [11.8, 12.75]]){ cx(T, x0, x1, .3, 7.7, .5, 4.6, 'colete_sombra', camo); for (const z of [1.1, 2.5, 3.9]) cx(T, x0 < 5 ? x0 - .12 : x1, x0 < 5 ? x0 : x1 + .12, .5, 7.5, z, z + .35, 'colete_escuro'); }
  for (const x of [2.4, 5.6, 8.8]) bolso(cx, T, x, x + 2.8, -1.05, .95, -1, .55, 3.9, 'colete', camo);
  /* identificação na frente */
  cx(T, 2.7, 11.3, -1.2, -1.05, 4.9, 7.2, 'pm_preto'); textoFrente(cx, T, 'POLICIA', .3, 7, -1.2, 5.3, 'pm_texto'); cx(T, 7.85, 8.15, -1.29, -1.2, 6.9, 7.12, 'pm_texto');
  cx(T, 3.1, 10.9, -1.28, -1.2, 5.02, 5.2, 'pm_vermelho');
  /* câmera corporal, rádio com cabo e antena, lanterna */
  cx(T, 6.1, 7.9, -1.75, -1.05, 7.5, 9.1, 'pm_preto'); cx(T, 6.6, 7.4, -1.95, -1.75, 8, 8.8, 'visor'); cx(T, 7.45, 7.75, -1.85, -1.75, 8.7, 9, 'pm_luz_vermelha');
  cx(T, 9.3, 11, -2, -1.05, 7.4, 9.6, 'pm_preto'); cx(T, 9.55, 10.75, -2.15, -2, 8.5, 9.3, 'visor'); cx(T, 10.45, 10.8, -1.75, -1.4, 9.6, 13.6, 'metal_escuro'); cx(T, 10.37, 10.88, -1.83, -1.32, 13.6, 14, 'preto');
  cx(T, 3.1, 4.1, -1.7, -1.05, 7.4, 9.4, 'pm_preto'); cx(T, 3.3, 3.9, -1.62, -1.12, 9.4, 9.75, 'lanterna');
  /* costas */
  cx(T, 2.4, 11.6, 9.1, 9.28, 3.4, 7.7, 'pm_preto'); textoCostas(cx, T, 'POLICIA', .33, 7, 9.28, 5.75, 'pm_texto'); cx(T, 5.85, 6.18, 9.28, 9.37, 7.45, 7.68, 'pm_texto');
  textoCostas(cx, T, 'MILITAR', .3, 7, 9.28, 3.85, 'pm_texto'); cx(T, 3, 11, 9.28, 9.35, 5.5, 5.65, 'pm_vermelho');
  molle(cx, T, 2.5, 11.5, 9.1, 1, [1, 2.2], 'colete');
}
function coleteTransito(c, cx){
  const T = 'torax';
  for (const [y0, y1] of [[-.55, .05], [7.95, 8.55]]){
    cx(T, 1.8, 12.2, y0, y1, .2, 8.4, 'pm_limao'); for (const x of [2.5, 9.4]) cx(T, x, x + 2.1, y0, y1, 8.4, 11.4, 'pm_limao');
    const [a, b] = y0 < 0 ? [y0 - .1, y0] : [y1, y1 + .1];
    for (const z of [1.2, 3.1]) cx(T, 1.8, 12.2, a, b, z, z + .75, 'pm_refletivo');
    for (const x of [3, 10]) cx(T, x, x + .9, a, b, 8, 11.2, 'pm_refletivo');
  }
  for (const x of [2.5, 9.4]) cx(T, x, x + 2.1, .05, 7.95, 11, 11.45, 'pm_limao');
  for (const x of [1.35, 12.15]) cx(T, x, x + .5, -.2, 8.2, .2, 4.6, 'pm_limao');
  cx(T, 3, 11, -.72, -.55, 4.6, 6.9, 'pm_preto'); textoFrente(cx, T, 'POLICIA', .28, 7, -.72, 5, 'pm_texto');
  cx(T, 2.4, 11.6, 8.55, 8.75, 5, 7.8, 'pm_preto'); textoCostas(cx, T, 'POLICIA', .33, 7, 8.75, 5.55, 'pm_texto');
}
function cinturaoPm(c, cx){
  const Q = 'quadril';
  anel(cx, Q, -.45, 12.45, .5, 7.5, 3.1, 4.8, 'pm_preto', false, .65);
  cx(Q, 5.1, 6.9, .2, .5, 3.25, 4.65, 'metal_escuro'); cx(Q, 5.6, 6.4, .08, .2, 3.6, 4.3, 'metal');
  for (const x of [2.5, 3.7]) bolso(cx, Q, x, x + 1.05, .5, .8, -1, 2.2, 4.9, 'pm_preto');       /* porta-carregadores */
  bolso(cx, Q, 7.6, 9.9, .5, .75, -1, 2.3, 4.6, 'pm_preto');                                      /* porta-algemas */
  cx(Q, 10.2, 11.5, -.45, .5, 1.9, 4.9, 'pm_preto'); cx(Q, 10.55, 11.15, -.2, .35, 4.9, 6.1, 'preto');   /* espargidor */
  /* coldre fechado na perna direita do boneco, com presilhas */
  const X = 'coxa_d';
  cx(X, -1.15, -.1, 2.1, 5.7, 4.6, 8.9, 'pm_preto'); cx(X, -1.3, -1.15, 2.5, 5.3, 5, 8.2, 'preto');
  cx(X, -1.05, -.25, 2.5, 4.9, 8.9, 10.6, 'metal_escuro'); cx(X, -1, -.3, 4.4, 5.8, 9.7, 11, 'preto'); cx(X, -1.2, -.15, 2.3, 5.5, 8.5, 9.3, 'pm_preto');
  cx(X, -.6, -.2, 3.3, 4.4, 10.9, 12.4, 'pm_preto');
  for (const z of [5.2, 7.8]) anel(cx, X, -.3, 5.3, 1.7, 6.3, z, z + .5, 'preto', false, .28);
  cx(Q, 1, 3.4, 7.5, 9, 1.4, 4.7, 'pm_preto'); cx(Q, 1.9, 2.5, 8, 8.8, 4.7, 8.2, 'metal_escuro');   /* rádio reserva nas costas */
}
function tonfa(c, cx){
  const [w, d] = ESTRUTURA.mao_d.tam, x = w / 2 - .5;
  cx('mao_d', x, x + 1, -7.5, d + 3, 1, 2, 'preto'); cx('mao_d', x - .1, x + 1.1, -7.9, -7.5, .9, 2.1, 'metal_escuro');
  cx('mao_d', x + .05, x + .95, .6, 1.6, 2, 4.4, 'preto'); cx('mao_d', x - .05, x + 1.05, d + 3, d + 3.35, .95, 2.05, 'metal_escuro');
}
function escudoPm(c, cx){
  const P = 'antebraco_e', [w, d, h] = ESTRUTURA[P].tam, x0 = w / 2 - 4.5, x1 = w / 2 + 5.5, z0 = h - 17, z1 = h + 5;
  const yf = -7;                                                                /* bem à frente, para não entrar no colete */
  cx(P, x0, x1, yf, yf + .6, z0, z1, 'visor');
  for (const [a, b] of [[x0 - .35, x0 + .25], [x1 - .25, x1 + .35]]) cx(P, a, b, yf - .2, yf + .7, z0, z1, 'pm_preto');
  for (const [a, b] of [[z0 - .35, z0 + .25], [z1 - .25, z1 + .35]]) cx(P, x0 - .35, x1 + .35, yf - .2, yf + .7, a, b, 'pm_preto');
  const m = (x0 + x1) / 2, zm = z0 + 12;
  cx(P, x0 + .6, x1 - .6, yf - .15, yf, zm - .5, zm + 2.2, 'pm_preto'); textoFrente(cx, P, 'POLICIA', .32, m, yf - .15, zm, 'pm_texto');
  cx(P, x0 + 1, x0 + 1.5, yf - .08, yf, z1 - 6, z1 - 1.5, 'brilho'); cx(P, x0 + 2, x0 + 2.3, yf - .08, yf, z1 - 5, z1 - 2.5, 'brilho');
  cx(P, w / 2 - .6, w / 2 + .6, yf + .6, 0, h / 2 - .6, h / 2 + .6, 'preto');    /* empunhadura */
}
/* capacete fechado de moto: casco arredondado em degraus, queixeira, viseira levantada e faixa no alto */
function capaceteDeMoto(c, cx){
  const C = 'cabeca';
  camada(cx, C, -.7, 14.7, -1.1, 14.9, 13.9, 17.2, 'chapeu', false, 2.6);
  camada(cx, C, -.25, 14.25, -.7, 14.4, 17.2, 19.4, 'chapeu', false, 2.8);
  camada(cx, C, .8, 13.2, .3, 13.3, 19.4, 21.1, 'chapeu', false, 2.8);
  camada(cx, C, 2.6, 11.4, 2, 11.6, 21.1, 22.2, 'chapeu', false, 2.4);
  for (const [a, b] of [[-.7, .45], [13.55, 14.7]]){                                   /* laterais: mais curtas na frente, descendo para a nuca */
    cx(C, a, b, 6.2, 13.4, 5.6, 13.9, 'chapeu'); cx(C, a, b, 8.4, 12.6, 3.6, 5.6, 'chapeu_sombra'); cx(C, a, b, 3.2, 6.2, 9.4, 13.9, 'chapeu');
    cx(C, a < 0 ? a - .25 : b, a < 0 ? a : b + .25, 5.4, 8.8, 10.4, 13.2, 'preto');    /* dobradiça da viseira */
  }
  camada(cx, C, .3, 13.7, 11.9, 15.1, 5.2, 13.9, 'chapeu', false, 1.2);
  cx(C, 2, 12, 12.4, 14.4, 3.6, 5.2, 'chapeu_sombra');
  cx(C, .1, 13.9, -2.1, -.9, 2.2, 4.9, 'chapeu'); cx(C, 1.4, 12.6, -2.45, -2.1, 2.5, 4.4, 'chapeu_sombra');               /* queixeira */
  for (const [a, b] of [[-.7, .45], [13.55, 14.7]]) cx(C, a, b, -1.6, 6.2, 2.4, 5.4, 'chapeu');
  for (let x = 4.6; x < 9.4; x += 1.2) cx(C, x, x + .5, -2.55, -2.45, 2.9, 3.9, 'preto');
  camada(cx, C, .5, 13.5, -2.1, -.9, 14.6, 17.1, 'visor', false, .8); cx(C, 2, 4.6, -2.18, -2.1, 16.1, 16.45, 'brilho');    /* viseira levantada */
  cx(C, 6.1, 7.9, -1.2, 15.15, 17.15, 17.4, 'chapeu_claro'); cx(C, 6.1, 7.9, 1.4, 12.4, 22.2, 22.4, 'chapeu_claro');
  cx(C, 6.1, 7.9, 12.3, 14.5, 19.4, 19.65, 'chapeu_claro');
}

const equiparSemPm = equipar;
equipar = function(c, cx){
  equiparSemPm(c, cx);
  if (c.chapeu.estilo === 'bone_pm') bonePm(c, cx);
  if (c.chapeu.estilo === 'moto_pm') capaceteMotoPm(c, cx);
  if (c.chapeu.estilo === 'capacete_moto') capaceteDeMoto(c, cx);
  if (c.colete.estilo === 'policial') coletePolicial(c, cx);
  if (c.colete.estilo === 'transito') coleteTransito(c, cx);
  if (c.cinturao?.usa) cinturaoPm(c, cx);
  if (c.tonfa?.usa && !(c.arma && c.arma.estilo !== 'nenhum')) tonfa(c, cx);
  if (c.escudo?.usa) escudoPm(c, cx);
};

/* ================================================================ conjuntos */
GRUPOS_KITS.policia = 'Polícia Militar MG';
for (const k of Object.values(KITS)) Object.assign(k.muda, {cinturao:{usa:false}, tonfa:{usa:false}, escudo:{usa:false}, ...k.muda});
Object.assign(KITS.nada.muda, {cinturao:{usa:false}, tonfa:{usa:false}, escudo:{usa:false}});
const PRETO_PM = '#1C1D20', CAQUI_PM = '#AF9772';
const pm = (id, nome, roupa_, cores_, extras) => conjunto(id, 'policia', nome, roupa_, cores_, {cinturao:usa(), tonfa:usa(), escudo:{usa:false}, ...extras});
const colPm = () => veste('policial', PRETO_PM);
const bone = () => na_cabeca('bone_pm', PRETO_PM);
const boina = () => na_cabeca('boina', '#141416');
const joelho = () => usa(PRETO_PM);
const luvaPm = estilo => luva(estilo, PRETO_PM);

pm('pm_radio', 'Radiopatrulha', 'pm_farda', null, {chapeu:bone(), colete:colPm()});
pm('pm_ape', 'Policiamento a pé', 'pm_manga_curta', null, {chapeu:boina(), colete:colPm()});
pm('pm_tatico', 'Tático Móvel', 'pm_farda', null, {chapeu:boina(), colete:colPm(), joelheiras:joelho(), luvas:luvaPm('taticas'), bolsaPerna:usa()});
pm('pm_rocca', 'ROCCA (com cães)', 'pm_farda', null, {chapeu:bone(), colete:colPm(), joelheiras:joelho(), luvas:luvaPm('taticas'), mochila:veste('urbana', PRETO_PM), tonfa:{usa:false}});
pm('pm_moto', 'Motopatrulhamento', 'pm_farda', null, {chapeu:na_cabeca('moto_pm', '#E7E5DE'), colete:colPm(), joelheiras:joelho(), cotoveleiras:usa(), luvas:luvaPm('taticas')});
pm('pm_transito', 'Policiamento de trânsito', 'pm_manga_curta', null, {chapeu:bone(), colete:veste('transito', '#C8E02A'), luvas:luva('simples', '#EDEDE8')});
pm('pm_choque', 'Controle de distúrbios', 'pm_farda', null, {chapeu:na_cabeca('viseira', '#17181B'), colete:colPm(), ombreiras:usa(), joelheiras:joelho(), cotoveleiras:usa(), luvas:luvaPm('taticas'), tonfa:usa(), escudo:usa()});
pm('pm_ambiente', 'Meio Ambiente', 'pm_farda', tecido('#59663C', '#505C35', '#1B1B1D', '#18181A'), {chapeu:na_cabeca('selva', '#59663C', {camo:true}), colete:veste('assalto', '#2C3322'), mochila:veste('militar', '#434E2E')});
pm('pm_rural', 'Patrulha rural', 'pm_farda', null, {chapeu:na_cabeca('selva', CAQUI_PM), colete:colPm(), mochila:veste('urbana', '#7C6A4C'), joelheiras:joelho(), luvas:luvaPm('simples')});
pm('pm_comando', 'Oficial de comando', 'pm_farda', null, {chapeu:boina(), tonfa:{usa:false}});
pm('pm_especial', 'Operações especiais (apoio da capital)', 'pm_farda', tecido('#1E2024', '#1B1D21', '#101012', '#0C0C0E'), {chapeu:na_cabeca('especial', '#1C1E22', {visao:true, fones:true}), facial:rosto_eq('balaclava'), colete:colPm(), mochila:veste('militar', '#1C1E22'), joelheiras:joelho(), cotoveleiras:usa(), ombreiras:usa(), luvas:luvaPm('taticas'), tonfa:{usa:false}});
pm('pm_longa', 'PM no apocalipse (mochila grande)', 'pm_farda', null, {chapeu:na_cabeca('tatico', '#8D7756', {fones:true, goggles:true}), colete:colPm(), mochila:veste('cargueira', '#6F5E43'), joelheiras:joelho(), cotoveleiras:usa(), luvas:luvaPm('taticas'), bolsaPerna:usa(), tonfa:{usa:false}});
