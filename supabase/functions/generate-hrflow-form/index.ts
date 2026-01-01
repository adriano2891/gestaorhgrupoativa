import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating HR form for prompt:', prompt);

    const systemPrompt = `Você é um especialista em RH que cria formulários profissionais. 
Baseado na descrição do usuário, gere um formulário estruturado em JSON.

O JSON deve seguir EXATAMENTE este formato:
{
  "title": "Título do Formulário",
  "description": "Descrição breve do formulário",
  "fields": [
    {
      "id": "campo_1",
      "type": "text|textarea|select|checkbox|date|number|email|phone|likert|nps|file|signature",
      "label": "Label do campo",
      "placeholder": "Texto de ajuda (opcional)",
      "required": true/false,
      "options": ["opção1", "opção2"] // apenas para select, checkbox, likert
    }
  ]
}

Tipos de campos disponíveis:
- text: Texto curto
- textarea: Texto longo
- select: Seleção única
- checkbox: Múltipla escolha
- date: Data
- number: Número
- email: E-mail
- phone: Telefone
- likert: Escala Likert (1-5)
- nps: Net Promoter Score (0-10)
- file: Upload de arquivo
- signature: Assinatura

Crie formulários profissionais, inclusivos e em conformidade com LGPD.
Responda APENAS com o JSON, sem texto adicional.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos insuficientes. Por favor, adicione créditos à sua conta.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('No content generated');
    }

    console.log('Generated content:', generatedContent);

    // Parse the JSON from the response
    let formData;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = generatedContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      formData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse generated JSON:', parseError);
      throw new Error('Falha ao processar resposta da IA. Tente novamente.');
    }

    return new Response(JSON.stringify({ form: formData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-hrflow-form:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
