import { supabase } from "../lib/supabase";

export type DriverDocKind = "license" | "nbi" | "barangay" | "medical";

const BUCKET = "driver-documents";

export const MAX_DOC_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ACCEPTED_DOC_MIME = /^(image\/.+|application\/pdf)$/;

export function validateDocFile(file: File): string | null {
  if (file.size > MAX_DOC_SIZE_BYTES) return "File is too large (max 5 MB).";
  if (!ACCEPTED_DOC_MIME.test(file.type)) return "Only images or PDF files are allowed.";
  return null;
}

function extFromFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{1,5}$/.test(fromName)) return fromName;
  if (file.type === "application/pdf") return "pdf";
  if (file.type.startsWith("image/")) return file.type.slice("image/".length) || "bin";
  return "bin";
}

export async function uploadDriverDoc(
  driverId: string,
  kind: DriverDocKind,
  file: File,
): Promise<string> {
  const path = `${driverId}/${kind}.${extFromFile(file)}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw new Error(`Upload failed for ${kind}: ${uploadError.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error(`Could not resolve public URL for ${kind}.`);
  return data.publicUrl;
}
