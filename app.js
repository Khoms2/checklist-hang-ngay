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

const SECTION_THEMES = ['section-morning', 'section-evening', 'section-practice', 'section-bug', 'section-review', 'section-log'];

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

    // Default initialization: Start EMPTY for new users as requested
    const defaults = [];
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

const CELEBRATION_MESSAGES = [
    "🎉 Hoàn thành rồi! Hôm nay bạn đã tiến thêm 1 bước lớn.",
    "✅ Xuất sắc! Task đã được hoàn thành thành công.",
    "🚀 Nice! Bạn đang giữ streak cực tốt đấy.",
    "🔥 Quá đỉnh! Tiếp tục giữ phong độ này nhé.",
    "💪 Một việc nữa đã xong. Bạn đang làm rất tốt.",
    "🌟 Chúc mừng! Thành quả nhỏ hôm nay sẽ tạo khác biệt lớn sau này.",
    "🎯 Mission Complete! Công việc đã hoàn tất.",
    "🏆 Bạn vừa vượt qua thêm một mục tiêu hôm nay.",
    "⚡ Tốc độ và hiệu quả thật ấn tượng.",
    "🧠 Kỷ luật hôm nay = thành công ngày mai.",
    "✨ Hoàn thành thành công! Nghỉ ngơi chút rồi chiến tiếp nào.",
    "📈 Progress +1. Bạn đang tiến bộ mỗi ngày.",
    "🥳 Done! Một ngày hiệu quả hơn rồi đó.",
    "🎊 Tuyệt vời! Checklist của bạn đang được chinh phục.",
    "🛠️ Công việc đã xử lý xong gọn gàng.",
    "😎 Good job! Bạn vừa tự vượt qua sự trì hoãn.",
    "🔓 Thành tựu mới đã được mở khóa.",
    "⏳ Hoàn thành sớm hơn dự kiến luôn rồi.",
    "💎 Từng task hoàn thành đang xây dựng phiên bản tốt hơn của bạn.",
    "🚩 Finish! Hôm nay bạn không bỏ cuộc — và điều đó rất giá trị"
];

const AUTH_KEYWORDS = [
    "Sáng tạo", "Kỷ luật", "Thành công", "Kiên trì", "Đam mê",
    "Tập trung", "Hiệu quả", "Tư duy", "Học hỏi", "Vươn xa",
    "Bền bỉ", "Tự tin", "Quyết tâm", "Sáng suốt", "Khát vọng",
    "Chân thành", "Trách nhiệm", "Đoàn kết", "Vững bước", "Tận tâm"
];
let currentMagicWords = [];
let currentMagicEmail = "";

// Friends System State
let _myFriends = {};
let _friendRequests = {};
let _notifications = []; // { id, icon, text, time, read }
let _currentLeaderboard = [];
let _friendReactions = {};
let _myFriendCode = "";

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
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function formatDate(offset) {
    const dt = getDateFromOffset(offset !== undefined ? offset : dayOffset);
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

// ===== STORAGE =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== PERFORMANCE: In-memory cache for localStorage =====
const _memCache = new Map();
function gs(key, fb) {
    if (_memCache.has(key)) return _memCache.get(key);
    try { const v = localStorage.getItem(key); const r = v !== null ? JSON.parse(v) : fb; _memCache.set(key, r); return r; }
    catch { return fb; }
}
function ss(key, val) { 
    _memCache.set(key, val); 
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.warn('localStorage error', e); }
}
function clearCache(key) { if (key) _memCache.delete(key); else _memCache.clear(); }

// ===== PERFORMANCE: Debounce utility =====
function debounce(fn, ms) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

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
                    <span class="section-progress-badge ${done === total && total > 0 ? 'complete' : ''}">${done}/${total}</span>
                    <span class="section-toggle ${isCollapsed ? 'collapsed' : ''}">▾</span>
                </div>
            </div>
            <div class="group-progress-container">
                <div class="group-progress-bar" style="width: ${total > 0 ? (done / total * 100) : 0}%"></div>
            </div>
        </div>
        <div class="section-items ${isCollapsed ? 'items-hidden' : ''}" data-section-items="${section.id}">
            <div class="section-items-inner">
                ${items.map(item => {
        const checked = cl[item.id] || false;
        const hasNote = notes[item.id] && notes[item.id].trim();
        const displayText = getEffectiveText(item);
        return `<div class="checklist-item ${checked ? 'checked' : ''}" data-item="${item.id}">
                        <div class="custom-checkbox ${checked ? 'checked' : ''}" data-item="${item.id}"></div>
                        <span class="item-text" data-text-id="${item.id}">${escapeHtml(displayText)}</span>
                        <div class="item-actions">
                            <button class="item-edit-text-btn" data-edit-text="${item.id}" title="Sửa nội dung">✏️</button>
                            <button class="item-note-btn ${hasNote ? 'has-note' : ''}" data-note="${item.id}" title="Ghi chú">📝${hasNote ? `<span class="note-count">(${notes[item.id].length})</span>` : ''}</button>
                            <button class="item-delete-btn" data-delete="${item.id}" data-delete-section="${section.id}" data-is-custom="${item.custom ? '1' : '0'}" title="Xóa task">✕</button>
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

    if (visibleSections.length === 0) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'empty-state-container';
        emptyEl.innerHTML = `
            <div class="empty-state-icon">✨</div>
            <h3>Sẵn sàng cho ngày mới?</h3>
            <p>Bắt đầu bằng cách tự tạo nhóm hoặc sử dụng mẫu có sẵn.</p>
            <div class="empty-state-actions">
                <button class="empty-state-add-btn" onclick="document.getElementById('addGroupBtn').click()">+ Thêm nhóm mới</button>
                <button class="empty-state-template-btn" id="useSampleBtn">💡 Sử dụng nhóm mẫu</button>
            </div>
        `;
        main.appendChild(emptyEl);

        document.getElementById('useSampleBtn')?.addEventListener('click', () => {
            const defaults = JSON.parse(JSON.stringify(DEFAULT_SECTIONS));
            saveDaySections(defaults);
            renderSections();
            FirebaseApp.toast('Đã áp dụng nhóm mẫu ✓');
        });
    } else {
        visibleSections.forEach((section, i) => {
            const el = buildSectionElement(section, cl, notes);
            el.style.animationDelay = `${i * 0.05}s`;
            main.appendChild(el);
        });
    }

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
                    <span class="hidden-panel-toggle ${isDeletedPanelOpen ? '' : 'collapsed'}">▾</span>
                </div>
                <div class="hidden-sections-list ${isDeletedPanelOpen ? '' : 'hidden-list-collapsed'}">
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
    addPanel.innerHTML = `<button class="add-group-btn" id="addGroupBtn">＋ Thêm nhóm mới</button>`;
    main.appendChild(addPanel);

    // Deleted groups panel — below the add buttons
    if (_restoreEl) main.appendChild(_restoreEl);

    updateProgress();
}

// ===== SURGICAL TOGGLE (no re-render) =====
function toggleItem(itemId) {
    if (window._isReadOnly || dayOffset < 0) { FirebaseApp.toast(dayOffset < 0 ? 'Không thể chỉnh sửa dữ liệu quá khứ 🔒' : 'Bạn đang ở chế độ CHỈ XEM 👁️'); return; }
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
            if (progressBar) progressBar.style.width = `${items.length > 0 ? (done / items.length * 100) : 0}%`;
            break;
        }
    }
    // Update XP level display
    updateStreak();
    // Set flag so updateProgress knows this came from a user action
    window._justToggledItem = cl[itemId]; // only celebrate when checking ON

    // Log activity if checked
    if (window._justToggledItem) {
        const allItems = getAllItems();
        // Removed granular task logging to prevent spam in global feed
    }

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

    // Update encouragement text
    const encouragementEl = document.getElementById('progressEncouragement');
    if (encouragementEl) {
        if (pct === 0) encouragementEl.textContent = 'Bắt đầu ngày mới thôi! 🚀';
        else if (pct < 30) encouragementEl.textContent = 'Khởi đầu tốt đấy! 💪';
        else if (pct < 70) encouragementEl.textContent = 'Bạn đang làm rất tốt! ✨';
        else if (pct < 100) encouragementEl.textContent = 'Sắp về đích rồi, cố lên! 🔥';
        else encouragementEl.textContent = 'Tuyệt vời! Bạn đã hoàn thành 100% 🏆';
    }

    // Sync progress to public profile
    if (FirebaseApp.user && !window._isReadOnly && dayOffset >= 0 && !window._isRemoteUpdate) {
        FirebaseApp.updatePublicProfile({ todayProgress: pct });
    }

    // Only show celebration when the user just actively toggled the last item
    if (pct === 100 && done > 0 && dayOffset === 0 && window._justToggledItem) {
        const overlay = document.getElementById('celebrationOverlay');
        const titleEl = document.getElementById('celebrationTitle');
        const msgEl = document.getElementById('celebrationMsg');
        const iconEl = overlay?.querySelector('.celebration-icon');

        if (overlay && msgEl) {
            const randomMsg = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];

            // Extract emoji from the start if it exists
            const emojiMatch = randomMsg.match(/^([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])\s*(.*)$/);

            if (emojiMatch) {
                if (iconEl) iconEl.textContent = emojiMatch[1];
                msgEl.textContent = emojiMatch[2];
            } else {
                msgEl.textContent = randomMsg;
            }

            if (titleEl) titleEl.textContent = "Hoàn thành! ✨";

            overlay.classList.add('show');
            triggerConfetti();

            // Log global activity for 100% completion
            FirebaseApp.logActivity(`đã hoàn thành XUẤT SẮC 100% nhiệm vụ hôm nay! 🏆`);

            window._justToggledItem = false;
        }
    }
    // Reset the flag after check
    window._justToggledItem = false;
}

function getProgressForDay(offset) {
    const dk = dateKey(offset);
    const cl = gs(`checklist_${dk}`, {});
    const sections = gs(`sections_${dk}`, []);
    let all = [];
    sections.forEach(s => {
        const items = s.items || [];
        const custom = gs(`custom_${dk}_${s.id}`, []);
        all = all.concat(items, custom);
    });
    const done = all.filter(i => cl[i.id]).length;
    return all.length > 0 ? (done / all.length) * 100 : 0;
}

// ===== DATE DISPLAY =====
function updateDateDisplay() {
    const label = document.getElementById('dateLabel');
    const value = document.getElementById('dateValue');
    const prevBtn = document.getElementById('prevDay');
    const nextBtn = document.getElementById('nextDay');

    if (dayOffset === 0) {
        label.textContent = 'Hôm nay';
        label.style.cursor = 'default';
        label.onclick = null;
    } else {
        const text = dayOffset === -1 ? 'Hôm qua' : `${Math.abs(dayOffset)} ngày trước`;
        label.textContent = text;
        label.style.cursor = 'pointer';
        label.title = 'Quay về Hôm nay';
        label.onclick = () => {
            dayOffset = 0;
            updateDateDisplay();
            renderSections();
        };
    }

    value.textContent = formatDate();

    // Disable prev button only if at creation date limit
    // (removed isHistoryLocked — users should always be able to view past data)
    if (creationDate && dateKey(dayOffset - 1) < creationDate) {
        prevBtn?.classList.add('disabled');
        prevBtn?.removeAttribute('title');
    } else {
        prevBtn?.classList.remove('disabled');
        prevBtn?.removeAttribute('title');
    }

    // Apply read-only styling for past days
    if (dayOffset < 0) {
        document.querySelector('.app-container').classList.add('past-read-only');
    } else {
        document.querySelector('.app-container').classList.remove('past-read-only');
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

    const xpPerDay = 50, xpPerTask = 5;
    const totalXP = gs('totalXP', 0);
    const lvl = Math.floor(totalXP / 500) + 1;
    const totalXPEl = document.getElementById('totalXP');
    if (totalXPEl) totalXPEl.textContent = totalXP;
    const xpLevelEl = document.getElementById('xpLevel');
    if (xpLevelEl) xpLevelEl.textContent = `Lv.${lvl}`;

    const nextLvlXP = lvl * 500;
    const currentLvlStartXP = (lvl - 1) * 500;
    const progress = ((totalXP - currentLvlStartXP) / (nextLvlXP - currentLvlStartXP)) * 100;
    const xpBarEl = document.getElementById('xpLevelBar');
    if (xpBarEl) xpBarEl.style.width = `${progress}%`;

    // Update stats cards below
    const best = Math.max(gs('bestStreak', 0), streak);
    ss('bestStreak', best); FirebaseApp.save('meta/bestStreak', best);
    document.getElementById('bestStreak').textContent = best;

    let totalDays = gs('totalCompletedDays', 0);
    const tk = `completed_${dateKey(0)}`;
    if (todayDone && !gs(tk, false)) {
        totalDays++;
        ss('totalCompletedDays', totalDays);
        ss(tk, true);
        FirebaseApp.save('meta/totalCompletedDays', totalDays);
        FirebaseApp.save(`meta/${tk}`, true);
    }
    document.getElementById('totalDays').textContent = totalDays;

    // Update dynamic subtitles
    const streakSub = document.getElementById('streakSub');
    if (streakSub) {
        if (streak === 0) streakSub.textContent = 'Cố lên! Bắt đầu chuỗi ngày mới nào 💪';
        else if (streak < 3) streakSub.textContent = `Tốt lắm! Giữ vững nhé 🔥`;
        else if (streak < 7) streakSub.textContent = `${streak} ngày liên tiếp! Quá giỏi 🌟`;
        else if (streak < 30) streakSub.textContent = `${streak} ngày! Bạn thật kiên trì 💎`;
        else streakSub.textContent = `${streak} ngày! Huyền thoại! 👑`;
    }
    const xpRemainingEl = document.getElementById('xpRemaining');
    if (xpRemainingEl) {
        const remaining = nextLvlXP - totalXP;
        xpRemainingEl.textContent = `${remaining} XP để lên cấp ${lvl + 1}`;
    }

    // Update Header
    updateHeaderStats(streak, lvl, totalXP);
}

function updateHeaderStats(streak, lvl, xp) {
    const hStreak = document.getElementById('headerStreak');
    const hLvl = document.getElementById('headerLevel');
    const hXP = document.getElementById('headerXP');
    if (hStreak) hStreak.textContent = streak;
    if (hLvl) hLvl.textContent = lvl;
    if (hXP) hXP.textContent = xp;

    // Sync to public profile periodically via FirebaseApp.save logic
    // but also explicitly here if needed
    if (FirebaseApp.user) {
        FirebaseApp.updatePublicProfile({
            streak: streak,
            level: lvl,
            xp: xp
        });
    }
}

function initSocialFeatures() {
    if (!FirebaseApp.db) return;

    // 1. Activity Feed
    const feedList = document.getElementById('activityFeedList');
    if (!feedList) return;

    FirebaseApp.db.ref('global_activities').limitToLast(20).on('value', snap => {
        const val = snap.val();
        const activities = [];
        if (val) {
            snap.forEach(child => { activities.unshift(child.val()); });
        }

        if (activities.length === 0) {
            feedList.innerHTML = '<div class="activity-item empty">Chưa có hoạt động nào...</div>';
            return;
        }

        feedList.innerHTML = activities.map(a => {
            const timeStr = new Date(a.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            // Extract the user's name
            const name = escapeHtml(a.name || 'Anonymous');
            // Check if it's a milestone (100% completion) or normal task
            const isMilestone = a.text.includes('100%');
            const icon = isMilestone ? '🏆' : '✅';
            
            return `
            <div class="activity-item ${isMilestone ? 'milestone' : ''}">
                <div class="activity-icon">${icon}</div>
                <div class="activity-content">
                    <div class="activity-meta">
                        <span class="activity-user">${name}</span>
                        <span class="activity-time">${timeStr}</span>
                    </div>
                    <span class="activity-text">${escapeHtml(a.text)}</span>
                </div>
            </div>
        `}).join('');
    });

    // 2. Online Presence
    const onlineBadge = document.getElementById('onlineCountBadge');
    FirebaseApp.db.ref('presence').on('value', snap => {
        if (!onlineBadge) return;
        const count = snap.numChildren();
        onlineBadge.textContent = count;
        onlineBadge.parentElement.classList.toggle('has-online', count > 0);
    });

    // 3. Global Ranking (Simple calculation from public profiles)
    FirebaseApp.db.ref('public_profiles').on('value', snap => {
        if (!FirebaseApp.user) return;
        const profiles = [];
        snap.forEach(child => { profiles.push({ uid: child.key, ...child.val() }); });
        profiles.sort((a, b) => (b.xp || 0) - (a.xp || 0));

        const myIndex = profiles.findIndex(p => p.uid === FirebaseApp.user.uid);
        const hRank = document.getElementById('headerRank');
        if (hRank) hRank.textContent = myIndex !== -1 ? (myIndex + 1) : '--';
    });
}

// ===== FRIENDS HUB LOGIC (v4.0) =====
async function initFriendsSystem() {
    console.log('initFriendsSystem called');
    if (!FirebaseApp.db || !FirebaseApp.user) {
        console.warn('initFriendsSystem aborted: No DB or User');
        return;
    }

    // 1. Generate/Load My Friend Code
    const myCodeDisplay = document.getElementById('myFriendCodeDisplay');
    if (myCodeDisplay && (!_myFriendCode || _myFriendCode === '...')) {
        myCodeDisplay.textContent = 'Đang tạo...';
        try {
            _myFriendCode = await FirebaseApp.generateFriendCode();
            myCodeDisplay.textContent = _myFriendCode || 'Lỗi';
            if (!_myFriendCode) console.error('Failed to generate friend code');
        } catch (e) {
            console.error('initFriendsSystem error:', e);
            myCodeDisplay.textContent = 'Lỗi';
        }
    }

    // 2. Listen to Friends List
    let lastFriendUids = null;
    FirebaseApp.listenToFriends(async (friends) => {
        _myFriends = friends || {};
        const uids = Object.keys(_myFriends);
        if (lastFriendUids !== null) {
            const newFriends = uids.filter(id => !lastFriendUids.includes(id));
            for (const id of newFriends) {
                const profile = await FirebaseApp.getPublicProfile(id);
                if (profile) FirebaseApp.toast(`🎉 ${profile.name} đã chấp nhận lời mời kết bạn`);
            }
        }
        lastFriendUids = uids;
        renderFriendsList();
        updateFriendsFeed();
    });

    // 3. Listen to Friend Requests
    let lastReqCount = -1;
    FirebaseApp.listenToFriendRequests(requests => {
        _friendRequests = requests || {};
        const count = Object.keys(_friendRequests).length;

        if (lastReqCount !== -1 && count > lastReqCount) {
            FirebaseApp.toast('🔔 Bạn có lời mời kết bạn mới');
        }
        lastReqCount = count;

        const badge = document.getElementById('friendRequestBadge');
        const tabBadge = document.getElementById('requestsTabBadge');

        // Combined notifications badge (requests + unread notifications)
        const unreadNotifs = _notifications.filter(n => !n.read).length;
        const totalBadgeCount = count + unreadNotifs;

        if (badge) {
            badge.textContent = totalBadgeCount;
            badge.style.display = totalBadgeCount > 0 ? 'flex' : 'none';
        }
        if (tabBadge) {
            tabBadge.textContent = count;
            tabBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }

        // Update Notifications
        if (count > 0) {
            Object.values(_friendRequests).forEach(req => {
                addNotification({
                    id: `req_${req.fromUid}`,
                    icon: '👥',
                    text: `<b>${req.name}</b> muốn kết bạn với bạn`,
                    time: req.timestamp
                });
            });
        }
        renderNotifications();
        renderFriendRequests();
    });

    // 4. Update Leaderboard
    updateLeaderboard();
}

async function renderFriendsList() {
    const container = document.getElementById('friendsListContainer');
    if (!container) return;

    const friendUids = Object.keys(_myFriends);
    if (friendUids.length === 0) {
        container.innerHTML = '<div class="empty-friends">Bạn chưa có người bạn nào. Hãy chia sẻ mã để kết bạn!</div>';
        return;
    }

    container.innerHTML = '<div class="friends-loading">Đang tải danh sách...</div>';

    let html = '';
    for (const uid of friendUids) {
        const profile = await FirebaseApp.getPublicProfile(uid);
        if (!profile) continue;

        // Check Presence
        const isOnline = await new Promise(resolve => {
            FirebaseApp.db.ref(`presence/${uid}`).once('value', snap => resolve(snap.val() === true));
        });

        html += `
            <div class="friend-card" data-uid="${uid}">
                <div class="avatar-container" style="position:relative">
                    <img src="${profile.avatar}" class="friend-avatar" alt="">
                    <span class="status-indicator ${isOnline ? 'status-online' : 'status-offline'}" style="position:absolute; bottom:2px; right:2px; border:2px solid var(--bg-card); width:12px; height:12px;"></span>
                </div>
                <div class="friend-info">
                    <div class="friend-name">${escapeHtml(profile.name)}</div>
                    <div class="friend-stats-line">
                        <span class="f-streak">🔥 ${profile.streak || 0}</span>
                        <span class="f-level">⭐ Lv.${profile.level || 1}</span>
                        <span class="f-progress">📈 ${profile.todayProgress || 0}%</span>
                    </div>
                    <div class="f-status-text">
                        ${isOnline ? '<span style="color:#4ade80">🟢 Online</span>' : '<span style="color:#94a3b8">⚫ Offline</span>'}
                    </div>
                </div>
                <div class="friend-progress-col">
                    <span class="f-progress-val">${profile.todayProgress || 0}%</span>
                    <span class="f-status">Hồ sơ</span>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;

    // Add click events
    container.querySelectorAll('.friend-card').forEach(card => {
        const uid = card.dataset.uid;
        card.onclick = async () => {
            const profile = await FirebaseApp.getPublicProfile(uid);
            openFriendProfile(uid, profile);
        };
    });
}

function renderFriendRequests() {
    const container = document.getElementById('friendRequestsContainer');
    if (!container) return;

    const requests = Object.values(_friendRequests);
    if (requests.length === 0) {
        container.innerHTML = '<div class="empty-requests">Chưa có lời mời kết bạn nào.</div>';
        return;
    }

    container.innerHTML = requests.map(req => `
        <div class="request-item">
            <img src="${req.avatar}" class="friend-avatar" alt="">
            <div class="friend-info">
                <div class="friend-name">👤 ${escapeHtml(req.name)}</div>
                <div class="friend-stats-line">Muốn kết bạn với bạn</div>
            </div>
            <div class="request-actions">
                <button class="req-btn reject" data-uid="${req.fromUid}">Từ chối</button>
                <button class="req-btn accept" data-uid="${req.fromUid}">Chấp nhận</button>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.accept').forEach(btn => {
        btn.onclick = () => FirebaseApp.respondToFriendRequest(btn.dataset.uid, true);
    });
    container.querySelectorAll('.reject').forEach(btn => {
        btn.onclick = () => FirebaseApp.respondToFriendRequest(btn.dataset.uid, false);
    });
}

async function updateLeaderboard() {
    const container = document.getElementById('leaderboardContainer');
    if (!container) return;

    FirebaseApp.db.ref('public_profiles').once('value', async snap => {
        const profiles = [];
        snap.forEach(child => { profiles.push({ uid: child.key, ...child.val() }); });

        profiles.sort((a, b) => {
            if ((b.streak || 0) !== (a.streak || 0)) return (b.streak || 0) - (a.streak || 0);
            return (b.xp || 0) - (a.xp || 0);
        });

        _currentLeaderboard = profiles;
        const myUid = FirebaseApp.user?.uid;

        container.innerHTML = profiles.slice(0, 50).map((p, i) => `
            <div class="lb-item ${p.uid === myUid ? 'me' : ''}">
                <div class="lb-col-rank"><span class="lb-rank">${i + 1}</span></div>
                <div class="lb-col-user">
                    <img src="${p.avatar}" class="lb-avatar" alt="">
                    <span class="lb-name">${escapeHtml(p.name)}</span>
                </div>
                <div class="lb-col-streak">${p.streak || 0} 🔥</div>
                <div class="lb-col-xp">${(p.xp || 0).toLocaleString()}</div>
            </div>
        `).join('');
    });
}

async function openFriendProfile(uid, profile) {
    const modal = document.getElementById('friendProfileModal');
    if (!modal) return;

    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileCode = document.getElementById('profileCode');
    const profileProgress = document.getElementById('profileProgress');
    const profileStreak = document.getElementById('profileStreak');
    const profileLevel = document.getElementById('profileLevel');
    const profileMood = document.getElementById('profileMood');

    if (profileAvatar) profileAvatar.src = profile.avatar;
    if (profileName) profileName.textContent = profile.name;
    if (profileCode) profileCode.textContent = `Mã: ${profile.friendCode || '......'}`;
    if (profileProgress) profileProgress.textContent = `${profile.todayProgress || 0}%`;
    if (profileStreak) profileStreak.textContent = profile.streak || 0;
    if (profileLevel) profileLevel.textContent = profile.level || 1;
    if (profileMood) profileMood.textContent = profile.mood || '😐';

    const viewBtn = document.getElementById('viewFriendChecklistBtn');
    if (viewBtn) {
        viewBtn.onclick = () => {
            viewOtherUser(uid);
            modal.classList.remove('show');
        };
    }

    const unfriendBtn = document.getElementById('unfriendBtn');
    if (unfriendBtn) {
        unfriendBtn.onclick = async () => {
            if (confirm(`Bạn có chắc chắn muốn hủy kết bạn với ${profile.name} không?`)) {
                await FirebaseApp.unfriend(uid);
                modal.classList.remove('show');
            }
        };
    }

    const reactBtns = modal.querySelectorAll('.react-btn');
    reactBtns.forEach(btn => {
        btn.onclick = async () => {
            const emoji = btn.dataset.emoji;
            await FirebaseApp.addReaction(uid, dateKey(0), emoji);
            FirebaseApp.toast(`Đã gửi ${emoji} tới ${profile.name}!`);
        };
    });

    FirebaseApp.listenToReactions(uid, dateKey(0), reactions => {
        const reactContainer = document.getElementById('receivedReactions');
        if (!reactContainer) return;
        if (!reactions) {
            reactContainer.innerHTML = '';
            return;
        }
        const list = Object.values(reactions);
        reactContainer.innerHTML = `
            <p class="reaction-title">Reactions hôm nay:</p>
            <div class="reaction-list-mini" style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;">
                ${list.map(r => `<span class="mini-react" title="${r.name}" style="font-size:1.2rem;background:rgba(255,255,255,0.05);padding:5px;border-radius:8px;">${r.emoji}</span>`).join('')}
            </div>`;
    });

    modal.classList.add('show');
}

function updateFriendsFeed() {
    const container = document.getElementById('friendsFeedContainer');
    if (!container) return;

    FirebaseApp.db.ref('global_activities').limitToLast(30).once('value', snap => {
        const activities = [];
        snap.forEach(child => {
            const act = child.val();
            if (_myFriends[act.uid] || act.uid === FirebaseApp.user?.uid) {
                activities.unshift(act);
            }
        });

        if (activities.length === 0) {
            container.innerHTML = '<div class="activity-item empty">Chưa có hoạt động mới từ bạn bè.</div>';
            return;
        }

        container.innerHTML = activities.map(a => {
            const timeStr = new Date(a.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const name = escapeHtml(a.name || 'Anonymous');
            const isMilestone = a.text.includes('100%');
            const icon = isMilestone ? '🏆' : '✅';
            
            return `
            <div class="activity-item ${isMilestone ? 'milestone' : ''}">
                <div class="activity-icon">${icon}</div>
                <div class="activity-content">
                    <div class="activity-meta">
                        <span class="activity-user">${name}</span>
                        <span class="activity-time">${timeStr}</span>
                    </div>
                    <span class="activity-text">${escapeHtml(a.text)}</span>
                </div>
            </div>
        `}).join('');
    });
}

// ===== SECTION TOGGLE =====
function toggleSection(sid) {
    const el = document.querySelector(`[data-section-items="${sid}"]`);
    const tog = document.querySelector(`[data-section="${sid}"] .section-toggle`);
    if (!el) return;
    collapsedSections[sid] = !collapsedSections[sid];
    // Persist collapsed state to survive page reloads
    ss('_collapsedSections', collapsedSections);
    el.classList.toggle('items-hidden', collapsedSections[sid]);
    el.classList.toggle('items-visible', !collapsedSections[sid]);
    tog?.classList.toggle('collapsed', collapsedSections[sid]);
}

// ===== ADD CUSTOM TASK (inline input, no prompt) =====
function showAddInput(sectionId) {
    if (window._isReadOnly || dayOffset < 0) return;
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
    if (window._isReadOnly || dayOffset < 0) return;
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
    if (window._isReadOnly || dayOffset < 0) return;
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
    if (window._isReadOnly || dayOffset < 0) return;
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
            <span class="hidden-panel-toggle ${isDeletedPanelOpen ? '' : 'collapsed'}">▾</span>
        </div>
        <div class="hidden-sections-list ${isDeletedPanelOpen ? '' : 'hidden-list-collapsed'}">
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
    if (window._isReadOnly || dayOffset < 0) return;
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
    if (window._isReadOnly || dayOffset < 0) return;
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
    if (window._isReadOnly || dayOffset < 0) return;
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
    const icons = ['📌', '🎯', '💻', '📖', '🚀', '⚡', '🎨', '🔬', '📊', '🛠️', '🌟', '🌅', '🌙', '⚙️', '🐞', '🔁', '📝', '💡', '🏆', '🔥'];
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
        secs = DEFAULT_SECTIONS.map(s => ({ ...s, items: s.items.map(i => ({ ...i })) }));
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
    if (window._isReadOnly || dayOffset < 0) return;
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
    if (!overlay) return;

    overlay.style.display = 'flex';
    // Small delay to allow display:flex to register before transition
    setTimeout(() => {
        overlay.classList.add('show');
    }, 10);

    const card = overlay.querySelector('.login-card');
    if (card) {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }
}

function hideLogin() {
    const overlay = document.getElementById('loginOverlay');
    if (!overlay) return;

    overlay.classList.remove('show');
    const card = overlay.querySelector('.login-card');
    if (card) {
        card.style.transform = 'translateY(20px)';
        card.style.opacity = '0';
    }

    setTimeout(() => {
        if (!overlay.classList.contains('show')) {
            overlay.style.display = 'none';
        }
    }, 400);
}
function showError(msg) {
    const el = document.getElementById('loginError');
    el.textContent = msg; el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 5000);
}

// updateUserUI is defined at the bottom of the file (near line 1668)

async function loadFromFirebase() {
    const data = await FirebaseApp.loadAll();
    if (!data) return;
    window._isRemoteUpdate = true;
    if (data.checklists) Object.entries(data.checklists).forEach(([k, v]) => ss(`checklist_${k}`, v));
    if (data.notes) Object.entries(data.notes).forEach(([k, v]) => ss(`notes_${k}`, v));
    if (data.customTasks) Object.entries(data.customTasks).forEach(([k, v]) => ss(`custom_${k}`, v));
    if (data.sections) Object.entries(data.sections).forEach(([k, v]) => ss(`sections_${k}`, v));
    if (data.sectionOverrides) ss('_section_overrides', data.sectionOverrides);
    if (data.taskTextOverrides) ss('_task_text_overrides', data.taskTextOverrides);
    if (data.hiddenSections) {
        if (typeof data.hiddenSections === 'object' && !Array.isArray(data.hiddenSections)) {
            Object.entries(data.hiddenSections).forEach(([k, v]) => ss(`_hidden_sections_${k}`, v));
        } else {
            ss('_hidden_sections', data.hiddenSections);
        }
    }
    if (data.meta) {
        Object.entries(data.meta).forEach(([k, v]) => {
            if (['bestStreak', 'totalCompletedDays', 'creationDate'].includes(k)) {
                ss(k, v);
                if (k === 'creationDate') creationDate = v;
            }
            else if (k.startsWith('completed_') || k.startsWith('celebrated_')) ss(k, v);
        });
    }
    // Handle new users: set creationDate if missing
    // Scan existing data to find the earliest date instead of defaulting to today
    if (!creationDate) {
        let earliest = dateKey(0);
        // Check existing checklist/section keys in loaded data
        const dateKeys = [];
        if (data.checklists) Object.keys(data.checklists).forEach(k => dateKeys.push(k));
        if (data.sections) Object.keys(data.sections).forEach(k => dateKeys.push(k));
        // Also scan localStorage for any historical dates
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const match = key.match(/^(?:checklist|sections|notes)_(\d{4}-\d{2}-\d{2})/);
            if (match) dateKeys.push(match[1]);
        }
        if (dateKeys.length > 0) {
            dateKeys.sort();
            earliest = dateKeys[0];
        }
        creationDate = earliest;
        ss('creationDate', creationDate);
        if (!window._isReadOnly && dayOffset >= 0) FirebaseApp.save('meta/creationDate', creationDate);
        console.log('[App] creationDate auto-detected from data:', creationDate);
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

    document.getElementById('friendsHubModal').classList.remove('show');
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

        if (data.checklists) Object.entries(data.checklists).forEach(([k, v]) => ss(`checklist_${k}`, v));
        if (data.notes) Object.entries(data.notes).forEach(([k, v]) => ss(`notes_${k}`, v));
        if (data.customTasks) Object.entries(data.customTasks).forEach(([k, v]) => ss(`custom_${k}`, v));
        if (data.sections) Object.entries(data.sections).forEach(([k, v]) => ss(`sections_${k}`, v));
        if (data.sectionOverrides) ss('_section_overrides', data.sectionOverrides);
        if (data.taskTextOverrides) ss('_task_text_overrides', data.taskTextOverrides);
        if (data.hiddenSections) {
            if (typeof data.hiddenSections === 'object' && !Array.isArray(data.hiddenSections)) {
                Object.entries(data.hiddenSections).forEach(([k, v]) => ss(`_hidden_sections_${k}`, v));
            } else {
                ss('_hidden_sections', data.hiddenSections);
            }
        }
        if (data.meta) {
            Object.entries(data.meta).forEach(([k, v]) => {
                if (['bestStreak', 'totalCompletedDays', 'creationDate'].includes(k)) {
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
            else if (['bestStreak', 'totalCompletedDays'].includes(key) || key.startsWith('completed_') || key.startsWith('celebrated_')) data.meta[key] = v;
        } catch { }
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

// ===== OTP SYSTEM =====
let _otpTimerInterval = null;
let _otpResendInterval = null;
let _pendingOtpEmail = null;
let _pendingOtpPassword = null;
let _otpPurpose = 'register'; // 'register' or 'changepwd'

function startOtpFlow(email, password, purpose) {
    _pendingOtpEmail = email;
    _pendingOtpPassword = password;
    _otpPurpose = purpose || 'register';

    const otp = FirebaseApp.generateOTP();
    FirebaseApp.saveOTP(email, otp);

    // Show OTP modal
    document.getElementById('otpTargetEmail').textContent = email;
    document.getElementById('otpError').textContent = '';
    document.getElementById('otpModal').classList.add('show');

    // Clear OTP inputs
    document.querySelectorAll('.otp-digit').forEach(d => {
        d.value = '';
        d.classList.remove('filled', 'error');
    });
    document.querySelector('.otp-digit[data-otp-index="0"]')?.focus();

    // Start 5-minute countdown
    startOtpCountdown(5 * 60);
    // Start 60s resend cooldown
    startResendCooldown(60);

    // Send OTP via real email (EmailJS) or fallback to console
    sendOTPEmail(email, otp).then(sent => {
        if (sent) {
            FirebaseApp.toast('Đã gửi mã OTP đến email của bạn 📧');
        } else {
            // Fallback: show in toast for demo/testing when EmailJS is not configured
            FirebaseApp.toast(`Mã OTP: ${otp} (Cấu hình EmailJS để gửi email thật)`);
        }
    });
    console.log(`[OTP] Code for ${email}: ${otp}`);
}

function startOtpCountdown(seconds) {
    clearInterval(_otpTimerInterval);
    let remaining = seconds;
    const countdownEl = document.getElementById('otpCountdown');

    const update = () => {
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        countdownEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        if (remaining <= 0) {
            clearInterval(_otpTimerInterval);
            countdownEl.textContent = 'Hết hạn!';
            countdownEl.style.color = 'var(--accent-red)';
        }
        remaining--;
    };
    update();
    _otpTimerInterval = setInterval(update, 1000);
}

function startResendCooldown(seconds) {
    clearInterval(_otpResendInterval);
    const resendBtn = document.getElementById('otpResendBtn');
    const resendTimer = document.getElementById('otpResendTimer');
    let remaining = seconds;
    resendBtn.disabled = true;

    const update = () => {
        resendTimer.textContent = remaining;
        if (remaining <= 0) {
            clearInterval(_otpResendInterval);
            resendBtn.disabled = false;
            resendBtn.innerHTML = 'Gửi lại mã';
        } else {
            resendBtn.innerHTML = `Gửi lại mã (<span id="otpResendTimer">${remaining}</span>s)`;
        }
        remaining--;
    };
    update();
    _otpResendInterval = setInterval(update, 1000);
}

async function verifyOtpAndComplete() {
    const digits = document.querySelectorAll('.otp-digit');
    const code = Array.from(digits).map(d => d.value).join('');
    const errorEl = document.getElementById('otpError');

    if (code.length !== 5) {
        errorEl.textContent = 'Vui lòng nhập đủ 5 số';
        digits.forEach(d => d.classList.add('error'));
        setTimeout(() => digits.forEach(d => d.classList.remove('error')), 500);
        return;
    }

    const result = await FirebaseApp.verifyOTP(_pendingOtpEmail, code);
    if (!result.success) {
        errorEl.textContent = result.error;
        digits.forEach(d => d.classList.add('error'));
        setTimeout(() => digits.forEach(d => d.classList.remove('error')), 500);
        return;
    }

    // OTP verified!
    clearInterval(_otpTimerInterval);
    clearInterval(_otpResendInterval);
    document.getElementById('otpModal').classList.remove('show');
    FirebaseApp.deleteOTP(_pendingOtpEmail);

    if (_otpPurpose === 'register') {
        // Complete registration
        try {
            await FirebaseApp.registerEmail(_pendingOtpEmail, _pendingOtpPassword);
            await uploadLocalToFirebase();
            FirebaseApp.toast('Đăng ký thành công! Chào mừng bạn! 🎉');
        } catch (e) {
            showError(e.code === 'auth/email-already-in-use' ? 'Email đã được sử dụng' : e.message);
        }
    } else if (_otpPurpose === 'changepwd') {
        // Show change password form (already verified via OTP)
        document.getElementById('changePwdMethod').style.display = 'none';
        document.getElementById('changePwdForm').style.display = 'block';
        document.getElementById('currentPwdField').style.display = 'none';
        window._changePwdViaOTP = true;
        document.getElementById('newPwd').focus();
        FirebaseApp.toast('Xác thực OTP thành công ✓');
    } else if (_otpPurpose === 'forgotpwd') {
        // OTP verified for forgot password
        // Since user is not logged in, we can't directly update password.
        // Send Firebase reset email (verified via OTP so user knows to check email).
        try {
            await FirebaseApp.resetPassword(_pendingOtpEmail);
        } catch (e) { console.warn('Reset email send:', e); }

        // Show prominent success message on login screen
        FirebaseApp.toast('✅ Xác thực OTP thành công! Kiểm tra email để đặt mật khẩu mới.');
        const loginError = document.getElementById('loginError');
        if (loginError) {
            loginError.innerHTML = '<div style="color:#69f0ae;font-size:0.85rem;line-height:1.5;padding:8px 0;">' +
                '✅ <strong>Xác thực thành công!</strong><br>' +
                '📧 Link đặt lại mật khẩu đã gửi đến <strong>' + _pendingOtpEmail + '</strong><br>' +
                '⚠️ Kiểm tra <strong>Hộp thư đến</strong> hoặc <strong>Thư rác (Spam)</strong></div>';
            setTimeout(() => { loginError.innerHTML = ''; }, 15000);
        }
        _forgotPwdEmail = null;
        _forgotPwdNewPassword = null;
    }

    _pendingOtpEmail = null;
    _pendingOtpPassword = null;
}

function setupOtpInputHandlers() {
    const inputs = document.querySelectorAll('.otp-digit');
    inputs.forEach((input, i) => {
        input.addEventListener('input', e => {
            const val = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = val;
            if (val) {
                e.target.classList.add('filled');
                e.target.classList.remove('error');
                // Auto-focus next
                if (i < inputs.length - 1) inputs[i + 1].focus();
            } else {
                e.target.classList.remove('filled');
            }
        });
        input.addEventListener('keydown', e => {
            if (e.key === 'Backspace' && !e.target.value && i > 0) {
                inputs[i - 1].focus();
                inputs[i - 1].value = '';
                inputs[i - 1].classList.remove('filled');
            }
            if (e.key === 'Enter') verifyOtpAndComplete();
        });
        // Handle paste - auto-fill all 5 digits
        input.addEventListener('paste', e => {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
            if (paste.length >= 5) {
                inputs.forEach((inp, idx) => {
                    inp.value = paste[idx] || '';
                    inp.classList.toggle('filled', !!paste[idx]);
                });
                inputs[4].focus();
            }
        });
    });
}

// ===== FORGOT PASSWORD (OTP-based) =====
let _forgotPwdEmail = null;
let _forgotPwdNewPassword = null;

async function startForgotPasswordOTP() {
    const email = document.getElementById('forgotPwdEmail').value.trim();
    const newPwd = document.getElementById('forgotNewPwd').value;
    const confirmPwd = document.getElementById('forgotConfirmPwd').value;
    const errorEl = document.getElementById('forgotPwdError');
    const successEl = document.getElementById('forgotPwdSuccess');
    errorEl.textContent = '';
    successEl.textContent = '';

    if (!email) { errorEl.textContent = 'Vui lòng nhập email'; return; }
    if (!email.includes('@')) { errorEl.textContent = 'Email không hợp lệ'; return; }
    if (!newPwd || newPwd.length < 6) { errorEl.textContent = 'Mật khẩu mới phải ít nhất 6 ký tự'; return; }
    if (newPwd !== confirmPwd) { errorEl.textContent = 'Mật khẩu xác nhận không khớp'; return; }

    // Save for after OTP verification
    _forgotPwdEmail = email;
    _forgotPwdNewPassword = newPwd;

    // Close forgot password modal, open OTP modal
    document.getElementById('forgotPwdModal').classList.remove('show');

    // Start OTP flow with purpose 'forgotpwd'
    startOtpFlow(email, newPwd, 'forgotpwd');
}

// ===== CHANGE PASSWORD =====
async function executeChangePassword() {
    const newPwd = document.getElementById('newPwd').value;
    const confirmPwd = document.getElementById('confirmNewPwd').value;
    const errorEl = document.getElementById('changePwdError');
    const successEl = document.getElementById('changePwdSuccess');
    errorEl.textContent = '';
    successEl.textContent = '';

    if (!newPwd || newPwd.length < 6) { errorEl.textContent = 'Mật khẩu mới phải ít nhất 6 ký tự'; return; }
    if (newPwd !== confirmPwd) { errorEl.textContent = 'Mật khẩu xác nhận không khớp'; return; }

    try {
        if (window._changePwdViaOTP) {
            // OTP-verified: just update password directly
            const user = FirebaseApp.auth.currentUser;
            await user.updatePassword(newPwd);
        } else {
            // Re-auth with current password
            const currentPwd = document.getElementById('currentPwd').value;
            if (!currentPwd) { errorEl.textContent = 'Vui lòng nhập mật khẩu hiện tại'; return; }
            await FirebaseApp.changePassword(currentPwd, newPwd);
        }
        successEl.textContent = '✅ Đổi mật khẩu thành công!';
        FirebaseApp.toast('Đổi mật khẩu thành công ✓');
        setTimeout(() => {
            document.getElementById('changePwdModal').classList.remove('show');
            resetChangePwdModal();
        }, 1500);
    } catch (e) {
        if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
            errorEl.textContent = 'Mật khẩu hiện tại không đúng';
        } else if (e.code === 'auth/requires-recent-login') {
            errorEl.textContent = 'Phiên đăng nhập đã cũ. Vui lòng đăng xuất và đăng nhập lại.';
        } else {
            errorEl.textContent = e.message;
        }
    }
}

function updateUserUI(user) {
    const userInfo = document.getElementById('userInfo');
    const loginBtnHeader = document.getElementById('loginBtnHeader');
    if (user) {
        if (userInfo) userInfo.style.display = 'flex';
        if (loginBtnHeader) loginBtnHeader.style.display = 'none';
        document.getElementById('userName').textContent = user.displayName || user.email.split('@')[0];
        document.getElementById('userAvatar').src = user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=random`;
    } else {
        if (userInfo) userInfo.style.display = 'none';
        if (loginBtnHeader) loginBtnHeader.style.display = 'block';
    }
}

function resetChangePwdModal() {
    document.getElementById('changePwdMethod').style.display = '';
    document.getElementById('changePwdForm').style.display = 'none';
    document.getElementById('currentPwd').value = '';
    document.getElementById('newPwd').value = '';
    document.getElementById('confirmNewPwd').value = '';
    document.getElementById('changePwdError').textContent = '';
    document.getElementById('changePwdSuccess').textContent = '';
    document.getElementById('currentPwdField').style.display = '';
    window._changePwdViaOTP = false;
}

let _hasInited = false;
// ===== INIT =====
function init() {
    if (_hasInited) return;
    _hasInited = true;
    console.log('[App] Initializing v3.8.3...');

    // Attach login trigger early
    document.getElementById('loginBtnHeader')?.addEventListener('click', () => {
        console.log('[Auth] loginBtnHeader clicked');
        showLogin();
    });

    // Init EmailJS for OTP emails
    initEmailJS();

    // Check URL import
    if (window.location.hash.startsWith('#data=')) {
        if (importFromURL(window.location.hash)) {
            FirebaseApp.toast('Đã nhập dữ liệu từ link ✓');
            history.replaceState(null, '', window.location.pathname);
        }
    }

    updateDateDisplay();
    autoPurgeSections();
    // Load persisted section collapse state before rendering
    collapsedSections = gs('_collapsedSections', {});
    renderSections();
    updateStreak();
    renderMood();

    // Check for Friend View UID in URL
    const params = new URLSearchParams(window.location.search);
    const targetUidParam = params.get('uid');
    if (targetUidParam) {
        setTimeout(() => viewOtherUser(targetUidParam), 1000);
    }

    // Check for Invite Code in URL (Priority 1)
    const inviteCode = params.get('add');
    if (inviteCode) {
        setTimeout(async () => {
            if (FirebaseApp.user) {
                const targetUid = await FirebaseApp.getUidFromFriendCode(inviteCode.toUpperCase());
                if (!targetUid) return;

                // Self-add check
                if (targetUid === FirebaseApp.user.uid) {
                    FirebaseApp.toast('Bạn không thể kết bạn với chính mình! 😂');
                    history.replaceState(null, '', window.location.pathname);
                    return;
                }

                // Already friends check
                if (_myFriends && _myFriends[targetUid]) {
                    FirebaseApp.toast('Hai bạn đã là bạn của nhau rồi! 🤝');
                    history.replaceState(null, '', window.location.pathname);
                    return;
                }

                // Show Popup
                const profile = await FirebaseApp.getPublicProfile(targetUid);
                if (profile) {
                    document.getElementById('inviteUserName').textContent = profile.name || 'Người dùng';
                    document.getElementById('inviteUserAvatar').src = profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}&background=random`;
                    document.getElementById('invitePopupModal').classList.add('show');

                    document.getElementById('inviteAcceptBtn').onclick = async () => {
                        await FirebaseApp.sendFriendRequest(targetUid);
                        FirebaseApp.toast('✅ Đã gửi lời mời kết bạn!');
                        document.getElementById('invitePopupModal').classList.remove('show');
                        history.replaceState(null, '', window.location.pathname);
                    };

                    document.getElementById('inviteRejectBtn').onclick = () => {
                        document.getElementById('invitePopupModal').classList.remove('show');
                        history.replaceState(null, '', window.location.pathname);
                    };
                }
            }
        }, 2000);
    }

    // Notification & Social Hub Toggle
    const socialBtn = document.getElementById('socialBtn');
    const notifDropdown = document.getElementById('notificationDropdown');
    
    socialBtn?.addEventListener('click', (e) => {
        if (!FirebaseApp.user) {
            FirebaseApp.toast('Vui lòng đăng nhập để sử dụng chức năng này');
            showLogin();
            return;
        }

        if (e.target.closest('.notification-dropdown')) return;
        
        const unreadNotifs = _notifications.filter(n => !n.read).length;
        const requestsCount = _friendRequests ? Object.keys(_friendRequests).length : 0;
        const totalAlerts = unreadNotifs + requestsCount;

        // If clicking while dropdown is open, close it and open Friends Hub
        if (notifDropdown?.classList.contains('show')) {
            notifDropdown.classList.remove('show');
            initFriendsSystem();
            document.getElementById('friendsHubModal').classList.add('show');
        } else {
            // Show dropdown if there are alerts, otherwise open Hub directly
            if (totalAlerts > 0) {
                notifDropdown?.classList.add('show');
            } else {
                initFriendsSystem();
                document.getElementById('friendsHubModal').classList.add('show');
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (!socialBtn?.contains(e.target)) {
            notifDropdown?.classList.remove('show');
        }
    });

    // Mark all as read handler
    document.getElementById('markAllRead')?.addEventListener('click', (e) => {
        e.stopPropagation();
        _notifications.forEach(n => n.read = true);
        renderNotifications();
        
        // Update badge
        const requestsCount = _friendRequests ? Object.keys(_friendRequests).length : 0;
        const badge = document.getElementById('friendRequestBadge');
        if (badge) {
            badge.textContent = requestsCount;
            badge.style.display = requestsCount > 0 ? 'flex' : 'none';
        }
        
        FirebaseApp.toast('Đã đánh dấu tất cả là đã đọc ✓');
    });


    document.getElementById('motivationQuote').textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];

    // === Firebase Auth Flow ===
    const appContainer = document.querySelector('.app-container');
    let _authHandled = false;

    // Create a beautiful premium loader
    const authLoader = document.createElement('div');
    authLoader.id = 'authLoader';
    authLoader.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:24px;animation: fadeIn 0.5s ease;">
            <div class="loader-spinner" style="width:60px;height:60px;border:4px solid rgba(59,130,246,0.1);border-radius:50%;border-top-color:var(--accent-blue);animation:spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite;"></div>
            <p style="color:rgba(255,255,255,0.5);font-size:0.95rem;font-weight:500;letter-spacing:0.5px;margin:0;">Đang bảo mật kết nối...</p>
        </div>`;
    authLoader.style.cssText = `
        position:fixed;inset:0;background:#0a0f1d;
        display:flex;align-items:center;justify-content:center;
        z-index:30000;transition:opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);`;
    document.body.appendChild(authLoader);

    function removeLoader() {
        if (!authLoader) return;
        authLoader.style.opacity = '0';
        authLoader.style.pointerEvents = 'none';
        setTimeout(() => { if (authLoader.parentNode) authLoader.remove(); }, 600);
    }

    function updateUserUI(user) {

        const loginBtn = document.getElementById('loginBtnHeader');
        const userInfo = document.getElementById('userInfo');
        const avatar = document.getElementById('userAvatar');
        const name = document.getElementById('userName');

        if (user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (userInfo) userInfo.style.display = 'flex';
            if (avatar) avatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=random`;
            if (name) name.textContent = user.displayName || user.email.split('@')[0];
        } else {
            if (loginBtn) loginBtn.style.display = 'block';
            if (userInfo) userInfo.style.display = 'none';
        }
    }

    FirebaseApp.onAuthChanged = async (user) => {
        updateUserUI(user);

        if (user) {
            // User is authenticated
            document.body.classList.remove('not-logged-in');
            if (appContainer) appContainer.style.display = '';
            removeLoader();
            hideLogin();

            // Only load if it's the first time or user changed
            if (!_authHandled) {
                _authHandled = true;
                await loadFromFirebase();
                setupRealtimeSync();
                FirebaseApp.setupPresence();
                initSocialFeatures();
                initFriendsSystem();
                FirebaseApp.toast(`Chào mừng trở lại, ${user.displayName || user.email.split('@')[0]}! 👋`);
            }
        } else {
            // Not authenticated — enforce login
            _authHandled = false;
            document.body.classList.add('not-logged-in');
            if (appContainer) appContainer.style.display = 'none';
            removeLoader();
            showLogin();
        }
    };

    if (FirebaseApp.hasConfig()) {
        FirebaseApp.init();
    } else {
        removeLoader();
        if (appContainer) appContainer.style.display = '';
    }

    // === Magic Keyword Auth Flow ===
    async function startMagicLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const errorEl = document.getElementById('loginError');
        if (!email || !email.includes('@')) { errorEl.textContent = 'Vui lòng nhập email hợp lệ'; return; }

        errorEl.textContent = '';
        currentMagicEmail = email;

        // Pick 3 random words
        const shuffled = [...AUTH_KEYWORDS].sort(() => 0.5 - Math.random());
        currentMagicWords = shuffled.slice(0, 3);

        FirebaseApp.toast('Đang gửi từ khóa đến email...');

        // Send email via EmailJS (reusing the OTP template)
        const ok = await sendOTPEmail(email, currentMagicWords.join(' - '));

        if (ok || !isEmailJSConfigured()) {
            if (!isEmailJSConfigured()) {
                console.log('Keywords:', currentMagicWords);
                FirebaseApp.toast(`[DEBUG] Từ khóa: ${currentMagicWords.join(', ')}`, 10000);
            }
            document.getElementById('emailStep').style.display = 'none';
            document.getElementById('keywordStep').style.display = 'block';
        } else {
            errorEl.textContent = 'Lỗi gửi email. Vui lòng kiểm tra cấu hình EmailJS.';
        }
    }

    async function verifyMagicLogin() {
        const kw1 = document.getElementById('kw1').value.trim();
        const kw2 = document.getElementById('kw2').value.trim();
        const kw3 = document.getElementById('kw3').value.trim();
        const errorEl = document.getElementById('keywordError');

        if (!kw1 || !kw2 || !kw3) { errorEl.textContent = 'Vui lòng nhập đủ 3 từ khóa'; return; }

        const inputs = [kw1, kw2, kw3].map(s => s.toLowerCase());
        const expected = currentMagicWords.map(s => s.toLowerCase());

        const isMatch = inputs.every((v, i) => v === expected[i]);

        if (!isMatch) { errorEl.textContent = 'Từ khóa không chính xác. Vui lòng kiểm tra lại.'; return; }

        // Secret reproducible password
        const secretPwd = `Checklist_${currentMagicEmail.split('@')[0]}_2026!`;

        try {
            FirebaseApp.toast('Đang xác thực...');
            try {
                await FirebaseApp.loginEmail(currentMagicEmail, secretPwd);
            } catch (e) {
                if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
                    // Try to register
                    await FirebaseApp.registerEmail(currentMagicEmail, secretPwd);
                } else { throw e; }
            }
            FirebaseApp.toast('Đăng nhập thành công ✓');
        } catch (e) {
            errorEl.textContent = e.message;
        }
    }

    // === Login buttons ===
    document.getElementById('loginBtnHeader')?.addEventListener('click', showLogin);
    document.getElementById('sendKeywordsBtn')?.addEventListener('click', startMagicLogin);
    document.getElementById('verifyKeywordsBtn')?.addEventListener('click', verifyMagicLogin);
    document.getElementById('backToEmailBtn')?.addEventListener('click', () => {
        document.getElementById('emailStep').style.display = 'block';
        document.getElementById('keywordStep').style.display = 'none';
    });

    document.getElementById('googleLoginBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        const btn = document.getElementById('googleLoginBtn');
        if (btn) { btn.disabled = true; btn.textContent = 'Đang kết nối...'; }
        
        // Make sure Firebase is inited synchronously
        if (!FirebaseApp.auth) FirebaseApp.init();
        
        FirebaseApp.loginGoogle()
            .then(() => {
                FirebaseApp.toast('Đăng nhập thành công ✓');
            })
            .catch(err => {
                console.error('[Google Login]', err);
                const errEl = document.getElementById('loginError');
                if (errEl) errEl.textContent = err.code === 'auth/popup-closed-by-user'
                    ? 'Đã đóng popup. Hãy thử lại.'
                    : (err.message || 'Đăng nhập thất bại');
            })
            .finally(() => {
                if (btn) { btn.disabled = false; btn.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt=""> Tiếp tục với Google'; }
            });
    });
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        // Prevent double click/spam
        const btn = document.getElementById('logoutBtn');
        const dropBtn = document.getElementById('dropdownLogout');
        if (btn) btn.disabled = true;
        if (dropBtn) dropBtn.disabled = true;

        // Show elegant glassmorphism logout loader
        const logoutLoader = document.createElement('div');
        logoutLoader.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:24px;animation: fadeIn 0.4s ease;">
                <div class="loader-spinner" style="width:50px;height:50px;border:4px solid rgba(239,68,68,0.1);border-radius:50%;border-top-color:#ef4444;animation:spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite;"></div>
                <p style="color:rgba(255,255,255,0.7);font-size:0.95rem;font-weight:600;letter-spacing:0.5px;margin:0;">Đang đăng xuất an toàn...</p>
            </div>`;
        logoutLoader.style.cssText = `
            position:fixed;inset:0;background:rgba(10, 15, 29, 0.95);
            backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
            display:flex;align-items:center;justify-content:center;
            z-index:999999;transition:opacity 0.4s ease;`;
        document.body.appendChild(logoutLoader);

        try {
            await FirebaseApp.logout();
            localStorage.clear();
            sessionStorage.clear();
            document.body.classList.add('not-logged-in');
            document.getElementById('userDropdown')?.classList.remove('show');
            setTimeout(() => {
                logoutLoader.style.opacity = '0';
                setTimeout(() => {
                    if (logoutLoader.parentNode) logoutLoader.remove();
                    FirebaseApp.toast('Đã đăng xuất & xóa bộ nhớ đệm thành công ✓');
                    showLogin();
                }, 400);
            }, 800);
        } catch (err) {
            console.error('Lỗi khi đăng xuất:', err);
            logoutLoader.remove();
            if (btn) btn.disabled = false;
            if (dropBtn) dropBtn.disabled = false;
            FirebaseApp.toast('Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại!');
        }
    });

    // Toggle Profile Dropdown Menu (2026 Premium style with Mobile Double-firing protection)
    const userInfoEl = document.getElementById('userInfo');
    const userDropdownEl = document.getElementById('userDropdown');
    const dropdownUserEmail = document.getElementById('dropdownUserEmail');

    if (userInfoEl && userDropdownEl) {
        let touchToggled = false;

        const toggleDropdown = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            const isOpen = userDropdownEl.classList.contains('show');
            if (isOpen) {
                userDropdownEl.classList.remove('show');
            } else {
                userDropdownEl.classList.add('show');
                if (FirebaseApp.user && dropdownUserEmail) {
                    dropdownUserEmail.textContent = FirebaseApp.user.email;
                }
            }
        };

        // Tap/Touch handler for mobile touch devices
        userInfoEl.addEventListener('touchstart', (e) => {
            touchToggled = true;
            toggleDropdown(e);
            setTimeout(() => { touchToggled = false; }, 350);
        }, { passive: false });

        // Click handler for desktop and mouse devices
        userInfoEl.addEventListener('click', (e) => {
            if (touchToggled) return; // Prevent double-triggering on touch devices
            toggleDropdown(e);
        });

        // Close dropdown when clicking or touching outside
        const closeDropdownOutside = (e) => {
            if (!userInfoEl.contains(e.target) && !userDropdownEl.contains(e.target)) {
                userDropdownEl.classList.remove('show');
            }
        };
        document.addEventListener('click', closeDropdownOutside);
        document.addEventListener('touchstart', closeDropdownOutside, { passive: true });
    }

    // Bind dropdown action buttons programmatically to existing flows
    document.getElementById('dropdownChangePwd')?.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdownEl?.classList.remove('show');
        document.getElementById('changePwdBtn')?.click();
    });

    document.getElementById('dropdownLogout')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('logoutBtn')?.click();
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
    document.getElementById('nextDay').addEventListener('click', () => { 
        dayOffset++; 
        animateDateChange(); 
    });

    document.getElementById('resetBtn').addEventListener('click', (e) => {
        if (window._isReadOnly || dayOffset < 0) return;
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

    document.getElementById('celebrationCloseBtn').addEventListener('click', () => {
        const overlay = document.getElementById('celebrationOverlay');
        overlay.classList.remove('show');
        overlay.style.display = 'none';
    });
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
    document.getElementById('useTemplateBtnModal')?.addEventListener('click', () => {
        if (confirm('Bạn có muốn áp dụng bộ nhóm mẫu mặc định cho ngày hôm nay không? (Dữ liệu hiện tại sẽ được giữ nguyên, chỉ thêm các nhóm mới)')) {
            const defaults = JSON.parse(JSON.stringify(DEFAULT_SECTIONS));
            const current = getDaySections();
            // Merge or replace? User says "when user needs sample, they click".
            // I'll replace for simplicity as it's a "template" action.
            saveDaySections(defaults);
            renderSections();
            document.getElementById('copyGroupsModal').classList.remove('show');
            FirebaseApp.toast('Đã áp dụng nhóm mẫu ✓');
        }
    });

    document.getElementById('copyGroupsClose')?.addEventListener('click', () => document.getElementById('copyGroupsModal').classList.remove('show'));
    document.getElementById('copyGroupsModal')?.addEventListener('click', e => {
        if (e.target.id === 'copyGroupsModal') e.target.classList.remove('show');
        const opt = e.target.closest('.copy-day-option');
        if (opt) copyGroupsFrom(opt.dataset.copySource);
    });

    // === Forgot Password ===
    document.getElementById('forgotPwdLink')?.addEventListener('click', () => {
        document.getElementById('forgotPwdEmail').value = document.getElementById('loginEmail').value || '';
        document.getElementById('forgotNewPwd').value = '';
        document.getElementById('forgotConfirmPwd').value = '';
        document.getElementById('forgotPwdError').textContent = '';
        document.getElementById('forgotPwdSuccess').textContent = '';
        document.getElementById('forgotPwdModal').classList.add('show');
    });
    document.getElementById('forgotPwdClose')?.addEventListener('click', () => document.getElementById('forgotPwdModal').classList.remove('show'));
    document.getElementById('forgotPwdModal')?.addEventListener('click', e => { if (e.target.id === 'forgotPwdModal') e.target.classList.remove('show'); });
    document.getElementById('forgotPwdSend')?.addEventListener('click', startForgotPasswordOTP);
    document.getElementById('forgotPwdEmail')?.addEventListener('keydown', e => { if (e.key === 'Enter') startForgotPasswordOTP(); });

    // === OTP Verification ===
    setupOtpInputHandlers();
    document.getElementById('otpVerifyBtn')?.addEventListener('click', verifyOtpAndComplete);
    document.getElementById('otpResendBtn')?.addEventListener('click', () => {
        if (_pendingOtpEmail) {
            const otp = FirebaseApp.generateOTP();
            FirebaseApp.saveOTP(_pendingOtpEmail, otp);
            startOtpCountdown(5 * 60);
            startResendCooldown(60);
            document.querySelectorAll('.otp-digit').forEach(d => { d.value = ''; d.classList.remove('filled', 'error'); });
            document.querySelector('.otp-digit[data-otp-index="0"]')?.focus();
            document.getElementById('otpError').textContent = '';
            sendOTPEmail(_pendingOtpEmail, otp).then(sent => {
                if (sent) {
                    FirebaseApp.toast('Đã gửi lại mã OTP mới 📧');
                } else {
                    FirebaseApp.toast(`Mã OTP mới: ${otp} (Cấu hình EmailJS để gửi email thật)`);
                }
            });
            console.log(`[OTP] New code for ${_pendingOtpEmail}: ${otp}`);
        }
    });
    // Prevent closing OTP modal by clicking overlay (force user to verify or cancel)
    document.getElementById('otpModal')?.addEventListener('click', e => {
        if (e.target.id === 'otpModal') {
            // Allow closing for now - user can re-register
            e.target.classList.remove('show');
            clearInterval(_otpTimerInterval);
            clearInterval(_otpResendInterval);
        }
    });

    // === Change Password ===
    document.getElementById('changePwdBtn')?.addEventListener('click', () => {
        resetChangePwdModal();
        const user = FirebaseApp.auth?.currentUser;
        // Hide OTP method for Google-only users (no password)
        const hasPassword = user?.providerData?.some(p => p.providerId === 'password');
        document.getElementById('methodCurrentPwd').style.display = hasPassword ? '' : 'none';
        document.getElementById('changePwdModal').classList.add('show');
    });
    document.getElementById('changePwdClose')?.addEventListener('click', () => {
        document.getElementById('changePwdModal').classList.remove('show');
        resetChangePwdModal();
    });
    document.getElementById('changePwdModal')?.addEventListener('click', e => {
        if (e.target.id === 'changePwdModal') { e.target.classList.remove('show'); resetChangePwdModal(); }
    });
    document.getElementById('methodEmail')?.addEventListener('click', () => {
        const user = FirebaseApp.auth?.currentUser;
        if (user?.email) {
            startOtpFlow(user.email, null, 'changepwd');
        }
    });
    document.getElementById('methodCurrentPwd')?.addEventListener('click', () => {
        document.getElementById('changePwdMethod').style.display = 'none';
        document.getElementById('changePwdForm').style.display = 'block';
        document.getElementById('currentPwdField').style.display = '';
        window._changePwdViaOTP = false;
        document.getElementById('currentPwd').focus();
    });
    document.getElementById('changePwdSave')?.addEventListener('click', executeChangePassword);
    document.getElementById('confirmNewPwd')?.addEventListener('keydown', e => { if (e.key === 'Enter') executeChangePassword(); });

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
            document.getElementById('forgotPwdModal')?.classList.remove('show');
            document.getElementById('changePwdModal')?.classList.remove('show');
            // Don't auto-close OTP modal on Escape
        }
    });


    document.getElementById('friendsHubClose')?.addEventListener('click', () => document.getElementById('friendsHubModal').classList.remove('show'));
    document.getElementById('friendProfileClose')?.addEventListener('click', () => document.getElementById('friendProfileModal').classList.remove('show'));

    document.getElementById('copyMyCodeBtn')?.addEventListener('click', () => {
        if (!_myFriendCode || _myFriendCode === '...') return;
        navigator.clipboard.writeText(_myFriendCode).then(() => {
            FirebaseApp.toast('Đã copy mã của bạn! 📋');
            const btn = document.getElementById('copyMyCodeBtn');
            if (btn) {
                const oldHtml = btn.innerHTML;
                btn.innerHTML = '✅';
                setTimeout(() => { btn.innerHTML = oldHtml; }, 2000);
            }
        });
    });

    // Add Copy Link Invite
    const inviteLinkBtn = document.createElement('button');
    inviteLinkBtn.className = 'copy-small-btn';
    inviteLinkBtn.innerHTML = '🔗 Link';
    inviteLinkBtn.title = 'Copy link mời kết bạn';
    document.querySelector('.my-friend-code').appendChild(inviteLinkBtn);
    inviteLinkBtn.onclick = () => {
        if (!_myFriendCode || _myFriendCode === '...') return;
        const url = `${window.location.origin}${window.location.pathname}?add=${_myFriendCode}`;
        navigator.clipboard.writeText(url).then(() => {
            FirebaseApp.toast('Đã copy link mời kết bạn! 🔗');
            const oldHtml = inviteLinkBtn.innerHTML;
            inviteLinkBtn.innerHTML = '✅ OK';
            setTimeout(() => { inviteLinkBtn.innerHTML = oldHtml; }, 2000);
        });
    };

    document.getElementById('sendRequestBtn')?.addEventListener('click', async () => {
        const code = document.getElementById('friendCodeInput').value.trim().toUpperCase();
        if (code.length !== 6) { FirebaseApp.toast('Mã bạn bè phải gồm 6 ký tự'); return; }

        const targetUid = await FirebaseApp.getUidFromFriendCode(code);
        if (!targetUid) { FirebaseApp.toast('Không tìm thấy người dùng với mã này'); return; }
        if (targetUid === FirebaseApp.user.uid) { FirebaseApp.toast('Bạn không thể kết bạn với chính mình'); return; }
        if (_myFriends[targetUid]) { FirebaseApp.toast('Người này đã là bạn của bạn rồi'); return; }

        const btn = document.getElementById('sendRequestBtn');
        const oldHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '⏳ Đang chờ';

        try {
            await FirebaseApp.sendFriendRequest(targetUid);
            FirebaseApp.toast('✅ Đã gửi lời mời kết bạn');
            document.getElementById('friendCodeInput').value = '';
        } catch (e) {
            FirebaseApp.toast('Lỗi khi gửi lời mời');
            btn.disabled = false;
            btn.innerHTML = oldHtml;
        }
    });

    // Hub Tab Switching
    document.querySelectorAll('.hub-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.hub-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.hub-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');

            if (tab.dataset.tab === 'activityFeed') updateFriendsFeed();
            if (tab.dataset.tab === 'leaderboard') updateLeaderboard();
        });
    });

    document.getElementById('viewBackBtn')?.addEventListener('click', exitReadOnly);

    document.getElementById('moodOptions')?.addEventListener('click', e => {
        if (window._isReadOnly || dayOffset < 0) return;
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
    if (window._isReadOnly || dayOffset < 0) return;
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

        // Level Up Logic (consistent with updateStreak: lvl = floor(xp / 500) + 1)
        const oldLevel = Math.floor(curXP / 500) + 1;
        const newLevel = Math.floor(newXP / 500) + 1;
        if (newLevel > oldLevel) {
            addNotification({
                id: `lvl_${newLevel}`,
                icon: '⭐',
                text: `<b>Cấp độ mới!</b> Bạn đã đạt Level ${newLevel} 🏆`,
                time: Date.now()
            });
            FirebaseApp.toast(`🎉 Chúc mừng! Bạn đã lên cấp ${newLevel}!`);
        }

        updateStreak(); // Update Level display

        // Sync progress to public profile
        if (FirebaseApp.user) {
            const cl = getChecklist(), all = getAllItems();
            const total = all.length, done = all.filter(i => cl[i.id]).length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            FirebaseApp.updatePublicProfile({ todayProgress: pct });
        }
    } catch (e) { console.error('XP Error:', e); }
}

function addNotification(notif) {
    if (_notifications.some(n => n.id === notif.id)) return;
    _notifications.unshift({ ...notif, read: false, time: notif.time || Date.now() });
    if (_notifications.length > 20) _notifications.pop();
    renderNotifications();
}

function renderNotifications() {
    const list = document.getElementById('notificationList');
    if (!list) return;

    if (_notifications.length === 0) {
        list.innerHTML = '<div class="notif-empty">Không có thông báo mới</div>';
        return;
    }

    list.innerHTML = _notifications.map(n => `
        <div class="notif-item ${n.read ? '' : 'unread'}" onclick="handleNotifClick('${n.id}')">
            <div class="notif-icon">${n.icon}</div>
            <div class="notif-content">
                <div class="notif-text">${n.text}</div>
                <div class="notif-time">${formatTimeAgo(n.time)}</div>
            </div>
        </div>
    `).join('');
}

function handleNotifClick(id) {
    const notif = _notifications.find(n => n.id === id);
    if (notif) {
        notif.read = true;
        renderNotifications();
        
        // Update badge
        const requestsCount = _friendRequests ? Object.keys(_friendRequests).length : 0;
        const unreadNotifs = _notifications.filter(n => !n.read).length;
        const totalAlerts = requestsCount + unreadNotifs;
        const badge = document.getElementById('friendRequestBadge');
        if (badge) {
            badge.textContent = totalAlerts;
            badge.style.display = totalAlerts > 0 ? 'flex' : 'none';
        }

        if (id.startsWith('req_')) {
            initFriendsSystem();
            document.getElementById('friendsHubModal').classList.add('show');
            // Switch to requests tab
            const tab = document.querySelector('.hub-tab[data-tab="requests"]');
            if (tab) tab.click();
        }
    }
}

function formatTimeAgo(ms) {
    const sec = Math.floor((Date.now() - ms) / 1000);
    if (sec < 60) return 'Vừa xong';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} phút trước`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} giờ trước`;
    return `${Math.floor(hr / 24)} ngày trước`;
}

function triggerConfetti() {
    for (let i = 0; i < 50; i++) {
        const c = document.createElement('div');
        c.className = 'confetti-piece';
        c.style.left = Math.random() * 100 + 'vw';
        c.style.backgroundColor = ['#0ea5e9', '#22d3ee', '#8b5cf6', '#facc15', '#f472b6'][Math.floor(Math.random() * 5)];
        c.style.animationDelay = Math.random() * 3 + 's';
        c.style.transform = `rotate(${Math.random() * 360}deg)`;
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 4000);
    }
}

document.addEventListener('DOMContentLoaded', init);
