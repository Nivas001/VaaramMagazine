"use client";

/**
 * Client-side PDF inspection used by the admin uploader.
 *
 * Reading the page count and rendering the front page into a cover thumbnail
 * happens in the admin's own browser. That keeps the server free of any PDF
 * processing — which is what makes the whole site fit in a free hosting tier —
 * and means the client never has to make a thumbnail by hand.
 */
export async function inspectPdf(file: File): Promise<{
  pageCount: number;
  coverBlob: Blob | null;
}> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: buffer });
  const doc = await loadingTask.promise;
  const pageCount = doc.numPages;

  let coverBlob: Blob | null = null;
  try {
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    // ~900px wide is plenty for a card thumbnail and keeps the file small.
    const scale = Math.min(900 / base.width, 2);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      coverBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82)
      );
    }
  } catch (error) {
    // A cover is a nice-to-have; the card falls back to a gradient sheet.
    console.warn("[pdf] cover render failed", error);
  }

  await loadingTask.destroy();
  return { pageCount, coverBlob };
}
