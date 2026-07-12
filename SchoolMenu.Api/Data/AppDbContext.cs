using Microsoft.EntityFrameworkCore;
using SchoolMenu.Api.Models;

namespace SchoolMenu.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Employee> Employees { get; set; }

        public DbSet<Menu> Menus { get; set; }

        public DbSet<MenuItem> MenuItems { get; set; }

        public DbSet<Role> Roles { get; set; }
        public DbSet<Category> Categories { get; set; }
    }
}