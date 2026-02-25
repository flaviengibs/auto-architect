<?php

namespace App\Models;

use App\Database\Database;
use App\Utils\Validator;

class User
{
    private $db;
    private $id;
    private $username;
    private $email;
    private $password;
    private $isActive;

    public function __construct(Database $db)
    {
        $this->db = $db;
        $this->isActive = true;
    }

    public function create($username, $email, $password)
    {
        if (empty($username) || empty($email) || empty($password)) {
            throw new \InvalidArgumentException("All fields are required");
        }

        if (!Validator::validateEmail($email)) {
            throw new \InvalidArgumentException("Invalid email format");
        }

        $hashedPassword = Validator::hashPassword($password);

        $data = [
            'username' => $username,
            'email' => $email,
            'password' => $hashedPassword,
            'is_active' => $this->isActive ? 1 : 0,
            'created_at' => date('Y-m-d H:i:s')
        ];

        if ($this->db->insert('users', $data)) {
            $this->username = $username;
            $this->email = $email;
            $this->password = $hashedPassword;
            return true;
        }

        return false;
    }

    public function findById($id)
    {
        if ($id <= 0) {
            throw new \InvalidArgumentException("Invalid user ID");
        }

        $sql = "SELECT * FROM users WHERE id = :id";
        $result = $this->db->query($sql, ['id' => $id]);

        if ($result && count($result) > 0) {
            $user = $result[0];
            $this->id = $user['id'];
            $this->username = $user['username'];
            $this->email = $user['email'];
            $this->isActive = $user['is_active'] == 1;
            return $this;
        }

        return null;
    }

    public function update($username, $email)
    {
        if (!$this->id) {
            throw new \Exception("User not loaded");
        }

        $updates = [];
        $params = ['id' => $this->id];

        if (!empty($username)) {
            $updates[] = "username = :username";
            $params['username'] = $username;
        }

        if (!empty($email)) {
            if (!Validator::validateEmail($email)) {
                throw new \InvalidArgumentException("Invalid email format");
            }
            $updates[] = "email = :email";
            $params['email'] = $email;
        }

        if (empty($updates)) {
            return false;
        }

        $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = :id";
        return $this->db->query($sql, $params);
    }

    public function delete()
    {
        if (!$this->id) {
            throw new \Exception("User not loaded");
        }

        $sql = "UPDATE users SET is_active = 0 WHERE id = :id";
        return $this->db->query($sql, ['id' => $this->id]);
    }

    public function getUsername()
    {
        return $this->username;
    }

    public function getEmail()
    {
        return $this->email;
    }

    public function isActive()
    {
        return $this->isActive;
    }
}
