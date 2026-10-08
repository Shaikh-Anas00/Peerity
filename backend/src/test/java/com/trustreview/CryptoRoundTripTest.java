package com.trustreview;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.DisabledIfSystemProperty;

import java.io.*;
import java.net.*;
import java.net.http.*;
import java.nio.file.*;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Crypto Round-Trip and Tamper-Detection Tests.
 *
 * These tests call the PHP sidecar directly over HTTP (not through Spring MockMvc)
 * because the sidecar is a separate process.
 *
 * PREREQUISITES: PHP sidecar must be running at http://127.0.0.1:8000
 *   Start it with: php-service/run.bat  OR  php -S 127.0.0.1:8000 -t php-service/src
 *
 * Skip condition: Set system property skipPhpTests=true to skip (e.g., in CI without PHP).
 *   mvn test -DskipPhpTests=true
 *
 * Coverage:
 *   1. Encrypt a known plaintext .txt file → encrypted filename returned
 *   2. Decrypt the returned filename → plaintext matches original
 *   3. Tamper the .enc file (flip a ciphertext byte) → decrypt fails with error
 *      (AES-256-GCM authentication tag verification catches the tamper)
 *   4. Extension spoofing: file with .pdf extension but plaintext content → rejected
 */
@DisabledIfSystemProperty(named = "skipPhpTests", matches = "true")
@DisplayName("Crypto Round-Trip & Tamper-Detection Tests (requires PHP sidecar at 127.0.0.1:8000)")
class CryptoRoundTripTest {

    private static final String PHP_BASE = "http://127.0.0.1:8000";
    private static final String INTERNAL_KEY = "TrustReview-Internal-Secret-Key-Phase3-Secure";
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(java.time.Duration.ofSeconds(5))
            .build();

    // ── Precondition check ────────────────────────────────────────────────────

    @BeforeAll
    static void requirePhpSidecar() throws Exception {
        try {
            HttpResponse<String> health = HTTP.send(
                HttpRequest.newBuilder(URI.create(PHP_BASE + "/health")).GET().build(),
                HttpResponse.BodyHandlers.ofString());
            if (health.statusCode() != 200 || !health.body().contains("php-crypto")) {
                throw new org.opentest4j.TestAbortedException(
                    "PHP sidecar not running at " + PHP_BASE + " (status " + health.statusCode() + "). Skipping crypto tests.");
            }
        } catch (java.net.ConnectException e) {
            // Convert to a clear skip-like message
            throw new org.opentest4j.TestAbortedException(
                "PHP sidecar is not running at " + PHP_BASE + ". Start it first. Skipping crypto tests.");
        }
    }

    // ── Test 1 & 2: Round-trip encrypt → decrypt ─────────────────────────────

    @Test
    @DisplayName("Encrypt a .txt file then decrypt it — plaintext must match original")
    void roundTrip_encryptDecrypt_matches() throws Exception {
        String originalText = "TrustReview AES-256-GCM round-trip test payload. Timestamp: " + System.currentTimeMillis();
        Path tmpFile = Files.createTempFile("trustreview_test_", ".txt");
        Files.writeString(tmpFile, originalText);

        try {
            // 1. Encrypt
            String encryptedFileName = encryptFile(tmpFile, "test_payload.txt");
            assertNotNull(encryptedFileName, "encryptedFileName must not be null");
            assertTrue(encryptedFileName.endsWith(".enc"), "Encrypted file must have .enc extension");

            // 2. Decrypt
            byte[] decrypted = decryptFile(encryptedFileName);
            String decryptedText = new String(decrypted, java.nio.charset.StandardCharsets.UTF_8);

            assertEquals(originalText, decryptedText, "Decrypted content must exactly match original plaintext");
        } finally {
            Files.deleteIfExists(tmpFile);
        }
    }

    // ── Test 3: Tamper detection ──────────────────────────────────────────────

    @Test
    @DisplayName("Flipping a ciphertext byte in the .enc file causes decryption to fail (GCM auth tag mismatch)")
    void tamper_flipCiphertextByte_decryptFails() throws Exception {
        String originalText = "Tamper detection test payload.";
        Path tmpFile = Files.createTempFile("trustreview_tamper_", ".txt");
        Files.writeString(tmpFile, originalText);

        try {
            // 1. Encrypt to get the encrypted file name
            String encryptedFileName = encryptFile(tmpFile, "tamper_test.txt");

            // 2. Locate the encrypted file on disk inside php-service/storage/encrypted/
            //    The PHP sidecar writes files relative to its own working directory.
            //    We try two candidate roots: the backend project root and one level up.
            Path storageDir = Path.of("php-service", "storage", "encrypted");
            if (!Files.isDirectory(storageDir)) {
                storageDir = Path.of("..", "php-service", "storage", "encrypted");
            }
            Path encFile = storageDir.resolve(encryptedFileName);

            // If the storage directory isn't accessible from this working directory,
            // the test environment isn't configured for tamper tests — skip gracefully.
            org.junit.jupiter.api.Assumptions.assumeTrue(
                Files.exists(encFile),
                "Encrypted file not accessible at: " + encFile.toAbsolutePath()
                    + " — skipping tamper test (run with PHP sidecar storage mounted)");

            // 3. Tamper: flip byte 28 (first byte of ciphertext; bytes 0-11=IV, 12-27=auth tag)
            byte[] raw = Files.readAllBytes(encFile);
            assertTrue(raw.length > 28, "Encrypted file too short to tamper");
            raw[28] = (byte) (raw[28] ^ 0xFF); // flip all bits
            Files.write(encFile, raw);

            // 4. Attempt decrypt — must fail (PHP returns JSON error, not binary)
            HttpResponse<byte[]> response = HTTP.send(
                HttpRequest.newBuilder(URI.create(PHP_BASE + "/decrypt"))
                    .header("X-Internal-Service-Key", INTERNAL_KEY)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(
                        "{\"encryptedFileName\":\"" + encryptedFileName + "\"}"))
                    .build(),
                HttpResponse.BodyHandlers.ofByteArray());

            // PHP returns 500 when GCM auth tag fails
            assertNotEquals(200, response.statusCode(),
                "Decryption should fail after tampering but returned 200");

            String body = new String(response.body(), java.nio.charset.StandardCharsets.UTF_8);
            assertTrue(body.contains("error") || body.contains("fail") || body.contains("Authentication"),
                "Expected error message in body after tamper, got: " + body);

        } finally {
            Files.deleteIfExists(tmpFile);
        }
    }

    // ── Test 4: Magic-byte enforcement (extension spoofing) ───────────────────

    @Test
    @DisplayName("File with .pdf extension but plaintext content is rejected by PHP magic-byte check")
    void extensionSpoof_plainTextAsPdf_isRejected() throws Exception {
        // Create a file named .pdf but with plain text content (no %PDF- header)
        Path fakeFile = Files.createTempFile("spoofed_", ".pdf");
        Files.writeString(fakeFile, "This is actually plain text, not a PDF!");

        try {
            HttpResponse<String> response = sendEncryptRequest(fakeFile, "spoofed.pdf");
            assertNotEquals(200, response.statusCode(),
                "Expected PHP to reject spoofed PDF but got 200");
            assertTrue(response.body().contains("magic byte") || response.body().contains("validation failed"),
                "Expected magic byte error, got: " + response.body());
        } finally {
            Files.deleteIfExists(fakeFile);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Sends multipart upload to /encrypt and returns the encryptedFileName.
     */
    private String encryptFile(Path filePath, String filename) throws Exception {
        HttpResponse<String> resp = sendEncryptRequest(filePath, filename);
        assertEquals(200, resp.statusCode(),
            "Encrypt failed with status " + resp.statusCode() + ": " + resp.body());

        // Simple JSON parse for encryptedFileName (avoid full Jackson dependency in test helper)
        String body = resp.body();
        assertTrue(body.contains("encryptedFileName"), "Response missing encryptedFileName: " + body);
        // Extract: "encryptedFileName":"<uuid>.enc"
        int start = body.indexOf("\"encryptedFileName\":\"") + "\"encryptedFileName\":\"".length();
        int end   = body.indexOf("\"", start);
        return body.substring(start, end);
    }

    private HttpResponse<String> sendEncryptRequest(Path filePath, String filename) throws Exception {
        String boundary = "----FormBoundary" + UUID.randomUUID().toString().replace("-", "");
        byte[] fileBytes = Files.readAllBytes(filePath);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        String partHeader = "--" + boundary + "\r\n" +
            "Content-Disposition: form-data; name=\"file\"; filename=\"" + filename + "\"\r\n" +
            "Content-Type: application/octet-stream\r\n\r\n";
        baos.write(partHeader.getBytes());
        baos.write(fileBytes);
        baos.write(("\r\n--" + boundary + "--\r\n").getBytes());

        return HTTP.send(
            HttpRequest.newBuilder(URI.create(PHP_BASE + "/encrypt"))
                .header("X-Internal-Service-Key", INTERNAL_KEY)
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(baos.toByteArray()))
                .build(),
            HttpResponse.BodyHandlers.ofString());
    }

    /**
     * Calls /decrypt and returns raw decrypted bytes.
     */
    private byte[] decryptFile(String encryptedFileName) throws Exception {
        HttpResponse<byte[]> response = HTTP.send(
            HttpRequest.newBuilder(URI.create(PHP_BASE + "/decrypt"))
                .header("X-Internal-Service-Key", INTERNAL_KEY)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(
                    "{\"encryptedFileName\":\"" + encryptedFileName + "\"}"))
                .build(),
            HttpResponse.BodyHandlers.ofByteArray());

        assertEquals(200, response.statusCode(),
            "Decrypt failed with status " + response.statusCode());
        return response.body();
    }
}
