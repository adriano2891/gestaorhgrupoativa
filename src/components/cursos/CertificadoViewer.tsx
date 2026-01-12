import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  Download, 
  ExternalLink, 
  FileText,
  Upload,
  RefreshCw 
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Certificado } from "@/types/cursos";

interface CertificadoViewerProps {
  certificado: Certificado;
  onDownload?: () => void;
  onReemitir?: () => void;
  showReemitir?: boolean;
}

export const CertificadoViewer = ({
  certificado,
  onDownload,
  onReemitir,
  showReemitir = false,
}: CertificadoViewerProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-24 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 flex items-center justify-center relative">
        <Award className="h-12 w-12 text-white" />
        <div className="absolute top-2 right-2">
          <Badge className="bg-white/20 text-white border-0 text-xs">
            Válido
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h4 className="font-semibold line-clamp-1">{certificado.curso?.titulo}</h4>
          <p className="text-sm text-muted-foreground">
            Emitido em{" "}
            {format(new Date(certificado.data_emissao), "dd 'de' MMMM 'de' yyyy", {
              locale: ptBR,
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono">
            {certificado.codigo_validacao}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1"
            onClick={onDownload}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          {showReemitir && onReemitir && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onReemitir}
              title="Reemitir certificado"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente de certificado em miniatura para lista
interface CertificadoMiniProps {
  certificado: Certificado;
  onClick?: () => void;
}

export const CertificadoMini = ({ certificado, onClick }: CertificadoMiniProps) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors w-full text-left"
    >
      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center flex-shrink-0">
        <Award className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{certificado.curso?.titulo}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(certificado.data_emissao), "dd/MM/yyyy", { locale: ptBR })}
        </p>
      </div>
      <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
};
