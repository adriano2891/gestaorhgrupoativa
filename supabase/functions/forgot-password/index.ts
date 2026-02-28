import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { cpf, nomeCompleto } = await req.json();

    if (!cpf || !nomeCompleto || nomeCompleto.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Campos inválidos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up user by CPF
    const { data: users, error: userError } = await supabase
      .from("profiles")
      .select("id, nome")
      .eq("cpf", cpf.replace(/\D/g, ""))
      .limit(1);

    if (userError || !users || users.length === 0) {
      return new Response(JSON.stringify({ error: "CPF não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = users[0].id;

    // Create chamado
    const { error: chamadoError } = await supabase
      .from("chamados_suporte")
      .insert({
        user_id: userId,
        assunto: `Recuperação de Senha - ${nomeCompleto.trim()}`,
        categoria: "outros",
        status: "aberto",
      });

    if (chamadoError) {
      console.error("Erro ao criar chamado:", chamadoError);
      return new Response(JSON.stringify({ error: "Erro ao criar chamado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
