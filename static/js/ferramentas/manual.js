/* Manual da marca: escala os quadros (1280 × 720) para caber na janela, navega entre páginas e imprime. */

const escala = document.getElementById('escala');
const irPara = document.getElementById('irPara');
const LARGURA = 1280;

/* zoom = largura disponível ÷ largura do quadro (nunca maior que 1) */
function ajustar() {
  const z = Math.min(1, (document.documentElement.clientWidth - 24) / LARGURA);
  escala.style.setProperty('--z', z.toFixed(4));
}

/* o <select> leva ao quadro escolhido; a página atual aparece no <select> ao rolar */
irPara.addEventListener('change', () => {
  const alvo = document.getElementById(irPara.value);
  if (alvo) alvo.scrollIntoView({behavior: 'smooth', block: 'start'});
});

const paginas = [...document.querySelectorAll('.pg')];
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => {
    const visivel = es.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visivel) irPara.value = visivel.target.id;
  }, {threshold: [.5, .75]});
  paginas.forEach(p => io.observe(p));
}

/* setas ← → pulam de página */
addEventListener('keydown', e => {
  if (e.target.matches('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  const i = paginas.findIndex(p => p.id === irPara.value);
  const destino = paginas[e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1];
  if (destino) { e.preventDefault(); destino.scrollIntoView({behavior: 'smooth', block: 'start'}); }
});

document.getElementById('imprimir').addEventListener('click', () => print());
addEventListener('resize', ajustar);
ajustar();
