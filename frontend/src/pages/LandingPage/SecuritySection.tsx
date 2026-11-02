import React from "react";
import { Lock, Key, Layers, Users } from "lucide-react";
import { C } from "./tokens";

interface TrustCardProps {
  icon: React.ReactNode;
  title: string;
  body: string;
}

const TrustCard: React.FC<TrustCardProps> = ({ icon, title, body }) => (
  <div
    className="rounded-2xl border p-6 flex gap-4"
    style={{ backgroundColor: C.nearWhite, borderColor: C.lightTint }}
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
      style={{ backgroundColor: C.lightTint }}
    >
      <span style={{ color: C.darkTeal }}>{icon}</span>
    </div>
    <div>
      <h3 className="text-sm font-semibold font-display mb-1.5" style={{ color: C.darkText }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: C.bodyText }}>
        {body}
      </p>
    </div>
  </div>
);

export const SecuritySection: React.FC = () => (
  <section
    id="security"
    aria-labelledby="security-heading"
    className="py-24 border-t"
    style={{ backgroundColor: C.lightTint, borderColor: C.midTeal + "30" }}
  >
    <div className="max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Left: copy */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.midTeal }}>
            Trust architecture
          </p>
          <h2 id="security-heading" className="text-3xl md:text-4xl font-bold font-display mb-5" style={{ color: C.darkText }}>
            Security that is<br />
            <span style={{ color: C.darkTeal }}>auditable, not assumed.</span>
          </h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: C.bodyText }}>
            Every action in Peerity — submission, review, vote, disclosure — is recorded in an
            append-only cryptographic ledger. The hash chain is mathematically verifiable
            on demand by authorized committee members and administrators.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: C.mutedText }}>
            Reviewer identities are pseudonymised by default. Progressive disclosure
            strictly requires a verified quorum vote under policy constraints — there is no
            unilateral bypass mechanism, even for system administrators.
          </p>

          {/* Hash chain verification mockup — explicitly illustrative */}
          <div
            className="mt-8 rounded-xl border overflow-hidden font-mono text-xs"
            style={{ backgroundColor: C.nearWhite, borderColor: C.lightTint }}
          >
            {/* Window header bar */}
            <div
              className="px-4 py-2.5 border-b flex items-center justify-between text-[11px]"
              style={{ backgroundColor: C.lightTint + "55", borderColor: C.lightTint }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.midTeal }} />
                <span className="font-semibold" style={{ color: C.darkText }}>
                  Audit Ledger Verification
                </span>
              </div>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase"
                style={{ backgroundColor: C.lightTint, color: C.darkTeal }}
              >
                Sample Schema · Gated API
              </span>
            </div>

            {/* Static illustrative JSON response matching IntegrityVerificationResult DTO */}
            <div className="p-4 leading-6" style={{ color: C.mutedText }}>
              <div className="text-[11px] mb-2" style={{ color: C.midTeal }}>
                // Illustrative response structure (GET /api/audit/verify)
              </div>
              <span style={{ color: "#64748b" }}>{"{"}</span><br />
              &nbsp;&nbsp;<span style={{ color: C.darkTeal }}>"isValid"</span>: <span style={{ color: "#059669" }}>true</span>,<br />
              &nbsp;&nbsp;<span style={{ color: C.darkTeal }}>"totalRecords"</span>: <span style={{ color: "#0ea5e9" }}>1842</span>,<br />
              &nbsp;&nbsp;<span style={{ color: C.darkTeal }}>"brokenSequenceAt"</span>: <span style={{ color: "#64748b" }}>null</span>,<br />
              &nbsp;&nbsp;<span style={{ color: C.darkTeal }}>"verifiedAt"</span>: <span style={{ color: "#d97706" }}>"2026-10-01T12:00:00Z"</span>,<br />
              &nbsp;&nbsp;<span style={{ color: C.darkTeal }}>"message"</span>: <span style={{ color: "#059669" }}>"Cryptographic hash chain is intact from genesis."</span><br />
              <span style={{ color: "#64748b" }}>{"}"}</span>
            </div>

            {/* Footnote clarification */}
            <div
              className="px-4 py-2 border-t text-[11px] leading-relaxed"
              style={{ backgroundColor: C.nearWhite, borderColor: C.lightTint, color: C.mutedText }}
            >
              Illustrative schema preview. Verification endpoints require active COMMITTEE or ADMIN authentication and are not publicly exposed.
            </div>
          </div>
        </div>

        {/* Right: trust cards */}
        <div className="flex flex-col gap-4">
          <TrustCard
            icon={<Lock className="w-5 h-5" strokeWidth={1.75} />}
            title="AES-256-GCM file encryption"
            body="Student submissions are encrypted at rest using AES-256-GCM before filesystem persistence. Files remain encrypted on disk and require authorized user authentication for streaming retrieval."
          />
          <TrustCard
            icon={<Key className="w-5 h-5" strokeWidth={1.75} />}
            title="HMAC-SHA-256 audit ledger"
            body="Critical lifecycle events (submission, review, vote, disclosure) append to a keyed HMAC-SHA-256 hash chain. Any out-of-band record tampering invalidates downstream sequence hashes, making alterations detectable upon verification."
          />
          <TrustCard
            icon={<Layers className="w-5 h-5" strokeWidth={1.75} />}
            title="Multi-party disclosure approval"
            body="Revealing reviewer identity requires a threshold quorum vote from independent committee members. Administrators serve as operational custodians without voting authority and cannot unilaterally force disclosure."
          />
          <TrustCard
            icon={<Users className="w-5 h-5" strokeWidth={1.75} />}
            title="Mandatory recusal enforcement"
            body="The quorum service actively validates voter identity against both the appellant and the appealed reviewer, enforcing conflict-of-interest recusal at the transactional service layer."
          />
        </div>
      </div>
    </div>
  </section>
);
