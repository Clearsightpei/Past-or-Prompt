import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/context/SessionContext";
import { useAuth } from "@/hooks/useAuth";
import { useFolders } from "@/hooks/useFolders";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

// True-story-only submission. Fakes + moderation happen server-side, so the
// contributor only ever writes the real story.
export default function Submit() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { sessionId } = useSession();
  const { user } = useAuth();
  const { data: collections } = useFolders();

  const [event, setEvent] = useState("");
  const [trueVersion, setTrueVersion] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [done, setDone] = useState<null | "approved" | "pending" | "rejected">(null);

  const submitMutation = useMutation({
    mutationFn: async (draft: boolean) => {
      const response = await apiRequest("POST", "/api/submissions", {
        event: event.trim() || null,
        true_version: trueVersion.trim(),
        folder_id: collectionId ? Number(collectionId) : undefined,
        sessionId,
        draft,
      });
      return response.json() as Promise<{ id: number; status: string }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      if (data.status === "draft") {
        toast({ title: "Saved as draft", description: "Find it under My Stories." });
        navigate("/my");
      } else {
        setDone((data.status as any) || "pending");
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Couldn't submit your story.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trueVersion.trim().length === 0) {
      toast({ title: "Story required", description: "Please write your story first.", variant: "destructive" });
      return;
    }
    submitMutation.mutate(false);
  };

  if (done) {
    const message =
      done === "approved"
        ? "Your story is live in the archive. Thank you for sharing."
        : done === "rejected"
        ? "Thanks for your submission. It didn't pass our automated review, so it won't be published."
        : "Your story was received and is awaiting review. Thank you for sharing.";
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-5" />
        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-3">Submitted</h1>
        <p className="text-stone-600 mb-8">{message}</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-700">
            Back to the archive
          </Link>
          <button
            onClick={() => { setDone(null); setEvent(""); setTrueVersion(""); }}
            className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            Share another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 mb-8">
        <ArrowLeft className="h-4 w-4" />
        Back to the archive
      </Link>

      <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">Share your story</h1>
      <p className="text-stone-600 mb-8">
        Write a true story you'd like to add to the archive. Submissions are anonymous and
        reviewed before they appear. You only write the real story — no need to invent anything.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="event" className="text-stone-700">Title <span className="text-stone-400">(optional)</span></Label>
          <Input
            id="event"
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            maxLength={120}
            placeholder="Give your story a title"
            className="mt-1.5 bg-white"
          />
        </div>

        <div>
          <Label htmlFor="true_version" className="text-stone-700">Your story</Label>
          <Textarea
            id="true_version"
            value={trueVersion}
            onChange={(e) => setTrueVersion(e.target.value)}
            maxLength={20000}
            rows={14}
            placeholder="Tell it as it happened..."
            className="mt-1.5 bg-white leading-relaxed"
          />
          <p className="mt-1 text-xs text-stone-400">
            {trueVersion.trim() ? trueVersion.trim().split(/\s+/).length : 0} words (up to ~3000)
          </p>
        </div>

        <div>
          <Label htmlFor="collection" className="text-stone-700">Collection <span className="text-stone-400">(optional)</span></Label>
          <select
            id="collection"
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            <option value="">No specific collection</option>
            {collections?.filter((c) => c.id !== 1).map((c) => (
              <option key={c.id} value={c.id.toString()}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/" className="inline-flex items-center rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">
            Cancel
          </Link>
          {user && (
            <Button type="button" variant="outline" disabled={submitMutation.isPending}
              onClick={() => { if (trueVersion.trim()) submitMutation.mutate(true); }}>
              Save as draft
            </Button>
          )}
          <Button type="submit" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? "Submitting..." : "Submit story"}
          </Button>
        </div>
      </form>
    </div>
  );
}
