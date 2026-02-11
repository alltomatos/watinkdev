# API

## Objetivo
Organizar a documentação dos contratos de API, padrões de requisição/resposta e regras de versionamento.

## Escopo
- Endpoints do backend.
- APIs auxiliares (mobile/saas/plugins quando aplicável).
- Padrões de autenticação, paginação e tratamento de erros.

## Estado atual (observável no repositório)
- Rotas backend em `backend/src/routes`.
- Controllers correspondentes em `backend/src/controllers`.
- Documento de referência unificado para todos os domínios: **A definir**.

## Itens a formalizar
- Política de versionamento de API: **A definir**.
- Catálogo oficial por domínio (tickets, contatos, filas etc.): **A definir**.
- Política de depreciação de endpoints: **A definir**.

## Checklist prático
- [ ] Endpoints agrupados por domínio.
- [ ] Requisitos de autenticação por endpoint descritos.
- [ ] Exemplos mínimos de request/response definidos.
- [ ] Códigos de erro e mensagens padronizados.
- [ ] Mudanças incompatíveis destacadas.

## Fonte antiga
- `docs/old/backend/API.md`
- `docs/old/backend/chat/API.md`
- `docs/old/mobile/apimobile.md`
- `docs/old/mobile/apimobile-v2.md`
- `docs/old/saas/apisaas.md`
