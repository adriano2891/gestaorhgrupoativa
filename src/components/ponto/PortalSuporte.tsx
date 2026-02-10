import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MessageCircle, Plus, Send, Paperclip, FileText, Download, Clock } from "lucide-react";
import { PortalBackground } from "./PortalBackground";
import { usePortalAuth } from "./PortalAuthProvider";
import {
  useMeusChamados,
  useMensagensChamado,
  useCriarChamado,
  useEnviarMensagem,
  type ChamadoSuporte,
} from "@/hooks/useChamadosSuporte";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface PortalSuporteProps {
  onBack: () => void;
}

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

export const PortalSuporte = ({ onBack }: PortalSuporteProps) => {
  const { user, profile } = usePortalAuth();
  const [view, setView] = useState<"lista" | "novo" | "chat">("lista");
  const [chamadoSelecionado, setChamadoSelecionado] = useState<ChamadoSuporte | null>(null);

  // Form state
  const [categoria, setCategoria] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [resposta, setResposta] = useState("");
  const [arquivoResposta, setArquivoResposta] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: chamados = [], isLoading } = useMeusChamados();
  const { data: mensagens = [] } = useMensagensChamado(chamadoSelecionado?.id || null);
  const criarChamado = useCriarChamado();
  const enviarMensagem = useEnviarMensagem();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isReply = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Apenas arquivos PDF são permitidos");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande (máx. 10MB)");
        return;
      }
      if (isReply) setArquivoResposta(file);
      else setArquivo(file);
    }
  };

  const handleCriarChamado = async () => {
    if (!user || !categoria || !assunto || !mensagem) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    await criarChamado.mutateAsync({
      user_id: user.id,
      categoria,
      assunto,
      mensagem,
      arquivo: arquivo || undefined,
    });
    setCategoria("");
    setAssunto("");
    setMensagem("");
    setArquivo(null);
    setView("lista");
  };

  const handleEnviarResposta = async () => {
    if (!user || !chamadoSelecionado || !resposta.trim()) return;
    await enviarMensagem.mutateAsync({
      chamado_id: chamadoSelecionado.id,
      remetente_id: user.id,
      conteudo: resposta,
      arquivo: arquivoResposta || undefined,
    });
    setResposta("");
    setArquivoResposta(null);
  };

  const abrirChat = (chamado: ChamadoSuporte) => {
    setChamadoSelecionado(chamado);
    setView("chat");
  };

  const statusInfo = (status: string) => STATUS_MAP[status] || { label: status, variant: "outline" as const };

  // ====== VIEW: NOVO CHAMADO ======
  if (view === "novo") {
    return (
      <PortalBackground>
        <header className="bg-card border-b shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => setView("lista")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" /> Novo Chamado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Categoria *</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assunto *</Label>
                  <Input value={assunto} onChange={(e) => setAssunto(e.target.value)} placeholder="Descreva brevemente o assunto" />
                </div>
                <div>
                  <Label>Mensagem *</Label>
                  <Textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Descreva sua dúvida ou solicitação em detalhes..." className="min-h-[120px]" />
                </div>
                <div>
                  <Label>Anexar PDF (opcional)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-4 w-4 mr-1" /> Anexar PDF
                    </Button>
                    {arquivo && <span className="text-sm text-muted-foreground">{arquivo.name}</span>}
                  </div>
                  <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileChange(e)} />
                </div>
                <Button className="w-full" onClick={handleCriarChamado} disabled={criarChamado.isPending}>
                  {criarChamado.isPending ? "Enviando..." : "Enviar Chamado"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </PortalBackground>
    );
  }

  // ====== VIEW: CHAT DO CHAMADO ======
  if (view === "chat" && chamadoSelecionado) {
    const si = statusInfo(chamadoSelecionado.status);
    const isEncerrado = chamadoSelecionado.status === "encerrado";
    return (
      <PortalBackground>
        <header className="bg-card border-b shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => { setView("lista"); setChamadoSelecionado(null); }}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
              <Badge variant={si.variant}>{si.label}</Badge>
            </div>
            <div className="mt-2">
              <h3 className="font-semibold">{chamadoSelecionado.assunto}</h3>
              <p className="text-xs text-muted-foreground">
                {CATEGORIAS.find(c => c.value === chamadoSelecionado.categoria)?.label || chamadoSelecionado.categoria}
                {" • "}
                {format(new Date(chamadoSelecionado.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-4 flex flex-col" style={{ height: "calc(100vh - 160px)" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {mensagens.map((msg) => {
              const isMe = msg.remetente_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <p className={`text-xs font-medium mb-1 ${isMe ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {msg.profiles?.nome || (isMe ? "Você" : "RH")}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{msg.conteudo}</p>
                    {msg.arquivo_url && (
                      <a href={msg.arquivo_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 mt-2 text-xs underline ${isMe ? "text-primary-foreground/90" : "text-primary"}`}>
                        <Download className="h-3 w-3" /> {msg.arquivo_nome || "Anexo.pdf"}
                      </a>
                    )}
                    <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Reply area */}
          {!isEncerrado ? (
            <div className="border-t pt-3 space-y-2">
              <Textarea value={resposta} onChange={(e) => setResposta(e.target.value)} placeholder="Escreva sua resposta..." className="min-h-[60px]" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => replyFileRef.current?.click()}>
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  {arquivoResposta && <span className="text-xs text-muted-foreground">{arquivoResposta.name}</span>}
                  <input ref={replyFileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileChange(e, true)} />
                </div>
                <Button onClick={handleEnviarResposta} disabled={enviarMensagem.isPending || !resposta.trim()}>
                  <Send className="h-4 w-4 mr-1" /> Enviar
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-t pt-3 text-center text-sm text-muted-foreground">
              Este chamado foi encerrado.
            </div>
          )}
        </main>
      </PortalBackground>
    );
  }

  // ====== VIEW: LISTA DE CHAMADOS ======
  return (
    <PortalBackground>
      <header className="bg-card border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <Button onClick={() => setView("novo")}>
            <Plus className="h-4 w-4 mr-2" /> Novo Chamado
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <MessageCircle className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Suporte / Contato RH</h1>
              <p className="text-muted-foreground text-sm">Acompanhe seus chamados ou abra um novo</p>
            </div>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : chamados.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground">Nenhum chamado encontrado.</p>
                <Button className="mt-4" onClick={() => setView("novo")}>
                  <Plus className="h-4 w-4 mr-2" /> Abrir Primeiro Chamado
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {chamados.map((chamado) => {
                const si = statusInfo(chamado.status);
                return (
                  <Card key={chamado.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => abrirChat(chamado)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{chamado.assunto}</h3>
                          <p className="text-sm text-muted-foreground">
                            {CATEGORIAS.find(c => c.value === chamado.categoria)?.label || chamado.categoria}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={si.variant}>{si.label}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(chamado.created_at), "dd/MM/yy", { locale: ptBR })}
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
      </main>
    </PortalBackground>
  );
};
