namespace SchoolMenu.Api.Models;

// ============================================================
// МОДЕЛ: Employee = служител в системата.
//
// Това може да бъде готвач, продавач от лафката,
// администратор и др.
//
// Всеки служител има една роля (Role).
// ============================================================

public class Employee
{
 public int Id { get; set; }

    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";

    public int RoleId { get; set; }

    public Role? Role { get; set; }
	// Един служител може да създаде много менюта.
	public List<Menu> Menus { get; set; } = new();
}