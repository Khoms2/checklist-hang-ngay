// ===== DATA =====
const DEFAULT_SECTIONS = [
    {
        id: 'morning', title: 'Buổi sáng', subtitle: 'Morning Routine', icon: '🌅', theme: 'theme-blue',
        items: [
            { id: 'm1', text: 'Thức dậy đúng giờ' },
            { id: 'm2', text: 'Uống 1 ly nước' },
            { id: 'm3', text: 'Vận động nhẹ (5–10 phút)' },
            { id: 'm4', text: 'Lên kế hoạch hôm nay (3 việc chính)' }
        ]
    },
    {
        id: 'work', title: 'Công việc / Học tập', subtitle: 'Focus & Productivity', icon: '💼', theme: 'theme-purple',
        items: [
            { id: 'w1', text: 'Làm việc/học tập tập trung (ít nhất 2–3 giờ)' },
            { id: 'w2', text: 'Hoàn thành 1 task quan trọng nhất (MIT)' },
            { id: 'w3', text: 'Kiểm tra & trả lời tin nhắn/email' },
            { id: 'w4', text: 'Học thêm 1 kỹ năng mới (30 phút)' }
        ]
    },
    {
        id: 'personal', title: 'Sinh hoạt cá nhân', subtitle: 'Healthy Living', icon: '🍽️', theme: 'theme-green',
        items: [
            { id: 'p1', text: 'Ăn đủ 2–3 bữa' },
            { id: 'p2', text: 'Uống đủ nước (≥ 1.5L)' },
            { id: 'p3', text: 'Dọn dẹp không gian cá nhân' },
            { id: 'p4', text: 'Tắm rửa / vệ sinh cá nhân' }
        ]
    },
    {
        id: 'growth', title: 'Phát triển bản thân', subtitle: 'Self-Improvement', icon: '🧠', theme: 'theme-orange',
        items: [
            { id: 'g1', text: 'Đọc sách (10–20 phút)' },
            { id: 'g2', text: 'Xem/ học 1 nội dung bổ ích' },
            { id: 'g3', text: 'Ghi chú lại điều học được' }
        ]
    },
    {
        id: 'mental', title: 'Kết nối & tinh thần', subtitle: 'Mental Health', icon: '❤️', theme: 'theme-pink',
        items: [
            { id: 'c1', text: 'Nói chuyện với gia đình / bạn bè' },
            { id: 'c2', text: 'Nghỉ ngơi / giải trí (không quá 1–2h)' },
            { id: 'c3', text: 'Không dùng điện thoại trước khi ngủ 30 phút' }
        ]
    },
    {
        id: 'evening', title: 'Tổng kết ngày', subtitle: 'End-of-Day Review', icon: '🌙', theme: 'theme-indigo',
        items: [
            { id: 'e1', text: 'Review hôm nay làm được gì' },
            { id: 'e2', text: 'Chuẩn bị cho ngày mai' },
            { id: 'e3', text: 'Ngủ trước 23h–24h' }
        ]
    }
];

const SECTION_THEMES = ['section-morning','section-evening','section-practice','section-bug','section-review','section-log'];

// ===== PER-DAY SECTIONS =====
function getDaySections(dk) {
    dk = dk || dateKey();
    return gs(`sections_${dk}`, null);
}
function saveDaySections(sections, dk) {
    dk = dk || dateKey();
    ss(`sections_${dk}`, sections);
    FirebaseApp.save(`sections/${dk}`, sections);
}
function ensureDaySections() {
    const dk = dateKey();
    let secs = getDaySections(dk);
    if (secs && secs.length > 0) return secs;

    // Tomorrow (future days) should start empty as requested
    if (dayOffset > 0) {
        saveDaySections([], dk);
        ss(`_hidden_sections_${dk}`, []);
        return [];
    }

    // Today/Past days: Check previous day for data to inherit
    const ydKey = dateKey(dayOffset - 1);
    const yd = getDaySections(ydKey);
    
    if (yd) {
        const copy = JSON.parse(JSON.stringify(yd));
        saveDaySections(copy, dk);
        
        // Inherit custom tasks for each inherited section
        copy.forEach(sec => {
            const ydCustom = gs(`custom_${ydKey}_${sec.id}`, []);
            if (ydCustom.length > 0) {
                saveCustomTasks(sec.id, ydCustom); // saves to current dk
            }
        });

        // Inherit hidden (soft-deleted) sections state
        const ydHidden = gs(`_hidden_sections_${ydKey}`, []);
        ss(`_hidden_sections_${dk}`, ydHidden);
        FirebaseApp.save(`hiddenSections/${dk}`, ydHidden);
        
        return copy;
    }

    // Default initialization: Use DEFAULT_SECTIONS for first-time setup
    const defaults = JSON.parse(JSON.stringify(DEFAULT_SECTIONS));
    saveDaySections(defaults, dk);
    ss(`_hidden_sections_${dk}`, []);
    return defaults;
}
function getActiveSections() {
    const hiddenIds = getHiddenSectionIds();
    return ensureDaySections().filter(s => !hiddenIds.includes(s.id));
}

const QUOTES = [
    '"Mỗi ngày đều là cơ hội để trở nên giỏi hơn!" 💪', '"Kiên trì mỗi ngày, thành công sẽ đến!" 🚀',
    '"Không có đường tắt – chỉ có nỗ lực thật sự!" 🔥', '"Hôm nay khó, ngày mai sẽ dễ hơn!" ⭐',
    '"Tester giỏi = quan sát kỹ + tư duy logic!" 🧠', '"Bug là bạn, không phải kẻ thù!" 🐞',
    '"1% tiến bộ mỗi ngày = 37x sau 1 năm!" 📈', '"Đừng so sánh với người khác, hãy so với mình ngày hôm qua!" 🌟'
];

const AVAILABLE_ICONS = [
    { icon: '🎯', label: 'Mục tiêu' },
    { icon: '💻', label: 'Lập trình' },
    { icon: '📖', label: 'Học tập' },
    { icon: '🚀', label: 'Khởi động' },
    { icon: '⚡', label: 'Năng lượng' },
    { icon: '🎨', label: 'Sáng tạo' },
    { icon: '🔬', label: 'Nghiên cứu' },
    { icon: '📊', label: 'Phân tích' },
    { icon: '🛠️', label: 'Công cụ' },
    { icon: '🌟', label: 'Thành tựu' },
];

// ===== STATE =====
// Use dayOffset (integer) to avoid ALL timezone bugs: 0=today, -1=yesterday, +1=tomorrow
let dayOffset = 0;
let collapsedSections = {};
let creationDate = null; // ISO date string YYYY-MM-DD
window._isReadOnly = false;
window._isRemoteUpdate = false;
window._localActionInProgress = false;

// ===== DATE from offset (pure, no timezone issues) =====
function getDateFromOffset(offset) {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
    return new Date(y, m, d + (offset || 0));
}

function dateKey(offset) {
    const dt = getDateFromOffset(offset !== undefined ? offset : dayOffset);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}

function formatDate(offset) {
    const dt = getDateFromOffset(offset !== undefined ? offset : dayOffset);
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
}

// ===== STORAGE =====
function gs(key, fb) { try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fb; } catch { return fb; } }
function ss(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function getChecklist() { return gs(`checklist_${dateKey()}`, {}); }
function saveChecklist(d) { ss(`checklist_${dateKey()}`, d); FirebaseApp.save(`checklists/${dateKey()}`, d); }
function getMood() { return gs(`mood_${dateKey()}`, null); }
function saveMood(m) { ss(`mood_${dateKey()}`, m); FirebaseApp.save(`moods/${dateKey()}`, m); }
function getNotes() { return gs(`notes_${dateKey()}`, {}); }
function saveNotesData(d) { ss(`notes_${dateKey()}`, d); FirebaseApp.save(`notes/${dateKey()}`, d); }
function getCustomTasks(sid) { return gs(`custom_${dateKey()}_${sid}`, gs(`custom_${sid}`, [])); }
function saveCustomTasks(sid, t) { ss(`custom_${dateKey()}_${sid}`, t); FirebaseApp.save(`customTasks/${dateKey()}_${sid}`, t); }

// Section overrides (title, subtitle, icon)
function getSectionOverrides() { return gs('_section_overrides', {}); }
function saveSectionOverrides(o) { ss('_section_overrides', o); FirebaseApp.save('sectionOverrides', o); }
function getEffectiveSection(section) {
    const ov = getSectionOverrides()[section.id];
    if (!ov) return section;
    return { ...section, title: ov.title || section.title, subtitle: ov.subtitle || section.subtitle, icon: ov.icon || section.icon };
}

// Hidden sections (soft-deleted sections with timestamps)
function getHiddenSections() {
    let raw = gs(`_hidden_sections_${dateKey()}`, []);
    // Handle null/undefined
    if (!raw) return [];
    // Handle Firebase object format { "0": {...}, "1": {...} } → convert to array
    if (typeof raw === 'object' && !Array.isArray(raw)) {
        raw = Object.values(raw);
    }
    if (!Array.isArray(raw) || raw.length === 0) return [];
    // Migrate old format (plain string array) to new format (objects with deletedAt)
    if (typeof raw[0] === 'string') {
        const migrated = raw.map(id => ({ id, deletedAt: Date.now() }));
        ss(`_hidden_sections_${dateKey()}`, migrated);
        FirebaseApp.save(`hiddenSections/${dateKey()}`, migrated);
        return migrated;
    }
    // Ensure all items have id and deletedAt
    return raw.filter(h => h && h.id).map(h => ({
        id: h.id,
        deletedAt: h.deletedAt || Date.now()
    }));
}
function getHiddenSectionIds() { return getHiddenSections().map(h => h.id); }
function saveHiddenSections(arr) { ss(`_hidden_sections_${dateKey()}`, arr); FirebaseApp.save(`hiddenSections/${dateKey()}`, arr); }
function getVisibleSections() { return getActiveSections(); }

// Auto-purge: permanently delete sections soft-deleted > 7 days ago
function autoPurgeSections() {
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const hidden = getHiddenSections();
    const expired = hidden.filter(h => (now - h.deletedAt) >= SEVEN_DAYS);
    if (expired.length === 0) return;
    expired.forEach(h => permanentDeleteSection(h.id));
    const remaining = hidden.filter(h => (now - h.deletedAt) < SEVEN_DAYS);
    saveHiddenSections(remaining);
}

function getDaysRemaining(deletedAt) {
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - deletedAt;
    return Math.max(0, Math.ceil((SEVEN_DAYS - elapsed) / (24 * 60 * 60 * 1000)));
}

// Task text overrides
function getTaskTextOverrides() { return gs('_task_text_overrides', {}); }
function saveTaskTextOverrides(o) { ss('_task_text_overrides', o); FirebaseApp.save('taskTextOverrides', o); }
function getEffectiveText(item) {
    const ov = getTaskTextOverrides();
    return ov[item.id] || item.text;
}

function getSectionItems(section) { return [...(section.items || []), ...getCustomTasks(section.id)]; }
function getAllItems() { return getVisibleSections().flatMap(s => getSectionItems(s)); }

function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }

// ===== RENDER =====
// Build a single section's DOM element (reusable for surgical inserts)
function buildSectionElement(section, cl, notes) {
    const sec = getEffectiveSection(section);
    const items = getSectionItems(section);
    const done = items.filter(x => cl[x.id]).length;
    const total = items.length;
    const isCollapsed = collapsedSections[section.id] || false;

    const el = document.createElement('div');
    el.className = `checklist-section ${section.theme}`;
    el.dataset.sectionId = section.id;

    el.innerHTML = `
        <div class="section-header" data-section="${section.id}">
            <div class="section-header-top">
                <div class="section-title-group">
                    <span class="section-icon">${sec.icon}</span>
                    <div>
                        <div class="section-title">${escapeHtml(sec.title || '')}</div>
                        <div class="section-subtitle">${escapeHtml(sec.subtitle || '')}</div>
                        <span class="section-status-badge active">Active</span>
                    </div>
                </div>
                <div class="section-meta">
                    <button class="section-edit-btn" data-edit-section="${section.id}" title="Chỉnh sửa">✏️</button>
                    <button class="section-delete-btn" data-delete-section-id="${section.id}" title="Xóa nhóm">Xóa Nhóm</button>
                    <span class="section-progress-badge ${done===total&&total>0?'complete':''}">${done}/${total}</span>
                    <span class="section-toggle ${isCollapsed?'collapsed':''}">▾</span>
                </div>
            </div>
            <div class="group-progress-container">
                <div class="group-progress-bar" style="width: ${total>0 ? (done/total*100) : 0}%"></div>
            </div>
        </div>
        <div class="section-items ${isCollapsed?'items-hidden':'items-visible'}" data-section-items="${section.id}">
            ${items.map(item => {
                const checked = cl[item.id] || false;
                const hasNote = notes[item.id] && notes[item.id].trim();
                const displayText = getEffectiveText(item);
                return `<div class="checklist-item ${checked?'checked':''}" data-item="${item.id}">
                    <div class="custom-checkbox ${checked?'checked':''}" data-item="${item.id}"></div>
                    <span class="item-text" data-text-id="${item.id}">${escapeHtml(displayText)}</span>
                    <div class="item-actions">
                        <button class="item-edit-text-btn" data-edit-text="${item.id}" title="Sửa nội dung">✏️</button>
                        <button class="item-note-btn ${hasNote?'has-note':''}" data-note="${item.id}" title="Ghi chú">📝${hasNote ? `<span class="note-count">(${notes[item.id].length})</span>` : ''}</button>
                        <button class="item-delete-btn" data-delete="${item.id}" data-delete-section="${section.id}" data-is-custom="${item.custom?'1':'0'}" title="Xóa task">✕</button>
                    </div>
                </div>`;
            }).join('')}
            <div class="add-task-row">
                <div class="add-task-input-wrap" data-add-section="${section.id}" style="display:none">
                    <input type="text" class="add-task-input" placeholder="Nhập nhiệm vụ mới (tối đa 150 ký tự)..." maxlength="150" data-input-section="${section.id}">
                    <span class="char-count" data-char-count="${section.id}">0 / 150 ký tự</span>
                    <button class="add-task-confirm" data-confirm-section="${section.id}">✓</button>
                    <button class="add-task-cancel" data-cancel-section="${section.id}">✕</button>
                </div>
                <button class="add-task-btn" data-show-input="${section.id}">＋ Thêm nhiệm vụ</button>
            </div>
        </div>`;
    return el;
}

function renderSections() {
    const main = document.getElementById('checklistMain');
    const cl = getChecklist(), notes = getNotes();
    main.innerHTML = '';

    const allDaySections = ensureDaySections();
    const visibleSections = getVisibleSections();
    let _restoreEl = null;

    visibleSections.forEach((section, i) => {
        const el = buildSectionElement(section, cl, notes);
        el.style.animationDelay = `${i * 0.05}s`;
        main.appendChild(el);
    });

    // Render restore panel if there are hidden sections
    try {
        const hiddenData = getHiddenSections();
        const hiddenInDay = allDaySections.filter(s => hiddenData.some(h => h.id === s.id));
        if (hiddenInDay.length > 0) {
            const isDeletedPanelOpen = window._deletedPanelOpen || false;
            _restoreEl = document.createElement('div');
            _restoreEl.className = 'hidden-sections-panel';
            _restoreEl.innerHTML = `
                <div class="hidden-sections-header" id="toggleDeletedPanel">
                    <div class="hidden-sections-header-left">
                        <span class="hidden-sections-icon">🗑️</span>
                        <span>Nhóm đã xóa (${hiddenInDay.length})</span>
                    </div>
                    <span class="hidden-panel-toggle ${isDeletedPanelOpen?'':'collapsed'}">▾</span>
                </div>
                <div class="hidden-sections-list ${isDeletedPanelOpen?'':'hidden-list-collapsed'}">
                    ${hiddenInDay.map(sec => {
                        const eff = getEffectiveSection(sec);
                        const hData = hiddenData.find(h => h.id === sec.id);
                        const daysLeft = hData ? getDaysRemaining(hData.deletedAt) : 7;
                        return `<div class="hidden-section-item">
                            <div class="hidden-section-info-col">
                                <span class="hidden-section-info">${eff.icon} ${escapeHtml(eff.title)}</span>
                                <span class="hidden-section-status">Đã xóa · Tự động xóa vĩnh viễn sau ${daysLeft} ngày</span>
                            </div>
                            <div class="hidden-section-actions">
                                <button class="restore-section-btn" data-restore-section="${sec.id}" title="Khôi phục">↩️ Khôi phục</button>
                                <button class="perm-delete-btn" data-perm-delete="${sec.id}" title="Xóa vĩnh viễn">🗑️</button>
                            </div>
                        </div>`;
                    }).join('')}
                </div>`;
        }
    } catch (e) {
        console.error('Restore panel render error:', e);
    }

    // Add Group button + Copy from day — always render this
    const addPanel = document.createElement('div');
    addPanel.className = 'add-group-panel';
    addPanel.innerHTML = `
        <button class="add-group-btn" id="addGroupBtn">＋ Thêm nhóm mới</button>
        <button class="copy-groups-btn" id="copyGroupsBtn">📋 Sao chép nhóm từ ngày khác</button>`;
    main.appendChild(addPanel);

    // Deleted groups panel — below the add buttons
    if (_restoreEl) main.appendChild(_restoreEl);

    updateProgress();
}

// ===== SURGICAL TOGGLE (no re-render) =====
function toggleItem(itemId) {
    if (window._isReadOnly) { FirebaseApp.toast('Bạn đang ở chế độ CHỈ XEM 👁️'); return; }
    window._localActionInProgress = true;
    const cl = getChecklist();
    cl[itemId] = !cl[itemId];
    saveChecklist(cl);
    setTimeout(() => { window._localActionInProgress = false; }, 2500);

    const itemEl = document.querySelector(`.checklist-item[data-item="${itemId}"]`);
    const cbEl = itemEl?.querySelector('.custom-checkbox');
    if (!itemEl || !cbEl) return;

    if (cl[itemId]) {
        cbEl.classList.add('checked', 'just-checked');
        itemEl.classList.add('checked');
        updateTotalXP(10);
        setTimeout(() => cbEl.classList.remove('just-checked'), 350);
    } else {
        cbEl.classList.remove('checked', 'just-checked');
        itemEl.classList.remove('checked');
        updateTotalXP(-10);
    }

    // Update section badge + progress bar
    for (const s of getVisibleSections()) {
        const items = getSectionItems(s);
        if (items.some(x => x.id === itemId)) {
            const done = items.filter(x => cl[x.id]).length;
            const sectionEl = document.querySelector(`[data-section-id="${s.id}"]`);
            const badge = sectionEl?.querySelector('.section-progress-badge');
            if (badge) { badge.textContent = `${done}/${items.length}`; badge.classList.toggle('complete', done === items.length); }
            // Update group progress bar
            const progressBar = sectionEl?.querySelector('.group-progress-bar');
            if (progressBar) progressBar.style.width = `${items.length > 0 ? (done/items.length*100) : 0}%`;
            break;
        }
    }
    // Update XP level display
    updateStreak();
    // Set flag so updateProgress knows this came from a user action
    window._justToggledItem = cl[itemId]; // only celebrate when checking ON
    updateProgress();
    requestAnimationFrame(() => updateStreak());
}

// ===== PROGRESS =====
function updateProgress() {
    const cl = getChecklist(), all = getAllItems();
    const total = all.length, done = all.filter(i => cl[i.id]).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    document.getElementById('overallProgressValue').textContent = `${pct}%`;
    document.getElementById('overallProgressBar').style.width = `${pct}%`;
    document.getElementById('completedCount').textContent = done;
    document.getElementById('totalCount').textContent = total;

    // Only show celebration when the user just actively toggled the last item
    if (pct === 100 && done > 0 && dayOffset === 0 && window._justToggledItem) {
        const quotes = [
            { t: "Tuyệt vời!", m: "Bạn đã hoàn thành tất cả nhiệm vụ hôm nay!" },
            { t: "Xuất sắc!", m: "Kỷ luật là sức mạnh! Bạn đã làm rất tốt!" },
            { t: "Hoàn hảo!", m: "Thêm một ngày tuyệt vời nữa đã được chinh phục!" },
            { t: "100% Rực rỡ!", m: "Bạn thật sự rất kiên trì! Nghỉ ngơi thôi nào!" },
            { t: "Wow!", m: "Mục tiêu đã xong! Phần thưởng là một buổi tối thư giãn!" },
            { t: "Đỉnh cao!", m: "Bạn đang trên con đường trở thành phiên bản tốt nhất!" }
        ];
        const q = quotes[Math.floor(Math.random() * quotes.length)];
        const titleEl = document.getElementById('celebrationTitle');
        const msgEl = document.getElementById('celebrationMsg');
        if (titleEl) titleEl.textContent = q.t;
        if (msgEl) msgEl.textContent = q.m;
        document.getElementById('celebrationOverlay').classList.add('show');
    }
    // Reset the flag after check
    window._justToggledItem = false;
}

// ===== DATE DISPLAY =====
function updateDateDisplay() {
    const label = document.getElementById('dateLabel');
    const value = document.getElementById('dateValue');
    const prevBtn = document.getElementById('prevDay');
    
    if (dayOffset === 0) label.textContent = 'Hôm nay';
    else if (dayOffset === -1) label.textContent = 'Hôm qua';
    else if (dayOffset === 1) label.textContent = 'Ngày mai';
    else label.textContent = dayOffset > 0 ? `+${dayOffset} ngày sau` : `${Math.abs(dayOffset)} ngày trước`;
    
    value.textContent = formatDate();

    // Disable prev button if at creation limit
    if (creationDate && dateKey(dayOffset - 1) < creationDate) {
        prevBtn?.classList.add('disabled');
    } else {
        prevBtn?.classList.remove('disabled');
    }
}

// Animate the date display with a pop effect when navigating days
function animateDateChange() {
    const dateEl = document.getElementById('dateDisplay');
    // Remove class first to allow re-trigger
    dateEl.classList.remove('date-pop');
    // Force reflow to reset animation
    void dateEl.offsetWidth;
    dateEl.classList.add('date-pop');
    updateDateDisplay();
    // Suppress section fadeInUp during day change
    const main = document.getElementById('checklistMain');
    main.classList.add('no-anim');
    renderSections();
    updateStreak();
    renderMood();

    requestAnimationFrame(() => {
        requestAnimationFrame(() => main.classList.remove('no-anim'));
    });
}

// ===== STREAK =====
function updateStreak() {
    const all = getAllItems(), total = all.length;
    if (total === 0) return;
    let streak = 0;
    let checkOffset = 0;
    const todayCl = gs(`checklist_${dateKey(0)}`, {});
    const todayDone = all.filter(i => todayCl[i.id]).length === total;
    if (!todayDone) checkOffset = -1;
    while (true) {
        const cl = gs(`checklist_${dateKey(checkOffset)}`, {});
        if (all.filter(i => cl[i.id]).length === total) { streak++; checkOffset--; }
        else break;
        if (streak > 3650) break;
    }
    document.getElementById('streakCount').textContent = streak;
    
    // XP Calculation & Level System
    const rawXP = localStorage.getItem('totalXP');
    let totalXP = 0;
    if (rawXP) {
        try { totalXP = parseInt(JSON.parse(rawXP)) || 0; }
        catch { totalXP = parseInt(rawXP) || 0; }
    }
    const xpEl = document.getElementById('totalXP');
    if (xpEl) xpEl.textContent = totalXP.toLocaleString();
    
    // Level = floor(XP/100) + 1, progress = XP % 100
    const XP_PER_LEVEL = 100;
    const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
    const xpInLevel = totalXP % XP_PER_LEVEL;
    const levelEl = document.getElementById('xpLevel');
    if (levelEl) levelEl.textContent = `Lv.${level}`;
    const levelBar = document.getElementById('xpLevelBar');
    if (levelBar) levelBar.style.width = `${(xpInLevel / XP_PER_LEVEL) * 100}%`;

    const best = Math.max(gs('bestStreak', 0), streak);
    ss('bestStreak', best); FirebaseApp.save('meta/bestStreak', best);
    document.getElementById('bestStreak').textContent = best;
    let totalDays = gs('totalCompletedDays', 0);
    const tk = `completed_${dateKey(0)}`;
    if (todayDone && !gs(tk, false)) { totalDays++; ss('totalCompletedDays', totalDays); ss(tk, true); FirebaseApp.save('meta/totalCompletedDays', totalDays); FirebaseApp.save(`meta/${tk}`, true); }
    document.getElementById('totalDays').textContent = totalDays;
}

// ===== SECTION TOGGLE =====
function toggleSection(sid) {
    const el = document.querySelector(`[data-section-items="${sid}"]`);
    const tog = document.querySelector(`[data-section="${sid}"] .section-toggle`);
    if (!el) return;
    collapsedSections[sid] = !collapsedSections[sid];
    el.classList.toggle('items-hidden', collapsedSections[sid]);
    el.classList.toggle('items-visible', !collapsedSections[sid]);
    tog?.classList.toggle('collapsed', collapsedSections[sid]);
}

// ===== ADD CUSTOM TASK (inline input, no prompt) =====
function showAddInput(sectionId) {
    if (window._isReadOnly) return;
    const wrap = document.querySelector(`.add-task-input-wrap[data-add-section="${sectionId}"]`);
    const btn = wrap?.parentElement.querySelector('.add-task-btn');
    if (wrap) { wrap.style.display = 'flex'; }
    if (btn) { btn.style.display = 'none'; }
    const input = wrap?.querySelector('.add-task-input');
    if (input) { input.value = ''; setTimeout(() => input.focus(), 50); }
}

function hideAddInput(sectionId) {
    const wrap = document.querySelector(`.add-task-input-wrap[data-add-section="${sectionId}"]`);
    const btn = wrap?.parentElement.querySelector('.add-task-btn');
    if (wrap) wrap.style.display = 'none';
    if (btn) btn.style.display = '';
}

function confirmAddTask(sectionId) {
    if (window._isReadOnly) return;
    const input = document.querySelector(`.add-task-input[data-input-section="${sectionId}"]`);
    let text = input?.value?.trim();
    if (!text) { hideAddInput(sectionId); return; }
    // Enforce 150 char limit
    if (text.length > 150) text = text.slice(0, 150);
    window._localActionInProgress = true;
    const custom = getCustomTasks(sectionId);
    custom.push({ id: `${sectionId}_c${Date.now()}`, text, custom: true, sectionId });
    saveCustomTasks(sectionId, custom);
    renderSections();
    setTimeout(() => { window._localActionInProgress = false; }, 2500);
}

function deleteTask(itemId, sectionId, isCustom) {
    if (window._isReadOnly) return;
    const itemEl = document.querySelector(`.checklist-item[data-item="${itemId}"]`);
    if (itemEl) {
        itemEl.style.transition = 'all 0.3s ease';
        itemEl.style.opacity = '0';
        itemEl.style.transform = 'translateX(40px)';
        itemEl.style.maxHeight = itemEl.offsetHeight + 'px';
        setTimeout(() => { itemEl.style.maxHeight = '0'; itemEl.style.padding = '0'; itemEl.style.margin = '0'; }, 150);
        setTimeout(() => {
            window._localActionInProgress = true;
            if (isCustom) {
                const custom = getCustomTasks(sectionId).filter(t => t.id !== itemId);
                saveCustomTasks(sectionId, custom);
            } else {
                // Remove default task from section items in day sections
                const secs = ensureDaySections();
                const sec = secs.find(s => s.id === sectionId);
                if (sec) { sec.items = sec.items.filter(i => i.id !== itemId); saveDaySections(secs); }
            }
            const cl = getChecklist(); delete cl[itemId]; saveChecklist(cl);
            const notes = getNotes(); delete notes[itemId]; saveNotesData(notes);
            renderSections();
            setTimeout(() => { window._localActionInProgress = false; }, 2500);
        }, 400);
    }
}

// ===== DELETE SECTION =====
function deleteSection(sectionId) {
    const allSecs = ensureDaySections();
    const section = allSecs.find(s => s.id === sectionId);
    if (!section) return;
    const eff = getEffectiveSection(section);
    showDeleteConfirm(eff, sectionId);
}

function showDeleteConfirm(eff, sectionId) {
    const modal = document.getElementById('deleteSectionModal');
    document.getElementById('deleteSectionName').textContent = `"${eff.title}"`;
    modal.classList.add('show');
    modal._sectionId = sectionId;
    modal._eff = eff;
}

function executeDeleteSection(sectionId, eff) {
    if (window._isReadOnly) return;
    document.getElementById('deleteSectionModal').classList.remove('show');
    window._localActionInProgress = true;

    const sectionEl = document.querySelector(`.checklist-section[data-section-id="${sectionId}"]`);
    if (sectionEl) {
        // Lock height for smooth collapse
        const h = sectionEl.offsetHeight;
        sectionEl.style.maxHeight = h + 'px';
        sectionEl.style.overflow = 'hidden';
        sectionEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease, max-height 0.3s ease 0.1s, margin-bottom 0.3s ease 0.1s';

        // Force reflow then animate out
        sectionEl.offsetHeight;
        sectionEl.style.opacity = '0';
        sectionEl.style.transform = 'scale(0.97)';
        sectionEl.style.maxHeight = '0';
        sectionEl.style.marginBottom = '0';

        setTimeout(() => {
            // Save state with timestamp for auto-purge
            const hidden = getHiddenSections();
            if (!hidden.some(h => h.id === sectionId)) hidden.push({ id: sectionId, deletedAt: Date.now() });
            saveHiddenSections(hidden);

            // Remove element from DOM (no full re-render)
            sectionEl.remove();

            // Update restore panel in-place
            renderRestorePanel();
            updateProgress();
            updateStreak();
            FirebaseApp.toast(`Đã xóa nhóm "${eff.title}" ✓`);
            setTimeout(() => { window._localActionInProgress = false; }, 2500);
        }, 400);
    } else {
        const hidden = getHiddenSections();
        if (!hidden.some(h => h.id === sectionId)) hidden.push({ id: sectionId, deletedAt: Date.now() });
        saveHiddenSections(hidden);
        renderRestorePanel();
        updateProgress();
        updateStreak();
        setTimeout(() => { window._localActionInProgress = false; }, 2500);
    }
}

// Surgically update/create the restore panel without re-rendering everything
function renderRestorePanel() {
    const main = document.getElementById('checklistMain');
    const existing = main.querySelector('.hidden-sections-panel');
    if (existing) existing.remove();

    const hiddenData = getHiddenSections();
    const allDaySections = ensureDaySections();
    const hiddenInDay = allDaySections.filter(s => hiddenData.some(h => h.id === s.id));
    if (hiddenInDay.length === 0) return;

    const isDeletedPanelOpen = window._deletedPanelOpen || false;
    const restoreEl = document.createElement('div');
    restoreEl.className = 'hidden-sections-panel';
    restoreEl.innerHTML = `
        <div class="hidden-sections-header" id="toggleDeletedPanel">
            <div class="hidden-sections-header-left">
                <span class="hidden-sections-icon">🗑️</span>
                <span>Nhóm đã xóa (${hiddenInDay.length})</span>
            </div>
            <span class="hidden-panel-toggle ${isDeletedPanelOpen?'':'collapsed'}">▾</span>
        </div>
        <div class="hidden-sections-list ${isDeletedPanelOpen?'':'hidden-list-collapsed'}">
            ${hiddenInDay.map(sec => {
                const eff = getEffectiveSection(sec);
                const hData = hiddenData.find(h => h.id === sec.id);
                const daysLeft = hData ? getDaysRemaining(hData.deletedAt) : 7;
                return `<div class="hidden-section-item">
                    <div class="hidden-section-info-col">
                        <span class="hidden-section-info">${eff.icon} ${escapeHtml(eff.title)}</span>
                        <span class="hidden-section-status">Đã xóa · Tự động xóa vĩnh viễn sau ${daysLeft} ngày</span>
                    </div>
                    <div class="hidden-section-actions">
                        <button class="restore-section-btn" data-restore-section="${sec.id}" title="Khôi phục">↩️ Khôi phục</button>
                        <button class="perm-delete-btn" data-perm-delete="${sec.id}" title="Xóa vĩnh viễn">🗑️</button>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    // Deleted groups panel goes at the very end (below add-group buttons)
    main.appendChild(restoreEl);
}

// Fully surgical restore - no full re-render
function restoreSection(sectionId) {
    if (window._isReadOnly) return;
    window._localActionInProgress = true;

    const hidden = getHiddenSections().filter(h => h.id !== sectionId);
    saveHiddenSections(hidden);

    const section = ensureDaySections().find(s => s.id === sectionId);
    if (!section) { window._localActionInProgress = false; return; }
    const eff = getEffectiveSection(section);

    // Build the section element
    const cl = getChecklist(), notes = getNotes();
    const newEl = buildSectionElement(section, cl, notes);

    // Find correct insert position based on DEFAULT_SECTIONS order
    const main = document.getElementById('checklistMain');
    const visibleSections = getVisibleSections();
    const sectionIndex = visibleSections.findIndex(s => s.id === sectionId);
    const existingSections = main.querySelectorAll('.checklist-section');

    // Start hidden for animation
    newEl.style.opacity = '0';
    newEl.style.transform = 'translateY(12px)';
    newEl.style.transition = 'opacity 0.35s ease, transform 0.35s ease';

    // Always insert before add-group-panel to keep sections above buttons
    const addPanel = main.querySelector('.add-group-panel');
    if (sectionIndex >= 0 && sectionIndex < existingSections.length) {
        existingSections[sectionIndex].before(newEl);
    } else if (addPanel) {
        addPanel.before(newEl);
    } else {
        main.appendChild(newEl);
    }

    // Trigger animation
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            newEl.style.opacity = '1';
            newEl.style.transform = 'translateY(0)';
        });
    });

    // Save checklist
    saveChecklist(cl);
    
    // XP logic: +50 XP bonus for restoring a whole group
    const curXP = parseInt(gs('totalXP', 0)) || 0;
    const newXP = curXP + 50;
    ss('totalXP', newXP);
    FirebaseApp.save('meta/totalXP', newXP);
    const xpEl = document.getElementById('totalXP');
    if (xpEl) xpEl.textContent = newXP.toLocaleString();
    
    // Update restore panel
    renderSections();
    updateProgress();
    updateStreak();
    FirebaseApp.toast(`Đã khôi phục nhóm "${eff.title}" ✓`);
    setTimeout(() => { window._localActionInProgress = false; }, 2500);
}

// ===== NOTES =====
let activeNoteItem = null;
function updateModalCharCount(inputId, countId, max) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(countId);
    if (input && counter) {
        const len = input.value.length;
        counter.textContent = `${len} / ${max} ký tự`;
        counter.classList.toggle('limit-reached', len >= max);
    }
}

function openNote(itemId) {
    activeNoteItem = itemId;
    const notes = getNotes(), item = getAllItems().find(i => i.id === itemId);
    document.getElementById('notesTitle').textContent = `📝 ${item ? item.text : 'Ghi chú'}`;
    const val = notes[itemId] || '';
    document.getElementById('notesTextarea').value = val;
    updateModalCharCount('notesTextarea', 'notesCharCount', 500);
    document.getElementById('notesModal').classList.add('show');
    setTimeout(() => document.getElementById('notesTextarea').focus(), 100);
}
function saveNote() {
    if (window._isReadOnly) return;
    if (!activeNoteItem) return;
    window._localActionInProgress = true;
    const notes = getNotes();
    notes[activeNoteItem] = document.getElementById('notesTextarea').value;
    saveNotesData(notes);
    document.getElementById('notesModal').classList.remove('show');
    const btn = document.querySelector(`.item-note-btn[data-note="${activeNoteItem}"]`);
    if (btn) btn.classList.toggle('has-note', notes[activeNoteItem].trim().length > 0);
    activeNoteItem = null;
    setTimeout(() => { window._localActionInProgress = false; }, 2500);
}

// ===== EDIT SECTION MODAL =====
let editingSectionId = null;
let selectedIcon = null;

function openEditSection(sectionId) {
    editingSectionId = sectionId;
    const section = ensureDaySections().find(s => s.id === sectionId);
    if (!section) return;
    const sec = getEffectiveSection(section);
    const title = sec.title || '';
    const subtitle = sec.subtitle || '';
    document.getElementById('editSectionTitle').value = title;
    document.getElementById('editSectionSubtitle').value = subtitle;
    updateModalCharCount('editSectionTitle', 'editTitleCount', 50);
    updateModalCharCount('editSectionSubtitle', 'editSubtitleCount', 100);
    selectedIcon = sec.icon;
    renderIconPicker();
    document.getElementById('editSectionModal').classList.add('show');
    document.getElementById('editSectionTitle').focus();
}

function renderIconPicker() {
    const picker = document.getElementById('iconPicker');
    // Combine section defaults + available icons (deduplicated)
    const defaultIcons = DEFAULT_SECTIONS.map(s => ({ icon: s.icon, label: s.title.split('–')[0].trim() }));
    const allIcons = [...defaultIcons, ...AVAILABLE_ICONS];
    const seen = new Set();
    const unique = allIcons.filter(i => { if (seen.has(i.icon)) return false; seen.add(i.icon); return true; });
    picker.innerHTML = unique.map(i =>
        `<button class="icon-option ${i.icon === selectedIcon ? 'selected' : ''}" data-icon="${i.icon}" title="${i.label}">${i.icon}</button>`
    ).join('');
}

function saveEditSection() {
    if (!editingSectionId) return;
    const title = document.getElementById('editSectionTitle').value.trim();
    const subtitle = document.getElementById('editSectionSubtitle').value.trim();
    const overrides = getSectionOverrides();
    overrides[editingSectionId] = { title, subtitle, icon: selectedIcon };
    saveSectionOverrides(overrides);
    document.getElementById('editSectionModal').classList.remove('show');
    renderSections();
    editingSectionId = null;
}

function resetEditSection() {
    if (!editingSectionId) return;
    const overrides = getSectionOverrides();
    delete overrides[editingSectionId];
    saveSectionOverrides(overrides);
    const section = DEFAULT_SECTIONS.find(s => s.id === editingSectionId);
    document.getElementById('editSectionTitle').value = section.title;
    document.getElementById('editSectionSubtitle').value = section.subtitle;
    selectedIcon = section.icon;
    renderIconPicker();
}

// ===== ADD NEW GROUP =====
function addNewGroup(title, subtitle, icon) {
    title = title || 'Nhóm mới';
    subtitle = subtitle || '';
    icon = icon || '📌';
    const id = 'grp_' + Date.now();
    const theme = SECTION_THEMES[Math.floor(Math.random() * SECTION_THEMES.length)];
    const newSec = { id, icon, title, subtitle, theme, items: [] };
    const secs = ensureDaySections();
    secs.push(newSec);
    saveDaySections(secs);
    renderSections();
    FirebaseApp.toast(`Đã thêm nhóm "${title}" ✓`);
}

function openAddGroupModal() {
    document.getElementById('addGroupTitle').value = '';
    document.getElementById('addGroupSubtitle').value = '';
    updateModalCharCount('addGroupTitle', 'addTitleCount', 50);
    updateModalCharCount('addGroupSubtitle', 'addSubtitleCount', 100);
    selectedNewGroupIcon = '📌';
    renderNewGroupIconPicker();
    document.getElementById('addGroupModal').classList.add('show');
    document.getElementById('addGroupTitle').focus();
}

let selectedNewGroupIcon = '📌';
function renderNewGroupIconPicker() {
    const picker = document.getElementById('newGroupIconPicker');
    const icons = ['📌','🎯','💻','📖','🚀','⚡','🎨','🔬','📊','🛠️','🌟','🌅','🌙','⚙️','🐞','🔁','📝','💡','🏆','🔥'];
    picker.innerHTML = icons.map(i =>
        `<button class="icon-option ${i === selectedNewGroupIcon ? 'selected' : ''}" data-icon="${i}">${i}</button>`
    ).join('');
}

function openCopyGroupsModal() {
    const list = document.getElementById('copyDaysList');
    list.innerHTML = '';
    // Find days that have sections saved
    const days = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('sections_')) {
            const dk = key.slice(9);
            if (dk !== dateKey()) days.push(dk);
        }
    }
    // Also add defaults option
    if (days.length === 0 && !getDaySections()) {
        list.innerHTML = '<p class="copy-empty">Chưa có dữ liệu ngày nào khác.</p>';
    } else {
        // Default option
        list.innerHTML += `<button class="copy-day-option" data-copy-source="__defaults__">
            <span class="copy-day-icon">📋</span>
            <span class="copy-day-info"><strong>Mặc định gốc</strong><br><small>6 nhóm ban đầu</small></span>
        </button>`;
    // Sort and take top 3
    days.sort().reverse().slice(0, 3).forEach(dk => {
        const secs = gs(`sections_${dk}`, []);
        const parts = dk.split('-');
        const label = `${parts[2]}/${parts[1]}/${parts[0]}`;
        list.innerHTML += `<button class="copy-day-option" data-copy-source="${dk}">
            <span class="copy-day-icon">📅</span>
            <span class="copy-day-info"><strong>${label}</strong><br><small>${secs.length} nhóm</small></span>
        </button>`;
    });
    }
    document.getElementById('copyGroupsModal').classList.add('show');
}

function copyGroupsFrom(source) {
    window._localActionInProgress = true;
    let secs;
    if (source === '__defaults__') {
        secs = DEFAULT_SECTIONS.map(s => ({...s, items: s.items.map(i => ({...i}))}));
    } else {
        secs = gs(`sections_${source}`, null);
        if (!secs) { window._localActionInProgress = false; return; }
        secs = JSON.parse(JSON.stringify(secs));
    }
    saveDaySections(secs);
    // Clear hidden for this day
    saveHiddenSections([]);
    document.getElementById('copyGroupsModal').classList.remove('show');
    renderSections();
    updateStreak();
    FirebaseApp.toast('Đã sao chép nhóm thành công ✓');
    setTimeout(() => { window._localActionInProgress = false; }, 2500);
}

function permanentDeleteSection(sectionId) {
    const secs = ensureDaySections().filter(s => s.id !== sectionId);
    saveDaySections(secs);
    // Also remove from hidden
    const hidden = getHiddenSections().filter(h => h.id !== sectionId);
    saveHiddenSections(hidden);
}

function confirmPermanentDelete(sectionId) {
    const allSecs = ensureDaySections();
    const section = allSecs.find(s => s.id === sectionId);
    if (!section) return;
    const eff = getEffectiveSection(section);
    if (confirm(`Xóa vĩnh viễn nhóm "${eff.title}"?\nHành động này không thể hoàn tác!`)) {
        window._localActionInProgress = true;
        permanentDeleteSection(sectionId);
        renderSections();
        updateProgress();
        updateStreak();
        FirebaseApp.toast(`Đã xóa vĩnh viễn nhóm "${eff.title}" ✓`);
        setTimeout(() => { window._localActionInProgress = false; }, 2500);
    }
}

// ===== INLINE TASK TEXT EDITING =====
function startEditTaskText(itemId) {
    const span = document.querySelector(`.item-text[data-text-id="${itemId}"]`);
    if (!span || span.querySelector('input')) return;
    const currentText = span.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-edit-input';
    input.value = currentText;
    span.textContent = '';
    span.appendChild(input);
    input.focus();
    input.select();
    const save = () => {
        let newText = input.value.trim();
        if (newText.length > 150) newText = newText.slice(0, 150);
        if (newText && newText !== currentText) {
            const ov = getTaskTextOverrides();
            ov[itemId] = newText;
            saveTaskTextOverrides(ov);
        }
        span.textContent = newText || currentText;
        input.remove();
    };
    input.addEventListener('blur', save);
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        if (e.key === 'Escape') { span.textContent = currentText; input.remove(); }
    });
}

// ===== AUTH & CONFIG =====
function showLogin() {
    const overlay = document.getElementById('loginOverlay');
    overlay.style.display = 'flex';
    overlay.style.opacity = '';
    const card = overlay.querySelector('.login-card');
    if (card) { card.style.opacity = ''; card.style.transform = ''; }
}
function hideLogin() {
    const overlay = document.getElementById('loginOverlay');
    const card = overlay.querySelector('.login-card');
    // Animate card shrink + fade
    if (card) {
        card.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease';
        card.style.transform = 'scale(0.85) translateY(20px)';
        card.style.opacity = '0';
    }
    overlay.style.transition = 'opacity 0.4s ease 0.15s';
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.display = 'none';
        overlay.style.transition = '';
        overlay.style.opacity = '';
        if (card) { card.style.transition = ''; card.style.transform = ''; card.style.opacity = ''; }
    }, 500);
}
function showError(msg) {
    const el = document.getElementById('loginError');
    el.textContent = msg; el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 5000);
}

function updateUserUI(user) {
    const info = document.getElementById('userInfo');
    if (user) {
        info.style.display = 'flex';
        document.getElementById('userName').textContent = user.displayName || user.email?.split('@')[0] || 'User';
        const avatar = document.getElementById('userAvatar');
        if (user.photoURL) { avatar.src = user.photoURL; avatar.style.display = 'block'; }
        else avatar.style.display = 'none';
    } else {
        info.style.display = 'none';
    }
}

async function loadFromFirebase() {
    const data = await FirebaseApp.loadAll();
    if (!data) return;
    window._isRemoteUpdate = true;
    if (data.checklists) Object.entries(data.checklists).forEach(([k,v]) => ss(`checklist_${k}`, v));
    if (data.notes) Object.entries(data.notes).forEach(([k,v]) => ss(`notes_${k}`, v));
    if (data.customTasks) Object.entries(data.customTasks).forEach(([k,v]) => ss(`custom_${k}`, v));
    if (data.sections) Object.entries(data.sections).forEach(([k,v]) => ss(`sections_${k}`, v));
    if (data.sectionOverrides) ss('_section_overrides', data.sectionOverrides);
    if (data.taskTextOverrides) ss('_task_text_overrides', data.taskTextOverrides);
    if (data.hiddenSections) {
        if (typeof data.hiddenSections === 'object' && !Array.isArray(data.hiddenSections)) {
            Object.entries(data.hiddenSections).forEach(([k,v]) => ss(`_hidden_sections_${k}`, v));
        } else {
            ss('_hidden_sections', data.hiddenSections);
        }
    }
    if (data.meta) {
        Object.entries(data.meta).forEach(([k,v]) => {
            if (['bestStreak','totalCompletedDays','creationDate'].includes(k)) {
                ss(k, v);
                if (k === 'creationDate') creationDate = v;
            }
            else if (k.startsWith('completed_') || k.startsWith('celebrated_')) ss(k, v);
        });
    }
    // Handle new users: set creationDate if missing
    if (!creationDate) {
        creationDate = dateKey(0);
        ss('creationDate', creationDate);
        if (!window._isReadOnly) FirebaseApp.save('meta/creationDate', creationDate);
    }

    renderSections(); updateStreak();
    window._isRemoteUpdate = false;
}

// ===== SOCIAL / FRIEND VIEW (v3.6.0) =====
function openSocialModal() {
    const user = FirebaseApp.user;
    if (user) document.getElementById('myIdInput').value = user.uid;
    document.getElementById('socialModal').classList.add('show');
}

async function viewOtherUser(targetUid) {
    if (!targetUid) return;
    if (FirebaseApp.user && targetUid === FirebaseApp.user.uid) {
        exitReadOnly(); return;
    }
    
    document.getElementById('socialModal').classList.remove('show');
    FirebaseApp.toast('Đang tải dữ liệu bạn bè... ⏳');
    
    // Switch to Read-Only Mode
    window._isReadOnly = true;
    document.querySelector('.app-container').classList.add('read-only-mode');
    document.getElementById('viewingBanner').style.display = 'block';
    
    // Try to get user info if possible (public profile)
    // For now we just show the UID if name unknown
    document.getElementById('viewingName').textContent = targetUid.slice(0, 8) + '...';

    // Switch Firebase Listener
    FirebaseApp.listenToUid(targetUid, data => {
        if (!data) {
            FirebaseApp.toast('Không tìm thấy dữ liệu người này!');
            exitReadOnly();
            return;
        }
        handleRemoteUpdate(data);
    });
}

function exitReadOnly() {
    window._isReadOnly = false;
    document.querySelector('.app-container').classList.remove('read-only-mode');
    document.getElementById('viewingBanner').style.display = 'none';
    
    // Resume listening to self
    FirebaseApp.listenAll(handleRemoteUpdate);
    FirebaseApp.toast('Đã quay lại Checklist của bạn ✓');
}

let _lastDataHash = '';
let _syncDebounce = null;

function handleRemoteUpdate(data) {
    if (!data) return;
    const newHash = JSON.stringify(data);
    if (newHash === _lastDataHash) return;
    _lastDataHash = newHash;

    if (window._localActionInProgress) return;

    if (_syncDebounce) clearTimeout(_syncDebounce);
    _syncDebounce = setTimeout(() => {
        if (window._localActionInProgress) return;
        window._isRemoteUpdate = true;
        
        if (data.checklists) Object.entries(data.checklists).forEach(([k,v]) => ss(`checklist_${k}`, v));
        if (data.notes) Object.entries(data.notes).forEach(([k,v]) => ss(`notes_${k}`, v));
        if (data.customTasks) Object.entries(data.customTasks).forEach(([k,v]) => ss(`custom_${k}`, v));
        if (data.sections) Object.entries(data.sections).forEach(([k,v]) => ss(`sections_${k}`, v));
        if (data.sectionOverrides) ss('_section_overrides', data.sectionOverrides);
        if (data.taskTextOverrides) ss('_task_text_overrides', data.taskTextOverrides);
        if (data.hiddenSections) {
            if (typeof data.hiddenSections === 'object' && !Array.isArray(data.hiddenSections)) {
                Object.entries(data.hiddenSections).forEach(([k,v]) => ss(`_hidden_sections_${k}`, v));
            } else {
                ss('_hidden_sections', data.hiddenSections);
            }
        }
        if (data.meta) {
            Object.entries(data.meta).forEach(([k,v]) => {
                if (['bestStreak','totalCompletedDays','creationDate'].includes(k)) {
                    ss(k, v);
                    if (k === 'creationDate') creationDate = v;
                }
                else if (k.startsWith('completed_') || k.startsWith('celebrated_')) ss(k, v);
            });
        }
        
        renderSections(); updateStreak();
        window._isRemoteUpdate = false;
    }, 100);
}

function setupRealtimeSync() {
    FirebaseApp.listenAll(handleRemoteUpdate);
}

async function uploadLocalToFirebase() {
    const data = { checklists: {}, notes: {}, customTasks: {}, meta: {} };
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('_')) continue;
        try {
            const v = JSON.parse(localStorage.getItem(key));
            if (key.startsWith('checklist_')) data.checklists[key.slice(10)] = v;
            else if (key.startsWith('notes_')) data.notes[key.slice(6)] = v;
            else if (key.startsWith('custom_')) data.customTasks[key.slice(7)] = v;
            else if (['bestStreak','totalCompletedDays'].includes(key) || key.startsWith('completed_') || key.startsWith('celebrated_')) data.meta[key] = v;
        } catch {}
    }
    const so = gs('_section_overrides', null); if (so) data.sectionOverrides = so;
    const tto = gs('_task_text_overrides', null); if (tto) data.taskTextOverrides = tto;
    // Upload sections and hidden per day
    data.sections = {}; data.hiddenSections = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('sections_')) data.sections[key.slice(9)] = JSON.parse(localStorage.getItem(key));
        if (key.startsWith('_hidden_sections_')) data.hiddenSections[key.slice(17)] = JSON.parse(localStorage.getItem(key));
    }
    await FirebaseApp.uploadAll(data);
    FirebaseApp.toast('Đã đồng bộ dữ liệu ✓');
}

function copyShareURL() {
    const url = exportToURL();
    navigator.clipboard.writeText(url).then(() => {
        FirebaseApp.toast('Đã copy link chia sẻ! 📋');
    }).catch(() => prompt('Copy link này:', url));
}

// ===== INIT =====
function init() {
    // Check URL import
    if (window.location.hash.startsWith('#data=')) {
        if (importFromURL(window.location.hash)) {
            FirebaseApp.toast('Đã nhập dữ liệu từ link ✓');
            history.replaceState(null, '', window.location.pathname);
        }
    }

    updateDateDisplay();
    autoPurgeSections();
    renderSections();
    updateStreak();
    renderMood();

    // Check for Friend View UID in URL
    const params = new URLSearchParams(window.location.search);
    const targetUid = params.get('uid');
    if (targetUid) {
        setTimeout(() => viewOtherUser(targetUid), 1000);
    }

    
    document.getElementById('motivationQuote').textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];

    // === Firebase Auth Flow ===
    FirebaseApp.onAuthChanged = async (user) => {
        updateUserUI(user);
        if (user) {
            hideLogin();
            await loadFromFirebase();
            setupRealtimeSync();
            FirebaseApp.toast(`Xin chào, ${user.displayName || user.email}!`);
        } else {
            if (FirebaseApp.hasConfig()) showLogin();
        }
    };

    if (FirebaseApp.hasConfig()) {
        FirebaseApp.init();
    }

    // === Login buttons ===
    document.getElementById('googleLoginBtn')?.addEventListener('click', async () => {
        try { 
            await FirebaseApp.loginGoogle(); 
            FirebaseApp.toast('Đăng nhập thành công ✓');
        }
        catch (e) { showError(e.message); }
    });
    document.getElementById('loginBtn')?.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const pass = document.getElementById('loginPassword').value;
        if (!email || !pass) { showError('Vui lòng nhập email và mật khẩu'); return; }
        try { 
            await FirebaseApp.loginEmail(email, pass); 
            FirebaseApp.toast('Đăng nhập thành công ✓');
        }
        catch (e) { showError(e.code === 'auth/invalid-credential' ? 'Sai email hoặc mật khẩu' : e.message); }
    });
    document.getElementById('registerBtn')?.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const pass = document.getElementById('loginPassword').value;
        if (!email || !pass) { showError('Vui lòng nhập email và mật khẩu'); return; }
        if (pass.length < 6) { showError('Mật khẩu phải ít nhất 6 ký tự'); return; }
        try {
            await FirebaseApp.registerEmail(email, pass);
            await uploadLocalToFirebase();
            FirebaseApp.toast('Đăng ký thành công ✓');
        } catch (e) { showError(e.code === 'auth/email-already-in-use' ? 'Email đã được sử dụng' : e.message); }
    });
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await FirebaseApp.logout();
        FirebaseApp.toast('Đã đăng xuất ✓');
        showLogin();
    });
    document.getElementById('loginPassword')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('loginBtn').click();
    });

    // === Config modal ===
    document.getElementById('openConfigBtn')?.addEventListener('click', () => {
        const cfg = FirebaseApp.getConfig();
        document.getElementById('firebaseConfigInput').value = cfg ? JSON.stringify(cfg, null, 2) : '';
        document.getElementById('configModal').classList.add('show');
    });
    document.getElementById('configModalClose')?.addEventListener('click', () => document.getElementById('configModal').classList.remove('show'));
    document.getElementById('configSaveBtn')?.addEventListener('click', () => {
        const str = document.getElementById('firebaseConfigInput').value.trim();
        if (!str) { showError('Vui lòng nhập Firebase config'); return; }
        try {
            FirebaseApp.saveConfig(JSON.parse(str));
            document.getElementById('configModal').classList.remove('show');
            location.reload();
        } catch { showError('JSON không hợp lệ!'); }
    });
    document.getElementById('configModal')?.addEventListener('click', e => { if (e.target.id === 'configModal') e.target.classList.remove('show'); });

    const main = document.getElementById('checklistMain');
    const handleMainAction = e => {
        const editSec = e.target.closest('.section-edit-btn');
        if (editSec) { e.preventDefault(); e.stopPropagation(); openEditSection(editSec.dataset.editSection); return; }
        const delSec = e.target.closest('.section-delete-btn');
        if (delSec) { e.preventDefault(); e.stopPropagation(); deleteSection(delSec.dataset.deleteSectionId); return; }
        const restoreBtn = e.target.closest('.restore-section-btn');
        if (restoreBtn) { e.preventDefault(); e.stopPropagation(); restoreSection(restoreBtn.dataset.restoreSection); return; }
        const permDel = e.target.closest('.perm-delete-btn');
        if (permDel) { e.preventDefault(); e.stopPropagation(); confirmPermanentDelete(permDel.dataset.permDelete); return; }
        const togglePanel = e.target.closest('#toggleDeletedPanel');
        if (togglePanel) {
            e.preventDefault(); e.stopPropagation();
            window._deletedPanelOpen = !window._deletedPanelOpen;
            const list = main.querySelector('.hidden-sections-list');
            const arrow = main.querySelector('.hidden-panel-toggle');
            if (list) list.classList.toggle('hidden-list-collapsed');
            if (arrow) arrow.classList.toggle('collapsed');
            return;
        }
        const addGrp = e.target.closest('#addGroupBtn');
        if (addGrp) { e.preventDefault(); e.stopPropagation(); openAddGroupModal(); return; }
        const copyGrp = e.target.closest('#copyGroupsBtn');
        if (copyGrp) { e.preventDefault(); e.stopPropagation(); openCopyGroupsModal(); return; }
        const editText = e.target.closest('.item-edit-text-btn');
        if (editText) { e.preventDefault(); e.stopPropagation(); startEditTaskText(editText.dataset.editText); return; }
        const del = e.target.closest('.item-delete-btn');
        if (del) { e.preventDefault(); e.stopPropagation(); deleteTask(del.dataset.delete, del.dataset.deleteSection, del.dataset.isCustom === '1'); return; }
        const note = e.target.closest('.item-note-btn');
        if (note) { e.preventDefault(); e.stopPropagation(); openNote(note.dataset.note); return; }
        const showBtn = e.target.closest('.add-task-btn');
        if (showBtn) { e.preventDefault(); e.stopPropagation(); showAddInput(showBtn.dataset.showInput); return; }
        const confirmBtn = e.target.closest('.add-task-confirm');
        if (confirmBtn) { e.preventDefault(); e.stopPropagation(); confirmAddTask(confirmBtn.dataset.confirmSection); return; }
        const cancelBtn = e.target.closest('.add-task-cancel');
        if (cancelBtn) { e.preventDefault(); e.stopPropagation(); hideAddInput(cancelBtn.dataset.cancelSection); return; }
        const item = e.target.closest('.checklist-item');
        if (item) { e.preventDefault(); toggleItem(item.dataset.item); return; }
        const header = e.target.closest('.section-header');
        if (header) { toggleSection(header.dataset.section); }
    };
    main.addEventListener('click', handleMainAction);

    // Char count for add-task inputs
    document.getElementById('checklistMain').addEventListener('input', e => {
        if (e.target.classList.contains('add-task-input')) {
            const sid = e.target.dataset.inputSection;
            const counter = document.querySelector(`[data-char-count="${sid}"]`);
            if (counter) {
                const len = e.target.value.length;
                counter.textContent = `${len} / 150 ký tự`;
                counter.classList.toggle('limit-reached', len >= 150);
            }
        }
    });

    // Char count for modals (Global Delegation)
    document.addEventListener('input', e => {
        if (e.target.id === 'notesTextarea') updateModalCharCount('notesTextarea', 'notesCharCount', 500);
        if (e.target.id === 'editSectionTitle') updateModalCharCount('editSectionTitle', 'editTitleCount', 50);
        if (e.target.id === 'editSectionSubtitle') updateModalCharCount('editSectionSubtitle', 'editSubtitleCount', 100);
        if (e.target.id === 'addGroupTitle') updateModalCharCount('addGroupTitle', 'addTitleCount', 50);
        if (e.target.id === 'addGroupSubtitle') updateModalCharCount('addGroupSubtitle', 'addSubtitleCount', 100);
    });
    document.addEventListener('keyup', e => {
        if (e.target.id === 'notesTextarea') updateModalCharCount('notesTextarea', 'notesCharCount', 500);
    });

    document.getElementById('checklistMain').addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.classList.contains('add-task-input')) confirmAddTask(e.target.dataset.inputSection);
        if (e.key === 'Escape' && e.target.classList.contains('add-task-input')) hideAddInput(e.target.dataset.inputSection);
    });

    document.getElementById('prevDay').addEventListener('click', () => { 
        if (creationDate && dateKey(dayOffset - 1) < creationDate) {
            FirebaseApp.toast('Bạn không thể quay lại trước ngày bắt đầu sử dụng!');
            return;
        }
        dayOffset--; 
        animateDateChange(); 
    });
    document.getElementById('nextDay').addEventListener('click', () => { dayOffset++; animateDateChange(); });

    document.getElementById('resetBtn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('resetConfirmModal').classList.add('show');
    });

    // Reset confirm modal
    document.getElementById('resetConfirmOk')?.addEventListener('click', () => {
        document.getElementById('resetConfirmModal').classList.remove('show');
        window._localActionInProgress = true;
        saveChecklist({});
        renderSections();
        updateStreak();
        FirebaseApp.toast('Đã reset nhiệm vụ ✓');
        setTimeout(() => { window._localActionInProgress = false; }, 2500);
    });
    document.getElementById('resetConfirmCancel')?.addEventListener('click', () => {
        document.getElementById('resetConfirmModal').classList.remove('show');
    });
    document.getElementById('resetConfirmModal')?.addEventListener('click', e => {
        if (e.target.id === 'resetConfirmModal') e.target.classList.remove('show');
    });

    document.getElementById('celebrationCloseBtn').addEventListener('click', () => document.getElementById('celebrationOverlay').classList.remove('show'));
    document.getElementById('notesClose').addEventListener('click', () => document.getElementById('notesModal').classList.remove('show'));
    document.getElementById('notesSave').addEventListener('click', saveNote);
    document.getElementById('notesModal').addEventListener('click', e => { if (e.target.id === 'notesModal') e.target.classList.remove('show'); });
    document.getElementById('copyShareURL')?.addEventListener('click', copyShareURL);

    // Edit section modal
    document.getElementById('editSectionClose')?.addEventListener('click', () => document.getElementById('editSectionModal').classList.remove('show'));
    document.getElementById('editSectionSave')?.addEventListener('click', saveEditSection);
    document.getElementById('editSectionReset')?.addEventListener('click', resetEditSection);
    document.getElementById('editSectionModal')?.addEventListener('click', e => { if (e.target.id === 'editSectionModal') e.target.classList.remove('show'); });
    document.getElementById('iconPicker')?.addEventListener('click', e => {
        const btn = e.target.closest('.icon-option');
        if (btn) { selectedIcon = btn.dataset.icon; renderIconPicker(); }
    });

    // Delete section confirm modal
    document.getElementById('deleteSectionConfirm')?.addEventListener('click', () => {
        const modal = document.getElementById('deleteSectionModal');
        if (modal._sectionId) executeDeleteSection(modal._sectionId, modal._eff);
    });
    document.getElementById('deleteSectionCancel')?.addEventListener('click', () => {
        document.getElementById('deleteSectionModal').classList.remove('show');
    });
    document.getElementById('deleteSectionModal')?.addEventListener('click', e => {
        if (e.target.id === 'deleteSectionModal') e.target.classList.remove('show');
    });

    // Add Group modal
    document.getElementById('addGroupClose')?.addEventListener('click', () => document.getElementById('addGroupModal').classList.remove('show'));
    document.getElementById('addGroupSave')?.addEventListener('click', () => {
        let title = document.getElementById('addGroupTitle').value.trim();
        let subtitle = document.getElementById('addGroupSubtitle').value.trim();
        if (!title) { document.getElementById('addGroupTitle').focus(); return; }
        // Limits for groups
        if (title.length > 50) title = title.slice(0, 50);
        if (subtitle.length > 100) subtitle = subtitle.slice(0, 100);
        document.getElementById('addGroupModal').classList.remove('show');
        addNewGroup(title, subtitle, selectedNewGroupIcon);
    });
    document.getElementById('addGroupModal')?.addEventListener('click', e => { if (e.target.id === 'addGroupModal') e.target.classList.remove('show'); });
    document.getElementById('newGroupIconPicker')?.addEventListener('click', e => {
        const btn = e.target.closest('.icon-option');
        if (btn) { selectedNewGroupIcon = btn.dataset.icon; renderNewGroupIconPicker(); }
    });

    // Copy Groups modal
    document.getElementById('copyGroupsClose')?.addEventListener('click', () => document.getElementById('copyGroupsModal').classList.remove('show'));
    document.getElementById('copyGroupsModal')?.addEventListener('click', e => {
        if (e.target.id === 'copyGroupsModal') e.target.classList.remove('show');
        const opt = e.target.closest('.copy-day-option');
        if (opt) copyGroupsFrom(opt.dataset.copySource);
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.getElementById('notesModal').classList.remove('show');
            document.getElementById('celebrationOverlay').classList.remove('show');
            document.getElementById('configModal')?.classList.remove('show');
            document.getElementById('editSectionModal')?.classList.remove('show');
            document.getElementById('deleteSectionModal')?.classList.remove('show');
            document.getElementById('resetConfirmModal')?.classList.remove('show');
            document.getElementById('addGroupModal')?.classList.remove('show');
            document.getElementById('copyGroupsModal')?.classList.remove('show');
        }
    });

    document.getElementById('socialBtn')?.addEventListener('click', openSocialModal);
    document.getElementById('socialClose')?.addEventListener('click', () => document.getElementById('socialModal').classList.remove('show'));
    document.getElementById('copyMyIdBtn')?.addEventListener('click', () => {
        const input = document.getElementById('myIdInput');
        input.select();
        document.execCommand('copy');
        FirebaseApp.toast('Đã copy ID của bạn ✓');
    });
    document.getElementById('viewFriendBtn')?.addEventListener('click', () => {
        const uid = document.getElementById('friendIdInput').value.trim();
        if (uid) viewOtherUser(uid);
        else document.getElementById('friendIdInput').focus();
    });
    document.getElementById('viewBackBtn')?.addEventListener('click', exitReadOnly);

    document.getElementById('moodOptions')?.addEventListener('click', e => {
        if (window._isReadOnly) return;
        const btn = e.target.closest('.mood-btn');
        if (btn) {
            const mood = btn.dataset.mood;
            saveMood(mood);
            renderMood();
            FirebaseApp.toast(`Hôm nay bạn thấy ${btn.title} ${mood}`);
        }
    });
}

function renderMood() {
    const mood = getMood();
    document.querySelectorAll('.mood-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mood === mood);
    });
}

function updateTotalXP(delta) {
    if (window._isReadOnly) return;
    try {
        const raw = localStorage.getItem('totalXP');
        let curXP = 0;
        if (raw) {
            try { curXP = parseInt(JSON.parse(raw)) || 0; }
            catch { curXP = parseInt(raw) || 0; }
        }
        const newXP = Math.max(0, curXP + delta);
        localStorage.setItem('totalXP', JSON.stringify(newXP));
        FirebaseApp.save('meta/totalXP', newXP);

        const xpEl = document.getElementById('totalXP');
        if (xpEl) {
            xpEl.textContent = newXP.toLocaleString();
            if (delta > 0) {
                xpEl.classList.remove('pulse-anim');
                void xpEl.offsetWidth;
                xpEl.classList.add('pulse-anim');
            }
        }
        FirebaseApp.toast(delta > 0 ? `+${delta} XP! ✨` : `${delta} XP`);
        updateStreak(); // Update Level display
    } catch (e) { console.error('XP Error:', e); }
}

document.addEventListener('DOMContentLoaded', init);
