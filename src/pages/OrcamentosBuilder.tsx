import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Trash2, 
  AlertTriangle,
  Save,
  X,
  FileDown,
  Package,
  ImageOff,
  UserPlus,
  Eye,
  Download
} from 'lucide-react';
import { useQuotes } from '@/contexts/QuotesContext';
import { useItensOrcamento } from '@/hooks/useItensOrcamento';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { downloadQuotePDF, previewQuotePDF } from '@/utils/quotePdfGenerator';
import { useClientesOrcamentos } from '@/hooks/useClientesOrcamentos';

export default function OrcamentosBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { products, addQuote, getQuote, updateQuote } = useQuotes();
  const { itens: dbItens, isLoading: isLoadingItens } = useItensOrcamento();
  const { clientes, isLoading: isLoadingClientes } = useClientesOrcamentos();
  
  const isEditing = Boolean(id);
  const existingQuote = id ? getQuote(id) : undefined;

  // Check if a client was just created and passed via navigation state
  const selectedClientFromNav = (location.state as any)?.selectedClientId || '';

  // Form state
  const [clientId, setClientId] = useState(existingQuote?.clientId || selectedClientFromNav);
  const [validityDays, setValidityDays] = useState(30);
  const [status, setStatus] = useState<QuoteStatus>(existingQuote?.status || 'rascunho');
  const [observations, setObservations] = useState(existingQuote?.observations || '');
  const [taxRate, setTaxRate] = useState(existingQuote?.financials.taxRate || 5);
  const [items, setItems] = useState<QuoteItem[]>(existingQuote?.items || []);
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate if requires approval
  const requiresApproval = items.some(item => item.hasExcessiveDiscount);

  // Filter active items from database
  const activeDbItens = dbItens?.filter(item => item.ativo) || [];
  
  // Filtered items based on search term
  const filteredDbItens = activeDbItens.filter(item => 
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.descricao?.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const addItemFromDb = (dbItem: typeof dbItens[0]) => {
    // Check if already added
    if (items.some(item => item.productId === dbItem.id)) {
      toast.info('Este item já foi adicionado ao orçamento');
      return;
    }

    const newItem: QuoteItem = {
      id: `item-${Date.now()}`,
      productId: dbItem.id,
      name: dbItem.nome,
      description: dbItem.descricao || '',
      quantity: 1,
      basePrice: dbItem.preco_base,
      unitPrice: dbItem.preco_base,
      total: dbItem.preco_base,
      imageUrl: dbItem.imagem_url || undefined,
      hasExcessiveDiscount: false,
    };

    setItems([...items, newItem]);
    toast.success(`${dbItem.nome} adicionado ao orçamento`);
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
        clientName: clientes.find(c => c.id === clientId)?.nome_condominio || '',
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
      const selectedClient = clientes.find(c => c.id === clientId);
      addQuote({
        clientId,
        clientName: selectedClient?.nome_condominio || 'Cliente Desconhecido',
        clientEmail: selectedClient?.email,
        clientPhone: selectedClient?.telefone || undefined,
        clientAddress: selectedClient ? [selectedClient.rua, selectedClient.numero, selectedClient.bairro, selectedClient.cidade, selectedClient.estado, selectedClient.cep].filter(Boolean).join(', ') : undefined,
        clientSindico: selectedClient?.nome_sindico || undefined,
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

  // Generate PDF data for preview/download
  const generatePdfData = () => {
    const selectedClient = clientes.find(c => c.id === clientId);
    return {
      publicId: existingQuote?.publicId || quotesContext.generatePublicId(),
      version: existingQuote?.version || 1,
      clientName: selectedClient?.nome_condominio || 'Cliente não selecionado',
      clientEmail: selectedClient?.email,
      clientPhone: selectedClient?.telefone || undefined,
      clientAddress: selectedClient ? [selectedClient.rua, selectedClient.numero, selectedClient.bairro, selectedClient.cidade, selectedClient.estado, selectedClient.cep].filter(Boolean).join(', ') : undefined,
      clientCnpj: selectedClient?.cnpj || undefined,
      clientSindico: selectedClient?.nome_sindico || undefined,
      createdAt: existingQuote?.createdAt || new Date(),
      validUntil: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000),
      items,
      financials: {
        subtotal,
        taxRate,
        taxAmount,
        fees: 0,
        total,
      },
      observations,
      signature: existingQuote?.signature,
    };
  };

  const handlePreviewPdf = async () => {
    if (items.length === 0) {
      toast.error('Adicione pelo menos um item para visualizar o PDF');
      return;
    }
    toast.info('Gerando PDF com imagens...');
    await previewQuotePDF(generatePdfData());
    toast.success('PDF aberto em nova aba');
  };

  const handleDownloadPdf = async () => {
    if (items.length === 0) {
      toast.error('Adicione pelo menos um item para baixar o PDF');
      return;
    }
    toast.info('Gerando PDF com imagens...');
    await downloadQuotePDF(generatePdfData());
    toast.success('PDF baixado com sucesso');
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
                  <Label htmlFor="client" className="text-zinc-800">Cliente *</Label>
                  <div className="flex gap-2 mt-1">
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger className="bg-white flex-1">
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map(cliente => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nome_condominio} - {cliente.nome_sindico}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={() => navigate('/orcamentos/clientes/novo')}
                      className="bg-[#3EE0CF] hover:bg-[#35c9ba] text-black shrink-0"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Adicionar Cliente
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="validity" className="text-zinc-800">Validade (dias)</Label>
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
                  <Label htmlFor="status" className="text-zinc-800">Status</Label>
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
                  <Label htmlFor="tax" className="text-zinc-800">Taxa de Impostos (%)</Label>
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
                  <Label htmlFor="observations" className="text-zinc-800">Observações</Label>
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

            {/* Product Catalog */}
            <GlassPanel className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-800">Adicionar Itens</h2>
                <span className="text-sm text-zinc-500">
                  {activeDbItens.length} produto{activeDbItens.length !== 1 ? 's' : ''} disponível{activeDbItens.length !== 1 ? 'is' : ''}
                </span>
              </div>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>

              {isLoadingItens ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3EE0CF]"></div>
                </div>
              ) : filteredDbItens.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-zinc-300" />
                  <p className="font-medium">Nenhum produto encontrado</p>
                  <p className="text-sm">
                    {searchTerm ? 'Tente outro termo de busca' : 'Cadastre produtos na aba "Cadastrar Itens"'}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[320px] pr-4">
                  <div className="grid grid-cols-1 gap-3">
                    {filteredDbItens.map(item => {
                      const isAdded = items.some(i => i.productId === item.id);
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center gap-4 p-3 rounded-xl border transition-all",
                            isAdded 
                              ? "border-green-200 bg-green-50" 
                              : "border-zinc-200 bg-white hover:border-[#3EE0CF]/30 hover:shadow-sm"
                          )}
                        >
                          {/* Product Image */}
                          <div className="w-16 h-16 rounded-lg bg-zinc-100 overflow-hidden flex-shrink-0 border border-zinc-200">
                            {item.imagem_url ? (
                              <img 
                                src={item.imagem_url} 
                                alt={item.nome}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageOff className="w-6 h-6 text-zinc-300" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-zinc-800 truncate">{item.nome}</p>
                            {item.descricao && (
                              <p className="text-sm text-zinc-500 truncate">{item.descricao}</p>
                            )}
                            {item.categoria && (
                              <span className="inline-block text-xs px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full mt-1">
                                {item.categoria}
                              </span>
                            )}
                          </div>

                          {/* Price & Add Button */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <span className="text-sm font-semibold text-zinc-700">
                              {formatCurrency(item.preco_base)}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => addItemFromDb(item)}
                              disabled={isAdded}
                              className={cn(
                                "h-8 px-3",
                                isAdded 
                                  ? "bg-green-500 text-white cursor-default" 
                                  : "bg-[#3EE0CF] hover:bg-[#35c9ba] text-black"
                              )}
                            >
                              {isAdded ? (
                                <>✓ Adicionado</>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4 mr-1" />
                                  Adicionar
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
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
                  <span className="text-lg font-bold text-[#3EE0CF]">{formatCurrency(total)}</span>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1"
                      disabled={items.length === 0}
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-48">
                    <DropdownMenuItem onClick={handlePreviewPdf} className="cursor-pointer">
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownloadPdf} className="cursor-pointer">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-[#3EE0CF] hover:bg-[#35c9ba] text-black"
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
