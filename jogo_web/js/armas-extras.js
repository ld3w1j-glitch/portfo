/* Mais armas, já detalhadas. Mesmo sistema de caixas: b(u0, u1, v0, v1, w0, w1, material).
   Arte própria e só a aparência por fora; as de fogo não têm mecanismo nem instrução de montagem.
   Carregado depois de armas-detalhes.js e antes de modelo.js. */
Object.assign(ARMA_CORES, {a_violao:'#B9743A', a_violao_tampo:'#D9A55E', a_laranja:'#D9641E'});

(() => {
  const par = (a, c) => a < c ? [a, c] : [c, a];
  /* detalhe colado dos dois lados de uma peça de meia largura v */
  const nos2 = (b, u0, u1, w0, w1, v, mat, e = .09) => { for (const s of [-1, 1]) b(u0, u1, ...par(s * v, s * (v + e)), w0, w1, mat); };
  const prego = (b, u, w, v, mat = 'a_aco') => nos2(b, u, u + .42, w, w + .42, v, mat, .12);
  const fios = (b, u0, u1, w0, w1, v, mat = 'a_veio') => { for (let i = 0; i < Math.max(2, Math.round((u1 - u0) * .55)); i++){ const c = .6 + (i % 3) * .5, u = u0 + .1 + ((i * 2.37) % Math.max(.3, u1 - u0 - c - .2)), w = w0 + .1 + ((i * .83) % Math.max(.2, w1 - w0 - .3)); nos2(b, u, u + c, w, w + .11, v, mat, .045); } };
  const tira = (b, u, w, v, mat, c = 1.7) => { b(u, u + .55, -v - .14, -v, w - c, w, mat); b(u + .3, u + .8, -v - .16, -v - .02, w - c - .5, w - c + .2, mat); };
  const cabo = (b, u0, u1, r, mat, fita) => { haste_(b, u0, u1, r, mat); fios(b, 4.4, u1 - 1, -r * .7, r * .7, r); enrola_(b, -3.6, 3.4, r, fita); };

  Object.assign(ARMAS, {
    /* ================================================ pancada */
    corrente:{nome:'Corrente com cadeado', tipo:'pancada', materiais:['Corrente de portão', 'Cadeado grande', 'Fita'], desenhar(b){
      haste_(b, -3.4, 3.4, .62, 'a_couro'); enrola_(b, -3.2, 3, .62, 'a_preto');
      /* elos alternando deitados e em pé, caindo em curva */
      let w = 0;
      for (let i = 0; i < 11; i++){
        const u = 3.2 + i * 1.35, cai = Math.round(i * i * .05 * 10) / 10; w = -cai;
        if (i % 2){ b(u, u + 1.7, -.75, -.35, w - .3, w + .3, 'a_ferro'); b(u, u + 1.7, .35, .75, w - .3, w + .3, 'a_ferro'); b(u, u + .4, -.75, .75, w - .3, w + .3, 'a_ferro'); b(u + 1.3, u + 1.7, -.75, .75, w - .3, w + .3, 'a_ferro'); }
        else { b(u, u + 1.7, -.3, .3, w + .35, w + .8, 'a_metal'); b(u, u + 1.7, -.3, .3, w - .8, w - .35, 'a_metal'); b(u, u + .4, -.3, .3, w - .8, w + .8, 'a_metal'); b(u + 1.3, u + 1.7, -.3, .3, w - .8, w + .8, 'a_metal'); }
      }
      b(18, 21.4, -1.15, 1.15, w - 2.2, w + 1.2, 'a_latao'); b(18.2, 21.2, -1.25, 1.25, w - 1.5, w - 1.1, 'a_ferrugem'); nos2(b, 19.4, 20, w - .5, w + .3, 1.15, 'a_preto');
      prego(b, 18.4, w + .4, 1.15); prego(b, 20.6, w - 2, 1.15);
    }},
    violao:{nome:'Violão rachado', tipo:'pancada', materiais:['Violão velho', 'Fita', 'Arame no lugar das cordas'], desenhar(b){
      b(-4.5, 11, -.55, .55, -.7, .7, 'a_madeira2'); b(-6.8, -4.5, -.5, .5, -1.1, 1.1, 'a_madeira2');
      for (const u of [-6.2, -5.2]) for (const s of [-1, 1]) b(u, u + .5, -.2, .2, ...par(s * 1.1, s * 1.7), 'a_aco');           /* tarraxas */
      for (let u = -3.6; u < 10.6; u += 1.2) nos2(b, u, u + .16, -.7, .7, .55, 'a_metal', .07);                                    /* trastes */
      for (const [u0, u1, r] of [[11, 12.6, 3.2], [12.6, 15, 4.4], [15, 16.6, 3.3], [16.6, 18.4, 4.6], [18.4, 21.6, 5.6], [21.6, 23.4, 4.2]]) b(u0, u1, -1.5, 1.5, -r, r, 'a_violao');
      b(13, 22.4, 1.5, 1.66, -2.9, 2.9, 'a_violao_tampo'); b(15.6, 18.2, 1.66, 1.74, -1.4, 1.4, 'a_preto'); b(20.2, 21, 1.66, 1.9, -2, 2, 'a_couro');
      for (const w of [-.7, -.2, .3, .75]) b(-4.4, 20.4, 1.9, 1.98, w, w + .08, 'a_aco');
      b(-4.4, -3.9, .55, 1.98, -.8, .85, 'a_aco'); b(12.8, 13.2, .55, 1.98, -.8, .85, 'a_aco'); b(20.2, 20.6, 1.66, 1.98, -.8, .85, 'a_aco');
      for (const [u, w] of [[19, 2.9], [19.8, 3.6], [20.4, 2.6], [21.4, 4.1]]) b(u, u + .9, 1.5, 1.72, w, w + .35, 'a_preto');    /* rachadura */
      b(17.2, 18.4, -1.75, 1.75, -4.8, 4.8, 'a_fita'); tira(b, 17.4, -4.7, 1.2, 'a_fita');
    }},
    maca_engrenagem:{nome:'Porrete de engrenagem', tipo:'pancada', materiais:['Cabo de marreta', 'Engrenagem de motor', 'Arame'], desenhar(b){
      cabo(b, -6, 17, .64, 'a_madeira2', 'a_couro'); haste_(b, -6.9, -6, .9, 'a_ferro');
      for (const [u0, u1, r] of [[12.4, 13.6, 2.4], [13.6, 17.8, 3.5], [17.8, 19, 2.4]]) b(u0, u1, -1.05, 1.05, -r, r, 'a_ferro');
      for (const u of [13.9, 16.3]) for (const s of [-1, 1]) b(u, u + 1.2, -.95, .95, ...par(s * 3.5, s * 4.9), 'a_metal');
      for (const s of [-1, 1]){ b(11.2, 12.4, -.95, .95, ...par(s * .9, s * 2), 'a_metal'); b(19, 20.2, -.95, .95, ...par(s * .9, s * 2), 'a_metal'); }
      nos2(b, 14.6, 16.8, -1.2, 1.2, 1.05, 'a_sombra'); nos2(b, 15.2, 16.2, -.5, .5, 1.14, 'a_aco', .1);
      for (const [u, w] of [[13.8, 2.3], [17, -2.8], [13.9, -2.4], [17, 2.2]]) prego(b, u, w, 1.05);
      nos2(b, 15.8, 17.4, 2.3, 2.9, 1.05, 'a_ferrugem'); enrola_(b, 9.4, 12.4, .64, 'a_aco', .7, .26);
    }},
    remo:{nome:'Remo quebrado', tipo:'pancada', materiais:['Remo de barco', 'Fita'], desenhar(b){
      cabo(b, -8, 14, .6, 'a_madeira', 'a_lona'); b(-9.4, -8, -.6, .6, -1.6, 1.6, 'a_madeira2');
      b(13.4, 16, -.42, .42, -1.9, 1.9, 'a_madeira'); b(16, 25, -.36, .36, -3.4, 3.4, 'a_madeira'); b(25, 27, -.34, .34, -3.4, .6, 'a_madeira'); b(25, 26, -.34, .34, 1.8, 3.4, 'a_madeira'); b(27, 28.4, -.3, .3, -2.4, -.8, 'a_madeira');
      nos2(b, 17.4, 24.8, -.2, .2, .36, 'a_madeira2'); b(18.4, 21, -.48, .48, -3.5, 3.5, 'a_branco'); b(21.2, 22.2, -.47, .47, -3.45, 3.45, 'a_vermelho');
      fios(b, 16.4, 24, -3, -1, .36); fios(b, 22.6, 26.6, -2.8, 3, .36, 'a_madeira2'); enrola_(b, 12, 14, .6, 'a_fita'); tira(b, 12.4, -.4, .76, 'a_fita');
      prego(b, 14.4, -1.2, .42); prego(b, 14.4, .8, .42);
    }},
    /* ================================================ corte */
    machado_bombeiro:{nome:'Machado de bombeiro', tipo:'corte', materiais:['Machado achado em caixa de incêndio'], desenhar(b){
      haste_(b, -7, 18, .62, 'a_amarelo'); haste_(b, -8, -7, .85, 'a_preto'); enrola_(b, -4.4, 3.4, .62, 'a_borracha');
      b(14.6, 19, -.62, .62, -1.1, 1.1, 'a_vermelho'); b(15, 18.4, -.45, .45, -3.2, -1.1, 'a_vermelho'); b(14.2, 19.4, -.36, .36, -5, -3.2, 'a_vermelho');
      b(13.6, 20, -.28, .28, -6.2, -5, 'a_metal'); b(13.4, 20.2, -.2, .2, -6.8, -6.2, 'a_aco');
      b(15.8, 17.8, -.42, .42, 1.1, 2.6, 'a_vermelho'); b(16.2, 17.4, -.32, .32, 2.6, 3.8, 'a_vermelho'); b(16.5, 17.1, -.22, .22, 3.8, 4.9, 'a_metal');
      nos2(b, 15.4, 18, -2.6, -2.3, .45, 'a_branco'); prego(b, 15.2, -.2, .62); prego(b, 17.8, -.2, .62);
      for (const [u, w] of [[14.8, -4.4], [18, -3.9]]) nos2(b, u, u + .9, w, w + .45, .36, 'a_ferrugem', .06);
      for (const u of [6, 8, 10]) haste_(b, u, u + .5, .66, 'a_preto'); tira(b, -4, -.5, .8, 'a_borracha');
    }},
    foice:{nome:'Foice de roça', tipo:'corte', materiais:['Foice velha', 'Cabo de madeira', 'Arame'], desenhar(b){
      cabo(b, -6, 14, .6, 'a_madeira2', 'a_couro'); haste_(b, -6.8, -6, .8, 'a_madeira'); haste_(b, 12.6, 15.4, .82, 'a_ferro');
      /* lâmina curva em degraus */
      for (const [u0, u1, w0, w1] of [[14.6, 16.6, -.4, 1.2], [16, 18.2, .6, 2.6], [17, 19.2, 2.2, 4.6], [17, 19, 4.4, 6.4], [15.8, 18, 6, 7.8], [13.8, 16.4, 7.2, 8.6], [11.6, 14.2, 7.4, 8.4], [10, 12, 7, 7.8]]) b(u0, u1, -.2, .2, w0, w1, 'a_ferro');
      for (const [u0, u1, w0, w1] of [[18.2, 18.6, .8, 2.4], [19.2, 19.6, 2.4, 4.6], [19, 19.4, 4.6, 6.2], [18, 18.4, 6.2, 7.6]]) b(u0, u1, -.12, .12, w0, w1, 'a_aco');
      for (const [u, w] of [[17.4, 3], [16.4, 6.6], [12.4, 7.6]]) nos2(b, u, u + .9, w, w + .45, .2, 'a_ferrugem', .06);
      prego(b, 13.2, -.2, .82); prego(b, 14.5, -.2, .82); enrola_(b, 10.2, 12.4, .6, 'a_aco', .6, .24); tira(b, -3.4, -.5, .75, 'a_couro');
    }},
    enxada:{nome:'Enxada afiada', tipo:'corte', materiais:['Enxada', 'Pedra de amolar'], desenhar(b){
      cabo(b, -8, 19, .62, 'a_madeira', 'a_pano'); haste_(b, -8.8, -8, .8, 'a_madeira2'); haste_(b, 16.6, 19.8, .95, 'a_ferro');
      b(17.4, 19.2, -1.2, 1.2, -2.2, -.8, 'a_ferro'); b(17.6, 18.8, -3, 3, -4.4, -2.2, 'a_ferro'); b(17.7, 18.7, -3.5, 3.5, -7, -4.4, 'a_ferro'); b(17.8, 18.6, -3.5, 3.5, -7.8, -7, 'a_aco');
      b(19.6, 20.4, -.5, .5, -.5, .5, 'a_madeira2'); b(18.7, 18.82, -2.6, -.6, -6.2, -5, 'a_ferrugem'); b(17.58, 17.7, .8, 2.8, -5.4, -3.4, 'a_veio');
      for (const v of [-2.4, 0, 2.4]) b(17.58, 17.72, v - .25, v + .25, -7.6, -7.1, 'a_gasto');
      prego(b, 17.9, -.2, .95); enrola_(b, 14.4, 16.6, .62, 'a_corda', .6, .4); tira(b, 14.8, -.5, .8, 'a_corda', 2);
    }},
    serrote:{nome:'Serrote enferrujado', tipo:'corte', materiais:['Serrote velho', 'Fita'], desenhar(b){
      b(-2.8, -1.4, -.6, .6, -2.4, 2.6, 'a_madeira'); b(-1.4, 2.6, -.6, .6, 1.3, 2.6, 'a_madeira'); b(-1.4, 2.6, -.6, .6, -2.4, -1.2, 'a_madeira'); b(1.4, 3.6, -.6, .6, -1.2, 1.3, 'a_madeira'); b(-.8, .8, -.55, .55, -1.2, 1.3, 'a_madeira2');
      for (const [u0, u1, w0, w1] of [[3.4, 8, -2.2, 2.3], [8, 13, -1.9, 2.1], [13, 18, -1.6, 1.8], [18, 21, -1.3, 1.4]]) b(u0, u1, -.14, .14, w0, w1, 'a_metal');
      for (let u = 4; u < 20.4; u += 1.1){ const base = u < 8 ? -2.2 : u < 13 ? -1.9 : u < 18 ? -1.6 : -1.3; b(u, u + .55, -.12, .12, base - .6, base, 'a_aco'); b(u + .1, u + .35, -.1, .1, base - 1, base - .55, 'a_aco'); }
      nos2(b, 4, 20, 1, 1.18, .14, 'a_ferro', .06); for (const [u, w] of [[6, -.8], [11.4, .1], [15.6, -.6], [18.6, .4]]) nos2(b, u, u + 1.4, w, w + .6, .14, 'a_ferrugem', .06);
      for (const [u, w] of [[2.2, -.9], [2.2, .7], [-2.3, 1.7]]) prego(b, u, w, .6, 'a_latao'); b(-2.95, -2.8, -.7, .7, -1.2, .4, 'a_fita'); nos2(b, -2.8, -1.4, -1.2, .4, .6, 'a_fita');
    }},
    /* ================================================ haste e distância */
    forcado:{nome:'Forcado de roça', tipo:'longe', vertical:true, materiais:['Forcado velho'], desenhar(b){
      haste_(b, -21, 24, .56, 'a_madeira'); haste_(b, -22, -21, .75, 'a_ferro'); fios(b, -19, -5, -.4, .4, .56); fios(b, 5, 21, -.4, .4, .56);
      enrola_(b, -3.4, 3.4, .56, 'a_couro'); haste_(b, 22.6, 26, .82, 'a_ferro');
      b(25.6, 27, -4.2, 4.2, -.45, .45, 'a_ferro');
      for (const v of [-4, -1.35, 1.35, 4]){ b(26.6, 33, v - .32, v + .32, -.3, .3, 'a_metal'); b(33, 35.6, v - .22, v + .22, -.22, .22, 'a_metal'); b(35.6, 36.8, v - .13, v + .13, -.13, .13, 'a_aco'); }
      b(25.8, 26.8, -4.35, -3.4, -.55, .55, 'a_ferrugem'); b(28, 29.6, 1.0, 1.7, -.36, .36, 'a_ferrugem'); b(23.4, 23.8, -.9, .9, -.9, .9, 'a_aco');
      enrola_(b, 19.6, 22.6, .56, 'a_corda', .6, .4); tira(b, 20, -.4, .75, 'a_pano', 2.4);
    }},
    besta_improvisada:{nome:'Besta improvisada', tipo:'longe', longa:true, baixa:true, materiais:['Peças achadas no caminho (receita do jogo a definir)'], desenhar(b){
      b(-9, 12, -.7, .7, 1.3, 2.8, 'a_tabua'); b(-13, -9, -.62, .62, -.4, 2.8, 'a_madeira2'); fios(b, -8.6, 11.4, 1.4, 2.7, .7);
      punho_(b, 'a_madeira2', 0, 1.4, 4.2); guarda_(b, 0, 1.35, 'a_ferro');
      b(11.4, 12.8, -1, 1, 1, 3.2, 'a_ferro');
      for (const s of [-1, 1]) [[1, 3.4, 11.4, 12.6], [3.4, 5.6, 10.6, 11.8], [5.6, 7.6, 9.4, 10.6]].forEach(([v0, v1, u0, u1], i) => b(u0, u1, ...par(s * v0, s * v1), 1.7, 2.5, i % 2 ? 'a_madeira' : 'a_cinta'));
      for (const s of [-1, 1]) for (let i = 0; i < 6; i++){ const t = i / 6, u = 9.6 - t * 6, v = 7.4 * (1 - t); b(u - 1.05, u + .05, ...par(s * v, s * (v - 1.3)), 2.7, 2.86, 'a_corda'); }
      for (const s of [-1, 1]) b(9.4, 10.2, ...par(s * 7.1, s * 7.6), 1.7, 2.9, 'a_corda');
      b(2.8, 15, -.14, .14, 2.86, 3.14, 'a_madeira'); b(15, 16.4, -.28, .28, 2.82, 3.2, 'a_ferro'); for (const s of [-1, 1]) b(3, 4.4, ...par(s * .14, s * .6), 2.96, 3.04, 'a_branco');
      atadura_(b, 10, 11.4, .7, 1.3, 2.8); atadura_(b, -9.6, -8.4, .7, 1.3, 2.8, 'a_preto'); parafuso_(b, -6, 1.8, .7); parafuso_(b, 6, 1.8, .7); tira(b, -9.4, 1.4, .86, 'a_fita', 2);
    }},
    /* ================================================ militares inteiras */
    fuzil_ferrolho:{nome:'Fuzil antigo de ferrolho', tipo:'militar', longa:true, desenhar(b){
      b(-4, 7, -.68, .68, 1.2, 3, 'a_nogueira'); b(7, 17, -.62, .62, 1.7, 3, 'a_nogueira'); b(-3, 6, -.4, .4, 3, 3.6, 'a_aco_escuro');
      b(6, 28, -.32, .32, 2.85, 3.45, 'a_aco_escuro'); b(28, 28.14, -.4, .4, 2.75, 3.55, 'a_metal');
      b(25.6, 26.2, -.14, .14, 3.45, 4.7, 'a_preto'); b(3.8, 5.4, -.4, .4, 3.6, 4.3, 'a_preto');
      b(1.2, 1.9, .4, 2.1, 3.0, 3.5, 'a_metal'); b(1.1, 2, 1.9, 2.6, 2.5, 3.2, 'a_metal');
      punho_(b, 'a_nogueira', -.3, 1.3, 3.4); guarda_(b, 0, 1.25, 'a_ferro'); b(3.6, 5.8, -.5, .5, .3, 1.25, 'a_aco_escuro');
      for (const [u0, u1, w0, w1] of [[-7, -4, .8, 2.9], [-10.4, -7, -.1, 2.7], [-14, -10.4, -1, 2.5]]) b(u0, u1, -.62, .62, w0, w1, 'a_nogueira');
      b(-14.7, -14, -.68, .68, -1.2, 2.6, 'a_ferro');
      for (const u of [8.4, 15.4]){ b(u, u + .6, -.72, .72, 1.6, 3.55, 'a_ferro'); }
      fios(b, 9.2, 15, 1.8, 2.8, .62); fios(b, -13.6, -4.4, .2, 2.2, .62); prego(b, -2.6, 1.7, .68); prego(b, 4.6, 1.7, .68, 'a_latao'); nos2(b, -3.6, 6.4, 2.9, 3.02, .68, 'a_sombra', .06);
      for (let i = 0; i < 24; i++){ const t = i / 23, u = -12 + 28 * t, w = -.6 + 2.2 * t - 11.2 * t * (1 - t); b(u - .62, u + .62, -1.16, -.96, w - .2, w + .2, 'a_couro'); }
      b(-12.4, -11.6, -1.16, -.6, -.8, -.4, 'a_aco'); b(15.6, 16.4, -1.16, -.6, 1.4, 1.8, 'a_aco');
    }},
    pistola_sinalizadora:{nome:'Pistola sinalizadora', tipo:'militar', longa:false, desenhar(b){
      b(-1.6, 1.8, -.7, .7, 1.1, 3.6, 'a_aco_escuro'); b(1.8, 7, -1.15, 1.15, 1.7, 3.9, 'a_laranja'); b(7, 7.6, -1.3, 1.3, 1.55, 4.05, 'a_ferro'); b(7.6, 7.72, -.75, .75, 2.2, 3.4, 'a_sombra');
      b(-2.3, -1.6, -.28, .28, 2.9, 4.2, 'a_ferro'); b(5.8, 6.3, -.18, .18, 3.9, 4.4, 'a_preto'); punho_(b, 'a_polimero', .1, 1.2, 4.2, .72); guarda_(b, .1, 1.75, 'a_ferro');
      nos2(b, 2.6, 6.2, 2.5, 2.8, 1.15, 'a_branco'); nos2(b, 1.9, 2.4, 1.8, 3.8, 1.15, 'a_aco_escuro'); prego(b, -.4, 1.6, .7); prego(b, .8, 2.8, .7);
      for (let i = 0; i < 3; i++) nos2(b, -1.15 - i * .5, -.1 - i * .5, -1 - i * 1.05, -.55 - i * 1.05, .72, 'a_sombra');
    }},
    machadinha_tatica:{nome:'Machadinha tática', tipo:'militar', longa:false, branca:true, desenhar(b){
      haste_(b, -4.8, 12.6, .55, 'a_polimero'); for (let u = -3.6; u < 3.2; u += .9) haste_(b, u, u + .36, .7, 'a_preto'); haste_(b, -5.6, -4.8, .74, 'a_ferro');
      b(10, 13.8, -.42, .42, -1.2, 1.2, 'a_aco_escuro'); b(10.4, 13.4, -.26, .26, -3.6, -1.2, 'a_aco_escuro'); b(9.6, 14.2, -.2, .2, -4.8, -3.6, 'a_aco_escuro'); b(9.4, 14.4, -.13, .13, -5.3, -4.8, 'a_aco');
      b(11.2, 12.6, -.28, .28, 1.2, 2.8, 'a_aco_escuro'); b(11.6, 12.2, -.18, .18, 2.8, 4.2, 'a_metal');
      nos2(b, 11.2, 12.6, -3, -2, .26, 'a_sombra'); prego(b, 10.4, -.2, .42, 'a_metal'); prego(b, 12.8, -.2, .42, 'a_metal'); nos2(b, 6, 8.6, -.18, .18, .55, 'a_caqui');
      b(-6.2, -5.4, -.2, .2, -.5, .5, 'a_metal'); b(-6.6, -6, -.16, .16, -2.8, -.3, 'a_lona'); b(-7, -6.1, -.2, .2, -3.4, -2.7, 'a_lona');
    }},
    besta_tatica:{nome:'Besta tática', tipo:'militar', longa:true, branca:false, desenhar(b){
      b(-5, 11.6, -.7, .7, 1.3, 3.1, 'a_polimero'); b(-6.4, -5, -.4, .4, 1.9, 3, 'a_ferro'); b(-13, -6.4, -.62, .62, .2, 3.1, 'a_caqui'); b(-13.8, -13, -.7, .7, 0, 3.3, 'a_preto');
      punho_(b, 'a_caqui', 0, 1.4, 4.2); guarda_(b, 0, 1.35, 'a_polimero'); b(4.4, 6.4, -.6, .6, -2, 1.35, 'a_caqui');
      b(11, 13, -1.1, 1.1, 1.2, 3.3, 'a_aco_escuro'); b(12.6, 15, -.2, .2, 1.2, 1.7, 'a_ferro'); b(14.6, 15.4, -1.8, 1.8, 1.2, 1.7, 'a_ferro');
      for (const s of [-1, 1]){
        [[1.1, 3.4, 10.9, 12.2], [3.4, 5.6, 10, 11.3], [5.6, 7.4, 8.8, 10.2]].forEach(([v0, v1, u0, u1]) => b(u0, u1, ...par(s * v0, s * v1), 2, 2.8, 'a_aco_escuro'));
        b(8.4, 10.2, ...par(s * 7, s * 8), 1.6, 3.2, 'a_ferro'); b(8.9, 9.7, ...par(s * 8, s * 8.2), 2, 2.8, 'a_aco');
        for (let i = 0; i < 6; i++){ const t = i / 6, u = 9 - t * 6.4, v = 7.2 * (1 - t); b(u - 1.1, u + .05, ...par(s * v, s * (v - 1.25)), 3.1, 3.24, 'a_sombra'); }
        b(8.4, 9.2, ...par(s * 6.9, s * 7.2), 2.9, 3.24, 'a_sombra');
      }
      b(2.2, 14, -.14, .14, 3.24, 3.52, 'a_metal'); b(14, 15.2, -.26, .26, 3.2, 3.56, 'a_aco_escuro'); for (const s of [-1, 1]) b(2.4, 3.8, ...par(s * .14, s * .55), 3.34, 3.42, 'a_laranja');
      b(-2.4, .4, -.5, .5, 3.1, 4.2, 'a_preto'); mira_(b, -2.6, 1.6, 4.9, 'a_aco_escuro');
      for (let u = 4; u < 10.6; u += .75) nos2(b, u, u + .36, 1.5, 1.8, .7, 'a_sombra'); prego(b, -3.8, 1.8, .7, 'a_metal'); prego(b, 8, 2.3, .7, 'a_metal'); nos2(b, -12, -8, 1.7, 2.1, .62, 'a_sombra');
    }},
    /* ================================================ gambiarra */
    gamb_guardachuva:{nome:'Carabina de guarda-chuva (gambiarra)', tipo:'gambiarra', longa:true, desenhar(b){
      b(-4.6, 6, -.75, .75, 1.1, 3.2, 'a_madeira'); b(6, 12, -.6, .6, 1.6, 2.7, 'a_tabua'); b(4, 17.4, -.34, .34, 2.65, 3.35, 'a_metal'); b(17.4, 23.4, -.28, .28, 2.9, 3.5, 'a_ferrugem'); b(23.4, 24.2, -.46, .46, 2.7, 3.7, 'a_preto');
      punho_(b, 'a_tabua', 0, 1.2, 4); guarda_(b, 0, 1.15, 'a_ferrugem');
      /* a "coronha" é o cabo curvo de um guarda-chuva */
      b(-11.6, -4.6, -.34, .34, 2, 2.7, 'a_preto'); b(-13.2, -11.2, -.45, .45, 1.8, 2.9, 'a_couro'); b(-14.2, -13, -.45, .45, -.2, 2.5, 'a_couro'); b(-13.4, -11.2, -.45, .45, -1.2, 0, 'a_couro'); b(-11.4, -10.4, -.45, .45, -.8, .8, 'a_couro');
      for (const s of [-1, 1]) b(-9.4, -4.4, ...par(s * .34, s * .56), 2.5, 2.66, 'a_aco');
      b(-.8, 4.4, -.55, .55, 3.2, 3.9, 'a_lona'); atadura_(b, .2, 1, .75, 1.1, 3.9, 'a_corda'); atadura_(b, 3, 3.8, .75, 1.1, 3.9, 'a_corda');
      atadura_(b, 11, 12.6, .6, 1.6, 3.35); atadura_(b, 16.8, 18, .34, 2.65, 3.5, 'a_preto'); atadura_(b, -5.4, -4.2, .75, 1.1, 3.2, 'a_cinta');
      b(21.8, 22.2, -.1, .1, 3.5, 4.9, 'a_aco'); fios(b, -4.2, 5.4, 1.2, 3.1, .75); parafuso_(b, -2.8, 1.5, .75); parafuso_(b, 8.4, 1.9, .6);
      b(6.6, 9.4, -.74, -.6, 1.8, 2.5, 'a_vermelho'); b(7.2, 8.8, -.8, -.74, 2, 2.3, 'a_branco'); tira(b, 11.4, 1.6, .76, 'a_fita', 2.4); tira(b, -5.2, 1.1, .9, 'a_pano', 2.2);
    }},
  });
})();
Object.assign(NOMES_ARMAS, Object.fromEntries(Object.entries(ARMAS).map(([k, v]) => [k, v.nome])));
NOTA_NO_JOGO.branca = 'Raríssima. Ideia para o jogo: equipamento militar que resiste mais que o improvisado.';
