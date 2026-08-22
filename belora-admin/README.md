# Belora Admin

Painel administrativo do Belora — usado pela profissional para gerenciar agenda,
serviços e clientes.

Ver a documentação completa do projeto (SRS, Arquitetura, Modelo de Dados, Segurança/LGPD,
Plano de Testes, Plano de Deploy, Documento Comercial) nos arquivos .docx entregues junto
com este código.

## Stack

React 19, Vite, Tailwind CSS v4, React Router, Axios, date-fns.

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

Gera os arquivos estáticos em `dist/`. Em produção, ajuste a variável de ambiente
ou configuração de proxy/reverse-proxy para apontar `/api` para a URL real da API
(ver Plano de Deploy, seção 4 — frontends são publicados como build estático).

## Estrutura de pastas

```
src/
├── components/     # Layout, modais, ícones, cards reutilizáveis
├── context/        # AuthContext (estado de login)
├── lib/            # cliente de API (axios + refresh de token), helpers de data
└── pages/          # Login, Agenda, Servicos, Clientes
```

## Decisões de design

- **Cores e tipografia**: paleta ameixa/argila-rosa consistente com a identidade
  usada nos documentos do projeto. Tipografia serifada (Fraunces) para títulos,
  Inter para texto/dados.
- **Agenda como régua vertical de horários** (ao invés de um grid de calendário
  genérico): agendamentos e bloqueios são posicionados proporcionalmente ao
  horário real dentro do expediente do dia, o que reflete melhor o uso real
  (uma profissional, uma agenda, sem múltiplos recursos em paralelo).
- **Token JWT em localStorage** com renovação automática via refresh token em
  caso de 401 (ver `src/lib/api.js`) — igual à estratégia descrita no Documento
  de Arquitetura.

## O que falta antes de produção

- [x] ~~Tratamento de fuso horário~~ — corrigido: a agenda usa `tenant.timezone`
      (via `date-fns-tz`) para posicionar cards e formatar horários, tanto na
      busca (`/appointments`, `/availability-blocks`) quanto na exibição.
- [ ] Tela de configurações do tenant (editar horário de funcionamento, nome,
      identidade visual) — hoje só existe a rota de API (`/tenant/me`), sem tela.
- [ ] Edição/exclusão de bloqueios existentes pela interface (hoje só é possível
      criar; a API já suporta listar e excluir).
- [ ] Estado de "carregando"/otimista mais refinado ao criar/cancelar agendamentos.
- [ ] Testes de componente (ex.: React Testing Library) — hoje a cobertura de
      testes do projeto está toda no backend (ver Plano de Testes).
