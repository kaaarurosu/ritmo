"use strict";

const layouts = {
  list: ["Lista", "list"],
  board: ["Panel", "board"],
  calendar: ["Calendario", "calendar"],
  table: ["Tabla", "table"]
};
const groupOptions = { none: "Ninguno", section: "Sección", project: "Proyecto", priority: "Prioridad", date: "Fecha" };
const sortOptions = { manual: "Manual", priority: "Prioridad", date: "Fecha", created: "Creación", name: "Nombre", project: "Proyecto", section: "Sección" };
const dateOptions = { all: "Todas", overdue: "Vencidas", today: "Hoy", week: "Próximos 7 días", future: "Futuras", none: "Sin fecha" };
const createdOptions = { all: "Todas", today: "Hoy", week: "Últimos 7 días", month: "Últimos 30 días", none: "Sin registro" };
const priorityOptions = { all: "Todas", 1: "Alta", 2: "Media", 3: "Baja", 4: "Sin prioridad" };
const defaultSettings = { layout: "list", group: "none", sort: "priority", direction: "asc", date: "all", created: "all", priority: "all", showDone: true };

function viewSettings(saved = {}) {
  return {
    layout: Object.hasOwn(layouts, saved.layout) ? saved.layout : defaultSettings.layout,
    group: Object.hasOwn(groupOptions, saved.group) ? saved.group : defaultSettings.group,
    sort: Object.hasOwn(sortOptions, saved.sort) ? saved.sort : defaultSettings.sort,
    direction: saved.direction === "desc" ? "desc" : "asc",
    date: Object.hasOwn(dateOptions, saved.date) ? saved.date : defaultSettings.date,
    created: Object.hasOwn(createdOptions, saved.created) ? saved.created : defaultSettings.created,
    priority: Object.hasOwn(priorityOptions, saved.priority) ? saved.priority : defaultSettings.priority,
    showDone: saved.showDone !== false
  };
}

function optionList(options, selected) {
  return Object.entries(options).map(([key, label]) =>
    `<option value="${key}" ${key === selected ? "selected" : ""}>${label}</option>`
  ).join("");
}

function layoutPicker() {
  return Object.entries(layouts).map(([id, [name, symbol]]) =>
    `<button type="button" class="layout-choice" data-layout="${id}" aria-pressed="${id === settings.layout}">${icon(symbol, 16)}<span>${name}</span></button>`
  ).join("");
}

function renderSettings() {
  const select = (key, label, options) =>
    `<label>${label}<select data-setting="${key}">${optionList(options, settings[key])}</select></label>`;
  $("#view-settings").innerHTML = `<div class="settings-heading"><h2>Formato de vista</h2>
    <button class="icon-button" popovertarget="view-settings" popovertargetaction="hide" aria-label="Cerrar formato">${icon("close")}</button></div>
    <div class="layout-picker settings-layouts" role="group" aria-label="Formato">${layoutPicker()}</div>
    <label class="settings-switch">Mostrar tareas completadas<input type="checkbox" role="switch" data-setting="showDone"
      ${settings.showDone || view === "completed" ? "checked" : ""} ${view === "completed" ? "disabled" : ""}></label>
    <div class="settings-group"><h3>Orden</h3>
    ${select("group", "Agrupar por", groupOptions)}
    ${select("sort", "Ordenar por", sortOptions)}
    ${select("direction", "Dirección", { asc: "Ascendente", desc: "Descendente" })}</div>
    <div class="settings-group"><h3>Filtros</h3>
    ${select("date", "Fecha de la tarea", dateOptions)}
    ${select("created", "Fecha de creación", createdOptions)}
    ${select("priority", "Prioridad", priorityOptions)}</div>
    <button class="reset-settings" data-action="reset-view">Restablecer todo</button>`;
  const active = Number(settings.date !== "all") + Number(settings.created !== "all") + Number(settings.priority !== "all");
  $("#format-button").classList.toggle("has-filters", active > 0);
  $("#format-button").setAttribute("aria-label", active ? `Formato, ${active} filtros activos` : "Formato");
}

function taskMatchesFilters(task) {
  const today = dateKey();
  const due = task.date;
  const created = task.created;
  const dueMatches = {
    all: true,
    overdue: Boolean(due && due < today && !task.done),
    today: due === today,
    week: due >= today && due <= dateKey(6),
    future: due > today,
    none: !due
  };
  const createdMatches = {
    all: true,
    today: created === today,
    week: created >= dateKey(-6) && created <= today,
    month: created >= dateKey(-29) && created <= today,
    none: !created
  };
  return dueMatches[settings.date] && createdMatches[settings.created] &&
    (settings.priority === "all" || settings.priority === String(task.priority));
}

function sortTasks(tasks) {
  const text = (a, b) => a.localeCompare(b, "es", { numeric: true });
  const projectName = (task) => projectFor(task.project)?.name ?? "Bandeja de entrada";
  const sectionName = (task) => sectionFor(task.section)?.name ?? "";
  const dates = (a, b) => (a || "9999").localeCompare(b || "9999");
  const comparisons = {
    priority: (a, b) => a.priority - b.priority || dates(a.date, b.date),
    date: (a, b) => dates(a.date, b.date),
    created: (a, b) => dates(a.created, b.created),
    name: (a, b) => text(a.title, b.title),
    project: (a, b) => text(projectName(a), projectName(b)),
    section: (a, b) => text(sectionName(a), sectionName(b))
  };
  if (settings.sort === "manual") return settings.direction === "asc" ? tasks : [...tasks].reverse();
  const direction = settings.direction === "asc" ? 1 : -1;
  return [...tasks].sort((a, b) => direction * comparisons[settings.sort](a, b));
}

function sectionScope() {
  if (view === "inbox") return "";
  return projectFor(view)?.id ?? null;
}

function groupForTask(task, key) {
  switch (key) {
    case "section": return { id: task.section || "", name: sectionFor(task.section)?.name ?? "Sin sección" };
    case "project": return { id: task.project || "", name: projectFor(task.project)?.name ?? "Bandeja de entrada" };
    case "priority": return { id: String(task.priority), name: priorityOptions[task.priority] };
    case "date": return { id: task.date || "", name: task.date ? dateLabel(task.date) : "Sin fecha" };
    default: return { id: "", name: "Tareas" };
  }
}

function taskGroups(tasks, grouping, includeSections = true) {
  const groups = new Map();
  const add = (id, name) => {
    if (!groups.has(id)) groups.set(id, { id, name, tasks: [] });
    return groups.get(id);
  };
  const scope = sectionScope();
  if (grouping === "section" && includeSections) {
    add("", "Sin sección");
    data.sections.filter((section) => section.project === null || section.project === scope)
      .forEach(({ id, name }) => add(id, name));
  }
  for (const task of tasks) {
    const { id, name } = groupForTask(task, grouping);
    add(id, name).tasks.push(task);
  }
  return [...groups.values()];
}

function sectionButton() {
  return `<button class="secondary section-add" data-action="section">${icon("plus", 15)}Añadir sección</button>`;
}

function groupedList(tasks) {
  if (settings.group === "none" && sectionScope() === null) return `<ul class="task-list">${tasks.map(taskRow).join("")}</ul>`;
  const groups = taskGroups(tasks, settings.group === "none" ? "section" : settings.group);
  return groups.map(({ name, tasks: rows, id }) => `<section class="list-group">
    <h3 class="group-title">${escapeHTML(name)} <span>${rows.length}</span></h3>
    <ul class="task-list">${rows.map(taskRow).join("")}</ul>
    ${rows.length === 0 && id ? '<p class="group-empty">Sin tareas en esta sección</p>' : ""}</section>`).join("");
}

function boardView(tasks) {
  const grouping = settings.group === "none" ? "section" : settings.group;
  const groups = taskGroups(tasks, grouping);
  const canDrop = grouping === "section";
  return `<div class="board-scroll"><div class="board-columns">${groups.map(({ id, name, tasks: rows }) => {
    const project = sectionFor(id)?.project;
    const context = sectionScope() === null && project != null
      ? projectFor(project)?.name ?? "Bandeja de entrada"
      : "";
    return `<section class="board-column" ${canDrop ? `data-drop-section="${id}"` : ""}>
      <h3 class="group-title">${escapeHTML(name)} <span>${rows.length}</span></h3>
      ${context ? `<p class="section-context">${escapeHTML(context)}</p>` : ""}
      <ul class="task-list board-cards">${rows.map((task) => taskRow(task, canDrop)).join("")}</ul>
      ${canDrop && view !== "completed"
        ? `<button class="add-inline" data-action="add" data-section="${id}">${icon("plus", 14)}Añadir tarea</button>`
        : rows.length === 0 ? '<p class="group-empty">Sin tareas</p>' : ""}
      </section>`;
  }).join("")}</div></div>`;
}

function tableHeading(key, label) {
  const active = settings.sort === key;
  return `<th scope="col" ${active ? `aria-sort="${settings.direction === "asc" ? "ascending" : "descending"}"` : ""}>
    <button data-table-sort="${key}">${label}${active ? icon(settings.direction === "asc" ? "arrowUp" : "arrowDown", 12) : ""}</button></th>`;
}

function tableView(tasks) {
  const groups = taskGroups(tasks, settings.group, false);
  return `<div class="table-scroll" tabindex="0" aria-label="Tabla de tareas desplazable">
    <table class="task-table"><thead><tr><th scope="col"><span class="sr-only">Estado</span></th>
    ${tableHeading("name", "Tarea")}${tableHeading("date", "Fecha")}${tableHeading("priority", "Prioridad")}
    ${tableHeading("project", "Proyecto")}${tableHeading("section", "Sección")}${tableHeading("created", "Creada")}
    <th scope="col"><span class="sr-only">Acciones</span></th></tr></thead>
    ${groups.map(({ name, tasks: rows }) => `<tbody>${settings.group === "none" ? "" :
    `<tr class="table-group"><th colspan="8" scope="rowgroup">${escapeHTML(name)} · ${rows.length}</th></tr>`}
    ${rows.map((task) => {
      const project = projectFor(task.project);
      return `<tr class="${task.done ? "done" : ""}"><td>${taskCheck(task)}</td>
      <td>${taskTitle(task)}${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ""}</td>
      <td>${task.date ? `<span title="${task.date}" class="${task.date < dateKey() && !task.done ? "overdue" : ""}">${dateLabel(task.date)}</span>` : "—"}</td>
      <td>${taskPriority(task) || "—"}</td><td><span class="meta">${project ? projectMarker(project) + escapeHTML(project.name) : "Entrada"}</span></td>
      <td>${escapeHTML(sectionFor(task.section)?.name ?? "—")}</td><td>${task.created ? dateLabel(task.created) : "—"}</td>
      <td>${taskEdit(task)}</td></tr>`;
    }).join("")}</tbody>`).join("")}</table></div>`;
}

const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function calendarView(tasks) {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const first = new Date(year, month, 1, 12);
  const monthLength = new Date(year, month + 1, 0, 12).getDate();
  const offset = (first.getDay() + 6) % 7;
  const weekStart = calendarDate.getDate() - (calendarDate.getDay() + 6) % 7;
  const isWeek = calendarMode === "week";
  const start = isWeek ? weekStart : 1 - offset;
  const length = isWeek ? 7 : Math.ceil((monthLength + offset) / 7) * 7;
  const days = Array.from({ length }, (_, index) => new Date(year, month, start + index, 12));
  const monthTitle = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" });
  const label = isWeek ? `${dateLabel(dateFrom(days[0]))} – ${dateLabel(dateFrom(days[6]))} · ${days[6].getFullYear()}` : monthTitle.format(first);
  const daysWithTasks = new Map();
  for (const task of tasks) {
    if (!daysWithTasks.has(task.date)) daysWithTasks.set(task.date, []);
    daysWithTasks.get(task.date).push(task);
  }
  const undated = daysWithTasks.get("") ?? [];
  return `<div class="calendar-toolbar"><h3 class="calendar-label">${label}</h3>
    <div class="calendar-controls">
      <button class="icon-button" data-action="calendar-prev" aria-label="Período anterior">${icon("chevronLeft")}</button>
      <button class="secondary" data-action="calendar-today">Hoy</button>
      <button class="icon-button" data-action="calendar-next" aria-label="Período siguiente">${icon("chevronRight")}</button>
      <select id="calendar-mode" aria-label="Período del calendario">${optionList({ month: "Mes", week: "Semana" }, calendarMode)}</select>
    </div></div>
    <div class="calendar-scroll" tabindex="0" aria-label="Calendario desplazable">
    <div class="calendar-grid ${isWeek ? "calendar-week" : ""}">
    ${weekdays.map((day) => `<div class="weekday">${day}</div>`).join("")}
    ${days.map((date) => {
      const key = dateFrom(date);
      const rows = daysWithTasks.get(key) ?? [];
      const today = key === dateKey();
      return `<div class="calendar-day ${date.getMonth() === month || isWeek ? "" : "outside-month"} ${today ? "is-today" : ""}" data-drop-date="${key}">
        <div class="day-heading"><time datetime="${key}" ${today ? 'aria-current="date"' : ""}>${date.getDate()}</time>
        <button class="icon-button day-add" data-action="add" data-date="${key}" aria-label="Añadir tarea para ${key}">${icon("plus", 14)}</button></div>
        ${taskGroups(rows, settings.group, false).map(({ name, tasks: entries }) => `
          ${settings.group === "none" ? "" : `<div class="day-group">${escapeHTML(name)}</div>`}
          ${entries.map((task) => `<div class="calendar-task p${task.priority} ${task.done ? "done" : ""}" draggable="true" data-drag-task="${task.id}">
            ${taskCheck(task)}${taskTitle(task, true)}</div>`).join("")}`).join("")}</div>`;
    }).join("")}</div></div>
    ${undated.length ? `<section class="list-group undated"><h3 class="group-title">Sin fecha <span>${undated.length}</span></h3>
      <ul class="task-list">${undated.map((task) => taskRow(task, true)).join("")}</ul></section>` : ""}`;
}

function moveCalendar(action) {
  if (action === "calendar-today") calendarDate = new Date();
  else {
    const direction = action === "calendar-next" ? 1 : -1;
    if (calendarMode === "week") calendarDate.setDate(calendarDate.getDate() + direction * 7);
    else calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + direction, 1, 12);
  }
  renderTaskList();
  document.querySelector(`[data-action="${action}"]`)?.focus({ preventScroll: true });
}
