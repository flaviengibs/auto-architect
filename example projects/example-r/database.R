library(DBI)
library(RSQLite)

Database <- setRefClass("Database",
  fields = list(
    connection_string = "character",
    connection = "ANY"
  ),
  
  methods = list(
    initialize = function(conn_str) {
      connection_string <<- conn_str
      connection <<- NULL
    },
    
    connect = function() {
      tryCatch({
        if (nchar(connection_string) == 0) {
          stop("Connection string is empty")
        }
        
        connection <<- dbConnect(RSQLite::SQLite(), connection_string)
        return(TRUE)
      }, error = function(e) {
        message("Connection failed: ", e$message)
        return(FALSE)
      })
    },
    
    query = function(sql, params = list()) {
      if (is.null(connection)) {
        connect()
      }
      
      tryCatch({
        if (length(params) > 0) {
          result <- dbGetQuery(connection, sql, params = params)
        } else {
          result <- dbGetQuery(connection, sql)
        }
        return(result)
      }, error = function(e) {
        message("Query failed: ", e$message)
        return(NULL)
      })
    },
    
    insert = function(table, data) {
      if (is.null(connection)) {
        connect()
      }
      
      if (nchar(table) == 0 || length(data) == 0) {
        return(FALSE)
      }
      
      tryCatch({
        columns <- paste(names(data), collapse = ", ")
        placeholders <- paste(rep("?", length(data)), collapse = ", ")
        sql <- sprintf("INSERT INTO %s (%s) VALUES (%s)", table, columns, placeholders)
        
        dbExecute(connection, sql, params = unlist(data))
        return(TRUE)
      }, error = function(e) {
        message("Insert failed: ", e$message)
        return(FALSE)
      })
    },
    
    update = function(table, data, where_clause) {
      if (is.null(connection) || nchar(table) == 0 || nchar(where_clause) == 0) {
        return(FALSE)
      }
      
      tryCatch({
        set_clause <- paste(names(data), "= ?", collapse = ", ")
        sql <- sprintf("UPDATE %s SET %s WHERE %s", table, set_clause, where_clause)
        
        dbExecute(connection, sql, params = unlist(data))
        return(TRUE)
      }, error = function(e) {
        message("Update failed: ", e$message)
        return(FALSE)
      })
    },
    
    delete_record = function(table, where_clause) {
      if (is.null(connection) || nchar(table) == 0 || nchar(where_clause) == 0) {
        return(FALSE)
      }
      
      tryCatch({
        sql <- sprintf("DELETE FROM %s WHERE %s", table, where_clause)
        dbExecute(connection, sql)
        return(TRUE)
      }, error = function(e) {
        message("Delete failed: ", e$message)
        return(FALSE)
      })
    },
    
    disconnect = function() {
      if (!is.null(connection)) {
        dbDisconnect(connection)
        connection <<- NULL
      }
    },
    
    is_connected = function() {
      return(!is.null(connection) && dbIsValid(connection))
    }
  )
)
