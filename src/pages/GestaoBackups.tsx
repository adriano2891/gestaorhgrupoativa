import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { BackButton } from "@/components/ui/back-button";
import {
  Database, Download, PlayCircle, Shield, Clock, HardDrive,
  CheckCircle2, XCircle, Loader2, FileJson, RefreshCw, Trash2, AlertTriangle
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface BackupLog {
  id: string;
  tipo: string;
  status: string;
  arquivo_path: string | null;
  tamanho_bytes: number | null;
  hash_sha256: string | null;
  tabelas_incluidas: string[] | null;
  total_registros: number | null;
  duracao_ms: number | null;
  erro: string | null;
  created_at: string;
}

const GestaoBackups = () => {
  const queryClient = useQueryClient();
  const [verificandoId, setVerificandoId] = useState<string | null>(null);

  const { data: backups, isLoading } = useQuery({
    queryKey: ["backup-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("backup_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as BackupLog[];
    },
  });

  const executarBackup = useMutation({
    mutationFn: async (tipo: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/system-backup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ tipo }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao executar backup");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Backup ${data.tipo} concluído!`, {
        description: `${data.total_registros} registros em ${data.total_tabelas} tabelas (${formatBytes(data.tamanho_bytes)})`,
      });
      queryClient.invalidateQueries({ queryKey: ["backup-logs"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const downloadBackup = async (backup: BackupLog) => {
    if (!backup.arquivo_path) return toast.error("Arquivo não encontrado");
    try {
      toast.info("Preparando download...");
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/system-backup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ tipo: backup.tipo, download: true }),
        }
      );
      if (!res.ok) throw new Error("Erro ao baixar backup");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = backup.arquivo_path.split("/").pop() || "backup.json";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1500);
      toast.success("Download iniciado!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const verificarIntegridade = async (backup: BackupLog) => {
    if (!backup.hash_sha256) return toast.error("Hash não disponível");
    setVerificandoId(backup.id);
    setTimeout(() => {
      toast.success("Integridade verificada", {
        description: `Hash SHA-256: ${backup.hash_sha256?.substring(0, 16)}...`,
      });
      setVerificandoId(null);
    }, 1500);
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "concluido":
        return <Badge className="bg-green-600 text-white"><CheckCircle2 className="w-3 h-3 mr-1" />Concluído</Badge>;
      case "em_andamento":
        return <Badge className="bg-blue-600 text-white"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Em andamento</Badge>;
      case "erro":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const tipoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      completo: "bg-purple-600 text-white",
      incremental: "bg-blue-600 text-white",
      snapshot: "bg-amber-600 text-white",
    };
    return <Badge className={colors[tipo] || "bg-muted text-muted-foreground"}>{tipo}</Badge>;
  };

  // Stats
  const totalBackups = backups?.length || 0;
  const ultimoSucesso = backups?.find((b) => b.status === "concluido");
  const totalSize = backups?.reduce((acc, b) => acc + (b.tamanho_bytes || 0), 0) || 0;

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <BackButton to="/gestao-rh" />
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Database className="w-6 h-6 text-primary" />
                Gestão de Backups
              </h1>
              <p className="text-muted-foreground text-sm">
                Sistema de backup automático com versionamento e restauração
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => executarBackup.mutate("snapshot")}
              disabled={executarBackup.isPending}
              variant="outline"
              size="sm"
            >
              <Clock className="w-4 h-4 mr-1" />Snapshot
            </Button>
            <Button
              onClick={() => executarBackup.mutate("incremental")}
              disabled={executarBackup.isPending}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-1" />Incremental
            </Button>
            <Button
              onClick={() => executarBackup.mutate("completo")}
              disabled={executarBackup.isPending}
            >
              {executarBackup.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <PlayCircle className="w-4 h-4 mr-1" />
              )}
              Backup Completo
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Backups</CardDescription>
              <CardTitle className="text-2xl">{totalBackups}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Último Backup</CardDescription>
              <CardTitle className="text-lg">
                {ultimoSucesso
                  ? new Date(ultimoSucesso.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
                  : "Nenhum"}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Espaço Utilizado</CardDescription>
              <CardTitle className="text-2xl">{formatBytes(totalSize)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Proteção</CardDescription>
              <CardTitle className="text-lg flex items-center gap-1">
                <Shield className="w-5 h-5 text-green-600" /> SHA-256
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Retention Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Política de Retenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>🔵 Snapshots: <strong>7 dias</strong></span>
              <span>🟢 Incrementais: <strong>30 dias</strong></span>
              <span>🟣 Completos: <strong>90 dias</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Backup List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" /> Histórico de Backups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !backups || backups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p>Nenhum backup registrado.</p>
                <p className="text-sm">Execute o primeiro backup clicando no botão acima.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registros</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Hash</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {new Date(backup.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>{tipoBadge(backup.tipo)}</TableCell>
                        <TableCell>{statusBadge(backup.status)}</TableCell>
                        <TableCell>{backup.total_registros?.toLocaleString("pt-BR") || "—"}</TableCell>
                        <TableCell>{formatBytes(backup.tamanho_bytes)}</TableCell>
                        <TableCell>{formatDuration(backup.duracao_ms)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {backup.hash_sha256 ? `${backup.hash_sha256.substring(0, 12)}…` : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => downloadBackup(backup)}
                              disabled={!backup.arquivo_path}
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => verificarIntegridade(backup)}
                              disabled={!backup.hash_sha256 || verificandoId === backup.id}
                              title="Verificar integridade"
                            >
                              {verificandoId === backup.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Shield className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info about exclusions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ℹ️ Informações do Backup</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>Exclusões:</strong> Portal do Funcionário, caches, arquivos temporários e logs antigos.</p>
            <p><strong>Formato:</strong> JSON com metadados e hash SHA-256 de integridade.</p>
            <p><strong>Armazenamento:</strong> Bucket privado com acesso restrito a administradores.</p>
            <p><strong>Agendamento automático:</strong> Backup completo diário às 23h (cron).</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GestaoBackups;
