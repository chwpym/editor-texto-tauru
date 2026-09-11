import { test, expect } from '@playwright/test';

test.describe('Interface do Editor Taurus', () => {

  test.beforeEach(async ({ page }) => {
    // Acessar a aplicação local
    await page.goto('/');
    const initialPrompt = page.locator('#prompt-modal-overlay.show');
    if (await initialPrompt.count()) {
      await page.locator('#prompt-modal-input').fill('Primeiro Documento');
      await page.locator('#prompt-modal-ok-btn').click();
    }
    await expect(page.locator('.document-tab')).toBeVisible();
    await expect(page.locator('#editor')).not.toBeDisabled();
  });

  test('deve carregar o título corretamente', async ({ page }) => {
    await expect(page).toHaveTitle(/Editor Taurus/);
  });

  test('deve criar um novo documento e exibir a aba', async ({ page }) => {
    // Tenta clicar no botão de novo documento (ícone file-plus)
    const newDocBtn = page.locator('#new-doc-btn');
    await newDocBtn.click();

    // Como o prompt é customizado (modal HTML), vamos esperar ele aparecer
    // Mudamos para waitForSelector com estado 'attached' porque as classes de transição (invisible/opacity-0) podem atrasar o 'visible' no Playwright
    await page.waitForSelector('#prompt-modal-overlay', { state: 'attached' });
    
    // Digitar o nome do documento
    const input = page.locator('#prompt-modal-input');
    // Esperamos apenas que ele esteja no DOM (attached). O preenchimento funciona mesmo durante a transição de opacidade.
    await input.waitFor({ state: 'attached' });
    await input.fill('Documento de Teste E2E', { force: true });
    await page.click('#prompt-modal-ok-btn');

    // Verificar se a aba apareceu com o nome correto
    const tab = page.locator('.document-tab', { hasText: 'Documento de Teste E2E' });
    await expect(tab).toBeVisible();
    
    // Verificar se o editor habilitou e podemos escrever
    const editor = page.locator('#editor');
    await expect(editor).not.toBeDisabled();
    await editor.fill('Olá mundo do teste automatizado!');
    
    // Verificar se as métricas de status bar atualizaram (opcional)
    const charCount = page.locator('#char-count');
    await expect(charCount).toContainText('32'); // "Olá mundo do teste automatizado!" tem 32 caracteres se não me engano
  });

  test('deve localizar e substituir texto', async ({ page }) => {
    const editor = page.locator('#editor');
    await editor.fill('texto original');

    await page.locator('#find-replace-btn').click();
    await page.locator('#find-input').fill('original');
    await page.locator('#replace-input').fill('atualizado');
    await page.locator('#replace-btn').click();

    await expect(editor).toHaveValue('texto atualizado');
  });
});
