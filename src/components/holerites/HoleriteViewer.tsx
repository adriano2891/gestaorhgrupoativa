import { useState, useEffect } from "react";
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
  // CLT fields
  baseCalculoInss: number;
  baseCalculoIrrf: number;
  horasExtrasValor: number;
  adicionalNoturnoValor: number;
  dsrValor: number;
  valeTransporte: number;
  outrosProventos: number;
  outrosDescontos: number;
  observacoes?: string | null;
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

  const extractPath = (url: string) => {
    const cleanUrl = url.split('?')[0];
    if (!cleanUrl.startsWith('http')) return cleanUrl;
    try {
      const parsed = new URL(cleanUrl);
      const pathParts = parsed.pathname.split('/holerites/');
      if (pathParts.length > 1) return decodeURIComponent(pathParts[1]);
    } catch {}
    const alt = "/holerites/";
    const idx = cleanUrl.indexOf(alt);
    if (idx !== -1) return decodeURIComponent(cleanUrl.substring(idx + alt.length));
    return cleanUrl;
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

  useEffect(() => {
    if (open && arquivoUrl && !pdfBlobUrl && !isLoadingPdf) {
      loadPdf();
    }
    if (!open && pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
      setPdfError(false);
    }
  }, [open, arquivoUrl]);

  if (!data) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
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
      <Dialog open={open} onOpenChange={onOpenChange}>
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

  // Fallback: show CLT-compliant summary
  const totalProventos = data.salary + (data.horasExtrasValor || 0) + (data.adicionalNoturnoValor || 0) + (data.dsrValor || 0) + (data.outrosProventos || 0);
  const totalDescontos = (data.inss || 0) + (data.irrf || 0) + (data.valeTransporte || 0) + (data.outrosDescontos || 0) + (data.deductions || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Holerite - {data.month}/{data.year}</DialogTitle>
          <DialogDescription>
            {data.employeeName} • {data.position}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Dados do Funcionário */}
          <div className="bg-secondary/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Dados do Colaborador</h3>
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
                <span className="text-muted-foreground">Competência:</span>
                <p className="font-medium">{data.month}/{data.year}</p>
              </div>
            </div>
          </div>

          {/* PROVENTOS */}
          <div>
            <h3 className="font-semibold mb-3 text-primary">Proventos</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Salário Base</span>
                <span className="font-medium">{formatCurrency(data.salary)}</span>
              </div>
              {(data.horasExtrasValor || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Horas Extras</span>
                  <span className="font-medium">{formatCurrency(data.horasExtrasValor)}</span>
                </div>
              )}
              {(data.adicionalNoturnoValor || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Adicional Noturno</span>
                  <span className="font-medium">{formatCurrency(data.adicionalNoturnoValor)}</span>
                </div>
              )}
              {(data.dsrValor || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>DSR s/ HE</span>
                  <span className="font-medium">{formatCurrency(data.dsrValor)}</span>
                </div>
              )}
              {(data.outrosProventos || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Outros Proventos</span>
                  <span className="font-medium">{formatCurrency(data.outrosProventos)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total de Proventos</span>
                <span className="text-primary">{formatCurrency(totalProventos)}</span>
              </div>
            </div>
          </div>

          {/* DESCONTOS */}
          <div>
            <h3 className="font-semibold mb-3 text-destructive">Descontos</h3>
            <div className="space-y-2">
              {(data.inss || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>INSS {(data.baseCalculoInss || 0) > 0 && <span className="text-muted-foreground text-xs">(Base: {formatCurrency(data.baseCalculoInss)})</span>}</span>
                  <span className="font-medium text-destructive">-{formatCurrency(data.inss)}</span>
                </div>
              )}
              {(data.irrf || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>IRRF {(data.baseCalculoIrrf || 0) > 0 && <span className="text-muted-foreground text-xs">(Base: {formatCurrency(data.baseCalculoIrrf)})</span>}</span>
                  <span className="font-medium text-destructive">-{formatCurrency(data.irrf)}</span>
                </div>
              )}
              {(data.valeTransporte || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Vale Transporte (6%)</span>
                  <span className="font-medium text-destructive">-{formatCurrency(data.valeTransporte)}</span>
                </div>
              )}
              {(data.outrosDescontos || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Outros Descontos</span>
                  <span className="font-medium text-destructive">-{formatCurrency(data.outrosDescontos)}</span>
                </div>
              )}
              {(data.deductions || 0) > 0 && !(data.inss || data.irrf || data.valeTransporte || data.outrosDescontos) && (
                <div className="flex justify-between text-sm">
                  <span>Descontos (não discriminados)</span>
                  <span className="font-medium text-destructive">-{formatCurrency(data.deductions)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total de Descontos</span>
                <span className="text-destructive">-{formatCurrency(totalDescontos)}</span>
              </div>
            </div>
          </div>

          {/* VALOR LÍQUIDO */}
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Valor Líquido</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(data.netSalary)}
              </span>
            </div>
          </div>

          {/* FGTS INFORMATIVO (Lei 8.036/90 - não é desconto) */}
          {(data.fgts || 0) > 0 && (
            <div className="bg-muted/50 p-3 rounded-lg border border-border">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">FGTS (depósito informativo - 8%)</span>
                <span className="font-semibold">{formatCurrency(data.fgts)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Conforme Lei 8.036/90 — valor depositado pelo empregador, não constitui desconto.
              </p>
            </div>
          )}

          {/* Observações */}
          {data.observacoes && (
            <div className="bg-muted/30 p-3 rounded-lg text-sm">
              <span className="font-medium">Observações: </span>
              <span className="text-muted-foreground">{data.observacoes}</span>
            </div>
          )}

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
