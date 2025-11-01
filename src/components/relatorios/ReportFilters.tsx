import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReportFiltersProps {
  reportType: string;
  filters: any;
  onFilterChange: (filters: any) => void;
  onGenerate: () => void;
}

export const ReportFilters = ({ reportType, filters, onFilterChange, onGenerate }: ReportFiltersProps) => {
  const handleChange = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const getFiltersForReport = () => {
    const commonFilters = (
      <>
        <div className="space-y-2">
          <Label>Período Inicial</Label>
          <Input
            type="date"
            value={filters.dataInicio || ""}
            onChange={(e) => handleChange("dataInicio", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Período Final</Label>
          <Input
            type="date"
            value={filters.dataFim || ""}
            onChange={(e) => handleChange("dataFim", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Departamento</Label>
          <Select value={filters.departamento} onValueChange={(v) => handleChange("departamento", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
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
      </>
    );

    switch (reportType) {
      case "funcionarios":
        return (
          <>
            {commonFilters}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="ferias">Férias</SelectItem>
                  <SelectItem value="afastado">Afastado</SelectItem>
                  <SelectItem value="desligado">Desligado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select value={filters.cargo} onValueChange={(v) => handleChange("cargo", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="analista">Analista</SelectItem>
                  <SelectItem value="coordenador">Coordenador</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="diretor">Diretor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "faltas-atrasos":
        return (
          <>
            {commonFilters}
            <div className="space-y-2">
              <Label>Tipo de Ausência</Label>
              <Select value={filters.tipoAusencia} onValueChange={(v) => handleChange("tipoAusencia", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="justificada">Justificada</SelectItem>
                  <SelectItem value="nao-justificada">Não Justificada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "turnover":
        return (
          <>
            {commonFilters}
            <div className="space-y-2">
              <Label>Tipo de Movimentação</Label>
              <Select value={filters.tipoMovimentacao} onValueChange={(v) => handleChange("tipoMovimentacao", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="admissao">Admissão</SelectItem>
                  <SelectItem value="desligamento">Desligamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Select value={filters.motivo} onValueChange={(v) => handleChange("motivo", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pedido">Pedido de Demissão</SelectItem>
                  <SelectItem value="justa-causa">Justa Causa</SelectItem>
                  <SelectItem value="sem-justa-causa">Sem Justa Causa</SelectItem>
                  <SelectItem value="acordo">Acordo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      default:
        return commonFilters;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getFiltersForReport()}
      </div>
      <div className="flex justify-end">
        <Button onClick={onGenerate} size="lg" className="px-8">
          Gerar Relatório
        </Button>
      </div>
    </div>
  );
};
