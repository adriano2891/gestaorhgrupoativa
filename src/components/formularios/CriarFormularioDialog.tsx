import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateFormulario, useFormulariosTemplates } from "@/hooks/useFormulariosRH";
import { CATEGORY_LABELS, type FormCategory } from "@/types/formularios";
import { useNavigate } from "react-router-dom";

const formSchema = z.object({
  titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  descricao: z.string().optional(),
  categoria: z.enum(['admissao', 'desligamento', 'avaliacao_desempenho', 'feedback', 'solicitacao', 'treinamento', 'documentos', 'outro'] as const),
  is_template: z.boolean().optional().default(false),
  template_origem_id: z.string().optional(),
  departamento_destino: z.string().optional(),
  requer_assinatura: z.boolean().optional().default(false),
});

type FormData = z.input<typeof formSchema>;

interface CriarFormularioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CriarFormularioDialog = ({ open, onOpenChange }: CriarFormularioDialogProps) => {
  const navigate = useNavigate();
  const createFormulario = useCreateFormulario();
  const { data: templates } = useFormulariosTemplates();
  const [useTemplate, setUseTemplate] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      descricao: "",
      categoria: "outro",
      is_template: false,
      requer_assinatura: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    const result = await createFormulario.mutateAsync({
      titulo: data.titulo,
      descricao: data.descricao,
      categoria: data.categoria,
      is_template: data.is_template,
      template_origem_id: data.template_origem_id,
      departamento_destino: data.departamento_destino,
      requer_assinatura: data.requer_assinatura,
    });
    
    onOpenChange(false);
    form.reset();
    navigate(`/formularios-rh/${result.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Formulário</DialogTitle>
          <DialogDescription>
            Preencha as informações do formulário. Você poderá adicionar campos depois.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {templates && templates.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Switch 
                  checked={useTemplate} 
                  onCheckedChange={setUseTemplate}
                  id="use-template"
                />
                <Label htmlFor="use-template" className="text-sm">
                  Criar a partir de um template
                </Label>
              </div>
            )}

            {useTemplate && templates && (
              <FormField
                control={form.control}
                name="template_origem_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Base</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.titulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ficha de Admissão" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o propósito deste formulário..." 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="departamento_destino"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento Destino</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Administrativo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-3 pt-2">
              <FormField
                control={form.control}
                name="is_template"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-base">Salvar como Template</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Templates podem ser reutilizados para criar novos formulários
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requer_assinatura"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-base">Requer Assinatura</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Colaboradores precisarão confirmar leitura/acordo
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createFormulario.isPending}>
                {createFormulario.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Formulário
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
