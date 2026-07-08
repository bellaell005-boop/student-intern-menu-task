using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using SchoolMenu.Api.Data;
using System.Text.Json.Serialization;

// ============================================================
//  Program.cs - "стартерът" на приложението.
//  Тук се сглобява всичко: база данни, вход (auth), Swagger
//  и сервирането на HTML файловете от папка wwwroot/.
//
//  ГОТОВ Е - не е нужно да го променяш (но го прочети!).
// ============================================================

var builder = WebApplication.CreateBuilder(args);

// --- 1) БАЗА ДАННИ: SQLite = цялата база е ЕДИН файл (menu.db) ---
// Нищо не се инсталира. Пътят е "закован" към папката на проекта,
// за да няма проблем откъдето и да стартираш приложението.
var dbPath = Path.Combine(builder.Environment.ContentRootPath, "menu.db");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

// Ако някой ден трябва SQL Server, се сменя САМО горният ред с:
//   options.UseSqlServer(builder.Configuration.GetConnectionString("Default"));
// Нищо друго в проекта не се пипа - това е силата на EF Core.

// --- 2) ВХОД: cookie-based sessions ---
// След успешен login сървърът дава на браузъра "бисквитка" (cookie).
// Браузърът я праща сам при всяка заявка и така сървърът знае кой си.
builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.ExpireTimeSpan = TimeSpan.FromHours(8);   // колкото един учебен ден

        // По подразбиране ASP.NET пренасочва към login СТРАНИЦА.
        // Ние сме API и искаме чисти HTTP кодове, които fetch() разбира:
        //   401 = "не си влязъл"   /   403 = "влязъл си, но нямаш право"
        options.Events.OnRedirectToLogin = ctx =>
            { ctx.Response.StatusCode = 401; return Task.CompletedTask; };
        options.Events.OnRedirectToAccessDenied = ctx =>
            { ctx.Response.StatusCode = 403; return Task.CompletedTask; };
    });

builder.Services.AddAuthorization();

// --- 3) Контролери + Swagger (тест страница за API-то) ---
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Employee <-> Menu <-> MenuItem <-> Category имат навигации
        // и в двете посоки (напр. Menu.MenuItems И MenuItem.Menu).
        // Когато EF Core върне свързани обекти (.Include(...)), той
        // автоматично "закача" връзката в двете посоки, а това
        // прави JSON обект, който сочи сам към себе си.
        // Без този ред всяка заявка с Include() гърми с
        // "A possible object cycle was detected".
        options.JsonSerializerOptions.ReferenceHandler =
            ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS не ни трябва: HTML/JS файловете се сервират от СЪЩИЯ сървър
// (папка wwwroot/). Отваряй страниците през http://localhost:5000,
// а НЕ през Live Server на VS Code - иначе ще видиш CORS грешки.

var app = builder.Build();

// --- 4) При старт: създай базата (ако я няма) и сложи примерни данни ---
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();   // няма menu.db? -> създава файла с всички таблици
    SeedData.Run(db);              // виж Data/SeedData.cs
}

// --- 5) Middleware pipeline (редът тук е ВАЖЕН!) ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();       // отвори http://localhost:5000/swagger
}

app.UseDefaultFiles();        // "/" -> wwwroot/index.html
app.UseStaticFiles();         // сервира wwwroot/ (HTML, CSS, JS)

app.UseAuthentication();      // "Кой си?"        (чете бисквитката)
app.UseAuthorization();       // "Имаш ли право?" (проверява ролята)

app.MapControllers();         // включва всички класове от Controllers/

app.Run();                    // Старт! -> http://localhost:5000
