/* Cena: coordena os fundos animados (Plus, HUD) e os loops (terreno, globo) junto com os palcos. */
import { Q, REDUZ, SEQ } from './config.js';
import { pintarLoop } from './loop.js';
import { Seq, quandoPerto } from './sequencia.js';
import { clamp, dimensionar, emTela, pintar } from './utils.js';

export class Cena {
  constructor() {
    const $ = id => document.getElementById(id);
    /* sequências de quadros */
    this.seqs = Object.fromEntries(Object.entries(SEQ).map(([nome, cfg]) => [nome, new Seq(cfg)]));
    /* elementos */
    this.cvPlus = $('bgPlus'); this.cvTer = $('terreno'); this.cvHud = $('hud'); this.cvGlo = $('globo');
    this.contato = $('contato'); this.lab = $('lab');
    this.palcos = [];
    /* estado: valor suavizado, alvo (do scroll) e último quadro desenhado de cada efeito */
    this.est = {plus: 0, aPlus: 0, iP: -1, ter: 0, aTer: 0, iT: -1, hud: 0, aHud: 0, iH: -1, glo: 0, aGlo: 0, iG: -1};
    const e = this.est;
    this.seqs.plus.cb = () => { e.iP = -1; };
    this.seqs.terreno.cb = () => { e.iT = -1; };
    this.seqs.hud.cb = () => { e.iH = -1; };
    this.seqs.globo.cb = () => { e.iG = -1; };
  }

  /* lê a posição do scroll e define para onde cada efeito deve ir */
  alvos = () => {
    const e = this.est, max = document.documentElement.scrollHeight - innerHeight;
    e.aPlus = max > 0 ? scrollY / max : 0;
    if (Q.has('plus')) e.aPlus = clamp(+Q.get('plus'));
    this.palcos.forEach(p => p.alvoScroll());
    const r = this.contato.getBoundingClientRect();
    e.aTer = clamp((innerHeight - r.top) / (innerHeight + r.height));
    if (Q.has('ter')) e.aTer = clamp(+Q.get('ter'));
    const rl = this.lab.getBoundingClientRect();
    e.aHud = clamp((innerHeight - rl.top) / (innerHeight + rl.height));
    e.aGlo = e.aTer;
    if (Q.has('hud')) e.aHud = clamp(+Q.get('hud'));
    if (Q.has('glo')) e.aGlo = clamp(+Q.get('glo'));
    if (REDUZ) { e.aPlus = 0; e.aTer = .5; e.aHud = .5; e.aGlo = .5; }
  };

  medir = () => {
    dimensionar(this.cvPlus, innerWidth, innerHeight, 1.25);
    this.palcos.forEach(p => p.medir());
    const rt = this.cvTer.getBoundingClientRect(); dimensionar(this.cvTer, rt.width || 1200, rt.height || 220, 1.5);
    const rh = this.cvHud.getBoundingClientRect(); dimensionar(this.cvHud, rh.width || 1200, rh.height || 700, 1.25);
    const rg = this.cvGlo.getBoundingClientRect(); dimensionar(this.cvGlo, rg.width || 440, rg.height || 430, 2);
    Object.assign(this.est, {iP: -1, iT: -1, iH: -1, iG: -1});
    this.alvos();
  };

  tick = () => {
    const e = this.est, s = this.seqs, k = REDUZ ? 1 : .16;
    e.plus += (e.aPlus - e.plus) * k; e.ter += (e.aTer - e.ter) * k;
    e.hud += (e.aHud - e.hud) * k; e.glo += (e.aGlo - e.glo) * k;
    const iP = s.plus.indice(e.plus);
    if (iP !== e.iP) { e.iP = iP; pintar(this.cvPlus, s.plus.quadro(iP), 'cover'); }
    const iH = s.hud.indice(e.hud);
    if (iH !== e.iH) { e.iH = iH; pintar(this.cvHud, s.hud.quadro(iH), 'cover'); }
    /* terreno e globo: loop automático (não dependem do scroll) */
    const agora = Q.has('t') ? +Q.get('t') : performance.now() / 1000;
    if (emTela(this.cvTer)) pintarLoop(this.cvTer, s.terreno, 'ter', REDUZ ? 0 : agora);
    if (emTela(this.cvGlo)) pintarLoop(this.cvGlo, s.globo, 'glo', REDUZ ? 0 : agora);
    this.palcos.forEach(p => p.passo(k));
    requestAnimationFrame(this.tick);
  };

  iniciar(palcos) {
    const s = this.seqs, $ = id => document.getElementById(id);
    this.palcos = palcos;
    addEventListener('scroll', this.alvos, {passive: true});
    addEventListener('resize', this.medir);
    this.medir();
    requestAnimationFrame(this.tick);
    addEventListener('load', () => {
      s.esfera.iniciar(); s.plus.iniciar();                          // o que aparece primeiro
      quandoPerto(s.cabeca, $('sobre')); quandoPerto(s.terreno, this.contato);
      quandoPerto(s.dna, $('dna')); quandoPerto(s.hud, this.lab); quandoPerto(s.globo, this.contato);
      if (/^#y=\d+/.test(location.hash)) { scrollTo(0, +location.hash.slice(3)); this.alvos(); }   // atalho de teste: /#y=2400
    });
  }
}
