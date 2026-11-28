/* Miras de perto, só para a primeira pessoa: peças finas e redondas no lugar das de voxel
   (em terceira pessoa a arma continua como é). Tudo em blocos, nas coordenadas da arma:
   u = ao longo, v = lado, w = para cima. A linha de mira é a reta v = 0, w = h:
   o que estiver nela aparece exatamente no centro da tela quando se mira.
   Carregado depois de primeira.js. */
const Miras = (() => {
  const C = {preto:'#17181B', fosco:'#24272C', metal:'#33373E', quina:'#4C525B', parafuso:'#7C838D', borracha:'#101113', laranja:'#F16A32', vermelho:'#C0362C',
             latao:'#D9A636', branco:'#F2F4EE', verde:'#9CF58A', lente:'#5FA8C4', lente2:'#BFE6F0', ambar:'#E8A23C',
             arame:'#9AA0A8', arame2:'#757B84', ferrugem:'#8A5634', fita:'#8E887A', fita2:'#767064'};
  const dois = Math.PI * 2;

  function oficina(){
    const m = {solido:[], luz:[], vidro:[], brilho:[]};
    const quad = (onde, pts, n, cor, ns) => m[onde].push({v:pts, n, cor, ns});
    function caixa(u0, u1, v0, v1, w0, w1, cor, onde = 'solido'){
      const q = (p, n) => quad(onde, p, n, cor);
      q([[u0,v0,w1],[u1,v0,w1],[u1,v1,w1],[u0,v1,w1]], [0,0,1]); q([[u0,v0,w0],[u0,v1,w0],[u1,v1,w0],[u1,v0,w0]], [0,0,-1]);
      q([[u0,v0,w0],[u0,v0,w1],[u0,v1,w1],[u0,v1,w0]], [-1,0,0]); q([[u1,v0,w0],[u1,v1,w0],[u1,v1,w1],[u1,v0,w1]], [1,0,0]);
      q([[u0,v0,w0],[u1,v0,w0],[u1,v0,w1],[u0,v0,w1]], [0,-1,0]); q([[u0,v1,w0],[u0,v1,w1],[u1,v1,w1],[u1,v1,w0]], [0,1,0]);
    }
    /* contornos no plano (v, w) com o mesmo número de pontos, para poder fazer molduras */
    const circulo = (wc, r, n = 48, torto = 0) => Array.from({length:n}, (_, i) => { const a = i / n * dois, k = 1 + torto * Math.sin(a * 3 + 1) + torto * .6 * Math.sin(a * 7); return [Math.cos(a) * r * k, wc + Math.sin(a) * r * k]; });
    function arredondado(wc, mv, mw, raio, n = 8){
      const p = [];
      [[mv - raio, mw - raio, 0], [-(mv - raio), mw - raio, 1], [-(mv - raio), -(mw - raio), 2], [mv - raio, -(mw - raio), 3]].forEach(([cv, cw, k]) => {
        for (let i = 0; i <= n; i++){ const a = (k + i / n) * Math.PI / 2; p.push([cv + Math.cos(a) * raio, wc + cw + Math.sin(a) * raio]); }
      });
      return p;
    }
    /* moldura (argola ou janela) esticada de u0 a u1, feita de cubinhos entre o contorno de fora e o de dentro */
    const LADO = .23;
    const dentroDe = (p, v, w) => { let d = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > w) !== (p[j][1] > w) && v < (p[j][0] - p[i][0]) * (w - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) d = !d; return d; };
    function moldura(u0, u1, fora, dentro, cor, corDentro = C.borracha, onde = 'solido'){
      const vs = fora.map(p => p[0]), ws = fora.map(p => p[1]), meioW = (Math.min(...ws) + Math.max(...ws)) / 2;
      const cheias = new Set(), de = [Math.floor(Math.min(...vs) / LADO) - 1, Math.floor((Math.min(...ws) - meioW) / LADO) - 1], ate = [Math.ceil(Math.max(...vs) / LADO) + 1, Math.ceil((Math.max(...ws) - meioW) / LADO) + 1];
      for (let i = de[0]; i <= ate[0]; i++) for (let k = de[1]; k <= ate[1]; k++){ const v = i * LADO, w = meioW + k * LADO; if (dentroDe(fora, v, w) && !dentroDe(dentro, v, w)) cheias.add(i + ',' + k); }
      for (const ch of cheias){
        const [i, k] = ch.split(',').map(Number), v0 = (i - .5) * LADO, v1 = (i + .5) * LADO, w0 = meioW + (k - .5) * LADO, w1 = meioW + (k + .5) * LADO;
        const claro = cor;
        quad(onde, [[u0,v0,w0],[u0,v1,w0],[u0,v1,w1],[u0,v0,w1]], [-1,0,0], claro); quad(onde, [[u1,v0,w0],[u1,v0,w1],[u1,v1,w1],[u1,v1,w0]], [1,0,0], cor);
        for (const [di, dk, face, n] of [[-1, 0, [[u0,v0,w0],[u0,v0,w1],[u1,v0,w1],[u1,v0,w0]], [0,-1,0]], [1, 0, [[u0,v1,w0],[u1,v1,w0],[u1,v1,w1],[u0,v1,w1]], [0,1,0]],
                                        [0, -1, [[u0,v0,w0],[u1,v0,w0],[u1,v1,w0],[u0,v1,w0]], [0,0,-1]], [0, 1, [[u0,v0,w1],[u0,v1,w1],[u1,v1,w1],[u1,v0,w1]], [0,0,1]]]){
          if (cheias.has((i + di) + ',' + (k + dk))) continue;
          const paraDentro = dentroDe(dentro, (i + di) * LADO, meioW + (k + dk) * LADO);
          quad(onde, face, n, paraDentro ? corDentro : cor);
        }
      }
    }
    const anel = (u0, u1, wc, r0, r1, cor, corDentro, onde) => moldura(u0, u1, circulo(wc, r1), circulo(wc, r0), cor, corDentro, onde);
    /* chapa fechada num contorno (lentes, pontos) */
    function chapa(u, pts, cor, onde = 'vidro'){
      const c = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length], [0, 0]);
      for (let i = 0; i < pts.length; i++) quad(onde, [[u, ...c], [u, ...pts[i]], [u, ...pts[(i + 1) % pts.length]], [u, ...c]], [-1, 0, 0], cor);
    }
    const ponto = (u, v, w, r, cor, onde = 'luz') => chapa(u, [[v - r * .82, w - r * .82], [v + r * .82, w - r * .82], [v + r * .82, w + r * .82], [v - r * .82, w + r * .82]], cor, onde);
    /* botões de ajuste: blocos em degraus, deitados de lado (eixo 'v') ou em pé (eixo 'w') */
    function pino(eixo, centro, de, ate, r, cor){
      const lo = Math.min(de, ate), hi = Math.max(de, ate), meioDoCaminho = lo + (hi - lo) * .62;
      for (const [a, b, k, c] of [[lo, hi, 1, cor], [lo + .04, hi - .04, .72, C.preto]]){
        const lg = r * (k === 1 ? .78 : 1.02), cm = k === 1 ? [a, b] : [meioDoCaminho, Math.max(meioDoCaminho + .05, b - .02)];
        if (eixo === 'w'){ caixa(centro[0] - lg, centro[0] + lg, centro[1] - lg, centro[1] + lg, cm[0], cm[1], c); }
        else caixa(centro[0] - lg, centro[0] + lg, cm[0], cm[1], centro[2] - lg, centro[2] + lg, c);
      }
    }
    /* trilho de baixo, com parafusos */
    function base(u0, u1, w0, mv = .62){
      caixa(u0, u1, -mv, mv, w0 - .12, w0 + .26, C.fosco); caixa(u0 + .15, u1 - .15, -mv + .12, mv - .12, w0 + .26, w0 + .44, C.metal);
      for (const u of [u0 + .5, u1 - .5]) for (const s of [-1, 1]) caixa(u - .16, u + .16, s * mv - .06, s * mv + .06, w0 - .02, w0 + .2, C.parafuso);
    }
    return {m, quad, caixa, circulo, arredondado, moldura, anel, chapa, ponto, pino, base};
  }

  /* ---------------------------------------------------------------- as peças */
  /* ponto vermelho: tubo curto com lente */
  function ponto(E){
    const o = oficina(), [u, w] = E, h = w + 2.05, r = 1.08;
    o.base(u - 1.35, u + 1.35, w);
    o.caixa(u - .72, u + .72, -.46, .46, w + .4, h - r - .12, C.metal); o.caixa(u - .9, u + .9, -.6, .6, h - r - .3, h - r - .1, C.fosco);
    o.anel(u - .72, u + .86, h, r, r + .19, C.metal);
    o.anel(u - .96, u - .72, h, r + .02, r + .29, C.preto, C.borracha); o.anel(u + .86, u + 1.14, h, r + .02, r + .31, C.preto, C.borracha);
    o.anel(u - 1.0, u - .96, h, r + .2, r + .25, C.quina, C.quina);
    o.pino('w', [u, 0, 0], h + r + .12, h + r + .56, .33, C.metal); o.pino('v', [u, 0, h], -r - .12, -r - .52, .3, C.metal);
    o.caixa(u - .5, u + .1, r + .12, r + .34, h - .28, h + .28, C.fosco); o.caixa(u - .34, u - .06, r + .34, r + .37, h - .08, h + .08, C.laranja);
    const lente = o.circulo(h, r);
    o.chapa(u + .84, lente, C.lente); o.chapa(u + .83, o.circulo(h - r * .5, r * .42, 24).map(([a, b]) => [a * 1.9, b]), C.lente2, 'brilho');
    return {h, ...o.m, janela:{u:u + .84, pts:o.circulo(h, r * .985)}};
  }
  /* holográfica: janela retangular de cantos redondos, protegida por um capô */
  function holografica(E){
    const o = oficina(), [u, w] = E, h = w + 2.12, mv = 1.3, mw = .96;
    o.base(u - 1.85, u + 1.75, w, .72);
    o.caixa(u - 1.85, u - .25, -.9, .9, w + .42, h - mw - .24, C.fosco); o.caixa(u - 1.7, u - .4, -.74, .74, h - mw - .24, h - mw - .1, C.metal);
    for (const [v, cor] of [[-.46, C.quina], [0, C.quina], [.46, C.laranja]]) o.caixa(u - 1.91, u - 1.85, v - .15, v + .15, w + .6, w + .86, cor);
    o.caixa(u + .05, u + 1.55, -mv - .06, mv + .06, w + .42, h - mw - .1, C.metal);
    o.moldura(u + .18, u + 1.3, o.arredondado(h, mv + .2, mw + .2, .5), o.arredondado(h, mv, mw, .36), C.metal);
    o.moldura(u + 1.3, u + 1.5, o.arredondado(h, mv + .3, mw + .3, .56), o.arredondado(h, mv + .02, mw + .02, .37), C.preto);
    for (const s of [-1, 1]){ o.caixa(u + .15, u + 1.45, s * (mv + .2) - .09, s * (mv + .2) + .09, w + .42, h + .1, C.fosco); o.pino('v', [u + .75, 0, w + .7], s * (mv + .26), s * (mv + .46), .2, C.metal, 14); }
    const vidro = o.arredondado(h, mv, mw, .36);
    o.chapa(u + 1.28, vidro, C.lente); o.chapa(u + 1.27, [[-mv * .94, h - mw * .1], [-mv * .72, h - mw * .1], [mv * .06, h + mw * .88], [-mv * .2, h + mw * .88]], C.lente2, 'brilho');
    return {h, ...o.m, janela:{u:u + 1.28, pts:o.arredondado(h, mv * .985, mw * .98, .35)}};
  }
  /* mira de arame: argola torta e um prego pintado na frente */
  function arame(E){
    const o = oficina(), [u, w] = E, h = w + 1.9, torto = .035;
    o.caixa(u - 1.0, u + 1.0, -.62, .62, w - .12, w + .3, C.fita); for (const x of [-.7, -.1, .5]) o.caixa(u + x, u + x + .22, -.66, .66, w - .14, w + .34, C.fita2);
    o.moldura(u - .08, u + .08, o.circulo(h, 1.02, 22, torto), o.circulo(h, .76, 22, torto), C.arame, C.arame2);
    for (const s of [-1, 1]){ o.caixa(u - .07, u + .07, s * .5 - .07, s * .5 + .07, w + .25, h - .66, C.arame2); o.caixa(u - .14, u + .14, s * .5 - .13, s * .5 + .13, w + .62, w + .78, C.ferrugem); }
    const f = u + 3.5;
    o.caixa(u + .9, f + .1, -.07, .07, w - .12, w + .08, C.arame2); o.caixa(f - .3, f + .3, -.36, .36, w - .14, w + .3, C.fita);
    o.caixa(f - .06, f + .06, -.055, .055, w + .25, h - .11, C.ferrugem);
    o.ponto(f - .07, 0, h, .13, '#FF5A2A');
    return {h, ...o.m, janela:null};
  }
  /* luneta (vista de quadril; mirando, a tela mostra a lente) */
  function luneta(E){
    const o = oficina(), [u, w] = E, h = w + 1.8;
    for (const x of [-1.7, 1.4]){ o.base(u + x - .45, u + x + .45, w, .5); o.caixa(u + x - .28, u + x + .28, -.3, .3, w + .4, h - .55, C.metal); o.anel(u + x - .28, u + x + .28, h, .6, .82, C.fosco, C.fosco); }
    o.anel(u - 3.1, u + 3.1, h, .02, .62, C.metal, C.metal); o.anel(u - 4.4, u - 3.1, h, .5, .84, C.preto); o.anel(u - 3.35, u - 3.1, h, .55, .72, C.quina, C.quina);
    o.anel(u + 3.1, u + 3.6, h, .5, .78, C.metal); o.anel(u + 3.6, u + 5.1, h, .78, .98, C.preto);
    o.pino('w', [u, 0, 0], h + .55, h + 1.2, .36, C.metal); o.pino('v', [u, 0, h], -.55, -1.2, .34, C.metal);
    o.chapa(u - 4.28, o.circulo(h, .5, 32), '#2E5A74', 'solido'); o.chapa(u + 5.0, o.circulo(h, .78, 32), '#3C7390', 'solido'); o.chapa(u - 4.29, o.circulo(h + .16, .16, 16).map(([a, b]) => [a - .14, b]), C.lente2, 'luz');
    return {h, ...o.m, janela:null};
  }
  /* miras de ferro no alto da própria arma: alça atrás e massa na frente, com pontos */
  const TIPO_FERRO = {fuzil_assalto:'argola', fuzil_madeira:'argola', fuzil_ferrolho:'argola', submetralhadora:'argola', metralhadora:'argola',
                      escopeta:'conta', gamb_escopeta:'conta', gamb_guardachuva:'conta'};
  function ferro(id, caixasArma, boca){
    const o = oficina(), tipo = TIPO_FERRO[id] || 'entalhe', curta = Animacao.classeDaArma(id) === 'curta', gamb = ARMAS[id].tipo === 'gambiarra';
    const meio = caixasArma.filter(c => c[2] < .3 && c[3] > -.3 && c[6] !== 'a_laser' && c[1] > -4);
    const topo = Math.max(...meio.map(c => c[5]));
    const chao = u => { const a = meio.filter(c => c[0] <= u + .35 && c[1] >= u - .35); return a.length ? Math.max(...a.map(c => c[5])) : Math.min(topo, boca[1] + .4); };
    const h = topo + (tipo === 'conta' ? 1.0 : .72), E = ENCAIXES[id];
    const ur = curta ? -1.5 : E?.mira ? E.mira[0] - 1.1 : .2, uf = Math.max(ur + 4, boca[0] - (curta ? .8 : 1.5));
    const aco = gamb ? C.ferrugem : C.preto, aco2 = gamb ? C.arame2 : C.metal;
    const pe = (u, larg, ate, cor = aco2) => { const b = chao(u) - .12; o.caixa(u - .3, u + .3, -larg, larg, b, b + .3, cor); if (ate > b + .3) o.caixa(u - .17, u + .17, -larg * .45, larg * .45, b + .3, ate, cor); };
    if (tipo === 'conta'){
      const n = 7; for (let i = 0; i < n; i++){ const a = ur + (uf - ur) * i / n; o.caixa(a, a + (uf - ur) / n * .82, -.16, .16, Math.min(topo, h - .5) - .1, h - .38, i % 2 ? aco2 : aco); }
      pe(ur, .5, h - .42, aco);
      for (const s of [-1, 1]) o.caixa(ur - .2, ur + .2, s * .5 - .1, s * .5 + .1, chao(ur) - .1, h - .55, aco);
      o.caixa(uf - .12, uf + .12, -.07, .07, chao(uf) - .12, h - .14, aco2);
      o.anel(uf - .13, uf + .13, h, .01, .17, gamb ? C.ferrugem : C.latao, C.latao); o.ponto(uf - .14, 0, h, .14, gamb ? '#C9A06A' : '#FFD970');
    } else {
      if (tipo === 'argola'){
        pe(ur, .52, h - .82, aco2);
        o.anel(ur - .16, ur + .16, h, .56, .8, aco, aco);
        for (const s of [-1, 1]) o.caixa(ur - .24, ur + .24, s * .82 - .12, s * .82 + .12, h - .95, h + .18, aco2);
        o.pino('v', [ur, 0, h - .62], .9, 1.14, .2, aco2, 12);
      } else {
        const b = chao(ur) - .12; o.caixa(ur - .32, ur + .32, -.84, .84, b, h - .46, aco2);
        for (const s of [-1, 1]){
          const v0 = s < 0 ? -.84 : .34, v1 = s < 0 ? -.34 : .84;
          o.caixa(ur - .3, ur + .3, v0, v1, h - .48, h + .18, aco);
          o.ponto(ur - .31, (v0 + v1) / 2, h, .11, gamb ? '#E7E0C8' : C.verde);
        }
      }
      /* a massa de mira: o ponto dela fica exatamente na linha de mira */
      pe(uf, .42, h - .16, aco2);
      o.caixa(uf - .12, uf + .12, -.1, .1, chao(uf) - .1, h + .13, aco);
      if (tipo === 'argola') for (const s of [-1, 1]){ o.caixa(uf - .16, uf + .16, s * .68 - .07, s * .68 + .07, chao(uf) - .05, h + .3, aco2); o.caixa(uf - .16, uf + .16, s * .78 - .07, s * .78 + .07, h + .18, h + .55, aco2); o.caixa(uf - .16, uf + .16, s * .4 - .34, s * .4 + .34, chao(uf) - .05, chao(uf) + .2, aco2); }
      o.ponto(uf - .13, 0, h, tipo === 'argola' ? .17 : .1, gamb ? '#FF7A3A' : C.verde);
      if (gamb){ o.caixa(uf - .4, uf + .4, -.46, .46, chao(uf) - .14, chao(uf) + .16, C.fita); o.caixa(ur - .45, ur - .31, -.86, .86, chao(ur) - .1, chao(ur) + .14, C.fita2); }
    }
    return {h, ...o.m, janela:null};
  }

  /* encolhe a peça em volta do encaixe, sem tirar a linha de mira do eixo */
  const TAMANHO = {ponto:.6, holografica:.6, arame:.66, luneta:.78};
  function encolher(m, [u0, w0], k){
    const p = ([u, v, w]) => [u0 + (u - u0) * k, v * k, w0 + (w - w0) * k];
    for (const parte of ['solido', 'luz', 'vidro', 'brilho']) m[parte] = m[parte].map(f => ({...f, v:f.v.map(p)}));
    if (m.janela) m.janela = {u:u0 + (m.janela.u - u0) * k, pts:m.janela.pts.map(([v, w]) => [v * k, w0 + (w - w0) * k])};
    m.h = w0 + (m.h - w0) * k;
    return m;
  }

  /* ---------------------------------------------------------------- escolha */
  const PECAS = {ponto, holografica, arame, luneta};
  const DE_FABRICA = ['rifle_precisao', 'besta_tatica', 'gamb_precisao'];          /* já vêm com luneta: ficam como são */
  /* monta o personagem com a arma sem a mira de voxel, para a nossa entrar no lugar */
  function semMiraDeVoxel(id, monta){
    /* sai também a massa de mira de fábrica lá na frente, que ficaria no meio do vidro */
    const A = ARMAS[id], original = A.desenhar, [mu, mw] = ENCAIXES[id].mira;
    A.desenhar = b => original((u0, u1, v0, v1, w0, w1, mat) => { if (Math.min(u0, u1) > mu + 6 && Math.max(w0, w1) > mw + 1.05) return; b(u0, u1, v0, v1, w0, w1, mat); });
    MODS_ARMA.mira.__fps = {nome:'', desenhar(){}};
    try { return monta('__fps'); } finally { delete MODS_ARMA.mira.__fps; A.desenhar = original; }
  }
  /* devolve {pecaPropria, h, solido, luz, vidro, brilho, janela} ou null (arco, estilingue, de perto, lunetas de fábrica) */
  function criar(id, mods = {}, boca){
    if (id === 'nenhum' || !ARMAS[id]) return null;
    const peca = mods.mira && mods.mira !== 'nenhum' && modServe(id, 'mira', mods.mira) ? mods.mira : null;
    if (peca) return {tipo:peca, ...encolher(PECAS[peca](ENCAIXES[id].mira), ENCAIXES[id].mira, TAMANHO[peca])};
    const f = Primeira.ficha(id);
    if (f.tipo !== 'tiro' || f.modo === 'flecha' || DE_FABRICA.includes(id)) return null;
    const colhe = desenhar => { const out = []; desenhar((a, b, c, d, e, g, m) => out.push([Math.min(a, b), Math.max(a, b), Math.min(c, d), Math.max(c, d), Math.min(e, g), Math.max(e, g), m])); return out; };
    const semFabrica = ENCAIXES[id]?.mira ? semMiraDeVoxel(id, falsa => colhe(comModificacoes(id, {...mods, mira:falsa}))) : colhe(comModificacoes(id, mods));
    const m = ferro(id, semFabrica, boca);
    /* alça e massa mais estreitas e mais baixas */
    const altura = w => w > m.h - .9 ? m.h + (w - m.h) * .74 : w;
    for (const parte of ['solido', 'luz']) m[parte] = m[parte].map(f => ({...f, v:f.v.map(([u, v, w]) => [u, v * .74, altura(w)])}));
    return {tipo:'ferro', ...m};
  }

  return {criar, semMiraDeVoxel};
})();
