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
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type VideoSourceType = "upload" | "youtube" | "drive" | "link";

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
}

// Função para converter URL do YouTube para embed
const getYouTubeEmbedUrl = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
    /youtube\.com\/shorts\/([^&?/]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Embed sem controles extras do YouTube
      return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1&showinfo=0&controls=1&disablekb=0&fs=1&iv_load_policy=3`;
    }
  }
  return null;
};

// Função para converter URL do Google Drive para embed
const getGoogleDriveEmbedUrl = (url: string): string | null => {
  const patterns = [
    /drive\.google\.com\/file\/d\/([^/]+)/,
    /drive\.google\.com\/open\?id=([^&]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }
  return null;
};

// Função para processar URL genérica de vídeo
const processVideoUrl = (url: string, source: VideoSourceType): string | null => {
  if (!url.trim()) return null;
  
  switch (source) {
    case "youtube":
      return getYouTubeEmbedUrl(url);
    case "drive":
      return getGoogleDriveEmbedUrl(url);
    case "link":
    case "upload":
      return url;
    default:
      return null;
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
      setUploadProgress(0);
    }
  }, [open]);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("Por favor, selecione um arquivo de vídeo válido");
      return;
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast.error("O arquivo excede o limite de 500MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("cursos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("cursos")
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, video_url: publicUrl }));
      setUploadProgress(100);
      toast.success("Vídeo enviado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao enviar vídeo: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setRawUrl(url);
    const processedUrl = processVideoUrl(url, formData.video_source);
    setFormData(prev => ({ ...prev, video_url: processedUrl || "" }));
  };

  const handleSourceChange = (source: VideoSourceType) => {
    setFormData(prev => ({ ...prev, video_source: source, video_url: "" }));
    setRawUrl("");
  };

  const handleSubmit = async () => {
    if (!formData.titulo.trim()) {
      toast.error("Digite o título da aula");
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase.from("aulas").insert({
        modulo_id: moduloId,
        titulo: formData.titulo,
        descricao: formData.descricao,
        duracao: formData.duracao * 60,
        video_url: formData.video_url,
        ordem,
      });

      if (error) throw error;

      toast.success("Aula criada com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao criar aula:", error);
      toast.error("Erro ao criar aula: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const sourceOptions = [
    { value: "upload", label: "Upload de Arquivo", icon: Upload, description: "Envie um vídeo do seu computador" },
    { value: "youtube", label: "YouTube", icon: Youtube, description: "Cole o link de um vídeo do YouTube" },
    { value: "drive", label: "Google Drive", icon: HardDrive, description: "Cole o link de compartilhamento do Drive" },
    { value: "link", label: "Outro Link", icon: Link, description: "Cole um link direto para o vídeo" },
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
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="video/*"
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
                        <p className="text-xs text-muted-foreground">MP4, WebM, MOV (máx. 500MB)</p>
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
                {rawUrl && !formData.video_url && (
                  <p className="text-xs text-destructive">Link inválido. Use o formato padrão do YouTube.</p>
                )}
                {formData.video_url && (
                  <p className="text-xs text-green-600">✓ Link válido</p>
                )}
              </div>
            )}

            {formData.video_source === "drive" && (
              <div className="space-y-2">
                <Label htmlFor="drive-url">Link do Google Drive</Label>
                <Input
                  id="drive-url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={rawUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                />
                {rawUrl && !formData.video_url && (
                  <p className="text-xs text-destructive">Link inválido. Certifique-se de usar o link de compartilhamento.</p>
                )}
                {formData.video_url && (
                  <p className="text-xs text-green-600">✓ Link válido</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Certifique-se de que o vídeo está com acesso "Qualquer pessoa com o link"
                </p>
              </div>
            )}

            {formData.video_source === "link" && (
              <div className="space-y-2">
                <Label htmlFor="other-url">Link do Vídeo</Label>
                <Input
                  id="other-url"
                  placeholder="https://..."
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
          </div>

          {/* Preview do vídeo */}
          {formData.video_url && (
            <div className="space-y-2">
              <Label>Prévia</Label>
              <div className="aspect-video rounded-lg overflow-hidden bg-black border">
                {formData.video_source === "youtube" || formData.video_source === "drive" ? (
                  <iframe
                    src={formData.video_url}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
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
