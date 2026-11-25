"""Identidade visual WO · Washington Oliveira: fonte única de dados da marca.

Tudo que o manual mostra (cores, tipografia, formas, regras) sai daqui, e os mesmos dados viram
`/marca/tokens.json` e `/marca/tokens.css`. O teste tests/test_marca.py garante que `tokens.css`
(usado pelo site) continua igual a estes valores.
"""

# ------------------------------------------------------------------ essência
# Contato único: troque aqui e vale para o site, o manual, o cartão e a assinatura de e-mail (depois, rode ferramentas/gerar_manual_pdf.py)
# Campos vazios ("") somem do site e do manual. Preencha "social", "social_url" e "site" quando tiver.
CONTATO = {
    "email": "ld3w1j@gmail.com",
    "social": "@washingtonolila",
    "social_url": "https://instagram.com/washingtonolila",
    "site": "",                 # ex.: "seudominio.com"
}

ASSINATURA = "Design · Código · Imagem"
DESCRITOR = "Direção visual · Industrial digital autoral"
PROMESSA = "Marcas, sites e soluções digitais com propósito. Ideias em imagem, soluções em código."
METODO = [
    ("Observo", "Briefing, público e referências antes de qualquer traço."),
    ("Estruturo", "Sistema visual e código limpo que se encaixam e escalam."),
    ("Entrego", "Arquivos organizados, etapas claras e suporte depois da entrega."),
]
FRENTES = [
    ("Design", "Identidade visual, sistemas de elementos, peças e aplicações."),
    ("Código", "Sites sob medida, landing pages, ferramentas e automação."),
    ("Imagem", "Ilustração, direção de arte e conteúdo para redes."),
]
VALORES = [
    ("Clareza", "Cada peça tem uma ideia só, dita sem rodeios."),
    ("Consistência", "O mesmo sistema do cartão ao site, das redes ao filme."),
    ("Autoria", "Traço próprio: o avatar e as formas chanfradas assinam o trabalho."),
    ("Precisão", "Medidas, grades e arquivos organizados, como numa peça técnica."),
]

# ------------------------------------------------------------------ cores
# papel: função da cor · prop: proporção de referência numa peça (soma 100)
CORES = [
    {"id": "grafite",  "nome": "Grafite",         "hex": "#1A1A1A", "var": "--wo-grafite",  "prop": 55,
     "papel": "Base. Fundos escuros e textos sobre fundo claro."},
    {"id": "offwhite", "nome": "Off-white",       "hex": "#F5F5EF", "var": "--wo-offwhite", "prop": 25,
     "papel": "Respiro. Textos sobre grafite e fundos claros."},
    {"id": "laranja",  "nome": "Laranja técnico", "hex": "#F16A32", "var": "--wo-laranja",  "prop": 12,
     "papel": "Destaque principal. Chamadas, barras, cantos e o que precisa ser visto primeiro."},
    {"id": "azul",     "nome": "Azul digital",    "hex": "#365CE6", "var": "--wo-azul",     "prop": 5,
     "papel": "Apoio para o mundo do código: web, interfaces e dados."},
    {"id": "cinza",    "nome": "Cinza",           "hex": "#D9D9D9", "var": "--wo-cinza",    "prop": 3,
     "papel": "Texto de apoio, legendas e linhas finas."},
]
SUPERFICIES = [
    {"id": "grafite-2", "nome": "Grafite 2", "hex": "#262626", "var": "--wo-grafite-2", "papel": "Cartões e painéis sobre grafite."},
    {"id": "grafite-3", "nome": "Grafite 3", "hex": "#333333", "var": "--wo-grafite-3", "papel": "Camada acima do Grafite 2."},
]
LINHA = "rgba(245,245,239,.16)"      # --wo-linha: filetes sobre grafite

# ------------------------------------------------------------------ tipografia
FONTES = [
    {"id": "display", "nome": "Barlow Condensed", "var": "--f-display", "pesos": [700, 800, 900],
     "papel": "Títulos e impacto", "regra": "Black (900), caixa-alta, entrelinha apertada (0,88).",
     "amostra": "DESIGN CÓDIGO IMAGEM", "fallback": "'Arial Narrow', sans-serif"},
    {"id": "texto", "nome": "Inter", "var": "--f-texto", "pesos": [400, 600],
     "papel": "Textos corridos e informações", "regra": "Regular (400) no corpo, Semibold (600) para ênfase.",
     "amostra": "Marcas, sites e soluções digitais com propósito.", "fallback": "system-ui, sans-serif"},
    {"id": "mono", "nome": "JetBrains Mono", "var": "--f-mono", "pesos": [500],
     "papel": "Rótulos, números e dados", "regra": "Medium (500), caixa-alta, espaçamento largo (0,28em).",
     "amostra": "01 · DIREÇÃO VISUAL", "fallback": "ui-monospace, monospace"},
]
ESCALA = [
    # nome, classe CSS, tamanho, uso
    ("Display XL", "display h-xl", "56 – 150 px", "Capas e primeira dobra. Uma por peça."),
    ("Título L",   "display h-lg", "40 – 84 px",  "Título de seção."),
    ("Título M",   "display h-md", "26 – 40 px",  "Títulos de cartão e subtítulos."),
    ("Texto de apoio", "lead",     "18 px",       "Frase de abertura logo abaixo do título."),
    ("Texto",      "corpo",        "16 px",       "Texto corrido. Entrelinha 1,55."),
    ("Rótulo",     "rotulo",       "12 px",       "Seção, legenda, dado. Mono, caixa-alta."),
]

# ------------------------------------------------------------------ forma e espaço
FORMA = {
    "corte": 14, "corte_sm": 8, "gutter": "clamp(16px, 4vw, 48px)", "max": 1280,
}

# ------------------------------------------------------------------ logos
LOGOS = [
    {"id": "logo-horizontal", "nome": "Logo horizontal", "uso": "Assinatura completa: avatar, WO, nome e descritor.",
     "min": "120 px de largura", "ideal": "Cabeçalhos, capas, apresentações, documentos."},
    {"id": "wordmark", "nome": "Wordmark", "uso": "WO + nome, sem avatar. Mais compacto.",
     "min": "100 px de largura", "ideal": "Rodapés, assinaturas, faixas estreitas."},
    {"id": "monograma-wo", "nome": "Monograma WO", "uso": "As duas letras, o menor elemento da marca.",
     "min": "24 px de altura", "ideal": "Favicon, menu, ícones, selo em peças pequenas."},
    {"id": "wo-digital", "nome": "WO Digital", "uso": "Etiqueta chanfrada da frente de código.",
     "min": "80 px de largura", "ideal": "Projetos web, sistemas, ferramentas."},
    {"id": "selo-cheio", "nome": "Selo cheio", "uso": "Selo circular com fundo sólido.",
     "min": "64 px de diâmetro", "ideal": "Carimbos, adesivos, rodapé de peças."},
    {"id": "selo-linha", "nome": "Selo em linha", "uso": "Selo circular só com contorno.",
     "min": "80 px de diâmetro", "ideal": "Peças com fundo trabalhado ou fotografia."},
    {"id": "avatar", "nome": "Avatar", "uso": "Retrato ilustrado dentro da moldura chanfrada.",
     "min": "48 px", "ideal": "Perfis de redes sociais e contas."},
    {"id": "avatar-sem-fundo", "nome": "Avatar sem fundo", "uso": "Só o desenho, com o fundo transparente.",
     "min": "120 px de altura", "ideal": "Capas, pôsteres e o herói do site."},
]
LOGO_CORES = [
    {"id": "grafite",  "nome": "Grafite",  "fundo": "#F5F5EF", "texto": "#1A1A1A", "quando": "Sobre off-white, cinza ou laranja."},
    {"id": "offwhite", "nome": "Off-white", "fundo": "#1A1A1A", "texto": "#F5F5EF", "quando": "Sobre grafite, azul ou fotos escuras."},
    {"id": "laranja",  "nome": "Laranja",  "fundo": "#1A1A1A", "texto": "#F5F5EF", "quando": "Sobre grafite, como acento."},
    {"id": "azul",     "nome": "Azul",     "fundo": "#F5F5EF", "texto": "#1A1A1A", "quando": "Sobre off-white, em contexto de código/web."},
]
LOGO_ERROS = [
    ("Distorcer", "Esticar ou achatar muda a proporção do desenho.", "esticado"),
    ("Escuro sobre escuro", "Logo grafite sobre fundo grafite desaparece.", "escuro"),
    ("Azul sobre laranja", "As duas cores vibram e perdem leitura.", "azul-laranja"),
    ("Sombra e efeitos", "A marca é plana: sem sombra, brilho ou contorno extra.", "sombra"),
    ("Girar", "O logo fica sempre na horizontal.", "girado"),
    ("Recolorir fora da paleta", "Só as quatro cores do logo.", "cor"),
]

# ------------------------------------------------------------------ elementos (contagem real em static/img/elementos)
ELEMENTOS = [
    {"id": "elementos-graficos", "nome": "Elementos gráficos", "n": 30, "amostra": ["canto-l", "cruz", "slash-triplo", "seta-bloco", "mira", "chevrons-3"],
     "uso": "Cantos, setas, divisores e marcas de precisão que organizam a peça."},
    {"id": "molduras", "nome": "Molduras", "n": 21, "amostra": ["moldura-cheia", "moldura-cantos", "moldura-janela", "moldura-etiqueta"],
     "uso": "Contêineres chanfrados para foto, texto, botão e cartão."},
    {"id": "padroes", "nome": "Padrões", "n": 21, "amostra": ["listras-grossas", "pontos", "grade", "ondas-topograficas", "hachura-cruzada", "meio-tom"],
     "uso": "Texturas geométricas para fundos e áreas de preenchimento."},
    {"id": "fundos", "nome": "Fundos", "n": 8, "amostra": ["fundo-hud", "fundo-ondas", "fundo-alvo", "fundo-slashes"],
     "uso": "Composições prontas de fundo para posts e capas."},
    {"id": "icones", "nome": "Ícones", "n": 51, "amostra": ["pincel", "codigo", "camera", "camadas", "foguete", "check"],
     "uso": "Ícones de linha para serviços, listas e interface."},
    {"id": "simbolos", "nome": "Símbolos", "n": 19, "amostra": ["chanfro-cheio", "hexagono", "octogono-linha", "estrela-8"],
     "uso": "Formas de apoio: chanfros, polígonos e brilhos."},
    {"id": "extras", "nome": "Extras", "n": 15, "amostra": ["seta-diagonal", "botao-play", "selo-verificado", "qr-code"],
     "uso": "Peças utilitárias: play, QR, selo de verificado, wifi."},
]
CORES_ELEMENTO = ["grafite", "offwhite", "laranja", "azul"]

# ------------------------------------------------------------------ movimento
VIDEOS = [
    ("Plus", "Grade de cruzes", "Fundo da página inteira, acompanha o scroll.", "scroll"),
    ("Esfera", "Esfera em rotação", "Palco “Três frentes”.", "scroll"),
    ("Cabeça", "Perfil para frente", "Palco “Sobre”.", "scroll"),
    ("DNA", "Hélice girando", "Palco “DNA da marca”.", "scroll"),
    ("HUD", "Painel de dados", "Fundo da seção Lab.", "scroll"),
    ("Terreno", "Ondas em relevo", "Contato.", "loop"),
    ("Globo", "Globo girando", "Contato.", "loop"),
]
MOVIMENTO = [
    ("Scroll conduz", "Nos palcos, a rolagem controla vídeo, texto e cards: o usuário dirige."),
    ("Loop contínuo", "Terreno e globo rodam sozinhos, com emenda invisível, para dar vida sem pedir ação."),
    ("Suave, nunca brusco", "Posição suavizada (16% por quadro): o movimento acompanha, não salta."),
    ("Respeita o usuário", "Com “reduzir movimento” ativo no sistema, tudo fica parado em uma pose."),
]

# ------------------------------------------------------------------ aplicações (espelha o gerador de peças)
FORMATOS = [
    ("Post 4:5", "1080 × 1350"), ("Quadrado", "1080 × 1080"), ("Story / Reels", "1080 × 1920"), ("Miniatura 16:9", "1280 × 720"),
    ("Slide 16:9", "1920 × 1080"), ("Capa / banner", "1500 × 500"), ("Cartão de visita", "1050 × 600"), ("Assinatura de e-mail", "1200 × 400"),
]
TEMAS = [
    ("Escuro", "#1A1A1A", "#F5F5EF", "#F16A32"), ("Claro", "#F5F5EF", "#1A1A1A", "#F16A32"), ("Laranja", "#F16A32", "#1A1A1A", "#F5F5EF"),
    ("Azul", "#365CE6", "#F5F5EF", "#1A1A1A"), ("Grafite + azul", "#1A1A1A", "#F5F5EF", "#6C8CFF"),
    ("Claro + azul", "#F5F5EF", "#1A1A1A", "#365CE6"), ("Cinza", "#D9D9D9", "#1A1A1A", "#F16A32"),
]
LAYOUTS = ["Poster", "Tipográfico", "Citação", "Projeto", "Carrossel", "Serviços", "Antes e depois", "Destaque",
           "Cartão", "Verso", "Processo", "Checklist", "Depoimento", "Evento", "Comparação"]

# ------------------------------------------------------------------ voz
VOZ_PRINCIPIOS = [
    ("Direta", "Frases curtas, verbo no começo. “Observo. Estruturo. Entrego.”"),
    ("Concreta", "Diz o que entrega: logotipo, paleta, site, landing page."),
    ("Calma", "Confiança sem exagero. Sem “o melhor”, “incrível”, “revolucionário”."),
    ("Humana", "Primeira pessoa, português do dia a dia, sem jargão desnecessário."),
]
VOZ_EXEMPLOS = [
    ("Em vez de", "Soluções inovadoras e disruptivas para o seu negócio.", "Não diz nada e serviria para qualquer marca."),
    ("Escreva", "Marcas, sites e soluções digitais com propósito.", "Diz o que faz e para quê."),
    ("Em vez de", "Somos apaixonados por criar experiências incríveis!", "Excesso de adjetivo e de exclamação."),
    ("Escreva", "Ideias em imagem, soluções em código.", "Curta, com ritmo e uma imagem."),
]
GRAFIA = [
    "Títulos em caixa-alta; textos em caixa normal.",
    "“WO” sempre em maiúsculas. Nome completo: Washington Oliveira.",
    "Assinatura com pontos médios: Design · Código · Imagem.",
    "Números com dois dígitos nas listas e seções: 01, 02, 03.",
]

# ------------------------------------------------------------------ checklist de qualidade
CHECKLIST = [
    "O logo está na cor certa para o fundo (grafite/off-white/laranja/azul)?",
    "Há respiro ao redor do logo igual à altura do “O”?",
    "Só usei as cinco cores da paleta, com laranja como destaque (não como fundo de tudo)?",
    "Títulos em Barlow Condensed Black, caixa-alta; texto em Inter?",
    "Os cantos de cartões e botões têm o corte chanfrado?",
    "O contraste entre texto e fundo passa no mínimo AA?",
    "Usei elementos da biblioteca em vez de desenhar novos?",
    "O texto segue a voz da marca: curto, concreto e calmo?",
]

# ------------------------------------------------------------------ páginas do manual (ordem = ordem de exibição)
SECOES = ["Essência", "Logo", "Cores", "Tipografia", "Forma e grid", "Elementos", "Ilustração", "Movimento", "Aplicações", "Qualidade", "Arquivos"]
PAGINAS = [
    ("capa", None), ("sumario", None),
    ("essencia", "Essência"), ("personalidade", "Essência"), ("voz", "Essência"),
    ("logo-familia", "Logo"), ("logo-uso", "Logo"), ("logo-respiro", "Logo"), ("logo-fundos", "Logo"), ("logo-erros", "Logo"),
    ("cores", "Cores"), ("cores-uso", "Cores"),
    ("tipografia", "Tipografia"), ("tipografia-escala", "Tipografia"),
    ("forma", "Forma e grid"),
    ("elementos", "Elementos"), ("molduras-padroes", "Elementos"), ("icones-simbolos", "Elementos"),
    ("ilustracao", "Ilustração"),
    ("movimento", "Movimento"),
    ("aplicacoes-pecas", "Aplicações"), ("aplicacoes-digital", "Aplicações"),
    ("qualidade", "Qualidade"),
    ("arquivos", "Arquivos"),
    ("contracapa", None),
]
VERSAO = "1.0"
DATA_EDICAO = "Novembro de 2026"
TITULOS = {
    "capa": "Capa", "sumario": "Sumário", "essencia": "Essência", "personalidade": "Método e valores", "voz": "Voz e tom",
    "logo-familia": "Família de logos", "logo-uso": "Qual logo usar", "logo-respiro": "Respiro e tamanho mínimo",
    "logo-fundos": "Logo sobre fundos", "logo-erros": "Usos incorretos",
    "cores": "Paleta", "cores-uso": "Proporção e contraste",
    "tipografia": "Famílias tipográficas", "tipografia-escala": "Hierarquia",
    "forma": "Chanfro e grid", "elementos": "Biblioteca de elementos", "molduras-padroes": "Molduras e padrões",
    "icones-simbolos": "Ícones e símbolos", "ilustracao": "Avatar e ilustração", "movimento": "Movimento",
    "aplicacoes-pecas": "Peças gráficas", "aplicacoes-digital": "Digital", "qualidade": "Antes de publicar",
    "arquivos": "Arquivos e downloads", "contracapa": "Contracapa",
}


def sumario():
    """Seções com a página em que começam (para o sumário e a navegação)."""
    itens = []
    for n, nome in enumerate(SECOES, 1):
        paginas = [i for i, (_, s) in enumerate(PAGINAS, 1) if s == nome]
        itens.append({"n": n, "nome": nome, "pagina": paginas[0], "id": PAGINAS[paginas[0] - 1][0],
                      "paginas": [TITULOS[PAGINAS[i - 1][0]] for i in paginas]})
    return itens


# ------------------------------------------------------------------ cálculos
def rgb(hex_):
    h = hex_.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def cmyk(hex_):
    """Conversão simples RGB → CMYK (aproximada). Para impressão, valide a prova de cor com a gráfica."""
    r, g, b = (c / 255 for c in rgb(hex_))
    k = 1 - max(r, g, b)
    if k >= 1:
        return (0, 0, 0, 100)
    return tuple(round(v * 100) for v in ((1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k))


def luminancia(hex_):
    def canal(c):
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb(hex_)
    return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b)


def contraste(a, b):
    la, lb = luminancia(a), luminancia(b)
    claro, escuro = max(la, lb), min(la, lb)
    return round((claro + 0.05) / (escuro + 0.05), 2)


def nivel(razao):
    """Nível WCAG para texto normal: AAA ≥ 7, AA ≥ 4,5, AA grande ≥ 3."""
    if razao >= 7:
        return "AAA"
    if razao >= 4.5:
        return "AA"
    if razao >= 3:
        return "AA grande"
    return "Não passa"


def _cor(c):
    r = rgb(c["hex"])
    return {**c, "rgb": r, "cmyk": cmyk(c["hex"])}


def cores_completas():
    return [_cor(c) for c in CORES]


def superficies_completas():
    return [_cor(c) for c in SUPERFICIES]


PARES_CONTRASTE = [
    ("offwhite", "grafite"), ("cinza", "grafite"), ("laranja", "grafite"), ("grafite", "laranja"),
    ("offwhite", "azul"), ("grafite", "azul"), ("laranja", "azul"), ("grafite", "offwhite"), ("azul", "offwhite"),
]


def tabela_contraste():
    por_id = {c["id"]: c["hex"] for c in CORES}
    linhas = []
    for texto, fundo in PARES_CONTRASTE:
        r = contraste(por_id[texto], por_id[fundo])
        linhas.append({"texto": texto, "fundo": fundo, "ht": por_id[texto], "hf": por_id[fundo], "razao": r, "nivel": nivel(r)})
    return linhas


def tokens():
    """Estrutura exportada em /marca/tokens.json."""
    return {
        "marca": "WO · Washington Oliveira",
        "versao": VERSAO,
        "assinatura": ASSINATURA,
        "cores": {c["id"]: {"hex": c["hex"], "rgb": list(rgb(c["hex"])), "cmyk": list(cmyk(c["hex"])), "css": c["var"]} for c in CORES},
        "superficies": {c["id"]: {"hex": c["hex"], "css": c["var"]} for c in SUPERFICIES},
        "linha": LINHA,
        "tipografia": {f["id"]: {"familia": f["nome"], "pesos": f["pesos"], "css": f["var"], "papel": f["papel"]} for f in FONTES},
        "forma": {"corte": f"{FORMA['corte']}px", "corte-sm": f"{FORMA['corte_sm']}px"},
        "layout": {"gutter": FORMA["gutter"], "largura-maxima": f"{FORMA['max']}px"},
    }


def tokens_css():
    """Bloco :root equivalente ao de static/css/base/tokens.css (sem as @font-face)."""
    linhas = [":root {"]
    for c in CORES:
        linhas.append(f"  {c['var']}: {c['hex']};")
    for c in SUPERFICIES:
        linhas.append(f"  {c['var']}: {c['hex']};")
    linhas.append(f"  --wo-linha: {LINHA};")
    for f in FONTES:
        linhas.append(f"  {f['var']}: '{f['nome']}', {f['fallback']};")
    linhas.append(f"  --corte: {FORMA['corte']}px;")
    linhas.append(f"  --corte-sm: {FORMA['corte_sm']}px;")
    linhas.append(f"  --gutter: {FORMA['gutter']};")
    linhas.append(f"  --max: {FORMA['max']}px;")
    linhas.append("}")
    return "\n".join(linhas) + "\n"
