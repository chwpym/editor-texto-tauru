# ✍️ Editor de Texto Taurus

O **Editor Taurus** é uma ferramenta de escrita leve, moderna e totalmente Web, projetada para ser uma alternativa ágil e produtiva aos editores pesados, focando em funcionalidades realmente úteis para o dia a dia.

🚀 **[Acesse o Editor Taurus agora](https://chwpym.github.io/editor-texto-tauru/)**

---

## ✨ Principais Recursos

- **💻 PWA (Progressive Web App)**: Instale o editor como um aplicativo nativo no Windows, macOS ou Android diretamente do seu navegador.
- **⚡ Performance Extrema**: Zero dependências pesadas, carregamento instantâneo.
- **� Seleções Múltiplas**: Suporte a edição em vários pontos simultâneos (Ctrl+D), permitindo edições rápidas e precisas.
- **🎨 Temas Inteligentes**: Suporte total a Modo Escuro (Dark) e Claro (Light).
- **📏 Régua Vertical**: Guia visual de coluna para manter a organização e o alinhamento do texto.
- **📁 Gerenciamento de Documentos**: Salva seus textos localmente no navegador (IndexedDB) para que você nunca perca nada.
- **🔢 Numeração Ilimitada**: Contador de linhas sincronizado e robusto.
- **⚖️ Medidor de Tamanho**: Veja o peso real do seu arquivo em Bytes, KB ou MB em tempo real.
- **🤖 Autocomplete Inteligente**: Sugere palavras do próprio documento em tempo real. `Tab` para aceitar.
- **📖 Dicionário Pessoal**: Salve suas palavras fixas (marcas, termos técnicos) que aparecem em todos os documentos.
- **✍️ Typewriter Mode**: Modo máquina de escrever — mantém a linha atual sempre centralizada na tela.
- **🔍 Highlight de Busca**: Todas as ocorrências destacadas em amarelo ao usar Localizar. Contador `X/Y` e navegação por `Enter`.
- **🛡️ Proteção de Conteúdo**: Alerta e permite desfazer caso você apague mais de 30% do texto acidentalmente.
- **📊 Status Bar Completa**: Linha, coluna, total de linhas, palavras, tamanho e horário do último salvamento.

---

## ⌨️ Atalhos de Teclado (Power User)

| Atalho              | Ação                                                              |
| :------------------ | :---------------------------------------------------------------- |
| `Ctrl + S`          | Salvar manualmente (o editor também salva automático!)            |
| `Alt + N`           | Criar um novo documento                                           |
| `Ctrl + P`          | Busca rápida de documentos (estilo VS Code)                       |
| `Ctrl + G`          | Ir para linha                                                     |
| `Ctrl + Shift + F`  | Localizar e Substituir                                            |
| `Ctrl + D`          | Selecionar próxima ocorrência da palavra                          |
| `Ctrl + Shift + L`  | Selecionar todas as ocorrências da palavra                        |
| `Ctrl + M`          | Abrir menu de ações múltiplas (Substituir, Maiúsculas/Minúsculas) |
| `Ctrl + Shift + D`  | Duplicar linha atual                                              |
| `Ctrl + Shift + U`  | Converter seleção para MAIÚSCULAS                                 |
| `Alt + Shift + ↑/↓` | Mover linha atual para cima ou para baixo                         |
| `Tab`               | Aceitar sugestão do autocomplete                                  |
| `Esc`               | Cancelar seleções múltiplas / fechar autocomplete                 |

---

## 📲 Como Instalar (PWA)

1. Acesse o [link do projeto](https://chwpym.github.io/editor-texto-tauru/).
2. No **Microsoft Edge** ou **Google Chrome**, clique no ícone de computador com uma setinha na barra de endereços (ou vá em Configurações > Aplicativos > Instalar este site como aplicativo).
3. Pronto! O Editor Taurus terá seu próprio ícone na sua barra de tarefas e funcionará como um programa independente.

---

## 🗂️ Estrutura do Projeto

```
/
├── index.html          # HTML puro (interface)
├── css/
│   └── main.css        # Estilos customizados
├── js/
│   └── app.js          # Toda a lógica do editor (~1700 linhas)
├── manifest.json       # Configuração PWA
├── service-worker.js   # Cache offline
└── icon.png            # Ícone do app
```

---

## 🛠️ Tecnologias Utilizadas

- **HTML5** (Semântico e estruturado)
- **Vanilla JavaScript** (Lógica pura para máxima velocidade)
- **Tailwind CSS** (Estilização moderna e responsiva)
- **Lucide Icons** (Ícones elegantes)
- **IndexedDB** (Armazenamento local persistente)
- **Service Workers** (Suporte offline e PWA)

---

Desenvolvido por [chwpym](https://github.com/chwpym) com foco em produtividade e leveza. 🚀
