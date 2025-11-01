import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FiltrosRelatorioProps {
  onFilter: (filtros: any) => void;
}

export const FiltrosRelatorio = ({ onFilter }: FiltrosRelatorioProps) => {
  const [periodoInicio, setPeriodoInicio] = useState<Date>();
  const [periodoFim, setPeriodoFim] = useState<Date>();
  const [departamento, setDepartamento] = useState<string>("todos");
  const [tipoContrato, setTipoContrato] = useState<string>("todos");

  const aplicarFiltros = () => {
    onFilter({
      periodoInicio,
      periodoFim,
      departamento: departamento === "todos" ? null : departamento,
      tipoContrato: tipoContrato === "todos" ? null : tipoContrato,
    });
  };

  const limparFiltros = () => {
    setPeriodoInicio(undefined);
    setPeriodoFim(undefined);
    setDepartamento("todos");
    setTipoContrato("todos");
    onFilter({});
  };

  return (
    <div className="bg-card p-4 rounded-lg border space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Filtros Avançados</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Período Início */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Período Início</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !periodoInicio && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {periodoInicio ? (
                  format(periodoInicio, "PPP", { locale: ptBR })
                ) : (
                  <span>Selecione</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={periodoInicio}
                onSelect={setPeriodoInicio}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Período Fim */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Período Fim</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !periodoFim && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {periodoFim ? (
                  format(periodoFim, "PPP", { locale: ptBR })
                ) : (
                  <span>Selecione</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={periodoFim}
                onSelect={setPeriodoFim}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Departamento */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Departamento</label>
          <Select value={departamento} onValueChange={setDepartamento}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ti">TI</SelectItem>
              <SelectItem value="rh">RH</SelectItem>
              <SelectItem value="financeiro">Financeiro</SelectItem>
              <SelectItem value="comercial">Comercial</SelectItem>
              <SelectItem value="operacional">Operacional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tipo de Contrato */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de Contrato</label>
          <Select value={tipoContrato} onValueChange={setTipoContrato}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="clt">CLT</SelectItem>
              <SelectItem value="pj">PJ</SelectItem>
              <SelectItem value="estagio">Estágio</SelectItem>
              <SelectItem value="temporario">Temporário</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={limparFiltros}>
          Limpar
        </Button>
        <Button onClick={aplicarFiltros}>
          <Filter className="mr-2 h-4 w-4" />
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
};
