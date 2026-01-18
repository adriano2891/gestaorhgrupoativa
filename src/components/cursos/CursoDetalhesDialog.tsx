import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  GripVertical,
  Video,
  Trash2,
  Clock,
  BookOpen,
  Youtube,
  HardDrive,
  Link,
  Upload,
  ClipboardCheck,
  Loader2,
  Unlink,
  Edit,
  HelpCircle
} from "lucide-react";
import { useCurso, useModuloMutations, useAulaMutations } from "@/hooks/useCursos";
import { 
  useAvaliacoesCurso, 
  useTodasAvaliacoes,
  useAvaliacaoMutations 
} from "@/hooks/useAvaliacoesCurso";
import { NIVEL_LABELS, STATUS_LABELS } from "@/types/cursos";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AulaFormDialog } from "./AulaFormDialog";
import { QuestoesAvaliacaoForm } from "./QuestoesAvaliacaoForm";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CursoDetalhesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cursoId: string;
}

// Detectar fonte do vídeo para exibir ícone
const getVideoSourceIcon = (url: string | null) => {
  if (!url) return null;
  if (url.includes("youtube.com")) return Youtube;
  if (url.includes("drive.google.com")) return HardDrive;
  if (url.includes("supabase")) return Upload;
  return Link;
};

export const CursoDetalhesDialog = ({ open, onOpenChange, cursoId }: CursoDetalhesDialogProps) => {
  const queryClient = useQueryClient();
  const { data: curso, isLoading } = useCurso(cursoId);
  const { createModulo, deleteModulo } = useModuloMutations();
  const { deleteAula } = useAulaMutations();

  // Avaliações
  const { data: avaliacoesCurso, isLoading: loadingAvaliacoes } = useAvaliacoesCurso(cursoId);
  const { data: todasAvaliacoes } = useTodasAvaliacoes();
  const { vincularAvaliacao, desvincularAvaliacao, createAvaliacao } = useAvaliacaoMutations();

  const [activeTab, setActiveTab] = useState("modulos");
  const [expandedModulos, setExpandedModulos] = useState<Set<string>>(new Set());
  const [novoModulo, setNovoModulo] = useState({ titulo: "", descricao: "" });
  const [showNovoModulo, setShowNovoModulo] = useState(false);
  const [aulaFormOpen, setAulaFormOpen] = useState(false);
  const [selectedModuloId, setSelectedModuloId] = useState<string | null>(null);
  const [selectedModuloOrdem, setSelectedModuloOrdem] = useState(1);
  const [showAddAvaliacao, setShowAddAvaliacao] = useState(false);
  const [expandedAvaliacoes, setExpandedAvaliacoes] = useState<Set<string>>(new Set());
  const [novaAvaliacao, setNovaAvaliacao] = useState({
    titulo: "",
    descricao: "",
    tipo: "prova", // Default para prova com 4 alternativas
    tempo_limite: 30,
    tentativas_permitidas: 3,
  });

  const totalAvaliacoes = avaliacoesCurso?.length || 0;

  const toggleAvaliacao = (id: string) => {
    setExpandedAvaliacoes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleModulo = (id: string) => {
    setExpandedModulos(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreateModulo = async () => {
    if (!novoModulo.titulo.trim()) return;
    
    await createModulo.mutateAsync({
      curso_id: cursoId,
      titulo: novoModulo.titulo,
      descricao: novoModulo.descricao,
      ordem: (curso?.modulos?.length || 0) + 1,
    });
    
    setNovoModulo({ titulo: "", descricao: "" });
    setShowNovoModulo(false);
  };

  const handleOpenAulaForm = (moduloId: string) => {
    const modulo = curso?.modulos?.find(m => m.id === moduloId);
    setSelectedModuloId(moduloId);
    setSelectedModuloOrdem((modulo?.aulas?.length || 0) + 1);
    setAulaFormOpen(true);
  };

  const handleAulaCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["curso", cursoId] });
  };

  const handleDesvincularAvaliacao = (avaliacaoId: string) => {
    desvincularAvaliacao.mutate(avaliacaoId);
  };

  const handleCriarAvaliacao = async () => {
    if (!novaAvaliacao.titulo.trim()) {
      toast.error("Digite o título da avaliação");
      return;
    }

    const result = await createAvaliacao.mutateAsync({
      ...novaAvaliacao,
      curso_id: cursoId,
      ordem: (avaliacoesCurso?.length || 0) + 1,
    });

    // Expandir a avaliação recém-criada para adicionar questões
    if (result?.id) {
      setExpandedAvaliacoes(prev => new Set([...prev, result.id]));
    }

    setNovaAvaliacao({
      titulo: "",
      descricao: "",
      tipo: "prova", // Default para prova
      tempo_limite: 30,
      tentativas_permitidas: 3,
    });
    setShowAddAvaliacao(false);
    toast.success("Avaliação criada! Agora adicione as questões abaixo.");
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <Skeleton className="h-8 w-64" />
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!curso) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{curso.titulo}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{curso.descricao}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{STATUS_LABELS[curso.status]}</Badge>
                <Badge variant="outline">{NIVEL_LABELS[curso.nivel]}</Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.floor(curso.carga_horaria / 60)}h
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="shrink-0 w-full justify-start">
            <TabsTrigger value="modulos" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Módulos e Aulas
            </TabsTrigger>
            <TabsTrigger value="avaliacoes" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Avaliações
              {totalAvaliacoes > 0 && (
                <Badge variant="secondary" className="ml-1">{totalAvaliacoes}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            {/* Tab: Módulos e Aulas */}
            <TabsContent value="modulos" className="m-0 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Módulos e Aulas
                </h3>
                <Button size="sm" onClick={() => setShowNovoModulo(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Novo Módulo
                </Button>
              </div>

              {/* Form para novo módulo */}
              {showNovoModulo && (
                <Card className="border-dashed border-primary/50 bg-primary/5">
                  <CardContent className="p-4 space-y-3">
                    <Input
                      placeholder="Título do módulo"
                      value={novoModulo.titulo}
                      onChange={(e) => setNovoModulo(prev => ({ ...prev, titulo: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Descrição (opcional)"
                      rows={2}
                      value={novoModulo.descricao}
                      onChange={(e) => setNovoModulo(prev => ({ ...prev, descricao: e.target.value }))}
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setShowNovoModulo(false)}>
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={handleCreateModulo} disabled={createModulo.isPending}>
                        Salvar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lista de módulos */}
              {curso.modulos && curso.modulos.length > 0 ? (
                <div className="space-y-3">
                  {curso.modulos.map((modulo, index) => (
                    <Card key={modulo.id}>
                      <Collapsible
                        open={expandedModulos.has(modulo.id)}
                        onOpenChange={() => toggleModulo(modulo.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <CardHeader className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <span className="bg-primary/10 text-primary font-medium px-2 py-0.5 rounded text-sm">
                                  {index + 1}
                                </span>
                                <div>
                                  <h4 className="font-medium">{modulo.titulo}</h4>
                                  {modulo.descricao && (
                                    <p className="text-sm text-muted-foreground">{modulo.descricao}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">
                                  {modulo.aulas?.length || 0} aulas
                                </Badge>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteModulo.mutate(modulo.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                                {expandedModulos.has(modulo.id) ? (
                                  <ChevronUp className="h-5 w-5" />
                                ) : (
                                  <ChevronDown className="h-5 w-5" />
                                )}
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <CardContent className="pt-0 pb-4">
                            <div className="space-y-2 ml-10">
                              {/* Aulas do módulo */}
                              {modulo.aulas && modulo.aulas.length > 0 ? (
                                modulo.aulas.map((aula) => {
                                  const SourceIcon = getVideoSourceIcon(aula.video_url);
                                  
                                  return (
                                    <div
                                      key={aula.id}
                                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg group"
                                    >
                                      <div className="flex items-center gap-3">
                                        {SourceIcon ? (
                                          <SourceIcon className="h-4 w-4 text-primary" />
                                        ) : (
                                          <Video className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <div>
                                          <p className="font-medium text-sm">{aula.titulo}</p>
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            <span>{formatDuration(aula.duracao)}</span>
                                            {aula.video_url && (
                                              <Badge variant="outline" className="text-xs px-1.5 py-0">
                                                {aula.video_url.includes("youtube") ? "YouTube" : 
                                                 aula.video_url.includes("drive.google") ? "Drive" :
                                                 aula.video_url.includes("supabase") ? "Upload" : "Link"}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <Button 
                                        size="icon" 
                                        variant="ghost"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => deleteAula.mutate(aula.id)}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-sm text-muted-foreground py-2">
                                  Nenhuma aula cadastrada
                                </p>
                              )}

                              {/* Botão para nova aula */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full border border-dashed"
                                onClick={() => handleOpenAulaForm(modulo.id)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Adicionar Aula
                              </Button>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">
                      Nenhum módulo cadastrado. Comece adicionando o primeiro módulo.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab: Avaliações */}
            <TabsContent value="avaliacoes" className="m-0 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Avaliações do Curso</CardTitle>
                      <CardDescription>
                        Avaliações vinculadas são obrigatórias para conclusão
                      </CardDescription>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => setShowAddAvaliacao(!showAddAvaliacao)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Nova Avaliação
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {showAddAvaliacao && (
                    <Card className="mb-4 border-2 border-primary/50 bg-primary/5">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center gap-2 text-primary mb-2">
                          <ClipboardCheck className="h-4 w-4" />
                          <span className="font-medium">Nova Avaliação / Prova</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label>Título da Avaliação *</Label>
                            <Input
                              placeholder="Ex: Prova Final do Módulo 1"
                              value={novaAvaliacao.titulo}
                              onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, titulo: e.target.value }))}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Descrição</Label>
                            <Textarea
                              placeholder="Descrição da avaliação..."
                              value={novaAvaliacao.descricao}
                              onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, descricao: e.target.value }))}
                              rows={2}
                            />
                          </div>
                          <div>
                            <Label>Tipo</Label>
                            <Select 
                              value={novaAvaliacao.tipo} 
                              onValueChange={(v) => setNovaAvaliacao(prev => ({ ...prev, tipo: v }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-background">
                                <SelectItem value="prova">Prova (4 alternativas)</SelectItem>
                                <SelectItem value="quiz">Quiz (rápido)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Tempo por Questão</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={1}
                                value={2}
                                disabled
                                className="bg-muted"
                              />
                              <span className="text-sm text-muted-foreground">min (fixo)</span>
                            </div>
                          </div>
                          <div>
                            <Label>Tentativas Permitidas</Label>
                            <Input
                              type="number"
                              min={1}
                              value={novaAvaliacao.tentativas_permitidas}
                              onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, tentativas_permitidas: Number(e.target.value) }))}
                            />
                          </div>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3 text-sm">
                          <p className="font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                            Regras da Prova:
                          </p>
                          <ul className="text-yellow-600 dark:text-yellow-300 space-y-0.5 text-xs">
                            <li>• Cada questão terá 4 alternativas (A, B, C, D)</li>
                            <li>• Tempo limite de 2 minutos por questão</li>
                            <li>• Reprovação: nova tentativa após 24 horas</li>
                            <li>• Nota mínima para aprovação: 70%</li>
                          </ul>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowAddAvaliacao(false)}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleCriarAvaliacao}
                            disabled={createAvaliacao.isPending}
                          >
                            {createAvaliacao.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                            Criar Avaliação
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {loadingAvaliacoes ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : !avaliacoesCurso || avaliacoesCurso.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <ClipboardCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma avaliação vinculada</p>
                      <p className="text-xs mt-1">
                        Clique em "Nova Avaliação" para criar uma prova com questões de múltipla escolha.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {avaliacoesCurso.map((avaliacao) => {
                        const isExpanded = expandedAvaliacoes.has(avaliacao.id);
                        
                        return (
                          <Card 
                            key={avaliacao.id} 
                            className={`overflow-hidden transition-all ${
                              isExpanded ? "border-primary/50 shadow-md" : ""
                            }`}
                          >
                            <div 
                              className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => toggleAvaliacao(avaliacao.id)}
                            >
                              <div className="flex items-center gap-3">
                                <ClipboardCheck className="h-4 w-4 text-green-500" />
                                <div>
                                  <p className="font-medium text-sm">{avaliacao.titulo}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-xs">
                                      {avaliacao.tipo === "quiz" ? "Quiz" : "Prova"}
                                    </Badge>
                                    {avaliacao.tempo_limite && (
                                      <span>{avaliacao.tempo_limite}min</span>
                                    )}
                                    {avaliacao.tentativas_permitidas && (
                                      <span>{avaliacao.tentativas_permitidas} tentativas</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant={isExpanded ? "default" : "outline"}
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleAvaliacao(avaliacao.id);
                                  }}
                                  className="gap-1"
                                >
                                  <HelpCircle className="h-4 w-4" />
                                  {isExpanded ? "Ocultar Questões" : "Gerenciar Questões"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDesvincularAvaliacao(avaliacao.id);
                                  }}
                                  disabled={desvincularAvaliacao.isPending}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="px-4 pb-4 border-t bg-muted/10">
                                <QuestoesAvaliacaoForm 
                                  avaliacaoId={avaliacao.id} 
                                  tipoAvaliacao={avaliacao.tipo || "prova"} 
                                />
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informação sobre regras de conclusão */}
              <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <ClipboardCheck className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Regras de Conclusão</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {totalAvaliacoes > 0 ? (
                          <>
                            Este curso possui <strong>{totalAvaliacoes} avaliação(ões)</strong>. 
                            O funcionário precisa concluir <strong>todas as aulas</strong> e 
                            <strong> ser aprovado em todas as avaliações</strong> para conclusão total.
                          </>
                        ) : (
                          <>
                            Este curso não possui avaliações. 
                            O funcionário precisa concluir <strong>todas as aulas</strong> para conclusão total.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Dialog para criar aula */}
        {selectedModuloId && (
          <AulaFormDialog
            open={aulaFormOpen}
            onOpenChange={setAulaFormOpen}
            moduloId={selectedModuloId}
            ordem={selectedModuloOrdem}
            onSuccess={handleAulaCreated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
