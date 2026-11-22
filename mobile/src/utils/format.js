export function onlyDigits(text = '') {
  return String(text).replace(/\D/g, '').slice(0, 8);
}

export function formatCep(cep = '') {
  const digits = onlyDigits(cep);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function rounded(value, suffix = '') {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${Math.round(numeric)}${suffix}` : '—';
}

export function decimal(value, suffix = '') {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toFixed(1).replace('.', ',')}${suffix}` : '—';
}

// Os horários retornados pela API já estão no fuso local da região consultada.
// Não converta para o fuso do aparelho ao apresentar "HH:mm".
export function timeLabel(isoLocal) {
  if (typeof isoLocal !== 'string') return '--:--';
  return isoLocal.includes('T') ? isoLocal.split('T')[1].slice(0, 5) : '--:--';
}

export function hourLabel(isoLocal) {
  return timeLabel(isoLocal).slice(0, 2) + 'h';
}

export function dayLabel(isoDate, index) {
  if (index === 0) return 'Hoje';
  if (index === 1) return 'Amanhã';
  if (!isoDate) return '—';
  const date = new Date(`${isoDate}T12:00:00`);
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return `${days[date.getDay()]}, ${date.getDate()}`;
}

export function dateLabel(isoDate) {
  if (!isoDate) return '';
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}
