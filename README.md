# Peerity 🎓🔒
> **Accountable, Privacy-Preserving Academic Peer Evaluation & Adjudication Platform**

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![PHP](https://img.shields.io/badge/PHP-8.2%20Sidecar-777BB4?logo=php&logoColor=white)](https://www.php.net/)
[![Security](https://img.shields.io/badge/Security-Argon2id%20%7C%20AES--256--GCM-critical)](#-security--cryptography)

---

## 📖 Introduction

**Peerity** is a modern, enterprise-grade peer evaluation and academic integrity platform designed to eliminate grading bias and safeguard student privacy. Built with a zero-compromise approach to security and compliance (aligned with GDPR and COPPA principles), Peerity enables universities and educational institutions to run rigorous, transparent, and fair peer review cycles across disciplines.

Unlike conventional learning management systems, Peerity enforces **double-blind pseudonymity**, **cryptographic at-rest encryption**, **tamper-evident audit trails**, and a **2-of-3 committee quorum governance gate** to ensure that identity disclosures only occur when legitimately warranted.

---

## ✨ What Makes Peerity Great?

### 🛡️ Double-Blind Pseudonymity & 4-Tier Progressive Disclosure
- **Cryptographic Pseudonyms**: Submissions and evaluations are decoupled from personal records using deterministic cryptographic aliases.
- **Progressive Identity Disclosure**:
  - **Tier 0**: Pure pseudonym (Standard evaluation phase).
  - **Tier 1**: Course metadata & assignment context.
  - **Tier 2**: Full review rationale & feedback transcripts.
  - **Tier 3**: Academic standing & affiliation (Strictly committee-gated).
- **2-of-3 Quorum Governance**: Identity unmasking for disputes requires approval from a committee quorum with automated conflict-of-interest recusal.

### 📑 Dual-Model Rubric Evaluation Engine
- **Coexisting Scoring Models**:
  - **Scale & Level-Based**: Sliders and rubric score bands with qualitative criterion descriptors.
  - **Question-Based Sentence Cards**: Evaluators select domain-specific, full-sentence statements rather than arbitrary numeric scores.
- **Built-in Starter Templates**: Ready-to-use rubrics for **Essay Writing**, **Technical Presentations**, and **Software Coding**.
- **Unified Downstream Pipeline**: Both scoring models normalize to an identical numeric scale, seamlessly feeding calibration, MAE calculation, and grading reliability analytics.

### 📄 Interactive Side-by-Side Review Workspace
- **Split-Pane Ergonomics**: View submitted documents directly alongside interactive rubric cards for distraction-free evaluation.
- **Flexible Document Viewer**: Embedded PDF viewer supporting continuous page navigation, zooming, panning, and responsive scaling.

### 🔐 Cryptographic Integrity & Tamper-Evident Ledger
- **AES-256-GCM Envelope Encryption**: Submission files are encrypted at rest by a sandboxed PHP sidecar using 12-byte IVs and 16-byte authentication tags.
- **HMAC-SHA256 Chained Audit Ledger**: Every security, vote, login, and disclosure event is recorded in an immutable, chained hash sequence that prevents retroactive modification even by DB admins.
- **Argon2id Password Hashing**: State-of-the-art password protection adhering to OWASP recommendations.

### 👥 Collaborative Study Groups & Peer Evaluations
- **Smart Group Formation**: Survey-driven formation algorithms that balance skill sets and preferences across teams.
- **Intra-Group Reviewing**: Evaluate team members' collaborative contributions, communication, and technical effort with custom rubrics.

### 🎨 Modern Ergonomic UX & Privacy-First Architecture
- **Collapsible Icon-Rail Sidebar**: Smooth hover-activated navigation with persistent pin/unpin toggles and mobile touch support.
- **Dark Mode Support**: Instant light/dark/system theme switching with WCAG AA compliant contrast.
- **Data Minimization Guarantee**: Intentionally collects **zero** high-risk demographic data (no age, gender, DOB, phone, or home addresses).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Core** | Java 21+, Spring Boot 3.3.3, Spring Security 6, Spring Data JPA, Spring Session (JDBC) |
| **Database** | MySQL 8.0 (Relational schema, session persistence, indexed audit logs) |
| **Frontend UI** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, PDF.js, React Router v6 |
| **Crypto Sidecar** | PHP 8.2 with OpenSSL (AES-256-GCM) & PDO extensions (restricted to local loopback) |
| **Auth & Security** | Stateful `JSESSIONID` (HttpOnly, SameSite=Lax), Double-Submit CSRF tokens, Argon2id |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed on your machine:
- **Git**: [git-scm.com](https://git-scm.com/)
- **Java JDK 21+**: [adoptium.net](https://adoptium.net/)
- **Node.js 18+ & npm**: [nodejs.org](https://nodejs.org/)
- **MySQL 8.0+**: Running on port `3306` (e.g., via MySQL Community Server or XAMPP)
- **PHP 8.2+**: With `openssl` and `pdo` extensions enabled (e.g., in `C:\xampp\php` or system PATH)

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/<your-username>/peerity.git
cd peerity
```

---

### Step 2: Database Setup

Ensure your local MySQL service is running. Peerity will automatically create the database `trustreview_db` upon startup.

If needed, adjust your database credentials in `backend/src/main/resources/application.properties` or configure a `.env` file from `.env.example`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/trustreview_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=
```

---

### Step 3: Run the Services

#### Option A: One-Click Windows Launchers (Recommended)
Open three terminal windows (or double-click the `.bat` files in the root folder):
1. **PHP Crypto Sidecar** (Port 8000):
   ```cmd
   run-php.bat
   ```
2. **Spring Boot Backend** (Port 5000):
   ```cmd
   run-backend.bat
   ```
3. **React Frontend** (Port 5173):
   ```cmd
   run-frontend.bat
   ```

#### Option B: Manual Command Line Execution
```bash
# Terminal 1: Start PHP Crypto Sidecar (Port 8000)
cd php-service
php -S 127.0.0.1:8000 -t src

# Terminal 2: Start Spring Boot Core (Port 5000)
cd backend
./mvnw spring-boot:run     # Windows: .\mvnw.cmd spring-boot:run

# Terminal 3: Start React Vite Frontend (Port 5173)
cd frontend
npm install
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 👥 Seed Demo Accounts

The database automatically seeds realistic test accounts on the first startup. You can also use the **1-Click Demo Buttons** on the login screen to sign in instantly:

| Role | Email | Password | Name & Department |
| :--- | :--- | :--- | :--- |
| **STUDENT** | `student1@peerity.edu` | `Student@12345` | Alice Chen (Computer Science) |
| **INSTRUCTOR** | `instructor1@peerity.edu` | `Instructor@12345` | Prof. Jonathan Hayes (Computer Science) |
| **COMMITTEE** | `committee1@peerity.edu` | `Committee@12345` | Prof. Elena Rostova (Integrity Panel) |
| **ADMIN** | `admin@peerity.edu` | `Admin@12345` | Dr. Alistair Vance (Governance) |

---

## 🧪 Testing & Verification

Run backend integration and unit tests:
```bash
cd backend
./mvnw test               # Windows: .\mvnw.cmd test
```

Type-check and build the frontend for production:
```bash
cd frontend
npx tsc --noEmit
npm run build
```

---

## 📄 License & Academic Integrity

Developed for academic research and educational evaluation systems. Built in compliance with student privacy regulations and ethical peer-assessment methodologies.
