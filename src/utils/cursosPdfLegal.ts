import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FuncionarioPresenca {
  nome: string;
  cpf?: string;
  matricula?: string;
  departamento: string;
  cargo: string;
  progresso: number;
  confirmado: boolean;
  confirmado_em?: string;
  data_conclusao?: string;
}

interface DadosCursoLegal {
  titulo: string;
  descricao?: string;
  instrutor?: string;
  cargaHoraria: number;
  normaRegulamentadora?: string;
  dataInicio?: string;
  cnpjEmpresa?: string;
  razaoSocial?: string;
  funcionarios: FuncionarioPresenca[];
  auditoria?: Array<{ acao: string; detalhes?: string; created_at: string }>;
}

export const gerarPdfListaPresencaLegal = (dados: DadosCursoLegal) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Header da empresa
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(dados.razaoSocial || "EMPRESA", pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  if (dados.cnpjEmpresa) {
    doc.text(`CNPJ: ${dados.cnpjEmpresa}`, pageWidth / 2, y, { align: "center" });
    y += 5;
  }

  // Linha separadora
  doc.setDrawColor(0);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  // Título do documento
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("LISTA DE PRESENÇA - TREINAMENTO", pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Documento para fins de auditoria trabalhista (CLT Art. 157, NR-1 Art. 16)", pageWidth / 2, y, { align: "center" });
  y += 10;

  // Dados do treinamento
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO TREINAMENTO", 14, y);
  y += 6;

  const infoRows: string[][] = [
    ["Treinamento", dados.titulo],
    ["Carga Horária", `${dados.cargaHoraria} minutos (${(dados.cargaHoraria / 60).toFixed(1)}h)`],
    ["Instrutor", dados.instrutor || "Não informado"],
  ];

  if (dados.normaRegulamentadora) {
    infoRows.push(["Norma Regulamentadora", dados.normaRegulamentadora]);
  }

  if (dados.descricao) {
    infoRows.push(["Objetivo", dados.descricao.substring(0, 200)]);
  }

  infoRows.push(["Data de Geração", format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })]);

  autoTable(doc, {
    startY: y,
    body: infoRows,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Lista de presença
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("REGISTRO DE PARTICIPAÇÃO", 14, y);
  y += 6;

  const totalFuncionarios = dados.funcionarios.length;
  const confirmados = dados.funcionarios.filter(f => f.confirmado).length;
  const concluidos = dados.funcionarios.filter(f => f.progresso === 100).length;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Total: ${totalFuncionarios} | Concluíram 100%: ${concluidos} | Confirmaram participação: ${confirmados}`,
    14, y
  );
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [["#", "Funcionário", "CPF", "Depto.", "Progresso", "Confirmação", "Data Confirmação"]],
    body: dados.funcionarios.map((f, i) => [
      String(i + 1),
      f.nome,
      f.cpf || "—",
      f.departamento,
      `${f.progresso}%`,
      f.confirmado ? "✓ Sim" : "✗ Não",
      f.confirmado_em
        ? format(new Date(f.confirmado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })
        : "—",
    ]),
    theme: "grid",
    headStyles: { fillColor: [62, 224, 207], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 7 },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 40 },
      2: { cellWidth: 28 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20 },
      5: { cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Trilha de auditoria
  if (dados.auditoria && dados.auditoria.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TRILHA DE AUDITORIA", 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Data/Hora", "Ação", "Detalhes"]],
      body: dados.auditoria.map(a => [
        format(new Date(a.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        a.acao,
        a.detalhes || "—",
      ]),
      theme: "grid",
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Rodapé legal
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100);
  doc.text(
    "Este documento foi gerado eletronicamente e possui validade legal conforme Art. 157 da CLT,",
    14, y
  );
  y += 4;
  doc.text(
    "NR-1 (Portaria 6.730/2020) e Lei 14.063/2020 (assinatura eletrônica).",
    14, y
  );
  y += 4;
  doc.text(
    "As confirmações de participação foram registradas digitalmente com IP e user-agent do participante.",
    14, y
  );
  y += 4;
  doc.text(
    `Prazo de guarda: 5 anos (Art. 11 CLT). Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}`,
    14, y
  );

  doc.setTextColor(0);

  doc.save(`lista-presenca-${dados.titulo.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};
