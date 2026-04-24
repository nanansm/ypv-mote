export async function register() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_RUNTIME === "nodejs"
  ) {
    const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
    const { db } = await import("./db/index");
    const path = await import("path");

    const migrationsFolder = path.join(process.cwd(), "drizzle/migrations");

    try {
      migrate(db, { migrationsFolder });
      console.log("[startup] Migrations applied");
    } catch (err) {
      console.error("[startup] Migration failed:", err);
    }
  }
}
