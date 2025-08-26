import { Global, Module } from "@nestjs/common";
import Redis from "ioredis";

export const REDIS_TOKEN = "REDIS_CLIENT";

@Global()
@Module({
  providers: [
    {
      provide: REDIS_TOKEN,
      useFactory: (): Redis | null => {
        const url = process.env.REDIS_URL;
        if (!url) return null;
        const tls = url.startsWith("rediss://")
          ? { rejectUnauthorized: false }
          : undefined;
        return new Redis(url, tls ? { tls } : {});
      },
    },
  ],
  exports: [REDIS_TOKEN],
})
export class RedisModule {}
