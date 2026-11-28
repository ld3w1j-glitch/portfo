/* Exportação: arquivo GLB (glTF 2.0) e o pacote para jogo, com o mapa em blocos, cada modelo guardado uma vez,
   a lista de posições e os dados de colisão. Metros; Y para cima; +X = leste; +Z = sul. Não usa a página. */
const Pacote = (() => {
  const BLOCO = 256;
  const lin = v => { v /= 255; return Math.round((v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)) * 255); };
  const tintaRGB = cor => { const h = Povoar.TINTAS[cor] || Povoar.TINTAS[0]; return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 232); };
  const creditos = temRuas => 'Relevo: SRTM data courtesy of the U.S. Geological Survey' + (temRuas ? '; ruas: © OpenStreetMap contributors' : '');
  const n3 = v => Math.round(v * 1000) / 1000;

  /* ---------------------------------------------------------------- um arquivo GLB sendo montado */
  function novoGLB(temRuas){
    const gltf = {asset:{version:'2.0', generator:'Gerador de mundo WO', copyright:creditos(temRuas)}, scene:0, scenes:[{nodes:[]}], nodes:[], meshes:[],
      materials:[{name:'terreno', pbrMetallicRoughness:{metallicFactor:0, roughnessFactor:1}}, {name:'agua', alphaMode:'BLEND', doubleSided:true, pbrMetallicRoughness:{metallicFactor:0, roughnessFactor:.2}}], accessors:[], bufferViews:[], buffers:[]};
    const partes = []; let tamanho = 0;
    const acessor = (dados, tipo, comp, alvo, extra = {}) => {
      const bytes = new Uint8Array(dados.buffer); gltf.bufferViews.push({buffer:0, byteOffset:tamanho, byteLength:bytes.length, target:alvo}); partes.push(bytes); tamanho += bytes.length;
      const resto = (4 - tamanho % 4) % 4; if (resto){ partes.push(new Uint8Array(resto)); tamanho += resto; }
      gltf.accessors.push(Object.assign({bufferView:gltf.bufferViews.length - 1, componentType:comp, count:dados.length / (tipo === 'VEC3' ? 3 : tipo === 'VEC4' ? 4 : 1), type:tipo}, extra)); return gltf.accessors.length - 1;
    };
    const limites = pos => { const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (let i = 0; i < pos.length; i++){ const j = i % 3; if (pos[i] < lo[j]) lo[j] = pos[i]; if (pos[i] > hi[j]) hi[j] = pos[i]; } return {min:lo, max:hi}; };
    const atributos = (pos, nor, cor) => ({POSITION:acessor(pos, 'VEC3', 5126, 34962, limites(pos)), NORMAL:acessor(nor, 'VEC3', 5126, 34962), COLOR_0:acessor(cor, 'VEC4', 5121, 34962, {normalized:true})});
    const no = (nome, malha, extra = {}) => { gltf.scenes[0].nodes.push(gltf.nodes.length); gltf.nodes.push({name:nome, mesh:malha, ...extra}); };
    const malha = (nome, primitivas) => { gltf.meshes.push({name:nome, primitives:primitivas}); return gltf.meshes.length - 1; };

    /* as faces chegam como dois triângulos (6 pontos); no arquivo ficam 4 pontos e os índices, sem perder detalhe */
    function emQuadros(P, Nr, Co){
      const q = P.length / 18, pos = new Float32Array(q * 12), nor = new Float32Array(q * 12), cor = new Uint8Array(q * 16), curto = q * 4 < 65535, idx = new (curto ? Uint16Array : Uint32Array)(q * 6);
      for (let i = 0; i < q; i++){
        [0, 1, 2, 5].forEach((v, w) => { const de = i * 6 + v, para = i * 4 + w; for (let j = 0; j < 3; j++){ pos[para * 3 + j] = P[de * 3 + j]; nor[para * 3 + j] = Nr[de * 3 + j]; } for (let j = 0; j < 4; j++) cor[para * 4 + j] = Co[de * 4 + j]; });
        /* a face tem de apontar para o mesmo lado da normal, senão aparece escura ou some em programas de jogo */
        const b = i * 12, ux = pos[b + 3] - pos[b], uy = pos[b + 4] - pos[b + 1], uz = pos[b + 5] - pos[b + 2], vx = pos[b + 6] - pos[b], vy = pos[b + 7] - pos[b + 1], vz = pos[b + 8] - pos[b + 2];
        const virada = (uy * vz - uz * vy) * nor[b] + (uz * vx - ux * vz) * nor[b + 1] + (ux * vy - uy * vx) * nor[b + 2] < 0;
        idx.set((virada ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3]).map(v => i * 4 + v), i * 6);
      }
      return {atributos:atributos(pos, nor, cor), indices:acessor(idx, 'SCALAR', curto ? 5123 : 5125, 34963)};
    }

    /* terreno e água dos pedaços [pi0, pi0+nx) x [pj0, pj0+nz), com voxel de s metros, relativos à origem */
    function terreno(pi0, pj0, nx, nz, s, origem){
      const [ox, oy, oz] = origem, camadas = [{nome:'terreno', pos:[], nor:[], cor:[], idx:[]}, {nome:'agua', pos:[], nor:[], cor:[], idx:[]}];
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++){
        const v = Mundo.voxeis(pi0 + i, pj0 + j, s), T = camadas[0], base = T.pos.length / 3;
        for (let k = 0; k < v.pos.length; k += 3){ T.pos.push(v.pos[k] - ox, v.pos[k + 1] - oy, v.pos[k + 2] - oz); T.nor.push(v.nor[k], v.nor[k + 1], v.nor[k + 2]); T.cor.push(lin(v.cor[k]), lin(v.cor[k + 1]), lin(v.cor[k + 2]), 255); }
        for (const q of v.idx) T.idx.push(base + q);
        const W = camadas[1], ba = W.pos.length / 3;
        for (let k = 0; k < v.aguaPos.length; k += 3){ W.pos.push(v.aguaPos[k] - ox, v.aguaPos[k + 1] - oy, v.aguaPos[k + 2] - oz); W.nor.push(0, 1, 0); W.cor.push(lin(62), lin(112), lin(126), 205); }
        for (const q of v.aguaIdx) W.idx.push(ba + q);
      }
      camadas.forEach((T, mi) => { if (T.idx.length) no(T.nome, malha(T.nome, [{attributes:atributos(new Float32Array(T.pos), new Float32Array(T.nor), new Uint8Array(T.cor)), indices:acessor(new Uint32Array(T.idx), 'SCALAR', 5125, 34963), material:mi}])); });
    }

    /* passeio, meio-fio, faixa da rua e fios */
    let materialPasseio = -1;
    function passeio(pi0, pj0, nx, nz, origem){
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++){
        const v = Passeio.gerar((pj0 + j) * Mundo.PEDACOS + pi0 + i, 1); if (!v) continue;
        if (materialPasseio < 0){ gltf.materials.push({name:'passeio', doubleSided:true, pbrMetallicRoughness:{metallicFactor:0, roughnessFactor:1}}); materialPasseio = gltf.materials.length - 1; }
        const pos = new Float32Array(v.n * 3), cor = new Uint8Array(v.n * 4);
        for (let q = 0; q < v.n * 3; q++) pos[q] = v.pos[q] - origem[q % 3];
        for (let q = 0; q < v.n; q++){ for (let c = 0; c < 3; c++) cor[q * 4 + c] = lin(Math.round(v.cor[q * 3 + c] * 255)); cor[q * 4 + 3] = 255; }
        const g = emQuadros(pos, v.nor, cor);
        no(`passeio_${i}_${j}`, malha(`passeio_${i}_${j}`, [{attributes:g.atributos, indices:g.indices, material:materialPasseio}]));
      }
    }

    /* cada geometria é guardada uma vez só. As cores repetem a geometria e trocam apenas o material da parte pintada */
    const geometrias = new Map(), tintas = new Map(), malhas = new Map();
    const geometria = (modelo, nivel, velha) => {
      const chave = `${modelo}|${nivel}|${velha ? 1 : 0}`;
      if (!geometrias.has(chave)){
        const v = Povoar.vertices(modelo, nivel, velha);
        geometrias.set(chave, !v ? [] : [0, 1].map(pintada => {
          const P = [], Nr = [], Co = [];
          for (let i = 0; i < v.length; i += 10){
            if ((v[i + 9] ? 1 : 0) !== pintada) continue;
            for (let j = 0; j < 3; j++){ P.push(v[i + j]); Nr.push(v[i + 3 + j]); }
            Co.push(lin(v[i + 6]), lin(v[i + 7]), lin(v[i + 8]), 255);
          }
          return P.length ? {pintada, ...emQuadros(P, Nr, Co)} : null;
        }).filter(Boolean));
      }
      return geometrias.get(chave);
    };
    const materialDaTinta = (cor, velha) => {
      const chave = `${cor}|${velha ? 1 : 0}`;
      if (!tintas.has(chave)){
        gltf.materials.push({name:'tinta_' + chave.replace('|', '_'), pbrMetallicRoughness:{baseColorFactor:[...tintaRGB(cor).map(c => +Math.pow(Math.min(1, c * (velha ? .8 : 1)), 2.2).toFixed(4)), 1], metallicFactor:0, roughnessFactor:1}});
        tintas.set(chave, gltf.materials.length - 1);
      }
      return tintas.get(chave);
    };
    /* devolve {malha, nome} do objeto no nível pedido, ou null quando não há nada para desenhar */
    function malhaDoObjeto(o, nivel){
      const partes = geometria(Povoar.modeloDe(o), nivel, o.velha); if (!partes.length) return null;
      const temPintura = partes.some(p => p.pintada), chave = `${Povoar.modeloDe(o)}|${nivel}|${o.velha ? 1 : 0}|${temPintura ? o.cor : 0}`;
      if (!malhas.has(chave)){
        const nome = chave.replace(/\|/g, '_');
        malhas.set(chave, {nome, malha:malha(nome, partes.map(p => ({attributes:p.atributos, indices:p.indices, material:p.pintada ? materialDaTinta(o.cor, o.velha) : 0})))});
      }
      return malhas.get(chave);
    }

    function bytes(){
      gltf.buffers = [{byteLength:tamanho}];
      let json = new TextEncoder().encode(JSON.stringify(gltf)); const falta = (4 - json.length % 4) % 4;
      if (falta){ const j = new Uint8Array(json.length + falta).fill(32); j.set(json); json = j; }
      const total = 12 + 8 + json.length + 8 + tamanho, saida = new Uint8Array(total), dv = new DataView(saida.buffer);
      dv.setUint32(0, 0x46546C67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true); dv.setUint32(12, json.length, true); dv.setUint32(16, 0x4E4F534A, true); saida.set(json, 20);
      let o = 20 + json.length; dv.setUint32(o, tamanho, true); dv.setUint32(o + 4, 0x004E4942, true); o += 8; for (const b of partes){ saida.set(b, o); o += b.length; }
      return saida;
    }
    return {no, terreno, passeio, malhaDoObjeto, bytes};
  }

  const niveisDe = (o, interiores) => o.planta ? (interiores ? ['fora', 'dentro'] : ['fora']) : [o.id === 'carro' ? 'detalhe' : 'perto'];
  const posicao = (o, origem) => ({translation:[o.x - origem[0], o.y - origem[1], o.z - origem[2]], rotation:[0, Math.sin(o.rot / 2), 0, Math.cos(o.rot / 2)], ...(o.sx && o.sx !== 1 ? {scale:[o.sx, 1, 1]} : {})});

  /* um GLB só, com um quadrado do mapa e tudo o que está nele */
  function pedaco(lista, cx, cz, lado, op = {}){
    const {PEDACO, PEDACOS, MEIO} = Mundo, n = lado / PEDACO, pi0 = Math.max(0, Math.min(PEDACOS - n, Math.round((cx + MEIO) / PEDACO - n / 2))), pj0 = Math.max(0, Math.min(PEDACOS - n, Math.round((cz + MEIO) / PEDACO - n / 2)));
    const ox = (pi0 + n / 2) * PEDACO - MEIO, oz = (pj0 + n / 2) * PEDACO - MEIO, origem = [ox, Math.floor(Mundo.altura(ox, oz)), oz], g = novoGLB(op.temRuas);
    g.terreno(pi0, pj0, n, n, 1, origem); g.passeio(pi0, pj0, n, n, origem);
    let k = 0;
    for (const o of lista){
      if (Math.abs(o.x - ox) > lado / 2 || Math.abs(o.z - oz) > lado / 2) continue;
      k++;
      for (const nivel of niveisDe(o, op.interiores)){ const m = g.malhaDoObjeto(o, nivel); if (m) g.no(`${o.id}_${k}${nivel === 'dentro' ? '_interior' : ''}`, m.malha, posicao(o, origem)); }
    }
    return g.bytes();
  }

  /* ---------------------------------------------------------------- colisão: caixas, rampas e cilindros */
  function colisao(lista, origem){
    const caixas = [], rampas = [], cilindros = [];
    const [ox, oy, oz] = origem, P = (o, a, b) => { const [x, z] = Casas.paraMundo(o, a, b); return [n3(x - ox), n3(z - oz)]; };
    /* retângulo no referencial do objeto -> caixa no mundo: centro, meias medidas e giro em torno de Y */
    const caixa = (o, tipo, a0, a1, b0, b1, y0, y1) => { const [x, z] = P(o, (a0 + a1) / 2, (b0 + b1) / 2); caixas.push({tipo, centro:[x, n3((y0 + y1) / 2 - oy), z], meio:[n3((a1 - a0) / 2), n3((y1 - y0) / 2), n3((b1 - b0) / 2)], giro:n3(o.rot)}); };
    const rampa = (o, tipo, a, bBaixo, yBaixo, bAlto, yAlto, largura) => { const [x0, z0] = P(o, a, bBaixo), [x1, z1] = P(o, a, bAlto); rampas.push({tipo, inicio:[x0, n3(yBaixo - oy), z0], fim:[x1, n3(yAlto - oy), z1], largura:n3(largura)}); };
    for (const o of lista){
      if (o.planta){
        const p = Casas.PLANTAS[o.planta], velha = o.velha && o.id !== 'obra', piso = o.y + Casas.PISO;
        for (const nivel of p.sobrado ? [0, 1] : [0]){
          const base = piso + nivel * Casas.ANDAR;
          for (const r of Casas.paredes(o.planta, nivel, velha)){
            const alto = r.tipo === 'parede' ? Casas.ALT : r.tipo === 'guarda' ? 1 : r.tipo === 'bloco' ? Casas.ANDAR - .2 : .9;
            caixa(o, r.tipo === 'movel' ? 'movel_' + r.nome : r.tipo, r.x0, r.x1, r.z0, r.z1, base, base + alto);
          }
        }
        caixa(o, 'piso', -p.w / 2, p.w / 2, -p.d / 2, p.d / 2, o.y - .3, piso);
        if (p.sobrado){
          const e = p.escada, hw = p.w / 2 - .18, hd = p.d / 2 - .18, y = piso + Casas.ANDAR;
          for (const [a0, a1, b0, b1] of [[-hw, e.x0, -hd, hd], [e.x1, hw, -hd, hd], [Math.max(-hw, e.x0), Math.min(hw, e.x1), -hd, e.zTopo], [Math.max(-hw, e.x0), Math.min(hw, e.x1), e.zBase, hd]]) if (a1 - a0 > .05 && b1 - b0 > .05) caixa(o, 'piso_de_cima', a0, a1, b0, b1, y - .16, y);
          rampa(o, 'escada', (e.x0 + e.x1) / 2, e.zBase, piso, e.zTopo, piso + Casas.ANDAR, e.x1 - e.x0 - .3);
        }
        const porta = p.fora.f.find(v => v.porta), D = Casas.DEGRAU;
        rampa(o, 'degraus_da_porta', porta.c, p.d / 2 + D.quantos * D.fundo, piso - D.quantos * D.altura, p.d / 2, piso, Math.max(D.largura, porta.l + .5));
      } else if (o.id === 'muro'){
        const e = Math.abs(o.sx || 1), s = o.espelho ? -1 : 1, vao = -.6 * e * s, meia = .9 * e;
        for (const [a0, a1] of [[-4 * e, vao - meia], [vao + meia, 4 * e]]) if (a1 - a0 > .05) caixa(o, 'muro', a0, a1, -.11, .11, o.y - 1.5, o.y + 2.1);
      } else if (o.id === 'garagem' || o.id === 'carro' || o.id === 'barricada'){
        const d = Povoar.TODOS[o.id], w = o.w || d.w, f = o.id === 'garagem' ? .22 : o.d || d.d, h = o.h || d.h;
        caixa(o, o.id, -w / 2, w / 2, -f / 2, f / 2, o.id === 'garagem' ? o.y - 1.5 : o.y, o.y + h);
      } else {
        const d = Povoar.TODOS[o.id];
        if (d && d.r){ const [x, z] = P(o, 0, 0); cilindros.push({tipo:o.id, centro:[x, n3(o.y - oy), z], raio:d.r, altura:o.id === 'poste' ? 8 : 4}); }
      }
    }
    return {caixas, rampas, cilindros};
  }

  /* ---------------------------------------------------------------- pacote para jogo */
  const LEIA = (nome, lado, voxel, temRuas) => `PACOTE DE MAPA PARA JOGO - ${nome}
Área: ${lado} x ${lado} m, em blocos de até ${BLOCO} x ${BLOCO} m. Terreno com voxel de ${voxel} m.

Eixos (padrão glTF): metros, Y para cima, +X = leste, +Z = sul. Todas as posições partem da origem em manifesto.json.

terreno/bloco_C_L.glb   Terreno, água, passeio, meio-fio, faixa da rua e fios. Colocar na posição "posicao" do manifesto.
modelos/biblioteca.glb  Cada casa, planta, carro e item uma única vez, na origem. O nome do nó é o nome do modelo.
instancias.json         Onde repetir cada modelo: posicao [x,y,z], giro (radianos em torno de Y) e escalaX
                        (negativa = espelhado: no motor, ajuste a orientação das faces ou desligue o descarte de faces).
                        "longe" é o modelo simples para usar a distância, quando existe.
colisao.json            caixas: centro, meio (metade das medidas em X, Y, Z antes do giro) e giro.
                        rampas: ponto de baixo, ponto de cima e largura. cilindros: base, raio e altura.
                        O terreno e o passeio usam a própria malha como colisão.
conferencia.json        Problemas que a conferência encontrou na hora da exportação.
territorios.json        Só quando o mapa foi dividido em zonas: dono, vizinhas, ponto de base e uma grade que diz a zona
                        de cada ponto. O importador do Unity ainda não usa este arquivo.

Créditos obrigatórios no jogo: ${creditos(temRuas)}.
`;

  /* monta os arquivos do pacote. op = {lado, cx, cz, nome, temRuas, interiores, problemas, territorios} */
  function arquivos(lista, op){
    const {PEDACO, PEDACOS, MEIO, LADO} = Mundo, lado = Math.min(op.lado, LADO), n = lado / PEDACO, porBloco = BLOCO / PEDACO;
    const pi0 = Math.max(0, Math.min(PEDACOS - n, Math.round((op.cx + MEIO) / PEDACO - n / 2))), pj0 = Math.max(0, Math.min(PEDACOS - n, Math.round((op.cz + MEIO) / PEDACO - n / 2)));
    const x0 = pi0 * PEDACO - MEIO, z0 = pj0 * PEDACO - MEIO, ox = x0 + lado / 2, oz = z0 + lado / 2, origem = [ox, Math.floor(Mundo.altura(ox, oz)), oz], voxel = lado > 512 ? 2 : 1;
    const dentro = lista.filter(o => o.x >= x0 && o.x < x0 + lado && o.z >= z0 && o.z < z0 + lado);
    const saida = [], blocos = [];
    for (let bj = 0; bj < Math.ceil(n / porBloco); bj++) for (let bi = 0; bi < Math.ceil(n / porBloco); bi++){
      const i = pi0 + bi * porBloco, j = pj0 + bj * porBloco, nx = Math.min(porBloco, pi0 + n - i), nz = Math.min(porBloco, pj0 + n - j);
      const centro = [(i + nx / 2) * PEDACO - MEIO, origem[1], (j + nz / 2) * PEDACO - MEIO], g = novoGLB(op.temRuas);
      g.terreno(i, j, nx, nz, voxel, centro); g.passeio(i, j, nx, nz, centro);
      const arquivo = `terreno/bloco_${bi}_${bj}.glb`;
      saida.push([arquivo, g.bytes()]);
      blocos.push({arquivo, coluna:bi, linha:bj, posicao:[n3(centro[0] - origem[0]), 0, n3(centro[2] - origem[2])], tamanho:[nx * PEDACO, nz * PEDACO]});
    }
    const biblioteca = novoGLB(op.temRuas), naBiblioteca = new Set(), itens = [];
    const registra = (o, nivel) => { const m = biblioteca.malhaDoObjeto(o, nivel); if (m && !naBiblioteca.has(m.nome)){ naBiblioteca.add(m.nome); biblioteca.no(m.nome, m.malha); } return m ? m.nome : null; };
    dentro.forEach((o, k) => {
      const longe = o.id === 'capim' || o.id === 'entulho' ? null : registra(o, 'longe');
      for (const nivel of niveisDe(o, op.interiores)){
        const modelo = registra(o, nivel); if (!modelo) continue;
        itens.push({id:k, tipo:o.id, modelo, ...(nivel === 'dentro' ? {interior:true} : longe ? {longe} : {}), posicao:[n3(o.x - origem[0]), n3(o.y - origem[1]), n3(o.z - origem[2])], giro:n3(o.rot), escalaX:n3(o.sx || 1)});
      }
    });
    saida.push(['modelos/biblioteca.glb', biblioteca.bytes()]);
    const col = colisao(dentro, origem);
    const noPacote = (op.problemas || []).filter(p => p.x >= x0 && p.x < x0 + lado && p.z >= z0 && p.z < z0 + lado);
    const manifesto = {nome:op.nome, versao:1, creditos:creditos(op.temRuas), area:lado, voxel, origemNoMundo:origem.map(n3), blocos, modelos:naBiblioteca.size, instancias:itens.length, objetos:dentro.length, colisao:{caixas:col.caixas.length, rampas:col.rampas.length, cilindros:col.cilindros.length}};
    if (op.territorios){
      const t = Territorios.exportar(op.territorios, {x0, z0, lado, origem});
      manifesto.zonas = t.zonas.length; saida.push(['territorios.json', JSON.stringify(t)]);
    }
    saida.push(['manifesto.json', JSON.stringify(manifesto, null, 1)], ['instancias.json', JSON.stringify(itens)], ['colisao.json', JSON.stringify(col)],
      ['conferencia.json', JSON.stringify(noPacote.map(p => ({tipo:p.tipo, nome:p.nome, grave:p.grave, detalhe:p.detalhe, posicao:[n3(p.x - origem[0]), n3(p.y - origem[1]), n3(p.z - origem[2])]})), null, 1)], ['leia-me.txt', LEIA(op.nome, lado, voxel, op.temRuas)]);
    return {arquivos:saida, manifesto};
  }
  return {BLOCO, novoGLB, pedaco, colisao, arquivos};
})();
