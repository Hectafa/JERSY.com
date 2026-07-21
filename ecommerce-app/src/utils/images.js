const FALLBACK_IMAGE = "/img/products/placeholder.svg";

export function getProductImageUrl(imageURL) {
  if (!imageURL) return FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(imageURL)) return imageURL;
  if (imageURL.startsWith("./")) return imageURL.slice(1);
  if (!imageURL.startsWith("/")) return `/${imageURL}`;
  return imageURL;
}
