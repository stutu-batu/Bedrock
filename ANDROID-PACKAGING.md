# Bedrock'u Android APK'ya paketleme

Bedrock'u Android Studio kullanmadan kurulum dosyasına dönüştürmek için PWABuilder'ın Android paketleme arayüzünü kullan.

## Ön koşullar

- Bedrock HTTPS üzerinde yayınlanmalı ve telefonda açılmalı.
- `manifest.webmanifest`, simgeler ve Service Worker yayındaki adresten ulaşılabilir olmalı.
- PWA'nın sabit HTTPS adresini koru. Uygulamanın IndexedDB kayıtları ve WebAuthn biyometrik kimliği origin'e bağlıdır.

## PWABuilder ile APK

1. `https://www.pwabuilder.com/` adresini aç.
2. Bedrock'un tam HTTPS adresini gir. Örnek biçim: `https://KULLANICI.github.io/bedrock/`.
3. PWA raporunda Manifest ve Service Worker hatalarını gider.
4. **Package for stores** bölümüne, ardından **Android** paketine geç.
5. Sadece kendi telefonuna yükleyip test edeceksen **Other Android** paket seçeneğini kullan. Mağaza yayını ayrı gereksinimler taşır.
6. Uygulama adı: `Bedrock`. Paket kimliğini kendin belirle ve sabit tut; örneğin `com.kullaniciadi.bedrock` yalnızca örnek biçimdir.
7. Yeni imzalama anahtarı oluşturuluyorsa indirme paketindeki keystore dosyasını ve şifre bilgisini güvenli şekilde sakla. Bunlar kaybolursa aynı uygulamanın güncellemelerini aynı imzayla üretmek sorun olur.
8. Paket dosyasını indirip APK'yı Android telefonuna aktar ve yükle.

## Tam ekran TWA doğrulaması

TWA, uygulamanın web içeriğini Android uygulama penceresinde Chrome tabanlı olarak açar. Uygulama ile web alan adının sahipliğini doğrulamak için Digital Asset Links gerekir.

1. PWABuilder'ın indirdiği paketteki `assetlinks.json` dosyasını bul.
2. Paket kimliğini ve SHA-256 sertifika parmak izini doğrula.
3. Dosyayı sitenin origin kökünde şu adrese yayınla: `https://SENIN-ALAN-ADIN/.well-known/assetlinks.json`.
4. Dosyanın HTTPS üzerinden, oturum açmadan erişilebilir olduğunu kontrol et.
5. TWA'yı yeniden aç. Doğrulama başarısızsa Chrome, tam ekran yerine tarayıcı arayüzlü Custom Tab görünümüne düşebilir.

**GitHub Pages notu:** Proje sayfası `https://kullanici.github.io/bedrock/` biçimindeyse, Digital Asset Links dosyası genel olarak `https://kullanici.github.io/.well-known/assetlinks.json` origin kökünde bulunmalıdır. Proje deposunun alt dizinine koymak tek başına yeterli olmayabilir. Özel alan adı kullanmak veya kullanıcı sayfasının kökünü yönetmek gerekebilir.

## Bedrock için önemli not

TWA, tamamen yerel bir Android arayüzü değildir; HTTPS üzerinde yayınlanan PWA'yı Android'de uygulama penceresinde açar. Service Worker ilk çevrimiçi ziyarette uygulama kabuğunu önbelleğe alır; sonrasında çevrimdışı açılış mümkün olur. Kamera/mikrofon ve WebAuthn desteği, kullanılan Android tarayıcısının yeteneklerine bağlı kalır.

Resmî açıklamalar:
- PWABuilder Android paketleme: https://github.com/pwa-builder/PWABuilder/blob/main/docs/builder/other-android.md
- Chrome TWA hızlı başlangıç: https://developer.chrome.com/docs/android/trusted-web-activity/quick-start

## v0.8 yedek ve güvenlik notu

APK paketlemeden önce v0.8 içinden bir şifreli yedek al ve mümkünse `Yedek dosyasını doğrula` ile doğrula. TWA/uygulama paketi aynı HTTPS origin ve alt yolunu kullanmalı; aksi hâlde IndexedDB ve WebAuthn kaydı ayrı bir origin olarak değerlendirilir.

## v0.7 hatırlatma bildirimi notu

PWA Service Worker bildirim gösterebilir, ancak sayfa tamamen kapalıyken gelecekteki yerel bir alarmı kendi kendine başlatamaz. Uygulama kapalıyken kesin ve çevrimdışı alarm için Android yerel bildirim API'si kullanan bir paketleme katmanı veya native köprü gerekir. TWA tek başına bu yerel zamanlayıcıyı sağlamaz.
