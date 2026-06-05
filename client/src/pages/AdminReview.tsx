import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Story, Report } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFolders } from "@/hooks/useFolders";
import AdminUsers from "@/components/AdminUsers";
import { Check, X, Flag, RefreshCw } from "lucide-react";

export default function AdminReview() {
  const { toast } = useToast();
  const { data: collections } = useFolders();
  const [password, setPassword] = useState("");

  // Auth state
  const { data: me, refetch: refetchMe } = useQuery({
    queryKey: ['/api/admin/me'],
    queryFn: async () => {
      const res = await fetch('/api/admin/me', { credentials: 'include' });
      return res.json() as Promise<{ isAdmin: boolean }>;
    },
  });

  const login = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/login", { password });
    },
    // Clear cached queries so admin access flags (folders, can_edit, etc.) refetch.
    onSuccess: () => { setPassword(""); queryClient.clear(); refetchMe(); },
    onError: () => toast({ title: "Incorrect password", variant: "destructive" }),
  });

  const logout = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/admin/logout", {}); },
    onSuccess: () => { queryClient.clear(); refetchMe(); },
  });

  const isAdmin = me?.isAdmin;

  const { data: queue = [], refetch: refetchQueue } = useQuery({
    queryKey: ['/api/admin/queue'],
    queryFn: async () => {
      const res = await fetch('/api/admin/queue', { credentials: 'include' });
      if (!res.ok) throw new Error('unauthorized');
      return res.json() as Promise<Story[]>;
    },
    enabled: !!isAdmin,
  });

  const { data: reports = [], refetch: refetchReports } = useQuery({
    queryKey: ['/api/admin/reports'],
    queryFn: async () => {
      const res = await fetch('/api/admin/reports', { credentials: 'include' });
      if (!res.ok) throw new Error('unauthorized');
      return res.json() as Promise<Report[]>;
    },
    enabled: !!isAdmin,
  });

  const act = async (path: string, body?: any) => {
    try {
      await apiRequest("POST", path, body ?? {});
      refetchQueue();
      refetchReports();
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-sm mx-auto py-16">
        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">Admin</h1>
        <form onSubmit={(e) => { e.preventDefault(); login.mutate(); }} className="space-y-4">
          <div>
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
          </div>
          <Button type="submit" disabled={login.isPending} className="w-full">
            {login.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-bold text-stone-900">Moderation</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const res = await apiRequest("POST", "/api/admin/approve-all-pending", {});
                const { approved } = await res.json();
                toast({ title: `Approved ${approved} pending` });
                refetchQueue();
                queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
              } catch {
                toast({ title: "Failed to approve all", variant: "destructive" });
              }
            }}
          >
            Approve all pending
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const res = await apiRequest("POST", "/api/admin/regenerate-missing-fakes", {});
                const { enqueued } = await res.json();
                toast({ title: `Generating ${enqueued} AI version${enqueued === 1 ? "" : "s"}`, description: "Refresh in a moment." });
              } catch {
                toast({ title: "Failed to start generation", variant: "destructive" });
              }
            }}
          >
            Retry missing AI versions
          </Button>
          <Button variant="outline" size="sm" onClick={() => logout.mutate()}>Sign out</Button>
        </div>
      </div>

      {/* Submission queue */}
      <section className="mb-12">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400 mb-4">
          Pending & flagged ({queue.length})
        </h2>
        {queue.length === 0 ? (
          <p className="text-stone-500 text-sm">Nothing to review. 🎉</p>
        ) : (
          <div className="space-y-4">
            {queue.map((story) => (
              <div key={story.id} className="rounded-lg border border-stone-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-2">
                  {story.status === "flagged" && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                      <Flag className="h-3 w-3" /> flagged
                    </span>
                  )}
                  {story.event && <span className="font-serif font-semibold text-stone-900">{story.event}</span>}
                </div>
                {story.moderation_reason && (
                  <p className="text-xs text-stone-400 mb-2">AI note: {story.moderation_reason}</p>
                )}
                <p className="text-stone-600 text-sm whitespace-pre-wrap line-clamp-6">{story.true_version}</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => act(`/api/admin/stories/${story.id}/approve`)}>
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => act(`/api/admin/stories/${story.id}/reject`)}>
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => act(`/api/admin/stories/${story.id}/regenerate-fake`)}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Regenerate fake
                  </Button>
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) act(`/api/stories/${story.id}/move`, { folder_id: Number(e.target.value) }); }}
                    className="ml-auto rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-600"
                  >
                    <option value="">Move to…</option>
                    {collections?.filter((c) => c.id !== story.folder_id).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Users */}
      <AdminUsers />

      {/* Open reports */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400 mb-4">
          Open reports ({reports.length})
        </h2>
        {reports.length === 0 ? (
          <p className="text-stone-500 text-sm">No open reports.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="rounded-lg border border-stone-200 bg-white p-4 flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-stone-800">Story #{report.story_id}</span>
                  <span className="text-stone-400"> — {report.reason}</span>
                  {report.details && <p className="text-stone-500 text-xs mt-1">{report.details}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => act(`/api/admin/reports/${report.id}/resolve`, { status: "reviewed" })}>
                    Reviewed
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => act(`/api/admin/reports/${report.id}/resolve`, { status: "dismissed" })}>
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
