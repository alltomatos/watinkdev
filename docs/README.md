# Documentação Watink (Nova Base)

Bem-vindo à nova estrutura de documentação do Watink.

## Objetivo
Organizar a documentação por domínio, com linguagem clara, foco operacional e evolução contínua.

## Ordem oficial de leitura (onboarding técnico)
1. `docs/architecture/README.md`
2. `docs/infra/README.md`
3. `docs/security/README.md`
4. `docs/backend/README.md`
5. `docs/engine/README.md`
6. `docs/frontend/README.md`
7. `docs/api/README.md`
8. `docs/runbooks/README.md`
9. `docs/glossario.md`
10. `docs/roadmap/README.md`

## Estrutura
- `architecture/` — arquitetura sistêmica e decisões técnicas
- `backend/` — padrões, módulos e fluxos do backend
- `frontend/` — padrões de UI, estado e integrações
- `engine/` — engine WhatsApp e contratos de eventos/comandos
- `infra/` — deploy, ambientes, CI/CD, observabilidade
- `security/` — hardening, segredos, políticas de segurança
- `runbooks/` — operação, incidentes, recuperação
- `api/` — contratos HTTP/WS/AMQP
- `roadmap/` — evolução técnica priorizada
- `old/` — documentação anterior (arquivo histórico)

## Convenções rápidas
- Idioma: Português do Brasil
- Sem conteúdo especulativo: quando faltar detalhe, use **A definir**
- Toda alteração relevante de código deve atualizar docs no mesmo PR

## Fonte antiga
- Base histórica preservada em `docs/old/`
