import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote, QuoteItem } from '@/types/quotes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoAtivaPdf from '@/assets/logo-ativa-pdf.png';

// Company info
const COMPANY_INFO = {
  name: 'GRUPO ATIVA TEC',
  cnpj: '42.523.488/0001-81',
  address1: 'R. Bela Cintra, 299, 3º Andar',
  address2: 'Consolação, São Paulo - SP, 01415-001',
  phone: '(11) 5563-9886/(11) 97501-1717',
  email: 'atendimento@grupoativatec.com.br',
  website: 'www.grupoativatec.com.br',
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
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 80, 80);
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 78, 78);
    ctx.fillStyle = '#999999';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FOTO', 40, 40);
  }
  return canvas.toDataURL('image/png');
}

// Draw a small icon-like circle with symbol
function drawIcon(doc: jsPDF, x: number, y: number, type: 'location' | 'phone' | 'email') {
  const iconSize = 3.5;
  const tealColor: [number, number, number] = [62, 224, 207];
  
  // Draw circle background
  doc.setFillColor(...tealColor);
  doc.circle(x + iconSize / 2, y - iconSize / 2 + 0.5, iconSize / 2, 'F');
  
  // Draw icon symbol
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  
  if (type === 'location') {
    doc.text('⌂', x + iconSize / 2, y - iconSize / 2 + 1, { align: 'center' });
  } else if (type === 'phone') {
    doc.text('☎', x + iconSize / 2, y - iconSize / 2 + 1, { align: 'center' });
  } else if (type === 'email') {
    doc.text('✉', x + iconSize / 2, y - iconSize / 2 + 1, { align: 'center' });
  }
}

export async function generateQuotePDF(quote: Quote | QuoteDataForPdf): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Colors
  const tealColor: [number, number, number] = [221, 217, 206]; // #ddd9ce
  const darkTeal: [number, number, number] = [180, 175, 165];
  const tealAccent: [number, number, number] = [62, 224, 207]; // #3EE0CF
  const black: [number, number, number] = [0, 0, 0];
  const darkGray: [number, number, number] = [80, 80, 80];
  const bgColor: [number, number, number] = [221, 217, 206]; // #ddd9ce
  const borderColor: [number, number, number] = [180, 175, 165];

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

  // ============= HEADER - TEAL ACCENT LINES =============
  // Top teal line
  doc.setFillColor(...tealAccent);
  doc.rect(0, 0, pageWidth * 0.45, 3, 'F');
  
  // Right teal accent line
  doc.setFillColor(...tealAccent);
  doc.rect(pageWidth * 0.55, 0, pageWidth * 0.45, 3, 'F');

  // Teal accent bar on right side
  doc.setFillColor(...tealAccent);
  doc.rect(pageWidth - 6, 0, 6, 50, 'F');

  // ============= LOGO CENTERED =============
  if (logoData) {
    doc.addImage(logoData, 'PNG', pageWidth / 2 - 25, 8, 50, 25);
  } else {
    doc.setTextColor(...darkTeal);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('ATIVA', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('GRUPO ATIVA', pageWidth / 2, 28, { align: 'center' });
  }

  // ============= COMPANY INFO CARD (left) =============
  const cardY = 40;
  const cardHeight = 46;
  const leftCardWidth = (pageWidth - margin * 2 - 8) * 0.55;
  const rightCardWidth = (pageWidth - margin * 2 - 8) * 0.45;
  const rightCardX = margin + leftCardWidth + 8;

  // Left card border
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, cardY, leftCardWidth, cardHeight, 2, 2, 'S');

  // Company name
  doc.setTextColor(...black);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.name, margin + 5, cardY + 8);

  // CNPJ
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const companyCnpjLabel = 'CNPJ: ';
  doc.text(companyCnpjLabel, margin + 5, cardY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.cnpj, margin + 5 + doc.getTextWidth(companyCnpjLabel), cardY + 14);

  // Address with icon
  const iconX = margin + 5;
  drawIcon(doc, iconX, cardY + 20, 'location');
  doc.setTextColor(...darkGray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.address1, iconX + 5, cardY + 20);
  doc.text(COMPANY_INFO.address2, iconX + 5, cardY + 24.5);

  // Phone with icon
  drawIcon(doc, iconX, cardY + 30, 'phone');
  doc.setTextColor(...black);
  doc.setFontSize(9);
  doc.text(`Contato: ${COMPANY_INFO.phone}`, iconX + 5, cardY + 30);

  // Email with icon
  drawIcon(doc, iconX, cardY + 35, 'email');
  doc.setTextColor(...black);
  doc.setFontSize(9);
  doc.text(`E-mail: ${COMPANY_INFO.email}`, iconX + 5, cardY + 35);

  // ============= CLIENT INFO CARD (right) =============
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(rightCardX, cardY, rightCardWidth, cardHeight, 2, 2, 'S');

  doc.setTextColor(...black);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO CLIENTE', rightCardX + 5, cardY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  let clientInfoY = cardY + 13;
  const maxTextWidth = rightCardWidth - 10;

  // Nome do Condomínio
  doc.setFont('helvetica', 'bold');
  const condLabel = 'Nome do Condomínio: ';
  doc.text(condLabel, rightCardX + 5, clientInfoY);
  const condLabelWidth = doc.getTextWidth(condLabel);
  doc.setFont('helvetica', 'normal');
  doc.text(`${quote.clientName}`, rightCardX + 5 + condLabelWidth, clientInfoY);
  clientInfoY += 4.5;

  // CNPJ (logo abaixo do nome do condomínio)
  if ('clientCnpj' in quote && quote.clientCnpj) {
    doc.setFont('helvetica', 'bold');
    const cnpjLabel = 'CNPJ: ';
    doc.text(cnpjLabel, rightCardX + 5, clientInfoY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${quote.clientCnpj}`, rightCardX + 5 + doc.getTextWidth(cnpjLabel), clientInfoY);
    clientInfoY += 4.5;
  }

  // Endereço
  if ('clientAddress' in quote && quote.clientAddress) {
    const addrLines = doc.splitTextToSize(`${quote.clientAddress}`, maxTextWidth);
    doc.text(addrLines, rightCardX + 5, clientInfoY);
    clientInfoY += addrLines.length * 3.5 + 1;
  }

  // Síndico Responsável
  if ('clientSindico' in quote && quote.clientSindico) {
    doc.setFont('helvetica', 'bold');
    const sindicoLabel = 'Síndico Responsável: ';
    doc.text(sindicoLabel, rightCardX + 5, clientInfoY);
    doc.setFont('helvetica', 'normal');
    const sindicoValueX = rightCardX + 5 + doc.getTextWidth(sindicoLabel);
    const sindicoValueWidth = maxTextWidth - doc.getTextWidth(sindicoLabel);
    const sindicoLines = doc.splitTextToSize(`${quote.clientSindico}`, sindicoValueWidth > 10 ? sindicoValueWidth : maxTextWidth);
    doc.text(sindicoLines, sindicoValueX, clientInfoY);
    clientInfoY += sindicoLines.length * 3.5 + 1;
  }

  // Telefone
  if ('clientPhone' in quote && quote.clientPhone) {
    doc.setFont('helvetica', 'bold');
    const telLabel = 'Telefone: ';
    doc.text(telLabel, rightCardX + 5, clientInfoY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${quote.clientPhone}`, rightCardX + 5 + doc.getTextWidth(telLabel), clientInfoY);
    clientInfoY += 4.5;
  }

  // E-mail
  if ('clientEmail' in quote && quote.clientEmail) {
    doc.setFont('helvetica', 'bold');
    const emailLabel = 'E-mail: ';
    doc.text(emailLabel, rightCardX + 5, clientInfoY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${quote.clientEmail}`, rightCardX + 5 + doc.getTextWidth(emailLabel), clientInfoY);
    clientInfoY += 4.5;
  }

  // ============= TITLE "ORÇAMENTO" =============
  let y = cardY + cardHeight + 18;
  doc.setTextColor(...black);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('ORÇAMENTO', pageWidth / 2, y, { align: 'center' });

  // Underline
  const textWidth = doc.getTextWidth('ORÇAMENTO');
  doc.setDrawColor(...black);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - textWidth / 2, y + 3, pageWidth / 2 + textWidth / 2, y + 3);

  // Quote ID below title
  y = y + 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...black);
  doc.text(`Orçamento: ${quote.publicId}`, margin, y);

  // ============= ITEMS TABLE =============
  y = y + 10;
  
  const tableData = quote.items.map((item, idx) => [
    '', // Image placeholder
    `${item.name}\n${item.description || ''}`,
    formatCurrency(item.unitPrice),
    item.quantity.toString(),
    formatCurrency(item.total),
  ]);

  autoTable(doc, {
    margin: { left: margin, right: margin },
    startY: y,
    head: [['ITEM', 'SERVIÇO/PRODUTO', 'VALOR UN.', 'QTD.', 'TOTAL']],
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
      fillColor: tealAccent, // odd rows (1st, 3rd, etc.)
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255], // even rows white
    },
    styles: {
      overflow: 'linebreak',
      minCellHeight: 22,
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center', valign: 'middle' },
      1: { cellWidth: 75, halign: 'left', valign: 'middle', fontStyle: 'normal' },
      2: { cellWidth: 35, halign: 'center', valign: 'middle' },
      3: { cellWidth: 18, halign: 'center', valign: 'middle' },
      4: { cellWidth: 30, halign: 'center', valign: 'middle', fontStyle: 'bold', textColor: black },
    },
    theme: 'grid',
    tableLineColor: [200, 200, 200],
    tableLineWidth: 0.3,
    didDrawCell: (data) => {
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
  const footerCardHeight = 34;
  const footerCardWidth = (pageWidth - margin * 2) * 0.45;
  const footerY = signatureEndY + 12;

  // Light teal footer background
  doc.setFillColor(235, 250, 248);
  doc.roundedRect(margin, footerY, footerCardWidth, footerCardHeight, 4, 4, 'F');

  // Left teal accent
  doc.setFillColor(...tealAccent);
  doc.rect(margin, footerY, 4, footerCardHeight, 'F');

  doc.setTextColor(...darkTeal);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Informações Importantes:', margin + 8, footerY + 8);

  doc.setTextColor(...darkGray);
  doc.setFontSize(6);
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
    doc.text(line, margin + 8, footerY + 15 + (idx * 5));
  });

  // ============= BOTTOM FOOTER - LINE + WEBSITE =============
  const bottomY = pageHeight - 10;
  
  // Horizontal line
  doc.setDrawColor(...tealAccent);
  doc.setLineWidth(1);
  doc.line(margin, bottomY - 5, pageWidth - margin, bottomY - 5);

  // Website text centered
  doc.setTextColor(...darkGray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.website, pageWidth / 2, bottomY, { align: 'center' });

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
