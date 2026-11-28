/* Locomoção: o que faz o personagem mudar de direção sem parecer duro.
   O teclado só diz para onde se QUER ir; quem se move é um corpo com peso:
   - arranca e freia aos poucos (inércia);
   - gira com uma mola amortecida, e anda sempre para onde o corpo aponta (não "escorrega de lado");
   - em curva fechada ou meia-volta, freia, gira dando passinhos e arranca de novo;
   - a cabeça olha primeiro, o tronco acompanha, o corpo inclina na curva e ao arrancar/frear;
   - o compasso das pernas vem da distância andada de verdade.
   Os mesmos números servem de referência para refazer isto no Unity. Carregado depois de maos.js. */
const Locomocao = (() => {
  const AJUSTES = {
    andar:2.1, correr:5.4,                 /* m/s */
    arranque:7, freio:10,                  /* m/s² */
    molaGiro:75, amortece:17,              /* mola do giro: quanto puxa e quanto segura */
    giroMaximo:10,                         /* rad/s */
    passadaAndar:1.45, passadaCorrer:2.5,  /* metros por ciclo completo (dois passos) */
    inclinaCurva:.024, inclinaMaxima:.17,
    inclinaArranque:.016,
  };
  const dois = Math.PI * 2;
  const preso = (v, a, b) => Math.max(a, Math.min(b, v));
  const angulo = a => ((a + Math.PI) % dois + dois) % dois - Math.PI;     /* entre -180° e 180° */
  const puxa = (v, alvo, ritmo, dt) => v + (alvo - v) * (1 - Math.exp(-ritmo * dt));
  const suave = x => { const t = preso(x, 0, 1); return t * t * (3 - 2 * t); };

  function novo(rumo = 0){
    return {rumo, velAng:0, vel:0, acel:0, fase:0, mexe:0, corre:0, passinho:0, olhar:0, inclina:0, tomba:0, tempo:0};
  }

  /* adianta o estado em dt segundos. quer = direção desejada (radianos, 0 = +Z) ou null; correndo = shift.
     Devolve quanto andar: {dx, dz}. Depois da colisão, chame assentarPasso com a distância que andou de fato. */
  function avancar(e, dt, quer, correndo){
    const A = AJUSTES, falta = quer === null ? 0 : angulo(quer - e.rumo);
    /* giro: mola amortecida, com teto de velocidade (em passos curtos, para ficar igual em qualquer computador) */
    const partes = Math.max(1, Math.ceil(dt / .008)), h = dt / partes;
    for (let i = 0; i < partes; i++){
      const f = quer === null ? 0 : angulo(quer - e.rumo);
      e.velAng += (A.molaGiro * f - A.amortece * e.velAng) * h;
      e.velAng = preso(e.velAng, -A.giroMaximo, A.giroMaximo);
      e.rumo = angulo(e.rumo + e.velAng * h);
    }
    /* velocidade: quanto mais o corpo está virado para longe do que se quer, menos ele avança */
    const alinhado = quer === null ? 0 : suave((Math.cos(falta) + .15) / 1.15);
    const meta = (correndo ? A.correr : A.andar) * alinhado, antes = e.vel;
    const limite = (meta > e.vel ? A.arranque : A.freio) * dt;
    e.vel += preso(meta - e.vel, -limite, limite);
    e.acel = puxa(e.acel, dt > 0 ? (e.vel - antes) / dt : 0, 12, dt);
    return {dx:Math.sin(e.rumo) * e.vel * dt, dz:Math.cos(e.rumo) * e.vel * dt, falta};
  }

  /* atualiza as pernas e a postura. andou = metros percorridos de verdade (menor se bateu numa parede) */
  function assentarPasso(e, dt, andou, falta){
    const A = AJUSTES, real = dt > 0 ? andou / dt : 0;
    e.tempo += dt;
    e.corre = puxa(e.corre, preso((real - A.andar) / (A.correr - A.andar), 0, 1), 7, dt);
    /* girando quase sem sair do lugar: passinhos no próprio eixo */
    const noEixo = suave((Math.abs(e.velAng) - .7) / 3) * (1 - suave(real / 1.1));
    e.passinho = puxa(e.passinho, noEixo, noEixo > e.passinho ? 16 : 7, dt);
    e.mexe = puxa(e.mexe, Math.max(suave(real / 1.25), e.passinho * .55), 11, dt);
    if (e.mexe < .008 && real < .02) e.mexe = 0;
    const passada = A.passadaAndar + (A.passadaCorrer - A.passadaAndar) * e.corre;
    e.fase = (e.fase + andou / passada * dois + e.passinho * Math.abs(e.velAng) * 1.25 * dt) % dois;
    /* postura */
    e.olhar = puxa(e.olhar, preso(falta, -1.15, 1.15), 13, dt);
    e.tomba = puxa(e.tomba, preso(-e.velAng * real * A.inclinaCurva, -A.inclinaMaxima, A.inclinaMaxima), 8, dt);
    e.inclina = puxa(e.inclina, preso(e.acel * A.inclinaArranque, -.13, .14), 8, dt);
  }

  /* a pose do instante (mesmo formato de Animacao.passada) */
  function pose(e, parado, arma, mods){
    let rot = parado;
    if (e.mexe > 0){
      const passo = Animacao.passada(e.fase, e.corre, arma, mods);
      rot = e.mexe > .995 ? passo : Animacao.misturar(parado, passo, e.mexe);
    }
    rot = {...rot};
    const vezes = (a, b) => [a[3]*b[0] + a[0]*b[3] + a[1]*b[2] - a[2]*b[1], a[3]*b[1] - a[0]*b[2] + a[1]*b[3] + a[2]*b[0],
                             a[3]*b[2] + a[0]*b[1] - a[1]*b[0] + a[2]*b[3], a[3]*b[3] - a[0]*b[0] - a[1]*b[1] - a[2]*b[2]];
    const eixo = (n, t) => { const r = [0, 0, 0, Math.cos(t / 2)]; r[n] = Math.sin(t / 2); return r; };
    const soma = (nome, ...giros) => { rot[nome] = giros.reduce(vezes, rot[nome] || [0, 0, 0, 1]); };
    const respira = Math.sin(e.tempo * 1.9) * (1 - e.mexe);
    /* o quadril inclina o corpo todo; o tronco e a cabeça compensam um pouco e viram para onde se vai */
    soma('quadril', eixo(2, e.tomba * .75), eixo(0, e.inclina * .55));
    soma('torax', eixo(1, e.olhar * .26), eixo(2, e.tomba * .35), eixo(0, e.inclina * .6 + respira * .014));
    soma('cabeca', eixo(1, e.olhar * .42), eixo(2, -e.tomba * .7), eixo(0, -e.inclina * .75 - respira * .008));
    if (!arma){ soma('braco_d', eixo(2, -respira * .012 + e.tomba * .35)); soma('braco_e', eixo(2, respira * .012 + e.tomba * .35)); }
    /* a perna de dentro da curva fica um pouco mais dobrada */
    const dentro = e.tomba > 0 ? 'd' : 'e';
    soma('canela_' + dentro, eixo(0, Math.min(.22, Math.abs(e.tomba) * 1.1) * e.mexe));
    return rot;
  }

  return {AJUSTES, novo, avancar, assentarPasso, pose, angulo};
})();
