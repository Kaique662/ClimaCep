import { onlyDigits } from '../utils/format';

const BRAZIL_API = 'https://brasilapi.com.br/api/cep/v2';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const AWESOME_CEP_API = 'https://cep.awesomeapi.com.br/json';

function normalized(text) {
  return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

async function getJSON(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 13000);
  try {
    // Evita cache local de respostas quando a pessoa muda de CEP.
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) {
      if (response.status === 404) throw new Error('CEP não encontrado. Confira os oito números e tente novamente.');
      throw new Error('Não foi possível consultar os serviços agora. Tente novamente.');
    }
    const data = await response.json();
    if (data.error) throw new Error(data.reason || 'Não foi possível consultar a previsão.');
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('A consulta demorou demais. Verifique sua conexão e tente novamente.');
    if (error instanceof TypeError) throw new Error('Sem conexão com a internet. Verifique o Wi-Fi ou dados móveis.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function getCepCoordinates(address) {
  const coordinates = address?.location?.coordinates;
  const lat = Number(coordinates?.latitude);
  const lon = Number(coordinates?.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lon) && lat >= -34 && lat <= 6 && lon >= -74 && lon <= -28 && (lat !== 0 || lon !== 0)) {
    return { latitude: lat, longitude: lon, approximate: false, source: 'brasilapi' };
  }
  return null;
}


// A BrasilAPI costuma disponibilizar endereço, mas nem sempre as coordenadas.
// Nesses casos tentamos outra base de CEP. Nunca usamos o centro da cidade.
function sameCityState(expected, actual) {
  return normalized(expected.city) === normalized(actual.city)
    && normalized(expected.state) === normalized(actual.state);
}

async function tryAwesomeCep(cep) {
  try {
    const data = await getJSON(`${AWESOME_CEP_API}/${cep}`);
    if (onlyDigits(data.cep) !== cep) return null;
    return data;
  } catch (err) {
    // Serviço opcional: se nenhum provedor fornecer coordenadas, interrompemos com erro.
    console.info('ClimaCEP: coordenadas adicionais indisponíveis:', err.message);
    return null;
  }
}

function getAwesomeCoordinates(data) {
  if (!data) return null;
  const latitude = Number(data.lat);
  const longitude = Number(data.lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < -34 || latitude > 6 || longitude < -74 || longitude > -28
    || (latitude === 0 && longitude === 0)) return null;
  return { latitude, longitude, approximate: false, source: 'awesomeapi' };
}

function addressFromAwesome(data) {
  if (!data?.city || !data?.state) return null;
  return {
    cep: data.cep,
    city: data.city,
    state: data.state,
    neighborhood: data.neighborhood || data.district || '',
    street: data.address || '',
  };
}

// Como dois provedores podem devolver coordenadas diferentes para o mesmo CEP,
// priorizamos a fonte de endereço por CEP com bairro coerente, quando existir.
// Nenhum serviço garante localização exata de cada imóvel da rua.
function neighborhoodCompatible(a, b) {
  const aText = normalized(a).replace(/\([^)]*\)/g, '').trim();
  const bText = normalized(b).replace(/\([^)]*\)/g, '').trim();
  return !aText || !bText || aText === bText || aText.includes(bText) || bText.includes(aText);
}

function distanceKm(lat1, lon1, lat2, lon2) {
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getWeatherByCep(rawCep) {
  const cep = onlyDigits(rawCep);
  if (cep.length !== 8) throw new Error('Digite um CEP válido com 8 números.');

  // Consultamos as DUAS bases para não ficar presos às coordenadas aproximadas
  // fornecidas por um único provedor. Elas pertencem ao CEP digitado, nunca a um CEP fixo.
  const [brasilResult, awesomeResult] = await Promise.allSettled([
    getJSON(`${BRAZIL_API}/${cep}`),
    tryAwesomeCep(cep),
  ]);
  const brasil = brasilResult.status === 'fulfilled' ? brasilResult.value : null;
  const awesome = awesomeResult.status === 'fulfilled' &&
    onlyDigits(awesomeResult.value?.cep) === cep ? awesomeResult.value : null;
  const address = brasil?.city && brasil?.state ? brasil : addressFromAwesome(awesome);
  if (!address?.city || !address?.state) {
    if (brasilResult.status === 'rejected') throw brasilResult.reason;
    throw new Error('O CEP não retornou informações de endereço. Tente outro CEP.');
  }

  const fromBrasil = getCepCoordinates(brasil);
  const fromAwesome = awesome && sameCityState(address, awesome)
    ? getAwesomeCoordinates(awesome)
    : null;
  // A AwesomeAPI fornece lat/lng associados ao CEP. Usamos primeiro esse ponto
  // quando o bairro confere com o da BrasilAPI. Caso contrário, usamos o outro
  // provedor somente se ele tiver coordenadas válidas.
  const awesomeMatchingNeighborhood = fromAwesome && neighborhoodCompatible(
    address.neighborhood, awesome.neighborhood || awesome.district
  );
  const coordinates = (awesomeMatchingNeighborhood && fromAwesome) || fromBrasil || fromAwesome;
  if (!coordinates) {
    throw new Error(
      'Encontramos o endereço deste CEP, mas as fontes consultadas não forneceram coordenadas específicas. ' +
      'Para evitar mostrar o clima geral da cidade como se fosse o do bairro, não exibiremos uma previsão imprecisa. Tente outro CEP.'
    );
  }
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    timezone: 'auto',
    forecast_days: '7',
    cell_selection: 'nearest', // Ponto de grade mais próximo das coordenadas obtidas para o CEP.
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,is_day,wind_speed_10m,uv_index',
    hourly: 'temperature_2m,precipitation_probability,weather_code,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset,uv_index_max',
  });
  const forecast = await getJSON(`${WEATHER_API}?${params.toString()}`);
  if (!forecast.current || !forecast.daily || !forecast.hourly ||
      !Array.isArray(forecast.hourly.time) || !Array.isArray(forecast.daily.time) ||
      forecast.daily.time.length < 7 ||
      !Array.isArray(forecast.hourly.temperature_2m) ||
      !Array.isArray(forecast.daily.temperature_2m_max)) {
    throw new Error('A previsão do tempo está incompleta. Tente novamente.');
  }

  // Encontra o bloco horário correspondente à hora atual na região consultada.
  const currentHour = `${String(forecast.current.time || '').slice(0, 13)}:00`;
  let index = forecast.hourly.time.findIndex((time) => time >= currentHour);
  if (index < 0) index = 0;
  const hours = forecast.hourly.time.slice(index, index + 10).map((time, offset) => ({
    time,
    temperature: forecast.hourly.temperature_2m?.[index + offset],
    chanceRain: forecast.hourly.precipitation_probability?.[index + offset],
    weatherCode: forecast.hourly.weather_code?.[index + offset],
    isDay: forecast.hourly.is_day?.[index + offset] === 1,
  }));
  const days = forecast.daily.time.map((date, i) => ({
    date,
    weatherCode: forecast.daily.weather_code?.[i],
    min: forecast.daily.temperature_2m_min?.[i],
    max: forecast.daily.temperature_2m_max?.[i],
    chanceRain: forecast.daily.precipitation_probability_max?.[i],
    rainfall: forecast.daily.precipitation_sum?.[i],
    sunrise: forecast.daily.sunrise?.[i],
    sunset: forecast.daily.sunset?.[i],
    uvMax: forecast.daily.uv_index_max?.[i],
  }));

  return {
    cep,
    city: address.city,
    state: address.state,
    neighborhood: address.neighborhood || '',
    street: address.street || '',
    approximate: false,
    coordinateSource: coordinates.source,
    gridLatitude: Number(forecast.latitude),
    gridLongitude: Number(forecast.longitude),
    gridDistanceKm: distanceKm(coordinates.latitude, coordinates.longitude, Number(forecast.latitude), Number(forecast.longitude)),
    fetchedAt: new Date().toISOString(),
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    current: {
      temperature: forecast.current.temperature_2m,
      feelsLike: forecast.current.apparent_temperature,
      humidity: forecast.current.relative_humidity_2m,
      precipitation: forecast.current.precipitation,
      uv: forecast.current.uv_index,
      wind: forecast.current.wind_speed_10m,
      code: forecast.current.weather_code,
      isDay: forecast.current.is_day === 1,
      time: forecast.current.time,
      chanceRain: forecast.hourly.precipitation_probability?.[index],
    },
    hours,
    days,
  };
}
