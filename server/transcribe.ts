// Speech-to-text via Groq's OpenAI-compatible Whisper endpoint. Free tier, fast.
// The general GROQ_API_KEY works for the transcription model. We call it with
// fetch + FormData (Node 18+ has these globals) so there's no extra SDK.
const GROQ_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_TRANSCRIBE_MODEL || "whisper-large-v3-turbo";
const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

export const transcribeConfigured = Boolean(GROQ_KEY);

// Returns the transcript text. Throws on failure (caller decides fallback).
export async function transcribeAudio(
  buffer: Buffer,
  contentType: string,
  filename = "audio",
): Promise<string> {
  if (!GROQ_KEY) throw new Error("GROQ_API_KEY is not set.");

  const form = new FormData();
  form.append("model", GROQ_MODEL);
  form.append("response_format", "json");
  // A Blob keeps the multipart part's content-type and filename intact.
  form.append("file", new Blob([buffer], { type: contentType }), filename);

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_KEY}` },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Groq transcription failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as { text?: string };
  return (data.text || "").trim();
}
