/* Primeira pessoa: como cada arma se comporta e se mexe diante dos olhos.
   Aqui não há tela nem teclado: só os valores do jogo, o estado e as animações.
   Tudo é aparência e regra de jogo (números inventados para equilibrar a partida).
   Espaço da visão: o olho fica em (0,0,0) olhando para +Z; +X é a ESQUERDA da tela; +Y é cima.
   Carregado depois de maos.js. */
const Primeira = (() => {
  const preso = (v, a, b) => Math.max(a, Math.min(b, v));
  const suave = x => { const t = preso(x, 0, 1); return t * t * (3 - 2 * t); };
  const puxa = (v, alvo, ritmo, dt) => v + (alvo - v) * (1 - Math.exp(-ritmo * dt));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------------------------------------------------------------- fichas de jogo */
  /* modo: semi, auto, bomba (puxa a telha), ferrolho, flecha (arco e estilingue: segura e solta), besta */
  const T = (modo, mais) => ({tipo:'tiro', modo, intervalo:.2, pente:10, recarga:1.6, coice:1, dano:34, balas:1, abre:.035, abreMira:.004, falha:0, zoom:1.35, ...mais});
  const FOGO = {
    pistola:T('semi', {pente:15, intervalo:.16}), revolver:T('semi', {pente:6, intervalo:.34, coice:1.7, dano:55, recarga:2.4, tambor:true}),
    submetralhadora:T('auto', {pente:30, intervalo:.075, coice:.6, dano:24, abre:.05}), fuzil_assalto:T('auto', {pente:30, intervalo:.095, coice:.85, dano:38, recarga:2.0}),
    fuzil_madeira:T('auto', {pente:30, intervalo:.11, coice:1.15, dano:42, recarga:2.2}), escopeta:T('bomba', {pente:6, intervalo:.85, coice:2.4, dano:17, balas:9, abre:.07, abreMira:.045, recarga:2.8}),
    rifle_precisao:T('ferrolho', {pente:5, intervalo:1.2, coice:2.2, dano:120, abre:.09, abreMira:.0005, zoom:4.5, recarga:2.8}), metralhadora:T('auto', {pente:80, intervalo:.085, coice:.95, dano:36, abre:.065, abreMira:.012, recarga:4.2, zoom:1.2}),
    fuzil_ferrolho:T('ferrolho', {pente:5, intervalo:1.1, coice:2, dano:95, abre:.075, abreMira:.002, recarga:2.6}), pistola_sinalizadora:T('semi', {pente:1, intervalo:.6, coice:1.4, dano:20, recarga:1.8, luz:true}),
    gamb_pistola:T('semi', {pente:6, intervalo:.45, coice:1.7, dano:30, abre:.075, abreMira:.022, falha:.12, recarga:2.4}), gamb_revolver:T('semi', {pente:5, intervalo:.6, coice:2, dano:44, abre:.07, abreMira:.02, falha:.1, recarga:3.2, tambor:true}),
    gamb_submetralhadora:T('auto', {pente:20, intervalo:.11, coice:1.1, dano:20, abre:.1, abreMira:.04, falha:.06, recarga:2.9}), gamb_fuzil:T('semi', {pente:10, intervalo:.3, coice:1.9, dano:46, abre:.07, abreMira:.016, falha:.09, recarga:2.9}),
    gamb_escopeta:T('semi', {pente:2, intervalo:.5, coice:3, dano:14, balas:11, abre:.12, abreMira:.085, falha:.08, recarga:3.0}), gamb_precisao:T('ferrolho', {pente:1, intervalo:1.4, coice:2.3, dano:90, abre:.1, abreMira:.006, falha:.1, zoom:2.6, recarga:2.4}),
    gamb_guardachuva:T('semi', {pente:1, intervalo:.8, coice:2.1, dano:60, abre:.09, abreMira:.026, falha:.14, recarga:2.6}),
    besta_improvisada:T('besta', {pente:1, intervalo:.5, coice:.5, dano:70, abre:.05, abreMira:.01, recarga:2.6, voo:34}), besta_tatica:T('besta', {pente:1, intervalo:.4, coice:.4, dano:85, abre:.035, abreMira:.002, recarga:1.9, voo:52, zoom:2.2}),
    arco:T('flecha', {pente:1, intervalo:.3, coice:.25, dano:60, abre:.05, abreMira:.008, recarga:.55, voo:38, zoom:1.25}), estilingue:T('flecha', {pente:1, intervalo:.25, coice:.2, dano:18, abre:.06, abreMira:.015, recarga:.45, voo:27, pedra:true, zoom:1.15}),
  };
  /* de perto: golpes em sequência; "forte" sai quando se segura o botão */
  const G = (golpes, mais) => ({tipo:'golpe', golpes, forte:'pesado', dano:30, alcance:1.7, ritmo:1, ...mais});
  const PERTO = {
    nenhum:G(['soco_d', 'soco_e'], {forte:'soco_forte', dano:12, alcance:1.35, ritmo:1.25}),
    faca_combate:G(['corte', 'estocada'], {forte:'estocada_forte', dano:28, alcance:1.45, ritmo:1.35}),
    lanca:G(['estocada_longa'], {forte:'estocada_longa_forte', dano:40, alcance:2.6, ritmo:1}), forcado:G(['estocada_longa'], {forte:'estocada_longa_forte', dano:38, alcance:2.5, ritmo:.95}),
  };
  const PESADAS = ['marreta', 'pa', 'machado_placa', 'machado_bombeiro', 'remo', 'enxada', 'maca_engrenagem', 'violao', 'corrente', 'foice'];
  function ficha(id){
    if (FOGO[id]) return FOGO[id];
    if (PERTO[id]) return PERTO[id];
    const A = ARMAS[id];
    if (PESADAS.includes(id)) return G(['pesado_lado', 'pesado_volta'], {dano:52, alcance:2.0, ritmo:.72});
    return G(['golpe_d', 'golpe_e'], {dano:A?.tipo === 'corte' ? 42 : 34, alcance:1.7, ritmo:1});
  }
  /* o que as peças mudam */
  function fichaComPecas(id, mods = {}){
    const f = {...ficha(id)}, vale = slot => mods[slot] && mods[slot] !== 'nenhum' && modServe(id, slot, mods[slot]) ? mods[slot] : null;
    const mira = vale('mira'), ponta = vale('ponta'), baixo = vale('baixo'), pente = vale('carregador');
    f.mira = id === 'nenhum' ? null : 'ferro';
    if (['rifle_precisao', 'besta_tatica'].includes(id)) f.mira = 'luneta';
    if (id === 'gamb_precisao') f.mira = 'luneta_gamb';
    if (mira){ f.mira = mira; f.zoom = {ponto:1.35, holografica:1.3, luneta:4, arame:1.3}[mira]; if (mira === 'ponto' || mira === 'holografica') f.abreMira *= .8; }
    if (pente){ if (pente === 'estendido') f.pente = Math.round(f.pente * 1.5) + 1; if (pente === 'tambor'){ f.pente = Math.round(f.pente * 2.4); f.recarga *= 1.35; } if (pente === 'duplo') f.recarga *= .65; }
    f.silencio = ponta === 'silenciador'; f.poucoClarao = ponta === 'quebra_chama'; f.lamina = ponta === 'baioneta' || ponta === 'faca_amarrada';
    f.lanterna = baixo === 'lanterna' || baixo === 'lanterna_fita'; f.piscando = baixo === 'lanterna_fita'; f.laser = baixo === 'laser';
    if (f.laser) f.abre = (f.abre || 0) * .55;
    if (baixo === 'punho_frontal' || baixo === 'bipe'){ f.coice = (f.coice || 0) * .75; f.abreMira = (f.abreMira || 0) * .75; }
    return f;
  }

  /* ---------------------------------------------------------------- medidas da arma desenhada */
  function medir(id, mods){
    if (id === 'nenhum') return {boca:[0, 0], mira:3, ponta:4};
    const caixas = [];
    comModificacoes(id, mods)((u0, u1, v0, v1, w0, w1, mat) => caixas.push([Math.min(u0, u1), Math.max(u0, u1), Math.min(v0, v1), Math.max(v0, v1), Math.min(w0, w1), Math.max(w0, w1), mat]));
    const meio = caixas.filter(c => c[2] < .3 && c[3] > -.3 && c[6] !== 'a_laser');
    const fim = Math.max(...meio.map(c => c[1]));
    const naPonta = meio.filter(c => c[1] > fim - .6);
    const E = ENCAIXES[id];
    let boca = [fim, (Math.min(...naPonta.map(c => c[4])) + Math.max(...naPonta.map(c => c[5]))) / 2];
    if (E?.ponta && !(mods?.ponta && mods.ponta !== 'nenhum')) boca = E.ponta.slice();
    else if (E?.ponta && mods?.ponta === 'silenciador') boca = [E.ponta[0] + 7.2, E.ponta[1]];
    else if (E?.ponta) boca = [E.ponta[0] + 2.8, E.ponta[1]];
    /* altura da linha de mira: o centro da peça de mira, ou o alto da própria arma */
    const topo = Math.max(...meio.filter(c => c[1] > -4).map(c => c[5]));
    let mira = topo + (Animacao.classeDaArma(id) === 'curta' ? .55 : .3);
    const peca = mods?.mira && modServe(id, 'mira', mods.mira) ? mods.mira : null;
    if (peca && E?.mira) mira = E.mira[1] + {ponto:1.4, holografica:1.85, luneta:1.8, arame:2.15}[peca];
    return {boca, mira, ponta:fim};
  }

  /* ---------------------------------------------------------------- onde a arma fica na tela */
  const mul = (p, o) => [p[3]*o[0] + p[0]*o[3] + p[1]*o[2] - p[2]*o[1], p[3]*o[1] - p[0]*o[2] + p[1]*o[3] + p[2]*o[0],
                         p[3]*o[2] + p[0]*o[1] - p[1]*o[0] + p[2]*o[3], p[3]*o[3] - p[0]*o[0] - p[1]*o[1] - p[2]*o[2]];
  const eixo = (n, t) => { const r = [0, 0, 0, Math.cos(t / 2)]; r[n] = Math.sin(t / 2); return r; };
  /* giro: x inclina o cano para baixo (+) ou para cima (-); y vira para a esquerda (+); z deita a arma */
  const giroDe = ([x, y, z]) => mul(eixo(1, y), mul(eixo(0, x), eixo(2, z)));

  const classe = id => id === 'nenhum' ? 'soco' : id === 'arco' ? 'arco' : id === 'estilingue' ? 'estilingue' : Animacao.classeDaArma(id);
  /* p = posição do ponto de empunhadura; r = giro [x, y, z] */
  const QUADRIL = {
    curta:{p:[-.135, -.19, .56], r:[0, .035, 0]}, longa:{p:[-.165, -.255, .45], r:[0, .06, 0]},
    mao:{p:[-.25, -.215, .5], r:[-1.02, .12, .28]}, haste:{p:[-.2, -.25, .44], r:[1.36, .12, 0]},
    arco:{p:[.15, -.17, .66], r:[0, .06, .22]}, estilingue:{p:[.11, -.2, .55], r:[0, -.03, .14]}, soco:{p:[-.28, -.25, .58], r:[-.35, .15, .2]},
  };
  /* puxando: a flecha (ou a pedra) fica um pouco abaixo e à direita do centro, paralela ao olhar.
     Assim, na tela, ela aponta para a mira. O arco inclina com a ponta de cima para a direita, sem tapar o alvo */
  const CORDA_ARMADA = {arco:{p:[-.07, -.17, .72], r:[0, 0, .27]}, estilingue:{p:[-.022, -.168, .6], r:[0, 0, .06]}};
  const BLOQUEIO = {mao:{p:[-.18, -.2, .46], r:[-.45, .95, 1.15]}, haste:{p:[-.27, -.28, .52], r:[1.55, .0, -1.25]}, soco:{p:[-.19, -.17, .58], r:[-1.0, .1, .1]}};

  /* golpes: [instante (0..1), deslocamento, giro]; dura = segundos; acerta = instante em que atinge.
     Os valores se somam à posição de descanso da arma. */
  const K = (t, p, r = [0, 0, 0]) => ({t, p, r});
  const GOLPES = {
    golpe_d:{dura:.5, acerta:.46, chaves:[K(0, [0,0,0]), K(.3, [-.04,.16,-.04], [-.25,-.35,-.45]), K(.52, [.24,.1,.14], [1.0,.7,.95]), K(.68, [.42,-.04,.06], [1.45,.95,1.2]), K(1, [0,0,0])]},
    golpe_e:{dura:.48, acerta:.46, chaves:[K(0, [0,0,0]), K(.28, [.34,.1,-.02], [-.1,.7,.9]), K(.52, [.12,.12,.15], [.95,-.25,-.55]), K(.7, [-.1,.02,.08], [1.25,-.65,-.95]), K(1, [0,0,0])]},
    pesado_lado:{dura:.78, acerta:.52, chaves:[K(0, [0,0,0]), K(.38, [-.08,.18,-.1], [-.35,-.6,-.7]), K(.58, [.25,.13,.16], [1.05,.75,1.0]), K(.74, [.45,-.06,.04], [1.55,1.0,1.3]), K(1, [0,0,0])]},
    pesado_volta:{dura:.76, acerta:.52, chaves:[K(0, [0,0,0]), K(.36, [.4,.14,-.06], [-.15,.9,1.15]), K(.58, [.12,.13,.16], [1.0,-.3,-.6]), K(.74, [-.12,-.01,.06], [1.35,-.7,-1.05]), K(1, [0,0,0])]},
    pesado:{dura:.9, acerta:.52, carga:.36, chaves:[K(0, [0,0,0]), K(.36, [.12,.26,-.1], [-1.05,.05,-.28]), K(.55, [.17,.15,.18], [1.15,.1,-.2]), K(.7, [.18,-.02,.1], [1.75,.12,-.2]), K(1, [0,0,0])]},
    corte:{dura:.36, acerta:.45, chaves:[K(0, [0,0,0]), K(.26, [-.03,.1,.02], [.1,-.45,-.6]), K(.52, [.3,.12,.12], [.75,.6,1.0]), K(1, [0,0,0])]},
    estocada:{dura:.34, acerta:.42, chaves:[K(0, [0,0,0]), K(.22, [.03,.03,-.1], [.65,.1,-.2]), K(.46, [.16,.1,.25], [.95,.15,-.2]), K(1, [0,0,0])]},
    estocada_forte:{dura:.62, acerta:.56, carga:.4, chaves:[K(0, [0,0,0]), K(.4, [-.02,.06,-.18], [.75,0,-.4]), K(.6, [.2,.11,.32], [1.0,.18,-.3]), K(1, [0,0,0])]},
    estocada_longa:{dura:.6, acerta:.48, chaves:[K(0, [0,0,0]), K(.3, [-.04,.03,-.24], [.08,-.02,0]), K(.52, [.08,.035,.36], [.06,.06,0]), K(.66, [.08,.035,.32], [.06,.06,0]), K(1, [0,0,0])]},
    estocada_longa_forte:{dura:.86, acerta:.56, carga:.4, chaves:[K(0, [0,0,0]), K(.4, [-.07,.08,-.34], [-.06,-.06,0]), K(.6, [.1,.04,.48], [.09,.08,0]), K(.74, [.1,.035,.44], [.09,.08,0]), K(1, [0,0,0])]},
    soco_d:{dura:.34, acerta:.42, chaves:[K(0, [0,0,0]), K(.18, [-.03,-.02,-.08]), K(.45, [.17,.12,.24], [.1,.25,.5]), K(1, [0,0,0])]},
    soco_e:{dura:.34, acerta:.42, esquerda:true, chaves:[K(0, [0,0,0]), K(.18, [.03,-.02,-.08]), K(.45, [-.17,.12,.24], [.1,-.25,-.5]), K(1, [0,0,0])]},
    soco_forte:{dura:.6, acerta:.55, carga:.38, chaves:[K(0, [0,0,0]), K(.38, [-.09,-.03,-.18], [.2,-.3,-.3]), K(.58, [.21,.15,.3], [.1,.3,.8]), K(1, [0,0,0])]},
    coronhada:{dura:.5, acerta:.45, chaves:[K(0, [0,0,0]), K(.24, [-.05,.04,-.08], [-.1,-.35,.2]), K(.48, [.16,.1,.14], [-.3,1.25,.5]), K(.66, [.18,.06,.1], [-.2,1.35,.55]), K(1, [0,0,0])]},
    baioneta:{dura:.46, acerta:.46, chaves:[K(0, [0,0,0]), K(.26, [0,.02,-.12], [.02,0,0]), K(.5, [.1,.08,.34], [-.03,.04,0]), K(1, [0,0,0])]},
  };
  function amostra(g, u){
    const c = g.chaves; let i = 0; while (i < c.length - 2 && u > c[i + 1].t) i++;
    const a = c[i], b = c[i + 1], x = preso((u - a.t) / (b.t - a.t), 0, 1), s = x * .35 + suave(x) * .65;
    return {p:a.p.map((v, k) => lerp(v, b.p[k], s)), r:a.r.map((v, k) => lerp(v, b.r[k], s))};
  }

  /* ---------------------------------------------------------------- estado */
  function criar(id, mods = {}){
    const f = fichaComPecas(id, mods);
    return {id, mods, f, medida:medir(id, mods), classe:classe(id), municao:f.pente || 0, espera:0, mira:0, correr:0, anda:0, passo:0, tempo:0,
            sacar:0, olho:0, recarga:0, durRecarga:1, golpe:null, proximo:0, carga:0, segurando:false, bloqueio:0, puxada:0,
            armado:0, coice:{z:0, vz:0, x:0, vx:0, z2:0, vz2:0}, clarao:0, ciclo:0, travada:false, gira:[0, 0], balanco:[0, 0], camera:{x:0, y:0}, eventos:[]};
  }
  /* armas com pente que sai. As outras armas de fogo recebem os cartuchos um a um */
  const COM_PENTE = new Set(['pistola', 'submetralhadora', 'fuzil_assalto', 'fuzil_madeira', 'rifle_precisao', 'metralhadora', 'gamb_pistola', 'gamb_submetralhadora', 'gamb_fuzil']);
  /* por onde o pente passa: arma = encaixado; fora = logo abaixo do encaixe; ver = perto dos olhos; baixo = guardando e pegando outro */
  const ROTEIRO_PENTE = {
    vazio:{troca:.67, encaixou:.87, pontos:[[0, 'arma'], [.12, 'arma'], [.22, 'fora'], [.33, 'ver'], [.56, 'ver'], [.65, 'baixo'], [.7, 'baixo'], [.81, 'fora'], [.87, 'arma'], [1, 'arma']]},
    cheio:{troca:.47, encaixou:.83, pontos:[[0, 'arma'], [.12, 'arma'], [.27, 'fora'], [.43, 'baixo'], [.52, 'baixo'], [.74, 'fora'], [.83, 'arma'], [1, 'arma']]},
  };
  const progresso = e => e.recarga > 0 && !e.destravando && e.f.tipo === 'tiro' && e.f.modo !== 'flecha' && e.f.modo !== 'besta' ? 1 - e.recarga / (e.durRecarga || 1) : null;
  function passoDoPente(e){
    const u = progresso(e); if (u === null || !COM_PENTE.has(e.id)) return null;
    const R = e.penteVazio ? ROTEIRO_PENTE.vazio : ROTEIRO_PENTE.cheio, P = R.pontos;
    let i = 0; while (i < P.length - 2 && u > P[i + 1][0]) i++;
    const [u0, de] = P[i], [u1, ate] = P[i + 1];
    return {u, de, ate, t:suave((u - u0) / (u1 - u0)), vazio:!!e.penteVazio, novo:u > R.troca,
            /* a mão sai do apoio, e depois de encaixar dá um tapa no fundo e volta */
            chega:suave(u / .11), tapa:Math.max(0, 1 - Math.abs(u - R.encaixou - .035) / .035), volta:suave((u - R.encaixou - .07) / (1 - R.encaixou - .07))};
  }
  /* cartuchos: uma ida da mão até a arma para cada bala que falta. k = quanto está perto da arma (0..1) */
  const PREPARA = .26, FECHA = .16;                    /* segundos antes do primeiro e depois do último */
  const ENTRA = .6;                                    /* em que ponto de cada ida o cartucho entra */
  const idas = e => { const d = e.durRecarga || 1, de = PREPARA / d, ate = 1 - FECHA / d; return {de, ate, n:e.cartuchos || 1}; };
  function passoDoCartucho(e){
    const u = progresso(e); if (u === null || COM_PENTE.has(e.id)) return null;
    const {de, ate, n} = idas(e); if (u < de || u >= ate) return null;
    const v = (u - de) / (ate - de) * n, c = v - Math.floor(v);
    return {u, vez:Math.floor(v), de:n, k:c < .55 ? suave(c / .55) : c < .74 ? 1 : 1 - suave((c - .74) / .26), naMao:c < ENTRA, empurra:c >= .55 && c < .74 ? Math.sin((c - .55) / .19 * Math.PI) : 0};
  }
  /* quantos cartuchos já entraram neste instante */
  function jaEntraram(e){
    const u = progresso(e); if (u === null) return 0;
    const {de, ate, n} = idas(e), v = (u - de) / (ate - de) * n;
    return Math.max(0, Math.min(n, Math.floor(v - ENTRA) + 1));
  }

  const emUso = e => e.recarga > 0 || e.golpe || e.sacar < .85;

  function recarregar(e){
    if (e.f.tipo !== 'tiro' || e.recarga > 0 || e.golpe) return false;
    if (!e.travada && e.municao >= e.f.pente) return false;
    e.penteVazio = !e.travada && e.municao <= 0 && COM_PENTE.has(e.id);
    /* com o pente vazio ele para um instante olhando para o pente */
    e.durRecarga = e.travada ? 1.1 : e.f.recarga + (e.penteVazio ? .8 : 0);
    /* sem pente: o tempo depende de quantas balas faltam */
    e.cartuchos = 0;
    if (!e.travada && !COM_PENTE.has(e.id) && e.f.modo !== 'flecha' && e.f.modo !== 'besta'){
      const cada = Math.max(.45, Math.min(e.f.recarga - PREPARA - FECHA, e.f.recarga / e.f.pente));
      e.cartuchos = e.f.pente - e.municao; e.antesDeCarregar = e.municao; e.durRecarga = PREPARA + FECHA + e.cartuchos * cada;
    }
    e.recarga = e.durRecarga; e.destravando = e.travada; e.eventos.push({tipo:e.travada ? 'destravar' : 'recarregar'}); return true;
  }
  function golpear(e, nome, forte){
    if (e.golpe || e.recarga > 0 || e.sacar < .85) return false;
    const g = GOLPES[nome]; e.golpe = {nome, g, t:forte && g.carga ? g.carga * g.dura / e.ritmoGolpe : 0, forte, feito:false}; e.eventos.push({tipo:'golpe', nome}); return true;
  }
  function atirar(e, acaso){
    const f = e.f;
    if (e.espera > 0 || emUso(e) || e.ciclo > 0) return false;
    if (e.travada){ e.espera = .3; e.eventos.push({tipo:'clique'}); return false; }
    if (e.municao <= 0){ e.espera = .3; e.eventos.push({tipo:'vazio'}); recarregar(e); return false; }
    if (f.falha && acaso() < f.falha){ e.travada = true; e.espera = .4; e.coice.vz2 += 3; e.eventos.push({tipo:'falha'}); return false; }
    e.municao--; e.espera = f.intervalo;
    const mirando = e.mira, k = f.coice * (1 - mirando * .42);
    e.coice.vz -= 1.25 * k; e.coice.vx -= (e.classe === 'curta' ? 7.5 : 4.2) * k; e.coice.vz2 += (acaso() - .5) * 5 * k;
    e.camera.y += .011 * k * (f.modo === 'auto' ? .8 : 1.25); e.camera.x += (acaso() - .5) * .008 * k;
    e.clarao = f.tipo === 'tiro' && f.modo !== 'besta' && f.modo !== 'flecha' && !f.silencio ? (f.poucoClarao ? .03 : .06) : 0;
    if (f.modo === 'bomba' || f.modo === 'ferrolho') e.ciclo = e.cicloTotal = Math.min(.75, f.intervalo * .8);
    const espalha = lerp(f.abre * (1 + e.anda * 1.2), f.abreMira, mirando);
    e.eventos.push({tipo:'disparo', balas:f.balas, espalha, dano:f.dano * (e.forcaPuxada ?? 1), voo:f.voo ? f.voo * (e.forcaPuxada ?? 1) : 0, pedra:f.pedra, luz:f.luz, capsula:f.tipo === 'tiro' && !f.voo && !f.tambor && f.modo !== 'bomba' && f.modo !== 'ferrolho'});
    return true;
  }

  /* adianta o tempo. c = {atirar (botão segurado), apertou (acabou de apertar), mirar, correr, andando 0..1, recarregar, bater, olhar:[dx,dy]} */
  function passo(e, dt, c, acaso = Math.random){
    const f = e.f;
    e.eventos = []; e.tempo += dt;
    e.ritmoGolpe = f.ritmo || 1;
    e.sacar = Math.min(1, e.sacar + dt / .42);
    /* arco e estilingue sobem até a mira ao puxar e descem sem tranco depois do disparo */
    const armar = e.puxada > .02 ? 1 : 0; e.armado = puxa(e.armado, armar, armar ? 13 : 5, dt);
    e.espera = Math.max(0, e.espera - dt); e.clarao = Math.max(0, e.clarao - dt);
    const correndo = c.correr && c.andando > .5 && !c.mirar && !c.atirar && !e.golpe && e.recarga <= 0;
    e.correr = puxa(e.correr, correndo ? 1 : 0, 9, dt);
    e.anda = puxa(e.anda, c.andando, 10, dt);
    e.passo += dt * (correndo ? 12.5 : 8.2) * e.anda;
    const podeMirar = f.tipo === 'tiro' && e.recarga <= 0 && !e.golpe && !(e.ciclo > 0 && f.modo === 'ferrolho' && f.mira?.startsWith('luneta'));
    e.mira = puxa(e.mira, c.mirar && podeMirar ? 1 : 0, f.mira?.startsWith('luneta') ? 11 : 15, dt);
    e.olho = puxa(e.olho, e.mira > .72 ? 1 : 0, e.mira > .72 ? 6.5 : 16, dt);
    e.bloqueio = puxa(e.bloqueio, c.mirar && f.tipo === 'golpe' && !e.golpe ? 1 : 0, 14, dt);
    if (c.recarregar) recarregar(e);

    if (e.ciclo > 0){ const antes = e.ciclo; e.ciclo = Math.max(0, e.ciclo - dt); const meio = e.cicloTotal * .5; if (antes > meio && e.ciclo <= meio) e.eventos.push({tipo:'ciclo', capsula:true}); }
    if (e.recarga > 0){
      e.recarga -= dt;
      /* cada cartucho conta na hora em que a mão o coloca */
      if (e.cartuchos && !e.destravando && e.recarga > 0){
        const agora = e.antesDeCarregar + jaEntraram(e);
        if (agora > e.municao){ e.municao = agora; e.eventos.push({tipo:'cartucho', municao:agora}); }
      }
      if (e.recarga <= 0){ e.recarga = 0; if (e.destravando) e.travada = false; else e.municao = f.pente; e.destravando = false; e.eventos.push({tipo:'pronta'}); }
    }

    if (f.tipo === 'tiro'){
      if (f.modo === 'flecha'){                      /* segura para puxar, solta para disparar */
        if (c.atirar && e.espera <= 0 && !emUso(e) && e.municao > 0) e.puxada = Math.min(1, e.puxada + dt / .65);
        else if (!c.atirar && e.puxada > .22){ e.forcaPuxada = .45 + .55 * e.puxada; atirar(e, acaso); e.puxada = 0; }
        else e.puxada = puxa(e.puxada, 0, 14, dt);
        if (e.municao <= 0 && e.recarga <= 0 && e.espera <= 0) recarregar(e);
      } else if (f.modo === 'auto' ? c.atirar : c.apertou) atirar(e, acaso);
      if (f.modo === 'besta' && e.municao <= 0 && e.recarga <= 0 && e.espera <= 0) recarregar(e);
      if (c.bater) golpear(e, f.lamina ? 'baioneta' : 'coronhada', false);
    } else {
      /* toque = golpe da sequência; segurar = carregar o golpe forte */
      if (c.apertou && !e.golpe && e.sacar >= .85){ e.segurando = true; e.carga = 0; }
      if (e.segurando){
        if (c.atirar) e.carga = Math.min(1, e.carga + dt / .55);
        else {
          if (e.carga >= .75) golpear(e, f.forte, true);
          else golpear(e, f.golpes[e.proximo++ % f.golpes.length], false);
          e.segurando = false; e.carga = 0;
        }
      }
      if (c.bater) golpear(e, f.golpes[e.proximo++ % f.golpes.length], false);
    }

    if (e.golpe){
      const h = e.golpe, dura = h.g.dura / e.ritmoGolpe, antes = h.t / dura;
      h.t += dt;
      if (!h.feito && h.t / dura >= h.g.acerta && antes <= 1){
        h.feito = true;
        const deArma = f.tipo === 'tiro';
        e.eventos.push({tipo:'acerto', dano:deArma ? (h.nome === 'baioneta' ? 45 : 18) : f.dano * (h.forte ? 2.1 : 1), alcance:deArma ? (h.nome === 'baioneta' ? 2.1 : 1.5) : f.alcance * (h.forte ? 1.1 : 1), forte:h.forte});
        e.camera.y -= h.forte ? .02 : .008;
      }
      if (h.t >= dura) e.golpe = null;
    }

    /* coice: molas que voltam ao lugar */
    const k = e.coice, partes = Math.max(1, Math.ceil(dt / .008)), h = dt / partes;
    for (let i = 0; i < partes; i++){
      k.vz += (-210 * k.z - 20 * k.vz) * h; k.z += k.vz * h;
      k.vx += (-170 * k.x - 19 * k.vx) * h; k.x += k.vx * h;
      k.vz2 += (-190 * k.z2 - 17 * k.vz2) * h; k.z2 += k.vz2 * h;
    }
    /* a arma atrasa um pouco quando se olha para os lados */
    e.balanco[0] = puxa(e.balanco[0], preso(c.olhar?.[0] / Math.max(dt, .001) * .018 || 0, -.14, .14), 9, dt);
    e.balanco[1] = puxa(e.balanco[1], preso(c.olhar?.[1] / Math.max(dt, .001) * .018 || 0, -.1, .1), 9, dt);
    return e.eventos;
  }

  /* ---------------------------------------------------------------- a posição neste instante */
  /* devolve {arma:{p, q}, esquerda:[dx,dy,dz] (em blocos da arma: u, w, v), esquerdaSolta, outra (soco), escondeEsquerda} */
  function posicao(e){
    const cl = QUADRIL[e.classe] ? e.classe : 'mao', base = QUADRIL[cl], k = ESCALA;
    let p = base.p.slice(), r = base.r.slice(), mao = [0, 0, 0], outra = null;
    const soma = (dp, dr = [0, 0, 0], n = 1) => { p = p.map((v, i) => v + dp[i] * n); r = r.map((v, i) => v + dr[i] * n); };
    const mistura = (alvo, t) => { p = p.map((v, i) => lerp(v, alvo.p[i], t)); r = r.map((v, i) => lerp(v, alvo.r[i], t)); };
    const m = suave(e.mira);
    if (m > .001){
      /* mirando: a linha de mira passa exatamente pelo centro da tela */
      const alvo = CORDA_ARMADA[cl] ? CORDA_ARMADA[cl]
        /* primeiro a arma sobe à altura do olho, longe; depois vem até ele (a linha de mira não sai do centro) */
        : {p:[0, -e.medida.mira * k, cl === 'curta' ? lerp(.66, .5, suave(e.olho)) : lerp(.42, .275, suave(e.olho))], r:[0, 0, 0]};
      mistura(alvo, m);
    }
    const calmo = 1 - m * .85;
    /* respiração e passos */
    soma([Math.sin(e.tempo * 1.3) * .0025, Math.sin(e.tempo * 2.1) * .004, 0], [Math.sin(e.tempo * 2.1) * .008, 0, 0], calmo);
    soma([Math.sin(e.passo) * .016, -Math.abs(Math.cos(e.passo)) * .017 + .008, 0], [0, Math.sin(e.passo) * .018, Math.sin(e.passo) * .03], e.anda * calmo);
    if (e.correr > .001){
      const alvo = cl === 'longa' ? {p:[-.05, -.28, .34], r:[.38, .95, .25]} : cl === 'curta' ? {p:[-.2, -.29, .38], r:[-.75, .2, .1]} : {p:[base.p[0] - .04, base.p[1] - .06, base.p[2] - .04], r:[base.r[0] + .35, base.r[1] + .25, base.r[2] + .2]};
      mistura(alvo, e.correr);
      soma([Math.sin(e.passo) * .03, -Math.abs(Math.cos(e.passo)) * .02, 0], [0, 0, Math.sin(e.passo) * .07], e.correr);
    }
    if (e.bloqueio > .001 && BLOQUEIO[cl]) mistura(BLOQUEIO[cl], suave(e.bloqueio));
    soma([e.balanco[0] * .12, -e.balanco[1] * .1, 0], [e.balanco[1] * .55, -e.balanco[0] * .7, e.balanco[0] * .35], 1 - m * .7);
    /* carregando o golpe forte */
    if (e.segurando && e.carga > .18){
      const g = GOLPES[e.f.forte], a = amostra(g, g.carga), n = suave((e.carga - .18) / .75);
      soma(a.p, a.r, n); soma([Math.sin(e.tempo * 38) * .003, Math.cos(e.tempo * 31) * .003, 0], [0, 0, 0], n);
    }
    if (e.golpe){
      const h = e.golpe, a = amostra(h.g, preso(h.t / (h.g.dura / e.ritmoGolpe), 0, 1));
      if (h.g.esquerda) outra = a; else soma(a.p, a.r);
    }
    if (CORDA_ARMADA[cl]){ if (e.armado > .001) mistura(CORDA_ARMADA[cl], suave(e.armado) * (1 - m)); }
    else if (e.puxada > 0) soma([.03, .02, .02], [0, 0, 0], suave(e.puxada));
    /* coice */
    soma([e.coice.z2 * .012, -e.coice.x * .012, e.coice.z * .55], [e.coice.x * .55, e.coice.z2 * .05, e.coice.z2 * .22]);
    /* puxar a telha ou o ferrolho */
    if (e.ciclo > 0){
      const u = 1 - e.ciclo / e.cicloTotal, vai = Math.sin(preso((u - .15) / .7, 0, 1) * Math.PI);
      if (e.f.modo === 'bomba'){ mao = [-4.2 * vai, 0, 0]; soma([0, -.025, -.03], [-.07, 0, .12], vai); }
      else soma([.04, -.04, -.04], [-.12, .1, -.55], vai * (1 - m * .5));
    }
    /* recarga: a arma deita, a mão de apoio vai buscar a munição e volta */
    if (e.recarga > 0){
      const u = 1 - e.recarga / e.durRecarga, deita = suave(u / .18) * (1 - suave((u - .82) / .18));
      if (e.f.modo === 'flecha'){ mao = [0, -16 * (1 - suave((u - .3) / .6)), 0]; soma([0, -.03, 0], [.1, 0, 0], deita); }
      else if (e.destravando){ soma([.03, -.02, -.02], [-.15, .12, -.6], deita); soma([0, Math.sin(u * 42) * .012, 0], [0, 0, 0], deita); }
      else {
        const alvo = e.classe === 'curta' ? [-.42, .1, .5] : [-.2, .35, .75];
        soma(e.classe === 'curta' ? [.03, .03, -.06] : [.05, .01, -.03], alvo, deita);
        const vai = suave((u - .12) / .22) * (1 - suave((u - .52) / .22));
        mao = [mao[0] - 2 * vai, -17 * vai, 3 * vai];
        /* a arma sobe um pouco, para o encaixe aparecer na tela */
        if (progresso(e) !== null) soma(e.classe === 'curta' ? [.1, .07, .04] : [.12, .115, .07], [0, 0, e.classe === 'curta' ? .1 : .22], deita);
        /* olhando o pente vazio: a arma sai da frente, para baixo e para a direita */
        if (e.penteVazio) soma([-.18, -.16, 0], [.12, 0, 0], suave((u - .19) / .13) * (1 - suave((u - .56) / .16)));
        const tapa = Math.max(0, 1 - Math.abs(u - (COM_PENTE.has(e.id) ? (e.penteVazio ? .905 : .865) : .9)) / .05);
        soma([0, .022, 0], [-.07, 0, 0], tapa);
      }
    }
    /* sacando a arma: sobe de baixo da tela */
    const s = 1 - suave(e.sacar);
    soma([-.05, -.34, -.06], [.9, -.2, -.3], s);
    return {p, q:giroDe(r), mao, outra:outra && {p:outra.p, q:giroDe(outra.r)}, lunetaCheia:e.f.mira?.startsWith('luneta') && e.mira > .86 && e.olho > .45};
  }

  return {COM_PENTE, passoDoPente, passoDoCartucho, progresso, ficha, fichaComPecas, medir, criar, passo, posicao, recarregar, classe, giroDe, GOLPES, FOGO, QUADRIL, mul, eixo};
})();
