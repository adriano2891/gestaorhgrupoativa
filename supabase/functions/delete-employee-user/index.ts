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
      return new Response(JSON.stringify({ error: 'Erro interno ao verificar permissões' }), {
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
        throw new Error('Falha ao remover registros relacionados');
      }
    };

    // Helper: delete from table where column IN (list of ids)
    const deleteByIds = async (table: string, column: string, ids: string[]) => {
      if (!ids.length) return;
      const { error } = await supabaseAdmin.from(table).delete().in(column, ids);
      if (error) {
        console.error(`[delete-employee-user:${requestId}] Failed deleting from ${table}.${column} by ids: ${error.message}`);
        throw new Error('Falha ao remover registros relacionados');
      }
    };

    // 0) Fetch IDs needed for cascading deletes
    const [chamadosRes, atribuicoesRes, docsRes] = await Promise.all([
      supabaseAdmin.from('chamados_suporte').select('id').eq('user_id', user_id),
      supabaseAdmin.from('formulario_atribuicoes').select('id').eq('user_id', user_id),
      supabaseAdmin.from('documentos').select('id').or(`criado_por.eq.${user_id},atualizado_por.eq.${user_id}`),
    ]);

    const chamadoIds = (chamadosRes.data || []).map(c => c.id);
    const atribuicaoIds = (atribuicoesRes.data || []).map(a => a.id);
    const docIds = (docsRes.data || []).map(d => d.id);

    // 1) Delete deepest leaf records in parallel
    await Promise.all([
      deleteByUserId('dependentes_funcionario'),
      deleteByUserId('historico_salarios'),
      deleteByUserId('certificados'),
      deleteByUserId('feedback_curso'),
      deleteByUserId('comunicados_lidos'),
      deleteByUserId('logs_envio_holerites'),
      deleteByUserId('logs_relatorios', 'usuario_id'),
      deleteByUserId('historico_ferias'),
      deleteByUserId('holerites'),
      deleteByUserId('registros_ponto'),
      deleteByUserId('notificacoes_lidas'),
      deleteByUserId('tentativas_avaliacao'),
      deleteByUserId('logs_acesso_curso'),
      deleteByUserId('logs_edicao_ponto', 'employee_id'),
      deleteByUserId('logs_edicao_ponto', 'autorizado_por'),
      deleteByUserId('periodos_aquisitivos'),
      deleteByUserId('matriculas'),
      // Delete all messages in user's chamados (from ANY sender)
      deleteByIds('mensagens_chamado', 'chamado_id', chamadoIds),
      // Also delete messages sent by user in other people's chamados
      deleteByUserId('mensagens_chamado', 'remetente_id'),
      // Delete formulario_respostas before atribuicoes
      deleteByIds('formulario_respostas', 'atribuicao_id', atribuicaoIds),
      // Delete document children by document ID
      deleteByIds('documentos_acessos', 'documento_id', docIds),
      deleteByIds('documentos_comentarios', 'documento_id', docIds),
      deleteByIds('documentos_favoritos', 'documento_id', docIds),
      deleteByIds('documentos_permissoes', 'documento_id', docIds),
      deleteByIds('documentos_versoes', 'documento_id', docIds),
      // Also delete user's own doc interactions
      deleteByUserId('documentos_acessos'),
      deleteByUserId('documentos_comentarios'),
      deleteByUserId('documentos_favoritos'),
      deleteByUserId('documentos_permissoes'),
      deleteByUserId('documentos_versoes', 'criado_por'),
    ]);

    // 2) Delete parent records
    await Promise.all([
      deleteByUserId('chamados_suporte'),
      deleteByUserId('formulario_atribuicoes'),
      deleteByUserId('formularios_rh', 'criado_por'),
      deleteByUserId('formularios_rh', 'aprovado_por'),
      deleteByIds('documentos', 'id', docIds),
      deleteByUserId('solicitacoes_ferias'),
    ]);

    // 3) Remove roles
    await deleteByUserId('user_roles');

    // 3) Remove profile
    const { error: profileDeleteError } = await supabaseAdmin.from('profiles').delete().eq('id', user_id);
    if (profileDeleteError) {
      console.error(`[delete-employee-user:${requestId}] Failed deleting profile: ${profileDeleteError.message}`);
      throw new Error('Falha ao remover o perfil');
    }

    // Finally delete auth user (prevents login)
    const { error: delAuthErr } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    if (delAuthErr) {
      console.error(`[delete-employee-user:${requestId}] Failed deleting auth user: ${delAuthErr.message}`);
      return new Response(JSON.stringify({ error: 'Erro ao remover conta de autenticação' }), {
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
    return new Response(JSON.stringify({ error: 'Erro interno ao processar a solicitação' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
