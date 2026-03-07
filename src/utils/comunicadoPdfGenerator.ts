import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface ComunicadoPdfData {
  id: string;
  titulo: string;
  conteudo: string;
  tipo: string;
  prioridade: string;
  destinatarios: string[];
  created_at: string;
  data_expiracao: string | null;
  emissor_nome: string;
  anexos?: any[] | null;
}

export const gerarPdfComunicado = async (comunicado: ComunicadoPdfData) => {
  // Fetch read confirmations
  const { data: confirmacoes } = await (supabase as any)
    .from("comunicados_lidos")
    .select("*, profiles:user_id(nome, email, departamento, cpf, matricula)")
    .eq("comunicado_id", comunicado.id)
    .order("lido_em", { ascending: true });

  // Fetch audit trail
  const { data: auditoria } = await (supabase as any)
    .from("comunicados_auditoria")
    .select("*, profiles:user_id(nome)")
    .eq("comunicado_id", comunicado.id)
    .order("created_at", { ascending: true });

  // Fetch company info
  const { data: empresa } = await supabase
    .from("empresas")
    .select("razao_social, cnpj")
    .limit(1)
    .single();

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header - Company Info
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(empresa?.razao_social || "Empresa", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`CNPJ: ${empresa?.cnpj || "—"}`, pageWidth / 2, y, { align: "center" });
  y += 10;

  // Title
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("COMPROVANTE DE COMUNICADO INTERNO", pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Documento gerado para fins de auditoria trabalhista (CLT Art. 2º, 468)", pageWidth / 2, y, { align: "center" });
  y += 8;

  // Line separator
  doc.setDrawColor(0);
  doc.line(14, y, pageWidth - 14, y);
  y += 6;

  // Communication details
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO COMUNICADO", 14, y);
  y += 6;

  const detalhes = [
    ["ID do Comunicado", comunicado.id],
    ["Título", comunicado.titulo],
    ["Tipo", comunicado.tipo.charAt(0).toUpperCase() + comunicado.tipo.slice(1)],
    ["Prioridade", comunicado.prioridade.charAt(0).toUpperCase() + comunicado.prioridade.slice(1)],
    ["Emitido por", comunicado.emissor_nome],
    ["Data de Emissão", format(new Date(comunicado.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })],
    ["Data de Expiração", comunicado.data_expiracao 
      ? format(new Date(comunicado.data_expiracao), "dd/MM/yyyy", { locale: ptBR }) 
      : "Sem expiração"],
    ["Destinatários", comunicado.destinatarios?.includes("todos") ? "Todos os funcionários" : comunicado.destinatarios?.join(", ")],
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: detalhes,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45 },
      1: { cellWidth: "auto" },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Content
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("CONTEÚDO", 14, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const contentLines = doc.splitTextToSize(comunicado.conteudo, pageWidth - 28);
  doc.text(contentLines, 14, y);
  y += contentLines.length * 4 + 6;

  // Attachments
  if (comunicado.anexos && comunicado.anexos.length > 0) {
    if (y > 260) { doc.addPage(); y = 15; }
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ANEXOS", 14, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    comunicado.anexos.forEach((a: any, i: number) => {
      doc.text(`${i + 1}. ${a.nome}`, 14, y);
      y += 4;
    });
    y += 4;
  }

  // Read confirmations table
  if (y > 220) { doc.addPage(); y = 15; }
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("CONFIRMAÇÕES DE LEITURA", 14, y);
  y += 2;

  const totalLidos = confirmacoes?.length || 0;
  const totalConfirmados = confirmacoes?.filter((c: any) => c.confirmado).length || 0;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  y += 4;
  doc.text(`Total de leituras: ${totalLidos} | Confirmações formais: ${totalConfirmados}`, 14, y);
  y += 4;

  if (confirmacoes && confirmacoes.length > 0) {
    const confirmRows = confirmacoes.map((c: any) => [
      c.profiles?.nome || "—",
      c.profiles?.matricula || "—",
      c.profiles?.cpf || "—",
      c.profiles?.departamento || "—",
      format(new Date(c.lido_em), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      c.confirmado ? format(new Date(c.confirmado_em), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "Pendente",
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Funcionário", "Matrícula", "CPF", "Departamento", "Lido em", "Confirmado em"]],
      body: confirmRows,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [64, 64, 64], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  } else {
    y += 4;
    doc.text("Nenhuma leitura registrada.", 14, y);
    y += 8;
  }

  // Audit trail
  if (y > 240) { doc.addPage(); y = 15; }
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TRILHA DE AUDITORIA", 14, y);
  y += 2;

  if (auditoria && auditoria.length > 0) {
    const auditRows = auditoria.map((a: any) => [
      format(new Date(a.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
      a.profiles?.nome || "Sistema",
      a.acao,
      a.detalhes || "—",
    ]);

    autoTable(doc, {
      startY: y + 2,
      head: [["Data/Hora", "Responsável", "Ação", "Detalhes"]],
      body: auditRows,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [64, 64, 64], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Footer
  if (y > 265) { doc.addPage(); y = 15; }
  doc.setDrawColor(0);
  doc.line(14, y, pageWidth - 14, y);
  y += 5;
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text(
    `Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })} — Válido para fins de auditoria e fiscalização trabalhista.`,
    pageWidth / 2, y, { align: "center" }
  );
  y += 4;
  doc.text(
    `${empresa?.razao_social || "Empresa"} — CNPJ: ${empresa?.cnpj || "—"} — ID: ${comunicado.id}`,
    pageWidth / 2, y, { align: "center" }
  );

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Página ${i}/${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: "right" });
  }

  doc.save(`comunicado-${comunicado.id.slice(0, 8)}-${format(new Date(), "yyyyMMdd")}.pdf`);
};
