# Especificações da API Mobile - WatinkApp
Este documento detalha os endpoints do Backend, incluindo a Camada BFF (Backend for Frontend) exclusiva para dispositivos móveis (`/mobile/v1`).

## 1. Autenticação & Sessão
Utilizar a rota padrão `/auth` para login inicial, mas utilizar as rotas `/mobile/v1` para operações de dados otimizadas.

*   **Login**: `POST /auth/login` (Standard)
*   **Refresh**: `POST /auth/refresh_token` (Standard)

## 2. API Mobile V1 (BFF) - Otimizada 🚀
As rotas abaixo são exclusivas para o App Android Nativo. Elas retornam JSONs reduzidos para economizar bateria e dados.

### A. Listar Tickets (Leve)
Retorna apenas o necessário para montar a lista de conversas.

*   **Endpoint:** `GET /mobile/v1/tickets`
*   **Headers:** `Authorization: Bearer <token>`
*   **Query Params:** Mesmos filtros da API padrão (`pageNumber`, `status`, `searchParam`, `queueIds`).
*   **Response (200 OK):**
    ```json
    {
      "tickets": [
        {
          "id": 123,
          "uuid": "uuid-string",
          "contactName": "Maria Silva",
          "contactProfilePic": "https://...",
          "lastMessage": "Olá, tudo bem?",
          "unreadCount": 2,
          "queueId": 1,
          "status": "open",
          "updatedAt": "2023-10-27T14:00:00.000Z"
        }
      ],
      "count": 50,
      "hasMore": true
    }
    ```

### B. Registrar Dispositivo (FCM Push)
Registra o token do Firebase Cloud Messaging para receber notificações push.

*   **Endpoint:** `POST /mobile/v1/device-token`
*   **Headers:** `Authorization: Bearer <token>`
*   **Body:**
    ```json
    {
      "token": "fcm_device_token_string_here",
      "platform": "android"
    }
    ```
*   **Response (200 OK):**
    ```json
    { "message": "Device token saved" }
    ```

## 3. Mensagens & Chat (Standard)
Para o detalhe da conversa, continue usando os endpoints padrão, pois o payload completo é necessário para renderizar o chat.

*   **Listar Mensagens:** `GET /messages/{ticketId}`
*   **Enviar Mensagem:** `POST /messages/{ticketId}`
*   **Mídia:** `POST /messages/{ticketId}` (Multipart)

## 4. Real-time (Socket.io)
O App deve se conectar ao Socket.io para receber mensagens em tempo real enquanto estiver aberto (Foreground).
Para Background (App fechado), confiar no FCM Push Notification configurado na seção 2.B.

---

## 5. Status de Implementação (Changelog)

### ✅ Concluído
*   [x] **BFF Tickets**: Implementado em `MobileTicketController` (JSON Flattening).
*   [x] **FCM Infra**: Tabela `DeviceTokens` criada no banco.
*   [x] **Registro de Token**: Endpoint `/mobile/v1/device-token` ativo.
*   [x] **Stub de Envio**: Serviço `SendPushNotification` preparado para conexão com Firebase Admin.

### 🚧 Pendente (Configuração)
*   [ ] **Credenciais Firebase**: Adicionar `serviceAccountKey.json` no backend e inicializar `admin.initializeApp()`.
