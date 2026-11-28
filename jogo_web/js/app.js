/* Painel: liga cada controle à configuração e atualiza o visor. */
const GUARDA = 'wo-criador-personagem';
const $ = s => document.querySelector(s);
const copia = o => structuredClone(o);

function ler(){ try { return validar(JSON.parse(localStorage.getItem(GUARDA))); } catch (e){ return copia(PADRAO_WASHINGTON); } }
function guardar(){ try { localStorage.setItem(GUARDA, JSON.stringify(cfg)); } catch (e){} }

let cfg = ler(), modelo = null;
const visor = criarVisor($('#visor'));

function atualizar(){
  modelo = montar(cfg);
  if (visor){ visor.carregar(posar(modelo, cfg.pose).quads); visor.desenhar(); }
  guardar();
}
const pega = caminho => caminho.split('.').reduce((o, k) => o[k], cfg);
function poe(caminho, v){ const p = caminho.split('.'), k = p.pop(); p.reduce((o, x) => o[x], cfg)[k] = v; }

/* ao arrastar no seletor de cor, redesenha no máximo uma vez por quadro */
let agendado = 0;
function atualizarEmBreve(){ if (!agendado) agendado = setTimeout(() => { agendado = 0; atualizar(); }, 60); }

const ACAO = new Set(['oficina', 'sobrevivente', 'soldado', 'surrado', 'pm_farda', 'pm_manga_curta', 'macacao_quimico', 'traje_encapsulado', 'avental_epi']);   /* o resto aparece como roupa civil */
const ehCivil = id => !ACAO.has(id);

/* ---------- construtores de controles ---------- */
function el(tag, atrs = {}, ...filhos){
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(atrs)){ if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); }
  e.append(...filhos); return e;
}
function escolhas(titulo, caminho, lista){
  const grade = el('div', {class:'escolhas', role:'group', 'aria-label':titulo});
  for (const [id, nome] of Object.entries(lista)){
    const ativo = pega(caminho) === id;
    grade.append(el('button', {type:'button', class:ativo ? 'ativo' : '', 'aria-pressed':String(ativo), 'data-v':`${caminho}:${id}`, onclick(){ poe(caminho, id); atualizar(); painel(); }}, nome));
  }
  return el('div', {class:'campo'}, el('span', {class:'rotulo'}, titulo), grade);
}
function cores(titulo, valor, amostras, aoEscolher){
  const linha = el('div', {class:'cores'});
  for (const c of amostras) linha.append(el('button', {type:'button', class:'amostra' + (c.toUpperCase() === valor.toUpperCase() ? ' ativo' : ''), style:`background:${c}`, 'aria-label':`${titulo}: ${c}`, title:c, onclick(){ aoEscolher(c); atualizar(); painel(); }}));
  const livre = el('input', {type:'color', value:valor, 'aria-label':`${titulo}: outra cor`, title:'Outra cor'});
  livre.addEventListener('input', () => { aoEscolher(livre.value.toUpperCase()); atualizarEmBreve(); });
  livre.addEventListener('change', () => painel());
  linha.append(livre);
  return el('div', {class:'campo'}, el('span', {class:'rotulo'}, titulo), linha);
}
const corDe = (titulo, caminho, amostras) => cores(titulo, pega(caminho), amostras, v => poe(caminho, v));
function chave(titulo, caminho){
  const i = el('input', {type:'checkbox'}); i.checked = pega(caminho);
  i.addEventListener('change', () => { poe(caminho, i.checked); atualizar(); painel(); });
  return el('label', {class:'chave'}, i, titulo);
}

/* conjuntos prontos, separados por grupo */
let grupoKit = 'militar';
function blocoConjuntos(){
  const botaoKit = (id, k) => el('button', {type:'button', 'data-kit':id, onclick(){ aplicarKit(cfg, id); atualizar(); painel(); aviso(id === 'nada' ? 'Equipamentos retirados.' : `Conjunto "${k.nome}" aplicado.`); }}, k.nome);
  const grupos = el('div', {class:'grupos', role:'group', 'aria-label':'Tipo de conjunto'}, ...Object.entries(GRUPOS_KITS).map(([g, nome]) => {
    const quantos = Object.values(KITS).filter(k => k.grupo === g).length;
    return el('button', {type:'button', class:g === grupoKit ? 'ativo' : '', 'aria-pressed':String(g === grupoKit), 'data-grupo':g, onclick(){ grupoKit = g; painel(); }}, `${nome} (${quantos})`);
  }));
  const lista = el('div', {class:'escolhas'}, ...Object.entries(KITS).filter(([, k]) => k.grupo === grupoKit).map(([id, k]) => botaoKit(id, k)));
  const tirar = botaoKit('nada', KITS.nada); tirar.className = 'tirar';
  return el('div', {class:'campo'}, el('span', {class:'rotulo'}, 'Conjuntos prontos'), grupos, lista, tirar);
}

const ABAS = {
  rosto: () => [escolhas('Tipo de corpo', 'corpo', CORPOS), corDe('Cor da pele', 'pele', AMOSTRAS.pele), escolhas('Sobrancelhas', 'sobrancelha.estilo', SOBRANCELHAS), corDe('Cor da sobrancelha', 'sobrancelha.cor', AMOSTRAS.cabelo),
                corDe('Cor dos olhos', 'olhos', AMOSTRAS.olhos), escolhas('Boca', 'boca', BOCAS), escolhas('Óculos', 'oculos.estilo', OCULOS), corDe('Cor da armação', 'oculos.cor', AMOSTRAS.metal)],
  cabelo: () => [escolhas('Corte de cabelo', 'cabelo.estilo', CABELOS), corDe('Cor do cabelo', 'cabelo.cor', AMOSTRAS.cabelo),
                 escolhas('Barba', 'barba.estilo', BARBAS), corDe('Cor da barba', 'barba.cor', AMOSTRAS.cabelo),
                 el('button', {type:'button', class:'acao', onclick(){ cfg.barba.cor = cfg.cabelo.cor; cfg.sobrancelha.cor = cfg.cabelo.cor; atualizar(); painel(); }}, 'Usar a cor do cabelo na barba e sobrancelhas')],
  roupa: () => {
    const grupo = civil => Object.fromEntries(Object.entries(ROUPAS).filter(([k, v]) => ehCivil(k) === civil).map(([k, v]) => [k, v.nome]));
    const itens = [blocoConjuntos(), el('div', {class:'divisa'}), escolhas('Roupas civis', 'roupa', grupo(true)), escolhas('Aventura e ação', 'roupa', grupo(false))];
    for (const [k, [rotulo, padrao]] of Object.entries(ROUPAS[cfg.roupa].cores))
      itens.push(cores(rotulo, cfg.cores[cfg.roupa]?.[k] || padrao, AMOSTRAS.tecido, v => { (cfg.cores[cfg.roupa] = cfg.cores[cfg.roupa] || {})[k] = v; }));
    itens.push(el('button', {type:'button', class:'acao', onclick(){ delete cfg.cores[cfg.roupa]; atualizar(); painel(); }}, 'Voltar às cores originais desta roupa'));
    return itens;
  },
  cabeca: () => {
    const h = cfg.chapeu.estilo;
    const lista = civil => Object.fromEntries(Object.entries(CHAPEUS).filter(([k]) => k === 'nenhum' || (!!CHAPEUS_CIVIS[k] || k === 'gorro') === civil).map(([k, v]) => [k, v]));
    const itens = [escolhas('Chapéus civis', 'chapeu.estilo', lista(true)), escolhas('Capacetes e militares', 'chapeu.estilo', lista(false))];
    if (h !== 'nenhum') itens.push(corDe('Cor', 'chapeu.cor', CHAPEUS_CIVIS[h] || h === 'gorro' || h === 'touca' || CAPUZES.includes(h) ? AMOSTRAS.tecido : AMOSTRAS.militar));
    if (['bone', 'gorro', 'selva', 'tatico', 'combate', 'especial', 'viseira'].includes(h)) itens.push(chave('Camuflado', 'chapeu.camo'));
    if (h === 'tatico' || h === 'especial') itens.push(chave('Visão noturna', 'chapeu.visao'));
    if (CAPACETES.includes(h)) itens.push(chave('Fones com microfone', 'chapeu.fones'), chave('Óculos de proteção no capacete', 'chapeu.goggles'));
    itens.push(el('div', {class:'divisa'}), escolhas('Cobertura do rosto', 'facial.estilo', ROSTOS_EQ));
    if (MASCARAS_COM_COR.includes(cfg.facial.estilo)) itens.push(corDe('Cor da cobertura do rosto', 'facial.cor', AMOSTRAS.tecido));
    itens.push(chave('Protetor facial transparente', 'protetor.usa'));
    if (cfg.protetor.usa) itens.push(corDe('Cor da armação do protetor', 'protetor.cor', AMOSTRAS.tecido));
    itens.push(chave('Lenço no rosto', 'mascara.usa'));
    if (cfg.mascara.usa) itens.push(corDe('Cor do lenço', 'mascara.cor', AMOSTRAS.militar));
    return itens;
  },
  equip: () => {
    const itens = [blocoConjuntos()];
    const bloco = (titulo, caminho, lista, comCamo) => {
      itens.push(el('div', {class:'divisa'}), escolhas(titulo, caminho + '.estilo', lista));
      if (pega(caminho + '.estilo') !== 'nenhum'){ itens.push(corDe(`Cor: ${titulo.toLowerCase()}`, caminho + '.cor', AMOSTRAS.militar)); if (comCamo) itens.push(chave('Camuflado', caminho + '.camo')); }
    };
    bloco('Colete', 'colete', COLETES, true);
    bloco('Mochila', 'mochila', MOCHILAS, true);
    bloco('Luvas', 'luvas', LUVAS, false);
    itens.push(el('div', {class:'divisa'}), chave('Ombreiras (usam a cor do colete)', 'ombreiras.usa'), escolhas('Emblema', 'emblema.estilo', NOMES_EMBLEMA));
    itens.push(el('div', {class:'divisa'}), el('span', {class:'rotulo'}, 'Cinto e proteções'),
      chave('Cinto tático com bolsos e cantil', 'cinto.usa'), chave('Cinturão policial com coldre', 'cinturao.usa'), chave('Tonfa na mão', 'tonfa.usa'), chave('Escudo antitumulto', 'escudo.usa'), chave('Bolsa de perna', 'bolsaPerna.usa'), chave('Joelheiras', 'joelheiras.usa'), chave('Cotoveleiras', 'cotoveleiras.usa'));
    if (cfg.cinto.usa || cfg.bolsaPerna.usa) itens.push(corDe('Cor do cinto e da bolsa', 'cinto.cor', AMOSTRAS.militar));
    if (cfg.joelheiras.usa || cfg.cotoveleiras.usa) itens.push(corDe('Cor das proteções', 'joelheiras.cor', AMOSTRAS.militar));
    itens.push(el('div', {class:'divisa'}), chave('Lápis na mão', 'lapis.usa'), corDe('Cor do lápis', 'lapis.cor', AMOSTRAS.tecido));
    return itens;
  },
  armas: () => {
    const itens = Object.entries(TIPOS_ARMA).map(([t, titulo]) => escolhas(titulo, 'arma.estilo', Object.fromEntries(Object.entries(ARMAS).filter(([, a]) => a.tipo === t).map(([k, a]) => [k, a.nome]))));
    itens.unshift(el('button', {type:'button', class:'acao', onclick(){ cfg.arma.estilo = 'nenhum'; atualizar(); painel(); }}, 'Mãos livres (guardar a arma)'));
    if (armado(cfg)){ const a = ARMAS[cfg.arma.estilo];
      itens.push(el('div', {class:'campo'}, el('span', {class:'rotulo'}, a.materiais ? 'Materiais no jogo (ideia inicial)' : 'No jogo (ideia inicial)'), el('p', {}, a.materiais ? a.materiais.join(' · ') : NOTA_NO_JOGO[a.branca ? 'branca' : a.tipo])),
        el('button', {type:'button', class:'acao', onclick(){ cfg.pose = cfg.pose.startsWith('mirando') ? 'descanso' : poseDeMira(cfg.arma.estilo); atualizar(); painel(); }}, cfg.pose.startsWith('mirando') ? 'Voltar à pose de descanso' : 'Ver mirando')); }
    if (armado(cfg)){
      const id = cfg.arma.estilo, partes = [el('div', {class:'divisa'}), el('span', {class:'rotulo'}, 'Modificações desta arma')], ideias = [];
      for (const [slot, titulo] of Object.entries(SLOTS_MOD)){
        const lista = opcoesDe(id, slot); if (!Object.keys(lista).length) continue;
        const atual = modServe(id, slot, cfg.modarma[slot]) ? cfg.modarma[slot] : 'nenhum';
        const grade = el('div', {class:'escolhas', role:'group', 'aria-label':titulo});
        for (const [k, nome] of [['nenhum', 'Sem'], ...Object.entries(lista)]) grade.append(el('button', {type:'button', class:atual === k ? 'ativo' : '', 'aria-pressed':String(atual === k), 'data-mod':`${slot}:${k}`, onclick(){ cfg.modarma[slot] = k; atualizar(); painel(); }}, nome));
        partes.push(el('div', {class:'campo'}, el('span', {class:'rotulo'}, titulo), grade));
        if (MODS_ARMA[slot][atual]?.ideia) ideias.push(`${MODS_ARMA[slot][atual].nome}: ${MODS_ARMA[slot][atual].ideia}.`);
      }
      if (ideias.length) partes.push(el('div', {class:'campo'}, el('span', {class:'rotulo'}, 'Efeito no jogo (ideia inicial)'), ...ideias.map(t => el('p', {}, t))));
      partes.push(el('button', {type:'button', class:'acao', onclick(){ cfg.modarma = {...SEM_MOD}; atualizar(); painel(); }}, 'Tirar todas as modificações'));
      itens.push(...partes);
    }
    itens.push(el('div', {class:'divisa'}), chave('Escudo de tampa de latão (braço esquerdo)', 'broquel.usa'));
    return itens;
  },
  exportar: () => {
    const nome = el('input', {type:'text', value:cfg.nome, maxlength:'40'});
    nome.addEventListener('input', () => { cfg.nome = nome.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'personagem'; guardar(); });
    const arquivo = el('input', {type:'file', accept:'.json,application/json'});
    arquivo.addEventListener('change', async () => {
      const f = arquivo.files[0]; if (!f) return;
      try { cfg = validar(JSON.parse(await f.text())); atualizar(); painel(); aviso('Personagem carregado.'); }
      catch (e){ aviso('Não consegui ler esse arquivo. Escolha um .json salvo por este criador.'); }
    });
    const botao = (texto, dica, fn, principal) => el('div', {class:'exporta'}, el('button', {type:'button', class:'acao' + (principal ? ' principal' : ''), onclick:fn}, texto), el('p', {}, dica));
    const nomeArq = ext => `${cfg.nome || 'personagem'}-${cfg.roupa}.${ext}`;
    return [el('label', {class:'campo'}, el('span', {class:'rotulo'}, 'Nome do arquivo'), nome),
      botao('Baixar GLB (modelo 3D)', 'Para Blender, Unity (com importador de glTF), Godot e sites. Leva as 16 peças articuladas, as cores e a pose atual.', () => { baixar(nomeArq('glb'), gerarGLB(modelo, cfg), 'model/gltf-binary'); aviso('GLB gerado.'); }, true),
      botao('Baixar OBJ + MTL (ZIP)', 'Modelo parado na pose atual, para programas que não leem GLB.', () => { baixar(`${cfg.nome}-${cfg.roupa}-obj.zip`, gerarOBJ(modelo, cfg), 'application/zip'); aviso('OBJ gerado.'); }),
      botao('Baixar imagem PNG', 'Fundo transparente, 2000 × 2600, no ângulo que está na tela. Boa para artes e vídeos.', () => { baixar(nomeArq('png'), visor.imagem(2000, 2600, false), 'image/png'); aviso('PNG gerado.'); }),
      botao('Salvar este personagem', 'Guarda suas escolhas num arquivo para continuar ou editar depois.', () => { baixar(`${cfg.nome}.personagem.json`, JSON.stringify(cfg, null, 2), 'application/json'); aviso('Escolhas salvas.'); }),
      el('label', {class:'campo'}, el('span', {class:'rotulo'}, 'Abrir um personagem salvo'), arquivo)];
  },
};
const NOMES_ABAS = {rosto:'Rosto', cabelo:'Cabelo e barba', roupa:'Roupa', cabeca:'Cabeça', equip:'Equipamento', armas:'Armas', exportar:'Exportar'};
let aba = 'rosto';
function painel(){
  const rolagem = $('#conteudo').scrollTop;
  $('#abas').replaceChildren(...Object.entries(NOMES_ABAS).map(([k, v]) => el('button', {type:'button', role:'tab', 'aria-selected':String(k === aba), class:k === aba ? 'ativo' : '', 'data-aba':k, onclick(){ aba = k; painel(); $('#conteudo').scrollTop = 0; }}, v)));
  $('#conteudo').replaceChildren(...ABAS[aba]());
  $('#conteudo').scrollTop = rolagem;
  $('#poses').value = cfg.pose;
}
let relogio;
function aviso(t){ $('#aviso').textContent = t; clearTimeout(relogio); relogio = setTimeout(() => $('#aviso').textContent = '', 4000); }

$('#poses').replaceChildren(...Object.entries(POSES).map(([k, v]) => el('option', {value:k}, v)));
$('#poses').addEventListener('change', e => { cfg.pose = e.target.value; atualizar(); });
document.querySelectorAll('[data-vista]').forEach(b => b.addEventListener('click', () => {
  const [giro, elev, dist, alvo] = b.dataset.vista.split(',').map(Number);
  Object.assign(visor.cam, {giro, elev, dist, alvo}); visor.desenhar();
}));
document.querySelectorAll('[data-modelo]').forEach(b => b.addEventListener('click', () => {
  if (!confirm(`Começar de "${b.textContent.trim()}"? As escolhas atuais serão substituídas.`)) return;
  cfg = copia({limpo:PADRAO_LIMPO, feminino:PADRAO_FEMININO}[b.dataset.modelo] || PADRAO_WASHINGTON); atualizar(); painel();
}));
if (!visor) $('#aviso').textContent = 'Este navegador não conseguiu abrir o visor 3D (WebGL).';
atualizar();
painel();
