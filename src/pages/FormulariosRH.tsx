import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, FileText, Upload, LayoutTemplate, Search, Filter, 
  Sparkles, FolderOpen, Eye, Edit, Trash2, Copy, Users, 
  ExternalLink, MoreVertical, Wand2, Loader2, Check,
  Star, Clock
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Layout } from "@/components/Layout";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFormulariosRH, useDeleteFormulario, useCreateFormulario } from "@/hooks/useFormulariosRH";
import { CriarFormularioDialog } from "@/components/formularios/CriarFormularioDialog";
import { UploadFormularioDialog } from "@/components/formularios/UploadFormularioDialog";
import { AtribuirFormularioDialog } from "@/components/formularios/AtribuirFormularioDialog";
import { CATEGORY_LABELS, STATUS_LABELS, type FormCategory, type FormStatus, type FormularioRH } from "@/types/formularios";
import { HR_TEMPLATES } from "@/constants/hrflow-templates";
import { CATEGORY_LABELS as HRFLOW_CATEGORY_LABELS, CATEGORY_COLORS, type FormCategory as HRFlowCategory } from "@/types/hrflow";
import { HRFlowFormBuilder } from "@/components/hrflow/HRFlowFormBuilder";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoAtiva from "@/assets/logo-ativa.png";

type ActiveSection = 'formularios' | 'criar' | 'templates' | 'ia' | 'upload';

const statusColors: Record<string, string> = {
  rascunho: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  pendente_aprovacao: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  aprovado: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  publicado: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  arquivado: "bg-muted text-muted-foreground border-border",
};

const sectionItems = [
  { id: 'formularios' as ActiveSection, label: 'Meus Formulários', icon: FolderOpen },
  { id: 'criar' as ActiveSection, label: 'Criar Formulário', icon: Plus },
  { id: 'templates' as ActiveSection, label: 'Templates', icon: LayoutTemplate },
  { id: 'ia' as ActiveSection, label: 'Gerar com IA', icon: Sparkles },
  { id: 'upload' as ActiveSection, label: 'Upload de Modelo', icon: Upload },
];

const FormulariosRH = () => {
  const navigate = useNavigate();
  const { data: formularios, isLoading, error, refetch } = useFormulariosRH();
  const deleteFormulario = useDeleteFormulario();
  const createFormulario = useCreateFormulario();

  const [activeSection, setActiveSection] = useState<ActiveSection>('formularios');
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<FormCategory | "todos">("todos");
  const [statusFilter, setStatusFilter] = useState<FormStatus | "todos">("todos");
  const [showCriarDialog, setShowCriarDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);
  const [atribuirFormId, setAtribuirFormId] = useState<string | null>(null);

  // Templates state
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategory, setTemplateCategory] = useState<string>("todos");
  const [selectedTemplate, setSelectedTemplate] = useState<typeof HR_TEMPLATES[0] | null>(null);

  // AI state
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedForm, setGeneratedForm] = useState<any>(null);

  const filteredFormularios = formularios?.filter((form) => {
    const matchesSearch = form.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "todos" || form.categoria === categoryFilter;
    const matchesStatus = statusFilter === "todos" || form.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredTemplates = HR_TEMPLATES.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
      template.description.toLowerCase().includes(templateSearch.toLowerCase());
    const matchesCategory = templateCategory === "todos" || template.category === templateCategory;
    return matchesSearch && matchesCategory;
  });

  const popularTemplates = HR_TEMPLATES.filter(t => t.popular);

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.FileText;
    return Icon;
  };

  const handleDelete = async () => {
    if (!deleteFormId) return;
    try {
      await deleteFormulario.mutateAsync(deleteFormId);
      setDeleteFormId(null);
    } catch {}
  };

  const handleDuplicate = async (form: FormularioRH) => {
    try {
      await createFormulario.mutateAsync({
        titulo: `${form.titulo} (Cópia)`,
        descricao: form.descricao || undefined,
        categoria: form.categoria,
        template_origem_id: form.template_origem_id || undefined,
        departamento_destino: form.departamento_destino || undefined,
        requer_assinatura: form.requer_assinatura,
      });
    } catch {}
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Digite uma descrição para o formulário");
      return;
    }
    setIsGenerating(true);
    setGeneratedForm(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-hrflow-form', {
        body: { prompt: aiPrompt }
      });
      if (error) throw error;
      if (data?.form) {
        setGeneratedForm(data.form);
        toast.success("Formulário gerado com sucesso!");
      }
    } catch (err: any) {
      console.error("Error generating form:", err);
      toast.error("Erro ao gerar formulário. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseAIForm = async () => {
    if (!generatedForm) return;
    try {
      const result = await createFormulario.mutateAsync({
        titulo: generatedForm.title,
        descricao: generatedForm.description,
        categoria: 'outro',
      });
      toast.success("Formulário criado a partir da IA!");
      navigate(`/formularios-rh/${result.id}`);
    } catch {}
  };

  const examplePrompts = [
    "Pesquisa de satisfação pós-treinamento",
    "Avaliação de desempenho trimestral",
    "Checklist de onboarding para TI",
    "Entrevista de desligamento",
    "Pesquisa de clima organizacional"
  ];

  if (selectedTemplate) {
    return (
      <Layout>
        <HRFlowFormBuilder 
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)} 
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header with Logo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BackButton to="/gestao-rh" />
            
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Formulários</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Crie, gerencie e compartilhe formulários de RH</p>
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 rh-module-scrollbar">
          {sectionItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Content Sections */}
        <div className="animate-fade-in">
          {/* ===== MEUS FORMULÁRIOS ===== */}
          {activeSection === 'formularios' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative sm:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar formulários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas Categorias</SelectItem>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger>
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

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total', value: formularios?.length || 0, color: 'bg-primary/10 text-primary' },
                  { label: 'Publicados', value: formularios?.filter(f => f.status === 'publicado').length || 0, color: 'bg-emerald-500/10 text-emerald-700' },
                  { label: 'Rascunhos', value: formularios?.filter(f => f.status === 'rascunho').length || 0, color: 'bg-amber-500/10 text-amber-700' },
                  { label: 'Templates', value: formularios?.filter(f => f.is_template).length || 0, color: 'bg-blue-500/10 text-blue-700' },
                ].map((stat) => (
                  <Card key={stat.label} className="border-border/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`text-2xl font-bold ${stat.color} px-3 py-1 rounded-lg`}>
                        {stat.value}
                      </div>
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Forms Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-52 rounded-xl" />
                  ))}
                </div>
              ) : error ? (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium text-destructive">Erro ao carregar formulários</h3>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>Tentar novamente</Button>
                  </CardContent>
                </Card>
              ) : filteredFormularios?.length === 0 ? (
                <Card className="py-12 border-dashed border-2">
                  <CardContent className="text-center">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">Nenhum formulário encontrado</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">Comece criando seu primeiro formulário</p>
                    <Button onClick={() => setActiveSection('criar')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Formulário
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFormularios?.map((form) => (
                    <Card key={form.id} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 overflow-hidden">
                      {/* Color strip */}
                      <div className="h-1 bg-gradient-to-r from-primary to-accent" />
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                              {form.is_template ? (
                                <LayoutTemplate className="h-5 w-5 text-primary" />
                              ) : form.arquivo_externo_url ? (
                                <ExternalLink className="h-5 w-5 text-primary" />
                              ) : (
                                <FileText className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground truncate text-sm">{form.titulo}</h3>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(form.created_at), "dd MMM yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/formularios-rh/${form.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/formularios-rh/${form.id}`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(form)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setAtribuirFormId(form.id)}>
                                <Users className="h-4 w-4 mr-2" />
                                Atribuir
                              </DropdownMenuItem>
                              {form.arquivo_externo_url && (
                                <DropdownMenuItem onClick={() => window.open(form.arquivo_externo_url!, '_blank')}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Abrir Arquivo
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onSelect={(e) => { e.preventDefault(); setDeleteFormId(form.id); }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {form.descricao && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{form.descricao}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <Badge variant="outline" className={`text-[10px] ${statusColors[form.status]}`}>
                            {STATUS_LABELS[form.status]}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {CATEGORY_LABELS[form.categoria]}
                          </Badge>
                          {form.is_template && (
                            <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">
                              Template
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="text-xs h-8 flex-1" onClick={() => navigate(`/formularios-rh/${form.id}`)}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Ver
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs h-8 flex-1" onClick={() => navigate(`/formularios-rh/${form.id}`)}>
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== CRIAR FORMULÁRIO ===== */}
          {activeSection === 'criar' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <Card className="border-border/50 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary to-accent" />
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Criar Novo Formulário</CardTitle>
                      <CardDescription>Crie um formulário do zero ou a partir de um template existente</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card 
                      className="border-2 border-dashed hover:border-primary/50 cursor-pointer transition-all hover:shadow-md group"
                      onClick={() => setShowCriarDialog(true)}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-14 h-14 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <FileText className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">Formulário em Branco</h3>
                        <p className="text-xs text-muted-foreground">Comece do zero com campos personalizados</p>
                      </CardContent>
                    </Card>
                    <Card 
                      className="border-2 border-dashed hover:border-primary/50 cursor-pointer transition-all hover:shadow-md group"
                      onClick={() => setActiveSection('templates')}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-14 h-14 mx-auto bg-accent/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <LayoutTemplate className="h-7 w-7 text-accent" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">A partir de Template</h3>
                        <p className="text-xs text-muted-foreground">Escolha entre +20 modelos prontos</p>
                      </CardContent>
                    </Card>
                    <Card 
                      className="border-2 border-dashed hover:border-primary/50 cursor-pointer transition-all hover:shadow-md group"
                      onClick={() => setActiveSection('ia')}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-14 h-14 mx-auto bg-amber-500/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Sparkles className="h-7 w-7 text-amber-600" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">Gerar com IA</h3>
                        <p className="text-xs text-muted-foreground">Descreva e a IA cria para você</p>
                      </CardContent>
                    </Card>
                    <Card 
                      className="border-2 border-dashed hover:border-primary/50 cursor-pointer transition-all hover:shadow-md group"
                      onClick={() => setShowUploadDialog(true)}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-14 h-14 mx-auto bg-blue-500/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Upload className="h-7 w-7 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">Upload de Modelo</h3>
                        <p className="text-xs text-muted-foreground">Importe PDF, Word ou Excel</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== TEMPLATES ===== */}
          {activeSection === 'templates' && (
            <div className="space-y-6">
              {/* Popular */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  Templates Populares
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {popularTemplates.map((template) => {
                    const Icon = getIcon(template.icon);
                    return (
                      <Card 
                        key={template.id} 
                        className="border-border/50 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className="h-1 bg-gradient-to-r from-primary to-accent" />
                        <CardContent className="p-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Icon className="w-6 h-6 text-primary-foreground" />
                          </div>
                          <h3 className="font-semibold text-foreground mb-1 line-clamp-1 text-sm">{template.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{template.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge className={CATEGORY_COLORS[template.category as HRFlowCategory]} variant="secondary">
                              {HRFLOW_CATEGORY_LABELS[template.category as HRFlowCategory]}
                            </Badge>
                            {template.estimatedTime && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {template.estimatedTime}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar templates..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={templateCategory} onValueChange={setTemplateCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas Categorias</SelectItem>
                    {Object.entries(HRFLOW_CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* All Templates */}
              <div>
                <h2 className="text-base font-semibold text-foreground mb-4">
                  Todos os Templates ({filteredTemplates.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => {
                    const Icon = getIcon(template.icon);
                    return (
                      <Card 
                        key={template.id} 
                        className="border-border/50 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                              <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground line-clamp-1 text-sm">{template.title}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{template.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-[10px]">
                                  {template.fields.length} campos
                                </Badge>
                                {template.estimatedTime && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {template.estimatedTime}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===== GERAR COM IA ===== */}
          {activeSection === 'ia' && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Hero */}
              <Card className="border-0 overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold">Criar com IA</h2>
                  </div>
                  <p className="text-amber-100 text-sm">
                    Descreva o formulário que precisa e a IA gera a estrutura completa automaticamente
                  </p>
                </CardContent>
              </Card>

              {/* Prompt */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Descreva seu formulário</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Ex: Crie uma pesquisa de satisfação para avaliar o treinamento de liderança, incluindo perguntas sobre conteúdo, instrutor e aplicabilidade..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="min-h-28 resize-none"
                  />
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Sugestões rápidas:</p>
                    <div className="flex flex-wrap gap-2">
                      {examplePrompts.map((example, i) => (
                        <button
                          key={i}
                          onClick={() => setAiPrompt(example)}
                          className="text-xs px-3 py-1.5 bg-muted hover:bg-muted-foreground/10 text-muted-foreground rounded-full transition-colors"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button 
                    onClick={handleAIGenerate} 
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  >
                    {isGenerating ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando formulário...</>
                    ) : (
                      <><Wand2 className="w-4 h-4 mr-2" />Gerar Formulário com IA</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Loading */}
              {isGenerating && (
                <Card className="border-border/50">
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center animate-pulse">
                        <Sparkles className="w-8 h-8 text-amber-600" />
                      </div>
                      <p className="text-muted-foreground">A IA está criando seu formulário...</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Generated Preview */}
              {generatedForm && (
                <Card className="border-border/50 overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Formulário Gerado</CardTitle>
                      <Button size="sm" onClick={handleUseAIForm}>
                        <FileText className="w-4 h-4 mr-1" />
                        Criar no Sistema
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <h3 className="font-semibold text-foreground">{generatedForm.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{generatedForm.description}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        Campos gerados ({generatedForm.fields?.length || 0})
                      </p>
                      {generatedForm.fields?.map((field: any, index: number) => (
                        <div key={field.id || index} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                          <span className="w-6 h-6 bg-primary text-primary-foreground rounded text-xs flex items-center justify-center font-medium shrink-0">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{field.label}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className="text-[10px]">{field.type}</Badge>
                              {field.required && (
                                <Badge className="bg-destructive/10 text-destructive text-[10px]">Obrigatório</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ===== UPLOAD DE MODELO ===== */}
          {activeSection === 'upload' && (
            <div className="max-w-2xl mx-auto">
              <Card className="border-border/50 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600" />
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-500/10">
                      <Upload className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Upload de Modelo</CardTitle>
                      <CardDescription>
                        Importe formulários prontos em PDF, Word ou Excel para gerenciá-los no sistema
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setShowUploadDialog(true)} className="w-full" size="lg">
                    <Upload className="h-5 w-5 mr-2" />
                    Selecionar Arquivo para Upload
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Formatos aceitos: PDF, Word (.doc, .docx) e Excel (.xls, .xlsx) — Máximo 10MB
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Dialogs */}
        <CriarFormularioDialog open={showCriarDialog} onOpenChange={setShowCriarDialog} />
        <UploadFormularioDialog open={showUploadDialog} onOpenChange={setShowUploadDialog} />
        
        {atribuirFormId && (
          <AtribuirFormularioDialog
            open={!!atribuirFormId}
            onOpenChange={(open) => !open && setAtribuirFormId(null)}
            formularioId={atribuirFormId}
          />
        )}

        <AlertDialog open={!!deleteFormId} onOpenChange={(open) => !open && setDeleteFormId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir formulário?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O formulário e todos os seus dados serão permanentemente excluídos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default FormulariosRH;
