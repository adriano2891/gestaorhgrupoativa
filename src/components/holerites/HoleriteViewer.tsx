import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Send, ExternalLink, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

interface PayslipData {
  employeeName: string;
  position: string;
  department: string;
  month: string;
  year: number;
  salary: number;
  benefits: number;
  deductions: number;
  fgts: number;
  inss: number;
  irrf: number;
  netSalary: number;
}

interface HoleriteViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PayslipData | null;
  arquivoUrl?: string | null;
  onDownload: () => void;
  onSendEmail: () => void;
}

export const HoleriteViewer = ({
  open,
  onOpenChange,
  data,
  arquivoUrl,
  onDownload,
  onSendEmail,
}: HoleriteViewerProps) => {
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  if (!data) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const extractPath = (url: string) => {
    if (!url.startsWith('http')) return url;
    try {
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split('/holerites/');
      if (pathParts.length > 1) return pathParts[1];
    } catch {}
    const marker = "/public/holerites/";
    const idx = url.indexOf(marker);
    if (idx !== -1) return url.substring(idx + marker.length);
    const alt = "/holerites/";
    const idx2 = url.indexOf(alt);
    if (idx2 !== -1) return url.substring(idx2 + alt.length);
    return url;
  };

  const loadPdf = async () => {
    if (!arquivoUrl || pdfBlobUrl) return;
    setIsLoadingPdf(true);
    setPdfError(false);
    try {
      const path = extractPath(arquivoUrl);
      const { data: blob, error } = await supabase.storage
        .from('holerites')
        .download(path);
      if (error) throw error;
      let finalBlob = blob as Blob;
      if (!finalBlob.type || finalBlob.type === 'application/octet-stream') {
        const ab = await finalBlob.arrayBuffer();
        finalBlob = new Blob([ab], { type: 'application/pdf' });
      }
      setPdfBlobUrl(URL.createObjectURL(finalBlob));
    } catch (e) {
      console.error('Erro ao carregar PDF do holerite:', e);
      setPdfError(true);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && arquivoUrl) {
      loadPdf();
    }
    if (!isOpen && pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
      setPdfError(false);
    }
    onOpenChange(isOpen);
  };

  const handleOpenExternal = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank');
    } else if (arquivoUrl) {
      window.open(arquivoUrl, '_blank');
    }
  };

  // If there's a PDF file, show PDF viewer
  if (arquivoUrl) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Holerite - {data.month}/{data.year}</DialogTitle>
            <DialogDescription>
              {data.employeeName} • {data.position}
            </DialogDescription>
          </DialogHeader>

          <div className="w-full h-[65vh]">
            {isLoadingPdf ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Carregando holerite...</p>
                </div>
              </div>
            ) : pdfBlobUrl ? (
              <object
                data={pdfBlobUrl}
                type="application/pdf"
                className="w-full h-full border rounded"
              >
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-center px-6">
                  <div>
                    <p className="mb-4">Visualização embutida indisponível no seu navegador.</p>
                    <Button onClick={handleOpenExternal}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir em Nova Aba
                    </Button>
                  </div>
                </div>
              </object>
            ) : pdfError ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-center px-6">
                <div>
                  <p className="mb-4">Não foi possível carregar o holerite.</p>
                  <Button onClick={handleOpenExternal} variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Tentar Abrir em Nova Aba
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex gap-2">
            <Button onClick={onDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
            <Button onClick={onSendEmail} variant="outline" className="flex-1">
              <Send className="h-4 w-4 mr-2" />
              Enviar por E-mail
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Fallback: show summary data
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Holerite - {data.month}/{data.year}</DialogTitle>
          <DialogDescription>
            {data.employeeName} • {data.position}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-secondary/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Informações do Funcionário</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Nome:</span>
                <p className="font-medium">{data.employeeName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Cargo:</span>
                <p className="font-medium">{data.position}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Departamento:</span>
                <p className="font-medium">{data.department}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Período:</span>
                <p className="font-medium">{data.month}/{data.year}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Proventos</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Salário Base</span>
                <span className="font-medium">{formatCurrency(data.salary)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Benefícios</span>
                <span className="font-medium">{formatCurrency(data.benefits)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total de Proventos</span>
                <span className="text-primary">
                  {formatCurrency(data.salary + data.benefits)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Descontos</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>INSS</span>
                <span className="font-medium text-destructive">-{formatCurrency(data.inss)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IRRF</span>
                <span className="font-medium text-destructive">-{formatCurrency(data.irrf)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>FGTS</span>
                <span className="font-medium text-destructive">-{formatCurrency(data.fgts)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Outros Descontos</span>
                <span className="font-medium text-destructive">-{formatCurrency(data.deductions)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total de Descontos</span>
                <span className="text-destructive">
                  -{formatCurrency(data.inss + data.irrf + data.fgts + data.deductions)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Valor Líquido</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(data.netSalary)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={onDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
            <Button onClick={onSendEmail} variant="outline" className="flex-1">
              <Send className="h-4 w-4 mr-2" />
              Enviar por E-mail
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
