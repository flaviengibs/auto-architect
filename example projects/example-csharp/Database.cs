using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ExampleApp
{
    public class Database
    {
        private readonly List<User> _users = new List<User>();
        private int _nextId = 1;

        public Database()
        {
            // Initialize with some test data
            _users.Add(new User
            {
                Id = _nextId++,
                Username = "admin",
                Email = "admin@example.com",
                Password = "hashed_password",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        public async Task SaveUserAsync(User user)
        {
            user.Id = _nextId++;
            _users.Add(user);
            await Task.CompletedTask;
        }

        public async Task<User> GetUserByIdAsync(int id)
        {
            await Task.CompletedTask;
            return _users.FirstOrDefault(u => u.Id == id);
        }

        public async Task UpdateUserAsync(User user)
        {
            var existingUser = _users.FirstOrDefault(u => u.Id == user.Id);
            if (existingUser != null)
            {
                existingUser.Username = user.Username;
                existingUser.Email = user.Email;
                existingUser.IsActive = user.IsActive;
            }
            await Task.CompletedTask;
        }

        public async Task DeleteUserAsync(int id)
        {
            var user = _users.FirstOrDefault(u => u.Id == id);
            if (user != null)
            {
                user.IsActive = false;
            }
            await Task.CompletedTask;
        }

        public IQueryable<User> GetUsersQuery()
        {
            return _users.AsQueryable();
        }
    }

    public class EmailService
    {
        public async Task SendWelcomeEmailAsync(string email)
        {
            Console.WriteLine($"Sending welcome email to {email}");
            await Task.Delay(100); // Simulate async operation
        }

        public async Task SendPasswordResetEmailAsync(string email, string token)
        {
            Console.WriteLine($"Sending password reset email to {email}");
            await Task.Delay(100);
        }
    }
}
