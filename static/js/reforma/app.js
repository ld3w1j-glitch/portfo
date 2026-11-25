/* Simulador da reforma tributária: interface (abas, simulador, painel e nota).
   Módulos: dados.js (regras e exemplos) · calculo.js (contas) · formato.js (R$ e %) */
import { calcular, aliquotas, impostoDoItem } from './calculo.js';
import { ANOS, ANO_PADRAO, CBS_REFERENCIA, EXEMPLOS, IBS_REFERENCIA, SETORES } from './dados.js';
import { esc, P, R, sinal } from './formato.js';

const $ = id => document.getElementById(id);
const copia = obj => JSON.parse(JSON.stringify(obj));
const opcoesSetor = sel => SETORES.map((s, i) => `<option value="${i}"${i === sel ? ' selected' : ''}>${s.nome}</option>`).join('');

/* parâmetros globais lidos da barra do topo */
const parametros = () => ({ano: $('ano').value, cbsRef: +$('cbsRef').value || 0, ibsRef: +$('ibsRef').value || 0});

/* ---------- 1 · simulador do empresário ---------- */
function simular() {
  const empresa = {vendas: +$('s-vendas').value || 0, compras: +$('s-compras').value || 0,
                   carga: +$('s-carga').value || 0, setor: +$('s-setor').value};
  const params = parametros(), r = calcular(params, empresa), max = Math.max(r.hoje, r.novo, 1);
  $('s-res').innerHTML = `
    <p class="rotulo">${esc($('s-nome').value || 'Sua empresa')} · imposto por mês</p>
    <div class="barras">
      <div class="barra hoje"><b>${R(r.hoje)}</b><i style="height:${r.hoje / max * 78}%"></i><span>Hoje</span></div>
      <div class="barra novo"><b>${R(r.novo)}</b><i style="height:${r.novo / max * 78}%"></i><span>${params.ano}</span></div>
    </div>
    <p class="rotulo">Você vai pagar ${r.dif <= 0 ? 'a menos' : 'a mais'}</p>
    <p class="grande ${sinal(r.dif)}">${R(Math.abs(r.dif))}<small style="font-size:.4em"> /mês</small></p>
    <div class="linhas">
      <div><span>Base com créditos descontados</span><span class="mono">${R(r.base)}</span></div>
      <div><span>CBS (${P(r.a.cbs)})</span><span class="mono">${R(r.cbs)}</span></div>
      <div><span>IBS (${P(r.a.ibs)})</span><span class="mono">${R(r.ibs)}</span></div>
      <div><span>Tributos atuais que ainda restam</span><span class="mono">${R(r.resto)}</span></div>
      <div><span>Diferença em 12 meses</span><span class="mono ${sinal(r.dif)}">${r.dif <= 0 ? '-' : '+'}${R(Math.abs(r.dif * 12))}</span></div>
    </div>`;
}

/* ---------- 2 · painel do contador (dados salvos no navegador) ---------- */
const CHAVE = 'wo-reforma-emp';
let empresas;
try { empresas = JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch (e) { /* sem acesso ao armazenamento */ }
if (!Array.isArray(empresas)) empresas = copia(EXEMPLOS);
const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(empresas)); } catch (e) { /* ignora */ } };

function painel() {
  const params = parametros();
  let totalHoje = 0, totalNovo = 0;
  const linhas = empresas.map((e, i) => {
    const r = calcular(params, e);
    totalHoje += r.hoje; totalNovo += r.novo;
    return `<tr>
      <td><input data-i="${i}" data-k="nome" value="${esc(e.nome)}" aria-label="Nome"></td>
      <td><input data-i="${i}" data-k="vendas" type="number" min="0" value="${e.vendas}" aria-label="Vendas"></td>
      <td><input data-i="${i}" data-k="compras" type="number" min="0" value="${e.compras}" aria-label="Compras"></td>
      <td><input data-i="${i}" data-k="carga" type="number" step="0.1" min="0" value="${e.carga}" aria-label="Carga atual"></td>
      <td><select data-i="${i}" data-k="setor" aria-label="Atividade">${opcoesSetor(e.setor)}</select></td>
      <td class="n">${R(r.hoje)}</td><td class="n">${R(r.novo)}</td>
      <td class="n ${sinal(r.dif)}">${r.dif <= 0 ? '▼' : '▲'} ${R(Math.abs(r.dif))}</td>
      <td><button class="x" data-del="${i}" aria-label="Remover">✕</button></td></tr>`;
  }).join('');
  const dif = totalNovo - totalHoje;
  $('tab').innerHTML = `<thead><tr><th>Empresa</th><th>Vendas/mês</th><th>Compras c/ crédito</th><th>Carga hoje %</th><th>Atividade</th><th class="n">Hoje</th><th class="n">${params.ano}</th><th class="n">Diferença</th><th></th></tr></thead>
    <tbody>${linhas}</tbody>
    <tfoot><tr><td colspan="5">Total · ${empresas.length} empresas</td><td class="n">${R(totalHoje)}</td><td class="n">${R(totalNovo)}</td><td class="n ${sinal(dif)}">${dif <= 0 ? '▼' : '▲'} ${R(Math.abs(dif))}</td><td></td></tr></tfoot>`;
}

function baixarCsv() {
  const params = parametros();
  const q = s => '"' + String(s).replace(/"/g, '""') + '"';
  const linhas = [['Empresa', 'Vendas', 'Compras', 'Carga atual %', 'Atividade', 'Imposto hoje', 'Imposto ' + params.ano, 'Diferença']];
  empresas.forEach(e => {
    const r = calcular(params, e);
    linhas.push([e.nome, e.vendas, e.compras, e.carga, SETORES[e.setor].nome, r.hoje.toFixed(2), r.novo.toFixed(2), r.dif.toFixed(2)]);
  });
  const blob = new Blob(['﻿' + linhas.map(l => l.map(q).join(';')).join('\n')], {type: 'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'painel-reforma-tributaria.csv'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- 3 · nota fiscal ---------- */
let itens = [{d: 'Serviço de consultoria', v: 1000, s: 0}, {d: 'Limpeza dental', v: 350, s: 1}];
let emitida = false;

function notaTabela() {
  $('n-tab').innerHTML = `<thead><tr><th>Descrição</th><th>Valor R$</th><th>Atividade</th><th></th></tr></thead><tbody>` +
    itens.map((it, i) => `<tr><td><input data-n="${i}" data-k="d" value="${esc(it.d)}"></td>
      <td><input data-n="${i}" data-k="v" type="number" min="0" value="${it.v}"></td>
      <td><select data-n="${i}" data-k="s">${opcoesSetor(it.s)}</select></td>
      <td><button class="x" data-ndel="${i}" aria-label="Remover">✕</button></td></tr>`).join('') + '</tbody>';
}

function notaVer() {
  const params = parametros();
  let tv = 0, tc = 0, ti = 0;
  const linhas = itens.map(it => {
    const x = impostoDoItem(params, it.v, it.s);
    tv += it.v; tc += x.cbs; ti += x.ibs;
    return `<div class="l"><span>${esc(it.d)}</span><span>${R(it.v)}</span></div>
      <div class="l" style="font-size:11px;color:#555"><span>CBS ${P(x.a.cbs)} · IBS ${P(x.a.ibs)}</span><span>${R(x.cbs)} + ${R(x.ibs)}</span></div>`;
  }).join('');
  $('nota').innerHTML = `<h3>Nota fiscal</h3>
    <div class="l"><span>Cliente</span><span>${esc($('n-cli').value || '—')}</span></div>
    <div class="l"><span>Ano de referência</span><span>${params.ano}</span></div>${linhas}
    <div class="l"><span>Valor dos itens</span><span>${R(tv)}</span></div>
    <div class="l"><span>CBS</span><span>${R(tc)}</span></div>
    <div class="l"><span>IBS</span><span>${R(ti)}</span></div>
    <div class="l t"><span>Total de tributos</span><span>${R(tc + ti)}</span></div>
    ${emitida ? '<div class="sel">✓ Emitida</div>' : ''}
    <small>Documento de exemplo, sem valor fiscal.</small>`;
}

/* ---------- geral ---------- */
function atualizarTudo() {
  const a = aliquotas(parametros(), 0);
  $('aplicadas').value = `CBS ${P(a.cbs)} · IBS ${P(a.ibs)}`;
  simular(); painel(); notaVer();
}

function ligarEventos() {
  /* parâmetros e simulador */
  ['ano', 'cbsRef', 'ibsRef'].forEach(id => $(id).addEventListener('input', atualizarTudo));
  ['s-nome', 's-vendas', 's-compras', 's-carga', 's-setor'].forEach(id => $(id).addEventListener('input', simular));

  /* abas */
  $('abas').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    document.querySelectorAll('#abas .tag').forEach(x => x.classList.toggle('ativo', x === b));
    document.querySelectorAll('.painel').forEach(p => p.classList.toggle('on', p.id === b.dataset.p));
  });

  /* painel */
  $('tab').addEventListener('change', e => {
    const t = e.target, i = t.dataset.i, k = t.dataset.k;
    if (i === undefined) return;
    empresas[i][k] = k === 'nome' ? t.value : +t.value || 0;
    salvar(); painel();
  });
  $('tab').addEventListener('click', e => {
    const b = e.target.closest('[data-del]');
    if (!b) return;
    empresas.splice(+b.dataset.del, 1); salvar(); painel();
  });
  $('add').onclick = () => { empresas.push({nome: 'Nova empresa', vendas: 50000, compras: 15000, carga: 12, setor: 0}); salvar(); painel(); };
  $('zerar').onclick = () => { empresas = copia(EXEMPLOS); salvar(); painel(); };
  $('csv').onclick = baixarCsv;

  /* nota */
  $('n-tab').addEventListener('input', e => {
    const t = e.target, i = t.dataset.n, k = t.dataset.k;
    if (i === undefined) return;
    itens[i][k] = k === 'd' ? t.value : +t.value || 0;
    emitida = false; notaVer();
  });
  $('n-tab').addEventListener('click', e => {
    const b = e.target.closest('[data-ndel]');
    if (!b) return;
    itens.splice(+b.dataset.ndel, 1); emitida = false; notaTabela(); notaVer();
  });
  $('n-add').onclick = () => { itens.push({d: 'Novo item', v: 100, s: 0}); emitida = false; notaTabela(); notaVer(); };
  $('n-cli').oninput = () => { emitida = false; notaVer(); };
  $('n-emit').onclick = () => { emitida = true; notaVer(); };
  $('n-print').onclick = () => { emitida = true; notaVer(); window.print(); };
}

/* ---------- início ---------- */
$('ano').innerHTML = Object.entries(ANOS).map(([a, v]) => `<option value="${a}">${v.nome}</option>`).join('');
$('ano').value = ANO_PADRAO;
$('cbsRef').value = CBS_REFERENCIA;
$('ibsRef').value = IBS_REFERENCIA;
$('s-setor').innerHTML = opcoesSetor(0);
ligarEventos();
notaTabela();
atualizarTudo();
