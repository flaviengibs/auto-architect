Imports App.Data
Imports App.Utils

Namespace App.Models
    Public Class User
        Private _id As Integer
        Private _username As String
        Private _email As String
        Private _password As String
        Private _isActive As Boolean
        
        Public Property Id() As Integer
            Get
                Return _id
            End Get
            Set(value As Integer)
                _id = value
            End Set
        End Property
        
        Public Property Username() As String
            Get
                Return _username
            End Get
            Set(value As String)
                _username = value
            End Set
        End Property
        
        Public Property Email() As String
            Get
                Return _email
            End Get
            Set(value As String)
                _email = value
            End Set
        End Property
        
        Public Property IsActive() As Boolean
            Get
                Return _isActive
            End Get
            Set(value As Boolean)
                _isActive = value
            End Set
        End Property
        
        Public Sub New()
            _id = 0
            _username = String.Empty
            _email = String.Empty
            _password = String.Empty
            _isActive = True
        End Sub
        
        Public Function Create(db As Database, username As String, email As String, password As String) As Boolean
            If String.IsNullOrEmpty(username) OrElse String.IsNullOrEmpty(email) OrElse String.IsNullOrEmpty(password) Then
                Throw New ArgumentException("All fields are required")
            End If
            
            If Not Validator.ValidateEmail(email) Then
                Throw New ArgumentException("Invalid email format")
            End If
            
            Dim hashedPassword As String = Validator.HashPassword(password)
            
            Dim data As New Dictionary(Of String, Object) From {
                {"username", username},
                {"email", email},
                {"password", hashedPassword},
                {"is_active", If(_isActive, 1, 0)}
            }
            
            If db.Insert("users", data) Then
                _username = username
                _email = email
                _password = hashedPassword
                Return True
            End If
            
            Return False
        End Function
        
        Public Function FindById(db As Database, id As Integer) As User
            If id <= 0 Then
                Throw New ArgumentException("Invalid user ID")
            End If
            
            Dim sql As String = "SELECT * FROM users WHERE id = @p0"
            Dim result As DataTable = db.Query(sql, id)
            
            If result IsNot Nothing AndAlso result.Rows.Count > 0 Then
                Dim row As DataRow = result.Rows(0)
                _id = Convert.ToInt32(row("id"))
                _username = row("username").ToString()
                _email = row("email").ToString()
                _isActive = Convert.ToInt32(row("is_active")) = 1
                Return Me
            End If
            
            Return Nothing
        End Function
        
        Public Function Update(db As Database, Optional username As String = Nothing, Optional email As String = Nothing) As Boolean
            If _id = 0 Then
                Throw New InvalidOperationException("User not loaded")
            End If
            
            Dim updates As New Dictionary(Of String, Object)
            
            If Not String.IsNullOrEmpty(username) Then
                updates.Add("username", username)
            End If
            
            If Not String.IsNullOrEmpty(email) Then
                If Not Validator.ValidateEmail(email) Then
                    Throw New ArgumentException("Invalid email format")
                End If
                updates.Add("email", email)
            End If
            
            If updates.Count = 0 Then
                Return False
            End If
            
            Return db.Update("users", updates, $"id = {_id}")
        End Function
        
        Public Function Delete(db As Database) As Boolean
            If _id = 0 Then
                Throw New InvalidOperationException("User not loaded")
            End If
            
            Dim data As New Dictionary(Of String, Object) From {
                {"is_active", 0}
            }
            
            Return db.Update("users", data, $"id = {_id}")
        End Function
    End Class
End Namespace
