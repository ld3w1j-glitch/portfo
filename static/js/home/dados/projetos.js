/* ================= EDITE AQUI: seus projetos =================
   cat: "design" | "codigo" | "imagem"
   img: caminho de imagem opcional (ex.: "/static/img/projetos/projeto1.jpg"). Sem img, a capa usa o padrão da marca.
   link: URL do case (opcional)
   destaque: true ocupa 2 colunas */
export const PROJETOS = [
  {titulo: 'Gerador de mundo', cat: 'codigo', ano: 2026, desc: 'Cenário em voxel de um jogo em desenvolvimento, com casas e territórios.', img: '/static/acervo/capas/mundo.webp', link: '/acervo#mundo', destaque: true},
  {titulo: 'Identidade visual WO', cat: 'design', ano: 2026, desc: 'Logotipos, cores, tipografia e manual da marca.', img: '/static/acervo/capas/marca.webp', link: '/acervo#identidade'},
  {titulo: 'Site portfólio', cat: 'codigo', ano: 2026, desc: 'Site em Python e Flask com animações e personagem 3D.', img: '/static/acervo/capas/site.webp', link: '/acervo#site'},
  {titulo: 'Gerador de peças', cat: 'design', ano: 2026, desc: 'Ferramenta para montar peças com a biblioteca de elementos da marca.', img: '/static/acervo/capas/pecas.webp', link: '/acervo#pecas'},
  {titulo: 'Simulador da reforma', cat: 'codigo', ano: 2026, desc: 'Estimativa educativa do efeito da CBS e do IBS.', img: '/static/acervo/capas/simulador.webp', link: '/acervo#simulador'},
  {titulo: 'Reels em voxel', cat: 'imagem', ano: 2026, desc: 'Vídeos verticais com meu personagem, do roteiro ao som.', img: '/static/acervo/capas/reels.webp', link: '/acervo#reels', destaque: true},
  {titulo: 'Personagem e cenários 3D', cat: 'imagem', ano: 2026, desc: 'Meu personagem e meu quarto de trabalho em blocos.', img: '/static/acervo/capas/voxel.webp', link: '/acervo#voxel'},
  {titulo: 'Criadores do jogo', cat: 'codigo', ano: 2026, desc: 'Programas para criar personagens, cenários e zumbis.', img: '/static/acervo/capas/criadores.webp', link: '/acervo#criadores', destaque: true},
  {titulo: 'Garagem de veículos', cat: 'imagem', ano: 2026, desc: 'Carros, motos e bicicletas em voxel.', img: '/static/acervo/capas/garagem.webp', link: '/acervo#garagem'},
];

export const CATS = {todos: 'Todos', design: 'Design', codigo: 'Código', imagem: 'Imagem'};

/* arte de cada categoria: ícone + padrão de fundo + cor do traço (tudo da biblioteca de elementos) */
export const ARTE = {
  design: {ico: 'pincel', padrao: 'listras-medias',     cor: 'grafite'},
  codigo: {ico: 'codigo', padrao: 'pontos-escalonados', cor: 'offwhite'},
  imagem: {ico: 'camera', padrao: 'linhas-verticais',   cor: 'grafite'},
};
