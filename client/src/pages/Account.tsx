import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Combined login / signup page.
export default function Account() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const auth = useMutation({
    mutationFn: async () => {
      const path = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body = mode === "signup"
        ? { username: username.trim(), email: email.trim(), password }
        : { username: username.trim(), password };
      const res = await apiRequest("POST", path, body);
      return res.json();
    },
    onSuccess: () => {
      // Clear cache so ownership/edit flags reflect the new identity.
      queryClient.clear();
      navigate("/my");
    },
    onError: (err: any) => {
      const msg = String(err?.message || "");
      toast({
        title: mode === "signup" ? "Couldn't sign up" : "Couldn't log in",
        description: msg.includes("409")
          ? "That username is taken."
          : mode === "signup"
          ? "Username must be 3+ chars (letters/numbers/_), password 6+."
          : "Wrong username or password.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="max-w-sm mx-auto py-12">
      <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">
        {mode === "login" ? "Welcome back" : "Create an account"}
      </h1>
      <p className="text-stone-600 mb-8">
        {mode === "login"
          ? "Log in to manage the stories you've shared."
          : "An account lets you edit and delete your own stories anytime."}
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); if (username.trim() && password) auth.mutate(); }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" value={username} autoComplete="username"
            onChange={(e) => setUsername(e.target.value)} className="mt-1.5" />
        </div>
        {mode === "signup" && (
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} autoComplete="email"
              onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
            <p className="mt-1 text-xs text-stone-400">Used only for password resets.</p>
          </div>
        )}
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
          {mode === "login" && (
            <p className="mt-1 text-right">
              <Link href="/forgot" className="text-xs text-stone-400 hover:text-stone-600">Forgot password?</Link>
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={auth.isPending}>
          {auth.isPending ? "..." : mode === "login" ? "Log in" : "Sign up"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-stone-500 text-center">
        {mode === "login" ? (
          <>No account?{" "}
            <button onClick={() => setMode("signup")} className="text-stone-900 underline underline-offset-4">Sign up</button>
          </>
        ) : (
          <>Already have one?{" "}
            <button onClick={() => setMode("login")} className="text-stone-900 underline underline-offset-4">Log in</button>
          </>
        )}
      </p>
      <p className="mt-2 text-center">
        <Link href="/" className="text-xs text-stone-400 hover:text-stone-600">Back to the archive</Link>
      </p>
    </div>
  );
}
