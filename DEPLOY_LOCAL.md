# 🌐 Hướng dẫn Public Local Server ra Ngoài

## Cách 1: Truy cập từ mạng Local (WiFi cùng mạng)

### Bước 1: Chạy server
```bash
npm run dev
```

Hoặc dùng script đặc biệt:
```bash
npm run dev:public
```

### Bước 2: Lấy IP của máy bạn

**Trên Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Trên Windows:**
```bash
ipconfig
```

Tìm dòng `IPv4 Address` hoặc `inet` (thường là `192.168.x.x` hoặc `10.x.x.x`)

### Bước 3: Truy cập từ thiết bị khác

Từ máy tính/điện thoại khác **cùng WiFi**, mở trình duyệt và truy cập:

```
http://192.168.1.96:3000
```

(Thay `192.168.1.96` bằng IP của bạn)

---

## Cách 2: Public ra Internet (Dùng Ngrok)

### Bước 1: Cài đặt Ngrok
```bash
# Mac
brew install ngrok

# Hoặc download từ: https://ngrok.com/download
```

### Bước 2: Chạy server local
```bash
npm run dev
```

### Bước 3: Chạy Ngrok (terminal khác)
```bash
ngrok http 3000
```

### Bước 4: Lấy URL public
Ngrok sẽ cho bạn URL dạng:
```
https://abc123.ngrok.io
```

**Bất kỳ ai trên internet** đều có thể truy cập URL này!

---

## Cách 3: Dùng Cloudflare Tunnel (Miễn phí, không giới hạn)

### Bước 1: Cài đặt Cloudflare Tunnel
```bash
# Mac
brew install cloudflare/cloudflare/cloudflared

# Hoặc download từ: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation
```

### Bước 2: Chạy tunnel
```bash
cloudflared tunnel --url http://localhost:3000
```

Sẽ cho URL dạng: `https://random-name.trycloudflare.com`

---

## Cách 4: Dùng LocalTunnel (Đơn giản nhất)

### Bước 1: Cài đặt
```bash
npm install -g localtunnel
```

### Bước 2: Chạy server
```bash
npm run dev
```

### Bước 3: Chạy tunnel (terminal khác)
```bash
lt --port 3000
```

Sẽ cho URL dạng: `https://random-name.loca.lt`

---

## ⚠️ Lưu ý

1. **Mạng Local (Cách 1):**
   - Chỉ hoạt động trong cùng WiFi
   - Cần tắt firewall nếu không truy cập được
   - IP có thể thay đổi khi reconnect WiFi

2. **Public Internet (Cách 2-4):**
   - URL sẽ thay đổi mỗi lần chạy (trừ khi dùng account trả phí)
   - Server chỉ chạy khi máy bạn bật
   - Tốc độ phụ thuộc vào internet của bạn

3. **Bảo mật:**
   - Không share URL public nếu có dữ liệu nhạy cảm
   - API key vẫn an toàn (chỉ ở server side)

---

## 🔥 Khuyến nghị

- **Test nhanh:** Dùng LocalTunnel (Cách 4)
- **Demo cho bạn bè:** Dùng Ngrok (Cách 2)
- **Production:** Deploy lên Vercel/Netlify (xem README.md)

