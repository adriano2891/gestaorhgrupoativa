import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, Star } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { toast } from "sonner";

interface ReportCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  period: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const ReportCard = ({
  title,
  description,
  icon: Icon,
  color,
  bgColor,
  period,
  isFavorite = false,
  onToggleFavorite,
}: ReportCardProps) => {
  const handleExport = (formato: string) => {
    toast.success(`Gerando relatório em ${formato.toUpperCase()}...`);
    // Aqui seria implementada a geração real do relatório
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className={`${bgColor} p-3 rounded-lg`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{title}</CardTitle>
              {onToggleFavorite && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleFavorite}
                  className="h-8 w-8 p-0"
                >
                  <Star
                    className={`h-4 w-4 ${
                      isFavorite ? "fill-yellow-400 text-yellow-400" : ""
                    }`}
                  />
                </Button>
              )}
            </div>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{period}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <FileText className="mr-2 h-4 w-4" />
                CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};
