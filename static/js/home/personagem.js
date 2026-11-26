/* Seção "Personagem 3D": o boneco voxel gira (36 quadros) ou troca de pose, cercado pelas etiquetas do Reels.
   Poses e quadros vêm de producao/personagem-poses; para mudar textos ou etiquetas, edite MODOS. */
const QUADROS = 36;
const MODOS = {
  metodo: {
    pose: null,                                       // null = volta completa, que dá para arrastar
    desc: 'Do objetivo à entrega: o método que guia cada projeto. Arraste o personagem para girar.',
    etiquetas: [['board_objetivo', 'Objetivo'], ['board_plano', 'Plano'], ['board_execucao', 'Execução'], ['board_entrega', 'Entrega']],
  },
  design: {
    pose: 'apresentando',
    desc: 'Identidade visual: logo, cores e tipografia trabalhando juntos.',
    etiquetas: [['c3_logo', 'Logo'], ['c3_cores', 'Cores'], ['c3_tipografia', 'Tipografia'], ['c3_numero', '5 cores e 3 fontes']],
  },
  codigo: {
    pose: 'pensando',
    desc: 'Sistemas e sites: telas, dados e regras organizados sob medida.',
    etiquetas: [['c4_tela', 'Tela'], ['c4_dados', 'Dados'], ['c4_regra', 'Regra'], ['c4_sob_medida', 'Processo sob medida']],
  },
  imagem: {
    pose: 'acenando',
    desc: 'Peças e vídeos com a mesma identidade, em cada formato.',
    etiquetas: [['c5_post', 'Post'], ['c5_story', 'Story'], ['c5_video', 'Vídeo'], ['c5_numero', 'Post 4:5, 1080 por 1350']],
  },
};

export function iniciarPersonagem(){
  const palco = document.getElementById('p3dPalco');
  if (!palco) return;
  const base = palco.dataset.base;
  const img = document.getElementById('p3dImg'), boneco = document.getElementById('p3dBoneco');
  const lista = document.getElementById('p3dEtiquetas'), desc = document.getElementById('p3dDesc');
  const dica = document.getElementById('p3dDica');
  const botoes = [...document.querySelectorAll('.p3d-abas [data-modo]')];
  const parado = window.matchMedia('(prefers-reduced-motion: reduce)');
  const quadroUrl = k => `${base}giro/g${String(k).padStart(2, '0')}.webp`;

  let modo = 'metodo', quadro = 0, carregado = false, arrasto = null, visivel = false, pausaAte = 0, relogio = 0;

  const mostrarQuadro = k => { quadro = ((k % QUADROS) + QUADROS) % QUADROS; img.src = quadroUrl(quadro); };

  function etiquetas(){
    lista.replaceChildren(...MODOS[modo].etiquetas.map(([arquivo, texto], i) => {
      const li = document.createElement('li'), im = document.createElement('img');
      li.className = `p3d-et p3d-et${i + 1}`;
      li.style.setProperty('--i', i);
      im.src = `${base}etiquetas/${arquivo}.png`;
      im.alt = texto;
      li.append(im);
      return li;
    }));
  }

  function trocar(novo){
    modo = novo;
    const m = MODOS[modo];
    botoes.forEach(b => {
      const ativo = b.dataset.modo === modo;
      b.classList.toggle('ativo', ativo);
      b.setAttribute('aria-pressed', ativo);
    });
    desc.textContent = m.desc;
    palco.classList.toggle('gira', !m.pose);
    boneco.tabIndex = m.pose ? -1 : 0;
    dica.hidden = !!m.pose;
    if (m.pose) img.src = `${base}${m.pose}.webp`; else mostrarQuadro(0);
    etiquetas();
  }

  /* os 36 quadros só são baixados quando a seção está perto da tela */
  function carregar(){
    if (carregado) return;
    carregado = true;
    for (let k = 0; k < QUADROS; k++) new Image().src = quadroUrl(k);
  }
  new IntersectionObserver(([e]) => {
    visivel = e.isIntersecting;
    if (visivel) carregar();
    clearInterval(relogio);
    if (visivel) relogio = setInterval(() => {      // volta lenta quando ninguém está mexendo
      if (!MODOS[modo].pose && !arrasto && !parado.matches && !document.hidden && performance.now() > pausaAte) mostrarQuadro(quadro + 1);
    }, 140);
  }, {rootMargin: '300px'}).observe(palco);

  boneco.addEventListener('pointerdown', e => {
    if (MODOS[modo].pose) return;
    arrasto = {x: e.clientX, quadro};
    boneco.setPointerCapture(e.pointerId);
  });
  boneco.addEventListener('pointermove', e => {
    if (arrasto) mostrarQuadro(arrasto.quadro + Math.round((e.clientX - arrasto.x) / 9));
  });
  const soltar = () => { if (arrasto) pausaAte = performance.now() + 4000; arrasto = null; };
  boneco.addEventListener('pointerup', soltar);
  boneco.addEventListener('pointercancel', soltar);
  boneco.addEventListener('keydown', e => {
    if (MODOS[modo].pose || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    pausaAte = performance.now() + 6000;
    mostrarQuadro(quadro + (e.key === 'ArrowRight' ? 1 : -1));
  });
  botoes.forEach(b => b.addEventListener('click', () => trocar(b.dataset.modo)));
  trocar('metodo');
}
