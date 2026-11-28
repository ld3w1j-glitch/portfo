/* Biblioteca de casas e objetos do Montador de cenários.
   Medidas em metros (o personagem tem cerca de 1,80 m). Y é a altura; a frente do item é +Z.
   b(x, y, z, largura, altura, profundidade, material, pixel): x e z são o centro; y é a base.
   Para criar um item novo: item('id', 'Nome', 'Categoria', {cor:['Rótulo', '#HEX']}, g => { ... }). */
const BIBLIOTECA = (() => {
  const CATEGORIAS = ['Casas e construções', 'Paredes e pisos', 'Natureza', 'Rua e cidade', 'Veículos', 'Móveis e interior', 'Sobrevivência'];
  const ITENS = {};
  const item = (id, nome, cat, cores, desenhar, extra = {}) => { ITENS[id] = {id, nome, cat:CATEGORIAS[cat], cores, desenhar, ...extra}; };

  /* cores fixas, usadas por vários itens */
  const FIXAS = {vidro:'#7FB4CF', vidro_escuro:'#31485A', moldura:'#EDE9DD', madeira:'#8A6240', madeira_velha:'#6E5844', tronco:'#6B4A30',
    metal:'#9AA0A8', ferro:'#4B5058', preto:'#1C1D20', borracha:'#26262A', pedra:'#8A8880', concreto:'#A9A79F', tijolo:'#A2503A', asfalto:'#3C3E43',
    faixa_rua:'#E8D44D', branco:'#F1F1EC', grama:'#5C8A3C', terra:'#7A5A3A', areia:'#CDB57E', agua:'#3E7CA8', folha:'#3F7A38', folha_clara:'#5E9A42',
    pinho:'#2F5D3A', flor:'#E5566B', flor2:'#F2C230', fogo:'#F27D1E', brasa:'#C4361C', chama:'#FFD25A', ferrugem:'#8F4A2A', lona:'#6F6A4C',
    saco:'#B79F74', vermelho:'#B8352E', azul:'#2F5F9E', verde_mil:'#4B5340', laranja:'#F16A32', papel:'#E8E2D0', tela:'#2E5C99', tela_clara:'#7FD0FF', luz:'#FFEFB0'};
  const LISOS = new Set(['vidro', 'vidro_escuro', 'tela', 'tela_clara', 'luz', 'chama', 'faixa_rua']);

  /* ---------- peças reaproveitadas ---------- */
  /* telhado de duas águas em degraus; a cumeeira corre ao longo de X */
  function telhado(g, y, larg, prof, alt, mat, z0 = 0, x0 = 0){
    const n = Math.max(3, Math.round(alt / .18));
    for (let i = 0; i < n; i++){
      const p = prof * (1 - i / n) + .14;
      g.b(x0, y + i * alt / n, z0, larg, alt / n + .012, p, i % 2 ? mat + '_sombra' : mat, .24);
    }
    g.b(x0, y + alt, z0, larg + .06, .09, .2, mat + '_escuro', .3);
  }
  /* triângulo de parede sob o telhado */
  function oitao(g, y, larg, prof, alt, mat){
    const n = Math.max(3, Math.round(alt / .18));
    for (const x of [-larg / 2 + .08, larg / 2 - .08]) for (let i = 0; i < n; i++) g.b(x, y + i * alt / n, 0, .16, alt / n + .01, Math.max(.1, prof * (1 - (i + .6) / n)), mat, .24);
  }
  /* janela numa parede: face 'f' (frente, +z), 't' (trás), 'd' (+x), 'e' (-x); p = posição da parede */
  function janela(g, face, p, ao_longo, y, w = .9, h = .85, quebrada = false){
    const lado = face === 'd' || face === 'e', s = (face === 'f' || face === 'd') ? 1 : -1;
    const poe = (a, yy, ww, hh, saliencia, esp, mat) => lado ? g.b(p + s * saliencia, yy, a, esp, hh, ww, mat, .3) : g.b(a, yy, p + s * saliencia, ww, hh, esp, mat, .3);
    poe(ao_longo, y - .07, w + .16, h + .14, .02, .06, 'moldura');
    poe(ao_longo, y, w, h, .045, .04, quebrada ? 'vidro_escuro' : 'vidro');
    poe(ao_longo, y, .06, h, .07, .03, 'moldura'); poe(ao_longo, y + h / 2 - .03, w, .06, .07, .03, 'moldura');
    poe(ao_longo, y - .12, w + .28, .07, .09, .14, 'moldura');
    if (quebrada){ poe(ao_longo - w * .22, y + h * .6, w * .36, .09, .09, .03, 'madeira_velha'); poe(ao_longo + w * .1, y + h * .25, w * .75, .1, .095, .03, 'madeira_velha'); }
  }
  function porta(g, x, z, mat = 'porta', w = 1, h = 2.05){
    g.b(x, 0, z + .02, w + .18, h + .09, .07, 'moldura', .3); g.b(x, 0, z + .05, w, h, .07, mat, .2);
    for (const yy of [.25, 1.15]) g.b(x, yy, z + .09, w - .26, .65, .03, mat + '_sombra', .25);
    g.b(x + w * .32, 1, z + .12, .09, .09, .07, 'metal', 1);
  }
  const roda = (g, x, y, z, r, larg) => {
    g.b(x, y - r * .62, z, larg, r * 1.24, r * 2, 'borracha', .12); g.b(x, y - r, z, larg, r * 2, r * 1.24, 'borracha', .12);
    g.b(x, y - r * .45, z, larg + .04, r * .9, r * .9, 'metal', .2); g.b(x, y - r * .18, z, larg + .07, r * .36, r * .36, 'ferro', 1);
  };
  /* "cilindro" em blocos: duas caixas cruzadas */
  const cil = (g, x, y, z, r, h, mat, px = .1) => { g.b(x, y, z, r * 2, h, r * 1.3, mat, px); g.b(x, y + .003, z, r * 1.3, h - .006, r * 2, mat, px); };
  /* copa de árvore: blocos arredondados */
  const copa = (g, x, y, z, r, h, mat) => { cil(g, x, y, z, r, h, mat, .22); cil(g, x, y - h * .18, z, r * .72, h * 1.36, mat + '_sombra', .22); cil(g, x, y + h * .3, z, r * .62, h, mat + '_claro', .22); };

  /* ================================================== casas e construções */
  item('casa', 'Casa pequena', 0, {parede:['Parede', '#D9C7A3'], telhado:['Telhado', '#A2503A'], porta:['Porta', '#5A3F2A']}, g => {
    g.b(0, 0, 0, 5.2, .18, 4.2, 'concreto', .3); g.b(0, .18, 0, 5, 2.5, 4, 'parede', .24); g.b(0, 2.6, 0, 5.1, .12, 4.1, 'moldura', .3);
    oitao(g, 2.72, 5, 4, 1.3, 'parede'); telhado(g, 2.72, 5.5, 4.5, 1.45, 'telhado');
    porta(g, -.9, 2); janela(g, 'f', 2, 1.15, 1.05, 1.15, .95); janela(g, 'd', 2.5, -.2, 1.05); janela(g, 'e', -2.5, -.2, 1.05); janela(g, 't', -2, .9, 1.05); janela(g, 't', -2, -1.1, 1.05);
    g.b(-.9, 0, 2.35, 1.5, .12, .5, 'concreto', .2); g.b(1.5, 2.9, -.9, .45, 1.5, .45, 'tijolo', .16); g.b(1.5, 4.4, -.9, .55, .1, .55, 'ferro', .2);
    g.b(-1.75, 1.55, 2.06, .18, .3, .14, 'luz', 1); g.b(1.15, .75, 2.18, 1.3, .18, .24, 'madeira', .2); for (let x = .65; x < 1.75; x += .22) g.b(x, .93, 2.18, .13, .14, .13, x % .44 < .22 ? 'flor' : 'folha_clara', .2);
  });
  item('sobrado', 'Sobrado', 0, {parede:['Parede', '#B9C4C9'], telhado:['Telhado', '#3C4450'], porta:['Porta', '#7A2E24']}, g => {
    g.b(0, 0, 0, 6.2, .2, 5.2, 'concreto', .35); g.b(0, .2, 0, 6, 5.4, 5, 'parede', .28);
    for (const y of [2.75, 5.5]) g.b(0, y, 0, 6.14, .16, 5.14, 'moldura', .35);
    oitao(g, 5.66, 6, 5, 1.5, 'parede'); telhado(g, 5.66, 6.5, 5.5, 1.65, 'telhado');
    porta(g, 0, 2.5, 'porta', 1.1, 2.15); for (const x of [-1.95, 1.95]) janela(g, 'f', 2.5, x, 1.05, 1.1, 1); for (const x of [-1.95, 0, 1.95]) janela(g, 'f', 2.5, x, 3.65, 1, 1);
    for (const y of [1.05, 3.65]){ for (const z of [-1.1, 1.1]){ janela(g, 'd', 3, z, y); janela(g, 'e', -3, z, y); } janela(g, 't', -2.5, -1.5, y); janela(g, 't', -2.5, 1.5, y); }
    g.b(0, 2.45, 2.95, 2.4, .14, .9, 'moldura', .25); for (const x of [-1.1, 1.1]) g.b(x, 0, 3.3, .14, 2.45, .14, 'moldura', .25); g.b(0, 0, 2.95, 2.4, .14, .9, 'concreto', .25);
  });
  item('cabana', 'Cabana de madeira', 0, {parede:['Toras', '#8A6240'], telhado:['Telhado', '#4E3A2A'], porta:['Porta', '#5A3F2A']}, g => {
    for (let i = 0; i < 9; i++){ const y = i * .26; g.b(0, y, 0, 4.2 + (i % 2 ? .3 : 0), .27, 3.4, i % 2 ? 'parede' : 'parede_sombra', .2); g.b(0, y, 0, 4.2 + (i % 2 ? 0 : .3), .265, 3.2, i % 2 ? 'parede' : 'parede_sombra', .2); }
    oitao(g, 2.34, 4.2, 3.4, 1.35, 'parede_sombra'); telhado(g, 2.34, 4.9, 4.1, 1.5, 'telhado');
    porta(g, -.7, 1.72, 'porta', .95, 1.95); janela(g, 'f', 1.72, .95, .95, .8, .75); janela(g, 'd', 2.25, 0, .95, .8, .75); janela(g, 'e', -2.25, 0, .95, .8, .75);
    g.b(0, 0, 2.2, 4.4, .16, 1, 'madeira', .2); for (const x of [-2.05, 2.05]) g.b(x, 0, 2.62, .14, 2.2, .14, 'tronco', .2); g.b(0, 2.2, 2.3, 4.5, .12, 1.1, 'telhado_sombra', .25);
  });
  item('galpao', 'Galpão / oficina', 0, {parede:['Chapa', '#7C8A8F'], telhado:['Cobertura', '#5A646C'], porta:['Portão', '#C4742E']}, g => {
    g.b(0, 0, 0, 7, 3.2, 5.4, 'parede', .3); for (let x = -3.3; x < 3.4; x += .55){ g.b(x, 0, 2.72, .12, 3.2, .08, 'parede_sombra', .5); g.b(x, 0, -2.72, .12, 3.2, .08, 'parede_sombra', .5); }
    oitao(g, 3.2, 7, 5.4, .9, 'parede_sombra'); telhado(g, 3.2, 7.4, 5.9, 1.05, 'telhado');
    g.b(-.9, 0, 2.77, 3.3, 2.6, .08, 'ferro', .3); g.b(-.9, 0, 2.82, 3.05, 2.45, .06, 'porta', .25); for (let y = .25; y < 2.4; y += .32) g.b(-.9, y, 2.86, 3.05, .06, .04, 'porta_escuro', .5);
    porta(g, 2.35, 2.72, 'porta_sombra', .85, 1.95); janela(g, 'd', 3.5, -1, 1.7, 1.2, .7, true); janela(g, 'd', 3.5, 1.2, 1.7, 1.2, .7); janela(g, 'e', -3.5, 0, 1.7, 1.6, .7);
    g.b(2.35, 2.2, 2.78, 1.1, .35, .1, 'papel', .2);
  });
  item('mercado', 'Mercadinho', 0, {parede:['Parede', '#E4D3B0'], telhado:['Toldo', '#2F6E4F'], porta:['Letreiro', '#F16A32']}, g => {
    g.b(0, 0, 0, 6.4, 3.4, 4.4, 'parede', .28); g.b(0, 3.4, 0, 6.6, .3, 4.6, 'parede_escuro', .3); g.b(0, 3.7, -.1, 5.9, .12, 3.8, 'concreto', .4);
    g.b(0, 2.75, 2.28, 4.6, .55, .14, 'porta', .2); for (let x = -1.8; x <= 1.9; x += .42) g.b(x, 2.9, 2.37, .26, .24, .05, 'branco', .5);
    for (let i = 0; i < 12; i++) g.b(-2.75 + i * .5, 2.3, 2.65, .5, .16, .95, i % 2 ? 'telhado' : 'branco', .25);
    for (let i = 0; i < 12; i++) g.b(-2.75 + i * .5, 2.08, 3.1, .5, .24, .07, i % 2 ? 'telhado' : 'branco', .25);
    porta(g, 0, 2.2, 'vidro_escuro', 1.1, 2); janela(g, 'f', 2.2, -2, .75, 1.7, 1.25); janela(g, 'f', 2.2, 2, .75, 1.7, 1.25, true); janela(g, 'd', 3.2, 0, 1.1);
    for (const x of [-2.5, -1.8]){ g.b(x, 0, 2.65, .6, .35, .5, 'madeira', .15); for (let k = 0; k < 4; k++) g.b(x - .18 + (k % 2) * .36, .35, 2.55 + (k > 1 ? .2 : 0), .22, .18, .18, k % 2 ? 'flor2' : 'vermelho', .2); }
  });
  item('torre', 'Torre de vigia', 0, {parede:['Madeira', '#6E5844'], telhado:['Cobertura', '#4B5340']}, g => {
    for (const x of [-1.2, 1.2]) for (const z of [-1.2, 1.2]) g.b(x, 0, z, .2, 4.4, .2, 'parede_sombra', .25);
    for (const y of [1.2, 2.5]){ for (const z of [-1.2, 1.2]) g.b(0, y, z, 2.4, .12, .12, 'parede', .25); for (const x of [-1.2, 1.2]) g.b(x, y + .3, 0, .12, .12, 2.4, 'parede', .25); }
    g.b(0, 3.5, 0, 3.1, .18, 3.1, 'parede', .22); for (const z of [-1.5, 1.5]){ g.b(0, 4.4, z, 3.1, .12, .12, 'parede', .25); g.b(0, 3.68, z, 3.1, .45, .08, 'parede_sombra', .2); } for (const x of [-1.5, 1.5]){ g.b(x, 4.4, 0, .12, .12, 3.1, 'parede', .25); g.b(x, 3.68, 0, .08, .45, 3.1, 'parede_sombra', .2); }
    for (const x of [-1.4, 1.4]) for (const z of [-1.4, 1.4]) g.b(x, 3.68, z, .14, 2, .14, 'parede', .25);
    telhado(g, 5.65, 3.6, 3.6, .9, 'telhado');
    for (let y = .15; y < 3.6; y += .3) g.b(0, y, 1.42, .6, .07, .08, 'madeira', .3); for (const x of [-.33, .33]) g.b(x, 0, 1.42, .08, 3.65, .09, 'madeira', .3);
    g.b(1.1, 4.5, 1.1, .3, .3, .3, 'ferro', .2); g.b(1.1, 4.55, 1.3, .22, .22, .12, 'luz', 1);
  });
  item('ruina', 'Casa em ruínas', 0, {parede:['Parede', '#A8A090'], porta:['Porta caída', '#5A3F2A']}, g => {
    g.b(0, 0, 0, 5.2, .16, 4.2, 'concreto', .3);
    [[-2.4, 2.6], [-1.9, 2.3], [-1.4, 1.5], [-.9, .6], [.9, 1.1], [1.4, 2.0], [1.9, 2.35], [2.4, 1.7]].forEach(([x, h]) => g.b(x, .16, 1.9, .5, h, .24, 'parede', .22));
    for (let i = 0; i < 10; i++) g.b(-2.25 + i * .5, .16, -1.9, .5, [2.6, 2.6, 2.3, 2.45, 1.8, 1.2, 1.5, 2.1, 2.6, 2.2][i], .24, 'parede_sombra', .22);
    for (let i = 0; i < 8; i++){ g.b(-2.5, .16, -1.6 + i * .46, .24, [2.5, 2.2, 1.7, 2, 2.4, 2.6, 2.6, 2.5][i], .46, 'parede', .22); g.b(2.5, .16, -1.6 + i * .46, .24, [1.8, 1.1, .5, .7, 1.4, 1, 1.6, 1.7][i], .46, 'parede', .22); }
    janela(g, 't', -2.02, -1.4, 1, .9, .85, true); janela(g, 'e', -2.62, .9, 1, .9, .85, true); g.b(.2, .16, 2.3, 1, .09, 1.7, 'porta', .2);
    for (const [x, z, s] of [[1.2, .4, .5], [1.7, .9, .35], [.4, -.5, .28], [-1.2, .8, .4], [2.9, -.2, .45], [-.3, 1.4, .22], [1, -1.1, .3]]) g.b(x, .16, z, s, s * .65, s * .85, s > .35 ? 'tijolo' : 'parede_sombra', .14);
    g.b(-.6, .9, -.6, 3.6, .14, .18, 'madeira_velha', .2); g.b(-1.9, .16, -.6, .18, .8, .18, 'madeira_velha', .2);
  });

  /* ================================================== paredes e pisos (peças de encaixe, de 2 em 2 metros) */
  const PAR = {parede:['Parede', '#D9D3C5']};
  item('parede_lisa', 'Parede lisa', 1, PAR, g => { g.b(0, 0, 0, 2, 2.7, .2, 'parede', .22); g.b(0, 0, 0, 2, .14, .24, 'parede_escuro', .3); });
  item('parede_janela', 'Parede com janela', 1, PAR, g => { g.b(0, 0, 0, 2, 2.7, .2, 'parede', .22); g.b(0, 0, 0, 2, .14, .24, 'parede_escuro', .3); janela(g, 'f', .1, 0, 1, 1.1, 1); janela(g, 't', -.1, 0, 1, 1.1, 1); });
  item('parede_porta', 'Parede com vão de porta', 1, PAR, g => { for (const x of [-.775, .775]) g.b(x, 0, 0, .45, 2.7, .2, 'parede', .22); g.b(0, 2.12, 0, 1.1, .58, .2, 'parede', .22); for (const x of [-.55, .55]) g.b(x, 0, 0, .1, 2.14, .26, 'moldura', .3); g.b(0, 2.08, 0, 1.2, .1, .26, 'moldura', .3); }, {solta:true});
  item('porta_solta', 'Porta', 1, {porta:['Porta', '#5A3F2A']}, g => porta(g, 0, -.03, 'porta', .96, 2.03));
  item('muro', 'Muro de tijolos', 1, {parede:['Tijolo', '#A2503A']}, g => { for (let l = 0; l < 10; l++) for (let i = 0; i < 6; i++){ const x = -1 + i * .4 + (l % 2 ? .2 : 0); if (x > 1.05) continue; g.b(Math.min(.9, x), l * .17, 0, .38, .15, .24, (i * 7 + l * 3) % 5 === 0 ? 'parede_sombra' : 'parede', .4); } g.b(0, 0, 0, 2, 1.68, .18, 'concreto', .3); g.b(0, 1.7, 0, 2.06, .1, .3, 'concreto', .3); });
  item('cerca', 'Cerca de madeira', 1, {parede:['Madeira', '#8A6240']}, g => { for (let x = -.9; x <= .95; x += .3){ g.b(x, 0, 0, .18, 1.05, .07, 'parede', .18); g.b(x, 1.05, 0, .11, .1, .07, 'parede', .2); } for (const y of [.25, .75]) g.b(0, y, -.07, 2, .1, .08, 'parede_sombra', .25); });
  item('grade', 'Grade de metal', 1, {parede:['Metal', '#4B5058']}, g => { for (let x = -.94; x <= .95; x += .17) g.b(x, 0, 0, .05, 1.9, .05, 'parede', .4); for (const y of [.15, 1.6]) g.b(0, y, 0, 2, .07, .07, 'parede_sombra', .4); for (const x of [-1, 1]) g.b(x, 0, 0, .11, 2.05, .11, 'parede_escuro', .4); });
  item('piso_madeira', 'Piso de madeira', 1, {parede:['Madeira', '#9A7048']}, g => { for (let i = 0; i < 8; i++) g.b(-.875 + i * .25, 0, 0, .24, .06, 2, ['parede', 'parede_sombra', 'parede_claro'][(i * 5) % 3], .25); }, {chao:true});
  item('piso_cimento', 'Piso de concreto', 1, {parede:['Concreto', '#A9A79F']}, g => { for (const x of [-.5, .5]) for (const z of [-.5, .5]) g.b(x, 0, z, .98, .05, .98, (x * z > 0) ? 'parede' : 'parede_sombra', .25); }, {chao:true});
  item('escada', 'Escada', 1, {parede:['Degraus', '#8A8880']}, g => { for (let i = 0; i < 8; i++) g.b(0, 0, .9 - i * .26, 1.2, (i + 1) * .19, .28, i % 2 ? 'parede' : 'parede_claro', .2); });

  /* ================================================== natureza */
  item('arvore', 'Árvore', 2, {folha:['Folhas', '#3F7A38']}, g => { cil(g, 0, 0, 0, .22, 2.1, 'tronco', .14); g.b(.22, 1.35, 0, .45, .16, .16, 'tronco', .16); for (const [x, z] of [[.3, 0], [-.3, .05], [0, .3]]) g.b(x, 0, z, .25, .14, .25, 'tronco', .2); copa(g, 0, 2.15, 0, 1.15, 1.1, 'folha'); copa(g, .8, 1.9, .3, .55, .55, 'folha'); copa(g, -.75, 2.1, -.35, .6, .6, 'folha'); });
  item('pinheiro', 'Pinheiro', 2, {folha:['Folhas', '#2F5D3A']}, g => { cil(g, 0, 0, 0, .18, .9, 'tronco', .14); [[1.2, .6], [1, 1.15], [.8, 1.7], [.6, 2.25], [.42, 2.75], [.24, 3.2]].forEach(([r, y], i) => cil(g, 0, y, 0, r, .5, i % 2 ? 'folha' : 'folha_sombra', .2)); g.b(0, 3.65, 0, .18, .3, .18, 'folha_claro', .15); });
  item('arvore_seca', 'Árvore seca', 2, {folha:['Galhos', '#5E4A38']}, g => { cil(g, 0, 0, 0, .2, 2.3, 'folha', .14); g.b(.45, 1.5, 0, .8, .13, .13, 'folha', .2); g.b(.82, 1.6, 0, .12, .6, .12, 'folha_sombra', .2); g.b(-.4, 1.95, .05, .7, .11, .11, 'folha', .2); g.b(-.72, 2.05, .05, .1, .5, .1, 'folha_sombra', .2); g.b(0, 2.3, 0, .13, .75, .13, 'folha_sombra', .2); g.b(.2, 2.65, .1, .45, .09, .09, 'folha', .2); });
  item('arbusto', 'Arbusto', 2, {folha:['Folhas', '#4C8A3C']}, g => { copa(g, 0, .14, 0, .52, .45, 'folha'); copa(g, .42, .06, .2, .3, .3, 'folha'); copa(g, -.4, .08, -.1, .32, .32, 'folha'); });
  item('pedra', 'Pedra', 2, {pedra:['Pedra', '#8A8880']}, g => { cil(g, 0, 0, 0, .55, .38, 'pedra', .14); cil(g, -.1, .32, .05, .38, .25, 'pedra_claro', .14); cil(g, .5, 0, .28, .24, .22, 'pedra_sombra', .12); });
  item('capim', 'Tufo de capim', 2, {folha:['Capim', '#6E9A3A']}, g => { for (let i = 0; i < 22; i++){ const a = i * 2.4, r = .05 + (i % 7) * .05; g.b(Math.cos(a) * r, 0, Math.sin(a) * r, .05, .14 + (i * 13 % 9) * .035, .05, i % 3 ? 'folha' : 'folha_claro', 1); } });
  item('flores', 'Canteiro de flores', 2, {flor:['Flores', '#E5566B']}, g => { g.b(0, 0, 0, 1.3, .1, .6, 'terra', .12); for (let i = 0; i < 14; i++){ const x = -.55 + (i % 7) * .18, z = i < 7 ? -.14 : .15, h = .18 + (i * 5 % 4) * .04; g.b(x, .1, z, .04, h, .04, 'folha', 1); g.b(x, .1 + h, z, .11, .09, .11, i % 4 ? 'flor' : 'flor2', 1); } });
  item('lago', 'Lago', 2, {agua:['Água', '#3E7CA8']}, g => { cil(g, 0, 0, 0, 1.6, .05, 'agua', .25); for (let i = 0; i < 18; i++){ const a = i / 18 * Math.PI * 2; cil(g, Math.cos(a) * 1.62, 0, Math.sin(a) * 1.62, .22, .1 + (i % 3) * .05, i % 2 ? 'pedra' : 'pedra_sombra', .12); } }, {chao:true});
  item('grama', 'Chão de grama', 2, {folha:['Grama', '#5C8A3C']}, g => g.b(0, 0, 0, 4, .05, 4, 'folha', .33), {chao:true});
  item('terra_chao', 'Chão de terra', 2, {terra:['Terra', '#7A5A3A']}, g => g.b(0, 0, 0, 4, .05, 4, 'terra', .33), {chao:true});

  /* ================================================== rua e cidade */
  item('rua', 'Rua reta', 3, {}, g => { g.b(0, 0, 0, 4, .05, 4, 'asfalto', .33); for (const z of [-1, 1]) g.b(0, .052, z, .14, .012, 1.1, 'faixa_rua', 1); for (const x of [-1.8, 1.8]) g.b(x, .052, 0, .1, .012, 4, 'branco', .5); }, {chao:true});
  item('cruzamento', 'Cruzamento', 3, {}, g => { g.b(0, 0, 0, 4, .05, 4, 'asfalto', .33); for (let i = 0; i < 6; i++){ const x = -1.4 + i * .56; for (const s of [-1.55, 1.55]){ g.b(x, .052, s, .3, .012, .75, 'branco', .5); g.b(s, .052, x, .75, .012, .3, 'branco', .5); } } }, {chao:true});
  item('calcada', 'Calçada', 3, {parede:['Pedra', '#B4B0A6']}, g => { for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) g.b(-1.5 + i, 0, -.5 + j, .97, .12, .97, (i + j) % 2 ? 'parede' : 'parede_sombra', .25); }, {chao:true});
  item('poste', 'Poste de luz', 3, {metal:['Metal', '#4B5058']}, g => { g.b(0, 0, 0, .34, .2, .34, 'concreto', .15); g.b(0, 0, 0, .14, 4, .14, 'metal', .3); g.b(.42, 3.9, 0, .9, .1, .1, 'metal', .3); g.b(.82, 3.74, 0, .46, .18, .28, 'metal_escuro', .2); g.b(.82, 3.66, 0, .34, .09, .2, 'luz', 1); });
  item('placa', 'Placa de aviso', 3, {parede:['Placa', '#E2B23A']}, g => { g.b(0, 0, 0, .1, 1.9, .1, 'ferro', .3); g.b(0, 1.55, .08, 1.05, .75, .07, 'preto', .2); g.b(0, 1.6, .12, .95, .65, .05, 'parede', .16); g.b(0, 1.85, .16, .13, .32, .03, 'preto', 1); g.b(0, 1.7, .16, .13, .1, .03, 'preto', 1); });
  item('banco', 'Banco de praça', 3, {parede:['Madeira', '#8A6240']}, g => { for (const x of [-.75, .75]){ g.b(x, 0, 0, .1, .45, .5, 'ferro', .2); g.b(x, .45, -.24, .1, .55, .08, 'ferro', .2); } for (const z of [-.16, 0, .16]) g.b(0, .45, z, 1.75, .06, .13, 'parede', .2); for (const y of [.65, .85]) g.b(0, y, -.2, 1.75, .13, .05, 'parede_sombra', .2); });
  item('lixeira', 'Lixeira', 3, {parede:['Cor', '#2F6E4F']}, g => { cil(g, 0, .05, 0, .32, .85, 'parede'); cil(g, 0, .9, 0, .36, .1, 'parede_escuro'); g.b(0, 1, 0, .22, .07, .08, 'preto', 1); g.b(0, 0, 0, .4, .06, .4, 'preto', .2); g.b(0, .45, .31, .26, .26, .05, 'branco', .13); });
  item('hidrante', 'Hidrante', 3, {parede:['Cor', '#B8352E']}, g => { cil(g, 0, 0, 0, .2, .1, 'parede_escuro'); cil(g, 0, .1, 0, .15, .55, 'parede'); cil(g, 0, .65, 0, .19, .1, 'parede_sombra'); cil(g, 0, .75, 0, .12, .1, 'parede'); g.b(0, .85, 0, .08, .07, .08, 'metal', 1); g.b(0, .36, 0, .52, .14, .14, 'parede_sombra', .12); g.b(0, .34, .17, .17, .17, .1, 'metal', 1); });
  item('semaforo', 'Semáforo', 3, {}, g => { g.b(0, 0, 0, .13, 3, .13, 'ferro', .3); g.b(0, 2.75, .1, .38, 1, .24, 'preto', .2); [['vermelho', 3.45], ['flor2', 3.15], ['folha_clara', 2.85]].forEach(([m, y]) => { g.b(0, y, .24, .22, .22, .05, m, 1); g.b(0, y + .23, .27, .28, .05, .12, 'preto', 1); }); });
  item('ponto', 'Ponto de ônibus', 3, {parede:['Estrutura', '#365CE6']}, g => { for (const x of [-1.3, 1.3]) g.b(x, 0, -.55, .1, 2.35, .1, 'parede', .3); g.b(0, 2.35, -.1, 3, .12, 1.4, 'parede', .3); g.b(0, .35, -.62, 2.5, 1.7, .05, 'vidro', .4); g.b(0, .45, -.35, 2, .08, .4, 'madeira', .25); for (const x of [-.8, .8]) g.b(x, 0, -.35, .08, .45, .08, 'ferro', .3); g.b(1.62, 0, .45, .08, 2.2, .08, 'ferro', .3); g.b(1.62, 1.85, .45, .42, .42, .08, 'parede_sombra', .2); g.b(1.62, 1.97, .5, .26, .18, .03, 'branco', 1); });
  item('conteiner', 'Contêiner', 3, {parede:['Pintura', '#2F5F9E']}, g => { g.b(0, .06, 0, 4.4, 2.3, 2, 'parede', .28); for (let x = -2; x <= 2.05; x += .36) for (const z of [-1.03, 1.03]) g.b(x, .16, z, .14, 2.1, .07, 'parede_sombra', .5); for (const x of [-2.2, 2.2]) for (const z of [-1, 1]) g.b(x, 0, z, .16, 2.44, .16, 'parede_escuro', .3); for (const z of [-.45, .45]) g.b(2.24, .2, z, .06, 2, .07, 'metal', .4); g.b(-1, .9, 1.08, .9, .5, .03, 'ferrugem', .14); });

  /* ================================================== veículos */
  function carro(g, mat, estado){
    const velho = estado === 'abandonado';
    g.b(0, .36, 0, 1.75, .55, 3.9, mat, .2); g.b(0, .91, -.25, 1.65, .12, 2.5, mat + '_sombra', .22);
    g.b(0, 1.0, -.35, 1.55, .6, 1.95, 'vidro_escuro', .35); for (const x of [-.76, .76]) for (const z of [-1.3, -.35, .6]) g.b(x, 1.0, z, .1, .6, .1, mat, .3);
    g.b(0, 1.58, -.35, 1.65, .14, 2.05, mat, .2); g.b(0, .98, .72, 1.5, .5, .12, 'vidro', .4);
    for (const x of [-.88, .88]){ for (const z of [-1.3, 1.25]){ if (velho && x > 0 && z > 0){ g.b(x, .12, z, .2, .3, .5, 'ferro', .15); continue; } roda(g, x, .37, z, .37, .26); } g.b(x * 1.0, .75, -.35, .04, .07, .32, 'metal', 1); g.b(x * 1.07, 1.02, .66, .14, .14, .2, mat + '_escuro', .2); }
    g.b(0, .34, 1.99, 1.78, .24, .14, 'ferro', .25); g.b(0, .34, -1.99, 1.78, .24, .14, 'ferro', .25); g.b(0, .62, 1.97, .8, .18, .05, 'preto', .2);
    for (const x of [-.65, .65]){ g.b(x, .66, 1.97, .3, .18, .06, velho && x > 0 ? 'vidro_escuro' : 'luz', 1); g.b(x, .66, -1.97, .3, .16, .06, 'vermelho', 1); }
    g.b(0, .42, -2.07, .55, .16, .03, 'branco', .5);
    if (velho){ for (const [x, y, z, w, h, d] of [[-.89, .55, .4, .05, .3, .8], [.89, .45, -.9, .05, .35, .5], [.3, 1.03, 1.3, .7, .04, .55], [-.35, 1.73, -.8, .6, .04, .45], [0, .4, 2.06, .5, .2, .04]]) g.b(x, y, z, w, h, d, 'ferrugem', .12); g.b(.1, .98, .8, 1.1, .09, .06, 'madeira_velha', .2); g.b(0, 0, 1.4, .5, .02, .4, 'preto', .2); }
  }
  item('carro', 'Carro', 4, {parede:['Pintura', '#B8352E']}, g => carro(g, 'parede'));
  item('carro_abandonado', 'Carro abandonado', 4, {parede:['Pintura', '#6E8A8F']}, g => carro(g, 'parede', 'abandonado'));
  item('caminhonete', 'Caminhonete', 4, {parede:['Pintura', '#4B5340']}, g => { g.b(0, .52, 0, 1.9, .5, 4.5, 'parede', .22); g.b(0, 1.02, .55, 1.82, .75, 1.55, 'vidro_escuro', .35); for (const x of [-.9, .9]) for (const z of [-.18, .55, 1.28]) g.b(x, 1.02, z, .12, .75, .12, 'parede', .3); g.b(0, 1.75, .5, 1.92, .16, 1.65, 'parede', .22); g.b(0, 1.0, 1.72, 1.82, .22, 1.0, 'parede_sombra', .22); for (const x of [-.9, .9]) g.b(x, 1.02, -1.35, .13, .5, 1.8, 'parede', .22); g.b(0, 1.02, -2.2, 1.9, .5, .13, 'parede_sombra', .22); g.b(.35, 1.02, -1.2, .55, .45, .55, 'madeira', .14); g.b(-.4, 1.02, -1.7, .5, .35, .4, 'verde_mil', .14); for (const x of [-.98, .98]) for (const z of [-1.45, 1.5]) roda(g, x, .47, z, .47, .32); g.b(0, .5, 2.3, 1.95, .3, .16, 'ferro', .25); for (const x of [-.7, .7]){ g.b(x, .82, 2.27, .32, .2, .05, 'luz', 1); g.b(x, .75, -2.28, .22, .25, .05, 'vermelho', 1); } for (const x of [-.55, -.2, .2, .55]) g.b(x, 1.91, 1.05, .22, .15, .15, 'luz', 1); });
  item('bicicleta', 'Bicicleta', 4, {parede:['Quadro', '#F16A32']}, g => { for (const z of [-.58, .58]){ for (let i = 0; i < 16; i++){ const a = i / 16 * Math.PI * 2; g.b(0, .35 + Math.sin(a) * .31 - .045, z + Math.cos(a) * .31, .07, .09, .13, 'borracha', 1); } g.b(0, .31, z, .1, .09, .09, 'metal', 1); g.b(0, .35, z, .02, .02, .58, 'metal', 1); g.b(0, .05, z, .02, .6, .02, 'metal', 1); } g.b(0, .34, -.29, .06, .06, .6, 'parede', .3); g.b(0, .36, -.04, .06, .55, .06, 'parede', .3); g.b(0, .72, .2, .06, .06, .55, 'parede', .3); g.b(0, .35, .56, .06, .65, .06, 'parede', .3); g.b(0, .55, .26, .06, .22, .06, 'parede', .3); g.b(0, .9, -.1, .14, .06, .3, 'preto', 1); g.b(0, .99, .56, .55, .05, .05, 'ferro', 1); });

  /* ================================================== móveis e interior */
  item('mesa', 'Mesa', 5, {parede:['Madeira', '#8A6240']}, g => { g.b(0, .72, 0, 1.4, .08, .8, 'parede', .14); for (const x of [-.62, .62]) for (const z of [-.32, .32]) g.b(x, 0, z, .09, .72, .09, 'parede_sombra', .2); g.b(0, .62, 0, 1.24, .1, .64, 'parede_escuro', .3); });
  item('cadeira', 'Cadeira', 5, {parede:['Cor', '#6E5A44']}, g => { g.b(0, .43, 0, .46, .07, .46, 'parede', .12); for (const x of [-.19, .19]) for (const z of [-.19, .19]) g.b(x, 0, z, .06, .43, .06, 'parede_sombra', .3); for (const x of [-.19, .19]) g.b(x, .5, -.2, .06, .55, .06, 'parede_sombra', .3); for (const y of [.72, .92]) g.b(0, y, -.2, .46, .12, .05, 'parede', .15); });
  item('sofa', 'Sofá', 5, {parede:['Tecido', '#2F5F9E']}, g => { g.b(0, .12, 0, 2, .3, .9, 'parede_sombra', .18); g.b(0, .42, -.34, 2, .6, .24, 'parede', .18); for (const x of [-.99, .99]) g.b(x, .12, 0, .22, .55, .92, 'parede', .18); for (const x of [-.45, .45]){ g.b(x, .42, .08, .86, .16, .68, 'parede_claro', .16); g.b(x, .56, -.17, .82, .42, .16, 'parede_claro', .16); } g.b(.55, .6, -.02, .36, .32, .14, 'laranja', .12); for (const x of [-.9, .9]) for (const z of [-.32, .32]) g.b(x, 0, z, .1, .12, .1, 'preto', .3); });
  item('cama', 'Cama', 5, {parede:['Coberta', '#7A2E24']}, g => { g.b(0, .18, 0, 1.2, .2, 2.1, 'madeira', .2); for (const x of [-.55, .55]) for (const z of [-.98, .98]) g.b(x, 0, z, .1, .18, .1, 'madeira_velha', .3); g.b(0, .38, .02, 1.12, .2, 2, 'branco', .18); g.b(0, .52, .32, 1.18, .11, 1.42, 'parede', .16); g.b(0, .6, -.42, 1.18, .05, .16, 'parede_claro', .16); g.b(0, .58, -.75, .78, .14, .38, 'papel', .13); g.b(0, .18, -1.1, 1.26, .85, .1, 'madeira', .2); g.b(0, .18, 1.1, 1.26, .45, .08, 'madeira', .2); });
  item('estante', 'Estante com livros', 5, {parede:['Madeira', '#6E5844']}, g => { g.b(0, 0, -.16, 1.2, 1.95, .05, 'parede_escuro', .2); for (const x of [-.59, .59]) g.b(x, 0, 0, .07, 2, .36, 'parede', .2); for (const y of [0, .48, .96, 1.44, 1.93]) g.b(0, y, 0, 1.2, .07, .36, 'parede', .2); const cores = ['vermelho', 'azul', 'folha', 'papel', 'laranja', 'ferro', 'flor2']; for (let a = 0; a < 4; a++){ let x = -.5; for (let i = 0; i < 12 && x < .45; i++){ const w = .05 + ((i * 7 + a * 3) % 4) * .018, h = .26 + ((i * 5 + a) % 4) * .04; if ((i + a * 2) % 7 !== 5) g.b(x + w / 2, .07 + a * .48, .02, w, h, .24, cores[(i + a * 3) % cores.length], .4); x += w + .012; } } });
  item('bancada', 'Bancada de ferramentas', 5, {parede:['Madeira', '#8A6240']}, g => { g.b(0, .82, 0, 1.8, .1, .75, 'parede', .14); for (const x of [-.82, .82]) for (const z of [-.3, .3]) g.b(x, 0, z, .1, .82, .1, 'ferro', .2); g.b(0, .25, 0, 1.7, .06, .65, 'parede_sombra', .2); g.b(0, .92, -.36, 1.8, .9, .06, 'parede_escuro', .18); g.b(-.55, 1.35, -.31, .08, .34, .04, 'madeira', 1); g.b(-.55, 1.66, -.31, .26, .11, .06, 'ferro', 1); g.b(-.15, 1.3, -.31, .06, .45, .03, 'metal', 1); g.b(-.15, 1.72, -.31, .16, .14, .04, 'metal', 1); g.b(.3, 1.45, -.31, .42, .13, .03, 'metal', .2); g.b(.58, 1.43, -.31, .16, .17, .05, 'laranja', 1); g.b(.55, .92, .05, .4, .22, .24, 'vermelho', .12); g.b(.55, 1.14, .05, .22, .06, .05, 'preto', 1); g.b(-.4, .92, .1, .3, .14, .2, 'ferro', .12); g.b(.05, .31, 0, .5, .3, .4, 'verde_mil', .13); });
  item('geladeira', 'Geladeira', 5, {parede:['Cor', '#E7E5DE']}, g => { g.b(0, .06, 0, .75, 1.75, .68, 'parede', .2); g.b(0, 1.24, .345, .73, .025, .02, 'ferro', 1); for (const y of [.75, 1.36]) g.b(-.28, y, .39, .05, .35, .06, 'metal', 1); g.b(0, 0, 0, .68, .06, .6, 'preto', .3); g.b(.15, 1.48, .35, .12, .15, .02, 'laranja', 1); g.b(-.02, 1.55, .35, .1, .08, .02, 'azul', 1); });
  item('computador', 'Mesa com notebook', 5, {parede:['Mesa', '#8A6240']}, g => { g.b(0, .72, 0, 1.3, .07, .7, 'parede', .14); for (const x of [-.58, .58]) g.b(x, 0, 0, .07, .72, .6, 'parede_sombra', .2); g.b(0, .79, .08, .52, .035, .36, 'branco', .12); for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) g.b(-.2 + j * .057, .825, .0 + i * .06, .042, .012, .042, i === 0 && j === 7 ? 'laranja' : 'preto', 1); g.b(0, .815, -.13, .54, .4, .035, 'branco', .15); g.b(0, .84, -.108, .48, .34, .012, 'tela', 1); [[-.1, 1.1, .2], [.04, 1.05, .24], [-.07, 1.0, .18], [-.12, .95, .12]].forEach(([x, y, w]) => g.b(x, y, -.098, w, .022, .008, 'tela_clara', 1)); g.b(.45, .79, .12, .09, .11, .09, 'laranja', .06); g.b(-.46, .79, -.05, .06, .34, .06, 'ferro', 1); g.b(-.4, 1.1, -.02, .18, .08, .14, 'ferro', 1); g.b(-.4, 1.08, -.02, .13, .03, .1, 'luz', 1); });
  item('tapete', 'Tapete', 5, {parede:['Cor', '#7A2E24']}, g => { g.b(0, 0, 0, 2.2, .025, 1.5, 'parede', .18); g.b(0, .018, 0, 1.8, .015, 1.1, 'papel', .18); g.b(0, .024, 0, 1.5, .015, .8, 'parede_sombra', .18); }, {chao:true});
  item('luminaria', 'Luminária de chão', 5, {parede:['Cúpula', '#F2C230']}, g => { cil(g, 0, 0, 0, .2, .05, 'ferro'); g.b(0, .05, 0, .05, 1.4, .05, 'ferro', .4); cil(g, 0, 1.38, 0, .28, .34, 'parede'); g.b(0, 1.34, 0, .24, .06, .24, 'luz', 1); });

  /* ================================================== sobrevivência */
  item('barricada', 'Sacos de areia', 6, {saco:['Sacos', '#B79F74']}, g => { for (let l = 0; l < 4; l++) for (let i = 0; i < 5; i++){ if (l % 2 && i === 4) continue; const x = -1 + i * .5 + (l % 2 ? .25 : 0); cil(g, x, l * .22, (i % 2) * .03, .26, .21, (i + l) % 3 ? 'saco' : 'saco_sombra', .12); g.b(x + .22, l * .22 + .07, .02, .07, .07, .22, 'saco_escuro', .2); } });
  item('barreira', 'Barreira de tábuas', 6, {parede:['Tábuas', '#6E5844']}, g => { for (const x of [-.9, .9]){ g.b(x, 0, 0, .14, 1.7, .14, 'parede_escuro', .2); g.b(x, 0, -.35, .12, .1, .7, 'parede_escuro', .2); } [[.2, 0], [.55, .04], [.95, -.03], [1.35, .05]].forEach(([y, dx], i) => { g.b(dx, y, .1, 2.1 - (i % 2) * .15, .24, .07, i % 2 ? 'parede' : 'parede_sombra', .18); for (const x of [-.9, .9]) g.b(x, y + .08, .15, .06, .06, .04, 'metal', 1); }); g.b(.1, .78, .17, .3, .12, .03, 'ferrugem', .1); for (let x = -.95; x <= 1; x += .24) g.b(x, 1.68, .06, .09, .24, .07, 'parede_claro', .3); });
  item('arame', 'Arame farpado', 6, {}, g => { for (const x of [-1, 0, 1]){ g.b(x, 0, 0, .09, 1.15, .09, 'madeira_velha', .25); } for (const y of [.35, .65, .95]){ g.b(0, y, 0, 2.05, .025, .025, 'metal', .5); for (let x = -.9; x < 1; x += .18){ g.b(x, y - .045, 0, .02, .11, .02, 'ferro', 1); g.b(x, y + .005, 0, .02, .02, .11, 'ferro', 1); } } });
  item('pneus', 'Pilha de pneus', 6, {}, g => { for (let i = 0; i < 4; i++){ const x = (i % 2) * .06; cil(g, x, i * .23, 0, .45, .2, 'borracha', .11); cil(g, x, i * .23 + .2, 0, .24, .025, 'preto', .2); } cil(g, .75, 0, .35, .42, .2, 'borracha', .11); cil(g, .75, .2, .35, .22, .02, 'preto', .2); });
  item('barril', 'Barril', 6, {parede:['Pintura', '#2F5F9E']}, g => { cil(g, 0, 0, 0, .36, .95, 'parede'); for (const y of [.04, .45, .87]) cil(g, 0, y, 0, .385, .07, 'parede_escuro'); cil(g, 0, .95, 0, .3, .035, 'metal'); g.b(.12, .985, .08, .1, .05, .1, 'ferro', 1); g.b(0, .5, .36, .3, .26, .04, 'flor2', .13); g.b(-.2, .14, .33, .2, .28, .04, 'ferrugem', .1); });
  item('caixa', 'Caixote', 6, {parede:['Madeira', '#9A7048']}, g => { g.b(0, 0, 0, .8, .8, .8, 'parede', .16); for (const x of [-.37, .37]) for (const z of [-.37, .37]) g.b(x, 0, z, .12, .82, .12, 'parede_escuro', .2); for (const y of [0, .72]){ for (const z of [-.39, .39]) g.b(0, y, z, .82, .1, .08, 'parede_escuro', .2); for (const x of [-.39, .39]) g.b(x, y, 0, .08, .1, .82, 'parede_escuro', .2); } for (let i = 0; i < 6; i++) g.b(-.25 + i * .1, .14 + i * .1, .42, .13, .11, .04, 'parede_sombra', .2); });
  item('suprimentos', 'Caixa de suprimentos', 6, {parede:['Pintura', '#4B5340']}, g => { g.b(0, .03, 0, 1.1, .45, .6, 'parede', .13); g.b(0, .48, 0, 1.14, .14, .64, 'parede_sombra', .13); for (const x of [-.38, .38]){ g.b(x, 0, 0, .1, .66, .68, 'parede_escuro', .15); g.b(x, .42, .35, .12, .14, .04, 'metal', 1); } g.b(0, .2, .31, .34, .18, .02, 'papel', .08); for (let i = 0; i < 4; i++) g.b(-.11 + i * .075, .26, .325, .04, .06, .01, 'preto', 1); for (const x of [-.58, .58]) g.b(x, .3, 0, .06, .07, .26, 'preto', 1); });
  item('medico', 'Kit médico', 6, {}, g => { g.b(0, .02, 0, .55, .32, .22, 'branco', .1); g.b(0, .1, .12, .08, .18, .02, 'folha', 1); g.b(0, .15, .121, .2, .07, .02, 'folha', 1); g.b(0, .34, 0, .26, .08, .06, 'ferro', 1); g.b(0, 0, 0, .58, .03, .24, 'ferro', .3); });
  item('galao', 'Galão de combustível', 6, {parede:['Cor', '#B8352E']}, g => { g.b(0, 0, 0, .36, .46, .17, 'parede', .09); g.b(-.06, .46, 0, .2, .06, .1, 'parede_sombra', .1); g.b(.12, .46, 0, .08, .1, .08, 'ferro', 1); for (let i = -3; i <= 3; i++){ g.b(i * .035, .12 + (i + 3) * .035, .09, .05, .035, .015, 'parede_escuro', 1); g.b(i * .035, .33 - (i + 3) * .035, .091, .05, .035, .015, 'parede_escuro', 1); } });
  item('barraca', 'Barraca', 6, {parede:['Lona', '#6F6A4C']}, g => { const n = 12; for (let i = 0; i < n; i++){ const w = 2.1 * (1 - i / n) + .06; g.b(0, i * .115, 0, w, .12, 2.3, i % 3 ? 'parede' : 'parede_sombra', .22); } for (let i = 0; i < 9; i++) g.b(0, i * .115, 1.16, Math.max(.05, .85 * (1 - i / 9)), .118, .03, 'preto', .3); g.b(.34, 0, 1.19, .2, .75, .04, 'parede_claro', .15); g.b(0, 1.38, 0, .09, .09, 2.5, 'madeira', .25); for (const x of [-1.2, 1.2]) for (const z of [-1.05, 1.05]){ g.b(x, 0, z, .07, .16, .07, 'madeira_velha', 1); g.b(x * .93, .1, z, .16, .02, .02, 'papel', 1); } });
  item('fogueira', 'Fogueira', 6, {}, g => { for (let i = 0; i < 10; i++){ const a = i / 10 * Math.PI * 2; cil(g, Math.cos(a) * .48, 0, Math.sin(a) * .48, .13, .13 + (i % 3) * .03, i % 2 ? 'pedra' : 'ferro', .09); } g.b(0, .03, 0, .75, .12, .14, 'tronco', .12); g.b(0, .1, 0, .14, .12, .75, 'tronco', .12); g.b(.08, .14, .05, .6, .1, .12, 'preto', .15); cil(g, 0, .18, 0, .2, .2, 'brasa', .08); cil(g, .02, .3, 0, .15, .24, 'fogo', .07); g.b(-.03, .46, .02, .13, .22, .11, 'chama', 1); g.b(.07, .62, -.02, .07, .16, .07, 'chama', 1); g.b(-.09, .44, -.07, .07, .18, .07, 'fogo', 1); });
  item('caixa_dagua', "Caixa d'água", 6, {parede:['Tanque', '#2F5F9E']}, g => { for (const x of [-.65, .65]) for (const z of [-.65, .65]) g.b(x, 0, z, .14, 2.1, .14, 'ferro', .25); for (const y of [.7, 1.45]){ for (const z of [-.65, .65]) g.b(0, y, z, 1.3, .07, .07, 'ferro', .3); for (const x of [-.65, .65]) g.b(x, y, 0, .07, .07, 1.3, 'ferro', .3); } g.b(0, 2.1, 0, 1.65, .12, 1.65, 'madeira', .2); cil(g, 0, 2.22, 0, .8, 1.1, 'parede', .18); cil(g, 0, 3.32, 0, .85, .14, 'parede_escuro', .18); g.b(0, 3.46, 0, .32, .1, .32, 'parede_sombra', .2); g.b(.7, 0, .72, .09, 2.3, .09, 'metal', .3); });
  item('gerador', 'Gerador', 6, {parede:['Pintura', '#F2A51A']}, g => { g.b(0, .12, 0, 1, .55, .6, 'parede', .13); for (const x of [-.52, .52]) for (const z of [-.32, .32]) g.b(x, 0, z, .06, .82, .06, 'preto', .3); for (const z of [-.32, .32]) g.b(0, .76, z, 1.1, .06, .06, 'preto', .3); g.b(0, .67, 0, .6, .14, .38, 'parede_sombra', .13); g.b(.18, .81, 0, .1, .06, .1, 'preto', 1); for (let i = 0; i < 5; i++) g.b(-.25, .24 + i * .07, .31, .34, .035, .02, 'preto', 1); g.b(.24, .42, .31, .2, .16, .02, 'ferro', .08); g.b(.2, .47, .33, .04, .04, .02, 'folha_clara', 1); g.b(.29, .47, .33, .04, .04, .02, 'vermelho', 1); g.b(-.55, .3, -.1, .12, .12, .12, 'ferro', 1); });
  item('antena', 'Antena de rádio', 6, {metal:['Metal', '#9AA0A8']}, g => { for (let i = 0; i < 9; i++){ const y = i * .6, r = .55 - i * .048; for (const x of [-r, r]) for (const z of [-r, r]) g.b(x, y, z, .07, .62, .07, 'metal', .4); for (const z of [-r, r]) g.b(0, y + .55, z, r * 2, .045, .045, i % 2 ? 'vermelho' : 'metal_sombra', .5); for (const x of [-r, r]) g.b(x, y + .55, 0, .045, .045, r * 2, i % 2 ? 'vermelho' : 'metal_sombra', .5); } g.b(0, 5.4, 0, .06, 1.1, .06, 'ferro', .4); g.b(0, 6.5, 0, .14, .14, .14, 'vermelho', 1); g.b(.3, 4.5, .18, .5, .5, .08, 'branco', .13); g.b(.3, 4.68, .26, .12, .12, .1, 'ferro', 1); g.b(-.25, 5.4, 0, .5, .06, .06, 'ferro', 1); });
  item('lapide', 'Cova improvisada', 6, {}, g => { cil(g, 0, 0, .45, .45, .14, 'terra', .1); g.b(0, 0, .55, .62, .17, .9, 'terra_sombra', .12); g.b(0, 0, -.25, .1, .95, .08, 'madeira_velha', .2); g.b(0, .62, -.25, .5, .1, .08, 'madeira_velha', .2); g.b(.02, .66, -.2, .14, .09, .04, 'papel', 1); });

  return {CATEGORIAS, ITENS, FIXAS, LISOS};
})();
