import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Trash2,
  BookOpen,
  ClipboardCheck,
  Video,
  GripVertical,
  Search,
  Link2,
  Unlink,
  Loader2,
  Settings2,
} from "lucide-react";
import { useCurso } from "@/hooks/useCursos";
import { 
  useAvaliacoesCurso, 
  useTodasAvaliacoes,
  useAvaliacaoMutations,
  type AvaliacaoCurso 
} from "@/hooks/useAvaliacoesCurso";
import { toast } from "sonner";

interface GerenciarConteudoCursoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cursoId: string;
}

export const GerenciarConteudoCursoDialog = ({
  open,
  onOpenChange,
  cursoId,
}: GerenciarConteudoCursoDialogProps) => {
  const [activeTab, setActiveTab] = useState("conteudo");
  const [searchAulas, setSearchAulas] = useState("");
  const [searchAvaliacoes, setSearchAvaliacoes] = useState("");
  const [showAddAvaliacao, setShowAddAvaliacao] = useState(false);
  const [novaAvaliacao, setNovaAvaliacao] = useState({
    titulo: "",
    descricao: "",
    tipo: "quiz",
    tempo_limite: 30,
    tentativas_permitidas: 3,
  });

  const { data: curso, isLoading: loadingCurso } = useCurso(cursoId);
  const { data: avaliacoesCurso, isLoading: loadingAvaliacoes } = useAvaliacoesCurso(cursoId);
  const { data: todasAvaliacoes } = useTodasAvaliacoes();
  const { vincularAvaliacao, desvincularAvaliacao, createAvaliacao } = useAvaliacaoMutations();

  // Avaliações disponíveis (não vinculadas a este curso)
  const avaliacoesDisponiveis = todasAvaliacoes?.filter(
    a => a.curso_id !== cursoId
  ) || [];

  const filteredAvaliacoesDisponiveis = avaliacoesDisponiveis.filter(
    a => a.titulo.toLowerCase().includes(searchAvaliacoes.toLowerCase())
  );

  const handleVincularAvaliacao = (avaliacaoId: string) => {
    vincularAvaliacao.mutate({ avaliacaoId, cursoId });
  };

  const handleDesvincularAvaliacao = (avaliacaoId: string) => {
    desvincularAvaliacao.mutate(avaliacaoId);
  };

  const handleCriarAvaliacao = async () => {
    if (!novaAvaliacao.titulo.trim()) {
      toast.error("Digite o título da avaliação");
      return;
    }

    await createAvaliacao.mutateAsync({
      ...novaAvaliacao,
      curso_id: cursoId,
      ordem: (avaliacoesCurso?.length || 0) + 1,
    });

    setNovaAvaliacao({
      titulo: "",
      descricao: "",
      tipo: "quiz",
      tempo_limite: 30,
      tentativas_permitidas: 3,
    });
    setShowAddAvaliacao(false);
  };

  // Calcular total de aulas do curso
  const totalAulas = curso?.modulos?.reduce((acc, mod) => acc + (mod.aulas?.length || 0), 0) || 0;
  const totalModulos = curso?.modulos?.length || 0;
  const totalAvaliacoes = avaliacoesCurso?.length || 0;

  if (loadingCurso) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Gerenciar Conteúdo: {curso?.titulo}
          </DialogTitle>
        </DialogHeader>

        {/* Resumo do curso */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <Card className="bg-muted/50">
            <CardContent className="p-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Módulos</p>
                <p className="font-semibold">{totalModulos}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-3 flex items-center gap-2">
              <Video className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Aulas</p>
                <p className="font-semibold">{totalAulas}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-3 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Avaliações</p>
                <p className="font-semibold">{totalAvaliacoes}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="shrink-0 w-full justify-start">
            <TabsTrigger value="conteudo" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Conteúdo do Curso
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
            {/* Tab: Conteúdo do Curso */}
            <TabsContent value="conteudo" className="m-0 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Estrutura do Curso</CardTitle>
                  <CardDescription>
                    Módulos e aulas atuais. Para adicionar novas aulas, use a tela de detalhes do curso.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!curso?.modulos || curso.modulos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum módulo criado ainda.</p>
                      <p className="text-sm">Acesse os detalhes do curso para criar módulos e aulas.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {curso.modulos.map((modulo, idx) => (
                        <Card key={modulo.id} className="bg-muted/30">
                          <CardHeader className="p-3 pb-2">
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <Badge variant="outline" className="text-xs">
                                Módulo {idx + 1}
                              </Badge>
                              <span className="font-medium text-sm">{modulo.titulo}</span>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            {!modulo.aulas || modulo.aulas.length === 0 ? (
                              <p className="text-xs text-muted-foreground ml-6">Nenhuma aula neste módulo</p>
                            ) : (
                              <div className="ml-6 space-y-1">
                                {modulo.aulas.map((aula, aulaIdx) => (
                                  <div 
                                    key={aula.id} 
                                    className="flex items-center gap-2 text-sm p-2 rounded bg-background"
                                  >
                                    <Video className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground text-xs">{aulaIdx + 1}.</span>
                                    <span>{aula.titulo}</span>
                                    {aula.duracao && aula.duracao > 0 && (
                                      <Badge variant="outline" className="ml-auto text-xs">
                                        {Math.floor(aula.duracao / 60)}min
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informação sobre conclusão */}
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
                            O funcionário precisa concluir <strong>todas as {totalAulas} aulas</strong> e 
                            <strong> ser aprovado em todas as avaliações</strong> para conclusão total.
                          </>
                        ) : (
                          <>
                            Este curso não possui avaliações. 
                            O funcionário precisa concluir <strong>todas as {totalAulas} aulas</strong> para conclusão total.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Avaliações */}
            <TabsContent value="avaliacoes" className="m-0 space-y-4">
              {/* Avaliações vinculadas */}
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
                    <Card className="mb-4 border-dashed">
                      <CardContent className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label>Título da Avaliação *</Label>
                            <Input
                              placeholder="Ex: Quiz do Módulo 1"
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
                              <SelectContent>
                                <SelectItem value="quiz">Quiz</SelectItem>
                                <SelectItem value="prova">Prova</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Tempo Limite (min)</Label>
                            <Input
                              type="number"
                              min={1}
                              value={novaAvaliacao.tempo_limite}
                              onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, tempo_limite: Number(e.target.value) }))}
                            />
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
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
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
                            Criar e Vincular
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
                        O curso pode ser concluído apenas com a finalização das aulas.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {avaliacoesCurso.map((avaliacao) => (
                        <div 
                          key={avaliacao.id} 
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDesvincularAvaliacao(avaliacao.id)}
                            disabled={desvincularAvaliacao.isPending}
                            className="text-destructive hover:text-destructive"
                          >
                            <Unlink className="h-4 w-4 mr-1" />
                            Remover
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Avaliações disponíveis para vincular */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Vincular Avaliação Existente</CardTitle>
                  <CardDescription>
                    Selecione uma avaliação já criada para vincular ao curso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar avaliações..."
                      value={searchAvaliacoes}
                      onChange={(e) => setSearchAvaliacoes(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {filteredAvaliacoesDisponiveis.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      Nenhuma avaliação disponível para vincular
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {filteredAvaliacoesDisponiveis.map((avaliacao) => (
                        <div 
                          key={avaliacao.id} 
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{avaliacao.titulo}</p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {avaliacao.tipo === "quiz" ? "Quiz" : "Prova"}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVincularAvaliacao(avaliacao.id)}
                            disabled={vincularAvaliacao.isPending}
                          >
                            <Link2 className="h-4 w-4 mr-1" />
                            Vincular
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Nota informativa */}
              <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <ClipboardCheck className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Avaliações são Opcionais</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Você pode publicar o curso com ou sem avaliações. 
                        Apenas avaliações vinculadas são obrigatórias para a conclusão total do curso.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <Separator className="my-4" />
        
        <div className="flex justify-end shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
