import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FileText, Calculator, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { calcularINSS, calcularIRRF } from "@/utils/inssIrrfCalculos";
import { gerarTRCT } from "@/utils/trctPdfGenerator";

interface RescisaoCardProps {
  userId: string;
  userName: string;
  salarioBase: number;
  dataAdmissao: string;
  cpf?: string;
  cargo?: string;
}

const tipoRescisaoLabels: Record<string, string> = {
  sem_justa_causa: "Demissão sem Justa Causa",
  com_justa_causa: "Demissão com Justa Causa",
  pedido_demissao: "Pedido de Demissão",
  acordo_mutuo: "Acordo Mútuo (Art. 484-A CLT)",
};

/**
 * Verifica se o mês deve ser contado para 13º (regra dos 15 dias)
 * Se trabalhou >= 15 dias no mês, conta o mês inteiro
 */
const calcularMeses13Proporcional = (admissao: Date, demissao: Date): number => {
  const anoAtual = demissao.getFullYear();
  const inicioAno = new Date(anoAtual, 0, 1);
  const dataRef = admissao > inicioAno ? admissao : inicioAno;
  
  let meses = 0;
  for (let m = dataRef.getMonth(); m <= demissao.getMonth(); m++) {
    const inicioMes = new Date(anoAtual, m, 1);
    const fimMes = new Date(anoAtual, m + 1, 0);
    
    const diaInicio = m === dataRef.getMonth() ? dataRef.getDate() : 1;
    const diaFim = m === demissao.getMonth() ? demissao.getDate() : fimMes.getDate();
    
    const diasTrabalhados = diaFim - diaInicio + 1;
    if (diasTrabalhados >= 15) {
      meses++;
    }
  }
  return meses;
};

export const RescisaoCard = ({ userId, userName, salarioBase, dataAdmissao, cpf, cargo }: RescisaoCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tipoRescisao, setTipoRescisao] = useState("sem_justa_causa");
  const [dataDemissao, setDataDemissao] = useState(new Date().toISOString().split("T")[0]);
  const [avisoTrabalhado, setAvisoTrabalhado] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [resultado, setResultado] = useState<any>(null);
  const [feriasVencidas, setFeriasVencidas] = useState(0); // Períodos completos não gozados
  const [saving, setSaving] = useState(false);

  const calcularRescisao = () => {
    if (!dataAdmissao || !dataDemissao || !salarioBase) {
      toast.error("Dados insuficientes para cálculo");
      return;
    }

    const admissao = new Date(dataAdmissao);
    const demissao = new Date(dataDemissao);
    const mesesTrabalhados = Math.max(1, Math.round((demissao.getTime() - admissao.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    const anosTrabalhados = Math.floor(mesesTrabalhados / 12);
    const salarioDiario = salarioBase / 30;

    // Saldo de salário (dias trabalhados no último mês)
    const diasUltimoMes = demissao.getDate();
    const saldoSalario = salarioDiario * diasUltimoMes;

    // Aviso prévio (30 dias + 3 dias por ano trabalhado, máx 90 dias) - Art. 477 §1º
    const avisoPrevioDias = Math.min(30 + anosTrabalhados * 3, 90);
    let avisoPrevioValor = 0;
    if (tipoRescisao === "sem_justa_causa" && !avisoTrabalhado) {
      avisoPrevioValor = salarioDiario * avisoPrevioDias;
    } else if (tipoRescisao === "acordo_mutuo" && !avisoTrabalhado) {
      avisoPrevioValor = (salarioDiario * avisoPrevioDias) * 0.5;
    }

    // Projeção do aviso prévio indenizado (Súmula 371 TST)
    // O período de aviso prévio indenizado projeta para cálculos de férias e 13º
    let mesesProjetados = mesesTrabalhados;
    if (!avisoTrabalhado && (tipoRescisao === "sem_justa_causa" || tipoRescisao === "acordo_mutuo")) {
      mesesProjetados += Math.floor(avisoPrevioDias / 30);
    }

    // Férias proporcionais
    const mesesDesdeUltimaFerias = mesesProjetados % 12;
    let feriasProp = 0;
    let tercoFerias = 0;
    if (tipoRescisao !== "com_justa_causa") {
      feriasProp = (salarioBase / 12) * mesesDesdeUltimaFerias;
      tercoFerias = feriasProp / 3;
    }

    // Férias vencidas em dobro (Art. 137 CLT)
    let feriasVencidasValor = 0;
    let tercoFeriasVencidas = 0;
    if (feriasVencidas > 0) {
      feriasVencidasValor = salarioBase * feriasVencidas * 2; // Pagamento em DOBRO
      tercoFeriasVencidas = (salarioBase * feriasVencidas * 2) / 3; // 1/3 sobre o dobro
    }

    // 13º proporcional - Regra dos 15 dias (Art. 1º Lei 4.090/62)
    let decimoTerceiro = 0;
    if (tipoRescisao !== "com_justa_causa") {
      const meses13 = calcularMeses13Proporcional(admissao, demissao);
      decimoTerceiro = (salarioBase / 12) * meses13;
    }

    // Multa FGTS
    let multaFgts = 0;
    const fgtsTotal = salarioBase * 0.08 * mesesTrabalhados;
    if (tipoRescisao === "sem_justa_causa") {
      multaFgts = fgtsTotal * 0.4;
    } else if (tipoRescisao === "acordo_mutuo") {
      multaFgts = fgtsTotal * 0.2;
    }

    const totalBruto = saldoSalario + avisoPrevioValor + feriasProp + tercoFerias + feriasVencidasValor + tercoFeriasVencidas + decimoTerceiro + multaFgts;

    // Cálculos de INSS e IRRF
    const inssCalc = calcularINSS(totalBruto);
    const irrfCalc = calcularIRRF(totalBruto, inssCalc.valor, 0);
    const totalDescontos = inssCalc.valor + irrfCalc.valor;
    const totalLiquido = totalBruto - totalDescontos;

    setResultado({
      saldoSalario: Math.round(saldoSalario * 100) / 100,
      avisoPrevioDias,
      avisoPrevioValor: Math.round(avisoPrevioValor * 100) / 100,
      feriasProp: Math.round(feriasProp * 100) / 100,
      tercoFerias: Math.round(tercoFerias * 100) / 100,
      feriasVencidasValor: Math.round(feriasVencidasValor * 100) / 100,
      tercoFeriasVencidas: Math.round(tercoFeriasVencidas * 100) / 100,
      decimoTerceiro: Math.round(decimoTerceiro * 100) / 100,
      multaFgts: Math.round(multaFgts * 100) / 100,
      totalBruto: Math.round(totalBruto * 100) / 100,
      inss: inssCalc.valor,
      irrfValor: irrfCalc.valor,
      irrfFaixa: irrfCalc.faixa,
      inssAliquota: inssCalc.aliquotaEfetiva,
      totalDescontos: Math.round(totalDescontos * 100) / 100,
      totalLiquido: Math.round(totalLiquido * 100) / 100,
      mesesTrabalhados,
      projecaoAviso: !avisoTrabalhado && (tipoRescisao === "sem_justa_causa" || tipoRescisao === "acordo_mutuo"),
    });
  };

  const handleGerarTRCT = () => {
    if (!resultado) return;
    gerarTRCT({
      empregadorRazaoSocial: "Empresa (configurar)",
      empregadorCNPJ: "",
      nomeEmpregado: userName,
      cpfEmpregado: cpf || "",
      cargoEmpregado: cargo || "",
      dataAdmissao,
      dataDemissao,
      tipoRescisao,
      avisoTrabalhado,
      avisoPrevioDias: resultado.avisoPrevioDias,
      salarioBase,
      saldoSalario: resultado.saldoSalario,
      avisoPrevioValor: resultado.avisoPrevioValor,
      feriasProp: resultado.feriasProp,
      tercoFerias: resultado.tercoFerias,
      feriasVencidasValor: resultado.feriasVencidasValor,
      tercoFeriasVencidas: resultado.tercoFeriasVencidas,
      decimoTerceiro: resultado.decimoTerceiro,
      multaFgts: resultado.multaFgts,
      totalBruto: resultado.totalBruto,
    });
    toast.success("TRCT gerado com sucesso");
  };

  const salvarRescisao = async () => {
    if (!resultado) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("rescisoes")
        .insert({
          user_id: userId,
          data_demissao: dataDemissao,
          tipo_rescisao: tipoRescisao,
          motivo: motivo || null,
          aviso_previo_dias: resultado.avisoPrevioDias,
          aviso_previo_trabalhado: avisoTrabalhado,
          salario_base: salarioBase,
          saldo_salario: resultado.saldoSalario,
          aviso_previo_valor: resultado.avisoPrevioValor,
          ferias_proporcionais: resultado.feriasProp,
          terco_ferias: resultado.tercoFerias,
          decimo_terceiro_proporcional: resultado.decimoTerceiro,
          multa_fgts: resultado.multaFgts,
          total_rescisao: resultado.total,
          status: "calculado",
        });

      if (error) throw error;
      toast.success("Rescisão calculada e salva com sucesso");
      setDialogOpen(false);
      setResultado(null);
    } catch (e: any) {
      toast.error("Erro ao salvar rescisão", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)} className="gap-1">
        <FileText className="h-4 w-4" />
        Rescisão
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cálculo Rescisório — {userName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo de Rescisão</Label>
                <Select value={tipoRescisao} onValueChange={setTipoRescisao}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoRescisaoLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data Demissão</Label>
                <Input type="date" value={dataDemissao} onChange={(e) => setDataDemissao(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={avisoTrabalhado} onCheckedChange={setAvisoTrabalhado} />
              <Label>Aviso prévio trabalhado</Label>
            </div>

            <div className="space-y-1.5">
              <Label>Períodos de férias vencidas (não gozadas)</Label>
              <Input 
                type="number" 
                min="0" 
                value={feriasVencidas} 
                onChange={(e) => setFeriasVencidas(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                Férias vencidas são pagas em dobro (Art. 137 CLT)
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo da rescisão..." className="min-h-[60px]" />
            </div>

            <Button onClick={calcularRescisao} className="w-full">
              <Calculator className="h-4 w-4 mr-2" /> Calcular Verbas Rescisórias
            </Button>

            {resultado && (
              <Card className="border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Resultado — {resultado.mesesTrabalhados} meses trabalhados</CardTitle>
                  {resultado.projecaoAviso && (
                    <p className="text-xs text-muted-foreground">
                      * Aviso prévio indenizado projeta tempo de serviço para férias e 13º (Súmula 371 TST)
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      <TableRow><TableCell>Saldo de Salário</TableCell><TableCell className="text-right">{fmt(resultado.saldoSalario)}</TableCell></TableRow>
                      <TableRow><TableCell>Aviso Prévio ({resultado.avisoPrevioDias} dias)</TableCell><TableCell className="text-right">{fmt(resultado.avisoPrevioValor)}</TableCell></TableRow>
                      <TableRow><TableCell>Férias Proporcionais</TableCell><TableCell className="text-right">{fmt(resultado.feriasProp)}</TableCell></TableRow>
                      <TableRow><TableCell>1/3 Constitucional (proporcionais)</TableCell><TableCell className="text-right">{fmt(resultado.tercoFerias)}</TableCell></TableRow>
                      {resultado.feriasVencidasValor > 0 && (
                        <>
                          <TableRow className="bg-amber-50 dark:bg-amber-950/30">
                            <TableCell className="text-amber-700 dark:text-amber-400">
                              Férias Vencidas em Dobro (Art. 137)
                            </TableCell>
                            <TableCell className="text-right text-amber-700 dark:text-amber-400">{fmt(resultado.feriasVencidasValor)}</TableCell>
                          </TableRow>
                          <TableRow className="bg-amber-50 dark:bg-amber-950/30">
                            <TableCell className="text-amber-700 dark:text-amber-400">
                              1/3 Constitucional (vencidas)
                            </TableCell>
                            <TableCell className="text-right text-amber-700 dark:text-amber-400">{fmt(resultado.tercoFeriasVencidas)}</TableCell>
                          </TableRow>
                        </>
                      )}
                      <TableRow><TableCell>13º Proporcional (regra 15 dias)</TableCell><TableCell className="text-right">{fmt(resultado.decimoTerceiro)}</TableCell></TableRow>
                      <TableRow><TableCell>Multa FGTS</TableCell><TableCell className="text-right">{fmt(resultado.multaFgts)}</TableCell></TableRow>
                      <TableRow className="font-bold border-t-2">
                        <TableCell>TOTAL BRUTO</TableCell>
                        <TableCell className="text-right">{fmt(resultado.totalBruto)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-destructive/5">
                        <TableCell className="text-destructive">INSS ({resultado.inssAliquota}%)</TableCell>
                        <TableCell className="text-right text-destructive">- {fmt(resultado.inss)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-destructive/5">
                        <TableCell className="text-destructive">IRRF (faixa {resultado.irrfFaixa})</TableCell>
                        <TableCell className="text-right text-destructive">- {fmt(resultado.irrfValor)}</TableCell>
                      </TableRow>
                      <TableRow className="font-bold border-t-2">
                        <TableCell>VALOR LÍQUIDO</TableCell>
                        <TableCell className="text-right text-primary">{fmt(resultado.totalLiquido)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            {resultado && (
              <>
                <Button variant="outline" onClick={handleGerarTRCT} className="gap-1">
                  <Download className="h-4 w-4" /> TRCT PDF
                </Button>
                <Button onClick={salvarRescisao} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Rescisão"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
