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
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
