/* Conferência do mapa: procura o que estragaria o jogo (casa sem entrada, porta tampada, construção sobre outra,
   sobre rua ou água, escada alta demais). Usa a mesma colisão de quem caminha. Não usa a página. */
const Conferir = (() => {
  const TIPOS = {
    acesso:{nome:'Casa em que não dá para entrar', grave:true},
    porta:{nome:'Porta tampada', grave:true},
    sobreposta:{nome:'Construções uma sobre a outra', grave:true},
    via:{nome:'Construção na rua ou na água', grave:true},
    passeio:{nome:'Construção em cima do passeio', grave:false},
    escada:{nome:'Escada alta demais na porta', grave:false},
  };
  const NOME = o => (Povoar.TODOS[o.id] || {}).nome || o.id;
  const portaDe = o => Casas.PLANTAS[o.planta].fora.f.find(v => v.porta);

  /* distância até a beira do asfalto da rua com passeio mais próxima */
  function grade(ruas){
    const g = new Map(), T = 16;
    for (const r of ruas) for (let i = 0; i + 1 < r.pts.length; i++){
      const [ax, az] = r.pts[i], [bx, bz] = r.pts[i + 1], s = {ax, az, bx, bz, meia:r.largura / 2, calcada:r.calcada};
      for (let a = Math.floor((Math.min(ax, bx) - 14) / T); a <= Math.floor((Math.max(ax, bx) + 14) / T); a++) for (let b = Math.floor((Math.min(az, bz) - 14) / T); b <= Math.floor((Math.max(az, bz) + 14) / T); b++){ const k = a * 100003 + b; (g.get(k) || g.set(k, []).get(k)).push(s); }
    }
    return (x, z) => { let u = 1e9; for (const s of g.get(Math.floor(x / T) * 100003 + Math.floor(z / T)) || []){ if (!s.calcada) continue; const dx = s.bx - s.ax, dz = s.bz - s.az, t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / (dx * dx + dz * dz || 1))); u = Math.min(u, Math.hypot(x - s.ax - dx * t, z - s.az - dz * t) - s.meia); } return u; };
  }

  /* dá para sair da frente da casa e chegar lá dentro? Busca no chão, de 25 em 25 cm, priorizando o que está mais perto */
  function entra(res, casa){
    const porta = portaDe(casa), PASSO = .25;
    const alvo = [porta.c, casa.d / 2 - .9];
    const chao = (a, b) => { const [x, z] = Casas.paraMundo(casa, a, b); return {x, z, y:Povoar.chao(res, x, z, 0).y}; };
    const livre = (x, z) => { const [ex, ez] = Povoar.empurrar(res, x, z, 0); return Math.abs(ex - x) < .015 && Math.abs(ez - z) < .015; };
    const longe = casa.d / 2 + (casa.encostada ? 1.5 : Math.min(5.6, (casa.frente || 2) + 2.6));      /* parte do passeio, não do meio da rua */
    for (const lado of [0, -.6, .6, -1.4, 1.4, -2.8, 2.8]){
      const ini = chao(porta.c + lado, longe); if (!livre(ini.x, ini.z)) continue;
      const i0 = Math.round(lado / PASSO), j0 = Math.round((longe - alvo[1]) / PASSO);
      const visto = new Set([i0 + ',' + j0]), fila = [[i0, j0, ini.y]];
      for (let voltas = 0; fila.length && voltas < 1400; voltas++){
        let m = 0; for (let k = 1; k < fila.length; k++) if (Math.abs(fila[k][0]) + Math.abs(fila[k][1]) < Math.abs(fila[m][0]) + Math.abs(fila[m][1])) m = k;
        const [i, j, y] = fila.splice(m, 1)[0];
        if (Math.abs(i) <= 1 && Math.abs(j) <= 1) return true;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){
          const ni = i + di, nj = j + dj, chave = ni + ',' + nj;
          if (visto.has(chave) || Math.abs(ni * PASSO) > casa.w / 2 + 3 || nj * PASSO + alvo[1] > longe + 1) continue;
          const p = chao(alvo[0] + ni * PASSO, alvo[1] + nj * PASSO);
          if (Math.abs(p.y - y) > .47 || !livre(p.x, p.z)) continue;
          visto.add(chave); fila.push([ni, nj, p.y]);
        }
      }
    }
    return false;
  }

  /* prepara a conferência e devolve um passo a passo, para a tela não travar: chame passo() até devolver true */
  function iniciar(res){
    const {m, M, MEIO, CM, C} = Mundo, problemas = [], casas = res.lista.filter(o => o.cat === 'casa'), solidas = res.lista.filter(o => o.cantos && (o.cat === 'casa' || o.id === 'garagem' || o.id === 'carro'));
    const uDe = grade(m.ruas);
    const celula = (x, z) => Math.max(0, Math.min(C - 1, ((z + MEIO) / CM) | 0)) * C + Math.max(0, Math.min(C - 1, ((x + MEIO) / CM) | 0));
    const anota = (tipo, o, detalhe, outro) => problemas.push({tipo, grave:TIPOS[tipo].grave, nome:TIPOS[tipo].nome, detalhe, x:o.x, z:o.z, y:o.y, rot:o.rot, objetos:outro ? [o, outro] : [o]});
    const amostras = (o, encolhe) => { const out = []; for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++){ const a = (i / 4 - .5) * (o.w - encolhe), b = (j / 4 - .5) * (o.d - encolhe); out.push(Casas.paraMundo(o, a, b)); } return out; };
    /* posição: rua, água, passeio e sobreposição */
    const jaPar = new Set(), ordem = new Map(solidas.map((o, i) => [o, i]));
    for (const o of solidas){
      if (o.id === 'carro' && !o.manual) continue;
      const pts = amostras(o, .15);
      if (o.id !== 'carro' && pts.some(([x, z]) => { const k = celula(x, z); return m.agua[k] > 0; })) anota('via', o, `${NOME(o)} dentro da água`);
      else if (o.id !== 'carro' && pts.some(([x, z]) => uDe(x, z) < -.05 || m.mat[celula(x, z)] === M.rua_terra)) anota('via', o, `${NOME(o)} em cima da rua`);
      else if (o.manual && o.cat === 'casa' && pts.some(([x, z]) => uDe(x, z) < 2.15)) anota('passeio', o, `${NOME(o)} ocupa o passeio`);
      for (const q of res.solidos.perto(o.x, o.z, Math.max(o.w, o.d))){
        if (q === o || !q.cantos || !(q.cat === 'casa' || q.id === 'garagem' || q.id === 'carro') || !(o.manual || q.manual || (o.cat === 'casa' && q.cat === 'casa'))) continue;
        const chave = [ordem.get(o), ordem.get(q)].sort((a, b) => a - b).join('-'); if (jaPar.has(chave)) continue;
        if (Povoar.sobrepoem(Povoar.cantos(o.x, o.z, o.w - .2, o.d - .2, o.rot), Povoar.cantos(q.x, q.z, q.w - .2, q.d - .2, q.rot))){ jaPar.add(chave); anota('sobreposta', o.manual ? o : q, `${NOME(o)} e ${NOME(q)}`, o.manual ? q : o); }
      }
    }
    let i = 0;
    return {
      total:casas.length, feitas:() => i, problemas,
      passo(milissegundos = 25){
        const t0 = Date.now();
        while (i < casas.length){
          const o = casas[i++], porta = portaDe(o);
          let tampa = null;
          for (const f of [.3, .65]){ const [x, z] = Casas.paraMundo(o, porta.c, o.d / 2 + f); for (const q of res.solidos.perto(x, z, 6)){ if (q === o || q.vao) continue; const [a, b] = Casas.paraLocal(q, x, z); if (Math.abs(a) < q.w / 2 + .2 && Math.abs(b) < q.d / 2 + .2){ tampa = q; break; } } if (tampa) break; }
          if (tampa) anota('porta', o, `${NOME(tampa)} na frente da porta`, tampa);
          else if (!entra(res, o)) anota('acesso', o, `${NOME(o)}: não há caminho da frente até dentro`);
          const f = o.d / 2 + (o.encostada ? .35 : 1.2), [px, pz] = Casas.paraMundo(o, porta.c, f), sobe = o.y + Casas.PISO - Mundo.altura(px, pz);
          if (sobe > 1.7) anota('escada', o, `${sobe.toFixed(1).replace('.', ',')} m entre o chão e a porta`);
          if (Date.now() - t0 > milissegundos) break;
        }
        return i >= casas.length;
      },
    };
  }
  const resumo = lista => Object.fromEntries(Object.keys(TIPOS).map(k => [k, lista.filter(p => p.tipo === k).length]));
  return {TIPOS, iniciar, entra, resumo};
})();
