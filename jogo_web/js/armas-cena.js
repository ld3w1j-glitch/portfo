/* Armas improvisadas como itens do Montador de cenários (no chão e numa bancada).
   Carregado depois de cenario-itens.js. Usa as mesmas formas de armas.js. */
(() => {
  const CAT = 'Armas improvisadas';
  BIBLIOTECA.CATEGORIAS.push(CAT);
  Object.assign(BIBLIOTECA.FIXAS, ARMA_CORES);
  /* põe a arma deitada: o comprimento vai para X; (x, y, z) = meio do apoio, em metros */
  function deitada(g, id, x, y, z){
    const A = ARMAS[id], caixas = [];
    A.desenhar((u0, u1, v0, v1, w0, w1, mat) => caixas.push(A.deitar === 'w' ? [u0, u1, w0, w1, v0, v1, mat] : [u0, u1, v0, v1, w0, w1, mat]));
    /* cada caixa: comprimento (u), altura quando deitada (a) e largura no chão (l) */
    const min = i => Math.min(...caixas.map(c => c[i])), max = i => Math.max(...caixas.map(c => c[i]));
    const meioU = (min(0) + max(1)) / 2, base = min(2), meioL = (min(4) + max(5)) / 2;
    for (const [u0, u1, a0, a1, l0, l1, mat] of caixas)
      g.b(x + ((u0 + u1) / 2 - meioU) * ESCALA, y + (a0 - base) * ESCALA, z + ((l0 + l1) / 2 - meioL) * ESCALA,
          (u1 - u0) * ESCALA, (a1 - a0) * ESCALA, (l1 - l0) * ESCALA, mat, .06);
  }
  const FOGO = 'Armas militares e gambiarra';
  BIBLIOTECA.CATEGORIAS.push(FOGO);
  for (const [id, A] of Object.entries(ARMAS))
    BIBLIOTECA.ITENS[`arma_${id}`] = {id:`arma_${id}`, nome:A.nome, cat:(A.tipo === 'militar' || A.tipo === 'gambiarra') ? FOGO : CAT, cores:{}, desenhar:g => deitada(g, id, 0, 0, 0)};

  BIBLIOTECA.ITENS.caixa_municao = {id:'caixa_municao', nome:'Caixa de munição (rara)', cat:FOGO, cores:{pintura:['Pintura', '#4A5139']}, desenhar(g){
    g.b(0, 0, 0, .42, .22, .22, 'pintura', .06); g.b(0, .22, -.14, .42, .2, .04, 'pintura', .06);            /* tampa aberta */
    for (const x of [-.16, .16]) g.b(x, 0, 0, .04, .225, .23, 'ferro', .06);
    g.b(0, .08, .115, .2, .07, .012, 'flor2', .04);
    for (let i = 0; i < 6; i++) for (const z of [-.04, .04]) g.b(-.13 + i * .052, .22, z, .03, .05, .03, 'a_latao', .03);
  }};

  BIBLIOTECA.ITENS.caixa_militar = {id:'caixa_militar', nome:'Caixa militar aberta (saque raro)', cat:FOGO, cores:{pintura:['Pintura', '#4A5139']}, desenhar(g){
    g.b(0, 0, 0, 1.45, .08, .72, 'pintura', .1);
    for (const z of [-.34, .34]) g.b(0, .08, z, 1.45, .26, .05, 'pintura', .1);
    for (const x of [-.7, .7]) g.b(x, .08, 0, .05, .26, .63, 'pintura', .1);
    g.b(0, .08, 0, 1.35, .09, .62, 'saco', .07);                                                          /* palha de proteção */
    g.b(0, .34, -.44, 1.45, .5, .05, 'pintura', .1); for (const x of [-.52, .52]) g.b(x, .34, -.405, .07, .5, .03, 'ferro', .08);   /* tampa levantada */
    for (const x of [-.55, .55]) g.b(x, .06, .372, .1, .22, .02, 'ferro', .05);
    g.b(0, .17, .372, .34, .09, .015, 'flor2', .04);
    deitada(g, 'fuzil_assalto', -.05, .17, -.1); deitada(g, 'pistola', .38, .17, .2);
    for (let i = 0; i < 3; i++) g.b(-.52 + i * .14, .17, .2, .11, .08, .17, 'ferro', .04);
  }};

  BIBLIOTECA.ITENS.bancada_armas = {id:'bancada_armas', nome:'Bancada de armas', cat:CAT, cores:{tampo:['Tampo', '#7A573A']}, desenhar(g){
    for (const x of [-.95, .95]) for (const z of [-.34, .34]) g.b(x, 0, z, .1, .86, .1, 'ferro', .2);
    g.b(0, .86, 0, 2.2, .1, .9, 'tampo', .12); g.b(0, .28, 0, 1.95, .05, .74, 'madeira_velha', .16);
    g.b(0, .96, -.43, 2.2, .95, .06, 'madeira_velha', .16);                                   /* painel de ferramentas */
    for (const [x, y, w, h, m] of [[-.85, 1.25, .08, .5, 'madeira'], [-.85, 1.68, .26, .12, 'ferro'], [-.5, 1.3, .05, .45, 'metal'], [-.5, 1.7, .16, .09, 'vermelho'], [.55, 1.4, .34, .34, 'borracha'], [.55, 1.49, .16, .16, 'madeira_velha'], [.9, 1.22, .07, .55, 'metal']]) g.b(x, y, w > .1 && w < .3 ? -.372 : -.38, w, h, w > .1 && w < .3 ? .056 : .04, m, .08);   /* cabeças um pouco à frente dos cabos */
    deitada(g, 'taco_pregos', -.35, .96, .2); deitada(g, 'facao', .5, .96, -.12);
    g.b(.8, .96, .22, .24, .16, .2, 'vermelho', .08); g.b(.8, 1.12, .22, .18, .04, .04, 'ferro', .1);   /* caixa de pregos */
    g.b(-.75, .96, -.2, .2, .08, .2, 'saco', .06); g.b(-.75, 1.04, -.2, .08, .06, .08, 'madeira_velha', .1);     /* rolo de fita */
    for (let i = 0; i < 6; i++) g.b(.05 + i * .06, .96, -.28, .025, .025, .16, 'metal', .05);
    deitada(g, 'cano', 0, .33, .05);
  }};
})();
