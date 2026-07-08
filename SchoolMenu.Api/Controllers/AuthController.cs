using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolMenu.Api.Data;
using SchoolMenu.Api.DTOs;

namespace SchoolMenu.Api.Controllers;

// ============================================================
//  AuthController - вход, изход и "кой съм аз".
//
//  Работи с новата структура:
//
//      Employee
//          |
//          |
//        Role
//
//  Как работи входът (cookie sessions):
//
//   1. Браузърът изпраща email + password
//      (POST /api/auth/login)
//
//   2. Търсим служителя в Employee
//
//   3. Проверяваме паролата чрез BCrypt
//
//   4. Ако е вярна -> създаваме cookie
//
//   5. В cookie записваме:
//        - email
//        - role
//
//   6. При следващи заявки браузърът
//      изпраща cookie автоматично.
//
// ============================================================


[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{

    private readonly AppDbContext _db;


    // Dependency Injection:
    // ASP.NET Core автоматично подава базата.

    public AuthController(AppDbContext db)
    {
        _db = db;
    }



    // --------------------------------------------------------
    // POST /api/auth/login
    //
    // Тяло:
    //
    // {
    //    "email":"kitchen@school.bg",
    //    "password":"123456"
    // }
    //
    // --------------------------------------------------------

    [HttpPost("login")]
    [AllowAnonymous]

    public async Task<IActionResult> Login(
        [FromBody] LoginDto dto)
    {


        // 1) Търсим служителя по email
        //
        // Include(Role)
        // зарежда свързаната таблица Role

        var employee = await _db.Employees
            .Include(e => e.Role)
            .FirstOrDefaultAsync(
                e => e.Email == dto.Email);



        // 2) Проверка:
        //
        // - съществува ли служител
        // - правилна ли е паролата

        if (employee == null ||
           !BCrypt.Net.BCrypt.Verify(
               dto.Password,
               employee.PasswordHash))
        {

            return Unauthorized(new
            {
                message =
                "Грешен email или парола"
            });

        }




        // 3) Claims = информация,
        // която се записва в cookie.
        //
        // От Role claim-a работи:
        //
        // [Authorize(Roles="Kitchen")]

        var claims = new List<Claim>
        {

            new Claim(
                ClaimTypes.Name,
                employee.Email
            ),


            new Claim(
                ClaimTypes.Role,
                employee.Role!.Name
            ),


            // Нужен е на admin.js, за да знае кой employeeId
            // да изпрати при създаване на меню (POST /api/menu).
            new Claim(
                ClaimTypes.NameIdentifier,
                employee.Id.ToString()
            )

        };



        var identity =
            new ClaimsIdentity(
                claims,
                CookieAuthenticationDefaults.AuthenticationScheme);



        // 4) Създаване на cookie

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity));





        return Ok(new
        {

            email = employee.Email,


            role = employee.Role!.Name,


            displayName =
                employee.FirstName
                + " "
                + employee.LastName

        });

    }




    // --------------------------------------------------------
    // POST /api/auth/logout
    //
    // Изтрива cookie
    //
    // --------------------------------------------------------

    [HttpPost("logout")]

    public async Task<IActionResult> Logout()
    {

        await HttpContext.SignOutAsync(
            CookieAuthenticationDefaults.AuthenticationScheme);


        return Ok(new
        {
            message =
            "Излязохте успешно"
        });

    }





    // --------------------------------------------------------
    // GET /api/auth/me
    //
    // Връща текущия потребител.
    //
    // Работи само ако има валидна cookie.
    //
    // --------------------------------------------------------

    [HttpGet("me")]

    [Authorize]

    public IActionResult Me()
    {

        return Ok(new
        {

            id =
                int.Parse(
                    User.FindFirstValue(
                        ClaimTypes.NameIdentifier)!),


            email =
                User.Identity!.Name,


            role =
                User.FindFirstValue(
                    ClaimTypes.Role)

        });

    }

}