/* Estande de teste em primeira pessoa: cenário, alvos, desenho das armas nas mãos e controles.
   Mundo: Y para cima; rumo 0 = olhando para +Z; nessa direção, +X fica à ESQUERDA da tela.
   Carregado por tiro.html depois de primeira.js. */
const Estande = (() => {
  const $ = id => document.getElementById(id);
  const arena = typeof Arena === 'object' && Arena.ativa ? Arena : null;          /* tiro.html?combate */
  const canvas = $('visao');
  const gl = canvas.getContext('webgl', {antialias:true, preserveDrawingBuffer:true, alpha:false});
  if (!gl){ $('aviso').textContent = 'Este navegador não conseguiu abrir o desenho em 3D (WebGL).'; return null; }
  const preso = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const puxa = (v, alvo, ritmo, dt) => v + (alvo - v) * (1 - Math.exp(-ritmo * dt));
  const mais = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], tira = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const vez = (a, k) => [a[0] * k, a[1] * k, a[2] * k], escalar = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  const cruz = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
  const unit = a => vez(a, 1 / (Math.hypot(...a) || 1));
  const qm = Primeira.mul, qx = t => Primeira.eixo(0, t), qy = t => Primeira.eixo(1, t), qz = t => Primeira.eixo(2, t);
  const UM = [0, 0, 0, 1];
  /* menor giro que leva a direção a até a direção b */
  function deAte(a, b){
    const u = unit(a), v = unit(b), c = cruz(u, v), w = 1 + escalar(u, v);
    if (w < 1e-5) return [1, 0, 0, 0];
    const t = Math.hypot(...c, w); return [c[0] / t, c[1] / t, c[2] / t, w / t];
  }

  /* ---------------------------------------------------------------- WebGL */
  const VS = `attribute vec3 p, n, c; uniform mat4 vp, M; varying vec3 vn, vc, vw;
    void main(){ vec4 w = M * vec4(p, 1.0); vw = w.xyz; vn = mat3(M) * n; vc = c; gl_Position = vp * w; }`;
  const FS = `precision mediump float; varying vec3 vn, vc, vw;
    uniform vec3 olho, frente, tinta, ceu; uniform float noite, lanterna, clarao, emite, neblina, brilho, alfa, corte;
    void main(){
      if (vw.y > corte) discard;
      vec3 n = normalize(vn), sol = normalize(vec3(-0.35, 0.8, -0.45)), d = vw - olho;
      float dist = length(d);
      float dia = 0.56 + 0.14 * n.y + 0.40 * max(dot(n, sol), 0.0);
      float luz = mix(dia, 0.12 + 0.05 * n.y, noite);
      float cone = smoothstep(0.915, 0.975, dot(d / max(dist, 0.001), frente));
      luz += lanterna * cone * (1.15 / (1.0 + dist * dist * 0.004)) * (0.45 + 0.55 * max(dot(n, -d / max(dist, 0.001)), 0.0));
      luz += clarao * 1.3 / (1.0 + dist * dist * 0.03);
      vec3 cor = vc * tinta;
      vec3 f = mix(cor * min(luz, 1.18), cor, emite);
      /* reflexo do metal das miras */
      vec3 ve = -d / max(dist, 0.001); if (dot(n, ve) < 0.0) n = -n;
      f += brilho * (pow(max(dot(reflect(-sol, n), ve), 0.0), 18.0) * 0.34 + pow(1.0 - max(dot(n, ve), 0.0), 3.0) * 0.10) * (1.0 - noite * 0.8);
      float nv = clamp((dist - 14.0) / 75.0, 0.0, 1.0) * neblina * (1.0 - emite);
      gl_FragColor = vec4(mix(f, ceu, nv), alfa);
    }`;
  const sombreador = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram(); gl.attachShader(prog, sombreador(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sombreador(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
  const AT = ['p', 'n', 'c'].map(a => gl.getAttribLocation(prog, a));
  const U = Object.fromEntries(['vp', 'M', 'olho', 'frente', 'tinta', 'ceu', 'noite', 'lanterna', 'clarao', 'emite', 'neblina', 'brilho', 'alfa', 'corte'].map(n => [n, gl.getUniformLocation(prog, n)]));

  function malha(quads){
    const d = new Float32Array(quads.length * 54); let o = 0;
    for (const f of quads){ const c = rgb(f.cor); for (const i of [0, 1, 2, 0, 2, 3]){ const v = f.v[i], n = f.ns ? f.ns[i] : f.n; d[o++] = v[0]; d[o++] = v[1]; d[o++] = v[2]; d[o++] = n[0]; d[o++] = n[1]; d[o++] = n[2]; d[o++] = c[0] / 255; d[o++] = c[1] / 255; d[o++] = c[2] / 255; } }
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
    return {buf, n:quads.length * 6};
  }
  const apagar = m => m && gl.deleteBuffer(m.buf);
  /* matriz: gira (quaternio), escala e leva para t */
  function matriz(t, q = UM, s = [1, 1, 1]){
    const [x, y, z, w] = q;
    return new Float32Array([
      (1 - 2*(y*y + z*z)) * s[0], 2*(x*y + z*w) * s[0], 2*(x*z - y*w) * s[0], 0,
      2*(x*y - z*w) * s[1], (1 - 2*(x*x + z*z)) * s[1], 2*(y*z + x*w) * s[1], 0,
      2*(x*z + y*w) * s[2], 2*(y*z - x*w) * s[2], (1 - 2*(x*x + y*y)) * s[2], 0,
      t[0], t[1], t[2], 1]);
  }
  function mult(a, b){ const r = new Float32Array(16); for (let c = 0; c < 4; c++) for (let l = 0; l < 4; l++) r[c*4 + l] = a[l]*b[c*4] + a[4 + l]*b[c*4 + 1] + a[8 + l]*b[c*4 + 2] + a[12 + l]*b[c*4 + 3]; return r; }
  function visaoProj(olho, dir, fov, asp, perto, longe, rola = 0){
    const z = unit(vez(dir, -1)), x0 = unit(cruz([0, 1, 0], z)), y0 = cruz(z, x0), c = Math.cos(rola), s = Math.sin(rola);
    const x = mais(vez(x0, c), vez(y0, s)), y = mais(vez(y0, c), vez(x0, -s));
    const v = new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -escalar(x, olho), -escalar(y, olho), -escalar(z, olho), 1]);
    const f = 1 / Math.tan(fov / 2);
    const p = new Float32Array([f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (longe + perto) / (perto - longe), -1, 0, 0, 2 * longe * perto / (perto - longe), 0]);
    return mult(p, v);
  }
  function desenha(m, M, tinta = [1, 1, 1], emite = 0){
    if (!m || !m.n) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, m.buf); AT.forEach((a, i) => { gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 3, gl.FLOAT, false, 36, i * 12); });
    gl.uniformMatrix4fv(U.M, false, M); gl.uniform3fv(U.tinta, tinta); gl.uniform1f(U.emite, emite); gl.drawArrays(gl.TRIANGLES, 0, m.n);
  }

  /* ---------------------------------------------------------------- peças simples */
  function bloco(q, x0, x1, y0, y1, z0, z1, cor){
    const f = (v, n) => q.push({v, n, cor});
    f([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]], [0,1,0]); f([[x0,y0,z0],[x0,y0,z1],[x1,y0,z1],[x1,y0,z0]], [0,-1,0]);
    f([[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]], [0,0,-1]); f([[x1,y0,z1],[x0,y0,z1],[x0,y1,z1],[x1,y1,z1]], [0,0,1]);
    f([[x0,y0,z1],[x0,y0,z0],[x0,y1,z0],[x0,y1,z1]], [-1,0,0]); f([[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0]], [1,0,0]);
  }
  const cubo = (() => { const q = []; bloco(q, -.5, .5, -.5, .5, -.5, .5, '#FFFFFF'); return malha(q); })();
  const tom = h => rgb(h).map(v => v / 255);
  /* um cubinho esticado de a até b (traçante, corda, virote) */
  function risco(a, b, esp, cor, emite = 1){
    const d = tira(b, a), comp = Math.hypot(...d); if (comp < 1e-4) return;
    desenha(cubo, matriz(mais(a, vez(d, .5)), deAte([0, 0, 1], d), [esp, esp, comp]), tom(cor), emite);
  }

  /* ---------------------------------------------------------------- o estande */
  const solidos = [];                                           /* [x0,x1,y0,y1,z0,z1] que param tiros */
  const naCena = !!arena?.naCena;
  const cenario = (() => {
    if (naCena){ solidos.push(...Cena.solidos()); return Cena.terreno(bloco, malha); }
    const q = [];
    for (let x = -12; x < 12; x += 2) for (let z = -6; z < 60; z += 2) q.push({v:[[x,0,z],[x+2,0,z],[x+2,0,z+2],[x,0,z+2]], n:[0,1,0], cor:((x + z) / 2) & 1 ? '#8C8F82' : '#95988A'});
    const solido = (x0, x1, y0, y1, z0, z1, cor) => { bloco(q, x0, x1, y0, y1, z0, z1, cor); solidos.push([x0, x1, y0, y1, z0, z1]); };
    solido(-12.4, -12, 0, 1.6, -6, 60, '#6E6A5E'); solido(12, 12.4, 0, 1.6, -6, 60, '#6E6A5E');
    solido(-12, 12, 0, 5, 58, 59, '#8A6F4C');
    for (let x = -11; x < 11; x += 1.6) bloco(q, x, x + 1.45, 0, 1.1 + (Math.abs(x * 7) % 5) * .1, 57.2, 58, '#7A603F');
    /* faixas de distância: 10 (uma), 25 (duas) e 50 m (três) */
    if (!arena) [[10, 1], [25, 2], [50, 3]].forEach(([z, n]) => { bloco(q, -12, 12, 0, .012, z - .06, z + .06, '#E9E7DD'); for (let i = 0; i < n; i++) bloco(q, 8.4 + i * .5, 8.7 + i * .5, 0, 1.1, z - .1, z + .1, '#F16A32'); });
    if (!arena) bloco(q, -12, 12, 0, .014, -.5 + 1.1, -.5 + 1.18, '#C9A23A');
    /* caixotes e um muro baixo para ver as marcas de tiro */
    solido(-5.4, -4.4, 0, 1, 5.5, 6.5, '#8A6136'); solido(-5.2, -4.5, 1, 1.7, 5.6, 6.3, '#7C5630');
    solido(4.6, 6.8, 0, 1.15, 8.4, 8.7, '#9B5440'); solido(-8, -6.4, 0, 1, 17, 18.6, '#8A6136'); solido(6.5, 9.5, 0, 1.4, 33, 33.5, '#767A82');
    /* bancada ao lado */
    if (!arena){ solido(-3.6, -2.2, .82, .92, 1.0, 1.7, '#6B4A2A'); for (const x of [-3.55, -2.35]) for (const z of [1.05, 1.57]) bloco(q, x, x + .1, 0, .82, z, z + .08, '#4E351E'); }
    return malha(q);
  })();

  /* alvos redondos */
  const PLACAS = typeof Cena === 'object' && Cena.ativa ? Cena.PLACAS : [{x:-3.1, z:10, r:.46}, {x:2.6, z:25, r:.62}, {x:-1.4, z:50, r:.95}].map(p => ({...p, y:1.42}));
  const placas = (() => {
    const q = [], CORES = ['#E9E7DD', '#26262A', '#2F5F9E', '#C0362C', '#E8B81E'];
    for (const p of PLACAS){
      bloco(q, p.x - .05, p.x + .05, 0, p.y, p.z + .02, p.z + .12, '#4E351E');
      CORES.forEach((cor, k) => {
        const fora = p.r * (1 - k * .2), dentro = k === 4 ? 0 : p.r * (1 - (k + 1) * .2), z = p.z - k * .006;
        for (let i = 0; i < 28; i++){
          const a = i / 28 * Math.PI * 2, b = (i + 1) / 28 * Math.PI * 2, em = (r, t) => [p.x + Math.cos(t) * r, p.y + Math.sin(t) * r, z];
          q.push({v:[em(dentro, a), em(fora, a), em(fora, b), em(dentro, b)], n:[0, 0, -1], cor});
        }
      });
    }
    return malha(q);
  })();

  /* zumbis de treino */
  const ZUMBIS_AQUI = [{id:'esfarrapado', x:1.5, z:2.5, vida:100}, {id:'funcionario', x:-1.0, z:7, vida:100}, {id:'brutamontes', x:2.4, z:15, vida:240}, {id:'soldado', x:-3.4, z:20, vida:140}];
  const zumbis = ZUMBIS_AQUI.map(z => {
    const c = configZumbi(z.id), quads = posar(montar(c), c.pose).quads, caixas = {};
    for (const f of quads){ const k = caixas[f.peca] || (caixas[f.peca] = [9, -9, 9, -9, 9, -9]); for (const v of f.v) for (let i = 0; i < 3; i++){ k[i*2] = Math.min(k[i*2], v[i]); k[i*2+1] = Math.max(k[i*2+1], v[i]); } }
    return {...z, cheia:z.vida, malha:malha(quads), caixas:Object.entries(caixas), tombo:0, vt:0, morto:0, pisca:0, rumo:Math.PI};
  });
  const giroDoZumbi = z => qm(qy(z.rumo), qx(z.tombo));

  /* ---------------------------------------------------------------- raio */
  function raioCaixa(o, d, k){
    let t0 = 0, t1 = 1e9, eixo = -1, sinal = 1;
    for (let i = 0; i < 3; i++){
      if (Math.abs(d[i]) < 1e-9){ if (o[i] < k[i*2] || o[i] > k[i*2+1]) return null; continue; }
      let a = (k[i*2] - o[i]) / d[i], b = (k[i*2+1] - o[i]) / d[i], s = -1;
      if (a > b){ [a, b] = [b, a]; s = 1; }
      if (a > t0){ t0 = a; eixo = i; sinal = s; } t1 = Math.min(t1, b); if (t0 > t1) return null;
    }
    const n = [0, 0, 0]; if (eixo >= 0) n[eixo] = sinal; return {t:t0, n};
  }
  function raio(o, d, longe = 90){
    let melhor = {t:longe, tipo:null};
    if (arena) melhor = arena.raio(o, d, melhor);
    for (const z of arena ? [] : zumbis){
      if (z.morto > 0) continue;
      const inverso = q => [-q[0], -q[1], -q[2], q[3]], q = inverso(giroDoZumbi(z));
      const lo = girar(q, tira(o, [z.x, 0, z.z])), ld = girar(q, d);
      for (const [peca, k] of z.caixas){ const r = raioCaixa(lo, ld, k); if (r && r.t < melhor.t) melhor = {t:r.t, tipo:'zumbi', zumbi:z, peca, n:girar(giroDoZumbi(z), r.n)}; }
    }
    for (const p of arena && !arena.naCena ? [] : PLACAS){
      if (Math.abs(d[2]) < 1e-6) continue;
      const t = (p.z - .01 - o[2]) / d[2]; if (t < 0 || t >= melhor.t) continue;
      const x = o[0] + d[0] * t - p.x, y = o[1] + d[1] * t - p.y, r = Math.hypot(x, y);
      if (r <= p.r) melhor = {t, tipo:'placa', placa:p, pontos:10 - Math.floor(r / p.r * 10), n:[0, 0, -1]};
    }
    for (const k of solidos){ const r = raioCaixa(o, d, k); if (r && r.t < melhor.t) melhor = {t:r.t, tipo:'parede', n:r.n}; }
    if (d[1] < -1e-6){ const t = -o[1] / d[1]; if (t >= 0 && t < melhor.t) melhor = {t, tipo:'chao', n:[0, 1, 0]}; }
    melhor.p = mais(o, vez(d, melhor.t));
    return melhor;
  }

  /* ---------------------------------------------------------------- jogador */
  const jog = {x:0, z:0, rumo:0, olha:0, tranco:0, alto:1.62};
  const olhoDe = () => [jog.x, (jog.y || 0) + jog.alto + (est ? Math.abs(Math.sin(est.passo)) * .028 * est.anda * (1 - est.mira * .8) : 0), jog.z];
  function direcao(){ const v = jog.olha + jog.tranco, c = Math.cos(v); return [Math.sin(jog.rumo) * c, Math.sin(v), Math.cos(jog.rumo) * c]; }
  function base(){ const f = direcao(), direita = unit(cruz(f, [0, 1, 0])), cima = cruz(direita, f); return {f, direita, cima}; }
  /* de um ponto da visão (+X esquerda) para o mundo */
  function paraOMundo(v){ const b = base(); return mais(olhoDe(), mais(vez(b.direita, -v[0]), mais(vez(b.cima, v[1]), vez(b.f, v[2])))); }

  /* ---------------------------------------------------------------- som */
  let som = null, passoAntes = 0, puxadaAntes = 0, proximoRonco = 3;
  const volumeEscolhido = () => $('somLigado').checked ? Number($('volume').value) : 0;
  function ligarSom(){
    if (!$('somLigado').checked) return;
    if (!som){
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      try { som = Som.criar(new C()); } catch (e){ return; }
      som.volume(volumeEscolhido());
    }
    if (som.ctx.state === 'suspended' && som.ctx.resume) som.ctx.resume();
    mostrarSom();
  }
  function mostrarSom(){
    const preso = !som || som.ctx.state === 'suspended';
    $('ativarSom').hidden = !preso || !$('somLigado').checked;
  }
  /* só toca quando o som está ligado e rodando */
  const tocar = (nome, ...a) => { if (som && volumeEscolhido() > 0) som[nome](...a); };
  const posDoZumbi = (z, alto = 1.45) => [z.x, alto, z.z];
  function sonsDoQuadro(dt){
    if (!som) return;
    if (arena){ som.ouvir(olhoDe(), base().direita); const meio = Math.floor(est.passo / Math.PI); if (meio !== passoAntes && est.anda > .5) tocar('passo', est.correr > .5); passoAntes = meio; return; }
    som.ouvir(olhoDe(), base().direita);
    /* um passo a cada meia volta do balanço de caminhar */
    const meio = Math.floor(est.passo / Math.PI);
    if (meio !== passoAntes && est.anda > .5) tocar('passo', est.correr > .5);
    passoAntes = meio;
    if (est.f.modo === 'flecha' && est.puxada > .02 && puxadaAntes <= .02) tocar('puxarCorda', est.id);
    puxadaAntes = est.puxada;
    /* os zumbis resmungam de vez em quando */
    proximoRonco -= dt;
    if (proximoRonco <= 0){
      proximoRonco = 2.5 + Math.random() * 4.5;
      const vivos = zumbis.filter(z => !z.morto); if (vivos.length){ const z = vivos[Math.floor(Math.random() * vivos.length)]; tocar('zumbi', posDoZumbi(z), 'ronco', z.cheia > 200); }
    }
  }

  /* ---------------------------------------------------------------- o personagem e a arma nas mãos */
  let boneco = null, est = null, vm = null;
  function personagem(){
    let c = null; try { const s = localStorage.getItem('wo-criador-personagem'); if (s) c = validar(JSON.parse(s)); } catch (e){}
    if (!c){ c = structuredClone(PADRAO_WASHINGTON); aplicarKit(c, 'sobrevivente'); }
    c.lapis.usa = false; return c;
  }
  let coresDoBoneco = null;
  /* monta o personagem com a arma sozinha na mão (sem a mão de voxel) */
  function semMaos(monta){
    const original = Maos.aplicar;
    Maos.aplicar = (c, cx, pecas) => { if (!armado(c)) return; pecas.mao_d.quads.length = 0; armaNaMao(c.arma.estilo, cx, comModificacoes(c.arma.estilo, c.modarma)); };
    try { return monta(); } finally { Maos.aplicar = original; }
  }
  const comMalha = h => ({malha:malha(h.quads), pulso:h.pulso, largura:h.largura, rumo:h.rumo});
  /* onde e como cada mão segura cada arma. Os pontos são dados nos blocos da arma (u ao longo, v lado, w cima) */
  function pegadas(C, id, mods){
    if (id === 'nenhum'){
      vm.maoD = comMalha(Bracos.segurando(C, {C:[0, 0, 0], a:[0, 1, 0], n:[-1, 0, 0], f:[0, 0, 1], rn:.012, rf:.013,
        polegar:[[-.036, .018, -.028], [-.03, .026, .004], [-.012, .026, .024], [.008, .022, .027]]}));
      vm.maoE = vm.maoD; return;
    }
    const em = (u, v, w) => mais(vm.punho, naArma(u, v, w)), rumo = (u, v, w) => unit(naArma(u, v, w)), lista = pontos => pontos.map(p => em(...p));
    const M = Maos.medidas(id), k = ESCALA, A = ARMAS[id];
    if (M.comGatilho){
      /* punho de arma: indicador no gatilho, polegar por cima, do outro lado */
      const eixoPunho = rumo(.34, 0, 1), frente = rumo(1, 0, -.34);
      vm.maoD = comMalha(Bracos.segurando(C, {C:em(-.55, 0, -1.2), a:eixoPunho, n:[-1, 0, 0], f:frente, rn:.7 * k, rf:1.05 * k,
        indicador:lista([[1.0, -1.02, .35], [2.0, -.78, .42], [2.3, -.18, .38]]), polegar:lista([[-1.9, -.7, .15], [-1.1, -.55, 1.15], [-.15, .55, 1.1], [.85, .95, .9]])}));
      if (M.classe === 'curta'){
        /* a outra mão abraça por fora, com o polegar deitado para a frente */
        vm.maoE = comMalha(Bracos.segurando(C, {C:em(-.5, 0, -1.55), a:eixoPunho, n:[1, 0, 0], f:frente, rn:1.35 * k, rf:1.75 * k,
          polegar:lista([[-1.8, 1.15, -.55], [-.7, 1.4, .25], [.45, 1.35, .45], [1.55, 1.15, .45]])}));
      } else {
        const f = Maos.formaDeApoio(id, 'mirando', mods);
        if (f?.tipo === 'vertical') vm.maoE = comMalha(Bracos.segurando(C, {C:em(f.u, 0, f.w), a:rumo(0, 0, 1), n:[1, 0, 0], f:rumo(1, 0, 0), rn:.6 * k, rf:.62 * k}));
        else if (f?.tipo === 'baixo') vm.maoE = comMalha(Bracos.segurando(C, {C:em(f.u - .3, 0, f.baixo + 1.0), a:rumo(1, 0, 0), n:rumo(0, 0, -1), f:[-1, 0, 0],
          rn:1.05 * k, rf:(f.v + .12) * k, volta:3.6, polegar:lista([[f.u - 1.4, f.v + .75, f.baixo - .2], [f.u - .3, f.v + .6, f.baixo + .8], [f.u + .8, f.v + .45, f.baixo + 1.35], [f.u + 1.8, f.v + .35, f.baixo + 1.5]])}));
      }
      return;
    }
    /* cabo de ferramenta e hastes: a mão fechada em volta */
    const r = Math.max(.45, M.raio) * k, eixoCabo = M.vertical ? [0, 1, 0] : [0, 0, 1], frente = M.vertical ? [0, 0, 1] : [0, -1, 0];
    vm.maoD = comMalha(Bracos.segurando(C, {C:vm.punho, a:eixoCabo, n:[-1, 0, 0], f:frente, rn:r, rf:r}));
    if (M.classe === 'haste') vm.maoE = comMalha(Bracos.segurando(C, {C:em(9, 0, 0), a:eixoCabo, n:[1, 0, 0], f:frente, rn:r, rf:r}));
  }
  /* detalhes pintados rentes à superfície disputam o mesmo lugar e tremem: cada face ganha um empurrãozinho
     (menos de 1,2 mm) para fora, diferente das vizinhas na lista */
  const separar = quads => quads.map((f, i) => { const k = (i % 29) * .00004, t = Math.hypot(...f.n) || 1; return {...f, v:f.v.map(v => [v[0] + f.n[0] / t * k, v[1] + f.n[1] / t * k, v[2] + f.n[2] / t * k])}; });
  const escolhidas = () => Object.fromEntries(['mira', 'ponta', 'baixo', 'carregador'].map(s => [s, $('peca_' + s).value || 'nenhum']));
  function montarArma(){
    const id = $('arma').value, mods = escolhidas();
    boneco.arma.estilo = id; boneco.modarma = {...(boneco.modarma || SEM_MOD), reforco:'nenhum', pintura:'nenhum', enfeite:'nenhum', ...mods};
    const mira = Miras.criar(id, mods, Primeira.medir(id, mods).boca);
    const montarSo = parte => montandoParte(parte, () => semMaos(() => mira && ENCAIXES[id]?.mira ? Miras.semMiraDeVoxel(id, falsa => { boneco.modarma.mira = falsa; const feito = montar(boneco); boneco.modarma.mira = mods.mira; return feito; }) : montar(boneco)));
    const comPente = Primeira.COM_PENTE.has(id);
    const m = montarSo(comPente ? false : null), g = Animacao.globais({}), peca = n => m.pecas.find(p => p.nome === n);
    /* os blocos do pente, nas coordenadas da mão */
    const doPente = comPente ? montarSo(true).pecas.find(p => p.nome === 'mao_d').quads : null;
    const reta = (n, quads) => quads.map(q => ({v:q.v.map(v => girar(g[n].q, v)), n:girar(g[n].q, q.n), cor:q.cor}));
    if (vm) [vm.arma, vm.pente, vm.pente3?.malha, vm.maoPente?.malha, vm.maoPinca?.malha, vm.braco, vm.maoD?.malha, vm.maoE?.malha, vm.flecha, vm.bolsa, vm.bolsaVazia, ...[...(vm.arcos?.values() || [])].map(a => a.malha), ...Object.values(vm.mira || {})].forEach(apagar);
    const deCorda = id === 'arco' || id === 'estilingue';
    $('barra').classList.toggle('alta', deCorda);                              /* para não passar na frente da forquilha */
    const C = coresDoBoneco || (coresDoBoneco = Bracos.cores(boneco));
    vm = {
      arma:id === 'nenhum' || deCorda ? null : malha(separar(reta('mao_d', peca('mao_d').quads))),
      braco:malha(Bracos.braco(C)), corda:deCorda ? id : null,
      vertical:id !== 'nenhum' && !!ARMAS[id].vertical,
      punho:id === 'nenhum' ? [0, 0, 0] : Animacao.pontoDaPeca('mao_d', Animacao.origemDaArma(id)),
      maoD:null, maoE:null,
    };
    if (deCorda){
      const forma = id === 'estilingue' ? Bracos.estilingue() : null;
      vm.maoD = comMalha(Bracos.maoDoCabo(C, id === 'arco' ? .0215 : .0178));
      vm.maoE = comMalha(id === 'arco' ? Bracos.maoNaCorda(C) : Bracos.maoNoCouro(C));
      if (id === 'arco') vm.flecha = malha(Bracos.flecha(.68));
      else { vm.forma = forma; vm.estilingue = malha(forma.quads); vm.bolsa = malha(Bracos.bolsa(true)); vm.bolsaVazia = malha(Bracos.bolsa(false)); }
    } else pegadas(C, id, mods);
    est = Primeira.criar(id, mods);
    if (est.f.tipo === 'tiro' && est.f.modo !== 'flecha' && est.f.modo !== 'besta') prepararRecarga(C, doPente, g.mao_d.q, reta);
    if (mira){
      est.medida.mira = mira.h;                         /* a arma sobe até esta linha ficar no centro da tela */
      const g2 = vm.punho, ponto = ([u, v, w]) => mais(g2, naArma(u, v, w)), vira = ([u, v, w]) => vm.vertical ? [v, u, w] : [v, w, u];
      const leva = lista => malha(separar(lista.map(f => ({v:f.v.map(ponto), n:vira(f.n), ns:f.ns && f.ns.map(vira), cor:f.cor}))));
      vm.mira = {solido:leva(mira.solido), luz:leva(mira.luz), vidro:leva(mira.vidro), brilho:leva(mira.brilho)};
      vm.janela = mira.janela && mira.janela.pts.map(([v, w]) => ponto([mira.janela.u, v, w]));
    }
    refazerLuneta = true;
    maoNaCorda = 0;
    puxadaAntes = 0;
    if (som){ som.trocarGrupo(); tocar('sacar', est.f.tipo === 'tiro' && est.f.modo !== 'flecha'); }
    $('nomeArma').textContent = id === 'nenhum' ? 'Mãos livres' : ARMAS[id].nome;
    $('ajuda').textContent = est.f.tipo === 'golpe' ? 'Clique: golpe · Segure e solte: golpe forte · Botão direito: defender'
      : est.f.modo === 'flecha' ? 'Segure para puxar e solte para disparar · Botão direito: mirar · A flecha cai com a distância'
      : 'Clique: atirar · Botão direito: mirar · R: recarregar · F: golpe com a arma';
    $('atirarTela').textContent = est.f.tipo === 'golpe' ? 'Golpear (segure: forte)' : est.f.modo === 'flecha' ? 'Puxar e soltar' : 'Atirar';
    $('mirarTela').textContent = est.f.tipo === 'golpe' ? 'Defender' : 'Mirar';
    $('recarregarTela').disabled = est.f.tipo !== 'tiro';
  }
  /* o pente como peça separada (e a mão que o segura), ou a mão que leva os cartuchos */
  function prepararRecarga(C, doPente, qMao, reta){
    const volta = [-qMao[0], -qMao[1], -qMao[2], qMao[3]], porta = mais(vm.punho, naArma(2.2, 1.25, 1.6));
    vm.porta = porta; vm.porta3 = girar(volta, porta);
    if (!doPente){ vm.maoPinca = comMalha(Bracos.maoNoCouro(C)); return; }
    const quads = reta('mao_d', doPente), mn = [9, 9, 9], mx = [-9, -9, -9];
    for (const f of quads) for (const v of f.v) for (let i = 0; i < 3; i++){ mn[i] = Math.min(mn[i], v[i]); mx[i] = Math.max(mx[i], v[i]); }
    const c = mn.map((v, i) => (v + mx[i]) / 2), h = mn.map((v, i) => (mx[i] - v) / 2);
    vm.pente = malha(separar(quads)); vm.penteBox = {c, h};
    vm.maoPente = comMalha(Bracos.segurando(C, {C:[0, -h[1] * .3, 0], a:[0, 1, 0], n:[1, 0, 0], f:[0, 0, 1], rn:Math.min(.07, h[0] + .003), rf:Math.min(.058, h[2] + .003)}));
    vm.pente3 = {malha:malha(separar(doPente)), c:girar(volta, c), baixo:girar(volta, [0, -1, 0]), h};
  }
  const meioGiro = (a, b, t) => { const s = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3] < 0 ? -1 : 1, q = a.map((v, i) => v + (b[i] * s - v) * t), n = Math.hypot(...q) || 1; return q.map(v => v / n); };
  /* troca as mãos e o pente de lugar enquanto a arma é recarregada */
  function recargaNasMaos(r){
    const p = vm.pente && Primeira.passoDoPente(est), d = r.d;
    if (p){
      const {c, h} = vm.penteBox, naArma_ = off => aplica(d.t, d.q, mais(c, off));
      const lugar = nome => nome === 'arma' ? {t:naArma_([0, 0, 0]), q:d.q} : nome === 'fora' ? {t:naArma_([0, -(h[1] + .055), -.012]), q:d.q}
        /* perto dos olhos, com a boca virada para quem olha */
        : nome === 'ver' ? {t:[.075, -.062 + Math.sin(est.tempo * 4) * .004, Math.max(.4, .33 + Math.max(h[1], h[2]))], q:qm(qy(.5 + Math.sin(est.tempo * 3) * .07), qm(qx(-.85), qz(.1)))}
        : {t:[.17, -.5, .42], q:qm(qx(-.35), d.q)};
      const a = lugar(p.de), b = lugar(p.ate), centro = a.t.map((v, i) => lerp(v, b.t[i], p.t)), q = meioGiro(a.q, b.q, p.t);
      r.pente = {t:centro, q, comMunicao:p.novo || !p.vazio, visto:p.u > .13};
      if (p.vazio && p.ate === 'ver' && vm.avisou !== est.durRecarga){ vm.avisou = est.durRecarga; aviso('Pente vazio', 1.1); }
      if (p.volta < .6){
        let mao = centro;
        if (p.chega < 1) mao = naArma_([0, -.05, .09]).map((v, i) => lerp(v, centro[i], p.chega));
        else if (p.ate === 'arma' && p.de === 'arma') mao = aplica(centro, q, [0, -.028 * (1 - p.tapa), 0]);
        r.e = {t:mao, q, mao:vm.maoPente, lado:'e', cotovelo:[.55, -.82, -.16]};
      }
    } else if (vm.maoPinca){
      const k = Primeira.passoDoCartucho(est); if (!k) return r;
      const porta = aplica(d.t, d.q, vm.porta), t = [.19, -.36, .42].map((v, i) => lerp(v, porta[i], k.k) + (i === 2 ? k.empurra * .02 : 0));
      r.e = {t, q:d.q, mao:vm.maoPinca, lado:'e', cotovelo:[.55, -.82, -.16]};
      if (k.naMao) r.cartucho = t;
    }
    return r;
  }
  /* a boca do pente: com bala aparece o latão; vazio, só o buraco escuro */
  function desenhaPente(mm){
    const P = mm.pente, {c, h} = vm.penteBox, q = P ? P.q : mm.d.q, centro = P ? P.t : aplica(mm.d.t, mm.d.q, c);
    desenha(vm.pente, matriz(tira(centro, girar(q, c)), q));
    if (!P || !P.visto) return;
    const topo = y => aplica(centro, q, [0, h[1] + y, 0]), larg = Math.min(.05, h[0] * 1.25), fundo = Math.min(.075, h[2] * 1.15);
    desenha(cubo, matriz(topo(.002), q, [larg, .004, fundo]), tom('#0E0E10'));
    if (P.comMunicao){
      desenha(cubo, matriz(aplica(topo(.01), q, [0, 0, -fundo * .1]), q, [larg * .72, .013, fundo * .62]), tom('#D9A636'));
      desenha(cubo, matriz(aplica(topo(.01), q, [0, 0, fundo * .3]), q, [larg * .5, .011, fundo * .2]), tom('#B5662F'));
    }
  }

  /* ponto da arma (u, v, w em blocos) em relação ao punho direito, já em metros */
  const naArma = (u, v, w) => vez(vm.vertical ? [v, u, w] : [v, w, u], ESCALA);
  const aplica = (t, q, p) => mais(t, girar(q, p));

  /* onde cada parte fica neste instante, no espaço da visão: d = a arma; maoD e e = as mãos */
  function maos(pos){
    const segurando = arena && arena.maos(); if (segurando) return segurando;
    if (vm.corda) return maosDeCorda(pos);
    if (est.id === 'nenhum'){
      const roda = q => qm(q, qz(-.5));
      const qd = roda(pos.q), parado = Primeira.QUADRIL.soco, comD = est.golpe && !est.golpe.g.esquerda;
      /* a esquerda é o espelho da direita, com o soco dela somado */
      const calmo = {p:comD ? parado.p : pos.p, q:comD ? Primeira.giroDe(parado.r) : pos.q};
      let p = [-calmo.p[0], calmo.p[1], calmo.p[2]], q = [calmo.q[0], -calmo.q[1], -calmo.q[2], calmo.q[3]];
      if (pos.outra){ p = mais(p, pos.outra.p); q = qm(pos.outra.q, q); }
      const d = {t:pos.p, q:qd};
      return {d, maoD:{...d, mao:vm.maoD, lado:'d'}, e:{t:p, q:qm(q, qz(.5)), s:[-1, 1, 1], mao:vm.maoE, lado:'e'}};
    }
    const q = pos.q, d = {t:tira(pos.p, girar(q, vm.punho)), q};
    const desloca = naArma(pos.mao[0], pos.mao[2], pos.mao[1]);
    return recargaNasMaos({d, maoD:{...d, mao:vm.maoD, lado:'d'}, e:vm.maoE ? {t:aplica(d.t, q, desloca), q, mao:vm.maoE, lado:'e'} : null});
  }
  /* arco e estilingue: a esquerda segura no lado da tela; a direita puxa até perto do rosto */
  function maosDeCorda(pos){
    const q = pos.q, G = pos.p, P = p => aplica(G, q, p), eArco = vm.corda === 'arco';
    const puxada = Math.min(1, est.puxada), s = puxada * puxada * (3 - 2 * puxada);
    const solta = P(eArco ? [.004, .045, -.125] : vm.forma.repouso), apoio = P(eArco ? [.0215, .0525, .004] : vm.forma.apoio);
    /* no fim da puxada, mão e apoio ficam um atrás do outro: a flecha segue reta para onde se mira */
    const ancora = [apoio[0] - .006, apoio[1] - (eArco ? .008 : .048), eArco ? .33 : .34];
    const desce = [0, pos.mao[1] * ESCALA * .6, 0];
    const nock = mais(solta.map((v, i) => lerp(v, ancora[i], s)), desce);
    /* sem puxar, a mão espera fora da tela; ela só sobe até a corda quando se começa a puxar */
    const na = maoNaCorda * maoNaCorda * (3 - 2 * maoNaCorda), espera = [-.2, -.44, .34];
    const ondeEsta = nock.map((v, i) => lerp(espera[i], v, na));
    return {d:{t:G, q}, maoD:{t:G, q, s:[-1, 1, 1], mao:vm.maoD, lado:'e', cotovelo:[.46, -.86, -.2]},
            e:{t:ondeEsta, q, s:eArco ? [.76, .76, .76] : [.66, .66, .66], mao:vm.maoE, lado:'d', cotovelo:eArco ? [-.8, -.58, -.18] : [-.5, -.86, -.12]},
            puxa:na > .55 ? ondeEsta : solta, naCorda:na, apoio};
  }
  const CLARO = [1.16, 1.16, 1.16];                      /* um pouco mais de luz nas mãos, para o detalhe aparecer */
  let maoNaCorda = 0;                                   /* 0 = esperando embaixo, 1 = na corda */
  /* os cotovelos descem e abrem para os lados, longe dos olhos. Mirando abrem um pouco mais */
  const COTOVELO = {d:[-.55, -.8, -.22], e:[.64, -.74, -.2]}, COTOVELO_MIRA = {d:[-.68, -.72, -.14], e:[.76, -.64, -.12]};
  const virado = (v, s) => s ? [v[0] * s[0], v[1] * s[1], v[2] * s[2]] : v;
  /* uma base com Z ao longo do braço e X na largura do pulso */
  function matrizDoBraco(t, ao, largura){
    const z = unit(ao); let x = tira(largura, vez(z, escalar(largura, z)));
    x = Math.hypot(...x) < 1e-4 ? unit(cruz([0, 1, 0], z)) : unit(x);
    const y = cruz(z, x);
    return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, t[0], t[1], t[2], 1]);
  }
  function desenhaMao(h){
    if (!h || !h.mao) return;
    desenha(h.mao.malha, matriz(h.t, h.q, h.s), CLARO);
    const pulso = aplica(h.t, h.q, virado(h.mao.pulso, h.s)), largura = girar(h.q, virado(h.mao.largura, h.s)), rumo = girar(h.q, virado(h.mao.rumo, h.s));
    let dir = h.cotovelo ? unit(h.cotovelo) : unit(COTOVELO[h.lado].map((v, i) => lerp(v, COTOVELO_MIRA[h.lado][i], est.mira)));
    /* o antebraço continua a mão, para o pulso não parecer quebrado, mas sem voltar na direção dos olhos */
    dir = unit(mais(vez(dir, .72), vez(rumo, -.48))); if (dir[2] < -.42) dir = unit([dir[0], dir[1], -.42]);
    desenha(vm.braco, matrizDoBraco(tira(pulso, vez(dir, .004)), dir, largura), CLARO);
  }
  /* ponto da boca do cano no espaço da visão */
  function boca(mm){
    if (vm.corda) return mm.apoio;
    const [u, w] = est.medida.boca; return aplica(mm.d.t, mm.d.q, mais(vm.punho, naArma(u, 0, w)));
  }
  /* um elástico chato esticado de a até b */
  function fita(a, b, larg, esp, cor){
    const d = tira(b, a), comp = Math.hypot(...d); if (comp < 1e-4) return;
    desenha(cubo, matriz(mais(a, vez(d, .5)), deAte([0, 0, 1], d), [esp, larg, comp]), tom(cor), 0);
  }
  function desenhaMunicao(mm){
    const P = (u, v, w) => aplica(mm.d.t, mm.d.q, mais(vm.punho, naArma(u, v, w)));
    const temMunicao = est.municao > 0 && est.recarga <= 0;
    if (vm.corda === 'arco'){
      /* o arco é refeito quando a puxada muda: as pontas se curvam para trás */
      const quanto = Math.round(Math.min(1, est.puxada) * mm.naCorda * 40) / 40;
      if (!vm.arco || vm.arco.quanto !== quanto){
        const guardados = vm.arcos || (vm.arcos = new Map());                 /* cada curvatura é montada uma vez só */
        if (!guardados.has(quanto)){ const a = Bracos.arco(quanto); guardados.set(quanto, {quanto, malha:malha(a.quads), topo:a.topo, base:a.base}); }
        vm.arco = guardados.get(quanto);
      }
      desenha(vm.arco.malha, matriz(mm.d.t, mm.d.q));
      const nock = mm.puxa, G = p => aplica(mm.d.t, mm.d.q, p);
      for (const ponta of [vm.arco.topo, vm.arco.base]){
        const p = G(ponta); risco(p, nock, .0028, '#E6DEC6', 0);
        risco(nock, mais(nock, vez(unit(tira(p, nock)), .045)), .0042, '#6E4B2C', 0);                      /* o reforço da corda onde vão os dedos */
      }
      if (temMunicao) desenha(vm.flecha, matriz(nock, deAte([0, 0, 1], tira(mm.apoio, nock))));
    } else if (vm.corda === 'estilingue'){
      desenha(vm.estilingue, matriz(mm.d.t, mm.d.q));
      const bolsa = mm.puxa, vira = deAte([0, 0, 1], tira(mm.apoio, bolsa)), lado = s => aplica(bolsa, vira, [s * .023, 0, -.001]);
      vm.forma.pontas.forEach((p, i) => { const de = aplica(mm.d.t, mm.d.q, p), ate = lado(i ? 1 : -1); fita(de, ate, .0105, .0022, '#C29A55'); fita(de, meio3(de, ate, .1), .0125, .004, '#1C1B1A'); });
      desenha(temMunicao ? vm.bolsa : vm.bolsaVazia, matriz(bolsa, vira));
    } else if (est.f.modo === 'besta' && est.municao > 0){
      const w = est.medida.boca[1]; risco(P(2, 0, w + .35), P(est.medida.ponta, 0, w + .35), .012, '#7A5A34', 0); risco(P(est.medida.ponta - 1.4, 0, w + .35), P(est.medida.ponta + .3, 0, w + .35), .02, '#8F949C', 0);
    }
  }
  const meio3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

  /* ---------------------------------------------------------------- efeitos */
  const tracos = [], marcas = [], voando = [], capsulas = [];
  /* a boca do cano é desenhada com outro campo de visão: corrige para a fumaça sair dela */
  function bocaNoMundo(mm){
    const b = boca(mm), k = Math.tan(fovAtual / 2) / Math.tan(ultimoFovArma / 2);
    return paraOMundo([b[0] * k, b[1] * k, b[2] + .04]);
  }
  /* tiro ou pancada que não pegou em gente nem em zumbi */
  function bateuEm(r, golpe){
    const cor = r.tipo === 'chao' ? '#9C9482' : r.tipo === 'placa' ? '#D5D2C8' : '#C2B59C';
    const metal = golpe && Efeitos.ehMetal(est.id, est.f);
    Efeitos.impacto(r.p, r.n, cor, golpe ? .8 : r.tipo === 'placa' ? .5 : 1);
    if (metal) Efeitos.faisca(r.p, r.n, 1); else if (!golpe && r.tipo === 'placa') Efeitos.faisca(r.p, r.n, .7);
  }
  function marca(p, n, cor = '#26221E', s = .05){
    const e = [Math.abs(n[0]) > .5 ? .012 : s, Math.abs(n[1]) > .5 ? .012 : s, Math.abs(n[2]) > .5 ? .012 : s];
    marcas.push({p:mais(p, vez(n, .006)), e, cor}); if (marcas.length > 90) marcas.shift();
  }
  let marcaTempo = 0, avisoTempo = 0, clareia = 0;
  function acertou(forte){ marcaTempo = .22; $('marca').className = forte ? 'forte' : ''; }
  function aviso(texto, t = 1.4){ $('mensagem').textContent = texto; avisoTempo = t; }
  const placar = {tiros:0, acertos:0, cabeca:0, caidos:0};
  function atingir(r, dano, dir, golpe){
    if (arena && r.tipo === 'zumbi'){ const res = arena.atingir(r, dano, dir, golpe); if (res){ placar.acertos++; if (res.zona === 'cabeca') placar.cabeca++; if (res.matou) placar.caidos++; } return; }
    if (arena && golpe && r.tipo === 'parede') arena.bateuNaParede();
    if (naCena && r.tipo === 'parede' && arena) arena.pancadaNoVidro(r.p);
    if (r.tipo === 'zumbi'){
      const z = r.zumbi, naCabeca = r.peca === 'cabeca', total = dano * (naCabeca ? 2.4 : /^(canela|pe|antebraco|mao)/.test(r.peca) ? .6 : 1);
      tocar('carne', r.p, {cabeca:naCabeca, deTiro:!golpe, arma:est.id, forte:golpe && dano > est.f.dano * 1.5});
      tocar('zumbi', posDoZumbi(z), z.vida - total <= 0 ? 'morte' : 'dor', z.cheia > 200);
      tocar('marcador', naCabeca || z.vida - total <= 0);
      z.vida -= total; z.pisca = .12; z.vt -= preso(total / 60, .25, golpe ? 2.6 : 1.4) * (z.cheia > 200 ? .5 : 1);
      Efeitos.sangue(r.p, vez(dir, -1), (golpe ? 1.2 : .7) * (naCabeca ? 1.4 : 1));
      if (!golpe) Efeitos.sangue(r.p, dir, naCabeca ? 1.1 : .6);                 /* o tiro atravessa */
      placar.acertos++; if (naCabeca) placar.cabeca++;
      if (z.vida <= 0){ const caiEm = [z.x - Math.sin(z.rumo) * .9, 0, z.z - Math.cos(z.rumo) * .9]; Efeitos.queda(caiEm, .9, .3); Efeitos.poca(caiEm); z.morto = 3.2; placar.caidos++; aviso(naCabeca ? 'Na cabeça! Zumbi caído' : 'Zumbi caído'); acertou(true); }
      else { acertou(naCabeca); if (naCabeca) aviso('Na cabeça!', .8); }
    } else if (r.tipo === 'placa'){
      if (golpe) tocar('material', r.p, est.id); else tocar('alvo', r.p, r.pontos);
      bateuEm(r, golpe);
      if (!golpe){ marca(r.p, r.n, '#111111', .035); placar.acertos++; acertou(r.pontos >= 9); aviso(`Alvo: ${r.pontos} pontos`, 1); }
    } else if (r.tipo){
      if (golpe) tocar('material', r.p, est.id); else tocar('impacto', r.p, r.tipo);
      bateuEm(r, golpe);
      if (!golpe) marca(r.p, r.n);
    }
  }
  function espalhado(abre){
    const b = base(), a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * abre;
    return unit(mais(b.f, mais(vez(b.direita, Math.cos(a) * r), vez(b.cima, Math.sin(a) * r))));
  }
  const GRAV = 7;
  const ritmo = () => Number($('ritmo').value) || 1;
  function tratar(ev, mm){
    if (ev.tipo === 'disparo'){
      placar.tiros++;
      tocar('tiro', est.id, est.f);
      const deFora = arena?.miraDaCamera(), olho = deFora ? deFora.origem : olhoDe(), saida = arena?.boca3() || paraOMundo(boca(mm));
      if (ev.voo){
        /* sai um pouco para cima, para cruzar a linha de mira a uns 15 m */
        const dir = espalhado(ev.espalha), alvo = raio(olho, dir, 15).p, inicio = paraOMundo(mais(boca(mm), [0, 0, .05])), vai = tira(alvo, inicio), t = Math.hypot(...vai) / ev.voo;
        const v = mais(vez(unit(vai), ev.voo), [0, GRAV * t / 2, 0]);
        voando.push({p:inicio, v, dir:unit(v), dano:ev.dano, tipo:ev.luz ? 'sinal' : ev.pedra ? 'pedra' : 'flecha', vida:5});
      } else if (ev.luz){
        const dir = espalhado(ev.espalha); voando.push({p:saida, v:vez(dir, 24), dir, dano:ev.dano, tipo:'sinal', vida:6});
      } else for (let i = 0; i < ev.balas; i++){
        const dir = espalhado(ev.espalha), r = raio(olho, dir);
        atingir(r, ev.dano, dir, false);
        if (i < 4) tracos.push({a:mais(saida, vez(unit(tira(r.p, saida)), .5)), b:r.p, vida:.05});
      }
      if (!ev.voo){
        /* mirando, a fumaça fica menor para não tapar o alvo */
        const quanto = (ev.balas > 1 ? 1.5 : 1) * (est.f.poucoClarao ? .5 : 1);
        Efeitos.fumaca(arena?.boca3() || bocaNoMundo(mm), direcao(), quanto, arena?.boca3() ? .9 : 1 - .6 * est.mira);
      }
      if (ev.capsula){ soltarCapsula(mm); tocar('capsula'); }
    } else if (ev.tipo === 'ciclo'){ soltarCapsula(mm); tocar('ciclo', est.f.modo); tocar('capsula'); }
    else if (ev.tipo === 'recarregar') tocar('recarga', est.id, est.f, est.durRecarga / ritmo());
    else if (ev.tipo === 'cartucho') tocar('capsula');
    else if (ev.tipo === 'golpe') tocar('golpe', est.id, !!est.golpe?.forte);
    else if (ev.tipo === 'acerto'){
      const olho = olhoDe(), b = base(), jaFoi = new Set(); let parede = null;
      for (const lado of [0, -.14, .14, -.3, .3]) for (const alto of [0, -.2, -.4]){
        const dir = unit(mais(b.f, mais(vez(b.direita, lado), vez(b.cima, alto)))), r = raio(olho, dir, ev.alcance + .25);
        if (r.tipo === 'zumbi' && !jaFoi.has(r.zumbi)){ jaFoi.add(r.zumbi); atingir(r, ev.dano, dir, true); jog.tranco += ev.forte ? .02 : .008; }
        else if (!parede && lado === 0 && r.tipo && r.tipo !== 'zumbi') parede = [r, dir];
      }
      if (!jaFoi.size && parede) atingir(parede[0], ev.dano, parede[1], true);
    }
    else if (ev.tipo === 'falha'){ aviso('Falhou! Aperte R para destravar', 2.2); tocar('falha'); }
    else if (ev.tipo === 'clique'){ aviso('Arma travada: aperte R', 1.2); tocar('seco'); }
    else if (ev.tipo === 'vazio'){ aviso('Sem munição', 1); tocar('seco'); }
    else if (ev.tipo === 'destravar'){ aviso('Destravando…', 1); tocar('destravar', est.durRecarga / ritmo()); }
  }
  function soltarCapsula(mm){
    const p = aplica(mm.d.t, mm.d.q, mais(vm.punho, naArma(1.2, -1, Math.max(2, est.medida.boca[1]))));
    capsulas.push({p, v:[-.7 - Math.random() * .4, .75 + Math.random() * .3, -.05 + Math.random() * .2], giro:Math.random() * 6, vida:.7});
    if (capsulas.length > 14) capsulas.shift();
  }

  function mexerMundo(dt){
    for (const z of arena ? [] : zumbis){
      z.pisca = Math.max(0, z.pisca - dt);
      if (z.morto > 0){
        z.morto -= dt; z.tombo = puxa(z.tombo, -1.52, 7, dt); z.vt = 0;
        if (z.morto <= 0){ z.morto = 0; z.vida = z.cheia; tocar('zumbi', posDoZumbi(z), 'ronco', z.cheia > 200); }
      } else {
        const n = Math.ceil(dt / .01), h = dt / n;
        for (let i = 0; i < n; i++){ z.vt += (-70 * z.tombo - 9 * z.vt) * h; z.tombo = preso(z.tombo + z.vt * h, -1.55, .3); }
        const quer = Math.atan2(jog.x - z.x, jog.z - z.z); z.rumo = Locomocao.angulo(z.rumo + Locomocao.angulo(quer - z.rumo) * Math.min(1, dt * 2));
      }
    }
    Efeitos.passo(dt);
    for (let i = tracos.length - 1; i >= 0; i--) if ((tracos[i].vida -= dt) <= 0) tracos.splice(i, 1);
    for (let i = capsulas.length - 1; i >= 0; i--){ const c = capsulas[i]; c.vida -= dt; c.v[1] -= 3.4 * dt; c.p = mais(c.p, vez(c.v, dt)); c.giro += dt * 14; if (c.vida <= 0) capsulas.splice(i, 1); }
    clareia = 0;
    for (let i = voando.length - 1; i >= 0; i--){
      const f = voando[i]; f.vida -= dt;
      if (f.parado){ if (f.tipo === 'sinal') clareia = Math.max(clareia, .6 * Math.min(1, f.vida)); if (f.vida <= 0) voando.splice(i, 1); continue; }
      f.v[1] -= (f.tipo === 'sinal' ? 3 : GRAV) * dt;
      const passo = vez(f.v, dt), comp = Math.hypot(...passo), dir = unit(passo), r = raio(f.p, dir, comp);
      if (r.tipo){
        atingir(r, f.dano, dir, false); f.p = r.p; f.dir = dir; f.parado = true;
        f.vida = f.tipo === 'sinal' ? 6 : f.tipo === 'flecha' && r.tipo !== 'zumbi' ? 8 : 0;
      } else { f.p = mais(f.p, passo); f.dir = dir; if (f.tipo === 'sinal') clareia = Math.max(clareia, .35); }
      if (f.vida <= 0) voando.splice(i, 1);
    }
    if (voando.length > 24) voando.splice(0, voando.length - 24);
  }

  /* ---------------------------------------------------------------- desenho */
  function cuboDeEfeito(p, q, s, cor, emite, alfa){ gl.uniform1f(U.alfa, alfa); desenha(cubo, matriz(p, q, s), tom(cor), emite); }
  const BASE_FOV = 62 * Math.PI / 180;
  let escondeArma = false;                       /* usado nos testes para medir quanto a arma tapa */
  let fovAtual = BASE_FOV, ultimoFovArma = 52 * Math.PI / 180, refazerLuneta = true;
  function desenhar(pos, mm){
    /* no modo celular a imagem pode ser desenhada mais leve */
    const r = canvas.getBoundingClientRect(), esc = Math.min(window.WO_RESOLUCAO || 2, window.devicePixelRatio || 1);
    const W = Math.max(2, Math.round(r.width * esc)), H = Math.max(2, Math.round(r.height * esc));
    if (canvas.width !== W || canvas.height !== H){ canvas.width = W; canvas.height = H; }
    const asp = W / H, noite = $('noite').checked ? 1 : 0, ceu = noite ? [.025, .035, .06] : [.74, .8, .86];
    gl.viewport(0, 0, W, H); gl.clearColor(...ceu, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
    const zoom = 1 + (est.f.tipo === 'tiro' ? (est.f.zoom - 1) * Math.pow(est.mira, 2) : 0) - est.correr * .06;
    fovAtual = 2 * Math.atan(Math.tan(BASE_FOV / 2) / zoom);
    const fora = arena ? arena.visao(ultimoDt) : null;                      /* 3ª pessoa */
    const olho = fora ? fora.olho : olhoDe(), dir = fora ? fora.dir : direcao();
    let lanterna = est.f.lanterna ? 1 : 0;
    if (lanterna && est.f.piscando) lanterna = Math.sin(est.tempo * 23) + Math.sin(est.tempo * 7.3) > -1.1 ? .75 : .08;
    const clarao = est.clarao > 0 ? (est.f.poucoClarao ? .35 : .85) : 0;
    gl.uniformMatrix4fv(U.vp, false, visaoProj(olho, dir, fovAtual, asp, .08, 140, fora ? 0 : jog.rola || 0));
    gl.uniform3fv(U.ceu, ceu); gl.uniform3fv(U.olho, olho); gl.uniform3fv(U.frente, dir);
    gl.uniform1f(U.noite, noite); gl.uniform1f(U.lanterna, lanterna * (noite ? 1 : .22)); gl.uniform1f(U.clarao, Math.max(clarao * .8, clareia)); gl.uniform1f(U.neblina, 1);
    gl.uniform1f(U.alfa, 1); gl.uniform1f(U.brilho, 0); gl.uniform1f(U.corte, 1e4);
    const I = matriz([0, 0, 0]);
    desenha(cenario, I);
    if (arena) arena.desenhar(); else desenha(placas, I);
    if (naCena){ desenha(placas, I); Cena.desenhar(); }
    for (const z of arena ? [] : zumbis) desenha(z.malha, matriz([z.x, z.morto > 0 ? .06 : 0, z.z], giroDoZumbi(z)), z.pisca > 0 ? [1.7, .75, .7] : [1, 1, 1]);
    for (const m of marcas) desenha(cubo, matriz(m.p, UM, m.e), tom(m.cor));
    Efeitos.desenhar(cuboDeEfeito, false);
    for (const t of tracos) risco(t.a, t.b, .012, '#FFE9A8');
    for (const f of voando){
      if (f.tipo === 'sinal'){ const s = f.parado ? .09 + Math.random() * .04 : .08; desenha(cubo, matriz(f.p, qy(est.tempo * 9), [s, s, s]), tom('#FF5A2A'), 1); }
      else if (f.tipo === 'pedra') desenha(cubo, matriz(f.p, UM, [.05, .05, .05]), tom('#7E8288'));
      else { const tras = mais(f.p, vez(f.dir, -.5)); risco(tras, mais(f.p, vez(f.dir, f.parado ? -.04 : 0)), .018, '#7A5A34', 0); risco(tras, mais(tras, vez(f.dir, .1)), .045, '#C0362C', 0); }
    }
    if (est.f.laser && est.recarga <= 0 && est.correr < .3){ const p = raio(olho, dir).p, s = .018 + Math.hypot(...tira(p, olho)) * .0022; desenha(cubo, matriz(tira(p, vez(dir, .02)), UM, [s, s, s]), tom('#FF2A20'), 1); }
    /* o clarão visto de fora */
    const pontaDeFora = fora && est.clarao > 0 ? arena.boca3() : null;
    if (pontaDeFora){
      const d = direcao(), giro = deAte([0, 0, 1], d), k = est.f.poucoClarao ? .55 : est.f.balas > 1 ? 1.5 : 1, g = Math.random() * 3;
      for (const [ang, comp, cor] of [[g, .24, '#FF9A2A'], [g + 1.57, .2, '#FF9A2A'], [g + .8, .14, '#FFD23A']]) desenha(cubo, matriz(pontaDeFora, qm(giro, qz(ang)), [comp * k, .035 * k, .035 * k]), tom(cor), 1);
      desenha(cubo, matriz(mais(pontaDeFora, vez(d, .06 * k)), giro, [.07 * k, .07 * k, .18 * k]), tom('#FFF2B8'), 1);
    }
    /* fumaça e pó por último, transparentes */
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    if (naCena) Cena.desenharVidros(cuboDeEfeito);
    Efeitos.desenhar(cuboDeEfeito, true);
    gl.uniform1f(U.alfa, 1); gl.depthMask(true); gl.disable(gl.BLEND);

    /* a arma e os braços: desenhados por cima, para não atravessarem as paredes */
    if (!pos.lunetaCheia && !escondeArma && !fora && !(naCena && Cena.maosOcupadas())){
      gl.clear(gl.DEPTH_BUFFER_BIT);
      /* encostando o olho: o campo da arma fecha um pouco, como quem foca na mira */
      const fovArma = 2 * Math.atan(Math.tan((26 - 2.6 * Math.max(0, est.olho)) * Math.PI / 180) * Math.max(1, 1.25 / asp));
      gl.uniformMatrix4fv(U.vp, false, visaoProj([0, 0, 0], [0, 0, 1], fovArma, asp, .035, 6));
      gl.uniform3f(U.olho, 0, 0, 0); gl.uniform3f(U.frente, 0, 0, 1);
      gl.uniform1f(U.noite, noite * .8); gl.uniform1f(U.lanterna, 0); gl.uniform1f(U.clarao, clarao * .5 + clareia * .5); gl.uniform1f(U.neblina, 0);
      if (!mm.preso) desenha(vm.arma, matriz(mm.d.t, mm.d.q));
      if (!mm.preso && vm.pente) desenhaPente(mm);
      if (mm.cartucho){ desenha(cubo, matriz(mm.cartucho, mm.d.q, [.016, .016, .042]), tom('#D9A636')); desenha(cubo, matriz(aplica(mm.cartucho, mm.d.q, [0, 0, .028]), mm.d.q, [.011, .011, .016]), tom('#B5662F')); }
      gl.uniform1f(U.brilho, .12); desenhaMao(mm.maoD); desenhaMao(mm.e); gl.uniform1f(U.brilho, 0);
      if (vm.mira && !mm.preso){
        const Mm = matriz(mm.d.t, mm.d.q);
        gl.uniform1f(U.brilho, 1); desenha(vm.mira.solido, Mm); gl.uniform1f(U.brilho, 0);
        desenha(vm.mira.luz, Mm, [1, 1, 1], .92);
      }
      if (!mm.preso) desenhaMunicao(mm);
      for (const c of capsulas) desenha(cubo, matriz(c.p, qm(qx(c.giro), qz(c.giro * .6)), [.012, .012, .03]), tom('#D9A636'));
      if (est.clarao > 0){
        const b = boca(mm), p = aplica(b, mm.d.q, [0, 0, .035]), g = Math.random() * 3, k = est.f.poucoClarao ? .5 : 1 + (est.f.balas > 1 ? .5 : 0);
        const braco = (ang, comp, larg, cor) => desenha(cubo, matriz(p, qm(mm.d.q, qz(ang)), [comp * k, larg * k, larg * k]), tom(cor), 1);
        braco(g, .12, .016, '#FF9A2A'); braco(g + 1.57, .1, .016, '#FF9A2A'); braco(g + .8, .07, .02, '#FFD23A');
        desenha(cubo, matriz(aplica(p, mm.d.q, [0, 0, .025]), qm(mm.d.q, qz(g)), [.032 * k, .032 * k, .085 * k]), tom('#FFF2B8'), 1);
      }
      if (vm.mira && !mm.preso && (vm.mira.vidro.n || vm.mira.brilho.n)){
        /* o vidro por último: quase transparente, com um reflexo atravessado */
        const Mm = matriz(mm.d.t, mm.d.q);
        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
        gl.uniform1f(U.alfa, .1); desenha(vm.mira.vidro, Mm, [1, 1, 1], .8);
        gl.uniform1f(U.alfa, .13 * (1 - est.mira * .55)); desenha(vm.mira.brilho, Mm, [1, 1, 1], 1);
        gl.uniform1f(U.alfa, 1); gl.depthMask(true); gl.disable(gl.BLEND);
      }
      ultimoFovArma = fovArma;
    }
  }

  /* ---------------------------------------------------------------- o que aparece por cima */
  const NS = 'http://www.w3.org/2000/svg';
  /* de um ponto da visão para a tela (pixels da página) */
  function naTela(p, W, H){ const k = (H / 2) / Math.tan(ultimoFovArma / 2); return [W / 2 - p[0] / p[2] * k, H / 2 - p[1] / p[2] * k]; }
  /* onde cruzar com a mira: quantos pixels abaixo do centro a flecha passa a cada distância */
  function quedas(H){
    const f = est.f; if (!f.voo || !mm) return [];
    const v = f.voo, saida = boca(mm)[1], t0 = 15 / v, foco = (H / 2) / Math.tan(fovAtual / 2);
    return [25, 35].map(m => { const t = m / v, altura = saida * (1 - m / 15) + GRAV * t * (t0 - t) / 2; return {m, px:-altura / m * foco}; }).filter(q => q.px > 3);
  }
  let chaveRet = '';
  function desenharReticulo(pos){
    const svg = $('reticulo'), f = est.f, caixaTela = canvas.getBoundingClientRect(), W = caixaTela.width, H = caixaTela.height;
    const luneta = f.mira === 'luneta' || f.mira === 'luneta_gamb';
    let tipo = '';
    if (f.tipo === 'tiro' && !luneta){
      if (f.mira === 'ponto' || f.mira === 'holografica') tipo = f.mira;
      else if (f.voo) tipo = 'flecha';
    }
    const forca = tipo ? preso((est.mira - (tipo === 'flecha' ? .55 : .25)) / .4, 0, 1) : 0;
    svg.style.opacity = forca; svg.dataset.tipo = tipo;
    if (!forca) return;
    const marcas = tipo === 'flecha' ? quedas(H) : [];
    const chave = [tipo, W, H, marcas.map(q => q.px.toFixed(0)).join()].join('|');
    if (chave !== chaveRet){
      chaveRet = chave;
      const k = H / 620 * (tipo === 'flecha' ? 1 : .74);
      let d = '';
      if (tipo === 'ponto') d = '<circle r="11" fill="url(#halo)"/><circle r="3.4" fill="#ff2412"/><circle r="1.4" fill="#ffd2c4"/>';
      if (tipo === 'holografica') d = '<g fill="none" stroke="#ff3a1c" stroke-width="2.1" stroke-linecap="round" filter="url(#aceso)"><circle r="25"/><path d="M0 -25V-33M0 25V33M-25 0H-33M25 0H33"/></g><circle r="5" fill="url(#halo)"/><circle r="2.1" fill="#ff5030"/>';
      if (tipo === 'flecha') d = '<circle r="3" fill="none" stroke="#000" stroke-width="3" opacity=".55"/><circle r="3" fill="none" stroke="#fff" stroke-width="1.4"/><circle r=".9" fill="#fff"/>'
        + marcas.map(q => `<g transform="translate(0 ${(q.px / k).toFixed(1)})"><path d="M-9 0H-3M3 0H9" stroke="#000" stroke-width="3.4" opacity=".55"/><path d="M-9 0H-3M3 0H9" stroke="#fff" stroke-width="1.6"/><text x="13" y="4" font-size="13" font-weight="700" fill="#fff" stroke="#000" stroke-width="2.6" paint-order="stroke">${q.m} m</text></g>`).join('');
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      $('desenhoRet').innerHTML = `<g transform="translate(${W / 2} ${H / 2}) scale(${k})">${d}</g>`;
    }
    /* o retículo só existe dentro do vidro: quando a arma balança, a moldura o esconde */
    if (vm.janela && (tipo === 'ponto' || tipo === 'holografica')){
      $('vidroRet').setAttribute('points', vm.janela.map(p => naTela(aplica(mm.d.t, mm.d.q, p), W, H).map(n => n.toFixed(1)).join()).join(' '));
      $('desenhoRet').setAttribute('clip-path', 'url(#janela)');
    } else $('desenhoRet').removeAttribute('clip-path');
  }

  let chaveLuneta = '';
  function desenharLuneta(pos){
    const svg = $('luneta'), f = est.f;
    svg.style.display = pos.lunetaCheia ? '' : 'none';
    if (!pos.lunetaCheia) return;
    const caixaTela = canvas.getBoundingClientRect(), W = caixaTela.width, H = caixaTela.height, gamb = f.mira === 'luneta_gamb';
    const R = Math.min(W, H) * (gamb ? .31 : .38), cx = W / 2, cy = H / 2;
    const marcas = quedas(H), chave = [W, H, gamb, fovAtual.toFixed(2), f.voo || 0, marcas.map(q => q.px.toFixed(0)).join()].join('|');
    if (chave !== chaveLuneta || refazerLuneta){
      chaveLuneta = chave; refazerLuneta = false;
      const mil = Math.tan(.005) / Math.tan(fovAtual / 2) * (H / 2);           /* 5 milésimos de ângulo na tela */
      const preto = gamb ? '#14160f' : '#0b0c0d';
      let r = '';
      const linha = (d, larg, cor = preto) => `<path d="${d}" stroke="${cor}" stroke-width="${larg}" fill="none"/>`;
      if (gamb){
        r += linha(`M${cx - R} ${cy + 1.5}L${cx - 7} ${cy}M${cx + 7} ${cy}L${cx + R} ${cy - 2}M${cx + 1.5} ${cy - R}L${cx} ${cy - 7}M${cx} ${cy + 7}L${cx - 2} ${cy + R}`, 2.4);
        r += `<circle cx="${cx}" cy="${cy}" r="2.2" fill="#b8321e"/>`;
      } else {
        r += linha(`M${cx - R} ${cy}H${cx - R * .46}M${cx + R * .46} ${cy}H${cx + R}M${cx} ${cy + R * (marcas.length ? .78 : .46)}V${cy + R}`, 5);
        r += linha(`M${cx - R * .46} ${cy}H${cx - 9}M${cx + 9} ${cy}H${cx + R * .46}M${cx} ${cy - R}V${cy - 9}M${cx} ${cy + 9}V${cy + R * (marcas.length ? .78 : .46)}`, 1.15);
        for (let i = 1; i * mil < R * .43; i++){
          const d = i * mil, t = i % 2 ? 3.5 : 6.5;
          r += linha(`M${cx - d} ${cy - t}v${t * 2}M${cx + d} ${cy - t}v${t * 2}` + (marcas.length ? '' : `M${cx - t} ${cy + d}h${t * 2}`), 1.15);
        }
        r += `<circle cx="${cx}" cy="${cy}" r="5.5" fill="url(#halo)"/><circle cx="${cx}" cy="${cy}" r="1.8" fill="#ff2a14"/>`;
      }
      /* um nome de cada lado, para as marcas próximas não se encavalarem */
      marcas.forEach((q, i) => { if (q.px < R * .8) r += linha(`M${cx - 15} ${cy + q.px}H${cx - 4}M${cx + 4} ${cy + q.px}H${cx + 15}`, 1.6) + `<text x="${cx + (i % 2 ? -20 : 20)}" y="${cy + q.px + 4 + (i % 2 ? 3 : -1)}" text-anchor="${i % 2 ? 'end' : 'start'}" font-size="12" font-weight="700" fill="${preto}" stroke="#e8e8e0" stroke-width="2.4" paint-order="stroke">${q.m} m</text>`; });
      let trincas = '';
      if (gamb) trincas = `<g stroke="#e4eef0" fill="none" opacity=".55"><path stroke-width="1.6" d="M${cx + R * .95} ${cy - R * .3}L${cx + R * .5} ${cy - R * .22}L${cx + R * .34} ${cy + R * .06}L${cx + R * .12} ${cy + R * .2}"/><path stroke-width=".9" d="M${cx + R * .5} ${cy - R * .22}L${cx + R * .28} ${cy - R * .5}M${cx + R * .34} ${cy + R * .06}L${cx + R * .44} ${cy + R * .5}M${cx + R * .34} ${cy + R * .06}L${cx + R * .1} ${cy - R * .1}"/></g><circle cx="${cx - R * .42}" cy="${cy + R * .35}" r="${R * .09}" fill="#3a3a22" opacity=".22"/>`;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      $('lunetaDentro').innerHTML = `
        <clipPath id="lente"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>
        <g clip-path="url(#lente)">
          <circle cx="${cx}" cy="${cy}" r="${R}" fill="${gamb ? '#8a9a3c' : '#3c7fa8'}" opacity="${gamb ? .17 : .06}"/>
          <ellipse cx="${cx - R * .34}" cy="${cy - R * .46}" rx="${R * .5}" ry="${R * .2}" transform="rotate(-34 ${cx - R * .34} ${cy - R * .46})" fill="url(#reflexo)"/>
          ${trincas}${r}
          <circle id="sombraLente" cx="${cx}" cy="${cy}" r="${R * 1.015}" fill="url(#borda)"/>
        </g>
        <path d="M${-W} ${-H}H${W * 2}V${H * 2}H${-W}ZM${cx - R} ${cy}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0Z" fill="#050506" fill-rule="evenodd"/>
        <circle cx="${cx}" cy="${cy}" r="${R + 3}" fill="none" stroke="#17181b" stroke-width="7"/>
        <circle cx="${cx}" cy="${cy}" r="${R + 7}" fill="none" stroke="#3b3f46" stroke-width="1.4"/>
        <circle cx="${cx}" cy="${cy}" r="${R - .6}" fill="none" stroke="${gamb ? '#6c7440' : '#46708a'}" stroke-width="1.2" opacity=".7"/>
        ${gamb ? '' : `<text id="distancia" x="${cx + R * .5}" y="${cy + R * .62}" font-size="15" font-weight="700" text-anchor="middle" fill="#ffb070" stroke="#000" stroke-width="3" paint-order="stroke"></text>`}`;
    }
    /* a lente cresce enquanto o olho se aproxima dela */
    const perto = preso((est.olho - .45) / .55, 0, 1), cresce = .5 + .5 * perto * perto * (3 - 2 * perto);
    $('lunetaDentro').setAttribute('transform', `translate(${cx} ${cy}) scale(${cresce.toFixed(3)}) translate(${-cx} ${-cy})`);
    /* a sombra da lente se desloca com o tranco e com o giro da cabeça; o retículo não sai do lugar */
    const sx = preso(est.balanco[0] * R * .9 + est.coice.z2 * 4, -R * .2, R * .2), sy = preso(-est.balanco[1] * R * .9 - est.coice.x * R * .28 + est.coice.z * R * .9, -R * .2, R * .2);
    const sombra = $('sombraLente'); if (sombra) sombra.setAttribute('transform', `translate(${sx.toFixed(1)} ${sy.toFixed(1)})`);
    const texto = $('distancia');
    if (texto){ const a = raio(olhoDe(), direcao(), 200), t = a.tipo ? Math.round(a.t) + ' m' : '— m'; if (texto.textContent !== t) texto.textContent = t; }
  }
  let htmlAntes = '';
  function painelDeTela(pos){
    const f = est.f, H = canvas.getBoundingClientRect().height;
    const miraNaTela = preso((est.mira - .55) / .45, 0, 1);
    const abre = f.tipo === 'tiro' ? lerp((f.abre || .03) * (1 + est.anda * 1.2), f.abreMira || 0, est.mira) : 0;
    const folga = preso(abre * (H / 2) / Math.tan(fovAtual / 2) + 4 + Math.abs(est.coice.x) * 18, 5, 90);
    const cruzSome = f.tipo !== 'tiro' || est.mira > .35 || est.correr > .5 || est.recarga > 0;
    $('cruz').style.setProperty('--folga', folga.toFixed(1) + 'px'); $('cruz').style.opacity = cruzSome ? 0 : 1;
    $('ponto').style.opacity = f.tipo === 'golpe' ? .85 : 0;
    $('foco').style.opacity = (f.tipo === 'tiro' && !luneta ? Math.max(0, est.olho) * .92 : 0).toFixed(2);
    desenharReticulo(pos);
    desenharLuneta(pos);
    $('carga').style.width = ((f.modo === 'flecha' ? est.puxada : est.segurando ? est.carga : 0) * 100).toFixed(0) + '%';
    $('barra').style.opacity = (f.modo === 'flecha' ? est.puxada : est.segurando ? est.carga : 0) > .05 ? 1 : 0;
    $('marca').style.opacity = marcaTempo > 0 ? 1 : 0;
    $('mensagem').style.opacity = avisoTempo > 0 ? 1 : 0;
    const municao = f.tipo !== 'tiro' ? (f.golpes ? 'corpo a corpo' : '') : est.recarga > 0 ? (est.destravando ? 'destravando' : est.cartuchos ? `carregando ${est.municao} / ${f.pente}` : 'recarregando') : est.travada ? 'TRAVADA' : `${est.municao} / ${f.pente}`;
    const html = municao + '|' + placar.tiros + placar.acertos + placar.cabeca + placar.caidos;
    if (html !== htmlAntes){ htmlAntes = html; $('municao').textContent = municao; $('placar').textContent = `Acertos: ${placar.acertos} · na cabeça: ${placar.cabeca} · caídos: ${placar.caidos}`; }
  }

  /* ---------------------------------------------------------------- controles */
  const teclas = new Set(), tela = {atirar:false, mirar:false};
  let mouseAtira = false, mouseMira = false, toques = 0, pedeRecarga = false, pedeGolpe = false, olharX = 0, olharY = 0, semTrava = false, arrasto = null, demo = null;
  const travado = () => document.pointerLockElement === canvas;
  function parar(){ if (demo){ demo = null; $('demo').textContent = arena ? '▶ Ver o computador lutando' : '▶ Demonstração automática'; } }
  function girarVisao(dx, dy){
    const s = Number($('sensibilidade').value) * .0023 / (1 + ((est.f.zoom || 1) - 1) * est.mira);     /* armas de perto não têm zoom */
    jog.rumo = Locomocao.angulo(jog.rumo - dx * s); jog.olha = preso(jog.olha - dy * s, -1.1, 1.1); olharX += dx * s; olharY += dy * s;
  }
  function pedirTrava(){
    try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => { semTrava = true; }); } catch (e){ semTrava = true; }
    setTimeout(() => { if (!travado()) semTrava = true; }, 500);
  }
  document.addEventListener('pointerlockchange', () => { if (!travado()){ mouseAtira = mouseMira = false; teclas.clear(); } else semTrava = false; $('convite').hidden = travado(); });
  document.addEventListener('pointerlockerror', () => { semTrava = true; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('pointerdown', e => {
    canvas.focus(); parar();
    if (!travado() && !semTrava && e.pointerType === 'mouse'){ pedirTrava(); return; }
    if (!travado()){ arrasto = [e.clientX, e.clientY]; try { canvas.setPointerCapture(e.pointerId); } catch (x){} if (e.pointerType !== 'mouse') return; }
    if (e.button === 0){ mouseAtira = true; toques++; } else if (e.button === 2) mouseMira = true;
  });
  canvas.addEventListener('pointermove', e => {
    if (travado()) girarVisao(e.movementX, e.movementY);
    else if (arrasto){ girarVisao((e.clientX - arrasto[0]) * 1.6, (e.clientY - arrasto[1]) * 1.6); arrasto = [e.clientX, e.clientY]; }
  });
  const soltaMouse = e => { if (e.button === 2) mouseMira = false; else mouseAtira = false; arrasto = null; };
  addEventListener('pointerup', soltaMouse); addEventListener('pointercancel', () => { mouseAtira = mouseMira = false; arrasto = null; });
  canvas.addEventListener('wheel', e => { e.preventDefault(); parar(); trocarArma(e.deltaY > 0 ? 1 : -1); }, {passive:false});
  const USADAS = ['w', 'a', 's', 'd', 'r', 'f', 'q', 'e', 'v', ' ', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ...(typeof Cena === 'object' && Cena.ativa ? ['c', 'g', 't', 'x', 'z'] : [])];
  addEventListener('keydown', e => {
    const k = e.key.toLowerCase(); if (!USADAS.includes(k) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (k !== 'shift') e.preventDefault();
    parar();
    if (arena && (naCena || !e.repeat) && arena.tecla(k, teclas, e.repeat)){ teclas.add(k === ' ' && !naCena ? 'esquiva' : k); return; }
    if (!e.repeat){ if (k === 'r') pedeRecarga = true; if (k === 'f') pedeGolpe = true; if (k === ' ') toques++; if (k === 'q') trocarArma(-1); if (k === 'e') trocarArma(1); }
    teclas.add(k);
  }, true);
  addEventListener('keyup', e => { if (e.key === ' ') e.preventDefault(); teclas.delete(e.key.toLowerCase()); }, true);
  addEventListener('blur', () => { teclas.clear(); mouseAtira = mouseMira = tela.atirar = false; });

  function trocarArma(sentido){
    const s = $('arma'); s.selectedIndex = (s.selectedIndex + sentido + s.options.length) % s.options.length; pecas(); montarArma();
  }
  function pecas(){
    const id = $('arma').value;
    for (const slot of ['mira', 'ponta', 'baixo', 'carregador']){
      const s = $('peca_' + slot), antes = s.value, ops = id === 'nenhum' ? {} : opcoesDe(id, slot);
      s.replaceChildren(new Option(slot === 'mira' ? 'De fábrica' : 'Nada', 'nenhum'), ...Object.entries(ops).map(([v, n]) => new Option(n, v)));
      s.value = ops[antes] ? antes : 'nenhum'; s.disabled = !Object.keys(ops).length;
    }
  }

  /* ---------------------------------------------------------------- demonstração automática */
  /* cada trecho: [segundos, comando]. "toques" = quantas vezes aperta durante o trecho */
  function roteiro(){
    const f = est.f;
    if (f.tipo === 'golpe') return [[1.0, {}], [.7, {toques:1}], [.8, {toques:1}], [.8, {toques:1}], [1.0, {segura:true}], [1.3, {}], [1.4, {mirar:true}], [.8, {}]];
    if (f.modo === 'flecha') return [[1.0, {}], [.9, {segura:true}], [1.5, {}], [.6, {mirar:true}], [1.0, {mirar:true, segura:true}], [1.2, {mirar:true}], [1.0, {mirar:true, segura:true}], [1.2, {mirar:true}], [.8, {}]];
    const passo = Math.max(.34, f.intervalo + .12), rajada = f.modo === 'auto' ? [.55, {segura:true}] : [passo * 3, {toques:3}];
    return [[1.0, {}], rajada, [.9, {}], [.8, {mirar:true}], [rajada[0], {...rajada[1], mirar:true}], [1.2, {mirar:true}], [.5, {}], [f.recarga + .6, {recarregar:true}], [1.1, {bater:true}], [.6, {}]];
  }
  function iniciarDemo(){
    if (arena){ demo = {arena:true}; $('demo').textContent = '■ Parar a demonstração'; return; }
    montarArma();
    const perto = est.f.tipo === 'golpe', z = zumbis[perto ? 0 : 1];
    if (perto){ jog.x = z.x - .12; jog.z = z.z - Math.min(1.35, est.f.alcance - .2); } else { jog.x = 0; jog.z = 0; }
    for (const a of zumbis){ a.morto = 0; a.vida = a.cheia; a.tombo = 0; a.vt = 0; }
    demo = {t:0, trechos:roteiro(), i:0, dentro:0, dados:0, z};
    $('demo').textContent = '■ Parar a demonstração';
  }
  function comandoDaDemo(dt){
    const d = demo, [dura, c] = d.trechos[d.i], antes = d.dentro; d.dentro += dt;
    const saida = {atirar:false, apertou:false, mirar:!!c.mirar, recarregar:false, bater:false, andando:0, correr:false};
    if (c.segura){ saida.atirar = true; saida.apertou = antes === 0; }
    if (c.toques){ const cada = dura / c.toques; if (Math.floor(d.dentro / cada) !== Math.floor(antes / cada) || antes === 0){ if (d.dados < c.toques){ d.dados++; saida.apertou = saida.atirar = true; } } }
    if (c.recarregar && antes === 0){ if (est.municao >= est.f.pente) est.municao = Math.max(0, est.municao - 1); saida.recarregar = true; }
    if (c.bater && antes === 0) saida.bater = true;
    /* olha para o peito do alvo */
    const o = olhoDe(), dx = d.z.x - o[0], dz = d.z.z - o[2], alto = d.z.morto > 0 ? .5 : est.f.tipo === 'golpe' ? 1.34 : 1.22;
    jog.rumo = Locomocao.angulo(jog.rumo + Locomocao.angulo(Math.atan2(dx, dz) - jog.rumo) * Math.min(1, dt * 5));
    jog.olha = puxa(jog.olha, Math.atan2(alto - o[1], Math.hypot(dx, dz)), 4, dt);
    if (d.dentro >= dura){
      d.i++; d.dentro = 0; d.dados = 0;
      if (d.i >= d.trechos.length){
        if ($('todas').checked){ trocarArma(1); iniciarDemo(); } else iniciarDemo();
      }
    }
    return saida;
  }
  function comandoDoJogador(dt){
    const tem = k => teclas.has(k);
    const frente = (tem('w') ? 1 : 0) - (tem('s') ? 1 : 0), lado = (tem('d') ? 1 : 0) - (tem('a') ? 1 : 0);
    const gira = (tem('arrowright') ? 1 : 0) - (tem('arrowleft') ? 1 : 0), sobe = (tem('arrowdown') ? 1 : 0) - (tem('arrowup') ? 1 : 0);
    if (gira || sobe) girarVisao(gira * dt * 700, sobe * dt * 500);
    const corre = tem('shift') && frente > 0, anda = frente || lado ? 1 : 0;
    if (anda && !naCena){
      const v = (corre ? 4.6 : 2.2) * (1 - (est?.mira || 0) * .5) * (arena ? arena.passoDoJogador(frente, lado) * (1 - est.bloqueio * .45) : 1) * dt / Math.hypot(frente, lado);
      const s = Math.sin(jog.rumo), c = Math.cos(jog.rumo);
      const nx = preso(jog.x + (s * frente - c * lado) * v, -11.5, 11.5), nz = preso(jog.z + (c * frente + s * lado) * v, -5, 56);
      const livre = (x, z) => !solidos.some(k => k[2] < 1.4 && x > k[0] - .25 && x < k[1] + .25 && z > k[4] - .25 && z < k[5] + .25) && (arena || !zumbis.some(a => !a.morto && Math.hypot(x - a.x, z - a.z) < .55));
      if (livre(nx, jog.z)) jog.x = nx; if (livre(jog.x, nz)) jog.z = nz;
    }
    const segurando = mouseAtira || tela.atirar || !arena && tem(' ');
    const c = {atirar:segurando || toques > 0, apertou:toques > 0, mirar:mouseMira || tela.mirar, correr:corre, andando:anda, recarregar:pedeRecarga, bater:pedeGolpe};
    toques = 0; pedeRecarga = pedeGolpe = false;
    return c;
  }

  /* ---------------------------------------------------------------- um quadro */
  let pos = null, mm = null, ultimoDt = 1 / 60;
  function quadro(dt, desenharTambem = true){
    ultimoDt = dt;
    const c = demo ? (arena ? arena.demo(dt) : comandoDaDemo(dt)) : comandoDoJogador(dt);
    if (arena) arena.antes(dt, c);
    c.olhar = [olharX, olharY]; olharX = olharY = 0;
    const eventos = Primeira.passo(est, dt, c).slice();
    /* o tranco do tiro: parte fica, parte volta sozinha */
    jog.olha = preso(jog.olha + est.camera.y * .3, -1.1, 1.1); jog.tranco += est.camera.y * .9; jog.rumo -= est.camera.x; est.camera.x = est.camera.y = 0;
    jog.tranco = puxa(jog.tranco, 0, 11, dt);
    marcaTempo -= dt; avisoTempo -= dt;
    maoNaCorda = puxa(maoNaCorda, est.puxada > .02 ? 1 : 0, est.puxada > .02 ? 18 : 9, dt);
    mexerMundo(dt);
    if (arena) arena.depois(dt, c, eventos);
    pos = Primeira.posicao(est); mm = maos(pos);
    sonsDoQuadro(dt);
    for (const ev of eventos) tratar(ev, mm);
    if (desenharTambem){ desenhar(pos, mm); painelDeTela(pos); if (arena) arena.hud(); }
    return eventos;
  }
  let anterior = 0, parado = false;
  function laco(agora){
    if (parado) return;
    const dt = anterior ? Math.min(.05, (agora - anterior) / 1000) : .016; anterior = agora;
    quadro(dt * Number($('ritmo').value));
    requestAnimationFrame(laco);
  }

  /* ---------------------------------------------------------------- começo */
  boneco = personagem();
  const sel = $('arma');
  sel.add(new Option('Mãos livres', 'nenhum'));
  for (const [t, titulo] of Object.entries(TIPOS_ARMA)){
    const g = document.createElement('optgroup'); g.label = titulo;
    for (const [id, a] of Object.entries(ARMAS)) if (a.tipo === t) g.append(new Option(a.nome, id));
    sel.append(g);
  }
  const armaPedida = new URLSearchParams(location.search).get('arma');
  sel.value = ARMAS[armaPedida] ? armaPedida : 'fuzil_assalto';
  for (const slot of ['mira', 'ponta', 'baixo', 'carregador']) $('peca_' + slot).add(new Option('Nada', 'nenhum'));
  pecas(); $('peca_mira').value = 'ponto'; montarArma();
  sel.addEventListener('change', () => { const rodando = !!demo; pecas(); if (rodando) iniciarDemo(); else montarArma(); sel.blur(); });
  for (const slot of ['mira', 'ponta', 'baixo', 'carregador']) $('peca_' + slot).addEventListener('change', () => { const rodando = !!demo; if (rodando) iniciarDemo(); else montarArma(); $('peca_' + slot).blur(); });
  $('demo').addEventListener('click', () => { if (demo) parar(); else iniciarDemo(); $('demo').blur(); });
  $('noite').addEventListener('change', () => $('noite').blur());
  /* preferência de som deste navegador */
  try { const s = JSON.parse(localStorage.getItem('wo-som') || 'null'); if (s){ $('somLigado').checked = !!s.ligado; $('volume').value = s.volume; } } catch (e){}
  const guardarSom = () => { try { localStorage.setItem('wo-som', JSON.stringify({ligado:$('somLigado').checked, volume:Number($('volume').value)})); } catch (e){} };
  $('somLigado').addEventListener('change', () => { ligarSom(); if (som) som.volume(volumeEscolhido()); mostrarSom(); guardarSom(); $('somLigado').blur(); });
  $('volume').addEventListener('input', () => { if (som) som.volume(volumeEscolhido()); guardarSom(); });
  /* o botão "Ligar o som" libera o áudio sem interromper a demonstração */
  $('ativarSom').addEventListener('click', () => { ligarSom(); tocar('sacar', true); $('ativarSom').blur(); });
  addEventListener('pointerdown', ligarSom, true); addEventListener('keydown', ligarSom, true);
  const botao = (id, desce, sobe) => {
    const b = $(id);
    b.addEventListener('pointerdown', e => { e.preventDefault(); parar(); try { b.setPointerCapture(e.pointerId); } catch (x){} desce(); });
    if (sobe){ b.addEventListener('pointerup', sobe); b.addEventListener('pointercancel', sobe); b.addEventListener('lostpointercapture', sobe); }
  };
  botao('atirarTela', () => { tela.atirar = true; toques++; }, () => { tela.atirar = false; });
  botao('mirarTela', () => { tela.mirar = !tela.mirar; $('mirarTela').classList.toggle('ativo', tela.mirar); });
  botao('recarregarTela', () => { pedeRecarga = true; });
  botao('golpeTela', () => { pedeGolpe = true; });
  /* paredes que seguram um corpo */
  function empurrarDasParedes(c, raio_){
    if (naCena){ c.x = preso(c.x, -Cena.MEIO + .3, Cena.MEIO - .3); c.z = preso(c.z, -Cena.MEIO + .3, Cena.MEIO - .3); }
    else { c.x = preso(c.x, -11.6, 11.6); c.z = preso(c.z, -5.2, 56.5); }
    const pes = c.y || 0;
    for (const k of solidos){
      if (k[2] > pes + 1.4 || naCena && k[3] <= pes + .31) continue;
      const px = preso(c.x, k[0], k[1]), pz = preso(c.z, k[4], k[5]), dx = c.x - px, dz = c.z - pz, d = Math.hypot(dx, dz);
      if (d < raio_ && d > 1e-5){ c.x = px + dx / d * raio_; c.z = pz + dz / d * raio_; }
    }
  }
  if (arena){
    if (naCena) Cena.ligar({corte:y => gl.uniform1f(U.corte, y ?? 1e4), malha, matriz, desenha, qm, qx, qy, qz, girar, bloco, risco,
      cubo:(p, q, s, cor, emite) => desenha(cubo, matriz(p, q || UM, s), tom(cor), emite),
      malhaCrua:d => { const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW); return {buf, n:d.length / 9}; }});
    arena.ligar({bloco, solidos:() => solidos, jog, malha, matriz, desenha, risco, cubo:(p, q, s, cor, emite) => desenha(cubo, matriz(p, q || UM, s), tom(cor), emite), teclas:() => teclas, recarga:() => vm?.pente3 || (vm?.porta3 ? {porta:vm.porta3, c:[0, 0, 0], baixo:[0, -1, 0], h:[0, 0, 0]} : null), raioCaixa, qm, qx, qy, qz, girar, olho:() => olhoDe(), direcao, estado:() => est, aviso, acertou, tocar, pecas, montarArma, parar,
      andar:(dx, dz) => { jog.x += dx; jog.z += dz; empurrarDasParedes(jog, .28); },
      empurrar:empurrarDasParedes,
      limpar:() => { marcas.length = tracos.length = voando.length = capsulas.length = 0; Efeitos.limpar(); },
      boneco:() => structuredClone(boneco),
      /* as mãos abertas, para segurar o zumbi pelos ombros */
      maosAbertas:() => comMalha(Bracos.segurando(coresDoBoneco || (coresDoBoneco = Bracos.cores(boneco)), {C:[0, 0, 0], a:[0, 1, 0], n:[-1, 0, 0], f:[0, 0, 1], rn:.05, rf:.055, volta:2.3}))});
  } else iniciarDemo();
  if (arena) $('demo').textContent = '▶ Ver o computador lutando';
  mostrarSom();
  requestAnimationFrame(laco);

  return {olhar:girarVisao, quadro, esconderArma:v => { escondeArma = v; }, redesenhar:() => desenhar(pos, mm), iniciarDemo, usarSom:s => { som = s; }, som:() => som, parar, montarArma, pecas, trocarArma, raio, jog, zumbis, placar, tela,
          estado:() => est, posicao:() => pos, maos:() => mm, boca:() => boca(mm),
          pausar:() => { parado = true; }, continuar:() => { if (parado){ parado = false; anterior = 0; requestAnimationFrame(laco); } }};
})();
