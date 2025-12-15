import { useState } from "react";
import { Building2, MapPin, Phone, Mail, User, Search, Filter } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Condominio, CondoStatus, STATUS_COLORS, STATUS_LABELS } from "@/types/condominios";

interface CondominiosListaProps {
  condominios: Condominio[];
  onEdit: (condo: Condominio) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export const CondominiosLista = ({ 
  condominios, 
  onEdit, 
  onDelete, 
  onView 
}: CondominiosListaProps) => {
  const [busca, setBusca] = useState("");
  const [statusFilter, setStatusFilter] = useState<CondoStatus | "todos">("todos");

  const filtered = condominios.filter(condo => {
    const matchBusca = condo.nome.toLowerCase().includes(busca.toLowerCase()) ||
      condo.sindico.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = statusFilter === "todos" || condo.statusContrato === statusFilter;
    return matchBusca && matchStatus;
  });

  const formatCurrency = (value: string) => {
    const num = parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.'));
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Pesquisar por nome ou síndico..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 bg-white border-slate-200"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CondoStatus | "todos")}>
          <SelectTrigger className="w-full sm:w-48 bg-white border-slate-200">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="suspenso">Suspensos</SelectItem>
            <SelectItem value="finalizado">Finalizados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid de Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum condomínio encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((condo) => (
            <Card key={condo.id} className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge className={`${STATUS_COLORS[condo.statusContrato].bg} ${STATUS_COLORS[condo.statusContrato].text} border-0`}>
                    {STATUS_LABELS[condo.statusContrato]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold text-slate-800 truncate">{condo.nome}</h3>
                  <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{condo.endereco}</span>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="w-3 h-3" />
                    <span className="truncate">{condo.sindico}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3 h-3" />
                    <span>{condo.telefone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{condo.email}</span>
                  </div>
                </div>
                {condo.servicos.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {condo.servicos.slice(0, 3).map((servico) => (
                      <Badge key={servico} variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                        {servico}
                      </Badge>
                    ))}
                    {condo.servicos.length > 3 && (
                      <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                        +{condo.servicos.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-blue-600">
                  {formatCurrency(condo.valorContrato)}
                </span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => onView(condo.id)}>
                    Ver
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onEdit(condo)}>
                    Editar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onDelete(condo.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
