"use strict";

const paths = {
  brand: '<path d="m4 12 4 4 10-10M11 17l2 2 7-7" stroke-width="2.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
  inbox: '<path d="M5 4h14l3 10v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-5L5 4Z"/><path d="M2 14h6l2 3h4l2-3h6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 5h2"/>',
  check: '<path d="m5 12 4 4L19 6" stroke-width="2.2"/>',
  circleCheck: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  edit: '<path d="m14 6 4 4M4 20l4-.8 12-12a1.4 1.4 0 0 0 0-2l-1.2-1.2a1.4 1.4 0 0 0-2 0l-12 12L4 20Z"/>',
  sort: '<path d="M4 6h16M4 12h12M4 18h8"/>',
  chart: '<path d="M4 20h16M7 16v-4m5 4V8m5 8V4"/>',
  list: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 8h8m-8 4h8m-8 4h5"/>',
  board: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 5v14m6-14v14"/>',
  table: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M3 15h18M10 10v9"/>',
  sliders: '<path d="M4 7h4m4 0h8M4 17h8m4 0h4"/><circle cx="10" cy="7" r="2"/><circle cx="14" cy="17" r="2"/>',
  arrowUp: '<path d="M12 20V4m-5 5 5-5 5 5"/>',
  arrowDown: '<path d="M12 4v16m-5-5 5 5 5-5"/>',
  chevronLeft: '<path d="m15 6-6 6 6 6"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>'
};

function icon(name, size = 16) {
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
}

const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[character]));

function dateKey(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return dateFrom(date);
}

function dateFrom(date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, "0")).join("-");
}

function formatDate(key, options) {
  return new Intl.DateTimeFormat("es-CL", options).format(new Date(key + "T12:00:00"));
}

function dateLabel(key) {
  if (key === dateKey()) return "Hoy";
  if (key === dateKey(1)) return "Mañana";
  return formatDate(key, { day: "numeric", month: "short" });
}

const storageKey = "ritmo-v1";
const sampleProjects = [
  { id: "trabajo", name: "Trabajo", color: "violet" },
  { id: "personal", name: "Personal", color: "green" },
  { id: "ideas", name: "Ideas", color: "orange" }
];

function initialData() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved?.tasks) && Array.isArray(saved?.projects)) {
      return {
        ...saved,
        sections: Array.isArray(saved.sections) ? saved.sections : [],
        viewSettings: saved.viewSettings ?? {}
      };
    }
  } catch {
    // Start with the examples if browser storage is unavailable or unreadable.
  }
  return {
    projects: sampleProjects,
    sections: [],
    viewSettings: {},
    tasks: [
      ["Revisar la propuesta del proyecto", "Dejar comentarios antes de la reunión.", 1, "trabajo", 0, false],
      ["Preparar la reunión del equipo", "Ordenar los temas y próximos pasos.", 2, "trabajo", 0, false],
      ["Agendar una hora de lectura", "", 3, "personal", 0, false],
      ["Anotar ideas para el próximo mes", "", 4, "ideas", 0, false],
      ["Planificar las prioridades del día", "", 4, "", 0, true],
      ["Revisar el calendario", "", 4, "personal", 0, true],
      ["Guardar el enlace de referencia", "", 4, "", null, false],
      ["Ordenar notas de la semana", "", 3, "personal", 1, false],
      ["Enviar el resumen del equipo", "", 2, "trabajo", 3, false]
    ].map(([title, description, priority, project, offset, done], index) => ({
      id: `example-${index}`, title, description, priority, project,
      date: offset === null ? "" : dateKey(offset), created: dateKey(-2), done
    }))
  };
}

let data = initialData();
let view = "today";
let status = "all";
let settings = viewSettings(data.viewSettings[view]);
let calendarDate = new Date();
let calendarMode = "month";
let query = "";
let editing = null;
let undo = null;
let toastTimer;

const views = {
  inbox: { name: "Bandeja de entrada", icon: "inbox", description: "Captura tus pendientes y organízalos cuando quieras." },
  today: { name: "Hoy", icon: "sun", description: "Revisa tus pendientes de hoy y las tareas vencidas." },
  upcoming: { name: "Próximas", icon: "calendar", description: "Consulta las tareas programadas para los próximos días." },
  all: { name: "Todas las tareas", icon: "list", description: "Consulta tus tareas de todos los proyectos en un solo lugar." },
  completed: { name: "Completadas", icon: "circleCheck", description: "Consulta las tareas que ya terminaste." },
  search: { name: "Buscar", icon: "search", description: "Busca por nombre, descripción o proyecto." }
};
const priorities = ["", "Alta", "Media", "Baja"];
const taskDialog = $("#task-dialog");
const taskForm = $("#task-form");
const projectDialog = $("#project-dialog");
const projectForm = $("#project-form");
const sectionDialog = $("#section-dialog");
const sectionForm = $("#section-form");

const heroArt = `<svg class="hero-art" aria-hidden="true" viewBox="0 0 460 186" preserveAspectRatio="xMidYMid slice">
  <defs><pattern id="dots" width="13" height="13" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#a68be9" opacity=".4"/></pattern><linearGradient id="orb" x2="1" y2="1"><stop stop-color="#eee1ff"/><stop offset="1" stop-color="#c9b3ff"/></linearGradient></defs>
  <circle cx="332" cy="122" r="161" fill="none" stroke="#dac8fc"/><circle cx="332" cy="122" r="125" fill="none" stroke="#d8c5fc"/><circle cx="332" cy="122" r="92" fill="url(#orb)" opacity=".78"/>
  <rect x="80" y="22" width="122" height="120" fill="url(#dots)"/><rect x="369" y="106" width="71" height="80" fill="url(#dots)"/>
  <path d="M111 118h18m-9-9v18M414 44h18m-9-9v18M195 31h10m-5-5v10" stroke="#ad93ee" stroke-width="1.6" stroke-linecap="round"/>
  <g transform="translate(224 27) rotate(-8 61 66)"><rect x="5" y="7" width="123" height="135" rx="16" fill="#8d69de" opacity=".13"/><rect width="123" height="135" rx="16" fill="#fff" stroke="#e2d5fb"/><rect x="15" y="15" width="48" height="8" rx="4" fill="#b394f8"/><rect x="15" y="32" width="80" height="4" rx="2" fill="#e8e0f6"/>
  <rect x="14" y="49" width="94" height="22" rx="6" fill="#f4efff"/><circle cx="25" cy="60" r="5" fill="#9a73ed"/><path d="m23 60 1.5 1.5 3-3" fill="none" stroke="white" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/><rect x="35" y="58" width="50" height="4" rx="2" fill="#c6b5ea"/>
  <rect x="14" y="77" width="94" height="18" rx="6" fill="#f8f5fd"/><circle cx="25" cy="86" r="4" fill="none" stroke="#b89cec"/><rect x="35" y="84" width="57" height="4" rx="2" fill="#ded4ed"/><rect x="14" y="101" width="94" height="18" rx="6" fill="#f8f5fd"/><circle cx="25" cy="110" r="4" fill="none" stroke="#b89cec"/><rect x="35" y="108" width="41" height="4" rx="2" fill="#ded4ed"/></g>
  <g transform="translate(335 91) rotate(13 25 25)"><rect x="4" y="4" width="52" height="52" rx="16" fill="#8e65dc" opacity=".25"/><rect width="52" height="52" rx="16" fill="#8059de"/><path d="m15 26 7 7 15-15" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></g>
</svg>`;

function projectFor(id) {
  return data.projects.find((project) => project.id === id);
}

function sectionFor(id) {
  return data.sections.find((section) => section.id === id);
}

function matchesView(task, target) {
  switch (target) {
    case "inbox": return !task.project;
    case "today": return task.date === dateKey() || Boolean(task.date && !task.done && task.date < dateKey());
    case "upcoming": return task.date > dateKey();
    case "all": return true;
    case "completed": return task.done;
    case "search": return [task.title, task.description, projectFor(task.project)?.name ?? "", sectionFor(task.section)?.name ?? ""]
      .some((value) => normalize(value).includes(normalize(query.trim())));
    default: return task.project === target;
  }
}

function normalize(value) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es");
}

function projectMarker(project) {
  return `<span class="dot ${project.color}" aria-hidden="true"></span>`;
}

function navButton(id, name, marker, count) {
  return `<button class="nav-item" data-view="${id}" ${view === id ? 'aria-current="page"' : ""}>${marker}<span class="name">${escapeHTML(name)}</span>${count ? `<span class="nav-count">${count}</span>` : ""}</button>`;
}

function renderNavigation() {
  const countFor = (id) => data.tasks.filter((task) => matchesView(task, id) && (id === "completed" ? task.done : !task.done)).length;
  $("#navigation").innerHTML = Object.entries(views).filter(([id]) => id !== "search")
    .map(([id, item]) => navButton(id, item.name, icon(item.icon), countFor(id))).join("");
  $("#projects").innerHTML = data.projects
    .map((project) => navButton(project.id, project.name, projectMarker(project), countFor(project.id))).join("");
  $(".search-button").toggleAttribute("aria-current", view === "search");
  if (view === "search") $(".search-button").setAttribute("aria-current", "page");
}

function renderIntro() {
  const item = views[view] ?? { name: projectFor(view).name, icon: "folder", description: "Organiza y consulta las tareas de este proyecto." };
  $("#breadcrumb").textContent = item.name;
  $("#intro").className = view === "today" ? "intro today" : "intro";
  const date = formatDate(dateKey(), { weekday: "long", day: "numeric", month: "long" });
  const headingLabel = view === "today" ? date : "Mi espacio";
  $("#intro").innerHTML = `<div><div class="eyebrow">${icon(item.icon, 14)}${headingLabel}</div><h1>${escapeHTML(item.name)}</h1><p>${item.description}</p></div>${view === "today" ? heroArt : ""}`;
}

function renderOverview() {
  const today = data.tasks.filter((task) => task.date === dateKey());
  const done = today.filter((task) => task.done).length;
  const percent = today.length ? Math.round(100 * done / today.length) : 0;
  $("#summary").innerHTML = `<h2 class="card-heading"><span class="tile">${icon("chart", 17)}</span>Progreso de hoy</h2>
    <div class="progress-content"><div class="ring" style="--progress:${percent}%"><span>${percent}%</span></div>
    <div><strong>${done} de ${today.length} completadas</strong><p>${today.length ? "Tareas programadas para hoy" : "Tu agenda está libre"}</p></div></div>
    <div class="summary-stats"><div><strong>${today.length - done}</strong><span>Pendientes</span></div><div><strong>${done}</strong><span>Completadas</span></div></div>`;
  $("#project-summary").innerHTML = `<h2 class="card-heading"><span class="tile">${icon("folder", 17)}</span>Mis proyectos
    <button class="icon-button" data-action="project" aria-label="Crear proyecto" title="Crear proyecto">${icon("plus", 15)}</button></h2>
    <div class="project-card-list">${data.projects.map((project) => `<button class="project-card-row" data-view="${project.id}">
    <span class="tile ${project.color}">${icon("folder", 13)}</span><span class="name">${escapeHTML(project.name)}</span>
    <span class="nav-count">${data.tasks.filter((task) => task.project === project.id && !task.done).length}</span></button>`).join("")}</div>`;
}

function taskCheck(task) {
  return `<button class="check p${task.priority}" data-action="toggle" data-id="${task.id}" aria-label="Completar tarea: ${escapeHTML(task.title)}" aria-pressed="${task.done}">${task.done ? icon("check", 13) : ""}</button>`;
}

function taskTitle(task, showTooltip = false) {
  return `<button class="task-title" data-action="edit" data-id="${task.id}" ${showTooltip ? `title="${escapeHTML(task.title)}"` : ""}>${escapeHTML(task.title)}</button>`;
}

function taskPriority(task) {
  return priorities[task.priority] ? `<span class="pill priority${task.priority}">${priorities[task.priority]}</span>` : "";
}

function taskEdit(task) {
  return `<button class="icon-button row-edit" data-action="edit" data-id="${task.id}" aria-label="Editar ${escapeHTML(task.title)}" title="Editar tarea">${icon("edit", 14)}</button>`;
}

function taskRow(task, draggable = false) {
  const project = projectFor(task.project);
  const section = sectionFor(task.section);
  const meta = [
    task.date && `<span class="meta ${task.date < dateKey() && !task.done ? "overdue" : ""}">${icon("calendar", 12)}${dateLabel(task.date)}</span>`,
    `<span class="meta">${project ? projectMarker(project) + escapeHTML(project.name) : icon("inbox", 12) + "Entrada"}</span>`,
    section && `<span class="meta">${escapeHTML(section.name)}</span>`,
    taskPriority(task)
  ].filter(Boolean).join("");
  return `<li class="task-row ${task.done ? "done" : ""}" ${draggable ? `draggable="true" data-drag-task="${task.id}"` : ""}>
    ${taskCheck(task)}
    <div class="task-main">${taskTitle(task)}
    ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ""}
    <div class="task-meta">${meta}</div></div>${taskEdit(task)}</li>`;
}

const taskLayouts = { list: groupedList, board: boardView, table: tableView, calendar: calendarView };

function renderTaskList() {
  const tasks = data.tasks.filter((task) => matchesView(task, view) && taskMatchesFilters(task) &&
    (view === "completed" || settings.showDone || !task.done));
  const done = tasks.filter((task) => task.done).length;
  const tabs = [["all", "Todas", tasks.length], ["open", "Pendientes", tasks.length - done], ["done", "Completadas", done]];
  const showTabs = view !== "completed" && settings.showDone;
  $("#status-tabs").hidden = !showTabs;
  $("#status-tabs").innerHTML = showTabs ? tabs.map(([id, name, count]) =>
    `<button class="tab" data-status="${id}" aria-pressed="${id === status}">${name}<span class="tab-count">${count}</span></button>`).join("") : "";
  $("#task-count").textContent = tasks.length === 1 ? "1 tarea" : `${tasks.length} tareas`;
  const rows = sortTasks(tasks.filter((task) => status === "all" || task.done === (status === "done")));
  const display = $("#task-display");
  const scroll = display.querySelector(".table-scroll, .calendar-scroll, .board-scroll")?.scrollLeft ?? 0;
  display.innerHTML = taskLayouts[settings.layout](rows);
  const nextScroller = display.querySelector(".table-scroll, .calendar-scroll, .board-scroll");
  if (nextScroller) nextScroller.scrollLeft = scroll;
  $("#empty-tasks").hidden = rows.length > 0 || settings.layout === "calendar" ||
    (settings.layout === "board" && (settings.group === "none" || settings.group === "section"));
  $("#empty-tasks").innerHTML = `<div class="tile">${icon(view === "search" ? "search" : "circleCheck", 17)}</div>
    <strong>${view === "search" ? "Sin coincidencias" : "No hay tareas en esta vista"}</strong>
    <p>${view === "search" ? "Prueba con otro término o filtro." : "Las tareas que coincidan con esta vista aparecerán aquí."}</p>`;
}

function renderTasks() {
  $(".columns").classList.toggle("wide-layout", settings.layout !== "list");
  $("#tasks").innerHTML = `<div class="panel-heading"><div><h2>${view === "today" ? "Plan del día" : "Tareas"}</h2><p id="task-count"></p></div>
    <div class="layout-picker inline-layouts" role="group" aria-label="Formato">${layoutPicker()}</div></div>
    ${settings.layout === "board" ? `<div class="board-toolbar">${sectionButton()}</div>` : ""}
    ${view === "search" ? `<div class="search-field">${icon("search")}<input id="query" type="search" aria-label="Buscar tareas" placeholder="Escribe para buscar…" value="${escapeHTML(query)}"></div>` : ""}
    <div class="tabs" id="status-tabs" aria-label="Filtrar por estado"></div>
    <div id="task-display"></div><div class="empty" id="empty-tasks"></div>
    <div class="task-panel-actions">
    ${view !== "completed" ? `<button class="add-inline" data-action="add">${icon("plus", 15)}Añadir tarea</button>` : ""}
    ${settings.layout !== "board" && sectionScope() !== null ? sectionButton() : ""}</div>`;
  renderTaskList();
}

function render() {
  renderNavigation();
  renderIntro();
  renderOverview();
  renderSettings();
  renderTasks();
}

function notify(message, undoAction = null) {
  undo = undoAction;
  clearTimeout(toastTimer);
  $("#toast-message").textContent = message;
  $(".toast-undo").hidden = !undoAction;
  $("#toast").hidden = false;
  toastTimer = setTimeout(dismiss, undoAction ? 9000 : 3600);
}

function dismiss() {
  $("#toast").hidden = true;
  undo = null;
  clearTimeout(toastTimer);
}

function saveData() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

function persist(message, undoAction) {
  renderNavigation();
  renderOverview();
  renderTaskList();
  if (!saveData()) message += " El navegador no pudo guardar los cambios.";
  notify(message, undoAction);
}

function updateSettings(changes, origin) {
  settings = { ...settings, ...changes };
  data.viewSettings[view] = settings;
  if (!settings.showDone) status = "all";
  const layoutChanged = Object.hasOwn(changes, "layout");
  if (layoutChanged) renderTasks();
  else renderTaskList();
  renderSettings();
  if (!saveData()) notify("El navegador no pudo guardar la configuración.");
  if (origin) $(origin)?.focus({ preventScroll: true });
}

function fillTaskSections(id = "") {
  const fields = taskForm.elements;
  const sections = data.sections.filter((section) => section.project === null || section.project === fields.project.value);
  $("#task-section-field").hidden = sections.length === 0;
  fields.section.innerHTML = '<option value="">Sin sección</option>' + sections.map((section) =>
    `<option value="${section.id}">${escapeHTML(section.name)}</option>`).join("");
  fields.section.value = sections.some((section) => section.id === id) ? id : "";
}

function openTask(id, defaults = {}) {
  editing = data.tasks.find((task) => task.id === id) ?? null;
  const fields = taskForm.elements;
  taskForm.reset();
  $("#task-dialog-title").textContent = editing ? "Editar tarea" : "Nueva tarea";
  taskForm.querySelector("[data-action=delete]").hidden = !editing;
  fields.project.innerHTML = '<option value="">Bandeja de entrada</option>' + data.projects
    .map((project) => `<option value="${project.id}">${escapeHTML(project.name)}</option>`).join("");
  fields.title.value = editing?.title ?? "";
  fields.description.value = editing?.description ?? "";
  fields.date.value = editing?.date ?? defaults.date ?? (view === "today" ? dateKey() : view === "upcoming" ? dateKey(1) : "");
  fields.priority.value = editing?.priority ?? 4;
  fields.project.value = editing?.project ?? sectionFor(defaults.section)?.project ?? projectFor(view)?.id ?? "";
  fillTaskSections(editing?.section ?? defaults.section);
  taskDialog.showModal();
}

function setMenu(open) {
  document.body.classList.toggle("menu-open", open);
  $(".mobile-menu").setAttribute("aria-expanded", String(open));
  $(".shade").hidden = !open;
  if (open) $(".sidebar-add").focus();
}

function selectView(next) {
  const wasOpen = document.body.classList.contains("menu-open");
  view = next;
  settings = viewSettings(data.viewSettings[view]);
  status = "all";
  calendarDate = new Date();
  if (view === "upcoming") calendarDate.setDate(calendarDate.getDate() + 1);
  $("#view-settings").hidePopover();
  setMenu(false);
  render();
  if (view === "search") $("#query").focus();
  else if (wasOpen) $(".mobile-menu").focus();
  else document.querySelector(`.sidebar [data-view="${next}"]`)?.focus({ preventScroll: true });
}

function focusTaskControl(action, id) {
  const control = [...$("#task-display").querySelectorAll(`[data-action="${action}"]`)]
    .find((button) => button.dataset.id === id);
  (control ?? $("#status-tabs").querySelector('[aria-pressed="true"]') ?? $(".inline-layouts [aria-pressed=true]")).focus({ preventScroll: true });
}

function toggleTask(id) {
  const task = data.tasks.find((item) => item.id === id);
  if (!task) return;
  task.done = !task.done;
  persist(task.done ? "Tarea completada" : "Tarea reabierta", () => toggleTask(id));
  focusTaskControl("toggle", id);
}

function deleteTask() {
  const removed = editing;
  const index = data.tasks.indexOf(removed);
  if (index < 0) return;
  data.tasks.splice(index, 1);
  taskDialog.close();
  persist("Tarea eliminada", () => {
    data.tasks.splice(index, 0, removed);
    persist("Tarea recuperada");
  });
  focusTaskControl("edit", removed.id);
}

const actions = {
  add: (button) => openTask(undefined, { date: button.dataset.date, section: button.dataset.section }),
  section: () => {
    sectionForm.reset();
    const scope = sectionScope();
    const project = projectFor(scope);
    $("#section-scope").textContent = scope === null
      ? "Esta sección estará disponible para las tareas de todos tus proyectos."
      : project ? `Esta sección pertenece a ${project.name}.` : "Esta sección pertenece a la Bandeja de entrada.";
    sectionDialog.showModal();
  },
  "calendar-prev": () => moveCalendar("calendar-prev"),
  "calendar-today": () => moveCalendar("calendar-today"),
  "calendar-next": () => moveCalendar("calendar-next"),
  "reset-view": () => {
    status = "all";
    calendarMode = "month";
    calendarDate = new Date();
    updateSettings(defaultSettings, ".reset-settings");
  },
  edit: (button) => openTask(button.dataset.id),
  toggle: (button) => toggleTask(button.dataset.id),
  delete: deleteTask,
  project: () => { projectForm.reset(); projectDialog.showModal(); },
  close: (button) => button.closest("dialog").close(),
  menu: () => {
    const open = !document.body.classList.contains("menu-open");
    setMenu(open);
    if (!open) $(".mobile-menu").focus();
  },
  undo: () => { const restore = undo; dismiss(); restore?.(); },
  dismiss
};

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.view) selectView(button.dataset.view);
  if (button.dataset.layout) {
    const group = button.closest("#view-settings") ? "#view-settings" : ".inline-layouts";
    updateSettings({ layout: button.dataset.layout }, `${group} [data-layout="${button.dataset.layout}"]`);
  }
  if (button.dataset.tableSort) {
    const sort = button.dataset.tableSort;
    const direction = settings.sort === sort && settings.direction === "asc" ? "desc" : "asc";
    updateSettings({ sort, direction }, `[data-table-sort="${sort}"]`);
  }
  if (button.dataset.status) {
    status = button.dataset.status;
    renderTaskList();
    $("#status-tabs").querySelector('[aria-pressed="true"]').focus();
  }
  actions[button.dataset.action]?.(button);
});

document.addEventListener("input", (event) => {
  if (event.target.id !== "query") return;
  query = event.target.value;
  renderTaskList();
});

document.addEventListener("change", (event) => {
  const field = event.target;
  const key = field.dataset.setting;
  if (key) updateSettings({ [key]: field.type === "checkbox" ? field.checked : field.value }, `[data-setting="${key}"]`);
  if (field.id === "calendar-mode") {
    calendarMode = field.value;
    renderTaskList();
    $("#calendar-mode").focus({ preventScroll: true });
  }
  if (field.form === taskForm && field.name === "project") fillTaskSections(taskForm.elements.section.value);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("menu-open") && !$("dialog[open]")) {
    actions.menu();
    return;
  }
  if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || $("dialog[open]") ||
      event.target.closest?.("input,textarea,select,[contenteditable]")) return;
  if (event.key.toLowerCase() === "n") {
    event.preventDefault();
    openTask();
  }
  if (event.key === "/") {
    event.preventDefault();
    selectView("search");
  }
});

function validatedName(field) {
  const name = field.value.trim();
  field.setCustomValidity(name ? "" : "Escribe un nombre.");
  if (!name) field.reportValidity();
  return name;
}

for (const field of [taskForm.elements.title, projectForm.elements.name, sectionForm.elements.name]) {
  field.addEventListener("input", () => field.setCustomValidity(""));
  field.form.closest("dialog").addEventListener("close", () => field.setCustomValidity(""));
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const fields = taskForm.elements;
  const title = validatedName(fields.title);
  if (!title) return;
  const values = {
    title, description: fields.description.value.trim(), date: fields.date.value,
    priority: Number(fields.priority.value), project: fields.project.value, section: fields.section.value
  };
  const task = editing ?? { id: crypto.randomUUID(), done: false, created: dateKey() };
  Object.assign(task, values);
  if (!editing) {
    data.tasks.push(task);
    status = "all";
  }
  taskDialog.close();
  persist(editing ? "Cambios guardados" : "Tarea añadida");
  if (editing) focusTaskControl("edit", task.id);
});

projectForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const fields = projectForm.elements;
  const name = validatedName(fields.name);
  if (!name) return;
  const project = { id: crypto.randomUUID(), name, color: fields.color.value };
  data.projects.push(project);
  projectDialog.close();
  selectView(project.id);
  persist("Proyecto creado");
});

sectionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const scope = sectionScope();
  const field = sectionForm.elements.name;
  const name = validatedName(field);
  if (!name) return;
  if (data.sections.some((section) => section.project === scope && normalize(section.name) === normalize(name))) {
    field.setCustomValidity("Ya existe una sección con este nombre.");
    field.reportValidity();
    return;
  }
  data.sections.push({ id: crypto.randomUUID(), name, project: scope });
  sectionDialog.close();
  if (settings.group !== "none" && settings.group !== "section") updateSettings({ group: "section" });
  persist("Sección creada");
  $(".section-add")?.focus();
});

let draggedTask = null;

function clearTaskDrag() {
  draggedTask = null;
  document.querySelector(".drop-active")?.classList.remove("drop-active");
}

document.addEventListener("dragstart", (event) => {
  const card = event.target.closest("[data-drag-task]");
  if (!card) return;
  draggedTask = data.tasks.find((task) => task.id === card.dataset.dragTask);
  if (!draggedTask) return;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", draggedTask.title);
});

function taskDropTarget(element, task) {
  const target = element.closest("[data-drop-date], [data-drop-section]");
  if (!target) return null;
  const section = sectionFor(target.dataset.dropSection);
  return section?.project != null && section.project !== task.project ? null : target;
}

document.addEventListener("dragover", (event) => {
  if (!draggedTask) return;
  const target = taskDropTarget(event.target, draggedTask);
  document.querySelector(".drop-active")?.classList.remove("drop-active");
  if (!target) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  target.classList.add("drop-active");
});

document.addEventListener("dragend", clearTaskDrag);

document.addEventListener("drop", (event) => {
  const task = draggedTask;
  const target = task && taskDropTarget(event.target, task);
  clearTaskDrag();
  if (!target || !task) return;
  event.preventDefault();
  const key = target.hasAttribute("data-drop-date") ? "date" : "section";
  const next = target.dataset[key === "date" ? "dropDate" : "dropSection"];
  const previous = task[key] ?? "";
  const hoveredCard = event.target.closest(".board-cards [data-drag-task]");
  const anchor = key === "section" && settings.sort === "manual" && hoveredCard
    ? data.tasks.find((entry) => entry.id === hoveredCard.dataset.dragTask)
    : null;
  const reorder = anchor && anchor !== task;
  if (previous === next && !reorder) return;
  const previousIndex = data.tasks.indexOf(task);
  task[key] = next;
  if (reorder) {
    const bounds = hoveredCard.getBoundingClientRect();
    const insertAfter = event.clientY > bounds.top + bounds.height / 2;
    data.tasks.splice(previousIndex, 1);
    const index = data.tasks.indexOf(anchor);
    data.tasks.splice(index + Number(insertAfter === (settings.direction === "asc")), 0, task);
  }
  persist(key === "date" ? "Fecha actualizada" : "Tarea movida", () => {
    task[key] = previous;
    if (reorder) {
      data.tasks.splice(data.tasks.indexOf(task), 1);
      data.tasks.splice(previousIndex, 0, task);
    }
    persist("Movimiento deshecho");
  });
});

for (const element of document.querySelectorAll("[data-icon]")) {
  const name = element.dataset.icon;
  element.innerHTML = icon(name, name === "brand" ? 25 : 16);
}
render();
