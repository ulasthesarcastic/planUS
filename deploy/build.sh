#!/bin/bash
set -e

echo "=== planUS Build (Linux) ==="

echo "[1/2] Backend build alınıyor..."
cd ../backend
mvn clean package -DskipTests -q
echo "Backend build tamam: backend/target/project-manager-1.0.0.jar"

echo "[2/2] Frontend build alınıyor..."
cd ../frontend
npm install --silent
npm run build
echo "Frontend build tamam: frontend/build/"

echo ""
echo "=== BUILD TAMAMLANDI ==="
echo ""
echo "Sonraki adımlar:"
echo "1. frontend/build/ klasörünü /var/www/html/planus/ altına kopyala"
echo "2. backend/target/project-manager-1.0.0.jar dosyasını sunucuya kopyala"
echo "3. Apache için deploy/apache-planus.conf dosyasını yapılandır"
echo "4. java -jar project-manager-1.0.0.jar komutuyla backend'i başlat"
