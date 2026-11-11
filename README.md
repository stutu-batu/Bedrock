# Bedrock v0.9.0

Bedrock, kişisel kayıtlarını cihazında şifreli saklayan çevrimdışı odaklı bir PWA'dır.

## v0.9 yenilikleri
- Görünüm: koyu/açık tema, dört vurgu rengi, kompakt/rahat düzen.
- Fotoğraf eklerken kamera veya galeri kaynağını seçme.
- Var olan not/eşya kaydını düzenlerken daha sonra birden fazla fotoğraf ekleme. Fotoğraflar, kayıttaki **Kaydet** düğmesine basıldığında şifrelenerek saklanır.
- Ayarlarda uygulama açılırken otomatik biyometrik doğrulama başlatma seçeneği.
- Sağ dikey kaydırma çubuğu gizlendi; sayfa ve modaller kaydırılmaya devam eder.

## Güncelleme
1. Önce v0.8'den şifreli yedek almanı öneririz.
2. Bu klasörün tüm içeriğini mevcut HTTPS yayın dizinine, klasör yapısını koruyarak yükle.
3. Aynı yayın adresini ve tarayıcı profilini kullan. Tarayıcı verilerini/IndexedDB'yi temizleme.
4. Bedrock'u internet açıkken yeniden aç; Service Worker önbelleği `bedrock-shell-v9-0` sürümüne yükselir.

## Fotoğraf ekleme
- Ana ekrandaki Fotoğraf kartı artık önce Kamera / Galeri seçimini açar.
- Bir notu düzenlerken **Fotoğraf ekle** düğmesine dokun. Galeriden birden fazla fotoğraf seçebilir veya kamerayla tek tek çekebilirsin.
- Seçilen fotoğraflar düzenleme ekranında önizlenir. Kalıcı ekleme için notu kaydet. Kaydetmeden formu kapatırsan bekleyen yeni fotoğraflar eklenmez.

## Otomatik biyometrik giriş
1. Ayarlar'da biyometrik hızlı açma daha önce kurulmuş olmalı.
2. **Uygulama açılınca otomatik biyometrik giriş** anahtarını aç.
3. Bedrock açıldığında biyometrik doğrulamayı otomatik başlatmayı dener.
4. Android tarayıcısı/WebAuthn etkileşim gerektirirse ekrandaki biyometrik düğmesine dokun veya ana parolanı kullan.

Biyometrik otomatik giriş tercihi cihaz ve tarayıcı profiline özeldir, şifreli yedeğe dahil edilmez.

## Görünüm ayarları
Tema, vurgu rengi ve yoğunluk tercihi cihazın `localStorage` alanında tutulur. Bunlar kasa verisi değildir ve notların şifrelemesini etkilemez.

## Test
- JavaScript: `node --check app.js`
- Yedekleme güvenlik testleri: `node --test tests/backup-security.test.cjs`

Not: PWA'da otomatik biyometrik WebAuthn istemi bazı tarayıcılarda kullanıcı hareketi gerektirebilir. Ana parola ve manuel biyometrik giriş seçenekleri korunur.
