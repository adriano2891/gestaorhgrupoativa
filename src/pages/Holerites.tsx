import { useState } from "react";
import { Upload as UploadIcon } from "lucide-react";
import { useFuncionariosRealtime, useHoleritesRealtime } from "@/hooks/useRealtimeUpdates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HoleriteCard } from "@/components/holerites/HoleriteCard";
import { HoleriteViewer } from "@/components/holerites/HoleriteViewer";
import { HoleriteFilters } from "@/components/holerites/HoleriteFilters";
import { UploadHolerite } from "@/components/holerites/UploadHolerite";
import { SendHoleriteDialog } from "@/components/holerites/SendHoleriteDialog";
import { useToast } from "@/hooks/use-toast";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { Skeleton } from "@/components/ui/skeleton";
import { useEnviarHolerite } from "@/hooks/useLogsEnvioHolerites";
import { useHolerites } from "@/hooks/useHolerites";

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
  // Sincronização em tempo real
  useFuncionariosRealtime();
  useHoleritesRealtime();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("10");
  const [selectedDepartment, setSelectedDepartment] = useState("Todos");
  const [selectedPosition, setSelectedPosition] = useState("Todos");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; nome: string; email?: string } | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<typeof mockPayslipData | null>(null);
  const { toast } = useToast();
  const { data: funcionarios, isLoading } = useFuncionarios();
  const enviarHolerite = useEnviarHolerite();

  const filteredEmployees = (funcionarios || []).filter((emp) => {
    const matchesSearch = emp.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "Todos" || emp.departamento === selectedDepartment;
    const matchesPosition = selectedPosition === "Todos" || (emp.cargo && emp.cargo.includes(selectedPosition));
    return matchesSearch && matchesDepartment && matchesPosition;
  });

  const handleViewPayslip = (id: string) => {
    const employee = funcionarios?.find((emp) => emp.id === id);
    if (employee) {
      setSelectedPayslip({
        ...mockPayslipData,
        employeeName: employee.nome,
        position: employee.cargo || "Não informado",
        department: employee.departamento || "Não informado",
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
    const employee = funcionarios?.find((emp) => emp.id === id);
    if (employee) {
      setSelectedEmployee({
        id: employee.id,
        nome: employee.nome,
        email: employee.email,
      });
      setSendDialogOpen(true);
    }
  };

  const handleUpload = (employeeId: string, file: File, month: string, year: string) => {
    console.log("Upload:", { employeeId, file, month, year });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-foreground">Holerites (Visão ADM)</h1>
            <p className="text-primary-foreground/80 mt-1">
              Gerencie e visualize os holerites de todos os funcionários
            </p>
          </div>
          <Button disabled>
            <UploadIcon className="h-4 w-4 mr-2" />
            Upload de Holerite
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-foreground">Holerites (Visão ADM)</h1>
          <p className="text-primary-foreground/80 mt-1 text-xs sm:text-sm md:text-base">
            Gerencie e visualize os holerites de todos os funcionários
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="w-full sm:w-auto">
          <UploadIcon className="h-4 w-4 mr-2" />
          <span>Upload de Holerite</span>
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
        employees={(funcionarios || []).map((emp) => ({ id: emp.id, name: emp.nome }))}
        onUpload={handleUpload}
      />

      {selectedEmployee && (
        <SendHoleriteDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          employee={selectedEmployee}
        />
      )}
    </div>
  );
};

export default Holerites;
