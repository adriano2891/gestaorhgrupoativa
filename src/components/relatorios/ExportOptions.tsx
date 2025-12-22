import { Button } from "@/components/ui/button";
import { Download, FileText, Sheet, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ExportOptionsProps {
  data: any[];
  reportTitle: string;
  summary?: Record<string, string | number>;
  onExportComplete?: (exportInfo: { type: string; filename: string; date: string }) => void;
}

export const ExportOptions = ({ data, reportTitle, summary, onExportComplete }: ExportOptionsProps) => {
  const { toast } = useToast();

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header com cor de fundo
    doc.setFillColor(17, 188, 183);
    doc.rect(0, 0, 210, 35, 'F');
    
    // Título
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(reportTitle, 14, 18);
    
    // Data de geração
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
    
    doc.setTextColor(0, 0, 0);
    
    let yPos = 45;
    
    // Resumo/Summary (se houver)
    if (summary && Object.keys(summary).length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo Executivo", 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const summaryEntries = Object.entries(summary);
      const cols = Math.min(3, summaryEntries.length);
      const colWidth = 60;
      
      summaryEntries.forEach((entry, index) => {
        const [key, value] = entry;
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = 14 + (col * colWidth);
        const y = yPos + (row * 12);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(key.replace(/([A-Z])/g, " $1").trim(), x, y);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(17, 188, 183);
        doc.text(String(value), x, y + 5);
      });
      
      doc.setTextColor(0, 0, 0);
      yPos += Math.ceil(summaryEntries.length / cols) * 12 + 15;
    }
    
    // Tabela de dados
    if (data && data.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Dados Detalhados", 14, yPos);
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
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: { 
          fillColor: [17, 188, 183],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
        columnStyles: {
          0: { fontStyle: 'bold' }
        }
      });
    }
    
    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount} - Gerado por Sistema de Gestão RH`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    const filename = `${reportTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    doc.save(filename);
    
    onExportComplete?.({
      type: 'PDF',
      filename,
      date: new Date().toISOString()
    });
    
    toast({
      title: "PDF exportado com sucesso!",
      description: `Relatório "${reportTitle}" foi baixado.`,
    });
  };

  const exportToExcel = () => {
    // Criar planilha com resumo se existir
    const workbook = XLSX.utils.book_new();
    
    if (summary && Object.keys(summary).length > 0) {
      const summaryData = Object.entries(summary).map(([key, value]) => ({
        Indicador: key.replace(/([A-Z])/g, " $1").trim(),
        Valor: value
      }));
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumo");
    }
    
    // Planilha principal com dados
    if (data && data.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
    }
    
    const filename = `${reportTitle.toLowerCase().replace(/\s+/g, '-')}.xlsx`;
    XLSX.writeFile(workbook, filename);
    
    onExportComplete?.({
      type: 'Excel',
      filename,
      date: new Date().toISOString()
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
    
    onExportComplete?.({
      type: 'CSV',
      filename,
      date: new Date().toISOString()
    });
    
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