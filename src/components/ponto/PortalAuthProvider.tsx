import { createContext, useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const checkPortalSession = async () => {
      // Safety timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        console.warn("Portal: timeout ao carregar sessão, liberando loading...");
        setLoading(false);
      }, 8000);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const portalRaw = localStorage.getItem('portal_session');
        const portalData = portalRaw ? JSON.parse(portalRaw) : null;

        if (session?.user) {
          if (portalData?.user_id && portalData.user_id !== session.user.id && portalData.email) {
            console.log("Sessão do portal difere da sessão ativa. Re-autenticando funcionário...");
            try {
              const { data: reauth, error: reauthError } = await supabase.auth.signInWithPassword({
                email: portalData.email,
                password: portalData.tempKey || '',
              });
              if (reauthError || !reauth?.user) {
                await loadUserData(session.user.id);
                localStorage.setItem('portal_session', JSON.stringify({
                  user_id: session.user.id,
                  timestamp: new Date().toISOString()
                }));
              } else {
                await loadUserData(reauth.user.id);
              }
            } catch {
              await loadUserData(session.user.id);
              localStorage.setItem('portal_session', JSON.stringify({
                user_id: session.user.id,
                timestamp: new Date().toISOString()
              }));
            }
          } else {
            await loadUserData(session.user.id);
            localStorage.setItem('portal_session', JSON.stringify({
              user_id: session.user.id,
              timestamp: new Date().toISOString()
            }));
          }
        } else {
          localStorage.removeItem('portal_session');
        }
      } catch (error) {
        console.error("Erro ao restaurar sessão do portal:", error);
        localStorage.removeItem('portal_session');
      }
      
      clearTimeout(timeoutId);
      setLoading(false);
    };

    checkPortalSession();

    // Listen for auth state changes to detect session switches
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const portalRaw = localStorage.getItem('portal_session');
        const portalData = portalRaw ? JSON.parse(portalRaw) : null;
        
        // If the new session matches our portal user, update data
        if (portalData?.user_id === session.user.id) {
          await loadUserData(session.user.id);
        }
        // If session changed to a different user (admin logged in), 
        // keep the current portal state but note the mismatch
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        localStorage.removeItem('portal_session');
      }
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
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
      
      setProfile({
        ...profileData,
        deve_trocar_senha: (profileData as any).deve_trocar_senha ?? false,
      } as Profile);
      
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
      
      // Buscar o email associado ao CPF usando função segura
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

      // Fazer login com email e senha
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
        await loadUserData(data.user.id);
        
        // Salvar sessão do portal com email para recuperação de sessão
        localStorage.setItem('portal_session', JSON.stringify({
          user_id: data.user.id,
          email: userEmail,
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
