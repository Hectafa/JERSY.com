const TOKEN_KEY = "authToken";

/**
 * Guarda el auth token en el local storage
 * El AuthContext es quién decide cuando llamarlo
 */
export function saveToken(token) {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Lee el token de localstorage. Devuelve null si no existe
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

/**
 * Elimina el token (logout)
 */
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Decodifica el payload de un JWT sin verificar la firma.
 * Solo para LEER información del token. Para seguridad real, el backend valida.
 */
export function decodeToken(token) {
  try {
    const payloadBase64 = token.split(".")[1];
    const payload = JSON.parse(atob(payloadBase64));
    return payload;
  } catch (error) {
    return null;
  }
}

// Uso:
// const payload = decodeToken(token);
// {userId='aasdas1221343p', name='Rodrigo', role='admin', iat (issued at)=2026-05-21:20:16:00, exp (expiration)=2026-05-21:21:16:00}

/**
 * Verifica si un token está expirado leyendo el campo `exp`.
 * @returns {boolean} true si está expirado o es inválido
 */
export function isTokenExpired(token) {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  // exp es en segundos, Date.now() es en ms.
  return Date.now() >= payload.exp * 1000;
}
