/* Armas de fogo do jogo, só como objetos de cena em blocos: arte própria, nomes genéricos, sem marcas e sem copiar modelos reais.
   São a aparência por fora (não há mecanismo nem instrução de montagem).
   "militar" = inteiras, de fábrica. "gambiarra" = juntadas de qualquer jeito, tortas, por quem não sabe fazer armas.
   Carregado depois de armas.js e antes de modelo.js. Mesmo sistema de caixas: b(u0, u1, v0, v1, w0, w1, material). */

Object.assign(ARMA_CORES, {
  a_polimero:'#383B40', a_aco_escuro:'#2C2F34', a_caqui:'#8C7B55', a_verde_mil:'#4A5139', a_latao:'#C9A24B',
  a_lente:'#4FB3D9', a_nogueira:'#7A4B2A', a_tabua:'#B8905C', a_mangueira:'#2F6B4A', a_cinta:'#2C5C8F',
});
Object.assign(TIPOS_ARMA, {militar:'Militares inteiras (raríssimas)', gambiarra:'Gambiarra (montadas de qualquer jeito)'});

/* ---------------------------------------------------------------- peças de aparência, reaproveitadas */
/* empunhadura inclinada, descendo do corpo da arma */
const punho_ = (b, mat, u = 0, topo = .9, alt = 4.4, larg = .62) => { for (let i = 0; i < 4; i++){ const w1 = topo - i * alt / 4; b(u - 1.15 - i * .42, u + 1.05 - i * .42, -larg, larg, w1 - alt / 4 - .02, w1, mat); } };
/* guarda do gatilho: só o contorno */
const guarda_ = (b, u, topo, mat) => { b(u + .9, u + 3.2, -.16, .16, topo - 1.75, topo - 1.45, mat); b(u + 2.9, u + 3.2, -.16, .16, topo - 1.75, topo, mat); b(u + 1.7, u + 2, -.14, .14, topo - 1.1, topo, mat); };
/* carregador curvo (ou reto, com curva = 0) pendurado em u */
const pente_ = (b, u, topo, n, mat, curva = .45) => noPente(() => { for (let i = 0; i < n; i++){ const d = curva * i * i * .28; b(u + d, u + 2.1 + d, -.55, .55, topo - (i + 1) * 1.35, topo - i * 1.35 + .02, mat); } const d = curva * (n - 1) * (n - 1) * .28; b(u + d - .2, u + 2.3 + d, -.65, .65, topo - n * 1.35 - .4, topo - n * 1.35, 'a_ferro'); });
/* o pente das pistolas fica por dentro do cabo: só a base aparece até ele sair */
const penteNoCabo_ = (b, u, topo, alt, mat) => noPente(() => { for (let i = 0; i < 4; i++){ const w1 = topo - i * alt / 4; b(u - .8 - i * .42, u + .6 - i * .42, -.4, .4, w1 - alt / 4 - .01, w1 - .05, mat); } });
/* luneta com as duas lentes */
const mira_ = (b, u0, u1, w, mat) => {
  b(u0, u1, -.55, .55, w - .55, w + .55, mat); for (const [a, c] of [[u0 - 1.4, u0 + .4], [u1 - .4, u1 + 1.6]]) b(a, c, -.82, .82, w - .82, w + .82, mat);
  b(u0 - 1.52, u0 - 1.4, -.55, .55, w - .55, w + .55, 'a_lente'); b(u1 + 1.6, u1 + 1.72, -.6, .6, w - .6, w + .6, 'a_lente');
  b((u0 + u1) / 2 - .35, (u0 + u1) / 2 + .35, -.3, .3, w + .55, w + 1.15, mat);
};
/* fita enrolada em volta de um bloco qualquer */
const atadura_ = (b, u0, u1, v, w0, w1, mat = 'a_fita') => b(u0, u1, -v - .16, v + .16, w0 - .16, w1 + .16, mat);
const parafuso_ = (b, u, w, v) => { for (const s of [-1, 1]) b(u, u + .45, ...[s * v, s * (v + .22)].sort((p, q) => p - q), w, w + .45, 'a_aco'); };

Object.assign(ARMAS, {
  /* ================================================ militares, inteiras */
  pistola:{nome:'Pistola', tipo:'militar', longa:false, desenhar(b){
    b(-1.9, 6.6, -.62, .62, 2.05, 3.5, 'a_aco_escuro'); b(-1.6, 6.2, -.55, .55, 1.05, 2.05, 'a_polimero');
    for (let u = -1.7; u < .2; u += .48) b(u, u + .2, -.68, .68, 2.2, 3.3, 'a_ferro');
    b(2.2, 4.2, .62, .68, 2.7, 3.25, 'a_metal'); b(6.6, 7.1, -.32, .32, 2.45, 3.1, 'a_preto');
    b(5.6, 6.1, -.18, .18, 3.5, 3.95, 'a_preto'); b(-1.7, -1.1, -.45, .45, 3.5, 3.95, 'a_preto');
    punho_(b, 'a_polimero', 0, 1.1, 4.2); penteNoCabo_(b, 0, 1.1, 4.2, 'a_ferro'); noPente(() => b(-3.1, -.7, -.66, .66, -3.5, -3.05, 'a_aco_escuro')); b(-1.7, -.2, .62, .72, -1.9, .1, 'a_preto');
    guarda_(b, 0, 1.05, 'a_polimero');
  }},
  revolver:{nome:'Revólver', tipo:'militar', longa:false, desenhar(b){
    b(-1.6, 1.6, -.55, .55, 1.2, 3.5, 'a_ferro'); b(1.6, 4.4, -1.05, 1.05, 1.35, 3.35, 'a_metal'); b(1.6, 4.4, -.75, .75, 1.05, 3.65, 'a_metal');
    for (const w of [1.75, 2.75]) b(2, 4, -1.12, 1.12, w, w + .3, 'a_ferro');
    b(4.4, 10.4, -.45, .45, 2.4, 3.35, 'a_aco_escuro'); b(4.4, 9.8, -.34, .34, 1.7, 2.4, 'a_ferro'); b(9.6, 10.2, -.16, .16, 3.35, 3.85, 'a_preto');
    b(-2.4, -1.5, -.3, .3, 2.9, 4.1, 'a_preto'); punho_(b, 'a_nogueira', -.1, 1.3, 4.2, .7); b(-1.5, -.9, .7, .8, -.9, -.3, 'a_latao');
    guarda_(b, .1, 1.25, 'a_ferro');
  }},
  submetralhadora:{nome:'Submetralhadora', tipo:'militar', longa:true, desenhar(b){
    b(-3.5, 9, -.75, .75, 1.2, 3.8, 'a_aco_escuro'); b(-2.8, 8, -.45, .45, 3.8, 4.25, 'a_ferro'); for (let u = -2.4; u < 7.6; u += 1.1) b(u, u + .45, -.55, .55, 4.25, 4.5, 'a_preto');
    b(9, 12.8, -.62, .62, 1.7, 3.5, 'a_polimero'); b(12.8, 15, -.34, .34, 2.4, 3.1, 'a_ferro'); b(15, 15.9, -.46, .46, 2.25, 3.25, 'a_preto');
    punho_(b, 'a_polimero', 0, 1.25, 4.4); guarda_(b, 0, 1.2, 'a_polimero'); pente_(b, 4.2, 1.2, 6, 'a_polimero', .12);
    b(-10.5, -3.5, -.2, .2, 3.2, 3.6, 'a_ferro'); b(-10.5, -3.5, -.2, .2, 1.35, 1.75, 'a_ferro'); b(-11.4, -10.4, -.55, .55, .5, 4, 'a_preto');
    b(8.2, 8.8, -.2, .2, 3.75, 5.4, 'a_preto'); b(-2.4, -1.4, -.45, .45, 4.5, 5.2, 'a_preto'); b(1.5, 3.5, .75, .85, 2.4, 3.3, 'a_metal');
  }},
  fuzil_assalto:{nome:'Fuzil de assalto', tipo:'militar', longa:true, desenhar(b){
    b(-4, 7.4, -.75, .75, 1.2, 3.9, 'a_aco_escuro'); b(-3.2, 7, -.45, .45, 3.9, 4.3, 'a_ferro');
    b(7.4, 15.4, -.82, .82, 1.55, 3.9, 'a_caqui'); for (let u = 8.2; u < 14.8; u += 1.5){ b(u, u + .8, -.88, .88, 2.3, 3.1, 'a_preto'); } b(7.4, 15.4, -.4, .4, 3.9, 4.3, 'a_aco_escuro');
    b(15.4, 21.4, -.34, .34, 2.4, 3.1, 'a_ferro'); b(21.4, 23.2, -.52, .52, 2.2, 3.3, 'a_preto'); for (const u of [21.9, 22.5]) b(u, u + .25, -.58, .58, 2.45, 3.05, 'a_ferro');
    b(17, 17.8, -.5, .5, 2.2, 3.35, 'a_aco_escuro'); b(17.2, 17.6, -.18, .18, 3.35, 5.6, 'a_preto');
    punho_(b, 'a_caqui', 0, 1.25, 4.4); guarda_(b, 0, 1.2, 'a_aco_escuro'); pente_(b, 3.9, 1.2, 5, 'a_polimero', .5);
    b(-8, -4, -.38, .38, 2.2, 3.4, 'a_ferro'); b(-13.4, -7.6, -.66, .66, 1.6, 3.8, 'a_caqui'); b(-13.4, -10.6, -.62, .62, -.4, 1.6, 'a_caqui'); b(-14.3, -13.4, -.72, .72, -.7, 3.9, 'a_preto');
    /* mira de ponto vermelho */
    b(-.8, 3, -.62, .62, 4.3, 4.8, 'a_preto'); b(-.4, 2.6, -.55, -.3, 4.8, 6.5, 'a_preto'); b(-.4, 2.6, .3, .55, 4.8, 6.5, 'a_preto'); b(-.4, 2.6, -.55, .55, 6.5, 6.85, 'a_preto'); b(1.8, 2.05, -.16, .16, 5.4, 5.75, 'a_vermelho');
    b(1.6, 3.6, .75, .86, 2.4, 3.3, 'a_metal');
  }},
  fuzil_madeira:{nome:'Fuzil antigo de coronha de madeira', tipo:'militar', longa:true, desenhar(b){
    b(-4, 7, -.72, .72, 1.3, 3.5, 'a_aco_escuro'); b(-3, 6.4, -.55, .55, 3.5, 4.1, 'a_ferro');
    b(7, 13.6, -.8, .8, 1.5, 2.7, 'a_nogueira'); b(7, 12.8, -.6, .6, 3, 4, 'a_nogueira'); b(7, 15.8, -.28, .28, 2.65, 3.1, 'a_ferro');
    b(13.6, 21.6, -.34, .34, 2.1, 2.75, 'a_aco_escuro'); b(13, 13.8, -.86, .86, 1.45, 4.05, 'a_ferro'); b(19.4, 20, -.2, .2, 2.75, 4.9, 'a_preto'); b(19.2, 20.2, -.45, .45, 2.75, 3.2, 'a_ferro'); b(21.6, 22.6, -.44, .44, 2, 2.85, 'a_preto');
    b(5.4, 6.6, -.4, .4, 4.1, 4.6, 'a_preto');
    punho_(b, 'a_nogueira', 0, 1.35, 4.2); guarda_(b, 0, 1.3, 'a_aco_escuro'); pente_(b, 3.7, 1.3, 5, 'a_ferrugem', .8);
    for (const [u0, u1, w0, w1] of [[-6.4, -4, 1.2, 3.4], [-9, -6.4, .5, 3.1], [-11.6, -9, -.2, 2.9], [-14, -11.6, -.9, 2.7]]) b(u0, u1, -.62, .62, w0, w1, 'a_nogueira');
    b(-14.6, -14, -.68, .68, -1.1, 2.8, 'a_ferro'); b(1.4, 3.8, .72, .86, 2.1, 2.7, 'a_metal');
  }},
  escopeta:{nome:'Escopeta', tipo:'militar', longa:true, desenhar(b){
    b(-3.6, 5.6, -.8, .8, 1.1, 3.7, 'a_aco_escuro'); b(.8, 3.8, .8, .9, 2.2, 3.1, 'a_metal');
    b(5.6, 22.6, -.46, .46, 2.65, 3.55, 'a_ferro'); b(5.6, 20.4, -.5, .5, 1.45, 2.45, 'a_aco_escuro'); b(20.4, 21, -.6, .6, 1.35, 3.65, 'a_preto'); b(22, 22.6, -.14, .14, 3.55, 4, 'a_latao');
    b(8.4, 14.4, -.82, .82, .95, 2.6, 'a_nogueira'); for (let u = 9.2; u < 13.8; u += 1.1) b(u, u + .35, -.9, .9, .9, 2.4, 'a_madeira2');
    punho_(b, 'a_nogueira', -.2, 1.2, 3.4); guarda_(b, -.1, 1.15, 'a_aco_escuro');
    for (const [u0, u1, w0, w1] of [[-6.4, -3.6, .8, 3.2], [-9.4, -6.4, .2, 3], [-13.8, -9.4, -.7, 2.8]]) b(u0, u1, -.66, .66, w0, w1, 'a_nogueira');
    b(-14.6, -13.8, -.72, .72, -.9, 2.9, 'a_preto');
  }},
  rifle_precisao:{nome:'Rifle de precisão', tipo:'militar', longa:true, desenhar(b){
    b(-3.8, 7.2, -.72, .72, 1.3, 3.3, 'a_aco_escuro'); b(7.2, 14.6, -.74, .74, 1.4, 2.8, 'a_verde_mil'); b(7.2, 28, -.34, .34, 2.75, 3.4, 'a_ferro'); b(28, 30, -.56, .56, 2.55, 3.6, 'a_preto');
    punho_(b, 'a_verde_mil', 0, 1.35, 4.2); guarda_(b, 0, 1.3, 'a_aco_escuro'); pente_(b, 3.8, 1.3, 2, 'a_polimero', .1);
    b(-13.8, -3.8, -.64, .64, 1, 3, 'a_verde_mil'); b(-13.8, -9.8, -.6, .6, -1.2, 1, 'a_verde_mil'); b(-11.6, -6.6, -.5, .5, 3, 3.9, 'a_preto'); b(-14.7, -13.8, -.72, .72, -1.4, 3.2, 'a_preto');
    b(2.4, 3.1, .72, 2, 2.5, 3.1, 'a_ferro'); b(2.3, 3.2, 1.8, 2.5, 1.9, 2.7, 'a_preto');                 /* alavanca do ferrolho */
    for (const u of [-1.4, 4.6]) b(u, u + .7, -.35, .35, 3.3, 4.6, 'a_ferro');
    mira_(b, -2.6, 6.4, 5.2, 'a_preto');
    for (const s of [-1, 1]) b(13.4, 22, ...[s * .55, s * .95].sort((p, q) => p - q), 1.1, 1.55, 'a_ferro');   /* bipé recolhido */
    b(13, 14, -1, 1, 1.1, 2.1, 'a_preto');
  }},
  metralhadora:{nome:'Metralhadora de apoio', tipo:'militar', longa:true, desenhar(b){
    b(-4.4, 9, -1, 1, 1.1, 4.3, 'a_verde_mil'); b(-3.6, 8.2, -.7, .7, 4.3, 4.8, 'a_aco_escuro');
    b(9, 16.4, -.85, .85, 1.9, 3.9, 'a_aco_escuro'); for (let u = 9.8; u < 15.8; u += 1.3) b(u, u + .6, -.92, .92, 2.35, 3.5, 'a_ferro');
    b(16.4, 25.6, -.46, .46, 2.5, 3.4, 'a_ferro'); b(25.6, 27.4, -.65, .65, 2.3, 3.6, 'a_preto');
    punho_(b, 'a_polimero', 0, 1.15, 4.4); guarda_(b, 0, 1.1, 'a_aco_escuro');
    noPente(() => { b(3.4, 8.4, -2.1, 2.1, -3.6, 1.1, 'a_verde_mil'); b(3.6, 8.2, -2.25, 2.25, -2.2, -1.5, 'a_preto'); }); for (let u = 4; u < 7.8; u += .75) b(u, u + .42, 1, 1.5, 1.1, 2.4, 'a_latao');
    b(-14, -4.4, -.5, .5, 2.2, 3.4, 'a_ferro'); b(-14, -8.4, -.62, .62, -.2, 2.2, 'a_polimero'); b(-15, -14, -.72, .72, -.6, 3.8, 'a_preto');
    for (const u of [-1, 5]) b(u, u + .7, -.22, .22, 4.8, 6.6, 'a_preto'); b(-1, 5.7, -.34, .34, 6.2, 7, 'a_polimero');
    for (const s of [-1, 1]){ b(18.6, 19.4, ...[s * .46, s * 2.2].sort((p, q) => p - q), 1.4, 2.5, 'a_ferro'); b(18.7, 19.3, ...[s * 1.9, s * 2.5].sort((p, q) => p - q), -3, 1.6, 'a_ferro'); }
  }},
  faca_combate:{nome:'Faca de combate', tipo:'militar', longa:false, desenhar(b){
    haste_(b, -3, 2.8, .62, 'a_polimero'); for (let u = -2.4; u < 2.4; u += .95) haste_(b, u, u + .35, .76, 'a_preto'); b(-3.8, -3, -.65, .65, -.75, .75, 'a_ferro');
    b(2.8, 3.5, -.45, .45, -1.5, 1.5, 'a_ferro'); b(3.5, 10.8, -.18, .18, -.8, .95, 'a_aco_escuro'); b(10.8, 12.4, -.16, .16, -.3, .85, 'a_aco_escuro'); b(12.4, 13.2, -.14, .14, .15, .65, 'a_metal');
    b(3.5, 11, -.2, .2, -1, -.72, 'a_aco'); for (let u = 4; u < 7; u += .8) b(u, u + .4, -.2, .2, .95, 1.3, 'a_aco_escuro');
  }},

  /* ================================================ gambiarra: tortas, remendadas, nada combina */
  gamb_pistola:{nome:'Pistola de gambiarra', tipo:'gambiarra', longa:false, desenhar(b){
    b(-1.9, 4.2, -.75, .75, .9, 2.4, 'a_tabua'); b(-1.2, 2.2, -.55, .55, 2.4, 2.9, 'a_madeira2');
    b(1, 4.6, -.45, .45, 2.5, 3.35, 'a_ferro'); b(4.6, 7.8, -.45, .45, 2.8, 3.65, 'a_ferrugem'); b(7.8, 8.4, -.62, .62, 2.6, 3.85, 'a_metal');   /* cano em dois pedaços, desalinhado */
    atadura_(b, 1.4, 2.5, .75, .9, 3.35); atadura_(b, 3.3, 4, .75, .9, 3.35, 'a_preto'); atadura_(b, 5.4, 6, .45, 2.8, 3.65);
    punho_(b, 'a_madeira2', .1, 1, 3.9, .7); penteNoCabo_(b, .1, 1, 3.9, 'a_ferrugem'); noPente(() => b(-2.9, -.6, -.6, .6, -3.3, -2.9, 'a_ferro')); atadura_(b, -2.6, -.5, .7, -2.2, -1.1, 'a_preto'); atadura_(b, -2.1, -.1, .7, -.6, -.1);
    parafuso_(b, -.9, 1.4, .75); parafuso_(b, 2.7, 1.2, .75); b(.4, 3, .75, .9, 1.9, 2.1, 'a_corda'); b(6.6, 7, -.12, .12, 3.65, 4.5, 'a_aco');
    b(1.5, 1.9, -.14, .14, -.4, .9, 'a_ferrugem'); b(-3.4, -1.9, -.2, .2, 1.8, 2.2, 'a_ferro'); b(-3.4, -3, -.2, .2, 2.2, 3.1, 'a_ferro');
  }},
  gamb_revolver:{nome:'Revólver de gambiarra', tipo:'gambiarra', longa:false, desenhar(b){
    b(-1.6, 1.6, -.6, .6, .9, 3, 'a_tabua'); b(1.5, 4.2, -1.2, 1.2, 1.1, 3.2, 'a_ferrugem'); b(1.9, 3.8, -.85, .85, .7, 3.6, 'a_ferro');   /* um "tambor" de lata amassada */
    b(2.3, 3.1, -1.32, 1.32, 1.8, 2.5, 'a_amarelo'); b(4.2, 7.2, -.4, .4, 2.2, 3, 'a_metal'); b(7.2, 9.4, -.52, .52, 1.9, 2.75, 'a_ferrugem');
    atadura_(b, 4.4, 5.2, .4, 2.2, 3); atadura_(b, 6.9, 7.6, .55, 1.9, 3, 'a_cinta'); atadura_(b, .1, 1.3, .6, .9, 3, 'a_preto');
    punho_(b, 'a_tabua', -.2, 1, 3.8, .75); for (const w of [-2.2, -1.3, -.4]) b(-2.9 + (w + 2.2) * .3, -.2 + (w + 2.2) * .3, -.9, .9, w, w + .3, 'a_corda');
    parafuso_(b, -.8, 1.9, .6); b(-2.5, -1.6, -.16, .16, 2.4, 4, 'a_ferro'); b(8.6, 9, -.1, .1, 2.75, 3.7, 'a_aco');
  }},
  gamb_submetralhadora:{nome:'Metralhadorinha de gambiarra', tipo:'gambiarra', longa:true, desenhar(b){
    b(-3.8, 7.6, -.95, .95, 1, 3.4, 'a_vermelho'); b(-3, 6.6, -.7, .7, 3.4, 3.9, 'a_ferrugem');      /* uma caixinha de ferramentas como corpo */
    b(-.8, 3.8, -.18, .18, 3.9, 5.1, 'a_metal'); b(-.8, 3.8, -.5, .5, 4.9, 5.4, 'a_preto');
    b(7.6, 12.4, -.55, .55, 2, 3.1, 'a_metal'); b(12.4, 15.4, -.4, .4, 1.7, 2.65, 'a_ferrugem'); b(15.4, 16.2, -.62, .62, 1.5, 2.85, 'a_ferro');
    atadura_(b, 8.4, 9.4, .55, 2, 3.1); atadura_(b, 12, 13, .55, 1.7, 3.1, 'a_preto');
    punho_(b, 'a_tabua', 0, 1.1, 4.2); pente_(b, 4.3, 1, 5, 'a_ferro', -.12); noPente(() => { atadura_(b, 3.6, 6.4, .6, -2.2, -1.3); atadura_(b, 4.1, 6, .6, .2, 1); });
    b(-9.5, -3.8, -.3, .3, 2.4, 3, 'a_madeira'); b(-10.4, -9.4, -1.1, 1.1, .2, 3.6, 'a_tabua'); atadura_(b, -5.4, -4.4, .3, 2.4, 3);
    b(-6.6, 1.5, -1.12, -1, .4, .9, 'a_mangueira'); b(1, 1.5, -1.12, -.9, .9, 2, 'a_mangueira');
    for (const [u, w] of [[-2.8, 1.5], [2.2, 2.7], [6.2, 1.4]]) parafuso_(b, u, w, .95);
    b(5.2, 6.8, .95, 1.1, 2.1, 2.9, 'a_branco'); b(5.6, 6.4, 1.1, 1.16, 2.35, 2.65, 'a_preto');
  }},
  gamb_fuzil:{nome:'Fuzil de gambiarra', tipo:'gambiarra', longa:true, desenhar(b){
    b(-5, 8, -.7, .7, 1.1, 3, 'a_tabua'); b(-4.2, 5, -.5, .5, 3, 3.6, 'a_madeira2');
    b(8, 13.4, -.75, .75, 1.5, 2.7, 'a_madeira'); b(3.5, 12, -.5, .5, 2.95, 3.85, 'a_ferro'); b(12, 18.6, -.42, .42, 2.7, 3.5, 'a_ferrugem'); b(18.6, 23.4, -.36, .36, 3, 3.7, 'a_metal'); b(23.4, 24.4, -.58, .58, 2.75, 3.95, 'a_ferro');
    atadura_(b, 11.4, 12.8, .75, 1.5, 3.85); atadura_(b, 18, 19.2, .45, 2.7, 3.7, 'a_preto'); atadura_(b, 6.4, 7.4, .72, 1.1, 3.85, 'a_cinta'); atadura_(b, -1.6, -.4, .7, 1.1, 3.6);
    punho_(b, 'a_madeira2', 0, 1.2, 4.1); pente_(b, 4, 1.1, 4, 'a_verde_mil', .62); noPente(() => atadura_(b, 3.8, 7, .6, -1.9, -1, 'a_preto'));
    /* coronha de pé de cadeira e um pedaço de tábua pregado */
    b(-13.2, -5, -.38, .38, 2, 2.9, 'a_madeira'); b(-12.8, -6.2, -.34, .34, .1, .9, 'a_madeira2'); b(-14.2, -12.8, -.6, .6, -.5, 3.4, 'a_tabua'); b(-7, -6.2, -.4, .4, .9, 2, 'a_ferro');
    for (const [u, w] of [[-13.8, .3], [-13.8, 2.4], [-3.8, 1.6], [1.6, 1.8], [9.4, 1.8]]) parafuso_(b, u, w, .7);
    b(21.6, 22, -.1, .1, 3.7, 5.2, 'a_aco'); b(-2.6, -2.2, -.5, -.3, 3.6, 4.8, 'a_aco'); b(-2.6, -2.2, .3, .5, 3.6, 4.8, 'a_aco');
    b(-5, 14, .78, .9, 3.5, 3.75, 'a_corda'); b(-12, -5, .4, .52, 3, 3.3, 'a_corda');                 /* bandoleira de corda */
  }},
  gamb_escopeta:{nome:'Escopeta de gambiarra', tipo:'gambiarra', longa:true, desenhar(b){
    b(-4, 4.6, -1, 1, .9, 3.1, 'a_madeira2'); b(-3, 3.4, -.7, .7, 3.1, 3.7, 'a_ferrugem');
    b(4.6, 17.6, -1.05, -.15, 2.4, 3.4, 'a_ferro'); b(4.6, 15.2, .15, 1.05, 2.05, 3.05, 'a_ferrugem'); b(17.6, 18.5, -1.2, 0, 2.2, 3.6, 'a_metal'); b(15.2, 16, 0, 1.2, 1.9, 3.2, 'a_metal');   /* dois canos de tamanhos diferentes */
    atadura_(b, 7, 8.4, 1.05, 2.05, 3.4, 'a_preto'); atadura_(b, 12.6, 13.8, 1.05, 2.05, 3.4);
    b(6.4, 12.2, -.85, .85, .9, 2, 'a_tabua'); atadura_(b, 9.4, 10.2, .85, .9, 2, 'a_cinta');
    punho_(b, 'a_tabua', -.3, 1, 3.5, .78); guarda_(b, -.2, .95, 'a_ferrugem');
    for (const [u0, u1, w0, w1] of [[-7.4, -4, .3, 2.9], [-11, -7.4, -.5, 2.4]]) b(u0, u1, -.72, .72, w0, w1, 'a_madeira');
    b(-12.2, -11, -.85, .85, -.9, 2.6, 'a_borracha'); atadura_(b, -8.2, -6.8, .72, .2, 2.6);
    for (const [u, w] of [[-3, 1.6], [2.6, 1.6]]) parafuso_(b, u, w, 1); parafuso_(b, -10, .4, .72);
    b(-1.8, -.9, -.18, .18, 3.7, 4.8, 'a_ferro'); b(16.9, 17.3, -.7, -.5, 3.4, 4.5, 'a_latao');
  }},
  gamb_precisao:{nome:'Rifle com "luneta" de gambiarra', tipo:'gambiarra', longa:true, desenhar(b){
    b(-4.6, 7.6, -.68, .68, 1.2, 3, 'a_madeira'); b(7.6, 15.6, -.55, .55, 1.6, 2.8, 'a_tabua'); b(4, 17, -.4, .4, 2.9, 3.6, 'a_ferro'); b(17, 24, -.34, .34, 2.75, 3.4, 'a_ferrugem'); b(24, 27.6, -.4, .4, 3, 3.7, 'a_metal');
    atadura_(b, 14.6, 16.4, .55, 1.6, 3.6); atadura_(b, 23.4, 24.8, .4, 2.75, 3.7, 'a_preto'); atadura_(b, 5.6, 6.6, .68, 1.2, 3.6, 'a_cinta');
    punho_(b, 'a_madeira2', 0, 1.3, 4); guarda_(b, 0, 1.25, 'a_ferro');
    b(-13.6, -4.6, -.6, .6, .8, 2.7, 'a_tabua'); b(-13.6, -9.4, -.56, .56, -1.4, .8, 'a_madeira2'); b(-11, -7, -.75, .75, 2.7, 3.9, 'a_lona'); atadura_(b, -9.6, -8.6, .75, 2.7, 3.9, 'a_corda');
    /* "luneta": um pedaço de cano amarrado torto com arame, com um fundo de garrafa na ponta */
    b(-2.2, 2.4, -.6, .6, 4.5, 5.6, 'a_mangueira'); b(2.4, 6.2, -.6, .6, 4.9, 6, 'a_mangueira'); b(6.2, 7.2, -.82, .82, 4.7, 6.2, 'a_ferrugem'); b(7.2, 7.4, -.55, .55, 5, 5.9, 'a_lente');
    for (const u of [-1.4, 4.4]){ b(u, u + .6, -.78, .78, 3.5, u < 0 ? 5.75 : 6.15, 'a_aco'); }
    for (const [u, w] of [[-12.6, .1], [-6, 1.5], [2, 1.7], [11, 1.9]]) parafuso_(b, u, w, .68);
    b(12.6, 13.2, -.16, .16, -2.4, 1.6, 'a_ferro'); b(12.4, 13.4, -.5, .5, -2.8, -2.4, 'a_borracha');       /* um pé só, de apoio */
  }},
});
Object.assign(NOMES_ARMAS, Object.fromEntries(Object.entries(ARMAS).map(([k, v]) => [k, v.nome])));

/* pose de duas mãos, para mirar (os ângulos ficam em modelo.js) */
POSES.mirando = 'Mirando (duas mãos)'; POSES.mirando_uma = 'Mirando (uma mão)';
const poseDeMira = id => ARMAS[id]?.longa === false ? 'mirando_uma' : 'mirando';

/* ideia inicial para o jogo: onde aparecem e como se comportam (só regra de jogo) */
const NOTA_NO_JOGO = {
  militar:'Raríssima. Ideia para o jogo: aparece em poucos lugares, como caixas militares abandonadas, com pouca munição.',
  gambiarra:'Montada de qualquer jeito. Ideia para o jogo: menos rara que a inteira, mas falha, quebra e não é confiável.',
};
