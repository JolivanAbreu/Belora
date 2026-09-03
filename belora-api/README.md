# Belora API

Backend do Belora — plataforma SaaS de agendamento para profissionais de estética.

Ver a documentação completa do projeto (SRS, Arquitetura, Modelo de Dados, Segurança/LGPD,
Plano de Testes, Plano de Deploy, Documento Comercial) nos arquivos .docx entregues junto com este código.

## Stack

Node.js, Express, Sequelize, PostgreSQL. Ver Documento de Arquitetura para detalhes e decisões.

## Como rodar localmente

### 1. Pré-requisitos

- Node.js 18+
- PostgreSQL rodando localmente (ou via Docker)

### 2. Configuração

```bash
npm install
cp .env.example .env
# edite o .env com a sua DATABASE_URL, se necessário
```

### 3. Banco de dados

Duas formas de criar o schema — **use migrations**, o `db:sync` fica só
como atalho de desenvolvimento bem no começo:

```bash
# Recomendado (produção e desenvolvimento): migrations versionadas
npm run db:migrate

# Atalho antigo, apenas para desenvolvimento local rápido (ver nota em scripts/sync.js)
npm run db:sync

# popula com um tenant de demonstração (login: nicolly@exemplo.com / senha123)
npm run db:seed
```

Para desfazer a última migration (ex.: durante desenvolvimento de uma nova):

```bash
npm run db:migrate:undo        # desfaz só a última
npm run db:migrate:undo:all    # desfaz todas (cuidado: apaga os dados)
```

**Criando uma nova migration:** ao adicionar/alterar um campo num model em
`src/models/`, crie a migration correspondente à mão em `migrations/`
(seguindo o padrão dos arquivos existentes) — este projeto não usa
`sequelize-cli model:generate`, os models já existem e são a fonte da
verdade; a migration só precisa refletir a mudança no schema.

### 4. Rodar o servidor

```bash
npm start        # produção
npm run dev      # desenvolvimento, com reload automático (nodemon)
```

A API sobe em `http://localhost:3000`. Teste com:

```bash
curl http://localhost:3000/health
```

### 5. Lembretes automáticos via WhatsApp

Ao subir com `npm start`/`npm run dev`, o servidor já agenda automaticamente
(via `node-cron`) uma varredura a cada 15 minutos que:

- Envia uma **confirmação** assim que um agendamento é criado (admin ou booking page)
- Envia um **lembrete 24h antes** do horário
- Envia um **lembrete 2h antes** do horário
- Envia um **lembrete 30min antes**, com link para o cliente **confirmar presença**

O texto de cada uma dessas mensagens é **customizável pelo admin**, na tela
Configurações do painel (campo `messageTemplates` do tenant, com placeholders
como `{cliente}`, `{servico}`, `{hora}`, `{endereco}`, `{link_cancelamento}`,
`{link_confirmacao}`). Tenants que não personalizarem usam os textos padrão
definidos em `src/modules/notifications/notifications.service.js`.

Por padrão (`WHATSAPP_PROVIDER=console` no `.env.example`), nada é enviado de
verdade — a mensagem é apenas registrada no log do servidor e em
`notifications_log`. Isso permite testar todo o fluxo (inclusive vendo o
histórico na tela **Notificações** do painel) sem precisar de conta de
WhatsApp.

Para enviar de fato, configure uma instância da
[Evolution API](https://doc.evolution-api.com) e ajuste o `.env`:

```bash
WHATSAPP_PROVIDER=evolution
EVOLUTION_API_URL=https://sua-evolution.exemplo.com
EVOLUTION_API_INSTANCE=nome-da-sua-instancia
EVOLUTION_API_KEY=apikey-da-instancia
PUBLIC_BOOKING_URL=https://sua-booking-page.exemplo.com
```

**Importante:** a implementação do provedor Evolution
(`src/integrations/whatsapp/evolutionApiProvider.js`) segue o contrato
oficial documentado do endpoint `POST /message/sendText/{instance}`, mas
nunca foi testada contra uma instância real (não há uma disponível no
ambiente de desenvolvimento usado para construir este projeto). Teste
manualmente com um número de telefone seu antes de confiar nela em produção.

### 6. Cancelamento e confirmação de presença pelo cliente (sem login)

Cada agendamento recebe um `cancellationToken` opaco na criação. Os links
enviados por WhatsApp (`/:slug/cancelar/:id?token=...` e
`/:slug/confirmar/:id?token=...`, ambos na booking page) usam esse token para
autorizar a ação sem exigir conta de cliente. Ver `appointments.service.js`
(`cancelAppointmentByToken`, `confirmPresenceByToken`).

### 7. Autenticação em duas etapas (2FA) para o admin

Cada admin pode ativar 2FA na tela **Configurações** do painel (ou direto
pela API):

1. `POST /auth/2fa/setup` (autenticado) — gera um segredo TOTP e retorna um
   QR code para escanear com Google Authenticator, Authy, etc.
2. `POST /auth/2fa/enable` com `{ token }` (o código de 6 dígitos do app) —
   confirma e ativa o 2FA, retornando 8 códigos de backup de uso único
   (mostrados uma única vez — o admin precisa salvá-los).
3. A partir daí, `POST /auth/login` retorna `{ twoFactorRequired: true, twoFactorSessionToken }`
   em vez dos tokens de acesso. O segundo passo é
   `POST /auth/2fa/verify-login` com `{ twoFactorSessionToken, code }`
   (aceita tanto o código do app quanto um código de backup).
4. `POST /auth/2fa/disable` com `{ password }` desativa, exigindo a senha
   atual como confirmação.

### 8. Segurança: CORS e rate limiting

Em produção, defina `ALLOWED_ORIGINS` no `.env` com as URLs reais do painel
admin e da booking page, separadas por vírgula:

```bash
ALLOWED_ORIGINS=https://belora-admin.pages.dev,https://belora-booking.pages.dev
```

Sem essa variável (padrão em desenvolvimento), o CORS libera qualquer
origem. Os endpoints públicos (`/public/*`, usados pela booking page) também
têm um limite de 60 requisições por minuto por IP, para dificultar
scraping/abuso sem exigir autenticação (ver `src/middlewares/publicRateLimiter.js`).

### 9. Relatórios e status de agendamento

Um agendamento passado pode ser marcado como **concluído** ou **não
compareceu** via `PATCH /appointments/:id/status` (usado pelo painel na
tela de Agenda, num seletor que só aparece para horários já passados).
Isso alimenta os relatórios:

- `GET /reports/summary?months=6` — faturamento e taxa de não
  comparecimento por mês, considerando só agendamentos concluídos e faltas
  (cancelamentos com antecedência não contam como falta).
- `GET /reports/top-services?months=6` — ranking de serviços por
  faturamento no período.

### 10. Rodar os testes automatizados

Os testes usam um banco de dados **separado** (não usam o de desenvolvimento):

```bash
# crie um banco de testes uma única vez:
createdb belora_test   # ou: psql -c "CREATE DATABASE belora_test OWNER belora;"

npm test
```

A suíte de testes cobre, entre outras coisas, os cenários mais críticos do sistema:
isolamento entre tenants (`tests/integration/tenantIsolation.test.js`), prevenção de
conflito de horário na agenda sob concorrência (`tests/integration/appointmentConflicts.test.js`),
cancelamento/confirmação de presença via link (`tests/integration/cancellation.test.js`,
`tests/integration/presenceAndTemplates.test.js`), o job de lembretes
(`tests/integration/notifications.test.js`) e o fluxo de 2FA
(`tests/integration/twoFactor.test.js`, incluindo login em duas etapas e
consumo de códigos de backup) e os relatórios de faturamento/não comparecimento
(`tests/integration/reports.test.js`). Ver Plano de Testes para o racional
completo de cada caso.

## Estrutura de pastas

Ver Documento de Arquitetura, seção 4, para a explicação de cada pasta.

## O que falta antes de produção

Este é um esqueleto funcional e testado, mas antes de um lançamento real é preciso:

- [x] ~~Migrations formais via Sequelize CLI~~ — implementadas em `migrations/`
      (uma por tabela, refletindo o schema completo atual). Testadas com um
      ciclo completo `migrate → undo:all → migrate` contra um banco vazio, e
      validadas com um smoke test HTTP real (login, agendamento, conflito de
      horário) sem nunca chamar `sequelize.sync()`. `db:sync` continua
      disponível só como atalho de desenvolvimento local.
- [x] ~~Integração real com provedor de WhatsApp~~ — implementada (confirmação +
      lembretes de 24h/2h/30min, com confirmação de presença e templates
      customizáveis). Falta apenas testar contra uma instância real da
      Evolution API e considerar migrar de node-cron para uma fila dedicada
      (BullMQ/Redis) se o volume de tenants crescer.
- [ ] Integração com gateway de pagamento (assinatura SaaS - RF-60/RF-61 do SRS).
- [x] ~~Definir e aplicar fuso horário por tenant no cálculo de disponibilidade~~ —
      corrigido: cada tenant tem um campo `timezone` (padrão `America/Fortaleza`),
      e toda conversão hora local ↔ instante UTC passa por `date-fns-tz`
      (ver `availability.service.js` e `appointments.service.js`).
- [x] ~~2FA via TOTP para admins~~ — implementado: login em duas etapas
      (senha, depois código do app autenticador ou código de backup).
      Setup gera QR code (`POST /auth/2fa/setup`), confirmação em
      `POST /auth/2fa/enable`, e desativação exige senha atual em
      `POST /auth/2fa/disable`. Validado de ponta a ponta gerando códigos
      TOTP reais a partir do segredo exibido na tela (não é só um mock).
- [x] ~~Configurar CI (GitHub Actions) rodando testes a cada PR~~ — implementado
      em `.github/workflows/ci.yml` (backend: migrations + suíte completa
      contra Postgres real; `belora-admin` e `belora-booking` têm workflows
      próprios rodando o build). Validado localmente simulando os mesmos
      passos do workflow (migrate + test) antes de confiar nele.
- [x] ~~CORS aberto para qualquer origem~~ — restrito via `ALLOWED_ORIGINS`
      em produção (ver seção 7 acima).
- [x] ~~Sem limite de requisições nos endpoints públicos~~ — rate limiting
      implementado (60 req/min por IP em `/public/*`), já previsto desde a
      v1.0 da Referência de API mas nunca implementado até agora.
- [x] ~~Lembrete perdido não é reenviado se o servidor cair na janela exata~~ —
      corrigido: a varredura agora usa uma condição de "antecedência já
      atingida" em vez de uma janela fixa de minutos, se auto-recuperando
      de indisponibilidade (ver `src/jobs/reminders.job.js` e o teste
      "catch-up" em `tests/integration/notifications.test.js`).
