"use client";

export type Ticket = {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  headers: Record<string, string>;
  provider: "r2" | "supabase";
};

/** Asks the server for a signed URL for this exact file. */
export async function requestTicket(
  fileName: string,
  contentType: string,
  size?: number
): Promise<Ticket> {
  const response = await fetch("/api/admin/upload-ticket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, contentType, size }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error ?? "Could not prepare the upload.");
  return data as Ticket;
}

/**
 * Streams the file straight to object storage. XHR rather than fetch, because
 * only XHR reports upload progress — and a 40 MB newspaper on a slow line needs
 * a progress bar to feel trustworthy.
 */
export function putToStorage(
  ticket: Ticket,
  body: Blob,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", ticket.uploadUrl, true);
    for (const [key, value] of Object.entries(ticket.headers)) {
      xhr.setRequestHeader(key, value);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status}). ${xhr.responseText?.slice(0, 180) ?? ""}`));
    xhr.onerror = () =>
      reject(
        new Error(
          "Upload failed to reach storage. If you just set up Cloudflare R2, check the bucket's CORS rules allow PUT from this site."
        )
      );
    xhr.send(body);
  });
}
