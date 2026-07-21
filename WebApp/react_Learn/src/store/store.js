import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./apiSlice.js";
import { listenerMiddleware } from "./listenerMiddleware.js";
import authReducer from "./slices/authSlice.js";
import cartReducer from "./slices/cartSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware).concat(apiSlice.middleware),
});
