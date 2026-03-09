import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

const TEAL: [number, number, number] = [0, 128, 128];
const GREEN: [number, number, number] = [34, 139, 34];
const ORANGE: [number, number, number] = [255, 165, 0];
const RED: [number, number, number] = [220, 53, 69];
const COMPANY = "Grupo Ativa";

interface CheckItem {
  num: number;
  requisito: string;
  baseLegal: string;
  status: "sistema" | "parcial" | "externo";
  obs: string;
}

const SECTIONS: { title: string; emoji: string; items: CheckItem[] }[] = [
  {
    title: "REGISTRO E JORNADA DE TRABALHO",
    emoji: "📋",
    items: [
      { num: 1, requisito: "Registro eletrônico de ponto (REP-A)", baseLegal: "Portaria 671/2021", status: "sistema", obs: "Hash SHA-256, imutabilidade, comprovante digital" },
      { num: 2, requisito: "Tolerância de 5/10 min na marcação", baseLegal: "CLT Art. 58 §1º", status: "sistema", obs: "Aplicada automaticamente no cálculo" },
      { num: 3, requisito: "Intervalo intrajornada ≥ 1h (>6h)", baseLegal: "CLT Art. 71", status: "sistema", obs: "Ocorrência automática se violado" },
      { num: 4, requisito: "Intervalo intrajornada ≥ 15min (4-6h)", baseLegal: "CLT Art. 71 §1º", status: "sistema", obs: "Ocorrência automática" },
      { num: 5, requisito: "Descanso interjornada ≥ 11h", baseLegal: "CLT Art. 66", status: "sistema", obs: "Verificação entre turnos" },
      { num: 6, requisito: "Limite 2h extras/dia", baseLegal: "CLT Art. 59", status: "sistema", obs: "Alerta automático" },
      { num: 7, requisito: "Limite 44h semanais", baseLegal: "CLT Art. 58", status: "sistema", obs: "Trigger de verificação semanal" },
      { num: 8, requisito: "DSR / Feriado trabalhado (100%)", baseLegal: "CLT Art. 70", status: "sistema", obs: "Classificação automática do tipo de dia" },
      { num: 9, requisito: "Adicional noturno 20% (22h-5h)", baseLegal: "CLT Art. 73", status: "sistema", obs: "Cálculo hora ficta (52min30s)" },
      { num: 10, requisito: "Prorrogação do adicional noturno", baseLegal: "Súmula 60 II TST", status: "sistema", obs: "Jornada que ultrapassa 5h mantém adicional" },
      { num: 11, requisito: "Banco de horas (compensação 6 meses)", baseLegal: "CLT Art. 59 §5º", status: "sistema", obs: "Vencimento automático" },
      { num: 12, requisito: "Sobreaviso (1/3 hora normal)", baseLegal: "CLT Art. 244 §2º, Súmula 428", status: "sistema", obs: "Registro e cálculo" },
      { num: 13, requisito: "Comprovante de ponto ao trabalhador", baseLegal: "Portaria 671/2021", status: "sistema", obs: "PDF com QR Code e assinatura digital" },
      { num: 14, requisito: "Exportação fiscal (AFD/ACJEF)", baseLegal: "Portaria 671/2021", status: "sistema", obs: "Formatos AFD, ACJEF, JSON" },
      { num: 15, requisito: "Escalas 8h, 6x1, 5x2, 12x36", baseLegal: "CLT Art. 59-A", status: "sistema", obs: "Configurável por funcionário" },
    ],
  },
  {
    title: "REMUNERAÇÃO E DESCONTOS",
    emoji: "💰",
    items: [
      { num: 16, requisito: "Cálculo INSS progressivo", baseLegal: "EC 103/2019", status: "sistema", obs: "Tabela 2024/2025 (7,5% a 14%)" },
      { num: 17, requisito: "Cálculo IRRF progressivo", baseLegal: "Lei 7.713/88", status: "sistema", obs: "Com dedução por dependente (R$ 189,59)" },
      { num: 18, requisito: "Adicional insalubridade (10/20/40%)", baseLegal: "CLT Art. 189-192", status: "sistema", obs: "Sobre salário mínimo" },
      { num: 19, requisito: "Adicional periculosidade (30%)", baseLegal: "CLT Art. 193", status: "sistema", obs: "Sobre salário base" },
      { num: 20, requisito: "Não-cumulatividade insalubridade/periculosidade", baseLegal: "CLT Art. 193 §2º", status: "sistema", obs: "Trava automática" },
      { num: 21, requisito: "Reflexo de HE habituais no 13º", baseLegal: "Súmula 45 TST", status: "sistema", obs: "Média integrada" },
      { num: 22, requisito: "Equiparação salarial (alerta >5%)", baseLegal: "CLT Art. 461", status: "sistema", obs: "Detecção automática por cargo" },
      { num: 23, requisito: "Piso salarial da categoria (CCT/ACT)", baseLegal: "CLT Art. 611-A", status: "sistema", obs: "Validação contra pisos cadastrados" },
      { num: 24, requisito: "Vale-transporte (desconto ≤ 6%)", baseLegal: "Lei 7.418/85", status: "sistema", obs: "Configurável por funcionário" },
      { num: 25, requisito: "Holerites/contracheques", baseLegal: "CLT Art. 464", status: "sistema", obs: "Envio por e-mail + visualização no portal" },
    ],
  },
  {
    title: "FÉRIAS",
    emoji: "🏖️",
    items: [
      { num: 26, requisito: "Período aquisitivo (12 meses)", baseLegal: "CLT Art. 130", status: "sistema", obs: "Geração automática" },
      { num: 27, requisito: "Período concessivo (12 meses)", baseLegal: "CLT Art. 134", status: "sistema", obs: "Alertas de vencimento" },
      { num: 28, requisito: "Fracionamento em até 3 períodos", baseLegal: "CLT Art. 134 §1º", status: "sistema", obs: "Validação de mínimo 14 + 5 + 5 dias" },
      { num: 29, requisito: "1/3 constitucional de férias", baseLegal: "CF Art. 7º, XVII", status: "sistema", obs: "Cálculo automático" },
      { num: 30, requisito: "Abono pecuniário (venda de 10 dias)", baseLegal: "CLT Art. 143", status: "sistema", obs: "Opcional na solicitação" },
      { num: 31, requisito: "Suspensão por afastamento >6 meses", baseLegal: "CLT Art. 131-133", status: "sistema", obs: "Integração com afastamentos" },
    ],
  },
  {
    title: "RESCISÃO",
    emoji: "🚪",
    items: [
      { num: 32, requisito: "Cálculo de verbas rescisórias completo", baseLegal: "CLT Art. 477", status: "sistema", obs: "Saldo salário, aviso, férias, 13º, FGTS" },
      { num: 33, requisito: "Aviso prévio proporcional", baseLegal: "Lei 12.506/11", status: "sistema", obs: "+3 dias por ano trabalhado" },
      { num: 34, requisito: "Multa FGTS 40%", baseLegal: "CLT Art. 18 Lei 8.036", status: "sistema", obs: "Sem justa causa" },
      { num: 35, requisito: "TRCT em PDF", baseLegal: "Portaria MTE 1.057/2012", status: "sistema", obs: "Documento formatado" },
      { num: 36, requisito: "Descontos INSS/IRRF na rescisão", baseLegal: "EC 103/2019", status: "sistema", obs: "Abatidos do líquido" },
    ],
  },
  {
    title: "SAÚDE E SEGURANÇA DO TRABALHO (SST)",
    emoji: "🏥",
    items: [
      { num: 37, requisito: "Gestão de ASO (admissional, periódico, etc.)", baseLegal: "NR-7 (PCMSO)", status: "sistema", obs: "Cadastro + alertas de vencimento" },
      { num: 38, requisito: "Controle de EPI (entrega, devolução, CA)", baseLegal: "NR-6", status: "sistema", obs: "Registro + alertas de troca" },
      { num: 39, requisito: "Registro de CAT", baseLegal: "Lei 8.213/91", status: "sistema", obs: "Cadastro completo" },
      { num: 40, requisito: "Gestão de CIPA (membros, mandatos, reuniões)", baseLegal: "NR-5", status: "sistema", obs: "Atas e participantes" },
      { num: 41, requisito: "Controle de afastamentos (INSS, acidente, etc.)", baseLegal: "CLT Art. 476", status: "sistema", obs: "Com integração a férias" },
      { num: 42, requisito: "Geração de PPP", baseLegal: "Lei 8.213/91, IN INSS 128", status: "sistema", obs: "PDF consolidado com ASO/EPI/CAT" },
      { num: 43, requisito: "Controle de validade PGR", baseLegal: "NR-1", status: "sistema", obs: "Alertas de renovação" },
      { num: 44, requisito: "Controle de validade PCMSO", baseLegal: "NR-7", status: "sistema", obs: "Alertas de renovação" },
      { num: 45, requisito: "Controle de validade LTCAT", baseLegal: "Lei 8.213/91", status: "sistema", obs: "Alertas de renovação" },
      { num: 46, requisito: "Alertas de vencimento SST", baseLegal: "NR-1, 6, 7", status: "sistema", obs: "ASO (60 dias), EPI (180 dias)" },
    ],
  },
  {
    title: "CADASTRO E DADOS DO FUNCIONÁRIO",
    emoji: "👤",
    items: [
      { num: 47, requisito: "Campos eSocial obrigatórios (S-2200)", baseLegal: "IN RFB", status: "sistema", obs: "CPF, PIS, CTPS, RG, nacionalidade, etc." },
      { num: 48, requisito: "Validação de CPF algorítmica", baseLegal: "IN RFB", status: "sistema", obs: "No cadastro" },
      { num: 49, requisito: "Histórico de cargos/salários", baseLegal: "CLT Art. 461", status: "sistema", obs: "Triggers automáticos" },
      { num: 50, requisito: "Cadastro de dependentes", baseLegal: "IN RFB (eSocial)", status: "sistema", obs: "Para IRRF e benefícios" },
      { num: 51, requisito: "Matrícula automática (MAT-XXXX)", baseLegal: "Portaria 671/2021", status: "sistema", obs: "Gerada por trigger" },
    ],
  },
  {
    title: "DOCUMENTOS E COMUNICADOS",
    emoji: "📄",
    items: [
      { num: 52, requisito: "Retenção de documentos 5 anos (soft-delete)", baseLegal: "CLT Art. 11", status: "sistema", obs: "Todos os módulos" },
      { num: 53, requisito: "Confirmação formal de comunicados", baseLegal: "CLT", status: "sistema", obs: "IP, timestamp, user-agent" },
      { num: 54, requisito: "Trilha de auditoria completa", baseLegal: "LGPD + CLT", status: "sistema", obs: "Todas as ações logadas" },
      { num: 55, requisito: "Gestão documental com versionamento", baseLegal: "CLT", status: "sistema", obs: "Categorias, tags, versões" },
    ],
  },
  {
    title: "TREINAMENTOS",
    emoji: "📚",
    items: [
      { num: 56, requisito: "Registro de treinamentos obrigatórios", baseLegal: "NR-1 a NR-35", status: "sistema", obs: "LMS com NR vinculada" },
      { num: 57, requisito: "Certificados com código de validação", baseLegal: "NR-1", status: "sistema", obs: "Verificação pública" },
      { num: 58, requisito: "Controle de vencimento de treinamentos", baseLegal: "NR-1 Art. 1.7.1", status: "sistema", obs: "Recorrência configurável" },
      { num: 59, requisito: "Lista de presença / assinatura digital", baseLegal: "NR-1", status: "sistema", obs: "IP + User-Agent" },
    ],
  },
  {
    title: "DEPENDE DE SISTEMAS EXTERNOS",
    emoji: "⚠️",
    items: [
      { num: 60, requisito: "Transmissão eSocial (S-2200, S-2206, S-2299...)", baseLegal: "IN RFB", status: "parcial", obs: "Validação interna OK; envio XML requer certificado digital" },
      { num: 61, requisito: "Guia FGTS mensal (SEFIP/GRRF/FGTS Digital)", baseLegal: "Lei 8.036/90", status: "parcial", obs: "Cálculo interno OK; geração requer sistema da Caixa" },
      { num: 62, requisito: "RAIS / DIRF", baseLegal: "Decreto 76.900/75", status: "externo", obs: "RAIS extinta em 2024, substituída pelo eSocial" },
      { num: 63, requisito: "DCTF Web (contribuições previdenciárias)", baseLegal: "IN RFB 2.005/21", status: "externo", obs: "Transmissão via portal e-CAC com certificado digital" },
      { num: 64, requisito: "Emissão de guia GPS/DARF", baseLegal: "IN RFB", status: "externo", obs: "Gerada via e-CAC ou sistema contábil" },
      { num: 65, requisito: "Transmissão da CAT ao INSS", baseLegal: "Lei 8.213/91 Art. 22", status: "externo", obs: "Envio obrigatório pelo portal CAT Web do governo" },
      { num: 66, requisito: "Homologação de rescisão (>1 ano)", baseLegal: "CLT Art. 477", status: "externo", obs: "Presencial no sindicato da categoria" },
    ],
  },
];

const SUMMARY = [
  { cat: "Jornada e Ponto", total: 15, sistema: 15, parcial: 0, externo: 0 },
  { cat: "Remuneração", total: 10, sistema: 10, parcial: 0, externo: 0 },
  { cat: "Férias", total: 6, sistema: 6, parcial: 0, externo: 0 },
  { cat: "Rescisão", total: 5, sistema: 5, parcial: 0, externo: 0 },
  { cat: "SST", total: 10, sistema: 10, parcial: 0, externo: 0 },
  { cat: "Cadastro", total: 5, sistema: 5, parcial: 0, externo: 0 },
  { cat: "Documentos", total: 4, sistema: 4, parcial: 0, externo: 0 },
  { cat: "Treinamentos", total: 4, sistema: 4, parcial: 0, externo: 0 },
  { cat: "Obrigações externas", total: 7, sistema: 0, parcial: 2, externo: 5 },
];

function statusLabel(s: string) {
  if (s === "sistema") return "✅ Sistema";
  if (s === "parcial") return "🔶 Parcial";
  return "❌ Externo";
}

function statusColor(s: string): [number, number, number] {
  if (s === "sistema") return GREEN;
  if (s === "parcial") return ORANGE;
  return RED;
}

export function gerarPdfChecklistConformidade() {
  const doc = new jsPDF({ orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();

  // ── Header
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, pageW, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("Checklist de Conformidade Trabalhista", 14, 13);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema Ativa RH — 66 Requisitos Legais", 14, 20);
  doc.setFontSize(8);
  doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 27);
  doc.setTextColor(0, 0, 0);

  let curY = 38;

  for (const section of SECTIONS) {
    // Check if we need a new page (need at least 40mm for header + first rows)
    if (curY > 250) {
      doc.addPage();
      curY = 15;
    }

    // Section title
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEAL);
    doc.text(`${section.emoji}  ${section.title}`, 14, curY);
    doc.setTextColor(0, 0, 0);
    curY += 3;

    const body = section.items.map((item) => [
      String(item.num),
      item.requisito,
      item.baseLegal,
      statusLabel(item.status),
      item.obs,
    ]);

    autoTable(doc, {
      startY: curY,
      head: [["#", "Requisito Legal", "Base Legal", "Status", "Observação"]],
      body,
      theme: "striped",
      headStyles: { fillColor: TEAL, fontSize: 7, cellPadding: 2 },
      styles: { fontSize: 6.5, cellPadding: 1.5, overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 52 },
        2: { cellWidth: 32 },
        3: { cellWidth: 22, halign: "center" },
        4: { cellWidth: 68 },
      },
      didParseCell: (data) => {
        if (data.column.index === 3 && data.section === "body") {
          const val = String(data.cell.raw);
          if (val.includes("Sistema")) data.cell.styles.textColor = GREEN;
          else if (val.includes("Parcial")) data.cell.styles.textColor = ORANGE;
          else if (val.includes("Externo")) data.cell.styles.textColor = RED;
        }
      },
    });

    curY = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── Summary table
  if (curY > 220) {
    doc.addPage();
    curY = 15;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEAL);
  doc.text("📊  RESUMO", 14, curY);
  doc.setTextColor(0, 0, 0);
  curY += 3;

  const summaryBody = SUMMARY.map((s) => [
    s.cat,
    String(s.total),
    s.sistema > 0 ? String(s.sistema) : "—",
    s.parcial > 0 ? String(s.parcial) : "—",
    s.externo > 0 ? String(s.externo) : "—",
  ]);

  summaryBody.push(["TOTAL", "66", "59 (89%)", "2 (3%)", "5 (8%)"]);

  autoTable(doc, {
    startY: curY,
    head: [["Categoria", "Total", "✅ Sistema", "🔶 Parcial", "❌ Externo"]],
    body: summaryBody,
    theme: "grid",
    headStyles: { fillColor: TEAL, fontSize: 8, cellPadding: 2.5 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45 },
      1: { halign: "center", cellWidth: 18 },
      2: { halign: "center", cellWidth: 28, textColor: GREEN },
      3: { halign: "center", cellWidth: 28, textColor: ORANGE },
      4: { halign: "center", cellWidth: 28, textColor: RED },
    },
    didParseCell: (data) => {
      if (data.rowIndex === summaryBody.length - 1 && data.section === "body") {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [240, 248, 248];
      }
    },
  });

  curY = (doc as any).lastAutoTable.finalY + 8;

  // ── Footer note
  if (curY > 270) {
    doc.addPage();
    curY = 15;
  }
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(
    "O sistema cobre 89% das obrigações trabalhistas de forma autônoma. Os 8% restantes dependem de integração",
    14, curY
  );
  doc.text(
    "com sistemas governamentais (eSocial, FGTS Digital, e-CAC) que exigem certificado digital e-CNPJ.",
    14, curY + 4
  );

  // ── Page footers
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(130, 130, 130);
    doc.text(
      `${COMPANY} · Checklist Conformidade CLT · Página ${i}/${pages}`,
      pageW / 2, 290, { align: "center" }
    );
  }

  doc.save(`Checklist_Conformidade_CLT_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
}
