import { useState } from "react";
import { 
  FileText, 
  LayoutTemplate, 
  Sparkles,
  Settings,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Copy,
  ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { HRFlowFormBuilder } from "@/components/hrflow/HRFlowFormBuilder";
import { HRFlowTemplates } from "@/components/hrflow/HRFlowTemplates";
import { HRFlowAI } from "@/components/hrflow/HRFlowAI";
import { HRFlowSettings } from "@/components/hrflow/HRFlowSettings";
import { HRFlowForm, FormCategory, FormStatus, CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/hrflow";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const mockForms: HRFlowForm[] = [
  {
    id: '1',
    title: 'Pesquisa de Clima 2024',
    description: 'Avaliação anual do clima organizacional',
    category: 'clima',
    status: 'ativo',
    fields: [],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    responsesCount: 45
  },
  {
    id: '2',
    title: 'Avaliação de Desempenho Q1',
    description: 'Avaliação trimestral de performance',
    category: 'desempenho',
    status: 'ativo',
    fields: [],
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18',
    responsesCount: 32
  },
  {
    id: '3',
    title: 'Onboarding - TI',
    description: 'Checklist de integração para novos funcionários de TI',
    category: 'onboarding',
    status: 'rascunho',
    fields: [],
    createdAt: '2024-01-05',
    updatedAt: '2024-01-05',
    responsesCount: 0
  }
];

const STATUS_LABELS: Record<FormStatus, { label: string; class: string }> = {
  rascunho: { label: 'Rascunho', class: 'bg-muted text-muted-foreground' },
  ativo: { label: 'Ativo', class: 'bg-primary/10 text-primary' },
  arquivado: { label: 'Arquivado', class: 'bg-amber-100 text-amber-700' }
};

const HRFlowPro = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('forms');
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<HRFlowForm | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forms, setForms] = useState<HRFlowForm[]>(mockForms);
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);

  const handleDeleteForm = (formId: string) => {
    try {
      setForms((currentForms) => currentForms.filter((form) => form.id !== formId));
      setDeleteFormId(null);
      toast.success("Formulário excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir formulário:", error);
      toast.error("Não foi possível excluir o formulário.");
    }
  };

  const filteredForms = forms.filter((form) => {
    const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "todos" || form.category === categoryFilter;
    const matchesStatus = statusFilter === "todos" || form.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isBuilderOpen) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <BackButton to="/hrflow-pro" onClick={() => {
          setIsBuilderOpen(false);
          setEditingForm(null);
        }} />
        <HRFlowFormBuilder 
          form={editingForm} 
          onClose={() => {
            setIsBuilderOpen(false);
            setEditingForm(null);
          }} 
        />
      </div>
    );
  }

  const renderFormsContent = () => (
    <>
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
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Forms List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">Nenhum formulário encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4">Crie seu primeiro formulário clicando no botão acima</p>
          <Button onClick={() => setIsBuilderOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Formulário
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredForms.map((form) => (
            <Card key={form.id} className="transition-all hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold text-lg text-foreground">{form.title}</h3>
                      <p className="text-sm text-muted-foreground">{form.description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={CATEGORY_COLORS[form.category]}>
                          {CATEGORY_LABELS[form.category]}
                        </Badge>
                        <Badge className={STATUS_LABELS[form.status].class}>
                          {STATUS_LABELS[form.status].label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {form.responsesCount} respostas
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingForm(form);
                        setIsBuilderOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Link Público
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setDeleteFormId(form.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteFormId} onOpenChange={(open) => !open && setDeleteFormId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir formulário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O formulário será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                if (!deleteFormId) return;
                handleDeleteForm(deleteFormId);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  return (
    <div className="space-y-4 sm:space-y-6" style={{ fontFamily: 'Arial, sans-serif' }}>
      <BackButton to="/gestao-rh" variant="light" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: '#000000' }}>
            Formulários
          </h1>
          <p className="mt-1 text-xs sm:text-sm md:text-base font-bold" style={{ color: '#000000' }}>
            Gerencie formulários de gestão de pessoas
          </p>
        </div>
        <Button onClick={() => setIsBuilderOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Formulário
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6" />
        <CardContent className="p-4 sm:p-6">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 grid grid-cols-4 w-full sm:w-auto sm:inline-flex">
              <TabsTrigger value="forms" className="gap-2">
                <FileText className="h-4 w-4 hidden sm:inline" />
                <span className="text-xs sm:text-sm">Formulários</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2">
                <LayoutTemplate className="h-4 w-4 hidden sm:inline" />
                <span className="text-xs sm:text-sm">Templates</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-2">
                <Sparkles className="h-4 w-4 hidden sm:inline" />
                <span className="text-xs sm:text-sm">IA</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4 hidden sm:inline" />
                <span className="text-xs sm:text-sm">Config</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="forms">
              {renderFormsContent()}
            </TabsContent>

            <TabsContent value="templates">
              <HRFlowTemplates />
            </TabsContent>

            <TabsContent value="ai">
              <HRFlowAI />
            </TabsContent>

            <TabsContent value="settings">
              <HRFlowSettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRFlowPro;
