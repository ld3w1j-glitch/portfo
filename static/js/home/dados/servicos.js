/* ===== Cards dos palcos. Edite os textos aqui: [título, descrição, ícone] ===== */

export const ORDEM = ['design', 'codigo', 'imagem'];      // mesma ordem da lista Design / Código / Imagem

/* palco 1 (esfera): serviços de cada frente */
export const SERV = {
  design: [['Identidade visual', 'Logotipo, paleta e tipografia pensados para a marca funcionar em qualquer lugar.', 'camadas'],
           ['Sistema de elementos', 'Ícones, molduras e texturas que mantêm tudo consistente do cartão ao site.', 'estrela'],
           ['Peças e aplicações', 'Cartões, posts e materiais prontos para usar nas redes e no dia a dia.', 'salvar']],
  codigo: [['Sites sob medida', 'Páginas rápidas, responsivas e fáceis de manter, com a cara da sua marca.', 'internet'],
           ['Landing pages', 'Estrutura pensada para transformar visitas em contatos e orçamentos.', 'foguete'],
           ['Ferramentas e automação', 'Pequenos sistemas que economizam tempo e organizam o trabalho.', 'notebook']],
  imagem: [['Ilustração', 'Traço próprio e presença forte, do avatar ao poster.', 'pincel'],
           ['Direção de arte', 'Composição, cor e ritmo para que todas as peças tenham unidade.', 'olho'],
           ['Conteúdo social', 'Posts, carrosséis e stories com a identidade já aplicada.', 'camera']],
};

/* palco 2 (cabeça): Observo / Estruturo / Entrego */
export const SOBRE_ETAPAS = ['Observo', 'Estruturo', 'Entrego'];
export const SOBRE = [
  [['Pesquisa', 'Briefing, público e referências antes de qualquer traço.', 'olho'],
   ['Conceito', 'Uma ideia central que guia identidade, site e peças.', 'lampada'],
   ['Prioridades', 'Foco no que realmente move o resultado do negócio.', 'filtro']],
  [['Sistema visual', 'Cores, tipografia e elementos que se encaixam e escalam.', 'camadas'],
   ['Código limpo', 'Sites leves, organizados e fáceis de manter.', 'codigo'],
   ['Consistência', 'O mesmo padrão do cartão ao site e às redes sociais.', 'cubo']],
  [['Arquivos organizados', 'Logos em vetor, PNGs, fontes e um guia de uso.', 'salvar'],
   ['Etapas claras', 'Combinados e acompanhamento do início ao fim do projeto.', 'calendario'],
   ['Suporte', 'Ajustes e orientação depois da entrega.', 'chat']],
];

/* palco 3 (DNA da marca): paleta, tipografia e elementos */
export const DNA_ETAPAS = ['Paleta', 'Tipografia', 'Elementos'];
export const DNA = [
  [{cor: '#1A1A1A', t: 'Grafite',         d: 'Base escura e textos fortes · #1A1A1A'},
   {cor: '#F5F5EF', t: 'Off-white',       d: 'Respiro e contraste · #F5F5EF'},
   {cor: '#F16A32', t: 'Laranja técnico', d: 'A cor de destaque da marca · #F16A32'},
   {cor: '#365CE6', t: 'Azul digital',    d: 'Apoio para o mundo do código · #365CE6'}],
  [{glifo: 'Aa', fonte: 'Barlow Condensed', t: 'Barlow Condensed', d: 'Black, caixa-alta: títulos e impacto'},
   {glifo: 'Aa', fonte: 'Inter',            t: 'Inter',            d: 'Textos corridos e informações'},
   {glifo: '01', fonte: 'JetBrains Mono',   t: 'JetBrains Mono',   d: 'Rótulos, números e dados'}],
  [{ic: 'camadas',  t: '267 elementos',      d: 'Molduras, ícones, padrões e fundos em SVG'},
   {ic: 'cubo',     t: 'Cantos chanfrados',  d: 'A forma que assina todas as peças'},
   {ic: 'internet', t: 'Padrões e texturas', d: 'Listras, pontos, ondas e hachuras'},
   {ic: 'salvar',   t: 'Quatro cores',       d: 'Cada elemento em grafite, off-white, laranja e azul'}],
];
