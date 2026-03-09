import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePortalAuth } from "./PortalAuthProvider";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface MesRegistro {
  mes: number;
  ano: number;
  label: string;
  registros: any[];
  status: "Fechada" | "Em andamento";
}

export const FolhasPontoCard = () => {
  const { profile } = usePortalAuth();
  const [meses, setMeses] = useState<MesRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

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

      // Group by month/year
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
            mes,
            ano,
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

  useEffect(() => { loadFolhas(); }, [loadFolhas]);

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

  const handleDownloadPDF = async (item: MesRegistro) => {
    const key = `${item.ano}-${item.mes}`;
    setDownloading(key);

    try {
      const doc = new jsPDF({ orientation: "landscape" });
      const nome = profile?.nome || "Funcionário";

      doc.setFontSize(16);
      doc.text(`Folha de Ponto - ${item.label}`, 14, 20);
      doc.setFontSize(10);
      doc.text(`Funcionário: ${nome}`, 14, 28);
      doc.text(`Status: ${item.status}`, 14, 34);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, 14, 40);

      const sorted = [...item.registros].sort(
        (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
      );

      const tableData = sorted.map((r) => {
        const dataFormatted = new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR");
        return [
          dataFormatted,
          formatHora(r.entrada),
          formatHora(r.saida_almoco),
          formatHora(r.retorno_almoco),
          formatHora(r.saida_pausa_1),
          formatHora(r.retorno_pausa_1),
          formatHora(r.saida),
          formatInterval(r.total_horas),
          formatInterval(r.horas_extras),
          formatInterval(r.horas_noturnas),
          r.registro_folga ? "Folga" : r.tipo_dia === "dsr" ? "DSR" : r.tipo_dia === "feriado" ? "Feriado" : "Útil",
        ];
      });

      autoTable(doc, {
        startY: 46,
        head: [[
          "Data", "Entrada", "Saída Almoço", "Ret. Almoço",
          "Saída P1", "Ret. P1", "Saída", "Total", "HE", "Noturno", "Tipo"
        ]],
        body: tableData,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246] },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle>Folhas de Ponto – Últimos 12 Meses</CardTitle>
        </div>
        <CardDescription>
          Visualize e baixe suas folhas de ponto mensais
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
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.registros.length} registro(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Badge variant={item.status === "Fechada" ? "default" : "secondary"}>
                      {item.status}
                    </Badge>
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
                          <Download className="h-4 w-4 mr-2" />
                          Baixar PDF
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
  );
};
