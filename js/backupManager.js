/* ========================================
   EDITOR TAURUS - backupManager.js
   Módulo de Backup Diário Inteligente & Alertas
   ======================================== */

import * as db from './db.js';
import * as ui from './ui.js';

let hasEditsToday = false;
let backupDoneToday = false;
let directoryHandle = null;

const STORAGE_KEY_BACKUP_DATE = 'taurus_last_backup_date';
const STORAGE_KEY_FOLDER_NAME = 'taurus_backup_folder_name';

/**
 * Inicializa o módulo de backup diário
 */
export async function initBackupManager() {
  const todayStr = getTodayString();
  const lastBackupDate = localStorage.getItem(STORAGE_KEY_BACKUP_DATE);

  if (lastBackupDate === todayStr) {
    backupDoneToday = true;
  } else {
    backupDoneToday = false;
  }

  setupBeforeUnloadProtection();
  updateBackupUI();
}

/**
 * Retorna a data atual no formato YYYY-MM-DD
 */
export function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Registra que uma edição de conteúdo foi realizada durante a sessão de hoje
 */
export function markEditPerformed() {
  const todayStr = getTodayString();
  const lastBackupDate = localStorage.getItem(STORAGE_KEY_BACKUP_DATE);

  if (!hasEditsToday) {
    hasEditsToday = true;
  }

  // Se a última data gravada não for a de hoje, o backup do dia passa a ser pendente
  if (lastBackupDate !== todayStr) {
    backupDoneToday = false;
  }

  updateBackupUI();
}

/**
 * Retorna o estado atual do backup
 */
export function getBackupStatus() {
  return {
    hasEditsToday,
    backupDoneToday,
    folderName: localStorage.getItem(STORAGE_KEY_FOLDER_NAME) || "C:\\Users\\Estoque_Original\\Desktop\\bkp editor"
  };
}

/**
 * Define uma nova pasta de backup via File System Access API (quando suportado)
 */
export async function selectBackupFolder() {
  if ('showDirectoryPicker' in window) {
    try {
      directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'desktop'
      });
      const folderName = directoryHandle.name;
      localStorage.setItem(STORAGE_KEY_FOLDER_NAME, folderName);
      ui.showMessage(`Pasta "${folderName}" vinculada com sucesso!`, 'success');
      updateBackupUI();
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') {
        ui.showMessage('Erro ao selecionar pasta: ' + err.message, 'error');
      }
      return false;
    }
  } else {
    ui.showMessage('Modo Web padrão: Os backups serão baixados diretamente.', 'info');
    return false;
  }
}

/**
 * Executa o backup de todos os documentos
 */
export async function performDailyBackup() {
  try {
    const docs = await db.getAllDocs();
    const todayStr = getTodayString();
    const fileName = `backup_taurus_${todayStr}.json`;
    const jsonContent = JSON.stringify(docs, null, 2);

    let savedDirectly = false;

    // Se temos uma pasta vinculada e permissão
    if (directoryHandle) {
      try {
        const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(jsonContent);
        await writable.close();
        savedDirectly = true;
      } catch (e) {
        console.warn("Falha na gravação direta na pasta. Fazendo fallback para download:", e);
      }
    }

    // Se não salvou direto no disco, faz download do arquivo
    if (!savedDirectly) {
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }

    // Marca o backup de hoje como concluído
    localStorage.setItem(STORAGE_KEY_BACKUP_DATE, todayStr);
    backupDoneToday = true;
    updateBackupUI();

    ui.showMessage(`Backup do dia (${todayStr}) concluído com sucesso!`, 'success');
    return true;
  } catch (err) {
    ui.showMessage('Erro ao realizar backup: ' + err.message, 'error');
    return false;
  }
}

/**
 * Atualiza os elementos visuais de status do backup na interface
 */
export function updateBackupUI() {
  const badgeEl = document.getElementById('daily-backup-badge');
  const btnEl = document.getElementById('daily-backup-btn');
  const statusTextEl = document.getElementById('modal-backup-status-text');
  const cardNoticeEl = document.getElementById('backup-warning-card');

  const { backupDoneToday, hasEditsToday } = getBackupStatus();

  if (badgeEl) {
    if (backupDoneToday) {
      badgeEl.className = 'absolute top-0 right-0 -mt-1 -mr-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900';
      btnEl?.setAttribute('title', 'Backup Diário: Concluído hoje 🟢');
    } else if (hasEditsToday) {
      badgeEl.className = 'absolute top-0 right-0 -mt-1 -mr-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse ring-2 ring-slate-900';
      btnEl?.setAttribute('title', 'Backup Diário: PENDENTE (Edições realizadas hoje) 🟡');
    } else {
      badgeEl.className = 'absolute top-0 right-0 -mt-1 -mr-1 w-3 h-3 bg-slate-500 rounded-full ring-2 ring-slate-900';
      btnEl?.setAttribute('title', 'Backup Diário: Modo Consulta (Sem edições hoje)');
    }
  }

  if (statusTextEl) {
    if (backupDoneToday) {
      statusTextEl.innerHTML = `<span class="text-emerald-500 font-bold">🟢 Backup de hoje (${getTodayString()}) CONCLUÍDO!</span>`;
    } else if (hasEditsToday) {
      statusTextEl.innerHTML = `<span class="text-amber-500 font-bold">🟡 Edições detectadas hoje! Backup pendente.</span>`;
    } else {
      statusTextEl.innerHTML = `<span class="text-slate-400">👁️ Modo Consulta: Nenhuma alteração feita hoje.</span>`;
    }
  }

  if (cardNoticeEl) {
    if (hasEditsToday && !backupDoneToday) {
      cardNoticeEl.classList.remove('hidden');
    } else {
      cardNoticeEl.classList.add('hidden');
    }
  }
}

/**
 * Configura o aviso inteligente ao fechar a janela/aba (beforeunload)
 */
function setupBeforeUnloadProtection() {
  window.addEventListener('beforeunload', (e) => {
    // Se o usuário APENAS CONSULTOU/LEU (não fez edições no dia) ou SE JÁ FEZ O BACKUP DE HOJE,
    // o fechamento ocorre SILENCIOSAMENTE sem nenhum alerta incomodando!
    if (!hasEditsToday || backupDoneToday) {
      return;
    }

    // Se houve edição e o backup está pendente, bloqueia e avisa
    const confirmationMessage = 'Você realizou alterações hoje e o backup diário ainda não foi salvo! Deseja realmente sair?';
    e.preventDefault();
    e.returnValue = confirmationMessage;
    return confirmationMessage;
  });
}
