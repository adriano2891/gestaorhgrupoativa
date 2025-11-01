import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  nome: string;
  email: string;
  cpf: string | null;
  departamento: string | null;
  cargo: string | null;
}

interface PortalAuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithCPF: (cpf: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const PortalAuthContext = createContext<PortalAuthContextType | undefined>(undefined);

export const PortalAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão do portal (usando um storage key específico)
    const checkPortalSession = async () => {
      const portalSession = localStorage.getItem('portal_session');
      
      if (portalSession) {
        try {
          const { user_id } = JSON.parse(portalSession);
          await loadUserData(user_id);
        } catch (error) {
          console.error("Erro ao restaurar sessão do portal:", error);
          localStorage.removeItem('portal_session');
        }
      }
      
      setLoading(false);
    };

    checkPortalSession();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profileData) {
        throw new Error("Perfil não encontrado");
      }
      
      setProfile(profileData as Profile);
      
      // Criar um user mock para manter compatibilidade
      setUser({ id: userId } as User);
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      throw error;
    }
  };

  const signInWithCPF = async (cpf: string, password: string) => {
    try {
      const cpfNumeros = cpf.replace(/\D/g, "");
      
      // Buscar o email associado ao CPF
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("email, id")
        .eq("cpf", cpfNumeros)
        .maybeSingle();

      if (profileError || !profileData) {
        throw new Error("CPF não encontrado");
      }

      // Fazer login com email e senha
      const { data, error } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Senha incorreta");
        }
        throw error;
      }

      if (data.user) {
        await loadUserData(data.user.id);
        
        // Salvar sessão do portal separadamente
        localStorage.setItem('portal_session', JSON.stringify({
          user_id: data.user.id,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      localStorage.removeItem('portal_session');
    } catch (error) {
      throw error;
    }
  };

  return (
    <PortalAuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithCPF,
        signOut,
      }}
    >
      {children}
    </PortalAuthContext.Provider>
  );
};

export const usePortalAuth = () => {
  const context = useContext(PortalAuthContext);
  if (context === undefined) {
    throw new Error("usePortalAuth deve ser usado dentro de um PortalAuthProvider");
  }
  return context;
};
