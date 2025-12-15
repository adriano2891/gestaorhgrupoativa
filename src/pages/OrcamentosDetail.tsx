import { useParams, useNavigate } from 'react-router-dom';
import { useQuotes } from '@/contexts/QuotesContext';
import { QuotesLayout } from '@/components/orcamentos/QuotesLayout';
import { GlassPanel } from '@/components/orcamentos/GlassPanel';
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '@/types/quotes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Edit, FileDown, Link, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function OrcamentosDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getQuote } = useQuotes();
  
  const quote = id ? getQuote(id) : undefined;

  if (!quote) {
    return (
      <QuotesLayout>
        <GlassPanel className="p-12 text-center">
          <p className="text-zinc-500">Orçamento não encontrado</p>
          <Button onClick={() => navigate('/orcamentos/lista')} className="mt-4">
            Voltar à lista
          </Button>
        </GlassPanel>
      </QuotesLayout>
    );
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/public/${quote.publicId}`);
    toast.success('Link copiado!');
  };

  return (
    <QuotesLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{quote.publicId}</h1>
            <p className="text-white/80">Versão {quote.version} • {quote.clientName}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/orcamentos/${quote.id}/editar`)}>
              <Edit className="w-4 h-4 mr-2" />Editar
            </Button>
            <Button variant="outline"><FileDown className="w-4 h-4 mr-2" />PDF</Button>
            <Button onClick={handleCopyLink} className="bg-[#006fee] text-white">
              <Link className="w-4 h-4 mr-2" />Link
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <GlassPanel className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Itens</h2>
                <span className={cn("px-3 py-1 rounded-full text-sm text-white", QUOTE_STATUS_COLORS[quote.status])}>
                  {QUOTE_STATUS_LABELS[quote.status]}
                </span>
              </div>
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-zinc-500">
                    <th className="pb-2">Item</th>
                    <th className="pb-2">Qtd</th>
                    <th className="pb-2 text-right">Valor Un.</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map(item => (
                    <tr key={item.id} className="border-b border-zinc-100">
                      <td className="py-3 font-medium">{item.name}</td>
                      <td className="py-3">{item.quantity}</td>
                      <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal</span><span>{formatCurrency(quote.financials.subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Impostos ({quote.financials.taxRate}%)</span>
                  <span>{formatCurrency(quote.financials.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span><span className="text-[#006fee]">{formatCurrency(quote.financials.total)}</span>
                </div>
              </div>
            </GlassPanel>

            {quote.signature && (
              <GlassPanel className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />Assinatura
                </h2>
                <div className="flex items-center gap-4">
                  <img src={quote.signature.dataUrl} alt="Assinatura" className="h-20 border rounded" />
                  <div>
                    <p className="font-medium">{quote.signature.name}</p>
                    <p className="text-sm text-zinc-500">
                      {format(quote.signature.signedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </GlassPanel>
            )}
          </div>

          <GlassPanel className="p-6 h-fit">
            <h2 className="text-lg font-semibold mb-4">Timeline</h2>
            <div className="space-y-4">
              {quote.timeline.map(event => (
                <div key={event.id} className="flex gap-3">
                  <Clock className="w-4 h-4 text-zinc-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium">{event.description}</p>
                    <p className="text-xs text-zinc-500">
                      {format(event.timestamp, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </QuotesLayout>
  );
}
