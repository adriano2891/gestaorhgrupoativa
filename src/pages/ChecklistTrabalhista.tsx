import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Monitor, Users, FileText, ShieldCheck, AlertTriangle, 
  CheckCircle2, Clock, Search, Download
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ========== DATA ==========

interface ChecklistItem {
  id: string;
  nome: string;
  descricaoRisco?: string;
  multa?: string;
  fundamentacao?: string;
  // Category 2
  dependeSistema?: string;
  dependeProcesso?: string;
  // Category 3
  descricaoObrigacao?: string;
}

const ITEMS_SISTEMA: ChecklistItem[] = [
  { id: "s1", nome: "Cálculo de folha de pagamento", descricaoRisco: "Erros no cálculo de salários, descontos e encargos", multa: "Multa de R$ 170,26 a R$ 17.026,42 por trabalhador (Art. 510 CLT) + diferenças salariais em reclamação trabalhista", fundamentacao: "Art. 459, 462 CLT; eSocial S-1200" },
  { id: "s2", nome: "Cálculo de férias", descricaoRisco: "Pagamento incorreto ou fora do prazo de férias", multa: "Pagamento em dobro das férias não concedidas (Art. 137 CLT) + 1/3 constitucional. Multa administrativa de R$ 170,26 por empregado", fundamentacao: "Art. 129-145 CLT; CF Art. 7º, XVII" },
  { id: "s3", nome: "Cálculo de 13º salário", descricaoRisco: "Erro no cálculo proporcional ou atraso no pagamento", multa: "Multa de R$ 170,26 por empregado (Lei 4.090/62). Reclamação trabalhista com juros e correção", fundamentacao: "Lei 4.090/62; Lei 4.749/65" },
  { id: "s4", nome: "Cálculo e recolhimento de FGTS", descricaoRisco: "Recolhimento incorreto ou em atraso do FGTS", multa: "Multa de 5% do valor não depositado + juros (Lei 8.036/90). Multa administrativa de R$ 10,64 a R$ 106,41 por trabalhador", fundamentacao: "Lei 8.036/90 Art. 23; eSocial S-1200" },
  { id: "s5", nome: "Geração de eventos eSocial", descricaoRisco: "Envio atrasado, incorreto ou ausente de eventos obrigatórios", multa: "Multa por evento não enviado: R$ 402,54 a R$ 181.284,63 conforme Art. 92 da Lei 8.212/91", fundamentacao: "eSocial S-2200, S-2206, S-2230, S-2299" },
  { id: "s6", nome: "Registro eletrônico de jornada (REP-A)", descricaoRisco: "Sistema de ponto não conforme com Portaria 671/2021", multa: "Multa de R$ 4.025,33 por empregado prejudicado (Art. 75 CLT). Inversão do ônus da prova em reclamação", fundamentacao: "Portaria 671/2021; Art. 74 §2º CLT" },
  { id: "s7", nome: "Controle de banco de horas", descricaoRisco: "Compensação fora do prazo ou sem acordo formal", multa: "Pagamento de todas as horas como extras (50% ou 100%). Nulidade do banco de horas", fundamentacao: "Art. 59 §2º e §5º CLT" },
  { id: "s8", nome: "Cálculo de horas extras", descricaoRisco: "Percentuais incorretos ou não pagamento de HE", multa: "Diferenças salariais com reflexos em DSR, férias, 13º e FGTS. Multa do Art. 510 CLT", fundamentacao: "Art. 59 CLT; Súmula 172 TST" },
  { id: "s9", nome: "Cálculo de adicional noturno", descricaoRisco: "Não pagamento ou cálculo incorreto do adicional noturno (20%)", multa: "Diferenças salariais + reflexos. Multa administrativa", fundamentacao: "Art. 73 CLT (20% sobre hora diurna, hora reduzida 52min30s)" },
  { id: "s10", nome: "Cálculo de verbas rescisórias", descricaoRisco: "Erro no cálculo de saldo salário, aviso prévio, férias proporcionais, 13º, multa FGTS", multa: "Multa do Art. 477 §8º CLT: salário mensal do empregado. Juros e correção sobre diferenças", fundamentacao: "Art. 477 CLT; Lei 12.506/2011" },
  { id: "s11", nome: "Controle de períodos aquisitivos de férias", descricaoRisco: "Perda de controle sobre vencimento de férias", multa: "Pagamento em dobro (Art. 137 CLT). Multa administrativa de R$ 170,26 por empregado", fundamentacao: "Art. 130, 134, 137 CLT" },
  { id: "s12", nome: "Cálculo de DSR (Descanso Semanal Remunerado)", descricaoRisco: "Não inclusão de HE habituais no cálculo do DSR", multa: "Diferenças salariais + reflexos (Súmula 172 TST)", fundamentacao: "Lei 605/49; Súmula 172 TST" },
  { id: "s13", nome: "Geração de comprovantes de ponto", descricaoRisco: "Não emissão de comprovante ao empregado após cada marcação", multa: "Irregularidade perante MTE. Multa do Art. 75 CLT", fundamentacao: "Portaria 671/2021 Art. 79" },
  { id: "s14", nome: "Controle de intervalo intrajornada", descricaoRisco: "Não concessão ou supressão parcial do intervalo de 1h", multa: "Pagamento do período suprimido como hora extra (Art. 71 §4º CLT). Natureza indenizatória", fundamentacao: "Art. 71 CLT; Súmula 437 TST" },
  { id: "s15", nome: "Controle de intervalo interjornada (11h)", descricaoRisco: "Não respeitar o intervalo mínimo de 11h entre jornadas", multa: "Horas extras sobre o período suprimido (OJ 355 SDI-1 TST)", fundamentacao: "Art. 66 CLT" },
  { id: "s16", nome: "Gestão de afastamentos e INSS", descricaoRisco: "Falha no controle dos 15 dias de responsabilidade da empresa", multa: "Pagamento indevido ou falta de encaminhamento ao INSS", fundamentacao: "Lei 8.213/91 Art. 60" },
  { id: "s17", nome: "Relatórios de auditoria trabalhista", descricaoRisco: "Impossibilidade de comprovar conformidade em fiscalizações", multa: "Presunção de irregularidade pelo MTE. Multas diversas", fundamentacao: "Art. 41, 74 CLT" },
];

const ITEMS_PARCIAL: ChecklistItem[] = [
  { id: "p1", nome: "Registro correto de ponto pelos funcionários", dependeSistema: "Disponibilidade do sistema REP-A, geolocalização, comprovantes automáticos", dependeProcesso: "Funcionário registrar nos horários corretos, sem fraudes ou omissões", descricaoRisco: "Inversão do ônus da prova contra a empresa (Súmula 338 TST). Multa de R$ 4.025,33", fundamentacao: "Art. 74 CLT; Portaria 671/2021" },
  { id: "p2", nome: "Aprovação de horas extras", dependeSistema: "Registro automático de HE no ponto, alertas ao gestor", dependeProcesso: "Gestor aprovar/rejeitar HE tempestivamente, verificar necessidade real", descricaoRisco: "Pagamento de HE não autorizadas ou não pagamento de HE devidas", fundamentacao: "Art. 59 CLT" },
  { id: "p3", nome: "Gestão de banco de horas", dependeSistema: "Cálculo automático de créditos/débitos, vencimentos, saldos", dependeProcesso: "Acordo individual/coletivo vigente, compensação dentro do prazo legal", descricaoRisco: "Nulidade do banco de horas e pagamento integral de HE (50-100%)", fundamentacao: "Art. 59 §2º e §5º CLT" },
  { id: "p4", nome: "Registro de atestados médicos", dependeSistema: "Upload e armazenamento seguro, vinculação ao ponto/afastamento", dependeProcesso: "Funcionário apresentar atestado em até 48h, RH validar CRM e período", descricaoRisco: "Descontos indevidos de faltas justificadas. Reclamação trabalhista", fundamentacao: "Art. 6º Lei 605/49; CLT Art. 473" },
  { id: "p5", nome: "Controle de faltas e justificativas", dependeSistema: "Identificação automática de faltas no sistema de ponto", dependeProcesso: "Funcionário justificar ausências, RH avaliar e registrar", descricaoRisco: "Descontos indevidos ou não desconto de faltas injustificadas afetando férias (Art. 130 CLT)", fundamentacao: "Art. 130, 131, 473 CLT" },
  { id: "p6", nome: "Solicitação e aprovação de férias", dependeSistema: "Cálculo de período aquisitivo, proporcionalidades, alertas de vencimento", dependeProcesso: "Programação com 30 dias de antecedência, aprovação do gestor, pagamento 2 dias antes", descricaoRisco: "Férias em dobro (Art. 137 CLT). Multa administrativa", fundamentacao: "Art. 134, 135, 137, 145 CLT" },
  { id: "p7", nome: "Ajustes de ponto", dependeSistema: "Workflow de solicitação, aprovação com trilha de auditoria", dependeProcesso: "Funcionário solicitar ajuste com justificativa, gestor aprovar/rejeitar", descricaoRisco: "Fraude no registro de ponto. Irregularidade perante MTE", fundamentacao: "Portaria 671/2021" },
  { id: "p8", nome: "Gestão de escalas e turnos", dependeSistema: "Cadastro de escalas, validação de intervalos legais", dependeProcesso: "Gestor definir escalas respeitando limites legais, comunicar funcionários", descricaoRisco: "Violação de interjornada (11h) e intrajornada (1h). HE indevidas", fundamentacao: "Art. 58, 66, 71 CLT" },
  { id: "p9", nome: "Comunicados internos com confirmação de leitura", dependeSistema: "Envio, rastreamento de leitura, armazenamento com log de auditoria", dependeProcesso: "RH elaborar comunicados claros, garantir que todos os funcionários acessem", descricaoRisco: "Alegação de desconhecimento de normas internas em processos trabalhistas", fundamentacao: "CLT Art. 444; Princípio da publicidade" },
  { id: "p10", nome: "Controle de EPIs entregues", dependeSistema: "Registro de entrega com assinatura digital, alertas de validade", dependeProcesso: "Empresa adquirir EPIs adequados, entregar e fiscalizar uso", descricaoRisco: "Multa NR-6 de R$ 2.396,35 a R$ 6.708,09. Responsabilidade por acidente", fundamentacao: "NR-6; Art. 166, 167 CLT" },
  { id: "p11", nome: "Chamados de suporte ao funcionário", dependeSistema: "Abertura, protocolo automático, SLA de atendimento, trilha de auditoria", dependeProcesso: "RH responder dentro do prazo, resolver pendências administrativas", descricaoRisco: "Acúmulo de irregularidades não resolvidas. Passivo trabalhista", fundamentacao: "Art. 2º CLT (poder diretivo)" },
];

const ITEMS_EXTERNO: ChecklistItem[] = [
  { id: "e1", nome: "Assinatura de contrato de trabalho (CTPS)", descricaoObrigacao: "Registrar o empregado na CTPS em até 5 dias úteis da admissão", multa: "Multa de R$ 3.000,00 por empregado não registrado (R$ 800,00 para ME/EPP). Reincidência dobra", fundamentacao: "Art. 29, 41 CLT; eSocial S-2200" },
  { id: "e2", nome: "Exame médico admissional", descricaoObrigacao: "Realizar ASO antes do início das atividades", multa: "Multa de R$ 1.436,53 a R$ 4.024,42 por infração (NR-7). Responsabilidade por doenças pré-existentes", fundamentacao: "NR-7; Art. 168 CLT" },
  { id: "e3", nome: "Exame médico periódico", descricaoObrigacao: "Realizar exames periódicos conforme PCMSO (anual, bianual ou conforme risco)", multa: "Multa NR-7 de R$ 1.436,53 a R$ 4.024,42. Responsabilidade por doença ocupacional", fundamentacao: "NR-7 item 7.5.8" },
  { id: "e4", nome: "Exame médico demissional", descricaoObrigacao: "Realizar ASO demissional até a data da homologação", multa: "Multa NR-7. Risco de ação trabalhista alegando doença ocupacional pré-demissão", fundamentacao: "NR-7 item 7.5.11; Art. 168 CLT" },
  { id: "e5", nome: "Entrega de EPI com treinamento", descricaoObrigacao: "Fornecer EPI adequado ao risco e treinar o empregado para uso correto", multa: "Multa NR-6 de R$ 2.396,35 a R$ 6.708,09. Culpa exclusiva do empregador em acidente", fundamentacao: "NR-6; Art. 157, 166 CLT" },
  { id: "e6", nome: "Treinamentos obrigatórios (NRs)", descricaoObrigacao: "Realizar treinamentos de NR-5 (CIPA), NR-6 (EPI), NR-10 (Elétrica), NR-35 (Altura), etc.", multa: "Multa específica por NR violada (R$ 1.000 a R$ 50.000+). Interdição de atividades", fundamentacao: "NRs específicas; Art. 157 CLT" },
  { id: "e7", nome: "Comunicação de férias com 30 dias de antecedência", descricaoObrigacao: "Notificar o empregado por escrito com no mínimo 30 dias de antecedência", multa: "Nulidade da concessão, obrigação de remarcar. Multa administrativa", fundamentacao: "Art. 135 CLT" },
  { id: "e8", nome: "Pagamento de férias 2 dias antes do início", descricaoObrigacao: "Pagar remuneração de férias + 1/3 constitucional até 2 dias antes do início do gozo", multa: "Pagamento em dobro das férias (Súmula 450 TST). Multa Art. 137 CLT", fundamentacao: "Art. 145 CLT; Súmula 450 TST" },
  { id: "e9", nome: "Aviso prévio formal", descricaoObrigacao: "Comunicar formalmente o aviso prévio (30 a 90 dias conforme tempo de serviço)", multa: "Pagamento de salário correspondente ao período não concedido. Art. 487 §1º CLT", fundamentacao: "Art. 487 CLT; Lei 12.506/2011" },
  { id: "e10", nome: "Homologação de rescisão", descricaoObrigacao: "Pagar verbas rescisórias em até 10 dias do término do contrato", multa: "Multa equivalente ao salário do empregado (Art. 477 §8º CLT)", fundamentacao: "Art. 477 §6º e §8º CLT" },
  { id: "e11", nome: "Entrega de holerite/contracheque", descricaoObrigacao: "Fornecer demonstrativo de pagamento detalhado ao empregado mensalmente", multa: "Reclamação trabalhista por falta de transparência. Inversão do ônus da prova", fundamentacao: "Art. 464 CLT" },
  { id: "e12", nome: "Elaboração de PPRA/PGR", descricaoObrigacao: "Manter Programa de Gerenciamento de Riscos atualizado", multa: "Multa NR-1 de R$ 2.396,35 a R$ 6.708,09. Embargo/interdição", fundamentacao: "NR-1; NR-9" },
  { id: "e13", nome: "Elaboração de PCMSO", descricaoObrigacao: "Manter Programa de Controle Médico de Saúde Ocupacional", multa: "Multa NR-7 de R$ 1.436,53 a R$ 4.024,42", fundamentacao: "NR-7; Art. 168 CLT" },
  { id: "e14", nome: "CIPA — Constituição e funcionamento", descricaoObrigacao: "Constituir CIPA conforme dimensionamento (NR-5), realizar eleições e reuniões mensais", multa: "Multa NR-5 de R$ 2.396,35 a R$ 6.708,09. Estabilidade não respeitada de cipeiros", fundamentacao: "NR-5; Art. 163-165 CLT; ADCT Art. 10, II, a" },
  { id: "e15", nome: "Emissão de CAT (Comunicação de Acidente)", descricaoObrigacao: "Comunicar acidente de trabalho ao INSS em até 1 dia útil", multa: "Multa variável (Art. 22 Lei 8.213/91). Responsabilidade civil e criminal", fundamentacao: "Art. 22 Lei 8.213/91; Art. 169 CLT" },
  { id: "e16", nome: "Recolhimento de contribuições previdenciárias (INSS)", descricaoObrigacao: "Recolher INSS do empregado e patronal dentro do prazo", multa: "Multa moratória de 0,33% ao dia + juros SELIC. Crime de apropriação indébita previdenciária (Art. 168-A CP)", fundamentacao: "Lei 8.212/91; Art. 168-A CP" },
  { id: "e17", nome: "Depósito de FGTS mensal", descricaoObrigacao: "Depositar 8% do salário bruto na conta FGTS até o dia 7 de cada mês", multa: "Multa de 5% no mês de vencimento + 10% a partir do 2º mês + TR + juros", fundamentacao: "Lei 8.036/90 Art. 15" },
  { id: "e18", nome: "Manutenção de livro/ficha de registro de empregados", descricaoObrigacao: "Manter registro atualizado de todos os empregados (físico ou eletrônico)", multa: "Multa de R$ 600,00 por empregado (R$ 800,00 reincidência)", fundamentacao: "Art. 41 CLT; Portaria 671/2021" },
];

const STORAGE_KEY = "checklist-trabalhista-status";

const ChecklistTrabalhista = () => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [busca, setBusca] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCheckedItems(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const getProgress = (items: ChecklistItem[]) => {
    const done = items.filter(i => checkedItems[i.id]).length;
    return { done, total: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
  };

  const filter = (items: ChecklistItem[]) => {
    if (!busca.trim()) return items;
    const q = busca.toLowerCase();
    return items.filter(i =>
      i.nome.toLowerCase().includes(q) ||
      i.descricaoRisco?.toLowerCase().includes(q) ||
      i.multa?.toLowerCase().includes(q) ||
      i.descricaoObrigacao?.toLowerCase().includes(q) ||
      i.fundamentacao?.toLowerCase().includes(q)
    );
  };

  const pSistema = getProgress(ITEMS_SISTEMA);
  const pParcial = getProgress(ITEMS_PARCIAL);
  const pExterno = getProgress(ITEMS_EXTERNO);
  const pGeral = getProgress([...ITEMS_SISTEMA, ...ITEMS_PARCIAL, ...ITEMS_EXTERNO]);

  const exportCSV = () => {
    const rows = [
      ["Categoria", "Item", "Fundamentação", "Risco/Multa", "Status"],
      ...ITEMS_SISTEMA.map(i => ["Sistema", i.nome, i.fundamentacao || "", i.multa || "", checkedItems[i.id] ? "OK" : "Pendente"]),
      ...ITEMS_PARCIAL.map(i => ["Parcial", i.nome, i.fundamentacao || "", i.descricaoRisco || "", checkedItems[i.id] ? "OK" : "Pendente"]),
      ...ITEMS_EXTERNO.map(i => ["Externo", i.nome, i.fundamentacao || "", i.multa || "", checkedItems[i.id] ? "OK" : "Pendente"]),
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

  const StatusBadge = ({ checked }: { checked: boolean }) => (
    <Badge variant={checked ? "default" : "outline"} className={checked ? "bg-green-600 hover:bg-green-700" : "border-amber-500 text-amber-600"}>
      {checked ? <><CheckCircle2 className="h-3 w-3 mr-1" /> OK</> : <><Clock className="h-3 w-3 mr-1" /> Pendente</>}
    </Badge>
  );

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
                Auditoria baseada em CLT, eSocial, FGTS e Normas Regulamentadoras
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>

        {/* Progress geral */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progresso Geral</p>
                <p className="text-2xl font-bold text-foreground">{pGeral.done}/{pGeral.total} itens conformes</p>
              </div>
              <div className="text-3xl font-bold text-primary">{pGeral.pct}%</div>
            </div>
            <Progress value={pGeral.pct} className="h-3" />
            <div className="grid grid-cols-3 gap-4 mt-4 text-center text-sm">
              <div>
                <Monitor className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                <span className="font-medium">{pSistema.done}/{pSistema.total}</span>
                <p className="text-muted-foreground text-xs">Sistema</p>
              </div>
              <div>
                <Users className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                <span className="font-medium">{pParcial.done}/{pParcial.total}</span>
                <p className="text-muted-foreground text-xs">Parcial</p>
              </div>
              <div>
                <FileText className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
                <span className="font-medium">{pExterno.done}/{pExterno.total}</span>
                <p className="text-muted-foreground text-xs">Externo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar item, legislação ou risco..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-10" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sistema">
          <TabsList className="w-full flex-wrap h-auto gap-1">
            <TabsTrigger value="sistema" className="gap-1.5 text-xs sm:text-sm">
              <Monitor className="h-4 w-4" /> 100% Sistema ({pSistema.done}/{pSistema.total})
            </TabsTrigger>
            <TabsTrigger value="parcial" className="gap-1.5 text-xs sm:text-sm">
              <Users className="h-4 w-4" /> Parcial ({pParcial.done}/{pParcial.total})
            </TabsTrigger>
            <TabsTrigger value="externo" className="gap-1.5 text-xs sm:text-sm">
              <FileText className="h-4 w-4" /> Externo ({pExterno.done}/{pExterno.total})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Sistema */}
          <TabsContent value="sistema">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-blue-500" />
                  Itens 100% Controlados pelo Sistema
                </CardTitle>
                <p className="text-sm text-muted-foreground">Dependem diretamente do software para funcionar corretamente.</p>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">✓</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="hidden md:table-cell">Risco Trabalhista</TableHead>
                      <TableHead className="hidden lg:table-cell">Multa / Consequência</TableHead>
                      <TableHead className="hidden sm:table-cell">Fundamentação</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filter(ITEMS_SISTEMA).map(item => (
                      <TableRow key={item.id} className={checkedItems[item.id] ? "bg-green-50/50 dark:bg-green-950/20" : ""}>
                        <TableCell><Checkbox checked={!!checkedItems[item.id]} onCheckedChange={() => toggleItem(item.id)} /></TableCell>
                        <TableCell className="font-medium text-sm">
                          {item.nome}
                          <p className="md:hidden text-xs text-muted-foreground mt-1">{item.descricaoRisco}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{item.descricaoRisco}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs">
                          <span className="text-destructive">{item.multa}</span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground font-mono">{item.fundamentacao}</TableCell>
                        <TableCell><StatusBadge checked={!!checkedItems[item.id]} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Parcial */}
          <TabsContent value="parcial">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-500" />
                  Itens Parcialmente Dependentes do Sistema
                </CardTitle>
                <p className="text-sm text-muted-foreground">O sistema ajuda a controlar, mas dependem também de processos internos da empresa.</p>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">✓</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="hidden md:table-cell">Depende do Sistema</TableHead>
                      <TableHead className="hidden md:table-cell">Depende de Processo</TableHead>
                      <TableHead className="hidden lg:table-cell">Risco Trabalhista</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filter(ITEMS_PARCIAL).map(item => (
                      <TableRow key={item.id} className={checkedItems[item.id] ? "bg-green-50/50 dark:bg-green-950/20" : ""}>
                        <TableCell><Checkbox checked={!!checkedItems[item.id]} onCheckedChange={() => toggleItem(item.id)} /></TableCell>
                        <TableCell className="font-medium text-sm">
                          {item.nome}
                          <div className="md:hidden text-xs text-muted-foreground mt-1 space-y-1">
                            <p><strong>Sistema:</strong> {item.dependeSistema}</p>
                            <p><strong>Processo:</strong> {item.dependeProcesso}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{item.dependeSistema}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{item.dependeProcesso}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs">
                          <span className="text-destructive">{item.descricaoRisco}</span>
                          <p className="text-muted-foreground mt-1 font-mono">{item.fundamentacao}</p>
                        </TableCell>
                        <TableCell><StatusBadge checked={!!checkedItems[item.id]} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Externo */}
          <TabsContent value="externo">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-500" />
                  Itens que Não Dependem do Sistema
                </CardTitle>
                <p className="text-sm text-muted-foreground">Procedimentos administrativos ou operacionais da empresa.</p>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">✓</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="hidden md:table-cell">Obrigação</TableHead>
                      <TableHead className="hidden lg:table-cell">Multa / Risco Judicial</TableHead>
                      <TableHead className="hidden sm:table-cell">Fundamentação</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filter(ITEMS_EXTERNO).map(item => (
                      <TableRow key={item.id} className={checkedItems[item.id] ? "bg-green-50/50 dark:bg-green-950/20" : ""}>
                        <TableCell><Checkbox checked={!!checkedItems[item.id]} onCheckedChange={() => toggleItem(item.id)} /></TableCell>
                        <TableCell className="font-medium text-sm">
                          {item.nome}
                          <p className="md:hidden text-xs text-muted-foreground mt-1">{item.descricaoObrigacao}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{item.descricaoObrigacao}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs">
                          <span className="text-destructive">{item.multa}</span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground font-mono">{item.fundamentacao}</TableCell>
                        <TableCell><StatusBadge checked={!!checkedItems[item.id]} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Legenda */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-500" /> Items pendentes representam risco de multa ou processo</div>
              <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" /> Status salvo automaticamente no navegador</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ChecklistTrabalhista;
