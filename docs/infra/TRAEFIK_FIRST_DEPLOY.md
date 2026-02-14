# Deploy Traefik-first (Linux e Windows)

Este fluxo assume **Traefik já existente** no host/cluster e rede pública pronta (default: `traefik-public`).

## Topologia de rede (produção)

- `traefik-public`: apenas `frontend` e `backend`.
- `watink-internal`: `backend`, `whaileys-engine`, `flow-worker`, `postgres`, `redis`, `rabbitmq`.
- Sem exposição pública para `postgres`, `redis`, `rabbitmq` e `engine`.

## Arquivos principais

- `setupwatink.sh` (Linux/macOS)
- `start.bat` (Windows)
- `.env.deploy.example`
- `docker-compose.prod.yml` (compose)
- `docker-stack.yml` (swarm)

## Pré-requisitos

- Docker + Docker Compose plugin
- Rede do Traefik existente (`traefik-public` por padrão)
- DNS apontando:
  - `APP_DOMAIN` -> host/ingress Traefik
  - `API_DOMAIN` -> host/ingress Traefik

## Linux/macOS

```bash
chmod +x setupwatink.sh
./setupwatink.sh           # modo compose
./setupwatink.sh swarm     # modo swarm
```

## Windows (PowerShell/CMD)

```bat
start.bat
start.bat swarm
```

## Variáveis obrigatórias

- `APP_DOMAIN` (ex.: `app.seudominio.com`)
- `API_DOMAIN` (ex.: `api.seudominio.com`)

Os scripts atualizam/criam `.env.deploy` automaticamente e mantêm compatibilidade (`DOMAIN_FRONTEND` e `DOMAIN_BACKEND`).

## Build local opcional

Para build local antes do deploy:

### Linux/macOS
```bash
BUILD_LOCAL=1 ./setupwatink.sh
BUILD_LOCAL=1 ./setupwatink.sh swarm
```

### Windows
```bat
set BUILD_LOCAL=1
start.bat
```

## Validação rápida

```bash
docker compose --env-file .env.deploy -f docker-compose.prod.yml config
```

No Swarm:

```bash
docker stack config -c docker-stack.yml
```
