/* Formatação de números e textos. */

export const R = n => (n < 0 ? '-' : '') + 'R$ ' +
  Math.abs(n).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});

export const P = n => n.toLocaleString('pt-BR', {maximumFractionDigits: 2}) + '%';

export const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

export const sinal = d => (d <= 0 ? 'bom' : 'ruim');
