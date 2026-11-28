/* Montador de cenários: visor 3D, colocar e mover itens, personagens, salvar e exportar.
   Usa a biblioteca (cenario-itens.js) e, para os personagens, os mesmos arquivos do criador. */
(() => {
const {CATEGORIAS, ITENS, FIXAS, LISOS} = BIBLIOTECA;
const $ = s => document.querySelector(s);
const GUARDA = 'wo-montador-cenario', GUARDA_PERSONAGEM = 'wo-criador-personagem';
const CHAOS = {grama:['Grama', '#6E9552'], terra:['Terra', '#8C6E4E'], concreto:['Concreto', '#9D9B94'], asfalto:['Asfalto', '#4A4C52'], areia:['Areia', '#CDB57E'], neve:['Neve', '#E4E8EC'], estudio:['Estúdio', '#D4D5D8']};
const LUZES = {
  dia:{nome:'Dia', cor:[1, 1, 1], ceu:'linear-gradient(#9CC8EC,#DCEAF2 62%,#E9E6DA)', fundo:['#9CC8EC', '#E9E6DA']},
  tarde:{nome:'Entardecer', cor:[1.1, .84, .66], ceu:'linear-gradient(#59517F,#E58B5B 62%,#F4C27A)', fundo:['#59517F', '#F4C27A']},
  noite:{nome:'Noite', cor:[.58, .68, .98], ceu:'linear-gradient(#080C1C,#17213D 62%,#27304A)', fundo:['#080C1C', '#27304A']},
  nublado:{nome:'Nublado', cor:[.8, .84, .84], ceu:'linear-gradient(#8B949B,#B8BDBC 62%,#BDBBB0)', fundo:['#8B949B', '#BDBBB0']},
};

/* ================================================================ geometria dos itens */
function paletaItem(def, cores){
  const base = {...FIXAS};
  for (const [k, [, padrao]] of Object.entries(def.cores)) base[k] = (cores && cores[k]) || padrao;
  return nome => {
    if (base[nome]) return base[nome];
    const m = /^(.*)_(sombra|escuro|claro)$/.exec(nome);
    if (!m || !base[m[1]]) return '#FF00FF';
    const v = base[m[1]];
    return (base[nome] = m[2] === 'sombra' ? tom(v, .84) : m[2] === 'escuro' ? tom(v, .64) : misto(v, '#FFFFFF', .17));
  };
}
const FACES_CAIXA = [[[-1,0,0], [[0,0,0],[0,0,1],[0,1,1],[0,1,0]]], [[1,0,0], [[1,0,1],[1,0,0],[1,1,0],[1,1,1]]],
  [[0,-1,0], [[0,0,0],[1,0,0],[1,0,1],[0,0,1]]], [[0,1,0], [[0,1,1],[1,1,1],[1,1,0],[0,1,0]]],
  [[0,0,-1], [[1,0,0],[0,0,0],[0,1,0],[1,1,0]]], [[0,0,1], [[0,0,1],[1,0,1],[1,1,1],[0,1,1]]]];
function quadsDoItem(def, cores){
  const cor = paletaItem(def, cores), quads = [];
  let numero = 0;
  const g = {b(x, y, z, w, h, d, mat, px = .2){
    const id = numero++, base = cor(mat), liso = LISOS.has(mat), min = [x - w / 2, y, z - d / 2], tam = [w, h, d];
    for (const [n, cantos] of FACES_CAIXA){
      if (n[1] < 0 && y < .02) continue;
      const P = cantos.map(c => c.map((v, i) => min[i] + v * tam[i]));
      const comp = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      const nu = liso ? 1 : Math.max(1, Math.min(24, Math.round(comp(P[0], P[1]) / px))), nv = liso ? 1 : Math.max(1, Math.min(24, Math.round(comp(P[0], P[3]) / px)));
      const meio = (a, b, t) => [0, 1, 2].map(i => a[i] + (b[i] - a[i]) * t);
      const em = (s, t) => meio(meio(P[0], P[1], s), meio(P[3], P[2], s), t);
      for (let u = 0; u < nu; u++) for (let v = 0; v < nv; v++){
        let c = base;
        if (!liso){ const r = ruido(`${def.id}|${id}|${n}|${u},${v}`); if (r >= 62) c = tom(base, r < 82 ? .95 : 1.05); }
        if (def.pintaPixel) c = def.pintaPixel(c, mat, em((u + .5) / nu, (v + .5) / nv), n);
        quads.push({v:[em(u / nu, v / nv), em((u + 1) / nu, v / nv), em((u + 1) / nu, (v + 1) / nv), em(u / nu, (v + 1) / nv)], n, cor:c});
      }
    }
  }};
  def.desenhar(g);
  return quads;
}

const cacheQuads = new Map();
function geometria(o){
  const chave = o.tipo === 'personagem' ? 'p|' + JSON.stringify(o.cfg) : `i|${o.id}|${JSON.stringify(o.cores || {})}`;
  if (!cacheQuads.has(chave)){
    const quads = o.tipo === 'personagem' ? posar(montar(o.cfg), o.cfg.pose).quads : quadsDoItem(ITENS[o.id], o.cores);
    const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    for (const q of quads) for (const v of q.v) for (let i = 0; i < 3; i++){ lo[i] = Math.min(lo[i], v[i]); hi[i] = Math.max(hi[i], v[i]); }
    cacheQuads.set(chave, {chave, quads, lo, hi, buffer:null});
  }
  return cacheQuads.get(chave);
}
const nomeDe = o => o.tipo === 'personagem' ? `${o.cfg.zumbi ? 'Zumbi' : 'Personagem'}: ${o.cfg.nome}` : ITENS[o.id].nome;
const ehChao = o => o.tipo !== 'personagem' && !!ITENS[o.id].chao;

/* ================================================================ estado e desfazer */
const vazio = () => ({chao:'grama', luz:'dia', grade:true, itens:[]});
let cena = vazio(), sel = -1, passado = [], futuro = [], encaixe = .25;

function validarCena(c){
  const out = vazio();
  if (!c || typeof c !== 'object') return out;
  if (Object.hasOwn(CHAOS, c.chao)) out.chao = c.chao;
  if (Object.hasOwn(LUZES, c.luz)) out.luz = c.luz;
  out.grade = c.grade !== false;
  const num = (v, a, b, p) => Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : p;
  for (const o of (Array.isArray(c.itens) ? c.itens.slice(0, 600) : [])){
    if (!o) continue;
    const base = {x:num(o.x, -60, 60, 0), y:num(o.y, -3, 30, 0), z:num(o.z, -60, 60, 0), giro:num(o.giro, -1e4, 1e4, 0), escala:num(o.escala, .25, 4, 1)};
    if (o.tipo === 'personagem') out.itens.push({tipo:'personagem', cfg:validar(o.cfg), ...base});
    else if (Object.hasOwn(ITENS, o.id)){
      const cores = {};
      for (const k of Object.keys(ITENS[o.id].cores)) if (/^#[0-9a-f]{6}$/i.test(o.cores?.[k] || '')) cores[k] = o.cores[k];
      out.itens.push({tipo:'item', id:o.id, cores, ...base});
    }
  }
  return out;
}
const foto = () => JSON.stringify(cena);
function lembrar(){ passado.push(foto()); if (passado.length > 80) passado.shift(); futuro = []; }
function guardar(){ try { localStorage.setItem(GUARDA, foto()); } catch (e){} }
function voltar(de, para){ if (!de.length) return; para.push(foto()); cena = JSON.parse(de.pop()); sel = -1; mudou(); }
function mudou(painel = true){ guardar(); desenhar(); if (painel) painelDireito(); }

/* ================================================================ visor */
const canvas = $('#cena');
const gl = canvas.getContext('webgl', {antialias:true, alpha:true, premultipliedAlpha:false, preserveDrawingBuffer:true});
const VS = `attribute vec3 p, n, c; uniform mat4 mvp; uniform vec3 pos; uniform vec2 rot; uniform float esc; varying vec3 vn, vc;
  vec3 gira(vec3 v){ return vec3(v.x*rot.x + v.z*rot.y, v.y, v.z*rot.x - v.x*rot.y); }
  void main(){ vn = gira(n); vc = c; gl_Position = mvp * vec4(gira(p*esc) + pos, 1.0); }`;
const FS = `precision mediump float; varying vec3 vn, vc; uniform vec3 luz1, luz2, tinta; uniform float modo, realce;
  void main(){
    if (modo > 1.5){ gl_FragColor = vec4(vc, 1.0); return; }
    if (modo > .5){ gl_FragColor = vec4(0.0, 0.0, 0.0, .26 * clamp((1.0 - max(abs(vc.x), abs(vc.y))) * 3.0, 0.0, 1.0)); return; }
    vec3 n = normalize(vn);
    float d = .55 + .14*n.y + .43*max(dot(n, luz1), 0.0) + .16*max(dot(n, luz2), 0.0);
    vec3 cor = vc * min(d, 1.12) * tinta;
    gl_FragColor = vec4(mix(cor, vec3(.95, .42, .2), realce), 1.0);
  }`;
let U = {}, A = [];
if (gl){
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
  A = ['p', 'n', 'c'].map(a => gl.getAttribLocation(pr, a));
  for (const n of ['mvp', 'pos', 'rot', 'esc', 'luz1', 'luz2', 'tinta', 'modo', 'realce']) U[n] = gl.getUniformLocation(pr, n);
}
const cam = {giro:.62, elev:.5, dist:19, x:0, y:1, z:0};
const norm = v => { const t = Math.hypot(...v) || 1; return v.map(a => a / t); };
const cruz = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
const ponto = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
const FOV = 36 * Math.PI / 180;
function eixosCamera(){
  const dir = [Math.sin(cam.giro) * Math.cos(cam.elev), Math.sin(cam.elev), Math.cos(cam.giro) * Math.cos(cam.elev)];
  const olho = [cam.x + dir[0] * cam.dist, cam.y + dir[1] * cam.dist, cam.z + dir[2] * cam.dist];
  const z = norm(dir), x = norm(cruz([0, 1, 0], z)), y = cruz(z, x);
  return {olho, x, y, z};
}
function matriz(asp){
  const {olho, x, y, z} = eixosCamera();
  const view = [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -ponto(x, olho), -ponto(y, olho), -ponto(z, olho), 1];
  const f = 1 / Math.tan(FOV / 2), n = .1, L = 300;
  const proj = [f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (L + n) / (n - L), -1, 0, 0, 2 * L * n / (n - L), 0];
  const r = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let l = 0; l < 4; l++) r[c*4 + l] = proj[l]*view[c*4] + proj[4 + l]*view[c*4 + 1] + proj[8 + l]*view[c*4 + 2] + proj[12 + l]*view[c*4 + 3];
  return r;
}
function bufferDe(vertices){ const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW); return {b, n:vertices.length / 9}; }
function bufferQuads(quads){
  const d = new Float32Array(quads.length * 54); let o = 0;
  for (const q of quads){ const c = rgb(q.cor).map(v => v / 255); for (const i of [0, 1, 2, 0, 2, 3]){ d.set(q.v[i], o); d.set(q.n, o + 3); d.set(c, o + 6); o += 9; } }
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW); return {b, n:quads.length * 6};
}
function ligar(buf){ gl.bindBuffer(gl.ARRAY_BUFFER, buf.b); A.forEach((a, i) => { gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 3, gl.FLOAT, false, 36, i * 12); }); }
const transforma = (px = 0, py = 0, pz = 0, giro = 0, esc = 1) => { gl.uniform3f(U.pos, px, py, pz); gl.uniform2f(U.rot, Math.cos(giro), Math.sin(giro)); gl.uniform1f(U.esc, esc); };

let chaoBuf = null, chaoChave = '', gradeBuf = null, quadSombra = null;
function chaoQuads(){
  const cor = CHAOS[cena.chao][1], quads = [], R = 30, passo = 1;
  for (let x = -R; x < R; x += passo) for (let z = -R; z < R; z += passo){
    const r = ruido(`chao|${x},${z}`), c = r < 62 ? cor : tom(cor, r < 82 ? .965 : 1.035);
    quads.push({v:[[x, -.012, z + passo], [x + passo, -.012, z + passo], [x + passo, -.012, z], [x, -.012, z]], n:[0, 1, 0], cor:c});
  }
  return quads;
}
function desenhar(limpo = false){
  if (!gl) return;
  const W = canvas.width, H = canvas.height, luz = LUZES[cena.luz];
  gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
  gl.uniformMatrix4fv(U.mvp, false, matriz(W / H));
  const l = (a, e) => [Math.sin(cam.giro + a) * Math.cos(e), Math.sin(e), Math.cos(cam.giro + a) * Math.cos(e)];
  gl.uniform3fv(U.luz1, l(.7, .85)); gl.uniform3fv(U.luz2, l(-1.2, .25)); gl.uniform3fv(U.tinta, luz.cor);
  gl.uniform1f(U.modo, 0); gl.uniform1f(U.realce, 0);
  if (chaoChave !== cena.chao){ chaoChave = cena.chao; chaoBuf = bufferQuads(chaoQuads()); }
  transforma(); ligar(chaoBuf); gl.drawArrays(gl.TRIANGLES, 0, chaoBuf.n);
  if (cena.grade && !limpo){
    if (!gradeBuf){ const v = []; for (let i = -30; i <= 30; i++){ const c = i % 5 ? [.42, .44, .4] : [.3, .32, .3]; v.push(i, -.004, -30, 0,1,0, ...c, i, -.004, 30, 0,1,0, ...c, -30, -.004, i, 0,1,0, ...c, 30, -.004, i, 0,1,0, ...c); } gradeBuf = bufferDe(v); }
    gl.uniform1f(U.modo, 2); ligar(gradeBuf); gl.drawArrays(gl.LINES, 0, gradeBuf.n); gl.uniform1f(U.modo, 0);
  }
  /* sombras de contato */
  if (!quadSombra){ const v = []; for (const [x, z] of [[-1,1],[1,1],[1,-1],[-1,1],[1,-1],[-1,-1]]) v.push(x, 0, z, 0,1,0, x, z, 0); quadSombra = bufferDe(v); }
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.uniform1f(U.modo, 1);
  for (const o of cena.itens){
    if (ehChao(o)) continue;
    const g = geometria(o), raio = Math.max(g.hi[0] - g.lo[0], g.hi[2] - g.lo[2]) / 2 * o.escala * 1.15;
    const cx_ = (g.lo[0] + g.hi[0]) / 2 * o.escala, cz = (g.lo[2] + g.hi[2]) / 2 * o.escala, c = Math.cos(o.giro), s = Math.sin(o.giro);
    transforma(o.x + cx_ * c + cz * s, .062, o.z + cz * c - cx_ * s, 0, raio); ligar(quadSombra); gl.drawArrays(gl.TRIANGLES, 0, quadSombra.n);
  }
  gl.depthMask(true); gl.disable(gl.BLEND); gl.uniform1f(U.modo, 0);
  cena.itens.forEach((o, i) => {
    const g = geometria(o); if (!g.buffer) g.buffer = bufferQuads(g.quads);
    gl.uniform1f(U.realce, i === sel && !limpo ? .16 : 0);
    transforma(o.x, o.y + (ehChao(o) ? i % 7 * .0007 : 0), o.z, o.giro, o.escala); ligar(g.buffer); gl.drawArrays(gl.TRIANGLES, 0, g.buffer.n);
  });
  gl.uniform1f(U.realce, 0);
  if (sel >= 0 && !limpo){                                       /* contorno do item escolhido */
    const o = cena.itens[sel], g = geometria(o), v = [], cor = [.95, .42, .2];
    const p = (a, b, c) => [a ? g.hi[0] : g.lo[0], b ? g.hi[1] : g.lo[1], c ? g.hi[2] : g.lo[2]];
    for (const [a, b, c] of [[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]]){ for (const e of [[1,0,0],[0,1,0],[0,0,1]]){ if ((e[0] && a) || (e[1] && b) || (e[2] && c)) continue; v.push(...p(a, b, c), 0,1,0, ...cor, ...p(a + e[0], b + e[1], c + e[2]), 0,1,0, ...cor); } }
    const linhas = bufferDe(v); gl.disable(gl.DEPTH_TEST); gl.uniform1f(U.modo, 2); transforma(o.x, o.y, o.z, o.giro, o.escala); ligar(linhas); gl.drawArrays(gl.LINES, 0, linhas.n); gl.deleteBuffer(linhas.b); gl.uniform1f(U.modo, 0); gl.enable(gl.DEPTH_TEST);
  }
  canvas.style.background = luz.ceu;
}
function ajustar(){
  const r = canvas.getBoundingClientRect(), e = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(2, Math.round(r.width * e)), h = Math.max(2, Math.round(r.height * e));
  if (canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; }
  desenhar();
}

/* ================================================================ mouse e teclado */
function raio(ev){
  const r = canvas.getBoundingClientRect(), nx = (ev.clientX - r.left) / r.width * 2 - 1, ny = 1 - (ev.clientY - r.top) / r.height * 2;
  const {olho, x, y, z} = eixosCamera(), t = Math.tan(FOV / 2), asp = r.width / r.height;
  return {o:olho, d:norm([0, 1, 2].map(i => -z[i] + x[i] * nx * t * asp + y[i] * ny * t))};
}
function cruzaCaixa(o, d, lo, hi){
  let a = 0, b = 1e9;
  for (let i = 0; i < 3; i++){
    if (Math.abs(d[i]) < 1e-9){ if (o[i] < lo[i] || o[i] > hi[i]) return null; continue; }
    let t0 = (lo[i] - o[i]) / d[i], t1 = (hi[i] - o[i]) / d[i]; if (t0 > t1) [t0, t1] = [t1, t0];
    a = Math.max(a, t0); b = Math.min(b, t1); if (a > b) return null;
  }
  return a;
}
function escolher(ev){
  const r = raio(ev); let melhor = -1, dist = 1e9, melhorChao = -1, distChao = 1e9;
  cena.itens.forEach((it, i) => {
    const g = geometria(it), c = Math.cos(it.giro), s = Math.sin(it.giro), rel = [r.o[0] - it.x, r.o[1] - it.y, r.o[2] - it.z];
    const local = v => [(v[0] * c - v[2] * s) / it.escala, v[1] / it.escala, (v[2] * c + v[0] * s) / it.escala];
    const t = cruzaCaixa(local(rel), local(r.d), g.lo, g.hi.map((v, k) => k === 1 ? Math.max(v, g.lo[1] + .06) : v));
    if (t === null) return;
    if (ehChao(it)){ if (t < distChao){ distChao = t; melhorChao = i; } } else if (t < dist){ dist = t; melhor = i; }
  });
  return melhor >= 0 ? melhor : melhorChao;
}
function noPlano(ev, altura){ const r = raio(ev); const t = (altura - r.o[1]) / r.d[1]; return t > 0 ? [r.o[0] + r.d[0] * t, r.o[2] + r.d[2] * t] : null; }
const preso = v => encaixe ? Math.round(v / encaixe) * encaixe : v;

let acao = null;
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', ev => {
  canvas.focus(); canvas.setPointerCapture(ev.pointerId);
  const i = (ev.button === 0 && !ev.shiftKey) ? escolher(ev) : -1;
  if (i >= 0 && (i === sel || !ehChao(cena.itens[i]))){
    const o = cena.itens[i], p = noPlano(ev, o.y);
    sel = i; acao = {tipo:'mover', antes:foto(), dx:p ? o.x - p[0] : 0, dz:p ? o.z - p[1] : 0, moveu:false, inicio:[ev.clientX, ev.clientY]};
    desenhar(); painelDireito();
  } else acao = {tipo:(ev.button === 2 || ev.button === 1 || ev.shiftKey) ? 'arrastar' : 'girar', x:ev.clientX, y:ev.clientY, total:0, alvo:i};
});
canvas.addEventListener('pointermove', ev => {
  if (!acao) return;
  if (acao.tipo === 'mover'){
    if (!acao.moveu && Math.hypot(ev.clientX - acao.inicio[0], ev.clientY - acao.inicio[1]) < 4) return;
    const o = cena.itens[sel], p = noPlano(ev, o.y); if (!p) return;
    o.x = Math.max(-30, Math.min(30, preso(p[0] + acao.dx))); o.z = Math.max(-30, Math.min(30, preso(p[1] + acao.dz))); acao.moveu = true; desenhar(); return;
  }
  const dx = ev.clientX - acao.x, dy = ev.clientY - acao.y; acao.total += Math.abs(dx) + Math.abs(dy); acao.x = ev.clientX; acao.y = ev.clientY;
  if (acao.tipo === 'girar'){ cam.giro -= dx * .007; cam.elev = Math.max(.03, Math.min(1.52, cam.elev + dy * .005)); }
  else { const k = cam.dist * .0016, c = Math.cos(cam.giro), s = Math.sin(cam.giro); cam.x += (-dx * c - dy * s) * k; cam.z += (dx * s - dy * c) * k; }
  desenhar();
});
const solta = () => {
  if (!acao) return;
  if (acao.tipo === 'mover' && acao.moveu){ passado.push(acao.antes); futuro = []; mudou(); }
  else if (acao.tipo === 'girar' && acao.total < 5){ sel = acao.alvo; desenhar(); painelDireito(); }
  acao = null;
};
canvas.addEventListener('pointerup', solta);
canvas.addEventListener('pointercancel', solta);
canvas.addEventListener('wheel', e => { e.preventDefault(); cam.dist = Math.max(2, Math.min(80, cam.dist * (e.deltaY > 0 ? 1.1 : .9))); desenhar(); }, {passive:false});

function alterar(fn){ if (sel < 0) return; lembrar(); fn(cena.itens[sel]); mudou(); }
const girarSel = g => alterar(o => o.giro = Math.round((o.giro + g * Math.PI / 180) / (Math.PI / 12)) * (Math.PI / 12));
function apagar(){ if (sel < 0) return; lembrar(); cena.itens.splice(sel, 1); sel = -1; mudou(); }
function duplicar(){ if (sel < 0) return; lembrar(); const n = JSON.parse(JSON.stringify(cena.itens[sel])), g = geometria(n); n.x += Math.max(.5, Math.ceil((g.hi[0] - g.lo[0]) * n.escala * 4) / 4); cena.itens.push(n); sel = cena.itens.length - 1; mudou(); }
document.addEventListener('keydown', e => {
  if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'z'){ e.preventDefault(); e.shiftKey ? voltar(futuro, passado) : voltar(passado, futuro); }
  else if ((e.ctrlKey || e.metaKey) && k === 'y'){ e.preventDefault(); voltar(futuro, passado); }
  else if ((e.ctrlKey || e.metaKey) && k === 'd'){ e.preventDefault(); duplicar(); }
  else if (k === 'delete' || k === 'backspace'){ e.preventDefault(); apagar(); }
  else if (k === 'r'){ girarSel(e.shiftKey ? -15 : 15); }
  else if (k === 'escape'){ sel = -1; desenhar(); painelDireito(); }
  else if (k.startsWith('arrow') && sel >= 0){
    e.preventDefault();
    const passo = e.shiftKey ? 1 : (encaixe || .05), quarto = Math.round(cam.giro / (Math.PI / 2)) * (Math.PI / 2);
    const [lx, lz] = {arrowleft:[-1, 0], arrowright:[1, 0], arrowup:[0, -1], arrowdown:[0, 1]}[k];
    alterar(o => { o.x = +(o.x + Math.round(lx * Math.cos(quarto) + lz * Math.sin(quarto)) * passo).toFixed(3); o.z = +(o.z + Math.round(lz * Math.cos(quarto) - lx * Math.sin(quarto)) * passo).toFixed(3); });
  }
});

/* ================================================================ adicionar */
function lugarLivre(g, chao){
  const base = [preso(cam.x), preso(cam.z)], w = g.hi[0] - g.lo[0], d = g.hi[2] - g.lo[2];
  if (chao){                                                   /* pisos encaixam lado a lado */
    for (let anel = 0; anel < 12; anel++) for (let i = -anel; i <= anel; i++) for (let j = -anel; j <= anel; j++){
      const x = Math.round(cam.x / w) * w + i * w, z = Math.round(cam.z / d) * d + j * d;
      if (!cena.itens.some(o => ehChao(o) && Math.abs(o.x - x) < w * .6 && Math.abs(o.z - z) < d * .6)) return [x, z];
    }
  }
  const caixa = o => { const q = geometria(o), r = Math.max(q.hi[0] - q.lo[0], q.hi[2] - q.lo[2]) / 2 * o.escala; return [o.x, o.z, r]; };
  const meu = Math.max(w, d) / 2, outros = cena.itens.filter(o => !ehChao(o)).map(caixa);
  for (let passo = 0; passo < 220; passo++){
    const a = passo * 2.4, r = .55 * Math.sqrt(passo) * 1.15, x = preso(base[0] + Math.cos(a) * r), z = preso(base[1] + Math.sin(a) * r);
    if (!outros.some(([ox, oz, or]) => Math.hypot(ox - x, oz - z) < (or + meu) * .82)) return [x, z];
  }
  return base;
}
function adicionar(novo){
  lembrar();
  const o = {x:0, y:0, z:0, giro:0, escala:1, ...novo}, g = geometria(o);
  [o.x, o.z] = lugarLivre(g, ehChao(o));
  cena.itens.push(o); sel = cena.itens.length - 1; mudou();
  aviso(`${nomeDe(o)} adicionado. Arraste para posicionar.`);
}
function personagemDoCriador(){ try { const t = localStorage.getItem(GUARDA_PERSONAGEM); return t ? validar(JSON.parse(t)) : null; } catch (e){ return null; } }

function zumbiDoCriador(){ try { const t = localStorage.getItem('wo-criador-zumbi'); const c = t ? validar(JSON.parse(t)) : null; return c && c.zumbi ? c : null; } catch (e){ return null; } }
/* vários zumbis de uma vez, em volta do centro da vista; um desfazer remove todos */
function adicionarHorda(quantos){
  lembrar();
  for (let n = 0; n < quantos; n++){
    const o = {tipo:'personagem', cfg:validar(zumbiAleatorio(1 + Math.floor(Math.random() * 999999))), x:0, y:0, z:0, giro:(Math.random() - .5) * 1.4, escala:1};
    [o.x, o.z] = lugarLivre(geometria(o), false);
    cena.itens.push(o);
  }
  sel = -1; mudou(); aviso(`${quantos} zumbis adicionados.`);
}

/* ================================================================ exemplos prontos */
const it = (id, x, z, giroGraus = 0, extra = {}) => ({tipo:'item', id, cores:{}, x, y:0, z, giro:giroGraus * Math.PI / 180, escala:1, ...extra});
const pessoa = (cfg, x, z, g, muda = {}) => ({tipo:'personagem', cfg:Object.assign(structuredClone(cfg), muda), x, y:0, z, giro:g * Math.PI / 180, escala:1});
const equipado = (base, kit, muda = {}) => { const c = structuredClone(base); aplicarKit(c, kit); return Object.assign(c, muda); };
const EXEMPLOS = {
  esquina:{nome:'Esquina abandonada', monta:() => ({chao:'terra', luz:'tarde', grade:false, itens:[
    ...[-8, -4, 0, 4, 8].map(x => it('rua', x, 3, 90)), ...[-8, -4, 0, 4, 8].map(x => it('calcada', x, 0)),
    it('mercado', -4.5, -3.4), it('ruina', 3.6, -3.6, -8), it('carro_abandonado', 2.8, 3.6, 112), it('poste', -1, .1, -90), it('semaforo', 7.4, .1), it('placa', 6.2, .6, -20),
    it('barricada', 6.4, 3.2, 90), it('barreira', 6.9, 4.8, 75), it('pneus', -7.4, 1.1), it('barril', -1.9, -.9), it('barril', -1.2, -1.2, 30, {cores:{parede:'#8F4A2A'}}), it('caixa', -.4, -1.1, 18),
    it('arvore_seca', 8.6, -3.4), it('arvore_seca', -9.4, -1.8, 140), it('pedra', 8, 6.4, 40), it('capim', 2.2, .2), it('capim', -6.2, .15, 90), it('capim', 4.8, 6, 20), it('lixeira', -2.7, .1), it('hidrante', 3.2, .2),
    pessoa(equipado(PADRAO_WASHINGTON, 'sobrevivente'), -2.1, 2.9, 24, {pose:'andando'}),
  ]})},
  horda:{nome:'Horda na rua', monta:() => ({chao:'concreto', luz:'nublado', grade:false, itens:[
    ...[-8, -4, 0, 4, 8].map(x => it('rua', x, 2, 90)), ...[-8, -4, 0, 4, 8].map(x => it('calcada', x, -1)),
    it('sobrado', -6.5, -4.8), it('ruina', .2, -4.6, 6), it('galpao', 7.2, -4.8, -4), it('carro_abandonado', -4.6, .5, 68), it('caminhonete', 10.2, 3.1, 100, {cores:{parede:'#6E5844'}}),
    it('barricada', 3.9, 1.1, 90), it('barricada', 3.9, 2.9, 84), it('barreira', 4.1, 4.4, 96), it('poste', -1.4, -1.1, -90), it('semaforo', 8.6, -1), it('barril', 4.9, .4), it('caixa', 5, 3.9, 22), it('lixeira', 2, -1), it('arvore_seca', -9.4, 4.6), it('capim', -5, 4.5), it('capim', 1, -.9, 40),
    ...[['funcionario', -2.1, 2.1, 84], ['miolos', -1.1, .7, 96], ['estripado', -.6, 3.1, 78], ['esfarrapado', .5, 1.6, 90], ['brutamontes', -4.6, 3.6, 80], ['medica', 1.4, 3.3, 104], ['operario', -3.1, -.3, 70], ['corredor', 2.1, .6, 92], ['rastejante', 1.9, 2.2, 90]]
      .map(([id, x, z, g]) => ({tipo:'personagem', cfg:configZumbi(id), x, y:id === 'rastejante' ? .02 : 0, z, giro:g * Math.PI / 180, escala:1})),
    pessoa(equipado(PADRAO_WASHINGTON, 'soldado'), 5.7, 2.2, -92, {pose:'apontando'}), pessoa(equipado(PADRAO_FEMININO, 'sobrevivente'), 5.9, 3.7, -100, {pose:'apontando'}),
  ]})},
  acampamento:{nome:'Acampamento', monta:() => ({chao:'grama', luz:'noite', grade:false, itens:[
    it('terra_chao', 0, 0), it('fogueira', 0, .3), it('barraca', -2.7, -1, 40), it('barraca', 2.8, -1.2, -40, {cores:{parede:'#7A2E24'}}), it('suprimentos', 1.5, 1, -25), it('galao', 2.2, 1.3, 10), it('medico', 1.4, .95, 0, {y:.64}),
    it('caminhonete', 5.6, 1.6, -30), it('caixa', -1.9, 1.3, 12), it('gerador', -3.8, 1.2, 25), it('torre', -6.4, -4.2, 20), it('arame', -2, -4.6), it('arame', 0, -4.6), it('arame', 2, -4.6),
    ...[[-5, 2.8], [-7, -.6], [7.2, -3], [4.6, -5.4], [-3.2, -6.6], [8.4, 4.4], [-8, 4.6], [1.8, -7.4]].map(([x, z], i) => it('pinheiro', x, z, i * 47, {escala:.9 + (i % 3) * .15})), it('arbusto', -4.2, -2.6), it('arbusto', 4.3, -3.2, 60), it('pedra', -1.4, 3.4, 20), it('capim', 3, 3.1),
    pessoa(equipado(PADRAO_WASHINGTON, 'soldado'), -1.15, .75, 65, {pose:'apontando'}), pessoa(equipado(PADRAO_FEMININO, 'sobrevivente'), 1.1, -.45, -55),
  ]})},
  escritorio:{nome:'Sala de trabalho', monta:() => ({chao:'estudio', luz:'dia', grade:false, itens:[
    ...[-2, 0, 2].flatMap(x => [-1, 1].map(z => it('piso_madeira', x, z))), it('parede_lisa', -2, -2.1), it('parede_janela', 0, -2.1), it('parede_lisa', 2, -2.1),
    it('parede_lisa', -3.1, -1, 90), it('parede_janela', -3.1, 1, 90), it('computador', -.3, -1.45), it('cadeira', -.3, -.75, 180), it('estante', 2, -1.8), it('sofa', -2.5, .8, 90, {cores:{parede:'#3A3D45'}}), it('tapete', -.4, .55, 0, {y:.06}),
    it('luminaria', -2.6, -1.6), it('caixa', 2.5, 1.1, 18, {escala:.8}), it('arbusto', 2.55, -.35, 0, {escala:.8}), it('flores', 1, -1.75, 0, {escala:.7, y:.06}),
    pessoa(PADRAO_WASHINGTON, .65, -.1, -18, {pose:'acenando'}),
  ].map(o => (o.id && o.id !== 'piso_madeira' && !o.y) ? {...o, y:.06} : (o.tipo === 'personagem' ? {...o, y:.06} : o))})},
};

/* ================================================================ painéis */
function el(tag, atrs = {}, ...filhos){
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(atrs)){ if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); }
  e.append(...filhos); return e;
}
const botao = (texto, fn, classe = 'mini', atrs = {}) => el('button', {type:'button', class:classe, onclick:fn, ...atrs}, texto);
let relogio;
function aviso(t){ $('#aviso').textContent = t; clearTimeout(relogio); relogio = setTimeout(() => $('#aviso').textContent = '', 4500); }

/* miniaturas: desenho 2D das faces, de um ângulo fixo */
const miniaturas = new Map();
function miniatura(o){
  const g = geometria(o);
  if (!miniaturas.has(g.chave)){
    const c = document.createElement('canvas'); c.width = 132; c.height = 100; const x = c.getContext('2d');
    const a = .62, e = .5, dir = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)], dx = norm(cruz([0, 1, 0], dir)), dy = cruz(dir, dx);
    const proj = v => [ponto(v, dx), -ponto(v, dy)];
    const vis = g.quads.filter(q => ponto(q.n, dir) > 0).map(q => ({p:q.v.map(proj), prof:q.v.reduce((s, v) => s + ponto(v, dir), 0), q}));
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const f of vis) for (const [px, py] of f.p){ x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
    const k = Math.min(124 / (x1 - x0), 92 / (y1 - y0)), ox = 66 - (x0 + x1) / 2 * k, oy = 50 - (y0 + y1) / 2 * k;
    vis.sort((m, n) => m.prof - n.prof);
    for (const f of vis){
      const luz = .72 + .3 * Math.max(0, f.q.n[1]) + .12 * Math.max(0, f.q.n[2]);
      x.fillStyle = x.strokeStyle = tom(f.q.cor, Math.min(1.1, luz)); x.lineWidth = .6; x.beginPath();
      f.p.forEach(([px, py], i) => i ? x.lineTo(ox + px * k, oy + py * k) : x.moveTo(ox + px * k, oy + py * k)); x.closePath(); x.fill(); x.stroke();
    }
    miniaturas.set(g.chave, c.toDataURL());
  }
  return miniaturas.get(g.chave);
}

/* as miniaturas são feitas uma de cada vez, para a tela não travar nas categorias com itens pesados */
let rodadaMini = 0;
function encherMiniaturas(fila){
  const rodada = ++rodadaMini;
  const proxima = () => {
    if (rodada !== rodadaMini || !fila.length) return;
    const [img, id] = fila.shift(); img.src = miniatura({tipo:'item', id, cores:{}}); setTimeout(proxima, 15);
  };
  setTimeout(proxima, 30);
}

let categoria = CATEGORIAS[0], busca = '';
const semAcento = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function painelBiblioteca(){
  const abas = [...CATEGORIAS, 'Personagens', 'Zumbis'];
  $('#categorias').replaceChildren(...abas.map(c => botao(c, () => { categoria = c; busca = ''; $('#busca').value = ''; painelBiblioteca(); }, c === categoria && !busca ? 'ativo' : '', {'data-cat':c})));
  const grade = $('#itens');
  rodadaMini++;
  if (categoria === 'Zumbis' && !busca){
    const doCriador = zumbiDoCriador();
    const opcoes = [
      ...(doCriador ? [['Último zumbi criado', () => doCriador]] : []),
      ['🎲 Zumbi sorteado', () => zumbiAleatorio(1 + Math.floor(Math.random() * 999999))],
      ...Object.entries(ZUMBIS).map(([id, d]) => [d.nome, () => configZumbi(id)]),
    ];
    const horda = botao(el('span', {}, '🎲 Horda: 6 zumbis sorteados'), () => adicionarHorda(6), 'cartao texto', {'data-horda':'6'});
    const arquivo = el('input', {type:'file', accept:'.json,application/json'});
    arquivo.addEventListener('change', async () => { const f = arquivo.files[0]; if (!f) return; try { adicionar({tipo:'personagem', cfg:validar(JSON.parse(await f.text()))}); } catch (e){ aviso('Não consegui ler esse arquivo.'); } arquivo.value = ''; });
    grade.replaceChildren(horda, ...opcoes.map(([nome, cfg]) => botao(el('span', {}, nome), () => adicionar({tipo:'personagem', cfg:cfg()}), 'cartao texto')),
      el('label', {class:'arquivo'}, 'Abrir um zumbi salvo (.personagem.json)', arquivo));
    return;
  }
  if (categoria === 'Personagens' && !busca){
    const meu = personagemDoCriador();
    const opcoes = [
      ...(meu ? [['Último do criador', () => meu]] : []),
      ['Meu personagem', () => structuredClone(PADRAO_WASHINGTON)], ['Modelo feminino', () => structuredClone(PADRAO_FEMININO)], ['Boneco limpo', () => structuredClone(PADRAO_LIMPO)],
      ['Soldado', () => equipado(PADRAO_WASHINGTON, 'soldado')], ['Sobrevivente', () => equipado(PADRAO_WASHINGTON, 'sobrevivente')], ['Sobrevivente (fem.)', () => equipado(PADRAO_FEMININO, 'sobrevivente')],
    ];
    const arquivo = el('input', {type:'file', accept:'.json,application/json'});
    arquivo.addEventListener('change', async () => { const f = arquivo.files[0]; if (!f) return; try { adicionar({tipo:'personagem', cfg:validar(JSON.parse(await f.text()))}); } catch (e){ aviso('Não consegui ler esse personagem.'); } arquivo.value = ''; });
    grade.replaceChildren(...opcoes.map(([nome, cfg]) => botao(el('span', {}, nome), () => adicionar({tipo:'personagem', cfg:cfg()}), 'cartao texto')),
      el('label', {class:'arquivo'}, 'Abrir um .personagem.json salvo no criador', arquivo));
    return;
  }
  const lista = Object.values(ITENS).filter(i => busca ? semAcento(i.nome + ' ' + i.cat).includes(semAcento(busca)) : i.cat === categoria);
  const fila = [];
  grade.replaceChildren(...lista.map(i => {
    const b = botao('', () => adicionar({tipo:'item', id:i.id, cores:{}}), 'cartao', {'data-item':i.id, title:`Adicionar: ${i.nome}`});
    const img = el('img', {alt:'', width:'132', height:'100'});
    fila.push([img, i.id]);
    b.append(img, el('span', {}, i.nome));
    return b;
  }));
  encherMiniaturas(fila);
  if (!lista.length) grade.replaceChildren(el('p', {class:'dica'}, 'Nenhum item com esse nome.'));
}

function seletor(titulo, atual, opcoes, ao){
  const s = el('select', {'aria-label':titulo}, ...Object.entries(opcoes).map(([k, v]) => el('option', {value:k}, v))); s.value = atual;
  s.addEventListener('change', () => ao(s.value));
  return el('label', {class:'linha'}, el('span', {}, titulo), s);
}
function deslizante(titulo, valor, min, max, passo, ao, texto){
  const i = el('input', {type:'range', min, max, step:passo, value:valor, 'aria-label':titulo}), mostra = el('output', {}, texto(valor));
  let antes = null;
  i.addEventListener('input', () => { if (antes === null) antes = foto(); ao(+i.value); mostra.textContent = texto(+i.value); desenhar(); });
  i.addEventListener('change', () => { if (antes !== null){ passado.push(antes); futuro = []; antes = null; } guardar(); });
  return el('label', {class:'linha'}, el('span', {}, titulo), i, mostra);
}
function painelDireito(){
  const caixa = $('#selecionado'), o = cena.itens[sel];
  if (!o){ caixa.replaceChildren(el('h2', {}, 'Nada escolhido'), el('p', {class:'dica'}, 'Clique num item do cenário para mover, girar, colorir ou apagar.')); }
  else {
    const partes = [el('h2', {}, nomeDe(o)),
      el('div', {class:'quatro'}, botao('⟲ 15°', () => girarSel(-15)), botao('15° ⟳', () => girarSel(15)), botao('⟳ 90°', () => girarSel(90)), botao('Centralizar', () => { cam.x = o.x; cam.z = o.z; desenhar(); })),
      deslizante('Tamanho', o.escala, .4, 2.5, .05, v => o.escala = v, v => `${Math.round(v * 100)}%`),
      deslizante('Altura do chão', o.y, -.5, 6, .05, v => o.y = v, v => `${v.toFixed(2)} m`)];
    if (o.tipo === 'personagem') partes.push(seletor('Pose', o.cfg.pose, POSES, v => { lembrar(); o.cfg = {...o.cfg, pose:v}; mudou(); }),
      botao('Trocar pelo último do criador', () => { const m = personagemDoCriador(); if (!m) return aviso('Abra o criador e monte um personagem primeiro.'); alterar(x => x.cfg = m); }, 'acao'));
    else for (const [k, [rotulo, padrao]] of Object.entries(ITENS[o.id].cores)){
      const i = el('input', {type:'color', value:(o.cores[k] || padrao).toLowerCase(), 'aria-label':rotulo});
      i.addEventListener('change', () => alterar(x => x.cores = {...x.cores, [k]:i.value.toUpperCase()}));
      partes.push(el('label', {class:'linha'}, el('span', {}, rotulo), i));
    }
    partes.push(el('div', {class:'quatro duas'}, botao('Duplicar', duplicar), botao('Apagar', apagar, 'mini perigo')));
    caixa.replaceChildren(...partes);
  }
  $('#contagem').textContent = `${cena.itens.length} ${cena.itens.length === 1 ? 'item' : 'itens'} no cenário`;
  $('#chao').value = cena.chao; $('#luz').value = cena.luz; $('#grade').checked = cena.grade;
}

/* ================================================================ exportação */
function noMundo(o){
  const c = Math.cos(o.giro), s = Math.sin(o.giro);
  return geometria(o).quads.map(q => ({cor:q.cor,
    v:q.v.map(v => [v[0] * o.escala * c + v[2] * o.escala * s + o.x, v[1] * o.escala + o.y, v[2] * o.escala * c - v[0] * o.escala * s + o.z]),
    n:[q.n[0] * c + q.n[2] * s, q.n[1], q.n[2] * c - q.n[0] * s]}));
}
const limpoNome = s => semAcento(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
const chaoExporta = () => { const R = 15, cor = CHAOS[cena.chao][1]; return [{v:[[-R, -.012, R], [R, -.012, R], [R, -.012, -R], [-R, -.012, -R]], n:[0, 1, 0], cor}]; };
function cenaGLB(comChao){
  const gltf = {asset:{version:'2.0', generator:'Montador de cenários WO'}, scene:0, scenes:[{nodes:[0]}], nodes:[{name:'Cenario', children:[]}], meshes:[], materials:[], accessors:[], bufferViews:[], buffers:[]};
  const partes = [], mats = new Map(), malhas = new Map(); let tamanho = 0;
  const material = c => { if (!mats.has(c)){ mats.set(c, gltf.materials.length); gltf.materials.push({name:'cor_' + c.slice(1), pbrMetallicRoughness:{baseColorFactor:[...rgb(c).map(linear), 1], metallicFactor:0, roughnessFactor:1}}); } return mats.get(c); };
  const acessor = (dados, tipo, comp, alvo, extra = {}) => {
    const bytes = new Uint8Array(dados.buffer); gltf.bufferViews.push({buffer:0, byteOffset:tamanho, byteLength:bytes.length, target:alvo}); partes.push(bytes); tamanho += bytes.length;
    gltf.accessors.push({bufferView:gltf.bufferViews.length - 1, componentType:comp, count:dados.length / (tipo === 'VEC3' ? 3 : 1), type:tipo, ...extra}); return gltf.accessors.length - 1;
  };
  /* itens iguais compartilham a mesma malha */
  const malha = (chave, quads, nome) => {
    if (malhas.has(chave)) return malhas.get(chave);
    const grupos = new Map(); for (const q of quads){ if (!grupos.has(q.cor)) grupos.set(q.cor, []); grupos.get(q.cor).push(q); }
    const primitivas = [];
    for (const [c, qs] of grupos){
      const pos = new Float32Array(qs.length * 12), nor = new Float32Array(qs.length * 12), ind = new Uint32Array(qs.length * 6), lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
      qs.forEach((q, i) => { q.v.forEach((v, j) => { pos.set(v, i * 12 + j * 3); nor.set(q.n, i * 12 + j * 3); }); ind.set([0, 1, 2, 0, 2, 3].map(x => i * 4 + x), i * 6); });
      for (let i = 0; i < pos.length; i++){ lo[i % 3] = Math.min(lo[i % 3], pos[i]); hi[i % 3] = Math.max(hi[i % 3], pos[i]); }
      primitivas.push({attributes:{POSITION:acessor(pos, 'VEC3', 5126, 34962, {min:lo, max:hi}), NORMAL:acessor(nor, 'VEC3', 5126, 34962)}, indices:acessor(ind, 'SCALAR', 5125, 34963), material:material(c)});
    }
    gltf.meshes.push({name:nome, primitives:primitivas}); malhas.set(chave, gltf.meshes.length - 1); return gltf.meshes.length - 1;
  };
  const no = n => { gltf.nodes[0].children.push(gltf.nodes.length); gltf.nodes.push(n); };
  const usados = {};
  if (comChao) no({name:'chao', mesh:malha('chao', chaoExporta(), 'chao')});
  for (const o of cena.itens){
    const base = limpoNome(nomeDe(o)); usados[base] = (usados[base] || 0) + 1;
    no({name:`${base}-${usados[base]}`, mesh:malha(geometria(o).chave, geometria(o).quads, base), translation:[o.x, o.y, o.z], rotation:[0, Math.sin(o.giro / 2), 0, Math.cos(o.giro / 2)], scale:[o.escala, o.escala, o.escala]});
  }
  gltf.buffers.push({byteLength:tamanho});
  let json = new TextEncoder().encode(JSON.stringify(gltf)); const falta = (4 - json.length % 4) % 4;
  if (falta){ const j = new Uint8Array(json.length + falta).fill(32); j.set(json); json = j; }
  const total = 12 + 8 + json.length + 8 + tamanho, saida = new Uint8Array(total), dv = new DataView(saida.buffer);
  dv.setUint32(0, 0x46546C67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true); dv.setUint32(12, json.length, true); dv.setUint32(16, 0x4E4F534A, true); saida.set(json, 20);
  let p = 20 + json.length; dv.setUint32(p, tamanho, true); dv.setUint32(p + 4, 0x004E4942, true); p += 8;
  for (const b of partes){ saida.set(b, p); p += b.length; }
  return saida;
}
function cenaOBJ(comChao){
  const grupos = cena.itens.map((o, i) => [`${limpoNome(nomeDe(o))}-${i + 1}`, noMundo(o)]); if (comChao) grupos.unshift(['chao', chaoExporta()]);
  const cores = new Set(); const obj = ['mtllib cenario.mtl']; let base = 1;
  for (const [nome, quads] of grupos){
    obj.push(`o ${nome}`); let c = '';
    for (const q of quads){ cores.add(q.cor); if (q.cor !== c){ c = q.cor; obj.push(`usemtl cor_${c.slice(1)}`); } for (const v of q.v) obj.push(`v ${v.map(x => x.toFixed(4)).join(' ')}`); obj.push(`f ${base} ${base + 1} ${base + 2} ${base + 3}`); base += 4; }
  }
  const mtl = [...cores].map(c => `newmtl cor_${c.slice(1)}\nKd ${rgb(c).map(v => linear(v).toFixed(5)).join(' ')}\nKs 0 0 0\nillum 1\n`).join('\n');
  return zip([['cenario.obj', obj.join('\n') + '\n'], ['cenario.mtl', mtl]]);
}
function imagemPNG(transparente, w = 2400, h = 1600){
  const antes = [canvas.width, canvas.height], chao = chaoBuf;
  canvas.width = w; canvas.height = h; desenhar(true);
  let url;
  if (transparente) url = canvas.toDataURL('image/png');
  else {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'), grad = x.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, LUZES[cena.luz].fundo[0]); grad.addColorStop(.62, LUZES[cena.luz].fundo[1]); x.fillStyle = grad; x.fillRect(0, 0, w, h); x.drawImage(canvas, 0, 0); url = c.toDataURL('image/png');
  }
  canvas.width = antes[0]; canvas.height = antes[1]; desenhar();
  return url;
}

/* ================================================================ barra de cima */
$('#chao').replaceChildren(...Object.entries(CHAOS).map(([k, [n]]) => el('option', {value:k}, n)));
$('#luz').replaceChildren(...Object.entries(LUZES).map(([k, v]) => el('option', {value:k}, v.nome)));
$('#exemplos').replaceChildren(el('option', {value:''}, 'Exemplos prontos…'), ...Object.entries(EXEMPLOS).map(([k, v]) => el('option', {value:k}, v.nome)));
$('#chao').addEventListener('change', e => { lembrar(); cena.chao = e.target.value; mudou(); });
$('#luz').addEventListener('change', e => { lembrar(); cena.luz = e.target.value; mudou(); });
$('#grade').addEventListener('change', e => { cena.grade = e.target.checked; mudou(); });
$('#encaixe').addEventListener('change', e => encaixe = +e.target.value);
function carregarExemplo(id){ lembrar(); cena = validarCena(EXEMPLOS[id].monta()); sel = -1; Object.assign(cam, id === 'escritorio' ? {x:0, y:1, z:-.3, dist:10.5, giro:.5, elev:.42} : id === 'horda' ? {x:0, y:.9, z:1, dist:20, giro:.62, elev:.4} : {x:0, y:1, z:0, dist:id === 'esquina' ? 22 : 19, giro:.45, elev:.4}); mudou(); }
$('#exemplos').addEventListener('change', e => { const id = e.target.value; e.target.value = ''; if (!id) return; if (cena.itens.length && !confirm('Abrir o exemplo? O cenário atual será substituído (você pode desfazer).')) return; carregarExemplo(id); });
$('#desfazer').addEventListener('click', () => voltar(passado, futuro));
$('#refazer').addEventListener('click', () => voltar(futuro, passado));
$('#limpar').addEventListener('click', () => { if (!cena.itens.length || !confirm('Apagar todos os itens do cenário? Você pode desfazer.')) return; lembrar(); cena.itens = []; sel = -1; mudou(); });
$('#busca').addEventListener('input', e => { busca = e.target.value.trim(); painelBiblioteca(); });
document.querySelectorAll('[data-vista]').forEach(b => b.addEventListener('click', () => { const [giro, elev] = b.dataset.vista.split(',').map(Number); cam.giro = giro; cam.elev = elev; desenhar(); }));
$('#exp-glb').addEventListener('click', () => { baixar('cenario.glb', cenaGLB($('#exp-chao').checked), 'model/gltf-binary'); aviso('GLB gerado.'); });
$('#exp-obj').addEventListener('click', () => { baixar('cenario-obj.zip', cenaOBJ($('#exp-chao').checked), 'application/zip'); aviso('OBJ gerado.'); });
$('#exp-png').addEventListener('click', () => { baixar('cenario.png', imagemPNG(false), 'image/png'); aviso('Imagem gerada.'); });
$('#salvar').addEventListener('click', () => { baixar('meu.cenario.json', JSON.stringify(cena, null, 2), 'application/json'); aviso('Cenário salvo.'); });
$('#abrir').addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; try { const nova = JSON.parse(await f.text()); if (!Array.isArray(nova.itens)) throw new Error('sem itens'); lembrar(); cena = validarCena(nova); sel = -1; mudou(); aviso('Cenário carregado.'); } catch (x){ aviso('Não consegui ler esse arquivo. Escolha um .cenario.json.'); } e.target.value = ''; });
window.addEventListener('storage', e => { if ((e.key === GUARDA_PERSONAGEM && categoria === 'Personagens') || (e.key === 'wo-criador-zumbi' && categoria === 'Zumbis')) painelBiblioteca(); });
new ResizeObserver(ajustar).observe(canvas);

let salvo = null; try { salvo = JSON.parse(localStorage.getItem(GUARDA)); } catch (e){}
if (salvo) cena = validarCena(salvo);
if (!gl) aviso('Este navegador não conseguiu abrir o visor 3D (WebGL).');
painelBiblioteca();
if (!salvo) { carregarExemplo('esquina'); passado = []; } else { painelDireito(); }
ajustar();

/* usado nos testes */
window.__montador = {cam, get cena(){ return cena; }, get sel(){ return sel; }, desenhar, adicionar, carregarExemplo, imagemPNG, cenaGLB, cenaOBJ, validarCena, quadsDoItem, geometria, miniatura, ITENS};
})();
