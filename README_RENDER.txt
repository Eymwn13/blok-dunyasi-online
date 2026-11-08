# Blok Dünyası Online — Render bulut sunucusu

Bu klasör, oyunu Render üzerinde ücretsiz bir Node.js Web Service olarak yayınlamak için hazırlandı.

## Render'a yayınlama (bir kez yapılır)

1. GitHub hesabında yeni bir **Public** veya **Private** repository oluştur.
   Önerilen ad: `blok-dunyasi-online`.
2. Bu ZIP'in içindeki dosyaları repository'nin ana dizinine yükle:
   - `blok_dunyasi_3d.html`
   - `server.js`
   - `package.json`
   - `render.yaml`
   - `.gitignore`
3. Render hesabına gir: https://dashboard.render.com/
4. **New +** → **Blueprint** seç.
5. GitHub hesabını bağla ve `blok-dunyasi-online` repository'sini seç.
6. Render, `render.yaml` dosyasını okuyup servisi **Free** planında oluşturacak. Gerekirse onayla.
7. Deploy tamamlanınca Render'ın verdiği `https://...onrender.com` adresini aç.

## Oyuna arkadaşlarınla girme

- Oyunu açınca sunucu adresi otomatik olarak HTTPS/WSS adresine ayarlanır.
- Oda kodunu (ör. `AGALAR`) ve oyuncu adını gir.
- Herkes aynı web adresini açıp aynı oda kodunu kullanmalı.
- Bir oyuncu hareket ettikçe çevrimiçi sunucu etkin kalır.

## Ücretsiz planın önemli sınırları

- Render ücretsiz web servisleri 15 dakika boyunca HTTP isteği veya mevcut WebSocket bağlantısından mesaj almazsa uykuya geçer.
- Uyandıktan sonraki ilk açılış yaklaşık 1 dakika sürebilir.
- Ücretsiz servislerin dosya sistemi geçicidir. Uykuya geçme, yeniden başlatma veya yeniden dağıtım sırasında `worlds.json` kaydı kaybolabilir. Ücretsiz Render planında kalıcı disk yoktur.
- Bu nedenle bu sürümde çok oyunculu oturum ve dünya eşitlemesi vardır; ancak ücretsiz planda kalıcı dünya garantisi yoktur.
- Render ücretsiz kullanım ve kota koşullarını değiştirebilir. Güncel sınırlar: https://render.com/docs/free

## Kontrol

- Oyun: `https://SENIN-SERVISIN.onrender.com/`
- Sağlık kontrolü: `https://SENIN-SERVISIN.onrender.com/health`

Bu proje bağımsız bir HTML/Three.js oyunudur; resmi Minecraft veya Bedrock sunucusu değildir.
