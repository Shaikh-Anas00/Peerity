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

## Item 3 — X-Internal-Service-Key (PHP Sidecar Auth) — REMOVED

**Status: OBSOLETE.** The PHP crypto sidecar was retired and its logic folded directly into
the Spring Boot backend (`FileCryptoService`, in-process AES-256-GCM via `javax.crypto`).
There is no longer a second process, so there is no service-to-service boundary to
authenticate across, and `INTERNAL_SERVICE_KEY`/`trustreview.internal.service-key` no longer
exist anywhere in the codebase. This item is kept here only as a historical record of a
decision that no longer applies — see Item 4 for the encryption key that replaced it.

---

## Item 4 — AES Encryption Key (APP_KEY)

### Current Config (`application.properties` / `FileCryptoService`)
```properties
trustreview.crypto.app-key=${APP_KEY:TrustReview-AES-256-Secret-Master-Key-2026}
```
```java
private SecretKeySpec aesKey() {
    byte[] keyBytes = MessageDigest.getInstance("SHA-256").digest(appKey.getBytes(StandardCharsets.UTF_8));
    return new SecretKeySpec(keyBytes, "AES"); // 32 bytes
}
```

### Status: ACCEPTABLE FOR DEV / ACTION REQUIRED BEFORE ANY REAL DATA

**The current design is correct**: The raw `APP_KEY` string is SHA-256-hashed to produce a
32-byte AES key — unchanged from the former PHP sidecar's approach (same hash, same fallback
literal), so any file encrypted before the sidecar was retired remains decryptable.

**The problem**: The fallback `TrustReview-AES-256-Secret-Master-Key-2026` is committed to git.
If a file is encrypted with the default key and the key later changes, all existing encrypted
files become permanently unreadable (no key rotation mechanism exists yet). The backend now
refuses to start under `SPRING_PROFILES_ACTIVE=prod` if `APP_KEY` is still this default (see
`ProductionSecretsGuard`).

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

## Item 6 — PHP Sidecar Network Binding — REMOVED

**Status: OBSOLETE.** There is no longer a PHP sidecar process or a loopback network boundary
to secure — encryption happens in-process inside the Spring Boot backend. Kept as a
historical record only.

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

## Item 9 — spring.jpa.hibernate.ddl-auto=update — RESOLVED

### Former Config
```properties
spring.jpa.hibernate.ddl-auto=update
```

### Status: RESOLVED — Flyway now owns schema versioning

`update` told Hibernate to auto-migrate the schema on startup, which is convenient in
development but can corrupt a production database if an inferred migration goes wrong, and
leaves no versioned history of what the schema actually is.

**Fix applied**: `ddl-auto` is now `validate` in every profile (dev and prod), and Flyway
(`org.flywaydb:flyway-core` + `flyway-mysql`) owns schema creation via
`backend/src/main/resources/db/migration/V1__baseline.sql` — a baseline captured from the
exact schema Hibernate had been managing. `spring.flyway.baseline-on-migrate=true` lets
Flyway adopt the existing, already-`ddl-auto=update`-managed database as if `V1` had already
been applied, rather than re-running `CREATE TABLE` against tables that already exist. All
future schema changes go through a new `V{n}__*.sql` file — Hibernate no longer infers schema
changes at runtime in any profile. The H2 test profile is unaffected (`spring.flyway.enabled=
false` there — Flyway's MySQL-dialect SQL isn't valid against H2, so tests keep generating
their schema straight from the JPA entities via `ddl-auto=create-drop`, exactly as before).
Verified end-to-end: a fresh database migrates cleanly and passes Hibernate's `validate` check
with zero mismatches, and baselining a pre-existing (already-seeded) database adopts it
without attempting to re-create any table.

---

## Summary Table

| # | Item | Local Dev | Production Action |
|---|---|---|---|
| 1 | CORS | Safe (localhost only) | Set `CLIENT_URL` to exact domain; remove localhost patterns |
| 2 | Cookie `Secure` flag | Correct (`false`) | Set `SPRING_COOKIE_SECURE=true` behind HTTPS |
| 3 | X-Internal-Service-Key | REMOVED (PHP sidecar retired) | — |
| 4 | AES APP_KEY | Fallback in git (acceptable for demo) | Set random key before any real data; never change after |
| 5 | HMAC Secret | Fallback in git (acceptable) | Set `AUDIT_LEDGER_HMAC_SECRET` env var in production |
| 6 | PHP loopback binding | REMOVED (PHP sidecar retired) | — |
| 7 | Rate limiting | Functional (in-memory) | Redis-backed rate limiter for production cluster |
| 8 | Seed accounts | Gated by @Profile("dev") | Set `SPRING_PROFILES_ACTIVE=prod` in production |
| 9 | DDL auto=update | REMOVED (Flyway-managed schema) | — |
