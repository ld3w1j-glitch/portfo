/* Padrão dos veículos do jogo: uma tabela de medidas gera a base (estrutura de baixo), a carroceria e as rodas.
   Medidas em metros. Origem no chão, no centro. Y = altura, frente = +Z, lado do motorista = +X.
   Modelos genéricos, sem copiar marcas. Carregar depois de modelo.js. */

/* d = distância medida a partir da ponta da frente do carro */
const CARROS = {
  sedan: {nome:'Sedã', comp:4.5, larg:1.8, alt:1.72, entre:2.7, balanco:.85, roda:.64, pneu:.22, vao:.16, cintura:.98,
    base:'monobloco', tracao:'dianteira', rodas:['liga', 'aco', 'esportiva'], cor:'#8E2A26',
    capo:1.15, tetoF:1.72, tetoT:3.38, vidroT:3.86, traseira:'portamalas', portas:[[1.15, 2.45], [2.45, 3.55]],
    lugares:[[2.15, 1], [2.15, -1], [3.02, 1], [3.02, -1]]},
  suv_compacto: {nome:'SUV compacto', comp:4.3, larg:1.8, alt:1.82, entre:2.6, balanco:.85, roda:.7, pneu:.24, vao:.2, cintura:1.08,
    base:'monobloco', tracao:'dianteira', rodas:['liga_suv', 'aco', 'offroad'], cor:'#2E5C8A', rack:true, molduras:true,
    capo:1.08, tetoF:1.62, tetoT:3.86, vidroT:4.22, traseira:'tampao', portas:[[1.08, 2.36], [2.36, 3.38]],
    lugares:[[2.08, 1], [2.08, -1], [3.02, 1], [3.02, -1]]},
  suv_grande: {nome:'SUV grande', comp:4.9, larg:1.96, alt:2.0, entre:2.85, balanco:.92, roda:.8, pneu:.28, vao:.24, cintura:1.22,
    base:'longarinas', tracao:'4x4', rodas:['offroad', 'liga_suv', 'aco'], cor:'#33413A', rack:true, molduras:true, estribo:true,
    capo:1.3, tetoF:1.82, tetoT:4.58, vidroT:4.82, traseira:'tampao', portas:[[1.3, 2.66], [2.66, 3.74]],
    lugares:[[2.36, 1], [2.36, -1], [3.34, 1], [3.34, -1]]},
  picape_compacta: {nome:'Caminhonete compacta (cabine simples)', comp:4.5, larg:1.76, alt:1.8, entre:2.75, balanco:.8, roda:.64, pneu:.22, vao:.2, cintura:1.08,
    base:'monobloco', tracao:'dianteira', rodas:['aco', 'liga', 'offroad'], cor:'#E4E2DA', molduras:true,
    capo:1.1, tetoF:1.62, tetoT:2.62, vidroT:2.74, traseira:'cacamba', cabine:2.76, portas:[[1.1, 2.5]],
    lugares:[[2.1, 1], [2.1, -1]]},
  picape_media: {nome:'Caminhonete média (cabine dupla)', comp:5.3, larg:1.9, alt:1.95, entre:3.1, balanco:.96, roda:.78, pneu:.28, vao:.25, cintura:1.2,
    base:'longarinas', tracao:'4x4', rodas:['offroad', 'liga_suv', 'aco'], cor:'#6B6F74', molduras:true, estribo:true,
    capo:1.36, tetoF:1.86, tetoT:3.52, vidroT:3.62, traseira:'cacamba', cabine:3.66, portas:[[1.36, 2.66], [2.66, 3.52]],
    lugares:[[2.38, 1], [2.38, -1], [3.12, 1], [3.12, -1]]},
  van: {nome:'Van', comp:5.4, larg:2.0, alt:2.4, entre:3.4, balanco:.9, roda:.7, pneu:.22, vao:.2, cintura:1.2,
    base:'longarinas', tracao:'traseira', rodas:['calota', 'aco', 'liga'], cor:'#EDEBE4',
    capo:.74, tetoF:1.36, tetoT:5.28, vidroT:5.34, traseira:'portas_van', portas:[[.74, 2.14]], corredica:[2.18, 3.5],
    lugares:[[1.76, 1], [1.76, -1], [2.9, 1], [2.9, -1], [3.95, 1], [3.95, -1]]},
};
const RODAS = {liga:'Liga leve de 5 raios', esportiva:'Esportiva de raios finos', liga_suv:'Liga de SUV, 6 raios', offroad:'Fora de estrada (com cravos)', aco:'Aço com furos', calota:'Utilitário com calota'};
const ESTADOS_CARRO = {inteiro:'Inteiro', abandonado:'Abandonado', destruido:'Destruído'};

/* cores fixas dos veículos (o prefixo v_ evita choque com as cores dos cenários) */
const CORES_CARRO = {
  v_vidro:'#8FC2DA', v_plastico:'#232529', v_pneu:'#1B1B1E', v_aro:'#C3C8CF', v_aro_preto:'#2C2F34', v_aco:'#8C929A', v_furo:'#111113', v_cromo:'#D8DCE2',
  v_chassi:'#3A3E45', v_longarina:'#24272D', v_piso:'#737A84', v_susp:'#6E747D', v_mola:'#E3A21A', v_amortecedor:'#C0392B', v_disco:'#9AA0A8',
  v_motor:'#7C828B', v_cabecote:'#B8352E', v_cambio:'#5D636C', v_radiador:'#20242A', v_bateria:'#1F3F8F', v_tanque:'#2F3238', v_escape:'#8A8F96',
  v_banco:'#3C332C', v_painel:'#26282D', v_volante:'#151518', v_farol:'#FFF2C2', v_lanterna:'#C4261E', v_seta:'#F2A51A', v_placa:'#EDEDE8',
  v_ferrugem:'#8F4A2A', v_queimado:'#242220', v_poeira:'#9C8A6A',
};
const LISOS_CARRO = ['v_vidro', 'v_farol', 'v_lanterna', 'v_seta', 'v_cromo', 'v_furo'];

/* ================================================================ construção */
function construirCarro(tipo, op = {}){
  const M = CARROS[tipo], estado = op.estado || 'inteiro', estiloRoda = M.rodas.includes(op.roda) ? op.roda : M.rodas[0];
  const F = M.comp / 2, W = M.larg / 2, r = M.roda / 2, L = M.pneu, ra = r + .07, yc = M.cintura;
  const Z = d => F - d;
  const eixoF = Z(M.balanco), eixoT = eixoF - M.entre;
  const yp = M.vao + .14;                                  /* alto do assoalho: o que fica por baixo não passa do vão do solo */
  const yb = M.vao + .05;                                  /* borda de baixo da carroceria */
  const teto = M.rack ? M.alt - .06 : M.alt;               /* o bagageiro cabe dentro da altura */
  const yt = teto - .07;                                   /* forro do teto */
  const partes = new Map();
  const parte = (nome, grupo, pivo = [0, 0, 0], abre = null) => {
    if (!partes.has(nome)) partes.set(nome, {nome, grupo, pivo, abre, caixas:[]});
    const p = partes.get(nome);
    /* caixa por limites: x0..x1, y0..y1, z0..z1 */
    const c = (x0, x1, y0, y1, z0, z1, mat, px = .1) => {
      const [a, b] = x0 < x1 ? [x0, x1] : [x1, x0], [e, f] = y0 < y1 ? [y0, y1] : [y1, y0], [g, h] = z0 < z1 ? [z0, z1] : [z1, z0];
      if (b - a > .001 && f - e > .001 && h - g > .001) p.caixas.push([(a + b) / 2, e, (g + h) / 2, b - a, f - e, h - g, mat, px]);
    };
    c.p = p; return c;
  };
  const lados = [[1, 'e'], [-1, 'd']];                     /* +X = esquerda do motorista */

  /* ---------------------------------------------------------- base: chassi e assoalho */
  const ch = parte('chassi', 'base');
  const xr = W - L - .13;                                  /* meia largura livre entre as rodas */
  const entreF = eixoF - ra - .02, entreT = eixoT + ra + .02;
  ch(-(W - .12), W - .12, yp - .05, yp, entreT, entreF, 'v_piso', .2);              /* assoalho entre os eixos */
  ch(-xr, xr, yp - .05, yp, entreF, Z(M.capo), 'v_piso', .2);
  if (M.traseira !== 'cacamba'){                                                   /* o piso sobe para passar por cima do eixo traseiro; na caçamba o chassi fica aberto */
    const yAlto = r + .15, zDegrau = eixoT + ra * .62;
    ch(-xr, xr, yp - .05, yp, zDegrau, entreT, 'v_piso', .2); ch(-xr, xr, yp - .05, yAlto, zDegrau - .05, zDegrau, 'v_piso', .2); ch(-xr, xr, yAlto - .05, yAlto, Z(M.comp - .18), zDegrau - .05, 'v_piso', .2);
  }
  if (M.base === 'longarinas'){
    for (const s of [-1, 1]){
      ch(s * .36, s * .48, yp - .14, yp - .05, eixoT + .3, eixoF - .3, 'v_longarina');
      for (const [a, b] of [[eixoF - .3, Z(.16)], [Z(M.comp - .16), eixoT + .3]]) ch(s * .36, s * .48, yp - .09, yp + .03, a, b, 'v_longarina');
    }
    for (let z = Z(M.comp - .22); z < Z(.2); z += .72) ch(-.36, .36, yp - .13, yp - .05, z, z + .09, 'v_chassi');
  } else {
    for (const s of [-1, 1]){
      ch(s * (W - .2), s * (W - .12), yp - .13, yp - .05, entreT, entreF, 'v_longarina');      /* soleiras */
      ch(s * .34, s * .44, yp - .12, yp - .05, entreF, Z(.18), 'v_chassi'); ch(s * .34, s * .44, yp - .12, yp - .05, Z(M.comp - .18), entreT, 'v_chassi');
    }
    for (const z of [Z(.2), eixoF - ra - .08, (eixoF + eixoT) / 2, eixoT + ra + .02, Z(M.comp - .26)]) ch(-.44, .44, yp - .1, yp - .05, z, z + .08, 'v_chassi');
    ch(-.11, .11, yp, yp + .07, entreT, entreF, 'v_chassi');                                  /* túnel central */
  }
  ch(-xr, xr, yp, yc - .14, Z(M.capo) - .04, Z(M.capo), 'v_chassi', .15);                     /* parede corta-fogo */

  /* ---------------------------------------------------------- base: suspensão, eixos e freios */
  for (const [nome, ez, frente] of [['suspensao_f', eixoF, true], ['suspensao_t', eixoT, false]]){
    const su = parte(nome, 'base', [0, r, ez]);
    const xHub = W - L - .04;
    for (const s of [-1, 1]){
      su(s * (xHub - .02), s * (xHub + .03), r - r * .46, r + r * .46, ez - r * .46, ez + r * .46, 'v_disco', .06);
      su(s * (xHub - .08), s * (xHub - .02), r - .07, r + .07, ez - .07, ez + .07, 'v_susp');
      su(s * (xHub - .06), s * (xHub - .01), r + .03, r + r * .5, ez + r * .22, ez + r * .46, 'v_amortecedor', .05);   /* pinça de freio */
    }
    const independente = frente;
    const molas = M.base === 'longarinas' || tipo === 'picape_compacta';
    if (independente){
      for (const s of [-1, 1]){
        su(s * .36, s * (xHub - .06), r - .1, r - .05, ez - .12, ez - .06, 'v_susp'); su(s * .36, s * (xHub - .06), r - .1, r - .05, ez + .06, ez + .12, 'v_susp');
        const x = s * (xHub - .15);
        su(x - .025, x + .025, r - .06, r + .36, ez - .025, ez + .025, 'v_amortecedor', .05);
        for (let y = r + .02; y < r + .3; y += .07) su(x - .065, x + .065, y, y + .028, ez - .065, ez + .065, 'v_mola', .05);
        su(s * .3, s * (xHub - .08), r + .05, r + .09, ez + .13, ez + .17, 'v_susp');           /* barra de direção */
      }
      su(-.3, .3, r + .03, r + .1, ez + .13, ez + .18, 'v_cambio');
    } else if (molas){
      su(-(xHub - .06), xHub - .06, r - .045, r + .045, ez - .045, ez + .045, 'v_susp');      /* eixo rígido */
      for (const s of [-1, 1]){
        const x = s * .5;
        for (const [i, meio] of [[0, .46], [1, .34], [2, .22]]) su(x - .035, x + .035, r - .075 - i * .024, r - .053 - i * .024, ez - meio, ez + meio, 'v_mola', .12);
        for (const z of [ez - .46, ez + .46]) su(x - .025, x + .025, r - .07, yp - .05, z - .025, z + .025, 'v_chassi', .05);
        su(s * .56, s * .61, r - .04, yp - .02, ez - .13, ez - .08, 'v_amortecedor', .05);
      }
    } else {
      su(-(xHub - .06), xHub - .06, r - .05, r + .01, ez + .14, ez + .2, 'v_susp');           /* eixo de torção */
      for (const s of [-1, 1]){
        su(s * (xHub - .14), s * (xHub - .06), r - .05, r + .01, ez - .02, ez + .42, 'v_susp');
        const x = s * (xHub - .2);
        su(x - .025, x + .025, r - .02, r + .34, ez - .025, ez + .025, 'v_amortecedor', .05);
        for (let y = r + .05; y < r + .28; y += .07) su(x - .062, x + .062, y, y + .028, ez - .062, ez + .062, 'v_mola', .05);
      }
    }
    const tracionado = (frente && (M.tracao === 'dianteira' || M.tracao === '4x4')) || (!frente && (M.tracao === 'traseira' || M.tracao === '4x4'));
    if (tracionado){
      if (frente || !molas || M.tracao !== 'dianteira') for (const s of [-1, 1]) su(s * .1, s * (xHub - .06), r - .025, r + .025, ez - .025, ez + .025, 'v_aro_preto');
      if (M.tracao !== 'dianteira') for (const [dx, dy, dz] of [[.13, .09, .1], [.09, .12, .1]]) su(-dx, dx, r - dy, r + dy, ez - dz, ez + dz, 'v_cambio', .07);  /* diferencial */
    }
  }

  /* ---------------------------------------------------------- base: motor, câmbio, escapamento, tanque */
  const mo = parte('motor', 'base', [0, r, eixoF]);
  const transversal = M.tracao === 'dianteira';
  const cofreY = Math.max(r + .08, yp + .02), altMotor = Math.min(.3, yc - .16 - cofreY);
  if (transversal){
    mo(-.36, .22, cofreY, cofreY + altMotor * .75, eixoF - .08, eixoF + .24, 'v_motor', .07); mo(-.32, .18, cofreY + altMotor * .75, cofreY + altMotor, eixoF - .03, eixoF + .19, 'v_cabecote', .06);
    mo(.22, .42, cofreY - .04, cofreY + altMotor * .6, eixoF - .06, eixoF + .18, 'v_cambio', .07);
  } else {
    mo(-.2, .2, cofreY, cofreY + altMotor * .75, eixoF - .1, eixoF + .34, 'v_motor', .07); mo(-.15, .15, cofreY + altMotor * .75, cofreY + altMotor, eixoF - .06, eixoF + .3, 'v_cabecote', .06);
    mo(-.12, .12, yp - .02, cofreY + altMotor * .55, eixoF - .42, eixoF - .1, 'v_cambio', .07);
  }
  for (let i = 0; i < 4; i++) mo(-.26 + i * .12, -.2 + i * .12, cofreY + altMotor, cofreY + altMotor + .03, eixoF, eixoF + .14, 'v_cromo');
  mo(-.42, .42, yp - .04, yc - .22, Z(.22), Z(.15), 'v_radiador', .06); mo(-.38, .38, yc - .22, yc - .19, Z(.22), Z(.15), 'v_cromo');
  mo(.45, .45 + Math.min(.2, xr - .47), cofreY + .02, cofreY + .22, eixoF + .28, eixoF + .5, 'v_bateria', .08);
  if (M.tracao !== 'dianteira'){
    const ca = parte('cardan', 'base', [0, r, (eixoF + eixoT) / 2]);
    ca(-.04, .04, yp - .16, yp - .09, eixoT + .1, eixoF - .42, 'v_disco');
    if (M.tracao === '4x4'){ ca(-.15, .15, yp - .14, yp - .05, eixoF - .72, eixoF - .42, 'v_cambio'); ca(.14, .2, yp - .16, yp - .1, eixoF - .45, eixoF - .05, 'v_disco'); }
  }
  const es = parte('escapamento', 'base', [-.26, yp - .1, eixoF - .1]);
  es(-.3, -.23, yp - .12, yp - .06, eixoT + .32, eixoF - .12, 'v_escape'); es(-.5, -.23, yp - .12, yp - .06, eixoT + .25, eixoT + .32, 'v_escape');
  es(-.52, -.45, yp - .12, yp - .06, Z(M.comp - .06), eixoT + .32, 'v_escape'); es(-.6, -.38, yp - .14, yp - .05, Math.max(Z(M.comp - .12), eixoT - ra - .3), eixoT - r * .5, 'v_escape', .08);
  es(-.515, -.455, yp - .11, yp - .07, Z(M.comp - .03), Z(M.comp - .06), 'v_furo');
  const tq = parte('tanque', 'base', [.26, yp - .1, eixoT + .5]);
  tq(.07, .33, yp - .14, yp - .05, eixoT + .3, eixoT + .92, 'v_tanque', .12); tq(.33, W - .22, yp - .1, yp - .05, eixoT + .56, eixoT + .66, 'v_tanque');

  /* ---------------------------------------------------------- interior: bancos, painel, volante */
  const inte = parte('interior', 'interior');
  const assento = yp + .12;
  const lugares = M.lugares.map(([d, lado], i) => ({nome:i === 0 ? 'lugar_motorista' : `lugar_passageiro_${i}`, pos:[lado * .4, assento, Z(d)]}));
  const fileiras = [...new Set(M.lugares.map(l => l[0]))];
  fileiras.forEach((d, i) => {
    const z = Z(d), inteiro = i > 0 && tipo !== 'van';
    const meia = Math.abs(z - .3 - eixoT) < ra + .1 ? Math.min(.73, W - L - .04) : .73;      /* perto da roda o banco é mais estreito */
    for (const [x0, x1] of inteiro ? [[-meia, meia]] : [[.07, meia], [-meia, -.07]]){
      inte(x0, x1, yp, assento, z - .22, z + .24, 'v_banco', .09);
      inte(x0, x1, assento, yc - .06, z - .36, z - .26, 'v_banco', .09);
      if (!inteiro) inte((x0 + x1) / 2 - .16, (x0 + x1) / 2 + .16, yc - .06, yc + .14, z - .37, z - .29, 'v_banco', .08);
    }
  });
  inte(-(W - .14), W - .14, yc - .22, yc - .04, Z(M.capo + .2), Z(M.capo + .05), 'v_painel');
  inte(-.16, .16, yp, yc - .22, Z(M.capo + .18), Z(M.capo + .06), 'v_painel');
  inte(-.05, .05, yp + .07, yp + .24, Z(fileiras[0]) + .22, Z(fileiras[0]) + .3, 'v_volante');   /* alavanca do câmbio */
  const vz = Z(fileiras[0]) + .56, vy = Math.min(yc - .06, assento + .42);
  const vo = parte('volante', 'interior', [.4, vy, vz]);
  for (const [a, b, c2, d2] of [[-.17, .17, .13, .17], [-.17, .17, -.17, -.13], [-.17, -.13, -.13, .13], [.13, .17, -.13, .13], [-.13, .13, -.02, .02]]) vo(.4 + a, .4 + b, vy + c2, vy + d2, vz - .02, vz + .02, 'v_volante', .06);
  vo(.38, .42, vy - .05, vy - .01, vz + .02, Z(M.capo + .2), 'v_volante');

  /* ---------------------------------------------------------- rodas */
  for (const [nomeEixo, ez] of [['f', eixoF], ['t', eixoT]]) for (const [s, lado] of lados){
    const xc = s * (W - L / 2 - .02), nome = `roda_${nomeEixo}${lado}`;
    const ro = parte(nome, 'rodas', [xc, r, ez]);
    const cravos = estiloRoda === 'offroad', rp = cravos ? r - .022 : r;
    const disco = (x0, x1, raio, mat, px = .06) => {
      const n = Math.max(6, Math.round(raio * 2 / .045)), passo = raio * 2 / n;
      for (let i = 0; i < n; i++){
        const dz = -raio + (i + .5) * passo, meia = Math.sqrt(Math.max(0, raio * raio - dz * dz));
        ro(x0, x1, r - meia, r + meia, ez + dz - passo / 2, ez + dz + passo / 2, mat, px);
      }
    };
    disco(xc - L / 2, xc + L / 2, rp, 'v_pneu', .08);
    const face = xc + s * L / 2, camadaX = (a, b) => [face + s * a, face + s * b];
    const raioAro = r * (cravos ? .56 : .66);
    const cubo = (raio, ang, meio, a, b, mat) => { const y = r + Math.sin(ang) * raio, z = ez + Math.cos(ang) * raio; ro(...camadaX(a, b), y - meio, y + meio, z - meio, z + meio, mat, 1); };
    const base = {liga:'v_aro_preto', esportiva:'v_furo', liga_suv:'v_aro_preto', offroad:'v_aro_preto', aco:'v_aco', calota:'v_aco'}[estiloRoda];
    disco(...camadaX(0, .008).sort((a, b) => a - b), raioAro, base);
    for (let i = 0; i < 20; i++) cubo(raioAro - .016, i / 20 * Math.PI * 2, .019, 0, .016, estiloRoda === 'offroad' ? 'v_aco' : 'v_aro');     /* borda do aro */
    const raios = (n, meio, larguraDupla, mat) => { for (let i = 0; i < n; i++) for (const off of larguraDupla ? [-.11, .11] : [0]) for (let k = .2; k <= .86; k += .17) cubo(raioAro * k, i / n * Math.PI * 2 + Math.PI / 2 + off, meio, .008, .022, mat); };
    if (estiloRoda === 'liga') raios(5, .028, false, 'v_aro');
    if (estiloRoda === 'esportiva') raios(10, .015, false, 'v_cromo');
    if (estiloRoda === 'liga_suv') raios(6, .021, true, 'v_aro');
    if (estiloRoda === 'aco') for (let i = 0; i < 8; i++) cubo(raioAro * .6, i / 8 * Math.PI * 2, .028, .008, .014, 'v_furo');
    if (estiloRoda === 'offroad'){
      for (let i = 0; i < 8; i++) cubo(raioAro * .6, i / 8 * Math.PI * 2, .03, .008, .016, 'v_furo');
      for (let i = 0; i < 18; i++){ const a = (i + .5) / 18 * Math.PI * 2, y = r + Math.sin(a) * (r - .026), z = ez + Math.cos(a) * (r - .026); ro(xc - L / 2 - .006, xc + L / 2 + .006, y - .026, y + .026, z - .026, z + .026, 'v_pneu', 1); }
    }
    disco(...camadaX(.008, .03).sort((a, b) => a - b), estiloRoda === 'calota' ? raioAro * .55 : raioAro * .22, estiloRoda === 'calota' ? 'v_cromo' : 'v_aro');
    for (let i = 0; i < 5; i++) cubo(raioAro * (estiloRoda === 'calota' ? .35 : .13), i / 5 * Math.PI * 2, .01, .03, .038, 'v_furo');
  }

  /* ---------------------------------------------------------- carroceria */
  const ca = parte('carroceria', 'carroceria');
  /* perfil da cabine: altura do teto ou dos vidros em cada ponto */
  const topo = d => d <= M.capo ? yc : d < M.tetoF ? yc + (yt - yc) * (d - M.capo) / (M.tetoF - M.capo) : d <= M.tetoT ? yt : d < M.vidroT ? yt - (yt - yc) * (d - M.tetoT) / (M.vidroT - M.tetoT) : yc;
  /* altura mínima da lataria em z, abrindo o arco das rodas */
  const arco = z => { let y = yb; for (const e of [eixoF, eixoT]){ const dz = Math.abs(z - e); if (dz < ra) y = Math.max(y, r + Math.sqrt(ra * ra - dz * dz)); } return Math.round(y / .035) * .035; };
  /* painel lateral entre as distâncias d0 e d1, até a altura y1, recortado nas rodas */
  const lateral = (c, s, d0, d1, y1, mat = 'pintura') => {
    const n = Math.max(1, Math.ceil((d1 - d0) / .05)), passo = (d1 - d0) / n;
    let ini = d0, atual = arco(Z(d0 + passo / 2));
    for (let i = 1; i <= n; i++){
      const prox = i < n ? arco(Z(d0 + (i + .5) * passo)) : null;
      if (prox !== atual){ const fim = d0 + i * passo; c(s * (W - .09), s * W, atual, y1, Z(fim), Z(ini), mat, .16); ini = fim; atual = prox; }
    }
  };
  /* vidro lateral entre d0 e d1, seguindo o perfil, com a moldura em cima */
  const vidroLateral = (c, vid, s, d0, d1) => {
    const n = Math.max(1, Math.ceil((d1 - d0) / .07)), passo = (d1 - d0) / n;
    for (let i = 0; i < n; i++){
      const a = d0 + i * passo, y = topo(a + passo / 2);
      if (y - yc < .05) continue;
      vid(s * (W - .085), s * (W - .055), yc, Math.max(yc + .02, y - .05), Z(a + passo), Z(a), 'v_vidro');
      c(s * (W - .11), s * (W - .045), y - .05, y + .005, Z(a + passo), Z(a), 'pintura');
    }
  };
  const coluna = (c, s, d, larg = .09) => { const y = topo(d); if (y > yc + .05) c(s * (W - .11), s * (W - .04), yc, y, Z(d + larg / 2), Z(d - larg / 2), 'pintura'); };

  /* para-lamas dianteiros e frente */
  const inicioPortas = M.portas[0][0];
  for (const s of [-1, 1]){
    lateral(ca, s, .07, inicioPortas, yc - .02);
    ca(s * (W - .28), s * (W - .09), yc - .09, yc - .02, Z(M.capo), Z(.1), 'pintura', .16);   /* ombro ao lado do capô */
  }
  ca(-(W - .03), W - .03, yc - .34, yc - .09, Z(.14), Z(.07), 'pintura', .14);
  ca(-(W - .09), W - .09, yb + .12, yc - .34, Z(.14), Z(.08), 'v_plastico');
  const fr = parte('farois', 'carroceria', [0, yc - .22, Z(.06)]);
  const grade = parte('grade', 'carroceria', [0, yc - .24, Z(.06)]);
  grade(-(W - .52), W - .52, yc - .32, yc - .14, Z(.07), Z(.05), 'v_radiador', .06);
  for (let y = yc - .3; y < yc - .15; y += .05) grade(-(W - .54), W - .54, y, y + .018, Z(.05), Z(.035), 'v_cromo');
  for (const s of [-1, 1]){
    fr(s * (W - .46), s * (W - .14), yc - .27, yc - .14, Z(.07), Z(.035), 'v_farol');
    fr(s * (W - .14), s * (W - .05), yc - .27, yc - .14, Z(.07), Z(.04), 'v_seta');
  }
  const pf = parte('parachoque_f', 'carroceria', [0, yb + .1, Z(.05)]);
  pf(-(W - .01), W - .01, yb + .04, yb + .24, Z(.1), Z(0), 'v_plastico', .12); pf(-.18, .18, yb + .1, yb + .19, Z(.012), Z(-.008), 'v_placa', .3);

  const capo = parte('capo', 'carroceria', [0, yc - .05, Z(M.capo - .01)], {eixo:'x', ang:-.75});
  capo(-(W - .28), W - .28, yc - .09, yc - .025, Z(M.capo - .01), Z(.1), 'pintura', .16);
  for (const s of [-1, 1]) capo(s * .3, s * .36, yc - .025, yc - .01, Z(M.capo - .08), Z(.2), 'pintura_sombra', .16);

  /* para-brisa em degraus */
  const pb = parte('parabrisa', 'carroceria', [0, yc, Z(M.capo)]);
  for (let i = 0; i < 12; i++){
    const a = M.capo + (M.tetoF - M.capo) * i / 12, b = M.capo + (M.tetoF - M.capo) * (i + 1) / 12;
    pb(-(W - .12), W - .12, topo(a), topo(b) + .008, Z(b), Z(a), 'v_vidro');
    for (const s of [-1, 1]) ca(s * (W - .12), s * (W - .05), topo(a), topo(b) + .03, Z(b + .02), Z(a), 'pintura');
  }
  /* teto */
  ca(-(W - .06), W - .06, yt, teto, Z(M.tetoT), Z(M.tetoF - .02), 'pintura', .2);
  if (M.rack){
    for (const s of [-1, 1]){ ca(s * (W - .3), s * (W - .24), teto + .025, M.alt, Z(M.tetoT - .15), Z(M.tetoF + .25), 'v_plastico'); for (const d of [M.tetoF + .3, M.tetoT - .22]) ca(s * (W - .3), s * (W - .24), teto, teto + .025, Z(d + .06), Z(d), 'v_plastico'); }
    for (const d of [M.tetoF + .7, M.tetoT - .65]) ca(-(W - .24), W - .24, teto + .025, M.alt - .01, Z(d + .06), Z(d), 'v_plastico');
  }

  /* portas, com maçaneta, vidro e retrovisor */
  M.portas.forEach(([d0, d1], i) => {
    for (const [s, lado] of lados){
      const nome = `porta_${i === 0 ? 'f' : 't'}${lado}`;
      const po = parte(nome, 'carroceria', [s * (W - .05), yb, Z(d0 + .01)], {eixo:'y', ang:-s * 1.05});
      lateral(po, s, d0 + .012, d1 - .012, yc - .005);
      po(s * W, s * (W + .012), yc - .13, yc - .095, Z(d1 - .09), Z(d1 - .25), 'v_cromo');
      vidroLateral(po, po, s, d0 + .05, d1 - .05);
      coluna(po, s, d0 + .035, .05); coluna(po, s, d1 - .035, .05);
      if (i === 0){ po(s * W, s * (W + .08), yc + .02, yc + .06, Z(d0 + .27), Z(d0 + .2), 'v_plastico'); po(s * (W + .08), s * (W + .16), yc - .01, yc + .15, Z(d0 + .3), Z(d0 + .17), 'pintura', .06); po(s * (W + .095), s * (W + .145), yc + .01, yc + .13, Z(d0 + .31), Z(d0 + .3), 'v_vidro'); }
    }
  });
  for (const s of [-1, 1]){
    ca(s * (W - .14), s * (W - .02), yb, yb + .09, Math.max(entreT, Z(M.portas.at(-1)[1])), Math.min(entreF, Z(inicioPortas)), 'v_plastico');   /* soleira */
    for (const [, d1] of M.portas) coluna(ca, s, d1, .06);
  }
  const fimPortas = M.portas.at(-1)[1];
  const vidros = parte('vidros', 'carroceria');
  const lanternas = parte('lanternas', 'carroceria', [0, yc - .2, Z(M.comp - .06)]);
  const pt = parte('parachoque_t', 'carroceria', [0, yb + .1, Z(M.comp - .05)]);
  pt(-(W - .01), W - .01, yb + .04, yb + .22, Z(M.comp), Z(M.comp - .1), 'v_plastico', .12); pt(-.18, .18, yb + .1, yb + .18, Z(M.comp + .008), Z(M.comp - .012), 'v_placa', .3);

  if (M.traseira === 'portamalas'){
    for (const s of [-1, 1]){
      lateral(ca, s, fimPortas, M.comp - .07, yc - .02);
      vidroLateral(ca, vidros, s, fimPortas + .03, M.vidroT - .06); coluna(ca, s, M.tetoT + .05, .12);
      ca(s * (W - .26), s * (W - .09), yc - .09, yc - .02, Z(M.comp - .09), Z(M.vidroT), 'pintura', .16);
      lanternas(s * (W - .42), s * (W - .06), yc - .24, yc - .1, Z(M.comp - .035), Z(M.comp - .075), 'v_lanterna');
    }
    for (let i = 0; i < 10; i++){ const a = M.tetoT + (M.vidroT - M.tetoT) * i / 10, b = a + (M.vidroT - M.tetoT) / 10; vidros(-(W - .13), W - .13, topo(b), topo(a) + .008, Z(b), Z(a), 'v_vidro'); }
    ca(-(W - .09), W - .09, yb + .2, yc - .09, Z(M.comp - .07), Z(M.comp - .12), 'pintura', .14);
    const tm = parte('tampa_traseira', 'carroceria', [0, yc - .05, Z(M.vidroT)], {eixo:'x', ang:.8});
    tm(-(W - .26), W - .26, yc - .09, yc - .025, Z(M.comp - .07), Z(M.vidroT), 'pintura', .16);
  }
  if (M.traseira === 'tampao'){
    for (const s of [-1, 1]){
      lateral(ca, s, fimPortas, M.comp - .07, yc - .005);
      vidroLateral(ca, vidros, s, fimPortas + .04, M.vidroT - .02); coluna(ca, s, M.tetoT - .02, .1);
      lanternas(s * (W - .18), s * (W - .02), yc - .3, yc + .02, Z(M.comp - .035), Z(M.comp - .09), 'v_lanterna');
    }
    const tm = parte('tampa_traseira', 'carroceria', [0, yt, Z(M.tetoT)], {eixo:'x', ang:1.2});
    tm(-(W - .18), W - .18, yb + .22, yc, Z(M.comp - .06), Z(M.comp - .13), 'pintura', .14);
    for (let i = 0; i < 10; i++){ const a = M.tetoT + (M.vidroT - M.tetoT) * i / 10, b = a + (M.vidroT - M.tetoT) / 10; tm(-(W - .18), W - .18, Math.max(yc, topo(b)), topo(a) + .012, Z(b), Z(a), 'v_vidro'); }
    tm(-(W - .18), W - .18, yc, yc + .05, Z(M.comp - .06), Z(M.vidroT - .02), 'pintura');
    tm(-.12, .12, yc - .15, yc - .11, Z(M.comp - .045), Z(M.comp - .06), 'v_cromo');
    if (tipo === 'suv_grande'){ const e = parte('estepe', 'carroceria', [0, yc - .2, Z(M.comp - .03)]); for (const [a, b] of [[.26, .14], [.14, .26], [.22, .22]]) e(-a, a, yc - .22 - b, yc - .22 + b, Z(M.comp + .0), Z(M.comp - .06), 'v_pneu'); e(-.1, .1, yc - .32, yc - .12, Z(M.comp + .012), Z(M.comp), 'v_aro'); }
  }
  if (M.traseira === 'cacamba'){
    const dCab = M.cabine, fundo = M.roda + .03;
    for (const s of [-1, 1]){
      if (dCab - fimPortas > .03){ lateral(ca, s, fimPortas, dCab, yc - .005); vidroLateral(ca, vidros, s, fimPortas + .02, M.vidroT - .02); }
      coluna(ca, s, M.tetoT + .02, .1);
    }
    ca(-(W - .09), W - .09, yp, yc, Z(dCab), Z(dCab - .06), 'pintura', .16);                    /* parede de trás da cabine */
    for (let i = 0; i < 6; i++){ const a = M.tetoT + (M.vidroT - M.tetoT) * i / 6, b = a + (M.vidroT - M.tetoT) / 6; vidros(-(W - .2), W - .2, Math.max(yc, topo(b)), topo(a) + .008, Z(b), Z(a), 'v_vidro'); }
    ca(-(W - .09), W - .09, yc - .03, yc + .02, Z(M.vidroT + .02), Z(M.tetoT), 'pintura');
    ca(-(W - .09), W - .09, yb + .2, fundo - .02, Z(M.comp - .08), Z(M.comp - .13), 'pintura', .16);   /* painel de trás, sob a tampa */
    const cb = parte('cacamba', 'carroceria', [0, fundo, Z((dCab + M.comp) / 2)]);
    cb(-(W - .09), W - .09, fundo, fundo + .05, Z(M.comp - .1), Z(dCab + .04), 'v_plastico', .14);
    for (let x = -(W - .2); x < W - .18; x += .16) cb(x, x + .06, fundo + .05, fundo + .065, Z(M.comp - .12), Z(dCab + .06), 'v_chassi', .2);
    cb(-(W - .09), W - .09, fundo + .05, yc - .02, Z(dCab + .1), Z(dCab + .04), 'pintura', .16);
    for (const s of [-1, 1]){
      lateral(cb, s, dCab + .02, M.comp - .1, yc);
      cb(s * (W - .13), s * (W + .005), yc, yc + .045, Z(M.comp - .1), Z(dCab + .02), 'v_plastico');
      lanternas(s * (W - .13), s * W, yc - .36, yc - .02, Z(M.comp - .035), Z(M.comp - .1), 'v_lanterna');
    }
    const tm = parte('tampa_traseira', 'carroceria', [0, fundo, Z(M.comp - .1)], {eixo:'x', ang:-1.55});
    tm(-(W - .13), W - .13, fundo - .02, yc + .02, Z(M.comp - .05), Z(M.comp - .1), 'pintura', .14);
    tm(-.14, .14, yc - .12, yc - .07, Z(M.comp - .035), Z(M.comp - .05), 'v_plastico');
  }
  if (M.traseira === 'portas_van'){
    const [c0, c1] = M.corredica;
    for (const [s, lado] of lados){
      /* trecho entre a porta da frente e o vão de trás */
      const pedacos = [[fimPortas, c0], [c1, M.comp - .07]];
      if (s > 0) pedacos.splice(1, 0, [c0, c1]);
      for (const [a, b] of pedacos){ lateral(ca, s, a, b, yc - .005); vidroLateral(ca, vidros, s, a + .04, Math.min(b, M.tetoT) - .04); coluna(ca, s, a + .01, .09); }
      coluna(ca, s, M.tetoT - .04, .1);
      ca(s * (W - .09), s * (W - .02), yt - .12, teto - .02, Z(M.tetoT), Z(M.tetoF), 'pintura', .2);
      lanternas(s * (W - .11), s * (W - .01), yc - .1, yc + .45, Z(M.comp - .035), Z(M.comp - .09), 'v_lanterna');
    }
    const co = parte('porta_corredica', 'carroceria', [-(W - .05), yb, Z((c0 + c1) / 2)], {desliza:[-.13, 0, -(c1 - c0) + .06]});
    lateral(co, -1, c0 + .012, c1 - .012, yc - .005); vidroLateral(co, co, -1, c0 + .05, c1 - .05); coluna(co, -1, c0 + .04, .05); coluna(co, -1, c1 - .04, .05);
    co(-(W + .012), -W, yc - .14, yc - .09, Z(c0 + .28), Z(c0 + .1), 'v_cromo');
    co.p.caixas.push([-(W + .008), yc - .02, Z((c0 + c1) / 2 + .35), .016, .035, c1 - c0 + .6, 'v_plastico', .3]);
    for (const [s, lado] of lados){
      const pv = parte(`porta_traseira_${lado}`, 'carroceria', [s * (W - .08), yb, Z(M.comp - .08)], {eixo:'y', ang:-s * 1.9});
      pv(s * .008, s * (W - .11), yb + .18, yc, Z(M.comp - .05), Z(M.comp - .11), 'pintura', .16);
      pv(s * .08, s * (W - .2), yc, yt - .18, Z(M.comp - .065), Z(M.comp - .095), 'v_vidro');
      for (const [a, b] of [[.008, .08], [W - .2, W - .11]]) pv(s * a, s * b, yc, yt - .12, Z(M.comp - .05), Z(M.comp - .11), 'pintura');
      pv(s * .008, s * (W - .11), yt - .18, yt + .01, Z(M.comp - .05), Z(M.comp - .11), 'pintura');
      pv(s * .03, s * .07, yc - .18, yc - .04, Z(M.comp - .035), Z(M.comp - .05), 'v_cromo');
    }
  }

  /* para-lamas internos, molduras dos arcos e estribos */
  for (const e of [eixoF, eixoT]) for (const s of [-1, 1]){
    ca(s * (W - L - .1), s * (W - .09), r + ra + .012, r + ra + .045, e - ra * .62, e + ra * .62, 'v_plastico');
    if (M.molduras) for (let i = 0; i <= 24; i++){
      const a = i / 24 * Math.PI, y = r + Math.sin(a) * (ra + .035), z = e + Math.cos(a) * (ra + .035);
      if (y > yb + .02) ca(s * (W - .01), s * (W + .028), y - .042, y + .042, z - .042, z + .042, 'v_plastico', .1);
    }
  }
  if (M.estribo) for (const s of [-1, 1]){ const es2 = parte(`estribo_${s > 0 ? 'e' : 'd'}`, 'carroceria', [s * W, yb, (entreF + entreT) / 2]); es2(s * (W - .06), s * (W + .1), yb - .05, yb, entreT, entreF, 'v_plastico', .12); }

  const carro = {tipo, medidas:M, estado, roda:estiloRoda, partes:[...partes.values()].filter(p => p.caixas.length), lugares, eixos:[eixoF, eixoT], assento, forro:yt, yp};
  if (estado !== 'inteiro') envelhecer(carro, estado === 'destruido');
  return carro;
}

/* abandonado: ferrugem, poeira, um pneu murcho e vidros faltando; destruído: queimado, sem roda e sem vidros */
function envelhecer(carro, destruido){
  const sorte = (txt) => ruido(`${carro.tipo}|${txt}`);
  carro.partes = carro.partes.filter(p => !(destruido && ['roda_fd', 'parachoque_f', 'capo', 'farois'].includes(p.nome)));
  for (const p of carro.partes){
    if (p.grupo !== 'carroceria') continue;
    p.caixas = p.caixas.filter((c, i) => !(c[6] === 'v_vidro' && sorte(`${p.nome}|v${i >> 2}`) < (destruido ? 88 : 30)));
    const extras = [];
    p.caixas.forEach((c, i) => {
      const [x, y, z, w, h, d, mat] = c;
      if (!/^(pintura|v_pmpint)/.test(mat)) return;
      if (destruido && sorte(`${p.nome}|q${Math.floor(z * 2)},${Math.floor(y * 3)}`) < 62) c[6] = sorte(`${p.nome}|q2${i}`) < 70 ? 'v_queimado' : 'v_ferrugem';
      for (let k = 0; k < 2; k++){
        const n = sorte(`${p.nome}|f${i}|${k}`);
        if (n > (destruido ? 70 : 42)) continue;
        const fino = [w, h, d].indexOf(Math.min(w, h, d)), tam = [w, h, d].map((v, e) => e === fino ? v + .006 : Math.min(v * .6, .09 + (n % 5) * .035));
        const desvio = e => e === fino ? 0 : (([w, h, d][e] - tam[e]) * ((sorte(`${p.nome}|p${i}|${k}|${e}`) - 50) / 100));
        extras.push([x + desvio(0), y + (h - tam[1]) / 2 + desvio(1), z + desvio(2), ...tam, n % 3 ? 'v_ferrugem' : 'v_poeira', .07]);
      }
    });
    p.caixas.push(...extras);
  }
  const murcha = carro.partes.find(p => p.nome === 'roda_te');
  if (murcha) for (const c of murcha.caixas){ const baixo = c[1], alto = c[1] + c[4]; const corte = .07; c[1] = Math.max(0, baixo - corte); c[4] = Math.max(.02, Math.max(corte / 2, alto - corte) - c[1]); }
}

/* ================================================================ quadriláteros (para o visor e a exportação) */
function paletaCarro(cor){
  const base = {...CORES_CARRO, pintura:cor};
  return nome => {
    if (base[nome]) return base[nome];
    const m = /^(.*)_(sombra|escuro|claro)$/.exec(nome);
    if (!m || !base[m[1]]) return '#FF00FF';
    return (base[nome] = m[2] === 'sombra' ? tom(base[m[1]], .84) : m[2] === 'escuro' ? tom(base[m[1]], .64) : misto(base[m[1]], '#FFFFFF', .17));
  };
}
const FACES_CARRO = [[[-1,0,0], [[0,0,0],[0,0,1],[0,1,1],[0,1,0]]], [[1,0,0], [[1,0,1],[1,0,0],[1,1,0],[1,1,1]]],
  [[0,-1,0], [[0,0,0],[1,0,0],[1,0,1],[0,0,1]]], [[0,1,0], [[0,1,1],[1,1,1],[1,1,0],[0,1,0]]],
  [[0,0,-1], [[1,0,0],[0,0,0],[0,1,0],[1,1,0]]], [[0,0,1], [[0,0,1],[1,0,1],[1,1,1],[0,1,1]]]];
/* junta tons quase iguais, para o arquivo 3D não ficar com milhares de materiais */
const arredonda = c => hex(rgb(c).map(v => Math.round(v / 9) * 9));
function quadsDaParte(parte, cor){
  const pega = paletaCarro(cor), lisos = new Set(LISOS_CARRO), quads = [];
  parte.caixas.forEach(([x, y, z, w, h, d, mat, px], id) => {
    if (parte.ferrugem && px < 1 && forcaDaFerrugem(mat)) px = Math.min(px, .085);       /* pixels menores deixam a ferrugem aparecer */
    const base = pega(mat), liso = lisos.has(mat), vidro = mat === 'v_vidro', min = [x - w / 2, y, z - d / 2], tam = [w, h, d];
    const fino = tam.indexOf(Math.min(...tam));      /* no vidro só entram as duas faces largas, senão as emendas aparecem como riscos */
    for (const [n, cantos] of FACES_CARRO){
      if (vidro && !n[fino]) continue;
      const P = cantos.map(c => c.map((v, i) => min[i] + v * tam[i]));
      const comp = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      const nu = liso || px >= 1 ? 1 : Math.max(1, Math.min(24, Math.round(comp(P[0], P[1]) / px))), nv = liso || px >= 1 ? 1 : Math.max(1, Math.min(24, Math.round(comp(P[0], P[3]) / px)));
      const meio = (a, b, t) => [0, 1, 2].map(i => a[i] + (b[i] - a[i]) * t);
      const em = (s, t) => meio(meio(P[0], P[1], s), meio(P[3], P[2], s), t);
      for (let u = 0; u < nu; u++) for (let v = 0; v < nv; v++){
        let c = base;
        if (!liso){ const k = ruido(`${parte.nome}|${id}|${n}|${u},${v}`); if (k >= 62) c = tom(base, k < 82 ? .955 : 1.045); }
        if (parte.ferrugem) c = arredonda(enferrujar(c, mat, em((u + .5) / nu, (v + .5) / nv), n, parte.ferrugem, parte.semente));
        quads.push({v:[em(u / nu, v / nv), em((u + 1) / nu, v / nv), em((u + 1) / nu, (v + 1) / nv), em(u / nu, (v + 1) / nv)], n, cor:c, vidro});
      }
    }
  });
  return quads;
}
/* abre ou fecha: devolve a função que leva um ponto da parte para a posição aberta */
function movimento(parte, aberto){
  const a = parte.abre;
  if (!aberto || !a) return {ponto:v => v, normal:n => n, q:[0, 0, 0, 1], desvio:[0, 0, 0]};
  if (a.desliza) return {ponto:v => soma(v, a.desliza), normal:n => n, q:[0, 0, 0, 1], desvio:a.desliza};
  const meio = a.ang / 2, q = a.eixo === 'x' ? [Math.sin(meio), 0, 0, Math.cos(meio)] : [0, Math.sin(meio), 0, Math.cos(meio)];
  return {ponto:v => soma(parte.pivo, girar(q, menos(v, parte.pivo))), normal:n => girar(q, n), q, desvio:[0, 0, 0]};
}

/* ---------------------------------------------------------------- personagem sentado */
ANGULOS.dirigindo = {coxa_d:[-1.62, 0, 0], coxa_e:[-1.62, 0, 0], canela_d:[.75, 0, 0], canela_e:[.75, 0, 0], braco_d:[-.5, 0, 0], braco_e:[-.5, 0, 0], antebraco_d:[-.85, 0, 0], antebraco_e:[-.85, 0, 0]};
/* mochila, escudo, tonfa e lápis não cabem no banco */
function personagemNoBanco(config, lugar){
  const c = structuredClone(config);
  c.mochila.estilo = 'nenhum'; c.lapis.usa = false; if (c.escudo) c.escudo.usa = false; if (c.tonfa) c.tonfa.usa = false;
  const quads = posar(montar(c), 'dirigindo').quads;
  let base = 1e9; for (const q of quads) if (q.peca === 'quadril') for (const v of q.v) base = Math.min(base, v[1]);
  const d = [lugar.pos[0], lugar.pos[1] - base, lugar.pos[2]];
  for (const q of quads) q.v = q.v.map(v => soma(v, d));
  return quads;
}

/* ================================================================ exportação: GLB com peças separadas e pontos de giro */
function gerarGLBCarro(carro, cor, op = {}){
  const grupos = op.grupos || ['base', 'interior', 'rodas', 'carroceria'];
  const gltf = {asset:{version:'2.0', generator:'Garagem WO'}, scene:0, scenes:[{nodes:[0]}], nodes:[{name:carro.duasRodas ? carro.tipo : `carro_${carro.tipo}`, children:[]}], meshes:[], materials:[], accessors:[], bufferViews:[], buffers:[]};
  const blocos = [], mats = new Map(); let tamanho = 0;
  const material = (c, vidro) => {
    const chave = c + (vidro ? 'v' : '');
    if (!mats.has(chave)){
      mats.set(chave, gltf.materials.length);
      gltf.materials.push({name:(vidro ? 'vidro_' : 'cor_') + c.slice(1), ...(vidro ? {alphaMode:'BLEND', doubleSided:true} : {}),
        pbrMetallicRoughness:{baseColorFactor:[...rgb(c).map(linear), vidro ? .38 : 1], metallicFactor:0, roughnessFactor:vidro ? .15 : 1}});
    }
    return mats.get(chave);
  };
  const acessor = (dados, tipo, comp, alvo, extra = {}) => {
    const bytes = new Uint8Array(dados.buffer);
    gltf.bufferViews.push({buffer:0, byteOffset:tamanho, byteLength:bytes.length, target:alvo});
    blocos.push(bytes); tamanho += bytes.length;
    const resto = (4 - tamanho % 4) % 4; if (resto){ blocos.push(new Uint8Array(resto)); tamanho += resto; }
    gltf.accessors.push(Object.assign({bufferView:gltf.bufferViews.length - 1, componentType:comp, count:dados.length / (tipo === 'VEC3' ? 3 : 1), type:tipo}, extra));
    return gltf.accessors.length - 1;
  };
  for (const p of carro.partes){
    if (!grupos.includes(p.grupo)) continue;
    const porCor = new Map();
    for (const q of quadsDaParte(p, cor)){ const k = q.cor + (q.vidro ? '|v' : ''); if (!porCor.has(k)) porCor.set(k, []); porCor.get(k).push(q); }
    const primitivas = [];
    for (const quads of porCor.values()){
      const pos = new Float32Array(quads.length * 12), nor = new Float32Array(quads.length * 12), ind = new Uint32Array(quads.length * 6);
      const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
      quads.forEach((q, i) => { q.v.forEach((v, j) => { pos.set(menos(v, p.pivo), i * 12 + j * 3); nor.set(q.n, i * 12 + j * 3); }); ind.set([0, 1, 2, 0, 2, 3].map(x => i * 4 + x), i * 6); });
      for (let i = 0; i < pos.length; i++){ lo[i % 3] = Math.min(lo[i % 3], pos[i]); hi[i % 3] = Math.max(hi[i % 3], pos[i]); }
      primitivas.push({attributes:{POSITION:acessor(pos, 'VEC3', 5126, 34962, {min:lo, max:hi}), NORMAL:acessor(nor, 'VEC3', 5126, 34962)}, indices:acessor(ind, 'SCALAR', 5125, 34963), material:material(quads[0].cor, quads[0].vidro)});
    }
    gltf.meshes.push({name:p.nome, primitives:primitivas});
    const m = movimento(p, op.aberto);
    gltf.nodes[0].children.push(gltf.nodes.length);
    gltf.nodes.push({name:p.nome, mesh:gltf.meshes.length - 1, translation:soma(p.pivo, m.desvio), rotation:m.q});
  }
  if (grupos.includes('interior')) for (const l of carro.lugares){ gltf.nodes[0].children.push(gltf.nodes.length); gltf.nodes.push({name:l.nome, translation:l.pos}); }
  gltf.buffers.push({byteLength:tamanho});
  let json = new TextEncoder().encode(JSON.stringify(gltf));
  const falta = (4 - json.length % 4) % 4;
  if (falta){ const j = new Uint8Array(json.length + falta).fill(32); j.set(json); json = j; }
  const total = 12 + 8 + json.length + 8 + tamanho, saida = new Uint8Array(total), dv = new DataView(saida.buffer);
  dv.setUint32(0, 0x46546C67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true);
  dv.setUint32(12, json.length, true); dv.setUint32(16, 0x4E4F534A, true); saida.set(json, 20);
  let o = 20 + json.length; dv.setUint32(o, tamanho, true); dv.setUint32(o + 4, 0x004E4942, true); o += 8;
  for (const b of blocos){ saida.set(b, o); o += b.length; }
  return saida;
}

/* ================================================================ no montador de cenários (quando a biblioteca estiver carregada) */
if (typeof BIBLIOTECA !== 'undefined'){
  const CAT = 'Carros do padrão';
  BIBLIOTECA.CATEGORIAS.push(CAT);
  Object.assign(BIBLIOTECA.FIXAS, CORES_CARRO);
  for (const m of LISOS_CARRO) BIBLIOTECA.LISOS.add(m);
  for (const [tipo, M] of Object.entries(CARROS)) for (const [estado, nomeEstado] of Object.entries(ESTADOS_CARRO)){
    const id = `carro_${tipo}_${estado}`;
    BIBLIOTECA.ITENS[id] = {id, nome:estado === 'inteiro' ? M.nome : `${M.nome}: ${nomeEstado.toLowerCase()}`, cat:CAT, cores:{pintura:['Pintura', M.cor]},
      desenhar(g){ for (const p of construirCarro(tipo, {estado}).partes) for (const caixa of p.caixas) g.b(...caixa); }};
  }
}