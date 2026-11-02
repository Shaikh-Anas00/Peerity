package com.trustreview;

import com.trustreview.dto.CryptoEncryptResponse;
import com.trustreview.service.FileCryptoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Crypto round-trip, tamper-detection, and magic-byte tests for the in-process AES-256-GCM
 * service that replaced the former PHP sidecar (see P1.9 in the remediation plan). Same
 * coverage as the retired CryptoRoundTripTest, now exercised directly against
 * FileCryptoService instead of over HTTP against a separate process — so these run as part
 * of the normal test suite with no external process to start first.
 */
@SpringBootTest
@DisplayName("File Crypto Service — Round-Trip, Tamper-Detection & Magic-Byte Tests")
class FileCryptoServiceTest {

    @TempDir
    static Path tempStorageDir;

    @DynamicPropertySource
    static void overrideStorageDir(DynamicPropertyRegistry registry) {
        registry.add("trustreview.storage.encrypted-dir", () -> tempStorageDir.toString());
    }

    @Autowired
    private FileCryptoService fileCryptoService;

    @Test
    @DisplayName("Encrypt a .txt file then decrypt it — plaintext must match original")
    void roundTrip_encryptDecrypt_matches() throws Exception {
        String originalText = "TrustReview AES-256-GCM round-trip test payload. Timestamp: " + System.currentTimeMillis();
        MockMultipartFile file = new MockMultipartFile(
                "file", "test_payload.txt", "text/plain", originalText.getBytes(StandardCharsets.UTF_8));

        CryptoEncryptResponse response = fileCryptoService.encryptFile(file);
        assertEquals("success", response.getStatus());
        assertNotNull(response.getEncryptedFileName());
        assertTrue(response.getEncryptedFileName().endsWith(".enc"));

        byte[] decrypted = fileCryptoService.decryptFile(response.getEncryptedFileName());
        assertEquals(originalText, new String(decrypted, StandardCharsets.UTF_8),
                "Decrypted content must exactly match original plaintext");
    }

    @Test
    @DisplayName("Flipping a ciphertext byte causes decryption to fail (GCM auth tag mismatch)")
    void tamper_flipCiphertextByte_decryptFails() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "tamper_test.txt", "text/plain",
                "Tamper detection test payload.".getBytes(StandardCharsets.UTF_8));

        CryptoEncryptResponse response = fileCryptoService.encryptFile(file);
        Path encFile = tempStorageDir.resolve(response.getEncryptedFileName());
        assertTrue(Files.exists(encFile), "Encrypted file should exist in the storage dir");

        // Flip the first byte of the ciphertext: bytes 0-11 = IV, 12-27 = auth tag, 28+ = ciphertext
        byte[] raw = Files.readAllBytes(encFile);
        assertTrue(raw.length > 28, "Encrypted file too short to tamper");
        raw[28] = (byte) (raw[28] ^ 0xFF);
        Files.write(encFile, raw);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> fileCryptoService.decryptFile(response.getEncryptedFileName()));
        assertTrue(ex.getMessage().contains("Authentication tag") || ex.getMessage().contains("decryption failed"),
                "Expected an authentication/decryption failure message, got: " + ex.getMessage());
    }

    @Test
    @DisplayName("File with .pdf extension but plaintext content is rejected by the magic-byte check")
    void extensionSpoof_plainTextAsPdf_isRejected() {
        MockMultipartFile fakeFile = new MockMultipartFile(
                "file", "spoofed.pdf", "application/pdf",
                "This is actually plain text, not a PDF!".getBytes(StandardCharsets.UTF_8));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> fileCryptoService.encryptFile(fakeFile));
        assertTrue(ex.getMessage().contains("Invalid PDF"),
                "Expected a magic-byte validation error, got: " + ex.getMessage());
    }

    @Test
    @DisplayName("Unsupported file extension is rejected")
    void unsupportedExtension_isRejected() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "payload.exe", "application/octet-stream",
                "binary-ish content".getBytes(StandardCharsets.UTF_8));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> fileCryptoService.encryptFile(file));
        assertTrue(ex.getMessage().contains("Unsupported file extension"),
                "Expected an unsupported-extension error, got: " + ex.getMessage());
    }
}
