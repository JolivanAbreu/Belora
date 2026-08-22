# Belora Booking

Página pública de agendamento do Belora — é o que a cliente final acessa (ex.: pelo
link na bio do Instagram da profissional) para marcar um horário sozinha, sem
precisar trocar mensagens pelo WhatsApp.

Ver a documentação completa do projeto (SRS, Arquitetura, Modelo de Dados, Segurança/LGPD,
Plano de Testes, Plano de Deploy, Documento Comercial) nos arquivos .docx entregues junto
com este código.

## Stack

React 19, Vite, Tailwind CSS v4, React Router, Axios, date-fns.

## Como rodar localmente

### 1. Pré-requisitos

- Node.js 18+
- A **Belora API** rodando localmente (ver README do backend), com pelo menos um
  tenant de demonstração (`npm run db:seed` no backend cria o tenant `nicolly`)

### 2. Instalação

```bash
npm install
```

### 3. Rodar em desenvolvimento

```bash
npm run dev
```

Abre em `http://localhost:5174` (ajustável). Acesse `http://localhost:5174/nicolly`
para ver a página do tenant de demonstração — o slug na URL é o que identifica
qual profissional está sendo agendada (ver Arquitetura, seção "Estratégia
Multi-tenant").

### 4. Build de produção

```bash
npm run build
```

Em produção, cada profissional recebe uma URL própria (ex.: `belora.app/nicolly`),
todas servidas pelo mesmo build estático — o roteamento por slug acontece no
próprio React Router, sem precisar de um deploy separado por tenant.

## Fluxo implementado

1. **Escolher serviço** — lista os serviços ativos do tenant (RF-30)
2. **Escolher dia e horário** — mostra apenas horários realmente disponíveis,
   calculados pelo mesmo endpoint usado no painel administrativo (RF-31,
   ver Arquitetura seção 5 sobre fonte única de disponibilidade)
3. **Informar nome e telefone** — sem exigir criação de conta (RF-32)
4. **Confirmação** — tela de sucesso; o lembrete por WhatsApp (RF-33) depende da
   integração com o provedor, ainda pendente (ver checklist abaixo)

Testado manualmente de ponta a ponta contra a API real, incluindo o caso de
conflito (dois horários que se sobrepõem somem da lista após um agendamento) e
o caso de slug inexistente (tela de "página não encontrada").

## Estrutura de pastas

```
src/
├── components/   # ProgressSteps, ServiceList, DateStrip, TimeSlotGrid
├── lib/          # cliente de API público (por slug), helpers de data
└── pages/        # Booking (fluxo principal), NotFound
```

## O que falta antes de produção

- [ ] Cancelamento do agendamento pelo cliente via link enviado na confirmação (RF-34)
      — hoje a tela de confirmação não gera esse link ainda.
- [ ] Envio real de confirmação/lembrete por WhatsApp (depende da integração do
      backend com o provedor — ver README da API).
- [x] ~~Fuso horário por tenant~~ — corrigido: a página busca o fuso do tenant
      via `GET /public/:slug/info` e formata todos os horários com ele
      (`date-fns-tz`), em vez de depender do fuso do navegador de quem acessa.
- [ ] Identidade visual personalizada por tenant (logo, cores) — hoje toda
      booking page usa a identidade genérica do Belora, sem personalização
      por profissional (mencionado no Documento Comercial como item do roadmap).
- [ ] Testes automatizados de interface (hoje a cobertura de testes do projeto
      está toda no backend).
