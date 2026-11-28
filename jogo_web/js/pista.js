/* Pista de teste da locomoção (tela de animações).
   O personagem fica no meio e o chão corre por baixo dele; o rastro mostra o caminho feito
   e a seta laranja mostra para onde se está mandando ir. */
const Pista = (() => {
  const GRAUS = Math.PI / 180;
  /* cada trecho: [segundos, direção em graus ou null para parar, correndo] */
  const ROTEIROS = {
    misto:    {nome:'Passeio variado', trechos:[[2,0],[1.5,90],[1.5,180],[2,0],[1.4,null],[2,-90,true],[1.6,45,true],[1.6,-135,true],[1.2,null],[1.4,150],[1.4,60]]},
    meiavolta:{nome:'Meia-volta', trechos:[[2.2,0],[2.2,180]]},
    zigzag:   {nome:'Zigue-zague', trechos:[[1.2,50],[1.2,-50]]},
    quadrado: {nome:'Quadrado (curvas de 90°)', trechos:[[1.8,0],[1.8,90],[1.8,180],[1.8,-90]]},
    circulo:  {nome:'Círculo', livre:t => t * 1.15},
    paraanda: {nome:'Para e anda', trechos:[[1.8,0],[1.4,null],[1.8,135],[1.4,null],[1.8,-90],[1.4,null]]},
    manual:   {nome:'Eu controlo (WASD ou setas)'},
  };
  let roteiro = 'misto', e, antigo, x, z, t, rastro, quer = null, correndo = false;
  const teclas = new Set();

  function reiniciar(){
    e = Locomocao.novo(0); antigo = {rumo:0, fase:0, mexe:0, corre:0}; x = 0; z = 0; t = 0; rastro = []; quer = null;
  }
  function escolher(id){ roteiro = id; t = 0; }

  /* o que o "teclado" está pedindo neste instante. giro = para onde a câmera olha */
  function comando(giro, corridaMarcada){
    const R = ROTEIROS[roteiro];
    if (roteiro === 'manual'){
      const tem = (...k) => k.some(n => teclas.has(n));
      const frente = (tem('w', 'arrowup') ? 1 : 0) - (tem('s', 'arrowdown') ? 1 : 0), lado = (tem('d', 'arrowright') ? 1 : 0) - (tem('a', 'arrowleft') ? 1 : 0);
      const fx = -Math.sin(giro), fz = -Math.cos(giro);
      quer = frente || lado ? Math.atan2(fx * frente - fz * lado, fz * frente + fx * lado) : null;
      correndo = corridaMarcada || teclas.has('shift'); return;
    }
    if (R.livre){ quer = Locomocao.angulo(R.livre(t)); correndo = corridaMarcada; return; }
    let resto = t % R.trechos.reduce((s, p) => s + p[0], 0);
    for (const [dura, graus, corre] of R.trechos){
      if (resto < dura){ quer = graus === null ? null : graus * GRAUS; correndo = corridaMarcada || !!corre; return; }
      resto -= dura;
    }
  }

  /* o jeito de antes, para comparar: velocidade cheia na hora e o corpo só gira atrás do movimento */
  function comoEraAntes(dt){
    const A = Locomocao.AJUSTES, puxa = (v, alvo, ritmo) => v + (alvo - v) * Math.min(1, dt * ritmo), anda = quer !== null;
    antigo.mexe = puxa(antigo.mexe, anda ? 1 : 0, anda ? 9 : 7); antigo.corre = puxa(antigo.corre, anda && correndo ? 1 : 0, 5);
    if (!anda && antigo.mexe < .015) antigo.mexe = 0;
    if (anda){
      const vel = correndo ? A.correr : A.andar;
      x += Math.sin(quer) * vel * dt; z += Math.cos(quer) * vel * dt;
      antigo.rumo = Locomocao.angulo(antigo.rumo + Locomocao.angulo(quer - antigo.rumo) * Math.min(1, dt * 12));
      antigo.fase += vel * dt / (A.passadaAndar + (A.passadaCorrer - A.passadaAndar) * antigo.corre) * Math.PI * 2;
    } else antigo.fase += dt * 6 * antigo.mexe;
    /* o outro jeito acompanha, para trocar no meio sem pulo */
    e.rumo = antigo.rumo; e.fase = antigo.fase; e.vel = anda ? (correndo ? A.correr : A.andar) : 0;
  }

  /* adianta dt segundos e devolve {rot, rumo} */
  function passo(dt, opcoes, parado, arma, mods){
    t += dt; comando(opcoes.giro, opcoes.correr);
    let saida;
    if (opcoes.antes){
      comoEraAntes(dt);
      const p = antigo.mexe > 0 ? Animacao.passada(antigo.fase, antigo.corre, arma, mods) : parado;
      saida = {rot:antigo.mexe > .995 || antigo.mexe <= 0 ? p : Animacao.misturar(parado, p, antigo.mexe), rumo:antigo.rumo};
    } else {
      const m = Locomocao.avancar(e, dt, quer, correndo);
      x += m.dx; z += m.dz;
      Locomocao.assentarPasso(e, dt, Math.hypot(m.dx, m.dz), m.falta);
      antigo = {rumo:e.rumo, fase:e.fase, mexe:e.mexe, corre:e.corre};
      saida = {rot:Locomocao.pose(e, parado, arma, mods), rumo:e.rumo};
    }
    const ultimo = rastro[rastro.length - 1];
    if (!ultimo || Math.hypot(x - ultimo[0], z - ultimo[1]) > .22){ rastro.push([x, z]); if (rastro.length > 46) rastro.shift(); }
    return saida;
  }

  /* chão quadriculado, rastro e seta */
  function chao(){
    const q = [], N = [0, 1, 0], raio = 6;
    const placa = (pontos, y, cor) => q.push({v:pontos.map(p => [p[0], y, p[1]]), n:N, cor});
    const bx = Math.floor(x), bz = Math.floor(z);
    for (let i = -raio; i <= raio; i++) for (let k = -raio; k <= raio; k++){
      const x0 = bx + i - x, z0 = bz + k - z;
      if (Math.hypot(x0 + .5, z0 + .5) > raio) continue;
      placa([[x0, z0], [x0 + 1, z0], [x0 + 1, z0 + 1], [x0, z0 + 1]], -.006, (bx + i + bz + k) & 1 ? '#b9bcc2' : '#c6c9ce');
    }
    for (const [px, pz] of rastro){
      const a = px - x, b = pz - z, r = .028;
      if (Math.hypot(a, b) > .3) placa([[a - r, b - r], [a + r, b - r], [a + r, b + r], [a - r, b + r]], -.002, '#6b6f78');
    }
    if (quer !== null){
      const f = [Math.sin(quer), Math.cos(quer)], l = [f[1], -f[0]], p = (d, w) => [f[0] * d + l[0] * w, f[1] * d + l[1] * w];
      placa([p(.75, -.04), p(1.12, -.04), p(1.12, .04), p(.75, .04)], -.001, '#e8641e');
      placa([p(1.1, -.14), p(1.34, 0), p(1.34, 0), p(1.1, .14)], -.001, '#e8641e');
    }
    return q;
  }

  const solta = k => teclas.delete(k);
  function aperta(k){ if (k !== 'shift' && roteiro !== 'manual'){ escolher('manual'); return teclas.add(k), true; } teclas.add(k); return false; }
  reiniciar();
  return {ROTEIROS, reiniciar, escolher, passo, chao, aperta, solta, soltarTudo:() => teclas.clear(),
          roteiro:() => roteiro, estado:() => ({x, z, rumo:e.rumo, vel:e.vel, quer})};
})();
