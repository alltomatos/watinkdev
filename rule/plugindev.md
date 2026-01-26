# 🧩 Guia de Desenvolvimento de Plugins (Microserviços) - Watink

Este documento detalha como desenvolver plugins para o ecossistema Watink, com foco na arquitetura de microserviços integrados via RabbitMQ e gerenciados pelo **Plugin Manager**.

Baseado na análise do projeto `plugin-manager` e do plugin de exemplo `watink-smtp-go`.

---

## 1. Arquitetura do Ecossistema

O sistema de plugins do Watink opera em duas frentes principais:

1.  **Gerenciamento (Plugin Manager)**: Serviço central (Go) responsável por listar o catálogo, gerenciar instalações, licenças e ativações por Tenant.
2.  **Execução (Microserviços)**: Serviços independentes (Go/Node/etc) que executam a lógica do plugin, comunicando-se via RabbitMQ ou APIs HTTP.

### Fluxo de Funcionamento

1.  O **Frontend/Backend** consulta o **Plugin Manager** para saber quais plugins estão ativos para o Tenant atual.
2.  Se ativo, o Backend envia comandos/eventos para o **RabbitMQ**.
3.  O **Plugin (Microserviço)** consome a fila, processa a tarefa e (opcionalmente) retorna um resultado ou envia um evento de volta.

---

## 2. O Plugin Manager (`plugin-manager`)

Localizado em `/plugin-manager`, é uma API REST em Go.

### 2.1 Banco de Dados

O gerenciador utiliza duas tabelas principais no PostgreSQL (`watink` DB):

*   **`Plugins`**: O catálogo global de plugins disponíveis.
    *   `id` (UUID), `slug` (ex: `smtp-service`), `name`, `version`, `type` (free/premium), `price`.
*   **`PluginInstallations`**: O registro de ativação por Tenant.
    *   `id`, `tenantId`, `pluginId`, `status` (active/inactive), `licenseKey`.

### 2.2 API Endpoints

A comunicação interna ocorre via HTTP (porta 3005 internamente):

*   `GET /api/v1/plugins/catalog`: Lista todos os plugins disponíveis.
*   `GET /api/v1/plugins/installed`: Lista plugins ativos para o Tenant (requer header `x-tenant-id`).
*   `POST /api/v1/plugins/{slug}/activate`: Ativa um plugin para o Tenant.
*   `POST /api/v1/plugins/{slug}/deactivate`: Desativa um plugin.

---

## 3. Desenvolvendo um Plugin Microserviço (Ex: SMTP)

O `plugins/watink-smtp-go` é o modelo de referência para plugins de alta performance em Go.

### 3.1 Estrutura Recomendada

```
/plugins/seu-plugin-go/
├── main.go           # Entrypoint, conexão RabbitMQ e lógica
├── go.mod            # Dependências
├── Dockerfile        # Build multi-stage (Builder -> Alpine)
└── VERSION           # Arquivo de versão
```

### 3.2 Padrão de Comunicação (RabbitMQ)

O plugin deve atuar como um **Worker** que consome mensagens de uma fila específica.

**Configuração do Consumidor (Exemplo Go):**

```go
// 1. Conexão
conn, _ := amqp.Dial(os.Getenv("RABBITMQ_URL"))

// 2. Declaração da Exchange (Topic)
ch.ExchangeDeclare("wbot.commands", "topic", ...)

// 3. Declaração da Fila Exclusiva do Plugin
q, _ := ch.QueueDeclare("seu.plugin.queue", ...)

// 4. Bind (Amarração da Rota)
ch.QueueBind(q.Name, "seu.plugin.routing.key", "wbot.commands", ...)
```

**Envelope de Mensagem (JSON):**

Todo plugin deve esperar e respeitar o envelope padrão de mensagens:

```go
type Envelope struct {
    ID        string          `json:"id"`
    Timestamp int64           `json:"timestamp"`
    Type      string          `json:"type"`     // Ex: "smtp.send"
    Payload   json.RawMessage `json:"payload"`  // Dados específicos do plugin
}
```

### 3.3 Dockerfile (Multi-stage Build)

Para manter a imagem leve (~15MB), use o padrão Alpine:

```dockerfile
# Stage 1: Build
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o /seu-plugin main.go

# Stage 2: Runtime
FROM alpine:latest
WORKDIR /
COPY --from=builder /seu-plugin /seu-plugin
ENTRYPOINT ["/seu-plugin"]
```

---

## 4. Integração ao Marketplace

Para que seu plugin apareça e seja gerenciável, siga estes passos:

### 4.1 Registrar no Catálogo (`Plugins`)

Insira o registro no banco de dados (via Migration ou Seed no Backend principal):

```sql
INSERT INTO "Plugins" (id, slug, name, description, version, type, category, price)
VALUES (
  gen_random_uuid(),
  'meu-plugin',
  'Meu Plugin Incrível',
  'Faz coisas incríveis via RabbitMQ',
  '1.0.0',
  'free',
  'integration',
  0.00
);
```

### 4.2 Adicionar ao Docker Stack

Adicione o serviço ao `docker-compose.yaml` ou `docker-plugin.yml`:

```yaml
  meu-plugin:
    image: watink/meu-plugin:latest
    environment:
      - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
    networks:
      - watink_network
    deploy:
      mode: replicated
      replicas: 1
```

### 4.3 Consumo no Backend (Disparo)

No código do Backend (Node.js), envie o comando para o RabbitMQ apenas se o plugin estiver ativo:

```typescript
// Exemplo conceitual no Backend
const activePlugins = await listInstalledPlugins(tenantId);
if (activePlugins.includes('meu-plugin')) {
    publishToQueue('wbot.commands', 'seu.plugin.routing.key', {
        type: 'seu.plugin.action',
        payload: { ...dados }
    });
}
```

---

## 5. Checklist de Desenvolvimento

1.  [ ] **Criar Repositório/Pasta**: `plugins/nome-do-plugin`.
2.  [ ] **Implementar Worker**: Consumidor RabbitMQ robusto (reconexão, tratamento de erros).
3.  [ ] **Definir Payload**: Estrutura JSON clara para entrada de dados.
4.  [ ] **Dockerfile**: Otimizado e seguro.
5.  [ ] **Migration**: Inserir metadados na tabela `Plugins`.
6.  [ ] **Deploy**: Configurar serviço no Docker Stack.
