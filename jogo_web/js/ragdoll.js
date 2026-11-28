/* Ragdoll: o corpo sem controle, feito de pontos com peso (as juntas) ligados por "ossos".
   Cada peça do boneco gira junto com o par de pontos do seu osso. Funciona a partir de qualquer pose.
   Sem tela: dá para testar fora do navegador. Y para cima; chão em y = 0.
   caixas = [x0, x1, y0, y1, z0, z1]. No Unity, usar o Ragdoll do próprio motor; os números servem de referência. */
const Ragdoll = (() => {
  const AJUSTES = {gravidade:9.8, passo:.008, voltas:7, ar:.994, atrito:.4, quique:.15, dorme:.0007, maximo:6};
  const soma = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], menos = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vez = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const cruz = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
  const tam = a => Math.hypot(a[0], a[1], a[2]), unit = a => vez(a, 1 / (tam(a) || 1)), meio = (a, b) => vez(soma(a, b), .5);
  const mul = (p, o) => [p[3]*o[0] + p[0]*o[3] + p[1]*o[2] - p[2]*o[1], p[3]*o[1] - p[0]*o[2] + p[1]*o[3] + p[2]*o[0],
                         p[3]*o[2] + p[0]*o[1] - p[1]*o[0] + p[2]*o[3], p[3]*o[3] - p[0]*o[0] - p[1]*o[1] - p[2]*o[2]];
  const inverso = q => [-q[0], -q[1], -q[2], q[3]];
  function girar_(q, v){ const t = vez(cruz(q, v), 2); return soma(soma(v, vez(t, q[3])), cruz(q, t)); }
  function deColunas(a, b, c){
    const m00 = a[0], m10 = a[1], m20 = a[2], m01 = b[0], m11 = b[1], m21 = b[2], m02 = c[0], m12 = c[1], m22 = c[2], tr = m00 + m11 + m22;
    let q;
    if (tr > 0){ const s = Math.sqrt(tr + 1) * 2; q = [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, s / 4]; }
    else if (m00 > m11 && m00 > m22){ const s = Math.sqrt(1 + m00 - m11 - m22) * 2; q = [s / 4, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s]; }
    else if (m11 > m22){ const s = Math.sqrt(1 + m11 - m00 - m22) * 2; q = [(m01 + m10) / s, s / 4, (m12 + m21) / s, (m02 - m20) / s]; }
    else { const s = Math.sqrt(1 + m22 - m00 - m11) * 2; q = [(m02 + m20) / s, (m12 + m21) / s, s / 4, (m10 - m01) / s]; }
    const n = Math.hypot(...q) || 1; return q.map(v => v / n);
  }

  /* o quanto cada ponto sente o golpe, e a grossura dele */
  const SENTE = {cabeca:1.3, alto:1.35, torax:1.15, ombro_d:1.15, ombro_e:1.15, quadril:.7, anca_d:.65, anca_e:.65, cotovelo_d:.9, cotovelo_e:.9, pulso_d:.85, pulso_e:.85, mao_d:.85, mao_e:.85, joelho_d:.3, joelho_e:.3, pe_d:.06, pe_e:.06, ponta_d:.04, ponta_e:.04};
  const GROSSO = {cabeca:.1, alto:.11, torax:.12, quadril:.11, anca_d:.09, anca_e:.09, ombro_d:.08, ombro_e:.08};
  /* que pontos movem cada peça: [de, até, par que dá o lado] */
  const OSSOS = {
    quadril:['quadril', 'torax', 'ancas'], cintura:['quadril', 'torax', 'ancas'], torax:['torax', 'cabeca', 'ombros'], cabeca:['cabeca', 'alto', 'ombros'],
    ...Object.fromEntries(['d', 'e'].flatMap(l => [['braco_' + l, ['ombro_' + l, 'cotovelo_' + l, 'ombros']], ['antebraco_' + l, ['cotovelo_' + l, 'pulso_' + l, 'ombros']], ['mao_' + l, ['pulso_' + l, 'mao_' + l, 'ombros']],
      ['coxa_' + l, ['anca_' + l, 'joelho_' + l, 'ancas']], ['canela_' + l, ['joelho_' + l, 'pe_' + l, 'ancas']], ['pe_' + l, ['pe_' + l, 'ponta_' + l, 'ancas']]])),
  };
  /* a base de um osso: eixo ao longo dele e o lado do corpo */
  function base(P, de, ate, lado, antes){
    const eixo = unit(menos(P[ate].p, P[de].p)), par = lado === 'ombros' ? ['ombro_d', 'ombro_e'] : ['anca_d', 'anca_e'];
    let c = cruz(eixo, menos(P[par[1]].p, P[par[0]].p));
    if (tam(c) < .02) c = cruz(eixo, antes || [0, 0, 1]);
    if (tam(c) < .02) c = cruz(eixo, [1, 0, 0]);
    const z = unit(c), y = cruz(z, eixo);
    return {q:deColunas(eixo, y, z), lado:y};
  }

  /* partes = [{nome, t:[posição da junta no mundo], q:[giro no mundo]}]. golpe = {dir:[x,y,z], forca (m/s)} */
  function criar(partes, golpe = {}, caixas = [], sorte = Math.random){
    const de = Object.fromEntries(partes.map(p => [p.nome, p]));
    const j = n => de[n]?.t || de.torax.t;
    const ponto = {quadril:j('quadril'), torax:j('torax'), cabeca:j('cabeca')};
    for (const l of ['d', 'e']) Object.assign(ponto, {['ombro_' + l]:j('braco_' + l), ['cotovelo_' + l]:j('antebraco_' + l), ['pulso_' + l]:j('mao_' + l), ['anca_' + l]:j('coxa_' + l), ['joelho_' + l]:j('canela_' + l), ['pe_' + l]:j('pe_' + l)});
    const cima = unit(menos(ponto.cabeca, ponto.torax));
    ponto.alto = soma(ponto.cabeca, vez(cima, .26));
    let frente = cruz(menos(ponto.anca_e, ponto.anca_d), unit(menos(ponto.torax, ponto.quadril))); frente = unit(frente);
    for (const l of ['d', 'e']){ ponto['mao_' + l] = soma(ponto['pulso_' + l], vez(menos(ponto['pulso_' + l], ponto['cotovelo_' + l]), .35)); ponto['ponta_' + l] = soma(ponto['pe_' + l], vez(frente, .13)); }
    const P = {};
    const dir = golpe.dir ? unit(golpe.dir) : [0, 0, 0], forca = golpe.forca || 0, h = AJUSTES.passo;
    for (const [n, p] of Object.entries(ponto)){
      const k = SENTE[n] ?? .6, v = [dir[0] * forca * k + (sorte() - .5) * .35, dir[1] * forca * k + (k > .8 ? .35 : 0), dir[2] * forca * k + (sorte() - .5) * .35];
      P[n] = {p:p.slice(), a:menos(p, vez(v, h)), r:GROSSO[n] ?? .055};
    }
    const ligas = [];
    const liga = (a, b, min = 1, max = 1) => { const d = tam(menos(P[a].p, P[b].p)); ligas.push([a, b, d * min, max === null ? 1e9 : d * max]); };
    /* o tronco quase não dobra: ombros, quadril e pescoço presos uns aos outros */
    for (const [a, b] of [['quadril', 'torax'], ['torax', 'cabeca'], ['cabeca', 'alto'], ['ombro_d', 'ombro_e'], ['torax', 'ombro_d'], ['torax', 'ombro_e'], ['cabeca', 'ombro_d'], ['cabeca', 'ombro_e'],
      ['quadril', 'anca_d'], ['quadril', 'anca_e'], ['anca_d', 'anca_e'], ['torax', 'anca_d'], ['torax', 'anca_e']]) liga(a, b);
    for (const [a, b] of [['quadril', 'ombro_d'], ['quadril', 'ombro_e'], ['anca_d', 'ombro_d'], ['anca_e', 'ombro_e']]) liga(a, b, .9, 1.08);
    liga('torax', 'alto', .86, 1.04); liga('quadril', 'cabeca', .86, 1.03);                      /* pescoço e costas não dobram demais */
    for (const l of ['d', 'e']){
      for (const [a, b] of [['ombro', 'cotovelo'], ['cotovelo', 'pulso'], ['pulso', 'mao'], ['anca', 'joelho'], ['joelho', 'pe'], ['pe', 'ponta']]) liga(a + '_' + l, b + '_' + l);
      liga('joelho_' + l, 'ponta_' + l, .8, 1.15);
      /* cotovelo e joelho não fecham até o fim */
      const braco = tam(menos(P['ombro_' + l].p, P['cotovelo_' + l].p)) + tam(menos(P['cotovelo_' + l].p, P['pulso_' + l].p));
      const perna = tam(menos(P['anca_' + l].p, P['joelho_' + l].p)) + tam(menos(P['joelho_' + l].p, P['pe_' + l].p));
      ligas.push(['ombro_' + l, 'pulso_' + l, braco * .42, braco * 1.001], ['anca_' + l, 'pe_' + l, perna * .5, perna * 1.001]);
      ligas.push(['torax', 'pulso_' + l, .13, 1e9], ['torax', 'joelho_' + l, .26, 1e9]);
    }
    ligas.push(['joelho_d', 'joelho_e', .13, .85], ['pe_d', 'pe_e', .12, 1.1]);
    /* como cada peça está presa ao seu osso agora */
    const pecas = partes.map(p => {
      const [a, b, lado] = OSSOS[p.nome] || OSSOS.torax, B = base(P, a, b, lado), inv = inverso(B.q);
      return {nome:p.nome, a, b, lado, ultimo:B.lado, q:mul(inv, p.q), t:girar_(inv, menos(p.t, P[a].p))};
    });
    const c = P.torax.p;
    return {P, ligas, pecas, tempo:0, quieto:0, parado:false, resto:0, caixas:caixas.filter(k => k[3] > .12 && Math.abs((k[0] + k[1]) / 2 - c[0]) < (k[1] - k[0]) / 2 + 4 && Math.abs((k[4] + k[5]) / 2 - c[2]) < (k[5] - k[4]) / 2 + 4)};
  }

  function colidir(r, q){
    const A = AJUSTES;
    if (q.p[1] < q.r){
      const vy = q.p[1] - q.a[1];
      q.p[1] = q.r;
      q.a[1] = q.r + Math.min(0, vy) * A.quique;
      q.a[0] += (q.p[0] - q.a[0]) * A.atrito; q.a[2] += (q.p[2] - q.a[2]) * A.atrito;
    }
    for (const k of r.caixas){
      const x = q.p[0], y = q.p[1], z = q.p[2], m = q.r * .8;
      if (x <= k[0] - m || x >= k[1] + m || y <= k[2] - m || y >= k[3] + m || z <= k[4] - m || z >= k[5] + m) continue;
      /* sai pelo lado mais perto */
      const saidas = [[x - (k[0] - m), 0, k[0] - m], [k[1] + m - x, 0, k[1] + m], [k[3] + m - y, 1, k[3] + m], [z - (k[4] - m), 2, k[4] - m], [k[5] + m - z, 2, k[5] + m]];
      const s = saidas.reduce((a, b) => b[0] < a[0] ? b : a);
      q.p[s[1]] = s[2];
      for (let i = 0; i < 3; i++) if (i === s[1]) q.a[i] = q.p[i]; else q.a[i] += (q.p[i] - q.a[i]) * A.atrito * .6;
    }
  }

  function umPasso(r){
    const A = AJUSTES, h = A.passo, pontos = Object.values(r.P);
    for (const q of pontos){
      const v = menos(q.p, q.a).map(x => x * A.ar), n = tam(v), k = n > A.maximo * h ? A.maximo * h / n : 1;
      q.a = q.p.slice(); q.p = [q.p[0] + v[0] * k, q.p[1] + v[1] * k - A.gravidade * h * h, q.p[2] + v[2] * k];
    }
    for (let volta = 0; volta < A.voltas; volta++){
      for (const [na, nb, min, max] of r.ligas){
        const a = r.P[na], b = r.P[nb], d = menos(b.p, a.p), n = tam(d);
        const quer = n < min ? min : n > max ? max : n; if (quer === n || n < 1e-6) continue;
        const k = (n - quer) / n * .5;
        for (let i = 0; i < 3; i++){ a.p[i] += d[i] * k; b.p[i] -= d[i] * k; }
      }
      if (volta % 2 === 0 || volta === A.voltas - 1) for (const q of pontos) colidir(r, q);
    }
  }

  function passo(r, dt){
    if (r.parado) return false;
    r.resto += Math.min(dt, .05);
    while (r.resto >= AJUSTES.passo){
      r.resto -= AJUSTES.passo; umPasso(r); r.tempo += AJUSTES.passo;
      let mexe = 0; for (const q of Object.values(r.P)) mexe = Math.max(mexe, tam(menos(q.p, q.a)));
      r.quieto = mexe < AJUSTES.dorme ? r.quieto + 1 : 0;
      /* quando sossega, para de calcular */
      if (r.tempo > .9 && r.quieto > 30 || r.tempo > 5){ r.parado = true; break; }
    }
    return true;
  }

  /* onde cada peça está agora: [{nome, t, q}] na mesma ordem em que entraram */
  function pecas(r){
    return r.pecas.map(p => {
      const B = base(r.P, p.a, p.b, p.lado, p.ultimo); p.ultimo = B.lado;
      return {nome:p.nome, t:soma(r.P[p.a].p, girar_(B.q, p.t)), q:mul(B.q, p.q)};
    });
  }
  const onde = (r, nome) => r.P[nome].p;

  return {AJUSTES, criar, passo, pecas, onde};
})();
