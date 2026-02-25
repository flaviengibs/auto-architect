Imports System.Data.SqlClient

Namespace App.Data
    Public Class Database
        Private connectionString As String
        Private connection As SqlConnection
        
        Public Sub New(connStr As String)
            connectionString = connStr
            connection = Nothing
        End Sub
        
        Public Function Connect() As Boolean
            Try
                If String.IsNullOrEmpty(connectionString) Then
                    Console.WriteLine("Connection string is empty")
                    Return False
                End If
                
                connection = New SqlConnection(connectionString)
                connection.Open()
                Return True
            Catch ex As Exception
                Console.WriteLine("Connection failed: " & ex.Message)
                Return False
            End Try
        End Function
        
        Public Function Query(sql As String, ParamArray params() As Object) As DataTable
            If connection Is Nothing OrElse connection.State <> ConnectionState.Open Then
                Connect()
            End If
            
            Try
                Dim command As New SqlCommand(sql, connection)
                
                For i As Integer = 0 To params.Length - 1
                    command.Parameters.AddWithValue("@p" & i, params(i))
                Next
                
                Dim adapter As New SqlDataAdapter(command)
                Dim table As New DataTable()
                adapter.Fill(table)
                
                Return table
            Catch ex As Exception
                Console.WriteLine("Query failed: " & ex.Message)
                Return Nothing
            End Try
        End Function
        
        Public Function Insert(tableName As String, data As Dictionary(Of String, Object)) As Boolean
            If connection Is Nothing OrElse connection.State <> ConnectionState.Open Then
                Connect()
            End If
            
            If String.IsNullOrEmpty(tableName) OrElse data.Count = 0 Then
                Return False
            End If
            
            Try
                Dim columns As String = String.Join(", ", data.Keys)
                Dim values As String = String.Join(", ", data.Keys.Select(Function(k) "@" & k))
                Dim sql As String = $"INSERT INTO {tableName} ({columns}) VALUES ({values})"
                
                Dim command As New SqlCommand(sql, connection)
                
                For Each kvp In data
                    command.Parameters.AddWithValue("@" & kvp.Key, kvp.Value)
                Next
                
                command.ExecuteNonQuery()
                Return True
            Catch ex As Exception
                Console.WriteLine("Insert failed: " & ex.Message)
                Return False
            End Try
        End Function
        
        Public Function Update(tableName As String, data As Dictionary(Of String, Object), whereClause As String) As Boolean
            If connection Is Nothing OrElse connection.State <> ConnectionState.Open Then
                Connect()
            End If
            
            If String.IsNullOrEmpty(tableName) OrElse String.IsNullOrEmpty(whereClause) Then
                Return False
            End If
            
            Try
                Dim setClause As String = String.Join(", ", data.Keys.Select(Function(k) k & " = @" & k))
                Dim sql As String = $"UPDATE {tableName} SET {setClause} WHERE {whereClause}"
                
                Dim command As New SqlCommand(sql, connection)
                
                For Each kvp In data
                    command.Parameters.AddWithValue("@" & kvp.Key, kvp.Value)
                Next
                
                command.ExecuteNonQuery()
                Return True
            Catch ex As Exception
                Console.WriteLine("Update failed: " & ex.Message)
                Return False
            End Try
        End Function
        
        Public Sub Disconnect()
            If connection IsNot Nothing Then
                connection.Close()
                connection = Nothing
            End If
        End Sub
        
        Public Function IsConnected() As Boolean
            Return connection IsNot Nothing AndAlso connection.State = ConnectionState.Open
        End Function
    End Class
End Namespace
