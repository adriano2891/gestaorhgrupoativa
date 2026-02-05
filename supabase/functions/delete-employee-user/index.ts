import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error(`[delete-employee-user:${requestId}] Missing Authorization header`);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error(
        `[delete-employee-user:${requestId}] auth.getUser failed: ${authError?.message ?? 'no-user'}`,
      );
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Admin client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Authorize: only admin or rh can delete employees
    const { data: roleRows, error: roleErr } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'rh']);

    if (roleErr) {
      console.error(`[delete-employee-user:${requestId}] Role query error: ${roleErr.message}`);
      return new Response(JSON.stringify({ error: roleErr.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!roleRows || roleRows.length === 0) {
      console.error(`[delete-employee-user:${requestId}] Forbidden: user ${user.id} has no admin/rh role`);
      return new Response(JSON.stringify({ error: 'Only admins can delete employees' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const body = await req.json().catch(() => null);
    const user_id: string | undefined = body?.user_id;
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id é obrigatório' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const deleteByUserId = async (table: string, column: string = 'user_id') => {
      const { error } = await supabaseAdmin.from(table).delete().eq(column, user_id);
      if (error) {
        console.error(`[delete-employee-user:${requestId}] Failed deleting from ${table}.${column}: ${error.message}`);
        throw new Error(`Falha ao remover registros relacionados (${table}): ${error.message}`);
      }
    };

    // 1) Delete dependent/child records that commonly reference profiles.id
    // NOTE: This prevents silent failures where the profile delete is blocked by FK constraints.
    await deleteByUserId('dependentes_funcionario');
    await deleteByUserId('historico_salarios');
    await deleteByUserId('certificados');
    await deleteByUserId('matriculas');
    await deleteByUserId('feedback_curso');
    await deleteByUserId('comunicados_lidos');
    await deleteByUserId('logs_envio_holerites');
    await deleteByUserId('logs_relatorios', 'usuario_id');
    await deleteByUserId('historico_ferias');
    await deleteByUserId('formularios_rh', 'criado_por');
    await deleteByUserId('formularios_rh', 'aprovado_por');
    await deleteByUserId('formulario_atribuicoes');
    await deleteByUserId('documentos', 'criado_por');
    await deleteByUserId('documentos', 'atualizado_por');
    await deleteByUserId('documentos_acessos');
    await deleteByUserId('documentos_comentarios');
    await deleteByUserId('documentos_favoritos');
    await deleteByUserId('documentos_permissoes');
    await deleteByUserId('holerites');

    // 2) Remove roles
    await deleteByUserId('user_roles');

    // 3) Remove profile
    const { error: profileDeleteError } = await supabaseAdmin.from('profiles').delete().eq('id', user_id);
    if (profileDeleteError) {
      console.error(`[delete-employee-user:${requestId}] Failed deleting profile: ${profileDeleteError.message}`);
      throw new Error(`Falha ao remover o perfil: ${profileDeleteError.message}`);
    }

    // Finally delete auth user (prevents login)
    const { error: delAuthErr } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    if (delAuthErr) {
      // The DB rows are already gone; report but keep success false to prompt operator action.
      console.error(`[delete-employee-user:${requestId}] Failed deleting auth user: ${delAuthErr.message}`);
      return new Response(JSON.stringify({ error: delAuthErr.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`[delete-employee-user] Unhandled error: ${message}`);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
