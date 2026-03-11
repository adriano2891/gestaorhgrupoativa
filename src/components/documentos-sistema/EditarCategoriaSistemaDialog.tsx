import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useUpdateCategoriaSistema } from "@/hooks/useDocumentosSistema";
import type { DocumentoCategoria } from "@/types/documentos";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  descricao: z.string().optional(),
  cor: z.string().optional().default("#3B82F6"),
  categoria_pai_id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const CORES_PREDEFINIDAS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria: DocumentoCategoria | null;
  categorias: DocumentoCategoria[];
}

export const EditarCategoriaSistemaDialog = ({ open, onOpenChange, categoria, categorias }: Props) => {
  const updateCategoria = useUpdateCategoriaSistema();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: { nome: "", descricao: "", cor: "#3B82F6", categoria_pai_id: undefined },
  });

  useEffect(() => {
    if (categoria && open) {
      form.reset({
        nome: categoria.nome, descricao: categoria.descricao || "",
        cor: categoria.cor || "#3B82F6", categoria_pai_id: categoria.categoria_pai_id || undefined,
      });
    }
  }, [categoria, open]);

  const onSubmit = async (data: FormData) => {
    if (!categoria) return;
    await updateCategoria.mutateAsync({ id: categoria.id, nome: data.nome, descricao: data.descricao, cor: data.cor, categoria_pai_id: data.categoria_pai_id || null });
    onOpenChange(false);
  };

  const availableCategorias = categorias.filter(c => c.id !== categoria?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Editar Categoria</DialogTitle>
          <DialogDescription>Atualize os dados da categoria.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem><FormLabel>Nome *</FormLabel><FormControl><Input placeholder="Ex: Contratos" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="descricao" render={({ field }) => (
              <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descreva a categoria..." className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="cor" render={({ field }) => (
              <FormItem>
                <FormLabel>Cor</FormLabel>
                <div className="flex gap-2 flex-wrap">
                  {CORES_PREDEFINIDAS.map((cor) => (
                    <button key={cor} type="button" onClick={() => field.onChange(cor)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${field.value === cor ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: cor }} />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />
            {availableCategorias.length > 0 && (
              <FormField control={form.control} name="categoria_pai_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria Pai (opcional)</FormLabel>
                  <Select onValueChange={(v) => field.onChange(v === "none" ? undefined : v)} value={field.value ?? "none"}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Nenhuma (categoria raiz)" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma (categoria raiz)</SelectItem>
                      {availableCategorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.cor }} />{cat.nome}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={updateCategoria.isPending}>
                {updateCategoria.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
