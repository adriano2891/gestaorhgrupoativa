import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ShieldCheck, Search, Download, ChevronDown, ChevronRight,
  UserPlus, Clock, Wallet, Landmark, Palmtree, Gift, 
  HardHat, FileX, ShieldAlert, Heart
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

// ========== TYPES ==========
type Dependencia = "sistema" | "parcial" | "procedimento";
type AuditoriaStatus = "conforme" | "nao_conforme" | "nao_aplicavel" | "pendente";

interface CheckItem {
  id: string;
  nome: string;
  descricao: string;
  baseLegal: string;
  risco: string;
  dependencia: Dependencia;
}

interface Categoria {
  id: string;
  titulo: string;
  emoji: string;
  icon: React.ReactNode;
  items: CheckItem[];
}

// ========== DATA ==========
const CATEGORIAS: Categoria[] = [
  {
    id: "admissao", titulo: "Admissão de Funcionários", emoji: "1️⃣",
    icon: <UserPlus className="h-5 w-5" />,
    items: [
      { id: "a1", nome: "Registro do empregado", descricao: "Registro antes do início das atividades", baseLegal: "CLT Art. 41", risco: "Multa administrativa", dependencia: "parcial" },
      { id: "a2", nome: "Cadastro no eSocial", descricao: "Envio evento S-1000/S-2200", baseLegal: "eSocial", risco: "Multa por omissão", dependencia: "sistema" },
      { id: "a3", nome: "Assinatura de contrato", descricao: "Formalização do vínculo empregatício", baseLegal: "CLT", risco: "Reclamação trabalhista", dependencia: "procedimento" },
      { id: "a4", nome: "Exame admissional", descricao: "Atestar aptidão para a função", baseLegal: "NR-7", risco: "Multa e ação judicial", dependencia: "procedimento" },
      { id: "a5", nome: "Coleta de documentos", descricao: "RG, CPF, endereço, dados bancários", baseLegal: "CLT", risco: "Risco documental", dependencia: "procedimento" },
      { id: "a6", nome: "Cadastro no sistema de folha", descricao: "Inclusão correta do funcionário no sistema", baseLegal: "CLT", risco: "Erro em cálculos", dependencia: "sistema" },
      { id: "a7", nome: "Cadastro no FGTS", descricao: "Registro na conta vinculada", baseLegal: "Lei 8.036/90", risco: "Multa FGTS", dependencia: "sistema" },
      { id: "a8", nome: "Cadastro no INSS", descricao: "Contribuição previdenciária", baseLegal: "Lei 8.212/91", risco: "Multa", dependencia: "sistema" },
      { id: "a9", nome: "Definição de cargo", descricao: "Compatibilidade com função exercida", baseLegal: "CLT", risco: "Desvio de função", dependencia: "procedimento" },
      { id: "a10", nome: "Entrega de regulamento interno", descricao: "Normas e políticas da empresa", baseLegal: "CLT", risco: "Questionamentos judiciais", dependencia: "procedimento" },
    ],
  },
  {
    id: "jornada", titulo: "Jornada de Trabalho", emoji: "2️⃣",
    icon: <Clock className="h-5 w-5" />,
    items: [
      { id: "j1", nome: "Controle de ponto", descricao: "Registro de jornada obrigatório", baseLegal: "CLT Art. 74", risco: "Multa", dependencia: "parcial" },
      { id: "j2", nome: "Registro correto de horas", descricao: "Marcação real da jornada", baseLegal: "CLT", risco: "Processo trabalhista", dependencia: "parcial" },
      { id: "j3", nome: "Controle de horas extras", descricao: "Limite legal de 2h diárias", baseLegal: "CLT Art. 59", risco: "Multa", dependencia: "sistema" },
      { id: "j4", nome: "Pagamento adicional HE", descricao: "Mínimo 50% dia útil, 100% DSR/feriado", baseLegal: "CLT Art. 59", risco: "Ação judicial", dependencia: "sistema" },
      { id: "j5", nome: "Intervalo intrajornada", descricao: "Mínimo 1h para jornada > 6h", baseLegal: "CLT Art. 71", risco: "Multa", dependencia: "parcial" },
      { id: "j6", nome: "Intervalo interjornada", descricao: "Mínimo 11h entre jornadas", baseLegal: "CLT Art. 66", risco: "Multa", dependencia: "parcial" },
      { id: "j7", nome: "Descanso semanal remunerado", descricao: "DSR obrigatório", baseLegal: "Lei 605/49", risco: "Multa", dependencia: "sistema" },
      { id: "j8", nome: "Escalas de trabalho", descricao: "Ex: 12x36, turnos ininterruptos", baseLegal: "CLT", risco: "Processo", dependencia: "procedimento" },
      { id: "j9", nome: "Banco de horas", descricao: "Acordo formal individual ou coletivo", baseLegal: "CLT Art. 59", risco: "Multa", dependencia: "parcial" },
      { id: "j10", nome: "Compensação de horas", descricao: "Controle correto de compensações", baseLegal: "CLT", risco: "Processo", dependencia: "parcial" },
    ],
  },
  {
    id: "folha", titulo: "Folha de Pagamento", emoji: "3️⃣",
    icon: <Wallet className="h-5 w-5" />,
    items: [
      { id: "f1", nome: "Cálculo salarial", descricao: "Salário base correto", baseLegal: "CLT", risco: "Reclamação", dependencia: "sistema" },
      { id: "f2", nome: "Pagamento até 5º dia útil", descricao: "Prazo legal de pagamento", baseLegal: "CLT Art. 459", risco: "Multa", dependencia: "procedimento" },
      { id: "f3", nome: "Cálculo horas extras", descricao: "Adicional correto sobre HE", baseLegal: "CLT", risco: "Processo", dependencia: "sistema" },
      { id: "f4", nome: "Adicional noturno", descricao: "20% mínimo sobre hora diurna", baseLegal: "CLT Art. 73", risco: "Multa", dependencia: "sistema" },
      { id: "f5", nome: "Insalubridade", descricao: "Pagamento conforme grau (10/20/40%)", baseLegal: "CLT", risco: "Ação judicial", dependencia: "parcial" },
      { id: "f6", nome: "Periculosidade", descricao: "Adicional de 30% sobre salário base", baseLegal: "CLT", risco: "Multa", dependencia: "parcial" },
      { id: "f7", nome: "Descontos autorizados", descricao: "Ex: VT, plano saúde, pensão", baseLegal: "CLT", risco: "Reclamação", dependencia: "procedimento" },
      { id: "f8", nome: "Entrega de holerite", descricao: "Comprovante de pagamento mensal", baseLegal: "CLT", risco: "Reclamação", dependencia: "procedimento" },
      { id: "f9", nome: "Integração comissões", descricao: "Cálculo correto sobre comissões", baseLegal: "CLT", risco: "Processo", dependencia: "sistema" },
      { id: "f10", nome: "Registro na folha", descricao: "Valores corretos registrados", baseLegal: "CLT", risco: "Multa", dependencia: "sistema" },
    ],
  },
  {
    id: "fgts_inss", titulo: "FGTS e INSS", emoji: "4️⃣",
    icon: <Landmark className="h-5 w-5" />,
    items: [
      { id: "fi1", nome: "Depósito FGTS", descricao: "8% sobre salário bruto", baseLegal: "Lei 8.036", risco: "Multa", dependencia: "sistema" },
      { id: "fi2", nome: "FGTS prazo correto", descricao: "Depósito até dia 7 de cada mês", baseLegal: "Lei FGTS", risco: "Multa", dependencia: "sistema" },
      { id: "fi3", nome: "FGTS rescisão", descricao: "Depósito correto na rescisão", baseLegal: "CLT", risco: "Processo", dependencia: "sistema" },
      { id: "fi4", nome: "INSS empregado", descricao: "Desconto correto na folha", baseLegal: "Lei 8.212", risco: "Multa", dependencia: "sistema" },
      { id: "fi5", nome: "INSS empresa", descricao: "Recolhimento patronal correto", baseLegal: "Lei 8.212", risco: "Multa", dependencia: "sistema" },
      { id: "fi6", nome: "DCTFWeb", descricao: "Envio correto à Receita Federal", baseLegal: "Receita Federal", risco: "Multa", dependencia: "sistema" },
      { id: "fi7", nome: "eSocial eventos", descricao: "Transmissão correta de eventos", baseLegal: "eSocial", risco: "Multa", dependencia: "sistema" },
      { id: "fi8", nome: "GFIP histórica", descricao: "Registros antigos corretos", baseLegal: "Caixa", risco: "Multa", dependencia: "sistema" },
    ],
  },
  {
    id: "ferias", titulo: "Férias", emoji: "5️⃣",
    icon: <Palmtree className="h-5 w-5" />,
    items: [
      { id: "fe1", nome: "Controle período aquisitivo", descricao: "12 meses de trabalho", baseLegal: "CLT", risco: "Multa", dependencia: "sistema" },
      { id: "fe2", nome: "Concessão de férias", descricao: "Até 12 meses após período aquisitivo", baseLegal: "CLT", risco: "Multa (férias em dobro)", dependencia: "sistema" },
      { id: "fe3", nome: "Comunicação de férias", descricao: "30 dias de antecedência por escrito", baseLegal: "CLT", risco: "Multa", dependencia: "procedimento" },
      { id: "fe4", nome: "Pagamento de férias", descricao: "Até 2 dias antes do início do gozo", baseLegal: "CLT", risco: "Multa (dobro)", dependencia: "procedimento" },
      { id: "fe5", nome: "Adicional 1/3", descricao: "Terço constitucional obrigatório", baseLegal: "CF Art. 7º", risco: "Processo", dependencia: "sistema" },
      { id: "fe6", nome: "Registro de férias", descricao: "Registro correto no sistema", baseLegal: "CLT", risco: "Multa", dependencia: "sistema" },
      { id: "fe7", nome: "Férias fracionadas", descricao: "Respeitar limites legais (até 3 períodos)", baseLegal: "CLT", risco: "Processo", dependencia: "parcial" },
    ],
  },
  {
    id: "decimo", titulo: "13º Salário", emoji: "6️⃣",
    icon: <Gift className="h-5 w-5" />,
    items: [
      { id: "d1", nome: "Primeira parcela", descricao: "Pagamento até 30 de novembro", baseLegal: "Lei 4.749", risco: "Multa", dependencia: "sistema" },
      { id: "d2", nome: "Segunda parcela", descricao: "Pagamento até 20 de dezembro", baseLegal: "Lei 4.749", risco: "Multa", dependencia: "sistema" },
      { id: "d3", nome: "Desconto INSS", descricao: "Cálculo correto sobre 13º", baseLegal: "INSS", risco: "Multa", dependencia: "sistema" },
      { id: "d4", nome: "FGTS sobre 13º", descricao: "Recolhimento correto", baseLegal: "FGTS", risco: "Multa", dependencia: "sistema" },
    ],
  },
  {
    id: "beneficios", titulo: "Benefícios", emoji: "7️⃣",
    icon: <Heart className="h-5 w-5" />,
    items: [
      { id: "b1", nome: "Vale transporte", descricao: "Desconto máximo de 6% do salário base", baseLegal: "Lei 7.418", risco: "Processo", dependencia: "parcial" },
      { id: "b2", nome: "Vale alimentação", descricao: "Regras conforme contrato/convenção", baseLegal: "CLT", risco: "Reclamação", dependencia: "procedimento" },
      { id: "b3", nome: "Plano de saúde", descricao: "Desconto autorizado pelo empregado", baseLegal: "CLT", risco: "Processo", dependencia: "procedimento" },
      { id: "b4", nome: "Auxílio creche", descricao: "Quando aplicável por convenção/lei", baseLegal: "CLT", risco: "Multa", dependencia: "procedimento" },
    ],
  },
  {
    id: "sst", titulo: "Segurança do Trabalho (NRs)", emoji: "8️⃣",
    icon: <HardHat className="h-5 w-5" />,
    items: [
      { id: "s1", nome: "PGR", descricao: "Programa de Gerenciamento de Riscos", baseLegal: "NR-1", risco: "Multa", dependencia: "procedimento" },
      { id: "s2", nome: "PCMSO", descricao: "Programa de Controle Médico de Saúde Ocupacional", baseLegal: "NR-7", risco: "Multa", dependencia: "procedimento" },
      { id: "s3", nome: "Exames periódicos", descricao: "Monitoramento de saúde ocupacional", baseLegal: "NR-7", risco: "Multa", dependencia: "procedimento" },
      { id: "s4", nome: "Entrega de EPI", descricao: "Equipamento de proteção individual", baseLegal: "NR-6", risco: "Multa", dependencia: "procedimento" },
      { id: "s5", nome: "Treinamentos NR", descricao: "Treinamentos obrigatórios por norma", baseLegal: "NRs", risco: "Multa", dependencia: "procedimento" },
      { id: "s6", nome: "CIPA", descricao: "Comissão Interna de Prevenção de Acidentes", baseLegal: "NR-5", risco: "Multa", dependencia: "procedimento" },
    ],
  },
  {
    id: "rescisao", titulo: "Rescisão de Contrato", emoji: "9️⃣",
    icon: <FileX className="h-5 w-5" />,
    items: [
      { id: "r1", nome: "Prazo pagamento", descricao: "Até 10 dias corridos do término", baseLegal: "CLT Art. 477", risco: "Multa (salário do empregado)", dependencia: "sistema" },
      { id: "r2", nome: "Cálculo de verbas", descricao: "Saldo, férias, 13º, aviso, FGTS", baseLegal: "CLT", risco: "Processo", dependencia: "sistema" },
      { id: "r3", nome: "Multa FGTS 40%", descricao: "Demissão sem justa causa", baseLegal: "Lei FGTS", risco: "Multa", dependencia: "sistema" },
      { id: "r4", nome: "TRCT", descricao: "Termo de Rescisão do Contrato de Trabalho", baseLegal: "CLT", risco: "Processo", dependencia: "sistema" },
      { id: "r5", nome: "Baixa no eSocial", descricao: "Envio evento S-2299", baseLegal: "eSocial", risco: "Multa", dependencia: "sistema" },
    ],
  },
  {
    id: "lgpd", titulo: "LGPD – Dados de Funcionários", emoji: "🔟",
    icon: <ShieldAlert className="h-5 w-5" />,
    items: [
      { id: "l1", nome: "Proteção de dados pessoais", descricao: "Armazenamento seguro e criptografado", baseLegal: "LGPD", risco: "Multa até 2% faturamento", dependencia: "parcial" },
      { id: "l2", nome: "Acesso restrito", descricao: "Controle de acesso aos dados do RH", baseLegal: "LGPD", risco: "Multa", dependencia: "parcial" },
      { id: "l3", nome: "Política de privacidade", descricao: "Documento interno formalizado", baseLegal: "LGPD", risco: "Multa", dependencia: "procedimento" },
    ],
  },
];

const STORAGE_KEY = "checklist-trabalhista-v2";

const DEP_CONFIG: Record<Dependencia, { label: string; color: string; emoji: string }> = {
  sistema: { label: "Sistema", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", emoji: "🟦" },
  parcial: { label: "Parcial", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", emoji: "🟨" },
  procedimento: { label: "Procedimento", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300", emoji: "🟥" },
};

const AUDIT_CONFIG: Record<AuditoriaStatus, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-muted text-muted-foreground" },
  conforme: { label: "Conforme", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  nao_conforme: { label: "Não conforme", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  nao_aplicavel: { label: "N/A", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

const ChecklistTrabalhista = () => {
  const [auditoriaMap, setAuditoriaMap] = useState<Record<string, AuditoriaStatus>>({});
  const [busca, setBusca] = useState("");
  const [filtroDepend, setFiltroDepend] = useState<string>("todos");
  const [filtroAudit, setFiltroAudit] = useState<string>("todos");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CATEGORIAS.map(c => [c.id, true]))
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setAuditoriaMap(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const setAuditoria = (id: string, status: AuditoriaStatus) => {
    setAuditoriaMap(prev => {
      const next = { ...prev, [id]: status };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allItems = CATEGORIAS.flatMap(c => c.items);
  const totalItems = allItems.length;
  const conformeCount = allItems.filter(i => auditoriaMap[i.id] === "conforme").length;
  const naoConformeCount = allItems.filter(i => auditoriaMap[i.id] === "nao_conforme").length;
  const naCount = allItems.filter(i => auditoriaMap[i.id] === "nao_aplicavel").length;
  const pendenteCount = totalItems - conformeCount - naoConformeCount - naCount;
  const progressPct = totalItems ? Math.round(((conformeCount + naCount) / totalItems) * 100) : 0;

  const sistemaCount = allItems.filter(i => i.dependencia === "sistema").length;
  const parcialCount = allItems.filter(i => i.dependencia === "parcial").length;
  const procedimentoCount = allItems.filter(i => i.dependencia === "procedimento").length;

  const filterItems = (items: CheckItem[]) => {
    return items.filter(item => {
      const q = busca.toLowerCase();
      const matchBusca = !q || item.nome.toLowerCase().includes(q) || item.descricao.toLowerCase().includes(q) || item.baseLegal.toLowerCase().includes(q) || item.risco.toLowerCase().includes(q);
      const matchDep = filtroDepend === "todos" || item.dependencia === filtroDepend;
      const status = auditoriaMap[item.id] || "pendente";
      const matchAudit = filtroAudit === "todos" || status === filtroAudit;
      return matchBusca && matchDep && matchAudit;
    });
  };

  const exportCSV = () => {
    const rows = [
      ["Categoria", "Item", "Descrição", "Base Legal", "Risco", "Dependência", "Auditoria"],
      ...CATEGORIAS.flatMap(cat =>
        cat.items.map(i => [
          cat.titulo,
          i.nome,
          i.descricao,
          i.baseLegal,
          i.risco,
          DEP_CONFIG[i.dependencia].label,
          AUDIT_CONFIG[auditoriaMap[i.id] || "pendente"].label,
        ])
      ),
    ];
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checklist-trabalhista-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton to="/gestao-rh" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                Checklist de Conformidade Trabalhista
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Auditoria baseada em CLT, eSocial, FGTS, NRs e LGPD
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2 shrink-0">
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>

        {/* Progress + Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progresso da Auditoria</p>
                <p className="text-2xl font-bold text-foreground">{conformeCount + naCount}/{totalItems} itens resolvidos</p>
              </div>
              <div className="text-3xl font-bold text-primary">{progressPct}%</div>
            </div>
            <Progress value={progressPct} className="h-3 mb-4" />

            {/* Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                <p className="text-lg font-bold text-green-700 dark:text-green-400">{conformeCount}</p>
                <p className="text-xs text-muted-foreground">Conforme</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                <p className="text-lg font-bold text-red-700 dark:text-red-400">{naoConformeCount}</p>
                <p className="text-xs text-muted-foreground">Não conforme</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-muted-foreground">{naCount}</p>
                <p className="text-xs text-muted-foreground">N/A</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{pendenteCount}</p>
                <p className="text-xs text-muted-foreground">Pendente</p>
              </div>
            </div>

            {/* Dependency legend */}
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-blue-500" /> Sistema ({sistemaCount})</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-amber-500" /> Parcial ({parcialCount})</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-red-500" /> Procedimento ({procedimentoCount})</span>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar item, legislação ou risco..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-10" />
          </div>
          <Select value={filtroDepend} onValueChange={setFiltroDepend}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Dependência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas dependências</SelectItem>
              <SelectItem value="sistema">🟦 Sistema</SelectItem>
              <SelectItem value="parcial">🟨 Parcial</SelectItem>
              <SelectItem value="procedimento">🟥 Procedimento</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroAudit} onValueChange={setFiltroAudit}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Auditoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              <SelectItem value="pendente">⬜ Pendente</SelectItem>
              <SelectItem value="conforme">✅ Conforme</SelectItem>
              <SelectItem value="nao_conforme">❌ Não conforme</SelectItem>
              <SelectItem value="nao_aplicavel">➖ N/A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Categories */}
        {CATEGORIAS.map(cat => {
          const filtered = filterItems(cat.items);
          if (filtered.length === 0 && (busca || filtroDepend !== "todos" || filtroAudit !== "todos")) return null;
          const catConforme = cat.items.filter(i => auditoriaMap[i.id] === "conforme" || auditoriaMap[i.id] === "nao_aplicavel").length;
          const catPct = cat.items.length ? Math.round((catConforme / cat.items.length) * 100) : 0;

          return (
            <Collapsible key={cat.id} open={openSections[cat.id]} onOpenChange={() => toggleSection(cat.id)}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        {openSections[cat.id] ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                        <span className="text-primary">{cat.icon}</span>
                        <span>{cat.emoji} {cat.titulo}</span>
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground hidden sm:inline">{catConforme}/{cat.items.length}</span>
                        <Badge variant="outline" className="text-xs">{catPct}%</Badge>
                      </div>
                    </div>
                    <Progress value={catPct} className="h-1.5 mt-2" />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="hidden md:table-cell">Descrição</TableHead>
                          <TableHead className="hidden sm:table-cell">Base Legal</TableHead>
                          <TableHead className="hidden lg:table-cell">Risco</TableHead>
                          <TableHead className="w-28">Dependência</TableHead>
                          <TableHead className="w-36">Auditoria</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map(item => {
                          const dep = DEP_CONFIG[item.dependencia];
                          const status = auditoriaMap[item.id] || "pendente";
                          const rowBg = status === "conforme"
                            ? "bg-green-50/50 dark:bg-green-950/10"
                            : status === "nao_conforme"
                            ? "bg-red-50/50 dark:bg-red-950/10"
                            : "";

                          return (
                            <TableRow key={item.id} className={rowBg}>
                              <TableCell className="font-medium text-sm">
                                {item.nome}
                                <p className="md:hidden text-xs text-muted-foreground mt-0.5">{item.descricao}</p>
                                <p className="sm:hidden text-xs text-muted-foreground font-mono">{item.baseLegal}</p>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{item.descricao}</TableCell>
                              <TableCell className="hidden sm:table-cell text-xs font-mono text-muted-foreground">{item.baseLegal}</TableCell>
                              <TableCell className="hidden lg:table-cell text-xs text-destructive">{item.risco}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={`text-[10px] ${dep.color}`}>
                                  {dep.emoji} {dep.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Select value={status} onValueChange={(v) => setAuditoria(item.id, v as AuditoriaStatus)}>
                                  <SelectTrigger className="h-7 text-xs w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pendente">⬜ Pendente</SelectItem>
                                    <SelectItem value="conforme">✅ Conforme</SelectItem>
                                    <SelectItem value="nao_conforme">❌ Não conforme</SelectItem>
                                    <SelectItem value="nao_aplicavel">➖ N/A</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {filtered.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                              Nenhum item encontrado com os filtros aplicados
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}

        {/* Footer info */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
              <div className="space-y-1">
                <p className="font-medium text-foreground">✔ {totalItems} pontos de verificação</p>
                <p>Usado para: auditoria de RH • auditoria contábil trabalhista • prevenção de processos • compliance</p>
              </div>
              <p>Status salvo automaticamente no navegador</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ChecklistTrabalhista;
