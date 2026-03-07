import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface SolicitacaoExport {
  funcionario: string;
  cargo?: string;
  departamento?: string;
  periodo: string;
  dias: number;
  tipo: string;
  status: string;
  data_solicitacao: string;
  data_aprovacao?: string;
  aprovado_por?: string;
  observacao?: string;
}

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  em_andamento: "Em Andamento",
  reprovado: "Reprovado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const tipoLabels: Record<string, string> = {
  ferias: "Férias",
  ferias_coletivas: "Férias Coletivas",
  abono_pecuniario: "Abono Pecuniário",
};

export const exportarRelatorioFeriasAuditoria = (
  solicitacoes: SolicitacaoExport[],
  titulo: string = "Relatório de Férias – Auditoria CLT"
) => {
  const doc = new jsPDF({ orientation: "landscape" });

  // Cabeçalho legal
  doc.setFontSize(16);
  doc.text(titulo, 14, 18);
  doc.setFontSize(9);
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, 14, 25);
  doc.text("Ref. Legal: CLT Art. 129-153, CF Art. 7º XVII", 14, 30);

  const rows = solicitacoes.map((s) => [
    s.funcionario,
    s.cargo || "-",
    s.departamento || "-",
    s.periodo,
    s.dias.toString(),
    tipoLabels[s.tipo] || s.tipo,
    statusLabels[s.status] || s.status,
    s.data_solicitacao,
    s.data_aprovacao || "-",
    s.observacao || "-",
  ]);

  autoTable(doc, {
    startY: 36,
    head: [["Funcionário", "Cargo", "Depto", "Período", "Dias", "Tipo", "Status", "Solicitado", "Aprovado", "Obs."]],
    body: rows,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [34, 197, 94] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 6) {
        const val = data.cell.raw as string;
        if (val === "Reprovado" || val === "Cancelado") data.cell.styles.textColor = [220, 38, 38];
        else if (val === "Pendente") data.cell.styles.textColor = [202, 138, 4];
        else if (val === "Aprovado" || val === "Concluído") data.cell.styles.textColor = [22, 163, 74];
        else if (val === "Em Andamento") data.cell.styles.textColor = [37, 99, 235];
      }
    },
  });

  // Rodapé legal
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.text(
      `Documento gerado para fins de auditoria trabalhista. Página ${i}/${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save("relatorio-ferias-auditoria-clt.pdf");
};
