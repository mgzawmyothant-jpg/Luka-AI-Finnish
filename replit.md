# Luka AI - Finnish Master

## Overview

Luka AI is a Finnish language learning assistant that responds exclusively in Myanmar (Burmese) language. It uses Google Gemini AI for language analysis, OCR, and conversational assistance.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (dark blue/cyan theme)
- **API framework**: Express 5
- **AI**: Google Gemini (via @google/genai)
- **Document export**: docx
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server with Gemini routes
│   └── luka-ai/            # React + Vite frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Features

1. **Search Tab** - Analyze Finnish words: meaning, word class, verb type (1-6), stem changes, conjugation tables, 5 formal + 5 casual examples in Myanmar language
2. **OCR Tab** - Upload an image of Finnish text, AI analyzes it in PART 1-4 format
3. **Luka Assistant Tab** - Chat with LUKA AI assistant with voice and image support
4. **History/Export Tab** - View past queries, download .docx files

## API Endpoints

All API routes are under `/api/luka/`:
- `POST /api/luka/search` - Analyze a Finnish word (Professor mode)
- `POST /api/luka/ocr` - Analyze a Finnish text image
- `POST /api/luka/chat` - Chat with Luka Assistant (with voice/image support)
- `GET /api/luka/history` - Get query history
- `DELETE /api/luka/history` - Clear history
- `POST /api/luka/export` - Export text to .docx (returns binary)

## Settings

Users can configure in the Settings drawer:
- Gemini API Key (stored in localStorage)
- Model version (gemini-2.0-flash, gemini-2.0-flash-thinking-exp, gemini-1.5-pro)

## AI System Prompts

- **Professor Mode** (Search/OCR): Acts as Finnish language professor, responds in Myanmar language with detailed linguistic analysis
- **Assistant Mode** (Chat): High-intelligence assistant, supports multimodal inputs, responds in Myanmar language
