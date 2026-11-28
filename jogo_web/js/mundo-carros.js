/* Carros das ruas: os mesmos modelos da Garagem (veiculos.js + ferrugem de blindagem.js), enferrujados ou destruídos,
   preparados para aparecer dezenas de vezes no mundo. A lataria recebe a cor de cada carro; ferrugem, queimado,
   rodas e interior têm cor própria. Níveis: 'detalhe' (bem perto) e 'perto' (sem subdivisão); de longe, caixas.
   Usa só funções dos veículos; não usa a página. */
const CarrosMundo = (() => {
  const TIPOS = [['sedan', 30], ['suv_compacto', 20], ['suv_grande', 10], ['picape_compacta', 18], ['picape_media', 12], ['van', 10]];
  /* largura, comprimento e altura medidos nos modelos */
  const TAMANHOS = {sedan:[2.12, 4.52, 1.72], suv_compacto:[2.12, 4.32, 1.82], suv_grande:[2.28, 4.92, 2.0], picape_compacta:[2.08, 4.52, 1.8], picape_media:[2.23, 5.32, 1.95], van:[2.32, 5.42, 2.4]};
  const SOMA = TIPOS.reduce((s, t) => s + t[1], 0);
  /* r1 escolhe o tipo e r2 o estado: cerca de um terço fica destruído, o resto enferrujado */
  function variante(r1, r2){
    let a = r1 * SOMA, tipo = TIPOS[0][0];
    for (const [t, p] of TIPOS){ if ((a -= p) <= 0){ tipo = t; break; } }
    return `${tipo}-${r2 < .34 ? 'destruido' : 'abandonado'}`;
  }
  const separa = v => { const [tipo, estado] = String(v || '').split('-'); return {tipo:TAMANHOS[tipo] ? tipo : 'sedan', estado:estado === 'destruido' ? 'destruido' : 'abandonado'}; };
  const tamanho = v => { const [w, d, h] = TAMANHOS[separa(v).tipo]; return {w, d, h}; };

  const NEUTRA = '#E8E8E8', POEIRA = '#8F7A5C', LATARIA = /^(pintura|v_pmpint)/;
  const cores = new Map(), rgb8 = c => { if (!cores.has(c)) cores.set(c, [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16))); return cores.get(c); };

  /* vértices no formato do mundo: x y z | nx ny nz | r g b | pinta */
  function vertices(nome, nivel){
    const {tipo, estado} = separa(nome), carro = construirCarro(tipo, {estado, ferrugem:estado === 'destruido' ? 3 : 2}), saida = [], detalhe = nivel === 'detalhe';
    const pega = paletaCarro(NEUTRA), lisos = new Set(LISOS_CARRO);
    for (const parte of carro.partes){
      if (!detalhe && (parte.grupo === 'base' || parte.grupo === 'interior')) continue;
      parte.caixas.forEach(([x, y, z, w, h, d, mat, px], id) => {
        const tam = [w, h, d], min = [x - w / 2, y, z - d / 2], vidro = mat === 'v_vidro', fino = tam.indexOf(Math.min(...tam)), liso = lisos.has(mat);
        if (!detalhe && Math.max(w * h, w * d, h * d) < .004) return;                     /* miudezas não aparecem a distância */
        const base = vidro ? '#27343E' : pega(mat), lataria = LATARIA.test(mat), enferruja = parte.ferrugem && forcaDaFerrugem(mat);
        /* pixels maiores que na Garagem; só onde há ferrugem vale a pena subdividir */
        const lado = detalhe && parte.grupo !== 'base' && !liso ? (enferruja ? .15 : px < 1 ? Math.max(.4, px) : 9) : 9;
        for (const [n, cantos] of FACES_CARRO){
          if (vidro && !n[fino]) continue;
          if (n[1] < 0 && (!detalhe || y < .5)) continue;
          const P = cantos.map(c => c.map((v, i) => min[i] + v * tam[i]));
          const comp = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
          const nu = Math.max(1, Math.min(16, Math.round(comp(P[0], P[1]) / lado))), nv = Math.max(1, Math.min(16, Math.round(comp(P[0], P[3]) / lado)));
          const meio = (a, b, t) => [0, 1, 2].map(i => a[i] + (b[i] - a[i]) * t), em = (s, t) => meio(meio(P[0], P[1], s), meio(P[3], P[2], s), t);
          for (let u = 0; u < nu; u++) for (let v = 0; v < nv; v++){
            const centro = em((u + .5) / nu, (v + .5) / nv);
            let c = base, pinta = lataria ? 1 : 0;
            if (enferruja){
              const nivelF = parte.ferrugem, r = enferrujar(base, mat, centro, n, nivelF, parte.semente);
              /* igual a "só poeira" = tinta ainda inteira; senão é mancha, borda ou escorrido */
              if (!lataria || r !== misto(base, POEIRA, [0, .07, .13, .2][nivelF] * forcaDaFerrugem(mat))){ c = lataria ? misto(r, '#6E3A1C', .18) : r; pinta = 0; }
            }
            let cor = rgb8(c);
            if (pinta){ const f = (cor[0] + cor[1] + cor[2]) / (3 * 232) * (enferruja ? .9 : 1) * ((u * 7 + v * 3 + id) % 5 === 0 ? .955 : 1); cor = [232 * f, 232 * f, 232 * f]; }
            const q = [em(u / nu, v / nv), em((u + 1) / nu, v / nv), em((u + 1) / nu, (v + 1) / nv), em(u / nu, (v + 1) / nv)];
            for (const k of [0, 1, 2, 0, 2, 3]) saida.push(q[k][0], q[k][1], q[k][2], n[0], n[1], n[2], Math.min(255, cor[0]), Math.min(255, cor[1]), Math.min(255, cor[2]), pinta);
          }
        }
      });
    }
    return saida;
  }
  /* desenho simples para longe */
  function longe(g, nome){
    const {tipo, estado} = separa(nome), [w, d, h] = TAMANHOS[tipo], tinta = estado === 'destruido' ? '#4A3228' : 'pintura';
    g.b(0, .35, 0, w - .2, h * .38, d - .2, tinta, 0);
    g.b(0, .35 + h * .38, -.25, w - .35, h * .36, d * .5, '#27343E', 0);
    g.b(0, .35 + h * .74, -.25, w - .3, .1, d * .52, tinta, 0);
  }
  return {TIPOS, TAMANHOS, variante, tamanho, vertices, longe};
})();
