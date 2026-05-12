# Deploy Checklist (Step-by-Step)

## A. Persiapan Lokal
1. Pastikan build frontend lolos:
   - `npm run build`
2. Pastikan lint PHP file inti lolos:
   - `php -l api/index.php`
   - `php -l api/routes/api.php`
3. Pastikan file sensitif tidak akan dipublish:
   - jangan upload `node_modules/`
   - jangan upload file kerja lokal yang tidak dipakai

## B. Konfigurasi Environment
1. Backend: buat `api/.env` (jangan gunakan `.env.example` di produksi).
2. Isi nilai wajib:
   - `PSB_JWT_SECRET=<random panjang>`
   - `APP_ALLOWED_ORIGINS=https://domain-frontend-anda`
3. Frontend: set `.env` (jika perlu):
   - `VITE_API_BASE_URL=/api`

## C. Upload ke Hosting
1. Upload frontend build (`dist/`) ke `public_html` (atau web root).
2. Upload backend ke folder `api/` dalam web root.
3. Pastikan folder berikut ada di server backend:
   - `api/config`, `api/controllers`, `api/helpers`, `api/routes`, `api/vendor`, `api/uploads`
4. Pastikan `.htaccess` frontend dan `api/.htaccess` ikut terupload.

## D. Permission & Runtime
1. Pastikan folder `api/uploads/` writable oleh web server.
2. Pastikan ekstensi PHP aktif:
   - `pdo_mysql`, `curl`, `fileinfo`, `openssl`
3. Pastikan database kredensial di `api/config/db.php` sudah sesuai hosting.

## E. Validasi Setelah Deploy
1. Cek halaman frontend terbuka normal.
2. Cek endpoint API:
   - `GET /api/public/home?lembaga=ponpes`
3. Coba login admin dan siswa.
4. Coba upload dokumen siswa.
5. Cek logout (cookie auth harus terhapus).
6. Cek fitur admin yang dibatasi role/lembaga.

## F. Hardening Produksi
1. Pastikan site menggunakan HTTPS.
2. Pastikan header security aktif dari `.htaccess`.
3. Verifikasi CORS hanya untuk origin resmi.

## G. Operasional
1. Simpan backup database sebelum go-live.
2. Simpan backup file `api/uploads/` berkala.
3. Catat prosedur rollback (versi build + dump DB terakhir).

