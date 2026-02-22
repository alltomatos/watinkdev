# Relatório de Paridade de Migrations e Seeds

## 1. Status da Execução
- **Banco Opencore (Standard Node.js):** 
  - Migrations: ✅ 100% Sucesso (Total: 65 migrations aplicadas).
  - Seeds: ⚠️ Parcial. Algumas seeds (Admin Group/Permissions) foram puladas devido à falta do usuário `admin@admin.com` no momento da execução, o que é esperado no fluxo de Wizard.
- **Banco Business (Go):** 
  - Migrations (AutoMigrate): ✅ 100% Sucesso.
  - Seeds: ✅ 100% Sucesso (Permissions básicas criadas).

## 2. Comparação de Estrutura (OpenCore vs Business)

### 2.1 Tabelas
- **Opencore:** 38 tabelas.
- **Business:** 31 tabelas.
- **Divergência Crítica:** O banco `business` não possui as tabelas de **Embeddings de IA** (`ConversationEmbeddings`), **Protocolos** (`Protocols`, `ProtocolAttachments`) e **Clientes** (`Clients`).
- **Divergência de Nomeclatura:** O banco `business` utiliza tabelas em snake_case para relações (ex: `user_permissions`) enquanto o `opencore` utiliza PascalCase (`UserPermissions`).

### 2.2 Tipagem de Dados
- **ID PK/FK:** O `opencore` usa `integer` para IDs, enquanto o `business` usa `bigint`.
- **Strings:** O `opencore` usa `character varying(255)`, o `business` usa `text`.

### 2.3 Segurança (RLS)
- **Opencore:** Possui políticas de **Row Level Security (RLS)** habilitadas no banco de dados para isolamento de tenants.
- **Business:** **NÃO** possui políticas de RLS no banco de dados. A isolação parece estar apenas na camada de aplicação.

## 3. Erros Identificados
1. **Seeds Standard:** Omissão do usuário default `admin@admin.com` impede que as seeds de permissões iniciais sejam vinculadas corretamente sem intervenção manual ou via Wizard.
2. **Conflito de Nomes:** A existência de tabelas com a mesma função mas nomes diferentes (PascalCase vs snake_case) impedirá que ambos os backends rodem no mesmo banco de dados sem refatoração.

## 4. Próximos Passos
1. **Unificar Nomenclatura:** Padronizar os nomes das tabelas de junção para snake_case ou PascalCase em ambos os backends.
2. **Habilitar RLS no Business:** Criar migrations SQL para o backend Go que apliquem as mesmas políticas de `ENABLE ROW LEVEL SECURITY` e `FORCE RLS`.
3. **Migrar Embeddings:** Portar a estrutura de `ConversationEmbeddings` para o backend Business.
