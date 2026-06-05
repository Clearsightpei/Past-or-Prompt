import { Ollama } from "ollama";
import { storage } from "./storage";

// Local Ollama by default; set OLLAMA_HOST=https://ollama.com + OLLAMA_API_KEY
// to use Ollama Cloud instead. The key is sent as a Bearer header (ignored by a
// local server, required by the cloud).
const host = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const GEN_MODEL = process.env.OLLAMA_GEN_MODEL || "llama3.2";
const MOD_MODEL = process.env.OLLAMA_MOD_MODEL || GEN_MODEL;
const apiKey = process.env.OLLAMA_API_KEY;

const client = new Ollama({
  host,
  ...(apiKey ? { headers: { Authorization: `Bearer ${apiKey}` } } : {}),
});

// ---- Fake-story generation ----

const FAKE_PROMPT = (trueText: string) => `
Write a new, original short text that matches the writing style, tone, and voice of the following source text.

Requirements:
- Do NOT copy phrases, sentences, or specific events from the source.
- Do NOT preserve characters, settings, or plot details.
- Match the source's writing style closely (syntax, rhythm, diction, level of formality, narrative distance).
- Match the overall tone and mood.
- Keep the length approximately the same.
- The content may differ entirely, but it should feel as if written by the same author.
- Do not use em dashes.
- Output ONLY the story text, with no preamble or explanation.

Source text:
${trueText}
`;

export async function generateFake(trueText: string, model: string = GEN_MODEL): Promise<string> {
  const response = await client.chat({
    model,
    messages: [{ role: "user", content: FAKE_PROMPT(trueText) }],
    stream: false,
  });
  const content = response?.message?.content?.trim();
  if (!content) {
    throw new Error("Empty response from model");
  }
  return content;
}

// ---- Moderation ----

export type ModerationVerdict = {
  verdict: "approve" | "review" | "reject";
  reasons: string;
};

const MOD_PROMPT = (text: string) => `
You are a content moderator for an anonymous community story archive where people share true personal stories.

Classify the following submission into exactly one verdict:
- "approve": a genuine personal/historical story, safe to publish.
- "review": borderline — possibly off-topic, low-effort, or needs a human look.
- "reject": spam, advertising, hate speech, harassment, threats, sexually explicit content involving minors, or attempts to dox/expose someone's private information.

Respond with ONLY a JSON object, no other text:
{"verdict": "approve" | "review" | "reject", "reasons": "<one short sentence>"}

Submission:
${text}
`;

export async function moderateText(text: string, model: string = MOD_MODEL): Promise<ModerationVerdict> {
  const response = await client.chat({
    model,
    messages: [{ role: "user", content: MOD_PROMPT(text) }],
    stream: false,
    format: "json",
  });
  const raw = response?.message?.content?.trim() || "";
  try {
    const parsed = JSON.parse(raw);
    const verdict = parsed.verdict;
    if (verdict === "approve" || verdict === "review" || verdict === "reject") {
      return { verdict, reasons: String(parsed.reasons || "") };
    }
  } catch {
    // fall through to fail-closed
  }
  // Fail closed: anything we can't parse goes to human review, never auto-approve.
  return { verdict: "review", reasons: "Moderation model returned an unparseable response." };
}

// ---- Async fake-generation job runner ----
//
// A tiny in-process queue with a concurrency cap. No external infra. Each job
// inserts a `pending` story_fakes row, calls the model, then flips it to
// `ready` (with content) or `failed`. Gameplay only ever serves `ready` rows.

type Job = { storyId: number };
const queue: Job[] = [];
let active = 0;
const MAX_CONCURRENCY = 1; // local models are heavy; keep this low

export function enqueueFakeGeneration(storyId: number, variants: number = 1): void {
  for (let i = 0; i < variants; i++) {
    queue.push({ storyId });
  }
  pump();
}

function pump(): void {
  while (active < MAX_CONCURRENCY && queue.length > 0) {
    const job = queue.shift()!;
    active++;
    runJob(job).finally(() => {
      active--;
      pump();
    });
  }
}

async function runJob(job: Job): Promise<void> {
  const story = await storage.getStoryById(job.storyId);
  if (!story) return;

  const fakeRow = await storage.addFake(job.storyId, "pending", "", GEN_MODEL);
  try {
    const fake = await generateFake(story.true_version);
    await storage.setFakeStatus(fakeRow.id, "ready", fake);
    console.log(`[ollama] Generated fake #${fakeRow.id} for story ${job.storyId}`);
  } catch (err: any) {
    await storage.setFakeStatus(fakeRow.id, "failed");
    console.error(`[ollama] Fake generation failed for story ${job.storyId}:`, err?.message || err);
  }
}
