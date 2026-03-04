# TCS Plan of Correction — POC

A Proof of Concept for CMS-2567 Plan of Correction management. Includes two apps:

- **Plan of Correction (User App)** — Upload CMS-2567 PDFs, extract F-Tags via AI, draft and export Plans of Correction
- **Template Repository (Admin App)** — Manage F-Tag POC templates with a structured browser-based editor

---

## Docker (Recommended)

### 1. Configure

```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

### 2. Build & Run

```bash
docker compose up -d
```

### 3. Access

| App | URL |
|-----|-----|
| Plan of Correction | http://localhost:7867 |
| Template Repository | http://localhost:7867/admin/ |

### Common Docker Commands

```bash
docker logs -f tcs-plan-of-correction   # View logs
docker compose down                      # Stop
docker compose up -d --build             # Rebuild after changes
docker compose down -v                   # Full reset (clears data)
```

---

## Local Development

```bash
# Install dependencies
npm install
npm run install:all

# Start both apps in dev mode
npm run dev
```

| App | Client | API |
|-----|--------|-----|
| Admin (Template Repository) | http://localhost:5173 | http://localhost:3001 |
| User (Plan of Correction) | http://localhost:5174 | http://localhost:3002 |

---

## Project Structure

```
POC/
├── client/                    # Admin App (Template Repository) frontend
├── server/                    # Admin App backend
├── user-app/
│   ├── client/                # User App (Plan of Correction) frontend
│   └── server/                # User App backend
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.yml         # Docker Compose config
├── nginx.conf                 # Nginx reverse proxy config
├── start.sh                   # Docker startup script
└── .env.example               # Environment template
```

## Tech Stack

- **Frontend**: React 18, Vite, TipTap (rich text editor)
- **Backend**: Node.js, Express, better-sqlite3 (SQLite)
- **AI**: OpenAI GPT-4o for F-Tag extraction and POC drafting
- **PDF**: pdf-lib for CMS-2567 PDF generation, pdfjs-dist for extraction
- **Deployment**: Docker, Nginx
