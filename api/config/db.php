<?php
$host = "localhost";
$db_name = "u688635524_daftar";
$username = "u688635524_daftar";
$password = "Achmad.12015.@";

try {
    // Membuat koneksi PDO beserta pengaturan charset utf8mb4 agar mendukung karakter khusus
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8mb4", $username, $password);
    
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