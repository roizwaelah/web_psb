<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../helpers/auth_cookie.php';

use \Firebase\JWT\JWT;

class AuthSiswaController
{
    private $conn;
    private $secret_key;

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
        $this->secret_key = getJwtSecret();
    }

    public function login()
    {
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->nisn) || empty($data->tanggal_lahir)) {
            http_response_code(400);
            echo json_encode(["message" => "NISN dan Tanggal Lahir harus diisi."]);
            exit();
        }

        try {
            // Tangkap parameter lembaga dari frontend (contoh: 'mts', 'ma', atau 'ponpes')
            $kode_lembaga = $data->kode_lembaga ?? 'ponpes';

            // JOIN dengan lembaga untuk memastikan santri login ke pintu yang tepat
            $query = "SELECT s.id, s.nomor_pendaftaran, s.nama_lengkap, s.nisn, s.status_penerimaan, s.lembaga_id, l.kode_lembaga, l.nama_lembaga 
                      FROM santri s
                      JOIN lembaga l ON s.lembaga_id = l.id
                      WHERE s.nisn = :nisn AND s.tanggal_lahir = :tanggal_lahir AND l.kode_lembaga = :kode_lembaga 
                      LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->execute([
                ':nisn' => $data->nisn,
                ':tanggal_lahir' => $data->tanggal_lahir,
                ':kode_lembaga' => $kode_lembaga
            ]);

            if ($stmt->rowCount() > 0) {
                // Fetch sebagai array asosiatif
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
                $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
                $issuer = $scheme . "://" . $host;

                $payload = array(
                    "iss" => $issuer,
                    "iat" => time(),
                    "exp" => time() + (60 * 60 * 24),
                    "data" => array(
                        "id" => $user['id'],
                        "role" => "siswa",
                        "nomor_pendaftaran" => $user['nomor_pendaftaran'],
                        "nama_lengkap" => $user['nama_lengkap'],
                        "nisn" => $user['nisn'],
                        "lembaga_id" => $user['lembaga_id']
                    )
                );

                $jwt = JWT::encode($payload, $this->secret_key, 'HS256');
                setAuthCookie($jwt, 60 * 60 * 24);

                http_response_code(200);
                echo json_encode([
                    "message" => "Login berhasil.",
                    "user" => [
                        "id" => $user['id'],
                        "nama_lengkap" => $user['nama_lengkap'],
                        "nomor_pendaftaran" => $user['nomor_pendaftaran'],
                        "status_penerimaan" => $user['status_penerimaan'],
                        "kode_lembaga" => $user['kode_lembaga'],
                        "lembaga_kode" => $user['kode_lembaga'],
                        "lembaga_nama" => $user['nama_lembaga']
                    ]
                ]);
            } else {
                http_response_code(401);
                echo json_encode(["message" => "Login gagal! NISN/Tanggal Lahir salah, atau Anda tidak terdaftar di lembaga ini."]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Terjadi kesalahan server."]);
        }
        exit();
    }

    public function getProfile($userData)
    {
        // Ambil ID dengan aman (mendukung berbagai format token)
        $id = $userData->id ?? ($userData->data->id ?? null);

        if (!$id) {
            http_response_code(400);
            echo json_encode(["message" => "ID tidak valid."]);
            exit();
        }

        try {
            // 1. Ambil Data Santri beserta nama lembaganya
            $querySantri = "SELECT s.*, l.nama_lembaga, l.kode_lembaga 
                            FROM santri s 
                            JOIN lembaga l ON s.lembaga_id = l.id 
                            WHERE s.id = :id LIMIT 1";
            $stmtSantri = $this->conn->prepare($querySantri);
            $stmtSantri->execute([':id' => $id]);

            if ($stmtSantri->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(["message" => "Data siswa tidak ditemukan."]);
                exit();
            }

            $santri = $stmtSantri->fetch(PDO::FETCH_ASSOC);

            // 2. Ambil Data Orang Tua
            $stmtOrtu = $this->conn->prepare("SELECT * FROM orang_tua WHERE santri_id = :id");
            $stmtOrtu->execute([':id' => $id]);

            $orang_tua = ['ayah' => null, 'ibu' => null, 'wali' => null];
            while ($row = $stmtOrtu->fetch(PDO::FETCH_ASSOC)) {
                $tipe = strtolower($row['tipe']);
                $orang_tua[$tipe] = $row;
            }

            $response_data = array_merge($santri, ['orang_tua' => $orang_tua]);

            http_response_code(200);
            echo json_encode([
                "message" => "Data profil ditarik.",
                "data" => $response_data
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Terjadi kesalahan server."]);
        }
        exit();
    }

    public function updateProfile($userData)
    {
        $id = $userData->id ?? ($userData->data->id ?? null);
        $data = json_decode(file_get_contents("php://input"));

        try {
            $this->conn->beginTransaction();

            $querySantri = "UPDATE santri SET 
                nama_lengkap = :nama_lengkap, tempat_lahir = :tempat_lahir, 
                jenis_kelamin = :jenis_kelamin, nik = :nik, agama = :agama, 
                pendidikan_terakhir = :pendidikan_terakhir, asal_sekolah = :asal_sekolah, 
                alamat_lengkap = :alamat_lengkap
                WHERE id = :id";

            $stmtS = $this->conn->prepare($querySantri);
            $stmtS->execute([
                ':nama_lengkap' => $data->nama_lengkap,
                ':tempat_lahir' => $data->tempat_lahir,
                ':jenis_kelamin' => $data->jenis_kelamin,
                ':nik' => $data->nik,
                ':agama' => $data->agama,
                ':pendidikan_terakhir' => $data->pendidikan_terakhir,
                ':asal_sekolah' => $data->asal_sekolah,
                ':alamat_lengkap' => $data->alamat_lengkap,
                ':id' => $id
            ]);

            $stmtDelete = $this->conn->prepare("DELETE FROM orang_tua WHERE santri_id = :id");
            $stmtDelete->execute([':id' => $id]);

            $queryOrtu = "INSERT INTO orang_tua (
                santri_id, tipe, status_hidup, nama, nik, tempat_lahir, tanggal_lahir, 
                pendidikan, pekerjaan, domisili, wa, penghasilan, status_rumah, alamat
            ) VALUES (
                :santri_id, :tipe, :status_hidup, :nama, :nik, :tempat_lahir, :tanggal_lahir, 
                :pendidikan, :pekerjaan, :domisili, :wa, :penghasilan, :status_rumah, :alamat
            )";
            $stmtO = $this->conn->prepare($queryOrtu);

            $insertOrtu = function ($tipe, $ortuData) use ($stmtO, $id) {
                if (!$ortuData) return;
                $stmtO->execute([
                    ':santri_id' => $id,
                    ':tipe' => $tipe,
                    ':status_hidup' => $ortuData->status_hidup ?? null,
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

            $ortu = $data->orang_tua ?? null;
            if ($ortu && isset($ortu->ayah)) $insertOrtu('Ayah', $ortu->ayah);
            if ($ortu && isset($ortu->ibu)) $insertOrtu('Ibu', $ortu->ibu);
            if ($ortu && isset($ortu->wali)) $insertOrtu('Wali', $ortu->wali);

            $this->conn->commit();

            http_response_code(200);
            echo json_encode(["message" => "Biodata berhasil diperbarui."]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            http_response_code(500);
        }
        exit();
    }
}
