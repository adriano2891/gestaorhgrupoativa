import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Curso } from "@/types/cursos";

interface UploadCertificadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cursos: Curso[];
  funcionarios: Array<{ id: string; nome: string; email: string }>;
}

export const UploadCertificadoDialog = ({
  open,
  onOpenChange,
  cursos,
  funcionarios,
}: UploadCertificadoDialogProps) => {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCurso, setSelectedCurso] = useState("");
  const [selectedFuncionario, setSelectedFuncionario] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error("Formato inválido", {
          description: "Use PDF, JPG, PNG ou WebP",
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande", {
          description: "O tamanho máximo é 10MB",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCurso || !selectedFuncionario) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsUploading(true);
    try {
      // Upload do arquivo
      const ext = selectedFile.name.split(".").pop();
      const fileName = `certificados-externos/${selectedFuncionario}/${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("cursos")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("cursos")
        .getPublicUrl(fileName);

      // Verificar se existe matrícula, se não, criar
      const { data: matriculaExistente } = await supabase
        .from("matriculas")
        .select("id")
        .eq("curso_id", selectedCurso)
        .eq("user_id", selectedFuncionario)
        .maybeSingle();

      let matriculaId = matriculaExistente?.id;

      if (!matriculaId) {
        const { data: novaMatricula, error: matriculaError } = await supabase
          .from("matriculas")
          .insert({
            curso_id: selectedCurso,
            user_id: selectedFuncionario,
            status: "concluido",
            progresso: 100,
            data_conclusao: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (matriculaError) throw matriculaError;
        matriculaId = novaMatricula.id;
      }

      // Criar certificado
      const codigoValidacao = `EXT-${Date.now().toString(36).toUpperCase()}`;
      
      const { error: certError } = await supabase.from("certificados").insert({
        curso_id: selectedCurso,
        user_id: selectedFuncionario,
        matricula_id: matriculaId,
        codigo_validacao: codigoValidacao,
        url_certificado: urlData.publicUrl,
        data_emissao: new Date().toISOString(),
      });

      if (certError) throw certError;

      toast.success("Certificado enviado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["certificados"] });
      queryClient.invalidateQueries({ queryKey: ["meus-certificados"] });
      onOpenChange(false);
      setSelectedFile(null);
      setSelectedCurso("");
      setSelectedFuncionario("");
    } catch (error: any) {
      console.error("Erro ao enviar certificado:", error);
      toast.error("Erro ao enviar certificado", {
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Certificado Externo
          </DialogTitle>
          <DialogDescription>
            Envie um certificado externo (PDF ou imagem) para um funcionário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Funcionário</Label>
            <Select value={selectedFuncionario} onValueChange={setSelectedFuncionario}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o funcionário" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {funcionarios.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Curso Relacionado</Label>
            <Select value={selectedCurso} onValueChange={setSelectedCurso}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o curso" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {cursos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Arquivo do Certificado</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Clique para selecionar ou arraste o arquivo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPG, PNG ou WebP (máx 10MB)
                  </p>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile || !selectedCurso || !selectedFuncionario}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Enviar Certificado
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
