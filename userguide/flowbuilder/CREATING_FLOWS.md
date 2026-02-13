# 🤖 Criando Fluxos (Flow Builder)

O **Flow Builder** permite montar automações conversacionais com blocos visuais.

## Blocos suportados atualmente
- Gatilho/Início: `trigger`, `input`
- Conversa: `message`, `menu`
- Lógica: `switch`, `filter`
- Dados/Integrações: `database`, `api`, `webhook`, `knowledge`
- Operação: `ticket`, `pipeline`, `tag`, `helpdesk`
- Finalização: `output`

## Fluxo mínimo recomendado
1. Crie um fluxo em **Flow Builder**.
2. Adicione: `trigger` → `message` → `output`.
3. Configure o conteúdo do nó `message`.
4. Salve.
5. Se houver nós de envio (`message/menu`), vincule uma conexão WhatsApp antes de ativar.
6. Teste em **Simular** antes de ativar em produção.

## Boas práticas
- Sempre defina um caminho de saída/finalização.
- Em `switch`, mantenha condições objetivas e testáveis.
- Em `database`/`api`/`webhook`, nomeie variáveis de saída de forma clara.
- Evite publicar sem smoke test em ambiente real.

## Troubleshooting rápido
- **Não ativa fluxo:** verifique vínculo de conexão WhatsApp quando houver envio de mensagens.
- **Trigger não dispara:** revise tipo/condição do gatilho e se o fluxo está ativo.
- **Menu não segue caminho:** valide `sourceHandle` nas conexões de opções.
- **Dados não chegam no webhook/API:** valide JSON de headers/body e placeholders `{{variavel}}`.
