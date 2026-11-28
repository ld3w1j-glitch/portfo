/* Viaturas da PM montadas sobre os carros do padrão (veiculos.js). Carregar depois de veiculos.js e policia.js.
   Pinturas baseadas em fotos públicas, sem brasão, prefixos ou placas reais. As funções por tipo são propostas para o jogo. */
const PINTURAS_VIATURA = {nova:'Nova (cáqui e preta)', antiga:'Antiga (branca com faixas)'};
const FUNCOES_VIATURA = {radiopatrulha:'Radiopatrulha', tatico:'Tático (com quebra-mato)', rocca:'ROCCA (transporte de cães)', cela:'Compartimento fechado', choque:'Transporte de tropa'};
const FUNCOES_DE = {sedan:['radiopatrulha'], suv_compacto:['radiopatrulha', 'tatico'], suv_grande:['tatico', 'radiopatrulha', 'rocca'],
  picape_compacta:['radiopatrulha', 'cela', 'rocca'], picape_media:['tatico', 'radiopatrulha', 'cela', 'rocca'], van:['radiopatrulha', 'choque']};
const LUZES_VIATURA = {azul:'Azul (patrulhamento)', vermelha:'Vermelha (emergência)', apagada:'Apagada'};

Object.assign(LETRAS_PM, {H:['101', '101', '111', '101', '101'], Q:['111', '101', '101', '111', '001'], U:['101', '101', '101', '101', '111'],
  1:['010', '110', '010', '010', '111'], 9:['111', '101', '111', '001', '111'], 0:['111', '101', '101', '101', '111']});
Object.assign(CORES_CARRO, {v_pmpint_caqui:'#B49C6C', v_pmpint_preto:'#17181B', v_pmpint_branco:'#EDECE6', v_pm_letra:'#101113', v_pm_letra_clara:'#F1F1EC',
  v_pm_vermelho:'#C4261E', v_pm_azul:'#2455B5', v_pm_amarelo:'#EFB31F', v_pm_azul_on:'#2F7BFF', v_pm_azul_off:'#1B335E', v_pm_vm_on:'#FF3B30', v_pm_vm_off:'#5E1D1A',
  v_pm_branco_on:'#F4F8FF', v_pm_branco_off:'#8A9098', v_pm_grade:'#0E0F11', v_pm_pelo:'#A97440', v_pm_pelo_escuro:'#2A1E16'});
const LISOS_VIATURA = ['v_pm_letra', 'v_pm_letra_clara', 'v_pm_vermelho', 'v_pm_azul', 'v_pm_amarelo', 'v_pm_azul_on', 'v_pm_azul_off', 'v_pm_vm_on', 'v_pm_vm_off', 'v_pm_branco_on', 'v_pm_branco_off'];
LISOS_CARRO.push(...LISOS_VIATURA);

function equiparViatura(carro, op){
  const tipo = carro.tipo, M = carro.medidas, nova = op.viatura !== 'antiga';
  const funcao = FUNCOES_DE[tipo].includes(op.funcao) ? op.funcao : FUNCOES_DE[tipo][0];
  const luz = LUZES_VIATURA[op.luz] ? op.luz : 'azul';
  const F = M.comp / 2, W = M.larg / 2, r = M.roda / 2, ra = r + .07, yc = M.cintura, yb = M.vao + .05, yt = carro.forro, Z = d => F - d;
  const [eixoF, eixoT] = carro.eixos, dEixoF = F - eixoF, dEixoT = F - eixoT;
  const picape = M.traseira === 'cacamba';
  const achar = nome => carro.partes.find(p => p.nome === nome);
  const parte = (nome, grupo = 'carroceria', pivo = [0, 0, 0], abre = null) => {
    let p = achar(nome);
    if (!p){ p = {nome, grupo, pivo, abre, caixas:[]}; carro.partes.push(p); }
    const c = (x0, x1, y0, y1, z0, z1, mat, px = .12) => {
      const a = Math.min(x0, x1), b = Math.max(x0, x1), e = Math.min(y0, y1), f = Math.max(y0, y1), g = Math.min(z0, z1), h = Math.max(z0, z1);
      if (b - a > .001 && f - e > .001 && h - g > .001) p.caixas.push([(a + b) / 2, e, (g + h) / 2, b - a, f - e, h - g, mat, px]);
    };
    c.p = p; return c;
  };

  /* ---------------------------------------------------------- pintura */
  carro.partes = carro.partes.filter(p => p.nome !== 'estepe');
  const capo = achar('capo'); capo.caixas = capo.caixas.filter(c => c[6] !== 'pintura_sombra');
  for (const p of carro.partes) for (const c of p.caixas){
    if (!c[6].startsWith('pintura')) continue;
    c[6] = !nova ? 'v_pmpint_branco' : (p.nome === 'capo' || c[1] >= yc - .1) ? 'v_pmpint_preto' : 'v_pmpint_caqui';      /* em cima preto, lataria cáqui */
  }
  const corBaixa = nova ? 'v_pmpint_caqui' : 'v_pmpint_branco', corAlta = nova ? 'v_pmpint_preto' : 'v_pmpint_branco';

  /* que parte da lateral fica na distância d: assim as letras acompanham as portas quando abrem */
  const parteDaLateral = (s, d) => {
    if (M.corredica && s < 0 && d > M.corredica[0] && d < M.corredica[1]) return 'porta_corredica';
    const i = M.portas.findIndex(([a, b]) => d >= a && d <= b);
    if (i >= 0) return `porta_${i === 0 ? 'f' : 't'}${s > 0 ? 'e' : 'd'}`;
    return picape && d > M.cabine ? 'cacamba' : 'carroceria';
  };
  /* retângulo colado na lateral, repartido nas emendas das portas */
  const naLateral = (s, d0, d1, y0, y1, mat, saida = .012) => {
    const cortes = [d0, d1, ...M.portas.flat(), ...(M.corredica || []), ...(picape ? [M.cabine] : [])].filter(v => v >= d0 && v <= d1).sort((a, b) => a - b);
    for (let i = 0; i + 1 < cortes.length; i++){
      const a = cortes[i], b = cortes[i + 1]; if (b - a < .004) continue;
      parte(parteDaLateral(s, (a + b) / 2))(s * (W - .004), s * (W + saida), y0, y1, Z(b), Z(a), mat, 1);
    }
  };
  /* texto na lateral, centrado na distância dc; a leitura fica certa dos dois lados */
  const textoLateral = (s, txt, t, dc, y, mat, saida = .02) => escrevePm(txt, t, (u0, u1, v0, v1) => {
    const a = s > 0 ? dc + u0 : dc - u1, b = s > 0 ? dc + u1 : dc - u0;
    naLateral(s, a, b, y + v0, y + v1, mat, saida);
  });

  /* ---------------------------------------------------------- letras e faixas laterais */
  const de = Math.max(M.portas[0][0], dEixoF + ra) + .04;
  const ate = Math.min(M.corredica ? M.corredica[1] + .5 : picape ? M.comp - .15 : M.portas.at(-1)[1] + .1, dEixoT - ra - .04);
  const [d0, d1] = M.corredica ? [M.corredica[0] + .02, dEixoT - ra - .06] : [de, picape && ate - de < 1.1 ? M.cabine - .04 : ate];
  const t = Math.min(.052, (d1 - d0) / 28), meio = (d0 + d1) / 2;
  const yPolicia = yc - .19 - 5 * t;
  const traseiraLivre = dEixoT + ra + .03;
  for (const s of [-1, 1]){
    if (nova){
      textoLateral(s, 'POLICIA', t, meio, yPolicia, 'v_pm_letra');
      naLateral(s, meio + 1.15 * t, meio + 2.1 * t, yPolicia + 5.3 * t, yPolicia + 5.9 * t, 'v_pm_letra', .02);      /* acento */
      textoLateral(s, 'MILITAR', t * .55, meio + t * 5, yPolicia - 6.5 * t * .55, 'v_pm_letra');
      /* faixas pretas inclinadas atrás da roda de trás */
      const largura = M.comp - .13 - traseiraLivre;
      if (largura > .22) for (let n = 0; n < 3; n++) for (let i = 0; i < 6; i++){
        const a = traseiraLivre + .02 + n * largura / 3.4 + (5 - i) * .022;
        naLateral(s, a, Math.min(M.comp - .13, a + .055), yb + .26 + i * .045, yb + .31 + i * .045, 'v_pm_letra', .016);
      }
      naLateral(s, M.portas[0][0] + .02, M.corredica ? M.comp - .12 : M.portas.at(-1)[1] - .02, yc - .045, yc - .02, 'v_pm_letra', .016);
    } else {
      for (const [mat, y] of [['v_pm_azul', yc - .15], ['v_pm_amarelo', yc - .22], ['v_pm_vermelho', yc - .29]]){
        naLateral(s, M.portas[0][0] + .02, picape ? M.comp - .13 : M.corredica ? M.comp - .12 : M.portas.at(-1)[1] - .02, y, y + .062, mat);
      }
      const ta = Math.min(t, (yc - .31 - Math.max(yb + .1, .34)) / 5.4);
      textoLateral(s, 'POLICIA', ta, meio, yc - .32 - 5 * ta, 'v_pm_azul');
    }
    textoLateral(s, '190', .026, Math.max(.34, dEixoF - .02), Math.min(yc - .17, Math.max(r + ra + .05, yc - .22)), nova ? 'v_pm_letra' : 'v_pm_vermelho');
  }

  /* ---------------------------------------------------------- capô */
  const cp = parte('capo'), yCapo = yc - .025, dA = .12, dB = M.capo - .03;
  const th = Math.min(.034, (dB - dA - .03) / 12.5);
  if (nova){
    cp(-.56, .56, yCapo, yCapo + .008, Z(dB), Z(dA), 'v_pmpint_caqui', .2);
    for (let d = dA; d < dB - .05; d += .13) for (const s of [-1, 1]) cp(s * .56, s * .65, yCapo, yCapo + .01, Z(d + .075), Z(d), 'v_pm_letra', 1);
  }
  /* quem olha de frente lê "POLICIA" em cima, mais perto do para-brisa */
  const linhas = [['POLICIA', th], ['MILITAR', th], ['DE MINAS GERAIS', th * .47]];
  let v = 0;
  const alturas = linhas.map(([, tam]) => 5 * tam);
  const total = alturas.reduce((a, b) => a + b, 0) + 2 * th;
  v = total;
  linhas.forEach(([txt, tam], i) => {
    v -= alturas[i];
    const zBaixo = (dA + dB) / 2 - total / 2 + v;        /* distância da frente até a base da linha */
    escrevePm(txt, tam, (u0, u1, v0, v1) => cp(u0, u1, yCapo + .008, yCapo + .018, Z(zBaixo + v1), Z(zBaixo + v0), i === 2 ? 'v_pm_vermelho' : nova ? 'v_pm_letra' : 'v_pm_azul', 1));
    v -= th;
  });

  /* ---------------------------------------------------------- traseira */
  const noFundo = (p, txt, tam, x, y, z, mat) => escrevePm(txt, tam, (u0, u1, v0, v1) => parte(p)(x - u1, x - u0, y + v0, y + v1, z - .014, z, mat, 1));
  const letraTras = nova ? 'v_pm_letra' : 'v_pm_azul';
  if (M.traseira === 'portamalas'){ noFundo('carroceria', 'POLICIA', .029, 0, yc - .3, Z(M.comp - .07), letraTras); noFundo('carroceria', '190', .022, 0, yc - .46, Z(M.comp - .07), letraTras); }
  if (M.traseira === 'tampao'){ noFundo('tampa_traseira', 'POLICIA', .036, 0, yc - .38, Z(M.comp - .06), letraTras); noFundo('tampa_traseira', '190', .028, 0, yc - .58, Z(M.comp - .06), letraTras); }
  if (picape){ noFundo('tampa_traseira', 'POLICIA', Math.min(.034, (yc - M.roda - .08) / 6), 0, M.roda + .08, Z(M.comp - .05), letraTras); }
  if (M.traseira === 'portas_van'){ noFundo('porta_traseira_e', 'POLICIA', .027, (W - .1) / 2, yc - .32, Z(M.comp - .05), letraTras); noFundo('porta_traseira_d', '190', .045, -(W - .1) / 2, yc - .38, Z(M.comp - .05), letraTras); }

  /* ---------------------------------------------------------- sinalização no teto */
  const dLuz = M.tetoF + (tipo === 'van' ? .35 : .42);
  const gx = parte('giroflex', 'carroceria', [0, M.alt, Z(dLuz)]);
  gx(-.64, .64, M.alt, M.alt + .035, Z(dLuz + .15), Z(dLuz - .15), 'v_plastico');
  for (const s of [-1, 1]) gx(s * .46, s * .54, M.alt - .09, M.alt, Z(dLuz + .05), Z(dLuz - .05), 'v_plastico');      /* pés */
  const cores = {azul:['v_pm_azul_on', 'v_pm_azul_on', 'v_pm_branco_on'], vermelha:['v_pm_vm_on', 'v_pm_vm_on', 'v_pm_branco_on'], apagada:['v_pm_azul_off', 'v_pm_vm_off', 'v_pm_branco_off']}[luz];
  for (const s of [-1, 1]){
    gx(s * .38, s * .62, M.alt + .035, M.alt + .125, Z(dLuz + .13), Z(dLuz - .13), cores[0], 1);
    gx(s * .12, s * .36, M.alt + .035, M.alt + .125, Z(dLuz + .13), Z(dLuz - .13), cores[1], 1);
  }
  gx(-.1, .1, M.alt + .035, M.alt + .11, Z(dLuz + .12), Z(dLuz - .12), cores[2], 1);
  const an = parte('antenas', 'carroceria', [0, M.alt, Z(M.tetoT - .22)]);
  for (const [x, h] of [[.3, .46], [-.34, .26]]){ an(x - .05, x + .05, M.alt - .02, M.alt + .04, Z(M.tetoT - .17), Z(M.tetoT - .27), 'v_plastico'); an(x - .012, x + .012, M.alt + .04, M.alt + h, Z(M.tetoT - .21), Z(M.tetoT - .23), 'v_pm_grade', .05); }
  const hf = parte('holofote', 'carroceria', [W, yc + .13, Z(M.capo + .2)]);
  hf(W - .04, W + .05, yc + .1, yc + .13, Z(M.capo + .23), Z(M.capo + .19), 'v_plastico'); hf(W + .03, W + .13, yc + .08, yc + .18, Z(M.capo + .26), Z(M.capo + .16), 'v_plastico', .05); hf(W + .045, W + .115, yc + .095, yc + .165, Z(M.capo + .16), Z(M.capo + .145), 'v_farol', 1);

  /* ---------------------------------------------------------- divisória atrás dos bancos da frente */
  if (carro.lugares.length > 2){
    const dg = M.lugares[0][0] + .4, dv = parte('divisoria', 'interior', [0, carro.yp, Z(dg)]);
    dv(-(W - .16), W - .16, carro.yp, yc - .24, Z(dg + .035), Z(dg), 'v_painel');
    for (let x = -(W - .18); x <= W - .17; x += .13) dv(x - .011, x + .011, yc - .24, yt - .05, Z(dg + .025), Z(dg + .008), 'v_pm_grade', .5);
    for (const y of [yc - .02, yc + .22, yt - .07]) dv(-(W - .16), W - .16, y, y + .025, Z(dg + .028), Z(dg + .005), 'v_pm_grade', .5);
  }

  /* ---------------------------------------------------------- itens da função */
  if (funcao === 'tatico' || funcao === 'choque' || (funcao === 'rocca' && tipo !== 'picape_compacta')){
    const qm = parte('quebra_mato', 'carroceria', [0, yb + .1, Z(.04)]);
    const topoQm = yc - .12;
    for (const s of [-1, 1]){
      qm(s * .4, s * .47, yb + .06, topoQm, Z(-.05), Z(-.12), 'v_pm_grade'); qm(s * .4, s * .47, yb + .06, yb + .13, Z(.04), Z(-.05), 'v_pm_grade');
      qm(s * (W - .16), s * (W - .1), yc - .34, topoQm, Z(-.03), Z(-.09), 'v_pm_grade'); qm(s * .47, s * (W - .1), topoQm - .05, topoQm, Z(-.04), Z(-.09), 'v_pm_grade'); qm(s * .47, s * (W - .1), yc - .34, yc - .29, Z(-.04), Z(-.09), 'v_pm_grade');
    }
    for (const y of [yb + .2, yc - .3, topoQm - .05]) qm(-.47, .47, y, y + .05, Z(-.06), Z(-.11), 'v_pm_grade');
  }
  const cachorro = (c, x, y, z) => {                                  /* pastor belga deitado de lado no compartimento, de frente para +X */
    for (const dx of [-.22, .2]) for (const dz of [-.1, .1]) c(x + dx - .035, x + dx + .035, y, y + .26, z + dz - .035, z + dz + .035, 'v_pm_pelo', .05);
    c(x - .3, x + .24, y + .22, y + .45, z - .15, z + .15, 'v_pm_pelo', .06); c(x - .24, x + .14, y + .45, y + .5, z - .13, z + .13, 'v_pm_pelo_escuro', .06);
    c(x + .18, x + .32, y + .36, y + .64, z - .09, z + .09, 'v_pm_pelo', .06); c(x + .2, x + .42, y + .55, y + .74, z - .11, z + .11, 'v_pm_pelo', .06); c(x + .42, x + .55, y + .55, y + .65, z - .065, z + .065, 'v_pm_pelo_escuro', .05);
    for (const dz of [-.08, .05]) c(x + .22, x + .27, y + .74, y + .85, z + dz, z + dz + .03, 'v_pm_pelo_escuro', .04);
    c(x + .55, x + .575, y + .6, y + .65, z - .03, z + .03, 'v_pm_grade', 1); c(x + .38, x + .4, y + .66, y + .69, z + .108, z + .118, 'v_pm_grade', 1);
    c(x - .46, x - .3, y + .32, y + .39, z - .035, z + .035, 'v_pm_pelo_escuro', .05);
  };
  if (picape && (funcao === 'cela' || funcao === 'rocca')){
    const a = M.cabine + .05, b = M.comp - .13, xw = W - .1, y0 = yc + .045, y1 = Math.max(yt + .02, y0 + .55);
    const cm = parte('compartimento', 'carroceria', [0, y0, Z((a + b) / 2)]);
    cm(-xw, xw, y1 - .06, y1, Z(b), Z(a), corAlta, .16); cm(-xw, xw, y0, y1 - .06, Z(a + .05), Z(a), corAlta, .16);
    for (const s of [-1, 1]){
      cm(s * (xw - .05), s * xw, y0, y0 + .17, Z(b), Z(a + .05), corBaixa, .16); cm(s * (xw - .05), s * xw, y1 - .17, y1 - .06, Z(b), Z(a + .05), corAlta, .16);
      for (const d of [a + .05, (a + b) / 2 - .03, b - .08]) cm(s * (xw - .05), s * xw, y0 + .17, y1 - .17, Z(d + .08), Z(d), corAlta, .16);
      if (funcao === 'rocca') for (let y = y0 + .2; y < y1 - .19; y += .075) cm(s * (xw - .045), s * (xw - .005), y, y + .028, Z(b - .08), Z(a + .13), 'v_pm_grade', .5);       /* venezianas */
      else {
        cm(s * (xw - .045), s * (xw - .03), y0 + .17, y1 - .17, Z(b - .08), Z(a + .13), 'v_vidro');
        for (let d = a + .2; d < b - .1; d += .12) cm(s * (xw - .028), s * (xw - .008), y0 + .17, y1 - .17, Z(d + .022), Z(d), 'v_pm_grade', .5);
      }
      const texto = funcao === 'rocca' ? 'ROCCA' : 'PM', tx = Math.min(.02, (b - a - .2) / 26);
      escrevePm(texto, tx, (u0, u1, v0, v1) => { const c = (a + b) / 2, da = s > 0 ? c + u0 : c - u1, db = s > 0 ? c + u1 : c - u0; cm(s * (xw - .004), s * (xw + .014), y0 + .035 + v0, y0 + .035 + v1, Z(db), Z(da), nova ? 'v_pm_letra' : 'v_pm_azul', 1); });
    }
    const pc = parte('porta_compartimento', 'carroceria', [0, y1 - .03, Z(b)], {eixo:'x', ang:1.35});
    pc(-(xw - .05), xw - .05, y0, y0 + .2, Z(b + .05), Z(b), corAlta, .16); pc(-(xw - .05), xw - .05, y1 - .2, y1 - .06, Z(b + .05), Z(b), corAlta, .16);
    for (const s of [-1, 1]) pc(s * (xw - .18), s * (xw - .05), y0 + .2, y1 - .2, Z(b + .05), Z(b), corAlta, .16);
    for (let x = -(xw - .22); x < xw - .2; x += .13) pc(x, x + .024, y0 + .2, y1 - .2, Z(b + .035), Z(b + .015), 'v_pm_grade', .5);
    pc(-.07, .07, y0 + .1, y0 + .14, Z(b + .07), Z(b + .05), 'v_cromo', 1);
    if (funcao === 'rocca') cachorro(parte('cao', 'interior', [0, M.roda + .08, Z((a + b) / 2)]), 0, M.roda + .095, Z((a + b) / 2));
  }
  if (tipo === 'suv_grande' && funcao === 'rocca'){
    const dg = M.lugares.at(-1)[0] + .45, canil = parte('canil', 'interior', [0, r + .15, Z(dg)]);
    const estreito = W - M.pneu - .05;                                   /* embaixo, a grade passa entre as rodas */
    for (let x = -(W - .2); x <= W - .19; x += .12) canil(x - .011, x + .011, Math.abs(x) + .011 > estreito ? M.roda + .04 : r + .15, yt - .05, Z(dg + .025), Z(dg), 'v_pm_grade', .5);
    for (const y of [r + .6, yc + .2, yt - .07]) canil(-(W - .18), W - .18, y, y + .025, Z(dg + .03), Z(dg - .005), 'v_pm_grade', .5);
    cachorro(parte('cao', 'interior', [0, r + .15, Z(4.32)]), 0, r + .15, Z(4.32));
    for (const s of [-1, 1]){
      for (let y = yc + .06; y < yt - .16; y += .085) naLateral(s, M.portas.at(-1)[1] + .1, M.tetoT - .1, y, y + .03, 'v_pm_grade', -.03);
      textoLateral(s, 'ROCCA', .022, (M.portas.at(-1)[1] + M.comp - .1) / 2, yc - .17, nova ? 'v_pm_letra' : 'v_pm_vermelho');
    }
  }
  if (funcao === 'choque'){
    for (const s of [-1, 1]){
      for (let y = yc + .08; y < yt - .2; y += .17) naLateral(s, M.portas[0][1] + .06, M.tetoT - .1, y, y + .028, 'v_pm_grade', .004);
      for (let d = M.portas[0][1] + .4; d < M.tetoT - .2; d += .55) naLateral(s, d, d + .028, yc + .02, yt - .14, 'v_pm_grade', .008);
      const fim = M.comp - .14, ini = dEixoT + ra + .04, tc = Math.min(.022, (fim - ini) / 23);
      textoLateral(s, 'CHOQUE', tc, (ini + fim) / 2, yc - .2, nova ? 'v_pm_letra' : 'v_pm_vermelho', .024);
    }
  }
  carro.viatura = nova ? 'nova' : 'antiga'; carro.funcao = funcao; carro.luz = luz;
  carro.partes = carro.partes.filter(p => p.caixas.length);
}

/* o construtor de carros passa a aceitar {viatura:'nova'|'antiga', funcao, luz} */
const construirCivil = construirCarro;
construirCarro = function(tipo, op = {}){
  if (!PINTURAS_VIATURA[op.viatura]) return construirCivil(tipo, op);
  const carro = construirCivil(tipo, {...op, estado:'inteiro'});
  equiparViatura(carro, op);
  if (op.estado && op.estado !== 'inteiro'){ carro.estado = op.estado; envelhecer(carro, op.estado === 'destruido'); }
  return carro;
};

/* ---------------------------------------------------------------- no montador de cenários */
if (typeof BIBLIOTECA !== 'undefined'){
  const CAT = 'Viaturas PM (padrão)';
  BIBLIOTECA.CATEGORIAS.push(CAT);
  Object.assign(BIBLIOTECA.FIXAS, CORES_CARRO);
  for (const m of LISOS_VIATURA) BIBLIOTECA.LISOS.add(m);
  const nova = (id, nome, tipo, op) => BIBLIOTECA.ITENS[id] = {id, nome, cat:CAT, cores:{},
    desenhar(g){ for (const p of construirCarro(tipo, op).partes) for (const caixa of p.caixas) g.b(...caixa); }};
  for (const [tipo, M] of Object.entries(CARROS)){
    const curto = M.nome.replace(/ \(.*\)/, '');
    for (const funcao of FUNCOES_DE[tipo]) nova(`viatura_${tipo}_${funcao}`, `${curto}: ${funcao === 'rocca' ? 'ROCCA' : FUNCOES_VIATURA[funcao].replace(/ \(.*\)/, '').toLowerCase()}`, tipo, {viatura:'nova', funcao});
    nova(`viatura_${tipo}_antiga`, `${curto}: pintura antiga`, tipo, {viatura:'antiga', funcao:'radiopatrulha'});
  }
}
