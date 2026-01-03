import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useCurso, useProgressoAulas, useProgressoMutations } from "@/hooks/useCursos";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { VideoPlayer } from "@/components/cursos/VideoPlayer";
import type { Aula } from "@/types/cursos";

export const PortalCursoPlayer = () => {
  const { cursoId } = useParams<{ cursoId: string }>();
  const navigate = useNavigate();
  const { data: curso, isLoading } = useCurso(cursoId);
  const { data: progressoAulas } = useProgressoAulas(cursoId);
  const { updateProgresso } = useProgressoMutations();

  const [selectedAula, setSelectedAula] = useState<Aula | null>(null);
  const [expandedModulos, setExpandedModulos] = useState<Set<string>>(new Set());
  const [lastSavedTime, setLastSavedTime] = useState(0);

  // Selecionar primeira aula não concluída ao carregar
  useEffect(() => {
    if (curso?.modulos && !selectedAula) {
      for (const modulo of curso.modulos) {
        if (modulo.aulas) {
          for (const aula of modulo.aulas) {
            const progresso = progressoAulas?.find(p => p.aula_id === aula.id);
            if (!progresso?.concluida) {
              setSelectedAula(aula);
              setExpandedModulos(new Set([modulo.id]));
              return;
            }
          }
        }
      }
      // Se todas concluídas, seleciona a primeira
      if (curso.modulos[0]?.aulas?.[0]) {
        setSelectedAula(curso.modulos[0].aulas[0]);
        setExpandedModulos(new Set([curso.modulos[0].id]));
      }
    }
  }, [curso, progressoAulas, selectedAula]);

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

  const getProgressoCurso = () => {
    if (!curso?.modulos || !progressoAulas) return 0;
    
    let totalAulas = 0;
    let aulasConcluidas = 0;
    
    curso.modulos.forEach(modulo => {
      modulo.aulas?.forEach(aula => {
        totalAulas++;
        if (isAulaConcluida(aula.id)) {
          aulasConcluidas++;
        }
      });
    });
    
    return totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0;
  };

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

  const handleVideoEnded = () => {
    if (selectedAula) {
      updateProgresso.mutate({
        aula_id: selectedAula.id,
        concluida: true,
        data_conclusao: new Date().toISOString(),
      });
      
      // Avançar para próxima aula
      if (curso?.modulos) {
        let foundCurrent = false;
        for (const modulo of curso.modulos) {
          if (modulo.aulas) {
            for (const aula of modulo.aulas) {
              if (foundCurrent) {
                setSelectedAula(aula);
                setExpandedModulos(prev => new Set([...prev, modulo.id]));
                return;
              }
              if (aula.id === selectedAula.id) {
                foundCurrent = true;
              }
            }
          }
        }
      }
    }
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
              <div className="text-sm text-muted-foreground">
                {progressoCurso}% concluído
              </div>
              <Progress value={progressoCurso} className="w-24 h-2" />
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
            />

            {/* Info da aula atual */}
            {selectedAula && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{selectedAula.titulo}</CardTitle>
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
                          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
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
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="ml-4 space-y-1 pb-2">
                            {modulo.aulas?.map((aula) => {
                              const isConcluida = isAulaConcluida(aula.id);
                              const isSelected = selectedAula?.id === aula.id;

                              return (
                                <button
                                  key={aula.id}
                                  onClick={() => setSelectedAula(aula)}
                                  className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                                    isSelected 
                                      ? 'bg-primary/10 text-primary' 
                                      : 'hover:bg-muted/50'
                                  }`}
                                >
                                  {isConcluida ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
