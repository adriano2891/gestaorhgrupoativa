import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GerenciarAjustesPontoCardProps {
  adminId: string;
  adminName: string;
}

export const GerenciarAjustesPontoCard = ({ adminId, adminName }: GerenciarAjustesPontoCardProps) => {
  const [ajustes, setAjustes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState<Record<string, string>>({});

  const loadAjustes = async () => {
    try {
      setLoading(true);

      const { data, error } = await (supabase as any)
        .from("solicitacoes_ajuste_ponto")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Erro ao carregar ajustes:", error);
        return;
      }

      if (!data || data.length === 0) {
        setAjustes([]);
        return;
      }

      // Fetch employee names separately
      try {
        const userIds = [...new Set(data.map((a: any) => a.user_id))] as string[];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, nome")
          .in("id", userIds);

        const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.nome]));
        data.forEach((a: any) => {
          a.employee_name = nameMap.get(a.user_id) || "Desconhecido";
        });
      } catch (e) {
        console.warn("Failed to fetch profiles for ajustes:", e);
      }

      setAjustes(data);
    } catch (e) {
      console.error("Erro ao carregar ajustes:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAjustes();
    const channel = supabase
      .channel('ajustes-ponto-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitacoes_ajuste_ponto' }, () => loadAjustes())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAction = async (ajusteId: string, action: 'aprovado' | 'rejeitado') => {
    if (action === 'rejeitado' && !motivoRejeicao[ajusteId]?.trim()) {
      toast.error("Informe o motivo da rejeição");
      return;
    }

    setActionLoading(ajusteId);
    try {
      const body: any = {
        status: action,
        aprovado_por: adminId,
        aprovado_por_nome: adminName,
        data_aprovacao: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (action === 'rejeitado') {
        body.motivo_rejeicao = motivoRejeicao[ajusteId].trim();
      }

      const { error } = await (supabase as any)
        .from("solicitacoes_ajuste_ponto")
        .update(body)
        .eq("id", ajusteId);

      if (error) throw error;

      toast.success(action === 'aprovado' ? "Ajuste aprovado" : "Ajuste rejeitado");
      loadAjustes();
    } catch (e: any) {
      toast.error("Erro ao processar ajuste", { description: e.message });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700">Pendente</Badge>;
      case 'aprovado': return <Badge variant="default" className="bg-green-500/10 text-green-700">Aprovado</Badge>;
      case 'rejeitado': return <Badge variant="destructive">Rejeitado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const campoLabels: Record<string, string> = {
    entrada: "Entrada", saida: "Saída", saida_almoco: "S. Almoço",
    retorno_almoco: "R. Almoço", saida_pausa_1: "S. Pausa 1",
    retorno_pausa_1: "R. Pausa 1", saida_pausa_2: "S. Pausa 2",
    retorno_pausa_2: "R. Pausa 2", inicio_he: "Início HE", fim_he: "Fim HE",
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-64" /></CardHeader>
        <CardContent><Skeleton className="h-48 w-full" /></CardContent>
      </Card>
    );
  }

  const pendentes = ajustes.filter(a => a.status === 'pendente');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <CardTitle>Solicitações de Ajuste de Ponto</CardTitle>
          {pendentes.length > 0 && (
            <Badge variant="destructive" className="ml-2">{pendentes.length} pendente(s)</Badge>
          )}
        </div>
        <CardDescription>
          Gerencie as solicitações de ajuste de ponto dos funcionários (Portaria 671/2021)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {ajustes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma solicitação de ajuste encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Campo</TableHead>
                  <TableHead>Original</TableHead>
                  <TableHead>Solicitado</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ajustes.map((ajuste) => (
                  <TableRow key={ajuste.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(ajuste.data_registro + "T12:00:00").toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="font-medium">{ajuste.employee_name || '-'}</TableCell>
                    <TableCell>{campoLabels[ajuste.campo] || ajuste.campo}</TableCell>
                    <TableCell>{ajuste.valor_original || '-'}</TableCell>
                    <TableCell className="font-medium">{ajuste.valor_solicitado}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={ajuste.motivo}>
                      {ajuste.motivo}
                    </TableCell>
                    <TableCell>{getStatusBadge(ajuste.status)}</TableCell>
                    <TableCell>
                      {ajuste.status === 'pendente' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-700"
                            disabled={actionLoading === ajuste.id}
                            onClick={() => handleAction(ajuste.id, 'aprovado')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <div className="flex items-center gap-1">
                            <Textarea
                              className="h-8 min-h-[32px] w-32 text-xs"
                              placeholder="Motivo rejeição"
                              value={motivoRejeicao[ajuste.id] || ''}
                              onChange={(e) => setMotivoRejeicao(prev => ({ ...prev, [ajuste.id]: e.target.value }))}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-700"
                              disabled={actionLoading === ajuste.id}
                              onClick={() => handleAction(ajuste.id, 'rejeitado')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {ajuste.status !== 'pendente' && (
                        <span className="text-xs text-muted-foreground">
                          {ajuste.aprovado_por_nome && `Por: ${ajuste.aprovado_por_nome}`}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
