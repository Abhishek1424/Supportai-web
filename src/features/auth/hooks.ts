// Hooks for authentication data. A hook here = a function that wraps an API call
// and gives back state: loading / error / data.
// Flutter idea: a Provider/Notifier or a Repository + FutureBuilder in one small function.
// useQuery    ~ READ data (GET). Cached. Like a FutureProvider.
// useMutation ~ CHANGE data (POST/PATCH/DELETE). Like calling a service method on a button
//   tap.
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch, authFetch } from "@/lib/api";
import type { Me } from "@/lib/types";

/** Cache key for the current user's profile. */
// The cache key. The cache is a Map; this is the key for 'current user'.
export const ME_KEY = ["me"] as const;

/**
 * Load "who am I" (user, organization, role, permissions).
 *
 * Why it exists: nearly every screen needs the permission list to decide what
 * to show. The result is cached for a minute and shared by all components.
 *
 * @returns The TanStack Query result; `data` is the Me payload once loaded.
 */
// Loads /auth/me. `staleTime` = for 60 seconds reuse the saved answer, do not call again.
export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: () => apiFetch<Me>("/auth/me"),
    staleTime: 60_000,
  });
}

/** Credentials entered on the login form. */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Mutation that logs in through the Next.js session route.
 *
 * On success the server has already set the httpOnly cookies; we only clear
 * stale cached data from any previous user.
 *
 * @returns A mutation; call `.mutate({ email, password })`.
 */
// Mutation: sends email + password. On success, clears old cached data so the next user
//   sees nothing from the last one.
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => authFetch("login", input),
    onSuccess: () => queryClient.clear(),
  });
}

/** Fields of the sign-up form. */
export interface RegisterInput {
  email: string;
  password: string;
  full_name: string;
  organization_name: string;
}

/**
 * Mutation that registers a new business (user + organization) and logs in.
 *
 * @returns A mutation; call `.mutate(RegisterInput)`.
 */
// Mutation: creates the company + owner and logs in.
export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) => authFetch("register", input),
    onSuccess: () => queryClient.clear(),
  });
}

/**
 * Mutation that ends the session.
 *
 * The cache is cleared so the next person on this browser cannot see the
 * previous user's data.
 *
 * @returns A mutation; call `.mutate()`.
 */
// Mutation: logs out. `onSettled` runs on success AND on error, like `finally`.
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authFetch("logout"),
    onSettled: () => queryClient.clear(),
  });
}
