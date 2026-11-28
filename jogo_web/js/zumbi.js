/* Zumbis: um zumbi é um personagem comum com o campo "zumbi". O modelo.js chama os ganchos daqui,
   por isso ele funciona nas três janelas (criador, montador de cenários e criador de zumbis). */

/* ================================================================ opções */
const Z_NIVEIS = ['Nenhum', 'Pouco', 'Médio', 'Muito'];
const Z_PELES = ['#D9C7A8', '#C9BBA0', '#B7B9A0', '#9FAE8C', '#86A083', '#A7ADB4', '#8D9AA6', '#A58F9E', '#A9805E', '#6E5A48'];
const Z_OLHOS = {brancos:'Brancos', desiguais:'Um maior', orbita:'Falta um', vermelhos:'Vermelhos', fundos:'Fundos', saltado:'Saltado'};
const Z_BOCAS = {aberta:'Aberta', presas:'Dentes tortos', dentuco:'Sorriso', caido:'Queixo caído', costurada:'Costurada', rosnando:'Rosnando'};
const Z_NARIZ = {normal:'Normal', sem:'Sem nariz'};
const Z_CRANIO = {inteiro:'Inteiro', cerebro:'Cérebro à mostra', aberto:'Topo aberto', ferida:'Ferida na testa', caveira:'Meio caveira'};
const Z_BARRIGA = {nada:'Inteira', aberta:'Barriga aberta', costelas:'Costelas à mostra', ambas:'As duas'};
const Z_BRACOS = {nada:'Inteiros', osso_e:'Osso (lado direito da tela)', osso_d:'Osso (lado esquerdo da tela)', sem_mao:'Sem uma mão', sem_braco:'Sem um antebraço'};
const Z_PERNAS = {nada:'Inteiras', osso_e:'Osso (lado direito da tela)', osso_d:'Osso (lado esquerdo da tela)', ambas:'Osso nas duas', sem_perna:'Sem uma canela'};
const Z_CRAVADO = {nada:'Nada', estaca:'Estaca de madeira', cano:'Cano de ferro', placa:'Placa de trânsito'};
const Z_PORTE = {normal:'Normal', magro:'Magro', forte:'Brutamontes', inchado:'Inchado'};

const Z_PADRAO = {olhos:'desiguais', boca:'aberta', nariz:'normal', cranio:'inteiro', barriga:'nada', bracos:'nada', pernas:'nada', cravado:'nada', porte:'normal',
  sangue:2, podre:2, rasgos:2, falhas:true, sangueCor:'#A81E1A', altura:1, semente:7};

function validarZumbi(z){
  const out = {...Z_PADRAO};
  if (!z || typeof z !== 'object') return out;
  for (const [k, lista] of [['olhos', Z_OLHOS], ['boca', Z_BOCAS], ['nariz', Z_NARIZ], ['cranio', Z_CRANIO], ['barriga', Z_BARRIGA], ['bracos', Z_BRACOS], ['pernas', Z_PERNAS], ['cravado', Z_CRAVADO], ['porte', Z_PORTE]])
    if (Object.hasOwn(lista, z[k])) out[k] = z[k];
  for (const k of ['sangue', 'podre', 'rasgos']) if (Number.isInteger(z[k]) && z[k] >= 0 && z[k] <= 3) out[k] = z[k];
  if (typeof z.falhas === 'boolean') out.falhas = z.falhas;
  if (/^#[0-9a-f]{6}$/i.test(z.sangueCor || '')) out.sangueCor = z.sangueCor;
  if (Number.isFinite(z.altura)) out.altura = Math.max(.75, Math.min(1.35, z.altura));
  if (Number.isInteger(z.semente)) out.semente = Math.abs(z.semente) % 100000;
  return out;
}

function coresZumbi(c, m){
  const z = c.zumbi, p = c.pele;
  Object.assign(m, {
    sangue:z.sangueCor, sangue_escuro:tom(z.sangueCor, .62), carne:misto(z.sangueCor, '#3A0D0B', .35), carne_clara:misto(z.sangueCor, '#E08A80', .35),
    osso:'#E6DEC6', osso_sombra:'#C7BC9E', cerebro:'#E58D8C', cerebro_sombra:'#C46A6E', cerebro_claro:'#F2AAA4', tripa:'#C9656A', tripa_clara:'#E08A8C',
    podre:misto(p, '#4E5B33', .38), podre_escuro:misto(p, '#38301F', .55), roxo:misto(p, '#5B3A66', .4),
    orbita:'#1B0E0D', olho_morto:'#EEEBE0', pupila:'#17110F', olho_vermelho:'#FF3B2E', dente_podre:'#E3D6A8', linha:'#241613',
    olheira:misto(p, '#3A2030', .42), pele_sombra:tom(p, .84), labio:misto(p, '#5A2530', .45), labio_escuro:misto(p, '#2A1012', .6),
  });
}

/* ================================================================ sorteio com semente */
const zSorte = (c, chave) => ruido(`z${c.zumbi.semente}|${chave}`);

/* ================================================================ forma do corpo: o que sai e o que entra */
function zumbiBlocos(c, nome, blocos){
  const z = c.zumbi, tira = [];
  const filtra = fn => blocos = blocos.filter(v => { if (fn(...v)){ tira.push(v.join(',')); return false; } return true; });
  const [w, d, h] = ESTRUTURA[nome].tam;
  if (nome === 'cabeca' && (z.cranio === 'cerebro' || z.cranio === 'aberto')) filtra((i, j, k) => k >= (z.cranio === 'cerebro' ? 17 : 18) && !(z.cranio === 'aberto' && i < 5));
  if (z.barriga === 'aberta' || z.barriga === 'ambas'){
    if (nome === 'cintura') filtra((i, j, k) => j <= 2 && i >= 2 && i <= 6 && k >= 1 && k <= 3 && !((i === 2 || i === 6) && k === 3));
    if (nome === 'torax') filtra((i, j, k) => j <= 1 && i >= 4 && i <= 7 && k === 0);
  }
  if ((z.barriga === 'costelas' || z.barriga === 'ambas') && nome === 'torax') filtra((i, j, k) => j >= 0 && j <= 1 && i >= 8 && i <= 11 && k >= 1 && k <= (c.corpo === 'feminino' ? 4 : 5));   /* o busto nunca é aberto */
  /* ossos aparentes: a carne some num trecho e um osso fino é desenhado no lugar */
  if ((z.bracos === 'osso_e' && nome === 'antebraco_e') || (z.bracos === 'osso_d' && nome === 'antebraco_d')) filtra((i, j, k) => k >= 1 && k <= 5);
  if ((z.bracos === 'sem_mao' || z.bracos === 'sem_braco') && nome === 'mao_e') filtra(() => true);
  if (z.bracos === 'sem_braco' && nome === 'antebraco_e') filtra(() => true);
  const osso = lado => z.pernas === 'ambas' || z.pernas === 'osso_' + lado;
  if ((osso('e') && nome === 'canela_e') || (osso('d') && nome === 'canela_d')) filtra((i, j, k) => k >= 1 && k <= 6);
  if (z.pernas === 'sem_perna' && (nome === 'canela_d' || nome === 'pe_d')) filtra(() => true);
  /* inchado: barriga saliente */
  if (z.porte === 'inchado' && nome === 'cintura') for (let i = 1; i < w - 1; i++) for (let k = 0; k < h; k++){ const borda = (i === 1 || i === w - 2) + (k === 0 || k === h - 1); if (borda < 2) blocos.push([i, 0, k]); if (borda === 0) blocos.push([i, -1, k]); }
  return {blocos, tirados:new Set(tira)};
}

/* ================================================================ pintura por cima do personagem normal */
const ehPeleZ = m => /^(pele|orelha|podre|roxo)/.test(m);
const LIVRES_DE_SANGUE = new Set(['olho_morto', 'pupila', 'olho_vermelho', 'orbita', 'dente_podre', 'linha', 'osso', 'osso_sombra', 'cabelo', 'cerebro', 'cerebro_sombra', 'cerebro_claro', 'aro', 'lente', 'metal', 'sola']);

function zumbiPinta(c, p, mat, tirados){
  const z = c.zumbi, {peca, i, j, k, n} = p;
  /* parede de um corte: mostra carne por dentro */
  if (tirados && tirados.has(`${i + n[0]},${j + n[1]},${k + n[2]}`)){
    if (peca === 'cabeca') return z.cranio === 'cerebro' ? (zSorte(c, `ce${i},${j}`) < 45 ? 'cerebro_sombra' : 'cerebro') : (zSorte(c, `ab${i},${j}`) < 55 ? 'carne' : 'osso_sombra');
    return zSorte(c, `corte|${peca}|${i},${j},${k}`) < 60 ? 'carne' : 'sangue_escuro';
  }
  if (peca === 'cabeca') mat = faceZumbi(c, p, mat);
  /* roupa rasgada: buracos e barras irregulares (nunca no quadril, no alto das coxas nem no tórax feminino) */
  if (z.rasgos > 0 && !ehPeleZ(mat) && peca !== 'cabeca' && peca !== 'quadril' && !(ehCoxa(peca) && p.topo < 5) && !(c.corpo === 'feminino' && peca === 'torax') && !ehPe(peca) && !/^(luva|colete|mochila|cinto)/.test(mat)){
    const furo = zSorte(c, `furo|${peca}|${(i + (k & 1)) >> 1},${j >> 2},${k >> 1}`);
    const barra = (ehAnte(peca) && k <= 1) || (peca === 'cintura' && k === 0) || (ehCanela(peca) && k <= 1) || (ehBraco(peca) && p.topo >= p.tam[2] - 3);
    if (furo < [0, 5, 10, 18][z.rasgos] || (barra && zSorte(c, `barra|${peca}|${i},${j}`) < z.rasgos * 24)) mat = 'pele';
  }
  if (LIVRES_DE_SANGUE.has(mat)) return mat;
  /* podridão só na pele */
  if (z.podre > 0 && ehPeleZ(mat) && mat !== 'orelha'){
    const r = zSorte(c, `podre|${peca}|${i >> 1},${j >> 1},${(k + (i & 1)) >> 1}`);
    if (r < [0, 3, 6, 15][z.podre]) mat = r % 3 === 0 ? 'podre_escuro' : 'podre';
    else if (z.podre > 2 && r > 96) mat = 'roxo';
  }
  if (z.sangue > 0){
    const grande = zSorte(c, `sg|${peca}|${(i + (k >> 1 & 1)) >> 1},${j >> 2},${(k + (i >> 2 & 1)) >> 1}`);
    const pingo = zSorte(c, `pg|${peca}|${i},${j},${k}`);
    if (grande < [0, 2, 5, 12][z.sangue]) return pingo < 82 ? 'sangue' : 'sangue_escuro';
    if (pingo < [0, 0, 1, 3][z.sangue]) return 'sangue';
    /* escorrido abaixo da boca, no peito */
    if (peca === 'torax' && p.frente && k >= 10 - z.sangue * 2 && Math.abs(i - 6) <= 1 && zSorte(c, `esc|${i},${k}`) < 25 + z.sangue * 18) return 'sangue';
  }
  return mat;
}

/* rosto: grade 14 x 13 x 20; u = distância do meio com sinal (negativo = lado esquerdo da tela) */
function faceZumbi(c, p, mat){
  const z = c.zumbi, {i, j, k, n} = p, u = i + .5 - 7, a = Math.abs(u);
  const frente = n[1] < 0 && j <= 1;
  /* falhas no cabelo */
  if (z.falhas && /^(cabelo|raspado|fade)/.test(mat) && zSorte(c, `falha|${i >> 1},${j >> 1},${k >> 1}`) < 20) mat = 'pele';
  if (!frente || i === 0 || i === 13) return mat;
  if (z.cranio === 'caveira' && u > 0 && k >= 3 && k <= 16 && !(a < 1 && k >= 7 && k <= 9)){
    if (k === 10 || k === 11) { if (a > 1 && a < 4) return (k === 10 && a > 2 && a < 3) ? 'olho_vermelho' : 'orbita'; }
    if (k === 5 || k === 4) { if (a < 4) return (i % 2) ? 'dente_podre' : 'orbita'; }
    const borda = u < 2 && zSorte(c, `cv${i},${k}`) < 40;
    return borda ? 'carne' : (zSorte(c, `cv2${i},${k}`) < 22 ? 'osso_sombra' : 'osso');
  }
  if (z.cranio === 'ferida' && k >= 13 && k <= 16 && u > .5 && u < 4.5 && !((k === 13 || k === 16) && (a < 1.5 || a > 3.5)))
    return (k === 15 && a > 2 && a < 3) ? 'osso' : (zSorte(c, `fe${i},${k}`) < 55 ? 'sangue' : 'carne');
  /* olhos */
  const olho = u < 0 ? -1 : 1;
  if (k >= 9 && k <= 11 && a > 1 && a < 4){
    if (z.olhos === 'orbita' && olho < 0) return (k === 9 && a > 2 && a < 3) ? 'sangue' : 'orbita';
    if (z.olhos === 'fundos') return (k === 10 && a > 2 && a < 3) ? 'olho_morto' : 'orbita';
    if (k === 10){
      if (z.olhos === 'vermelhos') return (a > 2 && a < 3) ? 'olho_vermelho' : 'orbita';
      if (z.olhos === 'brancos') return 'olho_morto';
      return (a > 2 && a < 3) ? 'pupila' : 'olho_morto';
    }
    return (k === 11 && z.olhos === 'vermelhos') ? 'orbita' : 'olheira';
  }
  /* nariz */
  if (z.nariz === 'sem' && (k === 7 || k === 8) && a < 2) return (a < 1 && k === 8) ? 'carne' : 'orbita';
  /* boca */
  const b = z.boca;
  if (b === 'aberta' && k >= 4 && k <= 6 && a < 2.5 && !(k === 6 && a > 1.5)) return (k === 4 && a < 1) ? 'sangue' : 'orbita';
  if (b === 'presas' && k >= 4 && k <= 6 && a < 3) return (k === 5) ? 'orbita' : ((i + (k === 4 ? 1 : 0)) % 2 ? 'dente_podre' : 'orbita');
  if (b === 'dentuco' && k >= 4 && k <= 6 && a < 4){ if (k === 5 || (k === 6 && a > 3) || (k === 4 && a < 3)) return (i % 2) ? 'dente_podre' : 'olho_morto'; return 'labio_escuro'; }
  if (b === 'caido' && k >= 3 && k <= 6 && a < 3) return (k === 6 && i % 2) || (k === 3 && !(i % 2)) ? 'dente_podre' : (k === 4 && a < 1 ? 'tripa' : 'orbita');
  if (b === 'costurada' && k >= 4 && k <= 6 && a < 3.5) return k === 5 ? 'linha' : ((i % 2 === 0) ? 'linha' : 'pele_sombra');
  if (b === 'rosnando' && k >= 4 && k <= 6 && a < 3) return k === 5 ? (i % 2 ? 'dente_podre' : 'olho_morto') : 'sangue_escuro';
  if (z.sangue > 1 && k === 3 && a < 1.5 && zSorte(c, `qx${i}`) < 60) return 'sangue';
  if (/^(barba|labio|branco|iris|boca|dente$)/.test(mat) && !/^barba/.test(mat)) return 'pele';
  if ((k === 10 || k === 9) && /^(branco|iris)$/.test(mat)) return 'pele';
  return mat;
}

/* ================================================================ volumes soltos */
function zumbiExtras(c, cx){
  const z = c.zumbi, C = 'cabeca', T = 'torax';
  if (z.cranio === 'cerebro'){
    cx(C, 2.2, 11.8, .8, 11.6, 17, 18.4, 'cerebro_sombra');
    for (const [x0, x1, y0, y1, topo, m] of [[2.4, 5, 1, 4.6, 19.8, 'cerebro'], [5.2, 6.8, .6, 5.2, 20.6, 'cerebro_claro'], [7.2, 8.9, .8, 5, 20.3, 'cerebro'], [9.2, 11.6, 1.2, 4.8, 19.6, 'cerebro_claro'], [2.6, 5.4, 5, 8.2, 20.3, 'cerebro_claro'], [5.6, 8.4, 5.4, 9, 21, 'cerebro'], [8.6, 11.4, 5.2, 8.4, 20.1, 'cerebro'], [3, 6.2, 8.5, 11.2, 19.5, 'cerebro'], [6.5, 10.8, 9.2, 11.4, 20, 'cerebro_claro']]) cx(C, x0, x1, y0, y1, 18.2, topo, m);
    cx(C, 6.85, 7.15, .5, 11.4, 18.2, 20.2, 'carne');
    for (const [x, y, h] of [[1.15, .2, 1.3], [4.4, -.05, .7], [10.1, -.05, 1.5], [12.2, 2, .9], [1.15, 7, .8], [12.2, 8.4, 1.4]]) cx(C, x, x + .65, y, y + .65, 17, 17 + h, 'osso');
  }
  if (z.cranio === 'aberto') for (const [x, y, h] of [[5.2, .1, 1.2], [11.2, .3, .8], [12, 5, 1.1], [8, 11, .7]]) cx(C, x, x + .7, y, y + .7, 18, 18 + h, 'osso');
  const olhoE = (x0, x1, z0, z1, m, fora) => cx(C, 7 + x0, 7 + x1, -fora, .1, z0, z1, m);
  if (z.olhos === 'desiguais'){ olhoE(1, 4.2, 8.7, 11.8, 'olho_morto', .55); olhoE(2.2, 3.2, 9.8, 10.8, 'pupila', .68); }
  if (z.olhos === 'saltado'){ olhoE(1.3, 3.9, 9.1, 11.5, 'olho_morto', 1.7); olhoE(2.2, 3.1, 9.9, 10.8, 'pupila', 1.85); olhoE(2.9, 3.2, 7.4, 9.2, 'sangue_escuro', .45); }
  if (z.olhos === 'vermelhos') for (const s of [-1, 1]) cx(C, 7 + Math.min(s * 2.1, s * 2.9), 7 + Math.max(s * 2.1, s * 2.9), -.25, .1, 10.1, 10.9, 'olho_vermelho');
  const dente = (x, z0, z1, f = .4) => cx(C, x, x + .75, -f, .1, z0, z1, 'dente_podre');
  if (z.boca === 'aberta'){ dente(5.3, 5.6, 6.4); dente(7.6, 5.9, 6.7); dente(6.3, 4, 4.6); }
  if (z.boca === 'presas'){ dente(4.6, 5, 6.9, .6); dente(8.8, 5.2, 7, .55); dente(5.9, 3.8, 5.1, .5); dente(7.9, 3.9, 4.9, .45); }
  if (z.boca === 'caido'){
    cx(C, 4.2, 9.8, -.35, 1.8, 1.2, 2.9, 'pele'); cx(C, 4.2, 9.8, -.38, -.3, 2.2, 2.9, 'sangue_escuro');
    for (const x of [4.7, 6, 7.3, 8.5]) cx(C, x, x + .7, -.5, 0, 2.6, 3.5, 'dente_podre');
    cx(C, 6.3, 7.7, -.85, -.2, 1.9, 3.6, 'tripa');
  }
  if (z.boca === 'dentuco') for (let x = 4; x < 10; x += 1.05) cx(C, x, x + .75, -.3, .1, 4.9, 6.1, 'olho_morto');
  if (z.boca === 'costurada') for (let x = 4.2; x < 9.8; x += 1.1) cx(C, x, x + .25, -.28, .1, 4.1, 6.9, 'linha');
  if (z.nariz === 'sem') cx(C, 6.75, 7.25, -.25, .1, 7, 9, 'osso_sombra');
  if (z.sangue > 1) for (const [x, z0, z1] of [[4.7, 2.6, 4.6], [8.4, 1.9, 4.4]].slice(0, z.sangue - 1)) cx(C, x, x + .55, -.18, .15, z0, z1, 'sangue');
  /* barriga aberta: costelas, tripas e pedaço pendurado */
  if (z.barriga === 'aberta' || z.barriga === 'ambas'){
    for (const [x0, x1, y, z0, z1, m] of [[2.4, 4.6, .9, 1.1, 2.4, 'tripa'], [4.4, 6.9, 1.3, 1.6, 3.1, 'tripa_clara'], [3.2, 5.6, .6, 2.5, 3.3, 'tripa'], [5.1, 6.6, .4, 1, 1.9, 'tripa_clara']]) cx('cintura', x0, x1, y, 3.2, z0, z1, m);
    cx('cintura', 3.6, 4.5, .4, 1.3, -1.3, 1.4, 'tripa'); cx('cintura', 4, 4.9, .3, 1.1, -2.2, -1.1, 'tripa_clara'); cx('cintura', 2, 7, 3, 3.3, 1, 4, 'sangue_escuro');
  }
  if (z.barriga === 'costelas' || z.barriga === 'ambas'){
    cx(T, 8, 12, 2, 2.35, 1, c.corpo === 'feminino' ? 5 : 6, 'sangue_escuro');
    for (const zz of (c.corpo === 'feminino' ? [1.35, 2.55, 3.75] : [1.35, 2.55, 3.75, 4.95])) { cx(T, 8, 11.8, .35, 1.1, zz, zz + .55, 'osso'); cx(T, 11.3, 11.9, .9, 2.1, zz, zz + .55, 'osso_sombra'); }
    cx(T, 8, 8.55, .55, 1.2, 1.2, c.corpo === 'feminino' ? 4.6 : 5.6, 'osso_sombra');
  }
  /* ossos no lugar da carne */
  const haste = (peca, k0, k1) => {
    const [w, d] = ESTRUTURA[peca].tam, x = w / 2, y = d / 2 + (peca === 'canela_e' ? .2 : 0);
    cx(peca, x - .6, x + .6, y - .55, y + .55, k0 - .1, k1 + .1, 'osso');
    for (const [za, zb] of [[k0 - .1, k0 + .8], [k1 - .8, k1 + .1]]) cx(peca, x - .95, x + .95, y - .75, y + .75, za, zb, 'osso_sombra');
    cx(peca, x - 1.2, x - .65, y - .4, y + .2, k1 - 1, k1 + .1, 'carne'); cx(peca, x + .7, x + 1.2, y - .2, y + .4, k0, k0 + 1.4, 'sangue');
  };
  if (z.bracos === 'osso_e') haste('antebraco_e', 1, 6); if (z.bracos === 'osso_d') haste('antebraco_d', 1, 6);
  if (z.pernas === 'osso_e' || z.pernas === 'ambas') haste('canela_e', 1, 7); if (z.pernas === 'osso_d' || z.pernas === 'ambas') haste('canela_d', 1, 7);
  const toco = (peca, k) => { const [w, d] = ESTRUTURA[peca].tam; cx(peca, .35, w - .35, .35, d - .35, k - .5, k + .15, 'carne'); cx(peca, w / 2 - .5, w / 2 + .5, d / 2 - .5, d / 2 + .5, k - 1.8, k - .3, 'osso'); cx(peca, .2, .9, .5, 1.3, k - 1.1, k, 'sangue'); };
  if (z.bracos === 'sem_mao') toco('antebraco_e', 0);
  if (z.bracos === 'sem_braco') toco('braco_e', 0);
  if (z.pernas === 'sem_perna') toco('coxa_d', 0);
  /* objeto cravado no ombro, atravessando o tórax */
  if (z.cravado !== 'nada'){
    const mat = {estaca:'madeira', cano:'metal_escuro', placa:'metal_escuro'}[z.cravado];
    cx(T, 10.2, 11.5, -4.4, 11.6, 7.7, 9, mat);
    cx(T, 9.7, 12, -.35, .1, 7.2, 9.5, 'sangue'); cx(T, 9.9, 11.8, 7.9, 8.45, 7.4, 9.3, 'sangue_escuro');
    if (z.cravado === 'estaca') { cx(T, 10.5, 11.2, -5.4, -4.4, 8, 8.7, 'madeira'); cx(T, 10.25, 11.45, 11.6, 12.2, 7.75, 8.95, 'osso_sombra'); }
    if (z.cravado === 'cano') cx(T, 9.9, 11.8, -4.9, -4.4, 7.4, 9.3, 'metal');
    if (z.cravado === 'placa') { cx(T, 8, 13.7, -4.9, -4.4, 5.5, 11.2, 'placa_borda'); cx(T, 8.5, 13.2, -5.1, -4.9, 6, 10.7, 'placa_amarela'); cx(T, 10.45, 11.25, -5.22, -5.1, 7.7, 10, 'preto'); cx(T, 10.45, 11.25, -5.22, -5.1, 6.6, 7.2, 'preto'); }
  }
  if (z.porte === 'inchado'){ for (const [x, y, zz] of [[2, -2.35, 2], [6.5, -2.45, 3], [4, -2.3, .8]]) cx('cintura', x, x + 1.3, y, y + .5, zz, zz + 1.1, 'roxo'); }
  /* retalhos de roupa pendurados */
  if (z.rasgos >= 2 && c.roupa !== 'base'){
    const [w] = ESTRUTURA.cintura.tam;
    for (let x = .2; x < w - 1; x += 1.7){
      if (zSorte(c, `ret${Math.round(x * 10)}`) > z.rasgos * 24) continue;
      const comprido = 1 + zSorte(c, `ret2${Math.round(x * 10)}`) % 3;
      cx('cintura', x, x + 1, .55, 1.05, -comprido, .6, 'camisa'); cx('cintura', x + .3, x + 1.2, 6.9, 7.4, -comprido * .7, .6, 'camisa_sombra');
    }
  }
}

/* porte: alarga ou afina cada região em torno do eixo do corpo (largura, profundidade).
   Os pivôs acompanham, então os braços se afastam do tronco e as juntas continuam encaixadas. */
const PORTES = {
  magro:   {torax:[.8, .8], cintura:[.76, .76], quadril:[.84, .82], braco:[.74, .66], perna:[.78, .7], cabeca:[.95, .97]},
  forte:   {torax:[1.5, 1.36], cintura:[1.2, 1.18], quadril:[1.14, 1.14], braco:[1.52, 1.45], perna:[1.24, 1.28], cabeca:[1, 1]},
  inchado: {torax:[1.2, 1.36], cintura:[1.52, 1.75], quadril:[1.3, 1.42], braco:[1.2, 1.22], perna:[1.18, 1.24], cabeca:[1.09, 1.05]},
};
const regiaoDe = n => /^(braco|antebraco|mao)/.test(n) ? 'braco' : /^(coxa|canela|pe)/.test(n) ? 'perna' : n;
function zumbiPorte(c, pecas){
  const P = PORTES[c.zumbi.porte]; if (!P) return;
  const eixoX = pecas.torax.pivo[0], eixoZ = pecas.torax.pivo[2];
  const todas = Object.values(pecas), antes = Object.fromEntries(todas.map(p => [p.nome, [...p.pivo]]));
  /* braços: o afastamento do meio segue a largura do tronco; a espessura, a própria largura em torno do centro do membro */
  for (const p of todas){
    const reg = regiaoDe(p.nome), [fx, fz] = P[reg], membro = reg === 'braco' || reg === 'perna';
    const base = antes[p.nome];
    const ancora = membro ? (reg === 'braco' ? P.torax[0] : P.quadril[0]) : fx;
    const centro = membro ? p.quads.reduce((a, q) => a + q.v.reduce((s, v) => s + v[0] + base[0], 0) / q.v.length, 0) / Math.max(1, p.quads.length) : eixoX;
    const novoCentro = eixoX + (centro - eixoX) * ancora;
    for (const q of p.quads) q.v = q.v.map(v => {
      const x = v[0] + base[0], zz = v[2] + base[2];
      return [novoCentro + (x - centro) * fx, v[1] + base[1], eixoZ + (zz - eixoZ) * fz];
    });
    p.pivo = [eixoX + (base[0] - eixoX) * (membro ? ancora : fx), base[1], eixoZ + (base[2] - eixoZ) * fz];
    for (const q of p.quads) q.v = q.v.map(v => [v[0] - p.pivo[0], v[1] - p.pivo[1], v[2] - p.pivo[2]]);
  }
}

/* ================================================================ poses de zumbi */
Object.assign(POSES, {z_bracos:'Zumbi: braços à frente', z_arrastando:'Zumbi: arrastando', z_torto:'Zumbi: parado torto', z_agarrando:'Zumbi: agarrando', z_correndo:'Zumbi: correndo', z_rastejando:'Zumbi: rastejando'});
const POSES_ZUMBI = ['z_bracos', 'z_arrastando', 'z_torto', 'z_agarrando', 'z_correndo', 'z_rastejando', 'andando', 'descanso'];
const ANGULOS_ZUMBI = {
  z_bracos:{torax:[.14, 0, 0], cabeca:[.04, 0, .12], braco_d:[-1.42, 0, -.08], antebraco_d:[-.1, 0, 0], mao_d:[.35, 0, 0], braco_e:[-1.18, 0, .1], antebraco_e:[-.3, 0, 0], mao_e:[.5, 0, 0], coxa_d:[-.18, 0, 0], coxa_e:[.2, 0, 0], canela_e:[.2, 0, 0]},
  z_arrastando:{torax:[.3, .1, .08], cabeca:[-.2, .18, -.18], braco_d:[-.2, 0, -.14], braco_e:[-1.05, 0, .22], antebraco_e:[-.55, 0, 0], coxa_d:[-.3, 0, 0], canela_d:[.2, 0, 0], coxa_e:[.32, 0, .06], canela_e:[.3, 0, 0], pe_e:[.4, .3, 0]},
  z_torto:{cintura:[.04, 0, .05], torax:[.1, 0, .04], cabeca:[.1, -.14, .2], braco_d:[-.12, 0, -.05], antebraco_d:[-.2, 0, 0], braco_e:[.14, 0, .1], antebraco_e:[-.1, 0, 0]},
  z_agarrando:{torax:[.24, 0, 0], cabeca:[-.22, 0, -.08], braco_d:[-1.35, 0, -.62], antebraco_d:[-.75, 0, 0], mao_d:[-.25, 0, 0], braco_e:[-1.6, 0, .66], antebraco_e:[-.6, 0, 0], mao_e:[-.25, 0, 0], coxa_d:[-.5, 0, 0], canela_d:[.45, 0, 0], coxa_e:[.35, 0, 0], canela_e:[.3, 0, 0]},
  z_correndo:{torax:[.5, -.12, 0], cabeca:[-.35, 0, .12], braco_d:[-1.35, 0, -.1], antebraco_d:[-.9, 0, 0], braco_e:[.95, 0, .18], antebraco_e:[-.7, 0, 0], coxa_d:[-.95, 0, 0], canela_d:[.95, 0, 0], coxa_e:[.55, 0, 0], canela_e:[.85, 0, 0]},
  z_rastejando:{quadril:[1.36, 0, 0], torax:[-.1, 0, .06], cabeca:[-1.1, 0, .12], braco_d:[-2.62, 0, -.42], antebraco_d:[-.14, 0, 0], braco_e:[-2.46, 0, .52], antebraco_e:[-.45, 0, 0], coxa_d:[.42, 0, -.1], coxa_e:[.02, 0, .12], canela_e:[.08, 0, 0]},
};
Object.assign(ANGULOS, ANGULOS_ZUMBI);

/* ================================================================ roupa extra: camisa com gravata */
roupa('gravata', 'Camisa e gravata', base4('Camisa', '#E4E6EA', 'Calça', '#6E4A34', 'Sapato', '#23251F', 'Gravata', '#1F6B5A'), p => {
  const c = calcado(p, 0); if (c) return c;
  if (p.peca === 'quadril') return p.k === p.tam[2] - 1 ? (p.frente && p.meio < 1.2 ? 'remendo_dourado' : 'preto') : 'calca';
  const q = calcaComprida(p); if (q) return q;
  if (p.peca === 'torax' || p.peca === 'cintura'){
    if (p.frente && p.meio < 1 && !(p.peca === 'cintura' && p.k < 1)) return 'detalhe';
    if (p.peca === 'torax' && p.frente && p.topo < 3 && p.meio < 3 - p.topo * .6) return 'camisa_sombra';
    return 'camisa';
  }
  if (ehBraco(p.peca)) return 'camisa'; return null;
});

/* ================================================================ zumbis prontos */
const ZUMBIS = {};
function zumbi(id, nome, base){
  ZUMBIS[id] = {nome, ...base};
}
const cor4 = (camisa, calca, calcado, detalhe) => ({camisa, calca, calcado, detalhe});
zumbi('funcionario', 'Funcionário', {roupa:'gravata', pele:'#D9C7A8', cabelo:['lateral', '#17120F'], pose:'z_torto', z:{olhos:'brancos', boca:'costurada', cranio:'ferida', pernas:'osso_e', sangue:2, rasgos:2, semente:11}});
zumbi('esfarrapado', 'Esfarrapado', {roupa:'polo', cores:cor4('#9AA39A', '#43463F', '#C9BBA0', '#7C857C'), pele:'#C9BBA0', cabelo:['militar', '#1D1A17'], pose:'z_bracos', z:{olhos:'orbita', boca:'presas', pernas:'osso_d', bracos:'osso_e', sangue:2, rasgos:3, semente:23}});
zumbi('estripado', 'Estripado', {roupa:'casual', cores:cor4('#E8E4DC', '#1F3352', '#C9BBA0', '#B7B2A6'), pele:'#D9C7A8', cabelo:['careca', '#1D1A17'], pose:'z_arrastando', z:{olhos:'orbita', boca:'caido', cranio:'ferida', barriga:'ambas', pernas:'osso_d', sangue:3, rasgos:3, semente:5}});
zumbi('miolos', 'Moletom e miolos', {roupa:'moletom', cores:cor4('#2F5F9E', '#2E3130', '#27345C', '#1A1F2E'), pele:'#C9BBA0', cabelo:['careca', '#1D1A17'], pose:'z_bracos', z:{olhos:'desiguais', boca:'caido', cranio:'cerebro', pernas:'ambas', sangue:2, rasgos:2, semente:41}});
zumbi('atleta', 'Atleta', {corpo:'feminino', roupa:'futebol', cores:cor4('#E9EDF2', '#4E7286', '#B8352E', '#2F5F9E'), pele:'#D9C7A8', cabelo:['chiquinhas', '#C9B23A'], pose:'z_torto', z:{olhos:'brancos', boca:'dentuco', sangue:2, rasgos:2, falhas:false, semente:61}});
zumbi('soldado', 'Soldado caído', {kit:'soldado', pele:'#9FAE8C', cabelo:['militar', '#17120F'], pose:'z_arrastando', z:{olhos:'vermelhos', boca:'rosnando', cranio:'inteiro', bracos:'nada', sangue:2, rasgos:2, podre:3, semente:77}});
zumbi('medica', 'Médica', {corpo:'feminino', roupa:'medico', pele:'#B7B9A0', cabelo:['rabo', '#3B241A'], pose:'z_bracos', z:{olhos:'fundos', boca:'aberta', bracos:'sem_mao', sangue:3, rasgos:1, semente:19}});
zumbi('operario', 'Operário', {kit:'obra', pele:'#A7ADB4', cabelo:['raspado', '#1D1A17'], pose:'z_torto', z:{olhos:'desiguais', boca:'presas', cravado:'cano', sangue:2, rasgos:2, semente:88}});
zumbi('chef', 'Cozinheiro', {kit:'chef', pele:'#C9BBA0', cabelo:['calvo', '#4A3A2A'], pose:'z_agarrando', z:{olhos:'saltado', boca:'dentuco', nariz:'sem', sangue:3, rasgos:1, semente:31}});
zumbi('dorminhoco', 'Dorminhoco', {roupa:'pijama', pele:'#A7ADB4', cabelo:['espetado', '#3B241A'], pose:'z_arrastando', z:{olhos:'brancos', boca:'aberta', sangue:1, rasgos:1, podre:1, semente:3}});
zumbi('corredor', 'Corredor', {roupa:'agasalho', cores:cor4('#7A2E24', '#26282E', '#E8E4DC', '#E8E4DC'), pele:'#A58F9E', cabelo:['moicano', '#17120F'], pose:'z_correndo', z:{olhos:'vermelhos', boca:'rosnando', porte:'magro', sangue:2, rasgos:2, semente:52}});
zumbi('brutamontes', 'Brutamontes', {roupa:'regata', cores:cor4('#6E6A5E', '#39413A', '#2A1E16', '#8F4A2A'), pele:'#86A083', cabelo:['careca', '#1D1A17'], pose:'z_agarrando', z:{olhos:'vermelhos', boca:'presas', cranio:'caveira', porte:'forte', altura:1.22, cravado:'placa', sangue:2, rasgos:3, podre:3, semente:66}});
zumbi('inchado', 'Inchado', {roupa:'listrado', cores:cor4('#8A8F5A', '#4A4036', '#2A1E16', '#4E5B33'), pele:'#9FAE8C', cabelo:['calvo', '#2A2A1A'], pose:'z_torto', z:{olhos:'desiguais', boca:'caido', porte:'inchado', sangue:1, rasgos:3, podre:3, semente:14}});
zumbi('rastejante', 'Rastejante', {roupa:'xadrez', pele:'#8D9AA6', cabelo:['dreads', '#2A2118'], pose:'z_rastejando', z:{olhos:'fundos', boca:'aberta', pernas:'sem_perna', cranio:'aberto', sangue:2, rasgos:3, semente:29}});
zumbi('recente', 'Recém-infectado', {roupa:'wo', pele:'#A98A72', cabelo:['washington', '#1A1210'], barba:['washington', '#211713'], oculos:'redondos', pose:'z_torto', z:{olhos:'vermelhos', boca:'rosnando', sangue:1, rasgos:1, podre:1, falhas:false, semente:2}});

function configZumbi(id){
  const d = ZUMBIS[id], c = structuredClone(PADRAO_WASHINGTON);
  Object.assign(c, {nome:'zumbi-' + id.replace(/_/g, '-'), corpo:d.corpo || 'masculino', pele:d.pele, boca:'neutra', pose:d.pose,
    barba:{estilo:d.barba ? d.barba[0] : 'nenhuma', cor:d.barba ? d.barba[1] : '#211713'},
    cabelo:{estilo:d.cabelo[0], cor:d.cabelo[1]}, sobrancelha:{estilo:d.barba ? 'grossas' : 'finas', cor:d.cabelo[1]},
    oculos:{estilo:d.oculos || 'nenhum', cor:'#B9BEC6'}, lapis:{usa:false, cor:'#F16A32'}});
  if (d.kit) aplicarKit(c, d.kit); else c.roupa = d.roupa;
  if (d.cores) c.cores[c.roupa] = {...d.cores};
  c.zumbi = validarZumbi(d.z);
  return c;
}

/* zumbi aleatório: o mesmo número sempre gera o mesmo zumbi */
function zumbiAleatorio(semente){
  let s = (semente * 2654435761) >>> 0;
  const dado = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const um = lista => lista[Math.floor(dado() * lista.length)];
  const chance = (p, lista, senao) => dado() < p ? um(lista) : senao;
  const c = configZumbi('funcionario'), fem = dado() < .4;
  c.nome = 'zumbi-' + semente; c.corpo = fem ? 'feminino' : 'masculino'; c.pele = um(Z_PELES);
  c.cabelo = {estilo:um(fem ? ['rabo', 'chanel', 'ondulado', 'trancas', 'chiquinhas', 'dreads', 'coque', 'longo', 'crespo'] : ['careca', 'calvo', 'militar', 'lateral', 'espetado', 'moicano', 'dreads', 'cacheado', 'raspado', 'franja']), cor:um(['#17120F', '#3B241A', '#6B4226', '#A8743F', '#C9B23A', '#5A5A5E'])};
  c.barba = {estilo:fem ? 'nenhuma' : chance(.25, ['cheia', 'porfazer', 'bigode', 'cavanhaque'], 'nenhuma'), cor:c.cabelo.cor}; c.sobrancelha.cor = c.cabelo.cor;
  c.oculos = {estilo:chance(.12, ['redondos', 'grossos', 'quadrados'], 'nenhum'), cor:'#4B5058'};
  c.cores = {}; c.roupa = um(['casual', 'polo', 'xadrez', 'moletom', 'social', 'gravata', 'regata', 'listrado', 'agasalho', 'pijama', 'jaqueta_jeans', 'couro', 'oficina', 'surrado', 'medico', 'refletivo', 'praia', 'futebol']);
  const chapeu = chance(.14, ['bone', 'gorro', 'bone_virado', 'obra', 'selva'], 'nenhum');
  c.chapeu = {...c.chapeu, estilo:chapeu, cor:um(['#7A2E24', '#2F5F9E', '#4B5340', '#26282E', '#C4742E']), camo:false, visao:false, fones:false, goggles:false};
  c.colete = {estilo:chance(.07, ['tatico', 'improvisado', 'assalto'], 'nenhum'), cor:'#4B5340', camo:false};
  c.mochila = {estilo:chance(.08, ['urbana', 'improvisada'], 'nenhum'), cor:'#5C5340', camo:false};
  const porte = chance(.22, ['magro', 'magro', 'forte', 'inchado'], 'normal');
  const cranio = chance(.35, ['cerebro', 'aberto', 'ferida', 'ferida', 'caveira'], 'inteiro');
  if (cranio === 'cerebro') c.chapeu.estilo = 'nenhum';
  c.zumbi = validarZumbi({olhos:um(Object.keys(Z_OLHOS)), boca:um(Object.keys(Z_BOCAS)), nariz:chance(.15, ['sem'], 'normal'), cranio,
    barriga:chance(.28, ['aberta', 'costelas', 'ambas'], 'nada'), bracos:chance(.32, ['osso_e', 'osso_d', 'sem_mao', 'sem_braco'], 'nada'),
    pernas:chance(.3, ['osso_e', 'osso_d', 'ambas'], 'nada'), cravado:chance(.1, ['estaca', 'cano', 'placa'], 'nada'), porte,
    sangue:um([1, 2, 2, 3]), podre:um([1, 2, 2, 3]), rasgos:um([1, 2, 2, 3]), falhas:dado() < .6,
    altura:porte === 'forte' ? 1.12 + dado() * .16 : .92 + dado() * .14, semente:Math.floor(dado() * 99999)});
  c.pose = um(['z_bracos', 'z_bracos', 'z_arrastando', 'z_torto', 'z_agarrando', 'z_correndo', 'andando']);
  return c;
}
