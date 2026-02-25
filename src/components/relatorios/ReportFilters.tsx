import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReportFiltersProps {
  reportType: string;
  filters: any;
  onFilterChange: (filters: any) => void;
  onGenerate: () => void;
  funcionarios?: { id: string; nome: string }[];
  escalas?: string[];
  turnos?: string[];
}

export const ReportFilters = ({ reportType, filters, onFilterChange, onGenerate, funcionarios, escalas, turnos }: ReportFiltersProps) => {
  const handleChange = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const isPontoReport = ["faltas-atrasos", "pontos", "absenteismo"].includes(reportType);

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

  const pontoFilters = (
    <>
      {commonFilters}
      {funcionarios && funcionarios.length > 0 && (
        <div className="space-y-2">
          <Label>Colaborador</Label>
          <Select value={filters.colaborador} onValueChange={(v) => handleChange("colaborador", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {funcionarios.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {escalas && escalas.length > 0 && (
        <div className="space-y-2">
          <Label>Escala</Label>
          <Select value={filters.escala} onValueChange={(v) => handleChange("escala", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              {escalas.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {turnos && turnos.length > 0 && (
        <div className="space-y-2">
          <Label>Turno</Label>
          <Select value={filters.turno} onValueChange={(v) => handleChange("turno", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {turnos.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );

  const getFiltersForReport = () => {
    if (isPontoReport) return pontoFilters;

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

      case "treinamentos":
        return (
          <>
            {commonFilters}
            <div className="space-y-2">
              <Label>Status do Curso</Label>
              <Select value={filters.statusCurso} onValueChange={(v) => handleChange("statusCurso", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
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
