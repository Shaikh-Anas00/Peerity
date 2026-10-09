import os
import sys
import json
import uuid
import urllib.request
import urllib.error
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

# -------------------------------------------------------------
# 1. Custom PDF Generator with Running Headers & Footers
# -------------------------------------------------------------
class AcademicNumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#2B7A78"))
        self.drawString(54, 755, "PEERITY ACADEMIC EVALUATION SYSTEM  |  BLINDED SUBMISSION")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawRightString(612 - 54, 755, "DOUBLE-BLIND PEER REVIEW COPY")
        
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 747, 612 - 54, 747)

        self.line(54, 45, 612 - 54, 45)
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(54, 32, "Confidential Peer Review — Identity Protected under Progressive Disclosure Protocol")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(612 - 54, 32, page_text)
        self.restoreState()

def build_academic_pdf(filename, title, category, sub_id, sections, tables_data=None):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=64,
        bottomMargin=54
    )
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=6
    )
    
    category_badge_style = ParagraphStyle(
        'CategoryBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#2B7A78"),
        spaceAfter=4
    )
    
    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#475569"),
        spaceAfter=12
    )
    
    h1_style = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#2B7A78"),
        spaceBefore=12,
        spaceAfter=5,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceAfter=8
    )

    abstract_style = ParagraphStyle(
        'AbstractCustom',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=13.5,
        textColor=colors.HexColor("#1E293B"),
        leftIndent=14,
        rightIndent=14,
        spaceAfter=10
    )

    cell_header_style = ParagraphStyle(
        'CellHeader',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#1E293B"),
        alignment=1
    )
    
    cell_body_style = ParagraphStyle(
        'CellBody',
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#334155")
    )

    story = []
    story.append(Paragraph(f"ACADEMIC TRACK: {category.upper()}", category_badge_style))
    story.append(Paragraph(title, title_style))
    story.append(Paragraph(f"<b>Submission Tracking ID:</b> {sub_id} &nbsp;|&nbsp; <b>Author:</b> <i>[Redacted for Double-Blind Evaluation]</i> &nbsp;|&nbsp; <b>Disclosure Status:</b> Level 0 Anonymous", meta_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E2E8F0"), spaceAfter=10))

    for sec in sections:
        sec_title = sec.get("title", "")
        sec_type = sec.get("type", "body")
        content = sec.get("content", "")

        if sec_type == "abstract":
            story.append(Paragraph("<b>Abstract:</b> " + content, abstract_style))
            story.append(Spacer(1, 4))
        elif sec_type == "h1":
            story.append(Paragraph(sec_title, h1_style))
            if content:
                story.append(Paragraph(content, body_style))
        elif sec_type == "body":
            story.append(Paragraph(content, body_style))
        elif sec_type == "table" and tables_data and sec_title in tables_data:
            t_info = tables_data[sec_title]
            t_rows = []
            t_rows.append([Paragraph(f"<b>{h}</b>", cell_header_style) for h in t_info["headers"]])
            for row in t_info["rows"]:
                t_rows.append([Paragraph(str(c), cell_body_style) for c in row])
            
            t = Table(t_rows, colWidths=t_info.get("colWidths", None))
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#DEF2F1")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ]))
            story.append(Spacer(1, 4))
            story.append(t)
            story.append(Spacer(1, 6))

    doc.build(story, canvasmaker=AcademicNumberedCanvas)
    return filename

# -------------------------------------------------------------
# 2. Encrypt File using PHP Sidecar
# -------------------------------------------------------------
def encrypt_via_php(file_path):
    url = "http://127.0.0.1:8000/encrypt"
    boundary = "----WebKitFormBoundary" + uuid.uuid4().hex
    
    with open(file_path, "rb") as f:
        file_bytes = f.read()

    filename = os.path.basename(file_path)
    
    body = []
    body.append(f"--{boundary}".encode())
    body.append(f'Content-Disposition: form-data; name="file"; filename="{filename}"'.encode())
    body.append(b"Content-Type: application/pdf")
    body.append(b"")
    body.append(file_bytes)
    body.append(f"--{boundary}--".encode())
    body.append(b"")
    payload = b"\r\n".join(body)

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "X-Internal-Service-Key": "TrustReview-Internal-Secret-Key-Phase3-Secure",
            "Content-Type": f"multipart/form-data; boundary={boundary}"
        }
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode())
        if res.get("status") == "success":
            return res
        else:
            raise Exception("Encryption failed: " + str(res))

def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))

    # 1. Generate 01_Distributed_Systems_Raft_Consensus.pdf
    pdf1 = os.path.join(out_dir, "01_Distributed_Systems_Raft_Consensus.pdf")
    sections_1 = [
        {"type": "abstract", "content": "Consensus protocols serve as the foundational backbone for resilient state machine replication in distributed datastores. In this paper, we present an empirical fault-injection evaluation of the Raft consensus protocol operating under asymmetric network partitions and packet drop scenarios. We demonstrate how partitioned leader isolation affects log compaction and examine quorum election safety under bounded network delays. Experimental benchmarks across a 7-node cluster show zero data loss with median leader transition latencies below 142 ms."},
        {"type": "h1", "title": "1. Introduction and Problem Formulation", "content": "Modern distributed databases require fault tolerance guarantees under crash-fault assumptions. While Paxos provides theoretical optimality, its operational complexity often leads to flawed implementations. Raft decouples consensus into distinct subproblems: leader election, log replication, and commitment safety."},
        {"type": "h1", "title": "2. System Architecture & Quorum Replication Protocol", "content": "Our experimental cluster comprises 7 replicated state machines executing synchronized log entry compaction. A term counter t monotonically increments upon every election cycle. Commit safety is verified when at least 4 of 7 nodes acknowledge the entry."},
        {"type": "table", "title": "t1"},
        {"type": "h1", "title": "3. Fault-Tolerance & Partition Recovery Evaluation", "content": "During minute 4 of continuous load testing, the primary leader node was isolated within an asymmetric minority partition. Within 138 ms, follower nodes detected heartbeat timeouts and elected a new leader without split-brain divergence."},
        {"type": "h1", "title": "4. Conclusion & Academic Rigor", "content": "The architecture achieves linearizable read guarantees and rapid failover. Raft sustains 11,400 ops/sec throughput under active minority node failures."}
    ]
    t1 = {
        "t1": {
            "headers": ["Cluster Size", "Consensus Protocol", "Avg Latency", "Peak QPS", "Failover Latency", "Safety Proof"],
            "rows": [
                ["3 Nodes", "Raft (Standard)", "4.2 ms", "14,800 ops/s", "118 ms", "Verified"],
                ["5 Nodes", "Raft (Optimized)", "5.8 ms", "13,200 ops/s", "135 ms", "Verified"],
                ["7 Nodes", "Raft (Partitioned)", "7.4 ms", "11,400 ops/s", "142 ms", "Verified"],
                ["7 Nodes", "Multi-Paxos", "6.9 ms", "11,800 ops/s", "190 ms", "Verified"]
            ],
            "colWidths": [60, 110, 80, 80, 95, 75]
        }
    }
    build_academic_pdf(pdf1, "Analysis of Raft Consensus Protocol Under Asymmetric Network Partitions", "Distributed Systems & Cloud Architecture", "SUB-8F42A1", sections_1, t1)

    # 2. Generate 02_Web_Security_Cryptographic_Audit.pdf
    pdf2 = os.path.join(out_dir, "02_Web_Security_Cryptographic_Audit.pdf")
    sections_2 = [
        {"type": "abstract", "content": "Cryptographic audit ledgers require strict authenticity, confidentiality, and tamper-evident guarantees. This audit report investigates an enterprise peer assessment platform utilizing authenticated encryption (AES-256-GCM) alongside an append-only HMAC-SHA-256 cryptographic chain. We conduct threat modeling against STRIDE vectors, inspect nonce uniqueness guarantees under horizontal scaling, and verify sidecar isolation against cross-service privilege escalation."},
        {"type": "h1", "title": "1. Threat Modeling & Attack Surface Formulation", "content": "Academic peer grading environments are susceptible to grading collusion, selective disclosure extortion, and identity deanonymization. We evaluated the attack surface under the STRIDE methodology across six vectors."},
        {"type": "h1", "title": "2. Authenticated Encryption at Rest (AES-256-GCM)", "content": "All student submissions undergo authenticated encryption prior to filesystem persistence. A dedicated PHP 8.2+ cryptographic sidecar generates cryptographically secure 96-bit initialization vectors (IV) via random_bytes(12). The ciphertext is authenticated using a 128-bit authentication tag."},
        {"type": "table", "title": "t2"},
        {"type": "h1", "title": "3. Tamper-Evident HMAC Audit Chain Verification", "content": "Every audit ledger transaction includes the previous event's cryptographic hash, forming an append-only hash chain: H_i = HMAC_SHA256(SecretKey, H_{i-1} || Action || Role || TargetId || Timestamp). Tampering with any historical block is detected immediately."},
        {"type": "h1", "title": "4. Remediation Strategy", "content": "We recommend rotating master keys periodically and storing HMAC roots in hardware security modules."}
    ]
    t2 = {
        "t2": {
            "headers": ["Vulnerability Domain", "Cipher Suite / Control", "STRIDE Vector", "CVSS v3.1", "Status", "Residual Risk"],
            "rows": [
                ["Storage at Rest", "AES-256-GCM (128-bit Tag)", "Info Disclosure", "7.5 (High)", "Remediated", "Negligible"],
                ["Audit Log Integrity", "HMAC-SHA-256 Chaining", "Tampering", "8.2 (High)", "Remediated", "Negligible"],
                ["Reviewer Anonymity", "Pseudonym Hashing", "Info Disclosure", "6.8 (Medium)", "Remediated", "Low"],
                ["Identity Unmasking", "Quorum Voting Threshold", "Elevation Priv", "8.9 (High)", "Enforced", "Zero"]
            ],
            "colWidths": [100, 115, 80, 65, 75, 65]
        }
    }
    build_academic_pdf(pdf2, "End-to-End Cryptographic Audit: Authenticated AES-256-GCM & HMAC-SHA-256", "Cybersecurity & Cryptographic Systems", "SUB-3B90E4", sections_2, t2)

    # 3. Generate 05_FullStack_Web_Technologies_Architecture.pdf
    pdf3 = os.path.join(out_dir, "05_FullStack_Web_Technologies_Architecture.pdf")
    sections_3 = [
        {"type": "abstract", "content": "Modern enterprise web applications require robust decoupled architectures balancing client-side interactivity, server-side data integrity, and strict authentication. In this laboratory report, we present the end-to-end design and implementation of a scalable RESTful API backed by Spring Boot 3, Hibernate JPA, and MySQL, integrated with a React Single-Page Application (SPA). We evaluate token lifecycle management, database indexing strategies, and WCAG AA accessible user interface components."},
        {"type": "h1", "title": "1. Architectural Overview & Separation of Concerns", "content": "The application architecture enforces strict tier separation: Presentation Tier (React + Vite), Business Logic & Security Tier (Spring Boot 3 + Spring Security 6), and Relational Persistence Tier (MySQL 8.0 InnoDB). Inter-service communication relies on stateless JSON over HTTP with standardized ApiResponse envelopes."},
        {"type": "h1", "title": "2. Security Architecture & RBAC Policy Engine", "content": "Every HTTP endpoint is protected with method-level authorization checks (@PreAuthorize). User identities are authenticated via bcrypt/Argon2-hashed credentials, issuing secure HttpOnly session tokens with SameSite=Lax attributes to protect against Cross-Site Request Forgery (CSRF)."},
        {"type": "table", "title": "t3"},
        {"type": "h1", "title": "3. Data Modeling, Transactions & Concurrency", "content": "Database schemas utilize composite indexes on frequently filtered foreign keys (e.g., author_id, assignment_id, reviewer_id). Spring's @Transactional annotations guarantee ACID compliance during multi-step review distributions and quorum ballot counting."},
        {"type": "h1", "title": "4. Conclusion & Performance Benchmarking", "content": "Load testing across 5,000 requests demonstrated sub-35ms p95 latencies and 100% test suite passage across unit and integration tests."}
    ]
    t3 = {
        "t3": {
            "headers": ["API Endpoint", "HTTP Method", "Authorized Roles", "Avg Latency", "Cache Policy", "Status Code"],
            "rows": [
                ["/api/assignments", "GET", "All Authenticated", "14 ms", "no-cache", "200 OK"],
                ["/api/submissions", "POST", "ROLE_STUDENT", "48 ms", "no-store", "201 Created"],
                ["/api/reviews/my", "GET", "ROLE_STUDENT", "19 ms", "no-cache", "200 OK"],
                ["/api/admin/audit", "GET", "ROLE_ADMIN, COMMITTEE", "26 ms", "no-store", "200 OK"]
            ],
            "colWidths": [120, 75, 115, 65, 65, 60]
        }
    }
    build_academic_pdf(pdf3, "Full-Stack Web Engineering: Secure REST API & Responsive Interface Architecture", "Web Technologies & Systems Engineering", "SUB-WT1001", sections_3, t3)

    # 4. Generate 06_Applied_Cryptography_Key_Derivation.pdf
    pdf4 = os.path.join(out_dir, "06_Applied_Cryptography_Key_Derivation.pdf")
    sections_4 = [
        {"type": "abstract", "content": "Password storage and session token derivation demand modern memory-hard cryptographic functions to resist GPU and ASIC-accelerated brute-force attacks. This report provides a comparative security analysis between Argon2id, PBKDF2, and bcrypt within the context of academic credential protection. We further detail the integration of authenticated AES-256-GCM symmetric encryption for student artifact confidentiality and verify constant-time HMAC comparison routines."},
        {"type": "h1", "title": "1. Memory-Hard Key Derivation (Argon2id vs PBKDF2)", "content": "Argon2id combines data-independent and data-dependent memory access patterns, providing superior defense against both cache-timing attacks and hardware-parallelized cracking rigs. We benchmarked Argon2id with memory cost m=65536 KiB, time cost t=3 iterations, and parallelism p=4 threads against legacy PBKDF2 with 310,000 iterations."},
        {"type": "h1", "title": "2. Symmetric Cipher Security (AES-256-GCM)", "content": "For artifact persistence at rest, AES-256 in Galois/Counter Mode (GCM) guarantees both confidentiality and authenticity. Each file is paired with an ephemeral 96-bit initialization vector (IV) generated via a CSPRNG. The 128-bit authentication tag ensures immediate detection of bit-flipping tampering."},
        {"type": "table", "title": "t4"},
        {"type": "h1", "title": "3. Constant-Time HMAC Verification", "content": "To prevent timing side-channel attacks during authentication token and audit ledger verification, string comparisons utilize MessageDigest.isEqual() and hash_equals(), guaranteeing constant execution time regardless of matching prefix length."},
        {"type": "h1", "title": "4. Laboratory Conclusions", "content": "The cryptographic architecture adheres to NIST SP 800-63B standards and guarantees verifiable defense-in-depth across all storage and transport boundaries."}
    ]
    t4 = {
        "t4": {
            "headers": ["Algorithm / Cipher", "Target Function", "Memory Cost", "Iterations", "Crack Cost ($/MH)", "Standard"],
            "rows": [
                ["Argon2id", "Password Hashing", "64 MB", "t = 3", "> $500,000", "RFC 9106 / NIST"],
                ["bcrypt", "Legacy Password", "4 KB", "cost = 12", "> $45,000", "OpenBSD Spec"],
                ["PBKDF2-HMAC", "Key Derivation", "negligible", "310,000", "< $2,500", "NIST SP 800-132"],
                ["AES-256-GCM", "Payload Encryption", "negligible", "Single-pass", "Infeasible", "FIPS 197 / NIST"]
            ],
            "colWidths": [95, 105, 75, 75, 85, 65]
        }
    }
    build_academic_pdf(pdf4, "Applied Cryptography: Memory-Hard Key Derivation & Authenticated Encryption", "Applied Cryptography & Security Engineering", "SUB-CR4002", sections_4, t4)

    print("All 4 academic PDFs generated successfully.")

    # -------------------------------------------------------------
    # Now encrypt all 4 PDFs via PHP sidecar
    # -------------------------------------------------------------
    print("Encrypting PDFs via PHP sidecar at http://127.0.0.1:8000/encrypt...")
    
    enc1 = encrypt_via_php(pdf1)
    enc2 = encrypt_via_php(pdf2)
    enc3 = encrypt_via_php(pdf3)
    enc4 = encrypt_via_php(pdf4)

    print("PDF 1 Encrypted:", enc1["encryptedFileName"], "size:", enc1["fileSize"])
    print("PDF 2 Encrypted:", enc2["encryptedFileName"], "size:", enc2["fileSize"])
    print("PDF 3 Encrypted:", enc3["encryptedFileName"], "size:", enc3["fileSize"])
    print("PDF 4 Encrypted:", enc4["encryptedFileName"], "size:", enc4["fileSize"])

    # Output JSON metadata for SQL script insertion
    manifest = {
        "pdf1": {"file": "01_Distributed_Systems_Raft_Consensus.pdf", **enc1},
        "pdf2": {"file": "02_Web_Security_Cryptographic_Audit.pdf", **enc2},
        "pdf3": {"file": "05_FullStack_Web_Technologies_Architecture.pdf", **enc3},
        "pdf4": {"file": "06_Applied_Cryptography_Key_Derivation.pdf", **enc4},
    }
    manifest_path = os.path.join(out_dir, "enc_manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print("Saved manifest:", manifest_path)

if __name__ == "__main__":
    main()
