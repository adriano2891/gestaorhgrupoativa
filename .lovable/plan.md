

# Auditoria Completa e Refatoração de Interface

## Escopo do Projeto

O projeto possui **35 páginas**, **80+ componentes** e já conta com boa parte da infraestrutura responsiva (breakpoints, tipografia fluida, utilitários). A refatoração será feita em **fases incrementais** para evitar regressões.

---

## Fase 1 — Fundação (Design System e CSS Global)

**Arquivos:** `tailwind.config.ts`, `src/index.css`, `src/App.css`

- Adicionar breakpoint `320px` (`2xs: "320px"`) e `375px` (`xxs: "375px"`) ao Tailwind
- Remover `src/App.css` (estilos não utilizados do template Vite)
- Padronizar variáveis de espaçamento consistentes (spacing scale)
- Adicionar utilitários de foco visível para navegação por teclado (`focus-visible:ring-2 focus-visible:ring-ring`)
- Garantir contraste mínimo WCAG AA nas variáveis de cor (ajustar `--muted-foreground` se necessário)

---

## Fase 2 — Layout Global e Navegação

**Arquivos:** `Layout.tsx`, `RHModuleBar.tsx`, `GlobalFooter.tsx`

- **Header**: Melhorar touch targets (min 44px), agrupar ações com aria-labels
- **Nav desktop**: Adicionar `role="navigation"` e `aria-label`
- **Menu mobile (Sheet)**: Garantir foco trap e `aria-current="page"` no item ativo
- **RHModuleBar**: Adicionar indicadores visuais de scroll (fade nas bordas), melhorar contraste do item ativo
- **Footer**: Garantir responsividade e safe-area padding

---

## Fase 3 — Páginas Principais (Mobile-First)

Refatorar cada grupo de páginas:

### 3a. Login e Dashboard
- **Login**: Já responsivo, adicionar `aria-label` nos inputs e `autocomplete` attributes
- **Dashboard**: Revisar grid de módulos para 320px (1 coluna), melhorar hover/focus states nos cards

### 3b. Funcionários (2227 linhas)
- Extrair formulário de edição para componente separado (reduzir tamanho do arquivo)
- Tabela: garantir scroll horizontal com indicador visual
- Diálogos: padronizar larguras conforme design system (`max-w-[95vw] sm:max-w-[600px] md:max-w-[700px]`)
- Cards de métricas: grid responsivo 1→2→4 colunas

### 3c. Demais módulos RH
- Aplicar mesmo padrão de tabelas responsivas, cards e diálogos
- Páginas: `Holerites`, `FolhaPonto`, `Comunicados`, `FormulariosRH`, `CursosAdmin`, `Relatorios`, `ControleFerias`, `SuporteFuncionarios`, `BancoTalentos`, `Documentacoes`

### 3d. Módulos de Gestão
- `GestaoClientes`, `Fornecedores`, `OrcamentosBuilder/Lista/Dashboard`, `InventarioEquipamentos`

### 3e. Portal do Funcionário
- Revisar componentes em `src/components/ponto/` para consistência visual

---

## Fase 4 — Componentes UI Base

**Arquivos em `src/components/ui/`**

- **Buttons**: Garantir `min-h-[44px]` em mobile, focus-visible ring
- **Cards**: Padding responsivo (`p-4 sm:p-6`)
- **Tables**: Wrapper com scroll horizontal padrão
- **Dialogs/Modals**: `max-h-[85vh]` com scroll interno, largura responsiva
- **Inputs/Labels**: Adicionar `htmlFor` consistente, aria-describedby para erros
- **Select/Tabs**: Touch-friendly sizing

---

## Fase 5 — Performance

- Verificar que todas as páginas usam lazy loading (já implementado na maioria)
- Adicionar `loading="lazy"` em imagens de ícones que não são above-the-fold
- Revisar hooks com dependências desnecessárias causando re-renders
- Memoizar listas filtradas com `useMemo` onde ausente

---

## Fase 6 — Acessibilidade

- Headings semânticos: garantir hierarquia h1→h2→h3 em cada página
- Labels em todos os formulários (associados via `htmlFor`)
- `aria-label` em botões icon-only (ex: tema, logout, menu)
- Skip-to-content link no layout global
- `role="alert"` em mensagens de erro

---

## Ordem de Execução Recomendada

Dado o tamanho do projeto, recomendo implementar **uma fase por vez**:

1. **Fase 1** — Fundação CSS (~1 mensagem)
2. **Fase 2** — Layout/Nav (~1 mensagem)
3. **Fase 3a-3b** — Login + Dashboard + Funcionários (~2 mensagens)
4. **Fase 3c** — Módulos RH (~3-4 mensagens, 2 páginas por vez)
5. **Fase 3d-3e** — Gestão + Portal (~2-3 mensagens)
6. **Fase 4** — Componentes UI (~1 mensagem)
7. **Fase 5-6** — Performance + Acessibilidade (~1-2 mensagens)

**Total estimado: 10-14 mensagens** para cobrir todo o projeto sem risco de regressão.

