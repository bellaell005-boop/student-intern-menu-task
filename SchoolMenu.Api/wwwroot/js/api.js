// ============================================================
//  api.js - ВСИЧКИ заявки към сървъра са събрани ТУК.
//  Така не повтаряме код и е лесно за дебъгване.
//
//  Всяка функция ползва fetch() - вградената функция на браузъра
//  за HTTP заявки - и връща данните като JavaScript обект.
//
//  Правило: щом функцията има "await" вътре, отпред пише "async".
// ============================================================


const API_BASE = "/api";



// ---------------- ВХОД / ИЗХОД ----------------



// Опит за вход.
// Връща { email, role, displayName } или хвърля грешка.
//
// Новата структура използва Employee:
//      Email
//      PasswordHash
//      Role
//
// Cookie се създава от сървъра автоматично.

async function login(email, password) {

  const res = await fetch(`${API_BASE}/auth/login`, {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },


    // JS обект -> JSON текст
    body: JSON.stringify({
      email,
      password
    }),

  });



  if (!res.ok) {

    const err = await res.json();

    throw new Error(
      err.message || "Грешка при вход"
    );

  }



  return await res.json();

}



// Изход - сървърът изтрива бисквитката

async function logout() {

  await fetch(`${API_BASE}/auth/logout`, {

    method: "POST"

  });

}



// Кой е влязъл в момента?
// Връща { email, role } или null.

async function getCurrentUser() {


  const res = await fetch(
    `${API_BASE}/auth/me`
  );



  if (!res.ok)

    return null;



  return await res.json();

}




// ---------------- МЕНЮ ----------------



// ЧЕТЕНЕ:
// менюто за дата.
//
// dateStr = "2026-07-07"
//
// Връща обект Menu или null,
// ако още не е въведено (404).


async function getMenuForDate(dateStr) {


  const res = await fetch(
    `${API_BASE}/menu?date=${dateStr}`
  );



  if (res.status === 404)

    return null;



  if (!res.ok)

    throw new Error(
      "Грешка при зареждане на менюто"
    );



  return await res.json();

}




// ЗАПИС:
// ново меню (само кухнята).
//
// menuData:
//
// {
//    employeeId:1,
//    date:"2026-07-08",
//    day:"Monday",
//    notes:"Вегетарианско меню"
// }
//
// Забележка:
// Ястията вече не са soupId,
// mainCourseId и dessertId.
//
// Те са отделни MenuItems.


async function postMenu(menuData) {


  const res = await fetch(
    `${API_BASE}/menu`,
    {

      method: "POST",


      headers: {
        "Content-Type": "application/json"
      },


      body: JSON.stringify(menuData)

    }
  );



  if (!res.ok) {


    const err = await res.json();


    throw new Error(
      err.message || "Неуспешно запазване"
    );

  }



  return await res.json();

}




// РЕДАКТИРАНЕ:
// PUT /api/menu/{id}
//
// menuData = новите данни за менюто.


async function putMenu(id, menuData) {


  const res = await fetch(
    `${API_BASE}/menu/${id}`,
    {


      method: "PUT",


      headers: {
        "Content-Type": "application/json"
      },


      body: JSON.stringify(menuData)


    }
  );



  if (!res.ok) {


    const err = await res.json();


    throw new Error(
      err.message || "Грешка при редактиране"
    );

  }



  return await res.json();

}




// ИЗТРИВАНЕ:
// DELETE /api/menu/{id}
//
// Изтрива меню и свързаните ястия.


async function deleteMenu(id) {


  const res = await fetch(
    `${API_BASE}/menu/${id}`,
    {

      method: "DELETE"

    }
  );



  if (!res.ok) {


    const err = await res.json();


    throw new Error(
      err.message || "Грешка при изтриване"
    );

  }



  return await res.json();

}




// СЕДМИЧНО МЕНЮ:
//
// fromStr = "2026-07-06"
//
// Връща менюта за 5 работни дни.


async function getWeek(fromStr) {


  const res = await fetch(
    `${API_BASE}/menu/week?from=${fromStr}`
  );



  if (!res.ok)

    throw new Error(
      "Грешка при зареждане на седмично меню"
    );



  return await res.json();

}




// ---------------- ЯСТИЯ ----------------




// ЧЕТЕНЕ:
// всички ястия.
//
// Използва се например
// за добавяне на ястия към меню.


async function getMenuItems() {


  const res = await fetch(
    `${API_BASE}/menuitems`
  );



  if (!res.ok)

    throw new Error(
      "Грешка при зареждане на ястията"
    );



  return await res.json();

}





// ЗАПИС:
// ново ястие (само кухнята).
//
// item:
//
// {
//    menuId:1,
//    categoryId:2,
//    name:"Таратор",
//    type:"soup",
//    description:"...",
//    allergens:"мляко",
//    ingredients:"...",
//    quantity:100,
//    weight:250
// }


async function postMenuItem(item) {


  const res = await fetch(
    `${API_BASE}/menuitems`,
    {


      method: "POST",


      headers: {
        "Content-Type": "application/json"
      },


      body: JSON.stringify(item)


    }
  );



  if (!res.ok) {


    const err = await res.json();



    throw new Error(
      err.message || "Неуспешно добавяне на ястие"
    );

  }



  return await res.json();

}




// ---------------- КАТЕГОРИИ ----------------
// ЧЕТЕНЕ: всички категории (Супа, Основно, Десерт...).
// Използва се за падащото меню "Категория" при добавяне на ястие.

async function getCategories() {

  const res = await fetch(
    `${API_BASE}/categories`
  );

  if (!res.ok)
    throw new Error(
      "Грешка при зареждане на категориите"
    );

  return await res.json();
}


// ═══════════════════════════════════════════════════════════
//  Новите функции следват същия модел:
//
//  fetch()
//  проверка за грешка
//  връщане на JSON
//
//  api.js остава единственото място,
//  което комуникира със сървъра.
//
// ═══════════════════════════════════════════════════════════