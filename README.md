# HARIN STUDIOS V8 - sua loi Excel Shopee

- Chi Thoi Trang Nu, mau nang cao Shopee 100017, No Brand.
- Khac phuc loi Shopee `channelToggleStr[Mở]`: tat ca cot AD:AJ chi xuat `Bật` / `Tắt`.
- Tu chuyen cai dat cu `Mở` duoc luu trong trinh duyet thanh `Bật`.
- Canh bao Hang Cong Kenh AF (500g / 15x20x5) va ten san pham co ve khong khop nganh hang.
- Hien canh bao tai muc 05, hoi xac nhan truoc khi xuat. Khong tu y thay doi danh muc hay tat kenh van chuyen cua shop.
- Giu nguyen tu dong upload nhieu anh Cloudinary, bang size, ton kho.
- Chi thu tren file tuong duong; chua the xac minh Shopee chap nhan den khi upload thu.

# Harin Studios V6 — Thời Trang Nữ, chỉ mẫu nâng cao 100017

Phiên bản này **chỉ cho đăng các danh mục con của Thời Trang Nữ** và **chỉ xuất mẫu Excel nâng cao 100017** do người dùng tải từ Shopee. Đã loại bỏ bản cơ bản và các danh mục không thuộc phạm vi mẫu.

- 76 mã danh mục lá Thời Trang Nữ trích từ mẫu Shopee nâng cao 100017 đã gửi. Gõ không dấu / có dấu đều tìm được, dropdown hiển thị kết quả ngay.
- Không còn lựa chọn Basic hoặc Advanced. Sản phẩm cũ có mã ngoài Thời Trang Nữ được giữ nguyên tên/giá/ảnh nhưng **xóa lựa chọn ngành** và bắt buộc chọn lại; không bao giờ xuất sang ngành khác.
- No Brand cố định, cột AL ghi `0` theo cấu hình trong mẫu hiện có. Cần thử nhập Shopee để xác nhận mã No Brand được chấp nhận.
- Giữ nguyên Cloudinary tự tải ảnh khi chọn ở mục 02, URL bảng size mặc định, S/M/L đa chọn, tồn kho mặc định 50 có thể chỉnh, vận chuyển bật/tắt và mô tả cố định.
- Chỉ sản phẩm có đủ tên, giá, danh mục thuộc Thời Trang Nữ và URL ảnh hợp lệ mới xuất được XLSX. XLSX được tạo bằng cách giữ nguyên các sheet tham khảo của Shopee.

## Cập nhật Render

Giải nén, chép **nội dung bên trong** thư mục `harin_render_docker_v6` đè vào `D:\Code\harin_render_docker` (giữ nguyên `.git`).

```powershell
cd "D:\Code\harin_render_docker"
git add .
git commit -m "Harin V6 women fashion advanced only"
git push origin main
```

Render Auto Deploy sẽ triển khai lại. Bấm `Ctrl + Shift + R` để bỏ cache giao diện.

**Lưu ý:** Trước khi đăng nhiều sản phẩm, hãy nhập thử 1 file lên Shopee. Phần thuộc tính bắt buộc tùy ngành và mã No Brand cần Shopee xác nhận thực tế; bài kiểm tra Excel cục bộ không thay thế được.


## V7 — Chọn một lần nhiều ảnh cho cùng một sản phẩm

- Mục 02 có nút **Chọn nhiều ảnh từ máy**. Trong cửa sổ chọn file, giữ Ctrl/Shift hoặc Ctrl+A để chọn hàng loạt; cũng có thể kéo nhiều ảnh từ Explorer vào.
- Hỗ trợ tối đa 9 ảnh cho mỗi sản phẩm: ảnh số 1 là ảnh bìa (cột Q), ảnh số 2–9 là ảnh phụ (cột R–Y).
- Hiện đủ các ảnh thu nhỏ, số lượng đã chọn, URL thành công/lỗi, và nút đổi ảnh bất kỳ thành ảnh bìa.
- Tải tối đa ba ảnh lên Cloudinary đồng thời, tự giữ nguyên thứ tự ảnh để ghi chính xác vào Excel.
- Nếu chọn quá số chỗ còn trống, web chỉ thêm đủ số chỗ và cảnh báo.
- Tự dừng xuất XLSX hoàn chỉnh nếu có ảnh chưa có URL (trừ chức năng lưu nháp ZIP).
