import { apiSlice } from "../apiSlice.js";

function listTags(result) {
  const products = result?.products ?? [];
  return [...products.map((p) => ({ type: "Product", id: p.id })), { type: "Product", id: "LIST" }];
}

export const productsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listProducts: builder.query({
      query: (params = {}) => ({ url: "/products", params }),
      providesTags: listTags,
    }),
    getProduct: builder.query({
      query: (slug) => ({ url: `/products/${slug}` }),
      transformResponse: (response) => response.product,
      providesTags: (result, error, slug) => [{ type: "Product", id: slug }],
    }),
    adminListProducts: builder.query({
      query: (params = {}) => ({ url: "/products/admin", params }),
      providesTags: listTags,
    }),
    adminGetProduct: builder.query({
      query: (id) => ({ url: `/products/admin/${id}` }),
      providesTags: (result, error, id) => [{ type: "Product", id }],
    }),
    createProduct: builder.mutation({
      query: (formData) => ({ url: "/products", method: "post", data: formData }),
      transformResponse: (response) => response.product,
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),
    updateProduct: builder.mutation({
      query: ({ id, formData }) => ({ url: `/products/${id}`, method: "patch", data: formData }),
      transformResponse: (response) => response.product,
      invalidatesTags: (result, error, { id }) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
      ],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({ url: `/products/${id}`, method: "delete" }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),
  }),
});

export const {
  useListProductsQuery,
  useGetProductQuery,
  useAdminListProductsQuery,
  useAdminGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;
