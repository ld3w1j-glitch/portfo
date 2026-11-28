/* Tela do Gerador de mundo: visor 3D com níveis de detalhe, pincéis, ruas, minimapa, caminhada e arquivos. */
(() => {
const $ = s => document.querySelector(s);
const {MEIO, PEDACO, PEDACOS, MATERIAIS, M, ESTILOS, FERRAMENTAS, m} = Mundo;
const GUARDA = 'wo-mundo', GUARDA_PREF = 'wo-mundo-pref';
/* área de teste (mundo.html?teste ou ?teste=normal): sempre o mesmo mapa, já caminhando, sem tocar no mundo salvo */
const TESTE = (location.search.match(/[?&]teste(?:=(\w+))?(?:&|$)/) || null);
const aviso = t => { $('#aviso').textContent = t; clearTimeout(aviso.t); aviso.t = setTimeout(() => $('#aviso').textContent = '', 5000); };
const QUALIDADES = {baixa:{nome:'Leve', lim:[100, 240, 520]}, media:{nome:'Média', lim:[210, 520, 1000]}, alta:{nome:'Alta', lim:[340, 800, 1600]}};
const LUZES = {
  dia:{nome:'Dia', sol:[.62, .62, .48], cor:[1.02, 1, .95], amb:[.52, .56, .62], ceu:[.72, .83, .91], fundo:'linear-gradient(#9CC8EC,#DCEAF2 62%,#E9E6DA)'},
  tarde:{nome:'Entardecer', sol:[.85, .36, .38], cor:[1.15, .82, .58], amb:[.45, .42, .52], ceu:[.86, .62, .48], fundo:'linear-gradient(#59517F,#E58B5B 62%,#F4C27A)'},
  noite:{nome:'Noite', sol:[-.4, .75, .5], cor:[.34, .42, .66], amb:[.2, .24, .36], ceu:[.09, .12, .22], fundo:'linear-gradient(#080C1C,#17213D 62%,#27304A)'},
};
let pref = {qualidade:'media', luz:'dia', aba:'mundo', ferramenta:'navegar', raio:18, forca:.45, material:M.terra_vermelha, passo:4, profundidade:3, ruaLargura:8, ruaMaterial:'asfalto', ruaCalcada:true, semTelhado:false, interiores:true, areaPacote:'512', verZonas:false, tamanhoZonas:150, donoPincel:'comunidade', objeto:'casa_telha', giroObjeto:0, corObjeto:0, nome:'cidade-jardim'};
const FERRAMENTAS_OBJETOS = {colocar:'Colocar objeto', limpar:'Apagar objetos'};
const FERRAMENTAS_ZONAS = {'zona-ver':'Ver zona', 'zona-pintar':'Pintar dono', 'zona-nova':'Nova zona', 'zona-tirar':'Tirar zona'};
if (!Povoar.TODOS[pref.objeto]) pref.objeto = 'casa_telha';
try { const s = JSON.parse(localStorage.getItem(GUARDA_PREF)); if (s) for (const k in pref) if (typeof s[k] === typeof pref[k]) pref[k] = s[k]; } catch (e){}
if (!QUALIDADES[pref.qualidade]) pref.qualidade = 'media';
if (!LUZES[pref.luz]) pref.luz = 'dia';
if (pref.ferramenta !== 'navegar' && !FERRAMENTAS[pref.ferramenta] && !FERRAMENTAS_OBJETOS[pref.ferramenta]) pref.ferramenta = 'navegar';
if (!Territorios.DONOS[pref.donoPincel]) pref.donoPincel = 'comunidade';
const guardaPref = () => { try { localStorage.setItem(GUARDA_PREF, JSON.stringify(pref)); } catch (e){} };

/* ================================================================ criação, salvamento automático */
const centro = {lat:DADOS_BAIRRO.lat, lon:DADOS_BAIRRO.lon};
const temRuas = () => typeof RUAS_BAIRRO !== 'undefined' && !!RUAS_BAIRRO;
function prepararBairro(fonte){ if (fonte === 'bairro' && temRuas()){ Mundo.importarOSM(RUAS_BAIRRO, centro); Mundo.fixarBase(); } }
function novoMundo(fonte, semente){ Mundo.criar(fonte, DADOS_BAIRRO, semente || 1 + Math.floor(Math.random() * 9999)); prepararBairro(fonte); m.povo.ativo = fonte === 'bairro' && temRuas(); }
let relogioGuarda;
function guardarEmBreve(){ if (TESTE) return; clearTimeout(relogioGuarda); relogioGuarda = setTimeout(() => { try { localStorage.setItem(GUARDA, JSON.stringify(Mundo.salvar({nome:pref.nome}))); } catch (e){ aviso('Não deu para guardar no navegador. Use "Salvar mundo" para não perder.'); } }, 900); }
function recuperar(){
  try { const s = localStorage.getItem(GUARDA); if (s){ const o = JSON.parse(s); if (o.cfg?.fonte === 'morros') return false; Mundo.abrir(o, DADOS_BAIRRO, prepararBairro); if (!o.povo) m.povo.ativo = o.cfg?.fonte === 'bairro' && temRuas(); return true; } } catch (e){}
  return false;
}

/* ================================================================ WebGL */
const canvas = $('#visor');
const gl = canvas.getContext('webgl', {antialias:true, alpha:true, premultipliedAlpha:false, preserveDrawingBuffer:true});
const cam = {x:0, z:0, y:0, giro:.45, elev:.52, dist:520};
let U = {}, A = [];
if (gl){
  const VS = `attribute vec3 p, n, c; uniform mat4 mvp; uniform vec3 pos; uniform vec2 rot; varying vec3 vn, vc, vp;
    vec3 gira(vec3 v){ return vec3(v.x*rot.x + v.z*rot.y, v.y, v.z*rot.x - v.x*rot.y); }
    void main(){ vn = gira(n); vc = c; vp = gira(p) + pos; gl_Position = mvp * vec4(vp, 1.0); }`;
  const FS = `precision mediump float; varying vec3 vn, vc, vp; uniform vec3 sol, corSol, amb, ceu, olho; uniform float modo, alfa, longe, zonas; uniform sampler2D mapaZonas;
    void main(){
      if (modo > 1.5){ gl_FragColor = vec4(vc, alfa); return; }
      vec3 n = normalize(vn);
      vec3 r = normalize(vec3(n.x * 2.4, n.y, n.z * 2.4));                       /* morros suaves: a luz realça a inclinação */
      vec3 luz = amb * (.8 + .2 * r.y) + corSol * max(dot(r, sol), 0.0) * .72;
      vec3 cor = vc * luz;
      if (zonas > .5){ vec4 z = texture2D(mapaZonas, (vp.xz + ${MEIO.toFixed(1)}) / ${(MEIO * 2).toFixed(1)}); cor = mix(cor, z.rgb, z.a); }
      if (modo > .5) cor = mix(cor, ceu, .22);
      float nevoa = clamp((distance(vp, olho) - longe * .65) / (longe * 1.2), 0.0, .8);
      gl_FragColor = vec4(mix(cor, ceu, nevoa), alfa);
    }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
  A = ['p', 'n', 'c'].map(a => gl.getAttribLocation(prog, a));
  for (const n of ['mvp', 'pos', 'rot', 'sol', 'corSol', 'amb', 'ceu', 'olho', 'modo', 'alfa', 'longe', 'zonas', 'mapaZonas']) U[n] = gl.getUniformLocation(prog, n);
}
/* objetos: cada modelo é enviado uma vez e desenhado em todos os lugares de uma só vez */
const inst = gl && gl.getExtension('ANGLE_instanced_arrays');
let progObj = null, progChao = null; const O = {u:{}, a:{}};
if (gl){
  progChao = gl.getParameter(gl.CURRENT_PROGRAM);
  const VS = `attribute vec3 p, n; attribute vec4 c; attribute vec4 iPos; attribute vec4 iCor; uniform mat4 mvp; varying vec3 vn, vc, vp;
    void main(){
      float s = sin(iPos.w), k = cos(iPos.w); vec3 q = vec3(p.x * iCor.w, p.y, p.z);
      vn = vec3(n.x * k + n.z * s, n.y, n.z * k - n.x * s);
      vp = vec3(q.x * k + q.z * s, q.y, q.z * k - q.x * s) + iPos.xyz;
      vc = c.a > .001 ? c.rgb * iCor.rgb : c.rgb;                       /* partes pintadas recebem a cor da casa */
      gl_Position = mvp * vec4(vp, 1.0); }`;
  const FS = `precision mediump float; varying vec3 vn, vc, vp; uniform vec3 sol, corSol, amb, ceu, olho; uniform float longe, corte;
    void main(){
      if (vp.y > corte) discard;
      vec3 n = normalize(vn);
      vec3 cor = vc * (amb * (.8 + .2 * n.y) + corSol * max(dot(n, sol), 0.0) * .72);
      float nevoa = clamp((distance(vp, olho) - longe * .65) / (longe * 1.2), 0.0, .8);
      gl_FragColor = vec4(mix(cor, ceu, nevoa), 1.0); }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  progObj = gl.createProgram(); gl.attachShader(progObj, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(progObj, sh(gl.FRAGMENT_SHADER, FS));
  ['p', 'n', 'c', 'iPos', 'iCor'].forEach((a, i) => { gl.bindAttribLocation(progObj, i, a); O.a[a] = i; });
  gl.linkProgram(progObj);
  for (const n of ['mvp', 'sol', 'corSol', 'amb', 'ceu', 'olho', 'longe', 'corte']) O.u[n] = gl.getUniformLocation(progObj, n);
}
const modelosGL = new Map();
function modeloGL(id, nivel, velha){
  const chave = `${id}|${nivel}|${velha ? 1 : 0}`;
  if (!modelosGL.has(chave)){
    const v = Povoar.vertices(id, nivel, velha);
    if (!v) modelosGL.set(chave, null);
    else {
      const dados = new ArrayBuffer(v.length / 10 * 28), f = new Float32Array(dados), b = new Uint8Array(dados);
      for (let i = 0, k = 0; i < v.length; i += 10, k++){ for (let j = 0; j < 6; j++) f[k * 7 + j] = v[i + j]; b.set([v[i + 6], v[i + 7], v[i + 8], v[i + 9] ? 255 : 0], k * 28 + 24); }
      modelosGL.set(chave, {b:buffer(gl.ARRAY_BUFFER, dados), n:v.length / 10, inst:gl.createBuffer(), lista:[]});
    }
  }
  return modelosGL.get(chave);
}
const TINTAS_RGB = Povoar.TINTAS.map(h => rgb(h).map(v => v / 232));

/* ---------------------------------------------------------- objetos organizados por pedaço do mundo */
let povoado = {lista:[], solidos:null, contagem:{casas:0, plantas:0, rua:0}}, porPedaco = new Map(), relogioPovo;
const ALCANCE = {baixa:{perto:75, longe:650, plantas:420, miudo:55, dentro:30, carro:22}, media:{perto:130, longe:1100, plantas:700, miudo:90, dentro:55, carro:40}, alta:{perto:210, longe:1900, plantas:1200, miudo:140, dentro:85, carro:65}};
/* passeio detalhado: malha que segue o traçado das ruas, montada aos poucos por pedaço e nível de detalhe */
const passeioGL = new Map();
const ALCANCE_PASSEIO = {baixa:[45, 300], media:[75, 580], alta:[110, 860]};
function soltarPasseio(chave){ const p = passeioGL.get(chave); if (p) for (const b of [p.bp, p.bn, p.bc]) gl.deleteBuffer(b); passeioGL.delete(chave); }
function limparPasseio(k){ if (k === undefined) for (const chave of [...passeioGL.keys()]) soltarPasseio(chave); else { soltarPasseio(k * 2); soltarPasseio(k * 2 + 1); } }
function prepararPasseio(){ Passeio.preparar(m.ruas, povoado, m.povo.estado === 'abandonado'); limparPasseio(); }
let passeioDeUmaVez = false;
function desenharPasseio(e, vistos){
  const [pertoAte, longeAte] = ALCANCE_PASSEIO[pref.qualidade], t0 = performance.now(); let faltou = false, faces = 0;
  for (const k of vistos){
    if (!Passeio.temPedaco(k)) continue;
    const [cx, cz] = centroDe(k), d = Math.max(0, Math.hypot(cx - e.olho[0], cz - e.olho[2], e.olho[1] - cam.y) - PEDACO * .7);
    if (d > longeAte) continue;
    const det = d < pertoAte ? 1 : 0; let chave = k * 2 + det;
    if (!passeioGL.has(chave)){
      if (!passeioDeUmaVez && performance.now() - t0 > 12){ faltou = true; chave = k * 2 + (1 - det); if (!passeioGL.has(chave)) continue; }
      else { const v = Passeio.gerar(k, det); passeioGL.set(chave, v ? {bp:buffer(gl.ARRAY_BUFFER, v.pos), bn:buffer(gl.ARRAY_BUFFER, v.nor), bc:buffer(gl.ARRAY_BUFFER, v.cor), n:v.n} : null); }
    }
    const p = passeioGL.get(chave); if (!p) continue;
    liga(p.bp, p.bn, p.bc, false); gl.drawArrays(gl.TRIANGLES, 0, p.n); faces += p.n / 6;
  }
  if (faltou) pedirDesenho();
  return faces;
}
/* territórios: o desenho das divisas é recalculado quando o mapa muda; a textura pinta o chão */
let zonasCalc = null, zonaEscolhida = -1, texturaZonas = null, texturaVelha = true;
function zonasAtuais(){
  if (!m.zonas.sementes.length) return null;
  if (!zonasCalc){ zonasCalc = Territorios.calcular(m.zonas, povoado); texturaVelha = true; if (zonaEscolhida >= zonasCalc.zonas.length) zonaEscolhida = -1; }
  return zonasCalc;
}
const mostraZonas = () => m.zonas.sementes.length > 0 && (pref.aba === 'territorios' || pref.verZonas);
function esqueceZonas(){ zonasCalc = null; texturaVelha = true; }
function ligarTexturaZonas(){
  const res = zonasAtuais(); if (!res) return false;
  if (!texturaZonas){
    texturaZonas = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texturaZonas);
    for (const [p, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, p, v);
  }
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texturaZonas);
  if (texturaVelha){ gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, Territorios.W, Territorios.W, 0, gl.RGBA, gl.UNSIGNED_BYTE, Territorios.pintura(res, zonaEscolhida)); texturaVelha = false; }
  gl.uniform1i(U.mapaZonas, 0); return true;
}
function repovoar(){
  esqueceZonas();
  if (typeof esqueceConferencia === 'function' && povoado.lista.length) esqueceConferencia();
  povoado = Povoar.gerar(); porPedaco = new Map();
  prepararPasseio();
  for (const o of povoado.lista){
    const k = Math.max(0, Math.min(PEDACOS - 1, Math.floor((o.z + MEIO) / PEDACO))) * PEDACOS + Math.max(0, Math.min(PEDACOS - 1, Math.floor((o.x + MEIO) / PEDACO)));
    (porPedaco.get(k) || porPedaco.set(k, []).get(k)).push(o);
  }
}
function repovoarEmBreve(){ clearTimeout(relogioPovo); relogioPovo = setTimeout(() => { repovoar(); pintarMapa(); painel(); pedirDesenho(); }, 220); }
let facesObjetos = 0, desenhados = 0;
function desenharObjetos(e, mvp, L, visivel){
  facesObjetos = 0; desenhados = 0;
  if (!inst || !povoado.lista.length) return;
  const A_ = ALCANCE[pref.qualidade], usados = new Set(), cortados = [];
  const aqui = anda.ativo ? anda.casa : null;
  const poe = (o, mg) => {
    if (!mg) return;
    const t = TINTAS_RGB[o.cor] || TINTAS_RGB[0], suja = o.velha ? .8 : 1;
    mg.lista.push(o.x, o.y, o.z, o.rot, t[0] * suja, t[1] * suja * (o.velha ? .98 : 1), t[2] * suja * (o.velha ? .94 : 1), o.sx || 1);
    usados.add(mg);
  };
  for (const [k, objetos] of porPedaco){
    const [cx, cz] = centroDe(k); if (!visivel(k)) continue;
    const dPedaco = Math.hypot(cx - e.olho[0], cz - e.olho[2]) - PEDACO * .72;
    if (dPedaco > A_.longe) continue;
    for (const o of objetos){
      const d = Math.hypot(o.x - e.olho[0], o.y - e.olho[1], o.z - e.olho[2]);
      const perto = d < A_.perto, miudo = o.id === 'capim' || o.id === 'entulho';
      if (miudo && d > A_.miudo) continue;
      if (!perto && o.cat !== 'casa' && d > A_.plantas) continue;
      if (d > A_.longe) continue;
      desenhados++;
      const nome = Povoar.modeloDe(o);
      if (o === aqui){ cortados.push(o); continue; }
      if (!o.planta || !perto){ poe(o, modeloGL(nome, o.id === 'carro' && d < A_.carro ? 'detalhe' : perto || miudo ? 'perto' : 'longe', o.velha)); continue; }
      /* casa de perto: fora sempre; cômodos e móveis só bem de perto, porque são o que mais pesa */
      const detalhar = d < A_.dentro;
      poe(o, modeloGL(nome, 'casco', o.velha)); poe(o, modeloGL(nome, 'cima', o.velha));
      if (!(pref.semTelhado && detalhar && !anda.primeira)) poe(o, modeloGL(nome, 'teto', o.velha));
      if (detalhar) poe(o, modeloGL(nome, 'dentro', o.velha));
    }
  }
  if (!usados.size && !cortados.length) return;
  gl.useProgram(progObj);
  gl.uniform1f(O.u.corte, 1e9);
  gl.uniformMatrix4fv(O.u.mvp, false, mvp); gl.uniform3fv(O.u.sol, norm(L.sol)); gl.uniform3fv(O.u.corSol, L.cor); gl.uniform3fv(O.u.amb, L.amb); gl.uniform3fv(O.u.ceu, L.ceu); gl.uniform3fv(O.u.olho, e.olho); gl.uniform1f(O.u.longe, Math.max(900, cam.dist * 2.4));
  for (let i = 0; i < 5; i++) gl.enableVertexAttribArray(i);
  const lote = mg => {
    gl.bindBuffer(gl.ARRAY_BUFFER, mg.b);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 28, 12); gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 28, 24);
    gl.bindBuffer(gl.ARRAY_BUFFER, mg.inst); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mg.lista), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 32, 0); gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 32, 16);
    inst.vertexAttribDivisorANGLE(3, 1); inst.vertexAttribDivisorANGLE(4, 1);
    const quantos = mg.lista.length / 8; inst.drawArraysInstancedANGLE(gl.TRIANGLES, 0, mg.n, quantos); facesObjetos += mg.n / 6 * quantos; mg.lista = [];
  };
  for (const mg of usados) lote(mg);
  /* a casa em que o personagem está: em 3ª pessoa, sem o que fica por cima e com as paredes cortadas para enxergar dentro */
  for (const o of cortados){
    const nome = Povoar.modeloDe(o), emCima = anda.nivel === 1, partes = ['casco', 'dentro'];
    if (anda.primeira) partes.push('cima', 'teto'); else if (emCima) partes.push('cima');
    gl.uniform1f(O.u.corte, anda.primeira ? 1e9 : o.y + (emCima ? Casas.ANDAR : 0) + CORTE);
    for (const parte of partes){ usados.clear(); poe(o, modeloGL(nome, parte, o.velha)); for (const mg of usados) lote(mg); }
  }
  gl.uniform1f(O.u.corte, 1e9);
  inst.vertexAttribDivisorANGLE(3, 0); inst.vertexAttribDivisorANGLE(4, 0);
  for (let i = 0; i < 5; i++) gl.disableVertexAttribArray(i);
  gl.useProgram(progChao);
}

const buffer = (alvo, dados, uso = gl.STATIC_DRAW) => { const b = gl.createBuffer(); gl.bindBuffer(alvo, b); gl.bufferData(alvo, dados, uso); return b; };
function liga(bp, bn, bc, tipos){
  gl.bindBuffer(gl.ARRAY_BUFFER, bp); gl.enableVertexAttribArray(A[0]); gl.vertexAttribPointer(A[0], 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, bn); gl.enableVertexAttribArray(A[1]); gl.vertexAttribPointer(A[1], 3, tipos ? gl.BYTE : gl.FLOAT, !!tipos, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, bc); gl.enableVertexAttribArray(A[2]); gl.vertexAttribPointer(A[2], 3, tipos ? gl.UNSIGNED_BYTE : gl.FLOAT, !!tipos, 0, 0);
}

/* ---------------------------------------------------------- pedaços do terreno */
const pedacos = new Array(PEDACOS * PEDACOS).fill(null);
function apaga(p){ if (!p) return; for (const b of p.buffers) gl.deleteBuffer(b); }
function monta(k, s){
  const pi = k % PEDACOS, pj = (k / PEDACOS) | 0, v = Mundo.voxeis(pi, pj, s);
  const nor = new Int8Array(v.nor.length); for (let i = 0; i < nor.length; i++) nor[i] = Math.round(v.nor[i] * 127);
  let ymin = 1e9, ymax = -1e9; for (let i = 1; i < v.pos.length; i += 3){ if (v.pos[i] < ymin) ymin = v.pos[i]; if (v.pos[i] > ymax) ymax = v.pos[i]; }
  const p = {s, quads:v.quads, ymin, ymax,
    bp:buffer(gl.ARRAY_BUFFER, new Float32Array(v.pos)), bn:buffer(gl.ARRAY_BUFFER, nor), bc:buffer(gl.ARRAY_BUFFER, new Uint8Array(v.cor)), bi:buffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(v.idx)), n:v.idx.length, agua:null};
  p.buffers = [p.bp, p.bn, p.bc, p.bi];
  if (v.aguaIdx.length){
    const q = v.aguaPos.length / 3, an = new Int8Array(q * 3), ac = new Uint8Array(q * 3); for (let i = 0; i < q; i++){ an[3 * i + 1] = 127; ac[3 * i] = 62; ac[3 * i + 1] = 112; ac[3 * i + 2] = 126; }
    p.agua = {bp:buffer(gl.ARRAY_BUFFER, new Float32Array(v.aguaPos)), bn:buffer(gl.ARRAY_BUFFER, an), bc:buffer(gl.ARRAY_BUFFER, ac), bi:buffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(v.aguaIdx)), n:v.aguaIdx.length};
    p.buffers.push(p.agua.bp, p.agua.bn, p.agua.bc, p.agua.bi);
  }
  apaga(pedacos[k]); pedacos[k] = p;
}
const centroDe = k => [(k % PEDACOS) * PEDACO - MEIO + PEDACO / 2, ((k / PEDACOS) | 0) * PEDACO - MEIO + PEDACO / 2];
function nivelDesejado(k, olho){
  const [x, z] = centroDe(k), d = Math.hypot(x - olho[0], z - olho[2], (olho[1] - cam.y) * .35), [a, b, c] = QUALIDADES[pref.qualidade].lim;
  const atual = pedacos[k]?.s, folga = s => atual === s ? 22 : 0;                       /* folga para não ficar trocando na fronteira */
  return d < a + folga(1) ? 1 : d < b + folga(2) ? 2 : d < c + folga(4) ? 4 : 8;
}
let pendentes = 0;
function atualizarPedacos(olho, orcamento){
  const fila = [];
  for (let k = 0; k < pedacos.length; k++){
    const s = nivelDesejado(k, olho), sujo = m.sujos.has(k), p = pedacos[k];
    if (!p || sujo || p.s !== s){ const [x, z] = centroDe(k); fila.push({k, s, d:Math.hypot(x - olho[0], z - olho[2]) - (sujo && p ? 5000 : 0) - (p ? 0 : 9000)}); }
  }
  pendentes = fila.length; if (!fila.length) return false;
  fila.sort((a, b) => a.d - b.d);
  const t0 = performance.now(); let feitos = 0;
  for (const f of fila){
    if (m.sujos.has(f.k)) limparPasseio(f.k);                    /* o terreno mudou: o passeio do pedaço é refeito */
    monta(f.k, pedacos[f.k] || f.d > -4000 ? f.s : 8); m.sujos.delete(f.k); feitos++;
    if (performance.now() - t0 > orcamento) break;
  }
  pendentes -= feitos; return true;
}

/* ---------------------------------------------------------- câmera */
const FOV = 46 * Math.PI / 180, FOV_PRIMEIRA = 72 * Math.PI / 180;
const CORTE = 1.35, OLHOS = 1.6;
const campo = () => anda.ativo && anda.primeira ? FOV_PRIMEIRA : FOV;
const dentroDe = (o, x, z, folga) => { const c = Math.cos(o.rot), s = Math.sin(o.rot), dx = x - o.x, dz = z - o.z; return Math.abs(dx * c - dz * s) < o.w / 2 + folga && Math.abs(dx * s + dz * c) < o.d / 2 + folga; };
const norm = v => { const t = Math.hypot(...v) || 1; return v.map(a => a / t); };
const cruz = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
const ponto = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
function eixos(){
  const dir = [Math.sin(cam.giro) * Math.cos(cam.elev), Math.sin(cam.elev), Math.cos(cam.giro) * Math.cos(cam.elev)];
  if (anda.ativo && anda.primeira){                              /* 1ª pessoa: a câmera fica nos olhos do personagem */
    const olho = [anda.x, anda.y + OLHOS, anda.z], z = dir, x = norm(cruz([0, 1, 0], z)), y = cruz(z, x);
    return {olho, x, y, z};
  }
  let alcance = cam.dist;
  if (anda.ativo && povoado.solidos){                           /* caminhando, a câmera chega mais perto em vez de atravessar uma casa */
    for (let d = .8; d <= cam.dist; d += .4){
      const px = cam.x + dir[0] * d, py = cam.y + dir[1] * d, pz = cam.z + dir[2] * d;
      if ([...povoado.solidos.perto(px, pz, 6)].some(o => !o.vao && o !== anda.casa && py < o.y + (o.h || 2) && dentroDe(o, px, pz, .35))){ alcance = Math.max(1.2, d - .5); break; }
    }
  }
  const olho = [cam.x + dir[0] * alcance, cam.y + dir[1] * alcance, cam.z + dir[2] * alcance];
  if (Math.abs(olho[0]) < MEIO && Math.abs(olho[2]) < MEIO) olho[1] = Math.max(olho[1], Mundo.altura(olho[0], olho[2]) + .6);     /* a câmera não entra no chão */
  const z = norm([olho[0] - cam.x, olho[1] - cam.y, olho[2] - cam.z]), x = norm(cruz([0, 1, 0], z)), y = cruz(z, x);
  return {olho, x, y, z};
}
function matriz(asp, e){
  const {olho, x, y, z} = e, view = [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -ponto(x, olho), -ponto(y, olho), -ponto(z, olho), 1];
  const f = 1 / Math.tan(campo() / 2), perto = anda.ativo && anda.primeira ? .08 : Math.max(.2, cam.dist * .02), longe = 7000;
  const proj = [f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (longe + perto) / (perto - longe), -1, 0, 0, 2 * longe * perto / (perto - longe), 0];
  const r = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let l = 0; l < 4; l++) r[c*4 + l] = proj[l]*view[c*4] + proj[4 + l]*view[c*4 + 1] + proj[8 + l]*view[c*4 + 2] + proj[12 + l]*view[c*4 + 3];
  return r;
}
function raioDoPonteiro(px, py){
  const r = canvas.getBoundingClientRect(), e = eixos(), t = Math.tan(campo() / 2), asp = r.width / r.height;
  const nx = ((px - r.left) / r.width * 2 - 1) * t * asp, ny = (1 - (py - r.top) / r.height * 2) * t;
  return {origem:e.olho, dir:norm([0, 1, 2].map(i => -e.z[i] + e.x[i] * nx + e.y[i] * ny))};
}
const alvoDoPonteiro = (px, py) => { const r = raioDoPonteiro(px, py); return Mundo.mirar(r.origem, r.dir); };

/* ---------------------------------------------------------- linhas (cursor do pincel e rua em construção) */
const linhaP = gl && gl.createBuffer(), linhaN = gl && gl.createBuffer(), linhaC = gl && gl.createBuffer();
function desenhaLinha(pontos, cor, modo = gl.LINE_STRIP){
  if (pontos.length < 2) return;
  const n = pontos.length, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), c = new Float32Array(n * 3);
  pontos.forEach((p, i) => { pos.set(p, i * 3); c.set(cor, i * 3); });
  for (const [b, d] of [[linhaP, pos], [linhaN, nor], [linhaC, c]]){ gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, d, gl.DYNAMIC_DRAW); }
  liga(linhaP, linhaN, linhaC, false); gl.drawArrays(modo, 0, n);
}
const noChao = (x, z, sobe = .5) => [x, Mundo.altura(x, z) + sobe, z];
const anelDoPincel = (x, z, r) => Array.from({length:65}, (_, i) => noChao(x + Math.cos(i / 64 * Math.PI * 2) * r, z + Math.sin(i / 64 * Math.PI * 2) * r, .35 + cam.dist * .0015));
function segmentoNoChao(a, b){ const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3)); return Array.from({length:n + 1}, (_, i) => noChao(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n, .6 + cam.dist * .0015)); }

/* ================================================================ personagem que caminha */
const anda = {ativo:false, primeira:false, x:0, y:0, z:0, nivel:0, casa:null, rumo:0, fase:0, andando:false, quadros:null};
function prepararPersonagem(){
  let c = null; try { const s = localStorage.getItem('wo-criador-personagem'); if (s) c = validar(JSON.parse(s)); } catch (e){}
  c = c || structuredClone(PADRAO_WASHINGTON); c.lapis.usa = false;
  const modelo = montar(c);
  const arma = modelo.arma, mods = modelo.mods, animador = Animacao.animador(modelo);
  anda.quadros = {animador, arma, mods, parado:Animacao.parado(arma, mods), bp:buffer(gl.ARRAY_BUFFER, animador.pos), bn:buffer(gl.ARRAY_BUFFER, animador.nor), bc:buffer(gl.ARRAY_BUFFER, animador.cor), n:animador.total};
  anda.loco = Locomocao.novo(anda.rumo); mostrarPose();
}
/* calcula o desenho do instante atual a partir do estado da locomoção */
function mostrarPose(){
  const q = anda.quadros;
  q.animador.atualizar(Locomocao.pose(anda.loco, q.parado, q.arma, q.mods));
  gl.bindBuffer(gl.ARRAY_BUFFER, q.bp); gl.bufferData(gl.ARRAY_BUFFER, q.animador.pos, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, q.bn); gl.bufferData(gl.ARRAY_BUFFER, q.animador.nor, gl.DYNAMIC_DRAW);
}
/* um quadro de caminhada: quer = direção desejada (ou null). Em 1ª pessoa o corpo acompanha a câmera. */
function caminhar(dt, quer, correndo){
  const e = anda.loco, x0 = anda.x, z0 = anda.z;
  let passo;
  if (anda.primeira){
    /* nos olhos do personagem o controle é direto (anda de lado e de costas), só com arranque e freio */
    const v = quer === null ? 0 : (correndo ? Locomocao.AJUSTES.correr : Locomocao.AJUSTES.andar);
    if (quer !== null) anda.direcao = quer;
    const lim = (v > e.vel ? Locomocao.AJUSTES.arranque : Locomocao.AJUSTES.freio) * dt;
    e.vel += Math.max(-lim, Math.min(lim, v - e.vel)); e.rumo = Locomocao.angulo(cam.giro + Math.PI); e.velAng = 0;
    passo = {dx:Math.sin(anda.direcao || 0) * e.vel * dt, dz:Math.cos(anda.direcao || 0) * e.vel * dt, falta:0};
  } else passo = Locomocao.avancar(e, dt, quer, correndo);
  /* anda em passos curtos, para não atravessar parede quando a máquina engasga */
  const partes = Math.max(1, Math.ceil(Math.hypot(passo.dx, passo.dz) / .12));
  for (let i = 0; i < partes; i++){
    anda.x = Math.max(-MEIO + 2, Math.min(MEIO - 2, anda.x + passo.dx / partes)); anda.z = Math.max(-MEIO + 2, Math.min(MEIO - 2, anda.z + passo.dz / partes));
    if (povoado.solidos) [anda.x, anda.z] = Povoar.empurrar(povoado, anda.x, anda.z, anda.nivel);
    assentar();
  }
  const andou = Math.min(Math.hypot(anda.x - x0, anda.z - z0), e.vel * dt);
  if (dt > 0 && andou < e.vel * dt * .35) e.vel = Math.max(andou / dt, e.vel - Locomocao.AJUSTES.freio * dt);   /* encostou em algo */
  Locomocao.assentarPasso(e, dt, andou, passo.falta);
  anda.rumo = e.rumo; anda.andando = e.vel > .05;
  mostrarPose();
}
/* põe o personagem no chão certo (terreno, degrau, piso ou escada) e ajusta a câmera ao entrar e sair de uma casa */
function assentar(){
  const c = Povoar.chao(povoado, anda.x, anda.z, anda.nivel), antes = anda.casa;
  anda.y = c.casa ? c.y : Math.max(c.y, Mundo.altura(anda.x, anda.z) + Passeio.degrau(anda.x, anda.z)); anda.nivel = c.nivel; anda.casa = c.casa;
  if (!!c.casa === !!antes || anda.primeira) return;
  if (c.casa){ anda.porFora = {dist:cam.dist, elev:cam.elev}; cam.dist = 6.5; cam.elev = 1.05; }
  else if (anda.porFora){ cam.dist = anda.porFora.dist; cam.elev = anda.porFora.elev; anda.porFora = null; }
}
function alternarVisao(){
  if (!anda.ativo) return;
  anda.primeira = !anda.primeira;
  if (anda.primeira){ anda.terceira = {dist:cam.dist, elev:cam.elev}; cam.elev = .05; cam.giro = anda.rumo + Math.PI; }
  else { cam.dist = anda.casa ? 6.5 : anda.porFora?.dist || anda.terceira?.dist || 7.5; cam.elev = anda.casa ? 1.05 : .22; if (anda.casa && !anda.porFora) anda.porFora = {dist:7.5, elev:.22}; if (!anda.casa) anda.porFora = null; }
  dica(); pedirDesenho();
}
function alternarCaminhada(){
  if (!gl) return;
  anda.ativo = !anda.ativo;
  if (anda.ativo){
    if (!anda.quadros) prepararPersonagem();
    anda.x = cam.x; anda.z = cam.z; anda.rumo = cam.giro + Math.PI; anda.antes = {dist:cam.dist, elev:cam.elev};
    anda.primeira = false; anda.nivel = 0; anda.casa = null; anda.porFora = null; anda.loco = Locomocao.novo(anda.rumo);
    cam.dist = 7.5; cam.elev = .22; assentar(); canvas.focus();
  } else { anda.casa = null; anda.primeira = false; if (anda.antes){ cam.dist = anda.antes.dist; cam.elev = anda.antes.elev; } }
  $('#caminhar').textContent = anda.ativo ? '✋ Parar de caminhar' : '🚶 Caminhar';
  dica(); pedirDesenho();
}

/* ================================================================ desenho */
let desenhoPedido = false, cursor = null, rua = [];
function pedirDesenho(){ if (!desenhoPedido){ desenhoPedido = true; requestAnimationFrame(quadro); } }
const teclas = new Set();
let instante = 0;
function quadro(agora){
  desenhoPedido = false;
  const dt = instante ? Math.min(.05, (agora - instante) / 1000) : .016; instante = agora;
  let continua = false;
  /* teclado: caminhar ou deslizar a câmera */
  const frente = (teclas.has('w') || teclas.has('arrowup') ? 1 : 0) - (teclas.has('s') || teclas.has('arrowdown') ? 1 : 0), lado = (teclas.has('d') || teclas.has('arrowright') ? 1 : 0) - (teclas.has('a') || teclas.has('arrowleft') ? 1 : 0);
  if (teclas.has('q')){ cam.giro -= 1.6 * dt; continua = true; } if (teclas.has('e')){ cam.giro += 1.6 * dt; continua = true; }
  const fx = -Math.sin(cam.giro), fz = -Math.cos(cam.giro), dx = -fz, dz = fx;               /* direita de quem olha */
  if (!anda.ativo) anda.andando = false;
  if (anda.ativo && anda.quadros){
    const quer = frente || lado ? Math.atan2(fx * frente + dx * lado, fz * frente + dz * lado) : null;
    caminhar(dt, quer, teclas.has('shift'));
    continua = true;                                                   /* parado ele respira: o desenho não para */
  } else if (frente || lado){
    const t = Math.hypot(frente, lado), mx = (fx * frente + dx * lado) / t, mz = (fz * frente + dz * lado) / t;
    const vel = Math.max(12, cam.dist * .75) * (teclas.has('shift') ? 2.4 : 1);
    cam.x = Math.max(-MEIO, Math.min(MEIO, cam.x + mx * vel * dt)); cam.z = Math.max(-MEIO, Math.min(MEIO, cam.z + mz * vel * dt));
    continua = true;
  }
  if (anda.ativo){
    assentar();
    const segue = anda.primeira || Math.hypot(anda.x - cam.x, anda.z - cam.z) > 3 ? 1 : 1 - Math.exp(-14 * dt), alvoY = anda.y + (anda.casa ? 1.0 : 1.35);
    cam.x += (anda.x - cam.x) * segue; cam.z += (anda.z - cam.z) * segue; cam.y += (alvoY - cam.y) * (anda.primeira || Math.abs(alvoY - cam.y) > 2 ? 1 : 1 - Math.exp(-12 * dt));
  }
  else cam.y += (Mundo.altura(cam.x, cam.z) - cam.y) * Math.min(1, dt * 8);
  if (Math.abs(Mundo.altura(cam.x, cam.z) - cam.y) > .3 && !anda.ativo) continua = true;
  /* pincel enquanto o botão está apertado */
  if (pintando && cursor && pref.ferramenta === 'limpar'){ apagarObjetos(cursor[0], cursor[2], pref.raio); continua = true; }
  else if (pintando && cursor){
    Mundo.pincel(pref.ferramenta, cursor[0], cursor[2], {raio:pref.raio, forca:pref.forca, dt, alvo:pintando.alvo, material:pref.material, passo:pref.passo, profundidade:pref.profundidade});
    continua = true;
  }
  const e = eixos();
  if (atualizarPedacos(e.olho, pintando ? 26 : 14) && pendentes > 0) continua = true;
  desenhar(e);
  if (continua) pedirDesenho(); else instante = 0;
}
function desenhar(e = eixos()){
  if (!gl) return;
  const L = LUZES[pref.luz], W = canvas.width, H = canvas.height;
  gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.depthMask(true);
  gl.uniformMatrix4fv(U.mvp, false, matriz(W / H, e));
  gl.uniform3f(U.pos, 0, 0, 0); gl.uniform2f(U.rot, 1, 0); gl.uniform3fv(U.sol, norm(L.sol)); gl.uniform3fv(U.corSol, L.cor); gl.uniform3fv(U.amb, L.amb); gl.uniform3fv(U.ceu, L.ceu); gl.uniform3fv(U.olho, e.olho);
  gl.uniform1f(U.longe, Math.max(900, cam.dist * 2.4)); gl.uniform1f(U.modo, 0); gl.uniform1f(U.alfa, 1);
  const frenteCam = [-e.z[0], -e.z[1], -e.z[2]], visiveis = [], vistos = new Set();
  gl.uniform1f(U.zonas, mostraZonas() && ligarTexturaZonas() ? 1 : 0);
  let faces = 0;
  for (let k = 0; k < pedacos.length; k++){
    const p = pedacos[k]; if (!p) continue;
    const [x, z] = centroDe(k), v = [x - e.olho[0], (p.ymin + p.ymax) / 2 - e.olho[1], z - e.olho[2]], raio = Math.hypot(PEDACO * .72, (p.ymax - p.ymin) / 2);
    const d = Math.hypot(...v); if (d > raio && ponto(v, frenteCam) / d < Math.cos(Math.min(1.45, campo() * .5 * Math.max(1, W / H) + .22)) - raio / d) continue;     /* fora da vista */
    visiveis.push(p); vistos.add(k); faces += p.quads;
    liga(p.bp, p.bn, p.bc, true); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.bi); gl.drawElements(gl.TRIANGLES, p.n, gl.UNSIGNED_SHORT, 0);
  }
  faces += desenharPasseio(e, vistos);
  gl.uniform1f(U.zonas, 0);
  if (anda.ativo && anda.quadros && !anda.primeira){
    const q = anda.quadros;
    gl.uniform3f(U.pos, anda.x, anda.y, anda.z); gl.uniform2f(U.rot, Math.cos(anda.rumo), Math.sin(anda.rumo));
    liga(q.bp, q.bn, q.bc, false); gl.drawArrays(gl.TRIANGLES, 0, q.n); gl.uniform3f(U.pos, 0, 0, 0); gl.uniform2f(U.rot, 1, 0);
  }
  desenharObjetos(e, matriz(W / H, e), L, k => vistos.has(k)); faces += facesObjetos;
  gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
  /* o programa dos objetos usa outros índices de atributos: religa os do terreno */
  gl.uniform1f(U.modo, 1); gl.uniform1f(U.alfa, .8);
  for (const p of visiveis) if (p.agua){ liga(p.agua.bp, p.agua.bn, p.agua.bc, true); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.agua.bi); gl.drawElements(gl.TRIANGLES, p.agua.n, gl.UNSIGNED_SHORT, 0); }
  gl.depthMask(true);
  /* guias por cima do terreno */
  gl.disable(gl.DEPTH_TEST); gl.uniform1f(U.modo, 2); gl.uniform1f(U.alfa, .95);
  if (!anda.ativo){
    if (cursor && pref.ferramenta === 'colocar'){                                       /* contorno do objeto, com a seta mostrando a frente */
      const o = Povoar.TODOS[pref.objeto], ang = pref.giroObjeto * Math.PI / 180, larg = o.w || (o.copa || .8) * 1.2, fundo = o.d || (o.copa || .8) * 1.2;
      const q = Povoar.cantos(cursor[0], cursor[2], larg, fundo, ang), frente = [cursor[0] + Math.sin(ang) * (fundo / 2 + 2), cursor[2] + Math.cos(ang) * (fundo / 2 + 2)];
      for (let i = 0; i < 4; i++) desenhaLinha(segmentoNoChao(q[i], q[(i + 1) % 4]), [1, .55, .2]);
      desenhaLinha(segmentoNoChao([cursor[0], cursor[2]], frente), [1, .9, .2]);
    }
    else if (cursor && pref.ferramenta !== 'navegar' && !FERRAMENTAS_ZONAS[pref.ferramenta]) desenhaLinha(anelDoPincel(cursor[0], cursor[2], pref.ferramenta === 'rua' ? pref.ruaLargura / 2 : pref.raio), [1, .55, .2]);
    if (pref.ferramenta === 'rua' && rua.length){
      const pts = cursor ? [...rua, [cursor[0], cursor[2]]] : rua;
      for (let i = 0; i + 1 < pts.length; i++) desenhaLinha(segmentoNoChao(pts[i], pts[i + 1]), [1, 1, 1]);
      for (const p of rua) desenhaLinha(anelDoPincel(p[0], p[1], 2 + cam.dist * .004), [1, .9, .2]);
    }
  }
  gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
  const casas = povoado.contagem.casas;
  $('#info').textContent = (casas ? `${casas.toLocaleString('pt-BR')} casas · ` : '') + `Altitude ${Mundo.altura(cursor ? cursor[0] : cam.x, cursor ? cursor[2] : cam.z).toFixed(1).replace('.', ',')} m · ${Math.round(faces / 1000)} mil faces${pendentes > 0 ? ` · detalhando ${pendentes}` : ''}`;
  const ali = mostraZonas() && zonasAtuais()?.zonaEm(anda.ativo ? anda.x : cursor ? cursor[0] : cam.x, anda.ativo ? anda.z : cursor ? cursor[2] : cam.z);
  if (ali) $('#info').textContent = ali.nome + ' · ' + Territorios.DONOS[ali.dono] + ' · ' + $('#info').textContent;
  desenharMarcador();
}

/* ---------------------------------------------------------- minimapa */
const mapa = $('#mapa'), mx2d = mapa.getContext('2d'), fundoMapa = document.createElement('canvas'); fundoMapa.width = fundoMapa.height = 200;
function pintarMapa(){
  const x = fundoMapa.getContext('2d'), img = x.createImageData(200, 200), passo = Mundo.LADO / 200;
  for (let j = 0; j < 200; j++) for (let i = 0; i < 200; i++){
    const wx = (i + .5) * passo - MEIO, wz = (j + .5) * passo - MEIO, mat = Mundo.materialEm(wx, wz), k = (j * 200 + i) * 4;
    const cel = Math.floor((wz + MEIO) / Mundo.CM) * Mundo.C + Math.floor((wx + MEIO) / Mundo.CM), cor = m.agua[cel] ? [78, 124, 134] : Mundo.CORES[mat];
    const sombra = 1 + Math.max(-.35, Math.min(.35, (Mundo.alturaGrade(m.h, wx - 7, wz - 7) - Mundo.alturaGrade(m.h, wx + 7, wz + 7)) * -.09));
    img.data[k] = cor[0] * sombra; img.data[k + 1] = cor[1] * sombra; img.data[k + 2] = cor[2] * sombra; img.data[k + 3] = 255;
  }
  /* ruas finas somem na amostragem: passa de novo marcando o asfalto */
  for (let j = 0; j < Mundo.C; j += 3) for (let i = 0; i < Mundo.C; i += 3){ const mat = m.mat[j * Mundo.C + i]; if (mat === M.asfalto || mat === M.rua_terra){ const k = (Math.floor(j / Mundo.C * 200) * 200 + Math.floor(i / Mundo.C * 200)) * 4; const c = mat === M.asfalto ? [50, 52, 58] : [196, 150, 100]; img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; } }
  for (const o of povoado.lista) if (o.cat === 'casa'){ const k = (Math.min(199, Math.floor((o.z + MEIO) / Mundo.LADO * 200)) * 200 + Math.min(199, Math.floor((o.x + MEIO) / Mundo.LADO * 200))) * 4; img.data[k] = 214; img.data[k + 1] = 120; img.data[k + 2] = 90; }
  x.putImageData(img, 0, 0);
  const res = mostraZonas() && zonasAtuais();
  if (res){
    const c = document.createElement('canvas'); c.width = c.height = Territorios.W;
    c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(Territorios.pintura(res, zonaEscolhida).buffer), Territorios.W, Territorios.W), 0, 0);
    x.drawImage(c, 0, 0, 200, 200);
  }
}
function desenharMarcador(){
  mx2d.drawImage(fundoMapa, 0, 0);
  const px = (cam.x + MEIO) / Mundo.LADO * 200, pz = (cam.z + MEIO) / Mundo.LADO * 200, r = anda.ativo ? anda.rumo : cam.giro + Math.PI;
  mx2d.save(); mx2d.translate(px, pz); mx2d.rotate(Math.PI - r); mx2d.fillStyle = '#F16A32'; mx2d.strokeStyle = '#fff'; mx2d.lineWidth = 1.5;
  mx2d.beginPath(); mx2d.moveTo(0, -9); mx2d.lineTo(6, 6); mx2d.lineTo(0, 3); mx2d.lineTo(-6, 6); mx2d.closePath(); mx2d.fill(); mx2d.stroke(); mx2d.restore();
}
mapa.addEventListener('pointerdown', e => {
  const r = mapa.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * Mundo.LADO - MEIO, z = (e.clientY - r.top) / r.height * Mundo.LADO - MEIO;
  if (anda.ativo){ anda.x = x; anda.z = z; } cam.x = x; cam.z = z; cam.y = Mundo.altura(x, z); pedirDesenho();
});

/* ================================================================ ponteiro e teclado */
let arrasto = null, pintando = null;
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', e => {
  canvas.focus(); canvas.setPointerCapture(e.pointerId);
  const ferramenta = anda.ativo ? 'navegar' : pref.ferramenta;
  if (e.button === 0 && ferramenta !== 'navegar'){
    const p = alvoDoPonteiro(e.clientX, e.clientY); if (!p) return; cursor = p;
    if (ferramenta === 'rua'){ rua.push([p[0], p[2]]); painel(); pedirDesenho(); return; }
    if (ferramenta === 'colocar'){ colocarObjeto(p[0], p[2]); return; }
    if (FERRAMENTAS_ZONAS[ferramenta]){ clicarZona(p[0], p[2], ferramenta); return; }
    /* continuando uma água que já existe, o nível dela é mantido, para não criar um degrau no meio */
    const jaTemAgua = ferramenta === 'agua' ? m.agua[Math.floor((p[2] + MEIO) / Mundo.CM) * Mundo.C + Math.floor((p[0] + MEIO) / Mundo.CM)] : 0;
    Mundo.iniciarTraco(); pintando = {alvo:jaTemAgua ? jaTemAgua + .4 : Mundo.alturaGrade(m.h, p[0], p[2])}; instante = 0; pedirDesenho(); return;
  }
  arrasto = {x:e.clientX, y:e.clientY, mover:!anda.ativo && (e.button === 1 || e.shiftKey)};
});
canvas.addEventListener('pointermove', e => {
  if (arrasto){
    const dx = e.clientX - arrasto.x, dy = e.clientY - arrasto.y; arrasto.x = e.clientX; arrasto.y = e.clientY;
    if (arrasto.mover){
      const k = cam.dist * .0016, fx = -Math.sin(cam.giro), fz = -Math.cos(cam.giro);
      cam.x = Math.max(-MEIO, Math.min(MEIO, cam.x + fz * dx * k + fx * dy * k)); cam.z = Math.max(-MEIO, Math.min(MEIO, cam.z - fx * dx * k + fz * dy * k));
    } else { cam.giro -= dx * .006; cam.elev = Math.max(anda.ativo ? (anda.primeira ? -1.2 : -.15) : .06, Math.min(anda.ativo && anda.primeira ? 1.2 : 1.5, cam.elev + dy * .005)); }
    pedirDesenho(); return;
  }
  if (!anda.ativo && pref.ferramenta !== 'navegar'){ cursor = alvoDoPonteiro(e.clientX, e.clientY); pedirDesenho(); }
});
function soltar(){
  arrasto = null;
  if (pintando){ pintando = null; if (Mundo.encerrarTraco()){ pintarMapa(); guardarEmBreve(); painel(); repovoarEmBreve(); } pedirDesenho(); }
}
canvas.addEventListener('pointerup', soltar); canvas.addEventListener('pointercancel', soltar);
canvas.addEventListener('pointerleave', () => { if (!pintando){ cursor = null; pedirDesenho(); } });
canvas.addEventListener('wheel', e => { e.preventDefault(); cam.dist = Math.max(anda.ativo ? 3 : 8, Math.min(anda.ativo ? 30 : 3200, cam.dist * (e.deltaY > 0 ? 1.12 : .89))); pedirDesenho(); }, {passive:false});
canvas.addEventListener('dblclick', () => { if (pref.ferramenta === 'rua' && rua.length > 2){ rua.pop(); concluirRua(); } });
const escrevendo = () => /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName || '') && document.activeElement.type !== 'range';
window.addEventListener('keydown', e => {
  if (escrevendo()) return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'z'){ e.preventDefault(); passoAtras(e.shiftKey); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'y'){ e.preventDefault(); passoAtras(true); return; }
  if (e.ctrlKey || e.metaKey) return;
  if (k === 'r' && pref.ferramenta === 'colocar' && !anda.ativo){ pref.giroObjeto = (pref.giroObjeto + (e.shiftKey ? -15 : 15) + 360) % 360; guardaPref(); painel(); pedirDesenho(); return; }
  if (k === 'v' && anda.ativo){ alternarVisao(); return; }
  if (k === 'enter' && rua.length > 1){ concluirRua(); return; }
  if (k === 'escape'){ if (rua.length){ rua = []; painel(); pedirDesenho(); } else if (anda.ativo) alternarCaminhada(); return; }
  if (['w', 'a', 's', 'd', 'q', 'e', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)){ if (k.startsWith('arrow')) e.preventDefault(); teclas.add(k); instante = 0; pedirDesenho(); }
});
window.addEventListener('keyup', e => teclas.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => { teclas.clear(); soltar(); });
function passoAtras(refaz){ if (refaz ? Mundo.refazer() : Mundo.desfazer()){ repovoar(); pintarMapa(); guardarEmBreve(); painel(); pedirDesenho(); } else aviso(refaz ? 'Nada para refazer.' : 'Nada para desfazer.'); }
function concluirRua(){
  if (rua.length < 2){ aviso('Clique em pelo menos dois pontos.'); return; }
  const terra = pref.ruaMaterial === 'terra';
  Mundo.iniciarTraco(); Mundo.tracarRua(rua, pref.ruaLargura, {material:terra ? M.rua_terra : M.asfalto, calcada:pref.ruaCalcada && !terra}); Mundo.encerrarTraco();
  rua = []; repovoar(); pintarMapa(); guardarEmBreve(); painel(); pedirDesenho(); aviso('Rua traçada.');
}

/* ---------------------------------------------------------- colocar e apagar objetos à mão */
const copiaDoPovo = () => ({removidos:m.povo.removidos.slice(), manuais:m.povo.manuais.slice()});
function colocarObjeto(x, z){
  Mundo.iniciarTraco(); m.traco.povo = copiaDoPovo();
  const cat = Povoar.CATEGORIA(pref.objeto);
  m.povo.manuais = m.povo.manuais.concat({id:pref.objeto, x:Math.round(x * 10) / 10, z:Math.round(z * 10) / 10, rot:cat === 'planta' ? Math.random() * 6.28 : pref.giroObjeto * Math.PI / 180, cor:pref.corObjeto});
  Mundo.encerrarTraco(); repovoar(); pintarMapa(); guardarEmBreve(); painel(); pedirDesenho();
}
function apagarObjetos(x, z, raio){
  const alvos = povoado.lista.filter(o => Math.hypot(o.x - x, o.z - z) < raio);
  if (!alvos.length) return;
  if (m.traco && !m.traco.povo) m.traco.povo = copiaDoPovo();
  const naMao = alvos.filter(o => o.manual), automaticos = alvos.filter(o => !o.manual).map(Povoar.chaveDe);
  if (naMao.length) m.povo.manuais = m.povo.manuais.filter(a => !naMao.some(o => Math.abs(o.x - a.x) < .01 && Math.abs(o.z - a.z) < .01 && o.id === a.id));
  if (automaticos.length) m.povo.removidos = m.povo.removidos.concat(automaticos);
  const fora = new Set(alvos); povoado.lista = povoado.lista.filter(o => !fora.has(o));         /* some na hora; a ocupação é refeita ao soltar */
  for (const [k, v] of porPedaco) porPedaco.set(k, v.filter(o => !fora.has(o)));
}
function dica(){
  const f = pref.ferramenta;
  $('#dica').textContent = anda.ativo ? 'W A S D ou setas: andar · Shift: correr · arraste: olhar · V: ' + (anda.primeira ? '3ª' : '1ª') + ' pessoa · rodinha: distância · Esc: sair'
    : f === 'rua' ? 'Clique para marcar os pontos da rua · Enter ou duplo clique: concluir · Esc: cancelar · botão direito: girar'
    : f === 'navegar' ? 'Arraste: girar · Shift + arraste: mover · rodinha: aproximar · W A S D: deslizar · Q E: girar'
    : FERRAMENTAS_ZONAS[f] ? ({'zona-ver':'Clique numa zona para ver os dados', 'zona-pintar':'Clique nas zonas para dar o dono escolhido', 'zona-nova':'Clique onde deve nascer uma zona nova', 'zona-tirar':'Clique numa zona para juntá-la às vizinhas'}[f]) + ' · botão direito: girar · Ctrl+Z: desfazer'
    : f === 'colocar' ? 'Clique para colocar · R: girar (Shift + R: ao contrário) · botão direito: girar a vista · Ctrl+Z: desfazer'
    : 'Botão esquerdo: usar o pincel · botão direito: girar · Shift + botão direito: mover · Ctrl+Z: desfazer';
}

/* ================================================================ arquivos */
function exportarAlturas(){
  const N_ = Mundo.N, alt = new Float32Array(N_ * N_); let lo = 1e9, hi = -1e9;
  for (let j = 0; j < N_; j++) for (let i = 0; i < N_; i++){ const v = Mundo.altura(i * Mundo.CEL - MEIO, j * Mundo.CEL - MEIO); alt[j * N_ + i] = v; if (v < lo) lo = v; if (v > hi) hi = v; }
  const raw = new Uint8Array(N_ * N_ * 2), dv = new DataView(raw.buffer);
  for (let i = 0; i < N_ * N_; i++) dv.setUint16(i * 2, Math.round((alt[i] - lo) / (hi - lo || 1) * 65535), true);
  const c = document.createElement('canvas'); c.width = c.height = Mundo.C; const x = c.getContext('2d'), img = x.createImageData(Mundo.C, Mundo.C);
  for (let j = 0; j < Mundo.C; j++) for (let i = 0; i < Mundo.C; i++){ const wx = (i + .5) * Mundo.CM - MEIO, wz = (j + .5) * Mundo.CM - MEIO, cor = m.agua[j * Mundo.C + i] ? Mundo.CORES[M.agua] : Mundo.CORES[Mundo.materialEm(wx, wz)]; img.data.set([cor[0], cor[1], cor[2], 255], (j * Mundo.C + i) * 4); }
  x.putImageData(img, 0, 0);
  const png = Uint8Array.from(atob(c.toDataURL('image/png').split(',')[1]), ch => ch.charCodeAt(0));
  const txt = `Mapa de alturas do mundo "${pref.nome}"\n\naltura.r16: ${N_} x ${N_} pontos, 16 bits sem sinal, little-endian. Linhas do norte para o sul, cada linha do oeste para o leste.\nValor 0 = ${lo.toFixed(2)} m de altitude; valor 65535 = ${hi.toFixed(2)} m. Diferença: ${(hi - lo).toFixed(2)} m.\nÁrea: ${Mundo.LADO} x ${Mundo.LADO} m. Um ponto a cada ${Mundo.CEL} m.\ncores.png: ${Mundo.C} x ${Mundo.C}, uma cor por quadrado de ${Mundo.CM} m (norte em cima).\n\nCréditos obrigatórios\nRelevo: SRTM data courtesy of the U.S. Geological Survey.${temRuas() ? '\nRuas e rios: © colaboradores do OpenStreetMap.' : ''}\n`;
  const objetos = {explicacao:'x: metros para leste do centro; z: metros para o sul; y: altitude em metros; giro: radianos em torno do eixo vertical (0 = frente para o sul)', objetos:povoado.lista.map(o => ({tipo:o.id, x:+o.x.toFixed(2), y:+o.y.toFixed(2), z:+o.z.toFixed(2), giro:+o.rot.toFixed(3), cor:Povoar.TINTAS[o.cor], abandonado:o.velha, ...(o.planta ? {planta:o.planta} : {}), escalaX:+(o.sx || 1).toFixed(3)}))};
  return {zip:zip([['altura.r16', raw], ['cores.png', png], ['objetos.json', JSON.stringify(objetos)], ['leia-me.txt', txt]]), min:lo, max:hi};
}
/* GLB de um quadrado em volta do ponto olhado, com voxels de 1 m e cores nos vértices */
const exportarGLBArea = (lado = 256) => Pacote.pedaco(povoado.lista, cam.x, cam.z, lado, {temRuas:temRuas(), interiores:pref.interiores});
function gerarPacote(lado = pref.areaPacote){
  const r = Pacote.arquivos(povoado.lista, {lado:+lado, cx:cam.x, cz:cam.z, nome:pref.nome, temRuas:temRuas(), interiores:pref.interiores, problemas:conferencia.terminou ? conferencia.problemas : conferirTudo(), territorios:zonasAtuais()});
  return {zip:zip(r.arquivos), manifesto:r.manifesto};
}

/* ================================================================ conferência do mapa */
let conferencia = {terminou:false, rodando:false, problemas:[], feitas:0, total:0, mostrando:0};
const esqueceConferencia = () => { conferencia = {terminou:false, rodando:false, problemas:[], feitas:0, total:0, mostrando:0}; };
/* de uma vez (usado na exportação e nos testes) */
function conferirTudo(){ const v = Conferir.iniciar(povoado); while (!v.passo(1e9)){} conferencia = {terminou:true, rodando:false, problemas:v.problemas, feitas:v.total, total:v.total, mostrando:0}; return v.problemas; }
/* aos poucos, mostrando o andamento */
function conferirNaTela(){
  repovoar(); const v = Conferir.iniciar(povoado), minha = conferencia = {terminou:false, rodando:true, problemas:v.problemas, feitas:0, total:v.total, mostrando:0};
  const segue = () => {
    if (conferencia !== minha) return;                               /* o mapa mudou: a conferência antiga é abandonada */
    const fim = v.passo(30); minha.feitas = v.feitas(); minha.terminou = fim; minha.rodando = !fim;
    if (pref.aba === 'conferir') painel();
    if (!fim) setTimeout(segue, 0); else { pedirDesenho(); aviso(v.problemas.length ? 'Conferência concluída.' : 'Conferência concluída: nenhum problema.'); }
  };
  painel(); setTimeout(segue, 0);
}
function irAte(p){
  if (anda.ativo) alternarCaminhada();
  Object.assign(cam, {x:p.x, z:p.z, giro:p.rot + .5, elev:.75, dist:24}); cam.y = Mundo.altura(p.x, p.z); pedirDesenho();
}
/* tira do mapa a construção que causa os problemas graves (dá para desfazer) */
function removerGraves(){
  const alvos = new Set(); for (const p of conferencia.problemas) if (p.grave) alvos.add(p.tipo === 'porta' ? p.objetos[1] : p.objetos[0]);
  if (!alvos.size) return;
  Mundo.iniciarTraco(); m.traco.povo = copiaDoPovo();
  const naMao = [...alvos].filter(o => o.manual);
  m.povo.manuais = m.povo.manuais.filter(a => !naMao.some(o => Math.abs(o.x - a.x) < .01 && Math.abs(o.z - a.z) < .01 && o.id === a.id));
  m.povo.removidos = m.povo.removidos.concat([...alvos].filter(o => !o.manual).map(Povoar.chaveDe));
  Mundo.encerrarTraco(); const quantos = alvos.size; repovoar(); pintarMapa(); guardarEmBreve(); pedirDesenho(); aviso(quantos + ' item(ns) retirado(s). Ctrl+Z desfaz.'); conferirNaTela();
}
function abaConferir(){
  const c = conferencia, mil = v => v.toLocaleString('pt-BR'), itens = [
    nota('Procura o que estragaria o jogo: casa em que não dá para entrar, porta tampada, construção sobre outra, na rua ou na água, e escada alta demais.'),
    botao(c.rodando ? `Conferindo… ${mil(c.feitas)} de ${mil(c.total)} casas` : c.terminou ? 'Conferir de novo' : 'Conferir o mapa', () => { if (!conferencia.rodando) conferirNaTela(); }, !c.terminou, {'data-acao':'conferir'}),
  ];
  if (c.terminou){
    const graves = c.problemas.filter(p => p.grave).length, avisos = c.problemas.length - graves;
    itens.push(el('p', {class:'veredito' + (graves ? ' ruim' : '')}, graves ? `${mil(graves)} problema(s) grave(s)` : 'Nenhum problema grave', el('span', {}, `${mil(c.total)} casas conferidas · ${mil(avisos)} aviso(s)`)));
    const porTipo = Conferir.resumo(c.problemas);
    for (const [tipo, info] of Object.entries(Conferir.TIPOS)){
      if (!porTipo[tipo]) continue;
      const lista = c.problemas.filter(p => p.tipo === tipo);
      itens.push(el('div', {class:'campo'}, el('span', {class:'rotulo'}, `${info.grave ? '● ' : '○ '}${info.nome} (${mil(lista.length)})`),
        el('div', {class:'achados'}, ...lista.slice(0, 8).map(p => el('button', {type:'button', onclick:() => irAte(p)}, p.detalhe))), lista.length > 8 && nota(`Mostrando 8 de ${mil(lista.length)}.`)));
    }
    if (graves) itens.push(botao('Retirar o que causa os problemas graves', removerGraves, false, {'data-acao':'retirar'}));
    itens.push(nota('Clique em um item para a câmera ir até ele. Escada alta é só um aviso: dá para entrar.'));
  }
  return itens;
}
/* ================================================================ territórios */
function redesenhaZonas(){ texturaVelha = true; pintarMapa(); painel(); pedirDesenho(); }
/* toda mudança nas zonas passa por aqui, para poder desfazer */
function mudaZonas(fn){
  Mundo.iniciarTraco(); m.traco.zonas = m.zonas; const nova = structuredClone(m.zonas); fn(nova); m.zonas = nova; Mundo.encerrarTraco();
  esqueceZonas(); guardarEmBreve(); redesenhaZonas();
}
function escolheZona(i){ zonaEscolhida = i; redesenhaZonas(); }
function dividirZonas(){ zonaEscolhida = -1; ocupado('Dividindo o mapa em zonas…', () => { const nova = Territorios.dividir(pref.tamanhoZonas, 1 + Math.floor(Math.random() * 99999)); mudaZonas(z => Object.assign(z, nova)); }); }
function sugerirDonos(){ const res = zonasAtuais(); if (!res) return; const donos = Territorios.sugerirDonos(res); mudaZonas(z => z.sementes.forEach((s, i) => s.dono = donos[i])); aviso('Donos sugeridos. Ctrl+Z desfaz.'); }
function clicarZona(x, z, ferramenta){
  const res = zonasAtuais(), alvo = res?.zonaEm(x, z); if (!alvo) return;
  if (ferramenta === 'zona-ver') escolheZona(alvo.i);
  else if (ferramenta === 'zona-pintar'){ zonaEscolhida = alvo.i; if (alvo.dono !== pref.donoPincel) mudaZonas(n => n.sementes[alvo.i].dono = pref.donoPincel); else redesenhaZonas(); }
  else if (ferramenta === 'zona-nova'){
    if (m.zonas.sementes.length >= Territorios.LIMITE){ aviso('Limite de zonas atingido.'); return; }
    if (m.zonas.sementes.some(s => Math.hypot(s.x - x, s.z - z) < 25)){ aviso('Clique mais longe do ponto de uma zona que já existe.'); return; }
    zonaEscolhida = m.zonas.sementes.length;
    mudaZonas(n => { n.sementes.push({x:Math.round(x), z:Math.round(z), dono:'livre', nome:Territorios.nomePadrao(n.proximo - 1)}); n.proximo++; });
  } else if (ferramenta === 'zona-tirar'){
    if (m.zonas.sementes.length < 2){ aviso('Precisa sobrar pelo menos uma zona.'); return; }
    zonaEscolhida = -1; mudaZonas(n => n.sementes.splice(alvo.i, 1));
  }
}
function irAteZona(x, z, dist){ if (anda.ativo) alternarCaminhada(); Object.assign(cam, {x, z, elev:1.05, dist}); cam.y = Mundo.altura(x, z); pedirDesenho(); }
let confirmaDivisao = false;
function abaTerritorios(){
  const mil = v => v.toLocaleString('pt-BR'), res = zonasAtuais();
  const tamanho = faixa('Tamanho das zonas no bairro', 90, 300, 10, pref.tamanhoZonas, v => 'cerca de ' + v + ' m', v => { pref.tamanhoZonas = v; guardaPref(); }, 'tamanhozonas');
  if (!res) return [
    nota('Divide o mapa em zonas que facções e a sua comunidade podem dominar. As divisas acompanham as ruas. No mato, as zonas são maiores.'),
    tamanho,
    botao('Dividir o mapa em zonas', dividirZonas, true, {'data-acao':'dividir'}),
    m.desfazer.length > 0 && botao('↶ Desfazer', () => passoAtras(false), false, {'data-acao':'desfazer'}),
  ];
  const zonas = res.zonas, conta = {}; for (const z of zonas) conta[z.dono] = (conta[z.dono] || 0) + 1;
  const bolinha = id => el('i', {style:'background:' + Territorios.CORES_DONO[id]});
  const itens = [
    el('p', {class:'veredito'}, mil(zonas.length) + ' zonas', el('span', {}, `${zonas.filter(z => z.tipo === 'urbana').length} no bairro · ${zonas.filter(z => z.tipo === 'rural').length} no mato · ${zonas.filter(z => z.base).length} com ponto de base`)),
    el('div', {class:'legenda'}, ...Object.entries(Territorios.DONOS).filter(([id]) => conta[id]).map(([id, nome]) => el('span', {}, bolinha(id), `${nome}: ${conta[id]}`))),
    escolhas('O que o clique faz', {navegar:'Só olhar', ...FERRAMENTAS_ZONAS}, pref.ferramenta, 'ferramentazona', k => { pref.ferramenta = k; cursor = null; guardaPref(); if (anda.ativo) alternarCaminhada(); dica(); painel(); pedirDesenho(); }),
  ];
  if (pref.ferramenta === 'zona-pintar') itens.push(el('div', {class:'campo'}, el('span', {class:'rotulo'}, 'Dono que o clique vai dar'),
    el('div', {class:'escolhas materiais'}, ...Object.entries(Territorios.DONOS).map(([id, nome]) => el('button', {type:'button', class:id === pref.donoPincel ? 'ativo' : '', 'data-dono':id, onclick:() => { pref.donoPincel = id; guardaPref(); painel(); }}, bolinha(id), nome)))));
  const z = zonas[zonaEscolhida];
  if (z){
    const nome = el('input', {type:'text', value:z.nome, maxlength:'40', 'aria-label':'Nome da zona', 'data-campo':'nomezona'});
    nome.addEventListener('change', () => { const v = nome.value.trim(); if (v && v !== z.nome) mudaZonas(n => n.sementes[z.i].nome = v.slice(0, 40)); else painel(); });
    const dono = el('select', {'aria-label':'Dono da zona', 'data-campo':'donozona'}, ...Object.entries(Territorios.DONOS).map(([id, n]) => el('option', {value:id, selected:id === z.dono}, n)));
    dono.addEventListener('change', () => mudaZonas(n => n.sementes[z.i].dono = dono.value));
    const f = FACCOES[z.dono];
    itens.push(el('div', {class:'ficha'},
      el('label', {class:'campo'}, el('span', {class:'rotulo'}, 'Zona escolhida'), nome),
      el('label', {class:'campo'}, el('span', {class:'rotulo'}, 'Dono'), dono),
      f && el('p', {class:'resumo'}, f.quer),
      el('p', {class:'resumo'}, `${z.tipo === 'urbana' ? 'Bairro' : 'Mato e sítios'} · ${(z.area / 10000).toFixed(1).replace('.', ',')} hectares · ${mil(z.casas.length)} casa(s)${z.temAgua ? ' · tem água' : ''}`),
      el('p', {class:'resumo'}, z.base ? 'Tem um ponto de base: uma casa onde uma comunidade pode se instalar.' : 'Sem ponto de base: menos de 3 casas.'),
      el('div', {class:'dupla'}, botao('Ver a zona', () => irAteZona(...z.centro, Math.max(150, Math.sqrt(z.area) * 1.7)), false, {'data-acao':'verzona'}), z.base && botao('Ver a base', () => irAteZona(z.base.x, z.base.z, 45), false, {'data-acao':'verbase'})),
      el('span', {class:'rotulo'}, `Faz divisa com (${z.vizinhas.length})`),
      el('div', {class:'achados'}, ...z.vizinhas.map(i => el('button', {type:'button', onclick:() => escolheZona(i)}, bolinha(zonas[i].dono), zonas[i].nome)))));
  } else itens.push(nota('Escolha "Ver zona" e clique no mapa 3D para ver os dados e mudar o nome ou o dono.'));
  itens.push(
    el('div', {class:'divisa'}),
    botao('Sugerir donos para o começo', sugerirDonos, false, {'data-acao':'sugerir'}),
    nota('Dá a cada facção um grupo de zonas que combina com ela e deixa a maioria livre. A zona marcada como sua é mantida; os outros donos são trocados.'),
    botao('Deixar todas livres', () => mudaZonas(n => n.sementes.forEach(s => s.dono = 'livre')), false, {'data-acao':'livres'}),
    el('div', {class:'divisa'}), tamanho,
    botao(confirmaDivisao ? 'Confirmar: apagar nomes e donos' : 'Dividir de novo', () => { if (!confirmaDivisao){ confirmaDivisao = true; painel(); return; } confirmaDivisao = false; dividirZonas(); }, confirmaDivisao, {'data-acao':'redividir'}),
    chave('Mostrar as zonas nas outras abas', 'verZonas'),
    el('div', {class:'dupla'}, botao(`↶ Desfazer (${m.desfazer.length})`, () => passoAtras(false), false, {'data-acao':'desfazer'}), botao(`↷ Refazer (${m.refazer.length})`, () => passoAtras(true), false, {'data-acao':'refazer'})),
    nota('As zonas são salvas com o mundo e vão no pacote para jogo (territorios.json). A tomada de áreas sem visita e sem comunidade ativa será programada no jogo.'),
  );
  return itens;
}
function imagem(w, h){
  const antes = [canvas.width, canvas.height], c0 = cursor; cursor = null; canvas.width = w; canvas.height = h; passeioDeUmaVez = true; desenhar(); passeioDeUmaVez = false;
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'), ceu = LUZES[pref.luz].ceu.map(v => v * 255 | 0);
  x.fillStyle = `rgb(${ceu})`; x.fillRect(0, 0, w, h); x.drawImage(canvas, 0, 0);
  const url = c.toDataURL('image/png'); canvas.width = antes[0]; canvas.height = antes[1]; cursor = c0; desenhar(); return url;
}

/* ================================================================ painel */
function el(tag, attrs = {}, ...filhos){
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v);
  e.append(...filhos.filter(f => f != null && f !== false)); return e;
}
const escolhas = (titulo, lista, atual, dado, fn, classe = '') => el('div', {class:'campo'}, el('span', {class:'rotulo'}, titulo),
  el('div', {class:'escolhas ' + classe}, ...Object.entries(lista).map(([k, nome]) => el('button', {type:'button', class:k === String(atual) ? 'ativo' : '', 'aria-pressed':String(k === String(atual)), ['data-' + dado]:k, onclick:() => fn(k)}, nome))));
function faixa(titulo, min, max, passo, valor, texto, fn, dado){
  const saida = el('b', {}, texto(valor)), i = el('input', {type:'range', min:String(min), max:String(max), step:String(passo), 'aria-label':titulo, 'data-faixa':dado});
  i.value = String(valor); i.addEventListener('input', () => { saida.textContent = texto(+i.value); fn(+i.value); });
  return el('label', {class:'faixa'}, el('span', {}, titulo, saida), i);
}
const botao = (texto, fn, principal, extra = {}) => el('button', {type:'button', class:'acao' + (principal ? ' principal' : ''), onclick:fn, ...extra}, texto);
const nota = t => el('p', {class:'nota'}, t);
function chave(titulo, campo){ const i = el('input', {type:'checkbox', 'data-chave':campo}); i.checked = pref[campo]; i.addEventListener('change', () => { pref[campo] = i.checked; guardaPref(); pintarMapa(); painel(); pedirDesenho(); }); return el('label', {class:'chave'}, i, titulo); }
const aplicaLuz = () => { canvas.style.background = LUZES[pref.luz].fundo; };
function redesenhaTudo(){ Mundo.sujarTudo(); pedirDesenho(); }

function ocupado(texto, fn){
  const tela = $('#carregando'); tela.textContent = texto; tela.hidden = false;
  setTimeout(() => { try { fn(); } catch (e){ console.error(e); aviso('Algo deu errado: ' + e.message); } repovoar(); tela.hidden = true; pintarMapa(); painel(); pedirDesenho(); }, 60);
}
function lerArquivo(aceita, rotulo, fn){
  const i = el('input', {type:'file', accept:aceita, 'aria-label':rotulo});
  i.addEventListener('change', async () => { const f = i.files[0]; if (!f) return; const t = await f.text(); i.value = ''; ocupado('Lendo o arquivo…', () => fn(JSON.parse(t))); });
  return el('label', {class:'campo'}, el('span', {class:'rotulo'}, rotulo), i);
}

const ABAS = {mundo:'Mundo', povoar:'Povoar', editar:'Editar', territorios:'Territórios', conferir:'Conferir', arquivo:'Arquivo'};
if (!ABAS[pref.aba]) pref.aba = 'mundo';
function mudouPovo(){ repovoar(); pintarMapa(); guardarEmBreve(); painel(); pedirDesenho(); }
function abaPovoar(){
  const P = m.povo, c = povoado.contagem, mil = v => v.toLocaleString('pt-BR');
  const lista = grupo => Object.fromEntries(Object.entries(grupo).map(([k, v]) => [k, v.nome]));
  const usar = id => { pref.objeto = id; pref.ferramenta = 'colocar'; if (anda.ativo) alternarCaminhada(); guardaPref(); dica(); painel(); pedirDesenho(); };
  const itens = [
    botao(P.ativo ? 'Tirar o povoamento automático' : 'Povoar o mundo', () => { P.ativo = !P.ativo; mudouPovo(); }, !P.ativo, {'data-acao':'povoar'}),
    nota(`${mil(c.casas)} casas · ${mil(c.plantas)} plantas · ${mil(c.rua)} itens de rua. As casas são inventadas: não copiam as casas reais.`),
  ];
  if (P.ativo){
    if (!m.ruas.some(r => Povoar.URBANAS.has(r.tipo))) itens.push(nota('Ainda não há ruas urbanas: trace uma rua de asfalto com calçada para as casas aparecerem.'));
    itens.push(
      escolhas('Situação', {abandonado:'Apocalipse (abandonado)', normal:'Antes do apocalipse'}, P.estado, 'situacao', k => { P.estado = k; mudouPovo(); }),
      faixa('Casas', 0, 1, .05, P.casas, v => Math.round(v * 100) + '%', v => { P.casas = v; repovoarEmBreve(); guardarEmBreve(); }, 'casas'),
      faixa('Vegetação', 0, 1, .05, P.vegetacao, v => Math.round(v * 100) + '%', v => { P.vegetacao = v; repovoarEmBreve(); guardarEmBreve(); }, 'vegetacao'),
      faixa('Itens de rua', 0, 1, .05, P.rua, v => Math.round(v * 100) + '%', v => { P.rua = v; repovoarEmBreve(); guardarEmBreve(); }, 'itensrua'),
      botao('Sortear outra distribuição', () => { P.semente = 1 + Math.floor(Math.random() * 99999); P.removidos = []; mudouPovo(); }, false, {'data-acao':'sortear'}),
    );
    if (P.removidos.length) itens.push(botao(`Trazer de volta os apagados (${P.removidos.length})`, () => { P.removidos = []; mudouPovo(); }, false, {'data-acao':'restaurar-objetos'}));
  }
  itens.push(chave('Ver sem telhado (chegue perto)', 'semTelhado'), nota('As casas têm sala, quarto, cozinha e banheiro. Caminhando, entre pela porta da frente; a tecla V troca para a 1ª pessoa.'));
  const ativoObj = pref.ferramenta === 'colocar' ? pref.objeto : '';
  itens.push(el('div', {class:'divisa'}), el('span', {class:'rotulo'}, 'Colocar à mão'),
    escolhas('Casas', lista(Povoar.CASAS), ativoObj, 'objeto', usar), escolhas('Plantas', lista(Povoar.PLANTAS), ativoObj, 'objeto', usar), escolhas('Rua', lista(Povoar.RUA), ativoObj, 'objeto', usar));
  if (pref.ferramenta === 'colocar') itens.push(
    faixa('Giro do objeto', 0, 345, 15, pref.giroObjeto, v => v + '°', v => { pref.giroObjeto = v; guardaPref(); pedirDesenho(); }, 'giroobjeto'),
    el('div', {class:'campo'}, el('span', {class:'rotulo'}, 'Cor da casa ou do carro'), el('div', {class:'cores'}, ...Povoar.TINTAS.map((h, i) => el('button', {type:'button', class:'amostra' + (i === pref.corObjeto ? ' ativo' : ''), style:'background:' + h, 'aria-label':'Cor ' + h, onclick:() => { pref.corObjeto = i; guardaPref(); painel(); }})))));
  itens.push(el('div', {class:'dupla'},
    botao('Apagar objetos', () => { pref.ferramenta = 'limpar'; guardaPref(); dica(); painel(); pedirDesenho(); }, pref.ferramenta === 'limpar', {'data-acao':'limpar'}),
    botao('Só olhar', () => { pref.ferramenta = 'navegar'; cursor = null; guardaPref(); dica(); painel(); pedirDesenho(); }, false, {'data-acao':'olhar'})));
  if (pref.ferramenta === 'limpar') itens.push(faixa('Tamanho do pincel', 3, 120, 1, pref.raio, v => v * 2 + ' m de largura', v => { pref.raio = v; guardaPref(); pedirDesenho(); }, 'raio'));
  itens.push(el('div', {class:'dupla'}, botao(`↶ Desfazer (${m.desfazer.length})`, () => passoAtras(false), false, {'data-acao':'desfazer'}), botao(`↷ Refazer (${m.refazer.length})`, () => passoAtras(true), false, {'data-acao':'refazer'})));
  return itens;
}
let novaFonte = null;
function conteudo(){
  if (pref.aba === 'mundo') return [
    escolhas('Estilo do voxel', ESTILOS, m.cfg.estilo, 'estilo', k => { m.cfg.estilo = k; redesenhaTudo(); guardarEmBreve(); painel(); }),
    faixa('Rugosidade (detalhe inventado)', 0, 1, .05, m.cfg.rugosidade, v => Math.round(v * 100) + '%', v => { m.cfg.rugosidade = v; redesenhaTudo(); repovoarEmBreve(); guardarEmBreve(); }, 'rugosidade'),
    faixa('Exagero do relevo', .5, 2.5, .1, m.cfg.exagero, v => v.toFixed(1).replace('.', ',') + '×', v => { m.cfg.exagero = v; redesenhaTudo(); repovoarEmBreve(); guardarEmBreve(); }, 'exagero'),
    escolhas('Qualidade', Object.fromEntries(Object.entries(QUALIDADES).map(([k, v]) => [k, v.nome])), pref.qualidade, 'qualidade', k => { pref.qualidade = k; guardaPref(); painel(); pedirDesenho(); }, 'tres'),
    escolhas('Luz', Object.fromEntries(Object.entries(LUZES).map(([k, v]) => [k, v.nome])), pref.luz, 'luz', k => { pref.luz = k; guardaPref(); aplicaLuz(); painel(); pedirDesenho(); }, 'tres'),
    el('div', {class:'divisa'}),
    escolhas('Começar um mundo novo', {bairro:'O bairro', morros:'Morros inventados', plano:'Terreno plano'}, novaFonte || m.cfg.fonte, 'fonte', k => { novaFonte = k; painel(); }, 'tres'),
    botao(novaFonte ? 'Confirmar: apagar as mudanças e criar' : 'Recomeçar este terreno', () => { if (!novaFonte){ novaFonte = m.cfg.fonte; painel(); return; } const f = novaFonte; novaFonte = null; ocupado('Criando o terreno…', () => { novoMundo(f); guardarEmBreve(); }); }, !!novaFonte, {'data-acao':'novo'}),
    nota(temRuas() ? 'O bairro usa o relevo aberto da região e as ruas do OpenStreetMap.' : 'O bairro usa o relevo aberto da região (detalhe real de uns 30 m). As ruas ainda não foram baixadas: desenhe com "Traçar rua" ou importe um arquivo do OpenStreetMap.'),
    lerArquivo('.json,application/json', 'Importar ruas e rios (OpenStreetMap, .json)', o => { const t = Mundo.importarOSM(o, centro); guardarEmBreve(); aviso(`Importado: ${t.ruas} ruas, ${t.rios} rios e ${t.lagos} lagos.`); }),
  ];
  if (pref.aba === 'povoar') return abaPovoar();
  if (pref.aba === 'conferir') return abaConferir();
  if (pref.aba === 'territorios') return abaTerritorios();
  if (pref.aba === 'editar'){
    const f = pref.ferramenta, itens = [
      escolhas('Ferramenta', {navegar:'Só olhar', ...FERRAMENTAS, limpar:FERRAMENTAS_OBJETOS.limpar}, f, 'ferramenta', k => { pref.ferramenta = k; rua = []; cursor = null; guardaPref(); if (anda.ativo) alternarCaminhada(); dica(); painel(); pedirDesenho(); }),
    ];
    if (f === 'rua') itens.push(
      faixa('Largura da rua', 3, 18, 1, pref.ruaLargura, v => v + ' m', v => { pref.ruaLargura = v; guardaPref(); pedirDesenho(); }, 'largura'),
      escolhas('Piso', {asfalto:'Asfalto', terra:'Terra batida'}, pref.ruaMaterial, 'piso', k => { pref.ruaMaterial = k; guardaPref(); painel(); }),
      pref.ruaMaterial === 'asfalto' && chave('Com calçada', 'ruaCalcada'),
      botao(`Concluir rua (${rua.length} ponto${rua.length === 1 ? '' : 's'})`, concluirRua, rua.length > 1, {'data-acao':'concluir'}),
      nota('A rua acompanha o morro, mas alisa o chão: fica no mesmo nível de um lado ao outro.'));
    else if (f === 'colocar') itens.push(nota('Escolha o objeto na aba "Povoar".'));
    else if (f !== 'navegar'){
      itens.push(faixa('Tamanho do pincel', 3, 120, 1, pref.raio, v => v * 2 + ' m de largura', v => { pref.raio = v; guardaPref(); pedirDesenho(); }, 'raio'));
      if (!['pintar', 'agua', 'restaurar', 'limpar'].includes(f)) itens.push(faixa('Força', .05, 1, .05, pref.forca, v => Math.round(v * 100) + '%', v => { pref.forca = v; guardaPref(); }, 'forca'));
      if (f === 'terraco') itens.push(faixa('Altura de cada platô', 1, 12, .5, pref.passo, v => v + ' m', v => { pref.passo = v; guardaPref(); }, 'passo'));
      if (f === 'agua') itens.push(faixa('Profundidade', 1, 10, .5, pref.profundidade, v => v + ' m', v => { pref.profundidade = v; guardaPref(); }, 'profundidade'), nota('A água fica na altura do ponto onde o traço começa, e o fundo é cavado.'));
      if (f === 'nivelar') itens.push(nota('Leva o chão até a altura do ponto onde o traço começa. Bom para fazer lotes e praças.'));
      if (f === 'pintar') itens.push(el('div', {class:'campo'}, el('span', {class:'rotulo'}, 'Material'), el('div', {class:'escolhas materiais'}, ...MATERIAIS.map((mat, i) => i === M.agua ? null : el('button', {type:'button', class:i === pref.material ? 'ativo' : '', 'data-material':mat.id, onclick:() => { pref.material = i; guardaPref(); painel(); }}, el('i', {style:`background:${mat.cor || 'linear-gradient(135deg,#5F8A3A 50%,#827E76 50%)'}`}), mat.nome)).filter(Boolean))));
    }
    itens.push(el('div', {class:'divisa'}), el('div', {class:'dupla'}, botao(`↶ Desfazer (${m.desfazer.length})`, () => passoAtras(false), false, {'data-acao':'desfazer'}), botao(`↷ Refazer (${m.refazer.length})`, () => passoAtras(true), false, {'data-acao':'refazer'})));
    return itens;
  }
  const nome = el('input', {type:'text', value:pref.nome, maxlength:'40'});
  nome.addEventListener('input', () => { pref.nome = nome.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 40) || 'mundo'; guardaPref(); });
  const caixa = (texto, dicaT, fn, principal, acao) => el('div', {class:'exporta'}, botao(texto, fn, principal, {'data-acao':acao}), el('p', {}, dicaT));
  return [
    el('label', {class:'campo'}, el('span', {class:'rotulo'}, 'Nome do mundo'), nome),
    caixa('Salvar mundo', 'Arquivo .mundo.json com tudo o que você mudou. É a sua cópia de segurança.', () => { baixar(pref.nome + '.mundo.json', JSON.stringify(Mundo.salvar({nome:pref.nome})), 'application/json'); aviso('Mundo salvo.'); }, true, 'salvar'),
    lerArquivo('.json,application/json', 'Abrir um mundo salvo', o => { Mundo.abrir(o, DADOS_BAIRRO, prepararBairro); if (o.nome) pref.nome = String(o.nome).slice(0, 40); guardaPref(); guardarEmBreve(); aviso('Mundo aberto.'); }),
    el('div', {class:'divisa'}),
    caixa('Exportar mapa de alturas (ZIP)', 'Alturas em 16 bits (.r16), mapa de cores e a lista de posições dos objetos (objetos.json), para o Unity, a Godot ou outro programa. Área toda: 2 × 2 km.', () => ocupado('Gerando o mapa de alturas…', () => { baixar(pref.nome + '-alturas.zip', exportarAlturas().zip, 'application/zip'); aviso('Mapa de alturas gerado.'); }), false, 'alturas'),
    el('div', {class:'campo'}, el('span', {class:'rotulo'}, 'Pacote para jogo')),
    escolhas('Área do pacote (em volta do ponto olhado)', {256:'256 m', 512:'512 m', 1024:'1 km', 2048:'Mapa todo'}, pref.areaPacote, 'areapacote', k => { pref.areaPacote = k; guardaPref(); painel(); }),
    caixa('Exportar pacote para jogo (ZIP)', 'O mapa em blocos, cada modelo guardado uma vez só, a lista de posições, os dados de colisão e a conferência. Em 1 km e no mapa todo o terreno sai com voxel de 2 m.', () => ocupado('Montando o pacote… em áreas grandes pode demorar.', () => { const r = gerarPacote(); baixar(`${pref.nome}-pacote-${r.manifesto.area}m.zip`, r.zip, 'application/zip'); aviso(`Pacote gerado: ${r.manifesto.blocos.length} bloco(s), ${r.manifesto.modelos} modelos, ${r.manifesto.instancias.toLocaleString('pt-BR')} posições.`); }), true, 'pacote'),
    el('div', {class:'divisa'}),
    chave('Incluir os cômodos das casas (arquivo maior)', 'interiores'),
    caixa('Exportar pedaço em 3D (GLB)', 'Um quadrado de 256 × 256 m em volta do ponto que você está olhando, com o terreno em voxels de 1 m e as casas, plantas e itens de rua.', () => ocupado('Gerando o pedaço em 3D…', () => { baixar(pref.nome + '-pedaco.glb', exportarGLBArea(), 'model/gltf-binary'); aviso('GLB gerado.'); }), false, 'glb'),
    caixa('Baixar imagem PNG', 'A vista que está na tela, em 2400 × 1500.', () => { baixar(pref.nome + '.png', imagem(2400, 1500), 'image/png'); aviso('PNG gerado.'); }, false, 'png'),
    el('div', {class:'divisa'}),
    nota('Créditos que precisam aparecer no jogo: "SRTM data courtesy of the U.S. Geological Survey"' + (temRuas() ? ' e "© colaboradores do OpenStreetMap".' : '. Se usar ruas do OpenStreetMap: "© colaboradores do OpenStreetMap".')),
  ];
}
function painel(){
  const caixa = $('#conteudo'), rolagem = caixa.scrollTop;
  $('#abas').replaceChildren(...Object.entries(ABAS).map(([k, nome]) => el('button', {type:'button', role:'tab', class:k === pref.aba ? 'ativo' : '', 'aria-selected':String(k === pref.aba), 'data-aba':k, onclick:() => { pref.aba = k; novaFonte = null; confirmaDivisao = false; if (k !== 'territorios' && FERRAMENTAS_ZONAS[pref.ferramenta]){ pref.ferramenta = 'navegar'; cursor = null; dica(); } guardaPref(); pintarMapa(); painel(); pedirDesenho(); }}, nome)));
  caixa.replaceChildren(...conteudo().filter(Boolean)); caixa.scrollTop = rolagem;
}

/* ================================================================ início */
const VISTAS = {bairro:{x:0, z:0, giro:.45, elev:.52, dist:620}, cima:{giro:0, elev:1.5, dist:1300}, perto:{elev:.3, dist:60}, tudo:{x:0, z:0, giro:0, elev:.85, dist:2900}};
for (const b of document.querySelectorAll('[data-vista]')) b.addEventListener('click', () => { if (anda.ativo) alternarCaminhada(); Object.assign(cam, VISTAS[b.dataset.vista]); cam.y = Mundo.altura(cam.x, cam.z); pedirDesenho(); });
$('#caminhar').addEventListener('click', alternarCaminhada);
function ajustar(){
  const r = canvas.getBoundingClientRect(), e = Math.min(1.5, window.devicePixelRatio || 1), w = Math.max(2, Math.round(r.width * e)), h = Math.max(2, Math.round(r.height * e));
  if (canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; }
  pedirDesenho();
}
Mundo.definirCalcada(Passeio.substituto);
if (!gl){ $('#carregando').textContent = 'Este navegador não abriu o 3D (WebGL).'; return; }
setTimeout(() => {
  if (TESTE){ novoMundo('bairro', 7); m.povo.estado = TESTE[1] === 'normal' ? 'normal' : 'abandonado'; }
  else if (!recuperar()) novoMundo('bairro');
  Object.assign(cam, VISTAS.bairro); cam.y = Mundo.altura(0, 0);
  repovoar(); aplicaLuz(); pintarMapa(); painel(); dica();
  const olho = eixos().olho; for (let k = 0; k < pedacos.length; k++) monta(k, 8); m.sujos.clear();          /* primeiro tudo grosso; o detalhe chega em seguida */
  atualizarPedacos(olho, 400);
  $('#carregando').hidden = true; new ResizeObserver(ajustar).observe(canvas); ajustar();
  if (TESTE) comecarTeste();
  window.__mundo.pronto = true;
}, 80);
/* leva para o meio de uma rua do bairro, olhando ao longo dela, e já começa a caminhar */
function comecarTeste(){
  let melhor = null;
  for (const r of m.ruas){
    if (!Povoar.URBANAS.has(r.tipo)) continue;
    for (let i = 1; i < r.pts.length; i++){
      const a = r.pts[i - 1], b = r.pts[i], ax = a.x ?? a[0], az = a.z ?? a[1], bx = b.x ?? b[0], bz = b.z ?? b[1];
      const x = (ax + bx) / 2, z = (az + bz) / 2, d = Math.hypot(x, z), comprido = Math.hypot(bx - ax, bz - az);
      if (comprido > 12 && (!melhor || d < melhor.d)) melhor = {x, z, d, rumo:Math.atan2(bx - ax, bz - az)};
    }
  }
  if (melhor){ cam.x = melhor.x; cam.z = melhor.z; cam.giro = melhor.rumo + Math.PI; }
  cam.y = Mundo.altura(cam.x, cam.z); alternarCaminhada();
  aviso('Área de teste: mapa fixo, nada é salvo. WASD anda, Shift corre, V muda a visão.');
}
window.__mundo = {pronto:false, zonas:zonasAtuais, dividirZonas, sugerirDonos, clicarZona, escolheZona, gerarPacote, conferirTudo, conferirNaTela, conferencia:() => conferencia, irAte, alternarVisao, assentar, povoado:() => povoado, repovoar, apagarObjetos, colocarObjeto, objetosDesenhados:() => ({n:desenhados, faces:facesObjetos}), instancias:!!inst, cam, pref, anda, desenhar, pedirDesenho, imagem, painel, pintarMapa, exportarAlturas, exportarGLBArea, alternarCaminhada, teclas,
  /* monta de uma vez todo o detalhe da vista atual (usado nos testes e nas imagens) */
  completar:() => { passeioDeUmaVez = true; if (anda.ativo) assentar(); cam.y = anda.ativo ? anda.y + (anda.casa ? 1 : 1.35) : Mundo.altura(cam.x, cam.z); const t0 = performance.now(); atualizarPedacos(eixos().olho, 1e9); desenhar(); passeioDeUmaVez = false; return Math.round(performance.now() - t0); },
  faces:() => pedacos.reduce((s, p) => s + (p ? p.quads : 0), 0), pendentes:() => pendentes, quadro, mirarNaTela:alvoDoPonteiro};
})();
