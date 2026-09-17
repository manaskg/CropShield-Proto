# 🌾 CropShield AI — Next-Gen Crop Intelligence Platform

[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb.svg)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248.svg)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Cache-Redis%20Cloud-DC382D.svg)](https://redis.io/)
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini%202.5-4285F4.svg)](https://ai.google.dev/)

CropShield AI is an intelligent agricultural intelligence suite designed for farmers, agronomists, and agri-researchers. It delivers real-time plant disease detection, soil health diagnostics, AI crop doctor assistance, and yield optimization.

---

## 🚀 Key Features

- 🌿 **Instant Plant Disease Detection**: Upload crop leaf photos for instant disease identification, severity grading, and chemical/organic treatment recommendations.
- 🧪 **AI Soil Lab & Satellite Diagnostics**: Multi-layer soil health analysis combining satellite indicators (moisture, NDVI, pH estimates) and NPK values.
- 🌾 **Smart Farm & Yield Master**: Season-wise crop planning, timeline management, and yield estimation.
- 🤖 **Universal Multi-Lingual AI Assistant**: Agricultural advisory in English, Hindi, Punjabi, Bengali, Telugu, and more with voice TTS support.
- 📊 **Farmer Scan History & Profile**: Cloud-persisted scan records and farm profiles powered by MongoDB Atlas.
- ⚡ **High-Speed Caching & Security**: Resilient Redis Cloud caching and JWT blacklisting.

---

## 📁 Repository Structure

```
CropShield-FullStack/
├── backend/                  # Express.js REST API server
│   ├── config/              # MongoDB & Redis configurations
│   ├── controllers/         # API business logic controllers
│   ├── middlewares/         # JWT Auth & Upload middlewares
│   ├── models/              # Mongoose schemas (User, ScanHistory, SoilReport)
│   ├── routes/              # Express API endpoints
│   ├── .env.example         # Backend environment variables template
│   ├── package.json
│   └── server.js            # Server entry point
├── frontend/                 # Vite + React Modern Web UI
│   ├── src/
│   │   ├── api/             # API client & services
│   │   ├── components/      # UI components & agents
│   │   ├── context/         # Auth & Language state management
│   │   ├── hooks/           # Custom React hooks
│   │   └── pages/           # Application views & pages
│   ├── .env.example         # Frontend environment variables template
│   ├── netlify.toml         # Netlify SPA routing configuration
│   └── package.json
└── README.md
```

---

## 🛠️ Getting Started

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and supply your MongoDB URI, Redis URL, JWT Secret, and Gemini API Key
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL to http://localhost:5000/api
npm run dev
```

---

## 🌐 Deployment

- **Frontend**: Ready for deployment on [Netlify](https://www.netlify.com/) (configured with `netlify.toml` and SPA redirects).
- **Backend**: Ready for deployment on [Render](https://render.com/)
