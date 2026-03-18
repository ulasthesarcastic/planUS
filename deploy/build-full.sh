#!/bin/bash
set -e
echo "=== planUS - Tam Build (Frontend + Backend tek JAR) ==="

echo "[1/3] Frontend build alınıyor..."
cd ../frontend
npm install --silent
npm run build

echo "[2/3] Frontend dosyaları backend'e kopyalanıyor..."
rm -rf ../backend/src/main/resources/static
cp -r build ../backend/src/main/resources/static

echo "[3/3] Backend JAR build alınıyor (frontend dahil)..."
cd ../backend
mvn clean package -DskipTests -q

echo ""
echo "=== BUILD TAMAMLANDI ==="
echo "Tek JAR: backend/target/project-manager-1.0.0.jar"
