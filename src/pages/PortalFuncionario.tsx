import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoginFuncionario } from "@/components/ponto/LoginFuncionario";
import { PainelPonto } from "@/components/ponto/PainelPonto";
import { Skeleton } from "@/components/ui/skeleton";

const PortalFuncionario = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-primary-dark flex items-center justify-center p-4">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Se usuário estiver logado, mostra o painel de ponto
  if (user) {
    return <PainelPonto />;
  }

  // Se não estiver logado, mostra tela de login
  return <LoginFuncionario />;
};

export default PortalFuncionario;
