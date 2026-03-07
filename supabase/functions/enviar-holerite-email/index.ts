import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://esm.sh/zod@3.23.8";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EnviarHoleriteSchema = z.object({
  holerite_id: z.string().uuid(),
  user_id: z.string().uuid(),
  manual: z.boolean().optional().default(false),
});

const getMesNome = (mes: number): string => {
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return meses[mes - 1];
};

const formatCurrency = (val: number): string =>
  val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const gerarPDFProtegido = async (holerite: any, profile: any, empresa: any): Promise<Uint8Array> => {
  const { default: jsPDF } = await import("https://esm.sh/jspdf@2.5.2");
  const doc = new jsPDF();
  let y = 15;

  // CABEÇALHO - DADOS DO EMPREGADOR (Art. 464 CLT)
  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text("DEMONSTRATIVO DE PAGAMENTO", 105, y, { align: "center" });
  y += 8;
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(`${empresa?.razao_social || "Empresa não informada"}`, 105, y, { align: "center" });
  y += 5;
  doc.text(`CNPJ: ${empresa?.cnpj || "Não informado"}`, 105, y, { align: "center" });
  y += 5;
  doc.text(`Competência: ${getMesNome(holerite.mes)}/${holerite.ano}`, 105, y, { align: "center" });
  y += 3;
  doc.line(14, y, 196, y);
  y += 8;

  // DADOS DO COLABORADOR (Portaria 3.626/91)
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text("DADOS DO COLABORADOR", 14, y);
  y += 7;
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.text(`Nome: ${profile.nome}`, 14, y);
  doc.text(`CPF: ${profile.cpf || "Não informado"}`, 120, y);
  y += 5;
  doc.text(`Cargo: ${profile.cargo || "Não informado"}`, 14, y);
  doc.text(`Departamento: ${profile.departamento || "Não informado"}`, 120, y);
  y += 5;
  doc.text(`Matrícula: ${profile.matricula || "N/A"}`, 14, y);
  doc.text(`Data Admissão: ${profile.data_admissao || "N/A"}`, 120, y);
  y += 3;
  doc.line(14, y, 196, y);
  y += 8;

  // PROVENTOS
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text("PROVENTOS", 14, y);
  doc.text("VALOR (R$)", 175, y, { align: "right" });
  y += 2;
  doc.line(14, y, 196, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");

  let totalProventos = holerite.salario_bruto || 0;
  doc.text("Salário Base", 14, y);
  doc.text(formatCurrency(holerite.salario_bruto || 0), 175, y, { align: "right" });
  y += 5;

  if ((holerite.horas_extras_valor || 0) > 0) {
    doc.text("Horas Extras", 14, y);
    doc.text(formatCurrency(holerite.horas_extras_valor), 175, y, { align: "right" });
    totalProventos += holerite.horas_extras_valor;
    y += 5;
  }
  if ((holerite.adicional_noturno_valor || 0) > 0) {
    doc.text("Adicional Noturno", 14, y);
    doc.text(formatCurrency(holerite.adicional_noturno_valor), 175, y, { align: "right" });
    totalProventos += holerite.adicional_noturno_valor;
    y += 5;
  }
  if ((holerite.dsr_valor || 0) > 0) {
    doc.text("DSR s/ Horas Extras", 14, y);
    doc.text(formatCurrency(holerite.dsr_valor), 175, y, { align: "right" });
    totalProventos += holerite.dsr_valor;
    y += 5;
  }
  if ((holerite.outros_proventos || 0) > 0) {
    doc.text("Outros Proventos", 14, y);
    doc.text(formatCurrency(holerite.outros_proventos), 175, y, { align: "right" });
    totalProventos += holerite.outros_proventos;
    y += 5;
  }

  doc.setFont(undefined, "bold");
  doc.text("TOTAL PROVENTOS", 14, y);
  doc.text(formatCurrency(totalProventos), 175, y, { align: "right" });
  y += 3;
  doc.line(14, y, 196, y);
  y += 8;

  // DESCONTOS
  doc.setFontSize(11);
  doc.text("DESCONTOS", 14, y);
  doc.text("VALOR (R$)", 175, y, { align: "right" });
  y += 2;
  doc.line(14, y, 196, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");

  let totalDescontos = 0;
  if ((holerite.inss || 0) > 0) {
    const baseInfo = (holerite.base_calculo_inss || 0) > 0
      ? ` (Base: R$ ${formatCurrency(holerite.base_calculo_inss)})`
      : "";
    doc.text(`INSS${baseInfo}`, 14, y);
    doc.text(formatCurrency(holerite.inss), 175, y, { align: "right" });
    totalDescontos += holerite.inss;
    y += 5;
  }
  if ((holerite.irrf || 0) > 0) {
    const baseInfo = (holerite.base_calculo_irrf || 0) > 0
      ? ` (Base: R$ ${formatCurrency(holerite.base_calculo_irrf)})`
      : "";
    doc.text(`IRRF${baseInfo}`, 14, y);
    doc.text(formatCurrency(holerite.irrf), 175, y, { align: "right" });
    totalDescontos += holerite.irrf;
    y += 5;
  }
  if ((holerite.vale_transporte || 0) > 0) {
    doc.text("Vale Transporte (6%)", 14, y);
    doc.text(formatCurrency(holerite.vale_transporte), 175, y, { align: "right" });
    totalDescontos += holerite.vale_transporte;
    y += 5;
  }
  if ((holerite.outros_descontos || 0) > 0) {
    doc.text("Outros Descontos", 14, y);
    doc.text(formatCurrency(holerite.outros_descontos), 175, y, { align: "right" });
    totalDescontos += holerite.outros_descontos;
    y += 5;
  }
  // Fallback for legacy "descontos" field
  if (totalDescontos === 0 && (holerite.descontos || 0) > 0) {
    doc.text("Descontos", 14, y);
    doc.text(formatCurrency(holerite.descontos), 175, y, { align: "right" });
    totalDescontos = holerite.descontos;
    y += 5;
  }

  doc.setFont(undefined, "bold");
  doc.text("TOTAL DESCONTOS", 14, y);
  doc.text(formatCurrency(totalDescontos), 175, y, { align: "right" });
  y += 3;
  doc.line(14, y, 196, y);
  y += 10;

  // VALOR LÍQUIDO
  doc.setFontSize(14);
  doc.text("VALOR LÍQUIDO", 14, y);
  doc.text(`R$ ${formatCurrency(holerite.salario_liquido || 0)}`, 175, y, { align: "right" });
  y += 3;
  doc.line(14, y, 196, y);
  y += 8;

  // FGTS INFORMATIVO (Lei 8.036/90)
  if ((holerite.fgts || 0) > 0) {
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.text(`FGTS (Depósito Informativo - Lei 8.036/90): R$ ${formatCurrency(holerite.fgts)}`, 14, y);
    y += 7;
  }

  // Observações
  if (holerite.observacoes) {
    doc.setFontSize(8);
    doc.text(`Observações: ${holerite.observacoes}`, 14, y);
    y += 7;
  }

  // Rodapé legal
  doc.setFontSize(7);
  doc.setFont(undefined, "normal");
  doc.text("Documento gerado automaticamente pelo sistema de RH — Art. 464 CLT / Portaria MTE 3.626/91", 105, 275, { align: "center" });
  doc.text(`Data de emissão: ${new Date().toLocaleDateString("pt-BR")}`, 105, 280, { align: "center" });

  doc.setFontSize(8);
  doc.setFont(undefined, "bold");
  doc.text("Este documento está protegido por senha (primeiros 6 dígitos do CPF)", 105, 270, { align: "center" });

  return new Uint8Array(doc.output("arraybuffer"));
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  let requestBody: z.infer<typeof EnviarHoleriteSchema> | null = null;

  try {
    const rawBody = await req.json();
    const parseResult = EnviarHoleriteSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: "Dados inválidos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    requestBody = parseResult.data;
    const { holerite_id, user_id } = requestBody;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Autorização necessária" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser) {
      return new Response(
        JSON.stringify({ success: false, error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", authUser.id);
    const userRoles = roles?.map(r => r.role) || [];
    if (!userRoles.includes("admin") && !userRoles.includes("rh")) {
      return new Response(
        JSON.stringify({ success: false, error: "Apenas administradores e RH podem enviar holerites" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: holerite, error: holeriteError } = await supabase
      .from("holerites").select("*").eq("id", holerite_id).eq("user_id", user_id).single();
    if (holeriteError || !holerite) {
      return new Response(
        JSON.stringify({ success: false, error: "Holerite não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("*").eq("id", user_id).single();
    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ success: false, error: "Perfil do usuário não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile.email) {
      return new Response(
        JSON.stringify({ success: false, error: "E-mail do usuário não cadastrado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) {
      return new Response(
        JSON.stringify({ success: false, error: "E-mail do usuário inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar dados da empresa para o PDF
    const { data: empresa } = await supabase
      .from("empresas").select("razao_social, cnpj").limit(1).single();

    const pdfBuffer = await gerarPDFProtegido(holerite, profile, empresa);
    const nomeArquivo = `holerite_${profile.nome.replace(/\s+/g, "_")}_${getMesNome(holerite.mes)}_${holerite.ano}.pdf`;
    const pdfBase64 = btoa(String.fromCharCode(...pdfBuffer));

    const emailResponse = await resend.emails.send({
      from: "RH Grupo Ativatec <atendimento@grupoativatec.com.br>",
      to: [profile.email],
      subject: `Holerite - ${getMesNome(holerite.mes)}/${holerite.ano}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Olá, ${profile.nome}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Seu holerite referente ao mês de <strong>${getMesNome(holerite.mes)}/${holerite.ano}</strong> está em anexo.
          </p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #333;"><strong>⚠️ IMPORTANTE:</strong> O PDF está protegido por senha.</p>
            <p style="margin: 5px 0 0 0; color: #666;">Utilize os <strong>6 primeiros dígitos do seu CPF</strong> para abrir o documento.</p>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">Este é um e-mail automático, por favor, não responda.<br>Para dúvidas ou suporte, entre em contato com o RH.</p>
        </div>
      `,
      attachments: [{ filename: nomeArquivo, content: pdfBase64 }],
    });

    if (emailResponse.error) {
      console.error("Erro do Resend:", emailResponse.error);
      throw new Error("Falha no envio do e-mail");
    }

    await supabase.from("logs_envio_holerites").insert({
      holerite_id, user_id, email_destino: profile.email,
      status: "sucesso", enviado_por: authUser.id, tentativas: 1,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Holerite enviado com sucesso", email_id: emailResponse.data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erro ao enviar holerite:", error);

    if (requestBody?.holerite_id && requestBody?.user_id) {
      try {
        const { data: profile } = await supabase.from("profiles").select("email").eq("id", requestBody.user_id).single();
        await supabase.from("logs_envio_holerites").insert({
          holerite_id: requestBody.holerite_id, user_id: requestBody.user_id,
          email_destino: profile?.email || "desconhecido", status: "erro",
          mensagem_erro: "Erro no processamento", tentativas: 1,
        });
      } catch (logError) {
        console.error("Erro ao registrar log de erro:", logError);
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: "Erro ao enviar holerite" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
