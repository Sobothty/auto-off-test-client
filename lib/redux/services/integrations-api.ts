import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type GitProvider = "github" | "gitlab";

export type ProviderAccount = {
  id?: string;
  user_id?: string;
  provider_type?: string;
  provider_account_id?: string;
  provider_username?: string;
  provider_email?: string;
  status?: string;
  connected_at?: string;
  updated_at?: string;
};

export type ProviderRepository = {
  provider_type?: string;
  provider_account_id?: string;
  provider_username?: string;
  repository_id?: string;
  name?: string;
  full_name?: string;
  is_private?: boolean;
  default_branch?: string;
  web_url?: string;
  updated_at?: string;
  clone_url?: string;
  ssh_url?: string;
};

export type ProviderAccountsResponse = {
  provider?: GitProvider;
  accounts?: ProviderAccount[];
  message?: string;
};

export type ProviderRepositoriesResponse = {
  provider?: GitProvider;
  repositories?: ProviderRepository[];
  message?: string;
};

export type ProviderConnectUrlResponse = {
  provider?: GitProvider;
  connect_url?: string;
  message?: string;
};

export const integrationsApi = createApi({
  reducerPath: "integrationsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/integrations",
  }),
  tagTypes: ["ProviderAccounts", "ProviderRepositories"],
  endpoints: (builder) => ({
    getProviderAccounts: builder.query<ProviderAccountsResponse, GitProvider>({
      query: (provider) => `/${provider}/accounts`,
      providesTags: (_result, _error, provider) => [{ type: "ProviderAccounts", id: provider }],
    }),
    getProviderRepositories: builder.query<ProviderRepositoriesResponse, GitProvider>({
      query: (provider) => `/${provider}/repositories`,
      providesTags: (_result, _error, provider) => [{ type: "ProviderRepositories", id: provider }],
    }),
    getProviderConnectUrl: builder.query<ProviderConnectUrlResponse, GitProvider>({
      query: (provider) => `/${provider}/connect-url`,
    }),
  }),
});

export const {
  useGetProviderAccountsQuery,
  useGetProviderRepositoriesQuery,
  useLazyGetProviderConnectUrlQuery,
} = integrationsApi;
