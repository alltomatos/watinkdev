# Arquitetura SaaS Watink

## Visão Geral
O módulo SaaS do Watink permite a gestão centralizada de múltiplos inquilinos (tenants) através de um painel externo (`painel.watink.com`). A arquitetura é baseada em microsserviços e eventos para garantir desacoplamento e performance.

## Configuração Global
> [!IMPORTANT]
> **Modo Multi-Tenant:** Para que as regras de SaaS (isolamento, limites e status) entrem em vigor, é **obrigatório** definir a variável de ambiente:
> `TENANTS=True`
>
> Caso contrário, o sistema opera em modo **Single Tenant** (comportamento legado), ignorando todos os limites e permitindo acesso irrestrito ao tenant padrão.

## Componentes

### 1. Watink-Guard (Agente de Infraestrutura)
Serviço desenvolvido em **Go** responsável por:
- Receber comandos de provisionamento do Painel SaaS.
- Validar a autenticação via `X-Watink-Master-Key`.
- Persistir ou atualizar os dados do Tenant no banco de dados (PostgreSQL).
- Publicar eventos de alteração no RabbitMQ (`saas.tenant_provisioned`).

**Tecnologias:** Go 1.21, Fiber, Gorm, AMQP.

### 2. Backend Core (Node.js)
O backend principal foi adaptado para reagir às mudanças provisionadas pelo Guard e aplicar as regras de negócio.

#### Modelo de Dados (Tenant)
- `status`: `active` ou `inactive`.
- `plan`: Identificador do plano (ex: `pro`, `enterprise`).
- `externalId`: ID de referência do Painel SaaS.
- `maxUsers`: Limite de usuários permitidos.
- `maxConnections`: Limite de sessões de WhatsApp.

#### Aplicação de Limites (Enforcement)
As regras são aplicadas em tempo real nas operações críticas:

1.  **Login (`AuthUserService`)**:
    - Verifica se o Tenant está `active`.
    - Se `inactive`, o login é rejeitado com erro `ERR_TENANT_INACTIVE` (401).

2.  **Criação de Usuários (`CreateUserService`)**:
    - Verifica se a quantidade atual de usuários do tenant atinge `maxUsers`.
    - Se atingir, bloqueia com erro `ERR_MAX_USERS_REACHED` (403).

3.  **Conexões WhatsApp (`CreateWhatsAppService`)**:
    - Verifica se a quantidade de conexões atinge `maxConnections`.
    - Se atingir, bloqueia com erro `ERR_MAX_CONNECTIONS_REACHED` (403).

#### Sincronização e Suspensão
- **Worker:** Ouve a fila `saas.tenant_provisioned` do RabbitMQ.
- **Limpeza de Cache:** Invalida caches do Redis relacionados ao tenant.
- **Desconexão Forçada:** Se o status mudar para `inactive` ou `suspended`, o worker **desconecta automaticamente** todas as sessões de WhatsApp ativas do tenant, garantindo interrupção imediata do serviço.

#### Relatórios
- O Agente Watink-Guard fornece um endpoint (`GET /manage/v1/usage`) para que o Painel SaaS consulte o consumo atual (usuários e conexões) de cada tenant para fins de cobrança e auditoria.

#### Segurança (RLS - Row Level Security)
- Hooks implementados no Sequelize injetam `SET app.current_tenant` em transações, garantindo isolamento de dados no nível do banco (quando ativado).

## Fluxo de Provisionamento
1. **Painel SaaS** envia `POST` para `Watink-Guard`.
2. **Watink-Guard** valida chave mestre e insere/atualiza registro na tabela `Tenants`.
3. **Watink-Guard** publica evento no RabbitMQ.
4. **Backend Node.js** consome evento, limpa cache e desconecta sessões (se suspenso).
5. Próxima requisição do usuário já reflete os novos limites/status.

## Status Atual (25/01/2026)
- [x] **Agente Go**: Implementado e integrado com Docker.
- [x] **Banco de Dados**: Migrações e Modelos atualizados.
- [x] **Sincronização**: Worker de eventos RabbitMQ ativo.
- [x] **Limites de Negócio**:
    - [x] Bloqueio por Status (Login).
    - [x] Limite de Usuários.
    - [x] Limite de Conexões.
    - [x] Desconexão forçada de sessões.
- [x] **Relatórios**: Endpoint de uso implementado.
- [x] **Configuração**: Flag `TENANTS=True` implementada.
- [ ] **Interface**: O frontend ainda não exibe mensagens amigáveis para os erros de cota (403).
