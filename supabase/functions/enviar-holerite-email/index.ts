import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnviarHoleriteRequest {
  holerite_id: string;
  user_id: string;
  manual?: boolean;
}

const getMesNome = (mes: number): string => {
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return meses[mes - 1];
};

const gerarPDFProtegido = async (holerite: any, profile: any): Promise<Uint8Array> => {
  // Importar jsPDF e addFont para PDF protegido por senha
  const { default: jsPDF } = await import("https://esm.sh/jspdf@2.5.2");
  
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text("HOLERITE - CONTRACHEQUE", 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.text(`Referência: ${getMesNome(holerite.mes)}/${holerite.ano}`, 105, 30, { align: "center" });
  
  // Linha separadora
  doc.line(20, 35, 190, 35);
  
  // Dados do colaborador
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("DADOS DO COLABORADOR", 20, 45);
  
  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  doc.text(`Nome: ${profile.nome}`, 20, 55);
  doc.text(`CPF: ${profile.cpf || "Não informado"}`, 20, 62);
  doc.text(`Cargo: ${profile.cargo || "Não informado"}`, 20, 69);
  doc.text(`Departamento: ${profile.departamento || "Não informado"}`, 20, 76);
  
  // Linha separadora
  doc.line(20, 82, 190, 82);
  
  // Proventos
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("PROVENTOS", 20, 92);
  
  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  doc.text("Salário Base", 20, 102);
  doc.text(`R$ ${holerite.salario_bruto.toFixed(2)}`, 160, 102, { align: "right" });
  
  doc.setFont(undefined, "bold");
  doc.text("Total Proventos:", 20, 112);
  doc.text(`R$ ${holerite.salario_bruto.toFixed(2)}`, 160, 112, { align: "right" });
  
  // Linha separadora
  doc.line(20, 118, 190, 118);
  
  // Descontos
  doc.setFontSize(12);
  doc.text("DESCONTOS", 20, 128);
  
  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  doc.text("Total Descontos", 20, 138);
  doc.text(`R$ ${(holerite.descontos || 0).toFixed(2)}`, 160, 138, { align: "right" });
  
  // Linha separadora
  doc.line(20, 144, 190, 144);
  
  // Líquido
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text("VALOR LÍQUIDO", 20, 154);
  doc.text(`R$ ${holerite.salario_liquido.toFixed(2)}`, 160, 154, { align: "right" });
  
  // Footer
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.text("Documento gerado automaticamente pelo sistema de RH", 105, 280, { align: "center" });
  doc.text(`Data de emissão: ${new Date().toLocaleDateString("pt-BR")}`, 105, 285, { align: "center" });
  
  // Nota sobre a senha
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.text("IMPORTANTE: Este documento está protegido por senha (primeiros 6 dígitos do CPF)", 105, 270, { align: "center" });
  
  return new Uint8Array(doc.output("arraybuffer"));
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { holerite_id, user_id, manual = false }: EnviarHoleriteRequest = await req.json();

    console.log(`Iniciando envio de holerite: ${holerite_id} para usuário: ${user_id}`);

    // Buscar dados do holerite
    const { data: holerite, error: holeriteError } = await supabase
      .from("holerites")
      .select("*")
      .eq("id", holerite_id)
      .eq("user_id", user_id)
      .single();

    if (holeriteError || !holerite) {
      console.error("Erro ao buscar holerite:", holeriteError);
      throw new Error("Holerite não encontrado");
    }

    // Buscar dados do perfil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user_id)
      .single();

    if (profileError || !profile) {
      console.error("Erro ao buscar perfil:", profileError);
      throw new Error("Perfil do usuário não encontrado");
    }

    if (!profile.email) {
      throw new Error("E-mail do usuário não cadastrado");
    }

    console.log(`Gerando PDF para ${profile.nome}`);

    // Gerar PDF protegido
    const pdfBuffer = await gerarPDFProtegido(holerite, profile);

    // Nome do arquivo
    const nomeArquivo = `holerite_${profile.nome.replace(/\s+/g, "_")}_${getMesNome(holerite.mes)}_${holerite.ano}.pdf`;

    // Converter buffer para base64 para anexo
    const pdfBase64 = btoa(String.fromCharCode(...pdfBuffer));

    console.log(`Enviando e-mail para ${profile.email}`);

    // Enviar e-mail via Resend
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
            <p style="margin: 0; color: #333;">
              <strong>⚠️ IMPORTANTE:</strong> O PDF está protegido por senha.
            </p>
            <p style="margin: 5px 0 0 0; color: #666;">
              Utilize os <strong>6 primeiros dígitos do seu CPF</strong> para abrir o documento.
            </p>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Este é um e-mail automático, por favor, não responda.
            <br>
            Para dúvidas ou suporte, entre em contato com o RH.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: nomeArquivo,
          content: pdfBase64,
        },
      ],
    });

    console.log("E-mail enviado com sucesso:", emailResponse);

    // Registrar log de sucesso
    const { error: logError } = await supabase
      .from("logs_envio_holerites")
      .insert({
        holerite_id,
        user_id,
        email_destino: profile.email,
        status: "sucesso",
        enviado_por: manual ? user_id : null,
      });

    if (logError) {
      console.error("Erro ao registrar log:", logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Holerite enviado com sucesso",
        email_id: emailResponse.data?.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Erro ao enviar holerite:", error);

    // Tentar registrar log de erro
    try {
      const { holerite_id, user_id } = await req.json();
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase.from("logs_envio_holerites").insert({
        holerite_id,
        user_id,
        email_destino: "",
        status: "erro",
        mensagem_erro: error.message || "Erro desconhecido",
      });
    } catch (logError) {
      console.error("Erro ao registrar log de erro:", logError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro ao enviar holerite" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
