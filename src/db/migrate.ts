import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./index";
import path from "path";

const migrationsFolder = path.join(process.cwd(), "drizzle/migrations");

await migrate(db, { migrationsFolder });
console.log("Migrations complete");
