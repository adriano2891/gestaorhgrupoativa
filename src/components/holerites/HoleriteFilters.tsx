import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface HoleriteFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedMonth: string;
  onMonthChange: (value: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (value: string) => void;
  selectedPosition: string;
  onPositionChange: (value: string) => void;
}

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const departments = ["Todos", "Tecnologia", "Recursos Humanos", "Financeiro", "Comercial", "Operações"];
const positions = ["Todos", "Desenvolvedor", "Analista", "Gerente", "Coordenador", "Assistente"];

export const HoleriteFilters = ({
  searchTerm,
  onSearchChange,
  selectedMonth,
  onMonthChange,
  selectedDepartment,
  onDepartmentChange,
  selectedPosition,
  onPositionChange,
}: HoleriteFiltersProps) => {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4 md:pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          <Select value={selectedMonth} onValueChange={onMonthChange}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={month} value={String(index + 1)}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Depto" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPosition} onValueChange={onPositionChange}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Cargo" />
            </SelectTrigger>
            <SelectContent>
              {positions.map((pos) => (
                <SelectItem key={pos} value={pos}>
                  {pos}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
