import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useUpdateDocumento } from "@/hooks/useDocumentos";
import type { Documento, DocumentoCategoria } from "@/types/documentos";

interface EditarDocumentoDialogProps {
  documento: Documento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categorias: DocumentoCategoria[];
}

export const EditarDocumentoDialog = ({ 
  documento, 
  open, 
  onOpenChange,
  categorias
}: EditarDocumentoDialogProps) => {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState<string | undefined>();
  const [tags, setTags] = useState("");
  const [publico, setPublico] = useState(false);
  
  const updateDocumento = useUpdateDocumento();

  useEffect(() => {
    if (documento) {
      setTitulo(documento.titulo);
      setDescricao(documento.descricao || "");
      setCategoriaId(documento.categoria?.id || undefined);
      setTags(documento.tags?.join(", ") || "");
      setPublico(documento.publico || false);
    }
  }, [documento]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documento || !titulo.trim()) return;

    const tagsArray = tags
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    await updateDocumento.mutateAsync({
      id: documento.id,
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      categoria_id: categoriaId || null,
      tags: tagsArray.length > 0 ? tagsArray : null,
      publico,
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Documento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nome do documento"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição do documento"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select value={categoriaId || "none"} onValueChange={(v) => setCategoriaId(v === "none" ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem categoria</SelectItem>
                {categorias?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.cor }} />
                      {cat.nome}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Separadas por vírgula (ex: contrato, 2024)"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="publico">Documento Público</Label>
              <p className="text-sm text-muted-foreground">
                Permite acesso sem autenticação
              </p>
            </div>
            <Switch
              id="publico"
              checked={publico}
              onCheckedChange={setPublico}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateDocumento.isPending || !titulo.trim()}>
              {updateDocumento.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
