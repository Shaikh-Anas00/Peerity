package com.trustreview.service;

import com.trustreview.dto.CryptoEncryptResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * In-process replacement for the former PHP crypto sidecar (retired — see P1.9 in the
 * remediation plan). Performs the exact same AES-256-GCM envelope the sidecar used — a
 * 12-byte IV, a 16-byte auth tag, and the ciphertext, packed in that order — and the same
 * magic-byte + extension allowlist file validation, so any file encrypted under the old
 * sidecar remains decryptable here without a migration step.
 *
 * Kept as a single self-contained service (no separate client/server split) because there is
 * no longer a second process or network boundary to abstract: encryption is just something
 * this application does, not a remote dependency.
 */
@Service
public class FileCryptoService {

    private static final Logger logger = LoggerFactory.getLogger(FileCryptoService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static final String CIPHER_TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH_BYTES = 12;
    private static final int TAG_LENGTH_BITS = 128;
    private static final int TAG_LENGTH_BYTES = TAG_LENGTH_BITS / 8;
    private static final long MAX_FILE_SIZE_BYTES = 25L * 1024 * 1024; // 25MB, matches the former sidecar

    private static final byte[] PDF_MAGIC = "%PDF-".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] ZIP_MAGIC_1 = {0x50, 0x4B, 0x03, 0x04};
    private static final byte[] ZIP_MAGIC_2 = {0x50, 0x4B, 0x05, 0x06};
    private static final byte[] ZIP_MAGIC_3 = {0x50, 0x4B, 0x07, 0x08};

    @Value("${trustreview.crypto.app-key:TrustReview-AES-256-Secret-Master-Key-2026}")
    private String appKey;

    @Value("${trustreview.storage.encrypted-dir:./storage/encrypted}")
    private String storageDirPath;

    /**
     * Encrypts the uploaded file and writes it to the encrypted storage directory.
     * Throws {@link IllegalStateException} for any validation or crypto failure — matching the
     * status code the old HTTP-based client produced for every sidecar-side rejection, so
     * callers (and their error handling) see identical behavior across the migration.
     */
    public CryptoEncryptResponse encryptFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalStateException("Submission file cannot be empty.");
        }

        byte[] plaintext = file.getBytes();
        if (plaintext.length > MAX_FILE_SIZE_BYTES) {
            throw new IllegalStateException("File size exceeds 25MB limit.");
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
        validateFileContent(originalName, plaintext);

        String fileHash = sha256Hex(plaintext);

        byte[] iv = new byte[IV_LENGTH_BYTES];
        SECURE_RANDOM.nextBytes(iv);

        byte[] packed;
        try {
            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, aesKey(), new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] cipherTextWithTag = cipher.doFinal(plaintext); // Java appends the tag at the end

            int cipherLen = cipherTextWithTag.length - TAG_LENGTH_BYTES;
            byte[] ciphertext = Arrays.copyOfRange(cipherTextWithTag, 0, cipherLen);
            byte[] tag = Arrays.copyOfRange(cipherTextWithTag, cipherLen, cipherTextWithTag.length);

            // Pack as [IV][Tag][Ciphertext] — identical layout to the former PHP sidecar.
            packed = new byte[iv.length + tag.length + ciphertext.length];
            System.arraycopy(iv, 0, packed, 0, iv.length);
            System.arraycopy(tag, 0, packed, iv.length, tag.length);
            System.arraycopy(ciphertext, 0, packed, iv.length + tag.length, ciphertext.length);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("AES-256-GCM encryption failed", e);
        }

        String encryptedFileName = UUID.randomUUID() + ".enc";
        Path target = storageDir().resolve(encryptedFileName);
        Files.write(target, packed);

        logger.info("Encrypted file '{}' ({} bytes) -> {}, sha256={}",
                originalName, plaintext.length, encryptedFileName, fileHash);

        CryptoEncryptResponse response = new CryptoEncryptResponse();
        response.setStatus("success");
        response.setEncryptedFileName(encryptedFileName);
        response.setFileHash(fileHash);
        response.setFileSize((long) plaintext.length);
        return response;
    }

    /**
     * Decrypts a previously-encrypted file by its stored name and returns the raw plaintext.
     */
    public byte[] decryptFile(String encryptedFileName) {
        // Sanitize against directory traversal — mirrors the former sidecar's basename() guard.
        String sanitized = Path.of(encryptedFileName).getFileName().toString();
        Path source = storageDir().resolve(sanitized);

        if (!Files.exists(source)) {
            throw new IllegalStateException("Encrypted file not found on disk: " + sanitized);
        }

        byte[] packed;
        try {
            packed = Files.readAllBytes(source);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read encrypted file: " + sanitized, e);
        }

        if (packed.length < IV_LENGTH_BYTES + TAG_LENGTH_BYTES) {
            throw new IllegalStateException("Invalid or corrupted encrypted payload: " + sanitized);
        }

        byte[] iv = Arrays.copyOfRange(packed, 0, IV_LENGTH_BYTES);
        byte[] tag = Arrays.copyOfRange(packed, IV_LENGTH_BYTES, IV_LENGTH_BYTES + TAG_LENGTH_BYTES);
        byte[] ciphertext = Arrays.copyOfRange(packed, IV_LENGTH_BYTES + TAG_LENGTH_BYTES, packed.length);

        byte[] cipherTextWithTag = new byte[ciphertext.length + tag.length];
        System.arraycopy(ciphertext, 0, cipherTextWithTag, 0, ciphertext.length);
        System.arraycopy(tag, 0, cipherTextWithTag, ciphertext.length, tag.length);

        try {
            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, aesKey(), new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            return cipher.doFinal(cipherTextWithTag);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(
                    "Authentication tag verification or decryption failed for: " + sanitized, e);
        }
    }

    /** Reports whether the in-process crypto subsystem is operational — surfaced at /api/test/crypto-health. */
    public Map<String, Object> checkHealth() {
        boolean cipherAvailable;
        try {
            Cipher.getInstance(CIPHER_TRANSFORMATION);
            cipherAvailable = true;
        } catch (GeneralSecurityException e) {
            cipherAvailable = false;
        }

        boolean storageReady;
        try {
            Path dir = storageDir();
            storageReady = Files.isDirectory(dir) && Files.isWritable(dir);
        } catch (Exception e) {
            storageReady = false;
        }

        Map<String, Object> crypto = new HashMap<>();
        crypto.put("cipher", "aes-256-gcm");
        crypto.put("provider_available", cipherAvailable);
        crypto.put("storage_dir_ready", storageReady);

        Map<String, Object> health = new HashMap<>();
        health.put("status", cipherAvailable && storageReady ? "ok" : "error");
        health.put("service", "in-process-crypto");
        health.put("crypto", crypto);
        return health;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private SecretKeySpec aesKey() {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = digest.digest(appKey.getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(keyBytes, "AES");
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    private Path storageDir() {
        try {
            Path dir = Path.of(storageDirPath);
            Files.createDirectories(dir);
            return dir;
        } catch (IOException e) {
            throw new IllegalStateException("Could not create encrypted storage directory: " + storageDirPath, e);
        }
    }

    private static String sha256Hex(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) sb.append('0');
                sb.append(hex);
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    /**
     * Validates that the file content matches its extension via magic bytes — never trust a
     * client-supplied extension alone. Only PDF, ZIP, and plain text are accepted, matching the
     * former sidecar's allowlist exactly.
     */
    private void validateFileContent(String originalName, byte[] content) {
        String ext = "";
        int dot = originalName.lastIndexOf('.');
        if (dot >= 0 && dot < originalName.length() - 1) {
            ext = originalName.substring(dot + 1).toLowerCase(Locale.ROOT);
        }

        switch (ext) {
            case "pdf" -> {
                if (!startsWith(content, PDF_MAGIC)) {
                    throw new IllegalStateException(
                            "Invalid PDF file: header bytes do not match the expected '%PDF-' signature.");
                }
            }
            case "zip" -> {
                if (!startsWith(content, ZIP_MAGIC_1) && !startsWith(content, ZIP_MAGIC_2) && !startsWith(content, ZIP_MAGIC_3)) {
                    throw new IllegalStateException("Invalid ZIP archive: missing 'PK' magic signature.");
                }
            }
            case "txt" -> {
                // Mirrors the former sidecar exactly: only the first 8 bytes are checked for a
                // null byte, as a cheap binary-content signal for plaintext.
                int headerLen = Math.min(content.length, 8);
                for (int i = 0; i < headerLen; i++) {
                    if (content[i] == 0) {
                        throw new IllegalStateException("Invalid text file: binary content detected.");
                    }
                }
            }
            default -> throw new IllegalStateException(
                    "Unsupported file extension '." + ext + "'. Only PDF (.pdf), ZIP (.zip), and text (.txt) files are permitted.");
        }
    }

    private static boolean startsWith(byte[] data, byte[] prefix) {
        if (data.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) return false;
        }
        return true;
    }
}
