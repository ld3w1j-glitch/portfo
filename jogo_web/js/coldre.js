/* Armas guardadas no corpo, para quando as mãos estão ocupadas (rapel, escalada).
   - arma pequena: presa na cintura (uma de cada lado, no máximo);
   - arma grande COM mochila: nas laterais dela, até duas;
   - arma grande SEM mochila: pendurada nas costas pela bandoleira, só uma.
   O limite de armas grandes conta a que está na mão. Carregado depois de maos.js. */
const Coldre = (() => {
  const PEQUENAS = ['faca_combate', 'machadinha_tatica', 'machadinha', 'estilingue'];
  const tamanho = id => !id || id === 'nenhum' || !ARMAS[id] ? 'nenhuma' : Animacao.classeDaArma(id) === 'curta' || PEQUENAS.includes(id) ? 'pequena' : 'grande';
  const limiteDeGrandes = temMochila => temMochila ? 2 : 1;

  /* o = {mao, cintura, costas} (ids). Devolve onde cada uma fica e o que não coube */
  function arrumar(o, temMochila){
    const itens = [], sobras = [];
    const mao = tamanho(o.mao);
    if (mao !== 'nenhuma') itens.push({id:o.mao, daMao:true, lugar:mao === 'pequena' ? 'cinturaD' : temMochila ? 'ladoD' : 'costas'});
    if (o.cintura && o.cintura !== 'nenhum'){
      if (tamanho(o.cintura) !== 'pequena') sobras.push({id:o.cintura, motivo:'arma grande não vai na cintura'});
      else itens.push({id:o.cintura, lugar:itens.some(i => i.lugar === 'cinturaD') ? 'cinturaE' : 'cinturaD'});
    }
    if (o.costas && o.costas !== 'nenhum'){
      const grandes = itens.filter(i => tamanho(i.id) === 'grande').length;
      if (tamanho(o.costas) !== 'grande') sobras.push({id:o.costas, motivo:'arma pequena vai na cintura'});
      else if (grandes >= limiteDeGrandes(temMochila)) sobras.push({id:o.costas, motivo:temMochila ? 'a mochila leva no máximo duas armas grandes' : 'sem mochila só cabe uma arma grande'});
      else itens.push({id:o.costas, lugar:temMochila ? 'ladoE' : 'costas'});
    }
    return {itens, sobras};
  }

  /* ---------------------------------------------------------------- medidas do corpo */
  /* caixa que envolve uma peça no corpo reto, em metros, a partir da junta dela */
  function envolve(modelo, nome, filtro = () => true){
    const g = Animacao.globais({})[nome], r = [[9, -9], [9, -9], [9, -9]];
    for (const q of modelo.pecas.find(p => p.nome === nome).quads) for (const v of q.v){
      const p = girar(g.q, v); if (!filtro(p)) continue;
      p.forEach((x, i) => { r[i][0] = Math.min(r[i][0], x); r[i][1] = Math.max(r[i][1], x); });
    }
    return r;
  }
  /* comMochila e semMochila = o mesmo personagem, sem arma */
  function medir(modelo, modeloSemMochila, temMochila){
    const torso = envolve(modeloSemMochila, 'torax'), quadril = envolve(modelo, 'quadril');
    const costas = torso[2][0];
    /* a mochila é o que passa para trás das costas */
    const bolsa = temMochila ? envolve(modelo, 'torax', p => p[2] < costas - .02) : null;
    const tem = bolsa && bolsa[0][0] < 8;
    return {
      quadril:{meia:Math.max(-quadril[0][0], quadril[0][1]), z:(quadril[2][0] + quadril[2][1]) / 2},
      torso:{costas, frente:torso[2][1], meia:Math.min(.2, Math.max(-torso[0][0], torso[0][1])), alto:torso[1][1]},
      bolsa:tem ? {meia:Math.max(-bolsa[0][0], bolsa[0][1]), z:(bolsa[2][0] + costas) / 2, fundo:bolsa[2][0], y:(bolsa[1][0] + bolsa[1][1]) / 2} : null,
    };
  }

  /* ---------------------------------------------------------------- o desenho de uma arma guardada */
  const unit = v => { const t = Math.hypot(...v) || 1; return v.map(x => x / t); };
  function caixasDe(id, mods){
    const c = []; comModificacoes(id, mods)((u0, u1, v0, v1, w0, w1, mat) => c.push([Math.min(u0, u1), Math.max(u0, u1), Math.min(v0, v1), Math.max(v0, v1), Math.min(w0, w1), Math.max(w0, w1), mat]));
    return c;
  }
  /* onde fica: peça do corpo, eixos (U = comprimento da arma, V = lado, W = cima da arma) e o ponto do meio */
  function encaixe(lugar, M, ext){
    const k = ESCALA, grosso = Math.max(-ext.v0, ext.v1) * k, lado = lugar.endsWith('E') ? 1 : -1;
    if (lugar.startsWith('cintura')){
      /* de cano para baixo, cabo para trás, encostada na coxa */
      return {peca:'quadril', U:[0, -1, 0], V:[1, 0, 0], W:[0, 0, 1], ref:[1.4, 0, .4], pos:[lado * (M.quadril.meia + grosso * .75 + .012), -.03, M.quadril.z + .01]};
    }
    const meio = [(ext.u0 + ext.u1) / 2, 0, (ext.w0 + ext.w1) / 2];
    if (lugar.startsWith('lado')){
      /* em pé na lateral da mochila, cano para cima */
      const b = M.bolsa || {meia:M.torso.meia, z:M.torso.costas - .08, y:.2};
      return {peca:'torax', U:unit([lado * .09, 1, 0]), V:[1, 0, 0], W:[0, 0, -1], ref:meio, pos:[lado * (b.meia + grosso * .8 + .012), b.y + .04, b.z - .03]};
    }
    /* atravessada nas costas, deitada contra o corpo */
    const a = .62;
    return {peca:'torax', U:[Math.sin(a), Math.cos(a), 0], V:[0, 0, -1], W:[-Math.cos(a), Math.sin(a), 0], ref:meio, pos:[0, .17, M.torso.costas - grosso - .015]};
  }
  const FACES = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]];
  function malhaDeCaixas(peca, caixas, ponto, normal){
    const pos = [], nor = [], cor = [];
    for (const c of caixas){
      const lim = [[c[0], c[1]], [c[2], c[3]], [c[4], c[5]]], cr = rgb(c[7] || ARMA_CORES[c[6]] || '#555555').map(x => x / 255);
      for (const [eixo, ponta] of FACES){
        const [a, b] = [0, 1, 2].filter(i => i !== eixo);
        const canto = (i, j) => { const p = [0, 0, 0]; p[eixo] = lim[eixo][ponta]; p[a] = lim[a][i]; p[b] = lim[b][j]; return ponto(p); };
        const q = [canto(0, 0), canto(1, 0), canto(1, 1), canto(0, 1)], n = normal(eixo, ponta ? 1 : -1);
        for (const i of [0, 1, 2, 0, 2, 3]){ pos.push(...q[i]); nor.push(...n); cor.push(...cr); }
      }
    }
    return {peca, pos:Float32Array.from(pos), nor:Float32Array.from(nor), cor:Float32Array.from(cor)};
  }
  function malhaDaArma(id, mods, lugar, M){
    const cx = caixasDe(id, mods);
    const ext = {u0:Math.min(...cx.map(c => c[0])), u1:Math.max(...cx.map(c => c[1])), v0:Math.min(...cx.map(c => c[2])), v1:Math.max(...cx.map(c => c[3])), w0:Math.min(...cx.map(c => c[4])), w1:Math.max(...cx.map(c => c[5]))};
    ext.v0 = Math.max(ext.v0, -1.5); ext.v1 = Math.min(ext.v1, 1.5);           /* lâminas largas não afastam a arma do corpo */
    const E = encaixe(lugar, M, ext), k = ESCALA, eixos = [E.U, E.V, E.W];
    const ponto = p => [0, 1, 2].map(i => E.pos[i] + (E.U[i] * (p[0] - E.ref[0]) + E.V[i] * (p[1] - E.ref[1]) + E.W[i] * (p[2] - E.ref[2])) * k);
    return malhaDeCaixas(E.peca, cx, ponto, (eixo, s) => eixos[eixo].map(v => v * s));
  }
  /* a bandoleira que atravessa o peito de quem leva a arma nas costas sem mochila, e a correia do coldre */
  function correias(itens, M){
    const grupos = [], reto = (peca, caixas) => grupos.push(malhaDeCaixas(peca, caixas, p => p, (e, s) => [0, 1, 2].map(i => i === e ? s : 0)));
    if (itens.some(i => i.lugar === 'costas')){
      const tiras = [];
      for (let i = 0; i < 16; i++){
        const t = i / 15, x = -M.torso.meia * .85 + M.torso.meia * 1.65 * t, y = -.02 + (M.torso.alto * .82) * t;
        tiras.push([x - .022, x + .022, y - .022, y + .022, M.torso.frente + .002, M.torso.frente + .016, '', '#3a3328']);
      }
      reto('torax', tiras);
    }
    for (const i of itens) if (i.lugar.startsWith('cintura')){
      const s = i.lugar.endsWith('E') ? 1 : -1, x = s * (M.quadril.meia + .006);
      reto('quadril', [[Math.min(x, x + s * .018), Math.max(x, x + s * .018), -.06, .04, M.quadril.z - .06, M.quadril.z + .07, '', '#2e2a22']]);
    }
    return grupos;
  }
  /* monta as armas guardadas de uma vez. mods = peças de cada arma */
  function montarGuardadas(itens, M, mods = {}){
    return {grupos:itens.map(i => ({...malhaDaArma(i.id, mods[i.id], i.lugar, M), item:i})), correias:correias(itens, M), medidas:M, itens};
  }

  /* o ponto do corpo aonde a mão vai para guardar ou pegar a arma (nas coordenadas do corpo, a partir do quadril) */
  function alvoDaMao(lugar, M, rot){
    const g = Animacao.esqueleto(rot);
    const [peca, p] = lugar.startsWith('cintura') ? ['quadril', [(lugar.endsWith('E') ? 1 : -1) * (M.quadril.meia + .05), .03, M.quadril.z + .04]]
      : ['torax', [-M.torso.meia - .05, M.torso.alto * .98, lugar === 'costas' ? M.torso.costas - .03 : (M.bolsa ? M.bolsa.z : M.torso.costas - .05)]];
    const w = girar(g.G[peca], p);
    return [g.pos[peca][0] + w[0], g.pos[peca][1] + w[1], g.pos[peca][2] + w[2]];
  }

  /* junta o personagem e as armas guardadas num desenho só. fora = quais itens não aparecem (estão na mão) */
  let junto = {total:0, pos:new Float32Array(0), nor:new Float32Array(0), cor:new Float32Array(0)};
  function juntar(animador, guardadas, rot, naMao){
    const partes = guardadas.grupos.filter(g => !(naMao && g.item.daMao)).concat(guardadas.correias);
    if (!partes.length) return animador;
    const total = animador.total + partes.reduce((s, p) => s + p.pos.length / 3, 0);
    if (junto.total !== total) junto = {total, pos:new Float32Array(total * 3), nor:new Float32Array(total * 3), cor:new Float32Array(total * 3)};
    junto.pos.set(animador.pos); junto.nor.set(animador.nor); junto.cor.set(animador.cor);
    const esq = Animacao.esqueleto(rot); let o = animador.total * 3;
    for (const p of partes){
      const q = esq.G[p.peca], t = esq.pos[p.peca], [x, y, z, w] = q;
      const m = [1 - 2*(y*y + z*z), 2*(x*y - z*w), 2*(x*z + y*w), 2*(x*y + z*w), 1 - 2*(x*x + z*z), 2*(y*z - x*w), 2*(x*z - y*w), 2*(y*z + x*w), 1 - 2*(x*x + y*y)];
      for (let i = 0; i < p.pos.length; i += 3, o += 3){
        const a = p.pos[i], b = p.pos[i + 1], c = p.pos[i + 2], d = p.nor[i], e = p.nor[i + 1], f = p.nor[i + 2];
        junto.pos[o] = m[0]*a + m[1]*b + m[2]*c + t[0]; junto.pos[o + 1] = m[3]*a + m[4]*b + m[5]*c + t[1]; junto.pos[o + 2] = m[6]*a + m[7]*b + m[8]*c + t[2];
        junto.nor[o] = m[0]*d + m[1]*e + m[2]*f; junto.nor[o + 1] = m[3]*d + m[4]*e + m[5]*f; junto.nor[o + 2] = m[6]*d + m[7]*e + m[8]*f;
        junto.cor[o] = p.cor[i]; junto.cor[o + 1] = p.cor[i + 1]; junto.cor[o + 2] = p.cor[i + 2];
      }
    }
    return junto;
  }

  return {tamanho, limiteDeGrandes, arrumar, medir, montarGuardadas, alvoDaMao, juntar, envolve, malhaDeCaixas};
})();
