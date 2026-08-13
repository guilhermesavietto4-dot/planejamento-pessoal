const STORAGE_KEY = "planejamento_agenda_v1";

const AREA_NAMES = {
  profissional: "Profissional",
  pessoal: "Pessoal",
  estudos: "Estudos",
  saude: "Saúde"
};

const AREA_COLORS = {
  profissional: "#3b82f6",
  pessoal: "#f59e0b",
  estudos: "#8b5cf6",
  saude: "#22c55e"
};

function uid() {
  return crypto.randomUUID();
}

function localISO(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date - offset).toISOString().slice(0, 10);
}

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localISO(d);
}

function dateFromISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(iso, options = { day: "2-digit", month: "short" }) {
  return new Intl.DateTimeFormat("pt-BR", options).format(dateFromISO(iso));
}

function formatLongDate(iso) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  }).format(dateFromISO(iso));
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

const defaultData = {
  items: [
    {
      id: uid(),
      title: "Reunião com cliente",
      type: "compromisso",
      area: "profissional",
      date: localISO(),
      time: "09:00",
      duration: 60,
      priority: "alta",
      projectId: "p1",
      notes: "",
      done: false
    },
    {
      id: uid(),
      title: "Finalizar apresentação do projeto",
      type: "tarefa",
      area: "profissional",
      date: localISO(),
      time: "11:00",
      duration: 60,
      priority: "alta",
      projectId: "p1",
      notes: "",
      done: false
    },
    {
      id: uid(),
      title: "Responder e-mails importantes",
      type: "tarefa",
      area: "profissional",
      date: localISO(),
      time: "14:30",
      duration: 60,
      priority: "media",
      projectId: "",
      notes: "",
      done: false
    },
    {
      id: uid(),
      title: "Academia",
      type: "compromisso",
      area: "saude",
      date: localISO(),
      time: "18:00",
      duration: 60,
      priority: "media",
      projectId: "",
      notes: "",
      done: false
    },
    {
      id: uid(),
      title: "Ler 20 páginas",
      type: "tarefa",
      area: "pessoal",
      date: localISO(),
      time: "20:00",
      duration: 60,
      priority: "baixa",
      projectId: "",
      notes: "",
      done: false
    },
    {
      id: uid(),
      title: "Planejar conteúdo da semana",
      type: "tarefa",
      area: "profissional",
      date: addDays(1),
      time: "10:00",
      duration: 60,
      priority: "media",
      projectId: "p1",
      notes: "",
      done: false
    },
    {
      id: uid(),
      title: "Estudar inglês",
      type: "tarefa",
      area: "estudos",
      date: addDays(1),
      time: "15:00",
      duration: 60,
      priority: "media",
      projectId: "p2",
      notes: "",
      done: false
    },
    {
      id: uid(),
      title: "Revisar orçamento pessoal",
      type: "tarefa",
      area: "pessoal",
      date: addDays(2),
      time: "19:00",
      duration: 60,
      priority: "media",
      projectId: "",
      notes: "",
      done: false
    },
    {
      id: uid(),
      title: "Enviar relatório semanal",
      type: "tarefa",
      area: "profissional",
      date: addDays(-2),
      time: "17:00",
      duration: 60,
      priority: "alta",
      projectId: "p1",
      notes: "",
      done: false
    }
  ],
  projects: [
    { id: "p1", title: "Projeto novo site", area: "profissional", progress: 75, deadline: addDays(35) },
    { id: "p2", title: "Inglês profissional", area: "estudos", progress: 40, deadline: addDays(90) }
  ],
  goals: [
    { id: uid(), title: "Economizar R$ 10.000", progress: 60, deadline: addDays(180) },
    { id: uid(), title: "Ler 12 livros este ano", progress: 40, deadline: addDays(150) }
  ],
  habits: [
    { id: uid(), title: "Beber 2L de água", history: {} },
    { id: uid(), title: "Exercitar-se", history: {} },
    { id: uid(), title: "Ler todos os dias", history: {} }
  ],
  notes: ""
};

let data = loadData();
let selectedDate = localISO();
let calendarCursor = dateFromISO(selectedDate);
let taskFilter = "todas";
let editingItemId = null;

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

function openModal(id) {
  document.getElementById(id).classList.add("open");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("open");
  if (id === "itemModal") {
    editingItemId = null;
    const warning = document.getElementById("conflictWarning");
    if (warning) {
      warning.hidden = true;
      warning.textContent = "";
    }
  }
}

function setPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.toggle("active", page.id === pageId);
  });

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  const label = document.querySelector(`[data-page="${pageId}"] span`);
  document.getElementById("pageTitle").textContent = label
    ? label.textContent
    : pageId.charAt(0).toUpperCase() + pageId.slice(1);

  document.getElementById("sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setHeaderDate() {
  document.getElementById("todayLabel").textContent =
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(new Date());
}

function sortedItems(items) {
  return [...items].sort((a, b) => {
    return `${a.date} ${a.time || "23:59"}`.localeCompare(`${b.date} ${b.time || "23:59"}`);
  });
}

function getItemsByDate(date) {
  return sortedItems(data.items.filter(item => item.date === date));
}

function endTime(item) {
  if (!item.time) return "";
  const start = minutesFromTime(item.time);
  const end = start + Number(item.duration || 60);
  const hours = Math.floor((end % (24 * 60)) / 60).toString().padStart(2, "0");
  const minutes = (end % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function itemRow(item, showDelete = false) {
  return `
    <div class="agenda-item">
      <span class="agenda-time">
        ${item.time || "--:--"}
        ${item.time ? `<span class="time-detail">até ${endTime(item)}</span>` : ""}
      </span>
      <span class="agenda-dot" style="background:${AREA_COLORS[item.area]}"></span>
      <div class="agenda-content">
        <strong>${escapeHTML(item.title)}</strong>
        <small>
          <span class="tag ${item.area}">${AREA_NAMES[item.area]}</span>
          <span>${item.type === "compromisso" ? "Compromisso" : "Tarefa"}</span>
          <span>${item.duration || 60} min</span>
        </small>
      </div>
      <button class="check-button ${item.done ? "done" : ""}" data-toggle-item="${item.id}">
        ${item.done ? "✓" : ""}
      </button>
      <div class="item-actions">
        <button class="edit-button" data-edit-item="${item.id}" title="Editar ou reagendar">Editar</button>
        ${showDelete ? `<button class="delete-button" data-delete-item="${item.id}">✕</button>` : ""}
      </div>
    </div>
  `;
}
function renderTodayAgenda() {
  const items = getItemsByDate(localISO()).filter(item => !item.done);
  const container = document.getElementById("todayAgenda");

  container.innerHTML = items.length
    ? items.map(item => itemRow(item)).join("")
    : `<div class="empty">Nenhum compromisso pendente para hoje.</div>`;
}

function minutesFromTime(time) {
  if (!time) return 24 * 60;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function renderNextAction() {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let candidates = sortedItems(
    data.items.filter(item =>
      !item.done &&
      item.date >= localISO()
    )
  );

  let next = candidates.find(item => {
    if (item.date > localISO()) return true;
    return minutesFromTime(item.time) >= nowMinutes;
  });

  if (!next) next = candidates[0];

  const container = document.getElementById("nextAction");

  if (!next) {
    container.innerHTML = `<div class="empty">Você não tem próximas ações pendentes.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="next-box">
      <div class="next-main">
        <time>${next.date === localISO() ? (next.time || "Hoje") : formatLongDate(next.date)}</time>
        <strong>${escapeHTML(next.title)}</strong>
      </div>

      <div class="next-meta">
        <span>Prioridade: <strong>${next.priority}</strong></span>
        <span>Área: <strong>${AREA_NAMES[next.area]}</strong></span>
        <span>Duração: <strong>${next.duration || 60} min</strong></span>
      </div>

      <div class="next-actions">
        <button class="primary-button" data-toggle-item="${next.id}">✓ Concluir</button>
        <button class="secondary-button" data-edit-item="${next.id}">Editar / reagendar</button>
      </div>
    </div>
  `;
}

function buildCalendar(containerId, cursorDate) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const year = cursorDate.getFullYear();
  const month = cursorDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const headers = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

  let html = headers.map(day => `<div class="calendar-head">${day}</div>`).join("");

  for (let i = 0; i < 42; i++) {
    const date = new Date(year, month, 1 - offset + i);
    const iso = localISO(date);
    const dayItems = data.items.filter(item => item.date === iso);
    const inMonth = date.getMonth() === month;

    html += `
      <div
        class="calendar-day
          ${inMonth ? "" : "other"}
          ${iso === localISO() ? "today" : ""}
          ${iso === selectedDate ? "selected" : ""}"
        data-select-date="${iso}"
      >
        <span>${date.getDate()}</span>
        <div class="day-markers">
          ${dayItems.slice(0, 3).map(() => `<span class="day-marker"></span>`).join("")}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function renderCalendars() {
  buildCalendar("dashboardCalendar", calendarCursor);
  buildCalendar("fullCalendar", calendarCursor);

  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric"
  }).format(calendarCursor);

  document.getElementById("calendarMonthLabel").textContent = monthLabel;
  document.getElementById("fullCalendarTitle").textContent = monthLabel;
}

function renderSelectedDate() {
  const selectedItems = getItemsByDate(selectedDate);
  const label = formatLongDate(selectedDate);

  document.getElementById("selectedDateTitle").textContent = label;
  document.getElementById("agendaSelectedTitle").textContent = label;

  const html = selectedItems.length
    ? selectedItems.map(item => itemRow(item, true)).join("")
    : `<div class="empty">Nenhum compromisso ou tarefa para ${label}.</div>`;

  document.getElementById("selectedDayItems").innerHTML = html;
  document.getElementById("agendaSelectedItems").innerHTML = html;
}

function priorityScore(item) {
  const priority = { alta: 3, media: 2, baixa: 1 }[item.priority] || 0;
  const dateBoost = item.date === localISO() ? 3 : item.date < localISO() ? 4 : 0;
  const timeBoost = item.time ? 1 : 0;
  return priority + dateBoost + timeBoost;
}

function renderPriorities() {
  const items = data.items
    .filter(item => !item.done && item.date <= addDays(1))
    .sort((a, b) => priorityScore(b) - priorityScore(a))
    .slice(0, 3);

  const container = document.getElementById("prioritiesList");

  container.innerHTML = items.length
    ? items.map((item, index) => `
      <div class="priority-item">
        <span class="priority-number">${index + 1}</span>
        <strong>${escapeHTML(item.title)}</strong>
        <time>${item.time || formatDate(item.date)}</time>
      </div>
    `).join("")
    : `<div class="empty">Nenhuma prioridade pendente.</div>`;
}

function renderOverdue() {
  const overdue = sortedItems(
    data.items.filter(item => !item.done && item.date < localISO())
  );

  document.getElementById("overdueCount").textContent = overdue.length;

  document.getElementById("overdueList").innerHTML = overdue.length
    ? overdue.slice(0, 6).map(item => itemRow(item, true)).join("")
    : `<div class="empty">Nenhuma pendência atrasada.</div>`;
}

function renderSummary() {
  const todayItems = getItemsByDate(localISO());
  const todayDone = todayItems.filter(item => item.done).length;
  const taskPercent = todayItems.length ? Math.round((todayDone / todayItems.length) * 100) : 0;

  const habitsDone = data.habits.filter(habit => habit.history?.[localISO()]).length;
  const habitPercent = data.habits.length
    ? Math.round((habitsDone / data.habits.length) * 100)
    : 0;

  document.getElementById("daySummary").innerHTML = `
    <div class="summary-line">
      <div class="summary-top">
        <span>Itens concluídos</span>
        <strong>${todayDone}/${todayItems.length}</strong>
      </div>
      <div class="mini-progress"><span style="width:${taskPercent}%"></span></div>
    </div>

    <div class="summary-line">
      <div class="summary-top">
        <span>Hábitos cumpridos</span>
        <strong>${habitsDone}/${data.habits.length}</strong>
      </div>
      <div class="mini-progress"><span style="width:${habitPercent}%;background:#16a36a"></span></div>
    </div>
  `;
}

function renderGoals() {
  const preview = document.getElementById("goalsPreview");

  preview.innerHTML = data.goals.length
    ? data.goals.slice(0, 3).map(goal => `
      <div class="goal-mini">
        <div class="goal-mini-top">
          <strong>${escapeHTML(goal.title)}</strong>
          <span>${goal.progress}%</span>
        </div>
        <div class="mini-progress">
          <span style="width:${goal.progress}%"></span>
        </div>
      </div>
    `).join("")
    : `<div class="empty">Nenhuma meta cadastrada.</div>`;

  const grid = document.getElementById("goalGrid");

  grid.innerHTML = data.goals.length
    ? data.goals.map(goal => `
      <article class="project-card">
        <h3>${escapeHTML(goal.title)}</h3>
        <p>Prazo: ${formatDate(goal.deadline, { day: "2-digit", month: "long", year: "numeric" })}</p>

        <div class="mini-progress" style="margin-top:12px">
          <span style="width:${goal.progress}%"></span>
        </div>

        <div class="project-footer">
          <input
            type="number"
            min="0"
            max="100"
            value="${goal.progress}"
            data-goal-progress="${goal.id}"
          />
          <button class="delete-button" data-delete-goal="${goal.id}">Excluir</button>
        </div>
      </article>
    `).join("")
    : `<div class="empty">Nenhuma meta cadastrada.</div>`;
}

function renderHabits() {
  const today = localISO();

  const mini = habit => `
    <div class="habit-mini">
      <strong>${escapeHTML(habit.title)}</strong>
      <span class="habit-status">${habit.history?.[today] ? "Feito ✓" : "Pendente"}</span>
    </div>
  `;

  document.getElementById("habitsPreview").innerHTML = data.habits.length
    ? data.habits.slice(0, 4).map(mini).join("")
    : `<div class="empty">Nenhum hábito cadastrado.</div>`;

  document.getElementById("habitList").innerHTML = data.habits.length
    ? data.habits.map(habit => `
      <div class="habit-row">
        <strong style="flex:1;font-size:11px">${escapeHTML(habit.title)}</strong>
        <button
          class="secondary-button"
          data-toggle-habit="${habit.id}"
          style="padding:7px 10px;font-size:9px"
        >
          ${habit.history?.[today] ? "Feito ✓" : "Marcar hoje"}
        </button>
        <button class="delete-button" data-delete-habit="${habit.id}">✕</button>
      </div>
    `).join("")
    : `<div class="empty">Nenhum hábito cadastrado.</div>`;
}

function renderTasks() {
  let items = sortedItems(
    data.items.filter(item => item.type === "tarefa")
  );

  if (taskFilter === "pendentes") {
    items = items.filter(item => !item.done);
  }

  if (taskFilter === "concluidas") {
    items = items.filter(item => item.done);
  }

  document.getElementById("taskList").innerHTML = items.length
    ? items.map(item => `
      <div class="task-row ${item.done ? "done" : ""}">
        <button
          class="check-button ${item.done ? "done" : ""}"
          data-toggle-item="${item.id}"
        >
          ${item.done ? "✓" : ""}
        </button>

        <div class="task-content">
          <span class="task-title">${escapeHTML(item.title)}</span>
          <div class="task-meta">
            <span>${formatDate(item.date)}</span>
            <span>${item.time || "Sem horário"}</span>
            <span class="tag ${item.area}">${AREA_NAMES[item.area]}</span>
          </div>
        </div>

        <div class="item-actions">
          <button class="edit-button" data-edit-item="${item.id}">Editar</button>
          <div class="item-actions">
            <button class="edit-button" data-edit-item="${item.id}">Editar</button>
            <button class="delete-button" data-delete-item="${item.id}">✕</button>
          </div>
        </div>
      </div>
    `).join("")
    : `<div class="empty">Nenhuma tarefa nessa categoria.</div>`;
}

function renderProjects() {
  document.getElementById("projectGrid").innerHTML = data.projects.length
    ? data.projects.map(project => `
      <article class="project-card">
        <h3>${escapeHTML(project.title)}</h3>
        <p>${AREA_NAMES[project.area]} • Prazo ${formatDate(project.deadline)}</p>

        <div class="mini-progress" style="margin-top:12px">
          <span style="width:${project.progress}%"></span>
        </div>

        <div class="project-footer">
          <span style="font-size:10px">${project.progress}%</span>
          <button class="delete-button" data-delete-project="${project.id}">Excluir</button>
        </div>
      </article>
    `).join("")
    : `<div class="empty">Nenhum projeto cadastrado.</div>`;

  const select = document.getElementById("itemProject");
  const currentValue = select.value;

  select.innerHTML = `
    <option value="">Sem projeto</option>
    ${data.projects.map(project => `
      <option value="${project.id}">${escapeHTML(project.title)}</option>
    `).join("")}
  `;

  select.value = currentValue;
}

function renderNotes() {
  const textarea = document.getElementById("notesArea");

  if (textarea.value !== data.notes) {
    textarea.value = data.notes || "";
  }

  document.getElementById("charCount").textContent =
    `${textarea.value.length} caracteres`;
}

function itemInterval(item) {
  if (!item.time) return null;
  const start = minutesFromTime(item.time);
  return {
    start,
    end: start + Number(item.duration || 60)
  };
}

function findConflicts(candidate, ignoreId = null) {
  const candidateInterval = itemInterval(candidate);
  if (!candidateInterval) return [];

  return data.items.filter(item => {
    if (item.id === ignoreId || item.done || item.date !== candidate.date || !item.time) {
      return false;
    }

    const interval = itemInterval(item);
    return candidateInterval.start < interval.end && candidateInterval.end > interval.start;
  });
}

function formCandidate() {
  return {
    title: document.getElementById("itemTitle").value.trim(),
    type: document.getElementById("itemType").value,
    area: document.getElementById("itemArea").value,
    date: document.getElementById("itemDate").value,
    time: document.getElementById("itemTime").value,
    duration: Number(document.getElementById("itemDuration").value) || 60,
    priority: document.getElementById("itemPriority").value,
    projectId: document.getElementById("itemProject").value,
    notes: document.getElementById("itemNotes").value.trim()
  };
}

function updateConflictWarning() {
  const warning = document.getElementById("conflictWarning");
  const candidate = formCandidate();

  if (!candidate.date || !candidate.time) {
    warning.hidden = true;
    warning.textContent = "";
    return;
  }

  const conflicts = findConflicts(candidate, editingItemId);

  if (!conflicts.length) {
    warning.hidden = true;
    warning.textContent = "";
    return;
  }

  const names = conflicts
    .slice(0, 2)
    .map(item => `${item.time} — ${item.title}`)
    .join("; ");

  warning.hidden = false;
  warning.textContent = `Conflito de horário: ${names}. Você ainda pode salvar, mas os horários ficarão sobrepostos.`;
}

function renderAll() {
  setHeaderDate();
  renderTodayAgenda();
  renderNextAction();
  renderCalendars();
  renderSelectedDate();
  renderPriorities();
  renderOverdue();
  renderSummary();
  renderGoals();
  renderHabits();
  renderTasks();
  renderProjects();
  renderNotes();
}

function openItemModal(date = selectedDate, type = "compromisso", itemId = null) {
  const form = document.getElementById("itemForm");
  form.reset();
  editingItemId = itemId;

  const title = document.getElementById("itemModalTitle");
  const submit = document.getElementById("itemSubmitButton");

  if (itemId) {
    const item = data.items.find(item => item.id === itemId);
    if (!item) return;

    title.textContent = "Editar item";
    submit.textContent = "Salvar alterações";

    document.getElementById("itemTitle").value = item.title;
    document.getElementById("itemType").value = item.type;
    document.getElementById("itemArea").value = item.area;
    document.getElementById("itemDate").value = item.date;
    document.getElementById("itemTime").value = item.time || "";
    document.getElementById("itemDuration").value = String(item.duration || 60);
    document.getElementById("itemPriority").value = item.priority;
    document.getElementById("itemProject").value = item.projectId || "";
    document.getElementById("itemNotes").value = item.notes || "";
  } else {
    title.textContent = type === "tarefa" ? "Nova tarefa" : "Novo compromisso";
    submit.textContent = "Salvar";

    document.getElementById("itemDate").value = date;
    document.getElementById("itemType").value = type;
    document.getElementById("itemDuration").value = "60";
  }

  updateConflictWarning();
  openModal("itemModal");
}
document.addEventListener("click", event => {
  const dateCell = event.target.closest("[data-select-date]");

  if (dateCell) {
    selectedDate = dateCell.dataset.selectDate;
    const selected = dateFromISO(selectedDate);
    calendarCursor = new Date(selected.getFullYear(), selected.getMonth(), 1);
    renderCalendars();
    renderSelectedDate();
    return;
  }

  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.page) {
    setPage(button.dataset.page);
  }

  if (button.dataset.go) {
    setPage(button.dataset.go);
  }

  if (button.id === "menuButton") {
    document.getElementById("sidebar").classList.toggle("open");
  }

  if (["newItemTop", "newAgendaItem"].includes(button.id)) {
    openItemModal(localISO(), "compromisso");
  }

  if (["newItemSelected", "newAgendaSelected"].includes(button.id)) {
    openItemModal(selectedDate, "compromisso");
  }

  if (button.id === "newTaskButton") {
    openItemModal(selectedDate, "tarefa");
  }

  if (button.id === "newProjectButton") {
    document.getElementById("projectDeadline").value = addDays(30);
    openModal("projectModal");
  }

  if (button.id === "newGoalButton") {
    document.getElementById("goalDeadline").value = addDays(60);
    openModal("goalModal");
  }

  if (button.id === "newHabitButton") {
    openModal("habitModal");
  }

  if (button.dataset.close) {
    closeModal(button.dataset.close);
  }

  if (button.dataset.editItem) {
    openItemModal(selectedDate, "compromisso", button.dataset.editItem);
  }

  if (button.dataset.toggleItem) {
    const item = data.items.find(item => item.id === button.dataset.toggleItem);
    if (item) item.done = !item.done;
    saveData();
  }

  if (button.dataset.deleteItem) {
    data.items = data.items.filter(item => item.id !== button.dataset.deleteItem);
    saveData();
  }

  if (button.dataset.toggleHabit) {
    const habit = data.habits.find(habit => habit.id === button.dataset.toggleHabit);

    if (habit) {
      habit.history ||= {};
      const today = localISO();

      if (habit.history[today]) {
        delete habit.history[today];
      } else {
        habit.history[today] = true;
      }
    }

    saveData();
  }

  if (button.dataset.deleteHabit) {
    data.habits = data.habits.filter(habit => habit.id !== button.dataset.deleteHabit);
    saveData();
  }

  if (button.dataset.deleteGoal) {
    data.goals = data.goals.filter(goal => goal.id !== button.dataset.deleteGoal);
    saveData();
  }

  if (button.dataset.deleteProject) {
    data.projects = data.projects.filter(project => project.id !== button.dataset.deleteProject);
    saveData();
  }

  if (button.dataset.filter) {
    taskFilter = button.dataset.filter;

    document.querySelectorAll("[data-filter]").forEach(filterButton => {
      filterButton.classList.toggle(
        "active",
        filterButton.dataset.filter === taskFilter
      );
    });

    renderTasks();
  }

  if (button.dataset.selectItemDate) {
    selectedDate = button.dataset.selectItemDate;
    const selected = dateFromISO(selectedDate);
    calendarCursor = new Date(selected.getFullYear(), selected.getMonth(), 1);
    setPage("agenda");
    renderCalendars();
    renderSelectedDate();
  }

  if (button.id === "prevMonth" || button.id === "fullPrevMonth") {
    calendarCursor = new Date(
      calendarCursor.getFullYear(),
      calendarCursor.getMonth() - 1,
      1
    );
    renderCalendars();
  }

  if (button.id === "nextMonth" || button.id === "fullNextMonth") {
    calendarCursor = new Date(
      calendarCursor.getFullYear(),
      calendarCursor.getMonth() + 1,
      1
    );
    renderCalendars();
  }

  if (["todayCalendar", "fullToday", "goToday"].includes(button.id)) {
    selectedDate = localISO();
    calendarCursor = dateFromISO(selectedDate);
    renderAll();
  }

  if (button.dataset.area) {
    setPage("tarefas");

    const area = button.dataset.area;
    const items = sortedItems(
      data.items.filter(item => item.type === "tarefa" && item.area === area)
    );

    document.getElementById("taskList").innerHTML = items.length
      ? items.map(item => `
        <div class="task-row ${item.done ? "done" : ""}">
          <button
            class="check-button ${item.done ? "done" : ""}"
            data-toggle-item="${item.id}"
          >
            ${item.done ? "✓" : ""}
          </button>

          <div class="task-content">
            <span class="task-title">${escapeHTML(item.title)}</span>
            <div class="task-meta">
              <span>${formatDate(item.date)}</span>
              <span>${item.time || "Sem horário"}</span>
              <span class="tag ${item.area}">${AREA_NAMES[item.area]}</span>
            </div>
          </div>

          <div class="item-actions">
            <button class="edit-button" data-edit-item="${item.id}">Editar</button>
            <button class="delete-button" data-delete-item="${item.id}">✕</button>
          </div>
        </div>
      `).join("")
      : `<div class="empty">Nenhuma tarefa em ${AREA_NAMES[area]}.</div>`;
  }
});

document.addEventListener("change", event => {
  if (event.target.dataset.goalProgress) {
    const goal = data.goals.find(
      goal => goal.id === event.target.dataset.goalProgress
    );

    if (goal) {
      goal.progress = Math.max(
        0,
        Math.min(100, Number(event.target.value) || 0)
      );

      saveData();
    }
  }
});

document.getElementById("itemForm").addEventListener("submit", event => {
  event.preventDefault();

  const candidate = formCandidate();
  const conflicts = findConflicts(candidate, editingItemId);

  if (conflicts.length) {
    const conflictText = conflicts
      .slice(0, 3)
      .map(item => `${item.time} — ${item.title}`)
      .join("\n");

    const proceed = window.confirm(
      `Existe conflito de horário com:\n\n${conflictText}\n\nDeseja salvar mesmo assim?`
    );

    if (!proceed) return;
  }

  if (editingItemId) {
    const item = data.items.find(item => item.id === editingItemId);

    if (item) {
      Object.assign(item, candidate);
    }
  } else {
    data.items.push({
      id: uid(),
      ...candidate,
      done: false
    });
  }

  selectedDate = candidate.date;
  calendarCursor = dateFromISO(selectedDate);

  editingItemId = null;
  event.target.reset();
  closeModal("itemModal");
  saveData();
});
document.getElementById("projectForm").addEventListener("submit", event => {
  event.preventDefault();

  data.projects.push({
    id: uid(),
    title: document.getElementById("projectTitle").value.trim(),
    area: document.getElementById("projectArea").value,
    progress: Math.max(
      0,
      Math.min(100, Number(document.getElementById("projectProgress").value) || 0)
    ),
    deadline: document.getElementById("projectDeadline").value
  });

  event.target.reset();
  closeModal("projectModal");
  saveData();
});

document.getElementById("goalForm").addEventListener("submit", event => {
  event.preventDefault();

  data.goals.push({
    id: uid(),
    title: document.getElementById("goalTitle").value.trim(),
    progress: Math.max(
      0,
      Math.min(100, Number(document.getElementById("goalProgress").value) || 0)
    ),
    deadline: document.getElementById("goalDeadline").value
  });

  event.target.reset();
  closeModal("goalModal");
  saveData();
});

document.getElementById("habitForm").addEventListener("submit", event => {
  event.preventDefault();

  data.habits.push({
    id: uid(),
    title: document.getElementById("habitTitle").value.trim(),
    history: {}
  });

  event.target.reset();
  closeModal("habitModal");
  saveData();
});

["itemDate", "itemTime", "itemDuration"].forEach(id => {
  document.getElementById(id).addEventListener("input", updateConflictWarning);
  document.getElementById(id).addEventListener("change", updateConflictWarning);
});

let notesTimer;

document.getElementById("notesArea").addEventListener("input", event => {
  document.getElementById("saveStatus").textContent = "Salvando...";
  document.getElementById("charCount").textContent =
    `${event.target.value.length} caracteres`;

  clearTimeout(notesTimer);

  notesTimer = setTimeout(() => {
    data.notes = event.target.value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    document.getElementById("saveStatus").textContent = "Salvo automaticamente";
  }, 350);
});

document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) {
      backdrop.classList.remove("open");
    }
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    document
      .querySelectorAll(".modal-backdrop.open")
      .forEach(modal => modal.classList.remove("open"));
  }
});

renderAll();
