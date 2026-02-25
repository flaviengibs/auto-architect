using System;
using System.Collections.Generic;
using System.Linq;

namespace ExampleApp
{
    // User model
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // User manager with multiple responsibilities (anti-pattern)
    public class UserManager
    {
        private readonly Database _database;
        private readonly EmailService _emailService;

        public UserManager(Database database, EmailService emailService)
        {
            _database = database;
            _emailService = emailService;
        }

        // Create user with validation
        public async Task<User> CreateUserAsync(string username, string email, string password)
        {
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            {
                throw new ArgumentException("All fields are required");
            }

            if (!Utils.ValidateEmail(email))
            {
                throw new ArgumentException("Invalid email format");
            }

            var hashedPassword = Utils.HashPassword(password);

            var user = new User
            {
                Username = username,
                Email = email,
                Password = hashedPassword,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _database.SaveUserAsync(user);
            await _emailService.SendWelcomeEmailAsync(user.Email);

            return user;
        }

        // Get user by ID
        public async Task<User> GetUserAsync(int id)
        {
            if (id <= 0)
            {
                throw new ArgumentException("Invalid user ID");
            }

            return await _database.GetUserByIdAsync(id);
        }

        // Update user
        public async Task UpdateUserAsync(int id, string username, string email)
        {
            if (id <= 0)
            {
                throw new ArgumentException("Invalid user ID");
            }

            var user = await GetUserAsync(id);
            
            if (!string.IsNullOrEmpty(username))
            {
                user.Username = username;
            }

            if (!string.IsNullOrEmpty(email))
            {
                if (!Utils.ValidateEmail(email))
                {
                    throw new ArgumentException("Invalid email format");
                }
                user.Email = email;
            }

            await _database.UpdateUserAsync(user);
        }

        // Delete user
        public async Task DeleteUserAsync(int id)
        {
            if (id <= 0)
            {
                throw new ArgumentException("Invalid user ID");
            }

            await _database.DeleteUserAsync(id);
        }

        // Complex method with high cognitive complexity
        public async Task<List<User>> SearchUsersAsync(
            string username, 
            string email, 
            bool? isActive, 
            DateTime? createdAfter,
            DateTime? createdBefore,
            int page,
            int pageSize,
            string sortBy)
        {
            var query = _database.GetUsersQuery();

            if (!string.IsNullOrEmpty(username))
            {
                query = query.Where(u => u.Username.Contains(username));
            }

            if (!string.IsNullOrEmpty(email))
            {
                query = query.Where(u => u.Email.Contains(email));
            }

            if (isActive.HasValue)
            {
                query = query.Where(u => u.IsActive == isActive.Value);
            }

            if (createdAfter.HasValue)
            {
                query = query.Where(u => u.CreatedAt >= createdAfter.Value);
            }

            if (createdBefore.HasValue)
            {
                query = query.Where(u => u.CreatedAt <= createdBefore.Value);
            }

            // Sorting
            if (sortBy == "username")
            {
                query = query.OrderBy(u => u.Username);
            }
            else if (sortBy == "email")
            {
                query = query.OrderBy(u => u.Email);
            }
            else if (sortBy == "created")
            {
                query = query.OrderBy(u => u.CreatedAt);
            }
            else
            {
                query = query.OrderBy(u => u.Id);
            }

            // Pagination
            query = query.Skip((page - 1) * pageSize).Take(pageSize);

            return await query.ToListAsync();
        }
    }

    class Program
    {
        static async Task Main(string[] args)
        {
            var database = new Database();
            var emailService = new EmailService();
            var userManager = new UserManager(database, emailService);

            try
            {
                var user = await userManager.CreateUserAsync("john", "john@example.com", "password123");
                Console.WriteLine($"User created: {user.Username}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
            }
        }
    }
}
