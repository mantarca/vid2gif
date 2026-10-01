# vid2gif - Ekran GIF Kaydedici & Kırpma Düzenleyicisi 🎬

vid2gif, bilgisayar ekranınızı, açık pencereleri veya tarayıcı sekmelerinizi kaydedip; **baştan, sondan veya ortadan istediğiniz bölümleri kesip çıkararak** optimize edilmiş animasyonlu GIF (.gif) olarak kaydetmenizi sağlayan modern bir Manifest V3 Chrome eklentisidir.

---

## ✨ Temel Özellikler

- 🔴 **Ekran, Pencere veya Sekme Kaydı**: Tüm ekranı veya sadece bir uygulama penceresini seçerek yüksek kaliteli kayıt alabilirsiniz.
- ✂️ **Gelişmiş Kırpma & Kesme Düzenleyicisi (Timeline & Trim Editor)**:
  - **Kare Kare Önizleme & Oynatıcı**: Kaydı zaman çizelgesi (slider) üzerinde ileri-geri kaydırarak inceleyebilir, oynatıp durdurabilirsiniz.
  - **Baştan Kırpma**: İstediğiniz kareye gelip *"Bu Kareyi Başlangıç Yap"* diyerek baştaki gecikmeleri veya hazırlık anlarını tek tıkla silebilirsiniz.
  - **Sondan Kırpma**: *"Bu Kareyi Bitiş Yap"* diyerek kaydın sonundaki fazlalıkları kesebilirsiniz.
  - **Ortadan İstenmeyen Bölümü Kesip Çıkarma (Cut Middle)**: İki zaman noktası (Başlangıç - Bitiş) belirleyip aradaki kısmı (örneğin donma anı, duraksama veya özel bir bilgi) kayıttan tamamen çıkarıp videoyu birleştirebilirsiniz.
  - **Kesimleri Sıfırla (Undo/Reset)**: Orijinal kayıt daima hafızada tutulur; dilediğiniz an tüm kesimleri geri alabilirsiniz.
- ⚡ **Tamamen Çevrimdışı ve Güvenli**: Tüm işlemler %100 yerel olarak tarayıcınız içinde gerçekleşir. Sunucuya hiçbir veri gitmez.
- ⚙️ **Özelleştirilebilir GIF Kalitesi**:
  - **FPS Seçimi**: 5, 10 (Önerilen), 15 veya 20 FPS.
  - **Çözünürlük Ölçeği**: 640px, 800px, 1024px, 1280px (720p HD) veya Orijinal.
  - **Renk Paleti**: 256 Renk (Yüksek kalite), 128 Renk veya 64 Renk.
- 📊 **Görsel İlerleme Çubuğu**: Kodlama sürecini adım adım gösteren yüzde (% progress) çubuğu.
- 💾 **Dışa Aktarma & Paylaşım**:
  - Tek tıkla yerel diske `.gif` olarak indirme (özel dosya adı desteğiyle).
  - Panoya kopyalama (WhatsApp, Slack, Discord, GitHub vb. uygulamalara doğrudan `Ctrl+V` ile yapıştırma).
  - İndirme sonrası gerekirse *"Kırpmayı Düzenle"* diyerek aynı kaydı tekrar düzenleyebilme.

---

## 🚀 Chrome'a Kurulum Adımları

1. Google Chrome tarayıcınızı açın.
2. Adres çubuğuna `chrome://extensions` yazıp Enter'a basın.
3. Sağ üst köşedeki **"Geliştirici modu"** (Developer mode) anahtarını açın.
4. Sol üstte beliren **"Paketlenmemiş öğe yükle"** (Load unpacked) butonuna tıklayın.
5. Açılan pencerede proje klasörünü seçin:
   ```
   c:\laragon\www\vid2gif
   ```
6. Eklenti listenize **"vid2gif - Ekran GIF Kaydedici"** adıyla eklenecektir.

---

## 🎯 Kesme & Düzenleme Nasıl Yapılır?

1. Eklentiden **"Kayıt Stüdyosunu Aç"** butonuna basın ve ekranınızı kaydedin.
2. Kaydı bitirdiğinizde **Kayıt Düzenleyici** ekranı açılacaktır.
3. Zaman çizelgesinde farenizi kaydırarak inceleyin:
   - Baştaki kısmı atmak için: İstediğiniz kareye gelip **"Bu Kareyi Başlangıç Yap"** butonuna tıklayın.
   - Sondaki kısmı atmak için: İstediğiniz kareye gelip **"Bu Kareyi Bitiş Yap"** butonuna tıklayın.
   - Ortadan bir parçayı kesmek için:
     - Çıkarmak istediğiniz yerin başına gelip **"📍 Başlangıç"** butonuna basın.
     - Çıkarmak istediğiniz yerin sonuna gelip **"📍 Bitiş"** butonuna basın.
     - **"✂️ Aralığı Kes & Çıkar"** butonuna basın.
4. Düzenleme tamamlandığında **"Kırpılmış Haliyle GIF Oluştur"** butonuna basarak optimize edilmiş GIF'inizi indirin.
