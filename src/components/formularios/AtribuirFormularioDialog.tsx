import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Search, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAssignFormulario } from "@/hooks/useFormulariosRH";
import { cn } from "@/lib/utils";

interface AtribuirFormularioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formularioId: string;
}

export const AtribuirFormularioDialog = ({ open, onOpenChange, formularioId }: AtribuirFormularioDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [dataLimite, setDataLimite] = useState<Date | undefined>();
  
  const assignFormulario = useAssignFormulario();

  const { data: colaboradores, isLoading } = useQuery({
    queryKey: ["colaboradores-atribuicao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, email, departamento")
        .order("nome");

      if (error) throw error;
      return data;
    },
  });

  const filteredColaboradores = colaboradores?.filter((c) =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.departamento?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (filteredColaboradores) {
      const allIds = filteredColaboradores.map((c) => c.id);
      setSelectedUsers((prev) =>
        prev.length === allIds.length ? [] : allIds
      );
    }
  };

  const handleSubmit = async () => {
    await assignFormulario.mutateAsync({
      formulario_id: formularioId,
      user_ids: selectedUsers,
      data_limite: dataLimite ? format(dataLimite, "yyyy-MM-dd") : undefined,
    });
    
    onOpenChange(false);
    setSelectedUsers([]);
    setDataLimite(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Atribuir Formulário</DialogTitle>
          <DialogDescription>
            Selecione os colaboradores que devem preencher este formulário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar colaboradores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Date Picker */}
          <div>
            <Label>Data Limite (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataLimite && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dataLimite ? format(dataLimite, "dd/MM/yyyy") : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dataLimite}
                  onSelect={setDataLimite}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Colaboradores List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Colaboradores</Label>
              <Button variant="link" size="sm" onClick={handleSelectAll}>
                {selectedUsers.length === filteredColaboradores?.length
                  ? "Desmarcar todos"
                  : "Selecionar todos"}
              </Button>
            </div>
            
            <ScrollArea className="h-[250px] border rounded-lg p-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredColaboradores?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum colaborador encontrado
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredColaboradores?.map((colaborador) => (
                    <div
                      key={colaborador.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleToggleUser(colaborador.id)}
                    >
                      <Checkbox
                        checked={selectedUsers.includes(colaborador.id)}
                        onCheckedChange={() => handleToggleUser(colaborador.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{colaborador.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {colaborador.email}
                          {colaborador.departamento && ` • ${colaborador.departamento}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {selectedUsers.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedUsers.length} colaborador(es) selecionado(s)
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={selectedUsers.length === 0 || assignFormulario.isPending}
          >
            {assignFormulario.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Atribuir ({selectedUsers.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
