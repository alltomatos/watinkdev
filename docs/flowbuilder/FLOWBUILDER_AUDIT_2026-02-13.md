# FlowBuilder Audit Técnico — 2026-02-13

## A) Relatório executivo
**Status geral: COM RESSALVAS**

### Resumo
- Arquitetura geral do FlowBuilder está funcional (editor + runtime + simulação + worker/queue), porém havia gaps críticos de coerência entre UI e executor.
- Foram aplicadas correções **críticas/altas** sem breaking changes silenciosas.
- Ainda há lacunas para “100% funcional” em testes E2E reais dependentes de ambiente externo (WhatsApp conectado, banco com dados reais, webhooks externos).

### Riscos principais encontrados
1. **Nó Tag sem execução no runtime** (UI existia, executor não chamava `processTagNode`).
2. **Nó Tag sem mapeamento no renderer do editor** (drag/drop com tipo válido, mas sem nodeType no canvas).
3. **Inconsistência de contratos de trigger** entre formato novo da UI e persistência de `FlowTrigger` (runtime podia não disparar fluxos).
4. **Inconsistência Ticket Node UI x backend** (`ticketAction/newStatus/userId` não refletidos corretamente no update).
5. **Inconsistência Menu Node UI x backend** (`menuTitle` configurado na UI, executor usava `label`).
6. **Alias de tipo inconsistente** (`textUpdater` vs `textupdater`).

---

## B) Matriz por nó (status e gaps)
Legenda: **OK / Parcial / Quebrado**

| Nó | UI Config | Persistência JSON | Simulação | Runtime real | Erro/Retry | Logs | Dependência WA | Status | Evidências/Gaps |
|---|---|---|---|---|---|---|---|---|---|
| input/start | OK | OK | OK | Parcial | Parcial | OK | Não | Parcial | Trigger persistido em formato legado; corrigido mapeamento novo em `FlowService.ts` |
| trigger | OK | OK | OK | Parcial | Parcial | OK | Geralmente sim | Parcial | Match de keyword era exato; melhorado contains case-insensitive em `FlowTriggerService.ts` |
| message/default | OK | OK | OK | OK | Parcial | OK | Sim | Parcial | Sem retry configurável por nó |
| textUpdater/textupdater | Parcial | Parcial | Parcial | Parcial | Parcial | OK | Sim | Parcial | Alias inconsistente; adicionado suporte `textupdater` no executor |
| menu | OK | OK | OK | Parcial | Parcial | OK | Sim | Parcial | UI usa `menuTitle`; runtime usava `label` (corrigido) |
| switch | OK | OK | OK | OK | Parcial | OK | Não | Parcial | Sem branch de erro dedicado |
| output/end | OK | OK | OK | OK | N/A | OK | Não | OK | — |
| pipeline | OK | OK | OK | Parcial | Parcial | OK | Não | Parcial | Depende de dados CRM/deal existentes |
| ticket | OK | OK | Parcial | **Quebrado→Parcial (corrigido)** | Parcial | OK | Não | Parcial | UI enviava `ticketAction/newStatus/userId`; backend ignorava parcialmente (corrigido) |
| webhook | OK | OK | Parcial | Parcial | Parcial | OK | Não | Parcial | Sem política de retry/timeout por nó |
| api | OK | OK | Parcial | Parcial | Parcial | OK | Não | Parcial | Sem timeout/retry/circuit-breaker por nó |
| database | OK | OK | OK | Parcial | Parcial | OK | Não | Parcial | Apenas READ/UPDATE; depende de tabela/whitelist |
| filter | OK | OK | OK | OK | Parcial | OK | Não | Parcial | Sem métricas dedicadas |
| knowledge | OK | OK | OK | Parcial | Parcial | OK | Sim (se responder no ticket) | Parcial | Dependente de VectorService/base vetorial |
| helpdesk | OK | OK | Parcial | Parcial | Parcial | OK | Sim (confirmação) | Parcial | Dependente de plugin/tabela Protocol |
| tag | OK | OK | **Quebrado→Parcial (corrigido)** | **Quebrado→Parcial (corrigido)** | Parcial | OK | Não | Parcial | Não era executado nem renderizado corretamente (corrigido) |

---

## C) Correções realizadas + arquivos

### 1) Tag node renderizável no editor
- **Arquivo:** `frontend/src/pages/FlowBuilder/index.js`
- **Mudança:** import e mapeamento `tag: TagNode` no `nodeTypes`.

### 2) Tag node executável no runtime
- **Arquivo:** `backend/src/services/FlowServices/FlowExecutorService.ts`
- **Mudança:** adicionada case `tag` chamando `processTagNode(...)` + avanço de fluxo.

### 3) Consistência de alias textUpdater/textupdater
- **Arquivo:** `backend/src/services/FlowServices/FlowExecutorService.ts`
- **Mudança:** suporte aos dois aliases no switch e na lógica de `waitForInput`.

### 4) Menu title coerente com UI
- **Arquivo:** `backend/src/services/FlowServices/FlowExecutorService.ts`
- **Mudança:** `sendMenu` agora prioriza `menuTitle` (com fallback para `label`).

### 5) Ticket node coerente com UI
- **Arquivo:** `backend/src/services/FlowServices/FlowExecutorService.ts`
- **Mudança:** mapeamento robusto de `ticketAction` (`moveToQueue`, `assignUser`, `changeStatus`) + compat legado.

### 6) Simulação expandida (ticket/webhook/api/tag)
- **Arquivo:** `backend/src/services/FlowServices/FlowExecutorService.ts`
- **Mudança:** `simulateNode` agora cobre tipos que antes eram tratados como desconhecidos.

### 7) Persistência de trigger alinhada ao formato atual da UI
- **Arquivo:** `backend/src/services/FlowServices/FlowService.ts`
- **Mudança:** novo `buildTriggerFromNodes` para mapear nós `trigger/input/start` (novo e legado), upsert/desativação segura de `FlowTrigger`.

### 8) Matching de trigger por keyword mais realista
- **Arquivo:** `backend/src/services/FlowServices/FlowTriggerService.ts`
- **Mudança:** para `condition.body`, matching `contains` case-insensitive (antes era igualdade estrita).

---

## D) Commits
- **Pendente no branch local no momento deste relatório** (recomendado criar commits pequenos):
  1. `fix(flowbuilder): map tag node in frontend renderer and runtime executor`
  2. `fix(flowbuilder): align trigger contract UI/runtime and improve keyword matching`
  3. `fix(flowbuilder): align ticket/menu node contracts and extend simulation coverage`
  4. `docs(flowbuilder): add technical audit + qa checklist + roadmap`

---

## E) Roadmap “n8n do Watink” (MVP → Robustez → Expansão)

### Fase 1 — MVP seguro (2-4 semanas)
- Delay/Wait node (persistindo wake-up em fila/banco)
- HTTP Request robusto (timeout, retry simples, response mapping)
- Set/Transform node (mapear variáveis sem código)
- Condition avançada (AND/OR groups, tipos numéricos/data)
- Erro por nó básico: `continueOnFail`, saída `error`

### Fase 2 — Robustez de produção (4-8 semanas)
- Try/Catch global por fluxo
- Dead-letter/reprocessamento para falhas de worker
- Observabilidade: trace por execução, métricas por nó, tempo médio
- Versionamento de fluxo + rollback
- Test harness de smoke flow automatizado

### Fase 3 — Expansão (8-16 semanas)
- Loop/ForEach node
- Code node sandboxed (isolamento + limites CPU/memória/tempo)
- Schedule/Cron Trigger
- Conectores externos (CRM, Sheets, ERP, etc.)
- Marketplace de nós/integrations

### Especificação curta (prioritários)
1. **Delay/Wait**: entrada `duration|until`; saída `next`; persiste job de retomada.
2. **HTTP Request robusto**: `method,url,headers,body,timeout,retry`; saída `response,error`.
3. **Condition avançada**: grupos de condições com operadores tipados; saídas `true/false`.
4. **Loop/ForEach**: `inputArray,itemVar,indexVar`; saída por item + done.
5. **Set/Transform**: mapeia variáveis e objetos no contexto.
6. **Code sandboxed**: JS isolado com API restrita e timeout.
7. **Error Handler/Try-Catch**: bloco de tratamento com fallback.
8. **Schedule/Cron Trigger**: gatilho temporal com timezone por tenant.
9. **External Integrations**: outbound webhook/CRM com auth segura.

---

## F) Como testar rapidamente em dev
1. Criar fluxo com `trigger -> message -> output` e ativar.
2. Validar bloqueio de ativação quando houver nós de outbound e sem `whatsappId`.
3. Criar fluxo com `menu` e conferir que `menuTitle` enviado = configurado.
4. Criar fluxo com `ticket` para `changeStatus`, `moveToQueue`, `assignUser`.
5. Criar fluxo com `tag` e validar aplicação/remoção em ticket.
6. Simular fluxo no modal (deve mostrar ticket/webhook/api/tag com mensagens coerentes).
7. Testar trigger keyword (ex.: condição `suporte`) com mensagem contendo a palavra.
8. Testar webhook/api com endpoint de mock (httpbin/mock server).
9. Testar database read/update com filtros NOCODE e outputVariable.
10. Conferir logs de execução no backend (`FlowExecutor` e `FlowRuntime`).

---

## Limitações desta auditoria
- Não foi possível concluir validação E2E completa com WhatsApp real e integrações externas dentro desta execução sem ambiente homologado dedicado.
- Build TypeScript global do backend falha por item pré-existente não relacionado (`Promise.allSettled` alvo de lib em `StartAllWhatsAppsSessions.ts`).
