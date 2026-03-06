import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Share2, History, Shield, QrCode, X } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

interface ComprovantePontoModalProps {
  comprovante: any;
  onClose: () => void;
  onViewHistory?: () => void;
}

const formatTime = (ts: string | null) => {
  if (!ts) return "--:--";
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const formatInterval = (interval: string | null) => {
  if (!interval) return "0h 0min";
  const match = interval.match(/(\d+):(\d+)/);
  if (match) return `${parseInt(match[1])}h ${parseInt(match[2])}min`;
  return "0h 0min";
};

export const ComprovantePontoModal = ({ comprovante, onClose, onViewHistory }: ComprovantePontoModalProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [empresa, setEmpresa] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load empresa data
  useEffect(() => {
    const loadEmpresa = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(`${supabaseUrl}/rest/v1/empresas?select=*&limit=1`, {
          headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.[0]) setEmpresa(data[0]);
        }
      } catch {}
    };
    loadEmpresa();
  }, []);

  useEffect(() => {
    if (comprovante?.qr_code_data) {
      try {
        const qrData = JSON.parse(comprovante.qr_code_data);
        QRCode.toDataURL(qrData.url || comprovante.qr_code_data, {
          width: 200,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        }).then(setQrCodeUrl).catch(console.error);
      } catch {
        QRCode.toDataURL(comprovante.qr_code_data, { width: 200, margin: 2 })
          .then(setQrCodeUrl).catch(console.error);
      }
    }
  }, [comprovante?.qr_code_data]);

  const registro = comprovante?.registro;
  const prof = comprovante?.profile;

  const downloadPDF = async () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      let y = 20;

      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("COMPROVANTE DE REGISTRO DE PONTO", 105, y, { align: "center" });
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Sistema REP-A | Portaria MTP nº 671/2021", 105, y, { align: "center" });
      y += 6;
      doc.text("Grupo Ativa Administradora", 105, y, { align: "center" });
      y += 10;
      
      doc.setDrawColor(0, 150, 136);
      doc.setLineWidth(0.5);
      doc.line(20, y, 190, y);
      y += 10;

      // Employee data
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("DADOS DO FUNCIONÁRIO", 20, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Nome: ${prof?.nome || '-'}`, 20, y); y += 5;
      doc.text(`Cargo: ${prof?.cargo || '-'}`, 20, y); y += 5;
      doc.text(`Departamento: ${prof?.departamento || '-'}`, 20, y); y += 10;

      // Journey data
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("DADOS DA JORNADA", 20, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Data: ${comprovante.data_jornada ? new Date(comprovante.data_jornada + "T12:00:00").toLocaleDateString("pt-BR") : '-'}`, 20, y); y += 5;
      doc.text(`Entrada: ${formatTime(comprovante.horario_entrada)}`, 20, y); y += 5;
      
      const pausas = comprovante.pausas || [];
      pausas.forEach((p: any) => {
        doc.text(`${p.tipo}: Saída ${formatTime(p.saida)} | Retorno ${formatTime(p.retorno)}`, 20, y);
        y += 5;
      });
      
      doc.text(`Saída: ${formatTime(comprovante.horario_saida)}`, 20, y); y += 5;
      doc.text(`Total de Horas: ${formatInterval(comprovante.total_horas)}`, 20, y); y += 5;
      doc.text(`Horas Extras: ${formatInterval(comprovante.total_horas_extras)}`, 20, y); y += 10;

      // Technical data
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("DADOS TÉCNICOS", 20, y);
      y += 7;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`ID Comprovante: ${comprovante.id}`, 20, y); y += 4;
      doc.text(`Gerado em: ${new Date(comprovante.created_at).toLocaleString("pt-BR")}`, 20, y); y += 4;
      doc.text(`IP: ${comprovante.ip_address || '-'}`, 20, y); y += 4;
      doc.text(`Dispositivo: ${(comprovante.user_agent || '-').substring(0, 80)}`, 20, y); y += 4;
      doc.text(`Geolocalização: ${comprovante.geolocation || '-'}`, 20, y); y += 4;
      doc.text(`Hash Criptográfico: ${comprovante.hash_comprovante}`, 20, y); y += 4;
      doc.text(`Assinatura Digital: ${comprovante.assinatura_digital}`, 20, y); y += 10;

      // QR Code
      if (qrCodeUrl) {
        doc.addImage(qrCodeUrl, 'PNG', 75, y, 60, 60);
        y += 65;
        doc.setFontSize(8);
        doc.text("Escaneie para verificar a autenticidade", 105, y, { align: "center" });
      }

      doc.save(`comprovante-ponto-${comprovante.data_jornada}.pdf`);
      toast.success("PDF do comprovante baixado");
    } catch (e) {
      console.error("Erro ao gerar PDF:", e);
      toast.error("Erro ao gerar PDF");
    }
  };

  const shareComprovante = async () => {
    const text = `Comprovante de Ponto - ${prof?.nome || ''}\nData: ${comprovante.data_jornada}\nEntrada: ${formatTime(comprovante.horario_entrada)}\nSaída: ${formatTime(comprovante.horario_saida)}\nHash: ${comprovante.hash_comprovante?.substring(0, 16)}...\nVerificar: ${window.location.origin}/verificar-comprovante/${comprovante.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: "Comprovante de Ponto", text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Dados do comprovante copiados");
    }
  };

  return (
    <Dialog open={!!comprovante} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle>Comprovante de Registro de Ponto</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Company */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="font-semibold text-sm">{empresa?.razao_social || 'Grupo Ativa Administradora'}</p>
            <p className="text-xs text-muted-foreground">CNPJ: {empresa?.cnpj || '00.000.000/0001-00'}</p>
            <p className="text-xs text-muted-foreground">Sistema REP-A | Portaria 671/2021</p>
          </div>

          {/* Employee */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Funcionário</h4>
            <p className="font-medium">{prof?.nome || '-'}</p>
            <p className="text-sm text-muted-foreground">
              {prof?.matricula ? `Matrícula: ${prof.matricula} • ` : `ID: ${prof?.id?.substring(0, 8)}... • `}
              {prof?.cargo || '-'} • {prof?.departamento || '-'}
            </p>
          </div>

          <Separator />

          {/* Journey */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Jornada</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Data:</span>
                <span className="ml-1 font-medium">
                  {comprovante.data_jornada ? new Date(comprovante.data_jornada + "T12:00:00").toLocaleDateString("pt-BR") : '-'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Entrada:</span>
                <span className="ml-1 font-medium">{formatTime(comprovante.horario_entrada)}</span>
              </div>
              {(comprovante.pausas || []).map((p: any, i: number) => (
                <div key={i} className="col-span-2">
                  <span className="text-muted-foreground">{p.tipo}:</span>
                  <span className="ml-1">{formatTime(p.saida)} → {formatTime(p.retorno)}</span>
                </div>
              ))}
              <div>
                <span className="text-muted-foreground">Saída:</span>
                <span className="ml-1 font-medium">{formatTime(comprovante.horario_saida)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total:</span>
                <span className="ml-1 font-semibold">{formatInterval(comprovante.total_horas)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Horas Extras:</span>
                <span className="ml-1 font-semibold">{formatInterval(comprovante.total_horas_extras)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Technical */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Dados Técnicos</h4>
            <div className="space-y-1 text-xs font-mono bg-muted/30 rounded-lg p-3">
              <p><span className="text-muted-foreground">ID:</span> {comprovante.id}</p>
              <p><span className="text-muted-foreground">Gerado:</span> {new Date(comprovante.created_at).toLocaleString("pt-BR")}</p>
              <p><span className="text-muted-foreground">IP:</span> {comprovante.ip_address || '-'}</p>
              <p><span className="text-muted-foreground">Geo:</span> {comprovante.geolocation || '-'}</p>
              <p className="break-all"><span className="text-muted-foreground">Hash:</span> {comprovante.hash_comprovante}</p>
              <p className="break-all"><span className="text-muted-foreground">Assinatura:</span> {comprovante.assinatura_digital?.substring(0, 32)}...</p>
            </div>
          </div>

          {/* QR Code */}
          {qrCodeUrl && (
            <div className="flex flex-col items-center gap-2 py-2">
              <img src={qrCodeUrl} alt="QR Code de verificação" className="w-40 h-40" />
              <p className="text-xs text-muted-foreground text-center">
                Escaneie para verificar autenticidade
              </p>
              <Badge variant="outline" className="gap-1">
                <QrCode className="h-3 w-3" /> Verificação pública
              </Badge>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="default" onClick={downloadPDF} className="gap-2">
              <Download className="h-4 w-4" /> Baixar PDF
            </Button>
            <Button variant="outline" onClick={shareComprovante} className="gap-2">
              <Share2 className="h-4 w-4" /> Compartilhar
            </Button>
          </div>
          {onViewHistory && (
            <Button variant="secondary" onClick={() => { onClose(); onViewHistory(); }} className="w-full gap-2">
              <History className="h-4 w-4" /> Ver histórico de registros
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
