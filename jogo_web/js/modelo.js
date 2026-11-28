/* Monta o personagem a partir das opções. Coordenadas finais com Y para cima (padrão do glTF), em metros.
   Resultado: {pecas: [{nome, pai, pivo, quads: [{v: [4 pontos relativos ao pivô], n, cor}]}], materiais usados em cada quad} */
const ESCALA = 0.0295;                     /* 1 bloco = 2,95 cm: personagem com cerca de 1,80 m */
const PAI = {quadril:null, cintura:'quadril', torax:'cintura', cabeca:'torax',
  braco_d:'torax', antebraco_d:'braco_d', mao_d:'antebraco_d', braco_e:'torax', antebraco_e:'braco_e', mao_e:'antebraco_e',
  coxa_d:'quadril', canela_d:'coxa_d', pe_d:'canela_d', coxa_e:'quadril', canela_e:'coxa_e', pe_e:'canela_e'};
const FACES = [
  [[-1,0,0], [[0,0,0],[0,0,1],[0,1,1],[0,1,0]]], [[1,0,0], [[1,0,0],[1,1,0],[1,1,1],[1,0,1]]],
  [[0,-1,0], [[0,0,0],[1,0,0],[1,0,1],[0,0,1]]], [[0,1,0], [[0,1,0],[0,1,1],[1,1,1],[1,1,0]]],
  [[0,0,-1], [[0,0,0],[0,1,0],[1,1,0],[1,0,0]]], [[0,0,1], [[0,0,1],[1,0,1],[1,1,1],[0,1,1]]]];
const CUBO = [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]];

function ruido(texto){ let h = 2166136261; for (let i = 0; i < texto.length; i++){ h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 100; }
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const hex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const tom = (h, f) => hex(rgb(h).map(v => v * f));
const misto = (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); };

/* todas as cores do personagem, derivadas das escolhidas */
function paleta(c){
  const r = ROUPAS[c.roupa], cor = k => (c.cores[c.roupa] && c.cores[c.roupa][k]) || (r.cores[k] ? r.cores[k][1] : '#888888');
  const p = c.pele, cab = c.cabelo.cor, bar = c.barba.cor;
  const m = {
    pele:p, pele_sombra:tom(p, .87), pele_luz:tom(p, 1.07), orelha:misto(tom(p, .9), '#A0452F', .18), olheira:tom(p, .82),
    cabelo:cab, raspado:misto(cab, p, .38), fade:misto(cab, p, .3), fade_claro:misto(cab, p, .6),
    barba:bar, barba_rala:misto(bar, p, .4), barba_sombra:misto(bar, p, .62), sobrancelha:c.sobrancelha.cor,
    branco:'#E6DDD4', iris:c.olhos, labio:misto(p, '#7A2F3A', .35), labio_escuro:misto(p, '#3A1512', .55), boca:'#3A1A16', dente:'#EDE8DC',
    sola:'#E9E6DC', metal:'#B9BEC6', preto:'#17171A', botao:'#AEB4B5', forro:'#C4D3D8', branco_roupa:'#EDEDE8',
    couro:'#6B4A33', faixa:'#D8D1BF', faixa_sombra:'#BDB5A1', verde:'#3F6B33', remendo:'#F16A32', remendo_claro:'#F5F5EF',
    aro:c.oculos.cor, lente:'#14171C', ponteira:'#17171A',
    metal_escuro:'#4B4F55', velcro:'#2F322C', visor:'#2B3A42', lente_verde:'#3FBF74', brilho:'#CFE9F2', luz:'#7CFF6B', lanterna:'#FFE9A8',
    lente_ambar:'#7A5320', lente_azul:'#2E7BC4', lente_vermelha:'#B8352E', palha:'#D9B66A', palha_sombra:'#BF9C52', palha_escuro:'#9C7E40', palha_claro:'#E8CB88',
    remendo_dourado:'#D9A32A', placa_borda:'#26262A', placa_amarela:'#F2C230',
    couro_sombra:'#573B28', couro_escuro:'#3F2B1D', cantil:'#4F5A3C', corda:'#B59A6A', sucata:'#8D9299', sucata_escura:'#5D636B', ferrugem:'#9A5530', saco:'#7A6248', saco_sombra:'#5F4B37', verde_escuro:'#2C4A24',
    lapis:c.lapis.cor, borracha:'#E8A39A', madeira:'#D9A878', grafite:'#1A1A1A',
  };
  for (const k of ['camisa', 'calca', 'calcado', 'detalhe', 'short']){
    const v = cor(k);
    m[k] = v; m[k + '_sombra'] = tom(v, .84); m[k + '_escuro'] = tom(v, .66); m[k + '_claro'] = misto(v, '#FFFFFF', .17);
  }
  const equip = {chapeu:c.chapeu.cor, colete:c.colete.cor, mochila:c.mochila.cor, cinto:c.cinto.cor, joelheira:c.joelheiras.cor, luva:c.luvas.cor, mascara:c.mascara.cor};
  if (c.zumbi) coresZumbi(c, m);
  const emb = EMBLEMAS[c.emblema?.estilo] || {};
  Object.assign(m, {filtro_rosa:'#C94F86', filtro_amarelo:'#E6C229'});
  for (const [s, f] of [['', 1], ['_sombra', .82]]) m['protetor' + s] = tom(c.protetor?.cor || '#2E7BC4', f);
  Object.assign(m, ARMA_CORES);
  m.pele_vinco = tom(p, .62);                                          /* separação entre os dedos */
  m.emb_fundo = emb.fundo || '#17171A'; m.emb_simbolo = emb.simbolo || '#F5F5EF'; m.borracha_eq = '#33363B'; m.medico_eq = '#2E7D46';
  Object.assign(m, {pm_texto:'#F1F1EC', pm_vermelho:'#C4261E', pm_luz_vermelha:'#FF4436', pm_limao:'#C8E02A', pm_refletivo:'#DDE3E6'});
  if (c.colete.estilo === 'transito') m.pm_limao = c.colete.cor;
  for (const [s, f] of [['', 1], ['_sombra', .82], ['_escuro', .6], ['_claro', 1.5]]) m['pm_preto' + s] = tom('#1D1E22', f);
  for (const [s, v] of [['', c.facial.cor], ['_sombra', tom(c.facial.cor, .82)]]) m['balaclava' + s] = v;
  for (const [k, v] of Object.entries(equip)){
    m[k] = v; m[k + '_sombra'] = tom(v, .82); m[k + '_escuro'] = tom(v, .6); m[k + '_claro'] = misto(v, '#FFFFFF', .2);
  }
  return m;
}
/* três tons por material, para o aspecto de pixels */
const LISOS = new Set(['branco', 'iris', 'sobrancelha', 'labio', 'labio_escuro', 'boca', 'dente', 'orelha', 'olheira', 'metal', 'aro', 'lente', 'ponteira', 'botao', 'grafite', 'madeira', 'borracha', 'lapis', 'remendo', 'remendo_claro',
  'metal_escuro', 'visor', 'lente_verde', 'brilho', 'luz', 'lanterna', 'preto', 'lente_ambar', 'lente_azul', 'lente_vermelha',
  'olho_morto', 'pupila', 'olho_vermelho', 'orbita', 'dente_podre', 'linha', 'remendo_dourado', 'placa_amarela', 'pm_texto', 'pm_vermelho', 'pm_luz_vermelha', 'pm_refletivo', 'emb_fundo', 'emb_simbolo', 'filtro_rosa']);
function tonalizar(pal, mat, chave){
  const base = pal[mat] || '#FF00FF';
  if (LISOS.has(mat)) return base;
  const r = ruido(chave);
  return r < 62 ? base : tom(base, r < 82 ? .955 : 1.045);
}

/* geometria da peça: coordenada de bloco -> mundo (Y para cima) */
function mundo(g, l){
  const w = [0, 1, 2].map(i => g.origem[i] + g.x[i] * l[0] + g.y[i] * l[1] + g.z[i] * l[2]);
  return [w[0] * ESCALA, w[2] * ESCALA, -w[1] * ESCALA];
}
const menos = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
function normalDe(a, b, c){
  const u = menos(b, a), v = menos(c, a);
  const n = [u[1]*v[2] - u[2]*v[1], u[2]*v[0] - u[0]*v[2], u[0]*v[1] - u[1]*v[0]], t = Math.hypot(...n) || 1;
  return n.map(x => x / t);
}

function pivos(){
  const out = {};
  for (const [nome, g] of Object.entries(ESTRUTURA)){
    const sobe = ['cabeca', 'torax', 'cintura'].includes(nome);
    const zs = g.vox.map(v => v[2]), k = sobe ? Math.min(...zs) : Math.max(...zs);
    const camada = g.vox.filter(v => v[2] === k);
    const c = [0, 1, 2].map(d => camada.reduce((a, v) => a + v[d], 0) / camada.length + .5);
    c[2] = k + (sobe ? 0 : 1);
    out[nome] = mundo(g, c);
  }
  return out;
}

/* ---------- tipo de corpo: mesma estrutura, com pequenas mudanças ---------- */
const BUSTO_I = [3, 4, 5, 8, 9, 10], BUSTO_K = [5, 6];
function blocosDoCorpo(c, nome, g){
  if (c.corpo !== 'feminino') return g.vox;
  if (nome === 'cintura') return g.vox.filter(([i]) => i !== 0 && i !== g.tam[0] - 1);   /* cintura marcada, lisa de cima a baixo */
  if (nome !== 'torax') return g.vox;
  const base = g.vox.filter(([i, j, k]) => !((i === 2 || i === 11) && k <= 2));
  if (c.colete.estilo !== 'nenhum') return base;                                       /* o colete cobre e achata o busto */
  for (const i of BUSTO_I) for (const k of BUSTO_K) base.push([i, -1, k]);
  return base;
}
/* o busto nunca aparece sem roupa: onde a roupa deixaria pele, entra um top */
function pintarFeminino(c, p){
  if (p.peca !== 'torax') return null;
  if (c.roupa === 'base'){
    if (p.k >= 3 && p.k <= 7) return p.k === 3 ? 'detalhe' : 'short';
    return (p.k > 7 && p.meio > 2.5 && p.meio < 3.6) ? 'short' : null;                 /* alças */
  }
  return (p.j < 0 && !PINTURAS[c.roupa](p)) ? 'short' : null;
}

function montar(c){
  const pal = paleta(c), piv = pivos(), pecas = {};
  for (const nome of Object.keys(PAI)) pecas[nome] = {nome, pai:PAI[nome], pivo:piv[nome], quads:[]};

  const removidas = new Set();                      /* peças que o zumbi perdeu: nada é preso nelas */
  for (const [nome, g] of Object.entries(ESTRUTURA)){
    /* o alto da cabeça escondido pelo chapéu não é desenhado, para não atravessar o tecido */
    const cobre = nome === 'cabeca' && c.chapeu.estilo !== 'nenhum' && !CHAPEUS_CIVIS[c.chapeu.estilo]?.semCortarCabelo;
    let blocos = cobre ? g.vox.filter(v => v[2] < 17) : blocosDoCorpo(c, nome, g), tirados = null;
    if (c.zumbi) ({blocos, tirados} = zumbiBlocos(c, nome, blocos));
    if (!blocos.length) removidas.add(nome);
    const cheios = new Set(blocos.map(v => v.join(',')));
    let extras = nome === 'cabeca' ? volumeCabelo(c.cabelo.estilo, cheios) : [];
    if (c.zumbi && (c.zumbi.cranio === 'cerebro' || c.zumbi.cranio === 'aberto')) extras = extras.filter(v => v[2] < 17);
    if (c.chapeu.estilo !== 'nenhum' && !CHAPEUS_CIVIS[c.chapeu.estilo]?.semCortarCabelo) extras = extras.filter(v => v[2] < 15 && (v[1] >= 0 || v[2] < 14));      /* o cabelo alto fica por baixo do chapéu */
    if (c.facial.estilo === 'balaclava' || CAPUZES.includes(c.chapeu.estilo)) extras = [];
    const doCabelo = new Set(extras.map(v => v.join(',')));
    const todos = new Set([...cheios, ...doCabelo]);
    const kTopo = Math.max(...g.vox.map(v => v[2]));
    for (const v of [...blocos, ...extras]){
      const [i, j, k] = v, chave = `${nome}|${i},${j},${k}`;
      for (const [d, quad] of FACES){
        if (todos.has(`${i + d[0]},${j + d[1]},${k + d[2]}`)) continue;
        let mat;
        if (doCabelo.has(v.join(','))) mat = (c.zumbi?.falhas && ruido(`z${c.zumbi.semente}|tufo|${i >> 1},${j >> 1},${k >> 1}`) < 12) ? 'podre_escuro' : 'cabelo';
        else {
          const p = {peca:nome, i, j, k, n:d, tam:g.tam, meio:Math.abs(i + .5 - g.tam[0] / 2), frente:d[1] < 0, tras:d[1] > 0, topo:kTopo - k};
          if (nome === 'cabeca') mat = pintarCabeca(c, i, j, k, d);
          else {
            if (c.luvas.estilo !== 'nenhum' && (nome === 'mao_d' || nome === 'mao_e')) mat = (k <= 1 && j % 2 === 1) ? 'luva_sombra' : 'luva';
            else mat = (c.corpo === 'feminino' && pintarFeminino(c, p)) || PINTURAS[c.roupa](p) || pintarPele(p);
          }
        }
        if (c.zumbi && !doCabelo.has(v.join(','))) mat = zumbiPinta(c, {peca:nome, i, j, k, n:d, tam:g.tam, meio:Math.abs(i + .5 - g.tam[0] / 2), frente:d[1] < 0, tras:d[1] > 0, topo:kTopo - k}, mat, tirados);
        const pts = quad.map(q => mundo(g, [i + q[0], j + q[1], k + q[2]]));
        pecas[nome].quads.push({v:pts.map(x => menos(x, piv[nome])), n:normalDe(pts[0], pts[1], pts[2]), cor:tonalizar(pal, mat, chave)});
      }
    }
  }

  /* caixa solta em coordenadas de blocos de uma peça (óculos, chapéu, mochila, bolsos...).
     Cada face é dividida em pixels de cerca de 1 bloco, para ter a mesma textura do corpo. */
  let numero = 0;
  const cx = (peca, x0, x1, y0, y1, z0, z1, mat, camo = false) => {
    const g = ESTRUTURA[peca];
    const q = [[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
    const id = numero++, liso = LISOS.has(mat);
    const mistura = (a, b, t) => [0, 1, 2].map(i => a[i] + (b[i] - a[i]) * t);
    CUBO.forEach((f, face) => {
      const [A, B, C, D] = f.map(i => q[i]);
      const lado = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      const nu = liso ? 1 : Math.max(1, Math.round(lado(A, B))), nv = liso ? 1 : Math.max(1, Math.round(lado(A, D)));
      for (let u = 0; u < nu; u++) for (let v = 0; v < nv; v++){
        const em = (s, t) => mistura(mistura(A, B, s), mistura(D, C, s), t);
        const cantos = [em(u / nu, v / nv), em((u + 1) / nu, v / nv), em((u + 1) / nu, (v + 1) / nv), em(u / nu, (v + 1) / nv)];
        let nome = mat;
        if (camo){
          const meio = em((u + .5) / nu, (v + .5) / nv), base = mat.replace(/_(sombra|escuro|claro)$/, '');
          const h = ruido(`camo|${peca}|${Math.floor(meio[0] / 1.6)},${Math.floor(meio[1] / 1.6)},${Math.floor(meio[2] / 1.2)}`);
          if (h < 26) nome = base + '_escuro'; else if (h < 42) nome = base + '_claro'; else if (h < 52) nome = base + '_sombra';
        }
        const cor = liso ? pal[nome] : tonalizar(pal, nome, `${id}|${face}|${u},${v}`);
        const pts = cantos.map(p => mundo(g, p));
        pecas[peca].quads.push({v:pts.map(x => menos(x, piv[peca])), n:normalDe(pts[0], pts[1], pts[2]), cor:cor || '#FF00FF'});
      }
    });
  };
  if (EXTRAS_DA_ROUPA[c.roupa]) EXTRAS_DA_ROUPA[c.roupa]((peca, ...a) => { if (!(peca === 'torax' && c.colete.estilo !== 'nenhum') && !(peca === 'quadril' && c.cinto.usa)) cx(peca, ...a); });
  /* equipamentos presos em peças perdidas não ficam flutuando; ossos e tocos são desenhados depois */
  const presos = (peca, ...a) => { if (!removidas.has(peca)) cx(peca, ...a); };
  acessorios(c, presos);
  equipar(c, presos);
  if (typeof Maos === 'object') Maos.aplicar(c, presos, pecas);          /* mãos fechadas na arma */
  if (c.zumbi){
    zumbiExtras(c, cx);
    zumbiPorte(c, pecas);
    const f = c.zumbi.altura;
    if (f !== 1) for (const p of Object.values(pecas)){ p.pivo = p.pivo.map(v => v * f); for (const q of p.quads) q.v = q.v.map(v => v.map(x => x * f)); }
  }
  return {pecas:Object.values(pecas), piv, arma:c.arma && c.arma.estilo !== 'nenhum' ? c.arma.estilo : null, mods:c.modarma};
}

function pintarPele(p){
  if (p.peca === 'torax' && p.frente){
    if (p.k === 5 && p.meio > .9 && p.meio < 5.5) return 'pele_sombra';
    if (p.meio < .6 && p.k > 5 && p.k <= 8) return 'pele_sombra';
  }
  if (p.peca === 'cintura' && p.frente && p.meio < .6 && p.k === 1) return 'pele_sombra';
  if ((p.peca === 'mao_d' || p.peca === 'mao_e') && p.k <= 1 && p.j % 2 === 1) return 'pele_sombra';
  return 'pele';
}

function acessorios(c, cx){
  /* óculos: x medido a partir do meio do rosto (7) */
  const o = c.oculos.estilo;
  if (OCULOS_NOVOS[o]) OCULOS_NOVOS[o].desenhar((x0, x1, y0, y1, z0, z1, mat = 'aro') => cx('cabeca', 7 + Math.min(x0, x1), 7 + Math.max(x0, x1), y0, y1, z0, z1, mat));
  else if (o !== 'nenhum'){
    const r = (x0, x1, y0, y1, z0, z1, m = 'aro') => cx('cabeca', 7 + Math.min(x0, x1), 7 + Math.max(x0, x1), y0, y1, z0, z1, m);
    const e = .28, y0 = -.62, y1 = -.34;
    for (const s of [-1, 1]){
      if (o === 'redondos'){
        r(s*1.35, s*4.35, y0, y1, 12.05, 12.05 + e); r(s*1.35, s*4.35, y0, y1, 8.65, 8.65 + e);
        r(s*.75, s*(.75 + e), y0, y1, 9.35, 11.65); r(s*(4.95 - e), s*4.95, y0, y1, 9.35, 11.65);
        for (const [ax, az] of [[.9, 11.6], [4.38, 11.6], [.9, 9], [4.38, 9]]) r(s*ax, s*(ax + .42), y0, y1, az, az + .5);
      } else {
        r(s*.75, s*4.95, y0, y1, 11.9, 11.9 + e); r(s*.75, s*4.95, y0, y1, 8.8, 8.8 + e);
        r(s*.75, s*(.75 + e), y0, y1, 8.8, 12.1); r(s*(4.95 - e), s*4.95, y0, y1, 8.8, 12.1);
        if (o === 'escuros') r(s*1, s*4.7, -.5, -.36, 9.05, 11.95, 'lente');
      }
      r(s*4.8, s*6.35, y0, y1, 11, 11 + e); r(s*6.08, s*6.35, y0, 4.6, 11, 11 + e); r(s*6.05, s*6.4, 4.6, 6.4, 10.95, 11.35, 'ponteira');
    }
    r(-.75, .75, y0, y1, 11.2, 11.2 + e);
  }
  if (c.lapis.usa && !armado(c)){
    const t = ESTRUTURA.mao_d.tam, x = t[0] / 2 - .45, z = 1.1, w = .9;
    cx('mao_d', x, x + w, t[1] + .6, t[1] + 1.8, z, z + w, 'borracha'); cx('mao_d', x - .05, x + w + .05, t[1], t[1] + .6, z - .05, z + w + .05, 'metal');
    cx('mao_d', x, x + w, -4.5, t[1], z, z + w, 'lapis'); cx('mao_d', x + .15, x + w - .15, -5.7, -4.5, z + .15, z + w - .15, 'madeira');
    cx('mao_d', x + .32, x + w - .32, -6.3, -5.7, z + .32, z + w - .32, 'grafite');
  }
}

/* ---------------------------------------------------------------- poses (ângulos em radianos: [x, y, z] com Y para cima) */
const ANGULOS = {
  descanso:{},
  acenando:{braco_d:[0, 0, -1.55], antebraco_d:[0, 0, -1.35], cabeca:[0, 0, .07]},
  andando:{coxa_d:[-.45, 0, 0], canela_d:[.25, 0, 0], coxa_e:[.35, 0, 0], canela_e:[.4, 0, 0], braco_d:[.5, 0, 0], braco_e:[-.55, 0, 0], antebraco_e:[-.4, 0, 0], torax:[0, .1, 0]},
  apontando:{braco_e:[-.25, 0, 1.25], antebraco_e:[-.15, 0, .2], cabeca:[0, .18, 0]},
  bracos:{braco_d:[0, 0, -1.2], braco_e:[0, 0, 1.2]},
};
function quatEuler([a, b, c]){                                   /* ordem: X, depois Z, depois Y */
  const q = (eixo, t) => { const s = Math.sin(t / 2), r = [0, 0, 0, Math.cos(t / 2)]; r[eixo] = s; return r; };
  const m = (p, o) => [p[3]*o[0] + p[0]*o[3] + p[1]*o[2] - p[2]*o[1], p[3]*o[1] - p[0]*o[2] + p[1]*o[3] + p[2]*o[0],
                       p[3]*o[2] + p[0]*o[1] - p[1]*o[0] + p[2]*o[3], p[3]*o[3] - p[0]*o[0] - p[1]*o[1] - p[2]*o[2]];
  return m(m(q(1, b), q(2, c)), q(0, a));
}
function girar(q, v){
  const [x, y, z, w] = q, tx = 2*(y*v[2] - z*v[1]), ty = 2*(z*v[0] - x*v[2]), tz = 2*(x*v[1] - y*v[0]);
  return [v[0] + w*tx + y*tz - z*ty, v[1] + w*ty + z*tx - x*tz, v[2] + w*tz + x*ty - y*tx];
}
const soma = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/* aplica a pose: devolve os quads em coordenadas do mundo, com os pés no chão e o personagem centrado */
function posar(modelo, nomePose){
  const reto = typeof Animacao === 'object' ? Animacao.daPose(nomePose, modelo.arma, modelo.mods) : null;   /* andar, mirar e segurar arma */
  const ang = reto ? {} : ANGULOS[nomePose] || {}, porNome = Object.fromEntries(modelo.pecas.map(p => [p.nome, p])), feitos = {};
  if (reto) Object.assign(feitos, Animacao.globais(reto));
  const mult = (p, o) => [p[3]*o[0] + p[0]*o[3] + p[1]*o[2] - p[2]*o[1], p[3]*o[1] - p[0]*o[2] + p[1]*o[3] + p[2]*o[0],
                          p[3]*o[2] + p[0]*o[1] - p[1]*o[0] + p[2]*o[3], p[3]*o[3] - p[0]*o[0] - p[1]*o[1] - p[2]*o[2]];
  const no = nome => {
    if (feitos[nome]) return feitos[nome];
    const p = porNome[nome], local = quatEuler(ang[nome] || [0, 0, 0]);
    if (!p.pai) return (feitos[nome] = {pos:p.pivo, q:local});
    const pai = no(p.pai);
    return (feitos[nome] = {pos:soma(pai.pos, girar(pai.q, menos(p.pivo, porNome[p.pai].pivo))), q:mult(pai.q, local)});
  };
  const quads = [];
  for (const p of modelo.pecas){
    const t = no(p.nome);
    for (const f of (typeof Maos === 'object' ? Maos.quadsDaPeca(p, nomePose) : p.quads)) quads.push({peca:p.nome, v:f.v.map(v => soma(t.pos, girar(t.q, v))), n:girar(t.q, f.n), cor:f.cor});
  }
  const lim = [[1e9, -1e9], [1e9, -1e9], [1e9, -1e9]];
  for (const f of quads) if (f.peca === 'quadril') for (const v of f.v) for (let d = 0; d < 3; d++){ lim[d][0] = Math.min(lim[d][0], v[d]); lim[d][1] = Math.max(lim[d][1], v[d]); }
  let chao = 1e9; for (const f of quads) for (const v of f.v) chao = Math.min(chao, v[1]);
  const desloca = [-(lim[0][0] + lim[0][1]) / 2, -chao, -(lim[2][0] + lim[2][1]) / 2];
  for (const f of quads) f.v = f.v.map(v => soma(v, desloca));
  return {quads, desloca, angulos:ang, juntas:feitos};
}
