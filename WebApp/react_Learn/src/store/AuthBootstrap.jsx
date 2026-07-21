import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { initializeAuth } from "./slices/authSlice.js";

export function AuthBootstrap({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return children;
}
