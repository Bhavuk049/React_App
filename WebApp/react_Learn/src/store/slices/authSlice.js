import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authApi } from "../api/authApi.js";

export const initializeAuth = createAsyncThunk("auth/initialize", async (_, { dispatch }) => {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    return await dispatch(authApi.endpoints.fetchMe.initiate()).unwrap();
  } catch {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return null;
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: { user: null, loading: true },
  reducers: {
    setCredentials(state, action) {
      state.user = action.payload.user;
    },
    setUser(state, action) {
      state.user = action.payload;
    },
    logout(state) {
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.user = null;
        state.loading = false;
      });
  },
});

export const { setCredentials, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
