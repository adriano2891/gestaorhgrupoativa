import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Award, Upload, FileText, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { Matricula } from "@/types/cursos";

interface EnviarCertificadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matricula: Matricula;
}

export const EnviarCertificadoDialog = ({ 
  open, 
  onOpenChange, 
  matricula 
}: EnviarCertificadoDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo PDF.",
          variant: "destructive"
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const generateValidationCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: "Selecione um arquivo",
        description: "É necessário anexar o certificado em PDF.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload do arquivo
      const timestamp = Date.now();
      const fileName = `certificado_${matricula.curso_id}_${matricula.user_id}_${timestamp}.pdf`;
      const filePath = `certificados/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cursos')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('cursos')
        .getPublicUrl(filePath);

      // Criar registro do certificado
      const { error: insertError } = await supabase
        .from('certificados')
        .insert({
          matricula_id: matricula.id,
          user_id: matricula.user_id,
          curso_id: matricula.curso_id,
          codigo_validacao: generateValidationCode(),
          data_emissao: new Date().toISOString(),
          url_certificado: urlData.publicUrl
        });

      if (insertError) throw insertError;

      toast({
        title: "Certificado enviado!",
        description: `O certificado foi enviado para ${matricula.profile?.nome || 'o funcionário'}.`
      });

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ["meus-certificados"] });
      queryClient.invalidateQueries({ queryKey: ["matriculas"] });

      // Resetar e fechar
      setSelectedFile(null);
      onOpenChange(false);

    } catch (error: any) {
      console.error("Erro ao enviar certificado:", error);
      toast({
        title: "Erro ao enviar certificado",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Enviar Certificado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info do funcionário */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium">{matricula.profile?.nome}</p>
            <p className="text-xs text-muted-foreground">{matricula.profile?.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Curso: {matricula.curso?.titulo}
            </p>
          </div>

          {/* Upload de arquivo */}
          <div className="space-y-2">
            <Label>Certificado (PDF)</Label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,application/pdf"
              className="hidden"
            />
            
            {selectedFile ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <FileText className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-800 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-green-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Clique para selecionar o certificado
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Somente arquivos PDF (máx. 10MB)
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isUploading || !selectedFile}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Award className="h-4 w-4 mr-2" />
                Enviar Certificado
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
