/* Palco: seção "pinada" em que o scroll controla o vídeo, o texto e os cards. */
import { Q, REDUZ } from './config.js';
import { clamp, dimensionar, doisDigitos, pintar } from './utils.js';

export class Palco {
  /* cfg: ids dos elementos (sec, cv, lista, cont, barra, dica, cartas), seq, param (atalho de teste) e fx (transformação do canvas) */
  constructor(cfg) {
    const $ = id => document.getElementById(id);
    this.sec = $(cfg.sec);
    this.cv = $(cfg.cv);
    this.seq = cfg.seq;
    this.itens = [...document.querySelectorAll(`#${cfg.lista} li`)];
    this.cont = $(cfg.cont);
    this.barra = $(cfg.barra);
    this.dica = $(cfg.dica);
    this.cartasEl = $(cfg.cartas);
    this.cartas = [];
    this.param = cfg.param;
    this.fx = cfg.fx;
    this.v = 0;          // posição suavizada (0–1)
    this.alvo = 0;       // posição pedida pelo scroll (0–1)
    this.i = -1;         // quadro desenhado
    this.ativo = -1;     // etapa de texto ativa
    this.seq.cb = () => { this.i = -1; };
  }

  medir() {
    const r = this.cv.getBoundingClientRect();
    dimensionar(this.cv, r.width || 600, r.height || 600, 2);
    this.i = -1;
  }

  alvoScroll() {
    const r = this.sec.getBoundingClientRect(), span = r.height - (innerHeight - 68);
    this.alvo = span > 0 ? clamp(-r.top / span) : 0;
    if (Q.has(this.param)) this.alvo = clamp(+Q.get(this.param));
    if (REDUZ) this.alvo = .5;
  }

  texto(p) {
    const n = this.itens.length, idx = Math.min(n - 1, Math.floor(p * n));
    if (idx !== this.ativo) {
      this.ativo = idx;
      this.itens.forEach((li, i) => li.classList.toggle('ativo', i === idx));
      this.cont.textContent = `${doisDigitos(idx + 1)} / ${doisDigitos(n)}`;
    }
    this.barra.style.width = (p * 100).toFixed(1) + '%';
    this.dica.style.opacity = p > .04 ? 0 : 1;
    /* cards: cada etapa ocupa 1/n do scroll e os cards entram um a um dentro dela */
    const sp = clamp(p * n - idx);
    this.cartas.forEach(c => {
      const on = c.estagio === idx && sp >= c.lim;
      if (on !== c.on) { c.on = on; c.el.classList.toggle('on', on); }
    });
  }

  passo(k) {
    this.v += (this.alvo - this.v) * k;
    const i = this.seq.indice(this.v);
    if (i !== this.i) { this.i = i; pintar(this.cv, this.seq.quadro(i), 'contain'); }
    this.cv.style.transform = this.fx(this.v);
    this.texto(this.alvo);
  }
}

/* os três palcos da página: esfera (Três frentes), cabeça (Sobre) e hélice (DNA) */
export function criarPalcos({esf, cab, dna}) {
  const fx = (dy, base, ganho) => v => `translate3d(0,${((.5 - v) * dy).toFixed(1)}px,0) scale(${(base + v * ganho).toFixed(3)})`;
  return [
    new Palco({sec: 'movimento', cv: 'esfera', seq: esf, lista: 'lista',  cont: 'cont',  barra: 'barra',  dica: 'dica',  cartas: 'cartas',  param: 'esf', fx: fx(50, .92, .08)}),
    new Palco({sec: 'sobre',     cv: 'cabeca', seq: cab, lista: 'lista2', cont: 'cont2', barra: 'barra2', dica: 'dica2', cartas: 'cartas2', param: 'cab', fx: fx(30, .95, .05)}),
    new Palco({sec: 'dna',       cv: 'dnacv',  seq: dna, lista: 'lista3', cont: 'cont3', barra: 'barra3', dica: 'dica3', cartas: 'cartas3', param: 'dna', fx: fx(24, .94, .06)}),
  ];
}
