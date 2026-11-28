/* Conjuntos prontos: roupa, cores, chapéu e equipamentos. Não mexem no rosto, no cabelo nem nos óculos.
   Para criar um: conjunto('id', 'grupo', 'Nome', 'roupa', {cores da roupa}, {o que vai junto}).
   Tudo o que não for citado fica desligado. */
const GRUPOS_KITS = {militar:'Militares', sobrevivencia:'Sobrevivência', gangues:'Gangues', profissao:'Profissões', dia:'Dia a dia'};
const KITS = {};

function conjunto(id, grupo, nome, roupa, cores, extras = {}){
  const muda = {
    roupa,
    chapeu:{estilo:'nenhum', camo:false, visao:false, fones:false, goggles:false},
    mascara:{usa:false}, colete:{estilo:'nenhum', camo:false}, mochila:{estilo:'nenhum', camo:false},
    cinto:{usa:false}, bolsaPerna:{usa:false}, joelheiras:{usa:false}, cotoveleiras:{usa:false},
    luvas:{estilo:'nenhum'}, lapis:{usa:false}, facial:{estilo:'nenhum'}, ombreiras:{usa:false}, emblema:{estilo:'nenhum'},
  };
  for (const [k, v] of Object.entries(extras)) Object.assign(muda[k] || (muda[k] = {}), v);
  KITS[id] = {grupo, nome, cores, muda};
}
/* atalhos para escrever os conjuntos em poucas linhas */
const na_cabeca = (estilo, cor, mais = {}) => ({estilo, cor, ...mais});
const veste = (estilo, cor, camo = false) => ({estilo, cor, camo});
const usa = cor => cor ? {usa:true, cor} : {usa:true};
const luva = (estilo, cor) => ({estilo, cor});
const tecido = (camisa, calca, calcado, detalhe) => ({camisa, calca, calcado, detalhe});

/* ================================================== militares */
conjunto('soldado', 'militar', 'Soldado completo', 'soldado', null, {
  chapeu:na_cabeca('tatico', '#8A7358', {camo:true, visao:true, fones:true}), colete:veste('tatico', '#6F6A4C'), mochila:veste('militar', '#65603F', true),
  cinto:usa('#55523A'), bolsaPerna:usa(), joelheiras:usa('#39413A'), cotoveleiras:usa(), luvas:luva('taticas', '#3B3F36')});
conjunto('patrulha', 'militar', 'Patrulha leve', 'soldado', null, {
  chapeu:na_cabeca('selva', '#5F6B45', {camo:true}), colete:veste('assalto', '#4B5340'), mochila:veste('urbana', '#4B5340', true),
  cinto:usa('#39413A'), joelheiras:usa('#39413A'), luvas:luva('simples', '#39413A'), mascara:usa('#6E6A5E')});
conjunto('noturno', 'militar', 'Operação noturna', 'soldado', tecido('#2B2F36', '#262A30', '#17181B', '#101114'), {
  chapeu:na_cabeca('tatico', '#25282D', {visao:true, fones:true}), colete:veste('tatico', '#1F2226'), mochila:veste('urbana', '#23262B'),
  cinto:usa('#1C1D1F'), bolsaPerna:usa(), joelheiras:usa('#1C1D1F'), cotoveleiras:usa(), luvas:luva('taticas', '#1C1D1F'), mascara:usa('#1C1D1F')});
conjunto('selva', 'militar', 'Combate na selva', 'soldado', tecido('#556B38', '#4C6032', '#4A3A28', '#2E3624'), {
  chapeu:na_cabeca('combate', '#4F6334', {camo:true}), colete:veste('assalto', '#3F4F2C', true), mochila:veste('militar', '#46562F', true),
  cinto:usa('#33402A'), bolsaPerna:usa(), joelheiras:usa('#2E3624'), luvas:luva('simples', '#2E3624')});
conjunto('deserto', 'militar', 'Deserto', 'soldado', tecido('#C9AC7C', '#BDA072', '#9C7C54', '#6E5C40'), {
  chapeu:na_cabeca('combate', '#BCA074', {camo:true, goggles:true}), colete:veste('tatico', '#A88E64'), mochila:veste('militar', '#9C835B', true),
  cinto:usa('#8A7358'), joelheiras:usa('#6E5C40'), cotoveleiras:usa(), luvas:luva('taticas', '#7B6544'), mascara:usa('#D2BC90')});
conjunto('neve', 'militar', 'Neve', 'soldado', tecido('#D9DEE3', '#CBD2D9', '#8A9099', '#6B737D'), {
  chapeu:na_cabeca('tatico', '#D5DBE1', {camo:true, goggles:true, fones:true}), colete:veste('tatico', '#B9C1C9', true), mochila:veste('expedicao', '#C4CBD2', true),
  cinto:usa('#8A9099'), joelheiras:usa('#6B737D'), luvas:luva('taticas', '#5A616A'), mascara:usa('#E8ECEF')});
conjunto('socorrista', 'militar', 'Socorrista de campo', 'soldado', tecido('#6F7452', '#666B4B', '#4A3A28', '#8C2A22'), {
  chapeu:na_cabeca('combate', '#6F7452'), colete:veste('assalto', '#8C2A22'), mochila:veste('militar', '#8C2A22'),
  cinto:usa('#55523A'), bolsaPerna:usa(), joelheiras:usa('#39413A'), luvas:luva('simples', '#E4E0D6')});
conjunto('recruta', 'militar', 'Recruta em treino', 'casual', tecido('#5F6B45', '#4B5340', '#3B2E22', '#C9C4A8'), {
  chapeu:na_cabeca('bone', '#5F6B45'), cinto:usa('#39413A')});

/* ================================================== sobrevivência (apocalipse zumbi) */
conjunto('sobrevivente', 'sobrevivencia', 'Sobrevivente equipado', 'sobrevivente', null, {
  chapeu:na_cabeca('gorro', '#6E4A34'), colete:veste('improvisado', '#59503F'), mochila:veste('expedicao', '#6E5A44'),
  cinto:usa('#5A4330'), joelheiras:usa('#4A4036'), luvas:luva('taticas', '#4A3426'), lapis:usa()});
conjunto('primeiro_dia', 'sobrevivencia', 'Primeiro dia', 'wo', tecido('#DAD6C8', '#2F3138', '#C8612F', '#1A1A1A'), {
  mochila:veste('urbana', '#3A3D45'), lapis:usa()});
conjunto('batedor', 'sobrevivencia', 'Batedor', 'jaqueta_jeans', tecido('#47554A', '#3B3F45', '#4A3426', '#6E6A5E'), {
  chapeu:na_cabeca('bone_virado', '#39413A'), mochila:veste('urbana', '#5C5340'), cinto:usa('#4A3426'), bolsaPerna:usa(),
  joelheiras:usa('#39413A'), luvas:luva('simples', '#39413A'), mascara:usa('#7A2E24')});
conjunto('mecanico', 'sobrevivencia', 'Mecânico do refúgio', 'oficina', tecido('#9C968A', '#4C5560', '#4A3426', '#C9A24B'), {
  chapeu:na_cabeca('bone', '#7A2E24'), cinto:usa('#5A4330'), joelheiras:usa('#4A4036'), luvas:luva('taticas', '#5A4330'), lapis:usa()});
conjunto('saqueador', 'sobrevivencia', 'Saqueador', 'couro', tecido('#2E241E', '#3A3630', '#241C16', '#6B5A48'), {
  chapeu:na_cabeca('bandana', '#7A2E24'), colete:veste('improvisado', '#4A3A2A'), mochila:veste('improvisada', '#5A4C3A'),
  cinto:usa('#3A2B1E'), joelheiras:usa('#2E2620'), cotoveleiras:usa(), luvas:luva('taticas', '#2A1E16'), mascara:usa('#2B2D33')});
conjunto('enfermagem', 'sobrevivencia', 'Equipe de saúde', 'medico', tecido('#E4E1D6', '#46586E', '#C9C4B8', '#5E9C90'), {
  mochila:veste('urbana', '#8C2A22'), cinto:usa('#55523A'), luvas:luva('simples', '#7FB8C9'), mascara:usa('#9CCBD6')});
conjunto('cacador', 'sobrevivencia', 'Caçador da mata', 'xadrez', tecido('#4F5A32', '#5A4C38', '#4A3426', '#241F18'), {
  chapeu:na_cabeca('cowboy', '#5A4630'), colete:veste('assalto', '#5A4C38'), mochila:veste('expedicao', '#4B5340', true),
  cinto:usa('#4A3426'), bolsaPerna:usa(), luvas:luva('simples', '#4A3426')});
conjunto('guarda', 'sobrevivencia', 'Guarda do refúgio', 'sobrevivente', tecido('#3E4650', '#2F333A', '#1F1A16', '#8E8F94'), {
  chapeu:na_cabeca('obra', '#C4742E'), colete:veste('improvisado', '#3E4650'), cinto:usa('#2B2D33'),
  joelheiras:usa('#2B2D33'), cotoveleiras:usa(), luvas:luva('taticas', '#2B2D33')});

/* ================================================== profissões */
conjunto('obra', 'profissao', 'Construção', 'refletivo', null, {
  chapeu:na_cabeca('obra', '#E2B23A'), cinto:usa('#6E4A34'), luvas:luva('simples', '#C9A66B'), joelheiras:usa('#39413A')});
conjunto('entregas', 'profissao', 'Entregas', 'refletivo', tecido('#2F3138', '#2B2D33', '#26262A', '#E8641E'), {
  chapeu:na_cabeca('bone', '#E8641E'), mochila:veste('urbana', '#E8641E'), luvas:luva('simples', '#26262A')});
conjunto('chef', 'profissao', 'Chef de cozinha', 'cozinheiro', null, {chapeu:na_cabeca('chef', '#F1F1EC')});
conjunto('doutor', 'profissao', 'Consultório', 'medico', null);
conjunto('oficina', 'profissao', 'Oficina', 'oficina', null, {chapeu:na_cabeca('bone_virado', '#365CE6'), luvas:luva('simples', '#6E5A44'), lapis:usa()});
conjunto('escritorio', 'profissao', 'Escritório', 'social', null);
conjunto('programador', 'profissao', 'Programando', 'moletom', tecido('#26282E', '#3A3D45', '#F1F1EC', '#F16A32'), {chapeu:na_cabeca('fone_musica', '#1A1A1A')});
conjunto('designer', 'profissao', 'Designer WO', 'wo', null, {lapis:usa('#F16A32')});
conjunto('fazenda', 'profissao', 'Fazenda', 'xadrez', tecido('#2F5F7A', '#6E5A38', '#5A3F2A', '#D9C9A0'), {
  chapeu:na_cabeca('palha', '#7A1F1F'), cinto:usa('#6E4A34'), luvas:luva('simples', '#8A6A44')});

/* ================================================== dia a dia */
conjunto('casual', 'dia', 'Casual', 'casual', null);
conjunto('passeio', 'dia', 'Passeio', 'polo', null, {chapeu:na_cabeca('bone', '#C9A66B')});
conjunto('inverno', 'dia', 'Frio', 'listrado', null, {chapeu:na_cabeca('gorro', '#7A1F1F'), luvas:luva('simples', '#2B2D33')});
conjunto('trilha', 'dia', 'Trilha', 'regata', tecido('#F16A32', '#5F6B45', '#6E4A34', '#F1F1EC'), {
  chapeu:na_cabeca('selva', '#B49A72'), mochila:veste('expedicao', '#2F5D43'), cinto:usa('#5A4330')});
conjunto('praia', 'dia', 'Praia', 'praia', null, {chapeu:na_cabeca('palha', '#365CE6')});
conjunto('academia', 'dia', 'Corrida', 'agasalho', null, {chapeu:na_cabeca('fone_musica', '#F16A32')});
conjunto('futebol', 'dia', 'Futebol', 'futebol', null);
conjunto('estilo', 'dia', 'Noite na cidade', 'couro', null);
conjunto('rua', 'dia', 'Estilo de rua', 'jaqueta_jeans', null, {chapeu:na_cabeca('bone_virado', '#1A1A1A'), mochila:veste('urbana', '#2B2D33')});
conjunto('gala', 'dia', 'Festa de gala', 'social', tecido('#17181C', '#17181C', '#0F0F10', '#7A1F1F'), {chapeu:na_cabeca('cartola', '#17181C')});
conjunto('sertao', 'dia', 'Caubói', 'xadrez', tecido('#9C5A2E', '#3E5C86', '#6E4A34', '#F1E4C8'), {chapeu:na_cabeca('cowboy', '#6E4A34'), cinto:usa('#5A3A22')});
conjunto('dormir', 'dia', 'Hora de dormir', 'pijama', null);

/* ================================================== gangues (todas inventadas para o jogo) */
/* roupa gasta de quem vive na rua: tecido desbotado, sujeira, remendos, rasgos e chinelo */
roupa('surrado', 'Roupa surrada', base4('Camiseta', '#8B8576', 'Calça', '#4F4A42', 'Chinelo', '#3A3D45', 'Remendos', '#6E4A34'), p => {
  if (ehPe(p.peca)){ if (p.k === 0) return 'calcado'; return (p.k === p.tam[2] - 2 && ruido(`ch${p.i},${p.j}`) < 40) ? 'calcado_escuro' : null; }
  /* manchas grandes de sujeira (2 x 2 blocos) e alguns remendos */
  const sujo = m => {
    const h = ruido(`suj|${p.peca}|${(p.i + p.j) >> 1},${p.k >> 1}`);
    if (h < 7) return 'detalhe';
    return h < 27 ? m + '_escuro' : h < 36 ? m + '_sombra' : m;
  };
  if (p.peca === 'quadril') return cos(p) ? 'faixa_sombra' : sujo('calca');                       /* cordão no lugar do cinto */
  if (ehCoxa(p.peca)) return (p.peca === 'coxa_e' && p.frente && (p.topo === 8 || p.topo === 9)) ? null : sujo('calca');
  if (ehCanela(p.peca)){
    if (p.k <= (p.peca === 'canela_d' ? 4 : 2)) return (p.k === (p.peca === 'canela_d' ? 4 : 2) && ruido(`barra${p.i},${p.j}`) < 55) ? 'calca_escuro' : null;  /* barra desfiada, cada perna num tamanho */
    return sujo('calca');
  }
  if (p.peca === 'cintura'){
    if (p.k === 0 && ruido(`bainha${p.i},${p.j}`) < 35) return null;
    return (p.frente && p.i >= p.tam[0] - 3 && p.k >= 1 && p.k <= 2) ? null : sujo('camisa');      /* rasgo do lado */
  }
  if (p.peca === 'torax') return golaV(p, 2.4) ? null : sujo('camisa');
  if (ehBraco(p.peca)){
    const fim = p.peca === 'braco_d' ? 8 : 5;                                                     /* uma manga rasgada mais curta */
    return p.topo < fim && !(p.topo === fim - 1 && ruido(`manga${p.i},${p.j}`) < 45) ? sujo('camisa') : null;
  }
  return null;
});

/* Turma do Viaduto: grupo de rua */
conjunto('viaduto_andarilho', 'gangues', 'Viaduto: andarilho', 'surrado', null, {
  chapeu:na_cabeca('gorro', '#4A4036'), mochila:veste('improvisada', '#6A5E48')});
conjunto('viaduto_catador', 'gangues', 'Viaduto: catador', 'surrado', tecido('#7C6A52', '#3E4650', '#7A2E24', '#9C968A'), {
  chapeu:na_cabeca('bone_virado', '#6E6A5E'), mochila:veste('improvisada', '#7C7466'), cinto:usa('#5A4330'), luvas:luva('simples', '#4A4036')});
conjunto('viaduto_vigia', 'gangues', 'Viaduto: vigia', 'surrado', tecido('#4E5560', '#5A4C38', '#26262A', '#8F6B4A'), {
  chapeu:na_cabeca('bandana', '#5A5348'), mascara:usa('#6E6A5E'), luvas:luva('simples', '#3A332C')});

/* Turma do Beco: gangue de bairro, de moletom e boné */
conjunto('beco_lider', 'gangues', 'Beco: líder', 'moletom', tecido('#4B2E6B', '#25262B', '#F1F1EC', '#E6D24A'), {
  chapeu:na_cabeca('bone_virado', '#4B2E6B'), cinto:usa('#1C1D1F'), bolsaPerna:usa(), luvas:luva('simples', '#1C1D1F')});
conjunto('beco_olheiro', 'gangues', 'Beco: olheiro', 'agasalho', tecido('#4B2E6B', '#25262B', '#F1F1EC', '#E6D24A'), {
  chapeu:na_cabeca('bone', '#25262B'), mochila:veste('urbana', '#4B2E6B')});

/* Corvos do Asfalto: motoqueiros de couro */
conjunto('corvos_chefe', 'gangues', 'Corvos: chefe', 'couro', tecido('#17171A', '#24262B', '#101012', '#7A2E24'), {
  chapeu:na_cabeca('bandana', '#17171A'), colete:veste('assalto', '#1C1D1F'), cinto:usa('#101012'),
  joelheiras:usa('#17171A'), cotoveleiras:usa(), luvas:luva('taticas', '#17171A')});
conjunto('corvos_piloto', 'gangues', 'Corvos: piloto', 'couro', tecido('#241F1C', '#3E5C86', '#1A1210', '#9C968A'), {
  chapeu:na_cabeca('obra', '#17171A'), cinto:usa('#241F1C'), cotoveleiras:usa(), joelheiras:usa('#241F1C'), luvas:luva('taticas', '#241F1C'), mascara:usa('#7A2E24')});

/* Sucateiros: armadura de ferro-velho */
conjunto('sucata_chefe', 'gangues', 'Sucateiros: chefe', 'sobrevivente', tecido('#6B4A2A', '#3A342C', '#2A1E16', '#C9772E'), {
  chapeu:na_cabeca('combate', '#8F4A2A', {goggles:true}), colete:veste('improvisado', '#6B4A2A'), mochila:veste('improvisada', '#5A4C3A'),
  cinto:usa('#4A3426'), joelheiras:usa('#8F4A2A'), cotoveleiras:usa(), luvas:luva('taticas', '#3A2B1E'), mascara:usa('#C9772E')});
conjunto('sucata_soldador', 'gangues', 'Sucateiros: soldador', 'oficina', tecido('#5A4C3A', '#4A4036', '#2A1E16', '#8D9299'), {
  chapeu:na_cabeca('obra', '#8F4A2A'), colete:veste('improvisado', '#5A4C3A'), cinto:usa('#3A2B1E'), joelheiras:usa('#3A342C'), luvas:luva('taticas', '#6E4A34')});

/* Coiotes da Estrada: saqueadores de terra seca */
conjunto('coiotes_rastreador', 'gangues', 'Coiotes: rastreador', 'xadrez', tecido('#A8743F', '#6E5A38', '#5A3F2A', '#3A2418'), {
  chapeu:na_cabeca('cowboy', '#8A6A44'), colete:veste('assalto', '#7A5C38'), mochila:veste('urbana', '#8A6A44'),
  cinto:usa('#5A3F2A'), bolsaPerna:usa(), luvas:luva('simples', '#5A3F2A'), mascara:usa('#C9AC7C')});

/* Mascarados: grupo silencioso, todo coberto */
conjunto('mascarados_sombra', 'gangues', 'Mascarados: sombra', 'moletom', tecido('#1B1D22', '#17181C', '#101012', '#55585F'), {
  chapeu:na_cabeca('gorro', '#17181C'), mascara:usa('#D8D5CC'), cinto:usa('#101012'), luvas:luva('taticas', '#101012')});
conjunto('mascarados_porteiro', 'gangues', 'Mascarados: porteiro', 'couro', tecido('#26282E', '#1F2024', '#101012', '#55585F'), {
  chapeu:na_cabeca('combate', '#26282E'), colete:veste('tatico', '#1F2226'), mascara:usa('#D8D5CC'), joelheiras:usa('#17181C'), cotoveleiras:usa(), luvas:luva('taticas', '#101012')});

/* retira só os equipamentos: a roupa e as cores continuam */
KITS.nada = {grupo:null, nome:'Tirar equipamentos', muda:{chapeu:{estilo:'nenhum'}, colete:{estilo:'nenhum'}, mochila:{estilo:'nenhum'}, cinto:{usa:false},
  bolsaPerna:{usa:false}, joelheiras:{usa:false}, cotoveleiras:{usa:false}, luvas:{estilo:'nenhum'}, mascara:{usa:false}}};

function aplicarKit(c, id){
  const kit = KITS[id];
  for (const [k, v] of Object.entries(kit.muda)){ if (typeof v === 'object') Object.assign(c[k], v); else c[k] = v; }
  if (kit.muda.roupa){                                   /* cores do conjunto; sem cores próprias, voltam as originais */
    if (kit.cores) c.cores[kit.muda.roupa] = {...kit.cores};
    else delete c.cores[kit.muda.roupa];
  }
}
