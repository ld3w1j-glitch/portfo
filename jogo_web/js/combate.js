/* Combate corpo a corpo: as regras (sem tela nem teclado) e as poses dos zumbis em luta.
   Tudo são valores de jogo, juntos aqui para serem ajustados e, depois, copiados para o Unity.
   Mundo: rumo 0 = +Z. Carregado depois de animacao.js. */
const Combate = (() => {
  const preso = (v, a, b) => Math.max(a, Math.min(b, v));
  const suave = x => { const t = preso(x, 0, 1); return t * t * (3 - 2 * t); };
  const puxa = (v, alvo, ritmo, dt) => v + (alvo - v) * (1 - Math.exp(-ritmo * dt));
  const lerp = (a, b, t) => a + (b - a) * t;
  const angulo = a => Math.atan2(Math.sin(a), Math.cos(a));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const rumoAte = (de, para) => Math.atan2(para.x - de.x, para.z - de.z);

  /* ---------------------------------------------------------------- o sobrevivente */
  const J = {
    vida:100, folego:100,
    volta:24, voltaDefendendo:7, espera:.55,      /* fôlego por segundo, e quanto espera depois de gastar */
    correr:13,
    deCostas:.58, deLado:.82,                      /* andar de costas é bem mais lento: não dá para fugir lutando para sempre */                                    /* fôlego por segundo correndo */
    golpe:14, golpePesado:20, golpeForte:29, mao:8,
    cansado:16,                                   /* abaixo disto os golpes saem lentos e fracos */
    defesa:15, defesaBruta:42, defesaNaHora:.28, custoNaHora:3,
    empurrar:18, empurrarEspera:.75, empurrarAlcance:1.55,
    esquiva:22, esquivaDura:.3, esquivaAnda:1.5, esquivaEspera:1.2,
    pisar:14, pisarAlcance:1.35,
  };

  /* ---------------------------------------------------------------- o agarrão, em etapas
     1 agarrou · 2 disputa (o rosto chega perto) · 3 mordida · 4 no chão
     Para se soltar usa-se o MESMO comando de atacar, repetidas vezes. */
  const ETAPAS = {1:'agarrão', 2:'disputa', 3:'mordida', 4:'no chão'};
  /* o estado do sobrevivente decide onde o agarrão começa e como ele avança.
     inicio = etapa de partida; comeca = quanto da barra já vem cheia; aperto = quanto cada golpe enche; cai = quanto a barra esvazia por segundo;
     derruba = chance de ir ao chão; custo = fôlego por aperto; fadiga = fôlego MÁXIMO perdido (só volta dormindo) */
  const CONDICOES = {
    saudavel:  {nome:'Saudável',   inicio:1, comeca:.46, aperto:.17,  cai:.17, derruba:0,   custo:1.1, fadiga:1.5},
    debilitado:{nome:'Debilitado', inicio:2, comeca:.32, aperto:.122, cai:.22, derruba:.14, custo:1.8, fadiga:3},
    grave:     {nome:'Estado grave', inicio:2, comeca:.24, aperto:.112, cai:.25, derruba:.62, custo:2.2, fadiga:5},
  };
  const G = {
    tempo:{1:2.2, 2:2.1, 3:1.35, 4:2.7},
    mordida:{dano:13, infeccao:.05},              /* a mordida leve da etapa 3 */
    mordidaNoChao:{dano:21, infeccao:.08},
    porPerto:.075, noChaoPorPerto:.05,             /* cada zumbi em volta puxa mais: esvazia a barra mais depressa */
    levantar:1.15,                                 /* segundos para ficar de pé, sem poder fazer nada */
    fadigaMinima:55,                               /* o fôlego máximo nunca passa abaixo disto */
  };

  /* ---------------------------------------------------------------- armas de perto
     tipo muda o efeito: contundente derruba; corte machuca e estraga membros; ponta mantém distância.
     impacto = quanto tira do equilíbrio; golpes = quanto a arma aguenta antes de quebrar */
  const A = (tipo, impacto, golpes, mais) => ({tipo, impacto, golpes, pesada:false, ...mais});
  const ARMAS_PERTO = {
    nenhum:A('mao', 13, Infinity),
    taco_pregos:A('contundente', 34, 40), taco_arame:A('contundente', 34, 36), cano:A('contundente', 32, 80), pe_de_cabra:A('contundente', 34, 95), chave_roda:A('contundente', 33, 85),
    marreta:A('contundente', 70, 70, {pesada:true}), frigideira:A('contundente', 40, 75), pa:A('contundente', 52, 45, {pesada:true}), remo:A('contundente', 48, 24, {pesada:true}),
    violao:A('contundente', 44, 10, {pesada:true}), corrente:A('contundente', 38, 90, {pesada:true}), maca_engrenagem:A('contundente', 62, 45, {pesada:true}),
    facao:A('corte', 20, 55), machadinha:A('corte', 24, 40), machado_placa:A('corte', 40, 30, {pesada:true}), machado_bombeiro:A('corte', 52, 85, {pesada:true}),
    foice:A('corte', 22, 45, {pesada:true}), enxada:A('corte', 42, 45, {pesada:true}), serrote:A('corte', 12, 25), machadinha_tatica:A('corte', 26, 75),
    faca_combate:A('ponta', 10, 70), lanca:A('ponta', 36, 28), forcado:A('ponta', 44, 45),
  };
  const armaDePerto = id => ARMAS_PERTO[id] || A('contundente', 24, Infinity);        /* arma de fogo usada como porrete */

  /* ---------------------------------------------------------------- os zumbis */
  const T = (nome, o) => ({nome, vida:125, equilibrio:100, pernas:60, bracos:60, vel:1.05, alcance:1.18, dano:15, preparo:.68, depois:.62, agarra:.34, escala:1, empurravel:true, ...o});
  const TIPOS = {
    comum:T('Zumbi', {modelos:['funcionario', 'esfarrapado', 'miolos', 'dorminhoco', 'medica']}),
    arrastado:T('Arrastado', {vida:112, vel:.6, preparo:.9, modelos:['estripado', 'inchado', 'chef'], agarra:.45}),
    corredor:T('Corredor', {vida:85, equilibrio:62, pernas:42, vel:2.8, preparo:.44, depois:.55, dano:12, agarra:.4, modelos:['corredor', 'atleta']}),
    brutamontes:T('Brutamontes', {vida:290, equilibrio:240, pernas:170, bracos:170, vel:.72, alcance:1.4, dano:30, preparo:1.15, depois:1.15, agarra:0, escala:1.17, empurravel:false, bruto:true, modelos:['brutamontes']}),
  };

  /* ---------------------------------------------------------------- criar */
  function novoZumbi(tipo, x, z, rumo = Math.PI, semente = Math.random()){
    const t = TIPOS[tipo];
    return {tipo, t, x, z, rumo, modelo:t.modelos[Math.floor(semente * 997) % t.modelos.length], semente,
            vida:t.vida, equilibrio:t.equilibrio, pernas:t.pernas, bracos:t.bracos, rastejando:false, semBraco:false,
            estado:'vagando', tempo:0, dura:0, vel:0, passo:semente * 6, alvoRumo:rumo, espera:0, agarrao:false, acertou:false, lado:semente < .5 ? -1 : 1,
            reacao:{x:0, vx:0, y:0, vy:0}, pisca:0, tombo:0, paraFrente:false, ronco:1 + semente * 4, rot:null};
  }
  function criar(){
    return {jog:{vida:J.vida, folego:J.folego, folegoMax:J.folego, doenca:0, infectado:false, agarroes:0, levantando:0, semGasto:9, defendendo:false, tDefesa:9, esquiva:0, esquivaPausa:0, esqDir:[0, 0], empurrao:0, atordoado:0, agarrado:null, morto:false, mordidas:0, ferimentos:[]},
            zumbis:[], eventos:[], desgaste:{}, tempo:0, abatidos:0};
  }
  const muda = (z, estado, dura = 0) => { z.estado = estado; z.tempo = 0; z.dura = dura; z.acertou = false; };
  const vivo = z => z.estado !== 'morrendo' && z.estado !== 'morto';
  const noChao = z => z.estado === 'caido' || z.rastejando;
  const evento = (m, tipo, mais = {}) => m.eventos.push({tipo, ...mais});

  /* ---------------------------------------------------------------- barulho e percepção */
  function barulho(m, onde, raio){
    for (const z of m.zumbis) if (vivo(z) && z.estado === 'vagando' && dist(z, onde) < raio){ z.alvoRumo = rumoAte(z, onde); muda(z, 'alerta', .5 + z.semente * .6); evento(m, 'ronco', {z, tipo2:'ronco'}); }
  }

  /* segue o caminho do abrigo até um alvo. true = há parede no meio e ele já decidiu o que fazer */
  function peloCaminho(m, z, alvo, agora, qual){
    const guia = m.abrigo ? m.abrigo.guiar(z, alvo, agora, qual) : null; if (!guia) return null;
    if (guia.pular){ z.salto = {de:{x:z.x, z:z.z}, ate:guia.pular.ate, sill:guia.pular.sill}; muda(z, 'pulando', 1.5); return {rumo:null, quer:0}; }
    const rumo = rumoAte(z, guia.alvo), torto = Math.abs(angulo(rumo - z.rumo));
    if (guia.bater){ if (torto < .7){ z.barreira = guia.bater; muda(z, 'batendo', z.t.bruto ? 1.7 : 1.2 + z.semente * .3); } return {rumo, quer:0}; }
    return {rumo, quer:torto < .8 ? 1 : torto < 1.6 ? .45 : .1};
  }
  /* a isca tocando mais perto, se houver alguma ao alcance do ouvido */
  const iscaDe = (m, z) => (m.iscas || []).filter(i => dist(z, i) < i.raio).sort((a, b) => dist(z, a) - dist(z, b))[0] || null;

  /* ---------------------------------------------------------------- fôlego */
  const gastar = (m, n) => { m.jog.folego = Math.max(0, m.jog.folego - n); m.jog.semGasto = 0; };
  const cansado = m => m.jog.folego < J.cansado;
  /* como está o sobrevivente agora: soma o que pesa. doença: 0 nada, 1 leve, 2 forte */
  function condicao(m){
    const j = m.jog, motivos = []; let pontos = 0;
    const soma = (n, texto) => { pontos += n; motivos.push(texto); };
    if (j.vida < 35) soma(3, 'muito ferido'); else if (j.vida < 72) soma(1, 'ferido');
    if (j.folego < j.folegoMax * .35) soma(1, 'cansado');
    if (j.folegoMax < 82) soma(1, 'exausto');
    if (j.doenca >= 2) soma(3, 'doença forte'); else if (j.doenca === 1) soma(1, 'doente');
    if (j.infectado) soma(1, 'infecção');
    if (j.mordidas >= 2) soma(1, 'mordido');
    return {id:pontos >= 3 ? 'grave' : pontos >= 1 ? 'debilitado' : 'saudavel', pontos, motivos};
  }
  /* dormir devolve o fôlego máximo gasto nos agarrões (não cura ferimento nem doença) */
  function dormir(m){ const j = m.jog; if (j.agarrado || j.morto) return false; j.folegoMax = J.folego; j.folego = J.folego; evento(m, 'dormiu'); return true; }

  /* um golpe começou: cobra o fôlego e diz se ele sai fraco */
  function comecouGolpe(m, arma, forte){
    const a = armaDePerto(arma), fraco = cansado(m);
    gastar(m, forte ? J.golpeForte * (a.pesada ? 1.25 : 1) : a.tipo === 'mao' ? J.mao : a.pesada ? J.golpePesado : J.golpe);
    return {fraco, ritmo:fraco ? .68 : 1, forca:fraco ? .55 : 1};
  }
  /* a arma gasta; quando acaba, quebra */
  function desgastar(m, arma, n = 1){
    const a = armaDePerto(arma); if (a.golpes === Infinity) return false;
    m.desgaste[arma] = (m.desgaste[arma] || 0) + n;
    if (m.desgaste[arma] >= a.golpes){ evento(m, 'quebrou', {arma}); return true; }
    return false;
  }
  const resistencia = (m, arma) => { const a = armaDePerto(arma); return a.golpes === Infinity ? 1 : preso(1 - (m.desgaste[arma] || 0) / a.golpes, 0, 1); };

  /* ---------------------------------------------------------------- acertar um zumbi */
  const ZONA = parte => parte === 'cabeca' ? 'cabeca' : /^(coxa|canela|pe)/.test(parte) ? 'perna' : /^(braco|antebraco|mao)/.test(parte) ? 'braco' : 'tronco';
  function derrubar(m, z, tempo = 2.6){ if (z.rastejando) return; muda(z, 'caido', tempo * (z.t.bruto ? .7 : 1)); z.paraFrente = false; evento(m, 'derrubado', {z}); }
  function matar(m, z, naCabeca){
    z.vida = 0; muda(z, 'morrendo', .7); m.abatidos++; evento(m, 'morreu', {z, cabeca:naCabeca});
    if (m.jog.agarrado?.z === z) m.jog.agarrado = null;
  }
  /* golpe = {arma, dano, forte, forca, deFrente (de onde veio, para o corpo reagir), pisao, tiro} */
  function acertar(m, z, parte, golpe){
    if (!vivo(z)) return null;
    const a = armaDePerto(golpe.arma), zona = ZONA(parte), forca = golpe.forca ?? 1, chao = noChao(z);
    let dano = golpe.dano * forca * (zona === 'cabeca' ? (a.tipo === 'ponta' ? 2.6 : 2.1) : zona === 'tronco' ? 1 : .55);
    if (chao && zona === 'cabeca') dano *= 1.8;                                /* acabar com quem está no chão */
    if (golpe.tiro) dano = zona === 'cabeca' ? 999 : golpe.dano;
    z.vida -= dano; z.pisca = .12;
    /* o corpo reage para o lado de onde veio a pancada */
    const puxao = (a.tipo === 'contundente' ? 1 : .6) * (golpe.forte ? 1.7 : 1) * (z.t.bruto ? .45 : 1);
    z.reacao.vx -= puxao * (zona === 'perna' ? -2.5 : 5.5); z.reacao.vy += puxao * (golpe.deFrente ?? (z.lado * 3.5));
    if (z.estado === 'vagando') muda(z, 'alerta', .25);
    const r = {zona, dano:Math.round(dano), matou:false, derrubou:false, cambaleou:false, membro:null};
    if (z.vida <= 0){ matar(m, z, zona === 'cabeca'); r.matou = true; return r; }
    if (zona === 'perna' && !z.rastejando){
      z.pernas -= dano * (a.tipo === 'corte' ? 1.35 : 1);
      if (z.pernas <= 0){ z.rastejando = true; z.agarrao = false; muda(z, 'caido', 1.1); z.paraFrente = true; r.membro = 'perna'; evento(m, 'membro', {z, qual:'perna'}); return r; }
    }
    if (zona === 'braco' && !z.semBraco){
      z.bracos -= dano * (a.tipo === 'corte' ? 1.6 : 1);
      if (z.bracos <= 0){ z.semBraco = true; r.membro = 'braco'; evento(m, 'membro', {z, qual:'braco'}); }
    }
    if (chao) return r;
    const impacto = a.impacto * forca * (golpe.forte ? 1.85 : 1) * (zona === 'cabeca' ? 1.3 : zona === 'perna' ? 1.15 : 1);
    z.equilibrio -= impacto;
    if (z.equilibrio <= 0){
      z.equilibrio = z.t.equilibrio;
      if (golpe.forte && a.tipo === 'contundente' || golpe.derruba){ derrubar(m, z); r.derrubou = true; }
      else { muda(z, 'cambaleando', 1.15); r.cambaleou = true; }
    } else if (z.estado === 'preparando' && !z.t.bruto && (golpe.forte || a.tipo === 'contundente' && zona === 'cabeca' || a.tipo === 'ponta' && golpe.arma !== 'faca_combate')){
      muda(z, 'cambaleando', .55); r.cambaleou = true;                       /* interrompe o ataque */
    }
    return r;
  }

  /* ---------------------------------------------------------------- o que o sobrevivente faz */
  const frenteDe = (de, z, abre) => Math.abs(angulo(rumoAte(de, z) - de.rumo)) < abre;
  function empurrar(m, p){
    const j = m.jog; if (j.empurrao > 0 || j.agarrado || j.levantando > 0 || j.morto || j.folego < J.empurrar * .4) return false;
    gastar(m, J.empurrar); j.empurrao = J.empurrarEspera; let pegou = 0;
    for (const z of m.zumbis){
      if (!vivo(z) || noChao(z) || dist(p, z) > J.empurrarAlcance || !frenteDe(p, z, .95)) continue;
      pegou++;
      if (!z.t.empurravel){ z.equilibrio -= 30; z.reacao.vx -= 2; continue; }
      const r = rumoAte(p, z); z.empurrado = {vx:Math.sin(r) * 3.4, vz:Math.cos(r) * 3.4, t:.28};
      z.equilibrio -= 45;
      if (z.equilibrio <= -20){ z.equilibrio = z.t.equilibrio; derrubar(m, z, 2.0); } else muda(z, 'cambaleando', .85);
    }
    evento(m, 'empurrao', {pegou}); return true;
  }
  /* lado = [frente, direita] pedidos; sem nada, pula para trás */
  function esquivar(m, p, frente, direita){
    const j = m.jog; if (j.esquiva > 0 || j.agarrado || j.levantando > 0 || j.morto || j.folego < J.esquiva * .5) return false;
    /* um tempo para firmar os pés antes da próxima */
    if (j.esquivaPausa > 0){ evento(m, 'esquivaCedo'); return false; }
    gastar(m, J.esquiva); j.esquiva = J.esquivaDura; j.esquivaPausa = J.esquivaDura + J.esquivaEspera;
    let f = frente, d = direita; if (!f && !d) f = -1;
    const n = Math.hypot(f, d); f /= n; d /= n;
    const s = Math.sin(p.rumo), c = Math.cos(p.rumo);
    j.esqDir = [s * f - c * d, c * f + s * d]; evento(m, 'esquiva'); return true;
  }
  function pisar(m, p){
    const j = m.jog; if (j.agarrado || j.levantando > 0 || j.morto || j.folego < J.pisar * .5) return false;
    const z = m.zumbis.filter(z => vivo(z) && noChao(z) && dist(p, z) < J.pisarAlcance + .35 && frenteDe(p, z, 1.2)).sort((a, b) => dist(p, a) - dist(p, b))[0];
    if (!z) return false;
    gastar(m, J.pisar); const r = acertar(m, z, 'cabeca', {arma:'nenhum', dano:24, forte:true});
    evento(m, 'pisao', {z, r}); return true;
  }
  /* o comando de atacar, repetido, é o que solta */
  function lutar(m){
    const g = m.jog.agarrado; if (!g || g.mordendo > 0) return false;
    const c = CONDICOES[g.condicao], semAr = m.jog.folego < 8;
    g.forca = Math.min(1, g.forca + c.aperto * (g.etapa === 4 ? .86 : g.etapa === 3 ? .9 : 1) * (semAr ? .65 : 1));
    gastar(m, c.custo); g.cliques++; g.puxao = 1; evento(m, 'forcando', {etapa:g.etapa});
    return true;
  }

  /* começa o agarrão, já na etapa que o estado permite */
  function agarrar(m, z, defende){
    const j = m.jog, cond = condicao(m).id, c = CONDICOES[cond];
    j.agarroes++;
    j.agarrado = {z, condicao:cond, etapa:c.inicio, t:0, total:0, forca:c.comeca + (defende ? .18 : 0), cliques:0, puxao:0, mordendo:0, noChao:false, mordidas:0};
    muda(z, 'agarrando'); z.preso = j.agarrado; evento(m, 'agarrou', {z, etapa:c.inicio, condicao:cond});
    if (cond === 'grave') j.agarrado.etapa = 2;
  }
  function irPara(m, g, etapa){ g.etapa = etapa; g.t = 0; g.forca = Math.min(g.forca, .78); if (etapa === 4){ g.noChao = true; g.forca = Math.max(.2, g.forca * .82); evento(m, 'derrubou', {z:g.z}); } else evento(m, 'etapa', {z:g.z, etapa}); }
  function morder(m, p, g, dados, acaso){
    const j = m.jog; j.mordidas++; g.mordidas++; j.ferimentos.push('mordida'); g.mordendo = .55;
    evento(m, 'mordida', {z:g.z, noChao:g.noChao});
    if (!j.infectado && acaso() < dados.infeccao){ j.infectado = true; evento(m, 'infeccao', {z:g.z}); }
    ferir(m, dados.dano, g.z, p, 'mordida');
  }
  /* conseguiu se soltar: empurra o zumbi, perde um pouco de fôlego máximo e, se estava no chão, levanta */
  function soltar(m, p){
    const j = m.jog, g = j.agarrado, z = g.z, c = CONDICOES[g.condicao], antes = j.folegoMax;
    j.agarrado = null;
    j.folegoMax = Math.max(G.fadigaMinima, j.folegoMax - c.fadiga * (g.noChao ? 1.3 : 1));
    const r = rumoAte(p, z); z.empurrado = {vx:Math.sin(r) * 3.4, vz:Math.cos(r) * 3.4, t:.3};
    if (g.noChao){ derrubar(m, z, 2.2); j.levantando = G.levantar; } else muda(z, 'cambaleando', g.etapa === 1 ? 1.6 : 1.25);
    z.espera = 1.2;
    evento(m, 'soltou', {z, etapa:g.etapa, perdeu:antes - j.folegoMax, noChao:g.noChao});
  }
  /* quantos outros zumbis estão em cima, puxando */
  const emVolta = (m, p, g) => m.zumbis.filter(o => o !== g.z && vivo(o) && !noChao(o) && dist(o, p) < 1.55).length;
  function disputar(m, p, dt, acaso){
    const j = m.jog, g = j.agarrado, c = CONDICOES[g.condicao];
    if (!vivo(g.z)){ j.agarrado = null; if (g.noChao) j.levantando = G.levantar; return; }
    g.total += dt; g.puxao = Math.max(0, g.puxao - dt * 6);
    if (g.forca >= 1){ soltar(m, p); return; }
    if (g.mordendo > 0){
      g.mordendo -= dt;
      if (g.mordendo <= 0 && !j.morto){
        if (g.noChao){ g.t = 0; g.forca = Math.max(g.forca, .22); }                        /* continua em cima: dá para tentar de novo */
        else if (acaso() < c.derruba) irPara(m, g, 4);
        else {                                                                           /* a mordida afasta os dois */
          j.agarrado = null; const z = g.z; muda(z, 'recuperando', 1.25); z.espera = 1.1;
          const r = rumoAte(p, z); z.empurrado = {vx:Math.sin(r) * 2.2, vz:Math.cos(r) * 2.2, t:.25};
          j.folegoMax = Math.max(G.fadigaMinima, j.folegoMax - c.fadiga); evento(m, 'afastou', {z});
        }
      }
      return;
    }
    g.t += dt;
    g.cercado = emVolta(m, p, g);
    g.forca = Math.max(0, g.forca - (c.cai + g.cercado * (g.noChao ? G.noChaoPorPerto : G.porPerto) + (g.etapa === 4 ? .03 : 0)) * dt);
    if (g.t < G.tempo[g.etapa] && !(g.forca <= 0 && g.t > .7)) return;
    if (g.etapa === 1) irPara(m, g, 2);
    else if (g.etapa === 2){ if (acaso() < c.derruba) irPara(m, g, 4); else irPara(m, g, 3); }
    else if (g.etapa === 3) morder(m, p, g, G.mordida, acaso);
    else morder(m, p, g, G.mordidaNoChao, acaso);
  }

  /* ---------------------------------------------------------------- o zumbi ataca */
  function ferir(m, dano, z, p, motivo){
    const j = m.jog; if (j.morto) return;
    j.vida = Math.max(0, j.vida - dano);
    const lado = angulo(rumoAte(p, z) - p.rumo);
    evento(m, 'ferido', {dano, lado, motivo, z});
    if (j.vida <= 0){ j.morto = true; j.agarrado = null; evento(m, 'morto'); }
  }
  function golpearJogador(m, z, p){
    const j = m.jog;
    if (j.morto || p.alto || m.abrigo && !m.abrigo.visao(z, p) || dist(z, p) > z.t.alcance + .34 || Math.abs(angulo(rumoAte(z, p) - z.rumo)) > .85){ evento(m, 'errou', {z}); return; }
    if (j.esquiva > 0){ evento(m, 'esquivou', {z}); return; }
    if (j.agarrado){ const g = j.agarrado; g.forca = Math.max(0, g.forca - .14); ferir(m, z.t.dano * (g.noChao ? .85 : .6), z, p, 'cercado'); return; }
    const defende = j.defendendo && j.levantando <= 0 && frenteDe(p, z, 1.25), naHora = defende && j.tDefesa < J.defesaNaHora;
    if (z.agarrao && !z.semBraco && !z.rastejando){
      if (naHora){ muda(z, 'cambaleando', 1.5); gastar(m, J.custoNaHora); evento(m, 'defesaNaHora', {z}); return; }
      agarrar(m, z, defende); return;
    }
    const dano = z.t.dano * (z.rastejando ? .6 : z.semBraco ? .65 : 1);
    if (naHora && !z.t.bruto){ muda(z, 'cambaleando', 1.5); gastar(m, J.custoNaHora); evento(m, 'defesaNaHora', {z}); return; }
    if (defende){
      const custo = z.t.bruto ? J.defesaBruta : J.defesa, tinha = j.folego; gastar(m, custo);
      evento(m, 'defendeu', {z});
      if (tinha < custo){ j.atordoado = .85; evento(m, 'guardaQuebrada', {z}); ferir(m, dano * .55, z, p, 'guarda'); }
      else if (z.t.bruto) ferir(m, dano * .3, z, p, 'bruto');
      return;
    }
    ferir(m, dano, z, p, 'golpe');
  }

  /* ---------------------------------------------------------------- a cabeça do zumbi */
  /* quantos podem atacar ao mesmo tempo, conforme o tamanho do grupo que está em cima */
  function vagas(m, p){ const n = m.zumbis.filter(z => vivo(z) && dist(z, p) < 3.6).length; return n <= 1 ? 1 : n <= 3 ? 2 : 3; }
  function pensar(m, z, p, dt, acaso){
    const t = z.t, d = dist(z, p), para = rumoAte(z, p);
    z.tempo += dt; z.pisca = Math.max(0, z.pisca - dt);
    const n = Math.max(1, Math.ceil(dt / .01)), h = dt / n, r = z.reacao;
    for (let i = 0; i < n; i++){ r.vx += (-90 * r.x - 11 * r.vx) * h; r.x += r.vx * h; r.vy += (-90 * r.y - 11 * r.vy) * h; r.y += r.vy * h; }
    r.x = preso(r.x, -.8, .8); r.y = preso(r.y, -.8, .8);
    z.equilibrio = Math.min(t.equilibrio, z.equilibrio + t.equilibrio * .2 * dt);
    let quer = 0, rumo = null, giro = z.rastejando ? 1.6 : t.bruto ? 2.2 : 3.4;
    z.travado = Math.max(0, (z.travado || 0) - dt); z.lento = Math.max(0, (z.lento || 0) - dt);
    /* o barulho da isca puxa quem não está em cima do sobrevivente */
    if (z.estado === 'vagando' || z.estado === 'alerta' || z.estado === 'perseguindo'){
      const isca = iscaDe(m, z);
      if (isca && !(d < 2.4 && (!m.abrigo || m.abrigo.visao(z, p)))){ z.isca = isca; muda(z, 'atraido'); evento(m, 'ronco', {z, tipo2:'ronco'}); }
    }
    const livre = () => m.zumbis.filter(o => o !== z && (o.estado === 'preparando' || o.estado === 'atacando' || o.estado === 'agarrando')).length < vagas(m, p);
    switch (z.estado){
      case 'vagando':
        z.ronco -= dt;
        if (z.tempo > 2 + z.semente * 3){ z.tempo = 0; z.alvoRumo = angulo(z.rumo + (acaso() - .5) * 2.4); }
        rumo = z.alvoRumo; quer = z.tempo < 1.4 ? .28 : 0; giro = 1;
        if (!m.jog.morto && (d < 3.2 || d < 13 && Math.abs(angulo(para - z.rumo)) < 1.2)){ muda(z, 'alerta', .4 + z.semente * .5); evento(m, 'ronco', {z, tipo2:'ronco'}); }
        break;
      case 'alerta':
        rumo = para; giro = 2.6; if (z.tempo >= z.dura) muda(z, 'perseguindo'); break;
      case 'perseguindo': {
        rumo = para;
        if (m.jog.morto){ muda(z, 'vagando'); break; }
        /* com parede no meio, vai pela entrada mais fácil: porta aberta, janela quebrada ou a barreira mais fraca */
        const volta = m.jog.agarrado ? null : peloCaminho(m, z, p, m.tempo);
        if (volta){ rumo = volta.rumo; quer = volta.quer; break; }
        const meuAlcance = z.rastejando ? .95 : t.alcance;
        const preso_ = m.jog.agarrado, alcanca = d <= meuAlcance + (preso_?.noChao ? .25 : 0);
        if (alcanca && Math.abs(angulo(para - z.rumo)) < .6 && z.espera <= 0){
          /* com o sobrevivente agarrado de pé, os outros chegam e esperam; com ele no chão, um deles vem bater */
          if (!p.alto && (!m.abrigo || m.abrigo.visao(z, p)) && (!preso_ || preso_.noChao) && livre()){ z.agarrao = !z.rastejando && !z.semBraco && acaso() < t.agarra; muda(z, 'preparando', t.preparo * (z.rastejando ? 1.2 : .9 + acaso() * .25)); evento(m, 'vaiAtacar', {z}); }
          else quer = 0;
        } else if (!livre() && d < 2.3){
          /* esperando a vez: rodeia para o lado e para as costas, onde não dá para defender */
          const atras = angulo(p.rumo + Math.PI + z.lado * .8), meta = {x:p.x + Math.sin(atras) * 1.35, z:p.z + Math.cos(atras) * 1.35};
          rumo = rumoAte(z, meta); quer = dist(z, meta) > .25 ? .75 : 0; if (!quer) rumo = para;
        }
        else quer = 1;
        break;
      }
      case 'atraido': {
        const isca = z.isca;
        if (!isca || !(m.iscas || []).includes(isca)){ z.isca = null; muda(z, 'vagando'); z.alvoRumo = z.rumo; break; }
        /* se der de cara com o sobrevivente, esquece o barulho */
        if (!m.jog.morto && d < 2.2 && (!m.abrigo || m.abrigo.visao(z, p))){ z.isca = null; muda(z, 'alerta', .3); break; }
        if (dist(z, isca) < .75){ rumo = rumoAte(z, isca); quer = 0; break; }
        const volta = peloCaminho(m, z, isca, m.tempo, 'isca');
        if (volta){ rumo = volta.rumo; quer = volta.quer; break; }
        rumo = rumoAte(z, isca); quer = Math.abs(angulo(rumo - z.rumo)) < 1.2 ? .95 : .25;
        break;
      }
      case 'batendo': {
        const o = z.barreira;
        if (!m.abrigo || !o || !m.abrigo.aindaFechada(z, o)){ muda(z, 'perseguindo'); break; }
        rumo = rumoAte(z, o); giro = 3;
        if (!z.acertou && z.tempo >= z.dura * .62){ z.acertou = true; const res = m.abrigo.bater(z, o); evento(m, 'barreira', {z, o, res}); }
        if (z.tempo >= z.dura) muda(z, 'perseguindo');
        break;
      }
      case 'pulando': {
        const s_ = z.salto, u = preso(z.tempo / z.dura, 0, 1), k = suave(u);
        z.x = s_.de.x + (s_.ate.x - s_.de.x) * k; z.z = s_.de.z + (s_.ate.z - s_.de.z) * k; z.alto = Math.sin(Math.PI * u) * s_.sill * .82;
        rumo = rumoAte(s_.de, s_.ate); giro = 9; z.vel = 0;
        if (u >= 1){ z.alto = 0; z.salto = null; muda(z, 'perseguindo'); z.espera = .5; }
        break;
      }
      case 'preparando':
        rumo = para; giro = t.bruto ? 1.2 : 1.9;                             /* dá para sair do lado */
        quer = d > t.alcance * .85 ? .22 : 0;
        if (z.tempo >= z.dura) muda(z, 'atacando', .26);
        break;
      case 'atacando':
        quer = d > .8 ? 1.5 : 0;                                            /* o bote */
        if (!z.acertou && z.tempo >= .1){ z.acertou = true; golpearJogador(m, z, p); }
        if (z.estado === 'atacando' && z.tempo >= z.dura){ muda(z, 'recuperando', t.depois); }
        break;
      case 'recuperando':
        rumo = para; giro = 1.2; if (z.tempo >= z.dura){ muda(z, 'perseguindo'); z.espera = .25 + acaso() * .5; } break;
      case 'agarrando': {
        rumo = para; giro = 14;
        const g = m.jog.agarrado;
        if (!g || g.z !== z) muda(z, 'cambaleando', .9);
        break;
      }
      case 'cambaleando': if (z.tempo >= z.dura) muda(z, 'perseguindo'); break;
      case 'caido': if (z.tempo >= z.dura) muda(z, z.rastejando ? 'perseguindo' : 'levantando', z.rastejando ? 0 : 1.0); break;
      case 'levantando': rumo = para; giro = 1; if (z.tempo >= z.dura){ muda(z, 'perseguindo'); z.espera = .3; } break;
      case 'morrendo': if (z.tempo >= z.dura) muda(z, 'morto'); break;
    }
    z.espera = Math.max(0, z.espera - dt);
    if (z.estado !== 'pulando' && z.alto){ z.alto = 0; z.salto = null; }            /* derrubado no meio do salto */
    if (rumo !== null) z.rumo = angulo(z.rumo + preso(angulo(rumo - z.rumo), -giro * dt, giro * dt));
    const maxima = (z.rastejando ? .34 : t.vel * (z.estado === 'perseguindo' && d > 2.4 ? 1.22 : 1)) * (z.lento > 0 ? .45 : 1);
    z.vel = puxa(z.vel, quer * maxima, 6, dt);
    let vx = Math.sin(z.rumo) * z.vel, vz = Math.cos(z.rumo) * z.vel;
    if (z.travado > 0){ vx = vz = 0; z.vel = 0; z.empurrado = null; }                    /* o pé está preso */
    if (z.empurrado){ z.empurrado.t -= dt; const k = Math.max(0, z.empurrado.t / .3); vx += z.empurrado.vx * k; vz += z.empurrado.vz * k; if (z.empurrado.t <= 0) z.empurrado = null; }
    if (vivo(z)){ z.x += vx * dt; z.z += vz * dt; }
    z.passo += dt * (z.rastejando ? 3.2 : 2 + z.vel * 3.2) * (z.vel > .05 ? 1 : .15);
  }

  /* adianta o tempo. p = {x, z, rumo, defendendo, correndo, andando} do sobrevivente.
     empurra(corpo, raio) tira um corpo de dentro das paredes */
  function passo(m, p, dt, empurra, acaso = Math.random){
    const j = m.jog; m.tempo += dt;
    j.tDefesa = p.defendendo ? (j.defendendo ? j.tDefesa + dt : 0) : 9; j.defendendo = !!p.defendendo && !j.agarrado && j.atordoado <= 0;
    j.semGasto += dt; j.empurrao = Math.max(0, j.empurrao - dt); j.esquiva = Math.max(0, j.esquiva - dt); j.esquivaPausa = Math.max(0, j.esquivaPausa - dt); j.atordoado = Math.max(0, j.atordoado - dt);
    if (p.correndo && p.andando) gastar(m, J.correr * dt);
    else if (j.semGasto > J.espera && !j.agarrado) j.folego = j.folego + (j.defendendo ? J.voltaDefendendo : p.andando ? J.volta * .6 : J.volta) * (j.doenca >= 2 ? .5 : j.doenca === 1 ? .72 : 1) * dt;
    j.folego = Math.min(j.folego, j.folegoMax * (j.doenca >= 2 ? .72 : j.doenca === 1 ? .88 : 1));
    j.levantando = Math.max(0, j.levantando - dt);
    if (j.agarrado) disputar(m, p, dt, acaso);
    for (const z of m.zumbis) if (z.estado !== 'morto') pensar(m, z, p, dt, acaso); else z.tempo += dt;
    /* ninguém ocupa o mesmo lugar */
    const vivos = m.zumbis.filter(z => vivo(z) && !z.rastejando && z.estado !== 'caido' && z.estado !== 'pulando');
    for (let i = 0; i < vivos.length; i++){
      const a = vivos[i];
      for (let k = i + 1; k < vivos.length; k++){
        const b = vivos[k]; if (a.estado === 'agarrando' || b.estado === 'agarrando') continue;
        const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz) || .001, falta = .66 - d;
        if (falta > 0){ const ux = dx / d * falta / 2, uz = dz / d * falta / 2; a.x -= ux; a.z -= uz; b.x += ux; b.z += uz; }
      }
      const dx = a.x - p.x, dz = a.z - p.z, d = Math.hypot(dx, dz) || .001, min = a.estado === 'agarrando' ? .6 : .72 * a.t.escala;
      if (a.estado === 'agarrando'){
        /* preso ao sobrevivente: vai junto, sempre à frente dele */
        const longe = j.agarrado?.noChao ? .5 : j.agarrado?.etapa >= 3 ? .5 : j.agarrado?.etapa === 2 ? .57 : .66;
        a.x = puxa(a.x, p.x + Math.sin(p.rumo) * longe, 20, dt); a.z = puxa(a.z, p.z + Math.cos(p.rumo) * longe, 20, dt);
        /* arrastado contra outro, derruba o equilíbrio dele */
        if (p.andando && j.agarrado && !j.agarrado.noChao) for (const b of vivos) if (b !== a && b.estado !== 'agarrando' && dist(a, b) < .7){ b.equilibrio -= 90 * dt; if (b.equilibrio <= 0){ b.equilibrio = b.t.equilibrio; muda(b, 'cambaleando', 1.0); const r = rumoAte(a, b); b.empurrado = {vx:Math.sin(r) * 2.4, vz:Math.cos(r) * 2.4, t:.25}; evento(m, 'trombou', {z:b}); } }
      } else if (d < min){ a.x = p.x + dx / d * min; a.z = p.z + dz / d * min; }
    }
    if (empurra) for (const z of m.zumbis) if (vivo(z) && z.estado !== 'pulando') empurra(z, .3);
  }

  /* ---------------------------------------------------------------- poses
     devolve {rot (para Animacao.globais), tombo (o corpo todo deitando: + de bruços, - de costas), pressa} */
  const eixo = (n, t) => { const r = [0, 0, 0, Math.cos(t / 2)]; r[n] = Math.sin(t / 2); return r; };
  const mul = (p, o) => [p[3]*o[0] + p[0]*o[3] + p[1]*o[2] - p[2]*o[1], p[3]*o[1] - p[0]*o[2] + p[1]*o[3] + p[2]*o[0],
                         p[3]*o[2] + p[0]*o[1] - p[1]*o[0] + p[2]*o[3], p[3]*o[3] - p[0]*o[0] - p[1]*o[1] - p[2]*o[2]];
  const giro = (x = 0, y = 0, z = 0) => mul(eixo(1, y), mul(eixo(0, x), eixo(2, z)));
  /* membro = [x, y, z]; negativo em x leva para a frente */
  function montarPose(o){
    const rot = {};
    for (const [nome, g] of Object.entries(o)) rot[nome] = giro(...(Array.isArray(g) ? g : [g]));
    return rot;
  }
  function pose(z, agora){
    const s = Math.sin(z.passo), c = Math.cos(z.passo), t = agora + z.semente * 10, manco = z.semente < .5 ? 1 : -1;
    const anda = preso(z.vel / Math.max(.3, z.t.vel), 0, 1.3), corre = z.tipo === 'corredor' ? preso(z.vel / 2.2, 0, 1) : 0;
    const balanca = Math.sin(t * 1.7) * .05;
    let o = {torax:[.16 + corre * .3 + balanca, balanca, manco * .06 + s * .05 * anda], cabeca:[-.12 - corre * .2, Math.sin(t * .9) * .18, manco * .2 + balanca],
             coxa_d:[-.42 * s * anda * (1 + corre * .8), 0, -.04], canela_d:[(.12 + Math.max(0, c) * .75 * (1 + corre)) * anda + .06],
             coxa_e:[.42 * s * anda * (1 + corre * .8) * (manco > 0 ? .65 : 1), 0, .04], canela_e:[(.12 + Math.max(0, -c) * .75 * (1 + corre)) * anda * (manco > 0 ? .4 : 1) + .06]};
    let tombo = 0, pressa = 12;
    const bracos = (xd, xe, cd = -.25, ce = -.35, abre = .05) => Object.assign(o, {braco_d:[xd, 0, -abre], antebraco_d:[cd], mao_d:[.3], braco_e:[xe, 0, abre], antebraco_e:[ce], mao_e:[.35]});
    if (z.estado === 'vagando') bracos(-.12 + s * .1, -.2 - s * .1, -.2, -.3, .1);
    else if (corre > .4) bracos(-.9 - s * .8, -.9 + s * .8, -1.1, -1.1, .15);
    else bracos(-1.18 + Math.sin(t * 2.6) * .13, -1.32 + Math.cos(t * 2.1) * .13);
    if (z.estado === 'alerta'){ o.cabeca = [-.3, Math.sin(z.tempo * 14) * .1, manco * .1]; bracos(-.5 - suave(z.tempo / .5) * .6, -.6 - suave(z.tempo / .5) * .6); }
    if (z.estado === 'preparando'){
      /* o aviso: os braços sobem e o corpo vai para trás, tremendo */
      const k = suave(z.tempo / (z.dura * .8)), treme = Math.sin(t * 34) * .045 * k;
      pressa = 11;
      if (z.agarrao){ o.torax = [.16 - k * .3 + treme, 0, 0]; o.cabeca = [-.1 - k * .3, 0, manco * .3 * k]; Object.assign(o, {braco_d:[-1.25 - k * .35, 0, -.75 * k], antebraco_d:[-.25 - k * .4], mao_d:[-.2], braco_e:[-1.25 - k * .35, 0, .75 * k], antebraco_e:[-.25 - k * .4], mao_e:[-.2]}); }
      else if (z.t.bruto){ o.torax = [.16 - k * .55 + treme, 0, 0]; o.cabeca = [-.35 * k]; bracos(-1.2 - k * 1.65, -1.2 - k * 1.65, -.5, -.5, .2 + k * .2); }
      else { o.torax = [.16 - k * .28, .45 * k * manco, 0]; o.cabeca = [-.2 * k, -.25 * k * manco, .2]; const alto = -1.2 - k * 1.55 + treme; bracos(manco > 0 ? alto : -1.0, manco > 0 ? -1.0 : alto, -.9 * k - .25, -.9 * k - .25, .15 + .3 * k); }
    }
    if (z.estado === 'atacando'){
      const k = suave(z.tempo / .14); pressa = 30;
      o.coxa_d = [-.65]; o.canela_d = [.5]; o.coxa_e = [.4]; o.canela_e = [.25];
      if (z.agarrao){ o.torax = [.5 * k, 0, 0]; o.cabeca = [-.35, 0, 0]; Object.assign(o, {braco_d:[-1.55, 0, lerp(-.75, .2, k)], antebraco_d:[-.55 * k], braco_e:[-1.55, 0, lerp(.75, -.2, k)], antebraco_e:[-.55 * k]}); }
      else if (z.t.bruto){ o.torax = [lerp(-.38, .78, k), 0, 0]; bracos(lerp(-2.85, -.55, k), lerp(-2.85, -.55, k), -.3, -.3, .15); }
      else { o.torax = [.5 * k, lerp(.45, -.5, k) * manco, 0]; const a = lerp(-2.75, -.55, k); bracos(manco > 0 ? a : -.8, manco > 0 ? -.8 : a, -.25, -.25, .1); }
    }
    if (z.estado === 'atraido' && z.vel < .2){
      /* parado em cima do barulho: curvado, tateando o chão */
      const vai = Math.sin(t * 3.2);
      o.torax = [.55 + vai * .08, vai * .25, 0]; o.cabeca = [.25, -vai * .3, manco * .2]; bracos(-1.0 - vai * .35, -1.0 + vai * .35, -.5, -.5, .12);
    }
    if (z.travado > 0 && z.estado !== 'caido'){ const puxao = Math.sin(t * 11) * .12; o.coxa_d = [-.5 + puxao]; o.canela_d = [.7]; o.coxa_e = [.3]; o.canela_e = [.2]; }
    if (z.estado === 'batendo'){
      /* o grandalhão ergue os dois braços; os outros socam um de cada vez */
      const u = z.tempo / z.dura, arma_ = u < .5 ? suave(u / .5) : u < .62 ? 1 - suave((u - .5) / .12) : 0, vai = u >= .5 && u < .85 ? suave((u - .5) / .12) * (1 - suave((u - .72) / .13)) : 0;
      pressa = 26;
      if (z.t.bruto){ o.torax = [.16 - arma_ * .5 + vai * .55, 0, 0]; o.cabeca = [-.25, 0, 0]; const a = -1.3 - arma_ * 1.5 + vai * .55; bracos(a, a, -.45 + vai * .3, -.45 + vai * .3, .18); }
      else { o.torax = [.18 + vai * .28, (arma_ * .3 - vai * .35) * manco, 0]; o.cabeca = [-.2, 0, manco * .2]; const a = -1.35 - arma_ * 1.1 - vai * .1; bracos(manco > 0 ? a : -1.2, manco > 0 ? -1.2 : a, -.4 - arma_ * .7, -.4 - arma_ * .7, .08); }
      o.coxa_d = [-.35]; o.canela_d = [.35]; o.coxa_e = [.25]; o.canela_e = [.2];
    }
    if (z.estado === 'pulando'){
      const k = Math.sin(Math.PI * preso(z.tempo / z.dura, 0, 1));
      pressa = 18;
      o.torax = [.2 + k * .75, 0, manco * .12 * k]; o.cabeca = [-.2 - k * .5, 0, 0]; o.coxa_d = [-1.35 * k]; o.canela_d = [.15 + 1.6 * k]; o.coxa_e = [-.7 * k]; o.canela_e = [.1 + 1.8 * k];
      bracos(-1.4 - k * .5, -1.4 - k * .5, -.35, -.35, .2);
    }
    if (z.estado === 'recuperando'){ const k = 1 - suave(z.tempo / Math.max(.2, z.dura)); o.torax = [.16 + .4 * k, 0, 0]; bracos(-.55 - (1 - k) * .6, -.65 - (1 - k) * .6); }
    if (z.estado === 'agarrando'){
      const g = z.preso || {etapa:1, puxao:0, mordendo:0}, etapa = g.etapa, bote = g.mordendo > 0 ? Math.sin(preso(1 - g.mordendo / .55, 0, 1) * Math.PI) : 0;
      const morde = etapa >= 2 ? Math.max(0, Math.sin(t * (etapa >= 3 ? 15 : 9))) : 0, empurra = g.puxao || 0;           /* cada aperto do jogador empurra a cabeça para trás */
      const chega = etapa === 1 ? 0 : etapa === 2 ? .45 : .8;
      o.torax = [.2 + chega * .3 + morde * .1 + bote * .3 - empurra * .22, Math.sin(t * 7) * .09 + empurra * .12, Math.sin(t * 5.3) * .05];
      o.cabeca = [-.25 - chega * .15 + morde * .38 + bote * .5 - empurra * .5, Math.sin(t * 6.1) * .12, Math.sin(t * 5) * .16];
      pressa = 22;
      Object.assign(o, {braco_d:[-1.46 + Math.sin(t * 9) * .05, 0, .2 + chega * .12], antebraco_d:[-.45 - chega * .5 + empurra * .25], mao_d:[-.35],
                        braco_e:[-1.46 - Math.sin(t * 9) * .05, 0, -.2 - chega * .12], antebraco_e:[-.45 - chega * .5 + empurra * .25], mao_e:[-.35],
                        coxa_d:[-.35 + Math.sin(t * 8) * .08], canela_d:[.4], coxa_e:[.3 - Math.sin(t * 8) * .08], canela_e:[.3]});
      if (g.noChao){ tombo = 1.12 - empurra * .12; o.coxa_d = [.2, 0, -.2]; o.canela_d = [1.2]; o.coxa_e = [.15, 0, .2]; o.canela_e = [1.0]; o.cabeca = [-.95 + morde * .35 + bote * .4 - empurra * .45, o.cabeca[1], o.cabeca[2]]; }
    }
    if (z.estado === 'cambaleando'){
      const k = 1 - suave(z.tempo / Math.max(.3, z.dura)), vai = Math.sin(z.tempo * 11) * k;
      o = {torax:[-.42 * k + .1, vai * .35, vai * .28], cabeca:[-.4 * k, vai * .3, -vai * .3], coxa_d:[.45 * k], canela_d:[.5 * k + .1], coxa_e:[-.35 * k], canela_e:[.7 * k + .1],
           braco_d:[-.3 + vai * .6, 0, -.25 - .75 * k], antebraco_d:[-.4], braco_e:[-.5 - vai * .6, 0, .25 + .75 * k], antebraco_e:[-.5]};
      pressa = 16;
    }
    if (z.rastejando && z.estado !== 'morrendo' && z.estado !== 'morto'){
      const puxa_ = Math.sin(z.passo);
      tombo = 1.4; o = {torax:[-.18, puxa_ * .14, 0], cabeca:[-1.15, -puxa_ * .1, manco * .15], braco_d:[-2.55 + puxa_ * .5, 0, -.3], antebraco_d:[-.35 - Math.max(0, puxa_) * .6],
        braco_e:[-2.55 - puxa_ * .5, 0, .3], antebraco_e:[-.35 - Math.max(0, -puxa_) * .6], coxa_d:[.1, 0, -.14], canela_d:[.3 + puxa_ * .1], coxa_e:[.05, 0, .12], canela_e:[.15]};
      if (z.estado === 'preparando'){ const k = suave(z.tempo / z.dura); o.braco_d = [-2.6 - k * .5, 0, -.55]; o.cabeca = [-1.35]; }
      if (z.estado === 'atacando'){ o.braco_d = [-1.7, 0, .2]; o.antebraco_d = [-.9]; }
    }
    if (z.estado === 'caido' || z.estado === 'levantando'){
      const deita = z.paraFrente ? 1.42 : -1.46, k = z.estado === 'caido' ? suave(z.tempo / .42) : 1 - suave(z.tempo / z.dura);
      const meche = Math.sin(t * 3.1) * .12;
      tombo = deita * k; pressa = 14;
      if (z.estado === 'caido') o = {torax:[.05, meche * .4, 0], cabeca:[z.paraFrente ? -.7 : .25, meche, 0], braco_d:[-.5 + meche, 0, -1.0], antebraco_d:[-.5], braco_e:[-.8 - meche, 0, .85], antebraco_e:[-.8], coxa_d:[-.25 + meche, 0, -.15], canela_d:[.45], coxa_e:[.05, 0, .12], canela_e:[.2]};
      else { const dobra = Math.sin((1 - k) * Math.PI); Object.assign(o, {torax:[.2 + dobra * .55, 0, 0], coxa_d:[-.2 - dobra * 1.2], canela_d:[.1 + dobra * 1.6], coxa_e:[.1 - dobra * .4], canela_e:[.15 + dobra * .9]}); bracos(-.6 - dobra, -.6 - dobra * .4, -.4, -.4, .2); }
    }
    if (z.estado === 'morrendo' || z.estado === 'morto'){
      const k = z.estado === 'morto' ? 1 : Math.pow(preso(z.tempo / z.dura, 0, 1), 1.7), frente = z.rastejando || z.paraFrente;
      tombo = (frente ? 1.46 : -1.52) * k; pressa = 9;
      o = {torax:[.05, 0, manco * .12], cabeca:[frente ? -.2 : -.35, manco * .6 * k, manco * .25], braco_d:[-.3, 0, -.5 - .5 * k], antebraco_d:[-.3], braco_e:[-.7, 0, .35 + .4 * k], antebraco_e:[-.9], coxa_d:[-.1, 0, -.18], canela_d:[.25], coxa_e:[.18, 0, .1], canela_e:[.55]};
    }
    if (z.semBraco){ o.braco_e = [.1, 0, .12]; o.antebraco_e = [-.15]; }
    /* a pancada: tronco e cabeça são jogados e voltam */
    const r = z.reacao, soma = (nome, x, y) => { const v = o[nome] || [0]; o[nome] = [(v[0] || 0) + x, (v[1] || 0) + y, v[2] || 0]; };
    soma('torax', r.x * .55, r.y * .5); soma('cabeca', r.x * .8, r.y * .85);
    return {rot:montarPose(o), tombo, pressa};
  }

  return {J, G, CONDICOES, ETAPAS, condicao, dormir, vagas, ARMAS_PERTO, TIPOS, armaDePerto, criar, novoZumbi, passo, barulho, comecouGolpe, acertar, desgastar, resistencia, cansado, empurrar, esquivar, pisar, lutar, matar, derrubar, ferir, vivo, noChao, ZONA, pose, golpearJogador, muda};
})();
