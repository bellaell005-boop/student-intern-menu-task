namespace SchoolMenu.Api.DTOs;

// ============================================================
//  DTO = Data Transfer Object - малък клас САМО за пренасяне
//  на данни между браузъра и сървъра (не е таблица в базата!).
//
//  Това е, което login формата изпраща като JSON:
//      { "username": "kitchen", "password": "..." }
// ============================================================
public class LoginDto
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}
