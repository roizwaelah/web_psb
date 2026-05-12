<?php
require_once __DIR__ . '/env.php';

$host = psb_env('DB_HOST');
$db_name = psb_env('DB_NAME');
$username = psb_env('DB_USER');
$password = psb_env_exists('DB_PASS') ? (string) psb_env('DB_PASS', '') : null;
$charset = psb_env('DB_CHARSET', 'utf8mb4');

if (!$host || !$db_name || !$username || $password === null) {
    psb_config_error('Konfigurasi database belum lengkap. Set DB_HOST, DB_NAME, DB_USER, dan DB_PASS.');
}

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name . ";charset=" . $charset, $username, $password);
    
    // Mengatur PDO agar selalu melempar Exception jika terjadi error SQL
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Mengatur default kembalian data menjadi Objek (agar lebih mudah diolah dengan $row->kolom)
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_OBJ);

} catch(PDOException $exception) {
    // Tangkap error jika koneksi gagal dan kirim respon JSON ke React
    http_response_code(500);
    header('Content-Type: application/json; charset=UTF-8');
    
    // Jangan tampilkan $exception->getMessage() secara detail di production untuk keamanan
    echo json_encode([
        "status" => "error",
        "message" => "Gagal terhubung ke database. Pastikan server database menyala."
    ]);
    exit(); // Hentikan eksekusi script
}
?>
