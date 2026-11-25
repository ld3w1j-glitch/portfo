/* ===== Filme de apresentação =====
   Os arquivos ficam em static/filme/. Edite os tempos (em segundos) e os nomes dos capítulos aqui. */
import { ESTATICO } from '../config.js';

export const FILMES = {
  h: {src: `${ESTATICO}/filme/apresentacao-h.mp4`, poster: `${ESTATICO}/filme/poster-h.jpg`, vertical: false,
      caps: [[0, 'Abertura'], [4.5, 'Três frentes'], [10, 'Avatar'], [15, 'Jeito de trabalhar'], [20.5, 'DNA da marca'], [26.5, 'Lab'], [31.5, 'Alcance'], [36.5, 'Fechamento']]},
  v: {src: `${ESTATICO}/filme/apresentacao-v.mp4`, poster: `${ESTATICO}/filme/poster-v.jpg`, vertical: true,
      caps: [[0, 'Abertura'], [3.5, 'Três frentes'], [8.5, 'DNA da marca'], [12, 'Fechamento']]},
};
