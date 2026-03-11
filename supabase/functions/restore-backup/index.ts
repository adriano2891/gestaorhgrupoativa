import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Validate admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Token obrigatório" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only super admin can restore
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Apenas Super Admin pode restaurar backups" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const backupData = body.backup;

    if (!backupData || !backupData.metadata || !backupData.dados) {
      return new Response(JSON.stringify({ error: "Arquivo de backup inválido. Esperado JSON com 'metadata' e 'dados'." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify integrity hash
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(backupData.dados));
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    if (backupData.metadata.hash_integridade && hashHex !== backupData.metadata.hash_integridade) {
      return new Response(JSON.stringify({ 
        error: "Falha na verificação de integridade! O arquivo pode ter sido alterado.",
        hash_esperado: backupData.metadata.hash_integridade,
        hash_calculado: hashHex,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Tables safe to restore (order matters for foreign keys)
    const restoreOrder = [
      "cargos", "departamentos", "feriados",
      "profiles",
      "convencoes_coletivas", "categorias_curso",
      "documentos_categorias",
      "clientes_orcamentos", "candidates",
      "cursos", "modulos_curso", "aulas",
      "avaliacoes_curso", "questoes_avaliacao",
      "formularios_rh", "campos_formulario",
      "comunicados", "chamados_suporte",
      "registros_ponto", "comprovantes_ponto",
      "ocorrencias_ponto", "banco_horas",
      "holerites", "afastamentos", "cats", "asos",
      "solicitacoes_ferias", "periodos_aquisitivos",
      "beneficios_funcionario", "dependentes_funcionario",
      "equipamentos",
      "fornecedores", "itens_fornecedor",
      "orcamentos", "itens_orcamento",
      "documentos",
      "matriculas", "certificados",
      "respostas_formulario", "respostas_avaliacao", "progresso_aulas",
      "comunicados_lidos",
      "chamados_mensagens",
    ];

    const resultados: Record<string, { inseridos: number; erros: number; mensagem?: string }> = {};
    let totalInseridos = 0;
    let totalErros = 0;

    for (const tabela of restoreOrder) {
      const rows = backupData.dados[tabela];
      if (!rows || !Array.isArray(rows) || rows.length === 0) continue;

      try {
        // Upsert in batches of 100
        let inseridos = 0;
        let erros = 0;

        for (let i = 0; i < rows.length; i += 100) {
          const batch = rows.slice(i, i + 100);
          const { error } = await supabase
            .from(tabela)
            .upsert(batch, { onConflict: "id", ignoreDuplicates: false });

          if (error) {
            console.warn(`Erro ao restaurar ${tabela} (batch ${i}):`, error.message);
            erros += batch.length;
          } else {
            inseridos += batch.length;
          }
        }

        resultados[tabela] = { inseridos, erros };
        totalInseridos += inseridos;
        totalErros += erros;
      } catch (e: any) {
        resultados[tabela] = { inseridos: 0, erros: rows.length, mensagem: e.message };
        totalErros += rows.length;
      }
    }

    // Log restoration in backup_logs
    await supabase.from("backup_logs").insert({
      tipo: "restauracao",
      status: totalErros === 0 ? "concluido" : "parcial",
      total_registros: totalInseridos,
      hash_sha256: hashHex,
      executado_por: user.id,
      metadata: {
        backup_original: backupData.metadata,
        resultados,
        total_erros: totalErros,
      },
    });

    return new Response(JSON.stringify({
      sucesso: true,
      total_inseridos: totalInseridos,
      total_erros: totalErros,
      tabelas_restauradas: Object.keys(resultados).length,
      detalhes: resultados,
      integridade_verificada: true,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erro na restauração:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
