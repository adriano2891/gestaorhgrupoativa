import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Clock, 
  Users, 
  Eye, 
  Edit, 
  Play,
  Award,
  Star,
  Lock
} from "lucide-react";
import type { Curso, Matricula } from "@/types/cursos";
import { NIVEL_LABELS, NIVEL_COLORS, STATUS_LABELS, STATUS_COLORS } from "@/types/cursos";

interface CursoCardProps {
  curso: Curso;
  isAdmin?: boolean;
  matricula?: Matricula;
  onView?: () => void;
  onEdit?: () => void;
  onViewMatriculas?: () => void;
  onIniciar?: () => void;
  onContinuar?: () => void;
}

export const CursoCard = ({
  curso,
  isAdmin,
  matricula,
  onView,
  onEdit,
  onViewMatriculas,
  onIniciar,
  onContinuar,
}: CursoCardProps) => {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const isMatriculado = !!matricula;
  const progresso = matricula?.progresso || 0;
  const isConcluido = matricula?.status === 'concluido';

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
      {/* Cover Image */}
      <div className="relative h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
        {curso.capa_url ? (
          <img 
            src={curso.capa_url} 
            alt={curso.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-primary/30" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {isAdmin && (
            <Badge className={STATUS_COLORS[curso.status]}>
              {STATUS_LABELS[curso.status]}
            </Badge>
          )}
          <Badge className={NIVEL_COLORS[curso.nivel]}>
            {NIVEL_LABELS[curso.nivel]}
          </Badge>
          {curso.obrigatorio && (
            <Badge variant="destructive" className="gap-1">
              <Lock className="h-3 w-3" />
              Obrigatório
            </Badge>
          )}
        </div>

        {/* Category Badge */}
        {curso.categoria && (
          <Badge 
            className="absolute top-3 right-3"
            style={{ backgroundColor: curso.categoria.cor, color: 'white' }}
          >
            {curso.categoria.nome}
          </Badge>
        )}

        {/* Progress Overlay for enrolled courses */}
        {isMatriculado && !isAdmin && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <div className="flex items-center justify-between text-white text-sm mb-1">
              <span>{progresso}% concluído</span>
              {isConcluido && <Award className="h-4 w-4 text-yellow-400" />}
            </div>
            <Progress value={progresso} className="h-1.5 bg-white/30" />
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {curso.titulo}
        </h3>
        {curso.descricao && (
          <p className="text-sm text-muted-foreground line-clamp-2">{curso.descricao}</p>
        )}
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(curso.carga_horaria)}</span>
          </div>
          {curso.instrutor && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="truncate max-w-[100px]">{curso.instrutor}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 gap-2">
        {isAdmin ? (
          <>
            <Button variant="outline" size="sm" className="flex-1" onClick={onView}>
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button variant="ghost" size="sm" onClick={onViewMatriculas}>
              <Users className="h-4 w-4" />
            </Button>
          </>
        ) : isMatriculado ? (
          <Button className="w-full gap-2" onClick={onContinuar}>
            <Play className="h-4 w-4" />
            {isConcluido ? 'Revisar Curso' : 'Continuar'}
          </Button>
        ) : (
          <Button className="w-full gap-2" onClick={onIniciar}>
            <Play className="h-4 w-4" />
            Iniciar Curso
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
