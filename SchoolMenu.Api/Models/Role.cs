namespace SchoolMenu.Api.Models;

// ============================================================
// МОДЕЛ: Role = роля на служител.
//
// Примери:
//  Kitchen
//  Canteen
//  Admin
//
// Една роля може да принадлежи на много служители.
// ============================================================

public class Role
{
    public int Id { get; set; }

    public string Name { get; set; } = "";

    // Navigation property
    public List<Employee> Employees { get; set; } = new();
}