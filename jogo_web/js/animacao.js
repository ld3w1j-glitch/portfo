/* Animações em um "corpo reto": o repouso do modelo-base é girado e com uma perna à frente, e por isso
   caminhar e segurar armas em cima dele saía torto. Aqui cada peça é primeiro endireitada (de frente para +Z)
   usando as próprias medidas dos encaixes, e só então recebe a animação. A pose "Descanso" sem arma não muda.
   Eixos: +X = lado esquerdo do personagem, +Y = cima, +Z = frente. Girar em X com ângulo negativo leva para a frente.
   Carregado logo depois de modelo.js. */
const Animacao = (() => {
  const mul = (p, o) => [p[3]*o[0] + p[0]*o[3] + p[1]*o[2] - p[2]*o[1], p[3]*o[1] - p[0]*o[2] + p[1]*o[3] + p[2]*o[0],
                         p[3]*o[2] + p[0]*o[1] - p[1]*o[0] + p[2]*o[3], p[3]*o[3] - p[0]*o[0] - p[1]*o[1] - p[2]*o[2]];
  const inv = q => [-q[0], -q[1], -q[2], q[3]], UM = [0, 0, 0, 1];
  const eixo = (n, t) => { const s = Math.sin(t / 2), r = [0, 0, 0, Math.cos(t / 2)]; r[n] = s; return r; };
  const X = t => eixo(0, t), Y = t => eixo(1, t), Z = t => eixo(2, t);
  const junta = (...qs) => qs.reduce(mul, UM);
  const mais = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], menos_ = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const vezes = (a, k) => [a[0] * k, a[1] * k, a[2] * k], escalar = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  const cruzado = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
  const unit = a => { const t = Math.hypot(...a) || 1; return vezes(a, 1 / t); };
  /* quaternio a partir das três colunas de uma matriz de rotação */
  function deColunas(a, b, c){
    const m00 = a[0], m10 = a[1], m20 = a[2], m01 = b[0], m11 = b[1], m21 = b[2], m02 = c[0], m12 = c[1], m22 = c[2], tr = m00 + m11 + m22;
    let q;
    if (tr > 0){ const s = Math.sqrt(tr + 1) * 2; q = [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, s / 4]; }
    else if (m00 > m11 && m00 > m22){ const s = Math.sqrt(1 + m00 - m11 - m22) * 2; q = [s / 4, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s]; }
    else if (m11 > m22){ const s = Math.sqrt(1 + m11 - m00 - m22) * 2; q = [(m01 + m10) / s, s / 4, (m12 + m21) / s, (m02 - m20) / s]; }
    else { const s = Math.sqrt(1 + m22 - m00 - m11) * 2; q = [(m02 + m20) / s, (m12 + m21) / s, s / 4, (m10 - m01) / s]; }
    const t = Math.hypot(...q); return q.map(v => v / t);
  }
  function mistura(a, b, t){
    let d = a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3]; const s = d < 0 ? -1 : 1;
    const q = a.map((v, i) => v + (b[i] * s - v) * t), n = Math.hypot(...q) || 1; return q.map(v => v / n);
  }

  /* ---------------------------------------------------------------- o corpo reto */
  const GIRADAS = ['coxa_e', 'canela_e', 'pe_e'];                  /* nestas a grade da peça foi modelada virada 90 graus */
  let base = null;
  function preparar(){
    if (base) return base;
    const piv = pivos(), M = v => [v[0], v[2], -v[1]], corr = {}, desloc = {};
    for (const [nome, g] of Object.entries(ESTRUTURA)){
      const colunas = [unit(M(g.x)), unit(M(g.z)), unit(vezes(M(g.y), -1))];
      const repouso = deColunas(...colunas);
      const reto = GIRADAS.includes(nome) ? Y(-Math.PI / 2) : UM;
      corr[nome] = {total:mul(reto, inv(repouso)), reto, repouso, colunas};
    }
    for (const [nome, pai] of Object.entries(PAI)) if (pai){
      const d = menos_(piv[nome], piv[pai]), local = corr[pai].colunas.map(c => escalar(c, d));
      desloc[nome] = girar(corr[pai].reto, local);                 /* onde o filho se prende, com o pai endireitado */
    }
    base = {piv, corr, desloc}; return base;
  }
  /* ponto de uma peça (coordenadas de blocos) visto a partir da junta, no corpo reto */
  function pontoDaPeca(nome, grade){
    const B = preparar();
    return girar(B.corr[nome].total, menos_(mundo(ESTRUTURA[nome], grade), B.piv[nome]));
  }

  /* globais de cada peça: giro G da animação e posição da junta. rot = giros em relação ao pai */
  function esqueleto(rot){
    const B = preparar(), G = {}, pos = {};
    for (const nome of Object.keys(PAI)){
      const pai = PAI[nome];
      if (!pai){ G[nome] = rot[nome] || UM; pos[nome] = [0, 0, 0]; continue; }
      G[nome] = mul(G[pai], rot[nome] || UM);
      pos[nome] = mais(pos[pai], girar(G[pai], B.desloc[nome]));
    }
    return {G, pos};
  }
  function globais(rot){
    const B = preparar(), e = esqueleto(rot), out = {};
    for (const nome of Object.keys(PAI)) out[nome] = {pos:e.pos[nome], q:mul(e.G[nome], B.corr[nome].total)};
    return out;
  }
  /* pés sempre assentados: o giro do pé cancela o da perna, sobrando só a inclinação pedida */
  function peNoChao(rot, lado, inclina = 0, abre = 0){
    const q = junta(rot.quadril || UM, rot['coxa_' + lado] || UM, rot['canela_' + lado] || UM);
    rot['pe_' + lado] = junta(inv(q), Y(abre), X(inclina));
  }

  /* ---------------------------------------------------------------- braço com a mão num ponto escolhido */
  function quadroDe(direcao, dobradica){                            /* base com o osso e o eixo do cotovelo */
    const a = unit(direcao), h = unit(menos_(dobradica, vezes(a, escalar(dobradica, a))));
    return [a, h, cruzado(a, h)];
  }
  const deQuadroParaQuadro = (de, para) => mul(deColunas(...para), inv(deColunas(...de)));
  /* ombro, cotovelo e punho: dois ossos; "cotovelo" é para que lado ele aponta */
  function braco(lado, ombro, punho, cotovelo, maoQ, Gtorax){
    const B = preparar(), o1 = B.desloc['antebraco_' + lado], o2 = B.desloc['mao_' + lado];
    const a = Math.hypot(...o1), c = Math.hypot(...o2);
    let v = menos_(punho, ombro), d = Math.hypot(...v);
    const dir = unit(v); d = Math.max(Math.abs(a - c) + .02, Math.min(a + c - .004, d));
    const cosA = (a * a + d * d - c * c) / (2 * a * d), senA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    const lateral = unit(menos_(cotovelo, vezes(dir, escalar(cotovelo, dir))));
    const cot = mais(ombro, mais(vezes(dir, a * cosA), vezes(lateral, a * senA))), fim = mais(ombro, vezes(dir, d));
    let dob = cruzado(menos_(cot, ombro), menos_(fim, cot)); if (Math.hypot(...dob) < 1e-5) dob = [-1, 0, 0];
    const G1 = deQuadroParaQuadro(quadroDe(o1, [-1, 0, 0]), quadroDe(menos_(cot, ombro), dob));
    const G2 = deQuadroParaQuadro(quadroDe(o2, [-1, 0, 0]), quadroDe(menos_(fim, cot), dob));
    return {['braco_' + lado]:mul(inv(Gtorax), G1), ['antebraco_' + lado]:mul(inv(G1), G2), ['mao_' + lado]:mul(inv(G2), maoQ)};
  }
  /* o punho necessário para a empunhadura (ponto da mão) cair no alvo */
  const punhoPara = (alvo, maoQ, empunhadura) => menos_(alvo, girar(maoQ, empunhadura));

  /* ---------------------------------------------------------------- armas na mão */
  /* origem da arma na grade da mão: o mesmo ponto usado por armaNaMao() */
  function origemDaArma(id){
    const A = typeof ARMAS === 'object' && ARMAS[id], [w, d, h] = ESTRUTURA.mao_d.tam;
    if (!A) return [w / 2, d / 2, h / 2];
    if (A.vertical) return [-.55, -.45, h / 2 - .35];
    const fogo = A.baixa || ((A.tipo === 'militar' || A.tipo === 'gambiarra') && !A.branca && id !== 'faca_combate');
    /* armas de punho (fogo e bestas): o pulso fica atrás do cabo, na mesma altura, e o braço chega por trás.
       A junta da mão (grade [2, 2.5, 4]) cai no ponto u = -2.7, w = 0 da arma. */
    if (fogo) return [w / 2 + .35, d / 2 - 2.7, h];
    return [w / 2, d / 2, h / 2 - .35];
  }
  function classeDaArma(id){
    const A = typeof ARMAS === 'object' && ARMAS[id];
    if (!A) return null;
    if (A.vertical) return 'haste';
    if (A.longa === true) return 'longa';
    if ((A.tipo === 'militar' || A.tipo === 'gambiarra') && !A.branca && id !== 'faca_combate') return 'curta';
    return 'mao';
  }
  const E = () => ESCALA;
  const solto = lado => ({['braco_' + lado]:junta(Z(lado === 'e' ? .09 : -.09), X(.03)), ['antebraco_' + lado]:X(-.16), ['mao_' + lado]:UM});

  /* braços segurando a arma. Os alvos são pensados a partir do tronco, então acompanham o corpo ao andar */
  function bracosArmados(id, jeito, Gtorax, mods){
    const s = esqueleto({torax:Gtorax}), ombroD = s.pos.braco_d, ombroE = s.pos.braco_e, k = E();
    const empD = pontoDaPeca('mao_d', origemDaArma(id)), centroE = pontoDaPeca('mao_e', ESTRUTURA.mao_e.tam.map(v => v / 2));
    const altura = (ombroD[1] + ombroE[1]) / 2, meio = (ombroD[0] + ombroE[0]) / 2;
    const em = (lado, abaixo, frente) => [meio + lado * k, altura - abaixo * k, frente * k];
    const rot = {}, classe = classeDaArma(id);
    const doisBracos = (alvo, maoQ, apoio, cotD, cotE) => {
      Object.assign(rot, braco('d', ombroD, punhoPara(alvo, maoQ, empD), cotD, maoQ, Gtorax));
      if (apoio === null){ Object.assign(rot, solto('e')); return; }
      /* a mão de apoio foi desenhada no sistema da arma: a junta dela tem lugar certo ali, e a mão gira junto com a arma */
      const forma = typeof Maos === 'object' ? Maos.formaDeApoio(id, jeito === 'mirando' ? 'mirando' : 'guarda', mods) : null;
      let punhoE;
      if (forma){ const [u, v, w] = forma.junta; punhoE = mais(alvo, girar(maoQ, vezes(Maos.retoDaArma(id)(u, v, w), k))); }
      else punhoE = punhoPara(mais(alvo, girar(maoQ, [.8 * k, -.2 * k, apoio * k])), maoQ, centroE);
      Object.assign(rot, braco('e', ombroE, punhoE, cotE, maoQ, Gtorax));
    };
    if (jeito === 'mirando'){
      if (classe === 'curta') doisBracos(em(-1.8, -1.4, 14.5), UM, 0.2, [-1, -1, 0], [1, -1, 0]);
      else if (classe === 'longa') doisBracos(em(-3.6, 2.6, 8.4), Y(.03), 8.6, [-1, -1, -.2], [.6, -1, 0]);
      else if (classe === 'haste') doisBracos(em(-3, 7, 9), X(1.45), 9, [-1, -.6, -.4], [1, -.8, 0]);
      else doisBracos(em(-6.5, 1.5, 9), junta(Y(-.25), X(-.9)), null, [-1, -.7, -.3], null);
    } else if (jeito === 'mirando_uma') doisBracos(em(-4.8, -1.2, 15.5), UM, null, [-1, -1, 0], null);
    else {
      if (classe === 'longa') doisBracos(em(-4.2, 9.6, 6.4), junta(Y(.62), X(.5)), 7.6, [-1, -.5, -.5], [1, -.8, -.2]);
      else if (classe === 'curta') doisBracos(em(-8, 10.2, 8.2), junta(Y(-.05), X(.42)), null, [-.7, -.4, -1], null);
      else if (classe === 'haste') doisBracos(em(-10.6, 10.5, 6), junta(Z(-.05), X(.05)), null, [-.6, -.4, -1], null);
      else doisBracos(em(-9.8, 12.2, 5.4), junta(Y(-.12), X(-.62)), null, [-.7, -.2, -1], null);
    }
    return rot;
  }

  /* ---------------------------------------------------------------- poses prontas */
  function parado(arma, mods){
    const rot = {torax:UM, coxa_d:junta(Z(-.025), X(0)), coxa_e:Z(.025), ...solto('d'), ...solto('e')};
    if (arma){ const classe = classeDaArma(arma); const torax = classe === 'longa' ? Y(-.16) : UM; rot.torax = torax; if (classe === 'longa') rot.cabeca = Y(.12); Object.assign(rot, bracosArmados(arma, 'guarda', torax, mods)); }
    peNoChao(rot, 'd', 0, -.1); peNoChao(rot, 'e', 0, .1);
    return rot;
  }
  function mirar(arma, jeito, mods){
    const classe = classeDaArma(arma), uma = jeito === 'mirando_uma';
    const torax = uma ? junta(Y(.32), X(.03)) : classe === 'longa' ? junta(Y(-.5), X(.06)) : junta(Y(-.08), X(.05));
    const rot = {torax, cabeca:Y(uma ? -.32 : classe === 'longa' ? .48 : .08),
      /* base de apoio: perna esquerda à frente, direita atrás, joelhos um pouco dobrados */
      coxa_e:junta(Z(.06), X(-.32)), canela_e:X(.26), coxa_d:junta(Z(-.07), X(.2)), canela_d:X(.14),
      ...(arma ? bracosArmados(arma, jeito, torax, mods) : {...solto('d'), ...solto('e')})};
    peNoChao(rot, 'd', 0, -.35); peNoChao(rot, 'e', 0, .05);
    return rot;
  }
  /* um instante da passada. f = fase em radianos; corrida = 0 anda, 1 corre */
  function passada(f, corrida, arma, mods){
    const s = Math.sin(f), c = Math.cos(f), L = (a, b) => a + (b - a) * corrida;
    const rot = {};
    const gira = L(.07, .1) * s, inclina = L(.05, .24);
    rot.quadril = Y(-gira * .6); rot.cintura = Y(gira * .3); const torax = junta(Y(gira), X(inclina)); rot.torax = torax; rot.cabeca = junta(Y(-gira * .7), X(-inclina * .6));
    for (const [lado, sinal] of [['d', 1], ['e', -1]]){
      const ss = s * sinal, cc = c * sinal;
      const quadril_ = -L(.5, .78) * ss - L(0, .14);
      const balanco = Math.max(0, cc);                                  /* a perna que está indo para a frente */
      const joelho = L(.06, .22) + L(.95, 1.65) * Math.pow(balanco, 1.3) + L(.16, .3) * Math.max(0, -cc) * Math.max(0, Math.sin(2 * f) * sinal);
      rot['coxa_' + lado] = junta(Z(lado === 'd' ? -.02 : .02), X(quadril_)); rot['canela_' + lado] = X(joelho);
      /* o pé fica plano no apoio; no ar a ponta desce, e levanta um pouco antes de tocar o chão */
      const ponta = balanco * L(.28, .5) - Math.max(0, ss) * Math.max(0, 1 - balanco * 2) * .2;
      peNoChao(rot, lado, ponta, 0);
    }
    if (arma){
      /* armado: os braços seguram a arma e só acompanham o tronco */
      Object.assign(rot, bracosArmados(arma, 'guarda', torax, mods));
      if (classeDaArma(arma) !== 'longa' && classeDaArma(arma) !== 'haste'){            /* o braço livre continua balançando */
        rot.braco_e = junta(Z(L(.09, .14)), X(-L(.42, .9) * s)); rot.antebraco_e = X(-L(.24, 1.35) - L(.16, .25) * Math.max(0, s)); rot.mao_e = UM;
      }
    } else for (const [lado, sinal] of [['d', 1], ['e', -1]]){
      const ss = s * sinal;                                             /* o braço vai ao contrário da perna do mesmo lado */
      rot['braco_' + lado] = junta(Z((lado === 'd' ? -1 : 1) * L(.08, .14)), X(L(.4, .95) * ss));
      rot['antebraco_' + lado] = X(-L(.22, 1.4) - L(.2, .28) * Math.max(0, -ss));
      rot['mao_' + lado] = UM;
    }
    return rot;
  }
  function misturar(a, b, t){
    const out = {};
    for (const n of Object.keys(PAI)) out[n] = mistura(a[n] || UM, b[n] || UM, t);
    return out;
  }

  /* poses usadas pelo criador e pelo montador. null = usar a pose antiga */
  function daPose(nome, arma, mods){
    if (nome === 'descanso') return arma ? parado(arma, mods) : null;
    if (nome === 'andando') return passada(Math.PI * .5, 0, arma, mods);
    if (nome === 'mirando' || nome === 'mirando_uma') return mirar(arma, nome, mods);
    return null;
  }

  /* ---------------------------------------------------------------- desenho rápido para animar quadro a quadro */
  function animador(modelo, nomePose = 'andando'){
    const lista = p => typeof Maos === 'object' ? Maos.quadsDaPeca(p, nomePose) : p.quads;
    const B = preparar(), partes = modelo.pecas.filter(p => lista(p).length);
    let total = 0; for (const p of partes) total += lista(p).length * 6;
    const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), cor = new Float32Array(total * 3);
    const dados = []; let o = 0;
    for (const p of partes){
      const n = lista(p).length * 6, v = new Float32Array(n * 3), no = new Float32Array(n * 3); let i = 0;
      for (const q of lista(p)){ const c3 = rgb(q.cor).map(x => x / 255); for (const k of [0, 1, 2, 0, 2, 3]){ v.set(q.v[k], i); no.set(q.n, i); cor.set(c3, o + i); i += 3; } }
      dados.push({nome:p.nome, v, no, inicio:o}); o += n * 3;
    }
    const matriz = q => { const [x, y, z, w] = q; return [1 - 2*(y*y + z*z), 2*(x*y - z*w), 2*(x*z + y*w), 2*(x*y + z*w), 1 - 2*(x*x + z*z), 2*(y*z - x*w), 2*(x*z - y*w), 2*(y*z + x*w), 1 - 2*(x*x + y*y)]; };
    return {total, cor, pos, nor, atualizar(rot){
      const g = globais(rot); let chao = 1e9;
      for (const d of dados){
        const m = matriz(g[d.nome].q), [px, py, pz] = g[d.nome].pos, v = d.v, no = d.no, ini = d.inicio;
        for (let i = 0; i < v.length; i += 3){
          const a = v[i], b = v[i+1], c = v[i+2], y = m[3]*a + m[4]*b + m[5]*c + py;
          pos[ini+i] = m[0]*a + m[1]*b + m[2]*c + px; pos[ini+i+1] = y; pos[ini+i+2] = m[6]*a + m[7]*b + m[8]*c + pz;
          if (y < chao && (d.nome === 'pe_d' || d.nome === 'pe_e')) chao = y;
          const e = no[i], f = no[i+1], h = no[i+2];
          nor[ini+i] = m[0]*e + m[1]*f + m[2]*h; nor[ini+i+1] = m[3]*e + m[4]*f + m[5]*h; nor[ini+i+2] = m[6]*e + m[7]*f + m[8]*h;
        }
      }
      if (chao < 1e8) for (let i = 1; i < pos.length; i += 3) pos[i] -= chao;      /* o pé mais baixo encosta no chão */
    }};
  }

  return {globais, esqueleto, parado, mirar, passada, misturar, daPose, animador, classeDaArma, origemDaArma, pontoDaPeca};
})();
