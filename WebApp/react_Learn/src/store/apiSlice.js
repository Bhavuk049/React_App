import { createApi } from "@reduxjs/toolkit/query/react";
import { api } from "../api/client.js";

const axiosBaseQuery =
  () =>
  async ({ url, method = "get", data, params }) => {
    try {
      const result = await api.request({ url, method, data, params });
      return { data: result.data };
    } catch (error) {
      return {
        error: {
          status: error.response?.status,
          data: error.response?.data ?? error.message,
        },
      };
    }
  };

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Product", "Category", "Order", "User", "Address", "Settings"],
  endpoints: () => ({}),
});
