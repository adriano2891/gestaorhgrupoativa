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
      admins_auditoria: {
        Row: {
          acao: string
          admin_id: string | null
          created_at: string
          detalhes: string | null
          executado_por: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          acao: string
          admin_id?: string | null
          created_at?: string
          detalhes?: string | null
          executado_por?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          acao?: string
          admin_id?: string | null
          created_at?: string
          detalhes?: string | null
          executado_por?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      afastamentos: {
        Row: {
          cat_id: string | null
          cid: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          data_retorno: string | null
          dias_empresa: number | null
          dias_inss: number | null
          documento_url: string | null
          id: string
          numero_beneficio: string | null
          observacoes: string | null
          registrado_por: string | null
          status: string
          suspende_periodo_aquisitivo: boolean | null
          tipo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cat_id?: string | null
          cid?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio: string
          data_retorno?: string | null
          dias_empresa?: number | null
          dias_inss?: number | null
          documento_url?: string | null
          id?: string
          numero_beneficio?: string | null
          observacoes?: string | null
          registrado_por?: string | null
          status?: string
          suspende_periodo_aquisitivo?: boolean | null
          tipo: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cat_id?: string | null
          cid?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          data_retorno?: string | null
          dias_empresa?: number | null
          dias_inss?: number | null
          documento_url?: string | null
          id?: string
          numero_beneficio?: string | null
          observacoes?: string | null
          registrado_por?: string | null
          status?: string
          suspende_periodo_aquisitivo?: boolean | null
          tipo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "afastamentos_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afastamentos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      asos: {
        Row: {
          arquivo_url: string | null
          created_at: string | null
          crm: string | null
          data_exame: string
          data_vencimento: string | null
          id: string
          medico_nome: string | null
          observacoes: string | null
          resultado: string
          tipo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          arquivo_url?: string | null
          created_at?: string | null
          crm?: string | null
          data_exame: string
          data_vencimento?: string | null
          id?: string
          medico_nome?: string | null
          observacoes?: string | null
          resultado?: string
          tipo?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          arquivo_url?: string | null
          created_at?: string | null
          crm?: string | null
          data_exame?: string
          data_vencimento?: string | null
          id?: string
          medico_nome?: string | null
          observacoes?: string | null
          resultado?: string
          tipo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas_espelho_ponto: {
        Row: {
          ano_referencia: number
          cpf: string | null
          created_at: string
          data_assinatura: string
          funcionario_id: string
          hash_documento: string
          id: string
          ip_address: string | null
          mes_referencia: number
          nome_funcionario: string
          status: string
          user_agent: string | null
        }
        Insert: {
          ano_referencia: number
          cpf?: string | null
          created_at?: string
          data_assinatura?: string
          funcionario_id: string
          hash_documento: string
          id?: string
          ip_address?: string | null
          mes_referencia: number
          nome_funcionario: string
          status?: string
          user_agent?: string | null
        }
        Update: {
          ano_referencia?: number
          cpf?: string | null
          created_at?: string
          data_assinatura?: string
          funcionario_id?: string
          hash_documento?: string
          id?: string
          ip_address?: string | null
          mes_referencia?: number
          nome_funcionario?: string
          status?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_espelho_ponto_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_trail_ponto: {
        Row: {
          acao: string
          created_at: string
          detalhes: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          acao: string
          created_at?: string
          detalhes?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          acao?: string
          created_at?: string
          detalhes?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      aulas: {
        Row: {
          created_at: string | null
          descricao: string | null
          duracao: number | null
          id: string
          material_apoio_url: string | null
          modulo_id: string
          ordem: number | null
          tempo_minimo: number | null
          titulo: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          duracao?: number | null
          id?: string
          material_apoio_url?: string | null
          modulo_id: string
          ordem?: number | null
          tempo_minimo?: number | null
          titulo: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          duracao?: number | null
          id?: string
          material_apoio_url?: string | null
          modulo_id?: string
          ordem?: number | null
          tempo_minimo?: number | null
          titulo?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aulas_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos_curso"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes_curso: {
        Row: {
          aula_id: string | null
          created_at: string | null
          curso_id: string | null
          descricao: string | null
          id: string
          ordem: number | null
          tempo_limite: number | null
          tentativas_permitidas: number | null
          tipo: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          aula_id?: string | null
          created_at?: string | null
          curso_id?: string | null
          descricao?: string | null
          id?: string
          ordem?: number | null
          tempo_limite?: number | null
          tentativas_permitidas?: number | null
          tipo?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          aula_id?: string | null
          created_at?: string | null
          curso_id?: string | null
          descricao?: string | null
          id?: string
          ordem?: number | null
          tempo_limite?: number | null
          tentativas_permitidas?: number | null
          tipo?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_curso_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_curso_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_logs: {
        Row: {
          arquivo_path: string | null
          created_at: string | null
          duracao_ms: number | null
          erro: string | null
          executado_por: string | null
          hash_sha256: string | null
          id: string
          metadata: Json | null
          status: string
          tabelas_excluidas: string[] | null
          tabelas_incluidas: string[] | null
          tamanho_bytes: number | null
          tipo: string
          total_registros: number | null
          updated_at: string | null
        }
        Insert: {
          arquivo_path?: string | null
          created_at?: string | null
          duracao_ms?: number | null
          erro?: string | null
          executado_por?: string | null
          hash_sha256?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          tabelas_excluidas?: string[] | null
          tabelas_incluidas?: string[] | null
          tamanho_bytes?: number | null
          tipo?: string
          total_registros?: number | null
          updated_at?: string | null
        }
        Update: {
          arquivo_path?: string | null
          created_at?: string | null
          duracao_ms?: number | null
          erro?: string | null
          executado_por?: string | null
          hash_sha256?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          tabelas_excluidas?: string[] | null
          tabelas_incluidas?: string[] | null
          tamanho_bytes?: number | null
          tipo?: string
          total_registros?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      banco_horas: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string
          data: string
          data_vencimento: string | null
          horas: string
          id: string
          motivo: string | null
          registro_ponto_id: string | null
          status: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          data: string
          data_vencimento?: string | null
          horas?: string
          id?: string
          motivo?: string | null
          registro_ponto_id?: string | null
          status?: string
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          data?: string
          data_vencimento?: string | null
          horas?: string
          id?: string
          motivo?: string | null
          registro_ponto_id?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      beneficios_funcionario: {
        Row: {
          ativo: boolean
          created_at: string
          data_fim: string | null
          data_inicio: string
          desconto_percentual: number | null
          id: string
          observacoes: string | null
          tipo: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          desconto_percentual?: number | null
          id?: string
          observacoes?: string | null
          tipo: string
          updated_at?: string
          user_id: string
          valor?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          desconto_percentual?: number | null
          id?: string
          observacoes?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "beneficios_funcionario_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          applied_date: string
          consentimento_lgpd: boolean
          created_at: string
          data_consentimento: string | null
          data_validade_dados: string | null
          email: string
          experience: string
          finalidade_tratamento: string | null
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
          consentimento_lgpd?: boolean
          created_at?: string
          data_consentimento?: string | null
          data_validade_dados?: string | null
          email: string
          experience: string
          finalidade_tratamento?: string | null
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
          consentimento_lgpd?: boolean
          created_at?: string
          data_consentimento?: string | null
          data_validade_dados?: string | null
          email?: string
          experience?: string
          finalidade_tratamento?: string | null
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
      cargos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      categorias_curso: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string | null
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem?: number | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cats: {
        Row: {
          agente_causador: string | null
          created_at: string | null
          data_acidente: string
          descricao: string
          dias_afastamento: number | null
          hora_acidente: string | null
          houve_afastamento: boolean | null
          id: string
          local_acidente: string | null
          numero_cat: string | null
          observacoes: string | null
          parte_corpo: string | null
          status: string | null
          testemunha_1: string | null
          testemunha_2: string | null
          tipo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agente_causador?: string | null
          created_at?: string | null
          data_acidente: string
          descricao: string
          dias_afastamento?: number | null
          hora_acidente?: string | null
          houve_afastamento?: boolean | null
          id?: string
          local_acidente?: string | null
          numero_cat?: string | null
          observacoes?: string | null
          parte_corpo?: string | null
          status?: string | null
          testemunha_1?: string | null
          testemunha_2?: string | null
          tipo?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agente_causador?: string | null
          created_at?: string | null
          data_acidente?: string
          descricao?: string
          dias_afastamento?: number | null
          hora_acidente?: string | null
          houve_afastamento?: boolean | null
          id?: string
          local_acidente?: string | null
          numero_cat?: string | null
          observacoes?: string | null
          parte_corpo?: string | null
          status?: string | null
          testemunha_1?: string | null
          testemunha_2?: string | null
          tipo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificados: {
        Row: {
          carga_horaria_real: number | null
          cnpj_empresa: string | null
          codigo_validacao: string
          cpf_funcionario: string | null
          created_at: string | null
          curso_id: string
          data_emissao: string | null
          id: string
          instrutor_nome: string | null
          instrutor_qualificacao: string | null
          matricula_id: string
          norma_regulamentadora: string | null
          url_certificado: string | null
          user_id: string
        }
        Insert: {
          carga_horaria_real?: number | null
          cnpj_empresa?: string | null
          codigo_validacao: string
          cpf_funcionario?: string | null
          created_at?: string | null
          curso_id: string
          data_emissao?: string | null
          id?: string
          instrutor_nome?: string | null
          instrutor_qualificacao?: string | null
          matricula_id: string
          norma_regulamentadora?: string | null
          url_certificado?: string | null
          user_id: string
        }
        Update: {
          carga_horaria_real?: number | null
          cnpj_empresa?: string | null
          codigo_validacao?: string
          cpf_funcionario?: string | null
          created_at?: string | null
          curso_id?: string
          data_emissao?: string | null
          id?: string
          instrutor_nome?: string | null
          instrutor_qualificacao?: string | null
          matricula_id?: string
          norma_regulamentadora?: string | null
          url_certificado?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificados_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificados_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificados_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chamados_auditoria: {
        Row: {
          acao: string
          chamado_id: string
          created_at: string
          detalhes: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          chamado_id: string
          created_at?: string
          detalhes?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          chamado_id?: string
          created_at?: string
          detalhes?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chamados_auditoria_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "chamados_suporte"
            referencedColumns: ["id"]
          },
        ]
      }
      chamados_suporte: {
        Row: {
          assunto: string
          categoria: string
          created_at: string
          fechado_em: string | null
          fechado_por: string | null
          id: string
          ip_fechamento: string | null
          motivo_fechamento: string | null
          numero_protocolo: string | null
          prazo_resposta: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assunto: string
          categoria?: string
          created_at?: string
          fechado_em?: string | null
          fechado_por?: string | null
          id?: string
          ip_fechamento?: string | null
          motivo_fechamento?: string | null
          numero_protocolo?: string | null
          prazo_resposta?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assunto?: string
          categoria?: string
          created_at?: string
          fechado_em?: string | null
          fechado_por?: string | null
          id?: string
          ip_fechamento?: string | null
          motivo_fechamento?: string | null
          numero_protocolo?: string | null
          prazo_resposta?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamados_suporte_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cipa_membros: {
        Row: {
          ativo: boolean | null
          cargo_cipa: string
          created_at: string | null
          id: string
          mandato_fim: string
          mandato_inicio: string
          nome: string
          representacao: string
          tipo: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          cargo_cipa?: string
          created_at?: string | null
          id?: string
          mandato_fim: string
          mandato_inicio: string
          nome: string
          representacao?: string
          tipo?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          cargo_cipa?: string
          created_at?: string | null
          id?: string
          mandato_fim?: string
          mandato_inicio?: string
          nome?: string
          representacao?: string
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cipa_membros_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cipa_reuniao_participantes: {
        Row: {
          id: string
          membro_id: string
          presente: boolean | null
          reuniao_id: string
        }
        Insert: {
          id?: string
          membro_id: string
          presente?: boolean | null
          reuniao_id: string
        }
        Update: {
          id?: string
          membro_id?: string
          presente?: boolean | null
          reuniao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cipa_reuniao_participantes_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "cipa_membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cipa_reuniao_participantes_reuniao_id_fkey"
            columns: ["reuniao_id"]
            isOneToOne: false
            referencedRelation: "cipa_reunioes"
            referencedColumns: ["id"]
          },
        ]
      }
      cipa_reunioes: {
        Row: {
          ata: string | null
          created_at: string | null
          data_reuniao: string
          id: string
          pauta: string | null
          tipo: string | null
        }
        Insert: {
          ata?: string | null
          created_at?: string | null
          data_reuniao: string
          id?: string
          pauta?: string | null
          tipo?: string | null
        }
        Update: {
          ata?: string | null
          created_at?: string | null
          data_reuniao?: string
          id?: string
          pauta?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      clientes_orcamentos: {
        Row: {
          ativo: boolean
          bairro: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          complemento: string | null
          created_at: string
          email: string
          estado: string | null
          id: string
          nome_condominio: string
          nome_sindico: string
          numero: string | null
          numero_unidades: number | null
          observacoes: string | null
          rua: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          created_at?: string
          email: string
          estado?: string | null
          id?: string
          nome_condominio: string
          nome_sindico: string
          numero?: string | null
          numero_unidades?: number | null
          observacoes?: string | null
          rua?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          created_at?: string
          email?: string
          estado?: string | null
          id?: string
          nome_condominio?: string
          nome_sindico?: string
          numero?: string | null
          numero_unidades?: number | null
          observacoes?: string | null
          rua?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      comprovantes_ponto: {
        Row: {
          assinatura_digital: string
          created_at: string
          data_jornada: string
          geolocation: string | null
          hash_comprovante: string
          horario_entrada: string | null
          horario_saida: string | null
          id: string
          ip_address: string | null
          origem: string | null
          pausas: Json | null
          qr_code_data: string | null
          total_horas: string | null
          total_horas_extras: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          assinatura_digital: string
          created_at?: string
          data_jornada: string
          geolocation?: string | null
          hash_comprovante: string
          horario_entrada?: string | null
          horario_saida?: string | null
          id?: string
          ip_address?: string | null
          origem?: string | null
          pausas?: Json | null
          qr_code_data?: string | null
          total_horas?: string | null
          total_horas_extras?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          assinatura_digital?: string
          created_at?: string
          data_jornada?: string
          geolocation?: string | null
          hash_comprovante?: string
          horario_entrada?: string | null
          horario_saida?: string | null
          id?: string
          ip_address?: string | null
          origem?: string | null
          pausas?: Json | null
          qr_code_data?: string | null
          total_horas?: string | null
          total_horas_extras?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      comunicados: {
        Row: {
          anexos: Json | null
          ativo: boolean
          conteudo: string
          created_at: string
          criado_por: string | null
          data_expiracao: string | null
          destinatarios: string[] | null
          excluido: boolean
          excluido_em: string | null
          excluido_por: string | null
          id: string
          prioridade: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          anexos?: Json | null
          ativo?: boolean
          conteudo: string
          created_at?: string
          criado_por?: string | null
          data_expiracao?: string | null
          destinatarios?: string[] | null
          excluido?: boolean
          excluido_em?: string | null
          excluido_por?: string | null
          id?: string
          prioridade?: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          anexos?: Json | null
          ativo?: boolean
          conteudo?: string
          created_at?: string
          criado_por?: string | null
          data_expiracao?: string | null
          destinatarios?: string[] | null
          excluido?: boolean
          excluido_em?: string | null
          excluido_por?: string | null
          id?: string
          prioridade?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      comunicados_auditoria: {
        Row: {
          acao: string
          comunicado_id: string
          created_at: string
          detalhes: string | null
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          acao: string
          comunicado_id: string
          created_at?: string
          detalhes?: string | null
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          acao?: string
          comunicado_id?: string
          created_at?: string
          detalhes?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicados_auditoria_comunicado_id_fkey"
            columns: ["comunicado_id"]
            isOneToOne: false
            referencedRelation: "comunicados"
            referencedColumns: ["id"]
          },
        ]
      }
      comunicados_lidos: {
        Row: {
          comunicado_id: string
          confirmado: boolean
          confirmado_em: string | null
          id: string
          ip_address: string | null
          lido_em: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          comunicado_id: string
          confirmado?: boolean
          confirmado_em?: string | null
          id?: string
          ip_address?: string | null
          lido_em?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          comunicado_id?: string
          confirmado?: boolean
          confirmado_em?: string | null
          id?: string
          ip_address?: string | null
          lido_em?: string
          user_agent?: string | null
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
      convencoes_coletivas: {
        Row: {
          created_at: string | null
          data_fim: string
          data_inicio: string
          documento_nome: string | null
          documento_url: string | null
          id: string
          nome: string
          sindicato: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_fim: string
          data_inicio: string
          documento_nome?: string | null
          documento_url?: string | null
          id?: string
          nome: string
          sindicato?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          documento_nome?: string | null
          documento_url?: string | null
          id?: string
          nome?: string
          sindicato?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cursos: {
        Row: {
          capa_url: string | null
          carga_horaria: number | null
          cargos_permitidos: string[] | null
          categoria_id: string | null
          created_at: string | null
          criado_por: string | null
          curso_livre: boolean | null
          departamentos_permitidos: string[] | null
          descricao: string | null
          excluido: boolean
          excluido_em: string | null
          excluido_por: string | null
          id: string
          instrutor: string | null
          meses_recorrencia: number | null
          nivel: Database["public"]["Enums"]["curso_nivel"] | null
          norma_regulamentadora: string | null
          nota_minima: number | null
          obrigatorio: boolean | null
          recorrente: boolean | null
          status: Database["public"]["Enums"]["curso_status"] | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          capa_url?: string | null
          carga_horaria?: number | null
          cargos_permitidos?: string[] | null
          categoria_id?: string | null
          created_at?: string | null
          criado_por?: string | null
          curso_livre?: boolean | null
          departamentos_permitidos?: string[] | null
          descricao?: string | null
          excluido?: boolean
          excluido_em?: string | null
          excluido_por?: string | null
          id?: string
          instrutor?: string | null
          meses_recorrencia?: number | null
          nivel?: Database["public"]["Enums"]["curso_nivel"] | null
          norma_regulamentadora?: string | null
          nota_minima?: number | null
          obrigatorio?: boolean | null
          recorrente?: boolean | null
          status?: Database["public"]["Enums"]["curso_status"] | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          capa_url?: string | null
          carga_horaria?: number | null
          cargos_permitidos?: string[] | null
          categoria_id?: string | null
          created_at?: string | null
          criado_por?: string | null
          curso_livre?: boolean | null
          departamentos_permitidos?: string[] | null
          descricao?: string | null
          excluido?: boolean
          excluido_em?: string | null
          excluido_por?: string | null
          id?: string
          instrutor?: string | null
          meses_recorrencia?: number | null
          nivel?: Database["public"]["Enums"]["curso_nivel"] | null
          norma_regulamentadora?: string | null
          nota_minima?: number | null
          obrigatorio?: boolean | null
          recorrente?: boolean | null
          status?: Database["public"]["Enums"]["curso_status"] | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cursos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_curso"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cursos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos_auditoria: {
        Row: {
          acao: string
          created_at: string
          curso_id: string | null
          detalhes: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          curso_id?: string | null
          detalhes?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          curso_id?: string | null
          detalhes?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cursos_auditoria_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      departamentos: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dependentes_funcionario: {
        Row: {
          created_at: string
          id: string
          idade: number | null
          nome: string
          tipo_dependencia: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idade?: number | null
          nome: string
          tipo_dependencia: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idade?: number | null
          nome?: string
          tipo_dependencia?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documentos: {
        Row: {
          arquivo_nome: string
          arquivo_tamanho: number | null
          arquivo_url: string
          atualizado_por: string | null
          categoria_id: string | null
          created_at: string
          criado_por: string | null
          descricao: string | null
          excluido: boolean
          excluido_em: string | null
          excluido_por: string | null
          id: string
          mime_type: string | null
          publico: boolean | null
          tags: string[] | null
          tipo: Database["public"]["Enums"]["documento_tipo"]
          titulo: string
          updated_at: string
          versao_atual: number
          visualizacoes: number | null
        }
        Insert: {
          arquivo_nome: string
          arquivo_tamanho?: number | null
          arquivo_url: string
          atualizado_por?: string | null
          categoria_id?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          excluido?: boolean
          excluido_em?: string | null
          excluido_por?: string | null
          id?: string
          mime_type?: string | null
          publico?: boolean | null
          tags?: string[] | null
          tipo?: Database["public"]["Enums"]["documento_tipo"]
          titulo: string
          updated_at?: string
          versao_atual?: number
          visualizacoes?: number | null
        }
        Update: {
          arquivo_nome?: string
          arquivo_tamanho?: number | null
          arquivo_url?: string
          atualizado_por?: string | null
          categoria_id?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          excluido?: boolean
          excluido_em?: string | null
          excluido_por?: string | null
          id?: string
          mime_type?: string | null
          publico?: boolean | null
          tags?: string[] | null
          tipo?: Database["public"]["Enums"]["documento_tipo"]
          titulo?: string
          updated_at?: string
          versao_atual?: number
          visualizacoes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_atualizado_por_fkey"
            columns: ["atualizado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "documentos_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_acessos: {
        Row: {
          acao: string
          created_at: string
          documento_id: string
          id: string
          user_id: string
        }
        Insert: {
          acao: string
          created_at?: string
          documento_id: string
          id?: string
          user_id: string
        }
        Update: {
          acao?: string
          created_at?: string
          documento_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_acessos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_acessos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_auditoria: {
        Row: {
          acao: string
          created_at: string
          detalhes: string | null
          documento_id: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          detalhes?: string | null
          documento_id?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          detalhes?: string | null
          documento_id?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_auditoria_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_categorias: {
        Row: {
          categoria_pai_id: string | null
          cor: string | null
          created_at: string
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number | null
          updated_at: string
        }
        Insert: {
          categoria_pai_id?: string | null
          cor?: string | null
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem?: number | null
          updated_at?: string
        }
        Update: {
          categoria_pai_id?: string | null
          cor?: string | null
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_categorias_categoria_pai_id_fkey"
            columns: ["categoria_pai_id"]
            isOneToOne: false
            referencedRelation: "documentos_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_comentarios: {
        Row: {
          conteudo: string
          created_at: string
          documento_id: string
          id: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conteudo: string
          created_at?: string
          documento_id: string
          id?: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          documento_id?: string
          id?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_comentarios_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_comentarios_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "documentos_comentarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_comentarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_favoritos: {
        Row: {
          created_at: string
          documento_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          documento_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          documento_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_favoritos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_favoritos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_fornecedor: {
        Row: {
          arquivo_url: string
          created_at: string
          fornecedor_id: string
          id: string
          nome_arquivo: string
          tipo_documento: string
        }
        Insert: {
          arquivo_url: string
          created_at?: string
          fornecedor_id: string
          id?: string
          nome_arquivo: string
          tipo_documento: string
        }
        Update: {
          arquivo_url?: string
          created_at?: string
          fornecedor_id?: string
          id?: string
          nome_arquivo?: string
          tipo_documento?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_fornecedor_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_permissoes: {
        Row: {
          created_at: string
          departamento: string | null
          documento_id: string
          id: string
          pode_comentar: boolean | null
          pode_editar: boolean | null
          pode_excluir: boolean | null
          pode_visualizar: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          departamento?: string | null
          documento_id: string
          id?: string
          pode_comentar?: boolean | null
          pode_editar?: boolean | null
          pode_excluir?: boolean | null
          pode_visualizar?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          departamento?: string | null
          documento_id?: string
          id?: string
          pode_comentar?: boolean | null
          pode_editar?: boolean | null
          pode_excluir?: boolean | null
          pode_visualizar?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_permissoes_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_permissoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_sistema: {
        Row: {
          arquivo_nome: string
          arquivo_tamanho: number | null
          arquivo_url: string
          atualizado_por: string | null
          categoria_id: string | null
          created_at: string
          criado_por: string | null
          descricao: string | null
          excluido: boolean | null
          excluido_em: string | null
          excluido_por: string | null
          id: string
          mime_type: string | null
          publico: boolean | null
          tags: string[] | null
          tipo: Database["public"]["Enums"]["documento_tipo"] | null
          titulo: string
          updated_at: string
          versao_atual: number | null
          visualizacoes: number | null
        }
        Insert: {
          arquivo_nome: string
          arquivo_tamanho?: number | null
          arquivo_url: string
          atualizado_por?: string | null
          categoria_id?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          excluido?: boolean | null
          excluido_em?: string | null
          excluido_por?: string | null
          id?: string
          mime_type?: string | null
          publico?: boolean | null
          tags?: string[] | null
          tipo?: Database["public"]["Enums"]["documento_tipo"] | null
          titulo: string
          updated_at?: string
          versao_atual?: number | null
          visualizacoes?: number | null
        }
        Update: {
          arquivo_nome?: string
          arquivo_tamanho?: number | null
          arquivo_url?: string
          atualizado_por?: string | null
          categoria_id?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          excluido?: boolean | null
          excluido_em?: string | null
          excluido_por?: string | null
          id?: string
          mime_type?: string | null
          publico?: boolean | null
          tags?: string[] | null
          tipo?: Database["public"]["Enums"]["documento_tipo"] | null
          titulo?: string
          updated_at?: string
          versao_atual?: number | null
          visualizacoes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_sistema_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "documentos_sistema_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_sistema_acessos: {
        Row: {
          acao: string
          created_at: string
          documento_id: string
          id: string
          user_id: string
        }
        Insert: {
          acao: string
          created_at?: string
          documento_id: string
          id?: string
          user_id: string
        }
        Update: {
          acao?: string
          created_at?: string
          documento_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_sistema_acessos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_sistema_auditoria: {
        Row: {
          acao: string
          created_at: string
          detalhes: string | null
          documento_id: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          detalhes?: string | null
          documento_id?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          detalhes?: string | null
          documento_id?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_sistema_auditoria_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_sistema_categorias: {
        Row: {
          categoria_pai_id: string | null
          cor: string | null
          created_at: string
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number | null
          updated_at: string
        }
        Insert: {
          categoria_pai_id?: string | null
          cor?: string | null
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem?: number | null
          updated_at?: string
        }
        Update: {
          categoria_pai_id?: string | null
          cor?: string | null
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_sistema_categorias_categoria_pai_id_fkey"
            columns: ["categoria_pai_id"]
            isOneToOne: false
            referencedRelation: "documentos_sistema_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_sistema_comentarios: {
        Row: {
          conteudo: string
          created_at: string
          documento_id: string
          id: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conteudo: string
          created_at?: string
          documento_id: string
          id?: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          documento_id?: string
          id?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_sistema_comentarios_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_sistema_favoritos: {
        Row: {
          created_at: string
          documento_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          documento_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          documento_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_sistema_favoritos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_sistema_versoes: {
        Row: {
          alteracoes: string | null
          arquivo_nome: string
          arquivo_tamanho: number | null
          arquivo_url: string
          created_at: string
          criado_por: string | null
          documento_id: string
          id: string
          versao: number
        }
        Insert: {
          alteracoes?: string | null
          arquivo_nome: string
          arquivo_tamanho?: number | null
          arquivo_url: string
          created_at?: string
          criado_por?: string | null
          documento_id: string
          id?: string
          versao: number
        }
        Update: {
          alteracoes?: string | null
          arquivo_nome?: string
          arquivo_tamanho?: number | null
          arquivo_url?: string
          created_at?: string
          criado_por?: string | null
          documento_id?: string
          id?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "documentos_sistema_versoes_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_sistema"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_sst: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          created_at: string | null
          criado_por: string | null
          data_vigencia_fim: string | null
          data_vigencia_inicio: string | null
          descricao: string | null
          id: string
          registro_profissional: string | null
          responsavel_tecnico: string | null
          tipo: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          created_at?: string | null
          criado_por?: string | null
          data_vigencia_fim?: string | null
          data_vigencia_inicio?: string | null
          descricao?: string | null
          id?: string
          registro_profissional?: string | null
          responsavel_tecnico?: string | null
          tipo: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          created_at?: string | null
          criado_por?: string | null
          data_vigencia_fim?: string | null
          data_vigencia_inicio?: string | null
          descricao?: string | null
          id?: string
          registro_profissional?: string | null
          responsavel_tecnico?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      documentos_sst_validade: {
        Row: {
          arquivo_url: string | null
          created_at: string | null
          data_emissao: string
          data_validade: string
          id: string
          nome: string
          observacoes: string | null
          responsavel: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          arquivo_url?: string | null
          created_at?: string | null
          data_emissao: string
          data_validade: string
          id?: string
          nome: string
          observacoes?: string | null
          responsavel?: string | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          arquivo_url?: string | null
          created_at?: string | null
          data_emissao?: string
          data_validade?: string
          id?: string
          nome?: string
          observacoes?: string | null
          responsavel?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      documentos_versoes: {
        Row: {
          alteracoes: string | null
          arquivo_nome: string
          arquivo_tamanho: number | null
          arquivo_url: string
          created_at: string
          criado_por: string | null
          documento_id: string
          id: string
          versao: number
        }
        Insert: {
          alteracoes?: string | null
          arquivo_nome: string
          arquivo_tamanho?: number | null
          arquivo_url: string
          created_at?: string
          criado_por?: string | null
          documento_id: string
          id?: string
          versao: number
        }
        Update: {
          alteracoes?: string | null
          arquivo_nome?: string
          arquivo_tamanho?: number | null
          arquivo_url?: string
          created_at?: string
          criado_por?: string | null
          documento_id?: string
          id?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "documentos_versoes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_versoes_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          cnpj: string
          created_at: string
          id: string
          razao_social: string
          updated_at: string
        }
        Insert: {
          cnpj: string
          created_at?: string
          id?: string
          razao_social: string
          updated_at?: string
        }
        Update: {
          cnpj?: string
          created_at?: string
          id?: string
          razao_social?: string
          updated_at?: string
        }
        Relationships: []
      }
      enderecos_fornecedor: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          created_at: string
          estado: string | null
          fornecedor_id: string
          id: string
          logradouro: string | null
          numero: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          estado?: string | null
          fornecedor_id: string
          id?: string
          logradouro?: string | null
          numero?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          estado?: string | null
          fornecedor_id?: string
          id?: string
          logradouro?: string | null
          numero?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enderecos_fornecedor_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_entregas: {
        Row: {
          assinado: boolean | null
          ca_numero: string | null
          created_at: string | null
          data_assinatura: string | null
          data_devolucao: string | null
          data_entrega: string
          id: string
          ip_assinatura: string | null
          motivo_troca: string | null
          nome_epi: string
          observacoes: string | null
          quantidade: number | null
          user_id: string
        }
        Insert: {
          assinado?: boolean | null
          ca_numero?: string | null
          created_at?: string | null
          data_assinatura?: string | null
          data_devolucao?: string | null
          data_entrega: string
          id?: string
          ip_assinatura?: string | null
          motivo_troca?: string | null
          nome_epi: string
          observacoes?: string | null
          quantidade?: number | null
          user_id: string
        }
        Update: {
          assinado?: boolean | null
          ca_numero?: string | null
          created_at?: string | null
          data_assinatura?: string | null
          data_devolucao?: string | null
          data_entrega?: string
          id?: string
          ip_assinatura?: string | null
          motivo_troca?: string | null
          nome_epi?: string
          observacoes?: string | null
          quantidade?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "epi_entregas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escalas_trabalho: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          jornada_horas: number
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          jornada_horas?: number
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          jornada_horas?: number
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback_curso: {
        Row: {
          comentario: string | null
          created_at: string | null
          curso_id: string
          id: string
          nota: number | null
          user_id: string
        }
        Insert: {
          comentario?: string | null
          created_at?: string | null
          curso_id: string
          id?: string
          nota?: number | null
          user_id: string
        }
        Update: {
          comentario?: string | null
          created_at?: string | null
          curso_id?: string
          id?: string
          nota?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_curso_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_curso_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feriados: {
        Row: {
          ativo: boolean | null
          cidade: string | null
          created_at: string | null
          data: string
          estado: string | null
          id: string
          nome: string
          recorrente: boolean | null
          tipo: string
        }
        Insert: {
          ativo?: boolean | null
          cidade?: string | null
          created_at?: string | null
          data: string
          estado?: string | null
          id?: string
          nome: string
          recorrente?: boolean | null
          tipo?: string
        }
        Update: {
          ativo?: boolean | null
          cidade?: string | null
          created_at?: string | null
          data?: string
          estado?: string | null
          id?: string
          nome?: string
          recorrente?: boolean | null
          tipo?: string
        }
        Relationships: []
      }
      formulario_atribuicoes: {
        Row: {
          assinado: boolean
          created_at: string
          data_assinatura: string | null
          data_limite: string | null
          formulario_id: string
          id: string
          ip_assinatura: string | null
          notificado: boolean
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assinado?: boolean
          created_at?: string
          data_assinatura?: string | null
          data_limite?: string | null
          formulario_id: string
          id?: string
          ip_assinatura?: string | null
          notificado?: boolean
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assinado?: boolean
          created_at?: string
          data_assinatura?: string | null
          data_limite?: string | null
          formulario_id?: string
          id?: string
          ip_assinatura?: string | null
          notificado?: boolean
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "formulario_atribuicoes_formulario_id_fkey"
            columns: ["formulario_id"]
            isOneToOne: false
            referencedRelation: "formularios_rh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formulario_atribuicoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      formulario_campos: {
        Row: {
          created_at: string
          formulario_id: string
          id: string
          label: string
          largura: number | null
          obrigatorio: boolean
          opcoes: Json | null
          ordem: number
          placeholder: string | null
          tipo: Database["public"]["Enums"]["form_field_type"]
          updated_at: string
          valor_padrao: string | null
        }
        Insert: {
          created_at?: string
          formulario_id: string
          id?: string
          label: string
          largura?: number | null
          obrigatorio?: boolean
          opcoes?: Json | null
          ordem?: number
          placeholder?: string | null
          tipo?: Database["public"]["Enums"]["form_field_type"]
          updated_at?: string
          valor_padrao?: string | null
        }
        Update: {
          created_at?: string
          formulario_id?: string
          id?: string
          label?: string
          largura?: number | null
          obrigatorio?: boolean
          opcoes?: Json | null
          ordem?: number
          placeholder?: string | null
          tipo?: Database["public"]["Enums"]["form_field_type"]
          updated_at?: string
          valor_padrao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formulario_campos_formulario_id_fkey"
            columns: ["formulario_id"]
            isOneToOne: false
            referencedRelation: "formularios_rh"
            referencedColumns: ["id"]
          },
        ]
      }
      formulario_respostas: {
        Row: {
          arquivo_url: string | null
          atribuicao_id: string
          campo_id: string
          created_at: string
          id: string
          updated_at: string
          valor: string | null
        }
        Insert: {
          arquivo_url?: string | null
          atribuicao_id: string
          campo_id: string
          created_at?: string
          id?: string
          updated_at?: string
          valor?: string | null
        }
        Update: {
          arquivo_url?: string | null
          atribuicao_id?: string
          campo_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formulario_respostas_atribuicao_id_fkey"
            columns: ["atribuicao_id"]
            isOneToOne: false
            referencedRelation: "formulario_atribuicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formulario_respostas_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "formulario_campos"
            referencedColumns: ["id"]
          },
        ]
      }
      formularios_rh: {
        Row: {
          aprovado_por: string | null
          arquivo_externo_nome: string | null
          arquivo_externo_url: string | null
          categoria: Database["public"]["Enums"]["form_category"]
          created_at: string
          criado_por: string | null
          data_aprovacao: string | null
          departamento_destino: string | null
          descricao: string | null
          id: string
          is_template: boolean
          requer_assinatura: boolean
          status: Database["public"]["Enums"]["form_status"]
          template_origem_id: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          aprovado_por?: string | null
          arquivo_externo_nome?: string | null
          arquivo_externo_url?: string | null
          categoria?: Database["public"]["Enums"]["form_category"]
          created_at?: string
          criado_por?: string | null
          data_aprovacao?: string | null
          departamento_destino?: string | null
          descricao?: string | null
          id?: string
          is_template?: boolean
          requer_assinatura?: boolean
          status?: Database["public"]["Enums"]["form_status"]
          template_origem_id?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          aprovado_por?: string | null
          arquivo_externo_nome?: string | null
          arquivo_externo_url?: string | null
          categoria?: Database["public"]["Enums"]["form_category"]
          created_at?: string
          criado_por?: string | null
          data_aprovacao?: string | null
          departamento_destino?: string | null
          descricao?: string | null
          id?: string
          is_template?: boolean
          requer_assinatura?: boolean
          status?: Database["public"]["Enums"]["form_status"]
          template_origem_id?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formularios_rh_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formularios_rh_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formularios_rh_template_origem_id_fkey"
            columns: ["template_origem_id"]
            isOneToOne: false
            referencedRelation: "formularios_rh"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          condicoes_pagamento: string | null
          cpf_cnpj: string
          created_at: string
          email: string
          id: string
          nome_fantasia: string | null
          observacoes: string | null
          prazo_medio_entrega: number | null
          razao_social: string
          responsavel: string
          status: string
          telefone: string
          tipo_fornecedor: string
          updated_at: string
        }
        Insert: {
          condicoes_pagamento?: string | null
          cpf_cnpj: string
          created_at?: string
          email: string
          id?: string
          nome_fantasia?: string | null
          observacoes?: string | null
          prazo_medio_entrega?: number | null
          razao_social: string
          responsavel: string
          status?: string
          telefone: string
          tipo_fornecedor: string
          updated_at?: string
        }
        Update: {
          condicoes_pagamento?: string | null
          cpf_cnpj?: string
          created_at?: string
          email?: string
          id?: string
          nome_fantasia?: string | null
          observacoes?: string | null
          prazo_medio_entrega?: number | null
          razao_social?: string
          responsavel?: string
          status?: string
          telefone?: string
          tipo_fornecedor?: string
          updated_at?: string
        }
        Relationships: []
      }
      gestor_permissions: {
        Row: {
          created_at: string
          id: string
          modulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          modulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          modulo?: string
          user_id?: string
        }
        Relationships: []
      }
      historico_cargos: {
        Row: {
          alterado_por: string | null
          cargo_anterior: string | null
          cargo_novo: string
          created_at: string | null
          data_alteracao: string
          departamento_anterior: string | null
          departamento_novo: string | null
          id: string
          motivo: string | null
          user_id: string
        }
        Insert: {
          alterado_por?: string | null
          cargo_anterior?: string | null
          cargo_novo: string
          created_at?: string | null
          data_alteracao?: string
          departamento_anterior?: string | null
          departamento_novo?: string | null
          id?: string
          motivo?: string | null
          user_id: string
        }
        Update: {
          alterado_por?: string | null
          cargo_anterior?: string | null
          cargo_novo?: string
          created_at?: string | null
          data_alteracao?: string
          departamento_anterior?: string | null
          departamento_novo?: string | null
          id?: string
          motivo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_cargos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      historico_precos_fornecedor: {
        Row: {
          alterado_por: string | null
          created_at: string
          id: string
          item_id: string
          valor_anterior: number | null
          valor_novo: number
        }
        Insert: {
          alterado_por?: string | null
          created_at?: string
          id?: string
          item_id: string
          valor_anterior?: number | null
          valor_novo: number
        }
        Update: {
          alterado_por?: string | null
          created_at?: string
          id?: string
          item_id?: string
          valor_anterior?: number | null
          valor_novo?: number
        }
        Relationships: [
          {
            foreignKeyName: "historico_precos_fornecedor_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "itens_fornecedor"
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
          adicional_noturno_valor: number | null
          ano: number
          arquivo_url: string | null
          base_calculo_inss: number | null
          base_calculo_irrf: number | null
          created_at: string
          descontos: number | null
          dsr_valor: number | null
          fgts: number | null
          horas_extras_valor: number | null
          id: string
          inss: number | null
          irrf: number | null
          mes: number
          observacoes: string | null
          outros_descontos: number | null
          outros_proventos: number | null
          salario_bruto: number
          salario_liquido: number
          updated_at: string
          user_id: string
          vale_transporte: number | null
        }
        Insert: {
          adicional_noturno_valor?: number | null
          ano: number
          arquivo_url?: string | null
          base_calculo_inss?: number | null
          base_calculo_irrf?: number | null
          created_at?: string
          descontos?: number | null
          dsr_valor?: number | null
          fgts?: number | null
          horas_extras_valor?: number | null
          id?: string
          inss?: number | null
          irrf?: number | null
          mes: number
          observacoes?: string | null
          outros_descontos?: number | null
          outros_proventos?: number | null
          salario_bruto: number
          salario_liquido: number
          updated_at?: string
          user_id: string
          vale_transporte?: number | null
        }
        Update: {
          adicional_noturno_valor?: number | null
          ano?: number
          arquivo_url?: string | null
          base_calculo_inss?: number | null
          base_calculo_irrf?: number | null
          created_at?: string
          descontos?: number | null
          dsr_valor?: number | null
          fgts?: number | null
          horas_extras_valor?: number | null
          id?: string
          inss?: number | null
          irrf?: number | null
          mes?: number
          observacoes?: string | null
          outros_descontos?: number | null
          outros_proventos?: number | null
          salario_bruto?: number
          salario_liquido?: number
          updated_at?: string
          user_id?: string
          vale_transporte?: number | null
        }
        Relationships: []
      }
      inventario_equipamentos: {
        Row: {
          cor: string | null
          created_at: string
          detalhe_localizacao: string | null
          id: string
          localizacao: string
          modelo_marca: string | null
          nome_equipamento: string
          numero_equipamento: string
          observacoes: string | null
          updated_at: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          detalhe_localizacao?: string | null
          id?: string
          localizacao: string
          modelo_marca?: string | null
          nome_equipamento: string
          numero_equipamento: string
          observacoes?: string | null
          updated_at?: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          detalhe_localizacao?: string | null
          id?: string
          localizacao?: string
          modelo_marca?: string | null
          nome_equipamento?: string
          numero_equipamento?: string
          observacoes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      itens_fornecedor: {
        Row: {
          ativo: boolean
          categoria: string | null
          created_at: string
          descricao: string | null
          fornecedor_id: string
          id: string
          imagem_url: string | null
          nome: string
          prazo_entrega: number | null
          unidade: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          fornecedor_id: string
          id?: string
          imagem_url?: string | null
          nome: string
          prazo_entrega?: number | null
          unidade?: string | null
          updated_at?: string
          valor?: number
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          fornecedor_id?: string
          id?: string
          imagem_url?: string | null
          nome?: string
          prazo_entrega?: number | null
          unidade?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_fornecedor_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
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
      log_alteracoes_perfil: {
        Row: {
          campo: string
          created_at: string
          id: string
          origem: string
          user_id: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          campo: string
          created_at?: string
          id?: string
          origem?: string
          user_id: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          campo?: string
          created_at?: string
          id?: string
          origem?: string
          user_id?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: []
      }
      logs_acesso_curso: {
        Row: {
          acao: string
          aula_id: string | null
          created_at: string | null
          curso_id: string | null
          detalhes: Json | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          aula_id?: string | null
          created_at?: string | null
          curso_id?: string | null
          detalhes?: Json | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          aula_id?: string | null
          created_at?: string | null
          curso_id?: string | null
          detalhes?: Json | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_acesso_curso_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_acesso_curso_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_acesso_curso_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_alteracao_escala: {
        Row: {
          alterado_por: string | null
          campo_alterado: string
          created_at: string
          id: string
          user_id: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          alterado_por?: string | null
          campo_alterado: string
          created_at?: string
          id?: string
          user_id: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          alterado_por?: string | null
          campo_alterado?: string
          created_at?: string
          id?: string
          user_id?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: []
      }
      logs_autorizacao_folga: {
        Row: {
          autorizado_por: string
          autorizado_por_nome: string
          created_at: string
          data_registro: string
          decisao: string
          employee_id: string
          employee_name: string
          id: string
          justificativa: string
          registro_ponto_id: string
        }
        Insert: {
          autorizado_por: string
          autorizado_por_nome: string
          created_at?: string
          data_registro: string
          decisao: string
          employee_id: string
          employee_name: string
          id?: string
          justificativa: string
          registro_ponto_id: string
        }
        Update: {
          autorizado_por?: string
          autorizado_por_nome?: string
          created_at?: string
          data_registro?: string
          decisao?: string
          employee_id?: string
          employee_name?: string
          id?: string
          justificativa?: string
          registro_ponto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "logs_autorizacao_folga_registro_ponto_id_fkey"
            columns: ["registro_ponto_id"]
            isOneToOne: false
            referencedRelation: "registros_ponto"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_edicao_ponto: {
        Row: {
          autorizado_por: string
          autorizado_por_nome: string
          campo_editado: string
          created_at: string
          data_registro: string
          employee_id: string
          employee_name: string
          id: string
          ip_address: string | null
          user_agent: string | null
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          autorizado_por: string
          autorizado_por_nome: string
          campo_editado: string
          created_at?: string
          data_registro: string
          employee_id: string
          employee_name: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          autorizado_por?: string
          autorizado_por_nome?: string
          campo_editado?: string
          created_at?: string
          data_registro?: string
          employee_id?: string
          employee_name?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
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
      matriculas: {
        Row: {
          carga_horaria_real: number | null
          confirmado: boolean
          confirmado_em: string | null
          created_at: string | null
          curso_id: string
          data_conclusao: string | null
          data_inicio: string | null
          id: string
          ip_confirmacao: string | null
          nota_final: number | null
          progresso: number | null
          status: string | null
          updated_at: string | null
          user_agent_confirmacao: string | null
          user_id: string
        }
        Insert: {
          carga_horaria_real?: number | null
          confirmado?: boolean
          confirmado_em?: string | null
          created_at?: string | null
          curso_id: string
          data_conclusao?: string | null
          data_inicio?: string | null
          id?: string
          ip_confirmacao?: string | null
          nota_final?: number | null
          progresso?: number | null
          status?: string | null
          updated_at?: string | null
          user_agent_confirmacao?: string | null
          user_id: string
        }
        Update: {
          carga_horaria_real?: number | null
          confirmado?: boolean
          confirmado_em?: string | null
          created_at?: string | null
          curso_id?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          id?: string
          ip_confirmacao?: string | null
          nota_final?: number | null
          progresso?: number | null
          status?: string | null
          updated_at?: string | null
          user_agent_confirmacao?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_chamado: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          chamado_id: string
          conteudo: string
          created_at: string
          id: string
          remetente_id: string
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          chamado_id: string
          conteudo: string
          created_at?: string
          id?: string
          remetente_id: string
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          chamado_id?: string
          conteudo?: string
          created_at?: string
          id?: string
          remetente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_chamado_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "chamados_suporte"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_chamado_remetente_id_fkey"
            columns: ["remetente_id"]
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
      modulos_curso: {
        Row: {
          created_at: string | null
          curso_id: string
          descricao: string | null
          id: string
          ordem: number | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          curso_id: string
          descricao?: string | null
          id?: string
          ordem?: number | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          curso_id?: string
          descricao?: string | null
          id?: string
          ordem?: number | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modulos_curso_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          agendado_para: string | null
          anexos: Json | null
          created_at: string
          criado_por: string | null
          destinatario_departamento: string | null
          destinatario_id: string | null
          destinatario_tipo: string
          id: string
          mensagem: string
          prioridade: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          agendado_para?: string | null
          anexos?: Json | null
          created_at?: string
          criado_por?: string | null
          destinatario_departamento?: string | null
          destinatario_id?: string | null
          destinatario_tipo?: string
          id?: string
          mensagem: string
          prioridade?: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          agendado_para?: string | null
          anexos?: Json | null
          created_at?: string
          criado_por?: string | null
          destinatario_departamento?: string | null
          destinatario_id?: string | null
          destinatario_tipo?: string
          id?: string
          mensagem?: string
          prioridade?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes_lidas: {
        Row: {
          id: string
          lido_em: string
          notificacao_id: string
          user_id: string
        }
        Insert: {
          id?: string
          lido_em?: string
          notificacao_id: string
          user_id: string
        }
        Update: {
          id?: string
          lido_em?: string
          notificacao_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_lidas_notificacao_id_fkey"
            columns: ["notificacao_id"]
            isOneToOne: false
            referencedRelation: "notificacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes_web: {
        Row: {
          categoria: string | null
          created_at: string | null
          fonte: string
          hash_conteudo: string
          id: string
          lida: boolean | null
          relevancia: string | null
          resumo: string
          titulo: string
          updated_at: string | null
          url_fonte: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          fonte: string
          hash_conteudo: string
          id?: string
          lida?: boolean | null
          relevancia?: string | null
          resumo: string
          titulo: string
          updated_at?: string | null
          url_fonte: string
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          fonte?: string
          hash_conteudo?: string
          id?: string
          lida?: boolean | null
          relevancia?: string | null
          resumo?: string
          titulo?: string
          updated_at?: string | null
          url_fonte?: string
        }
        Relationships: []
      }
      ocorrencias_ponto: {
        Row: {
          created_at: string
          data: string
          descricao: string
          id: string
          justificativa_resolucao: string | null
          registro_ponto_id: string | null
          resolvido: boolean
          resolvido_em: string | null
          resolvido_por: string | null
          severidade: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: string
          descricao: string
          id?: string
          justificativa_resolucao?: string | null
          registro_ponto_id?: string | null
          resolvido?: boolean
          resolvido_em?: string | null
          resolvido_por?: string | null
          severidade?: string
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          justificativa_resolucao?: string | null
          registro_ponto_id?: string | null
          resolvido?: boolean
          resolvido_em?: string | null
          resolvido_por?: string | null
          severidade?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencias_ponto_registro_ponto_id_fkey"
            columns: ["registro_ponto_id"]
            isOneToOne: false
            referencedRelation: "registros_ponto"
            referencedColumns: ["id"]
          },
        ]
      }
      parametros_ponto: {
        Row: {
          chave: string
          descricao: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
          valor: string
        }
        Insert: {
          chave: string
          descricao?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
          valor: string
        }
        Update: {
          chave?: string
          descricao?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
          valor?: string
        }
        Relationships: []
      }
      perguntas_avaliacao: {
        Row: {
          avaliacao_id: string
          created_at: string | null
          id: string
          opcoes: Json | null
          ordem: number | null
          pergunta: string
          pontuacao: number | null
          resposta_correta: string | null
          tipo: string | null
        }
        Insert: {
          avaliacao_id: string
          created_at?: string | null
          id?: string
          opcoes?: Json | null
          ordem?: number | null
          pergunta: string
          pontuacao?: number | null
          resposta_correta?: string | null
          tipo?: string | null
        }
        Update: {
          avaliacao_id?: string
          created_at?: string | null
          id?: string
          opcoes?: Json | null
          ordem?: number | null
          pergunta?: string
          pontuacao?: number | null
          resposta_correta?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perguntas_avaliacao_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes_curso"
            referencedColumns: ["id"]
          },
        ]
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
      pisos_salariais: {
        Row: {
          cargo: string
          convencao_id: string
          created_at: string | null
          id: string
          piso_salarial: number
        }
        Insert: {
          cargo: string
          convencao_id: string
          created_at?: string | null
          id?: string
          piso_salarial?: number
        }
        Update: {
          cargo?: string
          convencao_id?: string
          created_at?: string | null
          id?: string
          piso_salarial?: number
        }
        Relationships: [
          {
            foreignKeyName: "pisos_salariais_convencao_id_fkey"
            columns: ["convencao_id"]
            isOneToOne: false
            referencedRelation: "convencoes_coletivas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          adicional_insalubridade: string | null
          adicional_periculosidade: boolean | null
          cargo: string | null
          cbo: string | null
          cpf: string | null
          created_at: string | null
          ctps_numero: string | null
          ctps_serie: string | null
          data_admissao: string | null
          data_nascimento: string | null
          departamento: string | null
          deve_trocar_senha: boolean
          email: string
          endereco: string | null
          escala_trabalho: string | null
          estado_civil: string | null
          foto_url: string | null
          grau_insalubridade: string | null
          id: string
          matricula: string | null
          nacionalidade: string | null
          nome: string
          nome_mae: string | null
          numero_pis: string | null
          perfil_updated_at: string | null
          perfil_updated_by: string | null
          rg: string | null
          salario: number | null
          sexo: string | null
          status: string | null
          telefone: string | null
          tipo_contrato: string | null
          tipo_perfil: string
          turno: string | null
          updated_at: string | null
          usuario: string | null
        }
        Insert: {
          adicional_insalubridade?: string | null
          adicional_periculosidade?: boolean | null
          cargo?: string | null
          cbo?: string | null
          cpf?: string | null
          created_at?: string | null
          ctps_numero?: string | null
          ctps_serie?: string | null
          data_admissao?: string | null
          data_nascimento?: string | null
          departamento?: string | null
          deve_trocar_senha?: boolean
          email: string
          endereco?: string | null
          escala_trabalho?: string | null
          estado_civil?: string | null
          foto_url?: string | null
          grau_insalubridade?: string | null
          id: string
          matricula?: string | null
          nacionalidade?: string | null
          nome: string
          nome_mae?: string | null
          numero_pis?: string | null
          perfil_updated_at?: string | null
          perfil_updated_by?: string | null
          rg?: string | null
          salario?: number | null
          sexo?: string | null
          status?: string | null
          telefone?: string | null
          tipo_contrato?: string | null
          tipo_perfil?: string
          turno?: string | null
          updated_at?: string | null
          usuario?: string | null
        }
        Update: {
          adicional_insalubridade?: string | null
          adicional_periculosidade?: boolean | null
          cargo?: string | null
          cbo?: string | null
          cpf?: string | null
          created_at?: string | null
          ctps_numero?: string | null
          ctps_serie?: string | null
          data_admissao?: string | null
          data_nascimento?: string | null
          departamento?: string | null
          deve_trocar_senha?: boolean
          email?: string
          endereco?: string | null
          escala_trabalho?: string | null
          estado_civil?: string | null
          foto_url?: string | null
          grau_insalubridade?: string | null
          id?: string
          matricula?: string | null
          nacionalidade?: string | null
          nome?: string
          nome_mae?: string | null
          numero_pis?: string | null
          perfil_updated_at?: string | null
          perfil_updated_by?: string | null
          rg?: string | null
          salario?: number | null
          sexo?: string | null
          status?: string | null
          telefone?: string | null
          tipo_contrato?: string | null
          tipo_perfil?: string
          turno?: string | null
          updated_at?: string | null
          usuario?: string | null
        }
        Relationships: []
      }
      progresso_aulas: {
        Row: {
          aula_id: string
          concluida: boolean | null
          created_at: string | null
          data_conclusao: string | null
          id: string
          posicao_video: number | null
          tempo_assistido: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          aula_id: string
          concluida?: boolean | null
          created_at?: string | null
          data_conclusao?: string | null
          id?: string
          posicao_video?: number | null
          tempo_assistido?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          aula_id?: string
          concluida?: boolean | null
          created_at?: string | null
          data_conclusao?: string | null
          id?: string
          posicao_video?: number | null
          tempo_assistido?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_aulas_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_aulas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_ponto: {
        Row: {
          adicional_noturno: string | null
          created_at: string
          data: string
          empresa_id: string | null
          entrada: string | null
          fim_he: string | null
          geolocation: string | null
          hash_anterior: string | null
          hash_registro: string | null
          horas_extras: string | null
          horas_noturnas: string | null
          horas_noturnas_fictas: string | null
          id: string
          inicio_he: string | null
          ip_address: string | null
          justificativa_folga: string | null
          origem: string | null
          percentual_he: number | null
          registro_folga: boolean
          retorno_almoco: string | null
          retorno_pausa_1: string | null
          retorno_pausa_2: string | null
          saida: string | null
          saida_almoco: string | null
          saida_pausa_1: string | null
          saida_pausa_2: string | null
          status_admin: string | null
          status_validacao: string
          tipo_dia: string | null
          total_horas: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          adicional_noturno?: string | null
          created_at?: string
          data?: string
          empresa_id?: string | null
          entrada?: string | null
          fim_he?: string | null
          geolocation?: string | null
          hash_anterior?: string | null
          hash_registro?: string | null
          horas_extras?: string | null
          horas_noturnas?: string | null
          horas_noturnas_fictas?: string | null
          id?: string
          inicio_he?: string | null
          ip_address?: string | null
          justificativa_folga?: string | null
          origem?: string | null
          percentual_he?: number | null
          registro_folga?: boolean
          retorno_almoco?: string | null
          retorno_pausa_1?: string | null
          retorno_pausa_2?: string | null
          saida?: string | null
          saida_almoco?: string | null
          saida_pausa_1?: string | null
          saida_pausa_2?: string | null
          status_admin?: string | null
          status_validacao?: string
          tipo_dia?: string | null
          total_horas?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          adicional_noturno?: string | null
          created_at?: string
          data?: string
          empresa_id?: string | null
          entrada?: string | null
          fim_he?: string | null
          geolocation?: string | null
          hash_anterior?: string | null
          hash_registro?: string | null
          horas_extras?: string | null
          horas_noturnas?: string | null
          horas_noturnas_fictas?: string | null
          id?: string
          inicio_he?: string | null
          ip_address?: string | null
          justificativa_folga?: string | null
          origem?: string | null
          percentual_he?: number | null
          registro_folga?: boolean
          retorno_almoco?: string | null
          retorno_pausa_1?: string | null
          retorno_pausa_2?: string | null
          saida?: string | null
          saida_almoco?: string | null
          saida_pausa_1?: string | null
          saida_pausa_2?: string | null
          status_admin?: string | null
          status_validacao?: string
          tipo_dia?: string | null
          total_horas?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_ponto_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_ponto_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_sobreaviso: {
        Row: {
          acionado: boolean | null
          created_at: string | null
          data: string
          fim: string
          horas_sobreaviso: string | null
          id: string
          inicio: string
          observacoes: string | null
          updated_at: string | null
          user_id: string
          valor_hora_sobreaviso: number | null
        }
        Insert: {
          acionado?: boolean | null
          created_at?: string | null
          data: string
          fim: string
          horas_sobreaviso?: string | null
          id?: string
          inicio: string
          observacoes?: string | null
          updated_at?: string | null
          user_id: string
          valor_hora_sobreaviso?: number | null
        }
        Update: {
          acionado?: boolean | null
          created_at?: string | null
          data?: string
          fim?: string
          horas_sobreaviso?: string | null
          id?: string
          inicio?: string
          observacoes?: string | null
          updated_at?: string | null
          user_id?: string
          valor_hora_sobreaviso?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "registros_sobreaviso_user_id_fkey"
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
      rescisoes: {
        Row: {
          aviso_previo_dias: number | null
          aviso_previo_trabalhado: boolean | null
          aviso_previo_valor: number | null
          calculado_por: string | null
          created_at: string
          data_demissao: string
          decimo_terceiro_proporcional: number | null
          ferias_proporcionais: number | null
          ferias_vencidas: number | null
          finalizado_por: string | null
          id: string
          motivo: string | null
          multa_fgts: number | null
          salario_base: number
          saldo_salario: number | null
          status: string
          terco_ferias: number | null
          tipo_rescisao: string
          total_rescisao: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aviso_previo_dias?: number | null
          aviso_previo_trabalhado?: boolean | null
          aviso_previo_valor?: number | null
          calculado_por?: string | null
          created_at?: string
          data_demissao: string
          decimo_terceiro_proporcional?: number | null
          ferias_proporcionais?: number | null
          ferias_vencidas?: number | null
          finalizado_por?: string | null
          id?: string
          motivo?: string | null
          multa_fgts?: number | null
          salario_base: number
          saldo_salario?: number | null
          status?: string
          terco_ferias?: number | null
          tipo_rescisao: string
          total_rescisao?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aviso_previo_dias?: number | null
          aviso_previo_trabalhado?: boolean | null
          aviso_previo_valor?: number | null
          calculado_por?: string | null
          created_at?: string
          data_demissao?: string
          decimo_terceiro_proporcional?: number | null
          ferias_proporcionais?: number | null
          ferias_vencidas?: number | null
          finalizado_por?: string | null
          id?: string
          motivo?: string | null
          multa_fgts?: number | null
          salario_base?: number
          saldo_salario?: number | null
          status?: string
          terco_ferias?: number | null
          tipo_rescisao?: string
          total_rescisao?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rescisoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes_ajuste_ponto: {
        Row: {
          aprovado_por: string | null
          aprovado_por_nome: string | null
          campo: string
          created_at: string
          data_aprovacao: string | null
          data_registro: string
          id: string
          motivo: string
          motivo_rejeicao: string | null
          registro_ponto_id: string | null
          status: string
          updated_at: string
          user_id: string
          valor_original: string | null
          valor_solicitado: string
        }
        Insert: {
          aprovado_por?: string | null
          aprovado_por_nome?: string | null
          campo: string
          created_at?: string
          data_aprovacao?: string | null
          data_registro: string
          id?: string
          motivo: string
          motivo_rejeicao?: string | null
          registro_ponto_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
          valor_original?: string | null
          valor_solicitado: string
        }
        Update: {
          aprovado_por?: string | null
          aprovado_por_nome?: string | null
          campo?: string
          created_at?: string
          data_aprovacao?: string | null
          data_registro?: string
          id?: string
          motivo?: string
          motivo_rejeicao?: string | null
          registro_ponto_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          valor_original?: string | null
          valor_solicitado?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_ajuste_ponto_registro_ponto_id_fkey"
            columns: ["registro_ponto_id"]
            isOneToOne: false
            referencedRelation: "registros_ponto"
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
          data_pagamento: string | null
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
          data_pagamento?: string | null
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
          data_pagamento?: string | null
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
      sst_documentos: {
        Row: {
          arquivo_nome: string
          arquivo_tamanho: number | null
          arquivo_url: string
          created_at: string | null
          id: string
          mime_type: string | null
          registro_id: string
          registro_tipo: string
          uploaded_by: string | null
        }
        Insert: {
          arquivo_nome: string
          arquivo_tamanho?: number | null
          arquivo_url: string
          created_at?: string | null
          id?: string
          mime_type?: string | null
          registro_id: string
          registro_tipo: string
          uploaded_by?: string | null
        }
        Update: {
          arquivo_nome?: string
          arquivo_tamanho?: number | null
          arquivo_url?: string
          created_at?: string | null
          id?: string
          mime_type?: string | null
          registro_id?: string
          registro_tipo?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      tentativas_avaliacao: {
        Row: {
          aprovado: boolean | null
          avaliacao_id: string
          created_at: string | null
          data_conclusao: string | null
          data_inicio: string | null
          id: string
          nota: number | null
          respostas: Json | null
          tempo_gasto: number | null
          user_id: string
        }
        Insert: {
          aprovado?: boolean | null
          avaliacao_id: string
          created_at?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          id?: string
          nota?: number | null
          respostas?: Json | null
          tempo_gasto?: number | null
          user_id: string
        }
        Update: {
          aprovado?: boolean | null
          avaliacao_id?: string
          created_at?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          id?: string
          nota?: number | null
          respostas?: Json | null
          tempo_gasto?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tentativas_avaliacao_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes_curso"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tentativas_avaliacao_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trilhas_aprendizado: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string | null
          cursos_ids: string[] | null
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          cursos_ids?: string[] | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          cursos_ids?: string[] | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      turnos_trabalho: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          escala_id: string | null
          hora_fim: string
          hora_inicio: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          escala_id?: string | null
          hora_fim?: string
          hora_inicio?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          escala_id?: string | null
          hora_fim?: string
          hora_inicio?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turnos_trabalho_escala_id_fkey"
            columns: ["escala_id"]
            isOneToOne: false
            referencedRelation: "escalas_trabalho"
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
      calcular_horas_noturnas: {
        Args: { p_entrada: string; p_saida: string }
        Returns: string
      }
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
        Returns: string
      }
      calcular_saldo_banco_horas: {
        Args: { p_user_id: string }
        Returns: {
          creditos_vencidos: number
          saldo: number
          total_credito: number
          total_debito: number
        }[]
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
      is_document_creator: {
        Args: { _user_id: string; doc_id: string }
        Returns: boolean
      }
      is_feriado: { Args: { p_data: string }; Returns: boolean }
      user_has_document_permission: {
        Args: { _user_id: string; doc_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "rh" | "funcionario"
      curso_nivel: "basico" | "intermediario" | "avancado"
      curso_status: "rascunho" | "publicado" | "arquivado"
      documento_tipo:
        | "pdf"
        | "docx"
        | "xlsx"
        | "pptx"
        | "imagem"
        | "video"
        | "audio"
        | "outro"
      form_category:
        | "admissao"
        | "desligamento"
        | "avaliacao_desempenho"
        | "feedback"
        | "solicitacao"
        | "treinamento"
        | "documentos"
        | "outro"
      form_field_type:
        | "text"
        | "textarea"
        | "select"
        | "checkbox"
        | "date"
        | "file"
        | "number"
        | "email"
        | "phone"
        | "radio"
        | "likert"
        | "nps"
        | "signature"
        | "section"
        | "paragraph"
      form_status:
        | "rascunho"
        | "pendente_aprovacao"
        | "aprovado"
        | "publicado"
        | "arquivado"
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
      curso_nivel: ["basico", "intermediario", "avancado"],
      curso_status: ["rascunho", "publicado", "arquivado"],
      documento_tipo: [
        "pdf",
        "docx",
        "xlsx",
        "pptx",
        "imagem",
        "video",
        "audio",
        "outro",
      ],
      form_category: [
        "admissao",
        "desligamento",
        "avaliacao_desempenho",
        "feedback",
        "solicitacao",
        "treinamento",
        "documentos",
        "outro",
      ],
      form_field_type: [
        "text",
        "textarea",
        "select",
        "checkbox",
        "date",
        "file",
        "number",
        "email",
        "phone",
        "radio",
        "likert",
        "nps",
        "signature",
        "section",
        "paragraph",
      ],
      form_status: [
        "rascunho",
        "pendente_aprovacao",
        "aprovado",
        "publicado",
        "arquivado",
      ],
    },
  },
} as const
