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

    const hoje = new Date();
    // Referência: mês anterior
    const mesRef = hoje.getMonth() === 0 ? 12 : hoje.getMonth(); // 1-12
    const anoRef = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();

    // 1. Buscar todos os funcionários ativos
    const { data: funcionarios, error: errFunc } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "funcionario");

    if (errFunc) throw errFunc;
    if (!funcionarios || funcionarios.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum funcionário encontrado", notificados: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = funcionarios.map((f: any) => f.user_id);

    // 2. Buscar quem já assinou o espelho do mês anterior
    const { data: assinaturas } = await supabase
      .from("assinaturas_espelho_ponto")
      .select("funcionario_id")
      .eq("mes_referencia", mesRef)
      .eq("ano_referencia", anoRef);

    const jaAssinou = new Set((assinaturas || []).map((a: any) => a.funcionario_id));

    // 3. Filtrar quem NÃO assinou
    const pendentes = userIds.filter((id: string) => !jaAssinou.has(id));

    if (pendentes.length === 0) {
      return new Response(JSON.stringify({ message: "Todos já assinaram", notificados: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nomeMeses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ];

    // 4. Criar notificação para cada funcionário pendente
    const notificacoes = pendentes.map((userId: string) => ({
      titulo: "📝 Assinatura do Espelho de Ponto Pendente",
      mensagem: `Seu espelho de ponto de ${nomeMeses[mesRef - 1]}/${anoRef} ainda não foi assinado. Acesse o Portal > Registro de Ponto > Folhas de Ponto para assinar.`,
      tipo: "lembrete_assinatura",
      prioridade: "alta",
      destinatario_tipo: "individual",
      destinatario_id: userId,
    }));

    // Insert em lotes de 50
    let totalInseridos = 0;
    for (let i = 0; i < notificacoes.length; i += 50) {
      const batch = notificacoes.slice(i, i + 50);
      const { error: errInsert } = await supabase
        .from("notificacoes")
        .insert(batch);
      if (!errInsert) totalInseridos += batch.length;
    }

    const resultado = {
      mes_referencia: `${nomeMeses[mesRef - 1]}/${anoRef}`,
      total_funcionarios: userIds.length,
      ja_assinaram: jaAssinou.size,
      pendentes: pendentes.length,
      notificados: totalInseridos,
      data_execucao: new Date().toISOString(),
    };

    console.log("Lembrete assinatura espelho:", resultado);

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro na função lembrete-assinatura-espelho:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
