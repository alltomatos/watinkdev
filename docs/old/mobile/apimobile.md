# API Mobile - Referência Completa

Este documento detalha **todos os endpoints** disponíveis para o aplicativo mobile WatinkApp, incluindo a camada BFF (Backend for Frontend) otimizada e os endpoints standard.

Este documento detalha **todos os endpoints** disponíveis para o aplicativo mobile WatinkApp, incluindo a camada BFF (Backend for Frontend) otimizada e os endpoints standard.

---

## 🔒 Multitenancy e Segurança

O Watink é um sistema **Multi-tenant**, o que significa que múltiplas empresas (Tenants) coexistem na mesma infraestrutura, mas com dados **estritamente isolados**.

### Como funciona o isolamento no App Mobile:
1. **Autenticação JWT:** O token gerado no login contém o `tenantId` do usuário criptografado.
2. **Filtro Automático:** Toda requisição à API (BFF ou Standard) extrai o `tenantId` do token e o injeta automaticamente nas queries do banco de dados.
3. **UUIDs:** Utilizamos `uuid` nos Tickets e Contatos não apenas como identificador único, mas para evitar enumeração de sequenciais (IDOR).
4. **Segurança de Dados:** O backend garante que um usuário do Tenant A **jamais** receba dados do Tenant B, mesmo que tente manipular filtros ou IDs, pois o filtro `where: { tenantId }` é forçado no servico.

> ℹ️ **Para o Desenvolvedor do App:** Não é necessário enviar `tenantId` nas requisições. O backend cuida disso transparentemente via Token. Apenas certifique-se de enviar o header `Authorization: Bearer <token>` em todas as chamadas.

---
```http
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@empresa.com",
  "password": "senha123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Nome do Usuário",
    "email": "usuario@empresa.com",
    "profile": "admin",
    "profileImage": "public/image.jpg",
    "queues": [{ "id": 1, "name": "Fila 1" }],
    "tenantId": "uuid-do-tenant"
  }
}
```

> 🖼️ **Imagem de Perfil do Usuário:**
> A URL absoluta do avatar do atendente é construída como: `{backendUrl}/{user.profileImage}`.

---

### Refresh Token
```http
POST /auth/refresh_token
Headers: Authorization: Bearer <token_expirado>
```

**Response (200 OK):**
```json
{
  "token": "novo_token_aqui",
  "user": {
    "id": 1,
    "name": "Nome do Usuário",
    "email": "usuario@empresa.com",
    "profile": "admin",
    "queues": [1, 2, 3]
  }
}
```

---

### Logout
```http
DELETE /auth/logout
Headers: Authorization: Bearer <token>
```

**Response (200 OK):** No body.

---

## 📱 API Mobile BFF (`/mobile/v1`)
Endpoints otimizados com payload reduzido para economia de bateria e dados.

### Listar Tickets (Leve)
```http
GET /mobile/v1/tickets
Headers: Authorization: Bearer <token>
```

**Query Params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `pageNumber` | int | Página (default: 1) |
| `status` | string | `open`, `pending`, `closed` |
| `searchParam` | string | Busca por nome/número |
| `queueIds` | int[] | Filtro por filas |
| `showAll` | bool | Mostrar todos (admin) |

**Response (200 OK):**
```json
{
  "tickets": [
    {
      "id": 123,
      "uuid": "uuid-string",
      "contactName": "Maria Silva",
      "contactProfilePic": "https://api.watink.com/public/1/contacts/456_profile.jpg?v=1700000000000",
      "lastMessage": "Olá, tudo bem?",
      "unreadCount": 2,
      "queueId": 1,
      "status": "open",
      "updatedAt": "2026-01-22T14:00:00.000Z"
    }
  ],
  "count": 50,
  "hasMore": true,
  "timestamp": "2026-01-22T14:00:00.000Z"
}
```

> 🖼️ **Sobre Avatares de Contato:**
> - O campo `contactProfilePic` já retorna a URL **absoluta** e pronta para uso.
> - O backend anexa automaticamente o parâmetro `?v=timestamp` para evitar problemas de cache no App quando a imagem é atualizada.
> - Se o contato não possuir foto, este campo retornará uma string vazia `""`. O App deve exibir um placeholder padrão nestes casos.


---

### Registrar Device Token (FCM Push)
```http
POST /mobile/v1/device-token
Headers: Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "fcm_device_token_string",
  "platform": "android"
}
```

**Response (200 OK):**
```json
{ "message": "Device token saved" }
```

> [!NOTE]
> O App deve enviar o `device-token` toda vez que o login for bem-sucedido ou quando o token for renovado pelo Firebase, para garantir que as notificações push sejam entregues corretamente.

---

### Obter Branding (Logo e Título)
```http
GET /mobile/v1/branding
```

> [!TIP]
> Este endpoint é **público** e deve ser chamado na tela de inicialização (Splash) ou login para obter a identidade visual do sistema sem necessidade de estar logado.

**Response (200 OK):**
```json
{
  "mobileLogo": "public/mobile-logo-1234.png",
  "systemTitle": "Watink",
  "backendUrl": "https://api.watink.com"
}
```

> 💡 **Como exibir a Logo:**
> A URL completa da logo é construída concatenando o `backendUrl` com o `mobileLogo`:
> - Se `mobileLogo` começar com `public/`, use: `{backendUrl}/{mobileLogo}`
> - Se `mobileLogo` estiver vazio, utilize a logo padrão do app localmente.

---

### Configurações Públicas (Alternativo)
```http
GET /public-settings
```

**Response (200 OK):**
```json
[
  { "key": "systemLogo", "value": "public/system-logo.png" },
  { "key": "mobileLogo", "value": "public/mobile-logo.png" },
  { "key": "systemTitle", "value": "Watink" }
]
```

> [!NOTE]
> Este endpoint retorna todas as configurações marcadas como públicas no backend. É útil se o app precisar de mais dados além da logo básica (como o título do sistema ou favicon).

---

### Recuperação de Senha

**Esqueci minha senha:**
```http
POST /auth/forgot-password
Content-Type: application/json

{ "email": "usuario@empresa.com" }
```

**Alterar senha (via Token do Email):**
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "token_do_email",
  "password": "nova_senha_123"
}
```

---

## 🎫 Tickets (Standard)

### Listar Tickets (Completo)
```http
GET /tickets
Headers: Authorization: Bearer <token>
```

**Query Params:** Mesmos do BFF + `date`, `withUnreadMessages`, `isGroup`

---

### Obter Ticket
```http
GET /tickets/:ticketId
Headers: Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": 123,
  "uuid": "uuid-string",
  "status": "open",
  "unreadMessages": 0,
  "lastMessage": "Última mensagem",
  "contact": {
    "id": 456,
    "name": "Maria Silva",
    "number": "5511999999999",
    "profilePicUrl": "https://..."
  },
  "queue": { "id": 1, "name": "Vendas" },
  "user": { "id": 1, "name": "Atendente" }
}
```

---

### Criar Ticket
```http
POST /tickets
Headers: Authorization: Bearer <token>
Content-Type: application/json

{
  "contactId": 456,
  "status": "open",
  "userId": 1
}
```

---

### Aceitar/Atualizar Ticket
```http
PUT /tickets/:ticketId
Headers: Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "open",
  "userId": 1,
  "queueId": 2
}
```

**Valores de `status`:**
- `pending` → Aguardando
- `open` → Em atendimento (aceitar)
- `closed` → Finalizado

---

### Fechar Ticket
```http
PUT /tickets/:ticketId
Content-Type: application/json

{ "status": "closed" }
```

---

### Excluir Ticket
```http
DELETE /tickets/:ticketId
Headers: Authorization: Bearer <token>
```
> ⚠️ Requer permissão `delete_tickets`

---

### Fechar Todos os Tickets
```http
PUT /tickets/close-all
Headers: Authorization: Bearer <token>
Content-Type: application/json

{
  "statusOpen": true,
  "statusPending": true,
  "includeGroups": false
}
```

---

## 💬 Mensagens

### Listar Mensagens
```http
GET /messages/:ticketId
Headers: Authorization: Bearer <token>
```

**Query Params:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `pageNumber` | int | Página (default: 1) |

**Response (200 OK):**
```json
{
  "messages": [
    {
      "id": "message-id-string",
      "body": "Conteúdo da mensagem",
      "ack": 3,
      "fromMe": true,
      "mediaUrl": null,
      "mediaType": null,
      "reactions": [
          { 
              "sender": "551199999999@s.whatsapp.net",
              "text": "❤️",
              "timestamp": 1700000000000
          }
      ],
      "createdAt": "2026-01-22T14:00:00.000Z"
    }
  ],
  "ticket": { /* objeto ticket */ },
  "count": 100,
  "hasMore": true
}
```

> 🔗 **Como exibir mídias:**
> As mídias enviadas/recebidas possuem um campo `mediaUrl`. A URL final para o App é:
> `{backendUrl}/public/{mediaUrl}`
> Exemplo: `https://api.watink.com/public/648f5641-a67b-4861-828e-9909249c6931/17000000_msgId.jpg`

> 🔒 **Segurança e Isolamento:**
> - As mídias são isoladas fisicamente em pastas usando o **UUID do Tenant**, garantindo que arquivos de diferentes empresas não se misturem.
> - O nome do arquivo no disco é ofuscado (inclui timestamp e ID da mensagem), o que impossibilita a adivinhação de URLs por outros usuários (princípio de *Security through Obscurity* combinado com isolamento de diretório).


**Valores de `ack`:**
| Valor | Significado |
|-------|-------------|
| 0 | Pendente |
| 1 | Enviado |
| 2 | Entregue |
| 3 | Lido |

---

### Enviar Mensagem (Texto)
```http
POST /messages/:ticketId
Headers: Authorization: Bearer <token>
Content-Type: application/json

{
  "body": "Olá, como posso ajudar?"
}
```

---

### Enviar Mensagem (Mídia/Áudio)
```http
POST /messages/:ticketId
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data

medias: [arquivo.jpg ou audio.m4a]
body: "Legenda opcional"
```

> 🎤 **Dica para Áudio:**
> - Envie áudios gravados no formato `.m4a` ou `.ogg`.
> - O backend processa o arquivo e o entrega como áudio reproduzível no WhatsApp.
> - Utilize a chave `medias` (plural) mesmo para um único arquivo.

> 📁 **Formatos Suportados e Limites:**
> - **Imagens:** jpg, jpeg, png, webp (Máx: 5MB)
> - **Vídeos:** mp4 (Máx: 20MB)
> - **Áudios:** m4a, ogg, mp3 (Máx: 10MB)
> - **Documentos:** pdf, docx, xlsx, txt (Máx: 20MB)


---

### Enviar Mensagem Citada
```http
POST /messages/:ticketId
Content-Type: application/json

{
  "body": "Respondendo sua pergunta...",
  "quotedMsg": {
    "id": "quoted-message-id"
  }
}
```

---

### Deletar Mensagem
```http
DELETE /messages/:messageId
Headers: Authorization: Bearer <token>
```

---

## 🔌 Real-time (Socket.io)

O WatinkApp utiliza Socket.io para atualizações em tempo real. A conexão exige autenticação via token JWT enviado na query da conexão.

### Conexão
```javascript
const socket = io("https://api.watink.com", {
  query: { token: "SEU_TOKEN_JWT" },
  transports: ['websocket'] // Recomendado para maior estabilidade
});
```

### Subscrições (Canais)
Após conectar, o app deve "entrar" nos canais relevantes para começar a receber os eventos:

| Evento (Emitir) | Argumento | Descrição |
|-----------------|-----------|-----------|
| `joinTickets` | `status` | Entra no canal de tickets com o status específico ("pending" ou "open"). |
| `joinNotification` | (nenhum) | Recebe notificações globais (ex: quando um ticket muda de 'pending' para 'open'). |
| `joinChatBox` | `ticketId` | Entra no canal de um ticket específico para receber as mensagens em tempo real. |

---

### Eventos Recebidos (Ouvir)

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `appMessage` | `{ action, message, ticket, contact }` | Nova mensagem, atualização de ACK (Lido/Enviado) ou deleção. |
| `ticket` | `{ action, ticket, ticketId }` | Novo ticket, mudança de status ou atribuição de usuário. |
| `contact` | `{ action, contact }` | Atualização de dados do contato (nome, avatar, etc). |
| `whatsapp` | `{ action, whatsapp }` | Alteração nas configurações da conexão WhatsApp (ex: troca de nome). |
| `whatsappSession` | `{ action, session }` | Status crítico de conexão (QR Code, Conectado, Desconectado). |

#### Valores de `action`:
- `create`: Novo item que deve ser adicionado à lista.
- `update`: Item existente que foi modificado.
- `delete`: Item que deve ser removido da visualização (ex: ticket movido de 'pendente' para 'atendimento').

---

### Detalhes de Payloads

#### 1. appMessage (Mensagens)
```json
{
  "action": "create", // ou "update", "delete"
  "message": {
    "id": "MSG_ID",
    "body": "Olá!",
    "fromMe": false,
    "ack": 2, // 0: pendente, 1: enviado, 2: entregue, 3: lido
    "mediaUrl": "uuid/filename.jpg", // Opcional
    "mediaType": "image", // Opcional: "image", "audio", "video", "document"
    "ticketId": 123,
    "createdAt": "2026-01-23T15:00:00.000Z"
  },
  "ticket": { ... }, // Opcional: enviado no 'create' para atualizar a lista
  "contact": { ... } // Opcional: enviado no 'create' com dados do remetente
}
```

#### 2. whatsappSession (Conexão)
Essencial para exibir o QR Code no app mobile se a sessão cair:
```json
{
  "action": "update",
  "session": {
    "id": 1,
    "status": "QRCODE", // Opções: "CONNECTED", "DISCONNECTED", "QRCODE", "PAIRING", "TIMEOUT"
    "qrcode": "1@...", // String para gerar o QR Code
    "pairingCode": "ABCDEFGH" // Opcional: se o usuário escolheu pareamento por código
  }
}
```

---

### Heartbeat (Status Online)
Para que o usuário apareça como "Online" no painel administrativo, o app mobile deve emitir o evento `heartbeat` periodicamente enquanto estiver em primeiro plano.

```javascript
// Recomendado: enviar a cada 30 segundos
setInterval(() => {
  socket.emit("heartbeat");
}, 30000);
```

---

### Exemplo de Implementação (JavaScript)
```javascript
import io from "socket.io-client";

// 1. Conectar
const socket = io(BACKEND_URL, { query: { token } });

socket.on("connect", () => {
  // 2. Entrar nos canais de interesse
  socket.emit("joinTickets", "pending");
  socket.emit("joinTickets", "open");
  socket.emit("joinNotification");
});

// 3. Ouvir novas mensagens
socket.on("appMessage", (data) => {
  if (data.action === "create" && data.message.ticketId === currentTicketId) {
    addMessageToChatList(data.message);
  }
  if (data.action === "update") {
    updateMessageStatus(data.message.id, data.message.ack);
  }
});

// 4. Ouvir atualizações de tickets (Lista de Conversas)
socket.on("ticket", (data) => {
  updateTicketList(data.ticket);
});
```

---

## � Notificações de Novas Mensagens

O sistema utiliza dois mecanismos complementares para garantir que o atendente seja notificado sobre novas mensagens:

### 1. Real-time (Socket.io) - App em Primeiro Plano (Foreground)
Quando o aplicativo está aberto e conectado ao socket, ele recebe o evento `appMessage` com `action: "create"`. 

- **Canal:** O app deve estar inscrito no canal `notification` (via `joinNotification`) ou no canal do ticket específico (`joinChatBox`).
- **Comportamento esperado:** 
  - Se o ticket da nova mensagem já estiver aberto no chat, a mensagem deve aparecer instantaneamente.
  - Se o app estiver na lista de conversas, o contador de mensagens não lidas (`unreadCount`) deve ser incrementado.
  - O app pode emitir um som de notificação interno.

### 2. Push Notifications (FCM) - App em Segundo Plano (Background/Quit)
Para mensagens que chegam quando o app está fechado ou em segundo plano, o backend utiliza o **Firebase Cloud Messaging (FCM)**.

#### Fluxo de Registro:
1. O App obtém o token do Firebase (FCM Token).
2. O App envia o token para o backend via: `POST /mobile/v1/device-token`.
3. O Backend armazena o token vinculado ao usuário e ao tenant.

#### Payload da Notificação Push:
O backend envia um push para todos os dispositivos registrados do usuário caso ele seja o proprietário do ticket ou se o ticket estiver na fila dele.

```json
{
  "to": "device_token",
  "notification": {
    "title": "Nova mensagem de Maria Silva",
    "body": "Olá, tudo bem?",
    "sound": "default"
  },
  "data": {
    "ticketId": "123",
    "uuid": "uuid-do-ticket",
    "type": "CHAT_MESSAGE",
    "click_action": "FLUTTER_NOTIFICATION_CLICK"
  }
}
```

> [!IMPORTANT]
> Atualmente, o backend possui o serviço `SendPushNotification.ts` preparado para integração. Certifique-se de que as chaves do Firebase estão configuradas no ambiente de produção para que os disparos ocorram.

---

## �📊 Códigos de Erro

| Código | Mensagem | Descrição |
|--------|----------|-----------|
| 401 | `ERR_SESSION_EXPIRED` | Token expirado |
| 403 | `ERR_NO_PERMISSION` | Sem permissão |
| 404 | `ERR_NO_TICKET_FOUND` | Ticket não encontrado |
| 404 | `ERR_NO_CONTACT_FOUND` | Contato não encontrado |
| 400 | `ERR_WHATSAPP_NOT_CONNECTED` | WhatsApp desconectado |

---

## 🚀 Fluxos Comuns

### 1. Inicialização do App (Pre-login)
```
GET /mobile/v1/branding         → Logo e título (Público)
ou
GET /public-settings           → Configurações gerais (Público)
```

### 2. Login e Registro de Push
```
POST /auth/login               → Obter Token
POST /mobile/v1/device-token   → Registrar token FCM (Requer Token)
```

### 3. Uso Diário
```
GET /mobile/v1/tickets?status=pending  → Lista de tickets
```

### 2. Aceitar Ticket
```
PUT /tickets/:ticketId  { "status": "open", "userId": 1 }
```

### 3. Responder Mensagem
```
POST /messages/:ticketId  { "body": "Resposta aqui" }
```

### 4. Encerrar Atendimento
```
PUT /tickets/:ticketId  { "status": "closed" }
```

---

## 5. Extensibilidade & Plugins 🧩
O Watink possui uma arquitetura modular. Funcionalidades extras podem ser ativadas/desativadas via Marketplace. O App deve verificar quais plugins estão ativos para exibir ou ocultar menus.

### A. Verificar Plugins Ativos
*   **Endpoint:** `GET /plugins/api/v1/plugins/installed`
*   **Headers:** `Authorization: Bearer <token>`
*   **Response (200 OK):**
    ```json
    {
      "active": ["helpdesk", "crm", "campaigns"],
      "installed": [...]
    }
    ```
> [!IMPORTANT]
> **Regra de UI:** Se o array `active` **não** contiver a string `"helpdesk"`, o menu/aba de "Helpdesk" deve ficar **totalmente invisível** no App.

---

## 6. Módulo Helpdesk (Suporte) 🎫
Este módulo permite a gestão de tickets de suporte (Protocolos) com SLA e categorização ITIL.
*(Requer plugin `helpdesk` ativo)*

### A. Listar Protocolos
*   **Endpoint:** `GET /protocols`
*   **Query Params:**
    *   `searchParam`: Busca por ID ou título.
    *   `status`: `open`, `closed`, etc.
    *   `priority`: `low`, `medium`, `high`, `urgent`.
    *   `pageNumber`: Paginação.

### B. Criar Protocolo
*   **Endpoint:** `POST /protocols`
*   **Body:**
    ```json
    {
      "title": "Problema na Impressora",
      "description": "A impressora parou de funcionar",
      "priority": "high",
      "status": "open",
      "category": "Hardware",
      "contactId": 123
    }
    ```

### C. Detalhes do Protocolo
*   **Endpoint:** `GET /protocols/{protocolId}`
*   **Response:** Retorna objeto completo incluindo histórico (`histories`) e anexos.

---

## 7. Estrutura e Interface do Chat (Chat Window) 📱

Esta seção detalha os componentes visuais e funcionais da tela de conversa principal do WatinkApp.

### 7.1 Header (Barra Superior)
O cabeçalho do chat deve apresentar informações claras para contexto imediato do atendente.

*   **Avatar do Contato:** Círculo com a foto (`contact.profilePicUrl`). Se vazio, usar placeholder.
*   **Nome do Contato:** Nome principal em destaque.
*   **Número do Ticket:** Exibir o ID do ticket (Ex: `#1234`) de forma discreta, geralmente ao lado do nome ou abaixo.
*   **Status de Presença:** Se possível, indicar status (embora o WhatsApp não forneça 'digitando' real-time via API oficial em todos os casos, manter o design preparado).

### 7.2 Drawer (Menu Lateral)
Ao clicar no header ou ícone de menu, um Drawer lateral deve abrir na direita contendo ações de gestão.

**Itens Obrigatórios no Drawer:**
1.  **Dados do Contato:** Foto ampliada, Nome, Telefone (clicável para ligar), E-mail.
2.  **Toggle "Minha Carteira":** Switch ou Botão para adicionar/remover da carteira (`PUT /contacts/{contactId}` com `walletUserId`).
3.  **Ações de Ticket:**
    *   **Devolver para Fila:** Botão para desatribuir o ticket (retornar para pendente/sem dono).
    *   **Transferir:** Modal para escolher outro Agente ou Fila.
    *   **Encerrar Ticket:** Botão de destaque (Ex: Vermelho ou Accent Color).
4.  **Ações de Helpdesk:**
    *   **Abrir Protocolo:** Botão para iniciar o fluxo de criação de ticket de suporte (Detalhado na seção 8).

### 7.3 Área de Mensagens

#### Envio de Mídia (Clip/Anexo) 📎
Ao clicar no ícone de anexo, exibir opções em Bottom Sheet ou Menu Circular:
*   📷 **Câmera:** Abrir câmera nativa.
*   🖼️ **Galeria:** Selecionar fotos/vídeos.
*   📄 **Documento:** Selecionar arquivos PDF, DOC, etc.
*   🎤 **Áudio:** Gravação com *lock* (arrastar para cima para travar gravação).

> **Envio:** Utilizar endpoint `POST /messages/:ticketId` com Multipart/Form-Data.

#### Ações em Mensagens (Long Press) 👆
Ao pressionar e segurar uma mensagem, exibir menu de contexto:
1.  **Responder (Quote):** Cita a mensagem. UI deve mostrar um preview da mensagem citada acima da barra de input.
2.  **Copiar:** Copia o texto para área de transferência.
3.  **Deletar:** Apenas se `message.fromMe === true` (Utilizar `DELETE /messages/:messageId`).

#### Emojis 🙂
*   Botão dedicado no input de texto que alterna o teclado para um seletor de emojis nativo ou customizado.
*   Suportar envio de emojis padrão do unicode.

---

## 8. Integração Helpdesk no Chat 🎫

### 8.1 Fluxo "Abrir Protocolo"
1.  No Drawer ou Menu de Opções, atendente clica em **"Novo Protocolo"**.
2.  App abre formulário (Modal ou Nova Tela) pedindo:
    *   **Assunto:** Título do problema.
    *   **Descrição:** Detalhes.
    *   **Prioridade:** Baixa, Média, Alta, Urgente.
3.  App envia `POST /contacts/{contactId}/protocols`.

**Payload:**
```json
{
  "subject": "Título do Protocolo",
  "description": "Descrição detalhada do problema",
  "priority": "medium",
  "ticketId": 123
}
```

### 8.2 Feedback Visual (System Message)
Após o sucesso na criação do protocolo (Código 201), o App deve fornecer feedback imediato na conversa.

> **Comportamento Recomendado:**
> O App deve inserir uma mensagem local ("fake") visualmente distinta (ex: fundo cinza, texto centralizado de "System Event") informando:
> *✅ Protocolo #999 criado com sucesso: "Assunto do Protocolo"*
>
> Isso garante que o atendente tenha o registro visual da ação dentro da linha do tempo da conversa.

### 8.3 Adicionar à Carteira (Wallet)
Permite que o atendente "pegue" o contato para sua carteira pessoal.
*   **Endpoint:** `PUT /contacts/{contactId}`
*   **Body:** `{ "walletUserId": 1 }`
*   **Feedback Visual no Chat:** Se o contato pertencer ao usuário logado, exibir ícone de "Mala/Carteira" ativo no Header ou Drawer. Se pertencer a outro, exibir o nome do dono.

---

## 9. Status de Implementação (Changelog)

| Versão | Data       | Mudança                                                                 |
|--------|------------|-------------------------------------------------------------------------|
| 2.1    | 2026-01-24 | Detalhamento UI/UX do Chat (Header, Drawer, Mídia) e Fluxo de Protocolos|
| 2.0    | 2026-01-24 | Documentadas interações de Chat: Wallet, Ticket ID e Abrir Protocolo    |
| 1.9    | 2026-01-24 | Adicionada documentação do módulo de Plugins e Helpdesk                 |
| 1.8    | 2026-01-23 | Endpoints de Branding e Public Settings tornados públicos para mobile   |
| 1.7    | 2026-01-23 | Revisão de URLs de imagem (Branding, Avatar, Mídias) conforme unificação do backend |
| 1.6    | 2026-01-23 | Adicionado detalhamento de notificações (Socket.io vs FCM Push)     |
| 1.5    | 2026-01-23 | Auditada conformidade total com o backend e adicionados endpoints de auth |
| 1.4    | 2026-01-23 | Adicionado detalhamento de isolamento de mídias por Tenant UUID     |
| 1.3    | 2026-01-23 | Detalhamento completo de envio de áudio, mídias e recebimento via Socket |
| 1.2    | 2026-01-23 | Documentado suporte a avatares de contato no BFF de Tickets |
| 1.1    | 2026-01-22 | Adicionado endpoint `/mobile/v1/branding` para logo mobile |
| 1.0    | 2026-01-22 | Documentação inicial completa |
