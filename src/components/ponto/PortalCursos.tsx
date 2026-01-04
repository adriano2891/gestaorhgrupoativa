import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  GraduationCap, 
  BookOpen, 
  Award, 
  Search,
  Play,
  Clock,
  CheckCircle,
  Star,
  Filter
} from "lucide-react";
import { 
  useCursos, 
  useMinhasMatriculas, 
  useMeusCertificados,
  useMatriculaMutations,
  useCategoriasCurso
} from "@/hooks/useCursos";
import { CursoCard } from "@/components/cursos/CursoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Curso } from "@/types/cursos";
import { PortalBackground } from "./PortalBackground";

interface PortalCursosProps {
  onBack: () => void;
}

export const PortalCursos = ({ onBack }: PortalCursosProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("catalogo");

  const { data: cursos, isLoading: loadingCursos } = useCursos("publicado");
  const { data: minhasMatriculas, isLoading: loadingMatriculas } = useMinhasMatriculas();
  const { data: meusCertificados, isLoading: loadingCertificados } = useMeusCertificados();
  const { data: categorias } = useCategoriasCurso();
  const { matricular } = useMatriculaMutations();

  const cursosMatriculados = minhasMatriculas?.map(m => m.curso_id) || [];
  
  const cursosDisponiveis = cursos?.filter(curso => 
    !cursosMatriculados.includes(curso.id) &&
    (search === "" || curso.titulo.toLowerCase().includes(search.toLowerCase())) &&
    (categoriaFilter === "all" || curso.categoria_id === categoriaFilter)
  );

  const meusProgressos = minhasMatriculas?.filter(m => m.status !== 'concluido') || [];
  const meusConcluidos = minhasMatriculas?.filter(m => m.status === 'concluido') || [];

  const handleIniciarCurso = async (cursoId: string) => {
    await matricular.mutateAsync(cursoId);
    setActiveTab("meus-cursos");
  };

  const handleContinuarCurso = (cursoId: string) => {
    // Navegar para a página do player do curso
    navigate(`/portal-funcionario/cursos/${cursoId}`);
  };

  return (
    <PortalBackground>
      {/* Header */}
      <header className="bg-card border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-2 text-primary">
              <GraduationCap className="h-6 w-6" />
              <span className="font-semibold">Meus Cursos</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="catalogo" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Catálogo</span>
            </TabsTrigger>
            <TabsTrigger value="meus-cursos" className="gap-2">
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Meus Cursos</span>
              {meusProgressos.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {meusProgressos.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="certificados" className="gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Certificados</span>
            </TabsTrigger>
          </TabsList>

          {/* Catálogo de Cursos */}
          <TabsContent value="catalogo" className="space-y-6">
            {/* Filtros */}
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

            {/* Grid de cursos */}
            {loadingCursos ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-lg" />
                ))}
              </div>
            ) : cursosDisponiveis && cursosDisponiveis.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cursosDisponiveis.map(curso => (
                  <CursoCard
                    key={curso.id}
                    curso={curso}
                    onIniciar={() => handleIniciarCurso(curso.id)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum curso disponível</h3>
                  <p className="text-muted-foreground">
                    {search || categoriaFilter !== "all"
                      ? "Tente ajustar os filtros de busca"
                      : "Não há cursos disponíveis no momento"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Meus Cursos */}
          <TabsContent value="meus-cursos" className="space-y-6">
            {loadingMatriculas ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-lg" />
                ))}
              </div>
            ) : minhasMatriculas && minhasMatriculas.length > 0 ? (
              <>
                {/* Em andamento */}
                {meusProgressos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Em Andamento
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {meusProgressos.map(matricula => matricula.curso && (
                        <CursoCard
                          key={matricula.id}
                          curso={matricula.curso}
                          matricula={matricula}
                          onContinuar={() => handleContinuarCurso(matricula.curso_id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Concluídos */}
                {meusConcluidos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Concluídos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {meusConcluidos.map(matricula => matricula.curso && (
                        <CursoCard
                          key={matricula.id}
                          curso={matricula.curso}
                          matricula={matricula}
                          onContinuar={() => handleContinuarCurso(matricula.curso_id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Você ainda não está matriculado</h3>
                  <p className="text-muted-foreground mb-4">
                    Explore o catálogo e comece um curso hoje!
                  </p>
                  <Button onClick={() => setActiveTab("catalogo")}>
                    Ver Catálogo
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Certificados */}
          <TabsContent value="certificados" className="space-y-6">
            {loadingCertificados ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-lg" />
                ))}
              </div>
            ) : meusCertificados && meusCertificados.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meusCertificados.map(cert => (
                  <Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-24 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 flex items-center justify-center">
                      <Award className="h-12 w-12 text-white" />
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-1">{cert.curso?.titulo}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Emitido em {format(new Date(cert.data_emissao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {cert.codigo_validacao}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum certificado ainda</h3>
                  <p className="text-muted-foreground mb-4">
                    Complete cursos para receber seus certificados
                  </p>
                  <Button onClick={() => setActiveTab("catalogo")}>
                    Explorar Cursos
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </PortalBackground>
  );
};
