package com.trustreview.service;

import com.trustreview.dto.CryptoEncryptResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CryptoServiceClient {

    private static final Logger logger = LoggerFactory.getLogger(CryptoServiceClient.class);

    private final RestClient restClient;

    public CryptoServiceClient(
            @Value("${trustreview.php.url:http://localhost:8000}") String phpServiceUrl,
            @Value("${trustreview.internal.service-key:TrustReview-Internal-Secret-Key-Phase3-Secure}") String internalServiceKey) {
        logger.info("Configuring CryptoServiceClient targeting PHP sidecar at: {}", phpServiceUrl);
        this.restClient = RestClient.builder()
                .baseUrl(phpServiceUrl)
                .defaultHeader("X-Internal-Service-Key", internalServiceKey)
                .build();
    }

    /**
     * Sends multipart file to PHP sidecar for AES-256-GCM encryption.
     * Receives encrypted filename, SHA-256 file hash, and file size.
     */
    public CryptoEncryptResponse encryptFile(MultipartFile file) throws IOException {
        logger.info("Forwarding file '{}' ({} bytes) to PHP sidecar for AES-256-GCM encryption...",
                file.getOriginalFilename(), file.getSize());

        ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename() != null ? file.getOriginalFilename() : "submission.bin";
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource);

        CryptoEncryptResponse response = restClient.post()
                .uri("/encrypt")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(CryptoEncryptResponse.class);

        if (response == null || !"success".equalsIgnoreCase(response.getStatus())) {
            throw new IllegalStateException("PHP sidecar encryption returned invalid status: " +
                    (response != null ? response.getStatus() : "null"));
        }

        logger.info("File encrypted successfully: encryptedName={}, sha256={}",
                response.getEncryptedFileName(), response.getFileHash());
        return response;
    }

    /**
     * Requests decrypted file content from PHP sidecar.
     * Returns raw decrypted binary bytes.
     */
    public Map<String, Object> checkHealth() {
        try {
            return restClient.get()
                    .uri("/health")
                    .retrieve()
                    .body(Map.class);
        } catch (Exception e) {
            logger.warn("PHP crypto sidecar health check failed: {}", e.getMessage());
            return Map.of("status", "error", "message", "PHP sidecar unreachable: " + e.getMessage());
        }
    }

    public byte[] decryptFile(String encryptedFileName) {
        logger.info("Requesting decryption from PHP sidecar for: {}", encryptedFileName);

        byte[] decryptedBytes = restClient.post()
                .uri("/decrypt")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("encryptedFileName", encryptedFileName))
                .retrieve()
                .body(byte[].class);

        if (decryptedBytes == null || decryptedBytes.length == 0) {
            throw new IllegalStateException("Decrypted file content is empty or decryption failed");
        }

        logger.info("Decrypted {} bytes successfully from PHP sidecar", decryptedBytes.length);
        return decryptedBytes;
    }
}