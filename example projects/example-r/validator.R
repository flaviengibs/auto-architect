library(digest)

validate_email <- function(email) {
  if (is.null(email) || nchar(email) == 0) {
    return(FALSE)
  }
  
  email_regex <- "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
  return(grepl(email_regex, email))
}

hash_password <- function(password) {
  if (nchar(password) < 8) {
    stop("Password must be at least 8 characters")
  }
  
  return(digest(password, algo = "sha256"))
}

verify_password <- function(password, hash) {
  tryCatch({
    computed_hash <- hash_password(password)
    return(computed_hash == hash)
  }, error = function(e) {
    return(FALSE)
  })
}

sanitize_string <- function(input) {
  if (is.null(input) || nchar(input) == 0) {
    return("")
  }
  
  sanitized <- trimws(input)
  sanitized <- gsub("<", "&lt;", sanitized)
  sanitized <- gsub(">", "&gt;", sanitized)
  sanitized <- gsub('"', "&quot;", sanitized)
  sanitized <- gsub("'", "&#x27;", sanitized)
  
  return(sanitized)
}

validate_username <- function(username) {
  if (is.null(username) || nchar(username) == 0) {
    return(FALSE)
  }
  
  if (nchar(username) < 3 || nchar(username) > 20) {
    return(FALSE)
  }
  
  username_regex <- "^[a-zA-Z0-9_]+$"
  return(grepl(username_regex, username))
}

validate_password_strength <- function(password) {
  if (nchar(password) < 8) {
    return(FALSE)
  }
  
  has_uppercase <- grepl("[A-Z]", password)
  has_lowercase <- grepl("[a-z]", password)
  has_digit <- grepl("[0-9]", password)
  has_special <- grepl("[!@#$%^&*(),.?\":{}|<>]", password)
  
  criteria_count <- sum(has_uppercase, has_lowercase, has_digit, has_special)
  return(criteria_count >= 3)
}

check_password_complexity <- function(password) {
  results <- list(
    length_ok = nchar(password) >= 8,
    has_uppercase = grepl("[A-Z]", password),
    has_lowercase = grepl("[a-z]", password),
    has_digit = grepl("[0-9]", password),
    has_special = grepl("[!@#$%^&*(),.?\":{}|<>]", password)
  )
  
  results$score <- sum(unlist(results))
  results$is_strong <- results$score >= 4
  
  return(results)
}
