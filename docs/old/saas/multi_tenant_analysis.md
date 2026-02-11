# Análise da Implementação Multi-tenant do Watink

## 1. Visão Geral
O Watink utiliza uma arquitetura **Multi-tenant baseada em Discriminação de Coluna** (Column Discriminator). Todos os dados dos tenants residem no mesmo esquema de banco de dados, sendo diferenciados apenas pela coluna `tenantId`.

## 2. Implementação no Banco de Dados

### Estrutura
- **Tabela `Tenants`**: Existe uma tabela central que gerencia os tenants.
- **Coluna `tenantId`**: Presente em praticamente todas as tabelas principais (`Users`, `Contacts`, `Tickets`, `Messages`, etc.).
- **Tipo de Dado**: Identificadores são **UUIDs** (conforme definido na tabela `Tenants`: `DataType.UUID`). O código do backend foi refatorado para tipagem estrita como `string` (UUID), eliminando ambiguidades antigas de `string | number`.

### Segurança (RLS - Row Level Security)
- Foi identificada a migração `20251220132350-enable-rls-policies.ts` que cria políticas de isolamento via RLS no Postgres.
- **Política**: `USING ("tenantId" = current_setting('app.current_tenant', true)::uuid)`
- **Observação Crítica**: Apesar da existência das políticas no banco, **não foi encontrado código na aplicação (Backend Core)** que defina a variável `app.current_tenant` durante a sessão (via Middleware ou Hooks do Sequelize).
    - Isso sugere que o isolamento atual confia primariamente na camada de aplicação (Lógico) e o RLS pode estar inativo se o usuário do banco tiver privilégios de `BYPASS RLS` ou se as políticas não estiverem bloqueando queries nuas.

## 3. Implementação no Backend

### Autenticação e Contexto
- **Middleware `isAuth.ts`**:
    - Intercepta o token JWT.
    - Extrai o `tenantId` do payload.
    - Anexa o `tenantId` ao objeto `req.user`.

### Camada de Serviços (Services)
- O isolamento é feito **manualmente** em cada serviço.
- Padrão observado (Ex: `CreateContactService.ts`):
    1. Recebe `tenantId` como argumento.
    2. Utiliza explicitamente no `where` das queries do Sequelize:
       ```typescript
       where: { number, tenantId }
       ```
    3. Passa o `tenantId` para filas (RabbitMQ) para manter o contexto em processos assíncronos.

### Camada de Controladores (Controllers)
- Extraem o `tenantId` de `req.user`.
- Repassam para os Services.

## 4. Conclusão
O sistema possui uma base sólida para multi-tenancy. A estrutura de dados está correta e a tipagem do `tenantId` foi padronizada para `string` (UUID) em todo o backend, eliminando riscos de type mismatch. A segurança ainda depende da inclusão explícita do `where: { tenantId }` nas queries, o que é mitigado pela disciplina de código, mas a ativação efetiva do RLS seria a camada final de defesa recomendada.
