/* Armadilhas e a isca de barulho: objetos de cena em blocos, com regras de jogo (nada aqui ensina a montar coisa alguma).
   A isca é um celular velho arremessado, que toca e atrai os zumbis. As outras ficam no chão e disparam quando um inimigo chega.
   Usa combate.js. Não usa a página. Carregado depois de abrigo.js e antes de cena.js.
   Todos os números são provisórios, para testar. */
const Armadilhas = (() => {
  const TIPOS = {
    isca:{nome:'Isca de barulho (celular velho)', curto:'isca', quantos:3, preparo:0, atraso:1.1, toca:12, raio:24},
    pregos:{nome:'Lata de pregos', curto:'lata de pregos', quantos:2, preparo:2.0, arma:1.5, gatilho:1.15, raio:3.2, dano:230, perna:90, emMim:70, naBarreira:10, barulho:45},
    urso:{nome:'Armadilha de urso', curto:'armadilha de urso', quantos:2, preparo:2.2, arma:.6, gatilho:.4, dano:25, perna:45, prende:9, prendeGrandalhao:3.5},
    tabua:{nome:'Tábua com pregos', curto:'tábua de pregos', quantos:3, preparo:.9, arma:.3, dano:8, perna:20, lento:4, usos:6},
    fio:{nome:'Fio com latas', curto:'fio com latas', quantos:3, preparo:1.8, arma:.5, largura:1.8, queda:2.8, barulho:12},
  };
  const ORDEM = Object.keys(TIPOS);
  const preso = (v, a, b) => Math.max(a, Math.min(b, v));
  const longe = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

  const cheio = () => Object.fromEntries(ORDEM.map(k => [k, TIPOS[k].quantos]));
  const criar = () => ({itens:[], estoque:cheio(), tipo:'isca', eventos:[], estilhacos:[], clarao:null, tempo:0});
  function zerar(S){ Object.assign(S, {itens:[], estoque:cheio(), eventos:[], estilhacos:[], clarao:null, tempo:0}); }
  const repor = S => { S.estoque = cheio(); };
  const trocar = (S, sentido = 1) => { S.tipo = ORDEM[(ORDEM.indexOf(S.tipo) + sentido + ORDEM.length) % ORDEM.length]; return S.tipo; };
  const evento = (S, tipo, mais = {}) => S.eventos.push({tipo, ...mais});

  /* há lugar no chão para pôr alguma coisa aqui? */
  const cabeNoChao = (CAIXAS, x, z, y) => !CAIXAS.some(k => k.y1 > y + .08 && k.y0 < y + .3 && x > k.x0 - .28 && x < k.x1 + .28 && z > k.z0 - .28 && z < k.z1 + .28);

  function colocar(S, tipo, x, y, z, rumo){
    const item = {tipo, x, y, z, rumo, t:0, estado:'armando', usos:TIPOS[tipo].usos || 0, passou:new Map(), lado:new Map()};
    S.itens.push(item); S.estoque[tipo]--; return item;
  }
  /* o celular sai da mão: de = [x,y,z], vai = velocidade */
  function arremessar(S, de, vai){
    const item = {tipo:'isca', x:de[0], y:de[1], z:de[2], vx:vai[0], vy:vai[1], vz:vai[2], rumo:Math.atan2(vai[0], vai[2]), giro:0, t:0, estado:'voando', toque:0};
    S.itens.push(item); S.estoque.isca--; return item;
  }
  /* o que dá para recolher de perto */
  const recolhivel = i => i.estado !== 'voando' && !(i.preso && i.preso.travado > 0);
  const perto = (S, x, z, alcance = 1.0) => S.itens.filter(i => recolhivel(i) && Math.hypot(i.x - x, i.z - z) < alcance).sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0] || null;
  function recolher(S, item){
    S.itens.splice(S.itens.indexOf(item), 1);
    if (item.estado === 'gasta') return false;
    S.estoque[item.tipo]++; return true;
  }

  /* ------------------------------------------------------------ a isca voando e tocando */
  function voar(S, i, dt, w){
    const partes = Math.max(1, Math.ceil(Math.hypot(i.vx, i.vy, i.vz) * dt / .08)), h = dt / partes;
    const dentro = (x, y, z) => w.CAIXAS.some(k => x > k.x0 && x < k.x1 && y > k.y0 && y < k.y1 && z > k.z0 && z < k.z1);
    for (let n = 0; n < partes && i.estado === 'voando'; n++){
      i.vy -= 12 * h; i.giro += h * 14;
      const x = i.x + i.vx * h, z = i.z + i.vz * h;
      /* bateu numa parede: perde o embalo e cai ali mesmo; num vidro inteiro, quebra o vidro */
      if (dentro(x, i.y, z)){ const o = w.abrigo?.acertarVidro([x, i.y, z]); if (o) evento(S, 'vidro', {o}); i.vx *= -.18; i.vz *= -.18; } else { i.x = x; i.z = z; }
      i.y += i.vy * h;
      const chao = w.chao(i.x, i.z, Math.max(i.y, 0) + .2);
      if (i.y <= chao + .02 && i.vy <= 0){
        i.y = chao; evento(S, 'caiu', {i});
        if (i.vy < -3.5){ i.vy = -i.vy * .25; i.vx *= .45; i.vz *= .45; i.y = chao + .03; } else { i.estado = 'caida'; i.t = 0; i.vx = i.vy = i.vz = 0; }
      }
    }
    i.x = preso(i.x, -w.meio + .2, w.meio - .2); i.z = preso(i.z, -w.meio + .2, w.meio - .2);
  }

  /* ------------------------------------------------------------ o estouro */
  function estourar(S, i, w){
    const A = TIPOS.pregos, m = w.m, onde = {x:i.x, z:i.z}, altura = i.y + .5;
    S.itens.splice(S.itens.indexOf(i), 1);
    const alcanca = alvo => longe(onde, alvo) < A.raio && (!w.abrigo || longe(onde, alvo) < .5 || w.abrigo.visao(onde, alvo, altura));
    let pegos = 0, mortos = 0;
    for (const z of m.zumbis){
      if (!Combate.vivo(z) || !alcanca(z)) continue;
      const d = longe(onde, z), f = 1 - d / (A.raio + .5), r = Math.atan2(z.x - i.x, z.z - i.z), dir = [Math.sin(r), .55, Math.cos(r)];
      pegos++; z.vida -= A.dano * f; z.pisca = .15; z.travado = 0;
      evento(S, 'ferido', {z, dir, forca:1.6 * f + .6});
      if (z.vida <= 0){ z.impulso = {dir, forca:3 + 5 * f}; Combate.matar(m, z, false); mortos++; continue; }
      z.pernas -= A.perna * f; if (z.pernas <= 0) z.rastejando = true;
      Combate.derrubar(m, z, 2.8); z.empurrado = {vx:Math.sin(r) * 4 * f, vz:Math.cos(r) * 4 * f, t:.3};
    }
    /* quem pôs a lata também se machuca se estiver perto e sem parede no meio */
    if (alcanca(w.p)){ const f = 1 - longe(onde, w.p) / (A.raio + .5); evento(S, 'meAcertou', {dano:Math.round(A.emMim * f), de:onde}); }
    /* vidros, tábuas e portas em volta */
    for (const o of w.abrigo?.aberturas || []){
      if (Math.hypot(o.x - i.x, o.z - i.z) > A.raio) continue;
      if (o.tabuas > 0){ o.tabuas = Math.max(0, o.tabuas - A.naBarreira); w.abrigo.atualizar(o); }
      else if (o.tipo === 'porta' && !o.aberta && !o.quebrada){ o.vida = Math.max(0, o.vida - A.naBarreira); if (!o.vida){ o.quebrada = true; w.abrigo.atualizar(o); } }
      if (o.vidro > 0){ o.vidro = 0; w.abrigo.atualizar(o); evento(S, 'vidro', {o}); }
    }
    /* outra lata no raio estoura junto, um instante depois */
    for (const outra of S.itens) if (outra.tipo === 'pregos' && outra.estado === 'pronta' && longe(onde, outra) < A.raio){ outra.estado = 'emCadeia'; outra.t = 0; }
    for (let n = 0; n < 46; n++){
      const a = n * 2.399, sobe = .06 + (n % 7) * .09, v = 9 + (n % 5) * 2;
      S.estilhacos.push({p:[i.x, i.y + .2, i.z], v:[Math.sin(a) * v, sobe * v * .55, Math.cos(a) * v], t:.2 + (n % 4) * .05});
    }
    S.clarao = {p:[i.x, i.y + .35, i.z], t:.16};
    Combate.barulho(m, onde, A.barulho);
    evento(S, 'explodiu', {onde, pegos, mortos});
  }

  /* ------------------------------------------------------------ um passo de tempo
     w = {m (a luta), p (o sobrevivente), CAIXAS, abrigo, chao(x,z,y), meio} */
  function passo(S, dt, w){
    S.eventos.length = 0; S.tempo += dt;
    const m = w.m;
    if (S.clarao && (S.clarao.t -= dt) <= 0) S.clarao = null;
    for (let n = S.estilhacos.length - 1; n >= 0; n--){ const e = S.estilhacos[n]; e.t -= dt; e.v[1] -= 9 * dt; e.p = [e.p[0] + e.v[0] * dt, Math.max(.02, e.p[1] + e.v[1] * dt), e.p[2] + e.v[2] * dt]; if (e.t <= 0) S.estilhacos.splice(n, 1); }
    for (const i of [...S.itens]){
      if (!S.itens.includes(i)) continue;
      const A = TIPOS[i.tipo]; i.t += dt;
      if (i.tipo === 'isca'){
        if (i.estado === 'voando') voar(S, i, dt, w);
        else if (i.estado === 'caida' && i.t >= A.atraso){ i.estado = 'tocando'; i.t = 0; i.toque = 0; }
        else if (i.estado === 'tocando'){
          if ((i.toque -= dt) <= 0){ i.toque = 1.5; evento(S, 'toque', {i}); }
          if (i.t >= A.toca){ i.estado = 'muda'; evento(S, 'acabou', {i}); }
        }
        continue;
      }
      if (i.estado === 'armando'){ if (i.t >= A.arma){ i.estado = 'pronta'; i.t = 0; } continue; }
      if (i.estado === 'emCadeia'){ if (i.t >= .16) estourar(S, i, w); continue; }
      if (i.estado !== 'pronta') continue;
      for (const z of m.zumbis){
        if (!Combate.vivo(z) || z.estado === 'pulando' || i.y > .6) continue;
        const dx = z.x - i.x, dz = z.z - i.z, d = Math.hypot(dx, dz);
        if (i.tipo === 'pregos'){
          if (d < A.gatilho && (!w.abrigo || d < .5 || w.abrigo.visao(i, z, i.y + .5))){ estourar(S, i, w); break; }
        } else if (i.tipo === 'urso'){
          if (d >= A.gatilho || z.travado > 0) continue;
          i.estado = 'disparada'; i.preso = z; z.travado = z.t.bruto ? A.prendeGrandalhao : A.prende; z.x = i.x; z.z = i.z; z.vel = 0;
          z.vida -= A.dano; z.pisca = .12; z.pernas -= A.perna;
          evento(S, 'prendeu', {i, z});
          if (z.vida <= 0) Combate.matar(m, z, false);
          else if (z.pernas <= 0 && !z.rastejando){ z.rastejando = true; z.agarrao = false; Combate.muda(z, 'caido', 1.1); z.paraFrente = true; }
          else Combate.muda(z, 'cambaleando', .8);
          break;
        } else if (i.tipo === 'tabua'){
          /* a tábua fica atravessada no caminho: 1 m de largura */
          const u = dx * Math.cos(i.rumo) - dz * Math.sin(i.rumo), v = dx * Math.sin(i.rumo) + dz * Math.cos(i.rumo);
          if (Math.abs(u) > .55 || Math.abs(v) > .3 || z.vel < .12 || S.tempo - (i.passou.get(z) ?? -9) < 2.5) continue;
          i.passou.set(z, S.tempo); const k = z.t.bruto ? .5 : 1;
          z.vida -= A.dano * k; z.pisca = .12; z.pernas -= A.perna * k; z.lento = A.lento * k;
          evento(S, 'furou', {i, z});
          if (z.vida <= 0) Combate.matar(m, z, false);
          else if (z.pernas <= 0 && !z.rastejando){ z.rastejando = true; z.agarrao = false; Combate.muda(z, 'caido', 1.1); z.paraFrente = true; }
          if (--i.usos <= 0){ i.estado = 'gasta'; evento(S, 'gastou', {i}); break; }
        } else if (i.tipo === 'fio'){
          const u = dx * Math.cos(i.rumo) - dz * Math.sin(i.rumo), v = dx * Math.sin(i.rumo) + dz * Math.cos(i.rumo), antes = i.lado.get(z);
          i.lado.set(z, v);
          const cruzou = antes !== undefined && Math.sign(antes) !== Math.sign(v) && Math.abs(antes) < .5;
          if (Math.abs(u) > A.largura / 2 || !(cruzou || Math.abs(v) < .1)) continue;
          i.estado = 'disparada';
          if (z.t.bruto) Combate.muda(z, 'cambaleando', 1.2); else if (!z.rastejando){ Combate.derrubar(m, z, A.queda); z.paraFrente = true; }
          Combate.barulho(m, i, A.barulho); evento(S, 'tropecou', {i, z});
          break;
        }
      }
    }
    /* o combate precisa saber quais iscas estão tocando */
    m.iscas = S.itens.filter(i => i.tipo === 'isca' && i.estado === 'tocando').map(i => (i.alvo || (i.alvo = {x:i.x, z:i.z, raio:TIPOS.isca.raio, item:i})));
  }

  /* ------------------------------------------------------------ desenho: tudo em blocos */
  const gira = a => [0, Math.sin(a / 2), 0, Math.cos(a / 2)];
  const FERRO = '#4A4F57', FERRO2 = '#6E747D', PREGO = '#B9BEC6', FERRUGEM = '#8A4A24', LATA = '#8E969E', MADEIRA = '#86603A', PAPEL = '#C4572F';
  function desenhar(S, api, tempo){
    for (const i of S.itens){
      const c = Math.cos(i.rumo), s = Math.sin(i.rumo);
      /* u = de lado, v = para a frente da peça */
      const em = (u, y, v) => [i.x + c * u + s * v, i.y + y, i.z - s * u + c * v];
      const q = gira(i.rumo), cubo = (u, y, v, w, h, d, cor, emite = 0, quat = q) => api.cubo(em(u, y, v), quat, [w, h, d], cor, emite);
      const tomba = (eixo, a) => { const r = [0, 0, 0, Math.cos(a / 2)]; r[eixo] = Math.sin(a / 2); return api.qm(q, r); };
      if (i.tipo === 'isca'){
        const voando = i.estado === 'voando', quat = voando ? tomba(0, i.giro) : q, acesa = i.estado === 'tocando' && Math.sin(tempo * 18) > -.3;
        cubo(0, .022, 0, .092, .036, .18, '#1E1F23', 0, quat);
        if (!voando){
          cubo(0, .043, -.008, .072, .005, .125, acesa ? '#7DF59A' : i.estado === 'muda' ? '#2A3238' : '#3A6EA8', acesa ? 1 : 0);
          cubo(0, .043, .072, .028, .005, .012, '#6E747D');
          cubo(.02, .045, .02, .006, .004, .09, '#C9D2D8', 0, tomba(1, .6));      /* a tela rachada */
          cubo(-.03, .05, -.088, .016, .016, .02, '#C9A23A');
        }
        /* as ondas do toque */
        if (i.estado === 'tocando') for (let n = 0; n < 3; n++){
          const f = (tempo * 1.4 + n / 3) % 1, r = .18 + f * .7;
          for (let k = 0; k < 8; k++){ const a = k * Math.PI / 4; api.cubo([i.x + Math.sin(a) * r, i.y + .12 + f * .25, i.z + Math.cos(a) * r], gira(a), [.1 * (1 - f) + .02, .018, .018], '#FFE27A', 1); }
        }
      } else if (i.tipo === 'pregos'){
        cubo(0, .12, 0, .17, .23, .17, LATA); cubo(0, .245, 0, .19, .025, .19, FERRO2); cubo(0, .01, 0, .19, .02, .19, FERRO2);
        cubo(0, .12, 0, .178, .085, .178, PAPEL);
        for (let n = 0; n < 14; n++){
          const lado = n % 4, y = .05 + ((n * 5) % 9) * .021, fora = .12, de = ((n * 3) % 5 - 2) * .028;
          if (lado < 2) cubo((lado ? -1 : 1) * fora, y, de, .075, .014, .014, n % 3 ? PREGO : FERRUGEM, 0, tomba(2, ((n % 3) - 1) * .35));
          else cubo(de, y, (lado === 2 ? 1 : -1) * fora, .014, .014, .075, n % 3 ? PREGO : FERRUGEM, 0, tomba(0, ((n % 3) - 1) * .35));
        }
        for (const [u, v] of [[-.05, .02], [.04, -.04], [.02, .05]]) cubo(u, .29, v, .013, .07, .013, PREGO);
        /* pisca quando está pronta */
        const pronta = i.estado === 'pronta' || i.estado === 'emCadeia';
        cubo(.052, .268, .052, .03, .022, .03, pronta ? (Math.sin(tempo * 5) > .4 ? '#FF3B30' : '#7A1E18') : '#3B3F45', pronta && Math.sin(tempo * 5) > .4 ? 1 : 0);
      } else if (i.tipo === 'urso'){
        const fechada = i.estado === 'disparada';
        cubo(0, .018, 0, .5, .03, .07, FERRO); for (const l of [-1, 1]) cubo(l * .3, .022, 0, .1, .038, .1, FERRO2);     /* base e molas */
        if (!fechada) cubo(0, .045, 0, .13, .018, .13, i.estado === 'pronta' ? '#B5662F' : FERRO2);
        for (const l of [-1, 1]){
          const ang = fechada ? l * 1.22 : l * .06, alto = Math.sin(Math.abs(ang)), raso = Math.cos(ang);
          const na = (u, r) => [u, .04 + alto * r, l * raso * r + (fechada ? -l * .02 : 0)];
          const [u0, y0, v0] = na(0, .2); cubo(u0, y0, v0, .36, .035, .035, FERRO);
          for (const lado of [-1, 1]){ const [u, y, v] = na(lado * .19, .11); cubo(u, y, v, .035, .035, .17, FERRO, 0, tomba(0, -l * Math.abs(ang))); }
          for (let n = 0; n < 6; n++){ const [u, y, v] = na(-.15 + n * .06, .2); cubo(u, y + (fechada ? 0 : .045), v + (fechada ? -l * .03 : 0), .022, fechada ? .022 : .065, fechada ? .075 : .022, PREGO); }
        }
        api.risco(em(.34, .02, 0), em(.62, .012, .12), .018, FERRO, 0); cubo(.64, .05, .13, .04, .1, .04, FERRUGEM);       /* corrente e estaca */
      } else if (i.tipo === 'tabua'){
        cubo(0, .028, 0, 1.05, .045, .24, MADEIRA); cubo(-.1, .056, .02, .5, .006, .018, '#5E3F22');
        for (let n = 0; n < 18; n++){ const u = -.47 + (n % 9) * .118 + (n > 8 ? .045 : 0), v = n > 8 ? .062 : -.058; cubo(u, .1, v, .018, .11, .018, n % 4 ? PREGO : FERRUGEM, 0, tomba(2, ((n * 7) % 5 - 2) * .07)); }
        if (i.estado === 'gasta') for (const u of [-.3, .18]) cubo(u, .06, 0, .06, .006, .22, '#5A1210');
      } else if (i.tipo === 'fio'){
        const meia = TIPOS.fio.largura / 2;
        for (const l of [-1, 1]){ cubo(l * meia, .17, 0, .06, .36, .06, '#6A4A2C'); cubo(l * meia, .36, 0, .075, .035, .075, '#86603A'); }
        if (i.estado === 'disparada'){
          api.risco(em(-meia, .25, 0), em(-meia * .3, .02, .12), .012, '#D9D2BF', 0); api.risco(em(meia, .25, 0), em(meia * .35, .02, -.1), .012, '#D9D2BF', 0);
          for (const [u, v, a] of [[-.28, .16, .7], [.1, -.14, -.4], [.4, .12, 1.3]]) cubo(u, .04, v, .13, .075, .075, LATA, 0, tomba(1, a));
        } else {
          api.risco(em(-meia, .25, 0), em(meia, .25, 0), .012, '#D9D2BF', 0);
          for (const [n, u] of [-.45, .02, .5].entries()){ const balanca = Math.sin(tempo * 2 + n * 2) * .008; cubo(u + balanca, .16, 0, .075, .11, .075, n % 2 ? LATA : '#A8763A'); cubo(u + balanca, .222, 0, .012, .04, .012, '#D9D2BF'); }
        }
      }
    }
    for (const e of S.estilhacos){ const n = Math.hypot(...e.v) || 1; api.risco(e.p, e.p.map((v, k) => v - e.v[k] / n * .16), .014, '#C9CED6', 0); }
    if (S.clarao){
      const k = S.clarao.t / .16, r = .25 + (1 - k) * 1.1;
      api.cubo(S.clarao.p, gira(tempo * 9), [r * .8, r * .8, r * .8], '#FFF2B8', 1);
      for (let n = 0; n < 8; n++){ const a = n * Math.PI / 4 + .3; api.cubo([S.clarao.p[0] + Math.sin(a) * r, S.clarao.p[1] + (n % 3 - 1) * r * .45, S.clarao.p[2] + Math.cos(a) * r], gira(a), [.14 * k + .05, .14 * k + .05, .14 * k + .05], n % 2 ? '#FF9A2A' : '#FFD23A', 1); }
    }
  }

  return {TIPOS, ORDEM, criar, zerar, repor, trocar, colocar, arremessar, perto, recolher, cabeNoChao, passo, desenhar};
})();
