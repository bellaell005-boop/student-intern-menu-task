using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolMenu.Api.Data;
using SchoolMenu.Api.Models;

namespace SchoolMenu.Api.Controllers;

// ============================================================
//  MenuController - дневното меню.
//
//  ГОТОВО:
//    GET  /api/menu?date=2026-07-07   -> менюто за дата
//    POST /api/menu                   -> ново меню (само кухнята)
//
//  ДОБАВЕНО:
//    PUT    /api/menu/{id}             -> редактиране
//    DELETE /api/menu/{id}             -> изтриване
//    GET    /api/menu/week             -> меню за 5 работни дни
//
//  Менюто вече използва новата структура:
//
//  Menu
//      |
//      └── MenuItems
//              |
//              └── Category
//
// ============================================================

[ApiController]
[Route("api/menu")]
public class MenuController : ControllerBase
{
    private readonly AppDbContext _db;

    public MenuController(AppDbContext db)
    {
        _db = db;
    }


    // --------------------------------------------------------
    //  ЧЕТЕНЕ: GET /api/menu?date=2026-07-07
    //
    //  "?date=..." от адреса влиза в параметъра date ([FromQuery])
    //
    //  .Include() = зарежда свързаните таблици.
    //  Без него MenuItems и Employee няма да бъдат заредени.
    // --------------------------------------------------------

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetByDate([FromQuery] DateTime date)
    {
        var menu = await _db.Menus
            .Include(m => m.MenuItems)
            .ThenInclude(i => i.Category)
            .Include(m => m.Employee)
            .FirstOrDefaultAsync(m => m.Date.Date == date.Date);


        // Няма меню за тази дата -> 404
        if (menu == null)
            return NotFound(new
            {
                message = "Менюто за тази дата все още не е въведено."
            });


        return Ok(menu);
    }



    // --------------------------------------------------------
    //  ЗАПИС: POST /api/menu  (само кухнята!)
    //
    //  Браузърът изпраща JSON:
    //
    //  {
    //      "employeeId":1,
    //      "day":"Monday",
    //      "date":"2026-07-08",
    //      "categoryId":1,
    //      "notes":"Вегетарианско меню"
    //  }
    //
    // --------------------------------------------------------

    [HttpPost]
    [Authorize(Roles = "Kitchen")]
    public async Task<IActionResult> Create([FromBody] Menu menu)
    {

        // ВАЛИДАЦИЯ:
        // За една дата може да има само едно меню.

        bool exists = await _db.Menus
            .AnyAsync(m => m.Date.Date == menu.Date.Date);


        if (exists)
            return BadRequest(new
            {
                message = "Вече има меню за тази дата. Използвай редактиране."
            });



        if (menu.EmployeeId <= 0)
            return BadRequest(new
            {
                message = "Не е избран служител."
            });



        _db.Menus.Add(menu);

        await _db.SaveChangesAsync();



        return Created($"/api/menu/{menu.MenuId}", menu);
    }




    // ═══════════════════════════════════════════════════════
    //  РЕДАКТИРАНЕ: PUT /api/menu/{id}
    //
    //  Позволява на кухнята да промени меню.
    //
    //  Пример:
    //
    //  PUT /api/menu/3
    //
    // ═══════════════════════════════════════════════════════


    [HttpPut("{id}")]
    [Authorize(Roles = "Kitchen")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] Menu updated)
    {

        var menu = await _db.Menus.FindAsync(id);


        if (menu == null)
            return NotFound(new
            {
                message = "Няма такова меню."
            });



        menu.EmployeeId = updated.EmployeeId;
        menu.Day = updated.Day;
        menu.Date = updated.Date;
        menu.CategoryId = updated.CategoryId;
        menu.Notes = updated.Notes;



        await _db.SaveChangesAsync();



        return Ok(menu);
    }




    // ═══════════════════════════════════════════════════════
    //  ИЗТРИВАНЕ: DELETE /api/menu/{id}
    //
    //  Изтрива меню и всички ястия към него.
    //
    //  Първо махаме MenuItems, защото те зависят от Menu.
    //
    // ═══════════════════════════════════════════════════════


    [HttpDelete("{id}")]
    [Authorize(Roles = "Kitchen")]
    public async Task<IActionResult> Delete(int id)
    {

        var menu = await _db.Menus
            .Include(m => m.MenuItems)
            .FirstOrDefaultAsync(m => m.MenuId == id);



        if (menu == null)
            return NotFound(new
            {
                message = "Менюто не е намерено."
            });



        // Изтриваме всички ястия към менюто
        _db.MenuItems.RemoveRange(menu.MenuItems);



        // Изтриваме самото меню
        _db.Menus.Remove(menu);



        await _db.SaveChangesAsync();



        return Ok(new
        {
            message = "Менюто е изтрито успешно."
        });
    }




    // ═══════════════════════════════════════════════════════
    //  СЕДМИЧНО МЕНЮ:
    //
    //  GET /api/menu/week?from=2026-07-06
    //
    //  Връща менюта за 5 работни дни.
    //
    // ═══════════════════════════════════════════════════════


    [HttpGet("week")]
    [AllowAnonymous]
    public async Task<IActionResult> GetWeek(
        [FromQuery] DateTime from)
    {


        var to = from.AddDays(5);



        var menus = await _db.Menus
            .Include(m => m.MenuItems)
            .ThenInclude(i => i.Category)
            .Include(m => m.Employee)
            .Where(m =>
                m.Date >= from &&
                m.Date < to)
            .OrderBy(m => m.Date)
            .ToListAsync();



        return Ok(menus);
    }
}
