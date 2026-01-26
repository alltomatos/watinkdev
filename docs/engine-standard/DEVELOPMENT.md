# Guia de Desenvolvimento (Engine)

# Guia de Desenvolvimento (Engine)

> [!WARNING]
> Este serviço deve rodar containerizado no Docker Swarm. **Não execute localmente via npm**, pois depende de RabbitMQ e Redis configurados na rede interna (`watink_network`).

## Ciclo de Desenvolvimento

Para testar alterações no código:

1. Edite os arquivos em `src/`.
2. Execute o script de atualização:
   ```bash
   ./update.sh engine
   ```
   Isso irá recompilar a imagem e atualizar o serviço no Swarm.

## Logs e Debug

Acompanhe o processamento em tempo real:
```bash
docker service logs -f watink_whaileys-engine
```

## Estrutura de Pastas Importantes
- `src/contracts.ts`: Define as interfaces (Types) dos eventos e comandos. Sempre atualize este arquivo ao adicionar novas funcionalidades.
- `src/rabbitmq.ts`: Lógica de conexão com a fila.
- `src/session.ts`: Lógica principal do Baileys.

## Adicionando Novos Comandos
1. Adicione o tipo em `src/contracts.ts`.
2. Adicione o `case` no switch de `handleCommand` em `src/session.ts`.
3. Implemente o método privado correspondente em `SessionManager`.
