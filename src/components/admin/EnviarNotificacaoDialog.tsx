import { useState, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Paperclip, X, FileText, Image, File } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AnexoFile {
  file: File;
  id: string;
}

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return <Image className="h-4 w-4 text-blue-500" />;
  if (type.includes("pdf") || type.includes("word") || type.includes("document"))
    return <FileText className="h-4 w-4 text-red-500" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const EnviarNotificacaoDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState("info");
  const [prioridade, setPrioridade] = useState("normal");
  const [destinatarioTipo, setDestinatarioTipo] = useState("todos");
  const [destinatarioDepartamento, setDestinatarioDepartamento] = useState("");
  const [destinatarioId, setDestinatarioId] = useState("");
  const [anexos, setAnexos] = useState<AnexoFile[]>([]);

  const { data: departamentos = [] } = useQuery({
    queryKey: ["departamentos-unicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("departamento")
        .not("departamento", "is", null);
      if (error) throw error;
      const unique = [...new Set(data.map((d: any) => d.departamento).filter(Boolean))];
      return unique as string[];
    },
  });

  const { data: funcionarios = [] } = useQuery({
    queryKey: ["funcionarios-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, departamento, user_roles!inner(role)")
        .eq("user_roles.role", "funcionario")
        .order("nome");
      if (error) throw error;
      return data as { id: string; nome: string; departamento: string | null }[];
    },
    enabled: destinatarioTipo === "individual",
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAnexos: AnexoFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`Arquivo "${file.name}" excede o limite de 20MB`);
        continue;
      }
      newAnexos.push({ file, id: crypto.randomUUID() });
    }

    setAnexos((prev) => [...prev, ...newAnexos]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAnexo = (id: string) => {
    setAnexos((prev) => prev.filter((a) => a.id !== id));
  };

  const uploadAnexos = async (): Promise<{ nome: string; url: string; tamanho: number; tipo: string }[]> => {
    if (anexos.length === 0) return [];

    const uploaded: { nome: string; url: string; tamanho: number; tipo: string }[] = [];

    for (const anexo of anexos) {
      const ext = anexo.file.name.split(".").pop() || "bin";
      const safeName = anexo.file.name
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase().replace(/[^a-z0-9._-]/g, "-");
      const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("notificacoes-anexos")
        .upload(path, anexo.file, { contentType: anexo.file.type, cacheControl: "3600" });

      if (error) throw new Error(`Erro ao enviar "${anexo.file.name}": ${error.message}`);

      uploaded.push({
        nome: anexo.file.name,
        url: path,
        tamanho: anexo.file.size,
        tipo: anexo.file.type,
      });
    }

    return uploaded;
  };

  const enviarMutation = useMutation({
    mutationFn: async () => {
      const anexosUpload = await uploadAnexos();

      const payload: any = {
        titulo,
        mensagem,
        tipo,
        prioridade,
        destinatario_tipo: destinatarioTipo,
        criado_por: user?.id,
        anexos: anexosUpload,
      };

      if (destinatarioTipo === "departamento") {
        payload.destinatario_departamento = destinatarioDepartamento;
      } else if (destinatarioTipo === "individual") {
        payload.destinatario_id = destinatarioId;
      }

      const { error } = await (supabase as any).from("notificacoes").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notificação enviada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-notificacoes"] });
      resetForm();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao enviar notificação");
    },
  });

  const resetForm = () => {
    setTitulo("");
    setMensagem("");
    setTipo("info");
    setPrioridade("normal");
    setDestinatarioTipo("todos");
    setDestinatarioDepartamento("");
    setDestinatarioId("");
    setAnexos([]);
  };

  const canSubmit =
    titulo.trim() &&
    mensagem.trim() &&
    (destinatarioTipo === "todos" ||
      (destinatarioTipo === "departamento" && destinatarioDepartamento) ||
      (destinatarioTipo === "individual" && destinatarioId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Notificação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Atualização importante"
            />
          </div>

          <div>
            <Label>Mensagem</Label>
            <Textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Descreva a notificação..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Informativo</SelectItem>
                  <SelectItem value="aviso">Aviso</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="tarefa">Tarefa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Destinatários</Label>
            <Select value={destinatarioTipo} onValueChange={setDestinatarioTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Funcionários</SelectItem>
                <SelectItem value="departamento">Por Departamento</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {destinatarioTipo === "departamento" && (
            <div>
              <Label>Departamento</Label>
              <Select value={destinatarioDepartamento} onValueChange={setDestinatarioDepartamento}>
                <SelectTrigger><SelectValue placeholder="Selecionar departamento" /></SelectTrigger>
                <SelectContent>
                  {departamentos.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {destinatarioTipo === "individual" && (
            <div>
              <Label>Funcionário</Label>
              <Select value={destinatarioId} onValueChange={setDestinatarioId}>
                <SelectTrigger><SelectValue placeholder="Selecionar funcionário" /></SelectTrigger>
                <SelectContent>
                  {funcionarios.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome} {f.departamento ? `(${f.departamento})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Anexos Section */}
          <div>
            <Label>Anexos</Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full mt-1 gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
              Adicionar Anexo (máx. 20MB)
            </Button>

            {anexos.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {anexos.map((anexo) => (
                  <div
                    key={anexo.id}
                    className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm"
                  >
                    {getFileIcon(anexo.file.type)}
                    <span className="truncate flex-1">{anexo.file.name}</span>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {formatFileSize(anexo.file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAnexo(anexo.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => enviarMutation.mutate()}
            disabled={!canSubmit || enviarMutation.isPending}
          >
            {enviarMutation.isPending ? "Enviando..." : "Enviar Notificação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
