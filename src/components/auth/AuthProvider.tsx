import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // Se houver erro de token inválido, fazer logout
      if (error?.message?.includes("Refresh Token")) {
        console.log("Token inválido detectado, fazendo logout...");
        supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setRoles([]);
        setLoading(false);
        return;
      }

      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Se houver erro de token, fazer logout
      if (event === "TOKEN_REFRESHED" && !session) {
        console.log("Falha ao renovar token, fazendo logout...");
        supabase.auth.signOut();
      }

      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setProfile(null);
        setRoles([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      // Carregar perfil
      const { data: profileData, error: profileError } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData as Profile);

      // Carregar roles
      const { data: rolesData, error: rolesError } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesError) throw rolesError;
      setRoles((rolesData as any[])?.map((r: any) => r.role as UserRole) || []);
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    let loginEmail = email;
    
    // Se não for um email válido, buscar o email pelo username
    if (!email.includes('@')) {
      // Converter "admin" para o email correto
      if (email === "admin") {
        loginEmail = "admin@sistema.com";
      } else {
        // Buscar email pelo username usando função segura
        const { data: emailData, error: emailError } = await supabase
          .rpc("get_email_by_username", { username_input: email });
        
        if (emailError || !emailData || emailData.length === 0) {
          throw new Error("Usuário não encontrado");
        }
        
        loginEmail = emailData[0].email;
      }
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });
    if (error) throw error;
    navigate("/");
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
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
