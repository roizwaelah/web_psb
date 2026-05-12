<?php
require_once __DIR__ . '/config/env.php';
loadBackendEnv(__DIR__ . '/.env');

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

require_once __DIR__ . '/helpers/cors.php';
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/routes/api.php';


// ===== HANDLE PREFLIGHT =====
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

