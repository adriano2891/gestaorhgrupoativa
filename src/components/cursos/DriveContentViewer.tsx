import { useState } from "react";
import { 
  Loader2, 
  AlertCircle, 
  FileText, 
  Video,
  Maximize,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DriveContentViewerProps {
  url: string;
  contentType?: "video" | "pdf" | "auto";
  className?: string;
}

type DriveContentType = "video" | "pdf" | "unknown";

// Detecta o tipo de conteúdo baseado no URL ou no tipo explícito
const detectContentType = (url: string): DriveContentType => {
  if (!url) return "unknown";
  
  const lowerUrl = url.toLowerCase();
  
  // Detectar PDFs por extensão ou padrões comuns
  if (lowerUrl.includes('.pdf') || 
      lowerUrl.includes('type=pdf') ||
      lowerUrl.includes('mimetype=pdf')) {
    return "pdf";
  }
  
  // Detectar vídeos por extensão ou padrões comuns
  if (lowerUrl.includes('.mp4') || 
      lowerUrl.includes('.webm') ||
      lowerUrl.includes('.mov') ||
      lowerUrl.includes('type=video') ||
      lowerUrl.includes('mimetype=video')) {
    return "video";
  }
  
  // Por padrão, assumir vídeo para links do Drive (comportamento anterior)
  return "video";
};

// Valida e converte URL do Google Drive para embed
const getGoogleDriveEmbedUrl = (url: string, contentType: DriveContentType): { 
  embedUrl: string | null; 
  error: string | null;
  detectedType: DriveContentType;
} => {
  // Detectar links de pasta (inválidos para embed)
  if (url.includes('/folders/') || url.includes('drive/folders')) {
    return { 
      embedUrl: null, 
      error: "Este é um link de pasta do Google Drive. Use o link direto do arquivo.",
      detectedType: "unknown"
    };
  }

  // Padrões para extrair ID do arquivo
  const patterns = [
    /drive\.google\.com\/file\/d\/([^/]+)/,
    /drive\.google\.com\/open\?id=([^&]+)/,
    /drive\.google\.com\/uc\?id=([^&]+)/,
    /id=([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const fileId = match[1];
      
      // Para PDFs, usar o visualizador do Google Drive
      if (contentType === "pdf") {
        return { 
          embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
          error: null,
          detectedType: "pdf"
        };
      }
      
      // Para vídeos, usar preview
      return { 
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        error: null,
        detectedType: "video"
      };
    }
  }
  
  return { 
    embedUrl: null, 
    error: "Link inválido do Google Drive. Use o formato: drive.google.com/file/d/ID",
    detectedType: "unknown"
  };
};

export const DriveContentViewer = ({ 
  url, 
  contentType = "auto",
  className = ""
}: DriveContentViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!url) {
    return (
      <div className={`aspect-video bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">Nenhum conteúdo selecionado</p>
        </div>
      </div>
    );
  }

  // Detectar tipo automaticamente ou usar o fornecido
  const detectedType = contentType === "auto" ? detectContentType(url) : contentType;
  const result = getGoogleDriveEmbedUrl(url, detectedType);

  if (!result.embedUrl) {
    return (
      <div className={`aspect-video bg-muted rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center px-4">
          <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <p className="text-muted-foreground font-medium mb-2">Link inválido</p>
          <p className="text-sm text-muted-foreground">{result.error}</p>
        </div>
      </div>
    );
  }

  const handleFullscreen = () => {
    const iframe = document.querySelector('.drive-content-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.requestFullscreen?.();
    }
  };

  const handleOpenExternal = () => {
    // Extrair ID e abrir em nova aba
    const idMatch = url.match(/\/d\/([^/]+)/);
    if (idMatch) {
      window.open(`https://drive.google.com/file/d/${idMatch[1]}/view`, '_blank');
    }
  };

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${
      result.detectedType === "pdf" ? "aspect-[3/4] min-h-[500px]" : "aspect-video"
    } ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-white mb-3" />
            <p className="text-white/70 text-sm">
              Carregando {result.detectedType === "pdf" ? "documento" : "vídeo"}...
            </p>
          </div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
          <div className="text-center px-4">
            <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <p className="text-white font-medium mb-2">Não foi possível carregar o conteúdo</p>
            <p className="text-white/70 text-sm mb-4">
              Verifique se o arquivo está compartilhado como "Qualquer pessoa com o link"
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenExternal}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir no Google Drive
            </Button>
          </div>
        </div>
      )}

      <iframe
        src={result.embedUrl}
        className="drive-content-iframe w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ border: 0 }}
        onLoad={() => {
          setIsLoading(false);
          setHasError(false);
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
      
      {/* Controles overlay */}
      {!isLoading && !hasError && (
        <div className="absolute bottom-3 right-3 flex gap-2 z-10">
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/20 h-9 w-9 opacity-70 hover:opacity-100 bg-black/50"
            onClick={handleFullscreen}
            title="Tela cheia"
          >
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Indicador de tipo */}
      {!isLoading && !hasError && (
        <div className="absolute top-3 left-3 z-10">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-black/60 rounded text-white/80 text-xs">
            {result.detectedType === "pdf" ? (
              <>
                <FileText className="h-3.5 w-3.5" />
                <span>PDF</span>
              </>
            ) : (
              <>
                <Video className="h-3.5 w-3.5" />
                <span>Vídeo</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Exportar funções utilitárias para uso em outros componentes
export { detectContentType, getGoogleDriveEmbedUrl };
