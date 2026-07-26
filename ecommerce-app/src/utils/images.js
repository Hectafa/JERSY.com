const API_ORIGIN = (
  process.env.REACT_APP_API_URL || "http://localhost:4000/api"
).replace(/\/api\/?$/, "");
const FALLBACK_IMAGE = "/img/products/placeholder.svg";

export function getProductImageUrl(imageURL) {
  if (!imageURL) return FALLBACK_IMAGE;
  if (imageURL.startsWith("/uploads")) return `${API_ORIGIN}${imageURL}`;
  if (/^https?:\/\//i.test(imageURL) || imageURL.startsWith("blob:")) return imageURL;
  if (imageURL.startsWith("./")) return imageURL.slice(1);
  if (!imageURL.startsWith("/")) return `/${imageURL}`;
  return imageURL;
}
