# SyncPoll

SyncPoll is a real-time audience polling platform for live events, meetings, classrooms, and interactive sessions. It allows organizers to create polls, share a join code or QR link, and collect live responses from participants in seconds.

The project is split into a Go backend and a React frontend, with Redis for real-time updates and MongoDB for persistent data storage.

## Features

- Create and manage polls in real time
- Live result updates as users vote
- QR code-based audience joining
- Fast, responsive React frontend
- Go + Gin backend with WebSocket support
- Redis-powered pub/sub updates and atomic vote tracking
- MongoDB persistence for polls, users, and results
- Docker-based local setup for fast onboarding

## Tech Stack

- Frontend: React, Vite, JavaScript
- Backend: Go, Gin
- Realtime layer: WebSocket + Redis Pub/Sub
- Database: MongoDB
- Containerization: Docker + Docker Compose

## Architecture

SyncPoll follows a simple multi-service architecture:

- `frontend/` – React app for the user interface
- `backend/` – Go backend handling API, auth, polling logic, and websocket events
- `docker-compose.yml` – local orchestration for MongoDB, Redis, backend, and frontend

## Project Structure

```text
SYNCPOLL/
├── backend/
│   ├── cmd/
│   ├── internal/
│   ├── pkg/
│   ├── .env.example
│   ├── Dockerfile
│   ├── go.mod
│   └── go.sum
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── README.md
├── docker-compose.yml
├── run-all.bat
├── run-backend.bat
├── run-frontend.bat
├── run-tunnel.bat
├── .gitignore
└── README.md
```

## Getting Started

### Option 1: Run with Docker Compose

From the repository root:

```bash
docker compose up --build
```

This will start:

- MongoDB on `localhost:27017`
- Redis on `localhost:6379`
- Backend on `localhost:8080`
- Frontend on `localhost:3000`

### Option 2: Run services individually

#### Backend

```bash
cd backend
cp .env.example .env
go mod download
go run ./cmd
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

The backend uses environment variables such as:

- `PORT`
- `MONGO_URI`
- `MONGO_DB_NAME`
- `REDIS_URI`
- `JWT_SECRET`
- `CORS_ORIGIN`

A sample configuration is provided in `backend/.env.example`.

## Default Access

Once running:

- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:8080`

## Use Cases

- Classrooms and training sessions
- Team meetings and decision-making polls
- Live events and audience interaction
- Q&A sessions with instant feedback

## License

This project is available for educational and personal use. If you plan to deploy or commercialize it, confirm the licensing details in your environment before production use.

## Notes

This repository includes Windows startup scripts (`run-all.bat`, `run-backend.bat`, `run-frontend.bat`, `run-tunnel.bat`) to simplify local execution on Windows machines.
