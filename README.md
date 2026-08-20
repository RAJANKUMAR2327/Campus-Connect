\# 🎓 CampusConnect



A full-stack college community platform built for students to connect, collaborate, and grow.



\*\*Live Demo:\*\* https://college-community-platform-omega.vercel.app



\## Features



\### Core Modules

\- 📚 \*\*Notes Sharing\*\* — Upload, search, like, bookmark, and download study notes

\- 🔍 \*\*Lost \& Found\*\* — Report and find lost items on campus

\- 📅 \*\*Events\*\* — Create and attend campus events

\- 🛍️ \*\*Marketplace\*\* — Buy and sell within campus

\- 💼 \*\*Placement\*\* — Share jobs, internships, and interview experiences



\### AI Features (Powered by Claude)

\- 🤖 \*\*AI Study Assistant\*\* — Chat with AI about any academic topic

\- 📝 \*\*AI Quiz Generator\*\* — Generate MCQs on any subject

\- 🎯 \*\*AI Career Assistant\*\* — Career roadmap, skill gap analysis, resume review

\- 📖 \*\*AI Note Summarizer\*\* — Summarize, create flashcards, mind maps



\### Advanced Features

\- 📊 \*\*Placement Dashboard\*\* — Analytics with charts (package trends, company stats)

\- 📄 \*\*Resume Builder\*\* — ATS-friendly resume with PDF export

\- 🔔 \*\*Notifications\*\* — Real-time notification system

\- 💬 \*\*Comments\*\* — Comment on notes and posts

\- 🔎 \*\*Global Search\*\* — Search across all modules (Ctrl+K)

\- 🌙 \*\*Dark Mode\*\* — System-aware theme toggle

\- 📱 \*\*Mobile Responsive\*\* — Hamburger menu, responsive grids

\- 🛡️ \*\*Admin Panel\*\* — User management, content moderation, analytics



\## Tech Stack



| Layer | Technology |

|-------|-----------|

| Frontend | React 19 + Vite + Tailwind CSS |

| Backend | Node.js + Express 4 |

| Database | MongoDB + Mongoose |

| Auth | JWT + bcryptjs |

| AI | Anthropic Claude Sonnet |

| File Upload | Cloudinary + Multer |

| Charts | Recharts |

| Deployment | Vercel (frontend) + Render (backend) |



\## Getting Started



\### Prerequisites

\- Node.js 18+

\- MongoDB (local or Atlas)

\- Cloudinary account

\- Anthropic API key



\### Backend Setup

```bash

cd server

npm install

cp .env.example .env  # fill in your values

npm run dev

```



\### Frontend Setup

```bash

cd client

npm install

npm run dev

```



\## Environment Variables



\### Server


MONGO_URI=

JWT_SECRET=

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=

CLIENT_URL=

## Secret handling

Never commit `.env` files or include them in shared ZIP archives. Configure staging and production values only in Render and Vercel, and rotate any credential that leaves its intended secret store.

