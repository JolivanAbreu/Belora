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
3. **Informar nome e telefone** — sem exigir criação de conta (RF-32), com
   máscara de telefone brasileira (`+55 (DD) 90000-0000`) via `react-imask`
4. **Confirmação** — tela de sucesso, com link de cancelamento também
   disponível diretamente na tela (RF-34)

Duas telas adicionais, acessadas pelos links enviados nas mensagens de
WhatsApp (não pela navegação normal do fluxo acima):

- **`/:slug/cancelar/:appointmentId?token=...`** — cliente cancela o próprio
  agendamento (RF-34). Só age mediante clique explícito num botão, nunca ao
  simplesmente abrir a página - importante porque o WhatsApp gera uma
  pré-visualização do link automaticamente (requisição GET), e isso não
  pode disparar o cancelamento sozinho.
- **`/:slug/confirmar/:appointmentId?token=...`** — cliente confirma
  presença a partir do lembrete de 30min antes (RF-35), mesma lógica de
  segurança da tela de cancelamento.

Testado manualmente de ponta a ponta contra a API real, incluindo o caso de
conflito (dois horários que se sobrepõem somem da lista após um agendamento),
o cancelamento/confirmação de presença via link, e o caso de slug inexistente
(tela de "página não encontrada").

## Estrutura de pastas

```
src/
├── components/   # ProgressSteps, ServiceList, DateStrip, TimeSlotGrid, PhoneInput
├── lib/          # cliente de API público (por slug), helpers de data
└── pages/        # Booking (fluxo principal), CancelAppointment, ConfirmPresence, NotFound
```

## O que falta antes de produção

- [x] ~~Cancelamento do agendamento pelo cliente via link enviado na confirmação (RF-34)~~
      — implementado: link de cancelamento seguro (token opaco) enviado na
      confirmação por WhatsApp, e também exibido na própria tela de confirmação.
- [x] ~~Confirmação de presença pelo cliente (RF-35)~~ — implementado, via
      link enviado no lembrete de 30min antes.
- [ ] Envio real de confirmação/lembrete por WhatsApp (a lógica já está pronta -
      ver README da API; falta configurar uma instância real da Evolution API).
- [x] ~~Fuso horário por tenant~~ — corrigido: a página busca o fuso do tenant
      via `GET /public/:slug/info` e formata todos os horários com ele
      (`date-fns-tz`), em vez de depender do fuso do navegador de quem acessa.
- [ ] Identidade visual personalizada por tenant (logo, cores) — hoje toda
      booking page usa a identidade genérica do Belora, sem personalização
      por profissional (mencionado no Documento Comercial como item do roadmap).
- [x] ~~Testes automatizados de interface~~ — implementados via Vitest +
      React Testing Library (helpers de data, máscara de telefone,
      indicador de progresso). Rodando no CI antes do build.

## Rodar os testes automatizados

```bash
npm test
```
