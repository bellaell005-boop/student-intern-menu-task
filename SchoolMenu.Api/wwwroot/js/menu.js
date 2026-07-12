/* ============================================================
   STUDENT.JS
   Меню за ученици - показва менюто за избрания ден, групирано
   по категории (взети динамично от сървъра), с филтри за
   алергени, категория, наличност и отделно сортиране
   по цена и по грамаж.
============================================================ */

/* ------------------------------------------------------------
   Помощни функции
------------------------------------------------------------ */

function dateToStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
}

function getMonday(date) {
    const copy = new Date(date);

    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    copy.setDate(copy.getDate() + diff);

    return copy;
}

// Емоджита по вид ястие (item.type) - същите кодове, каквито
// кухнята записва (виж kitchen.js -> typeName / guessTypeFromCategory).
const TYPE_EMOJI = {
    soup: "🍲",
    main: "🍛",
    salad: "🥗",
    dessert: "🍰",
    drink: "🥤",
    bakery: "🥐",
    snack: "🍪"
};

/* ------------------------------------------------------------
   Седмица
------------------------------------------------------------ */

let weekStart = getMonday(new Date());
let selectedDate = weekStart;

/* ------------------------------------------------------------
   Глобално състояние
------------------------------------------------------------ */

let allCategories = [];      // от getCategories()
let currentMenuItems = [];   // ястията на избрания ден (суров списък)
let currentMenuNotes = null;

/* ------------------------------------------------------------
   Категории (динамично, вместо hardcoded списък)
------------------------------------------------------------ */

async function loadCategoriesFilter() {

    try {
        allCategories = await getCategories();
    }
    catch (err) {
        allCategories = [];
    }

    const select = document.getElementById("filter-category");

    if (!select) return;

    const optionsHtml = allCategories
        .map(c => {
            const id = c.categoryId ?? c.id;
            const name = c.categoryName ?? c.name ?? "";
            return `<option value="${id}">${name}</option>`;
        })
        .join("");

    select.innerHTML = `<option value="all">Всички</option>${optionsHtml}`;
}

/* ------------------------------------------------------------
   Алергени - извличат се от реално въведените ястия
   (всички менюта), за да няма фиксиран/непълен списък.
------------------------------------------------------------ */

async function loadAllergensFilter() {

    let items = [];

    try {
        items = await getMenuItems();
    }
    catch (err) {
        items = [];
    }

    const allergenSet = new Set();

    items.forEach(item => {
        (item.allergens ?? "")
            .split(",")
            .map(a => a.trim())
            .filter(Boolean)
            .forEach(a => allergenSet.add(a));
    });

    const select = document.getElementById("filter-allergen");

    if (!select) return;

    const optionsHtml = [...allergenSet]
        .sort((a, b) => a.localeCompare(b, "bg"))
        .map(a => `<option value="${a}">Без ${a}</option>`)
        .join("");

    select.innerHTML = `<option value="all">Всички</option>${optionsHtml}`;
}

/* ------------------------------------------------------------
   Стойности на филтрите в момента
------------------------------------------------------------ */

function getFilterValues() {

    return {
        allergen: document.getElementById("filter-allergen")?.value ?? "all",
        category: document.getElementById("filter-category")?.value ?? "all",
        priceSort: document.getElementById("filter-price-sort")?.value ?? "",
        weightSort: document.getElementById("filter-weight-sort")?.value ?? "",
        availability: document.getElementById("filter-availability")?.value ?? "all"
    };
}

/* ------------------------------------------------------------
   Прилагане на филтри + сортиране върху списъка с ястия
------------------------------------------------------------ */

function applyFilters(items) {

    const { allergen, category, priceSort, weightSort, availability } = getFilterValues();

    let result = [...items];

    // Алергени - изключва ястия, съдържащи избрания алерген
    if (allergen !== "all") {

        result = result.filter(item => {
            const list = (item.allergens ?? "")
                .split(",")
                .map(a => a.trim().toLowerCase());

            return !list.includes(allergen.toLowerCase());
        });
    }

    // Категория
    if (category !== "all") {
        result = result.filter(item =>
            Number(item.categoryId) === Number(category)
        );
    }

    // Наличност (базирано на количеството - 0 = изчерпано)
    if (availability === "available") {
        result = result.filter(item => Number(item.quantity) > 0);
    }
    else if (availability === "soldout") {
        result = result.filter(item => Number(item.quantity) <= 0);
    }

    // Сортиране по грамаж (прилага се първо, за да е "вторично"
    // спрямо цената - JS сортирането е стабилно)
    if (weightSort === "asc") {
        result.sort((a, b) => Number(a.weight || 0) - Number(b.weight || 0));
    }
    else if (weightSort === "desc") {
        result.sort((a, b) => Number(b.weight || 0) - Number(a.weight || 0));
    }

    // Сортиране по цена (основен критерий, ако е избран)
    if (priceSort === "asc") {
        result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }
    else if (priceSort === "desc") {
        result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    return result;
}

/* ------------------------------------------------------------
   Групиране на ястията по категория
------------------------------------------------------------ */

function groupByCategory(items) {

    const map = new Map();

    items.forEach(item => {
        const catId = item.categoryId ?? "uncategorized";

        if (!map.has(catId)) {
            map.set(catId, []);
        }

        map.get(catId).push(item);
    });

    return map;
}

/* ------------------------------------------------------------
   Зареждане на меню за дата
------------------------------------------------------------ */

async function loadMenu(date) {

    const menuDate = document.getElementById("menu-date");

    if (menuDate) {
        menuDate.textContent = date.toLocaleDateString(
            "bg-BG",
            {
                weekday: "long",
                day: "numeric",
                month: "long"
            }
        );
    }

    const container = document.getElementById("menu-container");

    if (container) {
        container.innerHTML = `<div class="loading">Зареждане...</div>`;
    }

    // Данните идват от api.js
    const menu = await getMenuForDate(dateToStr(date));

    if (!menu) {

        currentMenuItems = [];
        currentMenuNotes = null;

        if (container) {
            container.innerHTML = `
                <div class="alert">
                    Менюто за този ден все още не е публикувано.
                </div>
            `;
        }

        return;
    }

    currentMenuItems = menu.menuItems || [];
    currentMenuNotes = menu.notes || null;

    renderFilteredMenu();
}

/* ============================================================
   Показване на менюто (след филтри), групирано по категории
============================================================ */

function renderFilteredMenu() {

    const container = document.getElementById("menu-container");

    if (!container) return;

    if (!currentMenuItems.length) {
        container.innerHTML = `
            <div class="alert">
                Менюто за този ден все още не е публикувано.
            </div>
        `;
        return;
    }

    const filtered = applyFilters(currentMenuItems);
    const grouped = groupByCategory(filtered);

    // Показваме всяка категория, за която има ястия в базата
    // (не само тези, останали след филтрите), за да не
    // "изчезват" секции - вместо това при празна категория
    // след филтриране показваме съобщение.
    const allGroupedRaw = groupByCategory(currentMenuItems);

    // Реда на категориите - по подредбата от сървъра (allCategories),
    // плюс евентуални категории без съвпадение в allCategories.
    const categoryOrder = [...allCategories];

    allGroupedRaw.forEach((_, catId) => {
        const known = categoryOrder.some(c => Number(c.categoryId ?? c.id) === Number(catId));

        if (!known) {
            categoryOrder.push({ categoryId: catId, categoryName: "Друго" });
        }
    });

    let sectionsHtml = categoryOrder
        .map(cat => {

            const catId = cat.categoryId ?? cat.id;
            const catName = cat.categoryName ?? cat.name ?? "Друго";

            // Категорията изобщо няма ястия в менюто на деня -> пропускаме секцията
            if (!allGroupedRaw.has(catId) && !allGroupedRaw.has(Number(catId))) {
                return "";
            }

            const items = grouped.get(catId) || grouped.get(Number(catId)) || [];
            const emoji = TYPE_EMOJI[items[0]?.type] ?? "🍽️";

            return `
                <div class="menu-section">
                    <h3>${emoji} ${catName}</h3>
                    ${items.length
                    ? createItemsHTML(items)
                    : `<p class="empty-items">Няма ястия, отговарящи на избраните филтри.</p>`
                }
                </div>
            `;
        })
        .join("");

    if (!sectionsHtml.trim()) {
        sectionsHtml = `
            <p class="empty-items">
                Няма ястия, отговарящи на избраните филтри.
            </p>
        `;
    }

    container.innerHTML = `
        <div class="menu-card">

            ${sectionsHtml}

            ${currentMenuNotes
            ? `
                    <div class="menu-notes">
                        <h3>Бележки</h3>
                        <p>${currentMenuNotes}</p>
                    </div>
                    `
            : ""
        }

        </div>
    `;
}

/* ============================================================
   Създаване на HTML за продуктите
============================================================ */

function createItemsHTML(items) {

    if (!items || items.length === 0) {
        return `
            <p class="empty-items">
                Няма добавени продукти.
            </p>
        `;
    }

    return items.map(item => {

        const soldOut = Number(item.quantity) <= 0;

        return `

        <div class="menu-item${soldOut ? " sold-out" : ""}">

            <h4>${item.name}</h4>

            ${item.description
                ? `<p>${item.description}</p>`
                : ""
            }

            <div class="item-info">

                <span>
                     ${item.weight || "-"} гр./мл.
                </span>

                <span>
                     ${soldOut ? "Изчерпано" : (item.quantity || "-")}
                </span>

                <span>
                     ${Number(item.price || 0).toFixed(2)} евро(€).
                </span>

            </div>

            ${item.ingredients
                ? `
                        <p class="ingredients">
                            <strong>Съставки:</strong>
                            ${item.ingredients}
                        </p>
                    `
                : ""
            }

            ${item.allergens
                ? `
                        <p class="allergens">
                            <strong>Алергени:</strong>
                            ${item.allergens}
                        </p>
                    `
                : ""
            }

        </div>

    `;
    }).join("");

}

/* ============================================================
   Смяна на деня
============================================================ */

function selectDay(offset) {

    selectedDate = new Date(weekStart);

    selectedDate.setDate(
        weekStart.getDate() + offset
    );

    loadMenu(selectedDate);

    updateActiveButton(offset);

}

/* ============================================================
   Активен бутон
============================================================ */

function updateActiveButton(activeIndex) {

    const buttons = document.querySelectorAll(".day");

    buttons.forEach(button => {
        button.classList.remove("active");
    });

    if (buttons[activeIndex]) {
        buttons[activeIndex].classList.add("active");
    }

}

/* ============================================================
   Филтри - слушатели
============================================================ */

function setupFilters() {

    const ids = [
        "filter-allergen",
        "filter-category",
        "filter-price-sort",
        "filter-weight-sort",
        "filter-availability"
    ];

    ids.forEach(id => {

        const el = document.getElementById(id);

        if (el) {
            el.addEventListener("change", renderFilteredMenu);
        }

    });

}

/* ============================================================
   Инициализация
============================================================ */

document.addEventListener("DOMContentLoaded", async () => {

    /* ========================================================
       Dark Mode
    ======================================================== */

    const body = document.body;
    const toggle = document.getElementById("themeToggle");

    const storedTheme = localStorage.getItem("trapeza-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (storedTheme === "dark" || (!storedTheme && prefersDark)) {
        body.classList.add("dark");

        if (toggle) {
            toggle.setAttribute("aria-pressed", "true");
        }
    }

    if (toggle) {

        toggle.addEventListener("click", () => {

            const dark = body.classList.toggle("dark");

            toggle.setAttribute("aria-pressed", dark);

            localStorage.setItem(
                "trapeza-theme",
                dark ? "dark" : "light"
            );

        });

    }

    /* ========================================================
       Бутоните Понеделник - Петък
    ======================================================== */

    const dayButtons = document.querySelectorAll(".day");

    dayButtons.forEach((button, index) => {

        button.addEventListener("click", () => {

            selectDay(index);

        });

    });

    /* ========================================================
       Footer година
    ======================================================== */

    const year = document.getElementById("year");

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    /* ========================================================
       Филтри (категории + алергени зареждаме динамично)
    ======================================================== */

    await Promise.all([
        loadCategoriesFilter(),
        loadAllergensFilter()
    ]);

    setupFilters();

    /* ========================================================
       Зареждане на първото меню
    ======================================================== */

    await loadMenu(weekStart);

    updateActiveButton(0);

});