import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Story, PublicFolder } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useFolders } from "@/hooks/useFolders";
import { useConfirm } from "@/hooks/useConfirm";
import { Pencil, Trash2, PenLine, Send, Lock, FolderOpen } from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  approved: { label: "Live", cls: "bg-emerald-50 text-emerald-700" },
  pending: { label: "In review", cls: "bg-amber-50 text-amber-700" },
  flagged: { label: "Flagged", cls: "bg-amber-50 text-amber-700" },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-700" },
  draft: { label: "Draft", cls: "bg-stone-100 text-stone-600" },
};

export default function MyStories() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { confirm, dialog } = useConfirm();
  const { data: collections } = useFolders();

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["/api/my/stories"],
    queryFn: async () => {
      const res = await fetch("/api/my/stories", { credentials: "include" });
      if (!res.ok) throw new Error("unauthorized");
      return res.json() as Promise<Story[]>;
    },
    enabled: !!user,
    staleTime: 0,
  });

  const { data: myCollections = [] } = useQuery({
    queryKey: ["/api/my/collections"],
    queryFn: async () => {
      const res = await fetch("/api/my/collections", { credentials: "include" });
      if (!res.ok) throw new Error("unauthorized");
      return res.json() as Promise<PublicFolder[]>;
    },
    enabled: !!user,
    staleTime: 0,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/my/stories"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/stories/${id}`); },
    onSuccess: () => { refresh(); toast({ title: "Story deleted" }); },
    onError: () => toast({ title: "Couldn't delete", variant: "destructive" }),
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, folder_id }: { id: number; folder_id: number }) => {
      await apiRequest("POST", `/api/stories/${id}/move`, { folder_id });
    },
    onSuccess: () => { refresh(); toast({ title: "Moved" }); },
    onError: () => toast({ title: "Couldn't move", variant: "destructive" }),
  });

  const publishMutation = useMutation({
    mutationFn: async (id: number) => { return (await apiRequest("POST", `/api/stories/${id}/publish`, {})).json(); },
    onSuccess: (data: any) => {
      refresh();
      toast({ title: data?.status === "approved" ? "Published — it's live" : "Submitted for review" });
    },
    onError: () => toast({ title: "Couldn't publish", variant: "destructive" }),
  });

  const onDelete = async (id: number) => {
    if (await confirm({ title: "Delete this story?", description: "This can't be undone.", confirmLabel: "Delete", destructive: true })) {
      deleteMutation.mutate(id);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-3">My stories</h1>
        <p className="text-stone-600 mb-6">Log in to see and manage the stories you've shared.</p>
        <Link href="/account" className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-700">Log in or sign up</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8 border-b border-stone-200 pb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">My stories</h1>
          {user && <p className="mt-1 text-stone-500">Signed in as {user.username}</p>}
        </div>
        <Link href="/submit" className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700">
          <PenLine className="h-4 w-4" /> Share
        </Link>
      </div>

      {/* My collections */}
      {myCollections.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400 mb-3">My collections</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myCollections.map((c) => (
              <Link key={c.id} href={`/collections/${c.id}`} className="rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-400 flex items-center gap-2">
                {c.has_password ? <Lock className="h-4 w-4 text-stone-400" /> : <FolderOpen className="h-4 w-4 text-stone-400" />}
                <span className="font-serif font-semibold text-stone-900">{c.name}</span>
                <span className="ml-auto text-xs text-stone-400">{c.story_count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400 mb-3">Stories</h2>
      {isLoading ? (
        <p className="text-center text-stone-500 py-12">Loading...</p>
      ) : stories.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-stone-600 mb-2">You haven't shared any stories yet.</p>
          <Link href="/submit" className="text-stone-900 underline underline-offset-4">Share your first.</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map((story) => {
            const s = STATUS_LABEL[story.status] ?? { label: story.status, cls: "bg-stone-100 text-stone-600" };
            return (
              <div key={story.id} className="rounded-lg border border-stone-200 bg-white p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {story.event && <h3 className="font-serif text-xl font-semibold text-stone-900 mb-1">{story.event}</h3>}
                    <p className="text-stone-600 leading-relaxed line-clamp-2">{story.true_version}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {story.status === "draft" && (
                    <button onClick={() => publishMutation.mutate(story.id)} className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 px-2 py-1">
                      <Send className="h-3.5 w-3.5" /> Publish
                    </button>
                  )}
                  <button onClick={() => navigate(`/collections/${story.folder_id}/stories/${story.id}/edit`)} className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 px-2 py-1">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => onDelete(story.id)} className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) moveMutation.mutate({ id: story.id, folder_id: Number(e.target.value) }); }}
                    className="ml-auto rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-600"
                  >
                    <option value="">Move to…</option>
                    {collections?.filter((c) => c.id !== story.folder_id && c.can_add).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dialog}
    </div>
  );
}
