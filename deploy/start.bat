@echo off
echo planUS Backend baslatiliyor...
set DB_USER=planus
set DB_PASS=sifrenizi_girin
set JWT_SECRET=buraya-uzun-bir-secret-girin-min-32-karakter
set SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/planus

java -jar project-manager-1.0.0.jar
