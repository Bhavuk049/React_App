import { apiSlice } from "../apiSlice.js";

export const legalPagesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listLegalPages: builder.query({
      query: () => ({ url: "/legal-pages" }),
      transformResponse: (response) => response.pages,
      providesTags: ["LegalPage"],
    }),
    getLegalPage: builder.query({
      query: (slug) => ({ url: `/legal-pages/${slug}` }),
      transformResponse: (response) => response.page,
      providesTags: (result, error, slug) => [{ type: "LegalPage", id: slug }],
    }),
    adminListLegalPages: builder.query({
      query: () => ({ url: "/legal-pages/admin" }),
      transformResponse: (response) => response.pages,
      providesTags: ["LegalPage"],
    }),
    adminUpdateLegalPage: builder.mutation({
      query: ({ slug, payload }) => ({ url: `/legal-pages/${slug}`, method: "patch", data: payload }),
      transformResponse: (response) => response.page,
      invalidatesTags: (result, error, { slug }) => [{ type: "LegalPage", id: slug }, "LegalPage"],
    }),
  }),
});

export const {
  useListLegalPagesQuery,
  useGetLegalPageQuery,
  useAdminListLegalPagesQuery,
  useAdminUpdateLegalPageMutation,
} = legalPagesApi;
