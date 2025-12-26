import { Eye, Download, Send, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Funcionario } from "@/hooks/useFuncionarios";
import { Holerite } from "@/hooks/useHolerites";

interface HoleriteCardProps {
  employee: Funcionario;
  holerite?: Holerite | null;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onSendEmail: (id: string) => void;
}

const getMesNome = (mes: number) => {
  const meses = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];
  return meses[mes - 1];
};

export const HoleriteCard = ({
  employee,
  holerite,
  onView,
  onDownload,
  onSendEmail,
}: HoleriteCardProps) => {
  const hasPayslip = !!holerite;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg truncate">{employee.nome}</CardTitle>
            <CardDescription className="truncate">
              {employee.cargo || "Cargo não informado"} • {employee.departamento || "Não informado"}
            </CardDescription>
          </div>
          {hasPayslip ? (
            <Badge variant="default" className="ml-2 flex-shrink-0">
              {getMesNome(holerite.mes)}/{holerite.ano}
            </Badge>
          ) : (
            <Badge variant="secondary" className="ml-2 flex-shrink-0">
              Sem holerite
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasPayslip && (
          <div className="mb-3 text-sm text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>
              Líquido: <strong className="text-foreground">R$ {holerite.salario_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </span>
          </div>
        )}
        <div className="flex gap-2">
          {hasPayslip ? (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => onView(employee.id)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(employee.id)}
                disabled={!holerite.arquivo_url}
                title={holerite.arquivo_url ? "Baixar PDF" : "PDF não disponível"}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSendEmail(employee.id)}
              >
                <Send className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="w-full text-center py-2 text-sm text-muted-foreground">
              Nenhum holerite cadastrado
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
