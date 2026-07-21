import { api } from "./client.js";

export function login(email, password) {
  return api.post("/auth/login", { email, password }).then((res) => res.data);
}

export function register(name, email, password) {
  return api.post("/auth/register", { name, email, password }).then((res) => res.data);
}

export function fetchMe() {
  return api.get("/auth/me").then((res) => res.data.user);
}
