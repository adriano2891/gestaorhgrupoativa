import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  FileDown, 
  MoreVertical,
  Trash2,
  Link,
  CheckCircle,
  XCircle,
  Lock
} from 'lucide-react';
import { useQuotes } from '@/contexts/QuotesContext';
import { QuotesLayout } from '@/components/orcamentos/QuotesLayout';
import { GlassPanel } from '@/components/orcamentos/GlassPanel';
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '@/types/quotes';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { downloadQuotePDF } from '@/utils/quotePdfGenerator';
import type { Quote } from '@/types/quotes';

export default function OrcamentosLista() {
  const navigate = useNavigate();
  const { quotes, deleteQuote, approveQuote, rejectQuote, updateQuote } = useQuotes();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);

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

  const handleDelete = () => {
    if (quoteToDelete) {
      deleteQuote(quoteToDelete);
      toast.success('Orçamento excluído com sucesso');
      setQuoteToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleApprove = (id: string) => {
    approveQuote(id);
    toast.success('Orçamento aprovado com sucesso');
  };

  const handleReject = (id: string) => {
    rejectQuote(id);
    toast.success('Orçamento rejeitado');
  };

  const handleCopyLink = (publicId: string) => {
    const link = `${window.location.origin}/public/${publicId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência');
  };

  const handleStatusChange = (quoteId: string, newStatus: string) => {
    updateQuote(quoteId, { status: newStatus as any });
    toast.success(`Status alterado para "${QUOTE_STATUS_LABELS[newStatus as keyof typeof QUOTE_STATUS_LABELS]}"`);
  };

  const handleDownloadPdf = async (quote: Quote) => {
    try {
      toast.info('Gerando PDF...');
      await downloadQuotePDF(quote);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Lista de Orçamentos</h1>
            <p className="text-white/80">{filteredQuotes.length} orçamento(s) encontrado(s)</p>
          </div>
          <Button 
            onClick={() => navigate('/orcamentos/novo')}
            className="bg-[#3EE0CF] hover:bg-[#35c9ba] text-black shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Orçamento
          </Button>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-white border-zinc-200">
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
        </GlassPanel>

        {/* Quotes Table */}
        <GlassPanel className="overflow-hidden">
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full min-w-[700px]">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-zinc-600">ID</th>
                  <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-zinc-600">Cliente</th>
                  <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-zinc-600 hidden md:table-cell">Criado</th>
                  <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-zinc-600 hidden lg:table-cell">Validade</th>
                  <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-zinc-600">Status</th>
                  <th className="text-right px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-zinc-600">Valor</th>
                  <th className="text-center px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-zinc-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-zinc-500">
                      {quotes.length === 0 
                        ? 'Nenhum orçamento criado ainda.'
                        : 'Nenhum orçamento encontrado.'}
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
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <span className="font-mono text-xs sm:text-sm font-medium text-[#3EE0CF]">
                          {quote.publicId}
                        </span>
                        {quote.version > 1 && (
                          <span className="ml-1 text-[10px] sm:text-xs text-zinc-400">v{quote.version}</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <span className="font-medium text-zinc-800 text-xs sm:text-sm truncate block max-w-[120px] sm:max-w-none">{quote.clientName}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-zinc-600 hidden md:table-cell">
                        {format(quote.createdAt, "dd/MM/yy", { locale: ptBR })}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-zinc-600 hidden lg:table-cell">
                        {format(quote.validUntil, "dd/MM/yy", { locale: ptBR })}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <Select 
                          value={quote.status} 
                          onValueChange={(value) => handleStatusChange(quote.id, value)}
                          disabled={quote.status === 'assinado'}
                        >
                          <SelectTrigger className={cn(
                            "w-[100px] sm:w-[140px] h-7 sm:h-8 text-[10px] sm:text-xs font-medium text-white border-0",
                            QUOTE_STATUS_COLORS[quote.status]
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(QUOTE_STATUS_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "w-2 h-2 rounded-full",
                                    QUOTE_STATUS_COLORS[value as keyof typeof QUOTE_STATUS_COLORS]
                                  )} />
                                  <span className="text-xs">{label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right font-medium text-zinc-800 text-xs sm:text-sm">
                        {formatCurrency(quote.financials.total)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/orcamentos/${quote.id}`)}
                            className="h-8 w-8"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/orcamentos/${quote.id}/editar`)}
                            className="h-8 w-8"
                            title={quote.status === 'assinado' ? 'Bloqueado - Assinado' : 'Editar'}
                            disabled={quote.status === 'assinado'}
                          >
                            {quote.status === 'assinado' ? <Lock className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setQuoteToDelete(quote.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
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
                              {quote.status !== 'assinado' && (
                                <DropdownMenuItem onClick={() => navigate(`/orcamentos/${quote.id}/editar`)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onSelect={() => {
                                setTimeout(() => handleDownloadPdf(quote), 100);
                              }}>
                                <FileDown className="w-4 h-4 mr-2" />
                                Baixar PDF
                              </DropdownMenuItem>
                              {quote.status !== 'aprovacao_interna' && (
                                <DropdownMenuItem onClick={() => handleCopyLink(quote.publicId)}>
                                  <Link className="w-4 h-4 mr-2" />
                                  Copiar Link Público
                                </DropdownMenuItem>
                              )}
                              {quote.status === 'aprovacao_interna' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleApprove(quote.id)}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Aprovar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleReject(quote.id)}
                                    className="text-red-600"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Rejeitar
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => {
                                  setQuoteToDelete(quote.id);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </QuotesLayout>
  );
}
