import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  FileDown, 
  MoreVertical,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useQuotes } from '@/contexts/QuotesContext';
import { QuotesLayout } from '@/components/orcamentos/QuotesLayout';
import { GlassPanel } from '@/components/orcamentos/GlassPanel';
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS, QuoteStatus } from '@/types/quotes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function OrcamentosDashboard() {
  const navigate = useNavigate();
  const { quotes } = useQuotes();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Stats
  const totalQuotes = quotes.length;
  const pendingQuotes = quotes.filter(q => ['rascunho', 'primeiro_contato', 'segundo_contato', 'visita', 'analise_cliente', 'aprovacao_interna'].includes(q.status)).length;
  const approvedQuotes = quotes.filter(q => ['aprovado', 'assinado', 'implantacao'].includes(q.status)).length;
  const totalValue = quotes.reduce((sum, q) => sum + q.financials.total, 0);

  // Filter quotes
  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = 
      q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.publicId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <QuotesLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Gestão de Orçamentos</h1>
            <p className="text-white/80">Gerencie suas propostas comerciais</p>
          </div>
          <Button 
            onClick={() => navigate('/orcamentos/novo')}
            className="bg-[#006fee] hover:bg-[#0058c4] text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Orçamento
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassPanel className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#006fee]/10 rounded-lg">
                <FileText className="w-5 h-5 text-[#006fee]" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Total</p>
                <p className="text-xl font-bold text-zinc-800">{totalQuotes}</p>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Pendentes</p>
                <p className="text-xl font-bold text-zinc-800">{pendingQuotes}</p>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Aprovados</p>
                <p className="text-xl font-bold text-zinc-800">{approvedQuotes}</p>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#0ABAB5]/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-[#0ABAB5]" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Valor Total</p>
                <p className="text-lg font-bold text-zinc-800">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Filters */}
        <GlassPanel className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Buscar por cliente ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-zinc-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-white border-zinc-200">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  {Object.entries(QUOTE_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </GlassPanel>

        {/* Quotes Table */}
        <GlassPanel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-600">ID</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-600">Cliente</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-600">Data</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-600">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-zinc-600">Valor</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-zinc-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-zinc-500">
                      {quotes.length === 0 
                        ? 'Nenhum orçamento criado ainda. Clique em "Novo Orçamento" para começar.'
                        : 'Nenhum orçamento encontrado com os filtros aplicados.'}
                    </td>
                  </tr>
                ) : (
                  filteredQuotes.map((quote, index) => (
                    <tr 
                      key={quote.id} 
                      className={cn(
                        "border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors",
                        index % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'
                      )}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-[#006fee]">
                          {quote.publicId}
                        </span>
                        {quote.version > 1 && (
                          <span className="ml-1 text-xs text-zinc-400">v{quote.version}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-zinc-800">{quote.clientName}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600">
                        {format(quote.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex px-2.5 py-1 rounded-full text-xs font-medium text-white",
                          QUOTE_STATUS_COLORS[quote.status]
                        )}>
                          {QUOTE_STATUS_LABELS[quote.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-zinc-800">
                        {formatCurrency(quote.financials.total)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/orcamentos/${quote.id}`)}
                            className="h-8 w-8"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/orcamentos/${quote.id}/editar`)}
                            className="h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/orcamentos/${quote.id}`)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/orcamentos/${quote.id}/editar`)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileDown className="w-4 h-4 mr-2" />
                                Baixar PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      </div>
    </QuotesLayout>
  );
}
