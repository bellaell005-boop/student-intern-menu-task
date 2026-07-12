namespace SchoolMenu.Api.Models;

// ============================================================
// МОДЕЛ: MenuItem = едно ястие.
//
// Всяко ястие принадлежи към определено меню
// и към определена категория.
//
// ============================================================

public class MenuItem
{
    public int MenuItemId { get; set; }

    // В кое меню се намира
    public int MenuId { get; set; }

    public Menu? Menu { get; set; }

    // Категория (супа, десерт и т.н.)
    public int CategoryId { get; set; }

    public Category? Category { get; set; }

    // Име - задължително
    public string Name { get; set; } = "";

    // Тип - задължително
    public string Type { get; set; } = "";

    // Описание
    public string? Description { get; set; }

    // Алергени
    public string? Allergens { get; set; }

    // Съставки
    public string? Ingredients { get; set; }

    // Брой - задължително
    public string Quantity { get; set; } = "";

    //Грамаж - задължително
    public string Weight { get; set; } = "";

    //Цена - задължително
    public string Price { get; set; } = "";
}