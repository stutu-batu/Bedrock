# Bedrock — v0.5

Bedrock; yazılı notları, eşya konumlarını, parola kayıtlarını, sesleri ve fotoğrafları cihazında tutan, çevrimdışı çalışabilen şifreli kişisel kasa PWA'sıdır.

## v0.5 yenilikleri

- **Parola kayıtları:** Hizmet adı, kullanıcı adı/e-posta, parola, site adresi ve ek notlar tek kayıt içinde saklanır.
- **Hassas gösterim:** Parolalar kayıt listesinde gösterilmez. Detay ekranında kullanıcı açabilir veya tek tek kopyalayabilir.
- **Şifreli yedekleme:** Kasa ana parolası tekrar doğrulanır; yedek dosyasının tamamı ayrıca AES-256-GCM ile şifrelenir.
- **Geri yükleme:** `.bedrock` yedeği seçilir, ana parola ile açılır ve açık onaydan sonra mevcut kasa yerine yüklenir. Yedek dosyası için 100 MB boyut sınırı uygulanır.
- **Biyometrik kayıtlar:** Yedek dosyasına cihaz-özel biyometrik bağ eklenmez; geri yüklemeden sonra biyometrik hızlı açma tekrar kurulabilir.
- **Fotoğraf optimizasyonu:** Büyük görseller uygunsa 1600 piksel uzun kenara ve JPEG kalite 0.82 seviyesine indirilerek saklanır.
- **Mobil performans:** Kayıtlar küçük gruplar halinde çözülür, arama 120 ms gecikmeyle toplulaştırılır, liste DOM'a tek parça eklenir ve mobilde ağır arka plan bulanıklığı azaltılır.
- **PWA güncellemesi:** Service Worker önbelleği v5 olarak yenilenir. Aynı yayın adresi ve tarayıcı profili korunur.

## v0.4'ten yükseltme

1. Önce mevcut Bedrock yedeğini alabilir durumdaysan yedekle. v0.4'te dışa aktarma yoksa, kritik tek kopya kayıtlarını yedekleme eklenene kadar silme.
2. v0.5 dosyalarını aynı HTTPS alan adına ve aynı klasör yoluna yükle. `manifest.webmanifest` içindeki `id`, `start_url` ve `scope` değerlerini değiştirme.
3. Telefonda aynı Chrome profiliyle Bedrock'u çevrimiçiyken bir kez aç. Service Worker yeni önbelleği kurar.
4. Var olan kasa ana parolasıyla giriş yap. v0.5 mevcut `bedrock-local` IndexedDB veritabanını ve şemayı korur.

> GitHub Pages/host üzerinde dosyaları güncelledikten sonra tarayıcı eski uygulamayı göstermeye devam ederse uygulamayı tamamen kapatıp yeniden aç. Site verilerini veya IndexedDB'yi temizleme.

## Şifreleme

- Kasa veri anahtarı rastgele 256 bit olarak oluşturulur.
- Ana parola PBKDF2-HMAC-SHA-256 ile 310.000 yineleme kullanılarak AES-256-GCM anahtarına dönüştürülür ve veri anahtarını sarmalar.
- Not metaverisi, parola alanları, fotoğraflar ve sesler ayrı IV ve kayıt/ek kimliğiyle ilişkili ek doğrulama verisi (AAD) kullanılarak AES-GCM ile şifrelenir.
- Dışa aktarılan yedek, aynı ana parola yeniden doğrulandıktan sonra yeni salt ve IV ile ayrıca AES-256-GCM olarak şifrelenir.
- Şifreli yedek dosyası tüm kayıtları ve kasa anahtarının parola ile sarılmış yapılandırmasını içerir. Geri yükleme yedeğin alındığı dönemdeki ana parolayı gerektirir.
- Arama yalnızca kasa açıkken belleğe alınmış çözülmüş alanlarda yapılır. Parola değerinin kendisi arama dizisine eklenmez.

## Yedekleme kullanımı

**Yedek oluştur:** Ayarlar → Şifreli yedek oluştur → ana parolanı tekrar gir → `.bedrock` dosyasını ayrı ve güvenli bir yerde sakla.

**Geri yükle:** Kilit ekranındaki veya Ayarlar bölümündeki geri yükleme düğmesi → `.bedrock` dosyasını seç → yedek alındığında kullanılan ana parolayı gir → mevcut kasanın tamamının değişeceğini onayla.

Geri yükleme birleştirme yapmaz; mevcut kayıtların yerine yedek içeriğini koyar. Başka cihazda biyometrik hızlı açma devre dışı kalır ve yeniden kurulması gerekir.

## Güvenlik uyarıları

- Ana parolanı unutursan ve kullanılabilir biyometrik açman yoksa kasa ve yedekler kurtarılamaz.
- Yedek dosyası ile ana parolayı aynı yerde saklama.
- Ana parolanı değiştirdikten sonra eski yedekler, yedeği aldığın tarihteki eski ana parolayı kullanır.
- Bedrock tarayıcı depolamasını kullanır. Uygulama verisini/tarayıcı site verilerini silmek yerel verileri silebilir.
- Kasa açıkken cihazına erişebilen zararlı yazılım, ekran kaydı veya kötü amaçlı uzantılar çözülmüş bilgileri okuyabilir. Şifreleme her saldırı türüne karşı mutlak koruma değildir.
- Bu proje kişisel bir prototiptir; kritik hesapların için profesyonel, denetlenmiş bir parola yöneticisinin yerini aldığı varsayılmamalıdır.
- Parolayı görüntüleme/kopyalama işlemi yalnızca kullanıcının açıkça seçmesiyle yapılır. Pano içeriği diğer uygulamalarda erişilebilir olabilir; gerekmiyorsa kopyalama.

## Yerel geliştirme

```bash
python -m http.server 8000
```

Bilgisayarda `http://localhost:8000` açılır. Android cihazda kamera, mikrofon, Web Crypto, Service Worker ve WebAuthn için HTTPS gerekir. Telefonda, uygulamayı daha önce kullandığın **aynı origin** üzerinden aç.

## Android APK / TWA paketleme

Bedrock önce HTTPS üzerinde yayınlanan bir PWA olarak kalır. Android uygulaması oluşturmak için PWABuilder arayüzü kullanılabilir; PWABuilder Android çıktısı Bubblewrap tabanlı Trusted Web Activity (TWA) üretir. Android Studio'yu elle kullanmadan paket hazırlanabilir, ancak paketlemenin arka planında Android araç zinciri kullanılır.

Ayrıntılı adımlar için `ANDROID-PACKAGING.md` dosyasına bak. TWA'nın tam ekran doğrulaması için imzalı uygulamaya ait SHA-256 sertifika parmak izini içeren `/.well-known/assetlinks.json` dosyası sitenin origin kökünde yayınlanmalıdır.

## Teknik dosyalar

- `index.html` — uygulama yapısı
- `styles.css` — masaüstü ve mobil görünüm
- `app.js` — kasa, şifreleme, parola kayıtları, kamera/ses ve yedekleme
- `sw.js` — çevrimdışı uygulama kabuğu (v5 cache)
- `manifest.webmanifest` — PWA/Android uygulama metaverisi
- `icons/` — uygulama simgeleri
