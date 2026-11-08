# Bedrock — v0.7

Bedrock; yazılı notları, eşya konumlarını, parola kayıtlarını, sesleri ve fotoğrafları cihazında tutan, çevrimdışı çalışabilen şifreli kişisel kasa PWA'sıdır.

## v0.7 yenilikleri

- **Gelişmiş arama:** Başlık, açıklama, kullanıcı adı/web adresi, kategori, etiket ve ek dosya adlarında arama.
- **Filtreleme:** Son güncelleme tarihine (bugün / 7 gün / 30 gün / daha eski), kayıt içeriğine (metin / fotoğraf / ses / medya / parola) göre filtreleme.
- **Sıralama:** En yeni, en eski, başlık A–Z ve Z–A.
- **Arşiv:** Kayıtları silmeden ana listeden kaldırma, arşive taşıma ve arşivden geri alma. Arşiv metadata'sı da şifreli.
- **Hatırlatmalar:** Yazılı not ve eşya kayıtlarına yerel tarih-saat seçerek hatırlatma ekleme. İzin verildiğinde Service Worker üzerinden Android bildirimi gösterilir; uygulama tekrar açıldığında geçmiş zamanı gelmiş ve henüz işlenmemiş hatırlatmalar da kontrol edilir.
- **Eski kayıt uyumluluğu:** v0.6 kayıtlarında bulunmayan `archivedAt`, `reminderAt` ve `reminderNotifiedAt` alanları varsayılan olarak boş atanır.
- **Yedek uyumluluğu:** Şifreli kayıt zarfının biçimi ve yedek formatı değişmedi. Yeni alanlar kayıt metaverisinin şifreli içeriğine eklendi; eski yedekler açılabilir.
- **PWA güncellemesi:** Service Worker önbelleği `bedrock-shell-v7-0` olarak yenilendi.

## Hatırlatmaların PWA sınırı

PWA sürümünde alarm zamanlayıcısı uygulama sayfası çalışırken zamanlayıcı kurar; bildirim izni varsa `ServiceWorkerRegistration.showNotification()` kullanır. Android Chrome'da bildirimler Service Worker üzerinden gösterilmelidir.

**Uygulama tamamen kapatıldığında sıradan PWA JavaScript zamanlayıcısı çalışmaya devam etmez.** Bu nedenle yalnızca PWA ile uygulama kapalıyken kesin zamanlı, çevrimdışı alarm garantisi verilemez. Uygulama açıkken veya arka planda tarayıcı sayfayı yaşattığı sürece bildirim gösterilebilir; kapatıldıysa Bedrock tekrar açıldığında zamanı geçmiş ve işlenmemiş hatırlatmalar kontrol edilir. İzin kapalıysa Bedrock açıkken uygulama içi uyarı gösterir.

Uygulama kapalıyken güvenilir alarm için v1.0 APK aşamasında TWA yerine yerel bildirim eklentisi içeren bir Android kabuğu (ör. Capacitor Local Notifications) kullanılmalı veya TWA'ya özel native Android köprüsü eklenmelidir. Bu ayrı bir Android entegrasyonudur; hatırlatmalar internet/push sunucusu kullanmaz.

## Güncelleme

1. **Önce şifreli yedek al.** Özellikle ana parolanı güvenli yerde tuttuğundan emin ol.
2. ZIP içindeki `bedrock-v0.7` klasörünün içeriğini mevcut GitHub Pages deposunun aynı dizinine yükle ve eski dosyaların üzerine yaz.
3. `manifest.webmanifest` içindeki `id`, `start_url` ve `scope` değerlerini değiştirme. Aynı domain/klasör yolunu kullan.
4. Telefonda aynı Chrome profiliyle Bedrock'u çevrimiçiyken bir kez aç. Service Worker v7 önbelleğini kuracaktır.
5. Eski ana parolanla giriş yap. IndexedDB adı ve sürümü değişmedi.

> Tarayıcı site verilerini veya IndexedDB'yi temizleme. Uygulama verisini silmek yerel kayıtlarını silebilir.

## Kullanım

- Kayıt oluştur/düzenle ekranında `Hatırlatma zamanı` alanına yerel tarih ve saat seç.
- Bildirim iznini Ayarlar → Hatırlatma bildirimlerini etkinleştir yoluyla ver.
- Hatırlatma zamanı geldiğinde PWA çalışıyorsa bildirim gösterilir. Uygulama kapalı kalmışsa açıldığında zamanı geçmiş hatırlatmalar kontrol edilir.
- Bir kayıt arşivlendiğinde veya çöp kutusuna taşındığında hatırlatması geçici olarak bekletilir. Arşivden çıkarıldığında/geri yüklendiğinde tekrar takip edilir.
- Tarih/içerik filtrelerini `Filtrele ve sırala` alanından kullan. `Filtreleri sıfırla` arama ve görünüm filtrelerini temizler.

## Yerel geliştirme

```bash
python -m http.server 8000
```

Bilgisayarda `http://localhost:8000` açılır. Android cihazda kamera, mikrofon, Web Crypto, Service Worker, bildirim ve WebAuthn için HTTPS gerekir.

## Güvenlik notu

Etiketler, favoriler, silme, arşiv ve hatırlatma metadata'sı AES-256-GCM ile şifrelenen kayıt verisinin içindedir. Yedek dosyası şifreli kalır. Bildirim başlığı uygulama/telefon ekranında görünebilir; bu nedenle parola veya çok hassas bilgileri kayıt başlığına yazmamaya dikkat et.

Bedrock kişisel bir prototiptir; kritik hesaplar için profesyonel, bağımsız denetimli parola yöneticisinin yerini aldığı varsayılmamalıdır.
