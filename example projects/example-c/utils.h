#ifndef UTILS_H
#define UTILS_H

int validate_email(const char* email);
char* hash_password(const char* password);
int verify_password(const char* password, const char* hash);
char* sanitize_string(const char* input);
int validate_username(const char* username);

#endif
