package com.trustreview.dto;

import java.time.Instant;

/**
 * Result returned by the cryptographic ledger integrity verification algorithm.
 */
public class IntegrityVerificationResult {

    private boolean isValid;
    private int totalRecords;
    private Long brokenSequenceAt;
    private Instant verifiedAt;
    private String message;

    public IntegrityVerificationResult() {}

    public IntegrityVerificationResult(boolean isValid, int totalRecords, Long brokenSequenceAt, Instant verifiedAt, String message) {
        this.isValid = isValid;
        this.totalRecords = totalRecords;
        this.brokenSequenceAt = brokenSequenceAt;
        this.verifiedAt = verifiedAt;
        this.message = message;
    }

    public boolean isValid() { return isValid; }
    public void setValid(boolean valid) { isValid = valid; }

    public int getTotalRecords() { return totalRecords; }
    public void setTotalRecords(int totalRecords) { this.totalRecords = totalRecords; }

    public Long getBrokenSequenceAt() { return brokenSequenceAt; }
    public void setBrokenSequenceAt(Long brokenSequenceAt) { this.brokenSequenceAt = brokenSequenceAt; }

    public Instant getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
