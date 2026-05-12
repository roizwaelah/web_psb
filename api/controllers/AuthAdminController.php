<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/../helpers/auth_cookie.php';

use \Firebase\JWT\JWT;

class AuthAdminController
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

        if (empty($data->username) || empty($data->password)) {
            http_response_code(400);
            echo json_encode(["message" => "Username dan password wajib diisi."]);
            exit();
        }

        try {
            // JOIN dengan tabel lembaga untuk mengetahui admin ini ditugaskan di mana
            $query = "SELECT a.id, a.username, a.password, a.nama_lengkap, a.role, a.lembaga_id, l.kode_lembaga, l.nama_lembaga 
                      FROM admins a 
                      LEFT JOIN lembaga l ON a.lembaga_id = l.id 
                      WHERE a.username = :username LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->execute([':username' => $data->username]);

            if ($stmt->rowCount() > 0) {
                $admin = $stmt->fetch(PDO::FETCH_ASSOC);

                if (password_verify($data->password, $admin['password'])) {
                    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
                    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
                    $issuer = $scheme . "://" . $host;

                    // Masukkan lembaga_id ke dalam Payload JWT
                    $payload = array(
                        "iss" => $issuer,
                        "iat" => time(),
                        "exp" => time() + (60 * 60 * 24),
                        "data" => array(
                            "id" => $admin['id'],
                            "role" => $admin['role'],
                            "nama_lengkap" => $admin['nama_lengkap'],
                            "username" => $admin['username'],
                            "lembaga_id" => $admin['lembaga_id'], // NULL = Superadmin Yayasan
                            "kode_lembaga" => $admin['kode_lembaga'],
                            "nama_lembaga" => $admin['nama_lembaga'] ?: 'Yayasan Pusat'
                        )
                    );

                    $jwt = JWT::encode($payload, $this->secret_key, 'HS256');
                    setAuthCookie($jwt, 60 * 60 * 24);
                    unset($admin['password']);

                    http_response_code(200);
                    echo json_encode([
                        "message" => "Login berhasil.",
                        "user" => $admin
                    ]);
                } else {
                    http_response_code(401);
                    echo json_encode(["message" => "Password yang Anda masukkan salah."]);
                }
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Username tidak ditemukan."]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Terjadi kesalahan server."]);
        }
        exit();
    }
}
