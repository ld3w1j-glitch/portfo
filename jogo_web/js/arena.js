/* Arena de combate: liga as regras (combate.js) ao estande em primeira pessoa.
   Desenha os zumbis peça por peça, enquadra o agarrão, mostra o estado do sobrevivente e os controles.
   Só entra em ação quando a página é aberta como tiro.html?combate. Carregado depois de combate.js. */
const Arena = (() => {
  const naCena = typeof Cena === 'object' && Cena.ativa;                         /* tiro.html?cena: tudo junto */
  const ativa = naCena || typeof location === 'object' && /(\?|&|#)combate/.test(location.search + location.hash);
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
    livre:{nome:'Sem zumbis', zumbis:[]},
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
    if (!Combate.vivo(z) && z.partes){
      if (!z.rag){
        const longe = Math.atan2(z.x - api.jog.x, z.z - api.jog.z);
        z.rag = Ragdoll.criar(z.partes.map(p => ({nome:p.peca.nome, t:p.t, q:p.q})), z.impulso || {dir:[Math.sin(longe), .1, Math.cos(longe)], forca:1.6}, api.solidos());
        z.modeloDasPartes = z.partes.map(p => ({peca:p.peca, s:p.s}));
      }
      if (Ragdoll.passo(z.rag, dt) || !z.centro){
        z.partes = Ragdoll.pecas(z.rag).map((p, i) => ({...z.modeloDasPartes[i], t:p.t, q:p.q}));
        z.centro = Ragdoll.onde(z.rag, 'torax').slice(); z.x = z.centro[0]; z.z = z.centro[2]; z.tomboVisto = -1.5;
        z.juntas = {quadril:Ragdoll.onde(z.rag, 'quadril'), cabeca:Ragdoll.onde(z.rag, 'cabeca')};
      }
      return;
    }
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
    let base = [z.x + Math.sin(z.rumo) * meioCorpo, sobe + (z.alto || 0), z.z + Math.cos(z.rumo) * meioCorpo];
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
    if (terceira()){ desenharCorda3(); desenharHaste(); desenharRecarga3(); }
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
  const quadrilDe = {};
  /* altura do quadril com o personagem em pé (o parkour precisa dela) */
  function quadrilDePe(){
    const md = meuModelo('nenhum');
    if (quadrilDe.v === undefined){ const g = Animacao.globais(Animacao.parado(null, {})); quadrilDe.v = -(Math.min(g.pe_d.pos[1], g.pe_e.pos[1]) + md.sola); }
    return quadrilDe.v;
  }
  /* o que a cena única precisa do combate */
  const paraCena = () => ({
    quadril:quadrilDePe, terceira, passo:passoDoJogador, apontando:() => (corpo.apontar || 0) > .2,
    parado:() => paradoDe(api.estado().id),
    esquivar:() => esquivar(),
    dor:dano => { danoTela = Math.min(1, danoTela + .35 + dano / 60); camera.tremor = 1.5; api.tocar('dor'); },
    tremer:v => { camera.tremor = Math.max(camera.tremor, v); },
    tocar:(...a) => api.tocar(...a), aviso:(texto, t) => api.aviso(texto, t), estilhacar:o => estilhacar(o),
  });
  function paradoDe(id){
    const arma = id && !['nenhum', 'arco', 'estilingue', 'lanca', 'forcado'].includes(id) ? id : null, mods = meuModelo(id).mods;
    return {rot:Animacao.parado(arma, mods), arma, mods, livre:Animacao.parado(null, {})};
  }
  function meuModelo(arma, jeito = 'andando', semPente = false){
    const chave = arma + ':' + jeito + (semPente ? ':sem-pente' : '');
    if (sobreviventes[chave]) return sobreviventes[chave];
    const c = api.boneco(); c.arma = {...c.arma, estilo:arma}; c.modarma = {...c.modarma, mira:'nenhum', ponta:'nenhum', baixo:'nenhum', carregador:'nenhum'}; c.pose = jeito;
    const mont = montandoParte(semPente ? false : null, () => montar(c)), pecas = [];
    for (const p of mont.pecas){ const quads = Maos.quadsDaPeca(p, jeito); if (quads.length) pecas.push({nome:p.nome, malha:api.malha(quads), quads}); }
    const g = Animacao.globais(Animacao.parado(null, {}));
    let sola = 9; for (const p of pecas) if (/^pe_/.test(p.nome)) for (const f of p.quads) for (const v of f.v) sola = Math.min(sola, girar(g[p.nome].q, v)[1] + g[p.nome].pos[1]);
    return (sobreviventes[chave] = {pecas, sola:sola - Math.min(g.pe_d.pos[1], g.pe_e.pos[1]), mods:c.modarma});
  }
  const j_inteiro = () => !!(m.jog.agarrado || m.jog.morto || m.jog.levantando > 0);
  let armaDeCorda = null, hasteNaMao = null;
  /* a lança e o forcado: a mesma forma da arma, montada deitada ao longo de Z, e onde a mão de trás segura (em blocos) */
  const malhasDeHaste = {};
  const PEGA_ATRAS = -12.5;
  function malhaDeHaste(id){
    if (malhasDeHaste[id]) return malhasDeHaste[id];
    const q = [];
    comModificacoes(id, meuModelo(id).mods)((u0, u1, v0, v1, w0, w1, mat) => api.bloco(q, Math.min(v0, v1) * ESCALA, Math.max(v0, v1) * ESCALA, Math.min(w0, w1) * ESCALA, Math.max(w0, w1) * ESCALA, Math.min(u0, u1) * ESCALA, Math.max(u0, u1) * ESCALA, ARMA_CORES[mat] || mat));
    return (malhasDeHaste[id] = api.malha(q));
  }
  function desenharHaste(){
    const h = hasteNaMao; if (!h) return;
    const [x, y, z] = h.dir, giro = api.qm(api.qy(Math.atan2(x, z)), api.qx(-Math.asin(preso(y, -1, 1))));
    /* carregando, a mão segura perto do meio; lutando, a mão de trás desce para perto do fim do cabo */
    const pega = lerp(-3, PEGA_ATRAS, preso(h.pronto, 0, 1)) * ESCALA;
    api.desenha(malhaDeHaste(h.id), api.matriz(h.atras.map((v, i) => v - h.dir[i] * pega), giro));
  }
  let penteSolto = null, cartuchoNaMao = null;
  function desenharRecarga3(){
    if (cartuchoNaMao) api.cubo(cartuchoNaMao.p, cartuchoNaMao.q, [.04, .04, .09], '#D9A636', 0);
    const x = penteSolto; if (!x) return;
    api.desenha(x.P.malha, api.matriz(x.t, x.q));
    if (x.visto) api.cubo(x.topo, x.q, x.comMunicao ? [.04, .03, .055] : [.045, .008, .065], x.comMunicao ? '#D9A636' : '#0E0E10', 0);
  }

  /* o arco e o estilingue, em blocos, desenhados entre as duas mãos */
  function desenharCorda3(){
    const a = armaDeCorda; if (!a) return;
    const {segura:G, puxa:H, f, cima} = a, lado = [f[1] * cima[2] - f[2] * cima[1], f[2] * cima[0] - f[0] * cima[2], f[0] * cima[1] - f[1] * cima[0]];
    const em = (u, v = 0, w = 0) => [G[0] + cima[0] * u + f[0] * v + lado[0] * w, G[1] + cima[1] * u + f[1] * v + lado[1] * w, G[2] + cima[2] * u + f[2] * v + lado[2] * w];
    const treme = Math.sin(m.tempo * 90) * .012 * (a.vibra || 0);
    const puxado = a.naCorda && a.apontar > .5;
    if (a.tipo === 'arco'){
      const quanto = puxado ? preso((Math.hypot(H[0] - G[0], H[1] - G[1], H[2] - G[2]) - .15) / .4, 0, 1) : 0;
      /* as hastes curvam para trás, mais ainda quando a corda está puxada */
      const ponto = s => em(s * (.56 - .035 * quanto), .035 - s * s * (.085 + .11 * quanto));
      for (let i = -6; i < 6; i++){ const s0 = i / 6, s1 = (i + 1) / 6, meio = Math.abs(s0 + s1) / 2; api.risco(ponto(s0), ponto(s1), .045 - meio * .022, meio < .17 ? '#3B2A1C' : meio < .6 ? '#8A5E33' : '#6E4B2C', 0); }
      const alto = ponto(1), baixo = ponto(-1), nock = puxado ? H : em(treme, -.05 - .085);
      api.risco(alto, nock, .008, '#E6DEC6', 0); api.risco(nock, baixo, .008, '#E6DEC6', 0);
      const flecha = (de, dir) => { const p = k => [de[0] + dir[0] * k, de[1] + dir[1] * k, de[2] + dir[2] * k]; api.risco(de, p(.7), .016, '#B99366', 0); api.risco(p(.66), p(.76), .032, '#9AA0A8', 0); api.risco(p(.02), p(.13), .05, '#C0362C', 0); };
      if (puxado){ const d = G.map((v, i) => v - H[i]), n = Math.hypot(...d) || 1; flecha(H, d.map(v => v / n)); }
      else if (a.naMao){ const d = G.map((v, i) => v - H[i] + cima[i] * .25), n = Math.hypot(...d) || 1; flecha(H, d.map(v => v / n)); }
    } else {
      api.risco(em(-.13), em(.035), .042, '#6E4B2C', 0);
      const pontas = [-1, 1].map(s => em(.15, .01, s * .062));
      for (const [i, s] of [-1, 1].entries()){ api.risco(em(.03), em(.075, .005, s * .06), .034, '#7A5430', 0); api.risco(em(.07, .005, s * .06), pontas[i], .03, '#6E4B2C', 0); }
      const bolsa = puxado ? H : em(.075 + treme * 2, -.05);
      for (const p of pontas) api.risco(p, bolsa, .012, '#C29A55', 0);
      api.cubo(bolsa, null, [.042, .042, .03], '#1C1B1A', 0);
      if (a.naMao || puxado) api.cubo(puxado ? bolsa.map((v, i) => v + f[i] * .018) : H, null, [.035, .035, .035], '#8A8F96', 0);
    }
  }
  let meuRag = null;
  let minhasPartes = [], meuCorpo = null, maoDaArma = null, camMira = null, miraPeso = 0;
  /* a ponta do cano vista de fora: a partir da mão, para onde ele está olhando */
  function boca3(){
    if (terceira() && armaDeCorda) return mais(armaDeCorda.segura, [armaDeCorda.f[0] * .3, armaDeCorda.f[1] * .3 + .05, armaDeCorda.f[2] * .3]);
    if (!terceira() || !maoDaArma) return null;
    const est = api.estado(), comprido = ((est.medida?.boca?.[0] || 6) + 2.7) * ESCALA, d = api.direcao();
    return mais(maoDaArma, [d[0] * comprido, d[1] * comprido + .035, d[2] * comprido]);
  }
  function posarSobrevivente(dt){
    if (m.jog.morto && minhasPartes.length){
      if (!meuRag){
        const r = api.jog.rumo;
        meuRag = {corpo:Ragdoll.criar(minhasPartes.map(p => ({nome:p.peca.nome, t:p.t, q:p.q})), {dir:[-Math.sin(r), .15, -Math.cos(r)], forca:2.4}, api.solidos()), pecas:minhasPartes.map(p => p.peca)};
      }
      Ragdoll.passo(meuRag.corpo, dt);
      minhasPartes = Ragdoll.pecas(meuRag.corpo).map((p, i) => ({peca:meuRag.pecas[i], t:p.t, q:p.q}));
      meuCorpo = {quadril:Ragdoll.onde(meuRag.corpo, 'quadril').slice(), torax:Ragdoll.onde(meuRag.corpo, 'torax').slice(), cabeca:Ragdoll.onde(meuRag.corpo, 'cabeca').slice()};
      armaDeCorda = null; hasteNaMao = null; maoDaArma = null;
      return;
    }
    const est = api.estado(), jog = api.jog, armado = meuModelo(est.id);
    const q = Terceira.posar(corpo, dt, {jog, est, m, arma:est.id, mods:armado.mods, recarga:api.recarga()});
    const junto = naCena ? Cena.compor(dt, q, corpo, {jog, est, m}) : null;
    const semArma = junto ? junto.semArma : q.semArma, rumo = junto ? junto.rumo : jog.rumo;
    const deCorda = !!q.corda && (!junto || ['chao', 'ar'].includes(Cena.estado().modo) && !j_inteiro());
    const deHaste = !!q.haste && (!junto || ['chao', 'ar'].includes(Cena.estado().modo) && !j_inteiro());
    /* trocando o pente: a arma é desenhada sem ele, e ele à parte */
    const noChaoOuNoAr = !junto || ['chao', 'ar'].includes(Cena.estado().modo);
    const recarga = q.recarga && noChaoOuNoAr && !j_inteiro() && !semArma ? q.recarga : null, soltoDaArma = recarga?.pente ? api.recarga() : null;
    const md = semArma || q.corda || q.haste ? meuModelo('nenhum') : soltoDaArma ? meuModelo(est.id, 'andando', true) : q.apontando > .5 ? meuModelo(est.id, 'mirando') : armado, g = Animacao.globais(junto ? junto.rot : q.rot);
    const tombo = junto ? junto.tombo : q.tombo, deitado = preso(Math.abs(tombo) / 1.35, 0, 1);
    /* de pé, o pé mais baixo encosta no chão */
    const chaoPe = Math.min(g.pe_d.pos[1], g.pe_e.pos[1]) + md.sola;
    const solto = !!junto && junto.yQuadril !== null;                        /* no ar, pendurado: quem manda é o quadril */
    const q0 = api.qm(api.qy(rumo), api.qx(tombo)), leva = p => api.girar(q0, [p[0], p[1] - (solto ? 0 : chaoPe), p[2]]);
    let sobe = 0;
    if (deitado > .05){ let baixo = 9; for (const n of ['quadril', 'torax', 'cabeca', 'pe_d', 'pe_e', 'canela_d', 'canela_e']) baixo = Math.min(baixo, leva(g[n].pos)[1]); sobe = Math.max(0, .12 - baixo) * deitado; }
    const alturaPes = junto ? Cena.assentar(dt, junto, chaoPe) + (solto ? 0 : chaoPe) : 0;
    const meioCorpo = -Math.sin(tombo) * .82, base = [jog.x + Math.sin(rumo) * meioCorpo, sobe + alturaPes, jog.z + Math.cos(rumo) * meioCorpo];
    minhasPartes = md.pecas.map(p => ({peca:p, t:mais(base, leva(g[p.nome].pos)), q:api.qm(q0, g[p.nome].q)}));
    meuCorpo = {quadril:mais(base, leva(g.quadril.pos)), torax:mais(base, leva(g.torax.pos)), cabeca:mais(base, leva(g.cabeca.pos))};
    maoDaArma = semArma || q.corda || q.haste ? null : mais(base, leva(g.mao_d.pos));
    armaDeCorda = null; hasteNaMao = null; penteSolto = null; cartuchoNaMao = null;
    if (recarga && (soltoDaArma || recarga.cartucho?.naMao)){
      const esq = Animacao.esqueleto(junto ? junto.rot : q.rot);
      const daMao = (lado, v) => { const p = girar(esq.G['mao_' + lado], v), o = esq.pos['mao_' + lado]; return mais(base, leva([o[0] + p[0], o[1] + p[1], o[2] + p[2]])); };
      const naPalma = daMao('e', Animacao.pontoDaPeca('mao_e', ESTRUTURA.mao_e.tam.map(v => v / 2))), giroArma = api.qm(q0, esq.G.mao_d);
      if (soltoDaArma){
        const P = soltoDaArma, p = recarga.pente, presoNaArma = [p.de, p.ate].every(n => n === 'arma' || n === 'fora');
        const quanto = presoNaArma ? lerp(p.de === 'fora' ? 1 : 0, p.ate === 'fora' ? 1 : 0, p.t) : 0;
        const centro = presoNaArma ? daMao('d', mais(P.c, vez(P.baixo, .15 * quanto))) : naPalma;
        penteSolto = {P, t:tira(centro, api.girar(giroArma, P.c)), q:giroArma, topo:mais(centro, api.girar(giroArma, vez(P.baixo, -P.h[1] - .012))), visto:p.u > .13, comMunicao:p.novo || !p.vazio};
      } else cartuchoNaMao = {p:naPalma, q:giroArma};
    }
    if (deHaste){
      const esq = Animacao.esqueleto(junto ? junto.rot : q.rot);
      const pega = lado => { const centro = Animacao.pontoDaPeca('mao_' + lado, ESTRUTURA['mao_' + lado].tam.map(v => v / 2)), p = girar(esq.G['mao_' + lado], centro), o = esq.pos['mao_' + lado]; return mais(base, leva([o[0] + p[0], o[1] + p[1], o[2] + p[2]])); };
      const atras = pega('d'), frente = pega('e'), solta = api.girar(q0, q.haste.dir);
      /* com as duas mãos no cabo, ele passa exatamente pelas duas */
      const junta_ = preso((q.haste.pronto - .45) / .45, 0, 1), maos = tira(frente, atras), n = Math.hypot(...maos) || 1;
      let dir = solta.map((v, i) => lerp(v, maos[i] / n, junta_)); const nd = Math.hypot(...dir) || 1; dir = dir.map(v => v / nd);
      hasteNaMao = {id:q.haste.id, atras, dir, pronto:q.haste.pronto};
    }
    if (deCorda){
      /* onde cada mão segura, na pose que está na tela */
      const esq = Animacao.esqueleto(junto ? junto.rot : q.rot);
      const pega = lado => { const centro = Animacao.pontoDaPeca('mao_' + lado, ESTRUTURA['mao_' + lado].tam.map(v => v / 2)), p = girar(esq.G['mao_' + lado], centro), o = esq.pos['mao_' + lado]; return mais(base, leva([o[0] + p[0], o[1] + p[1], o[2] + p[2]])); };
      const olhando = api.direcao(), aponta = q.corda.apontar, reto = [Math.sin(rumo), 0, Math.cos(rumo)];
      let f = reto.map((v, i) => lerp(v, olhando[i], aponta)); const n = Math.hypot(...f) || 1; f = f.map(v => v / n);
      let cima = [-f[0] * f[1], 1 - f[1] * f[1], -f[2] * f[1]]; const nc = Math.hypot(...cima) || 1; cima = cima.map(v => v / nc);
      if (q.corda.tomba){ const c_ = Math.cos(q.corda.tomba), s_ = Math.sin(q.corda.tomba), cf = f.map((v, i) => v * c_ - cima[i] * s_), cc = cima.map((v, i) => v * c_ + f[i] * s_); f = cf; cima = cc; }
      armaDeCorda = {...q.corda, segura:pega('e'), puxa:pega('d'), f, cima};
    }
  }

  /* ---------------------------------------------------------------- começar uma luta */
  function comecar(id = cenario, estado = $('estadoJogador').value){
    cenario = id; meuRag = null; minhasPartes = []; m = Combate.criar(); fim = 0; aguardando = false; Object.assign(corpo, Terceira.criar()); delete corpo.cam; $('fimDeNovo').textContent = 'Lutar de novo'; danoTela = 0; direcaoTempo = 0;
    Object.assign(m.jog, ESTADOS[estado].v);
    const lista = CENARIOS[id].zumbis;
    lista.forEach((tipo, i) => {
      const col = lista.length === 1 ? 0 : (i % 3 - 1) * 2.1, linha = Math.floor(i / 3);
      m.zumbis.push(Combate.novoZumbi(tipo, col + (Math.random() - .5) * .6, 6.2 + linha * 2.2 + Math.random(), Math.PI + (Math.random() - .5)));
    });
    Object.assign(api.jog, {x:0, z:0, rumo:0, olha:-.06, tranco:0, alto:1.62, rola:0});
    camera.alto = 1.62; camera.rola = 0; camera.tremor = 0;
    api.limpar();
    if (naCena){ api.jog.y = 0; Cena.reiniciar(api.jog); m.abrigo = Cena.abrigoDoCombate(); avisoBarreira = -9; }
    else if (!Primeira.ficha($('arma').value).golpes) $('arma').value = 'taco_pregos';
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
    if (naCena && !aguardando) Cena.mover(dt, {jog:api.jog, est, m, teclas:api.teclas(), c, combate:paraCena()});
  }

  /* depois: golpes começados, acertos e o passo da luta */
  function depois(dt, c, eventos){
    const j = m.jog, est = api.estado(), jog = api.jog;
    if (aguardando){ for (const z of m.zumbis) posar(z, dt); posarSobrevivente(dt); return; }
    /* só arma de fogo chama os outros. Arco, besta, estilingue, lança e as demais armas feitas à mão são silenciosas */
    if (eventos.some(ev => ev.tipo === 'disparo') && fazBarulho(est.f)) Combate.barulho(m, jog, 45);
    for (const ev of eventos) if (ev.tipo === 'golpe'){
      fraco = Combate.comecouGolpe(m, est.id, !!est.golpe?.forte);
      est.f.ritmo = ritmoBase * fraco.ritmo;
      if (fraco.fraco){ api.aviso('Sem fôlego: o golpe sai fraco', .9); api.tocar('ofegar'); }
    }
    if (foraDoChao()) j.esquiva = 0;                                  /* pulou no meio da esquiva: ela acaba ali */
    if (j.esquiva > 0) api.andar(j.esqDir[0] * Combate.J.esquivaAnda / Combate.J.esquivaDura * dt, j.esqDir[1] * Combate.J.esquivaAnda / Combate.J.esquivaDura * dt);
    m.eventos.length = 0;
    const alto = naCena && (jog.y || 0) > .8;
    const p = {x:jog.x, z:jog.z, y:naCena ? Cena.estado()?.piso ?? Cena.estado()?.y ?? 0 : 0, alto, rumo:jog.rumo, defendendo:est.f.tipo === 'golpe' && est.bloqueio > .35, correndo:c.correr, andando:c.andando > 0};
    Combate.passo(m, p, dt, z => api.empurrar(z, .3));
    jog.x = p.x; jog.z = p.z;
    if (naCena) Cena.depois(dt, {jog, m, combate:paraCena()});
    /* o barulho de correr e de lutar chama quem está por perto */
    if (c.correr && c.andando && Math.random() < dt * 2) Combate.barulho(m, jog, 9);
    tratarEventos(m.eventos);
    efeitosDosCorpos();
    moverCamera(dt);
    if (terceira() && !j.agarrado && !j.morto && est.f.tipo !== 'tiro'){
      let perto = null, menor = 2.8;
      for (const z of m.zumbis) if (Combate.vivo(z)){ const d = Math.hypot(z.x - jog.x, z.z - jog.z), abre = Math.abs(angulo(Math.atan2(z.x - jog.x, z.z - jog.z) - jog.rumo)); if (d < menor && abre < 1.1){ menor = d; perto = z; } }
      jog.olha = puxa(jog.olha, perto ? Math.atan2((Combate.noChao(perto) ? .3 : 1.32) - 1.62, Math.max(.5, menor)) : -.08, 7, dt);
    }
    posarSobrevivente(dt);
    for (const z of m.zumbis) posar(z, dt);
    if (!fim && (j.morto || !naCena && m.zumbis.every(z => !Combate.vivo(z)))) fim = .001;
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
    if (res.matou){ const deTiro = deArmaDeFogo && !golpe; z.impulso = {dir:[dir[0], Math.max(.12, dir[1] + .1), dir[2]], forca:deTiro ? 3.4 : forte ? 4.8 : 3.1}; }
    if (res.matou) api.aviso(res.zona === 'cabeca' ? 'Na cabeça! Caiu de vez' : 'Caiu de vez', 1.1);
    else if (res.derrubou) api.aviso('Derrubado: aperte E para pisar', 1.6);
    else if (res.membro === 'perna') api.aviso('Perna quebrada: ele vai rastejar', 1.6);
    else if (res.membro === 'braco') api.aviso('Braço inutilizado: não consegue mais agarrar', 1.6);
    else if (res.cambaleou) api.aviso('Cambaleou: golpe agora', .8);
    if (golpe && Combate.desgastar(m, est.id, forte ? 2 : 1)) quebrar();
    return res;
  }
  const fazBarulho = f => f.tipo === 'tiro' && f.modo !== 'flecha' && f.modo !== 'besta';
  /* golpe, tiro ou flecha num vidro: quebra, e o barulho do vidro chama quem está perto */
  function pancadaNoVidro(p){
    const o = Cena.abrigo()?.acertarVidro(p); if (!o) return;
    estilhacar(o); Combate.barulho(m, api.jog, 12);
  }
  function estilhacar(o){
    const normal = [o.nx, 0, o.nz];
    for (const [a, y] of [[-.3, .7], [.05, .45], [.3, .62], [-.1, .3]]) Efeitos.impacto([o.x + (o.eixo === 'x' ? a * o.l : 0), o.sill + o.h * y, o.z + (o.eixo === 'z' ? a * o.l : 0)], normal, '#BFE0F0', .9);
    api.tocar('material', [o.x, o.sill + o.h / 2, o.z], 'frigideira'); api.aviso('O vidro quebrou', 1.1);
  }
  /* o zumbi batendo na porta ou na janela */
  let avisoBarreira = 0;
  function naBarreira({z, o, res}){
    const onde = [o.x, 1.3, o.z], janela = o.tipo === 'janela', nome = janela ? 'a janela' : 'a porta';
    if (res.alvo === 'vidro'){ if (res.caiu) estilhacar(o); else api.tocar('material', onde, 'frigideira'); return; }
    if (res.alvo === 'nada') return;
    api.tocar('material', onde, res.dano ? 'marreta' : 'taco_pregos');
    if (res.dano){
      Efeitos.impacto([o.x - o.nx * .16, 1.2 + (z.semente - .5) * .5, o.z - o.nz * .16], [-o.nx, 0, -o.nz], '#9A6F44', 1.4);
      camera.tremor = Math.max(camera.tremor, Math.hypot(o.x - api.jog.x, o.z - api.jog.z) < 6 ? .8 : .2);
      api.aviso(res.caiu ? 'O grandalhão arrebentou ' + nome + '!' : 'O grandalhão está arrebentando ' + nome + ' (' + res.resta + '/' + Cena.abrigo().NUM[res.alvo === 'porta' ? 'porta' : 'tabuas'] + ')', 1.6);
    } else if (m.tempo - avisoBarreira > 7){ avisoBarreira = m.tempo; api.aviso('Eles batem, mas não conseguem arrebentar ' + nome, 1.6); }
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
      else if (e.tipo === 'barreira') naBarreira(e);
      else if (e.tipo === 'esquivaCedo') api.aviso('Ainda não dá para esquivar de novo', .6);
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

  /* na cena, os zumbis são soltos na hora que se quiser */
  /* atalhos para testar o abrigo: entrar na primeira casa e trazer zumbis para a porta dela */
  function irParaOAbrigo(){
    const casa = Cena.casas()[0], comodo = Casas.PLANTAS[casa.planta].comodos[0], jog = api.jog;
    const cx = casa.x + (comodo.x0 + comodo.x1) / 2, cz = casa.z + (comodo.z0 + comodo.z1) / 2;
    const livre = (x, z) => !Cena.CAIXAS.some(k => k.y0 < 1.2 && k.y1 > .45 && x > k.x0 - .36 && x < k.x1 + .36 && z > k.z0 - .36 && z < k.z1 + .36);
    for (let r = 0; r < 2.4; r += .2) for (let a = 0; a < 6.28; a += .5){
      const x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r;
      if (livre(x, z)){ jog.x = x; jog.z = z; jog.rumo = 0; jog.y = 0; const e = Cena.estado(); if (e){ Object.assign(e, {x, z, y:0, piso:0, modo:'chao', acao:null}); e.rumo = e.loco.rumo = 0; e.loco.vel = 0; } api.aviso('Dentro da casa: tape as janelas (E)', 2); return true; }
    }
    return false;
  }
  function naCasa(tipos){
    const casa = Cena.casas()[0], frente = casa.z + casa.d / 2;
    const lugares = [[-2.2, 2.4], [2.6, 3.0], [.3, 3.8], [-4.4, 2.2], [4.6, 2.0], [-.9, 5.0]];
    for (const [i, tipo] of tipos.entries()){
      const [dx, dz] = lugares[(i + m.zumbis.length) % lugares.length], z = Combate.novoZumbi(tipo, casa.x + dx, frente + dz, Math.PI);
      Combate.muda(z, 'alerta', .6 + Math.random() * .6); m.zumbis.push(z);
    }
    if (m.zumbis.length > 24) m.zumbis.splice(0, m.zumbis.length - 24);
  }

  function soltar(tipos){
    for (const [i, tipo] of tipos.entries()) m.zumbis.push(Combate.novoZumbi(tipo, 1.4 + (i % 3) * 1.6 + (Math.random() - .5) * .5, 15.2 + Math.floor(i / 3) * 1.7 + Math.random() * .6, Math.PI + (Math.random() - .5)));
    if (m.zumbis.length > 24) m.zumbis.splice(0, m.zumbis.length - 24);
  }
  const tirarZumbis = () => { m.zumbis.length = 0; m.jog.agarrado = null; };

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
  /* a esquiva precisa dos pés no chão: pulando, escalando, na corda ou caído não dá */
  const foraDoChao = () => naCena && Cena.ocupado();
  function esquivar(teclas){ if (foraDoChao()) return; m.eventos.length = 0; const [f, d] = dirPedida(teclas || new Set()); Combate.esquivar(m, posDoJogador(), f, d); tratarEventos(m.eventos); }
  function pisar(){ m.eventos.length = 0; if (!Combate.pisar(m, posDoJogador()) && !m.jog.agarrado) api.aviso('Ninguém no chão ao alcance', .8); tratarEventos(m.eventos); }
  /* devolve true se a tecla era da luta */
  function tecla(k, teclas, repetida){
    if (naCena){
      if (aguardando) liberar();
      if (Cena.tecla(k, repetida, {esquivar:() => esquivar(teclas), m})) return true;
      if (k === 'r') return false;                                       /* na cena há arma de fogo: R recarrega */
    }
    if (repetida) return false;
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
    const t = camera.tremor * .028, est = api.estado(), jog = api.jog;
    const quer = $('camera').value === 'ombro' && est.f.tipo === 'tiro' && !m.jog.agarrado && !m.jog.morto && !(naCena && Cena.ocupado()) ? preso(est.mira * 1.15, 0, 1) : 0;
    miraPeso = puxa(miraPeso, quer, 16, dt);
    let olho = v.olho, dir = v.dir; camMira = null;
    if (miraPeso > .01){
      const d = api.direcao(), F = [Math.sin(jog.rumo), 0, Math.cos(jog.rumo)], D = [-Math.cos(jog.rumo), 0, Math.sin(jog.rumo)], e = api.olho();
      const perto = [e[0] - d[0] * 1.95 + D[0] * .82, e[1] - d[1] * 1.3 + .3, e[2] - d[2] * 1.95 + D[2] * .82];
      olho = v.olho.map((x, i) => lerp(x, perto[i], miraPeso));
      const junto = v.dir.map((x, i) => lerp(x, d[i], miraPeso)), n = Math.hypot(...junto) || 1; dir = junto.map(x => x / n);
      /* o tiro sai da linha da câmera, já passado o corpo: acerta onde a cruz está */
      if (miraPeso > .5) camMira = {origem:olho.map((x, i) => x + d[i] * 2.1)};
    }
    document.body.classList.toggle('mira3', miraPeso > .5);
    return {olho:[olho[0] + Math.sin(m.tempo * 47) * t, olho[1] + Math.sin(m.tempo * 61) * t, olho[2]], dir};
  }
  function trocarCamera(){ const s = $('camera'); s.selectedIndex = (s.selectedIndex + 1) % s.options.length; aplicarCamera(); }
  function aplicarCamera(){
    document.body.classList.toggle('terceira', terceira()); if (!terceira()){ camMira = null; miraPeso = 0; document.body.classList.remove('mira3'); }
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
    document.body.classList.toggle('cena', naCena);
    document.title = naCena ? 'WO · Cena única' : 'WO · Combate com zumbis';
    document.querySelector('h1').innerHTML = naCena ? 'Cena <span>única</span>' : 'Combate <span>com zumbis</span>';
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
    if (!naCena) for (const o of [...$('arma').options]) if (!Primeira.ficha(o.value).golpes) o.remove();
    for (const g of [...$('arma').querySelectorAll('optgroup')]) if (!g.children.length) g.remove();
    const pedido = new URLSearchParams(location.search);
    $('arma').value = [...$('arma').options].some(o => o.value === pedido.get('arma')) ? pedido.get('arma') : 'taco_pregos';
    const qualCenario = naCena ? 'livre' : CENARIOS[pedido.get('cenario')] ? pedido.get('cenario') : 'treino', qualEstado = ESTADOS[pedido.get('estado')] ? pedido.get('estado') : 'saudavel';
    $('cenario').value = qualCenario; $('estadoJogador').value = qualEstado;
    if (naCena){
      if (!pedido.get('camera')) $('camera').value = 'ombro';
      $('esquivarTela').textContent = 'Esquivar (Q)';                    /* na cena o espaço pula */
      const solta = (id, tipos) => $(id).addEventListener('click', () => { api.parar(); if (aguardando) liberar(); soltar(tipos); $(id).blur(); });
      solta('soltarUm', ['comum']); solta('soltarTres', ['comum', 'comum', 'arrastado']); solta('soltarHorda', CENARIOS.horda.zumbis);
      $('tirarZumbis').addEventListener('click', () => { tirarZumbis(); $('tirarZumbis').blur(); });
      for (const [id, k] of [['pularTela', ' '], ['cordaTela', 'g'], ['tratarTela', 't']]) $(id).addEventListener('pointerdown', ev => { ev.preventDefault(); api.parar(); if (aguardando) liberar(); Cena.pedir(k); });
      $('arrumarObjetos').addEventListener('click', () => { Cena.arrumarObjetos(); $('arrumarObjetos').blur(); });
      const aoClicar = (id, faz) => $(id).addEventListener('click', () => { api.parar(); if (aguardando) liberar(); faz(); $(id).blur(); });
      aoClicar('interagirTela', () => { if (!Cena.interagir(m)) api.aviso('Nada para usar aqui: chegue perto de uma porta, janela ou monte de tábuas', 1.6); });
      for (const b of document.querySelectorAll('[data-armadilha]')) aoClicar(b.id, () => Cena.escolherArmadilha(b.dataset.armadilha));
      aoClicar('usarArmadilhaTela', () => Cena.usarArmadilha(m));
      aoClicar('reporArmadilhas', () => Cena.reporArmadilhas());
      aoClicar('madeiraTeste', () => api.aviso('Tábuas: ' + Cena.madeira(10), 1.2));
      aoClicar('irAbrigo', irParaOAbrigo);
      aoClicar('cercarCasa', () => naCasa(['comum', 'comum', 'arrastado', 'comum']));
      aoClicar('grandaoNaCasa', () => naCasa(['brutamontes']));
      $('outraCena').addEventListener('click', () => { location.search = '?cena&semente=' + (1 + Math.floor(Math.random() * 999)); });
    }
    comecar(qualCenario, qualEstado);
    aplicarCamera();
    esperarClique();
    if (naCena){ $('fimTitulo').textContent = 'Cena única'; $('fimTexto').textContent = 'WASD anda, Shift corre, C abaixa, Espaço pula ou agarra, G usa a corda. Clique ataca ou atira; botão direito defende ou mira. Q esquiva, F empurra, E usa porta e janela (ou pisa no caído), V troca a câmera.'; $('fimDeNovo').textContent = 'Começar'; }
  }

  return {ativa, naCena, boca3, miraDaCamera:() => terceira() ? camMira : null, apontando:() => (corpo.apontar || 0) > .2, soltar, tirarZumbis, medidas:() => ({meu:meuCorpo, zumbi:m?.jog.agarrado?.z.juntas}), visao, emTerceira:() => terceira(), CENARIOS, ESTADOS, ligar, comecar, antes, depois, atingir, bateuNaParede, pancadaNoVidro, naCasa, irParaOAbrigo, raio, desenhar:desenharZumbis, maos, hud, tecla, demo, passoDoJogador, mundo:() => m};
})();
