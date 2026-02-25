require_relative 'database'
require_relative 'validator'

module App
  class User
    attr_reader :id, :username, :email
    attr_accessor :is_active

    def initialize(database)
      @db = database
      @id = nil
      @username = nil
      @email = nil
      @password = nil
      @is_active = true
    end

    def create(username, email, password)
      raise ArgumentError, 'All fields are required' if username.empty? || email.empty? || password.empty?
      raise ArgumentError, 'Invalid email format' unless Validator.validate_email(email)

      hashed_password = Validator.hash_password(password)

      data = {
        username: username,
        email: email,
        password: hashed_password,
        is_active: @is_active ? 1 : 0,
        created_at: Time.now.to_s
      }

      result = @db.insert('users', data)

      if result
        @id = result
        @username = username
        @email = email
        @password = hashed_password
        true
      else
        false
      end
    end

    def find_by_id(id)
      raise ArgumentError, 'Invalid user ID' if id <= 0

      sql = 'SELECT * FROM users WHERE id = ?'
      result = @db.query(sql, [id])

      if result && !result.empty?
        user_data = result.first
        @id = user_data['id']
        @username = user_data['username']
        @email = user_data['email']
        @is_active = user_data['is_active'] == 1
        self
      else
        nil
      end
    end

    def update(username: nil, email: nil)
      raise 'User not loaded' unless @id

      updates = []
      params = []

      if username && !username.empty?
        updates << 'username = ?'
        params << username
      end

      if email && !email.empty?
        raise ArgumentError, 'Invalid email format' unless Validator.validate_email(email)
        updates << 'email = ?'
        params << email
      end

      return false if updates.empty?

      params << @id
      @db.update('users', updates.join(', '), 'id = ?', params)
    end

    def delete
      raise 'User not loaded' unless @id

      @db.update('users', { is_active: 0 }, 'id = ?', [@id])
    end

    def active?
      @is_active
    end
  end
end
