/* Unidade especial e facções do jogo. Tudo aqui é inventado:
   nomes e emblemas não representam organizações, polícias ou forças reais. */

/* ================================================================ emblemas (pixel art 9 x 9; 1 = símbolo) */
const EMBLEMAS = {
  nenhum:{nome:'Sem emblema'},
  mantiqueira:{nome:'Força Mantiqueira', fundo:'#17191D', simbolo:'#D9C27A', px:['000010000','000111000','000111000','001101100','011000110','110010011','100111001','001101100','011000110']},
  mandu:{nome:'Guarda do Mandu', fundo:'#12414B', simbolo:'#D8C79A', px:['000010000','000111000','001111100','001111100','000111000','000000000','110011001','001100110','000000000']},
  tropeiros:{nome:'Os Tropeiros', fundo:'#4A2E1C', simbolo:'#E0A84B', px:['001111100','011000110','110000011','100000001','100000001','110000011','110000011','111000111','010000010']},
  asfalto:{nome:'Donos do Asfalto', fundo:'#17171A', simbolo:'#F2C230', px:['001010100','001000100','001010100','011000110','010010010','010000010','110010011','100000001','100010001']},
  serra:{nome:'Irmandade da Serra', fundo:'#1F4A30', simbolo:'#E9EDE4', px:['000000000','000010000','000111000','001101100','011000110','110010011','100111001','111111111','000000000']},
  safra:{nome:'Safra Negra', fundo:'#1C1210', simbolo:'#B5652D', px:['000111000','001110100','011101110','011011110','011011110','011110110','011101110','001011100','000111000']},
  viralatas:{nome:'Vira-Latas do Jardim', fundo:'#4C5058', simbolo:'#F16A32', px:['001000100','011101110','001000100','100000001','110111011','001111100','011111110','011111110','001101100']},
};
const NOMES_EMBLEMA = Object.fromEntries(Object.entries(EMBLEMAS).map(([k, v]) => [k, v.nome]));
const ROSTOS_EQ = {nenhum:'Nada', balaclava:'Balaclava', gas:'Máscara de gás'};

/* o emblema desenhado numa face plana: caixa(u0, u1, v0, v1, camada, material) */
function pintaEmblema(id, caixa, tam){
  const e = EMBLEMAS[id]; if (!e || !e.px) return;
  caixa(-tam * .6, tam * 9.6, -tam * .6, tam * 9.6, 0, 'emb_fundo');
  e.px.forEach((linha, l) => {
    for (let i = 0; i < 9; ){                                           /* junta os pixels vizinhos da linha */
      if (linha[i] !== '1'){ i++; continue; }
      let f = i; while (f < 9 && linha[f] === '1') f++;
      caixa(i * tam, f * tam, (8 - l) * tam, (9 - l) * tam, 1, 'emb_simbolo'); i = f;
    }
  });
}

/* ================================================================ equipamentos novos */
Object.assign(CHAPEUS, {especial:'Capacete de operações especiais', viseira:'Capacete com viseira'});
CAPACETES.push('especial', 'viseira');
COLETES.pesado = 'Tático pesado';
ESPESSURA.pesado = [1.5, 1.45];
MOCHILAS.cargueira = 'Cargueira militar grande';

function cascoEspecial(c, cx){
  const h = c.chapeu.estilo, camo = c.chapeu.camo, C = 'cabeca';
  camada(cx, C, -.05, 14.05, -1.2, 14, 14.3, 15.2, 'chapeu_sombra', camo, 1.3);
  camada(cx, C, .15, 13.85, -1.05, 13.85, 15.2, 18.7, 'chapeu', camo, 1.1);
  camada(cx, C, .9, 13.1, -.55, 13.3, 18.7, 20.35, 'chapeu', camo, 1.4);
  camada(cx, C, 2.2, 11.8, .6, 12.2, 20.35, 21.45, 'chapeu', camo, 1.4);
  camada(cx, C, -.1, 14.1, -1.3, 14.05, 15.05, 15.45, 'chapeu_escuro', false, 1.3);
  /* abas que descem protegendo atrás das orelhas e a nuca */
  for (const [a, b] of [[-.35, .45], [13.55, 14.35]]){ cx(C, a, b, 8.6, 13.2, 9.2, 15.2, 'chapeu_sombra', camo); cx(C, a, b, 2.2, 8.6, 12.4, 15.2, 'chapeu', camo); }
  cx(C, 1, 13, 13.4, 14.25, 9.6, 15.2, 'chapeu_sombra', camo);
  for (const [a, b, fora] of [[-.75, -.3, -1], [14.3, 14.75, 1]]){                      /* trilhos e lanterna lateral */
    cx(C, a, b, 2, 10.6, 15.5, 16.55, 'preto');
    for (let y = 2.7; y < 10; y += 1.5) cx(C, fora < 0 ? a - .12 : b, fora < 0 ? a : b + .12, y, y + .7, 15.75, 16.3, 'metal_escuro');
    cx(C, a - .1, b + .1, -.3, 2.4, 15.6, 16.9, 'preto'); cx(C, a, b, -.75, -.3, 15.85, 16.65, 'lanterna');
  }
  cx(C, 5.3, 8.7, -1.6, -1.05, 16.8, 19.1, 'preto'); cx(C, 6.2, 7.8, -1.78, -1.6, 17.5, 18.5, 'metal_escuro');
  cx(C, 4.9, 9.1, 2.8, 7.2, 21.45, 21.65, 'velcro'); for (const x of [.75, 12.8]) cx(C, x, x + .45, 3.6, 8, 18.75, 18.95, 'velcro');
  cx(C, 3.8, 10.2, 13.9, 15.35, 15.8, 18.4, 'preto'); cx(C, 4.4, 9.6, 15.35, 15.55, 16.3, 17.9, 'chapeu_escuro'); cx(C, 6.7, 7.3, 15.5, 15.65, 16.8, 17.3, 'luz');
  if (h === 'especial' && c.chapeu.visao){                                              /* visão noturna de quatro tubos */
    cx(C, 6.3, 7.7, -2.3, -1.6, 17.9, 20.2, 'preto'); cx(C, 1.8, 12.2, -2.7, -2.05, 19.7, 20.4, 'preto');
    for (const x of [1.2, 3.95, 7.95, 10.7]){
      cx(C, x, x + 2.1, -4, -2.2, 20.1, 22.1, 'preto'); cx(C, x + .25, x + 1.85, -4.65, -4, 20.35, 21.85, 'metal_escuro');
      cx(C, x + .5, x + 1.6, -4.8, -4.65, 20.6, 21.6, 'lente_verde'); cx(C, x + .65, x + .95, -4.86, -4.8, 21.15, 21.45, 'brilho');
    }
  }
  if (h === 'viseira'){                                                                 /* viseira balística abaixada */
    cx(C, .5, 13.5, -2.35, -1.55, 14.2, 15, 'preto');
    cx(C, 1.1, 12.9, -2.45, -2.15, 13.45, 14.2, 'visor'); cx(C, 1.1, 12.9, -2.45, -2.15, 2.4, 3.15, 'visor');
    for (const [a, b] of [[1.1, 1.85], [12.15, 12.9]]) cx(C, a, b, -2.45, -2.15, 3.15, 13.45, 'visor');
    for (const [a, z0, z1] of [[2.5, 10.2, 13], [3.5, 11.4, 13], [10.8, 4, 6.2]]) cx(C, a, a + .35, -2.52, -2.45, z0, z1, 'brilho');
  }
  if (c.chapeu.goggles && h === 'especial'){
    camada(cx, C, -.4, 14.4, -1.35, 14.3, 15.85, 16.35, 'preto', false, 1.2);
    cx(C, 1.9, 12.1, -2.1, -1.3, 15.35, 17.35, 'preto');
    for (const [a, b] of [[2.35, 6.7], [7.3, 11.65]]){ cx(C, a, b, -2.3, -2.1, 15.7, 17, 'visor'); cx(C, a + .4, a + 1.7, -2.37, -2.3, 16.5, 16.75, 'brilho'); }
  }
  if (c.chapeu.fones){
    for (const s of [-1, 1]){
      const x0 = s < 0 ? -1.35 : 13.1, x1 = s < 0 ? .9 : 15.35;
      cx(C, x0, x1, 4.2, 8.8, 6.9, 11.7, 'preto'); cx(C, s < 0 ? x0 - .35 : x1, s < 0 ? x0 : x1 + .35, 5, 8, 7.6, 11, 'chapeu_sombra', camo);
      cx(C, s < 0 ? -.75 : 14.35, s < 0 ? -.35 : 14.75, 5.9, 7.1, 11.7, 15.6, 'metal_escuro');
    }
    cx(C, -1.65, -1.3, 1, 5, 7.4, 7.75, 'preto'); cx(C, -1.65, 2, -1.2, -.85, 5.4, 5.75, 'preto'); cx(C, -1.65, -1.3, -1.2, 1.3, 5.4, 7.75, 'preto'); cx(C, 1.8, 3.6, -1.4, -.75, 5.1, 6.05, 'metal_escuro');
  }
  correiaQueixo(cx);
}

function balaclava(c, cx){
  const C = 'cabeca', m = 'balaclava';
  /* rosto coberto, deixando só a faixa dos olhos */
  cx(C, .85, 13.15, -.5, .2, 11.9, 17.2, m); cx(C, .85, 13.15, -.5, .2, 3, 8.6, m); cx(C, .85, 13.15, -.5, .2, 8.6, 9, m + '_sombra'); cx(C, .85, 13.15, -.5, .2, 11.6, 11.9, m + '_sombra');
  for (const [a, b] of [[.85, 1.75], [12.25, 13.15]]) cx(C, a, b, -.5, .2, 9, 11.6, m);
  for (const [a, b] of [[.7, 1.25], [12.75, 13.3]]) cx(C, a, b, .2, 13.15, 3, 17.2, m);
  cx(C, 1.25, 12.75, 12.75, 13.3, 3, 17.2, m); cx(C, 1.2, 12.8, .2, 12.8, 16.95, 17.45, m);
  cx(C, 2.4, 11.6, 1.2, 11.6, 17.45, 20.25, m); cx(C, 3.4, 10.6, 2.2, 10.6, 20.25, 20.6, m + '_sombra');
  cx(C, 3.2, 10.8, -.5, 3.5, 1.1, 3, m + '_sombra'); cx(C, 4.2, 9.8, 3.5, 10, 1.1, 2.9, m + '_sombra');
  cx(C, 6.3, 7.7, -.9, -.5, 7.2, 8.8, m);
}
function mascaraGas(c, cx){
  const C = 'cabeca';
  cx(C, 1.4, 12.6, -.85, -.2, 2.6, 12.7, 'preto'); cx(C, 2.2, 11.8, -1.3, -.85, 3.2, 8.9, 'borracha_eq');
  for (const [a, b] of [[2, 5.9], [8.1, 12]]){ cx(C, a, b, -1.25, -.85, 9.2, 12.2, 'metal_escuro'); cx(C, a + .4, b - .4, -1.45, -1.25, 9.55, 11.85, 'visor'); cx(C, a + .75, a + 1.65, -1.52, -1.45, 11.15, 11.5, 'brilho'); }
  cx(C, 5.2, 8.8, -2.5, -1.3, 4.2, 7.4, 'preto'); cx(C, 5.7, 8.3, -2.75, -2.5, 4.7, 6.9, 'metal_escuro');
  for (let z = 5; z < 6.8; z += .55) cx(C, 5.95, 8.05, -2.85, -2.75, z, z + .22, 'preto');
  cx(C, 1.9, 4.6, -2.7, -.9, 3, 5.6, 'borracha_eq'); cx(C, 2.1, 4.4, -2.95, -2.7, 3.2, 5.4, 'metal');
  for (const [a, b] of [[.65, 1.4], [12.6, 13.35]]) for (const z of [5, 10.6]) cx(C, a, b, -.5, 12.6, z, z + .7, 'preto');
  cx(C, 1, 13, 12.6, 13.3, 5, 11.3, 'preto'); cx(C, 6.3, 7.7, -.9, 12.6, 20, 20.4, 'preto');
}

function coletePesado(c, cx){
  const camo = c.colete.camo, T = 'torax';
  cx(T, 1.9, 12.1, -1.35, 1.1, .2, 8, 'colete', camo); cx(T, 2.7, 11.3, -1.3, .1, 8, 9.8, 'colete', camo);
  cx(T, 1.9, 12.1, 6.9, 9.45, .2, 8, 'colete', camo); cx(T, 2.7, 11.3, 7.9, 9.4, 8, 10.4, 'colete', camo);
  /* gola alta */
  for (const [a, b, y0, y1] of [[2.9, 4.5, -.9, 8.6], [9.5, 11.1, -.9, 8.6], [4.5, 9.5, 7.4, 8.8]]) cx(T, a, b, y0, y1, 10.7, 12.2, 'colete_sombra', camo);
  for (const x of [2.4, 9.5]){ cx(T, x, x + 2.1, -1.2, .05, 9.4, 11.4, 'colete_sombra', camo); cx(T, x, x + 2.1, .05, 7.9, 10.9, 11.45, 'colete_sombra', camo); cx(T, x, x + 2.1, 7.9, 9.1, 9.8, 11.4, 'colete_sombra', camo); cx(T, x + .35, x + 1.75, -1.5, -1.2, 9.7, 10.5, 'preto'); }
  for (const [x0, x1] of [[1, 1.95], [12.05, 13]]){ cx(T, x0, x1, .1, 7.9, .2, 4.8, 'colete_sombra', camo); for (const z of [.9, 2.3, 3.7]) cx(T, x0 < 5 ? x0 - .14 : x1, x0 < 5 ? x0 : x1 + .14, .3, 7.7, z, z + .4, 'colete_escuro'); }
  for (const x of [2.05, 5.4, 8.75]){ bolso(cx, T, x, x + 3.2, -1.35, 1.35, -1, .3, 4.6, 'colete', camo); cx(T, x + .5, x + 1.35, -2.6, -1.5, 4.6, 5.55, 'preto'); cx(T, x + 1.85, x + 2.7, -2.6, -1.5, 4.6, 5.3, 'preto'); }
  molle(cx, T, 2.3, 11.7, -1.35, -1, [5.7, 6.7, 7.7], 'colete');
  bolso(cx, T, 2.7, 6.2, -1.5, .75, -1, 5.5, 8, 'colete', camo);
  cx(T, 7.4, 9.2, -2.55, -1.5, 5.2, 8.4, 'preto'); cx(T, 7.65, 8.95, -2.72, -2.55, 7, 8, 'visor'); cx(T, 7.75, 8.1, -2.72, -2.55, 5.7, 6.05, 'luz');
  cx(T, 8.45, 8.8, -2.2, -1.85, 8.4, 13.4, 'metal_escuro'); cx(T, 8.37, 8.88, -2.28, -1.77, 13.4, 13.85, 'preto');
  cx(T, 9.7, 11.4, -2.4, -1.5, 5.4, 7.6, 'medico_eq'); cx(T, 10.35, 10.75, -2.52, -2.4, 5.8, 7.2, 'branco_roupa'); cx(T, 9.95, 11.15, -2.52, -2.4, 6.3, 6.7, 'branco_roupa');
  for (const x of [3, 4.5]){ cx(T, x, x + 1.1, -2.2, -1.5, 8.3, 9.5, 'colete_escuro'); cx(T, x + .3, x + .8, -2.1, -1.65, 9.5, 10, 'metal_escuro'); }
  cx(T, 4.9, 9.1, 9.4, 10, 9.7, 10.3, 'preto'); molle(cx, T, 2.3, 11.7, 9.45, 1, [1, 2.4, 3.8, 5.2, 6.6], 'colete');
  /* saiote de proteção */
  cx('quadril', 3.4, 8.6, -.75, .55, .3, 4.6, 'colete', camo); molle(cx, 'quadril', 3.7, 8.3, -.75, -1, [1.2, 2.5], 'colete');
}

function mochilaCargueira(c, cx){
  const camo = c.mochila.camo, T = 'torax', [fc, tc] = ESPESSURA[c.colete.estilo] || [0, 0];
  const y = 8 + tc, yf = -.02 - fc;
  /* tudo o que fica atrás das costas é ampliado: mais largo, mais fundo e mais alto */
  const original = cx;
  cx = (peca, x0, x1, y0, y1, z0, z1, mat, cm) => (peca === 'torax' && y0 >= y)
    ? original(peca, 7 + (x0 - 7) * 1.16, 7 + (x1 - 7) * 1.16, y + (y0 - y) * 1.3, y + (y1 - y) * 1.3, 3 + (z0 - 3) * 1.13, 3 + (z1 - 3) * 1.13, mat, cm)
    : original(peca, x0, x1, y0, y1, z0, z1, mat, cm);
  for (const x of [1.5, 12]) cx(T, x, x + .5, y, y + .6, -6.2, 14.6, 'metal_escuro');                 /* armação */
  for (const z of [-6.2, 3, 14.1]) cx(T, 1.5, 12.5, y, y + .6, z, z + .5, 'metal_escuro');
  camada(cx, T, 1.7, 12.3, y + .4, y + 5.8, -3.6, 4.6, 'mochila', camo, .9);                            /* corpo em dois volumes e tampa */
  camada(cx, T, 2, 12, y + .4, y + 5.5, 4.6, 11, 'mochila', camo, .9);
  camada(cx, T, 2.2, 11.8, y + .4, y + 5.9, 11, 13.1, 'mochila_sombra', camo, 1);
  cx(T, 2.4, 11.6, y + 5.6, y + 6.25, 9.9, 11.4, 'mochila_sombra', camo);
  anel(cx, T, 1.55, 12.45, y + .3, y + 5.95, 4.35, 4.95, 'preto', false, .22);
  bolso(cx, T, 2.7, 11.3, y + 5.8, 1.75, 1, -3.1, 2.6, 'mochila', camo);
  bolso(cx, T, 3.1, 6.8, y + 5.5, 1.15, 1, 5.4, 9.3, 'mochila', camo); bolso(cx, T, 7.2, 10.9, y + 5.5, 1.15, 1, 5.4, 9.3, 'mochila', camo);
  molle(cx, T, 3.2, 10.8, y + 7.55, 1, [-2.3, -.9, .5], 'mochila');
  for (const [a, b] of [[-.55, 1.75], [12.25, 14.55]]){                                                 /* bolsos laterais altos */
    bolso(cx, T, a, b, y + 1, 3.5, 1, -3.4, 2.6, 'mochila', camo);
    camada(cx, T, a + .15, b - .15, y + 1.2, y + 4.6, 3.3, 8.8, 'mochila', camo, .6); cx(T, a + .05, b - .05, y + 1.1, y + 4.75, 8, 9.2, 'mochila_sombra', camo);
  }
  cx(T, .7, 13.3, y + 1.2, y + 4.6, 13.1, 16.2, 'saco'); cx(T, .35, 13.65, y + 1.7, y + 4.1, 13.45, 15.85, 'saco_sombra');   /* manta enrolada no topo */
  for (const x of [3.2, 10.2]) anel(cx, T, x, x + .65, y + 1.05, y + 4.75, 12.9, 16.35, 'preto', false, .24);
  cx(T, 1.2, 12.8, y + .9, y + 4.3, -6.4, -3.7, 'colete_sombra', c.mochila.camo); cx(T, .9, 13.1, y + 1.4, y + 3.8, -6.1, -4, 'colete_escuro');   /* saco de dormir embaixo */
  for (const x of [3.4, 10]) anel(cx, T, x, x + .65, y + .75, y + 4.45, -6.55, -3.55, 'preto', false, .24);
  for (const x of [3, 10.4]){ cx(T, x, x + .6, y + 6.25, y + 6.45, 2.8, 12.4, 'preto'); fivela(cx, T, x + .3, y + 6.45, 9.6, 1); }
  cx(T, 5.3, 8.7, y + 5.9, y + 6.2, 11.4, 12.7, 'velcro'); cx(T, 5.85, 8.15, y + 6.2, y + 6.32, 11.6, 12.5, 'remendo');
  cx(T, 13.2, 13.7, y + 4.7, y + 5.2, 3, 20.5, 'metal_escuro'); cx(T, 13.1, 13.8, y + 4.6, y + 5.3, 20.5, 21.3, 'preto');     /* antena longa */
  cx(T, .15, .6, y + 4.9, y + 5.35, -2.6, 9.6, 'madeira'); cx(T, -.35, 1.1, y + 4.55, y + 5.7, 8.7, 11, 'metal_escuro');     /* pá dobrável */
  cx(T, 13.6, 14.9, y + 4.9, y + 6.2, -2.6, 1.4, 'cantil'); cx(T, 13.9, 14.6, y + 5.2, y + 5.9, 1.4, 2.1, 'preto');
  for (const x of [1.85, 10.55]){                                                                       /* alças largas e barrigueira */
    cx(T, x, x + 1.6, yf - .48, yf, 4, 11.35, 'mochila_sombra'); cx(T, x, x + 1.6, yf, y + .1, 11.5, 12, 'mochila_sombra'); cx(T, x, x + 1.6, yf - .1, yf + .35, 11.2, 12, 'mochila_sombra'); cx(T, x, x + 1.6, y - .15, y + .45, 7.6, 11.9, 'mochila_sombra');
    cx(T, x + .5, x + 1.1, yf - .6, yf - .48, 4.4, 10.8, 'mochila_escuro'); fivela(cx, T, x + .8, yf - .6, 5.2); cx(T, x + .55, x + 1.05, yf - .42, yf - .22, 1.6, 4, 'preto');
  }
  cx(T, 3.45, 10.55, yf - .75, yf - .52, 7.7, 8.15, 'preto'); fivela(cx, T, 7, yf - .75, 7.92);
  const aperta = c.corpo === 'feminino' ? 1 : 0;
  anel(cx, 'cintura', -.6 + aperta, 10.6 - aperta, .35, 7.65, .4, 1.9, 'mochila_sombra', camo, .35);
}

function ombreiras(c, cx){
  for (const [P, f] of [['braco_d', -1], ['braco_e', 1]]){
    const [w, d, h] = ESTRUTURA[P].tam;
    cx(P, -.4, w + .4, -.4, d + .4, h - 2.2, h + .5, 'colete', c.colete.camo);
    cx(P, f < 0 ? -.85 : w + .4, f < 0 ? -.4 : w + .85, .2, d - .2, h - 3.4, h - .4, 'colete_sombra', c.colete.camo);
    cx(P, -.2, w + .2, -.6, -.4, h - 1.6, h - .6, 'colete_escuro');
    anel(cx, P, -.3, w + .3, -.3, d + .3, h - 4.1, h - 3.5, 'preto', false, .26);
  }
}

function emblemaNoCorpo(c, cx){
  const id = c.emblema?.estilo; if (!id || id === 'nenhum') return;
  const [fc, tc] = ESPESSURA[c.colete.estilo] || [0, 0];
  /* no braço (lado de fora) */
  const bw = ESTRUTURA.braco_e.tam[0];
  pintaEmblema(id, (u0, u1, v0, v1, k, m) => cx('braco_e', bw + .35 + k * .14, bw + .49 + k * .14, .55 + u0, .55 + u1, 6.9 + v0, 6.9 + v1, m), .26);
  /* nas costas, quando não há mochila */
  if (c.mochila.estilo === 'nenhum'){
    const y = c.colete.estilo === 'nenhum' ? 8.02 : 8 + tc + .12;
    pintaEmblema(id, (u0, u1, v0, v1, k, m) => cx('torax', 9.7 - u1, 9.7 - u0, y + k * .14, y + .14 + k * .14, 2.4 + v0, 2.4 + v1, m), .6);
  }
  /* no peito, quando não há colete */
  if (c.colete.estilo === 'nenhum' && c.mochila.estilo === 'nenhum'){
    const y = c.corpo === 'feminino' ? -1.1 : -.1;
    pintaEmblema(id, (u0, u1, v0, v1, k, m) => cx('torax', 8.6 + u0, 8.6 + u1, y - .28 - k * .12, y - .16 - k * .12, 5.9 + v0, 5.9 + v1, m), .3);
  }
}

/* encaixa os itens novos no equipar() que já existe */
const equiparOriginal = equipar;
equipar = function(c, cx){
  equiparOriginal(c, cx);
  if (c.chapeu.estilo === 'especial' || c.chapeu.estilo === 'viseira') cascoEspecial(c, cx);
  if (c.facial?.estilo === 'balaclava') balaclava(c, cx);
  if (c.facial?.estilo === 'gas') mascaraGas(c, cx);
  if (c.colete.estilo === 'pesado') coletePesado(c, cx);
  if (c.mochila.estilo === 'cargueira') mochilaCargueira(c, cx);
  if (c.ombreiras?.usa) ombreiras(c, cx);
  emblemaNoCorpo(c, cx);
};

/* ================================================================ conjuntos */
GRUPOS_KITS.especial = 'Unidade especial';
GRUPOS_KITS.faccoes = 'Facções';
Object.assign(KITS.nada.muda, {facial:{estilo:'nenhum'}, ombreiras:{usa:false}, emblema:{estilo:'nenhum'}});
const rosto_eq = estilo => ({estilo});
const marca = estilo => ({estilo});

/* ------------------------------------------------ Força Mantiqueira (unidade especial fictícia) */
const FARDA = {preta:tecido('#24272D', '#202329', '#141518', '#0F1013'), verde:tecido('#4A5636', '#414C30', '#2E2418', '#242A1C'),
  areia:tecido('#B49C72', '#A89068', '#7C6444', '#574832'), cinza:tecido('#5C636B', '#4E555D', '#26282C', '#2F3338'), urbana:tecido('#6B7078', '#43474E', '#1A1B1E', '#24262B')};
const pesadao = (cor, camo = false, mais = {}) => ({colete:veste('pesado', cor, camo), cinto:usa(cor), bolsaPerna:usa(), joelheiras:usa('#1C1D1F'), cotoveleiras:usa(), luvas:luva('taticas', '#1C1D1F'), ombreiras:usa(), emblema:marca('mantiqueira'), ...mais});
conjunto('fm_operador', 'especial', 'Operador de assalto', 'soldado', FARDA.preta, pesadao('#1F2226', false, {
  chapeu:na_cabeca('especial', '#23262B', {visao:true, fones:true}), facial:rosto_eq('balaclava'), mochila:veste('militar', '#23262B')}));
conjunto('fm_comandante', 'especial', 'Comandante de equipe', 'soldado', FARDA.urbana, pesadao('#2C3036', false, {
  chapeu:na_cabeca('especial', '#2C3036', {fones:true, goggles:true}), mochila:veste('urbana', '#2C3036'), ombreiras:{usa:false}}));
conjunto('fm_cargueiro', 'especial', 'Longa missão (cargueira)', 'soldado', FARDA.verde, pesadao('#3F4A2E', true, {
  chapeu:na_cabeca('especial', '#46522F', {camo:true, fones:true, goggles:true}), mochila:veste('cargueira', '#46522F', true)}));
conjunto('fm_comunicacao', 'especial', 'Operador de comunicações', 'soldado', FARDA.cinza, pesadao('#454B52', false, {
  chapeu:na_cabeca('tatico', '#454B52', {visao:true, fones:true}), mochila:veste('cargueira', '#3A4046'), ombreiras:{usa:false}}));
conjunto('fm_quimico', 'especial', 'Área contaminada', 'soldado', tecido('#55603A', '#4A5432', '#17181B', '#1A1C14'), pesadao('#2C3024', false, {
  chapeu:na_cabeca('especial', '#3C4428'), facial:rosto_eq('gas'), mochila:veste('militar', '#3C4428'), luvas:luva('simples', '#17181B')}));
conjunto('fm_choque', 'especial', 'Linha de frente com viseira', 'soldado', FARDA.preta, pesadao('#17191D', false, {
  chapeu:na_cabeca('viseira', '#1C1F24'), facial:rosto_eq('balaclava')}));
conjunto('fm_deserto', 'especial', 'Operação em área seca', 'soldado', FARDA.areia, pesadao('#9C8660', true, {
  chapeu:na_cabeca('especial', '#AA9468', {camo:true, visao:true, fones:true}), mochila:veste('cargueira', '#9A845C', true), joelheiras:usa('#6E5C40'), luvas:luva('taticas', '#6E5C40'), mascara:usa('#C9AC7C')}));
conjunto('fm_noturno', 'especial', 'Infiltração noturna', 'soldado', tecido('#17181C', '#141519', '#0C0C0E', '#08090A'), pesadao('#111215', false, {
  chapeu:na_cabeca('especial', '#141519', {visao:true, fones:true}), facial:rosto_eq('balaclava'), colete:veste('tatico', '#111215'), mochila:veste('urbana', '#141519'), ombreiras:{usa:false}}));
conjunto('fm_mata', 'especial', 'Reconhecimento na mata', 'soldado', FARDA.verde, pesadao('#46562F', true, {
  chapeu:na_cabeca('selva', '#4F6334', {camo:true}), colete:veste('assalto', '#3F4F2C', true), mochila:veste('cargueira', '#4A5A32', true), mascara:usa('#3F4F2C'), ombreiras:{usa:false}}));
conjunto('fm_resgate', 'especial', 'Resgate e primeiros socorros', 'soldado', FARDA.cinza, pesadao('#8C2A22', false, {
  chapeu:na_cabeca('especial', '#8C2A22', {fones:true, goggles:true}), mochila:veste('cargueira', '#8C2A22'), ombreiras:{usa:false}, luvas:luva('simples', '#E4E0D6')}));
conjunto('fm_motorizado', 'especial', 'Equipe motorizada', 'soldado', FARDA.urbana, pesadao('#24272D', false, {
  chapeu:na_cabeca('viseira', '#24272D', {fones:true}), colete:veste('tatico', '#24272D'), mochila:veste('militar', '#24272D')}));
conjunto('fm_folga', 'especial', 'Base (sem proteção)', 'casual', tecido('#24272D', '#4A5636', '#141518', '#D9C27A'), {
  chapeu:na_cabeca('bone', '#17191D'), cinto:usa('#2F3338'), emblema:marca('mantiqueira')});

/* ------------------------------------------------ facções fictícias: chefe, linha de frente e olheiro */
const FACCOES = {
  mandu:{nome:'Guarda do Mandu', lema:'Quem cuida da água, cuida de todos.', cores:['#12414B', '#2C6E78', '#D8C79A'], area:'Margens do rio e pontos de água.', quer:'Controlar a água limpa. Dá proteção em troca de trabalho.'},
  tropeiros:{nome:'Os Tropeiros', lema:'Todo caminho tem um preço.', cores:['#4A2E1C', '#8A5A30', '#E0A84B'], area:'Estradas de terra, sítios e trilhas.', quer:'Comerciar. Falam com todos os lados e não são fiéis a nenhum.'},
  asfalto:{nome:'Donos do Asfalto', lema:'Passou, pagou.', cores:['#17171A', '#3A3D45', '#F2C230'], area:'A rodovia e os postos.', quer:'Combustível e veículos. Facção grande, rival da Irmandade da Serra.'},
  serra:{nome:'Irmandade da Serra', lema:'Daqui ninguém sai sozinho.', cores:['#1F4A30', '#3E6E48', '#E9EDE4'], area:'Os morros em volta e as matas.', quer:'Fechar a região para quem vem de fora. Facção grande, rival dos Donos do Asfalto.'},
  safra:{nome:'Safra Negra', lema:'Plantamos hoje o que vocês vão pedir amanhã.', cores:['#1C1210', '#4E2E22', '#B5652D'], area:'Fazendas e galpões abandonados.', quer:'Controlar a comida e as sementes.'},
  viralatas:{nome:'Vira-Latas do Jardim', lema:'A rua ensinou.', cores:['#4C5058', '#2F3138', '#F16A32'], area:'Ruas e quintais do bairro.', quer:'Proteger o bairro. São jovens que sabem todos os atalhos.'},
};
const fac = (id, papel, nome, roupa_, cores_, extras) => conjunto(`${id}_${papel}`, 'faccoes', `${FACCOES[id].nome}: ${nome}`, roupa_, cores_, {...extras, emblema:marca(id)});

fac('mandu', 'chefe', 'chefe', 'couro', tecido('#12414B', '#262E33', '#14181A', '#D8C79A'), {chapeu:na_cabeca('boina', '#12414B'), cinto:usa('#0F2C33'), bolsaPerna:usa(), luvas:luva('taticas', '#0F2C33')});
fac('mandu', 'frente', 'guarda', 'soldado', tecido('#2C6E78', '#244E56', '#2A2018', '#12414B'), {chapeu:na_cabeca('combate', '#1F5560', {camo:true}), colete:veste('assalto', '#12414B'), mochila:veste('militar', '#1F4A52'), cinto:usa('#0F2C33'), joelheiras:usa('#0F2C33'), luvas:luva('simples', '#0F2C33')});
fac('mandu', 'olheiro', 'olheiro', 'moletom', tecido('#12414B', '#3A3D45', '#D8C79A', '#D8C79A'), {chapeu:na_cabeca('gorro', '#D8C79A'), mascara:usa('#12414B')});
fac('tropeiros', 'chefe', 'patrão', 'couro', tecido('#5A3A22', '#4A3A28', '#2E1E12', '#E0A84B'), {chapeu:na_cabeca('cowboy', '#4A2E1C'), cinto:usa('#4A2E1C'), bolsaPerna:usa(), luvas:luva('simples', '#4A2E1C')});
fac('tropeiros', 'frente', 'escolta', 'xadrez', tecido('#8A5A30', '#4A3A28', '#2E1E12', '#4A2E1C'), {chapeu:na_cabeca('cowboy', '#7A5230'), colete:veste('assalto', '#4A2E1C'), mochila:veste('expedicao', '#6E4A2C'), cinto:usa('#3A2416'), joelheiras:usa('#3A2416'), luvas:luva('taticas', '#3A2416'), mascara:usa('#E0A84B')});
fac('tropeiros', 'olheiro', 'mensageiro', 'polo', tecido('#E0A84B', '#5A4630', '#4A2E1C', '#4A2E1C'), {chapeu:na_cabeca('palha', '#4A2E1C'), mochila:veste('urbana', '#8A5A30')});
fac('asfalto', 'chefe', 'chefe', 'couro', tecido('#17171A', '#24262B', '#101012', '#F2C230'), {chapeu:na_cabeca('bandana', '#F2C230'), colete:veste('tatico', '#17171A'), cinto:usa('#101012'), bolsaPerna:usa(), joelheiras:usa('#17171A'), cotoveleiras:usa(), ombreiras:usa(), luvas:luva('taticas', '#17171A')});
fac('asfalto', 'frente', 'cobrador', 'refletivo', tecido('#24262B', '#26282E', '#17171A', '#D9A81E'), {chapeu:na_cabeca('viseira', '#1C1D22'), cinto:usa('#17171A'), joelheiras:usa('#F2C230'), cotoveleiras:usa(), ombreiras:usa(), luvas:luva('taticas', '#17171A'), facial:rosto_eq('balaclava')});
fac('asfalto', 'olheiro', 'piloto', 'jaqueta_jeans', tecido('#2F3138', '#26282E', '#17171A', '#F2C230'), {chapeu:na_cabeca('bone_virado', '#F2C230'), mochila:veste('urbana', '#17171A'), luvas:luva('simples', '#17171A'), mascara:usa('#17171A')});
fac('serra', 'chefe', 'ancião', 'sobrevivente', tecido('#1F4A30', '#2E3A2C', '#26201A', '#E9EDE4'), {chapeu:na_cabeca('selva', '#1F4A30'), colete:veste('improvisado', '#2E3A2C'), cinto:usa('#22301F'), bolsaPerna:usa(), luvas:luva('simples', '#22301F')});
fac('serra', 'frente', 'sentinela', 'soldado', tecido('#3E6E48', '#33583A', '#2A2018', '#E9EDE4'), {chapeu:na_cabeca('tatico', '#2F5238', {camo:true, fones:true}), colete:veste('tatico', '#26422E', true), mochila:veste('cargueira', '#2F4E36', true), cinto:usa('#22301F'), joelheiras:usa('#1F4A30'), cotoveleiras:usa(), luvas:luva('taticas', '#1B2A1E'), facial:rosto_eq('balaclava')});
fac('serra', 'olheiro', 'batedor', 'regata', tecido('#E9EDE4', '#1F4A30', '#4A3426', '#3E6E48'), {chapeu:na_cabeca('bandana', '#1F4A30'), mochila:veste('urbana', '#33583A', true), cinto:usa('#22301F'), mascara:usa('#1F4A30')});
fac('safra', 'chefe', 'senhora da colheita', 'social', tecido('#1C1210', '#1C1210', '#100A08', '#B5652D'), {chapeu:na_cabeca('social', '#1C1210'), luvas:luva('simples', '#100A08')});
fac('safra', 'frente', 'capataz', 'oficina', tecido('#6E3E26', '#2A1C16', '#1C1210', '#B5652D'), {chapeu:na_cabeca('palha', '#B5652D'), colete:veste('improvisado', '#2A1C16'), cinto:usa('#1C1210'), joelheiras:usa('#2A1C16'), cotoveleiras:usa(), luvas:luva('taticas', '#1C1210'), mascara:usa('#4E2E22')});
fac('safra', 'olheiro', 'vigia', 'listrado', tecido('#4E2E22', '#26201C', '#1C1210', '#B5652D'), {chapeu:na_cabeca('gorro', '#1C1210'), mochila:veste('improvisada', '#4E2E22')});
fac('viralatas', 'chefe', 'líder', 'moletom', tecido('#4C5058', '#2F3138', '#F16A32', '#F16A32'), {chapeu:na_cabeca('bone_virado', '#F16A32'), mochila:veste('urbana', '#2F3138'), bolsaPerna:usa(), luvas:luva('simples', '#2F3138')});
fac('viralatas', 'frente', 'brigão', 'regata', tecido('#F16A32', '#3A3D45', '#26282E', '#F1F1EC'), {chapeu:na_cabeca('bandana', '#4C5058'), colete:veste('improvisado', '#4C5058'), joelheiras:usa('#2F3138'), cotoveleiras:usa(), luvas:luva('taticas', '#2F3138')});
fac('viralatas', 'olheiro', 'corredor', 'agasalho', tecido('#4C5058', '#2F3138', '#F16A32', '#F16A32'), {chapeu:na_cabeca('fone_musica', '#F16A32'), mascara:usa('#2F3138')});
