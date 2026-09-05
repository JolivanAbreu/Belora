# Belora — Guia de Deploy

Este guia cobre duas formas de colocar o Belora no ar. Recomendo a **Opção A**
para começar — é a combinação de menor custo previsível, permite uso
comercial sem restrição, e dá pra ter tudo rodando em uns 20 minutos.

## Por que Render + Cloudflare Pages (e não Railway + Vercel)

- **Custo previsível**: Render cobra por instância fixa (não por consumo
  variável como a Railway), então o valor mensal não surpreende.
- **Uso comercial liberado de graça**: o plano gratuito da Cloudflare Pages
  permite uso comercial. Já o plano gratuito da Vercel (Hobby) **proíbe uso
  comercial** nos termos de serviço — se o sistema gera receita, seria
  necessário ir para o Vercel Pro (US$20/mês, ≈ R$103/mês) só para hospedar
  dois sites estáticos.
- **Estimativa de custo** (câmbio de referência ≈ R$5,15/USD, agosto/2026 —
  confira a cotação atual antes de orçar):

| Item | Custo |
|---|---|
| Render — API (Starter) | US$7/mês ≈ R$36/mês |
| Render — PostgreSQL (Basic) | US$6-7/mês ≈ R$31-36/mês |
| Cloudflare Pages (painel admin + booking page) | R$0 |
| **Total** | **≈ R$67-72/mês** |
| Domínio `.com.br` (Registro.br, por ano) | ≈ R$40/ano |
| Domínio `.com` (Porkbun, por ano) | ≈ US$10/ano ≈ R$51/ano |

Para comparação, Railway + Vercel Pro fica na faixa de US$35-50/mês
(≈ R$180-260/mês) para o mesmo workload, com a Railway tendo cobrança
variável por uso — menos previsível.

---

## Opção A (recomendada): Render + Cloudflare Pages

- **Render**: hospeda a API (Node) + o banco PostgreSQL.
- **Cloudflare Pages**: hospeda o painel admin e a booking page (dois
  projetos estáticos separados). Plano gratuito, permite uso comercial,
  CDN global.

### Passo 1 — Suba o código para o GitHub

Crie um repositório (pode ser um só, com as três pastas dentro) e suba
`belora-api/`, `belora-admin/` e `belora-booking/`. Isso é necessário porque
tanto Render quanto Cloudflare Pages fazem deploy a partir de um repositório Git.

```bash
cd belora           # pasta que contém as três subpastas
git init
git add .
git commit -m "Belora - versão inicial"
git branch -M main
git remote add origin <URL_DO_SEU_REPOSITORIO>
git push -u origin main
```

### Passo 2 — Backend na Render

1. Crie uma conta em render.com e conecte seu GitHub.
2. **New → PostgreSQL**: crie um banco no plano **Starter** (não o Free — o
   Postgres gratuito da Render expira 30 dias após a criação, apagando os
   dados). Anote a "Internal Database URL" gerada.
3. **New → Web Service**: aponte para o repositório, com:
   - **Root Directory**: `belora-api`
   - **Instance Type**: **Starter** (US$7/mês) — o plano Free hiberna após
     inatividade, o que atrasaria o primeiro agendamento do dia em ~1 minuto
     toda vez que a API "acordar". Aceitável só para teste inicial.
   - **Runtime**: Docker (a Render detecta o `Dockerfile` automaticamente)
   - **Variáveis de ambiente** (aba Environment): copie do `.env.example` e preencha:
     - `DATABASE_URL` = a Internal Database URL do passo anterior
     - `JWT_SECRET` e `JWT_REFRESH_SECRET` = valores fortes e aleatórios
       (gere com `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
     - `JWT_EXPIRES_IN=1h`, `JWT_REFRESH_EXPIRES_IN=30d`
     - `PUBLIC_BOOKING_URL` = a URL da booking page (preencha depois do Passo 3)
4. Depois do primeiro deploy, abra o **Shell** da Render (aba Shell do serviço)
   e rode, uma única vez:
   ```bash
   npm run db:migrate
   npm run db:seed   # opcional - cria o tenant de demonstração "nicolly"
   ```
5. Anote a URL pública gerada pela Render (ex.: `https://belora-api.onrender.com`)
   — você vai precisar dela no próximo passo.

### Passo 3 — Painel admin e booking page na Cloudflare Pages

Repita para cada um dos dois projetos (`belora-admin` e `belora-booking`):

1. No painel da Cloudflare, vá em **Workers & Pages → Create → Pages → Connect to Git**.
2. Selecione o repositório e configure:
   - **Root directory**: `belora-admin` (depois repita com `belora-booking`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. Em **Environment variables**, adicione:
   - `VITE_API_URL` = a URL da API que você anotou no passo anterior
     (ex.: `https://belora-api.onrender.com`)
   - No projeto `belora-admin`, adicione também `VITE_BOOKING_URL` apontando
     para a URL que a Cloudflare vai gerar para o `belora-booking` (você pode
     voltar aqui e ajustar depois de criar os dois projetos)
4. Deploy.

Ao final você terá três URLs públicas, por exemplo:
- API: `https://belora-api.onrender.com`
- Painel admin: `https://belora-admin.pages.dev`
- Booking page: `https://belora-booking.pages.dev/nicolly`

Volte na Render e preencha `PUBLIC_BOOKING_URL` com a URL real da booking
page (usada nos links de cancelamento/confirmação enviados por WhatsApp).

A profissional usa a URL do painel admin para entrar, e divulga a URL da
booking page (com o slug ao final) para as clientes.

### Domínio próprio (opcional)

Tanto Render quanto Cloudflare Pages permitem apontar um domínio próprio
(ex.: `agenda.belora.com.br` para o painel, `belora.com.br` para a booking
page). Se o domínio já estiver na Cloudflare (comum, já que é onde você
registrou ou apontou o DNS), o processo é ainda mais simples: **Pages →
seu projeto → Custom domains → Set up a custom domain**.

---

## Opção B: self-host via Docker Compose (VPS própria)

Use esta opção se preferir rodar tudo numa VPS que você já tem/vai contratar
(ex.: DigitalOcean, Hetzner, Contabo), com controle total. Custo aproximado:
uma VPS pequena (1 vCPU/1GB) fica em torno de US$5-6/mês (≈ R$26-31/mês),
mais barato que a Opção A, mas exige que você mesmo administre o servidor.

### Pré-requisitos

- Uma VPS com Docker e Docker Compose instalados
- As três pastas do projeto (`belora-api`, `belora-admin`, `belora-booking`)
  e esta pasta (`belora-deploy`) como **irmãs**, na mesma pasta pai:

```
belora/
├── belora-api/
├── belora-admin/
├── belora-booking/
└── belora-deploy/       <- você roda os comandos a partir daqui
```

### Passos

```bash
cd belora-deploy
cp .env.example .env
# edite o .env: gere JWT_SECRET e JWT_REFRESH_SECRET, e defina PUBLIC_API_URL
# (o IP ou domínio pelo qual a API vai ser acessada publicamente, incluindo a porta 3000)

docker compose up -d --build

# na primeira vez, crie o schema e o tenant de demonstração:
docker compose exec api npm run db:migrate
docker compose exec api npm run db:seed
```

Isso deixa:
- API em `http://SEU_IP:3000`
- Painel admin em `http://SEU_IP:8080`
- Booking page em `http://SEU_IP:8081/nicolly`

Para produção de verdade nesta opção, o recomendado é colocar um proxy
reverso (ex.: Caddy ou Nginx) na frente dos três serviços para servir tudo
via HTTPS com domínio próprio — isso não está incluído neste guia porque
foge do escopo do MVP, mas é um passo padrão de qualquer deploy em VPS.

---

## Depois de qualquer uma das duas opções

- [ ] Compartilhe a URL do painel admin e as credenciais de acesso com a
      profissional, trocando a senha padrão do seed.
- [ ] Ajuste nome, horários, endereço e fuso horário do tenant na tela
      Configurações do painel.
- [ ] Configure `CORS` no backend para aceitar apenas os domínios reais do
      painel/booking page em produção, ao invés do `cors()` aberto usado no
      MVP (ver `src/app.js`) — pequeno endurecimento de segurança recomendado
      antes de divulgar a booking page publicamente.
- [ ] Registre o domínio (Registro.br para `.com.br`, ou Porkbun/Cloudflare
      Registrar para `.com`) e aponte para o painel e a booking page.
