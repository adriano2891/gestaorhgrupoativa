/**
 * Gerador de PPP — Perfil Profissiográfico Previdenciário
 * Lei 8.213/91; IN INSS 128
 * 
 * Consolida dados de SST (ASO, EPI, CAT, afastamentos) em documento único
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface DadosPPP {
  // Funcionário
  nome: string;
  cpf: string;
  dataNascimento?: string;
  cargo: string;
  departamento: string;
  dataAdmissao: string;
  matricula?: string;
  // Empresa
  empresaNome: string;
  empresaCNPJ: string;
  // SST
  asos: { tipo: string; data_exame: string; resultado: string; medico_nome?: string; crm?: string }[];
  epis: { nome_epi: string; ca_numero?: string; data_entrega: string }[];
  cats: { data_acidente: string; tipo: string; descricao: string; dias_afastamento?: number }[];
  afastamentos: { tipo: string; data_inicio: string; data_fim?: string; cid?: string }[];
}

const HEADER_COLOR: [number, number, number] = [41, 65, 122];

export function gerarPPP(dados: DadosPPP) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(...HEADER_COLOR);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PPP — Perfil Profissiográfico Previdenciário", 14, 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Lei 8.213/91 · IN INSS 128 · eSocial S-2240", 14, 19);
  doc.text(`Emitido em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 24);
  doc.setTextColor(0, 0, 0);

  let y = 35;

  // Seção 1: Dados do trabalhador
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("SEÇÃO I — DADOS DO TRABALHADOR", 14, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    body: [
      ["Nome Completo", dados.nome],
      ["CPF", dados.cpf || "—"],
      ["Data de Nascimento", dados.dataNascimento ? formatDate(dados.dataNascimento) : "—"],
      ["Matrícula", dados.matricula || "—"],
      ["Cargo/Função", dados.cargo || "—"],
      ["Setor/Departamento", dados.departamento || "—"],
      ["Data de Admissão", formatDate(dados.dataAdmissao)],
    ],
    theme: "grid",
    headStyles: { fillColor: HEADER_COLOR },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
  });
  y = (doc as any).lastAutoTable?.finalY + 8 || y + 50;

  // Seção 2: ASOs
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("SEÇÃO II — EXAMES MÉDICOS OCUPACIONAIS (NR-7)", 14, y);
  y += 2;

  if (dados.asos.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Tipo", "Data", "Resultado", "Médico", "CRM"]],
      body: dados.asos.map(a => [
        a.tipo, formatDate(a.data_exame), a.resultado, a.medico_nome || "—", a.crm || "—"
      ]),
      theme: "grid",
      headStyles: { fillColor: HEADER_COLOR, fontSize: 7.5 },
      styles: { fontSize: 7 },
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Nenhum exame registrado.", 14, y + 5);
  }
  y = (doc as any).lastAutoTable?.finalY + 8 || y + 12;

  // Seção 3: EPIs
  if (y > 240) { doc.addPage(); y = 15; }
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("SEÇÃO III — EQUIPAMENTOS DE PROTEÇÃO INDIVIDUAL (NR-6)", 14, y);
  y += 2;

  if (dados.epis.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["EPI", "CA", "Data Entrega"]],
      body: dados.epis.map(e => [e.nome_epi, e.ca_numero || "—", formatDate(e.data_entrega)]),
      theme: "grid",
      headStyles: { fillColor: HEADER_COLOR, fontSize: 7.5 },
      styles: { fontSize: 7 },
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Nenhum EPI registrado.", 14, y + 5);
  }
  y = (doc as any).lastAutoTable?.finalY + 8 || y + 12;

  // Seção 4: CATs
  if (y > 240) { doc.addPage(); y = 15; }
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("SEÇÃO IV — COMUNICAÇÕES DE ACIDENTE DE TRABALHO", 14, y);
  y += 2;

  if (dados.cats.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Data", "Tipo", "Descrição", "Dias Afast."]],
      body: dados.cats.map(c => [
        formatDate(c.data_acidente), c.tipo, c.descricao.substring(0, 60), String(c.dias_afastamento || 0)
      ]),
      theme: "grid",
      headStyles: { fillColor: HEADER_COLOR, fontSize: 7.5 },
      styles: { fontSize: 7 },
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Nenhum acidente registrado.", 14, y + 5);
  }
  y = (doc as any).lastAutoTable?.finalY + 8 || y + 12;

  // Seção 5: Afastamentos
  if (y > 240) { doc.addPage(); y = 15; }
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("SEÇÃO V — AFASTAMENTOS", 14, y);
  y += 2;

  if (dados.afastamentos.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Tipo", "Início", "Fim", "CID"]],
      body: dados.afastamentos.map(a => [
        a.tipo, formatDate(a.data_inicio), a.data_fim ? formatDate(a.data_fim) : "Em curso", a.cid || "—"
      ]),
      theme: "grid",
      headStyles: { fillColor: HEADER_COLOR, fontSize: 7.5 },
      styles: { fontSize: 7 },
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Nenhum afastamento registrado.", 14, y + 5);
  }
  y = (doc as any).lastAutoTable?.finalY + 20 || y + 20;

  // Assinaturas
  if (y > 260) { doc.addPage(); y = 15; }
  doc.setFontSize(8);
  doc.line(14, y, 90, y);
  doc.text("Responsável pela emissão", 52, y + 4, { align: "center" });
  doc.line(110, y, 196, y);
  doc.text("Trabalhador(a)", 153, y + 4, { align: "center" });

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(6);
    doc.setTextColor(128);
    doc.text(
      `PPP · ${dados.nome} · Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")} · Página ${i}/${pages}`,
      105, 290, { align: "center" }
    );
  }

  doc.save(`PPP_${dados.nome.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
}
