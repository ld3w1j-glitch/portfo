/* Cena única (tiro.html?cena): um terreno compacto onde tudo funciona junto.
   Quem move o personagem é o parkour.js (andar, correr, abaixar, pular, agarrar, corda, queda);
   o combate (arena.js) e o tiro (estande.js) entram por cima, no mesmo corpo.
   Eixos: Y para cima; rumo 0 = +Z (norte). Olhando para o norte, +X fica à ESQUERDA da tela.
   Carregado depois de fisica.js e antes de arena.js e estande.js. */
const Cena = (() => {
  const ativa = typeof location === 'object' && /(\?|&)cena\b/.test(location.search);
  const $ = id => document.getElementById(id);
  const preso = (v, a, b) => Math.max(a, Math.min(b, v));
  const suave = x => { const t = preso(x, 0, 1); return t * t * (3 - 2 * t); };
  const puxa = (v, alvo, ritmo, dt) => v + (alvo - v) * (1 - Math.exp(-ritmo * dt));
  const angulo = a => Math.atan2(Math.sin(a), Math.cos(a));
  const MEIO = 22;
  const SEMENTE = ativa ? (Number((location.search.match(/semente=(\d+)/) || [])[1]) || 7) : 7;
  const sorte = (n => () => (n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296)(SEMENTE);

  /* ---------------------------------------------------------------- o terreno */
  const CORES = {predio:['#a98f78', '#8f8a84'], concreto:['#8f939b', '#b3b7be'], madeira:['#8a6136', '#ad8150'], tijolo:['#9b5440', '#c0b8ac'], metal:['#4d5661', '#7b8794'], muro:['#6e6a5e', '#807b6e']};
  const CAIXAS = [], zonas = [];
  const caixa = (x0, x1, y1, z0, z1, material = 'concreto', mais = {}) => { const k = {x0, x1, y0:0, y1, z0, z1, material, ...mais}; CAIXAS.push(k); return k; };
  /* pista de obstáculos, a leste (à esquerda de quem olha para o norte), indo para o norte */
  caixa(7.8, 10.2, .25, -3, -1.8);                                      /* degrau */
  caixa(7.8, 10.2, .8, 1, 1.25, 'tijolo');                              /* mureta fina */
  caixa(7.8, 10.2, .75, 4, 5.5, 'madeira');                             /* caixa funda */
  caixa(7.8, 10.2, 1.35, 8, 9.6);                                       /* altura do peito */
  caixa(7.8, 10.2, 2.1, 12, 13.4);                                      /* agarrar */
  CAIXAS.push({x0:7.8, x1:10.2, y0:1.42, y1:1.62, z0:16, z1:17.6, material:'metal', agarra:false});   /* passagem baixa */
  for (const x of [7.68, 10.2]) for (const z of [16, 17.48]) caixa(x, x + .12, 1.62, z, z + .12, 'metal', {agarra:false});
  caixa(12.4, 14.8, 2, 4, 5.8, 'tijolo', {agarra:false, motivo:'tem caco de vidro em cima: ele não põe a mão', cacos:true});
  /* muro da corda, a oeste */
  caixa(-13, -8.6, 3.05, -7, -5.4);
  /* torre de queda: sobe por degraus até 3,6 m (só sente) e até 4,8 m (machuca) */
  for (let i = 1; i <= 11; i++) caixa(-7 - i * .34, -7 - (i - 1) * .34, i * .3, 1.6, 3.2, 'concreto');
  caixa(-14.2, -10.74, 3.6, 1.6, 5, 'predio');
  for (let i = 1; i <= 3; i++) caixa(-14.2, -12.6, 3.6 + i * .3, 5 + (i - 1) * .34, 5 + i * .34, 'concreto');
  caixa(-14.2, -10.74, 4.8, 6.02, 8.4, 'predio');                          /* da plataforma de baixo dá para pular o vão e se agarrar nela */
  /* caixotes soltos perto do começo */
  caixa(3.4, 4.5, 1, 6.2, 7.3, 'madeira'); caixa(-3.9, -2.9, .6, 2.6, 3.6, 'madeira');
  /* muros em volta */
  for (const [a, b, c, d] of [[-MEIO - .4, -MEIO, -MEIO, MEIO], [MEIO, MEIO + .4, -MEIO, MEIO], [-MEIO, MEIO, MEIO, MEIO + .4], [-MEIO, MEIO, -MEIO - .4, -MEIO]])
    caixa(a, b, 1.7, c, d, 'muro', {agarra:false, motivo:'é o limite da área de teste'});
  /* alvos do estande (de frente para o sul) */
  const PLACAS = [{x:-3.4, z:10.5, r:.46}, {x:-5.8, z:16, r:.5}, {x:-2.6, z:20.5, r:.62}].map(p => ({...p, y:1.42}));

  /* ---- casas e vegetação vêm do gerador de mundo; nas casas dá para entrar (só de um andar nesta cena) */
  const decorado = [], casas = [];
  const arm = ativa && typeof Armadilhas === 'object' ? Armadilhas.criar() : null;
  let pondo = null, jogando = 0;
  /* portas, vidros, tábuas e madeira */
  const abrigo = ativa && typeof Abrigo === 'object' ? Abrigo.criar({CAIXAS, MEIO}) : null;
  const TIPOS_DE_CASA = ['casa_telha', 'casa_laje', 'quatro_aguas', 'comercio'];
  /* a colisão sai da mesma planta do desenho. As paredes de fora vêm do abrigo, com portas e janelas à parte */
  function erguerCasa(x, z, indice){
    const tipo = TIPOS_DE_CASA[(SEMENTE + indice * 3) % TIPOS_DE_CASA.length], opcoes = Casas.DE_TIPO[tipo], planta = opcoes[(SEMENTE + indice) % opcoes.length], P = Casas.PLANTAS[planta];
    casas.push({tipo, planta, x, z, w:P.w, d:P.d, cor:Math.floor(sorte() * Povoar.TINTAS.length)});
    const parte = {invisivel:true, liso:true, agarra:false, motivo:'é parede da casa', semCorda:'é parte de uma casa: não dá para usar a corda'};
    if (abrigo) abrigo.casa(casas[casas.length - 1], caixa, parte);
    for (const r of Casas.paredes(planta, 0, false)) if (!(abrigo && r.fora))
      caixa(x + r.x0, x + r.x1, r.tipo === 'movel' ? .85 : r.tipo === 'guarda' ? .95 : Casas.ALT, z + r.z0, z + r.z1, 'predio', {...parte, movel:r.tipo === 'movel'});
    caixa(x - P.w / 2, x + P.w / 2, Casas.PISO, z - P.d / 2, z + P.d / 2, 'predio', {...parte, piso:true});
  }
  /* em que casa está este ponto (ou null) */
  const casaEm = (x, z) => casas.find(c => Math.abs(x - c.x) < c.w / 2 - .12 && Math.abs(z - c.z) < c.d / 2 - .12) || null;
  function povoar(){
    if (typeof Povoar !== 'object') return;
    if (abrigo) Casas.opcoes.semFolhas = true;
    [[-7.5, -17], [6.5, -17]].forEach(([x, z], i) => erguerCasa(x, z, i));
    /* montes de tábuas para tapar janelas */
    if (abrigo){ for (const [x, z, r] of [[-2.7, -11.4, .5], [1.6, -12.3, -.3], [-12.8, -12.2, 1.4], [12.4, -12.4, 1.1], [-5.6, -11.6, .1], [9, -11.3, -.6]]) abrigo.pilha(x, z, r); abrigo.zerar(); }
    const plantas = ['arvore', 'mangueira', 'ipe_amarelo', 'ipe_roxo', 'bananeira'];
    for (let i = 0; i < 18; i++){
      const lado = i % 4, t = -18 + sorte() * 36, borda = 19.3 + sorte() * 1.4;
      const [x, z] = lado === 0 ? [borda, t] : lado === 1 ? [-borda, t] : lado === 2 ? [t, borda + .5] : [(sorte() < .5 ? -1 : 1) * (13 + sorte() * 7), -borda];
      decorado.push({id:plantas[Math.floor(sorte() * plantas.length)] + '@' + i % 3, x, z, rot:sorte() * 6.28, cor:0});
      caixa(x - .22, x + .22, 2.4, z - .22, z + .22, 'predio', {agarra:false, motivo:'é o tronco da árvore', invisivel:true, semCorda:'a copa da árvore está em cima: não dá para usar a corda'});
    }
    for (let i = 0; i < 70; i++){
      const x = -20 + sorte() * 40, z = -20 + sorte() * 40;
      if (Math.abs(x) < 15.5 && z > -12 && z < 21) continue;                  /* o miolo fica limpo */
      decorado.push({id:(sorte() < .6 ? 'capim' : sorte() < .6 ? 'arbusto' : 'flores') + '@' + i % 3, x, z, rot:sorte() * 6.28, cor:0});
    }
    for (let i = 0; i < 110; i++){
      const lado = i % 4, t = -21 + sorte() * 42, beira = 20.6 + sorte() * 1.1;
      const [x, z] = lado === 0 ? [beira, t] : lado === 1 ? [-beira, t] : lado === 2 ? [t, beira] : [t, -beira];
      decorado.push({id:(i % 7 === 3 ? 'flores' : 'capim') + '@' + i % 3, x, z, rot:sorte() * 6.28, cor:0});
    }
    for (const [x, z] of [[-17, -9], [17, -9], [-17, 13], [17, 13]]) decorado.push({id:'poste', x, z, rot:0, cor:0});
  }
  if (ativa) povoar();
  /* o que segura tiro, golpe e zumbi: [x0,x1,y0,y1,z0,z1] */
  const solidos = () => CAIXAS.map(k => { const c = [k.x0, k.x1, k.y0, k.y1, k.z0, k.z1]; if (k.folha) (k.copias || (k.copias = [])).push(c); return c; });

  /* ---------------------------------------------------------------- desenho do terreno e dos objetos */
  let api = null, malhaTerreno = null, malhaDecorado = null;
  function terreno(bloco, malha){
    const q = [];
    for (let x = -MEIO; x < MEIO; x += 2) for (let z = -MEIO; z < MEIO; z += 2){
      const rua = z >= -12 && z < -10 || z >= -14 && z < -12;
      q.push({v:[[x,0,z],[x+2,0,z],[x+2,0,z+2],[x,0,z+2]], n:[0,1,0], cor:rua ? ((x + z) / 2) & 1 ? '#55575c' : '#5a5c61' : ((x + z) / 2) & 1 ? '#8C8F82' : '#95988A'});
    }
    for (let x = -MEIO + 1; x < MEIO - 1; x += 3) bloco(q, x, x + 1.4, .001, .012, -12.06, -11.94, '#C9A23A');
    for (const k of CAIXAS){
      if (k.invisivel) continue;
      const [cor, topo] = CORES[k.material];
      bloco(q, k.x0, k.x1, k.y0, k.y1, k.z0, k.z1, cor);
      bloco(q, k.x0 + .012, k.x1 - .012, k.y1, k.y1 + .006, k.z0 + .012, k.z1 - .012, topo);
      if (k.material !== 'muro' && k.y1 > .35) for (let y = k.y0 + .25; y < k.y1 - .05; y += .25)
        bloco(q, k.x0 - .004, k.x1 + .004, y, y + .013, k.z0 - .004, k.z1 + .004, k.material === 'tijolo' ? '#c9beb0' : k.material === 'madeira' ? '#5e3f1f' : '#767a82');
      if (k.cacos) for (let x = k.x0 + .1; x < k.x1 - .05; x += .17) bloco(q, x, x + .05, k.y1, k.y1 + .08 + (x * 37 % 1) * .05, (k.z0 + k.z1) / 2 - .02, (k.z0 + k.z1) / 2 + .03, (x * 13 % 1) > .5 ? '#2f8a62' : '#7a4a1d');
    }
    /* marcas no chão: onde os zumbis aparecem e a linha de tiro */
    for (const [x0, x1, z0, z1] of [[.5, 5.6, 14, 14.12], [.5, 5.6, 20, 20.12], [.5, .62, 14, 20.12], [5.5, 5.62, 14, 20.12]]) bloco(q, x0, x1, .001, .014, z0, z1, '#b0372b');
    bloco(q, -6.5, -1.5, .001, .012, 4.5, 4.62, '#E9E7DD');
    return malha(q);
  }
  /* os modelos do gerador de mundo vêm com 10 números por vértice; o desenho daqui usa 9, com cor de 0 a 1 */
  function decorar(coisas = decorado, nivel = 'perto'){
    const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
    const lista = [];
    for (const o of coisas){
      const v = Povoar.vertices(o.planta ? o.tipo + '@' + o.planta : o.id, nivel, 0); if (!v) continue;
      const c = Math.cos(o.rot || 0), s = Math.sin(o.rot || 0), tinta = hex(Povoar.TINTAS[o.cor]);
      for (let i = 0; i < v.length; i += 10){
        const x = v[i], z = v[i + 2], nx = v[i + 3], nz = v[i + 5], pinta = v[i + 9];
        lista.push(o.x + x * c + z * s, v[i + 1], o.z + z * c - x * s, nx * c + nz * s, v[i + 4], nz * c - nx * s,
          ...[0, 1, 2].map(k => v[i + 6 + k] / 255 * (pinta ? tinta[k] / 255 : 1)));
      }
    }
    return api.malhaCrua(new Float32Array(lista));
  }

  /* ---- objetos soltos (a mesma física da estação "Objetos com física") */
  let quintal = null;
  function arrumarObjetos(){
    quintal = Fisica.cenario(SEMENTE);
    quintal.objetos = []; quintal.meio = MEIO;
    quintal.paredes = CAIXAS.filter(k => k.porta || !k.folha && k.y0 < .2 && k.y1 > .2).map(k => { const p = {x0:k.x0, x1:k.x1, z0:k.z0, z1:k.z1, h:k.y1}; if (k.porta) k.noQuintal = p; return p; });
    const poe = (t, x, z) => quintal.objetos.push(Fisica.objeto(t, x, z, quintal.sorteio));
    for (const [x, z] of [[-1.2, -5.5], [-.75, -5.2], [-1.0, -4.9], [3.8, -7.2], [4.2, -7.0], [-5.6, -8.6], [5.6, 3]]) poe('saco', x, z);
    for (const [x, z] of [[1.4, -5.2], [2.5, -6.4], [-3.2, -7.4], [-4.6, -3.4], [5.4, -4.4], [4.6, 10.8]]) poe('lata', x, z);
    for (const [x, z] of [[-2.6, -5.0], [-2.1, -5.15], [2.2, 3.6]]) poe('caixa', x, z);
    for (let i = 0; i < 30; i++) poe('entulho', .4 + (quintal.sorteio() - .5) * 2.6, -8.4 + (quintal.sorteio() - .5) * 1.8);
  }
  if (ativa) arrumarObjetos();
  function desenharObjetos(){
    for (const o of quintal.objetos){
      if (!o.malha){ const q = []; for (const [x, y, z, w, h, d, cor] of o.forma) api.bloco(q, x - w / 2, x + w / 2, y, y + h, z - d / 2, z + d / 2, cor); o.malha = api.malha(q); }
      const giro = api.qy(o.rumo);
      let t = [o.x, o.y, o.z], q = giro;
      if (o.tomba){
        /* tomba em volta da borda de baixo do lado em que está caindo */
        const dx = Math.sin(o.dir), dz = Math.cos(o.dir), s = Math.sin(o.tomba / 2), tq = [dz * s, 0, -dx * s, Math.cos(o.tomba / 2)], pivo = [dx * .22, 0, dz * .22], r = api.girar(tq, pivo);
        t = [o.x + pivo[0] - r[0], o.y + pivo[1] - r[1], o.z + pivo[2] - r[2]]; q = api.qm(tq, giro);
      }
      api.desenha(o.malha, api.matriz(t, q, [1 + o.amassa * .55, 1 - o.amassa, 1 + o.amassa * .55]));
    }
  }
  function desenhar(){
    if (!malhaDecorado && decorado.length) malhaDecorado = decorar();
    if (malhaDecorado) api.desenha(malhaDecorado, api.matriz([0, 0, 0]));
    /* dentro de uma casa, visto de fora: o telhado some e as paredes são cortadas à meia altura */
    const aqui = e && vendoDeFora ? casaEm(e.x, e.z) : null;
    for (const casa of casas){
      if (!casa.malhas) casa.malhas = ['casco', 'dentro', 'teto'].map(parte => decorar([casa], parte));
      const [casco, dentro, teto] = casa.malhas, aberta = casa === aqui;
      if (aberta) api.corte(1.3);
      api.desenha(casco, api.matriz([0, 0, 0])); api.desenha(dentro, api.matriz([0, 0, 0]));
      if (aberta) api.corte(null); else api.desenha(teto, api.matriz([0, 0, 0]));
    }
    if (abrigo) Abrigo.desenhar(abrigo, api, aqui, tempo);
    if (arm) Armadilhas.desenhar(arm, api, tempo);
    desenharObjetos();
    desenharCorda();
    /* a borda que ele está lendo: verde = dá para usar, vermelho = não dá, amarelo = passa por baixo */
    const o = e?.visto;
    if (o && !o.caixa.invisivel && o.caixa.material !== 'muro' && o.dist < 1.9){
      const k = o.caixa, y = o.tipo === 'baixo' ? k.y0 : k.y1, cor = o.tipo === 'baixo' ? '#e8b81e' : o.pode ? '#2fbf55' : '#d6392b', g = .03;
      if (o.nz){ const p = o.plano - o.nz * g; api.cubo([(k.x0 + k.x1) / 2, y, (p + o.plano) / 2], null, [k.x1 - k.x0, .05, g], cor, 1); }
      else { const p = o.plano - o.nx * g; api.cubo([(p + o.plano) / 2, y, (k.z0 + k.z1) / 2], null, [g, .05, k.z1 - k.z0], cor, 1); }
    }
  }
  function desenharVidros(cubo){ if (abrigo) Abrigo.vidros(abrigo, cubo, e && vendoDeFora ? casaEm(e.x, e.z) : null); }
  function desenharCorda(){
    if (!e || typeof Rapel !== 'object') return;
    for (const c of Rapel.desenho(e, altQuadril !== null ? e.y + altQuadril : null)){
      for (let i = 1; i < c.pontos.length; i++) api.risco(c.pontos[i - 1], c.pontos[i], c.tipo === 'militar' ? .03 : .042, c.tipo === 'militar' ? '#35421f' : '#d9d2bf', 0);
      const g = c.gancho; if (g) api.cubo(g, null, [.2, .06, .2], '#6c7078', 0);
      else if (c.ancora) api.cubo([c.ancora[0], c.ancora[1] + .14, c.ancora[2]], null, [.09, .28, .09], '#3b424b', 0);
    }
  }

  /* ---------------------------------------------------------------- o corpo do jogador */
  let vendoDeFora = true;
  let e = null, quadrilDePe = .8, saida = null, mochila = null, guarda = false;
  const apertou = new Set();
  let folga = 0, modoAntes = '', ultimoY = null, altQuadril = null, rotVista = null, rumoVisto = 0, yVisto = 0, anterior = null, quedaDosOlhos = 0;

  function reiniciar(jog){
    if (!jog) return;
    e = null; saida = null; apertou.clear(); folga = 0; ultimoY = null; rotVista = null; altQuadril = null; rumoVisto = jog.rumo; yVisto = 0; anterior = null; quedaDosOlhos = 0; jog.y = 0;
    pregando = null; salto = null; pondo = null; jogando = 0; jogo = jog; if (abrigo) abrigo.zerar(); if (arm) Armadilhas.zerar(arm);
    mochila = Object.assign(Rapel.criarMochila(40, true), {madeira:4, kit:1});
  }
  let pregando = null, salto = null, jogo = null, luta_ = null, tempo = 0;
  const noMeio = o => [o.x, 1.3, o.z];
  /* a oferta ao alcance agora (para o letreiro e para a tecla E) */
  function oferta(){
    if (!abrigo || !e || !jogo || e.modo !== 'chao' || pregando || pondo) return null;
    const item = arm && Armadilhas.perto(arm, e.x, e.z, .95);
    if (item) return {tipo:'recolher', item, pode:true, texto:item.estado === 'gasta' ? 'E: tirar a tábua gasta do chão' : 'E: recolher ' + Armadilhas.TIPOS[item.tipo].curto + (item.estado === 'pronta' ? ' (está armada)' : '')};
    return abrigo.ofertar(e.x, e.z, jogo.rumo, mochila.madeira);
  }
  /* devolve true se a tecla E foi usada aqui (senão ela serve para pisar) */
  function interagir(m){
    if (pregando || salto || pondo) return true;
    if (m.zumbis.some(z => Combate.vivo(z) && Combate.noChao(z) && Math.hypot(z.x - jogo.x, z.z - jogo.z) < 1.5)) return false;
    const of = oferta(); if (!of || m.jog.agarrado || m.jog.morto) return false;
    const aviso = (t, d) => luta_?.aviso(t, d);
    if (of.tipo === 'recolher'){ const voltou = Armadilhas.recolher(arm, of.item); aviso(voltou ? 'Recolheu: ' + Armadilhas.TIPOS[of.item.tipo].curto : 'Tábua gasta jogada fora', 1.3); luta_?.tocar('material', [of.item.x, .2, of.item.z], 'corrente'); }
    else if (of.tipo === 'pilha'){ of.p.pega = true; mochila.madeira += abrigo.NUM.madeiraPorPilha; aviso('Pegou ' + abrigo.NUM.madeiraPorPilha + ' tábuas (agora são ' + mochila.madeira + ')', 1.4); luta_?.tocar('material', [of.p.x, .3, of.p.z], 'taco_pregos'); }
    else if (of.tipo === 'porta'){
      const erro = abrigo.usarPorta(of.o, [{x:e.x, z:e.z}, ...m.zumbis.filter(Combate.vivo)]);
      if (erro) aviso(erro, 1.4); else luta_?.tocar('material', noMeio(of.o), 'taco_pregos');
    } else if (of.tipo === 'tapar' || of.tipo === 'consertar') pregando = {t:0, dura:of.tempo, tipo:of.tipo, o:of.o, custo:of.custo, bate:.2};
    else aviso(of.texto.charAt(0).toUpperCase() + of.texto.slice(1), 1.4);
    return true;
  }
  /* ---- armadilhas: X usa a escolhida, Z troca ---- */
  const nomeDaArmadilha = () => Armadilhas.TIPOS[arm.tipo];
  function escolherArmadilha(tipo){ if (!arm) return; if (tipo) arm.tipo = tipo; else Armadilhas.trocar(arm); luta_?.aviso(nomeDaArmadilha().nome + ' (' + arm.estoque[arm.tipo] + ')', 1.2); }
  function reporArmadilhas(){ if (arm){ Armadilhas.repor(arm); luta_?.aviso('Armadilhas repostas (teste)', 1.1); } }
  function usarArmadilha(m){
    if (!arm || !e || !jogo || pondo || pregando || salto || jogando > 0) return false;
    const j = m.jog, A = nomeDaArmadilha(), aviso = t => luta_?.aviso(t, 1.3);
    if (j.agarrado || j.morto || j.levantando > 0 || e.modo !== 'chao'){ aviso('Agora não dá'); return false; }
    if (arm.estoque[arm.tipo] <= 0){ aviso('Acabou: ' + A.curto + ' (Z troca)'); return false; }
    const s = Math.sin(jogo.rumo), c = Math.cos(jogo.rumo);
    if (arm.tipo === 'isca'){
      const sobe = preso(jogo.olha + .38, -.15, .85), v = 9.5;
      Armadilhas.arremessar(arm, [e.x + s * .3, e.y + 1.45, e.z + c * .3], [s * Math.cos(sobe) * v, Math.sin(sobe) * v, c * Math.cos(sobe) * v]);
      jogando = .45; aviso('Isca arremessada'); return true;
    }
    const x = e.x + s * .85, z = e.z + c * .85;
    if (Math.abs(Parkour.chaoEm(CAIXAS, x, z, e.y + .1) - e.y) > .12 || !Armadilhas.cabeNoChao(CAIXAS, x, z, e.y) || Math.abs(x) > MEIO - .3 || Math.abs(z) > MEIO - .3){ aviso('Não cabe aqui: ache um chão livre à frente'); return false; }
    pondo = {t:0, dura:A.preparo, tipo:arm.tipo, x, y:e.y, z, rumo:jogo.rumo, de:{x:e.x, z:e.z}};
    return true;
  }
  function colocando(dt, m, mexeu){
    if (mexeu || m.jog.agarrado || m.jog.morto || m.jog.atordoado > 0 || Math.hypot(e.x - pondo.de.x, e.z - pondo.de.z) > .5){ pondo = null; luta_?.aviso('Parou de armar (nada foi gasto)', 1.2); return; }
    pondo.t += dt;
    if (pondo.t >= pondo.dura){ Armadilhas.colocar(arm, pondo.tipo, pondo.x, pondo.y, pondo.z, pondo.rumo); luta_?.aviso(Armadilhas.TIPOS[pondo.tipo].nome + ' no chão', 1.3); luta_?.tocar('material', [pondo.x, .2, pondo.z], 'corrente'); pondo = null; }
  }
  /* o que aconteceu com as armadilhas neste quadro: som, sangue, tremor e avisos */
  function passoDasArmadilhas(dt, m){
    if (!arm) return;
    Armadilhas.passo(arm, dt, {m, p:{x:e.x, z:e.z}, CAIXAS, abrigo, meio:MEIO, chao:(x, z, y) => Parkour.chaoEm(CAIXAS, x, z, y)});
    for (const ev of arm.eventos){
      if (ev.tipo === 'toque') luta_?.tocar('toqueCelular', [ev.i.x, ev.i.y + .1, ev.i.z]);
      else if (ev.tipo === 'caiu') luta_?.tocar('material', [ev.i.x, ev.i.y, ev.i.z], 'cano');
      else if (ev.tipo === 'acabou') luta_?.aviso('A bateria da isca acabou', 1.2);
      else if (ev.tipo === 'vidro') luta_?.estilhacar(ev.o);
      else if (ev.tipo === 'ferido') Efeitos.sangue([ev.z.x, 1.1, ev.z.z], ev.dir, ev.forca);
      else if (ev.tipo === 'prendeu'){ luta_?.tocar('mandibula', [ev.i.x, .2, ev.i.z]); Efeitos.sangue([ev.i.x, .25, ev.i.z], [0, 1, 0], 1.1); luta_?.aviso(ev.z.t.bruto ? 'O grandalhão pisou: segura por pouco tempo' : 'Preso na armadilha de urso', 1.5); }
      else if (ev.tipo === 'furou'){ luta_?.tocar('material', [ev.i.x, .1, ev.i.z], 'taco_pregos'); Efeitos.sangue([ev.z.x, .15, ev.z.z], [0, 1, 0], .6); }
      else if (ev.tipo === 'gastou') luta_?.aviso('A tábua de pregos se acabou', 1.2);
      else if (ev.tipo === 'tropecou'){ luta_?.tocar('latas', [ev.i.x, .2, ev.i.z]); luta_?.aviso(ev.z.t.bruto ? 'O grandalhão arrebentou o fio' : 'Tropeçou no fio: derrubado', 1.4); }
      else if (ev.tipo === 'explodiu'){
        const p = [ev.onde.x, .45, ev.onde.z];
        luta_?.tocar('explosao', p);
        for (let n = 0; n < 6; n++){ const a = n * 1.05; Efeitos.fumaca([p[0] + Math.sin(a) * .35, p[1] + (n % 3) * .22, p[2] + Math.cos(a) * .35], [Math.sin(a), .8, Math.cos(a)], 2.6, 1); Efeitos.impacto([p[0] + Math.sin(a) * .5, .05, p[2] + Math.cos(a) * .5], [0, 1, 0], '#8C8477', 2.2); }
        Efeitos.faisca(p, [0, 1, 0], 2.4);
        for (const o of quintal.objetos){ const d = Math.hypot(o.x - ev.onde.x, o.z - ev.onde.z); if (d < 3.4){ const k = (1 - d / 3.6) * 7, r = Math.atan2(o.x - ev.onde.x, o.z - ev.onde.z); o.vx += Math.sin(r) * k; o.vz += Math.cos(r) * k; o.vy += k * .4; o.vr += k; if (o.tipo === 'lata' && o.tomba < .02){ o.dir = r; o.vtomba = k * .7; } } }
        luta_?.tremer(Math.max(.2, 2.6 - Math.hypot(e.x - ev.onde.x, e.z - ev.onde.z) * .18));
        luta_?.aviso(ev.pegos ? 'A lata estourou: ' + ev.pegos + (ev.pegos > 1 ? ' atingidos' : ' atingido') + (ev.mortos ? ', ' + ev.mortos + ' fora de combate' : '') : 'A lata estourou', 1.8);
      } else if (ev.tipo === 'meAcertou' && !m.jog.morto){ Combate.ferir(m, ev.dano, ev.de, {x:e.x, z:e.z, rumo:jogo.rumo}, 'estouro'); luta_?.aviso('Os pregos te pegaram: fique longe da lata', 1.8); }
    }
  }

  /* quem manda no corpo enquanto ele prega: parado, de frente para o vão. Andar, ser agarrado ou apanhar cancela */
  function pregar(dt, m, mexeu){
    const o = pregando.o, k = abrigo.perto(o, e.x, e.z, jogo.rumo);
    if (mexeu || m.jog.agarrado || m.jog.morto || m.jog.atordoado > 0 || k.d > 1.4){ pregando = null; luta_?.aviso('Parou de pregar (a madeira não foi gasta)', 1.2); return; }
    pregando.t += dt; pregando.bate -= dt;
    if (pregando.bate <= 0){ pregando.bate = .42; luta_?.tocar('material', noMeio(o), 'taco_pregos'); o.tremeu = .12; }
    if (pregando.t >= pregando.dura){
      mochila.madeira -= pregando.custo; abrigo.pregou(o, pregando.tipo);
      luta_?.aviso((o.tipo === 'porta' ? 'Porta' : 'Janela') + ' tapada: ' + o.tabuas + '/' + abrigo.NUM.tabuas, 1.5); pregando = null;
    }
  }
  /* pular uma janela quebrada: o corpo passa por cima do peitoril */
  const DURA_SALTO = 1.05;
  function pularJanela(dt){
    salto.t += dt;
    const u = Math.min(1, salto.t / DURA_SALTO), k = suave(u), sobe = Math.sin(Math.PI * u);
    e.x = salto.de.x + (salto.ate.x - salto.de.x) * k; e.z = salto.de.z + (salto.ate.z - salto.de.z) * k; e.y = sobe * (salto.sill + .05);
    const q = a => [Math.sin(a / 2), 0, 0, Math.cos(a / 2)];
    saida = {rot:{...salto.rot, torax:q(.75 * sobe), cabeca:q(-.35 * sobe), coxa_d:q(-1.55 * sobe), canela_d:q(1.9 * sobe), coxa_e:q(-1.15 * sobe), canela_e:q(2.0 * sobe), braco_d:q(-1.25 * sobe), antebraco_d:q(-.5 * sobe), braco_e:q(-1.25 * sobe), antebraco_e:q(-.5 * sobe)}, yQuadril:null};
    yVisto = e.y; jogo.x = e.x; jogo.z = e.z;
    /* os olhos abaixam para passar por baixo do alto da janela */
    jogo.y = -.34 * sobe;
    if (u >= 1){ salto = null; e.modo = 'chao'; e.acao = null; e.y = e.piso = Parkour.chaoEm(CAIXAS, e.x, e.z, .4); e.loco.vel = 0; e.trans = 1; }
  }
  /* o que o combate precisa saber do abrigo */
  const abrigoDoCombate = () => abrigo && {guiar:(z, p, agora, qual) => abrigo.guiar(z, p, agora, qual), visao:abrigo.visao, bater:abrigo.bater, aindaFechada:abrigo.aindaFechada};

  /* o que o parkour precisa saber do modelo: a pose parada com a arma na mão, e sem ela */
  function parado(arma, mods){
    const a = arma && !['nenhum', 'arco', 'estilingue', 'lanca', 'forcado'].includes(arma) ? arma : null;
    return {rot:Animacao.parado(a, mods), arma:a, mods, livre:Animacao.parado(null, {})};
  }
  /* pulando, escalando, na corda, caído... a câmera continua a que a pessoa escolheu */
  const ocupado = () => !!e && e.modo !== 'chao';
  /* em 1ª pessoa, a arma some enquanto as mãos estão no obstáculo, na corda ou no curativo */
  const maosOcupadas = () => !!e && (!!pregando || !!pondo || jogando > 0 || ['acao', 'pendurado', 'corda', 'tratando', 'caido'].includes(e.modo));

  function tecla(k, repetida, combate){
    if (k === ' '){ if (!repetida) apertou.add(' '); return true; }
    if (k === 'q'){ if (!repetida) combate.esquivar(); return true; }
    if (k === 'e'){ if (repetida) return true; return interagir(combate.m); }
    if (k === 'x'){ if (!repetida) usarArmadilha(combate.m); return true; }
    if (k === 'z'){ if (!repetida) escolherArmadilha(); return true; }
    if (['c', 'g', 't', 'w', 's'].includes(k)){ if (!repetida) apertou.add(k); return k === 'c' || k === 'g' || k === 't'; }
    return false;
  }
  const pedir = k => apertou.add(k);

  /* um quadro de movimento. d = {jog, est, m, teclas, c (comando do estande), combate} */
  function mover(dt, d){
    const {jog, est, m, teclas, c, combate} = d, j = m.jog, p = combate.parado();
    vendoDeFora = combate.terceira(); jogo = jog; luta_ = combate;
    if (!e){ e = Parkour.criar(null, combate.quadril()); e.mochila = mochila; e.x = jog.x; e.z = jog.z; e.rumo = e.loco.rumo = jog.rumo; }
    e.quadril = combate.quadril(); e.temArma = !!p.arma; if (!e.rot) e.rot = p.rot;
    /* o que o combate empurrou desde o quadro anterior (esquiva, agarrão, tranco) */
    e.x = jog.x; e.z = jog.z;
    const preso_ = !!j.agarrado, travado = j.morto || j.levantando > 0 || !!j.agarrado?.noChao;
    /* agarrado ou morto no meio de um pulo: volta para o chão */
    if ((preso_ || j.morto) && e.modo !== 'chao' && e.modo !== 'caido'){ e.acao = null; e.rapel = null; e.modo = 'chao'; e.y = Parkour.chaoEm(CAIXAS, e.x, e.z, e.y + .2); e.trans = 1; }

    const tem = k => teclas.has(k), deu = k => apertou.has(k);
    if (pregando) pregar(dt, m, ['w', 'a', 's', 'd', ' '].some(k => tem(k) || deu(k)));
    jogando = Math.max(0, jogando - dt);
    if (pondo) colocando(dt, m, ['w', 'a', 's', 'd', ' '].some(k => tem(k) || deu(k)));
    /* Espaço de frente para uma janela quebrada: pula por ela */
    if (abrigo && !salto && !pregando && e.modo === 'chao' && deu(' ') && !travado && !preso_){
      const s_ = abrigo.pularEm(e.x, e.z, jog.rumo);
      if (s_){ salto = {t:0, de:{x:e.x, z:e.z}, ate:s_.ate, sill:s_.sill, rot:saida?.rot || p.rot}; e.modo = 'acao'; e.acao = {tipo:'janela'}; e.rumo = e.loco.rumo = Math.atan2(s_.ate.x - e.x, s_.ate.z - e.z); apertou.clear(); }
    }
    if (salto){
      apertou.clear(); pularJanela(dt);
      c.atirar = c.apertou = c.mirar = c.bater = c.recarregar = false; est.segurando = false; est.golpe = null; c.andando = 0; c.correr = false;
      return;
    }
    if (pregando || pondo || jogando > 0){ c.atirar = c.apertou = c.mirar = c.bater = c.recarregar = false; est.segurando = false; est.golpe = null; }
    const frente = (tem('w') || c.frenteForcada ? 1 : 0) - (tem('s') ? 1 : 0), lado = (tem('d') ? 1 : 0) - (tem('a') ? 1 : 0);
    const s = Math.sin(jog.rumo), co = Math.cos(jog.rumo);
    const mx = s * frente - co * lado, mz = co * frente + s * lado;               /* direção pedida, em relação à câmera */
    const quer = !travado && (frente || lado) ? Math.atan2(mx, mz) : null;
    const correr = (tem('shift') || !!c.correrForcado) && !preso_ && j.folego > 8;
    /* guarda: de frente para onde olha, andando de lado e de costas. Vale lutando, mirando, em 1ª pessoa e perto de zumbi */
    const acao = !!(combate.apontando() || est.golpe || est.segurando && est.carga > .18 || est.bloqueio > .1 || est.mira > .2 || c.atirar || c.mirar);
    const perto = m.zumbis.some(z => Combate.vivo(z) && !Combate.noChao(z) && Math.hypot(z.x - e.x, z.z - e.z) < 3.4);
    guarda = e.modo === 'chao' && (preso_ || !(correr && frente > 0) && (acao || perto || !combate.terceira()));
    let comandoGuarda = null;
    if (guarda){
      const base = (correr && frente > 0 ? 4.4 : 2.1) * (1 - est.bloqueio * .45) * (1 - (est.mira || 0) * .4) * combate.passo(frente, lado);
      const n = Math.hypot(frente, lado) || 1, v = travado || !(frente || lado) ? 0 : base / n;
      comandoGuarda = {rumo:jog.rumo, vx:mx * v, vz:mz * v, deCostas:frente < 0};
    }
    const naCorda = e.modo === 'corda';
    const comando = {quer:guarda ? null : quer, correndo:correr, guarda:comandoGuarda,
      pular:deu(' ') && !travado && !preso_, agachar:tem('c') && !travado && !preso_, usar:deu('g') && !preso_, tratar:deu('t') && !preso_,
      cima:naCorda ? tem('w') : deu('w') || deu(' '), baixo:naCorda ? tem('s') : deu('s'), lado};
    if (travado || pregando || pondo){ e.loco.vel = 0; comando.quer = null; comando.guarda = comando.guarda && {...comando.guarda, vx:0, vz:0}; }
    saida = Parkour.passo(e, dt, comando, CAIXAS, p);
    apertou.clear();
    if (j.atordoado > 0 && e.modo === 'chao') e.loco.vel = Math.min(e.loco.vel, 1);
    /* a queda machuca também a vida do combate */
    if (e.impactoNovo > 6 && e.modo === 'caido'){
      const dano = e.ferimento?.tipo === 'grave' ? 38 : 18;
      j.vida = Math.max(1, j.vida - dano); combate.dor(dano);
    } else if (e.impactoNovo > 4) combate.tremer(.7);
    if (!travado && e.modo === 'chao' && e.loco.vel > 3 && Math.random() < dt * 2) Combate.barulho(m, e, 9);
    jog.x = e.x; jog.z = e.z;
    /* com as mãos ocupadas ele não ataca nem atira */
    if (e.modo !== 'chao' || e.sacando > 0){ c.atirar = c.apertou = c.mirar = c.bater = c.recarregar = false; est.segurando = false; est.golpe = null; }
    c.andando = e.loco.vel > .2 ? 1 : 0; c.correr = correr && e.loco.vel > 3;
    /* altura dos pés, sem tranco, e os olhos em 1ª pessoa */
    yVisto = e.modo === 'chao' ? e.y : puxa(yVisto, e.y, 11, dt);
    quedaDosOlhos = puxa(quedaDosOlhos, e.modo === 'caido' ? 1.05 : e.modo === 'tratando' ? .6 : 0, e.modo === 'caido' ? 9 : 5, dt);
    jog.y = yVisto - .55 * suave(e.agacha) - quedaDosOlhos;
    if (j.agarrado || j.morto) jog.y = yVisto;
  }

  /* depois do combate: guarda o que ele empurrou e faz a física dos objetos, com o jogador e os zumbis */
  function depois(dt, d){
    const {jog, m, combate} = d;
    if (!e) return;
    e.x = jog.x; e.z = jog.z;
    const antes = anterior || {x:e.x, z:e.z, z_:new Map()};
    const j = e.y < .6 && e.modo === 'chao' ? {semMuros:true, x:e.x, z:e.z, vx:dt ? (e.x - antes.x) / dt : 0, vz:dt ? (e.z - antes.z) / dt : 0} : null;
    const posZ = new Map(), outros = [];
    for (const z of m.zumbis){
      if (!Combate.vivo(z) || Combate.noChao(z)) continue;
      const a = antes.z_.get(z) || [z.x, z.z]; posZ.set(z, [z.x, z.z]);
      outros.push({x:z.x, z:z.z, vx:dt ? preso((z.x - a[0]) / dt, -4, 4) : 0, vz:dt ? preso((z.z - a[1]) / dt, -4, 4) : 0});
    }
    tempo += dt; if (abrigo) Abrigo.passo(abrigo, dt);
    luta_ = combate; passoDasArmadilhas(dt, m);
    const eventos = Fisica.passo(quintal, Math.min(dt, .05), j, outros);
    if (j){ e.x = jog.x = j.x; e.z = jog.z = j.z; }
    anterior = {x:e.x, z:e.z, z_:posZ};
    for (const ev of eventos){
      const onde = [ev.o.x, .4, ev.o.z];
      if (ev.tipo === 'caiu' || ev.tipo === 'espalhou'){
        combate.tocar('material', onde, ev.tipo === 'caiu' ? 'cano' : 'corrente');
        /* latão caindo faz barulho e chama quem estiver por perto */
        if (ev.tipo === 'caiu'){ Combate.barulho(m, ev.o, 14); combate.aviso('O barulho chamou atenção', 1.2, m); }
      } else if (ev.tipo === 'bateu' && ev.forca > 2.6 && ev.o.tipo === 'lata') combate.tocar('material', onde, 'frigideira');
    }
    escrever();
  }

  /* a pose do corpo: junta o que o parkour está fazendo com o que o combate está fazendo.
     luta = o que a terceira.js devolveu; corpo = estado dela; d = {jog, est, m} */
  const DE_CIMA = ['torax', 'cabeca', 'braco_d', 'antebraco_d', 'mao_d', 'braco_e', 'antebraco_e', 'mao_e'];
  function compor(dt, luta, corpo, d){
    const {jog, est, m} = d, j = m.jog;
    if (!e || !saida) return null;
    const inteiro = j.agarrado || j.levantando > 0 || j.morto || j.esquiva > 0 || corpo.pisao > 0;
    const levanta = Math.max(luta.apontando || 0, luta.recarga?.peso || 0), mirando = levanta > .02;     /* mirando ou recarregando */
    const emCima = est.golpe || est.segurando && est.carga > .18 || est.bloqueio > .02 || corpo.empurrao > 0 || corpo.ferido > 0 || guarda && est.mira > .2;
    let rot = saida.rot, tombo = 0, semArma = !e.naMao, quadril = saida.yQuadril, combate = false;
    if (inteiro && e.modo === 'chao'){ rot = luta.rot; tombo = luta.tombo; semArma = luta.semArma; quadril = null; combate = true; }
    else if (emCima && e.modo === 'chao'){
      combate = true;
      /* andando ou abaixado: as pernas continuam as do movimento e o tronco faz o golpe. Parado: o corpo inteiro entra no golpe */
      const pernas = Math.max(suave((e.loco.mexe - .08) / .4), suave(e.agacha));
      const misto = {...luta.rot}; for (const n of Object.keys(saida.rot)) if (!DE_CIMA.includes(n)) misto[n] = saida.rot[n];
      rot = pernas <= 0 ? luta.rot : pernas >= 1 ? misto : Animacao.misturar(luta.rot, misto, pernas);
    }
    else if (mirando && e.modo === 'chao'){
      /* levantando a arma: o corpo passa do movimento para a mira aos poucos, sem salto */
      const pernas = Math.max(suave((e.loco.mexe - .08) / .4), suave(e.agacha));
      const misto = {...luta.rot}; for (const n of Object.keys(saida.rot)) if (!DE_CIMA.includes(n)) misto[n] = saida.rot[n];
      const alvo = pernas <= 0 ? luta.rot : pernas >= 1 ? misto : Animacao.misturar(luta.rot, misto, pernas);
      rot = Animacao.misturar(saida.rot, alvo, suave(levanta)); combate = true;
    }
    if (pregando){
      /* martelando: a mão direita bate, a esquerda segura a tábua */
      const q = a => [Math.sin(a / 2), 0, 0, Math.cos(a / 2)], b = Math.sin(pregando.t * 15);
      rot = {...saida.rot, braco_d:q(-1.55 + b * .4), antebraco_d:q(-.85 - b * .45), mao_d:q(0), braco_e:q(-1.4), antebraco_e:q(-.55), mao_e:q(0)}; semArma = true; combate = true;
    }
    if (pondo){
      /* abaixado, com as duas mãos no chão armando */
      const q = a => [Math.sin(a / 2), 0, 0, Math.cos(a / 2)], b = Math.sin(pondo.t * 9) * .12;
      rot = {...Parkour.agachado(0, 0), braco_d:q(-1.35 + b), antebraco_d:q(-.35), braco_e:q(-1.35 - b), antebraco_e:q(-.35), mao_d:q(0), mao_e:q(0)}; semArma = true; combate = true;
    } else if (jogando > 0){
      /* o arremesso: o braço vem de trás por cima do ombro */
      const q = a => [Math.sin(a / 2), 0, 0, Math.cos(a / 2)], u = 1 - jogando / .45, a = u < .35 ? -3.3 * suave(u / .35) : -3.3 + 2.4 * suave((u - .35) / .4);
      rot = {...saida.rot, braco_d:q(a), antebraco_d:q(-1.5 + 1.3 * suave((u - .3) / .45)), mao_d:q(0)}; semArma = true; combate = true;
    }
    if (luta.haste && !combate && e.modo === 'chao') rot = {...rot, braco_d:luta.rot.braco_d, antebraco_d:luta.rot.antebraco_d, mao_d:luta.rot.mao_d};
    else if (luta.haste && e.modo === 'chao' && !emCima && !inteiro) rot = {...rot, braco_d:Animacao.misturar(luta.rot, rot, suave(luta.apontando)).braco_d};
    rotVista = rotVista ? Animacao.misturar(rotVista, rot, 1 - Math.exp(-(combate ? 38 : 30) * dt)) : rot;
    const olhando = combate || guarda;
    const alvo = pregando ? Math.atan2(pregando.o.x - e.x, pregando.o.z - e.z) : olhando && e.modo === 'chao' ? jog.rumo : e.rumo;
    rumoVisto = angulo(rumoVisto + angulo(alvo - rumoVisto) * (1 - Math.exp(-(olhando ? 22 : 40) * dt)));
    return {rot:rotVista, tombo, semArma, rumo:rumoVisto, yQuadril:quadril, y:yVisto};
  }
  /* altura da raiz do corpo na tela, sem tranco na troca entre "pé no chão" e "no ar" */
  function assentar(dt, pose, chaoPe){
    const alvo = pose.yQuadril === null ? pose.y - chaoPe : pose.yQuadril;
    if (ultimoY !== null && e.modo !== modoAntes) folga = ultimoY - alvo;
    modoAntes = e.modo; folga *= Math.exp(-dt * 16);
    const y = alvo + folga; ultimoY = y; altQuadril = y - e.y;
    e.altQuadril = altQuadril;
    return y;
  }

  /* ---------------------------------------------------------------- o que aparece escrito */
  let htmlAntes = '';
  function leitura(){
    if (!e) return {agora:'', frente:'', cor:''};
    const o = e.visto, num = v => v.toFixed(2).replace('.', ',');
    const FAZENDO = {acao:'escalando', ar:'no ar', pendurado:'pendurado (W sobe · S solta · A/D de lado)', corda:'na corda (S desce · W sobe · A/D de lado · Espaço salta)', caido:'caído', tratando:'tratando o ferimento'};
    let agora = FAZENDO[e.modo] || (e.agacha > .5 ? 'abaixado' : e.loco.vel > 3 ? 'correndo' : e.loco.vel > .2 ? 'andando' : 'parado') + (guarda ? ' em guarda' : '');
    if (pregando) agora = 'pregando tábuas: ' + Math.round(100 * pregando.t / pregando.dura) + '%';
    if (salto) agora = 'pulando a janela';
    if (pondo) agora = 'armando: ' + Math.round(100 * pondo.t / pondo.dura) + '%';
    if (abrigo) agora += ' · madeira: ' + mochila.madeira;
    if (arm) agora += ' · X: ' + Armadilhas.TIPOS[arm.tipo].curto + ' ×' + arm.estoque[arm.tipo];
    let frente = '', cor = '';
    const of = oferta();
    if (of){ frente = of.texto; cor = of.pode ? 'verde' : 'amarelo'; }
    else if (e.modo === 'chao' && e.comCorda){ const x = Rapel.explicar(e.comCorda, Rapel.naMao(e.mochila)); frente = e.aviso || x.texto.replace(': F ', ': a tecla G '); cor = !x.pode ? 'vermelho' : x.curta ? 'amarelo' : 'verde'; }
    else if (e.modo === 'chao' && o && o.dist < 1.9 && o.caixa.material !== 'muro' && !o.caixa.invisivel){ frente = o.texto; cor = o.tipo === 'baixo' ? 'amarelo' : o.pode ? 'verde' : 'vermelho'; }
    else if (e.aviso){ frente = e.aviso; cor = 'vermelho'; }
    const ferida = e.ferimento ? (e.ferimento.tratado ? 'Ferimento tratado: o passo está voltando' : 'Ferimento: ' + Saude.FERIMENTOS[e.ferimento.tipo].nome + ' · parado, tecla T') : '';
    return {agora, frente, cor, ferida};
  }
  function escrever(){
    const caixa_ = $('leituraCena'); if (!caixa_) return;
    const l = leitura(), html = '<b>' + l.agora + '</b>' + (l.frente ? ' · ' + l.frente : '') + (l.ferida ? '<br><span>' + l.ferida + '</span>' : '');
    if (html !== htmlAntes){ htmlAntes = html; caixa_.innerHTML = html; caixa_.className = 'sobre caixa so-cena ' + l.cor; }
  }

  function ligar(a){ api = a; }

  return {armadilhas:() => arm, usarArmadilha, escolherArmadilha, reporArmadilhas, abrigo:() => abrigo, abrigoDoCombate, interagir, desenharVidros, madeira:n => { if (mochila) mochila.madeira += n; return mochila?.madeira; }, ativa, MEIO, SEMENTE, CAIXAS, PLACAS, casas:() => casas, casaEm, solidos, terreno, ligar, desenhar, arrumarObjetos, reiniciar, mover, depois, compor, assentar, tecla, pedir, maosOcupadas, ocupado, leitura,
          estado:() => e, quintal:() => quintal, mochila:() => mochila, emGuarda:() => guarda};
})();
