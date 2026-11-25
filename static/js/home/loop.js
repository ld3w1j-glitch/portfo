/* Animação em loop (terreno e globo).
   Os quadros foram extraídos de vídeos de 25 fps (1 a cada N). Aqui tocamos no ritmo natural,
   misturando quadros vizinhos (suave) e dissolvendo o fim no começo (emenda invisível). */

const FPS = {ter: 25 / 6, glo: 25 / 3};      // fps efetivo dos quadros (25 fps ÷ passo da extração)
const MIST = {ter: 6, glo: 14};              // quadros usados na dissolução da emenda

function desenhar(c, cv, im, alfa) {
  if (!im || alfa <= 0) return;
  const k = Math.min(cv.width / im.naturalWidth, cv.height / im.naturalHeight);
  const w = im.naturalWidth * k, h = im.naturalHeight * k;
  c.globalAlpha = alfa;
  c.drawImage(im, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
  c.globalAlpha = 1;
}

/* nome: 'ter' (terreno) ou 'glo' (globo); tempo em segundos */
export function pintarLoop(cv, seq, nome, tempo) {
  const n = seq.n, K = MIST[nome], Z = n - K;
  const p = K + ((tempo * FPS[nome]) % Z);                       // posição (em quadros) dentro do laço
  const c = cv.getContext('2d');
  c.clearRect(0, 0, cv.width, cv.height);
  c.globalCompositeOperation = 'lighter';
  const camada = (pos, alfa) => {
    const i = Math.floor(pos), f = pos - i;
    desenhar(c, cv, seq.quadro(i), alfa * (1 - f));
    if (i + 1 < n) desenhar(c, cv, seq.quadro(i + 1), alfa * f);
  };
  if (p >= Z) { const w = (p - Z) / K; camada(p, 1 - w); camada(p - Z, w); } else camada(p, 1);
  c.globalCompositeOperation = 'source-over';
}
