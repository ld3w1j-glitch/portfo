/* Pintura e volume da cabeça. Grade 14 x 13 x 20: i = lado, j = profundidade (0 = frente), k = altura.
   n = direção da face [x, y, z]. As funções devolvem o nome de um material. */
function pintarCabeca(c, i, j, k, n){
  const u = i + .5 - 7, a = Math.abs(u);
  const frente = n[1] < 0, lado = n[0] !== 0, tras = n[1] > 0, cima = n[2] > 0, baixo = n[2] < 0;
  if (k <= 2) return 'pele_sombra';
  if (i === 0 || i === 13) return (lado && (k === 8 || k === 9)) ? 'orelha' : 'pele';
  const cab = pintarCabelo(c.cabelo.estilo, a, j, k, {frente, lado, tras, cima});
  if (cab) return cab;
  if (baixo) return (j <= 4 && k <= 7) ? (barbaEm(c.barba.estilo, a, 3, 1) || 'pele_sombra') : 'pele_sombra';
  if (frente && j <= 1) return pintarFrente(c, a, k);
  if (lado) return barbaLado(c.barba.estilo, j, k) || 'pele';
  return 'pele';
}

function pintarCabelo(estilo, a, j, k, f){
  if (estilo === 'careca') return null;
  if (CABELOS_NOVOS[estilo]) return CABELOS_NOVOS[estilo].pintar(a, j, k, f);
  const naFrente = f.frente && j <= 1;
  const linha = naFrente && (k >= 17 || (k === 16 && a >= 3.5) || (a >= 5.5 && k >= 14));
  /* degraus do alto da cabeça que olham para a frente, atrás da linha da testa */
  if (f.frente && j > 1 && k >= 15) return estilo === 'raspado' || (estilo === 'moicano' && a >= 2) ? 'raspado' : 'cabelo';
  if (estilo === 'raspado'){
    if (f.cima && k >= 15) return 'raspado';
    if (naFrente) return linha ? 'raspado' : null;
    if ((f.lado && ((k >= 14) || (j >= 6 && k >= 11))) || (f.tras && k >= 10)) return 'raspado';
    return null;
  }
  if (estilo === 'moicano'){
    if (a < 2 && (f.cima && k >= 15 || naFrente && k >= 17 || f.tras && k >= 10)) return 'cabelo';
    if (f.cima && k >= 15) return 'raspado';
    if ((f.lado && k >= 14) || (f.tras && k >= 12) || linha) return 'raspado';
    return null;
  }
  const cheio = estilo === 'crespo' || estilo === 'longo' || estilo === 'topete' || estilo === 'coque';
  if (f.cima && k >= 15) return 'cabelo';
  if (naFrente) return linha ? (a >= 5.5 && k < 16 && !cheio ? 'fade' : 'cabelo') : null;
  if (cheio){
    if (f.lado && (k >= 13 || (j >= 7 && k >= 9))) return 'cabelo';
    if (f.tras && k >= 8) return 'cabelo';
    return null;
  }
  /* curto com degradê */
  if (f.lado){
    if (k >= 15) return 'cabelo';
    if (k >= 12) return (j >= 5 || k >= 14) ? 'fade' : null;
    if (j >= 8 && k >= 9) return k >= 10 ? 'fade' : 'fade_claro';
    return null;
  }
  if (f.tras) return k >= 14 ? 'cabelo' : k >= 11 ? 'fade' : k >= 9 ? 'fade_claro' : null;
  return null;
}

/* barba na face da frente: a = distância do meio, k = altura (3 = queixo, 6 = bigode) */
function barbaEm(estilo, a, k){
  const q = a < 1, m = a < 2;
  if (estilo === 'washington'){
    if (a >= 5.5) return k <= 7 ? 'barba' : (k <= 10 ? 'barba_rala' : null);
    if (k === 7) return a > 4 ? 'barba_rala' : null;
    if (k === 6) return a < 3 ? 'barba' : (a > 4 ? 'barba_rala' : null);
    if (k === 5) return m ? null : 'barba';
    if (k === 4) return q ? 'barba_rala' : (m ? null : 'barba');
    return k === 3 ? 'barba' : null;
  }
  if (estilo === 'cheia'){
    if (k <= 4) return 'barba';
    if (k === 5) return m ? null : 'barba';
    if (k === 6) return 'barba';
    if (k === 7) return a >= 3 ? 'barba' : null;
    if (k === 8) return a >= 4 ? 'barba' : null;
    return (a >= 5.5 && k <= 11) ? 'barba' : null;
  }
  if (estilo === 'cavanhaque'){
    if (k === 6) return a < 3 ? 'barba' : null;
    if (k === 5) return (a >= 2 && a < 3) ? 'barba' : null;
    return (k <= 4 && a < 3) ? 'barba' : null;
  }
  if (estilo === 'bigode') return (k === 6 && a < 4) ? 'barba' : null;
  if (estilo === 'porfazer'){
    if (k === 5 && m) return null;
    if (k <= 6) return 'barba_sombra';
    return (a >= 4.5 && k <= 9) ? 'barba_sombra' : null;
  }
  return null;
}

function barbaLado(estilo, j, k){
  if (estilo === 'washington'){
    if (k >= 3 && k <= 6 && j <= 6) return (k <= 4 || j <= 3) ? 'barba' : 'barba_rala';
    if ((k === 7 || k === 8) && j >= 3 && j <= 5) return j >= 4 ? 'barba' : 'barba_rala';
    return (k >= 9 && k <= 11 && j >= 4 && j <= 5) ? 'barba_rala' : null;
  }
  if (estilo === 'cheia') return (k >= 3 && k <= 11 && j <= 6 && !(k > 8 && j < 3)) ? 'barba' : null;
  if (estilo === 'porfazer') return (k >= 3 && k <= 9 && j <= 6) ? 'barba_sombra' : null;
  return null;
}

function pintarFrente(c, a, k){
  const m = a < 2, s = c.sobrancelha.estilo;
  if (s === 'grossas'){ if (k === 12 && a > .9 && a < 4.6) return 'sobrancelha'; if (k === 11 && a > 3.9 && a < 4.6) return 'sobrancelha'; }
  if (s === 'finas' && k === 12 && a > .9 && a < 4) return 'sobrancelha';
  if (s === 'bravas'){ if (k === 11 && a > .9 && a < 2) return 'sobrancelha'; if (k === 12 && a > 1.9 && a < 4.6) return 'sobrancelha'; }
  if (k === 10){
    if (a > 2 && a < 3) return 'iris';
    return (a > 1 && a < 4) ? 'branco' : 'pele';
  }
  /* boca, por cima da barba */
  const b = c.boca;
  if (b === 'neutra' && k === 5 && m) return 'labio';
  if (b === 'seria' && k === 5 && m) return 'labio_escuro';
  if (b === 'sorriso'){ if (k === 5 && a < 2) return 'dente'; if ((k === 6 && a > 2 && a < 3) || (k === 4 && m)) return 'labio'; }
  if (b === 'aberta'){ if ((k === 5 || k === 4) && a < 1) return 'boca'; if ((k === 5 || k === 4) && a < 2) return 'labio'; }
  const barba = barbaEm(c.barba.estilo, a, k);
  if (barba) return barba;
  if (k === 9) return (a > 1 && a < 4) ? 'olheira' : (a < 1 ? 'pele_luz' : 'pele');
  if (k === 8 && a < 1) return 'pele_luz';
  if (k === 7 && a >= 1 && a < 2) return 'pele_sombra';
  return 'pele';
}

/* blocos extras que dão volume ao cabelo: Map "i,j,k" -> [i,j,k] */
function volumeCabelo(estilo, cheios){
  const extra = new Map(), tem = (i, j, k) => cheios.has(`${i},${j},${k}`);
  const por = (i, j, k) => { if (!tem(i, j, k)) extra.set(`${i},${j},${k}`, [i, j, k]); };
  const lista = [...cheios].map(s => s.split(',').map(Number));
  const DIRS = [[1,0,0],[-1,0,0],[0,1,0],[0,0,1],[0,-1,0]];
  /* casca em volta do alto e de trás da cabeça, sem cobrir o rosto */
  const casca = (base, aceita) => base.forEach(([i, j, k]) => DIRS.forEach(([x, y, z]) => {
    const p = [i + x, j + y, k + z];
    if (!tem(...p) && aceita(p[0], p[1], p[2])) por(...p);
  }));
  if (CABELOS_NOVOS[estilo]){
    if (CABELOS_NOVOS[estilo].volume) CABELOS_NOVOS[estilo].volume(por, ruido);
  } else if (estilo === 'crespo'){
    const ok = (i, j, k) => j >= 0 && ((k >= 17) || (k >= 12 && j >= 3));
    casca(lista, ok);
    const primeira = [...extra.values()];
    primeira.forEach(([i, j, k]) => DIRS.slice(0, 4).forEach(([x, y, z]) => {
      const p = [i + x, j + y, k + z];
      if (!tem(...p) && !extra.has(p.join(',')) && ok(...p) && Math.abs(p[0] + .5 - 7) + Math.max(0, p[2] - 18) < 8.4) por(...p);
    }));
  } else if (estilo === 'longo'){
    casca(lista, (i, j, k) => (k >= 17 && j >= 0) || (k >= 6 && j >= 6));
    for (let i = 1; i <= 12; i++) for (let k = -2; k < 9; k++) for (let j = 10; j <= 12; j++) if (j > 10 || k < 6) por(i, j, k);
    for (const i of [0, 13]) for (let k = 2; k < 13; k++) for (let j = 7; j <= 10; j++) por(i, j, k);
  } else if (estilo === 'topete'){
    for (let i = 3; i <= 10; i++){ for (let j = -1; j <= 4; j++) por(i, j, 20); if (i > 3 && i < 10) for (let j = -1; j <= 2; j++) por(i, j, 21); por(i, -1, 19); }
  } else if (estilo === 'moicano'){
    for (let i = 6; i <= 7; i++) for (let j = 0; j <= 10; j++) for (let k = 20; k <= (j > 9 ? 21 : 23); k++) por(i, j, k);
  } else if (estilo === 'coque'){
    for (let i = 5; i <= 8; i++) for (let j = 8; j <= 11; j++) for (let k = 19; k <= 22; k++){
      if ((i === 5 || i === 8) && (k === 22 || j === 8 || j === 11)) continue;
      por(i, j, k);
    }
  }
  return [...extra.values()];
}
