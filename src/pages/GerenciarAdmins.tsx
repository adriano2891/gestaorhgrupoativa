import { useState } from "react";
import { Shield, UserPlus, Edit, Trash2, Mail } from "lucide-react";
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

const mockAdmins = [
  {
    id: "1",
    name: "Carlos Silva",
    email: "carlos.silva@ativarh.com",
    role: "super-admin" as const,
    department: "TI",
    lastAccess: "2025-10-30 14:30",
    status: "active" as const,
  },
  {
    id: "2",
    name: "Patrícia Oliveira",
    email: "patricia.oliveira@ativarh.com",
    role: "admin-rh" as const,
    department: "Recursos Humanos",
    lastAccess: "2025-10-30 10:15",
    status: "active" as const,
  },
  {
    id: "3",
    name: "Roberto Mendes",
    email: "roberto.mendes@ativarh.com",
    role: "admin-financeiro" as const,
    department: "Financeiro",
    lastAccess: "2025-10-29 16:45",
    status: "active" as const,
  },
  {
    id: "4",
    name: "Juliana Costa",
    email: "juliana.costa@ativarh.com",
    role: "admin-rh" as const,
    department: "Recursos Humanos",
    lastAccess: "2025-10-28 11:20",
    status: "inactive" as const,
  },
];

const GerenciarAdmins = () => {
  const [admins] = useState(mockAdmins);

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
      "super-admin": "Super Admin",
      "admin-rh": "Admin RH",
      "admin-financeiro": "Admin Financeiro",
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      "super-admin": "bg-red-100 text-red-700",
      "admin-rh": "bg-blue-100 text-blue-700",
      "admin-financeiro": "bg-green-100 text-green-700",
    };
    return colors[role as keyof typeof colors] || "";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-foreground">
            Gerenciar Admins
          </h1>
          <p className="text-primary-foreground/80 mt-1">
            Gerencie administradores e suas permissões
          </p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar Admin
        </Button>
      </div>

      {/* Tabela de Admins */}
      <Card>
        <CardHeader>
          <CardTitle>Administradores Ativos</CardTitle>
          <CardDescription>
            {admins.filter((a) => a.status === "active").length}{" "}
            administrador(es) ativo(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                          {getInitials(admin.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{admin.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {admin.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(admin.role)}>
                      <Shield className="h-3 w-3 mr-1" />
                      {getRoleLabel(admin.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>{admin.department}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {admin.lastAccess}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={admin.status === "active" ? "default" : "secondary"}
                    >
                      {admin.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
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
                              Esta ação não pode ser desfeita. O administrador{" "}
                              {admin.name} perderá todos os acessos ao sistema.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction>Confirmar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
