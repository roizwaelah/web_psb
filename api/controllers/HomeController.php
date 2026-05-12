<?php
require_once __DIR__ . '/../config/db.php';

class HomeController {
    private $conn;

    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }

    private function ensureScopedWebContentTables() {
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

    public function getHomeData($kode_lembaga = 'ponpes') {
        try {
            $this->ensureScopedWebContentTables();

            // 1. Cari ID Lembaga
            $stmtLembaga = $this->conn->prepare("SELECT id, nama_lembaga, jenjang FROM lembaga WHERE kode_lembaga = ?");
            $stmtLembaga->execute([$kode_lembaga]);
            $lembaga = $stmtLembaga->fetch(PDO::FETCH_ASSOC);

            $lembaga_id = $lembaga ? $lembaga['id'] : 1;
            $nama_lembaga = $lembaga ? $lembaga['nama_lembaga'] : "Pondok Pesantren Darussalam";

            // 2. Tarik Pengaturan Teks (web_settings) KHUSUS untuk lembaga ini
            $stmtSet = $this->conn->prepare("SELECT setting_key, setting_value FROM web_settings WHERE lembaga_id = ?");
            $stmtSet->execute([$lembaga_id]);
            $settings = [];
            while ($row = $stmtSet->fetch(PDO::FETCH_ASSOC)) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }

            // 3. Tarik Alur, Persyaratan, Informasi
            $stmtAlur = $this->conn->prepare("SELECT id, title FROM web_alur WHERE lembaga_id = ? ORDER BY id ASC");
            $stmtAlur->execute([$lembaga_id]);
            $alur = $stmtAlur->fetchAll(PDO::FETCH_ASSOC);

            $stmtSyarat = $this->conn->prepare("SELECT id, type, content FROM web_persyaratan WHERE lembaga_id = ? ORDER BY id ASC");
            $stmtSyarat->execute([$lembaga_id]);
            $persyaratan = $stmtSyarat->fetchAll(PDO::FETCH_ASSOC);

            $stmtInfo = $this->conn->prepare("SELECT id, icon, title, description FROM web_informasi WHERE lembaga_id = ? ORDER BY id ASC");
            $stmtInfo->execute([$lembaga_id]);
            $informasi = $stmtInfo->fetchAll(PDO::FETCH_ASSOC);

            // 4. Susun JSON Lengkap (Termasuk Navbar, Kontak, dan Footer)
            $homeData = [
                "lembaga" => [
                    "kode" => $kode_lembaga,
                    "nama" => $nama_lembaga,
                    "jenjang" => $lembaga['jenjang'] ?? 'Pesantren'
                ],
                "navbar" => [
                    "text" => $settings['navbar_text'] ?? 'PSB ' . $nama_lembaga,
                    "logo" => $settings['navbar_logo'] ?? '/logo.png'
                ],
                "hero_title" => $settings['hero_title'] ?? 'Penerimaan Santri Baru',
                "hero_subtitle" => $settings['hero_subtitle'] ?? 'Mari bergabung bersama kami mencetak generasi Rabbani.',
                "hero_background" => $settings['hero_background'] ?? '',
                "section_titles" => [
                    "alur" => $settings['title_alur'] ?? 'Alur Pendaftaran',
                    "persyaratan" => $settings['title_persyaratan'] ?? 'Syarat & Ketentuan'
                ],
                "kontak" => [
                    "alamat" => $settings['contact_address'] ?? 'Cilongok, Banyumas',
                    "telepon" => $settings['contact_phone'] ?? '0812-3456-7890',
                    "whatsapp" => $settings['contact_wa'] ?? ($settings['contact_phone'] ?? '0812-3456-7890'),
                    "email" => $settings['contact_email'] ?? 'info@darussalam.sch.id'
                ],
                "footer" => [
                    "about" => $settings['footer_about'] ?? 'Sistem Penerimaan Santri Baru berbasis digital yang modern, transparan dan profesional.',
                    "copyright" => $settings['footer_copyright'] ?? '© 2026 Yayasan Darussalam'
                ],
				"pembayaran" => [
                    "bank1" => $settings['payment_bank1'] ?? '',
                    "rek1"  => $settings['payment_rek1'] ?? '',
                    "an1"   => $settings['payment_an1'] ?? '',
                    "bank2" => $settings['payment_bank2'] ?? '',
                    "rek2"  => $settings['payment_rek2'] ?? '',
                    "an2"   => $settings['payment_an2'] ?? '',
                    "qris"  => $settings['payment_qris'] ?? ''
                ],
                "pengumuman_santri" => $settings['pengumuman_santri'] ?? '',
                "alur_artikel" => $settings['alur_artikel'] ?? '<h2>Panduan Pendaftaran</h2><p>Konten panduan sedang dipersiapkan oleh panitia.</p>',
                "steps" => $alur,
                "requirements" => $persyaratan,
                "informations" => $informasi
            ];

            http_response_code(200);
            echo json_encode(["message" => "Data beranda berhasil ditarik", "data" => $homeData]);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Terjadi kesalahan database: " . $e->getMessage()]);
        }
        exit();
    }
}
?>
