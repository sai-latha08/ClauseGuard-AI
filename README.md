# ClauseGuard AI — Intelligent Terms & Conditions Risk Analysis System

> *"Understand the fine print before you agree."*

ClauseGuard AI is a production-grade, explainable legal document intelligence platform built with the MERN stack (MongoDB, Express, React, Node.js) and a Python FastAPI NLP/AI microservice. It empowers consumers and legal professionals to upload Terms and Conditions documents, segment clauses, detect hidden risks, and ask contextual questions via a grounded RAG chatbot.

---

## 🌟 Key Capabilities

1. **Document Ingestion & Multi-Page Parsing**:
   - High-fidelity PDF text extraction with coordinate and page tracking (`PyMuPDF`).
   - Support for DOCX and raw text formats.
   - Robust OCR fallback for scanned contracts.

2. **16-Category Legal Taxonomy Classification**:
   - *Termination*, *Liability*, *Indemnification*, *Hidden Charges*, *Automatic Renewal*, *Refund Policy*, *Data Collection*, *Third-Party Data Sharing*, *Arbitration*, *Governing Law*, *Intellectual Property*, *User Responsibilities*, *Payment*, *Account Suspension*, *Content Ownership*, and *Warranty Disclaimer*.

3. **Multi-Stage Risk Scoring & Severity Tiers**:
   - Weighted 0–100 risk scoring algorithm.
   - Semantic severity levels: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
   - No hardcoded scores; derived dynamically from identified provisions and risk accumulation.

4. **Deep Explainability Engine**:
   - Breaks down *What was detected*, *Why it matters*, and *What language triggered the warning*.
   - Actionable user recommendations and caution checklists.
   - Strictly disclaimer-compliant language ("may", "could potentially", "consider checking").

5. **Split-Screen Interactive Document Viewer**:
   - Synchronized side-by-side view of original document and risk console.
   - Visual color-coded clause highlights:
     - `CRITICAL`: Crimson Red
     - `HIGH`: Orange
     - `MEDIUM`: Amber
     - `LOW`: Subtle Emerald
   - Fast filtering by severity and category.

6. **Grounded Document-Aware Chatbot (RAG)**:
   - Dense vector embeddings indexed in ChromaDB per document.
   - Semantic retrieval strictly asserting evidence from uploaded text.
   - Direct page number citations and verbatim clause snippets.

7. **Executive Summary & Audit Reports**:
   - Plain-language narrative summary of document provisions.
   - Key findings list and pre-agreement action checklist.
   - Printable and exportable audit report.

---

## 🏗 System Architecture

```
[React SPA (Vite + Tailwind + Framer Motion)]
                  │
                  ▼  (REST API / JWT Auth)
[Node.js / Express API Server] ───► [MongoDB Atlas Database]
                  │
                  ▼  (Internal Gateway)
[FastAPI AI / NLP Engine]
   ├─ PyMuPDF / OCR Text Extractor
   ├─ Clause Boundary Segmenter
   ├─ 16-Category Multi-Class Classifier
   ├─ Risk Factor & Scoring Engine
   ├─ Sentence-Transformers Embeddings
   └─ ChromaDB Vector Store & RAG
```

---

## 📁 Project Structure

```
ClauseGuardAI/
├── client/                     # React Frontend (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Logo, Navbar, Footer, RiskBadge, Disclaimer
│   │   │   ├── dashboard/      # MetricsGrid, RecentAuditsTable
│   │   │   ├── upload/         # DocumentUploader, PipelineStepper
│   │   │   └── viewer/         # SplitDocumentViewer, ClauseCard, ExplainerModal, Chatbot
│   │   ├── context/            # AuthContext
│   │   ├── pages/              # Landing, Login, Register, Dashboard, Upload, Analysis, Report
│   │   ├── services/           # Axios API Gateway
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── tailwind.config.js
│
├── server/                     # Node.js / Express API Server
│   ├── config/                 # MongoDB connection
│   ├── controllers/            # Auth, Document, Risk, QA, Report controllers
│   ├── middleware/             # JWT auth, Multer upload, Error handler
│   ├── models/                 # Mongoose User, Document, Clause, RiskAnalysis, Report, Chat
│   ├── routes/                 # Express API routes
│   ├── services/               # AIGateway, SampleDocs generator
│   └── server.js
│
├── ai-service/                 # Python FastAPI AI/NLP Engine
│   ├── app/
│   │   ├── models/             # Pydantic schemas
│   │   ├── pipelines/          # 16-Category Classifier, RiskAnalyzer
│   │   ├── services/           # VectorStore (ChromaDB), QAEngine (RAG), Summarizer
│   │   ├── utils/              # DocumentExtractor (PyMuPDF), ClauseSegmenter
│   │   └── config.py
│   ├── requirements.txt
│   └── main.py
│
├── uploads/                    # Local storage for uploaded documents
├── sample-docs/                # Built-in sample Terms & Conditions
├── .env.example
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ (tested on v24.x)
- **Python** 3.10+ (tested on Python 3.14.x)
- **MongoDB** (Local instance or MongoDB Atlas URI)

---

### Step 1: Environment Configuration

Copy `.env.example` to `server/.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/clauseguard_ai
JWT_SECRET=your_jwt_secret_key_here
AI_SERVICE_URL=http://127.0.0.1:8000
```

---

### Step 2: Install Dependencies

#### 1. Server Dependencies
```bash
cd server
npm install
```

#### 2. Client Dependencies
```bash
cd client
npm install
```

#### 3. AI Service Dependencies
```bash
cd ai-service
pip install -r requirements.txt
```

---

### Step 3: Run the Services

You can run each service in separate terminals:

#### Terminal 1 — AI / NLP Microservice:
```bash
cd ai-service
python main.py
# Running on http://127.0.0.1:8000
```

#### Terminal 2 — Express Backend:
```bash
cd server
npm run dev
# Running on http://127.0.0.1:5000
```

#### Terminal 3 — React Client:
```bash
cd client
npm run dev
# Running on http://localhost:5173
```

---

## 🧪 Testing with Sample Documents

You can immediately test the entire end-to-end processing pipeline without preparing a PDF:
1. Open `http://localhost:5173`
2. Create an account or sign in.
3. Click **"Try Sample Terms"** on the Dashboard or Upload page.
4. The system will pass the full `CloudSphere_Standard_Terms_and_Conditions.txt` contract through the live NLP pipeline:
   - Clause segmentation
   - 16-Category categorization
   - Automatic Renewal, Arbitration waiver, and Data Sharing risk identification
   - ChromaDB embedding & RAG indexing
   - Plain-language summary & findings generation.

---

## 🛡 Security & Best Practices

- **Password Hashing**: Bcrypt with 10 salt rounds.
- **Stateless Tokens**: Protected routes with JSON Web Tokens (JWT).
- **MIME & Size Validation**: Strict whitelist for PDF, DOCX, and TXT with a 15MB ceiling.
- **Resource Ownership**: Users can only access and query their own uploaded documents.
- **Defensive Headers**: Helmet HTTP security headers and CORS origin restrictions.

---

## ⚖ Legal Disclaimer

> **ClauseGuard AI provides automated informational analysis of Terms and Conditions. It is not a law firm and does not provide legal advice or create an attorney-client relationship. Always consult qualified legal counsel for binding contract review.**
