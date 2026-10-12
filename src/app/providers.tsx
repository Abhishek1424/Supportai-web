// What is this file?   Creates the shared data cache (QueryClient) and gives it to the
//   whole app.
// Flutter/Dart idea:   like wrapping your app with `MultiProvider(providers: [...])`.
//                      Any widget below can then read the cache, like `context.read<T>()`.
//                      TanStack Query (React Query) = a helper that fetches API data, keeps
//                        it
//                      in memory (cache), and refetches it when needed. Similar to a
//                        repository
//                      with caching + loading/error state, all in one.
// "use client" at the top means: this file runs in the browser (it uses state).
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * Provides the TanStack Query cache to the whole app.
 *
 * The client is created inside useState so every browser session gets its own
 * cache (a module-level client would be shared between users during server
 * rendering). Failed requests are not retried automatically: an API error such
 * as "wrong password" or "permission denied" will not fix itself.
 *
 * @param props.children The app.
 * @returns The children wrapped in the provider.
 */
// Component with a `children` parameter (the app). It returns the provider wrapping the
//   children.
export function Providers({ children }: { children: ReactNode }) {
  // Dart/Flutter idea:
  //  Think of this like creating one object and keeping the same instance
  //  instead of creating a new object every time the widget rebuilds.
  //  Similar idea:
  //    late final QueryClient client;
  //    client = QueryClient(...);
  //  We keep one instance because the QueryClient stores the API/cache information.
  //  (`useState(() => new X())` runs the function only once, like `initState`.)
  // `retry: false` = do not call again after an error. A wrong password will not fix
  //   itself.
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
