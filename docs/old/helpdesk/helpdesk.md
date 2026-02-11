# Helpdesk Plugin v2.0.0

O módulo de **Helpdesk** transforma a plataforma Watink em um sistema de suporte profissional (Service Desk) e **Field Service**, permitindo a gestão centralizada de solicitações, incidentes, atendimentos técnicos e **RAT (Relatório de Atendimento Técnico)** através de Protocolos.

## 1. Visão Geral

O plugin de Helpdesk oferece uma camada de gestão acima dos atendimentos do WhatsApp (Tickets), permitindo rastrear demandas de longo prazo, categorizar incidentes e medir SLA, independentemente da sessão de chat estar ativa ou não.

### Principais Recursos
- **Gestão de Protocolos**: Criação, edição e acompanhamento de chamados.
- **Múltiplas Visualizações**: Tabela (Listagem), Kanban e Dashboard.
- **SLA e Prioridade**: Definição de níveis de urgência (Baixa, Média, Alta, Urgente).
- **Integração Nativa**: Vínculo direto com Contatos e Tickets do WhatsApp.
- **Acesso Público**: Link externo para o cliente acompanhar o status do protocolo.
- **Automação**: Criação de protocolos via Chatbot (FlowBuilder).
- **Templates de Atividade**: Modelos de checklist reutilizáveis para padronizar serviços.
- **RAT (Relatório de Atendimento Técnico)**: Checklist de vistoria com fotos e assinatura digital.

---

## 2. Arquitetura

O módulo é implementado como um **Plugin**, ativado via Marketplace.

### Entidades Principais

#### Protocol (`Protocol`)
A entidade central que armazena os dados do chamado.
- **Campos Chave**:
  - `protocolNumber`: Número único gerado automaticamente.
  - `subject`: Assunto do chamado.
  - `description`: Descrição detalhada.
  - `status`: Estado atual (Aberto, Em andamento, Resolvido, Fechado).
  - `priority`: Nível de prioridade.
  - `token`: Token único para acesso público.

#### ProtocolHistory (`ProtocolHistory`)
Rastro de auditoria e comentários.
- Registra mudanças de status, prioridade e comentários adicionados pelos agentes.

#### ActivityTemplate (`ActivityTemplates`)
Templates para padronizar serviços (ex: "Instalação Fibra", "Manutenção Preventiva").
- `name`: Nome do template.
- `description`: Descrição do serviço.
- `isActive`: Se o template está ativo.
- `items`: Lista de itens do checklist padrão.

#### ActivityTemplateItem (`ActivityTemplateItems`)
Os itens padrão de um template.
- `templateId`: Referência ao template pai.
- `label`: Pergunta ou descrição do item.
- `inputType`: Tipo de input (ver tabela abaixo).
- `options`: Opções para tipos de múltipla escolha (JSONB).
- `isRequired`: Se é obrigatório.
- `order`: Ordem de exibição.

#### Activity (`Activities`)
A execução real de um serviço vinculada ao protocolo.
- `protocolId`: Protocolo pai.
- `templateId`: Template utilizado (opcional).
- `title`: Título da atividade.
- `status`: pending, in_progress, done, cancelled.
- `userId`: Técnico responsável.
- `clientSignature`: Assinatura do cliente (base64/URL).
- `technicianSignature`: Assinatura do técnico.
- `startedAt` / `finishedAt`: Controle de tempo.

#### ActivityItem (`ActivityItems`)
As respostas/ações da atividade executada.
- `activityId`: Atividade pai.
- `label`: Descrição do item.
- `inputType`: Tipo de input.
- `options`: Opções disponíveis (JSONB).
- `value`: Valor preenchido.
- `isDone`: Se foi concluído.

#### ActivityMaterial (`ActivityMaterials`)
Materiais utilizados durante a execução.
- `activityId`: Atividade pai.
- `materialName`: Nome do material.
- `quantity`: Quantidade utilizada.
- `unit`: Unidade de medida.
- `notes`: Observações.

### Tipos de Input Disponíveis

| Tipo | Descrição | Armazenamento |
|------|-----------|---------------|
| `text` | Resposta curta | Texto livre |
| `textarea` | Parágrafo | Texto longo |
| `radio` | Múltipla escolha (uma opção) | String com valor selecionado |
| `checkbox` | Marcar/Desmarcar simples | Boolean |
| `multiselect` | Caixas de seleção (várias opções) | JSON array de selecionados |
| `select` | Lista suspensa | String com valor selecionado |
| `photo` | Upload de foto | URL da imagem |
| `number` | Número | Valor numérico |
| `date` | Data | Data formatada |

### Relacionamentos
- **Ticket**: Um protocolo pode estar vinculado a um Ticket de WhatsApp.
- **Contact**: O solicitante do protocolo.
- **User**: O agente responsável pelo protocolo.
- **Activity → Protocol**: Uma atividade pertence a um protocolo.
- **ActivityItem → Activity**: Itens pertencem a uma atividade.

---

## 3. Funcionalidades do Frontend

### 3.1. Listagem e Gestão (`/helpdesk`)
Interface principal para os agentes com **3 abas**:

#### Aba Protocolos
- Filtros por Status, Prioridade e Busca textual.
- Visualização em Tabela ou Kanban (`/protocols/kanban`).
- **TV Mode**: Modo de visualização para monitores de parede.

#### Aba Relatórios
- Gráficos para gestão:
  - Protocolos por Status.
  - Protocolos por Prioridade.
  - Protocolos por Categoria.
  - SLA (No prazo vs Atrasado).

#### Aba Templates
- CRUD para gerenciar templates de atividade.
- Interface para adicionar itens dinâmicos com diferentes tipos de input.
- Suporte a múltipla escolha com opções customizáveis.

### 3.2. Detalhes do Protocolo (`ProtocolDetails`)
Ao abrir um protocolo, o agente pode:
- Alterar Status e Prioridade.
- Adicionar comentários internos.
- Anexar arquivos (Imagens, PDF, Docs).
- Visualizar o histórico completo de interações.
- Gerenciar atividades vinculadas (em desenvolvimento).

### 3.3. Gestão de Templates
Modal para criação/edição de templates com:
- Nome e descrição do modelo.
- Lista de itens de checklist com:
  - Tipo de input (dropdown com 9 opções).
  - Opções de resposta (para tipos múltipla escolha).
  - Toggle de obrigatoriedade.

### 3.4. Integrações de Interface
- **Contact Drawer**: Botão "Abrir Protocolo" na gaveta de informações do contato.
- **FlowBuilder**: Nó "Helpdesk" para criar protocolos automaticamente.

---

## 4. API Backend (`/protocols`)

### Rotas de Protocolos

| Método | Endpoint | Permissão | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/protocols` | `helpdesk:read` | Lista protocolos com paginação e filtros. |
| `GET` | `/protocols/kanban` | `helpdesk:read` | Retorna dados formatados para o board Kanban. |
| `GET` | `/protocols/dashboard` | `helpdesk:read` | Retorna estatísticas para os gráficos. |
| `POST` | `/protocols` | `helpdesk:write` | Cria um novo protocolo. |
| `GET` | `/protocols/:id` | `helpdesk:read` | Detalhes de um protocolo específico. |
| `PUT` | `/protocols/:id` | `helpdesk:write` | Atualiza protocolo. |
| `POST` | `/contacts/:id/protocols`| `helpdesk:write` | Criar protocolo a partir de um contato. |

### Rotas de Templates

| Método | Endpoint | Permissão | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/activity-templates` | `helpdesk:read` | Lista todos os templates. |
| `GET` | `/activity-templates/:id` | `helpdesk:read` | Detalhes de um template. |
| `POST` | `/activity-templates` | `helpdesk:write` | Cria novo template. |
| `PUT` | `/activity-templates/:id` | `helpdesk:write` | Atualiza template. |
| `DELETE` | `/activity-templates/:id` | `helpdesk:delete` | Remove template. |

### Rotas de Atividades

| Método | Endpoint | Permissão | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/activities` | `helpdesk:read` | Lista atividades. |
| `GET` | `/activities/:id` | `helpdesk:read` | Detalhes de uma atividade. |
| `POST` | `/activities` | `helpdesk:write` | Cria nova atividade. |
| `PUT` | `/activities/:id` | `helpdesk:write` | Atualiza atividade. |
| `POST` | `/activities/:id/finalize` | `helpdesk:write` | Finaliza atividade (gera RAT). |
| `GET` | `/activities/:id/pdf` | `helpdesk:read` | Gera PDF do RAT. |

### Rotas Públicas
| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/public/protocols/:token` | Visualização do protocolo para o cliente final. |

---

## 5. Permissões (RBAC)

O acesso ao módulo é controlado pelas seguintes permissões:

- **`helpdesk:read`**: Visualizar protocolos, dashboards, templates e relatórios.
- **`helpdesk:write`**: Criar, editar, comentar e movimentar protocolos e atividades.
- **`helpdesk:delete`**: Excluir protocolos e templates (geralmente restrito a admins).

---

## 6. Automação (FlowBuilder)

O nó de Helpdesk no construtor de fluxos permite duas ações principais:

1.  **Create Protocol**:
    - Gera um novo protocolo para o contato atual.
    - Assunto e Descrição podem usar variáveis do fluxo.
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
6.  Acesse a aba **Templates** para criar modelos de checklist.

---

## 8. Histórico de Versões

### v2.0.0 (Atual)
- **RAT (Relatório de Atendimento Técnico)**: Sistema completo de atividades.
- **Templates de Atividade**: Modelos reutilizáveis com checklist.
- **Tipos de Input Avançados**: Suporte a 9 tipos diferentes.
- **Múltipla Escolha**: Radio, checkbox, select com opções customizáveis.
- **Materiais**: Controle de materiais utilizados.
- **Assinatura Digital**: Campos para assinatura cliente/técnico.

### v1.0.0
- Gestão básica de Protocolos.
- Visualização Kanban e Dashboard.
- Integração com FlowBuilder.
- Acesso público via token.
