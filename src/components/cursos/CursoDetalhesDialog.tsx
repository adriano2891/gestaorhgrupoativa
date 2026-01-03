import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Upload
} from "lucide-react";
import { useCurso, useModuloMutations, useAulaMutations } from "@/hooks/useCursos";
import { NIVEL_LABELS, STATUS_LABELS } from "@/types/cursos";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AulaFormDialog } from "./AulaFormDialog";
import { useQueryClient } from "@tanstack/react-query";

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

  const [expandedModulos, setExpandedModulos] = useState<Set<string>>(new Set());
  const [novoModulo, setNovoModulo] = useState({ titulo: "", descricao: "" });
  const [showNovoModulo, setShowNovoModulo] = useState(false);
  const [aulaFormOpen, setAulaFormOpen] = useState(false);
  const [selectedModuloId, setSelectedModuloId] = useState<string | null>(null);
  const [selectedModuloOrdem, setSelectedModuloOrdem] = useState(1);

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
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

        <div className="space-y-4 mt-4">
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
        </div>

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
