import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdminExport {
  id: string;
  nome: string;
  email: string;
  usuario?: string;
  departamento?: string;
  cargo?: string;
  roles: string[];
  created_at: string;
}

interface AuditoriaEntry {
  acao: string;
  detalhes?: string | null;
  created_at: string;
  ip_address?: string | null;
  admin_id?: string | null;
  executado_por?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Super Admin",
  rh: "Admin RH",
  gestor: "Gestor",
};

export function gerarPdfAdminsAuditoria(admins: AdminExport[], auditoria: AuditoriaEntry[]) {
  const pdf = new jsPDF();
  const pw = pdf.internal.pageSize.getWidth();

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("RELATÓRIO DE ADMINISTRADORES — AUDITORIA TRABALHISTA", pw / 2, 20, { align: "center" });

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}`, pw / 2, 26, { align: "center" });
  pdf.text("CLT Arts. 41, 74 — Portaria MTP nº 671/2021 — Controle de acesso e responsabilidades", pw / 2, 30, { align: "center" });
  pdf.line(14, 33, pw - 14, 33);

  // Summary
  let y = 38;
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("ADMINISTRADORES ATIVOS", 14, y);

  autoTable(pdf, {
    startY: y + 3,
    head: [["Nome", "Email", "Usuário", "Função", "Departamento", "Cargo", "Criado em"]],
    body: admins.map(a => [
      a.nome,
      a.email,
      a.usuario || "—",
      a.roles.map(r => ROLE_LABELS[r] || r).join(", "),
      a.departamento || "—",
      a.cargo || "—",
      format(new Date(a.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
    ]),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [30, 30, 30] },
  });

  if (auditoria.length > 0) {
    const lastY = (pdf as any).lastAutoTable?.finalY || 80;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("TRILHA DE AUDITORIA — ALTERAÇÕES ADMINISTRATIVAS", 14, lastY + 10);

    autoTable(pdf, {
      startY: lastY + 14,
      head: [["Data/Hora", "Ação", "Detalhes", "IP"]],
      body: auditoria.map(a => [
        format(new Date(a.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR }),
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
      `Página ${i}/${pageCount} — Relatório para fins de auditoria trabalhista — Retenção obrigatória 5 anos`,
      pw / 2, pdf.internal.pageSize.getHeight() - 8, { align: "center" }
    );
  }

  pdf.save(`relatorio_admins_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
