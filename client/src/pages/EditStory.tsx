import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Story } from "@shared/schema";

// Edit a story. Requires collection access (admin or unlocked) — enforced
// server-side by PUT /api/stories/:id.
export default function EditStory() {
  const { id, storyId } = useParams<{ id: string; storyId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const folderId = parseInt(id);
  const parsedStoryId = parseInt(storyId);

  const [form, setForm] = useState({ event: "", true_version: "" });

  const { data: story, isLoading } = useQuery({
    queryKey: [`/api/stories/${parsedStoryId}`],
    queryFn: async () => {
      const response = await fetch(`/api/stories/${parsedStoryId}`, { credentials: "include" });
      if (!response.ok) throw new Error('Failed to fetch story');
      return response.json() as Promise<Story>;
    },
  });

  useEffect(() => {
    if (story) {
      setForm({
        event: story.event ?? "",
        true_version: story.true_version,
      });
    }
  }, [story]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/stories/${parsedStoryId}`, {
        event: form.event.trim() || null,
        true_version: form.true_version.trim(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${parsedStoryId}`] });
      toast({ title: "Saved" });
      navigate(`/collections/${folderId}`);
    },
    onError: () => toast({ title: "Couldn't save", description: "You may not have access to this collection.", variant: "destructive" }),
  });

  if (isLoading) return <p className="text-center text-stone-500 py-12">Loading...</p>;

  return (
    <div className="max-w-xl mx-auto">
      <Link href={`/collections/${folderId}`} className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 mb-8">
        <ArrowLeft className="h-4 w-4" />
        Back to collection
      </Link>

      <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">Edit story</h1>

      <form
        onSubmit={(e) => { e.preventDefault(); if (form.true_version.trim()) updateMutation.mutate(); }}
        className="space-y-6"
      >
        <div>
          <Label htmlFor="event">Title <span className="text-stone-400">(optional)</span></Label>
          <Input id="event" value={form.event} maxLength={120}
            onChange={(e) => setForm({ ...form, event: e.target.value })} className="mt-1.5 bg-white" />
        </div>
        <div>
          <Label htmlFor="true_version">Story</Label>
          <Textarea id="true_version" value={form.true_version} rows={14} maxLength={20000}
            onChange={(e) => setForm({ ...form, true_version: e.target.value })} className="mt-1.5 bg-white leading-relaxed" />
        </div>
        <div className="flex justify-end gap-3">
          <Link href={`/collections/${folderId}`} className="inline-flex items-center rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">
            Cancel
          </Link>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
