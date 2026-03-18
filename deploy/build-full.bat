@echo off
echo === planUS - Tam Build (Frontend + Backend tek JAR) ===

echo [1/3] Frontend build aliniyor...
cd ..\frontend
call npm install --silent
call npm run build
if %errorlevel% neq 0 ( echo HATA: Frontend build basarisiz! & exit /b 1 )

echo [2/3] Frontend dosyalari backend'e kopyalaniyor...
if exist "..\backend\src\main\resources\static" rmdir /s /q "..\backend\src\main\resources\static"
xcopy /e /i /q "build" "..\backend\src\main\resources\static"

echo [3/3] Backend JAR build aliniyor (frontend dahil)...
cd ..\backend
call mvn clean package -DskipTests -q
if %errorlevel% neq 0 ( echo HATA: Backend build basarisiz! & exit /b 1 )

echo.
echo === BUILD TAMAMLANDI ===
echo Tek JAR: backend\target\project-manager-1.0.0.jar
echo Bu JAR'i sunucuya kopyalayip setup.ps1 ile kurabilirsiniz.
