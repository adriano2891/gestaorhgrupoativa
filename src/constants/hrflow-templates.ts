import { FormTemplate } from '@/types/hrflow';

export const HR_TEMPLATES: FormTemplate[] = [
  // ONBOARDING
  {
    id: 'onboarding-checklist',
    title: 'Checklist de Onboarding',
    description: 'Lista de verificação completa para integração de novos colaboradores',
    category: 'onboarding',
    icon: 'ClipboardCheck',
    estimatedTime: '15 min',
    popular: true,
    fields: [
      { id: '1', type: 'section', label: 'Documentação', required: false },
      { id: '2', type: 'checkbox', label: 'Documentos pessoais entregues', required: true, options: ['RG', 'CPF', 'Comprovante de Residência', 'Carteira de Trabalho', 'Foto 3x4'] },
      { id: '3', type: 'date', label: 'Data de admissão', required: true },
      { id: '4', type: 'section', label: 'Infraestrutura', required: false },
      { id: '5', type: 'checkbox', label: 'Itens recebidos', required: true, options: ['Notebook/Computador', 'Crachá', 'Acesso ao e-mail', 'Acesso aos sistemas', 'Mesa e cadeira'] },
      { id: '6', type: 'textarea', label: 'Observações adicionais', required: false },
      { id: '7', type: 'signature', label: 'Assinatura do colaborador', required: true }
    ]
  },
  {
    id: 'onboarding-welcome',
    title: 'Formulário de Boas-Vindas',
    description: 'Colete informações pessoais e preferências do novo colaborador',
    category: 'onboarding',
    icon: 'Heart',
    estimatedTime: '10 min',
    fields: [
      { id: '1', type: 'text', label: 'Nome completo', required: true },
      { id: '2', type: 'text', label: 'Apelido preferido', required: false },
      { id: '3', type: 'date', label: 'Data de nascimento', required: true },
      { id: '4', type: 'select', label: 'Tamanho de camiseta', required: false, options: ['PP', 'P', 'M', 'G', 'GG', 'XGG'] },
      { id: '5', type: 'textarea', label: 'Restrições alimentares', required: false },
      { id: '6', type: 'textarea', label: 'Hobbies e interesses', required: false },
      { id: '7', type: 'text', label: 'Contato de emergência', required: true },
      { id: '8', type: 'phone', label: 'Telefone do contato', required: true }
    ]
  },
  {
    id: 'onboarding-30days',
    title: 'Avaliação 30 Dias',
    description: 'Feedback do colaborador após o primeiro mês',
    category: 'onboarding',
    icon: 'Calendar',
    estimatedTime: '8 min',
    fields: [
      { id: '1', type: 'likert', label: 'Como você avalia seu processo de integração?', required: true, likertScale: 5, likertLabels: { min: 'Muito ruim', max: 'Excelente' } },
      { id: '2', type: 'likert', label: 'Você recebeu as ferramentas necessárias para trabalhar?', required: true, likertScale: 5, likertLabels: { min: 'Discordo totalmente', max: 'Concordo totalmente' } },
      { id: '3', type: 'likert', label: 'Seu gestor está disponível para tirar dúvidas?', required: true, likertScale: 5, likertLabels: { min: 'Discordo totalmente', max: 'Concordo totalmente' } },
      { id: '4', type: 'textarea', label: 'O que poderia ter sido melhor na sua integração?', required: false },
      { id: '5', type: 'textarea', label: 'O que você mais gostou até agora?', required: false }
    ]
  },

  // DESEMPENHO
  {
    id: 'avaliacao-desempenho',
    title: 'Avaliação de Desempenho',
    description: 'Avaliação completa de performance do colaborador',
    category: 'desempenho',
    icon: 'TrendingUp',
    estimatedTime: '20 min',
    popular: true,
    fields: [
      { id: '1', type: 'section', label: 'Informações do Avaliado', required: false },
      { id: '2', type: 'text', label: 'Nome do colaborador', required: true },
      { id: '3', type: 'text', label: 'Cargo', required: true },
      { id: '4', type: 'text', label: 'Departamento', required: true },
      { id: '5', type: 'section', label: 'Competências Técnicas', required: false },
      { id: '6', type: 'likert', label: 'Conhecimento técnico da função', required: true, likertScale: 5, likertLabels: { min: 'Abaixo do esperado', max: 'Excepcional' } },
      { id: '7', type: 'likert', label: 'Qualidade das entregas', required: true, likertScale: 5, likertLabels: { min: 'Abaixo do esperado', max: 'Excepcional' } },
      { id: '8', type: 'likert', label: 'Cumprimento de prazos', required: true, likertScale: 5, likertLabels: { min: 'Abaixo do esperado', max: 'Excepcional' } },
      { id: '9', type: 'section', label: 'Competências Comportamentais', required: false },
      { id: '10', type: 'likert', label: 'Trabalho em equipe', required: true, likertScale: 5, likertLabels: { min: 'Abaixo do esperado', max: 'Excepcional' } },
      { id: '11', type: 'likert', label: 'Comunicação', required: true, likertScale: 5, likertLabels: { min: 'Abaixo do esperado', max: 'Excepcional' } },
      { id: '12', type: 'likert', label: 'Proatividade', required: true, likertScale: 5, likertLabels: { min: 'Abaixo do esperado', max: 'Excepcional' } },
      { id: '13', type: 'textarea', label: 'Pontos fortes observados', required: true },
      { id: '14', type: 'textarea', label: 'Pontos de melhoria', required: true },
      { id: '15', type: 'textarea', label: 'Metas para o próximo período', required: true }
    ]
  },
  {
    id: 'pdi',
    title: 'Plano de Desenvolvimento Individual (PDI)',
    description: 'Defina metas e ações de desenvolvimento para o colaborador',
    category: 'desempenho',
    icon: 'Target',
    estimatedTime: '15 min',
    popular: true,
    fields: [
      { id: '1', type: 'text', label: 'Nome do colaborador', required: true },
      { id: '2', type: 'text', label: 'Cargo atual', required: true },
      { id: '3', type: 'textarea', label: 'Aspirações de carreira', required: true },
      { id: '4', type: 'section', label: 'Meta 1', required: false },
      { id: '5', type: 'text', label: 'Descrição da meta', required: true },
      { id: '6', type: 'date', label: 'Prazo', required: true },
      { id: '7', type: 'textarea', label: 'Ações necessárias', required: true },
      { id: '8', type: 'section', label: 'Meta 2', required: false },
      { id: '9', type: 'text', label: 'Descrição da meta', required: true },
      { id: '10', type: 'date', label: 'Prazo', required: true },
      { id: '11', type: 'textarea', label: 'Ações necessárias', required: true },
      { id: '12', type: 'signature', label: 'Assinatura do colaborador', required: true },
      { id: '13', type: 'signature', label: 'Assinatura do gestor', required: true }
    ]
  },
  {
    id: 'feedback-360',
    title: 'Feedback 360°',
    description: 'Avaliação por múltiplas perspectivas',
    category: 'desempenho',
    icon: 'Users',
    estimatedTime: '12 min',
    fields: [
      { id: '1', type: 'text', label: 'Nome do avaliado', required: true },
      { id: '2', type: 'select', label: 'Sua relação com o avaliado', required: true, options: ['Gestor direto', 'Par/Colega', 'Subordinado', 'Cliente interno'] },
      { id: '3', type: 'likert', label: 'Demonstra liderança e iniciativa', required: true, likertScale: 5, likertLabels: { min: 'Raramente', max: 'Sempre' } },
      { id: '4', type: 'likert', label: 'Comunica-se de forma clara e objetiva', required: true, likertScale: 5, likertLabels: { min: 'Raramente', max: 'Sempre' } },
      { id: '5', type: 'likert', label: 'Colabora com a equipe', required: true, likertScale: 5, likertLabels: { min: 'Raramente', max: 'Sempre' } },
      { id: '6', type: 'likert', label: 'Aceita e implementa feedbacks', required: true, likertScale: 5, likertLabels: { min: 'Raramente', max: 'Sempre' } },
      { id: '7', type: 'textarea', label: 'O que essa pessoa faz de melhor?', required: true },
      { id: '8', type: 'textarea', label: 'O que essa pessoa pode melhorar?', required: true }
    ]
  },

  // CLIMA
  {
    id: 'pesquisa-clima',
    title: 'Pesquisa de Clima Organizacional',
    description: 'Avalie a satisfação e engajamento dos colaboradores',
    category: 'clima',
    icon: 'Smile',
    estimatedTime: '10 min',
    popular: true,
    fields: [
      { id: '1', type: 'paragraph', label: 'Esta pesquisa é anônima e confidencial. Suas respostas nos ajudarão a melhorar o ambiente de trabalho.', required: false },
      { id: '2', type: 'section', label: 'Ambiente de Trabalho', required: false },
      { id: '3', type: 'likert', label: 'Estou satisfeito com o ambiente físico de trabalho', required: true, likertScale: 5, likertLabels: { min: 'Discordo totalmente', max: 'Concordo totalmente' } },
      { id: '4', type: 'likert', label: 'Tenho os recursos necessários para realizar meu trabalho', required: true, likertScale: 5, likertLabels: { min: 'Discordo totalmente', max: 'Concordo totalmente' } },
      { id: '5', type: 'section', label: 'Liderança', required: false },
      { id: '6', type: 'likert', label: 'Meu gestor está disponível quando preciso', required: true, likertScale: 5, likertLabels: { min: 'Discordo totalmente', max: 'Concordo totalmente' } },
      { id: '7', type: 'likert', label: 'Recebo feedbacks construtivos regularmente', required: true, likertScale: 5, likertLabels: { min: 'Discordo totalmente', max: 'Concordo totalmente' } },
      { id: '8', type: 'section', label: 'Desenvolvimento', required: false },
      { id: '9', type: 'likert', label: 'Tenho oportunidades de crescimento na empresa', required: true, likertScale: 5, likertLabels: { min: 'Discordo totalmente', max: 'Concordo totalmente' } },
      { id: '10', type: 'nps', label: 'De 0 a 10, qual a probabilidade de recomendar a empresa como lugar para trabalhar?', required: true },
      { id: '11', type: 'textarea', label: 'O que mais te agrada na empresa?', required: false },
      { id: '12', type: 'textarea', label: 'O que poderia ser melhorado?', required: false }
    ]
  },
  {
    id: 'enps',
    title: 'eNPS (Employee Net Promoter Score)',
    description: 'Meça a lealdade dos colaboradores de forma rápida',
    category: 'clima',
    icon: 'ThumbsUp',
    estimatedTime: '3 min',
    popular: true,
    fields: [
      { id: '1', type: 'nps', label: 'De 0 a 10, qual a probabilidade de você recomendar a empresa como lugar para trabalhar?', required: true },
      { id: '2', type: 'textarea', label: 'O que motivou sua resposta?', required: true },
      { id: '3', type: 'textarea', label: 'O que podemos fazer para melhorar?', required: false }
    ]
  },
  {
    id: 'pulse-check',
    title: 'Pulse Check Semanal',
    description: 'Pesquisa rápida de bem-estar semanal',
    category: 'clima',
    icon: 'Activity',
    estimatedTime: '2 min',
    fields: [
      { id: '1', type: 'likert', label: 'Como você está se sentindo esta semana?', required: true, likertScale: 5, likertLabels: { min: '😞 Muito mal', max: '😊 Muito bem' } },
      { id: '2', type: 'likert', label: 'Sua carga de trabalho está adequada?', required: true, likertScale: 5, likertLabels: { min: 'Muito pesada', max: 'Adequada' } },
      { id: '3', type: 'textarea', label: 'Algo que queira compartilhar?', required: false }
    ]
  },

  // RECRUTAMENTO
  {
    id: 'formulario-candidatura',
    title: 'Formulário de Candidatura',
    description: 'Colete informações de candidatos para vagas abertas',
    category: 'recrutamento',
    icon: 'UserPlus',
    estimatedTime: '15 min',
    fields: [
      { id: '1', type: 'text', label: 'Nome completo', required: true },
      { id: '2', type: 'email', label: 'E-mail', required: true },
      { id: '3', type: 'phone', label: 'Telefone', required: true },
      { id: '4', type: 'text', label: 'Vaga pretendida', required: true },
      { id: '5', type: 'textarea', label: 'Resumo profissional', required: true },
      { id: '6', type: 'text', label: 'Pretensão salarial', required: false },
      { id: '7', type: 'select', label: 'Disponibilidade para início', required: true, options: ['Imediata', '15 dias', '30 dias', 'A combinar'] },
      { id: '8', type: 'file', label: 'Currículo (PDF)', required: true }
    ]
  },
  {
    id: 'avaliacao-entrevista',
    title: 'Avaliação de Entrevista',
    description: 'Registre suas impressões sobre o candidato',
    category: 'recrutamento',
    icon: 'ClipboardList',
    estimatedTime: '10 min',
    fields: [
      { id: '1', type: 'text', label: 'Nome do candidato', required: true },
      { id: '2', type: 'text', label: 'Vaga', required: true },
      { id: '3', type: 'text', label: 'Entrevistador', required: true },
      { id: '4', type: 'likert', label: 'Comunicação verbal', required: true, likertScale: 5, likertLabels: { min: 'Fraca', max: 'Excelente' } },
      { id: '5', type: 'likert', label: 'Conhecimento técnico', required: true, likertScale: 5, likertLabels: { min: 'Fraco', max: 'Excelente' } },
      { id: '6', type: 'likert', label: 'Fit cultural', required: true, likertScale: 5, likertLabels: { min: 'Baixo', max: 'Alto' } },
      { id: '7', type: 'radio', label: 'Recomendação', required: true, options: ['Aprovar', 'Considerar', 'Reprovar'] },
      { id: '8', type: 'textarea', label: 'Observações detalhadas', required: true }
    ]
  },
  {
    id: 'referencia-profissional',
    title: 'Verificação de Referências',
    description: 'Colete referências profissionais do candidato',
    category: 'recrutamento',
    icon: 'Phone',
    estimatedTime: '10 min',
    fields: [
      { id: '1', type: 'text', label: 'Nome do candidato', required: true },
      { id: '2', type: 'text', label: 'Nome da referência', required: true },
      { id: '3', type: 'text', label: 'Empresa', required: true },
      { id: '4', type: 'text', label: 'Cargo na época', required: true },
      { id: '5', type: 'text', label: 'Período de trabalho', required: true },
      { id: '6', type: 'likert', label: 'Qualidade do trabalho', required: true, likertScale: 5, likertLabels: { min: 'Ruim', max: 'Excelente' } },
      { id: '7', type: 'likert', label: 'Pontualidade e assiduidade', required: true, likertScale: 5, likertLabels: { min: 'Ruim', max: 'Excelente' } },
      { id: '8', type: 'radio', label: 'Contrataria novamente?', required: true, options: ['Sim', 'Talvez', 'Não'] },
      { id: '9', type: 'textarea', label: 'Comentários adicionais', required: false }
    ]
  },

  // DESLIGAMENTO
  {
    id: 'exit-interview',
    title: 'Entrevista de Desligamento',
    description: 'Colete feedback do colaborador que está saindo',
    category: 'desligamento',
    icon: 'DoorOpen',
    estimatedTime: '12 min',
    popular: true,
    fields: [
      { id: '1', type: 'text', label: 'Nome', required: true },
      { id: '2', type: 'text', label: 'Cargo', required: true },
      { id: '3', type: 'text', label: 'Tempo de empresa', required: true },
      { id: '4', type: 'select', label: 'Motivo principal da saída', required: true, options: ['Nova oportunidade', 'Insatisfação salarial', 'Falta de crescimento', 'Problemas com liderança', 'Mudança de cidade', 'Motivos pessoais', 'Outros'] },
      { id: '5', type: 'likert', label: 'Satisfação geral com a empresa', required: true, likertScale: 5, likertLabels: { min: 'Muito insatisfeito', max: 'Muito satisfeito' } },
      { id: '6', type: 'likert', label: 'Relacionamento com colegas', required: true, likertScale: 5, likertLabels: { min: 'Muito ruim', max: 'Excelente' } },
      { id: '7', type: 'likert', label: 'Relacionamento com liderança', required: true, likertScale: 5, likertLabels: { min: 'Muito ruim', max: 'Excelente' } },
      { id: '8', type: 'nps', label: 'Recomendaria a empresa como lugar para trabalhar?', required: true },
      { id: '9', type: 'textarea', label: 'O que mais gostou na empresa?', required: true },
      { id: '10', type: 'textarea', label: 'O que poderia ter sido melhor?', required: true },
      { id: '11', type: 'textarea', label: 'Sugestões para a empresa', required: false }
    ]
  },
  {
    id: 'termo-rescisao',
    title: 'Termo de Rescisão',
    description: 'Documento formal de desligamento',
    category: 'desligamento',
    icon: 'FileText',
    estimatedTime: '5 min',
    fields: [
      { id: '1', type: 'text', label: 'Nome completo', required: true },
      { id: '2', type: 'text', label: 'CPF', required: true },
      { id: '3', type: 'text', label: 'Cargo', required: true },
      { id: '4', type: 'date', label: 'Data de admissão', required: true },
      { id: '5', type: 'date', label: 'Data de desligamento', required: true },
      { id: '6', type: 'checkbox', label: 'Itens devolvidos', required: true, options: ['Crachá', 'Notebook/Equipamentos', 'Cartão de acesso', 'Uniformes', 'Outros materiais'] },
      { id: '7', type: 'signature', label: 'Assinatura do colaborador', required: true },
      { id: '8', type: 'signature', label: 'Assinatura do RH', required: true }
    ]
  },

  // TREINAMENTO
  {
    id: 'avaliacao-treinamento',
    title: 'Avaliação de Treinamento',
    description: 'Feedback pós-treinamento',
    category: 'treinamento',
    icon: 'GraduationCap',
    estimatedTime: '8 min',
    fields: [
      { id: '1', type: 'text', label: 'Nome do treinamento', required: true },
      { id: '2', type: 'date', label: 'Data do treinamento', required: true },
      { id: '3', type: 'text', label: 'Instrutor/Facilitador', required: true },
      { id: '4', type: 'likert', label: 'Conteúdo do treinamento', required: true, likertScale: 5, likertLabels: { min: 'Ruim', max: 'Excelente' } },
      { id: '5', type: 'likert', label: 'Didática do instrutor', required: true, likertScale: 5, likertLabels: { min: 'Ruim', max: 'Excelente' } },
      { id: '6', type: 'likert', label: 'Material disponibilizado', required: true, likertScale: 5, likertLabels: { min: 'Ruim', max: 'Excelente' } },
      { id: '7', type: 'likert', label: 'Aplicabilidade no dia-a-dia', required: true, likertScale: 5, likertLabels: { min: 'Baixa', max: 'Alta' } },
      { id: '8', type: 'nps', label: 'Recomendaria este treinamento?', required: true },
      { id: '9', type: 'textarea', label: 'Sugestões de melhoria', required: false }
    ]
  },
  {
    id: 'solicitacao-treinamento',
    title: 'Solicitação de Treinamento',
    description: 'Solicite treinamentos e capacitações',
    category: 'treinamento',
    icon: 'BookOpen',
    estimatedTime: '5 min',
    fields: [
      { id: '1', type: 'text', label: 'Seu nome', required: true },
      { id: '2', type: 'text', label: 'Departamento', required: true },
      { id: '3', type: 'text', label: 'Nome do treinamento/curso', required: true },
      { id: '4', type: 'textarea', label: 'Objetivo do treinamento', required: true },
      { id: '5', type: 'select', label: 'Modalidade', required: true, options: ['Presencial', 'Online síncrono', 'Online assíncrono', 'Híbrido'] },
      { id: '6', type: 'number', label: 'Investimento estimado (R$)', required: false },
      { id: '7', type: 'date', label: 'Data pretendida', required: false },
      { id: '8', type: 'textarea', label: 'Justificativa', required: true }
    ]
  },

  // FEEDBACK
  {
    id: 'feedback-1-1',
    title: 'Feedback 1:1',
    description: 'Registro de reunião individual com colaborador',
    category: 'feedback',
    icon: 'MessageCircle',
    estimatedTime: '10 min',
    fields: [
      { id: '1', type: 'text', label: 'Nome do colaborador', required: true },
      { id: '2', type: 'date', label: 'Data da reunião', required: true },
      { id: '3', type: 'section', label: 'Tópicos Discutidos', required: false },
      { id: '4', type: 'textarea', label: 'Conquistas e sucessos recentes', required: true },
      { id: '5', type: 'textarea', label: 'Desafios enfrentados', required: true },
      { id: '6', type: 'textarea', label: 'Metas para o próximo período', required: true },
      { id: '7', type: 'textarea', label: 'Suporte necessário do gestor', required: false },
      { id: '8', type: 'textarea', label: 'Ações acordadas', required: true }
    ]
  },
  {
    id: 'feedback-projeto',
    title: 'Feedback de Projeto',
    description: 'Avaliação de performance em projeto específico',
    category: 'feedback',
    icon: 'Folder',
    estimatedTime: '8 min',
    fields: [
      { id: '1', type: 'text', label: 'Nome do projeto', required: true },
      { id: '2', type: 'text', label: 'Participante avaliado', required: true },
      { id: '3', type: 'likert', label: 'Cumprimento de prazos', required: true, likertScale: 5, likertLabels: { min: 'Nunca', max: 'Sempre' } },
      { id: '4', type: 'likert', label: 'Qualidade das entregas', required: true, likertScale: 5, likertLabels: { min: 'Baixa', max: 'Alta' } },
      { id: '5', type: 'likert', label: 'Colaboração com a equipe', required: true, likertScale: 5, likertLabels: { min: 'Baixa', max: 'Alta' } },
      { id: '6', type: 'textarea', label: 'Principais contribuições', required: true },
      { id: '7', type: 'textarea', label: 'Pontos de melhoria', required: false }
    ]
  },

  // COMPLIANCE
  {
    id: 'aceite-politica',
    title: 'Aceite de Políticas',
    description: 'Confirmação de leitura e aceite de políticas internas',
    category: 'compliance',
    icon: 'Shield',
    estimatedTime: '5 min',
    fields: [
      { id: '1', type: 'paragraph', label: 'Declaro que li e compreendi as políticas da empresa listadas abaixo.', required: false },
      { id: '2', type: 'checkbox', label: 'Políticas aceitas', required: true, options: ['Código de Conduta', 'Política de Segurança da Informação', 'Política de Privacidade (LGPD)', 'Política de Uso de Equipamentos', 'Regulamento Interno'] },
      { id: '3', type: 'text', label: 'Nome completo', required: true },
      { id: '4', type: 'text', label: 'CPF', required: true },
      { id: '5', type: 'date', label: 'Data', required: true },
      { id: '6', type: 'signature', label: 'Assinatura digital', required: true }
    ]
  },
  {
    id: 'relato-etico',
    title: 'Canal de Ética - Relato',
    description: 'Reporte condutas inadequadas de forma confidencial',
    category: 'compliance',
    icon: 'AlertTriangle',
    estimatedTime: '10 min',
    fields: [
      { id: '1', type: 'paragraph', label: 'Este canal é 100% confidencial. Você pode fazer o relato de forma anônima.', required: false },
      { id: '2', type: 'radio', label: 'Deseja se identificar?', required: true, options: ['Sim', 'Prefiro não me identificar'] },
      { id: '3', type: 'text', label: 'Nome (opcional)', required: false },
      { id: '4', type: 'select', label: 'Tipo de relato', required: true, options: ['Assédio moral', 'Assédio sexual', 'Discriminação', 'Fraude', 'Conflito de interesses', 'Outros'] },
      { id: '5', type: 'textarea', label: 'Descreva a situação em detalhes', required: true, helpText: 'Inclua datas, locais e pessoas envolvidas' },
      { id: '6', type: 'file', label: 'Evidências (opcional)', required: false }
    ]
  },

  // BENEFÍCIOS
  {
    id: 'adesao-beneficios',
    title: 'Adesão a Benefícios',
    description: 'Formulário de escolha de benefícios',
    category: 'beneficios',
    icon: 'Gift',
    estimatedTime: '8 min',
    fields: [
      { id: '1', type: 'text', label: 'Nome completo', required: true },
      { id: '2', type: 'text', label: 'CPF', required: true },
      { id: '3', type: 'section', label: 'Plano de Saúde', required: false },
      { id: '4', type: 'radio', label: 'Deseja aderir ao plano de saúde?', required: true, options: ['Sim, individual', 'Sim, com dependentes', 'Não'] },
      { id: '5', type: 'section', label: 'Vale Alimentação/Refeição', required: false },
      { id: '6', type: 'radio', label: 'Escolha a divisão do vale', required: true, options: ['100% VA', '100% VR', '50% VA + 50% VR'] },
      { id: '7', type: 'section', label: 'Outros Benefícios', required: false },
      { id: '8', type: 'checkbox', label: 'Selecione os benefícios desejados', required: false, options: ['Plano odontológico', 'Seguro de vida', 'Gympass', 'Auxílio creche'] },
      { id: '9', type: 'signature', label: 'Assinatura', required: true }
    ]
  }
];

export const CATEGORY_ICONS: Record<string, string> = {
  onboarding: 'UserPlus',
  desempenho: 'TrendingUp',
  clima: 'Smile',
  recrutamento: 'Search',
  desligamento: 'DoorOpen',
  treinamento: 'GraduationCap',
  feedback: 'MessageCircle',
  compliance: 'Shield',
  beneficios: 'Gift',
  outros: 'FileText'
};
