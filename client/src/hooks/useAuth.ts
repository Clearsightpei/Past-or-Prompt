import { useQuery } from "@tanstack/react-query";

export type AuthUser = { id: number; username: string; email?: string | null } | null;

// Current logged-in user (or null). staleTime 0 so it reflects login/logout
// despite the app's global staleTime: Infinity.
export function useAuth() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) return { user: null };
      return res.json() as Promise<{ user: AuthUser }>;
    },
    staleTime: 0,
  });
  return { user: data?.user ?? null, isLoading };
}
