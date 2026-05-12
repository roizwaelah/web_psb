<?php

if (!function_exists('getJwtSecret')) {
    function getJwtSecret()
    {
        $envSecret = getenv('PSB_JWT_SECRET');
        if (($envSecret === false || trim($envSecret) === '') && isset($_ENV['PSB_JWT_SECRET'])) {
            $envSecret = $_ENV['PSB_JWT_SECRET'];
        }
        if (($envSecret === false || trim($envSecret) === '') && isset($_SERVER['PSB_JWT_SECRET'])) {
            $envSecret = $_SERVER['PSB_JWT_SECRET'];
        }
        if ($envSecret !== false && trim((string) $envSecret) !== '') {
            return trim((string) $envSecret);
        }

        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                "message" => "Konfigurasi server belum lengkap: PSB_JWT_SECRET belum diset."
            ]);
        }
        exit();
    }
}
