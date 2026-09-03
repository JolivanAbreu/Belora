# Belora Admin

Painel administrativo do Belora — usado pela profissional para gerenciar agenda,
serviços, clientes e configurações do estabelecimento.

Ver a documentação completa do projeto (SRS, Arquitetura, Modelo de Dados, Segurança/LGPD,
Plano de Testes, Plano de Deploy, Documento Comercial) nos arquivos .docx entregues junto
com este código.

## Stack

React 19, Vite, Tailwind CSS v4, React Router, Axios, date-fns, lucide-react.

## Como rodar localmente

### 1. Pré-requisitos

- Node.js 18+
- A **Belora API** rodando localmente (ver README do backend) — por padrão em `http://localhost:3000`

### 2. Instalação

```bash
npm install
```

### 3. Rodar em desenvolvimento

```bash
npm run dev
```

Abre em `http://localhost:5173`. As chamadas para `/api/*` são redirecionadas
automaticamente para a API em `http://localhost:3000` (ver `vite.config.js`,
seção `server.proxy`) — não precisa configurar CORS manualmente em desenvolvimento.

Login de teste (após rodar `npm run db:seed` no backend):
`nicolly@exemplo.com` / `senha123`

### 4. Build de produção

```bash
npm run build
```

Gera os arquivos estáticos em `dist/`. Configure `VITE_API_URL` (ver `.env.example`)
apontando para a URL real da API em produção, e opcionalmente `VITE_BOOKING_URL`
apontando para onde a booking page pública estiver hospedada (ver Plano de Deploy).

### 5. Rodar os testes automatizados

```bash
npm test
```

Usa Vitest + React Testing Library (`vite.config.js`, seção `test`). Cobre,
entre outras coisas, o fluxo completo de login em duas etapas (2FA) com o
`AuthContext` mockado (`src/pages/Login.test.jsx`), a máscara de telefone
(`src/components/PhoneInput.test.jsx`) e as funções de fuso horário
(`src/lib/format.test.js`). Roda automaticamente no CI antes do build (ver
`.github/workflows/ci.yml`).

## Estrutura de pastas

```
src/
├── components/     # Layout (navbar de abas), modais, PhoneInput, ícones
├── context/        # AuthContext (estado de login + dados do tenant)
├── lib/            # cliente de API (axios + refresh de token), helpers de data
└── pages/          # Login, Dashboard, Agenda, Servicos, Clientes,
                     # Configuracoes, Notificacoes, Relatorios
```

## Telas

- **Visão geral (Dashboard)**: métricas do dia (agendamentos, faturamento
  estimado, taxa de ocupação real do expediente, clientes cadastradas) e
  listas de atendimentos e notificações recentes — tudo com dados reais.
- **Agenda**: régua vertical de horários com filtros por data, status
  (confirmados/bloqueios) e busca por cliente/procedimento. Agendamentos
  passados ainda "confirmados" ganham um seletor para marcar como
  "concluído" ou "não compareceu" (alimenta a tela de Relatórios).
- **Serviços**: catálogo com busca e ordenação (nome, menor/maior preço, duração).
- **Clientes**: tabela com busca; ver/editar observações e histórico em modal.
- **Relatórios**: faturamento mensal e taxa de não comparecimento dos
  últimos 6 meses (gráficos com Recharts), mais um ranking dos serviços
  mais rentáveis — calculado a partir de agendamentos marcados como
  concluídos/não compareceu na Agenda.
- **Notificações**: histórico real de lembretes/confirmações (tabela
  `notifications_log`) — a lógica de confirmação e lembretes (24h/2h/30min,
  com confirmação de presença) está implementada e rodando; o envio
  de fato depende do provedor de WhatsApp configurado no backend
  (`WHATSAPP_PROVIDER`, padrão é um provedor de teste que só loga).
- **Configurações**: nome do estabelecimento, link de agendamento (slug),
  horário de funcionamento por dia da semana, endereço, templates de
  mensagem do WhatsApp e verificação em duas etapas (2FA) — tudo ligado
  de verdade à API.

## Decisões de design

- **Identidade "Rosa Quartzo"**: paleta e tipografia (Outfit + Plus Jakarta
  Sans) definidas a partir do protótipo de referência do usuário
  (github.com/JolivanAbreu/Frontend/tree/main/Belora), aplicadas via CSS
  variables em `index.css` — trocar a paleta inteira é uma questão de editar
  esse arquivo, sem tocar nos componentes.
- **Navegação por abas no topo** (ao invés do sidebar lateral da versão
  anterior), seguindo a arquitetura de informação do protótipo de referência.
- **Agenda como régua vertical de horários** (não um grid de calendário
  genérico): agendamentos e bloqueios são posicionados proporcionalmente ao
  horário real dentro do expediente do dia.
- **Configurações simplifica o horário de funcionamento** para um único par
  abertura/fechamento aplicado de segunda a sábado (domingo fechado). O
  modelo do backend suporta horários diferentes por dia da semana (ver
  Modelo de Dados), mas essa tela ainda não expõe essa granularidade — ver
  pendências abaixo.
- **Token JWT em localStorage** com renovação automática via refresh token em
  caso de 401 (ver `src/lib/api.js`).
- **Máscara de telefone/WhatsApp** (`+55 (DD) 90000-0000`) via `react-imask`,
  no campo de telefone do modal de novo agendamento (`src/components/PhoneInput.jsx`).

## O que falta antes de produção

- [x] ~~Tratamento de fuso horário~~ — corrigido: usa `tenant.timezone` via
      `date-fns-tz` para posicionar e formatar horários.
- [x] ~~Tela de configurações do tenant~~ — implementada e ligada à API real,
      com horário de funcionamento configurável por dia da semana.
- [x] ~~Edição por dia da semana do horário de funcionamento~~ — implementada.
      Segue como pendência apenas múltiplos intervalos no mesmo dia (ex.: pausa
      de almoço embutida no expediente, sem ser um bloqueio manual separado).
- [x] ~~Edição/exclusão de bloqueios existentes pela interface~~ — implementada
      (botão "Editar" abre o mesmo modal de criação, pré-preenchido).
- [ ] Cobrança/plano de assinatura na interface (removido do painel nesta
      versão até o backend implementar RF-60/RF-61 do SRS — melhor não
      mostrar tela do que mostrar uma tela de cobrança que não funciona).
- [ ] Estado de "carregando"/otimista mais refinado ao criar/cancelar agendamentos.
- [x] ~~Testes de componente (React Testing Library)~~ — implementados via
      Vitest, cobrindo o fluxo de login em duas etapas, a máscara de telefone
      e os helpers de fuso horário. Rodando no CI antes do build.
