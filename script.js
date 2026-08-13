const STORAGE_KEY = "hybridPlannerData_v1";

const todayISO = () => {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
};

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
}

const defaultData = {
  tasks: [
    { id: crypto.randomUUID(), title: "Finalizar relatório do projeto", date: todayISO(), priority: "alta", category: "trabalho", done: false },
    { id: crypto.randomUUID(), title: "Estudar 1h de inglês", date: todayISO(), priority: "media", category: "estudos", done: false },
    { id: crypto.randomUUID(), title: "Treino na academia", date: todayISO(), priority: "media", category: "saude", done: false },
    { id: crypto.randomUUID(), title: "Reunião com cliente", date: addDays(1), priority: "alta", category: "trabalho", done: false },
    { id: crypto.randomUUID(), title: "Organizar finanças pessoais", date: addDays(2), priority: "baixa", category: "pessoal", done: false },
    { id: crypto.randomUUID(), title: "Planejar conteúdo da semana", date: addDays(3), priority: "media", category: "trabalho", done: false },
    { id: crypto.randomUUID(), title: "Ler 20 páginas", date: addDays(4), priority: "baixa", category: "pessoal", done: false }
  ],
  goals: [
    { id: crypto.randomUUID(), title: "Montar reserva de emergência", progress: 55, deadline: addDays(90) },
    { id: crypto.randomUUID(), title: "Concluir projeto principal", progress: 40, deadline: addDays(45) },
    { id: crypto.randomUUID(), title: "Melhorar nível de inglês", progress: 28, deadline: addDays(120) }
  ],
  habits: [
    { id: crypto.randomUUID(), title: "Beber água", history: {} },
    { id: crypto.randomUUID(), title: "Ler 20 minutos", history: {} },
    { id: crypto.randomUUID(), title: "Revisar prioridades do dia", history: {} }
  ],
  notes: ""
};

let data = loadData();
let taskFilter = "todas";

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.tasks = (parsed.tasks || []).map(task => ({
        category: "pessoal",
        ...task
      }));
      return parsed;
    }
    return structuredClone(defaultData);
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

function formatLongDate(dateString) {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  }).format(new Date(y, m - 1, d));
}

function updateClock() {
  const now = new Date();
  document.getElementById("currentTime").textContent =
    new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(now);
}

function setDateLabels() {
  const now = new Date();
  document.getElementById("todayLabel").textContent =
    new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(now);

  const start = new Date(now);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  document.getElementById("weekLabel").textContent =
    `${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} – ${end.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
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

function renderDashboard() {
  const today = todayISO();
  const todayTasks = data.tasks.filter(t => t.date === today);
  const completedToday = todayTasks.filter(t => t.done).length;
  const tasksPercent = todayTasks.length ? Math.round((completedToday / todayTasks.length) * 100) : 0;

  const habitsDoneToday = data.habits.filter(h => h.history?.[today]).length;
  const habitsPercentToday = data.habits.length ? Math.round((habitsDoneToday / data.habits.length) * 100) : 0;

  const averageGoals = data.goals.length
    ? Math.round(data.goals.reduce((sum, g) => sum + Number(g.progress || 0), 0) / data.goals.length)
    : 0;

  document.getElementById("todayTasksCount").textContent = todayTasks.length;
  document.getElementById("activeGoalsCount").textContent = data.goals.filter(g => g.progress < 100).length;
  document.getElementById("habitsTodayCount").textContent = `${habitsDoneToday}/${data.habits.length}`;
  const streak = calculateStreak();
  document.getElementById("streakCount").textContent = `${streak} ${streak === 1 ? "dia" : "dias"}`;

  renderAchievementCharts(tasksPercent, habitsPercentToday, averageGoals);
  renderUpcomingCalendar();

  const dashTasks = document.getElementById("dashboardTasks");
  if (!todayTasks.length) {
    dashTasks.innerHTML = `<div class="empty-state">Nenhuma tarefa para hoje. Aproveite para planejar seu dia ✨</div>`;
  } else {
    dashTasks.innerHTML = todayTasks.slice(0, 6).map(task => taskHTML(task, true)).join("");
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

function renderAchievementCharts(tasksPercent, habitsPercentToday, averageGoals) {
  const categories = ["trabalho", "pessoal", "estudos", "saude"];
  const labels = {
    trabalho: "Trabalho",
    pessoal: "Pessoal",
    estudos: "Estudos",
    saude: "Saúde"
  };

  const categoryHTML = categories.map(category => {
    const items = data.tasks.filter(task => task.category === category);
    const completed = items.filter(task => task.done).length;
    const percent = items.length ? Math.round((completed / items.length) * 100) : 0;
    return `
      <div class="category-row">
        <div class="category-label">${labels[category]}</div>
        <div class="category-bar"><span style="width:${percent}%"></span></div>
        <div class="category-value">${percent}%</div>
      </div>
    `;
  }).join("");

  document.getElementById("dashboardCharts").innerHTML = `
    <div class="achievement-metrics">
      <div class="metric-tile">
        <small>Tarefas concluídas hoje</small>
        <strong>${tasksPercent}%</strong>
        <div class="mini-progress"><span style="width:${tasksPercent}%"></span></div>
      </div>
      <div class="metric-tile">
        <small>Hábitos concluídos hoje</small>
        <strong>${habitsPercentToday}%</strong>
        <div class="mini-progress"><span style="width:${habitsPercentToday}%"></span></div>
      </div>
      <div class="metric-tile">
        <small>Progresso médio das metas</small>
        <strong>${averageGoals}%</strong>
        <div class="mini-progress"><span style="width:${averageGoals}%"></span></div>
      </div>
    </div>
    <div class="category-chart">
      ${categoryHTML}
    </div>
  `;
}

function renderUpcomingCalendar() {
  const container = document.getElementById("upcomingCalendar");
  const upcoming = data.tasks
    .filter(task => !task.done && task.date >= todayISO())
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!upcoming.length) {
    container.innerHTML = `<div class="empty-state">Nenhuma próxima tarefa cadastrada.</div>`;
    return;
  }

  const groups = upcoming.reduce((acc, task) => {
    acc[task.date] ||= [];
    acc[task.date].push(task);
    return acc;
  }, {});

  const html = Object.entries(groups).map(([date, tasks]) => `
    <div class="agenda-group">
      <div class="agenda-date">
        <strong>${formatLongDate(date)}</strong>
        <span>${tasks.length} ${tasks.length === 1 ? "tarefa" : "tarefas"}</span>
      </div>
      ${tasks.map(task => `
        <div class="agenda-item">
          <span class="agenda-dot"></span>
          <div class="agenda-content">
            <strong>${escapeHTML(task.title)}</strong>
            <small>
              <span class="badge ${task.category}">${task.category}</span>
              <span class="badge ${task.priority}">${task.priority}</span>
            </small>
          </div>
        </div>
      `).join("")}
    </div>
  `).join("");

  container.innerHTML = `<div class="upcoming-calendar">${html}</div>`;
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
          <span class="badge ${task.category}">${task.category}</span>
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

function renderNotes() {
  const area = document.getElementById("notesArea");
  if (area.value !== data.notes) area.value = data.notes || "";
  document.getElementById("charCount").textContent = `${area.value.length} caracteres`;
}

function renderAll() {
  setDateLabels();
  updateClock();
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
    category: document.getElementById("taskCategory").value,
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

setInterval(updateClock, 1000 * 30);
renderAll();
