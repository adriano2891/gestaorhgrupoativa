import { useState } from "react";
import { Plus, Search, Mail, Phone, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
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
  const [employees, setEmployees] = useState(mockEmployees);
  const [editingEmployee, setEditingEmployee] = useState<typeof mockEmployees[0] | null>(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "Tecnologia",
    status: "ativo" as const,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

  const handleEdit = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      setEditingEmployee({ ...employee });
      setIsEditDialogOpen(true);
    }
  };

  const handleDelete = (employeeId: string) => {
    setDeletingEmployeeId(employeeId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingEmployeeId) {
      setEmployees(employees.filter(emp => emp.id !== deletingEmployeeId));
      toast({
        title: "Funcionário excluído",
        description: "O funcionário foi removido com sucesso.",
      });
      setDeletingEmployeeId(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSaveEdit = () => {
    if (editingEmployee) {
      setEmployees(employees.map(emp => 
        emp.id === editingEmployee.id ? editingEmployee : emp
      ));
      toast({
        title: "Funcionário atualizado",
        description: "Os dados do funcionário foram atualizados com sucesso.",
      });
      setIsEditDialogOpen(false);
      setEditingEmployee(null);
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

  const handleSaveNewEmployee = () => {
    try {
      // Validate input
      employeeSchema.parse(newEmployee);
      
      // Generate new ID
      const maxId = Math.max(...employees.map(emp => parseInt(emp.id)), 0);
      const newId = (maxId + 1).toString();
      
      // Create new employee object
      const employeeToAdd = {
        ...newEmployee,
        id: newId,
        admissionDate: new Date().toISOString().split('T')[0],
      };
      
      // Add to employees list
      setEmployees([...employees, employeeToAdd]);
      
      toast({
        title: "Funcionário adicionado",
        description: "O novo funcionário foi cadastrado com sucesso.",
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
                />
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
