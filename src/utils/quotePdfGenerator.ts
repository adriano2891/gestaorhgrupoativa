import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote, QuoteItem } from '@/types/quotes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Company info - can be customized
const COMPANY_INFO = {
  name: 'GRUPO ATIVA',
  cnpj: '00.000.000/0001-00',
  address: 'Rua Exemplo, 123 - Centro',
  city: 'São Paulo - SP',
  phone: '(11) 1234-5678',
  email: 'contato@grupoativa.com.br',
};

interface QuoteDataForPdf {
  publicId: string;
  version: number;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  createdAt: Date;
  validUntil: Date;
  items: QuoteItem[];
  financials: {
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    fees: number;
    total: number;
  };
  observations?: string;
  signature?: {
    name: string;
    signedAt: Date;
  };
}

export function generateQuotePDF(quote: Quote | QuoteDataForPdf): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Colors
  const primaryColor: [number, number, number] = [0, 111, 238];
  const tealColor: [number, number, number] = [62, 224, 207];
  const darkGray: [number, number, number] = [60, 60, 60];
  const lightGray: [number, number, number] = [120, 120, 120];

  // Header with gradient effect
  doc.setFillColor(...tealColor);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Company Logo area
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 8, 50, 28, 3, 3, 'F');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.name, margin + 25, 22, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Soluções Empresariais', margin + 25, 30, { align: 'center' });

  // Quote title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ORÇAMENTO', pageWidth - margin, 20, { align: 'right' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.publicId, pageWidth - margin, 30, { align: 'right' });
  doc.text(`Versão ${quote.version}`, pageWidth - margin, 38, { align: 'right' });

  // Company info box
  let y = 55;
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, y, (pageWidth - margin * 2) / 2 - 5, 35, 2, 2, 'F');
  
  doc.setTextColor(...darkGray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DA EMPRESA', margin + 5, y + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(COMPANY_INFO.name, margin + 5, y + 15);
  doc.text(`CNPJ: ${COMPANY_INFO.cnpj}`, margin + 5, y + 21);
  doc.text(COMPANY_INFO.address, margin + 5, y + 27);
  doc.text(`${COMPANY_INFO.city} | ${COMPANY_INFO.phone}`, margin + 5, y + 33);

  // Client info box
  const clientBoxX = pageWidth / 2 + 5;
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(clientBoxX, y, (pageWidth - margin * 2) / 2 - 5, 35, 2, 2, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO CLIENTE', clientBoxX + 5, y + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(quote.clientName, clientBoxX + 5, y + 15);
  if ('clientEmail' in quote && quote.clientEmail) {
    doc.text(quote.clientEmail, clientBoxX + 5, y + 21);
  }
  if ('clientPhone' in quote && quote.clientPhone) {
    doc.text(quote.clientPhone, clientBoxX + 5, y + 27);
  }

  // Date info
  y += 42;
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 12, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  const createdDate = quote.createdAt instanceof Date ? quote.createdAt : new Date(quote.createdAt);
  const validUntilDate = quote.validUntil instanceof Date ? quote.validUntil : new Date(quote.validUntil);
  
  doc.text(`Data de Emissão: ${format(createdDate, "dd/MM/yyyy", { locale: ptBR })}`, margin + 5, y + 8);
  doc.text(`Válido até: ${format(validUntilDate, "dd/MM/yyyy", { locale: ptBR })}`, pageWidth - margin - 5, y + 8, { align: 'right' });

  // Items table
  y += 20;
  const tableData = quote.items.map((item, idx) => [
    (idx + 1).toString(),
    item.name,
    item.description ? item.description.substring(0, 35) + (item.description.length > 35 ? '...' : '') : '-',
    item.quantity.toString(),
    formatCurrency(item.unitPrice),
    formatCurrency(item.total),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Item', 'Descrição', 'Qtd', 'Valor Un.', 'Total']],
    body: tableData,
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 40 },
      2: { cellWidth: 55 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
    },
    theme: 'grid',
  });

  // Financial Summary
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  
  // Summary box
  const summaryBoxWidth = 80;
  const summaryBoxX = pageWidth - margin - summaryBoxWidth;
  
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(summaryBoxX, finalY, summaryBoxWidth, 45, 2, 2, 'F');
  
  doc.setTextColor(...darkGray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Subtotal:', summaryBoxX + 5, finalY + 10);
  doc.text(formatCurrency(quote.financials.subtotal), summaryBoxX + summaryBoxWidth - 5, finalY + 10, { align: 'right' });
  
  doc.text(`Impostos (${quote.financials.taxRate}%):`, summaryBoxX + 5, finalY + 20);
  doc.text(formatCurrency(quote.financials.taxAmount), summaryBoxX + summaryBoxWidth - 5, finalY + 20, { align: 'right' });
  
  // Total highlight
  doc.setFillColor(...primaryColor);
  doc.roundedRect(summaryBoxX, finalY + 28, summaryBoxWidth, 14, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', summaryBoxX + 5, finalY + 38);
  doc.text(formatCurrency(quote.financials.total), summaryBoxX + summaryBoxWidth - 5, finalY + 38, { align: 'right' });

  // Observations
  let obsEndY = finalY;
  if (quote.observations) {
    doc.setTextColor(...darkGray);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', margin, finalY + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const splitObs = doc.splitTextToSize(quote.observations, summaryBoxX - margin - 10);
    doc.text(splitObs, margin, finalY + 18);
    obsEndY = finalY + 18 + (splitObs.length * 4);
  }

  // Signature area (if signed)
  const signatureY = Math.max(finalY + 55, obsEndY + 15);
  if (quote.signature) {
    doc.setDrawColor(...tealColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, signatureY, pageWidth - margin * 2, 25, 2, 2, 'S');
    
    doc.setFillColor(240, 255, 245);
    doc.roundedRect(margin, signatureY, pageWidth - margin * 2, 25, 2, 2, 'F');
    
    doc.setTextColor(34, 139, 34);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ ORÇAMENTO APROVADO E ASSINADO', margin + 5, signatureY + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    doc.setFontSize(8);
    
    const signedAt = quote.signature.signedAt instanceof Date ? quote.signature.signedAt : new Date(quote.signature.signedAt);
    doc.text(
      `Assinado por: ${quote.signature.name} em ${format(signedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      margin + 5,
      signatureY + 18
    );
  }

  // Footer
  const footerY = pageHeight - 25;
  
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  doc.setTextColor(...lightGray);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Este documento é válido como proposta comercial. Valores sujeitos a alteração após a data de validade.',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );
  doc.text(
    `${COMPANY_INFO.email} | ${COMPANY_INFO.phone}`,
    pageWidth / 2,
    footerY + 5,
    { align: 'center' }
  );
  doc.text(
    `© ${new Date().getFullYear()} ${COMPANY_INFO.name} - Todos os direitos reservados`,
    pageWidth / 2,
    footerY + 10,
    { align: 'center' }
  );

  // Page number
  doc.setFontSize(8);
  doc.text(`Página 1 de 1`, pageWidth - margin, footerY + 10, { align: 'right' });

  return doc;
}

export function downloadQuotePDF(quote: Quote | QuoteDataForPdf): void {
  const doc = generateQuotePDF(quote);
  doc.save(`${quote.publicId}-v${quote.version}.pdf`);
}

export function previewQuotePDF(quote: Quote | QuoteDataForPdf): void {
  const doc = generateQuotePDF(quote);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
}

export function getPdfBlob(quote: Quote | QuoteDataForPdf): Blob {
  const doc = generateQuotePDF(quote);
  return doc.output('blob');
}

export function getPdfBase64(quote: Quote | QuoteDataForPdf): string {
  const doc = generateQuotePDF(quote);
  return doc.output('datauristring');
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
