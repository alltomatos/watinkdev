# Backend

## Escopo
Padrões de implementação e operação do backend (Node/Express/Sequelize).

## Conteúdos previstos
- Padrão de camadas (routes/controllers/services)
- Regras de multitenancy por query/transação
- Padrões de erro/log
- Jobs/consumidores e integração com filas

## A definir
- Política oficial de transações por caso de uso
- Catálogo de serviços críticos e SLAs internos

## Checklist
- [ ] Toda query sensível contém tenant-context
- [ ] Rotas críticas com validação/rate-limit
- [ ] Logs sem dados sensíveis
- [ ] Serviços críticos com testes de integração

## Fonte antiga
- `docs/old/backend/`
