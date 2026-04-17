/* ========================================
   TASKS - Gerenciador de Tarefas (Drawer)
   ======================================== */

import { customConfirm, customPrompt, escapeHtml } from './utils.js';


const TASKS_KEY = "editor-taurus-tasks";
let projectTasks = [];

/**
 * Inicializa e carrega as tarefas salvas
 */
export function initTasksSystem() {
  const data = localStorage.getItem(TASKS_KEY);
  if (data) {
    try { projectTasks = JSON.parse(data); } catch(e) { projectTasks = []; }
  }
  
  const form = document.getElementById("new-task-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("new-task-input");
      if (input && input.value.trim() !== "") {
        window.addNewTask(input.value.trim());
        input.value = "";
        input.focus();
      }
    });
  }

  renderTasks();
}


/**
 * Salva e renderiza
 */
export function saveTasks() {
  localStorage.setItem(TASKS_KEY, JSON.stringify(projectTasks));
  renderTasks();
}

/**
 * Renderiza lista de tarefas no container
 */
/**
 * Renderiza lista de tarefas no container
 */
export function renderTasks() {
  const container = document.getElementById("tasks-list-container");
  if (!container) return;
  container.innerHTML = "";
  let completed = 0;
  
  projectTasks.forEach((task, i) => {
    if (task.done) completed++;
    
    const div = document.createElement("div");
    div.className = `flex items-center gap-3 p-3 rounded-md border text-sm ${task.done ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-70" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm"}`;
    
    div.innerHTML = `
      <button class="flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-500 text-transparent'}" onclick="window.toggleTask(${i})">
        <i data-lucide="check" class="w-3 h-3"></i>
      </button>
      <span class="flex-1 ${task.done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'} cursor-pointer" onclick="window.editTask(${i})" title="Clique para editar">${escapeHtml(task.title)}</span>
      <button class="text-slate-400 hover:text-blue-500 transition-colors" onclick="window.editTask(${i})" title="Editar">
        <i data-lucide="edit-2" class="w-4 h-4"></i>
      </button>
      <button class="text-slate-400 hover:text-red-500 transition-colors" onclick="window.deleteTask(${i})" title="Excluir">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    `;
    
    container.appendChild(div);
  });
  
  const countEl = document.getElementById("tasks-count");
  if (countEl) countEl.textContent = `${completed} / ${projectTasks.length} concluídas`;
  
  updateTasksBadge(completed, projectTasks.length);
  
  // Re-inicializa os ícones do Lucide apenas no container das tarefas
  import('lucide').then((mod) => {
     mod.createIcons({ icons: mod.icons, nameAttr: 'data-lucide', root: container });
  });
}



function updateTasksBadge(completed, total) {
  const badge = document.getElementById("tasks-badge");
  if (!badge) return;
  const uncompleted = total - completed;
  if (uncompleted > 0) {
    badge.textContent = uncompleted > 99 ? '99+' : uncompleted;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

/**
 * Operações Públicas expostas via window para compatibilidade com onclick inline
 */
window.toggleTask = function(index) {
  projectTasks[index].done = !projectTasks[index].done;
  saveTasks();
};

window.deleteTask = function(index) {
  projectTasks.splice(index, 1);
  saveTasks();
};

window.editTask = async function(index) {
  const task = projectTasks[index];
  const newTitle = await customPrompt("Editar Tarefa", "Corrija o texto da tarefa:", task.title);
  if (newTitle !== null && newTitle.trim() !== "") {
    projectTasks[index].title = newTitle.trim();
    saveTasks();
  }
};


window.clearCompletedTasks = function() {
  projectTasks = projectTasks.filter(t => !t.done);
  saveTasks();
};

window.addNewTask = function(title) {
  if (!title) return;
  projectTasks.push({ title, done: false, id: Date.now() });
  saveTasks();
};

export function toggleTasksDrawer() {
  const overlay = document.getElementById("tasks-drawer-overlay");
  const drawer = document.getElementById("tasks-drawer");
  if (!overlay || !drawer) return;

  const isActive = drawer.classList.toggle("active");
  overlay.classList.toggle("active", isActive);
  
  if (isActive) {
    renderTasks();
  }
}

