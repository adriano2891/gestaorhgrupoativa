// Quote Status Enum
export type QuoteStatus = 
  | 'rascunho'
  | 'primeiro_contato'
  | 'segundo_contato'
  | 'visita'
  | 'analise_cliente'
  | 'aprovacao_interna'
  | 'aprovado'
  | 'rejeitado'
  | 'implantacao'
  | 'assinado'
  | 'expirado';

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  rascunho: 'Rascunho',
  primeiro_contato: 'Primeiro Contato',
  segundo_contato: 'Segundo Contato',
  visita: 'Visita',
  analise_cliente: 'Análise pelo Cliente',
  aprovacao_interna: 'Aprovação Interna',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  implantacao: 'Em Implantação',
  assinado: 'Assinado',
  expirado: 'Expirado',
};

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  rascunho: 'bg-gray-500',
  primeiro_contato: 'bg-blue-400',
  segundo_contato: 'bg-blue-500',
  visita: 'bg-purple-500',
  analise_cliente: 'bg-yellow-500',
  aprovacao_interna: 'bg-orange-500',
  aprovado: 'bg-green-500',
  rejeitado: 'bg-red-500',
  implantacao: 'bg-teal-500',
  assinado: 'bg-emerald-600',
  expirado: 'bg-gray-400',
};

// Quote Item
export interface QuoteItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  quantity: number;
  basePrice: number;
  unitPrice: number;
  total: number;
  imageUrl?: string;
  hasExcessiveDiscount?: boolean;
}

// Quote Financials
export interface QuoteFinancials {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  fees: number;
  total: number;
}

// Timeline Event
export interface QuoteTimelineEvent {
  id: string;
  action: string;
  description: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
}

// Signature
export interface QuoteSignature {
  name: string;
  dataUrl: string;
  signedAt: Date;
  ipAddress: string;
}

// Client
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

// Product (for item catalog)
export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl?: string;
  category?: string;
}

// Main Quote Object
export interface Quote {
  id: string;
  publicId: string;
  version: number;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientCnpj?: string;
  clientSindico?: string;
  validUntil: Date;
  items: QuoteItem[];
  financials: QuoteFinancials;
  status: QuoteStatus;
  requiresApproval: boolean;
  timeline: QuoteTimelineEvent[];
  signature?: QuoteSignature;
  observations?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// Quote creation/update input
export interface QuoteInput {
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientCnpj?: string;
  clientSindico?: string;
  validityDays: number;
  items: Omit<QuoteItem, 'id' | 'total' | 'hasExcessiveDiscount'>[];
  observations?: string;
  taxRate?: number;
  fees?: number;
}
