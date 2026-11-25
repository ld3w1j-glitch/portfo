/* ================= EDITE AQUI: seus projetos =================
   cat: "design" | "codigo" | "imagem"
   img: caminho de imagem opcional (ex.: "/static/img/projetos/projeto1.jpg"). Sem img, a capa usa o padrão da marca.
   link: URL do case (opcional)
   destaque: true ocupa 2 colunas */
export const PROJETOS = [
  {titulo: 'Projeto exemplo 01', cat: 'design', ano: 2025, desc: 'Identidade visual completa: logotipo, paleta e aplicações.', destaque: true},
  {titulo: 'Projeto exemplo 02', cat: 'codigo', ano: 2025, desc: 'Site institucional responsivo com painel simples.'},
  {titulo: 'Projeto exemplo 03', cat: 'imagem', ano: 2024, desc: 'Série de ilustrações para campanha digital.'},
  {titulo: 'Projeto exemplo 04', cat: 'codigo', ano: 2024, desc: 'Landing page de alta conversão.'},
  {titulo: 'Projeto exemplo 05', cat: 'design', ano: 2024, desc: 'Sistema de selos, avatares e papelaria.'},
  {titulo: 'Projeto exemplo 06', cat: 'imagem', ano: 2023, desc: 'Poster e capas para redes sociais.', destaque: true},
];

export const CATS = {todos: 'Todos', design: 'Design', codigo: 'Código', imagem: 'Imagem'};

/* arte de cada categoria: ícone + padrão de fundo + cor do traço (tudo da biblioteca de elementos) */
export const ARTE = {
  design: {ico: 'pincel', padrao: 'listras-medias',     cor: 'grafite'},
  codigo: {ico: 'codigo', padrao: 'pontos-escalonados', cor: 'offwhite'},
  imagem: {ico: 'camera', padrao: 'linhas-verticais',   cor: 'grafite'},
};
