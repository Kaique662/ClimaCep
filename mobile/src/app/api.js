// HTTP client para o Spring Boot. EXPO_PUBLIC_* é lido ao iniciar o Expo.
export const API_BASE_URL = String(process.env.EXPO_PUBLIC_API_URL || '').replace(/\/+$/, '');

export async function apiRequest(path, { method = 'GET', data, token } = {}) {
  if (!API_BASE_URL) {
    throw new Error('Configure EXPO_PUBLIC_API_URL no arquivo mobile/.env com o IP do computador e a porta 8080.');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
      signal: controller.signal,
    });
    if (response.status === 204) return null;
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && token) throw new Error('Sessão expirada. Faça login novamente.');
      throw new Error(body.message || (response.status === 401 ? 'E-mail ou senha incorretos.' : `Erro HTTP ${response.status}.`));
    }
    return body;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('O backend demorou a responder. Confira se o Spring Boot está ativo.');
    if (error instanceof TypeError) throw new Error(`Não foi possível conectar ao Spring Boot (${API_BASE_URL}). Verifique IP, Wi-Fi e porta 8080.`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
