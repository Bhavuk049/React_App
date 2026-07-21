import { apiSlice } from "../apiSlice.js";

function addressListTags(result = []) {
  return [...result.map((a) => ({ type: "Address", id: a.id })), { type: "Address", id: "LIST" }];
}

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    updateProfile: builder.mutation({
      query: (payload) => ({ url: "/users/me", method: "patch", data: payload }),
      transformResponse: (response) => response.user,
    }),
    listAddresses: builder.query({
      query: () => ({ url: "/users/me/addresses" }),
      transformResponse: (response) => response.addresses,
      providesTags: addressListTags,
    }),
    createAddress: builder.mutation({
      query: (payload) => ({ url: "/users/me/addresses", method: "post", data: payload }),
      transformResponse: (response) => response.address,
      invalidatesTags: [{ type: "Address", id: "LIST" }],
    }),
    updateAddress: builder.mutation({
      query: ({ id, payload }) => ({ url: `/users/me/addresses/${id}`, method: "patch", data: payload }),
      transformResponse: (response) => response.address,
      invalidatesTags: (result, error, { id }) => [
        { type: "Address", id },
        { type: "Address", id: "LIST" },
      ],
    }),
    deleteAddress: builder.mutation({
      query: (id) => ({ url: `/users/me/addresses/${id}`, method: "delete" }),
      invalidatesTags: [{ type: "Address", id: "LIST" }],
    }),
    adminListUsers: builder.query({
      query: () => ({ url: "/users/admin" }),
      transformResponse: (response) => response.users,
      providesTags: (result = []) => [...result.map((u) => ({ type: "User", id: u.id })), { type: "User", id: "LIST" }],
    }),
    adminGetUser: builder.query({
      query: (id) => ({ url: `/users/admin/${id}` }),
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),
    lookupPincode: builder.query({
      query: (code) => ({ url: `/pincode/${code}` }),
    }),
  }),
});

export const {
  useUpdateProfileMutation,
  useListAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useAdminListUsersQuery,
  useAdminGetUserQuery,
  useLazyLookupPincodeQuery,
} = usersApi;
