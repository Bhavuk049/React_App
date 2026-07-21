import { createListenerMiddleware } from "@reduxjs/toolkit";
import { logout, setCredentials } from "./slices/authSlice.js";

export const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  actionCreator: setCredentials,
  effect: (action) => {
    localStorage.setItem("accessToken", action.payload.accessToken);
    localStorage.setItem("refreshToken", action.payload.refreshToken);
  },
});

listenerMiddleware.startListening({
  actionCreator: logout,
  effect: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
});

listenerMiddleware.startListening({
  predicate: (action) => typeof action.type === "string" && action.type.startsWith("cart/"),
  effect: (action, listenerApi) => {
    localStorage.setItem("cart", JSON.stringify(listenerApi.getState().cart.items));
  },
});
