import { Button } from "@/components/ui/button";
import { Download, FileText, Sheet, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ExportOptionsProps {
  data: any[];
  reportTitle: string;
  metrics?: { title: string; value: string | number }[];
}

export const ExportOptions = ({ data, reportTitle, metrics }: ExportOptionsProps) => {
  const { toast } = useToast();

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text(reportTitle, 14, 20);
    
    // Data de geração
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
    
    // Métricas (se houver)
    if (metrics && metrics.length > 0) {
      let yPos = 35;
      doc.setFontSize(12);
      doc.text("Métricas Principais:", 14, yPos);
      yPos += 7;
      
      doc.setFontSize(10);
      metrics.forEach((metric) => {
        doc.text(`${metric.title}: ${metric.value}`, 14, yPos);
        yPos += 5;
      });
      yPos += 3;
      
      // Tabela de dados
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const rows = data.map(row => headers.map(key => row[key]));
        
        autoTable(doc, {
          startY: yPos,
          head: [headers],
          body: rows,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [17, 188, 183] }
        });
      }
    }
    
    doc.save(`${reportTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    
    toast({
      title: "PDF exportado",
      description: "Relatório exportado com sucesso!",
    });
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
    
    XLSX.writeFile(workbook, `${reportTitle.toLowerCase().replace(/\s+/g, '-')}.xlsx`);
    
    toast({
      title: "Excel exportado",
      description: "Relatório exportado com sucesso!",
    });
  };

  const exportToCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${reportTitle.toLowerCase().replace(/\s+/g, '-')}.csv`;
    link.click();
    
    toast({
      title: "CSV exportado",
      description: "Relatório exportado com sucesso!",
    });
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportToPDF}>
        <FileText className="h-4 w-4 mr-2" />
        PDF
      </Button>
      <Button variant="outline" size="sm" onClick={exportToExcel}>
        <Sheet className="h-4 w-4 mr-2" />
        Excel
      </Button>
      <Button variant="outline" size="sm" onClick={exportToCSV}>
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        CSV
      </Button>
    </div>
  );
};
