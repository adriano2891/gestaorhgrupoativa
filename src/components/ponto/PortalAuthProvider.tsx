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
  endereco: string | null;
  perfil_updated_at: string | null;
  perfil_updated_by: string | null;
}

interface PortalAuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithCPF: (cpf: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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

  const loadProfile = useCallback(async (userId: string, accessToken?: string): Promise<Profile | null> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // Resolve token: use provided, or try localStorage
      let token = accessToken;
      if (!token) {
        const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID || supabaseUrl.match(/\/\/([^.]+)/)?.[1];
        const stored = localStorage.getItem(`sb-${projectRef}-auth-token`);
        if (stored) {
          try { token = JSON.parse(stored).access_token; } catch { /* ignore */ }
        }
      }
      if (!token) token = anonKey;

      const res = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=id,nome,email,cpf,telefone,departamento,cargo,data_nascimento,foto_url,deve_trocar_senha,data_admissao,created_at,endereco,perfil_updated_at,perfil_updated_by&limit=1`,
        {
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        console.error("Erro ao carregar perfil:", res.status);
        return null;
      }

      const data = await res.json();
      if (!data || data.length === 0) return null;

      return { ...data[0], deve_trocar_senha: data[0].deve_trocar_senha ?? false } as Profile;
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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // Use direct REST call to avoid Navigator LockManager issues
      const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_email_by_cpf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ cpf_input: cpfNumeros }),
      });

      if (!rpcRes.ok) {
        console.error("Erro ao buscar CPF:", rpcRes.status, await rpcRes.text());
        throw new Error("Erro ao buscar CPF no sistema");
      }

      const profileData = await rpcRes.json();

      if (!profileData || profileData.length === 0) {
        throw new Error("CPF não encontrado no sistema. Verifique o CPF digitado.");
      }

      const userEmail = profileData[0].email;

      // Use direct REST call for auth too
      const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
        },
        body: JSON.stringify({ email: userEmail, password }),
      });

      const authData = await authRes.json();

      if (!authRes.ok) {
        const msg = authData?.error_description || authData?.msg || authData?.error || '';
        if (msg.includes("Invalid login credentials")) {
          throw new Error("Senha incorreta. Verifique sua senha e tente novamente.");
        }
        if (msg.includes("Email not confirmed")) {
          throw new Error("Email não confirmado. Entre em contato com o RH.");
        }
        throw new Error(msg || "Erro na autenticação");
      }

      // Store session directly in localStorage to avoid LockManager
      const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID || supabaseUrl.match(/\/\/([^.]+)/)?.[1];
      const storageKey = `sb-${projectRef}-auth-token`;
      const sessionData = {
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
        token_type: 'bearer',
        expires_in: authData.expires_in,
        expires_at: authData.expires_at || Math.floor(Date.now() / 1000) + (authData.expires_in || 3600),
        user: authData.user,
      };
      localStorage.setItem(storageKey, JSON.stringify(sessionData));

      const userId = authData.user?.id;
      if (userId) {
        const loadedProfile = await Promise.race([
          loadProfile(userId, authData.access_token),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('profile_timeout')), 5000))
        ]).catch(() => null);
        
        setUser(authData.user);
        setProfile(loadedProfile);
        lastLoadedUserId.current = userId;
        setLoading(false);
      }
    } finally {
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