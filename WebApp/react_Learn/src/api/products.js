import { api } from "./client.js";

export function listProducts(params = {}) {
  return api.get("/products", { params }).then((res) => res.data);
}

export function getProduct(slug) {
  return api.get(`/products/${slug}`).then((res) => res.data.product);
}

export function adminListProducts(params = {}) {
  return api.get("/products/admin", { params }).then((res) => res.data);
}

export function createProduct(payload) {
  return api.post("/products", payload).then((res) => res.data.product);
}

export function updateProduct(id, payload) {
  return api.patch(`/products/${id}`, payload).then((res) => res.data.product);
}

export function deleteProduct(id) {
  return api.delete(`/products/${id}`);
}
