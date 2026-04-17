# Plano de Estabilização v13.5: Performance e PWA

Este plano visa corrigir as regressões causadas pela migração para o Vite e otimizar o motor do Editor Taurus para suportar grandes volumes de texto, garantindo a instalabilidade no GitHub Pages.

## User Review Required

> [!IMPORTANT]
> A correção do PWA exigirá a instalação de uma nova dependência: `vite-plugin-pwa`. Isso é necessário para que o Service Worker reconheça os arquivos gerados pelo Vite no GitHub Pages.

> [!WARNING]
> Vou remover o link do CDN do Lucide do `index.html` e padronizar o uso via NPM para reduzir o tempo de carregamento e evitar ícones "quebrados".

## Proposed Changes

### 1. Performance (Engine do Editor)

#### [MODIFY] [editorCore.js](file:///d:/Dev/Editor-Codigo/js/editorCore.js)
- Implementar atualização incremental na função `updateLineNumbers`.
- Em vez de destruir 5.000 divs e criar novas, o código apenas adicionará/removerá a diferença. Isso reduz o tempo de processamento de ~200ms para <1ms em arquivos grandes.

### 2. PWA e Estratégia Offline (Vite + GitHub Pages)

#### [MODIFY] [vite.config.js](file:///d:/Dev/Editor-Codigo/vite.config.js)
- Adicionar `vite-plugin-pwa`.
- Configurar o `manifest` dinamicamente para garantir que o ícone e o `start_url` funcionem corretamente na subpasta `/editor-texto-tauru/`.

#### [DELETE] [service-worker.js](file:///d:/Dev/Editor-Codigo/public/service-worker.js)
- Remover o Service Worker manual. O novo será gerado automaticamente pelo Vite com hashes de segurança.

### 3. UI e Ícones

#### [MODIFY] [index.html](file:///d:/Dev/Editor-Codigo/index.html)
- Remover scripts CDN redundantes.

#### [MODIFY] [ui.js](file:///d:/Dev/Editor-Codigo/js/ui.js) e [tasks.js](file:///d:/Dev/Editor-Codigo/js/tasks.js)
- Centralizar o carregamento de ícones para evitar erros de inicialização.

## Open Questions

- Você tem preferência por manter o Lucide via CDN por algum motivo específico (como compatibilidade com IA externa)? Se não, recomendo fortemente o uso via NPM (Build-time).

## Verification Plan

### Automated Tests
- Executar `npm run build` para validar se os assets PWA foram gerados corretamente na pasta `dist`.

### Manual Verification
- Testar a abertura de um arquivo de teste com 10.000 linhas gerado via script no console.
- Verificar na aba "Application" do Chrome se o Service Worker foi registrado com o escopo correto do GitHub Pages.

# Plano de Correção de Funcionalidades v13.6

Este plano visa restaurar as funcionalidades de UI que pararam de responder após a migração para o Vite.

## User Review Required

> [!IMPORTANT]
> Identifiquei IDs duplicados no `index.html`. Vou unificar a barra de ferramentas para garantir que apenas um botão controle cada função, evitando conflitos no JavaScript.

> [!WARNING]
> O Modo Máquina de Escrever será movido do elemento `#editor` para o `document.body`. Isso é necessário para que o CSS consiga aplicar o espaçamento correto no fundo da página.

## Proposta de Mudanças

### 1. Limpeza de Interface (HTML)
#### [MODIFY] [index.html](file:///d:/Dev/Editor-Codigo/index.html)
- Remover duplicatas de `#ruler-toggle-btn` e `#ruler-column-input`.
- Garantir que todos os modais tenham apenas uma única referência de ID.

### 2. Motor de UI e Régua
#### [MODIFY] [editorCore.js](file:///d:/Dev/Editor-Codigo/js/editorCore.js)
- Alterar `toggleTypewriterMode` para agir no `document.body`.
- Corrigir `toggleRuler` para garantir que a classe `hidden` seja aplicada corretamente ao elemento da linha.

### 3. Módulo de Tarefas (Tasks)
#### [MODIFY] [tasks.js](file:///d:/Dev/Editor-Codigo/js/tasks.js)
- Validar se a classe `.active` do drawer está sendo reconhecida pelo compilador do Tailwind.
- Garantir que o `overlay` também receba o estado de clique para fechar o menu.

### 4. Atalhos e Inicialização
#### [MODIFY] [app.js](file:///d:/Dev/Editor-Codigo/js/app.js)
- Sincronizar os atalhos com as novas instâncias dos módulos.
- Garantir que `initShortcuts` receba todas as funções necessárias (save, new, find, multiactions).

## Plano de Verificação

### Verificação Manual
1. **Régua**: Clicar no ícone de régua na barra superior e verificar se a linha vermelha aparece/some.
2. **Máquina de Escrever**: Ativar o modo e verificar se ao final do texto o editor permite rolar além do conteúdo (centralização).
3. **Tarefas**: Abrir o painel lateral e adicionar uma tarefa de teste.
4. **Atalhos**: Testar `Ctrl+S`, `Alt+N` e `Ctrl+Shift+F`.
