/* Funções pequenas usadas em vários módulos. */

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/* escapa texto antes de colocar em innerHTML */
export const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

export const doisDigitos = n => String(n).padStart(2, '0');

export const emTela = el => {
  const r = el.getBoundingClientRect();
  return r.bottom > -50 && r.top < innerHeight + 50;
};

/* ajusta a resolução interna do canvas (limita o devicePixelRatio para poupar memória) */
export function dimensionar(cv, w, h, dprMax) {
  const d = Math.min(window.devicePixelRatio || 1, dprMax);
  cv.width = Math.max(1, Math.round(w * d));
  cv.height = Math.max(1, Math.round(h * d));
}

/* desenha uma imagem centralizada: 'cover' preenche, 'contain' mostra inteira */
export function pintar(cv, im, modo) {
  const c = cv.getContext('2d');
  c.clearRect(0, 0, cv.width, cv.height);
  if (!im) return;
  const s = (modo === 'cover' ? Math.max : Math.min)(cv.width / im.naturalWidth, cv.height / im.naturalHeight);
  const w = im.naturalWidth * s, h = im.naturalHeight * s;
  c.drawImage(im, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
}
