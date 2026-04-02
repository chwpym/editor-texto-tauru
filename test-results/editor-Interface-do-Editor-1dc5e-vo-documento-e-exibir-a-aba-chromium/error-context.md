# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: editor.spec.js >> Interface do Editor Taurus >> deve criar um novo documento e exibir a aba
- Location: tests\e2e\editor.spec.js:14:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#prompt-modal-ok-btn')
    - locator resolved to <button id="prompt-modal-ok-btn" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all">Confirmar</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 100ms
    46 × waiting for element to be visible, enabled and stable
       - element is not visible
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - button "Novo Documento (Alt+N)" [active] [ref=e5]
        - combobox [ref=e6] [cursor=pointer]
        - button "Renomear Documento" [ref=e7]
        - button "Excluir Documento Atual" [ref=e8]
      - generic [ref=e9]:
        - button "Baixar como .txt" [ref=e10]
        - button "Localizar e Substituir (Ctrl+Shift+F)" [ref=e11]
      - generic [ref=e12]:
        - generic [ref=e13]:
          - button "Mostrar/Ocultar Régua" [ref=e14]
          - spinbutton [ref=e15]: "80"
        - button "Escolher Tema" [ref=e17]
        - button "Lista de Tarefas" [ref=e18]
        - button "Ver Atalhos" [ref=e19]
        - button "Guia de Uso e Dicas" [ref=e20]
        - button "Exportar Todos os Documentos (Backup)" [ref=e21]
        - button "Importar Documentos de Backup" [ref=e22]
        - button "Dicionário Pessoal (palavras fixas para autocomplete)" [ref=e23]
        - button "Modo Maquina de Escrever (cursor centralizado)" [ref=e24]
        - generic [ref=e25]:
          - button "Ações Mágicas de IA (Selecione um texto primeiro)" [disabled] [ref=e26]
          - generic [ref=e27]:
            - checkbox [ref=e29]
            - generic [ref=e31]: IA OFF
          - button "Configurar OpenAI Key e Guia de Uso" [ref=e32]
    - button "+" [ref=e34]
    - textbox "Carregando..." [ref=e36]
    - generic [ref=e37]:
      - generic "Status de Salvamento" [ref=e38]
      - generic "Linha e Coluna do cursor"
      - generic [ref=e40]: "Palavras: 0"
      - generic [ref=e41]: "Caracteres: 0"
      - generic "Seu ID de Usuário"
      - generic [ref=e42]: v12
  - generic [ref=e43]:
    - generic [ref=e44]:
      - heading "Tarefas do Projeto" [level=2] [ref=e45]: Tarefas do Projeto
      - button [ref=e47]
    - generic [ref=e49]:
      - textbox "Nova tarefa..." [ref=e50]
      - button [ref=e51]
    - generic [ref=e53]:
      - generic [ref=e54]: 0 / 0 concluídas
      - button "Limpar Feitas" [ref=e55]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Interface do Editor Taurus', () => {
  4  | 
  5  |   test.beforeEach(async ({ page }) => {
  6  |     // Acessar a aplicação local
  7  |     await page.goto('/');
  8  |   });
  9  | 
  10 |   test('deve carregar o título corretamente', async ({ page }) => {
  11 |     await expect(page).toHaveTitle(/Editor Taurus/);
  12 |   });
  13 | 
  14 |   test('deve criar um novo documento e exibir a aba', async ({ page }) => {
  15 |     // Tenta clicar no botão de novo documento (ícone file-plus)
  16 |     const newDocBtn = page.locator('#new-doc-btn');
  17 |     await newDocBtn.click();
  18 | 
  19 |     // Como o prompt é customizado (modal HTML), vamos esperar ele aparecer
  20 |     // Mudamos para waitForSelector com estado 'attached' porque as classes de transição (invisible/opacity-0) podem atrasar o 'visible' no Playwright
  21 |     await page.waitForSelector('#prompt-modal-overlay', { state: 'attached' });
  22 |     
  23 |     // Digitar o nome do documento
  24 |     const input = page.locator('#prompt-modal-input');
  25 |     // Esperamos apenas que ele esteja no DOM (attached). O preenchimento funciona mesmo durante a transição de opacidade.
  26 |     await input.waitFor({ state: 'attached' });
  27 |     await input.fill('Documento de Teste E2E', { force: true });
> 28 |     await page.click('#prompt-modal-ok-btn');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  29 | 
  30 |     // Verificar se a aba apareceu com o nome correto
  31 |     const tab = page.locator('.document-tab', { hasText: 'Documento de Teste E2E' });
  32 |     await expect(tab).toBeVisible();
  33 |     
  34 |     // Verificar se o editor habilitou e podemos escrever
  35 |     const editor = page.locator('#editor');
  36 |     await expect(editor).not.toBeDisabled();
  37 |     await editor.fill('Olá mundo do teste automatizado!');
  38 |     
  39 |     // Verificar se as métricas de status bar atualizaram (opcional)
  40 |     const charCount = page.locator('#char-count');
  41 |     await expect(charCount).toContainText('32'); // "Olá mundo do teste automatizado!" tem 32 caracteres se não me engano
  42 |   });
  43 | 
  44 |   test('deve alternar a IA e mostrar o status', async ({ page }) => {
  45 |     const aiToggle = page.locator('#ai-toggle-switch');
  46 |     const aiStatus = page.locator('text=IA OFF');
  47 |     
  48 |     await expect(aiStatus).toBeVisible();
  49 |     
  50 |     // Ligar a IA
  51 |     await aiToggle.click();
  52 |     
  53 |     await expect(page.locator('text=IA ON')).toBeVisible();
  54 |   });
  55 | });
  56 | 
```