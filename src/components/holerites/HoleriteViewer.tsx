import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Send } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
  onDownload: () => void;
  onSendEmail: () => void;
}

export const HoleriteViewer = ({
  open,
  onOpenChange,
  data,
  onDownload,
  onSendEmail,
}: HoleriteViewerProps) => {
  if (!data) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

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
          {/* Informações do Funcionário */}
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

          {/* Proventos */}
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

          {/* Descontos */}
          <div>
            <h3 className="font-semibold mb-3">Descontos</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>INSS</span>
                <span className="font-medium text-destructive">
                  -{formatCurrency(data.inss)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IRRF</span>
                <span className="font-medium text-destructive">
                  -{formatCurrency(data.irrf)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>FGTS</span>
                <span className="font-medium text-destructive">
                  -{formatCurrency(data.fgts)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Outros Descontos</span>
                <span className="font-medium text-destructive">
                  -{formatCurrency(data.deductions)}
                </span>
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

          {/* Valor Líquido */}
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Valor Líquido</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(data.netSalary)}
              </span>
            </div>
          </div>

          {/* Ações */}
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
