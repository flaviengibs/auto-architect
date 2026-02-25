Imports System.Text.RegularExpressions
Imports System.Security.Cryptography
Imports System.Text

Namespace App.Utils
    Public Class Validator
        Private Shared ReadOnly EmailRegex As New Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")
        Private Shared ReadOnly UsernameRegex As New Regex("^[a-zA-Z0-9_]+$")
        
        Public Shared Function ValidateEmail(email As String) As Boolean
            If String.IsNullOrEmpty(email) Then
                Return False
            End If
            
            Return EmailRegex.IsMatch(email)
        End Function
        
        Public Shared Function HashPassword(password As String) As String
            If password.Length < 8 Then
                Throw New ArgumentException("Password must be at least 8 characters")
            End If
            
            Using sha256 As SHA256 = SHA256.Create()
                Dim bytes As Byte() = Encoding.UTF8.GetBytes(password)
                Dim hash As Byte() = sha256.ComputeHash(bytes)
                
                Dim builder As New StringBuilder()
                For Each b As Byte In hash
                    builder.Append(b.ToString("x2"))
                Next
                
                Return builder.ToString()
            End Using
        End Function
        
        Public Shared Function VerifyPassword(password As String, hash As String) As Boolean
            Try
                Dim computedHash As String = HashPassword(password)
                Return computedHash = hash
            Catch
                Return False
            End Try
        End Function
        
        Public Shared Function SanitizeString(input As String) As String
            If String.IsNullOrEmpty(input) Then
                Return String.Empty
            End If
            
            Dim sanitized As String = input.Trim()
            sanitized = sanitized.Replace("<", "&lt;")
            sanitized = sanitized.Replace(">", "&gt;")
            sanitized = sanitized.Replace("""", "&quot;")
            sanitized = sanitized.Replace("'", "&#x27;")
            
            Return sanitized
        End Function
        
        Public Shared Function ValidateUsername(username As String) As Boolean
            If String.IsNullOrEmpty(username) Then
                Return False
            End If
            
            If username.Length < 3 OrElse username.Length > 20 Then
                Return False
            End If
            
            Return UsernameRegex.IsMatch(username)
        End Function
        
        Public Shared Function ValidatePasswordStrength(password As String) As Boolean
            If password.Length < 8 Then
                Return False
            End If
            
            Dim hasUppercase As Boolean = password.Any(AddressOf Char.IsUpper)
            Dim hasLowercase As Boolean = password.Any(AddressOf Char.IsLower)
            Dim hasDigit As Boolean = password.Any(AddressOf Char.IsDigit)
            Dim hasSpecial As Boolean = password.Any(Function(c) Not Char.IsLetterOrDigit(c))
            
            Dim criteriaCount As Integer = 0
            If hasUppercase Then criteriaCount += 1
            If hasLowercase Then criteriaCount += 1
            If hasDigit Then criteriaCount += 1
            If hasSpecial Then criteriaCount += 1
            
            Return criteriaCount >= 3
        End Function
    End Class
End Namespace
