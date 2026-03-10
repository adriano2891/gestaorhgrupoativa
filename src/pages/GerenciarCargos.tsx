import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, ChevronRight, ChevronDown, Briefcase, Trash2, Edit, Search } from "lucide-react";
import { toast } from "sonner";

interface Cargo {
  id: string;
  nome: string;
  descricao: string | null;
  created_at: string;
}

const GerenciarCargos = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const { data: cargos = [], isLoading } = useQuery({
    queryKey: ["cargos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cargos" as any)
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data || []) as unknown as Cargo[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ nome, descricao }: { nome: string; descricao: string }) => {
      const { error } = await supabase
        .from("cargos" as any)
        .insert({ nome: nome.trim(), descricao: descricao.trim() || null } as any);
      if (error) {
        if (error.code === "23505") throw new Error("Já existe um cargo com este nome.");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cargos"] });
      toast.success("Cargo cadastrado com sucesso!");
      handleCloseDialog();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao cadastrar cargo.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, nome, descricao }: { id: string; nome: string; descricao: string }) => {
      const { error } = await supabase
        .from("cargos" as any)
        .update({ nome: nome.trim(), descricao: descricao.trim() || null } as any)
        .eq("id", id);
      if (error) {
        if (error.code === "23505") throw new Error("Já existe um cargo com este nome.");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cargos"] });
      toast.success("Cargo atualizado com sucesso!");
      handleCloseDialog();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao atualizar cargo.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cargos" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cargos"] });
      toast.success("Cargo removido com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao remover cargo.");
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCargo(null);
    setNome("");
    setDescricao("");
  };

  const handleEdit = (cargo: Cargo) => {
    setEditingCargo(cargo);
    setNome(cargo.nome);
    setDescricao(cargo.descricao || "");
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!nome.trim()) {
      toast.error("O nome do cargo é obrigatório.");
      return;
    }
    if (editingCargo) {
      updateMutation.mutate({ id: editingCargo.id, nome, descricao });
    } else {
      createMutation.mutate({ nome, descricao });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = cargos.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gerenciar Cargos</h1>
            <p className="text-sm text-muted-foreground">Cadastre e gerencie os cargos da empresa</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Cargo
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cargo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando cargos...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {search ? "Nenhum cargo encontrado." : "Nenhum cargo cadastrado. Clique em 'Novo Cargo' para começar."}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((cargo) => {
              const isOpen = expandedIds.has(cargo.id);
              return (
                <Collapsible
                  key={cargo.id}
                  open={isOpen}
                  onOpenChange={() => toggleExpand(cargo.id)}
                >
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                    <CollapsibleTrigger className="flex items-center gap-3 flex-1 text-left">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <Briefcase className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium text-foreground">{cargo.nome}</span>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(cargo);
                        }}
                      >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Deseja remover este cargo?")) {
                            deleteMutation.mutate(cargo.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pl-12">
                      <p className="text-sm text-muted-foreground">
                        {cargo.descricao || "Sem descrição cadastrada."}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCargo ? "Editar Cargo" : "Novo Cargo"}</DialogTitle>
            <DialogDescription>
              {editingCargo ? "Altere as informações do cargo." : "Preencha as informações para cadastrar um novo cargo."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cargo-nome">Nome do Cargo *</Label>
              <Input
                id="cargo-nome"
                placeholder="Ex: Analista de RH"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cargo-descricao">Descrição (opcional)</Label>
              <Textarea
                id="cargo-descricao"
                placeholder="Descreva as responsabilidades do cargo..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending)
                ? "Salvando..."
                : editingCargo
                ? "Salvar"
                : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerenciarCargos;
