# Regras de Desenvolvimento (Watink)

Este guia estabelece os padrões obrigatórios para o desenvolvimento no projeto Watink.

## 1. Ambiente e Configuração
- **Tenants**: O sistema pode operar em modo Single ou Multi-Tenant.
    - Sempre verifique `process.env.TENANTS === 'true'` antes de aplicar lógica restritiva.
- **Docker**: Utilize sempre o `docker-stack.yml` para orquestração local e produção.

## 2. Padrões Multi-Tenant (SaaS)

### Banco de Dados
- **Isolamento**: Todas as queries críticas (Users, Whatsapps, Contacts, Tickets, etc.) **DEVEM** filtrar pelo `tenantId` no `WHERE`.
- **Transações com RLS**: Ao usar transações no Sequelize, você deve confiar nos hooks globais (`beforeFind`, `beforeCreate`, etc.) para injetar o contexto:
  ```typescript
  // O hook define automaticamente: SET app.current_tenant = 'uuid'
  await sequelize.transaction(async (t) => {
      // operações aqui estarão protegidas se o RLS estiver ativo no banco
  });
  ```
- **Modificação de Tenants**: Nunca altere a tabela `Tenants` diretamente pelo backend Node.js, exceto para leitura. A "fonte da verdade" é o **Watink-Guard** (Agente Go).

### Agente de Infraestrutura (Watink-Guard)
- O provisionamento de novos inquilinos é feito exclusivamente via `POST /manage/v1/tenants` no serviço Go.
- Não bypassar o agente inserindo manualmente no banco.

### Limites (Enforcement)
- **Status**: Respeite o campo `status` ('active'/'inactive'). Usuários de tenants inativos não devem conseguir logar ou usar a API.
- **Cotas**: Respeite os campos `maxUsers` e `maxConnections`. Valide antes de criar novos recursos.

## 3. Padrões de Código
- **Backend (Node.js)**:
  - Services devem ser funções puras ou Classes com injeção de dependência quando possível.
  - Use `AppError` para erros de negócio.
- **Frontend (React)**:
  - Utilize componentes funcionais e Hooks.
  - Evite lógica de negócio complexa nos componentes; use Context ou Services.

## 4. Segurança
- Nunca commite chaves privadas ou senhas hardcoded.
- Use variáveis de ambiente para segredos (`.env`).
- A comunicação com o Painel SaaS deve ser protegida pela `WATINK_MASTER_KEY`.