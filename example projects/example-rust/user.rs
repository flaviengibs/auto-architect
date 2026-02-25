use std::error::Error;
use crate::database::Database;
use crate::validator::Validator;

pub struct User {
    id: Option<u64>,
    username: String,
    email: String,
    password: String,
    is_active: bool,
}

impl User {
    pub fn new() -> Self {
        User {
            id: None,
            username: String::new(),
            email: String::new(),
            password: String::new(),
            is_active: true,
        }
    }

    pub fn create(&mut self, db: &Database, username: &str, email: &str, password: &str) -> Result<(), Box<dyn Error>> {
        if username.is_empty() || email.is_empty() || password.is_empty() {
            return Err("All fields are required".into());
        }

        if !Validator::validate_email(email) {
            return Err("Invalid email format".into());
        }

        let hashed_password = Validator::hash_password(password)?;

        let mut data = std::collections::HashMap::new();
        data.insert("username".to_string(), username.to_string());
        data.insert("email".to_string(), email.to_string());
        data.insert("password".to_string(), hashed_password.clone());
        data.insert("is_active".to_string(), if self.is_active { "1" } else { "0" }.to_string());

        let id = db.insert("users", data)?;

        self.id = Some(id);
        self.username = username.to_string();
        self.email = email.to_string();
        self.password = hashed_password;

        Ok(())
    }

    pub fn find_by_id(&mut self, db: &Database, id: u64) -> Result<(), Box<dyn Error>> {
        if id == 0 {
            return Err("Invalid user ID".into());
        }

        let sql = "SELECT * FROM users WHERE id = ?";
        let results = db.query(sql, vec![&id.to_string()])?;

        if results.is_empty() {
            return Err("User not found".into());
        }

        let user_data = &results[0];
        self.id = Some(id);
        self.username = user_data.get("username").unwrap_or(&String::new()).clone();
        self.email = user_data.get("email").unwrap_or(&String::new()).clone();
        self.is_active = user_data.get("is_active").unwrap_or(&"0".to_string()) == "1";

        Ok(())
    }

    pub fn update(&self, db: &Database, username: Option<&str>, email: Option<&str>) -> Result<(), Box<dyn Error>> {
        if self.id.is_none() {
            return Err("User not loaded".into());
        }

        let mut data = std::collections::HashMap::new();

        if let Some(uname) = username {
            if !uname.is_empty() {
                data.insert("username".to_string(), uname.to_string());
            }
        }

        if let Some(em) = email {
            if !em.is_empty() {
                if !Validator::validate_email(em) {
                    return Err("Invalid email format".into());
                }
                data.insert("email".to_string(), em.to_string());
            }
        }

        if data.is_empty() {
            return Err("Nothing to update".into());
        }

        let where_clause = format!("id = {}", self.id.unwrap());
        db.update("users", data, &where_clause)?;

        Ok(())
    }

    pub fn delete(&self, db: &Database) -> Result<(), Box<dyn Error>> {
        if self.id.is_none() {
            return Err("User not loaded".into());
        }

        let mut data = std::collections::HashMap::new();
        data.insert("is_active".to_string(), "0".to_string());

        let where_clause = format!("id = {}", self.id.unwrap());
        db.update("users", data, &where_clause)?;

        Ok(())
    }

    pub fn get_username(&self) -> &str {
        &self.username
    }

    pub fn get_email(&self) -> &str {
        &self.email
    }

    pub fn is_active(&self) -> bool {
        self.is_active
    }
}
