import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Users, CheckCircle, Clock, XCircle, ChevronDown, ChevronRight, Award } from "lucide-react";
import { useMatriculas, useProgressoFuncionario } from "@/hooks/useCursos";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EnviarCertificadoDialog } from "./EnviarCertificadoDialog";
import type { Curso, Matricula } from "@/types/cursos";

interface MatriculasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  curso: Curso;
}

// Componente para mostrar detalhes do progresso de um funcionário
const ProgressoDetalhes = ({ cursoId, userId }: { cursoId: string; userId: string }) => {
  const { data: progressoAulas, isLoading } = useProgressoFuncionario(cursoId, userId);

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  if (!progressoAulas || progressoAulas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        Nenhuma aula registrada neste curso.
      </p>
    );
  }

  const aulasCompletas = progressoAulas.filter(a => a.concluida).length;
  const totalAulas = progressoAulas.length;

  return (
    <div className="bg-muted/50 rounded-lg p-3 mt-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">Progresso por aula</span>
        <Badge variant="outline">
          {aulasCompletas}/{totalAulas} aulas
        </Badge>
      </div>
      <div className="space-y-2">
        {progressoAulas.map((aula, index) => (
          <div 
            key={aula.id} 
            className="flex items-center gap-3 text-sm py-1.5 border-b last:border-0"
          >
            <span className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-xs font-medium">
              {index + 1}
            </span>
            {aula.concluida ? (
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            <span className="flex-1 truncate">{aula.titulo}</span>
            {aula.concluida && aula.data_conclusao && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(aula.data_conclusao), "dd/MM HH:mm")}
              </span>
            )}
            {!aula.concluida && aula.tempo_assistido > 0 && (
              <span className="text-xs text-muted-foreground">
                {Math.floor(aula.tempo_assistido / 60)}min assistidos
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const MatriculasDialog = ({ open, onOpenChange, curso }: MatriculasDialogProps) => {
  const { data: matriculas, isLoading } = useMatriculas(curso.id);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [matriculaParaCertificado, setMatriculaParaCertificado] = useState<Matricula | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluido':
        return (
          <Badge className="bg-green-100 text-green-700 gap-1">
            <CheckCircle className="h-3 w-3" />
            Concluído
          </Badge>
        );
      case 'em_andamento':
        return (
          <Badge className="bg-blue-100 text-blue-700 gap-1">
            <Clock className="h-3 w-3" />
            Em Andamento
          </Badge>
        );
      case 'cancelado':
        return (
          <Badge className="bg-red-100 text-red-700 gap-1">
            <XCircle className="h-3 w-3" />
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Estatísticas
  const stats = matriculas ? {
    total: matriculas.length,
    concluidos: matriculas.filter(m => m.status === 'concluido').length,
    emAndamento: matriculas.filter(m => m.status === 'em_andamento').length,
    mediaProgresso: matriculas.length > 0 
      ? Math.round(matriculas.reduce((acc, m) => acc + Number(m.progresso || 0), 0) / matriculas.length)
      : 0
  } : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Matrículas e Progresso - {curso.titulo}
          </DialogTitle>
        </DialogHeader>

        {/* Cards de estatísticas */}
        {stats && stats.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Matriculados</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{stats.concluidos}</p>
              <p className="text-xs text-green-600">Concluídos</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{stats.emAndamento}</p>
              <p className="text-xs text-blue-600">Em Andamento</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-700">{stats.mediaProgresso}%</p>
              <p className="text-xs text-purple-600">Progresso Médio</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : matriculas && matriculas.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Conclusão</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matriculas.map((matricula) => (
                  <>
                    <TableRow 
                      key={matricula.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleRow(matricula.id)}
                    >
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          {expandedRows.has(matricula.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{matricula.profile?.nome || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{matricula.profile?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {matricula.profile?.departamento || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="w-32">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-medium">{Number(matricula.progresso).toFixed(0)}%</span>
                          </div>
                          <Progress 
                            value={Number(matricula.progresso)} 
                            className="h-2"
                          />
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(matricula.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(matricula.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </TableCell>
                      <TableCell>
                        {matricula.data_conclusao ? (
                          <span className="text-sm">
                            {format(new Date(matricula.data_conclusao), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {matricula.status === 'concluido' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-amber-600 border-amber-300 hover:bg-amber-50"
                            onClick={() => setMatriculaParaCertificado(matricula)}
                          >
                            <Award className="h-3 w-3" />
                            Certificado
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(matricula.id) && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/30 p-0">
                          <div className="px-4 py-2">
                            <ProgressoDetalhes 
                              cursoId={curso.id} 
                              userId={matricula.profile?.id || ''} 
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">
              Nenhum funcionário matriculado neste curso ainda.
            </p>
          </div>
        )}

        {/* Dialog de enviar certificado */}
        {matriculaParaCertificado && (
          <EnviarCertificadoDialog
            open={!!matriculaParaCertificado}
            onOpenChange={(open) => !open && setMatriculaParaCertificado(null)}
            matricula={matriculaParaCertificado}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
