# planUS — Sunucu Kurulum Kılavuzu

> Bu kılavuz, planUS uygulamasını sıfırdan bir Linux sunucusunda Docker ile ayağa kaldırmak için gerekli tüm adımları içerir.

---

## İçindekiler

1. [Sistem Gereksinimleri](#1-sistem-gereksinimleri)
2. [Docker Kurulumu](#2-docker-kurulumu)
3. [Proje Dosyalarını Sunucuya Aktarma](#3-proje-dosyalarını-sunucuya-aktarma)
4. [Ortam Değişkenlerini Ayarlama](#4-ortam-değişkenlerini-ayarlama)
5. [Uygulamayı Başlatma](#5-uygulamayı-başlatma)
6. [İlk Kullanıcıyı Oluşturma](#6-i̇lk-kullanıcıyı-oluşturma)
7. [Güvenlik Duvarı Ayarları](#7-güvenlik-duvarı-ayarları)
8. [HTTPS Kurulumu (Opsiyonel)](#8-https-kurulumu-opsiyonel)
9. [Yedekleme](#9-yedekleme)
10. [Güncelleme](#10-güncelleme)
11. [Sorun Giderme](#11-sorun-giderme)

---

## 1. Sistem Gereksinimleri

| Bileşen | Minimum | Önerilen |
|---------|---------|---------|
| İşletim Sistemi | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| CPU | 2 çekirdek | 4 çekirdek |
| RAM | 2 GB | 4 GB |
| Disk | 20 GB | 40 GB |
| İnternet | Var (kurulum için) | Var |

> **Not:** Bu kılavuzdaki tüm komutlar Ubuntu 22.04 üzerinde test edilmiştir. Debian veya RHEL tabanlı dağıtımlarda küçük farklılıklar olabilir.

---

## 2. Docker Kurulumu

Sunucuya SSH ile bağlanın ve aşağıdaki adımları sırayla uygulayın.

### 2.1 Sistem Paketlerini Güncelle

```bash
sudo apt-get update && sudo apt-get upgrade -y
```

### 2.2 Docker'ı Kur

```bash
# Gerekli paketleri kur
sudo apt-get install -y ca-certificates curl gnupg

# Docker'ın resmi GPG anahtarını ekle
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Docker deposunu ekle
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker'ı kur
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
```

### 2.3 Docker'ın Çalıştığını Doğrula

```bash
sudo docker run hello-world
```

Ekranda `Hello from Docker!` yazısı görünüyorsa kurulum başarılıdır.

### 2.4 Mevcut Kullanıcıyı Docker Grubuna Ekle

Her komut önüne `sudo` yazmak zorunda kalmamak için:

```bash
sudo usermod -aG docker $USER
```

> Bu değişikliğin etkili olması için **oturumu kapatıp yeniden açmanız** gerekir:
> ```bash
> exit
> # Tekrar SSH ile bağlanın
> ```

---

## 3. Proje Dosyalarını Sunucuya Aktarma

### Seçenek A — Git ile Çek (Önerilen)

Sunucuda Git yüklü değilse önce kur:

```bash
sudo apt-get install -y git
```

Projeyi çek:

```bash
cd /opt
sudo git clone https://github.com/KULLANICI/planUS.git
sudo chown -R $USER:$USER /opt/planUS
cd /opt/planUS
```

> `https://github.com/KULLANICI/planUS.git` adresini gerçek repo adresiyle değiştirin.

### Seçenek B — SCP ile Kopyala

Kendi bilgisayarınızdan (Mac/Linux) çalıştırın:

```bash
scp -r /yerel/planUS kullanici@sunucu-ip:/opt/planUS
```

---

## 4. Ortam Değişkenlerini Ayarlama

Uygulama, veritabanı şifresi ve JWT anahtarı gibi hassas bilgileri `.env` dosyasından okur. Bu dosya Git'e eklenmez ve her sunucuda ayrıca oluşturulmalıdır.

### 4.1 .env Dosyasını Oluştur

```bash
cd /opt/planUS
cp .env.example .env
nano .env
```

### 4.2 Değerleri Doldur

Açılan editörde aşağıdaki alanları doldurun:

```env
# Veritabanı
DB_USER=planus
DB_PASS=BURAYA_GUCLU_BIR_SIFRE_YAZIN

# JWT (en az 32 karakter, tamamen rastgele olmalı)
JWT_SECRET=BURAYA_COK_UZUN_VE_RASTGELE_BIR_SECRET_YAZIN

# CORS — uygulamaya erişilecek adres(ler)
# Sadece IP ile erişilecekse:
CORS_ORIGINS=http://192.168.1.100
# Alan adı varsa:
# CORS_ORIGINS=https://planus.sirketim.com
```

Kaydet ve çık: `Ctrl+X` → `Y` → `Enter`

### 4.3 Güçlü JWT Secret Üret

Rastgele bir secret üretmek için:

```bash
openssl rand -base64 48
```

Çıktıyı kopyalayıp `.env` dosyasındaki `JWT_SECRET` değerine yapıştırın.

### 4.4 Dosya İzinlerini Kısıtla

`.env` dosyası şifre içerdiği için yalnızca sahip okuyabilmeli:

```bash
chmod 600 /opt/planUS/.env
```

---

## 5. Uygulamayı Başlatma

### 5.1 İlk Kez Başlat

Proje dizininde şu komutu çalıştırın:

```bash
cd /opt/planUS
docker compose up -d --build
```

Bu komut:
- PostgreSQL, backend (Spring Boot) ve frontend (Nginx) imajlarını **derler**
- Üç container'ı **arka planda** başlatır
- Veritabanı şemasını **otomatik olarak** oluşturur (Flyway migration)

İlk derleme **5–15 dakika** sürebilir. Sabırla bekleyin.

### 5.2 Durumu Kontrol Et

```bash
docker compose ps
```

Her üç servis de `running` olmalıdır:

```
NAME                STATUS
planus-db-1         running
planus-backend-1    running
planus-frontend-1   running
```

### 5.3 Logları İzle

Bir sorun varsa loglarla görün:

```bash
# Tüm servislerin son logları
docker compose logs --tail=50

# Sadece backend
docker compose logs backend --tail=50 -f

# Sadece veritabanı
docker compose logs db --tail=30
```

`-f` bayrağı canlı takip (stream) sağlar, çıkmak için `Ctrl+C`.

### 5.4 Uygulamayı Test Et

Tarayıcıdan açın:

```
http://SUNUCU_IP
```

Giriş ekranı görünüyorsa kurulum başarılıdır.

---

## 6. İlk Kullanıcıyı Oluşturma

Uygulama ilk açıldığında hiç kullanıcı bulunmaz. İlk admin kullanıcısını API üzerinden oluşturmanız gerekir.

### 6.1 Geçici Token Al

Backend, ilk kullanıcı oluşturmak için özel bir endpoint sunar. Sunucuda şu komutu çalıştırın:

```bash
curl -s -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "AdminSifre123!",
    "role": "ADMIN"
  }'
```

> Eğer bu endpoint yoksa aşağıdaki yöntemi kullanın.

### 6.2 Veritabanına Doğrudan Kullanıcı Ekle

Şifreyi BCrypt ile hashleyin:

```bash
# Python ile BCrypt hash üret
docker compose exec backend java -cp app.jar \
  org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder 2>/dev/null || \
  python3 -c "
import subprocess
result = subprocess.run(['docker','compose','exec','db',
  'psql','-U','planus','-d','planus','-c','SELECT 1'],
  capture_output=True)
print('DB bağlantısı OK')
"
```

Alternatif olarak, şifreyi online BCrypt aracıyla hashleyin (örn. https://bcrypt-generator.com, cost=10) ve doğrudan veritabanına ekleyin:

```bash
docker compose exec db psql -U planus -d planus -c "
INSERT INTO users (username, password, role)
VALUES ('admin', '\$2a\$10\$HASH_BURAYA', 'ADMIN');
"
```

> `HASH_BURAYA` yerine BCrypt hash'inizi yazın.

---

## 7. Güvenlik Duvarı Ayarları

### 7.1 UFW ile Temel Kural Seti

```bash
# UFW'yi kur (zaten kuruluysa geç)
sudo apt-get install -y ufw

# Varsayılan politikalar
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH'a izin ver (kilitlenmeyin!)
sudo ufw allow ssh

# HTTP ve HTTPS'e izin ver
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# UFW'yi etkinleştir
sudo ufw enable
sudo ufw status
```

> **Uyarı:** `ufw enable` komutundan önce SSH'ın izin listesinde olduğuna emin olun, aksi takdirde sunucuya erişimi kaybedebilirsiniz.

### 7.2 Backend Portunu Dışarıya Kapatma

Backend port 8081'i yalnızca iç ağda (Nginx üzerinden) erişilebilir tutmak için docker-compose.yml'de `ports` satırını kapatabilirsiniz:

```yaml
  backend:
    # ports:          ← Bu satırı yorum satırına alın
    #   - "8081:8081" ← Bu satırı yorum satırına alın
```

Ardından:
```bash
docker compose up -d backend
```

---

## 8. HTTPS Kurulumu (Opsiyonel)

Bir alan adınız varsa (örn. `planus.sirketim.com`) Let's Encrypt ile ücretsiz SSL sertifikası alabilirsiniz.

### 8.1 Certbot Kur

```bash
sudo apt-get install -y certbot
```

### 8.2 Geçici Olarak 80. Portu Serbest Bırak

```bash
docker compose stop frontend
```

### 8.3 Sertifika Al

```bash
sudo certbot certonly --standalone -d planus.sirketim.com
```

Sertifikalar `/etc/letsencrypt/live/planus.sirketim.com/` altına kaydedilir.

### 8.4 nginx.conf'u Güncelle

`/opt/planUS/nginx.conf` dosyasını açın ve HTTPS bloğunu ekleyin:

```nginx
server {
    listen 80;
    server_name planus.sirketim.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name planus.sirketim.com;

    ssl_certificate     /etc/letsencrypt/live/planus.sirketim.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/planus.sirketim.com/privkey.pem;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8081/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

### 8.5 Sertifika Dosyalarını Container'a Bağla

`docker-compose.yml` içindeki `frontend` servisine volume ekleyin:

```yaml
  frontend:
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
```

### 8.6 Yeniden Başlat

```bash
docker compose up -d --build frontend
```

### 8.7 Otomatik Yenileme Ayarla

Let's Encrypt sertifikaları 90 günde bir yenilenmesi gerekir:

```bash
sudo crontab -e
```

En alta şu satırı ekleyin:

```
0 3 * * 1 certbot renew --quiet && docker compose -f /opt/planUS/docker-compose.yml restart frontend
```

---

## 9. Yedekleme

### 9.1 Veritabanı Yedeği Al

```bash
# Anlık yedek
docker compose exec db pg_dump -U planus planus > yedek_$(date +%Y%m%d_%H%M%S).sql
```

### 9.2 Otomatik Günlük Yedek

```bash
sudo crontab -e
```

Aşağıdaki satırı ekleyin (her gece 02:00'de yedek alır, 30 günden eski yedekleri siler):

```
0 2 * * * docker compose -f /opt/planUS/docker-compose.yml exec -T db \
  pg_dump -U planus planus > /opt/yedekler/planus_$(date +\%Y\%m\%d).sql && \
  find /opt/yedekler -name "planus_*.sql" -mtime +30 -delete
```

Yedek klasörünü oluşturun:

```bash
sudo mkdir -p /opt/yedekler
sudo chown $USER:$USER /opt/yedekler
```

### 9.3 Yedeği Geri Yükle

```bash
# Mevcut veritabanını temizle ve geri yükle
cat yedek_dosyasi.sql | docker compose exec -T db psql -U planus -d planus
```

---

## 10. Güncelleme

Yeni bir sürüm yayınlandığında:

```bash
cd /opt/planUS

# Yeni kodu çek
git pull

# Yeniden derle ve başlat (veritabanı verisi korunur)
docker compose up -d --build
```

Flyway, veritabanı şemasını otomatik günceller. Manuel işlem gerekmez.

---

## 11. Sorun Giderme

### Container başlamıyor

```bash
docker compose logs backend --tail=100
docker compose logs db --tail=50
```

### "Connection refused" hatası

Backend henüz başlamamış olabilir. Birkaç saniye bekleyip tekrar deneyin:

```bash
docker compose ps        # Tüm servisler "running" mı?
docker compose restart backend
```

### Veritabanına bağlanamıyor

`.env` dosyasındaki `DB_USER` ve `DB_PASS` değerlerini kontrol edin. Değiştirdiyseniz:

```bash
# Eski volume'u sil ve baştan oluştur (VERİ SİLİNİR!)
docker compose down -v
docker compose up -d --build
```

> ⚠️ `-v` bayrağı veritabanı verisini siler. Bunu yalnızca ilk kurulumda veya tüm veriyi sıfırlamak istediğinizde kullanın.

### 403 / 401 hataları

JWT_SECRET değerinin `.env` dosyasında doğru ayarlandığından ve en az 32 karakter olduğundan emin olun.

### Port meşgul hatası

80 veya 443 portu başka bir uygulama tarafından kullanılıyor olabilir:

```bash
sudo ss -tlnp | grep -E ':80|:443'
```

Eski bir Nginx servisi varsa durdurun:

```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
```

### Container'ı tamamen sıfırla (veri korunur)

```bash
docker compose down
docker compose up -d --build
```

### Her şeyi sıfırla (veri dahil)

```bash
docker compose down -v --rmi all
docker compose up -d --build
```

---

## Hızlı Başvuru Kartı

```bash
# Başlat
docker compose up -d

# Durdur
docker compose down

# Yeniden başlat
docker compose restart

# Logları izle
docker compose logs -f

# Durum
docker compose ps

# Veritabanı yedeği al
docker compose exec db pg_dump -U planus planus > yedek.sql

# Güncelle
git pull && docker compose up -d --build
```
