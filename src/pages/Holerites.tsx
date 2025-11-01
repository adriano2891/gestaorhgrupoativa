import { useState } from "react";
import { Upload as UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HoleriteCard } from "@/components/holerites/HoleriteCard";
import { HoleriteViewer } from "@/components/holerites/HoleriteViewer";
import { HoleriteFilters } from "@/components/holerites/HoleriteFilters";
import { UploadHolerite } from "@/components/holerites/UploadHolerite";
import { useToast } from "@/hooks/use-toast";

// Mock data
const mockEmployees = [
  {
    id: "1",
    name: "João Silva",
    position: "Desenvolvedor Sênior",
    department: "Tecnologia",
    status: "active" as const,
    hasPayslip: true,
  },
  {
    id: "2",
    name: "Maria Santos",
    position: "Analista de RH",
    department: "Recursos Humanos",
    status: "active" as const,
    hasPayslip: true,
  },
  {
    id: "3",
    name: "Pedro Oliveira",
    position: "Gerente Comercial",
    department: "Comercial",
    status: "active" as const,
    hasPayslip: true,
  },
  {
    id: "4",
    name: "Ana Costa",
    position: "Coordenadora Financeira",
    department: "Financeiro",
    status: "active" as const,
    hasPayslip: false,
  },
  {
    id: "5",
    name: "Carlos Ferreira",
    position: "Assistente de Operações",
    department: "Operações",
    status: "inactive" as const,
    hasPayslip: true,
  },
];

const mockPayslipData = {
  employeeName: "João Silva",
  position: "Desenvolvedor Sênior",
  department: "Tecnologia",
  month: "Outubro",
  year: 2025,
  salary: 8500.0,
  benefits: 1200.0,
  deductions: 350.0,
  fgts: 680.0,
  inss: 765.5,
  irrf: 1250.75,
  netSalary: 6653.75,
};

const Holerites = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("10");
  const [selectedDepartment, setSelectedDepartment] = useState("Todos");
  const [selectedPosition, setSelectedPosition] = useState("Todos");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<typeof mockPayslipData | null>(null);
  const { toast } = useToast();

  const filteredEmployees = mockEmployees.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "Todos" || emp.department === selectedDepartment;
    const matchesPosition = selectedPosition === "Todos" || emp.position.includes(selectedPosition);
    return matchesSearch && matchesDepartment && matchesPosition;
  });

  const handleViewPayslip = (id: string) => {
    const employee = mockEmployees.find((emp) => emp.id === id);
    if (employee) {
      setSelectedPayslip({
        ...mockPayslipData,
        employeeName: employee.name,
        position: employee.position,
        department: employee.department,
      });
      setViewerOpen(true);
    }
  };

  const handleDownload = (id: string) => {
    toast({
      title: "Download iniciado",
      description: "O holerite está sendo baixado...",
    });
  };

  const handleSendEmail = (id: string) => {
    toast({
      title: "E-mail enviado",
      description: "O holerite foi enviado para o e-mail do funcionário.",
    });
  };

  const handleUpload = (employeeId: string, file: File, month: string, year: string) => {
    console.log("Upload:", { employeeId, file, month, year });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-foreground">Holerites (Visão ADM)</h1>
          <p className="text-primary-foreground/80 mt-1">
            Gerencie e visualize os holerites de todos os funcionários
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <UploadIcon className="h-4 w-4 mr-2" />
          Upload de Holerite
        </Button>
      </div>

      <HoleriteFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
        selectedPosition={selectedPosition}
        onPositionChange={setSelectedPosition}
      />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Funcionários</CardTitle>
          <CardDescription>
            {filteredEmployees.length} funcionário(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee) => (
              <HoleriteCard
                key={employee.id}
                employee={employee}
                onView={handleViewPayslip}
                onDownload={handleDownload}
                onSendEmail={handleSendEmail}
              />
            ))}
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum funcionário encontrado com os filtros selecionados.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <HoleriteViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        data={selectedPayslip}
        onDownload={() => handleDownload(selectedPayslip?.employeeName || "")}
        onSendEmail={() => handleSendEmail(selectedPayslip?.employeeName || "")}
      />

      <UploadHolerite
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        employees={mockEmployees.map((emp) => ({ id: emp.id, name: emp.name }))}
        onUpload={handleUpload}
      />
    </div>
  );
};

export default Holerites;
