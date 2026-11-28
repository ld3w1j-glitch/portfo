/* Ferrugem e armaduras de apocalipse para os carros do padrão e as viaturas. Carregar depois de viaturas.js.
   Uso: construirCarro(tipo, {..., blindagem:'sucata'|'reforcada'|'fortaleza', espinhos:true, ferrugem:0..3})
   As peças de armadura são separadas (nomes começando com "blindagem_"), para o jogo poder instalar e retirar. Não há armas. */
const BLINDAGENS = {nenhuma:'Sem armadura', sucata:'Improvisada (sucata)', reforcada:'Reforçada (chapas)', fortaleza:'Fortaleza'};
const FERRUGENS = {0:'Sem ferrugem', 1:'Leve', 2:'Média', 3:'Pesada'};

Object.assign(CORES_CARRO, {v_blind_aco:'#666C73', v_blind_escuro:'#3B3F45', v_blind_claro:'#858B93', v_blind_zinco:'#9A9D97',
  v_suc_marrom:'#74563B', v_suc_azul:'#4C6A70', v_suc_vermelho:'#87382C', v_suc_amarelo:'#A98327', v_suc_verde:'#55623E',
  v_rebite:'#BDC2C8', v_espinho:'#B4BAC2', v_fresta:'#0B0C0E', v_madeira:'#7C5C3B', v_lona:'#726C4D', v_galao:'#8E2D22', v_saco:'#A8925F', v_arame:'#9298A0'});
LISOS_CARRO.push('v_rebite', 'v_fresta');

/* ================================================================ ferrugem: manchas e escorridos calculados em cada pixel */
const sorteio3 = (x, y, z, s) => { let h = (Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483629) ^ Math.imul(s, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function ruidoSuave(x, y, z, s){
  const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z), f = t => t * t * (3 - 2 * t), u = f(x - i), v = f(y - j), w = f(z - k), mistura = (a, b, t) => a + (b - a) * t;
  const q = (a, b, c) => sorteio3(i + a, j + b, k + c, s);
  return mistura(mistura(mistura(q(0,0,0), q(1,0,0), u), mistura(q(0,1,0), q(1,1,0), u), v), mistura(mistura(q(0,0,1), q(1,0,1), u), mistura(q(0,1,1), q(1,1,1), u), v), w);
}
/* quanto cada material enferruja (0 = nunca) */
function forcaDaFerrugem(mat){
  if (mat === 'v_espinho') return .3;                                      /* pontas gastas, quase no metal */
  if (/^(pintura|v_pmpint|v_suc)/.test(mat)) return 1;
  if (/^v_blind/.test(mat)) return .74;                                    /* o aço aparece mais que na lataria */
  if (mat === 'v_rebite') return .3;
  if (/^v_(chassi|longarina|susp|escape|motor|cambio|tanque|disco|piso|aco|arame|galao)/.test(mat)) return .9;
  if (/^v_(cromo|aro)/.test(mat)) return .75;
  if (/^v_pm_(letra|vermelho|azul$|amarelo)/.test(mat)) return .42;
  if (mat === 'v_plastico' || mat === 'v_placa') return .38;
  return 0;
}
const TONS_FERRUGEM = ['#8A451F', '#733617', '#A25724', '#5A2C16', '#94501F', '#B46E2B'];
/* cor = cor original do pixel; p = centro do pixel em metros; n = para onde a face olha */
function enferrujar(cor, mat, p, n, nivel, semente){
  const forca = forcaDaFerrugem(mat); if (!nivel || !forca) return cor;
  const [x, y, z] = p;
  let c = misto(cor, '#8F7A5C', [0, .07, .13, .2][nivel] * forca);                                  /* poeira e tinta queimada de sol */
  const mancha = ruidoSuave(x * 3.1, y * 3.6, z * 3.1, semente) * .66 + ruidoSuave(x * 9.5, y * 9.5, z * 9.5, semente + 7) * .34;
  const baixo = Math.max(0, .85 - y) * .2, emCima = n[1] > .5 ? .04 : 0;                             /* mais ferrugem embaixo e onde empoça água */
  const limite = [0, .735, .665, .585][nivel] - baixo * .75 - emCima + (1 - forca) * .24;
  if (mancha > limite){
    const grao = ruidoSuave(x * 8, y * 8, z * 8, semente + 3);
    let tom_ = TONS_FERRUGEM[Math.max(0, Math.min(5, Math.floor((grao - .22) * 10.5)))];
    if (mancha > limite + .13 && grao < .45) tom_ = '#432312';                                       /* miolo comido */
    return misto(c, tom_, Math.min(1, .78 + (mancha - limite) * 3) * Math.min(1, forca + .25));
  }
  if (mancha > limite - .045) return misto(c, '#A8602A', .42 * forca);                              /* borda alaranjada em volta da mancha */
  if (Math.abs(n[1]) < .5){                                                                           /* escorridos nas faces em pé */
    const fio = ruidoSuave(x * 15, y * 1.1, z * 15, semente + 11);
    if (fio > 1 - [0, .2, .27, .34][nivel] && ruidoSuave(x * 4, y * 2.3, z * 4, semente + 13) > .46) return misto(c, '#8F4C22', .55 * forca);
  }
  return c;
}

/* ================================================================ armaduras */
function blindarCarro(carro, op){
  const nivel = {sucata:1, reforcada:2, fortaleza:3}[op.blindagem]; if (!nivel) return;
  const tipo = carro.tipo, M = carro.medidas, F = M.comp / 2, W = M.larg / 2, r = M.roda / 2, ra = r + .07, yc = M.cintura, yb = M.vao + .05, yt = carro.forro, Z = d => F - d;
  const [eixoF, eixoT] = carro.eixos, picape = M.traseira === 'cacamba', alto = M.alt;
  const achar = nome => carro.partes.find(p => p.nome === nome);
  /* peça de armadura; quando é presa em uma porta ou tampa, usa o mesmo ponto de giro para abrir junto */
  const peca = (sufixo, dona) => {
    const nome = 'blindagem_' + sufixo; let p = achar(nome);
    if (!p){ const d = dona && achar(dona); p = {nome, grupo:'carroceria', pivo:d ? d.pivo : [0, 0, 0], abre:d ? d.abre : null, caixas:[]}; carro.partes.push(p); }
    const c = (x0, x1, y0, y1, z0, z1, mat, px = .1) => {
      const a = Math.min(x0, x1), b = Math.max(x0, x1), e = Math.min(y0, y1), f = Math.max(y0, y1), g = Math.min(z0, z1), h = Math.max(z0, z1);
      if (b - a > .001 && f - e > .001 && h - g > .001) p.caixas.push([(a + b) / 2, e, (g + h) / 2, b - a, f - e, h - g, mat, px]);
    };
    c.p = p; return c;
  };
  let n = 0;
  const sorte = () => ruido(`blind|${tipo}|${op.blindagem}|${n++}`);
  const SUCATA = ['v_suc_marrom', 'v_blind_zinco', 'v_suc_azul', 'v_blind_aco', 'v_suc_vermelho', 'v_blind_escuro', 'v_suc_amarelo', 'v_suc_verde'];
  const chapaDe = () => nivel === 1 ? SUCATA[sorte() % SUCATA.length] : nivel === 2 ? 'v_blind_aco' : 'v_blind_escuro';
  const topo = d => d <= M.capo ? yc : d < M.tetoF ? yc + (yt - yc) * (d - M.capo) / (M.tetoF - M.capo) : d <= M.tetoT ? yt : d < M.vidroT ? yt - (yt - yc) * (d - M.tetoT) / (M.vidroT - M.tetoT) : yc;
  const arco = z => { let y = yb; for (const e of [eixoF, eixoT]){ const dz = Math.abs(z - e); if (dz < ra) y = Math.max(y, r + Math.sqrt(ra * ra - dz * dz)); } return Math.round(y / .035) * .035; };
  /* ponta em degraus: sai de (x, y, z) na direção 'x', 'y' ou 'z' */
  const ponta = (c, x, y, z, eixo, sinal, compr = .14, grossura = .07) => {
    for (let i = 0; i < 3; i++){
      const a = compr * i / 3 * sinal, b = compr * (i + 1) / 3 * sinal, m = grossura / 2 * (1 - i * .32);
      if (eixo === 'x') c(x + a, x + b, y - m, y + m, z - m, z + m, 'v_espinho', .06);
      if (eixo === 'y') c(x - m, x + m, y + a, y + b, z - m, z + m, 'v_espinho', .06);
      if (eixo === 'z') c(x - m, x + m, y - m, y + m, z + a, z + b, 'v_espinho', .06);
    }
  };

  /* -------------------------------------------------- chapas nas portas e na lateral */
  const lados = [[1, 'e'], [-1, 'd']];
  const chapaLateral = (c, s, d0, d1, y1, saliencia, esp, mat) => {      /* acompanha o arco das rodas por baixo */
    const passos = Math.max(1, Math.ceil((d1 - d0) / .07)), passo = (d1 - d0) / passos;
    let ini = d0, atual = Math.max(yb + .05, arco(Z(d0 + passo / 2)) + .045);
    for (let i = 1; i <= passos; i++){
      const prox = i < passos ? Math.max(yb + .05, arco(Z(d0 + (i + .5) * passo)) + .045) : null;
      if (prox !== atual){ const fim = d0 + i * passo; if (y1 - atual > .03) c(s * (W + saliencia), s * (W + saliencia + esp), atual, y1, Z(fim), Z(ini), mat, .1); ini = fim; atual = prox; }
    }
  };
  const rebites = (c, s, d0, d1, ys, fora) => { for (let d = d0 + .06; d < d1 - .04; d += .17) for (const y of ys) if (y > arco(Z(d)) + .08) c(s * (W + fora), s * (W + fora + .018), y - .018, y + .018, Z(d + .018), Z(d - .018), 'v_rebite', 1); };
  const portas = M.portas.map((p, i) => ({d0:p[0], d1:p[1], nome:i === 0 ? 'f' : 't'}));
  const trechos = [];
  for (const [s, lado] of lados){
    for (const p of portas) trechos.push({s, d0:p.d0 + .03, d1:p.d1 - .03, sufixo:`porta_${p.nome}${lado}`, dona:`porta_${p.nome}${lado}`});
    if (M.corredica && s < 0) trechos.push({s, d0:M.corredica[0] + .03, d1:M.corredica[1] - .03, sufixo:'porta_corredica', dona:'porta_corredica'});
    if (M.corredica && s > 0) trechos.push({s, d0:M.corredica[0] + .03, d1:M.corredica[1] - .03, sufixo:'lateral_e'});
    const ini = M.corredica ? M.corredica[1] + .03 : M.portas.at(-1)[1] + .03, fim = M.comp - .13;
    if (fim - ini > .25) trechos.push({s, d0:ini, d1:fim, sufixo:`lateral_${lado}`, dona:picape && ini >= M.cabine ? 'cacamba' : undefined, traseiro:true});
  }
  for (const t of trechos){
    const c = peca(t.sufixo, t.dona), s = t.s, y1 = yc - .035;
    if (nivel === 1){
      /* remendos de cores diferentes, tortos e sobrepostos */
      let d = t.d0, k = 0;
      while (d < t.d1 - .12){
        const larg = Math.min(t.d1 - d, .3 + (sorte() % 30) / 100), cima = y1 - (sorte() % 16) / 100, saliencia = .006 + (k % 2) * .014;
        if (sorte() > 18){
          const mat = chapaDe();
          chapaLateral(c, s, d, d + larg, cima, saliencia, .022, mat);
          if (mat === 'v_blind_zinco') for (let x = d + .04; x < d + larg - .03; x += .075) chapaLateral(c, s, x, x + .03, cima - .02, saliencia + .022, .012, 'v_blind_claro');
          rebites(c, s, d, d + larg, [cima - .05, Math.max(yb + .16, cima - .3)], saliencia + .022);
        }
        d += larg - .03; k++;
      }
    } else {
      chapaLateral(c, s, t.d0, t.d1, y1, .008, nivel === 3 ? .05 : .03, nivel === 3 ? 'v_blind_escuro' : 'v_blind_aco');
      const fora = nivel === 3 ? .058 : .038;
      chapaLateral(c, s, t.d0, t.d1, y1, fora, .016, 'v_blind_claro');
      rebites(c, s, t.d0, t.d1, [y1 - .05, y1 - .24], fora + .016);
      if (nivel === 3) for (const y of [yc - .2, yc - .36]) if (y > r + ra) chapaLateral(c, s, t.d0 + .02, t.d1 - .02, y, fora + .016, .018, 'v_blind_aco');
    }
  }
  /* no nível reforçado em diante, a chapa clara vira só uma faixa no alto, deixando o aço aparecer */
  if (nivel > 1) for (const p of carro.partes) if (p.nome.startsWith('blindagem_porta') || p.nome.startsWith('blindagem_lateral')){
    for (const c of p.caixas) if (c[6] === 'v_blind_claro' && c[4] > .09){ c[1] = c[1] + c[4] - .09; c[4] = .09; }
  }

  /* -------------------------------------------------- janelas laterais */
  const janelas = [];
  for (const [s, lado] of lados){
    portas.forEach(p => janelas.push({s, d0:p.d0 + .07, d1:p.d1 - .07, sufixo:`porta_${p.nome}${lado}`, dona:`porta_${p.nome}${lado}`, frente:p.nome === 'f'}));
    const ini = M.portas.at(-1)[1] + .07, fim = (picape ? Math.min(M.tetoT, M.cabine) : M.tetoT) - .07;
    if (M.corredica){ janelas.push({s, d0:M.corredica[0] + .07, d1:M.corredica[1] - .07, sufixo:s < 0 ? 'porta_corredica' : 'lateral_e', dona:s < 0 ? 'porta_corredica' : undefined}); janelas.push({s, d0:M.corredica[1] + .07, d1:M.tetoT - .07, sufixo:`lateral_${lado}`}); }
    else if (fim - ini > .18) janelas.push({s, d0:ini, d1:fim, sufixo:`lateral_${lado}`});
  }
  const olhos = carro.assento + .93;                                    /* altura da fresta para enxergar */
  for (const j of janelas){
    const c = peca(j.sufixo, j.dona), s = j.s, x0 = s * (W + .006), x1 = s * (W + .03);
    /* fatias que seguem o teto e a coluna inclinada */
    const fatias = (y0, y1, mat, a = j.d0, b = j.d1, fora0 = x0, fora1 = x1, px = .1) => {
      const k = Math.max(1, Math.ceil((b - a) / .08)), passo = (b - a) / k;
      for (let i = 0; i < k; i++){ const d = a + i * passo, y = Math.min(y1, topo(d + passo / 2) - .07); if (y - y0 > .015) c(fora0, fora1, y0, y, Z(d + passo), Z(d), mat, px); }
    };
    const moldura = () => { fatias(yc + .005, yc + .05, 'v_blind_escuro'); fatias(yt - .13, yt - .085, 'v_blind_escuro'); };
    if (nivel === 1){
      if (!j.frente && sorte() < 55){
        fatias(yc + .02, yt - .09, chapaDe(), j.d0, j.d1);
        for (let d = j.d0 + .08; d < j.d1 - .05; d += .2) for (const y of [yc + .07, yc + .38]) if (y < topo(d) - .1) c(s * (W + .03), s * (W + .048), y - .018, y + .018, Z(d + .018), Z(d - .018), 'v_rebite', 1);
        if (sorte() < 60) for (let i = 0; i < 7; i++){ const d = j.d0 + .06 + i * (j.d1 - j.d0 - .14) / 7, y = yc + .1 + i * .045; if (y < topo(d) - .12) c(s * (W + .03), s * (W + .05), y, y + .075, Z(d + .09), Z(d), 'v_madeira', .08); }   /* tábua atravessada */
      } else {
        for (let y = yc + .1; y < yt - .12; y += .17) fatias(y, y + .022, 'v_arame', j.d0, j.d1, x0, x1, .5);
        for (let d = j.d0 + .02; d < j.d1; d += .22) fatias(yc + .02, yt - .09, 'v_arame', d, d + .022, x0, x1, .5);
        moldura();
      }
    } else if (nivel === 2){
      fatias(yc + .005, yc + .2, 'v_blind_aco');
      for (let y = yc + .27; y < yt - .12; y += .1) fatias(y, y + .03, 'v_blind_escuro', j.d0, j.d1, s * (W + .02), s * (W + .045), .5);
      for (const d of [j.d0, (j.d0 + j.d1) / 2 - .02, j.d1 - .04]) fatias(yc + .02, yt - .085, 'v_blind_escuro', d, d + .04, s * (W + .028), s * (W + .052));
      moldura();
    } else {
      fatias(yc + .005, olhos - .05, 'v_blind_escuro'); fatias(olhos + .05, yt - .075, 'v_blind_escuro');
      fatias(olhos - .05, olhos + .05, 'v_blind_escuro', j.d0, j.d0 + .08); fatias(olhos - .05, olhos + .05, 'v_blind_escuro', j.d1 - .08, j.d1);
      fatias(olhos - .085, olhos - .05, 'v_blind_claro', j.d0, j.d1, s * (W + .03), s * (W + .05)); fatias(olhos + .05, olhos + .085, 'v_blind_claro', j.d0, j.d1, s * (W + .03), s * (W + .05));
      for (let d = j.d0 + .07; d < j.d1 - .04; d += .18) for (const y of [yc + .06, yt - .17]) if (y < topo(d) - .09) c(s * (W + .03), s * (W + .048), y - .018, y + .018, Z(d + .018), Z(d - .018), 'v_rebite', 1);
    }
  }

  /* -------------------------------------------------- para-brisa */
  const pb = peca('parabrisa');
  const passosPb = 16, vao = M.tetoF - M.capo;
  const degrau = (i, ya, yb_, x0, x1, mat, px = .12) => { const a = M.capo + vao * i / passosPb, b = M.capo + vao * (i + 1) / passosPb; pb(x0, x1, ya, yb_, Z(b - .02), Z(a - .045), mat, px); };
  const xp = W - .1;
  for (let i = 0; i < passosPb; i++){
    const y0 = topo(M.capo + vao * i / passosPb) + .012, y1 = topo(M.capo + vao * (i + 1) / passosPb) + .03;
    if (nivel === 1){
      for (let x = -xp + .06; x < xp; x += .24) degrau(i, y0, y1, x, x + .024, 'v_arame', .5);
      if (i % 4 === 2) degrau(i, y0, y0 + .025, -xp, xp, 'v_arame', .5);
      if (i < 7) degrau(i, y0, y1, -xp, -xp + .5, 'v_suc_azul');                                         /* placa velha tampando um lado, longe do motorista */
    } else if (nivel === 2){
      for (let x = -xp + .04; x < xp; x += .17) degrau(i, y0, y1, x, x + .03, 'v_blind_escuro', .5);
      if (i < 3) degrau(i, y0, y1, -xp, xp, 'v_blind_aco');
    } else {
      const meio = (y0 + y1) / 2;
      if (meio < olhos - .06 || meio > olhos + .06) degrau(i, y0, y1, -xp, xp, 'v_blind_escuro');
      else for (const x of [-xp, -.04, xp - .07]) degrau(i, y0, y1, x, x + .07, 'v_blind_claro');
    }
  }
  for (let i = 0; i < passosPb; i++){ const y0 = topo(M.capo + vao * i / passosPb), y1 = topo(M.capo + vao * (i + 1) / passosPb) + .045; for (const s of [-1, 1]) degrau(i, y0, y1, s * (xp - .02), s * (xp + .05), 'v_blind_escuro'); }

  /* -------------------------------------------------- frente */
  const fr = peca('frente');
  if (nivel === 1){
    for (const s of [-1, 1]){ fr(s * .46, s * .54, yb + .05, yc - .12, Z(-.03), Z(-.11), 'v_blind_escuro'); fr(s * .46, s * .54, yb + .05, yb + .12, Z(.05), Z(-.03), 'v_blind_escuro'); }
    for (const [y, mat] of [[yb + .14, 'v_blind_aco'], [yc - .3, 'v_suc_marrom'], [yc - .17, 'v_blind_aco']]) fr(-(W - .06), W - .06, y, y + .07, Z(-.06), Z(-.13), mat);
    fr(-.34, .28, yb + .2, yc - .31, Z(-.11), Z(-.15), 'v_blind_zinco'); fr(.1, .52, yb + .12, yc - .42, Z(-.13), Z(-.165), 'v_suc_vermelho');
    for (const x of [-.28, -.05, .2, .44]) fr(x, x + .035, yb + .3, yb + .335, Z(-.15), Z(-.185), 'v_rebite', 1);
  } else if (nivel === 2){
    fr(-(W + .04), W + .04, yb + .04, yb + .3, Z(.02), Z(-.14), 'v_blind_escuro'); fr(-(W - .04), W - .04, yb + .08, yb + .26, Z(-.14), Z(-.17), 'v_blind_aco');
    for (const s of [-1, 1]){ fr(s * .5, s * .59, yb + .3, yc - .08, Z(-.04), Z(-.13), 'v_blind_escuro'); fr(s * .59, s * (W - .1), yc - .13, yc - .07, Z(-.06), Z(-.11), 'v_blind_escuro'); fr(s * (W - .15), s * (W - .09), yb + .3, yc - .07, Z(-.05), Z(-.1), 'v_blind_escuro'); }
    for (let y = yc - .34; y < yc - .1; y += .09) fr(-.5, .5, y, y + .04, Z(-.07), Z(-.11), 'v_blind_aco');
    for (let x = -(W - .12); x <= W - .1; x += .12) fr(x - .02, x + .02, yb + .15, yb + .19, Z(-.17), Z(-.19), 'v_rebite', 1);
  } else {
    /* limpa-trilhos em V, em degraus: avança mais no meio */
    const passosY = 7, y0 = Math.max(.1, M.vao - .08), y1 = yc - .12;
    for (let i = 0; i < passosY; i++){
      const a = y0 + (y1 - y0) * i / passosY, b = y0 + (y1 - y0) * (i + 1) / passosY, avanco = .36 - i * .042;
      for (let k = 0; k < 7; k++){
        const xa = k * (W + .08) / 7, xb = (k + 1) * (W + .08) / 7, frente = avanco - k * .035;
        for (const s of [-1, 1]) fr(s * xa, s * xb, a, b + .004, Z(.02), Z(-Math.max(.04, frente)), i === 0 || i === passosY - 1 ? 'v_blind_aco' : 'v_blind_escuro', .11);
      }
      fr(-.035, .035, a, b, Z(-(avanco)), Z(-(avanco + .035)), 'v_blind_claro');
    }
    for (let x = -(W - .05); x <= W - .04; x += .26) ponta(fr, x, y0 + .06, Z(-Math.max(.1, .36 - Math.abs(x) / (W + .08) * .24)), 'z', 1, .13, .09);
  }

  /* -------------------------------------------------- capô */
  const cp = peca('capo', 'capo'), yCapo = yc - .02, cd0 = .16, cd1 = M.capo - .06;
  if (nivel === 1){ cp(-(W - .34), -.04, yCapo, yCapo + .02, Z(cd1), Z(cd0 + .1), 'v_suc_marrom'); if (cd1 - cd0 > .35) cp(-.1, W - .42, yCapo + .012, yCapo + .034, Z(cd1 - .12), Z(cd0), 'v_blind_zinco'); for (const x of [-(W - .4), -.16, W - .5]) for (const d of [cd0 + .14, cd1 - .16]) cp(x, x + .036, yCapo + .034, yCapo + .052, Z(d + .036), Z(d), 'v_rebite', 1); }
  else {
    if (!carro.viatura){ cp(-(W - .32), W - .32, yCapo, yCapo + .035, Z(cd1), Z(cd0), 'v_blind_aco'); for (let x = -(W - .38); x <= W - .4; x += .22) for (const d of [cd0 + .04, cd1 - .08]) cp(x, x + .036, yCapo + .035, yCapo + .053, Z(d + .036), Z(d), 'v_rebite', 1); }
    if (nivel === 3){ cp(-.24, .24, yCapo + .035, yCapo + .15, Z(Math.min(cd1, cd0 + .5)), Z(cd0 + .1), 'v_blind_escuro'); for (let y = yCapo + .055; y < yCapo + .13; y += .035) cp(-.2, .2, y, y + .016, Z(cd0 + .1), Z(cd0 + .085), 'v_fresta', 1); }
  }

  /* -------------------------------------------------- traseira */
  const tampa = achar('tampa_traseira') ? 'tampa_traseira' : undefined;
  if (M.traseira === 'tampao' || M.traseira === 'portas_van'){
    const duas = M.traseira === 'portas_van';
    for (const [s, lado] of lados){
      const c = duas ? peca(`porta_traseira_${lado}`, `porta_traseira_${lado}`) : peca('tampa', tampa);
      const fundo = Z(M.comp - .03), xa = s * .03, xb = s * (W - .17);
      for (let y = yc + .06; y < yt - .16; y += nivel === 3 ? .075 : .16){
        const d = M.traseira === 'tampao' ? M.tetoT + (M.vidroT - M.tetoT) * Math.max(0, (yt - y - .05) / (yt - yc)) : M.comp - .03;
        c(xa, xb, y, y + (nivel === 3 ? .06 : .028), M.traseira === 'tampao' ? Z(d + .06) : fundo, M.traseira === 'tampao' ? Z(d + .025) : fundo - .025, nivel === 1 ? 'v_arame' : 'v_blind_escuro', .12);
      }
      if (nivel > 1) c(xa, xb, yb + .28, yc - .45, Z(M.comp - .025), Z(M.comp - .055), chapaDe());
    }
  } else if (picape){
    const c = peca('tampa', tampa);
    c(-(W - .2), W - .2, M.roda + .02, yc - .24, Z(M.comp - .02), Z(M.comp - .052), chapaDe());
  } else {
    const c = peca('traseira');
    for (let i = 0; i < 8; i++){ const a = M.tetoT + (M.vidroT - M.tetoT) * i / 8, b = M.tetoT + (M.vidroT - M.tetoT) * (i + 1) / 8; if (nivel === 3 || i % 2 === 0) c(-(W - .16), W - .16, topo(b) + .015, topo(b) + (nivel === 3 ? (topo(a) - topo(b)) + .03 : .045), Z(b + .045), Z(a + .02), nivel === 1 ? 'v_arame' : 'v_blind_escuro'); }
  }
  const pt = peca('parachoque_t');
  if (nivel > 1){ pt(-(W + .03), W + .03, yb + .05, yb + .27, Z(M.comp + .1), Z(M.comp - .01), 'v_blind_escuro'); if (nivel === 3) for (let x = -(W - .1); x <= W - .08; x += .3) ponta(pt, x, yb + .16, Z(M.comp + .1), 'z', -1, .12, .08); }

  /* -------------------------------------------------- proteção das rodas */
  const pr = peca('rodas');
  for (const e of [eixoF, eixoT]) for (const s of [-1, 1]){
    if (nivel === 1 && (e === eixoF || s < 0)) continue;
    const base = nivel === 3 ? r - .02 : r + .17, cima = r + ra + .07;
    pr(s * (W + .045), s * (W + .085), r + ra - .06, cima, e - ra - .05, e + ra + .05, nivel === 1 ? 'v_suc_verde' : 'v_blind_escuro', .11);
    if (nivel > 1){ pr(s * (W + .045), s * (W + .085), base, r + ra - .06, e - ra - .05, e - ra * .55, 'v_blind_escuro'); pr(s * (W + .045), s * (W + .085), base, r + ra - .06, e + ra * .55, e + ra + .05, 'v_blind_escuro'); pr(s * (W + .005), s * (W + .045), cima - .07, cima - .02, e - ra, e + ra, 'v_blind_aco'); }
    if (nivel === 3) pr(s * (W + .045), s * (W + .085), r + .1, r + ra - .06, e - ra * .55, e + ra * .55, 'v_blind_aco', .11);
    for (let k = -3; k <= 3; k++) pr(s * (W + .085), s * (W + .102), cima - .06, cima - .024, e + k * ra * .3 - .018, e + k * ra * .3 + .018, 'v_rebite', 1);
  }

  /* -------------------------------------------------- teto: bagageiro, carga e plataforma */
  const te = peca('teto');
  const dA = carro.viatura ? M.tetoF + .78 : M.tetoF + .1, dB = Math.min(M.tetoT, picape ? M.cabine : M.tetoT) - .06;
  const antenas = achar('antenas');
  if (antenas) for (const c of antenas.caixas) c[0] += c[0] >= 0 ? W - .38 : -(W - .42);           /* antenas vão para os cantos */
  const y = alto + .02, xr = W - .14;
  if (dB - dA > .35){
    for (const s of [-1, 1]){ te(s * (xr - .04), s * xr, y + .05, y + .09, Z(dB), Z(dA), 'v_blind_escuro'); for (const d of [dA + .02, (dA + dB) / 2, dB - .06]) te(s * (xr - .04), s * xr, alto - .06, y + .05, Z(d + .04), Z(d), 'v_blind_escuro'); }
    for (let d = dA; d <= dB - .05; d += .24) te(-xr, xr, y, y + .04, Z(d + .05), Z(d), 'v_blind_aco');
    const comp = dB - dA, base = y + .04;
    const estepe = (x, d) => { for (const [a, b] of [[.31, .18], [.18, .31], [.27, .27]]) te(x - a, x + a, base + (a > .3 ? .004 : 0), base + .17, Z(d + b), Z(d - b), 'v_pneu', .08); te(x - .12, x + .12, base + .17, base + .185, Z(d + .12), Z(d - .12), 'v_aco', .06); };
    const galao = (x, d) => { te(x - .09, x + .09, base, base + .34, Z(d + .14), Z(d - .14), 'v_galao', .07); te(x - .03, x + .03, base + .34, base + .38, Z(d - .02), Z(d - .1), 'v_blind_escuro', 1); };
    const rolo = d => { te(-xr + .1, xr - .1, base, base + .2, Z(d + .12), Z(d - .12), 'v_lona'); for (const x of [-.4, .36]) te(x, x + .05, base - .005, base + .21, Z(d + .126), Z(d - .126), 'v_blind_escuro', 1); };
    if (nivel < 3){
      estepe(-.34, dA + Math.min(.4, comp * .35));
      if (comp > .8){ galao(.42, dA + .3); galao(.2, dA + .3); rolo(dB - .2); }
      if (comp > 1.5){ te(.05, .62, base, base + .27, Z(dA + .98), Z(dA + .55), 'v_madeira'); te(.05, .62, base + .12, base + .15, Z(dA + .985), Z(dA + .545), 'v_blind_escuro', 1); }
      if (nivel === 2) for (const x of [-.42, -.14, .14, .42]){ te(x - .09, x + .09, base + .05, base + .18, Z(dA - .01), Z(dA - .1), 'v_blind_escuro', .06); te(x - .065, x + .065, base + .065, base + .165, Z(dA - .1), Z(dA - .115), 'v_farol', 1); }
    } else {
      /* plataforma de vigia: guarda-corpo, sacos de areia e faróis */
      for (const s of [-1, 1]){ for (let d = dA; d <= dB - .03; d += Math.max(.3, comp / 4)) te(s * (xr - .05), s * (xr - .005), base, base + .36, Z(d + .045), Z(d), 'v_blind_escuro'); te(s * (xr - .05), s * (xr - .005), base + .32, base + .36, Z(dB), Z(dA), 'v_blind_aco'); }
      te(-xr, xr, base + .32, base + .36, Z(dB), Z(dB - .045), 'v_blind_aco');
      for (let x = -xr + .06; x < xr - .22; x += .27){ te(x, x + .25, base, base + .11, Z(dA + .17), Z(dA + .02), 'v_saco', .07); if (x < xr - .5) te(x + .13, x + .38, base + .105, base + .21, Z(dA + .165), Z(dA + .03), 'v_saco', .07); }
      for (const x of [-.45, -.15, .15, .45]){ te(x - .11, x + .11, base + .2, base + .36, Z(dA - .01), Z(dA - .11), 'v_blind_escuro', .06); te(x - .08, x + .08, base + .22, base + .34, Z(dA - .11), Z(dA - .13), 'v_farol', 1); }
      te(-xr + .06, xr - .06, base + .17, base + .2, Z(dA - .02), Z(dA - .05), 'v_blind_aco');
      if (comp > 1){ galao(xr - .22, dB - .24); galao(xr - .44, dB - .24); estepe(-.3, dB - .38); }
      /* arame farpado nas beiradas */
      for (const s of [-1, 1]) for (let d = dA + .06; d < dB; d += .11){ te(s * (xr + .004), s * (xr + .02), base + .34, base + .43, Z(d + .008), Z(d - .008), 'v_arame', 1); te(s * (xr - .03), s * (xr + .05), base + .385, base + .4, Z(d + .008), Z(d - .008), 'v_arame', 1); }
      for (const s of [-1, 1]) te(s * (xr + .006), s * (xr + .018), base + .385, base + .397, Z(dB), Z(dA), 'v_arame', 1);
    }
  }
  /* escada traseira e canos de escape verticais */
  if (nivel > 1 && !picape && M.traseira !== 'portamalas'){
    const es = peca('escada');
    for (const x of [-(W - .2), -(W - .52)]) es(x - .022, x + .022, yb + .35, alto + .1, Z(M.comp + .075), Z(M.comp + .035), 'v_blind_aco', .2);
    for (let yy = yb + .45; yy < alto + .05; yy += .24) es(-(W - .2), -(W - .52), yy, yy + .035, Z(M.comp + .072), Z(M.comp + .038), 'v_blind_aco', .2);
  }
  if (nivel === 3){
    const ch = peca('chamines'), dc = picape ? M.cabine + .09 : M.capo + .06;
    for (const s of [-1, 1]){
      const x = s * (W + .14), base = picape ? yc - .3 : yb + .45, fim = picape ? alto + .22 : yc + .3;
      ch(x - .055, x + .055, base, fim, Z(dc + .055), Z(dc - .055), 'v_escape', .09); ch(x - .068, x + .068, fim, fim + .09, Z(dc + .068), Z(dc - .068), 'v_blind_escuro', .09); ch(x - .04, x + .04, fim + .09, fim + .095, Z(dc + .04), Z(dc - .04), 'v_fresta', 1);
      for (const yy of [base + .06, fim - .14]) ch(s * (W + .01), x, yy, yy + .04, Z(dc + .025), Z(dc - .025), 'v_blind_escuro', 1);
    }
  }

  /* -------------------------------------------------- letras sobre as chapas (viaturas) */
  if (carro.viatura && nivel > 1){
    const [a, b] = M.corredica ? [M.corredica[0] + .08, eixoT + ra < 0 ? F - eixoT - ra - .08 : M.corredica[1]] : [Math.max(M.portas[0][0], F - eixoF + ra) + .08, Math.min(M.portas.at(-1)[1], F - eixoT - ra) - .02];
    const t = Math.min(.045, (b - a) / 28), meio = (a + b) / 2, yTxt = yc - .17 - 5 * t, fora = nivel === 3 ? .083 : .056;
    for (const [s, lado] of lados) escrevePm('POLICIA', t, (u0, u1, v0, v1) => {
      const d0 = s > 0 ? meio + u0 : meio - u1, d1 = s > 0 ? meio + u1 : meio - u0, dm = (d0 + d1) / 2;
      const p = M.corredica && s < 0 && dm > M.corredica[0] && dm < M.corredica[1] ? {sufixo:'porta_corredica', dona:'porta_corredica'} : trechos.find(q => q.s === s && dm >= q.d0 - .06 && dm <= q.d1 + .06) || {sufixo:`lateral_${lado}`};
      peca(p.sufixo, p.dona)(s * (W + fora), s * (W + fora + .012), yTxt + v0, yTxt + v1, Z(d1), Z(d0), 'v_pm_letra_clara', 1);
    });
  }

  /* -------------------------------------------------- espinhos */
  if (op.espinhos){
    const es = peca('espinhos');
    for (const s of [-1, 1]){
      for (const e of [eixoF, eixoT]) ponta(es, s * (W + .005), r, e, 'x', s, .32, .14);                      /* no centro das rodas */
      for (let d = M.portas[0][0] + .12; d < M.portas.at(-1)[1] - .08; d += .3){ if (arco(Z(d)) < yb + .1) ponta(es, s * (W + .06), yb + .13, Z(d), 'x', s, .21, .1); }
      for (let d = dA + .15; d < dB - .1; d += .34) ponta(es, s * (W - .1), alto + (nivel === 3 ? .03 : .11), Z(d), 'x', s, .26, .095);
    }
    if (nivel < 3) for (let x = -(W - .14); x <= W - .12; x += .24) ponta(es, x, yb + .18, Z(-.17), 'z', 1, .24, .1);
  }
  carro.partes = carro.partes.filter(p => p.caixas.length);
  carro.blindagem = op.blindagem; carro.espinhos = !!op.espinhos;
}

/* o construtor passa a aceitar armadura e ferrugem, em carros civis e viaturas */
const construirSemArmadura = construirCarro;
construirCarro = function(tipo, op = {}){
  const carro = construirSemArmadura(tipo, op);
  if (BLINDAGENS[op.blindagem] && op.blindagem !== 'nenhuma'){
    blindarCarro(carro, op);
    if (carro.estado === 'destruido') carro.partes = carro.partes.filter(p => p.nome !== 'blindagem_capo');
  }
  const nivel = FERRUGENS[op.ferrugem] ? Number(op.ferrugem) : 0;
  carro.ferrugem = nivel;
  if (nivel) for (const p of carro.partes){ p.ferrugem = nivel; p.semente = ruido(tipo) + 5; }
  return carro;
};

/* ---------------------------------------------------------------- no montador de cenários */
if (typeof BIBLIOTECA !== 'undefined'){
  const CAT = 'Blindados e enferrujados';
  BIBLIOTECA.CATEGORIAS.push(CAT);
  Object.assign(BIBLIOTECA.FIXAS, CORES_CARRO);
  for (const m of ['v_rebite', 'v_fresta']) BIBLIOTECA.LISOS.add(m);
  const novo = (id, nome, tipo, op, cores) => BIBLIOTECA.ITENS[id] = {id, nome, cat:CAT, cores,
    desenhar(g){ for (const p of construirCarro(tipo, op).partes) for (const caixa of p.caixas){ const c = caixa.slice(); if (forcaDaFerrugem(c[6]) && c[7] < 1) c[7] = Math.max(.1, Math.min(c[7], .12)); g.b(...c); } },
    pintaPixel:(cor, mat, centro, n) => enferrujar(cor, mat, centro, n, op.ferrugem, ruido(tipo) + 5)};
  for (const [tipo, M] of Object.entries(CARROS)){
    const curto = M.nome.replace(/ \(.*\)/, ''), tinta = {pintura:['Pintura', M.cor]};
    novo(`enferrujado_${tipo}`, `${curto}: enferrujado`, tipo, {ferrugem:3, estado:'abandonado'}, tinta);
    novo(`blindado_${tipo}_sucata`, `${curto}: armadura improvisada`, tipo, {blindagem:'sucata', ferrugem:2}, tinta);
    novo(`blindado_${tipo}_reforcada`, `${curto}: armadura reforçada`, tipo, {blindagem:'reforcada', ferrugem:2, espinhos:true}, tinta);
    novo(`blindado_${tipo}_fortaleza`, `${curto}: fortaleza`, tipo, {blindagem:'fortaleza', ferrugem:2, espinhos:true}, tinta);
  }
  for (const [tipo, funcao] of [['picape_media', 'tatico'], ['suv_grande', 'tatico'], ['van', 'choque']])
    novo(`blindado_viatura_${tipo}`, `Viatura blindada: ${CARROS[tipo].nome.replace(/ \(.*\)/, '').toLowerCase()}`, tipo, {viatura:'nova', funcao, blindagem:'reforcada', ferrugem:2}, {});
}
