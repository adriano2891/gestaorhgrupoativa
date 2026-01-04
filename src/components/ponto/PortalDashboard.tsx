import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Clock, FileText, Calendar, Bell, User, Gift, GraduationCap, MessageCircle } from "lucide-react";
import { usePortalAuth } from "./PortalAuthProvider";
import { toast } from "sonner";

interface PortalDashboardProps {
  onNavigate: (section: string) => void;
}

export const PortalDashboard = ({ onNavigate }: PortalDashboardProps) => {
  const { profile, signOut } = usePortalAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Logout realizado com sucesso");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  const menuItems = [
    {
      id: "ponto",
      title: "Registro de Ponto",
      description: "Registrar entrada, pausas e saída",
      icon: Clock,
      color: "from-primary/10 to-primary/5",
      iconColor: "text-primary",
    },
    {
      id: "holerite",
      title: "Meu Holerite",
      description: "Visualizar e baixar contracheques",
      icon: FileText,
      color: "from-blue-500/10 to-blue-500/5",
      iconColor: "text-blue-600",
    },
    {
      id: "ferias",
      title: "Férias e Licenças",
      description: "Solicitar e acompanhar saldo",
      icon: Calendar,
      color: "from-green-500/10 to-green-500/5",
      iconColor: "text-green-600",
    },
    {
      id: "comunicados",
      title: "Comunicados Internos",
      description: "Avisos e notícias da empresa",
      icon: Bell,
      color: "from-yellow-500/10 to-yellow-500/5",
      iconColor: "text-yellow-600",
    },
    {
      id: "perfil",
      title: "Perfil do Funcionário",
      description: "Atualizar informações pessoais",
      icon: User,
      color: "from-purple-500/10 to-purple-500/5",
      iconColor: "text-purple-600",
    },
    {
      id: "beneficios",
      title: "Benefícios",
      description: "Consultar vale-transporte e mais",
      icon: Gift,
      color: "from-pink-500/10 to-pink-500/5",
      iconColor: "text-pink-600",
    },
    {
      id: "cursos",
      title: "Cursos",
      description: "Treinamentos, certificados e capacitação",
      icon: GraduationCap,
      color: "from-indigo-500/10 to-indigo-500/5",
      iconColor: "text-indigo-600",
    },
    {
      id: "suporte",
      title: "Suporte/Contato RH",
      description: "Dúvidas e solicitações",
      icon: MessageCircle,
      color: "from-orange-500/10 to-orange-500/5",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/50">
      {/* Cabeçalho */}
      <header className="bg-card border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {profile?.nome ? getInitials(profile.nome) : "FN"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Olá, {profile?.nome?.split(" ")[0] || "Funcionário"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {profile?.cargo || "Funcionário"} • {profile?.departamento || ""}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Bem-vindo */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Portal do Funcionário</h1>
            <p className="text-muted-foreground">
              Acesse rapidamente as funcionalidades disponíveis para você
            </p>
          </div>

          {/* Card de Boas-vindas */}
          <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Bem-vindo ao Portal!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use os cards abaixo para navegar pelas funcionalidades disponíveis.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid de Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {menuItems.map((item) => (
              <Card
                key={item.id}
                className="group cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-100"
                onClick={() => onNavigate(item.id)}
              >
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription className="text-sm">{item.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
