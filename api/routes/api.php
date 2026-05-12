<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/cors.php';
require_once __DIR__ . '/../helpers/jwt.php'; 
require_once __DIR__ . '/../helpers/rate_limit.php';
require_once __DIR__ . '/../helpers/csp_report.php';

// Load semua Controller
require_once __DIR__ . '/../controllers/HomeController.php';
require_once __DIR__ . '/../controllers/PendaftaranController.php';
require_once __DIR__ . '/../controllers/AuthAdminController.php';
require_once __DIR__ . '/../controllers/AdminController.php';
require_once __DIR__ . '/../controllers/AuthSiswaController.php';
require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/DokumenController.php';

// =====================================
// PENGECEKAN LISENSI APLIKASI
// =====================================
require_once __DIR__ . '/../controllers/LicenseChecker.php'; 

$clientLicenseKey = "e277d9b10ab6b897d351015fc89e26e8"; 
$checker = new LicenseChecker($clientLicenseKey);
$checker->verify(); 
// =====================================


// Ambil path URI dan Method
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// =====================================
// ENDPOINT PUBLIK
// =====================================
if (strpos($uri, '/public/home') !== false && $method === 'GET') {
    enforceRateLimit('public_home', 240, 60); // 240 req/menit/IP
    $controller = new HomeController();
    // Tangkap parameter lembaga dari URL (?lembaga=mts). Jika kosong, default 'ponpes'
    $kode_lembaga = $_GET['lembaga'] ?? 'ponpes'; 
    $controller->getHomeData($kode_lembaga);
} 
elseif (strpos($uri, '/security/csp-report') !== false && $method === 'POST') {
    handleCspReport();
}
elseif (strpos($uri, '/pendaftaran') !== false && $method === 'POST') {
    enforceRateLimit('pendaftaran', 20, 3600); // 20 req/jam/IP
    $controller = new PendaftaranController();
    $controller->store();
} 
elseif (strpos($uri, '/auth/siswa/login') !== false && $method === 'POST') {
    enforceRateLimit('auth_siswa_login', 30, 900); // 30 req/15 menit/IP
    $controller = new AuthSiswaController();
    $controller->login();
} 
elseif (strpos($uri, '/auth/admin/login') !== false && $method === 'POST') {
    enforceRateLimit('auth_admin_login', 20, 900); // 20 req/15 menit/IP
    $controller = new AuthAdminController();
    $controller->login();
}
elseif (strpos($uri, '/auth/logout') !== false && $method === 'POST') {
    $controller = new AuthController();
    $controller->logout();
}

// =====================================
// ENDPOINT PRIVAT (Butuh Token)
// =====================================
elseif (strpos($uri, '/siswa/') !== false) {
    $userData = validateJWT();
    
    // Ambil role secara aman
    $userRole = $userData->role ?? ($userData->data->role ?? '');

    if ($userRole !== 'siswa') {
        http_response_code(403); 
        echo json_encode(["message" => "Akses ditolak. Rute ini khusus untuk siswa."]);
        exit();
    }

    if (strpos($uri, '/siswa/profile') !== false) {
        $controller = new AuthSiswaController();
        if ($method === 'GET') {
            $controller->getProfile($userData);
        } elseif ($method === 'PUT') { 
            $controller->updateProfile($userData);
        }
    } 
    elseif (strpos($uri, '/siswa/dokumen') !== false) {
        $controller = new DokumenController();
        if ($method === 'GET') {
            $controller->getDokumen($userData);
        } elseif ($method === 'POST') {
            $controller->uploadDokumen($userData);
        }
    }
}

elseif (strpos($uri, '/admin/') !== false) {
    $userData = validateJWT();
    
    // Ambil role dan lembaga_id secara aman dari JWT
    $userRole = $userData->role ?? ($userData->data->role ?? '');
    $adminLembagaId = $userData->lembaga_id ?? ($userData->data->lembaga_id ?? null);
    
    if (!in_array($userRole, ['admin', 'validator'])) {
        http_response_code(403); 
        echo json_encode(["message" => "Akses ditolak."]);
        exit();
    }

    // MASUKKAN LEMBAGA ID KE DALAM CONTROLLER ADMIN
    $adminController = new AdminController($adminLembagaId);

    // RUTE DASHBOARD & STATISTIK
    if (strpos($uri, '/admin/dashboard/stats') !== false && $method === 'GET') {
        $adminController->getDashboardStats();
    }
    // RUTE VALIDASI
    elseif (strpos($uri, '/admin/validasi/list') !== false && $method === 'GET') {
        $adminController->getPendaftarList();
    }
    elseif (preg_match('/\/admin\/validasi\/(\d+)$/', $uri, $matches) && $method === 'GET') {
        $adminController->getDetailSantri($matches[1]);
    }
    elseif (preg_match('/\/admin\/validasi\/(\d+)\/status$/', $uri, $matches) && $method === 'PUT') {
        $adminController->updateStatusSantri($matches[1]);
    }
    // RUTE PEMBAYARAN	
	elseif (preg_match('/\/admin\/pembayaran\/(\d+)\/status$/', $uri, $matches) && $method === 'PUT') {
        $adminController->updateStatusPembayaran($matches[1]);
    }
    // RUTE SETTINGS
    elseif (strpos($uri, '/admin/settings') !== false && $method === 'PUT') {
        if ($userRole !== 'admin') {
            http_response_code(403); 
            echo json_encode(["message" => "Akses ditolak. Rute ini khusus Administrator."]);
            exit();
        }
        $adminController->updateSettings();
    }
    // RUTE UPLOAD GAMBAR
    elseif (strpos($uri, '/admin/upload-image') !== false && $method === 'POST') {
        if ($userRole !== 'admin') { http_response_code(403); exit(); }
        $adminController->uploadPublicImage();
    }
    // UPDATE & DELETE SANTRI (Khusus Admin Utama)
    elseif (preg_match('/\/admin\/pendaftar\/(\d+)$/', $uri, $matches) && $method === 'PUT') {
        if ($userRole !== 'admin') { http_response_code(403); exit(); }
        $adminController->updateSantri($matches[1]);
    }
    elseif (preg_match('/\/admin\/pendaftar\/(\d+)$/', $uri, $matches) && $method === 'DELETE') {
        if ($userRole !== 'admin') { http_response_code(403); exit(); }
        $adminController->deleteSantri($matches[1]);
    }
    // MANAJEMEN PENGGUNA
    elseif (strpos($uri, '/admin/users') !== false) {
        if ($userRole !== 'admin') {
            http_response_code(403); echo json_encode(["message" => "Akses ditolak."]); exit();
        }

        if ($method === 'GET') {
            $adminController->getAdmins();
        } elseif ($method === 'POST') {
            $adminController->createAdmin();
        } elseif (preg_match('/\/admin\/users\/(\d+)$/', $uri, $matches) && $method === 'PUT') {
            $adminController->updateAdmin($matches[1]);
        } elseif (preg_match('/\/admin\/users\/(\d+)$/', $uri, $matches) && $method === 'DELETE') {
            $adminController->deleteAdmin($matches[1], $userData->id ?? ($userData->data->id ?? 0));
        }
    }
    // UPDATE PENGUMUMAN
    elseif (strpos($uri, '/admin/pengumuman') !== false && $method === 'PUT') {
        if ($userRole !== 'admin') {
            http_response_code(403);
            echo json_encode(["message" => "Akses ditolak. Rute ini khusus Administrator."]);
            exit();
        }
        $adminController->updatePengumuman();
    }
    // MANAJEMEN DOKUMEN / UPLOADS
    elseif (strpos($uri, '/admin/dokumen') !== false) {
        if (!in_array($userRole, ['admin', 'validator'])) { http_response_code(403); exit(); }

        if ($method === 'GET') {
            $adminController->getAllDokumen();
        } elseif (preg_match('/\/admin\/dokumen\/(\d+)$/', $uri, $matches) && $method === 'DELETE') {
            $adminController->deleteDokumen($matches[1]);
        }
    }
}

// Jika rute tidak ada
else {
    http_response_code(404);
    echo json_encode([
        "message" => "Endpoint tidak ditemukan.",
        "path_yang_dibaca" => $uri 
    ]);
}
?>
