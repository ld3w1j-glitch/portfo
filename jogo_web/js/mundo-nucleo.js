/* Núcleo do Gerador de mundo: grade de alturas, materiais, pincéis, desfazer, ruas, geração dos voxels e arquivos.
   Não usa a página: dá para testar fora do navegador.
   Coordenadas em metros: x para o leste, z para o sul, y é a altitude. O centro (0, 0) é o ponto escolhido no mapa. */
const Mundo = (() => {
  /* alturas a cada 2 m (N pontos); material e água em quadrados de 1 m (C por lado), para ruas e calçadas não serrilharem */
  const LADO = 2048, CEL = 2, N = LADO / CEL + 1, CM = 1, C = LADO / CM, MEIO = LADO / 2;
  const PEDACO = 64, PEDACOS = LADO / PEDACO;

  const MATERIAIS = [
    {id:'auto', nome:'Automático', cor:null},
    {id:'grama', nome:'Grama', cor:'#618A3C'}, {id:'grama_seca', nome:'Pasto seco', cor:'#8E9047'}, {id:'terra', nome:'Terra', cor:'#8A6340'},
    {id:'terra_vermelha', nome:'Terra vermelha', cor:'#A0522D'}, {id:'pedra', nome:'Pedra', cor:'#827E76'}, {id:'asfalto', nome:'Asfalto', cor:'#46484D'},
    {id:'calcada', nome:'Calçada', cor:'#A8A49A'}, {id:'concreto', nome:'Concreto (lote)', cor:'#B9B3A6'}, {id:'areia', nome:'Areia', cor:'#C2A877'},
    {id:'lavoura', nome:'Lavoura', cor:'#8E7434'}, {id:'mata', nome:'Mata', cor:'#47702F'}, {id:'agua', nome:'Água', cor:'#4E7C86'}, {id:'rua_terra', nome:'Rua de terra', cor:'#A8784C'},
  ];
  const M = Object.fromEntries(MATERIAIS.map((m, i) => [m.id, i]));
  /* quanto a rugosidade aparece em cada material (ruas, calçadas e água ficam lisas) */
  const RUGOSO = [1, 1, 1, 1, 1, 1.8, 0, 0, .05, .6, .35, 1.2, 0, .12];
  const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
  const CORES = MATERIAIS.map(m => m.cor ? hex(m.cor) : [0, 0, 0]);

  const ESTILOS = {liso:'Liso', rampas:'Rampas facetadas', degraus:'Degraus finos', blocos:'Blocos (tipo Minecraft)'};
  const FERRAMENTAS = {elevar:'Elevar', rebaixar:'Rebaixar', suavizar:'Suavizar', nivelar:'Nivelar', terraco:'Platôs e barrancos', acidentar:'Acidentar', pintar:'Pintar', rua:'Traçar rua', agua:'Criar água', restaurar:'Restaurar original'};

  /* ---------------------------------------------------------- ruído */
  function sorteio(x, y, s){ let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function ruido2(x, y, s){
    const i = Math.floor(x), j = Math.floor(y); let u = x - i, v = y - j; u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
    const a = sorteio(i, j, s), b = sorteio(i + 1, j, s), c = sorteio(i, j + 1, s), d = sorteio(i + 1, j + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  /* ---------------------------------------------------------- estado */
  const m = {
    h:new Float32Array(N * N), base:new Float32Array(N * N),
    mat:new Uint8Array(C * C), baseMat:new Uint8Array(C * C),
    agua:new Float32Array(C * C),                              /* altitude da superfície da água; 0 = sem água */
    cfg:{estilo:'liso', rugosidade:.35, exagero:1, fonte:'bairro'},
    sujos:new Set(),                                           /* pedaços que precisam ser redesenhados */
    desfazer:[], refazer:[], traco:null, referencia:880,
    ruas:[], ruasBase:0,                                       /* traçado das ruas: é por ele que as casas se orientam */
    povo:povoPadrao(),
    zonas:zonasPadrao(),
  };
  function zonasPadrao(){ return {tamanho:150, proximo:1, sementes:[]}; }
  function povoPadrao(){ return {ativo:false, semente:7, casas:.85, vegetacao:.6, rua:.6, estado:'abandonado', removidos:[], manuais:[]}; }

  /* ---------------------------------------------------------- relevo de origem */
  function lerDados(D){
    const bin = typeof atob === 'function' ? Uint8Array.from(atob(D.alturas), c => c.charCodeAt(0)) : Uint8Array.from(Buffer.from(D.alturas, 'base64'));
    const W = D.largura, a = new Float32Array(W * W);
    for (let i = 0; i < W * W; i++) a[i] = D.altMin + (bin[2 * i] | (bin[2 * i + 1] << 8)) * D.escala;
    /* o dado original tem alguns pixels defeituosos (muito abaixo do resto): troca pela média dos vizinhos bons */
    const ordenado = Float32Array.from(a).sort(), piso = ordenado[Math.floor(W * W * .001)] > 0 ? ordenado[Math.floor(W * W * .001)] - 25 : ordenado[Math.floor(W * W * .01)] - 25;
    let ruins = []; for (let i = 0; i < W * W; i++) if (a[i] < piso) ruins.push(i);
    const corrigidos = ruins.length;
    for (let passo = 0; ruins.length && passo < 20; passo++){
      const sobram = [];
      for (const i of ruins){
        let soma = 0, n = 0; const x = i % W, y = (i / W) | 0;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++){ const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < W && a[Y * W + X] >= piso){ soma += a[Y * W + X]; n++; } }
        if (n) a[i] = soma / n; else sobram.push(i);
      }
      ruins = sobram;
    }
    return {a, W, corrigidos};
  }
  const catmull = (p0, p1, p2, p3, t) => p1 + .5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)));
  function amostraDados(R, px, py){
    const i = Math.floor(px), j = Math.floor(py), u = px - i, v = py - j, W = R.W;
    const em = (x, y) => R.a[Math.max(0, Math.min(W - 1, y)) * W + Math.max(0, Math.min(W - 1, x))];
    const l = k => catmull(em(i - 1, j + k), em(i, j + k), em(i + 1, j + k), em(i + 2, j + k), u);
    return catmull(l(-1), l(0), l(1), l(2), v);
  }
  function suavizaGrade(g, passadas){
    const tmp = new Float32Array(g.length);
    for (let p = 0; p < passadas; p++){
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) tmp[j * N + i] = (g[j * N + Math.max(0, i - 2)] + 2 * g[j * N + i] + g[j * N + Math.min(N - 1, i + 2)]) / 4;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) g[j * N + i] = (tmp[Math.max(0, j - 2) * N + i] + 2 * tmp[j * N + i] + tmp[Math.min(N - 1, j + 2) * N + i]) / 4;
    }
  }
  /* cria o mundo a partir do relevo do bairro, de um terreno plano ou de morros inventados */
  function criar(fonte = 'bairro', D = null, semente = 1){
    let corrigidos = 0;
    if (fonte === 'bairro' && D){
      const R = lerDados(D); corrigidos = R.corrigidos;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++){
        const x = i * CEL - MEIO, z = j * CEL - MEIO;
        m.base[j * N + i] = amostraDados(R, D.centroPx + x / D.metrosPorPixel - .5, D.centroPy + z / D.metrosPorPixel - .5);
      }
      suavizaGrade(m.base, 3);                                 /* o satélite mede também telhados e árvores: tira o serrilhado */
    } else if (fonte === 'morros'){
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++){
        const x = i * CEL, z = j * CEL;
        m.base[j * N + i] = 820 + ruido2(x / 420, z / 420, semente) * 90 + ruido2(x / 150, z / 150, semente + 1) * 28 + ruido2(x / 55, z / 55, semente + 2) * 7;
      }
    } else m.base.fill(840);
    m.cfg.fonte = fonte;
    m.h.set(m.base); m.mat.fill(0); m.baseMat.fill(0); m.agua.fill(0); m.baseAgua = null;
    m.desfazer = []; m.refazer = []; m.traco = null;
    m.ruas = []; m.ruasBase = 0; m.povo = povoPadrao(); m.zonas = zonasPadrao();
    m.referencia = m.base[Math.floor(N / 2) * N + Math.floor(N / 2)];
    sujarTudo();
    return {corrigidos};
  }
  /* o estado de agora passa a ser o "original" (usado depois de aplicar as ruas do bairro) */
  function fixarBase(){ m.base.set(m.h); m.baseMat.set(m.mat); m.baseAgua = Float32Array.from(m.agua); m.ruasBase = m.ruas.length; m.desfazer = []; m.refazer = []; }
  const sujarTudo = () => { for (let i = 0; i < PEDACOS * PEDACOS; i++) m.sujos.add(i); };
  function sujarArea(x0, z0, x1, z1){
    const a = Math.max(0, Math.floor((x0 + MEIO - 10) / PEDACO)), b = Math.min(PEDACOS - 1, Math.floor((x1 + MEIO + 10) / PEDACO));
    const c = Math.max(0, Math.floor((z0 + MEIO - 10) / PEDACO)), d = Math.min(PEDACOS - 1, Math.floor((z1 + MEIO + 10) / PEDACO));
    for (let j = c; j <= d; j++) for (let i = a; i <= b; i++) m.sujos.add(j * PEDACOS + i);
  }

  /* ---------------------------------------------------------- consultas */
  const limita = (v, a, b) => v < a ? a : v > b ? b : v;
  function alturaGrade(g, x, z){
    const fx = limita((x + MEIO) / CEL, 0, N - 1.0001), fz = limita((z + MEIO) / CEL, 0, N - 1.0001), i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, k = j * N + i;
    return (g[k] * (1 - u) + g[k + 1] * u) * (1 - v) + (g[k + N] * (1 - u) + g[k + N + 1] * u) * v;
  }
  const celula = (x, z) => limita(((z + MEIO) / CM) | 0, 0, C - 1) * C + limita(((x + MEIO) / CM) | 0, 0, C - 1);
  function rugoso(x, z){
    const fx = limita((x + MEIO) / CM - .5, 0, C - 1.001), fz = limita((z + MEIO) / CM - .5, 0, C - 1.001), i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, k = j * C + i;
    return (RUGOSO[m.mat[k]] * (1 - u) + RUGOSO[m.mat[k + 1]] * u) * (1 - v) + (RUGOSO[m.mat[k + C]] * (1 - u) + RUGOSO[m.mat[k + C + 1]] * u) * v;
  }
  /* altitude final: grade editável (com o exagero) mais a rugosidade, que é inventada */
  function altura(x, z){
    let y = alturaGrade(m.h, x, z);
    if (m.cfg.exagero !== 1) y = m.referencia + (y - m.referencia) * m.cfg.exagero;
    const r = m.cfg.rugosidade;
    if (r > 0) y += ((ruido2(x / 17, z / 17, 5) - .5) * 1.7 + (ruido2(x / 5.5, z / 5.5, 9) - .5) * .55) * r * rugoso(x, z);
    return y;
  }
  function inclinacao(x, z){ const d = 3, a = alturaGrade(m.h, x + d, z) - alturaGrade(m.h, x - d, z), b = alturaGrade(m.h, x, z + d) - alturaGrade(m.h, x, z - d); return Math.hypot(a, b) / (2 * d) * m.cfg.exagero; }
  function materialEm(x, z){ return m.mat[celula(x, z)] || materialNatural(x, z); }
  /* o chão que existiria ali sem nada pintado */
  function materialNatural(x, z){
    const s = inclinacao(x, z) + (ruido2(x / 23, z / 23, 3) - .5) * .12;
    if (s > .62) return M.pedra;
    if (s > .4) return M.terra_vermelha;
    /* manchas grandes e raras, com a borda tremida, para o pasto não parecer camuflagem */
    const mancha = ruido2(x / 170, z / 170, 11) * .72 + ruido2(x / 39, z / 39, 12) * .22 + ruido2(x / 7, z / 7, 13) * .06;
    if (mancha > .67) return M.grama_seca;
    if (mancha < .25) return M.mata;
    return ruido2(x / 61, z / 61, 17) * .8 + ruido2(x / 9, z / 9, 18) * .2 > .8 ? M.terra : M.grama;
  }
  /* voxel grande (visto de longe): olha quatro pontos, para as ruas continuarem inteiras em vez de pontilhadas */
  function materialDeLonge(x, z, s){
    let asfalto = 0, terra = 0;
    for (const [dx, dz] of [[-.25, -.25], [.25, -.25], [-.25, .25], [.25, .25]]){ const k = m.mat[celula(x + dx * s, z + dz * s)]; if (k === M.asfalto) asfalto++; else if (k === M.rua_terra) terra++; }
    if (asfalto >= (s >= 4 ? 1 : 2)) return M.asfalto;
    if (terra >= 2) return M.rua_terra;
    const centro = materialEm(x, z);
    return centro === M.calcada && s >= 4 ? M.concreto : centro;
  }
  /* quem desenha o passeio detalhado diz o que o terreno mostra no lugar da calçada quadriculada */
  let trocaCalcada = null;
  const definirCalcada = fn => { trocaCalcada = fn; };
  function materialDesenhado(x, z, s){
    const mat = s > 1 ? materialDeLonge(x, z, s) : materialEm(x, z);
    if (mat !== M.calcada || s > 2 || !trocaCalcada) return mat;
    const q = trocaCalcada(x, z);
    return q === 'asfalto' ? M.asfalto : q === 'natural' ? materialNatural(x, z) : mat;
  }
  /* cor do voxel: cor do material com três tons, como um pixel */
  function corVoxel(mat, x, z, s){
    const c = CORES[mat], t = sorteio(Math.floor(x / s), Math.floor(z / s), 23), mancha = ruido2(x / 13, z / 13, 31);
    let f = t < .16 ? .93 : t > .86 ? 1.065 : 1;
    if (mat !== M.asfalto && mat !== M.calcada) f *= .95 + mancha * .1;
    return [Math.min(255, c[0] * f) | 0, Math.min(255, c[1] * f) | 0, Math.min(255, c[2] * f) | 0];
  }

  /* ---------------------------------------------------------- desfazer */
  function iniciarTraco(){ m.traco = {h:new Map(), mat:new Map(), agua:new Map(), ruas:[], area:[1e9, 1e9, -1e9, -1e9]}; }
  function anota(mapa, vetor, k){ if (m.traco && !mapa.has(k)) mapa.set(k, vetor[k]); }
  function marca(x0, z0, x1, z1){ sujarArea(x0, z0, x1, z1); if (m.traco){ const a = m.traco.area; a[0] = Math.min(a[0], x0); a[1] = Math.min(a[1], z0); a[2] = Math.max(a[2], x1); a[3] = Math.max(a[3], z1); } }
  function encerrarTraco(){
    const t = m.traco; m.traco = null;
    if (!t || !(t.h.size || t.mat.size || t.agua.size || t.ruas.length || t.povo || t.zonas)) return false;
    m.desfazer.push(t); if (m.desfazer.length > 40) m.desfazer.shift(); m.refazer = [];
    return true;
  }
  function trocar(origem, destino){
    const t = origem.pop(); if (!t) return false;
    const volta = {h:new Map(), mat:new Map(), agua:new Map(), ruas:[], area:t.area};
    /* ruas: o que foi acrescentado sai, e o que tinha saído volta */
    if (t.ruas.length){
      if (m.ruas.includes(t.ruas[0])){ m.ruas = m.ruas.filter(r => !t.ruas.includes(r)); }
      else m.ruas.push(...t.ruas);
      volta.ruas = t.ruas;
    }
    /* objetos colocados ou apagados à mão */
    if (t.povo){ volta.povo = {removidos:m.povo.removidos.slice(), manuais:m.povo.manuais.slice()}; m.povo.removidos = t.povo.removidos; m.povo.manuais = t.povo.manuais; }
    if (t.zonas){ volta.zonas = m.zonas; m.zonas = t.zonas; }
    for (const nome of ['h', 'mat', 'agua']) for (const [k, v] of t[nome]){ volta[nome].set(k, m[nome][k]); m[nome][k] = v; }
    sujarArea(...t.area); destino.push(volta); return true;
  }
  const desfazer = () => trocar(m.desfazer, m.refazer), refazer = () => trocar(m.refazer, m.desfazer);

  /* ---------------------------------------------------------- pincéis */
  const queda = (d, r) => { const t = 1 - d / r; return t <= 0 ? 0 : t * t * (3 - 2 * t); };
  function cadaPonto(x, z, raio, fn){
    const a = Math.max(0, Math.ceil((x - raio + MEIO) / CEL)), b = Math.min(N - 1, Math.floor((x + raio + MEIO) / CEL)), c = Math.max(0, Math.ceil((z - raio + MEIO) / CEL)), d = Math.min(N - 1, Math.floor((z + raio + MEIO) / CEL));
    for (let j = c; j <= d; j++) for (let i = a; i <= b; i++){ const px = i * CEL - MEIO, pz = j * CEL - MEIO, dist = Math.hypot(px - x, pz - z); if (dist < raio) fn(j * N + i, px, pz, dist); }
  }
  function cadaCelula(x, z, raio, fn){
    const a = Math.max(0, Math.floor((x - raio + MEIO) / CM)), b = Math.min(C - 1, Math.floor((x + raio + MEIO) / CM)), c = Math.max(0, Math.floor((z - raio + MEIO) / CM)), d = Math.min(C - 1, Math.floor((z + raio + MEIO) / CM));
    for (let j = c; j <= d; j++) for (let i = a; i <= b; i++){ const px = (i + .5) * CM - MEIO, pz = (j + .5) * CM - MEIO, dist = Math.hypot(px - x, pz - z); if (dist < raio) fn(j * C + i, px, pz, dist); }
  }
  const poeH = (k, v) => { anota(m.traco?.h, m.h, k); m.h[k] = v; };
  const poeMat = (k, v) => { if (m.mat[k] === v) return; anota(m.traco?.mat, m.mat, k); m.mat[k] = v; };
  const poeAgua = (k, v) => { if (m.agua[k] === v) return; anota(m.traco?.agua, m.agua, k); m.agua[k] = v; };

  /* aplica um "carimbo" do pincel. op = {raio, forca 0..1, dt (segundos), material, alvo, passo, profundidade} */
  function pincel(ferramenta, x, z, op){
    const {raio, forca = .5, dt = .05} = op;
    if (ferramenta === 'elevar' || ferramenta === 'rebaixar'){
      const s = ferramenta === 'elevar' ? 1 : -1, quanto = (1 + forca * 17) * dt;
      cadaPonto(x, z, raio, (k, px, pz, d) => poeH(k, m.h[k] + s * quanto * queda(d, raio)));
    } else if (ferramenta === 'suavizar'){
      const novos = [], salto = Math.max(1, Math.round(raio / 14));
      cadaPonto(x, z, raio, (k, px, pz, d) => {
        const i = k % N, j = (k / N) | 0; let soma = 0, n = 0;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++){ const X = i + dx * salto, Y = j + dy * salto; if (X >= 0 && Y >= 0 && X < N && Y < N){ soma += m.h[Y * N + X]; n++; } }
        novos.push([k, m.h[k] + (soma / n - m.h[k]) * Math.min(1, (1 + forca * 9) * dt) * Math.min(1, queda(d, raio) * 1.6)]);
      });
      for (const [k, v] of novos) poeH(k, v);
    } else if (ferramenta === 'nivelar'){
      cadaPonto(x, z, raio, (k, px, pz, d) => poeH(k, m.h[k] + (op.alvo - m.h[k]) * Math.min(1, (1 + forca * 11) * dt * Math.min(1, queda(d, raio) * 2.2))));
    } else if (ferramenta === 'terraco'){
      const passo = op.passo || 4;
      cadaPonto(x, z, raio, (k, px, pz, d) => { const alvo = Math.round(m.h[k] / passo) * passo; poeH(k, m.h[k] + (alvo - m.h[k]) * Math.min(1, (1 + forca * 9) * dt * Math.min(1, queda(d, raio) * 2))); });
    } else if (ferramenta === 'acidentar'){
      cadaPonto(x, z, raio, (k, px, pz, d) => poeH(k, m.h[k] + ((ruido2(px / 9, pz / 9, 41) - .5) + (ruido2(px / 4, pz / 4, 43) - .5) * .4) * (2 + forca * 18) * dt * queda(d, raio)));
    } else if (ferramenta === 'pintar'){
      cadaCelula(x, z, raio, (k, px, pz, d) => { if (d < raio * .82 || sorteio(k, 7, 3) < (raio - d) / (raio * .18)){ poeMat(k, op.material); if (op.material !== M.agua) poeAgua(k, 0); } });
    } else if (ferramenta === 'agua'){
      const nivel = op.alvo - .4, fundo = op.profundidade || 3;
      cadaPonto(x, z, raio + 3, (k, px, pz, d) => { if (d < raio) poeH(k, Math.min(m.h[k], nivel - fundo * Math.min(1, queda(d, raio) * 2))); });
      cadaCelula(x, z, raio, k => { poeAgua(k, nivel); poeMat(k, M.areia); });
      cadaCelula(x, z, raio + 4, (k, px, pz, d) => { if (d >= raio && !m.agua[k] && !m.mat[k]) poeMat(k, M.areia); });
    } else if (ferramenta === 'restaurar'){
      cadaPonto(x, z, raio, (k, px, pz, d) => poeH(k, m.h[k] + (m.base[k] - m.h[k]) * Math.min(1, queda(d, raio) * 3)));
      cadaCelula(x, z, raio * .9, k => { poeMat(k, m.baseMat[k]); poeAgua(k, m.baseAgua ? m.baseAgua[k] : 0); });
    }
    marca(x - raio - 6, z - raio - 6, x + raio + 6, z + raio + 6);
  }

  /* ---------------------------------------------------------- ruas: acompanham o terreno, mas ficam lisas e sem degrau de um lado para o outro */
  function tracarRua(pontos, largura, op = {}){
    if (pontos.length < 2) return 0;
    const passos = [];                                          /* pontos a cada 2 m ao longo do caminho */
    for (let i = 0; i + 1 < pontos.length; i++){
      const [ax, az] = pontos[i], [bx, bz] = pontos[i + 1], len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / 2));
      for (let s = i ? 1 : 0; s <= n; s++) passos.push([ax + (bx - ax) * s / n, az + (bz - az) * s / n]);
    }
    const bruto = passos.map(([x, z]) => alturaGrade(m.h, x, z));
    const perfil = bruto.map((_, i) => { let s = 0, n = 0; for (let k = -6; k <= 6; k++){ const v = bruto[i + k]; if (v !== undefined){ s += v; n++; } } return s / n; });
    if (op.registrar !== false){
      const rua = {pts:pontos.map(p => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]), largura, calcada:!!op.calcada, tipo:op.tipo || ((op.material ?? M.asfalto) === M.asfalto ? 'residential' : 'track')};
      m.ruas.push(rua); m.traco?.ruas.push(rua);
    }
    const meia = largura / 2, calcada = op.calcada ? 1.8 : 0, borda = meia + calcada, talude = borda + (op.semNivelar ? 0 : 5);
    const material = op.material ?? M.asfalto;
    const alvoH = new Map(), alvoM = new Map();
    for (let i = 0; i + 1 < passos.length; i++){
      const [ax, az] = passos[i], [bx, bz] = passos[i + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
      const mx = (ax + bx) / 2, mz = (az + bz) / 2, alc = talude + 2.5;
      const perto = (px, pz) => { const t = limita(((px - ax) * dx + (pz - az) * dz) / l2, 0, 1); return [Math.hypot(px - ax - dx * t, pz - az - dz * t), perfil[i] + (perfil[i + 1] - perfil[i]) * t]; };
      if (!op.semNivelar) cadaPonto(mx, mz, alc, (k, px, pz) => { const [d, y] = perto(px, pz); if (d > talude) return; const ant = alvoH.get(k); if (!ant || d < ant[0]) alvoH.set(k, [d, y]); });
      cadaCelula(mx, mz, alc, (k, px, pz) => { const [d] = perto(px, pz); if (d > borda + .4) return; const ant = alvoM.get(k); if (ant === undefined || d < ant) alvoM.set(k, d); });
    }
    for (const [k, [d, y]] of alvoH){ const peso = d <= borda + .8 ? 1 : 1 - (d - borda - .8) / (talude - borda - .8); poeH(k, m.h[k] + (y - m.h[k]) * limita(peso, 0, 1)); }
    for (const [k, d] of alvoM){
      const novo = d <= meia + .2 ? material : M.calcada;
      if (d > meia + .2 && (!calcada || m.mat[k] === M.asfalto)) continue;                    /* calçada não cobre outra rua */
      poeMat(k, novo); poeAgua(k, 0);
    }
    const xs = pontos.map(p => p[0]), zs = pontos.map(p => p[1]);
    marca(Math.min(...xs) - talude - 4, Math.min(...zs) - talude - 4, Math.max(...xs) + talude + 4, Math.max(...zs) + talude + 4);
    return passos.length;
  }

  /* ---------------------------------------------------------- ruas e rios de um arquivo do OpenStreetMap (resposta "out geom") */
  const LARGURAS = {motorway:14, trunk:12, primary:10, secondary:9, tertiary:8, unclassified:7, residential:7, living_street:6, service:4, pedestrian:5, track:4, path:2, footway:2, cycleway:2, motorway_link:7, trunk_link:7, primary_link:6, secondary_link:6, tertiary_link:6};
  const DE_TERRA = new Set(['track', 'path']);
  function paraMetros(lat, lon, centro){ const R = 6378137, k = Math.cos(centro.lat * Math.PI / 180); return [(lon - centro.lon) * Math.PI / 180 * R * k, -(lat - centro.lat) * Math.PI / 180 * R]; }
  function importarOSM(json, centro){
    if (!json || !Array.isArray(json.elements)) throw new Error('arquivo sem a lista "elements"');
    const dentro = p => Math.abs(p[0]) < MEIO + 60 && Math.abs(p[1]) < MEIO + 60;
    const vias = json.elements.filter(e => e.type === 'way' && Array.isArray(e.geometry) && e.tags).map(e => ({t:e.tags, pts:e.geometry.map(g => paraMetros(g.lat, g.lon, centro))})).filter(v => v.pts.some(dentro));
    const total = {ruas:0, rios:0, lagos:0};
    iniciarTraco();
    /* 1) lagos e rios largos, que mexem no terreno antes das ruas */
    for (const v of vias){
      if (v.t.natural === 'water' && v.pts.length > 3){
        const xs = v.pts.map(p => p[0]), zs = v.pts.map(p => p[1]), area = [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)];
        const nivel = Math.min(...v.pts.filter(dentro).map(p => alturaGrade(m.h, p[0], p[1]))) - .3;
        const interno = (x, z) => { let r = false; for (let i = 0, j = v.pts.length - 1; i < v.pts.length; j = i++){ const [xi, zi] = v.pts[i], [xj, zj] = v.pts[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) r = !r; } return r; };
        cadaCelula((area[0] + area[2]) / 2, (area[1] + area[3]) / 2, Math.hypot(area[2] - area[0], area[3] - area[1]) / 2 + 2, (k, px, pz) => { if (interno(px, pz)){ poeAgua(k, nivel); poeMat(k, M.areia); } });
        cadaPonto((area[0] + area[2]) / 2, (area[1] + area[3]) / 2, Math.hypot(area[2] - area[0], area[3] - area[1]) / 2 + 2, (k, px, pz) => { if (interno(px, pz)) poeH(k, Math.min(m.h[k], nivel - 2)); });
        marca(...area); total.lagos++;
      } else if (v.t.waterway === 'river' || v.t.waterway === 'stream' || v.t.waterway === 'canal'){
        const raio = v.t.waterway === 'river' ? 17 : 3.5, fundo = v.t.waterway === 'river' ? 3.5 : 1.2;
        let nivel = Infinity;
        for (let i = 0; i + 1 < v.pts.length; i++){
          const [ax, az] = v.pts[i], [bx, bz] = v.pts[i + 1], n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / (raio * .6)));
          for (let s = 0; s <= n; s++){
            const x = ax + (bx - ax) * s / n, z = az + (bz - az) * s / n; if (!dentro([x, z])) continue;
            const aqui = alturaGrade(m.base, x, z), alvo = v.t.waterway === 'river' ? aqui : alturaGrade(m.h, x, z);
            nivel = v.t.waterway === 'river' ? alvo : alvo;
            pincel('agua', x, z, {raio, alvo:nivel - .3, profundidade:fundo});
          }
        }
        total.rios++;
      }
    }
    /* 2) ruas, das menores para as maiores, para a maior ficar por cima no cruzamento */
    const ruas = vias.filter(v => v.t.highway && LARGURAS[v.t.highway]).sort((a, b) => LARGURAS[a.t.highway] - LARGURAS[b.t.highway]);
    for (const v of ruas){
      const tipo = v.t.highway, terra = DE_TERRA.has(tipo) || /unpaved|dirt|ground|earth|gravel/.test(v.t.surface || '');
      const fina = LARGURAS[tipo] <= 2;
      const pts = v.pts.filter((p, i) => dentro(p) || (i && dentro(v.pts[i - 1])) || (i + 1 < v.pts.length && dentro(v.pts[i + 1])));
      if (pts.length < 2) continue;
      tracarRua(pts, LARGURAS[tipo], {tipo:terra ? 'track' : tipo, material:terra || fina ? M.rua_terra : M.asfalto, calcada:!terra && !fina && ['residential', 'tertiary', 'secondary', 'living_street', 'unclassified'].includes(tipo), semNivelar:fina});
      total.ruas++;
    }
    encerrarTraco();
    return total;
  }

  /* ---------------------------------------------------------- voxels de um pedaço do mundo */
  function voxeis(pi, pj, s, estilo = m.cfg.estilo){
    const n = PEDACO / s, x0 = pi * PEDACO - MEIO, z0 = pj * PEDACO - MEIO;
    let pos = [], nor = [], cor = [], idx = [], aguaPos = [], aguaIdx = [], quads = 0;
    const quad = (v, n4, c) => { const b = quads * 4; for (let i = 0; i < 4; i++){ pos.push(v[i][0], v[i][1], v[i][2]); const q = Array.isArray(n4[0]) ? n4[i] : n4; nor.push(q[0], q[1], q[2]); cor.push(c[0], c[1], c[2]); } idx.push(b, b + 1, b + 2, b, b + 2, b + 3); quads++; };
    const lado = (xa, za, xb, zb, ya0, yb0, ya1, yb1, normal, c) => quad([[xa, ya0, za], [xb, yb0, zb], [xb, yb1, zb], [xa, ya1, za]], normal, c);
    const mats = new Uint8Array(n * n), cores = new Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){ const x = x0 + (i + .5) * s, z = z0 + (j + .5) * s; mats[j * n + i] = materialDesenhado(x, z, s); cores[j * n + i] = corVoxel(mats[j * n + i], x, z, s); }
    const terraDe = c => [c[0] * .78 | 0, c[1] * .7 | 0, c[2] * .62 | 0];

    if (estilo === 'blocos' || estilo === 'degraus'){
      const degrau = estilo === 'blocos' ? s : s / 4;
      const g = new Float32Array((n + 2) * (n + 2));
      for (let j = -1; j <= n; j++) for (let i = -1; i <= n; i++) g[(j + 1) * (n + 2) + i + 1] = Math.round(altura(x0 + (i + .5) * s, z0 + (j + .5) * s) / degrau) * degrau;
      const em = (i, j) => g[(j + 1) * (n + 2) + i + 1];
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){
        const x = x0 + i * s, z = z0 + j * s, y = em(i, j), c = cores[j * n + i], cl = estilo === 'blocos' ? terraDe(c) : [c[0] * .9 | 0, c[1] * .88 | 0, c[2] * .86 | 0];
        quad([[x, y, z], [x, y, z + s], [x + s, y, z + s], [x + s, y, z]], [0, 1, 0], c);
        /* paredes só onde o vizinho é mais baixo; na borda do pedaço há uma saia para não abrir frestas */
        for (const [di, dj, a, b, nv] of [[-1, 0, [x, z], [x, z + s], [-1, 0, 0]], [1, 0, [x + s, z + s], [x + s, z], [1, 0, 0]], [0, -1, [x + s, z], [x, z], [0, 0, -1]], [0, 1, [x, z + s], [x + s, z + s], [0, 0, 1]]]){
          const borda = i + di < 0 || i + di >= n || j + dj < 0 || j + dj >= n;
          let viz = em(i + di, j + dj); if (borda) viz = Math.min(viz, y) - Math.max(2, s);
          if (viz < y - .01) lado(a[0], a[1], b[0], b[1], viz, viz, y, y, nv, cl);
        }
      }
    } else {
      const liso = estilo === 'liso', degrau = liso ? 0 : s / 8;
      const g = new Float32Array((n + 3) * (n + 3));
      for (let j = -1; j <= n + 1; j++) for (let i = -1; i <= n + 1; i++){ const y = altura(x0 + i * s, z0 + j * s); g[(j + 1) * (n + 3) + i + 1] = degrau ? Math.round(y / degrau) * degrau : y; }
      const em = (i, j) => g[(j + 1) * (n + 3) + i + 1];
      const normalEm = (i, j) => { const nx = em(i - 1, j) - em(i + 1, j), nz = em(i, j - 1) - em(i, j + 1), ny = 2 * s, t = Math.hypot(nx, ny, nz); return [nx / t, ny / t, nz / t]; };
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){
        const x = x0 + i * s, z = z0 + j * s, a = em(i, j), b = em(i, j + 1), c2 = em(i + 1, j + 1), d = em(i + 1, j), c = cores[j * n + i];
        let normal;
        if (liso) normal = [normalEm(i, j), normalEm(i, j + 1), normalEm(i + 1, j + 1), normalEm(i + 1, j)];
        else { const nx = (a + b - d - c2) / 2, nz = (a + d - b - c2) / 2, t = Math.hypot(nx, s, nz); normal = [nx / t, s / t, nz / t]; }
        quad([[x, a, z], [x, b, z + s], [x + s, c2, z + s], [x + s, d, z]], normal, c);
        const saia = Math.max(2, s), cl = terraDe(c);
        if (i === 0) lado(x, z, x, z + s, a - saia, b - saia, a, b, [-1, 0, 0], cl);
        if (i === n - 1) lado(x + s, z + s, x + s, z, c2 - saia, d - saia, c2, d, [1, 0, 0], cl);
        if (j === 0) lado(x + s, z, x, z, d - saia, a - saia, d, a, [0, 0, -1], cl);
        if (j === n - 1) lado(x, z + s, x + s, z + s, b - saia, c2 - saia, b, c2, [0, 0, 1], cl);
      }
    }
    /* água: superfície plana */
    let aq = 0;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){
      const x = x0 + i * s, z = z0 + j * s, nivel0 = m.agua[celula(x + s / 2, z + s / 2)]; if (!nivel0) continue;
      const nivel = m.cfg.exagero === 1 ? nivel0 : m.referencia + (nivel0 - m.referencia) * m.cfg.exagero;
      aguaPos.push(x, nivel, z, x, nivel, z + s, x + s, nivel, z + s, x + s, nivel, z); aguaIdx.push(aq, aq + 1, aq + 2, aq, aq + 2, aq + 3); aq += 4;
    }
    return {pos, nor, cor, idx, quads, aguaPos, aguaIdx};
  }

  /* ---------------------------------------------------------- mira: onde um raio toca o terreno */
  function mirar(origem, dir, alcance = 4000){
    let ant = 0;
    for (let t = 0; t < alcance; t += Math.max(1, t * .006)){
      const x = origem[0] + dir[0] * t, y = origem[1] + dir[1] * t, z = origem[2] + dir[2] * t;
      if (Math.abs(x) <= MEIO && Math.abs(z) <= MEIO && y <= altura(x, z)){
        let a = ant, b = t; for (let i = 0; i < 14; i++){ const c = (a + b) / 2; if (origem[1] + dir[1] * c <= altura(origem[0] + dir[0] * c, origem[2] + dir[2] * c)) b = c; else a = c; }
        return [origem[0] + dir[0] * b, origem[1] + dir[1] * b, origem[2] + dir[2] * b];
      }
      ant = t;
    }
    return null;
  }

  /* ---------------------------------------------------------- salvar e abrir: guarda só o que difere do relevo original */
  const paraB64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return typeof btoa === 'function' ? btoa(s) : Buffer.from(s, 'binary').toString('base64'); };
  const deB64 = t => typeof atob === 'function' ? Uint8Array.from(atob(t), c => c.charCodeAt(0)) : Uint8Array.from(Buffer.from(t, 'base64'));
  /* sequências: [quantos zeros pular, quantos valores seguem, valores...] */
  function compacta(v){
    const out = []; let i = 0;
    while (i < v.length){
      let zeros = 0; while (i < v.length && v[i] === 0 && zeros < 0xFFFF){ i++; zeros++; }
      let ini = i, q = 0; while (i < v.length && v[i] !== 0 && q < 0xFFFF){ i++; q++; }
      out.push(zeros, q); for (let k = ini; k < ini + q; k++) out.push(v[k] & 0xFFFF);
    }
    return paraB64(new Uint8Array(Uint16Array.from(out).buffer));
  }
  function expande(texto, destino, comSinal){
    const u8 = deB64(texto), a = new Uint16Array(u8.buffer, 0, u8.length >> 1); let i = 0, p = 0;
    destino.fill(0);
    while (p + 1 < a.length){ i += a[p++]; const q = a[p++]; for (let k = 0; k < q; k++, i++, p++){ if (i < destino.length) destino[i] = comSinal && a[p] > 32767 ? a[p] - 65536 : a[p]; } }
  }
  function salvar(extra = {}){
    const dh = new Int16Array(N * N); for (let i = 0; i < N * N; i++) dh[i] = limita(Math.round((m.h[i] - m.base[i]) * 50), -32767, 32767);
    const dm = new Uint16Array(C * C); for (let i = 0; i < C * C; i++) dm[i] = m.mat[i] === m.baseMat[i] ? 0 : m.mat[i] + 1;
    /* água: guarda a que difere da original (1 = tirada) */
    const da = new Uint16Array(C * C); for (let i = 0; i < C * C; i++){ const antes = m.baseAgua ? m.baseAgua[i] : 0; da[i] = m.agua[i] === antes ? 0 : m.agua[i] ? limita(Math.round(m.agua[i] * 20), 2, 65535) : 1; }
    return {tipo:'mundo-wo', versao:2, cfg:{...m.cfg}, alturas:compacta(dh), materiais:compacta(dm), agua:compacta(da), ruas:m.ruas.slice(m.ruasBase), povo:m.povo, ...(m.zonas.sementes.length ? {zonas:m.zonas} : {}), ...extra};
  }
  function abrir(o, D, preparar){
    if (!o || o.tipo !== 'mundo-wo') throw new Error('não é um arquivo de mundo');
    const fonte = ['bairro', 'morros', 'plano'].includes(o.cfg?.fonte) ? o.cfg.fonte : 'bairro';
    const dh = new Int16Array(N * N), dm = new Uint16Array(C * C), da = new Uint16Array(C * C);
    expande(o.alturas, dh, true); expande(o.materiais, dm, false); expande(o.agua, da, false);
    criar(fonte, D); if (preparar) preparar(fonte);
    if (ESTILOS[o.cfg.estilo]) m.cfg.estilo = o.cfg.estilo;
    if (Number.isFinite(o.cfg.rugosidade)) m.cfg.rugosidade = limita(o.cfg.rugosidade, 0, 1);
    if (Number.isFinite(o.cfg.exagero)) m.cfg.exagero = limita(o.cfg.exagero, .5, 2.5);
    /* ruas desenhadas e objetos (arquivos antigos não têm) */
    const num = (v, a, b, p) => Number.isFinite(v) ? limita(v, a, b) : p;
    for (const r of (Array.isArray(o.ruas) ? o.ruas.slice(0, 600) : [])){
      const pts = (Array.isArray(r?.pts) ? r.pts.slice(0, 500) : []).filter(p => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
      if (pts.length > 1) m.ruas.push({pts, largura:num(r.largura, 2, 24, 7), calcada:!!r.calcada, tipo:/^[a-z_]{1,30}$/.test(r.tipo) ? r.tipo : 'residential'});
    }
    const pv = o.povo;
    if (pv && typeof pv === 'object') m.povo = {ativo:!!pv.ativo, semente:num(pv.semente, 1, 99999, 7) | 0, casas:num(pv.casas, 0, 1, .85), vegetacao:num(pv.vegetacao, 0, 1, .6), rua:num(pv.rua, 0, 1, .6), estado:pv.estado === 'normal' ? 'normal' : 'abandonado',
      removidos:(Array.isArray(pv.removidos) ? pv.removidos : []).filter(k => typeof k === 'string' && k.length < 40).slice(0, 20000),
      manuais:(Array.isArray(pv.manuais) ? pv.manuais : []).filter(a => a && typeof a.id === 'string' && Number.isFinite(a.x) && Number.isFinite(a.z)).slice(0, 5000).map(a => ({id:a.id.slice(0, 30), x:limita(a.x, -MEIO, MEIO), z:limita(a.z, -MEIO, MEIO), rot:num(a.rot, -100, 100, 0), cor:num(a.cor, 0, 99, 0) | 0}))};
    if (typeof Territorios !== 'undefined') m.zonas = Territorios.validar(o.zonas);
    for (let i = 0; i < N * N; i++) if (dh[i]) m.h[i] = m.base[i] + dh[i] / 50;
    for (let i = 0; i < C * C; i++){ if (dm[i]) m.mat[i] = Math.min(MATERIAIS.length - 1, dm[i] - 1); if (da[i]) m.agua[i] = da[i] === 1 ? 0 : da[i] / 20; }
    sujarTudo();
  }

  return {definirCalcada, LADO, CEL, CM, N, C, MEIO, PEDACO, PEDACOS, MATERIAIS, M, CORES, ESTILOS, FERRAMENTAS, m, criar, altura, alturaGrade, materialEm, inclinacao, corVoxel, pincel, tracarRua, importarOSM, voxeis, mirar, fixarBase,
    iniciarTraco, encerrarTraco, desfazer, refazer, sujarTudo, salvar, abrir, ruido2};
})();
