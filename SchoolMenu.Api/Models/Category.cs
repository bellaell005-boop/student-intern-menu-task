namespace SchoolMenu.Api.Models;

// ============================================================
// МОДЕЛ: Category = категория на храните.
//
// Примери:
//  Закуска
//  Основно
//  Супа
//  Салата
//  Десерт
//  Напитка
// ============================================================

public class Category
{
    public int CategoryId { get; set; }

    public string CategoryName { get; set; } = "";

    // Една категория може да съдържа много ястия.
    public List<MenuItem> MenuItems { get; set; } = new();
}