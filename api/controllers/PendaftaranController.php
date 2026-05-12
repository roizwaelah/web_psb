<?php
require_once __DIR__ . '/../config/db.php';

class PendaftaranController {
    private $conn;

    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }

    public function store() {
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->santri)) {
            http_response_code(400);
            echo json_encode(["message" => "Data pendaftaran tidak lengkap."]);
            exit();
        }

        try {
            // Memulai Transaksi Database (Jika ada yang gagal, semuanya dibatalkan)
            $this->conn->beginTransaction();

            $s = $data->santri;
            $date_prefix = date("Ymd");
            
            // 1. Tentukan Lembaga Utama dan Lembaga Tambahan (Untuk Skenario Duplikasi)
            $kode_utama = $s->kode_lembaga ?? 'ponpes';
            $pilihan_sekolah = $s->pilihan_sekolah_formal ?? ''; 

            $lembagas_to_process = [$kode_utama];
            
            // Logika Duplikasi: Jika daftar Ponpes DAN memilih sekolah formal, tambahkan ke antrean proses
            if ($kode_utama === 'ponpes' && !empty($pilihan_sekolah)) {
                $lembagas_to_process[] = $pilihan_sekolah;
            }

            $nomor_pendaftaran_utama = "";
            $santri_id = null; // Disiapkan untuk digunakan oleh closure Orang Tua

            // ========================================================
            // LOOPING PENDAFTARAN (Bisa 1 kali untuk Laju, atau 2 kali untuk Mukim)
            // ========================================================
            foreach ($lembagas_to_process as $index => $kode_lembaga) {
                
                // A. Cari ID Lembaga di Database
                $stmtLembaga = $this->conn->prepare("SELECT id FROM lembaga WHERE kode_lembaga = ?");
                $stmtLembaga->execute([$kode_lembaga]);
                $lembaga_id = $stmtLembaga->fetchColumn() ?: 1;

                // B. Generate Nomor Pendaftaran Berdasarkan Kode Lembaga (Contoh: PONPES-20260225-001)
                $prefix_nomor = strtoupper($kode_lembaga) . "-" . $date_prefix;
                $stmt_count = $this->conn->prepare("SELECT COUNT(*) FROM santri WHERE nomor_pendaftaran LIKE ?");
                $stmt_count->execute([$prefix_nomor . "-%"]);
                $count = $stmt_count->fetchColumn() + 1;
                $nomor_pendaftaran = $prefix_nomor . "-" . str_pad($count, 3, "0", STR_PAD_LEFT);

                // Simpan nomor pendaftaran yang pertama kali diproses untuk diberikan ke frontend
                if ($index === 0) {
                    $nomor_pendaftaran_utama = $nomor_pendaftaran;
                }

                // C. Siapkan Password (Jika frontend kirim password pakai itu, jika tidak pakai NISN sebagai default)
                $raw_password = $s->password ?? $s->nisn;
                $hashed_password = password_hash($raw_password, PASSWORD_BCRYPT);

                // D. Insert ke Tabel Santri (Ditambah lembaga_id dan password)
                $querySantri = "INSERT INTO santri (
                    lembaga_id, nomor_pendaftaran, nama_lengkap, nisn, tempat_lahir, tanggal_lahir, 
                    jenis_kelamin, nik, agama, pendidikan_terakhir, asal_sekolah, alamat_lengkap, password
                ) VALUES (
                    :lembaga_id, :nomor_pendaftaran, :nama_lengkap, :nisn, :tempat_lahir, :tanggal_lahir, 
                    :jenis_kelamin, :nik, :agama, :pendidikan_terakhir, :asal_sekolah, :alamat_lengkap, :password
                )";

                $stmtS = $this->conn->prepare($querySantri);
                $stmtS->execute([
                    ':lembaga_id' => $lembaga_id,
                    ':nomor_pendaftaran' => $nomor_pendaftaran,
                    ':nama_lengkap' => $s->nama_lengkap,
                    ':nisn' => $s->nisn,
                    ':tempat_lahir' => $s->tempat_lahir,
                    ':tanggal_lahir' => $s->tanggal_lahir,
                    ':jenis_kelamin' => $s->jenis_kelamin,
                    ':nik' => $s->nik,
                    ':agama' => $s->agama,
                    ':pendidikan_terakhir' => $s->pendidikan_terakhir,
                    ':asal_sekolah' => $s->asal_sekolah,
                    ':alamat_lengkap' => $s->alamat_lengkap,
                    ':password' => $hashed_password
                ]);

                // Dapatkan ID Santri yang baru saja disimpan
                $santri_id = $this->conn->lastInsertId();

                // E. Siapkan Query untuk Insert Orang Tua
                $queryOrtu = "INSERT INTO orang_tua (
                    santri_id, tipe, status_hidup, nama, nik, tempat_lahir, tanggal_lahir, 
                    pendidikan, pekerjaan, domisili, wa, penghasilan, status_rumah, alamat
                ) VALUES (
                    :santri_id, :tipe, :status_hidup, :nama, :nik, :tempat_lahir, :tanggal_lahir, 
                    :pendidikan, :pekerjaan, :domisili, :wa, :penghasilan, :status_rumah, :alamat
                )";
                $stmtO = $this->conn->prepare($queryOrtu);

                // Fungsi Helper untuk Insert per Tipe (Ayah/Ibu/Wali)
                // Catatan: Menggunakan &$santri_id agar variabel ID selalu dinamis setiap kali di-loop
                $insertOrtu = function($tipe, $ortuData) use ($stmtO, &$santri_id) {
                    if (!$ortuData) return;
                    $stmtO->execute([
                        ':santri_id' => $santri_id,
                        ':tipe' => $tipe,
                        ':status_hidup' => $ortuData->status ?? null,
                        ':nama' => $ortuData->nama ?? null,
                        ':nik' => $ortuData->nik ?? null,
                        ':tempat_lahir' => $ortuData->tempat_lahir ?? null,
                        ':tanggal_lahir' => !empty($ortuData->tanggal_lahir) ? $ortuData->tanggal_lahir : null,
                        ':pendidikan' => $ortuData->pendidikan ?? null,
                        ':pekerjaan' => $ortuData->pekerjaan ?? null,
                        ':domisili' => $ortuData->domisili ?? null,
                        ':wa' => $ortuData->wa ?? null,
                        ':penghasilan' => $ortuData->penghasilan ?? null,
                        ':status_rumah' => $ortuData->status_rumah ?? null,
                        ':alamat' => $ortuData->alamat ?? null
                    ]);
                };

                // Insert Ayah, Ibu, dan Wali untuk Santri ini
                if (isset($data->ayah)) $insertOrtu('Ayah', $data->ayah);
                if (isset($data->ibu)) $insertOrtu('Ibu', $data->ibu);
                if (isset($data->wali)) $insertOrtu('Wali', $data->wali);
            }

            // Simpan permanen jika semua operasi looping di atas sukses!
            $this->conn->commit();

            http_response_code(201);
            echo json_encode([
                "message" => "Pendaftaran berhasil disimpan.",
                "nomor_pendaftaran" => $nomor_pendaftaran_utama,
                "info_login" => "Gunakan NISN sebagai Username dan Password default Anda."
            ]);

        } catch (PDOException $e) {
            // Batalkan semua operasi jika terjadi error sekecil apa pun
            $this->conn->rollBack();
            http_response_code(500);
            
            // Tangkap pesan Error 23000 (Jika santri mencoba daftar dua kali di lembaga yang sama)
            if ($e->getCode() == 23000) {
                echo json_encode(["message" => "Gagal: NISN ini sudah pernah didaftarkan ke lembaga terkait."]);
            } else {
                echo json_encode(["message" => "Terjadi kesalahan server saat menyimpan data."]);
            }
        }
        exit();
    }
}
?>