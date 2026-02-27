import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Plus, Search, Mail, Phone, Edit, Trash2, TrendingUp, Users, X, Camera, Upload } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useFuncionariosRealtime, useSalariosRealtime } from "@/hooks/useRealtimeUpdates";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type EmployeeStatus = "ativo" | "afastado" | "demitido" | "em_ferias" | "pediu_demissao";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: EmployeeStatus;
  admissionDate: string;
  foto_url?: string;
}

const employeeSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().trim().email("E-mail inválido").max(255, "E-mail deve ter no máximo 255 caracteres"),
  phone: z.string().trim().min(1, "Telefone é obrigatório").max(20, "Telefone deve ter no máximo 20 caracteres"),
  position: z.string().trim().min(1, "Cargo é obrigatório").max(100, "Cargo deve ter no máximo 100 caracteres"),
  department: z.string().min(1, "Departamento é obrigatório"),
  status: z.enum(["ativo", "afastado", "demitido", "em_ferias", "pediu_demissao"]),
  cpf: z.string().trim().min(11, "CPF deve ter 11 dígitos").max(14, "CPF inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").max(50, "Senha deve ter no máximo 50 caracteres"),
  salario: z.string().optional(),
  endereco: z.string().optional(),
  rg: z.string().optional(),
  numero_pis: z.string().optional(),
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

interface Dependente {
  nome: string;
  idade: string;
  tipo_dependencia: string;
}

const Funcionarios = () => {
  const { toast } = useToast();
  useFuncionariosRealtime();
  useSalariosRealtime();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("Todos");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSalaries, setEmployeeSalaries] = useState<Record<string, { salario: number | null, ultimaAlteracao?: { valor: number, data: string } }>>({});
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editPassword, setEditPassword] = useState("");
  const [editSalary, setEditSalary] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editEndereco, setEditEndereco] = useState("");
  const [editAdmissionDate, setEditAdmissionDate] = useState("");
  const [editEscala, setEditEscala] = useState("8h");
  const [editTurno, setEditTurno] = useState("diurno");
  
  const [newEscala, setNewEscala] = useState("8h");
  const [newTurno, setNewTurno] = useState("diurno");

  const fallbackEscalas = [
    { nome: "8h", descricao: "8h (CLT Padrão)" },
    { nome: "6x1", descricao: "6x1 - 6 dias trabalhados, 1 folga" },
    { nome: "5x2", descricao: "5x2 - 5 dias trabalhados, 2 folgas" },
    { nome: "12x36", descricao: "12x36 - 12h trabalhadas, 36h de descanso" },
  ];
  const fallbackTurnos = [
    { nome: "diurno", descricao: "Escala Intermediário (7h-17h)" },
    { nome: "noturno", descricao: "Escala Noturno (19h-7h)" },
    { nome: "diurno_7_19", descricao: "Escala Diurno (7h-19h)" },
  ];

  const [escalasDisponiveis, setEscalasDisponiveis] = useState<{nome: string; descricao: string}[]>(fallbackEscalas);
  const [turnosDisponiveis, setTurnosDisponiveis] = useState<{nome: string; descricao: string; escala_nome?: string}[]>(fallbackTurnos);

  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "Tecnologia",
    status: "ativo" as const,
    cpf: "",
    password: "",
    salario: "",
    dataNascimento: "",
    dataAdmissao: "",
    dependentes: [] as Dependente[],
    endereco: "",
    rg: "",
    numero_pis: "",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const newPhotoRef = useRef<HTMLInputElement>(null);
  const editPhotoRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (file: File | null, type: 'new' | 'edit') => {
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Formato inválido", description: "Use JPEG, PNG ou WebP.", variant: "destructive" });
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "A foto deve ter no máximo 2MB.", variant: "destructive" });
      return;
    }
    
    const preview = URL.createObjectURL(file);
    if (type === 'new') {
      setNewPhotoFile(file);
      setNewPhotoPreview(preview);
    } else {
      setEditPhotoFile(file);
      setEditPhotoPreview(preview);
    }
  };

  const uploadPhoto = async (file: File, userId: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const filePath = `${userId}/foto.${ext}`;
    const token = getAccessToken();
    if (!token) return null;

    try {
      // Direct fetch upload to bypass SDK lock issues
      const uploadUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/fotos-funcionarios/${filePath}`;
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'x-upsert': 'true',
        },
        body: file,
      });

      if (!uploadRes.ok) {
        console.error('Upload error:', await uploadRes.text());
        return null;
      }

      return `fotos-funcionarios/${filePath}`;
    } catch (e) {
      console.error('Upload error:', e);
      return null;
    }
  };
  // Helper: get access token from localStorage (bypasses Navigator Lock)
  const getAccessToken = (): string | null => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'rzcjwfxmogfsmfbwtwfc';
      const storageKey = `sb-${projectId}-auth-token`;
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.access_token || null;
    } catch {
      return null;
    }
  };

  // Direct REST fetch helper (bypasses SDK lock issues)
  const restFetch = async (table: string, query: string = '') => {
    const token = getAccessToken();
    if (!token) throw new Error('NO_TOKEN');
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${table}${query}`;
    const res = await fetch(url, {
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error(`REST ${res.status}: ${res.statusText}`);
    return res.json();
  };

  // Resolve foto_url storage path to a signed URL
  const resolveFotoUrl = async (fotoUrl: string | null | undefined): Promise<string | undefined> => {
    if (!fotoUrl) return undefined;
    if (fotoUrl.startsWith('http')) return fotoUrl;
    const match = fotoUrl.match(/^fotos-funcionarios\/(.+)$/);
    if (match) {
      try {
        const token = getAccessToken();
        if (!token) return undefined;
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/sign/fotos-funcionarios/${match[1]}`,
          {
            method: 'POST',
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ expiresIn: 3600 }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.signedURL) return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1${data.signedURL}`;
        }
        return undefined;
      } catch { return undefined; }
    }
    return undefined;
  };

  // Função para buscar funcionários do banco de dados via REST API
  const fetchEmployees = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        console.warn("fetchEmployees: Sem token no localStorage, abortando.");
        return;
      }

      // Step 1: Get all roles via REST
      let allRoles: { user_id: string; role: string }[] = [];
      try {
        allRoles = await restFetch('user_roles', '?select=user_id,role');
      } catch (err: any) {
        console.error("fetchEmployees: Erro ao buscar roles via REST:", err.message);
      }

      console.log("fetchEmployees: Roles encontrados:", allRoles.length);

      // If we got roles, filter employee-only IDs
      if (allRoles.length > 0) {
        const employeeIds = new Set<string>();
        const adminIds = new Set<string>();
        allRoles.forEach(r => {
          if (r.role === 'funcionario') employeeIds.add(r.user_id);
          if (['admin', 'gestor', 'rh'].includes(r.role)) adminIds.add(r.user_id);
        });

        const targetIds = [...employeeIds].filter(id => !adminIds.has(id));
        console.log("fetchEmployees: employeeIds:", employeeIds.size, "adminIds:", adminIds.size, "targetIds:", targetIds.length);

        if (targetIds.length === 0) {
          console.warn("fetchEmployees: Nenhum funcionário puro encontrado");
          setEmployees([]);
          setEmployeeSalaries({});
          return;
        }

        // Step 2: Fetch profiles for those IDs via REST
        const inFilter = targetIds.map(id => `"${id}"`).join(',');
        const profilesData = await restFetch(
          'profiles',
          `?select=id,nome,email,telefone,cargo,departamento,salario,status,created_at,data_admissao,foto_url&id=in.(${inFilter})&order=nome.asc`
        );

        console.log("fetchEmployees: Profiles retornados:", profilesData?.length || 0);

        const activeProfiles = (profilesData || []).filter((p: any) => {
          const status = (p.status || "ativo").toLowerCase();
          return status !== "demitido" && status !== "pediu_demissao";
        });

        const formattedEmployees = await Promise.all(activeProfiles.map(async (profile: any) => ({
          id: profile.id,
          name: profile.nome,
          email: profile.email,
          phone: profile.telefone || "Não informado",
          position: profile.cargo || "Não informado",
          department: profile.departamento || "Não informado",
          status: (profile.status || "ativo") as EmployeeStatus,
          admissionDate: profile.data_admissao || new Date(profile.created_at).toISOString().split('T')[0],
          foto_url: await resolveFotoUrl(profile.foto_url),
        })));

        console.log("fetchEmployees: Funcionários formatados:", formattedEmployees.length);
        setEmployees(formattedEmployees);

        const salaries: Record<string, { salario: number | null; ultimaAlteracao?: { valor: number; data: string } }> = {};
        for (const profile of profilesData || []) {
          salaries[profile.id] = { salario: profile.salario };
        }
        setEmployeeSalaries(salaries);
      } else {
        // Fallback: fetch all profiles (RLS will filter)
        console.log("fetchEmployees: Fallback - buscando profiles diretamente...");
        const fallbackProfiles = await restFetch(
          'profiles',
          '?select=id,nome,email,telefone,cargo,departamento,salario,status,created_at,data_admissao,foto_url&order=nome.asc'
        );

        const activeProfiles = (fallbackProfiles || []).filter((p: any) => {
          const status = (p.status || "ativo").toLowerCase();
          return status !== "demitido" && status !== "pediu_demissao";
        });

        const formatted = await Promise.all(activeProfiles.map(async (profile: any) => ({
          id: profile.id,
          name: profile.nome,
          email: profile.email,
          phone: profile.telefone || "Não informado",
          position: profile.cargo || "Não informado",
          department: profile.departamento || "Não informado",
          status: (profile.status || "ativo") as EmployeeStatus,
          admissionDate: profile.data_admissao || new Date(profile.created_at).toISOString().split('T')[0],
          foto_url: await resolveFotoUrl(profile.foto_url),
        })));

        console.log("fetchEmployees: Fallback retornou", formatted.length, "funcionários");
        setEmployees(formatted);
      }
    } catch (error: any) {
      console.error("fetchEmployees: Exceção:", error.message);
    }
  };

  // Carregar funcionários ao montar o componente
  useEffect(() => {
    let mounted = true;

    // Immediate load attempt
    const load = () => {
      if (!mounted) return;
      fetchEmployees();
    };

    // Try immediately
    load();

    // Retry after 1.5s and 4s as safety nets
    const t1 = setTimeout(load, 1500);
    const t2 = setTimeout(load, 4000);

    // Listen for auth changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && mounted) {
        console.log("fetchEmployees: Auth mudou, recarregando...", _event);
        fetchEmployees();
      }
    });

    // Realtime channel for profile changes
    const channel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        if (mounted) fetchEmployees();
      })
      .subscribe();

    return () => {
      mounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      authSub.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch available escalas and turnos
  useEffect(() => {
    const fetchEscalasTurnos = async () => {
      try {
        const { data: escalas, error: escalasErr } = await supabase
          .from("escalas_trabalho")
          .select("nome, descricao")
          .eq("ativo", true)
          .order("nome");
        if (escalasErr) console.error("Erro ao buscar escalas:", escalasErr);
        if (escalas && escalas.length > 0) setEscalasDisponiveis(escalas as any);

        const { data: turnos, error: turnosErr } = await (supabase as any)
          .from("turnos_trabalho")
          .select("nome, descricao, escala_id, escalas_trabalho(nome)")
          .eq("ativo", true);
        if (turnosErr) console.error("Erro ao buscar turnos:", turnosErr);
        if (turnos && turnos.length > 0) {
          const seen = new Set<string>();
          const deduped = (turnos as any[]).filter((t: any) => {
            const key = `${t.nome}-${t.escalas_trabalho?.nome || ''}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setTurnosDisponiveis(deduped.map((t: any) => ({
            nome: t.nome,
            descricao: t.descricao,
            escala_nome: t.escalas_trabalho?.nome,
          })));
        }
      } catch (err) {
        console.error("Erro ao buscar escalas/turnos:", err);
      }
    };
    fetchEscalasTurnos();
  }, []);

  // Buscar histórico de alterações
  useEffect(() => {
    const fetchHistorico = async () => {
      if (employees.length === 0) return;

      try {
        const employeeIds = employees.map(emp => emp.id);
        
        // Buscar histórico de salários
        const { data: historicoData, error: historicoError } = await supabase
          .from("historico_salarios")
          .select("user_id, salario_novo, data_alteracao")
          .in("user_id", employeeIds)
          .order("data_alteracao", { ascending: false });

        if (historicoError) {
          console.error("Erro ao buscar histórico:", historicoError);
          return;
        }

        // Criar mapa de históricos (pegar apenas o mais recente de cada usuário)
        const historicoMap = new Map<string, { valor: number, data: string }>();
        historicoData?.forEach(hist => {
          if (!historicoMap.has(hist.user_id)) {
            historicoMap.set(hist.user_id, {
              valor: hist.salario_novo,
              data: new Date(hist.data_alteracao).toLocaleDateString('pt-BR')
            });
          }
        });

        // Atualizar salários com histórico
        setEmployeeSalaries(prev => {
          const updated = { ...prev };
          employeeIds.forEach(id => {
            if (updated[id]) {
              updated[id] = {
                ...updated[id],
                ultimaAlteracao: historicoMap.get(id)
              };
            }
          });
          return updated;
        });
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
      }
    };

    fetchHistorico();

    // Subscrever a mudanças em tempo real no histórico de salários
    const channel = supabase
      .channel('salary-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'historico_salarios'
        },
        () => {
          fetchHistorico();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [employees]);

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
    if (!employee) return;
    
    setEditingEmployee({ ...employee });
    setEditPassword("");
    setEditCpf("");
    setEditSalary("");
    setEditEndereco("");
    setEditEscala("8h");
    setEditTurno("diurno");
    setEditAdmissionDate(employee.admissionDate);
    setEditPhotoFile(null);
    setEditPhotoPreview(employee.foto_url || null);
    setIsEditDialogOpen(true);
    
    try {
      const token = getAccessToken();
      if (token) {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?select=cpf,salario,endereco,escala_trabalho,turno&id=eq.${employeeId}&limit=1`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (res.ok) {
          const rows = await res.json();
          const profileData = rows?.[0];
          if (profileData) {
            setEditCpf(profileData.cpf || "");
            setEditEndereco(profileData.endereco || "");
            setEditEscala(profileData.escala_trabalho || "8h");
            setEditTurno(profileData.turno || "diurno");
            if (profileData.salario) {
              const salarioFormatado = parseFloat(profileData.salario.toString()).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              });
              setEditSalary(salarioFormatado);
            }
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar dados do funcionário:", error);
    }
  };

  const handleDelete = (employeeId: string) => {
    setDeletingEmployeeId(employeeId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingEmployeeId) {
      try {
        const token = getAccessToken();
        if (!token) throw new Error('Sessão expirada — faça login novamente.');

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-employee-user`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ user_id: deletingEmployeeId }),
          }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (res.status === 401) throw new Error('Sessão expirada — faça login novamente para excluir funcionários.');
          if (res.status === 403) throw new Error('Sem permissão para excluir funcionários (necessário admin ou RH).');
          throw new Error(data?.error || 'Erro ao excluir funcionário');
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Não foi possível excluir o funcionário.');
        }
        
        toast({
          title: "Funcionário excluído",
          description: "O funcionário foi removido com sucesso.",
        });

        // Atualizar lista imediatamente
        await fetchEmployees();
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
          telefone: editingEmployee.phone,
          cargo: editingEmployee.position,
          departamento: editingEmployee.department,
          status: editingEmployee.status,
          endereco: editEndereco.trim() || null,
          escala_trabalho: editEscala,
          turno: editTurno,
        };

        // Converter salário formatado para número
        if (editSalary) {
          const salarioNumero = parseFloat(editSalary.replace(/\./g, '').replace(',', '.'));
          if (!isNaN(salarioNumero) && salarioNumero > 0) {
            updateData.salario = salarioNumero;
          }
        }

        // Upload photo first if selected, so we can include foto_url in the same update
        if (editPhotoFile) {
          const fotoUrl = await uploadPhoto(editPhotoFile, editingEmployee.id);
          if (fotoUrl) {
            (updateData as any).foto_url = fotoUrl;
          }
        }

        // Atualizar dados no perfil via REST (bypass SDK lock)
        const token = getAccessToken();
        if (!token) throw new Error('Sessão expirada');
        const patchRes = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${editingEmployee.id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify(updateData),
          }
        );
        if (!patchRes.ok) {
          const errText = await patchRes.text();
          throw new Error(errText || 'Erro ao atualizar perfil');
        }

        // Se senha foi fornecida, atualizar via Edge Function (requer service_role)
        if (editPassword && editPassword.length >= 6) {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;
          
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-employee-password`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              },
              body: JSON.stringify({
                user_id: editingEmployee.id,
                password: editPassword,
              }),
            }
          );
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            toast({
              title: "Atenção",
              description: errorData.error || "Dados atualizados, mas não foi possível alterar a senha.",
              variant: "destructive",
            });
          }
        }

        toast({
          title: "Funcionário atualizado",
          description: "Os dados do funcionário foram atualizados com sucesso.",
        });

        setIsEditDialogOpen(false);
        setEditingEmployee(null);
        setEditPassword("");
        setEditSalary("");
        
        // O hook useFuncionariosRealtime vai atualizar automaticamente
      } catch (error: any) {
        toast({
          title: "Erro ao atualizar",
          description: error.message || "Não foi possível atualizar o funcionário.",
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
      salario: "",
      dataNascimento: "",
      dataAdmissao: "",
      dependentes: [],
      endereco: "",
      rg: "",
      numero_pis: "",
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
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Validate input - only validate the fields in the schema
      const dataToValidate = {
        name: newEmployee.name,
        email: newEmployee.email,
        phone: newEmployee.phone,
        position: newEmployee.position,
        department: newEmployee.department,
        status: newEmployee.status,
        cpf: newEmployee.cpf,
        password: newEmployee.password,
        salario: newEmployee.salario,
        endereco: newEmployee.endereco,
        rg: newEmployee.rg,
        numero_pis: newEmployee.numero_pis,
      };
      employeeSchema.parse(dataToValidate);
      
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
      
      // Importante: NÃO usar signUp direto aqui, pois isso troca a sessão (logando como o novo funcionário)
      // Em vez disso, criamos via função de backend.
      const salarioNumero = newEmployee.salario
        ? (() => {
            const n = parseFloat(newEmployee.salario.replace(/\./g, "").replace(",", "."));
            return !isNaN(n) && n > 0 ? n : null;
          })()
        : null;

      const dependentesPayload = newEmployee.dependentes
        .map((dep) => ({
          nome: dep.nome,
          idade: dep.idade ? parseInt(dep.idade) : null,
          tipo_dependencia: dep.tipo_dependencia,
        }))
        .filter((dep) => dep.nome.trim().length > 0 && dep.tipo_dependencia);

      const token = getAccessToken();
      if (!token) throw new Error('Sessão expirada — faça login novamente.');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const createRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-employee-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            email: newEmployee.email,
            password: newEmployee.password,
            nome: newEmployee.name,
            cpf: cpfNumeros,
            telefone: newEmployee.phone,
            cargo: newEmployee.position,
            departamento: newEmployee.department,
            status: newEmployee.status,
            salario: salarioNumero,
            data_nascimento: newEmployee.dataNascimento || null,
            data_admissao: newEmployee.dataAdmissao || null,
            endereco: newEmployee.endereco || null,
            rg: newEmployee.rg || null,
            numero_pis: newEmployee.numero_pis || null,
            escala_trabalho: newEscala,
            turno: newTurno,
            dependentes: dependentesPayload,
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (createRes.status === 401) throw new Error('Você precisa estar logado para cadastrar funcionários.');
      if (createRes.status === 403) throw new Error('Sem permissão para cadastrar funcionários.');

      const createData = await createRes.json();

      if (!createRes.ok || !createData?.success) {
        throw new Error(createData?.error || 'Falha ao criar funcionário');
      }

      // Upload photo if selected
      const newUserId = (createData as any)?.user?.id;
      if (newPhotoFile && newUserId) {
        const fotoUrl = await uploadPhoto(newPhotoFile, newUserId);
        if (fotoUrl) {
          const tkn = getAccessToken();
          if (tkn) {
            await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${newUserId}`,
              {
                method: 'PATCH',
                headers: {
                  'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  'Authorization': `Bearer ${tkn}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal',
                },
                body: JSON.stringify({ foto_url: fotoUrl }),
              }
            );
          }
        }
      }
      
      // Limpar o formulário
      setNewEmployee({
        name: "",
        email: "",
        phone: "",
        position: "",
        department: "Tecnologia",
        status: "ativo" as const,
        cpf: "",
        salario: "",
        password: "",
        dataNascimento: "",
        dataAdmissao: "",
        dependentes: [],
        endereco: "",
        rg: "",
        numero_pis: "",
      });
      
      toast({
        title: "Funcionário adicionado com sucesso!",
        description: `${newEmployee.name} foi cadastrado e pode acessar o Portal do Funcionário com CPF e senha.`,
      });

      setValidationErrors({});
      setNewPhotoFile(null);
      setNewPhotoPreview(null);
      setIsAddDialogOpen(false);
      
      // Atualizar lista de funcionários imediatamente
      await fetchEmployees();
    } catch (error: any) {
      console.error("Erro ao adicionar funcionário:", error);
      
      // Handle Zod validation errors
      const zodIssues = error?.issues || error?.errors;
      if (zodIssues && Array.isArray(zodIssues)) {
        const errors: Record<string, string> = {};
        zodIssues.forEach((err: any) => {
          if (err.path?.[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        toast({
          title: "Erro de validação",
          description: "Por favor, corrija os campos destacados em vermelho.",
          variant: "destructive",
        });
        // Scroll to first error field
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField) {
          const el = document.getElementById(`new-${firstErrorField}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        toast({
          title: "Erro ao adicionar funcionário",
          description: error?.message || "Ocorreu um erro inesperado",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    
    <div className="space-y-4 sm:space-y-6" style={{ fontFamily: 'Arial, sans-serif' }}>
      <BackButton to="/gestao-rh" variant="light" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: '#000000' }}>
            Funcionários
          </h1>
          <p className="mt-1 text-xs sm:text-sm md:text-base font-bold" style={{ color: '#000000' }}>
            Gerencie todos os funcionários da empresa
          </p>
        </div>
        <Button onClick={handleAddEmployee} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Funcionário
        </Button>
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div>
              <CardTitle className="text-base sm:text-lg">Lista de Funcionários</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {filteredEmployees.length} funcionário(s) encontrado(s)
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger className="w-full sm:w-[160px] text-sm">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="Recursos Humanos">RH</SelectItem>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                  <SelectItem value="Financeiro">Financeiro</SelectItem>
                  <SelectItem value="Operações">Operações</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-4 md:p-6 pt-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Funcionário</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">Cargo</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Depto</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden xl:table-cell">Salário</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">Contato</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Admissão</TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="text-xs sm:text-sm text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                          {employee.foto_url && <AvatarImage src={employee.foto_url} alt={employee.name} />}
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                            {getInitials(employee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[150px]">{employee.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs sm:text-sm">{employee.position}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs sm:text-sm">{employee.department}</TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="flex flex-col gap-1">
                        {employeeSalaries[employee.id]?.salario ? (
                          <div className="font-medium text-xs sm:text-sm">
                            R$ {employeeSalaries[employee.id].salario!.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-xs">
                          <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="truncate max-w-[120px]">{employee.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs sm:text-sm">
                      {new Date(employee.admissionDate).toLocaleDateString("pt-BR")}
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
                        className={`text-[10px] sm:text-xs ${employee.status === "afastado" || employee.status === "em_ferias" ? "bg-yellow-500 text-white hover:bg-yellow-600 border-transparent" : employee.status === "pediu_demissao" ? "bg-orange-500 text-white hover:bg-orange-600 border-transparent" : ""}`}
                      >
                        {employee.status === "ativo" ? "Ativo" : employee.status === "afastado" ? "Afast." : employee.status === "em_ferias" ? "Férias" : employee.status === "pediu_demissao" ? "Pediu dem." : "Demit."}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleEdit(employee.id)}>
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleDelete(employee.id)}>
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <p className="text-muted-foreground text-sm">
                Nenhum funcionário encontrado.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col" style={{ fontFamily: 'Arial, sans-serif' }}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Editar Funcionário</DialogTitle>
            <DialogDescription>
              Atualize as informações do funcionário
            </DialogDescription>
          </DialogHeader>
          {editingEmployee && (
            <div className="grid gap-3 overflow-y-auto pr-2 -mr-2"
                 style={{ maxHeight: 'calc(90vh - 180px)' }}>
              {/* Upload de Foto */}
              <div className="grid gap-1.5">
                <Label className="text-sm">Foto do Funcionário</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-dashed border-muted-foreground/30">
                    {editPhotoPreview ? (
                      <AvatarImage src={editPhotoPreview} alt="Preview" />
                    ) : null}
                    <AvatarFallback className="bg-muted">
                      <Camera className="h-6 w-6 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => editPhotoRef.current?.click()}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      {editPhotoPreview ? "Trocar foto" : "Enviar foto"}
                    </Button>
                    <p className="text-[10px] text-muted-foreground">JPEG, PNG ou WebP. Máx 2MB.</p>
                    <input
                      ref={editPhotoRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null, 'edit')}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm">Nome</Label>
                  <Input
                    id="name"
                    value={editingEmployee.name}
                    onChange={(e) => updateEditingEmployee('name', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cpf" className="text-sm">CPF</Label>
                  <Input
                    id="cpf"
                    value={editCpf}
                    readOnly
                    className="bg-muted cursor-not-allowed h-9 text-foreground opacity-100"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingEmployee.email}
                    onChange={(e) => updateEditingEmployee('email', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm">Telefone</Label>
                  <Input
                    id="phone"
                    value={editingEmployee.phone}
                    onChange={(e) => updateEditingEmployee('phone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="h-9"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Deixe em branco para não alterar"
                  className="h-9"
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo de 6 caracteres
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="position" className="text-sm">Cargo</Label>
                  <Input
                    id="position"
                    value={editingEmployee.position}
                    onChange={(e) => updateEditingEmployee('position', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="salary" className="text-sm">Salário</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                      R$
                    </span>
                    <Input
                      id="salary"
                      type="text"
                      value={editSalary}
                      onChange={(e) => {
                        // Remover tudo exceto números
                        const apenasNumeros = e.target.value.replace(/\D/g, '');
                        
                        if (apenasNumeros === '') {
                          setEditSalary('');
                          return;
                        }
                        
                        // Converter para centavos e depois para reais
                        const valorEmCentavos = parseInt(apenasNumeros);
                        const valorEmReais = valorEmCentavos / 100;
                        
                        // Formatar no padrão brasileiro
                        const valorFormatado = valorEmReais.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        });
                        
                        setEditSalary(valorFormatado);
                      }}
                      placeholder="0,00"
                      className="h-9 pl-10 font-medium"
                    />
                  </div>
                  {editSalary && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Valor atual: R$ {editSalary}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="department" className="text-sm">Departamento</Label>
                  <Select
                    value={editingEmployee.department}
                    onValueChange={(value) => updateEditingEmployee('department', value)}
                  >
                    <SelectTrigger className="h-9">
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
                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-sm">Status</Label>
                  <Select
                    value={editingEmployee.status}
                    onValueChange={(value) => updateEditingEmployee('status', value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="afastado">Afastado</SelectItem>
                      <SelectItem value="demitido">Demitido</SelectItem>
                      <SelectItem value="em_ferias">Em férias</SelectItem>
                      <SelectItem value="pediu_demissao">Pediu demissão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="endereco" className="text-sm">Endereço</Label>
                <Input
                  id="endereco"
                  value={editEndereco}
                  onChange={(e) => setEditEndereco(e.target.value)}
                  placeholder="Rua, número, bairro, cidade - UF"
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="escala" className="text-sm">Escala de Trabalho</Label>
                  <Select value={editEscala} onValueChange={(v) => { setEditEscala(v); setEditTurno("diurno"); }}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {escalasDisponiveis.map((e) => (
                        <SelectItem key={e.nome} value={e.nome}>{e.descricao || e.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="turno" className="text-sm">Turno</Label>
                  <Select value={editTurno} onValueChange={setEditTurno}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {turnosDisponiveis
                        .filter((t) => !t.escala_nome || t.escala_nome === editEscala)
                        .map((t, idx) => (
                          <SelectItem key={`${t.nome}-${idx}`} value={t.nome}>{t.descricao || t.nome}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admissionDate" className="text-sm">Data de Admissão</Label>
                <Input
                  id="admissionDate"
                  type="date"
                  value={editAdmissionDate}
                  onChange={(e) => setEditAdmissionDate(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-shrink-0 mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="h-9">
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} className="h-9">Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Adicionar Funcionário */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[450px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Adicionar Funcionário</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo funcionário
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 overflow-y-auto pr-2 -mr-2" style={{ maxHeight: 'calc(85vh - 150px)' }}>
            {/* Upload de Foto */}
            <div className="grid gap-1.5">
              <Label className="text-sm">Foto do Funcionário</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-dashed border-muted-foreground/30">
                  {newPhotoPreview ? (
                    <AvatarImage src={newPhotoPreview} alt="Preview" />
                  ) : null}
                  <AvatarFallback className="bg-muted">
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => newPhotoRef.current?.click()}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    {newPhotoPreview ? "Trocar foto" : "Enviar foto"}
                  </Button>
                  <p className="text-[10px] text-muted-foreground">JPEG, PNG ou WebP. Máx 2MB.</p>
                  <input
                    ref={newPhotoRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null, 'new')}
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="new-name" className="text-sm">Nome *</Label>
              <Input
                id="new-name"
                value={newEmployee.name}
                onChange={(e) => updateNewEmployee('name', e.target.value)}
                className={validationErrors.name ? "border-destructive h-9" : "h-9"}
              />
              {validationErrors.name && (
                <p className="text-xs text-destructive">{validationErrors.name}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="new-email" className="text-sm">E-mail *</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmployee.email}
                onChange={(e) => updateNewEmployee('email', e.target.value)}
                className={validationErrors.email ? "border-destructive h-9" : "h-9"}
              />
              {validationErrors.email && (
                <p className="text-xs text-destructive">{validationErrors.email}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="new-phone" className="text-sm">Telefone *</Label>
              <Input
                id="new-phone"
                value={newEmployee.phone}
                onChange={(e) => updateNewEmployee('phone', e.target.value)}
                placeholder="(11) 98765-4321"
                className={validationErrors.phone ? "border-destructive h-9" : "h-9"}
              />
              {validationErrors.phone && (
                <p className="text-xs text-destructive">{validationErrors.phone}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="new-position" className="text-sm">Cargo *</Label>
              <Input
                id="new-position"
                value={newEmployee.position}
                onChange={(e) => updateNewEmployee('position', e.target.value)}
                className={validationErrors.position ? "border-destructive h-9" : "h-9"}
              />
              {validationErrors.position && (
                <p className="text-xs text-destructive">{validationErrors.position}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="new-department" className="text-sm">Departamento *</Label>
              <Select
                value={newEmployee.department}
                onValueChange={(value) => updateNewEmployee('department', value)}
              >
                <SelectTrigger className={validationErrors.department ? "border-destructive h-9" : "h-9"}>
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
                <p className="text-xs text-destructive">{validationErrors.department}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="new-dataNascimento" className="text-sm">Data de Nascimento</Label>
                <Input
                  id="new-dataNascimento"
                  type="date"
                  value={newEmployee.dataNascimento}
                  onChange={(e) => updateNewEmployee('dataNascimento', e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="new-dataAdmissao" className="text-sm">Data de Admissão</Label>
                <Input
                  id="new-dataAdmissao"
                  type="date"
                  value={newEmployee.dataAdmissao}
                  onChange={(e) => updateNewEmployee('dataAdmissao', e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="new-salary" className="text-sm">Salário</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  R$
                </span>
                <Input
                  id="new-salary"
                  type="text"
                  value={newEmployee.salario}
                  onChange={(e) => {
                    const apenasNumeros = e.target.value.replace(/\D/g, '');
                    
                    if (apenasNumeros === '') {
                      updateNewEmployee('salario', '');
                      return;
                    }
                    
                    const valorEmCentavos = parseInt(apenasNumeros);
                    const valorEmReais = valorEmCentavos / 100;
                    
                    const valorFormatado = valorEmReais.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    });
                    
                    updateNewEmployee('salario', valorFormatado);
                  }}
                  placeholder="0,00"
                  className="pl-10 h-9"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="new-endereco" className="text-sm">Endereço</Label>
              <Input
                id="new-endereco"
                value={newEmployee.endereco}
                onChange={(e) => updateNewEmployee('endereco', e.target.value)}
                placeholder="Rua, número, bairro, cidade - UF"
                className="h-9"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="new-escala" className="text-sm">Escala de Trabalho *</Label>
                <Select value={newEscala} onValueChange={(v) => { setNewEscala(v); setNewTurno("diurno"); }}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {escalasDisponiveis.map((e) => (
                      <SelectItem key={e.nome} value={e.nome}>{e.descricao || e.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="new-turno" className="text-sm">Turno *</Label>
                <Select value={newTurno} onValueChange={setNewTurno}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {turnosDisponiveis
                      .filter((t) => !t.escala_nome || t.escala_nome === newEscala)
                      .map((t, idx) => (
                        <SelectItem key={`${t.nome}-${idx}`} value={t.nome}>{t.descricao || t.nome}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="new-rg" className="text-sm">RG</Label>
                <Input
                  id="new-rg"
                  value={newEmployee.rg}
                  onChange={(e) => updateNewEmployee('rg', e.target.value)}
                  placeholder="00.000.000-0"
                  className="h-9"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="new-numero_pis" className="text-sm">Número PIS</Label>
                <Input
                  id="new-numero_pis"
                  value={newEmployee.numero_pis}
                  onChange={(e) => updateNewEmployee('numero_pis', e.target.value)}
                  placeholder="000.00000.00-0"
                  className="h-9"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="new-cpf" className="text-sm">CPF *</Label>
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
                className={validationErrors.cpf ? "border-destructive h-9" : "h-9"}
              />
              {validationErrors.cpf && (
                <p className="text-xs text-destructive">{validationErrors.cpf}</p>
              )}
              <p className="text-xs text-muted-foreground">
                O CPF será usado para login no Portal do Funcionário
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="new-password" className="text-sm">Senha *</Label>
              <Input
                id="new-password"
                type="password"
                value={newEmployee.password}
                onChange={(e) => updateNewEmployee('password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={validationErrors.password ? "border-destructive h-9" : "h-9"}
              />
              {validationErrors.password && (
                <p className="text-xs text-destructive">{validationErrors.password}</p>
              )}
              <p className="text-xs text-muted-foreground">
                A senha será usada para login no Portal do Funcionário
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="new-status" className="text-sm">Status</Label>
              <Select
                value={newEmployee.status}
                onValueChange={(value) => updateNewEmployee('status', value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="afastado">Afastado</SelectItem>
                  <SelectItem value="demitido">Demitido</SelectItem>
                  <SelectItem value="em_ferias">Em férias</SelectItem>
                  <SelectItem value="pediu_demissao">Pediu demissão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Seção de Dependentes */}
            <div className="border-t pt-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium">Dependentes</Label>
                  <Badge variant="secondary" className="text-xs">
                    {newEmployee.dependentes.length}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setNewEmployee({
                      ...newEmployee,
                      dependentes: [...newEmployee.dependentes, { nome: "", idade: "", tipo_dependencia: "filho(a)" }]
                    });
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
              </div>
              
              {newEmployee.dependentes.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Nenhum dependente cadastrado
                </p>
              )}
              
              {newEmployee.dependentes.map((dep, index) => (
                <div key={index} className="border rounded-md p-3 mb-2 bg-muted/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Dependente {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        const newDeps = [...newEmployee.dependentes];
                        newDeps.splice(index, 1);
                        setNewEmployee({ ...newEmployee, dependentes: newDeps });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    <div>
                      <Label className="text-xs">Nome do Dependente *</Label>
                      <Input
                        value={dep.nome}
                        onChange={(e) => {
                          const newDeps = [...newEmployee.dependentes];
                          newDeps[index].nome = e.target.value;
                          setNewEmployee({ ...newEmployee, dependentes: newDeps });
                        }}
                        placeholder="Nome completo"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Idade</Label>
                        <Input
                          type="number"
                          value={dep.idade}
                          onChange={(e) => {
                            const newDeps = [...newEmployee.dependentes];
                            newDeps[index].idade = e.target.value;
                            setNewEmployee({ ...newEmployee, dependentes: newDeps });
                          }}
                          placeholder="Anos"
                          className="h-8 text-sm"
                          min={0}
                          max={120}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Tipo *</Label>
                        <Select
                          value={dep.tipo_dependencia}
                          onValueChange={(value) => {
                            const newDeps = [...newEmployee.dependentes];
                            newDeps[index].tipo_dependencia = value;
                            setNewEmployee({ ...newEmployee, dependentes: newDeps });
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="filho(a)">Filho(a)</SelectItem>
                            <SelectItem value="cônjuge">Cônjuge</SelectItem>
                            <SelectItem value="pai">Pai</SelectItem>
                            <SelectItem value="mãe">Mãe</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 mt-3">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="h-9">
              Cancelar
            </Button>
            <Button onClick={handleSaveNewEmployee} disabled={isSubmitting} className="h-9">
              {isSubmitting ? "Salvando..." : "Adicionar Funcionário"}
            </Button>
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
