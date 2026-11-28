/* Povoamento do mundo: modelos de casas, plantas e itens de rua em voxel, e as regras que os distribuem.
   As casas são INVENTADAS (não reproduzem casas reais do bairro). Não usa a página: dá para testar fora do navegador.
   Medidas em metros. Em cada modelo a origem fica no chão, no centro, e a frente aponta para +Z (a rua). */
const Povoar = (() => {
  const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
  /* cores de parede: claras na maioria, com alguns amarelos e azuis fortes */
  const TINTAS = ['#E8E6E0', '#CDCDC8', '#E8DCC0', '#D4A23A', '#5C8CC0', '#B4CBDC', '#D6C2A2', '#E3D6C4', '#C4896C', '#BCC0B8', '#EAE6DA', '#9DB4C8'];

  /* ---------------------------------------------------------- construtor de modelos: caixas viram lista de vértices */
  function sorteioN(a, b = 0, c = 0){ let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 2147483629)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  const FACES = [[[-1,0,0], [[0,0,0],[0,0,1],[0,1,1],[0,1,0]]], [[1,0,0], [[1,0,1],[1,0,0],[1,1,0],[1,1,1]]],
    [[0,1,0], [[0,1,1],[1,1,1],[1,1,0],[0,1,0]]], [[0,0,-1], [[1,0,0],[0,0,0],[0,1,0],[1,1,0]]], [[0,0,1], [[0,0,1],[1,0,1],[1,1,1],[0,1,1]]], [[0,-1,0], [[0,0,0],[1,0,0],[1,0,1],[0,0,1]]]];
  /* cada vértice: x y z | nx ny nz | r g b (0..255) | pinta (1 = recebe a cor da casa) */
  function modelo(desenhar, detalhe){
    const v = []; let numero = 0;
    const g = {
      /* x e z no centro, y na base. cor = '#hex' ou 'pintura' (com claro opcional). px = tamanho do pixel (0 = sem textura) */
      b(x, y, z, w, h, d, cor, px = .55, claro = 1, chao = false){
        const id = numero++, pinta = cor === 'pintura' ? 1 : 0, base = pinta ? [232 * claro, 232 * claro, 232 * claro] : hex(cor).map(c => c * claro);
        const min = [x - w / 2, y, z - d / 2], tam = [w, h, d];
        for (const [n, cantos] of FACES){
          if (n[1] < 0 && !chao) continue;
          const P = cantos.map(c => c.map((q, i) => min[i] + q * tam[i]));
          const comp = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
          const nu = detalhe && px ? Math.max(1, Math.min(14, Math.round(comp(P[0], P[1]) / px))) : 1, nv = detalhe && px ? Math.max(1, Math.min(14, Math.round(comp(P[0], P[3]) / px))) : 1;
          const mistura = (a, b, t) => [0, 1, 2].map(i => a[i] + (b[i] - a[i]) * t), em = (s, t) => mistura(mistura(P[0], P[1], s), mistura(P[3], P[2], s), t);
          for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++){
            const r = sorteioN(id * 31 + i, j * 17 + n[0] * 5, n[2] * 7 + n[1]), f = !detalhe || !px ? 1 : r < .17 ? .94 : r > .85 ? 1.055 : 1;
            const q = [em(i / nu, j / nv), em((i + 1) / nu, j / nv), em((i + 1) / nu, (j + 1) / nv), em(i / nu, (j + 1) / nv)];
            for (const k of [0, 1, 2, 0, 2, 3]) v.push(q[k][0], q[k][1], q[k][2], n[0], n[1], n[2], Math.min(255, base[0] * f), Math.min(255, base[1] * f), Math.min(255, base[2] * f), pinta);
          }
        }
      },
      /* blocos numa grade: cheio = Map "i,j,k" -> cor. Só sai a face que não tem vizinho */
      grade(cheio, passo){
        for (const [chave, cor] of cheio){
          const [i, j, k] = chave.split(',').map(Number), base = hex(cor), min = [i * passo, j * passo, k * passo];
          for (const [n, cantos] of FACES){
            if (cheio.has((i + n[0]) + ',' + (j + n[1]) + ',' + (k + n[2]))) continue;
            const r = sorteioN(i * 31 + n[0] * 7, j * 17 + n[1] * 5, k * 13 + n[2] * 3), f = r < .22 ? .92 : r > .8 ? 1.07 : 1;
            const q = cantos.map(c => c.map((v_, e) => min[e] + v_ * passo));
            for (const e of [0, 1, 2, 0, 2, 3]) v.push(q[e][0], q[e][1], q[e][2], n[0], n[1], n[2], Math.min(255, base[0] * f), Math.min(255, base[1] * f), Math.min(255, base[2] * f), 0);
          }
        }
      },
    };
    desenhar(g);
    return v;
  }

  /* ---------------------------------------------------------- casas: o desenho e as plantas ficam em mundo-casas.js */
  const MOLDURA_ = '#EDE9DD', MATO_ = '#5C7F33';
  const PORTAO = '#4A4E55', LAJE = '#9D9A92', TIJOLO = '#A9583C', REBOCO = '#B3ADA0', FERRUGEM = '#8A4A24', TABUA = '#6E5844', MATO = '#5C7F33';
  const NOMES = {casa_telha:'Casa térrea com telhado', casa_laje:'Casa de laje com caixa d\'água', sobrado:'Sobrado', quatro_aguas:'Casa de quatro águas', obra:'Casa em construção (tijolo à vista)', comercio:'Comércio de bairro'};
  /* largura e fundo aqui são os maiores entre as plantas do tipo; cada casa usa as medidas da sua planta */
  const CASAS = Object.fromEntries(Object.entries(NOMES).map(([id, nome]) => [id, {nome, h:Casas.alturaTotal(id), w:Math.max(...Casas.DE_TIPO[id].map(k => Casas.PLANTAS[k].w)), d:Math.max(...Casas.DE_TIPO[id].map(k => Casas.PLANTAS[k].d))}]));
  const plantaSorteada = (id, r) => Casas.DE_TIPO[id][Math.min(Casas.DE_TIPO[id].length - 1, Math.floor(r * Casas.DE_TIPO[id].length))];
  /* partes que formam cada nível de desenho de uma casa */
  const PARTES = {perto:['casco', 'cima', 'teto', 'dentro'], fora:['casco', 'cima', 'teto'], casco:['casco'], cima:['cima'], teto:['teto'], dentro:['dentro'], longe:['longe']};
  /* nome do modelo: as casas levam a planta junto, como "casa_telha@Am" */
  const modeloDe = o => o.planta ? `${o.id}@${o.planta}` : o.variante ? `${o.id}@${o.variante}` : o.id;
  /* ---------------------------------------------------------------- vegetação
     As copas são montadas em blocos numa grade: só as faces que aparecem são desenhadas, então nada fica
     uma face sobre a outra. v = a variante (0..2), para as árvores não saírem todas iguais. */
  const CASCA = '#5E442F', CASCA2 = '#4C3626';
  const numDaVariante = p => Number(p) || 0;
  /* manchas = [[x, y, z, raioLado, raioAltura]]; cores = [de baixo, do meio, de cima] */
  function copa(g, manchas, passo, cores, sem, falhas = .2){
    const cheio = new Map();
    let base = 1e9, topo = -1e9;
    for (const [, y, , , ry] of manchas){ base = Math.min(base, y - ry); topo = Math.max(topo, y + ry); }
    manchas.forEach(([x, y, z, r, ry], n) => {
      for (let i = Math.floor((x - r) / passo) - 1; i <= Math.ceil((x + r) / passo); i++) for (let j = Math.floor((y - ry) / passo) - 1; j <= Math.ceil((y + ry) / passo); j++) for (let k = Math.floor((z - r) / passo) - 1; k <= Math.ceil((z + r) / passo); k++){
        const cx = (i + .5) * passo - x, cy = (j + .5) * passo - y, cz = (k + .5) * passo - z, d = Math.hypot(cx / r, cy / ry, cz / r);
        if (d > 1.04 + (sorteioN(i + sem, j, k) - .5) * .34) continue;
        if (d > .74 && sorteioN(i, j + sem, k + n) < falhas) continue;          /* a beirada é falhada, como folhagem */
        const chave = i + ',' + j + ',' + k; if (cheio.has(chave)) continue;
        const alto = ((j + .5) * passo - base) / (topo - base) + (sorteioN(i, j, k + sem + 5) - .5) * .42;
        cheio.set(chave, cores[alto < .34 ? 0 : alto < .68 ? 1 : 2]);
      }
    });
    g.grade(cheio, passo);
    return cheio;
  }
  /* galho em degraus, do tronco até o miolo de uma mancha */
  function galho(g, de, ate, grosso, cor = CASCA){
    const n = Math.max(2, Math.round(Math.hypot(ate[0] - de[0], ate[1] - de[1], ate[2] - de[2]) / (grosso * 1.1)));
    for (let i = 1; i <= n; i++){ const t = i / n, w = grosso * (1 - t * .45) * (1 + (i % 2) * .03); g.b(de[0] + (ate[0] - de[0]) * t, de[1] + (ate[1] - de[1]) * t - w / 2, de[2] + (ate[2] - de[2]) * t, w, w * 1.12, w, cor, 0, 1 - (i % 3) * .05); }
  }
  /* raízes saindo do pé do tronco */
  function raizes(g, tronco, cor){
    const f = tronco / 2;
    for (const [x, z, w, d] of [[f + .09, .04, .2, .14], [-f - .08, -.05, .18, .13], [.05, f + .1, .14, .22], [-.04, -f - .07, .13, .17]]){ g.b(x, -.4, z, w, .52, d, cor, 0, .92); g.b(x * 1.55, -.4, z * 1.55, w * .62, .44, d * .62, cor, 0, .85); }
  }
  function arvoreDeCopa(g, velha, planta){
    const v = numDaVariante(planta), giro = v * 2.1, em = (a, r) => [Math.cos(a + giro) * r, Math.sin(a + giro) * r];
    g.b(0, -1, 0, .46, 2.3, .46, CASCA, .3); g.b(.02, 1.3, -.01, .36, 1.4, .36, CASCA, .3);
    for (let i = 0; i < 5; i++){ const [x, z] = em(i * 1.31, .235); g.b(x, .15 + i * .43, z, .07, .26, .07, CASCA2, 0); }       /* sulcos da casca */
    raizes(g, .46, CASCA);
    const alto = [3.9, 4.25, 3.65][v % 3], manchas = [[0, alto - .5, 0, 1.55, 1.05], [0, alto + .72, 0, 1.1, .85]];
    for (let i = 0; i < 4; i++){ const [x, z] = em(i * 1.62 + .4, 1.15 + (i % 2) * .3), y = alto - .95 + ((i * 7 + v) % 4) * .24; manchas.push([x, y, z, .9 - (i % 3) * .08, .68]); galho(g, [0, 1.85 + i * .17, 0], [x * .78, y - .15, z * .78], .22); }
    galho(g, [0, 2.4, 0], [.05, alto - .2, .05], .27);
    copa(g, manchas, .38, ['#2F5B26', '#427A31', '#58953C'], 11 + v);
  }
  function mangueiraNova(g, velha, planta){
    const v = numDaVariante(planta), giro = v * 2.4;
    g.b(0, -1, 0, .66, 2.35, .66, '#4E3826', .3); raizes(g, .66, '#4E3826');
    const manchas = [[0, 3.35, 0, 2.35, 1.35], [0, 4.65, 0, 1.55, 1.0]];
    for (let i = 0; i < 5; i++){ const a = i * 1.2566 + giro, x = Math.cos(a) * 1.75, z = Math.sin(a) * 1.75, y = 2.75 + ((i + v) % 3) * .22; manchas.push([x, y, z, 1.05, .78]); if (i % 2 === 0 || i === 3) galho(g, [0, 1.2, 0], [x * .72, y - .35, z * .72], .3, '#4E3826'); }
    galho(g, [0, 1.35, 0], [0, 3.1, 0], .42, '#4E3826');
    const cheio = copa(g, manchas, .46, ['#234A1C', '#2F6224', '#3F7A2E'], 31 + v, .16);
    /* as mangas penduradas por baixo da copa */
    let n = 0;
    for (const chave of cheio.keys()){
      const [i, j, k] = chave.split(',').map(Number);
      if (cheio.has(i + ',' + (j - 1) + ',' + k) || j * .46 > 3.0 || sorteioN(i, k, 77 + v) > .12 || n >= 16) continue;
      const x = (i + .5) * .46, y = j * .46, z = (k + .5) * .46; n++;
      g.b(x, y - .1, z, .028, .1, .028, '#3C5220', 0); g.b(x, y - .31, z, .17, .21, .15, n % 3 ? '#E0A324' : '#C4571E', 0, 1, true);
    }
  }
  function ipe(g, cores, planta){
    const v = numDaVariante(planta), giro = v * 1.9;
    g.b(0, -1, 0, .36, 2.4, .36, '#6A5039', .3); g.b(.09, 1.4, .04, .28, 1.3, .28, '#6A5039', .3); g.b(-.02, 2.7, 0, .22, 1.2, .22, '#6A5039', .3); raizes(g, .36, '#6A5039');
    const manchas = [[0, 4.75, 0, 1.15, .8]];
    for (let i = 0; i < 5; i++){ const a = i * 1.2566 + giro, r = 1.05 + (i % 3) * .24, x = Math.cos(a) * r, z = Math.sin(a) * r, y = 3.15 + ((i * 3 + v) % 5) * .26; manchas.push([x, y, z, .74, .52]); galho(g, [0, 2.0 + i * .24, 0], [x * .86, y - .12, z * .86], .17, '#6A5039'); }
    galho(g, [0, 3.6, 0], [0, 4.6, 0], .17, '#6A5039');
    copa(g, manchas, .34, cores, 51 + v, .3);
    /* pétalas no chão, cada uma no seu quadrado para nenhuma ficar sobre a outra */
    for (let i = -6; i <= 6; i++) for (let k = -6; k <= 6; k++){
      const d = Math.hypot(i, k); if (d > 6 || d < 1.6 || sorteioN(i, k, 63 + v) > .17) continue;
      g.b(i * .27 + (sorteioN(i, k, 3) - .5) * .08, .004 + sorteioN(i, k, 4) * .008, k * .27 + (sorteioN(k, i, 5) - .5) * .08, .11, .012, .11, cores[(i + k + 12) % 3], 0);
    }
  }
  function eucaliptoNovo(g, velha, planta){
    const v = numDaVariante(planta);
    /* o tronco liso, em faixas de casca soltando */
    for (let i = 0; i < 11; i++) g.b(0, -1 + i * .84, 0, .34 - i * .012, .84, .34 - i * .012, ['#B3A58A', '#A09277', '#C2B69C'][(i + v) % 3], .45);
    for (let i = 0; i < 5; i++) g.b((i % 2 ? .17 : -.17), 1.1 + i * 1.15, (i % 3 - 1) * .08, .03, .5, .09, '#8A765A', 0);
    const manchas = [];
    for (let i = 0; i < 7; i++){ const a = i * 2.5 + v * 1.7, r = i === 6 ? 0 : .55 + (i % 3) * .18, x = Math.cos(a) * r, z = Math.sin(a) * r, y = 5.0 + i * .86; manchas.push([x, y, z, .78 - Math.abs(i - 2) * .045, .62]); if (i < 6) galho(g, [0, y - .55, 0], [x * .8, y - .1, z * .8], .12, '#A09277'); }
    copa(g, manchas, .34, ['#466442', '#567A4E', '#6C905C'], 71 + v, .34);
  }
  /* folha comprida em pedaços: sai do alto do talo, sobe um pouco e cai. (dx, dz) = para que lado */
  function folhaDeBananeira(g, x, y, z, dx, dz, comp, tom){
    const SOBE = [.09, .18, .22, .18, .07, -.12], LARG = [.18, .4, .5, .46, .34, .18];
    let antes = 0;
    for (let i = 0; i < 6; i++){
      const d = .12 + i * comp, px = x + dx * d, pz = z + dz * d, w = LARG[i];
      /* cada pedaço vai da altura do anterior até a dele, para a folha não ficar picada no ar */
      const de = Math.min(antes, SOBE[i]), ate = Math.max(antes, SOBE[i]) + .05 + i * .0006;
      g.b(px, y + de, pz, dx ? comp : w, ate - de, dz ? comp : w, i > 3 ? tom[1] : tom[0], .3, 1, true);
      g.b(px, y + ate, pz, dx ? comp : .045, .016, dz ? comp : .045, '#9CC25A', 0);                     /* a nervura */
      antes = SOBE[i];
    }
  }
  function bananeiraNova(g, velha, planta){
    const v = numDaVariante(planta);
    [[0, 0, 2.35], [.62, .34, 1.55], [-.46, -.4, 1.05]].forEach(([x, z, h], n) => {
      for (let i = 0; i < Math.ceil((h + .6) / .42); i++){ const y = -.6 + i * .42, w = .24 - n * .03 - i * .006; g.b(x, y, z, w, Math.min(.42, h - y), w, i % 2 ? '#78893A' : '#8A9A44', .25); }
      const lados = [[1, 0], [0, 1], [-1, 0], [0, -1]];
      lados.forEach(([dx, dz], i) => { if (n === 2 && i === (v % 4)) return; folhaDeBananeira(g, x, h - .1 + ((i + v) % 4) * .09, z, dx, dz, .25 - n * .035, n % 2 ? ['#4F9433', '#3F7C29'] : ['#5CA33C', '#468A2E']); });
      g.b(x, h - .02, z, .09, .5 - n * .08, .09, '#7FBF4E', 0);                                            /* a folha nova, enrolada */
      /* folha seca caída junto do talo */
      g.b(x + (n % 2 ? -.17 : .17), h - .85, z, .05, .6, .22, '#9A7A3A', 0);
    });
    for (let i = 0; i < 10; i++){ const a = i % 5, andar = (i / 5) | 0; g.b(-.2 - andar * .09, 1.62 - andar * .16 + (a % 2) * .01, -.16 + a * .08, .075, .17, .062, andar ? '#C9B93A' : '#8FA83A', 0, 1, true); }
    g.b(-.2, 1.72, 0, .05, .24, .05, '#6E7A30', 0); g.b(-.31, 1.18, 0, .11, .2, .11, '#6A2E3E', 0, 1, true);       /* o cacho e o coração */
  }
  function arbustoNovo(g, velha, planta){
    const v = numDaVariante(planta);
    const cheio = copa(g, [[0, .34, 0, .55, .46], [.42, .22, .26, .34, .3], [-.36, .2, -.22, .36, .3], [-.12, .62, .1, .3, .26]], .19, ['#3C6A28', '#4F8434', '#66A044'], 91 + v, .22);
    g.b(0, -.35, 0, .14, .5, .14, CASCA2, 0);
    if (v % 3 === 0) return;
    let n = 0;
    for (const chave of cheio.keys()){
      const [i, j, k] = chave.split(',').map(Number);
      if (cheio.has(i + ',' + (j + 1) + ',' + k) || sorteioN(i, j, k + 13) > .16 || n >= 14) continue;
      n++; g.b((i + .5) * .19, (j + 1) * .19, (k + .5) * .19, .075, .05, .075, v % 3 === 1 ? (n % 2 ? '#E8E2D0' : '#F2D54A') : (n % 2 ? '#C94F6A' : '#E07A8E'), 0);
    }
  }
  /* mato alto: lâminas de dois pedaços, a ponta caída para um lado */
  function capimNovo(g, velha, planta){
    const v = numDaVariante(planta);
    for (let i = 0; i < 15; i++){
      const a = i * 2.399 + v, r = .05 + Math.sqrt(i / 15) * .42, x = Math.cos(a) * r, z = Math.sin(a) * r, h = .26 + sorteioN(i, 4, v) * .52, cor = ['#6F8A34', '#86993F', '#A3A552', '#7E9440'][(i + v) % 4];
      g.b(x, -.15, z, .05, .15 + h * .7, .05, cor, 0, .9);
      g.b(x + Math.cos(a) * .045, h * .62, z + Math.sin(a) * .045, .038, h * .42, .038, cor, 0, 1.08);
      if (i % 5 === 2) g.b(x + Math.cos(a) * .045, h * 1.04, z + Math.sin(a) * .045, .055, .11, .055, '#C9B066', 0);       /* o pendão */
    }
  }
  function floresDoMato(g, velha, planta){
    const v = numDaVariante(planta), COR = [['#F2D54A', '#E8A81E'], ['#EFEBDC', '#E3C94A'], ['#B96BC4', '#F2D54A']][v % 3];
    for (let i = 0; i < 11; i++){
      const a = i * 2.399, r = .06 + Math.sqrt(i / 11) * .4, x = Math.cos(a) * r, z = Math.sin(a) * r, h = .16 + sorteioN(i, 8, v) * .24;
      g.b(x, -.1, z, .028, .1 + h, .028, '#5C7F33', 0);
      g.b(x, h, z, .085, .035, .085, COR[0], 0); g.b(x, h + .035, z, .036, .024, .036, COR[1], 0);
      if (i % 2) g.b(x + .04, h * .45, z, .08, .02, .045, '#6F9A3A', 0);
    }
    for (let i = 0; i < 7; i++){ const a = i * 2.1 + 1, r = .1 + (i % 4) * .09; g.b(Math.cos(a) * r, -.1, Math.sin(a) * r, .045, .24 + (i % 3) * .07, .045, '#7E9440', 0); }
  }

  const PLANTAS = {
    arvore:{nome:'Árvore de copa', r:.35, copa:2.6, desenhar:arvoreDeCopa, longe(g){ g.b(0, -1, 0, .4, 3.2, .4, '#5E442F', 0); g.b(0, 2.2, 0, 3.4, 2.1, 3.4, '#427A31', 0); g.b(0, 4.3, 0, 2, .9, 2, '#58953C', 0); }},
    mangueira:{nome:'Mangueira', r:.45, copa:3.4, desenhar:mangueiraNova, longe(g){ g.b(0, -1, 0, .6, 3, .6, '#4E3826', 0); g.b(0, 2, 0, 5.4, 2.6, 5.4, '#2F6224', 0); g.b(0, 4.6, 0, 3, 1.1, 3, '#3F7A2E', 0); }},
    ipe_amarelo:{nome:'Ipê-amarelo', r:.3, copa:2.2, desenhar(g, velha, v){ ipe(g, ['#D99B0E', '#F2C21A', '#FBD84A'], v); }, longe(g){ g.b(0, -1, 0, .35, 4, .35, '#6A5039', 0); g.b(0, 2.8, 0, 3.2, 2, 3.2, '#EDBA16', 0); }},
    ipe_roxo:{nome:'Ipê-roxo', r:.3, copa:2.2, desenhar(g, velha, v){ ipe(g, ['#8A3578', '#B2549B', '#CE74B6'], v); }, longe(g){ g.b(0, -1, 0, .35, 4, .35, '#6A5039', 0); g.b(0, 2.8, 0, 3.2, 2, 3.2, '#A84C93', 0); }},
    eucalipto:{nome:'Eucalipto', r:.25, copa:1.3, desenhar:eucaliptoNovo, longe(g){ g.b(0, -1, 0, .3, 6, .3, '#A8997F', 0); g.b(0, 4.6, 0, 1.8, 5.6, 1.8, '#587849', 0); }},
    bananeira:{nome:'Bananeira', r:.25, copa:1.2, desenhar:bananeiraNova, longe(g){ g.b(0, -.6, 0, .25, 2.6, .25, '#7A8C3A', 0); g.b(0, 1.9, 0, 2.6, .35, .5, '#4F9433', 0); g.b(0, 2.0, 0, .5, .34, 2.6, '#5CA33C', 0); }},
    arbusto:{nome:'Arbusto', r:0, copa:.8, desenhar:arbustoNovo, longe(g){ g.b(0, -.3, 0, 1.2, 1.1, 1.2, '#518434', 0); }},
    capim:{nome:'Mato alto', r:0, copa:.5, miudo:true, desenhar:capimNovo, longe:null},
    flores:{nome:'Flores do mato', r:0, copa:.5, miudo:true, desenhar:floresDoMato, longe:null},
  };
  /* muro na beira do passeio. 0: telhadinho de cerâmica e portão branco; 1: portão de chapa cinza;
     2: balaústres em cima e portão branco; 3: portão amarelo e vazados. A passagem fica no mesmo lugar em todos. */
  function muroDeFrente(g, v, n){
    const TELHAS = ['#B25A3B', '#A85032', '#94462F'], alto = n === 2 ? 1.55 : n === 1 ? 2.25 : 2.05;
    for (const [x, w] of [[-2.75, 2.5], [2.15, 3.7]]){
      g.b(x, -1.6, 0, w, 1.6 + alto, .2, 'pintura', .55, .94);
      g.b(x, 0, .112, w - .02, .22, .014, '#9B8F80', .4);                                   /* barro no pé do muro */
      if (n === 2){
        g.b(x, alto, 0, w + .04, .09, .28, MOLDURA_, 0);
        for (let a = x - w / 2 + .16; a < x + w / 2 - .08; a += .24){ g.b(a, alto + .09, 0, .09, .44, .09, MOLDURA_, 0); g.b(a, alto + .2, 0, .13, .18, .13, MOLDURA_, 0); }
        g.b(x, alto + .53, 0, w + .04, .1, .24, MOLDURA_, 0);
      } else if (n === 1){ g.b(x, alto, 0, w + .04, .08, .28, '#9D9A92', 0); }
      else { g.b(x, alto, 0, w + .06, .07, .38, '#8F442F', .3); for (let a = x - w / 2 + .12; a < x + w / 2 - .04; a += .24) g.b(a, alto + .07, 0, .13, .075, .44, TELHAS[Math.abs(Math.round(a * 4)) % 3], 0); }
      for (const s of [-1, 1]) g.b(x + s * (w / 2 - .09), -.2, 0, .18, .2 + alto + .06, .27, 'pintura', 0, .86);
    }
    if (n === 3) for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) g.b(1.5 + i * .19, 1.35 + j * .19, .106, .12, .12, .012, '#7A3E2C', 0);
    g.b(-.6, -1.6, -.02, 1.9, 1.62, .18, '#8C877C', 0);
    const cor = n === 1 ? '#6C7076' : n === 3 ? '#C99A34' : '#E4E3DD', friso = n === 1 ? '#50545A' : n === 3 ? '#9C7620' : '#B9B8B2';
    if (!v){
      g.b(-.6, .06, 0, 1.78, 1.86, .05, cor, .5);
      for (let x = -1.4; x < .26; x += (n === 1 ? .17 : .27)) g.b(x, .1, .034, n === 1 ? .06 : .05, 1.78, .022, friso, 0);
      g.b(-.6, .98, .045, 1.78, .08, .025, friso, 0);
      if (n !== 1 && n !== 3) for (let x = -1.42, i = 0; x < .28; x += .18, i++){ const sobe = .28 - Math.abs(x + .6) * .22; g.b(x, 1.92, 0, .04, sobe, .04, cor, 0); g.b(x, 1.92 + sobe, 0, .07, .07, .06, cor, 0); }
      g.b(-.18, .9, .065, .06, .1, .03, '#33363B', 0);
    } else {
      g.b(-1.43, .05, .42, .07, 1.8, .82, cor, .35); for (let z = .1; z < .8; z += .2) g.b(-1.39, .1, z, .02, 1.7, .05, friso, 0);
      g.b(2.6, alto + .1, 0, .8, .16, .34, MATO_, 0); g.b(1.2, .5, .115, .9, .5, .02, '#6E6454', 0); g.b(-3, .1, .125, .6, 1.0, .02, MATO_, 0);
    }
    /* padrão de luz no muro, e em alguns a lixeira de ferro na calçada */
    g.b(-2.2, 1.05, .13, .3, .42, .07, '#D9D8D2', 0); g.b(-2.2, 1.25, .17, .17, .12, .012, '#3A4650', 0);
    if (n === 1 || n === 2){
      g.b(2.7, -.4, .62, .06, 1.52, .06, '#3A3D42', 0);
      for (const y of [1.1, 1.38]){ for (const z of [.45, .79]) g.b(2.7, y, z, .72, .035, .035, '#3A3D42', 0); for (const x of [2.34, 3.06]) g.b(x, y, .62, .035, .035, .34, '#3A3D42', 0); }
      for (let x = 2.34; x <= 3.07; x += .12) for (const z of [.45, .79]) g.b(x, 1.1, z, .022, .3, .022, '#3A3D42', 0);
      for (let x = 2.34; x <= 3.07; x += .12) g.b(x, 1.1, .62, .022, .022, .34, '#3A3D42', 0);
      if (v) g.b(2.62, 1.12, .6, .3, .2, .24, '#33383A', 0);
    }
  }
  const RUA = {
    muro:{nome:'Muro com portão', w:8, d:.22, h:2.6, desenhar(g, v, variante){ muroDeFrente(g, v, Math.max(0, (+variante || 1) - 1)); }, longe(g){ g.b(-2.75, -1, 0, 2.5, 3.2, .2, 'pintura', 0); g.b(2.15, -1, 0, 3.7, 3.2, .2, 'pintura', 0); }},
    garagem:{nome:'Portão de garagem', w:2.4, d:.22, h:2.6, desenhar(g, v, variante){
      const n = Math.max(0, (+variante || 1) - 1) % 3, cor = ['#E4E3DD', '#6C7076', '#C99A34'][n], friso = ['#B9B8B2', '#50545A', '#9C7620'][n];
      for (const s of [-1, 1]) g.b(s * 1.12, -1.6, 0, .18, 4.1, .26, 'pintura', .55, .9);
      g.b(0, 2.28, 0, 2.42, .26, .24, 'pintura', .55, .94); g.b(0, 2.54, .03, 2.5, .07, .4, '#8F442F', .3); for (let a = -1.15; a < 1.2; a += .24) g.b(a, 2.61, .03, .13, .07, .46, a % .5 > .2 ? '#B25A3B' : '#A85032', 0);
      g.b(0, -1.6, -.02, 2.1, 1.64, .18, '#8C877C', 0);
      if (!v){ g.b(0, .04, 0, 2.06, 2.24, .05, cor, .5); for (let x = -.9; x <= .91; x += (n === 1 ? .15 : .3)) g.b(x, .08, .034, .05, 2.16, .022, friso, 0); g.b(0, 1.15, .045, 2.06, .07, .025, friso, 0); }
      else { g.b(0, 1.2, 0, 2.06, 1.08, .05, cor, .5); for (let x = -.9; x <= .91; x += .3) g.b(x, 1.22, .034, .05, 1.04, .022, friso, 0); g.b(0, .04, 0, 2.06, 1.16, .02, '#121110', 0); g.b(.7, .05, .12, .55, .5, .05, '#8A4A24', .2); }
    }, longe(g){ g.b(0, -1, 0, 2.4, 3.6, .22, 'pintura', 0); }},
    poste:{nome:'Poste de luz', w:.35, d:.35, h:8, r:.2, desenhar(g){ g.b(0, -1.5, 0, .3, 9.4, .3, '#A9A79F', .6); g.b(0, 7.5, 0, 1.5, .1, .1, '#6E5844', 0); g.b(0, 6.95, 0, 1.1, .1, .1, '#6E5844', 0); for (const x of [-.62, .62, -.42, .42]) g.b(x, Math.abs(x) > .5 ? 7.6 : 7.05, 0, .1, .16, .1, '#33363B', 0); g.b(0, 6.2, .55, .08, .08, 1.1, '#4B5058', 0); g.b(0, 6.02, 1.12, .34, .18, .42, '#33363B', 0); g.b(0, 5.96, 1.12, .24, .08, .3, '#FFEFB0', 0); g.b(0, 4.6, .19, .5, .65, .12, '#7C8A8F', 0); }, longe(g){ g.b(0, -1, 0, .3, 8.9, .3, '#A9A79F', 0); g.b(0, 7.5, 0, 1.5, .12, .12, '#6E5844', 0); }},
    carro:{nome:'Carro enferrujado ou destruído', w:2.2, d:4.6, h:1.9, r:1.2, desenhar(g){ g.b(0, .34, 0, 1.76, .56, 3.9, 'pintura', .3); g.b(0, .9, -.3, 1.58, .62, 2, '#27343E', .5); for (const x of [-.78, .78]) for (const z of [-1.3, -.3, .7]) g.b(x, .9, z, .1, .62, .1, 'pintura', 0, .85); g.b(0, 1.5, -.3, 1.66, .13, 2.08, 'pintura', .4, .92); for (const x of [-.86, .86]) for (const z of [-1.3, 1.28]) g.b(x, -.05, z, .24, .68, .66, '#1B1B1E', .22); g.b(0, .34, 1.99, 1.78, .22, .14, '#2E3036', 0); g.b(0, .34, -1.99, 1.78, .22, .14, '#2E3036', 0); for (const x of [-.62, .62]){ g.b(x, .66, 1.97, .3, .16, .05, '#D9D2B4', 0); g.b(x, .66, -1.97, .28, .16, .05, '#8E2A22', 0); } for (let i = 0; i < 9; i++) g.b((sorteioN(i, 41) - .5) * 1.5, .9 + (i % 2) * .005, 1.35 + (sorteioN(i, 42) - .5) * 1.1, .3, .015, .26, FERRUGEM, 0); for (let i = 0; i < 6; i++) g.b(i % 2 ? .89 : -.89, .42 + sorteioN(i, 43) * .3, (sorteioN(i, 44) - .5) * 3.2, .015, .22, .4, FERRUGEM, 0); }, longe(g){ g.b(0, .1, 0, 1.76, .8, 3.9, 'pintura', 0); g.b(0, .9, -.3, 1.6, .7, 2, '#27343E', 0); }},
    /* espalhado e baixo: muitos pedaços pequenos, poucos médios, quase nenhum grande (antes todos ficavam grandes demais) */
    entulho:{nome:'Entulho', w:1.7, d:1.5, h:.42, r:0, miudo:true, desenhar(g){
      for (let i = 0; i < 26; i++){ const grande = i < 3, s = grande ? .22 + sorteioN(i, 51) * .14 : .05 + sorteioN(i, 51) * .13;
        g.b((sorteioN(i, 52) - .5) * 1.65, -.025 + (i > 20 ? .07 : 0), (sorteioN(i, 53) - .5) * 1.4, s * (1 + sorteioN(i, 58) * .3), s * .55, s * (.7 + sorteioN(i, 59) * .5), [TIJOLO, REBOCO, TABUA, '#4B5058', '#8A8578'][i % 5], .2); }
      for (let i = 0; i < 4; i++) g.b((sorteioN(i, 54) - .5) * 1.5, -.02, (sorteioN(i, 55) - .5) * 1.3, .018, .22 + sorteioN(i, 56) * .3, .018, '#6B6E63', 0);
    }, longe(g){ g.b(0, -.1, 0, 1.5, .22, 1.3, '#6B6256', 0); }},
    /* saco cheio: mais largo no meio, boca amarrada em cima; duas ou três jogadas juntas */
    saco_lixo:{nome:'Saco de lixo', w:.7, d:.6, h:.62, r:0, miudo:true, desenhar(g){
      const cores = ['#1D1E1C', '#2B3A26', '#C9C6B8']; let n = 0;
      for (const [ox, oz, cor] of [[0, 0, 0], [.32, -.12, 1], [-.28, .16, 2]]){
        if (cor === 2 && sorteioN(cor, 61) < .5) continue; n++;
        const h0 = -.105 + sorteioN(n, 62) * .03;
        g.b(ox, h0 + .07, oz, .34, .14, .3, cores[cor], .12); g.b(ox, h0 + .2, oz, .42, .16, .36, cores[cor], .12); g.b(ox, h0 + .35, oz, .36, .14, .32, cores[cor], .12);
        g.b(ox, h0 + .46, oz, .14, .1, .13, cores[cor], .12); g.b(ox + .04, h0 + .53, oz - .02, .05, .07, .05, '#C8B468', 0);
      }
    }, longe(g){ g.b(0, -.05, 0, .6, .5, .5, '#242420', 0); }},
    /* lata de lixo: corpo em degraus (quadrado, nunca redondo), aro e tampa */
    latao_lixo:{nome:'Latão de lixo', w:.62, d:.62, h:.95, r:.3, desenhar(g, v){
      const cor = v ? FERRUGEM : '#4B7A4E', n = v ? '#6B6256' : '#395C3B';
      for (const [y, m] of [[-.04, .82], [.24, .9], [.54, 1]]) g.b(0, y, 0, .5 * m, .3, .5 * m, cor, .25);
      g.b(0, .72, 0, .54, .08, .54, n, .3); g.b(0, .81, 0, .3, .1, .3, n, .3, 2);
      for (let i = 0; i < 5; i++) g.b((sorteioN(i, 63) - .5) * .4, .29 + sorteioN(i, 64) * .5, (sorteioN(i, 65) - .5) * .4, .09, .09, .09, i % 2 ? '#1D1E1C' : '#C9C6B8', .1);
    }, longe(g){ g.b(0, -.05, 0, .5, .93, .5, '#4B7A4E', 0); }},
    barricada:{nome:'Barricada', w:2.6, d:.8, h:1.1, r:1, desenhar(g){ for (let l = 0; l < 3; l++) for (let i = 0; i < 4; i++){ if (l % 2 && i === 3) continue; g.b(-1 + i * .66 + (l % 2) * .33, l * .27 - .08, (i % 2) * .04, .64, .3, .5, (i + l) % 3 ? '#B79F74' : '#9C855E', .2); } g.b(.2, .75, .05, 2.3, .13, .1, TABUA, .2); for (const x of [-1.25, 1.3]) g.b(x, -.2, .35, .5, 1.15, .5, FERRUGEM, .2); }, longe(g){ g.b(0, -.2, 0, 2.6, 1, .6, '#A89066', 0); }},
  };
  const TODOS = {...CASAS, ...PLANTAS, ...RUA};
  const CATEGORIA = id => CASAS[id] ? 'casa' : PLANTAS[id] ? 'planta' : 'rua';
  const guardados = new Map();
  /* vértices de um modelo: nivel 'perto' ou 'longe' (casas também aceitam as partes); velha = versão abandonada */
  function vertices(nome, nivel, velha){
    const chave = `${nome}|${nivel}|${velha ? 1 : 0}`;
    if (!guardados.has(chave)){
      const [id, planta] = nome.split('@'); let f;
      if (id === 'carro'){
        const lista_ = nivel === 'longe' ? modelo(g => CarrosMundo.longe(g, planta), false) : CarrosMundo.vertices(planta, nivel);
        guardados.set(chave, new Float32Array(lista_));
        return guardados.get(chave);
      }
      if (CASAS[id]){
        const k = Casas.plantaDe(id, planta);
        f = (g, v) => { for (const parte of PARTES[nivel]) Casas.desenhar(id, k, parte, g, v); };
      } else { const base_ = nivel === 'perto' ? TODOS[id].desenhar : TODOS[id].longe; f = base_ && ((g, v) => base_(g, v, planta)); }
      const lista = f ? modelo(g => f(g, velha ? 1 : 0), nivel !== 'longe') : null;
      guardados.set(chave, lista && lista.length ? new Float32Array(lista) : null);
    }
    return guardados.get(chave);
  }

  /* ================================================================ distribuição */
  const URBANAS = new Set(['residential', 'living_street', 'tertiary', 'unclassified', 'secondary']);
  const PESOS = [['casa_telha', 30], ['casa_laje', 27], ['sobrado', 13], ['quatro_aguas', 12], ['obra', 12], ['comercio', 6]];
  const SOMA = PESOS.reduce((s, p) => s + p[1], 0);
  const escolhe = r => { let a = r * SOMA; for (const [id, p] of PESOS){ if ((a -= p) <= 0) return id; } return PESOS[0][0]; };
  /* número 0..1 que depende só do lugar: editar um canto do mapa não muda o resto */
  const noLugar = (x, z, s) => sorteioN(Math.round(x * 2), Math.round(z * 2), s);
  const chaveDe = o => `${o.id}|${Math.round(o.x * 2)}|${Math.round(o.z * 2)}`;

  /* retângulos girados: cantos e teste de sobreposição (eixos separadores) */
  function cantos(x, z, w, d, rot){ const c = Math.cos(rot), s = Math.sin(rot); return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([a, b]) => [x + a * c + b * s, z - a * s + b * c]); }
  function sobrepoem(A, B){
    for (const P of [A, B]) for (let i = 0; i < 2; i++){
      const ex = P[i + 1][0] - P[i][0], ez = P[i + 1][1] - P[i][1], eixo = [-ez, ex];
      const proj = Q => Q.map(p => p[0] * eixo[0] + p[1] * eixo[1]);
      const a = proj(A), b = proj(B);
      if (Math.max(...a) < Math.min(...b) || Math.max(...b) < Math.min(...a)) return false;
    }
    return true;
  }
  function grade(tam){
    const m = new Map(), k = (i, j) => i * 100003 + j;
    return {
      poe(o, x, z, r){ for (let i = Math.floor((x - r) / tam); i <= Math.floor((x + r) / tam); i++) for (let j = Math.floor((z - r) / tam); j <= Math.floor((z + r) / tam); j++){ const c = k(i, j); (m.get(c) || m.set(c, []).get(c)).push(o); } },
      perto(x, z, r){ const out = new Set(); for (let i = Math.floor((x - r) / tam); i <= Math.floor((x + r) / tam); i++) for (let j = Math.floor((z - r) / tam); j <= Math.floor((z + r) / tam); j++) for (const o of m.get(k(i, j)) || []) out.add(o); return out; },
    };
  }

  function gerar(){
    const {M, m, MEIO, CM, C} = Mundo, cfg = m.povo, saida = [];
    if (!cfg.ativo && !cfg.manuais.length) return {lista:[], solidos:grade(16), contagem:{casas:0, plantas:0, rua:0}};
    const velho = cfg.estado === 'abandonado', S = cfg.semente * 101;
    const removidos = new Set(cfg.removidos);
    const celula = (x, z) => Math.max(0, Math.min(C - 1, ((z + MEIO) / CM) | 0)) * C + Math.max(0, Math.min(C - 1, ((x + MEIO) / CM) | 0));
    const dentro = (x, z, folga = 6) => Math.abs(x) < MEIO - folga && Math.abs(z) < MEIO - folga;
    const viaEm = (x, z) => { const mat = m.mat[celula(x, z)]; return mat === M.asfalto || mat === M.calcada || mat === M.rua_terra; };
    const molhado = (x, z) => m.agua[celula(x, z)] > 0;
    const solidos = grade(16);                                    /* casas e muros: ocupação e colisão */
    const junta = o => { if (!removidos.has(chaveDe(o))){ saida.push(o); return true; } return false; };

    /* o retângulo está livre de rua, água e de outras casas? devolve a altura do terreno nos cantos */
    function livre(x, z, w, d, rot, folga){
      if (!dentro(x, z, 10)) return null;
      const c = Math.cos(rot), s = Math.sin(rot); let lo = 1e9, hi = -1e9;
      for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++){
        const a = (i / 4 - .5) * (w + folga), b = (j / 4 - .5) * (d + folga), px = x + a * c + b * s, pz = z - a * s + b * c;
        if (viaEm(px, pz) || molhado(px, pz)) return null;
        const y = Mundo.altura(px, pz); if (y < lo) lo = y; if (y > hi) hi = y;
      }
      if (hi - lo > 2.6) return null;                             /* barranco demais: os degraus da porta não alcançam */
      const q = cantos(x, z, w + .35, d + .35, rot);
      for (const o of solidos.perto(x, z, Math.max(w, d))) if (sobrepoem(q, o.cantos)) return null;
      return {lo, hi};
    }
    const trechosDeRua = new Map(), GR = 16, kg = (i, j) => i * 100003 + j;
    for (const r of m.ruas) for (let i = 0; i + 1 < r.pts.length; i++){
      const [ax, az] = r.pts[i], [bx, bz] = r.pts[i + 1], s = {ax, az, bx, bz, borda:r.largura / 2 + (r.calcada ? 2.27 : .8)};
      for (let gi = Math.floor((Math.min(ax, bx) - 14) / GR); gi <= Math.floor((Math.max(ax, bx) + 14) / GR); gi++) for (let gj = Math.floor((Math.min(az, bz) - 14) / GR); gj <= Math.floor((Math.max(az, bz) + 14) / GR); gj++){ const k = kg(gi, gj); (trechosDeRua.get(k) || trechosDeRua.set(k, []).get(k)).push(s); }
    }
    const invade = (x, z) => (trechosDeRua.get(kg(Math.floor(x / GR), Math.floor(z / GR))) || []).some(s => { const dx = s.bx - s.ax, dz = s.bz - s.az, t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(x - s.ax - dx * t, z - s.az - dz * t) < s.borda; });
    function naBeira(x, z, w, d, rot){
      if (!dentro(x, z, 10)) return null;
      const c = Math.cos(rot), s = Math.sin(rot); let lo = 1e9, hi = -1e9;
      for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++){
        const a = (i / 6 - .5) * (w + .1), b = (j / 6 - .5) * d, px = x + a * c + b * s, pz = z - a * s + b * c;
        const mat = m.mat[celula(px, pz)];
        if (mat === M.asfalto || mat === M.rua_terra || molhado(px, pz) || invade(px, pz)) return null;
        const y = Mundo.altura(px, pz); if (y < lo) lo = y; if (y > hi) hi = y;
      }
      if (hi - lo > 2.6) return null;
      const q = cantos(x, z, w + .12, d + .12, rot);
      for (const o of solidos.perto(x, z, Math.max(w, d))) if (sobrepoem(q, o.cantos)) return null;
      return {lo, hi};
    }
    const solido = o => { o.cantos = cantos(o.x, o.z, o.w, o.d, o.rot); solidos.poe(o, o.x, o.z, Math.hypot(o.w, o.d) / 2 + .5); };
    const ocupa = o => { o.cantos = cantos(o.x, o.z, o.w, o.d, o.rot); solidos.poe(o, o.x, o.z, Math.hypot(o.w, o.d) / 2 + .5); };

    /* percorre uma rua: devolve ponto e direção a cada distância */
    function caminho(pts){
      const seg = []; let total = 0;
      for (let i = 0; i + 1 < pts.length; i++){ const dx = pts[i + 1][0] - pts[i][0], dz = pts[i + 1][1] - pts[i][1], len = Math.hypot(dx, dz); if (len > .01){ seg.push({a:pts[i], dx:dx / len, dz:dz / len, ini:total, len}); total += len; } }
      return {total, em(dist){ let s = seg[seg.length - 1]; for (const q of seg) if (dist <= q.ini + q.len){ s = q; break; } const t = dist - s.ini; return {x:s.a[0] + s.dx * t, z:s.a[1] + s.dz * t, dx:s.dx, dz:s.dz}; }};
    }

    let casas = 0, plantas = 0, itens = 0;
    if (cfg.ativo){
      const urbanas = m.ruas.filter(r => URBANAS.has(r.tipo));
      /* ---- casas e muros, dos dois lados das ruas */
      if (cfg.casas > 0) for (const rua of urbanas){
        const cam = caminho(rua.pts); if (cam.total < 14) continue;
        for (const lado of [1, -1]){
          let d = 3;
          while (d < cam.total - 4){
            const p0 = cam.em(d), semente = S + lado * 7;
            const larguraLote = 8.2 + noLugar(p0.x, p0.z, semente + 1) * 2.2;
            const meio = cam.em(Math.min(cam.total, d + larguraLote / 2));
            const nx = -meio.dz * lado, nz = meio.dx * lado;                      /* para fora da rua */
            const beira = rua.largura / 2 + (rua.calcada ? 1.8 : .6);
            if (noLugar(meio.x, meio.z, semente + 2) > cfg.casas){ d += larguraLote; continue; }
            let id = escolhe(noLugar(meio.x, meio.z, semente + 3));
            const planta = plantaSorteada(id, noLugar(meio.x, meio.z, semente + 40)), tipo = Casas.PLANTAS[planta], recuo = id === 'comercio' ? 1.25 : 1.7 + noLugar(meio.x, meio.z, semente + 4) * 1.9;
            const rot = Math.atan2(-nx, -nz);      /* a frente olha para a rua */
            let x, z, lugar = null, encostada = false, vao = 0, ladoVao = 1;
            /* 1ª tentativa: fachada na beira do passeio. Só vale se a porta ficar quase no nível da calçada */
            if (rua.calcada && noLugar(meio.x, meio.z, semente + 50) < .78){
              const sobra = larguraLote - tipo.w - .2;
              ladoVao = noLugar(meio.x, meio.z, semente + 51) < .5 ? 1 : -1; vao = sobra >= 1.7 ? Math.min(3.2, sobra) : 0;
              const desvio = vao ? -ladoVao * vao / 2 : 0;
              for (const folga of [.52, .72, .95]){
                const dist = beira + folga + tipo.d / 2, cx = meio.x + nx * dist + meio.dx * desvio, cz = meio.z + nz * dist + meio.dz * desvio;
                const l = naBeira(cx, cz, tipo.w, tipo.d, rot); if (!l) continue;
                const porta = tipo.fora.f.find(v => v.porta), f = tipo.d / 2 + .35, px = cx + porta.c * Math.cos(rot) + f * Math.sin(rot), pz = cz - porta.c * Math.sin(rot) + f * Math.cos(rot);
                if (l.hi + .1 - (Mundo.altura(px, pz) + .15) > .62) continue;      /* ficaria alto demais: os degraus tomariam o passeio */
                x = cx; z = cz; lugar = l; encostada = true; break;
              }
            }
            if (!lugar){
              const dist = beira + recuo + tipo.d / 2; x = meio.x + nx * dist; z = meio.z + nz * dist;
              lugar = livre(x, z, tipo.w, tipo.d, rot, 1.1);
            }
            if (!lugar){ d += 3.2; continue; }
            /* a escada da porta precisa alcançar o chão: se o terreno cai demais ali na frente, não dá para entrar */
            { const porta = tipo.fora.f.find(v => v.porta), c_ = Math.cos(rot), s_ = Math.sin(rot);
              const queda = Math.max(...[1.2, 2.5, 3.1].map(f => { const b = tipo.d / 2 + f; return lugar.hi + .1 - Mundo.altura(x + porta.c * c_ + b * s_, z - porta.c * s_ + b * c_); }));
              if (queda > 2.6){ d += 3.2; continue; } }
            const casa = {id, planta, cat:'casa', x, z, y:lugar.hi + .04, rot, w:tipo.w, d:tipo.d, h:CASAS[id].h, cor:Math.floor(noLugar(x, z, S + 5) * TINTAS.length), velha:velho && noLugar(x, z, S + 6) < .82, sx:1};
            casa.encostada = encostada; casa.frente = encostada ? 0 : recuo - .42;
            if (junta(casa)){
              ocupa(casa); casas++;
              if (encostada && vao){
                /* o vão do lado vira garagem, alinhada com a fachada */
                const cr = Math.cos(rot), sr = Math.sin(rot), tx = meio.dx, tz = meio.dz, longe_ = tipo.w / 2 + vao / 2 + .03, frente_ = tipo.d / 2 - .14;
                const gx = x + tx * ladoVao * longe_ + sr * frente_, gz = z + tz * ladoVao * longe_ + cr * frente_;
                const g_ = {id:'garagem', cat:'rua', x:gx, z:gz, y:Mundo.altura(gx, gz), rot, w:vao, d:.22, cor:casa.cor, velha:casa.velha, sx:vao / 2.4, variante:1 + Math.floor(noLugar(x, z, S + 52) * 3) % 3};
                const q_ = cantos(gx, gz, vao - .1, .22, rot);
                if (!viaEm(gx, gz) && !molhado(gx, gz) && ![...solidos.perto(gx, gz, 5)].some(o => o !== casa && sobrepoem(q_, o.cantos)) && junta(g_)){ itens++; g_.cantos = cantos(gx, gz, vao, .24, rot); solidos.poe(g_, gx, gz, 3); }
              }
              if (!encostada && id !== 'comercio' && noLugar(x, z, S + 8) < .72){
                const mx = meio.x + nx * (beira + .35), mz = meio.z + nz * (beira + .35);
                const muro = {id:'muro', cat:'rua', x:mx, z:mz, y:Mundo.altura(mx, mz), rot, w:8, d:.22, cor:(casa.cor + (noLugar(x, z, S + 9) < .5 ? 0 : 3)) % TINTAS.length, velha:casa.velha, sx:Math.min(1.12, (larguraLote - .35) / 8)};
                muro.variante = 1 + Math.floor(noLugar(x, z, S + 41) * 4) % 4;      /* 1 a 4: o desenho usa variante - 1 */
                /* o portão fica na frente da porta: nas plantas com a porta do outro lado, o muro é espelhado */
                if (tipo.fora.f.find(v => v.porta).c > 0){ muro.espelho = true; }
                muro.w = 8 * muro.sx; if (muro.espelho) muro.sx = -muro.sx; if (!viaEm(mx, mz) && junta(muro)){ itens++; muro.cantos = cantos(mx, mz, muro.w, .3, rot); muro.vao = true; solidos.poe(muro, mx, mz, 4.6); }
              }
            }
            d += Math.max(larguraLote, tipo.w + 1);
          }
        }
      }
      /* ---- itens de rua: postes e latões na calçada; abandonados: carros, entulho, sacos de lixo e barricadas */
      if (cfg.rua > 0) for (const rua of m.ruas){
        const cam = caminho(rua.pts); if (cam.total < 20) continue;
        const urbana = URBANAS.has(rua.tipo);
        if (urbana) for (let d = 9; d < cam.total - 5; d += 31){
          const p = cam.em(d), off = rua.largura / 2 + (rua.calcada ? 1.2 : .6), x = p.x - p.dz * off, z = p.z + p.dx * off;
          if (!dentro(x, z) || molhado(x, z) || m.mat[celula(x, z)] === M.asfalto || noLugar(x, z, S + 11) > .35 + cfg.rua * .65) continue;
          if (junta({id:'poste', cat:'rua', x, z, y:Mundo.altura(x, z), rot:Math.atan2(p.dz, -p.dx), cor:0, velha:false, sx:1})) itens++;
        }
        /* latão de lixo: numa rua comum ainda de pé; abandonado, metade some e o resto enferruja */
        if (urbana) for (let d = 22; d < cam.total - 6; d += 37){
          const p = cam.em(d), chance = velho ? .5 : .85; if (noLugar(p.x, p.z, S + 26) > chance) continue;
          const off = rua.largura / 2 + (rua.calcada ? .5 : .15), x = p.x - p.dz * off, z = p.z + p.dx * off;
          if (!dentro(x, z) || molhado(x, z) || m.mat[celula(x, z)] === M.asfalto) continue;
          if (junta({id:'latao_lixo', cat:'rua', x, z, y:Mundo.altura(x, z) + (typeof Passeio === 'object' ? Math.max(0, Passeio.degrau(x, z)) : 0), rot:Math.atan2(p.dz, -p.dx) + (noLugar(x, z, S + 27) - .5) * .6, cor:0, velha:velho, sx:1})) itens++;
        }
        if (velho && (urbana || rua.tipo === 'trunk')) for (let d = 14; d < cam.total - 8; d += 19){
          const p = cam.em(d), r = noLugar(p.x, p.z, S + 13); if (r > cfg.rua * .38) continue;
          const lado = noLugar(p.x, p.z, S + 14) < .5 ? -1 : 1, off = (rua.largura / 2 - 1.4) * lado, x = p.x - p.dz * off, z = p.z + p.dx * off;
          if (!dentro(x, z) || molhado(x, z)) continue;
          const sorte = noLugar(x, z, S + 15), id = sorte < .5 ? 'carro' : sorte < .76 ? 'entulho' : sorte < .91 ? 'saco_lixo' : 'barricada';
          const giro = Math.atan2(p.dx, p.dz) + (id === 'barricada' ? Math.PI / 2 : (noLugar(x, z, S + 16) - .5) * (sorte < .15 ? 2.6 : .5));
          const item = {id, cat:'rua', x, z, y:Mundo.altura(x, z) + .03, rot:giro, cor:Math.floor(noLugar(x, z, S + 17) * TINTAS.length), velha:false, sx:1};
          if (id === 'carro'){ item.variante = CarrosMundo.variante(noLugar(x, z, S + 18), noLugar(x, z, S + 19)); item.y -= .02; Object.assign(item, CarrosMundo.tamanho(item.variante)); }
          if (junta(item)){ itens++; if (id === 'carro') solido(item); }
        }
      }
      /* ---- vegetação: grade com tremor; o que nasce depende do chão */
      if (cfg.vegetacao > 0){
        const passo = 6.4, n = Math.floor(Mundo.LADO / passo), v = cfg.vegetacao;
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){
          const x = -MEIO + (i + .5 + (sorteioN(i, j, S + 21) - .5) * .85) * passo, z = -MEIO + (j + .5 + (sorteioN(i, j, S + 22) - .5) * .85) * passo;
          const r = sorteioN(i, j, S + 23); if (r > v) continue;                       /* controle geral de densidade */
          if (!dentro(x, z, 4) || viaEm(x, z) || molhado(x, z)) continue;
          const mat = Mundo.materialEm(x, z), q = sorteioN(i, j, S + 24), tipoR = sorteioN(i, j, S + 25);
          const margem = !m.agua[celula(x, z)] && (molhado(x + 9, z) || molhado(x - 9, z) || molhado(x, z + 9) || molhado(x, z - 9));
          let id = null;
          if (margem) id = q < .5 ? (tipoR < .55 ? 'arvore' : tipoR < .75 ? 'bananeira' : 'mangueira') : q < .7 ? 'arbusto' : null;
          else if (mat === M.mata) id = q < .72 ? (Mundo.ruido2(x / 120, z / 120, 51) > .62 ? 'eucalipto' : tipoR < .78 ? 'arvore' : tipoR < .9 ? 'mangueira' : tipoR < .95 ? 'ipe_amarelo' : 'ipe_roxo') : q < .86 ? 'arbusto' : null;
          else if (mat === M.grama || mat === M.grama_seca) id = q < .035 ? (tipoR < .62 ? 'arvore' : tipoR < .76 ? 'mangueira' : tipoR < .9 ? 'ipe_amarelo' : 'ipe_roxo') : q < .08 ? 'arbusto' : q < (velho ? .3 : .16) ? 'capim' : null;
          else if (mat === M.terra || mat === M.terra_vermelha) id = q < .05 ? 'arbusto' : q < .14 ? 'capim' : null;
          if (!id) continue;
          const P = PLANTAS[id], folga = P.miudo ? .4 : P.copa * .86;     /* a copa não pode atravessar a parede para dentro da casa */
          let bate = false;
          for (const o of solidos.perto(x, z, folga + 1)) if (sobrepoem(cantos(x, z, folga * 2, folga * 2, 0), o.cantos)){ bate = true; break; }
          if (bate) continue;
          if (junta({id, cat:'planta', x, z, y:Mundo.altura(x, z), rot:sorteioN(i, j, S + 26) * Math.PI * 2, cor:0, velha:false, sx:1})) plantas++;
        }
        /* plantas de quintal, atrás de algumas casas */
        for (const casa of saida.filter(o => o.cat === 'casa')){
          const r = noLugar(casa.x, casa.z, S + 31); if (r > .42 * v + .1) continue;
          const q = noLugar(casa.x, casa.z, S + 33), especie = q < .55 ? 'bananeira' : q < .85 ? 'mangueira' : 'arbusto', raioCopa = PLANTAS[especie].copa * .86;
          const atras = casa.d / 2 + raioCopa + .3, ao = (noLugar(casa.x, casa.z, S + 32) - .5) * casa.w, c = Math.cos(casa.rot), s = Math.sin(casa.rot);
          const x = casa.x + ao * c - atras * s, z = casa.z - ao * s - atras * c;
          if (!dentro(x, z) || viaEm(x, z) || molhado(x, z)) continue;
          let bate = false; for (const o of solidos.perto(x, z, raioCopa + 1)) if (sobrepoem(cantos(x, z, raioCopa * 2, raioCopa * 2, 0), o.cantos)){ bate = true; break; }
          if (!bate && junta({id:especie, cat:'planta', x, z, y:Mundo.altura(x, z), rot:q * 6, cor:0, velha:false, sx:1})) plantas++;
        }
      }
    }
    /* ---- colocados à mão: entram sempre, mesmo sem o povoamento automático */
    for (const a of cfg.manuais){
      if (!Object.prototype.hasOwnProperty.call(TODOS, a.id) || !isFinite(a.x) || !isFinite(a.z)) continue;
      const cat = CATEGORIA(a.id), planta = cat === 'casa' ? plantaSorteada(a.id, noLugar(a.x, a.z, 77)) : undefined;
      const t = planta ? {...Casas.PLANTAS[planta], h:CASAS[a.id].h} : TODOS[a.id];
      let y = Mundo.altura(a.x, a.z);
      if (cat === 'casa') for (const [px, pz] of cantos(a.x, a.z, t.w, t.d, a.rot)) y = Math.max(y, Mundo.altura(px, pz));
      const o = {id:a.id, planta, cat, x:a.x, z:a.z, y:y + (cat === 'casa' ? .04 : 0), rot:a.rot, w:t.w, d:t.d, h:t.h, cor:a.cor % TINTAS.length, velha:velho && (cat === 'casa' || a.id === 'muro'), sx:1, manual:true};
      if (a.id === 'carro'){ o.variante = CarrosMundo.variante(noLugar(a.x, a.z, 78), noLugar(a.x, a.z, 79)); Object.assign(o, CarrosMundo.tamanho(o.variante)); o.cantos = cantos(o.x, o.z, o.w, o.d, o.rot); solidos.poe(o, o.x, o.z, Math.hypot(o.w, o.d) / 2 + .5); }
      saida.push(o); if (cat === 'casa'){ ocupa(o); casas++; } else if (cat === 'planta') plantas++; else itens++;
    }
    return {lista:saida, solidos, contagem:{casas, plantas, rua:itens}};
  }

  /* ---------------------------------------------------------- colisão de quem caminha: paredes e móveis das casas, muros */
  function empurrar(res, x, z, nivel = 0, raio = Casas.RAIO){
    for (const o of res.solidos.perto(x, z, 9)){
      const c = Math.cos(o.rot), s = Math.sin(o.rot), dx = x - o.x, dz = z - o.z;
      let a = dx * c - dz * s; let b = dx * s + dz * c;                         /* posição vista pelo objeto */
      if (o.planta){
        if (Math.abs(a) >= o.w / 2 + raio || Math.abs(b) >= o.d / 2 + raio) continue;
        const [na, nb] = Casas.afasta(Casas.paredes(o.planta, Casas.PLANTAS[o.planta].sobrado ? nivel : 0, o.velha && o.id !== 'obra'), a, b, raio);
        if (na !== a || nb !== b) [x, z] = Casas.paraMundo(o, na, nb);
        continue;
      }
      const meiaL = o.w / 2 + raio, meiaP = (o.vao ? .22 : o.d) / 2 + raio;
      if (Math.abs(a) >= meiaL || Math.abs(b) >= meiaP) continue;
      if (o.vao){ const sinal = o.espelho ? -1 : 1, escala = Math.abs(o.sx), portao = -.6 * escala * sinal; if (Math.abs(a - portao) < .9 * escala - raio * .6) continue; }       /* dá para passar pelo portão */
      if (meiaL - Math.abs(a) < meiaP - Math.abs(b)) a = Math.sign(a || 1) * meiaL; else b = Math.sign(b || 1) * meiaP;
      x = o.x + a * c + b * s; z = o.z - a * s + b * c;
    }
    return [x, z];
  }
  /* chão sob quem caminha: piso, escada ou degrau de uma casa; fora disso, o terreno */
  function chao(res, x, z, nivel = 0){
    const terreno = Mundo.altura(x, z);
    if (res.solidos) for (const o of res.solidos.perto(x, z, 8)){
      if (!o.planta) continue;
      const [a, b] = Casas.paraLocal(o, x, z), c = Casas.chaoLocal(o, a, b, nivel);
      if (!c) continue;
      if (c.degrau) return {y:Math.max(terreno, c.y), nivel:0, casa:null};
      return {y:c.y, nivel:c.nivel, casa:o, escada:!!c.escada};
    }
    return {y:terreno, nivel:0, casa:null};
  }

  return {TINTAS, CASAS, PLANTAS, RUA, TODOS, CATEGORIA, URBANAS, vertices, modeloDe, gerar, empurrar, chao, chaveDe, cantos, sobrepoem};
})();
