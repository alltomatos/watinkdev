# Flow manual no chat + Quick Answers interativas

## 1) Iniciar fluxo manualmente no ticket

No header do ticket (quando aberto), existe o botão **Iniciar Fluxo**.

Fluxo:
1. Clique em **Iniciar Fluxo**.
2. Selecione um fluxo ativo.
3. Clique em **Iniciar**.

Backend endpoint:
- `POST /tickets/:ticketId/flows/:flowId/start`

Regras:
- valida tenant
- fluxo precisa estar ativo
- se o fluxo estiver vinculado a WhatsApp, deve ser o mesmo WhatsApp do ticket
- grava log com `flowId`, `ticketId` e `sessionId`

## 2) Quick Answers com tipos interativos

Quick Answer agora possui:
- `mediaType`: `text | buttons | list | carousel`
- `dataJson` com payload estruturado para os tipos interativos

No CRUD de Quick Answers (tela de Respostas Rápidas):
- escolher **Tipo**
- para tipos interativos, preencher **Payload JSON**

## 3) Slash command `/` no chat

Ao digitar `/`, o picker de respostas rápidas é exibido.

Comportamento por tipo ao selecionar:
- `text`: preenche o input com o texto
- `buttons` / `list` / `carousel`: envia direto no endpoint dedicado

Endpoint de envio:
- `POST /messages/:ticketId/quick-answers/:quickAnswerId`

Fallback:
- tipo inválido cai para envio de texto

Logs de rastreabilidade:
- envio registra `quickAnswerId`, `ticketId` e `type`

## Payloads de exemplo

### buttons (`dataJson`)
```json
{
  "buttons": [
    { "id": "btn_1", "label": "Comprar" },
    { "id": "btn_2", "label": "Falar com atendente" }
  ]
}
```

### list (`dataJson`)
```json
{
  "list": {
    "title": "Menu",
    "buttonText": "Ver opções",
    "sections": [
      {
        "title": "Atendimento",
        "rows": [
          { "id": "opt_1", "title": "Financeiro", "description": "2ª via e boletos" },
          { "id": "opt_2", "title": "Suporte" }
        ]
      }
    ]
  }
}
```

### carousel (`dataJson`)
```json
{
  "cards": [
    {
      "title": "Plano Pro",
      "body": "Mais completo",
      "buttons": [
        { "type": "url", "text": "Assinar", "url": "https://example.com" }
      ]
    }
  ]
}
```
