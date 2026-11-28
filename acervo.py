"""Acervo: tudo o que já foi desenvolvido, mostrado em /acervo.

Para incluir um projeto novo, acrescente um item em PROJETOS (e, se ele também deve aparecer
na página inicial, um cartão em static/js/home/dados/projetos.js apontando para /acervo#id).
Imagens e vídeos ficam em static/acervo/. Caminhos de "fotos" e "videos" são relativos a essa pasta.
"""

GRUPOS = [
    ("marca", "Marca e design"),
    ("web", "Sites e sistemas"),
    ("video", "Vídeo e 3D"),
    ("jogo", "Jogo em desenvolvimento"),
]


def _p(id_, grupo, titulo, resumo, itens, fotos=(), videos=(), links=(), situacao=""):
    return {"id": id_, "grupo": grupo, "titulo": titulo, "resumo": resumo, "itens": list(itens),
            "fotos": list(fotos), "videos": list(videos), "links": list(links), "situacao": situacao, "ano": 2026}


PROJETOS = [
    # ---------- marca e design ----------
    _p("identidade", "marca", "Identidade visual WO",
       "A minha marca pessoal: logotipos, cores, tipografia, forma e regras de uso.",
       ["Manual da marca em 25 quadros, com versão em PDF", "Família de logos e guia de aplicação",
        "Cores e fontes definidas em um só lugar e usadas no site inteiro"],
       fotos=[("marca.webp", "Capa da marca")],
       links=[("Abrir o manual", "manual"), ("Guia de logos", "guia")]),
    _p("pecas", "marca", "Gerador de peças e biblioteca de elementos",
       "Ferramentas para montar peças da marca no navegador, sem redesenhar tudo a cada vez.",
       ["267 elementos gráficos em 4 cores, num total de 1.069 SVGs",
        "Modelos de publicações e de vídeo em vários formatos, com fundo transparente",
        "Modelos com o personagem, o notebook e o quarto em 3D"],
       fotos=[("gerador.webp", "Tela do gerador")],
       links=[("Abrir o gerador", "gerador"), ("Ver a biblioteca", "biblioteca")]),

    # ---------- sites e sistemas ----------
    _p("site", "web", "Site portfólio",
       "Este site, feito em Python com Flask, com um arquivo por seção e testes automáticos.",
       ["Animações ligadas à rolagem da página", "Seção do personagem 3D que gira ao arrastar",
        "Fontes e vídeos hospedados junto com o site"],
       fotos=[("site-home.webp", "Abertura do site")]),
    _p("simulador", "web", "Simulador da reforma tributária",
       "Ferramenta educativa para simular o efeito da CBS e do IBS num negócio. As contas são estimativas.",
       ["Simulador para o empresário", "Painel para o contador", "Nota fiscal de exemplo"],
       fotos=[("site-simulador.webp", "Tela do simulador")],
       links=[("Abrir o simulador", "simulador")]),

    # ---------- vídeo e 3D ----------
    _p("reels", "video", "Reels em voxel",
       "Vídeos verticais com o meu personagem, do roteiro ao som. Cenários no Blender e textos no HyperFrames.",
       ["Roteiro e aprovação das cenas antes da montagem", "Voz gerada por inteligência artificial"],
       videos=[("reels3-quem-sou", "Prazer, sou o Washington"),
               ("reels4-pedidos", "Onde está aquele pedido?"),
               ("reels5-primeira-impressao", "O que o cliente vê antes de falar com você?")]),
    _p("voxel", "video", "Personagem e cenários em voxel",
       "Eu, o meu quarto de trabalho e os objetos do dia a dia, montados em blocos.",
       ["Personagem com expressões, mãos e pernas articuladas", "Poses e giro completo usados no site",
        "Quarto de trabalho, itens de escritório e notebook"],
       fotos=[("quarto.webp", "Meu quarto de trabalho"), ("escritorio.webp", "Cena de escritório"),
              ("personagem-expressoes.webp", "Expressões"), ("personagem-corpo.webp", "Novo corpo, em estudo")]),

    # ---------- jogo ----------
    _p("criadores", "jogo", "Criadores de personagem, cenário e zumbi",
       "Programas próprios, que rodam no navegador, para criar as peças do jogo. Funcionam melhor no computador.",
       ["Personagem com 21 cortes de cabelo, 21 roupas, óculos, chapéus e equipamentos",
        "Montador de cenários com casas, natureza, rua, móveis e veículos",
        "15 zumbis prontos e sorteio de novos", "Exportação em 3D e em imagem"],
       fotos=[("conjuntos-dia.webp", "Roupas do dia a dia"), ("conjuntos-sobrevivencia.webp", "Sobrevivência"),
              ("conjuntos-militar.webp", "Militares"), ("faccoes.webp", "Grupos fictícios do jogo"),
              ("zumbis-prontos.webp", "Zumbis"), ("itens.webp", "Itens de cenário"),
              ("exemplo-horda.webp", "Horda na rua"), ("exemplo-esquina.webp", "Esquina abandonada"),
              ("exemplo-acampamento.webp", "Acampamento")],
       links=[("Criar personagem", "jogo", "index.html"), ("Criar zumbi", "jogo", "zumbis.html"),
              ("Montar cenário", "jogo", "cenario.html"), ("Todas as ferramentas", "jogo")],
       situacao="Em desenvolvimento"),
    _p("garagem", "jogo", "Garagem de veículos",
       "Carros, motos e bicicletas em voxel, montados em partes separadas.",
       ["6 tipos de carro com base, carroceria e rodas", "Estados inteiro, abandonado e destruído",
        "Motos, bicicletas, ferrugem e armaduras de apocalipse"],
       fotos=[("carros-na-rua-enferrujado.webp", "Carro enferrujado na rua"), ("carros-estados.webp", "Estados"),
              ("blindados.webp", "Armaduras"), ("motos.webp", "Motos"), ("bicicletas.webp", "Bicicletas")],
       links=[("Abrir a garagem", "jogo", "garagem.html")],
       situacao="Em desenvolvimento"),
    _p("mundo", "jogo", "Gerador de mundo e territórios",
       "O cenário de um jogo de sobrevivência num apocalipse zumbi, inspirado num bairro de Pouso Alegre, em Minas Gerais. "
       "As casas são inventadas.",
       ["Área de 2 × 2 km com relevo, ruas e água, e editor de terreno",
        "Mais de 1.600 casas, muitas com cômodos em que dá para entrar",
        "Passeio, fachadas, plantas, postes e carros abandonados",
        "Zonas com dono, para a disputa de território",
        "Primeiro teste no Unity: caminhada pelo bairro funcionando"],
       fotos=[("povo-rua.webp", "O bairro"), ("povo-bairro.webp", "Visto do alto"),
              ("povo-caminhando.webp", "Caminhando"), ("interior-caminhando.webp", "Dentro das casas"),
              ("interior-sem-telhado.webp", "Sem os telhados"), ("territorios-bairro.webp", "Zonas e territórios"),
              ("unity-bairro.webp", "No Unity"), ("unity-dentro-da-casa.webp", "Dentro de uma casa no Unity")],
       links=[("Abrir o gerador de mundo", "jogo", "mundo.html")],
       situacao="Em desenvolvimento"),
]

CREDITOS_MAPA = ("Relevo: SRTM data courtesy of the U.S. Geological Survey. "
                 "Ruas e rios: © colaboradores do OpenStreetMap (ODbL).")


def por_grupo():
    return [(gid, nome, [p for p in PROJETOS if p["grupo"] == gid]) for gid, nome in GRUPOS]
