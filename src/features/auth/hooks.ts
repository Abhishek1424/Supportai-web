"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch, authFetch } from "@/lib/api";
import type { Me } from "@/lib/types";

/** Cache key for the current user's profile. */
export const ME_KEY = ["me"] as const;

/**
 * Load "who am I" (user, organization, role, permissions).
 *
 * Why it exists: nearly every screen needs the permission list to decide what
 * to show. The result is cached for a minute and shared by all components.
 *
 * @returns The TanStack Query result; `data` is the Me payload once loaded.
 */
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
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authFetch("logout"),
    onSettled: () => queryClient.clear(),
  });
}
