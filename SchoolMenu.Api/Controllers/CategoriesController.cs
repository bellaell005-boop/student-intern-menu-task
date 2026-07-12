using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolMenu.Api.Data;
using SchoolMenu.Api.Models;

namespace SchoolMenu.Api.Controllers;

// ============================================================
//  CategoriesController - списъкът с категории (Супа, Основно...).
//
//  Само за четене - категориите се задават в Data/SeedData.cs.
//  Използва се от админ панела, за да напълни падащото меню
//  "Категория" при добавяне на ястие.
// ============================================================

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;

    public CategoriesController(AppDbContext db)
    {
        _db = db;
    }

    // --------------------------------------------------------
    //  ЧЕТЕНЕ: GET /api/categories
    //  Връща всички категории. Достъпно за всички.
    // --------------------------------------------------------
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _db.Categories.ToListAsync();
        return Ok(categories);
    }
    // ============================================================
    //  ДОБАВИ ТОЗИ МЕТОД В СЪЩЕСТВУВАЩИЯ CategoriesController.cs,
    //  до другите методи (най-вероятно до GetAll()).
    //
    //  Ако класът ти вече има [Authorize]/[AllowAnonymous] на GET
    //  метода, остави го непроменен - тук пипаме само нов POST.
    // ============================================================

    // --------------------------------------------------------
    //  ЗАПИС: POST /api/categories  (само кухнята!)
    //
    //  Браузърът изпраща JSON:
    //  { "categoryName": "Закуска" }
    // --------------------------------------------------------
    [HttpPost]
    [Authorize(Roles = "Kitchen")]
    public async Task<IActionResult> Create([FromBody] Category category)
    {
        if (string.IsNullOrWhiteSpace(category.CategoryName))
            return BadRequest(new
            {
                message = "Името на категорията е задължително."
            });

        bool exists = await _db.Categories
            .AnyAsync(c => c.CategoryName.ToLower() == category.CategoryName.Trim().ToLower());

        if (exists)
            return BadRequest(new
            {
                message = "Вече има категория с това име."
            });

        category.CategoryName = category.CategoryName.Trim();

        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        return Created($"/api/categories/{category.CategoryId}", category);
    }
}
