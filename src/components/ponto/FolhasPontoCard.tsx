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
import { FileText, Download, Loader2, ShieldCheck, PenLine } from "lucide-react";
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

// Generate a simple hash from data for document integrity
const generateHash = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const FolhasPontoCard = () => {
  const { profile } = usePortalAuth();
  const [meses, setMeses] = useState<MesRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [signing, setSigning] = useState<string | null>(null);
  const [assinaturas, setAssinaturas] = useState<Record<string, Assinatura>>({});
  const [confirmSign, setConfirmSign] = useState<MesRegistro | null>(null);

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

      const nomeMeses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
      ];

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
      // Build hash from all records data
      const sortedRecords = [...item.registros].sort(
        (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
      );
      const hashInput = JSON.stringify(sortedRecords.map(r => ({
        data: r.data, entrada: r.entrada, saida: r.saida,
        total_horas: r.total_horas, horas_extras: r.horas_extras
      })));
      const hash = await generateHash(hashInput);

      const { error } = await supabase
        .from("assinaturas_espelho_ponto")
        .insert({
          funcionario_id: profile!.id,
          mes_referencia: item.mes,
          ano_referencia: item.ano,
          nome_funcionario: profile!.nome || "Funcionário",
          cpf: (profile as any)?.cpf || null,
          ip_address: null, // captured server-side ideally
          user_agent: navigator.userAgent,
          hash_documento: hash,
          status: "assinado",
        });

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
    } catch (err) {
      console.error(err);
      toast.error("Erro inesperado ao assinar.");
    } finally {
      setSigning(null);
      setConfirmSign(null);
    }
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

      // === Header ===
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
          formatHora(r.entrada),
          formatHora(r.saida_pausa_1),
          formatHora(r.retorno_pausa_1),
          formatHora(r.saida_almoco),
          formatHora(r.retorno_almoco),
          formatHora(r.saida_pausa_2),
          formatHora(r.retorno_pausa_2),
          formatHora(r.saida),
          formatHora(r.inicio_he),
          formatHora(r.fim_he),
          formatInterval(r.total_horas),
          formatInterval(r.horas_extras),
          formatInterval(r.horas_noturnas),
          r.registro_folga ? "Folga" : r.tipo_dia === "dsr" ? "DSR" : r.tipo_dia === "feriado" ? "FER" : "",
        ];
      });

      autoTable(doc, {
        startY: yPos,
        margin: { left: 10, right: 10 },
        head: [[
          "Data", "Entrada", "S.P1", "R.P1", "S.Alm", "R.Alm",
          "S.P2", "R.P2", "Saída", "HE Ini", "HE Fim", "Total", "HE", "H.Not", "Tp"
        ]],
        body: tableData,
        styles: { fontSize: 4.5, cellPadding: 0.8, lineWidth: 0.1 },
        headStyles: { fillColor: [17, 188, 183], fontSize: 4.5, cellPadding: 1, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || yPos + 100;

      // === Signature section ===
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
        // Unsigned - show signature lines
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
                      {isSigned ? (
                        <Badge className="bg-green-600 hover:bg-green-700 text-white">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Assinado
                        </Badge>
                      ) : (
                        <Badge variant={item.status === "Fechada" ? "default" : "secondary"}>
                          {item.status}
                        </Badge>
                      )}

                      {!isSigned && item.status === "Fechada" && (
                        <Button
                          size="sm"
                          variant="default"
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

      {/* Confirmation Dialog */}
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
    </>
  );
};
