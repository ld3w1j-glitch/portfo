/* Zonas e territórios: divide o mapa em zonas cujas divisas acompanham as ruas, guarda o dono de cada uma e prepara os dados
   para o jogo (vizinhas, ponto de base). Cada zona nasce de um ponto fixo; é o que se salva. O desenho das divisas é recalculado.
   A regra de tomada de áreas (tempo sem visita e sem comunidade ativa) é do jogo e não é decidida aqui. */
const Territorios = (() => {
  const CEL = 4, W = Mundo.LADO / CEL, MEIO = Mundo.MEIO, TOTAL = W * W;
  const PRINCIPAIS = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link']);
  const LIMITE = 400;

  /* cores de mapa: bem separadas entre si (as cores dos uniformes ficam parecidas demais vistas de cima) */
  const CORES_DONO = {livre:'#D8D8D8', comunidade:'#3D74F0', mandu:'#17B6C9', tropeiros:'#B98245', asfalto:'#F2C230', serra:'#2E9C4B', safra:'#B03A48', viralatas:'#F26A22'};
  const DONOS = {livre:'Livre', comunidade:'Sua comunidade', ...Object.fromEntries(Object.entries(FACCOES).map(([k, f]) => [k, f.nome]))};
  const nomePadrao = i => 'Zona ' + String(i + 1).padStart(2, '0');
  const vazio = () => ({tamanho:150, proximo:1, sementes:[]});

  const celula = (x, z) => Math.max(0, Math.min(W - 1, Math.floor((z + MEIO) / CEL))) * W + Math.max(0, Math.min(W - 1, Math.floor((x + MEIO) / CEL)));
  const centroCel = k => [(k % W + .5) * CEL - MEIO, (Math.floor(k / W) + .5) * CEL - MEIO];

  /* marca na grade as células a até "raio" metros do traçado das ruas escolhidas */
  function rasteriza(ruas, raio, destino, valor){
    for (const r of ruas) for (let i = 0; i + 1 < r.pts.length; i++){
      const [ax, az] = r.pts[i], [bx, bz] = r.pts[i + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
      const i0 = Math.max(0, Math.floor((Math.min(ax, bx) - raio + MEIO) / CEL)), i1 = Math.min(W - 1, Math.floor((Math.max(ax, bx) + raio + MEIO) / CEL));
      const j0 = Math.max(0, Math.floor((Math.min(az, bz) - raio + MEIO) / CEL)), j1 = Math.min(W - 1, Math.floor((Math.max(az, bz) + raio + MEIO) / CEL));
      for (let j = j0; j <= j1; j++) for (let c = i0; c <= i1; c++){
        const px = (c + .5) * CEL - MEIO, pz = (j + .5) * CEL - MEIO, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2));
        if (Math.hypot(px - ax - dx * t, pz - az - dz * t) <= raio && destino[j * W + c] < valor) destino[j * W + c] = valor;
      }
    }
  }

  /* o que há em cada célula: via (e o peso de atravessá-la), área urbana, água, estrada de terra, via principal */
  function terreno(){
    const via = new Uint8Array(TOTAL), urbano = new Uint8Array(TOTAL), terra = new Uint8Array(TOTAL), principal = new Uint8Array(TOTAL), agua = new Uint8Array(TOTAL);
    const ruas = Mundo.m.ruas;
    rasteriza(ruas.filter(r => r.largura > 2 && !PRINCIPAIS.has(r.tipo)), 2.9, via, 7);
    rasteriza(ruas.filter(r => PRINCIPAIS.has(r.tipo)), 4, via, 22);
    rasteriza(ruas.filter(r => Povoar.URBANAS.has(r.tipo)), 45, urbano, 1);
    rasteriza(ruas.filter(r => r.tipo === 'track'), 12, terra, 1);
    rasteriza(ruas.filter(r => PRINCIPAIS.has(r.tipo)), 14, principal, 1);
    const por = CEL / Mundo.CM, C = Mundo.C;
    for (let k = 0; k < TOTAL; k++){
      const i = (k % W) * por, j = Math.floor(k / W) * por;
      for (let b = 0; b < por && !agua[k]; b++) for (let a = 0; a < por; a++) if (Mundo.m.agua[(j + b) * C + i + a]){ agua[k] = 1; break; }
    }
    return {via, urbano, terra, principal, agua};
  }

  /* cresce todas as zonas ao mesmo tempo a partir dos pontos; atravessar rua, água ou sair da área urbana custa caro,
     então o encontro entre duas zonas tende a ficar em cima dessas linhas */
  function crescer(sementes, T){
    const custo = new Float32Array(TOTAL).fill(Infinity), dono = new Int16Array(TOTAL).fill(-1);
    let heapK = [], heapV = [];
    const poe = (k, v) => { let i = heapK.length; heapK.push(k); heapV.push(v); while (i){ const p = (i - 1) >> 1; if (heapV[p] <= v) break; heapK[i] = heapK[p]; heapV[i] = heapV[p]; i = p; } heapK[i] = k; heapV[i] = v; };
    const tira = () => {
      const k = heapK[0], v = heapV[0], uk = heapK.pop(), uv = heapV.pop(), n = heapK.length;
      if (n){ let i = 0; for (;;){ let f = i * 2 + 1; if (f >= n) break; if (f + 1 < n && heapV[f + 1] < heapV[f]) f++; if (heapV[f] >= uv) break; heapK[i] = heapK[f]; heapV[i] = heapV[f]; i = f; } heapK[i] = uk; heapV[i] = uv; }
      return [k, v];
    };
    sementes.forEach((s, i) => { const k = celula(s.x, s.z); if (custo[k] > 0){ custo[k] = 0; dono[k] = i; poe(k, 0); } });
    const pedagio = (a, b) => Math.max(0, T.via[b] - T.via[a]) + (T.agua[b] && !T.agua[a] ? 14 : 0) + (T.urbano[a] !== T.urbano[b] ? 5 : 0);
    while (heapK.length){
      const [k, v] = tira(); if (v > custo[k]) continue;
      const i = k % W, j = (k - i) / W;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++){
        if ((!di && !dj) || i + di < 0 || i + di >= W || j + dj < 0 || j + dj >= W) continue;
        const q = k + dj * W + di; let extra = pedagio(k, q), passo = 1;
        if (di && dj){ passo = 1.414; extra = Math.max(extra, pedagio(k, k + di), pedagio(k, k + dj * W)); }   /* não escapa pela quina da rua */
        const novo = v + passo + extra;
        if (novo < custo[q]){ custo[q] = novo; dono[q] = dono[k]; poe(q, custo[q]); }
      }
    }
    return dono;
  }

  /* pontos de partida bem espalhados: primeiro nos quarteirões, depois (mais separados) no mato */
  function sortear(tamanho, semente, T){
    let s = semente >>> 0 || 1;
    const r = () => { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), s | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const pontos = [];
    for (const urbana of [true, false]){
      const candidatos = [];
      for (let j = 2; j < W - 2; j += 3) for (let i = 2; i < W - 2; i += 3){ const k = j * W + i; if (!!T.urbano[k] === urbana && !T.via[k] && !T.agua[k]) candidatos.push(k); }
      for (let i = candidatos.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [candidatos[i], candidatos[j]] = [candidatos[j], candidatos[i]]; }
      const folga = urbana ? tamanho : tamanho * 2.4;
      for (const k of candidatos){
        const [x, z] = centroCel(k);
        if (pontos.length < LIMITE && pontos.every(p => Math.hypot(p.x - x, p.z - z) >= (urbana ? folga : p.urbana ? tamanho * 1.5 : folga))) pontos.push({x, z, urbana});
      }
    }
    return pontos;
  }

  /* divide o mapa de novo (os donos escolhidos antes são perdidos, mas dá para desfazer) */
  function dividir(tamanho = 150, semente = 7){
    const T = terreno();
    let pontos = sortear(tamanho, semente, T);
    /* sobras muito pequenas somem: a vizinha cresce por cima */
    for (let volta = 0; volta < 2; volta++){
      const dono = crescer(pontos, T), n = new Array(pontos.length).fill(0), urb = new Array(pontos.length).fill(0);
      for (let k = 0; k < TOTAL; k++) if (dono[k] >= 0){ n[dono[k]]++; urb[dono[k]] += T.urbano[k]; }
      const minimo = i => (tamanho * tamanho / (CEL * CEL)) * (urb[i] > n[i] / 2 ? .22 : .5);
      const ficam = pontos.filter((p, i) => n[i] >= minimo(i));
      if (ficam.length === pontos.length) break;
      pontos = ficam;
    }
    return {tamanho, proximo:pontos.length + 1, sementes:pontos.map((p, i) => ({x:p.x, z:p.z, dono:'livre', nome:nomePadrao(i)}))};
  }

  /* tudo o que se sabe sobre as zonas atuais */
  function calcular(Z, povoado){
    const T = terreno(), S = Z.sementes, dono = crescer(S, T);
    const zonas = S.map((s, i) => ({i, id:i + 1, nome:s.nome, dono:DONOS[s.dono] ? s.dono : 'livre', celulas:0, urbanas:0, agua:0, terra:0, principal:0, sx:0, sz:0, alt:0, nAlt:0, casas:[], vizinhas:new Map(), centro:[s.x, s.z], base:null, caixa:[1e9, 1e9, -1e9, -1e9]}));
    for (let k = 0; k < TOTAL; k++){
      const z = zonas[dono[k]]; if (!z) continue;
      const i = k % W, j = (k - i) / W, [x, y] = centroCel(k);
      z.celulas++; z.urbanas += T.urbano[k]; z.agua += T.agua[k]; z.terra += T.terra[k]; z.principal += T.principal[k]; z.sx += x; z.sz += y;
      if (!(i % 4) && !(j % 4)){ z.alt += Mundo.altura(x, y); z.nAlt++; }
      const cx = z.caixa; cx[0] = Math.min(cx[0], x); cx[1] = Math.min(cx[1], y); cx[2] = Math.max(cx[2], x); cx[3] = Math.max(cx[3], y);
      for (const q of [i + 1 < W ? k + 1 : -1, j + 1 < W ? k + W : -1]){
        if (q < 0 || dono[q] === dono[k] || dono[q] < 0) continue;
        z.vizinhas.set(dono[q], (z.vizinhas.get(dono[q]) || 0) + 1); zonas[dono[q]].vizinhas.set(dono[k], (zonas[dono[q]].vizinhas.get(dono[k]) || 0) + 1);
      }
    }
    for (const o of povoado?.lista || []) if (o.cat === 'casa'){ const z = zonas[dono[celula(o.x, o.z)]]; if (z) z.casas.push(o); }
    for (const z of zonas){
      /* centro: a célula da própria zona mais perto do meio dela */
      if (z.celulas){
        const mx = z.sx / z.celulas, mz = z.sz / z.celulas; let melhor = 1e18;
        for (let y = z.caixa[1]; y <= z.caixa[3]; y += CEL) for (let x = z.caixa[0]; x <= z.caixa[2]; x += CEL){ if (dono[celula(x, y)] !== z.i) continue; const d = (x - mx) ** 2 + (y - mz) ** 2; if (d < melhor){ melhor = d; z.centro = [x, y]; } }
      }
      z.area = z.celulas * CEL * CEL;
      z.tipo = z.urbanas > z.celulas / 2 ? 'urbana' : 'rural';
      z.altitude = z.nAlt ? z.alt / z.nAlt : Mundo.altura(...z.centro);
      z.temAgua = z.agua > 3;
      z.vizinhas = [...z.vizinhas].filter(([, n]) => n >= 3).map(([i]) => i).sort((a, b) => a - b);
      /* ponto de base: uma casa perto do meio, em zona com casas suficientes para uma comunidade */
      if (z.casas.length >= 3){
        const nota = o => Math.hypot(o.x - z.centro[0], o.z - z.centro[1]) - o.w * o.d * .25;
        const casa = z.casas.reduce((a, b) => nota(b) < nota(a) ? b : a);
        z.base = {x:casa.x, y:casa.y, z:casa.z, giro:casa.rot};
      }
    }
    return {dono, zonas, zonaEm:(x, z) => zonas[dono[celula(x, z)]] || null};
  }

  /* sugestão de começo: cada facção ganha um grupo de zonas vizinhas onde faz sentido para ela; a maioria continua livre.
     A zona marcada como da sua comunidade é respeitada. */
  function sugerirDonos(res){
    const zonas = res.zonas, donos = zonas.map(z => z.dono === 'comunidade' ? 'comunidade' : 'livre');
    const parte = (z, campo) => z[campo] / (z.celulas || 1);
    const alts = zonas.map(z => z.altitude), baixo = Math.min(...alts), alto = Math.max(...alts), nivel = z => (z.altitude - baixo) / (alto - baixo || 1);
    const rural = z => z.tipo === 'rural' ? 1 : 0, meio = z => 1 - Math.min(1, Math.hypot(...z.centro) / 900);
    const GOSTO = {
      asfalto:{tam:5, nota:z => parte(z, 'principal') * 20},
      serra:{tam:5, nota:z => nivel(z) * 3 + rural(z) * 2},
      mandu:{tam:3, nota:z => parte(z, 'agua') * 30 + (z.temAgua ? 2 : 0) + (1 - nivel(z))},
      tropeiros:{tam:3, nota:z => parte(z, 'terra') * 12 + rural(z)},
      safra:{tam:3, nota:z => rural(z) * 2 + (1 - nivel(z)) + (1 - meio(z))},
      viralatas:{tam:3, nota:z => (1 - rural(z)) * 2 + meio(z) * 2 + Math.min(1, z.casas.length / 25)},
    };
    const RIVAIS = {asfalto:'serra', serra:'asfalto'};
    for (const [id, g] of Object.entries(GOSTO)){
      const encosta = (z, quem) => z.vizinhas.some(v => donos[v] === quem);
      const aceita = z => z.celulas && donos[z.i] === 'livre' && !encosta(z, 'comunidade') && !(RIVAIS[id] && encosta(z, RIVAIS[id]));
      /* a primeira zona de cada uma fica separada das outras facções */
      const isolada = z => z.vizinhas.every(v => donos[v] === 'livre');
      let opcoes = zonas.filter(z => aceita(z) && isolada(z)); if (!opcoes.length) opcoes = zonas.filter(aceita); if (!opcoes.length) continue;
      const grupo = [opcoes.reduce((a, b) => g.nota(b) > g.nota(a) ? b : a)]; donos[grupo[0].i] = id;
      while (grupo.length < g.tam){
        const borda = [...new Set(grupo.flatMap(z => z.vizinhas))].map(i => zonas[i]).filter(aceita);
        if (!borda.length) break;
        const proxima = borda.reduce((a, b) => g.nota(b) > g.nota(a) ? b : a); grupo.push(proxima); donos[proxima.i] = id;
      }
    }
    return donos;
  }

  /* imagem de uma célula por pixel (RGBA): preenchimento translúcido e divisas fortes. "destaque" = zona escolhida */
  function pintura(res, destaque = -1){
    const px = new Uint8Array(TOTAL * 4), {dono, zonas} = res;
    const rgbs = Object.fromEntries(Object.entries(CORES_DONO).map(([k, h]) => [k, [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))]));
    for (let k = 0; k < TOTAL; k++){
      const z = zonas[dono[k]]; if (!z) continue;
      const i = k % W, j = (k - i) / W;
      const borda = (i + 1 < W && dono[k + 1] !== dono[k]) || (j + 1 < W && dono[k + W] !== dono[k]);
      const escolhida = z.i === destaque, divisaEscolhida = destaque >= 0 && (escolhida ? borda || (i && dono[k - 1] !== dono[k]) || (j && dono[k - W] !== dono[k]) : (i + 1 < W && dono[k + 1] === destaque) || (j + 1 < W && dono[k + W] === destaque));
      let c = rgbs[z.dono], a = z.dono === 'livre' ? .06 : .46;
      if (borda){ c = z.dono === 'livre' ? [245, 245, 245] : c.map(v => v * .72); a = .8; }
      if (escolhida) a = Math.max(a, .34);
      if (divisaEscolhida){ c = [255, 255, 255]; a = 1; }
      px.set([c[0], c[1], c[2], a * 255], k * 4);
    }
    return px;
  }

  /* dados para o jogo, recortados na área do pacote. Eixos do glTF: +X leste, +Z sul; posições a partir da origem do manifesto */
  function exportar(res, area){
    const {x0, z0, lado, origem} = area, n = lado / CEL, n3 = v => Math.round(v * 1000) / 1000;
    const i0 = Math.round((x0 + MEIO) / CEL), j0 = Math.round((z0 + MEIO) / CEL), grade = new Array(n * n), presentes = new Map();
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){ const d = res.dono[(j0 + j) * W + i0 + i]; grade[j * n + i] = d + 1; if (d >= 0) presentes.set(d, (presentes.get(d) || 0) + 1); }
    const dentro = (x, z) => x >= x0 && x < x0 + lado && z >= z0 && z < z0 + lado;
    const pos = (x, y, z) => [n3(x - origem[0]), n3(y - origem[1]), n3(z - origem[2])];
    const zonas = [...presentes.keys()].sort((a, b) => a - b).map(i => {
      const z = res.zonas[i], temBase = !!z.base && dentro(z.base.x, z.base.z);
      return {id:z.id, nome:z.nome, tipo:z.tipo, dono:z.dono, completa:presentes.get(i) === z.celulas, area:z.area, casas:z.casas.length, temAgua:z.temAgua,
        vizinhas:z.vizinhas.filter(v => presentes.has(v)).map(v => v + 1), centro:pos(z.centro[0], Mundo.altura(...z.centro), z.centro[1]),
        temBase, ...(temBase ? {base:pos(z.base.x, z.base.y, z.base.z), baseGiro:n3(z.base.giro)} : {})};
    });
    return {versao:1, donos:Object.entries(DONOS).map(([id, nome]) => ({id, nome, cor:CORES_DONO[id]})), zonas,
      grade:{celula:CEL, colunas:n, linhas:n, canto:[n3(x0 - origem[0]), n3(z0 - origem[2])],
        explicacao:'valores: id da zona em cada célula (0 = nenhuma), linha por linha, do norte para o sul e do oeste para o leste', valores:grade}};
  }

  /* limpa o que vem de um arquivo */
  function validar(o){
    const z = vazio(); if (!o || typeof o !== 'object') return z;
    if (Number.isFinite(o.tamanho)) z.tamanho = Math.max(60, Math.min(500, o.tamanho));
    z.sementes = (Array.isArray(o.sementes) ? o.sementes : []).filter(s => s && Number.isFinite(s.x) && Number.isFinite(s.z)).slice(0, LIMITE).map((s, i) => ({
      x:Math.max(-MEIO, Math.min(MEIO - .01, s.x)), z:Math.max(-MEIO, Math.min(MEIO - .01, s.z)),
      dono:typeof s.dono === 'string' && Object.prototype.hasOwnProperty.call(DONOS, s.dono) ? s.dono : 'livre',
      nome:typeof s.nome === 'string' && s.nome.trim() ? s.nome.slice(0, 40) : nomePadrao(i)}));
    z.proximo = Number.isFinite(o.proximo) ? Math.max(1, Math.min(9999, o.proximo | 0)) : z.sementes.length + 1;
    return z;
  }

  return {CEL, W, LIMITE, DONOS, CORES_DONO, nomePadrao, vazio, dividir, calcular, sugerirDonos, pintura, exportar, validar};
})();
