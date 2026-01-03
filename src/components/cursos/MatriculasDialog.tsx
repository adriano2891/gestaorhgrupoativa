import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, CheckCircle, Clock, XCircle } from "lucide-react";
import { useMatriculas } from "@/hooks/useCursos";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Curso } from "@/types/cursos";

interface MatriculasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  curso: Curso;
}

export const MatriculasDialog = ({ open, onOpenChange, curso }: MatriculasDialogProps) => {
  const { data: matriculas, isLoading } = useMatriculas(curso.id);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Matrículas - {curso.titulo}
          </DialogTitle>
        </DialogHeader>

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
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Conclusão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matriculas.map((matricula) => (
                  <TableRow key={matricula.id}>
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
                          <span>{Number(matricula.progresso).toFixed(0)}%</span>
                        </div>
                        <Progress value={Number(matricula.progresso)} className="h-2" />
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
                  </TableRow>
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

        {matriculas && matriculas.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t text-sm text-muted-foreground">
            <span>Total de matrículas: {matriculas.length}</span>
            <span>
              Concluídos: {matriculas.filter(m => m.status === 'concluido').length}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
