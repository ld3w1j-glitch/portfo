/* Pista de obstáculos da tela de animações: monta o cenário, controla o personagem
   (sozinho ou pelo teclado) e desenha tudo em volta dele. Carregado depois de parkour.js. */
const Obstaculos = (() => {
  const L = 1.2;                                    /* meia largura das peças */
  const CORES = {predio:['#a98f78', '#8f8a84'], concreto:['#8f939b', '#b3b7be'], madeira:['#8a6136', '#ad8150'], tijolo:['#9b5440', '#c0b8ac'], metal:['#4d5661', '#7b8794'], obra:['#c79a26', '#e6bd4a']};
  const caixa = (z0, fundo, y1, material = 'concreto', mais = {}) => ({x0:-L, x1:L, y0:0, y1, z0, z1:z0 + fundo, material, ...mais});

  /* ---------------------------------------------------------------- o percurso, em linha reta (+Z) */
  const LISTA = [];
  let z = 0;
  function peca(id, nome, monta, demo){
    const inicio = z, r = monta(inicio + 3.2);
    LISTA.push({id, nome, inicio, caixas:r.caixas, fim:r.fim, ...demo(inicio, r)});
    z = r.fim + 3.4;
  }
  const simples = (altura, fundo, material, extra) => a => ({caixas:[caixa(a, fundo, altura, material, extra)], fim:a + fundo, face:a});
  /* demonstração: chega andando e aperta "pular" perto da face */
  const chega = (perto = .85, correndo = false) => (inicio, r) => ({partida:{z:inicio + .6, y:0}, correndo, pularEm:e => e.visto && e.visto.caixa === r.caixas[0] && e.visto.dist <= perto, para:r.fim + 1.5});

  peca('degrau', 'Degrau de 25 cm', simples(.25, 1.2, 'concreto'), (i, r) => ({partida:{z:i + .8, y:0}, para:r.fim + 1.3}));
  peca('mureta', 'Mureta de 80 cm (fina)', simples(.8, .25, 'tijolo'), chega(1.5, true));
  peca('caixa', 'Caixa de 75 cm (funda)', simples(.75, 1.5, 'madeira'), (i, r) => ({...chega(.8)(i, r), para:r.fim + 1.2}));
  peca('peito', 'Muro de 1,35 m', simples(1.35, 1.6, 'concreto'), (i, r) => ({...chega(.8)(i, r), para:r.fim + 1.2}));
  peca('alto', 'Muro de 2,10 m (agarrar e queda)', simples(2.1, 1.4, 'concreto'), (i, r) => ({...chega(.8)(i, r), deLado:true, para:r.fim + 1.7}));
  function vao(id, nome, alturaB, distancia, correndo){
    peca(id, nome, a => {
      const A = caixa(a - 1.6, 3.6, 2, 'obra'), B = caixa(A.z1 + distancia, 3.2, alturaB, 'obra');
      return {caixas:[A, B], fim:B.z1};
    }, (i, r) => ({partida:{z:r.caixas[0].z0 + .3, y:2}, correndo, pularEm:e => e.y > 1.9 && e.z > r.caixas[0].z1 - (correndo ? .38 : .16) && e.z < r.caixas[0].z1 + .1,
      para:alturaB > 2 ? r.fim - 1.1 : r.caixas[1].z0 + 1.1, deNovoEm:e => e.y < .1}));
  }
  vao('vao', 'Vão de 2,2 m correndo', 2, 2.2, true);
  vao('vaocurto', 'Vão de 2,2 m andando (pega pela borda)', 2, 2.2, false);
  vao('bordaar', 'Pulo para uma borda mais alta', 3.35, 1.7, true);
  peca('baixa', 'Passagem baixa', a => ({caixas:[{x0:-L, x1:L, y0:1.42, y1:1.62, z0:a, z1:a + 1.6, material:'metal', agarra:false}], fim:a + 1.6, postes:true}),
    (i, r) => ({partida:{z:i + .6, y:0}, para:r.fim + 1.2}));
  peca('cacos', 'Muro com caco de vidro', simples(2, .3, 'tijolo', {agarra:false, motivo:'tem caco de vidro em cima: ele não põe a mão', cacos:true}), chega(.8));
  peca('enorme', 'Muro de 3 m sem corda', simples(3.05, 1.6, 'concreto'), chega(.8));

  /* ---- com corda. A demonstração usa a corda quando chega ao muro e quando chega à beirada do outro lado */
  const sobeEDesce = corda => (i, r) => ({partida:{z:i + .6, y:0}, corda, usaCorda:true, para:r.fim + 3});
  peca('corda_muro', 'Muro de 3 m com corda militar', simples(3.05, 1.6, 'concreto', {x0:-2, x1:2}), sobeEDesce({tipo:'militar'}));
  peca('corda_pano', 'Muro de 3 m com corda de pano (uma vez só)', simples(3.05, 1.6, 'concreto'), sobeEDesce({tipo:'pano', panos:3}));
  const largo = {x0:-2.4, x1:2.4};
  const noAlto = corda => (i, r) => ({partida:{z:r.caixas[0].z0 + .6, y:8}, corda, usaCorda:true, camera:9.5, para:r.fim + 3});
  peca('predio_militar', 'Prédio de 8 m: corda militar', simples(8, 2.6, 'predio', {agarra:false, ...largo}), noAlto({tipo:'militar'}));
  peca('predio_pano', 'Prédio de 8 m: pano na medida (8 panos)', simples(8, 2.6, 'predio', {agarra:false}), noAlto({tipo:'pano', panos:8}));
  peca('predio_curta', 'Prédio de 8 m: pouco pano (4 panos)', simples(8, 2.6, 'predio', {agarra:false}), noAlto({tipo:'pano', panos:4}));

  /* ---- quedas que machucam: começa no alto, pula, levanta mancando, trata e volta a andar e correr */
  const queda = mochilaDaDemo => (i, r) => ({partida:{z:r.caixas[0].z0 + .5, y:r.caixas[0].y1}, queda:mochilaDaDemo, camera:8, para:r.fim + 60});
  peca('queda_35', 'Queda de 3,5 m: só sente o impacto', simples(3.5, 2, 'predio', {agarra:false}), (i, r) => ({partida:{z:r.caixas[0].z0 + .5, y:3.5}, camera:8, para:r.fim + 4}));
  peca('queda_leve', 'Queda de 4,8 m: machuca a perna (atadura)', simples(4.8, 2, 'predio', {agarra:false}), queda({panos:3}));
  peca('queda_grave', 'Queda de 6 m: fratura (tala)', simples(6, 2, 'predio', {agarra:false}), queda({panos:3, madeira:2}));
  z += 6;

  const CAIXAS = LISTA.flatMap(p => p.caixas);
  const POSTES = LISTA.find(p => p.id === 'baixa').caixas[0];

  /* ---------------------------------------------------------------- estado */
  const mochila = Object.assign(Rapel.criarMochila(40, true), {madeira:4, kit:1});                /* a do jogador, no controle manual */
  let e, q = .8, escolha = 'todos', atual = 0, tempo = 0, parado_t = 0, pendurado_t = 0, pulou = false, parou = false;
  let deslocado = [0, 0, 0], cam = [0, 0, 0], folga = 0, ultimoY = null, modoAntes = '';
  const teclas = new Set(), apertou = new Set();
  let depois = 0, tremor = 0, poeira = [];

  function colocar(i){
    const antes = e, p = LISTA[i]; atual = i; e = Parkour.criar(null, q);
    if (escolha === 'manual' && antes){ e.ferimento = antes.ferimento; e.curativo = antes.curativo; e.ultimoCurativo = antes.ultimoCurativo; }    /* o ferimento é do jogador */ e.z = p.partida.z; e.y = p.partida.y;
    e.mochila = escolha === 'manual' ? mochila : Rapel.criarMochila(0, p.corda?.tipo === 'militar');
    if (escolha !== 'manual') Object.assign(e.mochila, {madeira:0, kit:0}, p.queda || {});
    depois = 0;
    if (escolha !== 'manual' && p.corda?.tipo === 'pano'){ e.mochila.pano = Rapel.dePano(p.corda.panos); e.mochila.escolhida = 'pano'; }
    e.rot = null; tempo = 0; parado_t = 0; pendurado_t = 0; pulou = false; parou = false;
    cam = [e.x, e.y, e.z]; folga = 0; ultimoY = null; modoAntes = '';
  }
  function iniciar(alturaQuadril){ q = alturaQuadril; if (escolha !== 'manual') colocar(escolha === 'todos' ? atual : indice(escolha)); else if (!e) colocar(0); else e.quadril = q; }
  const indice = id => Math.max(0, LISTA.findIndex(p => p.id === id));
  function escolher(id){
    escolha = id; teclas.clear(); apertou.clear(); if (id === 'manual' && e) e.mochila = mochila;
    if (id === 'todos') colocar(0); else if (id !== 'manual') colocar(indice(id));
  }
  function recomecar(){ colocar(escolha === 'todos' || escolha === 'manual' ? atual : indice(escolha)); }

  /* o que o piloto automático "aperta" neste instante */
  function piloto(dt){
    const p = LISTA[atual], c = {quer:null, correndo:!!p.correndo, pular:false, agachar:false, cima:false, baixo:false, lado:0, usar:false};
    tempo += dt;
    if (!parou && (e.z >= p.para || (p.deNovoEm && pulou && p.deNovoEm(e) && e.modo === 'chao') || (pulou && e.modo === 'chao' && e.visto && ['alto', 'recusa'].includes(e.visto.tipo)))) parou = true;
    if (!parou && tempo > .5) c.quer = 0;
    if (p.queda){
      /* depois de levantar: manca um trecho, para, trata, anda e corre normalmente */
      const levantou = e.evento.includes('levanta mancando');
      c.quer = null; c.usar = false;
      if (!levantou){ if (tempo > .6 && e.modo === 'chao') c.quer = 0; }
      else {
        depois += dt;
        if (depois > .5 && depois < 3.6) c.quer = 0;
        else if (depois > 4.4 && depois < 4.5 && e.modo === 'chao' && e.ferimento && !e.ferimento.tratado) c.tratar = true;
        if (e.evento.includes('ferimento tratado')){ e.desdeCura = (e.desdeCura || 0) + dt; if (e.desdeCura > .5 && e.desdeCura < 7){ c.quer = 0; c.correndo = e.desdeCura > 4.6; } if (e.desdeCura > 8.4) colocar(escolha === 'todos' ? (atual + 1) % LISTA.length : atual); }
      }
      if (tempo > 75) colocar(escolha === 'todos' ? (atual + 1) % LISTA.length : atual);
      return c;
    }
    if (p.usaCorda){
      const aqui = e.comCorda;
      if (e.modo === 'chao' && aqui && tempo > .5 && (aqui.como === 'subir' ? aqui.fz > .9 : aqui.fz < -.9)){   /* só no sentido da demonstração */
        const perto = aqui.como === 'subir' ? aqui.dist <= 1.5 : aqui.dist <= .55;
        if (perto){
          const chave = aqui.como + (aqui.topo * 10 | 0);
          if (e.tentou !== chave){ c.usar = true; e.tentou = chave; e.espera = 0; }
          else if (!Rapel.explicar(aqui, Rapel.naMao(e.mochila)).pode){ e.espera += dt; if (e.espera < 2.2) c.quer = null; }   /* sem corda: pensa um pouco e segue */
        }
      }
      if (e.modo === 'corda'){
        const r = e.rapel;
        if (r.fase === 'rapel'){
          if (r.corda.tipo === 'militar'){
            /* mostra o movimento na corda: um lado, o outro, e um salto lateral na descida alta */
            if (r.como === 'subir'){ if (r.t > .8 && r.t < 1.7) c.lado = -1; else if (r.t > 2.1 && r.t < 3) c.lado = 1; }
            else if (r.topo - r.base > 5){ if (r.t > 1.4 && r.t < 2.8) c.lado = -1; else if (r.t > 3.2 && r.t < 4.6) c.lado = 1; if (r.t > 5.2 && !r.pulouLado){ c.pular = true; c.lado = -1; r.pulouLado = true; } }
          }
          if (r.como === 'subir') c.cima = r.t > .4;
          else { c.baixo = r.t > (r.corda.tipo === 'militar' ? 2.2 : .5) && !(r.corda.tipo === 'militar' && r.topo - r.base > 5 && r.t > 2.9 && r.t < 4.4); if (r.topo - r.base > 5 && r.corda.metros > 5 && r.t > 1.1 && !r.pulou && r.corda.tipo !== 'militar' && r.h < r.topo - 1.4){ c.pular = true; r.pulou = true; } }
        } else if (r.fase === 'ponta') c.baixo = r.t > 2.6;
      }
    }
    if (!pulou && p.pularEm && e.modo === 'chao' && tempo > .5 && p.pularEm(e)){ c.pular = true; pulou = true; }
    if (e.modo === 'pendurado'){
      pendurado_t += dt;
      /* no muro alto ele mostra o passeio pela borda antes de subir */
      if (p.deLado){ if (pendurado_t > .8 && pendurado_t < 1.7) c.lado = 1; else if (pendurado_t > 2 && pendurado_t < 3.8) c.lado = -1; else if (pendurado_t > 4.1 && pendurado_t < 5) c.lado = 1; c.cima = pendurado_t > 5.5; }
      else c.cima = pendurado_t > 1.1;
    }
    if (parou && e.modo === 'chao'){
      parado_t += dt;
      if (parado_t > 1.8) colocar(escolha === 'todos' ? (atual + 1) % LISTA.length : atual);
    }
    if (tempo > 55) colocar(escolha === 'todos' ? (atual + 1) % LISTA.length : atual);
    return c;
  }
  function manual(giro, correr){
    const tem = (...k) => k.some(n => teclas.has(n)), deu = (...k) => k.some(n => apertou.has(n));
    const frente = (tem('w', 'arrowup') ? 1 : 0) - (tem('s', 'arrowdown') ? 1 : 0), lado = (tem('d', 'arrowright') ? 1 : 0) - (tem('a', 'arrowleft') ? 1 : 0);
    const fx = -Math.sin(giro), fz = -Math.cos(giro);
    return {usar:deu('f'), tratar:deu('t'), quer:frente || lado ? Math.atan2(fx * frente - fz * lado, fz * frente + fx * lado) : null, correndo:correr || tem('shift'),
            pular:deu(' '), agachar:tem('c'), cima:e.modo === 'corda' ? tem('w', 'arrowup') : deu('w', 'arrowup', ' '), baixo:e.modo === 'corda' ? tem('s', 'arrowdown') : deu('s', 'arrowdown'), lado};
  }
  function aperta(k){
    if (k !== 'shift' && escolha !== 'manual'){ escolha = 'manual'; if (e) e.mochila = mochila; }     /* quem assume usa a própria mochila */
    if (!teclas.has(k)) apertou.add(k);
    teclas.add(k);
  }
  const solta = k => teclas.delete(k);

  /* adianta o tempo. Devolve {rot, livre (sem pé no chão), yQuadril} */
  function passo(dt, opcoes, parado){
    e.temArma = !!parado.arma;
    if (!e.rot) e.rot = parado.rot;
    const c = escolha === 'manual' ? manual(opcoes.giro, opcoes.correr) : piloto(dt);
    if (!e.rot) e.rot = parado.rot;                          /* o piloto pode ter recomeçado */
    e.temArma = !!parado.arma;
    const s = Parkour.passo(e, dt, c, CAIXAS, parado);
    /* o impacto: a câmera treme e levanta poeira */
    if (e.impactoNovo > 4){
      tremor = Math.min(1.6, (e.impactoNovo - 3.5) / 5) * (e.modo === 'caido' ? 1 : .45);
      const chao = Parkour.chaoEm(CAIXAS, e.x, e.z, e.y + .2);
      for (let i = 0; i < Math.min(26, Math.round(e.impactoNovo * 2)); i++){ const a = i * 2.4, v = .5 + (i % 5) * .22 + e.impactoNovo * .05; poeira.push({p:[e.x, chao + .05, e.z], v:[Math.cos(a) * v, .35 + (i % 3) * .3, Math.sin(a) * v], t:0, tam:.035 + (i % 4) * .016}); }
    }
    for (const g of poeira){ g.t += dt; g.p = g.p.map((v, i) => v + g.v[i] * dt); g.v = g.v.map(v => v * Math.exp(-3.2 * dt)); g.tam *= Math.exp(-1.1 * dt); }
    poeira = poeira.filter(g => g.t < .8);
    apertou.clear();
    if (escolha === 'manual'){
      if (e.y < -1 || Math.abs(e.x) > 7 || e.z < -4 || e.z > z + 3) colocar(atual);
      for (let i = 0; i < LISTA.length; i++) if (e.z >= LISTA[i].inicio) atual = i;
    }
    return s;
  }

  /* altura do quadril na tela, sem tranco na troca entre "pé no chão" e "no ar" */
  function assentarDesenho(dt, yQuadril, peMaisBaixo){
    const alvo = yQuadril === null ? e.y - peMaisBaixo : yQuadril;
    if (ultimoY !== null && e.modo !== modoAntes) folga = ultimoY - alvo;
    modoAntes = e.modo; folga *= Math.exp(-dt * 16);
    const y = alvo + folga; ultimoY = y; e.altQuadril = y - e.y;
    /* a câmera segue com folga: mais firme no chão, mais solta na altura */
    const segue = (v, a, r) => v + (a - v) * (1 - Math.exp(-r * dt));
    /* se ele se afastar muito na altura (queda), a câmera corre atrás */
    const longeY = Math.abs(y - q - cam[1]);
    cam = [segue(cam[0], e.x, 7), segue(cam[1], y - q, 4 + Math.max(0, longeY - .35) * 22), segue(cam[2], e.z, 7)];
    /* tremida do impacto: desloca tudo junto, e vai sumindo */
    tremor *= Math.exp(-dt * 6.5);
    const treme = tremor * .075, agora = typeof performance === 'object' ? performance.now() / 1000 : 0;
    deslocado = [Math.sin(agora * 71) * treme * .6, Math.sin(agora * 93) * treme, Math.cos(agora * 63) * treme * .4];
    return {x:e.x - cam[0] + deslocado[0], y:y - cam[1] + deslocado[1], z:e.z - cam[2] + deslocado[2], rumo:e.rumo};
  }

  /* ---------------------------------------------------------------- desenho do cenário */
  function cena(){
    const f = [], [cx, cy, cz] = cam.map((v, i) => v - deslocado[i]);
    const quad = (pts, n, cor) => f.push({v:pts.map(p => [p[0] - cx, p[1] - cy, p[2] - cz]), n, cor});
    function bloco(x0, x1, y0, y1, z0, z1, cor, topo = cor){
      quad([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], topo);
      quad([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [0, 0, -1], cor);
      quad([[x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1]], [0, 0, 1], cor);
      quad([[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]], [-1, 0, 0], cor);
      quad([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], [1, 0, 0], cor);
      if (y0 > .01) quad([[x0, y0, z0], [x0, y0, z1], [x1, y0, z1], [x1, y0, z0]], [0, -1, 0], cor);
    }
    const bz = Math.floor(cz);
    for (let i = -6; i < 6; i++) for (let k = -9; k <= 9; k++)
      quad([[i, -.004, bz + k], [i + 1, -.004, bz + k], [i + 1, -.004, bz + k + 1], [i, -.004, bz + k + 1]], [0, 1, 0], (i + bz + k) & 1 ? '#b9bcc2' : '#c6c9ce');
    for (const k of CAIXAS){
      if (k.z1 < cz - 11 || k.z0 > cz + 11) continue;
      const [cor, topo] = CORES[k.material];
      bloco(k.x0, k.x1, k.y0, k.y1, k.z0, k.z1, cor, topo);
      /* fiadas, para dar noção de altura (uma a cada 25 cm) */
      const risco = k.material === 'tijolo' ? '#c9beb0' : k.material === 'madeira' ? '#5e3f1f' : k.material === 'obra' ? '#8d6c17' : '#767a82';
      for (let y = k.y0 + .25; y < k.y1 - .05; y += .25) bloco(k.x0 - .004, k.x1 + .004, y, y + .014, k.z0 - .004, k.z1 + .004, risco);
      if (k.cacos) for (let x = k.x0 + .08; x < k.x1; x += .15){
        const zm = (k.z0 + k.z1) / 2 + Math.sin(x * 37) * .06, h = .09 + Math.abs(Math.sin(x * 23)) * .08, cor2 = Math.sin(x * 51) > 0 ? '#2f8a62' : '#7a4a1d';
        quad([[x - .05, k.y1, zm], [x + .05, k.y1, zm], [x + .01, k.y1 + h, zm], [x - .01, k.y1 + h, zm]], [0, 0, -1], cor2);
        quad([[x, k.y1, zm - .05], [x, k.y1, zm + .05], [x, k.y1 + h, zm + .01], [x, k.y1 + h, zm - .01]], [-1, 0, 0], cor2);
      }
    }
    for (const x of [-L - .12, L + .02]) for (const pz of [POSTES.z0, POSTES.z1 - .1]) bloco(x, x + .1, 0, POSTES.y1, pz, pz + .1, '#3b424b');
    /* a borda que ele está lendo: verde = dá para usar, vermelho = não dá, amarelo = passar por baixo */
    const o = e.visto;
    if (o){
      const k = o.caixa, y = o.tipo === 'baixo' ? k.y0 : k.y1, cor = o.tipo === 'baixo' ? '#e8b81e' : o.pode ? '#2fbf55' : '#d6392b', g = .028;
      if (o.nz){ const p = o.plano - o.nz * g; bloco(k.x0, k.x1, y - .03, y + .022, Math.min(p, o.plano), Math.max(p, o.plano), cor); }
      else { const p = o.plano - o.nx * g; bloco(Math.min(p, o.plano), Math.max(p, o.plano), y - .03, y + .022, k.z0, k.z1, cor); }
    }
    for (const c of Rapel.desenho(e, e.altQuadril !== undefined ? e.y + e.altQuadril : null)) corda(c, quad);
    for (const g of poeira){ const r = g.tam; bloco(g.p[0] - r, g.p[0] + r, g.p[1] - r, g.p[1] + r, g.p[2] - r, g.p[2] + r, '#a39b8c'); }
    /* sombra no que estiver embaixo dele: ajuda a ler a altura do pulo */
    const chao = Parkour.chaoEm(CAIXAS, e.x, e.z, e.y), raio = Math.max(.1, .3 - (e.y - chao) * .06);
    if (e.modo !== 'pendurado' && e.modo !== 'corda' && e.modo !== 'caido') for (let i = 0; i < 12; i++){
      const a = i / 12 * Math.PI * 2, b = (i + 1) / 12 * Math.PI * 2, ponto = t => [e.x + Math.cos(t) * raio, chao + .006, e.z + Math.sin(t) * raio * .8];
      quad([[e.x, chao + .006, e.z], ponto(a), ponto(b), [e.x, chao + .006, e.z]], [0, 1, 0], '#6d7078');
    }
    return f;
  }

  /* um pedaço reto de corda: duas fitas cruzadas, para aparecer de qualquer lado */
  function fio(a, b, grosso, cor, quad){
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], t = Math.hypot(...d); if (t < .001) return;
    const u = d.map(v => v / t), ref = Math.abs(u[1]) > .9 ? [1, 0, 0] : [0, 1, 0];
    const x = (p, o) => [p[1]*o[2] - p[2]*o[1], p[2]*o[0] - p[0]*o[2], p[0]*o[1] - p[1]*o[0]], n = v => { const m = Math.hypot(...v) || 1; return v.map(k => k / m); };
    const l1 = n(x(u, ref)), l2 = n(x(u, l1));
    for (const [l, normal] of [[l1, l2], [l2, l1]]){
      const m = (p, s) => [p[0] + l[0] * grosso * s, p[1] + l[1] * grosso * s, p[2] + l[2] * grosso * s];
      quad([m(a, -1), m(a, 1), m(b, 1), m(b, -1)], normal, cor);
    }
  }
  /* a militar é lisa e escura; a de pano é feita de tiras coloridas, com um nó a cada pano */
  const TIRAS = ['#a63d32', '#d9d2bf', '#3f5e86', '#7c6a45'];
  function corda(c, quad){
    let corrido = 0;
    for (let i = 1; i < c.pontos.length; i++){
      const a = c.pontos[i - 1], b = c.pontos[i], t = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), partes = Math.max(1, Math.ceil(t / .16));
      for (let k = 0; k < partes; k++){
        const em = u => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u], de = em(k / partes), ate = em((k + 1) / partes), s = corrido + t * k / partes;
        if (c.tipo === 'militar') fio(de, ate, .017, (s / .16 | 0) % 4 ? '#35421f' : '#59652f', quad);
        else {
          fio(de, ate, .022, TIRAS[(s / Rapel.AJUSTES.metrosPorPano | 0) % TIRAS.length], quad);
          if ((s + t / partes) / Rapel.AJUSTES.metrosPorPano | 0 > (s / Rapel.AJUSTES.metrosPorPano | 0)) fio([ate[0], ate[1] - .045, ate[2]], [ate[0], ate[1] + .045, ate[2]], .042, '#e4dcc6', quad);
        }
      }
      corrido += t;
    }
    /* ponto de amarração no alto, ou o gancho de três pontas */
    const g = c.gancho;
    if (g){ for (const [dx, dz] of [[.11, 0], [-.07, .09], [-.07, -.09]]){ fio(g, [g[0] + dx, g[1] + .02, g[2] + dz], .018, '#6c7078', quad); fio([g[0] + dx, g[1] + .02, g[2] + dz], [g[0] + dx * 1.15, g[1] - .06, g[2] + dz * 1.15], .015, '#6c7078', quad); } }
    else { const a = c.ancora; fio(a, [a[0], a[1] + .28, a[2]], .045, '#3b424b', quad); }
  }

  /* ---------------------------------------------------------------- o que mostrar escrito */
  const NA_CORDA = {guarda:'guardando a arma', amarra:'amarrando a corda', borda:'passando a beirada de costas', arremesso:'lançando o gancho', pes:'pondo os pés na parede',
                    rapel:'na corda (S desce · W sobe · A/D de lado · Espaço salta)', ponta:'pendurado na ponta da corda', chega:'chegando ao chão', recolhe:'puxando a corda de volta', rasgou:'olhando a corda que ficou'};
  const FAZENDO = {chao:'andando', ar:'no ar', pendurado:'pendurado na borda (W sobe · S solta · A/D anda de lado)'};
  const ACOES = {porcima:'passando por cima', subir:'subindo num pulo', escalar:'apoiando as mãos e subindo', agarrar:'pulando para agarrar a borda',
                 agarrarNoAr:'agarrou a borda no ar', puxar:'puxando o corpo para cima', alto:'tenta e não alcança', recusa:'desiste e recua'};
  function leitura(){
    const o = e.visto, nome = LISTA[atual].nome, num = v => v.toFixed(2).replace('.', ',');
    let agora = e.modo === 'acao' ? ACOES[e.acao.tipo] : FAZENDO[e.modo];
    if (e.modo === 'chao') agora = e.atordoado > 0 ? 'se recuperando da queda' : e.amortece > .1 ? 'amortecendo a queda' : e.agacha > .5 ? 'abaixado' : e.loco.vel > 3 ? 'correndo' : e.loco.vel > .2 ? 'andando' : 'parado';
    let frente = 'caminho livre', cor = '';
    if (o){
      const oque = o.tipo === 'baixo' ? `vão de ${num(Math.max(0, o.vaoEmbaixo))} m por baixo` : `${num(Math.max(0, o.altura))} m de altura`;
      frente = oque + (e.modo === 'chao' ? ` a ${num(Math.max(0, o.dist - .22))} m` : '') + ' → ' + o.texto; cor = o.tipo === 'baixo' ? 'amarelo' : o.pode ? 'verde' : 'vermelho';
    }
    if (e.modo === 'corda'){
      const r = e.rapel; agora = NA_CORDA[r.fase];
      frente = r.aviso || `${r.corda.tipo === 'militar' ? 'corda militar' : 'corda de pano'} de ${num(r.corda.metros)} m · parede de ${num(r.topo - r.base)} m`;
      cor = r.aviso ? 'amarelo' : 'verde';
    } else if (e.comCorda){
      const x = Rapel.explicar(e.comCorda, Rapel.naMao(e.mochila)); frente = e.aviso || x.texto; cor = !x.pode ? 'vermelho' : x.curta ? 'amarelo' : 'verde';
    } else if (e.aviso){ frente = e.aviso; cor = 'vermelho'; }
    let saude = '', ferido = null;
    if (e.ferimento){
      ferido = e.ferimento.tipo;
      saude = e.ferimento.tratado ? 'Tratado: o passo está voltando ao normal'
        : 'Ferimento: ' + Saude.FERIMENTOS[e.ferimento.tipo].nome + ' · trate com ' + Saude.FERIMENTOS[e.ferimento.tipo].precisa + (escolha === 'manual' ? ' (parado, tecla T)' : '');
    }
    if (e.modo === 'caido'){ agora = e.faseQueda === 'deitado' ? 'caído no chão' : e.faseQueda === 'maos' ? 'tentando se levantar' : e.faseQueda === 'impacto' ? 'impacto!' : 'se levantando'; frente = 'queda de ' + num(e.queda.altura) + ' m'; cor = 'vermelho'; }
    if (e.modo === 'tratando'){ agora = 'tratando com ' + Saude.REMEDIOS[e.trata.remedio].nome.toLowerCase(); frente = 'fique parado'; cor = 'amarelo'; }
    if (e.modo === 'chao' && e.ferimento && !e.ferimento.tratado) agora = e.loco.vel > .15 ? 'mancando' : 'parado, machucado';
    return {nome, agora, frente, cor, saude, ferido};
  }

  return {LISTA, CAIXAS, iniciar, escolher, recomecar, passo, assentarDesenho, cena, leitura, aperta, solta, soltarTudo:() => { teclas.clear(); apertou.clear(); },
          mochila, escolha:() => escolha, estado:() => e, atual:() => atual};
})();
