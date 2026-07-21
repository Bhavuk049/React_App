import { useDispatch, useSelector } from "react-redux";
import {
  addItem as addItemAction,
  clearCart as clearCartAction,
  removeItem as removeItemAction,
  selectCartItems,
  selectCartTotalItems,
  selectCartTotalPrice,
  updateQuantity as updateQuantityAction,
} from "../store/slices/cartSlice.js";

export function useCart() {
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const totalItems = useSelector(selectCartTotalItems);
  const totalPrice = useSelector(selectCartTotalPrice);

  return {
    items,
    addItem: (product, quantity = 1) => dispatch(addItemAction({ product, quantity })),
    removeItem: (productId) => dispatch(removeItemAction(productId)),
    updateQuantity: (productId, quantity) => dispatch(updateQuantityAction({ productId, quantity })),
    clearCart: () => dispatch(clearCartAction()),
    totalItems,
    totalPrice,
  };
}
