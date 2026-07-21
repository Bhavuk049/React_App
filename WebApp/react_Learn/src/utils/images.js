import { apiOrigin } from "../api/client.js";

export function resolveImageUrl(imagePath) {
  if (!imagePath) return "";
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return `${apiOrigin}${imagePath}`;
}
