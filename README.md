# AI Project Intelligence & Risk Advisor

An enterprise RAG-powered project management platform that analyzes scattered project documents (PDF, DOCX, XLSX, CSV, TXT) and generates automated risk forecasts, health scorecards, user stories, and conversational intelligence.

---

## 🌟 Key Features

- **📁 Multi-Format Document Ingestion**: Upload proposals, SRS docs, agile plans, meeting notes, and test reports (`.pdf`, `.docx`, `.xlsx`, `.csv`, `.txt`, `.md`).
- **🎯 Scope & Deliverables Extraction**: Extracts project goals, deliverables, milestone schedules, and out-of-scope boundaries.
- **⚠️ Risk Detection & Forecasting**: Identifies threats, extracts Likelihood (1–5) and Impact (1–5), computes Risk Score ($L \times I$), and forecasts schedule slippage.
- **📊 Factor-Wise Health Scorecard**: Computes a dynamic 0–100 health score with weighted dimensions (Schedule 25%, Risk 25%, Scope 20%, Blockers 15%, Quality 15%) and interactive radar visualization.
- **🚧 Blockers & Action Items**: Extracts active impediments, mitigation plans, owners, and due dates.
- **📝 Documentation Generation**: Generates missing user stories (As a / I want / So that) and structured risk registers.
- **💬 Conversational Project Assistant**: Natural-language Q&A grounded strictly in your uploaded project documents.

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

---

### 2. Backend Setup

```bash
# Clone the repository
git clone https://github.com/<your-username>/riskai.git
cd riskai

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Open .env and add your GEMINI_API_KEY or GROQ_API_KEY

# Start backend server (runs on http://localhost:8012)
python3 app.py
```

---

### 3. Frontend Setup

```bash
# In a new terminal, navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the frontend dev server
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## ⚙️ Configuration (`.env`)

```env
LLM_BACKEND=groq

# Option A: Groq API
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama3-70b-8192
MAX_TOKENS=2500

# Option B: Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

---

## 🏗️ Architecture

```
riskai/
├── app.py                # FastAPI endpoints & multi-format ingestion
├── process.py            # Text chunking, indexing & LLM backend loader
├── mainpicture.py        # Multi-agent prompt pipelines (Scope, Risk, Health, Docs)
├── .env.example          # Environment variable template
├── .gitignore            # Git exclusion rules (secrets & binaries)
└── frontend/             # React + Vite dashboard
    ├── src/
    │   ├── App.jsx       # Main dashboard layout & tab management
    │   ├── components/   # Radar chart, Markdown tables & QA widgets
    │   └── utils/        # Output parsers
    └── package.json
```

---

## 📄 License

MIT License.
