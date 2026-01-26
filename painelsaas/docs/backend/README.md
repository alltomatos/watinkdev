# Painel SaaS - Documentação do Backend

O backend do Painel SaaS é construído em **Go (Golang)** utilizando o framework **Fiber**. Ele serve como a API central para gerenciamento de tenants e assinaturas.

## 🛠 Tech Stack

- **Linguagem**: Go 1.24.5
- **Framework Web**: [Fiber v2](https://gofiber.io/)
- **Banco de Dados**: PostgreSQL (Driver `pgx`)
- **Autenticação**: JWT (JSON Web Tokens)
- **Criptografia**: AES-256-GCM (Custom Vault)

## 📂 Estrutura do Projeto

```text
backend/
├── crypto/      # Utilitários de criptografia (Vault)
├── database/    # Conexão e migrações do banco de dados
├── handlers/    # Controladores das rotas (Lógica de API)
├── middleware/  # Middlewares (Auth, Logger, Recovery)
├── pkg/         # Pacotes utilitários gerais
├── main.go      # Ponto de entrada da aplicação
└── go.mod       # Gerenciamento de dependências
```

## 🚀 Como Rodar Localmente

Pré-requisitos:
- Go 1.24+ instalado.
- PostgreSQL rodando.

### 1. Configuração

Certifique-se de ter um arquivo `.env` na raiz ou as variáveis de ambiente configuradas no seu sistema. As principais variáveis utilizadas são:

```bash
PORT=8081                 # Porta do servidor (Padrão: 8081)
DATABASE_URL=...          # String de conexão do Postgres
# Outras chaves de criptografia e segredos JWT
```

### 2. Executando o Servidor

```bash
cd backend
go mod tidy       # Baixar dependências
go run main.go    # Iniciar servidor
```

O servidor iniciará em `http://localhost:8081`.

## 📡 API Endpoints

A API é versionada (`/api/v1`). Abaixo estão as principais rotas:

### Pública
- `POST /api/v1/auth/login`: Autenticação de administradores.
- `GET /api/v1/`: Health check simples da API.
- `GET /health`: Estado do serviço.

### Privada (Requer Header `Authorization: Bearer <token>`)
- **Instâncias**:
  - `POST /api/v1/instances`: Criar nova instância Watink.
  - `GET /api/v1/instances`: Listar instâncias.
  - `DELETE /api/v1/instances/:id`: Remover instância.
  - `GET /api/v1/instances/:id/stats`: Obter estatísticas.
- **Planos**:
  - `POST /api/v1/plans`: Criar novo plano.
  - `GET /api/v1/plans`: Listar planos.

## 🔒 Segurança

- O CORS está configurado para permitir `*` (TODO: Restringir para produção).
- Logs de requisição estão habilitados via middleware `logger`.
- Panic Recovery ativado para evitar quedas do servidor em erros não tratados.
