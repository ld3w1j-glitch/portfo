/* Equipamentos que se encaixam em qualquer roupa: cabeça, colete, mochila, cinto, proteções, máscara e luvas.
   cx(peça, x0, x1, y0, y1, z0, z1, material, camuflado) desenha uma caixa em blocos da peça (frente = y menor).
   Caixas de tecido ganham textura em pixels; com camuflado = true, manchas de camuflagem. */
const CHAPEUS = {nenhum:'Nada', bone:'Boné tático', gorro:'Gorro', selva:'Chapéu de selva', tatico:'Capacete tático', combate:'Capacete de combate', obra:'Capacete de obra'};
const COLETES = {nenhum:'Sem colete', tatico:'Porta-placas', assalto:'Colete de assalto', improvisado:'Improvisado'};
const MOCHILAS = {nenhum:'Sem mochila', urbana:'Urbana', militar:'Assalto militar', expedicao:'Expedição', improvisada:'Improvisada'};
const LUVAS = {nenhum:'Sem luvas', simples:'Simples', taticas:'Táticas'};
const CAPACETES = ['tatico', 'combate'];

/* quanto o colete ocupa na frente e atrás do tórax (as mochilas se ajustam por cima) */
const ESPESSURA = {nenhum:[0, 0], tatico:[1.15, 1.2], assalto:[.55, .5], improvisado:[.9, .8]};

/* anel em volta de uma peça: quatro tiras */
function anel(cx, peca, x0, x1, y0, y1, z0, z1, mat, camo, e = .35){
  cx(peca, x0, x1, y0, y0 + e, z0, z1, mat, camo); cx(peca, x0, x1, y1 - e, y1, z0, z1, mat, camo);
  cx(peca, x0, x0 + e, y0 + e, y1 - e, z0, z1, mat, camo); cx(peca, x1 - e, x1, y0 + e, y1 - e, z0, z1, mat, camo);
}
/* camada de cantos arredondados: duas caixas cruzadas */
function camada(cx, peca, x0, x1, y0, y1, z0, z1, mat, camo, q = .8){
  cx(peca, x0, x1, y0 + q, y1 - q, z0, z1, mat, camo);
  cx(peca, x0 + q, x1 - q, y0, y1, z0 + .01, z1 - .01, mat, camo);
}
/* bolso com corpo, tampa, vinco e botão de pressão, saltando para a frente (direcao -1) ou para trás (+1) */
function bolso(cx, peca, x0, x1, y, fundo, direcao, z0, z1, mat, camo){
  const faixa = (a, b) => [Math.min(y + direcao * a, y + direcao * b), Math.max(y + direcao * a, y + direcao * b)];
  const meio = (x0 + x1) / 2, tampa = Math.min(1.1, (z1 - z0) * .34);
  cx(peca, x0, x1, ...faixa(0, fundo), z0, z1, mat, camo);
  cx(peca, x0 - .08, x1 + .08, ...faixa(0, fundo + .22), z1 - tampa, z1 + .14, mat + '_sombra', camo);
  cx(peca, x0 + .25, x1 - .25, ...faixa(fundo, fundo + .07), z0 + .35, z0 + .55, mat + '_escuro');
  cx(peca, meio - .2, meio + .2, ...faixa(fundo + .22, fundo + .36), z1 - tampa + .18, z1 - tampa + .58, 'metal_escuro');
}
/* tiras de fixação (MOLLE): fileiras com costuras */
function molle(cx, peca, x0, x1, y, direcao, alturas, mat){
  const f = (a, b) => [Math.min(y + direcao * a, y + direcao * b), Math.max(y + direcao * a, y + direcao * b)];
  for (const z of alturas){
    cx(peca, x0, x1, ...f(0, .14), z, z + .42, mat + '_escuro');
    for (let x = x0 + .55; x < x1 - .3; x += 1.25) cx(peca, x, x + .22, ...f(.14, .22), z - .04, z + .46, mat + '_claro');
  }
}
const fivela = (cx, peca, x, y, z, direcao = -1) => {
  cx(peca, x - .45, x + .45, Math.min(y, y + direcao * .22), Math.max(y, y + direcao * .22), z - .35, z + .35, 'preto');
  cx(peca, x - .18, x + .18, Math.min(y + direcao * .22, y + direcao * .32), Math.max(y + direcao * .22, y + direcao * .32), z - .14, z + .14, 'metal_escuro');
};

/* ---------------------------------------------------------------- cabeça */
function equipaCabeca(c, cx){
  const h = c.chapeu.estilo, camo = c.chapeu.camo, C = 'cabeca';
  if (CHAPEUS_CIVIS[h]) CHAPEUS_CIVIS[h].desenhar(cx, c);
  if (h === 'bone'){
    camada(cx, C, .65, 13.35, -.55, 13.45, 15.5, 17.4, 'chapeu', camo, .7);
    camada(cx, C, 1.35, 12.65, -.35, 13.2, 17.4, 19.2, 'chapeu', camo, .9);
    camada(cx, C, 2.4, 11.6, .1, 11.9, 19.2, 20.75, 'chapeu', camo, 1);
    cx(C, 6.5, 7.5, 5.5, 6.5, 20.75, 21.15, 'chapeu_escuro');
    cx(C, 2.4, 11.6, -3.2, -.55, 15.6, 16.2, 'chapeu_sombra', camo); cx(C, 3.4, 10.6, -4.3, -3.2, 15.5, 16.05, 'chapeu_sombra', camo);
    cx(C, .65, 13.35, -.66, -.55, 15.5, 15.85, 'chapeu_escuro');
    cx(C, 4.9, 9.1, -.72, -.55, 16.6, 18.6, 'chapeu_escuro'); cx(C, 5.4, 8.6, -.82, -.72, 17, 18.2, 'remendo'); cx(C, 5.9, 6.7, -.9, -.82, 17.3, 17.9, 'remendo_claro');
    cx(C, 4.6, 9.4, 13.45, 13.7, 15.7, 16.3, 'preto'); fivela(cx, C, 7, 13.7, 16, 1);
  }
  if (h === 'gorro'){
    camada(cx, C, .55, 13.45, -.62, 13.5, 15.2, 17.3, 'chapeu_sombra', camo, .7);
    for (let x = 1.6; x < 12.4; x += 1.4){ cx(C, x, x + .45, -.74, -.62, 15.3, 17.2, 'chapeu_escuro'); cx(C, x, x + .45, 13.5, 13.62, 15.3, 17.2, 'chapeu_escuro'); }
    for (let y = .6; y < 12; y += 1.4){ cx(C, .43, .55, y, y + .45, 15.3, 17.2, 'chapeu_escuro'); cx(C, 13.45, 13.57, y, y + .45, 15.3, 17.2, 'chapeu_escuro'); }
    camada(cx, C, .82, 13.18, -.4, 13.28, 17.3, 20.18, 'chapeu', camo, 1);
    camada(cx, C, 2.4, 11.6, .8, 12, 20.18, 21.5, 'chapeu', camo, 1.2);
    cx(C, 8.8, 11.2, -.72, -.4, 15.7, 16.8, 'couro');
  }
  if (h === 'selva'){
    camada(cx, C, -2, 16, -3.1, 15.6, 15.15, 15.75, 'chapeu', camo, 2);
    camada(cx, C, -1.4, 15.4, -2.4, 15, 15.75, 16.05, 'chapeu_sombra', camo, 1.8);
    camada(cx, C, .6, 13.4, -.6, 13.45, 16.05, 17.5, 'chapeu_escuro', false, .8);
    for (let x = 1.4; x < 12.6; x += 2.1) cx(C, x, x + .5, -.76, -.6, 16.15, 17.4, 'chapeu_claro');
    camada(cx, C, .8, 13.2, -.45, 13.3, 17.5, 19.6, 'chapeu', camo, 1);
    camada(cx, C, 2, 12, .6, 12.2, 19.6, 20.8, 'chapeu', camo, 1.2);
    for (const x of [-.05, 13.75]){ cx(C, x, x + .3, 3.3, 3.8, 3, 15.2, 'chapeu_escuro'); }
    cx(C, 0, 14, 3.3, 3.8, 2.5, 3, 'chapeu_escuro');
  }
  if (h === 'obra'){
    camada(cx, C, -.3, 14.3, -1.7, 14, 15.1, 15.75, 'chapeu_sombra', false, 1.3);
    camada(cx, C, .35, 13.65, -.7, 13.55, 15.75, 18.4, 'chapeu', false, 1);
    camada(cx, C, 1.2, 12.8, -.3, 13, 18.4, 20.4, 'chapeu', false, 1.4);
    camada(cx, C, 3, 11, 1.2, 11.4, 20.4, 21.4, 'chapeu', false, 1.4);
    cx(C, 6.1, 7.9, -.9, 13.2, 21.4, 21.75, 'chapeu_claro');
    cx(C, 5.5, 8.5, -1.5, -.7, 16.5, 18.3, 'preto'); cx(C, 6, 8, -1.75, -1.5, 16.8, 18, 'lanterna');
    for (const x of [.2, 13.4]){ cx(C, x, x + .4, 3.2, 3.8, 3, 15.2, 'preto'); }
    cx(C, .3, 13.7, 3.2, 3.8, 2.55, 3.05, 'preto');
  }
  if (h === 'combate'){
    camada(cx, C, -.25, 14.25, -1.45, 14.2, 14.5, 15.5, 'chapeu_sombra', camo, 1.4);
    camada(cx, C, .15, 13.85, -1, 13.75, 15.5, 18.2, 'chapeu', camo, 1.1);
    camada(cx, C, .85, 13.15, -.5, 13.2, 18.2, 20, 'chapeu', camo, 1.4);
    camada(cx, C, 2.2, 11.8, .7, 12, 20, 21.15, 'chapeu', camo, 1.4);
    camada(cx, C, 4, 10, 2.6, 10, 21.15, 21.75, 'chapeu', camo, 1.2);
    /* aro, faixa de camuflagem com elástico e folhas presas */
    camada(cx, C, .02, 13.98, -1.14, 13.9, 15.85, 16.55, 'chapeu_escuro', false, 1.1);
    for (let x = 1.8; x < 12; x += 2.3) cx(C, x, x + .35, -1.28, -1.14, 15.75, 16.65, 'chapeu_claro');
    cx(C, 9.4, 10.1, -1.35, -1.14, 16.4, 18.6, 'verde'); cx(C, 10.2, 10.7, -1.3, -1.14, 16.4, 17.8, 'verde_escuro');
    for (const x of [-.12, 13.82]) for (const y of [3, 9.2]) cx(C, x, x + .3, y, y + .55, 14.7, 15.4, 'metal_escuro');
    correiaQueixo(cx);
  }
  if (h === 'tatico'){
    /* casco de corte alto, deixando as orelhas livres */
    camada(cx, C, .2, 13.8, -.95, 13.7, 14.95, 16.1, 'chapeu_sombra', camo, 1.1);
    camada(cx, C, .35, 13.65, -.8, 13.6, 16.1, 18.5, 'chapeu', camo, 1.1);
    camada(cx, C, 1.05, 12.95, -.35, 13.05, 18.5, 20.15, 'chapeu', camo, 1.4);
    camada(cx, C, 2.4, 11.6, .8, 11.9, 20.15, 21.25, 'chapeu', camo, 1.4);
    camada(cx, C, .1, 13.9, -1.06, 13.8, 14.85, 15.15, 'chapeu_escuro', false, 1.1);
    for (const [x0, x1, f] of [[-.3, .22, -1], [13.78, 14.3, 1]]){          /* trilhos laterais */
      cx(C, x0, x1, 1.6, 10.8, 15.3, 16.35, 'preto');
      for (let y = 2.4; y < 10.2; y += 1.6) cx(C, f < 0 ? x0 - .12 : x1, f < 0 ? x0 : x1 + .12, y, y + .75, 15.55, 16.1, 'metal_escuro');
      cx(C, f < 0 ? .1 : 13.55, f < 0 ? .45 : 13.9, 1.2, 2, 16.6, 18.4, 'chapeu_escuro');
    }
    cx(C, 5.2, 8.8, 2.4, 6.4, 21.25, 21.45, 'velcro');                      /* velcro no topo */
    for (const x of [.9, 12.65]) cx(C, x, x + .45, 3.6, 7.6, 18.55, 18.75, 'velcro');
    /* suporte frontal e parafusos */
    cx(C, 5.5, 8.5, -1.3, -.8, 16.9, 19, 'preto'); cx(C, 6.1, 7.9, -1.48, -1.3, 17.4, 18.5, 'metal_escuro');
    for (const x of [5.7, 8]) cx(C, x, x + .3, -1.42, -1.3, 18.65, 18.95, 'metal');
    for (const x of [3.4, 10.25]) cx(C, x, x + .35, -.95, -.8, 17.1, 17.45, 'metal_escuro');
    /* bateria atrás e cordões elásticos */
    cx(C, 4.2, 9.8, 13.6, 14.9, 15.6, 18, 'preto'); cx(C, 4.8, 9.2, 14.9, 15.1, 16.1, 17.5, 'chapeu_escuro');
    for (const x of [3.2, 10.55]) cx(C, x, x + .25, 13.55, 13.85, 16.2, 19.4, 'preto');
    if (c.chapeu.visao){                                                   /* visão noturna levantada */
      cx(C, 6.35, 7.65, -2, -1.4, 17.8, 20.1, 'preto'); cx(C, 4.5, 9.5, -2.35, -1.75, 19.5, 20.1, 'preto');
      for (const x of [4.15, 7.75]){
        cx(C, x, x + 2.1, -3.7, -1.9, 19.9, 21.9, 'preto'); cx(C, x + .25, x + 1.85, -4.35, -3.7, 20.15, 21.65, 'metal_escuro');
        cx(C, x + .5, x + 1.6, -4.5, -4.35, 20.4, 21.4, 'lente_verde'); cx(C, x + .65, x + .95, -4.56, -4.5, 20.95, 21.25, 'brilho');
        cx(C, x + .4, x + 1.7, -3.4, -2.4, 21.9, 22.15, 'metal_escuro');
      }
    }
    correiaQueixo(cx);
  }
  if (CAPACETES.includes(h) && c.chapeu.goggles){                          /* óculos de proteção sobre o casco */
    const z = h === 'tatico' ? 15.05 : 15.45, f = h === 'tatico' ? -1.5 : -1.65;
    camada(cx, C, -.12, 14.12, f + .35, 14.05, z + .75, z + 1.25, 'preto', false, 1);
    cx(C, 2.1, 11.9, f - .35, f + .35, z, z + 1.95, 'preto');
    for (const [a, b] of [[2.55, 6.7], [7.3, 11.45]]){ cx(C, a, b, f - .55, f - .35, z + .35, z + 1.6, 'visor'); cx(C, a + .4, a + 1.7, f - .62, f - .55, z + 1.1, z + 1.35, 'brilho'); }
  }
  if (CAPACETES.includes(h) && c.chapeu.fones){                            /* fones com microfone */
    for (const s of [-1, 1]){
      const dentro = s < 0 ? .95 : 13.05, fora = s < 0 ? -1.05 : 15.05, x0 = Math.min(dentro, fora), x1 = Math.max(dentro, fora);
      cx(C, x0, x1, 4.3, 8.7, 6.9, 11.7, 'preto');
      cx(C, s < 0 ? x0 - .3 : x1, s < 0 ? x0 : x1 + .3, 5, 8, 7.6, 11, 'chapeu_sombra', camo);
      cx(C, s < 0 ? x0 - .42 : x1 + .3, s < 0 ? x0 - .3 : x1 + .42, 5.9, 7.1, 8.7, 9.9, 'metal_escuro');
      cx(C, s < 0 ? -.45 : 14.1, s < 0 ? -.1 : 14.45, 6, 7, 11.7, 15.6, 'metal_escuro');
    }
    cx(C, -1.35, -1, 1, 5, 7.5, 7.85, 'preto'); cx(C, -1.35, -1, 1, 1.35, 5.6, 7.5, 'preto');
    cx(C, -1.35, 2, -1.15, -.8, 5.6, 5.95, 'preto'); cx(C, -1.35, -1, -1.15, 1.2, 5.6, 5.95, 'preto');
    cx(C, 1.8, 3.6, -1.35, -.7, 5.3, 6.25, 'metal_escuro');
  }
  if (c.mascara.usa){                                                      /* lenço sobre o nariz e a boca */
    cx(C, 1.8, 12.2, -.78, -.28, 6.4, 8.55, 'mascara'); cx(C, 2.3, 11.7, -.9, -.28, 4.4, 6.4, 'mascara');
    cx(C, 3.4, 10.6, -.95, -.28, 2.7, 4.4, 'mascara_sombra'); cx(C, 5.2, 8.8, -.92, -.28, 1.2, 2.7, 'mascara_sombra'); cx(C, 6.3, 7.7, -.85, -.28, .2, 1.2, 'mascara_sombra');
    cx(C, 1.8, 12.2, -.9, -.78, 8.2, 8.55, 'mascara_escuro'); cx(C, 3, 11, -1, -.9, 6.25, 6.5, 'mascara_escuro');
    /* amarração: acompanha o contorno da cabeça (x de 2 a 12, passando por baixo das orelhas) */
    for (const [x0, x1] of [[1.72, 2.06], [11.94, 12.28]]) cx(C, x0, x1, -.35, 5, 6.7, 7.9, 'mascara');
    cx(C, 3, 11, 11.85, 12.25, 7.1, 7.9, 'mascara'); cx(C, 5.9, 8.1, 12.25, 12.85, 6.9, 8.15, 'mascara_escuro');
  }
}
function correiaQueixo(cx){
  for (const x of [.12, 13.48]){
    cx('cabeca', x, x + .4, 2.9, 3.45, 3.1, 15.2, 'preto'); cx('cabeca', x, x + .4, 3.45, 7, 9.2, 9.6, 'preto');
    cx('cabeca', x, x + .4, 7, 7.5, 9.2, 15.2, 'preto');
  }
  cx('cabeca', .2, 13.8, 2.9, 3.45, 2.55, 3.05, 'preto'); cx('cabeca', 4.6, 9.4, -.55, 2.9, 2.55, 2.98, 'preto'); cx('cabeca', 5.4, 8.6, -.75, -.5, 2.35, 3.15, 'chapeu_escuro');
}

/* ---------------------------------------------------------------- coletes (tórax 14 x 8 x 11) */
function equipaColete(c, cx){
  const tipo = c.colete.estilo, camo = c.colete.camo, T = 'torax';
  if (tipo === 'tatico'){
    /* placa da frente e de trás, com o alto recortado */
    cx(T, 2.15, 11.85, -1.05, 1.1, .55, 7.7, 'colete', camo); cx(T, 3, 11, -1, .1, 7.7, 9.5, 'colete', camo);
    cx(T, 2.15, 11.85, 6.9, 9.1, .55, 7.7, 'colete', camo); cx(T, 3, 11, 7.9, 9.05, 7.7, 10, 'colete', camo);
    for (const x of [2.55, 9.35]){                                          /* ombreiras acolchoadas */
      cx(T, x, x + 2.1, -.95, .05, 9.3, 11.35, 'colete_sombra', camo); cx(T, x, x + 2.1, .05, 7.9, 10.95, 11.5, 'colete_sombra', camo); cx(T, x, x + 2.1, 7.9, 8.95, 9.8, 11.45, 'colete_sombra', camo);
      cx(T, x + .35, x + 1.75, -1.2, -.95, 9.6, 10.35, 'preto'); cx(T, x + .75, x + 1.35, 2.5, 5.5, 11.5, 11.68, 'colete_escuro');
    }
    for (const [x0, x1] of [[1.25, 2.2], [11.8, 12.75]]){                   /* faixa lateral */
      cx(T, x0, x1, .3, 7.7, .5, 4.3, 'colete_sombra', camo);
      for (const z of [1.1, 2.4, 3.6]) cx(T, x0 < 5 ? x0 - .12 : x1, x0 < 5 ? x0 : x1 + .12, .5, 7.5, z, z + .35, 'colete_escuro');
    }
    for (const x of [2.4, 5.6, 8.8]){                                        /* três porta-carregadores */
      bolso(cx, T, x, x + 2.8, -1.05, 1.05, -1, .35, 4.35, 'colete', camo);
      cx(T, x + .45, x + 1.15, -2.05, -1.2, 4.35, 5.15, 'preto'); cx(T, x + 1.65, x + 2.35, -2.05, -1.2, 4.35, 4.9, 'preto');
    }
    molle(cx, T, 2.5, 11.5, -1.05, -1, [5.35, 6.35], 'colete');
    bolso(cx, T, 3.1, 6.4, -1.2, .62, -1, 5.15, 7.55, 'colete', camo);       /* bolso administrativo */
    cx(T, 6.9, 9.1, -1.4, -1.2, 7.9, 9.15, 'velcro'); cx(T, 7.25, 8.75, -1.5, -1.4, 8.15, 8.9, 'remendo'); cx(T, 7.5, 7.95, -1.57, -1.5, 8.35, 8.72, 'remendo_claro');
    cx(T, 3.7, 6.2, -1.2, -1, 8.2, 9.1, 'velcro'); for (let x = 3.95; x < 6; x += .55) cx(T, x, x + .3, -1.28, -1.2, 8.48, 8.82, 'remendo_claro');
    /* rádio com antena e cabo */
    cx(T, 9.2, 10.9, -2.05, -1.2, 5, 7.9, 'preto'); cx(T, 9.45, 10.65, -2.2, -2.05, 6.6, 7.55, 'visor'); cx(T, 9.5, 9.85, -2.2, -2.05, 5.5, 5.85, 'luz');
    cx(T, 10.35, 10.7, -1.85, -1.5, 7.9, 12.6, 'metal_escuro'); cx(T, 10.27, 10.78, -1.93, -1.42, 12.6, 13, 'preto'); cx(T, 9.45, 9.9, -1.85, -1.4, 7.9, 8.5, 'metal_escuro');
    cx(T, 8.85, 9.2, -1.55, -1.2, 5.4, 9.6, 'preto');
    /* costas: alça de resgate e fixações */
    cx(T, 5, 9, 9.05, 9.6, 9.35, 9.9, 'preto'); cx(T, 5, 5.5, 8.9, 9.55, 8.7, 9.4, 'preto'); cx(T, 8.5, 9, 8.9, 9.55, 8.7, 9.4, 'preto');
    molle(cx, T, 2.5, 11.5, 9.1, 1, [1.3, 2.7, 4.1, 5.5, 6.7], 'colete');
  }
  if (tipo === 'assalto'){
    /* arnês em H com fileira de bolsos baixa */
    for (const x of [3, 9.4]){
      cx(T, x, x + 1.6, -.55, .05, 3.8, 11.2, 'colete_sombra', camo); cx(T, x, x + 1.6, .05, 8, 10.95, 11.35, 'colete_sombra', camo); cx(T, x, x + 1.6, 7.95, 8.5, 3.8, 11.2, 'colete_sombra', camo);
      cx(T, x + .35, x + 1.25, -.68, -.55, 4.2, 10.8, 'colete_escuro'); fivela(cx, T, x + .8, -.68, 8.4);
    }
    cx(T, 4.6, 9.4, -.6, -.4, 7, 7.55, 'preto'); fivela(cx, T, 7, -.6, 7.28);
    anel(cx, T, 1.55, 12.45, .35, 7.65, 1, 4.4, 'colete', camo, .55);
    cx(T, 2, 12, -.6, 1.05, .7, 4.5, 'colete', camo);
    for (const x of [2.15, 4.65, 7.15, 9.65]) bolso(cx, T, x, x + 2.2, -.6, .98, -1, .5, 4.3, 'colete', camo);
    bolso(cx, T, 9.1, 11.2, -.55, .65, -1, 5.2, 7.9, 'colete', camo);
    cx(T, 3.2, 4.4, -1.15, -.55, 5, 8.2, 'preto'); cx(T, 3.4, 4.2, -1.25, -1.15, 7.2, 7.9, 'metal_escuro');   /* lanterna */
    cx(T, 3.45, 4.15, -1.1, -.6, 8.2, 8.5, 'lanterna');
  }
  if (tipo === 'improvisado'){
    /* peças de sucata amarradas com fita */
    cx(T, 2.3, 11.7, -.62, 1.05, .8, 8.8, 'couro'); cx(T, 2.3, 11.7, 6.95, 8.62, .8, 9.4, 'couro');
    cx(T, 3, 7.4, -.95, -.62, 4.4, 8.5, 'sucata'); cx(T, 7.1, 11, -.85, -.62, 5, 8, 'sucata_escura'); cx(T, 3.6, 10.2, -.9, -.62, 1.4, 3.9, 'colete', camo);
    for (const [x, z] of [[3.25, 7.9], [6.7, 7.9], [3.25, 4.75], [6.7, 4.75], [10.4, 7.4], [10.4, 5.3]]) cx(T, x, x + .4, -1.08, -.9, z, z + .4, 'metal_escuro');
    cx(T, 4, 6.2, -1.04, -.95, 6.1, 6.5, 'ferrugem'); cx(T, 8, 8.5, -.95, -.85, 5.3, 7.2, 'ferrugem');
    for (const z of [2.1, 4.05]){ anel(cx, T, 1.75, 12.25, -1.02, 9, z, z + .5, 'faixa', false, .3); }
    for (const x of [2.7, 9.6]){
      cx(T, x, x + 1.7, -.8, .05, 8.4, 11.3, 'couro'); cx(T, x, x + 1.7, .05, 7.9, 10.95, 11.35, 'couro'); cx(T, x, x + 1.7, 7.95, 8.7, 9, 11.25, 'couro');
    }
    cx(T, 8.7, 12.4, -.4, 5, 10.7, 11.75, 'sucata'); cx(T, 9.1, 12, .2, 4.4, 11.75, 12.1, 'sucata_escura');      /* ombreira */
    molle(cx, T, 2.8, 11.2, 8.62, 1, [2.4, 5.2], 'colete');
  }
}

/* ---------------------------------------------------------------- mochilas */
function equipaMochila(c, cx){
  const tipo = c.mochila.estilo, camo = c.mochila.camo, T = 'torax';
  if (tipo === 'nenhum') return;
  const [fc, tc] = ESPESSURA[c.colete.estilo] || [0, 0];
  const y = 8 + tc;                                      /* onde começam as costas livres */
  const yf = -.02 - fc;                                  /* superfície da frente onde passam as alças */
  const alcas = (larg, mat) => {
    for (const x of [2.15, 11.85 - larg]){
      cx(T, x, x + larg, yf - .42, yf, 4.4, 11.3, mat); cx(T, x, x + larg, yf, y + .1, 11.5, 11.95, mat);
      cx(T, x, x + larg, yf - .1, yf + .35, 11.2, 11.95, mat); cx(T, x, x + larg, y - .15, y + .35, 7.6, 11.8, mat);
      cx(T, x + larg * .3, x + larg * .7, yf - .52, yf - .42, 4.7, 10.8, mat.replace(/_sombra$/, '') + '_escuro'); fivela(cx, T, x + larg / 2, yf - .52, 5.4);
      cx(T, x + larg * .35, x + larg * .65, yf - .38, yf - .2, 2.2, 4.4, 'preto');
    }
    cx(T, 2.15 + larg, 11.85 - larg, yf - .68, yf - .48, 7.65, 8.05, 'preto'); fivela(cx, T, 7, yf - .68, 7.85);
  };
  if (tipo === 'urbana'){
    camada(cx, T, 2.6, 11.4, y, y + 3.5, .2, 9.4, 'mochila', camo, .7); camada(cx, T, 3.2, 10.8, y, y + 3.1, 9.4, 10.6, 'mochila', camo, .7);
    bolso(cx, T, 3.4, 10.6, y + 3.5, 1, 1, .7, 5.2, 'mochila', camo);
    cx(T, 3.5, 10.5, y + 3.5, y + 3.62, 7.4, 7.75, 'preto'); cx(T, 9.7, 10.1, y + 3.62, y + 3.85, 6.7, 7.6, 'metal');
    cx(T, 5.4, 8.6, y + .7, y + 1.3, 10.6, 11.35, 'preto'); cx(T, 6.2, 7.8, y + 3.5, y + 3.68, 8.4, 9.1, 'remendo');
    alcas(1.35, 'mochila_sombra');
  }
  if (tipo === 'militar'){
    camada(cx, T, 2.35, 11.65, y, y + 3.9, -.6, 8.8, 'mochila', camo, .6);
    camada(cx, T, 2.65, 11.35, y, y + 3.7, 8.8, 10.3, 'mochila', camo, .7);                       /* tampa */
    cx(T, 2.5, 11.5, y + 3.7, y + 4.15, 7.8, 9.35, 'mochila_sombra', camo);
    bolso(cx, T, 3.3, 10.7, y + 3.9, 1.45, 1, -.3, 4, 'mochila', camo);
    bolso(cx, T, 3.9, 10.1, y + 3.9, .8, 1, 5, 7.4, 'mochila', camo);
    for (const [a, b, fora] of [[.75, 2.45, .63], [11.55, 13.25, 13.25]]){                         /* bolsos laterais e cantil */
      cx(T, a, b, y + .5, y + 3.2, -.2, 4.2, 'mochila', camo); cx(T, a - .1, b + .1, y + .4, y + 3.3, 3.5, 4.6, 'mochila_sombra', camo);
      cx(T, a + .35, b - .35, y + .8, y + 2.9, 4.6, 5.9, 'cantil'); cx(T, a + .6, b - .6, y + 1.4, y + 2.3, 5.9, 6.5, 'preto');
      cx(T, Math.min(fora, fora - .12), Math.max(fora, fora - .12), y + 1.5, y + 2.1, 1.2, 2.6, 'preto');
    }
    for (const x of [3.35, 10.15]){ cx(T, x, x + .5, y + 4.15, y + 4.3, 4.3, 9.9, 'preto'); fivela(cx, T, x + .25, y + 4.3, 7.2, 1); cx(T, x, x + .5, y + .6, y + 4.3, 10.3, 10.48, 'preto'); }
    molle(cx, T, 4.2, 9.8, y + 5.35, 1, [.5, 1.7], 'mochila');
    cx(T, 5.5, 8.5, y + 4.7, y + 4.95, 5.7, 6.8, 'velcro'); cx(T, 6, 8, y + 4.95, y + 5.05, 5.9, 6.6, 'remendo');
    cx(T, 2, 12, y + .6, y + 3.4, -2.7, -.6, 'colete_sombra', camo); cx(T, 2.3, 11.7, y + 1, y + 3, -3.05, -2.7, 'colete_sombra', camo);   /* isolante enrolado */
    for (const x of [3.6, 9.8]) anel(cx, T, x, x + .55, y + .45, y + 3.55, -3.1, -.55, 'preto', false, .2);
    cx(T, 5.4, 8.6, y + .5, y + 1.1, 10.3, 11, 'preto');
    alcas(1.45, 'mochila_sombra');
  }
  if (tipo === 'expedicao'){
    for (const x of [2.9, 10.65]) cx(T, x, x + .45, y, y + .55, -4.4, 11.4, 'metal_escuro');            /* armação */
    cx(T, 2.9, 11.1, y, y + .55, -4.4, -3.95, 'metal_escuro');
    camada(cx, T, 2.2, 11.8, y + .35, y + 4.4, -2, 5.2, 'mochila', camo, .8); camada(cx, T, 2.5, 11.5, y + .35, y + 4.1, 5.2, 9.9, 'mochila', camo, .8);
    camada(cx, T, 2.9, 11.1, y + .35, y + 3.9, 9.9, 11.2, 'mochila_sombra', camo, .8);
    anel(cx, T, 2.1, 11.9, y + .25, y + 4.5, 4.95, 5.45, 'preto', false, .2);
    bolso(cx, T, 3.2, 10.8, y + 4.4, 1.35, 1, -1.5, 3.4, 'mochila', camo); bolso(cx, T, 3.8, 10.2, y + 4.1, .9, 1, 6.1, 9, 'mochila', camo);
    for (const [a, b] of [[.7, 2.35], [11.65, 13.3]]){ bolso(cx, T, a, b, y + .9, 2.4, 1, -1.6, 2.8, 'mochila', camo); }
    cx(T, 1.7, 12.3, y + .8, y + 4.2, -4.5, -2, 'saco'); cx(T, 1.4, 12.6, y + 1.3, y + 3.7, -4.2, -2.3, 'saco_sombra');         /* saco de dormir */
    for (const x of [3.8, 9.65]) anel(cx, T, x, x + .55, y + .65, y + 4.35, -4.65, -1.9, 'preto', false, .2);
    cx(T, 12.7, 13.9, y + 1.4, y + 2.8, 3.2, 6.4, 'cantil'); cx(T, 13, 13.6, y + 1.75, y + 2.45, 6.4, 7, 'preto');
    cx(T, .3, .65, y + 1.8, y + 2.2, .5, 9.2, 'madeira'); cx(T, 0, .95, y + 1.4, y + 2.6, 8.3, 9.6, 'metal_escuro');             /* ferramenta */
    alcas(1.5, 'mochila_sombra');
    const aperta = c.corpo === 'feminino' ? 1 : 0; anel(cx, 'cintura', -.45 + aperta, 10.45 - aperta, .5, 7.5, .6, 1.7, 'mochila_sombra', camo, .3);
  }
  if (tipo === 'improvisada'){
    camada(cx, T, 2.7, 11.3, y, y + 3.4, -.8, 6.4, 'mochila', camo, 1.1); camada(cx, T, 3.4, 10.6, y, y + 2.8, 6.4, 8.8, 'mochila', camo, 1);
    cx(T, 5, 9, y + .6, y + 2.2, 8.8, 9.7, 'mochila_sombra', camo); anel(cx, T, 4.8, 9.2, y + .4, y + 2.4, 8.75, 9.15, 'corda', false, .25);
    cx(T, 3.4, 6.2, y + 3.4, y + 3.62, 1, 3.6, 'couro'); cx(T, 7.8, 10, y + 3.4, y + 3.55, 3.8, 5.6, 'faixa_sombra');
    for (const [x, z] of [[3.5, 1.1], [5.7, 1.1], [3.5, 3.1], [5.7, 3.1]]) cx(T, x, x + .35, y + 3.62, y + 3.75, z, z + .35, 'corda');
    cx(T, 2.6, 11.4, y + 3.4, y + 3.65, 6, 6.45, 'corda');
    cx(T, 8.2, 11.4, y + 3.65, y + 4.4, -.4, 2.4, 'metal_escuro'); cx(T, 8.5, 11.1, y + 4.4, y + 4.55, -.1, 2.1, 'metal'); cx(T, 9.6, 10, y + 3.65, y + 3.9, 2.4, 6.2, 'preto');   /* frigideira */
    cx(T, 1.4, 12.6, y + .5, y + 2.9, 9.7, 11.3, 'saco');
    for (const x of [3.6, 10]) anel(cx, T, x, x + .45, y + .35, y + 3.05, 9.55, 11.45, 'corda', false, .2);
    alcas(1.15, 'couro');
  }
}

/* ---------------------------------------------------------------- cinto, proteções e luvas */
function equipaCorpo(c, cx){
  if (c.cinto.usa){
    const Q = 'quadril';
    anel(cx, Q, -.4, 12.4, .55, 7.45, 3.05, 4.75, 'cinto', false, .6);
    for (let x = .6; x < 12; x += 1.25) cx(Q, x, x + .25, .42, .55, 3.15, 4.65, 'cinto_escuro');
    cx(Q, 4.9, 7.1, .2, .55, 3.2, 4.6, 'preto'); cx(Q, 5.5, 6.5, .05, .2, 3.55, 4.25, 'metal');
    bolso(cx, Q, .5, 2.5, .55, .85, -1, 1.5, 4.2, 'cinto'); bolso(cx, Q, 2.8, 4.6, .55, .75, -1, 2.1, 4.2, 'cinto');
    bolso(cx, Q, 8.4, 11.5, .55, 1, -1, 1.3, 4.2, 'cinto');
    bolso(cx, Q, 1.2, 5.2, 7.45, 1.25, 1, 1.2, 4.3, 'cinto');
    cx(Q, 7.4, 10.4, 7.45, 8.9, .7, 3.9, 'cantil'); cx(Q, 7.8, 10, 8.9, 9.25, 1.1, 3.5, 'cantil'); cx(Q, 8.4, 9.4, 7.8, 8.7, 3.9, 4.8, 'preto');
    cx(Q, 7.25, 10.55, 7.4, 9.35, 2, 2.55, 'cinto_escuro');
  }
  if (c.bolsaPerna.usa){                                             /* bolsa presa na perna, por fora da coxa esquerda do boneco */
    const L = 'coxa_e';
    cx(L, 4, 5.35, 2.5, 5.5, 4.2, 8.6, 'cinto'); cx(L, 4.05, 5.5, 2.4, 5.6, 7.4, 8.75, 'cinto_sombra'); cx(L, 5.35, 5.75, 3, 5, 4.6, 6.6, 'cinto_sombra');
    cx(L, 5.5, 5.65, 3.7, 4.3, 7.6, 8.15, 'metal_escuro'); cx(L, 4.2, 4.55, 3.5, 4.5, 8.6, 12.2, 'preto');
    for (const z of [5, 7.7]) anel(cx, L, -.3, 4.3, 1.72, 6.28, z, z + .55, 'preto', false, .28);
  }
  if (c.joelheiras.usa){
    for (const P of ['canela_d', 'canela_e']){
      const [w, d, h] = ESTRUTURA[P].tam;
      for (const z of [h - 3.5, h - .95]) anel(cx, P, -.28, w + .28, -.28, d + .28, z, z + .5, 'preto', false, .28);
      cx(P, -.12, w + .12, -.85, -.1, h - 3.8, h + .1, 'joelheira'); cx(P, .3, w - .3, -1.35, -.85, h - 3.2, h - .5, 'joelheira_sombra');
      cx(P, .75, w - .75, -1.62, -1.35, h - 2.6, h - 1.1, 'joelheira_escuro');
      for (const x of [.1, w - .45]) for (const z of [h - 3.45, h - .6]) cx(P, x, x + .35, -.98, -.85, z, z + .35, 'metal_escuro');
    }
  }
  if (c.cotoveleiras.usa){
    for (const P of ['antebraco_d', 'antebraco_e']){
      const [w, d, h] = ESTRUTURA[P].tam;
      for (const z of [h - 3.2, h - .9]) anel(cx, P, -.24, w + .24, -.24, d + .24, z, z + .45, 'preto', false, .24);
      cx(P, -.1, w + .1, d + .1, d + .8, h - 3.4, h + .2, 'joelheira'); cx(P, .35, w - .35, d + .8, d + 1.25, h - 2.8, h - .4, 'joelheira_sombra');
      cx(P, .8, w - .8, d + 1.25, d + 1.45, h - 2.2, h - 1, 'joelheira_escuro');
    }
  }
  if (c.luvas.estilo === 'taticas'){
    for (const [P, fora] of [['mao_d', -1], ['mao_e', 1]]){
      const [w, d, h] = ESTRUTURA[P].tam, face = fora < 0 ? 0 : w;
      const lado = (a, b) => [Math.min(face + fora * a, face + fora * b), Math.max(face + fora * a, face + fora * b)];
      anel(cx, P, -.22, w + .22, -.22, d + .22, h - .85, h + .15, 'luva_escuro', false, .24);
      cx(P, ...lado(0, .42), .5, d - .5, .55, 1.75, 'preto');                                   /* protetor das juntas */
      for (let y = .75; y < d - .9; y += 1.05) cx(P, ...lado(.42, .68), y, y + .7, .75, 1.55, 'luva_escuro');
      cx(P, ...lado(0, .2), .9, d - .9, 2.1, 2.9, 'luva_claro');
      cx(P, ...lado(.15, .4), d / 2 - .55, d / 2 + .55, h - .75, h + .05, 'metal_escuro');
    }
  }
}

function equipar(c, cx){
  equipaCabeca(c, cx); equipaColete(c, cx); equipaMochila(c, cx); equipaCorpo(c, cx);
}
