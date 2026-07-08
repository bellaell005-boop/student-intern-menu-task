namespace SchoolMenu.Api.Models;

// ============================================================
// МОДЕЛ: Menu = меню за определена дата.
//
// Менюто се създава от служител и съдържа
// множество ястия.
//
// ============================================================

public class Menu
{
    public int MenuId { get; set; }

    // Дата на менюто
    public DateTime Date { get; set; }

    // Ден от седмицата
    public string Day { get; set; } = "";

    // Кой служител е създал менюто
    public int EmployeeId { get; set; }

    public Employee? Employee { get; set; }

    // По желание: обща категория на менюто (напр. "Вегетарианско").
    // Отделните ястия имат СВОЯ категория (виж MenuItem) - затова
    // тук полето не е задължително.
    public int? CategoryId { get; set; }

    public Category? Category { get; set; }
    // Бележки към менюто
    public string? Notes { get; set; }

    // Всички ястия в менюто
    public List<MenuItem> MenuItems { get; set; } = new();
}