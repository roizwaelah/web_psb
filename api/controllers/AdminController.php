<?php
require_once __DIR__ . '/../config/db.php';

class AdminController
{
    private $conn;
    private $lembaga_id; // Menyimpan ID lembaga admin yang sedang login

    // Modifikasi Constructor untuk menerima lembaga_id
    public function __construct($lembaga_id = null)
    {
        global $conn;
        $this->conn = $conn;
        $this->lembaga_id = $lembaga_id;
    }

    private function getBaseUrl()
    {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $basePath = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');

        return $scheme . '://' . $host . ($basePath !== '' ? $basePath : '');
    }

    private function reject($status, $message)
    {
        http_response_code($status);
        echo json_encode(["message" => $message]);
        exit();
    }

    private function ensureScopedWebContentTables()
    {
        $tables = ['web_alur', 'web_persyaratan', 'web_informasi'];

        foreach ($tables as $table) {
            $stmt = $this->conn->prepare("SHOW COLUMNS FROM `$table` LIKE 'lembaga_id'");
            $stmt->execute();

            if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
                $this->conn->exec("ALTER TABLE `$table` ADD `lembaga_id` int(11) NOT NULL DEFAULT 1 AFTER `id`");
                $this->conn->exec("ALTER TABLE `$table` ADD INDEX `idx_{$table}_lembaga_id` (`lembaga_id`)");
            }
        }
    }

    public function getDashboardStats()
    {
        try {
            // Filter data berdasarkan lembaga admin (Jika null, tampilkan semua)
            $where = $this->lembaga_id ? "WHERE lembaga_id = " . intval($this->lembaga_id) : "";
            $whereAnd = $this->lembaga_id ? "AND lembaga_id = " . intval($this->lembaga_id) : "";

            $stmtTotal = $this->conn->query("SELECT COUNT(*) FROM santri $where");
            $total = $stmtTotal->fetchColumn();

            $stmtDiterima = $this->conn->query("SELECT COUNT(*) FROM santri WHERE status_penerimaan = 'Diterima' $whereAnd");
            $diterima = $stmtDiterima->fetchColumn();

            $stmtMenunggu = $this->conn->query("SELECT COUNT(*) FROM santri WHERE status_penerimaan = 'Menunggu' $whereAnd");
            $menunggu = $stmtMenunggu->fetchColumn();

            $stmtProses = $this->conn->query("SELECT COUNT(*) FROM santri WHERE status_penerimaan = 'Proses Seleksi' $whereAnd");
            $proses = $stmtProses->fetchColumn();

            $stmtRecent = $this->conn->query("SELECT id, nomor_pendaftaran, nama_lengkap, asal_sekolah, status_penerimaan, created_at FROM santri $where ORDER BY created_at DESC LIMIT 5");
            $recent = $stmtRecent->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode([
                "message" => "Statistik ditarik",
                "data" => [
                    "total_pendaftar" => $total,
                    "total_diterima" => $diterima,
                    "total_menunggu" => $menunggu,
                    "total_proses" => $proses,
                    "recent_registrants" => $recent
                ]
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Terjadi kesalahan server: " . $e->getMessage()]);
        }
        exit();
    }

    public function getPendaftarList()
    {
        try {
            $where = $this->lembaga_id ? "WHERE lembaga_id = " . intval($this->lembaga_id) : "";
            $stmt = $this->conn->query("SELECT * FROM santri $where ORDER BY created_at DESC");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode(["message" => "Data pendaftar ditarik", "data" => $data]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Terjadi kesalahan server."]);
        }
        exit();
    }

    public function getDetailSantri($id)
    {
        try {
            // Pastikan admin hanya bisa melihat detail santri di lembaganya sendiri
            $whereAnd = $this->lembaga_id ? " AND lembaga_id = " . intval($this->lembaga_id) : "";
            $stmtSantri = $this->conn->prepare("SELECT * FROM santri WHERE id = ? $whereAnd");
            $stmtSantri->execute([$id]);
            $santri = $stmtSantri->fetch(PDO::FETCH_ASSOC);

            if (!$santri) {
                http_response_code(404);
                echo json_encode(["message" => "Akses ditolak atau Data tidak ditemukan."]);
                exit();
            }

            $stmtOrtu = $this->conn->prepare("SELECT * FROM orang_tua WHERE santri_id = ?");
            $stmtOrtu->execute([$id]);
            $orang_tua = ['ayah' => null, 'ibu' => null, 'wali' => null];
            while ($row = $stmtOrtu->fetch(PDO::FETCH_ASSOC)) {
                $orang_tua[strtolower($row['tipe'])] = $row;
            }

            $stmtDocs = $this->conn->prepare("SELECT jenis_dokumen, file_path, file_type FROM dokumen_santri WHERE santri_id = ?");
            $stmtDocs->execute([$id]);
            $dokumen = [];
            $baseUrl = $this->getBaseUrl() . "/uploads/";
            while ($doc = $stmtDocs->fetch(PDO::FETCH_ASSOC)) {
                $doc['file_url'] = $baseUrl . $doc['file_path'];
                $dokumen[$doc['jenis_dokumen']] = $doc;
            }

            $santri['orang_tua'] = $orang_tua;
            $santri['dokumen'] = $dokumen;

            http_response_code(200);
            echo json_encode(["message" => "Detail ditarik", "data" => $santri]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Terjadi kesalahan."]);
        }
        exit();
    }

    public function updateStatusSantri($id)
    {
        $data = json_decode(file_get_contents("php://input"));
        if (!isset($data->status)) { http_response_code(400); exit(); }

        if (!in_array($data->status, ['Menunggu', 'Proses Seleksi', 'Diterima', 'Ditolak'], true)) {
            $this->reject(400, 'Status penerimaan tidak valid.');
        }

        try {
            $whereAnd = $this->lembaga_id ? " AND lembaga_id = " . intval($this->lembaga_id) : "";
            $stmt = $this->conn->prepare("UPDATE santri SET status_penerimaan = ? WHERE id = ? $whereAnd");
            $stmt->execute([$data->status, $id]);

            if ($stmt->rowCount() > 0) {
                http_response_code(200); echo json_encode(["message" => "Status berhasil diperbarui."]);
            } else {
                http_response_code(403); echo json_encode(["message" => "Ditolak. Santri tidak valid."]);
            }
        } catch (PDOException $e) {
            http_response_code(500); echo json_encode(["message" => "Gagal memperbarui status."]);
        }
        exit();
    }

    public function updateSettings()
    {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!$data) {
            http_response_code(400);
            echo json_encode(["message" => "Format data tidak valid."]);
            exit();
        }

        // AMBIL DARI FRONTEND (JIKA SUPERADMIN MEMILIH DARI DROPDOWN), JIKA ADMIN BIASA, GUNAKAN MILIKNYA
        $lem_id = $this->lembaga_id ?: ($data['lembaga_id'] ?? 1); 

        try {
            $this->ensureScopedWebContentTables();
            $this->conn->beginTransaction();

            // 1. Update Tabel web_settings (Menggunakan Sihir UPSERT)
            if (isset($data['settings'])) {
                // JIKA SETTING BELUM ADA UNTUK LEMBAGA INI -> INSERT (BUAT BARU)
                // JIKA SUDAH ADA -> UPDATE TULISANNYA
                $stmtSet = $this->conn->prepare("
                    INSERT INTO web_settings (setting_key, setting_value, lembaga_id) 
                    VALUES (?, ?, ?) 
                    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
                ");
                
                foreach ($data['settings'] as $key => $value) {
                    // Perhatikan urutannya: key, value, lembaga_id
                    $stmtSet->execute([$key, $value, $lem_id]);
                }
            }

            // 2. Update Tabel web_alur khusus lembaga yang diedit
            if (isset($data['alur'])) {
                $stmtDeleteAlur = $this->conn->prepare("DELETE FROM web_alur WHERE lembaga_id = ?");
                $stmtDeleteAlur->execute([$lem_id]);
                if (count($data['alur']) > 0) {
                    $stmtAlur = $this->conn->prepare("INSERT INTO web_alur (lembaga_id, title) VALUES (?, ?)");
                    foreach ($data['alur'] as $alur) {
                        $stmtAlur->execute([$lem_id, $alur['title']]);
                    }
                }
            }

            // 3. Update Tabel web_persyaratan khusus lembaga yang diedit
            if (isset($data['persyaratan'])) {
                $stmtDeleteSyarat = $this->conn->prepare("DELETE FROM web_persyaratan WHERE lembaga_id = ?");
                $stmtDeleteSyarat->execute([$lem_id]);
                if (count($data['persyaratan']) > 0) {
                    $stmtSyarat = $this->conn->prepare("INSERT INTO web_persyaratan (lembaga_id, type, content) VALUES (?, ?, ?)");
                    foreach ($data['persyaratan'] as $s) {
                        $stmtSyarat->execute([$lem_id, $s['type'], $s['content']]);
                    }
                }
            }

            // 4. Update Tabel web_informasi khusus lembaga yang diedit
            if (isset($data['informasi'])) {
                $stmtDeleteInfo = $this->conn->prepare("DELETE FROM web_informasi WHERE lembaga_id = ?");
                $stmtDeleteInfo->execute([$lem_id]);
                if (count($data['informasi']) > 0) {
                    $stmtInfo = $this->conn->prepare("INSERT INTO web_informasi (lembaga_id, icon, title, description) VALUES (?, ?, ?, ?)");
                    foreach ($data['informasi'] as $i) {
                        $stmtInfo->execute([$lem_id, $i['icon'], $i['title'], $i['description']]);
                    }
                }
            }

            $this->conn->commit();
            http_response_code(200);
            echo json_encode(["message" => "Pengaturan halaman web berhasil diperbarui."]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            http_response_code(500);
            echo json_encode(["message" => "Gagal menyimpan pengaturan: " . $e->getMessage()]);
        }
        exit();
    }

    // Fitur Unggah Gambar Publik (Logo, Hero, dll)
    public function uploadPublicImage()
    {
        if (!isset($_FILES['image'])) {
            http_response_code(400);
            echo json_encode(["message" => "Tidak ada file."]);
            exit();
        }

        $file = $_FILES['image'];
        if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(["message" => "Upload gambar gagal."]);
            exit();
        }

        if (($file['size'] ?? 0) > 2 * 1024 * 1024) {
            http_response_code(400);
            echo json_encode(["message" => "Ukuran gambar terlalu besar. Maksimal 2MB."]);
            exit();
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $detectedMime = $finfo ? finfo_file($finfo, $file['tmp_name']) : null;
        if ($finfo) {
            finfo_close($finfo);
        }

        $allowedMimeToExt = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];

        if (!$detectedMime || !isset($allowedMimeToExt[$detectedMime])) {
            http_response_code(400);
            echo json_encode(["message" => "Format gambar ditolak. Gunakan JPG, PNG, atau WEBP."]);
            exit();
        }

        // Folder khusus aset publik
        $uploadDir = __DIR__ . '/../uploads/images/';
        if (!is_dir($uploadDir))
            mkdir($uploadDir, 0755, true);

        $extension = $allowedMimeToExt[$detectedMime];
        $fileName = 'public_' . time() . '_' . rand(1000, 9999) . '.' . $extension;
        
        if (move_uploaded_file($file['tmp_name'], $uploadDir . $fileName)) {
            $baseUrl = $this->getBaseUrl() . "/uploads/images/";
            http_response_code(200);
            echo json_encode([
                "message" => "Gambar berhasil diunggah.",
                "url" => $baseUrl . $fileName
            ]);
        } else {
            http_response_code(500);
        }
        exit();
    }

    // Memperbarui Data Lengkap Santri (Oleh Admin)
    public function updateSantri($id)
    {
        $data = json_decode(file_get_contents("php://input"));

        try {
            // Validasi kepemilikan
            $whereAnd = $this->lembaga_id ? " AND lembaga_id = " . intval($this->lembaga_id) : "";
            $check = $this->conn->prepare("SELECT id FROM santri WHERE id = ? $whereAnd");
            $check->execute([$id]);
            if (!$check->fetchColumn()) { http_response_code(403); exit(); }

            $this->conn->beginTransaction();

            // 1. Update Data Utama Santri
            $querySantri = "UPDATE santri SET 
                nama_lengkap = :nama, nisn = :nisn, nik = :nik, tempat_lahir = :tempat, 
                tanggal_lahir = :tanggal, jenis_kelamin = :jk, agama = :agama, 
                asal_sekolah = :asal, pendidikan_terakhir = :pendidikan, alamat_lengkap = :alamat
                WHERE id = :id";

            $stmtS = $this->conn->prepare($querySantri);
            $stmtS->execute([
                ':nama' => $data->nama_lengkap, ':nisn' => $data->nisn, ':nik' => $data->nik, 
                ':tempat' => $data->tempat_lahir, ':tanggal' => $data->tanggal_lahir, 
                ':jk' => $data->jenis_kelamin, ':agama' => $data->agama, ':asal' => $data->asal_sekolah, 
                ':pendidikan' => $data->pendidikan_terakhir, ':alamat' => $data->alamat_lengkap, ':id' => $id
            ]);

            // 2. Update Orang Tua (Hapus lama, masukkan baru agar aman)
            $this->conn->prepare("DELETE FROM orang_tua WHERE santri_id = ?")->execute([$id]);

            $queryOrtu = "INSERT INTO orang_tua (santri_id, tipe, status_hidup, nama, nik, wa, pekerjaan, penghasilan, alamat) 
                          VALUES (:santri_id, :tipe, :status_hidup, :nama, :nik, :wa, :pekerjaan, :penghasilan, :alamat)";
            $stmtO = $this->conn->prepare($queryOrtu);

            $insertOrtu = function ($tipe, $ortuData) use ($stmtO, $id) {
                if (!$ortuData) return;
                $stmtO->execute([
                    ':santri_id' => $id, ':tipe' => $tipe, ':status_hidup' => $ortuData->status_hidup ?? null,
                    ':nama' => $ortuData->nama ?? null, ':nik' => $ortuData->nik ?? null, ':wa' => $ortuData->wa ?? null,
                    ':pekerjaan' => $ortuData->pekerjaan ?? null, ':penghasilan' => $ortuData->penghasilan ?? null, ':alamat' => $ortuData->alamat ?? null
                ]);
            };

            if (isset($data->orang_tua->ayah)) $insertOrtu('Ayah', $data->orang_tua->ayah);
            if (isset($data->orang_tua->ibu)) $insertOrtu('Ibu', $data->orang_tua->ibu);
            if (isset($data->orang_tua->wali)) $insertOrtu('Wali', $data->orang_tua->wali);

            $this->conn->commit();
            http_response_code(200);
            echo json_encode(["message" => "Data berhasil diperbarui."]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            http_response_code(500);
        }
        exit();
    }

    // Menghapus Santri Secara Permanen
    public function deleteSantri($id)
    {
        try {
            $whereAnd = $this->lembaga_id ? " AND lembaga_id = " . intval($this->lembaga_id) : "";
            
            // Verifikasi Admin berhak menghapus santri ini
            $stmtCheck = $this->conn->prepare("SELECT id FROM santri WHERE id = ? $whereAnd");
            $stmtCheck->execute([$id]);
            if(!$stmtCheck->fetchColumn()) {
                http_response_code(403); echo json_encode(["message" => "Akses Ditolak."]); exit();
            }

            $stmtDocs = $this->conn->prepare("SELECT file_path FROM dokumen_santri WHERE santri_id = ?");
            $stmtDocs->execute([$id]);
            while ($doc = $stmtDocs->fetch(PDO::FETCH_ASSOC)) {
                $filePath = __DIR__ . '/../uploads/' . $doc['file_path'];
                if (file_exists($filePath))
                    unlink($filePath); 
            }
            
            $folders = glob(__DIR__ . '/../uploads/' . $id . '_*');
            if (!empty($folders) && is_dir($folders[0]))
                @rmdir($folders[0]); 

            $this->conn->prepare("DELETE FROM santri WHERE id = ?")->execute([$id]);

            http_response_code(200); echo json_encode(["message" => "Data dihapus permanen."]);
        } catch (PDOException $e) {
            http_response_code(500);
        }
        exit();
    }

    public function getAdmins()
    {
        try {
            // Superadmin melihat semua. Admin lembaga hanya melihat panitia di lembaganya sendiri.
            $where = $this->lembaga_id ? "WHERE lembaga_id = " . intval($this->lembaga_id) : "";
            $stmt = $this->conn->query("SELECT id, username, nama_lengkap, role, lembaga_id, created_at FROM admins $where ORDER BY created_at DESC");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            http_response_code(200); echo json_encode(["message" => "Data admin ditarik", "data" => $data]);
        } catch (PDOException $e) {
            http_response_code(500);
        }
        exit();
    }

    public function createAdmin()
    {
        $data = json_decode(file_get_contents("php://input"));
        if (empty($data->username) || empty($data->password) || empty($data->nama_lengkap) || empty($data->role)) {
            $this->reject(400, 'Data pengguna belum lengkap.');
        }

        if (!in_array($data->role, ['admin', 'validator'], true)) {
            $this->reject(400, 'Role pengguna tidak valid.');
        }

        if ($this->lembaga_id !== null && $data->role === 'admin') {
            $this->reject(403, 'Admin lembaga hanya boleh membuat akun validator.');
        }

        try {
            // Hash password menggunakan BCRYPT bawaan PHP
            $hashedPassword = password_hash($data->password, PASSWORD_BCRYPT);
            
            // Jika Superadmin bikin akun, bisa pilih lembaga_id (atau dikosongkan). Jika Admin bikin akun, otomatis di lembaganya.
            $lem_id = $this->lembaga_id ?: ($data->lembaga_id ?? null);

            $stmt = $this->conn->prepare("INSERT INTO admins (username, password, nama_lengkap, role, lembaga_id) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$data->username, $hashedPassword, $data->nama_lengkap, $data->role, $lem_id]);
            http_response_code(201);
            echo json_encode(["message" => "Pengguna ditambahkan."]);
        } catch (PDOException $e) {
            http_response_code(500);
        }
        exit();
    }

    public function updateAdmin($id)
    {
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->username) || empty($data->nama_lengkap) || empty($data->role)) {
            $this->reject(400, 'Data pengguna belum lengkap.');
        }

        if (!in_array($data->role, ['admin', 'validator'], true)) {
            $this->reject(400, 'Role pengguna tidak valid.');
        }

        if ($this->lembaga_id !== null && $data->role === 'admin') {
            $this->reject(403, 'Admin lembaga hanya boleh mengelola akun validator.');
        }

        try {
            // Admin lembaga hanya boleh mengubah akun pada lembaganya sendiri.
            if ($this->lembaga_id !== null) {
                $scopeCheck = $this->conn->prepare("SELECT lembaga_id FROM admins WHERE id = ?");
                $scopeCheck->execute([$id]);
                $targetLembagaId = $scopeCheck->fetchColumn();
                if ($targetLembagaId === false || intval($targetLembagaId) !== intval($this->lembaga_id)) {
                    http_response_code(403);
                    echo json_encode(["message" => "Akses ditolak. Anda tidak berwenang mengubah akun ini."]);
                    exit();
                }
            }

            if (!empty($data->password)) {
                // Jika password diisi, update beserta password barunya
                $hashedPassword = password_hash($data->password, PASSWORD_BCRYPT);
                if ($this->lembaga_id === null) {
                    $stmt = $this->conn->prepare("UPDATE admins SET username = ?, password = ?, nama_lengkap = ?, role = ?, lembaga_id = ? WHERE id = ?");
                    $stmt->execute([$data->username, $hashedPassword, $data->nama_lengkap, $data->role, $data->lembaga_id ?? null, $id]);
                } else {
                    $stmt = $this->conn->prepare("UPDATE admins SET username = ?, password = ?, nama_lengkap = ?, role = ? WHERE id = ?");
                    $stmt->execute([$data->username, $hashedPassword, $data->nama_lengkap, $data->role, $id]);
                }
            } else {
                // Jika password kosong, jangan update kolom password
                if ($this->lembaga_id === null) {
                    $stmt = $this->conn->prepare("UPDATE admins SET username = ?, nama_lengkap = ?, role = ?, lembaga_id = ? WHERE id = ?");
                    $stmt->execute([$data->username, $data->nama_lengkap, $data->role, $data->lembaga_id ?? null, $id]);
                } else {
                    $stmt = $this->conn->prepare("UPDATE admins SET username = ?, nama_lengkap = ?, role = ? WHERE id = ?");
                    $stmt->execute([$data->username, $data->nama_lengkap, $data->role, $id]);
                }
            }

            http_response_code(200);
            echo json_encode(["message" => "Data pengguna berhasil diperbarui."]);
        } catch (PDOException $e) {
            http_response_code(500);
            if ($e->getCode() == 23000) {
                echo json_encode(["message" => "Username sudah digunakan oleh akun lain."]);
            } else {
                echo json_encode(["message" => "Gagal memperbarui data: " . $e->getMessage()]);
            }
        }
        exit();
    }

    public function deleteAdmin($id, $currentUserId)
    {
        // Cegah admin menghapus dirinya sendiri
        if ($id == $currentUserId) {
            http_response_code(400);
            echo json_encode(["message" => "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif."]);
            exit();
        }

        try {
            // Admin lembaga hanya boleh menghapus akun pada lembaganya sendiri.
            if ($this->lembaga_id !== null) {
                $scopeCheck = $this->conn->prepare("SELECT lembaga_id, role FROM admins WHERE id = ?");
                $scopeCheck->execute([$id]);
                $targetAdmin = $scopeCheck->fetch(PDO::FETCH_ASSOC);
                if (!$targetAdmin || intval($targetAdmin['lembaga_id']) !== intval($this->lembaga_id) || $targetAdmin['role'] !== 'validator') {
                    http_response_code(403);
                    echo json_encode(["message" => "Akses ditolak. Anda tidak berwenang menghapus akun ini."]);
                    exit();
                }
            }

            $stmt = $this->conn->prepare("DELETE FROM admins WHERE id = ?");
            $stmt->execute([$id]);
            http_response_code(200);
            echo json_encode(["message" => "Pengguna berhasil dihapus."]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Gagal menghapus pengguna: " . $e->getMessage()]);
        }
        exit();
    }
	
	// FUNGSI UPDATE STATUS PEMBAYARAN
    public function updateStatusPembayaran($id)
    {
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['status_pembayaran'])) {
            http_response_code(400);
            echo json_encode(["message" => "Status pembayaran wajib diisi."]);
            exit();
        }

        if (!in_array($data['status_pembayaran'], ['Belum Bayar', 'Menunggu Verifikasi', 'Lunas'], true)) {
            $this->reject(400, 'Status pembayaran tidak valid.');
        }

        try {
            // Tambahkan filter Kacamata Kuda agar admin hanya bisa mengubah santrinya sendiri
            $whereAnd = $this->lembaga_id ? " AND lembaga_id = " . intval($this->lembaga_id) : "";
            
            // Gunakan query update yang aman
            $stmt = $this->conn->prepare("UPDATE santri SET status_pembayaran = ? WHERE id = ? $whereAnd");
            $stmt->execute([$data['status_pembayaran'], $id]);

            if ($stmt->rowCount() > 0) {
                http_response_code(200);
                echo json_encode(["message" => "Status pembayaran berhasil diperbarui."]);
            } else {
                http_response_code(403); 
                echo json_encode(["message" => "Ditolak. Santri tidak valid atau bukan dari unit lembaga Anda."]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Gagal memperbarui status: " . $e->getMessage()]);
        }
        exit();
    }

    // ==========================================
    // PENGUMUMAN DASHBOARD SANTRI
    // ==========================================
    public function updatePengumuman()
    {
        $data = json_decode(file_get_contents("php://input"));
        // Terima payload legacy (pengumuman) dan payload baru (settings.pengumuman_santri).
        $pengumuman = null;
        if (isset($data->pengumuman)) {
            $pengumuman = $data->pengumuman;
        } elseif (isset($data->settings) && isset($data->settings->pengumuman_santri)) {
            $pengumuman = $data->settings->pengumuman_santri;
        }

        if ($pengumuman === null) {
            http_response_code(400);
            echo json_encode(["message" => "Payload pengumuman tidak valid."]);
            exit();
        }

        // Admin biasa selalu terkunci ke lembaganya; superadmin boleh pilih lembaga_id.
        $lem_id = $this->lembaga_id !== null
            ? intval($this->lembaga_id)
            : intval($data->lembaga_id ?? 1);

        try {
            $stmt = $this->conn->prepare("UPDATE web_settings SET setting_value = ? WHERE setting_key = 'pengumuman_santri' AND lembaga_id = ?");
            $stmt->execute([$pengumuman, $lem_id]);
            http_response_code(200); echo json_encode(["message" => "Pengumuman disiarkan."]);
        } catch (PDOException $e) {
            http_response_code(500);
        }
        exit();
    }

    // ==========================================
    // MANAJEMEN DOKUMEN FISIK BERKAS
    // ==========================================
    public function getAllDokumen() {
        try {
            // Filter lembaga (Superadmin melihat semua, Admin biasa melihat lembaganya saja)
            $where = $this->lembaga_id ? "WHERE s.lembaga_id = " . intval($this->lembaga_id) : "";
            
            // PERBAIKAN: Menggunakan d.uploaded_at (bukan d.created_at)
            $query = "SELECT d.id as doc_id, d.santri_id, d.jenis_dokumen, d.file_path, d.file_type, d.uploaded_at, 
                             s.nama_lengkap, s.nomor_pendaftaran 
                      FROM dokumen_santri d 
                      JOIN santri s ON d.santri_id = s.id 
                      $where
                      ORDER BY d.uploaded_at DESC";
            
            $stmt = $this->conn->query($query);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $baseUrl = $this->getBaseUrl() . "/uploads/";
            foreach($data as &$row) { 
                $row['file_url'] = $baseUrl . $row['file_path']; 
            }

            http_response_code(200); 
            echo json_encode(["message" => "Data dokumen ditarik", "data" => $data]);
            
        } catch (PDOException $e) {
            http_response_code(500);
            // Tambahkan getMessage() agar jika ada error lagi, kita tahu persis penyebabnya
            echo json_encode(["message" => "Gagal menarik data dokumen: " . $e->getMessage()]);
        }
        exit();
    }

    public function deleteDokumen($doc_id) {
        try {
            // 1. Cari dokumen dan validasi scope lembaga untuk admin non-superadmin
            $query = "SELECT d.file_path
                      FROM dokumen_santri d
                      JOIN santri s ON d.santri_id = s.id
                      WHERE d.id = ?";

            if ($this->lembaga_id !== null) {
                $query .= " AND s.lembaga_id = " . intval($this->lembaga_id);
            }

            $stmt = $this->conn->prepare($query);
            $stmt->execute([$doc_id]);
            $doc = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($doc) {
                $filePath = __DIR__ . '/../uploads/' . $doc['file_path'];
                
                // 2. Hapus file fisik dari server jika ada
                if (file_exists($filePath)) {
                    unlink($filePath); 
                }
                
                // 3. Hapus record dari database
                $stmtDel = $this->conn->prepare("DELETE FROM dokumen_santri WHERE id = ?");
                $stmtDel->execute([$doc_id]);

                http_response_code(200);
                echo json_encode(["message" => "Dokumen beserta file fisiknya berhasil dihapus."]);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Dokumen tidak ditemukan."]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Terjadi kesalahan saat menghapus dokumen: " . $e->getMessage()]);
        }
        exit();
    }
}
?>
