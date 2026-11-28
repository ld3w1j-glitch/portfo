/* Abrigo: portas que abrem, vidros que quebram, tábuas nas janelas, madeira, e o caminho dos zumbis até quem está dentro.
   A colisão são as mesmas caixas da cena: abrir ou quebrar só liga e desliga a caixa da "folha" (porta ou vidro).
   Não usa a página. Carregado depois de mundo-casas.js e antes de cena.js.

   Regra do jogo (dos usuários): casa tapada é abrigo seguro contra zumbi comum; o grandalhão tira 4 por pancada da barreira.
   Os outros números são provisórios, para testar. */
const Abrigo = (() => {
  const NUM = {
    porta:20,                 /* resistência da porta */
    tabuas:20,                /* resistência da janela tapada */
    danoGrandalhao:4,         /* por pancada, em tábuas e em portas */
    vidro:2,                  /* pancadas de zumbi comum para quebrar o vidro (o grandalhão quebra em uma) */
    custoTapar:2, custoPortaArrombada:3, consertoDa:10,
    tempoTapar:2.2, tempoConsertar:1.3,
    madeiraPorPilha:3,
  };
  const FUNDO = -20;          /* caixa desligada vai para debaixo do chão */
  const preso = (v, a, b) => Math.max(a, Math.min(b, v));

  function criar({CAIXAS, MEIO}){
    const aberturas = [], pilhas = [];
    let versao = 0;

    /* ------------------------------------------------------------ montar as casas */
    /* paredes de fora de uma casa (sem giro), com as portas e janelas como peças separadas */
    function casa(c, caixa, parte){
      const P = Casas.PLANTAS[c.planta], hw = P.w / 2, hd = P.d / 2, E = .18;
      const LADOS = {f:['x', 0, 1], t:['x', 0, -1], d:['z', 1, 0], e:['z', -1, 0]};
      for (const [lado, [eixo, nx, nz]] of Object.entries(LADOS)){
        const meio = eixo === 'x' ? hw : hd;
        const linha = eixo === 'x' ? c.z + nz * (hd - E / 2) : c.x + nx * (hw - E / 2);
        const ao = eixo === 'x' ? c.x : c.z;
        const bloco = (a, b, y0, y1, mais) => {
          const k = eixo === 'x' ? caixa(ao + a, ao + b, y1, linha - E / 2, linha + E / 2, 'predio', {...parte, ...mais})
            : caixa(linha - E / 2, linha + E / 2, y1, ao + a, ao + b, 'predio', {...parte, ...mais});
          k.y0 = y0; return k;
        };
        for (const t of Casas.trechos(-meio, meio, P.fora[lado] || [])){
          if (t.tipo === 'cheio'){ bloco(t.a, t.b, 0, Casas.ALT); continue; }
          const v = t.v, o = {tipo:t.tipo, casa:c, lado, eixo, nx, nz, linha, c:ao + v.c, l:v.l, sill:t.tipo === 'porta' ? 0 : v.sill, h:t.tipo === 'porta' ? 2.14 : v.h,
            x:eixo === 'x' ? ao + v.c : linha, z:eixo === 'x' ? linha : ao + v.c, loja:P.nome.startsWith('loja'), giro:0};
          if (t.tipo === 'porta'){
            bloco(t.a, t.b, 2.2, Casas.ALT);
            o.folha = bloco(t.a, t.b, Casas.PISO, 2.2, {folha:true, porta:true, motivo:'a porta está fechada'});
          } else {
            bloco(t.a, t.b, 0, v.sill, {motivo:'é uma janela'});
            bloco(t.a, t.b, v.sill + v.h, Casas.ALT);
            o.folha = bloco(t.a, t.b, v.sill, v.sill + v.h, {folha:true});
          }
          o.base = [o.folha.y0, o.folha.y1];
          o.escalavel = o.tipo === 'janela' && o.sill < 1.2 && o.l >= .78;
          aberturas.push(o);
        }
      }
    }
    const pilha = (x, z, rumo = 0) => pilhas.push({x, z, rumo, pega:false});

    /* ------------------------------------------------------------ o estado de cada abertura */
    const passa = o => o.tipo === 'porta' ? (o.aberta || o.quebrada) && !o.tabuas : o.vidro <= 0 && !o.tabuas;
    function atualizar(o){
      const ligada = !passa(o), k = o.folha;
      k.y0 = ligada ? o.base[0] : FUNDO; k.y1 = ligada ? o.base[1] : FUNDO + .1;
      for (const copia of k.copias || []){ copia[2] = k.y0; copia[3] = k.y1; }       /* tiro, câmera e corpo mole */
      if (k.noQuintal) k.noQuintal.h = k.y1;                                       /* objetos soltos */
      versao++;
    }
    function zerar(){
      for (const o of aberturas){ Object.assign(o, {aberta:false, quebrada:false, vida:NUM.porta, vidro:o.tipo === 'janela' ? NUM.vidro : 0, tabuas:0, tremeu:0, giro:0}); atualizar(o); }
      for (const p of pilhas) p.pega = false;
    }
    const nomeDe = o => o.tipo === 'porta' ? 'a porta' : 'a janela';

    /* ------------------------------------------------------------ o que o jogador pode fazer ali */
    /* distância até o vão e o quanto ele está virado para lá */
    function perto(o, x, z, rumo){
      const ao = o.eixo === 'x' ? x : z, atraves = (o.eixo === 'x' ? z : x) - o.linha;
      const fora = Math.max(0, Math.abs(ao - o.c) - o.l / 2), d = Math.hypot(fora, atraves);
      const vira = Math.abs(Math.atan2(Math.sin(Math.atan2(o.x - x, o.z - z) - rumo), Math.cos(Math.atan2(o.x - x, o.z - z) - rumo)));
      return {d, vira, atraves, ao:ao - o.c};
    }
    function maisPerto(x, z, rumo, alcance, filtro){
      let melhor = null, nota = 9;
      for (const o of aberturas){
        if (filtro && !filtro(o)) continue;
        const k = perto(o, x, z, rumo);
        if (k.d > alcance || k.vira > 1.5 && k.d > .5) continue;
        const n = k.d + k.vira * .5; if (n < nota){ nota = n; melhor = {o, ...k}; }
      }
      return melhor;
    }
    /* devolve {tipo, o, texto, pode} do que está ao alcance, ou null */
    function ofertar(x, z, rumo, madeira){
      for (const p of pilhas) if (!p.pega && Math.hypot(p.x - x, p.z - z) < 1.25) return {tipo:'pilha', p, pode:true, texto:'E: pegar madeira (+' + NUM.madeiraPorPilha + ')'};
      const k = maisPerto(x, z, rumo, 1.15); if (!k) return null;
      const o = k.o, falta = n => ({tipo:'falta', o, pode:false, texto:'precisa de ' + n + (n > 1 ? ' tábuas' : ' tábua') + ' de madeira'});
      if (o.tabuas > 0){
        const estado = (o.tipo === 'porta' ? 'porta' : 'janela') + ' tapada ' + o.tabuas + '/' + NUM.tabuas;
        if (o.tabuas >= NUM.tabuas) return {tipo:'inteira', o, pode:false, texto:estado};
        return madeira >= 1 ? {tipo:'consertar', o, pode:true, custo:1, tempo:NUM.tempoConsertar, texto:'E: consertar com 1 tábua (' + estado + ')'} : falta(1);
      }
      if (o.tipo === 'janela') return madeira >= NUM.custoTapar ? {tipo:'tapar', o, pode:true, custo:NUM.custoTapar, tempo:NUM.tempoTapar, texto:'E: tapar com ' + NUM.custoTapar + ' tábuas' + (o.vidro <= 0 && o.escalavel ? ' · Espaço: pular a janela' : '')}
        : o.vidro <= 0 && o.escalavel ? {tipo:'falta', o, pode:false, texto:'Espaço: pular a janela · para tapar, precisa de ' + NUM.custoTapar + ' tábuas'} : falta(NUM.custoTapar);
      if (o.quebrada) return madeira >= NUM.custoPortaArrombada ? {tipo:'tapar', o, pode:true, custo:NUM.custoPortaArrombada, tempo:NUM.tempoTapar, texto:'E: tapar a porta arrombada com ' + NUM.custoPortaArrombada + ' tábuas'} : falta(NUM.custoPortaArrombada);
      return {tipo:'porta', o, pode:true, texto:(o.aberta ? 'E: fechar a porta' : 'E: abrir a porta') + (o.vida < NUM.porta ? ' (' + o.vida + '/' + NUM.porta + ')' : '')};
    }
    /* abre ou fecha. corpos = [{x, z}] que não podem estar no vão */
    function usarPorta(o, corpos){
      if (o.aberta && corpos.some(c => { const k = perto(o, c.x, c.z, 0); return Math.abs(k.atraves) < .36 && Math.abs(k.ao) < o.l / 2 + .15; })) return 'tem alguém no vão: saia da porta';
      o.aberta = !o.aberta; atualizar(o); return null;
    }
    function pregou(o, tipo){ o.tabuas = tipo === 'consertar' ? Math.min(NUM.tabuas, o.tabuas + NUM.consertoDa) : NUM.tabuas; atualizar(o); }

    /* golpe, tiro ou flecha do jogador num ponto: quebra o vidro que estiver ali */
    function acertarVidro(p){
      for (const o of aberturas){
        if (o.tipo !== 'janela' || o.vidro <= 0 || o.tabuas) continue;
        const ao = (o.eixo === 'x' ? p[0] : p[2]) - o.c, atraves = (o.eixo === 'x' ? p[2] : p[0]) - o.linha;
        if (Math.abs(atraves) < .24 && Math.abs(ao) < o.l / 2 + .06 && p[1] > o.sill - .08 && p[1] < o.sill + o.h + .08){ o.vidro = 0; atualizar(o); return o; }
      }
      return null;
    }
    /* os dois lados de um vão, a uma distância da parede. lado = +1 fora da casa, -1 dentro */
    function ponto(o, lado, dist){ return {x:o.x + o.nx * lado * dist, z:o.z + o.nz * lado * dist}; }
    const ladoDe = (o, x, z) => (x - o.x) * o.nx + (z - o.z) * o.nz >= 0 ? 1 : -1;
    /* janela quebrada na frente dele, para pular */
    function pularEm(x, z, rumo){
      const k = maisPerto(x, z, rumo, .95, o => o.escalavel && passa(o));
      if (!k || k.vira > 1.0) return null;
      const lado = ladoDe(k.o, x, z), alinhado = preso(k.ao, -k.o.l / 2 + .3, k.o.l / 2 - .3);
      const ate = ponto(k.o, -lado, .72); if (k.o.eixo === 'x') ate.x += alinhado; else ate.z += alinhado;
      return {o:k.o, ate, sill:k.o.sill};
    }

    /* ------------------------------------------------------------ o zumbi na barreira */
    function bater(z, o){
      const bruto = !!z.t.bruto; o.tremeu = .25;
      if (o.tabuas > 0){
        const dano = bruto ? NUM.danoGrandalhao : 0; o.tabuas = Math.max(0, o.tabuas - dano);
        if (dano) atualizar(o);
        return {alvo:'tabuas', dano, resta:o.tabuas, caiu:dano > 0 && o.tabuas === 0};
      }
      if (o.tipo === 'janela'){
        if (o.vidro <= 0) return {alvo:'nada', dano:0};
        o.vidro = Math.max(0, o.vidro - (bruto ? NUM.vidro : 1)); if (!o.vidro) atualizar(o);
        return {alvo:'vidro', dano:1, resta:o.vidro, caiu:o.vidro === 0};
      }
      const dano = bruto ? NUM.danoGrandalhao : 0; o.vida = Math.max(0, o.vida - dano);
      if (dano && !o.vida){ o.quebrada = true; atualizar(o); }
      return {alvo:'porta', dano, resta:o.vida, caiu:dano > 0 && o.vida === 0};
    }

    /* linha de ataque: nada entre os dois na altura do peito */
    function visao(a, b, altura = 1.25){
      const dx = b.x - a.x, dz = b.z - a.z;
      for (const k of CAIXAS){
        if (k.y0 >= altura || k.y1 <= altura) continue;
        let t0 = 0, t1 = 1, fora = false;
        for (const [o, d, mn, mx] of [[a.x, dx, k.x0, k.x1], [a.z, dz, k.z0, k.z1]]){
          if (Math.abs(d) < 1e-9){ if (o < mn || o > mx){ fora = true; break; } continue; }
          let u = (mn - o) / d, v = (mx - o) / d; if (u > v) [u, v] = [v, u];
          t0 = Math.max(t0, u); t1 = Math.min(t1, v); if (t0 > t1){ fora = true; break; }
        }
        if (!fora) return false;
      }
      return true;
    }

    /* ------------------------------------------------------------ o caminho: uma grade do terreno */
    const C = .25, N = Math.ceil(MEIO * 2 / C);
    let parede = null, vao = null;
    const celula = v => preso(Math.floor((v + MEIO) / C), 0, N - 1), centro = i => -MEIO + (i + .5) * C;
    const indice = (x, z) => celula(z) * N + celula(x);
    function montarGrade(){
      parede = new Uint8Array(N * N); vao = new Int16Array(N * N);
      const marcar = (x0, x1, z0, z1, f) => { for (let j = celula(z0); j <= celula(z1); j++) for (let i = celula(x0); i <= celula(x1); i++){ const x = centro(i), z = centro(j); if (x >= x0 && x <= x1 && z >= z0 && z <= z1) f(j * N + i); } };
      const FOLGA = .2;
      for (const k of CAIXAS) if (!k.folha && k.y0 < 1.2 && k.y1 > .45) marcar(k.x0 - FOLGA, k.x1 + FOLGA, k.z0 - FOLGA, k.z1 + FOLGA, i => { parede[i] = 1; });
      aberturas.forEach((o, n) => {
        const meio = Math.max(.14, o.l / 2 - .22), fundo = .34;
        const [x0, x1, z0, z1] = o.eixo === 'x' ? [o.c - meio, o.c + meio, o.linha - fundo, o.linha + fundo] : [o.linha - fundo, o.linha + fundo, o.c - meio, o.c + meio];
        marcar(x0, x1, z0, z1, i => { parede[i] = 0; vao[i] = n + 1; });
      });
    }
    /* quanto custa (em metros) atravessar uma abertura, para um zumbi comum ou para o grandalhão */
    function preco(o, bruto){
      if (o.tipo === 'porta') return passa(o) ? 0 : o.tabuas ? (bruto ? 8 : 12) : (bruto ? 6 : 9);
      if (o.tabuas) return bruto ? 7 : o.escalavel ? 12 : Infinity;                 /* o grandalhão arrebenta as tábuas */
      if (bruto) return Infinity;                                                    /* mas não passa por janela */
      if (!o.escalavel) return Infinity;
      return o.vidro > 0 ? 4.5 : 2;
    }
    /* anda de verdade em linha reta? (porta aberta passa; janela nunca, é preciso pular) */
    const livreAndar = i => !parede[i] && (!vao[i] || aberturas[vao[i] - 1].tipo === 'porta' && passa(aberturas[vao[i] - 1]));
    function linhaLivre(a, b){
      const d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(d / .1));
      for (let k = 1; k < n; k++) if (!livreAndar(indice(a.x + (b.x - a.x) * k / n, a.z + (b.z - a.z) * k / n))) return false;
      return true;
    }
    const VIZ = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    function livrePerto(i){
      if (!parede[i]) return i;
      const x = i % N, y = (i / N) | 0;
      for (let r = 1; r < 5; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++){ const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < N && b < N && !parede[b * N + a]) return b * N + a; }
      return i;
    }
    /* distância de cada célula até o alvo (do alvo para fora). A fila é um monte em listas de números, sem criar objetos */
    const filaD = new Float64Array(N * N * 4), filaI = new Int32Array(N * N * 4);
    function calcular(alvo, bruto){
      /* precisão completa: com menos casas, uma célula parece melhorar para sempre */
      const dist = new Float64Array(N * N).fill(Infinity), precos = aberturas.map(o => preco(o, bruto));
      let n = 0;
      const por = (d, i) => { let k = n++; while (k){ const p = (k - 1) >> 1; if (filaD[p] <= d) break; filaD[k] = filaD[p]; filaI[k] = filaI[p]; k = p; } filaD[k] = d; filaI[k] = i; };
      const tirar = () => { const d = filaD[--n], i = filaI[n]; let k = 0; for (;;){ let m = k * 2 + 1; if (m >= n) break; if (m + 1 < n && filaD[m + 1] < filaD[m]) m++; if (filaD[m] >= d) break; filaD[k] = filaD[m]; filaI[k] = filaI[m]; k = m; } filaD[k] = d; filaI[k] = i; };
      dist[alvo] = 0; por(0, alvo);
      while (n){
        const d = filaD[0], i = filaI[0]; tirar(); if (d > dist[i]) continue;
        const x = i % N, y = (i / N) | 0, v = vao[i];
        for (let q = 0; q < 8; q++){
          const V = VIZ[q], a = x + V[0], b = y + V[1]; if (a < 0 || b < 0 || a >= N || b >= N) continue;
          const j = b * N + a; if (parede[j] || q > 3 && (parede[y * N + a] || parede[b * N + x] || v || vao[j])) continue;
          /* o preço da abertura é cobrado uma vez só (a busca vem do alvo, então é na saída dela) */
          const novo = d + V[2] * C + (v && v !== vao[j] ? precos[v - 1] : 0);
          if (novo < dist[j] - 1e-9){ dist[j] = novo; por(novo, j); }
        }
      }
      return dist;
    }
    const campos = {};
    function campo(p, bruto, agora, qual){
      const k = (bruto ? 'g' : 'c') + (qual || ''), alvo = livrePerto(indice(p.x, p.z)), c = campos[k];
      if (!c || c.versao !== versao || c.alvo !== alvo && agora - c.quando > .25) campos[k] = {alvo, versao, quando:agora, dist:calcular(alvo, bruto)};
      return campos[k].dist;
    }
    /* o próximo passo de um zumbi. null = caminho livre (o combate cuida dele como sempre) */
    function guiar(z, p, agora, qual){
      if (!parede) montarGrade();
      if (linhaLivre(z, p)) return null;
      const bruto = !!z.t.bruto, D = campo(p, bruto, agora, qual);
      let i = livrePerto(indice(z.x, z.z)); if (!isFinite(D[i])) return null;
      let alvo = null, antes = {x:z.x, z:z.z};
      for (let n = 0; n < 24; n++){
        const x = i % N, y = (i / N) | 0; let melhor = -1, menor = D[i];
        for (const [dx, dy] of VIZ){ const a = x + dx, b = y + dy; if (a < 0 || b < 0 || a >= N || b >= N) continue; const j = b * N + a; if (D[j] < menor && !(dx && dy && (parede[y * N + a] || parede[b * N + x]))){ menor = D[j]; melhor = j; } }
        if (melhor < 0) break;
        i = melhor;
        const o = vao[i] ? aberturas[vao[i] - 1] : null;
        if (o && !(o.tipo === 'porta' && passa(o))){
          /* o caminho passa por uma barreira: vai até a frente dela */
          const lado = ladoDe(o, antes.x, antes.z), frente = ponto(o, lado, .6);
          const k = perto(o, z.x, z.z, 0);
          if (ladoDe(o, z.x, z.z) === lado && Math.abs(k.atraves) < .86 && Math.abs(k.ao) < o.l / 2 + .12){
            if (!bruto && !z.rastejando && o.escalavel && passa(o)){ const ate = ponto(o, -lado, .75); return {alvo:ate, pular:{ate, sill:o.sill, o}}; }
            return {alvo:{x:o.x, z:o.z}, bater:o};
          }
          return {alvo:alvo && !linhaLivre(z, frente) ? alvo : frente};
        }
        const c = {x:centro(i % N), z:centro((i / N) | 0)};
        if (linhaLivre(z, c)) alvo = c; else if (alvo) break;
        antes = c;
      }
      return {alvo:alvo || {x:centro(i % N), z:centro((i / N) | 0)}};
    }
    /* a barreira em que ele estava batendo ainda está de pé? */
    const aindaFechada = (z, o) => !passa(o) && Math.hypot(z.x - o.x, z.z - o.z) < 1.7;

    return {NUM, aberturas, pilhas, casa, pilha, zerar, atualizar, passa, nomeDe, perto, ofertar, usarPorta, pregou, acertarVidro, pularEm, ponto, ladoDe, bater, visao, guiar, aindaFechada, linhaLivre:(a, b) => { if (!parede) montarGrade(); return linhaLivre(a, b); }, preco, versao:() => versao};
  }

  /* ---------------------------------------------------------------- desenho: tudo em blocos */
  const PORTA = '#6A472C', PORTA2 = '#573A22', VIDRO = '#9FC4D8', MOLDURA = '#EDE9DD', TABUA = ['#9A6F44', '#86603A', '#AA7E50'], PREGO = '#2B2D31', FERRO = '#B9BEC6';
  const gira = a => [0, Math.sin(a / 2), 0, Math.cos(a / 2)];
  function desenhar(A, api, escondeAcima, tempo){
    for (const o of A.aberturas){
      const cortada = escondeAcima === o.casa;
      const base = o.eixo === 'x' ? 0 : Math.PI / 2;                               /* "ao longo" é o X da peça */
      const treme = o.tremeu > 0 ? Math.sin(tempo * 70) * .018 * (o.tremeu / .25) : 0;
      /* de (ao longo, altura, para fora) para o mundo */
      const em = (a, y, f) => o.eixo === 'x' ? [o.c + a, y, o.linha + o.nz * (f + treme)] : [o.linha + o.nx * (f + treme), y, o.c + a];
      const cubo = (a, y, f, la, al, pr, cor, tomba = 0) => {
        if (cortada && y - al / 2 > 1.3) return;
        if (cortada && y + al / 2 > 1.31){ const baixo = y - al / 2; al = 1.31 - baixo; y = baixo + al / 2; }
        const q = tomba ? api.qm(gira(base), [0, 0, Math.sin(tomba / 2), Math.cos(tomba / 2)]) : gira(base);
        api.cubo(em(a, y, f), q, [la, al, pr], cor, 0);
      };
      if (o.tipo === 'porta'){
        if (o.quebrada){
          /* a folha caída do lado de dentro, em dois pedaços */
          const dentro = (a, f, la, fu, cor, vira) => api.cubo(em(a, Casas.PISO + .045, f), gira(base + vira), [la, .06, fu], cor, 0);
          dentro(-.12, -.8, o.l * .55, 1.05, PORTA, .35); dentro(.3, -1.45, o.l * .42, .75, PORTA2, -.5);
          cubo(o.l / 2 - .06, 1.5, -.02, .1, .55, .07, PORTA, .12);
        } else {
          /* gira na dobradiça, para dentro */
          const larg = o.l - .05, a = o.giro * 1.62, cor = o.loja ? '#3E5566' : PORTA;
          const dobra = o.l / 2 - .03, naFolha = (d, y, esp, la, al, pr, c) => {
            const ao = dobra - Math.cos(a) * d, fo = -.03 - Math.sin(a) * d;
            if (cortada && y + al / 2 > 1.31){ const baixo = y - al / 2; if (baixo > 1.3) return; al = 1.31 - baixo; y = baixo + al / 2; }
            const dx = -Math.cos(a), df = -Math.sin(a), p = em(ao + -df * esp, y, fo + dx * esp);
            const giroY = o.eixo === 'x' ? Math.atan2(-df * o.nz, dx) : Math.atan2(-dx, df * o.nx);
            api.cubo(p, gira(giroY), [la, al, pr], c, 0);
          };
          naFolha(larg / 2, 1.12, 0, larg, 2.1, .065, cor);
          for (const y of [.62, 1.62]) for (const s of [-1, 1]) naFolha(larg / 2, y, s * .04, larg - .22, .62, .016, o.loja ? VIDRO : PORTA2);
          for (const s of [-1, 1]) naFolha(larg - .13, 1.08, s * .065, .1, .05, .05, FERRO);
          if (o.vida < A.NUM.porta) for (let i = 0; i < Math.ceil((A.NUM.porta - o.vida) / 4); i++) for (const s of [-1, 1]) naFolha(larg * (.24 + (i * .31) % .55), .75 + (i * .43) % 1.05, s * .052, .05, .34, .01, '#1F140B');
        }
      } else {
        if (o.vidro > 0){
          cubo(0, o.sill + o.h / 2, -.03, .045, o.h, .05, MOLDURA);                  /* o caixilho do meio */
          cubo(0, o.sill + o.h * .55, -.03, o.l, .035, .05, MOLDURA);
          if (o.vidro < A.NUM.vidro) for (const [a, y, t] of [[-.22, .62, .7], [-.14, .5, -.5], [-.3, .45, 1.9], [.2, .35, -1.1]]) cubo(a * o.l, o.sill + o.h * y, .012, .02, .3, .008, '#EAF6FF', t);       /* trincado */
        } else {
          /* cacos que sobraram na moldura */
          for (let i = 0; i < 7; i++){ const a = (i / 6 - .5) * (o.l - .12), al = .05 + ((i * 7) % 5) * .028; cubo(a, o.sill + al / 2, -.01, .06, al, .015, VIDRO, (i % 3 - 1) * .3); if (i % 2) cubo(a, o.sill + o.h - al / 2, -.01, .055, al, .015, VIDRO, (i % 3 - 1) * .35); }
          for (const s of [-1, 1]) cubo(s * (o.l / 2 - .06), o.sill + o.h * .62, -.01, .07, .2, .015, VIDRO, s * .35);
        }
      }
      if (o.tabuas > 0){
        /* as tábuas ficam pelo lado de dentro; vão caindo conforme a barreira apanha */
        const quantas = o.tipo === 'porta' ? 5 : 3, ficam = Math.max(1, Math.ceil(o.tabuas / A.NUM.tabuas * quantas)), gasta = 1 - o.tabuas / A.NUM.tabuas;
        const y0 = o.tipo === 'porta' ? .3 : o.sill, alt = o.tipo === 'porta' ? 1.75 : o.h;
        const ordem = o.tipo === 'porta' ? [0, 2, 4, 1, 3] : [1, 0, 2];
        for (let n = 0; n < ficam; n++){
          const i = ordem[n], y = y0 + alt * (i + .5) / quantas, inclina = ((i * 5 + 2) % 7 - 3) * .028 + gasta * (i % 2 ? .12 : -.12);
          cubo(0, y, -.135 - (i % 2) * .012, o.l + .26, Math.min(.19, alt / quantas * .82), .045, TABUA[i % 3], inclina);
          for (const s of [-1, 1]) cubo(s * (o.l / 2 + .06), y + s * Math.sin(inclina) * (o.l / 2 + .06), -.175, .035, .035, .025, PREGO);
          if (gasta > .3) cubo((i - 1) * .18, y, -.172, .035, .15, .012, '#3B2A18', .5);
        }
      }
    }
    for (const p of A.pilhas){
      if (p.pega) continue;
      const q = gira(p.rumo), c = Math.cos(p.rumo), s = Math.sin(p.rumo);
      for (let i = 0; i < 6; i++){ const camada = (i / 3) | 0, lado = (i % 3 - 1) * .19 + camada * .02; api.cubo([p.x + s * lado, .04 + camada * .08, p.z + c * lado], gira(p.rumo + (camada ? .07 : -.03) * (i % 3)), [1.05, .065, .16], TABUA[(i + camada) % 3], 0); }
      api.cubo([p.x + c * .2, .175, p.z - s * .2], q, [.06, .03, .5], '#C9A23A', 0);        /* fita amarela: dá para ver de longe */
    }
  }
  /* os vidros inteiros, desenhados por último, transparentes */
  function vidros(A, cubo, escondeAcima){
    for (const o of A.aberturas){
      if (o.tipo !== 'janela' || o.vidro <= 0 || escondeAcima === o.casa) continue;
      const q = gira(o.eixo === 'x' ? 0 : Math.PI / 2), f = -.03, p = o.eixo === 'x' ? [o.c, o.sill + o.h / 2, o.linha + o.nz * f] : [o.linha + o.nx * f, o.sill + o.h / 2, o.c];
      cubo(p, q, [o.l - .02, o.h - .02, .012], VIDRO, .15, .26);
    }
  }
  /* tempo das animações (porta girando, barreira tremendo) */
  function passo(A, dt){
    for (const o of A.aberturas){ o.tremeu = Math.max(0, o.tremeu - dt); const quer = o.aberta ? 1 : 0; o.giro += preso(quer - o.giro, -dt * 3.2, dt * 3.2); }
  }

  return {NUM, criar, desenhar, vidros, passo};
})();
