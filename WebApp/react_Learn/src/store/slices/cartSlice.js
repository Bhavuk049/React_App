import { createSelector, createSlice } from "@reduxjs/toolkit";

function loadInitialItems() {
  try {
    return JSON.parse(localStorage.getItem("cart")) ?? [];
  } catch {
    return [];
  }
}

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: loadInitialItems() },
  reducers: {
    addItem(state, action) {
      const { product, quantity = 1 } = action.payload;
      const existing = state.items.find((i) => i.product.id === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ product, quantity });
      }
    },
    removeItem(state, action) {
      state.items = state.items.filter((i) => i.product.id !== action.payload);
    },
    updateQuantity(state, action) {
      const { productId, quantity } = action.payload;
      if (quantity < 1) {
        state.items = state.items.filter((i) => i.product.id !== productId);
        return;
      }
      const item = state.items.find((i) => i.product.id === productId);
      if (item) item.quantity = quantity;
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart } = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;
export const selectCartTotalItems = createSelector(selectCartItems, (items) =>
  items.reduce((sum, i) => sum + i.quantity, 0),
);
export const selectCartTotalPrice = createSelector(selectCartItems, (items) =>
  items.reduce((sum, i) => sum + i.quantity * Number(i.product.price), 0),
);

export default cartSlice.reducer;
