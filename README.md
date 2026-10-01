# 📚 English Vocabulary App (IELTS Active Vocabulary)

An interactive, modern English vocabulary learning application powered by **Spaced Repetition System (SRS)**, active recall, flashcards, and contextual paragraph practice. Built with **React 18**, **TypeScript**, **Tailwind CSS**, and **Vite**.

---

## ✨ Features

- 🧠 **Spaced Repetition System (SRS)**: Optimized learning intervals to help you remember vocabulary long-term.
- 🎯 **Multiple Study Modes**:
  - **Quick Review**: Rapid recall session for due words.
  - **Flashcards**: Interactive flip-card review mode.
  - **Active Retrieval**: Typing and meaning recall practice.
  - **Topic-based Study**: Focus on specific themes (IELTS topics, Business, Daily Life, etc.).
- 📖 **Contextual Paragraph Practice**: Learn words within full sentences and reading passages.
- 📊 **Detailed Dashboard & Stats**: Track mastered words, review streaks, accuracy, and upcoming reviews.
- 💾 **Local Persistence & Sync**: Automatic synchronization with local storage and `data/study_data.json`.
- ⚡ **Blazing Fast**: Powered by Vite and Tailwind CSS with a clean, responsive UI.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or newer recommended)
- `npm`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/phihanh-qg/vocabulary.git
   cd vocabulary
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   Or on Windows, simply double-click **`start.bat`**.

---

## 🛠️ Tech Stack

- **Framework**: [React 18](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 📁 Project Structure

```text
├── data/                      # Vocabulary datasets and local database
│   └── study_data.json
├── src/
│   ├── components/            # UI components (Dashboard, Study, WordList, etc.)
│   ├── engine/                # SRS calculation and study queue engine
│   ├── storage/               # LocalStorage & disk sync handlers
│   ├── types/                 # TypeScript interfaces and types
│   ├── utils/                 # Audio, string, and formatting helpers
│   ├── App.tsx                # Main application view
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles & Tailwind directives
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 📜 License

MIT License. Feel free to use and customize for your own learning!
