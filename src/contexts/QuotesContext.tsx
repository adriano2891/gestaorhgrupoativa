import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Quote, QuoteStatus, Client, Product, QuoteInput, QuoteItem, QuoteTimelineEvent } from '@/types/quotes';

interface QuotesContextType {
  quotes: Quote[];
  clients: Client[];
  products: Product[];
  loading: boolean;
  addQuote: (input: QuoteInput) => Quote;
  updateQuote: (id: string, updates: Partial<Quote>) => void;
  getQuote: (id: string) => Quote | undefined;
  getQuoteByPublicId: (publicId: string) => Quote | undefined;
  deleteQuote: (id: string) => void;
  signQuote: (id: string, name: string, signatureDataUrl: string) => void;
  approveQuote: (id: string) => void;
  rejectQuote: (id: string) => void;
}

const QuotesContext = createContext<QuotesContextType | undefined>(undefined);

// Sample data
const SAMPLE_CLIENTS: Client[] = [
  { id: '1', name: 'Tech Solutions Ltda', email: 'contato@techsolutions.com', company: 'Tech Solutions' },
  { id: '2', name: 'Comércio Brasil SA', email: 'vendas@comerciobrasil.com', company: 'Comércio Brasil' },
  { id: '3', name: 'Indústria ABC', email: 'compras@industriaabc.com', company: 'Indústria ABC' },
  { id: '4', name: 'Serviços Express', email: 'admin@servicosexpress.com', company: 'Serviços Express' },
];

const SAMPLE_PRODUCTS: Product[] = [
  { id: '1', name: 'Consultoria Empresarial', description: 'Serviço de consultoria estratégica', basePrice: 5000, category: 'Serviços' },
  { id: '2', name: 'Sistema ERP Básico', description: 'Licença anual do sistema ERP', basePrice: 12000, category: 'Software' },
  { id: '3', name: 'Treinamento Equipe', description: 'Treinamento presencial para equipe', basePrice: 3500, category: 'Treinamento' },
  { id: '4', name: 'Suporte Premium', description: 'Suporte técnico 24/7 por 12 meses', basePrice: 8000, category: 'Suporte' },
  { id: '5', name: 'Integração API', description: 'Desenvolvimento de integrações customizadas', basePrice: 15000, category: 'Desenvolvimento' },
  { id: '6', name: 'Auditoria de Sistemas', description: 'Análise completa de infraestrutura', basePrice: 7500, category: 'Serviços' },
];

const STORAGE_KEY = 'ativa_quotes';

export function QuotesProvider({ children }: { children: ReactNode }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setQuotes(parsed.map((q: Quote) => ({
          ...q,
          validUntil: new Date(q.validUntil),
          createdAt: new Date(q.createdAt),
          updatedAt: new Date(q.updatedAt),
          timeline: q.timeline.map((t: QuoteTimelineEvent) => ({ ...t, timestamp: new Date(t.timestamp) })),
          signature: q.signature ? { ...q.signature, signedAt: new Date(q.signature.signedAt) } : undefined,
        })));
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
    }
    setLoading(false);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.error('LocalStorage quota exceeded, clearing old data');
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, [quotes, loading]);

  const generatePublicId = () => {
    const year = new Date().getFullYear();
    const prefix = `QT-${year}-`;
    // Find the highest existing number for this year
    let maxNumber = 0;
    quotes.forEach(q => {
      if (q.publicId.startsWith(prefix)) {
        const num = parseInt(q.publicId.replace(prefix, ''), 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    });
    return `${prefix}${String(maxNumber + 1).padStart(4, '0')}`;
  };

  const calculateFinancials = (items: QuoteItem[], taxRate: number = 5, fees: number = 0) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * (taxRate / 100);
    return {
      subtotal,
      taxRate,
      taxAmount,
      fees,
      total: subtotal + taxAmount + fees,
    };
  };

  const checkRequiresApproval = (items: QuoteItem[]) => {
    return items.some(item => item.hasExcessiveDiscount);
  };

  const addQuote = (input: QuoteInput): Quote => {
    const items: QuoteItem[] = input.items.map((item, index) => {
      const hasExcessiveDiscount = item.unitPrice < (item.basePrice * 0.9);
      return {
        ...item,
        id: `item-${Date.now()}-${index}`,
        total: item.quantity * item.unitPrice,
        hasExcessiveDiscount,
      };
    });

    const requiresApproval = checkRequiresApproval(items);
    
    const newQuote: Quote = {
      id: `quote-${Date.now()}`,
      publicId: generatePublicId(),
      version: 1,
      clientId: input.clientId,
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      clientPhone: input.clientPhone,
      clientAddress: input.clientAddress,
      clientCnpj: input.clientCnpj,
      clientSindico: input.clientSindico,
      validUntil: new Date(Date.now() + input.validityDays * 24 * 60 * 60 * 1000),
      items,
      financials: calculateFinancials(items, input.taxRate || 5, input.fees || 0),
      status: requiresApproval ? 'aprovacao_interna' : 'rascunho',
      requiresApproval,
      timeline: [{
        id: `event-${Date.now()}`,
        action: 'created',
        description: 'Orçamento criado',
        timestamp: new Date(),
      }],
      observations: input.observations,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setQuotes(prev => [...prev, newQuote]);
    return newQuote;
  };

  const updateQuote = (id: string, updates: Partial<Quote>) => {
    setQuotes(prev => prev.map(q => {
      if (q.id === id) {
        const updated = { ...q, ...updates, updatedAt: new Date() };
        
        // Recalculate if items changed
        if (updates.items) {
          updated.financials = calculateFinancials(updates.items, q.financials.taxRate, q.financials.fees);
          updated.requiresApproval = checkRequiresApproval(updates.items);
        }
        
        return updated;
      }
      return q;
    }));
  };

  const getQuote = (id: string) => quotes.find(q => q.id === id);
  
  const getQuoteByPublicId = (publicId: string) => quotes.find(q => q.publicId === publicId);

  const deleteQuote = (id: string) => {
    setQuotes(prev => prev.filter(q => q.id !== id));
  };

  const signQuote = (id: string, name: string, signatureDataUrl: string) => {
    setQuotes(prev => prev.map(q => {
      if (q.id === id) {
        return {
          ...q,
          status: 'assinado' as QuoteStatus,
          signature: {
            name,
            dataUrl: signatureDataUrl,
            signedAt: new Date(),
            ipAddress: '0.0.0.0', // In production, get from server
          },
          timeline: [...q.timeline, {
            id: `event-${Date.now()}`,
            action: 'signed',
            description: `Orçamento assinado por ${name}`,
            timestamp: new Date(),
          }],
          updatedAt: new Date(),
        };
      }
      return q;
    }));
  };

  const approveQuote = (id: string) => {
    setQuotes(prev => prev.map(q => {
      if (q.id === id) {
        return {
          ...q,
          status: 'aprovado' as QuoteStatus,
          timeline: [...q.timeline, {
            id: `event-${Date.now()}`,
            action: 'approved',
            description: 'Orçamento aprovado internamente',
            timestamp: new Date(),
          }],
          updatedAt: new Date(),
        };
      }
      return q;
    }));
  };

  const rejectQuote = (id: string) => {
    setQuotes(prev => prev.map(q => {
      if (q.id === id) {
        return {
          ...q,
          status: 'rejeitado' as QuoteStatus,
          timeline: [...q.timeline, {
            id: `event-${Date.now()}`,
            action: 'rejected',
            description: 'Orçamento rejeitado',
            timestamp: new Date(),
          }],
          updatedAt: new Date(),
        };
      }
      return q;
    }));
  };

  return (
    <QuotesContext.Provider value={{
      quotes,
      clients: SAMPLE_CLIENTS,
      products: SAMPLE_PRODUCTS,
      loading,
      addQuote,
      updateQuote,
      getQuote,
      getQuoteByPublicId,
      deleteQuote,
      signQuote,
      approveQuote,
      rejectQuote,
    }}>
      {children}
    </QuotesContext.Provider>
  );
}

export function useQuotes() {
  const context = useContext(QuotesContext);
  if (!context) {
    throw new Error('useQuotes must be used within a QuotesProvider');
  }
  return context;
}
