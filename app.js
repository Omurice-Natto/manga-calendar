(() => {
  "use strict";

  const STORAGE_KEY = "mangaCalendarPersonalV13";
  const OLD_PERSONAL_V12_KEY = "mangaCalendarPersonalV12";
  const OLD_PERSONAL_V11_KEY = "mangaCalendarPersonalV11";
  const OLD_PERSONAL_V10_KEY = "mangaCalendarPersonalV10";
  const OLD_V9_KEY = "mangaCalendarPrototypeV9";
  const OLD_V8_KEY = "mangaCalendarPrototypeV8";
  const OLD_V7_KEY = "mangaCalendarPrototypeV7";
  const OLD_V6_KEY = "mangaCalendarPrototypeV6";
  const OLD_V5_KEY = "mangaCalendarPrototypeV5";
  const OLD_V4_KEY = "mangaCalendarPrototypeV4";
  const OLD_V3_KEY = "mangaCalendarPrototypeV3";
  const OLD_V2_KEY = "mangaCalendarPrototypeV2";
  const LOAD_DAYS = 45;
  const TIMELINE_START = 7 * 60;
  const TIMELINE_END = 26 * 60;
  const PIXELS_PER_MINUTE = 64 / 60;

  const LONG_PLAN_COLORS = [
    "#7c5cc4",  // purple
    "#2f8f83",  // teal
    "#4c78c2",  // blue
    "#d07a2d",  // orange
    "#c65b7c",  // rose
    "#5f9b4b",  // green
    "#6872b5",  // indigo
    "#9a6a45"   // brown
  ];

  const calendarScroll = document.getElementById("calendarScroll");
  const calendarGrid = document.getElementById("calendarGrid");

  const detailDialog = document.getElementById("detailDialog");
  const detailDateTitle = document.getElementById("detailDateTitle");
  const dailyMemo = document.getElementById("dailyMemo");
  const scheduleList = document.getElementById("scheduleList");
  const visualTimeline = document.getElementById("visualTimeline");
  const addScheduleBtn = document.getElementById("addScheduleBtn");
  const closeDetailBtn = document.getElementById("closeDetailBtn");

  const scheduleEditor = document.getElementById("scheduleEditor");
  const scheduleForm = document.getElementById("scheduleForm");
  const scheduleEditorTitle = document.getElementById("scheduleEditorTitle");
  const scheduleId = document.getElementById("scheduleId");
  const startHour = document.getElementById("startHour");
  const startMinute = document.getElementById("startMinute");
  const endHour = document.getElementById("endHour");
  const endMinute = document.getElementById("endMinute");
  const scheduleText = document.getElementById("scheduleText");
  const cancelScheduleBtn = document.getElementById("cancelScheduleBtn");
  const cancelScheduleBtn2 = document.getElementById("cancelScheduleBtn2");
  const deleteScheduleBtn = document.getElementById("deleteScheduleBtn");

  const planEditor = document.getElementById("planEditor");
  const planForm = document.getElementById("planForm");
  const planEditorTitle = document.getElementById("planEditorTitle");
  const planId = document.getElementById("planId");
  const planName = document.getElementById("planName");
  const planAmount = document.getElementById("planAmount");
  const cancelPlanBtn = document.getElementById("cancelPlanBtn");
  const cancelPlanBtn2 = document.getElementById("cancelPlanBtn2");
  const deletePlanBtn = document.getElementById("deletePlanBtn");

  const installBtn = document.getElementById("installBtn");
  const todayBtn = document.getElementById("todayBtn");
  const exportBtn = document.getElementById("exportBtn");
  const importInput = document.getElementById("importInput");

  const addLongPlanBtn = document.getElementById("addLongPlanBtn");
  const longPlanList = document.getElementById("longPlanList");

  const planUnit = document.getElementById("planUnit");

  const longPlanEditor = document.getElementById("longPlanEditor");
  const longPlanForm = document.getElementById("longPlanForm");
  const longPlanEditorTitle = document.getElementById("longPlanEditorTitle");
  const longPlanId = document.getElementById("longPlanId");
  const longPlanTitle = document.getElementById("longPlanTitle");
  const longPlanStart = document.getElementById("longPlanStart");
  const longPlanEnd = document.getElementById("longPlanEnd");
  const cancelLongPlanBtn = document.getElementById("cancelLongPlanBtn");
  const cancelLongPlanBtn2 = document.getElementById("cancelLongPlanBtn2");
  const deleteLongPlanBtn = document.getElementById("deleteLongPlanBtn");

  const importantDayEditor = document.getElementById("importantDayEditor");
  const importantDayForm = document.getElementById("importantDayForm");
  const importantDayEditorTitle = document.getElementById("importantDayEditorTitle");
  const importantDayId = document.getElementById("importantDayId");
  const importantDayText = document.getElementById("importantDayText");
  const importantDayDate = document.getElementById("importantDayDate");
  const cancelImportantDayBtn = document.getElementById("cancelImportantDayBtn");
  const cancelImportantDayBtn2 = document.getElementById("cancelImportantDayBtn2");
  const deleteImportantDayBtn = document.getElementById("deleteImportantDayBtn");

  let state = loadState();
  let firstDate = addDays(startOfDay(new Date()), -30);
  let lastDate = addDays(startOfDay(new Date()), 90);
  let activeDetailDate = null;
  let activePlanDate = null;
  let scrollLock = false;

  function uid(prefix = "id") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function createEmptyState() {
    return {
      version: 13,
      daily: {},
      longPlans: [],
      importantDays: []
    };
  }

  function normalizeState(target) {
    if (!target.daily || typeof target.daily !== "object") target.daily = {};
    if (!Array.isArray(target.longPlans)) target.longPlans = [];
    if (!Array.isArray(target.importantDays)) target.importantDays = [];

    target.longPlans.forEach((plan, index) => {
      if (!Number.isInteger(plan.colorIndex)) {
        plan.colorIndex = index % LONG_PLAN_COLORS.length;
      }
    });

    target.version = 13;

    Object.values(target.daily).forEach((record) => {
      if (!Array.isArray(record.plans)) record.plans = [];
      if (!Array.isArray(record.schedules)) record.schedules = [];
      if (typeof record.memo !== "string") record.memo = "";

      record.schedules.forEach((schedule) => {
        if (!schedule.color) schedule.color = "navy";
      });

      record.plans.forEach((plan) => {
        if (typeof plan.unit !== "string") plan.unit = "";
      });
    });
  }

  function migrateV2(v2) {
    const migrated = createEmptyState();
    if (!v2 || !v2.daily) return migrated;

    Object.entries(v2.daily).forEach(([key, record]) => {
      migrated.daily[key] = {
        plans: [],
        memo: record.memo ?? "",
        schedules: Array.isArray(record.schedules) ? record.schedules : []
      };
    });

    return migrated;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        normalizeState(parsed);
        return parsed;
      }

      const oldPersonalV12 = localStorage.getItem(OLD_PERSONAL_V12_KEY);
      if (oldPersonalV12) {
        const migrated = JSON.parse(oldPersonalV12);
        normalizeState(migrated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }

      const oldPersonalV11 = localStorage.getItem(OLD_PERSONAL_V11_KEY);
      if (oldPersonalV11) {
        const migrated = JSON.parse(oldPersonalV11);
        normalizeState(migrated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }

      const oldPersonalV10 = localStorage.getItem(OLD_PERSONAL_V10_KEY);
      if (oldPersonalV10) {
        const migrated = JSON.parse(oldPersonalV10);
        normalizeState(migrated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }

      const oldV9 = localStorage.getItem(OLD_V9_KEY);
      if (oldV9) {
        const migrated = JSON.parse(oldV9);
        normalizeState(migrated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }

      const oldV8 = localStorage.getItem(OLD_V8_KEY);
      if (oldV8) {
        const migrated = JSON.parse(oldV8);
        normalizeState(migrated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }

      const oldV7 = localStorage.getItem(OLD_V7_KEY);
      if (oldV7) {
        const migrated = JSON.parse(oldV7);
        normalizeState(migrated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }

      const oldV6 = localStorage.getItem(OLD_V6_KEY);
      if (oldV6) {
        const migrated = JSON.parse(oldV6);
        normalizeState(migrated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }

      const oldV5 = localStorage.getItem(OLD_V5_KEY);
      if (oldV5) {
        const migrated = JSON.parse(oldV5);
        normalizeState(migrated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }

      const oldV4 = localStorage.getItem(OLD_V4_KEY);
      if (oldV4) {
        const migrated = JSON.parse(oldV4);
        normalizeState(migrated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }

      const oldV3 = localStorage.getItem(OLD_V3_KEY);
      if (oldV3) {
        const migrated = JSON.parse(oldV3);
        normalizeState(migrated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }

      const oldV2 = localStorage.getItem(OLD_V2_KEY);
      if (oldV2) {
        const migrated = migrateV2(JSON.parse(oldV2));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    } catch (error) {
      console.warn("保存データを読み込めませんでした。", error);
    }

    return createEmptyState();
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function addDays(date, amount) {
    const d = new Date(date);
    d.setDate(d.getDate() + amount);
    return d;
  }

  function dateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function parseDateKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function getDailyRecord(key) {
    if (!state.daily[key]) {
      state.daily[key] = {
        plans: [],
        memo: "",
        schedules: []
      };
    }

    const record = state.daily[key];
    if (!Array.isArray(record.plans)) record.plans = [];
    if (!Array.isArray(record.schedules)) record.schedules = [];
    if (typeof record.memo !== "string") record.memo = "";

    return record;
  }

  function createHeader() {
    const header = document.createElement("div");
    header.className = "grid-header";

    const dateHeading = document.createElement("div");
    dateHeading.className = "date-heading";

    const dateTitle = document.createElement("span");
    dateTitle.textContent = "日付";

    const importantButton = document.createElement("button");
    importantButton.type = "button";
    importantButton.className = "important-day-add";
    importantButton.innerHTML = '<span class="important-label-desktop">＋ 大事な日</span><span class="important-label-mobile">＋重要</span>';
    importantButton.addEventListener("click", () => openImportantDayEditor());

    dateHeading.appendChild(dateTitle);
    dateHeading.appendChild(importantButton);

    const plansHeading = document.createElement("div");
    plansHeading.className = "plans-heading";
    plansHeading.textContent = "その日の制作予定（＋で追加 / 進捗は10%刻み）";

    header.appendChild(dateHeading);
    header.appendChild(plansHeading);
    return header;
  }

  function renderCalendar({ scrollToday = true } = {}) {
    calendarGrid.innerHTML = "";
    calendarGrid.appendChild(createHeader());

    let current = new Date(firstDate);
    while (current <= lastDate) {
      calendarGrid.appendChild(createDateRow(current));
      current = addDays(current, 1);
    }

    if (scrollToday) requestAnimationFrame(() => requestAnimationFrame(scrollToToday));
  }

  function rerenderKeepingPosition() {
    const top = calendarScroll.scrollTop;
    const left = calendarScroll.scrollLeft;
    renderCalendar({ scrollToday: false });
    requestAnimationFrame(() => {
      calendarScroll.scrollTop = top;
      calendarScroll.scrollLeft = left;
    });
  }

  function longPlanColor(plan) {
    const index = Number.isInteger(plan?.colorIndex) ? plan.colorIndex : 0;
    return LONG_PLAN_COLORS[index % LONG_PLAN_COLORS.length];
  }

  function nextLongPlanColorIndex() {
    const used = new Set(state.longPlans.map((plan) => plan.colorIndex));
    for (let i = 0; i < LONG_PLAN_COLORS.length; i++) {
      if (!used.has(i)) return i;
    }

    // 色数を超えたら順番に再利用
    return state.longPlans.length % LONG_PLAN_COLORS.length;
  }

  function dateInRange(key, start, end) {
    return key >= start && key <= end;
  }

  function longPlansForDate(key) {
    return state.longPlans.filter((plan) => dateInRange(key, plan.start, plan.end));
  }

  function importantDaysForDate(key) {
    return state.importantDays.filter((item) => item.date === key);
  }

  function createDateRow(date) {
    const key = dateKey(date);
    const record = getDailyRecord(key);

    const row = document.createElement("div");
    row.className = "date-row";
    row.dataset.date = key;

    if (key === dateKey(new Date())) row.classList.add("today-row");
    if ([0, 6].includes(date.getDay())) row.classList.add("weekend");
    if (record.schedules.length > 0) row.classList.add("has-detail-schedule");
    if (longPlansForDate(key).length > 0) row.classList.add("in-long-plan");
    if (importantDaysForDate(key).length > 0) row.classList.add("has-important-day");

    const dateArea = document.createElement("div");
    dateArea.className = "date-area";

    const dateButton = document.createElement("button");
    dateButton.type = "button";
    dateButton.className = "date-cell";
    const week = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
    dateButton.innerHTML = `<strong>${date.getMonth() + 1}/${date.getDate()}（${week}）</strong><span>${date.getFullYear()}</span>`;
    dateButton.addEventListener("click", () => openDetail(key));

    const dateSideTop = document.createElement("div");
    dateSideTop.className = "date-side-top";

    const importantItems = importantDaysForDate(key);
    if (importantItems.length === 0) {
      const emptyImportant = document.createElement("span");
      emptyImportant.className = "important-day-empty";
      emptyImportant.textContent = "";
      dateSideTop.appendChild(emptyImportant);
    } else {
      importantItems.forEach((item) => {
        const label = document.createElement("button");
        label.type = "button";
        label.className = "important-day-label";
        label.textContent = item.text;
        label.title = "クリックして大事な日を編集";
        label.addEventListener("click", () => openImportantDayEditor(item.id));
        dateSideTop.appendChild(label);
      });
    }

    const dateSideBottom = document.createElement("div");
    dateSideBottom.className = "date-side-bottom";

    const dayProgress = document.createElement("div");
    dayProgress.className = "day-progress-badge";
    applyDayProgressBadge(dayProgress, record.plans, key);

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "day-add-button";
    addButton.textContent = "＋";
    addButton.title = "この日に制作予定を追加";
    addButton.addEventListener("click", () => openPlanEditor(key));

    dateSideBottom.appendChild(dayProgress);
    dateSideBottom.appendChild(addButton);

    dateArea.appendChild(dateButton);
    dateArea.appendChild(dateSideTop);
    dateArea.appendChild(dateSideBottom);

    const plansArea = document.createElement("div");
    plansArea.className = "plans-area";

    const overlappingLongPlans = longPlansForDate(key);
    if (overlappingLongPlans.length > 0) {
      plansArea.style.setProperty("--long-strip-count", String(overlappingLongPlans.length));

      const strips = document.createElement("div");
      strips.className = "long-plan-strips";

      overlappingLongPlans.forEach((longPlan) => {
        const strip = document.createElement("div");
        strip.className = "long-plan-strip";
        strip.style.background = longPlanColor(longPlan);
        strip.title = longPlan.title;
        strips.appendChild(strip);
      });

      plansArea.appendChild(strips);
    }

    if (record.plans.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-plans";
      empty.textContent = "制作予定なし";
      plansArea.appendChild(empty);
    } else {
      record.plans.forEach((plan) => {
        plansArea.appendChild(createPlanCard(key, plan));
      });
    }

    row.appendChild(dateArea);
    row.appendChild(plansArea);
    return row;
  }

  function progressClass(value, key = null) {
    const p = Number(value) || 0;

    // 0%は今日・未来なら未着手として無色。
    // 昨日以前で0%のままなら未達として赤。
    if (p <= 0) {
      if (key && key < dateKey(new Date())) return "progress-red";
      return "progress-none";
    }

    if (p >= 80) return "progress-green";
    if (p >= 51) return "progress-yellow";
    return "progress-red";
  }

  function averageDayProgress(plans) {
    if (!Array.isArray(plans) || plans.length === 0) return null;
    const total = plans.reduce((sum, plan) => sum + (Number(plan.progress) || 0), 0);
    return Math.round(total / plans.length);
  }

  function applyDayProgressBadge(badge, plans, key = null) {
    badge.classList.remove("progress-none", "progress-red", "progress-yellow", "progress-green");
    const average = averageDayProgress(plans);

    if (average === null) {
      badge.textContent = "—";
      badge.classList.add("progress-none");
      return;
    }

    badge.textContent = `${average}%`;
    badge.classList.add(progressClass(average, key));
  }

  function updateDayProgressBadge(key) {
    const row = calendarGrid.querySelector(`[data-date="${key}"]`);
    if (!row) return;
    const badge = row.querySelector(".day-progress-badge");
    if (!badge) return;
    applyDayProgressBadge(badge, getDailyRecord(key).plans, key);
  }

  function createPlanCard(key, plan) {
    const card = document.createElement("div");
    card.className = `plan-card ${progressClass(plan.progress, key)}`;

    const nameButton = document.createElement("button");
    nameButton.type = "button";
    nameButton.className = "plan-name-button";
    nameButton.textContent = plan.name;
    nameButton.title = "クリックして編集";
    nameButton.addEventListener("click", () => openPlanEditor(key, plan.id));

    const amount = document.createElement("div");
    amount.className = "plan-amount";

    const amountNumber = document.createElement("span");
    amountNumber.textContent = String(plan.amount);
    amount.appendChild(amountNumber);

    if (plan.unit) {
      const unit = document.createElement("span");
      unit.className = "plan-unit";
      unit.textContent = plan.unit;
      amount.appendChild(unit);
    }

    const progressWrap = document.createElement("div");
    progressWrap.className = "progress-wrap";

    const label = document.createElement("label");
    label.textContent = "進捗";

    const select = document.createElement("select");
    select.className = "progress-select";

    for (let p = 0; p <= 100; p += 10) {
      const option = document.createElement("option");
      option.value = String(p);
      option.textContent = `${p}%`;
      if (Number(plan.progress) === p) option.selected = true;
      select.appendChild(option);
    }

    select.addEventListener("change", () => {
      plan.progress = Number(select.value);
      card.classList.remove("progress-none", "progress-red", "progress-yellow", "progress-green");
      card.classList.add(progressClass(plan.progress, key));
      updateDayProgressBadge(key);
      saveState();
    });

    progressWrap.appendChild(label);
    progressWrap.appendChild(select);

    card.appendChild(nameButton);
    card.appendChild(amount);
    card.appendChild(progressWrap);

    return card;
  }

  function openPlanEditor(key, editId = null) {
    activePlanDate = key;

    const record = getDailyRecord(key);
    const plan = editId ? record.plans.find((x) => x.id === editId) : null;

    planEditorTitle.textContent = plan ? "制作予定を編集" : "制作予定を追加";
    planId.value = plan?.id ?? "";
    planName.value = plan?.name ?? "";
    planAmount.value = plan?.amount ?? "";
    planUnit.value = plan?.unit ?? "";
    deletePlanBtn.classList.toggle("hidden", !plan);

    planEditor.showModal();
    requestAnimationFrame(() => planName.focus());
  }

  planForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!activePlanDate) return;

    const name = planName.value.trim();
    const amount = Number(planAmount.value);
    const unit = planUnit.value.trim();

    if (!name || !Number.isFinite(amount) || amount < 0) return;

    const record = getDailyRecord(activePlanDate);
    const existing = record.plans.find((x) => x.id === planId.value);

    if (existing) {
      existing.name = name;
      existing.amount = amount;
      existing.unit = unit;
    } else {
      const newPlan = {
        id: uid("plan"),
        name,
        amount,
        unit,
        progress: 0
      };

      record.plans.push(newPlan);
    }

    saveState();
    planEditor.close();
    rerenderKeepingPosition();
  });

  deletePlanBtn.addEventListener("click", () => {
    if (!activePlanDate || !planId.value) return;
    const record = getDailyRecord(activePlanDate);
    const existing = record.plans.find((x) => x.id === planId.value);
    if (!existing) return;

    if (!confirm(`「${existing.name}」を削除しますか？`)) return;

    record.plans = record.plans.filter((x) => x.id !== planId.value);
    saveState();
    planEditor.close();
    rerenderKeepingPosition();
  });

  cancelPlanBtn.addEventListener("click", () => planEditor.close());
  cancelPlanBtn2.addEventListener("click", () => planEditor.close());

  planEditor.addEventListener("close", () => {
    activePlanDate = null;
  });

  function formatShortDate(key) {
    if (!key) return "";
    const d = parseDateKey(key);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  function renderLongPlanList() {
    longPlanList.innerHTML = "";

    const plans = [...state.longPlans].sort((a, b) => a.start.localeCompare(b.start));

    if (plans.length === 0) {
      const empty = document.createElement("div");
      empty.className = "long-plan-empty";
      empty.textContent = "長期予定はまだありません。";
      longPlanList.appendChild(empty);
      return;
    }

    plans.forEach((plan) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "long-plan-card";
      card.style.setProperty("--long-color", longPlanColor(plan));
      card.innerHTML = `<strong></strong><span>${formatShortDate(plan.start)} 〜 ${formatShortDate(plan.end)}</span>`;
      card.querySelector("strong").textContent = plan.title;
      card.addEventListener("click", () => openLongPlanEditor(plan.id));
      longPlanList.appendChild(card);
    });
  }

  function openLongPlanEditor(id = null) {
    const plan = id ? state.longPlans.find((item) => item.id === id) : null;

    longPlanEditorTitle.textContent = plan ? "長期の制作予定を編集" : "長期の制作予定を追加";
    longPlanId.value = plan?.id ?? "";
    longPlanTitle.value = plan?.title ?? "";
    longPlanStart.value = plan?.start ?? dateKey(new Date());
    longPlanEnd.value = plan?.end ?? dateKey(addDays(new Date(), 30));
    deleteLongPlanBtn.classList.toggle("hidden", !plan);

    longPlanEditor.showModal();
    requestAnimationFrame(() => longPlanTitle.focus());
  }

  addLongPlanBtn.addEventListener("click", () => openLongPlanEditor());
  cancelLongPlanBtn.addEventListener("click", () => longPlanEditor.close());
  cancelLongPlanBtn2.addEventListener("click", () => longPlanEditor.close());

  longPlanForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = longPlanTitle.value.trim();
    const start = longPlanStart.value;
    const end = longPlanEnd.value;

    if (!title || !start || !end) return;
    if (end < start) {
      alert("終了日は開始日以降にしてください。");
      return;
    }

    const existing = state.longPlans.find((item) => item.id === longPlanId.value);

    if (existing) {
      existing.title = title;
      existing.start = start;
      existing.end = end;
    } else {
      state.longPlans.push({
        id: uid("long"),
        title,
        start,
        end,
        colorIndex: nextLongPlanColorIndex()
      });
    }

    saveState();
    longPlanEditor.close();
    renderLongPlanList();
    rerenderKeepingPosition();
  });

  deleteLongPlanBtn.addEventListener("click", () => {
    const existing = state.longPlans.find((item) => item.id === longPlanId.value);
    if (!existing) return;

    if (!confirm(`「${existing.title}」を削除しますか？`)) return;

    state.longPlans = state.longPlans.filter((item) => item.id !== existing.id);
    saveState();
    longPlanEditor.close();
    renderLongPlanList();
    rerenderKeepingPosition();
  });

  function openImportantDayEditor(id = null) {
    const item = id ? state.importantDays.find((x) => x.id === id) : null;

    importantDayEditorTitle.textContent = item ? "大事な日を編集" : "大事な日を追加";
    importantDayId.value = item?.id ?? "";
    importantDayText.value = item?.text ?? "";
    importantDayDate.value = item?.date ?? dateKey(new Date());
    deleteImportantDayBtn.classList.toggle("hidden", !item);

    importantDayEditor.showModal();
    requestAnimationFrame(() => importantDayText.focus());
  }

  cancelImportantDayBtn.addEventListener("click", () => importantDayEditor.close());
  cancelImportantDayBtn2.addEventListener("click", () => importantDayEditor.close());

  importantDayForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = importantDayText.value.trim();
    const date = importantDayDate.value;
    if (!text || !date) return;

    const existing = state.importantDays.find((item) => item.id === importantDayId.value);

    if (existing) {
      existing.text = text;
      existing.date = date;
    } else {
      state.importantDays.push({
        id: uid("important"),
        text,
        date
      });
    }

    saveState();
    importantDayEditor.close();
    rerenderKeepingPosition();
  });

  deleteImportantDayBtn.addEventListener("click", () => {
    const existing = state.importantDays.find((item) => item.id === importantDayId.value);
    if (!existing) return;

    if (!confirm(`「${existing.text}」を削除しますか？`)) return;

    state.importantDays = state.importantDays.filter((item) => item.id !== existing.id);
    saveState();
    importantDayEditor.close();
    rerenderKeepingPosition();
  });

  function appendDays(amount = LOAD_DAYS) {
    const start = addDays(lastDate, 1);
    lastDate = addDays(lastDate, amount);

    let current = start;
    while (current <= lastDate) {
      calendarGrid.appendChild(createDateRow(current));
      current = addDays(current, 1);
    }
  }

  function prependDays(amount = LOAD_DAYS) {
    const oldHeight = calendarScroll.scrollHeight;
    const oldTop = calendarScroll.scrollTop;
    const end = addDays(firstDate, -1);
    firstDate = addDays(firstDate, -amount);

    const header = calendarGrid.querySelector(".grid-header");
    const rows = [];
    let current = new Date(firstDate);

    while (current <= end) {
      rows.push(createDateRow(current));
      current = addDays(current, 1);
    }

    rows.reverse().forEach((row) => header.after(row));

    requestAnimationFrame(() => {
      calendarScroll.scrollTop = oldTop + (calendarScroll.scrollHeight - oldHeight);
      scrollLock = false;
    });
  }

  calendarScroll.addEventListener("scroll", () => {
    if (scrollLock) return;

    const nearBottom =
      calendarScroll.scrollTop + calendarScroll.clientHeight >
      calendarScroll.scrollHeight - 400;

    if (nearBottom) appendDays();

    if (calendarScroll.scrollTop < 250) {
      scrollLock = true;
      prependDays();
    }
  });

  function scrollToToday() {
    const todayKey = dateKey(new Date());
    let todayRow = calendarGrid.querySelector(`[data-date="${todayKey}"]`);

    if (!todayRow) {
      const today = startOfDay(new Date());
      firstDate = addDays(today, -30);
      lastDate = addDays(today, 90);
      renderCalendar({ scrollToday: false });
      todayRow = calendarGrid.querySelector(`[data-date="${todayKey}"]`);
      if (!todayRow) return;
    }

    const header = calendarGrid.querySelector(".grid-header");
    const headerHeight = header?.getBoundingClientRect().height ?? 0;

    /*
      offsetTop は環境によって body 基準になることがあり、
      カレンダー上部の高さぶん余計にスクロールしてしまう。
      grid と今日の行の実座標差から、カレンダー内部の正確な位置を求める。
    */
    const gridRect = calendarGrid.getBoundingClientRect();
    const rowRect = todayRow.getBoundingClientRect();
    const rowTopInsideGrid = rowRect.top - gridRect.top;

    const target = Math.max(0, rowTopInsideGrid - headerHeight);

    // 無限スクロール側の処理が割り込まないよう、この1回だけロックする。
    scrollLock = true;
    calendarScroll.scrollTop = target;

    requestAnimationFrame(() => {
      calendarScroll.scrollTop = target;
      requestAnimationFrame(() => {
        scrollLock = false;
      });
    });
  }

  todayBtn.addEventListener("click", scrollToToday);

  function formatJapaneseDate(key) {
    const d = parseDateKey(key);
    const week = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${week}）`;
  }

  function openDetail(key) {
    activeDetailDate = key;
    const record = getDailyRecord(key);
    detailDateTitle.textContent = formatJapaneseDate(key);
    dailyMemo.value = record.memo ?? "";
    renderScheduleList();
    renderVisualTimeline();
    detailDialog.showModal();
  }

  closeDetailBtn.addEventListener("click", () => detailDialog.close());

  dailyMemo.addEventListener("input", () => {
    if (!activeDetailDate) return;
    getDailyRecord(activeDetailDate).memo = dailyMemo.value;
    saveState();
  });

  function clampMinute(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(59, Math.trunc(n)));
  }

  function setDigitalTimeFields(kind, value) {
    const [rawH, rawM] = String(value || "00:00").split(":").map(Number);
    let absoluteHour = rawH;
    if (absoluteHour < 7) absoluteHour += 24;

    const hourField = kind === "start" ? startHour : endHour;
    const minuteField = kind === "start" ? startMinute : endMinute;

    hourField.value = String(Math.max(7, Math.min(26, absoluteHour)));
    minuteField.value = String(clampMinute(rawM));
  }

  function getDigitalTimeValue(kind) {
    const hourField = kind === "start" ? startHour : endHour;
    const minuteField = kind === "start" ? startMinute : endMinute;

    const absoluteHour = Number(hourField.value);
    const minute = clampMinute(minuteField.value);
    minuteField.value = String(minute);

    const clockHour = ((absoluteHour % 24) + 24) % 24;
    return `${String(clockHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  function formatScheduleClock(value) {
    const [h, m] = String(value).split(":").map(Number);
    const prefix = h < 7 ? "翌" : "";
    return `${prefix}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function timeToMinutes(value) {
    const [h, m] = value.split(":").map(Number);
    return h * 60 + m;
  }

  function normalizeTimeRange(start, end) {
    let startMin = timeToMinutes(start);
    let endMin = timeToMinutes(end);

    if (startMin < TIMELINE_START) startMin += 24 * 60;
    if (endMin < TIMELINE_START) endMin += 24 * 60;
    if (endMin <= startMin) endMin += 24 * 60;

    return { startMin, endMin };
  }

  function isRangeValid(start, end) {
    const { startMin, endMin } = normalizeTimeRange(start, end);
    return startMin >= TIMELINE_START &&
      endMin <= TIMELINE_END &&
      endMin > startMin;
  }

  function hasScheduleOverlap(record, start, end, ignoreId = null) {
    const next = normalizeTimeRange(start, end);

    return record.schedules.some((existing) => {
      if (ignoreId && existing.id === ignoreId) return false;

      const current = normalizeTimeRange(existing.start, existing.end);

      // 例: 20:00〜21:00 と 21:00〜22:00 は重複扱いにしない
      return next.startMin < current.endMin && next.endMin > current.startMin;
    });
  }

  function renderScheduleList() {
    if (!activeDetailDate) return;
    const record = getDailyRecord(activeDetailDate);
    const schedules = [...record.schedules].sort((a, b) => {
      return normalizeTimeRange(a.start, a.end).startMin - normalizeTimeRange(b.start, b.end).startMin;
    });

    scheduleList.innerHTML = "";

    if (schedules.length === 0) {
      scheduleList.innerHTML = `<div class="empty-schedule">まだ予定はありません。「＋ 予定を追加」から登録できます。</div>`;
      return;
    }

    schedules.forEach((event) => {
      const card = document.createElement("div");
      card.className = `schedule-card schedule-color-${event.color ?? "navy"}`;
      card.innerHTML = `
        <div class="schedule-time">${formatScheduleClock(event.start)} 〜 ${formatScheduleClock(event.end)}</div>
        <div class="schedule-content"></div>
        <button class="mini-button" type="button">編集</button>
      `;
      card.querySelector(".schedule-content").textContent = event.text;
      card.querySelector(".mini-button").addEventListener("click", () => openScheduleEditor(event.id));
      scheduleList.appendChild(card);
    });
  }

  function renderVisualTimeline() {
    if (!activeDetailDate) return;
    const record = getDailyRecord(activeDetailDate);
    visualTimeline.innerHTML = "";

    for (let hour = 7; hour <= 26; hour++) {
      const top = (hour * 60 - TIMELINE_START) * PIXELS_PER_MINUTE;

      const line = document.createElement("div");
      line.className = "hour-line";
      line.style.top = `${top}px`;
      visualTimeline.appendChild(line);

      const label = document.createElement("div");
      label.className = "hour-label";
      if (hour === 26) label.classList.add("timeline-end-label");
      label.style.top = `${top}px`;

      const clockHour = hour % 24;
      label.textContent = hour >= 24
        ? `翌${String(clockHour).padStart(2, "0")}:00`
        : `${String(clockHour).padStart(2, "0")}:00`;

      visualTimeline.appendChild(label);
    }

    const rail = document.createElement("div");
    rail.className = "timeline-rail";
    visualTimeline.appendChild(rail);

    [...record.schedules]
      .sort((a, b) => normalizeTimeRange(a.start, a.end).startMin - normalizeTimeRange(b.start, b.end).startMin)
      .forEach((event) => {
        const { startMin, endMin } = normalizeTimeRange(event.start, event.end);
        const top = (startMin - TIMELINE_START) * PIXELS_PER_MINUTE;
        const height = Math.max(28, (endMin - startMin) * PIXELS_PER_MINUTE);

        const overlay = document.createElement("div");
        overlay.className = `event-overlay schedule-color-${event.color ?? "navy"}`;
        overlay.style.top = `${top}px`;
        overlay.style.height = `${height}px`;

        const range = document.createElement("div");
        range.className = "event-range";

        const card = document.createElement("div");
        card.className = "event-card";
        card.innerHTML = `
          <span class="event-time">${formatScheduleClock(event.start)} 〜 ${formatScheduleClock(event.end)}</span>
          <span class="event-text"></span>
        `;
        card.querySelector(".event-text").textContent = event.text;
        card.addEventListener("click", () => openScheduleEditor(event.id));

        overlay.appendChild(range);
        overlay.appendChild(card);
        visualTimeline.appendChild(overlay);
      });
  }

  addScheduleBtn.addEventListener("click", () => openScheduleEditor());

  function openScheduleEditor(id = null) {
    if (!activeDetailDate) return;
    const record = getDailyRecord(activeDetailDate);
    const event = id ? record.schedules.find((x) => x.id === id) : null;

    scheduleEditorTitle.textContent = event ? "予定を編集" : "予定を追加";
    scheduleId.value = event?.id ?? "";
    setDigitalTimeFields("start", event?.start ?? "21:00");
    setDigitalTimeFields("end", event?.end ?? "23:00");
    scheduleText.value = event?.text ?? "";

    const selectedColor = event?.color ?? "navy";
    document.querySelectorAll('input[name="scheduleColor"]').forEach((radio) => {
      radio.checked = radio.value === selectedColor;
    });

    deleteScheduleBtn.classList.toggle("hidden", !event);

    scheduleEditor.showModal();
    requestAnimationFrame(() => scheduleText.focus());
  }

  cancelScheduleBtn.addEventListener("click", () => scheduleEditor.close());
  cancelScheduleBtn2.addEventListener("click", () => scheduleEditor.close());

  scheduleForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!activeDetailDate) return;

    const start = getDigitalTimeValue("start");
    const end = getDigitalTimeValue("end");
    const text = scheduleText.value.trim();
    const color = document.querySelector('input[name="scheduleColor"]:checked')?.value ?? "navy";

    if (!start || !end) return;

    if (!isRangeValid(start, end)) {
      alert("時間は 07:00〜翌02:00 の範囲で入力してください。終了時刻は開始時刻より後にしてください。");
      return;
    }

    const record = getDailyRecord(activeDetailDate);
    const existing = record.schedules.find((x) => x.id === scheduleId.value);

    if (hasScheduleOverlap(record, start, end, scheduleId.value || null)) {
      alert("この時間帯は、すでに別の予定が入っています。重複しない時間を指定してください。");
      return;
    }

    if (existing) {
      existing.start = start;
      existing.end = end;
      existing.text = text;
      existing.color = color;
    } else {
      record.schedules.push({
        id: uid("schedule"),
        start,
        end,
        text,
        color
      });
    }

    saveState();
    scheduleEditor.close();
    renderScheduleList();
    renderVisualTimeline();
    updateRenderedDateHighlight(activeDetailDate);
  });

  deleteScheduleBtn.addEventListener("click", () => {
    if (!activeDetailDate || !scheduleId.value) return;
    const record = getDailyRecord(activeDetailDate);
    const existing = record.schedules.find((x) => x.id === scheduleId.value);
    if (!existing) return;

    if (!confirm(existing.text ? `「${existing.text}」を削除しますか？` : "この時間予定を削除しますか？")) return;

    record.schedules = record.schedules.filter((x) => x.id !== scheduleId.value);
    saveState();
    scheduleEditor.close();
    renderScheduleList();
    renderVisualTimeline();
    updateRenderedDateHighlight(activeDetailDate);
  });

  function updateRenderedDateHighlight(key) {
    const row = calendarGrid.querySelector(`[data-date="${key}"]`);
    if (!row) return;
    const hasSchedules = getDailyRecord(key).schedules.length > 0;
    row.classList.toggle("has-detail-schedule", hasSchedules);
  }

  detailDialog.addEventListener("close", () => {
    if (activeDetailDate) updateRenderedDateHighlight(activeDetailDate);
    activeDetailDate = null;
  });

  exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `manga-calendar-backup-${dateKey(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  importInput.addEventListener("change", async () => {
    const file = importInput.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (!imported || typeof imported !== "object") throw new Error("形式が正しくありません。");

      normalizeState(imported);
      state = imported;
      saveState();
      renderLongPlanList();
      renderCalendar();
      alert("バックアップを復元しました。");
    } catch (error) {
      alert(`復元できませんでした：${error.message}`);
    } finally {
      importInput.value = "";
    }
  });

  // ===== PWA / Android install =====
  let deferredInstallPrompt = null;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installBtn?.classList.remove("hidden");
  });

  installBtn?.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;

    deferredInstallPrompt.prompt();
    try {
      await deferredInstallPrompt.userChoice;
    } finally {
      deferredInstallPrompt = null;
      installBtn.classList.add("hidden");
    }
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installBtn?.classList.add("hidden");
  });

  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((error) => {
        console.warn("Service Worker registration failed:", error);
      });
    });
  }

  renderLongPlanList();
  renderCalendar();
})();
