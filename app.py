"""Portfólio Washington Oliveira · aplicação Flask.

Estrutura (padrão "application factory"):
    create_app()          cria o app e registra rotas, cabeçalhos e erros
    registrar_rotas()     páginas (templates Jinja) e páginas geradas (pasta paginas/)
    registrar_cabecalhos()  cache e segurança
    registrar_erros()     página 404

Rodar local:   python app.py              (http://localhost:3000)
Produção:      gunicorn app:app           (o Railway usa o railway.json)
"""
import os
from pathlib import Path

from flask import Flask, abort, jsonify, redirect, render_template, send_from_directory, url_for
from werkzeug.middleware.proxy_fix import ProxyFix

import acervo
import marca

RAIZ = Path(__file__).resolve().parent
PAGINAS = RAIZ / "paginas"

# páginas feitas por scripts em ferramentas/ (ficam fora dos templates porque são geradas)
PAGINAS_GERADAS = {
    "gerador-pecas": "gerador-pecas.html",
    "biblioteca-elementos": "biblioteca-elementos.html",
}
# endereços antigos (.html) que continuam funcionando, redirecionando para o endereço limpo
LEGADO = {
    "index.html": "home", "portfolio.html": "home", "simulador-reforma.html": "simulador",
    "guia-logos.html": "guia", "gerador-pecas.html": "gerador", "biblioteca-elementos.html": "biblioteca",
}
CACHE_LONGO = {".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".woff2", ".woff", ".mp4", ".webm"}
SEGURANCA = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "SAMEORIGIN",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}


def create_app():
    app = Flask(__name__, static_folder="static", template_folder="templates")
    # o Railway fica atrás de um proxy: respeita o protocolo e o domínio originais (links absolutos corretos)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
    app.config["TEMPLATES_AUTO_RELOAD"] = bool(os.environ.get("FLASK_DEBUG"))
    app.json.ensure_ascii = False

    try:                                   # compressão gzip dos textos (opcional: o site funciona sem)
        from flask_compress import Compress
        app.config["COMPRESS_MIMETYPES"] = ["text/html", "text/css", "text/javascript", "application/javascript",
                                            "application/json", "image/svg+xml", "text/plain", "text/xml"]
        Compress(app)
    except ImportError:
        pass

    app.jinja_env.globals["m"] = marca          # os templates leem os dados da marca como `m.CORES` etc.

    registrar_rotas(app)
    registrar_cabecalhos(app)
    registrar_erros(app)
    return app


def registrar_rotas(app):
    @app.get("/")
    def home():
        return render_template("home/index.html")

    @app.get("/simulador-reforma")
    def simulador():
        return render_template("reforma/simulador.html")

    @app.get("/guia-logos")
    def guia():
        return render_template("ferramentas/guia-logos.html")

    @app.get("/gerador-pecas")
    def gerador():
        return send_from_directory(PAGINAS, PAGINAS_GERADAS["gerador-pecas"], max_age=300)

    @app.get("/biblioteca-elementos")
    def biblioteca():
        return send_from_directory(PAGINAS, PAGINAS_GERADAS["biblioteca-elementos"], max_age=300)

    @app.get("/acervo")
    def projetos_acervo():
        return render_template("acervo/index.html", grupos=acervo.por_grupo(), creditos=acervo.CREDITOS_MAPA)

    @app.get("/manual")
    def manual():
        return render_template("manual/index.html")

    @app.get("/marca/tokens.json")
    def marca_tokens_json():
        return jsonify(marca.tokens())

    @app.get("/marca/tokens.css")
    def marca_tokens_css():
        return marca.tokens_css(), 200, {"Content-Type": "text/css; charset=utf-8"}

    @app.get("/healthz")
    def healthz():
        return "ok", 200, {"Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store"}

    @app.get("/robots.txt")
    def robots():
        corpo = f"User-agent: *\nAllow: /\nSitemap: {url_for('sitemap', _external=True)}\n"
        return corpo, 200, {"Content-Type": "text/plain; charset=utf-8"}

    @app.get("/sitemap.xml")
    def sitemap():
        urls = [url_for(n, _external=True) for n in ("home", "projetos_acervo", "manual", "simulador", "guia", "gerador", "biblioteca")]
        itens = "".join(f"<url><loc>{u}</loc></url>" for u in urls)
        xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{itens}</urlset>'
        return xml, 200, {"Content-Type": "application/xml; charset=utf-8"}

    @app.get("/<nome>.html")
    def legado(nome):
        destino = LEGADO.get(f"{nome}.html")
        if not destino:
            abort(404)
        return redirect(url_for(destino), code=301)


def registrar_cabecalhos(app):
    @app.after_request
    def cabecalhos(resp):
        resp.headers.update(SEGURANCA)
        resp.headers.setdefault("Cache-Control", "public, max-age=300")      # páginas HTML: 5 minutos
        return resp

    # arquivos de /static: 7 dias para imagens, fontes, vídeos e quadros; 5 minutos para CSS e JS
    def max_age_arquivo(nome_arquivo):
        return 604800 if os.path.splitext(nome_arquivo or "")[1].lower() in CACHE_LONGO else 300
    app.get_send_file_max_age = max_age_arquivo


def registrar_erros(app):
    @app.errorhandler(404)
    def nao_encontrada(_erro):
        return render_template("404.html"), 404


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 3000)), debug=bool(os.environ.get("FLASK_DEBUG")))
