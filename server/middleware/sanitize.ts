import sanitizeHtml from "sanitize-html";

// Strip ALL HTML tags from user-provided free text. Stories/reports are plain
// text rendered via React (which already escapes), but we sanitize at the
// boundary so nothing malicious is ever stored.
export function stripHtml(input: unknown): string {
  if (typeof input !== "string") return "";
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  }).trim();
}

// Optional null-preserving variant for nullable fields.
export function stripHtmlNullable(input: unknown): string | null {
  if (input === null || input === undefined || input === "") return null;
  const cleaned = stripHtml(input);
  return cleaned.length > 0 ? cleaned : null;
}
