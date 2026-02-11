# Configuração e Setup (Docker Swarm)

> [!IMPORTANT]
> **Ambiente de Execução**: Todo o desenvolvimento e execução do projeto deve ser feito via **Docker Swarm**. Não rode os serviços localmente (fora de containers) via `npm run dev`.

## Pré-requisitos
- **Docker Desktop** (com Swarm ativado: `docker swarm init`)
- **Git**
- **Node.js** (apenas para rodar scripts de automação, não para o runtime da aplicação)

## Instalação e Inicialização

1. **Clone o Repositório**:
   ```bash
   git clone <url-repo>
   cd watinkdev
   ```

2. **Configuração de Variáveis**:
   - Copie `.env.example` para `.env` na raiz do projeto (se existir) ou configure diretamente no `docker-stack.yml` para desenvolvimento.
   - **Nota**: Em produção, utilize *Docker Secrets* ou injete variáveis via env file seguro.

3. **Deploy da Stack (Primeira Vez)**:
   Para subir o ambiente completo (Backend, Frontend, Banco, Filas):
   ```bash
   docker stack deploy -c docker-stack.yml watink
   ```

   Para subir os plugins (Manager, SMTP, Webchat):
   ```bash
   docker stack deploy -c docker-plugin.yml watink-plugins
   ```

## Ciclo de Desenvolvimento

Para aplicar alterações de código, **NÃO** reinicie o container manualmente. Use o script de automação que garante o versionamento e atualização correta da imagem.

### Atualizar um Serviço
```bash
# Sintaxe: ./update.sh <servico> [tipo_versionamento]
./update.sh backend patch    # Atualiza Backend (v1.0.0 -> v1.0.1)
./update.sh frontend minor   # Atualiza Frontend (v1.0.0 -> v1.1.0)
./update.sh engine           # Atualiza Engine Standard
./update.sh plugin-manager   # Atualiza Plugin Manager
```

### O que o script faz?
1. Incrementa a versão no `package.json`.
2. Reconstrói a imagem Docker (`docker build`).
3. Atualiza a tag no `docker-stack.yml` (Fonte da Verdade).
4. Executa `docker stack deploy` para atualizar o serviço no cluster.

## Acesso aos Serviços
- **Frontend**: http://localhost (Porta 80)
- **Backend API**: http://localhost/api (Via Traefik)
- **Traefik Dashboard**: http://localhost:8080/dashboard/ (Login: admin / admin)
- **RabbitMQ**: http://localhost:15673 (Guest / Guest)
- **Swagger**: http://localhost/docs

## Troubleshooting
- **Logs**: `docker service logs -f watink_backend`
- **Reiniciar tudo (Limpeza)**:
  ```bash
  docker stack rm watink
  # Aguarde os containers pararem
  docker stack deploy -c docker-stack.yml watink
  ```
