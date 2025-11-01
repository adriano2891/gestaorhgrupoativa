import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SavedFiltersProps {
  currentFilters: any;
  onLoadFilters: (filters: any) => void;
}

export const SavedFilters = ({ currentFilters, onLoadFilters }: SavedFiltersProps) => {
  const { toast } = useToast();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [savedFilters, setSavedFilters] = useState<any[]>(
    JSON.parse(localStorage.getItem('savedReportFilters') || '[]')
  );

  const handleSave = () => {
    if (!filterName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para salvar os filtros",
        variant: "destructive"
      });
      return;
    }

    const newFilter = {
      id: Date.now(),
      name: filterName,
      filters: currentFilters,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('savedReportFilters', JSON.stringify(updated));

    toast({
      title: "Filtros salvos",
      description: `"${filterName}" foi salvo com sucesso`,
    });

    setFilterName("");
    setShowSaveDialog(false);
  };

  const handleDelete = (id: number) => {
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem('savedReportFilters', JSON.stringify(updated));

    toast({
      title: "Filtro removido",
      description: "O filtro foi excluído com sucesso",
    });
  };

  const handleLoad = (filters: any) => {
    onLoadFilters(filters);
    toast({
      title: "Filtros carregados",
      description: "Os filtros foram aplicados",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Filtros Salvos</h3>
        <Button onClick={() => setShowSaveDialog(true)} size="sm">
          <Save className="h-4 w-4 mr-2" />
          Salvar Atual
        </Button>
      </div>

      {savedFilters.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Nenhum filtro salvo ainda
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedFilters.map((filter) => (
            <Card key={filter.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{filter.name}</CardTitle>
                    <CardDescription className="text-xs">
                      Salvo em {new Date(filter.createdAt).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(filter.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleLoad(filter.filters)}
                >
                  Carregar Filtros
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Filtros</DialogTitle>
            <DialogDescription>
              Dê um nome para este conjunto de filtros
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filter-name">Nome do Filtro</Label>
              <Input
                id="filter-name"
                placeholder="Ex: Relatório Mensal TI"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
