require 'digest'

module App
  module Validator
    EMAIL_REGEX = /\A[\w+\-.]+@[a-z\d\-]+(\.[a-z\d\-]+)*\.[a-z]+\z/i
    USERNAME_REGEX = /\A[a-zA-Z0-9_]+\z/

    def self.validate_email(email)
      return false if email.nil? || email.empty?
      !!(email =~ EMAIL_REGEX)
    end

    def self.hash_password(password)
      raise ArgumentError, 'Password must be at least 8 characters' if password.length < 8
      Digest::SHA256.hexdigest(password)
    end

    def self.verify_password(password, hash)
      Digest::SHA256.hexdigest(password) == hash
    end

    def self.sanitize_string(input)
      return '' if input.nil? || input.empty?

      sanitized = input.strip
      sanitized.gsub(/[<>]/, '')
    end

    def self.validate_username(username)
      return false if username.nil? || username.empty?
      return false if username.length < 3 || username.length > 20
      !!(username =~ USERNAME_REGEX)
    end

    def self.validate_password_strength(password)
      return false if password.length < 8

      has_uppercase = password =~ /[A-Z]/
      has_lowercase = password =~ /[a-z]/
      has_digit = password =~ /[0-9]/
      has_special = password =~ /[!@#$%^&*(),.?":{}|<>]/

      [has_uppercase, has_lowercase, has_digit, has_special].count(true) >= 3
    end
  end
end
