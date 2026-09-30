import "server-only";
import { eq } from "drizzle-orm";
import { uploads, type Upload } from "@/db/schema";
import { cfEnv, getDb } from "@/lib/cf";
import { newId } from "@/lib/ids";
import { enforceRateLimit } from "@/lib/rate-limit";

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const PDF_MAX_BYTES = 10 * 1024 * 1024;

type Kind = { mime: string; ext: string; max: number };

const IMAGE_KINDS: Kind[] = [
  { mime: "image/jpeg", ext: "jpg", max: IMAGE_MAX_BYTES },
  { mime: "image/png", ext: "png", max: IMAGE_MAX_BYTES },
  { mime: "image/webp", ext: "webp", max: IMAGE_MAX_BYTES },
  { mime: "image/gif", ext: "gif", max: IMAGE_MAX_BYTES },
];
const PDF_KIND: Kind = { mime: "application/pdf", ext: "pdf", max: PDF_MAX_BYTES };

export class UploadError extends Error {}

/** Detects the real type from magic bytes rather than trusting the browser-supplied MIME type. */
function sniff(bytes: Uint8Array): string | null {
  const starts = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (starts([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (starts([0x47, 0x49, 0x46, 0x38])) return "image/gif";
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  if (starts([0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf";
  return null;
}

export function isPresentFile(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null && "arrayBuffer" in value && value.size > 0;
}

function safeName(name: string): string {
  return name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "file";
}

export async function storeUpload(opts: {
  file: File;
  ownerUserId: string;
  purpose: Upload["purpose"];
  visibility: Upload["visibility"];
}): Promise<Upload> {
  const allowed = opts.purpose === "portfolio" ? IMAGE_KINDS : [...IMAGE_KINDS, PDF_KIND];
  const buffer = new Uint8Array(await opts.file.arrayBuffer());
  const detected = sniff(buffer);
  const kind = allowed.find((k) => k.mime === detected);
  if (!kind) {
    throw new UploadError(
      opts.purpose === "portfolio"
        ? "Portfolio images must be JPEG, PNG, WebP or GIF."
        : "Attachments must be JPEG, PNG, WebP, GIF or PDF.",
    );
  }
  if (buffer.byteLength > kind.max) {
    throw new UploadError(`That file is too large. The limit is ${Math.round(kind.max / 1024 / 1024)} MB.`);
  }

  await enforceRateLimit("upload", opts.ownerUserId);

  const id = newId();
  const r2Key = `${opts.purpose}/${opts.ownerUserId}/${id}.${kind.ext}`;
  await cfEnv().UPLOADS.put(r2Key, buffer, {
    httpMetadata: { contentType: kind.mime },
    customMetadata: { owner: opts.ownerUserId, uploadId: id },
  });

  const [row] = await getDb()
    .insert(uploads)
    .values({
      id,
      ownerUserId: opts.ownerUserId,
      r2Key,
      contentType: kind.mime,
      size: buffer.byteLength,
      originalName: safeName(opts.file.name),
      purpose: opts.purpose,
      visibility: opts.visibility,
    })
    .returning();
  return row;
}

export async function deleteUpload(upload: Pick<Upload, "id" | "r2Key">) {
  await cfEnv().UPLOADS.delete(upload.r2Key);
  await getDb().delete(uploads).where(eq(uploads.id, upload.id));
}

export function fileUrl(uploadId: string): string {
  return `/files/${uploadId}`;
}
