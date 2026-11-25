/* Página inicial: ponto de entrada. Cada módulo cuida de uma parte:
     config.js     caminhos, sequências de vídeo, preferências
     sequencia.js  carrega os quadros dos vídeos
     palco.js      seções "pinadas" guiadas pelo scroll
     cena.js       fundos animados e loops (Plus, HUD, terreno, globo)
     projetos.js   grade e filtros do portfólio
     cartas.js     cards que aparecem em cada palco
     filme.js      player do filme de apresentação
     dados/        textos e listas editáveis */
import { Cena } from './cena.js';
import { montarTodasAsCartas } from './cartas.js';
import { iniciarFilme } from './filme.js';
import { criarPalcos } from './palco.js';
import { iniciarProjetos } from './projetos.js';

const cena = new Cena();
const palcos = criarPalcos({esf: cena.seqs.esfera, cab: cena.seqs.cabeca, dna: cena.seqs.dna});

iniciarProjetos(cena.alvos);        // a grade muda a altura da página: recalcula o scroll ao filtrar
montarTodasAsCartas(palcos);
iniciarFilme();
cena.iniciar(palcos);
