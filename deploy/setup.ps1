# planUS Windows Kurulum Scripti
# Yonetici olarak calistirin: Right-click > "Run as Administrator"
# Gerekli: Windows 10/11, winget

param(
    [string]$DbUser     = "planus",
    [string]$DbPass     = "planus123",
    [string]$DbName     = "planus",
    [string]$JwtSecret  = "planUS-super-secret-key-change-in-production-256bit!!",
    [int]   $Port       = 8081,
    [string]$DumpFile   = "planus_backup.sql"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$JarPath   = Join-Path $ScriptDir "project-manager-1.0.0.jar"

function Write-Step($msg) { Write-Host "`n>>> $msg" -ForegroundColor Cyan }
function Write-OK($msg)   { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "    [!!] $msg" -ForegroundColor Yellow }

Write-Host ""
Write-Host "============================================" -ForegroundColor Blue
Write-Host "   planUS Kurulum Scripti" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue

# ── 1. Java kontrol / kur ──────────────────────────────────────────
Write-Step "Java 21 kontrol ediliyor..."
$javaOk = $false
try {
    $v = & java -version 2>&1 | Select-String "version"
    if ($v -match '"(2[1-9]|[3-9]\d)\.' ) { $javaOk = $true }
} catch {}

if ($javaOk) {
    Write-OK "Java zaten kurulu."
} else {
    Write-Warn "Java bulunamadi, winget ile kuruluyor..."
    winget install --id Microsoft.OpenJDK.21 --accept-source-agreements --accept-package-agreements -e
    $env:PATH += ";$env:ProgramFiles\Microsoft\jdk-21*\bin"
    Write-OK "Java kuruldu."
}

# ── 2. PostgreSQL kontrol / kur ────────────────────────────────────
Write-Step "PostgreSQL kontrol ediliyor..."
$pgOk = $false
try {
    $null = & psql --version 2>&1
    $pgOk = $true
} catch {}

if ($pgOk) {
    Write-OK "PostgreSQL zaten kurulu."
} else {
    Write-Warn "PostgreSQL bulunamadi, winget ile kuruluyor..."
    winget install --id PostgreSQL.PostgreSQL.16 --accept-source-agreements --accept-package-agreements -e
    # PATH'i guncelle
    $pgPath = (Get-ChildItem "C:\Program Files\PostgreSQL" -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1)
    if ($pgPath) { $env:PATH += ";$($pgPath.FullName)\bin" }
    Write-OK "PostgreSQL kuruldu."
    Write-Warn "PostgreSQL servisi baslatiliyor..."
    Start-Service postgresql* -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}

# ── 3. PostgreSQL PATH bul ─────────────────────────────────────────
$pgBin = (Get-ChildItem "C:\Program Files\PostgreSQL" -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1)
if ($pgBin) {
    $env:PATH = "$($pgBin.FullName)\bin;$env:PATH"
}

# ── 4. Veritabani olustur ──────────────────────────────────────────
Write-Step "Veritabani olusturuluyor: $DbName"
$env:PGPASSWORD = $DbPass

# Kullanici yoksa olustur
$userExists = & psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DbUser'" 2>&1
if ($userExists -ne "1") {
    & psql -U postgres -c "CREATE USER $DbUser WITH PASSWORD '$DbPass';" 2>&1 | Out-Null
    Write-OK "Kullanici olusturuldu: $DbUser"
} else {
    Write-OK "Kullanici zaten mevcut: $DbUser"
}

# DB yoksa olustur
$dbExists = & psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DbName'" 2>&1
if ($dbExists -ne "1") {
    & psql -U postgres -c "CREATE DATABASE $DbName OWNER $DbUser;" 2>&1 | Out-Null
    Write-OK "Veritabani olusturuldu: $DbName"
} else {
    Write-OK "Veritabani zaten mevcut: $DbName"
}

# ── 5. Dump restore ────────────────────────────────────────────────
$dumpPath = Join-Path $ScriptDir $DumpFile
if (Test-Path $dumpPath) {
    Write-Step "Veritabani dump restore ediliyor: $DumpFile"
    $env:PGPASSWORD = $DbPass
    & psql -U $DbUser -d $DbName -f $dumpPath 2>&1 | Out-Null
    Write-OK "Dump yuklendi."
} else {
    Write-Warn "$DumpFile bulunamadi, bos veritabani ile devam ediliyor."
    Write-Warn "Tablolar uygulama ilk acilisinda otomatik olusturulacak."
}

# ── 6. JAR kontrol ────────────────────────────────────────────────
Write-Step "JAR dosyasi kontrol ediliyor..."
if (-not (Test-Path $JarPath)) {
    Write-Host "HATA: $JarPath bulunamadi!" -ForegroundColor Red
    Write-Host "Once 'deploy\build-full.bat' calistirip JAR'i bu klasore kopyalayin." -ForegroundColor Yellow
    exit 1
}
Write-OK "JAR bulundu."

# ── 7. Baslat ─────────────────────────────────────────────────────
Write-Step "planUS baslatiliyor (port $Port)..."

$env:DB_USER              = $DbUser
$env:DB_PASS              = $DbPass
$env:JWT_SECRET           = $JwtSecret
$env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5432/$DbName"
$env:SERVER_PORT          = $Port

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   planUS hazir!" -ForegroundColor Green
Write-Host "   Adres: http://localhost:$Port" -ForegroundColor Green
Write-Host "   Durdurmak icin: Ctrl+C" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 1
Start-Process "http://localhost:$Port" | Out-Null

& java -jar $JarPath
