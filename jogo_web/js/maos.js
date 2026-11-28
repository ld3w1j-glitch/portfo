/* Mãos que se fecham na arma. Sem arma, a mão original do personagem não muda.
   Cada mão é desenhada no mesmo sistema da arma (u = ao longo, v = lado, w = para cima), então encaixa no cabo.
   Carregado depois de animacao.js.
   - mão direita: troca a mão do personagem sempre que há arma;
   - mão esquerda: tem uma segunda forma ("apoio"), usada só nas poses em que ela segura a arma. */
const Maos = (() => {
  const guardadas = {};                                     /* medidas de cada arma, calculadas uma vez */

  /* ponto da arma -> coordenadas de blocos da mão direita (o mesmo cálculo de armaNaMao) */
  function gradeDireita(id){
    const A = ARMAS[id], [x, y, z] = Animacao.origemDaArma(id);
    return A.vertical ? (u, v, w) => [x + v, y - w, z + u] : (u, v, w) => [x + v, y - u, z + w];
  }
  /* de ponto da arma para o espaço do corpo reto (x = lado esquerdo, y = cima, z = frente), sem a origem */
  const retoDaArma = id => ARMAS[id].vertical ? (u, v, w) => [v, u, w] : (u, v, w) => [v, w, u];

  function medidas(id){
    if (guardadas[id]) return guardadas[id];
    const caixas = []; ARMAS[id].desenhar((a, b, c, d, e, f) => caixas.push([Math.min(a, b), Math.max(a, b), Math.min(c, d), Math.max(c, d), Math.min(e, f), Math.max(e, f)]));
    const classe = Animacao.classeDaArma(id), A = ARMAS[id];
    const comGatilho = classe === 'longa' || classe === 'curta';
    /* caixas que passam pelo meio da arma num ponto u */
    const em = u => caixas.filter(c => c[0] <= u && c[1] >= u && c[2] < 0 && c[3] > 0);
    /* grossura do cabo onde a mão direita segura */
    let raio = .62;
    if (!comGatilho){
      const ali = [-1.2, 0, 1.2].flatMap(em).filter(c => Math.abs(c[4] + c[5]) < .7);
      if (ali.length){ const r = ali.map(c => Math.max(c[3], c[5])).sort((a, b) => a - b); raio = Math.max(.42, Math.min(1.05, r[Math.floor(r.length * .6)])); }
    }
    /* onde a mão de apoio vai nas armas compridas: por baixo do cano ou da telha */
    let apoio = null;
    if (classe === 'longa'){
      const u = {metralhadora:11.2, fuzil_madeira:10, escopeta:10, besta_improvisada:8.2}[id] || 9.4;
      const ali = em(u).filter(c => c[5] > 0);
      apoio = {u, baixo:ali.length ? Math.max(-.2, Math.min(...ali.map(c => c[4]))) : 1.4, v:ali.length ? Math.max(.45, Math.min(1.15, Math.max(...ali.map(c => c[3])))) : .8};
    }
    return (guardadas[id] = {classe, comGatilho, raio, apoio, vertical:!!A.vertical});
  }

  /* cores: luva quando o personagem usa luvas; senão, pele */
  const cores = c => c.luvas.estilo !== 'nenhum' ? {a:'luva', b:'luva_sombra', c:'luva_escuro', v:'luva_escuro'} : {a:'pele', b:'pele_sombra', c:'pele_sombra', v:'pele_vinco'};

  /* punho fechado em volta de um cabo. g(ao longo, lado, altura) -> ponto da arma; r = raio do cabo */
  function fechada(p, g, r, K, polegarFrente = true){
    const caixa = (s0, s1, v0, v1, w0, w1, mat) => { const a = g(s0, v0, w0), b = g(s1, v1, w1); p(a[0], b[0], a[1], b[1], a[2], b[2], mat); };
    const e = r + .04;
    for (let i = 0; i < 4; i++){                                       /* quatro dedos, um ao lado do outro */
      const s = -1.9 + i * .96, mat = i % 2 ? K.b : K.a, f = i === 3 ? .12 : 0;
      caixa(s, s + .78, -e - .35 + f, e + .5 - f, -e - .62 + f, -e, mat);        /* por baixo */
      caixa(s, s + .78, e, e + .55 - f, -e, e * .45, mat);                        /* sobe do outro lado */
      caixa(s + .08, s + .7, e - .12, e + .42 - f, e * .45, e * .45 + .45, K.c);  /* ponta do dedo */
      if (i < 3){ caixa(s + .78, s + .96, -e - .3, e + .3, -e - .4, -e, K.v); caixa(s + .78, s + .96, e, e + .34, -e, e * .35, K.v); }   /* vinco entre os dedos */
    }
    caixa(-1.95, 1.9, -e - .85, -e, -e - .45, e + .15, K.a);          /* palma, do lado de fora */
    caixa(-1.95, 1.9, -e - .7, e * .35, e, e + .6, K.a);              /* costas da mão por cima */
    for (let i = 0; i < 4; i++) caixa(-1.78 + i * .96, -1.2 + i * .96, -e - .98, -e - .85, -.1, e + .05, K.b);      /* nós dos dedos */
    if (polegarFrente){ caixa(-.5, 1.3, e * .2, e + .5, e * .55, e + .75, K.a); caixa(1.3, 2.35, e * .15, e + .25, e * .55, e + .5, K.b); }
    else caixa(-.7, 1.1, e - .1, e + .58, e * .5, e + .6, K.a);
  }

  /* mão direita no punho inclinado das armas de fogo e bestas, com o indicador no gatilho */
  function noPunho(p, K){
    const g = .72, cu = w => -.1 - Math.max(0, 1.1 - w) * .38;       /* o punho inclina para trás ao descer */
    for (let i = 0; i < 3; i++){                                      /* médio, anelar e mínimo abraçam a frente do punho */
      const alto = -.05 - i * .82, baixo = alto - .72, c = cu((alto + baixo) / 2), mat = i % 2 ? K.b : K.a;
      p(c + 1.0, c + 1.55, -g - .45, g + .4, baixo, alto, mat);        /* frente */
      p(c + .1, c + 1.05, g, g + .42, baixo, alto, K.c);               /* ponta, do outro lado */
      p(c + 1.02, c + 1.5, -g - .38, g + .32, baixo - .1, baixo, K.v); /* vinco */
    }
    for (const [w0, w1] of [[-2.35, -1.2], [-1.2, -.05], [-.05, .9]]){      /* a palma, do lado de fora, acompanha o punho */
      const c = cu((w0 + w1) / 2);
      p(c - 1.35, c + 1.05, -g - .72, -g, w0, w1, K.a);
    }
    p(cu(-.4) - 1.55, cu(-.4) - 1.02, -g - .5, g + .3, -1.3, .75, K.b);   /* a curva entre o polegar e o indicador, atrás do punho */
    p(.55, 2.35, -g - .42, -g + .02, .2, .78, K.a);                        /* indicador ao lado do gatilho */
    p(1.95, 2.5, -g, -.1, .2, .68, K.c);                                   /* ponta no gatilho */
    p(-1.25, .75, g, g + .42, .38, .95, K.b);                              /* polegar deitado do outro lado */
  }

  /* mão esquerda por baixo do cano das armas compridas */
  function porBaixo(p, a, K){
    const {u, baixo:z, v} = a;
    p(u - 1.7, u + 1.5, -v - .2, v + .55, z - 1.05, z, K.a);                            /* palma de apoio */
    for (let i = 0; i < 4; i++){                                                         /* dedos sobem pelo lado de fora */
      const s = u - 1.62 + i * .8, mat = i % 2 ? K.b : K.a;
      p(s, s + .62, -v - .66, -v, z - .55, z + 1.15, mat);
      p(s + .06, s + .56, -v - .52, -v + .08, z + 1.15, z + 1.55, K.c);
      if (i < 3) p(s + .62, s + .8, -v - .46, -v, z - .55, z + 1.05, K.v);
    }
    p(u - 1.35, u + .45, v, v + .66, z - .55, z + 1.05, K.a); p(u + .35, u + 1.35, v - .02, v + .5, z + .35, z + 1.25, K.b);   /* polegar */
  }

  /* mão esquerda envolvendo a direita, nas armas curtas */
  function emConcha(p, K){
    const c = -.75;
    p(c - .9, c + 1.55, -1.0, 1.5, -3.15, -2.45, K.a);                                     /* por baixo do punho */
    for (let i = 0; i < 3; i++){ const alto = -.2 - i * .8; p(c + 1.45, c + 1.95, -1.3, 1.05, alto - .7, alto, i % 2 ? K.b : K.a); p(c + 1.45, c + 1.9, -1.25, 1.0, alto - .8, alto - .7, K.v); }
    p(c - .8, c + 1.5, 1.12, 1.72, -2.6, .2, K.a); p(c + .1, c + 1.7, 1.1, 1.55, .2, .8, K.b);     /* palma e polegar do lado esquerdo */
  }

  /* o caminho do pulso (a junta) até a mão: uma sequência curta de blocos, para o braço não ficar solto */
  function punhoDeLigacao(caixaGrade, junta, alvo, K){
    const n = 5;
    for (let i = 0; i <= n; i++){
      const t = i / n, c = junta.map((v, k) => v + (alvo[k] - v) * t), r = 1.08 - .28 * t;
      caixaGrade(c[0] - r, c[0] + r, c[1] - r, c[1] + r, c[2] - r * .85, c[2] + r * .85, i === 0 ? K.b : K.a);
    }
  }
  /* onde fica a junta de uma mão, em coordenadas de blocos */
  function juntaDa(nome){
    const g = ESTRUTURA[nome], zs = g.vox.map(v => v[2]), k = Math.max(...zs), topo = g.vox.filter(v => v[2] === k);
    return [0, 1].map(d => topo.reduce((s, v) => s + v[d], 0) / topo.length + .5).concat(k + 1);
  }

  /* que formas de apoio a arma usa. A junta esquerda é pensada em coordenadas da arma: [u, v, w] */
  function formaDeApoio(id, pose, mods){
    const M = medidas(id);
    if (M.classe === 'longa' && (pose === 'mirando' || pose === 'guarda')){
      if (mods?.baixo === 'punho_frontal' && typeof modServe === 'function' && modServe(id, 'baixo', 'punho_frontal')){
        const [bu, bw] = ENCAIXES[id].baixo;
        return {tipo:'vertical', u:bu, w:bw - 2.2, junta:[bu - 2.2, 2.3, bw - 3]};
      }
      let a = M.apoio;
      if (mods?.baixo && mods.baixo !== 'nenhum' && typeof modServe === 'function' && modServe(id, 'baixo', mods.baixo)) a = {...a, u:Math.min(a.u, ENCAIXES[id].baixo[0] - 3.4)};
      return {tipo:'baixo', ...a, junta:[a.u - 2.4, a.v + 1.5, a.baixo - 1.7]};
    }
    if (M.classe === 'curta' && pose === 'mirando') return {tipo:'concha', junta:[-2.5, 2.4, -3.6]};
    if (M.classe === 'haste' && pose === 'mirando') return {tipo:'haste', u:9, junta:[8.4, 2.4, -1.2]};
    return null;
  }

  /* desenha as mãos do modelo. cx(peça, x0, x1, y0, y1, z0, z1, material) */
  function aplicar(c, cx, pecas){
    if (!armado(c)) return;
    const id = c.arma.estilo, A = ARMAS[id], M = medidas(id), K = cores(c), grade = gradeDireita(id);
    const naArma = (peca, mapa) => (u0, u1, v0, v1, w0, w1, mat) => {
      const a = mapa(u0, v0, w0), b = mapa(u1, v1, w1);
      cx(peca, Math.min(a[0], b[0]), Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.max(a[2], b[2]), mat);
    };
    /* direita: tira a mão antiga (e o que a luva punha nela), redesenha a arma e fecha a mão em volta */
    pecas.mao_d.quads.length = 0;
    armaNaMao(id, cx, typeof comModificacoes === 'function' ? comModificacoes(id, c.modarma) : null);
    const p = naArma('mao_d', grade);
    let centro;
    if (M.comGatilho){ noPunho(p, K); centro = grade(-1.5, -.75, 0); }
    else if (id === 'estilingue'){ fechada(p, (s, v, w) => [2.9 + w, v, s - .6], .72, K, false); centro = grade(2.9, -1.5, -.6); }
    else if (M.vertical){ fechada(p, (s, v, w) => [s, v, w], M.raio, K, false); centro = grade(-.2, -M.raio - .6, .4); }
    else { fechada(p, (s, v, w) => [s, v, w], M.raio, K, true); centro = grade(-1.2, -M.raio - .4, M.raio + .2); }
    punhoDeLigacao((x0, x1, y0, y1, z0, z1, mat) => cx('mao_d', x0, x1, y0, y1, z0, z1, mat), juntaDa('mao_d'), centro, K);

    /* esquerda: uma forma de apoio para cada situação; a mão solta continua a original */
    const original = pecas.mao_e.quads.slice();
    pecas.mao_e.apoios = {};
    const jg = juntaDa('mao_e');
    for (const pose of ['guarda', 'mirando']){
      const f = formaDeApoio(id, pose, c.modarma); if (!f) continue;
      pecas.mao_e.quads.length = 0;
      const [ju, jv, jw] = f.junta, vert = A.vertical;
      /* o mesmo ponto da arma visto pela mão esquerda: a junta dela fica em "f.junta" */
      const gradeE = vert ? (u, v, w) => [jg[0] + v - jv, jg[1] - (w - jw), jg[2] + u - ju] : (u, v, w) => [jg[0] + v - jv, jg[1] - (u - ju), jg[2] + w - jw];
      const q = naArma('mao_e', gradeE);
      let alvo;
      if (f.tipo === 'baixo'){ porBaixo(q, f, K); alvo = gradeE(f.u - 1.2, f.v + .1, f.baixo - .75); }
      else if (f.tipo === 'concha'){ emConcha(q, K); alvo = gradeE(-1.4, 1.5, -3); }
      else if (f.tipo === 'vertical'){ fechada((a, b, d, e, g, h, m) => q(a, b, d, e, g, h, m), (s, v, w) => [f.u + w, -v, f.w + s * .8], .55, K, false); alvo = gradeE(f.u - .9, 1.3, f.w - .4); }
      else { fechada(q, (s, v, w) => [f.u + s, -v, w], .62, K, false); alvo = gradeE(f.u - 1.2, 1.3, 0); }
      punhoDeLigacao((x0, x1, y0, y1, z0, z1, mat) => cx('mao_e', x0, x1, y0, y1, z0, z1, mat), jg, alvo, K);
      pecas.mao_e.apoios[pose] = {forma:f, quads:pecas.mao_e.quads.slice()};
    }
    pecas.mao_e.quads.length = 0; pecas.mao_e.quads.push(...original);
  }

  /* nome da pose do corpo reto -> qual forma da mão esquerda usar */
  const tipoDaPose = nome => nome === 'mirando' ? 'mirando' : (nome === 'descanso' || nome === 'andando' ? 'guarda' : null);
  const quadsDaPeca = (peca, nomePose) => peca.apoios?.[tipoDaPose(nomePose)]?.quads || peca.quads;

  return {aplicar, medidas, formaDeApoio, quadsDaPeca, retoDaArma};
})();
