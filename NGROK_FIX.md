# 🔧 Sửa lỗi Ngrok - Trang đen

## Vấn đề
Trang web hiển thị màn hình đen khi truy cập qua ngrok.

## Cách khắc phục

### Bước 1: Kiểm tra server local có chạy không

```bash
# Kiểm tra port 3000
lsof -i :3000

# Nếu không có, chạy server:
npm run dev
```

Bạn sẽ thấy:
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.96:3000/
```

### Bước 2: Kiểm tra ngrok có kết nối đúng port không

Trong terminal chạy ngrok, bạn sẽ thấy:
```
Forwarding  https://6756029fbb2f.ngrok-free.app -> http://localhost:3000
```

**Phải đảm bảo:**
- Ngrok forward đến `localhost:3000` (hoặc port bạn đang dùng)
- Server local đang chạy trên cùng port đó

### Bước 3: Khởi động lại ngrok

```bash
# Dừng ngrok (Ctrl+C)
# Chạy lại:
ngrok http 3000
```

### Bước 4: Bỏ qua warning page của ngrok

Khi truy cập URL ngrok lần đầu, bạn sẽ thấy warning page:
- Click nút **"Visit Site"** để tiếp tục
- Hoặc thêm header để bỏ qua warning (xem bên dưới)

### Bước 5: Thêm header để bỏ qua warning (Tùy chọn)

Thêm vào `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  },
  // ... rest of config
});
```

Hoặc chạy ngrok với flag:
```bash
ngrok http 3000 --request-header-add "ngrok-skip-browser-warning:true"
```

---

## Kiểm tra nhanh

1. ✅ Server local chạy: `http://localhost:3000` hoạt động
2. ✅ Ngrok đang forward: Terminal ngrok hiển thị "Forwarding..."
3. ✅ Truy cập URL ngrok: Click "Visit Site" nếu có warning

---

## Lỗi thường gặp

### "ERR_NGROK_3200" - Connection refused
→ Server local chưa chạy hoặc sai port

### Trang đen/trắng
→ Kiểm tra console browser (F12) xem có lỗi JavaScript không

### "This site can't be reached"
→ Ngrok tunnel đã đóng, chạy lại ngrok

---

## Test nhanh

```bash
# Terminal 1: Chạy server
npm run dev

# Terminal 2: Chạy ngrok
ngrok http 3000

# Terminal 3: Test local trước
curl http://localhost:3000
```

Nếu local hoạt động nhưng ngrok không → vấn đề ở ngrok tunnel.

