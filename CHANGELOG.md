# Bedrock v0.9.1 – Kasa açılış hatası düzeltmesi

- Kasa formu, diğer arayüz kontrollerinden önce bağlanır; JavaScript başlatma sorunu yaşansa bile form tarayıcıya GET olarak gönderilip sayfayı yenilemez.
- JavaScript dosyası yüklenemezse ekranda açıklayıcı hata gösterilir.
- `app.js` ve `styles.css` için sürümlü URL kullanılır; eski Service Worker önbelleğinden v0.9 dosyalarının gelmesi engellenir.
- Service Worker önbelleği `bedrock-shell-v9-1` olarak güncellendi.
- Kasa ayarı bulunamadığı halde şifreli kayıtlar varsa yeni kasa oluşturma engellenir; mevcut kayıtları ezmek yerine kurtarma/şifreli yedek geri yükleme ekranı gösterilir.
- Var olan DB adı, veritabanı sürümü ve şifreli yedek biçimleri değiştirilmedi.
