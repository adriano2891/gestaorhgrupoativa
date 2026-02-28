import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

type UserRole = "admin" | "gestor" | "rh" | "funcionario";

interface Profile {
  id: string;
  nome: string;
  email: string;
  departamento: string | null;
  cargo: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  roles: UserRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nome: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isSigningOut = useRef(false);
  const isSigningIn = useRef(false);

  const loadUserData = useCallback(async (userId: string, token?: string) => {
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const headers: Record<string, string> = {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
      };
      
      // Use provided token or try to get from storage
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        const stored = localStorage.getItem(`sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed?.access_token) {
              headers['Authorization'] = `Bearer ${parsed.access_token}`;
            }
          } catch {}
        }
      }
      
      const [profileRes, rolesRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id,nome,email,departamento,cargo&limit=1`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&select=role`, { headers }),
      ]);
      
      if (profileRes.ok) {
        const profiles = await profileRes.json();
        if (profiles?.[0]) setProfile(profiles[0] as Profile);
      }
      
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        if (rolesData) setRoles(rolesData.map((r: any) => r.role as UserRole));
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
    }
  }, []);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setProfile(null);
    setRoles([]);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let initialLoadDone = false;

    const safetyTimeout = setTimeout(() => {
      if (isMounted && !initialLoadDone) {
        console.warn("Auth: safety timeout reached, proceeding without blocking");
        initialLoadDone = true;
        setLoading(false);
      }
    }, 4000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          setUser(session.user);
          await loadUserData(session.user.id, session.access_token);
        }
        if (isMounted && !initialLoadDone) {
          initialLoadDone = true;
          setLoading(false);
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Skip if signOut is in progress OR if signIn is handling it eagerly
        if (isSigningOut.current || isSigningIn.current) return;
        setUser(session.user);
        await loadUserData(session.user.id);
        if (isMounted) setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        clearAuthState();
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [loadUserData, clearAuthState]);

  const signIn = async (email: string, password: string) => {
    isSigningIn.current = true;
    
    try {
      let loginEmail = email;
      
      if (!email.includes('@')) {
        if (email === "admin") {
          loginEmail = "admin@sistema.com";
        } else {
          const { data: emailData, error: emailError } = await supabase
            .rpc("get_email_by_username", { username_input: email });
          
          if (emailError || !emailData || emailData.length === 0) {
            throw new Error("Usuário não encontrado");
          }
          
          loginEmail = emailData[0].email;
        }
      }
      
      // Clear stale state
      supabase.removeAllChannels();
      queryClient.cancelQueries();
      queryClient.clear();
      
      // Use REST auth to avoid SDK LockManager hangs
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: loginEmail, password }),
      });
      
      const authData = await authRes.json();
      if (!authRes.ok) throw new Error(authData?.error_description || authData?.msg || "Erro ao fazer login");
      
      // Inject session into localStorage for SDK sync
      const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      localStorage.setItem(`sb-${PROJECT_ID}-auth-token`, JSON.stringify({
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + authData.expires_in,
        expires_in: authData.expires_in,
        token_type: 'bearer',
        user: authData.user,
      }));
      
      const userId = authData.user?.id;
      setUser(authData.user);
      setLoading(false);
      
      // Navigate IMMEDIATELY for fast UX
      navigate("/dashboard");
      
      // Load profile/roles in background using REST (won't hang)
      if (userId) {
        loadUserData(userId, authData.access_token).catch(console.error);
      }
    } finally {
      isSigningIn.current = false;
    }
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    isSigningOut.current = true;
    
    // Clear state immediately for responsive UI
    clearAuthState();
    setLoading(false);
    
    // Remove ALL realtime channels to prevent stale subscriptions
    // from re-populating queries after logout
    supabase.removeAllChannels();
    
    // Clear all React Query cache AND cancel in-flight queries
    queryClient.cancelQueries();
    queryClient.clear();
    
    // Clear any portal session data
    localStorage.removeItem('portal_session');
    
    try {
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
      ]);
    } catch (error) {
      console.log("Logout error (ignored):", error);
    }
    
    // Delay before re-enabling to let stale auth events pass
    setTimeout(() => {
      isSigningOut.current = false;
    }, 800);
    
    navigate("/login");
  };

  const hasRole = (role: UserRole) => roles.includes(role);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        roles,
        loading,
        signIn,
        signUp,
        signOut,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
