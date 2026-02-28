import { useState, useEffect } from "react";
import { Calendar, Clock, Download, Filter, AlertTriangle, CheckCircle, XCircle, FileText, Eye, FileSpreadsheet, Pencil } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { usePontoRealtime, useFuncionariosRealtime } from "@/hooks/useRealtimeUpdates";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
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
import { SuperAdminAuthDialog } from "@/components/ponto/SuperAdminAuthDialog";
import { HistoricoAcoesPonto } from "@/components/ponto/HistoricoAcoesPonto";
import { AutorizacaoFolgaDialog } from "@/components/ponto/AutorizacaoFolgaDialog";
import { OcorrenciasPontoCard } from "@/components/ponto/OcorrenciasPontoCard";
import { useAuth } from "@/components/auth/AuthProvider";

interface DayRecord {
  day: number;
  entrada?: string;
  saida?: string;
  saida_almoco?: string;
  retorno_almoco?: string;
  total_horas?: string;
  horas_extras?: string;
  horas_noturnas?: string;
  adicional_noturno?: string;
  status: "completo" | "incompleto" | "ausente" | "falta" | "atestado" | "pendente_folga" | "invalidado";
  registro_folga?: boolean;
  status_validacao?: string;
  tipo_dia?: string;
  percentual_he?: number;
  horas_noturnas_fictas?: string;
}

interface EmployeeMonthRecord {
  employee_id: string;
  employee_name: string;
  departamento?: string;
  escala_trabalho?: string;
  turno?: string;
  days: DayRecord[];
  total_horas_mes: number;
  total_horas_extras: number;
  total_horas_noturnas: number;
  total_faltas: number;
  status: "completo" | "incompleto";
}

const FolhaPonto = () => {
  usePontoRealtime();
  useFuncionariosRealtime();
  const { hasRole } = useAuth();
  const canEditFolha = hasRole("admin") || hasRole("rh");
  
  const { data: funcionarios, isLoading: loadingFuncionarios } = useFuncionarios();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString().padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedEmployee, setSelectedEmployee] = useState("todos");
  const [selectedDepartamento, setSelectedDepartamento] = useState("todos");
  const [viewMode, setViewMode] = useState<"resumo" | "detalhado">("detalhado");
  const [monthRecords, setMonthRecords] = useState<EmployeeMonthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [editingCell, setEditingCell] = useState<{empId: string, day: number, field: 'status' | 'horas_extras'} | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<{empId: string, day: number, field: 'status' | 'horas_extras', currentValue: string} | null>(null);
  const [authorizedAdmin, setAuthorizedAdmin] = useState<{id: string, name: string} | null>(null);
  const [showFolgaDialog, setShowFolgaDialog] = useState(false);
  const [registrosFolga, setRegistrosFolga] = useState<any[]>([]);
  const [countFolga, setCountFolga] = useState(0);

  const getAccessToken = (): string | null => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'rzcjwfxmogfsmfbwtwfc';
      const storageKey = `sb-${projectId}-auth-token`;
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      return JSON.parse(raw)?.access_token || null;
    } catch { return null; }
  };

  // Extrair lista de funcionários e departamentos dos dados sincronizados
  const employees = funcionarios || [];
  const departamentos = [...new Set(employees.map(e => e.departamento).filter(Boolean))] as string[];

  const loadRegistrosFolga = async () => {
    try {
      const token = getAccessToken();
      if (!token) { setRegistrosFolga([]); setCountFolga(0); return; }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/registros_ponto?select=id,user_id,data,entrada,saida,total_horas&registro_folga=eq.true&status_validacao=eq.pendente&order=data.desc`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`REST ${res.status}`);
      const data = await res.json();

      // Map employee names from the already-loaded funcionarios
      const empMap = new Map((employees || []).map((e: any) => [e.id, e.nome]));
      const mapped = (data || []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        employee_name: empMap.get(r.user_id) || "Desconhecido",
        data: r.data,
        entrada: r.entrada,
        saida: r.saida,
        total_horas: r.total_horas,
      }));
      setRegistrosFolga(mapped);
      setCountFolga(mapped.length);
    } catch (error) {
      console.error("Erro ao carregar registros de folga:", error);
    }
  };

  useEffect(() => {
    if (!loadingFuncionarios && employees.length >= 0) {
      loadMonthRecords();
      loadRegistrosFolga();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, selectedEmployee, selectedDepartamento, loadingFuncionarios, employees.length]);

  // Realtime: re-fetch stats when registros_ponto changes
  useEffect(() => {
    const channel = supabase
      .channel('folha-ponto-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registros_ponto' },
        () => {
          if (!loadingFuncionarios) {
            loadMonthRecords();
            loadRegistrosFolga();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, selectedEmployee, selectedDepartamento, loadingFuncionarios]);

  const loadMonthRecords = async () => {
    setLoading(true);
    try {
      const startDate = `${selectedYear}-${selectedMonth}-01`;
      const daysInMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
      const endDate = `${selectedYear}-${selectedMonth}-${daysInMonth}`;

      const token = getAccessToken();
      if (!token) { setMonthRecords([]); setLoading(false); return; }

      let url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/registros_ponto?select=*&data=gte.${startDate}&data=lte.${endDate}&order=data.asc`;

      if (selectedEmployee !== "todos") {
        url += `&user_id=eq.${selectedEmployee}`;
      }

      const res = await fetch(url, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`REST ${res.status}`);
      const registros = await res.json();

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
          escala_trabalho: (emp as any).escala_trabalho || '8h',
          turno: (emp as any).turno || 'diurno',
          days,
          total_horas_mes: 0,
          total_horas_extras: 0,
          total_horas_noturnas: 0,
          total_faltas: 0,
          status: "incompleto"
        });
      });

      // Tolerância CLT para marcação de ponto
      const TOLERANCIA_MINUTOS = 10;

      const parseIntervalToHours = (interval: string | null): number => {
        if (!interval) return 0;
        const match = interval.match(/(\d+):(\d+):(\d+)/);
        if (!match) return 0;
        return parseInt(match[1]) + parseInt(match[2]) / 60;
      };

      // Preencher com registros reais
      registros?.forEach((reg: any) => {
        const empRecord = employeeMap.get(reg.user_id);
        if (empRecord) {
          // Parse date string directly to avoid UTC timezone shift
          const day = parseInt(reg.data.split('-')[2], 10);
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

          // Jornada conforme escala do funcionário
          const jornadaHoras = empRecord.escala_trabalho === '12x36' ? 12 : 8;

          // Determinar status automaticamente com base nas horas trabalhadas
          let autoStatus: DayRecord["status"] = "ausente";
          
          // Verificar se é registro em dia de folga pendente/invalidado
          if (reg.registro_folga && reg.status_validacao === "pendente") {
            autoStatus = "pendente_folga";
          } else if (reg.registro_folga && reg.status_validacao === "invalidado") {
            autoStatus = "invalidado";
          } else if (reg.entrada && reg.saida) {
            const horasTrabalhadas = parseIntervalToHours(reg.total_horas);
            const limiteCompleto = jornadaHoras - (TOLERANCIA_MINUTOS / 60);
            autoStatus = horasTrabalhadas >= limiteCompleto ? "completo" : "incompleto";
          } else if (reg.entrada) {
            autoStatus = "incompleto";
          }
          // Se não tem entrada, permanece "ausente" — admin valida manualmente

          // Use admin-overridden status if available
          const finalStatus = reg.status_admin ? (reg.status_admin as DayRecord["status"]) : autoStatus;

          empRecord.days[dayIndex] = {
            day,
            entrada: formatTime(reg.entrada),
            saida: formatTime(reg.saida),
            saida_almoco: formatTime(reg.saida_almoco),
            retorno_almoco: formatTime(reg.retorno_almoco),
            total_horas: formatInterval(reg.total_horas),
            horas_extras: formatInterval(reg.horas_extras),
            horas_noturnas: formatInterval(reg.horas_noturnas),
            adicional_noturno: formatInterval(reg.adicional_noturno),
            status: finalStatus,
            registro_folga: reg.registro_folga,
            status_validacao: reg.status_validacao,
            tipo_dia: reg.tipo_dia,
            percentual_he: reg.percentual_he,
            horas_noturnas_fictas: formatInterval(reg.horas_noturnas_fictas),
          };

          // Calcular totais
          if (reg.total_horas) {
            empRecord.total_horas_mes += parseIntervalToHours(reg.total_horas);
          }

          if (reg.horas_extras) {
            empRecord.total_horas_extras += parseIntervalToHours(reg.horas_extras);
          }

          if (reg.horas_noturnas) {
            empRecord.total_horas_noturnas += parseIntervalToHours(reg.horas_noturnas);
          }
        }
      });

      // Calcular faltas e status final do mês
      employeeMap.forEach(record => {
        if (record.escala_trabalho === '12x36') {
          // Escala 12x36: funcionário trabalha dia sim, dia não (aprox. 15 dias/mês)
          // Contar apenas dias que deveriam ter sido trabalhados
          const diasEsperados = Math.ceil(daysInMonth / 2);
          record.total_faltas = record.days.filter(d => 
            d.status === "ausente" || d.status === "falta"
          ).length;
          
          const completos = record.days.filter(d => d.status === "completo").length;
          const atestados = record.days.filter(d => d.status === "atestado").length;
          record.status = (completos + atestados >= diasEsperados) ? "completo" : "incompleto";
        } else {
          // Escala 8h: dias úteis (seg-sex)
          const diasUteis = (() => {
            let count = 0;
            for (let d = 1; d <= daysInMonth; d++) {
              const dayOfWeek = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, d).getDay();
              if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
            }
            return count;
          })();

          record.total_faltas = record.days.filter(d => {
            const dayOfWeek = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, d.day).getDay();
            const isDiaUtil = dayOfWeek !== 0 && dayOfWeek !== 6;
            return isDiaUtil && (d.status === "ausente" || d.status === "falta");
          }).length;

          const completos = record.days.filter(d => d.status === "completo").length;
          const atestados = record.days.filter(d => d.status === "atestado").length;
          record.status = (completos + atestados >= diasUteis) ? "completo" : "incompleto";
        }
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
      case "atestado": return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "pendente_folga": return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
      case "invalidado": return "bg-red-500/10 text-red-700 dark:text-red-400 line-through";
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
      doc.text(`Total Horas: ${record.total_horas_mes.toFixed(1)}h | Horas Extras: ${record.total_horas_extras.toFixed(1)}h | H. Noturnas: ${record.total_horas_noturnas.toFixed(1)}h | Faltas: ${record.total_faltas}`, 14, yPos);
      yPos += 5;
      
      // Tabela detalhada - Espelho de Ponto (Portaria 671)
      const tableData = record.days.map(day => [
        day.day.toString().padStart(2, '0'),
        (day.tipo_dia === 'dsr' ? 'DSR' : day.tipo_dia === 'feriado' ? 'FER' : ''),
        day.entrada || '-',
        day.saida_almoco || '-',
        day.retorno_almoco || '-',
        day.saida || '-',
        day.total_horas || '-',
        day.horas_extras ? `${day.horas_extras} (${day.percentual_he || 50}%)` : '-',
        day.horas_noturnas || '-',
        day.status === 'completo' ? 'OK' : day.status === 'incompleto' ? 'Inc.' : day.status === 'atestado' ? 'Atest.' : day.status === 'falta' ? 'Falta' : day.status === 'pendente_folga' ? 'Pend.' : day.status === 'invalidado' ? 'Inv.' : 'Aus.'
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Dia', 'Tipo', 'Entrada', 'S.Almoço', 'R.Almoço', 'Saída', 'Total', 'HE (%)', 'H.Not.', 'Status']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 6 },
        headStyles: { fillColor: [17, 188, 183] },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 12 },
          2: { cellWidth: 18 },
          3: { cellWidth: 18 },
          4: { cellWidth: 18 },
          5: { cellWidth: 18 },
          6: { cellWidth: 20 },
          7: { cellWidth: 25 },
          8: { cellWidth: 18 },
          9: { cellWidth: 15 }
        }
      });
    });
    
    const fileName = `folha-ponto-detalhada-${selectedMonth}-${selectedYear}.pdf`;
    doc.save(fileName);
    
    toast.success("PDF detalhado exportado com sucesso!");
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    
    monthRecords.forEach(record => {
      const sheetName = record.employee_name.substring(0, 31);
      const worksheet = workbook.addWorksheet(sheetName);
      
      worksheet.columns = [
        { header: 'Dia', key: 'dia', width: 8 },
        { header: 'Tipo Dia', key: 'tipo_dia', width: 12 },
        { header: 'Entrada', key: 'entrada', width: 12 },
        { header: 'Saída Almoço', key: 'saida_almoco', width: 14 },
        { header: 'Retorno Almoço', key: 'retorno_almoco', width: 16 },
        { header: 'Saída', key: 'saida', width: 12 },
        { header: 'Total Horas', key: 'total_horas', width: 12 },
        { header: 'Horas Extras', key: 'horas_extras', width: 12 },
        { header: '% HE', key: 'percentual_he', width: 8 },
        { header: 'H. Noturnas', key: 'horas_noturnas', width: 12 },
        { header: 'H. Not. Fictas', key: 'horas_noturnas_fictas', width: 14 },
        { header: 'Status', key: 'status', width: 14 },
      ];

      // Resumo
      worksheet.addRow({
        dia: 'RESUMO',
        tipo_dia: `Escala: ${record.escala_trabalho || '8h'}`,
        entrada: `Total: ${record.total_horas_mes.toFixed(1)}h`,
        saida_almoco: `HE: ${record.total_horas_extras.toFixed(1)}h`,
        retorno_almoco: `H.Not: ${record.total_horas_noturnas.toFixed(1)}h`,
        saida: `Faltas: ${record.total_faltas}`,
        total_horas: `Depto: ${record.departamento || '-'}`,
      });

      record.days.forEach(day => {
        worksheet.addRow({
          dia: day.day.toString().padStart(2, '0'),
          tipo_dia: day.tipo_dia === 'dsr' ? 'DSR' : day.tipo_dia === 'feriado' ? 'Feriado' : 'Útil',
          entrada: day.entrada || '-',
          saida_almoco: day.saida_almoco || '-',
          retorno_almoco: day.retorno_almoco || '-',
          saida: day.saida || '-',
          total_horas: day.total_horas || '-',
          horas_extras: day.horas_extras || '-',
          percentual_he: day.percentual_he || '-',
          horas_noturnas: day.horas_noturnas || '-',
          horas_noturnas_fictas: day.horas_noturnas_fictas || '-',
          status: day.status === 'completo' ? 'Completo' : day.status === 'incompleto' ? 'Incompleto' : day.status === 'atestado' ? 'Atestado' : day.status === 'falta' ? 'Falta' : day.status === 'pendente_folga' ? 'Pendente (Folga)' : day.status === 'invalidado' ? 'Invalidado' : 'Ausente'
        });
      });
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    const fileName = `folha-ponto-detalhada-${selectedMonth}-${selectedYear}.xlsx`;
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success("Excel detalhado exportado com sucesso!");
  };

  const handleEditCell = (empId: string, day: number, field: 'status' | 'horas_extras', currentValue: string) => {
    setPendingEdit({ empId, day, field, currentValue });
    setShowAuthDialog(true);
  };

  const handleAdminAuthorized = (adminId: string, adminName: string) => {
    if (!pendingEdit) return;
    setAuthorizedAdmin({ id: adminId, name: adminName });
    setEditingCell({ empId: pendingEdit.empId, day: pendingEdit.day, field: pendingEdit.field });
    setEditValue(pendingEdit.currentValue);
    setPendingEdit(null);
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;
    
    try {
      const record = monthRecords.find(r => r.employee_id === editingCell.empId);
      if (!record) return;
      
      const dayData = record.days[editingCell.day - 1];
      const date = `${selectedYear}-${selectedMonth}-${editingCell.day.toString().padStart(2, '0')}`;
      
      if (editingCell.field === 'status') {
        // Persistir status_admin no banco via REST (upsert)
        const token = getAccessToken();
        if (!token) throw new Error('Sessão expirada');

        // Check if a record exists for this day
        const checkRes = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/registros_ponto?user_id=eq.${editingCell.empId}&data=eq.${date}&select=id`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        const existing = await checkRes.json();

        if (existing && existing.length > 0) {
          // Update existing record
          const updateRes = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/registros_ponto?id=eq.${existing[0].id}`,
            {
              method: 'PATCH',
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
              },
              body: JSON.stringify({ status_admin: editValue }),
            }
          );
          if (!updateRes.ok) {
            const errText = await updateRes.text().catch(() => '');
            console.error('PATCH failed:', updateRes.status, errText);
            throw new Error(`Erro ao atualizar: ${updateRes.status}`);
          }
          const updatedRows = await updateRes.json();
          if (!updatedRows || updatedRows.length === 0) {
            throw new Error('Nenhum registro foi atualizado. Verifique permissões.');
          }
          console.log('Status atualizado no banco:', updatedRows[0]?.status_admin);
        } else {
          // Insert new record with status_admin
          const insertRes = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/registros_ponto`,
            {
              method: 'POST',
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
              },
              body: JSON.stringify({ user_id: editingCell.empId, data: date, status_admin: editValue }),
            }
          );
          if (!insertRes.ok) {
            const errText = await insertRes.text().catch(() => '');
            console.error('POST failed:', insertRes.status, errText);
            throw new Error(`Erro ao inserir: ${insertRes.status}`);
          }
          const insertedRows = await insertRes.json();
          console.log('Registro inserido no banco:', insertedRows[0]?.status_admin);
        }

        // Atualizar localmente
        const updatedRecords = monthRecords.map(r => {
          if (r.employee_id === editingCell.empId) {
            const newDays = [...r.days];
            newDays[editingCell.day - 1] = {
              ...newDays[editingCell.day - 1],
              status: editValue as any
            };
            
            const total_faltas = newDays.filter(d => d.status === "ausente" || d.status === "falta" || d.status === "atestado").length;
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
        // Atualizar horas extras no banco via REST
        const token = getAccessToken();
        if (!token) throw new Error('Sessão expirada');
        
        const updateRes = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/registros_ponto?user_id=eq.${editingCell.empId}&data=eq.${date}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({ horas_extras: editValue }),
          }
        );
        if (!updateRes.ok) throw new Error(`Erro ${updateRes.status}`);
        
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
      
      // Log the edit with admin authorization
      if (authorizedAdmin) {
        const token = getAccessToken();
        if (token) {
          const logBody = {
            employee_id: editingCell.empId,
            employee_name: record.employee_name,
            campo_editado: editingCell.field === 'status' ? 'Status' : 'Horas Extras',
            valor_anterior: editingCell.field === 'status' ? dayData.status : (dayData.horas_extras || '0h 0min'),
            valor_novo: editValue,
            data_registro: date,
            autorizado_por: authorizedAdmin.id,
            autorizado_por_nome: authorizedAdmin.name,
          };
          console.log("Inserindo log de edição:", logBody);
          const logRes = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/logs_edicao_ponto`,
            {
              method: 'POST',
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
              },
              body: JSON.stringify(logBody),
            }
          );
          if (!logRes.ok) {
            const errText = await logRes.text().catch(() => '');
            console.error("Falha ao gravar log:", logRes.status, errText);
            toast.error("Edição salva, mas falha ao registrar log");
          } else {
            const inserted = await logRes.json();
            console.log("Log inserido com sucesso:", inserted);
          }
        }
      }

      toast.success("Registro atualizado com sucesso!");
      setEditingCell(null);
      setEditValue("");
      setAuthorizedAdmin(null);
      // Recarregar dados do banco para garantir consistência
      loadMonthRecords();
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
      toast.error("Erro ao salvar alteração");
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
    setAuthorizedAdmin(null);
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
    <div className="space-y-4 sm:space-y-6" style={{ fontFamily: 'Arial, sans-serif' }}>
      <BackButton to="/gestao-rh" variant="light" />
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: '#000000' }}>
            Folha de Ponto
          </h1>
          <p className="mt-1 text-xs sm:text-sm md:text-base font-bold" style={{ color: '#000000' }}>
            Controle mensal de ponto e horas trabalhadas
          </p>
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          {countFolga > 0 && (
            <Button
              variant="outline"
              className="flex-1 sm:flex-none text-sm border-amber-300 text-amber-700 hover:bg-amber-50 relative"
              onClick={() => {
                loadRegistrosFolga();
                setShowFolgaDialog(true);
              }}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Folga ({countFolga})
            </Button>
          )}
          <Dialog open={showFilters} onOpenChange={setShowFilters}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 sm:flex-none text-sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
                        <CardDescription>
                          {record.departamento || "Sem departamento"}
                          {record.escala_trabalho === '12x36' && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              12x36 {record.turno === 'noturno' ? '(Noturno)' : '(Diurno)'}
                            </Badge>
                          )}
                        </CardDescription>
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
                      {record.total_horas_noturnas > 0 && (
                        <div className="text-center">
                          <div className="text-muted-foreground">H. Noturnas</div>
                          <div className="font-bold text-indigo-600">{record.total_horas_noturnas.toFixed(1)}h</div>
                        </div>
                      )}
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
                                      <SelectItem value="atestado">Atestado</SelectItem>
                                      <SelectItem value="pendente_folga">Pendente (Folga)</SelectItem>
                                      <SelectItem value="invalidado">Invalidado</SelectItem>
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
                                  {day.status === "atestado" && <FileText className="h-3 w-3" />}
                                  {day.status}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {!(editingCell?.empId === record.employee_id && editingCell?.day === day.day) && (
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

      {/* Histórico de Ações */}
      <HistoricoAcoesPonto selectedMonth={selectedMonth} selectedYear={selectedYear} />

      {/* Ocorrências CLT */}
      <OcorrenciasPontoCard mes={selectedMonth} ano={selectedYear} />

      <SuperAdminAuthDialog
        open={showAuthDialog}
        onOpenChange={(open) => {
          setShowAuthDialog(open);
          if (!open) setPendingEdit(null);
        }}
        onAuthorized={handleAdminAuthorized}
        actionDescription="editar registros de ponto"
      />

      <AutorizacaoFolgaDialog
        open={showFolgaDialog}
        onOpenChange={setShowFolgaDialog}
        registros={registrosFolga}
        onDecisaoTomada={() => {
          loadRegistrosFolga();
          loadMonthRecords();
        }}
      />
    </div>
  );
};

export default FolhaPonto;
