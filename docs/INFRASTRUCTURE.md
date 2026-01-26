# Infraestrutura e Operação (Docker Swarm)

Este documento descreve a infraestrutura de infraestrutura do Watink, focada exclusivamente em **Docker Swarm**.

## Topologia de Rede (Overlay)

O sistema utiliza redes do tipo `overlay` para permitir a comunicação entre containers distribuídos em diferentes nós do Swarm.

*   **`watink_proxy`**: Rede pública. Conecta o `Traefik` aos serviços que precisam ser expostos (Frontend, Backend API, Plugin Manager).
*   **`watink_network`**: Rede privada. Conecta serviços internos (Backend, Postgres, Redis, RabbitMQ, Engines). Isalada da internet pública.

## Gerenciamento de Stacks

### Stack Principal (`watink`)
Definida em `docker-stack.yml`. Contém os serviços core:
*   `traefik`: Reverse Proxy e SSL Termination.
*   `backend`: API e Orquestrador.
*   `frontend`: Aplicação React.
*   `whaileys-engine`: Worker de conexão WhatsApp.
*   `watink_postgres`: Persistência de dados.
*   `rabbitmq`: Message Broker.
*   `redis`: Cache e Sessão.

### Stack de Plugins (`watink-plugins`)
Definida em `docker-plugin.yml`. Contém extensões modulares:
*   `plugin-manager`: Gestão de marketplace.
*   `plugin-smtp`: Envio de emails.
*   `engine-webchat`: Canal de Webchat.

## Comandos Operacionais

### 1. Monitoramento de Serviços
Verificar status de réplicas e versões:
```bash
docker service ls
```

Ver logs em tempo real:
```bash
# Logs do Backend
docker service logs -f watink_backend

# Logs do Engine
docker service logs -f watink_whaileys-engine --tail 100
```

### 2. Deploy e Atualização
Utilize sempre os scripts de automação na raiz do projeto:

*   **`./deploy_hub.sh <service>`**:
    1.  Cria build da imagem.
    2.  Envia para o Docker Hub (Tag `latest` e versão SemVer).

*   **`./update.sh <service> [patch|minor|major]`**:
    1.  Atualiza versão no `package.json`.
    2.  Build da imagem local.
    3.  Atualiza `docker-stack.yml` com a nova tag.
    4.  Executa `docker stack deploy` para atualizar o cluster.

### 3. Troubleshooting

**Serviço travado em estado `Pending`?**
*   Verifique se há recursos disponíveis (CPU/RAM) no nó.
*   Verifique constraints de placement (`node.role == manager`).

**Banco de Dados Corrompido/Reset?**
> ⚠️ **CUIDADO**: Isso apaga todos os dados.
```bash
docker stack rm watink
docker volume rm watink_db_data
docker stack deploy -c docker-stack.yml watink
```
