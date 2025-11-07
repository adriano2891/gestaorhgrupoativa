import { useState, useEffect } from "react";
import { Calendar, Clock, Download, Filter, AlertTriangle, CheckCircle, XCircle, FileText, Eye, FileSpreadsheet, Pencil } from "lucide-react";
import { usePontoRealtime } from "@/hooks/useRealtimeUpdates";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DayRecord {
  day: number;
  entrada?: string;
  saida?: string;
  saida_almoco?: string;
  retorno_almoco?: string;
  total_horas?: string;
  horas_extras?: string;
  status: "completo" | "incompleto" | "ausente" | "falta";
}

interface EmployeeMonthRecord {
  employee_id: string;
  employee_name: string;
  departamento?: string;
  days: DayRecord[];
  total_horas_mes: number;
  total_horas_extras: number;
  total_faltas: number;
  status: "completo" | "incompleto";
}

const FolhaPonto = () => {
  usePontoRealtime();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString().padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedEmployee, setSelectedEmployee] = useState("todos");
  const [selectedDepartamento, setSelectedDepartamento] = useState("todos");
  const [viewMode, setViewMode] = useState<"resumo" | "detalhado">("detalhado");
  const [employees, setEmployees] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<string[]>([]);
  const [monthRecords, setMonthRecords] = useState<EmployeeMonthRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingCell, setEditingCell] = useState<{empId: string, day: number, field: 'status' | 'horas_extras'} | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    loadEmployees();
    loadMonthRecords();
  }, [selectedMonth, selectedYear, selectedEmployee, selectedDepartamento]);

  const loadEmployees = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nome, departamento");
    
    if (data) {
      setEmployees(data);
      const depts = [...new Set(data.map(e => e.departamento).filter(Boolean))];
      setDepartamentos(depts as string[]);
    }
  };

  const loadMonthRecords = async () => {
    setLoading(true);
    try {
      const startDate = `${selectedYear}-${selectedMonth}-01`;
      const daysInMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
      const endDate = `${selectedYear}-${selectedMonth}-${daysInMonth}`;

      let query = supabase
        .from("registros_ponto")
        .select("*, profiles!inner(nome, departamento)")
        .gte("data", startDate)
        .lte("data", endDate);

      if (selectedEmployee !== "todos") {
        query = query.eq("user_id", selectedEmployee);
      }

      const { data: registros, error } = await query;

      if (error) throw error;

      // Agrupar por funcionário
      const employeeMap = new Map<string, EmployeeMonthRecord>();

      // Obter lista de funcionários para o filtro
      let employeeList = employees;
      if (selectedEmployee !== "todos") {
        employeeList = employees.filter(e => e.id === selectedEmployee);
      }
      if (selectedDepartamento !== "todos") {
        employeeList = employeeList.filter(e => e.departamento === selectedDepartamento);
      }

      employeeList.forEach(emp => {
        const days: DayRecord[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
          days.push({
            day,
            status: "ausente"
          });
        }

        employeeMap.set(emp.id, {
          employee_id: emp.id,
          employee_name: emp.nome,
          departamento: emp.departamento,
          days,
          total_horas_mes: 0,
          total_horas_extras: 0,
          total_faltas: 0,
          status: "incompleto"
        });
      });

      // Preencher com registros reais
      registros?.forEach((reg: any) => {
        const empRecord = employeeMap.get(reg.user_id);
        if (empRecord) {
          const day = new Date(reg.data).getDate();
          const dayIndex = day - 1;

          const formatTime = (timestamp: string | null) => {
            if (!timestamp) return undefined;
            return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          };

          const formatInterval = (interval: string | null) => {
            if (!interval) return "0h 0min";
            const match = interval.match(/(\d+):(\d+):(\d+)/);
            if (match) {
              const hours = parseInt(match[1]);
              const minutes = parseInt(match[2]);
              return `${hours}h ${minutes}min`;
            }
            return "0h 0min";
          };

          empRecord.days[dayIndex] = {
            day,
            entrada: formatTime(reg.entrada),
            saida: formatTime(reg.saida),
            saida_almoco: formatTime(reg.saida_almoco),
            retorno_almoco: formatTime(reg.retorno_almoco),
            total_horas: formatInterval(reg.total_horas),
            horas_extras: formatInterval(reg.horas_extras),
            status: reg.entrada && reg.saida ? "completo" : reg.entrada ? "incompleto" : "ausente"
          };

          // Calcular totais
          if (reg.total_horas) {
            const match = reg.total_horas.match(/(\d+):(\d+):(\d+)/);
            if (match) {
              empRecord.total_horas_mes += parseInt(match[1]) + parseInt(match[2]) / 60;
            }
          }

          if (reg.horas_extras) {
            const match = reg.horas_extras.match(/(\d+):(\d+):(\d+)/);
            if (match) {
              empRecord.total_horas_extras += parseInt(match[1]) + parseInt(match[2]) / 60;
            }
          }
        }
      });

      // Calcular faltas e status final
      employeeMap.forEach(record => {
        record.total_faltas = record.days.filter(d => d.status === "ausente").length;
        const completos = record.days.filter(d => d.status === "completo").length;
        record.status = completos > 0 ? "completo" : "incompleto";
      });

      setMonthRecords(Array.from(employeeMap.values()));
    } catch (error) {
      console.error("Erro ao carregar registros:", error);
      toast.error("Erro ao carregar registros do mês");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completo": return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "incompleto": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "ausente": return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
      case "falta": return "bg-red-500/10 text-red-700 dark:text-red-400";
      default: return "";
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape
    let yPos = 20;
    
    monthRecords.forEach((record, index) => {
      if (index > 0) {
        doc.addPage();
        yPos = 20;
      }
      
      // Cabeçalho do funcionário
      doc.setFontSize(16);
      doc.text(`${record.employee_name}`, 14, yPos);
      yPos += 6;
      
      doc.setFontSize(10);
      doc.text(`Departamento: ${record.departamento || '-'} | Período: ${selectedMonth}/${selectedYear}`, 14, yPos);
      yPos += 8;
      
      // Resumo do funcionário
      doc.setFontSize(9);
      doc.text(`Total Horas: ${record.total_horas_mes.toFixed(1)}h | Horas Extras: ${record.total_horas_extras.toFixed(1)}h | Faltas: ${record.total_faltas}`, 14, yPos);
      yPos += 5;
      
      // Tabela detalhada
      const tableData = record.days.map(day => [
        day.day.toString().padStart(2, '0'),
        day.entrada || '-',
        day.saida_almoco || '-',
        day.retorno_almoco || '-',
        day.saida || '-',
        day.total_horas || '-',
        day.horas_extras || '-',
        day.status === 'completo' ? 'Completo' : day.status === 'incompleto' ? 'Incompleto' : 'Ausente'
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Dia', 'Entrada', 'Saída Almoço', 'Retorno Almoço', 'Saída', 'Total Horas', 'HE', 'Status']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 7 },
        headStyles: { fillColor: [17, 188, 183] },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 20 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 25 },
          6: { cellWidth: 20 },
          7: { cellWidth: 25 }
        }
      });
    });
    
    const fileName = `folha-ponto-detalhada-${selectedMonth}-${selectedYear}.pdf`;
    doc.save(fileName);
    
    toast.success("PDF detalhado exportado com sucesso!");
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    monthRecords.forEach(record => {
      const data = record.days.map(day => ({
        'Dia': day.day.toString().padStart(2, '0'),
        'Entrada': day.entrada || '-',
        'Saída Almoço': day.saida_almoco || '-',
        'Retorno Almoço': day.retorno_almoco || '-',
        'Saída': day.saida || '-',
        'Total Horas': day.total_horas || '-',
        'Horas Extras': day.horas_extras || '-',
        'Status': day.status === 'completo' ? 'Completo' : day.status === 'incompleto' ? 'Incompleto' : 'Ausente'
      }));
      
      // Adicionar linha de resumo no início
      data.unshift({
        'Dia': 'RESUMO',
        'Entrada': `Total: ${record.total_horas_mes.toFixed(1)}h`,
        'Saída Almoço': `HE: ${record.total_horas_extras.toFixed(1)}h`,
        'Retorno Almoço': `Faltas: ${record.total_faltas}`,
        'Saída': `Depto: ${record.departamento || '-'}`,
        'Total Horas': '',
        'Horas Extras': '',
        'Status': ''
      });
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      const sheetName = record.employee_name.substring(0, 31); // Excel limita a 31 caracteres
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    
    const fileName = `folha-ponto-detalhada-${selectedMonth}-${selectedYear}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast.success("Excel detalhado exportado com sucesso!");
  };

  const handleEditCell = (empId: string, day: number, field: 'status' | 'horas_extras', currentValue: string) => {
    setEditingCell({ empId, day, field });
    setEditValue(currentValue);
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;
    
    try {
      const record = monthRecords.find(r => r.employee_id === editingCell.empId);
      if (!record) return;
      
      const dayData = record.days[editingCell.day - 1];
      const date = `${selectedYear}-${selectedMonth}-${editingCell.day.toString().padStart(2, '0')}`;
      
      if (editingCell.field === 'status') {
        // Atualizar status localmente e recalcular totais
        const updatedRecords = monthRecords.map(r => {
          if (r.employee_id === editingCell.empId) {
            const newDays = [...r.days];
            newDays[editingCell.day - 1] = {
              ...newDays[editingCell.day - 1],
              status: editValue as any
            };
            
            // Recalcular totais
            const total_faltas = newDays.filter(d => d.status === "ausente" || d.status === "falta").length;
            const completos = newDays.filter(d => d.status === "completo").length;
            
            return { 
              ...r, 
              days: newDays,
              total_faltas,
              status: (completos > 0 ? "completo" : "incompleto") as "completo" | "incompleto"
            };
          }
          return r;
        });
        setMonthRecords(updatedRecords);
      } else if (editingCell.field === 'horas_extras') {
        // Atualizar horas extras no banco
        const { error } = await supabase
          .from("registros_ponto")
          .update({ horas_extras: editValue })
          .eq("user_id", editingCell.empId)
          .eq("data", date);
        
        if (error) throw error;
        
        // Atualizar localmente e recalcular totais
        const updatedRecords = monthRecords.map(r => {
          if (r.employee_id === editingCell.empId) {
            const newDays = [...r.days];
            newDays[editingCell.day - 1] = {
              ...newDays[editingCell.day - 1],
              horas_extras: editValue
            };
            
            // Recalcular total de horas extras
            let total_horas_extras = 0;
            newDays.forEach(day => {
              if (day.horas_extras) {
                const match = day.horas_extras.match(/(\d+)h\s*(\d+)min/);
                if (match) {
                  total_horas_extras += parseInt(match[1]) + parseInt(match[2]) / 60;
                }
              }
            });
            
            return { 
              ...r, 
              days: newDays,
              total_horas_extras
            };
          }
          return r;
        });
        setMonthRecords(updatedRecords);
      }
      
      toast.success("Registro atualizado com sucesso!");
      setEditingCell(null);
      setEditValue("");
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
      toast.error("Erro ao salvar alteração");
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  // Calcular estatísticas
  const stats = {
    total_funcionarios: monthRecords.length,
    media_horas_dia: monthRecords.length > 0 
      ? (monthRecords.reduce((sum, r) => sum + r.total_horas_mes, 0) / monthRecords.length / new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate()).toFixed(1)
      : "0",
    total_horas_extras: monthRecords.reduce((sum, r) => sum + r.total_horas_extras, 0).toFixed(1),
    total_ausencias: monthRecords.reduce((sum, r) => sum + r.total_faltas, 0),
    alertas: monthRecords.filter(r => r.total_horas_extras > 20 || r.total_faltas > 3).length
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Folha de Ponto
          </h1>
          <p className="text-muted-foreground mt-1">
            Controle mensal de ponto e horas trabalhadas
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showFilters} onOpenChange={setShowFilters}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filtros Avançados</DialogTitle>
                <DialogDescription>
                  Configure os filtros para visualizar a folha de ponto
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mês</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="01">Janeiro</SelectItem>
                        <SelectItem value="02">Fevereiro</SelectItem>
                        <SelectItem value="03">Março</SelectItem>
                        <SelectItem value="04">Abril</SelectItem>
                        <SelectItem value="05">Maio</SelectItem>
                        <SelectItem value="06">Junho</SelectItem>
                        <SelectItem value="07">Julho</SelectItem>
                        <SelectItem value="08">Agosto</SelectItem>
                        <SelectItem value="09">Setembro</SelectItem>
                        <SelectItem value="10">Outubro</SelectItem>
                        <SelectItem value="11">Novembro</SelectItem>
                        <SelectItem value="12">Dezembro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ano</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Funcionário</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os funcionários</SelectItem>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Departamento</Label>
                  <Select value={selectedDepartamento} onValueChange={setSelectedDepartamento}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os departamentos</SelectItem>
                      {departamentos.map(dept => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={exportToExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Resumo Mensal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Funcionários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.total_funcionarios}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média Horas/Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats.media_horas_dia}h</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Horas Extras Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{stats.total_horas_extras}h</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Ausências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{stats.total_ausencias}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={stats.alertas > 0 ? "border-yellow-500" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${stats.alertas > 0 ? "text-yellow-500" : "text-gray-400"}`} />
              <span className="text-2xl font-bold">{stats.alertas}</span>
            </div>
            {stats.alertas > 0 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                HE ou faltas acima do normal
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs Resumo/Detalhado */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="detalhado">
            <Eye className="h-4 w-4 mr-2" />
            Visão Detalhada
          </TabsTrigger>
          <TabsTrigger value="resumo">
            <FileText className="h-4 w-4 mr-2" />
            Visão Resumida
          </TabsTrigger>
        </TabsList>

        {/* Visão Detalhada */}
        <TabsContent value="detalhado" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  Carregando registros...
                </div>
              </CardContent>
            </Card>
          ) : monthRecords.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  Nenhum registro encontrado para o período selecionado
                </div>
              </CardContent>
            </Card>
          ) : (
            monthRecords.map((record) => (
              <Card key={record.employee_id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(record.employee_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{record.employee_name}</CardTitle>
                        <CardDescription>{record.departamento || "Sem departamento"}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-muted-foreground">Total Horas</div>
                        <div className="font-bold">{record.total_horas_mes.toFixed(1)}h</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Horas Extras</div>
                        <div className="font-bold text-yellow-600">{record.total_horas_extras.toFixed(1)}h</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Faltas</div>
                        <div className="font-bold text-red-600">{record.total_faltas}</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                       <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Dia</TableHead>
                          <TableHead>Entrada</TableHead>
                          <TableHead>Saída Almoço</TableHead>
                          <TableHead>Retorno Almoço</TableHead>
                          <TableHead>Saída</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>HE</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-20">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {record.days.map((day) => (
                          <TableRow key={day.day} className={day.status === "falta" ? "bg-red-50 dark:bg-red-950/20" : ""}>
                            <TableCell className="font-medium">{day.day}</TableCell>
                            <TableCell className="text-sm">{day.entrada || "-"}</TableCell>
                            <TableCell className="text-sm">{day.saida_almoco || "-"}</TableCell>
                            <TableCell className="text-sm">{day.retorno_almoco || "-"}</TableCell>
                            <TableCell className="text-sm">{day.saida || "-"}</TableCell>
                            <TableCell className="text-sm font-medium">{day.total_horas || "-"}</TableCell>
                            <TableCell className="text-sm">
                              {editingCell?.empId === record.employee_id && editingCell?.day === day.day && editingCell?.field === 'horas_extras' ? (
                                <div className="flex gap-1 items-center">
                                  <Input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="h-7 w-24 text-xs"
                                    placeholder="0h 0min"
                                  />
                                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleSaveEdit}>
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleCancelEdit}>
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-yellow-600">{day.horas_extras || "-"}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingCell?.empId === record.employee_id && editingCell?.day === day.day && editingCell?.field === 'status' ? (
                                <div className="flex gap-1 items-center">
                                  <Select value={editValue} onValueChange={setEditValue}>
                                    <SelectTrigger className="h-7 w-32 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="completo">Completo</SelectItem>
                                      <SelectItem value="incompleto">Incompleto</SelectItem>
                                      <SelectItem value="ausente">Ausente</SelectItem>
                                      <SelectItem value="falta">Falta</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleSaveEdit}>
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleCancelEdit}>
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(day.status)}`}>
                                  {day.status === "completo" && <CheckCircle className="h-3 w-3" />}
                                  {day.status === "incompleto" && <AlertTriangle className="h-3 w-3" />}
                                  {day.status === "ausente" && <XCircle className="h-3 w-3" />}
                                  {day.status}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {!editingCell && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={() => handleEditCell(record.employee_id, day.day, 'horas_extras', day.horas_extras || '0h 0min')}
                                    title="Editar HE"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={() => handleEditCell(record.employee_id, day.day, 'status', day.status)}
                                    title="Editar Status"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Visão Resumida */}
        <TabsContent value="resumo">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Mês</CardTitle>
              <CardDescription>
                Período: {selectedMonth}/{selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead className="text-right">Total Horas</TableHead>
                    <TableHead className="text-right">Horas Extras</TableHead>
                    <TableHead className="text-right">Faltas</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : monthRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum registro encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    monthRecords.map((record) => (
                      <TableRow key={record.employee_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {getInitials(record.employee_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{record.employee_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{record.departamento || "-"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {record.total_horas_mes.toFixed(1)}h
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={record.total_horas_extras > 20 ? "text-yellow-600 font-bold" : ""}>
                            {record.total_horas_extras.toFixed(1)}h
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={record.total_faltas > 3 ? "text-red-600 font-bold" : ""}>
                            {record.total_faltas}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={record.status === "completo" ? "default" : "secondary"}>
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FolhaPonto;
