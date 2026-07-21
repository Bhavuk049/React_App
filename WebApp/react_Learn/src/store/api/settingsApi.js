import { apiSlice } from "../apiSlice.js";

export const settingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query({
      query: () => ({ url: "/settings" }),
      transformResponse: (response) => response.settings,
      providesTags: ["Settings"],
    }),
    updateSettings: builder.mutation({
      query: (payload) => ({ url: "/settings", method: "patch", data: payload }),
      transformResponse: (response) => response.settings,
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
