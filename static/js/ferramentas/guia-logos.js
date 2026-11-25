/* Guia de logos: monta a lista de logos e as amostras por cor */
const LOGOS=[
  {id:"logo-horizontal",nome:"Logo horizontal",uso:"Assinatura principal: cabeçalhos, propostas, apresentações e cartão de visitas. Largura mínima 120 px."},
  {id:"wordmark",nome:"Wordmark",uso:"Versão só tipográfica (WO + nome). Para fundos com retrato próximo ou onde o rosto seria redundante."},
  {id:"monograma-wo",nome:"Monograma WO",uso:"Menor unidade da marca: favicon, menu, marca d’água e cantos de peças."},
  {id:"selo-cheio",nome:"Selo cheio",uso:"Carimbo da marca: stickers, embalagens, fecho de posts e certificados."},
  {id:"selo-linha",nome:"Selo em linha",uso:"Variação leve do selo para fundos já carregados de elementos."},
  {id:"avatar",nome:"Avatar",uso:"Foto de perfil e retrato em peças. Funciona bem em fundo laranja."},
  {id:"avatar-sem-fundo",nome:"Avatar sem fundo",uso:"Figura vazada, sem o bloco escuro atrás. Use em branco/off-white sobre fundos escuros, laranja ou azul."},
  {id:"wo-digital",nome:"WO Digital",uso:"Etiqueta da frente digital: sites, templates, produtos digitais e rodapés."}
];
const CORES=[["offwhite","t-grafite","Off-white / grafite"],["grafite","t-offwhite","Grafite / off-white"],["grafite","t-laranja","Grafite / laranja"],["offwhite","t-azul","Off-white / azul"]];
document.getElementById('logos').innerHTML=
 '<div class="sec-head"><span class="rotulo">Logos · SVG + PNG</span></div>'+
 LOGOS.map(l=>`<div class="logo-bloco"><h3 class="display h-md">${l.nome}</h3><p class="uso">${l.uso}</p><div class="amostras">`+
 CORES.map(([c,t,leg])=>`<div class="amostra"><div class="tela ${t}"><img src="/static/img/logos/${l.id}-${c}.svg" alt="${l.nome}"></div><div class="dl"><span>${leg}</span><span><a href="/static/img/logos/${l.id}-${c}.svg" download>SVG</a> · <a href="/static/img/logos/png/${l.id}-${c}.png" download>PNG</a></span></div></div>`).join('')+
 '</div></div>').join('');
