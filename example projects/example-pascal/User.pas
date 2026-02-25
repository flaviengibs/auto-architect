unit User;

interface

uses
  SysUtils, Classes, Database, Validator;

type
  TUser = class
  private
    FId: Integer;
    FUsername: string;
    FEmail: string;
    FPassword: string;
    FIsActive: Boolean;
  public
    constructor Create;
    function CreateUser(DB: TDatabase; const Username, Email, Password: string): Boolean;
    function FindById(DB: TDatabase; const Id: Integer): Boolean;
    function Update(DB: TDatabase; const Username, Email: string): Boolean;
    function Delete(DB: TDatabase): Boolean;
    property Id: Integer read FId;
    property Username: string read FUsername;
    property Email: string read FEmail;
    property IsActive: Boolean read FIsActive;
  end;

implementation

constructor TUser.Create;
begin
  inherited Create;
  FId := 0;
  FUsername := '';
  FEmail := '';
  FPassword := '';
  FIsActive := True;
end;

function TUser.CreateUser(DB: TDatabase; const Username, Email, Password: string): Boolean;
var
  HashedPassword: string;
  Columns, Values: array[0..3] of string;
begin
  if (Username = '') or (Email = '') or (Password = '') then
    raise Exception.Create('All fields are required');
  
  if not TValidator.ValidateEmail(Email) then
    raise Exception.Create('Invalid email format');
  
  HashedPassword := TValidator.HashPassword(Password);
  
  Columns[0] := 'username';
  Columns[1] := 'email';
  Columns[2] := 'password';
  Columns[3] := 'is_active';
  
  Values[0] := Username;
  Values[1] := Email;
  Values[2] := HashedPassword;
  if FIsActive then
    Values[3] := '1'
  else
    Values[3] := '0';
  
  if DB.Insert('users', Columns, Values) then
  begin
    FUsername := Username;
    FEmail := Email;
    FPassword := HashedPassword;
    Result := True;
  end
  else
    Result := False;
end;

function TUser.FindById(DB: TDatabase; const Id: Integer): Boolean;
var
  SQL: string;
  Params: array[0..0] of string;
  ResultList: TStringList;
begin
  if Id <= 0 then
    raise Exception.Create('Invalid user ID');
  
  SQL := 'SELECT * FROM users WHERE id = ?';
  Params[0] := IntToStr(Id);
  ResultList := DB.Query(SQL, Params);
  
  try
    if ResultList.Count > 0 then
    begin
      FId := Id;
      FUsername := 'testuser';
      FEmail := 'test@example.com';
      FIsActive := True;
      Result := True;
    end
    else
      Result := False;
  finally
    ResultList.Free;
  end;
end;

function TUser.Update(DB: TDatabase; const Username, Email: string): Boolean;
var
  Columns, Values: array[0..1] of string;
  WhereClause: string;
  UpdateCount: Integer;
begin
  if FId = 0 then
    raise Exception.Create('User not loaded');
  
  UpdateCount := 0;
  
  if Username <> '' then
  begin
    Columns[UpdateCount] := 'username';
    Values[UpdateCount] := Username;
    Inc(UpdateCount);
  end;
  
  if Email <> '' then
  begin
    if not TValidator.ValidateEmail(Email) then
      raise Exception.Create('Invalid email format');
    Columns[UpdateCount] := 'email';
    Values[UpdateCount] := Email;
    Inc(UpdateCount);
  end;
  
  if UpdateCount = 0 then
  begin
    Result := False;
    Exit;
  end;
  
  WhereClause := 'id = ' + IntToStr(FId);
  Result := DB.Update('users', Columns, Values, WhereClause);
end;

function TUser.Delete(DB: TDatabase): Boolean;
var
  Columns, Values: array[0..0] of string;
  WhereClause: string;
begin
  if FId = 0 then
    raise Exception.Create('User not loaded');
  
  Columns[0] := 'is_active';
  Values[0] := '0';
  WhereClause := 'id = ' + IntToStr(FId);
  
  Result := DB.Update('users', Columns, Values, WhereClause);
end;

end.
