import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/ui/back-button";
import { 
  Stethoscope, Plus, Calendar, AlertTriangle, CheckCircle, 
  Clock, Baby, HeartPulse, Shield
} from "lucide-react";
import { useAfastamentos, useCriarAfastamento, useEncerrarAfastamento, TIPOS_AFASTAMENTO } from "@/hooks/useAfastamentos";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const tipoIcons: Record<string, any> = {
  medico: Stethoscope,
  licenca_maternidade: Baby,
  licenca_paternidade: Baby,
  acidente_trabalho: AlertTriangle,
  previdenciario: HeartPulse,
  outro: Clock,
};

const Afastamentos = () => {
  const { data: afastamentos, isLoading } = useAfastamentos();
  const { data: funcionarios } = useFuncionarios();
  const criarAfastamento = useCriarAfastamento();
  const encerrarAfastamento = useEncerrarAfastamento();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [encerrarDialog, setEncerrarDialog] = useState<{ id: string; user_id: string } | null>(null);
  const [dataRetorno, setDataRetorno] = useState(new Date().toISOString().split("T")[0]);

  // Form state
  const [userId, setUserId] = useState("");
  const [tipo, setTipo] = useState("medico");
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [dataFim, setDataFim] = useState("");
  const [cid, setCid] = useState("");
  const [numeroBeneficio, setNumeroBeneficio] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [suspende, setSuspende] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !tipo || !dataInicio) return;

    await criarAfastamento.mutateAsync({
      user_id: userId,
      tipo,
      data_inicio: dataInicio,
      data_fim: dataFim || undefined,
      cid: cid || undefined,
      numero_beneficio: numeroBeneficio || undefined,
      observacoes: observacoes || undefined,
      suspende_periodo_aquisitivo: suspende,
    });

    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setUserId("");
    setTipo("medico");
    setDataInicio(new Date().toISOString().split("T")[0]);
    setDataFim("");
    setCid("");
    setNumeroBeneficio("");
    setObservacoes("");
    setSuspende(false);
  };

  const ativos = afastamentos?.filter(a => a.status === 'ativo') || [];
  const encerrados = afastamentos?.filter(a => a.status !== 'ativo') || [];

  const tipoConfig = TIPOS_AFASTAMENTO[tipo as keyof typeof TIPOS_AFASTAMENTO];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton to="/gestao-rh" />
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Afastamentos e Licenças</h1>
              <p className="text-sm text-muted-foreground">
                CLT Art. 392 (Maternidade) · Art. 10 ADCT (Paternidade) · Lei 8.213/91 (INSS)
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Afastamento
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{ativos.length}</p>
                <p className="text-xs text-muted-foreground">Afastados Atualmente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {ativos.filter(a => a.tipo === 'medico').length}
                </p>
                <p className="text-xs text-muted-foreground">Afastamentos Médicos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Baby className="h-5 w-5 text-pink-500" />
              <div>
                <p className="text-2xl font-bold">
                  {ativos.filter(a => a.tipo === 'licenca_maternidade' || a.tipo === 'licenca_paternidade').length}
                </p>
                <p className="text-xs text-muted-foreground">Licenças Parentais</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{encerrados.length}</p>
                <p className="text-xs text-muted-foreground">Retornados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de afastamentos ativos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Afastamentos Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : ativos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum afastamento ativo</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Previsão Fim</TableHead>
                    <TableHead>Dias</TableHead>
                    <TableHead>Empresa/INSS</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ativos.map((a) => {
                    const tipoLabel = TIPOS_AFASTAMENTO[a.tipo as keyof typeof TIPOS_AFASTAMENTO]?.label || a.tipo;
                    const dias = a.data_fim 
                      ? differenceInDays(parseISO(a.data_fim), parseISO(a.data_inicio)) + 1
                      : differenceInDays(new Date(), parseISO(a.data_inicio)) + 1;
                    const Icon = tipoIcons[a.tipo] || Clock;

                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.profiles?.nome || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Icon className="h-3 w-3" />
                            {tipoLabel}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(parseISO(a.data_inicio), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                        <TableCell>
                          {a.data_fim ? format(parseISO(a.data_fim), "dd/MM/yyyy", { locale: ptBR }) : "Indefinido"}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{dias} dias</span>
                          {dias > 15 && a.tipo === 'medico' && (
                            <Badge variant="destructive" className="ml-2 text-[10px]">INSS</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {a.dias_empresa}d empresa / {a.dias_inss}d INSS
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEncerrarDialog({ id: a.id, user_id: a.user_id })}
                          >
                            Encerrar
                          </Button>
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

      {/* Histórico */}
      {encerrados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Afastamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Retorno</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {encerrados.slice(0, 20).map((a) => {
                    const tipoLabel = TIPOS_AFASTAMENTO[a.tipo as keyof typeof TIPOS_AFASTAMENTO]?.label || a.tipo;
                    return (
                      <TableRow key={a.id}>
                        <TableCell>{a.profiles?.nome || "—"}</TableCell>
                        <TableCell>{tipoLabel}</TableCell>
                        <TableCell>
                          {format(parseISO(a.data_inicio), "dd/MM/yy")} - {a.data_fim ? format(parseISO(a.data_fim), "dd/MM/yy") : "—"}
                        </TableCell>
                        <TableCell>
                          {a.data_retorno ? format(parseISO(a.data_retorno), "dd/MM/yyyy") : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={a.status === 'encerrado' ? 'default' : 'secondary'}>
                            {a.status === 'encerrado' ? 'Retornou' : a.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog: Registrar Afastamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Afastamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Funcionário</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(funcionarios || []).map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.nome} — {f.cargo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Afastamento</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPOS_AFASTAMENTO).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tipoConfig && (
                <p className="text-xs text-muted-foreground">
                  {tipoConfig.descricao} — Dias empresa: {tipoConfig.diasEmpresa}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Previsão Fim</Label>
                <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
              </div>
            </div>

            {(tipo === 'medico' || tipo === 'acidente_trabalho') && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>CID</Label>
                  <Input value={cid} onChange={e => setCid(e.target.value)} placeholder="Ex: M54.5" />
                </div>
                <div className="space-y-2">
                  <Label>Nº Benefício INSS</Label>
                  <Input value={numeroBeneficio} onChange={e => setNumeroBeneficio(e.target.value)} />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Switch checked={suspende} onCheckedChange={setSuspende} />
              <div>
                <Label>Suspende período aquisitivo de férias</Label>
                <p className="text-xs text-muted-foreground">Art. 131-133 CLT (afastamentos &gt; 6 meses)</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={!userId || criarAfastamento.isPending}>
                {criarAfastamento.isPending ? "Salvando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Encerrar Afastamento */}
      <Dialog open={!!encerrarDialog} onOpenChange={() => setEncerrarDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Encerrar Afastamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data de Retorno</Label>
              <Input type="date" value={dataRetorno} onChange={e => setDataRetorno(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEncerrarDialog(null)}>Cancelar</Button>
              <Button
                onClick={async () => {
                  if (encerrarDialog) {
                    await encerrarAfastamento.mutateAsync({
                      id: encerrarDialog.id,
                      user_id: encerrarDialog.user_id,
                      data_retorno: dataRetorno,
                    });
                    setEncerrarDialog(null);
                  }
                }}
                disabled={encerrarAfastamento.isPending}
              >
                Confirmar Retorno
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Afastamentos;
