# planUS

## Gereksinimler
- Java 17+
- Maven 3.8+
- Node.js 18+
- npm 9+

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

## Veri Konumu
Veriler `~/.project-manager/data/` klasöründe JSON formatında tutulur:
- `seniorities.json` — Kıdem tanımları ve maliyet dönemleri
- `personnel.json` — Personel kayıtları

## API Endpoints
- `GET/POST /api/seniorities`
- `GET/PUT/DELETE /api/seniorities/{id}`
- `GET/POST /api/personnel`
- `GET/PUT/DELETE /api/personnel/{id}`
