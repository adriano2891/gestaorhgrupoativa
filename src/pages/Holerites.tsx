import { useState } from "react";
import { Upload as UploadIcon, RefreshCw } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
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
import { useHolerites, Holerite } from "@/hooks/useHolerites";
import { useQueryClient } from "@tanstack/react-query";

const Holerites = () => {
  // Sincronização em tempo real
  useFuncionariosRealtime();
  useHoleritesRealtime();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("Todos");
  const [selectedPosition, setSelectedPosition] = useState("Todos");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; nome: string; email?: string } | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [selectedHolerite, setSelectedHolerite] = useState<Holerite | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: funcionarios, isLoading: isLoadingFuncionarios } = useFuncionarios();
  const { data: holerites, isLoading: isLoadingHolerites } = useHolerites();

  // Mapear holerites por funcionário e mês/ano
  const holeritesByEmployee = (holerites || []).reduce((acc, h) => {
    if (!acc[h.user_id]) acc[h.user_id] = [];
    acc[h.user_id].push(h);
    return acc;
  }, {} as Record<string, Holerite[]>);

  const filteredEmployees = (funcionarios || []).filter((emp) => {
    const matchesSearch = emp.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "Todos" || emp.departamento === selectedDepartment;
    const matchesPosition = selectedPosition === "Todos" || (emp.cargo && emp.cargo.includes(selectedPosition));
    
    // Filtrar por mês se selecionado
    if (selectedMonth !== "all") {
      const monthNum = parseInt(selectedMonth);
      const hasHoleriteForMonth = holeritesByEmployee[emp.id]?.some(h => h.mes === monthNum);
      if (!hasHoleriteForMonth) return false;
    }
    
    return matchesSearch && matchesDepartment && matchesPosition;
  });

  // Função para obter o holerite mais recente de um funcionário
  const getLatestHolerite = (employeeId: string): Holerite | null => {
    const empHolerites = holeritesByEmployee[employeeId];
    if (!empHolerites || empHolerites.length === 0) return null;
    return empHolerites.sort((a, b) => {
      if (a.ano !== b.ano) return b.ano - a.ano;
      return b.mes - a.mes;
    })[0];
  };

  const handleViewPayslip = (id: string) => {
    const employee = funcionarios?.find((emp) => emp.id === id);
    const holerite = getLatestHolerite(id);
    
    if (employee) {
      const payslipData = {
        employeeName: employee.nome,
        position: employee.cargo || "Não informado",
        department: employee.departamento || "Não informado",
        month: holerite ? getMesNome(holerite.mes) : "N/A",
        year: holerite?.ano || new Date().getFullYear(),
        salary: holerite?.salario_bruto || employee.salario || 0,
        benefits: 0,
        deductions: holerite?.descontos || 0,
        fgts: 0,
        inss: 0,
        irrf: 0,
        netSalary: holerite?.salario_liquido || 0,
      };
      setSelectedPayslip(payslipData);
      setSelectedHolerite(holerite);
      setViewerOpen(true);
    }
  };

  const getMesNome = (mes: number) => {
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return meses[mes - 1];
  };

  const handleDownload = (id: string) => {
    const holerite = getLatestHolerite(id);
    if (holerite?.arquivo_url) {
      window.open(holerite.arquivo_url, '_blank');
    } else {
      toast({
        title: "Arquivo não disponível",
        description: "Este funcionário não possui holerite com arquivo anexado.",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = (id: string) => {
    const employee = funcionarios?.find((emp) => emp.id === id);
    const holerite = getLatestHolerite(id);
    
    if (employee && holerite) {
      setSelectedEmployee({
        id: employee.id,
        nome: employee.nome,
        email: employee.email,
      });
      setSelectedHolerite(holerite);
      setSendDialogOpen(true);
    } else {
      toast({
        title: "Holerite não disponível",
        description: "Este funcionário não possui holerite cadastrado.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["holerites"] });
    queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
    toast({
      title: "Dados atualizados",
      description: "A lista de holerites foi atualizada.",
    });
  };

  const isLoading = isLoadingFuncionarios || isLoadingHolerites;

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
      <BackButton to="/gestao-rh" variant="light" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-black">Holerites (Visão ADM)</h1>
          <p className="mt-1 text-xs sm:text-sm md:text-base font-bold text-black">
            Gerencie e visualize os holerites de todos os funcionários ({holerites?.length || 0} registros)
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleRefresh} className="flex-shrink-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setUploadOpen(true)} className="flex-1 sm:flex-initial">
            <UploadIcon className="h-4 w-4 mr-2" />
            <span>Upload de Holerite</span>
          </Button>
        </div>
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
                holerite={getLatestHolerite(employee.id)}
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
        onUploadSuccess={handleRefresh}
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
