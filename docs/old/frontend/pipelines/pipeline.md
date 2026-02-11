# Pipeline Module (Frontend)

Documentação técnica do módulo de Pipelines (CRM) no frontend.

## 1. Visão Geral
O módulo de Pipelines permite a gestão visual de oportunidades de negócio (Deals) através de quadros Kanban ou Funis de Vendas. Suporta múltiplos pipelines, arrastar e soltar (drag & drop), filtros por tags e modos de visualização diferenciados (Standard vs Enterprise).

### Rotas Principais
- `/pipelines`: Listagem de todos os pipelines disponíveis.
- `/pipelines/:pipelineId`: Visualização do quadro (Board) de um pipeline específico.
- `/pipelines/new`: Wizard para criação de novo pipeline.
- `/pipelines/:id/edit`: Edição de configurações do pipeline.

---

## 2. Arquitetura de Componentes

### Hierarquia
```mermaid
graph TD
    A[index.js (Pipelines)] -->|Seleciona Pipeline| B[PipelineBoard.js]
    B -->|Fetch Data & State| C{Tipo de Pipeline?}
    C -->|Kanban| D[PipelineKanban.js]
    C -->|Funnel/Enterprise| E[PipelineFunnelView.js]
    B -->|Filtros| F[TicketsTagFilter]
    D -->|Drag & Drop| G[react-beautiful-dnd]
```

### Componentes Chave

#### `index.js` (Página de Listagem)
- **Responsabilidade**: Listar pipelines, permitir importação (JSON) e navegação para criação/edição.
- **Features**:
  - Cards com indicador de tipo (Kanban/Funil).
  - Botão de Importação (`POST /pipelines/import`).

#### `PipelineBoard.js` (Container Principal)
- **Responsabilidade**: Gerenciador de estado e lógica de negócios do quadro.
- **Estado**:
  - `pipeline`: Dados do pipeline (nome, estágios).
  - `deals`: Lista plana de negócios.
  - `columns`: Mapa de `stageId` -> Lista de Deals (calculado no fetch).
  - `selectedTags`: Filtro de tags.
- **Lógica**:
  - **Data Fetching**: Carrega pipeline e deals em paralelo (ou sequencial). Agrupa deals por estágio.
  - **Drag & Drop (`handleDragEnd`)**:
    1. Atualiza estado local (Optimistic UI).
    2. Envia requisição `PUT /deals/:draggableId` com `stageId`.
    3. Reverte em caso de erro.
  - **Exportação**: Gera e baixa JSON via `GET /pipelines/export/:id`.

#### `PipelineKanban.js` (Visualização)
- **Responsabilidade**: Renderizar colunas e cartões usando `react-beautiful-dnd`.
- **Modos**:
  - **Standard**: Cabeçalhos coloridos (`stageColors`), visual limpo.
  - **Enterprise** (`isEnterprise=true`):
    - Cabeçalhos brancos com borda superior colorida.
    - **KPIs**: Total monetário por coluna (`calculateTotal`).
    - **Alerta de Estagnação**: Borda vermelha (`stagnantCard`) se o deal não for atualizado há mais de 7 dias (`date-fns/differenceInDays`).
    - Badges de valor no cartão.

---

## 3. Integração com API

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/pipelines` | Lista todos os pipelines. |
| `GET` | `/deals` | Lista deals (params: `pipelineId`, `tags`). |
| `PUT` | `/deals/:id` | Atualiza estágio do deal (movimentação). |
| `POST` | `/pipelines/import` | Importa estrutura de pipeline via JSON. |
| `GET` | `/pipelines/export/:id` | Exporta pipeline e deals para JSON. |

---

## 4. Detalhes de Implementação

### Gestão de Estado (Deals)
Os deals são buscados como uma lista plana e transformados em um objeto `columns` mapeado por ID do estágio para facilitar o render do Kanban:
```javascript
// Transformação no PipelineBoard
const stageMap = {};
selectedPipeline.stages.forEach(stage => {
    stageMap[stage.id] = {
        ...stage,
        items: dealData.deals.filter(d => d.stageId === stage.id)
    };
});
```

### Drag & Drop
Utiliza a biblioteca `react-beautiful-dnd`.
- **Droppable**: Cada coluna (estágio) é uma área droppable.
- **Draggable**: Cada cartão de negócio.
- **Movimentação**: Detecta mudança de `droppableId` (estágio) e índice.

### Estilização
- Uso intensivo de `Material-UI` (`@material-ui/core`).
- Cores de estágios definidas em array fixo `stageColors` (cíclico).
- Classes CSS condicionais para modo Enterprise (ex: `columnEnterprise`, `badgeEnterprise`).

### Dependências Principais
- `react-beautiful-dnd`: Interação de arrastar.
- `date-fns`: Cálculos de data (estagnação).
- `react-router-dom`: Navegação.
- `react-toastify`: Feedback de usuário.
