require 'sqlite3'

module App
  class Database
    attr_reader :connection

    def initialize(database_path)
      @database_path = database_path
      @connection = nil
    end

    def connect
      begin
        @connection = SQLite3::Database.new(@database_path)
        @connection.results_as_hash = true
        true
      rescue SQLite3::Exception => e
        puts "Connection failed: #{e.message}"
        false
      end
    end

    def query(sql, params = [])
      connect unless @connection

      begin
        @connection.execute(sql, params)
      rescue SQLite3::Exception => e
        puts "Query failed: #{e.message}"
        nil
      end
    end

    def insert(table, data)
      columns = data.keys.join(', ')
      placeholders = (['?'] * data.size).join(', ')
      sql = "INSERT INTO #{table} (#{columns}) VALUES (#{placeholders})"

      begin
        @connection.execute(sql, data.values)
        @connection.last_insert_row_id
      rescue SQLite3::Exception => e
        puts "Insert failed: #{e.message}"
        nil
      end
    end

    def update(table, data, where_clause, where_params = [])
      set_clause = data.keys.map { |key| "#{key} = ?" }.join(', ')
      sql = "UPDATE #{table} SET #{set_clause} WHERE #{where_clause}"

      begin
        @connection.execute(sql, data.values + where_params)
        @connection.changes
      rescue SQLite3::Exception => e
        puts "Update failed: #{e.message}"
        0
      end
    end

    def delete(table, where_clause, where_params = [])
      sql = "DELETE FROM #{table} WHERE #{where_clause}"

      begin
        @connection.execute(sql, where_params)
        @connection.changes
      rescue SQLite3::Exception => e
        puts "Delete failed: #{e.message}"
        0
      end
    end

    def disconnect
      @connection&.close
      @connection = nil
    end
  end
end
