/* Arena de combate: liga as regras (combate.js) ao estande em primeira pessoa.
   Desenha os zumbis peça por peça, enquadra o agarrão, mostra o estado do sobrevivente e os controles.
   Só entra em ação quando a página é aberta como tiro.html?combate. Carregado depois de combate.js. */
const Arena = (() => {
  const ativa = typeof location === 'object' && /(\?|&|#)combate/.test(location.search + location.hash);
  const $ = id => document.getElementById(id);
  const preso = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const puxa = (v, alvo, ritmo, dt) => v + (alvo - v) * (1 - Math.exp(-ritmo * dt));
  const angulo = a => Math.atan2(Math.sin(a), Math.cos(a));

  const CENARIOS = {
    treino:{nome:'Treino: um zumbi', zumbis:['comum']},
    dois:{nome:'Dois zumbis', zumbis:['comum', 'arrastado']},
    tres:{nome:'Três zumbis', zumbis:['comum', 'comum', 'arrastado']},
    corredor:{nome:'Corredores', zumbis:['corredor', 'corredor']},
    bruto:{nome:'Brutamontes', zumbis:['brutamontes']},
    horda:{nome:'Horda (6)', zumbis:['comum', 'comum', 'arrastado', 'arrastado', 'corredor', 'comum']},
    cerco:{nome:'Cerco: brutamontes e 4', zumbis:['brutamontes', 'comum', 'comum', 'corredor', 'arrastado']},
  };
  const ESTADOS = {
    saudavel:{nome:'Saudável', v:{}},
    doente:{nome:'Doente (leve)', v:{doenca:1}},
    cansado:{nome:'Ferido e cansado', v:{vida:60, folego:30}},
    doenteForte:{nome:'Doente (forte)', v:{doenca:2, folego:60}},
    grave:{nome:'Muito ferido', v:{vida:30, folego:45}},
  };

  let aguardando = false;                  /* ao abrir, a luta espera um clique */
  let api = null, m = null, cenario = 'treino', fim = 0, danoTela = 0, direcaoDano = 0, direcaoTempo = 0, fraco = {forca:1}, ritmoBase = 1;
  const modelos = {}, camera = {alto:1.62, rola:0, tremor:0};
  let carregado = null;

  /* ---------------------------------------------------------------- os modelos, uma peça de cada vez */
  function modelo(id){
    if (modelos[id]) return modelos[id];
    const c = configZumbi(id); c.zumbi.altura = 1;                              /* o tamanho entra na hora de desenhar */
    const mont = montar(c), pecas = [];
    for (const p of mont.pecas){
      if (!p.quads.length) continue;
      const k = [9, -9, 9, -9, 9, -9];
      for (const f of p.quads) for (const v of f.v) for (let i = 0; i < 3; i++){ k[i*2] = Math.min(k[i*2], v[i]); k[i*2+1] = Math.max(k[i*2+1], v[i]); }
      pecas.push({nome:p.nome, malha:api.malha(p.quads), caixa:k, quads:p.quads});
    }
    /* a que distância da junta do pé fica a sola */
    const g = Animacao.globais(Animacao.parado('nenhum', {}));
    let sola = 9; for (const p of pecas) if (/^pe_/.test(p.nome)) for (const f of p.quads) for (const v of f.v) sola = Math.min(sola, girar(g[p.nome].q, v)[1] + g[p.nome].pos[1]);
    return (modelos[id] = {pecas, sola:sola - Math.min(g.pe_d.pos[1], g.pe_e.pos[1])});
  }

  /* a posição de cada peça neste instante: guarda em z.partes {peca, t, q, s} */
  function posar(z, dt){
    const md = modelo(z.modelo), alvo = Combate.pose(z, m.tempo);
    const porCima = terceira() && m.jog.agarrado?.z === z && m.jog.agarrado.noChao;
    if (porCima){
      /* montado no sobrevivente: joelhos abertos no chão, o tronco deitado sobre o peito dele; cada aperto o empurra um pouco para cima */
      const g_ = m.jog.agarrado, empurra = g_.puxao || 0, morde = Math.max(0, Math.sin(m.tempo * 13)) * .6 + (g_.mordendo > 0 ? 1 : 0), treme = Math.sin(m.tempo * 17) * .06;
      const j_ = (x, y = 0, w = 0) => api.qm(api.qy(y), api.qm(api.qx(x), api.qz(w)));
      Object.assign(alvo.rot, {quadril:j_(0), cintura:j_(0), torax:j_(1.38 - empurra * .38 + morde * .08, treme), cabeca:j_(-.62 + morde * .22 - empurra * .3, treme * 2, treme),
        braco_d:j_(-1.75, 0, -.35), antebraco_d:j_(-1.25 + empurra * .5), mao_d:j_(-.3), braco_e:j_(-1.75, 0, .35), antebraco_e:j_(-1.25 + empurra * .5), mao_e:j_(-.3),
        coxa_d:j_(-1.22, 0, -.72), canela_d:j_(2.3), coxa_e:j_(-1.22, 0, .72), canela_e:j_(2.3), pe_d:j_(.45), pe_e:j_(.45)});
      alvo.tombo = 0; alvo.pressa = 20;
    }
    const k = 1 - Math.exp(-alvo.pressa * dt);
    z.rot = z.rot ? Animacao.misturar(z.rot, alvo.rot, k) : alvo.rot;
    z.tomboVisto = z.tomboVisto === undefined ? alvo.tombo : z.tomboVisto + (alvo.tombo - z.tomboVisto) * k;
    const g = Animacao.globais(z.rot), esc = z.t.escala, tombo = z.tomboVisto, deitado = preso(Math.abs(tombo) / 1.35, 0, 1);
    const chaoPe = Math.min(g.pe_d.pos[1], g.pe_e.pos[1]) + md.sola;
    const corpo_ = api.qm(api.qy(z.rumo), api.qx(tombo));
    const leva = p => api.girar(corpo_, [p[0] * esc, (p[1] - chaoPe) * esc, p[2] * esc]);
    /* deitado, o corpo não pode afundar no chão */
    let sobe = 0;
    if (deitado > .05){ let baixo = 9; for (const nome of ['quadril', 'torax', 'cabeca', 'mao_d', 'mao_e', 'pe_d', 'pe_e', 'canela_d', 'canela_e']) baixo = Math.min(baixo, leva(g[nome].pos)[1]); sobe = Math.max(0, (nomeBaixo(z) - baixo)) * deitado; }
    const meioCorpo = -Math.sin(tombo) * .82 * esc;
    let base = [z.x + Math.sin(z.rumo) * meioCorpo, sobe, z.z + Math.cos(z.rumo) * meioCorpo];
    /* agarrado: o corpo é levado até o rosto ficar bem na frente dos olhos, cada vez mais perto */
    const preso_ = !terceira() && m.jog.agarrado?.z === z ? m.jog.agarrado : null;
    z.enquadra = puxa(z.enquadra || 0, preso_ ? 1 : 0, preso_ ? 9 : 6, dt);
    if (z.enquadra > .01){
      const cabeca = mais(base, leva(mais(g.cabeca.pos, [0, .2, 0]))), olho = api.olho(), dir = api.direcao();
      const g_ = preso_ || z.ultimoAgarrao || {etapa:1, noChao:false, puxao:0, mordendo:0};
      const perto = g_.noChao ? .86 : g_.etapa === 1 ? .98 : g_.etapa === 2 ? .84 : .74;
      const bote = g_.mordendo > 0 ? Math.sin(preso(1 - g_.mordendo / .55, 0, 1) * Math.PI) * .09 : 0;
      const longe = perto - bote + (g_.puxao || 0) * .09;
      const treme = [Math.sin(m.tempo * 23) * .012, Math.sin(m.tempo * 31) * .009, 0];
      const quero = mais(mais(olho, vez(dir, longe)), mais(treme, [0, g_.noChao ? .03 : -.05 - bote * .15, 0]));
      base = base.map((v, i) => v + (quero[i] - cabeca[i]) * z.enquadra);
      z.ultimoAgarrao = g_;
    }
    if (porCima && meuCorpo){
      /* a altura vem do corpo de quem está embaixo: o quadril do zumbi senta no quadril do sobrevivente */
      const F = [Math.sin(api.jog.rumo), 0, Math.cos(api.jog.rumo)], empurra = m.jog.agarrado.puxao || 0;
      const assento = mais(meuCorpo.quadril, [F[0] * .03, .2 * esc + empurra * .035, F[2] * .03]);
      const alvoBase = tira(assento, leva(g.quadril.pos));
      z.montado = puxa(z.montado || 0, 1, 11, dt);                          /* desce de uma vez, sem teletransportar */
      base = base.map((v, i) => lerp(v, alvoBase[i], z.montado));
    } else z.montado = 0;
    z.partes = md.pecas.map(p => ({peca:p, t:mais(base, leva(g[p.nome].pos)), q:api.qm(corpo_, g[p.nome].q), s:esc}));
    z.centro = mais(base, leva(g.torax.pos));
    z.juntas = {quadril:mais(base, leva(g.quadril.pos)), cabeca:mais(base, leva(g.cabeca.pos)), joelhoD:mais(base, leva(g.canela_d.pos)), joelhoE:mais(base, leva(g.canela_e.pos))};
  }
  const nomeBaixo = z => z.rastejando || z.estado === 'caido' || z.estado === 'morto' || z.estado === 'morrendo' ? .1 : .06;
  const mais = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], tira = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vez = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

  function desenharZumbis(){
    if (terceira()) for (const p of minhasPartes) api.desenha(p.peca.malha, api.matriz(p.t, p.q), danoTela > .55 ? [1.35, .85, .82] : [1, 1, 1]);
    for (const z of m.zumbis){
      if (!z.partes || z.estado === 'morto' && z.tempo > 25) continue;
      const tinta = z.pisca > 0 ? [1.7, .75, .7] : $('avisoVisual').checked && z.estado === 'preparando' && Math.sin(m.tempo * 22) > 0 ? [1.45, 1.2, .75] : [1, 1, 1];
      for (const p of z.partes) api.desenha(p.peca.malha, api.matriz(p.t, p.q, [p.s, p.s, p.s]), tinta);
    }
  }
  /* o raio dos golpes testa cada peça no lugar em que está */
  function raio(o, d, melhor){
    for (const z of m.zumbis){
      if (!z.partes || !Combate.vivo(z)) continue;
      for (const p of z.partes){
        const inv = [-p.q[0], -p.q[1], -p.q[2], p.q[3]];
        const lo = vez(api.girar(inv, tira(o, p.t)), 1 / p.s), ld = vez(api.girar(inv, d), 1 / p.s);
        const r = api.raioCaixa(lo, ld, p.peca.caixa);
        if (r && r.t < melhor.t) melhor = {t:r.t, tipo:'zumbi', zumbi:z, peca:p.peca.nome, n:api.girar(p.q, r.n)};
      }
    }
    return melhor;
  }

  /* ---------------------------------------------------------------- o sobrevivente em terceira pessoa */
  const corpo = Terceira.criar(), sobreviventes = {};
  const terceira = () => $('camera').value !== 'primeira';
  function meuModelo(arma){
    if (sobreviventes[arma]) return sobreviventes[arma];
    const c = api.boneco(); c.arma = {...c.arma, estilo:arma}; c.modarma = {...c.modarma, mira:'nenhum', ponta:'nenhum', baixo:'nenhum', carregador:'nenhum'}; c.pose = 'andando';
    const mont = montar(c), pecas = [];
    for (const p of mont.pecas){ const quads = Maos.quadsDaPeca(p, 'andando'); if (quads.length) pecas.push({nome:p.nome, malha:api.malha(quads), quads}); }
    const g = Animacao.globais(Animacao.parado(null, {}));
    let sola = 9; for (const p of pecas) if (/^pe_/.test(p.nome)) for (const f of p.quads) for (const v of f.v) sola = Math.min(sola, girar(g[p.nome].q, v)[1] + g[p.nome].pos[1]);
    return (sobreviventes[arma] = {pecas, sola:sola - Math.min(g.pe_d.pos[1], g.pe_e.pos[1]), mods:c.modarma});
  }
  let minhasPartes = [], meuCorpo = null;
  function posarSobrevivente(dt){
    const est = api.estado(), jog = api.jog, armado = meuModelo(est.id);
    const q = Terceira.posar(corpo, dt, {jog, est, m, arma:est.id, mods:armado.mods});
    const md = q.semArma ? meuModelo('nenhum') : armado, g = Animacao.globais(q.rot);
    const tombo = q.tombo, deitado = preso(Math.abs(tombo) / 1.35, 0, 1);
    /* de pé, o pé mais baixo encosta no chão */
    const chaoPe = Math.min(g.pe_d.pos[1], g.pe_e.pos[1]) + md.sola;
    const q0 = api.qm(api.qy(jog.rumo), api.qx(tombo)), leva = p => api.girar(q0, [p[0], p[1] - chaoPe, p[2]]);
    let sobe = 0;
    if (deitado > .05){ let baixo = 9; for (const n of ['quadril', 'torax', 'cabeca', 'pe_d', 'pe_e', 'canela_d', 'canela_e']) baixo = Math.min(baixo, leva(g[n].pos)[1]); sobe = Math.max(0, .12 - baixo) * deitado; }
    const meioCorpo = -Math.sin(tombo) * .82, base = [jog.x + Math.sin(jog.rumo) * meioCorpo, sobe, jog.z + Math.cos(jog.rumo) * meioCorpo];
    minhasPartes = md.pecas.map(p => ({peca:p, t:mais(base, leva(g[p.nome].pos)), q:api.qm(q0, g[p.nome].q)}));
    meuCorpo = {quadril:mais(base, leva(g.quadril.pos)), torax:mais(base, leva(g.torax.pos)), cabeca:mais(base, leva(g.cabeca.pos))};
  }

  /* ---------------------------------------------------------------- começar uma luta */
  function comecar(id = cenario, estado = $('estadoJogador').value){
    cenario = id; m = Combate.criar(); fim = 0; aguardando = false; Object.assign(corpo, Terceira.criar()); delete corpo.cam; $('fimDeNovo').textContent = 'Lutar de novo'; danoTela = 0; direcaoTempo = 0;
    Object.assign(m.jog, ESTADOS[estado].v);
    const lista = CENARIOS[id].zumbis;
    lista.forEach((tipo, i) => {
      const col = lista.length === 1 ? 0 : (i % 3 - 1) * 2.1, linha = Math.floor(i / 3);
      m.zumbis.push(Combate.novoZumbi(tipo, col + (Math.random() - .5) * .6, 6.2 + linha * 2.2 + Math.random(), Math.PI + (Math.random() - .5)));
    });
    Object.assign(api.jog, {x:0, z:0, rumo:0, olha:-.06, tranco:0, alto:1.62, rola:0});
    camera.alto = 1.62; camera.rola = 0; camera.tremor = 0;
    api.limpar();
    if (!Primeira.ficha($('arma').value).golpes) $('arma').value = 'taco_pregos';
    api.pecas(); api.montarArma(); ritmoBase = api.estado().f.ritmo || 1; carregado = $('arma').value;
    $('fim').hidden = true;
    for (const z of m.zumbis) posar(z, 1);
    posarSobrevivente(1);
  }

  /* ---------------------------------------------------------------- antes de o braço se mexer: o que o jogador PODE fazer */
  function antes(dt, c){
    const j = m.jog, est = api.estado();
    if (carregado !== est.id){ carregado = est.id; ritmoBase = est.f.ritmo || 1; }
    if (j.agarrado){
      /* preso: o comando de atacar é o que solta */
      if (c.apertou || c.bater) Combate.lutar(m);
      c.atirar = c.apertou = c.mirar = c.bater = false; est.golpe = null; est.segurando = false;
    } else if (j.levantando > 0 || j.atordoado > 0 || j.morto){ c.atirar = c.apertou = c.mirar = c.bater = false; est.segurando = false; }
    c.correr = c.correr && j.folego > 8;
  }

  /* depois: golpes começados, acertos e o passo da luta */
  function depois(dt, c, eventos){
    const j = m.jog, est = api.estado(), jog = api.jog;
    if (aguardando){ for (const z of m.zumbis) posar(z, dt); posarSobrevivente(dt); return; }
    for (const ev of eventos) if (ev.tipo === 'golpe'){
      fraco = Combate.comecouGolpe(m, est.id, !!est.golpe?.forte);
      est.f.ritmo = ritmoBase * fraco.ritmo;
      if (fraco.fraco){ api.aviso('Sem fôlego: o golpe sai fraco', .9); api.tocar('ofegar'); }
    }
    if (j.esquiva > 0) api.andar(j.esqDir[0] * Combate.J.esquivaAnda / Combate.J.esquivaDura * dt, j.esqDir[1] * Combate.J.esquivaAnda / Combate.J.esquivaDura * dt);
    m.eventos.length = 0;
    const p = {x:jog.x, z:jog.z, rumo:jog.rumo, defendendo:est.f.tipo === 'golpe' && est.bloqueio > .35, correndo:c.correr, andando:c.andando > 0};
    Combate.passo(m, p, dt, z => api.empurrar(z, .3));
    jog.x = p.x; jog.z = p.z;
    /* o barulho de correr e de lutar chama quem está por perto */
    if (c.correr && c.andando && Math.random() < dt * 2) Combate.barulho(m, jog, 9);
    tratarEventos(m.eventos);
    efeitosDosCorpos();
    moverCamera(dt);
    if (terceira() && !j.agarrado && !j.morto){
      let perto = null, menor = 2.8;
      for (const z of m.zumbis) if (Combate.vivo(z)){ const d = Math.hypot(z.x - jog.x, z.z - jog.z), abre = Math.abs(angulo(Math.atan2(z.x - jog.x, z.z - jog.z) - jog.rumo)); if (d < menor && abre < 1.1){ menor = d; perto = z; } }
      jog.olha = puxa(jog.olha, perto ? Math.atan2((Combate.noChao(perto) ? .3 : 1.32) - 1.62, Math.max(.5, menor)) : -.08, 7, dt);
    }
    posarSobrevivente(dt);
    for (const z of m.zumbis) posar(z, dt);
    if (!fim && (j.morto || m.zumbis.every(z => !Combate.vivo(z)))) fim = .001;
    if (fim){ fim += dt; if (fim > (j.morto ? 1.5 : 2.2) && $('fim').hidden) mostrarFim(); }
    danoTela = Math.max(0, danoTela - dt * 1.5); direcaoTempo -= dt;
  }

  /* acertos dos golpes do jogador (vindos do estande) */
  function atingir(r, dano, dir, golpe){
    const z = r.zumbi, est = api.estado(), jog = api.jog;
    const h = est.golpe, forte = !!h?.forte, deArmaDeFogo = est.f.tipo === 'tiro';
    const res = Combate.acertar(m, z, r.peca, {arma:est.id, dano:dano / (forte && !deArmaDeFogo ? 1 : 1), forte, forca:fraco.forca, derruba:false,
      deFrente:h ? (/_e|soco_e/.test(h.nome) ? -3.5 : 3.5) : 0, tiro:!golpe});
    if (!res) return;
    api.tocar('carne', r.p, {cabeca:res.zona === 'cabeca', deTiro:!golpe, arma:est.id, forte});
    Efeitos.sangue(r.p, vez(dir, -1), (forte ? 1.7 : 1.1) * (res.zona === 'cabeca' ? 1.35 : 1) * (res.matou ? 1.3 : 1));
    /* um pouco do sangue segue o caminho da pancada */
    const praOnde = h && /_e|soco_e/.test(h.nome) ? -1 : 1;
    Efeitos.sangue(r.p, [Math.cos(jog.rumo) * praOnde, .25, -Math.sin(jog.rumo) * praOnde], forte ? .8 : .45);
    api.acertou(res.matou || res.zona === 'cabeca');
    api.tocar('zumbi', r.p, res.matou ? 'morte' : 'dor', !!z.t.bruto);
    camera.tremor = Math.max(camera.tremor, forte ? 1 : .45);
    if (res.matou) api.aviso(res.zona === 'cabeca' ? 'Na cabeça! Caiu de vez' : 'Caiu de vez', 1.1);
    else if (res.derrubou) api.aviso('Derrubado: aperte E para pisar', 1.6);
    else if (res.membro === 'perna') api.aviso('Perna quebrada: ele vai rastejar', 1.6);
    else if (res.membro === 'braco') api.aviso('Braço inutilizado: não consegue mais agarrar', 1.6);
    else if (res.cambaleou) api.aviso('Cambaleou: golpe agora', .8);
    if (golpe && Combate.desgastar(m, est.id, forte ? 2 : 1)) quebrar();
    /* o barulho da pancada chega aos outros */
    Combate.barulho(m, jog, deArmaDeFogo && !golpe ? 45 : 8);
    return res;
  }
  /* a pancada na parede também gasta a arma */
  function bateuNaParede(){ if (Combate.desgastar(m, api.estado().id, 1)) quebrar(); }
  function quebrar(){
    const nome = ARMAS[api.estado().id]?.nome || 'A arma';
    Efeitos.impacto(naFrente(.55, 1.15), [0, 1, 0], Efeitos.ehMetal(api.estado().id, api.estado().f) ? '#8F949C' : '#7A5A34', 1.5);
    api.tocar('quebrar'); api.aviso(nome + ' quebrou!', 2.2);
    $('arma').value = 'nenhum'; api.pecas(); api.montarArma(); carregado = 'nenhum'; ritmoBase = api.estado().f.ritmo || 1;
  }

  /* um ponto à frente do sobrevivente, onde a arma está */
  function naFrente(quanto, altura){
    if (!terceira()) return mais(api.olho(), mais(vez(api.direcao(), quanto + .25), [0, -.12, 0]));
    return [api.jog.x + Math.sin(api.jog.rumo) * quanto, altura, api.jog.z + Math.cos(api.jog.rumo) * quanto];
  }
  /* o sangue do sobrevivente; em 1ª pessoa são só uns pingos embaixo, para não tapar a tela */
  function meuSangue(forca, alto){
    if (!terceira() || !meuCorpo){ Efeitos.sangue(mais(api.olho(), mais(vez(api.direcao(), .62), [0, -.3, 0])), [Math.random() - .5, .1, Math.random() - .5], forca * .5, 'vivo', .4); return; }
    const p = meuCorpo.torax.map((v, i) => lerp(v, meuCorpo.cabeca[i], alto)), lado = Math.random() < .5 ? -1 : 1;
    Efeitos.sangue(p, [Math.cos(api.jog.rumo) * lado, .8, -Math.sin(api.jog.rumo) * lado], forca, 'vivo');
  }
  function faiscaDaDefesa(forca){
    const est = api.estado(); if (!Efeitos.ehMetal(est.id, est.f)) return;
    Efeitos.faisca(naFrente(.5, 1.45), [-Math.sin(api.jog.rumo), .3, -Math.cos(api.jog.rumo)], forca);
  }
  /* o que depende do tempo: a poça e a poeira de quando um corpo chega ao chão */
  function efeitosDosCorpos(){
    for (const z of m.zumbis) if (z.estado === 'morto' && !z.comPoca && z.centro){ z.comPoca = true; Efeitos.poca(z.centro); }
    if (m.jog.morto && !m.jog.comPoca && meuCorpo && fim > .9){ m.jog.comPoca = true; Efeitos.poca(meuCorpo.torax, 'vivo', 9); }
  }

  function tratarEventos(lista){
    for (const e of lista){
      const onde = e.z ? [e.z.x, 1.4, e.z.z] : null;
      if (e.tipo === 'ferido' || e.tipo === 'empurrao' || e.tipo === 'pisao') Terceira.avisar(corpo, e.tipo, e);
      if (e.tipo === 'ronco') api.tocar('zumbi', onde, 'ronco', !!e.z.t.bruto);
      else if (e.tipo === 'vaiAtacar') api.tocar('zumbi', onde, 'dor', !!e.z.t.bruto);
      else if (e.tipo === 'ferido'){ if (e.motivo !== 'mordida' && terceira()) meuSangue(.55, .15); danoTela = Math.min(1, danoTela + .35 + e.dano / 60); direcaoDano = e.lado; direcaoTempo = .9; camera.tremor = 1.3; api.tocar('dor'); }
      else if (e.tipo === 'defendeu'){ faiscaDaDefesa(.5); api.tocar('material', onde, api.estado().id); camera.tremor = .8; if (Combate.desgastar(m, api.estado().id, 1)) quebrar(); }
      else if (e.tipo === 'defesaNaHora'){ faiscaDaDefesa(1); api.tocar('material', onde, api.estado().id); api.aviso('Defesa na hora! Contra-ataque', 1.1); camera.tremor = .6; }
      else if (e.tipo === 'guardaQuebrada') api.aviso('Sem fôlego: a guarda abriu', 1.4);
      else if (e.tipo === 'empurrao'){ api.tocar('empurrao'); camera.tremor = .5; }
      else if (e.tipo === 'esquiva') api.tocar('ofegar');
      else if (e.tipo === 'agarrou'){ api.tocar('agarrado', onde); camera.tremor = 1; }
      else if (e.tipo === 'etapa'){ api.tocar('agarrado', onde); camera.tremor = .8; }
      else if (e.tipo === 'forcando'){ api.tocar('forca'); camera.tremor = Math.max(camera.tremor, .35); }
      else if (e.tipo === 'derrubou'){ Efeitos.queda([api.jog.x, 0, api.jog.z], 1.15, .3); api.tocar('queda'); camera.tremor = 1.6; api.aviso('Você foi derrubado!', 1.3); }
      else if (e.tipo === 'mordida'){ meuSangue(1.35, .6); api.tocar('mordida'); danoTela = 1; camera.tremor = 1.8; }
      else if (e.tipo === 'infeccao') api.aviso('A mordida infeccionou', 2.6);
      else if (e.tipo === 'soltou'){ api.tocar('empurrao'); api.aviso(`Soltou! Fôlego máximo −${(e.perdeu).toFixed(1).replace('.', ',')} (volta dormindo)`, 2.4); }
      else if (e.tipo === 'afastou') api.aviso('Ele recuou depois da mordida', 1.2);
      else if (e.tipo === 'trombou') api.tocar('material', onde, 'nenhum');
      else if (e.tipo === 'pisao'){ const cab = e.z.partes?.find(p => p.peca.nome === 'cabeca')?.t || [e.z.x, .15, e.z.z]; Efeitos.queda([cab[0], 0, cab[2]], .6, .2); Efeitos.sangue(cab, [0, 1, 0], 1.3, 'zumbi', .8, .2); api.tocar('carne', onde, {cabeca:true, arma:'marreta', forte:true}); camera.tremor = 1; if (e.r?.matou) api.aviso('Pisão: caiu de vez', 1.1); }
      else if (e.tipo === 'morreu' && !e.cabeca) api.tocar('zumbi', onde, 'morte', !!e.z.t.bruto);
      /* poeira quando o corpo bate no chão (quem já estava deitado não levanta pó) */
      if ((e.tipo === 'derrubado' || e.tipo === 'morreu') && Math.abs(e.z.tomboVisto || 0) < .7) Efeitos.queda([e.z.x, 0, e.z.z], e.z.t.bruto ? 1.3 : .85, e.tipo === 'morreu' ? .5 : .32);
    }
  }

  /* a câmera: cai quando é derrubado, balança com as pancadas e olha para quem agarrou */
  function moverCamera(dt){
    const j = m.jog, g = j.agarrado, jog = api.jog;
    const chao = g?.noChao || j.morto;
    camera.alto = puxa(camera.alto, chao ? .46 : j.levantando > 0 ? lerp(1.62, .7, j.levantando / Combate.G.levantar) : g && g.etapa >= 3 ? 1.55 : 1.62, chao ? 9 : 6, dt);
    camera.rola = puxa(camera.rola, j.morto ? .7 : chao ? .16 : g ? Math.sin(m.tempo * 6.3) * .05 + (g.puxao || 0) * .03 : 0, 7, dt);
    camera.tremor = Math.max(0, camera.tremor - dt * 4);
    const t = camera.tremor * .016;
    jog.alto = camera.alto; jog.rola = camera.rola + Math.sin(m.tempo * 47) * t;
    jog.tranco += Math.sin(m.tempo * 61) * t * .6;
    if (g) jog.olha = puxa(jog.olha, g.noChao ? .42 : g.etapa >= 3 ? -.1 : -.04, 5, dt);
    else if (j.morto) jog.olha = puxa(jog.olha, .5, 3, dt);
    else if (j.levantando > 0) jog.olha = puxa(jog.olha, -.08, 5, dt);
  }

  /* quanto o sobrevivente consegue andar agora */
  function passoDoJogador(frente, lado){
    const j = m.jog, g = j.agarrado;
    if (j.morto || g?.noChao || j.levantando > 0) return 0;
    let v = frente < 0 ? Combate.J.deCostas : frente === 0 && lado ? Combate.J.deLado : 1;
    if (g) v *= .42;                                   /* arrastando o zumbi junto */
    if (j.atordoado > 0) v *= .4;
    if (j.folego < Combate.J.cansado) v *= .8;
    return v;
  }

  /* ---------------------------------------------------------------- as mãos segurando o zumbi */
  let maosDeSegurar = null;
  function maos(){
    const g = m?.jog.agarrado; if (!g) return null;
    if (!maosDeSegurar) maosDeSegurar = api.maosAbertas();
    const empurra = g.puxao || 0, treme = Math.sin(m.tempo * 27) * .006, aperto = g.etapa >= 3 || g.noChao ? 1 : g.etapa === 2 ? .5 : 0;
    const um = lado => {
      const s = lado === 'd' ? -1 : 1;
      return {t:[s * (.2 - aperto * .035) + treme, (g.noChao ? -.2 : -.19) + empurra * .015 - treme, .4 - aperto * .06 + empurra * .1],
              q:api.qm(api.qy(s * -.35), api.qm(api.qz(s * .35), api.qx(-.25 - aperto * .15))), s:s > 0 ? [-1, 1, 1] : undefined,
              mao:maosDeSegurar, lado, cotovelo:[s * .55, -.72, -.4]};
    };
    return {preso:true, d:{t:[0, -2, .3], q:[0, 0, 0, 1]}, maoD:um('d'), e:um('e')};
  }

  /* ---------------------------------------------------------------- o que aparece na tela */
  let htmlAntes = '';
  function hud(){
    if (!m) return;
    const j = m.jog, est = api.estado(), cond = Combate.condicao(m), g = j.agarrado;
    $('barraVida').style.width = preso(j.vida, 0, 100) + '%';
    $('barraFolego').style.width = preso(j.folego, 0, 100) + '%';
    $('folegoPerdido').style.width = preso(100 - j.folegoMax, 0, 100) + '%';
    $('barraFolego').parentElement.classList.toggle('baixo', j.folego < Combate.J.cansado);
    const dura = Combate.resistencia(m, est.id);
    $('barraArma').style.width = dura * 100 + '%'; $('barraArma').parentElement.classList.toggle('baixo', dura < .25);
    $('agarrao').hidden = !g;
    if (g){ $('barraAgarrao').style.width = preso(g.forca, 0, 1) * 100 + '%'; $('etapaAgarrao').textContent = `Etapa ${g.etapa} de 4: ${Combate.ETAPAS[g.etapa]}`; $('agarrao').classList.toggle('chao', g.noChao); $('dicaAgarrao').textContent = g.cercado ? 'CLIQUE sem parar! Tem outros em cima' : 'CLIQUE (atacar) repetidamente para se soltar'; }
    const grave = j.vida < 35 ? .35 * (1 - j.vida / 35) + .12 : 0;
    $('danoTela').style.opacity = Math.min(.9, danoTela * .85 + grave).toFixed(2);
    $('danoDirecao').style.opacity = preso(direcaoTempo / .5, 0, 1); $('danoDirecao').style.transform = `rotate(${(-direcaoDano * 180 / Math.PI).toFixed(0)}deg)`;
    const vivos = m.zumbis.filter(Combate.vivo).length;
    const html = `<b>${cond.nome || Combate.CONDICOES[cond.id].nome}</b>${cond.motivos.length ? ' · ' + cond.motivos.join(', ') : ''}<br>Zumbis de pé: ${vivos} de ${m.zumbis.length}${j.mordidas ? ' · mordidas: ' + j.mordidas : ''}`;
    if (html !== htmlAntes){ htmlAntes = html; $('estadoTexto').innerHTML = html; $('estadoCaixa').dataset.cond = cond.id; $('condicao').textContent = Combate.CONDICOES[cond.id].nome; }
  }
  function mostrarFim(){
    const j = m.jog;
    $('fimTitulo').textContent = j.morto ? 'Você caiu' : 'Área limpa';
    $('fimTexto').textContent = `${m.abatidos} de ${m.zumbis.length} zumbis · vida ${Math.round(j.vida)} · fôlego máximo ${Math.round(j.folegoMax)} · mordidas ${j.mordidas}${j.infectado ? ' · INFECTADO' : ''}`;
    $('fim').hidden = false;
  }

  /* ---------------------------------------------------------------- controles */
  const dirPedida = teclas => [(teclas.has('w') ? 1 : 0) - (teclas.has('s') ? 1 : 0), (teclas.has('d') ? 1 : 0) - (teclas.has('a') ? 1 : 0)];
  const posDoJogador = () => ({x:api.jog.x, z:api.jog.z, rumo:api.jog.rumo});
  function empurrar(){ m.eventos.length = 0; Combate.empurrar(m, posDoJogador()); tratarEventos(m.eventos); }
  function esquivar(teclas){ m.eventos.length = 0; const [f, d] = dirPedida(teclas || new Set()); Combate.esquivar(m, posDoJogador(), f, d); tratarEventos(m.eventos); }
  function pisar(){ m.eventos.length = 0; if (!Combate.pisar(m, posDoJogador()) && !m.jog.agarrado) api.aviso('Ninguém no chão ao alcance', .8); tratarEventos(m.eventos); }
  /* devolve true se a tecla era da luta */
  function tecla(k, teclas){
    if (k === 'v'){ trocarCamera(); return true; }
    if (k === ' '){ esquivar(teclas); return true; }
    if (k === 'f'){ empurrar(); return true; }
    if (k === 'e'){ pisar(); return true; }
    if (k === 'r') return true;
    return false;
  }

  /* null = pelos olhos do personagem */
  function visao(dt){
    if (!terceira() || !m) return null;
    const v = Terceira.camera($('camera').value, api.jog, corpo, dt, !!(m.jog.agarrado?.noChao || m.jog.morto));
    const t = camera.tremor * .028;
    return {olho:[v.olho[0] + Math.sin(m.tempo * 47) * t, v.olho[1] + Math.sin(m.tempo * 61) * t, v.olho[2]], dir:v.dir};
  }
  function trocarCamera(){ const s = $('camera'); s.selectedIndex = (s.selectedIndex + 1) % s.options.length; aplicarCamera(); }
  function aplicarCamera(){
    document.body.classList.toggle('terceira', terceira());
    try { localStorage.setItem('wo-camera', $('camera').value); } catch (e){}
    delete corpo.cam;
  }

  /* ---------------------------------------------------------------- o lutador automático (demonstração) */
  const bot = {recarga:0, aperto:0, segura:0, descansa:false};
  function demo(dt){
    const j = m.jog, jog = api.jog, c = {atirar:false, apertou:false, mirar:false, recarregar:false, bater:false, andando:0, correr:false};
    if (aguardando) liberar();
    if (!$('fim').hidden){ bot.fim = (bot.fim || 0) + dt; if (bot.fim > 3){ bot.fim = 0; comecar(); } return c; }
    if (j.agarrado){ bot.aperto -= dt; if (bot.aperto <= 0){ bot.aperto = .17; c.apertou = c.atirar = true; } return c; }
    const vivos = m.zumbis.filter(Combate.vivo), d = z => Math.hypot(z.x - jog.x, z.z - jog.z);
    const z = vivos.sort((a, b) => d(a) - d(b))[0]; if (!z || j.morto) return c;
    const quer = Math.atan2(z.x - jog.x, z.z - jog.z);
    jog.rumo = angulo(jog.rumo + preso(angulo(quer - jog.rumo), -4.5 * dt, 4.5 * dt));
    jog.olha = puxa(jog.olha, Combate.noChao(z) ? -.75 : -.1, 5, dt);
    const ameaca = vivos.find(o => (o.estado === 'atacando' || o.estado === 'preparando' && o.tempo > o.dura - .22) && d(o) < 2);
    const alcance = api.estado().f.alcance || 1.5;
    if (j.folego < 22) bot.descansa = true; if (j.folego > 60) bot.descansa = false;
    bot.recarga -= dt;
    const anda = (frente) => { const v = 2.2 * passoDoJogador(frente, 0) * dt * frente; api.andar(Math.sin(jog.rumo) * v, Math.cos(jog.rumo) * v); c.andando = 1; };
    if (ameaca && ameaca.t.bruto){ if (j.esquiva <= 0) esquivar(new Set(['s'])); }
    else if (ameaca) c.mirar = true;
    else if (vivos.filter(o => o.estado === 'preparando' && d(o) < 1.6).length >= 2) empurrar();
    else if (vivos.some(o => Combate.noChao(o) && d(o) < 1.4) && j.folego > 30 && bot.recarga <= 0){ pisar(); bot.recarga = .8; }
    else if (bot.descansa){ if (d(z) < 2.4) anda(-1); }
    else if (d(z) < alcance + .05 && bot.recarga <= 0){ c.apertou = c.atirar = true; bot.recarga = .75; }
    else if (d(z) > alcance * .85) anda(1);
    return c;
  }

  /* ---------------------------------------------------------------- ligar */
  function esperarClique(){
    aguardando = true; $('fimTitulo').textContent = 'Pronto?';
    $('fimTexto').textContent = 'Defenda na hora, empurre, esquive e poupe o fôlego. Agarrado: clique sem parar.';
    $('fimDeNovo').textContent = 'Começar a lutar'; $('fim').hidden = false;
  }
  function liberar(){ aguardando = false; $('fim').hidden = true; $('fimDeNovo').textContent = 'Lutar de novo'; }
  function ligar(a){
    api = a;
    document.body.classList.add('arena');
    document.title = 'WO · Combate com zumbis';
    document.querySelector('h1').innerHTML = 'Combate <span>com zumbis</span>';
    for (const [id, c] of Object.entries(CENARIOS)) $('cenario').add(new Option(c.nome, id));
    for (const [id, e] of Object.entries(ESTADOS)) $('estadoJogador').add(new Option(e.nome, id));
    for (const [id, nome] of Object.entries(Terceira.CAMERAS)) $('camera').add(new Option(nome, id));
    let preferida = null; try { preferida = localStorage.getItem('wo-camera'); } catch (e){}
    const naUrl = (location.search.match(/camera=(\w+)/) || [])[1];
    $('camera').value = Terceira.CAMERAS[naUrl] ? naUrl : Terceira.CAMERAS[preferida] ? preferida : 'primeira';
    $('camera').addEventListener('change', () => { aplicarCamera(); $('camera').blur(); });
    $('cenario').value = cenario = 'treino';
    $('cenario').addEventListener('change', () => { comecar($('cenario').value); $('cenario').blur(); });
    $('estadoJogador').addEventListener('change', () => { comecar(); $('estadoJogador').blur(); });
    $('recomecar').addEventListener('click', () => { comecar(); $('recomecar').blur(); });
    $('fimDeNovo').addEventListener('click', () => { if (aguardando){ api.parar(); liberar(); } else comecar(); });
    $('dormir').addEventListener('click', () => { m.eventos.length = 0; if (Combate.dormir(m)) api.aviso('Você dormiu: o fôlego máximo voltou', 2); $('dormir').blur(); });
    const aperta = (id, fn) => $(id).addEventListener('pointerdown', ev => { ev.preventDefault(); api.parar(); fn(); });
    aperta('empurrarTela', empurrar); aperta('esquivarTela', () => esquivar()); aperta('pisarTela', pisar);
    $('arma').addEventListener('change', () => { carregado = null; });
    /* nesta arena a lista tem só armas de perto: contra zumbi a luta é corpo a corpo */
    for (const o of [...$('arma').options]) if (!Primeira.ficha(o.value).golpes) o.remove();
    for (const g of [...$('arma').querySelectorAll('optgroup')]) if (!g.children.length) g.remove();
    $('arma').value = 'taco_pregos';
    comecar('treino', 'saudavel');
    aplicarCamera();
    esperarClique();
  }

  return {ativa, medidas:() => ({meu:meuCorpo, zumbi:m?.jog.agarrado?.z.juntas}), visao, emTerceira:() => terceira(), CENARIOS, ESTADOS, ligar, comecar, antes, depois, atingir, bateuNaParede, raio, desenhar:desenharZumbis, maos, hud, tecla, demo, passoDoJogador, mundo:() => m};
})();
