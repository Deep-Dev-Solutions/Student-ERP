import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { defaultSerializeQueryArgs } from "@reduxjs/toolkit/query";
import { db } from "@/mocks/db";
import { api, prefilledReads } from "./api";
import { sessionSlice } from "./sessionSlice";

const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  [sessionSlice.name]: sessionSlice.reducer,
});

/** One store per request on the server and one per tab in the browser. */
export function makeStore() {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefault) => getDefault().concat(api.middleware),
  });
  // Seed the cache with the mock data so pages render complete on the server
  // and on the first client render, exactly as they did with inline data.
  // This is the action `api.util.upsertQueryEntries` creates, built by hand
  // with a fixed request id and timestamp: its own version calls nanoid() and
  // Date.now(), which Next.js doesn't allow while prerendering.
  store.dispatch({
    type: api.internalActions.cacheEntriesUpserted.type,
    payload: Object.entries(prefilledReads).map(([endpointName, key]) => ({
      queryDescription: {
        type: "query",
        endpointName,
        originalArgs: undefined,
        queryCacheKey: defaultSerializeQueryArgs({
          queryArgs: undefined,
          // Only used by custom serializers, which this API doesn't define.
          endpointDefinition: undefined as never,
          endpointName,
        }),
      },
      value: db[key],
    })),
    meta: { requestId: "mock-prefill", timestamp: 0 },
  });
  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
