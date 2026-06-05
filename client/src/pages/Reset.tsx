import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Reset() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [password, setPassword] = useState("");

  const reset = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/auth/reset", { token, password }); },
    onSuccess: () => {
      queryClient.clear();
      toast({ title: "Password updated", description: "You're now logged in." });
      navigate("/my");
    },
    onError: () => toast({ title: "Couldn't reset", description: "The link may be invalid or expired.", variant: "destructive" }),
  });

  if (!token) {
    return (
      <div className="max-w-sm mx-auto py-16 text-center">
        <p className="text-stone-600 mb-4">This reset link is missing its token.</p>
        <Link href="/forgot" className="text-stone-900 underline underline-offset-4">Request a new one</Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto py-12">
      <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">Choose a new password</h1>
      <p className="text-stone-600 mb-8">Enter a new password for your account.</p>
      <form onSubmit={(e) => { e.preventDefault(); if (password.length >= 6) reset.mutate(); }} className="space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" value={password} autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
          <p className="mt-1 text-xs text-stone-400">At least 6 characters.</p>
        </div>
        <Button type="submit" className="w-full" disabled={password.length < 6 || reset.isPending}>
          {reset.isPending ? "Saving..." : "Set new password"}
        </Button>
      </form>
    </div>
  );
}
