source("database.R")
source("validator.R")

User <- setRefClass("User",
  fields = list(
    id = "numeric",
    username = "character",
    email = "character",
    password = "character",
    is_active = "logical"
  ),
  
  methods = list(
    initialize = function() {
      id <<- 0
      username <<- ""
      email <<- ""
      password <<- ""
      is_active <<- TRUE
    },
    
    create = function(db, uname, em, pass) {
      if (nchar(uname) == 0 || nchar(em) == 0 || nchar(pass) == 0) {
        stop("All fields are required")
      }
      
      if (!validate_email(em)) {
        stop("Invalid email format")
      }
      
      hashed_password <- hash_password(pass)
      
      data <- list(
        username = uname,
        email = em,
        password = hashed_password,
        is_active = as.integer(is_active)
      )
      
      if (db$insert("users", data)) {
        username <<- uname
        email <<- em
        password <<- hashed_password
        return(TRUE)
      }
      
      return(FALSE)
    },
    
    find_by_id = function(db, user_id) {
      if (user_id <= 0) {
        stop("Invalid user ID")
      }
      
      sql <- "SELECT * FROM users WHERE id = ?"
      result <- db$query(sql, list(user_id))
      
      if (!is.null(result) && nrow(result) > 0) {
        user_data <- result[1, ]
        id <<- user_data$id
        username <<- user_data$username
        email <<- user_data$email
        is_active <<- user_data$is_active == 1
        return(.self)
      }
      
      return(NULL)
    },
    
    update = function(db, uname = NULL, em = NULL) {
      if (id == 0) {
        stop("User not loaded")
      }
      
      updates <- list()
      
      if (!is.null(uname) && nchar(uname) > 0) {
        updates$username <- uname
      }
      
      if (!is.null(em) && nchar(em) > 0) {
        if (!validate_email(em)) {
          stop("Invalid email format")
        }
        updates$email <- em
      }
      
      if (length(updates) == 0) {
        return(FALSE)
      }
      
      where_clause <- sprintf("id = %d", id)
      return(db$update("users", updates, where_clause))
    },
    
    delete = function(db) {
      if (id == 0) {
        stop("User not loaded")
      }
      
      data <- list(is_active = 0)
      where_clause <- sprintf("id = %d", id)
      return(db$update("users", data, where_clause))
    },
    
    get_username = function() {
      return(username)
    },
    
    get_email = function() {
      return(email)
    },
    
    is_user_active = function() {
      return(is_active)
    }
  )
)
