import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0'

Deno.serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Listar todos os usuários
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) throw listError

    // Deletar cada usuário
    const deletePromises = users.users.map(user => 
      supabaseAdmin.auth.admin.deleteUser(user.id)
    )

    await Promise.all(deletePromises)

    return new Response(
      JSON.stringify({ 
        message: `${users.users.length} usuário(s) deletado(s) com sucesso`,
        count: users.users.length 
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Erro ao deletar usuários:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
