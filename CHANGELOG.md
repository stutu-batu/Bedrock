# Bedrock sürüm notları

## v0.8.0

- Yeni yedek biçimi v2 eklendi. Dış yedek başlığındaki sürüm/KDF/yineleme bilgileri AES-GCM ek doğrulama verisine bağlandı.
- v0.7 `bedrock-backup-v1` dosyaları geri yüklenmeye devam eder.
- Yedek geri yüklemeden önce kasa anahtarı açılır; her kayıt metaverisi ve her fotoğraf/ses eki tek tek doğrulanır.
- Bozuk, değiştirilmiş, yinelenen kimlikli veya biçimi geçersiz kayıtları veritabanına yazmadan reddetme.
- Geri yükleme, tüm doğrulamalar tamamlandıktan sonra tek bir IndexedDB readwrite transaction içinde yapılır.
- `Yedek dosyasını doğrula` modu eklendi. Dosyayı kontrol eder ancak mevcut kasayı değiştirmez.
- Ayarlara AES-GCM round-trip, değiştirilmiş şifreli verinin reddi, kasa ayarı ve yerel kayıt/ek bütünlüğü testleri eklendi.
- Düşük belleğe sahip telefonlarda medya doğrulaması tek ek üzerinden yürütülür; tüm açılmış medyalar bellekte biriktirilmez.
- Node.js bağımlılıksız geliştirici testleri eklendi: v2/v1 içe aktarma, yanlış parola, bozuk kayıt/ek, KDF başlığı değişikliği ve yinelenen kimlik senaryoları.
- Service Worker önbelleği `bedrock-shell-v8-0` olarak yenilendi.

## Güvenlik sınırları

Bu kontroller uygulama içi temel bütünlük ve şifreleme testleridir. Bağımsız sızma testi, kaynak kodu denetimi veya profesyonel kriptografik inceleme değildir. Ana parolanı kaybedersen kurtarma anahtarı yoktur. Yedek dosyasını ana paroladan ayrı ve güvenli bir yerde sakla.
