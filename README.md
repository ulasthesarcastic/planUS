# planUS

## Geliştirme Ortamı

### Gereksinimler
- Java 21+
- Maven 3.8+
- Node.js 18+
- PostgreSQL 14+

### Veritabanı

```bash
createdb -U <kullanıcı_adı> planus
```

`backend/src/main/resources/application.properties` dosyasında bağlantı bilgilerini güncelle. Tablolar ilk açılışta Hibernate tarafından otomatik oluşturulur.

### Başlatma (Mac/Linux)

```bash
chmod +x start.sh
./start.sh
```

Tarayıcıda `http://localhost:3000` adresini aç.

### Manuel Başlatma

```bash
# Backend
cd backend && mvn spring-boot:run

# Frontend (ayrı terminal)
cd frontend && npm install && npm start
```

### Veritabanı Yedek & Geri Yükleme

```bash
# Yedek al
pg_dump -U <kullanıcı_adı> planus > planus_backup.sql

# Geri yükle
createdb -U <kullanıcı_adı> planus
psql -U <kullanıcı_adı> -d planus < planus_backup.sql
```

---

## Sunucu Deploy — XAMPP + JAR

### Gereksinimler
- Java 21+
- PostgreSQL 14+
- XAMPP (Apache)

### 1. Build Al

```bat
# Windows
cd deploy
build.bat

# Linux
cd deploy && bash build.sh
```

### 2. Dosyaları Sunucuya Kopyala

| Dosya | Hedef |
|---|---|
| `frontend/build/` | XAMPP → `htdocs/planus/` |
| `deploy/.htaccess` | `htdocs/planus/` içine |
| `backend/target/project-manager-1.0.0.jar` | İstediğin klasöre |
| `deploy/start.bat` veya `start.sh` | JAR ile aynı klasöre |

### 3. Apache Yapılandır

`deploy/apache-planus.conf` içeriğini XAMPP'ın `httpd-vhosts.conf` dosyasına ekle.

`httpd.conf` içinde şu satırları aç (başındaki `#` kaldır):

```
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule rewrite_module modules/mod_rewrite.so
```

### 4. Backend Başlat

`deploy/start.bat` (veya `start.sh`) içindeki DB şifresi ve JWT secret'ı düzenle, çalıştır:

```bat
# Windows
start.bat

# Linux
bash start.sh
```

Backend 8081, frontend 80 portunda çalışır. Tarayıcıda `http://sunucu-ip` ile eriş.

---

## Sunucu Deploy — Docker

### Gereksinimler
- Docker + Docker Compose

### Başlatma

```bash
cp .env.example .env
# .env içindeki şifre ve secret'ları düzenle

docker compose up -d --build
```

### İlk Kurulumda DB Restore

```bash
docker compose exec db psql -U planus -d planus < planus_backup.sql
```

Tarayıcıda `http://sunucu-ip` ile eriş.

## API Endpoints

### Projeler
- `GET/POST /api/projects`
- `GET/PUT/DELETE /api/projects/{id}`

### Personel
- `GET/POST /api/personnel`
- `GET/PUT/DELETE /api/personnel/{id}`

### Kıdem
- `GET/POST /api/seniorities`
- `GET/PUT/DELETE /api/seniorities/{id}`

### Organizasyon
- `GET/POST /api/organizations`
- `GET/PUT/DELETE /api/organizations/{id}`

### Proje Tipleri
- `GET/POST /api/project-types`
- `GET/PUT/DELETE /api/project-types/{id}`

### Potansiyel Satışlar
- `GET/POST /api/potential-sales`
- `GET/PUT/DELETE /api/potential-sales/{id}`

### Ürünler
- `GET/POST /api/products`
- `GET/PUT/DELETE /api/products/{id}`
