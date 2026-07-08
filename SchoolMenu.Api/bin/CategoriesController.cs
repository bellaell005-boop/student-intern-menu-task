using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolMenu.Api.Data;

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
}
