# Documentação Mobile - Módulo de Chat

Este documento é um guia focado para o desenvolvimento da **Tela de Conversa (Chat Window)** do WatinkApp. Ele contém apenas as especificações de UI, endpoints e eventos de socket pertinentes a essa funcionalidade.

---

## 1. Estrutura e Interface do Chat (UI/UX) 📱

### 1.1 Navegação (Inbox & Tabs) 🗂️

A tela principal de mensagens (Inbox) é dividida em abas para organizar o fluxo de trabalho:

*   **Aguardando (Pending):** Tickets que entraram na fila mas ainda não possuem dono.
    *   *Comportamento:* Lista de leitura apenas, sem interação.
    *   *Interatividade:* Botão **"Aceitar"** disponível.
*   **Atendendo (Open):** Tickets que já foram aceitos pelo usuário logado.
    *   *Comportamento:* Interação total habilitada (Responder, Mídia, etc).

### 1.2 Header (Chat Window)
O cabeçalho deve fornecer contexto imediato sobre quem é o contato e o estado do atendimento.

*   **Avatar:** `contact.profilePicUrl` (Exibir placeholder se null/empty).
*   **Nome:** `contact.name`.
*   **Ticket ID:** Exibir `ticket.id` (Ex: `#1024`) discretamente.

### 1.3 Drawer (Menu Lateral de Ações)
Menu acessível via ícone no header, contendo ações administrativas do ticket.

**Itens Obrigatórios:**
1.  **Perfil do Contato:** Foto e dados principais.
2.  **Carteira (Wallet):** Toggle switch.
    *   *Action:* `PUT /contacts/{contactId}` envio `{ walletUserId: ID (para adicionar) | null (para remover) }`.
    *   *Visualização:* Se `contact.walletUserId == myUserId` → Estrela Cheia ⭐ (Remover). Senão → Estrela Vazia ☆ (Adicionar).
3.  **Encerrar Ticket:** Botão de destaque.
    *   *Action:* `PUT /tickets/{ticketId}` envio `{ status: "closed" }`.
4.  **Devolver Ticket:**
    *   *Action:* `PUT /tickets/{ticketId}` envio `{ userId: null, status: "pending" }`.
5.  **Novo Protocolo (Helpdesk):**
    *   *Action:* Abrir modal de criação (Ver seção 3).
6.  **Assinar Mensagens:**
    *   *Componente:* Toggle Switch.
    *   *Descrição:* Habilita o prefixo de nome nas mensagens enviadas (Ver seção 2.6).

### 1.4 Área de Mensagens & Input

O comportamento desta área varia conforme o **status** do ticket (`ticket.status`):

#### A. Modo "Aguardando" (Pending) 🔒
Quando o ticket está na aba "Aguardando" ou possui `status: "pending"`:
*   **Visualização:** O atendente **PODE** ler todas as mensagens anteriores.
*   **Input Bar:** Deve estar **OCULTA** ou **DESABILITADA**.
*   **Botão de Ação:** Exibir um botão flutuante ou barra inferior fixa grande: **"ACEITAR TICKET"**.
    *   *Ação:* `PUT /tickets/{ticketId}` com `{ status: "open", userId: myUserId }`.
*   **Restrição:** Não é possível responder, enviar mídia ou gravar áudio até aceitar.

#### B. Modo "Atendendo" (Open) ✅
Quando o ticket já é do usuário (`status: "open"`):
*   **Input Bar:** Totalmente visível e interativa.
*   **Botões:** Emoji, Áudio, Anexos disponíveis.
*   **Lista:** Renderizar balões de mensagem normalmente.

---

## 2. Endpoints do Chat 💬

### 2.1 Listar Mensagens (Carga Inicial)
Carrega o histórico da conversa ao abrir a tela.
```http
GET /messages/:ticketId
Headers: Authorization: Bearer <token>
Query: ?pageNumber=1
```
**Response:** Retorna array `messages[]`, objeto `ticket` e `count`.

### 2.2 Enviar Mensagem (Texto)
```http
POST /messages/:ticketId
Content-Type: application/json

{
  "body": "Texto da mensagem"
}
```

### 2.3 Enviar Mídia (Imagem/Áudio/Doc)
```http
POST /messages/:ticketId
Content-Type: multipart/form-data

medias: [FILE]
body: "Legenda (opcional)"
```
> **Nota:** Para áudio, gravar em `.m4a` ou `.ogg`.

### 2.4 Ações em Mensagens
*   **Responder (Quote):** `POST /messages/:ticketId` com `{ body: "...", quotedMsg: { id: "..." } }`.
*   **Deletar:** `DELETE /messages/:messageId`.

### 2.5 Indicadores Visual de Status (Ticks) ✔️
Para mensagens enviadas pelo usuário (`fromMe: true`), exibir ícones conforme o campo `ack`:

| ACK | Status | Ícone (Ref. WhatsApp) | Cor |
|:---:|:-------|:----------------------|:----|
| **0** | Pendente (Clock) | 🕒 Relógio | Cinza (`#808080`) |
| **1** | Enviado no Servidor | ✓ 1 Tick (Check) | Cinza (`#808080`) |
| **2** | Entregue no Destino | ✓✓ 2 Ticks (Double Check) | Cinza (`#808080`) |
| **3** | Lido / Reproduzido | ✓✓ 2 Ticks (Double Check) | Azul Watink (`#2196F3`) |
| **4** | Reproduzido (Áudio) | 🎤 Microfone Azul | Azul Watink (`#2196F3`) |

> [!TIP]
> O evento `appMessage` com `action: update` informa em tempo real quando o ACK muda (ex: de 2 para 3 quando o cliente abre o WhatsApp). O app deve atualizar o ícone sem recarregar a lista.

### 2.6 Assinatura de Mensagens (Identificação) ✍️

Lógica **Client-Side** para identificar quem enviou a mensagem em filas compartilhadas.

*   **Configuração:** App deve persistir localmente a preferência `signMessage` (Default: `true`).
*   **Comportamento:** Ao enviar mensagem (`POST /messages`), se `signMessage == true`, o App deve modificar o `body`:

    ```javascript
    // Formato: *NomeUser:*\nMsg
    const body = signMessage ? `*${user.name}:*\n${text}` : text;
    ```

---

## 3. Integração Helpdesk (Protocolos) 🎫

Funcionalidade para gerar tickets de suporte nível 2 diretamente do chat.

### 3.1 Fluxo de Criação
1.  Usuário clica em **"Novo Protocolo"** no Drawer.
2.  Preenche: Assunto, Descrição, Prioridade.
3.  **Request:**
    ```http
    POST /contacts/{contactId}/protocols
    Body:
    {
      "subject": "Erro no sistema",
      "description": "Detalhes...",
      "priority": "high",
      "ticketId": 123
    }
    ```

### 3.2 Feedback no Chat
Após sucesso (201 Created), o App deve renderizar uma **Mensagem de Sistema** localmente na lista de mensagens, seguindo rigorosamente o template do backend para consistência visual:

> **Template da Mensagem:**
> ```
> *Olá! Seu protocolo de atendimento foi criado com sucesso.*
>
> *Protocolo:* #{protocolNumber}
> *Assunto:* {subject}
> *Prioridade:* {priority}
>
> 🔗 Acompanhe seu protocolo clicando aqui:
> {frontendUrl}/public/protocols/{token}
> ```

*Obs: O App deve utilizar a `frontendUrl` obtida no endpoint `/mobile/v1/branding`.*
*Obs: A prioridade deve ser traduzida (Ex: high -> Alta).*

---

## 4. Módulo de Suporte (Helpdesk) 🎫

Tela dedicada para visualizar e gerenciar os tickets de suporte (Protocolos) atribuídos ao usuário ou filas.

### 4.1 Dashboard (KPIs)
Resumo rápido para o cabeçalho da tela de suporte.

```http
GET /protocols/dashboard
```
**Response:**
```json
{
  "open": 5,
  "closed": 12,
  "urgent": 1
}
```

### 4.2 Listar Protocolos
```http
GET /protocols
Query:
  ?pageNumber=1
  &searchParam= (busca por título/ID)
  &status=open (ou closed)
  &priority= (high, medium, low)
```

**Response:**
```json
{
  "protocols": [
    {
      "id": 1024,
      "protocolNumber": "202601250001",
      "subject": "Erro de Impressão",
      "status": "open",
      "priority": "high",
      "createdAt": "2026-01-25T10:00:00Z",
      "contact": { "name": "Cliente Exemplo" },
      "user": { "name": "Atendente Atual" }
    }
  ],
  "count": 50,
  "hasMore": true
}
```

### 4.3 Detalhes do Protocolo
Visualização completa do ticket, incluindo histórico de interações.

```http
GET /protocols/:protocolId
```

**Response:**
```json
{
    "id": 1024,
    "subject": "Erro de Impressão",
    "description": "Detalhes completos...",
    "status": "open",
    "priority": "high",
    "contact": { ... },
    "histories": [
        {
            "id": 1,
            "body": "Protocolo criado",
            "createdAt": "...",
            "user": { "name": "Sistema" }
        }
    ]
}
```

### 4.4 Atualizar Protocolo (Comentários e Anexos)
Endpoint único para adicionar comentários, alterar status ou anexar arquivos.

```http
PUT /protocols/:protocolId
Content-Type: multipart/form-data
```

**Body (FormData):**
```
status: "open" | "resolved" | "closed" (Opcional)
priority: "low" | "medium" | "high" (Opcional)
comment: "Texto do comentário ou nota de atualização" (Opcional)
files: [FILE1, FILE2, ...] (Opcional - Max 10)
```

**Exemplo de uso:**
1. **Apenas Comentar:** Enviar `comment` com o texto.
2. **Anexar Arquivos:** Enviar array de `files` (pode ir junto com `comment`).
3. **Mudar Status:** Enviar `status` (ex: "closed").

**Response (200 OK):**
Retorna o objeto `Protocol` atualizado.

### 4.5 Listar Anexos
```http
GET /protocols/:protocolId/attachments
```
Retorna lista de arquivos anexados ao protocolo.

---

## 5. Real-time (Socket.io) 🔌

Eventos necessários para manter o chat vivo.

### 4.1 Conexão
```javascript
const socket = io(URL, { query: { token } });
socket.emit("joinChatBox", ticketId); // Entrar na sala do ticket
```

### 4.2 Ouvir Eventos
| Evento | Ação no App |
|--------|-------------|
| `appMessage` (action: create) | Adicionar mensagem nova na lista (scroll to bottom). |
| `appMessage` (action: update) | Atualizar status (ACK) de mensagem existente (ex: de enviado p/ lido). |
| `ticket` (action: update) | Verificar se status mudou (ex: fechado por outro admin) para travar input. |

---

## 5. Notificações (Push) 🔔

Para mensagens recebidas com o app em background.

*   **Identificação:** Payload contém `type: "CHAT_MESSAGE"` e `ticketId`.
*   **Comportamento:** Ao clicar na notificação, abrir diretamente a **Chat Window** do `ticketId` correspondente.

---

## 7. Status de Implementação (Changelog)

| Versão | Data       | Mudança                                                                 |
|--------|------------|-------------------------------------------------------------------------|
| 2.6    | 2026-01-25 | Adicionado documentação completa do Módulo de Suporte (Helpdesk)        |
|--------|------------|-------------------------------------------------------------------------|
| 2.5    | 2026-01-25 | Documentada lógica Client-Side de Assinatura de Mensagens (Prefixo)     |
| 2.4    | 2026-01-24 | Adicionado tabela de mapeamento de ACK (Ticks/Leitura)                  |
| 2.3    | 2026-01-24 | Inclusão de `frontendUrl` no template de protocolo e endpoint de branding |
| 2.2    | 2026-01-24 | Adicionado detalhamento de Abas (Inbox) e Estados (Atendendo vs Aguardando) |
| 2.1    | 2026-01-24 | Documento especializado: Módulo Chat (UI, Sockets, Actions, Helpdesk)   |
| 2.0    | 2026-01-24 | Separação da documentação Chat da API completa Standard             |
