# Runbooks Operacionais

## Objetivo
Centralizar procedimentos operacionais padronizados para diagnóstico, recuperação e rotina técnica.

## Escopo
- Incidentes comuns.
- Procedimentos de manutenção.
- Rotinas de verificação pós-mudança.

## Estrutura recomendada para cada runbook
1. Contexto
2. Pré-requisitos
3. Passo a passo
4. Critérios de sucesso
5. Rollback
6. Escalonamento

## Runbooks prioritários (a criar)
- Subida e validação de ambiente: **A definir**.
- Falha de conexão com mensageria/engine: **A definir**.
- Falha de filas (RabbitMQ): **A definir**.
- Degradação de banco de dados: **A definir**.
- Erro de autenticação/permissão: **A definir**.

## Checklist prático
- [ ] Existe dono técnico do runbook.
- [ ] Passo a passo testado em ambiente controlado.
- [ ] Critério objetivo de sucesso definido.
- [ ] Procedimento de rollback documentado.
- [ ] Canal e regra de escalonamento descritos.

## Fonte antiga
- `docs/old/engine-standard/TROUBLESHOOTING_WATINK.MD`
- `docs/old/filas/rabbitmq.md`
- `docs/old/backend/SETUP.md`
