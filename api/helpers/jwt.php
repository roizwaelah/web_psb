<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/security.php';
require_once __DIR__ . '/auth_cookie.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

function validateJWT()
{
    // Cari header Authorization lintas web server (Apache/Nginx/FastCGI).
    $authHeader = '';

    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } else {
        $headers = [];
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
        } elseif (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
        }

        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization') {
                $authHeader = $value;
                break;
            }
        }
    }

    $token = '';
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
    } else {
        $token = getAuthTokenFromCookie();
    }

    if (!empty($token)) {
        $secret_key = getJwtSecret();

        try {
            // Decode token. Jika kedaluwarsa atau diubah, akan melempar Exception
            $decoded = JWT::decode($token, new Key($secret_key, 'HS256'));

            // Kembalikan objek data (id, nisn, role, dll) yang kita set saat login
            return $decoded->data;
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode([
                "message" => "Sesi Anda telah habis atau tidak valid. Silakan login kembali.",
                "error" => $e->getMessage()
            ]);
            exit();
        }
    }

    http_response_code(401);
    echo json_encode(["message" => "Akses ditolak. Token autentikasi tidak ditemukan."]);
    exit();
}
