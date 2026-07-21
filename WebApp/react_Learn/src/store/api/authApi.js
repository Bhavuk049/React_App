import { apiSlice } from "../apiSlice.js";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    requestOtp: builder.mutation({
      query: (email) => ({ url: "/auth/otp/request", method: "post", data: { email } }),
    }),
    verifyOtp: builder.mutation({
      query: ({ email, code }) => ({ url: "/auth/otp/verify", method: "post", data: { email, code } }),
    }),
    adminLogin: builder.mutation({
      query: ({ email, password }) => ({ url: "/auth/admin/login", method: "post", data: { email, password } }),
    }),
    fetchMe: builder.query({
      query: () => ({ url: "/auth/me" }),
      transformResponse: (response) => response.user,
    }),
  }),
});

export const { useRequestOtpMutation, useVerifyOtpMutation, useAdminLoginMutation, useFetchMeQuery } = authApi;
