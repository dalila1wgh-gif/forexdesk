# ForexDesk - Setup Vercel + Upstash

Esse guia te leva do zero até o app rodando online com sync entre dispositivos em ~15 minutos.

## 📁 Estrutura dos arquivos

```
forexdesk/
├── index.html         # O app
├── manifest.json      # PWA (instalar no celular)
├── package.json       # Dependências
├── vercel.json        # Config Vercel
└── api/
    └── sync.js        # API serverless de sync
```

Mantenha essa estrutura EXATA na pasta antes de fazer deploy.

---

## ⚙️ Passo 1: Criar conta Upstash (banco Redis grátis)

1. Acesse **https://upstash.com** → "Sign Up" (use GitHub ou email)
2. No painel, clique em **"Create Database"**
3. Configure:
   - **Name**: `forexdesk`
   - **Type**: Redis
   - **Region**: escolha a mais próxima do Brasil (us-east-1 ou sa-east-1 se aparecer)
   - **Tier**: Free (10.000 comandos/dia, mais que suficiente)
4. Clique em **Create**
5. Na página do banco que abriu, vai aparecer uma seção **"REST API"** com 2 valores:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - **Anote/copie esses 2 valores** — vai usar no passo 3

---

## ⚙️ Passo 2: Deploy no Vercel

### Opção A — Via CLI (mais rápido)

```bash
# Instalar Vercel CLI (uma vez só)
npm install -g vercel

# Na pasta do projeto
cd forexdesk
vercel

# Vai pedir login, aceite as opções padrão
# No final mostra a URL: https://forexdesk-xxx.vercel.app
```

### Opção B — Visual (sem terminal)

1. https://vercel.com/new
2. Arraste a pasta `forexdesk/` inteira
3. Vercel detecta automaticamente
4. Clique em **Deploy**

---

## ⚙️ Passo 3: Conectar Upstash ao Vercel

1. No painel do Vercel, abra seu projeto `forexdesk`
2. Vá em **Settings** → **Environment Variables**
3. Adicione DUAS variáveis (uma por uma):

   | Name | Value |
   |------|-------|
   | `UPSTASH_REDIS_REST_URL` | (cole do Upstash) |
   | `UPSTASH_REDIS_REST_TOKEN` | (cole do Upstash) |

4. Marque **Production**, **Preview** e **Development**
5. Clique em **Save** em cada uma
6. Vá em **Deployments** → no último deploy clique nos 3 pontinhos → **Redeploy**

> 💡 **Atalho**: Na hora de criar o projeto, o Vercel oferece "Add Integration → Upstash" que faz isso automaticamente. Mas fazer manual também funciona.

---

## ⚙️ Passo 4: Configurar o app

1. Abra a URL do seu app: `https://forexdesk-xxx.vercel.app`
2. Clique no **⚙ (engrenagem)** no topo
3. Na seção **☁️ Sync Multi-Dispositivo**:
   - **User Key**: digite uma chave secreta única (ex: `gabriel_kg7_2026`). 8+ caracteres.
   - **URL da API**: deixe **vazio** (vai usar `/api/sync` automaticamente)
   - **Auto-sync**: Ativado
4. Clique em **⬆ ENVIAR AGORA** para fazer o primeiro upload
5. Pronto! No outro dispositivo (celular), abra a mesma URL, vá no ⚙, digite a MESMA User Key, e clique em **⬇ BUSCAR AGORA**.

---

## 📱 Instalar no celular (PWA)

1. Abra a URL do app no Chrome do celular
2. Toque no menu (3 pontos) → **"Adicionar à tela inicial"**
3. Vira ícone como app nativo
4. No iOS: Safari → botão compartilhar → "Adicionar à Tela de Início"

---

## 🔄 Como funciona o sync

- **Salvamento local** (instantâneo): tudo no `localStorage` do navegador
- **Salvamento na nuvem** (3 segundos após a última alteração): envia tudo pro Upstash
- **Buscar de outro dispositivo**: clica em "BUSCAR AGORA" pra puxar a versão mais recente

> ⚠️ **Importante**: O sync é "manual de pull" — se você editar no celular E no PC ao mesmo tempo, o último que fizer "BUSCAR AGORA" sobrescreve o outro. Bom uso: trabalhe num dispositivo por vez ou sempre busque antes de editar.

---

## 🆘 Troubleshooting

**"Missing X-User-Key header"** → você não preencheu o User Key.

**"500 Internal Server Error"** → faltou configurar as variáveis no Vercel. Refaça o Passo 3.

**Não atualiza após mudar variáveis** → precisa redeploy. Vá em Deployments → Redeploy.

**Erro CORS** → impossível se estiver tudo no mesmo domínio Vercel. Se você separou URL da API, configure CORS no `api/sync.js`.

---

## 💰 Custos

**Tudo grátis nas faixas free:**
- Vercel Hobby: 100GB bandwidth/mês
- Upstash Free: 10.000 comandos/dia (~333/hora) — auto-sync a cada 3s usa ~1.200 comandos/hora, dá 8h de uso intenso por dia. Suficiente pra trader normal.

Se ultrapassar, são poucos centavos.
