/* ============================================================
   KUHNYA.JS - страница на кухнята (kuhnya.html)

   Тази версия НЕ говори директно със сървъра.
   Всички заявки минават през api.js (единственото място,
   което прави fetch() към бекенда) - точно както е замислено
   в admin.js.

   Логиката за "пазач на страницата", зареждане на категории
   и добавяне на ястие е взета от admin.js (работещ пример),
   но е пренаписана да пасва на елементите в kuhnya.html и
   добавя:

       - избор на ден -> реална дата -> конкретно Menu
       - показване на ястията от текущото меню
       - съобщение, ако няма меню / няма ястия
       - редакция на ястие (PUT)
       - изтриване на ястие (DELETE)

   Забележка: admin.js не е включен директно в kuhnya.html,
   защото е закачен за други id-та (item-form, items-list...),
   които тук не съществуват - затова логиката му е преизползвана
   тук, а не самият файл.
   ============================================================ */



// ============================================================
// GLOBAL STATE
// ============================================================


let selectedDay = "Понеделник";

let categories = [];

let selectedCategoryId = null;

let currentMenu = null;

let menuItems = [];

let editingItemId = null;

let currentUser = null;



const dayOffsets = {

    "Понеделник": 0,
    "Вторник": 1,
    "Сряда": 2,
    "Четвъртък": 3,
    "Петък": 4

};




const typeName = {

    soup: "🍲 супа",
    main: "🍛 основно",
    salad: "🥗 салата",
    dessert: "🍰 десерт",
    drink: "🥤 напитка",
    bakery: "🥐 закуска",
    snack: "🍪 снак"

};



// Ключови думи в името на категорията -> вътрешен "type" код.
// Полето "Вид ястие" вече не съществува във формата - типът се
// извежда автоматично от избраната горе категория (Тип хранене).
const CATEGORY_TYPE_KEYWORDS = [
    { keyword: "супа", type: "soup" },
    { keyword: "основно", type: "main" },
    { keyword: "салата", type: "salad" },
    { keyword: "десерт", type: "dessert" },
    { keyword: "напитк", type: "drink" },
    { keyword: "закуск", type: "bakery" },
    { keyword: "снак", type: "snack" }
];

function guessTypeFromCategory(categoryId) {

    const category = categories.find(c =>
        Number(c.categoryId ?? c.id) === Number(categoryId)
    );

    const name = (category?.categoryName ?? category?.name ?? "").toLowerCase();

    const match = CATEGORY_TYPE_KEYWORDS.find(({ keyword }) =>
        name.includes(keyword)
    );

    return match ? match.type : "main";

}








// ============================================================
// PAGE LOAD
// ============================================================


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initializeTheme();
        setYear();

        // "Пазач" - само роля Kitchen има достъп (виж admin.js)
        currentUser = await guard();

        if (!currentUser) return;

        setupDays();
        setupLogout();
        setupForm();

        await loadCategories();
        setupCategorySelect();

        await loadMenu();

    }
);









// ============================================================
// GUARD (взето от admin.js, адаптирано за kuhnya.html)
// ============================================================


async function guard() {

    const user = await getCurrentUser();   // от api.js

    if (!user || user.role !== "Kitchen") {

        window.location.href = "kuhnya-login.html";

        return null;

    }

    document.getElementById("currentUser").textContent =
        user.displayName || user.email;

    return user;

}




function setupLogout() {

    const btn = document.getElementById("btn-logout");

    if (!btn) return;

    btn.addEventListener("click", async () => {

        await logout();   // от api.js

        window.location.href = "index.html";

    });

}









// ============================================================
// YEAR FOOTER
// ============================================================


function setYear() {

    const year = document.getElementById("year");

    if (year) {

        year.textContent = new Date().getFullYear();

    }

}









// ============================================================
// DARK MODE
// ============================================================


const themeButton = document.getElementById("themeToggle");



function initializeTheme() {

    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {

        document.body.classList.add("dark");

    }

}



if (themeButton) {

    themeButton.addEventListener("click", () => {

        document.body.classList.toggle("dark");

        const mode = document.body.classList.contains("dark")
            ? "dark"
            : "light";

        localStorage.setItem("theme", mode);

    });

}









// ============================================================
// DAY BUTTONS -> дата -> Menu
// ============================================================


function setupDays() {

    const buttons = document.querySelectorAll(".day-btn");

    buttons.forEach(button => {

        button.addEventListener("click", async () => {

            buttons.forEach(b => b.classList.remove("active"));

            button.classList.add("active");

            selectedDay = button.textContent.trim();

            resetFormToAddMode();

            await loadMenu();

        });

    });

}




function getMondayOfCurrentWeek() {

    const now = new Date();

    const day = now.getDay();   // 0 = неделя ... 6 = събота

    const diff = day === 0 ? -6 : 1 - day;

    const monday = new Date(now);

    monday.setDate(now.getDate() + diff);

    return monday;

}




function getDateForDay(dayLabel) {

    const monday = getMondayOfCurrentWeek();

    const d = new Date(monday);

    d.setDate(monday.getDate() + (dayOffsets[dayLabel] ?? 0));

    const yyyy = d.getFullYear();

    const mm = String(d.getMonth() + 1).padStart(2, "0");

    const dd = String(d.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;

}









// ============================================================
// КАТЕГОРИИ (динамично, вместо hardcoded опции)
// ============================================================


async function loadCategories() {

    try {

        categories = await getCategories();   // от api.js

    }
    catch (err) {

        categories = [];

    }

    // Пазим се от разминаване в имената на полетата (виждали сме подобно
    // с menuId/id и menuItemId/id) - приемаме няколко разумни варианта.
    const select = document.getElementById("foodCategory");

    const optionsHtml = categories

        .map(c => {
            const id = c.categoryId ?? c.id;
            const name = c.categoryName ?? c.name ?? "";
            return `<option value="${id}">${name}</option>`;
        })

        .join("");

    // "Всички" - псевдо-категория, показва ястия от всички категории
    // за избрания ден (не съществува в базата, само за филтриране тук).
    select.innerHTML =
        `<option value="all">👀 Всички</option>` + optionsHtml;

    if (categories.length) {

        const firstId = categories[0].categoryId ?? categories[0].id;
        selectedCategoryId = Number(firstId);

        select.value = String(firstId);

        updateCategoryTitle();

    }

}




function setupCategorySelect() {

    const select = document.getElementById("foodCategory");

    select.addEventListener("change", async () => {

        selectedCategoryId = select.value === "all" ? "all" : Number(select.value);

        updateCategoryTitle();

        resetFormToAddMode();

        await loadItemsForMenu();

    });

    const addBtn = document.getElementById("addCategoryBtn");

    if (addBtn) {

        addBtn.addEventListener("click", async () => {

            const name = prompt("Име на новата категория (напр. Закуска, Салата, Напитки):", "");

            if (!name || !name.trim()) return;

            try {

                const created = await postCategory(name.trim());   // от api.js

                await loadCategories();

                const newId = created.categoryId ?? created.id;

                select.value = String(newId);
                selectedCategoryId = Number(newId);

                updateCategoryTitle();

                await loadItemsForMenu();

            }
            catch (err) {

                alert(err.message);

            }

        });

    }

}




function updateCategoryTitle() {

    const select = document.getElementById("foodCategory");

    const label = select.options[select.selectedIndex]?.textContent || "";

    document.getElementById("categoryName").textContent = label;

}









// ============================================================
// ЗАРЕЖДАНЕ НА МЕНЮТО ЗА ИЗБРАНИЯ ДЕН
// ============================================================


async function loadMenu() {

    const dateStr = getDateForDay(selectedDay);

    try {

        currentMenu = await getMenuForDate(dateStr);   // от api.js

    }
    catch (err) {

        currentMenu = null;

    }

    if (!currentMenu) {

        menuItems = [];

        updateCount();

        renderNoMenu(dateStr);

        return;

    }

    await loadItemsForMenu();

}




async function loadItemsForMenu() {

    if (!currentMenu) {

        renderNoMenu(getDateForDay(selectedDay));

        return;

    }

    let allItems = [];

    try {

        allItems = await getMenuItems();   // от api.js

    }
    catch (err) {

        allItems = [];

    }

    menuItems = allItems.filter(i =>
        i.menuId === currentMenu.menuId
        && (selectedCategoryId === "all" || Number(i.categoryId) === Number(selectedCategoryId))
    );

    updateCount();

    renderMenu();

}




function updateCount() {

    const count = document.getElementById("itemCount");

    if (count) {

        count.textContent = menuItems.length;

    }

}




function getFoodList() {

    let container = document.querySelector(".food-list");

    if (!container) {

        container = document.createElement("div");

        container.className = "food-list";

        // поставяме списъка веднага преди формата,
        // за да остане тя най-долу
        const form = document.getElementById("foodForm");

        document
            .querySelector(".food-section")
            .insertBefore(container, form);

    }

    return container;

}









// ============================================================
// НЯМА МЕНЮ ЗА ТОЗИ ДЕН
// ============================================================


function renderNoMenu(dateStr) {

    const container = getFoodList();

    container.innerHTML = `

        <div class="empty-state">

            <p>
                За ${selectedDay} (${dateStr}) все още няма въведено меню.
            </p>

            <button type="button" class="add-btn" id="createMenuBtn">
                + Създай меню за деня
            </button>

        </div>

    `;

    document
        .getElementById("createMenuBtn")
        .addEventListener("click", () => createMenuForDay(dateStr));

}




async function createMenuForDay(dateStr) {

    const notes = prompt("Бележка към менюто (по избор):", "") || null;

    try {

        currentMenu = await postMenu({   // от api.js

            employeeId: currentUser.employeeId ?? currentUser.id,

            date: dateStr,

            day: new Date(dateStr).toLocaleDateString(
                "bg-BG",
                { weekday: "long" }
            ),

            notes

        });

        await loadItemsForMenu();

    }
    catch (err) {

        alert(err.message);

    }

}









// ============================================================
// ПОКАЗВАНЕ НА ЯСТИЯТА
// ============================================================


function renderMenu() {

    const container = getFoodList();

    if (!menuItems.length) {

        container.innerHTML = `

            <div class="empty-state">

                <p>
                    Няма добавени ястия в тази категория за ${selectedDay}.
                </p>

            </div>

        `;

        return;

    }

    container.innerHTML = menuItems

        .map(item => {

            const id = item.menuItemId ?? item.id;

            return `

                <div class="food-card">

                    <div class="food-card-head">

                        <h3>${item.name}</h3>

                        <span class="tag">
                            ${typeName[item.type] ?? item.type ?? ""}
                        </span>

                    </div>

                    <p>${item.ingredients ?? ""}</p>

                    ${item.allergens
                    ? `<p class="allergen-line">Алергени: ${item.allergens}</p>`
                    : ""
                }

                    <div class="food-card-footer">

                        <small>
                            ${item.quantity ?? ""} • ${item.weight ?? ""} г.
                        </small>

                        <small>
                            ${Number(item.price ?? 0).toFixed(2)} €
                        </small>

                    </div>

                    <div class="food-card-actions">

                        <button type="button" class="edit-btn" data-id="${id}">
                            ✏️ Редактирай
                        </button>

                        <button type="button" class="delete-btn" data-id="${id}">
                            🗑️ Изтрий
                        </button>

                    </div>

                </div>

            `;

        })

        .join("");

    container.querySelectorAll(".edit-btn").forEach(btn =>
        btn.addEventListener("click", () => startEdit(btn.dataset.id))
    );

    container.querySelectorAll(".delete-btn").forEach(btn =>
        btn.addEventListener("click", () => removeItem(btn.dataset.id))
    );

}









// ============================================================
// ДОБАВЯНЕ / РЕДАКЦИЯ НА ЯСТИЕ
//
// HTML форма
//        |
// postMenuItem() / putMenuItem()   <- api.js
//        |
// MenuItemsController
//        |
// database
// ============================================================


function setupForm() {

    const form = document.getElementById("foodForm");

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        if (!currentMenu) {

            alert("Първо трябва да създадеш меню за деня.");

            return;

        }

        if (!selectedCategoryId || selectedCategoryId === "all" || Number.isNaN(selectedCategoryId)) {

            alert("Изберете конкретна категория (не „Всички“), за да добавите ястие в нея.");

            return;

        }

        const price = Number(document.getElementById("price").value);

        if (!price || price <= 0) {

            alert("Моля въведете валидна цена.");

            return;

        }

        const allergens = [
            ...document.querySelectorAll(".allergens input:checked")
        ]
            .map(a => a.value)
            .join(", ") || null;

        const item = {

            menuId: currentMenu.menuId,

            categoryId: selectedCategoryId,

            name: document.getElementById("foodName").value,

            type: guessTypeFromCategory(selectedCategoryId),

            description: null,

            allergens,

            ingredients:
                document.getElementById("ingredients").value || null,

            // Quantity/Weight/Price са string в базата (виж MenuItem.cs),
            // затова ги пращаме като низове, не като числа.
            quantity: document.getElementById("quantity").value,

            weight: document.getElementById("weight").value,

            price: String(price)

        };

        try {

            if (editingItemId) {

                await putMenuItem(editingItemId, item);   // от api.js

            }
            else {

                await postMenuItem(item);   // от api.js

            }

            resetFormToAddMode();

            await loadItemsForMenu();

        }
        catch (err) {

            alert(err.message);

        }

    });

}




function startEdit(id) {

    const item = menuItems.find(i =>
        String(i.menuItemId ?? i.id) === String(id)
    );

    if (!item) return;

    editingItemId = id;

    document.getElementById("foodName").value = item.name ?? "";

    document.getElementById("ingredients").value = item.ingredients ?? "";

    document.getElementById("quantity").value = item.quantity ?? "";

    document.getElementById("price").value = item.price ?? "";

    document.getElementById("weight").value = item.weight ?? "";

    const activeAllergens = (item.allergens ?? "")
        .split(",")
        .map(a => a.trim());

    document.querySelectorAll(".allergens input").forEach(chk => {

        chk.checked = activeAllergens.includes(chk.value);

    });

    const submitBtn = document.querySelector("#foodForm .add-btn");

    submitBtn.textContent = "✔ Запази промените";

    document
        .getElementById("foodForm")
        .scrollIntoView({ behavior: "smooth", block: "center" });

}




function resetFormToAddMode() {

    editingItemId = null;

    const form = document.getElementById("foodForm");

    if (form) form.reset();

    const submitBtn = document.querySelector("#foodForm .add-btn");

    if (submitBtn) submitBtn.textContent = "+ Добави";

}




async function removeItem(id) {

    if (!confirm("Сигурен ли си, че искаш да изтриеш това ястие?")) {

        return;

    }

    try {

        await deleteMenuItem(id);   // от api.js

        if (String(editingItemId) === String(id)) {

            resetFormToAddMode();

        }

        await loadItemsForMenu();

    }
    catch (err) {

        alert(err.message);

    }

}