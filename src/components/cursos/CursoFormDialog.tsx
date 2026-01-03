import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCursoMutations, useCategoriasCurso } from "@/hooks/useCursos";
import type { Curso } from "@/types/cursos";
import { Loader2 } from "lucide-react";

const cursoSchema = z.object({
  titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  descricao: z.string().optional(),
  categoria_id: z.string().optional(),
  nivel: z.enum(["basico", "intermediario", "avancado"]),
  status: z.enum(["rascunho", "publicado", "arquivado"]),
  carga_horaria: z.number().min(0),
  instrutor: z.string().optional(),
  obrigatorio: z.boolean(),
  recorrente: z.boolean(),
  meses_recorrencia: z.number().optional(),
  nota_minima: z.number().min(0).max(100),
});

type CursoFormData = z.infer<typeof cursoSchema>;

interface CursoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  curso?: Curso | null;
}

export const CursoFormDialog = ({ open, onOpenChange, curso }: CursoFormDialogProps) => {
  const { createCurso, updateCurso } = useCursoMutations();
  const { data: categorias } = useCategoriasCurso();
  const isEditing = !!curso;

  const form = useForm<CursoFormData>({
    resolver: zodResolver(cursoSchema),
    defaultValues: {
      titulo: "",
      descricao: "",
      categoria_id: "",
      nivel: "basico",
      status: "rascunho",
      carga_horaria: 60,
      instrutor: "",
      obrigatorio: false,
      recorrente: false,
      meses_recorrencia: 12,
      nota_minima: 70,
    },
  });

  useEffect(() => {
    if (curso) {
      form.reset({
        titulo: curso.titulo,
        descricao: curso.descricao || "",
        categoria_id: curso.categoria_id || "",
        nivel: curso.nivel,
        status: curso.status,
        carga_horaria: curso.carga_horaria,
        instrutor: curso.instrutor || "",
        obrigatorio: curso.obrigatorio,
        recorrente: curso.recorrente,
        meses_recorrencia: curso.meses_recorrencia || 12,
        nota_minima: curso.nota_minima,
      });
    } else {
      form.reset({
        titulo: "",
        descricao: "",
        categoria_id: "",
        nivel: "basico",
        status: "rascunho",
        carga_horaria: 60,
        instrutor: "",
        obrigatorio: false,
        recorrente: false,
        meses_recorrencia: 12,
        nota_minima: 70,
      });
    }
  }, [curso, form]);

  const onSubmit = async (data: CursoFormData) => {
    try {
      const cursoData = {
        ...data,
        categoria_id: data.categoria_id || null,
      };

      if (isEditing && curso) {
        await updateCurso.mutateAsync({ id: curso.id, ...cursoData });
      } else {
        await createCurso.mutateAsync(cursoData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar curso:", error);
    }
  };

  const isLoading = createCurso.isPending || updateCurso.isPending;
  const watchRecorrente = form.watch("recorrente");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Curso" : "Novo Curso"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Título do Curso *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Segurança do Trabalho - NR35" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o conteúdo e objetivos do curso..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nivel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="basico">Básico</SelectItem>
                        <SelectItem value="intermediario">Intermediário</SelectItem>
                        <SelectItem value="avancado">Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="rascunho">Rascunho</SelectItem>
                        <SelectItem value="publicado">Publicado</SelectItem>
                        <SelectItem value="arquivado">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instrutor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instrutor</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do instrutor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="carga_horaria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carga Horária (minutos)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nota_minima"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota Mínima (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0}
                        max={100}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Nota mínima para aprovação</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="obrigatorio"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Curso Obrigatório</FormLabel>
                      <FormDescription>
                        Funcionários devem completar este curso
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recorrente"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Curso Recorrente</FormLabel>
                      <FormDescription>
                        Funcionários devem refazer periodicamente
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {watchRecorrente && (
                <FormField
                  control={form.control}
                  name="meses_recorrencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recorrência (meses)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>A cada quantos meses deve refazer</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Salvar Alterações" : "Criar Curso"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
