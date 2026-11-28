/* O sobrevivente visto de fora: as animações de luta em terceira pessoa e as câmeras.
   Usa o mesmo personagem do criador (com a mão e a arma dele). Os golpes seguem o MESMO relógio da
   primeira pessoa, então a pancada acerta no mesmo instante nas duas visões.
   Eixos do corpo: +X esquerda, +Y cima, +Z frente; girar em X negativo leva o membro para a frente.
   Carregado depois de combate.js. */
const Terceira = (() => {
  const preso = (v, a, b) => Math.max(a, Math.min(b, v));
  const suave = x => { const t = preso(x, 0, 1); return t * t * (3 - 2 * t); };
  const puxa = (v, alvo, ritmo, dt) => v + (alvo - v) * (1 - Math.exp(-ritmo * dt));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eixo = (n, t) => { const r = [0, 0, 0, Math.cos(t / 2)]; r[n] = Math.sin(t / 2); return r; };
  const mul = (p, o) => [p[3]*o[0] + p[0]*o[3] + p[1]*o[2] - p[2]*o[1], p[3]*o[1] - p[0]*o[2] + p[1]*o[3] + p[2]*o[0],
                         p[3]*o[2] + p[0]*o[1] - p[1]*o[0] + p[2]*o[3], p[3]*o[3] - p[0]*o[0] - p[1]*o[1] - p[2]*o[2]];
  const giro = (g) => mul(eixo(1, g[1] || 0), mul(eixo(0, g[0] || 0), eixo(2, g[2] || 0)));

  /* uma pose parcial: só as peças que ela muda */
  const rotDe = o => Object.fromEntries(Object.entries(o).map(([n, g]) => [n, giro(g)]));
  /* leva a pose atual na direção da parcial, com um peso */
  function misturaEm(rot, parcial, peso){
    if (peso <= 0) return rot;
    const alvo = {...rot, ...rotDe(parcial)};
    return peso >= 1 ? alvo : Animacao.misturar(rot, alvo, peso);
  }
  /* braço: [frente(-)/trás, torção, abre] · cotovelo (negativo dobra) */
  const braços = (d, cd, e, ce, mais = {}) => ({braco_d:d, antebraco_d:[cd], mao_d:[0], braco_e:e, antebraco_e:[ce], mao_e:[0], ...mais});

  /* ---------------------------------------------------------------- os golpes: preparar, acertar, seguir */
  const G = (preparo, acerto, fim) => ({preparo, acerto, fim});
  const pernas = (frente, k = 1) => frente === 'e' ? {coxa_e:[-.55 * k], canela_e:[.45 * k], coxa_d:[.38 * k], canela_d:[.22 * k]} : {coxa_d:[-.55 * k], canela_d:[.45 * k], coxa_e:[.38 * k], canela_e:[.22 * k]};
  const GOLPES = {
    golpe_d:G({torax:[-.05, -.62], cabeca:[0, .4], ...braços([-2.15, 0, -.75], -1.35, [-.55, 0, .35], -.9), ...pernas('e', .5)},
              {torax:[.26, .42], cabeca:[0, -.2], ...braços([-1.35, 0, .38], -.25, [-.3, 0, .5], -.7), ...pernas('e', 1)},
              {torax:[.36, .72], cabeca:[0, -.35], ...braços([-.55, 0, .75], -.35, [-.1, 0, .55], -.6), ...pernas('e', 1)}),
    golpe_e:G({torax:[-.02, .68], cabeca:[0, -.45], ...braços([-1.7, .3, .95], -1.55, [-.4, 0, .4], -.8), ...pernas('d', .5)},
              {torax:[.2, -.3], cabeca:[0, .15], ...braços([-1.5, -.1, -.35], -.2, [-.35, 0, .3], -.7), ...pernas('d', 1)},
              {torax:[.24, -.65], cabeca:[0, .35], ...braços([-.95, -.2, -.85], -.35, [-.2, 0, .3], -.6), ...pernas('d', 1)}),
    pesado:G({torax:[-.36, -.18], cabeca:[.15], ...braços([-2.95, 0, -.12], -.95, [-2.9, 0, .12], -.95), ...pernas('e', .4)},
             {torax:[.52], cabeca:[-.35], ...braços([-1.2, 0, .18], -.18, [-1.2, 0, -.18], -.18), ...pernas('e', 1.15)},
             {torax:[.78], cabeca:[-.5], ...braços([-.55, 0, .2], -.22, [-.55, 0, -.2], -.22), ...pernas('e', 1.25)}),
    estocada_longa:G({torax:[.02, -.5], cabeca:[0, .35], ...braços([-.35, 0, -.3], -1.75, [-1.35, 0, -.25], -.8), ...pernas('e', .35)},
                     {torax:[.34, .08], cabeca:[-.15], ...braços([-1.5, 0, .1], -.08, [-1.55, 0, -.2], -.12), ...pernas('e', 1.2)},
                     {torax:[.34, .1], cabeca:[-.15], ...braços([-1.48, 0, .1], -.1, [-1.52, 0, -.2], -.16), ...pernas('e', 1.15)}),
    corte:G({torax:[0, -.4], ...braços([-1.5, 0, -.8], -1.3, [-.4, 0, .3], -.9)}, {torax:[.14, .3], ...braços([-1.4, 0, .4], -.35, [-.4, 0, .35], -.9), ...pernas('e', .5)}, {torax:[.18, .45], ...braços([-.9, 0, .6], -.5, [-.3, 0, .35], -.8)}),
    estocada:G({torax:[0, -.35], ...braços([-.4, 0, -.25], -1.8, [-.7, 0, .25], -1.1)}, {torax:[.24, .35], ...braços([-1.55, 0, .12], -.08, [-.4, 0, .35], -1.0), ...pernas('e', .8)}, {torax:[.2, .25], ...braços([-1.3, 0, .1], -.4, [-.45, 0, .35], -1.0)}),
    soco_d:G({torax:[.05, -.42], ...braços([-.55, 0, -.2], -2.15, [-.95, 0, .15], -1.8)}, {torax:[.2, .48], cabeca:[0, -.25], ...braços([-1.58, 0, .18], -.06, [-.85, 0, .15], -1.9), ...pernas('e', .75)}, {torax:[.16, .3], ...braços([-1.2, 0, .1], -.8, [-.9, 0, .15], -1.85)}),
    soco_e:G({torax:[.05, .42], ...braços([-.95, 0, -.15], -1.8, [-.55, 0, .2], -2.15)}, {torax:[.2, -.48], cabeca:[0, .25], ...braços([-.85, 0, -.15], -1.9, [-1.58, 0, -.18], -.06), ...pernas('d', .75)}, {torax:[.16, -.3], ...braços([-.9, 0, -.15], -1.85, [-1.2, 0, -.1], -.8)}),
  };
  GOLPES.pesado_lado = GOLPES.golpe_d; GOLPES.pesado_volta = GOLPES.golpe_e; GOLPES.coronhada = GOLPES.golpe_e; GOLPES.baioneta = GOLPES.estocada;
  GOLPES.estocada_forte = GOLPES.estocada; GOLPES.estocada_longa_forte = GOLPES.estocada_longa; GOLPES.soco_forte = GOLPES.soco_d;

  /* o punho gira para a arma chegar apontada certo: armada para trás, de frente na pancada, para baixo depois.
     Os números são a direção final da arma (0 = para a frente; negativo = para cima/trás). Hastes são desenhadas em pé. */
  const PONTARIA = {mao:[-2.5, -.05, .6], haste:[1.4, 1.5, 1.5], curta:[-.4, -.1, .1], longa:[-.2, 0, .1]};
  function comPunho(parcial, alvo){
    if (alvo === null || !parcial.braco_d || !parcial.antebraco_d) return parcial;
    return {...parcial, mao_d:[alvo - parcial.braco_d[0] - parcial.antebraco_d[0]]};
  }
  const ESTOCADAS = ['estocada', 'estocada_forte', 'estocada_longa', 'estocada_longa_forte', 'baioneta'];

  /* a pose do golpe no instante u (0..1), com os mesmos tempos da primeira pessoa */
  function aplicarGolpe(rot, nome, u, classe){
    let g = GOLPES[nome] || GOLPES.golpe_d;
    const alvos = ESTOCADAS.includes(nome) && classe === 'mao' ? [-.1, -.05, 0] : PONTARIA[classe] || null;
    if (alvos) g = {preparo:comPunho(g.preparo, alvos[0]), acerto:comPunho(g.acerto, alvos[1]), fim:comPunho(g.fim, alvos[2])};
    const ref = Primeira.GOLPES[nome], bate = ref?.acerta ?? .48, prepara = bate * .62, segue = Math.min(.82, bate + .18);
    const a = {...rot, ...rotDe(g.preparo)}, b = {...rot, ...rotDe(g.acerto)}, c = {...rot, ...rotDe(g.fim)};
    if (u < prepara) return Animacao.misturar(rot, a, suave(u / prepara));
    if (u < bate){ const t = (u - prepara) / (bate - prepara); return Animacao.misturar(a, b, t * t * .55 + t * .45); }       /* a pancada acelera */
    if (u < segue) return Animacao.misturar(b, c, suave((u - bate) / (segue - bate)));
    return Animacao.misturar(c, rot, suave((u - segue) / (1 - segue)));
  }

  /* ---------------------------------------------------------------- o estado do corpo */
  function criar(){ return {rot:null, fase:0, mexe:0, corre:0, antes:null, tombo:0, empurrao:0, ferido:0, ladoFerido:0, pisao:0, tempo:0}; }
  const avisar = (c, tipo, mais = {}) => {
    if (tipo === 'empurrao') c.empurrao = .46; if (tipo === 'ferido'){ c.ferido = .42; c.ladoFerido = mais.lado || 0; } if (tipo === 'pisao') c.pisao = .5;
  };

  /* pose = {rot, tombo, semArma}. d = {jog, est, m (a luta), arma, mods, armado, livre} */
  function posar(c, dt, d){
    const {jog, est, m, arma, mods} = d, j = m.jog, g = j.agarrado; c.tempo += dt;
    /* as pernas seguem o quanto ele andou de verdade (de costas, o passo anda para trás) */
    const antes = c.antes || [jog.x, jog.z], dx = jog.x - antes[0], dz = jog.z - antes[1], dist = Math.hypot(dx, dz); c.antes = [jog.x, jog.z];
    const vel = dt > 0 ? Math.min(7, dist / dt) : 0, paraFrente = dx * Math.sin(jog.rumo) + dz * Math.cos(jog.rumo);
    c.mexe = puxa(c.mexe, preso(vel / 1.3, 0, 1), 12, dt); c.corre = puxa(c.corre, preso((vel - 2.4) / 2, 0, 1), 7, dt);
    c.fase += dist / lerp(1.45, 2.5, c.corre) * Math.PI * 2 * (paraFrente < -.001 ? -1 : 1);
    c.empurrao = Math.max(0, c.empurrao - dt); c.ferido = Math.max(0, c.ferido - dt); c.pisao = Math.max(0, c.pisao - dt);
    const quem = g ? 'nenhum' : arma;                                    /* agarrado, as mãos vão para o zumbi */
    const parado = Animacao.parado(quem === 'nenhum' ? null : quem, mods);
    let rot = c.mexe > .02 ? Animacao.misturar(parado, Animacao.passada(c.fase, c.corre, quem === 'nenhum' ? null : quem, mods), Math.min(1, c.mexe)) : {...parado};
    const respira = Math.sin(c.tempo * (j.folego < 25 ? 8 : 2.2)), semAr = preso((30 - j.folego) / 30, 0, 1);
    let tombo = 0, pressa = 20, peso = (o, k) => { rot = misturaEm(rot, o, k); };
    /* sem fôlego: curvado e ofegante */
    if (semAr > 0) peso({torax:[.34 + respira * .06], cabeca:[-.2]}, semAr * .8);
    else rot = misturaEm(rot, {cabeca:[respira * .01]}, .3);

    if (!arma || arma === 'nenhum'){ if (!g && !est.golpe) peso(braços([-.75, 0, -.18], -1.75, [-.75, 0, .18], -1.75, {torax:[.1]}), .85 - c.corre * .6); }      /* guarda de punhos */
    /* golpe carregando e golpe */
    if (!g && est.segurando && est.carga > .18){
      const forte = est.f.forte, base_ = GOLPES[forte] || GOLPES.pesado, gg = {preparo:comPunho(base_.preparo, quem === 'nenhum' ? null : PONTARIA[Animacao.classeDaArma(quem)]?.[0] ?? null)}, k = suave((est.carga - .18) / .75), treme = Math.sin(c.tempo * 38) * .02;
      peso({...gg.preparo, torax:[(gg.preparo.torax?.[0] || 0) + treme, gg.preparo.torax?.[1] || 0]}, k);
    }
    if (!g && est.golpe){ const u = preso(est.golpe.t / (est.golpe.g.dura / (est.ritmoGolpe || 1)), 0, 1); rot = aplicarGolpe(rot, est.golpe.nome, u, quem === 'nenhum' ? null : Animacao.classeDaArma(quem)); pressa = 34; }
    /* defesa: a arma atravessada na frente, corpo um pouco atrás */
    if (!g && est.bloqueio > .02) peso(braços([-1.35, 0, .28], -1.35, [-1.35, 0, -.28], -1.35, {torax:[-.06], cabeca:[.08], coxa_e:[-.3], canela_e:[.35], coxa_d:[.25], canela_d:[.3]}), suave(est.bloqueio));
    if (c.empurrao > 0){
      const u = 1 - c.empurrao / .46, vai = u < .35 ? suave(u / .35) : 1 - suave((u - .55) / .45);
      peso(braços([-1.55, 0, .02], -.08, [-1.55, 0, -.02], -.08, {torax:[.4], cabeca:[-.25], ...pernas('e', 1)}), vai);
    }
    if (c.pisao > 0){
      const u = 1 - c.pisao / .5, sobe = u < .45;
      peso(sobe ? {coxa_d:[-1.35], canela_d:[1.6], torax:[.15], coxa_e:[.1], canela_e:[.2]} : {coxa_d:[-.45], canela_d:[.15], torax:[.5], cabeca:[-.1], coxa_e:[.25], canela_e:[.5]}, u < .82 ? 1 : 1 - (u - .82) / .18);
      pressa = 30;
    }
    /* esquiva: abaixa e joga o corpo para onde vai */
    if (j.esquiva > 0){
      const k = Math.sin(preso(1 - j.esquiva / Combate.J.esquivaDura, 0, 1) * Math.PI);
      const fr = j.esqDir[0] * Math.sin(jog.rumo) + j.esqDir[1] * Math.cos(jog.rumo), lado = j.esqDir[0] * Math.cos(jog.rumo) - j.esqDir[1] * Math.sin(jog.rumo);
      peso({quadril:[fr * .28, 0, -lado * .3], torax:[.32 + fr * .15, 0, -lado * .16], cabeca:[-.3], coxa_d:[-.95 - fr * .2], canela_d:[1.35], coxa_e:[-.35 + fr * .3], canela_e:[1.0],
            ...braços([-.8, 0, -.5], -1.2, [-.8, 0, .5], -1.2)}, k);
      pressa = 28;
    }
    /* apanhou */
    if (c.ferido > 0 && !g){ const k = Math.sin(preso(1 - c.ferido / .42, 0, 1) * Math.PI), s = Math.sin(c.ladoFerido || .4);
      peso({torax:[-.38, -s * .45, s * .16], cabeca:[-.42, -s * .5, s * .25], coxa_d:[.2], canela_d:[.45]}, k * .85); pressa = 30; }

    /* ---- agarrado: empurra o zumbi com as duas mãos; cada aperto é um tranco */
    if (g){
      const empurra = g.puxao || 0, aperto = g.etapa >= 3 ? 1 : g.etapa === 2 ? .55 : 0, luta = Math.sin(c.tempo * 15) * .06, morde = g.mordendo > 0 ? Math.sin(preso(1 - g.mordendo / .55, 0, 1) * Math.PI) : 0;
      if (!g.noChao){
        peso({torax:[-.14 - aperto * .22 + empurra * .26, luta * 1.6 - morde * .35, luta], cabeca:[-.2 - aperto * .18 + empurra * .1 - morde * .45, .22 + aperto * .35 + morde * .4, -.16 * aperto - morde * .35],
              ...braços([-1.32 - empurra * .22 + luta, 0, .16 - aperto * .22], -.95 + empurra * .62 - aperto * .42, [-1.32 - empurra * .22 - luta, 0, -.16 + aperto * .22], -.95 + empurra * .62 - aperto * .42),
              quadril:[-.04 - aperto * .08], coxa_e:[-.5 - aperto * .12], canela_e:[.58 + aperto * .25], coxa_d:[.46], canela_d:[.46 + aperto * .22]}, 1);
        pressa = 24;
      } else {
        const chuta = Math.sin(c.tempo * 9);
        tombo = -1.5;
        peso({torax:[.02 - empurra * .03, luta * 2, luta], cabeca:[.12 + morde * .12, .35 * Math.sin(c.tempo * 3.4) + morde * .5, luta],
              /* os cotovelos junto do corpo e as mãos no peito dele; cada aperto estica um pouco os braços */
              ...braços([-.85 - empurra * .55 + luta, 0, -.22], -1.75 + empurra * 1.05, [-.85 - empurra * .55 - luta, 0, .22], -1.75 + empurra * 1.05),
              coxa_d:[-.16 - Math.max(0, chuta) * .3, 0, -.05], canela_d:[.35 + Math.max(0, chuta) * .6], coxa_e:[-.1 - Math.max(0, -chuta) * .26, 0, .05], canela_e:[.3 + Math.max(0, -chuta) * .4]}, 1);
        pressa = 16;
      }
    }
    /* levantando: do chão, apoia, dobra e fica de pé */
    if (!g && j.levantando > 0){
      const u = 1 - j.levantando / Combate.G.levantar, k = 1 - suave(u * 1.15), dobra = Math.sin(preso(u, 0, 1) * Math.PI);
      tombo = -1.5 * k;
      peso({torax:[.25 + dobra * .55], cabeca:[-.2], coxa_d:[-.3 - dobra * 1.25], canela_d:[.2 + dobra * 1.75], coxa_e:[.05 - dobra * .45], canela_e:[.2 + dobra * 1.2], ...braços([-.35 - dobra * .55, 0, -.45], -.5, [.5 * k, 0, .55], -.35)}, 1 - suave((u - .8) / .2));
      pressa = 18;
    }
    if (j.morto){
      c.morte = Math.min(1, (c.morte || 0) + dt / .85);
      tombo = -1.55 * Math.pow(c.morte, 1.6);
      peso({torax:[.05, .1, .08], cabeca:[-.25, .55, .2], ...braços([-.35, 0, -.9], -.35, [-.7, 0, .75], -.9), coxa_d:[-.12, 0, -.2], canela_d:[.35], coxa_e:[.1, 0, .15], canela_e:[.6]}, suave(c.morte * 1.4)); pressa = 10;
    } else c.morte = 0;

    const k = 1 - Math.exp(-pressa * dt);
    c.rot = c.rot ? Animacao.misturar(c.rot, rot, k) : rot;
    c.tombo = puxa(c.tombo, tombo, g?.noChao ? 9 : 14, dt);
    return {rot:c.rot, tombo:c.tombo, semArma:!!g};
  }

  /* ---------------------------------------------------------------- as câmeras
     devolve {olho, dir} olhando para o sobrevivente. rumo = para onde ele está virado */
  const CAMERAS = {primeira:'1ª pessoa', ombro:'3ª pessoa: por cima do ombro', lado:'3ª pessoa: de lado', frente:'3ª pessoa: de frente'};
  function camera(tipo, jog, c, dt, noChao){
    const F = [Math.sin(jog.rumo), 0, Math.cos(jog.rumo)], D = [-Math.cos(jog.rumo), 0, Math.sin(jog.rumo)];           /* frente e direita dele */
    const em = (frente, direita, alto) => [jog.x + F[0] * frente + D[0] * direita, alto, jog.z + F[2] * frente + D[2] * direita];
    let olho, mira;
    if (tipo === 'lado'){ olho = em(.5, noChao ? 2.6 : 3.5, noChao ? 1.75 : 1.65); mira = em(noChao ? -.1 : .55, 0, noChao ? .35 : .98); }
    else if (tipo === 'frente'){ olho = em(2.7, 3.2, 2.35); mira = em(.35, 0, noChao ? .35 : .95); }
    else { olho = em(noChao ? -1.9 : -2.25, noChao ? 1.75 : 1.5, noChao ? 2.25 : 2.35); mira = em(noChao ? .05 : 1.45, noChao ? .15 : .42, noChao ? .3 : 1.02); }          /* ele fica à esquerda, o zumbi aparece */
    const k = c.cam && c.camTipo === tipo ? 1 - Math.exp(-11 * dt) : 1;
    c.cam = c.cam && k < 1 ? {olho:c.cam.olho.map((v, i) => lerp(v, olho[i], k)), mira:c.cam.mira.map((v, i) => lerp(v, mira[i], k))} : {olho, mira};
    c.camTipo = tipo;
    const dir = c.cam.mira.map((v, i) => v - c.cam.olho[i]), n = Math.hypot(...dir) || 1;
    return {olho:c.cam.olho, dir:dir.map(v => v / n)};
  }

  return {GOLPES, CAMERAS, criar, avisar, posar, camera, aplicarGolpe};
})();
