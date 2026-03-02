# ✍️ Editor de Texto Taurus

O **Editor Taurus** é uma ferramenta de escrita leve, moderna e totalmente Web, projetada para ser uma alternativa ágil e produtiva aos editores pesados, focando em funcionalidades realmente úteis para o dia a dia.

🚀 **[Acesse o Editor Taurus agora](https://chwpym.github.io/editor-texto-tauru/)**

---

## ✨ Principais Recursos

### 📝 Editor

- **🤖 Autocomplete Inteligente**: Sugere palavras do próprio documento em tempo real. `Tab` para aceitar, `Esc` para ignorar.
- **📖 Dicionário Pessoal**: Salve palavras fixas (marcas, termos técnicos) que serão sugeridas em todos os documentos.
- **✍️ Typewriter Mode**: Modo máquina de escrever — mantém a linha atual centralizada verticalmente enquanto você digita.
- **🔢 Numeração de Linhas**: Contador ilimitado e sincronizado com o scroll.
- **📏 Régua de Coluna**: Guia visual configurável para alinhamento do texto.

### 📊 Barra de Status

- **Linha e Coluna** do cursor em tempo real (`Ln 34, Col 12`)
- **Total de linhas** do documento
- **Contagem de palavras e caracteres**
- **Tamanho do arquivo** (B / KB / MB)
- **Auto-save com horário** (`Salvo às 15:38`)

### 🔍 Busca e Edição

- **Highlight de Busca**: Todas as ocorrências destacadas em amarelo ao digitar no Localizar. Contador `X/Y` e navegação por `Enter`.
- **Seleções Múltiplas**: `Ctrl+D` para selecionar próxima, `Ctrl+Shift+L` para todas. Substitua, converta ou delete de uma vez.
- **Localizar e Substituir**: Com substituição individual ou em massa.

### 🛡️ Segurança

- **Proteção de Conteúdo**: Se você apagar mais de 30% do texto acidentalmente, um banner permite **desfazer** antes de salvar.
- **Armazenamento Local (IndexedDB)**: Seus documentos nunca saem do seu dispositivo.
- **Multi-documentos**: Crie, renomeie, exporte e importe quantos documentos quiser.

### 💻 PWA & Performance

- **Zero dependências pesadas**: Carregamento instantâneo.
- **Offline**: Funciona sem internet após a primeira carga.
- **Instalável**: Como aplicativo nativo no Windows, macOS ou Android.

---

## ⌨️ Atalhos de Teclado

| Atalho              | Ação                                    |
| :------------------ | :-------------------------------------- |
| `Ctrl + S`          | Salvar manualmente                      |
| `Alt + N`           | Novo documento                          |
| `Ctrl + P`          | Busca rápida de documentos              |
| `Ctrl + G`          | Ir para linha                           |
| `Ctrl + Shift + F`  | Localizar e Substituir                  |
| `Ctrl + D`          | Selecionar próxima ocorrência           |
| `Ctrl + Shift + L`  | Selecionar todas as ocorrências         |
| `Ctrl + M`          | Ações para múltiplas seleções           |
| `Ctrl + Shift + D`  | Duplicar linha atual                    |
| `Ctrl + Shift + U`  | Converter seleção para MAIÚSCULAS       |
| `Alt + Shift + ↑/↓` | Mover linha para cima/baixo             |
| `Tab`               | Aceitar sugestão do autocomplete        |
| `Esc`               | Cancelar seleções / fechar autocomplete |

---

## 📲 Como Instalar (PWA)

1. Acesse o [link do projeto](https://chwpym.github.io/editor-texto-tauru/).
2. No **Microsoft Edge** ou **Google Chrome**, clique no ícone de instalação na barra de endereços.
3. Pronto! O Editor Taurus terá seu próprio ícone na sua barra de tarefas.

---

## 🗂️ Estrutura do Projeto

```
/
├── index.html          # HTML puro (interface)
├── css/
│   └── main.css        # Estilos customizados
├── js/
│   └── app.js          # Toda a lógica do editor
├── manifest.json       # Configuração PWA
├── service-worker.js   # Cache offline
└── icon.png            # Ícone do app
```

---

## 🛠️ Tecnologias

- **HTML5** + **Vanilla JavaScript** — sem frameworks, máxima velocidade
- **Tailwind CSS** — estilização moderna
- **Lucide Icons** — ícones elegantes
- **IndexedDB** — armazenamento local persistente
- **Service Workers** — suporte offline e PWA

---

Desenvolvido por [chwpym](https://github.com/chwpym) com foco em produtividade e leveza. 🚀
