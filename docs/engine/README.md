# Engine

## Escopo
Documentar engine WhatsApp, consumo/publicação de eventos e resiliência.

## Conteúdos previstos
- Contratos de comandos/eventos
- Gestão de sessão e reconexão
- Estratégia de retry, DLQ e idempotência
- Armazenamento transitório (Redis)

## A definir
- Política única de versionamento dos contratos AMQP
- Tabela oficial de eventos por domínio

## Checklist
- [ ] Routing keys padronizadas
- [ ] Prefetch e limites de concorrência definidos
- [ ] Erros encaminhados para DLQ
- [ ] Observabilidade por sessão/tenant

## Fonte antiga
- `docs/old/engine-standard/`
- `docs/old/engine-papi/`
