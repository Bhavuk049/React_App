import { apiSlice } from "../apiSlice.js";

function listTags(result = []) {
  return [
    ...result.map((c) => ({ type: "Category", id: c.id })),
    { type: "Category", id: "LIST" },
  ];
}

export const categoriesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listCategories: builder.query({
      query: () => ({ url: "/categories" }),
      transformResponse: (response) => response.categories,
      providesTags: listTags,
    }),
    adminListCategories: builder.query({
      query: () => ({ url: "/categories/admin" }),
      transformResponse: (response) => response.categories,
      providesTags: listTags,
    }),
    createCategory: builder.mutation({
      query: (payload) => ({
        url: "/categories",
        method: "post",
        data: payload,
      }),
      transformResponse: (response) => response.category,
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),
    updateCategory: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/categories/${id}`,
        method: "patch",
        data: payload,
      }),
      transformResponse: (response) => response.category,
      invalidatesTags: (result, error, { id }) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
      ],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({ url: `/categories/${id}`, method: "delete" }),
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),
  }),
});

export const {
  useListCategoriesQuery,
  useAdminListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
