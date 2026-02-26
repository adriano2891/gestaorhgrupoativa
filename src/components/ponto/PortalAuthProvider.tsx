import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

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
  data_admissao: string | null;
  created_at: string | null;
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
  const lastLoadedUserId = useRef<string | null>(null);
  const isSigningOut = useRef(false);
  const isSigningIn = useRef(false);
  const queryClient = useQueryClient();

  const loadProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, nome, email, cpf, telefone, departamento, cargo, data_nascimento, foto_url, deve_trocar_senha, data_admissao, created_at")
        .eq("id", userId)
        .maybeSingle();

      if (profileError || !profileData) {
        console.error("Erro ao carregar perfil:", profileError);
        return null;
      }

      return {
        ...profileData,
        deve_trocar_senha: (profileData as any).deve_trocar_senha ?? false,
      } as Profile;
    } catch (error) {
      console.error("Erro inesperado ao carregar perfil:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("Portal: safety timeout reached, releasing loading state");
        setLoading(false);
      }
    }, 3000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          const loadedProfile = await loadProfile(session.user.id);
          if (isMounted) {
            if (loadedProfile) {
              setUser(session.user);
              setProfile(loadedProfile);
              lastLoadedUserId.current = session.user.id;
            } else {
              setUser(null);
              setProfile(null);
            }
          }
        }
        if (isMounted) setLoading(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Skip if signing out or if signInWithCPF already handled this
        if (isSigningOut.current || isSigningIn.current) return;
        
        if (lastLoadedUserId.current !== session.user.id) {
          const loadedProfile = await loadProfile(session.user.id);
          if (isMounted) {
            if (loadedProfile) {
              setUser(session.user);
              setProfile(loadedProfile);
              lastLoadedUserId.current = session.user.id;
            }
            setLoading(false);
          }
        } else {
          if (isMounted) {
            setUser(session.user);
            setLoading(false);
          }
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        if (isMounted) {
          setUser(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          setProfile(null);
          lastLoadedUserId.current = null;
          setLoading(false);
          localStorage.removeItem('portal_session');
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signInWithCPF = async (cpf: string, password: string) => {
    isSigningOut.current = false;
    isSigningIn.current = true;
    
    try {
      const cpfNumeros = cpf.replace(/\D/g, "");

      const { data: profileData, error: profileError } = await supabase
        .rpc("get_email_by_cpf", { cpf_input: cpfNumeros });

      if (profileError) {
        console.error("Erro ao buscar CPF:", profileError);
        throw new Error("Erro ao buscar CPF no sistema");
      }

      if (!profileData || profileData.length === 0) {
        throw new Error("CPF não encontrado no sistema. Verifique o CPF digitado.");
      }

      const userEmail = profileData[0].email;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Senha incorreta. Verifique sua senha e tente novamente.");
        }
        if (error.message.includes("Email not confirmed")) {
          throw new Error("Email não confirmado. Entre em contato com o RH.");
        }
        throw new Error(error.message);
      }

      if (data.user) {
        const loadedProfile = await Promise.race([
          loadProfile(data.user.id),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('profile_timeout')), 5000))
        ]).catch(() => null);
        
        setUser(data.user);
        setProfile(loadedProfile);
        lastLoadedUserId.current = data.user.id;
        setLoading(false);
      }
    } finally {
      // Release the signing in flag after a short delay to skip the SIGNED_IN event
      setTimeout(() => {
        isSigningIn.current = false;
      }, 1000);
    }
  };

  const signOut = async () => {
    isSigningOut.current = true;
    
    setUser(null);
    setProfile(null);
    lastLoadedUserId.current = null;
    setLoading(false);
    localStorage.removeItem('portal_session');
    
    supabase.removeAllChannels();
    queryClient.cancelQueries();
    queryClient.clear();
    
    try {
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
      ]);
    } catch (error) {
      console.log("Logout error (ignored):", error);
    }
    
    setTimeout(() => {
      isSigningOut.current = false;
    }, 800);
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