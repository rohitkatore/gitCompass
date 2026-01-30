# 🧭 GitCompass

> **AI-Powered Open Source GitHub Repository Finder**

GitCompass is an intelligent web platform that helps developers discover their perfect open-source contribution opportunities using NLP and AI. Upload your resume or enter your skills, and let our AI match you with repositories that align with your expertise.

![GitCompass](https://via.placeholder.com/1200x600?text=GitCompass+Hero+Image)

## ✨ Features

- 🎯 **Smart Repository Matching** - AI-powered semantic matching using Sentence-BERT
- 📄 **Resume Parsing** - Upload PDF/DOC and automatically extract skills using NLP
- 🤖 **AI Contribution Guides** - Personalized guides generated with GPT
- 🔐 **GitHub OAuth** - Seamless authentication with your GitHub account
- 💾 **Save & Track** - Bookmark repositories and track your contributions
- 🌐 **Modern UI** - Beautiful, animated interface with glassmorphism design

## 🏗️ Architecture

```
gitCompass/
├── frontend/          # React + Vite + Tailwind CSS
├── backend/           # Express.js API Gateway
├── ai-engine/         # Python FastAPI Microservice
└── package.json       # Root package for monorepo management
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7, Tailwind CSS, Framer Motion |
| Backend | Express 5, Passport.js, Mongoose |
| AI Engine | FastAPI, spaCy, Sentence-BERT, OpenAI |
| Database | MongoDB Atlas |
| Auth | GitHub OAuth 2.0 |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- MongoDB Atlas account (or Docker)
- GitHub OAuth App

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/rohitkatore/gitCompass.git
cd gitCompass

# Copy environment file and configure
cp .env.docker.example .env
# Edit .env with your credentials (GitHub OAuth, Gemini API key, etc.)

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

Access the application:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **AI Engine**: http://localhost:8000

To stop:
```bash
docker-compose down
```

### Option 2: Manual Setup

#### 1. Clone & Install

```bash
git clone https://github.com/rohitkatore/gitCompass.git
cd gitCompass

# Install all dependencies
npm run install:all

# Install Python dependencies
cd ai-engine
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

#### 2. Configure Environment

Copy the example env files and fill in your credentials:

```bash
# Backend
cp backend/.env.example backend/.env

# AI Engine
cp ai-engine/.env.example ai-engine/.env
```

Required environment variables:

**Backend (.env)**
```env
MONGODB_URI=mongodb+srv://...
SESSION_SECRET=your-secret-key
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

**AI Engine (.env)**
```env
OPENAI_API_KEY=your-openai-key
GITHUB_TOKEN=your-github-token
```

### 3. Start Development Servers

```bash
# Start all services (from root)
npm run dev

# Or start individually:
npm run dev:frontend   # http://localhost:5173
npm run dev:backend    # http://localhost:5000
npm run dev:ai         # http://localhost:8000
```

## 📁 Project Structure

### Frontend (`/frontend`)

```
src/
├── components/
│   ├── ui/            # Reusable UI components
│   ├── layout/        # Layout components
│   └── effects/       # Visual effects
├── pages/             # Route pages
├── api/               # API client
└── lib/               # Utilities
```

### Backend (`/backend`)

```
src/
├── config/            # Database & auth config
├── models/            # Mongoose schemas
├── routes/            # API routes
└── middleware/        # Express middleware
```

### AI Engine (`/ai-engine`)

```
├── main.py            # FastAPI application
├── services/
│   ├── resume_processor.py    # NLP skill extraction
│   ├── skill_matcher.py       # Semantic matching
│   └── guide_generator.py     # AI guide generation
└── requirements.txt
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/github` | Initiate GitHub OAuth |
| GET | `/api/auth/github/callback` | OAuth callback |
| GET | `/api/auth/user` | Get current user |
| POST | `/api/auth/logout` | Logout |

### Resume
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resume/upload` | Upload resume file |
| GET | `/api/resume/skills` | Get extracted skills |

### Repositories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/repositories/search` | Search repositories |
| GET | `/api/repositories/recommendations` | Get AI recommendations |
| GET | `/api/repositories/:owner/:repo` | Get repository details |

### Guides
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/guides/generate` | Generate contribution guide |

## 🎨 UI Components

The project includes a comprehensive UI component library:

- **Button** - Multiple variants (primary, secondary, outline, ghost)
- **Card** - Glassmorphism cards with headers and footers
- **Input** - Form inputs with validation states
- **Loading** - Spinners, dots, pulse, and skeleton loaders

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [GitHub API](https://docs.github.com/en/rest)
- [OpenAI](https://openai.com/)
- [Sentence Transformers](https://www.sbert.net/)
- [spaCy](https://spacy.io/)

---

<p align="center">
  Made with ❤️ by the GitCompass Team
</p>
