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

  useEffect(() => {
    let isMounted = true;
    let initialLoadDone = false;

    // Safety timeout - never stay loading more than 6 seconds
    const safetyTimeout = setTimeout(() => {
      if (isMounted && !initialLoadDone) {
        console.warn("Auth: safety timeout reached, releasing loading state");
        initialLoadDone = true;
        setLoading(false);
      }
    }, 6000);

    const loadUserDataSafe = async (userId: string) => {
      try {
        const { data: profileData, error: profileError } = await (supabase as any)
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (!isMounted) return;
        if (profileError) throw profileError;
        if (profileData) setProfile(profileData as Profile);

        const { data: rolesData, error: rolesError } = await (supabase as any)
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);

        if (!isMounted) return;
        if (rolesError) throw rolesError;
        setRoles((rolesData as any[])?.map((r: any) => r.role as UserRole) || []);
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'INITIAL_SESSION') {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserDataSafe(session.user.id);
        }
        if (isMounted && !initialLoadDone) {
          initialLoadDone = true;
          setLoading(false);
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        if (isSigningOut.current) return; // Ignore stale events during logout
        setUser(session.user);
        await loadUserDataSafe(session.user.id);
        if (isMounted) setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setRoles([]);
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
  }, []);



  const signIn = async (email: string, password: string) => {
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
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });
    if (error) throw error;

    // Load user data with timeout to prevent hanging
    if (data.user) {
      setUser(data.user);
      try {
        const loadWithTimeout = <T,>(promise: Promise<T>, ms = 5000): Promise<T> =>
          Promise.race([
            promise,
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
          ]);

        const profileResult: any = await loadWithTimeout(
          (supabase as any).from("profiles").select("*").eq("id", data.user.id).maybeSingle()
        );
        if (profileResult?.data) setProfile(profileResult.data as Profile);

        const rolesResult: any = await loadWithTimeout(
          (supabase as any).from("user_roles").select("role").eq("user_id", data.user.id)
        );
        setRoles((rolesResult?.data as any[])?.map((r: any) => r.role as UserRole) || []);
      } catch (err) {
        console.error("Erro ao carregar dados após login:", err);
        // Even on error, proceed to dashboard - onAuthStateChange will retry
      }
    }

    setLoading(false);
    navigate("/dashboard");
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
        },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    isSigningOut.current = true;
    
    // Limpar estado imediatamente para UX responsiva
    setUser(null);
    setProfile(null);
    setRoles([]);
    setLoading(false);
    
    // Limpar todo cache do React Query
    queryClient.clear();
    
    try {
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
      ]);
    } catch (error) {
      console.log("Logout error (ignored):", error);
    }
    
    isSigningOut.current = false;
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
