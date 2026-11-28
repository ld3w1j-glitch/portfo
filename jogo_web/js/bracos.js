/* Mãos e braços detalhados em blocos (o mesmo estilo do personagem), só para a primeira pessoa (em terceira pessoa o personagem não muda).
   A mão é calculada em volta do que ela segura: cada dedo tem três ossos e dá a volta no cabo.
   Primeiro se descreve a forma (os "ossos" com sua grossura); depois cada osso vira um bloco com textura de quadradinhos.
   Também aqui: arco, flecha e estilingue feitos para serem vistos de perto.
   Medidas em metros. Carregado depois de miras.js. */
const Bracos = (() => {
  const mais = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], tira = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const vez = (a, k) => [a[0] * k, a[1] * k, a[2] * k], escalar = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  const cruz = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
  const unit = a => vez(a, 1 / (Math.hypot(...a) || 1));
  const soma = (...v) => v.reduce(mais, [0, 0, 0]);
  const meio = (a, b, t = .5) => a.map((v, i) => v + (b[i] - v) * t);
  const aoLado = (v, eixo) => unit(tira(v, vez(eixo, escalar(v, eixo))));        /* parte de v perpendicular ao eixo */
  const tom = (h, k) => '#' + [1, 3, 5].map(i => Math.max(0, Math.min(255, Math.round(parseInt(h.slice(i, i + 2), 16) * k))).toString(16).padStart(2, '0')).join('');

  /* ---------------------------------------------------------------- a forma: trechos de seção quadrada
     pontos: lista; raios: [largura, espessura] por ponto; largo: para onde aponta a largura; cor(i) por trecho */
  function tubo(massa, pontos, raios, largo, cor){
    const n = pontos.length, R = i => Array.isArray(raios[i]) ? raios[i] : [raios[i], raios[i]];
    for (let i = 0; i + 1 < n; i++){
      const a = pontos[i], b = pontos[i + 1], t = tira(b, a), comp = Math.hypot(...t); if (comp < 1e-6) continue;
      const d = vez(t, 1 / comp);
      let e1 = tira(largo, vez(d, escalar(largo, d))); if (Math.hypot(...e1) < 1e-4) e1 = aoLado([.3, .9, .2], d); else e1 = unit(e1);
      massa.push({a, d, comp, e1, e2:cruz(d, e1), ra:R(i), rb:R(i + 1), cor:typeof cor === 'function' ? cor(i) : cor, ini:i === 0, fim:i === n - 2});
    }
  }
  /* chapa fina de quatro cantos (unhas, penas, couro): vira uma camada de cubinhos */
  function placa(massa, a, b, c, d, cor){
    const m1 = vez(mais(a, d), .5), m2 = vez(mais(b, c), .5), meia1 = Math.hypot(...tira(d, a)) / 2, meia2 = Math.hypot(...tira(c, b)) / 2;
    const eixo = tira(m2, m1); if (Math.hypot(...eixo) < 1e-6) return;
    tubo(massa, [m1, m2], [[meia1, .0018], [meia2, .0018]], meia1 > 1e-4 ? tira(d, a) : tira(c, b), cor);
  }

  /* cada trecho vira um ou mais blocos de cantos retos, que giram junto com o osso (como as peças do personagem).
     As faces são divididas em quadradinhos de três tons, a mesma textura do resto do jogo. */
  function voxelizar(massa, estilo){
    const {pixel, passo} = estilo, q = [], tons = new Map();
    const tomDe = (cor, h) => { const k = h % 11 === 0 ? .94 : h % 7 === 0 ? 1.04 : 1; if (k === 1) return cor; const ch = cor + k; return tons.get(ch) || tons.set(ch, tom(cor, k)).get(ch); };
    const emBloco = v => Math.max(pixel * .5, Math.round(v / (pixel * .25)) * pixel * .25);          /* as medidas andam em degraus */
    massa.forEach((s, ns) => {
      const pedacos = Math.max(1, Math.ceil(s.comp / passo));
      for (let p = 0; p < pedacos; p++){
        /* cada bloco tem um tamanho um tiquinho diferente: duas faces nunca ficam no mesmo lugar (era o que fazia a textura tremer) */
        const folga = (ns * 7 + p * 3) % 13 * .000085;
        const u = (p + .5) / pedacos, hx = emBloco((s.ra[0] + (s.rb[0] - s.ra[0]) * u) * .96) + folga, hy = emBloco((s.ra[1] + (s.rb[1] - s.ra[1]) * u) * .96) + folga * 1.31;
        /* um pouquinho a mais nas emendas, para não abrir fresta quando o osso dobra */
        const de = s.comp * p / pedacos - (p === 0 ? (s.ini ? pixel * .3 : Math.min(hx, hy) * .45) + folga * 1.7 : 0);
        const ate = s.comp * (p + 1) / pedacos + (p === pedacos - 1 ? (s.fim ? pixel * .3 : Math.min(hx, hy) * .45) + folga * 2.1 : 0);
        const ponto = (x, y, w) => soma(s.a, vez(s.e1, x), vez(s.e2, y), vez(s.d, w));
        /* seis faces: [canto inicial, lado U, lado V, normal] em coordenadas do bloco */
        const faces = [
          [[-hx, hy, de], [2 * hx, 0, 0], [0, 0, ate - de], s.e2], [[hx, -hy, de], [-2 * hx, 0, 0], [0, 0, ate - de], vez(s.e2, -1)],
          [[hx, hy, de], [0, -2 * hy, 0], [0, 0, ate - de], s.e1], [[-hx, -hy, de], [0, 2 * hy, 0], [0, 0, ate - de], vez(s.e1, -1)],
          [[-hx, -hy, ate], [2 * hx, 0, 0], [0, 2 * hy, 0], s.d], [[-hx, -hy, de], [0, 2 * hy, 0], [2 * hx, 0, 0], vez(s.d, -1)]];
        faces.forEach(([o, U, V, n], nf) => {
          const nu = Math.max(1, Math.round(Math.hypot(...U) / pixel)), nv = Math.max(1, Math.round(Math.hypot(...V) / pixel));
          const em = (i, j) => ponto(o[0] + U[0] * i / nu + V[0] * j / nv, o[1] + U[1] * i / nu + V[1] * j / nv, o[2] + U[2] * i / nu + V[2] * j / nv);
          for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++){
            const h = (Math.imul(ns * 31 + p + 7, 73856093) ^ Math.imul(nf * 53 + i + 3, 19349663) ^ Math.imul(j + 11, 83492791)) >>> 0;
            q.push({v:[em(i, j), em(i + 1, j), em(i + 1, j + 1), em(i, j + 1)], n, cor:tomDe(s.cor, h)});
          }
        });
      }
    });
    return q;
  }
  const PASSO = {mao:{pixel:.0145, passo:.06}, braco:{pixel:.0215, passo:.1}, arco:{pixel:.016, passo:.06}, flecha:{pixel:.012, passo:.2}};

  /* ---------------------------------------------------------------- as cores do personagem */
  function cores(boneco){
    const pal = paleta(boneco), pele = pal.pele, luva = boneco.luvas.estilo !== 'nenhum' ? pal.luva : null;
    const semArma = structuredClone(boneco); semArma.arma = {...semArma.arma, estilo:'nenhum'};
    const m = montar(semArma), rgbDe = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const alvo = rgbDe(pele), dePele = h => Math.hypot(...tira(rgbDe(h), alvo)) < 46;
    const medir = nome => {
      const lista = m.pecas.find(p => p.nome === nome).quads, pano = lista.filter(f => !dePele(f.cor));
      if (pano.length < lista.length * .45) return null;                           /* quase só pele: braço à mostra */
      /* a cor do pano é a do tom mais comum (não a média, que mistura estampas) */
      const grupos = new Map();
      for (const f of pano){ const c = rgbDe(f.cor), k = c.map(v => v >> 5).join(); const g = grupos.get(k) || {n:0, s:[0, 0, 0]}; g.n++; g.s = mais(g.s, c); grupos.set(k, g); }
      const g = [...grupos.values()].sort((a, b) => b.n - a.n)[0];
      return '#' + g.s.map(v => Math.round(v / g.n).toString(16).padStart(2, '0')).join('');
    };
    const antebraco = medir('antebraco_d'), ombro = medir('braco_d');
    return {pele, luva, unha:tom(pele, 1.13), vinco:tom(pele, .8), manga:antebraco, mangaAlta:ombro || antebraco};
  }

  /* ---------------------------------------------------------------- a mão */
  const DEDOS = [{s:.0295, r:.0087, ossos:[.04, .025, .021]}, {s:.0097, r:.009, ossos:[.044, .028, .022]}, {s:-.0099, r:.0086, ossos:[.041, .026, .021]}, {s:-.029, r:.0078, ossos:[.032, .021, .019]}];
  function pintura(C){
    return C.luva ? {dedo:C.luva, junta:tom(C.luva, .78), palma:C.luva, unha:null, vinco:tom(C.luva, .66)}
                  : {dedo:C.pele, junta:tom(C.pele, .91), palma:C.pele, unha:C.unha, vinco:C.vinco};
  }
  /* um dedo em dois blocos: do nó até o meio, e a ponta que dobra */
  function dedo(q, P, r, tinta, fora, alterna){
    const cor = alterna ? tom(tinta.dedo, .86) : tinta.dedo;
    const largo = unit(cruz(tira(P[1], P[0]), fora)), eixoLargo = Math.hypot(...largo) > .5 ? largo : [1, 0, 0];
    tubo(q, [P[0], P[1]], [[r * 1.06, r * 1.06], [r * 1.06, r * 1.06]], eixoLargo, cor);
    tubo(q, [P[1], P[3]], [[r * .96, r * .96], [r * .96, r * .96]], eixoLargo, cor);
  }
  /* palma: um bloco do pulso até os nós, e a base do polegar */
  function palma(q, pulso, nos, baseDedao, tinta, largo, dorso){
    const centroNos = vez(nos.reduce(mais, [0, 0, 0]), 1 / nos.length);
    tubo(q, [pulso, meio(pulso, centroNos, .93)], [[.033, .018], [.037, .016]], largo, tinta.palma);
    if (baseDedao) tubo(q, [mais(pulso, vez(largo, .012)), baseDedao], [[.016, .014], [.016, .014]], dorso, tinta.palma);
  }
  /* o polegar, por quatro pontos */
  const dedao = (q, P, tinta, fora) => dedo(q, P, .0128, tinta, fora);

  /* mão fechada em volta de um cabo oval.
     C = centro do cabo na altura do dedo do meio; a = ao longo do cabo (do mindinho para o polegar);
     n = para o lado do dorso da mão; f = para onde os dedos começam a dar a volta; rn/rf = raios do cabo.
     A direção de n, f e a decide se é a mão direita ou a esquerda. */
  function segurando(Cor, {C, a, n, f, rn, rf, indicador, polegar, pulso, volta = 4.5, aberta = 1}){
    const q = [], tinta = pintura(Cor);
    a = unit(a); n = aoLado(n, a); f = aoLado(tira(f, vez(n, escalar(f, n))), a);
    const P = (s, th, fora) => soma(C, vez(a, s), vez(n, Math.cos(th) * (rn + fora)), vez(f, Math.sin(th) * (rf + fora)));
    const nos = [];
    DEDOS.forEach((d, i) => {
      const ra = (rn + rf) / 2 + d.r; let th = .16 + (i === 3 ? .06 : 0);
      const pts = [P(d.s, th, d.r + .0045)];
      d.ossos.forEach((L, k) => { th = Math.min(volta, th + L / (ra * aberta)); pts.push(P(d.s * (1 - k * .045), th, d.r + (k === 2 ? -.001 : 0))); });
      const caminho = i === 0 && indicador ? [pts[0], ...indicador] : pts;
      nos.push(caminho[0]);
      const centroDoOsso = mais(C, vez(a, escalar(tira(caminho[2], C), a)));
      dedo(q, caminho, d.r, tinta, i === 0 && indicador ? n : unit(tira(caminho[2], centroDoOsso)), i % 2);
    });
    const W = pulso || soma(vez(vez(nos.reduce(mais, [0, 0, 0]), 1 / 4), 1), vez(f, -.082), vez(n, .004), vez(a, -.012));
    const polegarP = polegar || [P(.022, -1.0, .019), P(.034, -1.72, .0145), P(.04, -2.35, .012), P(.04, -2.85, .0105)];
    const base = polegarP[0];
    palma(q, W, nos, base, tinta, a, n);
    dedao(q, polegarP, tinta, aoLado(tira(polegarP[2], C), a));
    const centroNos = vez(nos.reduce(mais, [0, 0, 0]), 1 / 4);
    return {quads:voxelizar(q, PASSO.mao), pulso:W, largura:a, rumo:unit(tira(centroNos, W))};
  }

  /* mão montada ponto a ponto (puxar a corda, pinçar o couro) */
  function livre(Cor, {dedos, polegar, pulso, largura, dorso}){
    const q = [], tinta = pintura(Cor);
    dedos.forEach((p, i) => dedo(q, p, DEDOS[i].r, tinta, dorso, i % 2));
    const nos = dedos.map(p => p[0]);
    palma(q, pulso, nos, polegar[0], tinta, unit(largura), unit(dorso));
    dedao(q, polegar, tinta, dorso);
    return {quads:voxelizar(q, PASSO.mao), pulso, largura:unit(largura), rumo:unit(tira(vez(nos.reduce(mais, [0, 0, 0]), 1 / 4), pulso))};
  }

  /* ---------------------------------------------------------------- o braço: sai do pulso (origem) ao longo de +Z; a largura é o X */
  function braco(Cor){
    const q = [], X = [1, 0, 0];
    const bloco = (z0, z1, x, y, cor) => tubo(q, [[0, 0, z0], [0, 0, z1]], [[x, y], [x, y]], X, cor);
    if (Cor.manga){
      bloco(0, .05, .027, .021, Cor.pele);
      bloco(.05, .075, .037, .031, tom(Cor.manga, .76));                        /* o punho da manga */
      bloco(.075, .18, .042, .037, Cor.manga); bloco(.18, .29, .048, .043, Cor.manga); bloco(.29, .6, .052, .049, Cor.mangaAlta);
    } else {
      bloco(0, .07, .027, .021, Cor.pele); bloco(.07, .16, .036, .031, Cor.pele); bloco(.16, .29, .043, .039, Cor.pele);
      bloco(.29, .6, .05, .047, Cor.mangaAlta || Cor.pele);
    }
    if (Cor.luva) bloco(-.006, .036, .031, .024, tom(Cor.luva, .8));
    return voxelizar(q, PASSO.braco);
  }

  /* ---------------------------------------------------------------- arco, flecha e estilingue
     Sistema do arco/estilingue: Y para cima, Z para a frente, X para a esquerda; origem no lugar da mão. */
  const MADEIRA = '#7B5530', MADEIRA2 = '#94683C', FIBRA = '#C9B58A', COURO = '#4E3423', PRETO = '#1C1B1A', ACO = '#8F959D';
  /* o arco curva as pontas para trás e dobra mais quando a corda é puxada */
  function arco(puxada){
    const q = [], meia = .5 - .03 * puxada, fundo = .125 + .085 * puxada;
    const em = y => { const t = Math.max(0, (Math.abs(y) - .075) / (meia - .075)); return [0, y, -fundo * Math.pow(t, 1.65) + (t > .9 ? (t - .9) * .22 : 0)]; };
    for (const s of [-1, 1]){
      const n = 9, pts = [], raios = [];
      for (let i = 0; i <= n; i++){ const t = i / n, y = s * (.072 + (meia - .072) * t); pts.push(em(y)); raios.push([.0155 - .008 * t, .0108 - .0046 * t]); }
      tubo(q, pts, raios, [1, 0, 0], MADEIRA);
      const ponta = em(s * meia);
      tubo(q, [mais(ponta, [0, -s * .024, .002]), mais(ponta, [0, s * .012, .008])], [.0082, .007], [1, 0, 0], PRETO);       /* encaixe da corda */
    }
    tubo(q, [[0, -.078, 0], [0, .048, 0]], [[.0168, .02], [.0168, .02]], [1, 0, 0], COURO);                                   /* o cabo de couro */
    tubo(q, [[0, .048, 0], [0, .075, 0]], [[.0148, .011], [.0148, .011]], [1, 0, 0], MADEIRA);
    tubo(q, [[.013, .0485, 0], [.027, .0485, 0]], [.0036, .0032], [0, 1, 0], FIBRA);                                          /* o apoio da flecha */
    return {quads:voxelizar(q, PASSO.arco), topo:em(meia), base:em(-meia), corda:[.004, .045, -fundo], apoio:[.021, .052, .002]};
  }
  /* a flecha: encaixe na origem, apontando para +Z. Já nasce alinhada com os cubos */
  function flecha(comp){
    const q = [], X = [1, 0, 0], reta = (z0, z1, r, cor) => tubo(q, [[0, 0, z0], [0, 0, z1]], [r, r], X, cor);
    reta(.012, comp - .03, .0038, '#B08A57'); reta(-.006, .016, .0056, '#C0362C');
    for (const [ang, cor] of [[0, '#D9652E'], [2.094, '#E7E1D2'], [4.189, '#E7E1D2']]){
      const d = [Math.cos(ang), Math.sin(ang), 0];
      tubo(q, [[d[0] * .0095, d[1] * .0095, .038], [d[0] * .0095, d[1] * .0095, .112]], [[.0095, .0017], [.0095, .0017]], d, cor);
    }
    [[comp - .03, comp - .006, .011], [comp - .006, comp + .018, .0055]].forEach(([z0, z1, r]) => tubo(q, [[0, 0, z0], [0, 0, z1]], [[r, .0024], [r, .0024]], X, '#8F959D'));
    return voxelizar(q, PASSO.flecha);
  }
  function estilingue(){
    const q = [], X = [1, 0, 0];
    tubo(q, [[0, -.082, 0], [0, -.05, 0], [0, -.01, .001], [0, .02, 0], [0, .045, 0]], [.0175, .016, .0158, .0165, .018], X, MADEIRA, {lados:12});
    tubo(q, [[0, -.062, .0003], [0, .006, .0003]], [.0177, .0177], X, '#3B3B42');                                                      /* fita no cabo */
    const pontas = [];
    for (const s of [-1, 1]){
      const pts = [[s * .004, .036, 0], [s * .028, .066, 0], [s * .042, .096, 0], [s * .0455, .13, 0]];
      tubo(q, pts, [.0155, .012, .0105, .0098], [0, 0, 1], MADEIRA);
      tubo(q, [[s * .045, .114, 0], [s * .0455, .124, 0]], [.0118, .0118], [0, 0, 1], PRETO, {lados:11});                /* amarração do elástico */
      pontas.push([s * .0455, .119, -.011]);
    }
    return {quads:voxelizar(q, PASSO.arco), pontas, apoio:[0, .119, 0], repouso:[0, .1, -.055]};
  }
  /* o couro com a pedra; a origem é o centro da pedra, +Z para a frente */
  function bolsa(comPedra){
    const q = [], X = [1, 0, 0];
    const arco_ = Array.from({length:9}, (_, i) => { const t = i / 8 * 2 - 1; return [t * .024, 0, -.011 + .016 * t * t]; });
    tubo(q, arco_, arco_.map((_, i) => [.0022, i === 0 || i === 8 ? .006 : .0135]), [0, 0, 1], '#5A3B26', {lados:10});
    if (comPedra) tubo(q, [[-.006, .001, -.001], [0, 0, 0], [.0065, -.001, .001]], [[.0075, .007], [.0105, .0095], [.0072, .008]], [0, 1, 0], '#858A90', {lados:9});
    return voxelizar(q, PASSO.flecha);
  }

  /* as mãos nas armas de corda, já nas coordenadas do arco, do estilingue e do ponto da corda */
  const maoDoCabo = (Cor, rf) => segurando(Cor, {C:[0, -.016, 0], a:[0, 1, 0], n:[-1, 0, 0], f:[0, 0, 1], rn:.0172, rf,
    polegar:[[-.024, .006, -.03], [-.02, .03, -.012], [-.008, .038, .008], [.006, .036, .022]]});             /* (é espelhada: vira a mão esquerda) */
  /* três dedos na corda: indicador acima da flecha, médio e anelar abaixo; polegar e mindinho relaxados */
  const maoNaCorda = Cor => livre(Cor, {
    dedos:[[[-.07, .027, -.03], [-.027, .021, .002], [-.002, .017, .013], [.01, .015, -.007]],
           [[-.072, .001, -.033], [-.027, -.012, .003], [-.001, -.015, .014], [.012, -.016, -.007]],
           [[-.07, -.021, -.037], [-.029, -.032, -.001], [-.005, -.034, .011], [.008, -.034, -.008]],
           [[-.068, -.039, -.043], [-.046, -.052, -.018], [-.033, -.056, -.034], [-.045, -.054, -.05]]],
    polegar:[[-.098, .012, -.06], [-.074, -.004, -.042], [-.058, -.022, -.034], [-.046, -.036, -.03]],
    pulso:[-.138, -.006, -.082], largura:[0, 1, 0], dorso:[-.55, 0, -.83]});
  /* pinça no couro: polegar por baixo, indicador por cima, os outros recolhidos */
  const maoNoCouro = Cor => livre(Cor, {
    dedos:[[[-.072, .024, -.05], [-.04, .029, -.024], [-.019, .021, -.011], [-.003, .01, -.009]],
           [[-.074, .004, -.054], [-.048, .004, -.024], [-.036, -.002, -.039], [-.05, -.005, -.054]],
           [[-.072, -.015, -.058], [-.05, -.017, -.03], [-.038, -.021, -.045], [-.051, -.023, -.058]],
           [[-.07, -.031, -.063], [-.054, -.035, -.042], [-.044, -.038, -.055], [-.056, -.039, -.066]]],
    polegar:[[-.092, -.022, -.082], [-.056, -.026, -.05], [-.026, -.019, -.028], [-.004, -.01, -.014]],
    pulso:[-.138, -.004, -.1], largura:[0, 1, 0], dorso:[-.55, .1, -.82]});

  return {cores, segurando, livre, braco, arco, flecha, estilingue, bolsa, maoDoCabo, maoNaCorda, maoNoCouro, voxelizar};
})();
