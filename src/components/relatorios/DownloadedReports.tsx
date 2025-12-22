import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Sheet, FileSpreadsheet, Trash2, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DownloadedReport {
  id: string;
  type: string;
  filename: string;
  reportTitle: string;
  date: string;
}

interface DownloadedReportsProps {
  reports: DownloadedReport[];
  onClear: () => void;
}

export const DownloadedReports = ({ reports, onClear }: DownloadedReportsProps) => {
  if (reports.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'Excel':
        return <Sheet className="h-5 w-5 text-green-600" />;
      case 'CSV':
        return <FileSpreadsheet className="h-5 w-5 text-blue-500" />;
      default:
        return <Download className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'PDF':
        return 'destructive' as const;
      case 'Excel':
        return 'default' as const;
      case 'CSV':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <Card className="mt-6 border-t-4 border-t-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="h-5 w-5 text-primary" />
              Documentos para Download
            </CardTitle>
            <CardDescription>
              {reports.length} relatório{reports.length !== 1 ? 's' : ''} gerado{reports.length !== 1 ? 's' : ''} nesta sessão
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-background shadow-sm border">
                  {getIcon(report.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{report.reportTitle}</p>
                    <Badge variant={getBadgeVariant(report.type)} className="text-xs">
                      {report.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(report.date), "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(report.date), "HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground mr-2">{report.filename}</p>
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                  ✓ Baixado
                </Badge>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Os arquivos foram baixados para a pasta de downloads do seu navegador
        </p>
      </CardContent>
    </Card>
  );
};