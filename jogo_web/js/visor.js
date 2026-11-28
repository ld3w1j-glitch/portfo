/* Visor 3D em WebGL, sem bibliotecas. Arraste para girar, role para aproximar. */
function criarVisor(canvas){
  const gl = canvas.getContext('webgl', {antialias:true, alpha:true, premultipliedAlpha:false, preserveDrawingBuffer:true});
  if (!gl) return null;
  const vs = `attribute vec3 p, n, c; uniform mat4 mvp; varying vec3 vn, vc;
    void main(){ vn = n; vc = c; gl_Position = mvp * vec4(p, 1.0); }`;
  const fs = `precision mediump float; varying vec3 vn, vc; uniform vec3 luz1, luz2; uniform float alfa;
    void main(){
      if (alfa < 1.0){ gl_FragColor = vec4(0.0, 0.0, 0.0, alfa * max(0.0, 1.0 - dot(vc.xy, vc.xy))); return; }
      vec3 n = normalize(vn);
      float ceu = 0.56 + 0.14 * n.y;
      float d = ceu + 0.42 * max(dot(n, luz1), 0.0) + 0.17 * max(dot(n, luz2), 0.0);
      gl_FragColor = vec4(vc * min(d, 1.1), 1.0);
    }`;
  const shader = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog); gl.useProgram(prog);
  const at = ['p', 'n', 'c'].map(a => gl.getAttribLocation(prog, a)), un = n => gl.getUniformLocation(prog, n);
  const buf = gl.createBuffer(), bufSombra = gl.createBuffer();
  let total = 0;
  const cam = {giro:.55, elev:.14, dist:4.4, alvo:.92};
  const norm = v => { const t = Math.hypot(...v); return v.map(x => x / t); };
  const cruz = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
  const ponto = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  function mult(a, b){ const r = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let l = 0; l < 4; l++) r[c*4 + l] = a[l]*b[c*4] + a[4 + l]*b[c*4 + 1] + a[8 + l]*b[c*4 + 2] + a[12 + l]*b[c*4 + 3];
    return r; }

  function carregar(quads){
    const d = new Float32Array(quads.length * 6 * 9); let o = 0;
    for (const f of quads){
      const c = rgb(f.cor).map(v => v / 255);
      for (const i of [0, 1, 2, 0, 2, 3]){ d.set(f.v[i], o); d.set(f.n, o + 3); d.set(c, o + 6); o += 9; }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW); total = quads.length * 6;
    /* sombra de contato: um quadrado no chão com transparência em círculo */
    const s = [], R = .52;
    for (const [x, z] of [[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]]) s.push(x * R, .001, z * R * .75, 0, 1, 0, x, z, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufSombra); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(s), gl.STATIC_DRAW);
  }
  function ligar(b){ gl.bindBuffer(gl.ARRAY_BUFFER, b); at.forEach((a, i) => { gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 3, gl.FLOAT, false, 36, i * 12); }); }

  function desenhar(sombra = true){
    const W = canvas.width, H = canvas.height;
    gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
    const alvo = [0, cam.alvo, 0];
    const dir = [Math.sin(cam.giro) * Math.cos(cam.elev), Math.sin(cam.elev), Math.cos(cam.giro) * Math.cos(cam.elev)];
    const olho = alvo.map((v, i) => v + dir[i] * cam.dist);
    const z = norm(dir), x = norm(cruz([0, 1, 0], z)), y = cruz(z, x);
    const view = new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -ponto(x, olho), -ponto(y, olho), -ponto(z, olho), 1]);
    const f = 1 / Math.tan(28 * Math.PI / 360), n = .05, longe = 60, asp = W / H;
    const proj = new Float32Array([f / Math.max(asp, .001), 0, 0, 0, 0, f, 0, 0, 0, 0, (longe + n) / (n - longe), -1, 0, 0, 2 * longe * n / (n - longe), 0]);
    gl.uniformMatrix4fv(un('mvp'), false, mult(proj, view));
    /* a luz principal acompanha a câmera, para o rosto não escurecer */
    const luz = (a, e) => [Math.sin(cam.giro + a) * Math.cos(e), Math.sin(e), Math.cos(cam.giro + a) * Math.cos(e)];
    gl.uniform3fv(un('luz1'), luz(.55, .75)); gl.uniform3fv(un('luz2'), luz(-1.1, .2));
    gl.uniform1f(un('alfa'), 1); ligar(buf); gl.drawArrays(gl.TRIANGLES, 0, total);
    if (sombra){
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      gl.uniform1f(un('alfa'), .34); ligar(bufSombra); gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.depthMask(true); gl.disable(gl.BLEND);
    }
  }
  function ajustar(){
    const r = canvas.getBoundingClientRect(), e = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(2, Math.round(r.width * e)), h = Math.max(2, Math.round(r.height * e));
    if (canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; }
    desenhar();
  }
  let pino = null;
  canvas.addEventListener('pointerdown', e => { pino = [e.clientX, e.clientY]; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!pino) return;
    cam.giro -= (e.clientX - pino[0]) * .009; cam.elev = Math.max(-.25, Math.min(1.1, cam.elev + (e.clientY - pino[1]) * .006));
    pino = [e.clientX, e.clientY]; desenhar();
  });
  canvas.addEventListener('pointerup', () => pino = null);
  canvas.addEventListener('pointercancel', () => pino = null);
  canvas.addEventListener('wheel', e => { e.preventDefault(); cam.dist = Math.max(1.1, Math.min(9, cam.dist * (e.deltaY > 0 ? 1.09 : .92))); desenhar(); }, {passive:false});
  canvas.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') cam.giro += .2; else if (e.key === 'ArrowRight') cam.giro -= .2; else return;
    e.preventDefault(); desenhar();
  });
  new ResizeObserver(ajustar).observe(canvas);

  /* imagem em alta resolução, com fundo transparente */
  function imagem(w, h, sombra){
    const antes = [canvas.width, canvas.height];
    canvas.width = w; canvas.height = h; desenhar(sombra);
    const url = canvas.toDataURL('image/png');
    canvas.width = antes[0]; canvas.height = antes[1]; desenhar();
    return url;
  }
  return {carregar, desenhar, ajustar, imagem, cam};
}
