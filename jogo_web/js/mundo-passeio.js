/* Passeio (calçada) detalhado: sarjeta, meio-fio, pisos de concreto, rampa de garagem, boca de lobo,
   tampas, rachaduras, mato, fios dos postes e a faixa da rua. Segue o traçado das ruas, por isso a borda fica reta em vez de serrilhada.
   Só gera triângulos; não usa a página. "u" é a distância, em metros, para fora da beira do asfalto. */
const Passeio = (() => {
  const SAIA = -.85, SARJETA = -.08, GUIA = .22, PISO = .38, FIM = 2.22, ALTO = .15, TRECHO = 8.5, PASSO = .4;
  const sorte = (a, b = 0, c = 0) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 2147483629)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const C = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? v.map(rgb) : rgb(v)]));
  const COR = C({guia:'#AFA99B', guiaFace:'#9B958A', sarjeta:'#807C72', junta:'#6F6A5F', terra:'#99714C', terraClara:'#AD8660', terraSuja:'#8E7458', mato:['#5F8533', '#76983D', '#8FA24C'], folha:['#A8782E', '#8A5A28', '#B99B3C'], lixo:['#D9D6CC', '#B23A2C', '#2E6F8E', '#C99A2E'], pedra:['#9A968C', '#87837A', '#AAA59A', '#75726B'],
    rustico:['#A8A193', '#9E978A', '#B2AB9D', '#948C7D'], claro:['#BAB4A6', '#B2AC9F'], escuro_:['#8A847A', '#827D74'], remendo:['#79756D', '#BDB7AA', '#8F887A'], ferro:'#4B4A47', escuro:'#171614', fio:'#1E1F22', amarelo:'#C9A94A'});
  /* tipos de piso: concreto comum, cada morador fez o seu, em um tom diferente */
  const TIPOS = ['rustico', 'rustico', 'rustico', 'claro', 'escuro', 'placas', 'remendado', 'rustico', 'terra'];
  const PX = {rustico:.3, claro:.3, escuro:.3, placas:.3, remendado:.24, terra:.24};
  let postes = [], casasPerto = [];

  let trechos = [], porPedaco = new Map(), seg = new Map(), ruas = [], portoes = [], velha = true;
  const GRADE = 12, chaveG = (i, j) => i * 100003 + j;

  function preparar(listaRuas, povoado, abandonado){
    ruas = listaRuas; velha = abandonado; trechos = []; porPedaco = new Map(); seg = new Map();
    /* segmentos de todas as ruas numa grade, para saber de quem é cada pedaço de chão */
    ruas.forEach((r, ri) => { for (let i = 0; i + 1 < r.pts.length; i++){
      const [ax, az] = r.pts[i], [bx, bz] = r.pts[i + 1], s = {ri, ax, az, bx, bz, meia:r.largura / 2};
      for (let gi = Math.floor((Math.min(ax, bx) - 12) / GRADE); gi <= Math.floor((Math.max(ax, bx) + 12) / GRADE); gi++) for (let gj = Math.floor((Math.min(az, bz) - 12) / GRADE); gj <= Math.floor((Math.max(az, bz) + 12) / GRADE); gj++){ const k = chaveG(gi, gj); (seg.get(k) || seg.set(k, []).get(k)).push(s); }
    }});
    /* portões dos muros: ali o meio-fio é rebaixado */
    portoes = (povoado?.lista || []).filter(o => o.id === 'muro').map(o => { const a = -.6 * Math.abs(o.sx) * (o.espelho ? -1 : 1); return [o.x + a * Math.cos(o.rot), o.z - a * Math.sin(o.rot)]; });
    const MEIO = Mundo.MEIO, PEDACO = Mundo.PEDACO, N = Mundo.PEDACOS;
    postes = (povoado?.lista || []).filter(o => o.id === 'poste'); casasPerto = (povoado?.lista || []).filter(o => o.cat === 'casa');
    ruas.forEach((r, ri) => {
      if (!r.calcada) return;
      const pts = []; let acc = 0;
      for (let i = 0; i + 1 < r.pts.length; i++){
        const [ax, az] = r.pts[i], [bx, bz] = r.pts[i + 1], len = Math.hypot(bx - ax, bz - az); if (len < .01) continue;
        const n = Math.max(1, Math.round(len / PASSO));
        for (let k = pts.length ? 1 : 0; k <= n; k++) pts.push({x:ax + (bx - ax) * k / n, z:az + (bz - az) * k / n, s:acc + len * k / n});
        acc += len;
      }
      if (pts.length < 2) return;
      /* direção suavizada, para a calçada fazer a curva sem quinas */
      pts.forEach((p, i) => { const a = pts[Math.max(0, i - 3)], b = pts[Math.min(pts.length - 1, i + 3)], l = Math.hypot(b.x - a.x, b.z - a.z) || 1; p.dx = (b.x - a.x) / l; p.dz = (b.z - a.z) / l; });
      for (const lado of [1, -1]) for (let i = 0; i + 1 < pts.length; i++){
        const a = pts[i], b = pts[i + 1], mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
        if (Math.abs(mx) > MEIO - 4 || Math.abs(mz) > MEIO - 4) continue;
        const k = Math.floor((mz + MEIO) / PEDACO) * N + Math.floor((mx + MEIO) / PEDACO);
        (porPedaco.get(k) || porPedaco.set(k, []).get(k)).push({a, b, lado, ri, meia:r.largura / 2});
      }
    });
  }

  /* distância até a beira do asfalto mais próximo: diz qual rua é dona daquele ponto */
  function dono(x, z){
    let u = 1e9, ri = -1;
    for (const s of seg.get(chaveG(Math.floor(x / GRADE), Math.floor(z / GRADE))) || []){
      const dx = s.bx - s.ax, dz = s.bz - s.az, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / l2));
      const d = Math.hypot(x - s.ax - dx * t, z - s.az - dz * t) - s.meia;
      if (d < u - .015 || (d < u + .015 && s.ri < ri)){ u = d; ri = s.ri; }
    }
    return {u, ri};
  }
  function substituto(x, z){
    let junto = false;
    for (const s of seg.get(chaveG(Math.floor(x / GRADE), Math.floor(z / GRADE))) || []){
      if (!ruas[s.ri].calcada) continue;
      const dx = s.bx - s.ax, dz = s.bz - s.az, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / l2));
      if (Math.hypot(x - s.ax - dx * t, z - s.az - dz * t) - s.meia < 3.4){ junto = true; break; }
    }
    if (!junto) return null;
    const d = dono(x, z);
    return d.u < 1.15 && ruas[d.ri].tipo !== 'track' ? 'asfalto' : 'natural';
  }
  const portaoPerto = (x, z) => { let d = 1e9; for (const p of portoes){ if (Math.abs(p[0] - x) > 4 || Math.abs(p[1] - z) > 4) continue; d = Math.min(d, Math.hypot(p[0] - x, p[1] - z)); } return d; };

  /* triângulos de um pedaço do mundo. detalhe = 1 (perto) ou 0 (longe) */
  function gerar(k, detalhe){
    const pos = [], nor = [], cor = [];
    const lista = porPedaco.get(k) || [];
    const quad = (q, n, c) => { for (const i of [0, 1, 2, 0, 2, 3]){ pos.push(q[i][0], q[i][1], q[i][2]); nor.push(n[0], n[1], n[2]); cor.push(c[0], c[1], c[2]); } };
    const tom = (c, f) => [Math.min(1, c[0] * f), Math.min(1, c[1] * f), Math.min(1, c[2] * f)];
    for (const t of lista){
      const {a, b, lado, ri, meia} = t, sm = (a.s + b.s) / 2, sobe = detalhe ? 0 : .07;
      /* ponto no chão a uma fração f do trecho e distância u da beira */
      const em = (f, u) => { const x = a.x + (b.x - a.x) * f, z = a.z + (b.z - a.z) * f, dx = a.dx + (b.dx - a.dx) * f, dz = a.dz + (b.dz - a.dz) * f, o = (meia + u) * lado; return [x - dz * o, z + dx * o]; };
      /* alturas de referência nas duas pontas */
      const hs = [0, 1].map(f => { const m = em(f, .1), n = em(f, 1.7); const y = Mundo.altura(m[0], m[1]); return {y, fora:Math.max(y, Mundo.altura(n[0], n[1]))}; });
      const base = (f, u) => { const y = hs[0].y + (hs[1].y - hs[0].y) * f, fo = hs[0].fora + (hs[1].fora - hs[0].fora) * f, w = Math.max(0, Math.min(1, (u - .4) / 1.3)); return y + (fo - y) * w + sobe; };
      const meu = (f, u) => { const p = em(f, u), d = dono(p[0], p[1]); return d.ri === ri && Math.abs(d.u - u) < .13; };
      const plano = (f0, f1, u0, u1, h0, h1, c) => {
        const q = [[f0, u0, h0], [f1, u0, h0], [f1, u1, h1], [f0, u1, h1]].map(([f, u, h]) => { const p = em(f, u); return [p[0], base(f, u) + h, p[1]]; });
        quad(q, [0, 1, 0], c);
      };
      const parede = (f0, f1, u, ya, yb, c, paraRua) => {
        const p = em(f0, u), q = em(f1, u), y0 = base(f0, u), y1 = base(f1, u), l = Math.hypot(a.dz, a.dx) || 1, s = paraRua ? -lado : lado;
        quad([[p[0], y0 + ya, p[1]], [q[0], y1 + ya, q[1]], [q[0], y1 + yb, q[1]], [p[0], y0 + yb, p[1]]], [-a.dz * s / l, 0, a.dx * s / l], c);
      };
      const lote = Math.floor((sm + (lado > 0 ? 0 : 3.7) + sorte(ri, lado, 2) * 5) / TRECHO);
      const tipo = TIPOS[Math.floor(sorte(ri * 31 + lado, lote, 7) * TIPOS.length)];
      const desnivel = (sorte(ri * 13 + lado, lote, 71) - .5) * .06, altoLote = ALTO + (tipo === 'terra' ? -.045 : desnivel);      /* cada lote fica num nível um pouco diferente */
      const sarjetaDePedra = sorte(ri * 5 + lado, Math.floor(sm / 40), 77) < .42;
      const centro = em(.5, 1), dp = portaoPerto(centro[0], centro[1]), garagem = dp < 1.25;
      if (Mundo.m.agua[Math.floor((centro[1] + Mundo.MEIO) / Mundo.CM) * Mundo.C + Math.floor((centro[0] + Mundo.MEIO) / Mundo.CM)]) continue;
      const boca = sorte(ri, lado, 11) , naBoca = ((sm + boca * 30) % 34) < 1.1 && !garagem;
      const idx = Math.round(sm / PASSO) * (lado > 0 ? 1 : -1);

      /* asfalto que cobre o serrilhado, e a sarjeta */
      if (meu(.5, -.45)){ const p = em(.5, -.45), c = Mundo.corVoxel(Mundo.M.asfalto, p[0], p[1], 1).map(v => v / 255); plano(0, 1, SAIA, SARJETA, .018, .02, c); }
      if (meu(.5, .06)){
        plano(0, 1, SARJETA, GUIA, .022, .028, tom(COR.sarjeta, .95 + sorte(idx >> 2, ri, 3) * .1));
        if (detalhe && sarjetaDePedra && !naBoca) for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++){      /* pedras irregulares */
          const r = sorte(idx * 3 + i, j, ri + 79), f = i / 3 + r * .05, u = SARJETA + .015 + j * .145 + sorte(idx, i, j + 81) * .02;
          plano(f, f + .25 + r * .05, u, u + .11 + r * .018, .033, .036, tom(COR.pedra[Math.floor(sorte(idx, i * 7 + j, 83) * 4)], .95 + r * .1));
        }
        if (detalhe){
          if (naBoca){ for (let g = 0; g < 4; g++) plano(g / 4 + .04, g / 4 + .15, SARJETA + .03, GUIA - .02, .034, .034, COR.escuro); }
          else if (velha){ for (let g = 0; g < 3; g++){ const r = sorte(idx, g, ri + 5); if (r > .3) continue; const f = g / 3 + sorte(idx, g, 8) * .2, u = SARJETA + .04 + sorte(idx, g, 9) * .2; plano(f, f + .16, u, u + .07, .036 + g * .001, .036 + g * .001, r < .2 ? COR.folha[g % 3] : r < .25 ? COR.lixo[Math.abs(idx + g) % 4] : COR.mato[g % 3]); } }
        }
      }
      /* meio-fio: peças de cerca de 80 cm, rebaixado nos portões */
      if (meu(.5, .3)){
        const alto = garagem ? .04 : altoLote, quebrada = velha && detalhe && sorte(idx, ri, 21) < .025, c = tom(COR.guia, .93 + sorte(Math.floor((sm) / .8), ri * 7 + lado, 4) * .12);
        const junta = detalhe && Math.floor(a.s / .8) !== Math.floor(b.s / .8);
        const h = quebrada ? alto * .45 : alto;
        plano(0, junta ? .88 : 1, GUIA, PISO, h, h, c); if (junta) plano(.88, 1, GUIA, PISO, h - .004, h - .004, COR.junta);
        if (naBoca && detalhe){ parede(0, 1, GUIA, h - .05, h, tom(c, .9), true); parede(0, 1, GUIA + .002, 0, h - .05, COR.escuro, true); }
        else parede(0, 1, GUIA, -.06, h, tom(COR.guiaFace, .93 + sorte(idx >> 1, ri, 4) * .1), true);
      }
      /* piso do passeio */
      if (!detalhe){
        if (meu(.5, 1.2)) plano(0, 1, PISO, FIM, altoLote, altoLote, tipo === 'terra' ? COR.terra : tipo === 'claro' ? COR.claro[0] : tipo === 'escuro' ? COR.escuro_[0] : COR.rustico[0]);
        continue;
      }
      const px = garagem ? .3 : PX[tipo], nf = Math.max(1, Math.round(PASSO / px)), nu = Math.round((FIM - PISO) / px), du = (FIM - PISO) / nu;
      let algum = false;
      for (let i = 0; i < nf; i++) for (let j = 0; j < nu; j++){
        const f0 = i / nf, f1 = (i + 1) / nf, u0 = PISO + j * du, u1 = u0 + du;
        if (!meu((f0 + f1) / 2, (u0 + u1) / 2)) continue;
        algum = true;
        const sc = a.s + (b.s - a.s) * (f0 + f1) / 2, col = Math.floor(sc / px), r = sorte(col, j * 13 + lado, ri + 31), r2 = sorte(col, j + 77, ri * 3 + lado);
        const ponto_ = em((f0 + f1) / 2, (u0 + u1) / 2);
        /* manchas grandes e suaves: umidade, poeira e terra que o vento traz */
        const mancha = Mundo.ruido2(ponto_[0] / 1.9, ponto_[1] / 1.9, 87), poeira = Mundo.ruido2(ponto_[0] / 3.3, ponto_[1] / 3.3, 89);
        const mistura = (c1, c2, q) => [0, 1, 2].map(i_ => c1[i_] + (c2[i_] - c1[i_]) * q);
        let h0 = altoLote, h1 = altoLote, c;
        if (garagem){                                                   /* rampa de entrada do carro, com frisos para não escorregar */
          const rampa = u => u < 1.15 ? .04 + (altoLote - .04) * Math.max(0, (u - PISO) / (1.15 - PISO)) : altoLote;
          h0 = rampa(u0); h1 = rampa(u1); c = tom(COR.rustico[(lote & 1) ? 1 : 3], .96 + r * .07 + (mancha - .5) * .14);
          if (u0 < 1.5 && j % 2 === 0) c = tom(c, .84);
          if (poeira > .66) c = mistura(c, COR.terraSuja, .45);
        } else if (tipo === 'terra'){                                    /* trecho sem calçamento */
          c = tom(mancha > .58 ? COR.terraClara : COR.terra, .9 + r * .18);
          if (r2 < .07){ c = tom(COR.pedra[Math.floor(r * 4)], .95); h0 = h1 = altoLote + .012; }
        } else {
          const paleta_ = tipo === 'claro' ? COR.claro : tipo === 'escuro' ? COR.escuro_ : COR.rustico;
          c = tom(paleta_[Math.floor(sorte(ri + 5, lote, lado + 9) * paleta_.length)], .975 + r * .05 + (mancha - .5) * .17);
          if (poeira > .62) c = mistura(c, COR.terraSuja, Math.min(.75, (poeira - .62) * 3.2));
          if (u0 > 1.75 && r < .55) c = mistura(c, COR.terraSuja, .4);        /* terra acumulada junto ao muro */
          if (u0 < PISO + .1 && r2 < .5) c = tom(c, .88);
          if (tipo === 'remendado'){ const bloco = sorte(Math.floor(sc / 1.1), Math.floor((u0 + sorte(Math.floor(sc / 1.1), ri) * .5) / .75), ri + 63); if (bloco < .3) c = tom(COR.remendo[Math.floor(bloco * 10)], .97 + r * .06); if (velha && sorte(col >> 2, j >> 1, ri + 61) < .06){ c = tom(COR.terra, .9 + r * .18); h0 = h1 = altoLote - .06; } }
        }
        plano(f0, f1, u0, u1, h0, h1, c);
        /* lateral dos buracos e mato nas frestas */
        if (sorte(col, j, ri + 91) < (tipo === 'terra' ? (velha ? .09 : .035) : velha ? (tipo === 'remendado' ? .04 : u0 > 1.8 || u0 < .5 ? .035 : .008) : 0)){ const folhas = 2 + Math.floor(r * 3); for (let q = 0; q < folhas; q++){ const f = f0 + sorte(col, q, 5) * (f1 - f0), u = u0 + sorte(j, q, 6) * du, p = em(f, u), y = base(f, u) + h0, alt = .05 + sorte(col, j, q) * .12, l = .022, cm = COR.mato[q % 3]; quad([[p[0] - l, y, p[1]], [p[0] + l, y, p[1]], [p[0] + l * .4, y + alt, p[1]], [p[0] - l * .4, y + alt, p[1]]], [0, .8, .6], cm); quad([[p[0], y, p[1] - l], [p[0], y, p[1] + l], [p[0], y + alt, p[1] + l * .4], [p[0], y + alt, p[1] - l * .4]], [.6, .8, 0], tom(cm, .9)); } }
      }
      if (!algum) continue;
      /* emendas entre lotes, juntas das placas, rachaduras e acabamento da borda */
      const concreto = tipo !== 'terra' && !garagem;
      const novoLote = Math.floor((a.s + (lado > 0 ? 0 : 3.7) + sorte(ri, lado, 2) * 5) / TRECHO) !== Math.floor((b.s + (lado > 0 ? 0 : 3.7) + sorte(ri, lado, 2) * 5) / TRECHO);
      if (novoLote && meu(.5, 1.3)){ plano(.4, .56, PISO, FIM, altoLote + .006, altoLote + .006, COR.junta); parede(.5, .5001, PISO, altoLote - .05, altoLote, COR.junta, true); }
      if (concreto && tipo === 'placas' && Math.floor(a.s / 1.25) !== Math.floor(b.s / 1.25) && meu(.5, 1.3)) plano(.45, .52, PISO, FIM, altoLote + .003, altoLote + .003, COR.junta);
      if (concreto && sorte(idx >> 3, ri, lado + 41) < (velha ? .16 : .06) && meu(.5, 1.2)){      /* rachadura torta atravessando o passeio */
        if ((idx & 7) === 3){ let f = .3; for (let n_ = 0; n_ < 6; n_++){ const u = PISO + n_ * (FIM - PISO) / 6, df = (sorte(idx, n_, 45) - .5) * .35; plano(f, f + .05, u, u + (FIM - PISO) / 6, altoLote + .005, altoLote + .005, COR.junta); f = Math.max(.02, Math.min(.9, f + df)); plano(Math.min(f, f - df), Math.max(f, f - df) + .05, u + (FIM - PISO) / 6 - .015, u + (FIM - PISO) / 6, altoLote + .0055, altoLote + .0055, COR.junta); } }
      }
      /* faixa amarela gasta no meio da rua */
      if (lado > 0 && meia >= 3.4){ const meio_ = em(.5, -meia), d_ = dono(meio_[0], meio_[1]); if (d_.ri === ri && Math.abs(d_.u + meia) < .2){ const gasto = Mundo.ruido2(meio_[0] / 2.3, meio_[1] / 2.3, 93); if (gasto < .68){ const asf = Mundo.corVoxel(Mundo.M.asfalto, meio_[0], meio_[1], 1).map(v => v / 255), q_ = [[0, -.07], [1, -.07], [1, .07], [0, .07]].map(([f, o]) => { const p = em(f, -meia + o); return [p[0], Mundo.altura(p[0], p[1]) + .025, p[1]]; }); quad(q_, [0, 1, 0], [0, 1, 2].map(i_ => asf[i_] + (COR.amarelo[i_] - asf[i_]) * (.75 - gasto * .6))); } } }
      if (!garagem && ((sm + sorte(ri, lado, 51) * 20) % TRECHO) < PASSO && meu(.5, .75)){ plano(0, .8, .55, .9, altoLote + .008, altoLote + .008, COR.ferro); plano(.12, .68, .62, .83, altoLote + .01, altoLote + .01, tom(COR.ferro, 1.25)); }
      if (meu(.5, FIM - .06)) parede(0, 1, FIM, -.25, altoLote, tom(tipo === 'terra' ? COR.terra : COR.sarjeta, .85), false);
    }
    if (detalhe) fios(k, quad);
    frentes(k, quad, tom, detalhe);
    return pos.length ? {pos:new Float32Array(pos), nor:new Float32Array(nor), cor:new Float32Array(cor), n:pos.length / 3} : null;
  }
  /* quintal da frente cimentado, do passeio até a casa; alguns continuam de terra ou grama */
  function frentes(k, quad, tom, detalhe){
    const MEIO = Mundo.MEIO, PEDACO = Mundo.PEDACO, N = Mundo.PEDACOS;
    for (const o of casasPerto){
      if (!(o.frente > .12) || Math.floor((o.z + MEIO) / PEDACO) * N + Math.floor((o.x + MEIO) / PEDACO) !== k) continue;
      const jeito = sorte(Math.round(o.x * 2), Math.round(o.z * 2), 211); if (jeito > .8) continue;
      const base = COR.rustico[Math.floor(jeito * 17) % 4], passo = detalhe ? .55 : 8, na = Math.max(1, Math.ceil((o.w + .5) / passo)), nb = Math.max(1, Math.ceil((o.frente + .1) / passo));
      const c = Math.cos(o.rot), s = Math.sin(o.rot);
      const em = (a, b) => { const x = o.x + a * c + b * s, z = o.z - a * s + b * c; return [x, Mundo.altura(x, z) + (detalhe ? .035 : .09), z]; };
      for (let i = 0; i < na; i++) for (let j = 0; j < nb; j++){
        const a0 = -(o.w + .5) / 2 + i * (o.w + .5) / na, a1 = a0 + (o.w + .5) / na, b0 = o.d / 2 - .05 + j * (o.frente + .1) / nb, b1 = b0 + (o.frente + .1) / nb;
        const meio_ = em((a0 + a1) / 2, (b0 + b1) / 2), d_ = dono(meio_[0], meio_[2]); if (d_.u < FIM - .1) continue;
        const mancha = Mundo.ruido2(meio_[0] / 1.9, meio_[2] / 1.9, 87), r = sorte(i, j, Math.round(o.x));
        quad([em(a0, b0), em(a1, b0), em(a1, b1), em(a0, b1)], [0, 1, 0], tom(base, .96 + r * .06 + (mancha - .5) * .16));
      }
    }
  }
  /* fio: duas fitas finas cruzadas, com a barriga do próprio peso */
  function fio(quad, a, b, barriga, grossura){
    const n = 7, l = grossura / 2, dx = b[0] - a[0], dz = b[2] - a[2], c = Math.hypot(dx, dz) || 1, px = -dz / c * l, pz = dx / c * l;
    let ant = a;
    for (let i = 1; i <= n; i++){
      const t_ = i / n, p = [a[0] + dx * t_, a[1] + (b[1] - a[1]) * t_ - barriga * 4 * t_ * (1 - t_), a[2] + dz * t_];
      quad([[ant[0], ant[1] - l, ant[2]], [p[0], p[1] - l, p[2]], [p[0], p[1] + l, p[2]], [ant[0], ant[1] + l, ant[2]]], [0, 1, 0], COR.fio);
      quad([[ant[0] - px, ant[1], ant[2] - pz], [p[0] - px, p[1], p[2] - pz], [p[0] + px, p[1], p[2] + pz], [ant[0] + px, ant[1], ant[2] + pz]], [0, 1, 0], COR.fio);
      ant = p;
    }
  }
  function fios(k, quad){
    const MEIO = Mundo.MEIO, PEDACO = Mundo.PEDACO, N = Mundo.PEDACOS;
    for (const p of postes){
      if (Math.floor((p.z + MEIO) / PEDACO) * N + Math.floor((p.x + MEIO) / PEDACO) !== k) continue;
      /* liga no poste mais próximo de cada lado, sem repetir o par */
      const vizinhos = postes.filter(q => q !== p && Math.hypot(q.x - p.x, q.z - p.z) < 44).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z)).slice(0, 2);
      const lx = Math.cos(p.rot), lz = -Math.sin(p.rot);
      for (const q of vizinhos){
        if (q.x < p.x || (q.x === p.x && q.z < p.z)) continue;
        const mx = Math.cos(q.rot), mz = -Math.sin(q.rot), sinal = lx * mx + lz * mz < 0 ? -1 : 1;
        for (const [lat, alt, barriga] of [[-.55, 7.68, .22], [-.2, 7.68, .27], [.2, 7.68, .24], [.55, 7.68, .2], [-.4, 7.12, .3], [.4, 7.12, .36], [.12, 6.1, .45], [-.1, 5.75, .55], [.08, 5.5, .4]])
          fio(quad, [p.x + lx * lat, p.y + alt, p.z + lz * lat], [q.x + mx * lat * sinal, q.y + alt, q.z + mz * lat * sinal], barriga, alt < 6.5 ? .06 : .038);
      }
      /* ligações que descem para as casas */
      casasPerto.filter(c => Math.hypot(c.x - p.x, c.z - p.z) < 17).slice(0, 5).forEach((c, i) => {
        const fx = c.x + Math.sin(c.rot) * c.d / 2, fz = c.z + Math.cos(c.rot) * c.d / 2;
        fio(quad, [p.x, p.y + 5.9 - i * .12, p.z], [fx, c.y + 2.75, fz], .22 + i * .04, .03);
      });
    }
  }
  /* quanto o passeio levanta o chão num ponto (para quem caminha) */
  function degrau(x, z){ const d = dono(x, z); if (d.ri < 0 || !ruas[d.ri].calcada || d.u < GUIA || d.u > FIM) return 0; return portaoPerto(x, z) < 1.3 && d.u < .95 ? .06 : ALTO; }
  return {preparar, gerar, degrau, dono, substituto, temPedaco:k => porPedaco.has(k)};
})();
