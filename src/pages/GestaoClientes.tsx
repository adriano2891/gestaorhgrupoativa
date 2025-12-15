import { useState } from "react";
import { Building2, LayoutDashboard, List, LogOut, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-black">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#3EE0CF] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo e Título */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-black">Gestão de Clientes</h1>
                <p className="text-xs text-black/70">Controle de Condomínios</p>
              </div>
            </div>

            {/* Navegação */}
            <div className="flex items-center gap-2">
              <Button
                variant={view === "dashboard" ? "default" : "ghost"}
                size="sm"
                onClick={() => { setView("dashboard"); setSelectedId(null); }}
                className={view === "dashboard" ? "bg-black hover:bg-black/90 text-white" : "text-black hover:bg-black/10"}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant={view === "lista" ? "default" : "ghost"}
                size="sm"
                onClick={() => { setView("lista"); setSelectedId(null); }}
                className={view === "lista" ? "bg-black hover:bg-black/90 text-white" : "text-black hover:bg-black/10"}
              >
                <List className="w-4 h-4 mr-2" />
                Lista
              </Button>
              <Button
                size="sm"
                onClick={() => { setEditingCondo(null); setFormOpen(true); }}
                className="bg-black hover:bg-black/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="text-black hover:bg-black/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

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
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GestaoClientes;
