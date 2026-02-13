# Flow Builder

Construtor visual de fluxos de conversa (Chatbots) utilizando nós conectáveis.

## Arquitetura
- **Lib Principal**: `reactflow` (v11+)
- **Estrutura**:
  - **Canvas**: Área de desenho (`ReactFlow`).
  - **Sidebar de Nós** (`NodesSidebar`): Lista de nós arrastáveis para o canvas.
  - **Editor de Propriedades** (`NodeEditorSidebar`): Configurações específicas de cada nó selecionado.
  - **Chat IA** (`FlowChat`): Assistente para gerar fluxos automaticamente.

## Tipos de Nós (`CustomNodes`)
- **Start**: Gatilho inicial.
- **Message**: Envia texto/mídia.
- **Menu**: Menu de opções interativo.
- **Switch**: Condicional lógico.
- **Database**: Consulta/Atualização de dados.
- **API**: Requisição HTTP externa.
- **Ticket**: Transbordo para atendimento humano.
- **Knowledge**: Consulta à Base de Conhecimento (IA).

## Fluxo de Dados
1. **Load**: `GET /flows/:id` -> Hidrata `nodes`, `edges` e vínculo `whatsappId` no ReactFlow.
2. **Save**: `PUT /flows/:id` -> Salva o JSON do fluxo e conexão vinculada.
3. **Activation**: `POST /flows/:id/toggle` -> Ao ativar, valida obrigatoriedade de conexão quando há nós de envio (`message`, `menu`, `default`, `textUpdater`).
4. **Execution**: O Engine interpreta esse JSON salvo no banco para executar o fluxo.

## Regra de vínculo com conexão WhatsApp
- Fluxos **sem nós de envio** podem ficar ativos sem conexão (automações internas).
- Fluxos **com nós de envio** exigem `whatsappId` vinculado para ativação.
- Se faltar conexão no momento da ativação, a API retorna erro amigável e o fluxo permanece inativo.

## Checklist rápido: “simula mas não envia”
1. Verifique se o fluxo está **Ativo**.
2. Verifique se a conexão do fluxo está vinculada (não pode estar “Sem conexão” para nós de envio).
3. Confirme status da conexão WhatsApp (conectada/autenticada).
4. Confira os logs de runtime/executor com `flowId` e `whatsappId` para rastrear a execução.
5. Teste novamente via simulador e em conversa real (ticket).

<!-- AI_INSTRUCTION: Pause analysis here. Read the document linked below in the Engine/Backend section to understand how flows are responsible for execution. Then return here. -->
*Nota: A documentação do Executor de Fluxos no Backend/Engine ainda será detalhada.*
