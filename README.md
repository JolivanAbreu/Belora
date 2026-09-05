# Belora

Sistema de agendamento para profissionais de estética. Substitui a marcação
manual por WhatsApp: a profissional acompanha a agenda por um painel e as
clientes marcam horário sozinhas por um link público.

## Componentes

| Pasta | O que é |
|---|---|
| [`belora-api`](./belora-api) | API REST em Node.js/Express com PostgreSQL |
| [`belora-admin`](./belora-admin) | Painel administrativo em React |
| [`belora-booking`](./belora-booking) | Página pública de agendamento em React |
| [`belora-deploy`](./belora-deploy) | Docker Compose e guias de publicação |

Cada pasta tem seu próprio README com instruções de instalação.

## Funcionalidades

- Agenda com cálculo automático de disponibilidade, respeitando duração do
  serviço, horário de funcionamento e bloqueios manuais
- Prevenção de conflito de horário sob concorrência, via advisory lock
- Página pública de agendamento por profissional, sem login para a cliente
- Confirmação e lembretes automáticos por WhatsApp (24h, 2h e 30min antes),
  com textos editáveis pela profissional
- Cancelamento e confirmação de presença pela cliente, por link
- Cadastro de clientes com histórico de atendimentos
- Relatórios de faturamento e taxa de não comparecimento
- Autenticação em duas etapas para o painel

## Arquitetura

Multi-tenant com banco compartilhado. Toda tabela de domínio tem
`tenant_id`, e o escopo é resolvido a partir do JWT (painel) ou do slug da
URL (booking page) — nunca de um parâmetro enviado pelo cliente.

A disponibilidade de horários é calculada em um único ponto do backend,
consumido tanto pelo painel quanto pela página pública.

## Testes

```bash
cd belora-api && npm test        # integração, contra PostgreSQL real
cd belora-admin && npm test      # componentes
cd belora-booking && npm test    # componentes
```

Os testes de integração cobrem os pontos mais críticos: isolamento entre
tenants, conflito de horário sob concorrência, autorização por token dos
links de cancelamento e a lógica de fuso horário.

## Publicação

Ver [`belora-deploy`](./belora-deploy) para Docker Compose e os guias de
publicação em serviços gerenciados.
