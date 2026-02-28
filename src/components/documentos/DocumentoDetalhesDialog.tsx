import { useState, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Download, Star, ExternalLink, Clock, User, FileText, 
  MessageSquare, History, Send, Upload, Loader2, Tag
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useDocumentoComentarios, useDocumentoVersoes, useAddComentario, useUploadVersao, getDocumentoAccessUrl } from "@/hooks/useDocumentos";
import { TIPO_LABELS, type Documento } from "@/types/documentos";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface DocumentoDetalhesDialogProps {
  documento: Documento;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isFavorito: boolean;
  onToggleFavorito: () => void;
}

export const DocumentoDetalhesDialog = ({ 
  documento, 
  open, 
  onOpenChange,
  isFavorito,
  onToggleFavorito
}: DocumentoDetalhesDialogProps) => {
  const { data: comentarios } = useDocumentoComentarios(documento.id);
  const { data: versoes } = useDocumentoVersoes(documento.id);
  const addComentario = useAddComentario();
  const uploadVersao = useUploadVersao();
  
  const [comentarioText, setComentarioText] = useState("");
  const [alteracoesText, setAlteracoesText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddComentario = async () => {
    if (!comentarioText.trim()) return;
    await addComentario.mutateAsync({
      documentoId: documento.id,
      conteudo: comentarioText,
    });
    setComentarioText("");
  };

  const handleUploadVersao = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    await uploadVersao.mutateAsync({
      documentoId: documento.id,
      file,
      alteracoes: alteracoesText || undefined,
    });
    setAlteracoesText("");
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{documento.titulo}</DialogTitle>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Badge variant="secondary">{TIPO_LABELS[documento.tipo]}</Badge>
                  {documento.categoria && (
                    <Badge 
                      variant="outline"
                      style={{ borderColor: documento.categoria.cor, color: documento.categoria.cor }}
                    >
                      {documento.categoria.nome}
                    </Badge>
                  )}
                  <span>v{documento.versao_atual}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFavorito}
              >
                <Star className={cn(
                  "h-5 w-5",
                  isFavorito ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                )} />
              </Button>
              <Button variant="outline" onClick={() => window.open(documento.arquivo_url, '_blank')}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="info" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="versoes" className="gap-1">
                <History className="h-4 w-4" />
                Versões ({versoes?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="comentarios" className="gap-1">
                <MessageSquare className="h-4 w-4" />
                Comentários ({comentarios?.length || 0})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              <TabsContent value="info" className="mt-0 space-y-4">
                {documento.descricao && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Descrição</h4>
                    <p className="text-sm text-muted-foreground">{documento.descricao}</p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Criado em</p>
                      <p className="font-medium">
                        {format(new Date(documento.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Criado por</p>
                      <p className="font-medium">{documento.profiles?.nome || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Tamanho</p>
                      <p className="font-medium">{formatFileSize(documento.arquivo_tamanho)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Visualizações</p>
                      <p className="font-medium">{documento.visualizacoes}</p>
                    </div>
                  </div>
                </div>

                {documento.tags && documento.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {documento.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Nova versão */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Enviar Nova Versão</h4>
                  <div className="space-y-2">
                    <Input
                      placeholder="Descreva as alterações (opcional)"
                      value={alteracoesText}
                      onChange={(e) => setAlteracoesText(e.target.value)}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleUploadVersao}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadVersao.isPending}
                    >
                      {uploadVersao.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Selecionar Arquivo
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="versoes" className="mt-0">
                {versoes?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma versão anterior registrada
                  </div>
                ) : (
                  <div className="space-y-3">
                    {versoes?.map((versao) => (
                      <div key={versao.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className="p-2 rounded-lg bg-muted">
                          <History className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">Versão {versao.versao}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(versao.arquivo_url, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                          {versao.alteracoes && (
                            <p className="text-sm text-muted-foreground">{versao.alteracoes}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(versao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            {versao.profiles?.nome && ` por ${versao.profiles.nome}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="comentarios" className="mt-0 space-y-4">
                {/* Input de comentário */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar comentário..."
                    value={comentarioText}
                    onChange={(e) => setComentarioText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComentario()}
                  />
                  <Button 
                    onClick={handleAddComentario}
                    disabled={!comentarioText.trim() || addComentario.isPending}
                  >
                    {addComentario.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Lista de comentários */}
                {comentarios?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum comentário ainda
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comentarios?.map((comentario) => (
                      <div key={comentario.id} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{comentario.profiles?.nome || "Usuário"}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(comentario.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <p className="text-sm">{comentario.conteudo}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
