<?php
require_once __DIR__ . '/../helpers/auth_cookie.php';

class AuthController
{
    public function logout()
    {
        clearAuthCookie();
        http_response_code(200);
        echo json_encode([
            "message" => "Logout berhasil.",
        ]);
        exit();
    }
}

