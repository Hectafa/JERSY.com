const API_ORIGIN = (
  process.env.REACT_APP_API_URL || "http://localhost:4000/api"
).replace(/\/api\/?$/, "");

const DEFAULT_AVATAR = "/img/user-placeholder.png";

/**
 * El backend devuelve el avatar como ruta relativa (/uploads/avatars/...),
 * hay que resolverla contra el origen de la API, no del frontend.
 */
export function resolveAvatarUrl(avatar) {
  if (!avatar) return DEFAULT_AVATAR;
  if (/^(https?:)?\/\//.test(avatar) || avatar.startsWith("blob:")) {
    return avatar;
  }
  return `${API_ORIGIN}${avatar}`;
}
