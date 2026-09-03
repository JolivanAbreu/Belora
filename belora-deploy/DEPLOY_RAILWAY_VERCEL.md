# Belora — Guia de Compra e Deploy com Railway + Vercel

Este guia parte do zero: comprar o domínio, criar as contas, cadastrar
pagamento, e colocar os três projetos (API, painel admin, booking page) no
ar. São ~5 etapas, uns 30-40 minutos no total.

**Custo esperado**: ver a tabela completa na seção final, mas resumindo:
Railway (backend + Postgres) fica entre US$10-25/mês conforme o uso, Vercel
Pro (obrigatório pra uso comercial - o Hobby proíbe) é US$20/mês fixo, e o
domínio fica entre R$40-60/ano. Total aproximado: **R$ 180-260/mês** + o
domínio anual.

---

## Antes de começar: suba o código para o GitHub

Tanto Railway quanto Vercel fazem deploy a partir de um repositório Git —
sem isso, nenhuma das duas etapas seguintes funciona.

```bash
cd belora           # pasta que contém belora-api, belora-admin, belora-booking
git init
git add .
git commit -m "Belora - versão inicial"
git branch -M main
```

Crie um repositório vazio no GitHub (github.com → **New repository**, pode
ser privado) e conecte:

```bash
git remote add origin https://github.com/SEU_USUARIO/belora.git
git push -u origin main
```

---

## Etapa 1 — Comprar o domínio

Duas opções, ambas confiáveis e sem "pegadinha" de preço promocional que
dispara na renovação:

### Opção A: domínio `.com.br` via Registro.br (recomendado se o público é só no Brasil)

1. Acesse **registro.br**, crie uma conta (exige CPF).
2. Busque o nome desejado (ex.: `belora.com.br` ou `agendabelora.com.br`).
3. Adicione ao carrinho, escolha o período (1-10 anos), pague com cartão,
   boleto ou Pix. Custo: em torno de **R$ 40/ano**.
4. Após a confirmação (pode levar algumas horas), o domínio aparece no
   **Painel do Registro.br**, aba "Meus Domínios".

### Opção B: domínio `.com` via Porkbun (se quiser algo mais "internacional")

1. Acesse **porkbun.com**, crie uma conta.
2. Busque o nome (ex.: `belora.com` — provavelmente já registrado; tente
   variações como `belorapp.com`, `usebelora.com`).
3. Adicione ao carrinho e finalize o pagamento (cartão internacional ou
   PayPal). Custo: em torno de **US$ 10/ano** (≈ R$ 51).

**Guarde o login** de onde quer que registre — vai precisar voltar lá na
Etapa 4 para apontar o domínio.

---

## Etapa 2 — Backend (API + PostgreSQL) na Railway

1. Acesse **railway.app** e crie uma conta (pode entrar com GitHub direto,
   o que já facilita a conexão do repositório).
2. **Adicione um método de pagamento** antes de começar: Railway → ícone do
   seu perfil (canto superior direito) → **Account Settings** → **Billing**
   → **Add Payment Method**. Sem isso, o projeto para de funcionar assim
   que a franquia gratuita inicial acabar.
3. **New Project** → **Deploy from GitHub repo** → selecione o repositório
   `belora`.
4. A Railway vai tentar detectar automaticamente onde está o código. Como o
   repositório tem três pastas, clique no serviço criado → **Settings** →
   **Root Directory** → defina como `belora-api`.
5. Ainda em **Settings**, confirme que o **Builder** está como "Dockerfile"
   (a Railway detecta o `Dockerfile` da pasta automaticamente).
6. **Adicione o PostgreSQL**: dentro do mesmo projeto Railway, clique em
   **+ New** → **Database** → **Add PostgreSQL**. A Railway cria o banco e
   já disponibiliza a variável `DATABASE_URL` automaticamente para os
   outros serviços do mesmo projeto referenciarem.
7. No serviço da API, vá em **Variables** e adicione:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=<gere um valor forte, veja comando abaixo>
   JWT_REFRESH_SECRET=<gere outro valor forte>
   JWT_EXPIRES_IN=1h
   JWT_REFRESH_EXPIRES_IN=30d
   WHATSAPP_PROVIDER=console
   PORT=3000
   ```
   Para gerar os segredos, rode isso no seu computador (com Node instalado):
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
   Rode duas vezes (um valor para cada variável `JWT_SECRET`/`JWT_REFRESH_SECRET`).
8. Clique em **Deploy**. Acompanhe os logs até aparecer `Belora API rodando
   na porta 3000`.
9. Rode as migrations e o seed uma única vez: no serviço da API, aba
   **Settings** → role até **Deploy** → use o botão de **shell**
   (ou instale a Railway CLI localmente: `npm i -g @railway/cli`, depois
   `railway login` e `railway run npm run db:migrate` dentro da pasta
   `belora-api`):
   ```bash
   railway link          # conecta a pasta local ao projeto Railway criado
   railway run npm run db:migrate
   railway run npm run db:seed     # opcional - cria o tenant "nicolly"
   ```
10. Em **Settings → Networking**, clique em **Generate Domain** para obter
    uma URL pública temporária (ex.: `belora-api-production.up.railway.app`)
    — vamos trocar por um domínio próprio na Etapa 4, mas essa URL já
    funciona e você vai precisar dela na próxima etapa.

---

## Etapa 3 — Painel admin e booking page na Vercel

1. Acesse **vercel.com** e crie uma conta (entrar com GitHub facilita).
2. **Faça upgrade para o plano Pro** antes de publicar de verdade: Vercel
   → ícone do seu time (canto superior esquerdo) → **Settings** → **Billing**
   → **Change Plan** → **Pro** (US$20/mês). Isso é necessário porque o
   plano Hobby (grátis) proíbe uso comercial nos termos de serviço, e o
   Belora vai gerar receita para a Nicolly.
3. **Add New** → **Project** → importe o repositório `belora` do GitHub.
4. Configure o primeiro projeto (**painel admin**):
   - **Root Directory**: `belora-admin`
   - **Framework Preset**: Vite (detecta sozinho)
   - **Environment Variables**:
     - `VITE_API_URL` = a URL da Railway do passo anterior
       (ex.: `https://belora-api-production.up.railway.app`)
     - `VITE_BOOKING_URL` = deixe em branco por ora, você volta aqui depois
       de criar o segundo projeto
   - Clique em **Deploy**.
5. Repita o processo para a **booking page**: **Add New → Project**, mesmo
   repositório, mas:
   - **Root Directory**: `belora-booking`
   - **Environment Variables**: `VITE_API_URL` = a mesma URL da Railway
6. Volte no projeto do painel admin (`belora-admin`) → **Settings** →
   **Environment Variables** → edite `VITE_BOOKING_URL` com a URL que a
   Vercel gerou para o projeto `belora-booking`
   (ex.: `https://belora-booking.vercel.app`) → **Redeploy** o projeto
   para a variável entrar em vigor.

Ao final você tem três URLs funcionando:
- API: `https://belora-api-production.up.railway.app`
- Painel admin: `https://belora-admin.vercel.app`
- Booking page: `https://belora-booking.vercel.app/nicolly`

---

## Etapa 4 — Apontar o domínio próprio

### Na Vercel (painel admin e booking page)

Para cada um dos dois projetos:

1. Projeto → **Settings** → **Domains** → digite o domínio desejado
   (ex.: `agenda.belora.com.br` para o painel, `belora.com.br` para a
   booking page) → **Add**.
2. A Vercel mostra os registros DNS que você precisa criar (geralmente um
   `CNAME` apontando para `cname.vercel-dns.com`, ou registros `A` se for
   o domínio raiz).

### Na Railway (API)

1. Serviço da API → **Settings** → **Networking** → **Custom Domain** →
   digite algo como `api.belora.com.br` → a Railway mostra um registro
   `CNAME` para criar.

### No painel do seu registrador (Registro.br ou Porkbun)

1. Entre na área de **DNS** do domínio comprado na Etapa 1.
2. Crie os registros exatamente como a Vercel/Railway indicaram (um `CNAME`
   ou `A` por subdomínio: `agenda`, `api`, e o domínio raiz para a booking
   page).
3. Propagação de DNS pode levar de alguns minutos a algumas horas.

Depois de propagado, volte em cada plataforma (Vercel/Railway) e confirme
que o domínio aparece como "Verificado"/"Válido".

**Depois de trocar para o domínio próprio**, atualize `PUBLIC_BOOKING_URL`
nas variáveis de ambiente da Railway (API) para a nova URL da booking page,
e `VITE_API_URL`/`VITE_BOOKING_URL` na Vercel para os novos domínios —
sem isso, os links de cancelamento/confirmação nas mensagens de WhatsApp
continuariam apontando para as URLs antigas da Vercel/Railway.

---

## Etapa 5 — Checklist final

- [ ] `ALLOWED_ORIGINS` configurada na Railway com os domínios finais do
      painel e da booking page (ex.:
      `ALLOWED_ORIGINS=https://agenda.belora.com.br,https://belora.com.br`),
      substituindo o CORS aberto usado em desenvolvimento.
- [ ] Testar o login no painel admin com o usuário criado pelo seed.
- [ ] Testar um agendamento completo pela booking page pública.
- [ ] Ajustar nome, horário de funcionamento, endereço e fuso horário do
      tenant da Nicolly na tela **Configurações** (o seed cria valores
      genéricos de exemplo).
- [ ] Avisar a Nicolly da URL do painel e criar/trocar a senha dela.
- [ ] Colocar o link da booking page na bio do Instagram.

---

## Resumo de custos (referência, câmbio pode variar)

| Item | Valor |
|---|---|
| Domínio `.com.br` (Registro.br, por ano) | ≈ R$ 40/ano |
| Railway (API + Postgres) | US$ 10-25/mês ≈ R$ 51-129/mês (varia por uso) |
| Vercel Pro (2 projetos) | US$ 20/mês ≈ R$ 103/mês |
| **Total mensal aproximado** | **≈ R$ 154-232/mês** |

> Nota: eu não tenho acesso de rede à Railway, Vercel ou aos registradores
> de domínio a partir deste ambiente, então não consegui testar estes
> passos clicando por clique como fiz com o restante do código do projeto.
> As instruções seguem a documentação pública de cada plataforma no momento
> em que este guia foi escrito - se alguma tela estiver diferente do
> descrito aqui (essas empresas mudam a interface com frequência), me
> mostre o que está vendo que eu ajudo a adaptar o passo a passo.
