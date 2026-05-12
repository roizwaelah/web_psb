<?php
require_once __DIR__ . '/env.php';

if (!function_exists('getJwtSecret')) {
    function getJwtSecret()
    {
        $envSecret = psb_env('PSB_JWT_SECRET');
        if ($envSecret) {
            return $envSecret;
        }

        psb_config_error('Konfigurasi server belum lengkap: PSB_JWT_SECRET belum diset.');
    }
}
