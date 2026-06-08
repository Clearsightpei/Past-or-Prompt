import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Story } from "@shared/schema";
import { ArrowLeft, PenLine, Lock, Sparkles, Pencil, Trash2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useFolder, useFolders } from "@/hooks/useFolders";
import { useConfirm } from "@/hooks/useConfirm";

type StoryWithEdit = Story & { can_edit?: boolean };

// Collection view: read the stories, unlock if private, and (with access) edit
// or delete stories. The game always reveals everything regardless of lock.
export default function FolderDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const folderId = parseInt(id);
  const { confirm, dialog } = useConfirm();

  const [password, setPassword] = useState("");

  // Manage-collection dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editVisibility, setEditVisibility] = useState<"public" | "private">("public");
  const [editPassword, setEditPassword] = useState("");
  const [editRemovePassword, setEditRemovePassword] = useState(false);

  useEffect(() => {
    if (isNaN(folderId)) navigate("/collections");
  }, [folderId, navigate]);

  const { data: folder, isLoading: isLoadingFolder } = useFolder(folderId);
  const { data: collections } = useFolders();

  const { data: stories = [], isLoading: isLoadingStories } = useQuery({
    queryKey: [`/api/stories`, { folder: folderId }],
    queryFn: async () => {
      const response = await fetch(`/api/stories?folder=${folderId}`, { credentials: "include" });
      if (!response.ok) throw new Error('Failed to fetch stories');
      return response.json() as Promise<StoryWithEdit[]>;
    },
    enabled: !isNaN(folderId) && !!folder?.can_view,
  });

  const moveMutation = useMutation({
    mutationFn: async ({ storyId, target }: { storyId: number; target: number }) => {
      await apiRequest("POST", `/api/stories/${storyId}/move`, { folder_id: target });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      toast({ title: "Story moved" });
    },
    onError: () => toast({ title: "Couldn't move", description: "You may not have access to that collection.", variant: "destructive" }),
  });

  const unlockMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/collections/${folderId}/unlock`, { password });
    },
    onSuccess: () => {
      setPassword("");
      queryClient.invalidateQueries({ queryKey: [`/api/folders/${folderId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    },
    onError: () => toast({ title: "Incorrect password", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (storyId: number) => {
      await apiRequest("DELETE", `/api/stories/${storyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      toast({ title: "Story deleted" });
    },
    onError: () => toast({ title: "Couldn't delete", variant: "destructive" }),
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/folders/${folderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      toast({ title: "Collection deleted" });
      navigate("/collections");
    },
    onError: () => toast({ title: "Couldn't delete collection", variant: "destructive" }),
  });

  const openEdit = () => {
    if (!folder) return;
    setEditName(folder.name);
    setEditVisibility(folder.visibility === "private" ? "private" : "public");
    setEditPassword("");
    setEditRemovePassword(false);
    setEditOpen(true);
  };

  const updateCollectionMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/folders/${folderId}`, {
        name: editName.trim(),
        visibility: editVisibility,
        password: editPassword.trim() || undefined,
        removePassword: editRemovePassword || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/folders/${folderId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      toast({ title: "Collection updated" });
      setEditOpen(false);
    },
    onError: () => toast({ title: "Couldn't update", description: "Private collections need a password.", variant: "destructive" }),
  });

  // Going private requires a password to exist (current or newly entered).
  const editValid =
    editName.trim().length > 0 &&
    (editVisibility === "public" ||
      (folder?.has_password && !editRemovePassword) ||
      editPassword.trim().length > 0);

  if (isNaN(folderId)) return null;

  if (isLoadingFolder) {
    return <p className="text-center text-stone-500 py-12">Loading...</p>;
  }

  if (!folder) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-600 mb-4">Collection not found.</p>
        <Link href="/collections" className="text-stone-900 underline underline-offset-4">All collections</Link>
      </div>
    );
  }

  // Private + locked → show the unlock gate (the game can still reveal it).
  if (!folder.can_view) {
    return (
      <div className="max-w-md mx-auto">
        <Link href="/collections" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 mb-8">
          <ArrowLeft className="h-4 w-4" />
          All collections
        </Link>
        <div className="rounded-lg border border-stone-200 bg-white p-8 text-center">
          <Lock className="h-8 w-8 text-stone-400 mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">{folder.name}</h1>
          <p className="text-stone-500 mb-6">This collection is private. Enter the password to read inside.</p>
          <form
            onSubmit={(e) => { e.preventDefault(); if (password.trim()) unlockMutation.mutate(); }}
            className="space-y-3"
          >
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
            />
            <Button type="submit" className="w-full" disabled={!password.trim() || unlockMutation.isPending}>
              {unlockMutation.isPending ? "Unlocking..." : "Unlock"}
            </Button>
          </form>
          <Link
            href={`/game?folder=${folder.id}`}
            className="mt-5 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800"
          >
            <Sparkles className="h-4 w-4" />
            Or discover it by playing the game
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/collections" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 mb-8">
        <ArrowLeft className="h-4 w-4" />
        All collections
      </Link>

      <div className="flex items-center justify-between mb-8 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-2">
          {folder.has_password && <Lock className="h-5 w-5 text-stone-400" />}
          <h1 className="font-serif text-3xl font-bold text-stone-900">{folder.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/game?folder=${folder.id}`}
            className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            <Sparkles className="h-4 w-4" />
            Play
          </Link>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
          >
            <PenLine className="h-4 w-4" />
            Share
          </Link>
          {folder.can_manage && folder.id !== 1 && (
            <>
              <button
                onClick={openEdit}
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
              >
                <Settings className="h-4 w-4" />
                Manage
              </button>
              <button
                onClick={async () => {
                  const ok = await confirm({
                    title: `Delete "${folder.name}"?`,
                    description: "This deletes the collection and all its stories. This can't be undone.",
                    confirmLabel: "Delete collection",
                    destructive: true,
                  });
                  if (ok) deleteCollectionMutation.mutate();
                }}
                className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Manage collection dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage collection</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); if (editValid) updateCollectionMutation.mutate(); }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={editName} maxLength={50}
                onChange={(e) => setEditName(e.target.value)} className="mt-1.5" />
            </div>

            <div>
              <Label>Who can read it?</Label>
              <div className="mt-2 space-y-2">
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input type="radio" name="evis" className="mt-1" checked={editVisibility === "public"} onChange={() => setEditVisibility("public")} />
                  <span><span className="font-medium text-stone-800">Public</span> — anyone can read inside.</span>
                </label>
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input type="radio" name="evis" className="mt-1" checked={editVisibility === "private"} onChange={() => setEditVisibility("private")} />
                  <span><span className="font-medium text-stone-800">Private</span> — a password is needed to read inside.</span>
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-pw">
                {folder.has_password ? "Change password" : "Set a password"}
                <span className="text-stone-400"> (optional)</span>
              </Label>
              <Input id="edit-pw" type="password" value={editPassword} maxLength={128}
                disabled={editRemovePassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder={folder.has_password ? "Leave blank to keep current" : "Add a password"}
                className="mt-1.5" />
              {folder.has_password && (
                <label className="mt-2 flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
                  <input type="checkbox" checked={editRemovePassword}
                    onChange={(e) => { setEditRemovePassword(e.target.checked); if (e.target.checked) setEditPassword(""); }} />
                  Remove password (only if public)
                </label>
              )}
              <p className="mt-1 text-xs text-stone-400">
                The password is a shareable key. Keep it safe — it can't be recovered.
              </p>
            </div>

            {/* Plain-language summary of the resulting access level */}
            <div className="rounded-md bg-stone-50 border border-stone-200 p-3 text-xs text-stone-600 space-y-1">
              <p className="font-semibold text-stone-700">
                {editVisibility === "private"
                  ? "🔒 Private"
                  : (folder.has_password && !editRemovePassword) || editPassword.trim()
                  ? "🔑 Public, password-protected"
                  : "🌐 For everyone (open)"}
              </p>
              {editVisibility === "private" ? (
                <p>Only you and people with the password can read or edit. Hidden from the archive, but playable in the Game.</p>
              ) : (folder.has_password && !editRemovePassword) || editPassword.trim() ? (
                <p>Anyone can read it. Only you and people with the password can add, edit, or move stories.</p>
              ) : (
                <p>Anyone can read it; any signed-in person can add/edit/move stories. Only you can rename or delete it.</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!editValid || updateCollectionMutation.isPending}>
                {updateCollectionMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoadingStories ? (
        <p className="text-center text-stone-500 py-12">Loading...</p>
      ) : stories.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-stone-600 mb-2">No stories in this collection yet.</p>
          <Link href="/submit" className="text-stone-900 underline underline-offset-4">Be the first.</Link>
        </div>
      ) : (
        <div className="space-y-5">
          {stories.map((story) => (
            <div
              key={story.id}
              className="rounded-lg border border-stone-200 bg-white p-6 hover:border-stone-400 transition-all"
            >
              <Link href={`/story/${story.id}`} className="block">
                {story.event && (
                  <h2 className="font-serif text-xl font-semibold text-stone-900 mb-2">{story.event}</h2>
                )}
                <p className="text-stone-600 leading-relaxed line-clamp-3">{story.true_version}</p>
              </Link>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs text-stone-400">{new Date(story.created_at).toLocaleDateString()}</p>
                {story.can_edit && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/collections/${folderId}/stories/${story.id}/edit`)}
                      className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 px-2 py-1"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (await confirm({ title: "Delete this story?", description: "This can't be undone.", confirmLabel: "Delete", destructive: true })) {
                          deleteMutation.mutate(story.id);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                    <select
                      value=""
                      onChange={(e) => { if (e.target.value) moveMutation.mutate({ storyId: story.id, target: Number(e.target.value) }); }}
                      className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-600"
                    >
                      <option value="">Move to…</option>
                      {collections?.filter((c) => c.id !== folderId && c.can_add).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {dialog}
    </div>
  );
}
