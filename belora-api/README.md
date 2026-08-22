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

```bash
# cria as tabelas (ambiente de desenvolvimento - ver nota em scripts/sync.js)
npm run db:sync

# popula com um tenant de demonstração (login: nicolly@exemplo.com / senha123)
npm run db:seed
```

### 4. Rodar o servidor

```bash
npm start        # produção
npm run dev      # desenvolvimento, com reload automático (nodemon)
```

A API sobe em `http://localhost:3000`. Teste com:

```bash
curl http://localhost:3000/health
```

### 5. Rodar os testes automatizados

Os testes usam um banco de dados **separado** (não usam o de desenvolvimento):

```bash
# crie um banco de testes uma única vez:
createdb belora_test   # ou: psql -c "CREATE DATABASE belora_test OWNER belora;"

npm test
```

A suíte de testes cobre, entre outras coisas, os cenários mais críticos do sistema:
isolamento entre tenants (`tests/integration/tenantIsolation.test.js`) e prevenção de
conflito de horário na agenda, inclusive sob concorrência
(`tests/integration/appointmentConflicts.test.js`). Ver Plano de Testes para o racional
completo de cada caso.

## Estrutura de pastas

Ver Documento de Arquitetura, seção 4, para a explicação de cada pasta.

## O que falta antes de produção

Este é um esqueleto funcional e testado, mas antes de um lançamento real é preciso:

- [ ] Migrations formais via Sequelize CLI (hoje o `db:sync` usa `sequelize.sync()`, adequado
      apenas para desenvolvimento - ver nota no próprio `scripts/sync.js` e o Plano de Deploy).
- [ ] Integração real com provedor de WhatsApp (lembretes automáticos - RF-50/RF-52 do SRS).
- [ ] Integração com gateway de pagamento (assinatura SaaS - RF-60/RF-61 do SRS).
- [x] ~~Definir e aplicar fuso horário por tenant no cálculo de disponibilidade~~ —
      corrigido: cada tenant tem um campo `timezone` (padrão `America/Fortaleza`),
      e toda conversão hora local ↔ instante UTC passa por `date-fns-tz`
      (ver `availability.service.js` e `appointments.service.js`).
- [ ] 2FA via TOTP para admins (mencionado no Documento de Segurança & LGPD).
- [ ] Configurar CI (GitHub Actions) rodando `npm test` a cada pull request - ver Plano de Deploy.
