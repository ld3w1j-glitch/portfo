/* Painel do criador de zumbis. */
(() => {
const GUARDA = 'wo-criador-zumbi';
const $ = s => document.querySelector(s);
const visor = criarVisor($('#visor'));
const copia = o => structuredClone(o);
const garantir = c => { const v = validar(c); if (!v.zumbi) v.zumbi = validarZumbi({}); return v; };
function ler(){ try { const t = localStorage.getItem(GUARDA); return t ? garantir(JSON.parse(t)) : configZumbi('miolos'); } catch (e){ return configZumbi('miolos'); } }
let cfg = ler(), modelo = null, aba = 'prontos', relogio, agendado = 0;
const passado = [];

function guardar(){ try { localStorage.setItem(GUARDA, JSON.stringify(cfg)); } catch (e){} }
function atualizar(){
  modelo = montar(cfg);
  if (visor){ visor.carregar(posar(modelo, cfg.pose).quads); visor.desenhar(); }
  guardar();
}
const atualizarEmBreve = () => { if (!agendado) agendado = setTimeout(() => { agendado = 0; atualizar(); }, 60); };
function lembrar(){ passado.push(JSON.stringify(cfg)); if (passado.length > 60) passado.shift(); }
function aplicar(fn){ lembrar(); fn(); atualizar(); painel(); }
function aviso(t){ $('#aviso').textContent = t; clearTimeout(relogio); relogio = setTimeout(() => $('#aviso').textContent = '', 4000); }
const pega = caminho => caminho.split('.').reduce((o, k) => o[k], cfg);
const poe = (caminho, v) => { const p = caminho.split('.'), k = p.pop(); p.reduce((o, x) => o[x], cfg)[k] = v; };

function el(tag, atrs = {}, ...filhos){
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(atrs)){ if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); }
  e.append(...filhos); return e;
}
function escolhas(titulo, caminho, lista){
  return el('div', {class:'campo'}, el('span', {class:'rotulo'}, titulo), el('div', {class:'escolhas', role:'group', 'aria-label':titulo},
    ...Object.entries(lista).map(([id, nome]) => el('button', {type:'button', class:pega(caminho) === id ? 'ativo' : '', 'aria-pressed':String(pega(caminho) === id), 'data-v':`${caminho}:${id}`, onclick(){ aplicar(() => poe(caminho, id)); }}, nome))));
}
function nivel(titulo, caminho){
  return el('div', {class:'campo'}, el('span', {class:'rotulo'}, titulo), el('div', {class:'escolhas quatro-colunas', role:'group', 'aria-label':titulo},
    ...Z_NIVEIS.map((nome, i) => el('button', {type:'button', class:pega(caminho) === i ? 'ativo' : '', 'aria-pressed':String(pega(caminho) === i), 'data-v':`${caminho}:${i}`, onclick(){ aplicar(() => poe(caminho, i)); }}, nome))));
}
function cores(titulo, valor, amostras, ao){
  const linha = el('div', {class:'cores'}, ...amostras.map(c => el('button', {type:'button', class:'amostra' + (c.toUpperCase() === valor.toUpperCase() ? ' ativo' : ''), style:`background:${c}`, 'aria-label':`${titulo}: ${c}`, onclick(){ aplicar(() => ao(c)); }})));
  const livre = el('input', {type:'color', value:valor.toLowerCase(), 'aria-label':`${titulo}: outra cor`});
  let antes = false;
  livre.addEventListener('input', () => { if (!antes){ lembrar(); antes = true; } ao(livre.value.toUpperCase()); atualizarEmBreve(); });
  livre.addEventListener('change', () => { antes = false; painel(); });
  linha.append(livre);
  return el('div', {class:'campo'}, el('span', {class:'rotulo'}, titulo), linha);
}
function chave(titulo, caminho){
  const i = el('input', {type:'checkbox'}); i.checked = pega(caminho);
  i.addEventListener('change', () => aplicar(() => poe(caminho, i.checked)));
  return el('label', {class:'chave'}, i, titulo);
}
function lista(titulo, atual, opcoes, ao){
  const s = el('select', {class:'lista', 'aria-label':titulo}, ...Object.entries(opcoes).map(([k, v]) => el('option', {value:k}, v)));
  s.value = atual;
  s.addEventListener('change', () => aplicar(() => ao(s.value)));
  return el('label', {class:'campo'}, el('span', {class:'rotulo'}, titulo), s);
}
const botao = (texto, fn, classe = 'acao') => el('button', {type:'button', class:classe, onclick:fn}, texto);

function sortear(){ lembrar(); const n = 1 + Math.floor(Math.random() * 999999); cfg = garantir(zumbiAleatorio(n)); atualizar(); painel(); aviso(`Zumbi sorteado nº ${n}.`); }

const ABAS = {
  prontos: () => [
    botao('🎲 Sortear um zumbi', sortear, 'acao principal'),
    el('div', {class:'campo'}, el('span', {class:'rotulo'}, 'Zumbis prontos'), el('div', {class:'escolhas'}, ...Object.entries(ZUMBIS).map(([id, d]) =>
      el('button', {type:'button', 'data-zumbi':id, onclick(){ lembrar(); cfg = garantir(configZumbi(id)); atualizar(); painel(); aviso(`${d.nome} carregado.`); }}, d.nome)))),
    botao('Mudar o desenho das manchas e rasgos', () => aplicar(() => cfg.zumbi.semente = (cfg.zumbi.semente * 31 + 17) % 100000)),
    botao('Transformar o último personagem do criador em zumbi', () => {
      let meu = null; try { const t = localStorage.getItem('wo-criador-personagem'); if (t) meu = validar(JSON.parse(t)); } catch (e){}
      if (!meu) return aviso('Não achei o personagem. Use "Abrir personagem" na aba Exportar.');
      aplicar(() => { cfg = infectar(meu); });
    }),
  ],
  cabeca: () => [escolhas('Crânio', 'zumbi.cranio', Z_CRANIO), escolhas('Olhos', 'zumbi.olhos', Z_OLHOS), escolhas('Boca', 'zumbi.boca', Z_BOCAS), escolhas('Nariz', 'zumbi.nariz', Z_NARIZ),
    lista('Corte de cabelo', cfg.cabelo.estilo, CABELOS, v => cfg.cabelo.estilo = v), cores('Cor do cabelo', cfg.cabelo.cor, AMOSTRAS.cabelo, v => { cfg.cabelo.cor = v; cfg.sobrancelha.cor = v; }),
    chave('Falhas no cabelo', 'zumbi.falhas'),
    lista('Barba', cfg.barba.estilo, BARBAS, v => cfg.barba.estilo = v), lista('Óculos', cfg.oculos.estilo, OCULOS, v => cfg.oculos.estilo = v),
    lista('Chapéu ou capacete', cfg.chapeu.estilo, CHAPEUS, v => cfg.chapeu.estilo = v)],
  corpo: () => [escolhas('Tipo de corpo', 'corpo', CORPOS), escolhas('Porte', 'zumbi.porte', Z_PORTE),
    (() => { const i = el('input', {type:'range', min:'0.75', max:'1.35', step:'0.01', value:cfg.zumbi.altura, 'aria-label':'Tamanho', style:'width:100%;accent-color:var(--laranja)'}); let antes = false;
      i.addEventListener('input', () => { if (!antes){ lembrar(); antes = true; } cfg.zumbi.altura = +i.value; atualizarEmBreve(); }); i.addEventListener('change', () => { antes = false; painel(); });
      return el('label', {class:'campo'}, el('span', {class:'rotulo'}, `Tamanho: ${Math.round(cfg.zumbi.altura * 100)}%`), i); })(),
    cores('Cor da pele', cfg.pele, Z_PELES, v => cfg.pele = v),
    escolhas('Barriga e peito', 'zumbi.barriga', Z_BARRIGA), escolhas('Braços', 'zumbi.bracos', Z_BRACOS), escolhas('Pernas', 'zumbi.pernas', Z_PERNAS), escolhas('Cravado no ombro', 'zumbi.cravado', Z_CRAVADO)],
  sujeira: () => [nivel('Sangue', 'zumbi.sangue'), cores('Cor do sangue', cfg.zumbi.sangueCor, ['#A81E1A', '#7A1210', '#D6322A', '#3E7A22', '#2B1F4E', '#1B1B1E'], v => cfg.zumbi.sangueCor = v),
    nivel('Pele apodrecida', 'zumbi.podre'), nivel('Roupa rasgada', 'zumbi.rasgos'), el('p', {class:'dica'}, 'Escolha "Nenhum" no sangue para uma versão sem sangue, útil para publicar em redes sociais.')],
  roupa: () => {
    const conjuntos = {'':'Escolher um conjunto…', ...Object.fromEntries(Object.entries(KITS).filter(([k]) => k !== 'nada').map(([k, v]) => [k, `${GRUPOS_KITS[v.grupo]}: ${v.nome}`]))};
    const itens = [lista('Vestir um conjunto pronto', '', conjuntos, v => { if (v){ aplicarKit(cfg, v); cfg.lapis.usa = false; } }),
      lista('Roupa', cfg.roupa, Object.fromEntries(Object.entries(ROUPAS).map(([k, v]) => [k, v.nome])), v => cfg.roupa = v)];
    for (const [k, [rotulo, padrao]] of Object.entries(ROUPAS[cfg.roupa].cores))
      itens.push(cores(rotulo, cfg.cores[cfg.roupa]?.[k] || padrao, AMOSTRAS.tecido, v => { (cfg.cores[cfg.roupa] = cfg.cores[cfg.roupa] || {})[k] = v; }));
    itens.push(lista('Colete', cfg.colete.estilo, COLETES, v => cfg.colete.estilo = v), lista('Mochila', cfg.mochila.estilo, MOCHILAS, v => cfg.mochila.estilo = v));
    return itens;
  },
  exportar: () => {
    const nome = el('input', {type:'text', value:cfg.nome, maxlength:'40'});
    nome.addEventListener('input', () => { cfg.nome = nome.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'zumbi'; guardar(); });
    const arquivo = el('input', {type:'file', accept:'.json,application/json'});
    arquivo.addEventListener('change', async () => {
      const f = arquivo.files[0]; if (!f) return;
      try { const dados = JSON.parse(await f.text()); lembrar(); cfg = dados.zumbi ? garantir(dados) : infectar(validar(dados)); atualizar(); painel(); aviso(dados.zumbi ? 'Zumbi carregado.' : 'Personagem aberto e transformado em zumbi.'); }
      catch (e){ aviso('Não consegui ler esse arquivo. Escolha um .json salvo pelos criadores.'); }
    });
    const bloco = (texto, dica, fn, principal) => el('div', {class:'exporta'}, botao(texto, fn, 'acao' + (principal ? ' principal' : '')), el('p', {}, dica));
    return [el('label', {class:'campo'}, el('span', {class:'rotulo'}, 'Nome do arquivo'), nome),
      bloco('Baixar GLB (modelo 3D)', 'Leva as peças, as cores e a pose atual.', () => { baixar(`${cfg.nome}.glb`, gerarGLB(modelo, cfg), 'model/gltf-binary'); aviso('GLB gerado.'); }, true),
      bloco('Baixar OBJ + MTL (ZIP)', 'Modelo parado na pose atual.', () => { baixar(`${cfg.nome}-obj.zip`, gerarOBJ(modelo, cfg), 'application/zip'); aviso('OBJ gerado.'); }),
      bloco('Baixar imagem PNG', 'Fundo transparente, no ângulo que está na tela.', () => { baixar(`${cfg.nome}.png`, visor.imagem(2000, 2600, false), 'image/png'); aviso('PNG gerado.'); }),
      bloco('Salvar este zumbi', 'Para editar depois ou abrir no montador de cenários.', () => { baixar(`${cfg.nome}.personagem.json`, JSON.stringify(cfg, null, 2), 'application/json'); aviso('Zumbi salvo.'); }),
      el('label', {class:'campo'}, el('span', {class:'rotulo'}, 'Abrir zumbi ou personagem salvo'), arquivo)];
  },
};
/* pega um personagem comum e o transforma, mantendo rosto, cabelo e roupa */
function infectar(base){
  const c = copia(base);
  c.nome = (c.nome + '-zumbi').slice(0, 40); c.pele = misto(c.pele, '#9FAE8C', .45).toUpperCase(); c.pose = 'z_torto'; c.lapis.usa = false;
  c.zumbi = validarZumbi({...ZUMBIS.recente.z, sangue:2, rasgos:2, semente:Math.floor(Math.random() * 99999)});
  return c;
}

const NOMES_ABAS = {prontos:'Prontos', cabeca:'Cabeça', corpo:'Corpo e feridas', sujeira:'Sangue e rasgos', roupa:'Roupa', exportar:'Exportar'};
function painel(){
  const rolagem = $('#conteudo').scrollTop;
  $('#abas').replaceChildren(...Object.entries(NOMES_ABAS).map(([k, v]) => el('button', {type:'button', role:'tab', 'aria-selected':String(k === aba), class:k === aba ? 'ativo' : '', 'data-aba':k, onclick(){ aba = k; painel(); $('#conteudo').scrollTop = 0; }}, v)));
  $('#conteudo').replaceChildren(...ABAS[aba]());
  $('#conteudo').scrollTop = rolagem;
  $('#poses').value = cfg.pose;
}

$('#poses').replaceChildren(...[...POSES_ZUMBI, ...Object.keys(POSES).filter(k => !POSES_ZUMBI.includes(k))].map(k => el('option', {value:k}, POSES[k])));
$('#poses').addEventListener('change', e => { lembrar(); cfg.pose = e.target.value; atualizar(); });
document.querySelectorAll('[data-vista]').forEach(b => b.addEventListener('click', () => { const [giro, elev, dist, alvo] = b.dataset.vista.split(',').map(Number); Object.assign(visor.cam, {giro, elev, dist, alvo}); visor.desenhar(); }));
$('#sortear').addEventListener('click', sortear);
$('#desfazer').addEventListener('click', () => { if (!passado.length) return aviso('Nada para desfazer.'); cfg = garantir(JSON.parse(passado.pop())); atualizar(); painel(); });
if (!visor) $('#aviso').textContent = 'Este navegador não conseguiu abrir o visor 3D (WebGL).';
atualizar();
painel();
window.__zumbis = {visor, get cfg(){ return cfg; }, set cfg(v){ cfg = v; }, infectar, atualizar, painel};
})();
