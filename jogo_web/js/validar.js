/* usado pelo criador e pelo montador de cenários */
/* completa uma configuração antiga ou incompleta com os valores padrão, ignorando o que não existe */
function validar(c){
  const out = structuredClone(PADRAO_WASHINGTON), cor = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
  if (!c || typeof c !== 'object') return out;
  const opcao = (v, lista, atual) => Object.hasOwn(lista, v) ? v : atual;
  out.nome = typeof c.nome === 'string' ? c.nome.toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 40) || out.nome : out.nome;
  for (const k of ['pele', 'olhos']) if (cor(c[k])) out[k] = c[k];
  for (const [k, lista] of [['cabelo', CABELOS], ['barba', BARBAS], ['sobrancelha', SOBRANCELHAS], ['oculos', OCULOS], ['chapeu', CHAPEUS], ['colete', COLETES], ['mochila', MOCHILAS], ['luvas', LUVAS], ['facial', ROSTOS_EQ], ['emblema', NOMES_EMBLEMA]]){
    out[k].estilo = opcao(c[k]?.estilo, lista, out[k].estilo);
  }
  for (const [k, atual] of Object.entries(out)){                     /* cores e caixas marcadas */
    if (!atual || typeof atual !== 'object' || k === 'cores') continue;
    for (const campo of Object.keys(atual)){
      const v = c[k]?.[campo];
      if (campo === 'cor' && cor(v)) atual.cor = v;
      else if (typeof atual[campo] === 'boolean' && typeof v === 'boolean') atual[campo] = v;
    }
  }
  /* arquivos salvos pela primeira versão */
  if (c.chapeu?.estilo === 'capacete') out.chapeu.estilo = 'tatico';
  if (c.mochila?.usa === true) out.mochila.estilo = 'militar';
  if (c.luvas?.usa === true) out.luvas.estilo = 'taticas';
  out.corpo = opcao(c.corpo, CORPOS, out.corpo);
  out.boca = opcao(c.boca, BOCAS, out.boca); out.roupa = opcao(c.roupa, ROUPAS, out.roupa); out.pose = opcao(c.pose, POSES, out.pose);
  for (const [id, cores] of Object.entries(c.cores || {})) if (Object.hasOwn(ROUPAS, id))
    for (const [k, v] of Object.entries(cores || {})) if (Object.hasOwn(ROUPAS[id].cores, k) && cor(v)) (out.cores[id] = out.cores[id] || {})[k] = v;
  if (c.zumbi && typeof c.zumbi === 'object') out.zumbi = validarZumbi(c.zumbi);
  return out;
}
