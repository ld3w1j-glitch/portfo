/* Segunda camada das armas: só acabamento por fora (textura, veios, parafusos, desgaste, correias e enfeites).
   Cada arma desenha a forma base (armas.js e armas-fogo.js) e depois os detalhes daqui.
   Para voltar ao visual simples, basta tirar este script das páginas. Carregado antes de modelo.js. */
(() => {
  Object.assign(ARMA_CORES, {a_veio:'#5A3A22', a_veio_claro:'#C69A66', a_gasto:'#E4E8EC', a_sombra:'#17181B', a_ferrugem2:'#B5662F',
    a_pano:'#8E3B33', a_pano2:'#6F7A84', a_fita_escura:'#9E9886', a_tinta:'#D9D4C2', a_cobre:'#B9733F', a_brilho:'#6B727C'});

  /* ---------------------------------------------------------------- ferramentas de acabamento
     "v" é a meia largura da peça: o detalhe é colado por fora, dos dois lados */
  const ordem = (a, c) => a < c ? [a, c] : [c, a];
  const lado = (b, u0, u1, w0, w1, v, mat, e = .09, quais = [-1, 1]) => { for (const s of quais) b(u0, u1, ...ordem(s * v, s * (v + e)), w0, w1, mat); };
  const pino = (b, u, w, v, mat = 'a_aco') => { lado(b, u, u + .42, w, w + .42, v, mat, .12); lado(b, u + .14, u + .28, w + .14, w + .28, v + .12, 'a_sombra', .05); };
  const pinos = (b, lista, v, mat) => lista.forEach(([u, w]) => pino(b, u, w, v, mat));
  /* linha de encaixe entre duas peças */
  const friso = (b, u0, u1, w, v, mat = 'a_sombra') => { lado(b, u0, u1, w, w + .15, v, mat, .06); lado(b, u0, u1, w + .15, w + .23, v, 'a_brilho', .07); };
  const risco = (b, u, w, v, c = .7, mat = 'a_gasto', q) => lado(b, u, u + c, w, w + .09, v, mat, .05, q);
  /* desgaste: lascas claras ao longo de uma quina */
  const gasto = (b, u0, u1, w, v, passo = 2.3, mat = 'a_gasto') => { for (let u = u0, i = 0; u < u1 - .3; u += passo, i++) risco(b, u + (i % 3) * .4, w, v, .3 + (i % 2) * .45, mat); };
  const mancha = (b, u, w, v, q) => { lado(b, u, u + .7, w, w + .45, v, 'a_ferrugem2', .07, q); lado(b, u + .5, u + 1.1, w - .3, w + .1, v, 'a_ferrugem', .06, q); };
  /* veios da madeira: riscos escuros e claros, sempre nos mesmos lugares */
  const veios = (b, u0, u1, w0, w1, v) => {
    const comp = u1 - u0, alt = w1 - w0;
    for (let i = 0; i < Math.max(3, Math.round(comp * .8)); i++){
      const c = .7 + (i % 3) * .55, u = u0 + .2 + ((i * 2.37) % Math.max(.3, comp - c - .4)), w = w0 + .15 + ((i * .83) % Math.max(.2, alt - .4));
      lado(b, u, u + c, w, w + .11, v, i % 3 === 2 ? 'a_veio_claro' : 'a_veio', .045);
    }
    lado(b, u0 + comp * .62, u0 + comp * .62 + .38, w0 + alt * .42, w0 + alt * .42 + .38, v, 'a_veio', .07);   /* nó */
  };
  /* textura antiderrapante na empunhadura inclinada */
  const xadrez = (b, u, topo, alt, v, mat) => { for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++){ const w = topo - (i + .28) * alt / 4, x = u - .72 - i * .42 + k * .55; lado(b, x, x + .26, w - .26, w, v, mat, .09); lado(b, x + .27, x + .5, w - .62, w - .38, v, mat, .09); } };
  const dorso = (b, u, topo, alt, v, mat) => { for (let i = 0; i < 4; i++) for (const d of [.2, .65]){ const w = topo - (i + d) * alt / 4; b(u - 1.27 - i * .42, u - 1.14 - i * .42, -v * .8, v * .8, w - .22, w, mat); } };
  /* trilho com dentes em cima da arma */
  const trilho = (b, u0, u1, w, v = .42, mat = 'a_sombra') => { for (let u = u0; u < u1 - .3; u += .72) b(u, u + .36, -v, v, w, w + .24, mat); };
  /* boca do cano: aro e o furo escuro, só de enfeite */
  const boca = (b, u, w, r) => { b(u, u + .14, -r, r, w - r, w + r, 'a_metal'); b(u + .14, u + .2, -r * .55, r * .55, w - r * .55, w + r * .55, 'a_sombra'); };
  const ranhuras = (b, u0, n, passo, w0, w1, v, mat = 'a_sombra') => { for (let i = 0; i < n; i++) lado(b, u0 + i * passo, u0 + i * passo + passo * .45, w0, w1, v, mat, .07); };
  /* argola presa à arma */
  const argola = (b, u, w, v) => { b(u, u + .7, -v - .3, -v, w - .12, w + .12, 'a_aco'); b(u, u + .16, -v - .3, -v, w - .55, w, 'a_aco'); b(u + .54, u + .7, -v - .3, -v, w - .55, w, 'a_aco'); b(u, u + .7, -v - .3, -v, w - .68, w - .5, 'a_aco'); };
  /* correia pendurada entre dois pontos [u, w], por fora de um dos lados */
  const correia = (b, a, c, v, mat = 'a_preto', folga = 2.6) => {
    argola(b, a[0] - .35, a[1], v); argola(b, c[0] - .35, c[1], v);
    const n = 40, ponto = t => [a[0] + (c[0] - a[0]) * t, a[1] - .55 + (c[1] - a[1]) * t - folga * 4 * t * (1 - t)];
    for (let i = 0; i < n; i++){ const [u0, w0] = ponto(i / n), [u1, w1] = ponto((i + 1) / n); b(...ordem(u0, u1), -v - .36, -v - .16, Math.min(w0, w1) - .14, Math.max(w0, w1) + .14, mat); }
    const [um, wm] = ponto(.3); b(um - .5, um + .5, -v - .46, -v - .1, wm - .45, wm + .45, 'a_ferro');           /* fivela */
  };
  /* pontas soltas de fita, pano ou corda */
  const ponta = (b, u, w, v, mat = 'a_fita', c = 1.6, q = -1) => { b(u, u + .6, ...ordem(q * v, q * (v + .14)), w - c, w, mat); b(u + .3, u + .85, ...ordem(q * (v + .02), q * (v + .16)), w - c - .55, w - c + .2, mat); };
  const trama = (b, u0, u1, w0, w1, v, mat = 'a_fita_escura') => { for (let u = u0 + .1, i = 0; u < u1 - .15; u += .42, i++) lado(b, u, u + .12, w0 + (i % 2) * .15, w1 - ((i + 1) % 2) * .15, v, mat, .05); };
  const no_ = (b, u, w, v, mat = 'a_corda') => { b(u, u + .8, -v - .35, -v, w - .35, w + .35, mat); ponta(b, u + .1, w - .2, v + .1, mat, 1.1); };
  const rebite = (b, lista, v) => lista.forEach(([u, w]) => lado(b, u, u + .3, w, w + .3, v, 'a_aco', .1));

  /* ---------------------------------------------------------------- detalhes de cada arma */
  const tacoDet = b => {
    veios(b, 9.2, 12.8, -.55, .55, 1.05); veios(b, 6, 8.8, -.45, .45, .78); veios(b, 13.8, 20.8, -.9, .9, 1.35); veios(b, 4.2, 6, -.4, .4, .62);
    b(10.5, 11.6, -.12, .12, 1.03, 1.12, 'a_veio'); for (const u of [17.2, 19.4]) b(u, u + 1.1, -.12, .12, 1.34, 1.42, 'a_veio');
    risco(b, 17.5, .35, 1.35, 1.6, 'a_veio_claro'); risco(b, 15.2, -.6, 1.35, 1.1, 'a_veio_claro'); lado(b, 20.1, 20.9, -.9, -.2, 1.35, 'a_sombra', .05);
    ponta(b, -3.5, -.6, .72, 'a_preto', 1.5); haste_(b, -5.0, -4.6, .5, 'a_couro');
    b(-5.1, -4.7, -1.22, -.94, -3.2, -.3, 'a_corda'); b(-5.1, -4.7, -1.22, -.72, -3.5, -3.1, 'a_corda');
  };
  const D = {
    taco_pregos(b){ tacoDet(b); trama(b, 12.2, 13.4, -.9, .9, 1.05); for (const u of [14.9, 17.3, 19.1]) lado(b, u, u + .42, .25, .67, 1.35, 'a_ferro', .14); mancha(b, 18.2, -.9, 1.35, [1]); },
    taco_arame(b){ tacoDet(b); for (let u = 14.2; u < 20.4; u += 1.15){ b(u + .3, u + .52, -.25, .25, 1.33, 2.05, 'a_aco'); b(u + .6, u + .82, -.25, .25, -2.05, -1.33, 'a_ferrugem'); } b(20.6, 21.3, -1.7, -1.45, -.4, .1, 'a_ferro'); ponta(b, 15.8, -.2, 1.5, 'a_pano', 2.1); },
    cano(b){
      for (const u of [5.2, 11.4, 16.4]) { haste_(b, u, u + .3, .8, 'a_metal'); }
      mancha(b, 6.2, -.2, .72); mancha(b, 14.6, .1, .72, [-1]); gasto(b, 4.5, 17.5, .6, .72, 3.1);
      boca(b, 20.8, 0, .72); pinos(b, [[19, -.2]], 1.05); b(18.9, 20.1, -.3, .3, 4.9, 5.5, 'a_metal'); b(19.2, 19.8, -.2, .2, 5.5, 5.9, 'a_ferrugem2');
      ranhuras(b, 18.6, 3, .55, -1, 1, 1.05); trama(b, -3.7, 3.7, -.6, .6, .7); ponta(b, 3, -.4, .9, 'a_fita');
    },
    pe_de_cabra(b){
      gasto(b, -2, 16.5, .5, .45, 2.7); gasto(b, 4, 16, -.5, .45, 4.1, 'a_ferrugem'); mancha(b, 8, -.15, .45); mancha(b, 13.4, .05, .45, [1]);
      b(19.6, 19.9, -.4, .4, 1.4, 3.2, 'a_gasto'); b(14.6, 14.9, -.6, -.15, 2.9, 3.4, 'a_gasto'); b(14.6, 14.9, .15, .6, 2.9, 3.4, 'a_gasto');
      lado(b, 6, 9.2, -.12, .18, .45, 'a_tinta', .05); ponta(b, -3.2, -.5, .72, 'a_preto', 1.4);
    },
    chave_roda(b){
      for (const s of [-1, 1]){ b(9.35, 10.65, -.74, .74, ...ordem(s * 6.5, s * 6.9), 'a_ferro'); b(9.7, 10.3, -.34, .34, ...ordem(s * 8, s * 8.12), 'a_sombra'); }
      b(15.8, 15.92, -.34, .34, -.34, .34, 'a_sombra'); b(-7.72, -7.6, -.34, .34, -.34, .34, 'a_sombra');
      mancha(b, 3.8, -.3, .42); mancha(b, 11.6, 0, .42, [-1]); gasto(b, -2, 13.5, .33, .42, 2.9); lado(b, 9.4, 10.6, 2.4, 3.9, .42, 'a_ferrugem', .08);
      pino(b, 9.8, -.2, .5, 'a_gasto'); trama(b, -3.1, 3.1, -.4, .4, .43);
    },
    marreta(b){
      veios(b, 4.2, 12, -.45, .45, .62); pinos(b, [[15.3, -.2], [18.4, -.2], [16.9, 3.3], [16.9, -3.7]], 1.9);
      mancha(b, 15.2, .3, 1.9); mancha(b, 17.6, -1.3, 1.9, [-1]); gasto(b, 14.8, 19.2, 3.9, 1.9, 1.3);
      for (const s of [-1, 1]) for (const u of [15.2, 17, 18.7]) b(u, u + .35, -.7, .7, ...ordem(s * 4.9, s * 5.08), 'a_gasto');
      b(13.2, 13.6, -1.1, 1.1, -.18, .18, 'a_aco'); b(19.6, 20.5, -.55, .55, -.55, .55, 'a_madeira'); b(20.5, 20.62, -.3, .3, -.1, .1, 'a_ferro');
      ponta(b, -4.2, -.5, .8, 'a_couro', 1.8); trama(b, -4.3, 3.3, -.55, .55, .64, 'a_veio');
    },
    frigideira(b){
      rebite(b, [[7.5, -.15], [8.4, .55], [8.4, -.85]], .4); for (const [u, w] of [[11.6, -2.9], [13, 3], [15.6, -1.2], [14.2, 1.2]]) lado(b, u, u + .8, w, w + .5, .95, 'a_ferrugem', .05);
      lado(b, 11.2, 16.8, 3.4, 3.65, .8, 'a_metal', .12); lado(b, 12.4, 15.6, -4.7, -4.45, .8, 'a_metal', .1);
      for (const s of [-1, 1]){ b(11.6, 16.4, -.86, .86, ...ordem(s * 5.3, s * 5.42), 'a_gasto'); }
      risco(b, 12.6, -1.8, .98, 2.1, 'a_aco'); risco(b, 13.8, .3, .98, 1.4, 'a_aco'); b(-5.3, -4.5, -.2, .2, -.75, .75, 'a_preto'); b(-5.5, -5.3, -.2, .2, -.35, .35, 'a_ferro'); trama(b, -3.7, 2.9, -.45, .45, .42);
    },
    pa(b){
      veios(b, 4.5, 14, -.45, .45, .6); rebite(b, [[15.2, -.15], [16.6, -.15]], .82); rebite(b, [[18, 1.9], [18, -2.2], [20, -.2]], .38);
      lado(b, 17.4, 24.2, -.16, .16, .38, 'a_sombra', .1); for (const [u, w] of [[21.6, 2.2], [23, -2.6], [18.4, -3.2]]) lado(b, u, u + 1.2, w, w + .7, .38, 'a_veio', .06);
      gasto(b, 17.5, 24, 3.7, .38, 1.7); gasto(b, 18, 24, -3.85, .38, 2.2); b(27.2, 27.4, -.2, .2, -1.1, 1.1, 'a_gasto'); trama(b, -3.5, 3.5, -.55, .55, .62, 'a_veio');
    },
    facao(b){
      for (let u = 5, i = 0; u < 18.6; u += 1.35, i++) lado(b, u, u + .55, -.6 + (i % 3) * .55, -.42 + (i % 3) * .55, .2, i % 2 ? 'a_ferrugem2' : 'a_gasto', .05);
      for (const u of [8.6, 11.9, 16.2]) b(u, u + .35, -.24, .24, -1.45, -1.1, 'a_ferro');
      lado(b, 5.2, 18, .55, .7, .2, 'a_sombra', .07); pinos(b, [[-2.6, -.2], [.4, -.2], [2.2, -.2]], .83, 'a_metal');
      b(-5.2, -4.9, -.15, .15, -1.5, -.6, 'a_corda'); b(-5.2, -4.9, -.15, .15, -3.4, -1.5, 'a_pano'); b(-5.6, -4.9, -.2, .2, -4, -3.3, 'a_pano');
    },
    machadinha(b){
      veios(b, 4, 9, -.45, .45, .6); lado(b, 9.9, 12.8, -5.1, -4.7, .34, 'a_sombra', .07); gasto(b, 8.9, 13.6, -6.55, .26, 1.1);
      for (const [u, w] of [[10, -2.4], [11.9, -4], [9.2, -5.6]]) lado(b, u, u + .8, w, w + .5, .34, 'a_ferrugem2', .06);
      rebite(b, [[10, -4.3], [12.3, -2.9]], .42); trama(b, 9.4, 13.4, -.6, .6, .64, 'a_veio'); no_(b, 9.2, -.7, .72);
      b(11, 11.4, -.62, -.4, -2.8, -.4, 'a_corda'); b(11.6, 12, .4, .62, -2.8, -.4, 'a_corda'); ponta(b, -3.2, -.5, .75, 'a_couro', 1.6);
    },
    machado_placa(b){
      veios(b, 4.2, 10.8, -.45, .45, .62); rebite(b, [[11.2, -4], [19.4, -4], [11.8, -6.5], [18.8, -6.5], [15.3, -2.8]], .26);
      lado(b, 10.4, 20.6, -6.2, -6, .26, 'a_branco', .07); for (const [u, w] of [[12.2, -6.9], [17.4, -2.9], [19, -5.2]]) lado(b, u, u + .9, w, w + .45, .3, 'a_ferrugem', .08);
      for (const [u, w] of [[13, -5.9], [16.6, -6.6], [14, -2]]) risco(b, u, w, .3, 1.5, 'a_gasto');
      gasto(b, 11, 20, -8.3, .2, 1.4); b(13.7, 14.1, -.8, .8, -.35, -.05, 'a_aco'); b(18.1, 18.5, -.75, .75, -.75, .75, 'a_corda'); trama(b, 11.6, 13.6, -.5, .5, .64); ponta(b, 12, -.6, .82);
    },
    lanca(b){
      veios(b, -19.5, -5, -.42, .42, .55); veios(b, 5, 20, -.42, .42, .55); for (const u of [-14, -9.5, 11, 17]) haste_(b, u, u + .2, .62, 'a_veio');
      trama(b, 23.8, 27.6, -.5, .5, .57, 'a_veio'); no_(b, 24, -.4, 1); rebite(b, [[25.4, .55], [26.9, .55]], .25);
      lado(b, 28.6, 34.6, .05, .2, .18, 'a_ferro', .07); b(28.2, 34.8, -.1, .1, 1.05, 1.18, 'a_gasto');
      ponta(b, 22, -.5, .72, 'a_pano', 2.8); ponta(b, 21.8, -.5, .72, 'a_pano2', 2.1, 1); b(-22.6, -22, -.35, .35, -.35, .35, 'a_sombra');
    },
    arco(b){
      for (const [u, w] of [[-12.8, -1.7], [-9.6, -.7], [-6, 0], [5.4, 0], [9, -.7], [12.2, -1.7]]) b(u, u + .35, -.56, .56, w - .72, w + .72, 'a_fita_escura');
      trama(b, -3.4, 3.4, -.5, .5, .66, 'a_veio'); for (const s of [-1, 1]){ b(...ordem(s * 3.6, s * 4.3), -.62, .62, -.7, .7, 'a_corda'); b(...ordem(s * 15.4, s * 16.2), -.55, .55, -3.55, -2.3, 'a_corda'); }
      b(-.5, .5, -.18, .18, -3.82, -3.48, 'a_pano'); b(.8, 1.5, .62, .78, -.2, .5, 'a_branco'); ponta(b, -2.8, -.4, .72, 'a_pano', 2.2);
    },
    estilingue(b){
      veios(b, 2.35, 3.45, -2.3, 2.2, .6); for (const s of [-1, 1]){ for (const w of [6.55, 7.25]) b(2.12, 3.68, ...ordem(s * 1.66, s * 3.14), w, w + .16, 'a_veio'); b(2.5, 3.3, ...ordem(s * 1.9, s * 2.9), 7.6, 7.78, 'a_veio_claro'); }
      for (const w of [-2.2, -1.5, -.8, -.1]) b(2.04, 3.76, -.76, .76, w, w + .18, 'a_fita_escura'); ponta(b, 2.4, -2.2, .72, 'a_pano', 1.5);
      b(-3.45, -3.35, -.6, -.35, 6.65, 7.1, 'a_corda'); b(-3.45, -3.35, .35, .6, 6.65, 7.1, 'a_corda');
    },

    /* ---------- militares inteiras ---------- */
    pistola(b){
      xadrez(b, 0, 1.1, 4.2, .62, 'a_sombra'); dorso(b, 0, 1.1, 4.2, .62, 'a_sombra');
      friso(b, -1.8, 6.5, 2.0, .62); friso(b, -1.5, 6, 1.45, .55, 'a_ferro'); ranhuras(b, 4.3, 3, .42, 2.45, 3.2, .62);
      pinos(b, [[-.4, 1.3], [2.6, 1.5], [4.4, 1.25]], .55, 'a_aco'); lado(b, .5, 1.7, 1.6, 1.9, .62, 'a_aco_escuro', .14, [-1]);
      trilho(b, 3.6, 6.3, .82, .4); b(6.7, 6.82, -.2, .2, 2.58, 2.97, 'a_sombra'); lado(b, -1.2, -.9, 3.55, 3.85, .18, 'a_branco', .06); b(6.2, 6.32, -.1, .1, 3.7, 3.88, 'a_branco');
      gasto(b, -1, 6.2, 3.36, .62, 2.2, 'a_metal'); b(-2.3, -1.9, -.25, .25, 2.4, 3.1, 'a_ferro'); b(-3.3, -.8, -.5, .5, -3.7, -3.5, 'a_preto');
    },
    revolver(b){
      xadrez(b, -.1, 1.3, 4.2, .7, 'a_veio'); lado(b, -1.5, .5, .55, .95, .7, 'a_veio_claro', .05);
      for (const [v, w] of [[-.85, 3.65], [.25, 3.65], [-.85, .95], [.25, .95]]) b(2.2, 3.8, v, v + .6, w, w + .1, 'a_ferro');
      friso(b, -1.5, 1.5, 2.55, .55); pinos(b, [[-1, 1.7], [.5, 1.55], [.5, 2.9]], .55, 'a_aco');
      b(4.8, 9.2, -.2, .2, 3.35, 3.55, 'a_ferro'); ranhuras(b, 5.4, 6, .55, 3.35, 3.55, .2); b(10.4, 10.52, -.24, .24, 2.62, 3.12, 'a_sombra');
      b(4.4, 4.7, -.5, .5, 1.6, 3.4, 'a_ferro'); b(-2.7, -2.4, -.22, .22, 3.6, 4.3, 'a_ferro'); gasto(b, 4.8, 10, 2.5, .45, 1.8);
      b(-3, -2.3, -.35, .35, -3.45, -2.85, 'a_latao'); b(-3.25, -2.95, -.2, .2, -3.4, -2.95, 'a_aco');
    },
    submetralhadora(b){
      xadrez(b, 0, 1.25, 4.4, .62, 'a_sombra'); friso(b, -3.3, 8.8, 2.1, .75); friso(b, -3.3, 8.8, 3.35, .75, 'a_ferro');
      pinos(b, [[-2.9, 1.4], [-.9, 1.5], [3.2, 2.5], [7.9, 1.4], [7.9, 2.8]], .75, 'a_aco'); lado(b, 1.3, 3.8, 2.3, 3.4, .75, 'a_sombra', .08, [1]);
      lado(b, -1.6, -.2, 2.35, 2.62, .75, 'a_metal', .16, [-1]); lado(b, 4.6, 6.4, 2.5, 2.9, .75, 'a_aco_escuro', .22, [-1]);
      ranhuras(b, 9.5, 5, .65, 2.1, 3.1, .62); for (let i = 1; i < 6; i++) lado(b, 4.4 + .12 * i * i * .28, 5.9 + .12 * i * i * .28, 1.05 - i * 1.35, 1.2 - i * 1.35, .55, 'a_sombra', .1);
      lado(b, 4.9, 5.4, -5.6, 0, .55, 'a_ferro', .08); boca(b, 15.9, 2.75, .4); trilho(b, 9.2, 12.4, 3.5, .35);
      for (const u of [-9.4, -7.4, -5.4]) { b(u, u + .4, -.28, .28, 3.1, 3.7, 'a_sombra'); b(u, u + .4, -.28, .28, 1.25, 1.85, 'a_sombra'); } lado(b, -11.3, -10.5, 1, 3.5, .55, 'a_ferro', .1);
      gasto(b, -2.8, 8.4, 3.68, .75, 2.6, 'a_metal'); correia(b, [-10.8, .9], [10.4, 1.9], .75);
    },
    fuzil_assalto(b){
      xadrez(b, 0, 1.25, 4.4, .62, 'a_sombra'); friso(b, -3.8, 7.2, 2.35, .75); friso(b, -3.8, 7.2, 1.6, .75, 'a_ferro');
      pinos(b, [[-3.4, 1.75], [-1.2, 1.7], [2, 3.2], [6.4, 1.7], [6.4, 3.1]], .75, 'a_aco');
      lado(b, 2.9, 5.6, 2.65, 3.2, .75, 'a_sombra', .08, [1]); lado(b, .2, 1.3, 2.7, 3, .75, 'a_metal', .18, [-1]); lado(b, 4.9, 5.7, 1.35, 1.85, .75, 'a_ferro', .2, [-1]);
      trilho(b, 3.4, 15.2, 4.3, .4); trilho(b, 8, 14.8, 1.31, .4); for (const u of [8, 9.5, 11, 12.5, 14]) lado(b, u, u + .8, 1.75, 2.0, .82, 'a_veio_claro', .05);
      friso(b, 7.6, 15.2, 3.5, .82); rebite(b, [[7.7, 1.7], [14.8, 1.7]], .82);
      for (let i = 1; i < 5; i++){ const d = .5 * i * i * .28; lado(b, 4.05 + d, 5.85 + d, 1.05 - i * 1.35, 1.2 - i * 1.35, .55, 'a_ferro', .1); }
      boca(b, 23.2, 2.75, .46); ranhuras(b, 21.65, 3, .45, 3.0, 3.3, .52); b(16.4, 18.6, -.16, .16, 1.9, 2.2, 'a_ferro'); b(17.15, 17.65, -.5, .5, 5.6, 5.85, 'a_preto');
      lado(b, -13, -10.9, 2.2, 2.5, .66, 'a_sombra', .08); lado(b, -12.4, -11.4, .2, 1.1, .62, 'a_veio_claro', .07); b(-14.5, -14.3, -.6, .6, -.4, 3.6, 'a_borracha'); for (const w of [.3, 1.5, 2.7]) b(-14.62, -14.5, -.6, .6, w, w + .35, 'a_sombra');
      lado(b, -.5, .2, 5, 5.7, .55, 'a_ferro', .12); lado(b, 2.0, 2.6, 6.05, 6.35, .55, 'a_metal', .1);
      gasto(b, -3, 6.8, 3.78, .75, 2.4, 'a_metal'); correia(b, [-10, .0], [14.4, 1.75], .85, 'a_lona', 3);
    },
    fuzil_madeira(b){
      xadrez(b, 0, 1.35, 4.2, .62, 'a_veio'); veios(b, 7.2, 12.8, 1.6, 2.6, .8); veios(b, 7.2, 12.4, 3.1, 3.9, .6);
      veios(b, -9, -4.3, 1.3, 3, .62); veios(b, -13.8, -9, 0, 2.5, .62);
      friso(b, -3.8, 6.8, 2.3, .72); pinos(b, [[-3.4, 1.6], [-1.4, 1.65], [1.2, 1.5], [6, 1.6]], .72, 'a_aco');
      lado(b, -.6, 3.8, 2.75, 3.15, .72, 'a_ferro', .12, [-1]); lado(b, 3.4, 5.4, 2.85, 3.35, .72, 'a_sombra', .07, [1]);
      for (const u of [8.4, 9.9, 11.4]) lado(b, u, u + .7, 3.35, 3.7, .6, 'a_sombra', .09);
      for (let i = 1; i < 5; i++){ const d = .8 * i * i * .28; lado(b, 3.75 + d, 5.75 + d, 1.15 - i * 1.35, 1.32 - i * 1.35, .55, 'a_ferrugem2', .1); }
      b(14.2, 14.6, -.42, .42, 2, 3.2, 'a_ferro'); boca(b, 22.6, 2.43, .38); b(-14.75, -14.6, -.5, .5, -.4, 2, 'a_metal'); lado(b, -13.6, -12.8, 1.2, 1.9, .62, 'a_latao', .08);
      gasto(b, -3, 6.2, 3.35, .72, 2.6, 'a_metal'); correia(b, [-12, -.2], [14.2, 1.6], .85, 'a_couro', 3);
    },
    escopeta(b){
      xadrez(b, -.2, 1.2, 3.4, .62, 'a_veio'); veios(b, -9.2, -3.9, .9, 2.9, .66); veios(b, -13.5, -9.4, -.4, 2.5, .66); for (let u = 9; u < 14; u += 1.1) lado(b, u + .5, u + .72, 1.1, 2.3, .82, 'a_veio_claro', .06);
      friso(b, -3.4, 5.4, 2.55, .8); pinos(b, [[-3, 1.4], [-1, 1.5], [4.4, 1.4], [4.4, 3]], .8, 'a_aco'); lado(b, .9, 3.6, 2.45, 2.9, .9, 'a_sombra', .08, [1]);
      lado(b, -2.8, -.6, 2.85, 3.1, .8, 'a_ferro', .07, [1]); for (const u of [6.2, 14.8, 18]) b(u, u + .5, -.6, .6, 1.38, 3.62, 'a_aco_escuro');
      b(6.5, 20.8, -.14, .14, 3.55, 3.7, 'a_sombra'); ranhuras(b, 7, 9, 1.2, 3.55, 3.7, .14); boca(b, 22.6, 3.1, .42); b(21, 21.14, -.34, .34, 1.62, 2.28, 'a_metal');
      for (let i = 0; i < 4; i++){ lado(b, -8.8 + i * 1.15, -8.1 + i * 1.15, .9, 2.5, .66, 'a_pano', .3, [-1]); lado(b, -8.8 + i * 1.15, -8.1 + i * 1.15, .55, .9, .66, 'a_latao', .32, [-1]); }
      lado(b, -9.2, -4.2, 1.35, 1.65, .96, 'a_couro', .1, [-1]); b(-14.75, -14.6, -.6, .6, -.5, 2.5, 'a_sombra'); correia(b, [-11.8, -.5], [19.4, 1.5], .66, 'a_couro', 3);
    },
    rifle_precisao(b){
      xadrez(b, 0, 1.35, 4.2, .62, 'a_sombra'); friso(b, -3.5, 7, 2.2, .72); pinos(b, [[-3.2, 1.5], [-1.2, 1.6], [6, 1.5]], .72, 'a_aco');
      ranhuras(b, 8, 5, 1.25, 1.65, 2.4, .74); for (let u = 15.5; u < 27; u += 1.35) b(u, u + .5, -.4, .4, 2.95, 3.2, 'a_sombra');
      for (const u of [28.3, 29, 29.7]) lado(b, u, u + .28, 2.8, 3.35, .56, 'a_ferro', .1); boca(b, 30, 3.08, .42);
      for (const u of [-.4, 3.8]){ b(u, u + 1, -.72, .72, 4.35, 6.05, 'a_ferro'); lado(b, u + .3, u + .7, 4.9, 5.3, .72, 'a_metal', .12); }
      b(1.4, 2.6, -1.1, -.55, 4.9, 5.5, 'a_ferro'); b(1.5, 2.5, -1.2, -1.1, 5.0, 5.4, 'a_metal');
      for (const u of [-4.2, -3.5, 7.4, 8]) b(u, u + .3, -.9, .9, 4.35, 6.05, 'a_sombra');
      lado(b, -11.4, -6.8, 3.2, 3.45, .5, 'a_lona', .1); lado(b, -13, -9.9, -.5, -.2, .6, 'a_sombra', .08); lado(b, -9, -5, 1.7, 2.0, .64, 'a_sombra', .08);
      for (const w of [-.8, .4, 1.6]) b(-14.86, -14.7, -.6, .6, w, w + .45, 'a_borracha'); b(2.55, 2.95, 2.3, 2.75, 2.1, 2.5, 'a_metal');
      for (const s of [-1, 1]){ b(22, 22.7, ...ordem(s * .5, s * 1), 1.0, 1.65, 'a_borracha'); b(17, 17.4, ...ordem(s * .5, s * 1), 1.05, 1.6, 'a_metal'); }
      gasto(b, -2.8, 6.4, 3.18, .72, 2.5, 'a_metal'); correia(b, [-11.6, -.9], [12, 1.5], .85, 'a_lona', 2.8);
    },
    metralhadora(b){
      xadrez(b, 0, 1.15, 4.4, .62, 'a_sombra'); friso(b, -4.1, 8.7, 2.5, 1); friso(b, -4.1, 8.7, 3.5, 1, 'a_ferro');
      pinos(b, [[-3.8, 1.4], [-2, 3.75], [1, 1.45], [4.6, 3.75], [7.9, 1.4], [7.9, 3.75]], 1, 'a_aco'); trilho(b, 1, 8, 4.8, .55);
      lado(b, -2.8, -.4, 2.75, 3.3, 1, 'a_sombra', .08, [1]); lado(b, 5.4, 6.4, 2.7, 3.2, 1, 'a_metal', .3, [-1]); b(5.7, 6.1, -1.9, -1.3, 2.75, 3.15, 'a_preto');
      lado(b, 3.9, 7.9, -3.2, -2.9, 2.1, 'a_ferro', .08); lado(b, 3.9, 7.9, -.4, -.1, 2.1, 'a_ferro', .08); lado(b, 4.6, 7.2, -1.2, -.7, 2.1, 'a_amarelo', .07); rebite(b, [[3.9, .4], [7.7, .4]], 2.1);
      for (let u = 4; u < 7.8; u += .75){ b(u + .08, u + .34, 1.02, 1.48, 2.4, 2.75, 'a_cobre'); }
      for (let u = 17.2; u < 25; u += 1.05) b(u, u + .35, -.58, .58, 2.4, 3.5, 'a_aco_escuro'); boca(b, 27.4, 2.95, .5); ranhuras(b, 25.9, 3, .45, 3.35, 3.65, .65);
      lado(b, -13, -9.4, 1.1, 1.4, .62, 'a_sombra', .08); rebite(b, [[-12.8, .1], [-9.4, .1]], .62); for (const w of [-.1, 1.2, 2.5]) b(-15.16, -15, -.6, .6, w, w + .5, 'a_borracha');
      for (const s of [-1, 1]) b(18.5, 19.5, ...ordem(s * 1.75, s * 2.65), -3.45, -3, 'a_borracha');
      gasto(b, -3.6, 8, 4.12, 1, 2.4, 'a_metal'); correia(b, [-13.2, -.5], [15, 2], 1.05, 'a_lona', 3);
    },
    faca_combate(b){
      for (let u = -2.05; u < 2.2; u += .95) haste_(b, u, u + .18, .68, 'a_sombra'); lado(b, 4, 10.4, .15, .35, .18, 'a_sombra', .07);
      gasto(b, 4, 11, -.98, .2, 1.5); b(12.9, 13.35, -.1, .1, .25, .55, 'a_gasto'); pinos(b, [[2.95, -.9], [2.95, .55]], .45, 'a_metal');
      b(-4.2, -3.8, -.35, .35, -.45, .45, 'a_metal'); b(-4.6, -4.3, -.15, .15, -2.6, -.2, 'a_lona'); b(-5.2, -4.4, -.2, .2, -3.2, -2.5, 'a_lona');
    },

    /* ---------- gambiarra: mais tralha, tudo torto ---------- */
    gamb_pistola(b){
      veios(b, -1.7, 4, 1, 2.2, .75); trama(b, 1.4, 2.5, 1, 3.2, .91); trama(b, -2.5, -.6, -2.1, -1.2, .86, 'a_ferro');
      mancha(b, 4.9, 2.9, .45); mancha(b, 1.6, 2.7, .45, [-1]); ponta(b, 1.6, 1, .92, 'a_fita', 2.2); ponta(b, 3.4, 1.1, .92, 'a_preto', 1.1, 1);
      b(5.7, 5.95, -.62, .62, 2.65, 3.8, 'a_aco'); b(5.7, 5.95, -.95, -.6, 3.0, 3.3, 'a_aco'); b(-.4, 3.8, -.85, -.75, 2.45, 2.65, 'a_aco'); b(-.4, -.2, -.85, -.75, 1.2, 2.5, 'a_aco');
      b(-1.5, -.3, .75, 1.0, .1, .85, 'a_vermelho'); b(-1.15, -.65, 1.0, 1.08, .3, .65, 'a_tinta'); b(2.2, 2.8, -.2, .2, 3.35, 3.9, 'a_latao'); b(-3.9, -3.4, -.15, .15, .9, 2.1, 'a_corda'); no_(b, -3, -3.1, .6);
    },
    gamb_revolver(b){
      veios(b, -1.5, 1.4, 1, 2.9, .6); for (const w of [1.35, 2.75]) lado(b, 1.7, 4, w, w + .18, 1.2, 'a_ferro', .08); mancha(b, 2, .95, 1.2); mancha(b, 7.6, 2, .52, [-1]);
      lado(b, 2.5, 2.95, 1.95, 2.35, 1.32, 'a_vermelho', .08); b(4.6, 4.85, -.65, .65, 1.95, 3.25, 'a_aco'); b(5.6, 5.85, -.55, .55, 2.1, 3.15, 'a_corda'); b(6.2, 6.45, -.55, .55, 2.1, 3.15, 'a_corda');
      trama(b, 4.4, 5.2, 2.25, 2.95, .56); trama(b, .1, 1.3, 1, 2.9, .76, 'a_ferro'); ponta(b, 7, 1.9, .72, 'a_cinta', 1.9); b(-1.6, 1.6, -.14, .14, 3, 3.22, 'a_corda'); no_(b, -2.2, -2.8, .75);
      b(-.6, .4, .75, 1.0, -.2, .8, 'a_latao'); b(9.4, 9.6, -.35, .35, 2.05, 2.65, 'a_ferro');
    },
    gamb_submetralhadora(b){
      lado(b, -3.5, 7.3, 2.55, 2.75, .95, 'a_sombra', .07); rebite(b, [[-3.5, 1.2], [-3.5, 3], [7.1, 1.2], [7.1, 3], [1, 1.2]], .95);
      for (const [u, w] of [[-1.8, 1.2], [3.4, 2.9], [.4, 2.9]]) mancha(b, u, w, .95); lado(b, -.6, 1.8, 1.55, 2.4, .95, 'a_amarelo', .06, [-1]); for (const u of [-.3, .4, 1.1]) lado(b, u, u + .35, 1.75, 2.2, 1.01, 'a_sombra', .05, [-1]);
      b(-2.2, -1.4, -.85, .85, 3.9, 4.35, 'a_metal'); b(4.8, 5.6, -.85, .85, 3.9, 4.35, 'a_metal'); b(.4, 1.6, -.62, .62, 5.4, 5.65, 'a_fita');
      trama(b, 8.4, 9.4, 2.05, 3.05, .71); trama(b, 3.6, 6.4, -2.1, -1.4, .76, 'a_ferro'); ponta(b, 8.6, 2, .74, 'a_fita', 2.4); ponta(b, -5, 2.3, .52, 'a_pano', 2.6);
      mancha(b, 10, 2.3, .55, [-1]); b(11, 11.25, -.68, .68, 1.85, 3.25, 'a_aco'); b(14, 14.25, -.52, .52, 1.55, 2.8, 'a_aco'); veios(b, -9.2, -4.2, 2.5, 2.9, .3);
      for (const u of [-2.6, -.4, 1.2]) b(u, u + .3, -1.22, -1.1, .3, 1, 'a_aco'); correia(b, [-9.2, .6], [11.2, 2], 1.0, 'a_corda', 3.2);
    },
    gamb_fuzil(b){
      veios(b, -4.8, 3, 1.3, 2.8, .7); veios(b, 8.2, 11.2, 1.7, 2.5, .75); veios(b, -12.8, -7.2, 2.1, 2.75, .38); veios(b, -12.6, -6.4, .2, .8, .34);
      for (const [a, c, v, w0, w1] of [[11.4, 12.8, .91, 1.6, 3.7], [6.4, 7.4, .88, 1.2, 3.75], [-1.6, -.4, .86, 1.2, 3.5]]) trama(b, a, c, w0, w1, v);
      mancha(b, 13.6, 2.8, .42); mancha(b, 16.6, 2.85, .42, [-1]); mancha(b, 5, 3.1, .5);
      ponta(b, 11.8, 1.4, .93, 'a_fita', 2.6); ponta(b, 6.6, 1, .9, 'a_pano', 3.1); ponta(b, 18.3, 2.7, .62, 'a_preto', 1.4, 1);
      for (const u of [14.8, 16.4, 20, 21.6]) b(u, u + .22, -.55, .55, u < 19 ? 2.55 : 2.9, u < 19 ? 3.65 : 3.82, 'a_aco');
      lado(b, -3.2, -2, 1.5, 2.6, .7, 'a_metal', .12, [-1]); rebite(b, [[-3, 1.7], [-2.35, 2.2]], .82); lado(b, 1.2, 3, 1.35, 1.75, .7, 'a_tinta', .07, [-1]);
      b(9.4, 9.9, -.92, -.74, 1.9, 2.6, 'a_latao'); b(-10.4, -9.4, -.5, .5, .0, 3.0, 'a_corda'); no_(b, -10.2, .2, .55); b(24.4, 24.6, -.35, .35, 3.05, 3.65, 'a_sombra');
    },
    gamb_escopeta(b){
      veios(b, -3.8, 4.2, 1.1, 2.9, 1); veios(b, 6.6, 12, 1, 1.9, .85); veios(b, -10.8, -4.2, -.2, 2.2, .72);
      trama(b, 7, 8.4, 2.15, 3.3, 1.21); trama(b, 12.6, 13.8, 2.15, 3.3, 1.21, 'a_ferro'); trama(b, -8.2, -6.8, .3, 2.4, .88);
      for (const u of [5.4, 10.2, 15]) { b(u, u + .24, -1.18, 1.18, 1.95, 3.55, 'a_aco'); b(u, u + .24, -.2, .2, 3.55, 3.9, 'a_aco'); }
      mancha(b, 9, 2.5, 1.05); mancha(b, -1.6, 2.2, 1, [-1]); ponta(b, 7.4, 2, 1.23, 'a_fita', 2.2); ponta(b, 13, 2, 1.23, 'a_preto', 1.3, 1);
      rebite(b, [[-2, 3.2], [1.4, 3.2], [2.8, 1.1]], 1); lado(b, -2.6, -.2, 1.15, 2.1, 1, 'a_pano2', .14, [-1]); lado(b, -2.4, -2.1, 1.3, 1.6, 1.12, 'a_aco', .1, [-1]); lado(b, -.7, -.4, 1.8, 2.1, 1.12, 'a_aco', .1, [-1]);
      b(18.5, 18.64, -.95, -.25, 2.55, 3.25, 'a_sombra'); b(16, 16.14, .25, .95, 2.2, 2.9, 'a_sombra'); correia(b, [-9.6, -.2], [11.4, 1.1], .74, 'a_pano', 3.2);
    },
    gamb_precisao(b){
      veios(b, -4.2, 7, 1.4, 2.8, .68); veios(b, 8, 14.4, 1.75, 2.65, .55); veios(b, -13.2, -5, 1, 2.5, .6); veios(b, -13, -9.8, -1.2, .6, .56);
      trama(b, 14.6, 16.4, 1.7, 3.5, .71); trama(b, 5.6, 6.6, 1.3, 3.5, .84, 'a_ferro'); ponta(b, 15, 1.5, .73, 'a_fita', 2.3); ponta(b, 24, 2.7, .58, 'a_preto', 1.6);
      mancha(b, 18.4, 2.8, .34); mancha(b, 21.2, 2.78, .34, [-1]); mancha(b, 6.3, 4.9, .82);
      for (const u of [-1.9, -1.05, 3.9, 4.75]) b(u, u + .18, -.86, .86, u < 0 ? 4.4 : 4.8, u < 0 ? 5.72 : 6.12, 'a_aco');
      for (const u of [-.2, 1.2, 3]) lado(b, u, u + .3, u > 2.4 ? 4.95 : 4.55, u > 2.4 ? 5.9 : 5.5, .6, 'a_sombra', .06);
      b(-2.45, -2.2, -.7, .7, 4.4, 5.7, 'a_borracha'); b(2.2, 2.6, -.72, .72, 4.45, 6.05, 'a_fita'); b(-1.5, -1.2, -1, -.78, 2.6, 4.6, 'a_corda'); b(4.5, 4.8, .78, 1, 2.6, 4.9, 'a_corda');
      for (let i = 0; i < 3; i++) { lado(b, -8.6 + i * .95, -8 + i * .95, 1.2, 2.5, .6, 'a_latao', .34, [-1]); } lado(b, -8.9, -5.9, 1.65, 1.95, .98, 'a_couro', .1, [-1]);
      b(19.4, 19.65, -.5, .5, 2.6, 3.55, 'a_aco'); no_(b, 12.5, 1.3, .6); correia(b, [-12.4, -1.2], [11.4, 1.6], .6, 'a_corda', 3);
    },
  };

  for (const [id, detalhar] of Object.entries(D)){
    const A = ARMAS[id]; if (!A) continue;
    const base = A.desenhar;
    A.desenhar = b => { base(b); detalhar(b); };
  }
})();
