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
  Filter,
  Upload,
  FileText
} from "lucide-react";
import { useCursos, useCursosStats, useCategoriasCurso, useCursoMutations, useMatriculas } from "@/hooks/useCursos";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { CursoCard } from "@/components/cursos/CursoCard";
import { CursoFormDialog } from "@/components/cursos/CursoFormDialog";
import { CursoDetalhesDialog } from "@/components/cursos/CursoDetalhesDialog";
import { MatriculasDialog } from "@/components/cursos/MatriculasDialog";
import { RelatoriosCursosDialog } from "@/components/cursos/RelatoriosCursosDialog";
import { UploadCertificadoDialog } from "@/components/cursos/UploadCertificadoDialog";
import { GerenciarConteudoCursoDialog } from "@/components/cursos/GerenciarConteudoCursoDialog";
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
  const [cursoGerenciar, setCursoGerenciar] = useState<Curso | null>(null);
  const [relatoriosOpen, setRelatoriosOpen] = useState(false);
  const [uploadCertOpen, setUploadCertOpen] = useState(false);

  const { data: cursos, isLoading } = useCursos();
  const { data: stats } = useCursosStats();
  const { data: categorias } = useCategoriasCurso();
  const { data: funcionarios } = useFuncionarios();
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
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <BackButton to="/gestao-rh" />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-primary flex-shrink-0" />
                  <span className="truncate">Gestão de Cursos</span>
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm">Crie e gerencie treinamentos corporativos</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setRelatoriosOpen(true)} className="gap-2 flex-1 sm:flex-none">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Relatórios</span>
              </Button>
              <Button variant="outline" onClick={() => setUploadCertOpen(true)} className="gap-2 flex-1 sm:flex-none">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Certificado</span>
              </Button>
              <Button onClick={() => setCursoFormOpen(true)} className="gap-2 flex-1 sm:flex-none">
                <Plus className="h-4 w-4" />
                Novo Curso
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards - Apenas conclusão total (100%) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-primary/20 rounded-lg flex-shrink-0">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{stats?.totalCursos || 0}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Total de Cursos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-500/20 rounded-lg flex-shrink-0">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{stats?.cursosPublicados || 0}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Publicados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{stats?.totalMatriculas || 0}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Matrículas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{stats?.matriculasConcluidas || 0}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Concluídos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{stats?.taxaConclusao || 0}%</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Taxa Conclusão</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cursos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="flex-1 sm:flex-none sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="publicado">Publicado</SelectItem>
                    <SelectItem value="arquivado">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                  <SelectTrigger className="flex-1 sm:flex-none sm:w-[200px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categorias?.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 sm:h-64 rounded-lg" />
            ))}
          </div>
        ) : filteredCursos && filteredCursos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {filteredCursos.map(curso => (
              <CursoCard
                key={curso.id}
                curso={curso}
                isAdmin
                onView={() => setCursoDetalhes(curso)}
                onEdit={() => setCursoEditar(curso)}
                onViewMatriculas={() => setCursoMatriculas(curso)}
                onGerenciarConteudo={() => setCursoGerenciar(curso)}
                onDelete={() => handleDeleteCurso(curso.id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 sm:py-16 text-center">
              <GraduationCap className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground/50 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-2">Nenhum curso encontrado</h3>
              <p className="text-muted-foreground text-sm sm:text-base mb-4">
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
        {cursoGerenciar && (
          <GerenciarConteudoCursoDialog
            open={!!cursoGerenciar}
            onOpenChange={(open) => !open && setCursoGerenciar(null)}
            cursoId={cursoGerenciar.id}
          />
        )}

        {/* Relatórios Dialog */}
        <RelatoriosCursosDialog
          open={relatoriosOpen}
          onOpenChange={setRelatoriosOpen}
        />

        {/* Upload Certificado Dialog */}
        <UploadCertificadoDialog
          open={uploadCertOpen}
          onOpenChange={setUploadCertOpen}
          cursos={cursos || []}
          funcionarios={funcionarios?.map(f => ({ id: f.id, nome: f.nome, email: f.email })) || []}
        />
      </div>
    </Layout>
  );
};

export default CursosAdmin;
