import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Admin {
  id: string;
  nome: string;
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
      // Buscar perfis com seus roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          nome,
          email,
          departamento,
          cargo,
          created_at,
          updated_at
        `)
        .order("nome", { ascending: true });

      if (profilesError) throw profilesError;

      // Buscar roles de cada perfil
      const profilesWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: roles, error: rolesError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id);

          if (rolesError) throw rolesError;

          return {
            ...profile,
            roles: roles.map((r) => r.role),
          };
        })
      );

      // Filtrar apenas usuários que têm role de admin, gestor ou rh
      const admins = profilesWithRoles.filter((profile) =>
        profile.roles.some((role) => ["admin", "gestor", "rh"].includes(role))
      );

      return admins as Admin[];
    },
  });
};

export const useCreateAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      nome: string;
      departamento?: string;
      cargo?: string;
      role: "admin" | "gestor" | "rh";
    }) => {
      // Chamar edge function para criar admin
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar administrador");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Administrador criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar administrador");
    },
  });
};

export const useUpdateAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      nome?: string;
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
