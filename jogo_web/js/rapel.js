/* Corda e rapel.
   - Corda militar: não se gasta (vale quantas vezes quiser) e tem a metragem máxima do jogo.
   - Corda de pano: o tamanho depende de quantos panos entram nela, e ela serve UMA vez só.
   Com corda, o personagem lança o gancho e sobe um muro alto demais para as mãos, ou amarra no alto e desce de rapel.
   Aqui ficam as regras (mochila e metragem) e as animações. Carregado depois de parkour.js. */
const Rapel = (() => {
  const AJUSTES = {
    maxima:30,               /* m: a maior corda do jogo (é o tamanho da militar) */
    metrosPorPano:.8,        /* quanto cada pano rende */
    minimoPanos:2,
    corpo:1.8,               /* pendurado na ponta, os pés ficam isto abaixo do fim da corda */
    arremesso:10,            /* altura máxima para lançar o gancho */
    quedaMinima:1.8,         /* abaixo disto não vale a pena o rapel: dá para pular */
    descer:1.55, subir:.8,   /* m/s */
    salto:1.15,              /* quanto desce a mais num salto de rapel */
    afasta:.62,              /* quadril longe da parede, com os pés nela */
    deLado:.95,              /* m/s andando de lado na parede */
    abertura:.75,            /* quanto dá para se afastar do prumo da corda (radianos) */
    guardar:.85,             /* s para guardar a arma antes de usar a corda */
  };
  const A = AJUSTES;
  const preso = (v, a, b) => Math.max(a, Math.min(b, v));
  const suave = x => { const t = preso(x, 0, 1); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const num = v => v.toFixed(1).replace('.', ',');

  /* ---------------------------------------------------------------- as cordas e a mochila */
  const maximoDePanos = () => Math.floor(A.maxima / A.metrosPorPano + 1e-6);
  const metrosDe = panos => Math.min(A.maxima, Math.round(panos * A.metrosPorPano * 100) / 100);
  const militar = () => ({tipo:'militar', metros:A.maxima});
  const dePano = panos => ({tipo:'pano', metros:metrosDe(panos), panos, usada:false});
  function criarMochila(panos = 40, temMilitar = false){ return {panos, temMilitar, pano:null, escolhida:temMilitar ? 'militar' : 'nenhuma'}; }
  /* gasta os panos e devolve a corda feita (ou um texto dizendo por que não deu) */
  function fazer(m, panos){
    if (m.pano) return 'você já tem uma corda de pano na mochila';
    if (panos < A.minimoPanos) return `precisa de pelo menos ${A.minimoPanos} panos`;
    if (panos > maximoDePanos()) return `mais que ${maximoDePanos()} panos passa do tamanho máximo`;
    if (panos > m.panos) return `faltam panos: você tem ${m.panos}`;
    m.panos -= panos; m.pano = dePano(panos); m.escolhida = 'pano'; return m.pano;
  }
  const naMao = m => !m ? null : m.escolhida === 'militar' && m.temMilitar ? militar() : m.escolhida === 'pano' && m.pano && !m.pano.usada ? m.pano : null;
  /* a de pano é gasta no momento em que é presa */
  function gastar(m, corda){
    if (corda.tipo !== 'pano') return;
    corda.usada = true; if (m.pano === corda) m.pano = null;
    if (m.escolhida === 'pano') m.escolhida = m.temMilitar ? 'militar' : 'nenhuma';
  }
  /* quantos metros faltam para os pés chegarem ao chão com folga (0 = chega) */
  const falta = (altura, metros) => Math.max(0, altura - metros - A.corpo);

  /* ---------------------------------------------------------------- há espaço para a corda? */
  const noPonto = (caixas, alvo, x, z, de, ate) => caixas.some(k => k !== alvo && k.y1 > de && k.y0 < ate && x > k.x0 - .03 && x < k.x1 + .03 && z > k.z0 - .03 && z < k.z1 + .03);
  /* p = a parede escolhida; d = quanto de lado em relação ao ponto de partida. Devolve '' ou o que atrapalha */
  function impedimento(caixas, p, d = 0){
    const em = (s, w) => [p.origem[0] + p.fx * s - p.fz * (d + w), p.origem[1] + p.fz * s + p.fx * (d + w)];
    /* em cima: onde ele vai ficar de pé (ou de onde vai sair) não pode haver teto nem outra peça */
    for (const s of [.2, .45]) for (const w of [-.18, 0, .18]){ const [x, z] = em(s, w); if (noPonto(caixas, p.caixa, x, z, p.topo + .35, p.topo + 1.9)) return 'tem teto ou outra peça em cima: não dá para usar a corda aqui'; }
    /* na frente da parede: por onde a corda e o corpo passam */
    for (const s of [-.2, -.45, -.68]) for (const w of [-.2, 0, .2]){ const [x, z] = em(s, w); if (noPonto(caixas, p.caixa, x, z, p.base + .45, p.topo + 1.1)) return 'tem coisa no caminho da corda: tente em outro ponto'; }
    return '';
  }
  function comEspaco(caixas, p){
    if (!p) return p;
    p.bloqueio = p.caixa.semCorda || impedimento(caixas, p);
    if (!p.bloqueio){
      /* de lado, só vai até onde continua havendo espaço */
      for (const [chave, sentido] of [['dMin', -1], ['dMax', 1]]){
        let d = 0; while (Math.abs(d) < 6 && !impedimento(caixas, p, d + sentido * .15)) d += sentido * .15;
        p[chave] = d;
      }
    }
    return p;
  }

  /* ---------------------------------------------------------------- o que dá para fazer com a corda aqui */
  /* parede = {caixa, fx, fz (para dentro da parede), origem [x,z] no meio da face onde ele está, a0, a1, topo, base} */
  function procurar(e, caixas){
    /* 1) em cima de algo, com a beirada à frente: rapel */
    const hx = Math.sin(e.rumo), hz = Math.cos(e.rumo);
    if (e.y > 1.2) for (const c of caixas){
      if (Math.abs(c.y1 - e.y) > .05 || e.x < c.x0 - .08 || e.x > c.x1 + .08 || e.z < c.z0 - .08 || e.z > c.z1 + .08) continue;
      for (const [ox, oz, plano, a0, a1, fundo] of [[0, 1, c.z1, c.x0, c.x1, c.z1 - c.z0], [0, -1, c.z0, c.x0, c.x1, c.z1 - c.z0], [1, 0, c.x1, c.z0, c.z1, c.x1 - c.x0], [-1, 0, c.x0, c.z0, c.z1, c.x1 - c.x0]]){
        const deFrente = hx * ox + hz * oz, dist = ox ? (plano - e.x) * ox : (plano - e.z) * oz;
        if (deFrente < .72 || dist > 1.15 || dist < -.1) continue;
        const lado = preso(ox ? e.z : e.x, a0 + .3, Math.max(a0 + .3, a1 - .3)), origem = ox ? [plano, lado] : [lado, plano];
        const base = Parkour.chaoEm(caixas, origem[0] + ox * .6, origem[1] + oz * .6, e.y - .62), altura = e.y - base;
        if (altura >= A.quedaMinima) return comEspaco(caixas, {como:'descer', caixa:c, fx:-ox, fz:-oz, origem, a0, a1, fundo, topo:e.y, base, altura, dist});
      }
    }
    /* 2) embaixo de um muro que as mãos não alcançam: lançar o gancho e subir */
    const o = Parkour.olhar(caixas, e, 2.4);
    if (o && (o.tipo === 'alto' || (o.tipo === 'recusa' && o.altura > Parkour.AJUSTES.agarrar))){
      const lado = preso(o.nx ? e.z : e.x, o.a0 + .3, Math.max(o.a0 + .3, o.a1 - .3)), origem = o.nx ? [o.plano, lado] : [lado, o.plano];
      return comEspaco(caixas, {como:'subir', caixa:o.caixa, fx:o.nx, fz:o.nz, origem, a0:o.a0, a1:o.a1, fundo:o.fundo, topo:o.caixa.y1, base:e.y, altura:o.altura, dist:o.dist, cortada:o.tipo === 'recusa' && !o.caixa.semCorda});
    }
    return null;
  }
  function explicar(p, corda){
    if (!p) return null;
    const oque = p.como === 'subir' ? `muro de ${num(p.altura)} m` : `beirada de ${num(p.altura)} m`;
    if (p.bloqueio) return {texto:`${oque}: ${p.bloqueio}`, pode:false};
    if (p.cortada) return {texto:`${oque}: o caco de vidro cortaria a corda`, pode:false};
    if (!corda) return {texto:`${oque}: sem corda ${p.como === 'subir' ? 'não dá para subir' : 'só pulando'}`, pode:false};
    const nome = corda.tipo === 'militar' ? `corda militar (${num(corda.metros)} m)` : `corda de pano (${num(corda.metros)} m)`;
    if (p.como === 'subir' && p.altura > A.arremesso) return {texto:`${oque}: alto demais para lançar o gancho`, pode:false};
    const f = falta(p.altura, corda.metros);
    if (p.como === 'subir') return f > 0 ? {texto:`${oque}: a ${nome} não alcança, faltam ${num(f)} m`, pode:false} : {texto:`${oque}: F lança a ${nome} e sobe`, pode:true};
    return {texto:`${oque}: F faz rapel com a ${nome}${f > 0 ? ` · não chega ao chão, faltam ${num(f)} m` : ''}`, pode:true, curta:f > 0};
  }

  /* ---------------------------------------------------------------- coordenadas em relação à parede */
  /* s = para dentro da parede (negativo = do lado de fora); d = para a direita de quem olha a parede */
  const noMundo = (r, s, y, d = 0) => [r.origem[0] + r.fx * s - r.fz * d, y, r.origem[1] + r.fz * s + r.fx * d];
  function colocar(e, r, s){ const p = noMundo(r, s, 0, r.d); e.x = p[0]; e.z = p[2]; }
  /* leva uma mão até um ponto [s, y, d]; devolve a pose com o braço calculado */
  function maoEm(r, rot, yQuadril, s, lado, [ps, py, pd], punho, peso = 1){
    if (peso <= .01) return rot;
    const g = Animacao.esqueleto(rot), alvo = [-(pd - r.d), py - yQuadril, ps - s], maoQ = Parkour.giroX(punho);
    const centro = Animacao.pontoDaPeca('mao_' + lado, ESTRUTURA['mao_' + lado].tam.map(v => v / 2)), sinal = lado === 'e' ? 1 : -1;
    const ik = Animacao.braco(lado, g.pos['braco_' + lado], Animacao.punhoPara(alvo, maoQ, centro), [sinal * .85, -.5, -.35], maoQ, g.G.torax);
    const saida = {...rot};
    for (const n of Object.keys(ik)) saida[n] = peso >= .99 ? ik[n] : Animacao.misturar({[n]:rot[n]}, {[n]:ik[n]}, peso)[n];
    return saida;
  }
  /* onde as mãos pegam a corda enquanto ele está no rapel: a esquerda guia na frente, a direita freia no quadril */
  const GUIA = (s, h) => [s + .27, h + .36, 0];
  const FREIO = (s, h) => [s - .03, h - .02, .27];
  function naCorda(r, rot, s, h, peso = 1, passada = 0){
    const g = GUIA(s, h), f = FREIO(s, h);
    rot = maoEm(r, rot, h, s, 'e', [g[0], g[1] + passada * .13, r.d + .06], -2.2, peso);
    return maoEm(r, rot, h, s, 'd', [f[0], f[1] - passada * .08, r.d + f[2]], -.7, peso);
  }

  const POSE = (passo = 0, encolhe = 0, mais = {}) => Parkour.corpo({q:-.22, t:.02, c:.16,
    pd:[-1.38 - .17 * passo - .5 * encolhe, .52 + .3 * Math.max(0, passo) + 1.0 * encolhe, -1.05], pe:[-1.38 + .17 * passo - .5 * encolhe, .52 + .3 * Math.max(0, -passo) + 1.0 * encolhe, -1.05], ...mais});

  /* ---------------------------------------------------------------- começar */
  function iniciar(e, p, corda, mochila){
    const r = {...p, corda, mochila, fase:'', t:0, d:0, vd:0, onda:0, vonda:0, passoLado:0, h:0, v:0, passo:0, salto:0, solto:1, recolhido:0, s0:0, y0:0, rumo0:e.rumo, aviso:'', rot0:e.rot};
    r.rumo = Math.atan2(p.fx, p.fz);
    r.s0 = (e.x - p.origem[0]) * p.fx + (e.z - p.origem[1]) * p.fz; r.d0 = -(e.x - p.origem[0]) * p.fz + (e.z - p.origem[1]) * p.fx; r.d = r.d0;
    r.y0 = e.y;
    e.rapel = r; e.modo = 'corda'; e.acao = null; e.loco.vel = 0;
    r.primeira = p.como === 'descer' ? 'amarra' : 'arremesso';
    if (e.temArma){ r.rot0 = e.rot; fase(e, 'guarda'); e.evento.push('guarda a arma'); } else fase(e, r.primeira);
    gastar(mochila, corda);
    e.evento.push(p.como === 'descer' ? 'amarra a corda' : 'lança o gancho');
  }
  function fase(e, nome){ const r = e.rapel; r.fase = nome; r.t = 0; e.de = e.rot; e.trans = 0; }
  const anotar = (e, t) => { if (e.evento[e.evento.length - 1] !== t) e.evento.push(t); };

  /* até onde dá para ir de lado: a largura da parede e o quanto a corda deixa abrir */
  function limites(r){
    const i = r.fx ? 1 : 0, sinal = r.fx ? r.fx : -r.fz, a = (r.a0 + .28 - r.origem[i]) / sinal, b = (r.a1 - .28 - r.origem[i]) / sinal;
    const abre = Math.max(.25, (r.topo - r.h) * Math.tan(A.abertura));
    return [Math.max(Math.min(a, b), -abre, r.dMin ?? -99), Math.min(Math.max(a, b), abre, r.dMax ?? 99)];
  }
  /* altura do quadril em que a corda acaba: de lado, ela alcança menos */
  const fimDaCorda = r => { const l = r.corda.metros - .25; return r.topo - Math.sqrt(Math.max(.04, l * l - r.d * r.d)); };
  const giraEm = (n, t, q) => { const s = Math.sin(t / 2), c = Math.cos(t / 2), a = [0, 0, 0, c]; a[n] = s;
    return [a[3]*q[0] + a[0]*q[3] + a[1]*q[2] - a[2]*q[1], a[3]*q[1] - a[0]*q[2] + a[1]*q[3] + a[2]*q[0], a[3]*q[2] + a[0]*q[1] - a[1]*q[0] + a[2]*q[3], a[3]*q[3] - a[0]*q[0] - a[1]*q[1] - a[2]*q[2]]; };

  /* sequência de chaves [tempo, valor] com passagem suave */
  function chaves(lista, t){
    const ts = lista.map(k => k[0]), vs = lista.map(k => k[1]);
    if (t <= ts[0]) return vs[0];
    if (t >= ts[ts.length - 1]) return vs[vs.length - 1];
    let i = 0; while (i < ts.length - 2 && t > ts[i + 1]) i++;
    return Parkour.curva(vs, ts, i, (t - ts[i]) / (ts[i + 1] - ts[i]));
  }
  function poses(lista, t){
    if (t <= lista[0][0]) return lista[0][1];
    for (let i = 1; i < lista.length; i++) if (t <= lista[i][0]){ const [a, pa] = lista[i - 1], [b, pb] = lista[i], u = (t - a) / (b - a); return Animacao.misturar(pa, pb, u * .4 + suave(u) * .6); }
    return lista[lista.length - 1][1];
  }

  /* deixa o personagem de pé no chão e devolve o controle */
  function soltar(e, parado){
    const r = e.rapel;
    e.loco = Locomocao.novo(e.rumo); e.de = e.rot; e.trans = 0; e.modo = 'chao'; e.rapel = null;
    if (r.corda.tipo === 'pano') e.deixadas.push(corrida(r, true));
    else anotar(e, 'recolhe a corda');
  }

  /* ---------------------------------------------------------------- um passo de tempo */
  /* c = os mesmos comandos do Parkour (cima, baixo, pular, usar) */
  function passo(e, dt, c, caixas, parado){
    const r = e.rapel, Q = e.quadril, P = Parkour.pose, livre = parado.livre, topo = r.topo, alturaDaParede = r.topo - r.base;
    r.t += dt;
    let rot, h = null, s = 0, yQuadril = null;
    const virar = dura => { e.rumo = Locomocao.angulo(r.rumo0 + Locomocao.angulo(r.rumo - r.rumo0) * suave(r.t / dura)); r.d = r.d0 * (1 - suave(r.t / dura)); };

    if (r.fase === 'guarda'){
      /* guarda a arma antes de pôr as mãos na corda (o braço é cuidado pelo Parkour) */
      rot = r.rot0 && r.t < .12 ? r.rot0 : livre;
      e.y = r.y0;
      if (r.t >= A.guardar){ r.rot0 = rot = e.rot; r.rumo0 = e.rumo; fase(e, r.primeira); }
    } else if (r.fase === 'amarra'){
      /* vira de costas para a beirada, abaixa, amarra no ponto de apoio e joga a ponta */
      virar(.55);
      s = chaves([[0, r.s0], [.55, .42]], r.t);
      const agacha = P('amortece', {t:.62, bd:[-1.25, .15, .35], be:[-1.25, .15, .35]});
      rot = poses([[0, r.rot0], [.55, agacha], [1.45, agacha], [1.7, P('prepara')]], r.t);
      colocar(e, r, s); e.y = topo;
      if (r.t > .45 && r.t < 1.3){
        const no = Math.sin(r.t * 17) * .045, y = topo + .2;
        h = topo + Q * .55;
        rot = maoEm(r, rot, h, s, 'e', [.86, y + no, .08], -1.5, suave((r.t - .45) / .2));
        rot = maoEm(r, rot, h, s, 'd', [.86, y - no, -.08], -1.5, suave((r.t - .45) / .2));
        h = null;
      }
      r.solto = suave((r.t - 1.15) / .45);
      if (r.t >= 1.75){ fase(e, 'borda'); anotar(e, 'passa a beirada'); }
    } else if (r.fase === 'borda'){
      /* anda de costas até a beirada e deita o corpo para fora, com os pés na parede */
      s = chaves([[0, .42], [.38, .05], [.78, -.34], [1.15, -A.afasta]], r.t);
      h = topo + chaves([[0, Q * .74], [.38, Q * .8], [.78, .34], [1.15, -.28]], r.t);
      rot = poses([[0, r.rot0 = r.rot0], [.001, P('prepara')], [.4, P('amortece', {t:.15})], [.78, POSE(0, .45)], [1.15, POSE()]], r.t);
      rot = naCorda(r, rot, s, h, suave(r.t / .45));
      yQuadril = h; colocar(e, r, s); e.y = h - Q;
      if (r.t >= 1.15){ r.h = h; r.v = 0; fase(e, 'rapel'); anotar(e, 'rapel'); }
    } else if (r.fase === 'arremesso'){
      /* recua um passo, gira o gancho, lança por cima do muro e puxa para ver se prendeu */
      virar(.4);
      s = chaves([[0, r.s0], [.4, -1.35]], r.t);
      const arma = Parkour.corpo({torce:-.45, t:-.06, c:-.3, pd:[.25, .25, 0], pe:[-.35, .35, 0], bd:[.85, .45, .5], be:[-1.1, .25, .4]});
      const lanca = Parkour.corpo({torce:.3, t:.16, c:-.45, pd:[.3, .35, .3], pe:[-.45, .45, 0], bd:[-2.65, .18, .15], be:[.3, .35, .3]});
      const olha = Parkour.corpo({t:-.08, c:-.5, bd:[-1.9, .2, .3], be:[-1.0, .25, .7]});
      const puxaCorda = Parkour.corpo({t:.2, c:-.35, pd:[-.35, .7, 0], pe:[-.35, .7, 0], bd:[-1.15, .12, 1.25], be:[-1.5, .12, .9]});
      rot = poses([[0, r.rot0], [.4, arma], [.62, arma], [.82, lanca], [1.15, lanca], [1.4, olha], [1.68, puxaCorda], [1.86, olha], [2.0, puxaCorda], [2.25, P('prepara', {bd:[-1.7, .2, .6], be:[-1.7, .2, .6]})]], r.t);
      colocar(e, r, s); e.y = r.base;
      r.voo = preso((r.t - .76) / .62, 0, 1);
      if (r.t >= 2.3){ fase(e, 'pes'); anotar(e, 'pés na parede'); }
    } else if (r.fase === 'pes'){
      /* chega à parede, agarra a corda e planta os pés */
      s = chaves([[0, -1.35], [.4, -.82], [.8, -A.afasta]], r.t);
      h = r.base + chaves([[0, Q * .9], [.4, Q + .06], [.8, 1.12]], r.t);
      rot = poses([[0, P('prepara', {bd:[-1.7, .2, .6], be:[-1.7, .2, .6]})], [.4, POSE(0, .7)], [.8, POSE()]], r.t);
      rot = naCorda(r, rot, s, h, suave(r.t / .4));
      yQuadril = h; colocar(e, r, s); e.y = h - Q;
      if (r.t >= .8){ r.h = h; r.v = 0; fase(e, 'rapel'); anotar(e, 'na corda'); }
    } else if (r.fase === 'rapel'){
      /* velocidades que chegam e saem aos poucos */
      const quer = c.baixo ? -A.descer : c.cima ? A.subir : 0;
      r.v += (quer - r.v) * (1 - Math.exp(-4.5 * dt));
      const antesVd = r.vd, antesD = r.d;
      r.vd += ((c.lado || 0) * A.deLado - r.vd) * (1 - Math.exp(-5 * dt));
      let afasta = A.afasta, encolhe = 0, voo = 0;
      /* salto de rapel: empurra a parede, desliza pela corda (e para o lado, se pedir) e amortece com as pernas */
      if (c.pular && !r.salto){ r.salto = .001; r.saltoDe = r.h; r.saltoLado = c.lado || 0; r.saltoD = r.d; anotar(e, r.saltoLado ? 'salto para o lado' : 'salto de rapel'); }
      if (r.salto){
        r.salto += dt / .95;
        const u = Math.min(1, r.salto), arco = Math.sin(u * Math.PI);
        voo = arco;
        afasta += arco * .55;
        r.h = r.saltoDe - A.salto * (u * .25 + suave(u) * .75);
        if (r.saltoLado) r.d = r.saltoD + r.saltoLado * 1.25 * suave(u);
        encolhe = Math.max(0, 1 - u / .22) * .7 + Math.max(0, (u - .68) / .32) * .75 * (1 - Math.max(0, (u - .9) / .1) * .4) - arco * .35;
        if (r.salto >= 1){ r.salto = 0; r.v *= .3; }
      } else { r.h += r.v * dt; r.d += r.vd * dt; }
      const [dMin, dMax] = limites(r);
      if (r.d < dMin || r.d > dMax){ r.d = preso(r.d, dMin, dMax); r.vd = 0; }
      /* o passo segue a distância andada, para cima, para baixo ou de lado */
      const velLado = r.salto ? 0 : (r.d - antesD) / Math.max(dt, .001);
      r.passo += Math.abs(r.v) * dt * (r.v > 0 ? 7.5 : 3.6);
      r.passoLado += Math.abs(velLado) * dt * 7.2;
      /* o corpo balança um pouco quando arranca e quando para de lado */
      r.vonda += (-38 * r.onda - 7.5 * r.vonda - (r.vd - antesVd) / Math.max(dt, .001) * .55) * dt; r.onda = preso(r.onda + r.vonda * dt, -.3, .3);
      const mexe = preso(Math.abs(r.v) / .6, 0, 1), onda = Math.sin(r.passo) * mexe * (1 - preso(Math.abs(velLado) / .5, 0, 1) * .6);
      /* até onde a corda vai */
      const hFim = fimDaCorda(r), hChao = r.base + .86, hTopo = topo - .3;
      if (r.h >= hTopo){ r.h = hTopo; r.v = Math.min(0, r.v); }
      if (r.h <= Math.max(hFim, hChao)){
        r.h = Math.max(hFim, hChao); r.salto = 0;
        if (hChao >= hFim){ if (c.baixo){ r.de = [-A.afasta, r.h]; fase(e, 'chega'); } }
        else if (r.v < -.05 || c.baixo){
          /* acabou a corda antes do chão: ou os pés já alcançam, ou ele fica pendurado pela ponta */
          const pes = topo - r.corda.metros + .08 - .96 - Q;
          if (pes <= r.base + .12){ r.de = [-A.afasta, r.h]; fase(e, 'chega'); }
          else { r.v = 0; fase(e, 'ponta'); anotar(e, 'a corda acabou'); }
        }
        r.v = Math.max(0, r.v);
      }
      s = -afasta; h = r.h;
      const ladoT = preso(velLado / A.deLado, -1, 1), anda = Math.abs(ladoT);
      rot = POSE(onda, encolhe, {gc:-ladoT * .5 - r.saltoLado * voo * .4 || (c.baixo ? .45 : 0), c:c.baixo ? .38 : c.cima ? -.25 : .16, torce:-ladoT * .2});
      /* andando de lado: a perna da frente abre e a outra vem atrás */
      const abreD = Math.max(0, Math.sin(r.passoLado)) * anda, abreE = Math.max(0, -Math.sin(r.passoLado)) * anda;
      const praDireita = ladoT >= 0 ? 1 : -1;
      rot.coxa_d = giraEm(2, -praDireita * (praDireita > 0 ? abreD : abreE) * .3 - r.onda * .5, rot.coxa_d);
      rot.coxa_e = giraEm(2, -praDireita * (praDireita > 0 ? abreE : abreD) * .3 - r.onda * .5, rot.coxa_e);
      rot.canela_d = giraEm(0, abreD * .35, rot.canela_d); rot.canela_e = giraEm(0, abreE * .35, rot.canela_e);
      /* o tronco inclina na direção em que vai; no salto lateral o corpo todo acompanha */
      rot.quadril = giraEm(2, r.onda * .55 + ladoT * .1 + (r.saltoLado || 0) * voo * .22, rot.quadril);
      rot = naCorda(r, rot, s, h, 1, r.v > .1 ? Math.sin(r.passo * 1.0) : anda * Math.sin(r.passoLado) * .4);
      yQuadril = h;
      if (r.fase === 'rapel' && c.cima && r.h >= hTopo - .02){
        /* chegou à borda: usa o mesmo movimento de puxar o corpo para cima */
        const o = {caixa:r.caixa, nx:r.fx, nz:r.fz, plano:r.fx ? r.origem[0] : r.origem[1], a0:r.a0, a1:r.a1, fundo:r.fundo, altura:alturaDaParede, dist:0, tipo:'puxar', pode:true, texto:'borda ao alcance'};
        colocar(e, r, s); e.rot = rot; e.y = r.base; e.altQuadril = r.h - r.base;
        if (r.corda.tipo === 'pano') e.deixadas.push(corrida(r, true)); else anotar(e, 'recolhe a corda');
        e.rapel = null; e.modo = 'chao';
        Parkour.comecarAcao(e, 'puxar', o, r.base); e.acao.parado = livre; e.de = rot; e.trans = 0;
        return {rot, yQuadril:h};
      }
      if (r.fase === 'rapel') colocar(e, r, s);
      e.y = h - Q;
    } else if (r.fase === 'ponta'){
      /* pendurado pelas mãos na ponta da corda */
      const mao = fimDaCorda(r) - .17, onda = Math.sin(r.t * 3.6) * Math.exp(-r.t * 1.1);
      s = lerp(-A.afasta, -.4, suave(r.t / .45)) + onda * .05;
      h = lerp(r.h, mao - .96, suave(r.t / .45));
      r.vd += ((c.lado || 0) * 2.6 - r.d * 4.5 - r.vd * .9) * dt; r.d += r.vd * dt;
      { const [a, b] = limites(r); if (r.d < a || r.d > b){ r.d = preso(r.d, a, b); r.vd = 0; } }
      rot = P('pendurado', {c:.25, rola:preso(-r.vd * .18, -.25, .25), pd:[-.3 + onda * .35, .6, .25], pe:[-.1 + onda * .28, .35, .3]});
      rot = maoEm(r, rot, h, s, 'e', [-.2, mao + .03, r.d + .07], -2.55);
      rot = maoEm(r, rot, h, s, 'd', [-.2, mao - .1, r.d - .05], -2.55);
      yQuadril = h; colocar(e, r, s); e.y = h - Q;
      r.aviso = `a corda acabou: faltam ${num(falta(alturaDaParede, r.corda.metros))} m · W sobe de volta · S solta`;
      if (r.t > .5 && c.cima){ r.h = topo - r.corda.metros + .27; r.v = .3; r.aviso = ''; fase(e, 'rapel'); }
      else if (r.t > .5 && c.baixo){
        e.rot = rot; e.vy = 0; e.vx = -r.fx * .45 - r.fz * r.vd * .6; e.vz = -r.fz * .45 + r.fx * r.vd * .6; e.noAr = -.4; e.naBeirada = false; e.modo = 'ar';
        if (r.corda.tipo === 'pano') e.deixadas.push(corrida(r, true));
        e.rapel = null; e.de = rot; e.trans = 0; anotar(e, 'solta');
        return {rot, yQuadril:h};
      }
    } else if (r.fase === 'chega'){
      /* tira os pés da parede e fica de pé */
      s = chaves([[0, r.de[0]], [.55, -.82]], r.t);
      h = chaves([[0, r.de[1]], [.3, r.base + Q * .84], [.55, r.base + Q * .74], [.85, r.base + Q]], r.t);
      rot = poses([[0, POSE()], [.3, P('amortece', {t:.2})], [.55, P('amortece', {t:.32})], [.85, livre]], r.t);
      rot = naCorda(r, rot, s, h, 1 - suave((r.t - .3) / .3));
      yQuadril = h; colocar(e, r, s); e.y = r.base;
      if (r.t >= .9) fase(e, r.corda.tipo === 'militar' ? 'recolhe' : 'rasgou');
    } else if (r.fase === 'recolhe'){
      /* a militar volta para a mochila: puxa duas vezes e ela cai nas mãos */
      s = -.82;
      const alto = Parkour.corpo({t:-.06, c:-.45, bd:[-2.2, .18, .5], be:[-1.5, .2, 1.0]}), baixo = Parkour.corpo({t:.22, c:-.2, pd:[-.35, .7, 0], pe:[-.35, .7, 0], bd:[-.5, .2, 1.4], be:[-1.9, .18, .5]});
      rot = poses([[0, livre], [.25, alto], [.55, baixo], [.8, alto], [1.1, baixo], [1.4, livre]], r.t);
      r.recolhido = suave((r.t - .35) / 1.0);
      colocar(e, r, s); e.y = r.base;
      if (r.t >= 1.45){ e.rot = rot; soltar(e, parado); }
    } else if (r.fase === 'rasgou'){
      s = -.82;
      const olha = Parkour.corpo({t:-.05, c:-.42});
      rot = poses([[0, livre], [.35, olha], [.75, Parkour.corpo({c:-.3, gc:.35})], [1.05, Parkour.corpo({c:-.3, gc:-.35})], [1.35, livre]], r.t);
      r.aviso = 'a corda de pano rasgou: não dá para usar de novo';
      colocar(e, r, s); e.y = r.base;
      if (r.t >= 1.4){ e.rot = rot; soltar(e, parado); anotar(e, 'a de pano ficou'); }
    }
    return {rot, yQuadril};
  }

  /* ---------------------------------------------------------------- por onde a corda passa (para desenhar) */
  /* devolve {tipo, panos, pontos:[[x,y,z]], gancho:[x,y,z]|null, gasta} */
  function corrida(r, deixada = false, quadril = null, s = 0){
    const topo = r.topo, L = r.corda.metros, p = (ss, y, d = 0) => noMundo(r, ss, y, d);
    const descendo = r.como === 'descer', ancora = descendo ? .95 : .2;
    const saida = {tipo:r.corda.tipo, panos:r.corda.panos || 0, pontos:[], gancho:null, ancora:p(ancora, topo), gasta:deixada};
    const ponta = Math.max(r.base + .035, topo - L), sobra = Math.min(1.3, Math.max(0, r.base - (topo - L)));
    const pendura = (ss, d, de) => { saida.pontos.push(p(ss, Math.max(ponta, de), d)); saida.pontos.push(p(ss, ponta, d)); if (sobra > .05) saida.pontos.push(p(ss - sobra * .7, r.base + .035, d + sobra * .35)); };
    if (r.fase === 'guarda') return null;
    if (r.fase === 'arremesso' && !deixada){
      if (r.voo <= 0) return null;
      /* o gancho voa em arco da mão até passar da borda; a corda vai atrás */
      const u = r.voo, mao = p(-1.2, r.base + 1.65, .15), fim = p(.2, topo + .05);
      const arco = t => [lerp(mao[0], fim[0], t), lerp(mao[1], fim[1], t) + Math.sin(t * Math.PI) * .9, lerp(mao[2], fim[2], t)];
      const preso_ = u >= 1;
      if (preso_){ saida.pontos.push(p(.2, topo + .05), p(-.03, topo + .04), p(-.16, topo - .35), p(-.3, Math.max(ponta, r.base + 1.35)), p(-.75, r.base + 1.25, .2)); }
      else { for (let i = 0; i <= 8; i++) saida.pontos.push(arco(u * i / 8)); saida.pontos.unshift(p(-1.1, r.base + .035, .4)); }
      saida.gancho = arco(u); return saida;
    }
    saida.pontos.push(p(ancora, topo + (descendo ? .22 : .05)), p(-.03, topo + .04));
    if (!descendo) saida.gancho = p(ancora, topo + .05);
    if (r.fase === 'amarra' && !deixada){
      if (r.solto <= 0) return {...saida, pontos:[saida.pontos[0], p(.55, topo + .05, .1)]};
      pendura(-.1, 0, Math.max(ponta, topo - (topo - ponta) * r.solto)); saida.pontos.length = 3; saida.pontos.push(p(-.1, Math.max(ponta, topo - (topo - ponta) * r.solto)));
      return saida;
    }
    if (quadril !== null && ['borda', 'pes', 'rapel', 'chega'].includes(r.fase) && !deixada && !(r.fase === 'chega' && r.t > .5)){
      const g = GUIA(s, quadril), f = FREIO(s, quadril);
      saida.pontos.push(p(g[0], g[1], r.d + .06), p(s + .12, quadril + .1, r.d + .08), p(f[0], f[1], r.d + f[2]));
      pendura(f[0] - .03, r.d + f[2] + .02, f[1] - .1);
      return saida;
    }
    if (r.fase === 'ponta' && !deixada){ const q = topo - Math.sqrt(Math.max(.04, L * L - r.d * r.d)); saida.pontos.push(p(-.17, q + .35, r.d), p(-.2, q + .08, r.d), p(-.2, q - .12, r.d)); return saida; }
    /* solta, pendurada na parede */
    pendura(-.06, 0, topo - .25);
    if (r.recolhido > 0){                                        /* a militar sendo puxada de volta */
      if (r.recolhido >= .98) return null;
      saida.pontos = saida.pontos.map(q => [q[0], q[1] + (topo - r.base) * r.recolhido * (q[1] < topo ? 1 : 0), q[2]]).map(q => [q[0], Math.min(q[1], topo + .22), q[2]]);
    }
    return saida;
  }
  /* todas as cordas que aparecem agora. quadril = altura do quadril desenhado; s = distância à parede */
  function desenho(e, quadril){
    const lista = e.deixadas.slice();
    if (e.rapel){
      const r = e.rapel, s = (e.x - r.origem[0]) * r.fx + (e.z - r.origem[1]) * r.fz;
      const c = corrida(r, false, quadril, s); if (c) lista.push(c);
    }
    return lista;
  }

  return {AJUSTES, maximoDePanos, metrosDe, criarMochila, fazer, naMao, gastar, falta, procurar, explicar, iniciar, passo, desenho, militar, dePano};
})();
