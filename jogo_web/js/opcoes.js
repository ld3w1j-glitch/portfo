/* Opções do criador: estilos, cores sugeridas, roupas e os dois modelos iniciais.
   Para criar uma roupa nova, acrescente um item em ROUPAS aqui e a pintura dela em roupas.js. */
const CABELOS = {washington:'Curto com degradê', raspado:'Raspado', careca:'Careca', crespo:'Black power', topete:'Topete',
  moicano:'Moicano', longo:'Comprido', coque:'Coque'};
const BARBAS = {washington:'Contornada', cheia:'Cheia', cavanhaque:'Cavanhaque', bigode:'Só bigode', porfazer:'Por fazer', nenhuma:'Sem barba'};
const SOBRANCELHAS = {grossas:'Grossas', finas:'Finas', bravas:'Bravas', nenhuma:'Sem'};
const BOCAS = {neutra:'Neutra', sorriso:'Sorrindo', aberta:'Aberta', seria:'Séria'};
const OCULOS = {redondos:'Redondos', quadrados:'Quadrados', escuros:'Escuros', nenhum:'Sem óculos'};
const CORPOS = {masculino:'Masculino', feminino:'Feminino'};
const POSES = {descanso:'Descanso', acenando:'Acenando', andando:'Andando', apontando:'Apontando', bracos:'Braços abertos'};

const AMOSTRAS = {
  pele: ['#F1C9A5', '#DDAA80', '#C68E65', '#AE7851', '#8D5A3A', '#6B422B', '#4A2E1F', '#C9C4BC'],
  cabelo: ['#1A1210', '#3B241A', '#6B4226', '#A8743F', '#D9B26B', '#8F2F1E', '#B9B9BD', '#F16A32', '#365CE6'],
  olhos: ['#2B180F', '#5A3A1C', '#2F6E4F', '#2E5C99', '#6E737A'],
  metal: ['#B9BEC6', '#1A1A1A', '#C9A24B', '#8C4A2F', '#F16A32', '#365CE6'],
  militar: ['#4B5340', '#5F6B45', '#6F6A4C', '#8A7358', '#B49A72', '#39413A', '#1C1D1F', '#6E6A5E', '#2F3E55', '#6E4A34'],
  tecido: ['#F1F1EC', '#1A1A1A', '#3A3D45', '#F16A32', '#365CE6', '#7A1F1F', '#2F5D43', '#C9A66B', '#6E5A44', '#8E8F94'],
};

/* cores: [rótulo, valor padrão] de cada parte pintável da roupa */
const ROUPAS = {
  base:        {nome:'Só short', cores:{short:['Short', '#2E3036'], detalhe:['Cós', '#F16A32']}},
  wo:          {nome:'Camisa WO', cores:{camisa:['Camisa', '#F1F1EC'], calca:['Calça', '#2B2D33'], calcado:['Tênis', '#F16A32'], detalhe:['Cinto', '#1A1A1A']}},
  casual:      {nome:'Camiseta e jeans', cores:{camisa:['Camiseta', '#F16A32'], calca:['Jeans', '#3E5C86'], calcado:['Tênis', '#F1F1EC'], detalhe:['Estampa', '#F1F1EC']}},
  moletom:     {nome:'Moletom', cores:{camisa:['Moletom', '#365CE6'], calca:['Calça', '#2B2D33'], calcado:['Tênis', '#F1F1EC'], detalhe:['Cordões', '#F1F1EC']}},
  social:      {nome:'Social', cores:{camisa:['Paletó', '#2A2F3D'], calca:['Calça', '#2A2F3D'], calcado:['Sapato', '#1A1210'], detalhe:['Gravata', '#F16A32']}},
  oficina:     {nome:'Macacão de oficina', cores:{camisa:['Camiseta', '#C9C4BC'], calca:['Macacão', '#3C5A78'], calcado:['Bota', '#5A3F2A'], detalhe:['Fivelas', '#C9A24B']}},
  sobrevivente:{nome:'Sobrevivente', cores:{camisa:['Jaqueta', '#59503F'], calca:['Calça', '#3B4149'], calcado:['Bota', '#4A3426'], detalhe:['Camisa de baixo', '#C9C0AC']}},
  soldado:     {nome:'Soldado', cores:{camisa:['Farda', '#9C8265'], calca:['Calça', '#9C8265'], calcado:['Coturno', '#7B6047'], detalhe:['Equipamento', '#39413A']}},
};

const PADRAO_WASHINGTON = {
  nome:'washington', corpo:'masculino', pele:'#AE7851',
  cabelo:{estilo:'washington', cor:'#1A1210'}, barba:{estilo:'washington', cor:'#211713'},
  sobrancelha:{estilo:'grossas', cor:'#1D1310'}, olhos:'#2B180F', boca:'neutra',
  oculos:{estilo:'redondos', cor:'#B9BEC6'},
  roupa:'wo', cores:{},
  chapeu:{estilo:'nenhum', cor:'#5F6B45', camo:false, visao:true, fones:false, goggles:false}, mascara:{usa:false, cor:'#6E6A5E'},
  colete:{estilo:'nenhum', cor:'#4B5340', camo:false}, mochila:{estilo:'nenhum', cor:'#6F6A4C', camo:false},
  cinto:{usa:false, cor:'#55523A'}, bolsaPerna:{usa:false}, joelheiras:{usa:false, cor:'#39413A'}, cotoveleiras:{usa:false},
  luvas:{estilo:'nenhum', cor:'#39413A'}, lapis:{usa:true, cor:'#F16A32'},
  facial:{estilo:'nenhum', cor:'#1B1C20'}, ombreiras:{usa:false}, emblema:{estilo:'nenhum'}, cinturao:{usa:false}, tonfa:{usa:false}, escudo:{usa:false},
  pose:'descanso',
};
const PADRAO_LIMPO = Object.assign(structuredClone(PADRAO_WASHINGTON), {
  nome:'boneco', pele:'#C9C4BC',
  cabelo:{estilo:'careca', cor:'#1A1210'}, barba:{estilo:'nenhuma', cor:'#211713'},
  sobrancelha:{estilo:'finas', cor:'#6E6A66'}, olhos:'#2B180F',
  oculos:{estilo:'nenhum', cor:'#B9BEC6'}, roupa:'base',
  lapis:{usa:false, cor:'#F16A32'},
});
const PADRAO_FEMININO = Object.assign(structuredClone(PADRAO_WASHINGTON), {
  nome:'personagem-feminina', corpo:'feminino', pele:'#AE7851',
  cabelo:{estilo:'rabo', cor:'#1A1210'}, barba:{estilo:'nenhuma', cor:'#211713'},
  sobrancelha:{estilo:'finas', cor:'#1D1310'}, olhos:'#2B180F',
  oculos:{estilo:'nenhum', cor:'#B9BEC6'}, roupa:'casual',
  lapis:{usa:false, cor:'#F16A32'},
});
