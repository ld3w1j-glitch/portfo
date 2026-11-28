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

  /* ---------------------------------------------------------------- arco e estilingue */
  const DE_CORDA = ['arco', 'estilingue'];
  /* mola sem balanço: sai e chega macio */
  function mola(c, nome, alvo, forca, dt){
    const v = nome + 'V', passos = Math.max(1, Math.ceil(dt / .008)), h = dt / passos;
    let x = c[nome] || 0, vx = c[v] || 0;
    for (let i = 0; i < passos; i++){ vx += (forca * (alvo - x) - 2 * Math.sqrt(forca) * vx) * h; x += vx * h; }
    c[nome] = x; c[v] = vx; return preso(x, 0, 1);
  }
  const girar = (q, v) => { const [x, y, z, w] = q, tx = 2 * (y * v[2] - z * v[1]), ty = 2 * (z * v[0] - x * v[2]), tz = 2 * (x * v[1] - y * v[0]); return [v[0] + w * tx + y * tz - z * ty, v[1] + w * ty + z * tx - x * tz, v[2] + w * tz + x * ty - y * tx]; };
  const soma = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], menos = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], por = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const meioDe = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t), tam = a => Math.hypot(...a);
  /* leva a mão (o ponto em que ela segura) até o alvo, calculando ombro, cotovelo e punho */
  function levarMao(rot, esq, lado, alvo, maoQ, cotovelo){
    const centro = Animacao.pontoDaPeca('mao_' + lado, ESTRUTURA['mao_' + lado].tam.map(v => v / 2));
    return Animacao.braco(lado, esq.pos['braco_' + lado], Animacao.punhoPara(alvo, maoQ, centro), cotovelo, maoQ, esq.G.torax);
  }
  /* corpo de lado, braço da arma esticado e a outra mão puxando até o rosto. s = o estado do gesto */
  function poseDeCorda(rot, arma, s){
    const arco = arma === 'arco', cima = s.cima;
    const base = {...rot, torax:mul(eixo(0, -cima), mul(eixo(1, arco ? -1.08 : -.72), eixo(0, .05))), cabeca:mul(eixo(1, arco ? .98 : .66), eixo(2, arco ? -.07 : -.04))};
    const esq = Animacao.esqueleto(base), P = esq.pos;
    const braco = tam(menos(P.antebraco_e, P.braco_e)) + tam(menos(P.mao_e, P.antebraco_e));
    const frente = [0, Math.sin(cima), Math.cos(cima)];
    /* a mão que segura: quase esticada, trazida um pouco para o meio, para ficar na linha do olho */
    const segura = soma(soma(P.braco_e, por(frente, braco * (arco ? .97 : .9))), [-.1, arco ? .015 : .045, 0]);
    const queixo = soma(P.cabeca, arco ? [-.055, .035, .1] : [-.015, .02, .15]);
    const naCorda = soma(segura, por(frente, arco ? -.15 : -.09));
    let puxa = meioDe(naCorda, queixo, s.puxa);
    if (s.solta > 0){                                    /* soltou: a mão escorrega para trás, junto do pescoço */
      const k = Math.sin(Math.min(1, s.solta) * Math.PI * .5);
      puxa = soma(queixo, [-.07 * k, -.015 * k, -.13 * k]);
    } else if (s.recarga !== null){                      /* pega a próxima: aljava por cima do ombro, ou o bolso */
      const fonte = arco ? soma(P.braco_d, [-.02, .2, -.17]) : soma(P.quadril, [-.2, .03, .04]);
      const u = s.recarga;
      puxa = u < .42 ? meioDe(soma(queixo, [-.07, 0, -.1]), fonte, suave(u / .42)) : meioDe(fonte, naCorda, suave((u - .46) / .5));
    }
    const qSegura = mul(eixo(0, -1.35 - cima + (arco ? s.tomba : 0)), eixo(1, 0)), qPuxa = mul(eixo(0, -1.2 - cima * .6), eixo(1, .5));
    Object.assign(base, levarMao(base, esq, 'e', segura, qSegura, [.8, -.55, -.15]));
    Object.assign(base, levarMao(base, esq, 'd', puxa, qPuxa, s.recarga !== null && s.recarga < .6 ? [-1, .2, .2] : [-1, .12, -.75]));
    return base;
  }

  /* ---------------------------------------------------------------- recarga vista de fora
     info = {c: meio do pente, baixo: para onde ele sai, porta: onde entra o cartucho}, nas coordenadas da mão da arma */
  function poseDeRecarga(rot, arma, mods, p, cart, info){
    const longa = ARMAS[arma]?.longa !== false;
    const base = {...rot, torax:mul(eixo(1, longa ? -.3 : -.08), eixo(0, .06)), cabeca:mul(eixo(1, longa ? .34 : .12), eixo(0, .3))};
    const mira = Animacao.mirar(arma, longa ? 'mirando' : 'mirando_uma', mods), qMira = Animacao.esqueleto({...rot, ...mira}).G.mao_d;
    /* o cano sobe um pouco e vira para o meio, com a arma deitada de lado */
    const qArma = mul(eixo(1, .42), mul(eixo(0, -.3), mul(eixo(2, -.38), qMira)));
    let esq = Animacao.esqueleto(base);
    /* olhando o pente vazio: a arma desce e o pente sobe até a frente do rosto */
    const olha = !p || p.de !== 'ver' && p.ate !== 'ver' ? 0 : p.de === p.ate ? 1 : p.ate === 'ver' ? p.t : 1 - p.t;
    const segura = soma(esq.pos.braco_d, longa ? [.11 - olha * .1, -.27 - olha * .17, .24] : [.12 - olha * .14, -.2 - olha * .2, .32 - olha * .06]);
    Object.assign(base, levarMao(base, esq, 'd', segura, qArma, [-1, -.7, -.15]));
    if (!info) return base;
    esq = Animacao.esqueleto(base);
    const naArma_ = v => soma(esq.pos.mao_d, girar(esq.G.mao_d, v)), bolso = soma(esq.pos.quadril, [.2, .05, .07]);
    let alvo = null;
    if (p){
      const lugar = nome => nome === 'arma' ? naArma_(info.c) : nome === 'fora' ? naArma_(soma(info.c, por(info.baixo, .15))) : nome === 'ver' ? soma(esq.pos.cabeca, [.17, .02, .37]) : bolso;
      alvo = meioDe(lugar(p.de), lugar(p.ate), p.t);
      if (olha > 0) base.cabeca = Animacao.misturar(base, {...base, cabeca:mul(eixo(1, .3), eixo(0, .08))}, olha).cabeca;
    } else if (cart) alvo = meioDe(bolso, naArma_(info.porta), cart.k);
    if (alvo) Object.assign(base, levarMao(base, esq, 'e', alvo, mul(eixo(0, -1.15), eixo(1, .25)), [.9, -.75, -.1]));
    return base;
  }

  /* ---------------------------------------------------------------- lança e forcado: sempre com as duas mãos no cabo na hora da luta */
  const DE_HASTE = ['lanca', 'forcado'];
  /* cada posição: atras = mão de trás (a partir do quadril: +X esquerda, +Y cima, +Z frente); aponta = para onde vai a ponta;
     entre = distância entre as mãos (elas deslizam no cabo na estocada); tronco e pernas */
  const H = (atras, aponta, entre, tronco, pernas) => ({atras, aponta, entre, tronco, pernas});
  const pe = (ce, ke, cd, kd) => [ce, ke, cd, kd];
  const HASTE = {
    levando: H([-.29, .06, .07], [.02, .74, .67], .46, [0, 0], pe(0, .05, 0, .05)),
    guarda:  H([-.23, .13, -.03], [.2, .1, 1], .46, [-.58, .08], pe(-.34, .3, .22, .22)),
    recua:   H([-.27, .19, -.2], [.2, .09, 1], .5, [-.84, -.02], pe(-.2, .16, .06, .46)),
    estoca:  H([-.15, .27, .2], [.1, .07, 1], .3, [-.18, .32], pe(-.74, .68, .46, .1)),
    arma:    H([-.31, .27, -.27], [.24, .1, 1], .5, [-1.08, -.1], pe(-.14, .2, -.04, .72)),
    fundo:   H([-.1, .27, .3], [.07, .03, 1], .24, [0, .5], pe(-1.0, .9, .6, .08)),
    defesa:  H([-.25, .13, .22], [.62, .74, .24], .5, [-.16, -.06], pe(-.3, .34, .22, .28)),
    empurra: H([-.27, .3, .36], [1, .07, .06], .52, [-.04, .26], pe(-.55, .45, .34, .16)),
  };
  const meiaPose = (a, b, t) => t <= 0 ? a : t >= 1 ? b : {atras:a.atras.map((v, i) => lerp(v, b.atras[i], t)), aponta:a.aponta.map((v, i) => lerp(v, b.aponta[i], t)),
    entre:lerp(a.entre, b.entre, t), tronco:a.tronco.map((v, i) => lerp(v, b.tronco[i], t)), pernas:a.pernas.map((v, i) => lerp(v, b.pernas[i], t))};
  /* a estocada no instante u (0..1), no mesmo relógio do golpe: recua, dispara, segura um instante e volta */
  function estocada(base, u, forte, bate){
    const de = forte ? HASTE.arma : HASTE.recua, ate = forte ? HASTE.fundo : HASTE.estoca, prepara = bate * (forte ? .66 : .58), segura = Math.min(.82, bate + .16);
    if (u < prepara) return meiaPose(base, de, suave(u / prepara));
    if (u < bate){ const t = (u - prepara) / (bate - prepara); return meiaPose(de, ate, t * t * .4 + t * .6); }
    if (u < segura) return ate;
    return meiaPose(ate, base, suave((u - segura) / (1 - segura)));
  }
  /* monta o corpo a partir da posição; k = quanto está em posição de luta (0 = só carregando) */
  function poseDeHaste(rot, p, k, andando){
    const un = v => { const n = Math.hypot(...v) || 1; return v.map(x => x / n); }, dir = un(p.aponta);
    const base = k > .001 ? {...rot, torax:mul(eixo(1, p.tronco[0]), eixo(0, p.tronco[1])), cabeca:mul(eixo(1, -p.tronco[0] * .88), eixo(0, -p.tronco[1] * .7))} : {...rot};
    const tronco = Animacao.misturar(rot, base, k);
    if (!andando && k > .001){
      const alvo = {...tronco, ...rotDe({coxa_e:[p.pernas[0], 0, .06], canela_e:[p.pernas[1]], coxa_d:[p.pernas[2], 0, -.08], canela_d:[p.pernas[3]]})};
      for (const [coxa, canela, pe_] of [['coxa_e', 'canela_e', 'pe_e'], ['coxa_d', 'canela_d', 'pe_d']]){ const q = mul(mul(alvo.quadril || [0, 0, 0, 1], alvo[coxa]), alvo[canela]); alvo[pe_] = [-q[0], -q[1], -q[2], q[3]]; }
      Object.assign(tronco, Animacao.misturar(tronco, alvo, k));
    }
    const qMao = mul(eixo(0, -1.28), eixo(1, .15));
    let esq = Animacao.esqueleto(tronco);
    const qd = esq.pos.quadril, atras = soma(qd, p.atras);
    Object.assign(tronco, levarMao(tronco, esq, 'd', atras, qMao, [-1, -.35, -.55]));
    if (k > .02){
      esq = Animacao.esqueleto(tronco);
      const frente = soma(atras, por(dir, p.entre)), comMao = {...tronco, ...levarMao(tronco, esq, 'e', frente, qMao, [.9, -.7, -.1])};
      const meio_ = Animacao.misturar(tronco, comMao, preso((k - .02) / .9, 0, 1));
      Object.assign(tronco, meio_);
    }
    return {rot:tronco, dir};
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
    const deCorda = DE_CORDA.includes(arma);
    const deHaste = DE_HASTE.includes(arma);
    const quem = g || deCorda || deHaste ? 'nenhum' : arma;                         /* agarrado, as mãos vão para o zumbi; arco e estilingue têm gesto próprio */
    const parado = Animacao.parado(quem === 'nenhum' ? null : quem, mods);
    let rot = c.mexe > .02 ? Animacao.misturar(parado, Animacao.passada(c.fase, c.corre, quem === 'nenhum' ? null : quem, mods), Math.min(1, c.mexe)) : {...parado};
    const respira = Math.sin(c.tempo * (j.folego < 25 ? 8 : 2.2)), semAr = preso((30 - j.folego) / 30, 0, 1);
    /* arma de fogo, besta, arco e estilingue: sabe quando saiu um tiro (a munição desceu) */
    if (c.armaAntes === arma && est.municao < c.municao){ c.tiro = 1.1; c.coice = 1; }
    c.armaAntes = arma; c.municao = est.municao;
    c.tiro = Math.max(0, (c.tiro || 0) - dt); c.coice = (c.coice || 0) * Math.exp(-13 * dt);
    let tombo = 0, pressa = 20, peso = (o, k) => { rot = misturaEm(rot, o, k); };
    /* sem fôlego: curvado e ofegante */
    if (semAr > 0) peso({torax:[.34 + respira * .06], cabeca:[-.2]}, semAr * .8);
    else rot = misturaEm(rot, {cabeca:[respira * .01]}, .3);

    /* apontando: mirando, puxando a corda ou logo depois de atirar. A arma sobe e acompanha o olhar para cima e para baixo */
    const deTiro = !g && !j.morto && est.f.tipo === 'tiro' && !!arma && arma !== 'nenhum' && !(j.levantando > 0) && !(est.recarga > 0) && !est.golpe;
    /* no arco e no estilingue ele continua em posição enquanto pega a próxima */
    const recarregando = deCorda && est.recarga > 0 && c.tiro > 0;
    const querApontar = !(deTiro || recarregando && !g && !j.morto) ? 0 : c.tiro > 0 || est.puxada > .02 ? 1 : preso(est.mira * 1.35, 0, 1);
    c.apontar = mola(c, 'sobe', querApontar, querApontar > (c.apontar || 0) ? 190 : 60, dt);
    let corda = null;
    if (deCorda && !g){
      if (c.tiro > 1.09){ c.solta = .001; c.puxaS = 0; c.puxaSV = 0; c.vibra = 1; }
      if (c.solta > 0){ c.solta += dt / .24; if (c.solta >= 1.5) c.solta = 0; }
      c.vibra = (c.vibra || 0) * Math.exp(-9 * dt);
      const recarga = est.recarga > 0 && !(c.solta > 0 && c.solta < 1) ? preso(1 - est.recarga / (est.durRecarga || 1), 0, 1) : null;
      const puxando = est.puxada > .02 ? .22 + .78 * est.puxada : est.mira > .3 ? .2 : 0;
      const quanto = mola(c, 'puxaS', c.solta > 0 || recarga !== null ? 0 : puxando, 150, dt);
      const tomba = c.solta > 0 ? .55 * Math.sin(Math.min(1, c.solta) * Math.PI * .8) : 0;     /* o arco gira para a frente na mão */
      if (c.apontar > .01){
        const cima = preso(jog.olha + (jog.tranco || 0), -.75, .75);
        let alvo = poseDeCorda(rot, arma, {cima, puxa:quanto, solta:c.solta || 0, recarga, tomba});
        if (c.mexe <= .15) Object.assign(alvo, rotDe({coxa_e:[-.26, 0, .07], canela_e:[.2], coxa_d:[.18, 0, -.08], canela_d:[.14]}));
        rot = Animacao.misturar(rot, alvo, suave(c.apontar));
        pressa = 30;
      }
      const pronta = recarga === null ? !(c.solta > 0) : recarga > .94;
      corda = {tipo:arma, vibra:c.vibra, tomba, apontar:c.apontar, naCorda:pronta && c.apontar > .5 && (puxando > 0 || recarga !== null || est.municao > 0),
               naMao:recarga !== null && recarga > .42 && recarga <= .94, municao:est.municao > 0 || recarga !== null};
    } else if (c.apontar > .01){
      const mira = Animacao.mirar(arma, 'mirando', mods), cima = preso(jog.olha + (jog.tranco || 0), -.75, .75);
      mira.torax = mul(eixo(0, -cima - c.coice * .07), mira.torax);
      mira.cabeca = mul(eixo(0, c.coice * .03), mira.cabeca || [0, 0, 0, 1]);
      for (const n of ['antebraco_d', 'antebraco_e']) mira[n] = mul(eixo(0, -c.coice * .1), mira[n]);
      /* andando, as pernas continuam as do passo; parado, entra na base de tiro (um pé à frente) */
      const alvo = {...rot, ...mira};
      if (c.mexe > .15) for (const n of Object.keys(rot)) if (/^(quadril|cintura|coxa|canela|pe)/.test(n)) alvo[n] = rot[n];
      rot = c.apontar > .995 ? alvo : Animacao.misturar(rot, alvo, c.apontar);
      if (c.coice > .05) pressa = 40;
    }

    /* recarga: a arma sobe à frente do peito e a mão esquerda troca o pente, ou leva os cartuchos */
    const carregando = !g && !j.morto && !(j.levantando > 0) && !!arma && arma !== 'nenhum' && Primeira.progresso(est) !== null;
    if (carregando){ c.recargaDe = {pente:Primeira.passoDoPente(est), cartucho:Primeira.passoDoCartucho(est)}; }
    const pesoRecarga = mola(c, 'carrega', carregando ? 1 : 0, carregando ? 170 : 80, dt);
    let recarga = null;
    if (pesoRecarga > .01 && !g && c.recargaDe){
      const passoP = carregando ? c.recargaDe.pente : null, cart = carregando ? c.recargaDe.cartucho : null;
      rot = Animacao.misturar(rot, poseDeRecarga(rot, arma, mods, passoP, cart, d.recarga), suave(pesoRecarga));
      pressa = 30;
      recarga = {peso:pesoRecarga, pente:passoP, cartucho:cart};
    }

    if (!arma || arma === 'nenhum'){ if (!g && !est.golpe) peso(braços([-.75, 0, -.18], -1.75, [-.75, 0, .18], -1.75, {torax:[.1]}), .85 - c.corre * .6); }      /* guarda de punhos */
    /* golpe carregando e golpe */
    if (!g && !deHaste && est.segurando && est.carga > .18){
      const forte = est.f.forte, base_ = GOLPES[forte] || GOLPES.pesado, gg = {preparo:comPunho(base_.preparo, quem === 'nenhum' ? null : PONTARIA[Animacao.classeDaArma(quem)]?.[0] ?? null)}, k = suave((est.carga - .18) / .75), treme = Math.sin(c.tempo * 38) * .02;
      peso({...gg.preparo, torax:[(gg.preparo.torax?.[0] || 0) + treme, gg.preparo.torax?.[1] || 0]}, k);
    }
    if (!g && !deHaste && est.golpe){ const u = preso(est.golpe.t / (est.golpe.g.dura / (est.ritmoGolpe || 1)), 0, 1); rot = aplicarGolpe(rot, est.golpe.nome, u, quem === 'nenhum' ? null : Animacao.classeDaArma(quem)); pressa = 34; }
    /* defesa: a arma atravessada na frente, corpo um pouco atrás */
    if (!g && !deHaste && est.bloqueio > .02) peso(braços([-1.35, 0, .28], -1.35, [-1.35, 0, -.28], -1.35, {torax:[-.06], cabeca:[.08], coxa_e:[-.3], canela_e:[.35], coxa_d:[.25], canela_d:[.3]}), suave(est.bloqueio));
    if (c.empurrao > 0 && !deHaste){
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

    let haste = null;
    if (deHaste && !g && !j.morto && !(j.levantando > 0)){
      /* entra em guarda lutando ou com zumbi por perto */
      const perto = m.zumbis.some(z => Combate.vivo(z) && Math.hypot(z.x - jog.x, z.z - jog.z) < 3.6);
      const lutando = !!est.golpe || est.segurando && est.carga > .1 || est.bloqueio > .05 || c.empurrao > 0;
      if (lutando) c.guardaAte = 1.6; else c.guardaAte = Math.max(0, (c.guardaAte || 0) - dt);
      const quer = lutando || perto || c.guardaAte > 0 || est.mira > .2 ? 1 : 0;
      const pronto = mola(c, 'pronto', quer, quer > (c.pronto || 0) ? 150 : 40, dt);
      c.pronto = pronto;
      let p = meiaPose(HASTE.levando, HASTE.guarda, suave(pronto));
      if (est.bloqueio > .02) p = meiaPose(p, HASTE.defesa, suave(est.bloqueio));
      if (est.segurando && est.carga > .18){ const k = suave((est.carga - .18) / .75), tr = Math.sin(c.tempo * 38) * .012; p = meiaPose(p, {...HASTE.arma, atras:[HASTE.arma.atras[0], HASTE.arma.atras[1] + tr, HASTE.arma.atras[2]]}, k); c.carregada = p; }
      else if (!est.golpe) c.carregada = null;
      if (est.golpe){
        const u = preso(est.golpe.t / (est.golpe.g.dura / (est.ritmoGolpe || 1)), 0, 1), forte = !!est.golpe.forte || /forte/.test(est.golpe.nome), bate = Primeira.GOLPES[est.golpe.nome]?.acerta ?? .48;
        p = estocada(forte && c.carregada ? c.carregada : p, u, forte, bate); pressa = 40;
      }
      if (c.empurrao > 0){ const u = 1 - c.empurrao / .46, vai = u < .35 ? suave(u / .35) : 1 - suave((u - .55) / .45); p = meiaPose(p, HASTE.empurra, vai); pressa = 34; }
      const r = poseDeHaste(rot, p, pronto, c.mexe > .15);
      rot = r.rot;
      haste = {id:arma, pronto, dir:r.dir, lutando};
    } else c.pronto = 0;

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
    return {rot:c.rot, tombo:c.tombo, semArma:!!g, apontando:haste ? haste.pronto : c.apontar || 0, corda, haste, recarga};
  }

  /* ---------------------------------------------------------------- as câmeras
     devolve {olho, dir} olhando para o sobrevivente. rumo = para onde ele está virado */
  const CAMERAS = {primeira:'1ª pessoa', ombro:'3ª pessoa: por cima do ombro', lado:'3ª pessoa: de lado', frente:'3ª pessoa: de frente'};
  function camera(tipo, jog, c, dt, noChao){
    const F = [Math.sin(jog.rumo), 0, Math.cos(jog.rumo)], D = [-Math.cos(jog.rumo), 0, Math.sin(jog.rumo)];           /* frente e direita dele */
    const em = (frente, direita, alto) => [jog.x + F[0] * frente + D[0] * direita, alto + (jog.y || 0), jog.z + F[2] * frente + D[2] * direita];
    let olho, mira;
    if (tipo === 'lado'){ olho = em(.5, noChao ? 2.6 : 3.5, noChao ? 1.75 : 1.65); mira = em(noChao ? -.1 : .55, 0, noChao ? .35 : .98); }
    else if (tipo === 'frente'){ olho = em(2.7, 3.2, 2.35); mira = em(.35, 0, noChao ? .35 : .95); }
    else if (typeof window === 'object' && window.WO_EM_PE){ olho = em(noChao ? -2.2 : -2.9, noChao ? 1.0 : .55, noChao ? 2.4 : 2.5); mira = em(noChao ? .05 : 1.3, .12, noChao ? .3 : .95); }   /* tela em pé: mais atrás e no meio */
    else { olho = em(noChao ? -1.9 : -2.25, noChao ? 1.75 : 1.5, noChao ? 2.25 : 2.35); mira = em(noChao ? .05 : 1.45, noChao ? .15 : .42, noChao ? .3 : 1.02); }          /* ele fica à esquerda, o zumbi aparece */
    const k = c.cam && c.camTipo === tipo ? 1 - Math.exp(-11 * dt) : 1;
    c.cam = c.cam && k < 1 ? {olho:c.cam.olho.map((v, i) => lerp(v, olho[i], k)), mira:c.cam.mira.map((v, i) => lerp(v, mira[i], k))} : {olho, mira};
    c.camTipo = tipo;
    const dir = c.cam.mira.map((v, i) => v - c.cam.olho[i]), n = Math.hypot(...dir) || 1;
    return {olho:c.cam.olho, dir:dir.map(v => v / n)};
  }

  return {GOLPES, CAMERAS, criar, avisar, posar, camera, aplicarGolpe};
})();
