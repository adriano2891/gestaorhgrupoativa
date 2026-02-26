import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { Admin, useCreateAdmin, useUpdateAdmin } from "@/hooks/useAdmins";
import { supabase } from "@/integrations/supabase/client";

const MODULOS_DISPONIVEIS = [
  { id: "gestao-rh", label: "Recursos Humanos" },
  { id: "gestao-clientes", label: "Clientes" },
  { id: "inventario", label: "Inventário" },
  { id: "documentacoes", label: "Documentos" },
  { id: "fornecedores", label: "Fornecedores" },
  { id: "orcamentos", label: "Orçamentos" },
];

const adminSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  usuario: z
    .string()
    .min(3, "Usuário deve ter no mínimo 3 caracteres")
    .max(50, "Usuário deve ter no máximo 50 caracteres")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Usuário deve conter apenas letras, números, ponto, hífen ou underscore"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .optional()
    .or(z.literal("")),
  departamento: z.string().optional(),
  cargo: z.string().optional(),
  role: z.enum(["admin", "gestor", "rh"], {
    required_error: "Selecione uma função",
  }),
});

type AdminFormData = z.infer<typeof adminSchema>;

interface AdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin?: Admin;
}

export const AdminDialog = ({ open, onOpenChange, admin }: AdminDialogProps) => {
  const isEditing = !!admin;
  const createAdmin = useCreateAdmin();
  const updateAdmin = useUpdateAdmin();
  const [selectedModulos, setSelectedModulos] = useState<string[]>([]);

  const form = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      nome: admin?.nome || "",
      usuario: admin?.usuario || "",
      email: admin?.email || "",
      password: "",
      departamento: admin?.departamento || "",
      cargo: admin?.cargo || "",
      role: (admin?.roles[0] as "admin" | "gestor" | "rh") || "admin",
    },
  });

  const watchedRole = form.watch("role");

  // Load existing permissions when editing a gestor
  useEffect(() => {
    if (isEditing && admin && admin.roles.includes("gestor")) {
      supabase
        .from("gestor_permissions" as any)
        .select("modulo")
        .eq("user_id", admin.id)
        .then(({ data }) => {
          if (data) {
            setSelectedModulos((data as any[]).map((d: any) => d.modulo));
          }
        });
    } else {
      setSelectedModulos([]);
    }
  }, [admin, isEditing]);

  // Reset permissions when role changes away from gestor
  useEffect(() => {
    if (watchedRole !== "gestor") {
      setSelectedModulos([]);
    }
  }, [watchedRole]);

  const toggleModulo = (moduloId: string) => {
    setSelectedModulos((prev) =>
      prev.includes(moduloId)
        ? prev.filter((m) => m !== moduloId)
        : [...prev, moduloId]
    );
  };

  const onSubmit = async (data: AdminFormData) => {
    if (isEditing) {
      await updateAdmin.mutateAsync({
        id: admin.id,
        nome: data.nome,
        usuario: data.usuario,
        departamento: data.departamento,
        cargo: data.cargo,
        role: data.role,
      });
    } else {
      if (!data.password) {
        form.setError("password", {
          message: "Senha é obrigatória para novos administradores",
        });
        return;
      }
      await createAdmin.mutateAsync({
        email: data.email,
        password: data.password,
        nome: data.nome,
        usuario: data.usuario,
        departamento: data.departamento,
        cargo: data.cargo,
        role: data.role,
      });
    }

    // Save gestor permissions
    if (data.role === "gestor") {
      const userId = isEditing ? admin.id : undefined;
      // For new admins, we need to find the user by email after creation
      if (userId) {
        await saveGestorPermissions(userId, selectedModulos);
      } else {
        // For new users, save permissions after a short delay to allow user creation
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", data.email)
          .maybeSingle();
        if (profile) {
          await saveGestorPermissions(profile.id, selectedModulos);
        }
      }
    }

    onOpenChange(false);
    form.reset();
    setSelectedModulos([]);
  };

  const saveGestorPermissions = async (userId: string, modulos: string[]) => {
    // Delete existing permissions
    await (supabase as any)
      .from("gestor_permissions")
      .delete()
      .eq("user_id", userId);

    // Insert new permissions
    if (modulos.length > 0) {
      await (supabase as any)
        .from("gestor_permissions")
        .insert(modulos.map((modulo) => ({ user_id: userId, modulo })));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Administrador" : "Novo Administrador"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações do administrador"
              : "Preencha os dados para criar um novo administrador"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="usuario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuário</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="joao.silva" 
                      {...field}
                      disabled={isEditing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="joao@empresa.com"
                      {...field}
                      disabled={isEditing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Função</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Super Admin</SelectItem>
                      <SelectItem value="rh">Admin RH</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Card de permissões do Gestor */}
            {watchedRole === "gestor" && (
              <Card className="border-2 border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Permissões de Acesso
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Selecione os módulos que este gestor poderá acessar
                  </p>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3">
                  {MODULOS_DISPONIVEIS.map((modulo) => (
                    <label
                      key={modulo.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedModulos.includes(modulo.id)}
                        onCheckedChange={() => toggleModulo(modulo.id)}
                      />
                      <span className="text-sm font-medium">{modulo.label}</span>
                    </label>
                  ))}
                </CardContent>
              </Card>
            )}

            <FormField
              control={form.control}
              name="departamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <FormControl>
                    <Input placeholder="TI, RH, Financeiro..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cargo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo</FormLabel>
                  <FormControl>
                    <Input placeholder="Gerente, Coordenador..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createAdmin.isPending || updateAdmin.isPending}
              >
                {isEditing ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};