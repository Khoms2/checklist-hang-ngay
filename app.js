// ===== DATA =====
const DEFAULT_SECTIONS = [
    { id: 'morning', icon: '🌅', title: 'BAN NGÀY – CHẠY Shopee', theme: 'section-morning', subtitle: 'Hoàn thành mục tiêu chạy đơn',
      items: [{ id: 'm1', text: 'Hoàn thành ca chạy / mục tiêu đơn' }, { id: 'm2', text: 'Tận dụng thời gian chờ (5–15p) đọc lại kiến thức Tester' }, { id: 'm3', text: 'Xem lại test case / bug cũ' }] },
    { id: 'evening', icon: '🌙', title: 'BUỔI TỐI – HỌC TESTER', theme: 'section-evening', subtitle: 'QUAN TRỌNG – Kiến thức nền tảng',
      items: [{ id: 'e1', text: 'Học 1 kiến thức (Test Case / API / Bug)' }, { id: 'e2', text: 'Ghi note lại bằng lời của mình' }] },
    { id: 'practice', icon: '⚙️', title: 'THỰC HÀNH', theme: 'section-practice', subtitle: 'PHẦN QUYẾT ĐỊNH – Luyện tập thực tế',
      items: [{ id: 'p1', text: 'Viết 5–10 test case' }, { id: 'p2', text: 'Test web (OrangeHRM hoặc web khác)' }, { id: 'p3', text: 'Test API bằng Postman' }, { id: 'p4', text: 'Ghi lại kết quả test' }] },
    { id: 'bug', icon: '🐞', title: 'BUG – TƯ DUY TESTER', theme: 'section-bug', subtitle: 'Rèn luyện tư duy phát hiện lỗi',
      items: [{ id: 'b1', text: 'Tìm ít nhất 2 bug' }, { id: 'b2', text: 'Viết bug report (Title, Step, Expected, Actual)' }] },
    { id: 'review', icon: '🔁', title: 'ÔN LẠI – CHỐNG QUÊN', theme: 'section-review', subtitle: 'Củng cố kiến thức mỗi ngày',
      items: [{ id: 'r1', text: 'Đọc lại toàn bộ đã làm' }, { id: 'r2', text: 'Viết tóm tắt 5–10 dòng' }] },
    { id: 'log', icon: '📊', title: 'LOG CV – GIÚP XIN VIỆC', theme: 'section-log', subtitle: 'Tích lũy thành tích cho CV',
      items: [{ id: 'l1', text: 'Ghi lại hôm nay học gì' }, { id: 'l2', text: 'Ghi lại đã làm gì (test case / bug / API)' }] }
];

const QUOTES = [
    '"Mỗi ngày đều là cơ hội để trở nên giỏi hơn!" 💪', '"Kiên trì mỗi ngày, thành công sẽ đến!" 🚀',
    '"Không có đường tắt – chỉ có nỗ lực thật sự!" 🔥', '"Hôm nay khó, ngày mai sẽ dễ hơn!" ⭐',
    '"Tester giỏi = quan sát kỹ + tư duy logic!" 🧠', '"Bug là bạn, không phải kẻ thù!" 🐞',
    '"1% tiến bộ mỗi ngày = 37x sau 1 năm!" 📈', '"Đừng so sánh với người khác, hãy so với mình ngày hôm qua!" 🌟'
];

// ===== STATE =====
// Use dayOffset (integer) to avoid ALL timezone bugs: 0=today, -1=yesterday, +1=tomorrow
let dayOffset = 0;
let collapsedSections = {};

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
function saveChecklist(d) { ss(`checklist_${dateKey()}`, d); }
function getNotes() { return gs(`notes_${dateKey()}`, {}); }
function saveNotesData(d) { ss(`notes_${dateKey()}`, d); }
function getCustomTasks(sid) { return gs(`custom_${sid}`, []); }
function saveCustomTasks(sid, t) { ss(`custom_${sid}`, t); }

function getSectionItems(section) { return [...section.items, ...getCustomTasks(section.id)]; }
function getAllItems() { return DEFAULT_SECTIONS.flatMap(s => getSectionItems(s)); }

function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

// ===== RENDER =====
function renderSections() {
    const main = document.getElementById('checklistMain');
    const cl = getChecklist(), notes = getNotes();
    main.innerHTML = '';

    DEFAULT_SECTIONS.forEach((section, i) => {
        const items = getSectionItems(section);
        const done = items.filter(x => cl[x.id]).length;
        const total = items.length;
        const isCollapsed = collapsedSections[section.id] || false;

        const el = document.createElement('div');
        el.className = `checklist-section ${section.theme}`;
        el.style.animationDelay = `${i * 0.05}s`;
        el.dataset.sectionId = section.id;

        el.innerHTML = `
            <div class="section-header" data-section="${section.id}">
                <div class="section-title-group">
                    <span class="section-icon">${section.icon}</span>
                    <div><div class="section-title">${section.title}</div><div class="section-subtitle">${section.subtitle}</div></div>
                </div>
                <div class="section-meta">
                    <span class="section-progress-badge ${done===total&&total>0?'complete':''}">${done}/${total}</span>
                    <span class="section-toggle ${isCollapsed?'collapsed':''}">▾</span>
                </div>
            </div>
            <div class="section-items ${isCollapsed?'items-hidden':'items-visible'}" data-section-items="${section.id}">
                ${items.map(item => {
                    const checked = cl[item.id] || false;
                    const hasNote = notes[item.id] && notes[item.id].trim();
                    return `<div class="checklist-item ${checked?'checked':''}" data-item="${item.id}">
                        <div class="custom-checkbox ${checked?'checked':''}" data-item="${item.id}"></div>
                        <span class="item-text">${escapeHtml(item.text)}</span>
                        <button class="item-note-btn ${hasNote?'has-note':''}" data-note="${item.id}" title="Ghi chú">📝</button>
                        ${item.custom ? `<button class="item-delete-btn" data-delete="${item.id}" data-delete-section="${item.sectionId}" title="Xóa">✕</button>` : ''}
                    </div>`;
                }).join('')}
                <div class="add-task-row">
                    <div class="add-task-input-wrap" data-add-section="${section.id}" style="display:none">
                        <input type="text" class="add-task-input" placeholder="Nhập nhiệm vụ mới..." data-input-section="${section.id}">
                        <button class="add-task-confirm" data-confirm-section="${section.id}">✓</button>
                        <button class="add-task-cancel" data-cancel-section="${section.id}">✕</button>
                    </div>
                    <button class="add-task-btn" data-show-input="${section.id}">＋ Thêm nhiệm vụ</button>
                </div>
            </div>`;
        main.appendChild(el);
    });
    updateProgress();
}

// ===== SURGICAL TOGGLE (no re-render) =====
function toggleItem(itemId) {
    const cl = getChecklist();
    cl[itemId] = !cl[itemId];
    saveChecklist(cl);

    const itemEl = document.querySelector(`.checklist-item[data-item="${itemId}"]`);
    const cbEl = itemEl?.querySelector('.custom-checkbox');
    if (!itemEl || !cbEl) return;

    if (cl[itemId]) {
        cbEl.classList.add('checked', 'just-checked');
        itemEl.classList.add('checked');
        setTimeout(() => cbEl.classList.remove('just-checked'), 350);
    } else {
        cbEl.classList.remove('checked', 'just-checked');
        itemEl.classList.remove('checked');
    }

    // Update section badge
    for (const s of DEFAULT_SECTIONS) {
        const items = getSectionItems(s);
        if (items.some(x => x.id === itemId)) {
            const done = items.filter(x => cl[x.id]).length;
            const badge = document.querySelector(`[data-section-id="${s.id}"] .section-progress-badge`);
            if (badge) { badge.textContent = `${done}/${items.length}`; badge.classList.toggle('complete', done === items.length); }
            break;
        }
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

    if (pct === 100 && done > 0) {
        const k = `celebrated_${dateKey()}`;
        if (!gs(k, false)) { ss(k, true); document.getElementById('celebrationOverlay').classList.add('show'); }
    }
}

// ===== DATE DISPLAY =====
function updateDateDisplay() {
    const label = document.getElementById('dateLabel');
    const value = document.getElementById('dateValue');
    if (dayOffset === 0) label.textContent = 'Hôm nay';
    else if (dayOffset === -1) label.textContent = 'Hôm qua';
    else if (dayOffset === 1) label.textContent = 'Ngày mai';
    else label.textContent = dayOffset > 0 ? `+${dayOffset} ngày` : `${dayOffset} ngày`;
    value.textContent = formatDate();
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
    const best = Math.max(gs('bestStreak', 0), streak);
    ss('bestStreak', best);
    document.getElementById('bestStreak').textContent = best;
    let totalDays = gs('totalCompletedDays', 0);
    const tk = `completed_${dateKey(0)}`;
    if (todayDone && !gs(tk, false)) { totalDays++; ss('totalCompletedDays', totalDays); ss(tk, true); }
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
    const input = document.querySelector(`.add-task-input[data-input-section="${sectionId}"]`);
    const text = input?.value?.trim();
    if (!text) { hideAddInput(sectionId); return; }
    const custom = getCustomTasks(sectionId);
    custom.push({ id: `${sectionId}_c${Date.now()}`, text, custom: true, sectionId });
    saveCustomTasks(sectionId, custom);
    renderSections();
}

function deleteCustomTask(itemId, sectionId) {
    // Animate removal
    const itemEl = document.querySelector(`.checklist-item[data-item="${itemId}"]`);
    if (itemEl) {
        itemEl.style.transition = 'all 0.3s ease';
        itemEl.style.opacity = '0';
        itemEl.style.transform = 'translateX(40px)';
        itemEl.style.maxHeight = itemEl.offsetHeight + 'px';
        setTimeout(() => {
            itemEl.style.maxHeight = '0';
            itemEl.style.padding = '0';
            itemEl.style.margin = '0';
        }, 150);
        setTimeout(() => {
            const custom = getCustomTasks(sectionId).filter(t => t.id !== itemId);
            saveCustomTasks(sectionId, custom);
            const cl = getChecklist(); delete cl[itemId]; saveChecklist(cl);
            const notes = getNotes(); delete notes[itemId]; saveNotesData(notes);
            renderSections();
        }, 400);
    }
}

// ===== NOTES =====
let activeNoteItem = null;
function openNote(itemId) {
    activeNoteItem = itemId;
    const notes = getNotes(), item = getAllItems().find(i => i.id === itemId);
    document.getElementById('notesTitle').textContent = `📝 ${item ? item.text : 'Ghi chú'}`;
    document.getElementById('notesTextarea').value = notes[itemId] || '';
    document.getElementById('notesModal').classList.add('show');
    setTimeout(() => document.getElementById('notesTextarea').focus(), 100);
}
function saveNote() {
    if (!activeNoteItem) return;
    const notes = getNotes();
    notes[activeNoteItem] = document.getElementById('notesTextarea').value;
    saveNotesData(notes);
    document.getElementById('notesModal').classList.remove('show');
    const btn = document.querySelector(`.item-note-btn[data-note="${activeNoteItem}"]`);
    if (btn) btn.classList.toggle('has-note', notes[activeNoteItem].trim().length > 0);
    activeNoteItem = null;
}

// ===== INIT =====
function init() {
    updateDateDisplay();
    renderSections();
    updateStreak();
    document.getElementById('motivationQuote').textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];

    // Main click delegation
    document.getElementById('checklistMain').addEventListener('click', e => {
        const del = e.target.closest('.item-delete-btn');
        if (del) { e.preventDefault(); e.stopPropagation(); deleteCustomTask(del.dataset.delete, del.dataset.deleteSection); return; }

        const note = e.target.closest('.item-note-btn');
        if (note) { e.stopPropagation(); openNote(note.dataset.note); return; }

        // Show inline input
        const showBtn = e.target.closest('.add-task-btn');
        if (showBtn) { e.stopPropagation(); showAddInput(showBtn.dataset.showInput); return; }

        // Confirm add
        const confirmBtn = e.target.closest('.add-task-confirm');
        if (confirmBtn) { e.stopPropagation(); confirmAddTask(confirmBtn.dataset.confirmSection); return; }

        // Cancel add
        const cancelBtn = e.target.closest('.add-task-cancel');
        if (cancelBtn) { e.stopPropagation(); hideAddInput(cancelBtn.dataset.cancelSection); return; }

        const item = e.target.closest('.checklist-item');
        if (item) { toggleItem(item.dataset.item); return; }

        const header = e.target.closest('.section-header');
        if (header) { toggleSection(header.dataset.section); }
    });

    // Handle Enter key in add-task input
    document.getElementById('checklistMain').addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.classList.contains('add-task-input')) {
            const sid = e.target.dataset.inputSection;
            confirmAddTask(sid);
        }
        if (e.key === 'Escape' && e.target.classList.contains('add-task-input')) {
            hideAddInput(e.target.dataset.inputSection);
        }
    });

    // Date nav: just change offset integer, no Date math bugs possible
    document.getElementById('prevDay').addEventListener('click', () => {
        dayOffset--;
        updateDateDisplay();
        renderSections();
        updateStreak();
    });
    document.getElementById('nextDay').addEventListener('click', () => {
        dayOffset++;
        updateDateDisplay();
        renderSections();
        updateStreak();
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
        if (confirm('⚠️ Reset tất cả nhiệm vụ ngày này?')) {
            saveChecklist({});
            ss(`celebrated_${dateKey()}`, false);
            renderSections();
            updateStreak();
        }
    });

    document.getElementById('celebrationClose').addEventListener('click', () => document.getElementById('celebrationOverlay').classList.remove('show'));
    document.getElementById('notesClose').addEventListener('click', () => document.getElementById('notesModal').classList.remove('show'));
    document.getElementById('notesSave').addEventListener('click', saveNote);
    document.getElementById('notesModal').addEventListener('click', e => { if (e.target.id === 'notesModal') e.target.classList.remove('show'); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { document.getElementById('notesModal').classList.remove('show'); document.getElementById('celebrationOverlay').classList.remove('show'); }
    });
}

document.addEventListener('DOMContentLoaded', init);
