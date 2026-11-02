import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Adds running headers and footers with page numbers."""
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
        # Running header
        self.drawString(54, 755, "PEERITY ACADEMIC EVALUATION SYSTEM  |  BLINDED SUBMISSION")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawRightString(612 - 54, 755, "DOUBLE-BLIND PEER REVIEW COPY")
        
        # Header separator
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 747, 612 - 54, 747)

        # Footer separator
        self.line(54, 45, 612 - 54, 45)
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(54, 32, "Confidential Peer Review — Identity Protected under Progressive Disclosure Protocol")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(612 - 54, 32, page_text)
        self.restoreState()

def build_pdf(filename, title, category, sub_id, sections, tables_data=None):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=64,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
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
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#475569"),
        spaceAfter=14
    )
    
    h1_style = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#2B7A78"),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14.5,
        textColor=colors.HexColor("#334155"),
        spaceAfter=8
    )

    abstract_style = ParagraphStyle(
        'AbstractCustom',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=14,
        textColor=colors.HexColor("#1E293B"),
        leftIndent=16,
        rightIndent=16,
        spaceAfter=12
    )

    cell_header_style = ParagraphStyle(
        'CellHeader',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1E293B"),
        alignment=1
    )
    
    cell_body_style = ParagraphStyle(
        'CellBody',
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#334155")
    )

    story = []
    
    # Category badge & Title
    story.append(Paragraph(f"ACADEMIC TRACK: {category.upper()}", category_badge_style))
    story.append(Paragraph(title, title_style))
    story.append(Paragraph(f"<b>Submission Tracking ID:</b> {sub_id} &nbsp;|&nbsp; <b>Author:</b> <i>[Redacted for Double-Blind Evaluation]</i> &nbsp;|&nbsp; <b>Disclosure Status:</b> Level 0 Anonymous", meta_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E2E8F0"), spaceAfter=12))

    for sec in sections:
        sec_title = sec.get("title", "")
        sec_type = sec.get("type", "body")
        content = sec.get("content", "")

        if sec_type == "abstract":
            story.append(Paragraph("<b>Abstract:</b> " + content, abstract_style))
            story.append(Spacer(1, 6))
        elif sec_type == "h1":
            story.append(Paragraph(sec_title, h1_style))
            if content:
                story.append(Paragraph(content, body_style))
        elif sec_type == "body":
            story.append(Paragraph(content, body_style))
        elif sec_type == "table" and tables_data and sec_title in tables_data:
            t_info = tables_data[sec_title]
            t_rows = []
            # Header row
            t_rows.append([Paragraph(f"<b>{h}</b>", cell_header_style) for h in t_info["headers"]])
            # Data rows
            for row in t_info["rows"]:
                t_rows.append([Paragraph(str(c), cell_body_style) for c in row])
            
            t = Table(t_rows, colWidths=t_info.get("colWidths", None))
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#DEF2F1")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ]))
            story.append(Spacer(1, 4))
            story.append(t)
            story.append(Spacer(1, 8))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated: {filename}")

def main():
    output_dir = os.path.dirname(os.path.abspath(__file__))

    # -------------------------------------------------------------
    # 1. Distributed Systems / Cloud Architecture
    # -------------------------------------------------------------
    pdf1 = os.path.join(output_dir, "01_Distributed_Systems_Raft_Consensus.pdf")
    sections_1 = [
        {
            "type": "abstract",
            "content": "Consensus protocols serve as the foundational backbone for resilient state machine replication in distributed datastores. In this paper, we present an empirical fault-injection evaluation of the Raft consensus protocol operating under asymmetric network partitions and packet drop scenarios. We demonstrate how partitioned leader isolation affects log compaction and examine quorum election safety under bounded network delays. Experimental benchmarks across a 7-node cluster show zero data loss with median leader transition latencies below 142 ms."
        },
        {
            "type": "h1",
            "title": "1. Introduction and Problem Formulation",
            "content": "Modern distributed databases require fault tolerance guarantees under Byzantine and crash-fault assumptions. While Paxos provides theoretical optimality, its operational complexity often leads to flawed implementations. Raft addresses this by decoupling consensus into distinct subproblems: leader election, log replication, and commitment safety. However, asymmetric partitions—where leader node L can transmit heartbeat messages to node A but cannot receive acknowledgments from node B—introduce split-brain vulnerabilities unless strict quorum counting is enforced."
        },
        {
            "type": "h1",
            "title": "2. System Architecture & Quorum Replication Protocol",
            "content": "Our experimental cluster comprises 7 replicated state machines executing synchronized log entry compaction. A term counter t monotonically increments upon every election cycle. Each candidate node requests votes via asynchronous RPCs. Commit safety is defined as follows: an entry at index i is officially committed once acknowledged by at least \\lfloor N/2 \\rfloor + 1 nodes. To evaluate liveness, we implemented a Chaos Mesh proxy injecting artificial 300 ms cross-rack latencies and 20% packet drops."
        },
        {
            "type": "table",
            "title": "benchmark_1"
        },
        {
            "type": "h1",
            "title": "3. Fault-Tolerance & Partition Recovery Evaluation",
            "content": "During minute 4 of continuous 12,000 req/sec load testing, the primary leader node was isolated within an asymmetric minority partition. Within 138 ms, follower nodes detected heartbeat timeouts (randomized interval: 150-300 ms) and transitioned to candidate states. Node 3 collected 4 of 7 votes and ascended to term t+1. Once the network partition healed, the stale leader acknowledged the higher term and truncated uncommitted log suffixes without divergence."
        },
        {
            "type": "h1",
            "title": "4. Conclusion & Rubric Self-Assessment",
            "content": "The architecture achieves full leader safety and linearizable read guarantees. Compared to Multi-Paxos, Raft reduces diagnostic complexity while sustaining 11,400 ops/sec throughput under active minority node failures. Future extensions will examine pipelined log compaction across geographically distributed regions."
        }
    ]
    tables_1 = {
        "benchmark_1": {
            "headers": ["Cluster Size", "Consensus Protocol", "Avg Latency (ms)", "Peak QPS", "Recovery Time (ms)", "Safety Proof"],
            "rows": [
                ["3 Nodes", "Raft (Standard)", "4.2 ms", "14,800", "118 ms", "Verified"],
                ["5 Nodes", "Raft (Optimized)", "5.8 ms", "13,200", "135 ms", "Verified"],
                ["7 Nodes", "Raft (Asymmetric Net)", "7.4 ms", "11,400", "142 ms", "Verified"],
                ["7 Nodes", "Multi-Paxos", "6.9 ms", "11,800", "190 ms", "Verified"]
            ],
            "colWidths": [60, 110, 85, 65, 95, 85]
        }
    }
    build_pdf(pdf1, "Analysis of Raft Consensus Protocol Under Asymmetric Network Partitions", "Distributed Systems & Cloud Architecture", "SUB-8F42A1", sections_1, tables_1)

    # -------------------------------------------------------------
    # 2. Cybersecurity & Cryptographic Audit
    # -------------------------------------------------------------
    pdf2 = os.path.join(output_dir, "02_Web_Security_Cryptographic_Audit.pdf")
    sections_2 = [
        {
            "type": "abstract",
            "content": "Cryptographic audit ledgers require strict authenticity, confidentiality, and tamper-evident guarantees. This audit report investigates an enterprise peer assessment platform utilizing authenticated encryption (AES-256-GCM) alongside an append-only HMAC-SHA-256 cryptographic chain. We conduct threat modeling against STRIDE vectors, inspect nonce uniqueness guarantees under horizontal scaling, and verify sidecar isolation against cross-service privilege escalation. Verification confirms total resistance to data tampering and zero replay exposure."
        },
        {
            "type": "h1",
            "title": "1. Threat Modeling & Attack Surface Formulation",
            "content": "Academic peer grading environments are susceptible to grading collusion, selective disclosure extortion, and identity deanonymization. We evaluated the attack surface under the STRIDE methodology: (1) Spoofing: Reviewer impersonation; (2) Tampering: Modification of rubric scores in the relational store; (3) Repudiation: Denying submitted feedback; (4) Information Disclosure: Unauthorized deanonymization of blinded authors; (5) Denial of Service; and (6) Elevation of Privilege via committee quorum bypasses."
        },
        {
            "type": "h1",
            "title": "2. Authenticated Encryption at Rest (AES-256-GCM)",
            "content": "All student submissions undergo authenticated encryption prior to filesystem persistence. A dedicated PHP 8.2+ cryptographic sidecar generates cryptographically secure 96-bit initialization vectors (IV) via random_bytes(12). The ciphertext is authenticated using a 128-bit authentication tag. Plaintext files are never written to disk unencrypted, mitigating physical storage breach risks."
        },
        {
            "type": "table",
            "title": "audit_table"
        },
        {
            "type": "h1",
            "title": "3. Tamper-Evident HMAC Audit Chain Verification",
            "content": "Every audit ledger transaction includes the previous event's cryptographic hash, forming an append-only hash chain: H_i = HMAC_SHA256(SecretKey, H_{i-1} || Action || Role || TargetId || Timestamp). If any malicious administrator attempts to modify a rubric score directly in MySQL, the hash chain validation immediately flags the integrity breach and identifies the exact compromised block index."
        },
        {
            "type": "h1",
            "title": "4. Remediation Plan & Recommendations",
            "content": "Recommended mitigations include introducing hardware security modules (HSM / Cloud KMS) for sidecar master key storage, enforcing key rotation intervals every 90 days, and integrating rate-limiting on quorum vote ballot submission endpoints."
        }
    ]
    tables_2 = {
        "audit_table": {
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
    build_pdf(pdf2, "End-to-End Cryptographic Audit: Authenticated AES-256-GCM and HMAC-SHA-256 Ledger Verification", "Cybersecurity & Cryptographic Systems", "SUB-3B90E4", sections_2, tables_2)

    # -------------------------------------------------------------
    # 3. Machine Learning & Differential Privacy
    # -------------------------------------------------------------
    pdf3 = os.path.join(output_dir, "03_Machine_Learning_Differential_Privacy.pdf")
    sections_3 = [
        {
            "type": "abstract",
            "content": "Federated learning enables collaborative model training across decentralized edge devices while preserving raw data locality. However, model gradient inversion attacks can reconstruct training samples unless formal privacy safeguards are applied. This study provides an empirical benchmark of (epsilon, delta)-Differential Privacy applied to client gradient updates using the Moments Accountant technique. Across 100 federated communication rounds on non-IID partitions, our model sustained 89.4% classification accuracy while guaranteeing a privacy budget of epsilon = 2.4."
        },
        {
            "type": "h1",
            "title": "1. Introduction and Privacy Guarantees",
            "content": "In decentralized academic learning platforms, participant telemetry contains sensitive student behavioral data. Standard federated averaging (FedAvg) aggregates client weight updates w_i but remains susceptible to Deep Leakage from Gradients (DLG). To counter this, Differential Privacy injects calibrated Gaussian noise into clipped client gradients, mathematically bounding the influence of any individual student's evaluation history."
        },
        {
            "type": "h1",
            "title": "2. Methodology: DP-SGD with Moments Accountant",
            "content": "Each client clips local gradient norms to threshold C = 1.0. During server aggregation, noise scale sigma = 1.12 is added. We track accumulated privacy loss using the Moments Accountant method, providing tighter privacy bounds than the standard strong composition theorem. The mathematical formulation satisfies Pr[M(D) in S] <= exp(epsilon) * Pr[M(D') in S] + delta for all neighboring datasets D, D'."
        },
        {
            "type": "table",
            "title": "ml_table"
        },
        {
            "type": "h1",
            "title": "3. Empirical Results: Privacy Budget vs Accuracy Trade-off",
            "content": "As shown in Table 1, increasing noise scale sigma from 0.5 to 1.5 strictly reduces privacy budget epsilon from 7.8 to 1.6 while maintaining test accuracy within 4.2% of non-private baselines. Membership inference vulnerability was reduced from 64.2% (unprotected) to 51.1% (effectively random guess baseline)."
        },
        {
            "type": "h1",
            "title": "4. Conclusion and Practical Deployment",
            "content": "Federated Differential Privacy achieves an optimal balance between predictive utility and mathematical anonymity. The resulting pipeline guarantees zero leakage of student feedback patterns during platform calibration tuning."
        }
    ]
    tables_3 = {
        "ml_table": {
            "headers": ["Experiment", "Noise Scale (sigma)", "Clip Norm (C)", "Privacy Budget (eps)", "Test Accuracy (%)", "Leakage Resistance"],
            "rows": [
                ["Baseline (No DP)", "0.00", "None", "Infinity", "93.6%", "Vulnerable (64.2%)"],
                ["Low Protection", "0.50", "1.5", "eps = 7.8", "91.8%", "Moderate (57.1%)"],
                ["Balanced Privacy", "1.12", "1.0", "eps = 2.4", "89.4%", "Robust (52.0%)"],
                ["High Privacy", "1.50", "0.8", "eps = 1.6", "86.1%", "Optimal (51.1%)"]
            ],
            "colWidths": [90, 85, 70, 95, 80, 80]
        }
    }
    build_pdf(pdf3, "Empirical Evaluation of Differential Privacy Guarantees in Federated Learning Systems", "Machine Learning & AI Ethics", "SUB-5C18F9", sections_3, tables_3)

    # -------------------------------------------------------------
    # 4. Software Engineering & Microservices Spec
    # -------------------------------------------------------------
    pdf4 = os.path.join(output_dir, "04_Cloud_Microservices_Architecture_Spec.pdf")
    sections_4 = [
        {
            "type": "abstract",
            "content": "This engineering design specification details an event-driven microservices architecture tailored for high-concurrency educational assessment platforms. By decoupling course submission pipelines from evaluation routing and cryptographic verification sidecars, the system ensures 99.95% uptime and sub-80ms API response times during submission deadlines. We present domain-driven decompositions, circuit breaker resilience patterns, and horizontal autoscaling configurations under simulated 50,000 concurrent user surges."
        },
        {
            "type": "h1",
            "title": "1. Domain Decompositions & Bounded Contexts",
            "content": "The platform architecture separates concerns into four bounded contexts: (1) Identity & Progressive Disclosure Governance; (2) Submission Ingestion & Storage; (3) Peer Review Assignment & Calibration Engine; and (4) Cryptographic Audit & Quorum Adjudication. Communication across bounded contexts utilizes asynchronous domain events published over Kafka message queues with idempotent consumer guarantees."
        },
        {
            "type": "h1",
            "title": "2. Failure Isolation & Resilience Engineering",
            "content": "To prevent cascading failures when external services experience transient latency spikes, each inter-service client employs Resilience4j circuit breakers with half-open probe states. If the cryptographic sidecar latency exceeds 250ms over a 20-call sliding window, requests degrade gracefully to asynchronous background queuing rather than rejecting client transactions."
        },
        {
            "type": "table",
            "title": "arch_table"
        },
        {
            "type": "h1",
            "title": "3. Concurrency Benchmarks & Autoscaling Verification",
            "content": "Load testing was conducted using distributed k6 test harnesses simulating 50,000 students submitting 15 MB PDF reports within a 30-minute deadline window. The horizontal pod autoscaler (HPA) automatically scaled submission pods from 3 to 18 replicas based on 70% CPU threshold, sustaining p99 response times of 74ms with zero 5xx error spikes."
        },
        {
            "type": "h1",
            "title": "4. Architecture Decision Records (ADRs)",
            "content": "ADR-01 confirms the adoption of Client-Side Rendering (React+Vite) paired with Spring Boot REST to eliminate SSR multi-tenant cache leak vulnerabilities. ADR-02 establishes HMAC-SHA-256 tamper-evident ledgers for legal audit compliance."
        }
    ]
    tables_4 = {
        "arch_table": {
            "headers": ["Service Component", "Runtime / Framework", "Resilience Pattern", "Target SLA", "Avg p95 Latency", "Autoscale Target"],
            "rows": [
                ["Gateway & Routing", "Spring Cloud Gateway", "Rate Limiter / Token Bucket", "99.99%", "12 ms", "2-8 Replicas"],
                ["Submission Core", "Spring Boot 3 (Java 21)", "Async Queue / Circuit Breaker", "99.95%", "48 ms", "3-18 Replicas"],
                ["Crypto Sidecar", "PHP 8.2+ / OpenSSL", "Isolated Process / Localhost", "99.99%", "18 ms", "1:1 Co-located"],
                ["Analytics Engine", "Spring Data / JPA MySQL", "Read-Replica Offloading", "99.90%", "65 ms", "2-6 Replicas"]
            ],
            "colWidths": [90, 105, 115, 55, 75, 60]
        }
    }
    build_pdf(pdf4, "Event-Driven Microservices Architecture for High-Throughput Academic Assessment Platforms", "Software Engineering & Cloud Architecture", "SUB-7A23D8", sections_4, tables_4)

if __name__ == "__main__":
    main()
