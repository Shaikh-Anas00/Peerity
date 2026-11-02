package com.trustreview.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Fails Spring Boot startup under the "prod" profile if a secret still equals its
 * dev-only fallback literal (the same literal committed in application.properties).
 * Prevents a forgotten environment variable from silently running a production
 * deployment with a secret anyone can read from the public git history.
 */
@Component
@Profile("prod")
public class ProductionSecretsGuard implements ApplicationRunner {

    private static final String DEFAULT_AUDIT_HMAC_SECRET = "TrustReview-Audit-Ledger-HMAC-Secret-Key-Phase6-Production-Grade";
    private static final String DEFAULT_CRYPTO_APP_KEY = "TrustReview-AES-256-Secret-Master-Key-2026";

    @Value("${audit.ledger.hmac-secret}")
    private String auditHmacSecret;

    @Value("${trustreview.crypto.app-key}")
    private String cryptoAppKey;

    @Override
    public void run(ApplicationArguments args) {
        List<String> violations = new ArrayList<>();

        if (DEFAULT_AUDIT_HMAC_SECRET.equals(auditHmacSecret)) {
            violations.add("AUDIT_LEDGER_HMAC_SECRET is still the committed default — "
                    + "set a unique secret via the AUDIT_LEDGER_HMAC_SECRET environment variable.");
        }
        if (DEFAULT_CRYPTO_APP_KEY.equals(cryptoAppKey)) {
            violations.add("APP_KEY is still the committed default — set a unique secret via the "
                    + "APP_KEY environment variable before encrypting any real submission "
                    + "(changing it later makes already-encrypted files permanently unreadable).");
        }

        if (!violations.isEmpty()) {
            throw new IllegalStateException(
                    "Refusing to start with profile 'prod' using committed default secrets:\n  - "
                            + String.join("\n  - ", violations)
                            + "\n\nSee docs/CONFIG_SECURITY_ANALYSIS.md for the full list of required "
                            + "production environment variables.");
        }
    }
}
