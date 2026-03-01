import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

interface FuncionarioFerias {
  nome: string;
  cargo?: string;
  departamento?: string;
  data_admissao: string;
  fim_periodo_aquisitivo: string;
  fim_periodo_concessivo: string;
  status: string;
}

const statusLabels: Record<string, string> = {
  cumprindo: "Cumprindo",
  prestes_a_vencer: "Prestes a Vencer",
  vencida: "Vencida",
  em_ferias: "Em Férias",
};

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

export const exportarFeriasPDF = (funcionarios: FuncionarioFerias[]) => {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(18);
  doc.text("Controle de Férias – CLT", 14, 20);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 28);

  const rows = funcionarios.map((f) => [
    f.nome,
    f.cargo || "-",
    f.departamento || "-",
    formatDate(f.data_admissao),
    formatDate(f.fim_periodo_aquisitivo),
    formatDate(f.fim_periodo_concessivo),
    statusLabels[f.status] || f.status,
  ]);

  autoTable(doc, {
    startY: 34,
    head: [["Funcionário", "Cargo", "Departamento", "Admissão", "Fim Per. Aquisitivo", "Fim Per. Concessivo", "Status"]],
    body: rows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [34, 197, 94] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 6) {
        const val = data.cell.raw as string;
        if (val === "Vencida") data.cell.styles.textColor = [220, 38, 38];
        else if (val === "Prestes a Vencer") data.cell.styles.textColor = [202, 138, 4];
        else if (val === "Em Férias") data.cell.styles.textColor = [37, 99, 235];
        else data.cell.styles.textColor = [22, 163, 74];
      }
    },
  });

  doc.save("controle-ferias-clt.pdf");
};

export const exportarFeriasExcel = async (funcionarios: FuncionarioFerias[]) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Controle de Férias CLT");

  ws.columns = [
    { header: "Funcionário", key: "nome", width: 30 },
    { header: "Cargo", key: "cargo", width: 20 },
    { header: "Departamento", key: "departamento", width: 20 },
    { header: "Admissão", key: "admissao", width: 15 },
    { header: "Fim Per. Aquisitivo", key: "aquisitivo", width: 20 },
    { header: "Fim Per. Concessivo", key: "concessivo", width: 20 },
    { header: "Status", key: "status", width: 18 },
  ];

  // Header style
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF22C55E" } };
  });

  funcionarios.forEach((f) => {
    const row = ws.addRow({
      nome: f.nome,
      cargo: f.cargo || "-",
      departamento: f.departamento || "-",
      admissao: formatDate(f.data_admissao),
      aquisitivo: formatDate(f.fim_periodo_aquisitivo),
      concessivo: formatDate(f.fim_periodo_concessivo),
      status: statusLabels[f.status] || f.status,
    });

    const statusCell = row.getCell("status");
    if (f.status === "vencida") statusCell.font = { color: { argb: "FFDC2626" }, bold: true };
    else if (f.status === "prestes_a_vencer") statusCell.font = { color: { argb: "FFCA8A04" }, bold: true };
    else if (f.status === "em_ferias") statusCell.font = { color: { argb: "FF2563EB" }, bold: true };
    else statusCell.font = { color: { argb: "FF16A34A" } };
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "controle-ferias-clt.xlsx";
  a.click();
  URL.revokeObjectURL(url);
};
