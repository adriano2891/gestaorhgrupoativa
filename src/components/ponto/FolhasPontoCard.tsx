import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FileText, Download, Loader2, ShieldCheck, PenLine, Printer, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePortalAuth } from "./PortalAuthProvider";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface MesRegistro {
  mes: number;
  ano: number;
  label: string;
  registros: any[];
  status: "Fechada" | "Em andamento";
}

interface Assinatura {
  id: string;
  funcionario_id: string;
  mes_referencia: number;
  ano_referencia: number;
  nome_funcionario: string;
  cpf: string | null;
  data_assinatura: string;
  ip_address: string | null;
  user_agent: string | null;
  hash_documento: string;
  status: string;
}

const generateHash = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/Mobi|Android|iPhone|iPad/i.test(ua)) return "Mobile";
  return "Desktop";
};

const nomeMeses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// ── Receipt PDF generator ──
const generateReceiptPDF = (sig: Assinatura) => {
  const doc = new jsPDF({ orientation: "portrait" });
  const sigDate = new Date(sig.data_assinatura);
  const mesLabel = `${nomeMeses[sig.mes_referencia - 1]} ${sig.ano_referencia}`;

  let y = 15;
  // Header
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("GRUPO ATIVA TEC", 105, y, { align: "center" });
  y += 5;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("CNPJ: 42.523.488/0001-81 | R. Bela Cintra, 299, 3º Andar – Consolação, São Paulo – SP", 105, y, { align: "center" });

  y += 8;
  doc.setDrawColor(17, 188, 183);
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);

  y += 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 188, 183);
  doc.text("COMPROVANTE DE ASSINATURA", 105, y, { align: "center" });
  y += 6;
  doc.setFontSize(10);
  doc.text("Espelho de Ponto", 105, y, { align: "center" });
  doc.setTextColor(0, 0, 0);

  y += 12;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const fields = [
    ["Funcionário", sig.nome_funcionario],
    ["CPF", sig.cpf || "Não informado"],
    ["Mês de Referência", mesLabel],
    ["Data da Assinatura", `${sigDate.toLocaleDateString("pt-BR")} às ${sigDate.toLocaleTimeString("pt-BR")}`],
    ["Dispositivo", getDeviceType()],
    ["User Agent", (sig.user_agent || "N/A").substring(0, 90)],
    ["ID da Assinatura", sig.id],
    ["Status", sig.status.toUpperCase()],
  ];

  fields.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 25, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), 75, y);
    y += 6;
  });

  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(25, y, 185, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Hash do Documento (SHA-256):", 25, y);
  y += 5;
  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  // Split hash into two lines if needed
  const hash = sig.hash_documento;
  doc.text(hash.substring(0, 64), 25, y);
  if (hash.length > 64) {
    y += 4;
    doc.text(hash.substring(64), 25, y);
  }

  y += 10;
  doc.setDrawColor(17, 188, 183);
  doc.setLineWidth(0.3);
  doc.line(25, y, 185, y);
  y += 6;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text("Documento assinado eletronicamente pelo Portal do Funcionário.", 25, y);
  y += 4;
  doc.text("Registro armazenado permanentemente no sistema para fins de auditoria trabalhista.", 25, y);
  y += 4;
  doc.text(`Comprovante gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, 25, y);

  return doc;
};

export const FolhasPontoCard = () => {
  const { profile } = usePortalAuth();
  const [meses, setMeses] = useState<MesRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [signing, setSigning] = useState<string | null>(null);
  const [assinaturas, setAssinaturas] = useState<Record<string, Assinatura>>({});
  const [confirmSign, setConfirmSign] = useState<MesRegistro | null>(null);
  const [receiptSig, setReceiptSig] = useState<Assinatura | null>(null);

  const loadAssinaturas = useCallback(async () => {
    const userId = profile?.id;
    if (!userId) return;
    const { data } = await (supabase as any)
      .from("assinaturas_espelho_ponto")
      .select("*")
      .eq("funcionario_id", userId);
    if (data) {
      const map: Record<string, Assinatura> = {};
      (data as any[]).forEach((a: any) => {
        map[`${a.ano_referencia}-${a.mes_referencia}`] = a as Assinatura;
      });
      setAssinaturas(map);
    }
  }, [profile?.id]);

  const loadFolhas = useCallback(async () => {
    try {
      setLoading(true);
      const userId = profile?.id;
      if (!userId) { setMeses([]); return; }

      const now = new Date();
      const inicio = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const inicioStr = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, "0")}-01`;

      const { data, error } = await supabase
        .from("registros_ponto")
        .select("*")
        .eq("user_id", userId)
        .gte("data", inicioStr)
        .order("data", { ascending: false });

      if (error || !data) { setMeses([]); return; }

      const grouped: Record<string, any[]> = {};
      data.forEach((r) => {
        const d = new Date(r.data + "T12:00:00");
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r);
      });

      const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      const result: MesRegistro[] = Object.entries(grouped)
        .map(([key, registros]) => {
          const [ano, mes] = key.split("-").map(Number);
          return {
            mes, ano,
            label: `${nomeMeses[mes - 1]} ${ano}`,
            registros,
            status: key === mesAtual ? ("Em andamento" as const) : ("Fechada" as const),
          };
        })
        .sort((a, b) => (b.ano !== a.ano ? b.ano - a.ano : b.mes - a.mes))
        .slice(0, 12);

      setMeses(result);
    } catch {
      setMeses([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { loadFolhas(); loadAssinaturas(); }, [loadFolhas, loadAssinaturas]);

  const formatHora = (ts: string | null) => {
    if (!ts) return "-";
    return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatInterval = (interval: string | null) => {
    if (!interval) return "-";
    const m = interval.match(/(\d+):(\d+):(\d+)/);
    if (!m) return interval;
    return `${parseInt(m[1])}h ${m[2]}min`;
  };

  const handleSign = async (item: MesRegistro) => {
    const key = `${item.ano}-${item.mes}`;
    setSigning(key);
    try {
      const sortedRecords = [...item.registros].sort(
        (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
      );
      const hashInput = JSON.stringify(sortedRecords.map(r => ({
        data: r.data, entrada: r.entrada, saida: r.saida,
        total_horas: r.total_horas, horas_extras: r.horas_extras
      })));
      const hash = await generateHash(hashInput);

      const { data: inserted, error } = await (supabase as any)
        .from("assinaturas_espelho_ponto")
        .insert({
          funcionario_id: profile!.id,
          mes_referencia: item.mes,
          ano_referencia: item.ano,
          nome_funcionario: profile!.nome || "Funcionário",
          cpf: (profile as any)?.cpf || null,
          ip_address: null,
          user_agent: navigator.userAgent,
          hash_documento: hash,
          status: "assinado",
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast.error("Este espelho de ponto já foi assinado.");
        } else {
          toast.error("Erro ao assinar: " + error.message);
        }
        return;
      }

      toast.success("Espelho de ponto assinado com sucesso!");
      await loadAssinaturas();

      // Show receipt immediately
      if (inserted) {
        setReceiptSig(inserted as Assinatura);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro inesperado ao assinar.");
    } finally {
      setSigning(null);
      setConfirmSign(null);
    }
  };

  const handleDownloadReceipt = (sig: Assinatura) => {
    const doc = generateReceiptPDF(sig);
    doc.save(`comprovante-assinatura-${sig.ano_referencia}-${String(sig.mes_referencia).padStart(2, "0")}.pdf`);
  };

  const handlePrintReceipt = (sig: Assinatura) => {
    const doc = generateReceiptPDF(sig);
    const blobUrl = doc.output("bloburl");
    window.open(blobUrl as unknown as string, "_blank");
  };

  const handleDownloadPDF = async (item: MesRegistro) => {
    const key = `${item.ano}-${item.mes}`;
    setDownloading(key);
    const assinatura = assinaturas[key];

    try {
      const doc = new jsPDF({ orientation: "landscape" });
      const nome = profile?.nome || "Funcionário";
      const depto = (profile as any)?.departamento || "Sede Principal";
      const cpf = (profile as any)?.cpf || "";

      let yPos = 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('GRUPO ATIVA TEC', 10, yPos);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('CNPJ: 42.523.488/0001-81 | R. Bela Cintra, 299, 3º Andar – Consolação, São Paulo – SP, 01415-001', 55, yPos);
      yPos += 4;
      doc.text(`Setor: ${depto}`, 10, yPos);

      doc.setDrawColor(17, 188, 183);
      doc.setLineWidth(0.4);
      doc.line(10, yPos + 2, 287, yPos + 2);
      yPos += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`ESPELHO DE PONTO – ${item.label}`, 10, yPos);
      yPos += 5;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const statusLabel = assinatura ? "Assinado ✓" : item.status;
      doc.text(`Funcionário: ${nome}${cpf ? ` | CPF: ${cpf}` : ''} | Status: ${statusLabel} | Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, 10, yPos);
      yPos += 4;

      const sorted = [...item.registros].sort(
        (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
      );

      const tableData = sorted.map((r) => {
        const dataFormatted = new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR");
        return [
          dataFormatted,
          formatHora(r.entrada), formatHora(r.saida_pausa_1), formatHora(r.retorno_pausa_1),
          formatHora(r.saida_almoco), formatHora(r.retorno_almoco),
          formatHora(r.saida_pausa_2), formatHora(r.retorno_pausa_2),
          formatHora(r.saida), formatHora(r.inicio_he), formatHora(r.fim_he),
          formatInterval(r.total_horas), formatInterval(r.horas_extras), formatInterval(r.horas_noturnas),
          r.registro_folga ? "Folga" : r.tipo_dia === "dsr" ? "DSR" : r.tipo_dia === "feriado" ? "FER" : "",
        ];
      });

      autoTable(doc, {
        startY: yPos,
        margin: { left: 10, right: 10 },
        head: [["Data", "Entrada", "S.P1", "R.P1", "S.Alm", "R.Alm", "S.P2", "R.P2", "Saída", "HE Ini", "HE Fim", "Total", "HE", "H.Not", "Tp"]],
        body: tableData,
        styles: { fontSize: 4.5, cellPadding: 0.8, lineWidth: 0.1 },
        headStyles: { fillColor: [17, 188, 183], fontSize: 4.5, cellPadding: 1, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || yPos + 100;

      if (assinatura) {
        const sigY = finalY + 6;
        doc.setDrawColor(17, 188, 183);
        doc.setLineWidth(0.3);
        doc.line(10, sigY, 287, sigY);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('ASSINATURA ELETRÔNICA DO COLABORADOR', 10, sigY + 4);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        const sigDate = new Date(assinatura.data_assinatura);
        const sigLines = [
          `Nome: ${assinatura.nome_funcionario}`,
          `CPF: ${assinatura.cpf || 'Não informado'}`,
          `Data da assinatura: ${sigDate.toLocaleDateString("pt-BR")} às ${sigDate.toLocaleTimeString("pt-BR")}`,
          `Dispositivo: ${(assinatura.user_agent || 'N/A').substring(0, 80)}`,
          `Hash do documento: ${assinatura.hash_documento.substring(0, 32)}...`,
          `ID Assinatura: ${assinatura.id}`,
          `Status: ${assinatura.status.toUpperCase()}`,
        ];
        sigLines.forEach((line, i) => {
          doc.text(line, 10, sigY + 8 + i * 3);
        });
        doc.setFontSize(5.5);
        doc.setTextColor(100, 100, 100);
        doc.text('Documento assinado eletronicamente pelo Portal do Funcionário. Registro armazenado no sistema para auditoria.', 10, sigY + 8 + sigLines.length * 3 + 2);
        doc.setTextColor(0, 0, 0);
      } else {
        const sigY = finalY + 6;
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text('Declaro que os horários acima são verdadeiros.', 10, sigY);
        doc.line(10, sigY + 10, 100, sigY + 10);
        doc.text('Assinatura do Funcionário', 30, sigY + 13);
        doc.setFontSize(5.5);
        if (cpf) doc.text(`CPF: ${cpf}`, 35, sigY + 16);
        doc.line(160, sigY + 10, 250, sigY + 10);
        doc.setFontSize(6);
        doc.text('Assinatura do Empregador', 180, sigY + 13);
      }

      doc.save(`folha-ponto-${item.ano}-${String(item.mes).padStart(2, "0")}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Folhas de Ponto – Últimos 12 Meses</CardTitle>
          </div>
          <CardDescription>
            Visualize, assine e baixe suas folhas de ponto mensais
          </CardDescription>
        </CardHeader>
        <CardContent>
          {meses.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Nenhuma folha de ponto disponível nos últimos 12 meses.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {meses.map((item) => {
                const key = `${item.ano}-${item.mes}`;
                const isDownloading = downloading === key;
                const isSigning = signing === key;
                const assinatura = assinaturas[key];
                const isSigned = !!assinatura;

                return (
                  <div
                    key={key}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg transition-colors ${
                      isSigned
                        ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="min-w-0 flex-1 mb-2 sm:mb-0">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.registros.length} registro(s)
                      </p>
                      {isSigned && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Assinado em {new Date(assinatura.data_assinatura).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={isSigned ? "default" : item.status === "Fechada" ? "default" : "secondary"}
                        className={isSigned ? "bg-green-600 hover:bg-green-700 text-white" : ""}>
                        {isSigned ? (
                          <>
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Assinado
                          </>
                        ) : item.status}
                      </Badge>

                      {!isSigned && (
                        <Button
                          size="sm"
                          onClick={() => setConfirmSign(item)}
                          disabled={isSigning}
                          className="gap-1"
                        >
                          {isSigning ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <PenLine className="h-4 w-4" />
                              Assinar
                            </>
                          )}
                        </Button>
                      )}

                      {isSigned && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setReceiptSig(assinatura)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Comprovante
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPDF(item)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sign Confirmation Dialog */}
      <AlertDialog open={!!confirmSign} onOpenChange={(open) => !open && setConfirmSign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5 text-primary" />
              Assinar Espelho de Ponto
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Você está prestes a assinar eletronicamente o espelho de ponto de{" "}
                <strong>{confirmSign?.label}</strong>.
              </p>
              <p>
                Ao assinar, você declara que os horários registrados são verdadeiros e
                que está ciente de todas as marcações de ponto do período.
              </p>
              <p className="text-xs text-muted-foreground">
                Esta ação não pode ser desfeita. Um registro de auditoria será gerado
                contendo seus dados, data/hora, dispositivo e hash do documento.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmSign && handleSign(confirmSign)}
              className="bg-primary"
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Confirmar Assinatura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Receipt Dialog */}
      <Dialog open={!!receiptSig} onOpenChange={(open) => !open && setReceiptSig(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <ShieldCheck className="h-5 w-5" />
              Comprovante de Assinatura do Espelho de Ponto
            </DialogTitle>
            <DialogDescription>
              Registro de assinatura eletrônica – auditoria trabalhista
            </DialogDescription>
          </DialogHeader>

          {receiptSig && (() => {
            const sig = receiptSig;
            const sigDate = new Date(sig.data_assinatura);
            const mesLabel = `${nomeMeses[sig.mes_referencia - 1]} ${sig.ano_referencia}`;

            return (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-[130px_1fr] gap-y-2 text-sm">
                    <span className="font-medium text-muted-foreground">Funcionário:</span>
                    <span className="font-semibold">{sig.nome_funcionario}</span>

                    <span className="font-medium text-muted-foreground">CPF:</span>
                    <span>{sig.cpf || "Não informado"}</span>

                    <span className="font-medium text-muted-foreground">Mês de Referência:</span>
                    <span className="font-semibold">{mesLabel}</span>

                    <span className="font-medium text-muted-foreground">Data/Hora:</span>
                    <span>{sigDate.toLocaleDateString("pt-BR")} às {sigDate.toLocaleTimeString("pt-BR")}</span>

                    <span className="font-medium text-muted-foreground">Dispositivo:</span>
                    <span>{getDeviceType()}</span>

                    <span className="font-medium text-muted-foreground">ID da Assinatura:</span>
                    <span className="font-mono text-xs break-all">{sig.id}</span>

                    <span className="font-medium text-muted-foreground">Status:</span>
                    <Badge className="bg-green-600 text-white w-fit">
                      {sig.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Hash do Documento (SHA-256):</span>
                  <p className="font-mono text-xs bg-muted p-3 rounded break-all select-all border">
                    {sig.hash_documento}
                  </p>
                </div>

                <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
                  <p>Documento assinado eletronicamente pelo Portal do Funcionário.</p>
                  <p>Registro armazenado permanentemente no sistema para fins de auditoria trabalhista.</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleDownloadReceipt(sig)}
                    className="flex-1 gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Baixar PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePrintReceipt(sig)}
                    className="flex-1 gap-1"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
};
