import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type DependenteInput = {
  nome: string;
  idade?: number | null;
  tipo_dependencia: string;
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Client with user context (to validate who is calling)
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

    // Authorize: only admin or rh can create employees
    const { data: roleRows, error: roleErr } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'rh']);

    if (roleErr) {
      return new Response(JSON.stringify({ error: roleErr.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!roleRows || roleRows.length === 0) {
      return new Response(JSON.stringify({ error: 'Only admins can create employees' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const {
      email,
      password,
      nome,
      cpf,
      telefone,
      cargo,
      departamento,
      status,
      salario,
      data_nascimento,
      dependentes,
    }: {
      email: string;
      password: string;
      nome: string;
      cpf?: string | null;
      telefone?: string | null;
      cargo?: string | null;
      departamento?: string | null;
      status?: 'ativo' | 'afastado' | 'demitido' | null;
      salario?: number | null;
      data_nascimento?: string | null;
      dependentes?: DependenteInput[] | null;
    } = await req.json();

    if (!email || !password || !nome) {
      return new Response(JSON.stringify({ error: 'Nome, email e senha são obrigatórios' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nome,
        cpf: cpf ?? null,
        telefone: telefone ?? null,
        cargo: cargo ?? null,
        departamento: departamento ?? null,
        data_nascimento: data_nascimento ?? null,
      },
    });

    if (createErr || !created?.user) {
      return new Response(JSON.stringify({ error: createErr?.message ?? 'Erro ao criar usuário' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const userId = created.user.id;

    // Upsert profile with full data
    const { error: profileErr } = await supabaseAdmin.from('profiles').upsert({
      id: userId,
      nome,
      email,
      cpf: cpf ?? null,
      telefone: telefone ?? null,
      cargo: cargo ?? null,
      departamento: departamento ?? null,
      status: status ?? 'ativo',
      salario: salario ?? null,
      data_nascimento: data_nascimento ?? null,
    });

    if (profileErr) {
      // Rollback: delete auth user if profile failed
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: profileErr.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Ensure role funcionario exists
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('user_id', userId)
      .eq('role', 'funcionario')
      .maybeSingle();

    if (!existingRole) {
      const { error: roleInsertErr } = await supabaseAdmin.from('user_roles').insert({
        user_id: userId,
        role: 'funcionario',
      });

      if (roleInsertErr) {
        // Not fatal to account existence, but should be explicit
        return new Response(JSON.stringify({ error: 'Usuário criado, mas falha ao atribuir role de funcionário' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
    }

    // Insert dependents (optional)
    const deps = (dependentes ?? [])
      .filter((d) => (d?.nome ?? '').trim().length > 0 && (d?.tipo_dependencia ?? '').trim().length > 0)
      .map((d) => ({
        user_id: userId,
        nome: d.nome.trim(),
        idade: typeof d.idade === 'number' && !Number.isNaN(d.idade) ? d.idade : null,
        tipo_dependencia: d.tipo_dependencia,
      }));

    if (deps.length > 0) {
      const { error: depErr } = await supabaseAdmin.from('dependentes_funcionario').insert(deps);
      if (depErr) {
        return new Response(JSON.stringify({ error: depErr.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: userId, email },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
