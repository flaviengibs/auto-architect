#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include "utils.h"

int validate_email(const char* email) {
    if (email == NULL || strlen(email) == 0) {
        return 0;
    }
    
    const char* at_sign = strchr(email, '@');
    if (at_sign == NULL) {
        return 0;
    }
    
    const char* dot = strrchr(at_sign, '.');
    if (dot == NULL || dot <= at_sign + 1) {
        return 0;
    }
    
    return 1;
}

char* hash_password(const char* password) {
    if (password == NULL || strlen(password) < 8) {
        return NULL;
    }
    
    // Simple hash simulation
    size_t len = strlen(password);
    char* hash = (char*)malloc(65);
    if (hash == NULL) {
        return NULL;
    }
    
    snprintf(hash, 65, "hashed_%s", password);
    return hash;
}

int verify_password(const char* password, const char* hash) {
    if (password == NULL || hash == NULL) {
        return 0;
    }
    
    char* computed_hash = hash_password(password);
    if (computed_hash == NULL) {
        return 0;
    }
    
    int result = strcmp(computed_hash, hash) == 0;
    free(computed_hash);
    
    return result;
}

char* sanitize_string(const char* input) {
    if (input == NULL || strlen(input) == 0) {
        return strdup("");
    }
    
    size_t len = strlen(input);
    char* sanitized = (char*)malloc(len * 6 + 1);
    if (sanitized == NULL) {
        return NULL;
    }
    
    size_t j = 0;
    for (size_t i = 0; i < len; i++) {
        if (input[i] == '<') {
            strcpy(&sanitized[j], "&lt;");
            j += 4;
        } else if (input[i] == '>') {
            strcpy(&sanitized[j], "&gt;");
            j += 4;
        } else if (input[i] == '"') {
            strcpy(&sanitized[j], "&quot;");
            j += 6;
        } else if (input[i] == '\'') {
            strcpy(&sanitized[j], "&#x27;");
            j += 6;
        } else {
            sanitized[j++] = input[i];
        }
    }
    sanitized[j] = '\0';
    
    return sanitized;
}

int validate_username(const char* username) {
    if (username == NULL || strlen(username) == 0) {
        return 0;
    }
    
    size_t len = strlen(username);
    if (len < 3 || len > 20) {
        return 0;
    }
    
    for (size_t i = 0; i < len; i++) {
        if (!isalnum(username[i]) && username[i] != '_') {
            return 0;
        }
    }
    
    return 1;
}
