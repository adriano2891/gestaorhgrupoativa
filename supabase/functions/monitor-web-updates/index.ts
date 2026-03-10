const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FONTES = [
  { nome: 'Receita Federal', url: 'https://www.gov.br/receitafederal/pt-br/assuntos/noticias', tipo: 'governo' },
  { nome: 'Portal Gov.br', url: 'https://www.gov.br/pt-br/noticias', tipo: 'governo' },
  { nome: 'Banco Central', url: 'https://www.bcb.gov.br/detalhenoticia', tipo: 'governo' },
  { nome: 'CFC - Contabilidade', url: 'https://cfc.org.br/noticias/', tipo: 'institucional' },
  { nome: 'Simples Nacional', url: 'https://www8.receita.fazenda.gov.br/SimplesNacional/Noticias/Default.aspx', tipo: 'governo' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Use AI to search for recent relevant updates
    const prompt = `Você é um assistente especializado em monitoramento regulatório e empresarial no Brasil.

Pesquise e liste as 5 atualizações mais recentes e relevantes das seguintes áreas:
- Mudanças tributárias (ICMS, ISS, PIS, COFINS, Simples Nacional)
- Obrigações acessórias (eSocial, EFD, SPED, DCTF)
- Alterações no sistema bancário ou financeiro
- Novos decretos ou portarias que impactam empresas
- Atualizações da Receita Federal
- Mudanças em normas contábeis

REGRAS OBRIGATÓRIAS:
- NÃO inclua nada sobre legislação trabalhista, CLT, direitos do trabalhador
- Foque APENAS em questões fiscais, tributárias, contábeis e regulatórias empresariais
- Apenas atualizações dos últimos 7 dias
- Apenas informações de fontes oficiais do governo ou institucionais

Para cada atualização, forneça EXATAMENTE neste formato JSON (array):
[
  {
    "titulo": "Título claro e objetivo",
    "resumo": "Resumo de 1-2 frases do impacto para empresas",
    "fonte": "Nome da fonte oficial",
    "url": "URL da publicação oficial",
    "categoria": "tributario|contabil|regulatorio|financeiro|obrigacao_acessoria"
  }
]

Responda APENAS com o JSON, sem texto adicional.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Responda apenas em JSON válido. Sem markdown, sem comentários.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI API error: ${aiResponse.status} - ${errText}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || '[]';
    
    // Clean markdown fences if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let updates: any[];
    try {
      updates = JSON.parse(content);
    } catch {
      console.error('Failed to parse AI response:', content);
      updates = [];
    }

    if (!Array.isArray(updates)) updates = [];

    // Insert into database with deduplication via hash
    const inserted: string[] = [];
    for (const update of updates) {
      if (!update.titulo || !update.resumo) continue;

      // Create hash for dedup
      const encoder = new TextEncoder();
      const data = encoder.encode(update.titulo + update.fonte);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/notificacoes_web`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation,resolution=ignore-duplicates',
        },
        body: JSON.stringify({
          titulo: update.titulo.substring(0, 200),
          resumo: update.resumo.substring(0, 500),
          fonte: update.fonte || 'Fonte oficial',
          url_fonte: update.url || '#',
          hash_conteudo: hash,
          categoria: update.categoria || 'regulatorio',
          relevancia: 'importante',
        }),
      });

      if (insertRes.ok) {
        const result = await insertRes.json();
        if (result.length > 0) inserted.push(result[0].id);
      }
    }

    console.log(`Monitored ${updates.length} updates, inserted ${inserted.length} new`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        total_found: updates.length, 
        new_inserted: inserted.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Monitor error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
