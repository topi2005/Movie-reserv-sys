// prisma/seed.ts
import { PrismaClient, Genre, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱  Seeding database…");

  // ── Admin user ───────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@cinema.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@1234";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  const admin = existingAdmin ?? await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      name: process.env.SEED_ADMIN_NAME ?? "System Admin",
      role: Role.ADMIN,
    },
  });
  console.log(`✅  Admin ready → ${admin.email}`);

  // ── Halls ────────────────────────────────────────────────
  const hallsData = [
    { name: "Hall A",  rows: 8,  columns: 10 },
    { name: "Hall B",  rows: 10, columns: 12 },
    { name: "IMAX 1",  rows: 12, columns: 15 },
  ];

  const halls = await Promise.all(
    hallsData.map(async (h) => {
      const existing = await prisma.hall.findUnique({ where: { name: h.name } });
      return existing ?? prisma.hall.create({ data: h });
    })
  );
  console.log(`✅  ${halls.length} halls ready`);

  // ── Movies ───────────────────────────────────────────────
  const moviesData: Array<{
    title: string;
    description: string;
    genre: Genre;
    durationMin: number;
  }> = [
    {
      title: "Galactic Rift",
      description: "An epic space opera spanning three galaxies.",
      genre: Genre.SCIENCE_FICTION,
      durationMin: 148,
    },
    {
      title: "Laughing Matters",
      description: "A stand-up comedian navigates a mid-life crisis.",
      genre: Genre.COMEDY,
      durationMin: 102,
    },
    {
      title: "The Last Frontier",
      description: "A gripping western about justice and redemption.",
      genre: Genre.ACTION,
      durationMin: 132,
    },
    {
      title: "Whispers in the Dark",
      description: "A psychological horror set in a haunted sanitarium.",
      genre: Genre.HORROR,
      durationMin: 115,
    },
  ];

  const movies = await Promise.all(
    moviesData.map(async (m) => {
      const existing = await prisma.movie.findFirst({ where: { title: m.title } });
      return existing ?? prisma.movie.create({ data: m });
    })
  );
  console.log(`✅  ${movies.length} movies ready`);

  // ── Showtimes (next 3 days) ───────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const timeSlots = [10, 14, 18, 21]; // hours

  let showtimeCount = 0;
  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
    for (const movie of movies) {
      for (const hour of timeSlots.slice(0, 2)) {
        // 2 slots per movie per day to keep seed small
        const hall = halls[Math.floor(Math.random() * halls.length)];
        const startsAt = new Date(today);
        startsAt.setDate(startsAt.getDate() + dayOffset);
        startsAt.setHours(hour, 0, 0, 0);
        const endsAt = new Date(
          startsAt.getTime() + movie.durationMin * 60 * 1000
        );

        // Skip if hall already has a showtime starting at this time
        const existing = await prisma.showtime.findUnique({
          where: { hallId_startsAt: { hallId: hall.id, startsAt } },
        });
        if (existing) continue;

        const showtime = await prisma.showtime.create({
          data: {
            movieId: movie.id,
            hallId: hall.id,
            startsAt,
            endsAt,
            priceAmount: 12.5,
          },
        });

        // Create seats for this showtime
        await createSeatsForShowtime(showtime.id, hall.rows, hall.columns);
        showtimeCount++;
      }
    }
  }
  console.log(`✅  ${showtimeCount} showtimes + seats created`);
  console.log("🎉  Seeding complete!");
}

export async function createSeatsForShowtime(
  showtimeId: string,
  rows: number,
  columns: number
) {
  const seats = [];
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= columns; c++) {
      const rowLabel = String.fromCharCode(64 + r); // A, B, C…
      seats.push({
        showtimeId,
        row: r,
        column: c,
        label: `${rowLabel}${c}`,
      });
    }
  }
  await prisma.seat.createMany({ data: seats, skipDuplicates: true });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());