import { supabase } from "@/integrations/supabase/client";

interface DownloadOptions {
  /** Display name for the downloaded file */
  filename: string;
  /** Optional callback for progress feedback */
  onProgress?: (message: string) => void;
}

/**
 * Downloads a file from a URL as a blob and triggers a proper save-to-device download.
 * Works reliably in PWA, Capacitor, and regular browsers on all platforms.
 */
export async function downloadFileFromUrl(url: string, options: DownloadOptions): Promise<void> {
  const { filename, onProgress } = options;

  onProgress?.("Preparando download...");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao baixar arquivo (HTTP ${response.status})`);
  }

  onProgress?.("Baixando arquivo...");

  const blob = await response.blob();
  triggerBlobDownload(blob, filename);

  onProgress?.("Download concluído!");
}

/**
 * Downloads a file from Supabase Storage using the SDK (handles auth & signed URLs automatically).
 */
export async function downloadFileFromStorage(
  bucket: string,
  path: string,
  options: DownloadOptions
): Promise<void> {
  const { filename, onProgress } = options;

  onProgress?.("Preparando download...");

  // Clean the path: remove any full URL prefix, keep only the storage path
  const cleanPath = path
    .replace(/^.*\/storage\/v1\/object\/(public|sign)\/[^/]+\//, "")
    .split("?")[0];

  const { data, error } = await supabase.storage.from(bucket).download(cleanPath);

  if (error) {
    throw new Error(`Erro ao acessar arquivo: ${error.message}`);
  }

  if (!data) {
    throw new Error("Arquivo não encontrado no armazenamento.");
  }

  onProgress?.("Salvando arquivo...");

  triggerBlobDownload(data, filename);

  onProgress?.("Download concluído!");
}

/**
 * Creates a temporary object URL from a Blob and triggers the browser's native download.
 */
function triggerBlobDownload(blob: Blob, filename: string): void {
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup after a short delay to ensure the download starts
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(blobUrl);
  }, 1500);
}
