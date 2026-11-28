/* Pulo, leitura de obstáculos e agarrar.
   O mundo aqui é feito de caixas. O personagem "olha" o que está à frente (altura, fundura, se a borda
   serve de apoio) e escolhe a reação. As escaladas são sequências de poses-chave ligadas por curvas
   suaves, e as mãos ficam presas na borda de verdade (o braço é calculado até o ponto).
   Eixos: Y para cima; rumo 0 = +Z. Carregado depois de locomocao.js. */
const Parkour = (() => {
  const AJUSTES = {
    gravidade:14, pulo:4.6,                 /* m/s² e m/s: sobe uns 75 cm */
    degrau:.31,                             /* até aqui ele sobe andando */
    mureta:1.15, funduraMureta:.6,          /* passa por cima */
    caixa:1.0,                              /* sobe de um pulo */
    escalar:1.55,                           /* apoia as mãos e sobe */
    agarrar:2.4,                            /* pula, pendura e puxa */
    alcanceAndando:1.0, alcanceCorrendo:1.7,
    alcanceNoVao:1.45, alcanceNoVaoCorrendo:2.1,   /* com um vão até a borda, ele salta e se agarra nela */
    agarrarNoAr:[1.15, 1.95],               /* só agarra quando as mãos alcançam: borda nesta altura acima dos pés */
    raio:.22, altura:1.79, alturaAgachado:1.3,
    quedaForte:6.6,
    tolerancia:.13,                         /* s depois de sair da beirada em que o pulo ainda vale */                         /* m/s no impacto */
  };
  const A = AJUSTES;
  const preso = (v, a, b) => Math.max(a, Math.min(b, v));
  const suave = x => { const t = preso(x, 0, 1); return t * t * (3 - 2 * t); };
  const puxa = (v, alvo, ritmo, dt) => v + (alvo - v) * (1 - Math.exp(-ritmo * dt));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------------------------------------------------------------- poses */
  const mul = (p, o) => [p[3]*o[0] + p[0]*o[3] + p[1]*o[2] - p[2]*o[1], p[3]*o[1] - p[0]*o[2] + p[1]*o[3] + p[2]*o[0],
                         p[3]*o[2] + p[0]*o[1] - p[1]*o[0] + p[2]*o[3], p[3]*o[3] - p[0]*o[0] - p[1]*o[1] - p[2]*o[2]];
  const eixo = (n, t) => { const r = [0, 0, 0, Math.cos(t / 2)]; r[n] = Math.sin(t / 2); return r; };
  const X = t => eixo(0, t), Y = t => eixo(1, t), Z = t => eixo(2, t);
  const junta = (...q) => q.reduce((a, b) => mul(a, b), [0, 0, 0, 1]);
  const inv = q => [-q[0], -q[1], -q[2], q[3]];
  /* t = tronco, c = cabeça (X positivo inclina para a frente); pd/pe = [coxa, joelho, ponta do pé];
     bd/be = [braço (negativo = para a frente), abre, dobra do cotovelo]; q = quadril; rola = quadril de lado */
  function corpo({t = 0, c = 0, q = 0, rola = 0, torce = 0, gc = 0, pd = [0, .05, 0], pe = [0, .05, 0], bd = [.03, .09, .16], be = [.03, .09, .16]}){
    const rot = {quadril:junta(X(q), Z(rola)), torax:junta(Y(torce), X(t), Z(-rola * .75)), cabeca:junta(Y(gc), X(c))};
    for (const [l, p, s] of [['d', pd, -1], ['e', pe, 1]]){
      rot['coxa_' + l] = junta(Z(s * .035), X(p[0])); rot['canela_' + l] = X(p[1]);
      rot['pe_' + l] = junta(inv(junta(rot.quadril, rot['coxa_' + l], rot['canela_' + l])), X(p[2] || 0));
    }
    for (const [l, b, s] of [['d', bd, -1], ['e', be, 1]]){ rot['braco_' + l] = junta(Z(s * b[1]), X(b[0])); rot['antebraco_' + l] = X(-b[2]); rot['mao_' + l] = [0, 0, 0, 1]; }
    return rot;
  }
  const POSES = {
    prepara:  {t:.5, c:-.32, pd:[-1.0, 1.6, 0], pe:[-.9, 1.5, 0], bd:[.75, .14, .35], be:[.75, .14, .35]},
    subindo:  {t:.14, c:-.1, pd:[-1.25, 1.55, .3], pe:[-.15, .55, .6], bd:[-1.75, .22, .55], be:[-1.35, .25, .75]},
    caindo:   {t:.1, c:.08, pd:[-.6, .8, .15], pe:[-.35, .65, .25], bd:[-.7, .62, .55], be:[-.7, .62, .55]},
    amortece: {t:.55, c:-.38, pd:[-1.2, 1.85, 0], pe:[-1.0, 1.7, 0], bd:[-.65, .34, .55], be:[-.65, .34, .55]},
    alcanca:  {t:0, c:-.4, pd:[-.2, .4, .5], pe:[.1, .35, .5], bd:[-2.8, .2, .2], be:[-2.8, .2, .2]},
    pendurado:{t:-.04, c:-.16, pd:[-.34, .55, .25], pe:[-.12, .32, .3], bd:[-2.8, .2, .3], be:[-2.8, .2, .3]},
    puxando:  {t:.1, c:-.2, pd:[-.55, 1.05, .25], pe:[-.15, .6, .3], bd:[-1.9, .5, 1.6], be:[-1.9, .5, 1.6]},
    apoiando: {t:.55, c:-.45, pd:[-.75, 1.2, .2], pe:[.12, .45, .35], bd:[-.5, .3, .8], be:[-.5, .3, .8]},
    joelho:   {t:.72, c:-.55, pd:[-1.95, 2.0, .1], pe:[.22, .6, .4], bd:[-.7, .3, .6], be:[-.7, .3, .6]},
    emcima:   {t:.6, c:-.4, pd:[-1.35, 1.95, 0], pe:[-.8, 1.75, .15], bd:[-.8, .3, .5], be:[-.6, .35, .5]},
    encolhe:  {t:.42, c:-.28, pd:[-1.6, 2.0, .2], pe:[-1.45, 1.9, .3], bd:[-1.15, .4, .8], be:[-1.15, .4, .8]},
    mergulho: {t:.55, c:-.4, pd:[-1.0, 1.5, .2], pe:[-.2, .8, .4], bd:[-1.3, .3, .5], be:[-1.3, .3, .5]},
    porcima:  {t:.3, c:-.2, rola:-.62, pd:[-1.5, 1.45, .2], pe:[-1.25, 1.25, .2], bd:[-.35, 1.15, .35], be:[-.6, .35, .4]},
    saindo:   {t:.18, c:-.1, rola:-.18, pd:[-.75, .75, 0], pe:[-.25, .85, .3], bd:[-.4, .75, .45], be:[.35, .45, .4]},
    olhaAlto: {t:-.08, c:-.36, pd:[-.05, .1, 0], pe:[.05, .1, 0], bd:[.08, .12, .3], be:[.08, .12, .3]},
    recua:    {t:-.14, c:-.2, pd:[.2, .15, 0], pe:[-.22, .3, 0], bd:[-.9, .35, 1.5], be:[-.9, .35, 1.5]},
  };
  POSES.passa = {t:.78, c:-.55, pd:[-1.9, 1.9, .1], pe:[-.9, 2.25, .3], bd:[-.7, .3, .6], be:[-.7, .3, .6]};
  const P = (nome, mais) => corpo({...POSES[nome], ...mais});

  /* agachado, parado ou andando (para passar por baixo das coisas) */
  function agachado(fase, mexe){
    const s = Math.sin(fase) * mexe, c = Math.cos(fase) * mexe;
    return corpo({t:1.08, c:-.95, pd:[-1.38 - .3 * s, 2.25 + .3 * Math.max(0, c), 0], pe:[-1.38 + .3 * s, 2.25 + .3 * Math.max(0, -c), 0],
                  bd:[-.35 + .3 * s, .22, .75], be:[-.35 - .3 * s, .22, .75]});
  }

  /* ---------------------------------------------------------------- o mundo de caixas */
  /* caixa = {x0,x1,y0,y1,z0,z1, agarra:bool, motivo, cor, nome} */
  const dentro = (c, x, z, folga) => x > c.x0 - folga && x < c.x1 + folga && z > c.z0 - folga && z < c.z1 + folga;
  function chaoEm(caixas, x, z, y){
    let g = 0;
    for (const c of caixas) if (c.y1 <= y + A.degrau && c.y1 > g && dentro(c, x, z, .07)) g = c.y1;
    return g;
  }
  function empurrar(caixas, e, altura, raio = A.raio){
    const pes = e.piso ?? e.y;                    /* o chão em que ele pisa (o desenho sobe o degrau suave, um instante depois) */
    for (const c of caixas){
      if (c.y1 <= pes + A.degrau || c.y0 >= pes + altura) continue;
      const px = preso(e.x, c.x0, c.x1), pz = preso(e.z, c.z0, c.z1), dx = e.x - px, dz = e.z - pz, d = Math.hypot(dx, dz);
      if (d >= raio) continue;
      if (d > 1e-5){ e.x = px + dx / d * raio; e.z = pz + dz / d * raio; }
      else {
        const saidas = [[e.x - c.x0, -1, 0], [c.x1 - e.x, 1, 0], [e.z - c.z0, 0, -1], [c.z1 - e.z, 0, 1]].sort((a, b) => a[0] - b[0])[0];
        e.x += saidas[1] * (saidas[0] + raio); e.z += saidas[2] * (saidas[0] + raio);
      }
    }
  }

  /* ---------------------------------------------------------------- leitura do que está à frente */
  function olhar(caixas, e, longe){
    const fx = Math.sin(e.rumo), fz = Math.cos(e.rumo); let achou = null;
    for (const c of caixas){
      if (c.liso || c.y1 <= e.y + A.degrau || c.y0 > e.y + A.altura + .2) continue;
      /* cada face que está virada para o personagem */
      for (const [nx, nz, plano, a0, a1, fundo] of [[0, 1, c.z0, c.x0, c.x1, c.z1 - c.z0], [0, -1, c.z1, c.x0, c.x1, c.z1 - c.z0], [1, 0, c.x0, c.z0, c.z1, c.x1 - c.x0], [-1, 0, c.x1, c.z0, c.z1, c.x1 - c.x0]]){
        const aFrente = fx * nx + fz * nz; if (aFrente < .72) continue;       /* precisa estar mais ou menos de frente (até 44°) */
        const dist = nx ? (plano - e.x) * nx : (plano - e.z) * nz;            /* distância reta até a face */
        if (dist < -.05 || dist > longe) continue;
        const lado = nx ? e.z + fz / aFrente * dist : e.x + fx / aFrente * dist;
        if (lado < a0 - .05 || lado > a1 + .05) continue;
        if (achou && dist >= achou.dist) continue;
        const o = {caixa:c, dist, nx, nz, plano, a0, a1, fundo, altura:c.y1 - e.y, vaoEmbaixo:c.y0 - e.y};
        Object.assign(o, classificar(o));
        /* sem chão antes da borda não há onde apoiar o pé: o jeito é saltar, agarrar e puxar */
        if (o.pode && o.tipo !== 'baixo' && e.modo === 'chao' && temVao(caixas, e, o)){ o.vao = true; o.tipo = 'agarrar'; o.texto = 'tem um vão antes da borda: salta, agarra e puxa'; }
        if (cabe(caixas, e, o)) achou = o;                    /* uma borda atrás de outra peça não conta */
      }
    }
    return achou;
  }

  /* falta chão logo antes da face (mais de 60 cm abaixo dos pés)? */
  function temVao(caixas, e, o){
    if (o.dist < .45) return false;
    const [x, z] = naFace(o, noLugar(o, o.nx ? e.z : e.x), -.34, 0);
    return chaoEm(caixas, x, z, e.y) < e.y - .6;
  }

  /* ---------------------------------------------------------------- o corpo cabe? */
  const margemDaBorda = .3;
  const noLugar = (o, lado) => o.a1 - o.a0 > margemDaBorda * 2 ? preso(lado, o.a0 + margemDaBorda, o.a1 - margemDaBorda) : (o.a0 + o.a1) / 2;
  /* há alguma peça (fora a que ele está usando) neste ponto, ocupando entre as alturas "de" e "ate"? */
  const ocupado = (caixas, alvo, x, z, de, ate, folga = .03) => caixas.some(k => k !== alvo && k.y1 > de && k.y0 < ate && dentro(k, x, z, folga));
  /* um ponto em relação à face: s = para dentro da peça (negativo = antes dela); w = de lado */
  const naFace = (o, lado, s, w) => o.nx ? [o.plano + o.nx * s, lado + w] : [lado + w, o.plano + o.nz * s];
  /* o espaço de quem está pendurado ou subindo nesta borda, naquela posição de lado */
  function bordaLivre(caixas, o, lado, pe){
    const topo = o.caixa.y1;
    for (const w of [-.17, 0, .17]) for (const s of [-.12, -.28, -.44]){
      const [x, z] = naFace(o, lado, s, w); if (ocupado(caixas, o.caixa, x, z, pe + A.degrau, topo - .1)) return false;
    }
    for (const w of [-.2, .2]){ const [x, z] = naFace(o, lado, .05, w); if (ocupado(caixas, o.caixa, x, z, topo + .08, topo + .25, 0)) return false; }       /* lugar para as mãos */
    return true;
  }
  function cabe(caixas, e, o){
    if (o.tipo === 'baixo') return true;                               /* passagem baixa: só se abaixa */
    const lado = noLugar(o, o.nx ? e.z : e.x), topo = o.caixa.y1;
    /* pendurado, o corpo desce até uns 1,7 m abaixo da borda; do chão, começa nos pés */
    const pendura = o.tipo === 'agarrar' || e.modo === 'ar', pe = pendura ? Math.max(topo - 1.85, Math.min(e.y, topo - 1.85)) : e.y;
    const sobe = o.tipo === 'subir' || o.tipo === 'escalar' || o.tipo === 'agarrar' || o.tipo === 'porcima';
    /* o caminho de onde ele está até a frente da borda */
    const [fx, fz] = naFace(o, lado, -.36, 0), passos = Math.max(1, Math.ceil(Math.hypot(fx - e.x, fz - e.z) / .1));
    for (let i = 1; i <= passos; i++) if (ocupado(caixas, o.caixa, e.x + (fx - e.x) * i / passos, e.z + (fz - e.z) * i / passos, Math.max(e.y, pe) + A.degrau, topo - .1, .08)) return false;
    if (!bordaLivre(caixas, o, lado, pe)) return false;
    if (!sobe) return true;
    /* em cima: lugar para o corpo passar e ficar */
    for (const w of [-.16, 0, .16]) for (const s of [.2, .42]){ const [x, z] = naFace(o, lado, s, w); if (ocupado(caixas, o.caixa, x, z, topo + A.degrau, topo + 1.15)) return false; }
    /* passando por cima: o outro lado tem de estar livre, até onde ele cai */
    if (o.tipo === 'porcima') for (const w of [-.18, 0, .18]) for (const s of [.2, .45, .72]){
      const [x, z] = naFace(o, lado, o.fundo + s, w); if (ocupado(caixas, o.caixa, x, z, e.y + A.degrau, topo + 1.0, .06)) return false;
    }
    return true;
  }
  function classificar(o){
    const h = o.altura, c = o.caixa;
    if (o.vaoEmbaixo > .85) return {tipo:'baixo', pode:true, texto:'passagem baixa: ele se abaixa'};
    if (h > A.agarrar) return {tipo:'alto', pode:false, texto:'alto demais: não alcança a borda'};
    if (c.agarra === false) return {tipo:'recusa', pode:false, texto:c.motivo || 'essa borda não dá para agarrar'};
    if (h <= A.mureta && o.fundo <= A.funduraMureta) return {tipo:'porcima', pode:true, texto:'mureta: passa por cima com a mão apoiada'};
    if (h <= A.caixa) return {tipo:'subir', pode:true, texto:'baixo e fundo: sobe num pulo'};
    if (h <= A.escalar) return {tipo:'escalar', pode:true, texto:'altura do peito: apoia as mãos e sobe'};
    return {tipo:'agarrar', pode:true, texto:'borda no alcance: pula, agarra e puxa'};
  }

  /* ---------------------------------------------------------------- ações com poses-chave */
  /* chave: d = segundos até chegar; s = quadril em relação à face (negativo = antes); h = altura do quadril
     em relação ao chão de onde partiu; pose; maos = quanto as mãos grudam na borda; punho = giro da mão */
  const PENDE = {s:-.27, h:T => T - .96};
  function roteiroDe(tipo, T, fundo, alturaQuadril){
    const Q = alturaQuadril;
    const subida = [
      {d:.34, s:-.31, h:T + .08, pose:'apoiando', maos:1, punho:-1.35},
      {d:.28, s:-.22, h:T + .46, pose:'joelho',   maos:1, punho:-1.35},
      {d:.24, s:.04,  h:T + .64, pose:'passa',    maos:.8, punho:-1.35},
      {d:.24, s:.38,  h:T + .56, pose:'emcima',   maos:.2, punho:-1.35},
      {d:.3,  s:.54,  h:T + Q,   pose:'parado',   maos:0},
    ];
    if (tipo === 'puxar') return [{d:.34, s:-.25, h:T - .56, pose:'puxando', maos:1, punho:-2.0}, ...subida];
    if (tipo === 'escalar') return [{d:.2, s:-.5, h:Q - .2, pose:'prepara', maos:0}, {d:.24, s:-.4, h:T - .3, pose:'puxando', maos:1, punho:-1.7}, ...subida];
    if (tipo === 'agarrar') return [{d:.22, s:-.52, h:Q - .24, pose:'prepara', maos:0}, {d:.26, s:-.36, h:T - 1.06, pose:'alcanca', maos:.65, punho:-2.7},
      {d:.14, ...PENDE, h:T - 1.02, pose:'pendurado', maos:1, punho:-2.55}, {d:.22, ...PENDE, h:T - .96, pose:'pendurado', maos:1, punho:-2.55}];
    if (tipo === 'agarrarNoAr') return [{d:.13, s:-.38, h:T - 1.03, pose:'alcanca', maos:1, punho:-2.55},
      {d:.18, ...PENDE, h:T - .99, pose:'pendurado', maos:1, punho:-2.55}, {d:.2, ...PENDE, h:T - .96, pose:'pendurado', maos:1, punho:-2.55}];
    if (tipo === 'subir') return [{d:.17, s:-.55, h:Q - .22, pose:'prepara', maos:0}, {d:.27, s:-.3, h:T + .76, pose:'encolhe', maos:0},
      {d:.24, s:.4, h:T + .55, pose:'amortece', maos:0}, {d:.28, s:.52, h:T + Q, pose:'parado', maos:0}];
    if (tipo === 'porcima') return [{d:.16, s:-.55, h:Q - .12, pose:'mergulho', maos:0}, {d:.19, s:-.2, h:T + .3, pose:'mergulho', maos:1, punho:-1.4, so:'e'},
      {d:.2, s:fundo * .5, h:T + .56, pose:'porcima', maos:1, punho:-1.4, so:'e'}, {d:.2, s:fundo + .42, h:Math.max(Q, T + .24), pose:'saindo', maos:.3, punho:-1.4, so:'e'},
      {d:.17, s:fundo + .72, h:Q - .16, pose:'amortece', maos:0, fim:'chao'}];
    /* alto demais: tenta, encosta a mão na parede e volta */
    if (tipo === 'alto') return [{d:.22, s:-.48, h:Q - .24, pose:'prepara', maos:0}, {d:.28, s:-.55, h:Q + .55, pose:'alcanca', maos:0},
      {d:.28, s:-.36, h:Q + .02, pose:'caindo', maos:0}, {d:.18, s:-.46, h:Q - .2, pose:'amortece', maos:0}, {d:.34, s:-.5, h:Q, pose:'olhaAlto', maos:0}, {d:.5, s:-.55, h:Q, pose:'olhaAlto', maos:0}, {d:.3, s:-.6, h:Q, pose:'parado', maos:0, fim:'chao'}];
    /* borda que machuca ou escorrega: olha, desiste e recua um passo */
    return [{d:.28, s:-.55, h:Q, pose:'olhaAlto', maos:0}, {d:.3, s:-.55, h:Q, pose:'olhaAlto', maos:0, cabeca:.35}, {d:.3, s:-.55, h:Q, pose:'olhaAlto', maos:0, cabeca:-.35},
      {d:.26, s:-.72, h:Q - .06, pose:'recua', maos:0}, {d:.34, s:-.75, h:Q, pose:'parado', maos:0, fim:'chao'}];
  }

  /* curva suave que passa por todas as chaves */
  function curva(pontos, tempos, i, u){
    const p0 = pontos[i], p1 = pontos[i + 1], dt = tempos[i + 1] - tempos[i];
    const tang = k => { const a = Math.max(0, k - 1), b = Math.min(pontos.length - 1, k + 1); return tempos[b] > tempos[a] ? (pontos[b] - pontos[a]) / (tempos[b] - tempos[a]) : 0; };
    const m0 = i === 0 ? (p1 - p0) / dt : tang(i), m1 = i + 1 === pontos.length - 1 ? 0 : tang(i + 1), u2 = u * u, u3 = u2 * u;
    return (2*u3 - 3*u2 + 1) * p0 + (u3 - 2*u2 + u) * dt * m0 + (-2*u3 + 3*u2) * p1 + (u3 - u2) * dt * m1;
  }

  /* ---------------------------------------------------------------- o personagem */
  function criar(parado, alturaQuadril){
    const e = {x:0, y:0, z:0, rumo:0, vy:0, vx:0, vz:0, modo:'chao', loco:Locomocao.novo(0), agacha:0, faseAg:0, amortece:0, atordoado:0,
               acao:null, rot:parado, de:null, trans:1, visto:null, aviso:'', rapel:null, deixadas:[], mochila:null, comCorda:null, rotAnt:null, naMao:true, ocupado:false, sacando:0, ferimento:null, queda:null, trata:null, curativo:0, ultimoCurativo:null, impactoNovo:0, evento:[], noAr:0, balanco:0, lado:0, impacto:0};
    e.quadril = alturaQuadril;
    return e;
  }
  /* passa suavemente da pose que está na tela para a próxima */
  function trocar(e, modo){ e.de = e.rot; e.trans = 0; e.modo = modo; }
  const anotar = (e, texto) => { if (e.evento[e.evento.length - 1] !== texto) e.evento.push(texto); };

  function comecarAcao(e, tipo, o, chaoBase){
    const fx = o.nx, fz = o.nz, margem = .3;
    const ladoBruto = o.nx ? e.z : e.x, lado = o.a1 - o.a0 > margem * 2 ? preso(ladoBruto, o.a0 + margem, o.a1 - margem) : (o.a0 + o.a1) / 2;
    const origem = o.nx ? [o.plano, lado] : [lado, o.plano];
    const T = o.caixa.y1 - chaoBase;
    const s0 = (e.x - origem[0]) * fx + (e.z - origem[1]) * fz, desvio0 = -(e.x - origem[0]) * fz + (e.z - origem[1]) * fx;
    const chaves = roteiroDe(tipo, T, o.fundo, e.quadril).map(k => ({...k, h:typeof k.h === 'function' ? k.h(T) : k.h}));
    /* se vier correndo de longe, a primeira chave ganha o tempo de chegar; se já estiver colado, não volta para trás */
    const vel = Math.max(e.loco.vel, 2.2), falta = chaves[0].s - s0;
    if (falta > 0) chaves[0].d = Math.max(chaves[0].d, falta / vel);
    else if (s0 < -.3) chaves[0].s = s0;
    const yQuadril = e.y + (e.modo === 'ar' ? e.quadril : e.altQuadril || e.quadril);
    const presas = tipo === 'puxar';                               /* quem está pendurado não solta a borda para subir */
    const todas = [{d:0, s:s0, h:yQuadril - chaoBase, rot:e.rot, maos:presas ? 1 : 0, punho:presas ? -2.55 : chaves[0].punho ?? -2.5}, ...chaves];
    const tempos = []; todas.reduce((t, k) => { tempos.push(t + k.d); return t + k.d; }, 0);
    e.acao = {tipo, o, T, base:chaoBase, origem, fx, fz, desvio:desvio0, chaves:todas, tempos, t:0, rumo0:e.rumo, rumo:Math.atan2(fx, fz), saida:tipo === 'porcima' ? Math.min(3, vel * .75) : 0};
    e.modo = 'acao'; e.vy = 0; e.agacha = 0; e.amortece = 0;
    anotar(e, tipo);
  }

  function quadroDaAcao(e){
    const a = e.acao, ks = a.chaves, ts = a.tempos;
    let i = 0; while (i < ks.length - 2 && a.t > ts[i + 1]) i++;
    const u = preso((a.t - ts[i]) / (ts[i + 1] - ts[i]), 0, 1), ate = ks[i + 1], antes = ks[i];
    const s = curva(ks.map(k => k.s), ts, i, u), h = curva(ks.map(k => k.h), ts, i, u);
    const rotDe = k => k.rot || (k.pose === 'parado' ? a.parado : P(k.pose, k.cabeca ? {gc:k.cabeca} : {}));
    const mistura = u * .45 + suave(u) * .55;
    let rot = Animacao.misturar(rotDe(antes), rotDe(ate), mistura);
    const desvio = a.desvio * (1 - suave(a.t / Math.max(.2, ts[1])));
    e.rumo = Locomocao.angulo(a.rumo0 + Locomocao.angulo(a.rumo - a.rumo0) * suave(a.t / Math.max(.18, ts[1])));
    e.x = a.origem[0] + a.fx * s - a.fz * desvio; e.z = a.origem[1] + a.fz * s + a.fx * desvio;
    const yQuadril = a.base + h;
    const maos = lerp(antes.maos || 0, ate.maos || 0, mistura);
    if (maos > .01) rot = prender(e, rot, yQuadril, maos, lerp(antes.punho ?? ate.punho ?? -2, ate.punho ?? antes.punho ?? -2, mistura), ate.so || antes.so);
    return {rot, yQuadril, maos};
  }

  /* leva as mãos até a borda: calcula o braço (ombro, cotovelo, punho) até o ponto certo */
  function prender(e, rot, yQuadril, peso, punho, so){
    const a = e.acao, g = Animacao.esqueleto(rot), saida = {...rot}, c = Math.cos(e.rumo), sn = Math.sin(e.rumo);
    const dentroDaBorda = a.tipo === 'porcima' ? Math.min(.12, a.o.fundo / 2) : .035;
    for (const [lado, sinal] of [['d', -1], ['e', 1]]){
      if (so && so !== lado) continue;
      const solta = e.lado && Math.sign(e.lado) === sinal ? Math.max(0, Math.sin(e.passoMao || 0)) * .05 : 0;
      const mx = a.origem[0] + a.fx * dentroDaBorda - a.fz * (-sinal * .21), mz = a.origem[1] + a.fz * dentroDaBorda + a.fx * (-sinal * .21);
      const dx = mx - e.x, dz = mz - e.z, alvo = [dx * c - dz * sn, a.base + a.T + .02 + solta - yQuadril, dx * sn + dz * c];
      const maoQ = X(punho), centro = Animacao.pontoDaPeca('mao_' + lado, ESTRUTURA['mao_' + lado].tam.map(v => v / 2));
      const ik = Animacao.braco(lado, g.pos['braco_' + lado], Animacao.punhoPara(alvo, maoQ, centro), [sinal * .8, -.55, -.5], maoQ, g.G.torax);
      for (const nome of Object.keys(ik)) saida[nome] = Animacao.misturar({[nome]:rot[nome]}, {[nome]:ik[nome]}, peso)[nome];
    }
    e.erroMao = Math.max(0, ...(so ? [so] : ['d', 'e']).map(lado => {
      const q = Animacao.esqueleto(saida), sinal = lado === 'e' ? 1 : -1;
      const mx = a.origem[0] + a.fx * dentroDaBorda + a.fz * sinal * .21, mz = a.origem[1] + a.fz * dentroDaBorda - a.fx * sinal * .21;
      const centro = Animacao.pontoDaPeca('mao_' + lado, ESTRUTURA['mao_' + lado].tam.map(v => v / 2));
      const w = girar(q.G['mao_' + lado], centro), p = q.pos['mao_' + lado], l = [p[0] + w[0], p[1] + w[1], p[2] + w[2]];
      const wx = e.x + l[0] * c + l[2] * sn, wz = e.z - l[0] * sn + l[2] * c;
      return Math.hypot(wx - mx, yQuadril + l[1] - (a.base + a.T + .02), wz - mz);
    }));
    return saida;
  }

  function terminarAcao(e, emCima){
    const a = e.acao;
    e.y = emCima ? a.base + a.T : a.base;
    if (a.tipo === 'porcima') e.y = chaoDepois(e);
    e.loco = Locomocao.novo(e.rumo); e.loco.vel = a.saida; e.loco.mexe = a.saida > .5 ? .7 : 0; e.loco.corre = preso((a.saida - 2.1) / 3.3, 0, 1);
    e.acao = null; trocar(e, 'chao');
  }
  let mundoAtual = [];
  const chaoDepois = e => chaoEm(mundoAtual, e.x, e.z, e.y + .2);

  /* ---------------------------------------------------------------- a arma: na mão, guardando ou guardada */
  const BRACOS = ['braco_d', 'antebraco_d', 'mao_d', 'braco_e', 'antebraco_e', 'mao_e'];
  const SAQUE = .7;
  /* leva a mão direita até onde a arma fica guardada. peso 0..1 */
  function alcancar(rot, parado, peso){
    if (peso <= .01 || !parado.coldre) return rot;
    const alvo = Coldre.alvoDaMao(parado.coldre.lugar, parado.coldre.medidas, rot), g = Animacao.esqueleto(rot), nasCostas = !parado.coldre.lugar.startsWith('cintura');
    const maoQ = X(nasCostas ? -2.7 : -.25), ik = Animacao.braco('d', g.pos.braco_d, Animacao.punhoPara(alvo, maoQ, Animacao.pontoDaPeca('mao_d', ESTRUTURA.mao_d.tam.map(v => v / 2))), nasCostas ? [-1, .1, .5] : [-1, -.2, -.8], maoQ, g.G.torax);
    const saida = {...rot};
    for (const n of Object.keys(ik)) saida[n] = Animacao.misturar({[n]:rot[n]}, {[n]:ik[n]}, peso)[n];
    return saida;
  }
  const comBracosArmados = (rot, parado) => { const s = {...rot}; for (const n of BRACOS) s[n] = parado.rot[n] || [0, 0, 0, 1]; return s; };
  function arma(e, dt, rot, parado){
    const tem = !!parado.arma;
    const ocupado = e.modo === 'corda' || e.modo === 'pendurado' || e.modo === 'acao' || e.modo === 'caido' || e.modo === 'tratando';
    if (e.ocupado && !ocupado && e.modo === 'chao' && tem) e.sacando = SAQUE;           /* soltou as mãos: puxa a arma de volta */
    e.ocupado = ocupado;
    if (!tem){ e.naMao = false; e.sacando = 0; return rot; }
    if (ocupado){
      e.sacando = 0; e.naMao = false;
      /* no começo do rapel há tempo para guardar com calma */
      if (e.modo === 'corda' && e.rapel?.fase === 'guarda'){
        const u = e.rapel.t / Rapel.AJUSTES.guardar;
        e.naMao = u < .55;
        let base = e.naMao ? comBracosArmados(rot, parado) : rot;
        return alcancar(base, parado, u < .55 ? suave(u / .5) : 1 - suave((u - .6) / .4));
      }
      return rot;
    }
    if (e.sacando > 0){
      e.sacando = Math.max(0, e.sacando - dt);
      const u = 1 - e.sacando / SAQUE;
      e.naMao = u >= .45;
      return alcancar(e.naMao ? comBracosArmados(rot, parado) : rot, parado, u < .45 ? suave(u / .42) : 1 - suave((u - .5) / .5));
    }
    e.naMao = true;
    /* abaixado ou no ar a arma continua na mão */
    if (e.modo === 'ar') return comBracosArmados(rot, parado);
    if (e.agacha > .2){ const k = suave((e.agacha - .2) / .5), com = comBracosArmados(rot, parado); return Animacao.misturar(rot, com, k); }
    return rot;
  }

  /* ---------------------------------------------------------------- um passo de tempo */
  /* c = {quer: direção ou null, correndo, pular (apertou agora), agachar, cima, baixo, lado: -1|0|1} */
  function passo(e, dt, c, caixas, parado){
    mundoAtual = caixas;
    let rot, yQuadril = null;
    e.visto = e.modo === 'chao' ? olhar(caixas, e, 2.4) : e.acao ? e.acao.o : null;
    const temRapel = typeof Rapel === 'object';
    e.comCorda = temRapel && e.modo === 'chao' ? Rapel.procurar(e, caixas) : null;
    const temSaude = typeof Saude === 'object';
    e.impactoNovo = 0;
    if (temSaude){
      Saude.sarando(e, dt);
      if (c.tratar && e.modo === 'chao' && e.loco.vel < .35 && e.atordoado <= 0) Saude.comecarTratamento(e);
    }
    if (c.usar && e.comCorda && e.atordoado <= 0){
      const corda = Rapel.naMao(e.mochila), machucado = temSaude && Saude.impede(e, 'corda');
      const r = machucado ? {pode:false, texto:machucado} : Rapel.explicar(e.comCorda, corda);
      if (r.pode) Rapel.iniciar(e, e.comCorda, corda, e.mochila);
      else { e.aviso = r.texto; e.avisoAte = 2.5; anotar(e, corda ? 'corda não serve' : 'sem corda'); }
    }
    if (e.avisoAte > 0 && (e.avisoAte -= dt) <= 0) e.aviso = '';
    if (e.modo !== 'chao') e.piso = null;
    if (e.modo === 'chao'){
      if (e.piso === undefined || e.piso === null || Math.abs(e.piso - e.y) > .65) e.piso = e.y;
      /* precisa se abaixar? olha em cima e um pouco à frente */
      const fx = Math.sin(e.rumo), fz = Math.cos(e.rumo);
      const teto = caixas.some(k => k.y0 - e.y > .85 && k.y0 - e.y < A.altura + .02 && [0, .35, .7].some(d => dentro(k, e.x + fx * d, e.z + fz * d, A.raio)));
      if (teto || c.agachar) anotar(e, teto ? 'abaixa' : 'agacha');
      e.agacha = puxa(e.agacha, teto || c.agachar ? 1 : 0, 11, dt);
      e.atordoado = Math.max(0, e.atordoado - dt);
      /* em guarda (cena única) ele olha para onde mira e anda em qualquer direção; senão, o corpo vira para onde vai */
      let m;
      if (c.guarda){
        const gv = Math.hypot(c.guarda.vx, c.guarda.vz), lim = (gv > e.loco.vel ? Locomocao.AJUSTES.arranque : Locomocao.AJUSTES.freio) * dt;
        e.loco.vel += preso(gv - e.loco.vel, -lim, lim); e.loco.rumo = c.guarda.rumo; e.loco.velAng = 0; e.loco.acel = 0;
        if (gv > .01) e.guardaDir = [c.guarda.vx / gv, c.guarda.vz / gv];
        const dir = e.guardaDir || [0, 0];
        m = {dx:dir[0] * e.loco.vel * dt, dz:dir[1] * e.loco.vel * dt, falta:0};
      } else m = Locomocao.avancar(e.loco, dt, c.quer, c.correndo && e.agacha < .3 && !(temSaude && Saude.quanto(e) > .15));
      const teto_v = Math.min(e.agacha > .3 ? 1.15 : e.atordoado > 0 ? .5 : 99, temSaude ? Saude.limite(e) : 99);
      if (e.loco.vel > teto_v) e.loco.vel = Math.max(teto_v, e.loco.vel - A.gravidade * dt);
      const x0 = e.x, z0 = e.z, k = e.loco.vel > 0 ? Math.min(1, e.loco.vel * dt / (Math.hypot(m.dx, m.dz) || 1)) : 0;
      const partes = Math.max(1, Math.ceil(Math.hypot(m.dx, m.dz) / .08));
      for (let i = 0; i < partes; i++){ e.x += m.dx * k / partes; e.z += m.dz * k / partes; empurrar(caixas, e, e.agacha > .75 ? A.alturaAgachado : A.altura); }
      const andou = Math.min(Math.hypot(e.x - x0, e.z - z0), e.loco.vel * dt);
      if (andou < e.loco.vel * dt * .35) e.loco.vel = Math.max(andou / dt, e.loco.vel - Locomocao.AJUSTES.freio * dt);
      const faseAntes = e.loco.fase;
      Locomocao.assentarPasso(e.loco, dt, andou, m.falta);
      if (c.guarda?.deCostas) e.loco.fase = faseAntes - (e.loco.fase - faseAntes);       /* de costas, o passo anda para trás */
      e.rumo = e.loco.rumo;
      const g = chaoEm(caixas, e.x, e.z, e.piso);
      if (g < e.piso - A.degrau){                    /* saiu da beirada */
        e.piso = null;
        e.vy = 0; e.vx = Math.sin(e.rumo) * e.loco.vel; e.vz = Math.cos(e.rumo) * e.loco.vel; e.noAr = 0; e.naBeirada = true; trocar(e, 'ar');
        if (c.pular){ e.vy = A.pulo; e.naBeirada = false; anotar(e, 'pula'); }     /* apertou no instante em que a beirada acabou */
        else anotar(e, 'cai');
      } else {
        if (g > e.y + .08) anotar(e, 'degrau');
        e.piso = g;
        e.y = puxa(e.y, g, g > e.y ? 24 : 22, dt);
      }
      rot = Locomocao.pose(e.loco, parado.rot, parado.arma, parado.mods);
      if (temSaude) rot = Saude.manqueira(rot, e, e.loco.fase, Math.min(1, e.loco.mexe * 1.15));
      if (e.agacha > .01) rot = Animacao.misturar(rot, agachado(e.loco.fase, Math.min(1, e.loco.mexe * 1.2)), suave(e.agacha));
      if (e.amortece > .01){ rot = Animacao.misturar(rot, P('amortece'), suave(Math.min(1, e.amortece))); e.amortece = Math.max(0, e.amortece - dt * (e.atordoado > 0 ? 1.25 : 3.6)); }
      /* apertou pular */
      const naoPula = c.pular && temSaude && Saude.impede(e, 'pular');
      if (naoPula){ e.aviso = naoPula; e.avisoAte = 2.2; }
      if (c.pular && e.modo === 'chao' && e.atordoado <= 0 && !naoPula){
        const o = e.visto, correndo = e.loco.vel > 3, alcance = o?.vao ? (correndo ? A.alcanceNoVaoCorrendo : A.alcanceNoVao) : correndo ? A.alcanceCorrendo : A.alcanceAndando;
        if (o && o.tipo !== 'baixo' && o.dist <= alcance){ e.rot = rot; comecarAcao(e, o.tipo, o, e.y); e.acao.parado = parado.livre; }
        else {
          e.rot = rot; e.vy = A.pulo; e.vx = Math.sin(e.rumo) * e.loco.vel; e.vz = Math.cos(e.rumo) * e.loco.vel; e.noAr = 0; e.naBeirada = false; trocar(e, 'ar'); anotar(e, 'pula');
        }
      }
    } else if (e.modo === 'ar'){
      if (c.pular && e.naBeirada && e.noAr < A.tolerancia){ e.vy = A.pulo; e.naBeirada = false; e.evento[e.evento.length - 1] = 'pula'; }
      e.noAr += dt;
      const antesY = e.y;
      e.y += e.vy * dt - A.gravidade * dt * dt / 2; e.vy -= A.gravidade * dt;
      if (c.quer !== null){                                      /* um pouco de controle no ar */
        e.vx += Math.sin(c.quer) * 2.2 * dt; e.vz += Math.cos(c.quer) * 2.2 * dt;
        const v = Math.hypot(e.vx, e.vz), max = Locomocao.AJUSTES.correr; if (v > max){ e.vx *= max / v; e.vz *= max / v; }
      }
      const partes = Math.max(1, Math.ceil(Math.hypot(e.vx, e.vz) * dt / .08));
      for (let i = 0; i < partes; i++){ e.x += e.vx * dt / partes; e.z += e.vz * dt / partes; empurrar(caixas, e, A.altura, A.raio + .1); }   /* no ar, braços e pernas ocupam mais */
      /* agarrar no ar: borda ao alcance das mãos, de frente para ela */
      if (e.vy < 1.6 && e.noAr > .12){
        const o = olhar(caixas, e, .62);
        if (o && o.pode && o.tipo !== 'baixo' && o.altura >= A.agarrarNoAr[0] && o.altura <= A.agarrarNoAr[1] && o.caixa.y1 >= 1.7){
          e.loco.vel = Math.hypot(e.vx, e.vz); comecarAcao(e, 'agarrarNoAr', o, o.caixa.y1 - Math.max(2, o.altura)); e.acao.parado = parado.livre;
          e.acao.T = o.caixa.y1 - e.acao.base; e.visto = o;
        }
      }
      if (e.modo === 'ar'){
        const g = chaoEm(caixas, e.x, e.z, Math.max(antesY, e.y) - A.degrau + .03);
        rot = Animacao.misturar(P('subindo'), P('caindo'), suave((2.2 - e.vy) / 4.4));
        yQuadril = e.y + e.quadril;
        if (e.y <= g && e.vy <= 0){
          const impacto = -e.vy; e.y = g; e.impacto = impacto;
          const v = Math.hypot(e.vx, e.vz);
          e.loco = Locomocao.novo(e.rumo); e.loco.vel = v * (impacto > A.quedaForte ? .1 : .75); e.loco.mexe = e.loco.vel > .5 ? .8 : 0; e.loco.corre = preso((e.loco.vel - 2.1) / 3.3, 0, 1);
          e.amortece = preso((impacto - 2) / 4.5, .25, 1.25); e.atordoado = impacto > A.quedaForte ? .65 : 0;
          anotar(e, impacto > A.quedaForte ? 'queda forte' : 'aterrissa');
          e.impactoNovo = impacto;
          const altura = impacto * impacto / (2 * A.gravidade);
          if (temSaude && Saude.gravidade(altura)){
            e.rot = rot; Saude.cair(e, altura, caixas); trocar(e, 'caido');
          } else {
            trocar(e, 'chao'); yQuadril = null;
            rot = Animacao.misturar(parado.rot, P('amortece'), Math.min(1, e.amortece));
          }
        }
      }
    }
    if (e.modo === 'caido' || e.modo === 'tratando'){
      const s = e.modo === 'caido' ? Saude.passoCaido(e, dt, {livre:parado.livre}) : Saude.passoTratando(e, dt, {livre:parado.livre});
      rot = s.rot; yQuadril = s.yQuadril; e.visto = null;
    }
    if (e.modo === 'corda'){
      const s = Rapel.passo(e, dt, c, caixas, parado); rot = s.rot; yQuadril = s.yQuadril; e.visto = null;
    }
    if (e.modo === 'pendurado' && rot === undefined){
      const a = e.acao;
      e.balanco += dt;
      /* anda de lado pela borda */
      const margem = .3;
      e.lado = puxa(e.lado, c.lado, 10, dt); if (Math.abs(e.lado) < .02) e.lado = 0;
      if (e.lado){
        const i = a.o.nx ? 1 : 0, sentido = i ? a.fx : -a.fz;             /* + = direita de quem está pendurado */
        const novo = preso(a.origem[i] + sentido * e.lado * .55 * dt, a.o.a0 + margem, a.o.a1 - margem);
        if (bordaLivre(caixas, a.o, novo, a.o.caixa.y1 - 1.85)) a.origem[i] = novo;
        e.passoMao = (e.passoMao || 0) + dt * 9; anotar(e, 'de lado');
      }
      const onda = Math.sin(e.balanco * 4.2) * Math.exp(-e.balanco * 1.6), passinho = Math.sin(e.passoMao || 0) * Math.abs(e.lado);
      e.x = a.origem[0] + a.fx * (PENDE.s + onda * .03); e.z = a.origem[1] + a.fz * (PENDE.s + onda * .03); e.rumo = a.rumo;
      yQuadril = a.base + a.T - .96 + Math.abs(passinho) * .025;
      rot = P('pendurado', {rola:e.lado * .07 + passinho * .04, pd:[-.34 + onda * .3 + passinho * .22, .55, .25], pe:[-.12 + onda * .24 - passinho * .22, .32, .3]});
      rot = prender(e, rot, yQuadril, 1, -2.55);
      if (e.balanco > .12){
        if (c.cima || c.pular){
          e.rot = rot; const o = a.o, base = a.base; e.loco.vel = 0; e.y = base;
          e.modo = 'chao'; e.altQuadril = yQuadril - base; comecarAcao(e, 'puxar', o, base); e.acao.parado = parado.livre;
        } else if (c.baixo){
          e.y = yQuadril - e.quadril; e.vy = 0; e.vx = -a.fx * .5; e.vz = -a.fz * .5; e.noAr = -.3; e.acao = null; trocar(e, 'ar'); anotar(e, 'solta');
        }
      }
    } else if (e.modo === 'acao'){
      const a = e.acao; a.t += dt;
      const q = quadroDaAcao(e); rot = q.rot; yQuadril = q.yQuadril;
      e.y = yQuadril - e.quadril;
      if (a.t >= a.tempos[a.tempos.length - 1]){
        if (a.tipo === 'agarrar' || a.tipo === 'agarrarNoAr'){ e.modo = 'pendurado'; e.balanco = 0; e.lado = 0; e.y = a.base; anotar(e, 'pendurado'); }
        else terminarAcao(e, a.tipo === 'puxar' || a.tipo === 'escalar' || a.tipo === 'subir');
        if (e.modo === 'chao') yQuadril = null;
      }
    }
    /* mistura curta entre um modo e outro, para não dar tranco */
    if (e.trans < 1 && e.de){ e.trans = Math.min(1, e.trans + dt / .13); rot = Animacao.misturar(e.de, rot, suave(e.trans)); }
    rot = arma(e, dt, rot, parado);
    /* amortecedor: fora da caminhada, cada junta persegue a pose com um atraso mínimo */
    if (e.rotAnt && (e.modo !== 'chao' || e.sacando > 0)) rot = Animacao.misturar(e.rotAnt, rot, 1 - Math.exp(-dt * 26));
    e.rotAnt = rot; e.rot = rot;
    return {rot, yQuadril};      /* yQuadril null = em pé no chão (quem desenha encosta o pé em e.y) */
  }

  return {AJUSTES, criar, passo, olhar, classificar, chaoEm, corpo, POSES, agachado, comecarAcao, curva, pose:P, giroX:X};
})();
