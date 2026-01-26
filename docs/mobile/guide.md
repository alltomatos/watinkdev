# Guia de Desenvolvimento: Watink Mobile App (Android Nativo)

Este documento especifica os requisitos e diretrizes técnicas para o desenvolvimento do aplicativo móvel nativo do Watink (Atendente) utilizando Android Studio e ferramentas nativas.

## 1. Visão Geral
O objetivo é fornecer uma aplicação robusta, performática e integrada ao sistema operacional para que atendentes possam responder chats em tempo real.

**Stack Tecnológica Obrigatória**:
*   **Linguagem**: Kotlin.
*   **IDE**: Android Studio (Versão Ladybug ou mais recente).
*   **UI Toolkit**: Jetpack Compose (Material Design 3).
*   **Arquitetura**: MVVM com Clean Architecture.
*   **Gerenciador de Dependências**: Gradle (Kotlin DSL).

## 2. Configuração do Ambiente

### Pré-requisitos
*   JDK 17 ou superior.
*   Android Studio instalado e configurado.
*   Emulador configurado (API 34+) ou Dispositivo Físico com depuração USB ativa.

### Estrutura do Projeto
O projeto deve seguir a modularização padrão do Android Moderno:
*   `:app` - Módulo principal.
*   `:core:network` - Camada de Rede (Retrofit/OkHttp).
*   `:core:database` - Persistência Local (Room) para cache offline.
*   `:core:designsystem` - Componentes visuais reutilizáveis (Temas, Tipografia, Cores).

## 3. Funcionalidades de Login e White-label
A tela de login deve suportar múltiplos backends (SaaS e Enterprise).

### UI e UX
*   **Campos**: E-mail, Senha.
*   **Configuração de Servidor**: Ícone de engrenagem no canto superior direito.
    *   Ao clicar, abre `BottomSheet` ou `Dialog` para inserir a **Base URL**.
    *   **Padrão**: Se vazio, usar `https://api.watink.com`.
    *   **Persistência**: Usar `DataStore Preferences` para salvar a URL escolhida.

## 4. Funcionalidades Principais (MVP)

### A. Lista de Chats (Compose LazyColumn)
*   **Abas (TabRow)**: "Meus Atendimentos" / "Aguardando".
*   **Sincronização**: Usa `WorkManager` para sync em background e `Socket.io` (via biblioteca nativa ou OkHttp WebSocket) para tempo real.
*   **Itens da Lista**:
    *   Foto do contato (Coil para carregamento de imagem).
    *   Status (Online/Offline).
    *   Badges de mensagens não lidas.

### B. Tela de Chat
*   **Layout**: `Scaffold` com `TopAppBar` e `BottomBar` (Input).
*   **Lista de Mensagens**: `LazyColumn` com `reverseLayout = true`.
*   **Input**:
    *   Gravador de Áudio: Uso da API `MediaRecorder`.
    *   Anexos: `ActivityResultContracts.PickVisualMedia` para selecionar fotos/vídeos sem permissão de leitura total do storage (Photo Picker do Android).

### C. Notificações (FCM)
*   Integração com Firebase Cloud Messaging (FCM).
*   Canais de Notificação Android (Notification Channels) separados para:
    *   "Novas Mensagens" (Alta prioridade, Som).
    *   "Status do Sistema" (Baixa prioridade, Silencioso).

## 5. Módulos Extensíveis (Plugins)

### A. Gerenciamento de Plugins
*   **Verificação**: Ao iniciar, o app deve consultar `/plugins/api/v1/plugins/installed`.
*   **Feature Flag**: Se o plugin `helpdesk` estiver no array `active`, habilitar a navegação para o módulo correspondente.

### B. Módulo Helpdesk (Protocolos)
*   **UI**:
    *   Lista de Protocolos (Kanban ou Lista).
    *   Visualização de Detalhes (Semelhante ao Chat, mas com metadados de SLA e Status no topo).
    *   Formulário de Abertura de Protocolo (Título, Descrição, Prioridade, Categoria).
*   **Comportamento**:
    *   Deve permitir anexar arquivos.
    *   Deve exibir o histórico de tramitação (ex: "Mudou status para Em Andamento").

## 6. Bibliotecas Recomendadas
*   **Injeção de Dependência**: Hilt.
*   **Rede**: Retrofit + OkHttp.
*   **Imagens**: Coil.
*   **Async**: Coroutines + Flow.
*   **Socket**: Socket.io-client-java ou OkHttp WebSockets puro.
*   **Serialização**: Kotlinx Serialization.

## 7. Build e Publicação (Variantes)
Utilizar `ProductFlavors` no Gradle se necessário criar versões diferentes (ex: `dev`, `staging`, `prod`), mas manter um único Application ID base para facilitar a configuração do Firebase.

---
**Observação**: Todo o código deve ser escrito pensando em performance e economia de bateria, utilizando o Profiler do Android Studio para validar vazamentos de memória (Memory Leaks).
