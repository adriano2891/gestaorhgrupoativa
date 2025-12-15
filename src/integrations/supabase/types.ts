export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      candidates: {
        Row: {
          applied_date: string
          created_at: string
          email: string
          experience: string
          id: string
          name: string
          phone: string
          position: string
          resume_url: string | null
          skills: string[]
          status: string
          updated_at: string
        }
        Insert: {
          applied_date?: string
          created_at?: string
          email: string
          experience: string
          id?: string
          name: string
          phone: string
          position: string
          resume_url?: string | null
          skills?: string[]
          status?: string
          updated_at?: string
        }
        Update: {
          applied_date?: string
          created_at?: string
          email?: string
          experience?: string
          id?: string
          name?: string
          phone?: string
          position?: string
          resume_url?: string | null
          skills?: string[]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      comunicados: {
        Row: {
          ativo: boolean
          conteudo: string
          created_at: string
          criado_por: string | null
          data_expiracao: string | null
          destinatarios: string[] | null
          id: string
          prioridade: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          conteudo: string
          created_at?: string
          criado_por?: string | null
          data_expiracao?: string | null
          destinatarios?: string[] | null
          id?: string
          prioridade?: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          conteudo?: string
          created_at?: string
          criado_por?: string | null
          data_expiracao?: string | null
          destinatarios?: string[] | null
          id?: string
          prioridade?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      comunicados_lidos: {
        Row: {
          comunicado_id: string
          id: string
          lido_em: string
          user_id: string
        }
        Insert: {
          comunicado_id: string
          id?: string
          lido_em?: string
          user_id: string
        }
        Update: {
          comunicado_id?: string
          id?: string
          lido_em?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicados_lidos_comunicado_id_fkey"
            columns: ["comunicado_id"]
            isOneToOne: false
            referencedRelation: "comunicados"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_ferias: {
        Row: {
          acao: string
          created_at: string
          id: string
          observacao: string | null
          realizado_por: string | null
          solicitacao_id: string
          status_anterior: string | null
          status_novo: string | null
          user_id: string
        }
        Insert: {
          acao: string
          created_at?: string
          id?: string
          observacao?: string | null
          realizado_por?: string | null
          solicitacao_id: string
          status_anterior?: string | null
          status_novo?: string | null
          user_id: string
        }
        Update: {
          acao?: string
          created_at?: string
          id?: string
          observacao?: string | null
          realizado_por?: string | null
          solicitacao_id?: string
          status_anterior?: string | null
          status_novo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_ferias_realizado_por_fkey"
            columns: ["realizado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_ferias_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes_ferias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_ferias_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_salarios: {
        Row: {
          alterado_por: string | null
          created_at: string
          data_alteracao: string
          id: string
          motivo: string | null
          salario_anterior: number | null
          salario_novo: number
          user_id: string
        }
        Insert: {
          alterado_por?: string | null
          created_at?: string
          data_alteracao?: string
          id?: string
          motivo?: string | null
          salario_anterior?: number | null
          salario_novo: number
          user_id: string
        }
        Update: {
          alterado_por?: string | null
          created_at?: string
          data_alteracao?: string
          id?: string
          motivo?: string | null
          salario_anterior?: number | null
          salario_novo?: number
          user_id?: string
        }
        Relationships: []
      }
      holerites: {
        Row: {
          ano: number
          arquivo_url: string | null
          created_at: string
          descontos: number | null
          id: string
          mes: number
          salario_bruto: number
          salario_liquido: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ano: number
          arquivo_url?: string | null
          created_at?: string
          descontos?: number | null
          id?: string
          mes: number
          salario_bruto: number
          salario_liquido: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ano?: number
          arquivo_url?: string | null
          created_at?: string
          descontos?: number | null
          id?: string
          mes?: number
          salario_bruto?: number
          salario_liquido?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      itens_orcamento: {
        Row: {
          ativo: boolean
          categoria: string | null
          created_at: string
          descricao: string | null
          id: string
          imagem_url: string | null
          nome: string
          preco_base: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome: string
          preco_base?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          nome?: string
          preco_base?: number
          updated_at?: string
        }
        Relationships: []
      }
      logs_envio_holerites: {
        Row: {
          created_at: string
          email_destino: string
          enviado_por: string | null
          holerite_id: string
          id: string
          mensagem_erro: string | null
          status: string
          tentativas: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_destino: string
          enviado_por?: string | null
          holerite_id: string
          id?: string
          mensagem_erro?: string | null
          status: string
          tentativas?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_destino?: string
          enviado_por?: string | null
          holerite_id?: string
          id?: string
          mensagem_erro?: string | null
          status?: string
          tentativas?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "logs_envio_holerites_holerite_id_fkey"
            columns: ["holerite_id"]
            isOneToOne: false
            referencedRelation: "holerites"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_relatorios: {
        Row: {
          acao: string
          created_at: string | null
          id: string
          relatorio_id: string | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          id?: string
          relatorio_id?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          id?: string
          relatorio_id?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_relatorios_relatorio_id_fkey"
            columns: ["relatorio_id"]
            isOneToOne: false
            referencedRelation: "relatorios_gerados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_relatorios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metricas: {
        Row: {
          created_at: string | null
          custo_beneficios: number | null
          custo_medio_funcionario: number | null
          horas_extras_percentual: number | null
          id: string
          indice_absenteismo: number | null
          indice_eficiencia: number | null
          periodo: string
          produtividade_equipe: number | null
          satisfacao_gestor: number | null
          satisfacao_interna: number | null
          taxa_presenca: number | null
          taxa_retencao: number | null
          tempo_medio_contratacao: number | null
          total_encargos: number | null
          total_folha_pagamento: number | null
          updated_at: string | null
          variacao_mensal: number | null
        }
        Insert: {
          created_at?: string | null
          custo_beneficios?: number | null
          custo_medio_funcionario?: number | null
          horas_extras_percentual?: number | null
          id?: string
          indice_absenteismo?: number | null
          indice_eficiencia?: number | null
          periodo: string
          produtividade_equipe?: number | null
          satisfacao_gestor?: number | null
          satisfacao_interna?: number | null
          taxa_presenca?: number | null
          taxa_retencao?: number | null
          tempo_medio_contratacao?: number | null
          total_encargos?: number | null
          total_folha_pagamento?: number | null
          updated_at?: string | null
          variacao_mensal?: number | null
        }
        Update: {
          created_at?: string | null
          custo_beneficios?: number | null
          custo_medio_funcionario?: number | null
          horas_extras_percentual?: number | null
          id?: string
          indice_absenteismo?: number | null
          indice_eficiencia?: number | null
          periodo?: string
          produtividade_equipe?: number | null
          satisfacao_gestor?: number | null
          satisfacao_interna?: number | null
          taxa_presenca?: number | null
          taxa_retencao?: number | null
          tempo_medio_contratacao?: number | null
          total_encargos?: number | null
          total_folha_pagamento?: number | null
          updated_at?: string | null
          variacao_mensal?: number | null
        }
        Relationships: []
      }
      periodos_aquisitivos: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          dias_direito: number
          dias_disponiveis: number | null
          dias_usados: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_fim: string
          data_inicio: string
          dias_direito?: number
          dias_disponiveis?: number | null
          dias_usados?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          dias_direito?: number
          dias_disponiveis?: number | null
          dias_usados?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "periodos_aquisitivos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cargo: string | null
          cpf: string | null
          created_at: string | null
          departamento: string | null
          email: string
          id: string
          nome: string
          salario: number | null
          status: string | null
          telefone: string | null
          updated_at: string | null
          usuario: string | null
        }
        Insert: {
          cargo?: string | null
          cpf?: string | null
          created_at?: string | null
          departamento?: string | null
          email: string
          id: string
          nome: string
          salario?: number | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          usuario?: string | null
        }
        Update: {
          cargo?: string | null
          cpf?: string | null
          created_at?: string | null
          departamento?: string | null
          email?: string
          id?: string
          nome?: string
          salario?: number | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          usuario?: string | null
        }
        Relationships: []
      }
      registros_ponto: {
        Row: {
          created_at: string
          data: string
          entrada: string | null
          fim_he: string | null
          horas_extras: unknown
          id: string
          inicio_he: string | null
          retorno_almoco: string | null
          retorno_pausa_1: string | null
          retorno_pausa_2: string | null
          saida: string | null
          saida_almoco: string | null
          saida_pausa_1: string | null
          saida_pausa_2: string | null
          total_horas: unknown
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          entrada?: string | null
          fim_he?: string | null
          horas_extras?: unknown
          id?: string
          inicio_he?: string | null
          retorno_almoco?: string | null
          retorno_pausa_1?: string | null
          retorno_pausa_2?: string | null
          saida?: string | null
          saida_almoco?: string | null
          saida_pausa_1?: string | null
          saida_pausa_2?: string | null
          total_horas?: unknown
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          entrada?: string | null
          fim_he?: string | null
          horas_extras?: unknown
          id?: string
          inicio_he?: string | null
          retorno_almoco?: string | null
          retorno_pausa_1?: string | null
          retorno_pausa_2?: string | null
          saida?: string | null
          saida_almoco?: string | null
          saida_pausa_1?: string | null
          saida_pausa_2?: string | null
          total_horas?: unknown
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_ponto_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorios_customizados: {
        Row: {
          created_at: string | null
          descricao: string | null
          favorito: boolean | null
          filtros: Json | null
          id: string
          nome: string
          tipo: string
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          favorito?: boolean | null
          filtros?: Json | null
          id?: string
          nome: string
          tipo: string
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          favorito?: boolean | null
          filtros?: Json | null
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      relatorios_gerados: {
        Row: {
          created_at: string | null
          departamento: string | null
          formato: string
          gerado_por: string | null
          id: string
          periodo_fim: string
          periodo_inicio: string
          tipo: string
          url_arquivo: string | null
        }
        Insert: {
          created_at?: string | null
          departamento?: string | null
          formato: string
          gerado_por?: string | null
          id?: string
          periodo_fim: string
          periodo_inicio: string
          tipo: string
          url_arquivo?: string | null
        }
        Update: {
          created_at?: string | null
          departamento?: string | null
          formato?: string
          gerado_por?: string | null
          id?: string
          periodo_fim?: string
          periodo_inicio?: string
          tipo?: string
          url_arquivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_gerados_gerado_por_fkey"
            columns: ["gerado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_ferias: {
        Row: {
          aprovado_por: string | null
          created_at: string
          data_aprovacao: string | null
          data_fim: string
          data_inicio: string
          dias_solicitados: number
          id: string
          motivo_reprovacao: string | null
          notificado_em: string | null
          observacao: string | null
          periodo_aquisitivo_id: string
          status: string
          tipo: string
          updated_at: string
          user_id: string
          visualizada_admin: boolean
        }
        Insert: {
          aprovado_por?: string | null
          created_at?: string
          data_aprovacao?: string | null
          data_fim: string
          data_inicio: string
          dias_solicitados: number
          id?: string
          motivo_reprovacao?: string | null
          notificado_em?: string | null
          observacao?: string | null
          periodo_aquisitivo_id: string
          status?: string
          tipo?: string
          updated_at?: string
          user_id: string
          visualizada_admin?: boolean
        }
        Update: {
          aprovado_por?: string | null
          created_at?: string
          data_aprovacao?: string | null
          data_fim?: string
          data_inicio?: string
          dias_solicitados?: number
          id?: string
          motivo_reprovacao?: string | null
          notificado_em?: string | null
          observacao?: string | null
          periodo_aquisitivo_id?: string
          status?: string
          tipo?: string
          updated_at?: string
          user_id?: string
          visualizada_admin?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_ferias_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_ferias_periodo_aquisitivo_id_fkey"
            columns: ["periodo_aquisitivo_id"]
            isOneToOne: false
            referencedRelation: "periodos_aquisitivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_ferias_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calcular_horas_trabalhadas: {
        Args: {
          p_entrada: string
          p_retorno_almoco: string
          p_retorno_pausa_1: string
          p_retorno_pausa_2: string
          p_saida: string
          p_saida_almoco: string
          p_saida_pausa_1: string
          p_saida_pausa_2: string
        }
        Returns: unknown
      }
      get_email_by_cpf: {
        Args: { cpf_input: string }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      get_email_by_username: {
        Args: { username_input: string }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      get_user_departamento: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "rh" | "funcionario"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "gestor", "rh", "funcionario"],
    },
  },
} as const
