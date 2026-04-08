-- prisma/migrations/0001_init/migration.sql
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'CANCELLED');
CREATE TYPE "Genre" AS ENUM (
  'ACTION', 'COMEDY', 'DRAMA', 'HORROR', 'THRILLER',
  'ROMANCE', 'SCIENCE_FICTION', 'ANIMATION', 'DOCUMENTARY', 'FANTASY'
);

-- CreateTable: users
CREATE TABLE "users" (
  "id"           TEXT         NOT NULL,
  "email"        TEXT         NOT NULL,
  "passwordHash" TEXT         NOT NULL,
  "name"         TEXT         NOT NULL,
  "role"         "Role"       NOT NULL DEFAULT 'USER',
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateTable: movies
CREATE TABLE "movies" (
  "id"          TEXT         NOT NULL,
  "title"       TEXT         NOT NULL,
  "description" TEXT         NOT NULL,
  "posterUrl"   TEXT,
  "durationMin" INTEGER      NOT NULL,
  "genre"       "Genre"      NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable: halls
CREATE TABLE "halls" (
  "id"        TEXT         NOT NULL,
  "name"      TEXT         NOT NULL,
  "rows"      INTEGER      NOT NULL,
  "columns"   INTEGER      NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "halls_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "halls_name_key" ON "halls"("name");

-- CreateTable: showtimes
CREATE TABLE "showtimes" (
  "id"            TEXT           NOT NULL,
  "movieId"       TEXT           NOT NULL,
  "hallId"        TEXT           NOT NULL,
  "startsAt"      TIMESTAMP(3)   NOT NULL,
  "endsAt"        TIMESTAMP(3)   NOT NULL,
  "priceAmount"   DECIMAL(10,2)  NOT NULL,
  "priceCurrency" TEXT           NOT NULL DEFAULT 'USD',
  "createdAt"     TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3)   NOT NULL,
  CONSTRAINT "showtimes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "showtimes_movieId_fkey" FOREIGN KEY ("movieId")
    REFERENCES "movies"("id") ON DELETE CASCADE,
  CONSTRAINT "showtimes_hallId_fkey" FOREIGN KEY ("hallId")
    REFERENCES "halls"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "showtimes_hallId_startsAt_key" ON "showtimes"("hallId","startsAt");
CREATE INDEX "showtimes_startsAt_idx" ON "showtimes"("startsAt");

-- CreateTable: seats
CREATE TABLE "seats" (
  "id"         TEXT    NOT NULL,
  "showtimeId" TEXT    NOT NULL,
  "row"        INTEGER NOT NULL,
  "column"     INTEGER NOT NULL,
  "label"      TEXT    NOT NULL,
  "isReserved" BOOLEAN NOT NULL DEFAULT false,
  "version"    INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "seats_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "seats_showtimeId_fkey" FOREIGN KEY ("showtimeId")
    REFERENCES "showtimes"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "seats_showtimeId_row_column_key" ON "seats"("showtimeId","row","column");
CREATE INDEX "seats_showtimeId_isReserved_idx" ON "seats"("showtimeId","isReserved");

-- CreateTable: reservations
CREATE TABLE "reservations" (
  "id"          TEXT                NOT NULL,
  "userId"      TEXT                NOT NULL,
  "showtimeId"  TEXT                NOT NULL,
  "seatId"      TEXT                NOT NULL,
  "status"      "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
  "amountPaid"  DECIMAL(10,2)       NOT NULL,
  "currency"    TEXT                NOT NULL DEFAULT 'USD',
  "createdAt"   TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)        NOT NULL,
  CONSTRAINT "reservations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reservations_userId_fkey"     FOREIGN KEY ("userId")     REFERENCES "users"("id"),
  CONSTRAINT "reservations_showtimeId_fkey" FOREIGN KEY ("showtimeId") REFERENCES "showtimes"("id"),
  CONSTRAINT "reservations_seatId_fkey"     FOREIGN KEY ("seatId")     REFERENCES "seats"("id")
);
CREATE UNIQUE INDEX "reservations_seatId_key" ON "reservations"("seatId");
CREATE INDEX "reservations_userId_idx"     ON "reservations"("userId");
CREATE INDEX "reservations_showtimeId_idx" ON "reservations"("showtimeId");