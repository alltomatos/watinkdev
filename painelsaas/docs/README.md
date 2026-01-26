# Documentação do Painel SaaS

Bem-vindo à documentação oficial do **Painel SaaS Watink**. Este diretório contém todas as informações técnicas necessárias para o desenvolvimento, manutenção e operação do painel.

## Estrutura da Documentação

A documentação está dividida por responsabilidades para facilitar a navegação:

- **[Backend](./backend/README.md)**: Guia completo sobre a API, banco de dados, autenticação e arquitetura do servidor (Go/Fiber).
- **[Frontend](./frontend/README.md)**: Guia sobre a interface do usuário, componentes, rotas e estilização (React/Vite).
- **[Integração](./integration/README.md)**: Protocolo de comunicação entre o Painel SaaS e as instâncias Watink.

## Visão Geral do Projeto

O **Painel SaaS** é a central de gerenciamento multi-tenant da plataforma Watink. Ele é responsável por:
- Gerenciamento de Instâncias (Tenants).
- Gestão de Planos e Assinaturas.
- Autenticação Centralizada.
- Monitoramento de Uso.

## Como Iniciar

Para rodar o projeto completo localmente, geralmente utilizamos o Docker Compose na raiz do repositório principal:

```bash
docker-compose up -d
```

Consulte as documentações específicas de [Backend](./backend/README.md) e [Frontend](./frontend/README.md) para rodar cada serviço individualmente em modo de desenvolvimento.
