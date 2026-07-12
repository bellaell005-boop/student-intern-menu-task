using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolMenu.Api.Data;
using SchoolMenu.Api.Models;

namespace SchoolMenu.Api.Controllers;

// ============================================================
//  MenuItemsController - списъкът с ястия.
//
//  >>> ЗАПОЧНИ ОТТУК! <<<
//  Това е НАЙ-ПРОСТИЯТ пример как се ЧЕТЕ и ЗАПИСВА в базата.
//  Като го разбереш, отвори MenuController.cs - там е същото,
//  само с малко повече логика.
// ============================================================

[ApiController]
[Route("api/menuitems")]     // всички адреси тук започват с /api/menuitems
public class MenuItemsController : ControllerBase
{
    private readonly AppDbContext _db;

    public MenuItemsController(AppDbContext db)
    {
        _db = db;
    }

    // --------------------------------------------------------
    //  ЧЕТЕНЕ: GET /api/menuitems
    //  Връща всички ястия като JSON. Достъпно за всички.
    // --------------------------------------------------------
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        // EF Core превръща този ред в SQL:
        // SELECT * FROM MenuItems
        var items = await _db.MenuItems
            .Include(i => i.Category)
            .Include(i => i.Menu)
            .ToListAsync();

        // Ok() = HTTP 200 + списъкът, автоматично превърнат в JSON
        return Ok(items);
    }

    // --------------------------------------------------------
    //  ЗАПИС: POST /api/menuitems  (само кухнята!)
    //
    //  Браузърът изпраща JSON и ASP.NET САМ го превръща
    //  в C# обект MenuItem (model binding).
    // --------------------------------------------------------
    [HttpPost]
    [Authorize(Roles = "Kitchen")]
    public async Task<IActionResult> Create([FromBody] MenuItem item)
    {
        // ВАЛИДАЦИЯ: винаги проверявай данните, преди да ги запишеш!

        if (string.IsNullOrWhiteSpace(item.Name))
            return BadRequest(new
            {
                message = "Името на ястието е задължително."
            });

        if (item.MenuId <= 0)
            return BadRequest(new
            {
                message = "Ястието трябва да принадлежи към меню."
            });

        if (item.CategoryId <= 0)
            return BadRequest(new
            {
                message = "Изберете категория."
            });

        if (string.IsNullOrWhiteSpace(item.Type))
            return BadRequest(new
            {
                message = "Типът на ястието е задължителен."
            });


        _db.MenuItems.Add(item);         // 1) слагаме обекта в "чакалнята"
        await _db.SaveChangesAsync();    // 2) чак СЕГА се записва в menu.db (INSERT)

        // 201 Created + новото ястие (вече с MenuItemId, попълнено от базата)
        return Created($"/api/menuitems/{item.MenuItemId}", item);
    }

    // --------------------------------------------------------
    //  ИЗТРИВАНЕ: DELETE /api/menuitems/{id}
    //
    //  Само кухнята може да изтрива ястия.
    // --------------------------------------------------------
    [HttpDelete("{id}")]
    [Authorize(Roles = "Kitchen")]
    public async Task<IActionResult> Delete(int id)
    {
        // Търсим ястието по неговото ID
        var item = await _db.MenuItems.FindAsync(id);

        // Ако не съществува
        if (item == null)
        {
            return NotFound(new
            {
                message = "Ястието не беше намерено."
            });
        }

        // Маркираме го за изтриване
        _db.MenuItems.Remove(item);

        // Изтриваме го от базата
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Ястието беше изтрито успешно."
        });
    }

    // --------------------------------------------------------
    //  ПЪЛНА РЕДАКЦИЯ: PUT /api/menuitems/{id}
    //
    //  Пипа ВСИЧКИ полета (име, категория, алергени, тегло...).
    //  Само кухнята - лафката НЕ трябва да може да пренаписва
    //  описание/алергени/категория на ястие.
    // --------------------------------------------------------
    [HttpPut("{id}")]
    [Authorize(Roles = "Kitchen")]
    public async Task<IActionResult> Update(int id, [FromBody] MenuItem updated)
    {
        var item = await _db.MenuItems.FindAsync(id);

        if (item == null)
            return NotFound();

        item.Name = updated.Name;
        item.Description = updated.Description;
        item.Ingredients = updated.Ingredients;
        item.Allergens = updated.Allergens;
        item.Quantity = updated.Quantity;
        item.Weight = updated.Weight;
        item.Type = updated.Type;
        item.CategoryId = updated.CategoryId;
        item.MenuId = updated.MenuId;

        await _db.SaveChangesAsync();

        return Ok(item);
    }

    // --------------------------------------------------------
    //  ПРОДАЖБА: PATCH /api/menuitems/{id}/sell   (кухня + лафка)
    //
    //  Ограничен ендпойнт: НАМАЛЯВА само наличността (Quantity)
    //  с продадения брой. Не позволява промяна на нищо друго -
    //  затова лафката може да го ползва безопасно, без да й се
    //  дават права да редактира името/категорията/алергените.
    //
    //  Тяло на заявката:
    //  { "soldCount": 3 }
    // --------------------------------------------------------
    [HttpPatch("{id}/sell")]
    [Authorize(Roles = "Kitchen,Canteen")]
    public async Task<IActionResult> Sell(int id, [FromBody] SellRequest request)
    {
        var item = await _db.MenuItems.FindAsync(id);

        if (item == null)
            return NotFound(new
            {
                message = "Ястието не беше намерено."
            });

        if (request.SoldCount <= 0)
            return BadRequest(new
            {
                message = "Броят продадени бройки трябва да е положително число."
            });

        // Quantity в модела е string, затова го парсираме безопасно, преди да смятаме с него.
        if (!int.TryParse(item.Quantity, out int currentQuantity))
            return BadRequest(new
            {
                message = "Наличността на ястието не е валидно число в базата."
            });

        if (request.SoldCount > currentQuantity)
            return BadRequest(new
            {
                message = "Няма достатъчно наличност за тази продажба."
            });

        item.Quantity = (currentQuantity - request.SoldCount).ToString();

        await _db.SaveChangesAsync();

        return Ok(item);
    }
}

// Тяло на заявката за PATCH /api/menuitems/{id}/sell
public class SellRequest
{
    public int SoldCount { get; set; }
}