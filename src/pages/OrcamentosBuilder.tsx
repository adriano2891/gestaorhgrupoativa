import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Trash2, 
  AlertTriangle,
  Save,
  X,
  FileDown
} from 'lucide-react';
import { useQuotes } from '@/contexts/QuotesContext';
import { QuotesLayout } from '@/components/orcamentos/QuotesLayout';
import { GlassPanel } from '@/components/orcamentos/GlassPanel';
import { QuoteItem, QUOTE_STATUS_LABELS, QuoteStatus } from '@/types/quotes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function OrcamentosBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { clients, products, addQuote, getQuote, updateQuote } = useQuotes();
  
  const isEditing = Boolean(id);
  const existingQuote = id ? getQuote(id) : undefined;

  // Form state
  const [clientId, setClientId] = useState(existingQuote?.clientId || '');
  const [validityDays, setValidityDays] = useState(30);
  const [status, setStatus] = useState<QuoteStatus>(existingQuote?.status || 'rascunho');
  const [observations, setObservations] = useState(existingQuote?.observations || '');
  const [taxRate, setTaxRate] = useState(existingQuote?.financials.taxRate || 5);
  const [items, setItems] = useState<QuoteItem[]>(existingQuote?.items || []);
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate if requires approval
  const requiresApproval = items.some(item => item.hasExcessiveDiscount);

  // Filtered products for search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const addItem = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Check if already added
    if (items.some(item => item.productId === productId)) {
      toast.info('Este item já foi adicionado ao orçamento');
      return;
    }

    const newItem: QuoteItem = {
      id: `item-${Date.now()}`,
      productId: product.id,
      name: product.name,
      description: product.description,
      quantity: 1,
      basePrice: product.basePrice,
      unitPrice: product.basePrice,
      total: product.basePrice,
      imageUrl: product.imageUrl,
      hasExcessiveDiscount: false,
    };

    setItems([...items, newItem]);
    setSearchTerm('');
  };

  const updateItem = (itemId: string, field: 'quantity' | 'unitPrice', value: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const quantity = field === 'quantity' ? value : item.quantity;
        const unitPrice = field === 'unitPrice' ? value : item.unitPrice;
        const hasExcessiveDiscount = unitPrice < (item.basePrice * 0.9);
        
        return {
          ...item,
          quantity,
          unitPrice,
          total: quantity * unitPrice,
          hasExcessiveDiscount,
        };
      }
      return item;
    }));
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleSave = () => {
    if (!clientId) {
      toast.error('Selecione um cliente');
      return;
    }
    if (items.length === 0) {
      toast.error('Adicione pelo menos um item ao orçamento');
      return;
    }

    if (isEditing && existingQuote) {
      updateQuote(existingQuote.id, {
        clientId,
        clientName: clients.find(c => c.id === clientId)?.name || '',
        items,
        status: requiresApproval ? 'aprovacao_interna' : status,
        observations,
        financials: {
          subtotal,
          taxRate,
          taxAmount,
          fees: 0,
          total,
        },
      });
      toast.success('Orçamento atualizado com sucesso');
    } else {
      addQuote({
        clientId,
        validityDays,
        items: items.map(({ id, total, hasExcessiveDiscount, ...rest }) => rest),
        observations,
        taxRate,
      });
      toast.success(requiresApproval 
        ? 'Orçamento criado e enviado para aprovação interna' 
        : 'Orçamento criado com sucesso'
      );
    }
    navigate('/orcamentos/lista');
  };

  return (
    <QuotesLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isEditing ? 'Editar Orçamento' : 'Novo Orçamento'}
            </h1>
            <p className="text-white/80">
              {isEditing ? `Editando ${existingQuote?.publicId}` : 'Crie uma nova proposta comercial'}
            </p>
          </div>
          {requiresApproval && (
            <div className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">Requer aprovação interna</span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            <GlassPanel className="p-6">
              <h2 className="text-lg font-semibold text-zinc-800 mb-4">Configurações</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="client">Cliente *</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger className="mt-1 bg-white">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="validity">Validade (dias)</Label>
                  <Input
                    id="validity"
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    className="mt-1 bg-white"
                    min={1}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={requiresApproval ? 'aprovacao_interna' : status} 
                    onValueChange={(v) => setStatus(v as QuoteStatus)}
                    disabled={requiresApproval}
                  >
                    <SelectTrigger className="mt-1 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(QUOTE_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {requiresApproval && (
                    <p className="text-xs text-orange-600 mt-1">
                      Status travado devido a desconto excessivo
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="tax">Taxa de Impostos (%)</Label>
                  <Input
                    id="tax"
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="mt-1 bg-white"
                    min={0}
                    max={100}
                  />
                </div>

                <div>
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="mt-1 bg-white"
                    rows={3}
                    placeholder="Notas adicionais para o orçamento..."
                  />
                </div>
              </div>
            </GlassPanel>

            {/* Product Search */}
            <GlassPanel className="p-6">
              <h2 className="text-lg font-semibold text-zinc-800 mb-4">Adicionar Itens</h2>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>

              {searchTerm && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-4">
                      Nenhum produto encontrado
                    </p>
                  ) : (
                    filteredProducts.map(product => (
                      <button
                        key={product.id}
                        onClick={() => addItem(product.id)}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-100 transition-colors text-left"
                      >
                        <div>
                          <p className="font-medium text-zinc-800">{product.name}</p>
                          <p className="text-sm text-zinc-500">{product.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-600">
                            {formatCurrency(product.basePrice)}
                          </span>
                          <Plus className="w-4 h-4 text-[#006fee]" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </GlassPanel>
          </div>

          {/* Right Column - Items */}
          <div className="space-y-6">
            <GlassPanel className="p-6">
              <h2 className="text-lg font-semibold text-zinc-800 mb-4">
                Itens do Orçamento ({items.length})
              </h2>

              {items.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <p>Nenhum item adicionado</p>
                  <p className="text-sm">Busque e adicione produtos à esquerda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map(item => (
                    <div 
                      key={item.id}
                      className={cn(
                        "p-4 rounded-lg border transition-all",
                        item.hasExcessiveDiscount 
                          ? "border-orange-300 bg-orange-50" 
                          : "border-zinc-200 bg-zinc-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-zinc-800">{item.name}</p>
                            {item.hasExcessiveDiscount && (
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                          <p className="text-sm text-zinc-500 mb-3">{item.description}</p>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Quantidade</Label>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                                className="mt-1 bg-white"
                                min={1}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">
                                Preço Un. (Base: {formatCurrency(item.basePrice)})
                              </Label>
                              <Input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                                className={cn(
                                  "mt-1",
                                  item.hasExcessiveDiscount 
                                    ? "border-orange-300 bg-orange-50" 
                                    : "bg-white"
                                )}
                                min={0}
                                step={0.01}
                              />
                            </div>
                          </div>

                          {item.hasExcessiveDiscount && (
                            <p className="text-xs text-orange-600 mt-2">
                              ⚠️ Desconto acima de 10% - requer aprovação
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <p className="text-lg font-bold text-zinc-800">
                            {formatCurrency(item.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassPanel>

            {/* Financial Summary */}
            <GlassPanel className="p-6">
              <h2 className="text-lg font-semibold text-zinc-800 mb-4">Resumo Financeiro</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Impostos ({taxRate}%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="border-t border-zinc-200 pt-3 flex justify-between">
                  <span className="text-lg font-bold text-zinc-800">Total</span>
                  <span className="text-lg font-bold text-[#006fee]">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => navigate('/orcamentos/lista')}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={items.length === 0}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-[#006fee] hover:bg-[#0058c4] text-white"
                  disabled={!clientId || items.length === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {requiresApproval ? 'Solicitar Aprovação' : 'Salvar'}
                </Button>
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    </QuotesLayout>
  );
}
