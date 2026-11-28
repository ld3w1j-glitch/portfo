/* Itens de cenário da Polícia Militar. Carregado depois de faccoes-cena.js (usa as letras de policia.js).
   Sem brasão nem prefixos reais. A viatura nova segue fotos públicas da pintura cáqui e preta. */
(() => {
  const CAT = 'Polícia Militar';
  BIBLIOTECA.CATEGORIAS.push(CAT);
  Object.assign(BIBLIOTECA.FIXAS, {pm_texto:'#F1F1EC', pm_vermelho:'#C4261E', pm_luz_azul:'#2F7BFF', pm_pelo:'#A97440', pm_pelo_escuro:'#241A14'});
  for (const m of ['pm_texto', 'pm_vermelho', 'pm_luz_azul']) BIBLIOTECA.LISOS.add(m);
  const item = (id, nome, cores, desenhar) => BIBLIOTECA.ITENS[id] = {id, nome, cat:CAT, cores, desenhar};
  /* texto em uma face: 'f' frente (+z), 't' trás (-z), 'd' (+x), 'e' (-x); p = posição da face, a = centro ao longo dela */
  const texto = (g, face, txt, t, p, a, y, mat) => escrevePm(txt, t, (u0, u1, v0, v1) => {
    const s = (face === 'f' || face === 'd') ? 1 : -1, dir = (face === 'f' || face === 'e') ? 1 : -1, m = a + dir * (u0 + u1) / 2, w = u1 - u0;
    if (face === 'f' || face === 't') g.b(m, y + v0, p + s * .008, w, v1 - v0, .016, mat, 1); else g.b(p + s * .008, y + v0, m, .016, v1 - v0, w, mat, 1);
  });
  const roda = (g, x, y, z, r, larg) => {
    g.b(x, y - r * .62, z, larg, r * 1.24, r * 2, 'borracha', .12); g.b(x, y - r, z, larg, r * 2, r * 1.24, 'borracha', .12);
    g.b(x, y - r * .45, z, larg + .04, r * .9, r * .9, 'metal', .2); g.b(x, y - r * .18, z, larg + .07, r * .36, r * .36, 'ferro', 1);
  };
  function viatura(g, nova){
    const corpo = nova ? 'caqui' : 'pintura', alto = nova ? 'escuro' : 'pintura';
    g.b(0, .42, 0, 1.8, .62, 4, corpo, .2); g.b(0, 1.04, 1.45, 1.74, .08, 1.08, alto, .2);              /* corpo e capô */
    g.b(0, 1.04, -.55, 1.62, .68, 2.45, 'vidro_escuro', .35);
    for (const x of [-.8, .8]) for (const z of [-1.72, -.65, .4]) g.b(x, 1.04, z, .1, .68, .12, alto, .3);
    g.b(0, 1.7, -.55, 1.72, .14, 2.5, alto, .2); g.b(0, 1.05, .72, 1.56, .55, .1, 'vidro', .4);
    for (const x of [-.91, .91]){ roda(g, x, .38, -1.35, .38, .26); roda(g, x, .38, 1.3, .38, .26); g.b(x * 1.07, 1.1, .66, .14, .14, .2, 'escuro', .2); }
    g.b(0, .38, 2.04, 1.82, .26, .14, 'ferro', .25); g.b(0, .38, -2.04, 1.82, .26, .14, 'ferro', .25); g.b(0, .68, 2.02, .85, .2, .05, 'preto', .2);
    for (const x of [-.66, .66]){ g.b(x, .74, 2.02, .32, .18, .06, 'luz', 1); g.b(x, .74, -2.02, .3, .18, .06, 'vermelho', 1); }
    /* barra de luz: azul no patrulhamento, com pontas vermelhas */
    g.b(0, 1.84, -.35, 1.3, .06, .3, 'preto', .3); for (const x of [-.42, 0, .42]) g.b(x, 1.9, -.35, .38, .13, .26, x === 0 ? 'pm_texto' : 'pm_luz_azul', 1);
    for (const x of [-.65, .65]) g.b(x, 1.9, -.35, .08, .13, .27, 'pm_vermelho', 1);
    if (nova){
      g.b(0, 1.121, 1.45, .9, .012, 1.08, 'caqui', .2);                                                  /* faixa do capô */
      for (const [txt, base] of [['POLICIA', 1.5], ['MILITAR', 1.72]]) escrevePm(txt, .029, (u0, u1, v0, v1) => g.b((u0 + u1) / 2, 1.127, base - (v0 + v1) / 2, u1 - u0, .008, v1 - v0, 'preto', 1));
      for (let z = 1; z < 1.95; z += .2) for (const x of [-.52, .52]) g.b(x, 1.122, z, .12, .012, .1, 'escuro', 1);
      for (const [face, x] of [['d', .9], ['e', -.9]]){
        g.b(x * 1.003, .84, -.1, .012, .2, 3.9, 'escuro', .3);
        texto(g, face, 'POLICIA', .042, x * 1.01, -.12, .55, 'escuro');
      }
    } else {
      for (const [face, x] of [['d', .9], ['e', -.9]]){
        [['faixa_azul', .86], ['faixa_amarela', .75], ['pm_vermelho', .66]].forEach(([m, y]) => g.b(x * 1.003, y, 0, .012, .09, 4, m, .3));
        texto(g, face, 'POLICIA', .042, x * 1.012, 0, .43, 'faixa_azul');
      }
    }
    texto(g, 't', 'POLICIA', .035, -2.11, 0, .43, 'pm_texto'); texto(g, 'f', 'PM', .035, 2.11, 0, .43, 'pm_texto');
    g.b(0, .66, -2.05, .55, .16, .03, 'branco', .5);
  }
  item('pm_viatura', 'Viatura nova (cáqui e preta)', {caqui:['Cáqui', '#B49C6C'], escuro:['Preto', '#17181B']}, g => viatura(g, true));
  item('pm_viatura_antiga', 'Viatura antiga (branca)', {pintura:['Pintura', '#E9E8E2'], escuro:['Detalhes', '#222428'], faixa_azul:['Faixa azul', '#2455B5'], faixa_amarela:['Faixa amarela', '#EFB31F']}, g => viatura(g, false));
  item('pm_moto', 'Moto da polícia', {caqui:['Cáqui', '#B49C6C'], escuro:['Preto', '#17181B']}, g => {
    for (const z of [-.68, .68]) roda(g, 0, .32, z, .32, .16);
    g.b(0, .3, -.05, .24, .3, .95, 'ferro', .15); g.b(0, .58, .18, .34, .26, .55, 'caqui', .13); g.b(0, .58, -.35, .28, .13, .6, 'preto', .12); g.b(0, .62, -.74, .3, .2, .3, 'caqui', .13);
    g.b(0, .55, .55, .34, .45, .22, 'escuro', .13); g.b(0, .98, .56, .28, .2, .06, 'vidro', .3); g.b(0, .78, .68, .16, .12, .05, 'luz', 1);
    g.b(0, .96, .42, .72, .05, .06, 'ferro', .3); for (const x of [-.38, .38]) g.b(x, .95, .42, .1, .07, .07, 'preto', 1);
    g.b(0, .35, .66, .1, .5, .08, 'metal', .3); g.b(.19, .34, -.45, .1, .1, .75, 'metal', .3);
    for (const x of [-.24, .24]) g.b(x, .6, -.78, .18, .3, .32, 'escuro', .12);
    g.b(0, .82, -.95, .06, .42, .06, 'ferro', 1); g.b(0, 1.24, -.95, .14, .12, .14, 'pm_luz_azul', 1);
    for (const [face, x] of [['d', .17], ['e', -.17]]) texto(g, face, 'PM', .032, x, .18, .63, 'escuro');
  });
  item('pm_cao', 'Cão policial (pastor belga)', {}, g => {
    for (const x of [-.12, .12]) for (const z of [-.3, .24]){ g.b(x, 0, z, .09, .4, .1, 'pm_pelo', .07); g.b(x, 0, z + .03, .1, .06, .13, 'pm_pelo_escuro', .07); }
    g.b(0, .36, -.03, .34, .27, .72, 'pm_pelo', .07); g.b(0, .56, -.1, .3, .09, .5, 'pm_pelo_escuro', .07);
    g.b(0, .55, .32, .2, .3, .18, 'pm_pelo', .07); g.b(0, .74, .43, .25, .24, .26, 'pm_pelo', .07);
    g.b(0, .74, .61, .15, .13, .17, 'pm_pelo_escuro', .06); g.b(0, .83, .7, .07, .05, .03, 'preto', 1);
    for (const x of [-.08, .08]){ g.b(x, .98, .4, .07, .13, .06, 'pm_pelo_escuro', .05); g.b(x, .89, .565, .04, .035, .015, 'preto', 1); }
    g.b(0, .7, .72, .06, .04, .03, 'pm_vermelho', 1);
    g.b(0, .42, -.46, .09, .1, .2, 'pm_pelo', .07); g.b(0, .3, -.58, .08, .2, .1, 'pm_pelo_escuro', .07);
    g.b(0, .4, .1, .37, .24, .26, 'preto', .1); for (const [face, x] of [['d', .185], ['e', -.185]]) texto(g, face, 'PM', .022, x, .1, .46, 'pm_texto');
  });
  item('pm_cone', 'Cone de sinalização', {cone:['Cor', '#F2661A']}, g => {
    g.b(0, 0, 0, .42, .05, .42, 'preto', .2);
    [[.28, .05], [.23, .2], [.18, .35], [.13, .5], [.08, .65]].forEach(([w, y], i) => g.b(0, y, 0, w, .155, w, i === 2 ? 'pm_texto' : 'cone', .08));
  });
  item('pm_cavalete', 'Cavalete da polícia', {}, g => {
    for (const x of [-.75, .75]){ g.b(x, 0, 0, .09, 1.05, .09, 'ferro', .3); g.b(x, 0, 0, .1, .06, .5, 'ferro', .3); }
    g.b(0, .62, 0, 1.8, .42, .08, 'preto', .2); texto(g, 'f', 'POLICIA', .05, .04, 0, .71, 'pm_texto'); texto(g, 't', 'POLICIA', .05, -.04, 0, .71, 'pm_texto');
    g.b(0, .32, 0, 1.6, .14, .06, 'flor2', .2); for (let x = -.7; x < .75; x += .28) g.b(x, .32, .004, .12, .14, .062, 'preto', .5);
  });
  item('pm_fita', 'Fita de isolamento', {fita:['Fita', '#F2C230']}, g => {
    for (const x of [-1, 1]){ g.b(x, 0, 0, .07, 1.05, .07, 'metal', .3); g.b(x, 0, 0, .26, .05, .26, 'preto', .2); }
    g.b(0, .88, 0, 2, .12, .015, 'fita', .3); for (let x = -.85; x < .9; x += .24) g.b(x, .88, .002, .09, .12, .017, 'preto', 1);
  });
  item('pm_posto', 'Posto policial móvel', {toldo:['Toldo', '#B49C6C']}, g => {
    for (const x of [-1.4, 1.4]) for (const z of [-1, 1]) g.b(x, 0, z, .08, 2.2, .08, 'metal', .3);
    g.b(0, 2.2, 0, 3.1, .18, 2.3, 'toldo', .22); g.b(0, 2.38, 0, 2.2, .2, 1.6, 'toldo', .22); g.b(0, 2.58, 0, 1.2, .18, .9, 'toldo', .22);
    g.b(0, 1.88, 1.14, 3.1, .34, .05, 'preto', .2); texto(g, 'f', 'POLICIA MILITAR', .034, 1.17, 0, 1.97, 'pm_texto');
    g.b(0, .78, .55, 1.9, .07, .62, 'madeira', .15); for (const x of [-.85, .85]) g.b(x, 0, .55, .08, .78, .5, 'ferro', .2);
    g.b(-.45, .85, .55, .4, .05, .3, 'ferro', .1); g.b(-.45, .9, .42, .4, .28, .03, 'preto', .1); g.b(.45, .85, .55, .18, .22, .1, 'preto', .1); g.b(.5, 1.07, .55, .03, .22, .03, 'ferro', 1);
    g.b(1.4, 2.4, 1, .16, .16, .16, 'pm_luz_azul', 1);
  });
})();
