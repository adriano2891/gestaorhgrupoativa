import { useAuth } from "./AuthProvider";
import { Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

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
  const [rolesTimeout, setRolesTimeout] = useState(false);

  // Safety timeout: don't block forever waiting for roles
  useEffect(() => {
    if (user && roles.length === 0 && !rolesTimeout) {
      const timer = setTimeout(() => setRolesTimeout(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [user, roles.length, rolesTimeout]);

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If requiredRoles specified, wait for roles to load before deciding
  const rolesReady = roles.length > 0 || rolesTimeout;
  if (requiredRoles && !rolesReady) {
    return <PageLoader />;
  }

  if (requiredRoles && rolesReady && !requiredRoles.some((role) => roles.includes(role))) {
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

  return <>{children}</>;
};
