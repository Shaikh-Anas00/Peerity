# TrustReview — Quorum & Disclosure-Tier State Machine (Model A)

> **Status: PINNED — This document is the single source of truth for the quorum/disclosure vote engine.**
> Do NOT modify the vote logic in `QuorumService.java` without updating this document first.

---

## 1. Core Principle (Model A)

TrustReview uses a **binary-gate, policy-capped disclosure model**:

1. At appeal creation time, the **Policy Engine pre-calculates a maximum disclosure tier** based solely on the nature of the grievance (`AppealReason`).
2. The **2-of-3 committee quorum vote** acts as a single binary gate: *"Do we authorize disclosure up to the policy-calculated tier?"*
3. The vote is **go/no-go** — the committee cannot negotiate a lower tier and there is no tier-advance-per-vote mechanic.

---

## 2. Disclosure Tier Mapping (Policy Engine)

| Appeal Reason | Pre-Calculated Max Tier | What Is Disclosed |
|---|---|---|
| `HARASSMENT_OR_ABUSE` | `LEVEL_4_FULL_IDENTITY` | Full name, institutional email, department |
| `FACTUAL_FABRICATION` | `LEVEL_3_ACADEMIC_STANDING` | Academic standing, prior integrity record |
| `UNFAIR_GRADING_OUTLIER` | `LEVEL_2_INSTITUTION_DEPT` | Institution and department only |
| `PROCEDURAL_ERROR` | `LEVEL_1_ELIGIBILITY` | Eligibility status only (no personal identifiers) |

> The `policyCalculatedTier` is written to the `DisclosureRequest` row **at appeal creation time** and is immutable.
> Neither the appellant nor any committee member can change it during the vote.

---

## 3. Actors & Constraints

| Actor | Can Vote? | Notes |
|---|---|---|
| `COMMITTEE` | YES | Sole voting authority |
| `ADMIN` | NO | Operational custodian only; can **read** votes, cannot **cast** votes |
| `INSTRUCTOR` | NO | Can read pending appeals; cannot vote |
| `STUDENT` | NO | — |

### Recusal Rules (enforced server-side in `QuorumService.castVote()`)
- A committee member **who is the appellant** in the dispute is automatically recused (throws 403).
- A committee member **who is the peer reviewer being appealed** is automatically recused (throws 403).

---

## 4. State Machine

### DisclosureRequest Status Flow

```
[Appeal Created]
      |
      v
PENDING_APPROVAL   <- All voting happens here
      |
      +--- approveCount >= 2 ---> APPROVED  ->  appeal: RESOLVED_UPHELD
      |
      +--- rejectCount >= 2  ---> REJECTED  ->  appeal: RESOLVED_DISMISSED
```

### When Does REJECTED Fire?

REJECTED fires the instant rejectCount >= threshold (2), regardless of remaining uncast votes.

Example (3-member panel, threshold=2):
- Vote 1: REJECT -> still PENDING (1 reject, need 2)
- Vote 2: REJECT -> REJECTED immediately
- Vote 3: blocked — throws IllegalStateException ("Voting is closed")

---

## 5. Quorum Parameters

| Parameter | Value | Where Set |
|---|---|---|
| `TOTAL_COMMITTEE_SIZE` | 3 | Constant in `QuorumService.java` |
| `thresholdRequired` | 2 | Set on `DisclosureRequest` at creation |
| Vote options | `APPROVE` / `REJECT` | `VoteDecision` enum |

---

## 6. Exact Vote Processing Sequence

```
1. @PreAuthorize("hasRole('COMMITTEE')")         -- Spring Security layer
2. voter.getRole() != COMMITTEE -> SecurityException  -- Runtime double-check
3. Appellant recusal check                       -- SecurityException if violated
4. Reviewer recusal check                        -- SecurityException if violated
5. DisclosureRequest must be PENDING_APPROVAL    -- IllegalStateException otherwise
6. Duplicate vote guard (DB + race condition)    -- IllegalStateException if dup
7. Persist DisclosureApproval row
8. Audit ledger: QUORUM_VOTE_CAST
9. Re-fetch fresh approveCount + rejectCount
10. IF approveCount >= threshold:
       dr.status = APPROVED
       appeal.status = RESOLVED_UPHELD
       Audit: IDENTITY_DISCLOSED
11. ELSE IF rejectCount >= threshold:
       dr.status = REJECTED
       appeal.status = RESOLVED_DISMISSED
       Audit: DISPUTE_REJECTED
12. ELSE: still PENDING — waiting for more votes
13. Return QuorumStatusDto
```

---

## 7. Thread Safety

- `castVote()` is `@Transactional` (DB-level isolation).
- `DisclosureApproval` has a composite unique constraint `(disclosure_request_id, committee_member_id)` at DB level.
- Race-condition duplicate-vote attempts are caught via `DataIntegrityViolationException`.

---

## 8. What This System Is NOT

- **NOT zero-knowledge**: Identities are stored server-side in encrypted form.
  Correct terminology: **server-side authenticated encryption at rest** (AES-256-GCM).
  "Zero-knowledge" would require the server to never hold the plaintext, which it does during submission processing.
- **NOT tier-advance-per-vote**: Each APPROVE vote does not unlock an additional tier.
  The vote is binary (go/no-go on the pre-calculated policy tier).
- **NOT reversible**: Once APPROVED or REJECTED, the status is final.

---

## 9. Future Work (Out of Scope)

- Dynamic `TOTAL_COMMITTEE_SIZE` read from DB
- Re-vote window with cooling-off period
- Appeal-of-appeal escalation path
- Quorum expansion for highest-tier disclosures (e.g., 5-of-7 for LEVEL_4)
- Collaborative Team Evaluations (group submissions)
