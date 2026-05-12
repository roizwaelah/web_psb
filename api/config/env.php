<?php

if (!function_exists('psb_load_env')) {
    function psb_load_env()
    {
        static $loaded = false;
        if ($loaded) {
            return;
        }

        $loaded = true;
        $envPath = __DIR__ . '/../.env';
        if (!is_readable($envPath)) {
            return;
        }

        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || strpos($line, '#') === 0 || strpos($line, '=') === false) {
                continue;
            }

            [$key, $value] = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            $value = trim($value, "\"'");

            if ($key !== '' && getenv($key) === false) {
                putenv($key . '=' . $value);
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
            }
        }
    }
}

if (!function_exists('loadBackendEnv')) {
    function loadBackendEnv($path = null)
    {
        psb_load_env();
    }
}

if (!function_exists('psb_env')) {
    function psb_env($key, $default = null)
    {
        psb_load_env();

        $value = getenv($key);
        if ($value === false && isset($_ENV[$key])) {
            $value = $_ENV[$key];
        }
        if ($value === false && isset($_SERVER[$key])) {
            $value = $_SERVER[$key];
        }

        return ($value === false || trim((string) $value) === '') ? $default : trim((string) $value);
    }
}

if (!function_exists('psb_config_error')) {
    function psb_config_error($message)
    {
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=UTF-8');
        }

        echo json_encode(["message" => $message]);
        exit();
    }
}
