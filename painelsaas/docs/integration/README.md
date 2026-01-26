# Integração Watink <-> Painel SaaS

O Painel SaaS gerencia múltiplas instâncias do Watink. Para que isso ocorra de forma segura, existe um protocolo de comunicação estabelecido entre o Painel (Controlador) e as Instâncias (Controladas).

## Arquitetura de Integração

O Painel SaaS atua como um gerenciador central. As instâncias do Watink expõem rotas específicas que permitem ao SaaS coletar estatísticas e realizar ações administrativas.

A comunicação é feita via **HTTP/REST** protegida por **JWT**.

## Autenticação (Middleware `isSaasAuth`)

As rotas de integração no backend do Watink são protegidas pelo middleware `isSaasAuth`.

### Protocolo de Segurança

1.  **Segredo Compartilhado**: A instância do Watink possui um segredo JWT (`authConfig.secret`). O Painel SaaS deve possuir esse mesmo segredo (ou um token pré-gerado válido) para se autenticar na instância.
2.  **Formato do Token**: O JWT deve conter um payload com:
    - `id`: Identificador do usuário (geralmente um ID reservado para sistema ou o ID de um superadmin).
    - `profile`: Perfil de acesso (ex: `admin`).
    - `tenantId`: ID do tenant alvo.
3.  **Header**: O token deve ser enviado no header `Authorization`:
    ```text
    Authorization: Bearer <JWT_TOKEN>
    ```

### Implementação no Watink

O middleware `isSaasAuth.ts` no backend do Watink verifica a assinatura do token usando o segredo da instância.

```typescript
// backend/src/middleware/isSaasAuth.ts
const decoded = verify(token, authConfig.secret);
// Se válido, a requisição prossegue.
```

## Endpoints de Integração

As rotas dedicadas ao SaaS estão definidas em `backend/src/routes/saasRoutes.ts`.

### `GET /saas/stats`

Retorna estatísticas vitais da instância para monitoramento no painel.

-   **Autenticação**: Requerida (`isSaasAuth`).
-   **Uso**: O Painel SaaS chama esse endpoint periodicamente para exibir status no dashboard central.

## Configuração Necessária

Para adicionar uma nova instância Watink ao Painel SaaS:

1.  A instância deve estar rodando com a variável `JWT_SECRET` definida.
2.  No Painel SaaS, ao cadastrar a instância, deve-se fornecer a URL da API da instância e o token (ou as credenciais para gerar o token) que corresponda ao `JWT_SECRET` daquela instância.

> **Nota**: É crucial que o `JWT_SECRET` seja forte e mantido em sigilo, pois ele garante acesso administrativo total à instância via API.
