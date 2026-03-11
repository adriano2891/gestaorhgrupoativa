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
      {/* Action buttons below icon bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <BackButton to="/dashboard" />
          <div className="flex items-center gap-2">
            <Button
              variant={view === "dashboard" ? "default" : "outline"}
              size="sm"
              onClick={() => { setView("dashboard"); setSelectedId(null); }}
              className="h-9 px-3 text-sm"
              aria-current={view === "dashboard" ? "page" : undefined}
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={view === "lista" ? "default" : "outline"}
              size="sm"
              onClick={() => { setView("lista"); setSelectedId(null); }}
              className="h-9 px-3 text-sm"
              aria-current={view === "lista" ? "page" : undefined}
            >
              <List className="w-4 h-4 mr-2" />
              Lista
            </Button>
            <Button
              size="sm"
              onClick={() => { setEditingCondo(null); setFormOpen(true); }}
              className="h-9 px-3 text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
