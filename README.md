# Microservices-Based Food Delivery System Architecture

A containerised, three-tier microservices food delivery application built as a group project. Customers browse restaurants, build a cart, and place orders; restaurant owners accept and manage those orders through the delivery workflow.

The entire stack — database, REST API, web frontend, and database administration client — is orchestrated with Docker Compose.

---

## Group Members & Responsibilities

| Member | Responsibility | Feature Branch | GitHub Profile |
| ------ | -------------- | -------------- | -------------- |
| **Thamiliny** | Backend REST API, PostgreSQL schema & seed, backend Docker container | `feature/backend-thamiliny` | [@Thamiliny](https://github.com/Thamiliny) |
| **Thanuja** | React frontend SPA, Nginx reverse proxy, smoke tests, UI components | `feature/frontend-thanuja` | [@Thanuja0506](https://github.com/Thanuja0506) |
| **Both** | Docker Compose orchestration, microservice architecture, documentation | `main` | Team Collaboration |

Each member developed on their dedicated feature branch. Both feature branches are merged into `main` using `--no-ff` merge commits to preserve clear commit and branch history:

```bash
git log --graph --oneline --all      # view branch graph and merge commits
git shortlog -sn --all               # view commit distribution per author
```

---

## 1. System Architecture

```
                 ┌──────────────────────────────────────────────────┐
   Browser ─────▶│  frontend  (nginx :80  →  host :8080)            │
                 │  · serves compiled React SPA (Vite + Context API)│
                 │  · reverse-proxies /api/* to backend             │
                 └───────────────────────┬──────────────────────────┘
                                         │  http://backend:4000
                 ┌───────────────────────▼──────────────────────────┐
                 │  backend  (Node.js + Express :4000 → host :4000)  │
                 │  · JWT authentication & role-based access control│
                 │  · restaurants, menus, orders, health probes     │
                 └───────────────────────┬──────────────────────────┘
                                         │  postgres://db:5432
                 ┌───────────────────────▼──────────────────────────┐
                 │  db  (PostgreSQL 16 :5432 → host :5432)          │
                 │  · automated schema + seed migration             │
                 │  · data persisted in named volume `db_data`      │
                 └──────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
.
├── backend/                  # Node.js + Express REST API
│   ├── src/
│   │   ├── config/           # Database & environment configurations
│   │   ├── middleware/       # Auth (JWT), Validation, Error handling
│   │   ├── modules/          # Auth, Health, Menu, Orders, Restaurants, Users
│   │   └── utils/            # ApiError, Async handler, Password hashing
│   ├── tests/                # Automated API test suites
│   ├── Dockerfile            # Multi-stage production container
│   └── package.json
├── database/                 # Database migrations
│   └── init/
│       ├── 01-schema.sql     # PostgreSQL relational schema
│       └── 02-seed.sql       # Demo users, restaurants, menu items
├── docker/                   # Reverse proxy and TLS configurations
│   ├── nginx/
│   │   └── default.conf      # Nginx routing and proxy configuration
│   └── ca/
├── frontend/                 # React SPA (Vite)
│   ├── src/
│   │   ├── api/              # Axios client & endpoints
│   │   ├── components/       # Reusable UI & Navbar components
│   │   ├── context/          # AuthContext & CartContext
│   │   ├── pages/            # Login, Register, Dashboard, Orders, Menus
│   │   └── styles/           # Global design system & styles
│   ├── Dockerfile            # Multi-stage Nginx build container
│   └── package.json
├── scripts/
│   └── api-smoke-test.sh     # Automated endpoint validation script
├── docker-compose.yml        # Multi-service container orchestration
├── .env.example              # Environment variables template
└── README.md
```

---

## 3. Quick Start & Execution

### Prerequisites
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed.

### Running with Docker Compose
1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Build and start all services:
   ```bash
   docker compose up -d --build
   ```
3. Access the services:
   - **Frontend App**: [http://localhost:8080](http://localhost:8080)
   - **Backend API**: [http://localhost:4000/api/health](http://localhost:4000/api/health)
   - **Adminer DB Client**: [http://localhost:8081](http://localhost:8081)

4. Stop all services:
   ```bash
   docker compose down
   ```

---

## 4. Default Credentials (Seeded Data)

| Role | Email | Password |
| ---- | ----- | -------- |
| **Customer** | `customer@quickbite.com` | `Customer@123` |
| **Restaurant Owner** | `owner@quickbite.com` | `Owner@123` |
| **Driver / Courier** | `driver@quickbite.com` | `Driver@123` |
| **Administrator** | `admin@quickbite.com` | `Admin@123` |
