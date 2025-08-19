# Editor de Texto Avançado

Um editor de texto para desktop, construído com Tauri, focado em ser leve, rápido e totalmente funcional offline. Este projeto serve como um wrapper para uma aplicação web de edição de texto, combinando a simplicidade das tecnologias web com as capacidades de uma aplicação nativa.

## ✨ Funcionalidades

-   **Armazenamento 100% Offline**: Todos os seus documentos são salvos localmente no seu navegador usando IndexedDB. Não é necessária nenhuma conexão com a internet.
-   **Gerenciamento de Documentos**: Crie, exclua e alterne entre múltiplos documentos com facilidade.
-   **Modo Claro e Escuro**: Alterne entre os temas para uma experiência de visualização confortável.
-   **Barra de Status Informativa**: Monitore o número de palavras e caracteres em tempo real.
-   **Régua de Coluna Ajustável**: Configure uma régua vertical para ajudar a guiar a largura do seu código ou texto.
-   **Localizar e Substituir**: Ferramenta integrada para encontrar e substituir texto no documento atual.
-   **Download como .txt**: Exporte seus documentos como arquivos de texto simples.
-   **Atalhos de Teclado**:
    -   `Ctrl + S`: Forçar o salvamento do documento.
    -   `Ctrl + F`: Abrir a ferramenta de Localizar e Substituir.
    -   `Ctrl + N`: Criar um novo documento.
    -   `Ctrl + U`: Converter o texto selecionado para maiúsculas.
    -   `Ctrl + Shift + D`: Duplicar a linha atual (ou linhas selecionadas).
    -   `Alt + Shift + ↑/↓`: Mover a linha atual (ou linhas selecionadas) para cima ou para baixo.

## 🚀 Como Executar

Para executar este projeto em seu ambiente de desenvolvimento, siga os passos abaixo.

### Pré-requisitos

-   [Node.js](https://nodejs.org/) e npm
-   [Ambiente de desenvolvimento Rust](https://www.rust-lang.org/tools/install)
-   [Pré-requisitos do sistema para Tauri](https://tauri.app/v1/guides/getting-started/prerequisites)

### Passos

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_REPOSITORIO>
    cd <NOME_DA_PASTA>
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Execute a aplicação em modo de desenvolvimento:**
    ```bash
    npx tauri dev
    ```
    A aplicação deverá iniciar em uma nova janela.

## 🛠️ Tecnologias Utilizadas

-   **Backend**: [Tauri](https://tauri.app/) (com Rust)
-   **Frontend**: HTML, CSS, JavaScript (puro)
-   **Estilização**: [Tailwind CSS](https://tailwindcss.com/) (via CDN)
-   **Ícones**: [Lucide Icons](https://lucide.dev/)
-   **Armazenamento Local**: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
