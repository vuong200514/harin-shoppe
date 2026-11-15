# Harin Studios V4 — tự upload ảnh trong mục 02, dropdown size không bị che

## Điểm mới

- Không còn mục nhập Cloudinary trên web. Cloud name mặc định **p8nrkuot**, Unsigned preset mặc định **harin_unsigned** (đã do chủ shop cung cấp). Biến môi trường Render `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_UPLOAD_PRESET` vẫn có thể ghi đè khi cần.
- Chọn hoặc kéo thả ảnh ở mục **02** sẽ tự tải trực tiếp lên Cloudinary, lấy `secure_url` từ phản hồi và lưu URL vào sản phẩm để xuất XLSX. Không phải sao chép đường dẫn; nếu lỗi, nút **Tải lại ảnh lỗi** ở ngay mục 02.
- Mục Cloudinary cũ đã bỏ. Dropdown size S/M/L mở rộng ngay dưới nút trong luồng tài liệu thay vì overlay bị card cắt hay thiếu chỗ cuộn.
- Giữ nguyên ngành hàng 1.813 ID, hai mẫu Shopee, vận chuyển, tồn kho, bảng size và các tính năng khác từ V3.

## Cập nhật Render

Giải nén ZIP, chép toàn bộ **nội dung** thư mục `harin_render_docker_v4` vào `D:\Code\harin_render_docker`, ghi đè file cũ (không xóa `.git`).

```powershell
cd "D:\Code\harin_render_docker"
git add .
git commit -m "Harin V4 automatic image uploads and size dropdown fix"
git push origin main
```

Nếu bật Auto-Deploy, Render sẽ triển khai commit mới. Nếu không, vào Manual Deploy → Deploy latest commit. Ctrl+Shift+R để làm mới trang.

## Render Environment

- `ACCESS_USER` = `harin`
- `ACCESS_PASSWORD` = mật khẩu mạnh tự đặt (**nên bắt buộc khi ứng dụng public**)
- `CLOUDINARY_CLOUD_NAME` = `p8nrkuot` *(tùy chọn vì đã mặc định)*
- `CLOUDINARY_UPLOAD_PRESET` = `harin_unsigned` *(tùy chọn vì đã mặc định)*

**Không đặt Cloudinary API Secret trên web hay commit GitHub.** Preset Unsigned cho phép upload công khai nếu người khác biết Cloud name/preset; giới hạn loại/dung lượng ảnh trên Cloudinary và bảo vệ Render bằng mật khẩu mạnh. Mọi ảnh sản phẩm được upload là ảnh công khai. Không có đồng bộ sản phẩm qua các máy; dữ liệu được lưu ở trình duyệt đang dùng.

**Kiểm tra upload thực:** Cần thử bằng 1 ảnh với tài khoản Cloudinary của bạn khi lên Render. Bản thử tự động ở đây có mô phỏng phản hồi Cloudinary; nó không thay thế cho kiểm thử trực tiếp qua tài khoản của chủ shop. File Shopee vẫn cần thử đăng thực tế để kiểm tra danh mục và thuộc tính.

---

# Harin Studios V3 - Tìm ngành hàng tức thì, có dấu/không dấu

**Nguồn:** Đã trích xuất 1.813 mã ngành hàng lá thuộc 27 nhóm từ sheet `Phạm vi ngày chuẩn bị hàng` của file `Shopee_mass_upload_2026-11-15_basic_template.xlsx` (2026-11-15) do chủ shop cung cấp. 76 ngành Thời Trang Nữ dùng được mẫu nâng cao `100017` đã được đối chiếu với file `Shopee_mass_upload_2026-11-15_100017.xlsx`. Đây là danh sách đóng gói theo thời điểm tải mẫu, không phải API cập nhật realtime.

**Tìm kiếm ngành hàng:** Trong mục 01, bấm vào ô Ngành hàng Shopee và gõ `nam`, `ao thun nam`, `dien thoai`, `mẹ bé`... Gợi ý xuất hiện ngay bên dưới, tìm **không phân biệt dấu tiếng Việt / chữ hoa thường** kể cả `đ` → `d`, tìm xuyên qua toàn bộ đường dẫn cấp 1–3+ và có ID chính xác. Sử dụng ↑/↓/Enter hoặc nhấp chuột để chọn; phải chọn một gợi ý, gõ tay mà chưa chọn không được xem là đã chọn.

**Mẫu Excel:** Khi chọn ngành **ngoài Thời Trang Nữ**, web tự chuyển sang `Mẫu cơ bản`, vì mẫu nâng cao `100017` chỉ dùng cho Thời Trang Nữ. Khi chọn nữ và muốn có No Brand ở cột AL, chọn mẫu nâng cao. Mẫu cơ bản **không có cột thương hiệu**, nên không thể khẳng định No Brand được điền sẵn cho các ngành khác: phải kiểm tra khi tải lên Shopee. Không tự thêm thuộc tính ngành hàng khác vào template nữ.

**Quan trọng:** Tên và ID được trích từ file Shopee chủ shop tải về, nhưng vẫn cần thử đăng một sản phẩm để xác nhận các ID/thuộc tính và cấu trúc file còn được Shopee hiện tại chấp nhận.

## Nâng cấp trên Render đang dùng

1. Giải nén bản V3; sao chép **nội dung** thư mục `harin_render_docker_v3` vào `D:\Code\harin_render_docker`, ghi đè file cũ và **không xóa `.git`**.
2. Chạy PowerShell:

```powershell
cd "D:\Code\harin_render_docker"
git add .
git commit -m "Harin V3 category live search 1813 Shopee IDs"
git push origin main
```

3. Render Auto Deploy hoặc chọn Manual Deploy > Deploy latest commit. Sau đó Ctrl+Shift+R.

---

# Harin Studios - Shopee Bulk Upload (Docker + Render)

Trang web quan ly danh sach san pham, chon anh tu may tinh, **tu dong upload anh len Cloudinary va lay HTTPS URL**, sau do xuat file XLSX theo mau Shopee (cung cap boi chu shop).

## 1. Cau hinh Cloudinary

1. Dang ky/dang nhap: https://cloudinary.com/ (Cloudinary Console).
2. Lay **Cloud name** (khong phai account email hay API secret) o Dashboard / Product Environment.
3. Mo **Settings > Upload > Upload Presets > Add upload preset**.
4. Dien ten preset vi du `harin_unsigned`, chon **Signing mode: Unsigned**.
5. Nên dat **Asset folder** = `harin-shopee` va han che **Allowed formats** thanh `jpg,jpeg,png,webp` (trong UI co the hien ten tuy chon khac). Dat Deliver type / Access mode la public (mac dinh) neu muon Shopee xem duoc anh.
6. Bam **Save**. Ban can 2 thong tin: Cloud name va ten **Unsigned** upload preset.
7. **Khong dua API Secret vao browser, file config, GitHub**. Ung dung dung unsigned upload tu browser qua Cloudinary Upload API.

Tai lieu Cloudinary: https://cloudinary.com/documentation/upload_presets

**Bao mat:** Ten unsigned preset co the bi lo ra tu client-side/network. Nen khoa web bang mat khau `ACCESS_PASSWORD`, gioi han preset, theo doi muc su dung Cloudinary va doi preset neu bi lo. Mat khau web *khong* thay the signed uploads trong he thong cong khai/lon.

## 2. Day len GitHub (Windows PowerShell)

Giai nen ZIP, mo PowerShell tai thu muc chua `Dockerfile`, `render.yaml`, `index.html`.

```powershell
cd "C:\duong-dan\den\harin_render_docker"
git init
git add .
git commit -m "Deploy Harin Shopee Docker web"
git branch -M main
git remote add origin https://github.com/USERNAME/harin-shopee-web.git
git push -u origin main
```

**Truoc do:** Tao mot repo **Private** (khong chon Initialize with README) tren https://github.com/new, thay `USERNAME` bang ten GitHub cua ban. Neu repo da co remote origin, dung `git remote set-url origin https://github.com/USERNAME/harin-shopee-web.git` thay cho `git remote add origin`.

## 3. Deploy Render bang Docker

1. Vao https://dashboard.render.com/ , ket noi GitHub neu chua ket noi.
2. Chon **New > Web Service**, chon repo `harin-shopee-web`.
3. **Language/Runtime: Docker**. Dockerfile path: `./Dockerfile` (hoac de mac dinh). Region: Singapore (neu co). Plan: **Free** (thu nghiem).
4. Trong **Environment**, tao cac bien:

   | Key | Gia tri vi du | Ghi chu |
   | --- | --- | --- |
   | `CLOUDINARY_CLOUD_NAME` | `dxxxxxx` | Cloud name Cloudinary cua ban |
   | `CLOUDINARY_UPLOAD_PRESET` | `harin_unsigned` | Upload preset Unsigned |
   | `ACCESS_USER` | `harin` | Ten dang nhap web |
   | `ACCESS_PASSWORD` | `(mat khau tu dat)` | Nen dat mat khau manh, khong commit vao repo |

5. Bam **Deploy Web Service**. Cho deploy xong, mo URL dạng `https://harin-studios-shopee.onrender.com` (dia chi thuc te xem trong Render, co the khac).
6. Browser co the yeu cau username/password; nhap thong tin ACCESS_USER va ACCESS_PASSWORD.
7. Kiem tra khung Cloudinary hien `Da cau hinh`. Tu day **chon anh tu may -> web tu upload -> URL duoc dien khi xuat XLSX**. Neu loi upload, xem thong bao o anh va bam "Thu tai anh con thieu".

**Thay the:** Repo co san `render.yaml` de tao Render Blueprint. Vao **New > Blueprint**, chon repo, nhap 3 gia tri `ACCESS_PASSWORD`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET` khi duoc hoi (Runtime Docker, Free, Singapore da khai bao). Hay dung **mot trong hai** cach, khong tao ca 2 service.

Tai lieu: https://render.com/docs/docker | https://render.com/docs/blueprint-spec

## 4. Dung web

1. Dien ten san pham sau tien to harin.studios, gia, nganh hang, size.
2. Chon anh (toi da 9 anh/san pham). Anh se tu duoc toi uu neu qua 2MB/format WebP; mac dinh tu dong tai ngay sau khi chon.
3. Khi tat ca anh hien **URL**, bam **Xuat Excel**. File Shopee su dung URL HTTPS cua Cloudinary.
4. Neu can sao luu anh va file XLSX, bam **Xuat ZIP**. ZIP co the chua anh chua tai; file XLSX luc do chua san sang de dang neu anh chua co URL.
5. No Brand, mo ta mau, kho 50/size, 0.5kg, 15x20x5cm, van chuyen, khong dat truoc duoc giu theo cau hinh da thong nhat.

**Du lieu:** San pham va URL anh luu tai `localStorage` tren tung browser (khong dong bo may khac). Anh da upload luu tren Cloudinary. Render khong luu anh/Excel, khong co database. Neu xoa du lieu trinh duyet, ban can nhap lai thong tin san pham; Cloudinary van con anh da upload.

**Quan trong:** File XLSX duoc sinh tu hai mau Shopee da tai len. Shopee co the tu choi neu nganh hang/thuoc tinh/ID bang size/mã brand khong hop le. Hay thu voi 1 san pham truoc va xem bao cao loi nhap file. Ma No Brand `0` duoc giu tu web cu va chua duoc kiem chung tren shop.

## Cap nhat website da co tren Render

Neu ban da deploy GitHub repo `https://github.com/vuong200514/harin-shoppe` va co thu muc `D:\Code\harin_render_docker`:

1. Giai nen ban ZIP V2, sao chep toan bo file trong thu muc `harin_render_docker_v2` vao `D:\Code\harin_render_docker` (ghi de file cu; KHONG xoa thu muc `.git`).
2. Trong PowerShell chay:

```powershell
cd "D:\Code\harin_render_docker"
git add .
git commit -m "Update Harin stock shipping sizes and size chart"
git push origin main
```

3. Render se tu deploy khi co commit moi neu Auto-Deploy duoc bat. Neu khong, vao Render > Manual Deploy > Deploy latest commit.
4. Sau deploy, bam Ctrl+Shift+R de tai lai giao dien, tranh cache cu.
5. Thong tin san pham da luu tren trinh duyet cu (localStorage v1) se duoc nang cap sang v2, giu lai thong tin san pham va danh sach URL anh da luu. Anh may chua upload thuong khong duoc luu vao localStorage.

## 5. Docker local (tuy chon)

Neu co Docker Desktop:

```powershell
Copy-Item .env.example .env
notepad .env
# Sua ACCESS_PASSWORD, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET

docker compose up --build -d
```

Mo http://localhost:10000 . Dung `docker compose down` de tat. Neu khong co Docker Desktop nhung co Node 22+, co the chay `$env:PORT=10000; node server.mjs` va truy cap http://localhost:10000 .

`/health` la endpoint Render health check, khong can login.

## 6. Loi thuong gap

- `Upload preset must be whitelisted for unsigned uploads`: sai preset hoac preset van de **Signed**, chuyen thanh **Unsigned**.
- `Unknown upload preset`: sai ten preset hoac khong cung Cloud name / Product Environment.
- `400`/`413`: anh khong hop le, qua lon hoac bi gioi han tu preset/tai khoan Cloudinary.
- Loi mang/CORS: kiem tra ket noi Cloudinary va signed/unsigned. Upload REST dung `https://api.cloudinary.com/v1_1/CLOUD_NAME/image/upload`.
- Render mat 30-60 giay sau thoi gian khong truy cap: goi **Free** ngu sau 15 phut idle; van truy cap duoc nhung may chu can khoi dong lai. Muon luon chay san phai nang cap goi **Paid**.
- 401: sai ACCESS_USER/ACCESS_PASSWORD. Sua trong Render > Environment, save/redeploy, mo tab an danh de dang nhap lai.

## Thu muc

- `Dockerfile`, `server.mjs`, `render.yaml`: Docker va Render
- `index.html`, `app.js`: giao dien va xu ly upload
- `exporter.js`, `template-data.js`: tao Excel Shopee, giu workbook mau
- `category-data.js`, `chart-data.js`, `assets/`: danh muc va bang size
- `vendor/jszip.min.js`: thu vien tao Excel/ZIP offline
