import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DocExport {
  id: string;
  titulo: string;
  tipo: string;
  arquivo_nome: string;
  arquivo_tamanho: number | null;
  criado_por: string | null;
  created_at: string;
  updated_at: string;
  versao_atual: number;
  descricao?: string | null;
  tags?: string[] | null;
  categoria?: { nome: string } | null;
  profiles?: { nome: string } | null;
}

interface AuditoriaEntry {
  acao: string;
  detalhes?: string | null;
  created_at: string;
  ip_address?: string | null;
  profiles?: { nome: string } | null;
}

const TIPO_MAP: Record<string, string> = {
  pdf: "PDF", docx: "Word", xlsx: "Excel", pptx: "PowerPoint",
  imagem: "Imagem", video: "Vídeo", audio: "Áudio", outro: "Outro",
};

export function gerarPdfDocumentoAuditoria(doc: DocExport, auditoria: AuditoriaEntry[]) {
  const pdf = new jsPDF();
  const pw = pdf.internal.pageSize.getWidth();

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("RELATÓRIO DE DOCUMENTO — AUDITORIA TRABALHISTA", pw / 2, 20, { align: "center" });

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}`, pw / 2, 26, { align: "center" });
  pdf.text("CLT Arts. 41, 74 — Portaria MTP nº 671/2021 — Retenção obrigatória de 5 anos", pw / 2, 30, { align: "center" });
  pdf.line(14, 33, pw - 14, 33);

  let y = 38;
  const details = [
    ["Título", doc.titulo],
    ["Tipo", TIPO_MAP[doc.tipo] || doc.tipo],
    ["Arquivo", doc.arquivo_nome],
    ["Tamanho", doc.arquivo_tamanho ? `${(doc.arquivo_tamanho / 1024 / 1024).toFixed(2)} MB` : "N/I"],
    ["Categoria", doc.categoria?.nome || "Sem categoria"],
    ["Versão", String(doc.versao_atual)],
    ["Criado por", doc.profiles?.nome || "N/I"],
    ["Data criação", format(new Date(doc.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })],
    ["Última atualização", format(new Date(doc.updated_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })],
    ["Tags", (doc.tags || []).join(", ") || "—"],
    ["Descrição", doc.descricao || "—"],
  ];

  pdf.setFontSize(9);
  details.forEach(([label, value]) => {
    pdf.setFont("helvetica", "bold");
    pdf.text(`${label}:`, 14, y);
    pdf.setFont("helvetica", "normal");
    const lines = pdf.splitTextToSize(value, pw - 70);
    pdf.text(lines, 55, y);
    y += lines.length * 4.5 + 1;
  });

  if (auditoria.length > 0) {
    y += 6;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("TRILHA DE AUDITORIA", 14, y);
    y += 2;

    autoTable(pdf, {
      startY: y,
      head: [["Data/Hora", "Usuário", "Ação", "Detalhes", "IP"]],
      body: auditoria.map(a => [
        format(new Date(a.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR }),
        a.profiles?.nome || "Sistema",
        a.acao,
        a.detalhes || "—",
        a.ip_address || "—",
      ]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 30, 30] },
    });
  }

  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "italic");
    pdf.text(
      `Página ${i}/${pageCount} — Documento gerado para fins de auditoria trabalhista`,
      pw / 2, pdf.internal.pageSize.getHeight() - 8, { align: "center" }
    );
  }

  pdf.save(`documento_${doc.id.slice(0, 8)}_auditoria.pdf`);
}

export function gerarPdfRelatorioDocumentos(docs: DocExport[]) {
  const pdf = new jsPDF("landscape");
  const pw = pdf.internal.pageSize.getWidth();

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("RELATÓRIO GERAL DE DOCUMENTOS — AUDITORIA", pw / 2, 15, { align: "center" });

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })} | Total: ${docs.length}`, pw / 2, 21, { align: "center" });

  autoTable(pdf, {
    startY: 26,
    head: [["Título", "Tipo", "Categoria", "Arquivo", "Versão", "Criado por", "Data Criação"]],
    body: docs.map(d => [
      d.titulo.length > 40 ? d.titulo.slice(0, 40) + "..." : d.titulo,
      TIPO_MAP[d.tipo] || d.tipo,
      d.categoria?.nome || "—",
      d.arquivo_nome,
      String(d.versao_atual),
      d.profiles?.nome || "N/I",
      format(new Date(d.created_at), "dd/MM/yy HH:mm", { locale: ptBR }),
    ]),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [30, 30, 30] },
  });

  pdf.save(`relatorio_documentos_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
