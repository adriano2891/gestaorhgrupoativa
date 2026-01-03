import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  Play, 
  Pause,
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  Award,
  Volume2,
  VolumeX,
  Maximize,
  Settings
} from "lucide-react";
import { useCurso, useProgressoAulas, useProgressoMutations } from "@/hooks/useCursos";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Aula } from "@/types/cursos";

interface CursoPlayerProps {
  onBack: () => void;
}

export const CursoPlayer = ({ onBack }: CursoPlayerProps) => {
  const { cursoId } = useParams<{ cursoId: string }>();
  const { data: curso, isLoading } = useCurso(cursoId);
  const { data: progressoAulas } = useProgressoAulas(cursoId);
  const { updateProgresso } = useProgressoMutations();

  const [selectedAula, setSelectedAula] = useState<Aula | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expandedModulos, setExpandedModulos] = useState<Set<string>>(new Set());
  
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && selectedAula) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      
      // Salvar progresso a cada 10 segundos
      if (Math.floor(time) % 10 === 0) {
        updateProgresso.mutate({
          aula_id: selectedAula.id,
          tempo_assistido: Math.floor(time),
          posicao_video: Math.floor(time),
        });
      }
    }
  };

  const handleVideoEnded = () => {
    if (selectedAula) {
      updateProgresso.mutate({
        aula_id: selectedAula.id,
        concluida: true,
        data_conclusao: new Date().toISOString(),
        tempo_assistido: duration,
      });
      setIsPlaying(false);
      
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            <Button className="mt-4" onClick={onBack}>
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
              <Button variant="ghost" size="sm" onClick={onBack}>
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
            {/* Player */}
            <Card className="overflow-hidden bg-black">
              <div className="relative aspect-video">
                {selectedAula?.video_url ? (
                  <video
                    ref={videoRef}
                    src={selectedAula.video_url}
                    className="w-full h-full object-contain"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                    onEnded={handleVideoEnded}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    muted={isMuted}
                    playsInline
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <Play className="h-16 w-16 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground">
                        {selectedAula ? "Vídeo não disponível" : "Selecione uma aula"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Controles customizados */}
                {selectedAula?.video_url && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    {/* Barra de progresso */}
                    <div className="mb-2">
                      <input
                        type="range"
                        min={0}
                        max={duration}
                        value={currentTime}
                        onChange={(e) => {
                          const time = Number(e.target.value);
                          if (videoRef.current) {
                            videoRef.current.currentTime = time;
                          }
                          setCurrentTime(time);
                        }}
                        className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button size="icon" variant="ghost" onClick={handlePlayPause} className="text-white hover:bg-white/20">
                          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setIsMuted(!isMuted)} className="text-white hover:bg-white/20">
                          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        </Button>
                        <span className="text-white text-sm">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                              <Settings className="h-4 w-4 mr-1" />
                              {playbackSpeed}x
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                              <DropdownMenuItem
                                key={speed}
                                onClick={() => {
                                  setPlaybackSpeed(speed);
                                  if (videoRef.current) {
                                    videoRef.current.playbackRate = speed;
                                  }
                                }}
                              >
                                {speed}x
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" onClick={() => videoRef.current?.requestFullscreen()}>
                          <Maximize className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

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
                                      {Math.floor(aula.duracao / 60)}min
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
