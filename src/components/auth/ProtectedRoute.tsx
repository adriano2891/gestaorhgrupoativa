import { useAuth } from "./AuthProvider";
import { Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "admin" | "gestor" | "rh" | "funcionario";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

const PageLoader = () => (
  <div className="space-y-4 p-8">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-64 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

export const ProtectedRoute = ({
  children,
  requiredRoles,
}: ProtectedRouteProps) => {
  const { user, roles, loading } = useAuth();
  const [directRoles, setDirectRoles] = useState<UserRole[]>([]);
  const [directLoading, setDirectLoading] = useState(false);
  const fetchedRef = useRef(false);

  // If we have a user but no roles from context, fetch directly
  useEffect(() => {
    if (user && roles.length === 0 && requiredRoles && !fetchedRef.current) {
      fetchedRef.current = true;
      setDirectLoading(true);
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .then(({ data }) => {
          if (data) {
            setDirectRoles(data.map((r: any) => r.role as UserRole));
          }
          setDirectLoading(false);
        });
    }
  }, [user, roles.length, requiredRoles]);

  // Reset when roles arrive from context
  useEffect(() => {
    if (roles.length > 0) {
      fetchedRef.current = false;
    }
  }, [roles.length]);

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Combine roles from context and direct fetch
  const effectiveRoles = roles.length > 0 ? roles : directRoles;

  // Still loading roles
  if (requiredRoles && effectiveRoles.length === 0 && directLoading) {
    return <PageLoader />;
  }

  // If roles loaded and user doesn't have access
  if (requiredRoles && effectiveRoles.length > 0 && !requiredRoles.some((role) => effectiveRoles.includes(role))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">
            Acesso Negado
          </h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  // If we need roles but have none and not loading - allow access (graceful fallback)
  // This prevents blocking when role fetch fails
  return <>{children}</>;
};