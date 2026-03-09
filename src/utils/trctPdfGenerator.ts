/**
 * Gerador de TRCT — Termo de Rescisão do Contrato de Trabalho
 * Baseado no modelo MTE (Portaria MTE 1.057/2012)
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { calcularINSS, calcularIRRF } from "./inssIrrfCalculos";

interface DadosTRCT {
  // Empregador
  empregadorRazaoSocial: string;
  empregadorCNPJ: string;
  // Empregado
  nomeEmpregado: string;
  cpfEmpregado: string;
  cargoEmpregado: string;
  dataAdmissao: string;
  dataDemissao: string;
  // Rescisão
  tipoRescisao: string;
  avisoTrabalhado: boolean;
  avisoPrevioDias: number;
  // Valores
  salarioBase: number;
  saldoSalario: number;
  avisoPrevioValor: number;
  feriasProp: number;
  tercoFerias: number;
  feriasVencidasValor: number;
  tercoFeriasVencidas: number;
  decimoTerceiro: number;
  multaFgts: number;
  totalBruto: number;
}

const tipoRescisaoLabels: Record<string, string> = {
  sem_justa_causa: "Dispensa sem justa causa pelo empregador",
  com_justa_causa: "Dispensa com justa causa pelo empregador",
  pedido_demissao: "Pedido de demissão pelo empregado",
  acordo_mutuo: "Rescisão por acordo (Art. 484-A CLT)",
};

export const gerarTRCT = (dados: DadosTRCT) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TERMO DE RESCISÃO DO CONTRATO DE TRABALHO", pageWidth / 2, 15, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Conforme Portaria MTE nº 1.057/2012", pageWidth / 2, 20, { align: "center" });

  // Dados do empregador
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("IDENTIFICAÇÃO DO EMPREGADOR", 14, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Razão Social: ${dados.empregadorRazaoSocial || "—"}`, 14, 36);
  doc.text(`CNPJ: ${dados.empregadorCNPJ || "—"}`, 14, 41);

  // Dados do empregado
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("IDENTIFICAÇÃO DO TRABALHADOR", 14, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Nome: ${dados.nomeEmpregado}`, 14, 56);
  doc.text(`CPF: ${dados.cpfEmpregado || "—"}`, 14, 61);
  doc.text(`Cargo: ${dados.cargoEmpregado || "—"}`, 14, 66);
  doc.text(`Data de Admissão: ${formatDate(dados.dataAdmissao)}`, 14, 71);
  doc.text(`Data de Desligamento: ${formatDate(dados.dataDemissao)}`, 110, 71);

  // Tipo de rescisão
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DADOS DO CONTRATO", 14, 80);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Causa: ${tipoRescisaoLabels[dados.tipoRescisao] || dados.tipoRescisao}`, 14, 86);
  doc.text(`Aviso Prévio: ${dados.avisoTrabalhado ? "Trabalhado" : "Indenizado"} (${dados.avisoPrevioDias} dias)`, 14, 91);
  doc.text(`Salário Base: ${fmt(dados.salarioBase)}`, 14, 96);

  // Cálculo INSS/IRRF sobre verbas
  const inssResult = calcularINSS(dados.totalBruto);
  const irrfResult = calcularIRRF(dados.totalBruto, inssResult.valor, 0);
  const totalDescontos = inssResult.valor + irrfResult.valor;
  const totalLiquido = dados.totalBruto - totalDescontos;

  // Tabela de verbas
  const verbas: [string, string, string][] = [
    ["01", "Saldo de Salário", fmt(dados.saldoSalario)],
    ["02", `Aviso Prévio Indenizado (${dados.avisoPrevioDias} dias)`, fmt(dados.avisoPrevioValor)],
    ["03", "13º Salário Proporcional", fmt(dados.decimoTerceiro)],
    ["04", "Férias Proporcionais", fmt(dados.feriasProp)],
    ["05", "1/3 Constitucional (férias proporcionais)", fmt(dados.tercoFerias)],
  ];

  if (dados.feriasVencidasValor > 0) {
    verbas.push(["06", "Férias Vencidas em Dobro (Art. 137 CLT)", fmt(dados.feriasVencidasValor)]);
    verbas.push(["07", "1/3 Constitucional (férias vencidas)", fmt(dados.tercoFeriasVencidas)]);
  }

  if (dados.multaFgts > 0) {
    verbas.push(["08", "Multa FGTS (40% ou 20%)", fmt(dados.multaFgts)]);
  }

  verbas.push(["", "TOTAL BRUTO", fmt(dados.totalBruto)]);

  autoTable(doc, {
    startY: 102,
    head: [["Cód.", "Discriminação das Verbas", "Valor"]],
    body: verbas,
    theme: "grid",
    headStyles: { fillColor: [41, 65, 122], fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
    columnStyles: { 0: { cellWidth: 15 }, 2: { cellWidth: 35, halign: "right" } },
    didParseCell: (data) => {
      if (data.row.index === verbas.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [240, 240, 240];
      }
    },
  });

  // Descontos
  const yDescontos = (doc as any).lastAutoTable?.finalY + 5 || 180;
  const descontos: [string, string, string][] = [
    ["D1", `INSS (alíq. efetiva ${inssResult.aliquotaEfetiva}%)`, fmt(inssResult.valor)],
    ["D2", `IRRF (faixa ${irrfResult.faixa})`, fmt(irrfResult.valor)],
    ["", "TOTAL DESCONTOS", fmt(totalDescontos)],
    ["", "VALOR LÍQUIDO RESCISÃO", fmt(totalLiquido)],
  ];

  autoTable(doc, {
    startY: yDescontos,
    head: [["Cód.", "Descontos", "Valor"]],
    body: descontos,
    theme: "grid",
    headStyles: { fillColor: [180, 40, 40], fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
    columnStyles: { 0: { cellWidth: 15 }, 2: { cellWidth: 35, halign: "right" } },
    didParseCell: (data) => {
      if (data.row.index >= descontos.length - 2) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [240, 240, 240];
      }
    },
  });

  // Assinaturas
  const yAssinatura = (doc as any).lastAutoTable?.finalY + 20 || 230;
  doc.setFontSize(8);
  doc.line(14, yAssinatura, 90, yAssinatura);
  doc.text("Empregador", 52, yAssinatura + 4, { align: "center" });
  doc.line(110, yAssinatura, 196, yAssinatura);
  doc.text("Empregado(a)", 153, yAssinatura + 4, { align: "center" });

  doc.text(`Local e Data: _______________________, ${new Date().toLocaleDateString("pt-BR")}`, 14, yAssinatura + 15);

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(6);
  doc.setTextColor(128);
  doc.text("Documento gerado pelo sistema de gestão — Uso interno", pageWidth / 2, pageHeight - 8, { align: "center" });
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, pageWidth / 2, pageHeight - 5, { align: "center" });

  doc.save(`TRCT_${dados.nomeEmpregado.replace(/\s/g, "_")}_${dados.dataDemissao}.pdf`);
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
}
