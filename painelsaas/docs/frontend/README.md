# Painel SaaS - Documentação do Frontend

O frontend do Painel SaaS é uma SPA (Single Page Application) moderna construída com **React** e **Vite**, utilizando **TypeScript** para tipagem estática e segurança.

## 🛠 Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite 5
- **Linguagem**: TypeScript
- **Estilização**: TailwindCSS 3
- **Roteamento**: React Router DOM 6+
- **HTTP Client**: Axios
- **Ícones**: Lucide React
- **Gerenciamento de Estado/Cache**: TanStack Query (React Query)

## 📂 Estrutura do Projeto

```text
frontend/
├── src/
│   ├── components/  # Componentes reutilizáveis
│   ├── pages/       # Componentes de página (Rotas)
│   ├── services/    # Integração com API (Axios)
│   ├── hooks/       # Custom React Hooks
│   ├── App.tsx      # Componente Raiz
│   └── main.tsx     # Ponto de entrada
├── index.html       # Template HTML principal
├── tailwind.config.js # Configuração de estilos
└── vite.config.ts   # Configuração do Build
```

## 🚀 Como Rodar Localmente

Pré-requisitos:
- Node.js 18+ instalado.

### 1. Instalação

Navegue até a pasta do frontend e instale as dependências:

```bash
cd frontend
npm install
```

### 2. Executando em Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000` (conforme configurado no `vite.config.ts`).

### 3. Build para Produção

Para gerar os arquivos estáticos para deploy:

```bash
npm run build
```

Os arquivos serão gerados na pasta `dist/`.

## 🎨 Estilização

O projeto utiliza **TailwindCSS** para estilização utilitária.
- As configurações globais estão no `src/index.css`.
- Classes condicionais são gerenciadas com `clsx` e `tailwind-merge`.

## ⚙️ Configuração

O frontend se comunica com o backend configurado. Verifique se a URL da API está apontando corretamente para o backend local ou de produção (geralmente via variáveis de ambiente `VITE_API_URL` ou proxy no Vite).
