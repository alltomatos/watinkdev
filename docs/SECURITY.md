# Segurança e RBAC

O Watink implementa uma arquitetura de segurança baseada em camadas, focando em isolamento de tenants, controle de acesso granular e proteção de infraestrutura.

## 1. Controle de Acesso (RBAC)

O sistema utiliza **Role-Based Access Control** (RBAC) com suporte a granulação fina.

### Entidades
*   **Users**: Usuários finais.
*   **Groups**: Perfis de acesso (ex: Admin, Supervisor, Agente).
*   **Permissions**: Ações atômicas (ex: `ticket:accept`, `user:create`).

### Fluxo de Verificação
1.  **Backend**: Middleware `checkPermission(permissionName)` intercepta requisições.
2.  **Frontend**: Componente `<Can perform="permissionName">` oculta elementos de UI.

### Adicionar Novas Permissões
Ao criar uma nova feature:
1.  Adicione a permissão no Seed do banco de dados (Migration).
2.  Atualize o mapeamento de categorias no Frontend (`GroupModal.js`).

## 2. Autenticação (JWT)

*   **Access Token**: Curta duração (15min). Usado para requisições.
*   **Refresh Token**: Longa duração (7 dias). Usado para renovar o Access Token sem login.
*   **Segredos**: Definidos em `JWT_SECRET` e `JWT_REFRESH_SECRET`. Em produção, use strings aleatórias longas.

## 3. Isolamento Multi-tenant

O sistema é pseudo-multitenant a nível lógico.
*   **Tabela `Tenants`**: Define os clientes.
*   **Isolamento de Dados**: Todas as tabelas críticas possuem `tenantId`.
*   **Escopo Automático**: O Sequelize aplica cláusula `WHERE tenantId = X` automaticamente em quase todas as queries via Scopes, baseado no usuário logado.

## 4. Segurança de Infraestrutura

*   **Redes Internas**: Banco de Dados e Redis **não** expõem portas para a internet. Apenas containers na rede `watink_network` podem acessá-los.
*   **Traefik**: Ponto único de entrada (HTTPS).
*   **Não use Root**: Containers rodam (onde possível) com usuários não-privilegiados.
