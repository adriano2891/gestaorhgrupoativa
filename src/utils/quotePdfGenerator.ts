import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote } from '@/types/quotes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function generateQuotePDF(quote: Quote) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const primaryColor: [number, number, number] = [0, 111, 238];
  const tealColor: [number, number, number] = [62, 224, 207];

  // Header
  doc.setFillColor(...tealColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ORÇAMENTO', 14, 25);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.publicId, pageWidth - 14, 20, { align: 'right' });
  doc.text(`Versão ${quote.version}`, pageWidth - 14, 28, { align: 'right' });

  // Client info
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(11);
  let y = 55;

  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.clientName, 40, y);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Data:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(format(quote.createdAt, "dd/MM/yyyy", { locale: ptBR }), 40, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Validade:', pageWidth / 2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(format(quote.validUntil, "dd/MM/yyyy", { locale: ptBR }), pageWidth / 2 + 30, y);

  // Items table
  y += 15;
  const tableData = quote.items.map((item, idx) => [
    item.name,
    item.description.substring(0, 40) + (item.description.length > 40 ? '...' : ''),
    item.quantity.toString(),
    formatCurrency(item.unitPrice),
    formatCurrency(item.total),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Item', 'Descrição', 'Qtd', 'Valor Un.', 'Total']],
    body: tableData,
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 60 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(10);
  doc.text('Subtotal:', pageWidth - 80, finalY);
  doc.text(formatCurrency(quote.financials.subtotal), pageWidth - 14, finalY, { align: 'right' });

  doc.text(`Impostos (${quote.financials.taxRate}%):`, pageWidth - 80, finalY + 7);
  doc.text(formatCurrency(quote.financials.taxAmount), pageWidth - 14, finalY + 7, { align: 'right' });

  doc.setFillColor(...primaryColor);
  doc.rect(pageWidth - 90, finalY + 12, 76, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', pageWidth - 85, finalY + 20);
  doc.text(formatCurrency(quote.financials.total), pageWidth - 14, finalY + 20, { align: 'right' });

  // Observations
  if (quote.observations) {
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', 14, finalY + 35);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.observations, 14, finalY + 42, { maxWidth: pageWidth - 28 });
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.text(
    'Este documento é válido como proposta comercial. Valores sujeitos a alteração após a data de validade.',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );
  doc.text(
    `© ${new Date().getFullYear()} Grupo Ativa - Todos os direitos reservados`,
    pageWidth / 2,
    footerY + 5,
    { align: 'center' }
  );

  // Signature if signed
  if (quote.signature) {
    doc.setTextColor(34, 139, 34);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ ORÇAMENTO ASSINADO', 14, finalY + 55);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(
      `Assinado por ${quote.signature.name} em ${format(quote.signature.signedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      14,
      finalY + 62
    );
  }

  return doc;
}

export function downloadQuotePDF(quote: Quote) {
  const doc = generateQuotePDF(quote);
  doc.save(`${quote.publicId}-v${quote.version}.pdf`);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
