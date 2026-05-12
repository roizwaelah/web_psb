<?php

if (!function_exists('isHttpsRequest')) {
    function isHttpsRequest()
    {
        if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
            return true;
        }

        if (isset($_SERVER['SERVER_PORT']) && intval($_SERVER['SERVER_PORT']) === 443) {
            return true;
        }

        if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https') {
            return true;
        }

        return false;
    }
}

if (!function_exists('setAuthCookie')) {
    function setAuthCookie($token, $ttlSeconds = 86400)
    {
        $secure = isHttpsRequest();
        $path = '/';

        setcookie('PSB_AUTH_TOKEN', $token, [
            'expires' => time() + intval($ttlSeconds),
            'path' => $path,
            'domain' => '',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }
}

if (!function_exists('clearAuthCookie')) {
    function clearAuthCookie()
    {
        $secure = isHttpsRequest();
        setcookie('PSB_AUTH_TOKEN', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'domain' => '',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }
}

if (!function_exists('getAuthTokenFromCookie')) {
    function getAuthTokenFromCookie()
    {
        return $_COOKIE['PSB_AUTH_TOKEN'] ?? '';
    }
}

