export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  const { db } = await import("./db/index");
  const path = await import("path");

  const migrationsFolder = path.join(process.cwd(), "drizzle/migrations");

  try {
    migrate(db, { migrationsFolder });
    console.log("[startup] Migrations applied");
  } catch (err) {
    console.error("[startup] Migration failed:", err);
    throw err;
  }

  try {
    const { seedDatabase } = await import("./db/seed");
    await seedDatabase();
    console.log("[startup] Seed complete");
  } catch (err) {
    // Non-fatal: app should still boot so admin can investigate via logs.
    console.error("[startup] Seed failed:", err);
  }

  await seedAdminUser();
}

async function seedAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) return;

  const { db } = await import("./db/index");
  const { adminUsers } = await import("./db/schema");
  const { eq } = await import("drizzle-orm");
  const bcrypt = await import("bcryptjs");
  const { v4: uuidv4 } = await import("uuid");

  const existing = db.select().from(adminUsers).where(eq(adminUsers.email, adminEmail)).get();
  if (existing) return;

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const now = new Date().toISOString();

  db.insert(adminUsers).values({
    id: uuidv4(),
    email: adminEmail,
    name: "Admin",
    passwordHash,
    role: "admin",
    mustChangePassword: 1,
    createdAt: now,
    updatedAt: now,
  }).run();

  console.log("[startup] Admin user seeded:", adminEmail);
}
