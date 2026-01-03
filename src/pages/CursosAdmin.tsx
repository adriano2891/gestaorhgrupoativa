import { useState } from "react";
import { Layout } from "@/components/Layout";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  BookOpen, 
  Users, 
  Award, 
  TrendingUp,
  GraduationCap,
  Clock,
  BarChart3,
  Filter
} from "lucide-react";
import { useCursos, useCursosStats, useCategoriasCurso, useCursoMutations } from "@/hooks/useCursos";
import { CursoCard } from "@/components/cursos/CursoCard";
import { CursoFormDialog } from "@/components/cursos/CursoFormDialog";
import { CursoDetalhesDialog } from "@/components/cursos/CursoDetalhesDialog";
import { MatriculasDialog } from "@/components/cursos/MatriculasDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Curso } from "@/types/cursos";

const CursosAdmin = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [cursoFormOpen, setCursoFormOpen] = useState(false);
  const [cursoDetalhes, setCursoDetalhes] = useState<Curso | null>(null);
  const [cursoMatriculas, setCursoMatriculas] = useState<Curso | null>(null);
  const [cursoEditar, setCursoEditar] = useState<Curso | null>(null);

  const { data: cursos, isLoading } = useCursos();
  const { data: stats } = useCursosStats();
  const { data: categorias } = useCategoriasCurso();
  const { deleteCurso } = useCursoMutations();

  const handleDeleteCurso = (cursoId: string) => {
    deleteCurso.mutate(cursoId);
  };

  const filteredCursos = cursos?.filter(curso => {
    const matchesSearch = curso.titulo.toLowerCase().includes(search.toLowerCase()) ||
                          curso.descricao?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || curso.status === statusFilter;
    const matchesCategoria = categoriaFilter === "all" || curso.categoria_id === categoriaFilter;
    return matchesSearch && matchesStatus && matchesCategoria;
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BackButton to="/gestao-rh" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="h-7 w-7 text-primary" />
                Gestão de Cursos
              </h1>
              <p className="text-muted-foreground">Crie e gerencie treinamentos corporativos</p>
            </div>
          </div>
          <Button onClick={() => setCursoFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Curso
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalCursos || 0}</p>
                  <p className="text-xs text-muted-foreground">Total de Cursos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.cursosPublicados || 0}</p>
                  <p className="text-xs text-muted-foreground">Publicados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalMatriculas || 0}</p>
                  <p className="text-xs text-muted-foreground">Matrículas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.matriculasConcluidas || 0}</p>
                  <p className="text-xs text-muted-foreground">Concluídos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.taxaConclusao || 0}%</p>
                  <p className="text-xs text-muted-foreground">Taxa Conclusão</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cursos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="publicado">Publicado</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categorias?.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : filteredCursos && filteredCursos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCursos.map(curso => (
              <CursoCard
                key={curso.id}
                curso={curso}
                isAdmin
                onView={() => setCursoDetalhes(curso)}
                onEdit={() => setCursoEditar(curso)}
                onViewMatriculas={() => setCursoMatriculas(curso)}
                onDelete={() => handleDeleteCurso(curso.id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum curso encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== "all" || categoriaFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece criando seu primeiro curso"}
              </p>
              {!search && statusFilter === "all" && categoriaFilter === "all" && (
                <Button onClick={() => setCursoFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Curso
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        <CursoFormDialog
          open={cursoFormOpen || !!cursoEditar}
          onOpenChange={(open) => {
            if (!open) {
              setCursoFormOpen(false);
              setCursoEditar(null);
            }
          }}
          curso={cursoEditar}
        />

        {cursoDetalhes && (
          <CursoDetalhesDialog
            open={!!cursoDetalhes}
            onOpenChange={(open) => !open && setCursoDetalhes(null)}
            cursoId={cursoDetalhes.id}
          />
        )}

        {cursoMatriculas && (
          <MatriculasDialog
            open={!!cursoMatriculas}
            onOpenChange={(open) => !open && setCursoMatriculas(null)}
            curso={cursoMatriculas}
          />
        )}
      </div>
    </Layout>
  );
};

export default CursosAdmin;
