import { Button } from "@/components/ui/button";
import { FileText, Sheet, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

interface ExportOptionsProps {
  data: Record<string, unknown>[];
  reportTitle: string;
  summary?: Record<string, string | number>;
  charts?: Array<{
    type: string;
    title: string;
    description?: string;
    dataName?: string;
    insight?: string;
    data: Record<string, unknown>[];
  }>;
  onExportComplete?: (exportInfo: { type: string; filename: string; date: string }) => void;
}

export const ExportOptions = ({ data, reportTitle, summary, charts, onExportComplete }: ExportOptionsProps) => {
  const { toast } = useToast();

  const getChartPngDataUrl = async (chartIndex: number): Promise<{ dataUrl: string; width: number; height: number } | null> => {
    const container = document.getElementById(`report-chart-${chartIndex}`);
    const svg = container?.querySelector("svg");
    if (!container || !svg) return null;

    const serialized = new XMLSerializer().serializeToString(svg);

    // Ensure SVG has namespaces to render in Image
    const svgWithNs = serialized.includes("http://www.w3.org/2000/svg")
      ? serialized
      : serialized.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');

    const blob = new Blob([svgWithNs], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    try {
      const img = new Image();
      img.decoding = "async";
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Falha ao renderizar SVG do gráfico"));
        img.src = url;
      });

      const scale = 2;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const rect = container.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));

      canvas.width = width * scale;
      canvas.height = height * scale;

      // Fill background so exports are legible even on transparent charts
      const computed = window.getComputedStyle(container);
      const bg = computed.backgroundColor && computed.backgroundColor !== "rgba(0, 0, 0, 0)"
        ? computed.backgroundColor
        : "#ffffff";
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.drawImage(img, 0, 0, width, height);

      return { dataUrl: canvas.toDataURL("image/png"), width, height };
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const exportToPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;

    // Header
    doc.setFillColor(17, 188, 183);
    doc.rect(0, 0, pageWidth, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(reportTitle, margin, 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, margin, 28);

    doc.setTextColor(0, 0, 0);

    let yPos = 45;

    // Resumo Executivo
    if (summary && Object.keys(summary).length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 188, 183);
      doc.text("Resumo Executivo", margin, yPos);
      yPos += 3;

      doc.setDrawColor(17, 188, 183);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      doc.setTextColor(0, 0, 0);

      const summaryEntries = Object.entries(summary);
      const cols = Math.min(3, summaryEntries.length);
      const colWidth = (pageWidth - margin * 2) / cols;

      summaryEntries.forEach((entry, index) => {
        const [key, value] = entry;
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = margin + col * colWidth;
        const y = yPos + row * 18;

        doc.setFillColor(245, 247, 250);
        doc.roundedRect(x, y - 4, colWidth - 5, 16, 2, 2, "F");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(key.replace(/([A-Z])/g, " $1").trim(), x + 3, y + 2);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(17, 188, 183);
        doc.text(String(value), x + 3, y + 9);
      });

      doc.setTextColor(0, 0, 0);
      yPos += Math.ceil(summaryEntries.length / cols) * 18 + 12;
    }

    // Gráficos (imagens)
    if (charts && charts.length > 0) {
      if (yPos > pageHeight - 120) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 188, 183);
      doc.text("Análise Gráfica", margin, yPos);
      yPos += 3;

      doc.setDrawColor(17, 188, 183);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      doc.setTextColor(0, 0, 0);

      for (let chartIndex = 0; chartIndex < charts.length; chartIndex++) {
        const chart = charts[chartIndex];

        if (yPos > pageHeight - 110) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(50, 50, 50);
        doc.text(`${chartIndex + 1}. ${chart.title}`, margin, yPos);
        yPos += 6;

        if (chart.description) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(100, 100, 100);
          doc.text(chart.description, margin, yPos);
          yPos += 6;
        }

        // Try to embed chart image from the on-screen SVG
        const chartImg = await getChartPngDataUrl(chartIndex);
        if (chartImg) {
          const maxWidth = pageWidth - margin * 2;
          const aspect = chartImg.height / chartImg.width;
          const imgWidth = maxWidth;
          const imgHeight = Math.min(90, imgWidth * aspect);

          if (yPos + imgHeight > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }

          doc.addImage(chartImg.dataUrl, "PNG", margin, yPos, imgWidth, imgHeight, undefined, "FAST");
          yPos += imgHeight + 8;
        }

        // Fallback: include a small table of the chart data
        if (!chartImg && chart.data && chart.data.length > 0) {
          const chartDataKeys = Object.keys(chart.data[0]);
          const labelKey = chartDataKeys[0];
          const valueKey = chartDataKeys.find((k) => k === "valor" || k === "value") || chartDataKeys[1];

          const chartHeaders = [
            labelKey.charAt(0).toUpperCase() + labelKey.slice(1),
            chart.dataName || "Valor",
          ];
          const chartRows = chart.data.slice(0, 10).map((item) => {
            const labelVal = (item as any)[labelKey];
            const numVal = (item as any)[valueKey];
            return [
              String(labelVal || "-"),
              typeof numVal === "number"
                ? numVal.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
                : String(numVal || "-"),
            ];
          });

          autoTable(doc, {
            startY: yPos,
            head: [chartHeaders],
            body: chartRows,
            theme: "grid",
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: {
              fillColor: [17, 188, 183],
              textColor: [255, 255, 255],
              fontStyle: "bold",
              halign: "center",
            },
            tableWidth: "wrap",
            margin: { left: margin },
          });

          const lastTable = doc as unknown as { lastAutoTable?: { finalY: number } };
          yPos = (lastTable.lastAutoTable?.finalY || yPos) + 8;
        }

        if (chart.insight) {
          if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFillColor(240, 253, 250);
          const insightLines = doc.splitTextToSize(
            `Insight: ${chart.insight}`,
            pageWidth - margin * 2 - 10
          );
          const insightHeight = insightLines.length * 5 + 6;
          doc.roundedRect(margin, yPos - 2, pageWidth - margin * 2, insightHeight, 2, 2, "F");

          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(17, 94, 89);
          doc.text(insightLines, margin + 5, yPos + 4);
          yPos += insightHeight + 10;
        }

        doc.setTextColor(0, 0, 0);
        yPos += 4;
      }
    }

    // Dados Detalhados
    if (data && data.length > 0) {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 188, 183);
      doc.text("Dados Detalhados", margin, yPos);
      yPos += 3;

      doc.setDrawColor(17, 188, 183);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(
        `${data.length} registro${data.length !== 1 ? "s" : ""} encontrado${data.length !== 1 ? "s" : ""}`,
        margin,
        yPos
      );
      yPos += 5;

      const headers = Object.keys(data[0]).map((key) => key.replace(/([A-Z])/g, " $1").trim());
      const rows = data.map((row) => Object.values(row).map((val) => String(val ?? "-")));

      autoTable(doc, {
        startY: yPos,
        head: [headers],
        body: rows,
        theme: "striped",
        styles: {
          fontSize: 7,
          cellPadding: 2,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [17, 188, 183],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        columnStyles: {
          0: { fontStyle: "bold" },
        },
      });
    }

    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${pageCount} - ${reportTitle}`, pageWidth / 2, pageHeight - 10, {
        align: "center",
      });
    }

    const filename = `${reportTitle.toLowerCase().replace(/\s+/g, "-")}.pdf`;
    doc.save(filename);

    onExportComplete?.({
      type: "PDF",
      filename,
      date: new Date().toISOString(),
    });

    toast({
      title: "PDF exportado com sucesso!",
      description: `Relatório "${reportTitle}" foi baixado.`,
    });
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();

    // Summary sheet
    if (summary && Object.keys(summary).length > 0) {
      const ws = workbook.addWorksheet("Resumo");
      ws.columns = [
        { header: "Indicador", key: "indicador", width: 35 },
        { header: "Valor", key: "valor", width: 30 },
      ];

      Object.entries(summary).forEach(([key, value]) => {
        ws.addRow({
          indicador: key.replace(/([A-Z])/g, " $1").trim(),
          valor: value,
        });
      });

      ws.getRow(1).font = { bold: true };
      ws.views = [{ state: "frozen", ySplit: 1 }];
    }

    // Charts sheets (image + data)
    if (charts && charts.length > 0) {
      for (let i = 0; i < charts.length; i++) {
        const chart = charts[i];
        const ws = workbook.addWorksheet(`Gráfico ${i + 1}`);
        ws.getCell("A1").value = chart.title;
        ws.getCell("A1").font = { bold: true, size: 14 };

        if (chart.description) {
          ws.getCell("A2").value = chart.description;
          ws.getCell("A2").font = { italic: true, size: 11 };
        }

        const chartImg = await getChartPngDataUrl(i);
        if (chartImg) {
          const imageId = workbook.addImage({
            base64: chartImg.dataUrl,
            extension: "png",
          });

          // Place image roughly below title/description
          ws.addImage(imageId, {
            tl: { col: 0, row: chart.description ? 3 : 2 },
            ext: { width: 720, height: 320 },
          });
        }

        // Data table below image
        if (chart.data && chart.data.length > 0) {
          const startRow = (chartImg ? (chart.description ? 22 : 21) : (chart.description ? 5 : 4));
          const headers = Object.keys(chart.data[0]);

          ws.getRow(startRow).values = ["", ...headers];
          ws.getRow(startRow).font = { bold: true };

          chart.data.forEach((row, idx) => {
            ws.getRow(startRow + 1 + idx).values = ["", ...headers.map((h) => (row as any)[h])];
          });

          ws.views = [{ state: "frozen", ySplit: startRow }];
        }
      }
    }

    // Details sheet
    if (data && data.length > 0) {
      const ws = workbook.addWorksheet("Dados");
      const headers = Object.keys(data[0]);

      ws.addRow(headers.map((h) => h.replace(/([A-Z])/g, " $1").trim()));
      ws.getRow(1).font = { bold: true };

      data.forEach((row) => {
        ws.addRow(headers.map((h) => (row as any)[h]));
      });

      ws.views = [{ state: "frozen", ySplit: 1 }];
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const link = document.createElement("a");
    const filename = `${reportTitle.toLowerCase().replace(/\s+/g, "-")}.xlsx`;
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);

    onExportComplete?.({
      type: "Excel",
      filename,
      date: new Date().toISOString(),
    });

    toast({
      title: "Excel exportado com sucesso!",
      description: `Relatório "${reportTitle}" foi baixado.`,
    });
  };

  const exportToCSV = () => {
    if (!data || data.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Gere um relatório primeiro.",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = String(row[h] ?? '');
        return val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(','))
    ];
    const csv = csvRows.join('\n');

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const filename = `${reportTitle.toLowerCase().replace(/\s+/g, "-")}.csv`;
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    onExportComplete?.({
      type: "CSV",
      filename,
      date: new Date().toISOString(),
    });

    toast({
      title: "CSV exportado com sucesso!",
      description: `Relatório "${reportTitle}" foi baixado.`,
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => void exportToPDF()}>
        <FileText className="h-4 w-4 mr-2" />
        Baixar PDF
      </Button>
      <Button variant="outline" size="sm" onClick={() => void exportToExcel()}>
        <Sheet className="h-4 w-4 mr-2" />
        Baixar Excel
      </Button>
      <Button variant="outline" size="sm" onClick={exportToCSV}>
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Baixar CSV
      </Button>
    </div>
  );
};