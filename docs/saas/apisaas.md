# API SaaS (Watink-Guard)

Esta API é provida pelo serviço `watink-guard` e serve para orquestração de tenants.

**Base URL**: `http://<guard-host>:8081`

## Autenticação
Todas as requisições devem incluir o header:
`X-Watink-Master-Key: <sua-chave-secreta>`

## Endpoints

### Obter Uso e Consumo

Retorna a contagem atual de usuários e conexões WhatsApp para todos os tenants. Útil para auditoria e conferência.

- **URL**: `/manage/v1/usage`
- **Método**: `GET`
- **Auth Obrigatória**: Sim

#### Resposta de Sucesso (200 OK)

```json
[
  {
    "externalId": "cust_123456789",
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "userCount": 5,
    "connectionCount": 2
  },
  {
    "externalId": "cust_987654321",
    "tenantId": "123e4567-e89b-12d3-a456-426614174000",
    "userCount": 1,
    "connectionCount": 0
  }
]
```

### Provisionar Tenant

Cria um novo tenant ou atualiza um existente (Upsert baseado no `externalId`).

- **URL**: `/manage/v1/tenants`
- **Método**: `POST`
- **Auth Obrigatória**: Sim

#### Corpo da Requisição (JSON)

| Campo            | Tipo   | Obrigatório | Descrição                                      |
| ---------------- | ------ | ----------- | ---------------------------------------------- |
| `name`           | string | Sim         | Nome da empresa/tenant.                        |
| `externalId`     | string | Sim         | ID único do tenant no painel SaaS externo.     |
| `plan`           | string | Não         | Nome do plano (ex: `free`, `pro`).             |
| `status`         | string | Não         | Status do tenant (`active` ou `inactive`).     |
| `maxUsers`       | int    | Não         | Limite máximo de usuários (Padrão: 1).         |
| `maxConnections` | int    | Não         | Limite máximo de conexões WhatsApp (Padrão: 1).|

**Exemplo de Payload:**
```json
{
  "name": "Empresa Exemplo Ltda",
  "externalId": "cust_123456789",
  "plan": "premium",
  "status": "active",
  "maxUsers": 10,
  "maxConnections": 5
}
```

#### Resposta de Sucesso (200 OK)

```json
{
  "message": "Tenant provisioned successfully",
  "tenant": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Empresa Exemplo Ltda",
    "externalId": "cust_123456789",
    "plan": "premium",
    "status": "active",
    "maxUsers": 10,
    "maxConnections": 5,
    "createdAt": "2025-12-21T10:00:00Z",
    "updatedAt": "2025-12-21T10:00:00Z"
  }
}
```

#### Erros Comuns

- **401 Unauthorized**: Header `X-Watink-Master-Key` inválido ou ausente.
- **400 Bad Request**: Payload inválido ou `externalId` faltando.
- **500 Internal Server Error**: Falha no banco de dados.
