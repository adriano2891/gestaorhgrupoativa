import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  Lock,
  Trophy,
  Play,
  RotateCcw,
  Award
} from "lucide-react";
import { useCurso, useProgressoAulas, useProgressoMutations, useAtualizarProgressoMatricula, useMeusCertificados } from "@/hooks/useCursos";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { VideoPlayer } from "@/components/cursos/VideoPlayer";
import { ProgressoAulaBar, ProgressoModulo } from "@/components/cursos/ProgressoAulaBar";
import { toast } from "sonner";
import type { Aula } from "@/types/cursos";

// Tipo auxiliar para status da aula
type AulaStatus = "nao_iniciada" | "em_andamento" | "concluida";

export const PortalCursoPlayer = () => {
  const { cursoId } = useParams<{ cursoId: string }>();
  const navigate = useNavigate();
  const { data: curso, isLoading } = useCurso(cursoId);
  const { data: progressoAulas, refetch: refetchProgresso } = useProgressoAulas(cursoId);
  const { data: meusCertificados } = useMeusCertificados();
  const { updateProgresso } = useProgressoMutations();
  const { atualizarMatricula } = useAtualizarProgressoMatricula();

  const [selectedAula, setSelectedAula] = useState<Aula | null>(null);
  const [expandedModulos, setExpandedModulos] = useState<Set<string>>(new Set());
  const [lastSavedTime, setLastSavedTime] = useState(0);
  const [currentVideoProgress, setCurrentVideoProgress] = useState(0);

  // Verificar se já tem certificado deste curso
  const temCertificado = meusCertificados?.some(c => c.curso_id === cursoId);

  // Criar lista ordenada de todas as aulas para controle de progressão linear
  const aulasOrdenadas = useMemo(() => {
    if (!curso?.modulos) return [];
    const aulas: (Aula & { moduloIndex: number; aulaIndex: number; globalIndex: number })[] = [];
    let globalIndex = 0;
    curso.modulos.forEach((modulo, moduloIndex) => {
      modulo.aulas?.forEach((aula, aulaIndex) => {
        aulas.push({ ...aula, moduloIndex, aulaIndex, globalIndex });
        globalIndex++;
      });
    });
    return aulas;
  }, [curso]);

  // Verificar se uma aula está desbloqueada (progressão linear)
  const isAulaDesbloqueada = (aulaId: string): boolean => {
    const aulaIndex = aulasOrdenadas.findIndex(a => a.id === aulaId);
    if (aulaIndex === 0) return true; // Primeira aula sempre desbloqueada
    
    // Verificar se todas as aulas anteriores foram concluídas
    for (let i = 0; i < aulaIndex; i++) {
      const aulaAnterior = aulasOrdenadas[i];
      const progresso = progressoAulas?.find(p => p.aula_id === aulaAnterior.id);
      if (!progresso?.concluida) {
        return false;
      }
    }
    return true;
  };

  // Selecionar primeira aula não concluída ao carregar
  useEffect(() => {
    if (curso?.modulos && !selectedAula && aulasOrdenadas.length > 0) {
      // Encontrar primeira aula não concluída que está desbloqueada
      for (const aula of aulasOrdenadas) {
        const progresso = progressoAulas?.find(p => p.aula_id === aula.id);
        if (!progresso?.concluida && isAulaDesbloqueada(aula.id)) {
          setSelectedAula(aula);
          const modulo = curso.modulos[aula.moduloIndex];
          if (modulo) {
            setExpandedModulos(new Set([modulo.id]));
          }
          return;
        }
      }
      // Se todas concluídas, seleciona a primeira
      if (aulasOrdenadas[0]) {
        setSelectedAula(aulasOrdenadas[0]);
        if (curso.modulos[0]) {
          setExpandedModulos(new Set([curso.modulos[0].id]));
        }
      }
    }
  }, [curso, progressoAulas, selectedAula, aulasOrdenadas]);

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

const isAulaConcluida = (aulaId: string) => {
    return progressoAulas?.find(p => p.aula_id === aulaId)?.concluida || false;
  };

  // Obter status da aula
  const getAulaStatus = (aulaId: string): AulaStatus => {
    const progresso = progressoAulas?.find(p => p.aula_id === aulaId);
    if (!progresso) return "nao_iniciada";
    if (progresso.concluida) return "concluida";
    if ((progresso.tempo_assistido || 0) > 0) return "em_andamento";
    return "nao_iniciada";
  };

  // Obter progresso da aula atual em porcentagem
  const getAulaProgress = (aulaId: string): number => {
    const progresso = progressoAulas?.find(p => p.aula_id === aulaId);
    if (!progresso) return 0;
    if (progresso.concluida) return 100;
    const aula = aulasOrdenadas.find(a => a.id === aulaId);
    if (!aula?.duracao || aula.duracao === 0) return 0;
    return Math.min(100, Math.round(((progresso.tempo_assistido || 0) / aula.duracao) * 100));
  };

  // Calcular progresso do módulo
  const getModuloProgress = (moduloId: string): { total: number; concluidas: number } => {
    const modulo = curso?.modulos?.find(m => m.id === moduloId);
    if (!modulo?.aulas) return { total: 0, concluidas: 0 };
    const total = modulo.aulas.length;
    const concluidas = modulo.aulas.filter(a => isAulaConcluida(a.id)).length;
    return { total, concluidas };
  };

  const getProgressoCurso = () => {
    if (!aulasOrdenadas.length || !progressoAulas) return 0;
    
    const aulasConcluidas = aulasOrdenadas.filter(aula => 
      progressoAulas.find(p => p.aula_id === aula.id)?.concluida
    ).length;
    
    return Math.round((aulasConcluidas / aulasOrdenadas.length) * 100);
  };

  // Encontrar próxima aula a continuar
  const proximaAulaContinuar = useMemo(() => {
    for (const aula of aulasOrdenadas) {
      if (!isAulaConcluida(aula.id) && isAulaDesbloqueada(aula.id)) {
        return aula;
      }
    }
    return null;
  }, [aulasOrdenadas, progressoAulas]);

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    if (selectedAula && Math.floor(currentTime) !== lastSavedTime && Math.floor(currentTime) % 10 === 0) {
      setLastSavedTime(Math.floor(currentTime));
      updateProgresso.mutate({
        aula_id: selectedAula.id,
        tempo_assistido: Math.floor(currentTime),
        posicao_video: Math.floor(currentTime),
      });
    }
  };

  const handleVideoEnded = async () => {
    if (selectedAula && cursoId) {
      // Marcar aula como concluída
      await updateProgresso.mutateAsync({
        aula_id: selectedAula.id,
        concluida: true,
        data_conclusao: new Date().toISOString(),
      });
      
      // Calcular novo progresso
      const aulasConcluidas = aulasOrdenadas.filter(aula => {
        if (aula.id === selectedAula.id) return true; // Incluir a aula recém concluída
        return progressoAulas?.find(p => p.aula_id === aula.id)?.concluida;
      }).length;
      
      const novoProgresso = Math.round((aulasConcluidas / aulasOrdenadas.length) * 100);
      
      // Atualizar progresso na matrícula
      atualizarMatricula.mutate({
        cursoId,
        progresso: novoProgresso,
        status: novoProgresso >= 100 ? 'concluido' : 'em_andamento'
      });

      // Notificar usuário
      if (novoProgresso >= 100) {
        toast.success("🎉 Parabéns! Você concluiu o curso!", {
          description: "Seu certificado estará disponível em breve."
        });
      } else {
        toast.success("Aula concluída!", {
          description: `Progresso: ${novoProgresso}%`
        });
      }

      // Avançar para próxima aula
      const currentIndex = aulasOrdenadas.findIndex(a => a.id === selectedAula.id);
      const nextAula = aulasOrdenadas[currentIndex + 1];
      
      if (nextAula) {
        setSelectedAula(nextAula);
        const modulo = curso?.modulos?.[nextAula.moduloIndex];
        if (modulo) {
          setExpandedModulos(prev => new Set([...prev, modulo.id]));
        }
      }
    }
  };

  const handleSelecionarAula = (aula: Aula) => {
    if (!isAulaDesbloqueada(aula.id)) {
      toast.error("Aula bloqueada", {
        description: "Complete as aulas anteriores para desbloquear esta aula."
      });
      return;
    }
    setSelectedAula(aula);
  };

  const handleBack = () => {
    navigate("/portal-funcionario");
  };

  // Obter posição inicial do vídeo
  const getInitialPosition = () => {
    if (!selectedAula || !progressoAulas) return 0;
    const progresso = progressoAulas.find(p => p.aula_id === selectedAula.id);
    return progresso?.posicao_video || 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4">
          <Skeleton className="h-12 w-48 mb-4" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[500px] lg:col-span-2" />
            <Skeleton className="h-[500px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Curso não encontrado</h3>
            <Button className="mt-4" onClick={handleBack}>
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressoCurso = getProgressoCurso();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="hidden sm:block">
                <h1 className="font-semibold line-clamp-1">{curso.titulo}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {temCertificado && (
                <Badge className="bg-amber-100 text-amber-700 gap-1">
                  <Award className="h-3 w-3" />
                  Certificado
                </Badge>
              )}
              {progressoCurso >= 100 && (
                <Badge className="bg-green-100 text-green-700 gap-1">
                  <Trophy className="h-3 w-3" />
                  Concluído
                </Badge>
              )}
              <div className="text-sm text-muted-foreground">
                {progressoCurso}% concluído
              </div>
              <Progress 
                value={progressoCurso} 
                className={`w-24 h-2 ${progressoCurso >= 100 ? '[&>div]:bg-green-500' : ''}`} 
              />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-4">
            {/* Player unificado */}
            <VideoPlayer
              url={selectedAula?.video_url || ""}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              initialPosition={getInitialPosition()}
              embedVariant="portal"
            />

            {/* Info da aula atual */}
            {selectedAula && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{selectedAula.titulo}</CardTitle>
                    {isAulaConcluida(selectedAula.id) && (
                      <Badge className="bg-green-100 text-green-700 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Concluída
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{selectedAula.descricao || "Sem descrição"}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Lista de módulos/aulas */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Conteúdo do Curso
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {aulasOrdenadas.filter(a => isAulaConcluida(a.id)).length} de {aulasOrdenadas.length} aulas concluídas
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[60vh]">
                  <div className="p-4 space-y-2">
                    {curso.modulos?.map((modulo, index) => (
                      <Collapsible
                        key={modulo.id}
                        open={expandedModulos.has(modulo.id)}
                        onOpenChange={() => toggleModulo(modulo.id)}
                      >
                        <CollapsibleTrigger className="w-full">
                          <div className="p-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                                  {index + 1}
                                </Badge>
                                <span className="font-medium text-sm text-left">{modulo.titulo}</span>
                              </div>
                              {expandedModulos.has(modulo.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                            {/* Progresso do módulo */}
                            <ProgressoModulo 
                              aulasTotal={getModuloProgress(modulo.id).total}
                              aulasConcluidas={getModuloProgress(modulo.id).concluidas}
                              className="mt-2"
                            />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="ml-4 space-y-1 pb-2">
                            {modulo.aulas?.map((aula) => {
                              const isConcluida = isAulaConcluida(aula.id);
                              const isSelected = selectedAula?.id === aula.id;
                              const isDesbloqueada = isAulaDesbloqueada(aula.id);

                              return (
                                <button
                                  key={aula.id}
                                  onClick={() => handleSelecionarAula(aula)}
                                  disabled={!isDesbloqueada}
                                  className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                                    isSelected 
                                      ? 'bg-primary/10 text-primary' 
                                      : isDesbloqueada
                                        ? 'hover:bg-muted/50'
                                        : 'opacity-50 cursor-not-allowed'
                                  }`}
                                >
                                  {isConcluida ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  ) : isDesbloqueada ? (
                                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  ) : (
                                    <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{aula.titulo}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {aula.duracao ? `${Math.floor(aula.duracao / 60)}min` : 'N/A'}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
