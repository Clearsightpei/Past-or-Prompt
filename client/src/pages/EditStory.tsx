import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Story } from "@shared/schema";

const MAX_AUDIO_MB = 25;

// Edit a story: text, the shown date, and audio (attach/replace a recording).
// Requires collection access — enforced server-side by PUT /api/stories/:id.
export default function EditStory() {
  const { id, storyId } = useParams<{ id: string; storyId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const folderId = parseInt(id);
  const parsedStoryId = parseInt(storyId);

  const [form, setForm] = useState({
    event: "",
    true_version: "",
    transcript: "",
    show_transcript: true,
    display_date: "",
    audio_url: null as string | null,
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const storyKey = `/api/stories/${parsedStoryId}`;
  const { data: story, isLoading } = useQuery({
    queryKey: [storyKey],
    queryFn: async () => {
      const response = await fetch(storyKey, { credentials: "include" });
      if (!response.ok) throw new Error('Failed to fetch story');
      return response.json() as Promise<Story>;
    },
  });

  useEffect(() => {
    if (story) {
      setForm({
        event: story.event ?? "",
        true_version: story.true_version ?? "",
        transcript: story.transcript ?? "",
        show_transcript: story.show_transcript ?? true,
        display_date: story.display_date ?? "",
        audio_url: story.audio_url ?? null,
      });
    }
  }, [story]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", storyKey, {
        event: form.event.trim() || null,
        true_version: form.true_version.trim(),
        transcript: form.transcript.trim() || null,
        show_transcript: form.show_transcript,
        display_date: form.display_date || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      queryClient.invalidateQueries({ queryKey: [storyKey] });
      toast({ title: "Saved" });
      navigate(`/collections/${folderId}`);
    },
    onError: () => toast({ title: "Couldn't save", description: "You may not have access to this collection.", variant: "destructive" }),
  });

  const attachAudio = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("audio", file);
      fd.append("show_transcript", form.show_transcript ? "true" : "false");
      const res = await fetch(`/api/stories/${parsedStoryId}/audio`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      setAudioFile(null);
      queryClient.invalidateQueries({ queryKey: [storyKey] });
      toast({ title: "Audio attached", description: "Transcribed and saved. Review the transcript below." });
    },
    onError: (e: any) => {
      setAudioFile(null);
      toast({ title: "Couldn't attach audio", description: e?.message || "Try again.", variant: "destructive" });
    },
  });

  // Upload the moment a file is chosen — no separate button to miss.
  const onPickAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (f.size > MAX_AUDIO_MB * 1024 * 1024) {
      toast({ title: "File too large", description: `Please keep audio under ${MAX_AUDIO_MB} MB.`, variant: "destructive" });
      e.target.value = "";
      return;
    }
    setAudioFile(f);
    attachAudio.mutate(f);
  };

  if (isLoading) return <p className="text-center text-stone-500 py-12">Loading...</p>;

  const hasAudio = !!form.audio_url;
  // A story is valid to save if it has written text, a transcript, or audio.
  const canSave = form.true_version.trim().length > 0 || form.transcript.trim().length > 0 || hasAudio;

  return (
    <div className="max-w-xl mx-auto">
      <Link href={`/collections/${folderId}`} className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 mb-8">
        <ArrowLeft className="h-4 w-4" />
        Back to collection
      </Link>

      <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">Edit story</h1>

      <form
        onSubmit={(e) => { e.preventDefault(); if (canSave) updateMutation.mutate(); }}
        className="space-y-6"
      >
        <div>
          <Label htmlFor="event">Title <span className="text-stone-400">(optional)</span></Label>
          <Input id="event" value={form.event} maxLength={120}
            onChange={(e) => setForm({ ...form, event: e.target.value })} className="mt-1.5 bg-white" />
        </div>

        <div>
          <Label htmlFor="display_date">Date <span className="text-stone-400">(optional — the date to display)</span></Label>
          <Input id="display_date" type="date" value={form.display_date}
            onChange={(e) => setForm({ ...form, display_date: e.target.value })} className="mt-1.5 bg-white" />
          <p className="mt-1 text-xs text-stone-400">Leave blank to show the date it was posted.</p>
        </div>

        <div>
          <Label htmlFor="true_version">Story {hasAudio && <span className="text-stone-400">(optional if you have audio)</span>}</Label>
          <Textarea id="true_version" value={form.true_version} rows={12} maxLength={20000}
            onChange={(e) => setForm({ ...form, true_version: e.target.value })} className="mt-1.5 bg-white leading-relaxed" />
        </div>

        {/* Audio: attach/replace a recording; it's transcribed + screened server-side */}
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-stone-700">
            <Mic className="h-4 w-4" />
            <span className="text-sm font-medium">Audio</span>
            {hasAudio && <span className="text-xs text-emerald-600">✓ attached</span>}
          </div>

          {hasAudio && <audio controls preload="none" src={form.audio_url!} className="w-full" />}

          <input type="file" accept="audio/*" onChange={onPickAudio} disabled={attachAudio.isPending}
            className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-stone-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-stone-700 disabled:opacity-50" />
          <p className="text-xs text-stone-400">
            {hasAudio ? "Choosing a new file replaces the current audio." : "MP3, M4A, WAV, OGG, WebM · up to " + MAX_AUDIO_MB + " MB."} It uploads, transcribes, and screens automatically when you pick it — no need to press Save.
          </p>
          {attachAudio.isPending && (
            <p className="text-sm text-stone-600">Uploading &amp; transcribing{audioFile ? ` "${audioFile.name}"` : ""}…</p>
          )}

          <label className="flex items-start gap-2 text-sm cursor-pointer pt-1">
            <input type="checkbox" className="mt-1" checked={form.show_transcript}
              onChange={(e) => setForm({ ...form, show_transcript: e.target.checked })} />
            <span>Show the transcript to readers (off = audio only; the transcript is still kept privately for moderation).</span>
          </label>

          {form.transcript.trim() !== "" && (
            <div>
              <Label htmlFor="transcript" className="text-stone-700">Transcript <span className="text-stone-400">(editable — fix any errors)</span></Label>
              <Textarea id="transcript" value={form.transcript} rows={8} maxLength={20000}
                onChange={(e) => setForm({ ...form, transcript: e.target.value })} className="mt-1.5 bg-white leading-relaxed" />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Link href={`/collections/${folderId}`} className="inline-flex items-center rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">
            Cancel
          </Link>
          <Button type="submit" disabled={updateMutation.isPending || !canSave}>
            {updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
