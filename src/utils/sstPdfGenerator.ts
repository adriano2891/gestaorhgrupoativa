import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

const HEADER_COLOR: [number, number, number] = [0, 128, 128];
const COMPANY = "Grupo Ativa";

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(...HEADER_COLOR);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, 14, 22);
  doc.setTextColor(0, 0, 0);
}

function addFooter(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(130, 130, 130);
    doc.text(
      `${COMPANY} · Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")} · Página ${i}/${pages}`,
      105, 290, { align: "center" }
    );
  }
}

export function gerarPdfASO(aso: any) {
  const doc = new jsPDF();
  addHeader(doc, "ASO — Atestado de Saúde Ocupacional", "NR-7 (PCMSO)");

  const tipoLabel: Record<string, string> = {
    admissional: "Admissional", periodico: "Periódico", demissional: "Demissional",
    retorno_trabalho: "Retorno ao Trabalho", mudanca_funcao: "Mudança de Função",
  };
  const resultadoLabel: Record<string, string> = {
    apto: "Apto", inapto: "Inapto", apto_com_restricao: "Apto c/ Restrição",
  };

  const data = [
    ["Funcionário", aso._nome || "—"],
    ["Tipo", tipoLabel[aso.tipo] || aso.tipo],
    ["Data do Exame", format(new Date(aso.data_exame), "dd/MM/yyyy")],
    ["Vencimento", aso.data_vencimento ? format(new Date(aso.data_vencimento), "dd/MM/yyyy") : "—"],
    ["Resultado", resultadoLabel[aso.resultado] || aso.resultado],
    ["Médico", aso.medico_nome || "—"],
    ["CRM", aso.crm || "—"],
    ["Observações", aso.observacoes || "—"],
  ];

  autoTable(doc, {
    startY: 38,
    head: [["Campo", "Valor"]],
    body: data,
    theme: "grid",
    headStyles: { fillColor: HEADER_COLOR, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
  });

  addFooter(doc);
  doc.save(`ASO_${(aso._nome || "registro").replace(/\s+/g, "_")}_${format(new Date(aso.data_exame), "yyyyMMdd")}.pdf`);
}

export function gerarPdfEPI(epi: any) {
  const doc = new jsPDF();
  addHeader(doc, "EPI — Entrega de Equipamento de Proteção Individual", "NR-6");

  const data = [
    ["Funcionário", epi._nome || "—"],
    ["Nome do EPI", epi.nome_epi],
    ["Nº CA", epi.ca_numero || "—"],
    ["Data de Entrega", format(new Date(epi.data_entrega), "dd/MM/yyyy")],
    ["Quantidade", String(epi.quantidade)],
    ["Assinado", epi.assinado ? "Sim" : "Não"],
    ["Data Assinatura", epi.data_assinatura ? format(new Date(epi.data_assinatura), "dd/MM/yyyy") : "—"],
    ["Data Devolução", epi.data_devolucao ? format(new Date(epi.data_devolucao), "dd/MM/yyyy") : "—"],
    ["Observações", epi.observacoes || "—"],
  ];

  autoTable(doc, {
    startY: 38,
    head: [["Campo", "Valor"]],
    body: data,
    theme: "grid",
    headStyles: { fillColor: HEADER_COLOR, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
  });

  addFooter(doc);
  doc.save(`EPI_${(epi._nome || "registro").replace(/\s+/g, "_")}_${format(new Date(epi.data_entrega), "yyyyMMdd")}.pdf`);
}

export function gerarPdfCAT(cat: any) {
  const doc = new jsPDF();
  addHeader(doc, "CAT — Comunicação de Acidente de Trabalho", "Lei 8.213/91");

  const tipoLabel: Record<string, string> = {
    tipico: "Típico", trajeto: "Trajeto", doenca_ocupacional: "Doença Ocupacional",
  };

  const data = [
    ["Funcionário", cat._nome || "—"],
    ["Data do Acidente", format(new Date(cat.data_acidente), "dd/MM/yyyy")],
    ["Hora", cat.hora_acidente || "—"],
    ["Tipo", tipoLabel[cat.tipo] || cat.tipo],
    ["Local do Acidente", cat.local_acidente || "—"],
    ["Descrição", cat.descricao],
    ["Parte do Corpo Atingida", cat.parte_corpo || "—"],
    ["Agente Causador", cat.agente_causador || "—"],
    ["Testemunha 1", cat.testemunha_1 || "—"],
    ["Testemunha 2", cat.testemunha_2 || "—"],
    ["Houve Afastamento", cat.houve_afastamento ? `Sim — ${cat.dias_afastamento} dias` : "Não"],
    ["Nº CAT", cat.numero_cat || "—"],
    ["Status", cat.status],
    ["Observações", cat.observacoes || "—"],
  ];

  autoTable(doc, {
    startY: 38,
    head: [["Campo", "Valor"]],
    body: data,
    theme: "grid",
    headStyles: { fillColor: HEADER_COLOR, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 }, 1: { cellWidth: 120 } },
  });

  addFooter(doc);
  doc.save(`CAT_${(cat._nome || "registro").replace(/\s+/g, "_")}_${format(new Date(cat.data_acidente), "yyyyMMdd")}.pdf`);
}

export function gerarPdfCIPAMembro(membro: any) {
  const doc = new jsPDF();
  addHeader(doc, "CIPA — Membro da Comissão", "NR-5");

  const cargoLabel: Record<string, string> = {
    presidente: "Presidente", vice_presidente: "Vice-Presidente",
    secretario: "Secretário(a)", membro: "Membro",
  };

  const data = [
    ["Nome", membro.nome],
    ["Cargo CIPA", cargoLabel[membro.cargo_cipa] || membro.cargo_cipa],
    ["Representação", membro.representacao === "empregador" ? "Empregador" : "Empregado"],
    ["Tipo", membro.tipo === "titular" ? "Titular" : "Suplente"],
    ["Início Mandato", format(new Date(membro.mandato_inicio), "dd/MM/yyyy")],
    ["Fim Mandato", format(new Date(membro.mandato_fim), "dd/MM/yyyy")],
    ["Status", membro.ativo ? "Ativo" : "Inativo"],
  ];

  autoTable(doc, {
    startY: 38,
    head: [["Campo", "Valor"]],
    body: data,
    theme: "grid",
    headStyles: { fillColor: HEADER_COLOR, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
  });

  addFooter(doc);
  doc.save(`CIPA_Membro_${membro.nome.replace(/\s+/g, "_")}.pdf`);
}

export function gerarPdfCIPAReuniao(reuniao: any) {
  const doc = new jsPDF();
  addHeader(doc, "CIPA — Ata de Reunião", "NR-5");

  const data = [
    ["Data", format(new Date(reuniao.data_reuniao), "dd/MM/yyyy")],
    ["Tipo", reuniao.tipo === "ordinaria" ? "Ordinária" : "Extraordinária"],
    ["Pauta", reuniao.pauta || "—"],
    ["Ata", reuniao.ata || "—"],
  ];

  autoTable(doc, {
    startY: 38,
    head: [["Campo", "Valor"]],
    body: data,
    theme: "grid",
    headStyles: { fillColor: HEADER_COLOR, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 }, 1: { cellWidth: 120 } },
  });

  addFooter(doc);
  doc.save(`CIPA_Reuniao_${format(new Date(reuniao.data_reuniao), "yyyyMMdd")}.pdf`);
}
