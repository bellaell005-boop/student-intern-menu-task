// ============================================================
//  student.js - логиката на ученическата страница (index.html)
//
//  ТОВА Е ПРИМЕРЪТ "как се ПОКАЗВАТ данни от базата":
//
//    сървър -> api.js (fetch)
//            -> JSON обект
//            -> HTML в страницата
//
//  Новата структура:
//
//        Menu
//          |
//          |
//       MenuItems
//          |
//          |
//       Category
//
//  Навигация:
//
//        Понеделник
//        Вторник
//        Сряда
//        Четвъртък
//        Петък
//
// ============================================================





// Помощна функция:
// Date обект -> текст "2026-07-07" (за API-то).
//
// Внимание:
// месеците в JavaScript започват от 0
// (януари = 0)!

function dateToStr(date) {


    const y =
        date.getFullYear();


    const m =
        String(date.getMonth() + 1)
            .padStart(2, "0");


    const d =
        String(date.getDate())
            .padStart(2, "0");


    return `${y}-${m}-${d}`;

}








// ============================================================
//  Вземаме понеделника на текущата седмица.
//
//  Така бутоните винаги показват:
//  понеделник - петък от текущата седмица.
//
// ============================================================


function getMonday(date) {


    const day =
        date.getDay();


    const diff =
        date.getDate() - day + 1;


    return new Date(
        date.setDate(diff)
    );

}








// Първият ден от седмицата

let weekStart =
    getMonday(new Date());



// Кой ден е избран в момента

let selectedDate =
    weekStart;









// ============================================================
// Зарежда менюто за дадена дата
// и го "рисува" в страницата
// ============================================================


async function loadMenu(date) {


    const container =
        document.getElementById(
            "menu-container"
        );





    // Показваме избрания ден

    document.getElementById(
        "menu-date"
    ).textContent =


        date.toLocaleDateString(
            "bg-BG",
            {
                weekday: "long",
                day: "numeric",
                month: "long"
            }
        );






    // Питаме сървъра
    // функцията е в api.js

    const menu =
        await getMenuForDate(
            dateToStr(date)
        );






    // Няма меню за този ден

    if (!menu) {


        container.innerHTML =

            `
      <div class="alert">

        Менюто за този ден
        все още не е публикувано.

      </div>
    `;


        return;

    }







    // Новата структура връща:
    //
    // menu.menuItems
    //
    // намираме отделните категории



    const items =
        menu.menuItems || [];





    const soups =
        items.filter(
            i => i.type === "soup"
        );



    const mains =
        items.filter(
            i => i.type === "main"
        );



    const salads =
        items.filter(
            i => i.type === "salad"
        );



    const desserts =
        items.filter(
            i => i.type === "dessert"
        );



    const drinks =
        items.filter(
            i => i.type === "drink"
        );









    // Рисуваме менюто

    container.innerHTML =


        `

  <div class="menu-card">





    <div class="menu-section">

      <h3>
        🍲 Супи
      </h3>


      ${createItemsHTML(soups)
        }


    </div>





    <div class="menu-section">

      <h3>
        🍛 Основни
      </h3>


      ${createItemsHTML(mains)
        }


    </div>







    <div class="menu-section">

      <h3>
        🥗 Салати
      </h3>


      ${createItemsHTML(salads)
        }


    </div>








    <div class="menu-section">

      <h3>
        🍰 Десерти
      </h3>


      ${createItemsHTML(desserts)
        }


    </div>







    <div class="menu-section">

      <h3>
        🥤 Напитки
      </h3>


      ${createItemsHTML(drinks)
        }


    </div>






    ${menu.notes

            ?

            `
      <p class="notes">
        ℹ️ ${menu.notes}
      </p>
      `

            :

            ""

        }





  </div>


  `;


}









// ============================================================
// Помощна функция:
//
// Получава списък от ястия
// и създава HTML.
//
// ============================================================


function createItemsHTML(items) {


    if (items.length === 0)


        return `
      <p>
        Няма добавено
      </p>
    `;





    return items

        .map(item =>


            `

    <div class="menu-item">


      <strong>
        ${item.name}
      </strong>



      ${item.allergens

                ?

                `
        <em>
          Алергени:
          ${item.allergens}
        </em>
        `

                :

                ""

            }


    </div>


    `


        )

        .join("");

}









// ============================================================
//  Избиране на ден от седмицата
//
//  offset:
//
//  0 -> понеделник
//  1 -> вторник
//  2 -> сряда
//  3 -> четвъртък
//  4 -> петък
//
// ============================================================


function selectDay(offset) {



    selectedDate =

        new Date(
            weekStart
        );



    selectedDate.setDate(

        weekStart.getDate()
        +
        offset

    );





    loadMenu(
        selectedDate
    );





    updateActiveButton(
        offset
    );


}









// ============================================================
// Активен бутон
// ============================================================


function updateActiveButton(day) {


    document
        .querySelectorAll(
            ".day-btn"
        )

        .forEach(
            btn =>
                btn.classList.remove(
                    "active"
                )
        );



    const buttons =

        document.querySelectorAll(
            ".day-btn"
        );



    if (buttons[day])

        buttons[day]
            .classList
            .add(
                "active"
            );

}









// ============================================================
// Бутоните за седмицата
// ============================================================


document
    .getElementById("btn-monday")
    .onclick = () => {

        selectDay(0);

    };



document
    .getElementById("btn-tuesday")
    .onclick = () => {

        selectDay(1);

    };



document
    .getElementById("btn-wednesday")
    .onclick = () => {

        selectDay(2);

    };



document
    .getElementById("btn-thursday")
    .onclick = () => {

        selectDay(3);

    };



document
    .getElementById("btn-friday")
    .onclick = () => {

        selectDay(4);

    };









// При отваряне на страницата
// показваме менюто за понеделник

loadMenu(
    weekStart
);



// активен първи бутон

updateActiveButton(0);