# Helpdesk Plugin

O módulo de **Helpdesk** transforma a plataforma Watink em um sistema de suporte profissional (Service Desk), permitindo a gestão centralizada de solicitações, incidentes e atendimentos através de Protocolos.

## 1. Visão Geral

O plugin de Helpdesk oferece uma camada de gestão acima dos atendimentos do WhatsApp (Tickets), permitindo rastrear demandas de longo prazo, categorizar incidentes e medir SLA, independentemente da sessão de chat estar ativa ou não.

### Principais Recursos
- **Gestão de Protocolos**: Criação, edição e acompanhamento de chamados.
- **Múltiplas Visualizações**: Tabela (Listagem), Kanban e Dashboard.
- **SLA e Prioridade**: Definição de níveis de urgência (Baixa, Média, Alta, Urgente).
- **Integração Nativa**: Vínculo direto com Contatos e Tickets do WhatsApp.
- **Acesso Público**: Link externo para o cliente acompanhar o status do protocolo.
- **Automação**: Criação de protocolos via Chatbot (FlowBuilder).

---

## 2. Arquitetura

O módulo é implementado como um **Plugin**, ativado via Marketplace.

### Entidades Principais

#### Protocol (`Protocol`)
A entidade central que armazena os dados do chamado.
- **Campos Chave**:
  - `protocolNumber`: Número único gerado automaticamente (ex: `202601280001...`).
  - `subject`: Assunto do chamado.
  - `description`: Descrição detalhada.
  - `status`: Estado atual (Aberto, Em andamento, Resolvido, Fechado).
  - `priority`: Nível de prioridade.
  - `token`: Token único para acesso público.

#### ProtocolHistory (`ProtocolHistory`)
Rastro de auditoria e comentários.
- Registra mudanças de status, prioridade e comentários adicionados pelos agentes.

#### Relacionamentos
- **Ticket**: Um protocolo pode estar vinculado a um Ticket de WhatsApp.
- **Contact**: O solicitante do protocolo.
- **User**: O agente responsável pelo protocolo.

---

## 3. Funcionalidades do Frontend

### 3.1. Listagem e Gestão (`/helpdesk`)
Interface principal para os agentes.
- Filtros por Status, Prioridade e Busca textual.
- Visualização em Tabela ou Kanban (`/protocols/kanban`).
- **TV Mode**: Modo de visualização para monitores de parede, focado em SLA e fila.

### 3.2. Detalhes do Protocolo (`ProtocolDetails`)
Ao abrir um protocolo, o agente pode:
- Alterar Status e Prioridade.
- Adicionar comentários internos.
- Anexar arquivos (Imagens, PDF, Docs).
- Visualizar o histórico completo de interações.

### 3.3. Dashboard (`HelpdeskReports`)
Gráficos para gestão:
- Protocolos por Status.
- Protocolos por Prioridade.
- Protocolos por Categoria.
- SLA (No prazo vs Atrasado).

### 3.4. Integrações de Interface
- **Contact Drawer**: Botão "Abrir Protocolo" diretamente na gaveta de informações do contato durante o atendimento.
- **FlowBuilder**: Nó "Helpdesk" que permite criar protocolos automaticamente ou consultar status dentro do fluxo de conversa.

---

## 4. API Backend (`/protocols`)

### Rotas Principais

| Método | Endpoint | Permissão | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/protocols` | `helpdesk:read` | Lista protocolos com paginação e filtros. |
| `GET` | `/protocols/kanban` | `helpdesk:read` | Retorna dados formatados para o board Kanban. |
| `GET` | `/protocols/dashboard` | `helpdesk:read` | Retorna estatísticas para os gráficos. |
| `POST` | `/protocols` | `helpdesk:write` | Cria um novo protocolo. |
| `GET` | `/protocols/:id` | `helpdesk:read` | Detalhes de um protocolo específico. |
| `PUT` | `/protocols/:id` | `helpdesk:write` | Atualiza protocolo (status, prioridade, comentários). |
| `POST` | `/contacts/:id/protocols`| `helpdesk:write` | Atalho para criar protocolo a partir de um contato. |

### Rotas Públicas
| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/public/protocols/:token` | Visualização do protocolo para o cliente final (sem autenticação). |

---

## 5. Permissões (RBAC)

O acesso ao módulo é controlado pelas seguintes permissões:

- **`helpdesk:read`**: Visualizar protocolos, dashboards e relatórios.
- **`helpdesk:write`**: Criar, editar, comentar e movimentar protocolos.
- **`helpdesk:delete`**: Excluir protocolos (geralmente restrito a admins).

---

## 6. Automação (FlowBuilder)

O nó de Helpdesk no construtor de fluxos permite duas ações principais:

1.  **Create Protocol**:
    - Gera um novo protocolo para o contato atual.
    - Assunto e Descrição podem usar variáveis do fluxo (ex: `{{lastInput}}`).
    - Retorna o número do protocolo para o usuário no chat.

2.  **Check Status**:
    - Consulta protocolos abertos do contato.
    - Informa o status atual.

---

## 7. Instalação e Configuração

1.  Acesse o menu **Marketplace**.
2.  Localize o plugin **Helpdesk**.
3.  Clique em **Ativar**.
4.  Após a ativação, o menu "Helpdesk" aparecerá na barra lateral.
5.  (Opcional) Configure categorias e SLA em **Configurações > Helpdesk**.
