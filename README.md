# planUS

## Gereksinimler
- Java 17+
- Maven 3.8+
- Node.js 18+
- npm 9+
- PostgreSQL 14+

## Veritabanı Kurulumu

PostgreSQL'de veritabanını oluştur:

```bash
createdb -U <kullanıcı_adı> planus
```

`backend/src/main/resources/application.properties` dosyasında bağlantı bilgilerini güncelle:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/planus
spring.datasource.username=<kullanıcı_adı>
spring.datasource.password=<şifre>
```

Tablolar uygulama ilk açılışta Hibernate tarafından otomatik oluşturulur (`ddl-auto=update`).

## Başlatma (Mac)

```bash
chmod +x start.sh
./start.sh
```

Tarayıcıda `http://localhost:3000` adresini açın.

## Manuel Başlatma

### Backend
```bash
cd backend
mvn spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Veritabanı Yedek & Geri Yükleme

Yedek almak:
```bash
pg_dump -U <kullanıcı_adı> planus > planus_backup.sql
```

Geri yüklemek:
```bash
createdb -U <kullanıcı_adı> planus
psql -U <kullanıcı_adı> -d planus < planus_backup.sql
```

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
