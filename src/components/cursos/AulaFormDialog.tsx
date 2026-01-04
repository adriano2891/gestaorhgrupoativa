import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Upload, 
  Youtube, 
  Link, 
  HardDrive,
  Save,
  X,
  Video,
  Loader2,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type VideoSourceType = "upload" | "youtube" | "drive" | "drive_pdf" | "link" | "link_pdf";

interface AulaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduloId: string;
  ordem: number;
  onSuccess: () => void;
}

interface AulaFormData {
  titulo: string;
  descricao: string;
  duracao: number;
  video_url: string;
  video_source: VideoSourceType;
  material_apoio_url?: string;
}

// Função para converter URL do YouTube para embed com branding mínimo
const getYouTubeEmbedUrl = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
    /youtube\.com\/shorts\/([^&?/]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Parâmetros para ocultar branding do YouTube ao máximo permitido:
      // - modestbranding=1: minimiza logo do YouTube
      // - rel=0: não mostra vídeos relacionados
      // - showinfo=0: oculta título (deprecated mas ainda funciona em alguns casos)
      // - controls=0: oculta barra de controles
      // - iv_load_policy=3: oculta anotações
      // - fs=0: oculta botão fullscreen (que mostra logo)
      // - disablekb=1: desabilita controles de teclado
      // - cc_load_policy=0: não carrega legendas automaticamente
      // - playsinline=1: reproduz inline no mobile
      // Usando youtube-nocookie.com para maior privacidade
      return `https://www.youtube-nocookie.com/embed/${match[1]}?modestbranding=1&rel=0&showinfo=0&controls=0&iv_load_policy=3&fs=0&disablekb=1&cc_load_policy=0&playsinline=1`;
    }
  }
  return null;
};

// Função para validar e converter URL do Google Drive para embed
const getGoogleDriveEmbedUrl = (url: string, isPdf: boolean = false): { embedUrl: string | null; error: string | null } => {
  // Detectar links de pasta (inválidos para embed)
  if (url.includes('/folders/') || url.includes('drive/folders')) {
    return { 
      embedUrl: null, 
      error: "Este é um link de pasta do Google Drive. Use o link direto do arquivo." 
    };
  }

  const patterns = [
    /drive\.google\.com\/file\/d\/([^/]+)/,
    /drive\.google\.com\/open\?id=([^&]+)/,
    /drive\.google\.com\/uc\?id=([^&]+)/,
    /id=([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Usar preview para ambos os tipos
      return { 
        embedUrl: `https://drive.google.com/file/d/${match[1]}/preview`,
        error: null 
      };
    }
  }
  return { 
    embedUrl: null, 
    error: isPdf 
      ? "Link inválido. Use o formato: drive.google.com/file/d/ID do arquivo PDF."
      : "Link inválido. Use o formato: drive.google.com/file/d/ID ou clique com botão direito no arquivo e copie o link." 
  };
};

// Função para validar URL de PDF externa
const validateExternalPdfUrl = (url: string): { url: string | null; error: string | null } => {
  const trimmedUrl = url.trim();
  
  // Verificar se é uma URL válida
  try {
    new URL(trimmedUrl);
  } catch {
    return { url: null, error: "URL inválida. Insira uma URL completa começando com https://" };
  }
  
  // Verificar se começa com https (segurança)
  if (!trimmedUrl.startsWith('https://')) {
    return { url: null, error: "Por segurança, use apenas links HTTPS." };
  }
  
  // Verificar se parece ser um PDF
  const lowerUrl = trimmedUrl.toLowerCase();
  const isPdf = lowerUrl.includes('.pdf') || 
                lowerUrl.includes('type=pdf') || 
                lowerUrl.includes('format=pdf') ||
                lowerUrl.includes('/pdf/') ||
                lowerUrl.includes('mimetype=application/pdf');
  
  if (!isPdf) {
    return { 
      url: trimmedUrl, 
      error: "⚠️ A URL não parece ser de um PDF. Confirme se o link está correto." 
    };
  }
  
  return { url: trimmedUrl, error: null };
};

// Função para processar URL genérica de vídeo
const processVideoUrl = (url: string, source: VideoSourceType): { url: string | null; error: string | null; warning?: boolean } => {
  if (!url.trim()) return { url: null, error: null };
  
  switch (source) {
    case "youtube":
      const ytUrl = getYouTubeEmbedUrl(url);
      return { url: ytUrl, error: ytUrl ? null : "Link inválido. Use o formato padrão do YouTube." };
    case "drive":
      const driveResult = getGoogleDriveEmbedUrl(url, false);
      return { url: driveResult.embedUrl, error: driveResult.error };
    case "drive_pdf":
      const pdfResult = getGoogleDriveEmbedUrl(url, true);
      return { url: pdfResult.embedUrl, error: pdfResult.error };
    case "link_pdf":
      const externalPdfResult = validateExternalPdfUrl(url);
      return { 
        url: externalPdfResult.url, 
        error: externalPdfResult.error?.startsWith("⚠️") ? null : externalPdfResult.error,
        warning: externalPdfResult.error?.startsWith("⚠️")
      };
    case "link":
    case "upload":
      return { url, error: null };
    default:
      return { url: null, error: null };
  }
};

export const AulaFormDialog = ({
  open,
  onOpenChange,
  moduloId,
  ordem,
  onSuccess,
}: AulaFormDialogProps) => {
  const [formData, setFormData] = useState<AulaFormData>({
    titulo: "",
    descricao: "",
    duracao: 0,
    video_url: "",
    video_source: "upload",
  });
  const [rawUrl, setRawUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (open) {
      setFormData({
        titulo: "",
        descricao: "",
        duracao: 0,
        video_url: "",
        video_source: "upload",
      });
      setRawUrl("");
      setUrlError(null);
      setUploadProgress(0);
    }
  }, [open]);

  const handleFileUpload = async (file: File) => {
    const fileExt = (file.name.split(".").pop() || "").toLowerCase();

    // Formatos aceitos para upload (incluindo WMV)
    const allowedExts = ["mp4", "webm", "mov", "m4v", "avi", "mkv", "wmv"];
    const allowedMimes = [
      "video/mp4", 
      "video/webm", 
      "video/quicktime", 
      "video/x-m4v", 
      "video/avi", 
      "video/x-matroska",
      "video/x-msvideo",
      "video/x-ms-wmv",
      "video/wmv"
    ];
    
    // Formatos com reprodução garantida nos navegadores
    const nativelySupportedExts = ["mp4", "webm", "mov", "m4v"];
    
    // Formatos que podem precisar de conversão
    const mayNeedConversion = ["avi", "mkv", "wmv"];
    
    const hasValidExt = allowedExts.includes(fileExt);
    const hasValidMime = file.type && (file.type.startsWith("video/") || allowedMimes.includes(file.type));

    // Aceitar se tiver extensão válida OU MIME type válido
    if (!hasValidExt && !hasValidMime) {
      toast.error("Selecione um vídeo válido: MP4, WebM, MOV, M4V, AVI, MKV ou WMV");
      return;
    }

    // Alertar sobre formatos que podem não reproduzir
    if (mayNeedConversion.includes(fileExt)) {
      toast.warning(
        `Formato ${fileExt.toUpperCase()} detectado. Este formato pode não reproduzir em alguns navegadores. ` +
        `Recomendamos converter para MP4 (H.264) para garantir compatibilidade.`,
        { duration: 6000 }
      );
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast.error("O arquivo excede o limite de 500MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Verificar se o usuário está autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado para fazer upload de vídeos");
        setIsUploading(false);
        return;
      }

      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt || "mp4"}`;
      const filePath = `videos/${fileName}`;

      // Garantir Content-Type correto (essencial para o navegador tocar MP4)
      const contentType = file.type || (fileExt === "mp4" ? "video/mp4" : undefined);

      const { error: uploadError } = await supabase.storage
        .from("cursos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType,
        });

      if (uploadError) {
        if (uploadError.message.includes("row-level security") || uploadError.message.includes("policy")) {
          toast.error(
            "Você não tem permissão para fazer upload de vídeos. Apenas administradores e RH podem realizar esta ação."
          );
        } else {
          toast.error("Erro ao enviar vídeo: " + uploadError.message);
        }
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("cursos").getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, video_url: publicUrl }));
      setUploadProgress(100);
      toast.success("Vídeo enviado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setRawUrl(url);
    const result = processVideoUrl(url, formData.video_source);
    setUrlError(result.error);
    setFormData(prev => ({ ...prev, video_url: result.url || "" }));
  };

  const handleSourceChange = (source: VideoSourceType) => {
    setFormData(prev => ({ ...prev, video_source: source, video_url: "" }));
    setRawUrl("");
    setUrlError(null);
  };

  const handleSubmit = async () => {
    if (!formData.titulo.trim()) {
      toast.error("Digite o título da aula");
      return;
    }

    setIsSaving(true);

    try {
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado para criar aulas");
        return;
      }

      const { error } = await supabase.from("aulas").insert({
        modulo_id: moduloId,
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        duracao: formData.duracao ? formData.duracao * 60 : 0,
        video_url: formData.video_url || null,
        ordem,
      });

      if (error) {
        if (error.message.includes("row-level security")) {
          toast.error("Você não tem permissão para criar aulas. Apenas administradores e RH podem realizar esta ação.");
        } else {
          toast.error("Erro ao criar aula: " + error.message);
        }
        throw error;
      }

      toast.success("Aula criada com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao criar aula:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const sourceOptions = [
    { value: "upload", label: "Upload de Arquivo", icon: Upload, description: "Envie um vídeo do seu computador" },
    { value: "youtube", label: "YouTube", icon: Youtube, description: "Cole o link de um vídeo do YouTube" },
    { value: "drive", label: "Vídeo Google Drive", icon: HardDrive, description: "Cole o link de um vídeo do Drive" },
    { value: "drive_pdf", label: "PDF Google Drive", icon: FileText, description: "Cole o link de um PDF do Drive" },
    { value: "link", label: "Link de Vídeo", icon: Link, description: "Cole um link direto para vídeo" },
    { value: "link_pdf", label: "Link de PDF", icon: FileText, description: "Cole um link direto para PDF" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Nova Aula
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações básicas */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título da Aula *</Label>
              <Input
                id="titulo"
                placeholder="Ex: Introdução ao tema"
                value={formData.titulo}
                onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duracao">Duração (minutos)</Label>
                <Input
                  id="duracao"
                  type="number"
                  min={0}
                  placeholder="Ex: 15"
                  value={formData.duracao || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, duracao: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o conteúdo da aula..."
                rows={3}
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </div>
          </div>

          {/* Fonte do vídeo */}
          <div className="space-y-4">
            <Label>Fonte do Vídeo</Label>
            <RadioGroup
              value={formData.video_source}
              onValueChange={(value) => handleSourceChange(value as VideoSourceType)}
              className="grid grid-cols-2 gap-3"
            >
              {sourceOptions.map(({ value, label, icon: Icon, description }) => (
                <Card
                  key={value}
                  className={`cursor-pointer transition-all ${
                    formData.video_source === value
                      ? "border-primary bg-primary/5"
                      : "hover:border-muted-foreground/50"
                  }`}
                >
                  <CardContent className="p-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <RadioGroupItem value={value} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{description}</p>
                      </div>
                    </label>
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
          </div>

          {/* Input específico por fonte */}
          <div className="space-y-3">
            {formData.video_source === "upload" && (
              <div className="space-y-3">
                <Label>Arquivo de Vídeo</Label>
                
                {/* Guia de compatibilidade */}
                <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-2">
                  <p className="font-medium text-foreground">📋 Guia de Compatibilidade:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-green-600 font-medium">✓ Reprodução garantida:</p>
                      <p className="text-muted-foreground">MP4 (H.264), WebM, MOV</p>
                    </div>
                    <div>
                      <p className="text-amber-600 font-medium">⚠️ Pode não reproduzir:</p>
                      <p className="text-muted-foreground">AVI, MKV, WMV, H.265</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    💡 <strong>Dica:</strong> Use ferramentas gratuitas como <strong>HandBrake</strong> ou <strong>VLC</strong> para converter vídeos para MP4 (H.264).
                  </p>
                </div>

                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="video/*,.mp4,.webm,.mov,.m4v,.avi,.mkv,.wmv"
                    className="hidden"
                    id="video-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    disabled={isUploading}
                  />
                  <label htmlFor="video-upload" className="cursor-pointer">
                    {isUploading ? (
                      <div className="space-y-2">
                        <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Enviando vídeo... {uploadProgress}%</p>
                      </div>
                    ) : formData.video_url ? (
                      <div className="space-y-2">
                        <Video className="h-8 w-8 mx-auto text-green-600" />
                        <p className="text-sm text-green-600 font-medium">Vídeo enviado com sucesso!</p>
                        <p className="text-xs text-muted-foreground">Clique para substituir</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Clique para selecionar ou arraste o vídeo</p>
                        <p className="text-xs text-muted-foreground">MP4, WebM, MOV, AVI, MKV, WMV (máx. 500MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}

            {formData.video_source === "youtube" && (
              <div className="space-y-2">
                <Label htmlFor="youtube-url">Link do YouTube</Label>
                <Input
                  id="youtube-url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={rawUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                />
                {rawUrl && urlError && (
                  <p className="text-xs text-destructive">{urlError}</p>
                )}
                {rawUrl && !urlError && formData.video_url && (
                  <p className="text-xs text-green-600">✓ Link válido</p>
                )}
              </div>
            )}

            {formData.video_source === "drive" && (
              <div className="space-y-2">
                <Label htmlFor="drive-url">Link do Vídeo no Google Drive</Label>
                <Input
                  id="drive-url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={rawUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                />
                {rawUrl && urlError && (
                  <p className="text-xs text-destructive">{urlError}</p>
                )}
                {rawUrl && !urlError && formData.video_url && (
                  <p className="text-xs text-green-600">✓ Link válido</p>
                )}
                <p className="text-xs text-muted-foreground">
                  ⚠️ O arquivo deve estar compartilhado como <strong>"Qualquer pessoa com o link"</strong>. 
                  Clique com o botão direito no vídeo → "Obter link" → Configure a permissão.
                </p>
              </div>
            )}

            {formData.video_source === "drive_pdf" && (
              <div className="space-y-2">
                <Label htmlFor="drive-pdf-url">Link do PDF no Google Drive</Label>
                <Input
                  id="drive-pdf-url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={rawUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                />
                {rawUrl && urlError && (
                  <p className="text-xs text-destructive">{urlError}</p>
                )}
                {rawUrl && !urlError && formData.video_url && (
                  <p className="text-xs text-green-600">✓ Link válido</p>
                )}
                <p className="text-xs text-muted-foreground">
                  ⚠️ O PDF deve estar compartilhado como <strong>"Qualquer pessoa com o link"</strong>. 
                  O documento será exibido diretamente no portal.
                </p>
              </div>
            )}

            {formData.video_source === "link" && (
              <div className="space-y-2">
                <Label htmlFor="other-url">Link do Vídeo</Label>
                <Input
                  id="other-url"
                  placeholder="https://exemplo.com/video.mp4"
                  value={rawUrl}
                  onChange={(e) => {
                    setRawUrl(e.target.value);
                    setFormData(prev => ({ ...prev, video_url: e.target.value }));
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Cole um link direto para o arquivo de vídeo (MP4, WebM, etc.)
                </p>
              </div>
            )}

            {formData.video_source === "link_pdf" && (
              <div className="space-y-2">
                <Label htmlFor="pdf-url">Link do PDF</Label>
                <Input
                  id="pdf-url"
                  placeholder="https://exemplo.com/documento.pdf"
                  value={rawUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                />
                {rawUrl && urlError && (
                  <p className="text-xs text-destructive">{urlError}</p>
                )}
                {rawUrl && !urlError && formData.video_url && (
                  <p className="text-xs text-green-600">✓ Link válido</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Cole um link direto para o arquivo PDF. O link deve ser HTTPS e acessível publicamente.
                </p>
              </div>
            )}
          </div>

          {/* Preview do conteúdo */}
          {formData.video_url && (
            <div className="space-y-2">
              <Label>Prévia</Label>
              <div className={`rounded-lg overflow-hidden border ${
                formData.video_source === "drive_pdf" || formData.video_source === "link_pdf" 
                  ? "aspect-[3/4] min-h-[400px] bg-white" 
                  : "aspect-video bg-black"
              }`}>
                {formData.video_source === "youtube" || formData.video_source === "drive" || formData.video_source === "drive_pdf" ? (
                  <iframe
                    src={formData.video_url}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ border: 0 }}
                  />
                ) : formData.video_source === "link_pdf" ? (
                  <iframe
                    src={formData.video_url}
                    className="w-full h-full"
                    title="Preview PDF"
                    style={{ border: 0 }}
                  />
                ) : (
                  <video
                    src={formData.video_url}
                    className="w-full h-full object-contain"
                    controls
                    controlsList="nodownload"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || isUploading}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Aula
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
