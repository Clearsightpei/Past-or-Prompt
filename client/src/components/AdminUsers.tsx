import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type AdminUser = { id: number; username: string; email: string | null; created_at: string; story_count: number };
type Banned = { id: number; email: string };

export default function AdminUsers() {
  const { toast } = useToast();
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [banOnDelete, setBanOnDelete] = useState(false);
  const [banInput, setBanInput] = useState("");

  const { data, refetch } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("unauthorized");
      return res.json() as Promise<{ users: AdminUser[]; banned: Banned[] }>;
    },
  });
  const users = data?.users ?? [];
  const banned = data?.banned ?? [];

  const after = () => { refetch(); queryClient.invalidateQueries({ queryKey: ["/api/stories"] }); };

  const resetMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", `/api/admin/users/${resetUser!.id}/reset-password`, { password: resetPw }); },
    onSuccess: () => { toast({ title: `Password reset for ${resetUser?.username}` }); setResetUser(null); setResetPw(""); },
    onError: () => toast({ title: "Couldn't reset (min 6 chars)", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => { await apiRequest("DELETE", `/api/admin/users/${deleteUser!.id}?ban=${banOnDelete}`); },
    onSuccess: () => { toast({ title: `Deleted ${deleteUser?.username}` }); setDeleteUser(null); setBanOnDelete(false); after(); },
    onError: () => toast({ title: "Couldn't delete", variant: "destructive" }),
  });

  const banMutation = useMutation({
    mutationFn: async (email: string) => { await apiRequest("POST", "/api/admin/ban-email", { email }); },
    onSuccess: () => { toast({ title: "Email banned" }); setBanInput(""); refetch(); },
    onError: () => toast({ title: "Couldn't ban", variant: "destructive" }),
  });

  const unbanMutation = useMutation({
    mutationFn: async (email: string) => { await apiRequest("POST", "/api/admin/unban-email", { email }); },
    onSuccess: () => { toast({ title: "Email unbanned" }); refetch(); },
  });

  return (
    <section className="mb-12">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400 mb-1">Users ({users.length})</h2>
      <p className="text-xs text-stone-400 mb-4">
        Passwords are encrypted (hashed) and can't be viewed by anyone — reset a user's password if they're locked out.
      </p>

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="rounded-lg border border-stone-200 bg-white p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="font-medium text-stone-800">{u.username}</span>
              <span className="text-stone-400 text-sm"> · {u.email || "no email"}</span>
              <p className="text-xs text-stone-400">
                {u.story_count} stories · joined {new Date(u.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button size="sm" variant="outline" onClick={() => { setResetUser(u); setResetPw(""); }}>Reset password</Button>
              <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => { setDeleteUser(u); setBanOnDelete(false); }}>Delete</Button>
            </div>
          </div>
        ))}
        {users.length === 0 && <p className="text-stone-500 text-sm">No accounts yet.</p>}
      </div>

      {/* Banned emails */}
      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Banned emails ({banned.length})</h3>
        <div className="flex gap-2 mb-3">
          <Input value={banInput} onChange={(e) => setBanInput(e.target.value)} placeholder="email@to-ban.com" className="max-w-xs" />
          <Button size="sm" variant="outline" onClick={() => { if (banInput.trim()) banMutation.mutate(banInput.trim()); }}>Ban email</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {banned.map((b) => (
            <span key={b.id} className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
              {b.email}
              <button className="text-stone-400 hover:text-stone-700" onClick={() => unbanMutation.mutate(b.email)}>unban</button>
            </span>
          ))}
        </div>
      </div>

      {/* Reset-password dialog */}
      <Dialog open={!!resetUser} onOpenChange={(o) => { if (!o) setResetUser(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Set a new password for {resetUser?.username}</DialogTitle></DialogHeader>
          <div>
            <Label htmlFor="newpw">New password</Label>
            <Input id="newpw" type="text" value={resetPw} onChange={(e) => setResetPw(e.target.value)} className="mt-1.5" placeholder="At least 6 characters" />
            <p className="mt-1 text-xs text-stone-400">Share this with the user; they can change it in Settings.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUser(null)}>Cancel</Button>
            <Button disabled={resetPw.length < 6 || resetMutation.isPending} onClick={() => resetMutation.mutate()}>
              {resetMutation.isPending ? "Saving..." : "Set password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteUser} onOpenChange={(o) => { if (!o) setDeleteUser(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete {deleteUser?.username}?</DialogTitle></DialogHeader>
          <p className="text-sm text-stone-600">
            Their account is removed. Their stories stay but become anonymous. This can't be undone.
          </p>
          {deleteUser?.email && (
            <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
              <input type="checkbox" checked={banOnDelete} onChange={(e) => setBanOnDelete(e.target.checked)} />
              Also ban {deleteUser.email} from registering again
            </label>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              {deleteMutation.isPending ? "Deleting..." : "Delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
