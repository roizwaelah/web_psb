<?php

if (!function_exists('getClientIpAddress')) {
    function getClientIpAddress()
    {
        $candidates = [
            $_SERVER['HTTP_CF_CONNECTING_IP'] ?? null,
            $_SERVER['HTTP_X_FORWARDED_FOR'] ?? null,
            $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
        ];

        foreach ($candidates as $raw) {
            if (!$raw) {
                continue;
            }

            // X-Forwarded-For bisa berisi beberapa IP.
            $parts = explode(',', $raw);
            $ip = trim($parts[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }

        return '0.0.0.0';
    }
}

if (!function_exists('enforceRateLimit')) {
    function enforceRateLimit($bucket, $maxRequests, $windowSeconds)
    {
        $ip = getClientIpAddress();
        $key = hash('sha256', $bucket . '|' . $ip);
        $dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'psb_rate_limit';

        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }

        $file = $dir . DIRECTORY_SEPARATOR . $key . '.json';
        $now = time();

        $payload = [
            'count' => 0,
            'start' => $now,
        ];

        $fp = @fopen($file, 'c+');
        if ($fp === false) {
            // Fail-open agar request normal tidak mati jika temp dir bermasalah.
            return;
        }

        if (@flock($fp, LOCK_EX)) {
            $raw = stream_get_contents($fp);
            if ($raw) {
                $decoded = json_decode($raw, true);
                if (is_array($decoded) && isset($decoded['count'], $decoded['start'])) {
                    $payload = $decoded;
                }
            }

            if (($now - intval($payload['start'])) >= $windowSeconds) {
                $payload = ['count' => 0, 'start' => $now];
            }

            $payload['count'] = intval($payload['count']) + 1;

            if ($payload['count'] > $maxRequests) {
                $retryAfter = max(1, $windowSeconds - ($now - intval($payload['start'])));
                header('Retry-After: ' . $retryAfter);
                http_response_code(429);
                echo json_encode([
                    'message' => 'Terlalu banyak permintaan. Silakan coba lagi beberapa saat.',
                ]);
                @flock($fp, LOCK_UN);
                @fclose($fp);
                exit();
            }

            ftruncate($fp, 0);
            rewind($fp);
            fwrite($fp, json_encode($payload));
            fflush($fp);
            @flock($fp, LOCK_UN);
        }

        @fclose($fp);
    }
}

