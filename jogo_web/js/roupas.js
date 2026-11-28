/* Pintura das roupas sobre o corpo e acessórios em caixas.
   pintarRoupa(id, p) -> nome do material ou null (fica a pele).
   p = {peca, i, j, k, n, tam, meio (distância do centro em x), frente, tras, topo (blocos abaixo do topo)} */
const ehBraco = s => s === 'braco_d' || s === 'braco_e';
const ehAnte = s => s === 'antebraco_d' || s === 'antebraco_e';
const ehCoxa = s => s === 'coxa_d' || s === 'coxa_e';
const ehCanela = s => s === 'canela_d' || s === 'canela_e';
const ehPe = s => s === 'pe_d' || s === 'pe_e';

function calcado(p, cano){
  if (ehPe(p.peca)) return p.k === 0 ? 'sola' : (p.k === p.tam[2] - 1 ? 'calcado_sombra' : 'calcado');
  if (ehCanela(p.peca) && p.k < cano) return p.k === cano - 1 ? 'calcado_sombra' : 'calcado';
  return null;
}
function calcaComprida(p, mat = 'calca'){
  if (p.peca === 'quadril' || ehCoxa(p.peca) || ehCanela(p.peca)) return mat;
  return null;
}
/* camuflagem: manchas de 2 x 2 x 2 blocos, sempre iguais */
function camuflagem(p, base){
  const h = ruido(`${p.peca}|${p.i >> 1},${p.j >> 1},${(p.k + (p.i & 1)) >> 1}`);
  return h < 24 ? base + '_escuro' : h < 40 ? base + '_claro' : base;
}
/* gola em V no alto do tórax, mostrando pele */
const golaV = (p, largura = 2.5) => p.peca === 'torax' && p.frente && p.topo < 3 && p.meio < largura - p.topo * 1.0;

const PINTURAS = {
  base(p){
    if (p.peca === 'quadril') return p.k === p.tam[2] - 1 ? 'detalhe' : 'short';
    return (ehCoxa(p.peca) && p.topo < 6) ? 'short' : null;
  },
  wo(p){
    const c = calcado(p, 0); if (c) return c;
    if (p.peca === 'quadril') return p.k === p.tam[2] - 1 ? (p.frente && p.meio < 1 ? 'metal' : 'detalhe') : 'calca';
    const q = calcaComprida(p); if (q) return q;
    if (golaV(p, 3.2)) return null;
    if (p.peca === 'torax' && p.frente && p.topo < 4 && p.meio < 4.2 - p.topo * 1.0) return 'forro';
    if (p.peca === 'torax' || p.peca === 'cintura'){
      if (p.frente && p.meio < 1 && p.i < p.tam[0] / 2) return (p.k % 2 === 0) ? 'botao' : 'camisa_sombra';
      if (p.peca === 'torax' && p.frente && p.k === 6 && p.i >= p.tam[0] - 6 && p.i < p.tam[0] - 2) return 'camisa_sombra';
      return 'camisa';
    }
    if (ehBraco(p.peca)) return 'camisa';
    if (ehAnte(p.peca)) return p.k === 0 ? 'camisa_sombra' : 'camisa';
    return null;
  },
  casual(p){
    const c = calcado(p, 0); if (c) return c;
    if (p.peca === 'quadril') return p.k === p.tam[2] - 1 ? 'calca_escuro' : 'calca';
    const q = calcaComprida(p); if (q) return q;
    if (p.peca === 'torax'){
      if (p.frente && p.topo === 0 && p.meio < 2) return null;
      if (p.frente && p.k >= 4 && p.k <= 6 && p.meio < 3){ return ((p.i + p.k) % 3 === 0) ? 'camisa' : 'detalhe'; }
      return 'camisa';
    }
    if (p.peca === 'cintura') return 'camisa';
    return (ehBraco(p.peca) && p.topo < 7) ? 'camisa' : null;
  },
  moletom(p){
    const c = calcado(p, 0); if (c) return c;
    const q = calcaComprida(p); if (q) return q;
    if (p.peca === 'cintura'){
      if (p.k === 0) return 'camisa_sombra';
      return (p.frente && p.meio < 3.5 && p.k <= 3) ? 'camisa_sombra' : 'camisa';
    }
    if (p.peca === 'torax'){
      if (p.frente && p.k >= 4 && p.meio > 1 && p.meio < 2) return 'detalhe';
      if (p.topo === 0) return 'camisa_sombra';
      return 'camisa';
    }
    if (ehBraco(p.peca)) return 'camisa';
    if (ehAnte(p.peca)) return p.k === 0 ? 'camisa_sombra' : 'camisa';
    return null;
  },
  social(p){
    const c = calcado(p, 0); if (c) return c;
    if (p.peca === 'quadril') return p.k === p.tam[2] - 1 ? 'preto' : 'calca';
    const q = calcaComprida(p); if (q) return q;
    if (p.peca === 'torax' || p.peca === 'cintura'){
      const abre = p.peca === 'torax' ? Math.max(0, 3.6 - p.topo * .55) : 0;
      if (p.frente && p.peca === 'torax' && p.k >= 2){
        if (p.meio < 1) return 'detalhe';
        if (p.meio < abre) return 'branco_roupa';
        if (p.meio < abre + 1) return 'camisa_escuro';
      }
      if (p.frente && p.peca === 'cintura' && p.meio < 1 && p.k % 2 === 1) return 'camisa_escuro';
      return 'camisa';
    }
    if (ehBraco(p.peca)) return 'camisa';
    if (ehAnte(p.peca)) return p.k === 0 ? 'branco_roupa' : 'camisa';
    return null;
  },
  oficina(p){
    const c = calcado(p, 4); if (c) return c;
    const q = calcaComprida(p); if (q) return (ehCoxa(p.peca) && p.frente && p.topo >= 5 && p.topo <= 7) ? 'calca_escuro' : q;
    if (p.peca === 'cintura') return p.k === p.tam[2] - 1 ? 'calca_escuro' : 'calca';
    if (p.peca === 'torax'){
      if (p.frente && p.k <= 6 && p.meio < 4) return (p.k === 6 && p.meio > 2) ? 'detalhe' : (p.k === 3 && p.meio < 2.5 ? 'calca_escuro' : 'calca');
      if ((p.frente || p.tras || p.n[2] > 0) && p.meio > 2.5 && p.meio < 4.5) return 'calca';
      if (p.k <= 2) return 'calca';
      return 'camisa';
    }
    return (ehBraco(p.peca) && p.topo < 7) ? 'camisa' : null;
  },
  sobrevivente(p){
    const c = calcado(p, 5); if (c) return c;
    const sujo = ruido(`s|${p.peca}|${p.i},${p.j},${p.k}`);
    if (p.peca === 'quadril') return p.k === p.tam[2] - 1 ? 'couro' : (sujo < 12 ? 'calca_escuro' : 'calca');
    if (ehCoxa(p.peca) || ehCanela(p.peca)){
      if (p.peca === 'coxa_e' && p.frente && p.topo >= 7 && p.topo <= 8) return null;           /* rasgo */
      if (ehCoxa(p.peca) && p.topo === 4 && p.peca === 'coxa_d') return 'couro';                /* tira na coxa */
      return sujo < 14 ? 'calca_escuro' : 'calca';
    }
    if (p.peca === 'torax' || p.peca === 'cintura'){
      if (p.peca === 'torax' && p.frente && p.meio < 2) return sujo < 10 ? 'detalhe_escuro' : 'detalhe';
      if (p.peca === 'cintura' && p.frente && p.meio < 2) return 'detalhe';
      if ((p.i + p.k) === 9 && p.frente) return 'couro';                                         /* alça atravessada */
      return sujo < 16 ? 'camisa_escuro' : 'camisa';
    }
    if (ehBraco(p.peca)) return sujo < 16 ? 'camisa_escuro' : 'camisa';
    if (ehAnte(p.peca)){
      if (p.peca === 'antebraco_e') return (p.k <= 3) ? (p.k % 2 ? 'faixa' : 'faixa_sombra') : null;  /* manga arrancada e atadura */
      return p.k >= 2 ? (sujo < 16 ? 'camisa_escuro' : 'camisa') : 'couro';
    }
    return null;
  },
  soldado(p){
    const c = calcado(p, 4); if (c) return c;
    if (p.peca === 'quadril') return p.k === p.tam[2] - 1 ? (p.frente && p.meio < 1 ? 'metal' : 'detalhe') : camuflagem(p, 'calca');
    if (ehCoxa(p.peca)) return camuflagem(p, 'calca');
    if (ehCanela(p.peca)){
      if (p.k === 4) return 'calca_escuro';                                                       /* barra presa no coturno */
      return (p.topo <= 2 && p.frente) ? 'calca_sombra' : camuflagem(p, 'calca');
    }
    if (p.peca === 'torax'){
      if (p.frente && p.topo === 0 && p.meio < 1.5) return 'detalhe';                             /* camiseta sob a gola */
      if (p.frente && p.meio < .6) return 'camisa_escuro';                                        /* zíper */
      if (p.frente && p.meio > 1.5 && p.meio < 5 && p.k >= 4 && p.k <= 7){
        if (p.k === 7) return 'camisa_escuro';                                                    /* tampa do bolso */
        if (p.k === 6) return (p.meio > 2.9 && p.meio < 3.7) ? 'detalhe' : camuflagem(p, 'camisa');
        if (p.meio < 2.2 || p.meio > 4.3) return 'camisa_escuro';
      }
      if (p.n[2] > 0 && p.meio > 3 && p.meio < 5) return 'camisa_escuro';                         /* reforço do ombro */
      return camuflagem(p, 'camisa');
    }
    if (p.peca === 'cintura') return (p.frente && p.meio < .6) ? 'camisa_escuro' : camuflagem(p, 'camisa');
    if (ehBraco(p.peca)) return (p.topo === 2 || p.topo === 3) && !p.frente && !p.tras ? 'detalhe' : camuflagem(p, 'camisa');
    if (ehAnte(p.peca)) return p.k === 0 ? 'detalhe' : camuflagem(p, 'camisa');
    return null;
  },
};

/* acessórios que fazem parte de uma roupa. cx(peça, x0, x1, y0, y1, z0, z1, material), em blocos da peça */
const EXTRAS_DA_ROUPA = {
  moletom(cx){                                                     /* capuz caído nas costas */
    cx('torax', 3, 11, 8, 10.2, 7.5, 11, 'camisa_sombra'); cx('torax', 4, 10, 10.2, 10.9, 8, 10.4, 'camisa');
    cx('cintura', 3, 11 - 4, -.45, 0 + 1, .8, 1.2, 'camisa_escuro');
  },
  social(cx){ cx('torax', 9.6, 11.6, .55, 1.1, 6.2, 7, 'branco_roupa'); },
  oficina(cx){ cx('torax', 3.4, 4.6, -.4, .1, 5.8, 7, 'detalhe'); cx('torax', 9.4, 10.6, -.4, .1, 5.8, 7, 'detalhe'); },
  sobrevivente(cx){
    cx('torax', 9.2, 11.8, -.7, .1, 1.5, 4.2, 'couro'); cx('torax', 9.6, 11.4, -.85, -.6, 3, 3.5, 'metal');
    cx('quadril', -.9, .2, 2, 5, 0, 3.6, 'couro');
  },
  soldado(cx){                                                     /* bolsos cargo e distintivos da farda */
    for (const [s, x0, x1] of [['coxa_d', .3, 1], ['coxa_e', 4, 4.7]]){
      const y = s === 'coxa_d' ? 1.4 : 2.4;
      cx(s, x0, x1, y, y + 3.2, 4.4, 7.6, 'calca', true); cx(s, x0 - .08, x1 + .08, y - .1, y + 3.3, 7, 8, 'calca_sombra', true);
      cx(s, x0 < 2 ? x0 - .2 : x1 + .08, x0 < 2 ? x0 - .08 : x1 + .2, y + 1.3, y + 1.9, 7.2, 7.7, 'preto');
    }
    cx('braco_e', 3, 3.35, .5, 2.8, 7.2, 9.6, 'velcro'); cx('braco_e', 3.35, 3.48, .9, 2.4, 7.7, 9.1, 'remendo');
    cx('braco_d', -.35, 0, .5, 2.8, 7.2, 9.6, 'velcro'); cx('braco_d', -.48, -.35, .9, 2.4, 8, 8.8, 'remendo_claro');
  },
};
