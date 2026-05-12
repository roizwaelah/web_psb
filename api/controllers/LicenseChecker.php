<?php

class LicenseChecker {
    private $serverUrl = "https://lisensi.dascloud.my.id/verify.php";
    private $licenseKey;
    private $domain;
    private $cacheFile;
    
    // Waktu kedaluwarsa cache dalam detik (86400 detik = 24 jam)
    // Aplikasi hanya akan mengecek ke server utama 1 kali sehari
    private $cacheExpiry = 86400; 

    public function __construct($licenseKey) {
        $this->licenseKey = $licenseKey;
        $this->domain = $this->getCurrentDomain();
        
        // Membuat nama file cache yang unik berdasarkan domain
        // Disimpan di folder temporary server agar tidak mengotori folder aplikasi
        $this->cacheFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'lic_cache_' . md5($this->domain) . '.txt';
    }

    /**
     * Mengambil nama domain tempat aplikasi klien saat ini berjalan
     */
    private function getCurrentDomain() {
        $domain = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : (isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : '');
        $domain = preg_replace('/^www\./', '', $domain);
        $domain = explode(':', $domain)[0];
        return strtolower(trim($domain));
    }

    /**
     * Mengecek apakah cache masih berlaku
     */
    private function isCacheValid() {
        if (file_exists($this->cacheFile)) {
            $fileTime = filemtime($this->cacheFile);
            // Jika waktu sekarang dikurangi waktu file dibuat masih kurang dari expiry
            if ((time() - $fileTime) < $this->cacheExpiry) {
                return true;
            }
        }
        return false;
    }

    /**
     * Memperbarui file cache saat lisensi terbukti valid
     */
    private function updateCache() {
        // Tulis sembarang teks ke dalam file, yang penting timestamp file diperbarui
        file_put_contents($this->cacheFile, 'verified_' . time());
    }

    /**
     * Proses verifikasi utama
     */
    public function verify() {
        // 1. CEK CACHE LOKAL TERLEBIH DAHULU
        if ($this->isCacheValid()) {
            return true; // Langsung lolos, aplikasi berjalan secepat kilat
        }

        // 2. JIKA CACHE EXPIRED / TIDAK ADA, LAKUKAN CURL KE SERVER
        $postData = [
            'domain' => $this->domain,
            'license_key' => $this->licenseKey
        ];

        $ch = curl_init($this->serverUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
        curl_setopt($ch, CURLOPT_TIMEOUT, 5); // Timeout 5 detik
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        // 3. ANALISIS RESPON SERVER
        if ($httpCode == 200 && $response) {
            $result = json_decode($response, true);
            
            if (isset($result['status']) && $result['status'] === 'success') {
                // Lisensi valid dari server! Perbarui cache lokal.
                $this->updateCache();
                return true; 
            } else {
                // Lisensi ditangguhkan atau salah. Hapus cache jika ada.
                if (file_exists($this->cacheFile)) {
                    unlink($this->cacheFile); 
                }
                $this->lockApplication($result['message'] ?? 'Lisensi tidak valid.');
                return false;
            }
        }

        // 4. TOLERANSI OFFLINE
        // Jika cURL gagal (misal server lisensi Anda sedang maintenance),
        // kita izinkan aplikasi berjalan sementara agar operasional klien tidak terganggu.
        // Cache tidak diperbarui, jadi ia akan mencoba cURL lagi di request berikutnya.
        return true; 
    }

    /**
     * Mengunci aplikasi jika lisensi ilegal
     */
    private function lockApplication($reason) {
        header('HTTP/1.1 403 Forbidden');
        header('Content-Type: application/json'); // Tambahkan header JSON
        
        // Keluarkan output dalam format JSON yang bisa dibaca frontend
        echo json_encode([
            'error' => true,
            'kode_error' => 'LISENSI_TIDAK_VALID',
            'pesan' => $reason,
            'domain' => $this->domain
        ]);
        exit(); // Gunakan exit() alih-alih die(HTML)
    }
}
?>