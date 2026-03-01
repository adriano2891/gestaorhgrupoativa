import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const toNoonDate = (date: string) => new Date(`${date}T12:00:00`);
const toISODate = (date: Date) => date.toISOString().split('T')[0];

Deno.serve(async (req) => {
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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const body = await req.json().catch(() => ({}));
    const requestedUserId = typeof body?.user_id === 'string' ? body.user_id : user.id;

    if (requestedUserId !== user.id) {
      const { data: roleRows, error: roleErr } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'rh']);

      if (roleErr || !roleRows || roleRows.length === 0) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, data_admissao, created_at')
      .eq('id', requestedUserId)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!profile) {
      return new Response(JSON.stringify({ periodos: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const dataBase =
      profile.data_admissao ||
      (profile.created_at ? String(profile.created_at).split('T')[0] : null);

    if (!dataBase) {
      return new Response(JSON.stringify({ periodos: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const { data: existingPeriods, error: existingError } = await supabaseAdmin
      .from('periodos_aquisitivos')
      .select('id, user_id, data_inicio, data_fim, dias_direito, dias_usados, dias_disponiveis, created_at, updated_at')
      .eq('user_id', requestedUserId)
      .order('data_inicio', { ascending: true });

    if (existingError) throw existingError;

    const periods = existingPeriods || [];
    const existingStarts = new Set(periods.map((p) => p.data_inicio));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const missingPeriods: Array<{ data_inicio: string; data_fim: string }> = [];
    let periodoInicio = toNoonDate(dataBase);

    while (periodoInicio < today) {
      const periodoFim = new Date(periodoInicio);
      periodoFim.setFullYear(periodoFim.getFullYear() + 1);
      periodoFim.setDate(periodoFim.getDate() - 1);

      const inicioStr = toISODate(periodoInicio);
      if (!existingStarts.has(inicioStr)) {
        missingPeriods.push({
          data_inicio: inicioStr,
          data_fim: toISODate(periodoFim),
        });
        existingStarts.add(inicioStr);
      }

      periodoInicio = new Date(periodoFim);
      periodoInicio.setDate(periodoInicio.getDate() + 1);
    }

    if (missingPeriods.length > 0) {
      const { error: insertError } = await supabaseAdmin.from('periodos_aquisitivos').insert(
        missingPeriods.map((mp) => ({
          user_id: requestedUserId,
          data_inicio: mp.data_inicio,
          data_fim: mp.data_fim,
          dias_direito: 30,
          dias_usados: 0,
        }))
      );

      if (insertError) throw insertError;
    }

    const { data: finalPeriods, error: finalError } = await supabaseAdmin
      .from('periodos_aquisitivos')
      .select('id, user_id, data_inicio, data_fim, dias_direito, dias_usados, dias_disponiveis, created_at, updated_at')
      .eq('user_id', requestedUserId)
      .order('data_inicio', { ascending: false });

    if (finalError) throw finalError;

    return new Response(JSON.stringify({ periodos: finalPeriods || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('ensure-periodos-aquisitivos error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
