import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FiltrosFeriasProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  departamentoFilter: string;
  setDepartamentoFilter: (value: string) => void;
  apenasNovas: boolean;
  setApenasNovas: (value: boolean) => void;
}

export const FiltrosFerias = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  departamentoFilter,
  setDepartamentoFilter,
  apenasNovas,
  setApenasNovas,
}: FiltrosFeriasProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="reprovado">Reprovado</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={departamentoFilter} onValueChange={setDepartamentoFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Setores</SelectItem>
            <SelectItem value="Administrativo">Administrativo</SelectItem>
            <SelectItem value="Comercial">Comercial</SelectItem>
            <SelectItem value="Financeiro">Financeiro</SelectItem>
            <SelectItem value="TI">TI</SelectItem>
            <SelectItem value="RH">RH</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filtro de apenas novas solicitações */}
      <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
        <Switch
          id="apenas-novas"
          checked={apenasNovas}
          onCheckedChange={setApenasNovas}
        />
        <Label htmlFor="apenas-novas" className="cursor-pointer">
          Mostrar apenas solicitações novas
        </Label>
      </div>
    </div>
  );
};
