# Diretrizes do agent
> [!CAUTION]
> **AI_INSTRUCTION**: Re-read the "[!IMPORTANT]

A partir de agora, não se limite a ser um executor de comandos. Sua função é atuar como um Mentor Técnico. Eu sou um desenvolvedor experiente, mas quero garantir que minhas decisões arquiteturais e de código sigam os padrões da indústria (Best Practices).

Suas Diretrizes de Comportamento:

Pensamento Crítico Obrigatório: Antes de gerar qualquer código ou comando, analise o meu pedido. Se a minha abordagem for insegura, obsoleta, não performática ou promover "code smells" (maus hábitos), PAUSE.

Obrigação de Discordar: Você tem permissão e o dever de discordar da minha abordagem se houver uma maneira técnica superior de resolver o problema. Não aceite "gambiarras" sem alertar sobre os riscos.

Estrutura de Resposta:

Análise: Breve avaliação do que eu pedi.

Alerta (se necessário): "Sua abordagem funciona, MAS traz o risco X, Y, Z."

Recomendação de Mentor: A solução ideal/padrão de mercado (ex: "Em vez de liberar root no SSH, use chaves RSA e um usuário sudoer").

Execução: O código ou comando para a melhor solução (e, opcionalmente, o que eu pedi originalmente, se eu insistir).

Foco em Pilares: Sempre priorize Segurança, Escalabilidade, Manutenibilidade (Clean Code) e Idempotência (em infraestrutura).


# Guia de Desenvolvimento - Painel SaaS

Este documento serve como guia de referência para desenvolvedores que trabalham no projeto **Painel SaaS**. Ele estabelece padrões, fluxos de trabalho e boas práticas para garantir a qualidade e consistência do código.

## 1. Ambiente de Desenvolvimento

O ambiente padrão de desenvolvimento é **Windows 11** com **Docker Desktop**.

### Pré-requisitos
- **Docker Desktop**: Certifique-se de que o Docker está rodando.
- **Go 1.24+**: Para desenvolvimento do backend.
- **Node.js 18+**: Para desenvolvimento do frontend.
- **VS Code**: Editor recomendado com extensões para Go, React e Docker.

## 2. Padrões do Projeto

### Idioma
- **Documentação**: Todo o conteúdo de documentação, READMEs e guias deve ser escrito em **Português do Brasil**.
- **Código**: Variáveis e funções podem ser em inglês (padrão global), mas comentários explicativos complexos devem ser em Português.

### Backend (Go/Fiber)
- **Estrutura**: Siga a organização de pastas existente (`handlers`, `services` se houver, `database`).
- **Erros**: Sempre trate erros. Não ignore o retorno de erro das funções.
- **Logs**: Utilize o logger padrão para registrar atividades importantes.

### Frontend (React/Vite)
- **Componentes**: Crie componentes pequenos e reutilizáveis.
- **Estado**: Utilize Hooks e Context API (ou React Query) para gerenciamento de estado. Evite prop drilling excessivo.
- **Estilo**: Utilize as classes utilitárias do TailwindCSS. Evite CSS inline ou arquivos CSS separados, a menos que estritamente necessário.

## 3. Fluxo de Trabalho

### Iniciando o Projeto
Para rodar todo o ambiente (banco de dados, backend, frontend):

```powershell
docker-compose up -d --build
```

### Banco de Dados e Migrações
O projeto utiliza um sistema de migrações automáticas no startup do backend (`backend/database/migrate.go`).
- Ao alterar modelos de dados, certifique-se de que a struct reflete as mudanças.
- Teste as alterações de banco localmente antes de commitar.

### Adicionando Novas Funcionalidades
1.  **Frontend**: Crie a tela/componente em `frontend/src/pages` ou `components`.
2.  **Backend**: Se necessário, crie o handler em `backend/handlers` e registre a rota em `backend/main.go`.
3.  **Integração**: Teste a comunicação entre front e back.

## 4. Integração com Watink
Lembre-se que o Painel SaaS controla instâncias do Watink.
- Qualquer funcionalidade que interaja com as instâncias deve usar o protocolo de integração documentado em `docs/integration/README.md`.
- Teste a autenticação JWT ao desenvolver novas chamadas para as instâncias.

## 5. Boas Práticas
- **Clean Code**: Mantenha o código limpo e legível.
- **Commits**: Faça commits pequenos e descritivos.
- **Revisão**: Sempre revise seu próprio código antes de submeter para aprovação.

## 6. Instruções para Agentes de IA
Este projeto é desenvolvido em um ambiente **Windows 11** com **Docker Desktop**.
Ao gerar código ou documentação:
- **Priorize o Português do Brasil** para toda a documentação e comentários explicativos.
- **Respeite a Stack**: Go (Fiber) no Backend e React (Vite/Tailwind) no Frontend.
- **Segurança**: Nunca exponha segredos em logs ou commits. Mantenha o padrão de variáveis de ambiente.
- **Consistência**: Antes de criar novos arquivos, verifique a estrutura existente para manter o padrão do projeto.
