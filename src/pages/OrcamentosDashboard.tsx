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
import { downloadQuotePDF } from '@/utils/quotePdfGenerator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Quote } from '@/types/quotes';
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

  const handleDownloadPdf = async (quote: Quote) => {
    try {
      toast.info('Gerando PDF...');
      let enrichedQuote = { ...quote };
      if (!quote.clientCnpj && quote.clientId) {
        const { data: clientData } = await supabase
          .from('clientes_orcamentos')
          .select('cnpj, nome_sindico, telefone, email')
          .eq('id', quote.clientId)
          .single();
        if (clientData) {
          enrichedQuote = {
            ...enrichedQuote,
            clientCnpj: clientData.cnpj || undefined,
            clientSindico: enrichedQuote.clientSindico || clientData.nome_sindico || undefined,
            clientPhone: enrichedQuote.clientPhone || clientData.telefone || undefined,
            clientEmail: enrichedQuote.clientEmail || clientData.email || undefined,
          };
        }
      }
      await downloadQuotePDF(enrichedQuote);
      toast.success('PDF baixado com sucesso');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  return (
    <QuotesLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-primary rounded-xl p-4 shadow-md">
          <div>
            <h1 className="text-2xl font-bold text-primary-foreground">Gestão de Orçamentos</h1>
            <p className="text-primary-foreground/70">Gerencie suas propostas comerciais</p>
          </div>
          <Button 
            onClick={() => navigate('/orcamentos/novo')}
            className="bg-foreground hover:bg-foreground/90 text-background shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Orçamento
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassPanel className="p-4 bg-card border-2 border-primary">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-foreground">{totalQuotes}</p>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-4 bg-card border-2 border-primary">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Clock className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-xl font-bold text-foreground">{pendingQuotes}</p>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-4 bg-card border-2 border-primary">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aprovados</p>
                <p className="text-xl font-bold text-foreground">{approvedQuotes}</p>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-4 bg-card border-2 border-primary">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Filters */}
        <GlassPanel className="p-4 bg-card border border-border">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-background border-border">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
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
        <GlassPanel className="overflow-hidden bg-card border border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary/10 border-b border-primary/30">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">ID</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Cliente</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Data</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-foreground">Valor</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
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
                        "border-b border-border hover:bg-primary/5 transition-colors",
                        index % 2 === 0 ? 'bg-card' : 'bg-muted/30'
                      )}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-primary">
                          {quote.publicId}
                        </span>
                        {quote.version > 1 && (
                          <span className="ml-1 text-xs text-muted-foreground">v{quote.version}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-foreground">{quote.clientName}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
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
                      <td className="px-6 py-4 text-right font-medium text-black">
                        {formatCurrency(quote.financials.total)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/orcamentos/${quote.id}`)}
                            className="h-8 w-8 hover:bg-[#3EE0CF]/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/orcamentos/${quote.id}/editar`)}
                            className="h-8 w-8 hover:bg-[#3EE0CF]/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#3EE0CF]/10">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border border-black/10">
                              <DropdownMenuItem onClick={() => navigate(`/orcamentos/${quote.id}`)} className="hover:bg-[#3EE0CF]/10">
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/orcamentos/${quote.id}/editar`)} className="hover:bg-[#3EE0CF]/10">
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPdf(quote)} className="hover:bg-[#3EE0CF]/10">
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
