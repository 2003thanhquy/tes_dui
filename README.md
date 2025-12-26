<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🎄 Noel Yêu Thương 3D

Ứng dụng Giáng sinh 3D tương tác với cây thông, hiệu ứng tuyết, và nhiều tính năng thú vị!

## 🚀 Deploy lên Internet

### Cách 1: Deploy lên Vercel (Khuyến nghị - Dễ nhất)

1. **Push code lên GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/noel-yeu-thuong-3d.git
   git push -u origin main
   ```

2. **Deploy trên Vercel:**
   - Truy cập: https://vercel.com
   - Đăng nhập bằng GitHub
   - Click "New Project"
   - Import repository của bạn
   - Thêm Environment Variable:
     - Name: `GEMINI_API_KEY`
     - Value: API key của bạn (lấy tại https://makersuite.google.com/app/apikey)
   - Click "Deploy"

3. **Xong!** Ứng dụng sẽ có URL dạng: `https://your-app.vercel.app`

---

### Cách 2: Deploy lên Netlify

1. **Push code lên GitHub** (giống bước 1 ở trên)

2. **Deploy trên Netlify:**
   - Truy cập: https://netlify.com
   - Đăng nhập bằng GitHub
   - Click "Add new site" → "Import an existing project"
   - Chọn repository
   - Thêm Environment Variable:
     - Key: `GEMINI_API_KEY`
     - Value: API key của bạn
   - Click "Deploy site"

3. **Xong!** Ứng dụng sẽ có URL dạng: `https://your-app.netlify.app`

---

### Cách 3: Deploy lên GitHub Pages

1. **Cài đặt gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Thêm script vào package.json:**
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

4. **Bật GitHub Pages:**
   - Vào Settings → Pages
   - Source: `gh-pages` branch
   - URL: `https://yourusername.github.io/noel-yeu-thuong-3d`

---

## 📦 Run Locally

**Prerequisites:** Node.js 18+

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Tạo file `.env.local`:**
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```
   (Lấy API key tại: https://makersuite.google.com/app/apikey)

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🔐 Lưu ý về API Key

- **KHÔNG** commit file `.env` hoặc `.env.local` lên GitHub
- Khi deploy, thêm `GEMINI_API_KEY` vào Environment Variables của platform
- API key chỉ cần cho tính năng "AI Wish Generator", các tính năng khác vẫn hoạt động bình thường

---

## ✨ Tính năng

- 🎄 Cây thông 3D tương tác
- ❄️ Tuyết rơi với hiệu ứng gió
- 🎁 Hệ thống quà tặng bất ngờ
- 💝 Lời yêu thương từ AI
- 📷 Gallery ảnh kỷ niệm
- 🎵 Music player
- 🎯 Mini game khám phá bí mật
- ✨ Nhiều hiệu ứng animation sống động

---

## 🛠️ Tech Stack

- React 19
- Three.js / React Three Fiber
- Vite
- Tailwind CSS
- Google Gemini AI

---

## 📝 License

MIT
