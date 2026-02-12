# Auditoria de Services - Watinkdev Backend

## Visão Geral
A implementação do **FORCE RLS** no banco de dados exige que o backend coopere definindo a variável de sessão `app.current_tenant` em cada transação/conexão.

## Estado Atual dos Services (Vazamentos Identificados & Corrigidos)

| Service | Status | Observação |
| :--- | :--- | :--- |
| `ListTicketsService` | ✅ Protegido | Agora usa `effectiveTenantId` do contexto AsyncLocalStorage. |
| `ShowTicketService` | ✅ Protegido | Filtra explicitamente por `tenantId` e usa contexto. |
| `ListUsersService` | ✅ Protegido | Adicionado filtro de `tenantId` obrigatório via contexto. |
| `ListWhatsAppsService` | ✅ Protegido | Adicionado filtro de `tenantId` obrigatório via contexto. |
| `UpdateSettingService` | ✅ Protegido | Agora exige `tenantId` para todas as operações de busca/escrita. |
| `GetDefaultWhatsApp` | ✅ Protegido | Restrito ao `tenantId` da sessão atual. |
| `AuthUserService` | ✅ Protegido | Inicia o contexto `AsyncLocalStorage` no momento do login. |
| `RefreshTokenService` | ✅ Protegido | Inicia o contexto `AsyncLocalStorage` na renovação do token. |
| `WebchatController` | ✅ Protegido | Inicia contexto manual para rotas públicas usando o ID do tenant dono da conexão. |
| `ApiController` | ✅ Protegido | Middleware `isAuthApi` injeta o `tenantId` correto no contexto. |

## Plano de Ação - Próximos Passos

1. **Hooks de Auditoria Global**: Implementar um interceptor central para logs de mutação (quem alterou o quê em qual tenant).
2. **Refatoração de Services de Contatos**: Validar `CreateOrUpdateContactService` para garantir que não ocorra colisão de números entre tenants (LID único deve ser tenant-scoped se possível, ou tratado na lógica).
3. **Teste de Estresse de Isolamento**: Criar script que tenta acessar ID de outro tenant via API e validar o erro 404/403.
