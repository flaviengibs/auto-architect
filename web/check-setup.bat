@echo off
echo.
echo ========================================
echo Auto-Architect Web Backend Check
echo ========================================
echo.

echo [1/4] Checking CLI build...
if exist "..\dist\cli\index.js" (
    echo    ✓ CLI is built
) else (
    echo    ✗ CLI not built
    echo    Run: npm run build (in root directory)
    goto :error
)

echo.
echo [2/4] Checking web dependencies...
if exist "node_modules" (
    echo    ✓ Dependencies installed
) else (
    echo    ✗ Dependencies not installed
    echo    Run: npm install (in web directory)
    goto :error
)

echo.
echo [3/4] Checking server file...
if exist "server.js" (
    echo    ✓ Server file found
) else (
    echo    ✗ Server file not found
    goto :error
)

echo.
echo [4/4] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ Node.js installed
) else (
    echo    ✗ Node.js not found
    echo    Install Node.js from https://nodejs.org
    goto :error
)

echo.
echo ========================================
echo ✓ All checks passed!
echo ========================================
echo.
echo You can now run: npm start
echo Then open: http://localhost:3000
echo.
goto :end

:error
echo.
echo ========================================
echo ✗ Setup incomplete
echo ========================================
echo.
echo Please fix the issues above and try again.
echo See SETUP.md for detailed instructions.
echo.

:end
pause
