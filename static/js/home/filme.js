/* Filme de apresentação: player com abas (16:9 / 9:16) e capítulos clicáveis. */
import { FILMES } from './dados/filme.js';

const mmss = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export function iniciarFilme() {
  const $ = id => document.getElementById(id);
  const video = $('filmeVid'), tela = $('tela'), ligar = $('ligar'), capsEl = $('caps'), abas = $('abas');
  let atual = 'h';

  function carregar(chave) {
    atual = chave;
    const f = FILMES[chave];
    video.pause();
    video.preload = 'none';
    video.poster = f.poster;
    video.src = f.src;
    tela.classList.toggle('v', f.vertical);
    tela.classList.remove('tocando');
    abas.querySelectorAll('button').forEach(b => b.classList.toggle('ativo', b.dataset.f === chave));
    capsEl.innerHTML = f.caps
      .map((c, i) => `<li><button data-t="${c[0]}" data-i="${i}"><small>${mmss(c[0])}</small>${c[1]}</button></li>`).join('');
  }

  /* pula para o capítulo (se o vídeo ainda não carregou, carrega e depois pula) */
  function irPara(t) {
    const ir = () => { video.currentTime = t; video.play(); };
    if (video.readyState >= 1) ir();
    else { video.preload = 'auto'; video.addEventListener('loadedmetadata', ir, {once: true}); video.load(); }
  }

  abas.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b && b.dataset.f !== atual) carregar(b.dataset.f);
  });
  capsEl.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) irPara(+b.dataset.t);
  });
  ligar.addEventListener('click', () => video.play());
  video.addEventListener('play', () => tela.classList.add('tocando'));
  video.addEventListener('pause', () => { if (video.currentTime === 0 || video.ended) tela.classList.remove('tocando'); });
  video.addEventListener('ended', () => tela.classList.remove('tocando'));
  video.addEventListener('timeupdate', () => {
    let ativo = 0;
    FILMES[atual].caps.forEach((c, i) => { if (video.currentTime >= c[0] - 0.05) ativo = i; });
    capsEl.querySelectorAll('button').forEach((b, i) => b.classList.toggle('ativo', i === ativo && !video.paused));
  });

  carregar('h');
}
