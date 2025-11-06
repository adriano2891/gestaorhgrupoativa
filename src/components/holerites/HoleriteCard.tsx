import { Eye, Download, Send } from "lucide-react";
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

interface HoleriteCardProps {
  employee: Funcionario;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onSendEmail: (id: string) => void;
}

export const HoleriteCard = ({
  employee,
  onView,
  onDownload,
  onSendEmail,
}: HoleriteCardProps) => {
  // Por enquanto, considera que todos os funcionários têm holerite disponível
  const hasPayslip = true;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{employee.nome}</CardTitle>
            <CardDescription>
              {employee.cargo || "Cargo não informado"} • {employee.departamento || "Departamento não informado"}
            </CardDescription>
          </div>
          <Badge variant="default">Ativo</Badge>
        </div>
      </CardHeader>
      <CardContent>
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
                Ver Holerite
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(employee.id)}
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
              Holerite não disponível
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
