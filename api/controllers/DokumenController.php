<?php
require_once __DIR__ . '/../config/db.php';

class DokumenController {
    private $conn;

    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }

    private function getBaseUrl() {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $basePath = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
        return $scheme . '://' . $host . ($basePath !== '' ? $basePath : '');
    }

    // Mengambil daftar dokumen
    public function getDokumen($userData) {
        $santri_id = $userData->id ?? ($userData->data->id ?? null);
        
        if (!$santri_id) {
            http_response_code(400); echo json_encode(["message" => "ID tidak valid."]); exit();
        }

        try {
            $stmt = $this->conn->prepare("SELECT jenis_dokumen, file_path, file_type FROM dokumen_santri WHERE santri_id = :santri_id");
            $stmt->execute([':santri_id' => $santri_id]);
            $dokumen = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Sesuaikan "psb-backend" dengan nama folder root localhost Anda
            $baseUrl = $this->getBaseUrl() . "/uploads/";
            
            foreach($dokumen as &$doc) {
                $doc['file_url'] = $baseUrl . $doc['file_path']; 
            }

            http_response_code(200);
            echo json_encode(["message" => "Data dokumen ditarik", "data" => $dokumen]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Terjadi kesalahan database: " . $e->getMessage()]);
        }
        exit();
    }

    // Upload & Overwrite file (Mendukung Sinkronisasi Multi-Lembaga)
    public function uploadDokumen($userData) {
        $santri_id = $userData->id ?? ($userData->data->id ?? null);
        $nisn = $userData->nisn ?? ($userData->data->nisn ?? null);
        $nama_lengkap = $userData->nama_lengkap ?? ($userData->data->nama_lengkap ?? 'santri');

        if (!$santri_id || !$nisn) {
            http_response_code(400); echo json_encode(["message" => "Data user tidak lengkap."]); exit();
        }
        
        // BIKIN NAMA FOLDER DARI NAMA SANTRI
        $nama_bersih = preg_replace('/[^a-zA-Z0-9]/', '_', strtolower($nama_lengkap));
        // Format folder tetap menggunakan ID Santri Utama yang pertama kali login saat upload
        $folder_nama = $santri_id . '_' . $nama_bersih; 

        if (!isset($_POST['jenis_dokumen']) || !isset($_FILES['file'])) {
            http_response_code(400); echo json_encode(["message" => "Pilih file dan jenis dokumen terlebih dahulu."]); exit();
        }

        $jenis_dokumen = $_POST['jenis_dokumen'];
        $file = $_FILES['file'];

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $detectedMime = $finfo ? finfo_file($finfo, $file['tmp_name']) : null;
        if ($finfo) {
            finfo_close($finfo);
        }

        $allowedMimeToExt = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'application/pdf' => 'pdf',
        ];

        if (!$detectedMime || !isset($allowedMimeToExt[$detectedMime])) {
            http_response_code(400); echo json_encode(["message" => "Format ditolak. Gunakan JPG, PNG, atau PDF."]); exit();
        }

        if ($file['size'] > 2 * 1024 * 1024) { 
            http_response_code(400); echo json_encode(["message" => "Ukuran file terlalu besar. Maksimal 2MB."]); exit();
        }

        $baseUploadDir = __DIR__ . '/../uploads/';
        $studentDir = $baseUploadDir . $folder_nama . '/';

        if (!is_dir($studentDir)) {
            mkdir($studentDir, 0777, true);
        }

        $extension = $allowedMimeToExt[$detectedMime];
        $fileName = $jenis_dokumen . '_' . time() . '.' . $extension; 
        
        $dbFilePath = $folder_nama . '/' . $fileName; 
        $targetPath = $studentDir . $fileName;

        try {
            $this->conn->beginTransaction();

            // 1. CEK FILE LAMA UNTUK DITIMPA (Berdasarkan santri_id saat ini)
            $stmtCheck = $this->conn->prepare("SELECT file_path FROM dokumen_santri WHERE santri_id = :santri_id AND jenis_dokumen = :jenis_dokumen");
            $stmtCheck->execute([':santri_id' => $santri_id, ':jenis_dokumen' => $jenis_dokumen]);
            
            if ($stmtCheck->rowCount() > 0) {
                $oldFile = $stmtCheck->fetch(PDO::FETCH_ASSOC)['file_path'];
                if (file_exists($baseUploadDir . $oldFile)) {
                    unlink($baseUploadDir . $oldFile); 
                }
            }

            // 2. PINDAHKAN FILE FISIK BARU
            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                
                // 3. CARI SEMUA AKUN KLONINGAN (Satu Orang, Banyak Lembaga)
                // Kita sinkronkan file ini ke Ponpes, MTs, atau MA jika NISN-nya sama!
                $stmtIds = $this->conn->prepare("SELECT id FROM santri WHERE nisn = :nisn");
                $stmtIds->execute([':nisn' => $nisn]);
                $all_santri_ids = $stmtIds->fetchAll(PDO::FETCH_COLUMN);

                // 4. UPSERT KE SEMUA AKUN (1 File Fisik, Banyak Baris Database)
                $stmtUpsert = $this->conn->prepare("
                    INSERT INTO dokumen_santri (santri_id, jenis_dokumen, file_path, file_type)
                    VALUES (:santri_id, :jenis_dokumen, :file_path, :file_type)
                    ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), file_type = VALUES(file_type)
                ");

                foreach ($all_santri_ids as $s_id) {
                    $stmtUpsert->execute([
                        ':santri_id' => $s_id,
                        ':jenis_dokumen' => $jenis_dokumen,
                        ':file_path' => $dbFilePath,
                        ':file_type' => $detectedMime
                    ]);
                }

                $this->conn->commit();

                $baseUrl = $this->getBaseUrl() . "/uploads/";
                
                http_response_code(200);
                echo json_encode([
                    "message" => "Dokumen berhasil diunggah dan disinkronkan ke seluruh lembaga.",
                    "data" => [
                        "jenis_dokumen" => $jenis_dokumen,
                        "file_url" => $baseUrl . $dbFilePath,
                        "file_type" => $detectedMime
                    ]
                ]);
            } else {
                $this->conn->rollBack();
                http_response_code(500);
                echo json_encode(["message" => "Gagal memindahkan file ke server."]);
            }
        } catch (PDOException $e) {
            $this->conn->rollBack();
            http_response_code(500);
            echo json_encode(["message" => "Kesalahan server: " . $e->getMessage()]);
        }
        exit();
    }
}
?>
