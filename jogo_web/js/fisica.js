/* Física dos objetos soltos da rua: sacos de lixo, latões, caixas e pedaços de entulho.
   Sem tela: só as regras e as formas em blocos. Y para cima; o chão fica em y = 0.
   Os números ficam em AJUSTES e servem de referência para o Unity (lá, usar o motor de física dele). */
const Fisica = (() => {
  const AJUSTES = {
    gravidade:9.8,
    jogador:{raio:.28, massa:70},
    parede:{quique:.25},
    /* massa em kg; atrito = quanto da velocidade some por segundo; quique = quanto volta da batida */
    saco:   {massa:6,   raio:.24, altura:.5,  atrito:6.5, quique:.08, pula:.22, amassa:.075},
    lata:   {massa:9,   raio:.28, altura:.95, atrito:7,   quique:.2,  pula:0,   derruba:1.5, empurraoQueda:1.5, atritoDeitada:2.4, atritoAtravessada:5.5, solta:7},
    caixa:  {massa:4,   raio:.25, altura:.42, atrito:7,   quique:.18, pula:.3},
    entulho:{massa:1.2, raio:.09, altura:.1,  atrito:7,   quique:.28, pula:.36},
  };

  /* formas: [x, y da base, z, largura, altura, fundo, cor]. Sempre em blocos, nada redondo */
  const FORMAS = {
    saco:cor => [[0, 0, 0, .34, .14, .30, cor], [0, .135, 0, .43, .165, .37, cor], [0, .295, 0, .365, .145, .325, cor], [0, .435, 0, .15, .1, .14, cor], [.04, .53, -.02, .055, .07, .055, '#C8B468']],
    lata:cor => [[0, 0, 0, .41, .3, .41, cor], [0, .295, 0, .45, .3, .45, cor], [0, .59, 0, .5, .24, .5, cor], [0, .825, 0, .54, .075, .54, '#2F4A32'], [0, .895, 0, .22, .06, .22, '#6C8E6E']],
    caixa:() => [[0, 0, 0, .46, .4, .42, '#9A7449'], [0, .399, 0, .12, .012, .422, '#C9B58C']],
    entulho:(cor, s) => [[0, 0, 0, s * 1.2, s * .75, s, cor]],
  };
  const CORES_SACO = ['#232421', '#2F4230', '#BDBAAC'], CORES_LIXO = ['#C9C6B8', '#5B7FA6', '#A9533B', '#2A2B28', '#B79F74'];

  const preso = (v, a, b) => Math.max(a, Math.min(b, v));
  function sorte(semente){ let s = semente >>> 0 || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }

  function objeto(tipo, x, z, r, extra = {}){
    const A = AJUSTES[tipo], s = tipo === 'entulho' ? .07 + r() * .12 : 1;
    const cor = extra.cor || (tipo === 'saco' ? CORES_SACO[Math.floor(r() * 3)] : tipo === 'lata' ? '#4B7A4E' : tipo === 'entulho' ? ['#A9533B', '#B8B2A4', '#8A6136', '#5A5F67'][Math.floor(r() * 4)] : '');
    return {tipo, x, y:0, z, vx:0, vy:0, vz:0, rumo:r() * Math.PI * 2, vr:0, tomba:0, vtomba:0, dir:0, amassa:0, vamassa:0, solto:false, batidas:0,
      forma:FORMAS[tipo](cor, s), raio:tipo === 'entulho' ? s * .62 : A.raio, altura:tipo === 'entulho' ? s * .75 : A.altura, massa:tipo === 'entulho' ? A.massa * s / .12 : A.massa, ...extra};
  }

  /* o quintal de teste: um quadrado fechado por muretas, com tudo que dá para empurrar */
  function cenario(semente = 5){
    const r = sorte(semente), objetos = [], poe = (t, x, z, extra) => objetos.push(objeto(t, x, z, r, extra));
    for (const [x, z] of [[-.9, 2.2], [-.45, 2.45], [-.75, 2.75], [2.4, 4.4], [2.75, 4.2], [-3.4, -1.5], [3.6, -.6]]) poe('saco', x, z);
    for (const [x, z] of [[.9, 2.4], [1.7, 3.4], [-2.4, 3.6], [-3.1, 1.2], [3.2, 1.9]]) poe('lata', x, z);
    for (const [x, z] of [[-1.9, -2.4], [-1.45, -2.55], [-1.7, -2.45]].slice(0, 2)) poe('caixa', x, z);
    for (let i = 0; i < 34; i++) poe('entulho', 1.2 + (r() - .5) * 2.4, -2.6 + (r() - .5) * 1.9);
    for (const o of objetos) o.inicio = [o.x, o.z];
    return {objetos, meio:6.5, paredes:[{x0:-5.4, x1:-3.9, z0:4.4, z1:4.75, h:.8}, {x0:4.3, x1:4.65, z0:-4.6, z1:-2.2, h:.8}], eventos:[], sorteio:r};
  }

  /* o meio do objeto no chão: um latão deitado ocupa o lugar para o lado em que caiu */
  const desvio = o => o.tipo === 'lata' ? Math.sin(o.tomba) * (o.altura / 2) : 0;
  const centro = o => [o.x + Math.sin(o.dir) * desvio(o), o.z + Math.cos(o.dir) * desvio(o)];
  const raioDe = o => o.tipo === 'lata' ? o.raio + Math.sin(o.tomba) * .12 : o.raio;
  const deitada = o => o.tipo === 'lata' && o.tomba > 1.2;

  /* o latão que cai pela primeira vez abre a tampa e espalha o que tinha dentro */
  function espalhar(w, o){
    o.solto = true; const r = w.sorteio, s = Math.sin(o.dir), c = Math.cos(o.dir);
    for (let i = 0; i < AJUSTES.lata.solta; i++){
      const p = objeto('entulho', o.x + s * .85 + (r() - .5) * .2, o.z + c * .85 + (r() - .5) * .2, r, {cor:CORES_LIXO[Math.floor(r() * CORES_LIXO.length)], lixo:true});
      p.forma = FORMAS.entulho(p.forma[0][6], .05 + r() * .06); p.raio = .05; p.altura = .05; p.massa = .3;
      p.y = .35; const v = .8 + r() * 1.6, a = o.dir + (r() - .5) * 1.5;
      p.vx = Math.sin(a) * v; p.vz = Math.cos(a) * v; p.vy = .6 + r() * 1.4; p.vr = (r() - .5) * 12; p.inicio = null; w.objetos.push(p);
    }
    w.eventos.push({tipo:'espalhou', o});
  }

  /* j = {x, z, vx, vz}: o jogador empurra; devolve a posição corrigida (objeto pesado segura quem anda) */
  function empurraoDoJogador(w, o, j){
    const J = AJUSTES.jogador, [cx, cz] = centro(o), dx = cx - j.x, dz = cz - j.z, d = Math.hypot(dx, dz), junto = J.raio + raioDe(o);
    if (d >= junto || o.y > 1) return;
    const nx = d > 1e-4 ? dx / d : 0, nz = d > 1e-4 ? dz / d : 1, entrou = junto - d, parte = J.massa / (J.massa + o.massa);
    /* pedaço pequeno nem é sentido; o resto divide o espaço conforme o peso */
    const doJogador = o.tipo === 'entulho' ? 0 : Math.min(.55, o.massa / 18);
    o.x += nx * entrou * (1 - doJogador); o.z += nz * entrou * (1 - doJogador);
    j.x -= nx * entrou * doJogador; j.z -= nz * entrou * doJogador;
    const batida = (j.vx - o.vx) * nx + (j.vz - o.vz) * nz;
    if (batida <= .05) return;
    const A = AJUSTES[o.tipo], forca = batida * (1 + A.quique) * parte;
    o.vx += nx * forca; o.vz += nz * forca; o.vr += (nx * j.vz - nz * j.vx) * 1.4;
    if (batida > .7) w.eventos.push({tipo:'bateu', o, forca:batida});
    if (A.pula && o.y <= .001) o.vy += batida * A.pula * (o.tipo === 'entulho' ? .8 + w.sorteio() * .6 : 1);
    if (o.tipo === 'saco') o.vamassa += batida * .9;
    if (o.tipo === 'lata' && o.tomba < .02 && batida > A.derruba){ o.dir = Math.atan2(nx, nz); o.vtomba = (batida - A.derruba * .6) * A.empurraoQueda; }
  }

  function umPasso(w, dt, j, outros){
    const G = AJUSTES.gravidade;
    for (const o of w.objetos){
      const A = AJUSTES[o.tipo];
      if (j) empurraoDoJogador(w, o, j);
      for (const z of outros) empurraoDoJogador(w, o, {...z});          /* eles empurram, mas quem os segura é o combate */
      o.x += o.vx * dt; o.z += o.vz * dt; o.rumo += o.vr * dt;
      /* no ar cai; no chão o atrito segura */
      if (o.y > 0 || o.vy > 0){ o.vy -= G * dt; o.y += o.vy * dt; }
      if (o.y <= 0){
        if (o.vy < -.9){ if (o.tipo === 'saco') o.vamassa += -o.vy * .8; o.vy = -o.vy * A.quique; } else o.vy = 0;
        o.y = 0;
        let atrito = A.atrito;
        if (deitada(o)){
          /* deitado, escorrega mais fácil de lado do que no sentido do comprimento */
          const ex = Math.sin(o.dir), ez = Math.cos(o.dir), aoLongo = o.vx * ex + o.vz * ez, lx = o.vx - ex * aoLongo, lz = o.vz - ez * aoLongo;
          const a = aoLongo * Math.exp(-A.atritoAtravessada * dt), k = Math.exp(-A.atritoDeitada * dt);
          o.vx = ex * a + lx * k; o.vz = ez * a + lz * k;
        } else { const k = Math.exp(-atrito * dt); o.vx *= k; o.vz *= k; }
        o.vr *= Math.exp(-6 * dt);
        if (Math.hypot(o.vx, o.vz) < .02){ o.vx = o.vz = 0; }
      }
      /* saco: amassa na batida e volta como uma mola */
      if (o.tipo === 'saco'){ o.vamassa += (-140 * o.amassa - 14 * o.vamassa) * dt; o.amassa = preso(o.amassa + o.vamassa * dt, -.1, .3); }
      /* latão: até certo ponto volta de pé; passou, cai e quica no chão */
      if (o.tipo === 'lata' && (o.tomba > 0 || o.vtomba > 0)){
        const virada = Math.atan2(o.raio * .8, o.altura / 2);
        o.vtomba += (o.tomba < virada ? -9 : 13 * Math.sin(o.tomba)) * dt;
        o.tomba += o.vtomba * dt;
        if (o.tomba > .75 && !o.solto) espalhar(w, o);
        if (o.tomba <= 0){ o.tomba = 0; o.vtomba = o.vtomba < -.8 ? -o.vtomba * .25 : 0; }
        if (o.tomba >= Math.PI / 2){
          o.tomba = Math.PI / 2;
          if (o.vtomba > 1.2){ w.eventos.push({tipo:'caiu', o, forca:o.vtomba}); o.vtomba = -o.vtomba * .22; } else o.vtomba = 0;
        }
      }
      /* limites do quintal e muretas */
      const r = raioDe(o);
      let [cx, cz] = centro(o);
      const lim = w.meio - r;
      if (cx > lim || cx < -lim){ const n = preso(cx, -lim, lim); o.x += n - cx; o.vx *= -AJUSTES.parede.quique; cx = n; }
      if (cz > lim || cz < -lim){ const n = preso(cz, -lim, lim); o.z += n - cz; o.vz *= -AJUSTES.parede.quique; cz = n; }
      for (const p of w.paredes){
        if (o.y > p.h) continue;
        const fora = naMureta(p, cx, cz, r); if (!fora) continue;
        o.x += fora[0] * fora[2]; o.z += fora[1] * fora[2]; cx += fora[0] * fora[2]; cz += fora[1] * fora[2];
        const v = o.vx * fora[0] + o.vz * fora[1];
        if (v < 0){ o.vx -= (1 + AJUSTES.parede.quique) * v * fora[0]; o.vz -= (1 + AJUSTES.parede.quique) * v * fora[1]; }
      }
    }
    /* objeto contra objeto */
    const lista = w.objetos;
    for (let i = 0; i < lista.length; i++) for (let k = i + 1; k < lista.length; k++){
      const a = lista[i], b = lista[k], [ax, az] = centro(a), [bx, bz] = centro(b), dx = bx - ax, dz = bz - az, junto = (raioDe(a) + raioDe(b)) * .94;
      if (Math.abs(dx) > junto || Math.abs(dz) > junto) continue;
      const d = Math.hypot(dx, dz); if (d >= junto || a.y > b.y + b.altura || b.y > a.y + a.altura) continue;
      const nx = d > 1e-4 ? dx / d : 1, nz = d > 1e-4 ? dz / d : 0, entrou = junto - d, soma = a.massa + b.massa, pa = b.massa / soma, pb = a.massa / soma;
      a.x -= nx * entrou * pa; a.z -= nz * entrou * pa; b.x += nx * entrou * pb; b.z += nz * entrou * pb;
      const rel = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
      if (rel <= 0) continue;
      const imp = rel * 1.15;
      a.vx -= nx * imp * pa; a.vz -= nz * imp * pa; b.vx += nx * imp * pb; b.vz += nz * imp * pb;
      for (const [o, outro, s] of [[a, b, -1], [b, a, 1]]){
        if (o.tipo === 'saco') o.vamassa += rel * .4;
        if (o.tipo === 'lata' && o.tomba < .02 && rel * outro.massa / soma > AJUSTES.lata.derruba * .75){ o.dir = Math.atan2(nx * s, nz * s); o.vtomba = rel * .9; }
      }
    }
    if (j){
      const J = AJUSTES.jogador, lim = w.meio - J.raio;
      j.x = preso(j.x, -lim, lim); j.z = preso(j.z, -lim, lim);
      /* na cena única quem segura o jogador nas paredes é o parkour (ele sobe degraus e passa por cima) */
      if (!j.semMuros) for (const p of w.paredes){ const f = naMureta(p, j.x, j.z, J.raio); if (f){ j.x += f[0] * f[2]; j.z += f[1] * f[2]; } }
    }
  }
  /* círculo contra mureta: devolve [nx, nz, quanto empurrar] */
  function naMureta(p, x, z, r){
    const px = preso(x, p.x0, p.x1), pz = preso(z, p.z0, p.z1), dx = x - px, dz = z - pz, d = Math.hypot(dx, dz);
    if (d >= r) return null;
    if (d > 1e-5) return [dx / d, dz / d, r - d];
    const saidas = [[-1, 0, x - p.x0], [1, 0, p.x1 - x], [0, -1, z - p.z0], [0, 1, p.z1 - z]].sort((a, b) => a[2] - b[2])[0];
    return [saidas[0], saidas[1], saidas[2] + r];
  }

  /* em passos curtos, para nada atravessar nada quando o computador engasga */
  function passo(w, dt, j, outros = []){
    w.eventos.length = 0;
    const partes = Math.max(1, Math.ceil(dt / .008));
    for (let i = 0; i < partes; i++) umPasso(w, dt / partes, j, outros);
    return w.eventos;
  }

  return {AJUSTES, cenario, objeto, passo, centro, raioDe, deitada};
})();
