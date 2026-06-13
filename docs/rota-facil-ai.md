# Rota Fácil AI — Blueprint SaaS

Rota Fácil AI é um SaaS de logística para Android, iOS e Web focado em entregadores autônomos, motoboys, motoristas de entrega, transportadoras, distribuidores, técnicos externos e empresas de logística no Brasil.

## Fluxo principal em menos de 30 segundos

1. Abrir o aplicativo.
2. Inserir, colar ou importar entregas.
3. Acionar **Otimizar Rota**.
4. Receber a melhor sequência de paradas.
5. Iniciar navegação GPS.
6. Registrar comprovantes de entrega.
7. Acompanhar lucro, custos e desempenho.

## Stack alvo para o produto nativo

- Flutter para Android, iOS e Web.
- Material Design 3.
- Firebase Authentication com Google, Apple, e-mail/senha e recuperação de senha.
- Cloud Firestore para rotas, entregas, usuários, equipes, evidências e métricas.
- Cloud Functions para geocodificação, otimização, notificações, OCR e automações de IA.
- Google Maps SDK, Google Directions API e Google Places API.
- Geolocalização em tempo real para entregador, cliente e painel administrativo.
- Riverpod, Clean Architecture e Repository Pattern.
- Gemini/OpenAI para extração de endereços, interpretação de etiquetas, OCR assistido, clusterização, alertas e reotimização.

## Módulos de domínio

### Auth

Responsável por login social, e-mail/senha, recuperação de senha, papéis de acesso, plano de assinatura e permissões por organização.

### Deliveries

Gerencia cadastro de entregas com cliente, endereço, número, complemento, bairro, cidade, CEP, telefone, pedido, observações, prioridade, janela de horário e status.

Status previstos:

- Pendente
- Em rota
- Entregue
- Não localizado
- Reagendado

### Importação inteligente

Aceita Excel, CSV, copiar/colar e foto de lista impressa. A camada de IA/OCR deve extrair nome, endereço, telefone e pedido, normalizando dados antes da persistência.

### Etiquetas e notas fiscais

A captura por câmera identifica destinatário, endereço, CEP e telefone para criar entregas automaticamente.

### Otimização de rota

A otimização deve considerar GPS atual, geocodificação, trânsito, prioridades, horários agendados, restrições de veículo, distância, tempo, consumo e produtividade.

### Navegação e execução

A execução da rota exibe entregas numeradas, linha do trajeto, ETA, distância total e botão **Iniciar Rota**. Ao concluir uma parada, o app avança automaticamente para a próxima.

### IA em tempo real

Monitora trânsito, acidentes, bloqueios, chuva e áreas de risco para sugerir reordenação da rota com economia estimada.

### Comprovantes e cliente ausente

Registra foto, assinatura digital, nome do recebedor, observação, data, hora e GPS. No fluxo de cliente ausente, registra GPS, horário, foto do local e gera relatório automático.

### Rastreamento e WhatsApp

Gera link público para o cliente acompanhar ETA e mapa em tempo real. Integra mensagens automáticas e personalizáveis para saída, aproximação, conclusão e reagendamento.

### Financeiro e rentabilidade

Controla valor recebido, combustível, pedágios, estacionamento, alimentação e manutenção. Calcula lucro diário, semanal e mensal, além de km rodados e gráficos de desempenho.

### Empresas e equipes

O modo transportadora adiciona múltiplos motoristas, distribuição automática das entregas, controle de equipes e monitoramento em tempo real pelo painel web administrativo.

### Técnico externo

Permite adaptar nomenclatura de **Entrega** para **Atendimento** em operações de internet, manutenção, instalações e assistência técnica.

## Estrutura sugerida em Flutter

```text
lib/
  core/
    config/
    errors/
    services/
    theme/
  features/
    auth/
      data/
      domain/
      presentation/
    deliveries/
      data/
      domain/
      presentation/
    route_optimizer/
      data/
      domain/
      presentation/
    proof_of_delivery/
      data/
      domain/
      presentation/
    finance/
      data/
      domain/
      presentation/
    admin_panel/
      data/
      domain/
      presentation/
  shared/
    widgets/
    providers/
```

Cada feature deve expor entidades, casos de uso, repositórios abstratos, implementações Firebase/Google APIs e providers Riverpod.

## Planos

### Gratuito

- Até 20 entregas por rota.
- Histórico de 7 dias.
- Otimização básica.

### Profissional

- Rotas ilimitadas.
- IA avançada.
- OCR.
- Financeiro.

### Empresa

- Multiusuários.
- Gestão de equipes.
- Painel web.
- API.
