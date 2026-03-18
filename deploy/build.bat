@echo off
echo === planUS Build (Windows) ===

echo [1/2] Backend build aliniyor...
cd ..\backend
call mvn clean package -DskipTests -q
if %errorlevel% neq 0 (
    echo HATA: Backend build basarisiz!
    exit /b 1
)
echo Backend build tamam: backend\target\project-manager-1.0.0.jar

echo [2/2] Frontend build aliniyor...
cd ..\frontend
call npm install --silent
call npm run build
if %errorlevel% neq 0 (
    echo HATA: Frontend build basarisiz!
    exit /b 1
)
echo Frontend build tamam: frontend\build\

echo.
echo === BUILD TAMAMLANDI ===
echo.
echo Sonraki adimlar:
echo 1. frontend\build\ klasorunu XAMPP htdocs\planus\ altina kopyala
echo 2. backend\target\project-manager-1.0.0.jar dosyasini sunucuya kopyala
echo 3. Apache icin deploy\apache-planus.conf dosyasini yapilandir
echo 4. java -jar project-manager-1.0.0.jar komutuyla backend'i baslat
