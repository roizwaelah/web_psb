<?php

function handleCspReport() {
    $rawBody = file_get_contents('php://input');
    $decoded = json_decode($rawBody, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        $decoded = ["raw_body" => $rawBody];
    }

    // Browser bisa kirim dua format:
    // 1) {"csp-report": {...}}
    // 2) [{"body": {...}, ...}] untuk report-to/reporting endpoint
    $reportBody = $decoded;
    if (isset($decoded['csp-report'])) {
        $reportBody = $decoded['csp-report'];
    } elseif (is_array($decoded) && isset($decoded[0]['body'])) {
        $reportBody = $decoded[0]['body'];
    }

    $logRow = [
        'timestamp_utc' => gmdate('c'),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'content_type' => $_SERVER['CONTENT_TYPE'] ?? '',
        'report' => $reportBody,
    ];

    $logDir = __DIR__ . '/../storage/logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }

    $logFile = $logDir . '/csp-violations.log';
    @file_put_contents($logFile, json_encode($logRow, JSON_UNESCAPED_SLASHES) . PHP_EOL, FILE_APPEND | LOCK_EX);

    http_response_code(204);
    exit();
}
