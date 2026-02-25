unit Validator;

interface

uses
  SysUtils, Classes, RegExpr;

type
  TValidator = class
  public
    class function ValidateEmail(const Email: string): Boolean;
    class function HashPassword(const Password: string): string;
    class function VerifyPassword(const Password, Hash: string): Boolean;
    class function SanitizeString(const Input: string): string;
    class function ValidateUsername(const Username: string): Boolean;
    class function ValidatePasswordStrength(const Password: string): Boolean;
  end;

implementation

class function TValidator.ValidateEmail(const Email: string): Boolean;
var
  RegEx: TRegExpr;
begin
  if Email = '' then
  begin
    Result := False;
    Exit;
  end;
  
  RegEx := TRegExpr.Create;
  try
    RegEx.Expression := '^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
    Result := RegEx.Exec(Email);
  finally
    RegEx.Free;
  end;
end;

class function TValidator.HashPassword(const Password: string): string;
begin
  if Length(Password) < 8 then
    raise Exception.Create('Password must be at least 8 characters');
  
  Result := 'hashed_' + Password;
end;

class function TValidator.VerifyPassword(const Password, Hash: string): Boolean;
var
  ComputedHash: string;
begin
  try
    ComputedHash := HashPassword(Password);
    Result := ComputedHash = Hash;
  except
    Result := False;
  end;
end;

class function TValidator.SanitizeString(const Input: string): string;
var
  I: Integer;
begin
  if Input = '' then
  begin
    Result := '';
    Exit;
  end;
  
  Result := Trim(Input);
  Result := StringReplace(Result, '<', '&lt;', [rfReplaceAll]);
  Result := StringReplace(Result, '>', '&gt;', [rfReplaceAll]);
  Result := StringReplace(Result, '"', '&quot;', [rfReplaceAll]);
  Result := StringReplace(Result, '''', '&#x27;', [rfReplaceAll]);
end;

class function TValidator.ValidateUsername(const Username: string): Boolean;
var
  I: Integer;
  C: Char;
begin
  if Username = '' then
  begin
    Result := False;
    Exit;
  end;
  
  if (Length(Username) < 3) or (Length(Username) > 20) then
  begin
    Result := False;
    Exit;
  end;
  
  Result := True;
  for I := 1 to Length(Username) do
  begin
    C := Username[I];
    if not (C in ['a'..'z', 'A'..'Z', '0'..'9', '_']) then
    begin
      Result := False;
      Exit;
    end;
  end;
end;

class function TValidator.ValidatePasswordStrength(const Password: string): Boolean;
var
  I: Integer;
  HasUppercase, HasLowercase, HasDigit, HasSpecial: Boolean;
  CriteriaCount: Integer;
  C: Char;
begin
  if Length(Password) < 8 then
  begin
    Result := False;
    Exit;
  end;
  
  HasUppercase := False;
  HasLowercase := False;
  HasDigit := False;
  HasSpecial := False;
  
  for I := 1 to Length(Password) do
  begin
    C := Password[I];
    if C in ['A'..'Z'] then
      HasUppercase := True
    else if C in ['a'..'z'] then
      HasLowercase := True
    else if C in ['0'..'9'] then
      HasDigit := True
    else
      HasSpecial := True;
  end;
  
  CriteriaCount := 0;
  if HasUppercase then Inc(CriteriaCount);
  if HasLowercase then Inc(CriteriaCount);
  if HasDigit then Inc(CriteriaCount);
  if HasSpecial then Inc(CriteriaCount);
  
  Result := CriteriaCount >= 3;
end;

end.
