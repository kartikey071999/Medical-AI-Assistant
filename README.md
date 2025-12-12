# Vitalis AI - Medical Diagnostics Assistant

Vitalis AI is a modern, privacy-focused Progressive Web App (PWA) designed to help users understand medical diagnostics, track their health, and receive actionable insights using Google's Gemini 2.5 Flash model.

![Vitalis AI Banner](https://picsum.photos/1200/400?grayscale)

## 🚀 Features

### 🧠 Intelligent Analysis
- **Multi-Modal Upload**: Analyze PDF reports, images (X-rays, skin conditions), and CSV data.
- **Instant Findings**: Extracts key biomarkers, checks against reference ranges, and identifies critical values.
- **Visual Grounding**: Highlights specific areas in images or text in reports.

### 📍 Contextual Assistance
- **Doctor Finder**: Automatically identifies the specialist needed based on the analysis and finds highly-rated doctors nearby (using Gemini + Google Maps URL construction).
- **Symptom Checker**: AI-driven triage interview to assess symptom severity and urgency.

### 🛡️ Privacy & Storage
- **Local-First Architecture**: All guest data is processed in memory and stored in `localStorage`.
- **Client-Side Encryption**: No data is sent to a backend server (other than the necessary API calls to Google Gemini).

### 📊 Health Tracking
- **Interactive Dashboard**: View historical reports and trends.
- **Health Diary**: Log daily metrics (Mood, Stress, Pain) with visualization.
- **Emergency Card**: QR-code accessible medical profile for first responders.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS (Dark Mode enabled)
- **AI Model**: Google Gemini 2.5 Flash (`@google/genai` SDK)
- **State Management**: React Context + LocalStorage
- **Testing**: Vitest + React Testing Library

## ⚡ Getting Started

### Prerequisites

- Node.js 18+
- A Google Cloud Project with the Gemini API enabled.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vitalis-ai.git
   cd vitalis-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   Add your API key to the `.env` file:
   ```env
   API_KEY=AIzaSy...
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🧪 Testing

We use **Vitest** for unit and smoke testing.

```bash
# Run all tests
npm test

# Run smoke tests only
npm test smoke
```

### Smoke Tests
Located in `tests/smoke.test.tsx`, these ensure the critical path (rendering the app, loading the AI service wrapper) functions correctly without crashing.

## 📂 Project Structure

```
/
├── components/        # UI Components (Charts, Modals, Uploaders)
├── contexts/          # React Contexts (Auth, Theme)
├── services/          # Business Logic & API Wrappers
│   ├── geminiService.ts   # AI Model Interaction
│   ├── storageService.ts  # LocalStorage Abstraction
│   └── analysisService.ts # Health Risk Algorithms
├── tests/             # Test Suites
├── types.ts           # TypeScript Definitions
├── App.tsx            # Main Application Entry
└── index.tsx          # DOM Mounting
```

## ⚠️ Disclaimer

Vitalis AI is an experimental tool for informational purposes only. **It is not a substitute for professional medical advice, diagnosis, or treatment.** Always seek the advice of your physician or other qualified health provider.
