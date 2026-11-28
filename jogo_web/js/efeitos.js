/* Efeitos em voxel, feitos no projeto: sangue, poeira, faísca, fumaça e lascas. Tudo é cubinho.
   Não desenha nada sozinho: quem desenha passa uma função cubo(p, giro, tamanho, cor, emite, alfa).
   Mundo: Y para cima; o chão fica em y = 0. Carregado por tiro.html antes de estande.js.
   Serve de referência para refazer no Unity: cada efeito é uma lista curta de partículas. */
const Efeitos = (() => {
  const MAX_PARTICULAS = 420, MAX_MANCHAS = 150, DURA_MANCHA = 40;
  const particulas = [], manchas = [];
  let contador = 0;

  const entre = (a, b) => a + Math.random() * (b - a);
  const sorteia = l => l[Math.floor(Math.random() * l.length)];
  const soma = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vez = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const unit = a => vez(a, 1 / (Math.hypot(...a) || 1));
  const espalha = k => [entre(-k, k), entre(-k, k), entre(-k, k)];

  /* armas que soltam faísca quando batem em coisa dura (arma de fogo na coronhada também) */
  const METAL = new Set(['cano', 'pe_de_cabra', 'chave_roda', 'marreta', 'frigideira', 'pa', 'corrente', 'maca_engrenagem', 'facao', 'machadinha',
    'machado_placa', 'machado_bombeiro', 'foice', 'enxada', 'serrote', 'forcado', 'faca_combate', 'machadinha_tatica']);
  const ehMetal = (id, ficha) => METAL.has(id) || ficha?.tipo === 'tiro' && ficha.modo !== 'flecha';

  const CORES = {
    sangueZumbi:['#4A1613', '#5E1C16', '#33100F', '#44301C'],
    sangue:['#8E1B16', '#A8231B', '#6E120F'],
    poeira:['#8A7C5E', '#76694E', '#A39678', '#665B45'],
    faisca:['#FFF2B8', '#FFD23A', '#FF9A2A'],
    fumaca:['#D8D6D0', '#BDBBB5', '#A6A49E'],
  };

  /* uma partícula: voa, pode esperar antes de aparecer e muda de tamanho de s até s*fim */
  function nova(d){
    particulas.push({v:[0, 0, 0], grav:0, arrasto:0, s:.03, fim:1, emite:0, alfa:1, espera:0, chao:'para', risco:0, ...d, dura:d.vida});
    if (particulas.length > MAX_PARTICULAS) particulas.splice(0, particulas.length - MAX_PARTICULAS);
  }
  /* um quadradinho no chão; cada um numa altura um pouco diferente, para a textura não piscar */
  function mancha(x, z, lado, cor, espera = 0, fundo = lado){
    const y = .004 + (contador++ % 80) * .00011;
    manchas.push({p:[x, y, z], s:[lado, .006, fundo], cor, vida:DURA_MANCHA, espera});
    if (manchas.length > MAX_MANCHAS) manchas.shift();
  }

  /* ---------------------------------------------------------------- sangue */
  /* p = onde acertou; dir = para onde os pingos saltam; forca 1 = pancada comum; dono: 'zumbi' ou 'vivo' */
  function sangue(p, dir, forca = 1, dono = 'zumbi', miudo = 1, espera = 0){
    const cores = CORES[dono === 'zumbi' ? 'sangueZumbi' : 'sangue'], d = unit(dir), n = Math.round(16 * forca);
    for (let i = 0; i < n; i++){
      const solto = i % 4 === 0;                                   /* alguns pingos ficam para trás, perto da ferida */
      const v = soma(vez(d, (solto ? .3 : entre(1, 2.6)) * miudo), soma(espalha(.7 * miudo), [0, entre(.2, 1.4) * miudo, 0]));
      nova({p:soma(p, espalha(.025 * miudo)), v, grav:7.5, arrasto:.8, vida:entre(.5, 1.1), s:entre(.024, .055) * miudo, fim:.7, cor:sorteia(cores), chao:'mancha', espera});
    }
  }
  /* poça que cresce embaixo do corpo, em ladrilhos que se encostam */
  function poca(p, dono = 'zumbi', quantos = 11){
    const cores = CORES[dono === 'zumbi' ? 'sangueZumbi' : 'sangue'], L = .085, cor = cores[0];
    const vizinhos = [[0,0],[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1],[2,0],[0,2],[-2,0],[0,-2],[2,1],[1,2],[-2,-1]];
    const gx = Math.round(p[0] / L) * L, gz = Math.round(p[2] / L) * L;
    vizinhos.slice(0, quantos).forEach(([a, b], i) => mancha(gx + a * L, gz + b * L, L, i % 5 === 3 ? cores[1] : cor, .35 + i * .16));
  }

  /* ---------------------------------------------------------------- poeira */
  /* queda de um corpo ou pisão: anel baixo que se abre e some */
  function queda(p, forca = 1, espera = 0){
    const n = Math.round(18 * forca);
    for (let i = 0; i < n; i++){
      const a = i / n * Math.PI * 2 + entre(-.2, .2), r = entre(.25, .55), v = entre(.9, 2.1) * (.6 + forca * .4);
      nova({p:[p[0] + Math.cos(a) * r, entre(.03, .1), p[2] + Math.sin(a) * r], v:[Math.cos(a) * v, entre(.15, .8), Math.sin(a) * v], grav:.9, arrasto:3.4,
        vida:entre(.6, 1.2), s:entre(.07, .135) * (.7 + forca * .3), fim:1.6, cor:sorteia(CORES.poeira), alfa:.82, espera});
    }
    for (let i = 0; i < 6 * forca; i++) nova({p:[p[0] + entre(-.3, .3), .03, p[2] + entre(-.3, .3)], v:[entre(-.8, .8), entre(.9, 2), entre(-.8, .8)], grav:7, vida:entre(.35, .7), s:entre(.014, .028), cor:'#6F6756', chao:'quica', espera});
  }

  /* ---------------------------------------------------------------- faísca */
  /* metal batendo em coisa dura: risquinhos que brilham; n = para fora da superfície */
  function faisca(p, n, forca = 1){
    const d = unit(n);
    for (let i = 0; i < Math.round(18 * forca); i++)
      nova({p:soma(p, espalha(.04)), v:soma(vez(d, entre(1.2, 3.4)), soma(espalha(2.3), [0, entre(.2, 1.6), 0])), grav:6.5, arrasto:1.2, vida:entre(.18, .48), s:entre(.012, .022), fim:.5, cor:sorteia(CORES.faisca), emite:1, chao:'quica', risco:.045});
    nova({p:soma(p, vez(d, .03)), vida:.09, s:.13 * forca, fim:.35, cor:CORES.faisca[0], emite:1});
  }

  /* ---------------------------------------------------------------- tiro */
  /* fumaça da boca do cano: cubos claros que sobem, crescem e ficam transparentes */
  function fumaca(p, dir, forca = 1, miudo = 1){
    const d = unit(dir);
    for (let i = 0; i < Math.round(9 * forca); i++)
      nova({p:soma(p, soma(vez(d, i * .03 * miudo), espalha(.02 * miudo))), v:soma(vez(d, entre(.25, 1.1) * miudo), [entre(-.14, .14), entre(.16, .42), entre(-.14, .14)]), grav:-.12, arrasto:2.6,
        vida:entre(.55, 1.2), s:entre(.035, .065) * miudo, fim:2.6, cor:sorteia(CORES.fumaca), alfa:.55, espera:i * .012});
    for (let i = 0; i < 3 * forca; i++) nova({p:p.slice(), v:soma(vez(d, entre(3, 6) * miudo), espalha(.8 * miudo)), grav:3, vida:entre(.05, .13), s:.008 * miudo, cor:sorteia(CORES.faisca), emite:1, risco:.03});
  }
  /* o tiro (ou a pancada) numa superfície: lascas que pulam e um sopro de pó */
  function impacto(p, n, cor = '#C2B59C', forca = 1){
    const d = unit(n);
    for (let i = 0; i < Math.round(9 * forca); i++)
      nova({p:soma(p, vez(d, .015)), v:soma(vez(d, entre(.8, 2.4)), soma(espalha(1), [0, entre(0, 1), 0])), grav:7, arrasto:.6, vida:entre(.35, .9), s:entre(.014, .034), cor, chao:'quica'});
    for (let i = 0; i < Math.round(5 * forca); i++)
      nova({p:soma(p, vez(d, .04)), v:soma(vez(d, entre(.3, 1)), espalha(.25)), grav:-.1, arrasto:3, vida:entre(.35, .7), s:entre(.03, .055), fim:2.1, cor, alfa:.45});
  }

  /* ---------------------------------------------------------------- o tempo */
  function passo(dt){
    for (let i = particulas.length - 1; i >= 0; i--){
      const s = particulas[i];
      if (s.espera > 0){ s.espera -= dt; continue; }
      s.vida -= dt;
      if (s.vida <= 0){ particulas.splice(i, 1); continue; }
      s.v[1] -= s.grav * dt;
      if (s.arrasto){ const k = Math.exp(-s.arrasto * dt); s.v = vez(s.v, k); }
      s.p = soma(s.p, vez(s.v, dt));
      if (s.p[1] < .012){
        if (s.chao === 'mancha'){                                  /* o pingo vira um quadradinho no chão */
          if (Math.random() < .7) mancha(s.p[0], s.p[2], s.s * entre(1.1, 2.2), s.cor, 0, s.s * entre(1.1, 2.2));
          particulas.splice(i, 1); continue;
        }
        s.p[1] = .012;
        if (s.chao === 'quica' && s.v[1] < -.6) s.v = [s.v[0] * .5, -s.v[1] * .35, s.v[2] * .5]; else s.v = [s.v[0] * .6, 0, s.v[2] * .6];
      }
    }
    for (let i = manchas.length - 1; i >= 0; i--){
      const s = manchas[i];
      if (s.espera > 0) s.espera -= dt; else if ((s.vida -= dt) <= 0) manchas.splice(i, 1);
    }
  }

  /* giro que aponta o eixo Z para a direção v (só para os risquinhos das faíscas) */
  function apontar(v){
    const u = unit(v), w = 1 + u[2];
    if (w < 1e-5) return [1, 0, 0, 0];
    const t = Math.hypot(u[1], u[0], w); return [-u[1] / t, u[0] / t, 0, w / t];
  }
  const RETO = [0, 0, 0, 1];
  /* transparentes = false desenha os sólidos; true desenha fumaça e pó, que vêm depois */
  function desenhar(cubo, transparentes){
    if (!transparentes) for (const s of manchas){
      if (s.espera > 0) continue;
      const k = Math.min(1, s.vida / 5);                           /* no fim a mancha encolhe até sumir */
      cubo(s.p, RETO, [s.s[0] * k, s.s[1], s.s[2] * k], s.cor, 0, 1);
    }
    for (const s of particulas){
      if (s.espera > 0 || (s.alfa < 1) !== transparentes) continue;
      const usado = 1 - s.vida / s.dura, tam = s.s * (1 + (s.fim - 1) * usado);
      const alfa = s.alfa < 1 ? s.alfa * Math.min(1, s.vida / s.dura * 1.8) : 1;
      if (s.risco) cubo(s.p, apontar(s.v), [tam, tam, tam + Math.hypot(...s.v) * s.risco * .35], s.cor, s.emite, alfa);
      else cubo(s.p, RETO, [tam, tam, tam], s.cor, s.emite, alfa);
    }
  }

  return {ehMetal, sangue, poca, queda, faisca, fumaca, impacto, passo, desenhar,
    limpar:() => { particulas.length = 0; manchas.length = 0; },
    contar:() => ({particulas:particulas.length, manchas:manchas.length})};
})();
