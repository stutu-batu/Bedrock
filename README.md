# Bedrock — v0.8.0

Bedrock; notları, eşya konumlarını, parola kayıtlarını, sesleri ve fotoğrafları cihazda tutan şifreli kişisel kasa PWA'sıdır.

## v0.8 yenilikleri

- **Şifreli yedekleme v2:** AES-GCM ile doğrulanan yeni yedek başlığı. KDF parametreleri de ek doğrulama verisine bağlanır.
- **Eski yedek uyumluluğu:** v0.7 ve önceki `bedrock-backup-v1` yedekleri içe aktarılabilir.
- **Geri yükleme öncesi tam doğrulama:** Dış dosya şifresi, kasa anahtarı, her kayıt metaverisi ve her medya eki doğrulanmadan IndexedDB değiştirilmez.
- **Yedek doğrulama modu:** Bir `.bedrock` dosyasını deneyip mevcut kasaya dokunmadan doğrulayabilirsin.
- **Güvenlik kontrol paneli:** AES-GCM şifrele/aç testi, değiştirilmiş verinin reddedilmesi, kasa yapılandırması ve yerel kayıt/ek bütünlüğü kontrolü.
- **Bellek kullanımı:** Medya ekleri sırayla doğrulanır; büyük tüm ekler aynı anda belleğe açılmaz.

## Güncelleme

1. Önce mevcut Bedrock kasandan şifreli yedek al.
2. ZIP içindeki `bedrock-v0.8` klasörünün içeriğini mevcut GitHub Pages deposunun aynı dizinine yükle ve eskilerin üzerine yaz.
3. `manifest.webmanifest` içindeki `id`, `start_url` ve `scope` değerlerini değiştirme.
4. Telefonda aynı HTTPS adresini aynı Chrome profiliyle bir kez çevrimiçi aç. Yeni Service Worker `bedrock-shell-v8-0` önbelleğini kuracaktır.
5. Eski ana parolanla giriş yap. IndexedDB adı ve sürümü değiştirilmedi.

> Tarayıcı site verilerini temizleme. Uygulamanın yerel IndexedDB kayıtları silinebilir.

## Yedek oluşturma

Ayarlar → Şifreli yedekleme → Şifreli yedek oluştur. Kasa ana parolanı tekrar gir. İndirilen `.bedrock` dosyasını cihaz dışında güvenli bir yerde sakla. Yedek dosyası parola ile korunduğu için parolayı da dosyanın yanında tutma.

## Yedeği doğrulama

Ayarlar → Yedek dosyasını doğrula. `.bedrock` dosyanı seç ve yedeği oluştururken kullandığın parolayı gir. Bedrock önce dış şifrelemeyi, sonra kasa anahtarını, kayıtları ve ekleri doğrular. Bu mod mevcut veritabanını değiştirmez.

## Yedekten geri yükleme

Ayarlar → Şifreli yedekten geri yükle. Bedrock geri yüklemeden önce yedekteki her kaydı ve medya ekini doğrular. Ardından açık onay ister. Geri yükleme mevcut kasanın tamamını yedekteki hâliyle değiştirir. Önce mevcut kasanın ayrıca yedeğini al. Geri yükleme sonrası biyometrik hızlı açma sıfırlanır; kasayı yedekteki ana parola ile açıp biyometriyi tekrar kurabilirsin.

## Güvenlik testleri

Ayarlar → Güvenlik testlerini çalıştır. Geliştirici bilgisayarında Node.js 18 veya üstü kuruluysa ek kriptografik yedek testlerini `node tests/backup-security.test.cjs` komutuyla da çalıştırabilirsin. Bu testler v2 doğrulamasını, v1 geriye dönük uyumluluğunu, yanlış parola reddini, bozuk kayıt/ek reddini, KDF başlık manipülasyonunu ve yinelenen kimlikleri sınar. Kontroller; güvenli bağlam/Web Crypto, AES-GCM round-trip, değiştirilmiş şifreli verinin reddi, kasa ayarlarının varlığı, tüm yerel kayıt/medya bütünlüğü ve mümkünse tarayıcı depolama tahminini inceler.

Bu panel temel uygulama içi testtir; bağımsız güvenlik denetimi veya profesyonel parola yöneticisi sertifikasyonu değildir.

## Teknik bilgiler

- Kayıt verisi ve medya: AES-256-GCM.
- Ana parola ile anahtar koruması: PBKDF2-SHA-256.
- Medya dosyaları yedek ve kayıt doğrulamasında tek tek işlenir.
- Yedek dosyası dışta ayrıca şifrelenmiştir; mevcut kasa anahtarını içeren yapılandırma da içeride korunur.
- Biometrik hızlı açma bu yedek dosyasına taşınmaz; geri yükleme cihazın biyometrik kaydını sıfırlar.
- Yedek dosyası için 100 MB sınırı vardır. Büyük medya arşivlerinde uygulama içi bellek kullanımı artabilir.

## Yerel geliştirme

```bash
python -m http.server 8000
```

Bilgisayarda `http://localhost:8000` kullanılabilir. Kamera, mikrofon, Web Crypto, Service Worker, bildirim ve WebAuthn için Android'de HTTPS gerekir.
