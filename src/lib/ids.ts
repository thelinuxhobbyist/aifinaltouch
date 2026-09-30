export function newId(): string {
  return crypto.randomUUID();
}

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

export function shortId(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function slugify(input: string, maxLength = 60): string {
  const slug = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
  return slug || "item";
}

export function slugWithSuffix(input: string): string {
  return `${slugify(input)}-${shortId()}`;
}
