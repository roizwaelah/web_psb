<?php
require_once __DIR__ . '/../config/db.php';

class PendaftaranController
{
    private $conn;

    public function __construct()
    {
        global $conn;
        $this->conn = $conn;
    }

    private function badRequest($message)
    {
        http_response_code(400);
        echo json_encode(["message" => $message]);
        exit();
    }

    private function requireText($object, $field, $label, $maxLength, &$errors)
    {
        $value = trim((string) ($object->{$field} ?? ''));
        if ($value === '') {
            $errors[] = "$label wajib diisi.";
            return '';
        }
        if (strlen($value) > $maxLength) {
            $errors[] = "$label maksimal $maxLength karakter.";
        }
        return $value;
    }

    private function isDate($value)
    {
        $date = DateTime::createFromFormat('Y-m-d', (string) $value);
        return $date && $date->format('Y-m-d') === $value;
    }

    private function validateRegistration($data)
    {
        if (!isset($data->santri) || !is_object($data->santri)) {
            $this->badRequest('Data santri tidak lengkap.');
        }

        $errors = [];
        $s = $data->santri;

        $this->requireText($s, 'nama_lengkap', 'Nama lengkap', 100, $errors);
        $this->requireText($s, 'nisn', 'NISN', 20, $errors);
        $this->requireText($s, 'tempat_lahir', 'Tempat lahir', 50, $errors);
        $this->requireText($s, 'nik', 'NIK', 16, $errors);
        $this->requireText($s, 'agama', 'Agama', 20, $errors);
        $this->requireText($s, 'pendidikan_terakhir', 'Pendidikan terakhir', 30, $errors);
        $this->requireText($s, 'asal_sekolah', 'Asal sekolah', 100, $errors);
        $this->requireText($s, 'alamat_lengkap', 'Alamat lengkap', 2000, $errors);

        if (!preg_match('/^\d{5,20}$/', (string) ($s->nisn ?? ''))) {
            $errors[] = 'NISN harus berupa angka.';
        }
        if (!preg_match('/^\d{16}$/', (string) ($s->nik ?? ''))) {
            $errors[] = 'NIK harus 16 digit angka.';
        }
        if (!in_array(($s->jenis_kelamin ?? ''), ['Laki-laki', 'Perempuan'], true)) {
            $errors[] = 'Jenis kelamin tidak valid.';
        }
        if (empty($s->tanggal_lahir) || !$this->isDate($s->tanggal_lahir)) {
            $errors[] = 'Tanggal lahir tidak valid.';
        }
        if (!empty($s->kode_lembaga) && !preg_match('/^[a-z0-9_-]{2,30}$/i', $s->kode_lembaga)) {
            $errors[] = 'Kode lembaga tidak valid.';
        }
        if (!empty($s->pilihan_sekolah_formal) && !preg_match('/^[a-z0-9_-]{2,30}$/i', $s->pilihan_sekolah_formal)) {
            $errors[] = 'Pilihan sekolah formal tidak valid.';
        }

        foreach (['ayah', 'ibu', 'wali'] as $tipe) {
            if (!isset($data->{$tipe}) || !is_object($data->{$tipe})) {
                continue;
            }

            $ortu = $data->{$tipe};
            if (!empty($ortu->nik) && !preg_match('/^\d{16}$/', $ortu->nik)) {
                $errors[] = "NIK $tipe harus 16 digit angka.";
            }
            if (!empty($ortu->wa) && !preg_match('/^\+?\d{9,20}$/', $ortu->wa)) {
                $errors[] = "Nomor WA $tipe tidak valid.";
            }
            if (!empty($ortu->tanggal_lahir) && !$this->isDate($ortu->tanggal_lahir)) {
                $errors[] = "Tanggal lahir $tipe tidak valid.";
            }
        }

        if ($errors) {
            $this->badRequest($errors[0]);
        }
    }

    private function generateNomorPendaftaran($kodeLembaga)
    {
        $datePrefix = date('Ymd');
        $prefix = strtoupper($kodeLembaga) . '-' . $datePrefix;

        $stmt = $this->conn->prepare("SELECT nomor_pendaftaran FROM santri WHERE nomor_pendaftaran LIKE ? ORDER BY nomor_pendaftaran DESC LIMIT 1 FOR UPDATE");
        $stmt->execute([$prefix . '-%']);
        $lastNumber = $stmt->fetchColumn();

        $next = 1;
        if ($lastNumber && preg_match('/-(\d+)$/', $lastNumber, $matches)) {
            $next = intval($matches[1]) + 1;
        }

        return $prefix . '-' . str_pad($next, 3, '0', STR_PAD_LEFT);
    }

    private function insertOrangTua($stmt, $santriId, $tipe, $ortuData)
    {
        if (!$ortuData) {
            return;
        }

        $stmt->execute([
            ':santri_id' => $santriId,
            ':tipe' => $tipe,
            ':status_hidup' => $ortuData->status_hidup ?? ($ortuData->status ?? null),
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
    }

    public function store()
    {
        $data = json_decode(file_get_contents('php://input'));
        if (!$data) {
            $this->badRequest('Format JSON tidak valid.');
        }

        $this->validateRegistration($data);

        try {
            $this->conn->beginTransaction();

            $s = $data->santri;
            $kodeUtama = $s->kode_lembaga ?? 'ponpes';
            $pilihanSekolah = $s->pilihan_sekolah_formal ?? '';
            $lembagasToProcess = [$kodeUtama];

            if ($kodeUtama === 'ponpes' && $pilihanSekolah !== '') {
                $lembagasToProcess[] = $pilihanSekolah;
            }
            $lembagasToProcess = array_values(array_unique($lembagasToProcess));

            $nomorPendaftaranUtama = '';
            $rawPassword = $s->password ?? $s->nisn;
            $hashedPassword = password_hash($rawPassword, PASSWORD_BCRYPT);

            $querySantri = "INSERT INTO santri (
                lembaga_id, nomor_pendaftaran, nama_lengkap, nisn, tempat_lahir, tanggal_lahir,
                jenis_kelamin, nik, agama, pendidikan_terakhir, asal_sekolah, alamat_lengkap, password
            ) VALUES (
                :lembaga_id, :nomor_pendaftaran, :nama_lengkap, :nisn, :tempat_lahir, :tanggal_lahir,
                :jenis_kelamin, :nik, :agama, :pendidikan_terakhir, :asal_sekolah, :alamat_lengkap, :password
            )";
            $stmtSantri = $this->conn->prepare($querySantri);

            $queryOrtu = "INSERT INTO orang_tua (
                santri_id, tipe, status_hidup, nama, nik, tempat_lahir, tanggal_lahir,
                pendidikan, pekerjaan, domisili, wa, penghasilan, status_rumah, alamat
            ) VALUES (
                :santri_id, :tipe, :status_hidup, :nama, :nik, :tempat_lahir, :tanggal_lahir,
                :pendidikan, :pekerjaan, :domisili, :wa, :penghasilan, :status_rumah, :alamat
            )";
            $stmtOrtu = $this->conn->prepare($queryOrtu);

            foreach ($lembagasToProcess as $index => $kodeLembaga) {
                $stmtLembaga = $this->conn->prepare('SELECT id FROM lembaga WHERE kode_lembaga = ?');
                $stmtLembaga->execute([$kodeLembaga]);
                $lembagaId = $stmtLembaga->fetchColumn();

                if (!$lembagaId) {
                    $this->conn->rollBack();
                    $this->badRequest('Kode lembaga tidak ditemukan.');
                }

                $nomorPendaftaran = $this->generateNomorPendaftaran($kodeLembaga);

                $stmtSantri->execute([
                    ':lembaga_id' => $lembagaId,
                    ':nomor_pendaftaran' => $nomorPendaftaran,
                    ':nama_lengkap' => trim($s->nama_lengkap),
                    ':nisn' => trim($s->nisn),
                    ':tempat_lahir' => trim($s->tempat_lahir),
                    ':tanggal_lahir' => $s->tanggal_lahir,
                    ':jenis_kelamin' => $s->jenis_kelamin,
                    ':nik' => trim($s->nik),
                    ':agama' => trim($s->agama),
                    ':pendidikan_terakhir' => trim($s->pendidikan_terakhir),
                    ':asal_sekolah' => trim($s->asal_sekolah),
                    ':alamat_lengkap' => trim($s->alamat_lengkap),
                    ':password' => $hashedPassword
                ]);

                $santriId = $this->conn->lastInsertId();
                if ($index === 0) {
                    $nomorPendaftaranUtama = $nomorPendaftaran;
                }

                if (isset($data->ayah)) {
                    $this->insertOrangTua($stmtOrtu, $santriId, 'Ayah', $data->ayah);
                }
                if (isset($data->ibu)) {
                    $this->insertOrangTua($stmtOrtu, $santriId, 'Ibu', $data->ibu);
                }
                if (isset($data->wali)) {
                    $this->insertOrangTua($stmtOrtu, $santriId, 'Wali', $data->wali);
                }
            }

            $this->conn->commit();

            http_response_code(201);
            echo json_encode([
                'message' => 'Pendaftaran berhasil disimpan.',
                'nomor_pendaftaran' => $nomorPendaftaranUtama,
                'info_login' => 'Gunakan NISN dan tanggal lahir untuk masuk ke panel calon santri.'
            ]);
        } catch (PDOException $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }

            http_response_code($e->getCode() == 23000 ? 409 : 500);
            if ($e->getCode() == 23000) {
                echo json_encode(['message' => 'Data sudah pernah didaftarkan atau nomor pendaftaran bentrok. Silakan coba lagi.']);
            } else {
                echo json_encode(['message' => 'Terjadi kesalahan server saat menyimpan data.']);
            }
        }
        exit();
    }
}
