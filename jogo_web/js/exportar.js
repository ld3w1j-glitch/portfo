/* Exportação: GLB (peças articuladas, cores como materiais) e OBJ + MTL dentro de um ZIP. */
const linear = v => { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };

function gerarGLB(modelo, config){
  const {desloca, juntas} = posar(modelo, config.pose);
  const produto = (p, o) => [p[3]*o[0] + p[0]*o[3] + p[1]*o[2] - p[2]*o[1], p[3]*o[1] - p[0]*o[2] + p[1]*o[3] + p[2]*o[0], p[3]*o[2] + p[0]*o[1] - p[1]*o[0] + p[2]*o[3], p[3]*o[3] - p[0]*o[0] - p[1]*o[1] - p[2]*o[2]];
  const contrario = q => [-q[0], -q[1], -q[2], q[3]];
  const gltf = {asset:{version:'2.0', generator:'Criador de personagem WO'}, scene:0, scenes:[{nodes:[0]}], nodes:[], meshes:[], materials:[], accessors:[], bufferViews:[], buffers:[]};
  const partes = [], mats = new Map(); let tamanho = 0;
  const material = cor => {
    if (!mats.has(cor)){
      mats.set(cor, gltf.materials.length);
      gltf.materials.push({name:'cor_' + cor.slice(1), pbrMetallicRoughness:{baseColorFactor:[...rgb(cor).map(linear), 1], metallicFactor:0, roughnessFactor:1}});
    }
    return mats.get(cor);
  };
  const acessor = (dados, tipo, comp, alvo, extra = {}) => {
    const bytes = new Uint8Array(dados.buffer);
    gltf.bufferViews.push({buffer:0, byteOffset:tamanho, byteLength:bytes.length, target:alvo});
    partes.push(bytes); tamanho += bytes.length;
    const resto = (4 - tamanho % 4) % 4; if (resto){ partes.push(new Uint8Array(resto)); tamanho += resto; }
    gltf.accessors.push(Object.assign({bufferView:gltf.bufferViews.length - 1, componentType:comp, count:dados.length / (tipo === 'VEC3' ? 3 : 1), type:tipo}, extra));
    return gltf.accessors.length - 1;
  };
  gltf.nodes.push({name:'Personagem_' + config.nome, children:[]});
  const indice = {};
  const porNome = Object.fromEntries(modelo.pecas.map(p => [p.nome, p]));
  for (const p of modelo.pecas){
    const grupos = new Map();
    for (const q of (typeof Maos === 'object' ? Maos.quadsDaPeca(p, config.pose) : p.quads)){ if (!grupos.has(q.cor)) grupos.set(q.cor, []); grupos.get(q.cor).push(q); }
    const primitivas = [];
    for (const [cor, quads] of grupos){
      const pos = new Float32Array(quads.length * 12), nor = new Float32Array(quads.length * 12), ind = new Uint32Array(quads.length * 6);
      const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
      quads.forEach((q, i) => {
        q.v.forEach((v, j) => { pos.set(v, i * 12 + j * 3); nor.set(q.n, i * 12 + j * 3); });
        ind.set([0, 1, 2, 0, 2, 3].map(x => i * 4 + x), i * 6);
      });
      for (let i = 0; i < pos.length; i++){ lo[i % 3] = Math.min(lo[i % 3], pos[i]); hi[i % 3] = Math.max(hi[i % 3], pos[i]); }
      primitivas.push({attributes:{POSITION:acessor(pos, 'VEC3', 5126, 34962, {min:lo, max:hi}), NORMAL:acessor(nor, 'VEC3', 5126, 34962)},
                       indices:acessor(ind, 'SCALAR', 5125, 34963), material:material(cor)});
    }
    if (primitivas.length) gltf.meshes.push({name:p.nome, primitives:primitivas});      /* peça perdida por um zumbi: só a junta */
    indice[p.nome] = gltf.nodes.length;
    const minha = juntas[p.nome], dele = p.pai ? juntas[p.pai] : null;
    const t = dele ? girar(contrario(dele.q), menos(minha.pos, dele.pos)) : soma(minha.pos, desloca);
    const giro = dele ? produto(contrario(dele.q), minha.q) : minha.q;
    gltf.nodes.push({name:p.nome, ...(primitivas.length ? {mesh:gltf.meshes.length - 1} : {}), translation:t, rotation:giro});
  }
  for (const p of modelo.pecas){
    const pai = p.pai ? gltf.nodes[indice[p.pai]] : gltf.nodes[0];
    (pai.children = pai.children || []).push(indice[p.nome]);
  }
  gltf.buffers.push({byteLength:tamanho});
  let json = new TextEncoder().encode(JSON.stringify(gltf));
  const falta = (4 - json.length % 4) % 4;
  if (falta){ const j = new Uint8Array(json.length + falta).fill(32); j.set(json); json = j; }
  const total = 12 + 8 + json.length + 8 + tamanho, saida = new Uint8Array(total), dv = new DataView(saida.buffer);
  dv.setUint32(0, 0x46546C67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true);
  dv.setUint32(12, json.length, true); dv.setUint32(16, 0x4E4F534A, true); saida.set(json, 20);
  let o = 20 + json.length; dv.setUint32(o, tamanho, true); dv.setUint32(o + 4, 0x004E4942, true); o += 8;
  for (const b of partes){ saida.set(b, o); o += b.length; }
  return saida;
}

function gerarOBJ(modelo, config){
  const {quads} = posar(modelo, config.pose), nome = 'personagem-' + config.nome;
  const cores = [...new Set(quads.map(q => q.cor))];
  const mtl = cores.map(c => `newmtl cor_${c.slice(1)}\nKd ${rgb(c).map(v => linear(v).toFixed(5)).join(' ')}\nKs 0 0 0\nillum 1\n`).join('\n');
  const obj = [`mtllib ${nome}.mtl`]; let base = 1, peca = '', cor = '';
  for (const q of quads){
    if (q.peca !== peca){ peca = q.peca; obj.push(`o ${peca}`); cor = ''; }
    if (q.cor !== cor){ cor = q.cor; obj.push(`usemtl cor_${cor.slice(1)}`); }
    for (const v of q.v) obj.push(`v ${v.map(x => x.toFixed(5)).join(' ')}`);
    obj.push(`f ${base} ${base + 1} ${base + 2} ${base + 3}`); base += 4;
  }
  return zip([[nome + '.obj', obj.join('\n') + '\n'], [nome + '.mtl', mtl]]);
}

/* ZIP sem compressão */
function zip(arquivos){
  const tabela = Array.from({length:256}, (_, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? 0xEDB88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; });
  const crc = b => { let c = 0xFFFFFFFF; for (const x of b) c = tabela[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const enc = new TextEncoder(), blocos = [], central = []; let pos = 0;
  const cab = (n, campos) => { const b = new Uint8Array(n), d = new DataView(b.buffer); for (const [o, v, t] of campos) t === 2 ? d.setUint16(o, v, true) : d.setUint32(o, v, true); return b; };
  for (const [nome, texto] of arquivos){
    const nb = enc.encode(nome), dados = typeof texto === 'string' ? enc.encode(texto) : texto, c = crc(dados);
    const local = cab(30, [[0, 0x04034B50, 4], [4, 20, 2], [14, c, 4], [18, dados.length, 4], [22, dados.length, 4], [26, nb.length, 2]]);
    blocos.push(local, nb, dados);
    central.push(cab(46, [[0, 0x02014B50, 4], [4, 20, 2], [6, 20, 2], [16, c, 4], [20, dados.length, 4], [24, dados.length, 4], [28, nb.length, 2], [42, pos, 4]]), nb);
    pos += 30 + nb.length + dados.length;
  }
  const tc = central.reduce((a, b) => a + b.length, 0);
  const fim = cab(22, [[0, 0x06054B50, 4], [8, arquivos.length, 2], [10, arquivos.length, 2], [12, tc, 4], [16, pos, 4]]);
  const tudo = [...blocos, ...central, fim], out = new Uint8Array(tudo.reduce((a, b) => a + b.length, 0));
  let o = 0; for (const b of tudo){ out.set(b, o); o += b.length; }
  return out;
}

function baixar(nome, dados, tipo){
  const url = typeof dados === 'string' && dados.startsWith('data:') ? dados : URL.createObjectURL(new Blob([dados], {type:tipo}));
  const a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  if (url.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(url), 3000);
}
