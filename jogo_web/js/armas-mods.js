/* Modificações das armas: peças que se encaixam por fora (só aparência de jogo), pintura e enfeites.
   Carregado depois de armas-extras.js e antes de modelo.js.
   comModificacoes(id, mods) devolve a função de desenho da arma já modificada. */

Object.assign(ARMA_CORES, {a_luz:'#FFF1B8', a_laser:'#FF3B30', a_vidro_red:'#7A2E2A', a_camo1:'#4E5A36', a_camo2:'#333D25', a_camo3:'#7A7348',
  a_areia1:'#B89C6A', a_areia2:'#8F764C', a_areia3:'#D3BC8C', a_urb1:'#6C7178', a_urb2:'#42464D', a_urb3:'#A2A7AD',
  a_neve1:'#DCE1E6', a_neve2:'#AEB7C0', a_neve3:'#F4F6F8', a_fosco:'#17181A', a_fosco2:'#222427', a_fosco3:'#2E3135',
  a_enf1:'#8F4A2A', a_enf2:'#6E3A22', a_enf3:'#B5662F', a_wo:'#F16A32', a_wo2:'#26262A', a_wo3:'#E9E7DD'});

const SLOTS_MOD = {mira:'Mira', ponta:'Ponta', baixo:'Embaixo', carregador:'Carregador', reforco:'Reforço', pintura:'Pintura', enfeite:'Enfeite'};
const SEM_MOD = Object.fromEntries(Object.keys(SLOTS_MOD).map(k => [k, 'nenhum']));
for (const p of [PADRAO_WASHINGTON, PADRAO_LIMPO, PADRAO_FEMININO]) p.modarma = {...SEM_MOD};

/* onde cada arma recebe peças, em blocos: [u, w] do ponto de encaixe.
   troca = tira a mira ou alça de fábrica que ficaria no lugar: [u inicial, u final, altura limite] */
const ENCAIXES = {
  pistola:{mira:[1.2, 3.5], ponta:[6.8, 2.77], baixo:[4.6, .9], carregador:[-2.2, -3.55]},
  revolver:{mira:[6.2, 3.45], ponta:[10.45, 2.87], baixo:[7.2, 1.75]},
  submetralhadora:{mira:[1.6, 4.45], ponta:[16.05, 2.75], baixo:[10.8, 1.75], carregador:[6.1, -7.1]},
  fuzil_assalto:{mira:[1.4, 4.3], ponta:[23.3, 2.75], baixo:[11.4, 1.4], carregador:[7.2, -5.8], troca:[-1.1, 3.35, 4.56]},
  fuzil_madeira:{mira:[2, 4.1], ponta:[22.65, 2.43], baixo:[10.6, 1.55], carregador:[8.4, -5.7]},
  escopeta:{mira:[1, 3.7], ponta:[22.7, 3.1], baixo:[17.6, 1.45]},
  rifle_precisao:{mira:[1.4, 3.3], ponta:[30.1, 3.08], baixo:[10.2, 1.45], carregador:[5, -1.7], troca:[-4.4, 8.3, 3.45]},
  metralhadora:{mira:[3, 4.95], ponta:[27.45, 2.95], baixo:[12.4, 1.95], troca:[-1.2, 5.9, 5.5]},
  fuzil_ferrolho:{mira:[.6, 3.55], ponta:[28.1, 3.15], baixo:[12.4, 1.75]},
  besta_tatica:{mira:[-.6, 4.15], baixo:[8.4, 1.35], troca:[-4.4, 3.6, 4.25]},
  besta_improvisada:{mira:[-3.4, 2.8], baixo:[7.4, 1.35]},
  gamb_pistola:{mira:[.2, 2.85], ponta:[8.35, 3.22], baixo:[3.2, .95]},
  gamb_revolver:{mira:[2.8, 3.55], ponta:[9.35, 2.35], baixo:[5.8, 2.25]},
  gamb_submetralhadora:{mira:[1.4, 3.85], ponta:[16.15, 2.17], baixo:[10.2, 2.05], carregador:[4.8, -6], troca:[-2.5, 5.8, 3.95]},
  gamb_fuzil:{mira:[.6, 3.8], ponta:[24.35, 3.35], baixo:[10.4, 1.55], carregador:[6.6, -4.55]},
  gamb_escopeta:{mira:[.2, 3.65], ponta:[18.45, 2.9], baixo:[9.2, .95]},
  gamb_precisao:{mira:[1.8, 3.6], ponta:[27.55, 3.35], baixo:[9.8, 1.65], troca:[-2.6, 7.6, 3.65]},
  gamb_guardachuva:{mira:[1.8, 3.85], ponta:[24.15, 3.2], baixo:[9, 1.65]},
};
const ehDeMira = id => !!ENCAIXES[id];

var MODS_ARMA;

/* ---------------------------------------------------------------- catálogo: nome, ideia para o jogo, onde serve e desenho */
(() => {
  const dois = (b, u0, u1, w0, w1, v, mat, e = .1) => { b(u0, u1, v, v + e, w0, w1, mat); b(u0, u1, -v - e, -v, w0, w1, mat); };
  const fita = (b, u0, u1, v, w0, w1, mat = 'a_fita') => b(u0, u1, -v, v, w0, w1, mat);
  const base = (b, u, w) => b(u - 1.8, u + 1.8, -.5, .5, w - .12, w + .38, 'a_preto');

  /* ---------- miras: (b, u, w) = ponto em cima da arma ---------- */
  const miras = {
    ponto:{nome:'Ponto vermelho', ideia:'mirar mais rápido de perto', desenhar(b, u, w){ base(b, u, w);
      for (const s of [-1, 1]) b(u - 1.3, u + 1.3, s < 0 ? -.7 : .45, s < 0 ? -.45 : .7, w + .3, w + 2.2, 'a_preto');
      b(u - 1.3, u + 1.3, -.7, .7, w + 2.1, w + 2.5, 'a_preto'); b(u - 1.3, u + 1.3, -.7, .7, w + .3, w + .65, 'a_preto'); b(u + .6, u + .85, -.14, .14, w + 1.25, w + 1.55, 'a_laser'); b(u + .6, u + .85, -.06, .06, w + .6, w + 1.3, 'a_vidro_red');
      dois(b, u - .8, u + .2, w + 1, w + 1.5, .7, 'a_ferro'); }},
    holografica:{nome:'Holográfica', ideia:'visão mais aberta, para correr e mirar', desenhar(b, u, w){ base(b, u, w);
      b(u - 1.7, u + .4, -.75, .75, w + .3, w + 1.1, 'a_polimero'); for (const s of [-1, 1]) b(u + .2, u + 1.6, s < 0 ? -.85 : .6, s < 0 ? -.6 : .85, w + .3, w + 2.7, 'a_polimero');
      b(u + .2, u + 1.6, -.85, .85, w + 2.55, w + 2.95, 'a_polimero'); b(u + 1.1, u + 1.22, -.6, .6, w + 1.1, w + 1.2, 'a_lente'); b(u + 1.1, u + 1.22, -.6, -.5, w + 1.1, w + 2.55, 'a_lente'); b(u + 1.1, u + 1.22, -.07, .07, w + 1.2, w + 2.55, 'a_lente');
      for (const x of [-1.4, -.7]) b(u + x, u + x + .4, -.3, .3, w + 1.1, w + 1.3, 'a_amarelo'); }},
    luneta:{nome:'Luneta', ideia:'enxergar longe; atrapalha de perto', desenhar(b, u, w){
      for (const x of [-1.8, 1.2]) b(u + x, u + x + .7, -.45, .45, w - .12, w + 1.35, 'a_preto');
      b(u - 3.2, u + 3.2, -.6, .6, w + 1.2, w + 2.4, 'a_aco_escuro'); b(u - 4.4, u - 3, -.82, .82, w + 1, w + 2.6, 'a_preto'); b(u + 3, u + 5, -.95, .95, w + .9, w + 2.7, 'a_preto');
      b(u - 4.52, u - 4.4, -.55, .55, w + 1.25, w + 2.35, 'a_lente'); b(u + 5, u + 5.12, -.68, .68, w + 1.15, w + 2.45, 'a_lente');
      b(u - .4, u + .5, -.35, .35, w + 2.4, w + 3.1, 'a_ferro'); b(u - .4, u + .5, .6, 1.2, w + 1.45, w + 2.15, 'a_ferro'); dois(b, u - 2.6, u - 2.2, w + 1.3, w + 2.3, .6, 'a_metal'); }},
    arame:{nome:'Mira de arame (gambiarra)', ideia:'melhor que nada; entorta com pancada', soGamb:true, desenhar(b, u, w){
      fita(b, u - 1, u + 1, .62, w - .12, w + .3);
      b(u - .2, u + .1, -.6, -.4, w + .2, w + 2.2, 'a_aco'); b(u, u + .3, .4, .6, w + .2, w + 2.4, 'a_aco'); b(u - .2, u + .3, -.6, .1, w + 2.15, w + 2.4, 'a_aco'); b(u - .05, u + .25, 0, .6, w + 2.3, w + 2.55, 'a_aco');
      b(u + 3.4, u + 3.7, -.12, .12, w - .1, w + 1.9, 'a_aco'); b(u + .8, u + 3.7, -.1, .1, w - .12, w + .1, 'a_aco'); b(u + 3.3, u + 3.8, -.22, .22, w + 1.9, w + 2.35, 'a_vermelho'); }},
  };
  /* ---------- pontas: (b, u, w) = boca do cano ---------- */
  const pontas = {
    silenciador:{nome:'Silenciador', ideia:'faz menos barulho e atrai menos zumbis', soMilitar:true, desenhar(b, u, w){
      b(u - .3, u + .8, -.5, .5, w - .5, w + .5, 'a_ferro'); b(u + .6, u + 7, -.85, .85, w - .6, w + .6, 'a_fosco2'); b(u + .6, u + 7, -.6, .6, w - .85, w + .85, 'a_fosco2');
      for (const x of [1.2, 6]) { b(u + x, u + x + .35, -.94, .94, w - .65, w + .65, 'a_ferro'); b(u + x, u + x + .35, -.65, .65, w - .94, w + .94, 'a_ferro'); }
      b(u + 7, u + 7.14, -.35, .35, w - .35, w + .35, 'a_sombra'); }},
    quebra_chama:{nome:'Quebra-chama', ideia:'o tiro denuncia menos à noite', soMilitar:true, desenhar(b, u, w){
      b(u - .3, u + .7, -.5, .5, w - .5, w + .5, 'a_ferro'); b(u + .6, u + 1.2, -.7, .7, w - .7, w + .7, 'a_aco_escuro');
      for (const [v, z] of [[-.62, -.15], [.32, -.15], [-.15, .32], [-.15, -.62]]) b(u + 1.1, u + 2.8, v, v + .3, w + z, w + z + .3, 'a_aco_escuro'); }},
    baioneta:{nome:'Baioneta', ideia:'ataque de perto sem gastar munição', soMilitar:true, soLonga:true, desenhar(b, u, w){
      b(u - 2.4, u + .2, -.4, .4, w - 1.6, w - .25, 'a_polimero'); b(u - 1.2, u - .5, -.55, .55, w - 1, w + .55, 'a_ferro'); b(u, u + .5, -.5, .5, w - 2, w - .2, 'a_ferro');
      b(u + .4, u + 7, -.15, .15, w - 1.75, w - .6, 'a_metal'); b(u + 7, u + 8.4, -.13, .13, w - 1.5, w - .85, 'a_metal'); b(u + 8.4, u + 9.2, -.11, .11, w - 1.25, w - 1, 'a_aco'); b(u + .6, u + 7, -.18, .18, w - 1.85, w - 1.6, 'a_aco'); b(u + 1, u + 6, -.2, .2, w - 1.1, w - .95, 'a_sombra'); }},
    faca_amarrada:{nome:'Faca amarrada (gambiarra)', ideia:'ataque de perto; pode soltar', soLonga:true, soGamb:true, desenhar(b, u, w){
      b(u - 2.6, u + .4, -.34, .34, w - 1.25, w - .3, 'a_couro'); b(u + .2, u + 5, -.13, .13, w - 1.5, w - .45, 'a_metal'); b(u + 5, u + 6.4, -.11, .11, w - 1.25, w - .7, 'a_metal'); b(u + .6, u + 5, -.16, .16, w - 1.6, w - 1.4, 'a_aco');
      for (let x = -2.3; x < 0; x += .75) b(u + x, u + x + .42, -.66, .66, w - 1.45, w + .5, 'a_corda');
      b(u - 1, u - .6, -.85, -.6, w - 3, w - 1.3, 'a_corda'); dois(b, u + 2, u + 3, w - 1.1, w - .7, .13, 'a_ferrugem', .06); }},
  };
  /* ---------- embaixo do cano: (b, u, w) = por baixo ---------- */
  const baixos = {
    lanterna:{nome:'Lanterna tática', ideia:'ilumina; também chama atenção', soMilitar:true, desenhar(b, u, w){
      b(u - .9, u + .9, -.35, .35, w - .55, w + .15, 'a_preto'); b(u - 2, u + 1.8, -.65, .65, w - 1.8, w - .5, 'a_fosco3'); b(u + 1.8, u + 2.8, -.82, .82, w - 1.98, w - .38, 'a_preto'); b(u + 2.8, u + 2.94, -.58, .58, w - 1.72, w - .64, 'a_luz');
      b(u - 2.4, u - 2, -.4, .4, w - 1.5, w - .8, 'a_borracha'); for (let x = -1.4; x < 1.2; x += .7) dois(b, u + x, u + x + .3, w - 1.7, w - .6, .65, 'a_sombra', .07); }},
    laser:{nome:'Apontador laser', ideia:'acerta mais sem mirar; o ponto denuncia', soMilitar:true, desenhar(b, u, w){
      b(u - 1.4, u + 1.6, -.6, .6, w - 1.3, w + .12, 'a_aco_escuro'); b(u + 1.6, u + 1.85, -.3, .3, w - .95, w - .35, 'a_preto'); b(u + 1.85, u + 1.95, -.14, .14, w - .79, w - .51, 'a_laser');
      b(u + 1.95, u + 12, -.045, .045, w - .695, w - .605, 'a_laser'); dois(b, u - .8, u - .1, w - .8, w - .35, .6, 'a_amarelo'); dois(b, u + .4, u + 1, w - .9, w - .3, .6, 'a_preto'); }},
    punho_frontal:{nome:'Empunhadura frontal', ideia:'segura firme: menos tremor', soMilitar:true, soLonga:true, desenhar(b, u, w){
      b(u - 1.1, u + 1.1, -.5, .5, w - .4, w + .15, 'a_preto'); b(u - .6, u + .6, -.5, .5, w - 4, w - .35, 'a_polimero'); b(u - .75, u + .75, -.62, .62, w - 4.35, w - 3.9, 'a_preto');
      for (let z = -3.4; z < -.8; z += .65) b(u - .68, u + .68, -.56, .56, w + z, w + z + .25, 'a_sombra'); }},
    bipe:{nome:'Bipé aberto', ideia:'deitado ou apoiado, mira firme', soLonga:true, desenhar(b, u, w){
      b(u - .7, u + .7, -.7, .7, w - .7, w + .15, 'a_ferro');
      for (const s of [-1, 1]) for (let i = 0; i < 5; i++){ const v = .55 + i * .55; b(u - .3, u + .3, ...[s * v, s * (v + .65)].sort((p, q) => p - q), w - .6 - (i + 1) * 1.15, w - .5 - i * 1.15, 'a_aco_escuro'); }
      for (const s of [-1, 1]) b(u - .55, u + .55, ...[s * 2.7, s * 3.7].sort((p, q) => p - q), w - 6.8, w - 6.3, 'a_borracha'); }},
    lanterna_fita:{nome:'Lanterna presa com fita (gambiarra)', ideia:'luz fraca, que pisca', soGamb:true, desenhar(b, u, w){
      b(u - 2.2, u + 1.4, -.6, .6, w - 1.35, w + .05, 'a_vermelho'); b(u + 1.4, u + 2.4, -.8, .8, w - 1.55, w + .15, 'a_metal'); b(u + 2.4, u + 2.54, -.55, .55, w - 1.3, w - .1, 'a_luz');
      for (const x of [-1.8, .3]) b(u + x, u + x + .8, -.82, .82, w - 1.55, w + .5, 'a_fita'); b(u - 1.4, u - .8, -.96, -.8, w - 3, w - 1.2, 'a_fita'); b(u - .5, u + .1, -.72, -.6, w - 1, w - .5, 'a_preto'); }},
  };
  /* ---------- carregador: (b, u, w) = fundo do carregador de fábrica ---------- */
  const carregadores = {
    estendido:{nome:'Carregador estendido', ideia:'mais munição antes de recarregar', desenhar(b, u, w){
      b(u - 1.05, u + 1.05, -.55, .55, w - 2.6, w + .35, 'a_polimero'); b(u - .75, u + 1.35, -.55, .55, w - 3.9, w - 2.55, 'a_polimero'); b(u - .9, u + 1.55, -.68, .68, w - 4.4, w - 3.85, 'a_ferro');
      for (const z of [-1, -2.2, -3.4]) dois(b, u - .7, u + 1, w + z, w + z + .3, .55, 'a_amarelo', .08); }},
    tambor:{nome:'Tambor', ideia:'muita munição, mas pesa', soLonga:true, desenhar(b, u, w){
      b(u - .8, u + .8, -.55, .55, w - 1, w + .35, 'a_aco_escuro');
      for (const [a, z0, z1] of [[1.5, -1.5, -.9], [2.5, -2.3, -1.5], [3, -4.6, -2.3], [2.5, -5.4, -4.6], [1.5, -6, -5.4]]) b(u - a, u + a, -1.15, 1.15, w + z0, w + z1, 'a_aco_escuro');
      dois(b, u - 1.7, u + 1.7, w - 5.1, w - 1.8, 1.15, 'a_ferro', .12); dois(b, u - .6, u + .6, w - 4.05, w - 2.85, 1.27, 'a_metal', .12); for (const [x, z] of [[-1.5, -2.4], [1.1, -2.4], [-1.5, -4.8], [1.1, -4.8]]) dois(b, u + x, u + x + .4, w + z, w + z + .4, 1.27, 'a_aco', .08); }},
    duplo:{nome:'Dois carregadores presos com fita', ideia:'recarrega mais rápido', desenhar(b, u, w){
      b(u - 1, u + 1, -.55, .55, w - .6, w + .35, 'a_polimero');
      b(u - .95, u + .95, .75, 1.75, w - .4, w + 4.6, 'a_polimero'); b(u - 1.1, u + 1.1, .65, 1.85, w + 4.6, w + 5.05, 'a_ferro'); b(u - .6, u + .6, .95, 1.55, w - .9, w - .4, 'a_latao');
      for (const z of [.5, 2.6]) b(u - 1.15, u + 1.15, -.75, 1.95, w + z - .6, w + z + .3, 'a_fita'); }},
  };

  /* ---------- reforços das armas de mão: s = {u, v, w0, w1} corte da arma perto da ponta; t = ponta ---------- */
  const reforcos = {
    pregos:{nome:'Pregos extras', ideia:'mais dano, gasta mais rápido', desenhar(b, s){
      const preso = x => Math.max(s.a, Math.min(s.z - .34, x));           /* cada prego fica sobre a parte em que foi cravado */
      for (let i = 0; i < 4; i++){ const u = preso(s.u - 1.5 + i); const cima = i % 2;
        b(u, u + .34, -.17, .17, ...(cima ? [s.w1 - .05, s.w1 + 1.9] : [s.w0 - 1.9, s.w0 + .05]), 'a_ferro'); b(u - .04, u + .38, -.1, .1, ...(cima ? [s.w1 + 1.9, s.w1 + 2.35] : [s.w0 - 2.35, s.w0 - 1.9]), 'a_aco'); }
      for (const [i, l] of [-1, 1].entries()){ const u = preso(s.u - .9 + i * 1.3); b(u, u + .34, ...[l * (s.v - .05), l * (s.v + 1.8)].sort((p, q) => p - q), (s.w0 + s.w1) / 2 - .17, (s.w0 + s.w1) / 2 + .17, 'a_ferro'); } }},
    arame:{nome:'Arame farpado', ideia:'mais dano; pode prender no inimigo', desenhar(b, s){
      for (let i = 0; i < 4; i++){ const u = s.u - 1.6 + i * .95;
        anel_(b, u, u + .28, s.v + .18, s.w0 - .18, s.w1 + .18, 'a_ferro', .28);
        b(u, u + .24, -.14, .14, ...(i % 2 ? [s.w1 + .18, s.w1 + .85] : [s.w0 - .85, s.w0 - .18]), 'a_aco'); const l = i % 2 ? -1 : 1; b(u, u + .24, ...[l * (s.v + .18), l * (s.v + .8)].sort((p, q) => p - q), (s.w0 + s.w1) / 2 - .14, (s.w0 + s.w1) / 2 + .14, 'a_aco'); } }},
    chapas:{nome:'Chapas de ferro', ideia:'aguenta mais pancadas; fica pesada', desenhar(b, s){
      for (const u of [s.u - 1.8, s.u + .5]){ anel_(b, u, u + 1.3, s.v + .3, s.w0 - .3, s.w1 + .3, 'a_metal', .36);
        for (const l of [-1, 1]) for (const x of [.15, .75]) b(u + x, u + x + .4, ...[l * (s.v + .3), l * (s.v + .48)].sort((p, q) => p - q), (s.w0 + s.w1) / 2 - .2, (s.w0 + s.w1) / 2 + .2, 'a_ferro'); } }},
    corrente:{nome:'Corrente enrolada', ideia:'golpe mais forte e barulhento', desenhar(b, s){
      for (let i = 0; i < 4; i++){ const u = s.u - 1.7 + i * 1.05; anel_(b, u, u + .55, s.v + .24, s.w0 - .24, s.w1 + .24, i % 2 ? 'a_metal' : 'a_ferro', .34); }
      for (let i = 0; i < 4; i++) b(s.u - 1.5 + (i % 2) * .5, s.u - 1 + (i % 2) * .5, -s.v - .55, -s.v - .2, s.w0 - 1 - i * .8, s.w0 - .1 - i * .8, i % 2 ? 'a_metal' : 'a_ferro'); }},
    lamina:{nome:'Lâmina na ponta', ideia:'também fura', desenhar(b, s, t){
      b(t.u - 1.8, t.u + .5, -.2, .2, t.w - .35, t.w + .35, 'a_couro'); b(t.u + .4, t.u + 3.6, -.14, .14, t.w - .6, t.w + .6, 'a_metal'); b(t.u + 3.6, t.u + 4.8, -.12, .12, t.w - .3, t.w + .35, 'a_metal'); b(t.u + 4.8, t.u + 5.5, -.1, .1, t.w, t.w + .2, 'a_aco');
      for (const x of [-1.5, -.7]) b(t.u + x, t.u + x + .45, -t.v - .22, t.v + .22, t.w0 - .22, t.w1 + .22, 'a_corda'); }},
  };
  /* moldura em volta de um corte da arma */
  function anel_(b, u0, u1, v, w0, w1, mat, e){ b(u0, u1, -v, v, w1 - e, w1, mat); b(u0, u1, -v, v, w0, w0 + e, mat); b(u0, u1, -v, -v + e, w0, w1, mat); b(u0, u1, v - e, v, w0, w1, mat); }

  /* ---------- pinturas: três tons aplicados em manchas sobre o corpo da arma ---------- */
  const pinturas = {
    selva:{nome:'Camuflagem de mata', tons:['a_camo1', 'a_camo2', 'a_camo3']}, deserto:{nome:'Camuflagem de deserto', tons:['a_areia1', 'a_areia2', 'a_areia3']},
    urbana:{nome:'Camuflagem urbana', tons:['a_urb1', 'a_urb2', 'a_urb3']}, neve:{nome:'Camuflagem de neve', tons:['a_neve1', 'a_neve2', 'a_neve3']},
    fosca:{nome:'Preto fosco', tons:['a_fosco', 'a_fosco2', 'a_fosco3'], liso:true}, ferrugem:{nome:'Toda enferrujada', tons:['a_enf1', 'a_enf2', 'a_enf3']},
    wo:{nome:'Edição WO (laranja)', tons:['a_wo', 'a_wo2', 'a_wo3'], faixas:true},
  };
  const enfeites = {
    fita_wo:{nome:'Tira laranja'}, chaveiro:{nome:'Chaveiro'}, lenco:{nome:'Lenço amarrado'}, riscos:{nome:'Riscos de contagem'}, adesivo:{nome:'Adesivo de risco biológico'},
  };

  MODS_ARMA = {mira:miras, ponta:pontas, baixo:baixos, carregador:carregadores, reforco:reforcos, pintura:pinturas, enfeite:enfeites};
})();

/* o que serve em cada arma */
function modServe(id, slot, mod){
  const A = ARMAS[id], M = MODS_ARMA[slot]?.[mod]; if (!A || !M) return false;
  if (slot === 'pintura' || slot === 'enfeite') return true;
  if (slot === 'reforco') return !ehDeMira(id) && A.longa !== false && !A.tipo.match(/militar|gambiarra/) && !['arco', 'estilingue'].includes(id);
  const E = ENCAIXES[id]; if (!E || !E[slot]) return false;
  if (mod === 'bipe' && (id === 'metralhadora' || id === 'rifle_precisao')) return false;   /* ja tem bipe de fabrica */
  if (M.soMilitar && A.tipo !== 'militar') return false;                        /* peça de fábrica só nas inteiras */
  if (M.soGamb && A.tipo === 'militar') return false;
  if (M.soLonga && A.longa === false) return false;
  return true;
}
const opcoesDe = (id, slot) => Object.fromEntries(Object.entries(MODS_ARMA[slot]).filter(([k]) => modServe(id, slot, k)).map(([k, v]) => [k, v.nome]));

/* caixas da arma, em ordem [u0, u1, v0, v1, w0, w1, material] */
function caixasDaArma(id){
  const out = [];
  ARMAS[id].desenhar((u0, u1, v0, v1, w0, w1, mat) => out.push([Math.min(u0, u1), Math.max(u0, u1), Math.min(v0, v1), Math.max(v0, v1), Math.min(w0, w1), Math.max(w0, w1), mat]));
  return out;
}
function comModificacoes(id, mods){
  const A = ARMAS[id], m = Object.fromEntries(Object.keys(SLOTS_MOD).map(s => [s, mods && modServe(id, s, mods[s]) ? mods[s] : 'nenhum']));
  if (Object.values(m).every(v => v === 'nenhum')) return A.desenhar;
  return b => {
    const E = ENCAIXES[id] || {};
    let caixas = caixasDaArma(id);
    if (m.mira !== 'nenhum' && E.troca){ const [a, z, alto] = E.troca; caixas = caixas.filter(c => { const meio = (c[0] + c[1]) / 2; return !(meio > a && meio < z && c[5] > alto); }); }
    const original = caixas;
    /* pintura */
    const P = MODS_ARMA.pintura[m.pintura];
    const pinta = (c) => {
      const [u0, u1, v0, v1, w0, w1, mat] = c;
      if (!P || !PINTAVEL_ARMA(mat, c)) return b(...c);
      const n = P.liso ? 1 : Math.max(1, Math.ceil((u1 - u0) / 1.7));
      for (let i = 0; i < n; i++){
        const a = u0 + (u1 - u0) * i / n, z = u0 + (u1 - u0) * (i + 1) / n;
        let t;
        if (P.liso) t = mat === 'a_ferro' || mat === 'a_madeira2' ? 2 : mat === 'a_aco_escuro' ? 0 : 1;
        else if (P.faixas) t = Math.floor((a + 40) / 5.2) % 3 === 0 ? 0 : (Math.floor((a + 40) / 5.2) % 3 === 1 ? 1 : (w1 - w0 > 1.4 ? 0 : 2));
        else { const h = ruido(`tinta|${Math.floor((a + z) / 3.4)}|${Math.floor((w0 + w1) / 2.6)}|${id}`); t = h < 46 ? 0 : h < 75 ? 1 : 2; }
        b(a, z, v0, v1, w0, w1, P.tons[t]);
      }
    };
    caixas.forEach(pinta);
    /* nas de gambiarra o topo é torto: um calço de fita enrolada segura a mira */
    if (m.mira !== 'nenhum' && A.tipo === 'gambiarra') b(E.mira[0] - 2, E.mira[0] + 2, -.5, .5, E.mira[1] - 1, E.mira[1] + .1, 'a_fita');
    for (const slot of ['mira', 'ponta', 'baixo', 'carregador']) if (m[slot] !== 'nenhum') MODS_ARMA[slot][m[slot]].desenhar(b, ...E[slot]);

    if (m.reforco !== 'nenhum'){
      const fim = Math.max(...original.map(c => c[1]));
      /* corte perto da ponta: entre as caixas que passam por ali, a que está mais no meio da arma */
      let u = fim - 4.2, ali = [];
      for (const d of [4.2, 5.5, 7, 3, 8.5, 10]){ u = fim - d; ali = original.filter(c => c[0] <= u && c[1] >= u && c[2] <= .1 && c[3] >= -.1); if (ali.length) break; }
      const nucleo = ali.sort((p, q) => Math.abs(p[4] + p[5]) - Math.abs(q[4] + q[5]))[0];
      if (nucleo){
        const corte = {u, a:nucleo[0], z:nucleo[1], v:Math.max(.3, Math.min(1.5, Math.max(nucleo[3], -nucleo[2]))), w0:nucleo[4], w1:nucleo[5]};
        const ultima = original.filter(c => c[1] >= fim - .05).sort((p, q) => (q[3] - q[2]) * (q[5] - q[4]) - (p[3] - p[2]) * (p[5] - p[4]))[0];
        const ponta = {u:fim, w:(ultima[4] + ultima[5]) / 2, w0:ultima[4], w1:ultima[5], v:Math.max(ultima[3], -ultima[2])};
        MODS_ARMA.reforco[m.reforco].desenhar(b, corte, ponta);
      }
    }

    if (m.enfeite !== 'nenhum'){
      /* o corpo: a maior caixa que cruza o meio da arma; os enfeites ficam no lado de fora dele */
      const vol = c => (c[1] - c[0]) * (c[3] - c[2]) * (c[5] - c[4]);
      const corpo = original.filter(c => c[2] < 0 && c[3] > 0).sort((p, q) => vol(q) - vol(p))[0];
      const [u0, u1, v0, , w0, w1] = corpo, v = v0, um = (u0 + u1) / 2, wm = (w0 + w1) / 2, comp = u1 - u0, alt = w1 - w0;
      const cola = (a, z, c0, c1, mat, e = .14, fora = 0) => b(a, z, v - e - fora, v - fora, c0, c1, mat);
      if (m.enfeite === 'riscos'){
        const x = um - Math.min(1.5, comp / 2 - .1), h = Math.min(1.1, alt * .8);
        for (let i = 0; i < 4; i++) cola(x + i * .5, x + i * .5 + .2, wm - h / 2, wm + h / 2, 'a_branco', .2);
        cola(x - .2, x + 1.9, wm - .09, wm + .09, 'a_branco', .08, .2);
      }
      if (m.enfeite === 'adesivo'){
        const lado = Math.max(1.1, Math.min(2.4, alt * .95, comp * .7)), x = um - lado / 2, px = lado / 9;
        cola(x, x + lado, wm - lado / 2, wm + lado / 2, 'a_amarelo', .2);
        EMBLEMAS.biorrisco.px.forEach((linha, l) => [...linha].forEach((p, i) => { if (p === '1') cola(x + i * px, x + (i + 1) * px, wm + lado / 2 - (l + 1) * px, wm + lado / 2 - l * px, 'a_sombra', .08, .2); }));
      }
      if (['fita_wo', 'chaveiro', 'lenco'].includes(m.enfeite)){
        const x = u0 + Math.min(1, comp * .2);
        cola(x, x + .5, w0 - .3, wm + .1, m.enfeite === 'lenco' ? 'a_pano' : 'a_preto', .2);
        if (m.enfeite === 'fita_wo'){ cola(x - .1, x + .6, w0 - 2.8, w0 - .2, 'a_wo', .2); cola(x + .35, x + 1.05, w0 - 3.8, w0 - 2.6, 'a_wo', .2); cola(x - .25, x + .75, wm - .35, wm + .35, 'a_wo', .1, .2); }
        if (m.enfeite === 'chaveiro'){ cola(x + .15, x + .35, w0 - 1.7, w0 - .2, 'a_aco', .16); cola(x - .35, x + .85, w0 - 2.9, w0 - 1.6, 'a_latao', .3); cola(x, x + .5, w0 - 2.5, w0 - 2, 'a_sombra', .08, .3); cola(x - .1, x + .6, w0 - 3.6, w0 - 2.85, 'a_vermelho', .22); }
        if (m.enfeite === 'lenco'){ cola(x - .5, x + 1, w0 - 1.4, w0 - .2, 'a_pano', .24); cola(x - .2, x + .7, w0 - 2.5, w0 - 1.35, 'a_pano', .22); cola(x + .05, x + .45, w0 - 3.3, w0 - 2.45, 'a_pano', .2); for (const [a, z] of [[-.2, -.8], [.45, -1.1], [.1, -1.9]]) cola(x + a, x + a + .26, w0 + z, w0 + z + .26, 'a_branco', .05, .24); }
      }
    }
  };
}
/* só o corpo recebe tinta: fitas, correias, couro, lentes e gumes ficam como são */
function PINTAVEL_ARMA(mat, c){
  const SIM = ['a_polimero', 'a_caqui', 'a_verde_mil', 'a_aco_escuro', 'a_ferro', 'a_madeira', 'a_nogueira', 'a_tabua', 'a_madeira2', 'a_vermelho', 'a_amarelo', 'a_violao', 'a_violao_tampo', 'a_laranja'];
  return SIM.includes(mat) && (c[1] - c[0]) * (c[5] - c[4]) > .5;                 /* detalhes miúdos ficam na cor original */
}
