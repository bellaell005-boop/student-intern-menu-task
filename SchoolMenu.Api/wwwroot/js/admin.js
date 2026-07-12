// ============================================================
//  admin.js - страницата на кухнята (admin.html)
//
//  ТУК ИМА РАБОТЕЩ ПРИМЕР за ЦЕЛИЯ път на записа:
//
//    HTML форма
//        ->
//    api.js postMenuItem()
//        ->
//    POST /api/menuitems
//        ->
//    MenuItemsController.Create()
//        ->
//    SaveChangesAsync()
//        ->
//    menu.db
//
//  Работи с новата структура:
//
//      Employee
//          |
//          |
//        Menu
//          |
//          |
//      MenuItem
//          |
//          |
//      Category
//
// ============================================================



// --- "Пазач" на страницата: само кухнята има достъп ---

async function guard() {

    const user = await getCurrentUser();   // от api.js


    if (!user || user.role !== "Kitchen") {

        window.location.href = "login.html";

        return null;

    }



    document.getElementById("who").textContent =
        user.displayName || user.email;



    return user;

}





// --- Зарежда категориите в падащото меню "item-category" ---

async function loadCategories() {

    const categories = await getCategories();   // от api.js

    document.getElementById("item-category").innerHTML =

        categories
            .map(c =>
                `<option value="${c.categoryId}">${c.categoryName}</option>`
            )
            .join("");

}



// --- Зарежда и показва списъка с ястия ---

async function loadItems() {


    const items = await getMenuItems();    // от api.js



    const typeName = {

        soup: "🍲 супа",

        main: "🍛 основно",

        salad: "🥗 салата",

        dessert: "🍰 десерт",

        drink: "🥤 напитка"

    };



    // За всяко ястие правим по един <li>
    // и ги слепваме в общ текст


    document.getElementById("items-list").innerHTML =

        items

            .map(i =>

                // ЗАБЕЛЕЖКА: тук липсваха обратните кавички (`` ` ``) -
                // без тях това не е валиден JavaScript и целият файл
                // спираше да работи. Добавени са бутони за
                // редакция/изтриване (PUT / DELETE от api.js).

                `<li data-id="${i.menuItemId ?? i.id}">

                    <strong>${i.name}</strong>

                    <span class="tag">

                        ${typeName[i.type] ?? i.type}

                    </span>

                    <br>

                        <small>

                            ${i.weight}

                            •

                            ${Number(i.price).toFixed(2)} лв.

                        </small>

                    <div class="item-actions">

                        <button type="button" class="edit-btn" data-id="${i.menuItemId ?? i.id}">
                            ✏️ Редактирай
                        </button>

                        <button type="button" class="delete-btn" data-id="${i.menuItemId ?? i.id}">
                            🗑️ Изтрий
                        </button>

                    </div>

                </li>`

            )

            .join("");


    // --- Закачаме бутоните за редакция и изтриване ---

    document
        .querySelectorAll("#items-list .edit-btn")
        .forEach(btn =>
            btn.addEventListener("click", () => startEditItem(btn.dataset.id, items))
        );

    document
        .querySelectorAll("#items-list .delete-btn")
        .forEach(btn =>
            btn.addEventListener("click", () => removeItem(btn.dataset.id))
        );

}




// --- Попълва формата с данните на ястието за редакция ---

let editingItemId = null;


function startEditItem(id, items) {

    const item = items.find(
        i => String(i.menuItemId ?? i.id) === String(id)
    );

    if (!item) return;

    editingItemId = id;

    document.getElementById("item-menu").value = item.menuId ?? "";

    document.getElementById("item-category").value = item.categoryId ?? "";

    document.getElementById("item-name").value = item.name ?? "";

    document.getElementById("item-type").value = item.type ?? "main";

    document.getElementById("item-description").value = item.description ?? "";

    document.getElementById("item-allergens").value = item.allergens ?? "";

    document.getElementById("item-ingredients").value = item.ingredients ?? "";

    document.getElementById("item-quantity").value = item.quantity ?? "";

    document.getElementById("item-weight").value = item.weight ?? "";

    document.getElementById("item-price").value = item.price ?? "";

    const submitBtn = document.querySelector("#item-form button[type='submit']");

    if (submitBtn) submitBtn.textContent = "✔ Запази промените";

    document
        .getElementById("item-form")
        .scrollIntoView({ behavior: "smooth", block: "center" });

}




function resetItemForm() {

    editingItemId = null;

    document.getElementById("item-form").reset();

    const submitBtn = document.querySelector("#item-form button[type='submit']");

    if (submitBtn) submitBtn.textContent = "Добави ястие";

}




// --- Изтриване на ястие ---

async function removeItem(id) {

    if (!confirm("Сигурен ли си, че искаш да изтриеш това ястие?")) {

        return;

    }

    try {

        await deleteMenuItem(id);   // от api.js

        if (String(editingItemId) === String(id)) {

            resetItemForm();

        }

        await loadItems();

    }
    catch (err) {

        alert(err.message);

    }

}






// --- РАБОТЕЩ ПРИМЕР:
// добавяне на ново ястие
//
// HTML форма
//        |
//        |
// postMenuItem()
//        |
//        |
// MenuItemsController
//        |
//        |
// database
// ------------------------------------------------------------


document
    .getElementById("item-form")
    .addEventListener("submit", async (e) => {


        e.preventDefault();



        try {


            // Събираме стойностите от формата
            // и ги изпращаме към сървъра
            const price = Number(
                document.getElementById("item-price").value
            );

            if (price <= 0) {

                alert("Моля въведете валидна цена.");

                return;

            }

            const itemData = {

                menuId:
                    Number(
                        document
                            .getElementById("item-menu")
                            .value
                    ),



                categoryId:
                    Number(
                        document
                            .getElementById("item-category")
                            .value
                    ),



                name:
                    document
                        .getElementById("item-name")
                        .value,



                type:
                    document
                        .getElementById("item-type")
                        .value,



                description:
                    document
                        .getElementById("item-description")
                        .value
                    || null,



                allergens:
                    document
                        .getElementById("item-allergens")
                        .value
                    || null,



                ingredients:
                    document
                        .getElementById("item-ingredients")
                        .value
                    || null,



                // Забележка: Quantity/Weight в модела (MenuItem.cs)
                // са string, защото се пазят с мерна единица
                // (напр. "350 мл", "400 г"), а не голи числа -
                // затова тук НЕ ги обвиваме в Number(...).

                quantity:
                    document
                        .getElementById("item-quantity")
                        .value,



                weight:
                    document
                        .getElementById("item-weight")
                        .value,

                price:
                    Number(
                        document
                            .getElementById("item-price")
                            .value
                    )

            };


            // Ако editingItemId е зададен (натиснат бутон "Редактирай"),
            // редактираме съществуващо ястие вместо да добавяме ново.

            if (editingItemId) {

                await putMenuItem(editingItemId, itemData);

            }
            else {

                await postMenuItem(itemData);

            }



            resetItemForm();



            // презареждаме списъка
            // ястието идва от базата

            await loadItems();



        }


        catch (err) {


            alert(err.message);


        }


    });









// ------------------------------------------------------------
//  Създаване на дневно меню
//
//  Новата структура НЕ използва:
//
//      soupId
//      mainCourseId
//      dessertId
//
//  Менюто съдържа списък от MenuItems.
//
// ------------------------------------------------------------



document
    .getElementById("menu-form")
    .addEventListener("submit", async (e) => {


        e.preventDefault();



        try {


            const user =
                await getCurrentUser();




            const newMenu = await postMenu({

                employeeId:
                    user.id,



                date:
                    document
                        .getElementById("menu-date-input")
                        .value,



                day:

                    new Date(
                        document
                            .getElementById("menu-date-input")
                            .value
                    )

                        .toLocaleDateString(
                            "bg-BG",
                            {
                                weekday: "long"
                            }
                        ),



                notes:

                    document
                        .getElementById("menu-notes")
                        .value
                    || null


            });



            document
                .getElementById("menu-form")
                .reset();



            // Улеснение: автоматично слагаме ID-то на новото
            // меню в полето "item-menu" по-горе, за да не се
            // налага да го търсиш ръчно.

            document
                .getElementById("item-menu")
                .value = newMenu.menuId;



            alert(
                `Менюто е добавено успешно! (ID: ${newMenu.menuId}) ` +
                `Вече може да добавяш ястия към него отгоре.`
            );


        }


        catch (err) {


            alert(err.message);


        }


    });









// --- Изход ---

document
    .getElementById("btn-logout")
    .addEventListener("click", async () => {


        await logout();


        window.location.href =
            "index.html";


    });









// --- Старт на страницата ---


guard()
    .then(user => {


        if (user) {

            loadItems();
            loadCategories();

        }


    });







// ═══════════════════════════════════════════════════════════
//
//  ЗАБЕЛЕЖКА (бонус идеи, ако искаш да продължиш):
//
//  1. изтриване на MenuItem
//       DELETE /api/menuitems/{id}
//
//  2. редактиране на MenuItem
//       PUT /api/menuitems/{id}
//
//  3. падащо меню с готовите менюта (вместо ръчно ID),
//     когато има GET списък с всички менюта
//
// ═══════════════════════════════════════════════════════════