import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote, QuoteItem } from '@/types/quotes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoAtivaPdf from '@/assets/logo-ativa-pdf.png';

// Company info
const COMPANY_INFO = {
  name: 'GRUPO ATIVA',
  cnpj: '00.000.000/0001-00',
  address: 'Rua Exemplo, 123 - Centro São Paulo - SP',
  phone: '(11) 1234-5678',
  email: 'Ativa@contato.com.br',
};

interface QuoteDataForPdf {
  publicId: string;
  version: number;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientCnpj?: string;
  clientSindico?: string;
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
    dataUrl?: string;
  };
}

// Load image and convert to base64
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading image:', error);
    return null;
  }
}

// Create placeholder image for items without image
function createPlaceholderImage(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 80;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // White background with border
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 80, 80);
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 78, 78);
    
    // "FOTO" text
    ctx.fillStyle = '#999999';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FOTO', 40, 40);
  }
  return canvas.toDataURL('image/png');
}

export async function generateQuotePDF(quote: Quote | QuoteDataForPdf): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Colors matching the model
  const tealColor: [number, number, number] = [221, 217, 206]; // #ddd9ce
  const darkTeal: [number, number, number] = [180, 175, 165];
  const black: [number, number, number] = [0, 0, 0];
  const darkGray: [number, number, number] = [80, 80, 80];
  const lightGray: [number, number, number] = [150, 150, 150];
  const bgColor: [number, number, number] = [221, 217, 206]; // #ddd9ce

  // Set page background color
  doc.setFillColor(...bgColor);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Pre-load all images
  const imageCache: Map<number, string> = new Map();
  const placeholderImage = createPlaceholderImage();
  
  for (let i = 0; i < quote.items.length; i++) {
    const item = quote.items[i];
    if (item.imageUrl) {
      const imageData = await loadImageAsBase64(item.imageUrl);
      imageCache.set(i, imageData || placeholderImage);
    } else {
      imageCache.set(i, placeholderImage);
    }
  }

  // Load logo
  let logoData: string | null = null;
  try {
    logoData = await loadImageAsBase64(logoAtivaPdf);
  } catch (e) {
    console.error('Error loading logo:', e);
  }

  // ============= HEADER SECTION =============
  // Teal line at top
  doc.setFillColor(...tealColor);
  doc.rect(0, 0, pageWidth, 3, 'F');

  // Teal accent bar on right
  doc.setFillColor(...tealColor);
  doc.rect(pageWidth - 8, 0, 8, 50, 'F');

  // Logo centered at top
  if (logoData) {
    doc.addImage(logoData, 'PNG', pageWidth / 2 - 25, 8, 50, 25);
  } else {
    // Fallback text logo
    doc.setTextColor(...darkTeal);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('ATIVA', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('GRUPO ATIVA', pageWidth / 2, 28, { align: 'center' });
  }

  // Teal divider line below header
  doc.setFillColor(...tealColor);
  doc.rect(0, 40, pageWidth - 8, 2, 'F');

  // ============= COMPANY AND CLIENT INFO =============
  let y = 50;

  // Left side - Company info
  doc.setTextColor(...black);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.name, margin, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`CNPJ: ${COMPANY_INFO.cnpj}`, margin, y + 6);
  doc.text(COMPANY_INFO.address, margin, y + 12);
  doc.text(`Contato: ${COMPANY_INFO.phone}`, margin, y + 18);
  doc.text(`E-mail: ${COMPANY_INFO.email}`, margin, y + 24);

  // Right side - Client info
  const clientX = pageWidth / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DADOS DO CLIENTE', clientX, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`(${quote.clientName})`, clientX, y + 6);
  
  if ('clientCnpj' in quote && quote.clientCnpj) {
    doc.text(`(CNPJ: ${quote.clientCnpj})`, clientX, y + 12);
  }
  if ('clientAddress' in quote && quote.clientAddress) {
    doc.text(`(${quote.clientAddress})`, clientX, y + 18);
  }
  if ('clientPhone' in quote && quote.clientPhone) {
    doc.text(`Contato: ${quote.clientPhone}`, clientX, y + 24);
  }
  if ('clientSindico' in quote && quote.clientSindico) {
    doc.text(`Síndico Responsável: ${quote.clientSindico}`, clientX, y + 30);
  }

  // Quote ID on left
  y = 82;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Orçamento: ${quote.publicId}`, margin, y);

  // ============= TITLE "ORÇAMENTO" =============
  y = 100;
  doc.setTextColor(...black);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('ORÇAMENTO', pageWidth / 2, y, { align: 'center' });

  // Underline
  const textWidth = doc.getTextWidth('ORÇAMENTO');
  doc.setDrawColor(...black);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - textWidth / 2, y + 3, pageWidth / 2 + textWidth / 2, y + 3);

  // ============= ITEMS TABLE =============
  y = 115;
  
  const tableData = quote.items.map((item, idx) => [
    '', // Image placeholder
    `${item.name}\n${item.description || ''}`,
    formatCurrency(item.unitPrice),
    item.quantity.toString(),
    formatCurrency(item.total),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['ITEM', 'SERVIÇO/PRODUTO', 'VALOR UN.', 'QTD', 'TOTAL']],
    body: tableData,
    headStyles: {
      fillColor: tealColor,
      textColor: [0, 0, 0],
      fontStyle: 'bolditalic',
      fontSize: 10,
      halign: 'center',
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 6,
      lineColor: [200, 200, 200],
      lineWidth: 0.3,
      fillColor: [62, 224, 207], // #3EE0CF - odd rows (1st, 3rd, etc.)
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255], // white - even rows (2nd, 4th, etc.)
    },
    styles: {
      overflow: 'linebreak',
      minCellHeight: 22,
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center', valign: 'middle' },
      1: { cellWidth: 75, halign: 'left', valign: 'middle', fontStyle: 'normal' },
      2: { cellWidth: 28, halign: 'center', valign: 'middle' },
      3: { cellWidth: 18, halign: 'center', valign: 'middle' },
      4: { cellWidth: 30, halign: 'center', valign: 'middle', fontStyle: 'bold', textColor: black },
    },
    theme: 'grid',
    tableLineColor: [200, 200, 200],
    tableLineWidth: 0.3,
    didDrawCell: (data) => {
      // Draw images in the ITEM column for body rows
      if (data.section === 'body' && data.column.index === 0) {
        const rowIndex = data.row.index;
        const imageData = imageCache.get(rowIndex);
        
        if (imageData) {
          const cellX = data.cell.x;
          const cellY = data.cell.y;
          const cellWidth = data.cell.width;
          const cellHeight = data.cell.height;
          
          const imgSize = 16;
          const imgX = cellX + (cellWidth - imgSize) / 2;
          const imgY = cellY + (cellHeight - imgSize) / 2;
          
          try {
            doc.addImage(imageData, 'PNG', imgX, imgY, imgSize, imgSize);
          } catch (e) {
            // Fallback: draw placeholder box with "FOTO"
            doc.setFillColor(255, 255, 255);
            doc.rect(imgX, imgY, imgSize, imgSize, 'F');
            doc.setDrawColor(180, 180, 180);
            doc.rect(imgX, imgY, imgSize, imgSize, 'S');
            doc.setTextColor(150, 150, 150);
            doc.setFontSize(6);
            doc.text('FOTO', imgX + imgSize / 2, imgY + imgSize / 2, { align: 'center' });
          }
        }
      }
    },
  });

  // ============= TOTAL VALUE =============
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  const totalText = 'VALOR TOTAL:';
  const totalValue = formatCurrency(quote.financials.total);
  
  doc.setTextColor(...black);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bolditalic');
  const totalTextWidth = doc.getTextWidth(totalText);
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const totalValueWidth = doc.getTextWidth(totalValue);
  
  // Calculate positions to fit both texts with proper spacing
  const totalStartX = pageWidth - margin - totalValueWidth - totalTextWidth - 8;
  
  doc.setTextColor(...black);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bolditalic');
  doc.text(totalText, totalStartX, finalY);
  
  doc.setTextColor(...black);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(totalValue, pageWidth - margin, finalY, { align: 'right' });

  // ============= SIGNATURE AREA (if signed) =============
  let signatureEndY = finalY;
  if (quote.signature && quote.signature.dataUrl) {
    signatureEndY = finalY + 25;
    
    doc.setTextColor(...black);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Assinatura do Responsável:', margin, finalY + 15);
    
    try {
      doc.addImage(quote.signature.dataUrl, 'PNG', margin, finalY + 20, 50, 20);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const signedAt = quote.signature.signedAt instanceof Date ? quote.signature.signedAt : new Date(quote.signature.signedAt);
      doc.text(
        `${quote.signature.name} - ${format(signedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
        margin,
        finalY + 45
      );
      signatureEndY = finalY + 50;
    } catch (error) {
      console.error('Erro ao adicionar assinatura:', error);
    }
  }

  // ============= FOOTER - INFORMAÇÕES IMPORTANTES =============
  const footerY = Math.max(signatureEndY + 20, pageHeight - 70);

  // Teal footer background
  doc.setFillColor(235, 250, 248);
  doc.rect(0, footerY, pageWidth, pageHeight - footerY, 'F');

  // Left teal accent
  doc.setFillColor(...tealColor);
  doc.rect(0, footerY, 5, pageHeight - footerY, 'F');

  doc.setTextColor(...darkTeal);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Informações Importantes:', margin + 5, footerY + 12);

  doc.setTextColor(...darkGray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const createdDate = quote.createdAt instanceof Date ? quote.createdAt : new Date(quote.createdAt);
  const validUntilDate = quote.validUntil instanceof Date ? quote.validUntil : new Date(quote.validUntil);
  const diasValidade = Math.ceil((validUntilDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

  const infoLines = [
    `• Orçamento válido por ${diasValidade} dias a partir da data de criação`,
    '• Preços sujeitos a alterações sem aviso prévio',
    '• Descontos especiais podem ser aplicados conforme regras definidas',
    '• Suporte técnico disponível durante horário comercial',
  ];

  infoLines.forEach((line, idx) => {
    doc.text(line, margin + 5, footerY + 22 + (idx * 6));
  });

  return doc;
}

export async function downloadQuotePDF(quote: Quote | QuoteDataForPdf): Promise<void> {
  const doc = await generateQuotePDF(quote);
  doc.save(`${quote.publicId}-v${quote.version}.pdf`);
}

export async function previewQuotePDF(quote: Quote | QuoteDataForPdf): Promise<void> {
  const doc = await generateQuotePDF(quote);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
}

export async function getPdfBlob(quote: Quote | QuoteDataForPdf): Promise<Blob> {
  const doc = await generateQuotePDF(quote);
  return doc.output('blob');
}

export async function getPdfBase64(quote: Quote | QuoteDataForPdf): Promise<string> {
  const doc = await generateQuotePDF(quote);
  return doc.output('datauristring');
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
