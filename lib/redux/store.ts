import { configureStore } from "@reduxjs/toolkit";

import { integrationsApi } from "@/lib/redux/services/integrations-api";

export const makeStore = () =>
  configureStore({
    reducer: {
      [integrationsApi.reducerPath]: integrationsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(integrationsApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
