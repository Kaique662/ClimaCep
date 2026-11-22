// Código meteorológico WMO, utilizado pela Open-Meteo.
export function weatherInfo(code, isDay = true) {
  const n = Number(code);
  if (n === 0) return { label: 'Céu limpo', short: 'Ensolarado', icon: isDay ? 'weather-sunny' : 'weather-night', accent: '#F6C453' };
  if (n === 1 || n === 2) return { label: 'Parcialmente nublado', short: 'Sol entre nuvens', icon: isDay ? 'weather-partly-cloudy' : 'weather-night-partly-cloudy', accent: '#FFD26B' };
  if (n === 3) return { label: 'Céu encoberto', short: 'Nublado', icon: 'weather-cloudy', accent: '#BDD7FF' };
  if (n === 45 || n === 48) return { label: 'Neblina', short: 'Neblina', icon: 'weather-fog', accent: '#BDD7FF' };
  if ([51, 53, 55, 56, 57].includes(n)) return { label: 'Garoa', short: 'Garoa', icon: 'weather-rainy', accent: '#BDD7FF' };
  if ([61, 63, 65, 66, 67].includes(n)) return { label: 'Chuva', short: 'Chuvoso', icon: 'weather-rainy', accent: '#A7D5FF' };
  if ([71, 73, 75, 77, 85, 86].includes(n)) return { label: 'Neve', short: 'Neve', icon: 'weather-snowy', accent: '#D7E7FF' };
  if ([80, 81, 82].includes(n)) return { label: 'Pancadas de chuva', short: 'Pancadas', icon: 'weather-pouring', accent: '#A7D5FF' };
  if ([95, 96, 99].includes(n)) return { label: 'Tempestade', short: 'Tempestade', icon: 'weather-lightning-rainy', accent: '#FFD26B' };
  return { label: 'Condições variáveis', short: 'Variável', icon: 'weather-cloudy', accent: '#BDD7FF' };
}

export function weatherMessage(code, rain) {
  const n = Number(code);
  const p = Number(rain);
  if ([95, 96, 99].includes(n)) return 'Possibilidade de trovoadas. Verifique as condições antes de sair.';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(n)) return 'Vale levar um guarda-chuva ao sair.';
  if (Number.isFinite(p) && p >= 60) return 'Há boa chance de chuva nas próximas horas.';
  if (n === 0 || n === 1) return 'Um bom momento para aproveitar o dia.';
  return 'Acompanhe as mudanças do tempo ao longo do dia.';
}
