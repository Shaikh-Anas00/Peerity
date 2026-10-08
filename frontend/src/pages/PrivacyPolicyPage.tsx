import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, FileText, ArrowLeft, CheckCircle, Scale, Database } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-body text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Return to home"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-semibold font-display">Back</span>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-peerity-800 rounded-lg flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 text-sm font-display tracking-tight">Peerity Privacy & Cryptography Policy</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Link
              to="/login"
              className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-semibold transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-3.5 py-1.5 bg-peerity-800 hover:bg-peerity-600 text-white rounded-lg font-semibold transition font-display shadow-xs"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Banner Hero */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-peerity-100 text-peerity-900 rounded-full text-xs font-bold font-display uppercase tracking-wider mb-4 border border-peerity-200">
            <ShieldCheck className="w-3.5 h-3.5 text-peerity-800" />
            Zero Boilerplate Privacy Policy
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 font-display tracking-tight">
            How Peerity Protects Your Data & Identity
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed max-w-3xl">
            Unlike commercial platforms that employ vague legal disclaimers, this document describes the <strong>concrete cryptographic and policy mechanisms</strong> implemented in the Peerity codebase. Every protection listed below is enforced by running software, cryptographic microservices, and immutable audit logs.
          </p>
        </div>

        {/* 1. Data Minimization Guarantee */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">1. Radical Data Minimization (COPPA & GDPR Aligned)</h2>
              <p className="text-xs text-slate-500">We do not collect data that we do not strictly need</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Peerity collects only the minimal data required to administer academic peer evaluations:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 font-display mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> What We Collect
              </h3>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                <li><strong>Full Legal Name</strong> (for course enrollment and verified grading rosters)</li>
                <li><strong>Institution & Department</strong> (to route assignments to appropriate disciplines)</li>
                <li><strong>Institutional Email</strong> (for secure login and session management)</li>
                <li><strong>Academic Standing / Year</strong> (optional; disclosed only under Level 3 quorum approval)</li>
                <li><strong>Submissions & Peer Feedback</strong> (encrypted coursework artifacts)</li>
              </ul>
            </div>
            <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900 font-display mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-600" /> What We NEVER Collect
              </h3>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                <li><strong>No Dates of Birth or Ages</strong> (eliminating COPPA age-stratification risk)</li>
                <li><strong>No Gender, Race, or Demographic Classifiers</strong> (mitigating bias)</li>
                <li><strong>No Phone Numbers or Home/Mailing Addresses</strong></li>
                <li><strong>No Social Media Links or Third-Party Ad Trackers</strong></li>
                <li><strong>No Biometric Identifiers or Location Tracking</strong></li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. Double-Blind Pseudonymity */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">2. Double-Blind Peer Pseudonymity</h2>
              <p className="text-xs text-slate-500">Unbiased evaluation through deterministic identity separation</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            During active evaluation periods, peer reviewers and submission authors cannot view each other's real identities:
          </p>
          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">1</span>
              <div>
                <strong>Author Pseudonymity:</strong> Reviewers grade submissions without seeing author names, email addresses, student IDs, or IP addresses.
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">2</span>
              <div>
                <strong>Reviewer Pseudonymity:</strong> Authors view peer feedback attributed only to deterministic aliases (e.g. <em>Reviewer #1</em>, <em>Reviewer #2</em>). Instructors cannot deanonymize reviewers on a whim.
              </div>
            </div>
          </div>
        </section>

        {/* 3. End-to-End Encryption & Cryptographic Integrity */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-peerity-100 text-peerity-800 flex items-center justify-center border border-peerity-200">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">3. AES-256-GCM Encryption & SHA-256 Hashing</h2>
              <p className="text-xs text-slate-500">Cryptographic protection at rest and in transit</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every submission uploaded by a student is intercepted before filesystem storage:
          </p>
          <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside">
            <li>
              <strong>Isolated PHP 8.2+ Crypto Sidecar:</strong> Submissions are streamed to an isolated encryption microservice running AES-256-GCM with unique cryptographic initialization vectors (IVs).
            </li>
            <li>
              <strong>Zero Plaintext Storage:</strong> Artifacts stored on disk carry <code>.enc</code> payloads and are unreadable without the managed cryptographic keys.
            </li>
            <li>
              <strong>SHA-256 Digital Fingerprinting:</strong> Every uploaded document is fingerprinted with a SHA-256 digest. Reviewers verify file integrity against this checksum upon decrypting.
            </li>
          </ul>
        </section>

        {/* 4. Progressive Disclosure Tiers & Quorum Adjudication */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">4. Progressive Disclosure & Quorum Adjudication</h2>
              <p className="text-xs text-slate-500">No single administrator can unilaterally reveal student identities</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Deanonymization is strictly governed by an <strong>N-of-M Quorum Voting Engine</strong>. When a student files a legitimate dispute (e.g. suspected malicious review or plagiarism):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {[
              { level: 'Tier 0', title: 'Anonymous', desc: 'Pseudonyms only. No identity data disclosed.' },
              { level: 'Tier 1', title: 'Eligibility', desc: 'Active course enrollment status verified.' },
              { level: 'Tier 2', title: 'Institution & Dept', desc: 'Reveals home department & university.' },
              { level: 'Tier 3', title: 'Academic Standing', desc: 'Reveals year / standing and reliability score.' },
              { level: 'Tier 4', title: 'Full Identity', desc: 'Full legal name and email (highest threshold).' },
            ].map(t => (
              <div key={t.level} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-peerity-800 uppercase tracking-widest font-display">{t.level}</span>
                  <h4 className="text-xs font-bold text-slate-900 mt-0.5">{t.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-2.5">
            <Scale className="w-4 h-4 text-purple-700 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Quorum Threshold Requirement:</strong> Unlocking higher tiers requires independent approval from <strong>at least 2 out of 3 Review Committee members</strong>. Neither course instructors nor system administrators possess backdoor disclosure privileges.
            </div>
          </div>
        </section>

        {/* 5. Immutable HMAC-SHA-256 Audit Ledger */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">5. Tamper-Evident HMAC-SHA-256 Audit Ledger</h2>
              <p className="text-xs text-slate-500">Mathematical proof of non-repudiation and integrity</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every critical action across the platform—submission uploads, review ratings, dispute filings, committee votes, and identity disclosure events—is logged to an append-only cryptographic ledger.
          </p>
          <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside">
            <li>
              <strong>Hash Chaining:</strong> Each ledger record contains an HMAC-SHA-256 signature calculated over its payload and the preceding entry's hash.
            </li>
            <li>
              <strong>Instant Tamper Detection:</strong> If a rogue database admin modifies an existing grade or dispute record, the cryptographic sequence breaks instantly and is flagged by the verification engine.
            </li>
          </ul>
        </section>

        {/* 6. Account Data Export & Deletion */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900 font-display">6. Your Rights: Data Export & Deletion Requests</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Under academic governance policies, student submissions form part of official institutional course records. However, in compliance with GDPR Art. 15–17 and data protection principles, users may file formal requests directly from their <strong>Settings</strong> page:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-1 font-display">Data Export</h4>
              <p className="text-slate-500 leading-relaxed">
                Receive an aggregated JSON archive of your personal profile, submitted reviews, assigned ratings, and dispute adjudication transcripts.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-1 font-display">Account Deletion & Anonymization</h4>
              <p className="text-slate-500 leading-relaxed">
                Files a formal administrative request. Upon term completion, identifying metadata is purged while historical anonymous scoring calibration benchmarks remain cryptographically decoupled.
              </p>
            </div>
          </div>
        </section>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 pt-4 pb-8 space-y-2">
          <p>Peerity Trust & Safety Engine &bull; Academic Year 2026</p>
          <p>
            Have questions about institutional compliance? Contact your course instructor or the designated campus Review Committee.
          </p>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;
