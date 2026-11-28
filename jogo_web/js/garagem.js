/* Janela da garagem: mostra a base, a carroceria e as rodas de cada tipo de carro e exporta com as peças separadas. */
(() => {
const $ = s => document.querySelector(s);
const GUARDA = 'wo-garagem';
const MOSTRAR = {completo:'Carro completo', raiox:'Raio-x (por dentro)', rodando:'Base, rodas e bancos', base:'Só a base'};
const GRUPOS_DE = {completo:['base', 'interior', 'rodas', 'carroceria'], raiox:['base', 'interior', 'rodas', 'carroceria'], rodando:['base', 'interior', 'rodas'], base:['base']};
const CORES_PRONTAS = ['#8E2A26', '#2E5C8A', '#33413A', '#E4E2DA', '#6B6F74', '#1D1E22', '#C9A227', '#C4622A', '#B49C6C', '#4B5340'];
const PADRAO = {tipo:'sedan', mostrar:'completo', cores:{}, rodas:{}, estado:'inteiro', aberto:false, motorista:false, passageiros:false, quem:'eu', uso:'civil', funcao:'radiopatrulha', luz:'azul', blindagem:'nenhuma', ferrugem:'0', espinhos:false, kit:'nenhum', capacete:true, animar:false, velocidade:'normal'};
const VELOCIDADES = {lenta:'Lenta', normal:'Normal', rapida:'Rápida'}, METROS_POR_SEGUNDO = {lenta:1, normal:1.7, rapida:2.8};
const QUADROS_DA_PEDALADA = 36, MARCHA = 1.7;          /* quantas voltas a roda dá por volta do pedal */
const CATEGORIAS_VEICULO = {carro:'Carros', moto:'Motos', bike:'Bicicletas'};
const ficha = t => CARROS[t] || DUAS_RODAS[t];
const categoriaDe = t => CARROS[t] ? 'carro' : DUAS_RODAS[t].grupo;
const MOSTRAR_2R = {completo:'Completa', rodando:'Base e rodas', base:'Só a base'};
const USOS = {civil:'Civil', nova:'PM: pintura nova', antiga:'PM: pintura antiga'};
let cfg = structuredClone(PADRAO);
try { const s = JSON.parse(localStorage.getItem(GUARDA)); if (s && ficha(s.tipo)){ for (const k in PADRAO) if (typeof s[k] === typeof PADRAO[k]) cfg[k] = s[k]; if (!MOSTRAR[cfg.mostrar]) cfg.mostrar = 'completo'; if (!ESTADOS_CARRO[cfg.estado]) cfg.estado = 'inteiro'; if (!USOS[cfg.uso]) cfg.uso = 'civil'; if (!LUZES_VIATURA[cfg.luz]) cfg.luz = 'azul'; if (!BLINDAGENS[cfg.blindagem]) cfg.blindagem = 'nenhuma'; if (!FERRUGENS[cfg.ferrugem]) cfg.ferrugem = '0'; if (!VELOCIDADES[cfg.velocidade]) cfg.velocidade = 'normal'; } } catch (e){}
const guardar = () => { try { localStorage.setItem(GUARDA, JSON.stringify(cfg)); } catch (e){} };
const corAtual = () => /^#[0-9a-f]{6}$/i.test(cfg.cores[cfg.tipo] || '') ? cfg.cores[cfg.tipo] : ficha(cfg.tipo).cor;
const aviso = t => { $('#aviso').textContent = t; clearTimeout(aviso.t); aviso.t = setTimeout(() => $('#aviso').textContent = '', 3500); };

/* ---------------------------------------------------------------- quem vai dentro */
const ROSTOS_PASSAGEIROS = [{pele:'#6B422B', cab:['dreads', '#17120F'], bar:'nenhuma', fem:1}, {pele:'#DDAA80', cab:['lateral', '#6B4226'], bar:'porfazer'}, {pele:'#C68E65', cab:['rabo', '#3B241A'], bar:'nenhuma', fem:1}, {pele:'#8D5A3A', cab:['careca', '#1A1210'], bar:'cavanhaque'}, {pele:'#F1C9A5', cab:['undercut', '#A8743F'], bar:'nenhuma'}];
function personagemEscolhido(){
  if (cfg.quem === 'criador'){ try { const s = localStorage.getItem('wo-criador-personagem'); if (s) return validar(JSON.parse(s)); } catch (e){} }
  const c = structuredClone(PADRAO_WASHINGTON);
  if (KITS[cfg.quem]) aplicarKit(c, cfg.quem);
  return c;
}
function passageiro(n){
  const r = ROSTOS_PASSAGEIROS[n % ROSTOS_PASSAGEIROS.length], c = structuredClone(r.fem ? PADRAO_FEMININO : PADRAO_WASHINGTON);
  c.pele = r.pele; c.cabelo = {estilo:r.cab[0], cor:r.cab[1]}; c.barba = {estilo:r.bar, cor:r.cab[1]}; c.sobrancelha = {estilo:r.fem ? 'finas' : 'grossas', cor:r.cab[1]}; c.oculos.estilo = 'nenhum';
  if (KITS[cfg.quem]) aplicarKit(c, cfg.quem);
  return c;
}

/* ---------------------------------------------------------------- cena */
let carro = null, pedaladaGuardada = {chave:'', quadros:null};
/* com alguém em cima, o guidão não vira: as mãos não acompanhariam */
const animando = () => cfg.animar && cfg.estado === 'inteiro';          /* abandonado e destruído ficam parados */
const aberturaAtual = () => cfg.aberto && !(DUAS_RODAS[cfg.tipo] && (animando() || cfg.motorista || (cfg.passageiros && DUAS_RODAS[cfg.tipo].grupo === 'moto')));
function quadsDaCena(){
  carro = construirCarro(cfg.tipo, {kit:cfg.kit, estado:cfg.estado, roda:cfg.rodas[cfg.tipo], viatura:cfg.uso === 'civil' ? null : cfg.uso, funcao:cfg.funcao, luz:cfg.luz, blindagem:cfg.blindagem, espinhos:cfg.espinhos, ferrugem:Number(cfg.ferrugem)});
  const solidos = [], vidros = [], moveis = [];
  let quadrosPiloto = null;
  /* peças que se mexem vão para listas separadas */
  const movimentoDe = p => !animando() ? null : p.nome.startsWith('roda_') ? {tipo:'roda', centro:p.pivo, raio:p.pivo[1]} : carro.pedais && p.nome === 'pedivela' ? {tipo:'pedivela', centro:p.pivo} : carro.pedais && (p.nome === 'pedal_e' || p.nome === 'pedal_d') ? {tipo:'pedal', lado:p.nome === 'pedal_e' ? 1 : -1} : null;
  for (const p of carro.partes){
    if (!GRUPOS_DE[carro.duasRodas && cfg.mostrar === 'raiox' ? 'completo' : cfg.mostrar].includes(p.grupo)) continue;
    const m = movimento(p, aberturaAtual()), mexe = movimentoDe(p), destino = mexe ? [] : solidos;
    if (mexe) moveis.push({...mexe, quads:destino});
    for (const q of quadsDaParte(p, corAtual())){
      const f = {v:q.v.map(m.ponto), n:m.normal(q.n), cor:q.cor};
      const lataria = cfg.mostrar === 'raiox' && p.grupo === 'carroceria';
      (q.vidro || lataria ? vidros : destino).push({...f, alfa:lataria ? (q.vidro ? .1 : .2) : .36});
    }
  }
  if (cfg.mostrar !== 'base') carro.lugares.forEach((l, i) => {
    if (!(i === 0 ? cfg.motorista : cfg.passageiros)) return;
    const quemE = i === 0 ? personagemEscolhido() : passageiro(i - 1);
    if (animando() && carro.pedais && i === 0){                       /* a pedalada é calculada antes, um quadro de cada vez */
      const chaveDaPedalada = JSON.stringify([cfg.tipo, quemE]);        /* trocar a cor ou a roda não muda a pedalada */
      if (pedaladaGuardada.chave !== chaveDaPedalada){
        const preparado = prepararPiloto(quemE, carro, 0, !cfg.capacete);
        pedaladaGuardada = {chave:chaveDaPedalada, quadros:Array.from({length:QUADROS_DA_PEDALADA}, (_, k) => poseDoPiloto(preparado, pedaisGirados(carro, k / QUADROS_DA_PEDALADA * Math.PI * 2)))};
      }
      quadrosPiloto = pedaladaGuardada.quadros;
      return;
    }
    solidos.push(...(carro.duasRodas ? pilotar(quemE, carro, i, !cfg.capacete) : personagemNoBanco(quemE, l)));
  });
  return {solidos, vidros, moveis, quadrosPiloto};
}

/* ---------------------------------------------------------------- visor (como o do criador, com vidro transparente) */
const canvas = $('#visor');
const gl = canvas.getContext('webgl', {antialias:true, alpha:true, premultipliedAlpha:false, preserveDrawingBuffer:true});
const cam = {giro:.65, elev:.28, dist:13.5, alvo:.85};
let percorrido = 0, relogioAnim = 0, instanteAnterior = 0;                 /* metros rodados desde que a animação ligou */
let desenhar = () => {}, carregar = () => {};
if (gl){
  /* cada peça móvel gira em torno do eixo X no seu centro e pode ser deslocada */
  const vs = `attribute vec3 p, n, c; uniform mat4 mvp; uniform vec3 centro, desloca; uniform vec2 gira; varying vec3 vn, vc;
    vec3 rodar(vec3 v){ return vec3(v.x, v.y * gira.x - v.z * gira.y, v.y * gira.y + v.z * gira.x); }
    void main(){ vn = rodar(n); vc = c; gl_Position = mvp * vec4(rodar(p - centro) + centro + desloca, 1.0); }`;
  const fs = `precision mediump float; varying vec3 vn, vc; uniform vec3 luz1, luz2; uniform float alfa, modo, porBaixo;
    void main(){
      if (modo > .5){ gl_FragColor = vec4(0.0, 0.0, 0.0, .3 * clamp((1.0 - length(vc.xy)) * 2.2, 0.0, 1.0)); return; }
      vec3 n = normalize(vn);
      float d = .56 + .14 * mix(n.y, -n.y, porBaixo) + .12 * porBaixo + .42 * max(dot(n, luz1), 0.0) + .17 * max(dot(n, luz2), 0.0);
      gl_FragColor = vec4(vc * min(d, 1.1), alfa);
    }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog); gl.useProgram(prog);
  const at = ['p', 'n', 'c'].map(a => gl.getAttribLocation(prog, a)), un = n => gl.getUniformLocation(prog, n);
  const bufS = gl.createBuffer(), bufV = gl.createBuffer(), bufSombra = gl.createBuffer();
  let nS = 0, faixas = [];
  const dados = quads => { const d = new Float32Array(quads.length * 54); let o = 0; for (const f of quads){ const c = rgb(f.cor).map(v => v / 255); for (const i of [0, 1, 2, 0, 2, 3]){ d.set(f.v[i], o); d.set(f.n, o + 3); d.set(c, o + 6); o += 9; } } return d; };
  const enche = (b, d) => { gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW); };
  let pecasMoveis = [], buffersPiloto = [];
  const identidade = () => { gl.uniform3f(un('centro'), 0, 0, 0); gl.uniform3f(un('desloca'), 0, 0, 0); gl.uniform2f(un('gira'), 1, 0); };
  const novoBuffer = quads => { const b = gl.createBuffer(); enche(b, dados(quads)); return {b, n:quads.length * 6}; };
  carregar = ({solidos, vidros, moveis = [], quadrosPiloto}) => {
    for (const x of [...pecasMoveis, ...buffersPiloto]) gl.deleteBuffer(x.buf.b);
    pecasMoveis = moveis.map(m => ({...m, buf:novoBuffer(m.quads)}));
    buffersPiloto = (quadrosPiloto || []).map(q => ({buf:novoBuffer(q)}));
    enche(bufS, dados(solidos)); nS = solidos.length * 6;
    vidros.sort((a, b) => a.alfa - b.alfa);
    faixas = []; vidros.forEach((q, i) => { const u = faixas.at(-1); if (u && u.alfa === q.alfa) u.n += 6; else faixas.push({alfa:q.alfa, ini:i * 6, n:6}); });
    enche(bufV, dados(vidros));
    const M = carro.medidas, rx = Math.max(.55, M.larg * .78), rz = M.comp * .6, s = [];
    for (const [x, z] of [[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]]) s.push(x * rx, -.002, z * rz, 0, 1, 0, x, z, 0);
    enche(bufSombra, new Float32Array(s));
  };
  const ligar = b => { gl.bindBuffer(gl.ARRAY_BUFFER, b); at.forEach((a, i) => { gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 3, gl.FLOAT, false, 36, i * 12); }); };
  const norm = v => { const t = Math.hypot(...v) || 1; return v.map(x => x / t); };
  const cruz = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
  const ponto = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  desenhar = () => {
    const W = canvas.width, H = canvas.height, asp = W / H;
    gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.depthMask(true);
    const dist = cam.dist * Math.max(1, 1.35 / asp);
    const alvo = [0, cam.alvo, cam.alvoZ || 0], dir = [Math.sin(cam.giro) * Math.cos(cam.elev), Math.sin(cam.elev), Math.cos(cam.giro) * Math.cos(cam.elev)];
    const olho = alvo.map((v, i) => v + dir[i] * dist), z = norm(dir), x = norm(cruz([0, 1, 0], z)), y = cruz(z, x);
    const view = [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -ponto(x, olho), -ponto(y, olho), -ponto(z, olho), 1];
    const f = 1 / Math.tan(28 * Math.PI / 360), n = .1, far = 120, proj = [f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + n) / (n - far), -1, 0, 0, 2 * far * n / (n - far), 0];
    const mvp = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let l = 0; l < 4; l++) mvp[c*4 + l] = proj[l]*view[c*4] + proj[4 + l]*view[c*4 + 1] + proj[8 + l]*view[c*4 + 2] + proj[12 + l]*view[c*4 + 3];
    gl.uniformMatrix4fv(un('mvp'), false, mvp); identidade();
    const luz = (a, e) => [Math.sin(cam.giro + a) * Math.cos(e), Math.sin(e), Math.cos(cam.giro + a) * Math.cos(e)];
    gl.uniform3fv(un('luz1'), luz(.55, cam.elev < -.3 ? -.8 : .75)); gl.uniform3fv(un('luz2'), luz(-1.1, .2));
    gl.uniform1f(un('porBaixo'), cam.elev < -.3 ? 1 : 0); gl.uniform1f(un('modo'), 0); gl.uniform1f(un('alfa'), 1); ligar(bufS); gl.drawArrays(gl.TRIANGLES, 0, nS);
    /* rodas, pedivela, pedais e quem pedala, na posição do instante */
    const volta = Math.PI * 2, giroPedal = carro && carro.pedais ? percorrido / (carro.medidas.rodaT / 2 * MARCHA) : 0;
    const quadro = Math.round(giroPedal / volta * QUADROS_DA_PEDALADA) % QUADROS_DA_PEDALADA, fi = buffersPiloto.length ? quadro / QUADROS_DA_PEDALADA * volta : giroPedal % volta;
    for (const m of pecasMoveis){
      identidade();
      if (m.tipo === 'roda' || m.tipo === 'pedivela'){ const a = m.tipo === 'roda' ? percorrido / m.raio : fi; gl.uniform3f(un('centro'), ...m.centro); gl.uniform2f(un('gira'), Math.cos(a), Math.sin(a)); }
      else { const agora = pedaisGirados(carro, fi)[m.lado]; gl.uniform3f(un('desloca'), 0, agora[0] - carro.pedais[m.lado][0], agora[1] - carro.pedais[m.lado][1]); }
      ligar(m.buf.b); gl.drawArrays(gl.TRIANGLES, 0, m.buf.n);
    }
    identidade();
    if (buffersPiloto.length){ const q = buffersPiloto[quadro].buf; ligar(q.b); gl.drawArrays(gl.TRIANGLES, 0, q.n); }
    gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    if (cam.elev > 0){ gl.uniform1f(un('modo'), 1); ligar(bufSombra); gl.drawArrays(gl.TRIANGLES, 0, 6); gl.uniform1f(un('modo'), 0); }
    ligar(bufV); for (const t of faixas){ gl.uniform1f(un('alfa'), t.alfa); gl.drawArrays(gl.TRIANGLES, t.ini, t.n); }
    gl.depthMask(true); gl.disable(gl.BLEND);
  };
  const ajustar = () => {
    const r = canvas.getBoundingClientRect(), e = Math.min(2, window.devicePixelRatio || 1), w = Math.max(2, Math.round(r.width * e)), h = Math.max(2, Math.round(r.height * e));
    if (canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; }
    desenhar();
  };
  let pino = null;
  canvas.addEventListener('pointerdown', e => { pino = [e.clientX, e.clientY]; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (!pino) return; cam.giro -= (e.clientX - pino[0]) * .008; cam.elev = Math.max(-1.45, Math.min(1.45, cam.elev + (e.clientY - pino[1]) * .006)); pino = [e.clientX, e.clientY]; desenhar(); });
  canvas.addEventListener('pointerup', () => pino = null); canvas.addEventListener('pointercancel', () => pino = null);
  canvas.addEventListener('wheel', e => { e.preventDefault(); cam.dist = Math.max(2.2, Math.min(30, cam.dist * (e.deltaY > 0 ? 1.09 : .92))); desenhar(); }, {passive:false});
  canvas.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') cam.giro += .2; else if (e.key === 'ArrowRight') cam.giro -= .2; else return; e.preventDefault(); desenhar(); });
  new ResizeObserver(ajustar).observe(canvas);
} else aviso('Este navegador não abriu o 3D (WebGL).');
const imagem = (w, h) => { const antes = [canvas.width, canvas.height]; canvas.width = w; canvas.height = h; desenhar(); const url = canvas.toDataURL('image/png'); canvas.width = antes[0]; canvas.height = antes[1]; desenhar(); return url; };
function quadroDaAnimacao(instante){
  if (!animando()){ relogioAnim = 0; return; }
  const passou = instanteAnterior ? Math.min(.05, (instante - instanteAnterior) / 1000) : 0; instanteAnterior = instante;
  percorrido += passou * METROS_POR_SEGUNDO[cfg.velocidade]; desenhar();
  relogioAnim = requestAnimationFrame(quadroDaAnimacao);
}
function ligarAnimacao(){
  if (animando() && !relogioAnim){ instanteAnterior = 0; relogioAnim = requestAnimationFrame(quadroDaAnimacao); }
  if (!animando() && relogioAnim){ cancelAnimationFrame(relogioAnim); relogioAnim = 0; }
}
function atualizar(){ carregar(quadsDaCena()); desenhar(); guardar(); ligarAnimacao(); }

/* ---------------------------------------------------------------- painel */
function el(tag, attrs = {}, ...filhos){
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v);
  e.append(...filhos); return e;
}
const mudar = (campo, valor) => { cfg[campo] = valor; atualizar(); painel(); };
const enquadrar = () => Object.assign(cam, CARROS[cfg.tipo] ? {dist:13.5, alvo:.85} : {dist:6.4, alvo:.8});
function escolherTipo(t){
  const antes = categoriaDe(cfg.tipo); cfg.tipo = t;
  if (antes !== categoriaDe(t)){ if (!CARROS[t] && cfg.mostrar === 'raiox') cfg.mostrar = 'completo'; enquadrar(); }
  atualizar(); painel();
}
/* ao colocar armadura num carro sem ferrugem, já vem com ferrugem média (dá para tirar logo abaixo) */
function blindar(k){
  if (k !== 'nenhuma' && cfg.blindagem === 'nenhuma' && cfg.ferrugem === '0') cfg.ferrugem = '2';
  mudar('blindagem', k);
}
/* ao virar viatura, quem está no carro passa a usar farda; ao voltar a ser civil, volta a roupa normal */
function usar(uso){
  if (uso !== 'civil' && cfg.quem === 'eu') cfg.quem = 'pm_radio';
  if (uso === 'civil' && cfg.quem === 'pm_radio') cfg.quem = 'eu';
  mudar('uso', uso);
}
const escolhas = (titulo, lista, atual, dado, fn) => el('div', {class:'campo'}, el('span', {class:'rotulo'}, titulo),
  el('div', {class:'escolhas'}, ...Object.entries(lista).map(([k, nome]) => el('button', {type:'button', class:k === atual ? 'ativo' : '', 'aria-pressed':String(k === atual), ['data-' + dado]:k, onclick:() => fn(k)}, nome))));
function chave(titulo, campo){
  const i = el('input', {type:'checkbox', 'data-chave':campo}); i.checked = cfg[campo];
  i.addEventListener('change', () => mudar(campo, i.checked));
  return el('label', {class:'chave'}, i, titulo);
}
function painel(){
  const duas = !CARROS[cfg.tipo], cat = categoriaDe(cfg.tipo), moto = cat === 'moto', M = ficha(cfg.tipo), caixa = $('#conteudo'), rolagem = caixa.scrollTop;
  const m = v => v.toFixed(2).replace('.', ',') + ' m';
  const medidas2r = () => [['Comprimento', m(carro.medidas.comp)], ['Largura (com guidão e acessórios)', m(carro.medidas.larg)], ['Altura', m(carro.medidas.alt)], ['Entre-eixos', m(M.entre)], ['Roda da frente', m(M.rodaF)], ['Roda de trás', m(M.rodaT)], ['Altura do banco', m(M.assento[0])], ['Altura das manoplas', m(M.guidao[0])], ['Lugares', String(carro.lugares.length)]];
  const medidas = duas ? medidas2r() : [['Comprimento', m(M.comp)], ['Largura (sem retrovisores e molduras)', m(M.larg)], [cfg.uso === 'civil' ? 'Altura' : 'Altura (sem giroflex e antenas)', m(M.alt)], ['Entre-eixos', m(M.entre)], ['Diâmetro da roda', m(M.roda)], ['Largura do pneu', m(M.pneu)], ['Vão do solo', m(M.vao)],
    ['Base', M.base === 'monobloco' ? 'Plataforma com soleiras' : 'Chassi de longarinas'], ['Tração', {dianteira:'Dianteira', traseira:'Traseira', '4x4':'4x4'}[M.tracao]], ['Lugares', String(M.lugares.length)]];
  const cores = el('div', {class:'cores'}, ...CORES_PRONTAS.map(c => el('button', {type:'button', class:'amostra' + (c === corAtual().toUpperCase() ? ' ativo' : ''), style:'background:' + c, 'aria-label':'Cor ' + c, onclick:() => { cfg.cores[cfg.tipo] = c; atualizar(); painel(); }})));
  const livre = el('input', {type:'color', value:corAtual(), 'aria-label':'Outra cor'});
  livre.addEventListener('input', () => { cfg.cores[cfg.tipo] = livre.value.toUpperCase(); atualizar(); }); livre.addEventListener('change', painel); cores.append(livre);
  const quem = el('select', {class:'cheio', 'aria-label':'Quem vai no veículo'}, el('option', {value:'eu'}, 'Meu personagem'), el('option', {value:'criador'}, 'Último salvo no criador'),
    ...Object.entries(GRUPOS_KITS).map(([g, nome]) => el('optgroup', {label:nome}, ...Object.entries(KITS).filter(([, k]) => k.grupo === g).map(([id, k]) => el('option', {value:id}, k.nome)))));
  quem.value = cfg.quem; quem.addEventListener('change', () => mudar('quem', quem.value));
  const sufixo = () => (cfg.blindagem === 'nenhuma' ? '' : '-' + cfg.blindagem) + (cfg.ferrugem === '0' ? '' : '-enferrujado');
  const nomeArq = () => duas ? `-`  + (carro.viatura ? '-pm' : '') + (carro.kit === 'nenhum' ? '' : '-' + carro.kit) : cfg.uso === 'civil' ? `carro-${cfg.tipo.replace(/_/g, '-')}` : `viatura-${cfg.tipo.replace(/_/g, '-')}-${carro.funcao}-${cfg.uso}`;
  const botao = (texto, dica, fn, principal) => el('div', {class:'exporta'}, el('button', {type:'button', class:'acao' + (principal ? ' principal' : ''), onclick:fn}, texto), el('p', {}, dica));
  caixa.replaceChildren(
    escolhas('Veículo', CATEGORIAS_VEICULO, cat, 'categoria', k => escolherTipo(k === 'carro' ? 'sedan' : k === 'moto' ? 'moto_urbana' : 'bike_mtb')),
    escolhas(moto ? 'Tipo de moto' : duas ? 'Tipo de bicicleta' : 'Tipo de carro', Object.fromEntries(Object.entries(duas ? DUAS_RODAS : CARROS).filter(([k]) => categoriaDe(k) === cat).map(([k, v]) => [k, v.nome])), cfg.tipo, 'tipo', escolherTipo),
    escolhas('O que mostrar', duas ? MOSTRAR_2R : MOSTRAR, cfg.mostrar, 'mostrar', k => mudar('mostrar', k)),
    ...(!duas || MOTOS_PM.includes(cfg.tipo) ? [escolhas(duas ? 'Uso da moto' : 'Uso do carro', USOS, cfg.uso, 'uso', usar)] : []),
    ...(duas ? [...(carro.viatura ? [escolhas('Luzes', LUZES_VIATURA, cfg.luz, 'luz', k => mudar('luz', k))] : [el('div', {class:'campo'}, el('span', {class:'rotulo'}, 'Cor da pintura'), cores)])] : cfg.uso === 'civil' ? [el('div', {class:'campo'}, el('span', {class:'rotulo'}, 'Cor da pintura'), cores)] : [
      escolhas('Função da viatura', Object.fromEntries(FUNCOES_DE[cfg.tipo].map(k => [k, FUNCOES_VIATURA[k]])), carro.funcao, 'funcao', k => mudar('funcao', k)),
      escolhas('Giroflex', LUZES_VIATURA, cfg.luz, 'luz', k => mudar('luz', k))]),
    escolhas('Rodas compatíveis', Object.fromEntries(M.rodas.map(r => [r, RODAS[r]])), carro.roda, 'roda', r => { cfg.rodas[cfg.tipo] = r; atualizar(); painel(); }),
    escolhas('Estado', ESTADOS_CARRO, cfg.estado, 'estado', k => mudar('estado', k)),
    ...(duas ? [escolhas('Acessórios', moto ? KITS_MOTO : KITS_BIKE, carro.kit, 'kit', k => { if (k === 'apocalipse' && cfg.ferrugem === '0') cfg.ferrugem = '2'; mudar('kit', k); }), ...(carro.kit === 'apocalipse' ? [chave('Espinhos', 'espinhos')] : [])] :
      [escolhas('Armadura', BLINDAGENS, cfg.blindagem, 'blindagem', blindar), ...(cfg.blindagem === 'nenhuma' ? [] : [chave('Espinhos', 'espinhos')])]),
    escolhas('Ferrugem', FERRUGENS, cfg.ferrugem, 'ferrugem', k => mudar('ferrugem', k)),
    chave(cat === 'bike' ? 'Animar (rodas girando e pedalada)' : 'Animar (rodas girando)', 'animar'),
    ...(cfg.animar ? [escolhas('Velocidade', VELOCIDADES, cfg.velocidade, 'velocidade', k => { cfg.velocidade = k; guardar(); painel(); })] : []),
    ...(cfg.animar && cfg.estado !== 'inteiro' ? [el('p', {class:'nota'}, 'Veículos abandonados e destruídos ficam parados.')] : []),
    ...(duas ? [chave('Virar o guidão', 'aberto'), chave(moto ? 'Piloto' : 'Ciclista', 'motorista'), ...(moto ? [chave('Garupa', 'passageiros'), chave('Capacete', 'capacete')] : [])] :
      [chave(cfg.uso === 'civil' ? 'Abrir portas, capô e traseira' : 'Abrir portas, capô, traseira e compartimento', 'aberto'), chave('Motorista sentado', 'motorista'), chave('Passageiros sentados', 'passageiros')]),
    el('div', {class:'campo'}, el('span', {class:'rotulo'}, duas ? 'Roupa de quem pilota' : 'Roupa de quem vai no carro'), quem),
    el('p', {class:'nota'}, duas ? 'Escudo e tonfa são retirados do piloto. Com alguém em cima ou com a animação ligada, o guidão não vira.' : 'Mochila, escudo e tonfa são retirados de quem está sentado.'),
    el('div', {class:'divisa'}), el('span', {class:'rotulo'}, 'Medidas do padrão'),
    el('div', {class:'campo'}, el('table', {class:'medidas'}, ...medidas.map(([a, b]) => el('tr', {}, el('th', {}, a), el('td', {}, b))))),
    el('div', {class:'divisa'}),
    botao('Baixar GLB (peças separadas)', duas ? 'Rodas, guidão, garfo, quadro e acessórios como objetos separados, com os lugares do banco. Os personagens não vão junto.' : 'Rodas, portas, capô, traseira e partes da base como objetos separados, cada um com seu ponto de giro, e os lugares dos bancos. Os personagens não vão junto.', () => { baixar(nomeArq() + sufixo() + '.glb', gerarGLBCarro(carro, corAtual(), {aberto:aberturaAtual()}), 'model/gltf-binary'); aviso('GLB gerado.'); }, true),
    botao('Baixar só a base (GLB)', duas ? 'Quadro, garfo, guidão e a parte mecânica, sem rodas e sem carenagem.' : 'Chassi ou plataforma, suspensão, motor, escapamento e tanque, sem rodas e sem carroceria.', () => { baixar(nomeArq() + '-base.glb', gerarGLBCarro(carro, corAtual(), {grupos:['base']}), 'model/gltf-binary'); aviso('GLB da base gerado.'); }),
    botao('Baixar imagem PNG', 'Fundo transparente, 2600 × 1800, no ângulo da tela.', () => { baixar(nomeArq() + sufixo() + '.png', imagem(2600, 1800), 'image/png'); aviso('PNG gerado.'); }),
  );
  caixa.scrollTop = rolagem;
}
for (const b of document.querySelectorAll('[data-vista]')) b.addEventListener('click', () => {
  const [giro, elev] = b.dataset.vista.split(',').map(Number);
  enquadrar(); Object.assign(cam, {giro, elev}); if (elev < -1) cam.alvo = .5;
  if (elev < -1 && cfg.mostrar === 'completo'){ cfg.mostrar = 'rodando'; atualizar(); painel(); } else desenhar();
});
atualizar(); enquadrar(); painel(); desenhar();
window.garagem = {cfg:() => cfg, cam, imagem, percorrido:() => percorrido, animacaoLigada:() => !!relogioAnim,
  /* para tirar quadros parados da animação: pausa o relógio e posiciona */
  posicionar:m => { if (relogioAnim){ cancelAnimationFrame(relogioAnim); relogioAnim = 0; } percorrido = m; desenhar(); },
  definir:m => { Object.assign(cfg, {uso:'civil', blindagem:'nenhuma', ferrugem:'0', espinhos:false, kit:'nenhum', capacete:true, animar:false}, m); atualizar(); painel(); }};
})();
