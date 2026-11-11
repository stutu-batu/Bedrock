# Bedrock v0.9.1

## Önemli düzeltme
v0.9'da görülen kasa oluşturma ekranına dönme / form gönderince sayfanın yenilenmesi sorunu için açılış akışı güçlendirildi. Güvenlik formu en başta bağlanır ve normal tarayıcı form gönderimi kapatılır. Ana JavaScript dosyası yüklenemezse ekranda dosya yolu hatası gösterilir. Eski önbelleği atlamak için `app.js` ve `styles.css` sürüm parametresiyle yüklenir.

## Mevcut kasa verileri
- Veritabanı adı `bedrock-local`, şema sürümü `3` olarak korunmuştur.
- Kasa ayarı bulunursa doğrudan kilit açma ekranı gösterilir.
- Kasa ayarı bulunmadığı halde şifreli kayıtlar tespit edilirse yeni kasa oluşturulmaz; kurtarma ekranı gösterilir.
- Yeni sürüm eski v0.8/v0.9 veritabanı ve şifreli yedek biçimlerini değiştirmez.

## Güncelleme – çok önemli
1. Mevcut kasanın bulunduğu **aynı HTTPS adresini** kullan.
2. ZIP'i aç. `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest` ve `icons/` doğrudan ZIP'in kök dizinindedir. **Üst klasörü değil, ZIP içindeki bu dosya ve klasörlerin tamamını yayın dizininin köküne yükle.**
3. Eski `index.html`, `app.js`, `styles.css` ve `sw.js` dosyalarının üzerine yaz.
4. Telefonunda siteyi internet açıkken yenile. `app.js?v=0.9.1` isteğinin başarılı yüklendiğini doğrula.
5. Tarayıcı verilerini, IndexedDB'yi veya site depolamasını silme.

## Eğer hâlâ kasa oluşturma ekranı gelirse
- Tarayıcı adres çubuğundaki adresin, kasayı ilk oluşturduğun HTTPS adresiyle birebir aynı olduğunu kontrol et.
- Farklı bir tarayıcı profili / gizli sekme / farklı alan adı ayrı IndexedDB alanı kullanır.
- Yeni kasa oluşturma düğmesine basarak eski kasayı kurtarmaya çalışma. Şifreli `.bedrock` yedeğini geri yükle veya eski adresi kullan.
- Şifrelenmiş kayıtlar bulunduğu halde kasa ayarı yoksa v0.9.1 yeni kasa oluşturmayı engeller.

## Teknik
- DB: IndexedDB `bedrock-local`, version `3` (değişmedi).
- AES-GCM/PBKDF2 kasa biçimi ve backup biçimi korunmuştur.
- Service Worker cache: `bedrock-shell-v9-1`.
