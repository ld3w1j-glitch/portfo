/* Mais cabelos, óculos, chapéus e roupas civis. Cada bloco acrescenta itens às listas do criador. */

/* ================================================================ cabelos
   pintar(a, j, k, f) -> material ou null (pele). a = distância do meio; j = profundidade; k = altura; f = direção da face.
   volume(por, sorte) acrescenta blocos soltos: por(i, j, k). Grade da cabeça: i 0..13, j 0 (frente)..12, k até 19. */
const linhaTesta = (a, k) => k >= 17 || (k === 16 && a >= 3.5) || (a >= 5.5 && k >= 14);
const cabeloCheio = (baixoLado = 13, baixoTras = 8) => (a, j, k, f) => {
  if (f.cima && k >= 15) return 'cabelo';
  if (f.frente) return (j <= 1 ? linhaTesta(a, k) : k >= 15) ? 'cabelo' : null;
  if (f.lado) return (k >= baixoLado || (j >= 7 && k >= 9)) ? 'cabelo' : null;
  if (f.tras) return k >= baixoTras ? 'cabelo' : null;
  return null;
};
const lateraisRaspadas = (a, j, k, f) => {
  if (f.frente) return j <= 1 ? (linhaTesta(a, k) ? 'raspado' : null) : (k >= 15 ? 'raspado' : null);
  if ((f.lado && (k >= 14 || (j >= 6 && k >= 11))) || (f.tras && k >= 10) || (f.cima && k >= 15)) return 'raspado';
  return null;
};
/* topo arredondado: três degraus que acompanham o formato da cabeça */
const domo = por => { for (const [k, i0, i1, j0, j1] of [[18, 1, 12, 1, 11], [19, 2, 11, 1, 11], [20, 3, 10, 2, 9]]) for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) por(i, j, k); };
/* mecha pendurada: coluna de i,j descendo de "de" até "ate" */
const mecha = (por, i, j, de, ate) => { for (let k = ate; k <= de; k++) por(i, j, k); };

const CABELOS_NOVOS = {
  militar: {nome:'Militar reto',
    pintar:(a, j, k, f) => (f.cima && k >= 15) || (f.frente && k >= 17) ? 'cabelo' : lateraisRaspadas(a, j, k, f),
    volume(por){ for (let i = 3; i <= 10; i++) for (let j = 0; j <= 9; j++) por(i, j, 20); }},
  undercut: {nome:'Undercut',
    pintar:(a, j, k, f) => (f.cima && k >= 15) || (f.frente && k >= 17) || (!f.frente && k >= 17) ? 'cabelo' : lateraisRaspadas(a, j, k, f),
    volume(por){ for (let i = 2; i <= 11; i++){ for (let j = -1; j <= 9; j++) por(i, j, 20); if (i <= 8) for (let j = -1; j <= 5; j++) por(i, j, 21); } for (let i = 10; i <= 12; i++) mecha(por, i, -1, 19, 17); }},
  lateral: {nome:'Penteado de lado',
    pintar:(a, j, k, f) => cabeloCheio(14, 9)(a, j, k, f),
    volume(por){ for (let i = 6; i <= 12; i++) for (let j = 0; j <= 8; j++) por(i, j, 20); for (let i = 7; i <= 11; i++) for (let j = 0; j <= 4; j++) por(i, j, 21); for (let i = 2; i <= 3; i++) for (let j = 0; j <= 8; j++) por(i, j, 20); for (let i = 7; i <= 12; i++) por(i, -1, 17); }},
  franja: {nome:'Franja jogada',
    pintar:cabeloCheio(12, 7),
    volume(por){ for (let i = 2; i <= 11; i++){ const baixo = 14 + Math.round((i - 2) * .28); mecha(por, i, -1, 19, Math.min(17, baixo)); } for (let i = 2; i <= 11; i++) for (let j = 0; j <= 8; j++) por(i, j, 20); }},
  cacheado: {nome:'Cacheado curto',
    pintar:cabeloCheio(13, 10),
    volume(por, sorte){
      domo(por);
      for (let i = 2; i <= 11; i++) for (let j = 1; j <= 10; j++) if (sorte(`cA${i},${j}`) < 40) por(i, j, i > 2 && i < 11 && j > 1 ? 21 : 20);
      for (const i of [0, 13]) for (let j = 3; j <= 11; j++) for (let k = 14; k <= 18; k++) if (sorte(`cC${i},${j},${k}`) < 45) por(i, j, k);
      for (let i = 2; i <= 11; i++) for (let k = 11; k <= 18; k++) if (sorte(`cD${i},${k}`) < 42) por(i, 13, k);
      for (let i = 2; i <= 11; i++) if (sorte(`cE${i}`) < 55) por(i, -1, 17);
    }},
  trancas: {nome:'Tranças',
    pintar(a, j, k, f){ const m = cabeloCheio(12, 7)(a, j, k, f); return m && ((Math.floor(a) % 2 === 1 && (f.cima || (f.frente && k >= 16))) ? 'raspado' : m); },
    volume(por){
      for (let i = 1; i <= 12; i += 2) mecha(por, i, 13, 15, -3 + (i % 4));
      for (let i = 2; i <= 11; i += 2) mecha(por, i, 12, 10, -2 + ((i / 2) % 3));
      for (const i of [0, 13]) for (const j of [8, 10, 12]) mecha(por, i, j, 14, j === 10 ? -1 : 2);
    }},
  dreads: {nome:'Dreads',
    pintar:cabeloCheio(12, 7),
    volume(por, sorte){
      for (let i = 1; i <= 12; i++) for (let j = 1; j <= 11; j++) if ((i + j) % 2 === 0){ por(i, j, 20); if (sorte(`dA${i},${j}`) < 30) por(i, j, 21); }
      for (let i = 1; i <= 12; i += 2){ mecha(por, i, 13, 17, 1 + sorte(`dB${i}`) % 6); mecha(por, i, 14, 12, 2 + sorte(`dC${i}`) % 5); }
      for (const [i, fora] of [[0, -1], [13, 14]]) for (let j = 6; j <= 12; j += 2){ mecha(por, i, j, 17, 3 + sorte(`dD${i},${j}`) % 6); mecha(por, fora, j, 13, 5 + sorte(`dE${i},${j}`) % 5); }
    }},
  espetado: {nome:'Espetado',
    pintar:cabeloCheio(14, 11),
    volume(por, sorte){ for (let i = 2; i <= 11; i++) for (let j = 0; j <= 9; j++){ if ((i * 3 + j * 5) % 4 !== 0) continue; const alto = 20 + sorte(`e${i},${j}`) % 4; for (let k = 20; k <= alto; k++) por(i, j, k); } for (let i = 3; i <= 10; i += 2) por(i, -1, 17); }},
  chanel: {nome:'Chanel',
    pintar:cabeloCheio(7, 6),
    volume(por){
      domo(por);
      for (let i = 1; i <= 12; i++){ mecha(por, i, 13, 17, 5); mecha(por, i, -1, i > 2 && i < 11 ? 18 : 17, 15); }
      for (const i of [0, 13]) for (let j = 2; j <= 12; j++) mecha(por, i, j, 18, j < 4 ? 8 : 5);
      for (const i of [-1, 14]) for (let j = 5; j <= 11; j++) mecha(por, i, j, 13, 6);
    }},
  ondulado: {nome:'Longo ondulado',
    pintar:cabeloCheio(10, 5),
    volume(por){
      domo(por);
      for (let k = -8; k <= 18; k++){ const onda = Math.floor((k + 40) / 3) % 2;
        for (let i = 1 + onda; i <= 11 + onda; i++){ por(i, 13, k); if (k < 9) por(i, 12, k); if (onda && k > 0) por(i, 14, k); }
        for (const i of [onda ? -1 : 0, onda ? 14 : 13]) for (let j = 7; j <= 11; j++) if (k > -3) por(i, j, k); }
      for (let i = 9; i <= 12; i++) mecha(por, i, -1, 19, 16);
    }},
  rabo: {nome:'Rabo de cavalo',
    pintar:cabeloCheio(13, 9),
    volume(por){
      for (let i = 5; i <= 8; i++) for (let j = 12; j <= 15; j++) for (let k = 15; k <= 18; k++) por(i, j, k);
      for (let k = 2; k <= 15; k++){ const larg = k > 9 ? 2 : 1; for (let i = 7 - larg; i <= 6 + larg; i++) for (let j = 14; j <= (k > 6 ? 16 : 15); j++) por(i, j, k); }
    }},
  chiquinhas: {nome:'Dois coques',
    pintar:cabeloCheio(13, 9),
    volume(por){ for (const x0 of [0, 10]) for (let i = x0; i <= x0 + 3; i++) for (let j = 4; j <= 7; j++) for (let k = 20; k <= 23; k++){ const canto = (i === x0 || i === x0 + 3) + (j === 4 || j === 7) + (k === 23); if (canto < 2) por(i, j, k); } }},
  calvo: {nome:'Calvo nas entradas',
    pintar(a, j, k, f){ if (f.cima || f.frente) return null; if (f.lado) return (k >= 9 && k <= 15 && j >= 4) ? 'cabelo' : null; return f.tras && k >= 8 && k <= 15 ? 'cabelo' : null; }},
};
for (const [id, d] of Object.entries(CABELOS_NOVOS)) CABELOS[id] = d.nome;

/* ================================================================ óculos
   r(x0, x1, y0, y1, z0, z1, material): x medido a partir do meio do rosto. */
const hastes = r => { for (const s of [-1, 1]){ r(s*4.8, s*6.35, -.62, -.34, 11, 11.28); r(s*6.08, s*6.35, -.62, 4.6, 11, 11.28); r(s*6.05, s*6.4, 4.6, 6.4, 10.95, 11.35, 'ponteira'); } };
const OCULOS_NOVOS = {
  aviador: {nome:'Aviador', desenhar(r){ for (const s of [-1, 1]){
      r(s*.7, s*5.1, -.62, -.34, 11.9, 12.2); r(s*.7, s*.98, -.62, -.34, 10.2, 11.9); r(s*4.82, s*5.1, -.62, -.34, 9.4, 11.9);
      r(s*.98, s*1.7, -.62, -.34, 9.2, 10.2); r(s*1.7, s*2.6, -.62, -.34, 8.4, 9.2); r(s*2.6, s*4.1, -.62, -.34, 8.15, 8.45); r(s*4.1, s*4.82, -.62, -.34, 8.4, 9.4);
      r(s*.98, s*4.82, -.5, -.36, 10.2, 11.9, 'lente_ambar'); r(s*1.7, s*4.82, -.5, -.36, 9.2, 10.2, 'lente_ambar'); r(s*2.6, s*4.1, -.5, -.36, 8.45, 9.2, 'lente_ambar');
    } r(-.7, .7, -.62, -.34, 11.9, 12.15); r(-.7, .7, -.62, -.34, 11.1, 11.35); hastes(r); }},
  grossos: {nome:'Armação grossa', desenhar(r){ for (const s of [-1, 1]){
      r(s*.7, s*5.1, -.75, -.34, 11.65, 12.35); r(s*.9, s*4.9, -.75, -.34, 8.6, 9.2); r(s*.7, s*1.3, -.75, -.34, 8.9, 11.9); r(s*4.5, s*5.1, -.75, -.34, 8.9, 11.9);
    } r(-.7, .7, -.7, -.34, 11, 11.6); hastes(r); }},
  gatinho: {nome:'Gatinho', desenhar(r){ for (const s of [-1, 1]){
      r(s*.9, s*3.4, -.65, -.34, 11.5, 11.95); r(s*3.4, s*5, -.65, -.34, 11.7, 12.5); r(s*4.6, s*5.7, -.65, -.34, 12.4, 13);
      r(s*.9, s*1.25, -.65, -.34, 9.6, 11.6); r(s*1.25, s*4.2, -.65, -.34, 9.2, 9.55); r(s*4.2, s*4.65, -.65, -.34, 9.5, 11.8);
    } r(-.9, .9, -.62, -.34, 11.1, 11.35); hastes(r); }},
  meia: {nome:'Meia armação', desenhar(r){ for (const s of [-1, 1]){ r(s*.8, s*4.9, -.68, -.34, 11.55, 12.1); r(s*.8, s*1.05, -.62, -.34, 10.4, 11.6); r(s*4.65, s*4.9, -.62, -.34, 10.4, 11.6); } r(-.8, .8, -.62, -.34, 11.15, 11.4); hastes(r); }},
  redondo_escuro: {nome:'Redondo escuro', desenhar(r){ for (const s of [-1, 1]){
      r(s*1.35, s*4.35, -.62, -.34, 12.05, 12.33); r(s*1.35, s*4.35, -.62, -.34, 8.65, 8.93); r(s*.75, s*1.03, -.62, -.34, 9.35, 11.65); r(s*4.67, s*4.95, -.62, -.34, 9.35, 11.65);
      for (const [x, z] of [[.9, 11.6], [4.38, 11.6], [.9, 9], [4.38, 9]]) r(s*x, s*(x + .42), -.62, -.34, z, z + .5);
      r(s*1.03, s*4.67, -.5, -.36, 9.35, 11.65, 'lente'); r(s*1.35, s*4.35, -.5, -.36, 8.93, 12.05, 'lente'); r(s*1.6, s*2.4, -.56, -.5, 11, 11.35, 'brilho');
    } r(-.75, .75, -.62, -.34, 11.2, 11.48); hastes(r); }},
  esportivo: {nome:'Viseira esportiva', desenhar(r){ r(-5.6, 5.6, -.72, -.36, 11.65, 12.15); r(-5.35, 5.35, -.62, -.4, 9.7, 11.65, 'lente_azul'); r(-5.35, -1.2, -.62, -.4, 9.1, 9.7, 'lente_azul'); r(1.2, 5.35, -.62, -.4, 9.1, 9.7, 'lente_azul'); r(-4.4, -2.4, -.68, -.62, 11.1, 11.4, 'brilho'); hastes(r); }},
  tres_d: {nome:'Óculos 3D', desenhar(r){ for (const s of [-1, 1]){ r(s*.7, s*5.1, -.65, -.4, 11.8, 12.35, 'branco_roupa'); r(s*.7, s*5.1, -.65, -.4, 8.6, 9.1, 'branco_roupa'); r(s*.7, s*1.2, -.65, -.4, 9.1, 11.8, 'branco_roupa'); r(s*4.6, s*5.1, -.65, -.4, 9.1, 11.8, 'branco_roupa'); r(s*1.2, s*4.6, -.5, -.42, 9.1, 11.8, s < 0 ? 'lente_vermelha' : 'lente_azul'); } r(-.7, .7, -.62, -.4, 11.1, 11.6, 'branco_roupa'); hastes(r); }},
  tapa_olho: {nome:'Tapa-olho', desenhar(r){ r(-4.7, -1, -.75, -.3, 9, 11.9, 'ponteira'); r(-4, -1.7, -.9, -.75, 9.5, 11.4, 'couro'); r(-6.2, -4.7, -.6, -.3, 11.2, 11.6, 'ponteira'); r(-1, 1.5, -.6, -.3, 11.9, 12.35, 'ponteira'); r(1.5, 3.8, -.6, -.3, 12.35, 12.8, 'ponteira'); r(3.8, 6.2, -.6, -.3, 12.8, 13.25, 'ponteira'); r(-6.3, -5.95, -.6, 6, 11.2, 11.55, 'ponteira'); }},
};
for (const [id, d] of Object.entries(OCULOS_NOVOS)) OCULOS[id] = d.nome;
OCULOS.nenhum = 'Sem óculos';

/* ================================================================ chapéus civis (usam a cor escolhida em "chapeu") */
const abaChapeu = (cx, x0, x1, y0, y1, z, alt, mat, q) => camada(cx, 'cabeca', x0, x1, y0, y1, z, z + alt, mat, false, q);
const copa = (cx, camadas, mat = 'chapeu') => camadas.forEach(([x0, x1, y0, y1, z0, z1, q]) => camada(cx, 'cabeca', x0, x1, y0, y1, z0, z1, mat, false, q));
const CHAPEUS_CIVIS = {
  bone_virado: {nome:'Boné para trás', desenhar(cx){
    copa(cx, [[.65, 13.35, -.55, 13.45, 15.5, 17.4, .7], [1.35, 12.65, -.35, 13.2, 17.4, 19.2, .9], [2.4, 11.6, .1, 11.9, 19.2, 20.75, 1]]);
    cx('cabeca', 6.5, 7.5, 5.5, 6.5, 20.75, 21.15, 'chapeu_escuro'); cx('cabeca', 2.4, 11.6, 13.45, 16.2, 15.6, 16.2, 'chapeu_sombra'); cx('cabeca', 3.4, 10.6, 16.2, 17.3, 15.5, 16.05, 'chapeu_sombra');
    cx('cabeca', 5, 9, -.75, -.55, 15.7, 17, 'preto'); cx('cabeca', 5.4, 8.6, -.86, -.75, 16.1, 16.6, 'chapeu_claro'); }},
  palha: {nome:'Chapéu de palha', desenhar(cx){
    abaChapeu(cx, -3, 17, -4, 16.2, 15.25, .5, 'palha', 3); abaChapeu(cx, -2.2, 16.2, -3.2, 15.4, 15.75, .3, 'palha_sombra', 2.6);
    copa(cx, [[.7, 13.3, -.55, 13.45, 16.05, 18.6, 1.2], [1.6, 12.4, .2, 12.4, 18.6, 20.4, 1.4], [3, 11, 1.6, 11, 20.4, 21.2, 1.4]], 'palha');
    copa(cx, [[.55, 13.45, -.7, 13.6, 16.15, 17.25, 1.2]], 'chapeu'); }},
  social: {nome:'Chapéu social', desenhar(cx){
    abaChapeu(cx, -1.5, 15.5, -2.4, 14.8, 15.3, .55, 'chapeu_sombra', 2.2);
    copa(cx, [[.75, 13.25, -.5, 13.45, 15.85, 18.8, 1.2], [1.6, 12.4, .3, 12.4, 18.8, 20.6, 1.4]]);
    cx('cabeca', 5.2, 8.8, 1, 11.4, 20.6, 20.9, 'chapeu_sombra'); copa(cx, [[.58, 13.42, -.66, 13.6, 16, 17.2, 1.2]], 'preto'); cx('cabeca', 13.4, 13.9, 4, 6, 16.2, 18, 'chapeu_claro'); }},
  cowboy: {nome:'Chapéu de caubói', desenhar(cx){
    abaChapeu(cx, -1, 15, -4.2, 17, 15.25, .55, 'chapeu_sombra', 3);
    for (const [a, b, c, d] of [[-2.8, -1, 15.6, 16.7], [-4, -2.8, 16.5, 17.8], [15, 16.8, 15.6, 16.7], [16.8, 18, 16.5, 17.8]]) cx('cabeca', a, b, -1.5, 14.3, c, d, 'chapeu_sombra');
    copa(cx, [[.75, 13.25, -.5, 13.45, 15.8, 19.2, 1.4], [1.7, 12.3, .5, 12.2, 19.2, 21.2, 1.6]]);
    cx('cabeca', 5.4, 8.6, 1.2, 11.2, 21.2, 21.5, 'chapeu_escuro'); copa(cx, [[.6, 13.4, -.65, 13.6, 16, 17.1, 1.4]], 'couro'); cx('cabeca', 6.3, 7.7, -.85, -.65, 16.1, 17, 'metal'); }},
  boina: {nome:'Boina', desenhar(cx){
    copa(cx, [[.7, 13.3, -.5, 13.45, 15.5, 16.4, .8]], 'chapeu_escuro'); copa(cx, [[-.8, 15, -1, 14, 16.4, 18.4, 2.2], [.4, 15.6, .3, 12.8, 18.4, 20, 2.4], [3, 12, 2, 10.5, 20, 20.7, 2]]); cx('cabeca', 7, 7.8, 6, 6.8, 20.7, 21.5, 'chapeu_escuro'); }},
  cartola: {nome:'Cartola', desenhar(cx){
    abaChapeu(cx, -1.2, 15.2, -2.2, 14.8, 15.4, .6, 'chapeu_sombra', 2.2); copa(cx, [[.9, 13.1, -.4, 13.4, 16, 26.5, 1]]); copa(cx, [[.55, 13.45, -.7, 13.65, 26.5, 27.3, 1.2]], 'chapeu_sombra'); copa(cx, [[.72, 13.28, -.58, 13.55, 16.4, 18.4, 1]], 'remendo'); }},
  bandana: {nome:'Bandana', desenhar(cx){
    copa(cx, [[.68, 13.32, -.55, 13.5, 15.3, 17.6, .8], [1.4, 12.6, -.25, 13.2, 17.6, 19.6, 1.1], [2.8, 11.2, .7, 11.8, 19.6, 20.5, 1.2]]);
    cx('cabeca', 5.8, 8.2, 13.5, 14.8, 14.6, 16.6, 'chapeu_escuro'); cx('cabeca', 4.6, 6, 13.6, 14.4, 12.2, 14.8, 'chapeu_sombra'); cx('cabeca', 8.1, 9.4, 13.7, 14.5, 11.6, 14.8, 'chapeu_sombra');
    for (let x = 2; x < 12; x += 2.2) cx('cabeca', x, x + .5, -.66, -.55, 16.1 + (x % 4.4 > 2 ? .6 : 0), 16.6 + (x % 4.4 > 2 ? .6 : 0), 'branco_roupa'); }},
  chef: {nome:'Chapéu de chef', desenhar(cx){
    copa(cx, [[.75, 13.25, -.5, 13.45, 15.4, 19, .9]], 'chapeu'); copa(cx, [[-.6, 14.6, -1.4, 14.2, 21, 25, 2.6], [.4, 13.6, -.4, 13.2, 19, 21, 1.4], [1.4, 12.6, .8, 12, 25, 26.2, 2.2]], 'chapeu_claro');
    for (let x = 2; x < 12; x += 2.4) cx('cabeca', x, x + .3, -.62, -.5, 15.6, 18.8, 'chapeu_sombra'); }},
  fone_musica: {nome:'Fone de música', desenhar(cx){
    for (const [a, b] of [[-1.4, .85], [13.15, 15.4]]){ cx('cabeca', a, b, 4, 9, 6.8, 11.8, 'chapeu'); cx('cabeca', a < 0 ? a - .35 : b, a < 0 ? a : b + .35, 4.8, 8.2, 7.6, 11, 'preto'); cx('cabeca', a < 0 ? a - .45 : b + .35, a < 0 ? a - .35 : b + .45, 5.8, 7.2, 8.6, 10, 'remendo'); }
    for (const x of [-.35, 13.55]) cx('cabeca', x, x + .8, 5.9, 7.1, 11.8, 20.6, 'chapeu_escuro'); cx('cabeca', -.35, 14.35, 5.9, 7.1, 20.6, 21.5, 'chapeu_escuro'); }, semCortarCabelo:true},
};
for (const [id, d] of Object.entries(CHAPEUS_CIVIS)) CHAPEUS[id] = d.nome;

/* ================================================================ roupas civis */
const bermuda = (p, ate = 8) => (p.peca === 'quadril' || (ehCoxa(p.peca) && p.topo < ate)) ? 'calca' : null;
const mangaCurta = p => ehBraco(p.peca) && p.topo < 7;
const tronco = p => p.peca === 'torax' || p.peca === 'cintura';
const cos = p => p.peca === 'quadril' && p.k === p.tam[2] - 1;
const barra = (p, m = 'camisa_sombra') => p.peca === 'cintura' && p.k === 0 ? m : null;
function roupa(id, nome, cores, pintar, extras){
  const nomes = {camisa:null, calca:null, calcado:null, detalhe:null};
  ROUPAS[id] = {nome, civil:true, cores:Object.fromEntries(Object.entries(cores).map(([k, v]) => [k in nomes ? k : k, v]))};
  PINTURAS[id] = pintar;
  if (extras) EXTRAS_DA_ROUPA[id] = extras;
}
const base4 = (camisa, c1, calca, c2, calcadoNome, c3, detalhe, c4) => ({camisa:[camisa, c1], calca:[calca, c2], calcado:[calcadoNome, c3], detalhe:[detalhe, c4]});

roupa('polo', 'Polo', base4('Camisa polo', '#2F5D43', 'Calça', '#C9A66B', 'Sapatênis', '#5A3F2A', 'Gola e punho', '#F1F1EC'), p => {
  const c = calcado(p, 0); if (c) return c; if (cos(p)) return 'couro'; const q = calcaComprida(p); if (q) return q;
  if (p.peca === 'torax'){ if (golaV(p, 2.2)) return null; if (p.frente && p.topo <= 1 && p.meio < 4) return 'detalhe'; if (p.frente && p.meio < .6 && p.topo < 6) return p.k % 2 ? 'botao' : 'camisa_sombra'; return 'camisa'; }
  if (p.peca === 'cintura') return barra(p) || 'camisa';
  if (mangaCurta(p)) return p.topo === 6 ? 'detalhe' : 'camisa'; return null;
}, cx => { cx('torax', 8.6, 9.8, -.12, .1, 6, 7, 'detalhe'); });

roupa('xadrez', 'Camisa xadrez', base4('Camisa', '#7A1F1F', 'Jeans', '#3E5C86', 'Bota', '#5A3F2A', 'Linhas do xadrez', '#1A1A1A'), p => {
  const c = calcado(p, 3); if (c) return c; if (cos(p)) return 'couro'; const q = calcaComprida(p); if (q) return q;
  const grade = () => { const h = (p.i % 4 === 1) || (p.j % 4 === 2 && (p.n[0] !== 0)), v = p.k % 4 === 1; return h && v ? 'detalhe' : (h || v ? 'camisa_escuro' : 'camisa'); };
  if (tronco(p)){ if (golaV(p, 2.8)) return null; if (p.frente && p.meio < .6) return p.k % 2 ? 'branco_roupa' : 'camisa_escuro'; return grade(); }
  if (ehBraco(p.peca)) return grade(); if (ehAnte(p.peca)) return p.topo < 4 ? (p.topo === 3 ? 'camisa_escuro' : grade()) : null; return null;
});

roupa('regata', 'Regata e bermuda', base4('Regata', '#F1F1EC', 'Bermuda', '#3A3D45', 'Tênis', '#365CE6', 'Listra', '#F16A32'), p => {
  if (ehPe(p.peca)) return calcado(p, 0); if (ehCanela(p.peca) && p.k < 2) return 'branco_roupa';
  if (cos(p)) return 'calca_escuro'; const b = bermuda(p, 9); if (b) return (ehCoxa(p.peca) && p.n[0] !== 0 && p.j % 5 === 2) ? 'detalhe' : b;
  if (p.peca === 'cintura') return (p.k === 3) ? 'detalhe' : 'camisa';
  if (p.peca === 'torax'){ const cava = p.topo < 6 && p.meio > 4.6; const decote = p.frente && p.topo < 3 && p.meio < 3 - p.topo * .8; return (cava || decote) ? null : 'camisa'; }
  return null;
});

roupa('couro', 'Jaqueta de couro', base4('Jaqueta', '#2A211C', 'Calça', '#24262B', 'Coturno', '#1A1210', 'Camiseta', '#F1F1EC'), p => {
  const c = calcado(p, 4); if (c) return c; if (cos(p)) return p.frente && p.meio < 1 ? 'metal' : 'preto'; const q = calcaComprida(p); if (q) return q;
  if (tronco(p)){ const abre = p.peca === 'torax' ? Math.max(2, 3.6 - p.topo * .35) : 2;
    if (p.frente){ if (p.meio < abre) return p.peca === 'torax' && p.topo === 0 && p.meio < 1.5 ? null : 'detalhe'; if (p.meio < abre + .9) return 'camisa_claro'; if (p.peca === 'torax' && p.k === 3 && p.meio > 3.5 && p.meio < 6) return 'metal'; }
    return barra(p, 'camisa_escuro') || 'camisa'; }
  if (ehBraco(p.peca)) return p.topo === 0 ? 'camisa_claro' : 'camisa'; if (ehAnte(p.peca)) return p.k === 0 ? 'camisa_escuro' : 'camisa'; return null;
}, cx => { for (const s of [-1, 1]) cx('torax', 7 + Math.min(s*2.4, s*4.6), 7 + Math.max(s*2.4, s*4.6), -.55, .05, 8.4, 10.6, 'camisa_claro'); });

roupa('jaqueta_jeans', 'Jaqueta jeans', base4('Jaqueta', '#5778A6', 'Calça', '#2B2D33', 'Tênis', '#F1F1EC', 'Capuz e blusa', '#8E8F94'), p => {
  const c = calcado(p, 0); if (c) return c; const q = calcaComprida(p); if (q) return q;
  if (tronco(p)){ if (p.frente && p.meio < 1.8) return 'detalhe'; if (p.frente && p.meio < 2.6) return 'camisa_claro';
    if (p.frente && p.peca === 'torax' && p.meio > 3 && p.meio < 5.6 && (p.k === 6 || p.k === 4)) return 'camisa_escuro';
    return barra(p, 'camisa_escuro') || ((p.i === 3 || p.i === p.tam[0] - 4) ? 'camisa_sombra' : 'camisa'); }
  if (ehBraco(p.peca)) return 'camisa'; if (ehAnte(p.peca)) return p.k <= 1 ? 'camisa_escuro' : 'camisa'; return null;
}, cx => { cx('torax', 3.4, 10.6, 8, 9.6, 7.8, 11, 'detalhe'); cx('torax', 4.4, 9.6, 9.6, 10.3, 8.2, 10.4, 'detalhe_sombra'); });

roupa('agasalho', 'Agasalho esportivo', base4('Jaqueta', '#1F2A44', 'Calça', '#1F2A44', 'Tênis', '#F1F1EC', 'Listras', '#F1F1EC'), p => {
  const c = calcado(p, 0); if (c) return c;
  if (p.peca === 'quadril' || ehCoxa(p.peca) || ehCanela(p.peca)) return (p.n[0] !== 0 && (p.j === 2 || p.j === 4)) ? 'detalhe' : 'calca';
  if (tronco(p)){ if (p.frente && p.meio < .6) return 'metal'; if (p.peca === 'torax' && p.topo === 0) return 'camisa_escuro'; if (p.peca === 'torax' && p.k === 6) return 'detalhe'; return barra(p, 'camisa_escuro') || 'camisa'; }
  if (ehBraco(p.peca) || ehAnte(p.peca)) return (p.n[0] !== 0 && p.j === 1) ? 'detalhe' : (ehAnte(p.peca) && p.k === 0 ? 'camisa_escuro' : 'camisa'); return null;
});

roupa('listrado', 'Suéter listrado', base4('Suéter', '#C9A66B', 'Calça', '#3A3D45', 'Sapato', '#4A3426', 'Listras', '#7A1F1F'), p => {
  const c = calcado(p, 0); if (c) return c; if (cos(p)) return 'couro'; const q = calcaComprida(p); if (q) return q;
  const listra = (alt) => (alt % 4 === 1 || alt % 4 === 2) ? 'detalhe' : 'camisa';
  if (p.peca === 'torax') return p.topo === 0 ? 'camisa_sombra' : listra(p.k + 1); if (p.peca === 'cintura') return barra(p) || listra(p.k);
  if (ehBraco(p.peca)) return listra(p.k); if (ehAnte(p.peca)) return p.k === 0 ? 'camisa_sombra' : listra(p.k); return null;
});

roupa('praia', 'Praia', base4('Camisa florida', '#2C9C9A', 'Bermuda', '#E8D9B0', 'Chinelo', '#F16A32', 'Flores', '#F1F1EC'), p => {
  if (ehPe(p.peca)){ if (p.k === 0) return 'calcado'; return (p.k === p.tam[2] - 2 && ruido(`t${p.i},${p.j}`) < 45) ? 'calcado_escuro' : null; }
  const b = bermuda(p, 9); if (b) return cos(p) ? 'calca_escuro' : b;
  const flor = () => { const h = ruido(`flor|${p.peca}|${(p.i + (p.k >> 1)) >> 1},${p.k >> 1},${p.j >> 1}`); return h < 14 ? 'detalhe' : h < 19 ? 'remendo' : 'camisa'; };
  if (tronco(p)){ if (golaV(p, 3.4)) return null; if (p.frente && p.meio < 1.2 - (p.peca === 'cintura' ? .6 : 0)) return p.peca === 'torax' && p.k > 3 ? null : 'camisa_escuro'; return flor(); }
  return mangaCurta(p) ? flor() : null;
});

roupa('pijama', 'Pijama', base4('Blusa', '#8FA7D9', 'Calça', '#8FA7D9', 'Meia', '#F1F1EC', 'Risquinhos', '#F1F1EC'), p => {
  if (ehPe(p.peca)) return 'calcado';
  const risco = m => (p.i % 3 === 0 && p.n[0] === 0) || (p.j % 3 === 0 && p.n[0] !== 0) ? 'detalhe' : m;
  if (p.peca === 'quadril' || ehCoxa(p.peca) || ehCanela(p.peca)) return cos(p) ? 'calca_escuro' : risco('calca');
  if (tronco(p)){ if (golaV(p, 2.6)) return null; if (p.frente && p.meio < .6) return p.k % 3 === 0 ? 'branco_roupa' : 'camisa_escuro'; return risco('camisa'); }
  if (ehBraco(p.peca)) return risco('camisa'); if (ehAnte(p.peca)) return p.k === 0 ? 'camisa_escuro' : risco('camisa'); return null;
});

roupa('cozinheiro', 'Cozinheiro', base4('Dólmã', '#F1F1EC', 'Calça', '#2B2D33', 'Sapato', '#1A1A1A', 'Avental e lenço', '#7A1F1F'), p => {
  const c = calcado(p, 0); if (c) return c;
  if (p.frente && (p.peca === 'quadril' || (ehCoxa(p.peca) && p.topo < 9))) return p.peca === 'quadril' && p.k >= p.tam[2] - 1 ? 'detalhe_escuro' : 'detalhe';
  const q = calcaComprida(p); if (q) return q;
  if (tronco(p)){ if (p.peca === 'torax' && p.frente && p.topo < 2 && p.meio < 2.4 - p.topo) return 'detalhe'; if (p.frente && p.meio > 1.4 && p.meio < 2.6 && p.k % 2 === 1) return 'preto'; return p.frente && p.meio >= 3.2 && p.meio < 4 ? 'camisa_sombra' : 'camisa'; }
  if (ehBraco(p.peca)) return 'camisa'; if (ehAnte(p.peca)) return p.topo < 5 ? (p.topo === 4 ? 'camisa_sombra' : 'camisa') : null; return null;
}, cx => { cx('quadril', 1.2, 10.8, .55, 1, 4, 4.9, 'detalhe_escuro'); });

roupa('medico', 'Jaleco', base4('Jaleco', '#F1F1EC', 'Calça', '#3E5C86', 'Sapato', '#F1F1EC', 'Camisa', '#7FC1B5'), p => {
  const c = calcado(p, 0); if (c) return c;
  if ((p.peca === 'quadril' || (ehCoxa(p.peca) && p.topo < 7)) && !(p.frente && p.meio < 1.6)) return ehCoxa(p.peca) && p.topo === 6 ? 'camisa_sombra' : 'camisa';
  const q = calcaComprida(p); if (q) return q;
  if (tronco(p)){ const abre = p.peca === 'torax' ? Math.max(1.2, 3.4 - p.topo * .5) : 1.2; if (p.frente){ if (golaV(p, 2)) return null; if (p.meio < abre) return 'detalhe'; if (p.meio < abre + 1) return 'camisa_sombra'; } return 'camisa'; }
  if (ehBraco(p.peca)) return 'camisa'; if (ehAnte(p.peca)) return p.k === 0 ? 'camisa_sombra' : 'camisa'; return null;
}, cx => { /* estetoscópio e crachá */
  for (const x of [4.4, 9.2]) cx('torax', x, x + .45, -.4, .05, 5.5, 11.1, 'preto');
  cx('torax', 4.4, 7.2, -.45, -.1, 5.1, 5.6, 'preto'); cx('torax', 6.6, 7.4, -.75, -.1, 3.9, 5.2, 'metal'); cx('torax', 9.8, 11.4, -.35, .05, 4.4, 6.2, 'branco_roupa'); cx('torax', 10.1, 11.1, -.45, -.35, 5.2, 5.9, 'lente_azul'); });

roupa('futebol', 'Uniforme de futebol', base4('Camisa', '#365CE6', 'Calção', '#F1F1EC', 'Chuteira', '#1A1A1A', 'Número e meião', '#F2C230'), p => {
  if (ehPe(p.peca)) return calcado(p, 0); if (ehCanela(p.peca)) return p.k < 7 ? (p.k === 6 ? 'camisa' : 'detalhe') : null;
  const b = bermuda(p, 7); if (b) return (ehCoxa(p.peca) && p.n[0] !== 0 && p.j === 3) ? 'camisa' : b;
  if (p.peca === 'torax'){ if (p.frente && p.topo === 0 && p.meio < 2) return null; if (p.topo === 1 && p.meio < 3) return 'detalhe';
    const x = p.i - 5, z = p.k - 3; if ((p.tras || (p.frente && z < 4)) && x >= 0 && x < 4 && z >= 0 && z < 5){ const dez = ['1011', '1010', '1010', '1010', '1011']; if (p.tras ? ['1111','0001','0010','0100','0100'][4 - z][x] === '1' : false) return 'detalhe'; }
    return (p.i % 4 === 1 && p.n[0] === 0) ? 'camisa_escuro' : 'camisa'; }
  if (p.peca === 'cintura') return (p.i % 4 === 1 && p.n[0] === 0) ? 'camisa_escuro' : 'camisa';
  return mangaCurta(p) ? (p.topo === 6 ? 'detalhe' : 'camisa') : null;
});

roupa('refletivo', 'Obra e entregas', base4('Camiseta', '#3A3D45', 'Calça', '#59503F', 'Botina', '#6E4A34', 'Colete refletivo', '#F2A51A'), p => {
  const c = calcado(p, 4); if (c) return c; if (cos(p)) return 'couro'; const q = calcaComprida(p); if (q) return (ehCanela(p.peca) && p.k >= 5 && p.k <= 5) ? 'faixa' : q;
  if (tronco(p)){ if (p.peca === 'torax' && p.frente && p.topo < 4 && p.meio < 2.6 - p.topo * .5) return 'camisa'; if (p.frente && p.meio < .6) return 'metal';
    if ((p.peca === 'torax' && p.k === 2) || (p.peca === 'cintura' && p.k === 2)) return 'faixa'; if (p.peca === 'torax' && p.meio > 2.6 && p.meio < 3.8 && p.k > 2) return 'faixa'; return 'detalhe'; }
  return mangaCurta(p) ? 'camisa' : null;
});
