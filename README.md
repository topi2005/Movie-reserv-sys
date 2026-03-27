# 🎬 Movie Reservation Service

A production-ready REST API backend for a cinema seat reservation platform. Built with **Node.js**, **TypeScript**, **Express**, **Prisma ORM**, and **PostgreSQL**.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Data Model](#data-model)
- [Design Decisions](#design-decisions)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Project Structure](#project-structure)

---

## Architecture Overview

```
┌─────────────┐     HTTP      ┌──────────────────────────────────────┐
│   Client    │ ───────────► │           Express API Server          │
└─────────────┘              │                                        │
                             │  Routes → Middleware → Controllers     │
                             │              ↓                         │
                             │          Services                      │
                             │     (Business Logic Layer)             │
                             │              ↓                         │
                             │    Prisma ORM (Data Access Layer)      │
                             └──────────────┬───────────────────────-┘
                                            │
                                            ▼
                                    ┌──────────────┐
                                    │  PostgreSQL   │
                                    └──────────────┘
```

### Layer Responsibilities

| Layer | Files | Responsibility |
|---|---|---|
| **Routes** | `src/routes/` | URL mapping, validation rules, middleware chains |
| **Middleware** | `src/middleware/` | Auth (JWT), input validation, error handling |
| **Controllers** | `src/controllers/` | HTTP request/response handling |
| **Services** | `src/services/` | Business logic, data orchestration |
| **Prisma** | `prisma/schema.prisma` | Data model, migrations, type generation |
| **Utils** | `src/utils/` | JWT, error types, response helpers, file upload |

---

## Data Model

```
┌──────────┐       ┌────────────┐       ┌──────────┐
│  users   │       │   movies   │       │  halls   │
│──────────│       │────────────│       │──────────│
│ id       │       │ id         │       │ id       │
│ email    │       │ title      │       │ name     │
│ name     │       │ description│       │ rows     │
│ role     │       │ genre      │       │ columns  │
│ passHash │       │ durationMin│       └────┬─────┘
└────┬─────┘       │ posterUrl  │            │
     │             └─────┬──────┘            │
     │                   │ 1:many            │ 1:many
     │                   ▼                   ▼
     │             ┌──────────────────────────────┐
     │             │         showtimes            │
     │             │──────────────────────────────│
     │             │ id          priceAmount       │
     │             │ movieId     priceCurrency     │
     │             │ hallId      startsAt / endsAt │
     │             └──────┬───────────────────────┘
     │                    │ 1:many (generated on creation)
     │                    ▼
     │             ┌──────────────┐
     │             │    seats     │
     │             │──────────────│
     │             │ id           │
     │             │ showtimeId   │
     │             │ row / column │
     │             │ label        │
     │             │ isReserved   │
     │             └──────┬───────┘
     │                    │ 1:1
     │  1:many            ▼
     └──────────► ┌──────────────────┐
                  │   reservations   │
                  │──────────────────│
                  │ id               │
                  │ userId           │
                  │ showtimeId       │
                  │ seatId  (unique) │
                  │ status           │
                  │ amountPaid       │
                  └──────────────────┘
```

### Key Relationships

- A **Movie** has many **Showtimes** (cascade delete)
- A **Hall** has many **Showtimes** (no overlap enforced at service + DB level)
- A **Showtime** has many **Seats** (auto-generated on showtime creation)
- A **Seat** has at most one **Reservation** (`@unique` constraint)
- A **User** has many **Reservations**

---

## Design Decisions

### 1. Preventing Double-Booking (Race Condition Safety)

The most critical requirement. We use **two complementary mechanisms**:

**a) Database-level**: The `reservations.seatId` column has a `@unique` constraint. Even if two concurrent transactions try to insert a reservation for the same seat, the second will fail with a unique constraint violation (P2002), which is caught and translated to a `409 Seat Unavailable` error.

**b) Application-level** (PostgreSQL): Inside `ReservationService.reserve()` we use an **interactive Prisma transaction** with `SELECT ... FOR UPDATE` to lock the seat rows before reading them. This prevents phantom reads — two transactions cannot both see `isReserved = false` for the same seat.

```
Transaction A          Transaction B
─────────────          ─────────────
SELECT seat FOR UPDATE
  (lock acquired)
                       SELECT seat FOR UPDATE
                         (BLOCKED — waiting for A)
UPDATE seat isReserved=true
INSERT reservation
COMMIT (lock released)
                         (now reads isReserved=true)
                         → throws SeatUnavailableError
```

**c) Optimistic locking field**: The `seats.version` column is included for scenarios where optimistic locking is preferred over pessimistic (e.g., high-read, low-contention systems).

### 2. Hall Overlap Prevention

When creating a showtime, the service checks for overlapping showtimes in the same hall including a **15-minute buffer** for hall cleanup. If any overlap is found, a `409 Conflict` is returned before inserting.

### 3. Seat Generation Strategy

Seats are **not pre-defined** globally. Instead, they are created **per showtime** when the showtime is created. This means:
- Hall layout changes don't affect past or future already-created showtimes
- The `seats` table only grows as needed
- Each seat record is showtime-scoped, enabling different pricing tiers per seat in the future

### 4. Role-Based Access Control

Two roles: `USER` and `ADMIN`.

| Action | USER | ADMIN |
|---|:---:|:---:|
| Register / Login | ✅ | ✅ |
| Browse movies & showtimes | ✅ | ✅ |
| Reserve & cancel own seats | ✅ | ✅ |
| Add / edit / delete movies | ❌ | ✅ |
| Create / delete showtimes | ❌ | ✅ |
| View all reservations | ❌ | ✅ |
| Revenue & capacity report | ❌ | ✅ |
| Promote users to admin | ❌ | ✅ |

The initial admin is created via the seed script. Only admins can promote other users.

### 5. Cancellation Policy

Users can cancel reservations only for **upcoming** showtimes. Cancelling:
1. Sets `reservation.status = CANCELLED`
2. Sets `seat.isReserved = false` (freeing the seat)

Both happen atomically in a Prisma transaction.

### 6. Reporting

The `/api/admin/reports` endpoint aggregates per-showtime stats in a single query using Prisma's `_count` and `include` — no raw SQL needed for reporting. For larger datasets, this query can be optimized with a materialized view or a dedicated analytics store.

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL ≥ 14
- npm ≥ 9

### 1. Clone & Install

```bash
git clone <repo-url>
cd movie-reservation
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
```

### 3. Run Migrations & Seed

```bash
npm run db:migrate    # runs Prisma migrations
npm run db:seed       # creates admin user, halls, sample movies & showtimes
```

### 4. Start Development Server

```bash
npm run dev
# Server runs at http://localhost:3000
```

### 5. Build for Production

```bash
npm run build
npm start
```

### Default Admin Credentials (from seed)

| Field | Value |
|---|---|
| Email | admin@cinema.com |
| Password | Admin@1234 |

---

## API Reference

### Base URL: `http://localhost:3000/api`

All authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
```

All responses follow the envelope format:
```json
{ "success": true, "data": { ... } }
{ "success": true, "data": [...], "meta": { "total": 50, "page": 1, "limit": 20, "totalPages": 3 } }
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Description" } }
```

---

### Auth

#### `POST /auth/register`
Register a new user account.

**Body:**
```json
{
  "email": "jane@example.com",
  "password": "Secret@99",
  "name": "Jane Doe"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "clx...", "email": "jane@example.com", "name": "Jane Doe", "role": "USER" },
    "token": "eyJhbGci..."
  }
}
```

---

#### `POST /auth/login`
Authenticate and receive a JWT.

**Body:**
```json
{ "email": "jane@example.com", "password": "Secret@99" }
```

**Response `200`:** Same shape as register.

---

#### `GET /auth/me` 🔒
Get the currently authenticated user's profile.

---

#### `PATCH /auth/users/:userId/promote` 🔒 (Admin)
Promote a user to the ADMIN role.

---

### Movies

#### `GET /movies`
List all movies. Supports filtering and pagination.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `genre` | enum | Filter by genre (e.g. `ACTION`, `HORROR`) |
| `search` | string | Partial title search (case-insensitive) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20, max: 50) |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "title": "Galactic Rift",
      "description": "An epic space opera...",
      "genre": "SCIENCE_FICTION",
      "durationMin": 148,
      "posterUrl": "/uploads/1234-poster.jpg",
      "_count": { "showtimes": 6 }
    }
  ],
  "meta": { "total": 4, "page": 1, "limit": 20, "totalPages": 1 }
}
```

---

#### `GET /movies/:id`
Get a single movie with its upcoming showtimes and availability.

---

#### `POST /movies` 🔒 (Admin)
Add a new movie. Accepts `multipart/form-data` for poster upload.

**Body (form-data):**

| Field | Type | Required |
|---|---|---|
| `title` | string | ✅ |
| `description` | string | ✅ |
| `durationMin` | integer | ✅ |
| `genre` | enum | ✅ |
| `poster` | file (JPEG/PNG/WebP) | ❌ |

---

#### `PATCH /movies/:id` 🔒 (Admin)
Update movie details. All fields optional.

---

#### `DELETE /movies/:id` 🔒 (Admin)
Delete a movie (cascades to showtimes and seats).

---

### Showtimes

#### `GET /showtimes`
List upcoming showtimes with seat availability counts.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `date` | `YYYY-MM-DD` | Filter by specific date |
| `movieId` | string | Filter by movie |
| `hallId` | string | Filter by hall |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "startsAt": "2026-03-28T10:00:00.000Z",
      "endsAt": "2026-03-28T12:28:00.000Z",
      "priceAmount": "12.50",
      "priceCurrency": "USD",
      "totalSeats": 80,
      "reservedSeats": 23,
      "availableSeats": 57,
      "movie": { "title": "Galactic Rift", "genre": "SCIENCE_FICTION" },
      "hall": { "name": "Hall A", "rows": 8, "columns": 10 }
    }
  ]
}
```

---

#### `GET /showtimes/:id`
Get a showtime with the full seat map (each seat's label and availability).

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "movie": { "title": "Galactic Rift" },
    "hall": { "name": "Hall A", "rows": 8, "columns": 10 },
    "seats": [
      { "id": "s1", "row": 1, "column": 1, "label": "A1", "isReserved": false },
      { "id": "s2", "row": 1, "column": 2, "label": "A2", "isReserved": true },
      ...
    ]
  }
}
```

---

#### `POST /showtimes` 🔒 (Admin)
Create a new showtime. Automatically generates seats and checks for hall overlap.

**Body:**
```json
{
  "movieId": "clx...",
  "hallId": "clx...",
  "startsAt": "2026-04-01T19:00:00.000Z",
  "priceAmount": 14.99,
  "priceCurrency": "USD"
}
```

**Errors:**
- `409` if the hall has an overlapping showtime (including 15-min buffer)
- `422` if `startsAt` is in the past

---

#### `DELETE /showtimes/:id` 🔒 (Admin)
Delete a showtime. Fails with `409` if there are confirmed reservations.

---

### Reservations

#### `POST /reservations` 🔒
Reserve one or more seats for a showtime.

**Body:**
```json
{
  "showtimeId": "clx...",
  "seatIds": ["s1", "s5", "s6"]
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "r1",
      "status": "CONFIRMED",
      "amountPaid": "12.50",
      "seat": { "label": "A1", "row": 1, "column": 1 },
      "showtime": {
        "startsAt": "2026-03-28T10:00:00.000Z",
        "movie": { "title": "Galactic Rift" },
        "hall": { "name": "Hall A" }
      }
    }
  ]
}
```

**Errors:**
- `409 SEAT_UNAVAILABLE` if any seat was taken between browsing and submitting
- `409 CONFLICT` if user already has a reservation for this showtime
- `422` if showtime is in the past or `seatIds` is empty/too large

---

#### `GET /reservations/me` 🔒
Get the current user's reservation history.

**Query params:** `page`, `limit`, `status` (`CONFIRMED` | `CANCELLED`)

---

#### `DELETE /reservations/:id` 🔒
Cancel a reservation. Only works for upcoming showtimes.

---

### Admin Endpoints

#### `GET /admin/reservations` 🔒 (Admin)
List all reservations across all users.

**Query params:** `page`, `limit`, `status`, `showtimeId`

---

#### `GET /admin/reports` 🔒 (Admin)
Revenue and capacity report.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `fromDate` | ISO date | Start of report window |
| `toDate` | ISO date | End of report window |
| `movieId` | string | Filter by movie |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalShowtimes": 12,
      "totalReservations": 347,
      "totalRevenue": "4337.50",
      "avgOccupancyPct": 72
    },
    "showtimes": [
      {
        "showtimeId": "clx...",
        "movie": "Galactic Rift",
        "genre": "SCIENCE_FICTION",
        "hall": "IMAX 1",
        "startsAt": "2026-03-26T10:00:00.000Z",
        "totalSeats": 180,
        "reservedSeats": 142,
        "availableSeats": 38,
        "occupancyPct": 79,
        "revenue": "1775.00",
        "currency": "USD"
      }
    ]
  }
}
```

---

## Error Handling

All errors return a consistent JSON body:

```json
{
  "success": false,
  "error": {
    "code": "SEAT_UNAVAILABLE",
    "message": "Seat A3 is no longer available"
  }
}
```

| HTTP Status | Code | Meaning |
|---|---|---|
| `400` | `BAD_REQUEST` | Malformed request |
| `401` | `UNAUTHORIZED` | Missing or invalid token |
| `403` | `FORBIDDEN` | Insufficient role |
| `404` | `NOT_FOUND` | Resource doesn't exist |
| `409` | `CONFLICT` | Duplicate or state conflict |
| `409` | `SEAT_UNAVAILABLE` | Seat taken by another user |
| `422` | `VALIDATION_ERROR` | Input failed validation rules |
| `429` | `RATE_LIMITED` | Too many requests |
| `500` | `INTERNAL_ERROR` | Unexpected server error |

---

## Project Structure

```
movie-reservation/
├── prisma/
│   ├── schema.prisma          # Data model & DB config
│   ├── seed.ts                # Admin, halls, movies, showtimes
│   └── migrations/
│       └── 0001_init/
│           └── migration.sql  # Raw SQL for reference
│
├── src/
│   ├── server.ts              # Entry point, graceful shutdown
│   ├── app.ts                 # Express app, middleware, routes
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── movie.routes.ts
│   │   ├── showtime.routes.ts
│   │   ├── reservation.routes.ts
│   │   └── admin.routes.ts
│   │
│   ├── controllers/           # HTTP layer (req/res)
│   │   ├── auth.controller.ts
│   │   ├── movie.controller.ts
│   │   ├── showtime.controller.ts
│   │   └── reservation.controller.ts
│   │
│   ├── services/              # Business logic
│   │   ├── auth.service.ts
│   │   ├── movie.service.ts
│   │   ├── showtime.service.ts
│   │   └── reservation.service.ts
│   │
│   ├── middleware/
│   │   ├── auth.ts            # JWT authenticate + authorize
│   │   └── validate.ts        # express-validator runner
│   │
│   └── utils/
│       ├── prisma.ts          # Singleton Prisma client
│       ├── jwt.ts             # sign / verify tokens
│       ├── errors.ts          # Error classes + global handler
│       ├── response.ts        # sendSuccess / sendPaginated
│       └── upload.ts          # Multer config for poster images
│
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## Extending the System

Some ideas for next steps:

| Feature | Approach |
|---|---|
| **Payment processing** | Add `paymentStatus` to reservations, integrate Stripe webhook |
| **Email notifications** | Queue jobs (Bull/BullMQ) on reservation confirmation/cancellation |
| **Seat pricing tiers** | Add `seatType` (STANDARD/PREMIUM/VIP) to `Seat` model |
| **Waitlist** | Track cancelled seats and notify waitlisted users |
| **Refresh tokens** | Store refresh token hash in DB, add `/auth/refresh` endpoint |
| **Caching** | Redis for movie listings and showtime seat counts |
| **Admin dashboard** | Front-end consuming `/admin/reports` |
| **Testing** | Jest + Prisma test DB + Supertest for integration tests |
