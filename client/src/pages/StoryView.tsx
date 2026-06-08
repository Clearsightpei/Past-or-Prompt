import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Story } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useSession } from "@/context/SessionContext";
import { useConfirm } from "@/hooks/useConfirm";
import { useFolders } from "@/hooks/useFolders";
import { ArrowLeft, ArrowRight, Flag, Sparkles, Pencil, Trash2 } from "lucide-react";

const REPORT_REASONS = [
  { value: "spam", label: "Spam or advertising" },
  { value: "abuse", label: "Abuse or harassment" },
  { value: "personal_info", label: "Exposes private information" },
  { value: "other", label: "Something else" },
];

type StoryWithEdit = Story & { can_edit?: boolean };

export default function StoryView() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { sessionId } = useSession();
  const { confirm, dialog } = useConfirm();
  const { data: collections } = useFolders();

  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: story, isLoading, error } = useQuery({
    queryKey: [`/api/stories/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/stories/${id}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch story");
      return response.json() as Promise<StoryWithEdit>;
    },
    staleTime: 0,
  });

  const { data: neighbors } = useQuery({
    queryKey: [`/api/stories/${id}/neighbors`],
    queryFn: async () => {
      const res = await fetch(`/api/stories/${id}/neighbors`);
      if (!res.ok) return { older_id: null, newer_id: null };
      return res.json() as Promise<{ older_id: number | null; newer_id: number | null }>;
    },
  });

  const submitReport = async () => {
    setSubmitting(true);
    try {
      await apiRequest("POST", `/api/stories/${id}/report`, { reason, details: details || null, sessionId });
      toast({ title: "Reported", description: "Thanks — we'll review this story." });
      setReportOpen(false);
      setDetails("");
    } catch {
      toast({ title: "Error", description: "Couldn't submit the report.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({ title: "Delete this story?", description: "This can't be undone.", confirmLabel: "Delete", destructive: true });
    if (!ok) return;
    try {
      await apiRequest("DELETE", `/api/stories/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({ title: "Story deleted" });
      navigate("/");
    } catch {
      toast({ title: "Couldn't delete", variant: "destructive" });
    }
  };

  const handleMove = async (target: number) => {
    try {
      await apiRequest("POST", `/api/stories/${id}/move`, { folder_id: target });
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({ title: "Story moved" });
    } catch {
      toast({ title: "Couldn't move", description: "You may not have access to that collection.", variant: "destructive" });
    }
  };

  if (isLoading) return <p className="text-center text-stone-500 py-12">Loading...</p>;
  if (error || !story) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-600 mb-4">This story isn't available.</p>
        <Link href="/" className="text-stone-900 underline underline-offset-4">Back to the archive</Link>
      </div>
    );
  }

  const words = story.true_version.trim().split(/\s+/).length;
  const minRead = Math.max(1, Math.round(words / 200));
  const paragraphs = story.true_version.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <article className="max-w-2xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 mb-8">
        <ArrowLeft className="h-4 w-4" />
        Back to the archive
      </Link>

      {story.event && (
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 leading-tight mb-3">{story.event}</h1>
      )}
      <p className="text-sm text-stone-400 mb-8">
        {new Date(story.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
        <span className="mx-2">·</span>{minRead} min read
      </p>

      {story.introduction && <p className="text-stone-500 italic mb-6">{story.introduction}</p>}

      <div className="space-y-5 text-stone-800 leading-[1.8] text-[1.075rem]">
        {paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-wrap">{p}</p>
        ))}
      </div>

      {/* Owner/admin controls */}
      {story.can_edit && (
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/collections/${story.folder_id}/stories/${story.id}/edit`)}>
            <Pencil className="h-4 w-4 mr-1.5" /> Edit
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-1.5" /> Delete
          </Button>
          <select
            value=""
            onChange={(e) => { if (e.target.value) handleMove(Number(e.target.value)); }}
            className="rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-600"
          >
            <option value="">Move to…</option>
            {collections?.filter((c) => c.id !== story.folder_id && c.can_add).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-10 pt-6 border-t border-stone-200 flex items-center justify-between">
        <Link href={`/game?folder=${story.folder_id}`} className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-stone-900">
          <Sparkles className="h-4 w-4" />
          Can you spot the AI imposter?
        </Link>

        <Dialog open={reportOpen} onOpenChange={setReportOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700">
              <Flag className="h-3.5 w-3.5" /> Report
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report this story</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm">Reason</Label>
                <div className="mt-2 space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <label key={r.value} className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                      <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={(e) => setReason(e.target.value)} />
                      {r.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="details" className="text-sm">Details (optional)</Label>
                <Textarea id="details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} placeholder="Anything we should know?" className="mt-1" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReportOpen(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={submitReport} disabled={submitting}>{submitting ? "Submitting..." : "Submit report"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Prev / next */}
      {(neighbors?.newer_id || neighbors?.older_id) && (
        <div className="mt-8 flex items-center justify-between text-sm">
          {neighbors?.newer_id ? (
            <Link href={`/story/${neighbors.newer_id}`} className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900">
              <ArrowLeft className="h-4 w-4" /> Newer
            </Link>
          ) : <span />}
          {neighbors?.older_id ? (
            <Link href={`/story/${neighbors.older_id}`} className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900">
              Older <ArrowRight className="h-4 w-4" />
            </Link>
          ) : <span />}
        </div>
      )}

      {dialog}
    </article>
  );
}
