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
