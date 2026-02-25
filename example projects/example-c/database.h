#ifndef DATABASE_H
#define DATABASE_H

typedef struct Database Database;

Database* db_create(const char* connection_string);
int db_connect(Database* db);
int db_query(Database* db, const char* sql, char*** results, int* row_count);
int db_insert(Database* db, const char* table, const char** columns, const char** values, int count);
int db_update(Database* db, const char* table, const char** columns, const char** values, int count, const char* where_clause);
int db_delete(Database* db, const char* table, const char* where_clause);
void db_disconnect(Database* db);
void db_destroy(Database* db);
int db_is_connected(Database* db);

#endif
