/**
 * Teste offline com dados artificiais distintos para garantir que o CEP atualiza
 * todas as seções. Não representa meteorologia real de São Paulo.
 * Uso: node tests/verificar-consulta.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const file = path.join(__dirname, '../src/services/weatherApi.js');
  const source = fs.readFileSync(file, 'utf8')
    .replace("import { onlyDigits } from '../utils/format';", "const onlyDigits = value => String(value || '').replace(/\\D/g, '');");
  const { getWeatherByCep } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const requests = [];
  const ceps = {
    // A BrasilAPI devolve propositalmente as MESMAS coordenadas genéricas de cidade.
    // A AwesomeAPI fornece coordenadas diferentes associadas a cada CEP.
    '04859240': { cep: '04859240', city: 'São Paulo', state: 'SP', neighborhood: 'Jardim Alvorada (Zona Sul)', street: 'Rua das Flores', location: { coordinates: { latitude: '-23.5475', longitude: '-46.6361' } } },
    '04703003': { cep: '04703003', city: 'São Paulo', state: 'SP', neighborhood: 'Santo Amaro', street: 'Avenida Morumbi', location: { coordinates: { latitude: '-23.5475', longitude: '-46.6361' } } },
    '12345678': { cep: '12345678', city: 'São Paulo', state: 'SP', neighborhood: 'Bairro sem ponto', street: 'Rua sem coordenadas', location: { coordinates: {} } },
  };
  const awesome = {
    '04859240': { cep: '04859240', city: 'São Paulo', state: 'SP', district: 'Jardim Alvorada', lat: '-23.7001', lng: '-46.7501' },
    '04703003': { cep: '04703003', city: 'São Paulo', state: 'SP', district: 'Santo Amaro', lat: '-23.6311', lng: '-46.7011' },
    '12345678': { cep: '12345678', city: 'São Paulo', state: 'SP', district: 'Bairro sem ponto', lat: null, lng: null },
  };
  function forecast(lat, lon) {
    const a = lat < -23.65;
    const date = '2026-11-20';
    const start = `${date}T09:00`;
    const dayDates = ['2026-11-20','2026-11-21','2026-11-22','2026-11-23','2026-11-24','2026-11-25','2026-11-26'];
    const times = Array.from({length: 24}, (_,h) => `${date}T${String(h).padStart(2,'0')}:00`);
    const temperature = a ? 23 : 30;
    const rain = a ? 84 : 8;
    const humidity = a ? 79 : 38;
    const uv = a ? 2 : 9;
    const sunrise = a ? '05:14' : '05:10';
    const sunset = a ? '18:35' : '18:31';
    return {
      latitude: lat + (a ? 0.01 : 0.02), longitude: lon + 0.01,
      current: { time: `${date}T09:00`, temperature_2m: temperature, apparent_temperature: temperature+2,
        relative_humidity_2m: humidity, precipitation: a ? 3 : 0,
        weather_code: a ? 95 : 1, is_day: 1, wind_speed_10m: a ? 15 : 5, uv_index: uv },
      hourly: { time: times, temperature_2m: times.map((_,i)=>temperature+i/10), precipitation_probability: times.map(()=>rain), weather_code: times.map(()=>a ? 95 : 1), is_day: times.map(()=>1) },
      daily: { time: dayDates, weather_code: dayDates.map(()=>a ? 95 : 1), temperature_2m_max: dayDates.map((_,i)=>temperature+i),
        temperature_2m_min: dayDates.map((_,i)=>temperature-i-3), precipitation_probability_max: dayDates.map(()=>rain),
        precipitation_sum: dayDates.map(()=>a ? 9 : 0), sunrise: dayDates.map(d=>`${d}T${sunrise}`),
        sunset: dayDates.map(d=>`${d}T${sunset}`), uv_index_max: dayDates.map(()=>uv) }
    };
  }
  global.fetch = async urlInput => {
    const u = new URL(urlInput);
    const cep = u.pathname.split('/').at(-1);
    let body;
    if (u.hostname === 'brasilapi.com.br') body = ceps[cep];
    else if (u.hostname === 'cep.awesomeapi.com.br') body = awesome[cep];
    else if (u.hostname === 'api.open-meteo.com') {
      const lat = Number(u.searchParams.get('latitude'));
      const lon = Number(u.searchParams.get('longitude'));
      requests.push({ lat, lon, cellSelection: u.searchParams.get('cell_selection') });
      body = forecast(lat, lon);
    } else throw new Error('URL inesperada: ' + u);
    return { ok: Boolean(body), status: body ? 200 : 404, json: async () => body };
  };
  const a = await getWeatherByCep('04859-240');
  const b = await getWeatherByCep('04703003');
  assert.equal(a.neighborhood, 'Jardim Alvorada (Zona Sul)');
  assert.equal(b.neighborhood, 'Santo Amaro');
  assert.equal(a.coordinateSource, 'awesomeapi');
  assert.equal(b.coordinateSource, 'awesomeapi');
  assert.deepEqual(requests, [
    { lat: -23.7001, lon: -46.7501, cellSelection: 'nearest' },
    { lat: -23.6311, lon: -46.7011, cellSelection: 'nearest' },
  ]);
  // Valores exibidos por todos os componentes: do mesmo retorno do CEP solicitado.
  assert.notEqual(a.current.temperature, b.current.temperature, 'temperatura atual');
  assert.notEqual(a.current.humidity, b.current.humidity, 'umidade');
  assert.notEqual(a.current.wind, b.current.wind, 'vento');
  assert.notEqual(a.current.chanceRain, b.current.chanceRain, 'chance de chuva atual');
  assert.notEqual(a.current.uv, b.current.uv, 'UV atual');
  assert.notEqual(a.hours[0].temperature, b.hours[0].temperature, 'temperatura horária');
  assert.notEqual(a.hours[0].chanceRain, b.hours[0].chanceRain, 'chuva horária');
  assert.notEqual(a.days[0].sunrise, b.days[0].sunrise, 'nascer do sol');
  assert.notEqual(a.days[0].sunset, b.days[0].sunset, 'pôr do sol');
  assert.notEqual(a.days[0].max, b.days[0].max, 'máxima diária');
  assert.notEqual(a.days[6].min, b.days[6].min, 'mínima no 7º dia');
  assert.notEqual(a.days[6].chanceRain, b.days[6].chanceRain, 'chuva no 7º dia');
  assert.notEqual(a.days[0].weatherCode, b.days[0].weatherCode, 'ícone da semana');
  assert.equal(a.days.length, 7);
  assert.equal(b.days.length, 7);
  assert.equal(a.hours.length, 10);
  assert.equal(b.hours.length, 10);
  assert(Number.isFinite(a.gridDistanceKm));
  assert(Number.isFinite(b.gridDistanceKm));

  const numBefore = requests.length;
  await assert.rejects(getWeatherByCep('12345678'), /não forneceram coordenadas específicas/);
  assert.equal(requests.length, numBefore, 'CEP sem localização não pode consultar a cidade genérica');

  // Confere o vínculo das seções da tela ao mesmo objeto da busca (e não números fixos).
  const ui = fs.readFileSync(path.join(__dirname, '../WeatherDashboard.js'), 'utf8');
  for (const name of ['HeroWeather','ForecastLocation','HourlyForecast','Metrics','WeekForecast','TipCard']) {
    assert.match(ui, new RegExp(`<${name} data=\\{visibleForecast\\}`), `${name}: usar dados da consulta atual`);
  }
  assert.match(ui, /key=\{visibleForecast.renderId\}/, 'remontar dados após nova consulta');
  console.log('✓ Dois CEPs geram coordenadas diferentes mesmo quando a BrasilAPI traz a mesma coordenada genérica.');
  console.log('✓ Temperatura, umidade, vento, chuva, UV, próximas horas, nascer/pôr do sol, sete dias e ícones mudam quando a API retorna valores diferentes.');
  console.log('✓ Sem coordenadas de CEP, o app não usa o centro da cidade como previsão local.');
  console.log('✓ Todas as seções da tela recebem o mesmo objeto de dados da pesquisa atual.');
  console.log('OBS.: Testes simulados; não são temperaturas reais e não substituem testar no Expo Go.');
})().catch(e => { console.error(e.message); process.exitCode = 1; });
