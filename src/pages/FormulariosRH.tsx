import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Upload, LayoutTemplate, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormulariosRH } from "@/hooks/useFormulariosRH";
import { FormularioCard } from "@/components/formularios/FormularioCard";
import { CriarFormularioDialog } from "@/components/formularios/CriarFormularioDialog";
import { UploadFormularioDialog } from "@/components/formularios/UploadFormularioDialog";
import { CATEGORY_LABELS, STATUS_LABELS, type FormCategory, type FormStatus } from "@/types/formularios";
import { Skeleton } from "@/components/ui/skeleton";
import { Layout } from "@/components/Layout";

const FormulariosRH = () => {
  const navigate = useNavigate();
  const { data: formularios, isLoading, error, refetch } = useFormulariosRH();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<FormCategory | "todos">("todos");
  const [statusFilter, setStatusFilter] = useState<FormStatus | "todos">("todos");
  const [showCriarDialog, setShowCriarDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const filteredFormularios = formularios?.filter((form) => {
    const matchesSearch = form.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "todos" || form.categoria === categoryFilter;
    const matchesStatus = statusFilter === "todos" || form.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const templates = filteredFormularios?.filter(f => f.is_template);
  const formulariosList = filteredFormularios?.filter(f => !f.is_template);

  return (
    <Layout>
      <div className="space-y-6" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton to="/gestao-rh" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Formulários de RH</h1>
              <p className="text-sm text-muted-foreground">Gerencie formulários de gestão de pessoas</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Externo
            </Button>
            <Button onClick={() => setShowCriarDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Formulário
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar formulários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as FormCategory | "todos")}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas Categorias</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FormStatus | "todos")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        <Tabs defaultValue="formularios" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="formularios" className="gap-2">
              <FileText className="h-4 w-4" />
              Formulários ({formulariosList?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <LayoutTemplate className="h-4 w-4" />
              Templates ({templates?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="formularios">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-destructive">Erro ao carregar formulários</h3>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>Tentar novamente</Button>
              </div>
            ) : formulariosList?.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">Nenhum formulário encontrado</h3>
                <p className="text-sm text-muted-foreground mt-1">Crie seu primeiro formulário clicando no botão acima</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formulariosList?.map((form) => (
                  <FormularioCard key={form.id} formulario={form} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : templates?.length === 0 ? (
              <div className="text-center py-12">
                <LayoutTemplate className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">Nenhum template encontrado</h3>
                <p className="text-sm text-muted-foreground mt-1">Crie templates para reutilizar formulários</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates?.map((form) => (
                  <FormularioCard key={form.id} formulario={form} isTemplate />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <CriarFormularioDialog open={showCriarDialog} onOpenChange={setShowCriarDialog} />
        <UploadFormularioDialog open={showUploadDialog} onOpenChange={setShowUploadDialog} />
      </div>
    </Layout>
  );
};

export default FormulariosRH;
