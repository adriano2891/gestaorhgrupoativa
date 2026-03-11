import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tables to backup (excluding Portal do Funcionário specific data)
const BACKUP_TABLES = [
  "profiles", "user_roles", "cargos", "departamentos",
  "registros_ponto", "ocorrencias_ponto", "comprovantes_ponto",
  "assinaturas_espelho_ponto", "audit_trail_ponto", "logs_edicao_ponto",
  "banco_horas", "sobreaviso",
  "solicitacoes_ferias", "periodos_aquisitivos", "historico_ferias",
  "holerites", "logs_envio_holerites",
  "comunicados", "comunicados_lidos", "comunicados_auditoria",
  "afastamentos", "cats", "asos",
  "cursos", "modulos_curso", "aulas", "matriculas", "avaliacoes_curso",
  "questoes_avaliacao", "respostas_avaliacao", "certificados",
  "categorias_curso", "cursos_auditoria", "progresso_aulas",
  "documentos", "documentos_categorias", "documentos_acessos", "documentos_auditoria",
  "formularios_rh", "campos_formulario", "respostas_formulario",
  "chamados_suporte", "chamados_mensagens", "chamados_auditoria",
  "beneficios_funcionario", "dependentes_funcionario",
  "convencoes_coletivas", "historico_cargos", "historico_salarios",
  "feriados", "candidates",
  "clientes_orcamentos", "orcamentos", "itens_orcamento",
  "fornecedores", "itens_fornecedor", "historico_precos_fornecedor",
  "equipamentos",
  "cipa_membros", "cipa_reunioes", "cipa_reuniao_participantes",
  "admins_auditoria", "backup_logs",
  "notificacoes_admin", "gestor_permissions",
  "logs_alteracao_escala", "documentos_permissoes",
  "eventos_agenda",
];

const EXCLUDED_TABLES = [
  "portal_sessions", "portal_cache", "portal_temp",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate admin authorization
    const authHeader = req.headers.get("Authorization");
    let executadoPor: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Não autorizado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "rh"]);

      if (!roles || roles.length === 0) {
        return new Response(JSON.stringify({ error: "Acesso restrito a administradores" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      executadoPor = user.id;
    }

    const body = await req.json().catch(() => ({}));
    const tipo = body.tipo || "completo";
    const download = body.download || false;

    // Create log entry
    const { data: logEntry, error: logError } = await supabase
      .from("backup_logs")
      .insert({
        tipo,
        status: "em_andamento",
        executado_por: executadoPor,
        tabelas_excluidas: EXCLUDED_TABLES,
      })
      .select("id")
      .single();

    const logId = logEntry?.id;

    // Backup all tables
    const backupData: Record<string, any[]> = {};
    const tabelasIncluidas: string[] = [];
    let totalRegistros = 0;

    for (const table of BACKUP_TABLES) {
      try {
        let allRows: any[] = [];
        let offset = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from(table)
            .select("*")
            .range(offset, offset + pageSize - 1);

          if (error) {
            console.warn(`Tabela ${table} não encontrada ou erro: ${error.message}`);
            hasMore = false;
            break;
          }

          if (data && data.length > 0) {
            allRows = allRows.concat(data);
            offset += pageSize;
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        if (allRows.length > 0) {
          backupData[table] = allRows;
          tabelasIncluidas.push(table);
          totalRegistros += allRows.length;
        }
      } catch (e) {
        console.warn(`Erro ao exportar tabela ${table}:`, e);
      }
    }

    // Build backup payload
    const now = new Date();
    const backupPayload = {
      metadata: {
        tipo_backup: tipo,
        versao: "2.0",
        sistema: "GRUPO ATIVA - GESTÃO INTEGRADA",
        gerado_em: now.toISOString(),
        total_tabelas: tabelasIncluidas.length,
        total_registros: totalRegistros,
        tabelas_incluidas: tabelasIncluidas,
        tabelas_excluidas: EXCLUDED_TABLES,
        exclusoes: ["Portal do Funcionário", "Caches", "Temporários"],
        hash_integridade: "",
      },
      dados: backupData,
    };

    // Generate SHA-256 hash
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(backupPayload.dados));
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    backupPayload.metadata.hash_integridade = hashHex;

    const backupContent = JSON.stringify(backupPayload, null, 2);
    const tamanhoBytes = new TextEncoder().encode(backupContent).length;

    // Store in Supabase Storage
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toISOString().split("T")[1].replace(/:/g, "-").split(".")[0];
    const fileName = `backup-${tipo}-${dateStr}_${timeStr}.json`;
    const storagePath = `backups/${tipo}/${dateStr}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("sst-documentos")
      .upload(storagePath, new Blob([backupContent], { type: "application/json" }), {
        contentType: "application/json",
        upsert: false,
      });

    const duracaoMs = Date.now() - startTime;

    // Update log entry
    if (logId) {
      await supabase.from("backup_logs").update({
        status: uploadError ? "erro" : "concluido",
        arquivo_path: uploadError ? null : storagePath,
        tamanho_bytes: tamanhoBytes,
        hash_sha256: hashHex,
        tabelas_incluidas: tabelasIncluidas,
        total_registros: totalRegistros,
        duracao_ms: duracaoMs,
        erro: uploadError ? uploadError.message : null,
        updated_at: new Date().toISOString(),
      }).eq("id", logId);
    }

    // Retention policy: cleanup old backups
    await cleanupOldBackups(supabase);

    if (download) {
      return new Response(backupContent, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    }

    return new Response(JSON.stringify({
      sucesso: true,
      id: logId,
      tipo,
      arquivo: storagePath,
      tamanho_bytes: tamanhoBytes,
      total_tabelas: tabelasIncluidas.length,
      total_registros: totalRegistros,
      hash_sha256: hashHex,
      duracao_ms: duracaoMs,
      upload_status: uploadError ? `Erro: ${uploadError.message}` : "OK",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erro no backup:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function cleanupOldBackups(supabase: any) {
  try {
    const now = new Date();
    const retentionDays: Record<string, number> = {
      snapshot: 7,
      incremental: 30,
      completo: 90,
    };

    for (const [tipo, days] of Object.entries(retentionDays)) {
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      // Delete old log entries
      await supabase
        .from("backup_logs")
        .delete()
        .eq("tipo", tipo)
        .lt("created_at", cutoff.toISOString());
    }
  } catch (e) {
    console.warn("Erro na limpeza de backups antigos:", e);
  }
}
