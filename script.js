const STORAGE_KEY = "personalPlannerData_v1";

const todayISO = () => {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
};

const defaultData = {
  tasks: [
    { id: crypto.randomUUID(), title: "Planejar as 3 prioridades do dia", date: todayISO(), priority: "alta", done: false },
    { id: crypto.randomUUID(), title: "Separar 30 minutos para um projeto pessoal", date: todayISO(), priority: "media", done: false }
  ],
  goals: [
    { id: crypto.randomUUID(), title: "Organizar minha rotina", progress: 35, deadline: addDays(30) },
    { id: crypto.randomUUID(), title: "Concluir um projeto pessoal", progress: 15, deadline: addDays(60) }
  ],
  habits: [
    { id: crypto.randomUUID(), title: "Beber água", history: {} },
    { id: crypto.randomUUID(), title: "Ler 20 minutos", history: {} }
  ],
  notes: ""
};

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
}

let data = loadData();
let taskFilter = "todas";

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : structuredClone(defaultData);
  } catch {
    return structuredClone(defaultData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  renderAll();
}

function escapeHTML(value = "") {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function formatDate(dateString) {
  if (!dateString) return "Sem prazo";
  const [y, m, d] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(new Date(y, m - 1, d));
}

function setDateLabels() {
  const now = new Date();
  document.getElementById("todayLabel").textContent =
    new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(now);

  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia 👋" : hour < 18 ? "Boa tarde 👋" : "Boa noite 👋";
  document.getElementById("greeting").textContent = greeting;

  const start = new Date(now);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  document.getElementById("weekLabel").textContent =
    `${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} – ${end.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
}

function renderDashboard() {
  const today = todayISO();
  const todayTasks = data.tasks.filter(t => t.date === today);
  const completed = todayTasks.filter(t => t.done).length;
  const percent = todayTasks.length ? Math.round((completed / todayTasks.length) * 100) : 0;

  document.getElementById("todayTasksCount").textContent = todayTasks.length;
  document.getElementById("activeGoalsCount").textContent = data.goals.filter(g => g.progress < 100).length;

  const habitsDone = data.habits.filter(h => h.history?.[today]).length;
  document.getElementById("habitsTodayCount").textContent = `${habitsDone}/${data.habits.length}`;

  const streak = calculateStreak();
  document.getElementById("streakCount").textContent = `${streak} ${streak === 1 ? "dia" : "dias"}`;

  document.getElementById("progressPercent").textContent = `${percent}%`;
  document.getElementById("progressRing").style.background =
    `conic-gradient(#818cf8 ${percent * 3.6}deg, rgba(255,255,255,.15) 0deg)`;

  const dashTasks = document.getElementById("dashboardTasks");
  if (!todayTasks.length) {
    dashTasks.innerHTML = `<div class="empty-state">Nenhuma tarefa para hoje. Aproveite para planejar seu dia ✨</div>`;
  } else {
    dashTasks.innerHTML = todayTasks.slice(0, 5).map(task => taskHTML(task, true)).join("");
  }

  const dashHabits = document.getElementById("dashboardHabits");
  if (!data.habits.length) {
    dashHabits.innerHTML = `<div class="empty-state">Adicione um hábito para começar.</div>`;
  } else {
    dashHabits.innerHTML = data.habits.slice(0, 5).map(habit => habitHTML(habit, true)).join("");
  }

  const goalsPreview = document.getElementById("dashboardGoals");
  if (!data.goals.length) {
    goalsPreview.innerHTML = `<div class="empty-state">Você ainda não criou metas.</div>`;
  } else {
    goalsPreview.innerHTML = data.goals.slice(0, 3).map(goal => goalHTML(goal, true)).join("");
  }
}

function taskHTML(task, compact = false) {
  return `
    <div class="task-row ${task.done ? "done" : ""}">
      <button class="check-button ${task.done ? "checked" : ""}" data-toggle-task="${task.id}" aria-label="Concluir tarefa">
        ${task.done ? "✓" : ""}
      </button>
      <div class="task-content">
        <div class="task-title">${escapeHTML(task.title)}</div>
        <div class="task-meta">
          <span>${formatDate(task.date)}</span>
          <span class="badge ${task.priority}">${task.priority}</span>
        </div>
      </div>
      ${compact ? "" : `<button class="delete-button" data-delete-task="${task.id}" title="Excluir">✕</button>`}
    </div>
  `;
}

function renderTasks() {
  let tasks = [...data.tasks].sort((a, b) => a.date.localeCompare(b.date));

  if (taskFilter === "pendentes") tasks = tasks.filter(t => !t.done);
  if (taskFilter === "concluidas") tasks = tasks.filter(t => t.done);

  const container = document.getElementById("taskList");
  container.innerHTML = tasks.length
    ? tasks.map(task => taskHTML(task)).join("")
    : `<div class="empty-state">Nenhuma tarefa nessa categoria.</div>`;
}

function goalHTML(goal, compact = false) {
  const progress = Math.max(0, Math.min(100, Number(goal.progress) || 0));
  return `
    <article class="goal-card">
      <h4>${escapeHTML(goal.title)}</h4>
      <div class="goal-meta">
        <span>Prazo: ${formatDate(goal.deadline)}</span>
        <strong>${progress}%</strong>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${progress}%"></div>
      </div>
      ${compact ? "" : `
        <div class="goal-actions">
          <label>
            <span class="eyebrow">Progresso</span>
            <input type="number" min="0" max="100" value="${progress}" data-goal-progress="${goal.id}" />
          </label>
          <button class="delete-button" data-delete-goal="${goal.id}">Excluir</button>
        </div>
      `}
    </article>
  `;
}

function renderGoals() {
  const container = document.getElementById("goalsGrid");
  container.innerHTML = data.goals.length
    ? data.goals.map(goal => goalHTML(goal)).join("")
    : `<div class="empty-state">Crie sua primeira meta e acompanhe o progresso.</div>`;
}

function getLastSevenDays() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const tz = d.getTimezoneOffset() * 60000;
    const iso = new Date(d - tz).toISOString().slice(0, 10);
    days.push({
      iso,
      label: new Intl.DateTimeFormat("pt-BR", { weekday: "narrow" }).format(d)
    });
  }
  return days;
}

function habitHTML(habit, compact = false) {
  const today = todayISO();
  const done = Boolean(habit.history?.[today]);
  const days = getLastSevenDays();

  return `
    <div class="habit-row">
      <div class="habit-content">
        <div class="habit-title">${escapeHTML(habit.title)}</div>
        ${compact ? "" : `
          <div class="habit-days">
            ${days.map(day => `<span class="day-dot ${habit.history?.[day.iso] ? "done" : ""}" title="${day.iso}">${day.label}</span>`).join("")}
          </div>
        `}
      </div>
      <button class="habit-toggle ${done ? "done" : ""}" data-toggle-habit="${habit.id}">
        ${done ? "Feito ✓" : "Marcar hoje"}
      </button>
      ${compact ? "" : `<button class="delete-button" data-delete-habit="${habit.id}">✕</button>`}
    </div>
  `;
}

function renderHabits() {
  const container = document.getElementById("habitList");
  container.innerHTML = data.habits.length
    ? data.habits.map(habit => habitHTML(habit)).join("")
    : `<div class="empty-state">Adicione um hábito para acompanhar sua consistência.</div>`;
}

function calculateStreak() {
  if (!data.habits.length) return 0;

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const tz = d.getTimezoneOffset() * 60000;
    const iso = new Date(d - tz).toISOString().slice(0, 10);
    const anyDone = data.habits.some(h => h.history?.[iso]);

    if (anyDone) streak++;
    else if (i > 0 || !anyDone) break;
  }
  return streak;
}

function renderNotes() {
  const area = document.getElementById("notesArea");
  if (area.value !== data.notes) area.value = data.notes || "";
  document.getElementById("charCount").textContent = `${area.value.length} caracteres`;
}

function renderAll() {
  setDateLabels();
  renderDashboard();
  renderTasks();
  renderGoals();
  renderHabits();
  renderNotes();
}

function openModal(id) {
  document.getElementById(id).classList.add("open");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

function switchSection(id) {
  document.querySelectorAll(".page-section").forEach(s => s.classList.toggle("active", s.id === id));
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.section === id));
  const activeButton = document.querySelector(`.nav-item[data-section="${id}"] span`);
  document.getElementById("pageTitle").textContent = activeButton ? activeButton.textContent : "Planner";
  document.getElementById("sidebar").classList.remove("open");
}

document.addEventListener("click", event => {
  const target = event.target.closest("button");
  if (!target) return;

  if (target.dataset.section) switchSection(target.dataset.section);
  if (target.dataset.go) switchSection(target.dataset.go);

  if (target.id === "menuButton") {
    document.getElementById("sidebar").classList.toggle("open");
  }

  if (target.id === "quickAddButton" || target.id === "addTaskButton") {
    document.getElementById("taskDate").value = todayISO();
    openModal("taskModal");
  }

  if (target.id === "addGoalButton") {
    document.getElementById("goalDeadline").value = addDays(30);
    openModal("goalModal");
  }

  if (target.id === "addHabitButton") openModal("habitModal");
  if (target.dataset.close) closeModal(target.dataset.close);

  if (target.dataset.toggleTask) {
    const task = data.tasks.find(t => t.id === target.dataset.toggleTask);
    if (task) task.done = !task.done;
    saveData();
  }

  if (target.dataset.deleteTask) {
    data.tasks = data.tasks.filter(t => t.id !== target.dataset.deleteTask);
    saveData();
  }

  if (target.dataset.toggleHabit) {
    const habit = data.habits.find(h => h.id === target.dataset.toggleHabit);
    if (habit) {
      habit.history ||= {};
      const today = todayISO();
      habit.history[today] = !habit.history[today];
      if (!habit.history[today]) delete habit.history[today];
    }
    saveData();
  }

  if (target.dataset.deleteHabit) {
    data.habits = data.habits.filter(h => h.id !== target.dataset.deleteHabit);
    saveData();
  }

  if (target.dataset.deleteGoal) {
    data.goals = data.goals.filter(g => g.id !== target.dataset.deleteGoal);
    saveData();
  }

  if (target.dataset.filter) {
    taskFilter = target.dataset.filter;
    document.querySelectorAll(".filter-button").forEach(btn =>
      btn.classList.toggle("active", btn.dataset.filter === taskFilter)
    );
    renderTasks();
  }
});

document.getElementById("taskForm").addEventListener("submit", event => {
  event.preventDefault();
  data.tasks.push({
    id: crypto.randomUUID(),
    title: document.getElementById("taskTitle").value.trim(),
    date: document.getElementById("taskDate").value,
    priority: document.getElementById("taskPriority").value,
    done: false
  });
  event.target.reset();
  closeModal("taskModal");
  saveData();
});

document.getElementById("goalForm").addEventListener("submit", event => {
  event.preventDefault();
  data.goals.push({
    id: crypto.randomUUID(),
    title: document.getElementById("goalTitle").value.trim(),
    progress: Number(document.getElementById("goalProgress").value),
    deadline: document.getElementById("goalDeadline").value
  });
  event.target.reset();
  closeModal("goalModal");
  saveData();
});

document.getElementById("habitForm").addEventListener("submit", event => {
  event.preventDefault();
  data.habits.push({
    id: crypto.randomUUID(),
    title: document.getElementById("habitTitle").value.trim(),
    history: {}
  });
  event.target.reset();
  closeModal("habitModal");
  saveData();
});

document.addEventListener("change", event => {
  if (event.target.dataset.goalProgress) {
    const goal = data.goals.find(g => g.id === event.target.dataset.goalProgress);
    if (goal) {
      goal.progress = Math.max(0, Math.min(100, Number(event.target.value) || 0));
      saveData();
    }
  }
});

let noteTimer;
document.getElementById("notesArea").addEventListener("input", event => {
  document.getElementById("saveStatus").textContent = "Salvando...";
  document.getElementById("charCount").textContent = `${event.target.value.length} caracteres`;

  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => {
    data.notes = event.target.value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    document.getElementById("saveStatus").textContent = "Salvo automaticamente";
  }, 350);
});

document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) backdrop.classList.remove("open");
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    document.querySelectorAll(".modal-backdrop.open").forEach(m => m.classList.remove("open"));
  }
});

renderAll();
