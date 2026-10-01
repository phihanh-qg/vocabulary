# English Vocabulary Acquisition System (EVAS)

A structured lexical acquisition and retention platform implementing a modified SuperMemo-2 (SM-2) Spaced Repetition System (SRS), dual-direction active recall, and contextual cloze comprehension.

---

## 1. Overview

The English Vocabulary Acquisition System is designed to mitigate the Ebbinghaus forgetting curve through adaptive retrieval scheduling. Rather than relying on passive recognition, the system enforces active lexical generation, context-dependent evaluation, and dual-direction retrieval dynamics (L1 to L2 and L2 to L1).

The application is built on top of React, TypeScript, and Vite, operating client-side with atomic persistence synchronization to local storage and structured JSON files.

---

## 2. Theoretical Foundations and Methodology

### 2.1 Modified SM-2 Algorithm (Directional Retention)

Lexical items maintain independent retention models for forward retrieval (English to Vietnamese) and backward retrieval (Vietnamese to English). The review interval calculation is defined as:

$$I(n) = \begin{cases} 
0 & \text{if rating} = \text{again} \\
1 & \text{if rating} = \text{hard}, n = 0 \\
\max(1, \text{round}(I(n-1) \times 1.2)) & \text{if rating} = \text{hard}, n > 0 \\
1 & \text{if rating} = \text{good}, n = 0 \\
3 & \text{if rating} = \text{good}, n = 1 \\
\max(I(n-1) + 1, \text{round}(I(n-1) \times EF)) & \text{if rating} = \text{good}, n \ge 2 \\
4 & \text{if rating} = \text{easy}, n = 0 \\
\max(I(n-1) + 2, \text{round}(I(n-1) \times EF \times 1.3)) & \text{if rating} = \text{easy}, n \ge 1
\end{cases}$$

The Ease Factor ($EF$) updates dynamically according to response quality, bounded at $EF_{\min} = 1.3$:

$$EF' = \max\left(1.3, EF + \Delta EF\right)$$

Where:
- $\text{again}: \Delta EF = -0.20$
- $\text{hard}: \Delta EF = -0.15$
- $\text{good}: \Delta EF = 0.00$
- $\text{easy}: \Delta EF = +0.15$

### 2.2 Dual-Direction Retrieval Mechanics

Memory traces for bidirectional translation are asymmetrical. A learner may recognize an L2 term while failing to produce it from an L1 cue. The system tracks separate intervals ($I_{en \to vi}$, $I_{vi \to en}$) and independent ease factors to guarantee balanced productive and receptive vocabulary proficiency.

### 2.3 Contextual Cloze Engine

Words are anchored within reading passages and sentence structures. The cloze generator parses target lemmas, inflections, and collocations, masking target tokens within authentic context sentences to evaluate syntactic and semantic integration.

### 2.4 Approximate Response Evaluation

User inputs are evaluated via a multi-tiered matching pipeline:
1. Exact normalization (trimming, case folding, diacritic resolution).
2. Lemmatization and inflectional variant comparison.
3. String distance tolerance (Levenshtein metric thresholding) to accommodate minor typographical variance without penalizing core semantic retrieval.

---

## 3. System Architecture

```text
[ Presentation Layer: React 18 + Tailwind CSS ]
                       |
[ State & Orchestration: App.tsx / Session Controllers ]
                       |
       +---------------+---------------+
       |                               |
[ Queue Scheduler ]           [ Evaluation Pipeline ]
  - Due queue computation       - String normalization
  - Priority sorting            - Fuzzy similarity matching
  - Topic partitioning          - Cloze token extraction
       |                               |
       +---------------+---------------+
                       |
       [ Core SRS Engine (SM-2 Engine) ]
         - Interval calculation
         - Ease factor adjustment
         - Retention state updates
                       |
       [ Persistence & Storage Layer ]
         - LocalStorage API
         - Disk Synchronization (`data/study_data.json`)
```

---

## 4. Repository Structure

```text
├── data/
│   └── study_data.json                 # Persistent lexical database and history
├── src/
│   ├── components/                     # Modular interface components
│   │   ├── Dashboard/                  # Retention metrics and performance charts
│   │   ├── Layout/                     # Navigation and shell structure
│   │   ├── Modals/                     # Configuration, import, and word management
│   │   ├── Paragraphs/                 # Extended reading and passage comprehension
│   │   ├── Study/                      # Active recall and flashcard session views
│   │   └── WordList/                   # Lexicon browsing, filtering, and inspection
│   ├── engine/                         # Core algorithmic implementations
│   │   ├── clozeEngine.ts              # Passage parsing and cloze extraction
│   │   ├── matcher.ts                  # Input evaluation and phonetic/fuzzy matching
│   │   ├── queue.ts                    # Priority queue and SRS scheduling logic
│   │   └── srs.ts                      # SM-2 interval and ease factor computation
│   ├── storage/                        # Persistence adapters
│   │   ├── diskSync.ts                 # Disk-level file synchronization
│   │   ├── historyStorage.ts           # Longitudinal review records
│   │   ├── paragraphStorage.ts         # Passage persistence
│   │   ├── settingsStorage.ts          # User preferences and algorithmic constants
│   │   └── vocabStorage.ts             # Primary vocabulary repository
│   ├── types/                          # Formal TypeScript domain schemas
│   ├── utils/                          # Audio synthesis, formatting, and topics
│   ├── App.tsx                         # Root orchestration component
│   ├── main.tsx                        # Entry point
│   └── index.css                       # Design tokens and utility classes
├── tests/
│   └── test_engines.mjs                # Algorithmic test suite for engines
├── index.html                          # Application entry point
├── package.json                        # Dependency declarations
├── tsconfig.json                       # TypeScript compiler configuration
└── vite.config.ts                      # Bundler configuration
```

---

## 5. Lexical Schema Specification

Every lexical entity conform to the following schema definition:

```typescript
interface VocabularyItem {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaningVi: string;
  definitionEn?: string;
  examples: Array<{
    en: string;
    vi: string;
  }>;
  collocations?: string[];
  topics: string[];
  overallStatus: 'new' | 'learning' | 'review' | 'mastered';
  enToViSRS: DirectionSRS;
  viToEnSRS: DirectionSRS;
  createdAt: string;
  updatedAt: string;
}

interface DirectionSRS {
  interval: number;       // In days
  easeFactor: number;     // Minimum 1.3, baseline 2.5
  repetitions: number;    // Consecutive successful reviews
  nextReviewDate: string; // ISO 8601 UTC timestamp
  lastReviewDate: string | null;
  correctCount: number;
  incorrectCount: number;
}
```

---

## 6. Setup and Execution

### 6.1 Prerequisites

- Node.js runtime (v18.0.0 or higher)
- npm package manager (v9.0.0 or higher)

### 6.2 Installation

Clone the repository and install project dependencies:

```bash
git clone https://github.com/phihanh-qg/vocabulary.git
cd vocabulary
npm install
```

### 6.3 Development Server

Start the local Vite development instance:

```bash
npm run dev
```

### 6.4 Production Compilation

Validate type safety and compile optimized static assets:

```bash
npm run build
```

The compiled output will be generated in the `dist/` directory.

### 6.5 Automated Testing

Execute the test suite to verify SRS calculations, queue prioritization, and fuzzy matcher behaviors:

```bash
node tests/test_engines.mjs
```

---

## 7. License

Distributed under the MIT License. Refer to `LICENSE` for terms of usage.
