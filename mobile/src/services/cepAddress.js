// Endereço de um CEP para exibir o bairro de um relato comunitário.
// Diferente da previsão, esta função não exige coordenadas.
import { onlyDigits } from '../utils/format';

async function fetchAddress(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } finally { clearTimeout(timer); }
}

export async function getAddressByCep(rawCep) {
  const cep = onlyDigits(rawCep);
  if (cep.length !== 8) throw new Error('Informe um CEP com 8 números.');
  try {
    const data = await fetchAddress(`https://brasilapi.com.br/api/cep/v2/${cep}`);
    if (data?.city && data?.state && onlyDigits(data.cep || cep) === cep) {
      return {
        cep, neighborhood: data.neighborhood || '', city: data.city,
        state: data.state, street: data.street || '',
      };
    }
  } catch (e) { console.info('BrasilAPI CEP:', e.message); }
  try {
    const data = await fetchAddress(`https://cep.awesomeapi.com.br/json/${cep}`);
    if (data?.city && data?.state && onlyDigits(data.cep || cep) === cep) {
      return {
        cep, neighborhood: data.neighborhood || data.district || '',
        city: data.city, state: data.state, street: data.address || '',
      };
    }
  } catch (e) { console.info('AwesomeAPI CEP:', e.message); }
  throw new Error('Não foi possível confirmar o endereço deste CEP. Verifique o número e sua internet.');
}
