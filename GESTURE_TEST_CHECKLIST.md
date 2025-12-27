# ✅ Checklist Test Camera Gesture

## 📋 Các Tính năng Cần Test

### 1. Camera Preview Window
- [ ] Camera preview hiển thị ở góc dưới bên phải
- [ ] Preview có thể kéo thả (draggable)
- [ ] Video hiển thị đúng (không bị đen)
- [ ] Preview luôn hiển thị khi camera bật
- [ ] Có status indicator "Đang quay"

### 2. Gesture Detection - Single Hand
- [ ] 👋 **Wave (Vẫy tay)**: Mở gallery với ảnh random
- [ ] 👆 **Point (Chỉ tay)**: Đổi ảnh trong Heart Photo Frame
- [ ] ✊ **Fist (Nắm tay)**: Đóng popup/gallery
- [ ] 👌 **OK Sign**: Trigger fireworks
- [ ] 👍 **Thumbs Up**: Mở gift box
- [ ] ✌️ **Peace Sign**: Toggle music

### 3. Gesture Detection - Two Hands (Zoom)
- [ ] **Pinch In** (2 tay gần nhau): Ảnh carousel gần cây thông hơn
- [ ] **Pinch Out** (2 tay xa nhau): Ảnh carousel xa cây thông hơn
- [ ] Zoom mượt, không giật lag
- [ ] Zoom có giới hạn (2.5 - 7 radius)

### 4. Visual Feedback
- [ ] Emoji hiển thị khi detect gesture
- [ ] Tên gesture hiển thị (tiếng Việt)
- [ ] Progress bar confidence hiển thị
- [ ] Gesture phải giữ 1.5s mới trigger (debounce)

### 5. Performance
- [ ] Camera không lag
- [ ] Gesture detection responsive
- [ ] Không crash khi bật/tắt camera nhiều lần

## 🧪 Cách Test

1. **Bật Camera**:
   - Click nút camera ở góc dưới bên phải
   - Cho phép camera permission
   - Kiểm tra preview hiển thị

2. **Test Single Hand Gestures**:
   - Đưa 1 tay vào khung hình
   - Thử các gesture: wave, point, fist, ok, thumbs up, peace
   - Giữ gesture 1.5s để trigger
   - Kiểm tra action tương ứng

3. **Test Zoom Gesture**:
   - Đưa 2 tay vào khung hình
   - Đưa 2 tay gần nhau → Ảnh gần cây thông
   - Đưa 2 tay xa nhau → Ảnh xa cây thông
   - Kiểm tra zoom mượt

4. **Test Edge Cases**:
   - Tắt camera rồi bật lại
   - Test trên mobile (nếu có)
   - Test với ánh sáng yếu

## ⚠️ Lưu ý

- Gesture cần giữ 1.5s mới trigger (tránh trigger nhầm)
- Zoom gesture cần 2 tay trong khung hình
- Camera chỉ hoạt động trên desktop (enabled={isDesktop})
- TensorFlow.js có thể fail, sẽ fallback về motion detection

