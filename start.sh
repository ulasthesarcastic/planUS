#!/bin/bash

echo "🚀 planUS başlatılıyor..."

# Backend'i başlat
echo "📦 Backend başlatılıyor (Spring Boot)..."
cd backend
mvn spring-boot:run &
BACKEND_PID=$!

# Backend'in ayağa kalkmasını bekle
echo "⏳ Backend hazır olana kadar bekleniyor..."
until curl -s http://localhost:8080/api/personnel > /dev/null 2>&1; do
  sleep 1
done

echo "✅ Backend hazır!"

# Frontend'i başlat
echo "🎨 Frontend başlatılıyor (React)..."
cd ../frontend
npm install
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Uygulama çalışıyor!"
echo "🌐 http://localhost:3000 adresini açın"
echo ""
echo "Durdurmak için Ctrl+C..."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
