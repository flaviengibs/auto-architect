package com.example.app

import java.sql.Connection
import java.sql.DriverManager
import java.sql.ResultSet

class Database(private val connectionString: String) {
    private var connection: Connection? = null

    fun connect(): Boolean {
        return try {
            if (connectionString.isEmpty()) {
                throw IllegalArgumentException("Connection string is empty")
            }
            connection = DriverManager.getConnection(connectionString)
            true
        } catch (e: Exception) {
            println("Connection failed: ${e.message}")
            false
        }
    }

    fun query(sql: String, params: List<Any> = emptyList()): List<Map<String, Any>>? {
        if (connection == null) {
            connect()
        }

        return try {
            val statement = connection?.prepareStatement(sql)
            params.forEachIndexed { index, param ->
                statement?.setObject(index + 1, param)
            }

            val resultSet = statement?.executeQuery()
            val results = mutableListOf<Map<String, Any>>()

            while (resultSet?.next() == true) {
                val row = mutableMapOf<String, Any>()
                val metadata = resultSet.metaData
                for (i in 1..metadata.columnCount) {
                    row[metadata.getColumnName(i)] = resultSet.getObject(i)
                }
                results.add(row)
            }

            results
        } catch (e: Exception) {
            println("Query failed: ${e.message}")
            null
        }
    }

    fun insert(table: String, data: Map<String, Any>): Boolean {
        if (connection == null) {
            connect()
        }

        if (table.isEmpty() || data.isEmpty()) {
            return false
        }

        val columns = data.keys.joinToString(", ")
        val placeholders = data.keys.joinToString(", ") { "?" }
        val sql = "INSERT INTO $table ($columns) VALUES ($placeholders)"

        return try {
            val statement = connection?.prepareStatement(sql)
            data.values.forEachIndexed { index, value ->
                statement?.setObject(index + 1, value)
            }
            statement?.executeUpdate()
            true
        } catch (e: Exception) {
            println("Insert failed: ${e.message}")
            false
        }
    }

    fun update(table: String, data: Map<String, Any>, whereClause: String): Boolean {
        if (connection == null || table.isEmpty() || whereClause.isEmpty()) {
            return false
        }

        val setClause = data.keys.joinToString(", ") { "$it = ?" }
        val sql = "UPDATE $table SET $setClause WHERE $whereClause"

        return try {
            val statement = connection?.prepareStatement(sql)
            data.values.forEachIndexed { index, value ->
                statement?.setObject(index + 1, value)
            }
            statement?.executeUpdate()
            true
        } catch (e: Exception) {
            println("Update failed: ${e.message}")
            false
        }
    }

    fun disconnect() {
        connection?.close()
        connection = null
    }

    fun isConnected(): Boolean = connection != null && !connection!!.isClosed
}
