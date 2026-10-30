# EduBridge AI 🤟✨

> **Learning Without Communication Barriers.**
> An AI-powered inclusive learning platform featuring real-time Indian Sign Language (ISL) recognition, interactive 3D avatar kinematics, Alternative & Augmentative Communication (AAC), voice synthesis, and gamified barrier-free learning.

Developed according to the Google Stitch design specification (**Warm Neobrutalist Learning**) and integrated with the Python FastAPI backend.

---

## 🎨 Design System & Colors (Google Stitch)

EduBridge AI adheres to the Google Stitch design tokens:
- **Warm Canvas**: `#F1F1F1`
- **Application Shell**: `#FFFFFF` with `rounded-3xl` (24px) & crisp neobrutalist outlines (`#222222`)
- **Primary Brand**: `#F28C00` (Vibrant Tangerine)
- **Warm Accents**:
  - Warm Yellow: `#FFD966` (Streak card, trophy badges)
  - Light Cream: `#FFF0C9` (Hero greetings, active tab pills)
  - Peach: `#FFE0BD` (Spotlight cards, media containers)
  - Soft Pink: `#F6C4C4` (Rank & milestone cards)
  - Pastel Blue: `#D9EAFB` (Trainee level cards)
- **Typography**: Set entirely in **Plus Jakarta Sans** with clean semantic hierarchy.

---

## 🚀 Key Features

### 1. Three-Column Elevated Student Dashboard
- **Left Navigation Rail**: User profile capsule, categorized route links, quick accessibility toggles, and live FastAPI connection indicator.
- **Main Center Workspace**:
  - Warm student greeting (`Good morning, Maya! 👋`) with animated mascot **Bridgey**.
  - Motivational streak banner (`🔥 7 Day Streak! Top 5% of active learners`).
  - 4-Up Pastel Metric Stat Tiles: Level, Streak, Rank, and XP counters.
  - Active course pathways with interactive progress bars.
  - Daily challenge with interactive claim & confetti celebration.
  - Learning efficiency circular donut ring gauge.
- **Right Activity Rail**:
  - Interactive 30-day monthly activity calendar heatmap.
  - Weekly gamified leaderboard with Top-3 podium showcase and current user spotlight.
  - Sign of the Day widget (`"Thank You" / धन्यवाद`) with instant 3D demo.

### 2. Multi-Modal AI Tutor Workspace
- **Multi-Modal Interaction**: Type, speak via voice recognition (`webkitSpeechRecognition`), tap AAC tiles, or sign into the camera.
- **Comprehension Modes**: Simple, Detailed, Step-by-Step, and Visual Analogies.
- **Synced 3D Avatar Kinematics**: Every AI response syncs sign-language tokens to the 3D robot avatar.
- **Audio Narration**: Click-to-speak synthesis for every explanation with adjustable speech rate.

### 3. Sign Language Studio
- **Live Webcam Sensor**: Real camera access (`navigator.mediaDevices.getUserMedia`) with frame landmark overlays and start/stop controls.
- **ISL Recognition Engine**: Streams video frames to `POST /api/v1/sign/recognize` with confidence scoring.
- **Interactive Practice Challenges**: Prompts learners to gesture target signs, verifies them, and rewards XP upon accuracy.
- **Sign Dictionary**: Curated library of 26 alphabet letters and 30+ everyday ISL words with Hindi translations and 3D preview.

### 4. 3D Sign-Language Avatar (Three.js)
- Custom WebGL humanoid robot **BridgeBot** with articulated head, torso, shoulders, arms, wrists, and hand joints.
- Realistic kinematics for verified signs: `HELLO`, `NAMASTE`, `THANK YOU`, `YES`, `HELP`, `GOOD`, `A`, `B`, `C`.
- Animation controls: Play, Pause, Replay, Speed adjustment (0.5x, 1x, 1.5x), language indicator, and missing asset fallback notices.

### 5. Alternative & Augmentative Communication (AAC)
- High-contrast, large-button phrase grid categorized into Greetings, Needs, Questions, and Feelings.
- Tapping any tile triggers speech synthesis and passes the phrase to the AI tutor.

### 6. Quizzes & Gamification
- AI-generated multiple-choice questions with sign hints and concept explanations.
- Milestone badges, XP history breakdown, and official **Certificate of Inclusive Mastery** (printable and viewable).

### 7. Core Accessibility
- Text size presets: Normal (100%), Large (115%), Extra Large (125%).
- High-contrast mode exceeding WCAG AAA standards.
- Reduced motion toggle disabling spring physics and particle confetti.
- ARIA live polite region for screen readers.
- Zero medical documentation barrier for selecting accommodations.

---

## 🔌 FastAPI Backend Integration

EduBridge AI is built to connect with the Python FastAPI backend service.

### Environment Variable
Configure your backend base URL in `.env`:
```env
VITE_API_BASE_URL="http://localhost:8000"
```
Or customize it live in the app via the **FastAPI Backend Inspector** modal (accessible from the sidebar or profile page).

### Documented FastAPI Endpoints
| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health status of application, DB, AI Tutor, and models |
| `POST` | `/api/v1/auth/register` | Register student with self-selected accommodations |
| `POST` | `/api/v1/auth/login` | Authenticate credentials & return JWT tokens |
| `GET` | `/api/v1/users/me` | Fetch authenticated learner profile |
| `PUT` | `/api/v1/accessibility/preferences` | Update accessibility preferences & accommodations |
| `POST` | `/api/v1/tutor/chat` | Multi-modal tutor dialogue (text, voice, sign, AAC) |
| `GET` | `/api/v1/tutor/conversations` | Retrieve student conversation history |
| `POST` | `/api/v1/sign-language/sessions` | Create real-time sign recognition session |
| `POST` | `/api/v1/sign-language/sessions/{id}/frames` | Send webcam video frame for real-time ISL detection |
| `GET` | `/api/v1/sign-language/vocabulary` | List 39 verified ISL gesture vocabulary |
| `POST` | `/api/v1/avatar/translate` | Translate text to ISL gloss sequence & timing |
| `GET` | `/api/v1/avatar/animation/{sign_id}` | Retrieve 3D kinematic keyframe tokens |
| `GET` | `/api/v1/gamification/profile` | Fetch dashboard metrics, streaks, XP & rank |
| `GET` | `/api/v1/gamification/leaderboard` | Retrieve weekly student leaderboard |
| `POST` | `/api/v1/gamification/quiz/submit` | Submit answers and calculate XP & streak awards |

### Built-in Resilient Fallback Engine
When the FastAPI backend is offline or starting up, EduBridge AI automatically switches to a high-fidelity local fallback engine so testing and evaluation can proceed uninterrupted without broken UI states.

---

## 🛠️ Setup & Development

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Start Local Development Server
```bash
npm run dev
```
The server will start at `http://localhost:3000`.

### 3. Build for Production
```bash
npm run build
```

### 4. Running the Companion FastAPI Backend
In your backend repository:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Open EduBridge AI and click **FastAPI Backend** in the sidebar to verify connection health.

---

## 👥 Demo Evaluator Personas
For rapid evaluation across different accessibility requirements, click the persona pill in the top header:
- **🤟 Maya Patel**: Hearing impairment, captions enabled, ISL 3D avatar active.
- **💬 Alex Rivera**: Speech impairment / non-speaking, AAC board priority, voice synthesizer active.
- **👁️ Samira Sen**: Visual impairment, high-contrast theme, enlarged text, screen-reader optimized.
