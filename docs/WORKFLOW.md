# Fluxo de Trabalho (Workflow)

Este documento define os padrões de desenvolvimento e versionamento do Watink.

## Git Flow

### Branches
*   **`main`**: Produção (Estável). Deploy manual ou via tag.
*   **`devel_developer`** (ou `staging`): Integração. Ambiente de testes do Swarm.
*   **`feat/nome-funcionalidade`**: Desenvolvimento de novas features.
*   **`fix/nome-bug`**: Correções.

### Padrão de Commits
Siga o [Conventional Commits](https://www.conventionalcommits.org/):
*   `feat: adicionar login com google`
*   `fix: corrigir erro no modal de tickets`
*   `docs: atualizar readme`
*   `chore: bump version`

## Processo de Release

### 1. Desenvolvimento
1.  Crie branch a partir de `devel`.
2.  Codifique e teste usando `./update.sh` para ver as mudanças refletidas no Swarm.

### 2. Integração
1.  Abra Pull Request para `devel`.
2.  Code Review.
3.  Merge.

### 3. Deploy/Release
Nunca edite a tag image manualmente no `docker-stack.yml`.
Use sempre:
```bash
./update.sh <service> <tipo>
```
Isso garante que a imagem rodando é exatamente a imagem taggeada no arquivo de stack.
