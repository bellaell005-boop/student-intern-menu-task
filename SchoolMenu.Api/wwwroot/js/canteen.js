// ============================================================
//  canteen.js — логика на страницата за продажби в Лафката.
//
//  Всички заявки към сървъра минават през функциите в api.js
//  (getCurrentUser, getMenuForDate, getMenuItems, getCategories,
//  putMenuItem). Тук само подреждаме данните и следим избора
//  на потребителя (колко бройки от всяко ястие се продават).
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    // ---------------- Елементи ----------------

    const userEmailEl = document.getElementById('userEmail');
    const logoutBtn = document.getElementById('logoutBtn');

    const dayTabsEl = document.getElementById('dayTabs');
    const dateLabelEl = document.getElementById('selectedDateLabel');

    const searchInput = document.getElementById('searchInput');
    const refreshBtn = document.getElementById('refreshBtn');

    const statusMsgEl = document.getElementById('statusMsg');
    const categoriesContainer = document.getElementById('categoriesContainer');
    const emptyStateEl = document.getElementById('emptyState');

    const sellBar = document.getElementById('sellBar');
    const sellCountEl = document.getElementById('sellCount');
    const sellUnitsEl = document.getElementById('sellUnits');
    const sellBtn = document.getElementById('sellBtn');
    const clearBtn = document.getElementById('clearBtn');

    const toastEl = document.getElementById('toast');


    // ---------------- Състояние ----------------

    let categoriesById = new Map();
    let currentMenu = null;         // текущото Menu за избраната дата
    let currentItems = [];          // MenuItems за избраната дата
    let selections = new Map();     // itemId -> избрани бройки за продажба
    let selectedDate = toDateStr(new Date());
    let searchTerm = '';


    // ---------------- Помощни функции за дати ----------------

    function toDateStr(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function mondayOf(date) {
        const d = new Date(date);
        const diff = (d.getDay() + 6) % 7; // 0 = понеделник
        d.setDate(d.getDate() - diff);
        return d;
    }

    const DAY_NAMES = ['Пон', 'Вт', 'Ср', 'Чет', 'Пет'];

    function buildWorkWeek(referenceDateStr) {
        const monday = mondayOf(new Date(referenceDateStr));
        const days = [];
        for (let i = 0; i < 5; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            days.push({
                dateStr: toDateStr(d),
                label: DAY_NAMES[i],
                dayNumber: d.getDate()
            });
        }
        return days;
    }

    function formatFriendlyDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('bg-BG', { weekday: 'long', day: 'numeric', month: 'long' });
    }


    // ---------------- UI помощни ----------------

    function showToast(message, isError = false) {
        toastEl.textContent = message;
        toastEl.classList.toggle('is-error', isError);
        toastEl.classList.add('is-visible');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => {
            toastEl.classList.remove('is-visible');
        }, 3200);
    }

    function showStatus(message) {
        if (!message) {
            statusMsgEl.hidden = true;
            statusMsgEl.textContent = '';
            return;
        }
        statusMsgEl.hidden = false;
        statusMsgEl.textContent = message;
    }

    function setLoading(isLoading) {
        categoriesContainer.hidden = isLoading;
        if (isLoading) emptyStateEl.hidden = true;
    }

    const TYPE_ICON = {
        soup: '🥣',
        main: '🍲',
        dessert: '🍰',
        drink: '🥤',
        bakery: '🥐',
        salad: '🥗',
        snack: '🍪'
    };

    function iconForCategory(items) {
        const t = items.find(i => i.type)?.type;
        return TYPE_ICON[t] || '🍽️';
    }

    // Бекендът връща ID-то на ястието под различни имена в различните
    // ендпойнти (виждали сме "menuId" вместо "id" за менюто) — затова
    // тук проверяваме всички разумни варианти вместо да разчитаме само на "id".
    function getItemId(item) {
        const value = item.id ?? item.menuItemId ?? item.itemId ?? item.menuItemID;
        if (value === undefined) {
            console.error("[getItemId] не намирам ID поле в обекта на ястието:", item);
        }
        return value;
    }


    // ---------------- Автентикация ----------------

    async function checkAuth() {
        try {
            const user = await getCurrentUser();

            if (!user) {
                window.location.href = 'login-canteen.html';
                return;
            }

            userEmailEl.textContent = user.email || user.displayName || 'потребител';
        }
        catch {
            window.location.href = 'login-canteen.html';
        }
    }

    logoutBtn.addEventListener('click', async () => {
        try {
            await logout();
        }
        finally {
            window.location.href = 'index.html';
        }
    });


    // ---------------- Зареждане на данни ----------------

    async function loadCategories() {
        try {
            const list = await getCategories();
            categoriesById = new Map(list.map(c => [c.id, c.name]));
        }
        catch (err) {
            // Категориите не са критични за показването — продължаваме без имена.
            console.error("[loadCategories] грешка при зареждане на категориите:", err);
            categoriesById = new Map();
        }
    }

    async function loadItemsForDate(dateStr) {

        setLoading(true);
        showStatus('');
        selections.clear();
        updateSellBar();

        try {

            console.log("[loadItemsForDate] искам меню за дата:", dateStr);

            const menu = await getMenuForDate(dateStr);
            currentMenu = menu;

            if (!menu) {
                console.log("[loadItemsForDate] getMenuForDate върна null — показвам празно състояние.");
                currentItems = [];
                renderItems();
                return;
            }

            // Ако Menu вече идва с вложени items, ползваме тях.
            // Иначе теглим всички ястия и филтрираме по menuId.
            if (Array.isArray(menu.items)) {
                currentItems = menu.items;
                console.log("[loadItemsForDate] ястия от menu.items:", currentItems.length);
            }
            else {
                const allItems = await getMenuItems();
                // Бекендът връща менюто с поле "menuId" (не "id") — затова
                // взимаме менюто ID-то по правилното име на полето.
                const menuIdValue = menu.menuId ?? menu.id;
                console.log("[loadItemsForDate] общо ястия от /api/menuitems:", allItems.length, "| menu ID =", menuIdValue);
                currentItems = allItems.filter(i => i.menuId === menuIdValue);
                console.log("[loadItemsForDate] след филтър по menuId:", currentItems.length);
                if (currentItems.length) {
                    console.log("[loadItemsForDate] пример за структурата на ястие:", currentItems[0]);
                }
            }

            renderItems();

        }
        catch (err) {
            showStatus(err.message || 'Грешка при зареждане на менюто.');
            currentItems = [];
            renderItems();
        }
        finally {
            setLoading(false);
        }
    }


    // ---------------- Рендиране на дни ----------------

    function renderDayTabs() {

        const today = toDateStr(new Date());
        const days = buildWorkWeek(selectedDate);

        dayTabsEl.innerHTML = '';

        days.forEach(day => {

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'day-tab';
            if (day.dateStr === selectedDate) btn.classList.add('is-active');
            if (day.dateStr === today) btn.classList.add('is-today');

            btn.innerHTML = `
                <span class="day-name">${day.label}</span>
                <span class="day-date">${day.dayNumber}</span>
            `;

            btn.addEventListener('click', () => {
                if (day.dateStr === selectedDate) return;
                selectedDate = day.dateStr;
                renderDayTabs();
                dateLabelEl.textContent = formatFriendlyDate(selectedDate);
                loadItemsForDate(selectedDate);
            });

            dayTabsEl.appendChild(btn);

        });

    }


    // ---------------- Рендиране на ястия ----------------

    function renderItems() {

        categoriesContainer.innerHTML = '';

        const term = searchTerm.trim().toLowerCase();
        const filtered = currentItems.filter(i =>
            !term || i.name.toLowerCase().includes(term)
        );

        if (!currentItems.length) {
            emptyStateEl.hidden = false;
            categoriesContainer.hidden = true;
            return;
        }

        emptyStateEl.hidden = true;
        categoriesContainer.hidden = false;

        // Групиране по категория
        const groups = new Map();
        filtered.forEach(item => {
            const key = item.categoryId ?? 'other';
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(item);
        });

        if (!groups.size) {
            categoriesContainer.innerHTML = `
                <p style="text-align:center; color:var(--text-soft); padding:20px 0;">
                    Няма резултати за „${escapeHtml(searchTerm)}“.
                </p>`;
            return;
        }

        groups.forEach((items, categoryId) => {

            const block = document.createElement('section');
            block.className = 'category-block';

            const heading = document.createElement('div');
            heading.className = 'category-heading';
            heading.innerHTML = `
                <span class="cat-icon">${iconForCategory(items)}</span>
                <h2>${escapeHtml(categoriesById.get(categoryId) || 'Други')}</h2>
                <span class="cat-count">${items.length} ${items.length === 1 ? 'артикул' : 'артикула'}</span>
            `;

            const list = document.createElement('div');
            list.className = 'item-list';

            items.forEach(item => list.appendChild(renderItemRow(item)));

            block.appendChild(heading);
            block.appendChild(list);
            categoriesContainer.appendChild(block);

        });

    }

    function renderItemRow(item) {

        const available = Number(item.quantity) || 0;
        const itemId = getItemId(item);
        const selected = selections.get(itemId) || 0;
        const isOut = available <= 0;

        const row = document.createElement('div');
        row.className = 'item-row';
        row.dataset.itemId = itemId;
        if (isOut) row.classList.add('is-out');
        if (selected > 0) row.classList.add('is-selected');

        const stockClass = isOut ? 'stock-out' : (available <= 5 ? 'stock-low' : '');

        row.innerHTML = `
            <div class="item-info">
                <h3>${escapeHtml(item.name)}</h3>
                <div class="item-meta">
                    ${item.description ? `<p class="item-desc">${escapeHtml(item.description)}</p>` : ''}
                    ${item.weight ? `<span class="item-tag">${escapeHtml(String(item.weight))} г</span>` : ''}
                    ${item.allergens ? `<span class="item-tag tag-allergen">Алергени: ${escapeHtml(item.allergens)}</span>` : ''}
                </div>
            </div>

            <div class="item-stock ${stockClass}">
                <strong>${isOut ? 'Изчерпано' : available}</strong>
                ${isOut ? '' : 'налични'}
            </div>

            <div class="stepper">
                <button type="button" class="step-minus" aria-label="Намали" ${selected <= 0 ? 'disabled' : ''}>−</button>
                <span class="stepper-value">${selected}</span>
                <button type="button" class="step-plus" aria-label="Увеличи" ${selected >= available ? 'disabled' : ''}>+</button>
            </div>
        `;

        row.querySelector('.step-minus').addEventListener('click', () => changeSelection(item, -1));
        row.querySelector('.step-plus').addEventListener('click', () => changeSelection(item, 1));

        return row;
    }

    function changeSelection(item, delta) {

        const available = Number(item.quantity) || 0;
        const itemId = getItemId(item);
        const current = selections.get(itemId) || 0;
        const next = Math.max(0, Math.min(available, current + delta));

        if (next === current) return;

        if (next === 0) selections.delete(itemId);
        else selections.set(itemId, next);

        // Обновяваме само реда, за да не губим скрол позицията
        const row = categoriesContainer.querySelector(`.item-row[data-item-id="${itemId}"]`);
        if (row) {
            const newRow = renderItemRow(item);
            row.replaceWith(newRow);
        }

        updateSellBar();
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str ?? '';
        return div.innerHTML;
    }


    // ---------------- Sell bar ----------------

    function updateSellBar() {

        const itemCount = selections.size;
        const unitCount = Array.from(selections.values()).reduce((a, b) => a + b, 0);

        sellCountEl.textContent = itemCount;
        sellUnitsEl.textContent = unitCount;

        sellBar.classList.toggle('is-visible', itemCount > 0);
        sellBtn.disabled = itemCount === 0;
    }

    clearBtn.addEventListener('click', () => {
        selections.clear();
        renderItems();
        updateSellBar();
    });


    // ---------------- Извършване на продажба ----------------

    sellBtn.addEventListener('click', async () => {

        if (!selections.size) return;

        sellBtn.disabled = true;
        sellBtn.textContent = 'Изпращане…';

        const toSell = Array.from(selections.entries());
        const failed = [];

        for (const [itemId, soldCount] of toSell) {

            const item = currentItems.find(i => getItemId(i) === itemId);
            if (!item) continue;

            const newQuantity = Math.max(0, (Number(item.quantity) || 0) - soldCount);

            try {
                await sellMenuItem(itemId, soldCount);

                item.quantity = newQuantity;

            }
            catch (err) {
                failed.push(item.name);
            }

        }

        selections.clear();
        renderItems();
        updateSellBar();

        sellBtn.textContent = 'Извърши продажба';

        if (failed.length) {
            showToast(`Проблем при обновяване на: ${failed.join(', ')}`, true);
        }
        else {
            showToast('Продажбата е записана успешно.');
        }

    });


    // ---------------- Търсене / обновяване ----------------

    let searchTimer = null;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            searchTerm = e.target.value;
            renderItems();
        }, 150);
    });

    refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('is-spinning');
        loadItemsForDate(selectedDate).finally(() => {
            setTimeout(() => refreshBtn.classList.remove('is-spinning'), 400);
        });
    });


    // ---------------- Старт ----------------

    async function init() {
        await checkAuth();
        dateLabelEl.textContent = formatFriendlyDate(selectedDate);
        renderDayTabs();
        await loadCategories();
        await loadItemsForDate(selectedDate);
    }

    init();

});