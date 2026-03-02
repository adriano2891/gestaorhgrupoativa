import { useState } from "react";
import { Plus, Search, Filter, FileText, MoreVertical, Eye, Edit, Trash2, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { HRFlowForm, FormCategory, FormStatus, CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/hrflow";
import { toast } from "sonner";
import { HRFlowFormBuilder } from "./HRFlowFormBuilder";

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
  rascunho: { label: 'Rascunho', class: 'bg-gray-100 text-gray-700' },
  ativo: { label: 'Ativo', class: 'bg-green-100 text-green-700' },
  arquivado: { label: 'Arquivado', class: 'bg-amber-100 text-amber-700' }
};

export const HRFlowFormsList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<HRFlowForm | null>(null);
  const [forms, setForms] = useState<HRFlowForm[]>(mockForms);
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);

  const handleDeleteForm = (formId?: string) => {
    const idToDelete = formId ?? deleteFormId;
    if (!idToDelete) return;

    setForms((currentForms) => currentForms.filter((f) => f.id !== idToDelete));
    setDeleteFormId(null);
    toast.success("Formulário excluído com sucesso!");
  };

  const handleDuplicateForm = (form: HRFlowForm) => {
    const newForm: HRFlowForm = {
      ...form,
      id: `${Date.now()}`,
      title: `${form.title} (Cópia)`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      responsesCount: 0,
    };
    setForms([newForm, ...forms]);
    toast.success("Formulário duplicado com sucesso!");
  };

  const filteredForms = forms.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "todos" || form.category === categoryFilter;
    const matchesStatus = statusFilter === "todos" || form.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isBuilderOpen) {
    return (
      <HRFlowFormBuilder 
        form={editingForm} 
        onClose={() => {
          setIsBuilderOpen(false);
          setEditingForm(null);
        }} 
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Formulários</h1>
          <p className="text-gray-500">Gerencie seus formulários de RH</p>
        </div>
        <Button 
          onClick={() => setIsBuilderOpen(true)}
          className="bg-[#2563eb] hover:bg-[#1d4ed8]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Formulário
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar formulários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-white border-gray-200">
            <Filter className="w-4 h-4 mr-2 text-gray-400" />
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
          <SelectTrigger className="w-full sm:w-40 bg-white border-gray-200">
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
      {filteredForms.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum formulário encontrado</h3>
            <p className="text-gray-500 mb-4">Crie seu primeiro formulário clicando no botão acima</p>
            <Button 
              onClick={() => setIsBuilderOpen(true)}
              className="bg-[#2563eb] hover:bg-[#1d4ed8]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Formulário
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredForms.map((form) => (
            <Card key={form.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-[#2563eb]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{form.title}</h3>
                      <p className="text-sm text-gray-500">{form.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={CATEGORY_COLORS[form.category]}>
                          {CATEGORY_LABELS[form.category]}
                        </Badge>
                        <Badge className={STATUS_LABELS[form.status].class}>
                          {STATUS_LABELS[form.status].label}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {form.responsesCount} respostas
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-gray-600"
                      onClick={() => {
                        setEditingForm(form);
                        setIsBuilderOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-gray-600"
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
                        <Button variant="ghost" size="icon" className="text-gray-400">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDuplicateForm(form)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Link Público
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={(event) => {
                            event.preventDefault();
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
              onClick={() => handleDeleteForm(deleteFormId ?? undefined)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
