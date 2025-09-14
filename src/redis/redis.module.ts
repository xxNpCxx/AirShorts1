import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_TOKEN = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_TOKEN,
      useFactory: (): Redis | null => {
        const url = process.env.REDIS_URL;
        const isUrlMissing = url === undefined || url === null || url === '';
        if (isUrlMissing === true) return null;
        const isTls = (url as string).startsWith('rediss://') === true;
        const tls = isTls === true ? { rejectUnauthorized: false } : undefined;
        return new Redis(url as string, tls !== undefined ? { tls } : {});
      },
    },
  ],
  exports: [REDIS_TOKEN],
})
export class RedisModule {}
