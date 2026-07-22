import { apiSlice } from "../apiSlice.js";

export const ordersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation({
      query: (payload) => ({ url: "/orders", method: "post", data: payload }),
      transformResponse: (response) => response.order,
      invalidatesTags: ["Order"],
    }),
    createPosSale: builder.mutation({
      query: (payload) => ({
        url: "/orders/pos",
        method: "post",
        data: payload,
      }),
      transformResponse: (response) => response.order,
      invalidatesTags: ["Order", "Product"],
    }),
    listMyOrders: builder.query({
      query: () => ({ url: "/orders/me" }),
      transformResponse: (response) => response.orders,
      providesTags: ["Order"],
    }),
    getMyOrder: builder.query({
      query: (id) => ({ url: `/orders/me/${id}` }),
      transformResponse: (response) => response.order,
      providesTags: (result, error, id) => [{ type: "Order", id }],
    }),
    adminListOrders: builder.query({
      query: (params = {}) => ({ url: "/orders/admin", params }),
      providesTags: ["Order"],
    }),
    adminDashboardStats: builder.query({
      query: (params = {}) => ({ url: "/orders/admin/dashboard-stats", params }),
      providesTags: ["Order"],
    }),
    adminGetOrder: builder.query({
      query: (id) => ({ url: `/orders/admin/${id}` }),
      transformResponse: (response) => response.order,
      providesTags: (result, error, id) => [{ type: "Order", id }],
    }),
    adminUpdateOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/orders/admin/${id}/status`,
        method: "patch",
        data: { status },
      }),
      transformResponse: (response) => response.order,
      invalidatesTags: (result, error, { id }) => [
        { type: "Order", id },
        "Order",
        "Product",
      ],
    }),
    adminUpdateOrderPaymentStatus: builder.mutation({
      query: ({ id, isPaid }) => ({
        url: `/orders/admin/${id}/paid`,
        method: "patch",
        data: { isPaid },
      }),
      transformResponse: (response) => response.order,
      invalidatesTags: (result, error, { id }) => [
        { type: "Order", id },
        "Order",
      ],
    }),
    adminUpdateOrderTracking: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/orders/admin/${id}/tracking`,
        method: "patch",
        data: payload,
      }),
      transformResponse: (response) => response.order,
      invalidatesTags: (result, error, { id }) => [
        { type: "Order", id },
        "Order",
      ],
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useCreatePosSaleMutation,
  useListMyOrdersQuery,
  useGetMyOrderQuery,
  useAdminListOrdersQuery,
  useAdminDashboardStatsQuery,
  useAdminGetOrderQuery,
  useAdminUpdateOrderStatusMutation,
  useAdminUpdateOrderPaymentStatusMutation,
  useAdminUpdateOrderTrackingMutation,
} = ordersApi;
