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

    // Verificar se o usuário admin já existe
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const adminExists = existingUsers?.users?.some(u => u.email === 'admin@sistema.com')

    if (!adminExists) {
      // Criar usuário admin
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: 'admin@sistema.com',
        password: '08031982',
        email_confirm: true,
        user_metadata: {
          nome: 'Administrador'
        }
      })

      if (createError) throw createError

      // O trigger handle_new_user() já cria o profile e role automaticamente
      // Mas vamos garantir que a role admin seja atribuída
      if (newUser.user) {
        await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', newUser.user.id)

        await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: newUser.user.id, role: 'admin' })
      }

      return new Response(
        JSON.stringify({ message: 'Usuário admin criado com sucesso' }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Usuário admin já existe' }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
