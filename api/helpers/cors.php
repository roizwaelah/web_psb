<?php
// Konfigurasi origin dari ENV (pisahkan dengan koma), contoh:
// APP_ALLOWED_ORIGINS=http://localhost:5173,https://psb.example.com
$allowedOriginsEnv = getenv('APP_ALLOWED_ORIGINS');
$allowedOrigins = [];

if ($allowedOriginsEnv !== false && trim($allowedOriginsEnv) !== '') {
    $allowedOrigins = array_values(array_filter(array_map('trim', explode(',', $allowedOriginsEnv))));
}

if (empty($allowedOrigins)) {
    $allowedOrigins = [
        "http://localhost:5173",
    ];
}

$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($requestOrigin !== '' && in_array($requestOrigin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: " . $requestOrigin);
    header("Vary: Origin");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
