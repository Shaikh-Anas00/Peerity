package com.trustreview.dto;

public class CryptoEncryptResponse {
    private String status;
    private String encryptedFileName;
    private String fileHash;
    private Long fileSize;

    public CryptoEncryptResponse() {}

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getEncryptedFileName() { return encryptedFileName; }
    public void setEncryptedFileName(String encryptedFileName) { this.encryptedFileName = encryptedFileName; }

    public String getFileHash() { return fileHash; }
    public void setFileHash(String fileHash) { this.fileHash = fileHash; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
}