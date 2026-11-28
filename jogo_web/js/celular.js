/* Modo celular: botões de toque sobre o jogo, analógico, arrastar para olhar e um menu ☰ com as opções em abas.
   Os botões acionam os mesmos comandos do teclado e do mouse, então nenhuma regra do jogo é repetida aqui.
   Liga sozinho em tela de toque, ou por ?celular=1, ou pelo botão "Modo celular". Carregado depois de estande.js. */
const Celular = (() => {
  const $ = id => document.getElementById(id);
  const GUARDA = 'wo-celular';
  const naCena = typeof Cena === 'object' && Cena.ativa;
  let guardado = {};
  try { guardado = JSON.parse(localStorage.getItem(GUARDA)) || {}; } catch (e){}
  const guardar = () => { try { localStorage.setItem(GUARDA, JSON.stringify(guardado)); } catch (e){} };
  const preso = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------------------------------------------------------------- o mapeamento
     deitado e empe = onde fica o centro do botão, em fração da tela (largura, altura). tam = diâmetro em px numa tela de 390 px */
  const B = (id, nome, faz, tecla, tam, deitado, empe, mais = {}) => ({id, nome, faz, tecla, tam, deitado, empe, ...mais});
  const BOTOES = [
    B('andar',     'Analógico',     'Andar. Levado até a borda, para a frente: corre', 'W A S D · Shift', 128, [.13, .70], [.22, .84], {analogico:true}),
    B('atacar',    'Golpe',         'Golpear, atirar ou puxar o arco. Segurar: golpe forte. Dá para arrastar nele e olhar', 'Clique', 86, [.90, .70], [.83, .83], {principal:true}),
    B('mirar',     'Defender',      'Mirar (toque liga e desliga) ou defender (segurar)', 'Botão direito', 60, [.91, .46], [.85, .70]),
    B('pular',     'Pular',         'Pular, agarrar a borda, pular a janela', 'Espaço', 66, [.79, .85], [.62, .90]),
    B('usar',      'Usar',          'Porta, janela, madeira, recolher armadilha, pisar no caído', 'E', 62, [.78, .62], [.63, .78]),
    B('esquiva',   'Esquivar',      'Esquivar para o lado do analógico', 'Q', 52, [.68, .85], [.44, .92]),
    B('abaixar',   'Abaixar',       'Abaixar (toque liga e desliga)', 'C', 48, [.58, .87], [.44, .81]),
    B('empurrar',  'Empurrar',      'Empurrar quem está na frente', 'F', 50, [.68, .64], [.65, .66], {so:'luta'}),
    B('armadilha', 'Armadilha',     'Usar a armadilha escolhida', 'X', 56, [.81, .38], [.86, .57], {so:'cena'}),
    B('trocaArm',  'Trocar',        'Trocar de armadilha', 'Z', 38, [.73, .39], [.69, .55], {so:'cena'}),
    B('recarregar','Recarregar',    'Recarregar (aparece com arma de fogo)', 'R', 50, [.92, .25], [.86, .45]),
    B('arma',      'Arma',          'Próxima arma', 'Rodinha', 46, [.83, .20], [.86, .34]),
    B('corda',     'Corda',         'Lançar a corda ou fazer rapel (aparece perto da beirada)', 'G', 50, [.58, .66], [.20, .67], {so:'cena'}),
    B('tratar',    'Tratar',        'Tratar o ferimento (aparece quando se machuca)', 'T', 50, [.30, .55], [.40, .67], {so:'cena'}),
    B('camera',    'Câmera',        'Trocar a câmera', 'V', 40, [.73, .13], [.10, .30]),
  ].filter(b => !b.so || b.so === 'cena' && naCena || b.so === 'luta' && typeof Arena === 'object' && Arena.ativa);

  /* ---------------------------------------------------------------- mandar comandos */
  const tecla = (tipo, k) => dispatchEvent(new KeyboardEvent(tipo, {key:k, bubbles:true}));
  const toca = k => { tecla('keydown', k); tecla('keyup', k); };
  const naTela = (id, tipo) => $(id).dispatchEvent(new PointerEvent(tipo, {pointerId:77, bubbles:false}));
  const segurando = new Set();
  const segura = k => { if (!segurando.has(k)){ segurando.add(k); tecla('keydown', k); } };
  const solta = k => { if (segurando.delete(k)) tecla('keyup', k); };
  const vibra = ms => { if (guardado.vibrar !== false && navigator.vibrate && navigator.userActivation?.hasBeenActive !== false) try { navigator.vibrate(ms); } catch (e){} };
  const luta = () => Estande.estado()?.f.tipo === 'golpe';
  let abaixado = false, mirando = false;

  const AO_APERTAR = {
    atacar:() => naTela('atirarTela', 'pointerdown'),
    mirar:() => naTela('mirarTela', 'pointerdown'),
    pular:() => toca(' '), usar:() => toca('e'), esquiva:() => toca(naCena ? 'q' : ' '), empurrar:() => toca('f'),
    armadilha:() => toca('x'), trocaArm:() => toca('z'), recarregar:() => toca('r'), corda:() => toca('g'), tratar:() => toca('t'), camera:() => toca('v'),
    arma:() => Estande.trocarArma(1),
    abaixar:() => { abaixado = !abaixado; abaixado ? segura('c') : solta('c'); },
  };
  const AO_SOLTAR = {
    atacar:() => naTela('atirarTela', 'pointerup'),
    /* defender é segurando; mirar é um toque que fica */
    mirar:() => { if (luta() && Estande.tela.mirar) naTela('mirarTela', 'pointerdown'); },
  };

  /* ---------------------------------------------------------------- olhar arrastando */
  function girar(dx, dy){ Estande.olhar(dx * (guardado.toque || 1) * 2.2, dy * (guardado.toque || 1) * 1.8); }

  /* ---------------------------------------------------------------- os botões na tela */
  let camada = null, ligado = false, editando = false;
  const nos = {};
  const emPe = () => $('visao').parentElement.clientHeight > $('visao').parentElement.clientWidth;
  const lugarDe = b => {
    const orient = emPe() ? 'empe' : 'deitado', salvo = guardado.lugares?.[orient]?.[b.id], p = salvo || b[orient];
    return guardado.canhoto && !salvo ? [1 - p[0], p[1]] : p;
  };
  /* a letra encolhe o bastante para a palavra caber dentro do botão */
  function letra(el){
    const d = Number(el.dataset.d) || 50, maior = Math.max(1, ...(el.querySelector('span')?.textContent || '').split(' ').map(p => p.length));
    el.style.fontSize = Math.max(8, Math.min(15, d * .19, d * .88 / (maior * .6))).toFixed(1) + 'px';
  }
  function posicionar(){
    if (!camada) return;
    const W = camada.clientWidth, H = camada.clientHeight; if (!W || !H) return;
    window.WO_EM_PE = ligado && H > W;
    const escala = preso(Math.min(W, H) / 390, .82, 1.35) * (guardado.tamanho || 1);
    for (const b of BOTOES){
      const el = nos[b.id], [x, y] = lugarDe(b), d = Math.round(b.tam * escala);
      el.style.width = el.style.height = d + 'px';
      el.style.left = Math.round(preso(x * W, d / 2 + 4, W - d / 2 - 4) - d / 2) + 'px';
      el.style.top = Math.round(preso(y * H, d / 2 + 4, H - d / 2 - 4) - d / 2) + 'px';
      el.dataset.d = d; letra(el);
    }
    camada.style.setProperty('--opaco', guardado.opacidade ?? .78);
  }

  function arrastarNoEditor(el, b){
    el.addEventListener('pointerdown', ev => {
      if (!editando) return;
      ev.preventDefault(); ev.stopPropagation(); try { el.setPointerCapture(ev.pointerId); } catch (e){}
      const caixa = camada.getBoundingClientRect();
      const mover = m => {
        const orient = emPe() ? 'empe' : 'deitado';
        ((guardado.lugares ||= {})[orient] ||= {})[b.id] = [preso((m.clientX - caixa.left) / caixa.width, .03, .97), preso((m.clientY - caixa.top) / caixa.height, .03, .97)];
        posicionar();
      };
      const fim = () => { el.removeEventListener('pointermove', mover); el.removeEventListener('pointerup', fim); el.removeEventListener('pointercancel', fim); guardar(); };
      el.addEventListener('pointermove', mover); el.addEventListener('pointerup', fim); el.addEventListener('pointercancel', fim);
    });
  }

  function ligarBotao(el, b){
    let dedo = null, ultimo = null;
    el.addEventListener('pointerdown', ev => {
      if (editando || dedo !== null) return;
      ev.preventDefault(); ev.stopPropagation(); dedo = ev.pointerId; ultimo = [ev.clientX, ev.clientY];
      try { el.setPointerCapture(ev.pointerId); } catch (e){}
      el.classList.add('apertado'); vibra(b.principal ? 14 : 8); AO_APERTAR[b.id]?.();
    });
    /* segurando o golpe, arrastar também olha */
    el.addEventListener('pointermove', ev => { if (ev.pointerId !== dedo || !b.principal) return; girar(ev.clientX - ultimo[0], ev.clientY - ultimo[1]); ultimo = [ev.clientX, ev.clientY]; });
    const fim = ev => { if (ev.pointerId !== dedo) return; dedo = null; el.classList.remove('apertado'); AO_SOLTAR[b.id]?.(); };
    el.addEventListener('pointerup', fim); el.addEventListener('pointercancel', fim); el.addEventListener('lostpointercapture', fim);
  }

  /* o analógico vira W A S D; no fim do curso, para a frente, também corre */
  function direcao(x, y){
    const forca = Math.hypot(x, y), quer = new Set();
    if (forca > .24){
      const ux = x / forca, uy = y / forca;
      if (uy < -.38) quer.add('w'); if (uy > .38) quer.add('s'); if (ux < -.38) quer.add('a'); if (ux > .38) quer.add('d');
      if (forca > .94 && uy < -.38) quer.add('shift');
    }
    for (const k of ['w', 'a', 's', 'd', 'shift']) quer.has(k) ? segura(k) : solta(k);
    return quer;
  }
  function ligarAnalogico(el){
    const pino = el.querySelector('i'); let dedo = null;
    const mover = ev => {
      if (ev.pointerId !== dedo) return;
      const r = el.getBoundingClientRect(), raio = r.width * .42;
      let x = (ev.clientX - r.left - r.width / 2) / raio, y = (ev.clientY - r.top - r.height / 2) / raio; const f = Math.hypot(x, y); if (f > 1){ x /= f; y /= f; }
      pino.style.transform = `translate(${x * raio}px, ${y * raio}px)`;
      el.classList.toggle('correndo', direcao(x, y).has('shift'));
    };
    el.addEventListener('pointerdown', ev => { if (editando || dedo !== null) return; ev.preventDefault(); ev.stopPropagation(); dedo = ev.pointerId; try { el.setPointerCapture(ev.pointerId); } catch (e){} mover(ev); });
    el.addEventListener('pointermove', mover);
    const fim = ev => { if (ev.pointerId !== dedo) return; dedo = null; pino.style.transform = ''; el.classList.remove('correndo'); direcao(0, 0); };
    el.addEventListener('pointerup', fim); el.addEventListener('pointercancel', fim); el.addEventListener('lostpointercapture', fim);
  }

  function montarCamada(){
    camada = document.createElement('div'); camada.id = 'toque';
    const olhar = document.createElement('div'); olhar.id = 'toqueOlhar'; camada.append(olhar);
    let dedo = null, ultimo = null;
    olhar.addEventListener('pointerdown', ev => { if (editando || dedo !== null) return; ev.preventDefault(); dedo = ev.pointerId; ultimo = [ev.clientX, ev.clientY]; try { olhar.setPointerCapture(ev.pointerId); } catch (e){} });
    olhar.addEventListener('pointermove', ev => { if (ev.pointerId !== dedo) return; girar(ev.clientX - ultimo[0], ev.clientY - ultimo[1]); ultimo = [ev.clientX, ev.clientY]; });
    const fimOlhar = ev => { if (ev.pointerId === dedo) dedo = null; };
    olhar.addEventListener('pointerup', fimOlhar); olhar.addEventListener('pointercancel', fimOlhar);
    for (const b of BOTOES){
      const el = document.createElement('button'); el.type = 'button'; el.id = 'tq_' + b.id; el.className = 'tq' + (b.principal ? ' principal' : '') + (b.analogico ? ' analogico' : '');
      el.setAttribute('aria-label', b.nome);
      el.innerHTML = b.analogico ? '<i></i><span>andar</span>' : `<span>${b.nome}</span><small></small>`;
      el.addEventListener('contextmenu', e => e.preventDefault());
      arrastarNoEditor(el, b); b.analogico ? ligarAnalogico(el) : ligarBotao(el, b);
      nos[b.id] = el; camada.append(el);
    }
    const barra = document.createElement('div'); barra.id = 'barraEditor';
    barra.innerHTML = '<span>Arraste os botões para onde quiser</span><button type="button" id="editorPadrao">Padrão</button><button type="button" id="editorPronto">Concluir</button>';
    camada.append(barra);
    document.querySelector('.tela').append(camada);
    $('editorPronto').addEventListener('click', () => editar(false));
    $('editorPadrao').addEventListener('click', () => { delete guardado.lugares; guardar(); posicionar(); });
    new ResizeObserver(posicionar).observe(camada);
  }
  function editar(sim){ editando = sim; document.body.classList.toggle('editando', sim); if (sim){ menu(false); soltarTudo(); } posicionar(); }
  function soltarTudo(){ for (const k of [...segurando]) solta(k); abaixado = false; if (Estande.tela.mirar) naTela('mirarTela', 'pointerdown'); if (Estande.tela.atirar) naTela('atirarTela', 'pointerup'); }

  /* o que cada botão mostra agora */
  function atualizar(){
    if (!ligado || !camada) return;
    const est = Estande.estado(); if (!est) return;
    const f = est.f, m = typeof Arena === 'object' && Arena.ativa ? Arena.mundo() : null, e = naCena ? Cena.estado() : null;
    const texto = (id, nome, sob = '') => { const el = nos[id]; if (!el) return; const n = el.querySelector('span'); if (n.textContent !== nome){ n.textContent = nome; letra(el); } const s = el.querySelector('small'); if (s) s.textContent = sob; };
    const ver = (id, sim) => { if (nos[id]) nos[id].hidden = !sim && !editando; };
    const marca = (id, classe, sim) => nos[id]?.classList.toggle(classe, !!sim);
    const preso_ = !!m?.jog.agarrado;
    texto('atacar', preso_ ? 'Soltar!' : f.tipo === 'golpe' ? 'Golpe' : f.modo === 'flecha' ? 'Puxar' : 'Atirar'); marca('atacar', 'urgente', preso_);
    texto('mirar', f.tipo === 'golpe' ? 'Defender' : 'Mirar'); marca('mirar', 'ligado', Estande.tela.mirar); mirando = Estande.tela.mirar;
    ver('recarregar', f.tipo === 'tiro' && f.modo !== 'flecha'); if (f.tipo === 'tiro') texto('recarregar', 'Recarregar', est.municao + '/' + f.pente);
    marca('abaixar', 'ligado', abaixado);
    marca('esquiva', 'apagado', m && (m.jog.esquivaPausa > 0 || e && e.modo !== 'chao'));
    if (naCena){
      const frente = Cena.leitura().frente || '', oferta = /^E: /.test(frente), noChao = m.zumbis.some(z => Combate.vivo(z) && Combate.noChao(z) && Math.hypot(z.x - Estande.jog.x, z.z - Estande.jog.z) < 1.5);
      texto('usar', noChao ? 'Pisar' : 'Usar', oferta && !noChao ? frente.slice(3).split(/ \(| ·/)[0] : '');
      marca('usar', 'chama', oferta || noChao); marca('usar', 'apagado', !oferta && !noChao);
      const arm = Cena.armadilhas(); if (arm){ texto('armadilha', Armadilhas.TIPOS[arm.tipo].curto.replace('armadilha de ', '').replace(' de pregos', '').replace(' com latas', ''), '×' + arm.estoque[arm.tipo]); marca('armadilha', 'apagado', !arm.estoque[arm.tipo]); }
      ver('corda', !!e && (!!e.comCorda || e.modo === 'corda'));
      ver('tratar', !!e && !!e.ferimento && !e.ferimento.tratado);
    }
  }

  /* ---------------------------------------------------------------- o menu ☰ em abas */
  const ABAS = [
    ['jogo', 'Jogo', ['#demo', 'label[for=camera]', '#camera', 'label[for=cenario]', '#cenario', 'label[for=estadoJogador]', '#estadoJogador', '#dormir', '#recomecar', '#outraCena', '#arrumarObjetos', '#avisoVisual^']],
    ['arma', 'Arma', ['label[for=arma]', '#arma', 'label[for=peca_mira]', '#peca_mira', 'label[for=peca_ponta]', '#peca_ponta', 'label[for=peca_baixo]', '#peca_baixo', 'label[for=peca_carregador]', '#peca_carregador', '#todas^']],
    ['zumbis', 'Zumbis', ['#soltarUm<']],
    ['abrigo', 'Abrigo', ['#irAbrigo<', '#irAbrigo<+']],
    ['armadilhas', 'Armadilhas', ['#armIsca<', '#armIsca<+']],
    ['ajustes', 'Som e tela', ['#somLigado^', 'label[for=volume]', '#volume', '#noite^', 'label[for=ritmo]', '#ritmo', 'label[for=sensibilidade]', '#sensibilidade']],
    ['controles', 'Controles', []],
  ];
  /* "#id<" = o bloco de botões que contém o id; "<+" = a nota logo depois dele; "#id^" = o rótulo em volta */
  function achar(sel){
    if (sel.endsWith('<+')){ const b = achar(sel.slice(0, -1)); const n = b?.nextElementSibling || b?.__depois; return n && n.matches?.('.nota') ? n : null; }
    if (sel.endsWith('<')) return document.querySelector(sel.slice(0, -1))?.parentElement;
    if (sel.endsWith('^')) return document.querySelector(sel.slice(0, -1))?.closest('label');
    return document.querySelector(sel);
  }
  let gaveta = null, aba = 'jogo';
  const mudados = [];
  function montarMenu(){
    gaveta = document.createElement('div'); gaveta.id = 'gaveta';
    gaveta.innerHTML = '<div class="topo"><b>Opções</b><button type="button" id="fecharMenu" aria-label="Fechar o menu">✕</button></div><nav></nav><div class="paginas"></div>';
    const nav = gaveta.querySelector('nav'), paginas = gaveta.querySelector('.paginas');
    /* primeiro acha tudo, depois move: assim os vizinhos ainda estão no lugar */
    const achados = ABAS.map(([id, nome, sels]) => [id, nome, sels.map(achar).filter(Boolean)]);
    for (const [id, nome, itens] of achados){
      if (id !== 'controles' && !itens.some(n => !n.matches('.nota') && getComputedStyle(n).display !== 'none')) continue;
      const bt = document.createElement('button'); bt.type = 'button'; bt.textContent = nome; bt.dataset.aba = id; bt.addEventListener('click', () => abrirAba(id)); nav.append(bt);
      const pg = document.createElement('section'); pg.dataset.aba = id; paginas.append(pg);
      for (const n of itens){ if (mudados.some(x => x.no === n)) continue; const volta = document.createComment('lugar'); n.before(volta); mudados.push({no:n, volta}); pg.append(n); }
    }
    montarControles(paginas.querySelector('section[data-aba=controles]'));
    const fundo = document.createElement('div'); fundo.id = 'fundoMenu';
    const sanduiche = document.createElement('button'); sanduiche.type = 'button'; sanduiche.id = 'sanduiche'; sanduiche.setAttribute('aria-label', 'Abrir o menu'); sanduiche.innerHTML = '<i></i><i></i><i></i>';
    document.body.append(fundo, gaveta, sanduiche);
    sanduiche.addEventListener('click', () => menu(true)); fundo.addEventListener('click', () => menu(false)); $('fecharMenu').addEventListener('click', () => menu(false));
    /* ações de teste fecham o menu, para voltar ao jogo; escolhas e ajustes deixam aberto */
    gaveta.addEventListener('click', ev => { const b = ev.target.closest('button'); if (b && /^(soltar|tirar|irAbrigo|cercarCasa|grandaoNaCasa|recomecar|arm[A-Z]|interagirTela|usarArmadilhaTela|demo)/.test(b.id)) setTimeout(() => menu(false), 60); });
    abrirAba(aba);
  }
  function desmontarMenu(){
    for (const {no, volta} of mudados.splice(0)){ volta.replaceWith(no); }
    for (const id of ['gaveta', 'fundoMenu', 'sanduiche']) $(id)?.remove();
    gaveta = null;
  }
  function abrirAba(id){
    if (!gaveta.querySelector(`section[data-aba=${id}]`)) id = gaveta.querySelector('section').dataset.aba;
    aba = id;
    for (const n of gaveta.querySelectorAll('nav button, section')) n.classList.toggle('ativa', n.dataset.aba === id);
  }
  function menu(abrir){ if (!gaveta) return; document.body.classList.toggle('menu-aberto', abrir); if (abrir) soltarTudo(); }

  function montarControles(pg){
    const faixa = (id, nome, min, max, passo, valor) => `<label class="rotulo" for="${id}">${nome}</label><input id="${id}" type="range" min="${min}" max="${max}" step="${passo}" value="${valor}">`;
    const marca = (id, nome, sim) => `<label class="marcar"><input id="${id}" type="checkbox"${sim ? ' checked' : ''}> ${nome}</label>`;
    pg.innerHTML = '<button type="button" class="larga" id="ctEditar">✥ Mudar os botões de lugar</button>'
      + faixa('ctTamanho', 'Tamanho dos botões', .7, 1.4, .05, guardado.tamanho || 1)
      + faixa('ctOpacidade', 'Transparência dos botões', .3, 1, .05, guardado.opacidade ?? .78)
      + faixa('ctToque', 'Rapidez para olhar', .4, 2.2, .1, guardado.toque || 1)
      + marca('ctCanhoto', 'Canhoto (espelha os botões)', guardado.canhoto)
      + marca('ctVibrar', 'Vibrar ao tocar', guardado.vibrar !== false)
      + marca('ctLeve', 'Imagem mais leve (para aparelho fraco)', guardado.leve !== false)
      + '<button type="button" class="larga" id="ctCheia">⛶ Tela cheia</button>'
      + '<span class="rotulo">Mapa dos controles</span><table><thead><tr><th>Botão</th><th>O que faz</th><th>No teclado</th></tr></thead><tbody>'
      + BOTOES.map(b => `<tr><td>${b.nome}</td><td>${b.faz}</td><td>${b.tecla}</td></tr>`).join('') + '<tr><td>Arrastar na tela</td><td>Olhar em volta</td><td>Mouse</td></tr></tbody></table>'
      + '<button type="button" class="larga" id="ctSair">Sair do modo celular</button>';
    const em = id => pg.querySelector('#' + id);
    em('ctEditar').addEventListener('click', () => editar(true));
    for (const [id, chave] of [['ctTamanho', 'tamanho'], ['ctOpacidade', 'opacidade'], ['ctToque', 'toque']]) em(id).addEventListener('input', () => { guardado[chave] = Number(em(id).value); guardar(); posicionar(); });
    em('ctCanhoto').addEventListener('change', () => { guardado.canhoto = em('ctCanhoto').checked; delete guardado.lugares; guardar(); posicionar(); });
    em('ctVibrar').addEventListener('change', () => { guardado.vibrar = em('ctVibrar').checked; guardar(); });
    em('ctLeve').addEventListener('change', () => { guardado.leve = em('ctLeve').checked; guardar(); resolucao(); });
    em('ctCheia').addEventListener('click', () => { const d = document; const p = d.fullscreenElement ? d.exitFullscreen() : d.documentElement.requestFullscreen?.(); p?.catch?.(() => {}); });
    em('ctSair').addEventListener('click', () => mudar(false));
  }
  const resolucao = () => { window.WO_RESOLUCAO = ligado && guardado.leve !== false ? 1.25 : 2; };

  /* ---------------------------------------------------------------- ligar e desligar */
  let textoAntes = null, relogio = 0;
  const AJUDA = 'Analógico à esquerda para andar (até a borda corre). Arraste na tela para olhar. Os botões da direita atacam, pulam e usam. O menu ☰ tem as opções e o mapa dos controles.';
  function mudar(sim, lembrar = true){
    if (lembrar){ guardado.ligado = sim; guardar(); }
    if (sim === ligado) return;
    ligado = sim; document.body.classList.toggle('celular', sim);
    if (sim){
      if (!camada) montarCamada();
      camada.hidden = false; montarMenu();
      if ($('fimDeNovo')?.textContent === 'Começar'){ textoAntes = $('fimTexto').textContent; $('fimTexto').textContent = AJUDA; }
      relogio = setInterval(atualizar, 120); requestAnimationFrame(() => { posicionar(); atualizar(); });
    } else {
      soltarTudo(); editing(false); clearInterval(relogio); menu(false); desmontarMenu(); camada.hidden = true;
      if (textoAntes && $('fimDeNovo')?.textContent === 'Começar') $('fimTexto').textContent = textoAntes;
    }
    if (!sim) window.WO_EM_PE = false;
    resolucao();
  }
  const editing = sim => { editando = sim; document.body.classList.toggle('editando', sim); };

  const ESTILO = `
  #entrarCelular{background:var(--grafite);color:inherit;border:1px solid var(--linha);padding:10px 14px;font:700 14px Inter,system-ui,sans-serif;cursor:pointer}
  body.celular{overflow:hidden;overscroll-behavior:none}
  body.celular .app{grid-template-columns:1fr;grid-template-rows:100%;height:100vh;height:100dvh}
  body.celular .palco>header,body.celular .palco>footer,body.celular .painel,body.celular #convite,body.celular #placar{display:none!important}
  body.celular .tela{flex:1;height:100%;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
  body.celular .tela canvas{width:100%;height:100%;flex:1}
  #toque{position:absolute;inset:0;z-index:3;pointer-events:none;--opaco:.78}
  #toqueOlhar{position:absolute;inset:0;pointer-events:auto;touch-action:none}
  .tq{position:absolute;pointer-events:auto;touch-action:none;border-radius:50%;border:2px solid rgba(255,255,255,.55);background:rgba(23,23,26,.62);color:#fff;opacity:var(--opaco);padding:0 2px;
      display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif;font-weight:800;line-height:1.05;text-align:center;overflow:hidden;-webkit-tap-highlight-color:transparent}
  .tq span{pointer-events:none;max-width:100%}.tq small{pointer-events:none;font-size:.78em;font-weight:600;max-width:96%;max-height:2.2em;overflow:hidden}
  .tq.principal{background:rgba(241,106,50,.78);border-color:#fff}
  .tq.apertado,.tq.ligado{background:#f16a32;color:#17171a;transform:scale(.95);opacity:1}
  .tq.apagado{opacity:calc(var(--opaco) * .5)}
  .tq.chama{border-color:#2fbf55;box-shadow:0 0 0 3px rgba(47,191,85,.45);opacity:1}
  .tq.urgente{background:#d6392b;box-shadow:0 0 0 5px rgba(214,57,43,.45);opacity:1}
  .tq.analogico{background:rgba(23,23,26,.38);overflow:visible}
  .tq.analogico i{position:absolute;left:29%;top:29%;width:42%;height:42%;border-radius:50%;background:rgba(255,255,255,.85);pointer-events:none}
  .tq.analogico span{position:absolute;bottom:6px;font-size:.7em;opacity:.7}
  .tq.analogico.correndo{border-color:#f16a32;box-shadow:0 0 0 4px rgba(241,106,50,.5)}
  #barraEditor{display:none;position:absolute;left:50%;top:8px;transform:translateX(-50%);gap:8px;align-items:center;background:#17171a;color:#fff;padding:8px 10px;font:700 13px Inter,system-ui,sans-serif;pointer-events:auto;z-index:2;width:max-content;max-width:96%;flex-wrap:wrap;justify-content:center}
  #barraEditor button{background:#f16a32;color:#17171a;border:0;padding:9px 12px;font:800 13px Inter,system-ui,sans-serif}
  body.editando #barraEditor{display:flex}body.editando .tq{border:2px dashed #ffe27a;opacity:1;cursor:move}body.editando #toqueOlhar{background:rgba(0,0,0,.35)}body.editando #sanduiche{display:none}
  /* o que o jogo escreve por cima sai do caminho dos polegares */
  body.celular #estadoCaixa{left:8px!important;top:8px!important;font-size:11.5px!important;max-width:46%!important;padding:4px 8px}
  body.celular #leituraCena{left:8px;top:92px;font-size:11.5px;max-width:46%;padding:4px 8px}
  body.celular #barras{left:50%!important;transform:translateX(-50%);top:8px;bottom:auto!important;width:min(190px,30%)!important;grid-template-columns:42px 1fr!important;gap:3px 5px!important;font-size:10px!important}
  body.celular #barras .barra{height:8px}
  body.celular #canto{right:62px;top:8px;bottom:auto!important;padding:4px 8px}body.celular #nomeArma{font-size:10.5px}body.celular #municao{font-size:14px}
  body.celular #ativarSom{right:8px;top:60px!important;padding:7px 10px;font-size:12px;z-index:5}
  body.celular #mensagem{font-size:14px;padding:0 20px;top:calc(50% - 74px)!important;bottom:auto!important}
  body.celular #agarrao{top:104px!important;bottom:auto!important}
  body.celular #fim{z-index:6}body.celular #fim h2{font-size:24px}body.celular #fim p{font-size:13.5px;max-width:480px}
  @media (orientation:portrait){
    body.celular #barras{left:8px!important;transform:none;top:auto;bottom:auto!important;top:68px;width:150px!important}
    body.celular #leituraCena{top:124px;max-width:72%}body.celular #estadoCaixa{max-width:56%!important}
  }
  #sanduiche{position:fixed;right:8px;top:8px;z-index:8;width:46px;height:46px;background:rgba(23,23,26,.86);border:2px solid rgba(255,255,255,.6);display:flex;flex-direction:column;justify-content:center;gap:5px;align-items:center;cursor:pointer}
  #sanduiche i{display:block;width:22px;height:3px;background:#fff}
  #fundoMenu{position:fixed;inset:0;z-index:9;background:rgba(0,0,0,.5);display:none}
  #gaveta{position:fixed;z-index:10;top:0;right:0;bottom:0;width:min(390px,92vw);background:var(--grafite2);color:#f5f5ef;border-left:1px solid var(--linha);display:flex;flex-direction:column;transform:translateX(102%);transition:transform .18s ease;visibility:hidden}
  body.menu-aberto #gaveta{transform:none;visibility:visible}body.menu-aberto #fundoMenu{display:block}body.menu-aberto #sanduiche{display:none}
  #gaveta .topo{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;font-size:17px}
  #fecharMenu{width:44px;height:40px;background:var(--grafite);color:inherit;border:1px solid var(--linha);font-size:18px;cursor:pointer}
  #gaveta nav{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 10px;border-bottom:1px solid var(--linha)}
  #gaveta nav button{background:var(--grafite);color:inherit;border:1px solid var(--linha);padding:9px 10px;font:700 13px Inter,system-ui,sans-serif;cursor:pointer}
  #gaveta nav button.ativa{background:#f16a32;color:#17171a;border-color:#f16a32}
  #gaveta .paginas{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
  #gaveta section{display:none;padding:14px 12px 28px}#gaveta section.ativa{display:block}
  #gaveta .botoes button,#gaveta .larga{min-height:46px}
  #gaveta table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px}
  #gaveta th,#gaveta td{border-bottom:1px solid var(--linha);padding:6px 4px;text-align:left;vertical-align:top}#gaveta td:first-child{font-weight:800}
  `;
  function iniciar(){
    const s = document.createElement('style'); s.textContent = ESTILO; document.head.append(s);
    const entrar = document.createElement('button'); entrar.type = 'button'; entrar.id = 'entrarCelular'; entrar.textContent = '📱 Modo celular';
    entrar.addEventListener('click', () => mudar(true));
    document.querySelector('.palco header .modelos')?.prepend(entrar);
    addEventListener('orientationchange', () => setTimeout(posicionar, 250));
    document.addEventListener('visibilitychange', () => { if (document.hidden && ligado) soltarTudo(); });
    /* o endereço manda; depois a última escolha; sem nenhuma, liga sozinho em tela de toque */
    const naUrl = (location.search.match(/celular=(\d)/) || [])[1];
    const querer = naUrl !== undefined ? naUrl === '1' : guardado.ligado ?? matchMedia('(pointer:coarse)').matches;
    if (querer) mudar(true, false);
  }
  iniciar();

  return {BOTOES, mudar, menu, editar, abrirAba, posicionar, atualizar, ligado:() => ligado};
})();
