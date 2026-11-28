/* Motos e bicicletas no mesmo padrão dos carros: base, carenagem e rodas por modelo. Carregar depois de blindagem.js.
   Medidas em metros, na escala do personagem. Origem no chão, no centro entre as rodas. Frente = +Z, esquerda de quem pilota = +X.
   Modelos genéricos, sem copiar marcas. */

/* assento = [altura, z]; guidao = [altura, z] das manoplas; pe = [altura, z] das pedaleiras; inclina = tronco para a frente (radianos) */
const DUAS_RODAS = {
  moto_urbana: {nome:'Moto urbana (de trabalho)', grupo:'moto', entre:1.3, rodaF:.62, rodaT:.62, pneuF:.1, pneuT:.12, assento:[.74, -.2], garupa:[.77, -.52], guidao:[1.02, .3], pe:[.31, .02], pe2:[.38, -.38], inclina:.24, cor:'#B8352E', rodas:['raiada', 'liga_moto', 'cravos_moto']},
  moto_trail: {nome:'Moto trail', grupo:'moto', entre:1.38, rodaF:.72, rodaT:.64, pneuF:.1, pneuT:.13, assento:[.84, -.2], garupa:[.87, -.52], guidao:[1.14, .3], pe:[.4, .0], pe2:[.48, -.38], inclina:.22, cor:'#2E5C8A', rodas:['cravos_moto', 'raiada', 'liga_moto']},
  moto_esportiva: {nome:'Moto esportiva', grupo:'moto', entre:1.36, rodaF:.62, rodaT:.64, pneuF:.12, pneuT:.18, assento:[.76, -.24], garupa:[.86, -.55], guidao:[.93, .3], pe:[.37, -.18], pe2:[.5, -.46], inclina:.72, cor:'#2F7A3D', rodas:['liga_moto', 'raiada']},
  moto_custom: {nome:'Moto custom (estradeira)', grupo:'moto', entre:1.56, rodaF:.66, rodaT:.58, pneuF:.1, pneuT:.2, assento:[.62, -.24], garupa:[.7, -.56], guidao:[1.06, .2], pe:[.28, .19], pe2:[.38, -.36], inclina:-.06, cor:'#1D1E22', rodas:['raiada', 'liga_moto']},
  scooter: {nome:'Scooter', grupo:'moto', entre:1.22, rodaF:.46, rodaT:.46, pneuF:.11, pneuT:.13, assento:[.72, -.24], garupa:[.74, -.52], guidao:[1.0, .27], pe:[.27, .13], pe2:[.36, -.34], inclina:.1, cor:'#E4E2DA', rodas:['liga_moto']},
  bike_mtb: {nome:'Mountain bike', grupo:'bike', entre:1.06, rodaF:.66, rodaT:.66, pneuF:.065, pneuT:.065, assento:[.74, -.22], guidao:[.98, .34], pedivela:[.32, -.06, .13], inclina:.42, cor:'#C4622A', rodas:['bike_cravos', 'bike_fina']},
  bike_urbana: {nome:'Bicicleta urbana com cesta', grupo:'bike', entre:1.08, rodaF:.66, rodaT:.66, pneuF:.048, pneuT:.048, assento:[.72, -.24], guidao:[1.03, .28], pedivela:[.31, -.06, .13], inclina:.14, cor:'#4C7A72', rodas:['bike_fina', 'bike_cravos']},
  bike_speed: {nome:'Bicicleta de corrida (speed)', grupo:'bike', entre:1.02, rodaF:.68, rodaT:.68, pneuF:.036, pneuT:.036, assento:[.77, -.23], guidao:[.95, .38], pedivela:[.31, -.05, .13], inclina:.68, cor:'#C9A227', rodas:['bike_fina', 'bike_aero']},
  bike_bmx: {nome:'BMX', grupo:'bike', entre:.92, rodaF:.52, rodaT:.52, pneuF:.07, pneuT:.07, assento:[.58, -.2], guidao:[.94, .24], pedivela:[.28, -.05, .11], inclina:.36, cor:'#7A2E8C', rodas:['bike_cravos', 'bike_aero']},
  bike_cargueira: {nome:'Bicicleta cargueira', grupo:'bike', entre:1.18, rodaF:.58, rodaT:.66, pneuF:.065, pneuT:.065, assento:[.72, -.3], guidao:[1.04, .2], pedivela:[.31, -.12, .13], inclina:.18, cor:'#2F5F9E', rodas:['bike_cravos', 'bike_fina']},
};
Object.assign(RODAS, {raiada:'Raiada', liga_moto:'Liga de 5 raios', cravos_moto:'Raiada com cravos', bike_fina:'Pneu fino', bike_cravos:'Pneu com cravos', bike_aero:'Aro alto'});
const KITS_MOTO = {nenhum:'Original', bau:'Com baú', carga:'Carregada', apocalipse:'Preparada para o apocalipse'};
const KITS_BIKE = {nenhum:'Original', carga:'Carregada', apocalipse:'Preparada para o apocalipse'};
const MOTOS_PM = ['moto_trail', 'moto_urbana'];
Object.assign(CORES_CARRO, {v_couro:'#2A2420', v_corrente:'#55595F', v_alforje:'#5A4330', v_bag:'#C4261E', v_caixa_bike:'#8A6240'});

function construirDuasRodas(tipo, op = {}){
  const M = DUAS_RODAS[tipo], moto = M.grupo === 'moto';
  const policia = MOTOS_PM.includes(tipo) && PINTURAS_VIATURA[op.viatura] ? (op.viatura === 'antiga' ? 'antiga' : 'nova') : null;
  const kit = (moto ? KITS_MOTO : KITS_BIKE)[op.kit] ? op.kit : 'nenhum';
  const estiloRoda = M.rodas.includes(op.roda) ? op.roda : M.rodas[0];
  const zF = M.entre / 2, zT = -M.entre / 2, rF = M.rodaF / 2, rT = M.rodaT / 2;
  const partes = new Map();
  const GIRO = {eixo:'y', ang:.5};                                   /* "abrir" vira o guidão */
  const direcao = new Set(['garfo', 'guidao', 'roda_f', 'farol', 'paralama_f', 'cesta']);
  const parte = (nome, grupo) => {
    if (!partes.has(nome)) partes.set(nome, {nome, grupo, pivo:direcao.has(nome) ? [0, rF, zF] : [0, nome === 'roda_t' ? rT : 0, nome === 'roda_t' ? zT : 0], abre:direcao.has(nome) ? GIRO : null, caixas:[]});
    const p = partes.get(nome);
    const c = (x0, x1, y0, y1, z0, z1, mat, px = .08) => {
      const a = Math.min(x0, x1), b = Math.max(x0, x1), e = Math.min(y0, y1), f = Math.max(y0, y1), g = Math.min(z0, z1), h = Math.max(z0, z1);
      if (b - a > .001 && f - e > .001 && h - g > .001) p.caixas.push([(a + b) / 2, e, (g + h) / 2, b - a, f - e, h - g, mat, px]);
    };
    /* tubo em blocos de um ponto a outro: [x, y, z] */
    c.tubo = (a, b, esp, mat) => {
      const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], n = Math.max(1, Math.ceil(Math.hypot(...d) / (esp * .55)));
      for (let i = 0; i <= n; i++){ const t = i / n; p.caixas.push([a[0] + d[0] * t, a[1] + d[1] * t - esp / 2, a[2] + d[2] * t, esp, esp, esp, mat, 1]); }
    };
    /* os dois lados de uma vez */
    c.par = (a, b, esp, mat) => { c.tubo(a, b, esp, mat); c.tubo([-a[0], a[1], a[2]], [-b[0], b[1], b[2]], esp, mat); };
    /* cilindro deitado no eixo X (tanque, rolo, escapamento curto) */
    c.rolo = (x0, x1, y, z, raio, mat) => { c(x0, x1, y - raio, y + raio, z - raio * .62, z + raio * .62, mat); c(x0, x1, y - raio * .62, y + raio * .62, z - raio, z + raio, mat); };
    c.p = p; return c;
  };

  /* ---------------------------------------------------------- rodas */
  const roda = (nome, z, R, largura) => {
    const c = parte(nome, 'rodas');
    const anel = (raio, esp, esl, mat, passo = .5) => {
      const n = Math.max(14, Math.round(2 * Math.PI * raio / (esp * passo)));
      for (let i = 0; i < n; i++){ const a = i / n * Math.PI * 2, y = R + Math.sin(a) * raio, zz = z + Math.cos(a) * raio; c(-esl / 2, esl / 2, y - esp / 2, y + esp / 2, zz - esp / 2, zz + esp / 2, mat, 1); }
    };
    const raio = (ang, de, ate, esp, esl, mat, x = 0) => { const n = Math.max(2, Math.ceil((ate - de) / (esp * .7))); for (let i = 0; i <= n; i++){ const k = de + (ate - de) * i / n, y = R + Math.sin(ang) * k, zz = z + Math.cos(ang) * k; c(x - esl / 2, x + esl / 2, y - esp / 2, y + esp / 2, zz - esp / 2, zz + esp / 2, mat, 1); } };
    const cravos = estiloRoda === 'cravos_moto' || estiloRoda === 'bike_cravos';
    if (moto){
      const esp = R * (estiloRoda === 'cravos_moto' ? .21 : .25);
      anel(R - esp / 2 - (cravos ? .014 : 0), esp, largura, 'v_pneu', .45);
      if (cravos) for (let i = 0; i < 20; i++){ const a = i / 20 * Math.PI * 2, k = R - .018; c(-largura / 2 - .008, largura / 2 + .008, R + Math.sin(a) * k - .018, R + Math.sin(a) * k + .018, z + Math.cos(a) * k - .018, z + Math.cos(a) * k + .018, 'v_pneu', 1); }
      const aro = R - esp - (cravos ? .02 : .006);
      anel(aro, .032, largura * .62, estiloRoda === 'liga_moto' ? 'v_aro_preto' : 'v_aro', .6);
      if (estiloRoda === 'liga_moto') for (let i = 0; i < 5; i++) for (const off of [-.07, .07]) raio(i / 5 * Math.PI * 2 + Math.PI / 2 + off, .05, aro, .032, .035, 'v_aro_preto');
      else for (let i = 0; i < 14; i++) raio(i / 14 * Math.PI * 2, .05, aro, .013, .013, 'v_cromo', i % 2 ? .022 : -.022);
      c(-largura * .55, largura * .55, R - .05, R + .05, z - .05, z + .05, 'v_disco', .1);
      for (const [a, b] of [[.15, .1], [.1, .15], [.135, .135]]) c(largura * .42, largura * .42 + .012, R - a * R * 1.4, R + a * R * 1.4, z - b * R * 1.4, z + b * R * 1.4, 'v_disco', .1);   /* disco de freio */
      c(largura * .42 + .012, largura * .42 + .024, R - .045, R + .045, z - .045, z + .045, 'v_aro_preto', 1);
    } else {
      const esp = Math.max(.036, largura * .75);
      anel(R - esp / 2 - (cravos ? .008 : 0), esp, largura, 'v_pneu', .42);
      if (cravos) for (let i = 0; i < 30; i++){ const a = i / 30 * Math.PI * 2, k = R - .01; c(-largura / 2 - .006, largura / 2 + .006, R + Math.sin(a) * k - .011, R + Math.sin(a) * k + .011, z + Math.cos(a) * k - .011, z + Math.cos(a) * k + .011, 'v_pneu', 1); }
      const aro = R - esp - .006;
      if (estiloRoda === 'bike_aero'){ anel(aro - .012, .05, .026, 'v_aro_preto', .45); for (let i = 0; i < 6; i++) raio(i / 6 * Math.PI * 2, .03, aro - .03, .016, .012, 'v_aro_preto'); }
      else { anel(aro, .018, largura * .7, 'v_aro', .55); for (let i = 0; i < 12; i++) raio(i / 12 * Math.PI * 2 + .13, .03, aro, .008, .008, 'v_cromo', i % 2 ? .014 : -.014); }
      c(-.045, .045, R - .03, R + .03, z - .03, z + .03, 'v_disco', 1);
    }
  };
  roda('roda_f', zF, rF, M.pneuF); roda('roda_t', zT, rT, M.pneuT);

  const [as, az] = M.assento, [gy, gz] = M.guidao;
  /* coluna de direção: onde o quadro encontra o garfo */
  const colY = moto ? (tipo === 'moto_custom' ? .88 : gy - .1) : gy - .14;
  const colZ = moto ? (tipo === 'moto_custom' ? .33 : tipo === 'scooter' ? .34 : gz + .06) : zF - (zF - gz) * .68;
  const qd = parte('quadro', 'base'), gf = parte('garfo', 'base'), gd = parte('guidao', 'base'), fa = parte('farol', 'carroceria');
  const larguraGarfo = M.pneuF / 2 + (moto ? .035 : .022);
  const grossoGarfo = moto ? (tipo === 'moto_trail' || tipo === 'moto_esportiva' ? .05 : .042) : .028;
  /* garfo */
  gf.par([larguraGarfo, rF, zF], [larguraGarfo, colY + (moto ? .06 : .02), colZ], grossoGarfo, moto ? 'v_cromo' : 'pintura');
  if (moto || tipo === 'bike_mtb') gf.par([larguraGarfo, rF + (colY - rF) * .45, zF + (colZ - zF) * .45], [larguraGarfo, colY - .04, colZ + (zF - colZ) * .06], grossoGarfo * 1.35, moto ? 'v_amortecedor' : 'v_aro_preto');
  gf(-larguraGarfo - .02, larguraGarfo + .02, rF - .018, rF + .018, zF - .018, zF + .018, 'v_cromo', 1);
  gf(-larguraGarfo - .02, larguraGarfo + .02, colY - .03, colY + .01, colZ - .035, colZ + .035, 'v_chassi');

  /* guidão: sai da coluna até as manoplas */
  const meiaLargura = .29;
  const topo = [0, tipo === 'moto_custom' ? colY + .1 : Math.max(colY + .06, gy - .02), colZ - .01];
  gd.tubo([0, colY, colZ], topo, moto ? .045 : .028, 'v_chassi');
  if (tipo === 'bike_speed'){
    gd.tubo([-.2, topo[1], gz + .05], [.2, topo[1], gz + .05], .024, 'v_aro_preto'); gd.tubo(topo, [0, topo[1], gz + .05], .026, 'v_chassi');
    for (const s of [-1, 1]){ gd.tubo([s * .2, topo[1], gz + .05], [s * .27, gy + .02, gz + .1], .026, 'v_couro'); gd.tubo([s * .27, gy + .02, gz + .1], [s * .28, gy - .07, gz + .07], .026, 'v_couro'); gd.tubo([s * .28, gy - .07, gz + .07], [s * .28, gy - .075, gz - .01], .026, 'v_couro'); }
  } else {
    const alto = tipo === 'moto_custom' || tipo === 'bike_bmx' || tipo === 'bike_urbana';
    for (const s of [-1, 1]){
      const cotovelo = alto ? [s * .15, gy + (tipo === 'bike_urbana' ? .02 : -.01), colZ - .02] : [s * .13, (topo[1] + gy) / 2, (topo[2] + gz) / 2];
      gd.tubo(topo, cotovelo, moto ? .03 : .024, 'v_cromo'); gd.tubo(cotovelo, [s * (meiaLargura - .08), gy, gz], moto ? .03 : .024, 'v_cromo');
      gd(s * (meiaLargura - .09), s * (meiaLargura + .035), gy - .022, gy + .022, gz - .022, gz + .022, 'v_couro', 1);
      gd.tubo([s * (meiaLargura - .1), gy, gz + .035], [s * (meiaLargura + .01), gy - .01, gz + .055], .012, 'v_aro_preto');      /* manete */
      if (moto && tipo !== 'moto_esportiva'){ const ex = s * (meiaLargura - .06); gd.tubo([ex, gy, gz], [s * (meiaLargura + .03), gy + .12, gz + .02], .012, 'v_chassi'); gd(s * (meiaLargura - .01), s * (meiaLargura + .1), gy + .11, gy + .17, gz + .005, gz + .035, 'v_chassi', 1); gd(s * (meiaLargura), s * (meiaLargura + .09), gy + .118, gy + .162, gz - .001, gz + .005, 'v_cromo', 1); }
    }
  }

  const lateral = (c, x0, x1, y0, y1, z0, z1, mat, px) => { c(x0, x1, y0, y1, z0, z1, mat, px); c(-x1, -x0, y0, y1, z0, z1, mat, px); };

  if (moto){
    /* ------------------------------------------------------ base da moto: quadro, motor, balança, transmissão */
    const baixo = Math.max(.2, Math.min(rF, rT) - .08), balPivo = [0, tipo === 'scooter' ? .34 : rT + .04, -.2];
    const traseiroQ = [0, as - .1, az - .08];
    if (tipo !== 'scooter'){
      qd.tubo([0, colY - .02, colZ - .01], [0, as - .09, az + .16], .055, 'v_chassi'); qd.tubo([0, as - .09, az + .16], traseiroQ, .055, 'v_chassi');
      qd.par([.07, colY - .08, colZ - .02], [.09, baixo + .02, .17], .04, 'v_chassi'); qd.par([.09, baixo + .02, .17], [.09, baixo + .02, -.14], .04, 'v_chassi'); qd.par([.09, baixo + .02, -.14], [.08, balPivo[1], balPivo[2]], .04, 'v_chassi');
      qd.par([.08, balPivo[1], balPivo[2]], [.07, as - .1, az + .12], .04, 'v_chassi');
      qd.par([.07, as - .12, az + .06], [.08, as - .06, zT + .0], .035, 'v_chassi');                       /* subquadro */
      qd.par([.08, balPivo[1] + .03, balPivo[2] - .05], [.08, as - .09, az - .2], .03, 'v_chassi');
    } else {
      qd.tubo([0, colY - .04, colZ], [0, .27, .26], .06, 'v_chassi'); qd.par([.09, .24, .26], [.09, .24, -.12], .045, 'v_chassi'); qd.par([.09, .24, -.12], [.1, as - .1, az - .04], .045, 'v_chassi'); qd.par([.1, as - .1, az - .04], [.1, as - .08, zT - .02], .04, 'v_chassi');
    }
    const xBal = M.pneuT / 2 + .035;
    qd.par([xBal, balPivo[1], balPivo[2]], [xBal, rT, zT], .045, 'v_susp');                                    /* balança traseira */
    qd(-xBal - .025, xBal + .025, rT - .018, rT + .018, zT - .018, zT + .018, 'v_cromo', 1);
    const xAm = xBal + .005;
    qd.par([xAm, rT + .05, zT + .06], [xAm * .95, as - .12, zT + .2], .03, 'v_amortecedor');
    for (let i = 1; i < 6; i++) for (const s of [-1, 1]){ const k = i / 7, y = rT + .05 + (as - .17 - rT) * k, z = zT + .06 + .14 * k; qd(s * xAm - .032, s * xAm + .032, y - .008, y + .008, z - .032, z + .032, 'v_mola', 1); }

    const mt = parte('motor', 'base');
    if (tipo === 'scooter'){
      mt(-.1, .1, .24, .44, -.28, -.04, 'v_motor'); mt(.07, .16, rT - .08, rT + .08, zT + .02, -.12, 'v_cambio'); mt(-.12, -.06, .26, .38, -.2, -.08, 'v_aro_preto');
    } else {
      mt(-.11, .11, baixo + .04, baixo + .22, -.12, .14, 'v_motor');                                              /* cárter */
      mt(-.13, -.11, baixo + .06, baixo + .19, -.08, .06, 'v_cromo'); mt(.11, .13, baixo + .06, baixo + .19, -.04, .1, 'v_cambio');
      const cil = (z, inc) => { for (let i = 0; i < 6; i++){ const y = baixo + .22 + i * .028, zz = z + inc * i * .018, w = i % 2 ? .075 : .1; mt(-w, w, y, y + .03, zz - (i % 2 ? .06 : .085), zz + (i % 2 ? .06 : .085), i % 2 ? 'v_motor' : 'v_cambio', .1); } mt(-.065, .065, baixo + .39, baixo + .43, z + inc * .1 - .06, z + inc * .1 + .06, 'v_cabecote'); };
      if (tipo === 'moto_custom'){ cil(.1, 1); cil(-.07, -1); } else cil(.06, 1);
    }
    /* escapamento, do lado direito (-X) */
    const es = parte('escapamento', 'base'), xe = -(M.pneuT / 2 + .075);
    const saida = tipo === 'moto_trail' ? [xe, rT + .2, zT - .12] : tipo === 'moto_esportiva' ? [xe, rT + .17, zT + .02] : [xe, rT - .02, zT - .1];
    const meioEsc = tipo === 'moto_trail' ? [xe, .46, -.24] : [xe, baixo, -.18];
    es.tubo([-.07, baixo + .3, .17], [-.15, baixo + .12, .2], .045, 'v_escape'); es.tubo([-.15, baixo + .12, .2], [xe, baixo, .04], .045, 'v_escape'); es.tubo([xe, baixo, .04], meioEsc, .045, 'v_escape');
    es.tubo(meioEsc, saida, .085, tipo === 'moto_custom' ? 'v_cromo' : 'v_escape');
    if (tipo === 'moto_custom'){ es.tubo([-.15, baixo + .1, -.12], [xe, baixo + .1, -.24], .045, 'v_cromo'); es.tubo([xe, baixo + .1, -.24], [xe, rT + .1, zT - .16], .075, 'v_cromo'); }
    es(saida[0] - .028, saida[0] + .028, saida[1] - .028, saida[1] + .028, saida[2] - .06, saida[2] - .05, 'v_furo', 1);
    /* corrente, coroa e pinhão do lado esquerdo (+X) */
    const tr = parte('transmissao', 'base'), xc = M.pneuT / 2 + .008;
    if (tipo !== 'scooter'){
      tr.tubo([.135, baixo + .17, -.1], [xc, rT + .085, zT], .018, 'v_corrente'); tr.tubo([.135, baixo + .07, -.1], [xc, rT - .085, zT], .018, 'v_corrente');
      for (const [a, b] of [[.085, .05], [.05, .085], [.074, .074]]) tr(xc - .008, xc + .008, rT - a, rT + a, zT - b, zT + b, 'v_aro', .1);
    }
    /* pedaleiras, descanso */
    const ped = parte('pedaleiras', 'base'), [py, pz] = M.pe;
    if (tipo === 'scooter'){ ped(-.24, .24, py - .06, py - .01, -.1, .3, 'v_plastico'); for (let z = -.06; z < .28; z += .07) ped(-.21, .21, py - .01, py, z, z + .03, 'v_chassi', 1); }
    else { lateral(ped, .1, .29, py - .035, py - .005, pz - .025, pz + .025, 'v_aro_preto', 1); ped.par([.1, py - .02, pz], [.09, baixo + .04, pz * .5], .025, 'v_chassi'); }
    if (M.pe2) lateral(ped, .1, .27, M.pe2[0] - .03, M.pe2[0] - .005, M.pe2[1] - .02, M.pe2[1] + .02, 'v_aro_preto', 1);
    ped.tubo([.08, baixo + .02, -.1], [.22, .02, -.22], .025, 'v_chassi'); ped(.17, .29, 0, .018, -.27, -.18, 'v_chassi', 1);

    /* ------------------------------------------------------ carenagem, tanque, banco, para-lamas e luzes */
    const cr = parte('carenagem', 'carroceria'), bc = parte('banco', 'carroceria'), pf = parte('paralama_f', 'carroceria'), pt = parte('paralama_t', 'carroceria'), lz = parte('lanternas', 'carroceria');
    const paralama = (c, z, R, de, ate, larg, mat, folga = .045) => { for (let i = 0; i <= 12; i++){ const a = de + (ate - de) * i / 12, k = R + folga, y = R + Math.sin(a) * k, zz = z + Math.cos(a) * k; c(-larg / 2, larg / 2, y - .022, y + .022, zz - .045, zz + .045, mat, .1); } };
    const tanqueY = as - .04, tz0 = az + .22, tz1 = colZ - .07;
    if (tipo !== 'scooter'){
      const gordo = tipo === 'moto_custom' ? .13 : tipo === 'moto_esportiva' ? .14 : .125;
      cr(-gordo, gordo, tanqueY - .04, tanqueY + .09, tz0, tz1, 'pintura'); cr(-gordo * .74, gordo * .74, tanqueY + .09, tanqueY + .14, tz0 + .05, tz1 - .04, 'pintura'); cr(-gordo * .8, gordo * .8, tanqueY - .08, tanqueY - .04, tz0 + .04, tz1 - .06, 'pintura_sombra');
      cr(-.035, .035, tanqueY + .14, tanqueY + .165, (tz0 + tz1) / 2 - .03, (tz0 + tz1) / 2 + .04, 'v_cromo', 1);
    }
    /* banco: do piloto e do garupa */
    const [gas, gaz] = M.garupa;
    bc(-.105, .105, as - .08, as, az - .14, az + .24, 'v_couro'); bc(-.08, .08, as - .06, as - .005, az + .22, az + .3, 'v_couro');
    bc(-.09, .09, Math.min(as, gas) - .09, gas, gaz - .12, az - .13, 'v_couro');

    if (tipo === 'moto_urbana'){
      lateral(cr, .095, .135, as - .22, as - .07, az - .16, az + .12, 'pintura');
      cr(-.09, .09, as - .13, as - .08, zT - .1, az - .14, 'pintura');
      paralama(pf, zF, rF, .35, 2.2, M.pneuF + .05, 'pintura'); paralama(pt, zT, rT, .55, 2.75, M.pneuT + .05, 'pintura', .06);
      pt.par([.1, gas - .03, gaz - .12], [.1, gas - .03, zT - .17], .022, 'v_cromo'); pt(-.11, .11, gas - .045, gas - .03, zT - .19, zT - .14, 'v_cromo', 1);   /* bagageiro */
    }
    if (tipo === 'moto_trail'){
      lateral(cr, .1, .145, as - .2, tanqueY + .05, tz1 - .24, tz1 + .06, 'pintura'); lateral(cr, .09, .13, as - .22, as - .07, az - .2, az + .08, 'pintura_sombra');
      cr(-.08, .08, as - .12, as - .07, zT - .16, az - .16, 'pintura');
      pf.tubo([0, rF + M.rodaF / 2 + .09, zF - .06], [0, rF + M.rodaF / 2 + .12, zF + .24], .06, 'pintura'); pf(-.075, .075, rF + M.rodaF / 2 + .07, rF + M.rodaF / 2 + .1, zF - .16, zF + .12, 'pintura');
      paralama(pt, zT, rT, 1.1, 2.5, M.pneuT + .03, 'v_plastico', .11);
    }
    if (tipo === 'moto_esportiva'){
      for (let i = 0; i < 6; i++){ const y = baixo + .02 + i * .085, z1 = colZ + .02 + Math.min(i, 4) * .045; lateral(cr, .115, .165, y, y + .09, -.1 + i * .035, Math.min(zF - .12, z1 + .06), i < 2 ? 'v_plastico' : 'pintura'); }
      cr(-.15, .15, colY - .14, colY + .05, colZ + .04, colZ + .2, 'pintura'); cr(-.1, .1, colY - .08, colY + .04, colZ + .2, colZ + .27, 'pintura');
      for (let i = 0; i < 5; i++) cr(-.12 + i * .012, .12 - i * .012, colY + .05 + i * .034, colY + .09 + i * .034, colZ + .14 - i * .045, colZ + .17 - i * .045, 'v_vidro', 1);
      lateral(cr, .09, .125, as - .2, as - .07, az - .12, az + .1, 'pintura');
      for (let i = 0; i < 5; i++) cr(-.1 + i * .008, .1 - i * .008, as - .13 + i * .028, gas - .02 + i * .012, gaz - .1 - i * .055, gaz - .04 - i * .055, 'pintura');
      paralama(pf, zF, rF, .5, 2.1, M.pneuF + .045, 'pintura', .03); paralama(pt, zT, rT, 1.5, 2.8, M.pneuT * .7, 'v_plastico', .07);
    }
    if (tipo === 'moto_custom'){
      lateral(cr, .09, .13, as - .17, as - .06, az - .18, az + .1, 'pintura');
      paralama(pf, zF, rF, .5, 2.0, M.pneuF + .05, 'pintura'); paralama(pt, zT, rT, .25, 2.5, M.pneuT + .05, 'pintura', .05);
      bc(-.07, .07, gas, gas + .22, gaz - .16, gaz - .12, 'v_couro'); bc.par([.07, gas - .05, gaz - .14], [.07, gas + .22, gaz - .15], .02, 'v_cromo');   /* encosto */
    }
    if (tipo === 'scooter'){
      for (let i = 0; i < 8; i++){ const y = .27 + i * .085; cr(-.2 + Math.abs(i - 4) * .008, .2 - Math.abs(i - 4) * .008, y, y + .09, .31 + Math.min(i, 6) * .012, .42 + Math.min(i, 6) * .008, 'pintura'); }   /* escudo frontal */
      cr(-.1, .1, .55, .8, .24, .32, 'pintura_sombra'); cr(-.14, .14, .94, 1.04, colZ - .02, colZ + .1, 'pintura');
      cr(-.16, .16, .36, as - .08, zT + .02, -.14, 'pintura'); cr(-.13, .13, .5, as - .08, zT - .12, zT + .06, 'pintura'); lateral(cr, .16, .175, .42, .52, zT + .06, -.2, 'v_cromo', 1);
      paralama(pf, zF, rF, .3, 2.35, M.pneuF + .08, 'pintura', .035); paralama(pt, zT, rT, 1.3, 2.9, M.pneuT + .06, 'v_plastico', .05);
      pt.par([.1, gas - .02, gaz - .12], [.09, gas - .02, zT - .17], .022, 'v_cromo'); pt.tubo([-.09, gas - .02, zT - .17], [.09, gas - .02, zT - .17], .022, 'v_cromo');
    }
    /* farol, setas, lanterna e placa */
    const fy = tipo === 'scooter' ? .98 : tipo === 'moto_esportiva' ? colY - .06 : colY - .02, fz = tipo === 'scooter' ? colZ + .1 : tipo === 'moto_esportiva' ? colZ + .27 : colZ + .1;
    if (tipo === 'moto_esportiva') lateral(fa, .025, .095, fy - .035, fy + .025, fz - .01, fz + .015, 'v_farol');
    else { fa.rolo(-.075, .075, fy, fz, .085, 'v_chassi'); fa(-.055, .055, fy - .055, fy + .055, fz + .08, fz + .1, 'v_farol'); fa.tubo([-.1, fy, fz - .02], [.1, fy, fz - .02], .02, 'v_cromo'); }
    if (tipo !== 'moto_esportiva' && tipo !== 'scooter') lateral(fa, .12, .18, fy - .03, fy + .015, fz - .02, fz + .03, 'v_seta', 1);
    else lateral(fa, .13, .18, fy - .1, fy - .065, fz - .04, fz - .005, 'v_seta', 1);
    const caudaZ = tipo === 'moto_esportiva' ? M.garupa[1] - .33 : tipo === 'moto_custom' ? zT - .3 : zT - .17, caudaY = tipo === 'moto_esportiva' ? M.garupa[0] - .02 : tipo === 'moto_custom' ? rT + .26 : M.garupa[0] - .1;
    lz(-.05, .05, caudaY - .03, caudaY + .04, caudaZ - .02, caudaZ + .02, 'v_lanterna'); lateral(lz, .1, .15, caudaY - .02, caudaY + .015, caudaZ, caudaZ + .04, 'v_seta', 1);
    lz(-.075, .075, caudaY - .17, caudaY - .08, caudaZ - .03, caudaZ - .01, 'v_placa'); lz.tubo([0, caudaY - .02, caudaZ + .02], [0, caudaY - .12, caudaZ - .015], .02, 'v_plastico');
  } else {
    /* ------------------------------------------------------ bicicleta: quadro, pedais e corrente */
    const [bbY, bbZ, braco] = M.pedivela, selim = [0, as - .07, az + .03], tuboAlto = [0, colY + .02, colZ - .005], tuboBaixo = [0, colY - .1, colZ + .02];
    const esp = tipo === 'bike_cargueira' ? .045 : tipo === 'bike_speed' ? .028 : .034, bb = [0, bbY, bbZ];
    qd.tubo(tuboAlto, tuboBaixo, esp * 1.3, 'pintura');
    qd.tubo(bb, [0, as - .1, az + .05], esp, 'pintura'); qd.tubo(tuboBaixo, bb, esp * 1.1, 'pintura');
    if (tipo === 'bike_urbana'){ qd.tubo([0, colY - .06, colZ], [0, bbY + .2, bbZ + (az + .05 - bbZ) * .2 / (as - .1 - bbY)], esp, 'pintura'); }
    else qd.tubo(tuboAlto, [0, as - (tipo === 'bike_bmx' ? .16 : .12), az + .05], esp, 'pintura');
    qd.par([.02, bbY, bbZ], [M.pneuT / 2 + .025, rT, zT], esp * .72, 'pintura'); qd.par([.02, as - .13, az + .045], [M.pneuT / 2 + .025, rT, zT], esp * .68, 'pintura');
    qd.tubo([0, as - .1, az + .05], selim, .022, 'v_cromo');
    qd(-M.pneuT / 2 - .045, M.pneuT / 2 + .045, rT - .014, rT + .014, zT - .014, zT + .014, 'v_cromo', 1);
    const bc = parte('banco', 'carroceria'), largoSelim = tipo === 'bike_urbana' || tipo === 'bike_cargueira' ? .085 : .05;
    bc(-largoSelim, largoSelim, as - .055, as, az - .12, az + .03, 'v_couro'); bc(-.026, .026, as - .05, as - .005, az + .02, az + .17, 'v_couro');

    /* transmissão: a pedivela da esquerda (+X) aponta para a frente, a da direita para trás */
    const tr = parte('transmissao', 'base'), ang = -.38;
    const circulo = (x, y, z, raio, mat) => { const n = Math.max(10, Math.round(raio * 150)); for (let i = 0; i < n; i++){ const a = i / n * Math.PI * 2; tr(x - .006, x + .006, y + Math.sin(a) * raio - .011, y + Math.sin(a) * raio + .011, z + Math.cos(a) * raio - .011, z + Math.cos(a) * raio + .011, mat, 1); } };
    circulo(-.055, bbY, bbZ, .085, 'v_aro'); circulo(-.055, rT, zT, .045, 'v_aro');
    tr.tubo([-.055, bbY + .085, bbZ], [-.055, rT + .047, zT], .012, 'v_corrente'); tr.tubo([-.055, bbY - .085, bbZ], [-.055, rT - .047, zT], .012, 'v_corrente');
    tr(-.075, .075, bbY - .03, bbY + .03, bbZ - .03, bbZ + .03, 'v_chassi', 1);
    const pv = parte('pedivela', 'base'); pv.p.pivo = [0, bbY, bbZ];
    for (let i = 0; i < 4; i++){ const a = ang + i * Math.PI / 2 + .6; pv.tubo([-.064, bbY, bbZ], [-.064, bbY + Math.sin(a) * .078, bbZ + Math.cos(a) * .078], .014, 'v_cromo'); }   /* braços da coroa: mostram o giro */
    const pedal = {};
    for (const [lado, a] of [[1, ang], [-1, ang + Math.PI]]){
      const y = bbY + Math.sin(a) * braco, z = bbZ + Math.cos(a) * braco;
      pv.tubo([lado * .085, bbY, bbZ], [lado * .085, y, z], .022, 'v_cromo');
      const pd = parte(lado > 0 ? 'pedal_e' : 'pedal_d', 'base'); pd.p.pivo = [lado * .155, y, z];
      pd(lado * .09, lado * .22, y - .016, y + .016, z - .035, z + .035, 'v_aro_preto', 1);
      pedal[lado] = [y + .016, z];
    }
    carroPedais = pedal;
    /* freios e para-lamas */
    const pf = parte('paralama_f', 'carroceria'), pt = parte('paralama_t', 'carroceria'), lz = parte('lanternas', 'carroceria');
    const paralama = (c, z, R, de, ate, larg, mat) => { for (let i = 0; i <= 22; i++){ const a = de + (ate - de) * i / 22, k = R + .028; c(-larg / 2, larg / 2, R + Math.sin(a) * k - .012, R + Math.sin(a) * k + .012, z + Math.cos(a) * k - .026, z + Math.cos(a) * k + .026, mat, 1); } };
    if (tipo === 'bike_urbana' || tipo === 'bike_cargueira'){
      paralama(pf, zF, rF, .5, 2.55, M.pneuF + .03, 'pintura'); paralama(pt, zT, rT, .45, 3.0, M.pneuT + .03, 'pintura');
      tr(-.08, -.065, bbY + .06, bbY + .105, bbZ - .04, bbZ + .08, 'pintura', 1); tr.tubo([-.072, bbY + .098, bbZ], [-.072, rT + .062, zT + .03], .028, 'pintura');   /* protetor da corrente */
      pt(-.09, .09, rT * 2 + .06, rT * 2 + .085, zT - .2, zT + .12, 'v_chassi'); pt.par([.085, rT * 2 + .06, zT - .16], [M.pneuT / 2 + .03, rT, zT], .018, 'v_chassi');   /* bagageiro */
    }
    fa(-.028, .028, colY - .03, colY + .03, colZ + .045, colZ + .09, 'v_chassi', 1); fa(-.02, .02, colY - .02, colY + .02, colZ + .09, colZ + .1, 'v_farol', 1);
    lz(-.022, .022, as - .17, as - .12, az - .01, az + .02, 'v_lanterna', 1);
    if (tipo === 'bike_urbana'){
      const cs = parte('cesta', 'carroceria'), y0 = rF * 2 + .08, z0 = zF - .08;
      cs.tubo([0, y0 - .02, z0 + .05], [0, colY, colZ + .02], .022, 'v_chassi');
      cs(-.17, .17, y0, y0 + .02, z0, z0 + .26, 'v_chassi', 1);
      for (const y of [y0 + .1, y0 + .19]){ cs(-.17, .17, y, y + .015, z0, z0 + .015, 'v_caixa_bike', 1); cs(-.17, .17, y, y + .015, z0 + .245, z0 + .26, 'v_caixa_bike', 1); lateral(cs, .155, .17, y, y + .015, z0, z0 + .26, 'v_caixa_bike', 1); }
      for (let x = -.165; x < .17; x += .066) for (const z of [z0, z0 + .245]) cs(x, x + .012, y0, y0 + .2, z, z + .015, 'v_caixa_bike', 1);
      for (let z = z0; z < z0 + .25; z += .062) lateral(cs, .155, .17, y0, y0 + .2, z, z + .012, 'v_caixa_bike', 1);
    }
    if (tipo === 'bike_cargueira'){
      const cg = parte('bagageiro_f', 'carroceria'), y0 = rF * 2 + .07, z0 = zF - .16;
      cg.par([.1, colY - .08, colZ + .03], [.16, y0, z0], .028, 'v_chassi'); cg(-.19, .19, y0, y0 + .025, z0 - .02, z0 + .38, 'v_chassi', .2);
      lateral(cg, .175, .19, y0 + .025, y0 + .09, z0 - .02, z0 + .38, 'pintura', 1); cg(-.19, .19, y0 + .025, y0 + .09, z0 + .365, z0 + .38, 'pintura', 1);
      cg.par([.12, y0, z0 + .3], [larguraGarfo + .02, rF, zF], .02, 'v_chassi');
    }
    if (tipo === 'bike_bmx') for (const [z, R] of [[zF, rF], [zT, rT]]) lateral(parte('pedaleiras', 'base'), .06, .2, R - .022, R + .022, z - .022, z + .022, 'v_cromo', 1);
  }

  /* ---------------------------------------------------------- acessórios */
  const [gas2, gaz2] = M.garupa || [rT * 2 + .1, zT];
  const ac = parte('acessorios', 'carroceria'), topoBag = moto ? gas2 - .03 : rT * 2 + .085;
  const bagZ = moto ? zT - .12 : zT - .05;
  const suporte = () => { ac(-.12, .12, topoBag - .01, topoBag + .012, bagZ - .14, bagZ + .12, 'v_chassi', 1); ac.par([.08, topoBag, bagZ], [M.pneuT / 2 + .04, rT + .06, zT + .02], .018, 'v_chassi'); };
  if (kit === 'bau' || policia){
    suporte();
    const larg = .2, y = topoBag + .012;
    ac(-larg, larg, y, y + .26, bagZ - .22, bagZ + .12, policia === 'antiga' ? 'v_pmpint_branco' : policia ? 'v_pmpint_preto' : 'v_plastico'); ac(-larg + .02, larg - .02, y + .26, y + .31, bagZ - .2, bagZ + .1, policia === 'nova' ? 'v_pmpint_caqui' : policia ? 'v_pmpint_branco' : 'v_aro_preto');
    ac(-.07, .07, y + .12, y + .16, bagZ - .235, bagZ - .22, 'v_lanterna', 1);
  }
  if (kit === 'carga'){
    suporte();
    const y = topoBag + .012;
    ac(-.16, .16, y, y + .16, bagZ - .18, bagZ + .1, 'v_madeira'); ac(-.17, .17, y + .06, y + .085, bagZ - .185, bagZ + .105, 'v_couro', 1);
    ac.rolo(-.22, .22, y + .24, bagZ - .04, .08, 'v_lona'); for (const x of [-.14, .12]) ac(x, x + .025, y + .155, y + .33, bagZ - .125, bagZ + .045, 'v_couro', 1);
    for (const s of [-1, 1]){ const x = s * (M.pneuT / 2 + .1); ac(x - .05, x + .05, topoBag - .3, topoBag - .06, zT - .1, zT + .18, 'v_alforje'); ac(x - .056, x + .056, topoBag - .11, topoBag - .05, zT - .11, zT + .19, 'v_couro'); ac(x + s * .05, x + s * .062, topoBag - .2, topoBag - .16, zT + .02, zT + .06, 'v_cromo', 1); }
    if (tipo === 'bike_cargueira'){ const y0 = rF * 2 + .095, z0 = zF - .16; ac(-.16, .16, y0, y0 + .24, z0 + .02, z0 + .32, 'v_caixa_bike'); ac(-.17, .17, y0 + .09, y0 + .115, z0 + .015, z0 + .325, 'v_couro', 1); ac(-.12, .1, y0 + .24, y0 + .38, z0 + .08, z0 + .26, 'v_lona'); }
  }
  if (kit === 'apocalipse'){
    suporte();
    const y = topoBag + .012;
    ac(-.15, .15, y, y + .12, bagZ - .17, bagZ + .09, 'v_blind_aco');
    for (const s of [-1, 1]){ const x = s * (M.pneuT / 2 + .105); ac(x - .04, x + .04, topoBag - .32, topoBag - .03, zT - .09, zT + .13, 'v_galao'); ac(x - .018, x + .018, topoBag - .03, topoBag + .01, zT + .04, zT + .09, 'v_aro_preto', 1); }
    ac.rolo(-.2, .2, y + .2, bagZ - .05, .08, 'v_lona'); for (const x of [-.12, .1]) ac(x, x + .025, y + .115, y + .29, bagZ - .135, bagZ + .035, 'v_couro', 1);
    ac.tubo([-.17, y + .14, bagZ + .07], [-.17, y + .55, bagZ + .02], .022, 'v_arame');                                             /* mastro com pano */
    ac(-.17, -.155, y + .42, y + .54, bagZ - .17, bagZ + .01, 'v_suc_vermelho', .05);
    /* grade do farol, chapa de peito e barras de proteção */
    const gr = parte('blindagem_frente', 'carroceria'); gr.p.pivo = [0, rF, zF]; gr.p.abre = GIRO;
    const fzG = moto ? (tipo === 'moto_esportiva' ? colZ + .31 : tipo === 'scooter' ? colZ + .22 : colZ + .22) : colZ + .13, fyG = tipo === 'scooter' ? .98 : colY;
    for (const x of [-.1, -.035, .035, .1]) gr(x - .008, x + .008, fyG - .12, fyG + .08, fzG, fzG + .016, 'v_blind_escuro', 1);
    for (const yy of [fyG - .12, fyG - .02, fyG + .08]) gr(-.11, .11, yy - .008, yy + .008, fzG, fzG + .016, 'v_blind_escuro', 1);
    gr.par([.09, fyG - .02, fzG - .01], [larguraGarfo + .02, fyG - .06, colZ + .01], .018, 'v_blind_escuro');
    const bl = parte('blindagem', 'carroceria');
    if (moto){
      for (const s of [-1, 1]){ bl.tubo([s * .1, colY - .16, colZ + .04], [s * .27, .46, .2], .036, 'v_blind_aco'); bl.tubo([s * .27, .46, .2], [s * .27, .3, .12], .036, 'v_blind_aco'); bl.tubo([s * .27, .3, .12], [s * .1, .28, .08], .036, 'v_blind_aco'); gd(s * (meiaLargura - .09), s * (meiaLargura + .09), gy - .045, gy + .055, gz + .06, gz + .085, 'v_blind_escuro', .06); }
      bl(-.13, .13, .17, .21, -.08, .22, 'v_blind_escuro');
    }
    if (op.espinhos){
      const es = parte('espinhos', 'carroceria');
      for (const [z, R] of [[zT, rT]]) for (const s of [-1, 1]) for (let i = 0; i < 3; i++){ const x = s * (M.pneuT / 2 + .05 + i * .045), m = .035 - i * .01; es(x - .024, x + .024, R - m, R + m, z - m, z + m, 'v_espinho', 1); }
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++){ const m = .028 - i * .008, x = s * ((moto ? .27 : .2) + i * .045); es(x - .024, x + .024, (moto ? .46 : rF + .1) - m, (moto ? .46 : rF + .1) + m, (moto ? .2 : colZ + .12) - m, (moto ? .2 : colZ + .12) + m, 'v_espinho', 1); }
    }
  }

  /* ---------------------------------------------------------- viatura da PM */
  if (policia){
    for (const p of partes.values()) if (p.grupo === 'carroceria') for (const c of p.caixas) if (c[6].startsWith('pintura')) c[6] = policia === 'nova' ? 'v_pmpint_caqui' : 'v_pmpint_branco';
    const letra = policia === 'nova' ? 'v_pm_letra' : 'v_pm_azul';
    const pm = parte('policia', 'carroceria'), y = topoBag + .012;
    for (const s of [-1, 1]) escrevePm('PM', .026, (u0, u1, v0, v1) => ac(s * .2, s * .212, y + .06 + v0, y + .06 + v1, bagZ - .05 + (s > 0 ? -u1 : u0), bagZ - .05 + (s > 0 ? -u0 : u1), policia === 'nova' ? 'v_pm_letra_clara' : 'v_pm_azul', 1));
    const [tz0, tz1] = [az + .22, colZ - .07], xt = .128 + (tipo === 'moto_trail' ? .02 : 0);
    const zt = tipo === 'moto_trail' ? tz1 - .09 : (tz0 + tz1) / 2, yt = tipo === 'moto_trail' ? as - .09 : as - .02;
    for (const s of [-1, 1]) escrevePm('PM', .017, (u0, u1, v0, v1) => pm(s * xt, s * (xt + .012), yt + v0, yt + v1, zt + (s > 0 ? -u1 : u0), zt + (s > 0 ? -u0 : u1), letra, 1));
    /* luzes na frente e atrás: azul no patrulhamento, vermelha na emergência */
    const luz = op.luz === 'vermelha' ? 'v_pm_vm_on' : op.luz === 'apagada' ? 'v_pm_azul_off' : 'v_pm_azul_on';
    const lf = parte('giroflex', 'carroceria');
    for (const s of [-1, 1]){ lf(s * .13, s * .2, colY - .12, colY - .06, colZ + .08, colZ + .13, luz, 1); }
    lf.tubo([.14, y + .3, bagZ - .15], [.14, y + .45, bagZ - .15], .018, 'v_chassi'); lf(.1, .18, y + .45, y + .52, bagZ - .19, bagZ - .11, luz, 1);
    for (let i = 0; i < 4; i++) fa(-.11 + i * .008, .11 - i * .008, colY + .08 + i * .045, colY + .13 + i * .045, colZ + .12 - i * .028, colZ + .135 - i * .028, 'v_vidro', 1);   /* para-brisa */
  }

  const lugares = [{nome:'lugar_piloto', pos:[0, as, az]}];
  if (moto) lugares.push({nome:'lugar_garupa', pos:[0, M.garupa[0], M.garupa[1]]});
  const lista = [...partes.values()].filter(p => p.caixas.length);
  const todas = lista.flatMap(p => p.caixas);
  const zMin = Math.min(...todas.map(c => c[2] - c[5] / 2)), zMax = Math.max(...todas.map(c => c[2] + c[5] / 2)), yMax = Math.max(...todas.map(c => c[1] + c[4])), xMax = Math.max(...todas.map(c => Math.abs(c[0]) + c[3] / 2));
  const carro = {tipo, medidas:{...M, comp:zMax - zMin, larg:xMax * 2, alt:yMax}, estado:'inteiro', roda:estiloRoda, partes:lista, lugares, eixos:[zF, zT], assento:as, duasRodas:true, pedais:moto ? null : carroPedais, viatura:policia, kit, colY, colZ};
  if (op.estado === 'abandonado' || op.estado === 'destruido'){
    carro.estado = op.estado;
    const destruido = op.estado === 'destruido';
    if (destruido) carro.partes = carro.partes.filter(p => !['roda_f', 'farol', 'paralama_f', 'banco', 'cesta', 'giroflex'].includes(p.nome));
    for (const p of carro.partes) if (p.grupo !== 'rodas') p.caixas.forEach((c, i) => { const k = ruido(`2r|${tipo}|${p.nome}|${i}`); if (destruido && c[6].startsWith('pintura') && k < 60) c[6] = k < 35 ? 'v_queimado' : 'v_ferrugem'; else if (k < (destruido ? 24 : 12)) c[6] = k % 2 ? 'v_ferrugem' : 'v_poeira'; });
  }
  const nivel = FERRUGENS[op.ferrugem] ? Number(op.ferrugem) : 0;
  carro.ferrugem = nivel;
  if (nivel) for (const p of carro.partes){ p.ferrugem = nivel; p.semente = ruido(tipo) + 5; }
  return carro;
}
var carroPedais = null;

/* o construtor geral passa a aceitar motos e bicicletas */
const construirQuatroRodas = construirCarro;
construirCarro = function(tipo, op = {}){ return DUAS_RODAS[tipo] ? construirDuasRodas(tipo, op) : construirQuatroRodas(tipo, op); };

/* ================================================================ piloto: braços e pernas calculados para cada modelo */
/* cinemática de dois ossos no plano de lado (y = altura, z = frente). Ângulo = quanto o osso aponta para a frente a partir de baixo. */
const anguloDe = (a, b) => Math.atan2(b[1] - a[1], -(b[0] - a[0]));
const distancia = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
function doisOssos(raiz, alvo, meioRep, raizRep, pontaRep, dobra){
  const l1 = distancia(raizRep, meioRep), l2 = distancia(meioRep, pontaRep);
  const bruta = distancia(raiz, alvo), d = Math.max(Math.abs(l1 - l2) + .01, Math.min(l1 + l2 - .005, bruta));
  const direto = anguloDe(raiz, alvo), abre = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const a1 = direto + dobra * abre;
  const meio = [raiz[0] - Math.cos(a1) * l1, raiz[1] + Math.sin(a1) * l1];
  const ponta = [raiz[0] + (alvo[0] - raiz[0]) * d / bruta, raiz[1] + (alvo[1] - raiz[1]) * d / bruta];
  const a2 = anguloDe(meio, ponta);
  return {giro1:anguloDe(raizRep, meioRep) - a1, giro2:anguloDe(meioRep, pontaRep) - a2, falta:Math.max(0, bruta - (l1 + l2))};
}
/* pontos do boneco em repouso, [altura, frente], em metros. Cada lado é medido separado: em repouso uma perna está um pouco à frente da outra. */
let medidasGuardadas = null;
function medidasDoBoneco(){
  if (medidasGuardadas) return medidasGuardadas;
  const modelo = montar(structuredClone(PADRAO_LIMPO)), P = pivos(), yz = n => [P[n][1], P[n][2]];
  const caixa = nome => { const p = modelo.pecas.find(a => a.nome === nome), lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (const q of p.quads) for (const v of q.v) for (let i = 0; i < 3; i++){ lo[i] = Math.min(lo[i], v[i] + p.pivo[i]); hi[i] = Math.max(hi[i], v[i] + p.pivo[i]); } return {lo, hi}; };
  const quadril = caixa('quadril');
  const lado = l => {
    const mao = caixa('mao_' + l), pe = caixa('pe_' + l);
    return {ombro:yz('braco_' + l), cotovelo:yz('antebraco_' + l), mao:[(mao.lo[1] + mao.hi[1]) / 2, (mao.lo[2] + mao.hi[2]) / 2], quadril:yz('coxa_' + l), joelho:yz('canela_' + l), tornozelo:yz('pe_' + l),
      sola:[pe.lo[1], (pe.lo[2] + pe.hi[2]) / 2]};
  };
  return (medidasGuardadas = {cintura:yz('cintura'), assento:[quadril.lo[1], (quadril.lo[2] + quadril.hi[2]) / 2], e:lado('e'), d:lado('d')});
}
function prepararPiloto(config, carro, indice = 0, semCapacete = false){
  const c = structuredClone(config), M = DUAS_RODAS[carro.tipo], B = medidasDoBoneco(), garupa = indice === 1;
  c.lapis.usa = false; if (c.escudo) c.escudo.usa = false; if (c.tonfa) c.tonfa.usa = false;
  if (garupa) c.mochila.estilo = 'nenhum';
  if (M.grupo === 'moto' && !semCapacete && c.chapeu.estilo !== 'moto_pm') c.chapeu = {...c.chapeu, estilo:carro.viatura ? 'moto_pm' : 'capacete_moto', cor:carro.viatura ? '#E7E5DE' : garupa ? '#2E5C8A' : '#26282C'};
  return {modelo:montar(c), carro, indice};
}
function poseDoPiloto(preparado, pedais){
  const {modelo, carro, indice} = preparado, M = DUAS_RODAS[carro.tipo], B = medidasDoBoneco(), garupa = indice === 1;
  const lugar = carro.lugares[indice].pos, inclina = garupa ? Math.max(0, M.inclina * .55) : M.inclina;
  /* posições medidas a partir do ponto onde o boneco se senta */
  const rel = p => [p[0] - B.assento[0], p[1] - B.assento[1]], noVeiculo = ([y, z]) => [y - lugar[1], z - lugar[2]];
  const cint = rel(B.cintura);
  const girar2 = ([y, z], a) => [y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];     /* mesma rotação em X usada no boneco */
  const abreY = M.grupo === 'bike' ? .06 : carro.tipo === 'scooter' ? .05 : .15, abreZ = M.grupo === 'bike' ? .05 : carro.tipo === 'scooter' ? .06 : .12;
  const ang = {cintura:[inclina, 0, 0], cabeca:[-inclina * .82, 0, 0]}, alcance = {};
  for (const [s, lado] of [[1, 'e'], [-1, 'd']]){
    const L = B[lado];
    const solto = rel(L.ombro), v = girar2([solto[0] - cint[0], solto[1] - cint[1]], inclina), ombro = [cint[0] + v[0], cint[1] + v[1]];
    /* mãos: nas manoplas; o garupa segura na cintura do piloto */
    const piloto = carro.lugares[0].pos;
    const maoAlvo = garupa ? noVeiculo([piloto[1] + .27, piloto[2] - .06]) : noVeiculo([M.guidao[0] + .02, M.guidao[1]]);
    const braco = doisOssos(ombro, maoAlvo, rel(L.cotovelo), rel(L.ombro), rel(L.mao), -1);
    /* pés: a sola vai para a pedaleira ou o pedal; o pé fica plano, então o tornozelo guarda a mesma distância da sola */
    const apoio = M.grupo === 'bike' ? (pedais || carro.pedais)[s] : garupa ? M.pe2 : M.pe;
    const tornozelo = [apoio[0] + (L.tornozelo[0] - L.sola[0]) - .006, apoio[1] + (L.tornozelo[1] - L.sola[1])];
    const perna = doisOssos(rel(L.quadril), noVeiculo(tornozelo), rel(L.joelho), rel(L.quadril), rel(L.tornozelo), 1);
    ang['braco_' + lado] = [braco.giro1 - inclina, 0, 0];
    ang['antebraco_' + lado] = [braco.giro2 - braco.giro1, 0, 0];
    ang['coxa_' + lado] = [perna.giro1, s * abreY, s * abreZ];
    ang['canela_' + lado] = [perna.giro2 - perna.giro1, 0, 0];
    ang['pe_' + lado] = [-perna.giro2, 0, 0];
    alcance['mao_' + lado] = braco.falta; alcance['pe_' + lado] = perna.falta;
  }
  ANGULOS.pilotando = ang;
  const quads = posar(modelo, 'pilotando').quads;
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const q of quads) if (q.peca === 'quadril') for (const p of q.v) for (let i = 0; i < 3; i++){ lo[i] = Math.min(lo[i], p[i]); hi[i] = Math.max(hi[i], p[i]); }
  const d = [-(lo[0] + hi[0]) / 2, lugar[1] - lo[1], lugar[2] - (lo[2] + hi[2]) / 2];
  for (const q of quads) q.v = q.v.map(p => soma(p, d));
  quads.alcance = alcance;
  return quads;
}
const pilotar = (config, carro, indice = 0, semCapacete = false) => poseDoPiloto(prepararPiloto(config, carro, indice, semCapacete));

/* onde fica cada pedal depois de a pedivela girar fi radianos para a frente */
function pedaisGirados(carro, fi){
  const [bbY, bbZ] = DUAS_RODAS[carro.tipo].pedivela, out = {};
  for (const s of [1, -1]){
    const y = carro.pedais[s][0] - .016 - bbY, z = carro.pedais[s][1] - bbZ;
    out[s] = [bbY + y * Math.cos(fi) - z * Math.sin(fi) + .016, bbZ + y * Math.sin(fi) + z * Math.cos(fi)];
  }
  return out;
}

/* ---------------------------------------------------------------- no montador de cenários */
if (typeof BIBLIOTECA !== 'undefined'){
  const CAT = 'Motos e bicicletas';
  BIBLIOTECA.CATEGORIAS.push(CAT);
  Object.assign(BIBLIOTECA.FIXAS, CORES_CARRO);
  const novo = (id, nome, tipo, op, comCor) => BIBLIOTECA.ITENS[id] = {id, nome, cat:CAT, cores:comCor ? {pintura:['Pintura', DUAS_RODAS[tipo].cor]} : {},
    desenhar(g){ for (const p of construirDuasRodas(tipo, op).partes) for (const caixa of p.caixas) g.b(...caixa); },
    ...(op.ferrugem ? {pintaPixel:(cor, mat, centro, n) => enferrujar(cor, mat, centro, n, op.ferrugem, ruido(tipo) + 5)} : {})};
  for (const [tipo, M] of Object.entries(DUAS_RODAS)){
    const curto = M.nome.replace(/ \(.*\)/, '');
    novo(`duas_${tipo}`, curto, tipo, {}, true);
    novo(`duas_${tipo}_velha`, `${curto}: enferrujada`, tipo, {ferrugem:3, estado:'abandonado'}, true);
    novo(`duas_${tipo}_apocalipse`, `${curto}: apocalipse`, tipo, {kit:'apocalipse', espinhos:true, ferrugem:2}, true);
  }
  for (const tipo of MOTOS_PM) novo(`duas_${tipo}_pm`, `Moto da PM: ${DUAS_RODAS[tipo].nome.replace(/ \(.*\)/, '').replace('Moto ', '')}`, tipo, {viatura:'nova'}, true);
}
