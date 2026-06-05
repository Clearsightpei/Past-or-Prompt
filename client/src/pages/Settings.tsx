import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");

  useEffect(() => { if (user?.email) setEmail(user.email); }, [user?.email]);

  const emailMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/auth/change-email", { email: email.trim() }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }); toast({ title: "Email updated" }); },
    onError: () => toast({ title: "Couldn't update email", description: "It may be invalid or already in use.", variant: "destructive" }),
  });

  const passwordMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/auth/change-password", { current, next }); },
    onSuccess: () => { setCurrent(""); setNext(""); toast({ title: "Password changed" }); },
    onError: () => toast({ title: "Couldn't change password", description: "Check your current password.", variant: "destructive" }),
  });

  if (!isLoading && !user) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <p className="text-stone-600 mb-4">Log in to manage your account.</p>
        <Link href="/account" className="text-stone-900 underline underline-offset-4">Log in</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-serif text-3xl font-bold text-stone-900 mb-1">Account settings</h1>
      {user && <p className="text-stone-500 mb-8">Signed in as {user.username}</p>}

      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400 mb-4">Email</h2>
        <form onSubmit={(e) => { e.preventDefault(); if (email.trim()) emailMutation.mutate(); }} className="space-y-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 bg-white" />
            <p className="mt-1 text-xs text-stone-400">Used only for password resets.</p>
          </div>
          <Button type="submit" disabled={emailMutation.isPending}>
            {emailMutation.isPending ? "Saving..." : "Save email"}
          </Button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400 mb-4">Password</h2>
        <form onSubmit={(e) => { e.preventDefault(); if (current && next.length >= 6) passwordMutation.mutate(); }} className="space-y-3">
          <div>
            <Label htmlFor="current">Current password</Label>
            <Input id="current" type="password" value={current} autoComplete="current-password"
              onChange={(e) => setCurrent(e.target.value)} className="mt-1.5 bg-white" />
          </div>
          <div>
            <Label htmlFor="next">New password</Label>
            <Input id="next" type="password" value={next} autoComplete="new-password"
              onChange={(e) => setNext(e.target.value)} className="mt-1.5 bg-white" />
            <p className="mt-1 text-xs text-stone-400">At least 6 characters.</p>
          </div>
          <Button type="submit" disabled={!current || next.length < 6 || passwordMutation.isPending}>
            {passwordMutation.isPending ? "Saving..." : "Change password"}
          </Button>
        </form>
      </section>
    </div>
  );
}
