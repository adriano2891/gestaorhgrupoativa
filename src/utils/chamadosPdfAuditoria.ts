import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChamadoExport {
  id: string;
  numero_protocolo?: string;
  assunto: string;
  categoria: string;
  status: string;
  created_at: string;
  updated_at: string;
  profiles?: { nome: string; departamento?: string | null; cargo?: string | null } | null;
  mensagens?: {
    conteudo: string;
    created_at: string;
    profiles?: { nome: string } | null;
    arquivo_nome?: string | null;
  }[];
  auditoria?: {
    acao: string;
    created_at: string;
    ip_address?: string | null;
    user_agent?: string | null;
    detalhes?: string | null;
    profiles?: { nome: string } | null;
  }[];
}

const CATEGORIAS_MAP: Record<string, string> = {
  folha_pagamento: "Folha de Pagamento",
  beneficios: "Benefícios",
  ferias: "Férias",
  documentos: "Documentos",
  outros: "Outros",
};

export function gerarPdfChamadoAuditoria(chamado: ChamadoExport) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO DE CHAMADO — AUDITORIA TRABALHISTA", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}`, pageWidth / 2, 26, { align: "center" });
  doc.text("Documento gerado para fins de fiscalização trabalhista — CLT Arts. 41, 74 e Portaria MTP nº 671/2021", pageWidth / 2, 30, { align: "center" });

  doc.setDrawColor(0);
  doc.line(14, 33, pageWidth - 14, 33);

  // Chamado details
  let y = 38;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO CHAMADO", 14, y);
  y += 6;

  const protocolo = chamado.numero_protocolo || chamado.id.slice(0, 8).toUpperCase();
  const details = [
    ["Nº Protocolo", protocolo],
    ["Funcionário", chamado.profiles?.nome || "N/I"],
    ["Departamento", chamado.profiles?.departamento || "N/I"],
    ["Cargo", chamado.profiles?.cargo || "N/I"],
    ["Categoria", CATEGORIAS_MAP[chamado.categoria] || chamado.categoria],
    ["Assunto", chamado.assunto],
    ["Status", chamado.status === "fechado" ? "Fechado" : "Aberto"],
    ["Abertura", format(new Date(chamado.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })],
    ["Última Atualização", format(new Date(chamado.updated_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })],
  ];

  doc.setFontSize(9);
  details.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 55, y);
    y += 5;
  });

  // Messages
  if (chamado.mensagens && chamado.mensagens.length > 0) {
    y += 4;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("HISTÓRICO DE MENSAGENS", 14, y);
    y += 2;

    const msgRows = chamado.mensagens.map((m, i) => [
      String(i + 1),
      format(new Date(m.created_at), "dd/MM/yy HH:mm", { locale: ptBR }),
      m.profiles?.nome || "N/I",
      m.conteudo.length > 120 ? m.conteudo.slice(0, 120) + "..." : m.conteudo,
      m.arquivo_nome || "—",
    ]);

    autoTable(doc, {
      startY: y,
      head: [["#", "Data/Hora", "Remetente", "Conteúdo", "Anexo"]],
      body: msgRows,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 30, 30] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: "auto" },
        4: { cellWidth: 25 },
      },
    });

    y = (doc as any).lastAutoTable?.finalY || y + 20;
  }

  // Audit trail
  if (chamado.auditoria && chamado.auditoria.length > 0) {
    y += 6;
    if (y > 260) { doc.addPage(); y = 20; }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TRILHA DE AUDITORIA", 14, y);
    y += 2;

    const auditRows = chamado.auditoria.map((a) => [
      format(new Date(a.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR }),
      a.profiles?.nome || "Sistema",
      a.acao,
      a.detalhes || "—",
      a.ip_address || "—",
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Data/Hora", "Usuário", "Ação", "Detalhes", "IP"]],
      body: auditRows,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 30, 30] },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Página ${i}/${pageCount} — Protocolo ${protocolo} — Documento gerado automaticamente para fins de auditoria trabalhista`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  doc.save(`chamado_${protocolo}_auditoria.pdf`);
}

export function gerarPdfRelatorioGeral(chamados: ChamadoExport[]) {
  const doc = new jsPDF("landscape");
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO GERAL DE CHAMADOS — AUDITORIA TRABALHISTA", pageWidth / 2, 15, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })} | Total: ${chamados.length} chamados`, pageWidth / 2, 21, { align: "center" });

  const rows = chamados.map((c) => [
    c.numero_protocolo || c.id.slice(0, 8).toUpperCase(),
    c.profiles?.nome || "N/I",
    c.profiles?.departamento || "—",
    CATEGORIAS_MAP[c.categoria] || c.categoria,
    c.assunto.length > 50 ? c.assunto.slice(0, 50) + "..." : c.assunto,
    c.status === "fechado" ? "Fechado" : "Aberto",
    format(new Date(c.created_at), "dd/MM/yy HH:mm", { locale: ptBR }),
    format(new Date(c.updated_at), "dd/MM/yy HH:mm", { locale: ptBR }),
  ]);

  autoTable(doc, {
    startY: 26,
    head: [["Protocolo", "Funcionário", "Depto", "Categoria", "Assunto", "Status", "Abertura", "Atualização"]],
    body: rows,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [30, 30, 30] },
  });

  doc.save(`relatorio_chamados_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
