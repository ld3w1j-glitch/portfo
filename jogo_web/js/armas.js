/* Armas improvisadas do jogo: arte própria, feita a partir de objetos comuns (madeira, ferramentas e sucata).
   Carregado depois de quimicos.js e antes de modelo.js.

   Cada arma é desenhada UMA vez, em blocos, com b(u0, u1, v0, v1, w0, w1, material):
     u = ao longo da arma (0 no meio da empunhadura, positivo para a ponta), v = lado, w = para cima.
   A mesma forma vai para a mão do personagem e para o item de cenário (js/armas-cena.js).
   "materiais" é só a ideia inicial do que o jogador precisaria juntar no jogo. */

const ARMA_CORES = {
  a_madeira:'#A9784A', a_madeira2:'#6E4A30', a_metal:'#AEB4BC', a_aco:'#D3D8DE', a_ferro:'#4E545C', a_ferrugem:'#8F4A2A',
  a_fita:'#C9C4B2', a_preto:'#222327', a_couro:'#5A3F2A', a_corda:'#BFA372', a_vermelho:'#B8352E', a_amarelo:'#E0B32E',
  a_branco:'#E9E7DD', a_lona:'#5F6B45', a_borracha:'#2D2E31',
};

/* atalhos de forma */
const haste_ = (b, u0, u1, r, mat) => { b(u0, u1, -r, r, -r * .72, r * .72, mat); b(u0, u1, -r * .72, r * .72, -r, r, mat); };
/* enrolado de fita, arame ou corda: anéis um pouco maiores que o cabo */
const enrola_ = (b, u0, u1, r, mat, passo = .75, larg = .5) => { for (let u = u0; u + larg <= u1 + .001; u += passo) haste_(b, u, u + larg, r + .16, mat); };
function tacoBase(b){
  haste_(b, -4.6, -3.7, .95, 'a_madeira2'); haste_(b, -3.7, 5, .58, 'a_madeira');
  haste_(b, 5, 9, .78, 'a_madeira'); haste_(b, 9, 13.5, 1.05, 'a_madeira'); haste_(b, 13.5, 21, 1.35, 'a_madeira'); haste_(b, 21, 22, 1.05, 'a_madeira2');
  enrola_(b, -3.6, 4, .58, 'a_preto');
}

const ARMAS = {
  /* ------------------------------------------------ pancada */
  taco_pregos:{nome:'Taco com pregos', tipo:'pancada', materiais:['Taco de madeira', 'Pregos', 'Fita'], desenhar(b){
    tacoBase(b);
    for (const [u, dv, dw] of [[14.4, 1, 0], [15.8, -1, 0], [16.6, 0, 1], [18, 0, -1], [18.8, 1, 0], [19.8, -1, 0], [15.1, 0, 1], [20.2, 0, -1]]){
      const haste = (a, z) => dv ? b(u + a, u + a + .34, ...[dv * 1.2, dv * z].sort((p, q) => p - q), -.17, .17, 'a_ferro') : b(u + a, u + a + .34, -.17, .17, ...[dw * 1.2, dw * z].sort((p, q) => p - q), 'a_ferro');
      haste(0, 2.7);
      if (dv) b(u - .02, u + .36, ...[dv * 2.7, dv * 3.15].sort((p, q) => p - q), -.1, .1, 'a_aco'); else b(u - .02, u + .36, -.1, .1, ...[dw * 2.7, dw * 3.15].sort((p, q) => p - q), 'a_aco');
    }
    enrola_(b, 12.2, 13.4, 1.05, 'a_fita');
  }},
  taco_arame:{nome:'Taco com arame farpado', tipo:'pancada', materiais:['Taco de madeira', 'Arame farpado'], desenhar(b){
    tacoBase(b);
    enrola_(b, 13.8, 20.6, 1.35, 'a_ferro', 1.15, .28);
    for (let i = 0; i < 12; i++){
      const u = 14 + i * .55, s = i % 2 ? 1 : -1;
      if (i % 4 < 2) b(u, u + .22, ...[s * 1.45, s * 2.15].sort((p, q) => p - q), -.14, .14, 'a_aco'); else b(u, u + .22, -.14, .14, ...[s * 1.45, s * 2.15].sort((p, q) => p - q), 'a_aco');
    }
    b(15.5, 16.3, 1.36, 1.5, -.4, .6, 'a_vermelho');
  }},
  cano:{nome:'Cano de ferro', tipo:'pancada', materiais:['Cano', 'Cotovelo de encanamento', 'Fita'], desenhar(b){
    haste_(b, -4.5, 19, .68, 'a_ferro'); haste_(b, -5.2, -4.5, .92, 'a_ferrugem');
    haste_(b, 18.2, 20.8, 1.05, 'a_metal'); b(18.5, 20.5, -.75, .75, .7, 4.4, 'a_ferro'); b(18.2, 20.8, -1, 1, 3.7, 4.9, 'a_ferrugem');
    for (const u of [8, 13.5]) haste_(b, u, u + 1.6, .72, 'a_ferrugem');
    enrola_(b, -3.8, 3.8, .68, 'a_fita');
  }},
  pe_de_cabra:{nome:'Pé de cabra', tipo:'pancada', materiais:['Pé de cabra (achado em obra ou oficina)'], desenhar(b){
    b(-5, 17, -.45, .45, -.55, .55, 'a_vermelho'); b(-6.6, -5, -.6, .6, -.35, .35, 'a_ferro');
    b(17, 19, -.45, .45, -.2, 1.5, 'a_vermelho'); b(18.2, 19.6, -.45, .45, 1.2, 3.4, 'a_vermelho'); b(16.4, 18.6, -.45, .45, 2.9, 4, 'a_vermelho');
    b(14.9, 16.4, -.65, -.12, 2.8, 3.5, 'a_ferro'); b(14.9, 16.4, .12, .65, 2.8, 3.5, 'a_ferro');
    enrola_(b, -3.4, 3.4, .55, 'a_preto');
  }},
  chave_roda:{nome:'Chave de roda', tipo:'pancada', materiais:['Chave de roda de carro abandonado'], desenhar(b){
    b(-6, 14, -.42, .42, -.42, .42, 'a_ferro'); b(9.4, 10.6, -.42, .42, -6.4, 6.4, 'a_ferro');
    for (const s of [-1, 1]) b(9.1, 10.9, -.68, .68, ...[s * 6.2, s * 8].sort((p, q) => p - q), 'a_metal');
    b(14, 15.8, -.68, .68, -.68, .68, 'a_metal'); b(-7.6, -6, -.68, .68, -.68, .68, 'a_metal'); b(9.5, 10.5, -.5, .5, -.5, .5, 'a_ferrugem');
    enrola_(b, -3.2, 3.2, .42, 'a_fita');
  }},
  marreta:{nome:'Marreta de sucata', tipo:'pancada', materiais:['Cabo de enxada', 'Bloco de ferro', 'Arame'], desenhar(b){
    haste_(b, -6, 16, .62, 'a_madeira2'); haste_(b, -6.8, -6, .85, 'a_preto');
    b(14.6, 19.6, -1.9, 1.9, -4.2, 4.2, 'a_ferro'); b(15, 19.2, -2.15, 2.15, -3, -1.9, 'a_ferrugem'); b(15, 19.2, -2.15, 2.15, 1.9, 3, 'a_ferrugem');
    for (const s of [-1, 1]) b(14.9, 19.3, -1.65, 1.65, ...[s * 4.2, s * 4.9].sort((p, q) => p - q), 'a_metal');
    enrola_(b, 12.4, 14.6, .62, 'a_aco', .6, .3); enrola_(b, -4.4, 3.4, .62, 'a_couro');
  }},
  frigideira:{nome:'Frigideira', tipo:'pancada', materiais:['Frigideira', 'Fita'], desenhar(b){
    b(-4.5, 7, -.4, .4, -.5, .5, 'a_preto'); b(7, 9, -.35, .35, -1, 1, 'a_ferro');
    for (const [u0, u1, r] of [[8.6, 10, 3.2], [10, 11.4, 4.6], [11.4, 16.6, 5.3], [16.6, 18, 4.6], [18, 19.4, 3.2]]) b(u0, u1, -.8, .8, -r, r, 'a_ferro');
    b(10.8, 17.2, .8, .95, -3.8, 3.8, 'a_preto'); b(10.8, 17.2, -.95, -.8, -3.8, 3.8, 'a_borracha'); b(12, 13.2, -1.02, -.95, .8, 2.8, 'a_ferrugem');
    enrola_(b, -3.8, 3, .5, 'a_fita');
  }},
  pa:{nome:'Pá de jardim', tipo:'pancada', materiais:['Pá', 'Fita'], desenhar(b){
    haste_(b, -7, 16, .6, 'a_madeira'); b(-8.4, -7, -.5, .5, -2, 2, 'a_madeira2'); b(-9.2, -8.4, -.6, .6, -2.3, 2.3, 'a_preto');
    haste_(b, 14.6, 17.6, .82, 'a_ferro');
    b(17, 24.5, -.38, .38, -4, 4, 'a_ferro'); b(24.5, 26, -.34, .34, -3, 3, 'a_metal'); b(26, 27.2, -.28, .28, -1.5, 1.5, 'a_aco');
    for (const s of [-1, 1]) b(17, 23.8, -.55, .55, ...[s * 3.6, s * 4.25].sort((p, q) => p - q), 'a_metal');
    b(19, 22, .38, .46, -2.4, .4, 'a_ferrugem'); enrola_(b, -3.6, 3.6, .6, 'a_lona');
  }},
  /* ------------------------------------------------ corte */
  facao:{nome:'Facão velho', tipo:'corte', materiais:['Facão enferrujado', 'Couro ou fita para o cabo'], desenhar(b){
    b(-4, 3.4, -.55, .55, -.8, .8, 'a_couro'); enrola_(b, -3.6, 3, .8, 'a_preto', 1.3, .55); b(-4.9, -4, -.65, .65, -1.2, .9, 'a_madeira2');
    b(3.4, 4.3, -.85, .85, -1.5, 1.7, 'a_ferro');
    b(4.3, 15, -.2, .2, -.9, 1.5, 'a_metal'); b(15, 19.5, -.2, .2, -1.4, 1.5, 'a_metal'); b(19.5, 21, -.18, .18, -.7, 1.3, 'a_metal'); b(21, 22, -.16, .16, .1, 1, 'a_metal');
    b(4.3, 19.5, -.23, .23, -1.05, -.6, 'a_aco'); b(4.3, 19, -.25, .25, 1.15, 1.55, 'a_ferro');
    for (const [u, w] of [[7, .2], [12.5, -.3], [17, .5]]) b(u, u + 1.3, -.24, .24, w, w + .6, 'a_ferrugem');
  }},
  machadinha:{nome:'Machadinha amarrada', tipo:'corte', materiais:['Galho grosso', 'Pedaço de chapa', 'Corda'], desenhar(b){
    haste_(b, -4.5, 13.5, .6, 'a_madeira'); haste_(b, -5.2, -4.5, .78, 'a_madeira2');
    b(9.6, 13.2, -.34, .34, -4.6, .4, 'a_metal'); b(8.8, 14, -.3, .3, -6, -4.6, 'a_metal'); b(8.6, 14.2, -.26, .26, -6.7, -5.8, 'a_aco');
    b(10.4, 12.4, -.4, .4, .4, 2.4, 'a_ferro'); b(10.8, 12, -.34, .34, -3.4, -1.8, 'a_ferrugem');
    enrola_(b, 9.4, 13.4, .62, 'a_corda', .62, .42); b(9.6, 13.2, -.5, .5, -1.5, -.9, 'a_corda'); enrola_(b, -3.4, 3.2, .6, 'a_couro');
  }},
  machado_placa:{nome:'Machado de placa de trânsito', tipo:'corte', materiais:['Placa de trânsito caída', 'Cabo de madeira', 'Parafusos', 'Fita'], desenhar(b){
    haste_(b, -6, 18, .62, 'a_madeira2'); haste_(b, -6.8, -6, .85, 'a_preto');
    for (const [w0, w1, m] of [[-2.2, -.8, 4.2], [-3.6, -2.2, 5], [-6.4, -3.6, 5.6], [-7.8, -6.4, 4.4]]) b(15.5 - m, 15.5 + m, -.26, .26, w0, w1, 'a_vermelho');
    b(11.6, 19.4, -.3, .3, -5.4, -4.9, 'a_branco'); for (const u of [12.4, 14.4, 16.4, 18]) b(u, u + 1, -.32, .32, -4.3, -3.2, 'a_branco');
    b(10.8, 20.2, -.2, .2, -8.4, -7.8, 'a_aco'); b(13.5, 17.5, -.5, .5, -1, 1.2, 'a_ferro');
    for (const u of [14, 16.4]) b(u, u + .6, -.65, .65, -.6, .2, 'a_aco');
    enrola_(b, 11.6, 13.6, .62, 'a_fita'); enrola_(b, -4.4, 3.4, .62, 'a_preto');
  }},
  /* ------------------------------------------------ haste e distância */
  lanca:{nome:'Lança de cabo de vassoura', tipo:'longe', vertical:true, materiais:['Cabo de vassoura', 'Faca de cozinha', 'Corda', 'Fita'], desenhar(b){
    haste_(b, -21, 27, .55, 'a_madeira'); haste_(b, -22, -21, .72, 'a_ferro');
    b(24.5, 29, -.22, .22, .35, 1.2, 'a_couro');                                            /* cabo da faca, amarrado de lado */
    b(27.5, 35, -.18, .18, -.5, 1.05, 'a_metal'); b(35, 37, -.16, .16, -.2, .75, 'a_metal'); b(37, 38.2, -.14, .14, .1, .45, 'a_aco'); b(28, 36, -.2, .2, -.62, -.3, 'a_aco');
    enrola_(b, 23.8, 27.6, .85, 'a_corda', .62, .42); enrola_(b, -3.4, 3.4, .55, 'a_fita'); haste_(b, 21.5, 22.6, .72, 'a_vermelho');
  }},
  arco:{nome:'Arco improvisado', tipo:'longe', vertical:true, materiais:['Cano de PVC ou galho flexível', 'Corda', 'Fita', 'Flechas feitas à mão'], desenhar(b){
    haste_(b, -3.6, 3.6, .62, 'a_couro');
    for (const s of [-1, 1]) [[3.6, 8, 0], [8, 11.5, -.7], [11.5, 14.5, -1.7], [14.5, 17, -3]].forEach(([a, z, w], i) => {
      const [u0, u1] = s > 0 ? [a, z] : [-z, -a]; b(u0, u1, -.4, .4, w - .66, w + .66, i % 2 ? 'a_branco' : 'a_madeira');
      b(s > 0 ? u0 : u1 - .6, s > 0 ? u0 + .6 : u1, -.5, .5, w - .6, w + .6, 'a_fita');
    });
    b(-17, 17, -.1, .1, -3.75, -3.55, 'a_corda'); for (const s of [-1, 1]) b(...[s * 16.4, s * 17.4].sort((p, q) => p - q), -.55, .55, -3.9, -2.6, 'a_preto');
  }},
  estilingue:{nome:'Estilingue', tipo:'longe', deitar:'w', materiais:['Forquilha de madeira', 'Borracha de câmara de ar', 'Couro'], desenhar(b){
    b(2.2, 3.6, -.6, .6, -3, 2.6, 'a_madeira'); b(2.2, 3.6, -2.6, 2.6, 2.6, 3.8, 'a_madeira');
    for (const s of [-1, 1]){
      b(2.3, 3.5, ...[s * 1.8, s * 3].sort((p, q) => p - q), 3.8, 7.6, 'a_madeira'); b(2.2, 3.6, ...[s * 1.7, s * 3.1].sort((p, q) => p - q), 6.6, 7.2, 'a_corda');
      b(-2.5, 2.4, ...[s * 2.2, s * 2.55].sort((p, q) => p - q), 6.7, 7.05, 'a_borracha');
    }
    b(-3.1, -2.5, -2.55, 2.55, 6.55, 7.2, 'a_borracha'); b(-3.35, -2.5, -.9, .9, 6.3, 7.45, 'a_couro'); b(2.1, 3.7, -.68, .68, -2.6, .2, 'a_fita');
  }},
};
const TIPOS_ARMA = {pancada:'Pancada', corte:'Corte', longe:'Haste e distância'};
const NOMES_ARMAS = {nenhum:'Mãos livres', ...Object.fromEntries(Object.entries(ARMAS).map(([k, v]) => [k, v.nome]))};
for (const p of [PADRAO_WASHINGTON, PADRAO_LIMPO, PADRAO_FEMININO]) Object.assign(p, {arma:{estilo:'nenhum'}, broquel:{usa:false}});
const armado = c => !!(c.arma && Object.hasOwn(ARMAS, c.arma.estilo));

/* ---------------------------------------------------------------- na mão direita do personagem */
function armaNaMao(id, cx, desenhar){
  const [ox, oy, oz] = Animacao.origemDaArma(id);                 /* o mesmo ponto usado pelas mãos e pelos braços */
  const A = ARMAS[id];
  (desenhar || A.desenhar)((u0, u1, v0, v1, w0, w1, mat) => {
    if (A.vertical) cx('mao_d', ox + v0, ox + v1, oy - w1, oy - w0, oz + u0, oz + u1, mat);   /* em pé, à frente da mão */
    else cx('mao_d', ox + v0, ox + v1, oy - u1, oy - u0, oz + w0, oz + w1, mat);               /* deitada, apontando para a frente */
  });
}
/* escudo de tampa de latão, no antebraço esquerdo */
function broquelDeTampa(cx){
  const P = 'antebraco_e', [w, d, h] = ESTRUTURA[P].tam, ym = d / 2, zm = h / 2 - 1;
  const disco = (x0, x1, raio, mat) => { for (const [a, r] of [[1, .42], [.86, .68], [.68, .86], [.42, 1]]) cx(P, x0 + (1 - a) * .02, x1 - (1 - a) * .02, ym - raio * r, ym + raio * r, zm - raio * a, zm + raio * a, mat); };
  disco(w + .25, w + .95, 7.4, 'a_ferro'); disco(w + .95, w + 1.35, 6.4, 'a_metal'); disco(w + 1.35, w + 1.75, 3.3, 'a_ferro'); disco(w + 1.75, w + 2.1, 1.4, 'a_aco');
  cx(P, w + 1.35, w + 1.55, ym - 4.8, ym - 1.6, zm - 3.8, zm - 2.6, 'a_ferrugem'); cx(P, w + 1.35, w + 1.52, ym + 2.2, ym + 4.6, zm + 1.8, zm + 3.4, 'a_ferrugem');
  cx(P, w + 1.4, w + 1.65, ym - 5.4, ym + 5.4, zm + 3.6, zm + 4.5, 'a_fita');
  for (const [y, z] of [[-5, 0], [5, 0], [0, -5], [0, 5]]) cx(P, w + 1.3, w + 1.85, ym + y - .35, ym + y + .35, zm + z - .35, zm + z + .35, 'a_aco');
  anel(cx, P, -.3, w + .3, -.3, d + .3, zm - .9, zm + .1, 'a_couro', false, .3);
}

const equiparSemArmas = equipar;
equipar = function(c, cx){
  equiparSemArmas(c, cx);
  if (armado(c)) armaNaMao(c.arma.estilo, cx, typeof comModificacoes === 'function' ? comModificacoes(c.arma.estilo, c.modarma) : null);
  if (c.broquel?.usa) broquelDeTampa(cx);
};
/* "Tirar equipamentos" também guarda a arma; trocar de conjunto mantém */
Object.assign(KITS.nada.muda, {arma:{estilo:'nenhum'}, broquel:{usa:false}});
