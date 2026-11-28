/* Portfólio: monta a grade de projetos e os filtros por categoria. */
import { EL } from './config.js';
import { ARTE, CATS, PROJETOS } from './dados/projetos.js';
import { doisDigitos, esc } from './utils.js';

function capaDoProjeto(p) {
  if (p.img) {
    return `<img src="${esc(p.img)}" alt="${esc(p.titulo)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`;
  }
  const a = ARTE[p.cat];
  return `<img class="deco" src="${EL}padroes/${a.padrao}-${a.cor}.svg" alt="">
       <div class="cantos"></div>
       <img class="ico" src="${EL}icones/${a.ico}-${a.cor}.svg" alt="">`;
}

function cartaoDoProjeto(p, i) {
  const tag = p.link ? 'a' : 'div';
  /* endereços do próprio site abrem na mesma aba; os de fora, em aba nova */
  const fora = p.link && /^https?:/.test(p.link) ? ' target="_blank" rel="noopener"' : '';
  const href = p.link ? ` href="${esc(p.link)}"${fora}` : '';
  return `<${tag}${href} class="card projeto cut ${p.destaque ? 'destaque' : ''}" data-cat="${p.cat}">
    <div class="capa ${p.cat}">${capaDoProjeto(p)}<span class="num">${doisDigitos(i + 1)}</span></div>
    <div class="info">
      <div class="meta"><span class="rotulo">${CATS[p.cat]} · ${p.ano}</span><span class="seta">→</span></div>
      <h3 class="display h-md">${esc(p.titulo)}</h3>
      <p>${esc(p.desc)}</p>
    </div></${tag}>`;
}

/* aoFiltrar: chamado depois de filtrar (a altura da página muda, então o scroll precisa ser recalculado) */
export function iniciarProjetos(aoFiltrar) {
  const grade = document.getElementById('grade'), filtros = document.getElementById('filtros');
  grade.innerHTML = PROJETOS.map(cartaoDoProjeto).join('');
  filtros.innerHTML = Object.entries(CATS)
    .map(([k, v], i) => `<button class="tag ${i ? '' : 'ativo'}" data-f="${k}">${v}</button>`).join('');
  filtros.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    filtros.querySelectorAll('button').forEach(x => x.classList.toggle('ativo', x === b));
    grade.querySelectorAll('.projeto').forEach(c => {
      c.classList.toggle('oculto', b.dataset.f !== 'todos' && c.dataset.cat !== b.dataset.f);
    });
    aoFiltrar();
  });
  document.getElementById('nProj').textContent = doisDigitos(PROJETOS.length);
}
