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

    // Validate admin authorization
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const supabaseAnon = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!
      );
      const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Não autorizado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check admin role
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
    }

    const body = await req.json().catch(() => ({}));
    const mes = body.mes || new Date().getMonth() + 1;
    const ano = body.ano || new Date().getFullYear();

    const startDate = `${ano}-${String(mes).padStart(2, "0")}-01`;
    const daysInMonth = new Date(ano, mes, 0).getDate();
    const endDate = `${ano}-${String(mes).padStart(2, "0")}-${daysInMonth}`;

    // 1. Fetch all time records for the period
    const { data: registros, error: errReg } = await supabase
      .from("registros_ponto")
      .select("*")
      .gte("data", startDate)
      .lte("data", endDate)
      .order("data", { ascending: true });

    if (errReg) throw errReg;

    // 2. Fetch employee profiles
    const userIds = [...new Set((registros || []).map((r: any) => r.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nome, cpf, cargo, departamento, data_admissao")
      .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

    // 3. Fetch audit trail for the period
    const { data: auditTrail } = await supabase
      .from("audit_trail_ponto")
      .select("*")
      .gte("created_at", `${startDate}T00:00:00`)
      .lte("created_at", `${endDate}T23:59:59`)
      .order("created_at", { ascending: true });

    // 4. Fetch edit logs
    const { data: editLogs } = await supabase
      .from("logs_edicao_ponto")
      .select("*")
      .gte("data_registro", startDate)
      .lte("data_registro", endDate)
      .order("created_at", { ascending: true });

    // 5. Fetch signatures
    const { data: assinaturas } = await supabase
      .from("assinaturas_espelho_ponto")
      .select("*")
      .eq("mes_referencia", mes)
      .eq("ano_referencia", ano);

    // 6. Fetch occurrences
    const { data: ocorrencias } = await supabase
      .from("ocorrencias_ponto")
      .select("*")
      .gte("data", startDate)
      .lte("data", endDate);

    // 7. Generate integrity hash for the backup
    const backupPayload = {
      metadata: {
        tipo: "BACKUP_REGISTROS_PONTO",
        versao: "1.0",
        empresa: "GRUPO ATIVA ADMINISTRADORA",
        cnpj: "42.523.488/0001-81",
        periodo: { mes, ano, inicio: startDate, fim: endDate },
        gerado_em: new Date().toISOString(),
        total_registros: (registros || []).length,
        total_funcionarios: userIds.length,
        total_assinaturas: (assinaturas || []).length,
        total_ocorrencias: (ocorrencias || []).length,
        total_logs_edicao: (editLogs || []).length,
        total_audit_trail: (auditTrail || []).length,
      },
      funcionarios: profiles || [],
      registros_ponto: registros || [],
      assinaturas_espelho: assinaturas || [],
      ocorrencias_ponto: ocorrencias || [],
      logs_edicao: editLogs || [],
      audit_trail: auditTrail || [],
    };

    // Generate SHA-256 hash of the backup content
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(backupPayload));
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    backupPayload.metadata["hash_integridade"] = hashHex;

    // 8. Store backup in storage bucket
    const fileName = `backup-ponto-${ano}-${String(mes).padStart(2, "0")}-${Date.now()}.json`;
    const backupContent = JSON.stringify(backupPayload, null, 2);

    // Try to upload to storage (create bucket if needed)
    const { error: uploadError } = await supabase.storage
      .from("sst-documentos")
      .upload(`backups-ponto/${fileName}`, new Blob([backupContent], { type: "application/json" }), {
        contentType: "application/json",
        upsert: false,
      });

    // 9. Log the backup in audit trail
    await supabase.from("audit_trail_ponto").insert({
      user_id: "00000000-0000-0000-0000-000000000000",
      acao: "backup_registros",
      detalhes: {
        tipo: "backup_independente",
        periodo: `${mes}/${ano}`,
        total_registros: (registros || []).length,
        hash_integridade: hashHex,
        arquivo: uploadError ? "falha_upload" : fileName,
        portaria_671: "Art. 80 - Backup independente dos dados de ponto",
      },
      user_agent: "Edge Function - backup-registros-ponto",
    });

    const resultado = {
      sucesso: true,
      periodo: `${String(mes).padStart(2, "0")}/${ano}`,
      total_registros: (registros || []).length,
      total_funcionarios: userIds.length,
      total_assinaturas: (assinaturas || []).length,
      hash_integridade: hashHex,
      arquivo: uploadError ? null : fileName,
      upload_status: uploadError ? `Erro: ${uploadError.message}` : "Salvo com sucesso",
      data_execucao: new Date().toISOString(),
    };

    console.log("Backup registros de ponto:", resultado);

    // Return backup data for download
    if (body.download) {
      return new Response(backupContent, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    }

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro na função backup-registros-ponto:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
