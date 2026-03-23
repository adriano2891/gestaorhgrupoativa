const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function isUrlValid(url: string): Promise<boolean> {
  if (!url || url === '#') return false;
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    if (!res.ok) return false;
    const body = await res.text();
    const lower = body.toLowerCase();
    // Detect soft-404 pages that return 200 but show "not found" content
    const errorPatterns = [
      'não encontrado', 'nao encontrado', 'not found',
      'página não existe', 'pagina nao existe',
      'recurso requisitado não foi encontrado',
      'o conteúdo que você procura não está disponível',
      '404', 'page not found',
    ];
    for (const pattern of errorPatterns) {
      if (lower.includes(pattern)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const headers = {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    };

    // 1. Clean old notifications (older than 15 days)
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    await fetch(
      `${SUPABASE_URL}/rest/v1/notificacoes_web?created_at=lt.${fifteenDaysAgo}`,
      { method: 'DELETE', headers: { ...headers, 'Prefer': 'return=minimal' } }
    );

    // 2. Validate existing unread notifications and remove invalid ones
    const existingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/notificacoes_web?lida=eq.false&select=id,url_fonte`,
      { headers }
    );
    if (existingRes.ok) {
      const existing = await existingRes.json();
      const invalidIds: string[] = [];
      for (const item of existing) {
        if (item.url_fonte) {
          const valid = await isUrlValid(item.url_fonte);
          if (!valid) invalidIds.push(item.id);
        }
      }
      // Delete invalid entries
      for (const id of invalidIds) {
        await fetch(
          `${SUPABASE_URL}/rest/v1/notificacoes_web?id=eq.${id}`,
          { method: 'DELETE', headers: { ...headers, 'Prefer': 'return=minimal' } }
        );
      }
    }

    // 3. Fetch new updates via AI
    const prompt = [
      'Liste 5 atualizacoes recentes (ultimos 15 dias) sobre:',
      '- Tributario (ICMS, ISS, PIS, COFINS, Simples Nacional)',
      '- Obrigacoes acessorias (eSocial, EFD, SPED, DCTF)',
      '- Sistema bancario ou financeiro',
      '- Decretos ou portarias que impactam empresas',
      '- Receita Federal, normas contabeis',
      'NAO inclua legislacao trabalhista/CLT.',
      'IMPORTANTE: Inclua APENAS noticias com URLs reais e validas de fontes oficiais como gov.br, receita.fazenda.gov.br, planalto.gov.br, etc.',
      'Responda APENAS JSON array:',
      '[{"titulo":"...","resumo":"...","fonte":"...","url":"...","categoria":"tributario|contabil|regulatorio|financeiro|obrigacao_acessoria"}]',
    ].join('\n');

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Responda apenas JSON valido. Inclua apenas URLs reais e verificaveis.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      throw new Error('AI error ' + aiRes.status + ': ' + t);
    }

    const aiData = await aiRes.json();
    let content = aiData.choices?.[0]?.message?.content || '[]';
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let updates: any[];
    try { updates = JSON.parse(content); } catch { updates = []; }
    if (!Array.isArray(updates)) updates = [];

    // 4. Validate URLs before inserting
    const inserted: string[] = [];
    for (const u of updates) {
      if (!u.titulo || !u.resumo) continue;

      const urlToCheck = u.url || '';
      const urlValid = await isUrlValid(urlToCheck);
      if (!urlValid) {
        console.log('Skipping invalid URL:', urlToCheck);
        continue;
      }

      const enc = new TextEncoder();
      const buf = await crypto.subtle.digest('SHA-256', enc.encode(u.titulo + u.fonte));
      const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

      const r = await fetch(SUPABASE_URL + '/rest/v1/notificacoes_web', {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'return=representation,resolution=ignore-duplicates',
        },
        body: JSON.stringify({
          titulo: u.titulo.substring(0, 200),
          resumo: u.resumo.substring(0, 500),
          fonte: u.fonte || 'Fonte oficial',
          url_fonte: urlToCheck,
          hash_conteudo: hash,
          categoria: u.categoria || 'regulatorio',
          relevancia: 'importante',
        }),
      });

      if (r.ok) {
        const res = await r.json();
        if (res.length > 0) inserted.push(res[0].id);
      } else {
        await r.text();
      }
    }

    return new Response(
      JSON.stringify({ success: true, total_found: updates.length, new_inserted: inserted.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Monitor error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
