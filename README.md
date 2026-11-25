# Portfólio Washington Oliveira · Flask

Site em **Python + Flask** com templates Jinja, CSS dividido por seção e JavaScript em módulos (ES modules).
Substitui a versão estática antiga (`sistema/` + `site-railway/`, que continuam intactas como cópia de segurança).

## Estrutura

```
projeto-wo/
├─ app.py                 aplicação Flask (create_app, rotas, cabeçalhos, erro 404)
├─ marca.py               fonte única da identidade: cores, fontes, logos, regras, páginas do manual
├─ requirements.txt       Flask, Flask-Compress, gunicorn
├─ railway.json           comando de start e healthcheck (/healthz)
├─ Procfile  .python-version  .gitignore  .railwayignore
│
├─ templates/             HTML (Jinja)
│  ├─ base.html           <head> comum: meta, Open Graph, CSS base + CSS da página
│  ├─ 404.html
│  ├─ partials/           _nav.html  _footer.html
│  ├─ home/index.html     monta a página inicial a partir de home/secoes/_*.html
│  │  └─ secoes/          _hero  _movimento  _numeros  _projetos  _sobre  _dna  _filme  _servicos  _lab  _contato
│  ├─ manual/             index.html + paginas/_*.html (um arquivo por página do manual)
│  ├─ reforma/simulador.html
│  └─ ferramentas/guia-logos.html
│
├─ static/                arquivos servidos em /static/...
│  ├─ css/base/           tokens.css (cores, fontes) · componentes.css (botões, cards, listras...)
│  ├─ css/home/           00-base ... 11-contato (um arquivo por seção da página)
│  ├─ css/paginas/        simulador.css · guia-logos.css
│  ├─ js/home/            main.js (entrada) + config, utils, sequencia, palco, cena, loop,
│  │                      projetos, cartas, filme  ·  dados/ (projetos, servicos, filme)
│  ├─ js/reforma/         app.js (interface) · calculo.js (contas) · dados.js · formato.js
│  ├─ js/ferramentas/     guia-logos.js · manual.js
│  ├─ img/                logos, elementos (SVG), reforma (SVG animados), manual (capturas), favicon.svg, og.png
│  ├─ fonts/  video/ (quadros WebP)  filme/ (MP4 + capas)
│  └─ kit/                kit-da-marca.zip e manual-da-marca.pdf (gerados por script)
│
├─ paginas/               páginas geradas por script: gerador-pecas.html, biblioteca-elementos.html
├─ ferramentas/           scripts Python: gerar_elementos, montar_gerador, video_para_frames, montar_kit, gerar_manual_pdf
├─ producao/              fontes dos vídeos (HyperFrames): video, video-vertical
└─ tests/                 test_rotas.py · test_marca.py
```

Rotas: `/` · `/manual` · `/marca/tokens.json` · `/marca/tokens.css` · `/simulador-reforma` · `/guia-logos` · `/gerador-pecas` · `/biblioteca-elementos` · `/healthz` · `/robots.txt` · `/sitemap.xml`.
Os endereços antigos (`/portfolio.html` etc.) redirecionam para os novos.

## Rodar no seu computador

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python app.py
```

Abra http://localhost:3000. Para recarregar templates sozinho: `$env:FLASK_DEBUG=1` antes de rodar.
(O `gunicorn` é só para produção e não roda no Windows.)

## Testes

```powershell
.venv\Scripts\python -m unittest discover -s tests -v
```

## O que editar

| Quero mudar | Arquivo |
|---|---|
| Projetos do portfólio | `static/js/home/dados/projetos.js` |
| Textos dos cards (serviços, sobre, DNA) | `static/js/home/dados/servicos.js` |
| Capítulos e vídeos do filme | `static/js/home/dados/filme.js` |
| Cores e fontes | `static/css/base/tokens.css` |
| Visual de uma seção | `static/css/home/NN-nome.css` |
| Texto de uma seção | `templates/home/secoes/_nome.html` |
| Alíquotas e regras do simulador | `static/js/reforma/dados.js` |
| E-mail, @ e site de contato | `CONTATO` em `marca.py` (vale para site e manual) |

Os arquivos de `paginas/` são **gerados**: edite `ferramentas/gerador_template.html` e rode
`python ferramentas/montar_gerador.py` (ou `gerar_elementos.py` para a biblioteca e os 661 SVGs).

## Manual da marca

Está em `/manual`: 25 quadros de 1280 × 720 px (capa, essência, logo, cores, tipografia, forma, elementos,
ilustração, movimento, aplicações, qualidade e arquivos). Na tela os quadros se ajustam à janela; ao imprimir,
cada quadro vira uma página.

- **Dados:** tudo sai de `marca.py` (cores com HEX/RGB/CMYK e contraste calculados, fontes, logos, regras, textos).
  Mudou uma cor? Ajuste em `marca.py` **e** em `static/css/base/tokens.css`. O teste `tests/test_marca.py` falha se os dois divergirem.
- **Páginas:** `templates/manual/paginas/_nome.html`. A ordem e o sumário vêm de `PAGINAS` e `TITULOS` em `marca.py`.
- **Atualizar o PDF e o kit** depois de qualquer mudança (precisa do Chrome ou do Edge instalado):

```powershell
.venv\Scripts\python ferramentas\gerar_manual_pdf.py
.venv\Scripts\python ferramentas\montar_kit.py
```

- As capturas do site usadas na página "Digital" ficam em `static/img/manual/`. Refaça se o visual do site mudar.
- Os textos de essência, valores e voz foram escritos a partir dos textos do próprio site: revise e ajuste em `marca.py`.
- CMYK é conversão aproximada do RGB; valide a prova de cor com a gráfica. Não há códigos Pantone.

## Publicar no Railway

1. Pelo GitHub: suba a pasta `projeto-wo` num repositório e use **New Project → Deploy from GitHub repo**.
2. Ou pela CLI: `npm install -g @railway/cli`, `railway login`, `railway init`, `railway up`, `railway domain`.

O `railway.json` já define o comando (`gunicorn app:app ...`) e o healthcheck `/healthz`.
O `.railwayignore` deixa de fora `ferramentas/`, `producao/` e `tests/` do envio.
O endereço da imagem de prévia (Open Graph) é montado sozinho com o domínio em que o site estiver.

## Notas

- Os módulos JS (`type="module"`) só funcionam servidos por HTTP, não abrindo o HTML direto do disco. Use sempre o Flask.
- O site tem ~46 MB, quase tudo quadros de vídeo em `static/video`, que só carregam quando a seção está perto da tela.
- Ainda são exemplos: os 6 projetos, o site de contato (ainda vazio, em `CONTATO` no `marca.py`), os números (00) e vários textos de cards.
