import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Admin {
  id: string;
  nome: string;
  usuario?: string;
  email: string;
  departamento?: string;
  cargo?: string;
  roles: string[];
  created_at: string;
  updated_at: string;
}

export const useAdmins = () => {
  return useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      // Buscar perfis que tenham roles administrativos
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["admin", "gestor", "rh"]);

      if (rolesError) throw rolesError;

      if (!userRoles || userRoles.length === 0) {
        return [] as Admin[];
      }

      // Agrupar roles por user_id
      const rolesByUser = userRoles.reduce((acc, ur) => {
        if (!acc[ur.user_id]) {
          acc[ur.user_id] = [];
        }
        acc[ur.user_id].push(ur.role);
        return acc;
      }, {} as Record<string, string[]>);

      const userIds = Object.keys(rolesByUser);

      // Buscar perfis dos usuários
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nome, usuario, email, departamento, cargo, created_at, updated_at")
        .in("id", userIds)
        .order("nome", { ascending: true });

      if (profilesError) throw profilesError;

      // Combinar perfis com seus roles
      const admins = (profiles || []).map((profile) => ({
        ...profile,
        roles: rolesByUser[profile.id] || [],
      }));

      return admins as Admin[];
    },
    staleTime: 1000 * 60 * 2,
    retry: 2,
  });
};

export const useCreateAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      nome: string;
      usuario: string;
      departamento?: string;
      cargo?: string;
      role: "admin" | "gestor" | "rh";
    }) => {
      try {
        const { data: result, error } = await supabase.functions.invoke(
          "create-admin-user",
          {
            body: data,
          }
        );

        // Check for edge function errors
        if (error) {
          console.error("Edge function error:", error);
          throw new Error(error.message || "Erro ao criar administrador");
        }

        // Check for application-level errors in the response
        if (result?.error) {
          throw new Error(result.error);
        }

        return result;
      } catch (error: any) {
        // Extract the error message from the response
        if (error?.context?.body?.error) {
          throw new Error(error.context.body.error);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Administrador criado com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error creating admin:", error);
      const errorMessage = error.message || "Erro ao criar administrador";
      toast.error(errorMessage);
    },
  });
};

export const useUpdateAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      nome?: string;
      usuario?: string;
      departamento?: string;
      cargo?: string;
      role?: "admin" | "gestor" | "rh";
    }) => {
      const { id, role, ...profileData } = data;

      // Atualizar perfil
      if (Object.keys(profileData).length > 0) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update(profileData)
          .eq("id", id);

        if (profileError) throw profileError;
      }

      // Atualizar role se fornecida
      if (role) {
        // Remover roles administrativos existentes
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", id)
          .in("role", ["admin", "gestor", "rh"]);

        // Inserir novo role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: id, role });

        if (roleError) throw roleError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Administrador atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar administrador");
      console.error(error);
    },
  });
};

export const useDeleteAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Remover roles administrativos
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .in("role", ["admin", "gestor", "rh"]);

      if (roleError) throw roleError;

      // Adicionar role de funcionário se não tiver nenhum
      const { data: remainingRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (!remainingRoles || remainingRoles.length === 0) {
        await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "funcionario" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Administrador removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover administrador");
      console.error(error);
    },
  });
};
