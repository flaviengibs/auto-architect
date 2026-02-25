use std::error::Error;
use regex::Regex;

pub struct Validator;

impl Validator {
    pub fn validate_email(email: &str) -> bool {
        if email.is_empty() {
            return false;
        }

        let email_regex = Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").unwrap();
        email_regex.is_match(email)
    }

    pub fn hash_password(password: &str) -> Result<String, Box<dyn Error>> {
        if password.len() < 8 {
            return Err("Password must be at least 8 characters".into());
        }

        // Simulate password hashing
        let hash = format!("hashed_{}", password);
        Ok(hash)
    }

    pub fn verify_password(password: &str, hash: &str) -> bool {
        let expected_hash = format!("hashed_{}", password);
        expected_hash == hash
    }

    pub fn sanitize_string(input: &str) -> String {
        if input.is_empty() {
            return String::new();
        }

        input.trim()
            .replace('<', "&lt;")
            .replace('>', "&gt;")
            .replace('"', "&quot;")
            .replace('\'', "&#x27;")
    }

    pub fn validate_username(username: &str) -> bool {
        if username.is_empty() {
            return false;
        }

        if username.len() < 3 || username.len() > 20 {
            return false;
        }

        let username_regex = Regex::new(r"^[a-zA-Z0-9_]+$").unwrap();
        username_regex.is_match(username)
    }

    pub fn validate_password_strength(password: &str) -> bool {
        if password.len() < 8 {
            return false;
        }

        let has_uppercase = password.chars().any(|c| c.is_uppercase());
        let has_lowercase = password.chars().any(|c| c.is_lowercase());
        let has_digit = password.chars().any(|c| c.is_numeric());
        let has_special = password.chars().any(|c| !c.is_alphanumeric());

        [has_uppercase, has_lowercase, has_digit, has_special]
            .iter()
            .filter(|&&x| x)
            .count() >= 3
    }
}
