import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  nome: string;
  email: string;
  cpf: string | null;
  telefone: string | null;
  departamento: string | null;
  cargo: string | null;
  data_nascimento: string | null;
  foto_url: string | null;
  deve_trocar_senha: boolean;
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

  const loadUserData = useCallback(async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) throw new Error("Perfil não encontrado");

      setProfile({
        ...profileData,
        deve_trocar_senha: (profileData as any).deve_trocar_senha ?? false,
      } as Profile);
      setUser({ id: userId } as User);
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      // Don't throw - let the UI show login instead of crashing
      setUser(null);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          await loadUserData(session.user.id);
        }
      } catch (error) {
        console.error("Erro ao restaurar sessão do portal:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Set up auth listener BEFORE checking session (Supabase best practice)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        // Use setTimeout to avoid Supabase deadlock with getSession inside callback
        setTimeout(async () => {
          if (!isMounted) return;
          await loadUserData(session.user.id);
          setLoading(false);
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        localStorage.removeItem('portal_session');
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Silently update - no loading change needed
      }
    });

    initSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const signInWithCPF = async (cpf: string, password: string) => {
    const cpfNumeros = cpf.replace(/\D/g, "");

    const { data: profileData, error: profileError } = await supabase
      .rpc("get_email_by_cpf", { cpf_input: cpfNumeros });

    if (profileError) {
      console.error("Erro ao buscar CPF:", profileError);
      throw new Error("Erro ao buscar CPF no sistema");
    }

    if (!profileData || profileData.length === 0) {
      throw new Error("CPF não encontrado");
    }

    const userEmail = profileData[0].email;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("Senha incorreta");
      }
      throw error;
    }

    if (data.user) {
      // Load immediately - don't wait for onAuthStateChange
      await loadUserData(data.user.id);

      localStorage.setItem('portal_session', JSON.stringify({
        user_id: data.user.id,
        email: userEmail,
        timestamp: new Date().toISOString()
      }));
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log("Logout error (ignored):", error);
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem('portal_session');
  };

  return (
    <PortalAuthContext.Provider
      value={{ user, profile, loading, signInWithCPF, signOut }}
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
