# Bedrock v0.9 — Android paketleme notları

Bu sürüm PWA olarak aynı HTTPS alan adında çalışmaya devam eder. Android paketine geçerken aynı origin'i korumak önemlidir; IndexedDB kasa verileri origin ve tarayıcı profiline bağlıdır.

TWA paketinde WebAuthn PRF kullanılabilirliği Android sürümü, tarayıcı, authenticator ve Digital Asset Links yapılandırmasına bağlıdır. Otomatik WebAuthn istemi bazı WebView/TWA sürümlerinde kullanıcı hareketi isteyebilir; ana parola yedeğini kaldırma.

Fotoğraf seçimi HTML file input ile yürütülür: kamera girişi `capture=environment`, galeri girişi çoklu dosya seçimini kullanır. Paketleme sonrası fiziksel cihazda iki akışı da test et.
