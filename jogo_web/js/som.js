/* Sons do jogo feitos por cálculo (ruído, filtros e osciladores): nenhum arquivo de áudio, funciona sem internet.
   Som.criar(contexto) aceita um AudioContext ou um OfflineAudioContext (para medir nos testes).
   Cada som pode ter "onde" (posição no mundo): fica mais fraco, abafado, atrasado e para um dos lados.
   Carregado antes de estande.js. */
const Som = (() => {
  const entre = (a, b) => a + Math.random() * (b - a);

  /* ---------------------------------------------------------------- como soa cada arma de fogo
     corpo = brilho do estouro (Hz); dura = quanto o estouro dura (s); grave = pancada (Hz); cauda = eco ao ar livre */
  const T = (corpo, dura, grave, volume, cauda, mais) => ({corpo, dura, grave, volume, cauda, ...mais});
  const TIROS = {
    pistola:T(3600, .12, 170, .72, .45), revolver:T(2900, .18, 125, .86, .62), submetralhadora:T(3900, .085, 190, .56, .32),
    fuzil_assalto:T(3300, .14, 122, .78, .6), fuzil_madeira:T(2800, .16, 104, .82, .66), metralhadora:T(2500, .16, 92, .82, .62),
    escopeta:T(1900, .3, 76, 1, .85), rifle_precisao:T(4200, .26, 88, 1, 1), fuzil_ferrolho:T(3500, .24, 94, .95, .9),
    gamb_pistola:T(2400, .15, 140, .74, .45, {lata:1}), gamb_revolver:T(2100, .19, 112, .84, .55, {lata:1}), gamb_submetralhadora:T(2700, .1, 160, .58, .34, {lata:1}),
    gamb_fuzil:T(2200, .2, 98, .86, .66, {lata:1}), gamb_escopeta:T(1500, .34, 66, 1, .8, {lata:1}), gamb_precisao:T(2500, .23, 90, .92, .8, {lata:1}),
    gamb_guardachuva:T(1700, .22, 100, .82, .55, {lata:1}),
  };
  /* do que é feito o que bate: muda o som do golpe quando acerta parede ou chão */
  const MATERIAL = {taco_pregos:'madeira', taco_arame:'madeira', remo:'madeira', lanca:'madeira', arco:'madeira', violao:'violao', frigideira:'frigideira', nenhum:'mao',
                    marreta:'ferro', maca_engrenagem:'ferro', enxada:'ferro', machado_placa:'ferro', corrente:'corrente'};
  const PESADAS = ['marreta', 'pa', 'machado_placa', 'machado_bombeiro', 'remo', 'enxada', 'maca_engrenagem', 'violao', 'corrente', 'foice'];
  const CORTANTES = ['faca_combate', 'facao', 'machadinha', 'machadinha_tatica', 'machado_placa', 'machado_bombeiro', 'foice', 'enxada', 'serrote', 'lanca', 'forcado'];

  function criar(ctx){
    const taxa = ctx.sampleRate;
    /* saída: volume geral e um limitador, para a rajada não estourar */
    const geral = ctx.createGain(), limita = ctx.createDynamicsCompressor();
    limita.threshold.value = -10; limita.knee.value = 8; limita.ratio.value = 12; limita.attack.value = .002; limita.release.value = .16;
    const teto = ctx.createGain(); teto.gain.value = .82;
    geral.connect(limita); limita.connect(teto); teto.connect(ctx.destination);
    /* ruído guardado (reaproveitado em todos os sons) */
    const ruidoBuf = ctx.createBuffer(1, taxa * 2, taxa);
    { const d = ruidoBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    /* eco de lugar aberto: umas poucas voltas que vão sumindo */
    const eco = ctx.createConvolver(), ecoVol = ctx.createGain();
    { const n = Math.floor(taxa * 1.4), b = ctx.createBuffer(2, n, taxa);
      for (let c = 0; c < 2; c++){ const d = b.getChannelData(c); let ant = 0;
        for (let i = 0; i < n; i++){ const t = i / taxa; ant += ((Math.random() * 2 - 1) - ant) * .22; d[i] = ant * Math.exp(-t * 4.2) * (t < .03 ? t / .03 : 1) * .5; }
        for (const [t, g] of [[.085 + c * .012, .5], [.19 - c * .017, .32], [.34 + c * .02, .18]]){ const k = Math.floor(t * taxa); for (let i = 0; i < taxa * .012 && k + i < n; i++) d[k + i] += (Math.random() * 2 - 1) * g * Math.exp(-i / (taxa * .004)); } }
      eco.buffer = b; }
    ecoVol.gain.value = .55; eco.connect(ecoVol); ecoVol.connect(geral);

    let ouvinte = {p:[0, 1.6, 0], direita:[-1, 0, 0]}, grupoArma = null;
    const contagem = {};
    const agora = () => ctx.currentTime;

    /* o caminho de um som: volume, distância, lado e quanto vai para o eco. Devolve {entra, quando} */
    function rota({onde, volume = 1, molhado = .12, quando = 0, grupo} = {}){
      const entra = ctx.createGain(); entra.gain.value = volume;
      let fim = entra, atraso = 0;
      if (onde){
        const d = [onde[0] - ouvinte.p[0], onde[1] - ouvinte.p[1], onde[2] - ouvinte.p[2]], dist = Math.hypot(...d) || .001;
        const g = ctx.createGain(); g.gain.value = 1 / (1 + dist * .085);
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = Math.max(900, 16000 / (1 + dist * .12));
        fim.connect(g); g.connect(f); fim = f; atraso = dist / 340;
        if (ctx.createStereoPanner){ const p = ctx.createStereoPanner(); p.pan.value = Math.max(-.9, Math.min(.9, (d[0] * ouvinte.direita[0] + d[2] * ouvinte.direita[2]) / dist * Math.min(1, dist / 1.5))); fim.connect(p); fim = p; }
      }
      fim.connect(grupo || geral);
      if (molhado > 0){ const e = ctx.createGain(); e.gain.value = molhado; fim.connect(e); e.connect(eco); }
      return {entra, quando:agora() + .004 + quando + atraso};
    }
    /* um volume que sobe em "ataque" e cai em "dura" */
    function envelope(r, t, pico, dura, ataque = .001){
      const g = ctx.createGain();
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, pico), t + ataque); g.gain.exponentialRampToValueAtTime(.0001, t + ataque + dura);
      g.connect(r.entra); return g;
    }
    /* ruído filtrado. f = frequência inicial; ate = frequência final */
    function chiado(r, {t = 0, dura = .1, pico = .5, tipo = 'lowpass', f = 2000, ate, q = .8, ataque = .001, ritmo = 1}){
      const ini = r.quando + t, s = ctx.createBufferSource(); s.buffer = ruidoBuf; s.playbackRate.value = ritmo;
      const fl = ctx.createBiquadFilter(); fl.type = tipo; fl.Q.value = q; fl.frequency.setValueAtTime(f, ini);
      if (ate) fl.frequency.exponentialRampToValueAtTime(ate, ini + ataque + dura);
      s.connect(fl); fl.connect(envelope(r, ini, pico, dura, ataque)); s.start(ini, Math.random() * 1.2); s.stop(ini + ataque + dura + .02);
    }
    /* nota de oscilador, que pode escorregar de f para ate */
    function nota(r, {t = 0, dura = .1, pico = .5, onda = 'sine', f = 200, ate, ataque = .002, treme = 0, ritmoTreme = 6, filtro, q = 1}){
      const ini = r.quando + t, o = ctx.createOscillator(); o.type = onda; o.frequency.setValueAtTime(f, ini);
      if (ate) o.frequency.exponentialRampToValueAtTime(ate, ini + ataque + dura);
      if (treme){ const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = ritmoTreme; lg.gain.value = treme; l.connect(lg); lg.connect(o.frequency); l.start(ini); l.stop(ini + dura + .05); }
      let saida = o;
      if (filtro){ const fl = ctx.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = filtro; fl.Q.value = q; o.connect(fl); saida = fl; }
      saida.connect(envelope(r, ini, pico, dura, ataque)); o.start(ini); o.stop(ini + ataque + dura + .02);
    }
    /* peças de metal: um estalo e o tinido */
    function metal(r, t, f, pico, dura = .05){
      chiado(r, {t, dura:.018, pico:pico * .9, tipo:'highpass', f:f * 1.4});
      for (const [k, v] of [[1, .55], [1.53, .35], [2.31, .22]]) nota(r, {t, dura:dura * (1.2 - k * .2), pico:pico * v * .5, onda:'triangle', f:f * k * entre(.97, 1.03)});
    }
    const baque = (r, t, f, pico, dura = .09) => { nota(r, {t, dura, pico, f, ate:f * .45}); chiado(r, {t, dura:dura * .8, pico:pico * .6, f:f * 5, ate:f * 1.5}); };

    /* ---------------------------------------------------------------- tiros e disparos */
    function tiro(id, f){
      if (f.modo === 'flecha') return id === 'estilingue' ? elastico() : corda(150, .5);
      if (f.modo === 'besta') return corda(id === 'besta_tatica' ? 118 : 96, .75, true);
      if (f.luz){ const r = rota({volume:1.6, molhado:.35}); baque(r, 0, 140, .8, .12); chiado(r, {t:.03, dura:.9, pico:.28, tipo:'bandpass', f:2600, ate:900, q:1.4, ataque:.05}); return; }
      const p = TIROS[id] || TIROS.pistola, k = entre(.94, 1.06);
      if (f.silencio){
        const r = rota({volume:p.volume * 1.1, molhado:.08});
        chiado(r, {dura:.07, pico:.75, f:1400 * k, ate:380}); nota(r, {dura:.07, pico:.45, f:p.grave * 1.1, ate:55});
        metal(r, .012, 2100, .22, .03); return;
      }
      const r = rota({volume:p.volume * 2.3, molhado:p.cauda * .6});
      chiado(r, {dura:.012, pico:.95, tipo:'highpass', f:2400 * k});                                       /* o estalo */
      chiado(r, {dura:p.dura, pico:.85, f:p.corpo * k, ate:p.corpo * .14});                                 /* o estouro */
      chiado(r, {dura:p.dura * .6, pico:.4, tipo:'bandpass', f:p.corpo * .3 * k, q:1.1});
      nota(r, {dura:p.dura * 1.15, pico:.9, f:p.grave * k, ate:p.grave * .32});                             /* a pancada no peito */
      chiado(r, {t:.02, dura:p.dura * 2.6 * p.cauda, pico:.2, f:820, ate:160, ataque:.015});                /* o rabo do som */
      if (p.lata){ for (const [m, v] of [[1, .16], [1.47, .11]]) nota(r, {t:.012, dura:.16, pico:v, onda:'square', f:610 * m * entre(.9, 1.1), ate:540 * m, filtro:1500, q:2}); metal(r, entre(.05, .08), 1300, .2, .06); }
    }
    function corda(f, volume, gatilho){
      const r = rota({volume:volume * 1.4, molhado:.1});
      if (gatilho) metal(r, 0, 1700, .35, .025);
      nota(r, {t:.006, dura:.28, pico:.55, onda:'triangle', f:f * 1.5, ate:f * .82, treme:f * .06, ritmoTreme:38});
      chiado(r, {t:.004, dura:.05, pico:.4, tipo:'bandpass', f:1900, q:1});
      chiado(r, {t:.02, dura:.2, pico:.16, tipo:'bandpass', f:3200, ate:900, q:2, ataque:.02});            /* a flecha cortando o ar */
    }
    function elastico(){
      const r = rota({volume:1.2, molhado:.06});
      chiado(r, {dura:.04, pico:.6, tipo:'bandpass', f:1100, q:1.2}); nota(r, {dura:.1, pico:.4, onda:'triangle', f:260, ate:110});
      chiado(r, {t:.02, dura:.14, pico:.12, tipo:'bandpass', f:2600, ate:1200, q:3, ataque:.02});
    }
    function puxarCorda(id){
      const r = rota({volume:2.6, molhado:0, grupo:grupoArma});
      if (id === 'estilingue') nota(r, {dura:.4, pico:.1, onda:'sawtooth', f:150, ate:290, ataque:.08, filtro:700, q:4, treme:18, ritmoTreme:24});
      else for (let i = 0; i < 6; i++) chiado(r, {t:.05 + i * .085 + entre(0, .02), dura:.035, pico:.16 + i * .02, tipo:'bandpass', f:420 + i * 70, q:9});
    }

    /* ---------------------------------------------------------------- mecanismo: o som acompanha a animação */
    function ciclo(modo){
      const r = rota({volume:.36, molhado:.07, grupo:grupoArma});
      if (modo === 'bomba'){ chiado(r, {dura:.08, pico:.35, tipo:'bandpass', f:900, ate:1800, q:1.2}); metal(r, .05, 1000, .6, .05); metal(r, .17, 1350, .68, .05); }
      else { metal(r, 0, 1900, .4, .035); chiado(r, {t:.04, dura:.09, pico:.22, tipo:'bandpass', f:1500, ate:2600, q:2}); metal(r, .15, 1250, .5, .05); metal(r, .21, 2200, .42, .03); }
    }
    const seco = () => { const r = rota({volume:1.5, molhado:.03}); metal(r, 0, 2400, .45, .022); };
    function falha(){ const r = rota({volume:.7, molhado:.05}); metal(r, 0, 1500, .5, .03); chiado(r, {t:.03, dura:.07, pico:.3, tipo:'bandpass', f:700, q:2}); metal(r, .09, 820, .35, .05); }
    function destravar(dura){ const r = rota({volume:.34, molhado:.05, grupo:grupoArma}); for (const [u, f] of [[.12, 900], [.34, 1200], [.5, 850], [.68, 1500], [.86, 1900]]) metal(r, u * dura, f, .5, .04); }
    /* a recarga inteira, com as batidas nos mesmos instantes em que a mão faz cada coisa */
    function recarga(id, f, dura){
      const r = rota({volume:.38, molhado:.05, grupo:grupoArma}), em = u => u * dura;
      const roupa = (u, v = .12) => chiado(r, {t:em(u), dura:.14, pico:v, tipo:'bandpass', f:1300, ate:700, q:.7, ataque:.03});
      roupa(.03);
      if (f.modo === 'flecha'){ chiado(r, {t:em(.35), dura:.08, pico:.2, tipo:'bandpass', f:2100, q:1.5}); baque(r, em(.82), 320, .18, .04); return; }
      if (f.modo === 'besta'){ for (let i = 0; i < 7; i++) metal(r, em(.14 + i * .075), 1100 + i * 60, .34, .025); metal(r, em(.72), 760, .6, .06); chiado(r, {t:em(.82), dura:.07, pico:.2, tipo:'bandpass', f:1800, q:2}); metal(r, em(.9), 1700, .35, .03); return; }
      if (f.tambor){ metal(r, em(.14), 1250, .55, .05); for (let i = 0; i < 6; i++) metal(r, em(.3 + i * .065), 2500 + entre(-150, 150), .26, .02); metal(r, em(.76), 900, .65, .06); metal(r, em(.9), 2000, .3, .03); return; }
      if (f.modo === 'bomba'){ for (let i = 0; i < 4; i++){ const t = em(.2 + i * .135); chiado(r, {t, dura:.05, pico:.24, tipo:'bandpass', f:1100, q:2}); metal(r, t + .045, 1500, .38, .03); } metal(r, em(.82), 1000, .62, .05); metal(r, em(.9), 1350, .66, .05); return; }
      if (f.pente <= 2){ metal(r, em(.15), 900, .55, .05); for (let i = 0; i < f.pente; i++) metal(r, em(.38 + i * .17), 1600, .36, .035); metal(r, em(.76), 820, .65, .06); return; }
      /* carregador: solta, sai, entra, tapa e puxa o ferrolho */
      metal(r, em(.16), 1700, .4, .03); chiado(r, {t:em(.2), dura:.12, pico:.22, tipo:'bandpass', f:1600, ate:800, q:1.4}); roupa(.34, .1);
      chiado(r, {t:em(.55), dura:.08, pico:.24, tipo:'bandpass', f:900, ate:1500, q:1.4}); metal(r, em(.6), 880, .62, .05);
      baque(r, em(.76), 210, .5, .06); metal(r, em(.77), 1300, .34, .03);
      metal(r, em(.87), 1150, .5, .04); metal(r, em(.93), 1850, .62, .045);
    }
    function sacar(deFogo){
      const r = rota({volume:.42, molhado:.03, grupo:grupoArma});
      chiado(r, {dura:.2, pico:.2, tipo:'bandpass', f:900, ate:2100, q:.8, ataque:.05});
      if (deFogo){ metal(r, .2, 1500, .34, .03); metal(r, .27, 2100, .26, .025); } else baque(r, .24, 230, .18, .05);
    }
    function capsula(){
      const r = rota({volume:.2, molhado:.1}), f = entre(3600, 4600);
      for (const [t, v] of [[0, 1], [entre(.07, .11), .55], [entre(.16, .22), .28]]) for (const m of [1, 1.34]) nota(r, {t:.34 + t, dura:.07, pico:v * .4, f:f * m * entre(.98, 1.02)});
    }

    /* ---------------------------------------------------------------- de perto */
    function golpe(id, forte){
      const pesada = PESADAS.includes(id), mao = id === 'nenhum', corta = CORTANTES.includes(id);
      const r = rota({volume:(forte ? 1.25 : .95) * (mao ? 1.9 : 1), molhado:.05});
      const dura = pesada ? .26 : mao ? .12 : .17, base = pesada ? 260 : mao ? 520 : corta ? 760 : 430;
      chiado(r, {dura:dura * .55, pico:.5, tipo:'bandpass', f:base, ate:base * (corta ? 4.2 : 3), q:corta ? 3 : 1.6, ataque:dura * .5});
      if (corta) chiado(r, {t:dura * .35, dura:dura * .5, pico:.16, tipo:'highpass', f:3800, ataque:.03});
      if (id === 'corrente') for (let i = 0; i < 6; i++) metal(r, .02 + i * .04, entre(1400, 2800), .14, .03);
    }
    /* acertou um zumbi. arma = id; deTiro = bala ou flecha */
    function carne(onde, {cabeca, deTiro, arma, forte} = {}){
      const r = rota({onde, volume:deTiro ? 1.35 : forte ? 1.7 : 1.4, molhado:.08});
      baque(r, 0, deTiro ? 150 : PESADAS.includes(arma) ? 82 : 128, deTiro ? .55 : .85, deTiro ? .08 : .13);
      chiado(r, {t:.008, dura:.09, pico:.38, tipo:'bandpass', f:entre(520, 900), ate:240, q:2.4});
      if (!deTiro && CORTANTES.includes(arma)) chiado(r, {dura:.07, pico:.3, tipo:'bandpass', f:2900, ate:1300, q:3});
      if (cabeca){ chiado(r, {t:.004, dura:.035, pico:.55, tipo:'highpass', f:1500}); nota(r, {t:.006, dura:.06, pico:.3, onda:'square', f:240, ate:90, filtro:700, q:2}); }
      if (!deTiro) material(onde, arma, .35);
    }
    /* o som da própria arma batendo (parede, chão, alvo) */
    function material(onde, arma, forca = 1){
      const tipo = MATERIAL[arma] || 'aco', r = rota({onde, volume:1.2 * forca, molhado:.14});
      if (tipo === 'frigideira'){ for (const [f, v, d] of [[392, .6, .95], [1046, .34, .7], [1661, .22, .45], [2489, .12, .3]]) nota(r, {dura:d, pico:v, f:f * entre(.99, 1.01)}); chiado(r, {dura:.03, pico:.5, tipo:'highpass', f:2000}); }
      else if (tipo === 'violao'){ [98, 147, 196, 233, 330, 415].forEach((f, i) => nota(r, {t:i * .014, dura:.85 - i * .08, pico:.24, onda:'triangle', f:f * entre(.97, 1.03)})); baque(r, 0, 120, .55, .12); }
      else if (tipo === 'madeira'){ baque(r, 0, 210, .65, .07); nota(r, {dura:.07, pico:.3, onda:'triangle', f:520, ate:400}); }
      else if (tipo === 'mao'){ baque(r, 0, 140, .45, .06); }
      else if (tipo === 'corrente'){ for (let i = 0; i < 5; i++) metal(r, i * entre(.012, .028), entre(900, 2400), .4, .09); baque(r, 0, 130, .35, .07); }
      else { metal(r, 0, tipo === 'ferro' ? 620 : 1150, .75, tipo === 'ferro' ? .22 : .16); baque(r, 0, tipo === 'ferro' ? 110 : 170, .45, .08); }
    }
    /* bala, flecha ou pedra batendo no cenário */
    function impacto(onde, tipo){
      const r = rota({onde, volume:1.8, molhado:.18});
      chiado(r, {dura:.05, pico:.6, tipo:'bandpass', f:tipo === 'chao' ? 700 : 1700, q:1}); baque(r, 0, tipo === 'chao' ? 120 : 190, .3, .05);
      if (tipo === 'parede' && Math.random() < .16) nota(r, {t:.01, dura:.3, pico:.14, f:entre(2600, 3600), ate:entre(900, 1300)});          /* ricochete */
    }
    function alvo(onde, pontos){
      const r = rota({onde, volume:1, molhado:.16});
      baque(r, 0, 240, .8, .07); nota(r, {dura:.07, pico:.4, onda:'triangle', f:640, ate:470});
      if (pontos >= 9){ nota(r, {t:.02, dura:.5, pico:.34, f:1318}); nota(r, {t:.02, dura:.4, pico:.18, f:1976}); }
    }

    /* ---------------------------------------------------------------- zumbis, passos e aviso de acerto */
    function zumbi(onde, tipo, grosso){
      const r = rota({onde, volume:tipo === 'ronco' ? 1.3 : 1.7, molhado:.14});
      const f = (grosso ? 62 : 92) * entre(.86, 1.18), dura = tipo === 'dor' ? .26 : tipo === 'morte' ? .95 : entre(.7, 1.3);
      const fim = tipo === 'morte' ? f * .52 : tipo === 'dor' ? f * .8 : f * entre(.85, 1.15), ataque = tipo === 'dor' ? .015 : .14;
      for (const [banda, v] of [[grosso ? 330 : 520, 1.5], [grosso ? 780 : 1150, .8]])
        nota(r, {dura, pico:v * .5, onda:'sawtooth', f:tipo === 'dor' ? f * 1.5 : f, ate:fim, ataque, filtro:banda * entre(.85, 1.2), q:4.5, treme:f * .09, ritmoTreme:entre(17, 29)});
      chiado(r, {dura, pico:.11, tipo:'bandpass', f:grosso ? 500 : 900, ate:380, q:3, ataque:ataque * 1.4});
    }
    function passo(correndo){
      const r = rota({volume:correndo ? .75 : .45, molhado:.02});
      baque(r, 0, entre(78, 100), .55, .055); chiado(r, {t:.006, dura:entre(.05, .09), pico:.22, tipo:'bandpass', f:entre(1600, 2600), q:.8});
    }
    /* a luta: dor, fôlego, agarrão, queda, mordida, empurrão e a arma quebrando */
    function dor(){ const r = rota({volume:.8, molhado:.05}); const f = entre(150, 185); for (const [banda, v] of [[620, 1.4], [1250, .7]]) nota(r, {dura:.2, pico:v * .45, onda:'sawtooth', f:f * 1.15, ate:f * .72, ataque:.012, filtro:banda, q:4}); baque(r, 0, 95, .5, .07); }
    function ofegar(){ const r = rota({volume:.55, molhado:.02}); chiado(r, {dura:.26, pico:.2, tipo:'bandpass', f:1500, ate:900, q:1.4, ataque:.09}); chiado(r, {t:.36, dura:.22, pico:.14, tipo:'bandpass', f:900, ate:600, q:1.4, ataque:.07}); }
    function forca(){ const r = rota({volume:.6, molhado:.03}); chiado(r, {dura:.07, pico:.28, tipo:'bandpass', f:entre(500, 800), q:2}); nota(r, {dura:.09, pico:.2, onda:'sawtooth', f:entre(105, 135), ate:90, filtro:520, q:3}); }
    function agarrado(onde){ const r = rota({volume:.8, molhado:.05}); baque(r, 0, 110, .7, .1); chiado(r, {t:.02, dura:.22, pico:.3, tipo:'bandpass', f:900, ate:1700, q:.9}); zumbi(onde, 'dor'); }
    function queda(){ const r = rota({volume:1.1, molhado:.12}); baque(r, 0, 70, 1, .2); chiado(r, {t:.03, dura:.2, pico:.4, f:900, ate:200}); baque(r, .13, 100, .45, .09); }
    function mordida(){ const r = rota({volume:1.1, molhado:.04}); for (const t of [0, .07, .15]){ chiado(r, {t, dura:.05, pico:.55, tipo:'bandpass', f:entre(1300, 2300), q:2.5}); baque(r, t, 120, .5, .06); } dor(); }
    function empurrao(){ const r = rota({volume:.8, molhado:.07}); chiado(r, {dura:.14, pico:.3, tipo:'bandpass', f:500, ate:1500, q:1.2, ataque:.04}); baque(r, .07, 105, .75, .1); }
    function quebrar(){ const r = rota({volume:1, molhado:.14}); chiado(r, {dura:.05, pico:.9, tipo:'highpass', f:1800}); for (const [t, f] of [[0, 340], [.035, 230], [.08, 510]]) baque(r, t, f, .7, .07); for (let i = 0; i < 4; i++) metal(r, .14 + i * entre(.04, .09), entre(700, 1900), .2, .05); }

    const marcador = forte => { const r = rota({volume:.2, molhado:0}); nota(r, {dura:.04, pico:.5, onda:'square', f:forte ? 1750 : 1350, filtro:forte ? 1750 : 1350, q:3}); if (forte) nota(r, {t:.055, dura:.07, pico:.4, onda:'square', f:2330, filtro:2330, q:3}); };

    /* os sons da arma na mão (recarga, ferrolho) param se ela for trocada */
    function trocarGrupo(){
      if (grupoArma){ const g = grupoArma; g.gain.setValueAtTime(g.gain.value, agora()); g.gain.linearRampToValueAtTime(0, agora() + .03); }
      grupoArma = ctx.createGain(); grupoArma.connect(geral);
    }
    trocarGrupo();

    /* o toque do celular velho: três bipes duplos */
    function toqueCelular(onde){ const r = rota({onde, volume:2.2, molhado:.18}); for (let n = 0; n < 3; n++) for (const [d, f] of [[0, 1480], [.09, 1860]]) nota(r, {t:n * .26 + d, dura:.07, pico:.34, onda:'square', f, filtro:f, q:3}); }
    function explosao(onde){ const r = rota({onde, volume:3.2, molhado:.5}); chiado(r, {dura:.07, pico:1, tipo:'highpass', f:1400}); baque(r, 0, 74, 1.2, .55); chiado(r, {t:.02, dura:1.1, pico:.7, f:1500, ate:140}); for (let i = 0; i < 9; i++) metal(r, .06 + i * entre(.025, .06), entre(1800, 4200), .16, .06); }
    function mandibula(onde){ const r = rota({onde, volume:1.8, molhado:.14}); metal(r, 0, 620, .9, .28); metal(r, .018, 910, .7, .2); baque(r, 0, 130, .8, .08); }
    function latas(onde){ const r = rota({onde, volume:1.8, molhado:.2}); for (let i = 0; i < 12; i++) metal(r, i * entre(.035, .07), entre(900, 2600), .3 - i * .015, .09); }

    const todos = {toqueCelular, explosao, mandibula, latas, tiro, puxarCorda, ciclo, seco, falha, destravar, recarga, sacar, capsula, golpe, carne, material, impacto, alvo, zumbi, passo, marcador, dor, ofegar, forca, agarrado, queda, mordida, empurrao, quebrar};
    const contados = Object.fromEntries(Object.entries(todos).map(([n, fn]) => [n, (...a) => { contagem[n] = (contagem[n] || 0) + 1; return fn(...a); }]));
    return {...contados, trocarGrupo, contagem, ctx, volume:v => { geral.gain.value = v; }, ouvir:(p, direita) => { ouvinte = {p, direita}; }};
  }

  return {criar, TIROS};
})();
