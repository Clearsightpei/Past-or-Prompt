import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const forgot = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/auth/forgot", { email: email.trim() }); },
    onSuccess: () => setSent(true),
    onError: () => setSent(true), // never reveal whether the email exists
  });

  return (
    <div className="max-w-sm mx-auto py-12">
      <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">Reset password</h1>
      {sent ? (
        <>
          <p className="text-stone-600 mb-8">
            If an account exists for that email, we've sent a reset link. It expires in 1 hour.
            Check your inbox (and spam).
          </p>
          <Link href="/account" className="text-stone-900 underline underline-offset-4">Back to log in</Link>
        </>
      ) : (
        <>
          <p className="text-stone-600 mb-8">Enter your email and we'll send you a reset link.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (email.trim()) forgot.mutate(); }} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} autoComplete="email"
                onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
            </div>
            <Button type="submit" className="w-full" disabled={forgot.isPending}>
              {forgot.isPending ? "Sending..." : "Send reset link"}
            </Button>
          </form>
          <p className="mt-6 text-center">
            <Link href="/account" className="text-xs text-stone-400 hover:text-stone-600">Back to log in</Link>
          </p>
        </>
      )}
    </div>
  );
}
