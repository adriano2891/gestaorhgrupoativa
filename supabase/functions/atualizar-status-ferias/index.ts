import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const hoje = new Date().toISOString().split("T")[0];

    // 1. Aprovado → Em Andamento: data_inicio <= hoje AND data_fim >= hoje
    const { data: paraAndamento, error: err1 } = await supabase
      .from("solicitacoes_ferias")
      .update({ status: "em_andamento" })
      .eq("status", "aprovado")
      .lte("data_inicio", hoje)
      .gte("data_fim", hoje)
      .select("id, user_id");

    if (err1) console.error("Erro ao atualizar para em_andamento:", err1);

    // Update profile status to "Em férias" for employees starting vacation
    if (paraAndamento && paraAndamento.length > 0) {
      const userIds = paraAndamento.map((s: any) => s.user_id);
      const { error: errProfile1 } = await supabase
        .from("profiles")
        .update({ status: "em_ferias" })
        .in("id", userIds);
      if (errProfile1) console.error("Erro ao atualizar perfil para em_ferias:", errProfile1);
    }

    // 2. Em Andamento → Concluído: data_fim < hoje
    const { data: paraConcluido, error: err2 } = await supabase
      .from("solicitacoes_ferias")
      .update({ status: "concluido" })
      .eq("status", "em_andamento")
      .lt("data_fim", hoje)
      .select("id, user_id");

    if (err2) console.error("Erro ao atualizar para concluido:", err2);

    // Restore profile status to "ativo" for employees finishing vacation
    if (paraConcluido && paraConcluido.length > 0) {
      const userIds = paraConcluido.map((s: any) => s.user_id);
      const { error: errProfile2 } = await supabase
        .from("profiles")
        .update({ status: "ativo" })
        .in("id", userIds);
      if (errProfile2) console.error("Erro ao restaurar perfil para ativo:", errProfile2);
    }

    const resultado = {
      atualizados_em_andamento: paraAndamento?.length || 0,
      atualizados_concluido: paraConcluido?.length || 0,
      data_execucao: new Date().toISOString(),
    };

    console.log("Atualização de status de férias:", resultado);

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro na função atualizar-status-ferias:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
