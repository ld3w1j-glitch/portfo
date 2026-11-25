/* Sequência de quadros (um vídeo convertido em imagens). */
import { clamp } from './utils.js';

export class Seq {
  constructor({dir, n}) {
    this.dir = dir;
    this.n = n;
    this.f = new Array(n);     // quadros já carregados
    this.cb = null;            // chamado a cada quadro novo (força o redesenho)
    this.ini = false;
  }

  /* carrega primeiro o começo, o fim e o meio; depois o resto (a animação aparece cedo, com poucos quadros) */
  iniciar() {
    if (this.ini) return;
    this.ini = true;
    const n = this.n, meio = n >> 1, ordem = [0, n - 1, meio];
    for (let i = 1; i < n - 1; i++) if (i !== meio) ordem.push(i);
    let k = 0;
    const proximo = () => {
      if (k >= ordem.length) return;
      const i = ordem[k++], im = new Image();
      im.decoding = 'async';
      im.onload = () => { this.f[i] = im; if (this.cb) this.cb(); proximo(); };
      im.onerror = proximo;
      im.src = `${this.dir}/f${String(i + 1).padStart(4, '0')}.webp`;
    };
    for (let c = 0; c < 6; c++) proximo();      // 6 downloads em paralelo
  }

  indice(p) { return Math.round(clamp(p) * (this.n - 1)); }

  /* quadro mais próximo que já esteja carregado */
  quadro(i) {
    for (let d = 0; d < this.n; d++) {
      const a = this.f[i - d] || this.f[i + d];
      if (a) return a;
    }
    return null;
  }
}

/* só baixa os quadros quando a seção está perto da tela (evita carregar tudo de uma vez) */
export function quandoPerto(seq, el) {
  if (!('IntersectionObserver' in window)) { seq.iniciar(); return; }
  const io = new IntersectionObserver(es => {
    if (es.some(e => e.isIntersecting)) { seq.iniciar(); io.disconnect(); }
  }, {rootMargin: '1500px 0px'});
  io.observe(el);
}
