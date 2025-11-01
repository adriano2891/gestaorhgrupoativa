import { useState, useEffect } from "react";
import { Plus, Search, Mail, Phone, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const employeeSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().trim().email("E-mail inválido").max(255, "E-mail deve ter no máximo 255 caracteres"),
  phone: z.string().trim().min(1, "Telefone é obrigatório").max(20, "Telefone deve ter no máximo 20 caracteres"),
  position: z.string().trim().min(1, "Cargo é obrigatório").max(100, "Cargo deve ter no máximo 100 caracteres"),
  department: z.string().min(1, "Departamento é obrigatório"),
  status: z.enum(["ativo", "afastado", "demitido"]),
  cpf: z.string().trim().min(11, "CPF deve ter 11 dígitos").max(14, "CPF inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").max(50, "Senha deve ter no máximo 50 caracteres"),
});

const mockEmployees = [
  {
    id: "1",
    name: "João Silva",
    email: "joao.silva@ativarh.com",
    phone: "(11) 98765-4321",
    position: "Desenvolvedor Sênior",
    department: "Tecnologia",
    status: "ativo" as const,
    admissionDate: "2023-01-15",
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria.santos@ativarh.com",
    phone: "(11) 98765-4322",
    position: "Analista de RH",
    department: "Recursos Humanos",
    status: "ativo" as const,
    admissionDate: "2022-06-10",
  },
  {
    id: "3",
    name: "Pedro Oliveira",
    email: "pedro.oliveira@ativarh.com",
    phone: "(11) 98765-4323",
    position: "Gerente Comercial",
    department: "Comercial",
    status: "ativo" as const,
    admissionDate: "2021-03-20",
  },
  {
    id: "4",
    name: "Ana Costa",
    email: "ana.costa@ativarh.com",
    phone: "(11) 98765-4324",
    position: "Coordenadora Financeira",
    department: "Financeiro",
    status: "afastado" as const,
    admissionDate: "2023-08-05",
  },
  {
    id: "5",
    name: "Carlos Ferreira",
    email: "carlos.ferreira@ativarh.com",
    phone: "(11) 98765-4325",
    position: "Assistente de Operações",
    department: "Operações",
    status: "demitido" as const,
    admissionDate: "2020-11-12",
  },
];

const Funcionarios = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("Todos");
  const [employees, setEmployees] = useState<typeof mockEmployees>([]);
  const [editingEmployee, setEditingEmployee] = useState<typeof mockEmployees[0] | null>(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editPassword, setEditPassword] = useState("");
  const [editSalary, setEditSalary] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editAdmissionDate, setEditAdmissionDate] = useState("");
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "Tecnologia",
    status: "ativo" as const,
    cpf: "",
    password: "",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Buscar funcionários do banco de dados
  useEffect(() => {
    const fetchEmployees = async () => {
      const { data: profilesData, error } = await supabase
        .from("profiles")
        .select(`
          id,
          nome,
          email,
          cargo,
          departamento,
          created_at,
          user_roles!inner(role)
        `)
        .eq("user_roles.role", "funcionario");

      if (error) {
        console.error("Erro ao buscar funcionários:", error);
        toast({
          title: "Erro ao carregar funcionários",
          description: "Não foi possível carregar a lista de funcionários.",
          variant: "destructive",
        });
        return;
      }

      // Transformar dados do banco para o formato usado na interface
      const formattedEmployees = profilesData.map((profile: any) => ({
        id: profile.id,
        name: profile.nome,
        email: profile.email,
        phone: "(00) 00000-0000", // Placeholder - adicione campo phone na tabela se necessário
        position: profile.cargo || "Não informado",
        department: profile.departamento || "Não informado",
        status: "ativo" as const, // Placeholder - adicione campo status se necessário
        admissionDate: new Date(profile.created_at).toISOString().split('T')[0],
      }));

      setEmployees(formattedEmployees);
    };

    fetchEmployees();
  }, [toast]);

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "Todos" || emp.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEdit = async (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setEditingEmployee({ ...employee });
      
      // Buscar dados completos do banco
      const { data: profileData } = await supabase
        .from("profiles")
        .select("cpf, salario")
        .eq("id", employeeId)
        .maybeSingle();
      
      if (profileData) {
        setEditCpf(profileData.cpf || "");
        setEditSalary(profileData.salario ? profileData.salario.toString() : "");
      }
      
      setEditPassword("");
      setEditAdmissionDate(employee.admissionDate);
      setIsEditDialogOpen(true);
    }
  };

  const handleDelete = (employeeId: string) => {
    setDeletingEmployeeId(employeeId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingEmployeeId) {
      try {
        // Deletar role do funcionário (isso vai cascatear para outras tabelas)
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", deletingEmployeeId)
          .eq("role", "funcionario");
        
        if (error) {
          throw error;
        }

        // Remover da lista local
        setEmployees(employees.filter(emp => emp.id !== deletingEmployeeId));
        
        toast({
          title: "Funcionário excluído",
          description: "O funcionário foi removido com sucesso.",
        });
      } catch (error: any) {
        toast({
          title: "Erro ao excluir funcionário",
          description: error.message || "Não foi possível excluir o funcionário.",
          variant: "destructive",
        });
      } finally {
        setDeletingEmployeeId(null);
        setIsDeleteDialogOpen(false);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (editingEmployee) {
      try {
        // Preparar dados para atualização
        const updateData: any = {
          nome: editingEmployee.name,
          email: editingEmployee.email,
          cargo: editingEmployee.position,
          departamento: editingEmployee.department,
        };

        // Adicionar salário se foi fornecido
        if (editSalary && parseFloat(editSalary) > 0) {
          updateData.salario = parseFloat(editSalary);
        }

        // Atualizar dados no perfil
        const { error: profileError } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", editingEmployee.id);

        if (profileError) throw profileError;

        // Se senha foi fornecida, atualizar no auth
        if (editPassword && editPassword.length >= 6) {
          const { error: passwordError } = await supabase.auth.admin.updateUserById(
            editingEmployee.id,
            { password: editPassword }
          );
          
          if (passwordError) {
            console.error("Erro ao atualizar senha:", passwordError);
            toast({
              title: "Atenção",
              description: "Dados atualizados, mas não foi possível alterar a senha.",
              variant: "destructive",
            });
          }
        }

        // Atualizar lista local
        setEmployees(employees.map(emp => 
          emp.id === editingEmployee.id ? editingEmployee : emp
        ));
        
        toast({
          title: "Funcionário atualizado",
          description: "Os dados do funcionário foram atualizados com sucesso.",
        });
        
        setIsEditDialogOpen(false);
        setEditingEmployee(null);
        setEditPassword("");
        setEditSalary("");
      } catch (error: any) {
        console.error("Erro ao atualizar funcionário:", error);
        toast({
          title: "Erro ao atualizar",
          description: error.message || "Não foi possível atualizar os dados.",
          variant: "destructive",
        });
      }
    }
  };

  const updateEditingEmployee = (field: string, value: string) => {
    if (editingEmployee) {
      setEditingEmployee({ ...editingEmployee, [field]: value });
    }
  };

  const handleAddEmployee = () => {
    setNewEmployee({
      name: "",
      email: "",
      phone: "",
      position: "",
      department: "Tecnologia",
      status: "ativo",
      cpf: "",
      password: "",
    });
    setValidationErrors({});
    setIsAddDialogOpen(true);
  };

  const updateNewEmployee = (field: string, value: string) => {
    setNewEmployee({ ...newEmployee, [field]: value });
    // Clear validation error for this field when user types
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: "" });
    }
  };

  const handleSaveNewEmployee = async () => {
    try {
      // Validate input
      employeeSchema.parse(newEmployee);
      
      const cpfNumeros = newEmployee.cpf.replace(/\D/g, "");
      
      // Verificar se o email já existe
      const { data: existingEmail } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", newEmployee.email)
        .maybeSingle();

      if (existingEmail) {
        throw new Error("E-mail já cadastrado no sistema");
      }
      
      // Verificar se o CPF já existe
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("cpf", cpfNumeros)
        .maybeSingle();

      if (existingProfile) {
        throw new Error("CPF já cadastrado no sistema");
      }
      
      // Criar usuário no sistema de autenticação com todos os dados
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEmployee.email,
        password: newEmployee.password,
        options: {
          data: {
            nome: newEmployee.name,
            cpf: cpfNumeros,
            cargo: newEmployee.position,
            departamento: newEmployee.department,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) {
        // Tratar erro de usuário já existente
        if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
          throw new Error("E-mail já cadastrado no sistema de autenticação");
        }
        throw new Error(`Erro ao criar usuário: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error("Falha ao criar usuário");
      }

      // Adicionar o novo funcionário à lista local
      const novoFuncionario = {
        id: authData.user.id,
        name: newEmployee.name,
        email: newEmployee.email,
        phone: newEmployee.phone,
        position: newEmployee.position,
        department: newEmployee.department,
        status: newEmployee.status,
        admissionDate: new Date().toISOString().split('T')[0],
      };

      setEmployees([...employees, novoFuncionario]);

      toast({
        title: "Funcionário adicionado com sucesso!",
        description: `${newEmployee.name} foi cadastrado e pode acessar o Portal do Funcionário com CPF e senha.`,
      });
      
      // Limpar o formulário
      setNewEmployee({
        name: "",
        email: "",
        phone: "",
        position: "",
        department: "Tecnologia",
        status: "ativo" as const,
        cpf: "",
        password: "",
      });
      
      setIsAddDialogOpen(false);
      setValidationErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        toast({
          title: "Erro de validação",
          description: "Por favor, corrija os erros no formulário.",
          variant: "destructive",
        });
      } else {
        console.error("Erro ao adicionar funcionário:", error);
        toast({
          title: "Erro ao adicionar funcionário",
          description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-foreground">
            Funcionários
          </h1>
          <p className="text-primary-foreground/80 mt-1">
            Gerencie todos os funcionários da empresa
          </p>
        </div>
        <Button onClick={handleAddEmployee}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Funcionário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Lista de Funcionários</CardTitle>
              <CardDescription>
                {filteredEmployees.length} funcionário(s) encontrado(s)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar funcionário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="Recursos Humanos">
                    Recursos Humanos
                  </SelectItem>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                  <SelectItem value="Financeiro">Financeiro</SelectItem>
                  <SelectItem value="Operações">Operações</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Admissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(employee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {employee.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="text-muted-foreground">E-mail</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span className="text-muted-foreground">
                          {employee.phone}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(employee.admissionDate).toLocaleDateString(
                      "pt-BR"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        employee.status === "ativo" 
                          ? "default" 
                          : employee.status === "demitido"
                          ? "destructive"
                          : "outline"
                      }
                      className={employee.status === "afastado" ? "bg-yellow-500 text-white hover:bg-yellow-600 border-transparent" : ""}
                    >
                      {employee.status === "ativo" 
                        ? "Ativo" 
                        : employee.status === "afastado"
                        ? "Afastado"
                        : "Demitido"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(employee.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(employee.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum funcionário encontrado com os filtros selecionados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
            <DialogDescription>
              Atualize as informações do funcionário
            </DialogDescription>
          </DialogHeader>
          {editingEmployee && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={editingEmployee.name}
                  onChange={(e) => updateEditingEmployee('name', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={editCpf}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingEmployee.email}
                  onChange={(e) => updateEditingEmployee('email', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={editingEmployee.phone}
                  onChange={(e) => updateEditingEmployee('phone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Deixe em branco para não alterar"
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo de 6 caracteres. Deixe em branco se não quiser alterar.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={editingEmployee.position}
                  onChange={(e) => updateEditingEmployee('position', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salary">Salário</Label>
                <Input
                  id="salary"
                  type="number"
                  step="0.01"
                  value={editSalary}
                  onChange={(e) => setEditSalary(e.target.value)}
                  placeholder="R$ 0,00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Departamento</Label>
                <Select
                  value={editingEmployee.department}
                  onValueChange={(value) => updateEditingEmployee('department', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                    <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                    <SelectItem value="Comercial">Comercial</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="Operações">Operações</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admissionDate">Data de Admissão</Label>
                <Input
                  id="admissionDate"
                  type="date"
                  value={editAdmissionDate}
                  onChange={(e) => setEditAdmissionDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editingEmployee.status}
                  onValueChange={(value) => updateEditingEmployee('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="afastado">Afastado</SelectItem>
                    <SelectItem value="demitido">Demitido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Adicionar Funcionário */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Funcionário</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo funcionário
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-name">Nome *</Label>
              <Input
                id="new-name"
                value={newEmployee.name}
                onChange={(e) => updateNewEmployee('name', e.target.value)}
                className={validationErrors.name ? "border-destructive" : ""}
              />
              {validationErrors.name && (
                <p className="text-sm text-destructive">{validationErrors.name}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-email">E-mail *</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmployee.email}
                onChange={(e) => updateNewEmployee('email', e.target.value)}
                className={validationErrors.email ? "border-destructive" : ""}
              />
              {validationErrors.email && (
                <p className="text-sm text-destructive">{validationErrors.email}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-phone">Telefone *</Label>
              <Input
                id="new-phone"
                value={newEmployee.phone}
                onChange={(e) => updateNewEmployee('phone', e.target.value)}
                placeholder="(11) 98765-4321"
                className={validationErrors.phone ? "border-destructive" : ""}
              />
              {validationErrors.phone && (
                <p className="text-sm text-destructive">{validationErrors.phone}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-position">Cargo *</Label>
              <Input
                id="new-position"
                value={newEmployee.position}
                onChange={(e) => updateNewEmployee('position', e.target.value)}
                className={validationErrors.position ? "border-destructive" : ""}
              />
              {validationErrors.position && (
                <p className="text-sm text-destructive">{validationErrors.position}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-department">Departamento *</Label>
              <Select
                value={newEmployee.department}
                onValueChange={(value) => updateNewEmployee('department', value)}
              >
                <SelectTrigger className={validationErrors.department ? "border-destructive" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                  <SelectItem value="Financeiro">Financeiro</SelectItem>
                  <SelectItem value="Operações">Operações</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.department && (
                <p className="text-sm text-destructive">{validationErrors.department}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-cpf">CPF *</Label>
              <Input
                id="new-cpf"
                value={newEmployee.cpf}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  const formatted = value
                    .replace(/(\d{3})(\d)/, "$1.$2")
                    .replace(/(\d{3})(\d)/, "$1.$2")
                    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                  updateNewEmployee('cpf', formatted);
                }}
                placeholder="000.000.000-00"
                maxLength={14}
                className={validationErrors.cpf ? "border-destructive" : ""}
              />
              {validationErrors.cpf && (
                <p className="text-sm text-destructive">{validationErrors.cpf}</p>
              )}
              <p className="text-xs text-muted-foreground">
                O CPF será usado para login no Portal do Funcionário
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">Senha *</Label>
              <Input
                id="new-password"
                type="password"
                value={newEmployee.password}
                onChange={(e) => updateNewEmployee('password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={validationErrors.password ? "border-destructive" : ""}
              />
              {validationErrors.password && (
                <p className="text-sm text-destructive">{validationErrors.password}</p>
              )}
              <p className="text-xs text-muted-foreground">
                A senha será usada para login no Portal do Funcionário
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-status">Status</Label>
              <Select
                value={newEmployee.status}
                onValueChange={(value) => updateNewEmployee('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="afastado">Afastado</SelectItem>
                  <SelectItem value="demitido">Demitido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveNewEmployee}>Adicionar Funcionário</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Funcionarios;
