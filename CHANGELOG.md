# Bedrock v0.9.0

## Görünüm ve kullanım iyileştirmeleri
- Koyu/açık tema, vurgu rengi ve kompakt/rahat ekran düzeni eklendi.
- Tercihler cihazda tutulur; kasa kayıtlarının şifrelemesini değiştirmez.
- Ana sayfanın sağındaki dikey kaydırma çubuğu gizlendi; kaydırma davranışı korunur.

## Fotoğraf akışı
- Fotoğraf eklerken önce Kamera veya Galeri seçimi gösterilir.
- Bir not/eşya kaydı düzenlenirken sonradan birden fazla fotoğraf eklenebilir.
- Yeni fotoğraflar notun Kaydet düğmesine basılınca şifreli biçimde kayda eklenir.

## Biyometrik açılış
- Ayarlara, uygulama açıldığında otomatik biyometrik doğrulama başlatma tercihi eklendi.
- Bu seçenek yalnızca biyometrik hızlı açma kurulmuşsa kullanılabilir.
- Bazı tarayıcılar WebAuthn için kullanıcı dokunuşu isteyebilir; manuel biyometrik düğme ve ana parola yedeği korunur.

## Veri ve yükseltme
- IndexedDB şeması değiştirilmedi.
- Mevcut v0.8 kayıtları ve şifreli yedek biçimleri korunur.
- Biyometrik otomatik giriş tercihi cihaza özgüdür ve yedeğe aktarılmaz.
