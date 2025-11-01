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

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  status: "active" | "inactive";
  hasPayslip: boolean;
}

interface HoleriteCardProps {
  employee: Employee;
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
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{employee.name}</CardTitle>
            <CardDescription>
              {employee.position} • {employee.department}
            </CardDescription>
          </div>
          <Badge variant={employee.status === "active" ? "default" : "secondary"}>
            {employee.status === "active" ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {employee.hasPayslip ? (
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
