/* Configuração da página inicial: caminhos, sequências de vídeo e preferências do usuário.
   Para trocar/atualizar um vídeo, veja ferramentas/video_para_frames.py */

export const ESTATICO = '/static';
export const EL = `${ESTATICO}/img/elementos/`;

/* Cada vídeo foi convertido em quadros WebP com transparência e é desenhado num <canvas>. */
export const SEQ = {
  plus:    {dir: `${ESTATICO}/video/plus`,    n: 63},    // fundo: grade de cruzes (acompanha a página toda)
  esfera:  {dir: `${ESTATICO}/video/esfera`,  n: 84},    // palco "Três frentes": esfera gira
  cabeca:  {dir: `${ESTATICO}/video/cabeca`,  n: 105},   // palco "Sobre": cabeça vira de perfil para frente
  terreno: {dir: `${ESTATICO}/video/terreno`, n: 84},    // contato: terreno em ondas (LOOP automático)
  dna:     {dir: `${ESTATICO}/video/dna`,     n: 68},    // palco "DNA da marca": hélice girando
  globo:   {dir: `${ESTATICO}/video/globo`,   n: 84},    // contato: globo girando (LOOP automático)
  hud:     {dir: `${ESTATICO}/video/hud`,     n: 84},    // Lab: painel HUD ao fundo
};

export const REDUZ = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* atalhos de teste pela URL: ?esf=0.5&cab=0.3&ter=0.6&plus=0.2  e  #y=2400 */
export const Q = new URLSearchParams(location.search);
