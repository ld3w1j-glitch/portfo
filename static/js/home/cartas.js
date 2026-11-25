/* Cards que aparecem durante o scroll em cada palco. */
import { EL } from './config.js';
import { ARTE, CATS, PROJETOS } from './dados/projetos.js';
import { DNA, DNA_ETAPAS, ORDEM, SERV, SOBRE, SOBRE_ETAPAS } from './dados/servicos.js';
import { esc } from './utils.js';

const COR_CAPA = {design: '#F16A32', codigo: '#365CE6', imagem: '#F5F5EF'};
const COR_ICO = {design: 'grafite', codigo: 'offwhite', imagem: 'grafite'};

/* ponto da etapa (0–1) em que cada card aparece */
const limiares = n => Array.from({length: n}, (_, k) => .06 + k * (.6 / Math.max(1, n - 1)));

function iconeDoCard(d) {
  if (d.proj) {
    return `<span class="capinha" style="background:${COR_CAPA[d.cat]}"><img class="ic" src="${EL}icones/${ARTE[d.cat].ico}-${COR_ICO[d.cat]}.svg" alt=""></span>`;
  }
  if (d.cor) {
    const borda = d.cor === '#1A1A1A' ? 'box-shadow:inset 0 0 0 2px #F5F5EF' : '';
    return `<span class="capinha" style="background:${d.cor};${borda}"></span>`;
  }
  if (d.glifo) {
    const peso = d.fonte === 'Barlow Condensed' ? 'font-weight:900' : '';
    return `<span class="capinha" style="background:#262626"><span class="gl" style="font-family:'${d.fonte}',sans-serif;${peso}">${d.glifo}</span></span>`;
  }
  return `<img class="ic" src="${EL}icones/${d.ic}-offwhite.svg" alt="">`;
}

function textoDoCard(d) {
  if (d.proj) return {k: `${CATS[d.cat]} · ${d.proj.ano}`, t: esc(d.proj.titulo), d: esc(d.proj.desc)};
  return {k: d.k, t: d.t, d: d.d};
}

function montarCartas(palco, etapas) {
  etapas.forEach((defs, ei) => {
    const lim = limiares(defs.length);
    defs.slice(0, 4).forEach((d, k) => {
      const el = document.createElement('div');
      el.className = `mini cut-sm s${k}`;
      const tx = textoDoCard(d);
      el.innerHTML = `${iconeDoCard(d)}<div><div class="k">${tx.k}</div><div class="t">${tx.t}</div><div class="d">${tx.d}</div></div>`;
      palco.cartasEl.appendChild(el);
      palco.cartas.push({el, estagio: ei, lim: lim[k]});
    });
  });
}

export function montarTodasAsCartas([esfera, cabeca, dna]) {
  /* palco 1 (esfera): 3 cards de serviço + 1 projeto da categoria */
  montarCartas(esfera, ORDEM.map(cat => {
    const proj = PROJETOS.find(p => p.cat === cat);
    return [...SERV[cat].map(s => ({k: CATS[cat], t: s[0], d: s[1], ic: s[2]})), ...(proj ? [{proj, cat}] : [])];
  }));
  /* palco 2 (cabeça): 3 cards por etapa */
  montarCartas(cabeca, SOBRE.map((arr, i) => arr.map(s => ({k: SOBRE_ETAPAS[i], t: s[0], d: s[1], ic: s[2]}))));
  /* palco 3 (DNA da marca): paleta, tipografia e elementos */
  montarCartas(dna, DNA.map((arr, i) => arr.map(c => ({k: DNA_ETAPAS[i], ...c}))));
}
