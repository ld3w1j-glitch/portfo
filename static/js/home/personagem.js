/* Seção "Personagem 3D": o boneco voxel gira (72 quadros) ou troca de pose, cercado pelas etiquetas do Reels.
   Poses e quadros vêm de producao/personagem-poses; para mudar textos ou etiquetas, edite MODOS. */
const QUADROS = 72;
const VOLTA_EM = 14;            // segundos de uma volta completa quando ninguém está mexendo
const PIXELS_POR_QUADRO = 4.5;  // quanto arrastar para andar um quadro
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
  const quadroUrl = k => `${base}giro72/g${String(k).padStart(2, '0')}.webp`;

  let modo = 'metodo', visivel = false, pausaAte = 0, arrasto = null, carregado = false;
  let angulo = 0, embalo = 0, forca = 0, pedido = 0, anterior = 0;     // angulo em quadros, com fração
  const quadros = [];

  /* o giro é desenhado numa tela: troca contínua, sem piscar, misturando o quadro atual com o seguinte */
  const tela = document.createElement('canvas');
  tela.className = 'p3d-tela';
  tela.hidden = true;
  tela.setAttribute('aria-hidden', 'true');
  boneco.append(tela);
  const g = tela.getContext('2d');
  const volta = k => ((k % QUADROS) + QUADROS) % QUADROS;

  function desenhar(){
    const i = Math.floor(angulo), a1 = quadros[volta(i)], a2 = quadros[volta(i + 1)];
    if (!a1 || !a1.complete || !a1.naturalWidth) return false;
    if (tela.width !== a1.naturalWidth || tela.height !== a1.naturalHeight){ tela.width = a1.naturalWidth; tela.height = a1.naturalHeight; }
    const t = angulo - i;
    /* soma ponderada dos dois quadros: a silhueta não fica mais clara nem mais escura no meio do caminho */
    g.clearRect(0, 0, tela.width, tela.height);
    g.globalCompositeOperation = 'lighter';
    const pronto2 = a2 && a2.complete && a2.naturalWidth;
    g.globalAlpha = pronto2 ? 1 - t : 1; g.drawImage(a1, 0, 0);
    if (pronto2){ g.globalAlpha = t; g.drawImage(a2, 0, 0); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    return true;
  }
  function mostrarTela(sim){ tela.hidden = !sim; img.style.display = sim ? 'none' : ''; }

  function passo(agora){
    pedido = 0;
    const dt = anterior ? Math.min(.05, (agora - anterior) / 1000) : .016;
    anterior = agora;
    if (!MODOS[modo].pose){
      if (!arrasto){
        if (Math.abs(embalo) > .4){ angulo += embalo * dt; embalo *= Math.exp(-3.2 * dt); }      // continua e vai parando
        else embalo = 0;
        const sozinho = !embalo && !parado.matches && agora > pausaAte;
        forca += ((sozinho ? 1 : 0) - forca) * Math.min(1, dt * 2.2);                            // volta a girar aos poucos
        angulo += forca * (QUADROS / VOLTA_EM) * dt;
      } else forca = 0;
      if (desenhar()) mostrarTela(true);
    }
    agendar();
  }
  const agendar = () => { if (!pedido && visivel && !MODOS[modo].pose && !document.hidden) pedido = requestAnimationFrame(passo); };
  const retomar = () => { anterior = 0; agendar(); };

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
    /* troca de pose com um esmaecimento curto, em vez de um salto */
    boneco.classList.remove('entra'); void boneco.offsetWidth; boneco.classList.add('entra');
    if (m.pose){ mostrarTela(false); img.src = `${base}${m.pose}.webp`; }
    else { angulo = 0; embalo = 0; forca = 0; img.src = quadroUrl(0); mostrarTela(desenhar()); retomar(); }
    etiquetas();
  }

  /* os quadros só são baixados quando a seção está perto da tela */
  function carregar(){
    if (carregado) return;
    carregado = true;
    for (let k = 0; k < QUADROS; k++){ const q = new Image(); q.src = quadroUrl(k); quadros[k] = q; }
  }
  new IntersectionObserver(([e]) => {
    visivel = e.isIntersecting;
    if (visivel){ carregar(); retomar(); }
  }, {rootMargin: '300px'}).observe(palco);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) retomar(); });

  boneco.addEventListener('pointerdown', e => {
    if (MODOS[modo].pose) return;
    arrasto = {x: e.clientX, angulo, ultimoX: e.clientX, quando: performance.now()};
    embalo = 0;
    boneco.setPointerCapture(e.pointerId);
  });
  boneco.addEventListener('pointermove', e => {
    if (!arrasto) return;
    angulo = arrasto.angulo + (e.clientX - arrasto.x) / PIXELS_POR_QUADRO;
    const agora = performance.now(), dt = (agora - arrasto.quando) / 1000;
    if (dt > .012){                                                   // velocidade do dedo, suavizada
      embalo = embalo * .5 + .5 * ((e.clientX - arrasto.ultimoX) / PIXELS_POR_QUADRO) / dt;
      arrasto.ultimoX = e.clientX; arrasto.quando = agora;
    }
    desenhar();
  });
  const soltar = () => {
    if (!arrasto) return;
    if (performance.now() - arrasto.quando > 90 || parado.matches) embalo = 0;
    embalo = Math.max(-70, Math.min(70, embalo));
    pausaAte = performance.now() + 3500; arrasto = null;
  };
  boneco.addEventListener('pointerup', soltar);
  boneco.addEventListener('pointercancel', soltar);
  boneco.addEventListener('keydown', e => {
    if (MODOS[modo].pose || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    pausaAte = performance.now() + 6000;
    embalo = (e.key === 'ArrowRight' ? 1 : -1) * 14;                 // um empurrãozinho, cerca de 4 quadros
    retomar();
  });
  botoes.forEach(b => b.addEventListener('click', () => trocar(b.dataset.modo)));
  trocar('metodo');
}
