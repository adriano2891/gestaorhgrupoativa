import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';
import { z } from 'https://esm.sh/zod@3.23.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DependenteSchema = z.object({
  nome: z.string().min(1).max(255),
  idade: z.number().int().min(0).max(150).nullish(),
  tipo_dependencia: z.string().min(1).max(100),
});

const CreateEmployeeSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(128),
  nome: z.string().min(1).max(255),
  cpf: z.string().max(20).nullish(),
  telefone: z.string().max(30).nullish(),
  cargo: z.string().max(100).nullish(),
  departamento: z.string().max(100).nullish(),
  status: z.enum(['ativo', 'afastado', 'demitido']).nullish(),
  salario: z.number().min(0).nullish(),
  data_nascimento: z.string().max(20).nullish(),
  data_admissao: z.string().max(20).nullish(),
  dependentes: z.array(DependenteSchema).max(20).nullish(),
  endereco: z.string().max(500).nullish(),
  rg: z.string().max(30).nullish(),
  numero_pis: z.string().max(30).nullish(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: roleRows, error: roleErr } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'rh']);

    if (roleErr || !roleRows || roleRows.length === 0) {
      return new Response(JSON.stringify({ error: 'Only admins can create employees' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403,
      });
    }

    // Validate input
    const rawBody = await req.json();
    const parseResult = CreateEmployeeSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos', details: parseResult.error.flatten().fieldErrors }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    const { email, password, nome, cpf, telefone, cargo, departamento, status, salario, data_nascimento, data_admissao, dependentes, endereco, rg, numero_pis } = parseResult.data;

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { nome, cpf: cpf ?? null, telefone: telefone ?? null, cargo: cargo ?? null, departamento: departamento ?? null, data_nascimento: data_nascimento ?? null },
    });

    if (createErr || !created?.user) {
      console.error('Error creating user:', createErr);
      return new Response(JSON.stringify({ error: 'Erro ao criar usuário' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
      });
    }

    const userId = created.user.id;

    const { error: profileErr } = await supabaseAdmin.from('profiles').upsert({
      id: userId, nome, email,
      cpf: cpf ?? null, telefone: telefone ?? null, cargo: cargo ?? null,
      departamento: departamento ?? null, status: status ?? 'ativo',
      salario: salario ?? null, data_nascimento: data_nascimento ?? null,
      data_admissao: data_admissao ?? null,
      endereco: endereco ?? null, rg: rg ?? null, numero_pis: numero_pis ?? null,
    });

    if (profileErr) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      console.error('Error creating profile:', profileErr);
      return new Response(JSON.stringify({ error: 'Erro ao criar perfil' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
      });
    }

    const { data: existingRole } = await supabaseAdmin
      .from('user_roles').select('user_id').eq('user_id', userId).eq('role', 'funcionario').maybeSingle();

    if (!existingRole) {
      const { error: roleInsertErr } = await supabaseAdmin.from('user_roles').insert({ user_id: userId, role: 'funcionario' });
      if (roleInsertErr) {
        console.error('Error assigning role:', roleInsertErr);
        return new Response(JSON.stringify({ error: 'Usuário criado, mas falha ao atribuir role' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
        });
      }
    }

    const deps = (dependentes ?? [])
      .filter((d) => d.nome.trim().length > 0 && d.tipo_dependencia.trim().length > 0)
      .map((d) => ({
        user_id: userId, nome: d.nome.trim(),
        idade: typeof d.idade === 'number' && !Number.isNaN(d.idade) ? d.idade : null,
        tipo_dependencia: d.tipo_dependencia,
      }));

    if (deps.length > 0) {
      const { error: depErr } = await supabaseAdmin.from('dependentes_funcionario').insert(deps);
      if (depErr) {
        console.error('Error inserting dependents:', depErr);
        return new Response(JSON.stringify({ error: 'Erro ao cadastrar dependentes' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, user: { id: userId, email } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno ao processar a solicitação' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});
