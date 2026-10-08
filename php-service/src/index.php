<?php
// TrustReview PHP File & Cryptographic Sidecar Service (AES-256-GCM)
// Strictly stateless: no database connections, no business logic.

// 1. Load environment variables from .env file
function loadEnvFile(string $path): void {
    if (file_exists($path)) {
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) continue;
            if (str_contains($line, '=')) {
                list($key, $val) = explode('=', $line, 2);
                $key = trim($key);
                $val = trim($val);
                putenv("$key=$val");
                $_ENV[$key] = $val;
                $_SERVER[$key] = $val;
            }
        }
    }
}
loadEnvFile(dirname(__DIR__) . '/.env');
loadEnvFile(dirname(__DIR__, 2) . '/.env');

// Loopback IP Restriction: Strictly reject non-loopback connections (127.0.0.1 / ::1)
$remoteAddr = $_SERVER['REMOTE_ADDR'] ?? '';
if (!in_array($remoteAddr, ['127.0.0.1', '::1'], true)) {
    http_response_code(403);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        "status" => "error",
        "message" => "403 Forbidden: PHP sidecar only accepts local loopback connections (127.0.0.1)"
    ]);
    exit();
}

// Internal Service Security Headers (strictly service-to-service, no public CORS)
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");
header("Referrer-Policy: no-referrer");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");

$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$rawUri = $_SERVER['REQUEST_URI'] ?? '/health';
$uri = parse_url($rawUri, PHP_URL_PATH);

// Helper function to derive 256-bit encryption key
function getEncryptionKey(): string {
    $rawKey = getenv('APP_KEY') ?: 'TrustReview-AES-256-Secret-Master-Key-2026';
    return hash('sha256', $rawKey, true); // 32 bytes binary
}

// Helper function to verify service-to-service authentication header
function verifyInternalServiceKey(): void {
    $expectedKey = getenv('INTERNAL_SERVICE_KEY') ?: 'TrustReview-Internal-Secret-Key-Phase3-Secure';
    $providedKey = $_SERVER['HTTP_X_INTERNAL_SERVICE_KEY'] ?? '';

    if (empty($providedKey) || !hash_equals($expectedKey, $providedKey)) {
        http_response_code(403);
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode([
            "status" => "error",
            "message" => "403 Forbidden: Invalid or missing X-Internal-Service-Key"
        ]);
        exit();
    }
}

// Helper function to generate UUID v4
function generateUuidV4(): string {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // version 4
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // variant RFC 4122
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

// Storage directory for encrypted binaries
$storageDir = dirname(__DIR__) . '/storage/encrypted';
if (!is_dir($storageDir)) {
    mkdir($storageDir, 0777, true);
}

// 1. Health check endpoint
if ($uri === '/health' || $uri === '/' || php_sapi_name() === 'cli' && empty($_SERVER['REQUEST_METHOD'])) {
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        "status" => "ok",
        "service" => "php-crypto",
        "php_version" => PHP_VERSION,
        "crypto" => [
            "cipher" => "aes-256-gcm",
            "openssl_available" => extension_loaded('openssl'),
            "storage_dir_ready" => is_dir($storageDir) && is_writable($storageDir)
        ],
        "auth" => [
            "service_auth_enabled" => true,
            "header_required" => "X-Internal-Service-Key"
        ],
        "upload_limits" => [
            "upload_max_filesize" => ini_get('upload_max_filesize'),
            "post_max_size" => ini_get('post_max_size')
        ],
        "timestamp" => date("c")
    ], JSON_PRETTY_PRINT);
    exit();
}

// 2. Encrypt endpoint: POST /encrypt
if ($uri === '/encrypt' && $requestMethod === 'POST') {
    // Service-to-service auth check
    verifyInternalServiceKey();

    header("Content-Type: application/json; charset=UTF-8");

    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        $errorCode = $_FILES['file']['error'] ?? 'NO_FILE';
        echo json_encode(["status" => "error", "message" => "No file uploaded or upload error code: " . $errorCode]);
        exit();
    }

    $file = $_FILES['file'];
    $tmpPath = $file['tmp_name'];
    $fileSize = (int)$file['size'];
    $originalName = $file['name'];

    // Validate size (max 25MB = 26,214,400 bytes)
    if ($fileSize > 26214400) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "File size exceeds 25MB limit"]);
        exit();
    }

    // Read the first 8 bytes of the file for magic number verification
    $handle = fopen($tmpPath, 'rb');
    $headerBytes = fread($handle, 8);
    fclose($handle);

    // Deep MIME inspection using fileinfo magic database
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $detectedMime = finfo_file($finfo, $tmpPath);
    finfo_close($finfo);

    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

    // Magic Byte & MIME Validation Rules: Never rely solely on user-supplied file extensions
    $isValid = false;
    $validationError = "";

    if ($ext === 'pdf') {
        // PDF Magic Bytes: must start with %PDF- (0x25 0x50 0x44 0x46 0x2D)
        $isPdfMagic = str_starts_with($headerBytes, "%PDF-");
        $isPdfMime = in_array($detectedMime, ['application/pdf', 'application/x-pdf', 'application/acrobat'], true);
        if ($isPdfMagic && $isPdfMime) {
            $isValid = true;
        } else {
            $validationError = "Invalid PDF file: header bytes or MIME mismatch. Expected '%PDF-' signature and application/pdf MIME. Detected MIME: {$detectedMime}";
        }
    } elseif ($ext === 'zip') {
        // ZIP Magic Bytes: PK\x03\x04 or PK\x05\x06 or PK\x07\x08
        $isZipMagic = str_starts_with($headerBytes, "PK\x03\x04") || str_starts_with($headerBytes, "PK\x05\x06") || str_starts_with($headerBytes, "PK\x07\x08");
        $isZipMime = in_array($detectedMime, ['application/zip', 'application/x-zip-compressed', 'application/x-zip', 'application/octet-stream'], true);
        if ($isZipMagic && $isZipMime) {
            $isValid = true;
        } else {
            $validationError = "Invalid ZIP archive: missing 'PK' magic signature or MIME mismatch. Detected MIME: {$detectedMime}";
        }
    } elseif ($ext === 'txt') {
        // Plaintext: MIME must be text/* and content must not contain binary null bytes in the header
        $isTextMime = str_starts_with($detectedMime, 'text/') || $detectedMime === 'application/x-empty';
        $hasNoNullBytes = !str_contains($headerBytes, "\0");
        if ($isTextMime && $hasNoNullBytes) {
            $isValid = true;
        } else {
            $validationError = "Invalid text file: binary or non-text content detected. Detected MIME: {$detectedMime}";
        }
    } else {
        $validationError = "Unsupported file extension '.{$ext}'. Only PDF (.pdf), ZIP (.zip), and text (.txt) files are permitted.";
    }

    if (!$isValid) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "File magic byte validation failed: " . $validationError,
            "detectedMime" => $detectedMime,
            "extension" => $ext
        ]);
        exit();
    }

    // Compute SHA-256 hash of the original plaintext file
    $fileHash = hash_file('sha256', $tmpPath);

    // Read plaintext
    $plaintext = file_get_contents($tmpPath);
    if ($plaintext === false) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to read uploaded file"]);
        exit();
    }

    // Cryptographically secure 12-byte IV for AES-GCM
    $iv = random_bytes(12);
    $key = getEncryptionKey();
    $tag = '';

    // Encrypt using AES-256-GCM
    $ciphertext = openssl_encrypt($plaintext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
    if ($ciphertext === false) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "AES-256-GCM encryption failed"]);
        exit();
    }

    // Pack binary: [12-byte IV] + [16-byte Auth Tag] + [Ciphertext]
    $packedBinary = $iv . $tag . $ciphertext;

    // Generate unique storage filename: <uuid>.enc
    $uuid = generateUuidV4();
    $encryptedFileName = $uuid . '.enc';
    $targetPath = $storageDir . '/' . $encryptedFileName;

    if (file_put_contents($targetPath, $packedBinary) === false) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to write encrypted file to disk"]);
        exit();
    }

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "encryptedFileName" => $encryptedFileName,
        "fileHash" => $fileHash,
        "fileSize" => $fileSize
    ]);
    exit();
}

// 3. Decrypt endpoint: POST /decrypt
if ($uri === '/decrypt' && $requestMethod === 'POST') {
    // Service-to-service auth check
    verifyInternalServiceKey();

    // Read input JSON or form-data
    $encryptedFileName = '';
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (str_contains($contentType, 'application/json')) {
        $input = json_decode(file_get_contents('php://input'), true);
        $encryptedFileName = $input['encryptedFileName'] ?? '';
    } else {
        $encryptedFileName = $_POST['encryptedFileName'] ?? '';
    }

    if (empty($encryptedFileName)) {
        header("Content-Type: application/json; charset=UTF-8");
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "encryptedFileName is required"]);
        exit();
    }

    // Sanitize filename against directory traversal
    $sanitized = basename($encryptedFileName);
    $filePath = $storageDir . '/' . $sanitized;

    if (!file_exists($filePath)) {
        header("Content-Type: application/json; charset=UTF-8");
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Encrypted file not found on disk"]);
        exit();
    }

    $packedBinary = file_get_contents($filePath);
    if ($packedBinary === false || strlen($packedBinary) < 28) {
        header("Content-Type: application/json; charset=UTF-8");
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid or corrupted encrypted payload"]);
        exit();
    }

    // Unpack: [12-byte IV] + [16-byte Auth Tag] + [Ciphertext]
    $iv = substr($packedBinary, 0, 12);
    $tag = substr($packedBinary, 12, 16);
    $ciphertext = substr($packedBinary, 28);
    $key = getEncryptionKey();

    $plaintext = openssl_decrypt($ciphertext, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
    if ($plaintext === false) {
        header("Content-Type: application/json; charset=UTF-8");
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Authentication tag verification or decryption failed"]);
        exit();
    }

    // Stream decrypted plaintext binary
    header('Content-Type: application/octet-stream');
    header('Content-Length: ' . strlen($plaintext));
    header('X-Decrypted-By: TrustReview-PHP-Crypto');
    echo $plaintext;
    exit();
}

// 404 Not Found
http_response_code(404);
header("Content-Type: application/json; charset=UTF-8");
echo json_encode(["status" => "error", "message" => "Endpoint not found", "uri" => $uri]);