/* Itens de cenário com a identidade de cada facção: bandeira, muro pintado e placa de território.
   Carregado depois de cenario-itens.js. */
(() => {
  const CAT = 'Facções';
  BIBLIOTECA.CATEGORIAS.push(CAT);
  const novo = (id, nome, fundo, simbolo, desenhar) => BIBLIOTECA.ITENS[id] = {id, nome, cat:CAT, desenhar,
    cores:{fundo_f:['Cor de fundo', fundo], simbolo_f:['Cor do símbolo', simbolo]}};
  /* emblema virado para a frente (+Z): x = centro, y = base */
  const emblema = (g, id, x, y, z, tam) => EMBLEMAS[id].px.forEach((linha, l) => [...linha].forEach((p, i) => {
    if (p === '1') g.b(x + (i - 4) * tam, y + (8 - l) * tam, z, tam * 1.02, tam * 1.02, .025, 'simbolo_f', 1);
  }));
  for (const [id, e] of Object.entries(EMBLEMAS)){
    if (!e.px) continue;
    novo(`bandeira_${id}`, `Bandeira: ${e.nome}`, e.fundo, e.simbolo, g => {
      g.b(0, 0, 0, .34, .16, .34, 'concreto', .15); g.b(0, 0, 0, .09, 3.3, .09, 'ferro', .3); g.b(0, 3.3, 0, .15, .12, .15, 'metal', 1);
      for (let i = 0; i < 6; i++){ const dz = [0, .03, .05, .02, -.02, -.04][i]; g.b(.16 + i * .22, 2.08 + (i > 4 ? .03 : 0), dz, .23, 1.14 - (i > 4 ? .08 : 0), .045, 'fundo_f', .2); }
      emblema(g, id, .72, 2.2, .085, .1);
    });
    BIBLIOTECA.ITENS[`muro_${id}`] = {id:`muro_${id}`, nome:`Muro: ${e.nome}`, cat:CAT,
      cores:{parede:['Cor do muro', '#B4ADA0'], fundo_f:['Cor da pintura', e.fundo], simbolo_f:['Cor do símbolo', e.simbolo]},
      desenhar(g){
        g.b(0, 0, 0, 3, 2.1, .22, 'parede', .24); g.b(0, 2.1, 0, 3.1, .1, .3, 'concreto', .3); g.b(0, 0, .005, 3, .22, .23, 'concreto', .24);
        g.b(0, .42, .15, 1.62, 1.5, .08, 'fundo_f', .2); emblema(g, id, 0, .5, .225, .15);                  /* pintura saliente, para não se misturar com o muro */
        for (const [x, y, w] of [[-1.15, .6, .35], [1.1, .45, .45], [1.2, 1.6, .25]]) g.b(x, y, .125, w, .12, .03, 'concreto', .12);
      }};
    novo(`placa_${id}`, `Placa: ${e.nome}`, e.fundo, e.simbolo, g => {
      g.b(-.42, 0, 0, .09, 1.5, .09, 'madeira_velha', .25); g.b(.42, 0, 0, .09, 1.5, .09, 'madeira_velha', .25);
      g.b(0, .75, .03, 1.15, 1.1, .08, 'fundo_f', .2); emblema(g, id, 0, .86, .085, .1);
    });
  }
})();
