# QA Checklist Funcional — FlowBuilder

1. Criar fluxo vazio e salvar sem erro.
2. Inserir nós `trigger/input`, `message`, `output` e conectar corretamente.
3. Garantir persistência de nodes/edges após reload da página.
4. Validar autosave após alterar conteúdo de nó.
5. Ativar fluxo com nó outbound sem WhatsApp vinculado -> deve bloquear.
6. Ativar fluxo outbound com WhatsApp vinculado -> deve permitir.
7. Nó `message` texto com variáveis (`{{contactName}}`) -> render esperado no runtime.
8. Nó `message` mídia sem URL -> log de warning sem crash.
9. Nó `menu` com <=3 opções -> modo botões.
10. Nó `menu` com >3 opções -> modo lista.
11. Nó `switch` com condição verdadeira -> sai por handle A.
12. Nó `switch` falsa -> sai por handle B.
13. Nó `ticket` moveToQueue altera queueId.
14. Nó `ticket` assignUser altera userId.
15. Nó `ticket` changeStatus altera status (open/pending/closed).
16. Nó `database` READ com filtros e outputVariable persiste no contexto.
17. Nó `database` UPDATE sem filtro deve ser bloqueado.
18. Nó `filter` filtra array de entrada e grava variável de saída.
19. Nó `api` grava `resultVariable` em sucesso e erro.
20. Nó `webhook` envia payload com campos selecionados (contact/ticket/pipeline/context).
21. Nó `tag` add/remove executa ação no ticket.
22. Nó `knowledge` responde fallback quando não encontra chunks.
23. Nó `helpdesk` createProtocol cria protocolo e salva contexto.
24. Simulação de fluxo deve registrar passos sem loop infinito.
25. Runtime com sessão ativa deve continuar pelo `next()` ao receber nova mensagem.
