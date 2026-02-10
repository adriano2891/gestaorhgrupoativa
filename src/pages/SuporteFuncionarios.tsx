import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageCircle, Search, ArrowLeft, Send, Paperclip, Download, Clock, 
  Filter, User, CheckCircle 
} from "lucide-react";
import {
  useTodosChamados,
  useMensagensChamado,
  useEnviarMensagem,
  useAtualizarStatusChamado,
  type ChamadoSuporte,
} from "@/hooks/useChamadosSuporte";
import { useAuth } from "@/components/auth/AuthProvider";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useRef, useEffect } from "react";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  aberto: { label: "Aberto", variant: "destructive" },
  em_atendimento: { label: "Em atendimento", variant: "default" },
  respondido: { label: "Respondido", variant: "secondary" },
  encerrado: { label: "Encerrado", variant: "outline" },
};

const CATEGORIAS = [
  { value: "folha_pagamento", label: "Folha de Pagamento" },
  { value: "beneficios", label: "Benefícios" },
  { value: "documentos", label: "Documentos" },
  { value: "outros", label: "Outros" },
];

const SuporteFuncionarios = () => {
  const { user } = useAuth();
  const { data: chamados = [], isLoading } = useTodosChamados();
  const [chamadoSelecionado, setChamadoSelecionado] = useState<ChamadoSuporte | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [resposta, setResposta] = useState("");
  const [arquivoResposta, setArquivoResposta] = useState<File | null>(null);
  const replyFileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: mensagens = [] } = useMensagensChamado(chamadoSelecionado?.id || null);
  const enviarMensagem = useEnviarMensagem();
  const atualizarStatus = useAtualizarStatusChamado();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const chamadosFiltrados = chamados.filter((c) => {
    if (filtroStatus !== "todos" && c.status !== filtroStatus) return false;
    if (filtroCategoria !== "todos" && c.categoria !== filtroCategoria) return false;
    if (busca) {
      const term = busca.toLowerCase();
      const nome = c.profiles?.nome?.toLowerCase() || "";
      return nome.includes(term) || c.assunto.toLowerCase().includes(term);
    }
    return true;
  });

  const handleEnviarResposta = async () => {
    if (!user || !chamadoSelecionado || !resposta.trim()) return;
    await enviarMensagem.mutateAsync({
      chamado_id: chamadoSelecionado.id,
      remetente_id: user.id,
      conteudo: resposta,
      arquivo: arquivoResposta || undefined,
    });
    // Auto change status to respondido
    if (chamadoSelecionado.status === "aberto" || chamadoSelecionado.status === "em_atendimento") {
      await atualizarStatus.mutateAsync({ chamado_id: chamadoSelecionado.id, status: "respondido" });
      setChamadoSelecionado({ ...chamadoSelecionado, status: "respondido" });
    }
    setResposta("");
    setArquivoResposta(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") { toast.error("Apenas PDF"); return; }
      if (file.size > 10 * 1024 * 1024) { toast.error("Máx. 10MB"); return; }
      setArquivoResposta(file);
    }
  };

  const handleChangeStatus = async (status: string) => {
    if (!chamadoSelecionado) return;
    await atualizarStatus.mutateAsync({ chamado_id: chamadoSelecionado.id, status });
    setChamadoSelecionado({ ...chamadoSelecionado, status });
  };

  const statusInfo = (status: string) => STATUS_MAP[status] || { label: status, variant: "outline" as const };

  const contadores = {
    aberto: chamados.filter(c => c.status === "aberto").length,
    em_atendimento: chamados.filter(c => c.status === "em_atendimento").length,
    respondido: chamados.filter(c => c.status === "respondido").length,
    total: chamados.length,
  };

  // ====== CHAT VIEW ======
  if (chamadoSelecionado) {
    const si = statusInfo(chamadoSelecionado.status);
    const isEncerrado = chamadoSelecionado.status === "encerrado";
    return (
      <Layout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setChamadoSelecionado(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar à lista
            </Button>
            <div className="flex items-center gap-2">
              <Select value={chamadoSelecionado.status} onValueChange={handleChangeStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_atendimento">Em atendimento</SelectItem>
                  <SelectItem value="respondido">Respondido</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{chamadoSelecionado.assunto}</CardTitle>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    {chamadoSelecionado.profiles?.nome || "Funcionário"}
                    {chamadoSelecionado.profiles?.departamento && ` • ${chamadoSelecionado.profiles.departamento}`}
                    {" • "}
                    {CATEGORIAS.find(c => c.value === chamadoSelecionado.categoria)?.label || chamadoSelecionado.categoria}
                    {" • "}
                    {format(new Date(chamadoSelecionado.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </div>
                </div>
                <Badge variant={si.variant}>{si.label}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Messages */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto mb-4 p-2">
                {mensagens.map((msg) => {
                  const isRH = msg.remetente_id !== chamadoSelecionado.user_id;
                  return (
                    <div key={msg.id} className={`flex ${isRH ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-lg p-3 ${isRH ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <p className={`text-xs font-medium mb-1 ${isRH ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {msg.profiles?.nome || (isRH ? "RH" : "Funcionário")}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{msg.conteudo}</p>
                        {msg.arquivo_url && (
                          <a href={msg.arquivo_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 mt-2 text-xs underline ${isRH ? "text-primary-foreground/90" : "text-primary"}`}>
                            <Download className="h-3 w-3" /> {msg.arquivo_nome || "Anexo.pdf"}
                          </a>
                        )}
                        <p className={`text-[10px] mt-1 ${isRH ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Reply */}
              {!isEncerrado ? (
                <div className="border-t pt-3 space-y-2">
                  <Textarea value={resposta} onChange={(e) => setResposta(e.target.value)} placeholder="Responder ao funcionário..." className="min-h-[60px]" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => replyFileRef.current?.click()}>
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      {arquivoResposta && <span className="text-xs text-muted-foreground">{arquivoResposta.name}</span>}
                      <input ref={replyFileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                    </div>
                    <Button onClick={handleEnviarResposta} disabled={enviarMensagem.isPending || !resposta.trim()}>
                      <Send className="h-4 w-4 mr-1" /> Responder
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-3 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Chamado encerrado
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // ====== LIST VIEW ======
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Suporte ao Funcionário</h1>
            <p className="text-muted-foreground text-sm">Gerencie todos os chamados de suporte</p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{contadores.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{contadores.aberto}</p>
              <p className="text-xs text-muted-foreground">Abertos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{contadores.em_atendimento}</p>
              <p className="text-xs text-muted-foreground">Em Atendimento</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{contadores.respondido}</p>
              <p className="text-xs text-muted-foreground">Respondidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por funcionário ou assunto..." className="pl-10" />
          </div>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              <SelectItem value="aberto">Aberto</SelectItem>
              <SelectItem value="em_atendimento">Em atendimento</SelectItem>
              <SelectItem value="respondido">Respondido</SelectItem>
              <SelectItem value="encerrado">Encerrado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas Categorias</SelectItem>
              {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Carregando chamados...</p>
        ) : chamadosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">Nenhum chamado encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {chamadosFiltrados.map((chamado) => {
              const si = statusInfo(chamado.status);
              return (
                <Card key={chamado.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setChamadoSelecionado(chamado)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{chamado.assunto}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <User className="h-3 w-3" />
                          <span>{chamado.profiles?.nome || "Funcionário"}</span>
                          {chamado.profiles?.departamento && <span>• {chamado.profiles.departamento}</span>}
                          <span>• {CATEGORIAS.find(c => c.value === chamado.categoria)?.label || chamado.categoria}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={si.variant}>{si.label}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(chamado.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SuporteFuncionarios;
