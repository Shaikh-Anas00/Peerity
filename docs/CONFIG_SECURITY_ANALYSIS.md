# TrustReview — Configuration & Security Analysis

> **Scope**: This document audits every configuration decision that could cause a problem before
> public deployment. Each item includes its current status, why it matters, and the exact
> production action required.

---

## Item 1 — CORS (Cross-Origin Resource Sharing)

### Current Config (SecurityConfig.java)
```java
config.setAllowedOriginPatterns(Arrays.asList(
    "http://localhost:*",
    "http://127.0.0.1:*",
    clientUrl        // ${CLIENT_URL:http://localhost:5173}
));
config.setAllowCredentials(true);
```

### Status: SAFE FOR LOCAL DEV / ACTION REQUIRED FOR PRODUCTION

**Why it is safe now**: `allowedOriginPatterns` with `localhost:*` is NOT a wildcard for the entire
internet — it is restricted to loopback addresses. Credential-bearing CORS (allowCredentials=true)
also forbids `*` by the spec, which Spring correctly enforces.

**Before deploying to a server**: Set the `CLIENT_URL` env var to your exact frontend domain:
```
CLIENT_URL=https://trustreview.yourdomain.com
```
Remove the `http://localhost:*` and `http://127.0.0.1:*` patterns from the production list
(or gate them behind `@Profile("dev")`).

---

## Item 2 — Session Cookie `Secure` Flag

### Current Config (application.properties)
```
server.servlet.session.cookie.secure=false
```

### Status: CORRECT FOR LOCAL DEV / MUST CHANGE FOR PRODUCTION

**Why `Secure=false` is correct on localhost**: Browsers silently discard `Secure` cookies over
plain `http://`. Setting it to `true` on localhost would break your entire login system — the
JSESSIONID cookie would be ignored.

**Production action**: Behind HTTPS, set:
```
SPRING_COOKIE_SECURE=true
```
And update `application.properties`:
```properties
server.servlet.session.cookie.secure=${SPRING_COOKIE_SECURE:false}
```
Never hard-code `true` — the default must remain `false` so the app still works in dev.

---

## Item 3 — X-Internal-Service-Key (PHP Sidecar Auth)

### Current Config
- Spring side (`application.properties`): `trustreview.internal.service-key=${INTERNAL_SERVICE_KEY:TrustReview-Internal-Secret-Key-Phase3-Secure}`
- PHP side (`index.php`): `getenv('INTERNAL_SERVICE_KEY') ?: 'TrustReview-Internal-Secret-Key-Phase3-Secure'`

### Status: SAFE FOR LOCAL DEV / ACTION REQUIRED FOR PRODUCTION

**Why the fallback default is risky in production**: The fallback literal `TrustReview-Internal-Secret-Key-Phase3-Secure`
is in your public git repository. Anyone who clones your repo and forgets to set the env var
will expose this key.

**Production action**: Generate a random secret and set it as an environment variable on both
the Spring Boot host and the PHP sidecar host:
```powershell
# Generate a 256-bit random key
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```
Set it in `.env` (never commit this file) or in your hosting platform's secret manager:
```
INTERNAL_SERVICE_KEY=<random-base64-string>
```
Both services read from the environment — the fallback is only a safety net for initial dev setup.

---

## Item 4 — AES Encryption Key (PHP APP_KEY)

### Current Config (index.php)
```php
function getEncryptionKey(): string {
    $rawKey = getenv('APP_KEY') ?: 'TrustReview-AES-256-Secret-Master-Key-2026';
    return hash('sha256', $rawKey, true); // 32 bytes binary
}
```

### Status: ACCEPTABLE FOR DEV / ACTION REQUIRED BEFORE ANY REAL DATA

**The current design is correct**: The raw `APP_KEY` string is SHA-256-hashed to produce a
32-byte AES key. This is better than truncating or padding.

**The problem**: The fallback `TrustReview-AES-256-Secret-Master-Key-2026` is committed to git.
If a file is encrypted with the default key and the key later changes, all existing encrypted
files become permanently unreadable (no key rotation mechanism exists yet).

**Production action**: Set a strong random `APP_KEY` before encrypting any real submission:
```
APP_KEY=<random-base64-or-hex-string>
```
Back this up securely. Losing it = losing all encrypted submissions permanently.

**Future Work (not required now)**: Add an envelope encryption model (DEK + KEK) so the
master key can be rotated without re-encrypting every file.

---

## Item 5 — Audit Ledger HMAC Secret

### Current Config
```properties
audit.ledger.hmac-secret=${AUDIT_LEDGER_HMAC_SECRET:TrustReview-Audit-Ledger-HMAC-Secret-Key-Phase6-Production-Grade}
```

### Status: SAME AS ITEM 3 — SAFE FOR DEV, ACTION REQUIRED IN PRODUCTION

The fallback literal is committed to git. Set `AUDIT_LEDGER_HMAC_SECRET` as an env var in
production. Losing or changing this secret invalidates the entire audit chain verification.

---

## Item 6 — PHP Sidecar Network Binding

### Current Config (php-service/run.bat)
```bat
php -S 127.0.0.1:8000 -t src
```

### Status: CORRECT AND SECURE

The PHP sidecar is bound to `127.0.0.1` (loopback only). It is NOT accessible from the local
network, Wi-Fi, or the internet. This is confirmed at both the OS level (bind address) and the
application level (loopback IP check in `index.php`).

No action required.

---

## Item 7 — Rate Limiting

### Current Implementation
- `LoginRateLimitFilter.java` (or `AuthController`): in-memory `ConcurrentHashMap` tracking
  failed login attempts per IP, max 5 attempts per minute.

### Status: FUNCTIONAL FOR DEV AND DEMO / NOTE LIMITATIONS

**What it does well**: Stops automated brute-force tools from hammering the login endpoint.

**Known limitations**:
1. **Not cluster-safe**: If you run two instances of Spring Boot (load-balanced), each has its
   own in-memory counter. An attacker can make 5 attempts per instance. For a single-server
   local project, this is fine.
2. **IP spoofing via X-Forwarded-For**: If behind a proxy without a fixed trust list, an attacker
   can rotate the `X-Forwarded-For` header to bypass per-IP limits. Not applicable for local dev.
3. **Memory leak risk**: The `ConcurrentHashMap` grows unbounded if IPs are never cleaned up.
   A scheduled cleanup or TTL-based eviction is needed for long-running deployments.

**For this project scope**: Current implementation is acceptable. List "production-grade rate
limiting (Redis-backed, proxy-aware)" under Future Work.

---

## Item 8 — Seed Accounts in Production

### Current Config
```java
@Component
@Profile("dev")
public class DataInitializer implements ApplicationRunner { ... }
```

### Status: CORRECT AND SECURE

`DataInitializer` only runs when the `dev` Spring profile is active. The default:
```properties
spring.profiles.active=${SPRING_PROFILES_ACTIVE:dev}
```
means it runs in local dev by default. In production, set `SPRING_PROFILES_ACTIVE=prod`
and the seed accounts (`admin@trustreview.edu`, `student1@trustreview.edu`, etc.) will
never be created.

No action required for the current submission.

---

## Item 9 — spring.jpa.hibernate.ddl-auto=update

### Current Config
```properties
spring.jpa.hibernate.ddl-auto=update
```

### Status: ACCEPTABLE FOR DEV / RISKY IN PRODUCTION

`update` tells Hibernate to auto-migrate the schema on startup. This is convenient for
development but can corrupt a production database if a migration goes wrong.

**For the current project submission**: Keep `update`. It ensures the schema stays in sync
with entity changes without manual SQL scripts.

**Future Work**: Switch to `validate` (or `none`) in production and use Flyway or Liquibase
for versioned database migrations.

---

## Summary Table

| # | Item | Local Dev | Production Action |
|---|---|---|---|
| 1 | CORS | Safe (localhost only) | Set `CLIENT_URL` to exact domain; remove localhost patterns |
| 2 | Cookie `Secure` flag | Correct (`false`) | Set `SPRING_COOKIE_SECURE=true` behind HTTPS |
| 3 | X-Internal-Service-Key | Fallback in git (acceptable) | Generate random key, set env var on both services |
| 4 | AES APP_KEY | Fallback in git (acceptable for demo) | Set random key before any real data; never change after |
| 5 | HMAC Secret | Fallback in git (acceptable) | Set `AUDIT_LEDGER_HMAC_SECRET` env var in production |
| 6 | PHP loopback binding | CORRECT (127.0.0.1) | No action needed |
| 7 | Rate limiting | Functional (in-memory) | Redis-backed rate limiter for production cluster |
| 8 | Seed accounts | Gated by @Profile("dev") | Set `SPRING_PROFILES_ACTIVE=prod` in production |
| 9 | DDL auto=update | Acceptable for dev | Switch to Flyway/Liquibase for production |
