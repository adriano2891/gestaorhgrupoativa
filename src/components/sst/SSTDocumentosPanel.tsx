import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Trash2, FileText, Paperclip, Loader2, Eye } from "lucide-react";
import { useSSTDocumentos, useUploadSSTDocumento, useDeleteSSTDocumento, getSignedUrl, SSTDocumento } from "@/hooks/useSSTDocumentos";
import { format } from "date-fns";
import { toast } from "sonner";

interface SSTDocumentosPanelProps {
  registroTipo: string;
  registroId: string;
  registroNome?: string;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
];

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export const SSTDocumentosPanel = ({ registroTipo, registroId, registroNome }: SSTDocumentosPanelProps) => {
  const { data: documentos, isLoading } = useSSTDocumentos(registroTipo, registroId);
  const upload = useUploadSSTDocumento();
  const deletar = useDeleteSSTDocumento();
  const fileRef = useRef<HTMLInputElement>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Formato não permitido. Use PDF, JPG ou PNG.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Arquivo muito grande. Máximo 20MB.");
      return;
    }

    upload.mutate({ file, registroTipo, registroId });
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDownload = async (doc: SSTDocumento) => {
    try {
      setDownloading(doc.id);
      const url = await getSignedUrl(doc.arquivo_url);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.arquivo_nome;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      toast.error("Erro ao baixar arquivo", { description: err.message });
    } finally {
      setDownloading(null);
    }
  };

  const handleView = async (doc: SSTDocumento) => {
    try {
      setDownloading(doc.id);
      const url = await getSignedUrl(doc.arquivo_url);
      window.open(url, "_blank");
    } catch (err: any) {
      toast.error("Erro ao abrir arquivo", { description: err.message });
    } finally {
      setDownloading(null);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Paperclip className="h-4 w-4" />
          Documentos Anexados
          {documentos && documentos.length > 0 && (
            <Badge variant="secondary" className="text-xs">{documentos.length}</Badge>
          )}
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
            className="gap-1"
          >
            {upload.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Upload className="h-3 w-3" />
            )}
            Anexar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : !documentos || documentos.length === 0 ? (
        <div className="text-sm text-muted-foreground py-2 text-center border border-dashed rounded-md">
          Nenhum documento anexado
        </div>
      ) : (
        <div className="space-y-1.5">
          {documentos.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-2 p-2 rounded-md border bg-muted/30 text-sm"
            >
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-foreground">{doc.arquivo_nome}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(doc.arquivo_tamanho)} · {format(new Date(doc.created_at), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleView(doc)}
                  disabled={downloading === doc.id}
                  title="Visualizar"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDownload(doc)}
                  disabled={downloading === doc.id}
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => deletar.mutate(doc)}
                  disabled={deletar.isPending}
                  title="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
