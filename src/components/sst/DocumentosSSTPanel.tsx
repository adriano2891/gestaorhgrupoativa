import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, Trash2, ExternalLink, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const TIPOS_DOC_SST: Record<string, { label: string; norma: string }> = {
  pgr: { label: "PGR - Programa de Gerenciamento de Riscos", norma: "NR-1" },
  ppra: { label: "PPRA (Legado)", norma: "NR-9" },
  ltcat: { label: "LTCAT - Laudo Técnico de Condições Ambientais", norma: "IN INSS 128" },
  pcmso: { label: "PCMSO - Programa de Controle Médico", norma: "NR-7" },
  ppp: { label: "PPP - Perfil Profissiográfico Previdenciário", norma: "IN INSS 128" },
  laudo_insalubridade: { label: "Laudo de Insalubridade", norma: "NR-15" },
  laudo_periculosidade: { label: "Laudo de Periculosidade", norma: "NR-16" },
  outro: { label: "Outro Documento SST", norma: "" },
};

interface DocSST {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  data_vigencia_inicio: string | null;
  data_vigencia_fim: string | null;
  responsavel_tecnico: string | null;
  registro_profissional: string | null;
  created_at: string;
}

function getToken(): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'rzcjwfxmogfsmfbwtwfc';
  const raw = localStorage.getItem(`sb-${projectId}-auth-token`);
  return raw ? JSON.parse(raw)?.access_token || '' : '';
}

function authHeaders(token: string): Record<string, string> {
  return {
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${token}`,
  };
}

export const DocumentosSSTPanel = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tipo, setTipo] = useState("pgr");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [vigenciaInicio, setVigenciaInicio] = useState("");
  const [vigenciaFim, setVigenciaFim] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [registro, setRegistro] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: documentos, isLoading } = useQuery({
    queryKey: ["documentos-sst"],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/documentos_sst?select=*&order=created_at.desc`,
        { headers: authHeaders(token) }
      );
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json() as Promise<DocSST[]>;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !tipo) return;
    setUploading(true);

    try {
      let arquivo_url = null;
      let arquivo_nome = null;

      if (arquivo) {
        const safeName = arquivo.name.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
        const path = `regulatorios/${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage.from('sst-documentos').upload(path, arquivo);
        if (upErr) throw upErr;
        arquivo_url = path;
        arquivo_nome = arquivo.name;
      }

      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/documentos_sst`, {
        method: "POST",
        headers: { ...authHeaders(token), "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({
          tipo,
          titulo,
          descricao: descricao || null,
          arquivo_url,
          arquivo_nome,
          data_vigencia_inicio: vigenciaInicio || null,
          data_vigencia_fim: vigenciaFim || null,
          responsavel_tecnico: responsavel || null,
          registro_profissional: registro || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      qc.invalidateQueries({ queryKey: ["documentos-sst"] });
      toast.success("Documento SST registrado");
      setDialogOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error("Erro ao salvar", { description: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/documentos_sst?id=eq.${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error(await res.text());
      qc.invalidateQueries({ queryKey: ["documentos-sst"] });
      toast.success("Documento excluído");
    } catch (err: any) {
      toast.error("Erro ao excluir", { description: err.message });
    }
  };

  const handleViewFile = async (path: string) => {
    const { data } = await supabase.storage.from('sst-documentos').createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const resetForm = () => {
    setTipo("pgr");
    setTitulo("");
    setDescricao("");
    setVigenciaInicio("");
    setVigenciaFim("");
    setResponsavel("");
    setRegistro("");
    setArquivo(null);
  };

  const getVigenciaStatus = (doc: DocSST) => {
    if (!doc.data_vigencia_fim) return null;
    const dias = differenceInDays(parseISO(doc.data_vigencia_fim), new Date());
    if (dias < 0) return { label: "Vencido", variant: "destructive" as const };
    if (dias <= 30) return { label: `Vence em ${dias}d`, variant: "destructive" as const };
    if (dias <= 90) return { label: `Vence em ${dias}d`, variant: "secondary" as const };
    return { label: "Vigente", variant: "default" as const };
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Documentos Regulatórios SST
            </CardTitle>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            PGR (NR-1) · PCMSO (NR-7) · LTCAT · Laudos de Insalubridade/Periculosidade
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !documentos?.length ? (
            <div className="text-center py-6 space-y-2">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Nenhum documento regulatório cadastrado. Empresas devem manter PGR e PCMSO atualizados (NR-1 e NR-7).
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Responsável Técnico</TableHead>
                    <TableHead>Vigência</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentos.map((doc) => {
                    const tipoInfo = TIPOS_DOC_SST[doc.tipo];
                    const status = getVigenciaStatus(doc);
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {tipoInfo?.norma || doc.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{doc.titulo}</TableCell>
                        <TableCell className="text-sm">
                          {doc.responsavel_tecnico || "—"}
                          {doc.registro_profissional && (
                            <span className="text-xs text-muted-foreground ml-1">({doc.registro_profissional})</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {doc.data_vigencia_inicio && format(parseISO(doc.data_vigencia_inicio), "dd/MM/yy")}
                          {doc.data_vigencia_fim && ` — ${format(parseISO(doc.data_vigencia_fim), "dd/MM/yy")}`}
                        </TableCell>
                        <TableCell>
                          {status && <Badge variant={status.variant}>{status.label}</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {doc.arquivo_url && (
                              <Button size="icon" variant="ghost" onClick={() => handleViewFile(doc.arquivo_url!)}>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(doc.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Documento SST</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPOS_DOC_SST).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} required placeholder="Ex: PGR 2026" />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Início Vigência</Label>
                <Input type="date" value={vigenciaInicio} onChange={(e) => setVigenciaInicio(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fim Vigência</Label>
                <Input type="date" value={vigenciaFim} onChange={(e) => setVigenciaFim(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Responsável Técnico</Label>
                <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Nome do profissional" />
              </div>
              <div className="space-y-2">
                <Label>Registro (CREA/CRM)</Label>
                <Input value={registro} onChange={(e) => setRegistro(e.target.value)} placeholder="Ex: CREA 12345" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Arquivo (PDF)</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setArquivo(e.target.files?.[0] || null)} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={!titulo || uploading}>
                {uploading ? "Salvando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
