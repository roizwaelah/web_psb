# PSB Backend - Konfigurasi Environment

## 1) Opsi paling mudah: file `.env`
1. Salin `.env.example` menjadi `.env`.
2. Isi minimal:

```env
PSB_JWT_SECRET=ISI_DENGAN_SECRET_ACAK_PANJANG
APP_ALLOWED_ORIGINS=http://localhost:5173,https://psb.domainanda.id
```

Keterangan:
- `PSB_JWT_SECRET` wajib diisi.
- `APP_ALLOWED_ORIGINS` dipisah koma untuk lebih dari satu origin frontend.

## 2) Opsi Apache/XAMPP (`SetEnv`)
Tambahkan ke VirtualHost atau `.htaccess` (jika `AllowOverride Options FileInfo` mengizinkan):

```apache
SetEnv PSB_JWT_SECRET "ISI_DENGAN_SECRET_ACAK_PANJANG"
SetEnv APP_ALLOWED_ORIGINS "http://localhost:5173,https://psb.domainanda.id"
```

Lalu restart Apache.

## 3) Catatan upload ke hosting
Direkomendasikan upload:
- `.htaccess`
- `index.php`
- `config/`
- `controllers/`
- `helpers/`
- `routes/`
- `vendor/` (jika tidak menjalankan `composer install` di server)
- `uploads/.htaccess` (folder upload bisa dibuat saat runtime)

Tidak wajib upload:
- `.env.example`
- `README.md`
- `composer.lock` (opsional jika vendor sudah ikut diupload)
- file lokal/tooling lain yang tidak dipakai runtime.

