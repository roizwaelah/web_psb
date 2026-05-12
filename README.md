# WEB PSB

Frontend React (Vite) + backend PHP berada dalam satu proyek:
- Frontend: root proyek (`src`, `public`)
- Backend API: folder `api/`

## Menjalankan Lokal
1. Install dependency frontend:
   - `npm install`
2. Jalankan frontend:
   - `npm run dev`
3. Pastikan Apache/PHP aktif untuk melayani folder `api/`.
4. Buat `api/.env` dari `api/.env.example` lalu isi:
   - `PSB_JWT_SECRET`
   - `APP_ALLOWED_ORIGINS`
5. (Opsional) Buat `.env` frontend dari `.env.example`:
   - `VITE_API_BASE_URL=/api`

## Build Frontend
- `npm run build`

## Struktur Proyek (Ringkas)
```text
PSB/
|-- api/
|   |-- config/
|   |-- controllers/
|   |-- helpers/
|   |-- routes/
|   |-- uploads/
|   |-- vendor/
|   |-- .env.example
|   |-- .htaccess
|   |-- index.php
|   `-- README.md
|-- public/
|-- src/
|   |-- components/
|   |-- context/
|   |-- hooks/
|   |-- layouts/
|   |-- pages/
|   |-- router/
|   |-- services/
|   |-- App.jsx
|   `-- main.jsx
|-- .env.example
|-- .htaccess
|-- index.html
|-- package.json
`-- vite.config.js
```

## Catatan Keamanan
- Ringkasan status hardening tersedia di:
  - `SECURITY_STATUS.md`
