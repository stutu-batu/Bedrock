# Bedrock — v0.3

Bedrock, notlarını, eşya konumlarını, ses kayıtlarını ve fotoğraflarını cihazında tutan; ana parola ile şifrelenmiş çevrimdışı bir PWA prototipidir.

## v0.3 özellikleri
- İlk açılışta ana parola ve kasa oluşturma ekranı
- Ana parola üzerinden PBKDF2-SHA-256 (310.000 yineleme) ile anahtar türetme
- Kayıt metaverilerinin AES-256-GCM ile şifrelenmesi
- Ekli fotoğraf ve ses dosyalarının ayrı AES-256-GCM şifrelemesi
- Var olan v0.2 notlarının ilk kasa kurulurken otomatik şifrelenerek korunması
- Ana parola ile kilit açma ve uygulamayı elle kilitleme
- Uygulama 5 dakikadan uzun süre arka planda kalırsa otomatik kilitleme
- Ana parola değiştirme (eski biyometrik hızlı açma bu işlemde güvenlik nedeniyle kapatılır)
- WebAuthn PRF desteği bulunan cihazlarda biyometrik/cihaz doğrulamasıyla hızlı açma
- WebAuthn PRF desteği yoksa parola ile girişe geri dönüş

## Şifreleme tasarımı
- Uygulama her kasa için rastgele 256 bitlik bir veri anahtarı üretir.
- Ana parola, rastgele salt ile PBKDF2-SHA-256 kullanılarak AES-GCM anahtarına dönüştürülür. Veri anahtarı bu anahtarla sarılır; ana parolanın kendisi saklanmaz.
- Her kayıt metaverisi ve her ek dosya AES-GCM ile ayrı IV kullanılarak şifrelenir. Kayıt kimliği ek doğrulama verisine (AAD) dahil edilir.
- Şifrelenmiş kayıtlar IndexedDB'de tutulur. Arama, kasa açıkken belleğe alınmış ve çözülmüş kayıtlar üzerinde yapılır.
- Biyometrik hızlı açma, WebAuthn PRF uzantısının desteklendiği cihazlarda PRF çıktısından HKDF ile türetilen anahtarla veri anahtarını sarar. Yalnızca parmak izi/cihaz doğrulamasının başarılı olduğu WebAuthn akışından PRF çıktısı alınabiliyorsa etkinleştirilir. Bu özellik her Android cihazda veya tarayıcıda bulunmaz.

## Çok önemli güvenlik notları
- Ana parolanı unutursan ve biyometrik açma da kullanılamazsa veriler kurtarılamaz. Bu uygulamada henüz kurtarma veya yedek geri yükleme özelliği yoktur. Ana parolayı güvenli bir yerde sakla.
- Biyometrik hızlı açma cihazın WebAuthn PRF desteğine bağlıdır. Uygulama ayarlarında destek yoksa etkinleştirme başarısız olur; ana parola her zaman temel giriş yöntemidir.
- Biyometrik kayıt, uygulamanın kurulu olduğu web alan adına bağlıdır. Uygulama başka bir alan adına taşınırsa WebAuthn biyometrik kaydını yeniden kurman gerekir.
- Cihazın işletim sistemi kilidi, güncel tarayıcı ve güvenli HTTPS bağlantısı kullanılmalıdır.
- Şifreleme, cihazda uygulama açıkken ve kasa kilidi kaldırılmışken kötü amaçlı yazılıma veya ele geçirilmiş tarayıcıya karşı mutlak koruma sağlamaz. Uygulamayı yalnızca güvendiğin bir HTTPS alanında barındır.
- Uygulamayı veya tarayıcı site verilerini silmek IndexedDB kayıtlarını silebilir. Bu yüzden gerçek ve tek kopya kayıtlarını saklamadan önce şifreli yedekleme özelliğinin sonraki sürümde eklenmesini bekle.
- Bu sürüm parola alanları için ayrı bir parola yöneticisi arayüzü sağlamaz; şifreli genel kayıt kasasıdır.

## Kurulum ve test
Geliştirme için proje klasöründe:

```bash
python -m http.server 8000
```

Bilgisayarda `http://localhost:8000` adresini aç. `localhost`, geliştirme sırasında Web Crypto ve Service Worker için güvenli bağlam olarak kabul edilir. Android'de kullanmak için tüm dosyaları HTTPS destekleyen bir statik barındırma alanına yükle; Android tarayıcısında açıp **Ana ekrana ekle / Uygulamayı yükle** seçeneğini kullan. İlk kurulumdan sonra Service Worker uygulama kabuğunu çevrimdışı açmaya hazırlar.

## v0.2'den yükseltme
- Önce v0.2'nin kurulu olduğu aynı tarayıcı profili ve aynı web alan adını kullan.
- v0.3'ü aynı adreste yayınla ve aç. IndexedDB sürümü yükseltilir; mevcut notlar ve medya ilk ana parola oluşturulduğunda şifrelenir.
- İlk kasa kurulumundan sonra uygulama eski kayıtları şifreli biçime dönüştürür. İşlem bitmeden sekmeyi kapatma.
- v0.2 verileri başka tarayıcı profiline veya farklı bir alan adına otomatik taşınmaz.

## Sınırlar
- WebAuthn PRF gerçek Android telefonunda ayrıca denenmelidir; bu geliştirme ortamında biyometrik donanım test edilemez.
- Ses kaydı için MediaRecorder, mikrofon izni ve HTTPS gerekir. Kamera/galeri Android dosya seçicisini kullanır.
- Ses kaydı en fazla 10 dakika, tek fotoğraf dosyası en fazla 18 MB olabilir.
- Şifreli dışa aktarma/geri yükleme bu sürümde henüz yoktur.
