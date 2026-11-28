/* Quedas, ferimento e tratamento.
   - Queda de pouca altura: só amortece. Queda forte: sente o impacto e demora um instante.
   - Queda alta: desaba, fica deitado, levanta com a perna machucada e passa a mancar.
   - Só volta a andar normal depois de TRATAR o ferimento (atadura, tala ou kit médico).
   Os números são do jogo e ficam todos em AJUSTES. Carregado depois de parkour.js. */
const Saude = (() => {
  const AJUSTES = {
    ferimento:4.5,           /* m de queda a partir dos quais ele cai no chão e se machuca (até 3,5 m só sente o impacto) */
    grave:5.8,               /* m a partir dos quais a perna fratura */
    mancando:{leve:1.15, grave:.62},      /* velocidade máxima, m/s */
    tempoDeTratar:{atadura:4.2, tala:6.0, kit:3.2},
    sarar:3.5,               /* s depois do curativo até o passo voltar ao normal */
  };
  const A = AJUSTES;
  const FERIMENTOS = {
    leve:{nome:'perna machucada', precisa:'uma atadura'},
    grave:{nome:'perna fraturada', precisa:'uma tala'},
  };
  /* com o que se trata cada um. O kit médico serve para os dois */
  const REMEDIOS = {
    atadura:{nome:'Atadura', custo:{panos:3}, trata:['leve']},
    tala:{nome:'Tala', custo:{panos:3, madeira:2}, trata:['leve', 'grave']},
    kit:{nome:'Kit médico', custo:{kit:1}, trata:['leve', 'grave']},
  };
  const nomes = {panos:'pano', madeira:'madeira', kit:'kit médico'};
  const preso = (v, a, b) => Math.max(a, Math.min(b, v));
  const suave = x => { const t = preso(x, 0, 1); return t * t * (3 - 2 * t); };

  const gravidade = altura => altura >= A.grave ? 'grave' : altura >= A.ferimento ? 'leve' : null;
  const temPara = (m, id) => Object.entries(REMEDIOS[id].custo).every(([k, n]) => (m?.[k] || 0) >= n);
  /* o melhor remédio que dá para usar (o mais simples primeiro) ou o que está faltando */
  function escolher(m, tipo){
    for (const id of ['atadura', 'tala', 'kit']) if (REMEDIOS[id].trata.includes(tipo) && temPara(m, id)) return {id};
    const basico = tipo === 'grave' ? 'tala' : 'atadura';
    return {falta:Object.entries(REMEDIOS[basico].custo).filter(([k, n]) => (m?.[k] || 0) < n).map(([k, n]) => `${n - (m?.[k] || 0)} de ${nomes[k]}`).join(' e ') + ` para a ${REMEDIOS[basico].nome.toLowerCase()} (ou um kit médico)`};
  }

  /* ---------------------------------------------------------------- poses */
  const mul = (p, o) => [p[3]*o[0] + p[0]*o[3] + p[1]*o[2] - p[2]*o[1], p[3]*o[1] - p[0]*o[2] + p[1]*o[3] + p[2]*o[0],
                         p[3]*o[2] + p[0]*o[1] - p[1]*o[0] + p[2]*o[3], p[3]*o[3] - p[0]*o[0] - p[1]*o[1] - p[2]*o[2]];
  const eixo = (n, t) => { const r = [0, 0, 0, Math.cos(t / 2)]; r[n] = Math.sin(t / 2); return r; };
  const C = o => Parkour.corpo(o);
  /* deita o corpo de lado: gira em volta do eixo para a frente, depois de inclinado */
  const deLado = (rot, ang) => ({...rot, quadril:mul(eixo(2, ang), rot.quadril || [0, 0, 0, 1])});
  const P = {
    impacto:() => C({t:.75, c:-.35, pd:[-1.45, 2.3, 0], pe:[-1.2, 2.05, 0], bd:[-1.0, .45, .45], be:[-1.0, .45, .45]}),
    maos:() => C({q:.95, t:.35, c:-.8, pd:[-1.65, 2.05, .4], pe:[-1.45, 1.9, .4], bd:[-1.35, .3, .35], be:[-1.35, .3, .35]}),
    deitado:() => deLado(C({q:1.42, t:.2, c:-.22, pd:[-1.15, 1.75, .3], pe:[-.3, .6, .3], bd:[-1.25, .05, .95], be:[-.45, .55, 1.15]}), 1.3),
    joelhada:() => C({q:.4, t:.62, c:-.55, pd:[-1.7, 2.35, .35], pe:[-1.2, 2.15, .35], bd:[-1.35, .4, .35], be:[-1.4, .4, .35]}),
    tombando:() => deLado(C({q:1.22, t:.3, c:-.45, pd:[-1.4, 1.95, .35], pe:[-.8, 1.25, .35], bd:[-1.35, .12, .75], be:[-1.0, .45, .75]}), .62),
    rolando:() => deLado(C({q:1.2, t:.28, c:-.55, pd:[-1.35, 1.9, .35], pe:[-.95, 1.5, .35], bd:[-1.5, .14, .55], be:[-1.0, .38, .8]}), .55),
    quatro:() => C({q:.86, t:.34, c:-.72, pd:[-1.55, 2.0, .4], pe:[-1.4, 1.9, .4], bd:[-1.2, .22, .28], be:[-1.2, .22, .28]}),
    fraqueja:() => C({q:1.12, t:.45, c:-.35, pd:[-1.6, 2.05, .4], pe:[-1.3, 1.8, .4], bd:[-1.5, .42, 1.05], be:[-1.35, .4, .9]}),
    quase:() => C({t:.56, c:-.4, pd:[-1.05, 1.25, 0], pe:[-.5, 1.05, .2], bd:[-.75, .1, .5], be:[-.5, .35, .45]}),
    sentado:() => C({q:.12, t:.5, c:-.1, pd:[-1.72, .55, .2], pe:[-1.05, 2.25, .2], bd:[-.7, .2, .6], be:[-.2, .55, .4]}),
    joelho:() => C({t:.46, c:-.32, pd:[-1.5, 1.55, 0], pe:[.12, 1.75, .6], bd:[-.85, .12, .5], be:[-.8, .2, .6]}),
    apoio:() => C({t:.34, c:-.14, pd:[-.42, .55, 0], pe:[-.28, .45, 0], bd:[-.5, .1, .45], be:[-.15, .45, .3]}),
  };
  /* altura do quadril para o corpo encostar no chão sem afundar: o ponto mais baixo manda */
  const PONTOS = [['quadril', [0, 0, 0], .13], ['torax', [0, .16, 0], .15], ['cabeca', [0, .3, .02], .21], ['mao_d', [0, -.06, 0], .05], ['mao_e', [0, -.06, 0], .05],
                  ['antebraco_d', [0, 0, 0], .06], ['antebraco_e', [0, 0, 0], .06], ['canela_d', [0, 0, 0], .08], ['canela_e', [0, 0, 0], .08],
                  ['pe_d', [0, -.045, .06], .045], ['pe_e', [0, -.045, .06], .045], ['pe_d', [0, -.045, -.04], .045], ['pe_e', [0, -.045, -.04], .045]];
  function apoiar(rot){
    const g = Animacao.esqueleto(rot); let baixo = 9;
    for (const [n, p, raio] of PONTOS) baixo = Math.min(baixo, g.pos[n][1] + girar(g.G[n], p)[1] - raio);
    return -baixo;
  }

  /* ---------------------------------------------------------------- a queda que machuca */
  /* para que lado há espaço para o corpo se estender */
  function direcaoLivre(e, caixas){
    for (const giro of [0, Math.PI / 2, -Math.PI / 2, Math.PI]){
      const a = e.rumo + giro, fx = Math.sin(a), fz = Math.cos(a);
      const livre = [.35, .75, 1.15, 1.45, 1.75].every(d => { const x = e.x + fx * d, z = e.z + fz * d;
        return !caixas.some(k => x > k.x0 - .15 && x < k.x1 + .15 && z > k.z0 - .15 && z < k.z1 + .15 && k.y1 > e.y + .3 && k.y0 < e.y + .6) && Parkour.chaoEm(caixas, x, z, e.y) > e.y - .25; });
      if (livre) return a;
    }
    return e.rumo;
  }
  /* [segundos até chegar, pose]. Repetir uma pose = ficar nela */
  function roteiro(tipo){
    const grave = tipo === 'grave';
    const r = [[.13, 'impacto'], [.2, 'joelhada'], [.23, 'maos'], [.24, 'tombando'], [.26, 'deitado'], [grave ? 2.7 : 1.35, 'deitado']];
    if (grave) r.push([.65, 'rolando'], [.75, 'quatro'], [.38, 'fraqueja'], [.36, 'tombando'], [.3, 'deitado'], [1.15, 'deitado']);   /* tenta, o braço falha e ele volta */
    const lento = grave ? 1.28 : 1;
    r.push(...[[.62, 'rolando'], [.55, 'maos'], [.5, 'quatro'], [.75, 'joelho'], [.7, 'quase'], [.55, 'apoio'], [.6, 'parado']].map(([d, n]) => [d * lento, n]));
    return r;
  }
  /* curva que passa direto pelas poses, sem frear em cada uma; só descansa onde a pose se repete (deitado) */
  function suaveEntre(v, ts, i, u){
    const incl = k => (v[k + 1] - v[k]) / (ts[k + 1] - ts[k]);
    const parado = k => Math.abs(v[k + 1] - v[k]) < 1e-6 && ts[k + 1] - ts[k] > .5;
    const tang = k => { if (k <= 0 || k >= v.length - 1 || parado(k - 1) || parado(k)) return 0; const a = incl(k - 1), b = incl(k), m = (v[k + 1] - v[k - 1]) / (ts[k + 1] - ts[k - 1]); return a * b <= 0 ? m * .6 : m; };
    const dt = ts[i + 1] - ts[i], u2 = u * u, u3 = u2 * u;
    return (2*u3 - 3*u2 + 1) * v[i] + (u3 - 2*u2 + u) * dt * tang(i) + (-2*u3 + 3*u2) * v[i + 1] + (u3 - u2) * dt * tang(i + 1);
  }
  /* monta, para cada junta, a lista de valores ao longo do tempo */
  function prepararTombo(passos, de, parado, e){
    const ts = [0], poses = [de];
    for (const [d, n] of passos){ ts.push(ts[ts.length - 1] + d); poses.push(n === 'parado' ? manqueira(parado, e, 0, 0) : P[n]()); }
    const juntas = {};
    for (const nome of Object.keys(PAI)){
      let antes = poses[0][nome] || [0, 0, 0, 1];
      const lista = poses.map(p => { let q = p[nome] || [0, 0, 0, 1]; if (q.reduce((s, v, i) => s + v * antes[i], 0) < 0) q = q.map(v => -v); antes = q; return q; });
      juntas[nome] = [0, 1, 2, 3].map(k => lista.map(q => q[k]));
    }
    /* momentos em que o corpo bate no chão, e os trechos em que está deitado */
    const batidas = [], deitado = [];
    passos.forEach(([d, n], i) => { if (n === 'deitado'){ if (passos[i - 1]?.[1] !== 'deitado') batidas.push(ts[i + 1]); else deitado.push([ts[i], ts[i + 1]]); } });
    let subida = ts[ts.length - 1]; for (let i = passos.length - 1; i >= 0; i--){ if (passos[i][1] === 'deitado'){ subida = ts[i + 1]; break; } }
    return {ts, juntas, batidas, deitado, subida, dura:ts[ts.length - 1]};
  }
  /* cada parte do corpo chega um instante depois: primeiro o quadril, por último a cabeça e as mãos */
  const ATRASO = {quadril:0, cintura:.012, torax:.024, cabeca:.1, braco_d:.055, antebraco_d:.085, mao_d:.11, braco_e:.07, antebraco_e:.1, mao_e:.125, coxa_d:.015, canela_d:.045, pe_d:.07, coxa_e:.03, canela_e:.06, pe_e:.085};
  function amostrar(tb, t){
    const rot = {}, ts = tb.ts;
    for (const nome of Object.keys(PAI)){
      const tt = preso(t - (ATRASO[nome] || 0) * (1 - suave((t - tb.dura + .5) / .5)), 0, tb.dura);
      let i = 0; while (i < ts.length - 2 && tt > ts[i + 1]) i++;
      const u = preso((tt - ts[i]) / (ts[i + 1] - ts[i]), 0, 1), q = tb.juntas[nome].map(v => suaveEntre(v, ts, i, u)), n = Math.hypot(...q) || 1;
      rot[nome] = q.map(v => v / n);
    }
    return rot;
  }
  /* por cima da curva: o quique da batida, a respiração e a perna que se mexe de dor */
  function vida(rot, tb, t, forca){
    const s = {...rot};
    const soma = (n, e_, a) => { if (Math.abs(a) > 1e-4) s[n] = mul(s[n], eixo(e_, a)); };
    let quique = 0, salto = 0;
    for (const b of tb.batidas){ const x = t - b + .05; if (x > 0 && x < 1){ const env = Math.exp(-8.5 * x) * (1 - suave((x - .7) / .3)); quique += Math.sin(x * 21) * env; salto += Math.abs(Math.sin(x * 17)) * env; } }
    soma('cabeca', 0, quique * .2 * forca); soma('torax', 0, quique * .085 * forca); soma('canela_d', 0, -quique * .2 * forca); soma('canela_e', 0, quique * .14 * forca);
    soma('antebraco_d', 0, -quique * .22 * forca); soma('antebraco_e', 0, quique * .18 * forca); soma('braco_e', 2, quique * .1 * forca);
    let dor = 0;
    for (const [a, b] of tb.deitado) dor = Math.max(dor, suave((t - a) / .5) * (1 - suave((t - b + .45) / .45)));
    const r = Math.sin(t * 2.5), d = Math.sin(t * 1.9 + 1), g = Math.max(0, Math.sin(t * 1.15)) ** 3;     /* de vez em quando, uma pontada */
    soma('torax', 0, dor * (r * .045 + g * .12)); soma('cabeca', 0, dor * (d * .07 - g * .2)); soma('cabeca', 1, dor * Math.sin(t * 1.3) * .12);
    soma('coxa_d', 0, -dor * (d * .08 + g * .22)); soma('canela_d', 0, dor * (d * .12 + g * .3)); soma('antebraco_d', 0, -dor * (r * .06 + g * .15)); soma('braco_e', 0, dor * d * .06);
    const levantando = suave((t - tb.subida) / .5) * (1 - suave((t - tb.dura + .8) / .6));
    const folego = Math.sin(t * 5.3), treme = Math.sin(t * 17) * Math.max(0, Math.sin(t * 2.1));
    soma('torax', 0, levantando * (folego * .05 + treme * .012)); soma('cabeca', 0, -levantando * folego * .07); soma('antebraco_e', 0, levantando * treme * .03); soma('canela_d', 0, levantando * treme * .025);
    return {rot:s, salto:salto * .035 * forca};
  }
  function cair(e, altura, caixas){
    const tipo = gravidade(altura);
    /* uma queda nova por cima de um ferimento piora */
    const novo = e.ferimento && !e.ferimento.tratado && (e.ferimento.tipo === 'grave' || tipo === 'leve') ? 'grave' : tipo;
    e.ferimento = {tipo:novo, tratado:false, sara:0, remedio:null};
    e.queda = {t:0, passos:roteiro(novo), tombo:null, rumoDe:e.rumo, rumoPara:direcaoLivre(e, caixas), de:e.rot, altura, y:null, desliza:0, impulso:novo === 'grave' ? .46 : .34};
    e.modo = 'caido'; e.loco = Locomocao.novo(e.rumo); e.amortece = 0; e.atordoado = 0; e.curativo = 0;
    e.evento.push(novo === 'grave' ? 'queda grave' : 'queda com ferimento');
  }
  function passoCaido(e, dt, parado){
    const q = e.queda; q.t += dt;
    if (!q.tombo) q.tombo = prepararTombo(q.passos, q.de, parado.livre, e);
    const tb = q.tombo;
    e.rumo = Locomocao.angulo(q.rumoDe + Locomocao.angulo(q.rumoPara - q.rumoDe) * suave((q.t - .1) / .65));
    /* o corpo ainda vai um pouco para a frente, perdendo força */
    const u = preso((q.t - .08) / .95, 0, 1), anda = q.impulso * (1 - (1 - u) ** 3), d = anda - q.desliza; q.desliza = anda;
    e.x += Math.sin(e.rumo) * d; e.z += Math.cos(e.rumo) * d;
    if (q.t >= tb.dura){
      e.loco = Locomocao.novo(e.rumo); e.modo = 'chao'; e.queda = null; e.de = e.rot; e.trans = 0; e.evento.push('levanta mancando');
      return {rot:manqueira(parado.livre, e, 0, 0), yQuadril:null};
    }
    const v = vida(amostrar(tb, q.t), tb, q.t, e.ferimento.tipo === 'grave' ? 1.15 : .85);
    /* a altura do quadril segue o chão sem degraus quando muda a parte do corpo que apoia */
    const quer = apoiar(v.rot);
    q.y = q.y === null ? quer : Math.max(q.y + (quer - q.y) * (1 - Math.exp(-dt * 20)), quer - .03);
    /* em que parte do tombo está (para o texto) */
    let i = 0; while (i < tb.ts.length - 2 && q.t > tb.ts[i + 1]) i++;
    const nome = q.passos[i][1];
    e.faseQueda = ['deitado', 'tombando'].includes(nome) ? 'deitado' : ['maos', 'quatro', 'rolando', 'fraqueja'].includes(nome) ? (q.t < .8 ? 'impacto' : 'maos') : ['impacto', 'joelhada'].includes(nome) ? 'impacto' : 'levantando';
    return {rot:v.rot, yQuadril:e.y + q.y + v.salto};
  }

  /* leva uma mão até um ponto de uma peça da perna (desl é medido a partir da junta dela) */
  function naPerna(rot, lado, peca, desl, peso){
    if (peso <= .01) return rot;
    const g = Animacao.esqueleto(rot), w = girar(g.G[peca], desl), alvo = g.pos[peca].map((v, i) => v + w[i]), sinal = lado === 'e' ? 1 : -1;
    const maoQ = eixo(0, -.55), centro = Animacao.pontoDaPeca('mao_' + lado, ESTRUTURA['mao_' + lado].tam.map(v => v / 2));
    const ik = Animacao.braco(lado, g.pos['braco_' + lado], Animacao.punhoPara(alvo, maoQ, centro), [sinal * .9, -.35, -.5], maoQ, g.G.torax);
    const s = {...rot}; for (const n of Object.keys(ik)) s[n] = Animacao.misturar({[n]:rot[n]}, {[n]:ik[n]}, peso)[n];
    return s;
  }

  /* ---------------------------------------------------------------- mancar */
  /* quanto o peso está sobre a perna machucada (a direita) neste ponto da passada */
  const noPe = fase => Math.max(0, -Math.cos(fase));
  /* quanto ainda manca: 1 = sem tratar; vai a 0 depois do curativo */
  const quanto = e => !e.ferimento ? 0 : e.ferimento.tratado ? Math.max(0, 1 - e.ferimento.sara / A.sarar) : 1;
  function manqueira(rot, e, fase, anda){
    const k = quanto(e); if (k <= 0) return rot;
    const g = e.ferimento.tipo === 'grave' ? 1 : .68, f = k * g, peso = noPe(fase) * anda;
    let s = {...rot};
    const soma = (n, ...qs) => { s[n] = qs.reduce(mul, s[n] || [0, 0, 0, 1]); };
    /* a perna machucada fica dura, um pouco para trás, e o pé arrasta */
    const vem = Math.max(0, Math.sin(fase)) * anda;
    const dura = C({pd:[.12 * g - .34 * vem, .16 + .16 * vem, .3 * g]});
    for (const n of ['coxa_d', 'canela_d', 'pe_d']) s[n] = Animacao.misturar({[n]:s[n]}, {[n]:dura[n]}, (.55 + .35 * g) * k)[n];
    /* a perna boa dobra mais quando precisa levar o corpo sozinha */
    soma('coxa_e', eixo(0, -.16 * peso * f)); soma('canela_e', eixo(0, .38 * peso * f));
    /* curvado, e caindo para o lado a cada pisada na perna ruim */
    soma('quadril', eixo(2, -.06 * f - peso * .14 * f), eixo(0, .05 * f));
    soma('torax', eixo(0, .36 * f + peso * .2 * f), eixo(2, -.14 * f - peso * .26 * f));
    soma('cabeca', eixo(0, -.1 * f + peso * .16 * f), eixo(2, .1 * f + peso * .13 * f));
    /* o outro braço abre para equilibrar */
    const equilibra = C({be:[-.15 - peso * .5, .24 + peso * .6, .5]});
    for (const n of ['braco_e', 'antebraco_e']) s[n] = Animacao.misturar({[n]:s[n]}, {[n]:equilibra[n]}, f)[n];
    /* a mão do lado machucado segura a coxa */
    return naPerna(s, 'd', 'coxa_d', [-.1, -.2, .07], Math.min(1, k * (.75 + .25 * g)));
  }
  /* velocidade máxima enquanto manca: cai ainda mais no instante em que pisa com a perna ruim */
  function limite(e){
    const k = quanto(e); if (k <= 0) return 99;
    const base = A.mancando[e.ferimento.tipo] * (1 - .42 * noPe(e.loco.fase));
    return base + (1 - k) * (Locomocao.AJUSTES.andar - base);
  }
  /* o que a perna machucada não deixa fazer (null = pode) */
  function impede(e, acao){
    if (quanto(e) <= .15) return null;
    if (acao === 'corda' && e.ferimento.tipo === 'leve') return null;
    return acao === 'corda' ? 'com a perna fraturada não dá para usar a corda' : 'a perna machucada não deixa pular nem escalar';
  }

  /* ---------------------------------------------------------------- tratar */
  function comecarTratamento(e){
    const f = e.ferimento;
    if (!f || f.tratado) return false;
    const r = escolher(e.mochila, f.tipo);
    if (!r.id){ e.aviso = 'não dá para tratar: faltam ' + r.falta; e.avisoAte = 3.5; return false; }
    for (const [k, n] of Object.entries(REMEDIOS[r.id].custo)) e.mochila[k] -= n;
    e.trata = {t:0, dura:A.tempoDeTratar[r.id], remedio:r.id};
    e.modo = 'tratando'; e.loco = Locomocao.novo(e.rumo); e.de = e.rot; e.trans = 0;
    e.evento.push('trata com ' + REMEDIOS[r.id].nome.toLowerCase());
    return true;
  }
  /* leva uma mão até um ponto perto da canela machucada */
  const naCanela = (rot, lado, desl, peso) => naPerna(rot, lado, 'canela_d', desl, peso);
  function passoTratando(e, dt, parado){
    const tr = e.trata; tr.t += dt;
    const entra = .8, sai = 1.0, fim = entra + tr.dura;
    let rot, base = P.sentado();
    if (tr.t < entra){ const u = tr.t / entra; rot = u < .5 ? Animacao.misturar(manqueira(parado.livre, e, 0, 0), P.joelho(), suave(u * 2)) : Animacao.misturar(P.joelho(), base, suave(u * 2 - 1)); }
    else if (tr.t < fim){
      /* as mãos dão voltas em torno da perna, subindo enquanto enrolam */
      const u = (tr.t - entra) / tr.dura, volta = (tr.t - entra) * 7.5, sobe = -.2 + .13 * u, peso = suave((tr.t - entra) / .35) * (1 - suave((tr.t - fim + .35) / .35));
      rot = Animacao.misturar(base, C({q:.12, t:.62, c:-.02, pd:[-1.72, .55, .2], pe:[-1.05, 2.25, .2]}), peso * .6);
      rot.braco_d = base.braco_d; rot.antebraco_d = base.antebraco_d;
      rot = naCanela(rot, 'd', [-.1 + Math.cos(volta) * .05, sobe + Math.sin(volta) * .03, Math.sin(volta) * .1], peso);
      rot = naCanela(rot, 'e', [.1 - Math.cos(volta) * .05, sobe - Math.sin(volta) * .03, -Math.sin(volta) * .1], peso);
      e.curativo = Math.max(e.curativo, u);
      base = null;
    } else {
      const u = (tr.t - fim) / sai;
      rot = u < .5 ? Animacao.misturar(P.sentado(), P.joelho(), suave(u * 2)) : Animacao.misturar(P.joelho(), parado.livre, suave(u * 2 - 1));
      if (u >= 1){
        e.ferimento.tratado = true; e.ferimento.remedio = tr.remedio; e.ferimento.sara = 0; e.curativo = 1;
        e.trata = null; e.modo = 'chao'; e.de = e.rot; e.trans = 0; e.evento.push('ferimento tratado');
        return {rot:parado.livre, yQuadril:null};
      }
    }
    return {rot, yQuadril:e.y + apoiar(rot)};
  }
  /* depois do curativo o passo melhora aos poucos */
  function sarando(e, dt){
    if (!e.ferimento?.tratado) return;
    e.ferimento.sara += dt;
    if (e.ferimento.sara >= A.sarar){ e.ultimoCurativo = e.ferimento.remedio; e.ferimento = null; e.evento.push('anda normal'); }
  }

  /* ---------------------------------------------------------------- o curativo desenhado na perna */
  /* medidas = caixa da canela no corpo reto (Coldre.envolve). Devolve grupos prontos para Coldre.juntar */
  function curativo(medidas, remedio, quanto_ = 1){
    if (quanto_ <= .02 || !remedio) return [];
    const [[x0, x1], [y0], [z0, z1]] = medidas, f = .012, caixas = [];
    const anelDe = (y, alto, cor) => caixas.push([x0 - f, x1 + f, y, y + alto, z0 - f, z1 + f, '', cor]);
    const voltas = Math.ceil(6 * quanto_), base = y0 * .72;
    for (let i = 0; i < voltas; i++) anelDe(base + i * .028, .024, i % 2 ? '#e6e0cf' : '#d3ccb8');
    if (remedio === 'tala') for (const x of [x0 - f - .022, x1 + f]) caixas.push([x, x + .022, y0 * .86, -.005, -.025, .03, '', '#9b6f3e']);
    if (remedio !== 'tala' && quanto_ > .8) anelDe(base + .06, .012, remedio === 'kit' ? '#c4453a' : '#8f3a30');
    return [Coldre.malhaDeCaixas('canela_d', caixas, p => p, (e, s) => [0, 1, 2].map(i => i === e ? s : 0))];
  }

  return {AJUSTES, FERIMENTOS, REMEDIOS, gravidade, escolher, temPara, cair, passoCaido, manqueira, limite, impede, quanto, comecarTratamento, passoTratando, sarando, curativo, apoiar};
})();
