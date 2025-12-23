import { Button } from "@/components/ui/button";
import { FileText, Sheet, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;
    
    // Header
    doc.setFillColor(17, 188, 183);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(reportTitle, margin, 18);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, 28);
    
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
        const x = margin + (col * colWidth);
        const y = yPos + (row * 18);
        
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(x, y - 4, colWidth - 5, 16, 2, 2, 'F');
        
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
    
    // Gráficos (como tabelas)
    if (charts && charts.length > 0) {
      if (yPos > pageHeight - 100) {
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
      
      charts.forEach((chart, chartIndex) => {
        if (yPos > pageHeight - 80) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(50, 50, 50);
        doc.text(`${chartIndex + 1}. ${chart.title}`, margin, yPos);
        yPos += 5;
        
        if (chart.description) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(100, 100, 100);
          doc.text(chart.description, margin, yPos);
          yPos += 6;
        }
        
        if (chart.data && chart.data.length > 0) {
          const chartDataKeys = Object.keys(chart.data[0]);
          const labelKey = chartDataKeys[0];
          const valueKey = chartDataKeys.find(k => k === 'valor' || k === 'value') || chartDataKeys[1];
          
          const chartHeaders = [labelKey.charAt(0).toUpperCase() + labelKey.slice(1), chart.dataName || 'Valor'];
          const chartRows = chart.data.slice(0, 10).map(item => {
            const labelVal = item[labelKey];
            const numVal = item[valueKey];
            return [
              String(labelVal || '-'),
              typeof numVal === 'number' 
                ? numVal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
                : String(numVal || '-')
            ];
          });
          
          autoTable(doc, {
            startY: yPos,
            head: [chartHeaders],
            body: chartRows,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { 
              fillColor: [17, 188, 183],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              halign: 'center'
            },
            tableWidth: 'wrap',
            margin: { left: margin }
          });
          
          const lastTable = doc as unknown as { lastAutoTable?: { finalY: number } };
          yPos = (lastTable.lastAutoTable?.finalY || yPos) + 5;
        }
        
        if (chart.insight) {
          if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFillColor(240, 253, 250);
          const insightLines = doc.splitTextToSize(`Insight: ${chart.insight}`, pageWidth - margin * 2 - 10);
          const insightHeight = insightLines.length * 5 + 6;
          doc.roundedRect(margin, yPos - 2, pageWidth - margin * 2, insightHeight, 2, 2, 'F');
          
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(17, 94, 89);
          doc.text(insightLines, margin + 5, yPos + 4);
          yPos += insightHeight + 8;
        }
        
        yPos += 10;
      });
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
      doc.text(`${data.length} registro${data.length !== 1 ? 's' : ''} encontrado${data.length !== 1 ? 's' : ''}`, margin, yPos);
      yPos += 5;
      
      const headers = Object.keys(data[0]).map(key => 
        key.replace(/([A-Z])/g, " $1").trim()
      );
      const rows = data.map(row => Object.values(row).map(val => String(val ?? '-')));
      
      autoTable(doc, {
        startY: yPos,
        head: [headers],
        body: rows,
        theme: 'striped',
        styles: { 
          fontSize: 7,
          cellPadding: 2,
          overflow: 'linebreak',
        },
        headStyles: { 
          fillColor: [17, 188, 183],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
        columnStyles: {
          0: { fontStyle: 'bold' }
        },
      });
    }
    
    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount} - ${reportTitle}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    const filename = `${reportTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    doc.save(filename);
    
    if (onExportComplete) {
      onExportComplete({
        type: 'PDF',
        filename,
        date: new Date().toISOString()
      });
    }
    
    toast({
      title: "PDF exportado com sucesso!",
      description: `Relatório "${reportTitle}" foi baixado.`,
    });
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    if (summary && Object.keys(summary).length > 0) {
      const summaryData = Object.entries(summary).map(([key, value]) => ({
        Indicador: key.replace(/([A-Z])/g, " $1").trim(),
        Valor: value
      }));
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumo");
    }
    
    if (charts && charts.length > 0) {
      charts.forEach((chart, index) => {
        if (chart.data && chart.data.length > 0) {
          const chartSheet = XLSX.utils.json_to_sheet(chart.data);
          const sheetName = `Grafico ${index + 1}`;
          XLSX.utils.book_append_sheet(workbook, chartSheet, sheetName);
        }
      });
    }
    
    if (data && data.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
    }
    
    const filename = `${reportTitle.toLowerCase().replace(/\s+/g, '-')}.xlsx`;
    XLSX.writeFile(workbook, filename);
    
    if (onExportComplete) {
      onExportComplete({
        type: 'Excel',
        filename,
        date: new Date().toISOString()
      });
    }
    
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
        variant: "destructive"
      });
      return;
    }
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const filename = `${reportTitle.toLowerCase().replace(/\s+/g, '-')}.csv`;
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    if (onExportComplete) {
      onExportComplete({
        type: 'CSV',
        filename,
        date: new Date().toISOString()
      });
    }
    
    toast({
      title: "CSV exportado com sucesso!",
      description: `Relatório "${reportTitle}" foi baixado.`,
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={exportToPDF}
        className="bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all"
      >
        <FileText className="h-4 w-4 mr-2 text-red-500" />
        Baixar PDF
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={exportToExcel}
        className="bg-white hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-all"
      >
        <Sheet className="h-4 w-4 mr-2 text-green-600" />
        Baixar Excel
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={exportToCSV}
        className="bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all"
      >
        <FileSpreadsheet className="h-4 w-4 mr-2 text-blue-500" />
        Baixar CSV
      </Button>
    </div>
  );
};