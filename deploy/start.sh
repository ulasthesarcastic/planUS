#!/bin/bash
export DB_USER=planus
export DB_PASS=sifrenizi_girin
export JWT_SECRET=buraya-uzun-bir-secret-girin-min-32-karakter
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/planus

exec java -jar project-manager-1.0.0.jar
