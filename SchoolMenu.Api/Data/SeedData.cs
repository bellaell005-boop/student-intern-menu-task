using SchoolMenu.Api.Models;

namespace SchoolMenu.Api.Data;

// ============================================================
//  SeedData = първоначални (примерни) данни.
//
//  Изпълнява се ВЕДНЪЖ при стартиране (виж Program.cs).
//  Ако базата вече има данни - не прави нищо.
//
//  Искаш други примерни данни? Промени ги тук, после спри
//  приложението, изтрий файла menu.db и стартирай пак.
// ============================================================

public static class SeedData
{
    public static void Run(AppDbContext db)
    {
        // Ако вече има служители, базата е пълна -> излизаме
        if (db.Employees.Any()) return;

        // ------------------------------------------------------
        // 1) Роли
        // ------------------------------------------------------

        var kitchenRole = new Role
        {
            Name = "Kitchen"
        };

        var canteenRole = new Role
        {
            Name = "Canteen"
        };

        db.Roles.AddRange(kitchenRole, canteenRole);

        // ------------------------------------------------------
        // 2) Служители
        // ------------------------------------------------------

        var kitchenEmployee = new Employee
        {
            FirstName = "School",
            LastName = "Kitchen",
            Email = "kitchen@school.bg",

            // В базата НЕ се пази истинската парола.
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("kitchen123"),

            Role = kitchenRole
        };

        var canteenEmployee = new Employee
        {
            FirstName = "School",
            LastName = "Canteen",
            Email = "canteen@school.bg",

            PasswordHash = BCrypt.Net.BCrypt.HashPassword("canteen123"),

            Role = canteenRole
        };

        db.Employees.AddRange(kitchenEmployee, canteenEmployee);

        // ------------------------------------------------------
        // 3) Категории
        // ------------------------------------------------------

        var soupCategory = new Category
        {
            CategoryName = "Супа"
        };

        var mainCategory = new Category
        {
            CategoryName = "Основно"
        };

        var dessertCategory = new Category
        {
            CategoryName = "Десерт"
        };

        db.Categories.AddRange(
            soupCategory,
            mainCategory,
            dessertCategory);

        // ------------------------------------------------------
        // 4) Меню за днес
        // ------------------------------------------------------

        var todayMenu = new Menu
        {
            Date = DateTime.Today,
            Day = DateTime.Today.DayOfWeek.ToString(),
            Category = mainCategory,
            Employee = kitchenEmployee,
            Notes = "Добре дошли! Това меню е добавено автоматично от Data/SeedData.cs"
        };

        db.Menus.Add(todayMenu);

        // ------------------------------------------------------
        // 5) Примерни ястия
        // ------------------------------------------------------

        var bobChorba = new MenuItem
        {
            Menu = todayMenu,
            Category = soupCategory,
            Name = "Боб чорба",
            Type = "soup",
            Description = "Домашна боб чорба",
            Allergens = "целина",
            Ingredients = "боб, моркови, лук, домати",
            Quantity = "350 мл"
        };

        var pileshkaSupa = new MenuItem
        {
            Menu = todayMenu,
            Category = soupCategory,
            Name = "Пилешка супа",
            Type = "soup",
            Description = "Домашна пилешка супа",
            Allergens = "яйца, глутен",
            Ingredients = "пиле, фиде, моркови",
            Quantity = "350 мл"
        };

        var tarator = new MenuItem
        {
            Menu = todayMenu,
            Category = soupCategory,
            Name = "Таратор",
            Type = "soup",
            Description = "Студена супа",
            Allergens = "мляко",
            Ingredients = "кисело мляко, краставици, копър",
            Quantity = "300 мл"
        };

        var musaka = new MenuItem
        {
            Menu = todayMenu,
            Category = mainCategory,
            Name = "Мусака",
            Type = "main",
            Description = "Домашна мусака",
            Allergens = "мляко, яйца",
            Ingredients = "картофи, кайма",
            Quantity = "400 г"
        };

        var pileSOriz = new MenuItem
        {
            Menu = todayMenu,
            Category = mainCategory,
            Name = "Пиле с ориз",
            Type = "main",
            Description = "Пиле с ориз",
            Allergens = "",
            Ingredients = "пилешко месо, ориз",
            Quantity = "400 г"
        };

        var spagetiBologneze = new MenuItem
        {
            Menu = todayMenu,
            Category = mainCategory,
            Name = "Спагети Болонезе",
            Type = "main",
            Description = "Спагети с доматен сос",
            Allergens = "глутен",
            Ingredients = "спагети, кайма, домати",
            Quantity = "380 г"
        };

        var kiseloMlyako = new MenuItem
        {
            Menu = todayMenu,
            Category = dessertCategory,
            Name = "Кисело мляко с мед",
            Type = "dessert",
            Description = "Кисело мляко с мед",
            Allergens = "мляко",
            Ingredients = "кисело мляко, мед",
            Quantity = "200 г"
        };

        var yabalkovShtrudel = new MenuItem
        {
            Menu = todayMenu,
            Category = dessertCategory,
            Name = "Ябълков щрудел",
            Type = "dessert",
            Description = "Домашен щрудел",
            Allergens = "глутен, яйца, мляко",
            Ingredients = "ябълки, кори, масло",
            Quantity = "180 г"
        };

        var biskvitenaTorta = new MenuItem
        {
            Menu = todayMenu,
            Category = dessertCategory,
            Name = "Бисквитена торта",
            Type = "dessert",
            Description = "Домашна торта",
            Allergens = "глутен, мляко",
            Ingredients = "бисквити, мляко, какао",
            Quantity = "200 г"
        };

        db.MenuItems.AddRange(
            bobChorba,
            pileshkaSupa,
            tarator,
            musaka,
            pileSOriz,
            spagetiBologneze,
            kiseloMlyako,
            yabalkovShtrudel,
            biskvitenaTorta);

        // Чак този ред записва всичко по-горе във файла menu.db!
        db.SaveChanges();
    }
}
