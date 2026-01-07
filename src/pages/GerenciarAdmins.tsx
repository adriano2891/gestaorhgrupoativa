import { useState } from "react";
import { Shield, UserPlus, Edit, Trash2, Mail, Loader2 } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useAdmins, useDeleteAdmin, type Admin } from "@/hooks/useAdmins";
import { useAdminsRealtime } from "@/hooks/useRealtimeUpdates";
import { AdminDialog } from "@/components/admins/AdminDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const GerenciarAdmins = () => {
  const { data: admins = [], isLoading } = useAdmins();
  const deleteAdmin = useDeleteAdmin();
  useAdminsRealtime();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | undefined>();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: "Super Admin",
      rh: "Admin RH",
      gestor: "Gestor",
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: "bg-red-100 text-red-700",
      rh: "bg-blue-100 text-blue-700",
      gestor: "bg-green-100 text-green-700",
    };
    return colors[role as keyof typeof colors] || "";
  };

  const handleAddAdmin = () => {
    setSelectedAdmin(undefined);
    setDialogOpen(true);
  };

  const handleEditAdmin = (admin: Admin) => {
    setSelectedAdmin(admin);
    setDialogOpen(true);
  };

  const handleDeleteAdmin = async (userId: string) => {
    await deleteAdmin.mutateAsync(userId);
  };

  const permissions = [
    {
      role: "Super Admin",
      description: "Acesso completo a todas as funcionalidades do sistema",
      permissions: [
        "Gerenciar usuários e administradores",
        "Configurações do sistema",
        "Todos os módulos de RH",
        "Relatórios financeiros",
      ],
    },
    {
      role: "Admin RH",
      description: "Acesso aos módulos de gestão de pessoas",
      permissions: [
        "Gestão de funcionários",
        "Banco de talentos",
        "Holerites e folha de ponto",
        "Relatórios de RH",
      ],
    },
    {
      role: "Admin Financeiro",
      description: "Acesso aos módulos financeiros",
      permissions: [
        "Folha de pagamento",
        "Relatórios financeiros",
        "Gestão de benefícios",
        "Análises de custos",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <BackButton to="/gestao-rh" variant="light" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#40e0d0' }}>
            Gerenciar Admins
          </h1>
          <p className="mt-1" style={{ color: '#40e0d0' }}>
            Gerencie administradores e suas permissões
          </p>
        </div>
        <Button onClick={handleAddAdmin}>
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar Admin
        </Button>
      </div>

      <AdminDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        admin={selectedAdmin}
      />

      {/* Tabela de Admins */}
      <Card>
        <CardHeader>
          <CardTitle>Administradores Ativos</CardTitle>
          <CardDescription>
            {admins.length} administrador(es) ativo(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Administrador</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(admin.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{admin.nome}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {admin.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(admin.roles[0])}>
                      <Shield className="h-3 w-3 mr-1" />
                      {getRoleLabel(admin.roles[0])}
                    </Badge>
                  </TableCell>
                  <TableCell>{admin.departamento || "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(admin.updated_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Ativo</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditAdmin(admin)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Remover Administrador?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação removerá as permissões administrativas de{" "}
                              {admin.nome}. O usuário continuará no sistema como
                              funcionário.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAdmin(admin.id)}
                            >
                              Confirmar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* Níveis de Permissão */}
      <Card>
        <CardHeader>
          <CardTitle>Níveis de Permissão</CardTitle>
          <CardDescription>
            Entenda os diferentes níveis de acesso do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {permissions.map((perm) => (
              <Card key={perm.role} className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    {perm.role}
                  </CardTitle>
                  <CardDescription>{perm.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {perm.permissions.map((p) => (
                      <li key={p} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GerenciarAdmins;
