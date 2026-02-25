<?php

namespace App\Utils;

class Validator
{
    public static function validateEmail($email)
    {
        if (empty($email)) {
            return false;
        }

        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    public static function hashPassword($password)
    {
        if (strlen($password) < 8) {
            throw new \InvalidArgumentException("Password must be at least 8 characters");
        }

        return password_hash($password, PASSWORD_BCRYPT);
    }

    public static function verifyPassword($password, $hash)
    {
        return password_verify($password, $hash);
    }

    public static function sanitizeString($input)
    {
        if (empty($input)) {
            return '';
        }

        $sanitized = trim($input);
        $sanitized = stripslashes($sanitized);
        $sanitized = htmlspecialchars($sanitized, ENT_QUOTES, 'UTF-8');

        return $sanitized;
    }

    public static function validateUsername($username)
    {
        if (empty($username)) {
            return false;
        }

        if (strlen($username) < 3 || strlen($username) > 20) {
            return false;
        }

        return preg_match('/^[a-zA-Z0-9_]+$/', $username) === 1;
    }
}
