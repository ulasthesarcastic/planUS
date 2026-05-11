# planUS - Proje Portfoy Yonetim Sistemi

## Proje Ozeti

BİLGEM Siber Guvenlik Enstitusu icin gelistirilen kurumsal proje portfoy yonetim araci. Projelerin butce takibi, kaynak planlamasi, P&L analizi, satin alma yonetimi ve is gelistirme sureclerini tek platformda yonetir.

## Teknoloji Stack

- **Backend:** Java 21 + Spring Boot 3, Spring Security (JWT), Spring Data JPA, Flyway
- **Frontend:** React 18 + Material UI (MUI), React Query, React Router
- **Veritabani:** PostgreSQL 15
- **Build:** Maven (backend), npm (frontend)
- **Deployment:** Docker (docker-compose), veya bare-metal (Java JAR + npm build)

## Proje Yapisi

```
planUS/
├── backend/                        # Spring Boot uygulamasi
│   ├── src/main/java/com/projectmanager/
│   │   ├── config/                 # SecurityConfig, DataInitializer, JacksonConfig
│   │   ├── controller/             # REST API controller'lari
│   │   ├── model/                  # JPA entity'leri
│   │   ├── repository/             # Spring Data repository'leri
│   │   ├── security/               # JwtFilter, JwtUtil
│   │   └── service/                # Is mantigi servisleri
│   └── src/main/resources/
│       ├── application.properties  # Ortak config (profil secimi)
│       ├── application-dev.properties   # Dev: localhost:5432/planus
│       ├── application-prod.properties  # Prod: env variable'lardan
│       └── db/migration/           # Flyway migration dosyalari (V1-V16)
├── frontend/                       # React SPA
│   └── src/
│       ├── auth/                   # AuthContext, LoginPage
│       ├── components/             # Sayfa bazli componentler
│       │   ├── Budget/             # Butce analizi
│       │   ├── CostTypes/          # Maliyet tipleri (Ayarlar)
│       │   ├── Dashboard/          # Ana sayfa
│       │   ├── GeneralExpenses/    # Genel giderler
│       │   ├── Organization/       # Organizasyon yonetimi
│       │   ├── Personnel/          # Personel yonetimi
│       │   ├── Planning/           # Proje planlama (kaynak atama)
│       │   ├── PnL/                # P&L finansal analiz
│       │   ├── Products/           # Urun yonetimi
│       │   ├── ProjectCategories/  # Proje kategorileri (Ayarlar)
│       │   ├── ProjectTypes/       # Proje tipleri (Ayarlar)
│       │   ├── Projects/           # Proje yonetimi (dinamik kategori)
│       │   ├── ResourcePlanning/   # Kaynak planlama (bolum bazli)
│       │   ├── Sales/              # Potansiyel siparisler + Siparisler
│       │   ├── Seniority/          # Kidem yonetimi (Ayarlar)
│       │   ├── Sidebar.jsx         # Dinamik sidebar (kategori bazli)
│       │   ├── Toast/              # Bildirim sistemi
│       │   └── Users/              # Kullanici yonetimi
│       ├── hooks/useQueries.js     # React Query hook'lari (merkezi)
│       ├── services/api.js         # Axios API istemcisi
│       └── theme.js                # MUI tema (dark/light)
├── deploy/                         # Build & deploy scriptleri
├── docker-compose.yml
└── KURULUM.md                      # Docker kurulum dokumani
```

## Calistirma

```bash
# Backend (port 8081)
cd backend && mvn spring-boot:run

# Frontend (port 3001)
cd frontend && npm start

# Veritabani
# PostgreSQL: localhost:5432/planus, kullanici: ulassancakli, sifre yok
```

Varsayilan giris: `admin` / `admin123`

## Veritabani

- **ORM:** Hibernate (validate modu - sema Flyway tarafindan yonetilir)
- **Migration:** Flyway V1-V16 (baseline-on-migrate aktif)
- **Backup:** `pg_dump -U ulassancakli -d planus -F c -f backup.dump`
- **Restore:** `pg_restore -U ulassancakli -d planus backup.dump`

### Onemli Tablolar
- `projects` - Projeler (kategori, tip, butce, tarihler)
- `personnel` - Personel (organizasyon birimi, kidem)
- `resource_entries` - Kaynak planlama (proje-personel-ay-yuzde)
- `payment_items` - Odeme kalemleri (sozlesmeli gelir)
- `potential_sales` - Potansiyel projeler/siparisler
- `project_costs` - Proje maliyetleri (aylik, maliyet tipine gore)
- `procurements` - Satin alma kalemleri
- `seniority_rates` - Kidem bazli maas oranlari (donem bazli)
- `personnel_seniority_history` - Personel kidem gecmisi
- `general_expenses` - Genel giderler
- `user_project_permissions` - Proje bazli yetkilendirme (RBAC)
- `project_categories` - Dinamik kategoriler (sidebar'i olusturur)
- `organization_units` - Organizasyon birim agaci (hiyerarsik)

## API Yapisi

Base URL: `http://localhost:8081/api`

Tum endpointler JWT gerektirir (`Authorization: Bearer <token>`), `/api/auth/**` haric.

### Ana Endpoint'ler
- `POST /api/auth/login` - Giris
- `/api/projects` - Proje CRUD
- `/api/personnel` - Personel CRUD
- `/api/resource-entries` - Kaynak planlama
- `/api/payment-items` - Odeme kalemleri
- `/api/potential-sales` - Potansiyel projeler/siparisler
- `/api/project-costs` - Proje maliyetleri
- `/api/procurements` - Satin alma
- `/api/project-categories` - Proje kategorileri
- `/api/project-types` - Proje tipleri
- `/api/cost-types` - Maliyet tipleri
- `/api/seniorities` - Kidem tanimlari
- `/api/organizations` - Organizasyon birimleri
- `/api/users` - Kullanici yonetimi
- `/api/general-expenses` - Genel giderler
- `/api/products` - Urunler

## Mimari Kararlar ve Kurallar

### Backend
- Controller → Service → Repository katmanli mimari
- Flyway migration dosyalari degistirilmez, yeni migration eklenir
- `ddl-auto=validate` - Hibernate sadece dogrular, sema Flyway yonetir
- JWT token suresi: 24 saat (86400000ms)
- Brute-force korumasi: LoginAttemptService
- Audit: createdAt/updatedAt otomatik (JpaAuditConfig)

### Frontend
- Tum API cagrilari `useQueries.js` uzerinden React Query hook'lari ile yapilir
- Sayfa degisiminde veri otomatik guncellenir (invalidateQueries)
- Sidebar dinamik: `project_categories` tablosundan olusur
- Tema: dark/light destegi (theme.js)
- Binlik ayirici: Turkce format (1.234.567)
- Yuzde girisi: %80 formatinda (0.8 degil)
- Dropdown'lar: Alfabetik, aranabilir, max 3 oneri

### Finans Hesaplamalari
- **Kalan Butce** = Proje Butcesi - Toplam Maliyetler (otomatik, elle girilmez)
- **P&L Planlanan Gelir** = Odeme kalemlerinden (periyot icinde)
- **P&L Planlanan Gider** = Personel maliyeti + Satin alma + Genel giderler
- **P&L Gerceklesen** = Gerceklesen odeme/maliyet kayitlarindan
- **Tahminlenen** = Gerceklesen + Planlanan (periyot icinde)
- Maliyet hesabi kidem bazli: PersonnelSeniorityHistory + SeniorityRate

### Proje Akisi
- Potansiyel proje/siparis olusturulur (is gelistirme)
- Kazanildiginda: proje → Projeler'e tasinir, siparis → ilgili projenin odeme kalemine eklenir
- Potansiyele geri alinirsa: odeme kalemi otomatik silinir
- Proje tarihi degistiginde kaynak planlama (resource_entries) otomatik hizalanir

### Yetkilendirme (RBAC)
- Roller: ADMIN, PORTFOLIO_VIEWER, PORTFOLIO_EDITOR, BUSDEV_VIEWER, BUSDEV_EDITOR, PNL_VIEWER, PNL_EDITOR
- Proje bazli yetki: UserProjectPermission (READ, WRITE, EDIT, DELETE)
- Admin tum modullere erisir

## Bilinen Sorunlar ve Dikkat Edilecekler

- `useEffect is not defined` hatasi: Yeni component olusturulurken React hook import'larini kontrol et
- Yetki hatalari (403): SecurityConfig + PermissionService'deki endpoint eslesmelerini kontrol et
- Worktree branch'leri: `claude/` ile baslayan branch'ler Claude Code worktree'lerine ait, production'da kullanilmaz
- Sayfalar arasi geciste veri guncellemesi: React Query invalidation kullan, manuel refresh gerektirmemeli

## Gelistirme Gecmisi (Mart-Mayis 2026)

1. **Altyapi** (16 Mart): JSON dosya sistemi → PostgreSQL gecisi, JWT auth, DataInitializer
2. **Butce Analizi** (17 Mart): EMY bazli gruplama, kalan butce hesaplama, Excel dogrulama
3. **Proje Planlama** (17 Mart): Kaynak atama, dis kaynak renklendirme, auto-save
4. **Kaynak Yonetimi** (18 Mart): Bolum bazli kaynak planlama, filtreler
5. **P&L** (18 Mart): Finansal analiz sayfasi, gelir-gider-kar hesaplamalari
6. **Proje Tipleri** (18 Mart): Musteri, Bolum, Dis, Is Gelistirme kategorileri
7. **Deploy** (18 Mart): Docker, build scriptleri, KURULUM.md
8. **Potansiyel Yonetimi** (1-14 Nisan): Potansiyel projeler/siparisler, kazanildi akisi
9. **Dinamik Kategoriler** (15 Nisan): Proje kategorileri sidebar'i dinamik olusturur
10. **React Query** (15 Nisan): Tum sayfalar React Query hook'larina gecis
11. **Kullanici Yonetimi** (27 Nisan): RBAC, modul + proje bazli yetki sistemi
12. **MUI Migrasyonu** (6 Nisan): Material UI gecisi
13. **Kidem Gecmisi** (6 Mayis): Personel kidem tarihcesi, maliyet hesabi duzeltmesi
14. **Satin Alma** (6-8 Mayis): Proje bazli satin alma, P&L entegrasyonu
15. **Periyot Filtre** (4 Mayis): P&L periyot secimi, hesaplama tarihi ozellestirme
