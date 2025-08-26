import { Module } from "@nestjs/common";
import { Pool } from "pg";

export const PG_POOL = "PG_POOL";

@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: (): Pool => {
        const connectionString = process.env.DATABASE_URL;
        const ssl =
          process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false;
        return new Pool({
          connectionString,
          ssl: ssl as { rejectUnauthorized: false } | false,
        });
      },
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
