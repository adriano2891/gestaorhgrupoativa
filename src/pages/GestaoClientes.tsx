import { useState } from "react";
import { Building2, LayoutDashboard, List, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { useCondominios } from "@/hooks/useCondominios";
import { CondominiosDashboard } from "@/components/condominios/CondominiosDashboard";
import { CondominiosLista } from "@/components/condominios/CondominiosLista";
import { CondominioDetalhes } from "@/components/condominios/CondominioDetalhes";
import { CondominioForm } from "@/components/condominios/CondominioForm";
import { Condominio } from "@/types/condominios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type View = "dashboard" | "lista" | "detalhes";

const GestaoClientes = () => {
  const navigate = useNavigate();
  const {
    condominios,
    loading,
    metricas,
    recentes,
    addCondominio,
    updateCondominio,
    deleteCondominio,
    getCondominio,
    addDocument,
    removeDocument
  } = useCondominios();

  const [view, setView] = useState<View>("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCondo, setEditingCondo] = useState<Condominio | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const selectedCondo = selectedId ? getCondominio(selectedId) : null;

  const handleViewDetails = (id: string) => {
    setSelectedId(id);
    setView("detalhes");
  };

  const handleEdit = (condo: Condominio) => {
    setEditingCondo(condo);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteCondominio(deleteId);
      toast.success("Condomínio excluído com sucesso!");
      if (selectedId === deleteId) {
        setSelectedId(null);
        setView("lista");
      }
      setDeleteId(null);
    }
  };

  const handleSave = (data: Omit<Condominio, 'id' | 'updatedAt' | 'documents'>) => {
    if (editingCondo) {
      updateCondominio(editingCondo.id, data);
    } else {
      addCondominio(data);
    }
    setEditingCondo(null);
  };

  const handleAddDocument = async (file: File) => {
    if (selectedId) {
      await addDocument(selectedId, file);
    }
  };

  const handleRemoveDocument = (docId: string) => {
    if (selectedId) {
      removeDocument(selectedId, docId);
      toast.success("Documento removido!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-primary shadow-md">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-0 sm:h-16 gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <BackButton to="/dashboard" variant="light" className="text-primary-foreground hover:bg-primary-foreground/10" />
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-bold text-primary-foreground truncate">Gestão de Clientes</h1>
                <p className="text-[10px] sm:text-xs text-primary-foreground/70 truncate">Controle de Condomínios</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
              <Button
                variant={view === "dashboard" ? "default" : "ghost"}
                size="sm"
                onClick={() => { setView("dashboard"); setSelectedId(null); }}
                className={`h-8 px-2 sm:px-3 text-xs sm:text-sm touch-target ${view === "dashboard" ? "bg-primary-foreground/20 text-primary-foreground" : "text-primary-foreground hover:bg-primary-foreground/10"}`}
                aria-current={view === "dashboard" ? "page" : undefined}
              >
                <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <Button
                variant={view === "lista" ? "default" : "ghost"}
                size="sm"
                onClick={() => { setView("lista"); setSelectedId(null); }}
                className={`h-8 px-2 sm:px-3 text-xs sm:text-sm touch-target ${view === "lista" ? "bg-primary-foreground/20 text-primary-foreground" : "text-primary-foreground hover:bg-primary-foreground/10"}`}
                aria-current={view === "lista" ? "page" : undefined}
              >
                <List className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Lista</span>
              </Button>
              <Button
                size="sm"
                onClick={() => { setEditingCondo(null); setFormOpen(true); }}
                className="h-8 px-2 sm:px-3 text-xs sm:text-sm bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground touch-target"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Novo</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div className="h-[56px] sm:h-[60px] md:h-[64px]" />

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {view === "dashboard" && (
          <CondominiosDashboard
            metricas={metricas}
            recentes={recentes}
            onSelectCondominio={handleViewDetails}
          />
        )}

        {view === "lista" && (
          <CondominiosLista
            condominios={condominios}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleViewDetails}
          />
        )}

        {view === "detalhes" && selectedCondo && (
          <CondominioDetalhes
            condominio={selectedCondo}
            onBack={() => { setView("lista"); setSelectedId(null); }}
            onAddDocument={handleAddDocument}
            onRemoveDocument={handleRemoveDocument}
          />
        )}
      </main>

      {/* Modal de Formulário */}
      <CondominioForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingCondo(null); }}
        onSave={handleSave}
        condominio={editingCondo}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este condomínio? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GestaoClientes;
