# 🚀 GrowEasy CRM – AI Powered CSV Importer

> An intelligent AI-powered CSV Importer that automatically extracts and maps lead information from any CSV format into the GrowEasy CRM schema using Large Language Models (LLMs).

![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![Gemini](https://img.shields.io/badge/AI-Gemini-orange)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC)


## Live Demo

🌐 [https://groweasy-crm-ai-csv-importer.vercel.app](https://groweasy-crm-ai-csv-importer.vercel.app/)

---

## 📌 Overview

Businesses receive leads from multiple platforms such as:

- Facebook Lead Ads
- Google Ads
- Excel Sheets
- Marketing Agencies
- CRM Exports
- Real Estate Portals
- Sales Reports

Every CSV has different column names, layouts, and structures, making manual importing slow and error-prone.

**GrowEasy CRM AI Importer** solves this problem by using **Artificial Intelligence** to understand the uploaded CSV, intelligently map fields, and convert them into a standardized CRM format.

Unlike traditional importers, this application **does not rely on fixed column names**. Instead, it uses AI to infer the meaning of each field.

---

# ✨ Features

## 📂 CSV Upload

- Drag & Drop Upload
- File Picker
- CSV Validation
- Error Handling
- Supports multiple CSV layouts

---

## 👀 CSV Preview

Before AI processing, users can:

- Preview uploaded data
- View detected headers
- Scroll horizontally & vertically
- Responsive table
- Sticky headers
- Pagination
- Search & Filtering

---

## 🤖 AI-Powered Field Mapping

The application intelligently maps fields like:

| Incoming CSV Field | CRM Field |
|--------------------|----------|
| Full Name | name |
| Customer | name |
| Contact | mobile |
| Phone | mobile |
| Mobile | mobile |
| Email Address | email |
| Company | company |
| Remarks | crm_note |
| Follow-up | crm_note |
| Status | crm_status |

No predefined schema is required.

---

## 📊 CRM Data Extraction

The AI extracts:

- Created Date
- Name
- Email
- Mobile Number
- Country Code
- Company
- City
- State
- Country
- Lead Owner
- CRM Status
- CRM Notes
- Data Source
- Possession Time
- Description

---

## 📈 Import Summary

After processing:

- Total Records
- Successfully Imported
- Skipped Records
- Success Rate

---

## 🌙 UI Features

- Modern SaaS UI
- Responsive Design
- Mobile Friendly
- Dark Mode
- Beautiful Animations
- Loading States
- Toast Notifications

---

# 🏗️ Tech Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Framer Motion
- TanStack Table
- React Dropzone
- PapaParse

---

## Backend

- Node.js
- Express.js
- Multer
- PapaParse

---

## AI

- Google Gemini API

---

## Validation

- Zod

---

## Deployment

Frontend

- Vercel

---

# 📁 Project Structure

```
├── 📁 .bolt
│   └── ⚙️ config.json
├── 📁 public
│   ├── 🖼️ GrowEasyLogo.jpeg
│   ├── 📄 sample_facebook_leads.csv
│   ├── 📄 sample_leads.csv
│   └── 🖼️ vite.svg
├── 📁 src
│   ├── 📁 components
│   │   ├── 📁 ui
│   │   ├── 📄 GeminiKeyBanner.tsx
│   │   ├── 📄 mode-toggle.tsx
│   │   └── 📄 theme-provider.tsx
│   ├── 📁 constants
│   │   └── 📄 index.ts
│   ├── 📁 hooks
│   │   ├── ⚙️ .gitkeep
│   │   └── 📄 use-mobile.ts
│   ├── 📁 lib
│   │   └── 📄 utils.ts
│   ├── 📁 pages
│   │   ├── 📄 LandingPage.tsx
│   │   ├── 📄 PreviewPage.tsx
│   │   ├── 📄 ProcessingPage.tsx
│   │   └── 📄 ResultsPage.tsx
│   ├── 📁 services
│   │   └── 📄 api.ts
│   ├── 📁 store
│   │   └── 📄 appStore.ts
│   ├── 📁 types
│   │   └── 📄 index.ts
│   ├── 📁 utils
│   │   └── 📄 csv.ts
│   ├── 📄 App.tsx
│   ├── 🎨 index.css
│   └── 📄 main.tsx
├── 📁 supabase
│   ├── 📁 functions
│   │   ├── 📁 csv-process
│   │   │   └── 📄 index.ts
│   │   ├── 📁 csv-upload
│   │   │   └── 📄 index.ts
│   │   └── 📁 job-status
│   │       └── 📄 index.ts
│   └── 📁 migrations
│       └── 📄 20260709140248_create_import_jobs_table.sql
├── ⚙️ .gitignore
├── ⚙️ components.json
├── 🌐 index.html
├── ⚙️ package-lock.json
├── ⚙️ package.json
├── ⚙️ tsconfig.app.json
├── ⚙️ tsconfig.json
├── ⚙️ tsconfig.node.json
└── 📄 vite.config.ts
```

---

# ⚙️ Installation

Clone the repository

```bash
git clone [https://github.com/priyanshuranjan02/GrowEasy-CRM-AI-CSV-Importer.git](https://github.com/priyanshuranjan02/GrowEasy-CRM-AI-CSV-Importer.git)

cd GrowEasy-CRM-AI-CSV-Importer
```

Install dependencies

```bash
npm install
```


Run frontend

```bash
npm run dev
```

Run backend

```bash
npm run server
```

---

# 🤖 AI Workflow

```
Upload CSV
      │
      ▼
Parse CSV
      │
      ▼
Preview Data
      │
      ▼
Confirm Import
      │
      ▼
Backend
      │
      ▼
Batch Processing
      │
      ▼
Gemini AI
      │
      ▼
Field Mapping
      │
      ▼
Structured CRM JSON
      │
      ▼
Frontend Result Table
```

---

# 📦 API Endpoints

## Upload CSV

```
POST /upload
```

Uploads a CSV file.

---

## Process Records

```
POST /process
```

Processes CSV records using AI.

---

## Health Check

```
GET /health
```

Returns server status.

---

# 🧠 AI Prompt Engineering

The AI is instructed to:

- Understand semantic meaning instead of exact column names.
- Map unknown CSV structures to CRM fields.
- Detect multiple emails and phone numbers.
- Normalize dates.
- Skip invalid records.
- Restrict CRM status to predefined values.
- Return structured JSON only.

---

# 🔒 Security

- Environment Variables
- File Validation
- Input Sanitization
- Rate Limiting
- Helmet
- Error Handling
- Secure API Keys

---

# ⚡ Performance Optimizations

- Batch AI Processing
- Lazy Loading
- Memoized Components
- Streaming CSV Parsing
- Efficient Table Rendering

---

# 🚀 Deployment

## Frontend

Deploy using **Vercel**

```bash
npm run build
```

---


# 🧪 Future Improvements

- OCR support for PDFs
- Excel (.xlsx) import
- AI confidence score
- Duplicate detection
- Background job queue
- WebSocket progress updates
- Multi-language support
- User authentication
- Audit logs
- Bulk export

---


# 👨‍💻 Author

**Priyanshu Ranjan**

AI & Machine Learning Engineer

- GitHub: https://github.com/priyanshuranjan02
- LinkedIn: [(https://www.linkedin.com/in/priyanshu-ranjan-74170a227/)](https://www.linkedin.com/in/priyanshu-ranjan-74170a227/)

---
