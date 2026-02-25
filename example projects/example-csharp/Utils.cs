using System;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace ExampleApp
{
    public static class Utils
    {
        // Validate email format
        public static bool ValidateEmail(string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return false;
            }

            var emailRegex = new Regex(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");
            return emailRegex.IsMatch(email);
        }

        // Hash password using SHA256
        public static string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var bytes = Encoding.UTF8.GetBytes(password);
                var hash = sha256.ComputeHash(bytes);
                return Convert.ToBase64String(hash);
            }
        }

        // Validate username
        public static bool ValidateUsername(string username)
        {
            if (string.IsNullOrEmpty(username))
            {
                return false;
            }

            if (username.Length < 3 || username.Length > 20)
            {
                return false;
            }

            var usernameRegex = new Regex(@"^[a-zA-Z0-9_]+$");
            return usernameRegex.IsMatch(username);
        }

        // Generate random token
        public static string GenerateToken(int length = 32)
        {
            var random = new Random();
            var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            var token = new StringBuilder();

            for (int i = 0; i < length; i++)
            {
                token.Append(chars[random.Next(chars.Length)]);
            }

            return token.ToString();
        }
    }
}
