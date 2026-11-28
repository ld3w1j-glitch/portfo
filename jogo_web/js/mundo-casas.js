/* Casas por dentro: plantas baixas (cômodos, paredes, portas, janelas e móveis), desenho em voxel e colisão.
   O desenho e a colisão saem dos mesmos dados. Medidas em metros. Origem no chão, no centro; a frente (+Z) olha para a rua.
   Paredes externas: f = frente (+z), t = fundos (-z), e = -x, d = +x. Não usa a página: dá para testar fora do navegador. */
const Casas = (() => {
  const ALT = 2.85, PISO = .06, ANDAR = 2.9, RAIO = .3;
  const DEGRAU = {largura:1.7, fundo:.2, altura:.22, quantos:12};          /* degraus na porta da frente, para casas em terreno inclinado */
  const sorte = (a, b = 0, c = 0) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 2147483629)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  /* semFolhas: a cena desenha as portas e o meio das janelas à parte, porque eles se mexem e quebram */
  const opcoes = {semFolhas:false};
  const VIDRO = '#3E5566', MOLDURA = '#EDE9DD', PORTA = '#6A472C', TELHA = '#A8543A', TELHA2 = '#8E4330', LAJE = '#9D9A92', TIJOLO = '#A9583C', REBOCO = '#B3ADA0', FERRUGEM = '#8A4A24', TABUA = '#6E5844', MATO = '#5C7F33';

  /* ================================================================ móveis: desenhados com a frente para +z e as costas para -z */
  const MADEIRA = '#8A6240', MADEIRA2 = '#6E4C30', BRANCO = '#EEEDE7', INOX = '#B9BEC6', PRETO = '#1E1F23', ESPUMA = '#F2EEE2';
  const MOVEIS = {
    sofa:{w:1.9, d:.85, desenhar(b, c){ b(0, .12, 0, 1.9, .3, .85, c.sofa); b(0, .42, -.31, 1.9, .55, .23, c.sofa); for (const x of [-.86, .86]) b(x, .42, .05, .18, .25, .75, c.sofa, .84); for (const x of [-.4, .4]){ b(x, .42, .09, .74, .13, .62, c.sofa, 1.14); } b(.55, .55, -.14, .34, .3, .13, '#E3A22A'); for (const x of [-.85, .85]) for (const z of [-.34, .34]) b(x, 0, z, .09, .12, .09, PRETO); }},
    poltrona:{w:.8, d:.8, desenhar(b, c){ b(0, .12, 0, .8, .3, .8, c.sofa, .92); b(0, .42, -.29, .8, .55, .22, c.sofa, .92); for (const x of [-.33, .33]) b(x, .42, .05, .14, .22, .7, c.sofa, .76); }},
    rack_tv:{w:1.4, d:.4, desenhar(b, c, v){ b(0, 0, 0, 1.4, .5, .4, MADEIRA2); for (const x of [-.35, .35]) b(x, .08, .21, .6, .32, .02, MADEIRA); b(0, .5, -.02, .2, .06, .16, PRETO); b(0, .56, -.04, 1.05, .64, .07, PRETO); b(0, .6, .002, .95, .54, .01, v ? '#2A3238' : '#2E5C99'); if (v){ b(-.1, .78, .012, .3, .03, .005, '#8FA6B4'); b(.12, .92, .012, .03, .22, .005, '#8FA6B4'); } b(.55, .5, .06, .16, .26, .16, '#C9762E'); }},
    mesa_centro:{w:.75, d:.5, desenhar(b){ b(0, .32, 0, .75, .06, .5, MADEIRA); for (const x of [-.3, .3]) for (const z of [-.18, .18]) b(x, 0, z, .06, .32, .06, MADEIRA2); b(.14, .38, .04, .24, .04, .18, '#C0392B'); }},
    tapete:{w:1.7, d:1.2, solto:true, desenhar(b, c){ b(0, .005, 0, 1.7, .012, 1.2, c.tapete); b(0, .018, 0, 1.3, .006, .85, c.tapete, 1.18); }},
    cama_casal:{w:1.55, d:2.0, desenhar(b, c, v){ b(0, .1, 0, 1.55, .22, 2.0, MADEIRA2); for (const x of [-.72, .72]) for (const z of [-.95, .95]) b(x, 0, z, .09, .1, .09, PRETO); b(0, .32, .02, 1.46, .2, 1.9, BRANCO); b(v ? .12 : 0, .46, .28, 1.52, .1, 1.35, c.coberta); for (const x of [-.37, .37]) b(x, .52, -.68, .6, .13, .36, ESPUMA); b(0, .1, -.98, 1.6, .95, .08, MADEIRA); }},
    cama_solteiro:{w:.95, d:1.95, desenhar(b, c){ b(0, .1, 0, .95, .22, 1.95, MADEIRA2); b(0, .32, .02, .88, .18, 1.86, BRANCO); b(0, .44, .3, .92, .09, 1.25, c.coberta, 1.12); b(0, .5, -.66, .6, .12, .34, ESPUMA); b(0, .1, -.95, .99, .85, .08, MADEIRA); for (const x of [-.42, .42]) for (const z of [-.92, .92]) b(x, 0, z, .08, .1, .08, PRETO); }},
    guarda_roupa:{w:1.4, d:.55, desenhar(b, c, v){ b(0, 0, 0, 1.4, 2.05, .55, MADEIRA); b(0, 2.05, 0, 1.46, .07, .6, MADEIRA2); b(0, .08, .28, .03, 1.9, .012, MADEIRA2); for (const x of [-.09, .09]) b(x, 1, .29, .04, .2, .03, INOX); for (const x of [-.35, .35]) b(x, .3, .278, .55, 1.5, .008, MADEIRA, 1.1); if (v){ b(.38, .1, .55, .62, 1.9, .04, MADEIRA, .85); b(.1, 0, .6, .4, .14, .3, '#4C5560'); } }},
    comoda:{w:.85, d:.45, desenhar(b){ b(0, 0, 0, .85, .8, .45, MADEIRA); for (const y of [.12, .36, .6]){ b(0, y, .23, .74, .19, .015, MADEIRA2); b(0, y + .08, .245, .16, .035, .015, INOX); } b(.22, .8, 0, .16, .22, .12, '#2E6F8E'); }},
    mesa_estudo:{w:1.0, d:.5, desenhar(b){ b(0, .74, 0, 1.0, .06, .5, MADEIRA); for (const x of [-.45, .45]) b(x, 0, 0, .07, .74, .45, MADEIRA2); b(-.1, .8, -.05, .42, .02, .3, PRETO); b(-.1, .82, -.19, .42, .28, .025, PRETO); b(-.1, .85, -.174, .36, .22, .005, '#3A6EA8'); b(.32, .8, .02, .1, .14, .1, '#F16A32'); }},
    geladeira:{w:.7, d:.66, desenhar(b, c, v){ const cor = v ? '#C9C5B8' : BRANCO; b(0, .04, 0, .7, 1.76, .66, cor); b(0, 1.22, .335, .69, .025, .012, '#8A8F96'); for (const y of [.72, 1.34]) b(-.25, y, .36, .045, .34, .05, INOX); b(0, 0, 0, .64, .05, .58, PRETO); if (v){ b(.1, .3, .335, .22, .3, .008, '#7C6A48'); b(-.1, 1.5, .335, .18, .16, .008, '#8A5A34'); } }},
    fogao:{w:.62, d:.62, desenhar(b, c, v){ b(0, 0, 0, .62, .86, .62, v ? '#A8A49A' : BRANCO); b(0, .86, 0, .62, .04, .62, PRETO); for (const x of [-.15, .15]) for (const z of [-.13, .15]){ b(x, .9, z, .17, .025, .17, '#4B4F55'); } b(0, .18, .315, .48, .4, .012, '#2B3A42'); b(0, .62, .33, .44, .04, .03, INOX); b(0, .9, -.29, .62, .16, .04, INOX); if (!v){ b(-.15, .93, .15, .24, .13, .24, '#8C9096'); b(-.15, 1.06, .15, .26, .025, .26, INOX); } }},
    pia:{w:1.2, d:.55, desenhar(b, c, v){ b(0, 0, 0, 1.2, .84, .55, c.armario); b(0, .84, 0, 1.24, .06, .6, '#6F6A62'); b(-.2, .9, .02, .5, .012, .36, INOX); b(-.2, .91, .02, .4, .006, .28, '#8A9098'); b(-.2, .9, -.2, .05, .26, .05, INOX); b(-.2, 1.13, -.13, .05, .045, .17, INOX); for (const x of [-.3, .3]){ b(x, .12, .28, .52, .64, .012, c.armario, 1.1); b(x + (x < 0 ? .18 : -.18), .46, .292, .03, .14, .02, INOX); } b(.34, .9, 0, .18, .2, .18, v ? '#6E5844' : '#D9D2C4'); }},
    armario_alto:{w:1.5, d:.34, solto:true, desenhar(b, c, v){ for (const x of [-.5, 0, .5]){ if (v && x > .2){ b(x, 1.5, .2, .46, .62, .03, c.armario, .85); continue; } b(x, 1.55, 0, .48, .62, .34, c.armario); b(x + .14, 1.62, .18, .03, .13, .02, INOX); } }},
    balcao_cozinha:{w:2.0, d:.5, desenhar(b, c){ b(0, 0, 0, 2.0, 1.0, .44, c.armario, .92); b(0, 1.0, .02, 2.08, .07, .56, '#5C5750'); b(-.5, 1.07, 0, .2, .12, .2, '#D9762E'); b(.4, 1.07, 0, .34, .05, .24, BRANCO); }},
    mesa_jantar:{w:1.3, d:1.3, desenhar(b, c, v){ b(0, .72, 0, .9, .07, .8, MADEIRA); for (const x of [-.38, .38]) for (const z of [-.33, .33]) b(x, 0, z, .07, .72, .07, MADEIRA2); const cadeira = (x, z, lado) => { b(x, .42, z, .36, .06, .36, MADEIRA2); for (const dx of [-.14, .14]) for (const dz of [-.14, .14]) b(x + dx, 0, z + dz, .045, .42, .045, MADEIRA2); b(x, .48, z + .16 * lado, .36, .46, .045, MADEIRA2); }; cadeira(0, -.47, -1); if (!v) cadeira(0, .47, 1); else { b(.2, .02, .5, .5, .06, .36, MADEIRA2); b(.2, .08, .66, .46, .36, .05, MADEIRA2); } b(-.18, .79, .05, .26, .03, .26, BRANCO); b(.2, .79, -.1, .12, .18, .12, '#C0392B'); }},
    vaso:{w:.45, d:.66, desenhar(b){ b(0, 0, .06, .32, .3, .42, BRANCO); b(0, .3, .1, .42, .12, .5, BRANCO); b(0, .42, .1, .34, .02, .4, '#7FA6B8'); b(0, .38, -.24, .44, .42, .18, BRANCO); b(0, .8, -.24, .47, .05, .2, '#DCDAD2'); b(.12, .85, -.24, .08, .025, .08, INOX); }},
    lavatorio:{w:.6, d:.45, desenhar(b, c, v){ b(0, 0, -.04, .18, .74, .18, BRANCO); b(0, .74, 0, .6, .14, .45, BRANCO); b(0, .88, .02, .46, .012, .3, '#9FB8C4'); b(0, .88, -.17, .05, .16, .05, INOX); b(0, 1.02, -.12, .05, .04, .12, INOX); b(0, 1.2, -.215, .52, .62, .02, MOLDURA); b(0, 1.23, -.2, .46, .56, .008, v ? '#6E8088' : '#B9DCEA'); if (v) b(.08, 1.4, -.19, .025, .3, .004, '#2A3238'); }},
    chuveiro:{w:.95, d:.95, desenhar(b, c, v){ b(0, 0, 0, .95, .09, .95, '#CFCBC0'); b(0, .09, 0, .82, .012, .82, '#A9B8BE'); b(.1, .1, -.1, .1, .012, .1, PRETO); b(.34, 1.0, -.44, .05, 1.2, .05, INOX); b(.34, 2.15, -.3, .05, .05, .3, INOX); b(.34, 2.06, -.16, .17, .08, .17, INOX); b(.34, 1.15, -.42, .09, .09, .05, INOX); b(-.45, .09, 0, .05, 1.85, .9, v ? '#6F7A70' : '#CFE4EA', .96); }},
    tanque:{w:.6, d:.52, desenhar(b){ b(0, 0, -.05, .2, .68, .3, LAJE); b(0, .68, 0, .6, .28, .52, '#C9C5B8'); b(0, .96, .02, .46, .012, .36, '#7F9AA6'); b(0, .96, -.2, .05, .22, .05, INOX); b(0, 1.15, -.13, .05, .04, .15, INOX); }},
    maquina:{w:.62, d:.62, desenhar(b){ b(0, 0, 0, .62, .92, .62, BRANCO); b(0, .92, -.2, .62, .14, .2, '#DCDAD2'); b(0, .92, .1, .44, .02, .34, '#5A6A74'); for (const x of [-.15, .05]) b(x, .96, -.095, .08, .06, .02, PRETO); }},
    balcao_loja:{w:2.2, d:.6, desenhar(b, c, v){ b(0, 0, 0, 2.2, 1.0, .56, MADEIRA); b(0, 1.0, 0, 2.3, .08, .66, MADEIRA2); b(0, .14, .29, 2.0, .7, .012, '#2F6E4F'); if (!v){ b(.6, 1.08, 0, .42, .26, .34, '#4B4F55'); b(.6, 1.34, -.06, .3, .16, .04, '#2E5C99'); } b(-.6, 1.08, .05, .4, .2, .3, '#E3A22A'); }},
    prateleira:{w:2.0, d:.42, desenhar(b, c, v){ for (const x of [-.97, .97]) b(x, 0, 0, .06, 2.0, .42, '#6E737A'); for (const y of [.15, .7, 1.25, 1.8]){ b(0, y, 0, 2.0, .05, .42, '#8C9096'); if (y < 1.7) for (let i = 0; i < 7; i++){ if (sorte(i, Math.round(y * 10), v ? 5 : 1) > (v ? .26 : .9)) continue; b(-.78 + i * .26, y + .05, .02, .18, .2 + sorte(i, 3) * .22, .26, ['#C0392B', '#E3A22A', '#2F6E8E', '#D9D2C4', '#4C8A3C'][i % 5]); } } }},
    freezer:{w:.62, d:1.1, desenhar(b){ b(0, 0, 0, .62, .86, 1.1, BRANCO); b(0, .86, 0, .66, .08, 1.14, '#9FB8C4'); b(.32, .3, 0, .012, .24, .6, '#C0392B'); }},
    caixas:{w:.8, d:.7, desenhar(b){ b(-.14, 0, .02, .46, .44, .5, '#A97C48'); b(.24, 0, -.12, .34, .3, .38, '#8F6A3E'); b(-.1, .44, -.02, .36, .3, .38, '#B98C56'); }},
  };

  /* ================================================================ plantas baixas */
  const P = (c, l = .98) => ({porta:true, c, l});                          /* porta ou vão: c = centro ao longo da parede */
  const J = (c, l = 1.3, sill = .95, h = 1.15) => ({c, l, sill, h});       /* janela */
  const JB = c => J(c, .62, 1.65, .52);                                    /* vitrô de banheiro */
  const co = (tipo, x0, x1, z0, z1) => ({tipo, x0, x1, z0, z1});
  const BASE = {
    A:{nome:'1 quarto', w:7.4, d:7.4,
      comodos:[co('sala', -3.7, .7, 0, 3.7), co('quarto', .7, 3.7, 0, 3.7), co('cozinha', -3.7, .7, -3.7, 0), co('banheiro', .7, 3.7, -3.7, -1.5), co('servico', .7, 3.7, -1.5, 0)],
      fora:{f:[J(-2.75, 1.2), P(-1.15, 1.05), J(2.2, 1.4)], e:[J(1.8, 1.5), J(-2, 1.2)], d:[J(1.2, 1.2), JB(-2.7), J(-.75, .8)], t:[J(-1.5, 1.4)]},
      dentro:[{x:.7, de:-3.7, ate:3.7, vaos:[P(-2.35), P(-.75, 1.1), P(.75)]}, {z:0, de:-3.7, ate:.7, vaos:[P(-.9, 1.5)]}, {z:0, de:.7, ate:3.7, vaos:[]}, {z:-1.5, de:.7, ate:3.7, vaos:[]}],
      moveis:[['tapete', -1.85, 1.8, 1], ['sofa', -3.09, 1.8, 1], ['mesa_centro', -1.8, 1.8, 1], ['rack_tv', .43, 2.6, 3],
        ['cama_casal', 2.5, 2.62, 3], ['guarda_roupa', 2.65, .34, 0],
        ['geladeira', -3.14, -3.17, 0], ['fogao', -2.4, -3.2, 0], ['pia', -1.45, -3.23, 0], ['armario_alto', -1.45, -3.34, 0], ['mesa_jantar', -2.5, -1.45, 0],
        ['vaso', 2.15, -3.18, 0], ['chuveiro', 3.03, -3.04, 0], ['lavatorio', 1.95, -1.8, 2],
        ['tanque', 3.24, -.42, 3], ['maquina', 3.2, -1.1, 3]]},
    B:{nome:'2 quartos', w:8, d:8,
      comodos:[co('sala', -4, .8, .4, 4), co('cozinha', -4, .8, -4, .4), co('quarto', .8, 4, .9, 4), co('banheiro', .8, 4, -1, .9), co('quarto', .8, 4, -4, -1)],
      fora:{f:[J(-2.8, 1.2), P(-1.15, 1.05), J(2.4, 1.4)], e:[J(2.2, 1.5), J(-2, 1.3)], d:[J(2.5, 1.2), JB(-.05), J(-2.6, 1.2)], t:[J(-1.6, 1.4), J(2.4, 1.2)]},
      dentro:[{x:.8, de:-4, ate:4, vaos:[P(-1.75), P(-.25), P(1.7)]}, {z:.4, de:-4, ate:.8, vaos:[P(-1.3, 1.8)]}, {z:.9, de:.8, ate:4, vaos:[]}, {z:-1, de:.8, ate:4, vaos:[]}],
      moveis:[['tapete', -2.15, 2.2, 1], ['sofa', -3.39, 2.25, 1], ['mesa_centro', -2.1, 2.25, 1], ['rack_tv', .53, 3.05, 3], ['poltrona', -3.4, .88, 1],
        ['cama_casal', 2.8, 2.95, 3], ['guarda_roupa', 3.0, 1.25, 0],
        ['cama_solteiro', 3.28, -2.82, 0], ['guarda_roupa', 1.65, -3.53, 0], ['mesa_estudo', 2.9, -1.32, 2],
        ['geladeira', -3.44, -3.47, 0], ['fogao', -2.68, -3.49, 0], ['pia', -1.7, -3.53, 0], ['armario_alto', -1.7, -3.64, 0], ['mesa_jantar', -2.55, -1.45, 0],
        ['chuveiro', 3.33, -.45, 0], ['vaso', 2.4, .5, 2], ['lavatorio', 1.62, .6, 2]]},
    C:{nome:'cozinha americana', w:7, d:8,
      comodos:[co('sala', -3.5, .6, -.4, 4), co('cozinha', -3.5, .6, -4, -.4), co('quarto', .6, 3.5, 0, 4), co('banheiro', .6, 3.5, -2, 0), co('servico', .6, 3.5, -4, -2)],
      fora:{f:[P(-1.45, 1.05), J(2.0, 1.4)], e:[J(2.3, 1.7), J(-2.3, 1.2)], d:[J(2.2, 1.2), JB(-1), J(-3, .9)], t:[J(-1.2, 1.3)]},
      dentro:[{x:.6, de:-4, ate:4, vaos:[P(-2.75, 1.0), P(-1.0), P(1.0)]}, {z:0, de:.6, ate:3.5, vaos:[]}, {z:-2, de:.6, ate:3.5, vaos:[]}],
      moveis:[['tapete', -1.75, 2.3, 1], ['sofa', -2.89, 2.3, 1], ['mesa_centro', -1.65, 2.3, 1], ['rack_tv', .33, 2.85, 3],
        ['balcao_cozinha', -2.3, -.4, 0], ['pia', -3.03, -2.35, 1], ['armario_alto', -3.15, -2.35, 1], ['geladeira', -2.96, -3.47, 0], ['fogao', -2.2, -3.49, 0], ['mesa_jantar', -1.35, -1.9, 0],
        ['cama_casal', 2.32, 2.9, 3], ['guarda_roupa', 2.5, .34, 0],
        ['chuveiro', 2.84, -1.46, 0], ['vaso', 2.0, -.4, 2], ['lavatorio', 1.36, -.3, 2],
        ['tanque', 3.04, -3.45, 3], ['maquina', 3.0, -2.62, 3]]},
    D:{nome:'loja com cozinha e banheiro', w:7.6, d:7,
      comodos:[co('loja', -3.8, 3.8, 0, 3.5), co('cozinha', -3.8, .8, -3.5, 0), co('banheiro', .8, 3.8, -3.5, -1.4), co('deposito', .8, 3.8, -1.4, 0)],
      fora:{f:[J(-1.85, 2.5, .7, 1.55), P(1.35, 1.35)], e:[J(1.9, 1.4), J(-1.8, 1.2)], d:[J(2.4, .9, 1.2, .9), JB(-2.5)], t:[J(-1.5, 1.2)]},
      dentro:[{z:0, de:-3.8, ate:3.8, vaos:[P(-1.5, 1.05), P(2.4, 1.05)]}, {x:.8, de:-3.5, ate:0, vaos:[P(-2.4)]}, {z:-1.4, de:.8, ate:3.8, vaos:[]}],
      moveis:[['balcao_loja', -2.1, 1.35, 0], ['prateleira', .55, .3, 0], ['prateleira', 3.39, 1.55, 3], ['freezer', -3.3, 2.72, 0],
        ['geladeira', -3.24, -2.97, 0], ['fogao', -2.48, -2.99, 0], ['pia', -1.5, -3.03, 0], ['mesa_jantar', -2.55, -1.15, 0],
        ['vaso', 2.15, -2.98, 0], ['chuveiro', 3.13, -2.84, 0], ['lavatorio', 2.2, -1.68, 2],
        ['caixas', 3.2, -.55, 0]]},
    E:{nome:'sobrado com 2 quartos em cima', w:6.8, d:8, sobrado:true, escada:{x0:2.2, x1:3.4, zBase:.6, zTopo:-2.8},
      comodos:[co('sala', -3.4, 3.4, .2, 4), co('cozinha', -3.4, 2.2, -4, .2)],
      comodosCima:[co('quarto', -3.4, 3.4, 1.2, 4), co('quarto', -3.4, .9, -1.6, 1.2), co('banheiro', -3.4, .9, -4, -1.6), co('corredor', .9, 2.2, -4, 1.2), co('corredor', 2.2, 3.4, -4, -2.8)],
      fora:{f:[P(-1.6, 1.05), J(1.35, 1.6)], e:[J(2.2, 1.5), J(-2, 1.2)], d:[J(2.4, 1.3)], t:[J(-1.2, 1.3)]},
      foraCima:{f:[J(-1.8, 1.4), J(1.8, 1.4)], e:[J(2.6, 1.2), J(0, 1.1), JB(-2.8)], d:[J(2.6, 1.2)], t:[J(2.4, .9)]},
      dentro:[{z:.2, de:-3.4, ate:1.2, vaos:[P(-.9, 1.9)]}],
      dentroCima:[{z:1.2, de:-3.4, ate:3.4, vaos:[P(1.55)]}, {x:.9, de:-4, ate:1.2, vaos:[P(-2.75), P(-.2)]}, {z:-1.6, de:-3.4, ate:.9, vaos:[]}],
      guardas:[{x:2.2, de:-2.8, ate:.6, nivel:0}, {x:2.2, de:-2.8, ate:.6, nivel:1}, {z:.6, de:2.2, ate:3.4, nivel:1}],
      blocos:[{x0:2.2, x1:3.4, z0:-4, z1:-2.8, nivel:0}],                 /* despensa fechada embaixo do patamar */
      moveis:[['tapete', -1.5, 2.35, 1], ['sofa', -2.79, 2.3, 1], ['mesa_centro', -1.5, 2.3, 1], ['rack_tv', 2.95, 2.55, 3],
        ['geladeira', -2.86, -3.47, 0], ['fogao', -2.1, -3.49, 0], ['pia', -1.12, -3.53, 0], ['armario_alto', -1.12, -3.64, 0], ['mesa_jantar', -1.55, -1.35, 0]],
      moveisCima:[['cama_casal', -2.2, 2.62, 1], ['guarda_roupa', 2.92, 2.75, 3], ['comoda', -.35, 3.57, 2],
        ['cama_solteiro', -2.22, .5, 1], ['guarda_roupa', -.45, .85, 2], ['mesa_estudo', -1.05, -1.28, 0],
        ['chuveiro', -2.73, -3.33, 0], ['vaso', -1.5, -3.48, 0], ['lavatorio', -.55, -1.9, 2]]},
  };
  /* a versão espelhada dobra as variações */
  function espelha(p){
    const v = l => l.map(o => ({...o, c:-o.c}));
    const sala = l => l && l.map(c => ({...c, x0:-c.x1, x1:-c.x0}));
    const fora = f => f && {f:v(f.f), t:v(f.t), e:f.d, d:f.e};
    const paredes = l => l && l.map(w => 'x' in w ? {...w, x:-w.x} : {...w, de:-w.ate, ate:-w.de, vaos:w.vaos && v(w.vaos)});
    const moveis = l => l && l.map(([n, x, z, g]) => [n, -x, z, g === 1 ? 3 : g === 3 ? 1 : g]);
    return {...p, nome:p.nome + ' (espelhada)', espelhada:true, comodos:sala(p.comodos), comodosCima:sala(p.comodosCima), fora:fora(p.fora), foraCima:fora(p.foraCima), dentro:paredes(p.dentro), dentroCima:paredes(p.dentroCima), guardas:paredes(p.guardas),
      blocos:p.blocos && p.blocos.map(b => ({...b, x0:-b.x1, x1:-b.x0})), escada:p.escada && {...p.escada, x0:-p.escada.x1, x1:-p.escada.x0}, moveis:moveis(p.moveis), moveisCima:moveis(p.moveisCima)};
  }
  const PLANTAS = {};
  for (const [k, p] of Object.entries(BASE)){ PLANTAS[k] = p; PLANTAS[k + 'm'] = espelha(p); }
  const DE_TIPO = {casa_telha:['A', 'Am', 'B', 'Bm', 'C', 'Cm'], casa_laje:['A', 'Am', 'B', 'Bm', 'C', 'Cm'], quatro_aguas:['B', 'Bm', 'C', 'Cm', 'A', 'Am'], obra:['A', 'Am', 'B', 'Bm'], comercio:['D', 'Dm'], sobrado:['E', 'Em']};
  const plantaDe = (tipo, chave) => DE_TIPO[tipo].includes(chave) ? chave : DE_TIPO[tipo][0];

  /* cores de dentro: três combinações, escolhidas pela planta */
  const ESTILOS = [
    {parede:'#EADFC6', sofa:'#2F5F9E', coberta:'#7A2E24', tapete:'#8E4A34', armario:'#D9D6CC', piso:{sala:'#9A7048', quarto:'#8A6340', cozinha:'#D8D2C2', banheiro:'#9FC4CE', servico:'#A9A59A', loja:'#C2BBA8', deposito:'#A9A59A', corredor:'#9A7048'}},
    {parede:'#D5E0D2', sofa:'#8A4A3A', coberta:'#2F6E5E', tapete:'#365C7A', armario:'#B98E62', piso:{sala:'#B9876A', quarto:'#9A7048', cozinha:'#CFC8B4', banheiro:'#D5D9DA', servico:'#A9A59A', loja:'#B5A98C', deposito:'#A9A59A', corredor:'#B9876A'}},
    {parede:'#E6D3D0', sofa:'#4A4E57', coberta:'#B98A2E', tapete:'#4F6E52', armario:'#7E98A8', piso:{sala:'#C9BFA8', quarto:'#A8815A', cozinha:'#B7B2A6', banheiro:'#B8CBB4', servico:'#A9A59A', loja:'#C9C2B0', deposito:'#A9A59A', corredor:'#A8815A'}},
  ];
  const estiloDe = chave => ESTILOS[(chave.charCodeAt(0) + (chave.length > 1 ? 1 : 0)) % 3];
  /* abandonada: parte dos móveis sumiu (a colisão usa a mesma regra do desenho) */
  const sobrou = (chave, nivel, i, nome) => ['chuveiro', 'vaso', 'pia'].includes(nome) || sorte(chave.charCodeAt(0) * 7 + chave.length, nivel * 100 + i, 91) > .26;
  const moveisDe = (chave, nivel, velha) => ((nivel ? PLANTAS[chave].moveisCima : PLANTAS[chave].moveis) || []).filter((it, i) => !velha || sobrou(chave, nivel, i, it[0]));
  /* retângulo ocupado por um móvel já girado */
  const areaDoMovel = ([nome, x, z, g]) => { const m = MOVEIS[nome], w = g % 2 ? m.d : m.w, d = g % 2 ? m.w : m.d; return {x0:x - w / 2, x1:x + w / 2, z0:z - d / 2, z1:z + d / 2, nome}; };

  /* ================================================================ paredes: pedaços cheios, vergas e peitoris */
  const LADOS = {f:{eixo:'x', s:1}, t:{eixo:'x', s:-1}, d:{eixo:'z', s:1}, e:{eixo:'z', s:-1}};
  /* divide uma parede em trechos: cheio, porta ou janela */
  function trechos(de, ate, vaos){
    const out = []; let a = de;
    for (const v of [...vaos].sort((p, q) => p.c - q.c)){
      const ini = v.c - v.l / 2, fim = v.c + v.l / 2;
      if (ini > a + .001) out.push({a, b:ini, tipo:'cheio'});
      out.push({a:ini, b:fim, tipo:v.porta ? 'porta' : 'janela', v});
      a = fim;
    }
    if (ate > a + .001) out.push({a, b:ate, tipo:'cheio'});
    return out;
  }

  /* ---------------------------------------------------------- colisão: retângulos no plano, por andar */
  const colisoes = new Map();
  function paredes(chave, nivel, velha){
    const id = `${chave}|${nivel}|${velha ? 1 : 0}`;
    if (!colisoes.has(id)){
      const p = PLANTAS[chave], out = [], hw = p.w / 2, hd = p.d / 2;
      const fora = nivel ? p.foraCima : p.fora;
      for (const [lado, {eixo, s}] of Object.entries(LADOS)){
        const meio = eixo === 'x' ? hw : hd;
        for (const t of trechos(-meio, meio, fora[lado] || [])){
          if (t.tipo === 'porta') continue;
          out.push(eixo === 'x' ? {x0:t.a, x1:t.b, z0:s * hd - (s > 0 ? .18 : 0), z1:s * hd + (s > 0 ? 0 : .18), tipo:'parede'} : {x0:s * hw - (s > 0 ? .18 : 0), x1:s * hw + (s > 0 ? 0 : .18), z0:t.a, z1:t.b, tipo:'parede'});
          out[out.length - 1].fora = true;
        }
      }
      for (const w of (nivel ? p.dentroCima : p.dentro) || []) for (const t of trechos(w.de, w.ate, w.vaos)){
        if (t.tipo === 'porta') continue;
        out.push('x' in w ? {x0:w.x - .06, x1:w.x + .06, z0:t.a, z1:t.b, tipo:'parede'} : {x0:t.a, x1:t.b, z0:w.z - .06, z1:w.z + .06, tipo:'parede'});
      }
      for (const w of p.guardas || []) if (w.nivel === nivel) out.push('x' in w ? {x0:w.x - .05, x1:w.x + .05, z0:w.de, z1:w.ate, tipo:'guarda'} : {x0:w.de, x1:w.ate, z0:w.z - .05, z1:w.z + .05, tipo:'guarda'});
      for (const b of p.blocos || []) if (b.nivel === nivel) out.push({...b, tipo:'bloco'});
      for (const it of moveisDe(chave, nivel, velha)) if (!MOVEIS[it[0]].solto) out.push({...areaDoMovel(it), tipo:'movel'});
      colisoes.set(id, out);
    }
    return colisoes.get(id);
  }

  /* ================================================================ desenho. b(x, y, z, larg, alt, prof, cor, px, claro, chao) */
  function paredeExterna(g, lado, chave, nivel, velha, corFora, estilo){
    const p = PLANTAS[chave], {eixo, s} = LADOS[lado], hw = p.w / 2, hd = p.d / 2, meio = eixo === 'x' ? hw : hd, y0 = nivel * ANDAR;
    const lista = (nivel ? p.foraCima : p.fora)[lado] || [];
    /* ao = posição ao longo da parede; fundo = distância para dentro a partir da face externa */
    const caixa = (a, b, ya, yb, de, ate, cor, px = .55, claro = 1) => {
      if (b - a < .005 || yb - ya < .005) return;
      const c = s * ((eixo === 'x' ? hd : hw) - (de + ate) / 2), larg = ate - de;
      if (eixo === 'x') g.b((a + b) / 2, y0 + ya, c, b - a, yb - ya, larg, cor, px, claro); else g.b(c, y0 + ya, (a + b) / 2, larg, yb - ya, b - a, cor, px, claro);
    };
    const pedaco = (a, b, ya, yb) => { caixa(a, b, ya, yb, 0, .12, corFora, corFora === TIJOLO ? .3 : .55); caixa(a, b, ya, yb, .12, .18, corFora === TIJOLO ? '#B4654A' : estilo.parede, .7); };
    trechos(-meio, meio, lista).forEach((t, i) => {
      if (t.tipo === 'cheio'){ pedaco(t.a, t.b, 0, ALT); if (!nivel && corFora === 'pintura') caixa(t.a, t.b, 0, .45, -.012, .002, 'pintura', .55, .72); return; }
      const v = t.v;
      if (t.tipo === 'porta'){
        pedaco(t.a, t.b, 2.2, ALT);
        if (corFora !== TIJOLO){ caixa(t.a - .07, t.a, 0, 2.27, -.025, .2, MOLDURA, 0); caixa(t.b, t.b + .07, 0, 2.27, -.025, .2, MOLDURA, 0); caixa(t.a, t.b, 2.2, 2.27, -.025, .2, MOLDURA, 0); }
        if (!opcoes.semFolhas && lado === 'f' && !nivel && corFora !== TIJOLO) g.b(t.b - .035, 0, hd - .62, .06, 2.12, .86, p.nome.startsWith('loja') ? VIDRO : PORTA, .45);      /* folha aberta para dentro */
        return;
      }
      pedaco(t.a, t.b, 0, v.sill); pedaco(t.a, t.b, v.sill + v.h, ALT);
      if (!nivel && corFora === 'pintura') caixa(t.a, t.b, 0, .45, -.012, .002, 'pintura', .55, .72);
      if (corFora === TIJOLO) return;
      caixa(t.a - .06, t.b + .06, v.sill - .07, v.sill, -.07, .2, MOLDURA, 0);
      for (const [a, b] of [[t.a - .03, t.a + .04], [t.b - .04, t.b + .03], ...(opcoes.semFolhas ? [] : [[v.c - .025, v.c + .025]])]) caixa(a, b, v.sill, v.sill + v.h, .02, .09, MOLDURA, 0);
      caixa(t.a, t.b, v.sill + v.h, v.sill + v.h + .05, -.01, .12, MOLDURA, 0);
      if (!opcoes.semFolhas && (!velha || sorte(i, s + 3, nivel) > .4)) caixa(t.a, t.b, v.sill + v.h * .55, v.sill + v.h * .55 + .04, .03, .08, MOLDURA, 0);
      if (velha && v.l > .8){ if (sorte(i, 7, s + nivel) < .6){ caixa(t.a - .14, t.b + .1, v.sill + v.h * .68, v.sill + v.h * .68 + .14, -.05, -.005, TABUA, .3); caixa(t.a - .08, t.b + .16, v.sill + v.h * .24, v.sill + v.h * .24 + .14, -.056, -.008, TABUA, .3); } }
    });
    /* abandonada: manchas na parede cheia e mato no pé, sem tampar portas */
    if (velha && !nivel) trechos(-meio, meio, lista).filter(t => t.tipo === 'cheio' && t.b - t.a > .5).forEach((t, i) => {
      const lg = Math.min(t.b - t.a - .2, .3 + sorte(i, s, 5) * .6), a = t.a + .1 + sorte(i, 3, s) * (t.b - t.a - .2 - lg), ya = .5 + sorte(i, 9, s) * 1.4;
      caixa(a, a + lg, ya, ya + .2 + sorte(i, 11) * .5, -.014 - i * .001, 0, i % 2 ? '#7C7260' : '#56503F', 0);
      caixa(a, a + .26, 0, .2 + sorte(i, 13, s) * .5, -.34, -.1, MATO, 0);
    });
  }
  function paredesInternas(g, chave, nivel, estilo, tijolo){
    const p = PLANTAS[chave], y0 = nivel * ANDAR, cor = tijolo ? '#B4654A' : estilo.parede;
    for (const w of (nivel ? p.dentroCima : p.dentro) || []){
      /* as pontas encostam nas paredes de fora sem atravessar */
      const limite = ('x' in w ? p.d : p.w) / 2 - .18, de = Math.max(w.de, -limite), ate = Math.min(w.ate, limite);
      const caixa = (a, b, ya, yb, esp, c, px = .7) => { if (b - a < .005) return; if ('x' in w) g.b(w.x, y0 + ya, (a + b) / 2, esp, yb - ya, b - a, c, px); else g.b((a + b) / 2, y0 + ya, w.z, b - a, yb - ya, esp, c, px); };
      for (const t of trechos(de, ate, w.vaos)){
        if (t.tipo === 'cheio') caixa(t.a, t.b, 0, ALT, .118, cor, tijolo ? .3 : .7);
        else { caixa(t.a, t.b, 2.2, ALT, .118, cor, tijolo ? .3 : .7); if (!tijolo && t.v.l < 1.2){ caixa(t.a - .02, t.a + .05, 0, 2.22, .15, MADEIRA2, 0); caixa(t.b - .05, t.b + .02, 0, 2.22, .15, MADEIRA2, 0); caixa(t.a, t.b, 2.18, 2.24, .15, MADEIRA2, 0); } }
      }
    }
  }
  function pisos(g, comodos, chave, y0, velha, estilo, obra){
    comodos.forEach((c, i) => {
      const cor = obra ? '#8F8A80' : estilo.piso[c.tipo] || '#A9A59A', ladrilho = c.tipo === 'cozinha' || c.tipo === 'banheiro';
      g.b((c.x0 + c.x1) / 2, y0, (c.z0 + c.z1) / 2, c.x1 - c.x0, PISO + i * .0006, c.z1 - c.z0, cor, ladrilho ? .42 : .5);
      if (!obra && (c.tipo === 'sala' || c.tipo === 'quarto' || c.tipo === 'corredor')) for (let x = c.x0 + .45; x < c.x1 - .2; x += .45) g.b(x, y0 + PISO + .002, (c.z0 + c.z1) / 2, .018, .003, c.z1 - c.z0 - .1, cor, 0, .82);       /* réguas */
      if (!obra && ladrilho){ for (let x = c.x0 + .42; x < c.x1 - .2; x += .42) g.b(x, y0 + PISO + .002, (c.z0 + c.z1) / 2, .016, .003, c.z1 - c.z0 - .1, '#8C8A82', 0); for (let z = c.z0 + .42; z < c.z1 - .2; z += .42) g.b((c.x0 + c.x1) / 2, y0 + PISO + .0035, z, c.x1 - c.x0 - .1, .003, .016, '#8C8A82', 0); }
      if (velha) for (let k = 0; k < 3; k++){ const x = c.x0 + .3 + sorte(i, k, 41) * Math.max(.1, c.x1 - c.x0 - .8), z = c.z0 + .3 + sorte(i, k, 43) * Math.max(.1, c.z1 - c.z0 - .8); g.b(x, y0 + PISO + .006 + k * .001, z, .18 + sorte(i, k, 45) * .4, .004, .14 + sorte(i, k, 47) * .35, k ? '#6A5C46' : '#4E4535', 0); if (k === 2) for (let n = 0; n < 5; n++) g.b(x + (sorte(n, i, 49) - .5) * .7, y0 + PISO, z + (sorte(n, i, 51) - .5) * .6, .09, .04 + sorte(n, i) * .07, .08, [TIJOLO, REBOCO, TABUA][n % 3], 0); }
    });
  }
  function mobilia(g, chave, nivel, velha, estilo){
    const y0 = nivel * ANDAR + PISO;
    moveisDe(chave, nivel, velha).forEach(([nome, x, z, giro]) => {
      /* gira o móvel em passos de 90°: 0 = frente para +z, 1 = +x, 2 = -z, 3 = -x */
      const b = (mx, my, mz, w, h, d, cor, claro = 1) => {
        const [rx, rz] = giro === 1 ? [mz, -mx] : giro === 2 ? [-mx, -mz] : giro === 3 ? [-mz, mx] : [mx, mz];
        g.b(x + rx, y0 + my + (nome === 'tapete' ? .006 : 0), z + rz, giro % 2 ? d : w, h, giro % 2 ? w : d, velha && cor[0] === '#' ? cor : cor, .4, claro * (velha ? .88 : 1));
      };
      MOVEIS[nome].desenhar(b, estilo, velha);
    });
  }
  /* telha colonial: base em degraus e, por cima, fileiras de capas que descem a água, com tons de telha velha */
  const CAPAS = ['#B25A3B', '#A85032', '#BC6845', '#94462F', '#A4573C', '#86503C'];
  function capas(g, x0, x1, y, z, fundo, sem){
    const n = Math.max(1, Math.round((x1 - x0) / .36)), l = (x1 - x0) / n;
    for (let i = 0; i < n; i++){ const r = sorte(i, sem, 17); g.b(x0 + (i + .5) * l, y, z, l * .52, .07 + (r > .85 ? .012 : 0), fundo, CAPAS[Math.floor(r * 6)], 0); }
  }
  function capasLado(g, z0, z1, y, x, fundo, sem){
    const n = Math.max(1, Math.round((z1 - z0) / .36)), l = (z1 - z0) / n;
    for (let i = 0; i < n; i++){ const r = sorte(i, sem, 19); g.b(x, y, z0 + (i + .5) * l, fundo, .07, l * .52, CAPAS[Math.floor(r * 6)], 0); }
  }
  /* telhado em degraus; duas águas com a cumeeira ao longo de X */
  function telhado(g, y, w, d, alt){
    const n = 7, h = alt / n;
    g.b(0, y - .03, 0, w - .04, .06, d + .08, '#D8D2C4', 0, 1, true);                /* forro do beiral */
    for (let i = 0; i < n; i++){
      const fundo = d * (1 - i / n) + .12, prox = i + 1 < n ? d * (1 - (i + 1) / n) + .12 : .1, faixa_ = (fundo - prox) / 2;
      g.b(0, y + i * h, 0, w, h + .01, fundo, i % 2 ? '#8F442F' : '#99492F', .6, 1, false);
      for (const s of [-1, 1]) capas(g, -w / 2, w / 2, y + (i + 1) * h + .008, s * (prox + faixa_) / 2, faixa_, i * 3 + s);
    }
    g.b(0, y + alt + .05, 0, w + .06, .12, .24, '#B96A48', .36);
  }
  function quatroAguas(g, y, w, d, alt){
    const n = 7, h = alt / n, L = i => w * (1 - i / n * .82) + .1, P = i => d * (1 - i / n) + .12;
    g.b(0, y - .03, 0, w + .06, .06, d + .08, '#D8D2C4', 0, 1, true);
    for (let i = 0; i < n; i++){
      const larg = L(i), fundo = P(i), pl = i + 1 < n ? L(i + 1) : L(n), pf = i + 1 < n ? P(i + 1) : .1, fz = (fundo - pf) / 2, fx = (larg - pl) / 2;
      g.b(0, y + i * h, 0, larg, h + .01, fundo, i % 2 ? '#8F442F' : '#99492F', .6);
      for (const s of [-1, 1]){ capas(g, -pl / 2, pl / 2, y + (i + 1) * h + .008, s * (pf + fz) / 2, fz, i * 5 + s); capasLado(g, -fundo / 2, fundo / 2, y + (i + 1) * h + .006, s * (pl + fx) / 2, fx, i * 7 + s); }
    }
    g.b(0, y + alt + .05, 0, L(n) + .06, .12, .24, '#B96A48', .36);
  }
  function caixaDagua(g, x, y, z){ for (const dx of [-.3, .3]) g.b(x + dx, y, z, .1, .35, .5, LAJE, 0); g.b(x, y + .35, z, .95, .6, .7, '#2F6FB5', .3); g.b(x, y + .35, z, .7, .6, .95, '#2F6FB5', .3); g.b(x, y + .95, z, .8, .1, .8, '#27598F', 0); }
  function platibanda(g, w, d, y, claro){ for (const [x, z, a, b] of [[0, d / 2 - .08, w + .3, .16], [0, -d / 2 + .08, w + .3, .16], [w / 2 + .07, 0, .16, d + .1], [-w / 2 - .07, 0, .16, d + .1]]) g.b(x, y, z, a, .5, b, 'pintura', .55, claro); }
  function degraus(g, p){
    const porta = p.fora.f.find(v => v.porta), larg = Math.max(DEGRAU.largura, porta.l + .5);
    for (let i = 0; i < DEGRAU.quantos; i++) g.b(porta.c, -3, p.d / 2 + (i + .5) * DEGRAU.fundo, larg, 3 + PISO - i * DEGRAU.altura, DEGRAU.fundo + .01, i % 2 ? '#8C877C' : '#98938A', .5);
  }

  function fachada(g, tipo, chave, velha){
    const p = PLANTAS[chave], hw = p.w / 2, z = p.d / 2, sem = chave.charCodeAt(0) * 3 + chave.length + tipo.length;
    const cheios = trechos(-hw, hw, p.fora.f).filter(t => t.tipo === 'cheio');
    /* mancha de umidade e barro no pé da parede, com a borda irregular */
    for (const t of cheios) for (let x = t.a; x < t.b - .05; x += .3){ const lg = Math.min(.3, t.b - x), r = sorte(Math.round(x * 10), sem, 23); g.b(x + lg / 2, 0, z + .014, lg + .005, .14 + r * r * .42, .014, r > .6 ? '#8C8072' : '#9B8F80', 0); }
    if (tipo === 'comercio') return;
    /* caixa de luz com o visor, perto de um canto */
    const canto = cheios.slice().sort((a, b) => (b.b - b.a) - (a.b - a.a))[0];
    if (canto && canto.b - canto.a > .55){ const x = canto.a + .3; g.b(x, .95, z + .04, .34, .48, .08, '#D9D8D2', 0); g.b(x, 1.17, z + .085, .2, .15, .012, '#3A4650', 0); g.b(x, 1.43, z + .05, .05, 1.4, .05, '#6E7075', 0); }
    /* cobogó: blocos vazados de cerâmica, no alto da parede */
    const livre_ = cheios.filter(t => t.b - t.a > 1.15)[0];
    if (livre_ && sem % 3 !== 1){ const x0 = (livre_.a + livre_.b) / 2 - .45; g.b(x0 + .45, 1.93, z + .012, .96, .52, .014, '#4A2B20', 0); for (let i = 0; i <= 6; i++) g.b(x0 + i * .15, 1.93, z + .032, .035, .52, .04, '#B5603F', 0); for (let j = 0; j <= 3; j++) g.b(x0 + .45, 1.93 + j * .163, z + .036, .94, .032, .04, '#B5603F', 0); }
    /* revestimento em filetes, em parte das casas */
    if (tipo === 'sobrado' || sem % 4 === 0) for (const t of cheios) for (let y = .62; y < ALT - .1; y += .17){ g.b((t.a + t.b) / 2, y, z + .017, t.b - t.a - .06, .012, .008, '#9C9488', 0); for (let x = t.a + .1 + ((Math.round(y * 6) % 2) * .17); x < t.b - .1; x += .34) g.b(x, y, z + .019, .012, .17, .008, '#9C9488', 0); }
  }

  /* partes de uma casa: 'casco' (paredes de fora), 'dentro' (piso, paredes internas e móveis do térreo),
     'cima' (andar de cima do sobrado), 'teto' (telhado ou laje) e 'longe' (versão simples, vista à distância) */
  function desenhar(tipo, chave, parte, g, velha){
    const p = PLANTAS[chave], {w, d} = p, estilo = estiloDe(chave), obra = tipo === 'obra', cor = obra ? TIJOLO : 'pintura', v = velha && !obra;
    const topo = p.sobrado ? ANDAR + ALT : ALT;
    if (parte === 'casco'){
      g.b(0, -3, 0, w - .02, 3.002, d - .02, '#8C877C', 1.2);
      for (const lado of ['f', 't', 'e', 'd']) paredeExterna(g, lado, chave, 0, v, cor, estilo);
      degraus(g, p);
      if (!obra) fachada(g, tipo, chave, velha);
      if (tipo === 'comercio'){ g.b(0, 2.38, d / 2 + .09, w - .8, .46, .12, velha ? '#8A8478' : '#C4361C', .4); for (let x = -w / 2 + .8; x < w / 2 - .7; x += .62) g.b(x, 2.5, d / 2 + .16, .38, .22, .03, MOLDURA, 0); for (let i = 0; i < 12; i++) if (!velha || sorte(i, 21) > .35) g.b(-w / 2 + .35 + i * ((w - .7) / 11), 2.28, d / 2 + .55, (w - .7) / 12, .09, .95, i % 2 ? '#2F6E4F' : MOLDURA, 0); }
      if (tipo === 'quatro_aguas') for (const x of [-w / 2 + .2, w / 2 - .2]) g.b(x, -.6, d / 2 + .75, .18, ALT + .6, .18, MOLDURA, 0);
      if (obra){ for (const x of [-w / 2, 0, w / 2]) for (const z of [-d / 2 - .02, d / 2 + .02]) if (x || z < 0) g.b(x * .985, 0, z * .99, .24, ALT + .1, .22, REBOCO, .4); g.b(w / 2 - .8, -.4, d / 2 + .9, 1.1, .75, .8, '#C2A877', .2); }
      return;
    }
    if (parte === 'dentro'){
      pisos(g, p.comodos, chave, 0, velha && !obra, estilo, obra);
      paredesInternas(g, chave, 0, estilo, obra);
      if (!obra) mobilia(g, chave, 0, velha, estilo);
      else for (let i = 0; i < 14; i++){ const c = p.comodos[i % p.comodos.length]; g.b(c.x0 + .5 + sorte(i, 61) * (c.x1 - c.x0 - 1), PISO, c.z0 + .45 + sorte(i, 63) * (c.z1 - c.z0 - .9), .12 + sorte(i, 65) * .26, .06 + sorte(i, 67) * .1, .14, i % 3 ? TIJOLO : '#C2A877', .2); }
      if (p.sobrado){
        const e = p.escada, n = 14, cx = (e.x0 + e.x1) / 2;
        for (let i = 0; i < n; i++){ const z = e.zBase - (i + .5) * (e.zBase - e.zTopo) / n; g.b(cx, PISO, z, e.x1 - e.x0 - .3, (i + 1) * ANDAR / n, (e.zBase - e.zTopo) / n + .01, i % 2 ? MADEIRA : MADEIRA2, .4); }
        for (const w_ of p.guardas) if (w_.nivel === 0){ for (let z = w_.de + .1; z < w_.ate; z += .4){ const sobe = Math.max(0, Math.min(1, (e.zBase - z) / (e.zBase - e.zTopo))) * ANDAR; g.b(w_.x, PISO, z, .05, .92 + sobe, .05, '#4A4E55', 0); } }
        for (const b of p.blocos || []) g.b((b.x0 + b.x1) / 2, PISO, (b.z0 + b.z1) / 2, b.x1 - b.x0 - .25, ANDAR - .2, b.z1 - b.z0 - .2, estilo.parede, .7, .94);
      }
      return;
    }
    if (parte === 'cima'){
      if (!p.sobrado) return;
      const e = p.escada, y = ANDAR;
      /* laje entre os andares, com o buraco da escada */
      const laje = (x0, x1, z0, z1) => { if (x1 - x0 > .02 && z1 - z0 > .02) g.b((x0 + x1) / 2, y - .1, (z0 + z1) / 2, x1 - x0, .095, z1 - z0, '#D9D6CC', .9, 1, true); };
      const dentroX = w / 2 - .18, dentroZ = d / 2 - .18;
      laje(-dentroX, Math.min(e.x0, e.x1), -dentroZ, dentroZ); laje(Math.max(e.x0, e.x1), dentroX, -dentroZ, dentroZ); laje(Math.max(-dentroX, e.x0), Math.min(dentroX, e.x1), -dentroZ, e.zTopo); laje(Math.max(-dentroX, e.x0), Math.min(dentroX, e.x1), e.zBase, dentroZ);
      g.b(0, y - .12, d / 2 + .01, w + .12, .18, .1, MOLDURA, 0); g.b(0, y - .12, -d / 2 - .01, w + .12, .18, .1, MOLDURA, 0); for (const s of [-1, 1]) g.b(s * (w / 2 + .01), y - .12, 0, .1, .18, d + .12, MOLDURA, 0);
      pisos(g, p.comodosCima, chave, y, velha, estilo, false);
      for (const lado of ['f', 't', 'e', 'd']) paredeExterna(g, lado, chave, 1, v, cor, estilo);
      paredesInternas(g, chave, 1, estilo, false);
      mobilia(g, chave, 1, velha, estilo);
      for (const w_ of p.guardas) if (w_.nivel === 1){ if ('x' in w_){ for (let z = w_.de + .15; z <= w_.ate; z += .32) g.b(w_.x, y + PISO, z, .05, .95, .05, '#4A4E55', 0); g.b(w_.x, y + 1.0, (w_.de + w_.ate) / 2, .08, .07, w_.ate - w_.de, MADEIRA2, 0); } else { for (let x = w_.de + .15; x < w_.ate - .05; x += .3) g.b(x, y + PISO, w_.z, .05, .95, .05, '#4A4E55', 0); g.b((w_.de + w_.ate) / 2, y + 1.0, w_.z, w_.ate - w_.de, .07, .08, MADEIRA2, 0); } }
      return;
    }
    if (parte === 'teto'){
      if (tipo === 'casa_telha') telhado(g, ALT, w + .6, d + .6, 1.6);
      else if (tipo === 'quatro_aguas') quatroAguas(g, ALT, w + .8, d + 1.5, 1.7);
      else {
        g.b(0, topo, 0, w + .3, .16, d + .3, obra ? REBOCO : LAJE, .7, 1, true);
        if (!obra){ platibanda(g, w, d, topo + .16, tipo === 'comercio' ? .8 : .86); if (tipo !== 'comercio') caixaDagua(g, -w / 4, topo + .16, -d / 4); if (tipo === 'casa_laje'){ g.b(w / 4, topo + .16, -d / 3, .1, 1.5, .1, '#9AA0A8', 0); g.b(w / 4, topo + 1.5, -d / 3, .9, .05, .05, '#9AA0A8', 0); } }
        else { for (const x of [-w / 2 + .2, 0, w / 2 - .2]) for (const z of [-d / 2 + .15, d / 2 - .15]) for (const dx of [-.06, .06]) g.b(x + dx, topo + .16, z, .03, .75, .03, FERRUGEM, 0); for (let l = 0; l < 4; l++) g.b(1.2 - l * .1, topo + .16 + l * .2, -d / 4, 2.6 - l * .55, .2, .2, TIJOLO, .25); }
      }
      return;
    }
    /* longe: caixas lisas */
    g.b(0, -1, 0, w, 1 + topo, d, cor, 0);
    if (tipo === 'casa_telha') for (let i = 0; i < 3; i++) g.b(0, ALT + i * .53, 0, w + .5, .55, (d + .6) * (1 - i / 3), TELHA, 0);
    else if (tipo === 'quatro_aguas') for (let i = 0; i < 3; i++) g.b(0, ALT + i * .56, 0, (w + .8) * (1 - i * .27), .58, (d + 1.4) * (1 - i / 3), TELHA, 0);
    else { g.b(0, topo, 0, w + .3, .2, d + .3, LAJE, 0); if (!obra && tipo !== 'comercio') g.b(-w / 4, topo + .2, -d / 4, .9, .8, .9, '#2F6FB5', 0); }
  }
  const alturaTotal = tipo => tipo === 'sobrado' ? 6.9 : 4.5;

  /* ================================================================ posição dentro da casa */
  /* do mundo para o referencial da casa (a, b) e de volta */
  const paraLocal = (o, x, z) => { const c = Math.cos(o.rot), s = Math.sin(o.rot), dx = x - o.x, dz = z - o.z; return [dx * c - dz * s, dx * s + dz * c]; };
  const paraMundo = (o, a, b) => { const c = Math.cos(o.rot), s = Math.sin(o.rot); return [o.x + a * c + b * s, o.z - a * s + b * c]; };
  /* altura do chão sob o ponto (a, b) da casa o; devolve null se o ponto não é da casa nem dos degraus */
  function chaoLocal(o, a, b, nivel){
    const p = PLANTAS[o.planta];
    if (Math.abs(a) <= p.w / 2 && Math.abs(b) <= p.d / 2){
      const e = p.escada;
      if (e && a > e.x0 && a < e.x1 && b <= e.zBase && b >= e.zTopo){ const t = (e.zBase - b) / (e.zBase - e.zTopo); return {y:o.y + PISO + t * ANDAR, nivel:t > .5 ? 1 : 0, dentro:true, escada:true}; }
      return {y:o.y + PISO + (p.sobrado && nivel ? ANDAR : 0), nivel:p.sobrado ? nivel : 0, dentro:true};
    }
    const porta = p.fora.f.find(v => v.porta);
    if (b > p.d / 2 && b < p.d / 2 + DEGRAU.quantos * DEGRAU.fundo && Math.abs(a - porta.c) < Math.max(DEGRAU.largura, porta.l + .5) / 2){
      const i = Math.floor((b - p.d / 2) / DEGRAU.fundo);
      return {y:o.y + PISO - i * DEGRAU.altura, nivel:0, dentro:false, degrau:true};
    }
    return null;
  }
  /* empurra um círculo para fora dos retângulos (paredes e móveis) */
  function afasta(rects, a, b, raio = RAIO){
    for (let vez = 0; vez < 3; vez++){
      let mexeu = false;
      for (const r of rects){
        const px = Math.max(r.x0, Math.min(r.x1, a)), pz = Math.max(r.z0, Math.min(r.z1, b)), dx = a - px, dz = b - pz, d = Math.hypot(dx, dz);
        if (d >= raio) continue;
        if (d > 1e-5){ a = px + dx / d * raio; b = pz + dz / d * raio; }
        else { const saidas = [[a - r.x0 + raio, -1, 0], [r.x1 - a + raio, 1, 0], [b - r.z0 + raio, 0, -1], [r.z1 - b + raio, 0, 1]].sort((m, n) => m[0] - n[0])[0]; a += saidas[1] * saidas[0]; b += saidas[2] * saidas[0]; }
        mexeu = true;
      }
      if (!mexeu) break;
    }
    return [a, b];
  }

  return {opcoes, ALT, PISO, ANDAR, RAIO, DEGRAU, PLANTAS, DE_TIPO, MOVEIS, plantaDe, desenhar, paredes, moveisDe, areaDoMovel, alturaTotal, chaoLocal, paraLocal, paraMundo, afasta, trechos};
})();
