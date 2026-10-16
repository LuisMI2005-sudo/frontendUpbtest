// URL pública del backend; las credenciales de PostgreSQL permanecen en Render.
export const API_URL = 'https://backendupbtest-969u.onrender.com';

export async function request(route, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(API_URL + route, {
      method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(65000),
    });
  } catch {
    throw new Error('No pudimos conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.');
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `No se pudo completar la operación (${response.status}).`);
  if (data === null) throw new Error('El servidor devolvió una respuesta inesperada.');
  return data;
}

export const productsApi = {
  list: (nombre = '') => request('/api/productos' + (nombre ? `?nombre=${encodeURIComponent(nombre)}` : '')),
  get: id => request(`/api/productos/${id}`),
  create: body => request('/api/productos', { method: 'POST', body }),
  update: (id, body) => request(`/api/productos/${id}`, { method: 'PUT', body }),
  remove: id => request(`/api/productos/${id}`, { method: 'DELETE' }),
};
