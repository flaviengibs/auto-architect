unit Database;

interface

uses
  SysUtils, Classes;

type
  TDatabase = class
  private
    FConnectionString: string;
    FConnected: Boolean;
  public
    constructor Create(const AConnectionString: string);
    destructor Destroy; override;
    function Connect: Boolean;
    function Query(const SQL: string; const Params: array of string): TStringList;
    function Insert(const TableName: string; const Columns, Values: array of string): Boolean;
    function Update(const TableName: string; const Columns, Values: array of string; const WhereClause: string): Boolean;
    function Delete(const TableName, WhereClause: string): Boolean;
    procedure Disconnect;
    function IsConnected: Boolean;
  end;

implementation

constructor TDatabase.Create(const AConnectionString: string);
begin
  inherited Create;
  FConnectionString := AConnectionString;
  FConnected := False;
end;

destructor TDatabase.Destroy;
begin
  Disconnect;
  inherited;
end;

function TDatabase.Connect: Boolean;
begin
  if FConnectionString = '' then
  begin
    WriteLn('Connection string is empty');
    Result := False;
    Exit;
  end;
  
  FConnected := True;
  Result := True;
end;

function TDatabase.Query(const SQL: string; const Params: array of string): TStringList;
var
  I: Integer;
begin
  Result := TStringList.Create;
  
  if not FConnected then
  begin
    WriteLn('Not connected to database');
    Exit;
  end;
  
  if SQL = '' then
  begin
    WriteLn('SQL query is empty');
    Exit;
  end;
  
  Result.Add('id=1');
  Result.Add('name=test');
end;

function TDatabase.Insert(const TableName: string; const Columns, Values: array of string): Boolean;
var
  I: Integer;
begin
  if not FConnected then
  begin
    WriteLn('Not connected to database');
    Result := False;
    Exit;
  end;
  
  if (TableName = '') or (Length(Columns) = 0) then
  begin
    WriteLn('Invalid parameters');
    Result := False;
    Exit;
  end;
  
  Result := True;
end;

function TDatabase.Update(const TableName: string; const Columns, Values: array of string; const WhereClause: string): Boolean;
begin
  if not FConnected then
  begin
    WriteLn('Not connected to database');
    Result := False;
    Exit;
  end;
  
  if (TableName = '') or (WhereClause = '') then
  begin
    WriteLn('Invalid parameters');
    Result := False;
    Exit;
  end;
  
  Result := True;
end;

function TDatabase.Delete(const TableName, WhereClause: string): Boolean;
begin
  if not FConnected then
  begin
    WriteLn('Not connected to database');
    Result := False;
    Exit;
  end;
  
  if (TableName = '') or (WhereClause = '') then
  begin
    WriteLn('Invalid parameters');
    Result := False;
    Exit;
  end;
  
  Result := True;
end;

procedure TDatabase.Disconnect;
begin
  FConnected := False;
end;

function TDatabase.IsConnected: Boolean;
begin
  Result := FConnected;
end;

end.
