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
You are generating a counterfeit primary source for an educational "spot the fake" game. You will be given an authentic excerpt. Write a NEW passage that could pass as a genuine primary source from the same time period (modern or historical), of the same document type (letter, diary entry, speech, testimony, news dispatch, oral history) and in the same voice — but whose content is entirely invented.

Requirements:
- Match the document type, era, tone, rhetorical style, and approximate length.
- Use period-appropriate vocabulary and references. Include NO anachronisms — nothing (words, technology, concepts, events) that postdates the source.
- Invent plausible, specific-sounding details (names, places, dates, numbers) that fit the period. Concrete specificity is what makes a fabrication believable.
- Do NOT reuse the specific people, events, or facts from the source.
- Stay inside the period's worldview; never comment or moralize from a modern viewpoint.
- Output ONLY the fabricated passage — no title, preamble, or notes.

Source excerpt:
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
You are a content moderator for an anonymous community story archive. People share true stories — their OWN experiences, or stories ABOUT other people they knew, interviewed, or witnessed. Third-person stories about someone other than the author are welcome and completely normal, and mentioning real people by name inside a narrative is allowed.

Some submissions are automatic transcripts of spoken audio recordings — they may be informal, have filler words, run-on sentences, or transcription errors. That is completely fine; judge only the content, never the polish.

Your ONLY job is to block spam and genuinely harmful content. Be permissive: when in doubt, approve.

Classify the submission into exactly one verdict:
- "approve": any genuine story or account. This is the DEFAULT. Do NOT reject for being third-person, about other people, mundane, low-effort, off-topic, sad, or emotionally heavy.
- "reject": ONLY spam/advertising, OR harmful content — hate speech, harassment, threats of violence, sexual content involving minors, or malicious doxxing (publishing a real person's private contact details such as a home address, phone number, or financial/medical records in order to harm them).
- "review": only if you genuinely cannot tell whether it is harmful.

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

// ---- Reveal helpers (shown after the player guesses) ----

// One factual sentence identifying the REAL text. Names a well-known document
// only when confident; otherwise stays generic. Never invents a citation or
// source — small models get those wrong, so we don't ask for them.
const DESCRIBE_PROMPT = (text: string) => `
In ONE short sentence, plainly say what the following text is, for a game's reveal screen.
- If it is a well-known historical document, speech, or letter and you are confident, name it and its author (for example: "The Emancipation Proclamation, issued by Abraham Lincoln in 1863.").
- If you are not certain exactly what it is, do NOT guess — describe it generically instead (for example: "A personal account someone shared about their own life.").
- Never invent titles, authors, dates, sources, or web links. When unsure, stay generic.
Output only the one sentence, with no quotation marks.

Text:
${text}
`;

export async function describeTrueStory(text: string, model: string = MOD_MODEL): Promise<string> {
  const response = await client.chat({
    model,
    messages: [{ role: "user", content: DESCRIBE_PROMPT(text) }],
    stream: false,
  });
  return (response?.message?.content || "").trim();
}

// Exactly ONE concrete stylistic tell that this fabricated text was AI-written.
const TELL_PROMPT = (fakeText: string) => `
The following passage was written by an AI for a "spot the fake" game. In ONE short sentence, point out a SINGLE concrete writing-style tell in THIS passage that hints it was AI-written. Name the specific feature, and quote a few words of it if helpful. Example tells: overuse of em dashes, negative parallelism ("not X, but Y"), a tidy rule-of-three, a vague uplifting closing line, or repetitive sentence rhythm.

Rules:
- Point out only ONE tell — the single most obvious one that is actually present in the text.
- Judge writing STYLE only, never the facts or content.
- If you quote, quote only a short phrase.
Output only the one sentence.

Passage:
${fakeText}
`;

export async function spotAiTell(fakeText: string, model: string = MOD_MODEL): Promise<string> {
  const response = await client.chat({
    model,
    messages: [{ role: "user", content: TELL_PROMPT(fakeText) }],
    stream: false,
  });
  return (response?.message?.content || "").trim();
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

// The text the game fabricates against + describes: the written story if there
// is one, otherwise the (publicly shown) audio transcript.
function primaryText(story: {
  true_version?: string | null;
  transcript?: string | null;
  show_transcript?: boolean;
}): string {
  if (story.true_version && story.true_version.trim()) return story.true_version;
  if (story.show_transcript !== false && story.transcript && story.transcript.trim()) {
    return story.transcript;
  }
  return "";
}

async function runJob(job: Job): Promise<void> {
  const story = await storage.getStoryById(job.storyId);
  if (!story) return;

  const text = primaryText(story);
  const fakeRow = await storage.addFake(job.storyId, "pending", "", GEN_MODEL);
  if (!text) {
    // Nothing to fabricate (e.g. audio-only with the transcript hidden).
    await storage.setFakeStatus(fakeRow.id, "failed");
    return;
  }
  try {
    const fake = await generateFake(text);
    // One obvious "this is AI" tell in THIS fabricated text, for the reveal.
    let tell = "";
    try {
      tell = await spotAiTell(fake);
    } catch (e: any) {
      console.error(`[ollama] Tell generation failed for fake #${fakeRow.id}:`, e?.message || e);
    }
    await storage.setFakeStatus(fakeRow.id, "ready", fake, tell || undefined);
    console.log(`[ollama] Generated fake #${fakeRow.id} for story ${job.storyId}`);
  } catch (err: any) {
    await storage.setFakeStatus(fakeRow.id, "failed");
    console.error(`[ollama] Fake generation failed for story ${job.storyId}:`, err?.message || err);
  }

  // Populate the true-story identification once (shown on the reveal). Best-effort.
  if (!story.explanation) {
    try {
      const desc = await describeTrueStory(text);
      if (desc) await storage.setStoryExplanation(story.id, desc);
    } catch (e: any) {
      console.error(`[ollama] Description failed for story ${job.storyId}:`, e?.message || e);
    }
  }
}
